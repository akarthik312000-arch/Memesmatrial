import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

/** AI image via OpenRouter image-capable chat model (returns base64 data URL) */
async function openRouterImage(prompt: string, dir: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key === "local") return null;
  const models = [
    process.env.OPENROUTER_IMAGE_MODEL,
    "google/gemini-3.1-flash-image",
    "google/gemini-2.5-flash-image",
    "openai/gpt-5-image-mini",
  ].filter(Boolean) as string[];

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          modalities: ["image", "text"],
          messages: [{ role: "user", content: `Generate this image exactly as described: ${prompt}` }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      const images = data?.choices?.[0]?.message?.images;
      if (!Array.isArray(images) || !images.length) continue;
      const url: string = images[0]?.image_url?.url ?? "";
      const m = url.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (!m) continue;
      const outPath = join(dir, `ai-or-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${m[1] === "jpeg" ? "jpg" : m[1]}`);
      writeFileSync(outPath, Buffer.from(m[2], "base64"));
      return outPath;
    } catch {
      clearTimeout(timer);
      continue;
    }
  }
  return null;
}

/** AI image via generic OpenAI-compatible /images/generations endpoint */
async function imageGenProviderImage(prompt: string, dir: string): Promise<string | null> {
  const key = process.env.IMAGE_GEN_KEY;
  if (!key || key.startsWith("your_")) return null;
  const base = process.env.IMAGE_GEN_BASE_URL;
  if (!base) return null;
  const model = process.env.IMAGE_GEN_MODEL || "gemini-2.5-flash-image";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/images/generations`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, n: 1, size: "1024x1792", response_format: "b64_json" }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const b64: string | undefined = data?.data?.[0]?.b64_json;
    if (!b64) return null;
    const outPath = join(dir, `ai-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`);
    writeFileSync(outPath, Buffer.from(b64, "base64"));
    return outPath;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/** keyless free fallback: Pollinations.ai text-to-image */
async function pollinationsImage(prompt: string, dir: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    // keep it short and subject-first - long prompts dilute adherence
    const short = prompt.split(".").slice(0, 2).join(",").slice(0, 220);
    const seed = Math.floor(Math.random() * 1e9);
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(short)}` +
      `?width=1080&height=1920&nologo=true&model=flux&seed=${seed}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) return null;
    const outPath = join(dir, `ai-poll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`);
    writeFileSync(outPath, buf);
    return outPath;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/** best available AI image for the prompt; null when every provider fails */
export async function generateAiImage(
  prompt: string,
  dir: string
): Promise<{ path: string; source: string } | null> {
  mkdirSync(dir, { recursive: true });
  const or = await openRouterImage(prompt, dir);
  if (or) return { path: or, source: "openrouter" };
  const gen = await imageGenProviderImage(prompt, dir);
  if (gen) return { path: gen, source: "image-provider" };
  const pol = await pollinationsImage(prompt, dir);
  if (pol) return { path: pol, source: "pollinations" };
  return null;
}
