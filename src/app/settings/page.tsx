"use client";

import { useEffect, useState } from "react";

type Status = string;

type Health = {
  ok: boolean;
  node: string;
  platform: string;
  ffmpeg: { found: boolean; version: string | null; source: string };
  providers: {
    text: { omniroute: Status; nvidia: Status; openrouter: Status };
    image: { imageProvider: Status; openrouterImage: Status; pollinations: Status };
    tts: { hosted: Status; windowsSpeech: Status };
    musicSfx: Status;
  };
};

const OK_STATES = new Set(["connected", "available", "keyless"]);

function Badge({ status }: { status: Status }) {
  const good = OK_STATES.has(status);
  const neutral = status === "missing" || status === "unavailable";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
        good
          ? "bg-emerald-500/15 text-emerald-300"
          : neutral
          ? "bg-white/10 text-gray-400"
          : "bg-amber-500/15 text-amber-300"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function Row({ label, status, hint }: { label: string; status: Status; hint?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-none">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <Badge status={status} />
    </div>
  );
}

export default function Settings() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setError("Could not load provider status. Is the server running?"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Settings</h1>
      <p className="text-gray-400 mb-6">
        Provider configuration is read from environment variables — keys are never
        stored in the browser or sent to the frontend.
      </p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!health && !error && <p className="animate-pulse text-gray-400">Checking providers...</p>}

      {health && (
        <div className="max-w-3xl space-y-6">
          <section className="rounded-xl border border-white/10 bg-gray-800 p-6">
            <h2 className="text-lg font-bold mb-3">Runtime</h2>
            <Row label="Node.js" status={health.node} />
            <Row label="Platform" status={health.platform} />
            <Row
              label="FFmpeg"
              status={health.ffmpeg.found ? `v${health.ffmpeg.version ?? "?"}` : "not found"}
              hint={health.ffmpeg.source === "none" ? "Install ffmpeg or reinstall npm dependencies" : health.ffmpeg.source}
            />
          </section>

          <section className="rounded-xl border border-white/10 bg-gray-800 p-6">
            <h2 className="text-lg font-bold mb-3">Text AI</h2>
            <Row label="OmniRoute gateway" status={health.providers.text.omniroute} hint="OMNIROUTE_API_KEY + OMNIROUTE_MODEL" />
            <Row label="NVIDIA NIM" status={health.providers.text.nvidia} hint="NVIDIA_API_KEY" />
            <Row label="OpenRouter" status={health.providers.text.openrouter} hint="OPENROUTER_API_KEY" />
          </section>

          <section className="rounded-xl border border-white/10 bg-gray-800 p-6">
            <h2 className="text-lg font-bold mb-3">Image Generation</h2>
            <Row label="Image provider (OpenAI-compatible)" status={health.providers.image.imageProvider} hint="IMAGE_GEN_KEY + IMAGE_GEN_BASE_URL" />
            <Row label="OpenRouter image models" status={health.providers.image.openrouterImage} hint="Uses OPENROUTER_API_KEY" />
            <Row label="Pollinations (free fallback)" status={health.providers.image.pollinations} hint="No key required" />
          </section>

          <section className="rounded-xl border border-white/10 bg-gray-800 p-6">
            <h2 className="text-lg font-bold mb-3">Text-to-Speech</h2>
            <Row label="Hosted TTS (OpenAI-compatible)" status={health.providers.tts.hosted} hint="TTS_KEY + TTS_BASE_URL — used on Netlify" />
            <Row label="Windows System.Speech" status={health.providers.tts.windowsSpeech} hint="Local narration on Windows" />
          </section>

          <section className="rounded-xl border border-white/10 bg-gray-800 p-6">
            <h2 className="text-lg font-bold mb-3">Music / SFX</h2>
            <Row label="Music/SFX provider" status={health.providers.musicSfx} hint="MUSIC_SFX_KEY (reserved for future use)" />
          </section>

          <p className="text-sm text-gray-500">
            To change providers, edit the environment variables in <code>.env</code>{" "}
            (locally) or Site configuration → Environment variables (Netlify), then restart.
          </p>
        </div>
      )}
    </div>
  );
}
