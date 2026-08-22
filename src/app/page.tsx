"use client";
import { useState } from "react";
import { VideoCreationForm, CHANNEL_CATEGORIES, VALID_LANGUAGES, VALID_STYLES } from "@/lib/types";

export default function Home() {
  const [form, setForm] = useState<VideoCreationForm>({
    topic: "",
    category: "Everyday Life",
    language: "English",
    style: "Meme",
    durationSec: 25,
  });

  const [status, setStatus] = useState<"idle" | "generating" | "ready">("idle");
  const [video, setVideo] = useState<null | { id: string; status: string; url?: string }>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("generating");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setVideo({ id: data.id, status: data.status, url: data.url });
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setStatus("idle");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-[#ff8f87]">Dashboard / New project</p>
          <h1 className="max-w-xl text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl md:text-6xl">Make something <span className="text-[#a970ff]">worth sharing.</span></h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-[#a9a4b7]">A complete 25 or 60-second meme video, from one loose idea to a finished MP4.</p>
        </div>
        <div className="flex gap-3 text-xs font-bold text-[#a9a4b7]">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><span className="block text-xl text-white">25s / 60s</span>pick a format</div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><span className="block text-xl text-white">1080p</span>export ready</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="studio-panel grid max-w-5xl overflow-hidden rounded-2xl lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 md:p-8">
          <div className="mb-7 flex items-center justify-between"><div><h2 className="text-xl font-black">Start with a topic</h2><p className="mt-1 text-sm text-[#a9a4b7]">The messier the thought, the better the meme.</p></div><span className="rounded-full bg-[#8b5cf6]/15 px-3 py-1 text-xs font-bold text-[#c8a9ff]">01 / 01</span></div>
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#a9a4b7]">Topic</label>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. when the WiFi dies during a meeting"
            required
            className="studio-input min-h-14 text-base"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#a9a4b7]">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as VideoCreationForm["category"] })}
              className="studio-input"
            >
              {CHANNEL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#a9a4b7]">Language</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value as VideoCreationForm["language"] })}
              className="studio-input"
            >
              {VALID_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#a9a4b7]">Style</label>
            <select
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value as VideoCreationForm["style"] })}
              className="studio-input"
            >
              {VALID_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#a9a4b7]">Duration</label>
            <select
              value={form.durationSec}
              onChange={(e) => setForm({ ...form, durationSec: Number(e.target.value) as 25 | 60 })}
              className="studio-input"
            >
              <option value={25}>25 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "generating"}
          className="btn mt-7 w-full py-4 transition-all"
        >
          {status === "generating" ? "Generating..." : `CREATE ${form.durationSec === 60 ? "60" : "25"}-SECOND VIDEO`}
        </button>
        </div>
        <div className="relative hidden overflow-hidden border-l border-white/10 bg-gradient-to-br from-[#5125a8] via-[#a63ed4] to-[#ff625e] p-8 lg:block">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[34px] border-white/10" />
          <div className="relative flex h-full flex-col justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-white/70">Your creative brief</p><p className="mt-5 text-3xl font-black leading-tight">Big energy.<br />Small runtime.</p></div><div className="border-t border-white/25 pt-5 text-sm leading-6 text-white/80">AI concept, script, visuals, voice, captions, and edit in one pass.</div></div>
        </div>
      </form>

      {status === "ready" && video && (
        <div className="studio-panel mt-8 max-w-5xl rounded-2xl border-t-4 border-[#40df86] p-6">
          <h2 className="text-xl font-bold mb-3">Video Ready</h2>
            <p>Video ID: {video.id}</p>
            <p>Status: {video.status}</p>
            {video.url && (
              <div className="mt-4">
                <video src={video.url} controls className="h-auto max-w-full rounded" />
                <a
                  href={video.url}
                  download
                  className="mt-2 inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
                >
                  ⬇ Download MP4
                </a>
              </div>
            )}
          <button
            onClick={() => setVideo(null)}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            Generate Another
          </button>
        </div>
      )}
    </div>
  );
}



