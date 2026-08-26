# MemesMaterial Studio

AI-powered meme video creation studio for the YouTube channel "MemesMaterial".

## 🎬 Quick Start

1. **Install**: Run `install.bat` - verifies Node.js/npm, installs dependencies, creates `.env`
2. **Start**: Run `start.bat` - launches at `http://localhost:3000`
3. **Create**: Select topic/category/language/style and duration (25s or 60s), click **CREATE VIDEO**
4. **Download**: Preview and download the generated MP4

---

## Overview

MemesMaterial Studio is a web application that generates **vertical short-form meme videos** (and standalone meme images) for YouTube Shorts / social media. The application handles the entire creation pipeline from AI-generated original content:

- Meme concept generation (via OmniRoute / NVIDIA / OpenRouter free models)
- Script writing (10 fast-paced scenes)
- Visual generation (original AI images per scene, matched to the script)
- Voice-over narration (Windows System.Speech locally, hosted TTS on Netlify)
- FFmpeg-based MP4 assembly (1080×1920, 30fps, 25s or 60s)
- Standalone 1080×1920 meme image generation (`/meme-image`)
- YouTube publishing data generation

---

## ✨ Features

### Video Creation
- **Vertical Shorts format**: **1080×1920** (9:16) at **30 FPS**
- **Selectable duration**: **25s or 60s** per video (10 scenes, pacing adapts)
- **MP4 format** - YouTube-ready and downloadable
- **20+ content categories**: Everyday Life, Technology, AI, Work/Office, College, Friendship, Family, Relationships, Gaming, Movies/pop culture, Internet/social media, Indian/South Indian culture, Travel, Vehicles, Random fun, Thoughts, Opinions, Ideas, Trends
- **6 styles**: Meme, Cinematic Meme, Reaction, Story, Absurd, Relatable
- **3 languages**: English, Tamil-English, Hinglish

### Production Pipeline
1. **Concept** - Original meme concept + fixed main character via AI (template fallback)
2. **Script** - 10 fast-paced scenes with on-screen text, narration, and visual prompts
3. **Visuals** - AI illustration per scene (OpenRouter image models → image provider → Pollinations), with gradient fallback
4. **Voice** - Narration TTS (hosted OpenAI-compatible TTS, Windows System.Speech locally, or silent track)
5. **Text overlays** - Floating display-font quotes and spaced kicker captions rendered by FFmpeg
6. **Editing** - Slow pan/drift camera feel per scene, film grain + vignette
7. **Rendering** - Single-pass FFmpeg concat assembly, validated for size

### Meme Image Generator (`/meme-image`)
- Turns any topic into a ready-to-post **1080×1920 meme image**
- AI caption with recent-caption deduplication
- AI background matched to the joke scene (procedural/gradient fallback)

### 7-Day Content System
- Generate batches of **7 completely different videos**
- **Automatic deduplication** prevents similar topics/concepts/punchlines/hooks
- Content history database maintains uniqueness within the week
- `[7-Day Batch]` page generates a full week's content at once

### YouTube Publishing (auto-generated)
- **Title**: Optimized for click-through
- **Description**: Relatable meme description with natural keyword integration
- **5 Hashtags**: Topic-specific + trending mix
- **Thumbnail text**: Large, readable text overlay description
- **Pinned comment**: Engagement-optimized first comment
- **Keywords**: SEO-optimized for YouTube search

### Copyright Safety (Priority Order)
1. AI-generated original visuals
2. User-created assets
3. Public-domain material
4. Properly licensed assets
5. Copyright-safe music/SFX

**Never** uses unauthorized movie/clips, TV footage, YouTube videos, or other creators' content.

### Content Safety
- ❌ No prohibited content (pornography, gore, hate speech, extremist propaganda, serious harassment, threats, dangerous challenges, illegal activity instructions)
- ✅ Allowed: Comedy, satire, parody, mild dark humor, opinions, internet humor, relatable jokes

---

## 📦 Installation

```bash
install.bat
```

This script:
- Verifies **Node.js** and **npm** are installed
- Installs all npm dependencies
- Creates `.env.example` if missing
- Sets up the project environment

**Requirements:**
- Node.js v20+ (Netlify builds on Node 22)
- npm v10+

---

## 🛠 Development

```bash
start.bat
```
Launches Next.js development server at `http://localhost:3000`.

```bash
build.bat
```
Creates production build in `.next/` directory.

## 🌐 Deploy To Netlify

This project should be deployed to **Netlify**, not GitHub Pages. The app uses Next.js server API routes, FFmpeg, and a server-side OpenRouter key; GitHub Pages cannot run those server features.

1. Push the `memesmaterial-studio` folder to a GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project** and select the repository.
3. Set the base directory to `memesmaterial-studio` if the repository contains multiple projects.
4. Use `npm run build` as the build command. The included `netlify.toml` configures this automatically.
5. Add the provider keys in **Site configuration → Environment variables**. Do not commit real keys.
6. The API tries configured OmniRoute, NVIDIA, then OpenRouter and automatically continues after provider errors or timeouts.
7. For Netlify, set `OMNIROUTE_BASE_URL` to a reachable hosted OmniRoute URL; `localhost` only works during local development.

Netlify will install the Next.js adapter (`@netlify/plugin-nextjs`) and deploy the API routes as Node functions on Node 22. The `netlify.toml` bundles the `ffmpeg-static` binary and the bundled fonts into the functions automatically.

Generated memes/videos are written to the function's temp directory (the only writable location on Netlify) and served through `/api/output/<file>`; artifacts are cleaned up after 30 minutes.

Narration TTS: locally on Windows it uses built-in System.Speech. On Netlify, configure a hosted OpenAI-compatible TTS provider via `TTS_BASE_URL` + `TTS_KEY` (see `.env.example`). Without one, videos render with a silent narration track.

Function timeouts are configured to 100 seconds in `netlify.toml`. Video generation can take several minutes; if a generation exceeds the limit, consider a Netlify plan or configuration that supports extended timeouts.

### API Configuration

Edit `.env` with your API keys:

```
TEXT_AI_KEY=your_text_ai_provider_key
IMAGE_GEN_KEY=your_image_generation_provider_key  
IMAGE_GEN_BASE_URL=your_image_generation_base_url
IMAGE_GEN_MODEL=gemini-2.5-flash-image
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=stealth/ox-alpha
OPENROUTER_IMAGE_MODEL=google/gemini-2.5-flash-image-preview
TTS_KEY=your_text_to_speech_provider_key
TTS_BASE_URL=
TTS_MODEL=tts-1
TTS_VOICE=alloy
MUSIC_SFX_KEY=your_music_sfx_provider_key
OMNIROUTE_API_KEY=your_omniroute_api_key
OMNIROUTE_BASE_URL=http://localhost:20128/v1
OMNIROUTE_MODEL=your_omniroute_model_id
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=meta/llama-3.3-70b-instruct
```

See `.env.example` for the complete format.

---

## 📋 Usage

1. Open `http://localhost:3000`
2. **Select** a topic (e.g., "Office Life"), category, language, style, and duration
3. Click **"CREATE 25-SECOND VIDEO"** or **"CREATE 60-SECOND VIDEO"**
4. Watch the pipeline progress: **Concept → Script → Visuals → Voice → Editing → Rendering → Complete**
5. **Preview** the generated video
6. **Download** the MP4 file
7. Use auto-generated YouTube data OR customize manually
8. Publish to your MemesMaterial channel

---

## 📹 Video Specifications

| Specification | Value |
|--------------|-------|
| **Duration** | 25s or 60s (selectable) |
| **Resolution** | 1080 × 1920 |
| **Frame Rate** | 30 FPS |
| **Aspect Ratio** | 9:16 (vertical Shorts) |
| **Format** | MP4 (H.264 + AAC) |
| **Scenes** | 10 AI-illustrated scenes |
| **Narration** | TTS voice-over (or silent track when no TTS provider) |
| **YouTube-ready** | Yes |

---

## 📁 Content Categories (20 total)

Everyday Life, Lifestyle, Technology, AI, Work/Office, College, Friendship, Family, Relationships, Gaming, Movies/pop culture, Internet/social media, Indian/South Indian culture, Travel, Vehicles, Random fun, Thoughts, Opinions, Ideas, Trends

---

## 🌐 Language Options

- **English**
- **Tamil-English** (Hinglish-infused for broader relatability)
- **Hinglish** (Hindi-English mix)

---

## 🎨 Styles

- **Meme** - Classic meme format with punchline
- **Cinematic Meme** - Film-style lighting and transitions
- **Reaction** - Response-based humor
- **Story** - Narrative-driven comedy
- **Absurd** - Surreal, unexpected humor
- **Relatable** - Everyday situation humor

---

## ⚖️ Copyright & Safety

**All visuals are AI-generated or public-domain.** No unauthorized movie clips, TV footage, YouTube videos, or other creators' content is used.

**All music and sound effects are copyright-safe.** The system avoids Content ID claims and copyright detection.

**Content safety filters** actively block prohibited categories while allowing appropriate comedy, satire, and parody.

---

## 💻 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js + React + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Backend** | Next.js API routes (serverless-ready) |
| **Database** | In-memory dedup history (no persistent DB) |
| **Video Processing** | FFmpeg (assembly, validation, format conversion) |
| **AI Integration** | Configurable: text AI, image generation, TTS, music/SFX providers |

---

## 📂 Project Structure

```
memesmaterial-studio/
├── .env.example        # Environment variable examples
├── netlify.toml        # Netlify build config (Node 22, function bundling/timeouts)
├── install.bat         # Installation script (Node.js verification, npm install)
├── start.bat           # Development server (npm run dev)
├── build.bat           # Production build (npm run build)
├── tailwind.config.mjs # Tailwind CSS configuration
├── postcss.config.mjs  # PostCSS configuration
├── next.config.ts      # Next.js configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
├── eslint.config.mjs   # ESLint configuration
├── README.md           # This file
├── assets/
│   └── fonts/          # Bundled OFL-licensed fonts used by FFmpeg drawtext
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js app router pages
│   │   ├── page.tsx    # Dashboard & video creation form
│   │   ├── create/     # Create video page
│   │   ├── library/    # Video library with search/filter
│   │   ├── seven-day-batch/  # 7-video batch generation
│   │   ├── templates/  # Pre-configured meme templates
│   │   ├── meme-image/ # Standalone meme image generator
│   │   ├── assets/     # Asset management page
│   │   ├── settings/   # API key configuration
│   │   └── api/        # Serverless API routes
│   │       ├── generate/       # POST - video generation pipeline
│   │       ├── meme/           # POST - meme image generation
│   │       └── output/[name]/  # GET  - serves generated artifacts (30 min TTL)
│   ├── components/     # React components (ui/, video/)
│   └── lib/            # types.ts, ai-image.ts, runtime.ts (paths/fonts)
└── .gitignore          # Git ignore rules
```

---

## 🎯 Pipeline Overview

```
User Input
    │
    ▼
[API /api/generate] ──► Concept Generation (OmniRoute/NVIDIA/OpenRouter, template fallback)
    │
    ▼
Script: 10 scenes (text + narration + visual prompt)
    │
    ▼
Visual Generation per scene (AI images, gradient fallback)
    │
    ▼
Narration TTS ──► single WAV track
    │
    ▼
FFmpeg Assembly (pan/drift, text overlays, grain, concat)
    │
    ▼
MP4 Validation ──► served via /api/output/<file> (1080×1920, 30fps, 25s/60s)
```

---

## ⚡ Batch Generation (7-Day)

Generate a full week's worth of unique content:

```
[7-Day Batch] button
    │
    ▼
7 independent video generations
    │
    ▼
Automatic deduplication check
    │
    ▼
7 unique MP4 files ready for publishing
```

Each video is checked against the content history to ensure:
- Different topics
- Different concepts
- Different jokes/punchlines
- Different main visual concepts
- Different titles

History is kept in memory (it resets when the server redeploys or restarts).

---

## 🛡 Safety Controls

The application includes:

- **Content safety filters** blocking prohibited categories
- **Copyright protection** - only AI-generated or licensed assets
- **7-day deduplication** preventing repetitive content
- **API key isolation** - no hardcoded secrets
- **Environment variable** configuration for all external services

---

## 📄 License

Created for the **MemesMaterial** YouTube channel. 

Built with ❤️ for meme entertainment.

---

## 🆘 Troubleshooting

**Issue: Video generation fails**
- Check `.env` has valid API keys
- Ensure FFmpeg is accessible (included via `ffmpeg-static`)
- Verify Node.js version (v20+ required)

**Issue: MP4 validation fails**
- Check disk space in the system temp directory (runtime outputs are written to `<tmp>/memesmaterial/`)
- Re-run generation - validation is automatic

**Issue: No narration audio**
- On Windows, System.Speech is used automatically
- On Netlify, configure `TTS_BASE_URL` + `TTS_KEY` for hosted TTS; otherwise a silent track is used

**Issue: API keys not loading**
- Ensure `.env` file exists in project root
- Format: `KEY=value` (no quotes around value needed)
- Restart server after `.env` changes

**Issue: Duplicate content warning**
- The 7-day content history detected a similar concept
- Try a different topic or category
- Use the 7-Day Batch for systematically unique content