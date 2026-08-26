import { NextResponse } from "next/server";
import { libraryStats } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, ...libraryStats() });
}
