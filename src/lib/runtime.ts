import { existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

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
