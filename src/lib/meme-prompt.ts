/**
 * Shared creative direction for AI meme image generation.
 *
 * House rule: understand the joke FIRST, design the image SECOND. Every meme
 * should feel like a different meme — template, characters, environment,
 * camera angle, typography, and composition change according to the joke.
 */

/** System prompt sent alongside every full-meme image request */
export const MEME_IMAGE_SYSTEM_PROMPT = `Create a high-quality, professional meme image based on the user's meme concept.

Core objective: turn the provided meme idea into a visually strong, instantly understandable meme. Do NOT simply place the supplied text over a random image. First understand the joke, emotion, situation, and punchline, then select the most suitable meme composition.

Meme format selection — automatically choose the best visual format for the joke. Possible formats include: Disaster Girl style, Distracted Boyfriend style, Drake-style comparison, two-panel reaction meme, three-panel progression meme, before/after meme, POV meme, Expectation vs Reality, top-text/bottom-text reaction meme, office/workplace meme, chat/screenshot-style meme, original cinematic reaction scene, original illustrated/cartoon meme, split-screen comparison, or any other format that improves the joke.

IMPORTANT: do NOT always use the same meme template, the same characters, or the same visual style. Choose the format and characters based on the specific joke.

Visual generation: generate an original, polished meme composition that clearly communicates the situation before the viewer reads the text. Use natural facial expressions, strong comedic body language, appropriate environment/background, correct character positioning, clear visual hierarchy, strong contrast, realistic or stylized visuals depending on the joke, dynamic composition, and social-media-ready framing.

Characters must be varied between memes. They can be different fictional-looking people, different ages and appearances, different genders when appropriate, different occupations, animals, animated/cartoon characters, objects given personality, or original characters. Never repeatedly generate the same character unless specifically requested.

Text accuracy — the meme text is extremely important. Render the supplied wording EXACTLY. Do NOT change words, correct slang, remove punctuation, add unnecessary text, duplicate text, misspell words, generate gibberish, or replace important words with synonyms. If there are multiple text areas, place each element in its correct visual location. Text must be large, bold, highly readable, properly aligned, clearly separated from the image, safe within the image boundaries, and legible on a mobile phone. Use classic meme typography when appropriate, adapted to the selected format.

Before generating, internally determine: the setup, the punchline, the emotion the viewer should see, which meme format communicates it best, where each text element appears, and which characters or objects make the joke strongest.

Quality requirements: high resolution, sharp details, professional meme composition, strong comedic timing, no distorted faces, no extra limbs or malformed hands, no random objects, no unnecessary logos or watermarks, original visual interpretation preferred, correct spelling and exact text, optimized for Instagram, YouTube, WhatsApp, and other social platforms.

Most important rule: understand the joke FIRST and design the image SECOND. Every meme should feel like a different meme. Do not produce repetitive output with the same character, background, pose, template, typography, or composition.

Output ONLY the finished meme image. Do not provide an explanation, prompt, analysis, or description alongside the generated image.`;

export type MemeImagePromptOptions = {
  /** the user's topic/idea */
  concept: string;
  /** the meme text to render word-for-word */
  text: string;
  kicker?: string;
  category?: string;
  style?: string;
  language?: string;
  layout?: "classic" | "center";
  aspect?: string;
};

/** User-message prompt for generating one complete meme image (text baked in) */
export function buildMemeImagePrompt(o: MemeImagePromptOptions): string {
  return [
    `Meme concept: "${o.concept}".`,
    o.category ? `Category: ${o.category}.` : "",
    o.style ? `Humor style: ${o.style}.` : "",
    `Write/render all meme text in ${o.language || "English"}.`,
    "",
    "Render this meme text EXACTLY, word for word, with correct spelling:",
    `"${o.text}"`,
    o.kicker ? `You may add this small theme tagline near the top if it fits naturally: "${o.kicker}".` : "",
    o.layout === "classic"
      ? "Use a classic top-text/bottom-text meme layout for the text."
      : "Place the text wherever it reads best within the composition.",
    `Final image: vertical ${o.aspect || "9:16"} portrait framing, social-media ready.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Creative variety guidance for textless illustrations (e.g. video scene
 * backgrounds where captions are composited separately).
 */
export const SCENE_VARIETY_GUIDELINES =
  `Vary characters and settings between images: different people, ages, appearances, ` +
  `occupations, animals, cartoon characters, or objects given personality. Use natural facial ` +
  `expressions, strong comedic body language, clear visual hierarchy, strong contrast, and ` +
  `dynamic composition. Never reuse the same character, pose, or background across images.`;
