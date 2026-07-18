# FitGen AI

Full-stack Next.js app with a professional **frontend / backend** folder layout.

## Project structure

```
src/
├── app/                    # Next.js App Router (pages + API route handlers)
│   ├── api/
│   │   └── welcome/        # GET /api/welcome
│   ├── (auth)/
│   ├── layout.tsx
│   └── page.tsx
├── backend/                # Server-side business logic
│   ├── controllers/        # Request handlers
│   ├── services/           # Domain / business logic
│   └── types/              # API response types
├── frontend/               # Client-side code
│   ├── components/         # App-level UI components
│   ├── modules/            # Feature modules (auth, product, order, user)
│   ├── shared/             # Shared UI, hooks, constants
│   └── store/              # Redux store
├── config/                 # App configuration
├── lib/                    # Shared utilities
├── styles/                 # Global CSS
└── middleware.ts           # Next.js middleware
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the app.

### Welcome API

```bash
curl http://localhost:3000/api/welcome
```

Example response:

```json
{
  "message": "Welcome to FitGen AI! Your fitness journey starts here.",
  "app": "FitGen AI",
  "version": "0.1.0",
  "timestamp": "2026-07-18T05:57:00.000Z",
  "status": "ok"
}
```

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run start`   | Start production server  |
| `npm run lint`    | Run ESLint               |
| `npm run format`  | Format with Prettier     |
