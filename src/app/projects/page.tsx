"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Project = {
  id: string;
  name: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setError("Could not load projects"));
  }, []);

  useEffect(load, [load]);

  async function createProject() {
    setBusy(true);
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Project ${new Date().toLocaleString()}`, data: {} }),
      });
      load();
    } catch {
      setError("Could not create project");
    } finally {
      setBusy(false);
    }
  }

  async function rename(p: Project) {
    const name = window.prompt("New project name", p.name);
    if (!name || name === p.name) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, name, data: p.data }),
    });
    load();
  }

  async function duplicate(p: Project) {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${p.name} (copy)`, data: p.data }),
    });
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this project?")) return;
    await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  }

  function exportJson(p: Project) {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${p.name.replace(/[^\w-]+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importJson(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<Project>;
      if (!parsed.data || typeof parsed.data !== "object") throw new Error("bad file");
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: parsed.name ? `${parsed.name} (imported)` : "Imported project", data: parsed.data }),
      });
      load();
    } catch {
      setError("Import failed — expected a project .json file");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Projects</h1>
          <p className="text-gray-400 mt-1">Save and reuse full generation setups.</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => importRef.current?.click()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold uppercase tracking-wider text-gray-300 hover:border-[#ff625e] hover:text-white"
          >
            Import
          </button>
          <button
            onClick={createProject}
            disabled={busy}
            className="btn px-4 py-2 text-sm disabled:opacity-50"
          >
            + New Project
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 max-w-3xl rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!projects.length && !error && (
        <p className="text-gray-500">No projects yet — create one to save your settings.</p>
      )}

      <ul className="max-w-3xl space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/10 bg-gray-800 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{p.name}</p>
                <p className="text-xs text-gray-500">
                  updated {new Date(p.updatedAt).toLocaleString()}
                </p>
              </div>
              <span className="flex flex-wrap gap-1.5 text-xs">
                <button onClick={() => rename(p)} className="rounded border border-white/15 px-2.5 py-1 hover:border-[#ff625e]">Rename</button>
                <button onClick={() => duplicate(p)} className="rounded border border-white/15 px-2.5 py-1 hover:border-cyan-400">Duplicate</button>
                <button onClick={() => exportJson(p)} className="rounded border border-white/15 px-2.5 py-1 hover:border-green-400">Export</button>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded border border-red-400/40 px-2.5 py-1 text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
