export interface VideoSpec {
  duration: number;
  width: 1920;
  height: 1080;
  fps: 30;
  aspectRatio: "16:9";
  format: "mp4";
}

export interface VideoCreationForm {
  topic: string;
  category: "Everyday Life" | "Lifestyle" | "Technology" | "AI" | "Work/Office" | "College" | "Friendship" | "Family" | "Relationships" | "Gaming" | "Movies/pop culture" | "Internet/social media" | "Indian/South Indian culture" | "Travel" | "Vehicles" | "Random fun" | "Thoughts" | "Opinions" | "Ideas" | "Trends" | "Other";
  language: "English" | "Tamil-English" | "Hinglish";
  style: "Meme" | "Cinematic Meme" | "Reaction" | "Story" | "Absurd" | "Relatable";
  durationSec?: 25 | 60;
  /** Ghost Mode (10x): skip AI scene images, render with instant gradient scenes */
  fast?: boolean;
  /** mix a low-volume synthesized music bed under the narration */
  music?: boolean;
}

export interface Scene {
  id: string;
  duration: number;
  visualPrompt: string;
  voiceOver: string;
  subtitles: string;
  sfx: string[];
  musicTransition: boolean;
}

export interface GeneratedVideo {
  id: string;
  topic: string;
  category: string;
  language: string;
  style: string;
  title: string;
  scenes: Scene[];
  mp4Path: string | null;
  duration: number;
  status: "concept" | "script" | "visuals" | "voice" | "subtitles" | "editing" | "ready" | "error";
  createdAt: Date;
  youtube: {
    title: string;
    description: string;
    hashtags: string[];
    thumbnailText: string;
    pinnedComment: string;
    keywords: string[];
  };
}

export interface ContentHistory {
  topics: string[];
  concepts: string[];
  punchlines: string[];
  mainVisuals: string[];
}

export const CHANNEL_CATEGORIES = [
  "Everyday Life",
  "Lifestyle",
  "Technology",
  "AI",
  "Work/Office",
  "College",
  "Friendship",
  "Family",
  "Relationships",
  "Gaming",
  "Movies/pop culture",
  "Internet/social media",
  "Indian/South Indian culture",
  "Travel",
  "Vehicles",
  "Random fun",
  "Thoughts",
  "Opinions",
  "Ideas",
  "Trends",
];

export const VALID_LANGUAGES = ["English", "Tamil-English", "Hinglish"] as const;
export const VALID_STYLES = ["Meme", "Cinematic Meme", "Reaction", "Story", "Absurd", "Relatable"] as const;