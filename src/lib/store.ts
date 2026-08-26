import { appendFileSync, existsSync, readFileSync } from "fs";
import { workDir } from "@/lib/runtime";

/**
 * Storage abstraction: uses Upstash Redis (REST) when configured so the
 * library/projects survive redeploys on Netlify; falls back to a local
 * JSONL file in the writable temp dir otherwise.
 */

export type LibraryItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  title: string;
  topic?: string;
  category?: string;
  style?: string;
  durationSec?: number;
  backgroundSource?: string;
  aiSource?: string;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

const FILE = () => workDir("library.jsonl");
const PROJECTS_FILE = () => workDir("projects.jsonl");
const MAX_ITEMS = 500;

function redisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisGet<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`,
      { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { result: string | null };
    if (!data.result) return null;
    return JSON.parse(data.result) as T;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: unknown): Promise<void> {
  try {
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(value)),
    });
  } catch {
    // best-effort
  }
}

/* ---------------- library ---------------- */

export async function addLibraryItem(item: LibraryItem): Promise<void> {
  try {
    appendFileSync(FILE(), JSON.stringify(item) + "\n");
  } catch {
    // local mirror is best-effort
  }
  if (redisConfigured()) {
    const all = (await redisGet<LibraryItem[]>("mm:library")) ?? [];
    all.push(item);
    await redisSet("mm:library", all.slice(-MAX_ITEMS));
  }
}

export async function readLibrary(): Promise<LibraryItem[]> {
  if (redisConfigured()) {
    const remote = await redisGet<LibraryItem[]>("mm:library");
    if (remote) return remote;
  }
  try {
    if (!existsSync(FILE())) return [];
    return readFileSync(FILE(), "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as LibraryItem;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as LibraryItem[];
  } catch {
    return [];
  }
}

/* ---------------- projects ---------------- */

async function addProjectRecord(record: Project): Promise<void> {
  try {
    appendFileSync(PROJECTS_FILE(), JSON.stringify(record) + "\n");
  } catch {
    // best-effort
  }
  if (redisConfigured()) {
    const all = (await redisGet<Project[]>("mm:projects")) ?? [];
    const idx = all.findIndex((p) => p.id === record.id);
    if (idx >= 0) all[idx] = record;
    else all.push(record);
    await redisSet("mm:projects", all.slice(-200));
  }
}

export async function listProjects(): Promise<Project[]> {
  if (redisConfigured()) {
    const remote = await redisGet<Project[]>("mm:projects");
    if (remote) return remote.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  try {
    if (!existsSync(PROJECTS_FILE())) return [];
    const map = new Map<string, Project>();
    for (const line of readFileSync(PROJECTS_FILE(), "utf8").split("\n").filter(Boolean)) {
      try {
        const rec = JSON.parse(line) as Project & { deleted?: boolean };
        if (rec.deleted) {
          map.delete(rec.id);
          continue;
        }
        map.set(rec.id, rec);
      } catch {
        // skip malformed lines
      }
    }
    return [...map.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function saveProject(
  input: { id?: string; name?: string; data?: Record<string, unknown> }
): Promise<Project> {
  const existing = (await listProjects()).find((p) => p.id === input.id);
  const record: Project = {
    id: input.id || crypto.randomUUID().slice(0, 12),
    name: (input.name || existing?.name || "Untitled project").slice(0, 80),
    data: input.data ?? {},
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await addProjectRecord(record);
  return record;
}

export async function deleteProject(id: string): Promise<boolean> {
  const all = await listProjects();
  const target = all.find((p) => p.id === id);
  if (!target) return false;
  if (redisConfigured()) {
    await redisSet("mm:projects", all.filter((p) => p.id !== id));
  }
  // local file keeps history; deleted ids are tracked via tombstone
  try {
    appendFileSync(PROJECTS_FILE(), JSON.stringify({ ...target, deleted: true }) + "\n");
  } catch {
    // best-effort
  }
  return true;
}

/* ---------------- stats ---------------- */

export type LibraryStats = {
  totalImages: number;
  totalVideos: number;
  thisWeek: number;
  recent: LibraryItem[];
};

export async function libraryStats(): Promise<LibraryStats> {
  const all = await readLibrary();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    totalImages: all.filter((i) => i.kind === "image").length,
    totalVideos: all.filter((i) => i.kind === "video").length,
    thisWeek: all.filter((i) => new Date(i.createdAt).getTime() >= weekAgo).length,
    recent: all.slice(-10).reverse(),
  };
}
