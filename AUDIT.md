# MemesMaterial Studio — Feature Audit

Audit date: 2026-08-26. Statuses: 🔴 Critical · 🟠 Important · 🟡 Improvement · 🟢 Working

| Feature | Status | Problem | Priority | Fix |
|---|---|---|---|---|
| Meme image generation (text→image, AI caption) | 🟢 Working | — | — | — |
| Upload own image as background (exact mode) | 🟢 Working | — | — | — |
| Text layouts (centered / classic top-bottom) | 🟢 Working | — | — | — |
| Aspect ratios 1:1 / 4:5 / 9:16 | 🟢 Working | Was missing | 🟡 | Added `aspect` param + UI select |
| Video pipeline (concept→script→visuals→TTS→render) | 🟢 Working | — | — | — |
| Duration selection 25s/60s | 🟢 Working | — | — | — |
| FFmpeg bundling on Netlify + Windows | 🟢 Working | — | — | — |
| Output serving via `/api/output` (30 min TTL) | 🟢 Working | Path traversal guarded | — | — |
| Dedup history (captions/hooks, token compaction) | 🟢 Working | In-memory only; resets on redeploy | 🟠 | Documented; persistence is roadmap |
| YouTube metadata auto-generation | 🟢 Working | Template-based (topic-derived) | 🟢 | — |
| Settings page | 🔴 Critical | **Fake** — logged keys to console and showed a false success alert | 🔴 | Replaced with real provider status dashboard backed by `GET /api/health` (masked statuses, never exposes keys) |
| Provider visibility / health checks | 🟠 Important | No way to see configured providers or FFmpeg status | 🟠 | New `/api/health` endpoint + Settings UI |
| Error messages | 🟠 Important | Raw FFmpeg stderr with local file paths leaked to clients | 🟠 | `sanitizeError()` strips paths in both API routes; responses include actionable `hint` |
| Temp-file cleanup | 🟡 Improvement | `uploads/` dir never cleaned; generated artifacts only cleaned on GET | 🟡 | `cleanupOldSets()` now purges uploads + bg-cache (30 min TTL); output route cleans generated |
| Meme output dir bug | 🔴 Critical | FFmpeg wrote to non-existent dir after Netlify port → I/O error | 🔴 | Fixed (`mkdirSync` before render), verified by live test |
| Video QC validation | 🟡 Improvement | Only file-size checked | 🟡 | `validateOutput()` probes duration (±4s tolerance) and 1080×1920 resolution via ffmpeg stream info; result returned in response |
| Create page spec text | 🟡 Improvement | Claimed 1920×1080 landscape | 🟡 | Corrected to 1080×1920 |
| Narration TTS cross-platform | 🟢 Working | Windows-only System.Speech broke hosted deploys | 🟠 | Hosted OpenAI-compatible TTS (`TTS_BASE_URL`) + silent-track fallback |

## Known limitations / roadmap (not implemented by design)

- **Timeline video editor** (scene reorder/edit/regenerate): large feature — roadmap
- **Persistent projects/library DB**: history is in-memory per server instance — roadmap
- **Queue/background jobs**: generation is synchronous; a full 10-scene AI video takes ~5–10 minutes locally (AI image generation dominates) and will exceed Netlify's 100s sync function timeout. Fast paths: uploaded/gradient backgrounds and `ai:false` render in well under the limit — roadmap: job queue + polling
- **SRT/VTT subtitle export**: burned-in text only currently — roadmap
- **Music/SFX mixing**: provider config reserved (`MUSIC_SFX_KEY`), not wired into render — roadmap
- **7-Day batch dedup**: works via shared in-memory history; resets across deploys
