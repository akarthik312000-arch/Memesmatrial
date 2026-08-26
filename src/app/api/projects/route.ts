import { NextRequest, NextResponse } from "next/server";
import { listProjects, saveProject, deleteProject } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ projects: await listProjects() });
}

export async function POST(req: NextRequest) {
  let body: { id?: string; name?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const project = await saveProject({
    id: typeof body.id === "string" ? body.id : undefined,
    name: typeof body.name === "string" ? body.name : undefined,
    data: (body.data && typeof body.data === "object") ? body.data : {},
  });
  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });
  const removed = await deleteProject(id);
  if (!removed) return NextResponse.json({ error: "project not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
