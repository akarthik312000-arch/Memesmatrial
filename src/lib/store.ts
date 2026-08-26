import { appendFileSync, existsSync, readFileSync } from "fs";
import { workDir } from "@/lib/runtime";

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

const FILE = () => workDir("library.jsonl");

export function addLibraryItem(item: LibraryItem): void {
  try {
    appendFileSync(FILE(), JSON.stringify(item) + "\n");
  } catch {
    // storage is best-effort
  }
}

export function readLibrary(): LibraryItem[] {
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

export type LibraryStats = {
  totalImages: number;
  totalVideos: number;
  thisWeek: number;
  recent: LibraryItem[];
};

export function libraryStats(): LibraryStats {
  const all = readLibrary();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    totalImages: all.filter((i) => i.kind === "image").length,
    totalVideos: all.filter((i) => i.kind === "video").length,
    thisWeek: all.filter((i) => new Date(i.createdAt).getTime() >= weekAgo).length,
    recent: all.slice(-10).reverse(),
  };
}
