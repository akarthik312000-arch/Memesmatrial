"use client";

import { useEffect, useState } from "react";

type Stats = {
  ok: boolean;
  totalImages: number;
  totalVideos: number;
  thisWeek: number;
  recent?: Array<{
    id: string;
    kind: string;
    title: string;
    url: string;
    createdAt: string;
  }>;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setError("Could not load analytics"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Analytics</h1>
      <p className="text-gray-400 mb-6">
        Generation activity since the current server instance started.
      </p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!stats && !error && <p className="animate-pulse text-gray-400">Loading stats...</p>}

      {stats && (
        <>
          <div className="mb-8 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-3">
            {[
              { label: "Meme images", value: stats.totalImages },
              { label: "Videos", value: stats.totalVideos },
              { label: "This week", value: stats.thisWeek },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-white/10 bg-gray-800 p-5 text-center"
              >
                <p className="text-4xl font-black">{card.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#716b7e]">
                  {card.label}
                </p>
              </div>
            ))}
          </div>

          <h2 className="mb-3 text-lg font-bold">Recent creations</h2>
          {!stats.recent?.length && (
            <p className="text-gray-500">Nothing generated yet.</p>
          )}
          <ul className="max-w-3xl space-y-2">
            {stats.recent?.map((item) => (
              <li
                key={item.id + item.createdAt}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-gray-800 px-4 py-2.5"
              >
                <span className="truncate text-sm">
                  <span
                    className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                      item.kind === "video"
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "bg-pink-500/15 text-pink-300"
                    }`}
                  >
                    {item.kind}
                  </span>
                  {item.title}
                </span>
                <span className="ml-4 whitespace-nowrap text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
