import { existsSync } from "fs";
import { spawnSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import ffmpegPath from "ffmpeg-static";

/** writable root for runtime artifacts (Netlify functions only allow /tmp) */
export function workDir(...parts: string[]): string {
  return join(tmpdir(), "memesmaterial", ...parts);
}

function escapeDrawtextPath(p: string): string {
  return p.replace(/\\/g, "/").replace(/:/g, "\\:");
}

export function fontFile(name: string): string {
  const p = join(process.cwd(), "assets", "fonts", name);
  if (!existsSync(p)) throw new Error(`Font not found: ${name}`);
  return escapeDrawtextPath(p);
}

/** strip machine-specific paths/noise so clients get safe, readable errors */
export function sanitizeError(msg: string): string {
  const clean = msg
    .replace(/[A-Za-z]:\\[^\s"',:]*/g, "<path>")
    .replace(/(?:\/tmp|\/var\/task)[^\s"',:]*/g, "<path>")
    .replace(/\s+/g, " ")
    .trim();
  return clean.slice(-400);
}

/**
 * Pick an FFmpeg binary that actually supports our filters.
 * The npm ffmpeg-static Linux build ships WITHOUT drawtext (no freetype),
 * so prefer FFMPEG_PATH / system installs there; Windows bundles are fine.
 */
export function resolveFfmpeg(): string {
  const candidates: string[] = [];
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    candidates.push(process.env.FFMPEG_PATH);
  }
  if (process.platform !== "win32") candidates.push("ffmpeg");
  if (ffmpegPath && existsSync(ffmpegPath)) candidates.push(ffmpegPath);
  const binName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  candidates.push(join(process.cwd(), "node_modules", "ffmpeg-static", binName));

  let fallback: string | null = null;
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["-hide_banner", "-filters"], {
      windowsHide: true,
      encoding: "utf8",
      timeout: 20000,
    });
    const out = probe.stdout ?? "";
    if (probe.status !== 0 && !out) continue;
    if (/ drawtext /.test(out)) return candidate;
    if (!fallback) fallback = candidate;
  }
  return fallback ?? candidates[candidates.length - 1];
}
