import { NextResponse } from "next/server";
import { libraryStats } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const stats = await libraryStats();
  return NextResponse.json({ ok: true, ...stats });
}
