# FitGen AI

Progressive daily workout plan generator. Submit your profile, get **Day 1 instantly**, then unlock each next day as you complete workouts. Built with Next.js, PostgreSQL, and the Cursor SDK on top of the [free-exercise-db](https://github.com/yuhonas/free-exercise-db) dataset.

## Features

- Anonymous plan generation (no login)
- 28-day skeleton with Push/Pull/Legs (or Full Body / Upper-Lower) splits
- AI generates **one day at a time** for fast first load
- Manual "complete day" unlocks the next workout (hackathon-friendly)
- Exercise library with images from free-exercise-db

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma 5
- Cursor SDK (`composer-2.5` by default) for Day N workout JSON + local fallback if no API key

## Project structure

```
src/
├── app/                    # Pages + API route handlers
│   ├── api/plans/          # generate, get, complete day
│   ├── api/exercises/
│   ├── generate/
│   ├── plan/[id]/
│   └── exercises/
├── backend/                # Controllers + services
├── frontend/modules/plan/  # Plan UI + hooks
prisma/                     # Schema + seed
data/exercises.json         # Vendored free-exercise-db
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Set at least:

```
DATABASE_URL=postgresql://fitgen:fitgen@localhost:5432/fitgen
CURSOR_API_KEY=cursor_...      # from Cursor Dashboard → Integrations; falls back to rules if missing
CURSOR_MODEL=composer-2.5
EXERCISE_IMAGE_BASE=https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises
```

Plan generation may take tens of seconds on first run (Cursor agent startup).

### 3. Database

**Option A — local Postgres** (create user/db, then):

```bash
npm run db:setup
```

**Option B — Docker** (maps host port **5433**):

```bash
docker compose up -d
# then set DATABASE_URL=postgresql://fitgen:fitgen@localhost:5433/fitgen
npm run db:setup
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/plans/generate` | Create plan + Day 1 |
| GET | `/api/plans/:id` | Full plan state |
| POST | `/api/plans/:id/days/:n/complete` | Complete day N, unlock N+1 |
| GET | `/api/plans/:id/days/:n` | Single day |
| GET | `/api/exercises` | Browse/filter exercises |

Example:

```bash
curl -X POST http://localhost:3000/api/plans/generate \
  -H 'Content-Type: application/json' \
  -d '{"goal":"muscle_gain","level":"beginner","daysPerWeek":4,"equipment":["dumbbell","bodyweight"],"sessionMinutes":45}'
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:setup` | Push schema + enrich seed + import wger |
| `npm run db:seed` | Re-seed/enrich free-exercise-db |
| `npm run db:import-wger` | Merge extra exercises from wger API |
| `npm run db:enrich` | Seed + wger import |
| `npm run lint` | ESLint |

## Exercise database

Primary source: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (~873 exercises) with enriched fields:

- `muscleGroup`, `tags`, `aliases`, `popularity`, `source`
- Auto-filled `force` / `mechanic` / `equipment` when missing

Optional expansion: [wger](https://wger.de/) English exercises via `npm run db:import-wger` (CC-BY-SA). Duplicates by name are merged/enriched instead of duplicated.


## Progressive unlock flow

1. User fills profile on `/generate`
2. Backend builds 28-day skeleton, AI fills **Day 1 only**
3. User sees Day 1; Days 2–28 are locked
4. "Mark complete" → Day 2 is generated and unlocked
5. Repeat through Day 28
