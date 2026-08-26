# MemesMaterial Studio

AI-powered meme video creation studio for the YouTube channel "MemesMaterial".

## 🎬 Quick Start

1. **Install**: Run `install.bat` - verifies Node.js/npm, installs dependencies, creates `.env`
2. **Start**: Run `start.bat` - launches at `http://localhost:3000`
3. **Create**: Select topic/category/language/style, click **CREATE 60-SECOND VIDEO**
4. **Download**: Preview and download the generated MP4

---

## Overview

MemesMaterial Studio is a web application that allows you to generate complete **60-second meme videos** for YouTube. The application handles the entire video creation pipeline entirely from AI-generated original content:

- Meme concept generation
- Script writing (60s, scene-divided)
- Visual generation (original AI images per scene)
- Voice-over/dialogue (AI TTS in selected language)
- Subtitle creation (synchronized, burn-in compatible)
- Audio mixing (background music + sound effects)
- FFmpeg-based MP4 assembly (1920×1080, 30fps, exactly 60s)
- YouTube publishing data generation

---

## ✨ Features

### Video Creation
- **60-second videos** in **1920×1080** at **30 FPS** (16:9 aspect ratio)
- **MP4 format** - YouTube-ready and downloadable
- **20+ content categories**: Everyday Life, Technology, AI, Work/Office, College, Friendship, Family, Relationships, Gaming, Movies/pop culture, Internet/social media, Indian/South Indian culture, Travel, Vehicles, Random fun, Thoughts, Opinions, Ideas, Trends
- **6 styles**: Meme, Cinematic Meme, Reaction, Story, Absurd, Relatable
- **3 languages**: English, Tamil-English, Hinglish

### Production Pipeline (1→8)
1. **Concept** - Original meme concept generation
2. **Script** - 60-second script divided into 5 scenes
3. **Visuals** - Original generated visuals for each scene (no watermarks, no stock images)
4. **Voice** - AI voice-over in selected language
5. **Subtitles** - Synchronized subtitles throughout dialogue/narration
6. **Audio** - Copyright-safe background music + sound effects
7. **Editing** - Professional meme-style cuts, zooms, transitions, motion graphics
8. **Rendering** - FFmpeg-assembled MP4 validated for specs

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
- Node.js v18+ (verified working: v24.18.0)
- npm v10+ (verified working: v11.16.0)
- Windows OS (batch files optimized for Windows)

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
TTS_KEY=your_text_to_speech_provider_key
MUSIC_SFX_KEY=your_music_sfx_provider_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=stealth/ox-alpha
OMNIROUTE_API_KEY=your_omniroute_api_key
OMNIROUTE_BASE_URL=http://localhost:20128/v1
OMNIROUTE_MODEL=your_omniroute_model_id
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_MODEL=meta/llama-3.3-70b-instruct
```

See `.env.example` for the complete format.

---

## 📋 Usage

1. Open `http://localhost:3000`
2. **Select** a topic (e.g., "Office Life"), category, language, and style
3. Click **"CREATE 60-SECOND VIDEO"**
4. Watch the pipeline progress: **Concept → Script → Visuals → Voice → Subtitles → Editing → Rendering → Complete**
5. **Preview** the generated video
6. **Download** the MP4 file
7. Use auto-generated YouTube data OR customize manually
8. Publish to your MemesMaterial channel

---

## 📹 Video Specifications

| Specification | Value |
|--------------|-------|
| **Duration** | Exactly 60 seconds |
| **Resolution** | 1920 × 1080 |
| **Frame Rate** | 30 FPS |
| **Aspect Ratio** | 16:9 |
| **Format** | MP4 |
| **YouTube-ready** | Yes |
| **Audio** | Synchronized |
| **Subtitles** | Synchronized, large clean font, properly positioned |
| **No blank frames** | Verified |
| **No broken artifacts** | Verified |
| **No watermarks** | Verified (AI-generated only) |
| **No duplicate scenes** | Verified |

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
| **Backend** | Next.js API routes / server actions |
| **Database** | SQLite (local/dev) / PostgreSQL (planned) |
| **Video Processing** | FFmpeg (assembly, validation, format conversion) |
| **AI Integration** | Configurable: text AI, image generation, TTS, music/SFX providers |

---

## 📂 Project Structure

```
memesmaterial-studio/
├── .env.example        # Environment variable examples
├── install.bat         # Installation script (Node.js verification, npm install)
├── start.bat           # Development server (npm run dev)
├── build.bat           # Production build (npm run build)
├── tailwind.config.mjs # Tailwind CSS configuration
├── postcss.config.mjs # PostCSS configuration
├── next.config.ts      # Next.js configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
├── eslint.config.mjs   # ESLint configuration
├── README.md           # This file
├── globals.css         # Global styles with dark theme
├── public/             # Static assets
├── src/
│   ├── app/           # Next.js app router pages
│   │   ├── page.tsx   # Dashboard & video creation form
│   │   ├── create/    # Create video page
│   │   ├── library/   # Video library with search/filter
│   │   ├── seven-day-batch/  # 7-video batch generation
│   │   ├── templates/ # Pre-configured meme templates
│   │   ├── assets/    # Asset management page
│   │   └── settings/  # API key configuration
│   ├── components/    # React components
│   │   └── ui/        # UI components (Header, Sidebar)
│   ├── lib/           # Utility libraries and types (types.ts)
│   └── pages/         # API routes (api/generate/)
├── generated-videos/   # Output MP4 files (created at runtime)
└── .gitignore         # Git ignore rules
```

---

## 🎯 Pipeline Overview

```
User Input
    │
    ▼
[API /api/generate] ──► Concept Generation
    │                   │
    ▼                   ▼
Script Generation ──► Scene Division
    │                   │
    ▼                   ▼
Visual Generation ──► Voice-over (TTS)
    │                   │
    ▼                   ▼
Subtitle Generation ──► Audio Mixing (BGM + SFX)
    │                   │
    ▼                   ▼
FFmpeg Assembly ────► MP4 Validation
    │
    ▼
Downloadable Video (1920×1080, 30fps, 60s)
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

History is maintained for 7 days and then cycles.

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
- Ensure FFmpeg is accessible (included in development mode)
- Verify Node.js version (v18+ required)

**Issue: MP4 validation fails**
- Check `generated-videos/` directory has write permissions
- Ensure previous video files are cleaned up
- Re-run generation - validation is automatic

**Issue: API keys not loading**
- Ensure `.env` file exists in project root
- Format: `KEY=value` (no quotes around value needed)
- Restart server after `.env` changes

**Issue: Duplicate content warning**
- The 7-day content history detected a similar concept
- Try a different topic or category
- Use the 7-Day Batch for systematically unique content