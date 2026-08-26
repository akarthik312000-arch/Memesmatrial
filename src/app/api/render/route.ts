import { NextRequest, NextResponse } from "next/server";
import type { VideoCreationForm } from "@/lib/types";
import { runVideoPipeline, validateOutput } from "@/lib/video-pipeline";
import { addLibraryItem } from "@/lib/store";
import { sanitizeError, workDir } from "@/lib/runtime";
import { startJob } from "@/lib/jobs";
import { join } from "path";

export const runtime = "nodejs";

type EditScene = { text?: string; voice?: string; visual?: string };

type RenderBody = VideoCreationForm & { scenes: EditScene[]; async?: boolean };

/** editor-driven re-render of a (possibly edited) scene script */
export async function POST(req: NextRequest) {
  let body: RenderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.topic || !body?.category || !body?.language || !body?.style) {
    return NextResponse.json(
      { error: "Missing required fields: topic, category, language, style" },
      { status: 400 }
    );
  }
  const scenes = Array.isArray(body.scenes) ? body.scenes : [];
  if (scenes.length < 1 || scenes.length > 20) {
    return NextResponse.json({ error: "scenes must contain between 1 and 20 entries" }, { status: 400 });
  }
  if (scenes.some((s) => !s.voice && !s.text)) {
    return NextResponse.json({ error: "every scene needs text or voice" }, { status: 400 });
  }

  const form: VideoCreationForm = {
    topic: String(body.topic).slice(0, 200),
    category: body.category,
    language: body.language,
    style: body.style,
    durationSec: body.durationSec,
    fast: body.fast === true,
    music: body.music === true,
    sfx: body.sfx === true,
  };

  try {
    const render = async (onProgress?: (stage: string) => void) => {
      const video = await runVideoPipeline(form, {
        scenesOverride: scenes.map((s) => ({
          text: String(s.text ?? s.voice ?? "").slice(0, 60),
          voice: String(s.voice ?? s.text ?? "").slice(0, 200),
          visual: s.visual ? String(s.visual).slice(0, 300) : "",
        })),
        skipConceptAI: true,
        onProgress,
      });

      // QC validation on the re-rendered file
      const finalName = String(video.url ?? "").split("/").pop() ?? "";
      const finalPath = join(workDir("generated"), finalName);
      const qc = await validateOutput(finalPath, Number(video.duration));
      if (!qc.valid) {
        throw new Error(qc.error ?? "Validation failed");
      }
      video.validation = qc.meta;

      await addLibraryItem({
        id: String(video.id),
        kind: "video",
        url: String(video.url),
        title: `${String(video.title)} (edit)`,
        topic: form.topic,
        category: form.category,
        style: form.style,
        durationSec: Number(video.duration),
        backgroundSource: String(video.backgroundSource),
        aiSource: "editor",
        createdAt: new Date().toISOString(),
      });
      return video;
    };

    if (body.async === true) {
      const job = startJob(render);
      return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
    }

    return NextResponse.json(await render());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? sanitizeError(e.message) : "Render failed", retry: true },
      { status: 500 }
    );
  }
}
