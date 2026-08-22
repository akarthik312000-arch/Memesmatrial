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
  error?: string;
};

export default function MemeImagePage() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState(CATEGORIES[15]);
  const [style, setStyle] = useState(STYLES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [useAi, setUseAi] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MemeResult | null>(null);

  async function generate() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/meme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category, style, language, ai: useAi }),
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
        Turn any topic into a ready-to-post 1080×1920 meme image. Each generation
        gets a fresh background and a unique caption — no repeats.
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

            <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                className="h-4 w-4 accent-[#ff625e]"
              />
              Polish the caption with AI (uses OpenRouter)
            </label>

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
                  download
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
