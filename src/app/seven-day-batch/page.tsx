"use client";

import { useRef, useState } from "react";
import {
  CHANNEL_CATEGORIES,
  VALID_LANGUAGES,
  VALID_STYLES,
} from "@/lib/types";

interface BatchResult {
  id: string;
  title: string;
  url: string;
  topic: string;
  status: string;
}

const TOPIC_SEEDS = [
  "Monday mornings",
  "group projects",
  "WiFi buffering",
  "family WhatsApp groups",
  "online shopping addiction",
  "gym memberships",
  "autocorrect fails",
  "meeting that could be an email",
  "last-minute exam prep",
  "food delivery delays",
  "phone battery at 1%",
  "weekend plans",
  "traffic jams",
  "video call mishaps",
  "password requirements",
  "spam calls",
  "subscription renewals",
  "midnight cravings",
  "software updates",
  "budgeting fails",
];

function buildTopicList(count: number): { topic: string; category: string }[] {
  const list = [];
  for (let i = 0; i < count; i++) {
    const seed = TOPIC_SEEDS[i % TOPIC_SEEDS.length];
    const round = Math.floor(i / TOPIC_SEEDS.length);
    const topic =
      round === 0
        ? seed
        : `${seed} (part ${round + 1})`;
    const category =
      CHANNEL_CATEGORIES[(i * 7) % CHANNEL_CATEGORIES.length];
    list.push({ topic, category });
  }
  return list;
}

export default function BatchGenerator() {
  const [count, setCount] = useState(10);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [current, setCurrent] = useState("");
  const [results, setResults] = useState<BatchResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [cancelled, setCancelled] = useState(false);
  const cancelRef = useRef(false);

  const runBatch = async () => {
    setRunning(true);
    setResults([]);
    setErrors([]);
    setDone(0);
    setCancelled(false);
    cancelRef.current = false;
    const jobs = buildTopicList(count);
    for (let i = 0; i < jobs.length; i++) {
      if (cancelRef.current) break;
      setCurrent(jobs[i].topic);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: jobs[i].topic,
            category: jobs[i].category,
            language: VALID_LANGUAGES[i % VALID_LANGUAGES.length],
            style: VALID_STYLES[i % VALID_STYLES.length],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "failed");
        setResults((prev) => [
          ...prev,
          {
            id: data.id,
            title: data.youtube.title,
            url: data.url,
            topic: jobs[i].topic,
            status: "ready",
          },
        ]);
      } catch (e) {
        setErrors((prev) => [...prev, `${jobs[i].topic}: ${e instanceof Error ? e.message : "failed"}`]);
      }
      setDone(i + 1);
    }
    setCurrent("");
    setRunning(false);
  };

  const cancel = () => {
    cancelRef.current = true;
    setCancelled(true);
  };

  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Batch Generator</h1>
      <p className="text-gray-400 mb-8">
        Generate unlimited unique meme videos in one go. Each video is
        automatically deduplicated and rotated across categories, languages, and
        styles.
      </p>

      <div className="max-w-xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Number of videos (1–100)
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) =>
              setCount(
                Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
              )
            }
            disabled={running}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        {!running ? (
          <button onClick={runBatch} className="btn w-full py-3 rounded font-medium">
            GENERATE {count} VIDEO{count > 1 ? "S" : ""}
          </button>
        ) : (
          <button
            onClick={cancel}
            className="btn w-full py-3 rounded font-medium bg-red-600 hover:bg-red-500"
          >
            CANCEL AFTER CURRENT
          </button>
        )}

        {(running || results.length > 0) && (
          <div className="p-6 bg-gray-800 rounded border-t-4 border-yellow-500">
            <div className="flex justify-between text-sm mb-2">
              <span>
                {running ? `Generating: ${current}` : cancelled ? "Cancelled" : "Complete"}
              </span>
              <span>
                {done}/{count}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded">
              <div
                className="h-3 bg-yellow-500 rounded transition-all"
                style={{ width: `${(done / count) * 100}%` }}
              />
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="p-4 bg-red-900/50 rounded text-sm">
            {errors.map((er, i) => (
              <p key={i}>⚠ {er}</p>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">
              Generated Videos ({results.length})
            </h2>
            {results.map((r) => (
              <div
                key={r.id}
                className="p-4 bg-gray-800 border border-gray-600 rounded flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-gray-400">Topic: {r.topic}</p>
                </div>
                <a
                  href={r.url}
                  download
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 whitespace-nowrap"
                >
                  ⬇ MP4
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
