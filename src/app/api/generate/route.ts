import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import {
  mkdirSync,
  writeFileSync,
  existsSync,
  rmSync,
  statSync,
  renameSync,
  copyFileSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { readdirSync } from "fs";
import ffmpegPath from "ffmpeg-static";
import { existsSync as fileExists } from "fs";
import type { VideoCreationForm, Scene } from "@/lib/types";
import { generateAiImage } from "@/lib/ai-image";

export const runtime = "nodejs";
export const maxDuration = 600;

const FONT = "C\\:/Windows/Fonts/impact.ttf";
const FONT_AR = "C\\:/Windows/Fonts/arialbd.ttf";
// aesthetic mood-reel fonts (downloaded, OFL licensed)
const FONT_DISPLAY = "D\\:/job/memesmaterial-studio/assets/fonts/bebas.ttf";
const FONT_SERIF_I = "D\\:/job/memesmaterial-studio/assets/fonts/ptserif-italic.ttf";
const FONT_SCRIPT = "D\\:/job/memesmaterial-studio/assets/fonts/greatvibes.ttf";
const SCENE_SEC = 6; // snappier meme pacing
const TOTAL_SEC = 25; // output is always exactly 25s; per-scene = 25 / scene count
// animated gradient color pairs [from, to] per scene
const GRAD = [
  ["0x141432", "0x5a2ab8"],
  ["0x321414", "0xd84a4a"],
  ["0x14321f", "0x2ad86a"],
  ["0x33240e", "0xe8a41e"],
  ["0x1d1436", "0xb44ae0"],
];
const SRC_FPS = 6; // animated source fps, duplicated to 30 on output

function resolveFfmpeg(): string {
  if (ffmpegPath && fileExists(ffmpegPath)) return ffmpegPath;
  const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const local = join(process.cwd(), "node_modules", "ffmpeg-static", binaryName);
  if (fileExists(local)) return local;
  throw new Error("FFmpeg binary not found");
}
const FFMPEG: string = resolveFfmpeg();

type Concept = {
  hook: string;
  situation: string;
  punchline: string;
  style: string;
  character?: string;
  source?: string;
  scenes?: Array<{ text: string; voice: string; visual?: string }>;
};

/* ---------------- AI concept generation (OpenRouter models) ---------------- */

const OPENROUTER_MODELS = [
  process.env.OPENROUTER_MODEL || "stealth/ox-alpha",
  "nvidia/nemotron-3.5-lightning:free",
  "z-ai/glm-5.2:free",
  "google/gemma-4-31b-it:free",
  "dots-studio/dots-3-note-preview:free",
];

type AiProvider = {
  name: string;
  key: string;
  baseUrl: string;
  models: string[];
};

function configuredProviders(): AiProvider[] {
  const providers: AiProvider[] = [];
  const omniRouteKey = process.env.OMNIROUTE_API_KEY;
  const omniRouteModel = process.env.OMNIROUTE_MODEL;
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (omniRouteKey && omniRouteModel) {
    providers.push({
      name: "omniroute",
      key: omniRouteKey,
      baseUrl: process.env.OMNIROUTE_BASE_URL || "http://localhost:20128/v1",
      models: [omniRouteModel],
    });
  }

  if (nvidiaKey) {
    providers.push({
      name: "nvidia",
      key: nvidiaKey,
      baseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
      models: [process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct"],
    });
  }

  if (openRouterKey) {
    providers.push({
      name: "openrouter",
      key: openRouterKey,
      baseUrl: "https://openrouter.ai/api/v1",
      models: OPENROUTER_MODELS,
    });
  }

  return providers;
}

/* ---------------- token usage tracking + auto-compaction ---------------- */

const TOKEN_COMPACT_THRESHOLD = 50_000;

let preferredModel: string | null = null;

const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
let compacted = false;
let compactionCount = 0;

function recordUsage(u?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): void {
  if (!u) return;
  usage.promptTokens += u.prompt_tokens ?? 0;
  usage.completionTokens += u.completion_tokens ?? 0;
  usage.totalTokens += u.total_tokens ?? 0;
}

/**
 * Auto-compaction: once cumulative token usage crosses the threshold,
 * the dedup context is condensed (full hooks -> short keyword summaries)
 * so subsequent AI prompts consume far fewer tokens.
 */
function aiContextBlock(): string {
  // trigger compaction automatically at the threshold
  if (!compacted && usage.totalTokens >= TOKEN_COMPACT_THRESHOLD && history.length > 5) {
    const compactedHistory = history.map((h) =>
      h.split(/\s+/).slice(0, 4).join(" ").toLowerCase()
    );
    history.length = 0;
    history.push(...Array.from(new Set(compactedHistory)));
    compacted = true;
    compactionCount++;
    console.log(
      `[MM] ${TOKEN_COMPACT_THRESHOLD / 1000}k token budget reached â€” ` +
        `context auto-compacted (#${compactionCount}), entries: ${history.length}`
    );
  }

  if (history.length === 0) return "No previous videos yet.";
  const recent = history.slice(-15).join(" | ");
  return (
    (compacted ? "[COMPACTED history - topics only] " : "") +
    `Already used concepts (do NOT repeat): ${recent}`
  );
}

function aiPrompt(form: VideoCreationForm): string {
  return (
    `You write viral YouTube meme scripts for a channel called MemesMaterial. ` +
    `Topic: "${form.topic}". Category: ${form.category}. Style: ${form.style}. ` +
    `Language flavor: ${form.language} (use light flavor words if Hinglish/Tamil-English). ` +
    `Create an original, funny, relatable meme concept based ONLY on the topic above. ` +
    `${aiContextBlock()} ` +
    `Rules: hook/situation/punchline under 90 chars each. ` +
    `First, invent ONE fixed main character for the whole video and describe them in "character" ` +
    `(e.g. "a tired young man with messy black hair wearing a bright orange t-shirt"). The SAME character appears in every scene.` +
    `Exactly 10 fast-paced scenes. Each scene "text" is the on-screen meme text (max 30 chars, no quotes). ` +
    `Each scene "voice" is the narration line (max 12 words). Build one continuous story arc across the 10 scenes. ` +
    `Each scene "visual" describes what ILLUSTRATION to draw for that scene (15-25 words): only concrete things you can see - objects, characters, actions, places. ` +
    `Always mention the main character's look from "character" in each visual so they stay consistent. ` +
    `Any object named in the topic or scene text (phone, laptop, car...) MUST appear clearly as the main subject. Never abstract moods alone.` +
    `Return ONLY minified JSON: ` +
    `{"character":"...","hook":"...","situation":"...","punchline":"...","scenes":[{"text":"...","voice":"...","visual":"..."} x10]}`
  );
}

async function aiConcept(form: VideoCreationForm): Promise<Concept | null> {
  for (const provider of configuredProviders()) {
    // Sticky model: retry the last successful model before other models.
    const ordered = preferredModel && provider.models.includes(preferredModel)
      ? [preferredModel, ...provider.models.filter((m) => m !== preferredModel)]
      : provider.models;

    for (const model of ordered) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${provider.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: aiPrompt(form) }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) continue;
        const data = await res.json();
        recordUsage(data?.usage);
        const content: string = data?.choices?.[0]?.message?.content ?? "";
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) continue;
        const j = JSON.parse(m[0]);
        if (j.hook && j.situation && j.punchline) {
        const scenes = Array.isArray(j.scenes)
          ? j.scenes
              .filter((s: unknown) => s && typeof (s as { text?: string }).text === "string")
              .slice(0, 10)
              .map((s: { text: string; voice?: string; visual?: string }) => ({
                  text: String(s.text).slice(0, 60),
                  voice: String(s.voice ?? s.text).slice(0, 160),
                  visual: String(s.visual ?? "").slice(0, 300),
                }))
          : undefined;
        preferredModel = model;
        return {
          hook: String(j.hook).slice(0, 120),
          situation: String(j.situation).slice(0, 120),
          punchline: String(j.punchline).slice(0, 120),
          character: j.character ? String(j.character).slice(0, 160) : undefined,
          style: form.style,
          source: `${provider.name}/${model}`,
          scenes: scenes && scenes.length >= 5 ? scenes : undefined,
        };
        }
      } catch {
        clearTimeout(timer);
      }
    }
  }
  return null;
}

/* ---------------- process helper ---------------- */

function runProc(cmd: string, args: string[], timeoutMs = 180000): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { windowsHide: true });
    let err = "";
    const timer = setTimeout(() => {
      p.kill();
      reject(new Error(`process timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    p.stderr.on("data", (d: Buffer) => {
      if (err.length < 4000) err += d.toString();
    });
    p.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(err.slice(-400) || `exit code ${code}`));
    });
  });
}

/* ---------------- content generation ---------------- */

function buildConcept(form: VideoCreationForm): Concept {
  const t = form.topic.trim();
  const flavor =
    form.language === "Hinglish"
      ? "yaar"
      : form.language === "Tamil-English"
      ? "machan"
      : "literally";
  return {
    hook: `POV: ${t} ${flavor} hits different`,
    situation: `And then ${t} escalates... nobody warned you`,
    punchline: `Moral of the story: never trust ${t} again`,
    style: form.style,
  };
}

function buildScenes(c: Concept): Array<Scene & { _sub?: string }> {
  const character = c.character || "a young man with messy black hair wearing a bright orange t-shirt";
  const mains = [
    `POV: ${c.hook}`,
    "Wait for it...",
    c.situation,
    "It gets worse...",
    "No way...",
    "It STILL gets worse",
    "How?!",
    "Last hope gone",
    c.punchline,
    "Follow for more",
  ];
  const subs = [
    "it starts innocently",
    "here it comes",
    "total chaos mode",
    "why is this my life",
    "no no no",
    "still going",
    "unbelievable",
    "nothing left",
    "every single time",
    "memesmaterial",
  ];
  const narr = [
    `So it begins. ${c.hook}.`,
    `Just wait. It is about to get so much worse.`,
    `${c.situation}.`,
    `And yes, somehow, it gets even worse than that.`,
    `There is no way this ends well.`,
    `Still falling apart. Spectacularly.`,
    `Nobody can explain what is happening anymore.`,
    `The last hope is officially gone.`,
    `${c.punchline}. Every single time.`,
    `Follow for more daily memes.`,
  ];
  const visuals = [
    `${character} at the start of the story, main objects of the topic clearly visible`,
    `${character} looking suspicious as things begin to go wrong`,
    `${character} in the middle of the chaos: ${c.situation}`,
    `${character} reacting while the situation visibly deteriorates`,
    `${character} shocked face close-up, disaster unfolding behind them`,
    `${character} surrounded by the aftermath of the mess`,
    `${character} desperately trying to fix things, failing`,
    `${character} defeated posture, everything ruined around them`,
    `${c.punchline} - ${character} with the final punchline expression, main subject front and center`,
    `${character} waving at the camera, channel logo mood, upbeat ending`,
  ];
  const sfx = [
    ["whoosh", "laugh"],
    ["record scratch"],
    ["bubbles", "gasping"],
    ["thunder"],
    ["dramatic sting"],
    ["womp womp"],
    ["glitch"],
    ["sad trombone"],
    ["door slam", "cheering"],
    ["outro jingle"],
  ];
  return mains.map((m, i) => ({
    id: `scene-${i}`,
    duration: SCENE_SEC,
    visualPrompt: m,
    voiceOver: narr[i],
    subtitles: narr[i],
    sfx: sfx[i],
    musicTransition: i > 0,
    _sub: subs[i],
    _visual: visuals[i],
  }));
}

/**
 * AI-generated background per scene (matched to each scene's script content),
 * generated in parallel. Falls back to the procedural generator for any
 * scene whose AI image fails.
 */
async function generateAiSceneSet(
  dir: string,
  scenes: Array<Scene & { _visual?: string }>,
  form: VideoCreationForm,
  character?: string
): Promise<{ paths: string[]; source: string }> {
  mkdirSync(dir, { recursive: true });
  const hint =
    form.style === "Cinematic Meme"
      ? "dramatic cinematic lighting"
      : form.style === "Absurd"
      ? "surreal vivid composition"
      : "clean modern illustration";
  const characterLine = character
    ? `Main character - draw them IDENTICALLY in every scene: ${character}. `
    : "";

  const results = await Promise.allSettled(
    scenes.map((sc) =>
      generateAiImage(
        `Illustration for a meme video scene. ${characterLine}` +
          `Scene content: ${sc._visual || sc.voiceOver || sc.visualPrompt}. ` +
          `Topic context: "${form.topic}" (${form.category}). ${hint}. ` +
          `Every object mentioned must be drawn clearly and be the main focus. ` +
          `Vertical portrait composition, no text, no watermark.`,
        join(dir, `ai-${sc.id}`)
      )
    )
  );

  const prompts = scenes.map(
    (sc) =>
      `Illustration for a meme video scene. ${characterLine}` +
      `Scene content: ${sc._visual || sc.voiceOver || sc.visualPrompt}. ` +
      `Topic context: "${form.topic}" (${form.category}). ${hint}. ` +
      `Every object mentioned must be drawn clearly and be the main focus. ` +
      `Vertical portrait composition, no text, no watermark.`
  );
  const paths = results.map((r) => (r.status === "fulfilled" ? r.value?.path ?? null : null));

  // sequential retry for failed scenes (parallel bursts often hit rate limits)
  for (let i = 0; i < paths.length; i++) {
    if (paths[i]) continue;
    const retry = await generateAiImage(prompts[i], join(dir, `ai-${scenes[i].id}-retry`));
    if (retry) paths[i] = retry.path;
  }

  const aiCount = paths.filter(Boolean).length;
  if (aiCount === scenes.length) {
    return { paths: paths as string[], source: "openrouter" };
  }

  // fill gaps with fresh procedural illustrations
  console.log(`[MM] AI scene images: ${aiCount}/${scenes.length}, filling with procedural`);
  const procDir = join(dir, "procedural");
  const proc = await generateSceneSet(procDir, scenes.length);
  return {
    paths: paths.map((p, i) => p ?? proc[i % proc.length]),
    source: aiCount > 0 ? "hybrid" : "procedural",
  };
}

/* ---------------- pipeline ---------------- */

function escDraw(t: string): string {
  return t.replace(/\\/g, "\\\\").replace(/'/g, "\u2019").replace(/:/g, "\\:");
}

async function tts(text: string, outWav: string): Promise<void> {
  const safe = text.replace(/'/g, "''");
  const ps =
    "Add-Type -AssemblyName System.Speech; " +
    "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; " +
    "$s.Rate = 2; $s.SetOutputToWaveFile('" +
    outWav.replace(/\\/g, "\\\\") + "'); " +
    "$s.Speak('" + safe + "'); $s.Dispose()";
  await runProc("powershell.exe", ["-NoProfile", "-Command", ps], 30000);
  if (!existsSync(outWav)) throw new Error("TTS failed");
}

/**
 * Renders ALL scenes in ONE ffmpeg pass:
 * - cached gradient background images, panned slowly (moving camera feel)
 * - floating/bouncing meme text
 * - concat via filter, narration muxed in
 */
/**
 * Generates a FRESH set of procedural illustration backgrounds per video
 * (unlimited distinct scenes via tools/make_bgs.py). Falls back to cached
 * gradients if Python is unavailable.
 */
async function generateSceneSet(dir: string, count: number): Promise<string[]> {
  mkdirSync(dir, { recursive: true });
  try {
    await runProc(
      "python",
      [join(process.cwd(), "tools", "make_bgs.py"), dir, String(count)],
      90000
    );
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".png"))
      .sort()
      .map((f) => join(dir, f));
    if (files.length >= Math.min(3, count)) return files;
  } catch {
    console.log("[MM] scene generator failed, falling back to gradients");
  }
  // gradient fallback
  const paths: string[] = [];
  for (let i = 0; i < count; i++) {
    const p = join(dir, `grad_${i}.png`);
    if (!existsSync(p)) {
      await runProc(
        FFMPEG,
        ["-y", "-f", "lavfi",
         "-i", `gradients=s=1188x2112:c0=${GRAD[i % GRAD.length][0]}:c1=${GRAD[i % GRAD.length][1]}:type=linear:d=1`,
         "-frames:v", "1", "-update", "1", p],
        60000
      );
    }
    paths.push(p);
  }
  return paths;
}

/** delete scene-set dirs older than 30 minutes */
function cleanupSceneSets(root: string): void {
  try {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const d of readdirSync(root)) {
      if (!d.startsWith("set-")) continue;
      const full = join(root, d);
      try {
        if (statSync(full).mtimeMs < cutoff) rmSync(full, { recursive: true, force: true });
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

/** wrap text into short lines that fit the 1080px-wide Shorts frame */
function wrapText(t: string, maxChars = 18, maxLines = 3): string[] {
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

async function renderVideo(
  dir: string,
  scenes: Array<Scene & { _sub?: string; _visual?: string }>,
  form: VideoCreationForm,
  character: string | undefined,
  finalPath: string
): Promise<{ bgSource: string }> {
  const wav = join(dir, "narration.wav");
  await tts(
    scenes.map((s) => s.voiceOver).join(" ... "),
    wav
  );
  // per-scene AI illustrations matched to the script; procedural fallback
  const bgRoot = join(process.cwd(), "public", "bg-cache");
  cleanupSceneSets(bgRoot);
  const setDir = join(bgRoot, `set-${Date.now()}`);
  const { paths: bgs, source: bgSource } = await generateAiSceneSet(setDir, scenes, form, character);

  // per-scene duration adapts to scene count so total is always exactly 25s
  const secPerScene = TOTAL_SEC / scenes.length;
  scenes.forEach((s) => { s.duration = secPerScene; });
  const total = TOTAL_SEC;

  const chains: string[] = [];
  scenes.forEach((sc, i) => {
    const sub = escDraw(sc._sub ?? "");
    const phase = (i * Math.PI) / 2.5;
    // normalize any input size onto an oversized canvas so the drift-crop is valid
    let chain =
      `[${i}:v]` +
      `scale=1188:2112:force_original_aspect_ratio=increase,crop=1188:2112` +
      `,crop=w=1080:h=1920` +
      `:x='(in_w-out_w)/2'` +
      `:y='(in_h-out_h)/2+(in_h-out_h)/2*sin(t/5+${phase.toFixed(2)})'`;
    // spaced uppercase kicker above the quote (mood-reel style)
    if (sub && sub !== "memesmaterial") {
      const spaced = escDraw(String(sc._sub ?? "").toUpperCase().split("").join(" "));
      chain +=
        `,drawtext=fontfile='${FONT_SERIF_I}':text='${spaced}'` +
        `:fontcolor=white@0.92:borderw=0:shadowx=2:shadowy=2:shadowcolor=black@0.5:fontsize=34` +
        `:x='(w-text_w)/2'` +
        `:y='430+8*sin(1.6*t+${phase.toFixed(2)})'`;
    }
    // main quote in condensed display font, upper third, gentle float
    wrapText(sc.visualPrompt, 20, 3).forEach((line, li) => {
      chain +=
        `,drawtext=fontfile='${FONT_DISPLAY}':text='${escDraw(line)}'` +
        `:fontcolor=white:borderw=0:shadowx=3:shadowy=3:shadowcolor=black@0.45:fontsize=118` +
        `:x='(w-text_w)/2'` +
        `:y='500+${li * 138}+14*sin(1.4*t+${phase.toFixed(2)})'`;
    });
    // script-font channel mark bottom left
    chain +=
      `,drawtext=fontfile='${FONT_SCRIPT}':text='MemesMaterial'` +
      `:fontcolor=white@0.9:shadowx=2:shadowy=2:shadowcolor=black@0.5:fontsize=54:x=48:y=1810`;
    // film grain + vignette for the cinematic poster feel
    chain += `,noise=alls=5:allf=t,vignette=PI/4.5[v${i}]`;
    chains.push(chain);
  });

  const filterComplex =
    chains.join(";") +
    ";" +
    scenes.map((_, i) => `[v${i}]`).join("") +
    `concat=n=${scenes.length}:v=1:a=0[vout]`;

  const args: string[] = ["-y"];
  bgs.forEach((p) => {
    args.push("-loop", "1", "-framerate", String(SRC_FPS), "-t", String(SCENE_SEC), "-i", p);
  });
  args.push("-i", wav);

  args.push(
    "-filter_complex", filterComplex,
    "-map", "[vout]",
    "-map", `${scenes.length}:a`,
    "-af", `atrim=0:${total},apad=whole_dur=${total}`,
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-r", "30",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-ar", "44100",
    "-t", String(total),
    finalPath
  );

  await runProc(FFMPEG, args, 180000);
  return { bgSource };
}

function validate(p: string): { valid: boolean; error?: string } {
  try {
    const st = statSync(p);
    return st.size > 10000 ? { valid: true } : { valid: false, error: "Video too small" };
  } catch {
    return { valid: false, error: "Video file not found" };
  }
}

function youtubeData(form: VideoCreationForm, c: Concept) {
  const tag = form.topic.toLowerCase().replace(/\s+/g, "");
  return {
    title: `${form.style} Meme: ${form.topic}`,
    description:
      `A relatable ${form.style.toLowerCase()} meme about ${form.topic}. ` +
      `${c.punchline}\n\nSubscribe to MemesMaterial for daily memes!`,
    hashtags: [`#${tag}`, "#memes", "#fyp", "#viral", "#comedy"],
    thumbnailText: `${form.style.toUpperCase()}: ${form.topic}`.slice(0, 30),
    pinnedComment: "Which one are you? Comment below ðŸ‘‡",
    keywords: [form.topic, form.category, form.style, "meme", "comedy"].join(", "),
  };
}

/* ---------------- unlimited dedup history ---------------- */

const history: string[] = [];

function uniquifyHook(hook: string): string {
  if (!history.includes(hook)) return hook;
  let n = 2;
  while (history.includes(`${hook} vol.${n}`)) n++;
  return `${hook} vol.${n}`;
}
function remember(hook: string): void {
  history.push(hook);
}

function renameSafe(from: string, to: string): void {
  try {
    renameSync(from, to);
  } catch {
    copyFileSync(from, to);
    unlinkSync(from);
  }
}

/* ---------------- route handler ---------------- */

export async function POST(req: NextRequest) {
  let form: VideoCreationForm;
  try {
    form = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!form?.topic || !form?.category || !form?.language || !form?.style) {
    return NextResponse.json(
      { error: "Missing required fields: topic, category, language, style" },
      { status: 400 }
    );
  }

  const tmpDir = join(process.cwd(), "generated-videos", `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

  try {
    // AI-generated concept via OpenRouter free models; falls back to templates
    const concept = (await aiConcept(form)) ?? buildConcept(form);
    concept.hook = uniquifyHook(concept.hook);    remember(concept.hook);
    // prompt-driven: use AI's scene-by-scene script when available
    const aiScenes = concept.scenes?.map((s, i) => ({
      id: `scene-${i}`,
      duration: SCENE_SEC,
      visualPrompt: s.text,
      voiceOver: s.voice,
      subtitles: s.voice,
      sfx: [] as string[],
      musicTransition: i > 0,
      _sub: i === 4 ? "follow for more" : "memesmaterial",
      _visual: s.visual ?? "",
    }));
    const scenes = aiScenes && aiScenes.length >= 3 ? aiScenes : buildScenes(concept);

    const id = crypto.randomUUID().slice(0, 8);
    const outDir = join(process.cwd(), "public", "generated");
    mkdirSync(outDir, { recursive: true });
    mkdirSync(tmpDir, { recursive: true });

    const finalName = `video-${id}.mp4`;
    const tmpFinal = join(tmpDir, "final.mp4");
    const { bgSource } = await renderVideo(tmpDir, scenes, form, concept.character, tmpFinal);

    const validation = validate(tmpFinal);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 500 });
    }

    const publicPath = join(outDir, finalName);
    rmSync(publicPath, { force: true });
    renameSafe(tmpFinal, publicPath);
    rmSync(tmpDir, { recursive: true, force: true });

    const video: Record<string, unknown> = {
      id,
      topic: form.topic,
      category: form.category,
      language: form.language,
      style: form.style,
      title: `${form.style} Meme: ${form.topic}`,
      scenes,
      mp4Path: publicPath,
      url: `/generated/${finalName}`,
      duration: TOTAL_SEC,
      status: "ready",
      createdAt: new Date().toISOString(),
      youtube: youtubeData(form, concept),
      aiSource: concept.source ?? "template",
      backgroundSource: bgSource,
      tokensUsed: usage.totalTokens,
      contextCompacted: compacted,
    };
    return NextResponse.json(video);
  } catch (e) {
    rmSync(tmpDir, { recursive: true, force: true });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed", retry: true },
      { status: 500 }
    );
  }
}
