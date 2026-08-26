"use client";

import { useState } from "react";
import {
  VideoCreationForm,
  CHANNEL_CATEGORIES,
  VALID_LANGUAGES,
  VALID_STYLES,
} from "@/lib/types";

const STEPS = [
  "Concept",
  "Script",
  "Visuals",
  "Voice",
  "Subtitles",
  "Editing",
  "Rendering",
  "Complete",
];

interface Result {
  id: string;
  title: string;
  url: string;
  status: string;
  duration: number;
  youtube: {
    title: string;
    description: string;
    hashtags: string[];
    thumbnailText: string;
    pinnedComment: string;
  };
}

export default function CreatePage() {
  const [form, setForm] = useState<VideoCreationForm>({
    topic: "",
    category: "Everyday Life",
    language: "English",
    style: "Meme",
  });
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    const timer = setInterval(
      () => setStep((s) => (s < STEPS.length - 2 ? s + 1 : s)),
      2500
    );
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setStep(STEPS.length - 1);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStep(0);
    } finally {
      clearInterval(timer);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Create Video</h1>
      <p className="text-gray-400 mb-8">
        Generate a complete 25 or 60-second vertical meme video (1080×1920, 30 FPS, MP4)
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Topic</label>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Monday morning meetings"
            required
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as VideoCreationForm["category"] })}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
            >
              {CHANNEL_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value as VideoCreationForm["language"] })}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
            >
              {VALID_LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Style</label>
            <select
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value as VideoCreationForm["style"] })}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
            >
              {VALID_STYLES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn w-full py-3 rounded font-medium transition-colors disabled:opacity-50"
        >
          {busy ? "GENERATING..." : "CREATE 60-SECOND VIDEO"}
        </button>
      </form>

      {busy && (
        <div className="mt-8 max-w-2xl p-6 bg-gray-800 rounded border-t-4 border-yellow-500">
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <span>{i < step ? "✅" : i === step ? "⏳" : "⬜"}</span>
                <span className={i <= step ? "text-white" : "text-gray-500"}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 max-w-2xl p-6 bg-red-900/50 rounded border-t-4 border-red-500">
          <p className="font-bold">Error: {error}</p>
        </div>
      )}

      {result && !busy && (
        <div className="mt-8 max-w-2xl space-y-6">
          <div className="p-6 bg-gray-800 rounded border-t-4 border-green-500">
            <h2 className="text-xl font-bold mb-3">Video Ready ✅</h2>
            <video src={result.url} controls width={480} className="rounded" />
            <a
              href={result.url}
              download
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
            >
              ⬇ Download MP4
            </a>
          </div>
          <div className="p-6 bg-gray-800 rounded border border-gray-600">
            <h3 className="font-bold mb-2">YouTube Publishing Package</h3>
            <p>
              <strong>Title:</strong> {result.youtube.title}
            </p>
            <p className="mt-2">
              <strong>Description:</strong> {result.youtube.description}
            </p>
            <p className="mt-2">
              <strong>Hashtags:</strong> {result.youtube.hashtags.join(" ")}
            </p>
            <p className="mt-2">
              <strong>Pinned comment:</strong> {result.youtube.pinnedComment}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


