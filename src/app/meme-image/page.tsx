"use client";

import { useState } from "react";

const CATEGORIES = [
  "Everyday Life",
  "Lifestyle",
  "Technology",
  "AI",
  "Work/Office",
  "College",
  "Friendship",
  "Family",
  "Relationships",
  "Gaming",
  "Movies/pop culture",
  "Internet/social media",
  "Indian/South Indian culture",
  "Travel",
  "Vehicles",
  "Random fun",
  "Thoughts",
  "Opinions",
  "Ideas",
  "Trends",
];

const LANGUAGES = ["English", "Tamil-English", "Hinglish"];
const STYLES = ["Meme", "Cinematic Meme", "Reaction", "Story", "Absurd", "Relatable"];

type MemeResult = {
  status: "ready" | "error";
  url?: string;
  quote?: string;
  kicker?: string;
  category?: string;
  style?: string;
  language?: string;
  layout?: "center" | "classic";
  aspect?: string;
  backgroundSource?: string;
  error?: string;
};

export default function MemeImagePage() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState(CATEGORIES[15]);
  const [style, setStyle] = useState(STYLES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [useAi, setUseAi] = useState(true);
  const [layout, setLayout] = useState<"center" | "classic">("center");
  const [aspect, setAspect] = useState("9:16");
  const [godMode, setGodMode] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [textPosition, setTextPosition] = useState<"top" | "middle" | "bottom">("middle");
  const [watermark, setWatermark] = useState(true);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MemeResult | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setResult({ status: "error", error: "Only PNG, JPG or WebP images are supported" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setResult({ status: "error", error: "Image is too large (max 8 MB)" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(typeof reader.result === "string" ? reader.result : null);
      setImageName(file.name);
      setUseAi(false);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageData(null);
    setImageName("");
  }

  async function generate() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/meme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          category,
          style,
          language,
          layout,
          aspect,
          ai: useAi && !imageData,
          image: imageData ?? undefined,
          exact: imageData !== null,
          ...(godMode ? { fontSize, textPosition, watermark } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "error") {
        setResult({ status: "error", error: data.error ?? `Request failed (${res.status})` });
      } else {
        setResult(data as MemeResult);
      }
    } catch {
      setResult({ status: "error", error: "Could not reach the meme generator" });
    } finally {
      setBusy(false);
    }
  }

  const selectCls =
    "w-full rounded-lg border border-white/10 bg-[#14111d] p-3 text-sm text-white outline-none transition focus:border-[#ff625e]";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Meme Image</h1>
      <p className="text-gray-400 mb-6">
        Turn any topic into a ready-to-post 1080×1920 meme image — or upload your
        own image and your content is used verbatim on it.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="rounded-xl border border-white/10 bg-gray-800 p-6">
            <label htmlFor="meme-text" className="mb-2 block text-sm font-bold uppercase tracking-wider text-gray-300">
              Topic or idea
            </label>
            <textarea
              id="meme-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='e.g. "Monday motivation is a scam"'
              rows={4}
              maxLength={200}
              className={selectCls}
            />

            {imageData ? (
              <div className="mt-4 flex items-center gap-4 rounded-lg border border-[#ff625e]/40 bg-[#ff625e]/10 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageData} alt="Your upload" className="h-16 w-16 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{imageName}</p>
                  <p className="text-xs text-gray-400">Used as the meme background exactly as-is</p>
                </div>
                <button
                  onClick={clearImage}
                  className="rounded border border-white/20 px-3 py-1 text-xs uppercase tracking-wider text-gray-300 hover:border-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 p-4 text-sm text-gray-300 transition hover:border-[#ff625e] hover:text-white">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
                + Upload your own image (optional)
              </label>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="meme-category" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Category
                </label>
                <select id="meme-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="meme-language" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Language
                </label>
                <select id="meme-language" value={language} onChange={(e) => setLanguage(e.target.value)} className={selectCls}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="meme-style" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Style
                </label>
                <select id="meme-style" value={style} onChange={(e) => setStyle(e.target.value)} className={selectCls}>
                  {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="meme-layout" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300">
                Text layout
              </label>
              <select
                id="meme-layout"
                value={layout}
                onChange={(e) => setLayout(e.target.value as "center" | "classic")}
                className={selectCls}
              >
                <option value="center">Centered poster (floating quote)</option>
                <option value="classic">Classic meme (top &amp; bottom text)</option>
              </select>
            </div>

            <div className="mt-4">
              <label htmlFor="meme-aspect" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300">
                Aspect ratio
              </label>
              <select id="meme-aspect" value={aspect} onChange={(e) => setAspect(e.target.value)} className={selectCls}>
                <option value="9:16">9:16 — Story / Shorts (1080×1920)</option>
                <option value="4:5">4:5 — Feed post (1080×1350)</option>
                <option value="1:1">1:1 — Square (1080×1080)</option>
              </select>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-bold text-amber-300">
              <input
                type="checkbox"
                checked={godMode}
                onChange={(e) => setGodMode(e.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
              ⚡ GOD MODE — advanced text controls
            </label>

            {godMode && (
              <div className="mt-3 space-y-4 rounded-lg border border-amber-400/30 bg-amber-400/5 p-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Font size ({fontSize.toFixed(2)}×)
                  </label>
                  <input
                    type="range"
                    min={0.6}
                    max={1.6}
                    step={0.05}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Text position
                  </label>
                  <select
                    value={textPosition}
                    onChange={(e) => setTextPosition(e.target.value as "top" | "middle" | "bottom")}
                    className={selectCls}
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={watermark}
                    onChange={(e) => setWatermark(e.target.checked)}
                    className="h-4 w-4 accent-amber-400"
                  />
                  Show MemesMaterial watermark
                </label>
              </div>
            )}

            {imageData ? (
              <p className="mt-4 text-xs text-gray-400">
                Exact mode: your content is used verbatim on your image — no AI rewriting.
              </p>
            ) : (
              <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                  className="h-4 w-4 accent-[#ff625e]"
                />
                Polish the caption with AI (uses OpenRouter)
              </label>
            )}

            <button
              onClick={generate}
              disabled={busy || !text.trim()}
              className="btn mt-6 w-full py-3 font-black uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Generating..." : "Create Meme Image"}
            </button>
          </div>

          {result?.status === "error" && (
            <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {result.error}
            </div>
          )}

          {result?.status === "ready" && (
            <div className="mt-6 rounded-xl border border-white/10 bg-gray-800 p-4 text-sm text-gray-300">
              <p><span className="font-bold text-white">Kicker:</span> {result.kicker || "—"}</p>
              <p className="mt-1"><span className="font-bold text-white">Quote:</span> {result.quote}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">
                {result.category} · {result.style} · {result.language}
                {result.backgroundSource ? ` · bg: ${result.backgroundSource}` : ""}
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-white/10 bg-gray-800 p-6">
            {busy && <p className="animate-pulse text-gray-400">Rendering your meme image...</p>}
            {!busy && !result && <p className="text-gray-500">Your generated image will appear here</p>}
            {!busy && result?.status === "error" && <p className="text-red-400">Generation failed — try again</p>}
            {!busy && result?.status === "ready" && result.url && (
              <div className="w-full text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.url}
                  alt={result.quote ?? "Generated meme image"}
                  className="mx-auto max-h-[560px] rounded-lg border border-white/10"
                />
                <a
                  href={result.url}
                  download={`memesmaterial-${result.url?.split("/").pop() ?? "meme.jpg"}`}
                  className="btn mt-4 inline-block px-6 py-2 font-black uppercase tracking-wider"
                >
                  Download Image
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
