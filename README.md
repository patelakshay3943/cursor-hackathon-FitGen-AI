# FitGen AI

AI-powered fitness coaching platform for the Cursor Hackathon. Complete a short assessment, get a **progressive 28-day workout plan** (Day 1 first, unlock the rest as you train), browse a real exercise database, and run **webcam motion tracking** with live form cues — including optional spoken alerts.

Product vision and requirements: see [`SnapFit_AI_FRD.md`](./SnapFit_AI_FRD.md).

---

## Features

| Area | What you get |
|------|----------------|
| **Assessment** | Multi-step profile: goal, level, schedule, equipment, location, limitations, focus areas |
| **Progressive plans** | 28-day skeleton (Push/Pull/Legs, Full Body, or Upper/Lower). AI fills **one day at a time** for a fast first load |
| **Exercise library** | ~873 exercises from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), enriched + optional [wger](https://wger.de/) import |
| **Motion tracking** | Client-side MediaPipe pose estimation, rep counting, form checks, overlay UI |
| **AI coaching** | Cursor SDK rewrites form alerts and post-session summaries; ElevenLabs optional TTS for wrong-form voice cues |
| **No login required** | Core generate → plan → track flow works anonymously (plan lives in the browser session/tab) |

### Motion tracking coverage

Dedicated trackers (plus a generic fallback) for common movement families:

- Squat · Push-up · Plank · Bicep curl · Press · Hinge · Lunge · Row

Open any planned exercise via **Start Motion Tracking** → `/track/[exerciseId]`.

---

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Redux Toolkit
- **Backend:** Next.js Route Handlers + service layer under `src/backend/`
- **Database:** PostgreSQL + Prisma 5
- **AI:** [Cursor SDK](https://cursor.com) (`composer-2.5` by default) for day plans + coach text
- **Vision:** [@mediapipe/tasks-vision](https://ai.google.dev/edge/mediapipe) (browser)
- **Voice:** [ElevenLabs](https://elevenlabs.io) TTS (optional)

---

## Quick start

### Prerequisites

- Node.js 20+ (22 recommended)
- PostgreSQL 16+ **or** Docker **or** the embedded Postgres helper script
- Optional: Cursor API key, ElevenLabs API key

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` — at minimum set `DATABASE_URL`. See [Environment variables](#environment-variables).

### 3. Database

**Option A — Docker** (Postgres on host port **5433**):

```bash
docker compose up -d
# Ensure .env has:
# DATABASE_URL=postgresql://fitgen:fitgen@localhost:5433/fitgen
npm run db:setup
```

**Option B — Local Postgres** (default port 5432):

Create user/db `fitgen` / password `fitgen`, then:

```bash
npm run db:setup
```

**Option C — Embedded Postgres** (no Docker; data under `.data/pg`):

```bash
node scripts/start-embedded-pg.mjs
# Keep that process running, set DATABASE_URL to port 5433, then:
npm run db:setup
```

`db:setup` pushes the Prisma schema, seeds free-exercise-db, and imports wger enrichments.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. **Start free assessment** → `/generate`
2. Wait for Day 1 (Cursor agent may take tens of seconds on first run)
3. Open your plan → start tracking an exercise
4. Mark a day complete to unlock / generate the next day

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `CURSOR_API_KEY` | Recommended | Cursor Dashboard → Integrations. Without it, plans/coaching use local fallbacks |
| `CURSOR_MODEL` | No | Default `composer-2.5` |
| `EXERCISE_IMAGE_BASE` | No | Base URL for exercise images (defaults to free-exercise-db GitHub raw) |
| `ELEVENLABS_API_KEY` | No | Enables spoken wrong-form alerts |
| `ELEVENLABS_VOICE_ID` | No | Override default voice (Rachel) |
| `ELEVENLABS_MODEL_ID` | No | Override default model (`eleven_flash_v2_5`) |

Full template with comments: [`.env.example`](./.env.example).

---

## Project structure

```
├── data/exercises.json          # Vendored free-exercise-db catalog
├── docker-compose.yml           # Postgres 16 on port 5433
├── prisma/
│   ├── schema.prisma            # Exercise, Plan, PlanDay
│   ├── seed.ts                  # Enrich + load catalog
│   └── import-wger.ts           # Optional wger merge
├── scripts/
│   └── start-embedded-pg.mjs    # Local Postgres without Docker
├── SnapFit_AI_FRD.md            # Functional requirements (hackathon)
└── src/
    ├── app/                     # Pages + API routes
    │   ├── api/
    │   │   ├── plans/           # generate, get, day, complete
    │   │   ├── exercises/       # browse / filter
    │   │   └── coach/           # live cues, summary, speak (TTS)
    │   ├── generate/            # Assessment + plan creation
    │   ├── plan/[id]/           # Progressive day UI
    │   ├── exercises/           # Exercise library
    │   └── track/[exerciseId]/  # Webcam motion session
    ├── backend/
    │   ├── controllers/
    │   └── services/            # Plans, Cursor agent, coach, TTS, exercises
    ├── frontend/
    │   ├── modules/
    │   │   ├── plan/            # Profile form, day cards, progress
    │   │   └── tracking/        # MediaPipe, trackers, coach UI
    │   ├── shared/              # UI, HTTP, constants
    │   └── store/               # Redux
    ├── config/
    └── lib/prisma.ts
```

---

## User flows

### Progressive unlock

1. User completes assessment on `/generate`
2. Backend builds a 28-day skeleton; Cursor AI fills **Day 1 only**
3. Days 2–28 stay locked until the previous day is completed
4. **Mark complete** → next day is generated and unlocked
5. Repeat through Day 28

### Motion session

1. From a ready plan day, open an exercise → `/track/...`
2. Browser requests webcam; MediaPipe runs on-device
3. Rep FSM + form rules update the overlay in real time
4. Bad form → rule cue → optional Cursor rewrite → optional ElevenLabs speech
5. Session end → Cursor summary (strengths / improvements) with local fallback

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/plans/generate` | Create plan + generate Day 1 |
| `GET` | `/api/plans/:id` | Full plan state |
| `GET` | `/api/plans/:id/days/:n` | Single day |
| `POST` | `/api/plans/:id/days/:n/complete` | Complete day N, unlock/generate N+1 |
| `GET` | `/api/exercises` | Browse / filter exercises |
| `POST` | `/api/coach/live` | Rewrite a form cue into a short coach alert |
| `POST` | `/api/coach/summary` | Post-session coaching summary |
| `POST` | `/api/coach/speak` | ElevenLabs TTS (`audio/mpeg`); 503 if unset |
| `GET` | `/api/welcome` | Health / welcome ping |

### Generate a plan (example)

```bash
curl -X POST http://localhost:3000/api/plans/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "goal": "muscle_gain",
    "level": "beginner",
    "daysPerWeek": 4,
    "equipment": ["dumbbell", "bodyweight"],
    "sessionMinutes": 45,
    "ageRange": "25-34",
    "sex": "prefer_not",
    "trainingLocation": "gym",
    "limitations": ["none"],
    "focusAreas": ["full"]
  }'
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production server |
| `npm run db:setup` | Push schema + seed + wger import |
| `npm run db:push` | Prisma schema push only |
| `npm run db:seed` | Re-seed / enrich free-exercise-db |
| `npm run db:import-wger` | Merge English exercises from wger (CC-BY-SA) |
| `npm run db:enrich` | Seed + wger import |
| `npm run db:generate` | Prisma client generate |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

Commit hooks: Husky + lint-staged + conventional commits (`commitlint`).

---

## Architecture notes

- **Plans:** Deterministic split skeleton (`week-skeleton`, `split-template`); LLM only fills a single day’s workout JSON, validated against the exercise catalog.
- **Tracking:** Pose + angles + per-exercise FSMs run in the browser for low latency; server only enhances coaching text/audio.
- **Fallbacks:** Missing `CURSOR_API_KEY` → rule-based day workouts and cues. Missing `ELEVENLABS_API_KEY` → text coaching only.
- **Images:** Exercise rows store relative image paths; UI resolves them via `EXERCISE_IMAGE_BASE`.

---

## Demo tips

- Prefer a well-lit room with the full body in frame for tracking.
- Grant camera permission when the browser prompts.
- First Cursor agent call can be slow; subsequent days are similar but usually smoother once warmed up.
- For phone testing against a laptop IP / ngrok, see `allowedDevOrigins` in `next.config.mjs`.

---

## License / data

- App code: private hackathon project unless otherwise stated.
- Exercise catalog: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (see upstream license).
- Optional wger import: [CC-BY-SA](https://wger.de/).
