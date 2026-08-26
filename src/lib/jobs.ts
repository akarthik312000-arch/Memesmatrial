import { randomUUID } from "crypto";
import type { VideoCreationForm } from "@/lib/types";

export type JobStatus = "queued" | "running" | "completed" | "failed";

export type Job = {
  id: string;
  kind: "video";
  status: JobStatus;
  progress: string[];
  createdAt: string;
  finishedAt?: string;
  result?: Record<string, unknown>;
  error?: string;
};

const jobs = new Map<string, Job>();
const JOB_TTL_MS = 60 * 60 * 1000;

function prune(): void {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (new Date(job.createdAt).getTime() < cutoff) jobs.delete(id);
  }
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function listJobs(limit = 20): Job[] {
  prune();
  return [...jobs.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((j) => (j.status === "completed" ? j : { ...j, result: undefined }));
}

export function startJob(
  fn: (onProgress: (stage: string) => void) => Promise<Record<string, unknown>>
): Job {
  prune();
  const job: Job = {
    id: randomUUID().slice(0, 12),
    kind: "video",
    status: "queued",
    progress: ["Queued"],
    createdAt: new Date().toISOString(),
  };
  jobs.set(job.id, job);

  void (async () => {
    try {
      job.status = "running";
      const result = await fn((stage) => {
        if (!job.progress.includes(stage)) job.progress.push(stage);
      });
      job.status = "completed";
      job.finishedAt = new Date().toISOString();
      job.result = result;
    } catch (e) {
      job.status = "failed";
      job.finishedAt = new Date().toISOString();
      job.error = e instanceof Error ? e.message : "Generation failed";
    }
  })();

  return { ...job, result: undefined };
}

export function startVideoJob(
  form: VideoCreationForm,
  runner: (form: VideoCreationForm, onProgress: (stage: string) => void) => Promise<Record<string, unknown>>
): Job {
  return startJob((onProgress) => runner(form, onProgress));
}
