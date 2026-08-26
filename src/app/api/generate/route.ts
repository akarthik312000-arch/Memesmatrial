import { NextRequest, NextResponse } from "next/server";
import type { VideoCreationForm } from "@/lib/types";
import { runVideoPipeline } from "@/lib/video-pipeline";
import { startVideoJob, listJobs } from "@/lib/jobs";
import { addLibraryItem } from "@/lib/store";
import { sanitizeError } from "@/lib/runtime";

export const runtime = "nodejs";

type GenerateBody = VideoCreationForm & { async?: boolean };

export async function POST(req: NextRequest) {
  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const form: VideoCreationForm = {
    topic: String(body.topic ?? "").trim().slice(0, 200),
    category: body.category,
    language: body.language,
    style: body.style,
    durationSec: body.durationSec,
    fast: body.fast === true,
    music: body.music === true,
    sfx: body.sfx === true,
  };
  if (!form.topic || !form.category || !form.language || !form.style) {
    return NextResponse.json(
      { error: "Missing required fields: topic, category, language, style" },
      { status: 400 }
    );
  }

  if (body.async === true) {
    const job = startVideoJob(form, (f, onProgress) => runPipelineJob(f, onProgress));
    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
  }

  try {
    const video = await runVideoPipeline(form);
    await addLibraryItem({
      id: String(video.id),
      kind: "video",
      url: String(video.url),
      title: String(video.title),
      topic: form.topic,
      category: form.category,
      style: form.style,
      durationSec: Number(video.duration),
      backgroundSource: String(video.backgroundSource),
      aiSource: String(video.aiSource),
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json(video);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? sanitizeError(e.message) : "Generation failed",
        hint: "Check /api/health for provider status. TTS and image steps fall back automatically; FFmpeg must be installed.",
        retry: true,
      },
      { status: 500 }
    );
  }
}

async function runPipelineJob(
  form: VideoCreationForm,
  onProgress?: (stage: string) => void
): Promise<Record<string, unknown>> {
  const video = await runVideoPipeline(form, { onProgress });
  await addLibraryItem({
    id: String(video.id),
    kind: "video",
    url: String(video.url),
    title: String(video.title),
    topic: form.topic,
    category: form.category,
    style: form.style,
    durationSec: Number(video.duration),
    backgroundSource: String(video.backgroundSource),
    aiSource: String(video.aiSource),
    createdAt: new Date().toISOString(),
  });
  return video;
}

export async function GET() {
  return NextResponse.json({ jobs: listJobs(10) });
}
