# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Forge** - AI-powered custom keycap design and manufacturing platform. Workflow: Prompt → AI Image Generation → 3D Model Generation → 3D Print → Final Products.

This is a monorepo with two separate packages:
- `frontend-project-3d/` - Next.js 15 frontend with 3D visualization + Convex serverless backend
- `backend-project-3d/` - Python FastAPI server for AI generation pipeline

## Build & Development Commands

### Frontend (pnpm)
```bash
cd frontend-project-3d
pnpm dev          # Development server with Turbopack (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # Run ESLint
npx convex dev    # Start Convex development server (run alongside pnpm dev)
```

### Python Backend
```bash
cd backend-project-3d
pip install -r requirements.txt  # Install dependencies
python app.py                     # Run dev server (http://localhost:8000)
```

## Architecture

### Frontend (`frontend-project-3d/`)
- **Framework**: Next.js 15.5.6 with App Router, TypeScript, React 19
- **3D Rendering**: React Three Fiber + Drei + @react-three/cannon (physics)
- **Styling**: Tailwind CSS 4 with `cn()` utility (class-variance-authority + tailwind-merge)
- **Animations**: Framer Motion
- **Auth**: Clerk (`@clerk/nextjs`) - protects `/my-generations` and `/favorites` routes
- **Package Manager**: pnpm

Key structure:
- `/app` - Next.js App Router (page.tsx is main entry, client component)
- `/components` - UI components including 3D Scene components
- `/components/animations` - Loading animation variants (TetrisVertical, WaveBlocks, etc.)
- `/convex` - Convex serverless functions (schema, mutations, queries, actions)
- `/lib/utils.ts` - `cn()` utility for Tailwind class merging

### Convex Backend (`frontend-project-3d/convex/`)
- **Platform**: Convex (serverless functions + realtime database)
- **Tables**: `generations` (3D models), `likes` (social engagement)
- **Key files**: `schema.ts` (DB schema), `generations.ts` (CRUD), `actions/batchGenerate.ts` (generation orchestration)

### Python Backend (`backend-project-3d/`)
- **Framework**: FastAPI with Uvicorn
- **AI Pipeline** (`gen_pipeline.py`):
  - Image generation: Google Gemini 2.5 Flash (NanoBanana class)
  - 3D model generation: Trellis via Replicate (working), HunYuan3D (not implemented)
  - Output format: PLY files saved to `outputs/` directory
- **Endpoints**: `GET /health`, `POST /generate`, `GET /files/{path}`

### Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

**Convex Dashboard**:
- `PIPELINE_URL` - Python backend URL (e.g., `https://your-service.onrender.com`)

**Python Backend** (`.env.local`):
```
GOOGLE_API_KEY=...       # For Gemini image generation
REPLICATE_API_KEY=...    # For Trellis 3D model generation
```

### Generation Flow
1. User submits prompt → `startBatch` action creates 4 parallel generation records
2. `generateSingle` action calls Python backend `/generate` endpoint
3. Python pipeline: Gemini generates image → Trellis generates 3D model → returns PLY path
4. Convex fetches PLY from `/files` endpoint, uploads to Convex storage
5. Frontend displays results in GenerationModal

### Key Patterns
- **Client Components**: Use `"use client"` directive for interactivity (all 3D components, animations)
- **Dynamic Imports**: 3D components use `dynamic(..., { ssr: false })` to prevent server-side R3F errors
- **Physics Animations**: Uses @react-three/cannon for physics-based loading animations
- **Path Alias**: `@/*` maps to frontend project root

### Component System
- shadcn/ui style: new-york, base color: neutral
- UI components path: `@/components/ui`

## 3D Scene Architecture

The main 3D visualization (`Scene3D.tsx`) supports multiple animation modes:
- physics3d - Physics-based falling blocks
- tetrisVertical - Tetris-style stacking animation
- waveBlocks, floatingCubes, stackingBlocks, spinningRing

All animations are canvas-based using React Three Fiber with Stage/OrbitControls from Drei.

## Known Issues

- **Render free tier timeout**: 30-second limit, but generation takes 1-2 minutes. See `DEBUGGING.md` for solutions.
