"use client";

import { useCallback, useEffect, useState } from "react";

type EditScene = { text: string; voice: string };

type Job = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: string[];
  error?: string;
  result?: {
    id: string;
    title: string;
    url: string;
    duration: number;
    topic?: string;
    category?: string;
    language?: string;
    style?: string;
    scenes?: Array<{ visualPrompt?: string; voiceOver?: string }>;
  };
};

const selectCls =
  "w-full rounded-lg border border-white/10 bg-[#14111d] p-2.5 text-sm text-white outline-none transition focus:border-[#ff625e]";

export default function EditorPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [source, setSource] = useState<Job["result"] | null>(null);
  const [scenes, setScenes] = useState<EditScene[]>([]);
  const [durationSec, setDurationSec] = useState<25 | 60>(25);
  const [fast, setFast] = useState(true);
  const [music, setMusic] = useState(false);
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [renderResult, setRenderResult] = useState<Job["result"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/generate")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => setError("Could not load recent videos"));
  }, []);

  const loadFrom = useCallback((job: Job) => {
    if (!job.result?.scenes?.length) return;
    setSource(job.result);
    setScenes(
      job.result.scenes.map((s) => ({
        text: s.visualPrompt ?? "",
        voice: s.voiceOver ?? "",
      }))
    );
    setError(null);
  }, []);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= scenes.length) return;
    const next = [...scenes];
    [next[i], next[j]] = [next[j], next[i]];
    setScenes(next);
  }

  async function startRender() {
    if (!source || scenes.length < 1) return;
    setError(null);
    setRenderResult(null);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: source.topic,
          category: source.category,
          language: source.language,
          style: source.style,
          durationSec,
          fast,
          music,
          async: true,
          scenes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.jobId) throw new Error(data.error || "Could not start render");
      setRenderJobId(data.jobId);
      setRenderStatus("queued");

      for (;;) {
        await new Promise((r) => setTimeout(r, 3000));
        const jRes = await fetch(`/api/jobs/${data.jobId}`);
        const job: Job = await jRes.json();
        setRenderStatus(job.status + (job.progress.length ? ` — ${job.progress[job.progress.length - 1]}` : ""));
        if (job.status === "completed") {
          setRenderResult(job.result ?? null);
          break;
        }
        if (job.status === "failed") throw new Error(job.error || "Render failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Render failed");
      setRenderJobId(null);
      setRenderStatus(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Video Editor</h1>
      <p className="text-gray-400 mb-6">
        Edit the script of a generated video, then re-render it with your changes.
      </p>

      {error && (
        <div className="mb-6 max-w-3xl rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!source && (
        <div className="max-w-3xl space-y-4">
          <h2 className="text-lg font-bold">Load a generated video</h2>
          {jobs.length === 0 && <p className="text-gray-500">No completed videos yet — create one first.</p>}
          <ul className="space-y-2">
            {jobs.map((j) => (
              <li key={j.id}>
                <button
                  onClick={() => loadFrom(j)}
                  className="w-full rounded-lg border border-white/10 bg-gray-800 px-4 py-3 text-left transition hover:border-[#ff625e]"
                >
                  <span className="font-bold">{String(j.result?.title ?? j.id)}</span>
                  <span className="ml-2 text-xs uppercase tracking-wider text-gray-500">
                    {j.result?.duration}s · {(j.result as { backgroundSource?: string })?.backgroundSource}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {source && (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Timeline ({scenes.length} scenes)</h2>
              <button
                onClick={() => setScenes([...scenes, { text: "", voice: "" }])}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:border-[#ff625e]"
              >
                + Add scene
              </button>
            </div>
            {scenes.map((sc, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-gray-800 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#716b7e]">
                    Scene {i + 1}
                  </span>
                  <span className="flex gap-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded border border-white/15 px-2 py-0.5 text-xs disabled:opacity-30">↑</button>
                    <button onClick={() => move(i, 1)} disabled={i === scenes.length - 1} className="rounded border border-white/15 px-2 py-0.5 text-xs disabled:opacity-30">↓</button>
                    <button
                      onClick={() => setScenes(scenes.filter((_, k) => k !== i))}
                      className="rounded border border-red-400/40 px-2 py-0.5 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      ✕
                    </button>
                  </span>
                </div>
                <input
                  value={sc.text}
                  onChange={(e) =>
                    setScenes(scenes.map((s, k) => (k === i ? { ...s, text: e.target.value } : s)))
                  }
                  placeholder="On-screen text"
                  maxLength={60}
                  className={selectCls}
                />
                <textarea
                  value={sc.voice}
                  onChange={(e) =>
                    setScenes(scenes.map((s, k) => (k === i ? { ...s, voice: e.target.value } : s)))
                  }
                  placeholder="Narration line"
                  rows={2}
                  maxLength={200}
                  className={`${selectCls} mt-2`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-white/10 bg-gray-800 p-5">
              <h3 className="mb-3 font-bold">Render settings</h3>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Duration
              </label>
              <select
                value={durationSec}
                onChange={(e) => setDurationSec(Number(e.target.value) as 25 | 60)}
                className={selectCls}
              >
                <option value={25}>25 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-cyan-300">
                <input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
                👻 Ghost Mode gradients
              </label>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} className="h-4 w-4 accent-[#ff625e]" />
                Music bed
              </label>
              <button
                onClick={startRender}
                disabled={renderJobId !== null}
                className="btn mt-4 w-full py-3 font-black uppercase tracking-wider disabled:opacity-50"
              >
                {renderJobId ? "Rendering..." : "Re-render video"}
              </button>
              {renderStatus && (
                <p className="mt-3 animate-pulse text-xs text-gray-400">Status: {renderStatus}</p>
              )}
            </div>

            {renderResult && (
              <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-5">
                <h3 className="font-bold text-green-300">Re-render ready ✅</h3>
                <video src={renderResult.url} controls width={260} className="mt-3 rounded" />
                <a
                  href={renderResult.url}
                  download={`memesmaterial-edit-${renderResult.id}.mp4`}
                  className="btn mt-3 inline-block px-4 py-2 text-xs"
                >
                  ⬇ Download MP4
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
