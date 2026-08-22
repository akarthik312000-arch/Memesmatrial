"use client";
import { useState } from "react";

export default function VideoLibrary() {
  const [videos, setVideos] = useState<
    Array<{
      id: string;
      title: string;
      category: string;
      duration: number;
      status: "ready" | "processing" | "error";
      createdAt: Date;
    }>
  >([]);

  const [filter, setFilter] = useState<"all" | "ready" | "processing" | "error">("all");

  const handleGenerate = async () => {
    // Trigger a new video generation
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Relatable situation",
        category: "Everyday Life",
        language: "English",
        style: "Meme",
      }),
    });
    const data = await response.json();
    if (data.error) {
      console.error(data.error);
      return;
    }
    setVideos((prev) => [
      {
        id: data.id,
        title: data.title,
        category: data.category,
        duration: data.duration,
        status: data.status,
        createdAt: new Date(),
      },
      ...prev,
    ]);
  };

  const filteredVideos = videos.filter(
    (v) => filter === "all" || v.status === filter
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Video Library</h1>

      <div className="mb-6">
        <button
          onClick={handleGenerate}
          className="btn btn-primary mb-3"
        >
          Create New Video
        </button>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 mt-2"
        >
          <option value="all">Show All</option>
          <option value="ready">Ready (published)</option>
          <option value="processing">Processing</option>
          <option value="error">Error</option>
        </select>
      </div>

      {filteredVideos.length === 0 && (
        <p className="text-gray-400 mb-6">
          No videos yet. Click Create New Video to generate your first meme video.
        </p>
      )}

      {filteredVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-gray-800 border border-gray-600 rounded p-4 hover:border-blue-500 transition-colors"
              >
                <h3 className="text-bold mb-2">{video.title}</h3>
                <p className="text-sm text-gray-400">Category: {video.category}</p>
                <p className="text-sm text-gray-400">
                  Duration: {video.duration}s • {video.status}
                </p>
                <p className="text-xs text-gray-500">
                  Created: {video.createdAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
