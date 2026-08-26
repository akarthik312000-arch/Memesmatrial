import { NextRequest, NextResponse } from "next/server";
import { spawn, spawnSync } from "child_process";
import { mkdirSync, readdirSync, existsSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import ffmpegPath from "ffmpeg-static";
import { existsSync as fileExists } from "fs";
import { generateAiImage } from "@/lib/ai-image";
import { workDir, fontFile, sanitizeError } from "@/lib/runtime";
import { addLibraryItem } from "@/lib/store";

export const runtime = "nodejs";

function resolveFfmpeg(): string {
  if (ffmpegPath && fileExists(ffmpegPath)) return ffmpegPath;
  const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const local = join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);
  if (fileExists(local)) return local;
  throw new Error("FFmpeg binary not found");
}
const FFMPEG = resolveFfmpeg();
const FONT_SERIF_I = fontFile("ptserif-italic.ttf");
const FONT_SCRIPT = fontFile("greatvibes.ttf");

function escDraw(t: string): string {
  return t.replace(/\\/g, "\\\\").replace(/'/g, "\u2019").replace(/:/g, "\\:");
}

function wrapText(t: string, maxChars = 20, maxLines = 4): string[] {
  const words = t.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

function runProc(cmd: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { windowsHide: true });
    let err = "";
    p.stderr?.on("data", (d) => { err += d; });
    p.on("error", reject);
    const timer = setTimeout(() => {
      if (p.pid) {
        if (process.platform === "win32") {
          spawnSync("taskkill", ["/PID", String(p.pid), "/T", "/F"], { windowsHide: true });
        } else {
          p.kill("SIGKILL");
        }
      }
      reject(new Error("timeout"));
    }, timeoutMs);
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(err.slice(-400)));
    });
  });
}

/** one fresh procedural illustration */
async function makeScene(dir: string): Promise<string> {
  mkdirSync(dir, { recursive: true });
  await runProc("python", [join(process.cwd(), "tools", "make_bgs.py"), dir, "1"], 60000);
  const files = readdirSync(dir).filter((f) => f.endsWith(".png"));
  if (!files.length) throw new Error("scene generation failed");
  return join(dir, files[0]);
}

/** delete background temp sets older than 30 minutes */
function cleanupOldSets() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  const clean = (root: string) => {
    try {
      if (!existsSync(root)) return;
      for (const entry of readdirSync(root)) {
        const ts = Number(entry.split("-").pop());
        if (Number.isFinite(ts) && ts < cutoff) rmSync(join(root, entry), { recursive: true, force: true });
      }
    } catch {
      // best effort
    }
  };
  clean(workDir("bg-cache"));
  clean(workDir("uploads"));
}

/** recent captions so repeated generations stay different (in-memory) */
const captionHistory: string[] = [];
const CAPTION_HISTORY_LIMIT = 30;

function historyBlock(): string {
  if (!captionHistory.length) return "";
  const lines = captionHistory
    .slice(-15)
    .map((c) => `- ${c}`)
    .join("\n");
  return `\n\nPreviously used captions (do NOT repeat or closely imitate any of these):\n${lines}`;
}

const STYLE_TONE: Record<string, string> = {
  Meme: "classic internet meme humor with a sharp punchline",
  "Cinematic Meme": "dramatic film-trailer energy turned into a joke",
  Reaction: "a reaction-style one-liner responding to an absurd situation",
  Story: "a tiny narrative twist compressed into one line",
  Absurd: "surreal, unexpected, chaotic humor",
  Relatable: "everyday-situation humor everyone instantly recognizes",
};

const LANGUAGE_FLAVOR: Record<string, string> = {
  English: "plain English",
  "Tamil-English": "casual Tamil-English code-mixed slang (Tanglish), Latin script",
  Hinglish: "casual Hindi-English code-mixed slang, Latin script",
};

/** AI caption + matched visual description from the topic/category/style/language via free models */
async function aiCaption(opts: {
  text: string;
  category?: string;
  style?: string;
  language?: string;
}): Promise<{ kicker: string; quote: string; visual: string } | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key === "local") return null;
  const model = process.env.OPENROUTER_MODEL || "stealth/ox-alpha";
  const models = [
    model,
    "nvidia/nemotron-3.5-lightning:free",
    "dots-studio/dots-3-note-preview:free",
  ];
  const style = opts.style && STYLE_TONE[opts.style] ? STYLE_TONE[opts.style] : STYLE_TONE.Meme;
  const language = opts.language && LANGUAGE_FLAVOR[opts.language]
    ? LANGUAGE_FLAVOR[opts.language]
    : LANGUAGE_FLAVOR.English;

  for (const m of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: m,
          messages: [{
            role: "user",
            content:
              `Create ONE original social media meme image caption.\n` +
              `Topic/idea: "${opts.text}".\n` +
              `Category: ${opts.category ?? "Random fun"}.\n` +
              `Humor style: ${style}.\n` +
              `Write the caption in ${language}.\n` +
              `The result must be a fresh take on the topic - never generic advice or motivational filler.` +
              historyBlock() + `\n\n` +
              `Also describe a matching vertical ILLUSTRATION for this exact joke scene in "visual".\n` +
              `Visual rules:\n` +
              `- Describe only CONCRETE things you can see: objects, characters, actions, setting, colors.\n` +
              `- If the topic names any object (phone, laptop, car, exam, office...), that object MUST be clearly shown as the MAIN subject of the image.\n` +
              `- Say where the subject is and what it is doing (e.g. "a cracked smartphone lying on a messy desk at night").\n` +
              `- 15-30 words. Never abstract moods or feelings alone - a painter must be able to draw it exactly.` +
              `\n\n` +
              `Return ONLY minified JSON {"kicker":"2-4 word theme","quote":"the meme caption, max 8 words","visual":"image scene description, 15-30 words"}.`,
          }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? "";
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) continue;
      const j = JSON.parse(match[0]);
      if (j.quote) {
        return {
          kicker: String(j.kicker ?? "").slice(0, 30),
          quote: String(j.quote).slice(0, 80),
          visual: String(j.visual ?? "").slice(0, 300),
        };
      }
    } catch {
      clearTimeout(timer);
      continue;
    }
  }
  return null;
}

function styleToImageHint(style?: string): string {
  switch (style) {
    case "Cinematic Meme": return "dramatic cinematic lighting, film still look";
    case "Absurd": return "surreal dreamlike composition, vivid colors";
    case "Reaction": return "expressive character close-up energy";
    default: return "clean modern illustration, meme-friendly composition, room at center for text overlay";
  }
}

/** best available background for the visual prompt; returns path + source label */
async function makeBackground(visualPrompt: string, style: string | undefined): Promise<{ path: string; source: string }> {
  const setDir = workDir("bg-cache", `bg-${Date.now()}`);
  const prompt =
    `Illustration: ${visualPrompt}. ` +
    `${styleToImageHint(style)}. ` +
    `Every object mentioned must be drawn clearly and be the main focus of the image. ` +
    `Vertical portrait composition, no text, no watermark.`;

  const ai = await generateAiImage(prompt, setDir);
  if (ai) return ai;

  try {
    const proc = await makeScene(setDir);
    return { path: proc, source: "procedural" };
  } catch {
    const gradPath = join(setDir, "gradient.png");
    await runProc(
      FFMPEG,
      ["-y", "-f", "lavfi",
       "-i", "gradients=s=1080x1920:c0=0x141432:c1=0x5a2ab8:type=linear:d=1",
       "-frames:v", "1", "-update", "1", gradPath],
      60000
    );
    return { path: gradPath, source: "gradient" };
  }
}

/** persist a user-uploaded data-URL image; returns path or null when invalid */
async function saveUploadedImage(dataUrl: string): Promise<string | null> {
  const m = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (buf.length < 1000 || buf.length > 12_000_000) return null;
  const dir = workDir("uploads");
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${m[1] === "jpeg" ? "jpg" : m[1]}`);
  writeFileSync(p, buf);
  return p;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body.text ?? body.topic ?? "").trim().slice(0, 200);
    if (!text) {
      return NextResponse.json({ status: "error", error: "text is required" }, { status: 400 });
    }
    const category = String(body.category ?? "Random fun").slice(0, 40);
    const style = String(body.style ?? "Meme").slice(0, 30);
    const language = String(body.language ?? "English").slice(0, 20);
    const layout = body.layout === "classic" ? "classic" : "center";
    const ASPECTS: Record<string, [number, number]> = {
      "1:1": [1080, 1080],
      "4:5": [1080, 1350],
      "9:16": [1080, 1920],
    };
    const aspect = ASPECTS[body.aspect] ? String(body.aspect) : "9:16";
    const [W, H] = ASPECTS[aspect];

    // god mode controls
    const fontScale = Math.min(1.6, Math.max(0.6, Number(body.fontSize) || 1));
    const showWatermark = body.watermark !== false;
    const position = ["top", "middle", "bottom"].includes(body.textPosition)
      ? String(body.textPosition)
      : "middle";
    const FONTS: Record<string, string> = {
      bebas: "bebas.ttf",
      anton: "anton.ttf",
      ptserif: "ptserif-bold.ttf",
      cormorant: "cormorant-bold.ttf",
    };
    const displayFont = fontFile(FONTS[body.font] ?? FONTS.bebas);

    // user-provided image: use it as the background exactly as-is
    const uploaded =
      typeof body.image === "string" && body.image.startsWith("data:image/")
        ? await saveUploadedImage(body.image)
        : null;

    // exact mode (explicit flag or an uploaded image): content is used verbatim,
    // no AI rewriting and no caption dedup
    const exact = body.exact === true || uploaded !== null;

    // typography content: AI-polished or raw, deduped against recent captions
    let kicker = "";
    let quote = text;
    let visual = "";
    let duplicate = false;
    if (!exact && body.ai !== false) {
      const normalize = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean).slice(0, 5).join(" ");
      for (let attempt = 0; attempt < 2; attempt++) {
        const ai = await aiCaption({ text, category, style, language });
        if (!ai) break;
        kicker = ai.kicker;
        quote = ai.quote;
        visual = ai.visual || visual;
        if (!captionHistory.some((c) => normalize(c) === normalize(quote))) break;
        duplicate = true;
      }
    }
    if (duplicate && captionHistory.some((c) => c === quote)) {
      quote = `${quote} vol.${captionHistory.length}`;
    }
    captionHistory.push(quote);
    while (captionHistory.length > CAPTION_HISTORY_LIMIT) captionHistory.shift();

    // background: uploaded image wins, otherwise AI image matched to the prompt
    cleanupOldSets();
    const bg = uploaded
      ? { path: uploaded, source: "upload" }
      : await makeBackground(visual || `a scene showing the objects and situation from: "${text}" (${category} theme)`, style);

    // compose 1080x1920 image
    const outId = `meme-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const outPath = workDir("generated", `${outId}.jpg`);
    mkdirSync(workDir("generated"), { recursive: true });
    const phase = Math.random() * Math.PI;

    let chain =
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
    const watermark = showWatermark
      ? `,drawtext=fontfile='${FONT_SCRIPT}':text='MemesMaterial'` +
        `:fontcolor=white@0.9:shadowx=2:shadowy=2:shadowcolor=black@0.5:fontsize=${Math.round(58 * fontScale)}:x=52:y=${H - 130}`
      : "";
    const posTop = Math.round(H * (position === "top" ? 0.08 : position === "bottom" ? 0.66 : 0.33));
    const quoteSize = Math.round(124 * fontScale);
    const quoteLine = Math.round(145 * fontScale);

    if (layout === "classic") {
      // classic meme layout: uppercase text pinned to top and bottom with thick border
      const lines = wrapText(quote.toUpperCase(), Math.round(16 / fontScale), 6);
      const split = Math.ceil(lines.length / 2);
      const top = lines.slice(0, split);
      const bottom = lines.slice(split);
      const clsSize = Math.round(118 * fontScale);
      const clsLine = Math.round(140 * fontScale);
      top.forEach((line, li) => {
        chain +=
          `,drawtext=fontfile='${displayFont}':text='${escDraw(line)}'` +
          `:fontcolor=white:borderw=7:bordercolor=black` +
          `:fontsize=${clsSize}:x=(w-text_w)/2:y='${Math.round(H * 0.04) + li * clsLine}'`;
      });
      if (bottom.length) {
        const startY = Math.round(H * 0.95) - bottom.length * clsLine;
        bottom.forEach((line, li) => {
          chain +=
          `,drawtext=fontfile='${displayFont}':text='${escDraw(line)}'` +
            `:fontcolor=white:borderw=7:bordercolor=black` +
            `:fontsize=${clsSize}:x=(w-text_w)/2:y='${startY + li * clsLine}'`;
        });
      }
      chain += watermark;
    } else {
      // centered poster layout with god-mode position control
      if (kicker) {
        const kickerY = Math.max(Math.round(H * 0.03), posTop - Math.round(70 * fontScale));
        chain +=
          `,drawtext=fontfile='${FONT_SERIF_I}':text='${escDraw(kicker.toUpperCase().split("").join(" "))}'` +
          `:fontcolor=white@0.92:shadowx=2:shadowy=2:shadowcolor=black@0.5:fontsize=${Math.round(36 * fontScale)}` +
          `:x='(w-text_w)/2':y='${kickerY}'`;
      }
      wrapText(quote, Math.round(20 / fontScale), 4).forEach((line, li) => {
        chain +=
          `,drawtext=fontfile='${displayFont}':text='${escDraw(line)}'` +
          `:fontcolor=white:shadowx=3:shadowy=3:shadowcolor=black@0.45:fontsize=${quoteSize}` +
          `:x='(w-text_w)/2':y='${posTop + li * quoteLine}+${phase.toFixed(2)}*0'`;
      });
      chain += watermark;
    }
    chain += `,noise=alls=5:allf=t,vignette=PI/4.5[v]`;

    await runProc(
      FFMPEG,
      ["-y", "-i", bg.path, "-filter_complex", chain, "-map", "[v]",
       "-frames:v", "1", "-q:v", "2", outPath],
      90000
    );

    const payload = {
      status: "ready" as const,
      url: `/api/output/${outId}.jpg`,
      quote,
      kicker,
      category,
      style,
      language,
      layout,
      aspect,
      width: W,
      height: H,
      fontSize: fontScale,
      textPosition: position,
      watermark: showWatermark,
      font: body.font ?? "bebas",
      backgroundSource: bg.source,
      createdAt: new Date().toISOString(),
    };
    addLibraryItem({
      id: outId,
      kind: "image",
      url: `/api/output/${outId}.jpg`,
      title: quote,
      topic: text,
      category,
      style,
      backgroundSource: bg.source,
      aiSource: bg.source === "upload" ? "upload" : "ai",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        error: e instanceof Error ? sanitizeError(e.message) : "generation failed",
        hint: "Check /api/health for provider status, or retry — image providers fall back automatically.",
      },
      { status: 500 }
    );
  }
}
