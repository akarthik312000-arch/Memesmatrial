import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "fs";
import { join } from "path";
import { workDir } from "@/lib/runtime";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
};

/** delete generated artifacts older than 30 minutes */
function cleanupOld(): void {
  try {
    const root = workDir("generated");
    if (!existsSync(root)) return;
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const f of readdirSync(root)) {
      const full = join(root, f);
      try {
        if (!statSync(full).isFile()) continue;
      } catch {
        continue;
      }
      // file names embed creation time via Date.now()
      const m = f.match(/(\d{13})/);
      if (m && Number(m[1]) < cutoff) rmSync(full, { force: true });
    }
  } catch {
    // best effort
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.includes("..")) {
    return NextResponse.json({ error: "invalid file name" }, { status: 400 });
  }
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) {
    return NextResponse.json({ error: "unsupported file type" }, { status: 400 });
  }
  const filePath = join(workDir("generated"), name);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "not found or expired" }, { status: 404 });
  }
  cleanupOld();
  const buf = readFileSync(filePath);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=1800",
    },
  });
}
