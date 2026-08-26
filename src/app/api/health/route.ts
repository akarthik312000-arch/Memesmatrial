import { NextResponse } from "next/server";
import { spawnSync } from "child_process";
import { resolveFfmpeg } from "@/lib/runtime";

export const runtime = "nodejs";

type Status = "connected" | "missing" | "keyless";

function keyStatus(value: string | undefined): Status {
  if (value && !value.startsWith("your_") && value !== "local") return "connected";
  return "missing";
}

function ffmpegInfo(): { found: boolean; version: string | null; source: string; filters: Record<string, boolean> } {
  const bin = resolveFfmpeg();
  if (!bin) return { found: false, version: null, source: "none", filters: {} };
  const res = spawnSync(bin, ["-version"], { windowsHide: true, encoding: "utf8" });
  const first = res.stdout?.split("\n")[0]?.trim() ?? null;
  const version = first ? (first.match(/ffmpeg version (\S+)/)?.[1] ?? first.slice(0, 60)) : null;
  const bundled = bin.includes("ffmpeg-static");
  // verify the filters our render pipelines depend on exist in this build
  const flt = spawnSync(bin, ["-hide_banner", "-filters"], { windowsHide: true, encoding: "utf8" });
  const list = flt.stdout ?? "";
  const filters: Record<string, boolean> = {};
  for (const f of ["scale", "crop", "drawtext", "noise", "vignette", "concat", "gradients", "anullsrc", "amix", "adelay", "anoisesrc"]) {
    filters[f] = new RegExp(`\\s${f}\\s`).test(list);
  }
  return {
    found: res.status === 0 || Boolean(version),
    version,
    source: bundled ? "bundled (ffmpeg-static)" : bin === "ffmpeg" ? "system PATH" : bin,
    filters,
  };
}

export async function GET() {
  const ff = ffmpegInfo();
  const ttsKey = keyStatus(process.env.TTS_KEY);
  const ttsHosted = ttsKey === "connected" && Boolean(process.env.TTS_BASE_URL);

  return NextResponse.json({
    ok: true,
    node: process.version,
    platform: process.platform,
    ffmpeg: ff,
    providers: {
      text: {
        omniroute: keyStatus(process.env.OMNIROUTE_API_KEY),
        nvidia: keyStatus(process.env.NVIDIA_API_KEY),
        openrouter: keyStatus(process.env.OPENROUTER_API_KEY),
      },
      image: {
        imageProvider:
          keyStatus(process.env.IMAGE_GEN_KEY) === "connected" && process.env.IMAGE_GEN_BASE_URL
            ? "connected"
            : "missing",
        openrouterImage: keyStatus(process.env.OPENROUTER_API_KEY),
        pollinations: "keyless",
      },
      tts: {
        hosted: ttsHosted ? "connected" : "missing",
        windowsSpeech: process.platform === "win32" ? "available" : "unavailable",
      },
      musicSfx: keyStatus(process.env.MUSIC_SFX_KEY),
    },
  });
}
