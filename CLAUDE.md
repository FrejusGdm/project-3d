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
# Production (Render):
gunicorn app:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 300
```

### Testing Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Full generation pipeline
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test keycap","image_model":"nanobanana","three_d_model":"trellis"}'

# Image-only generation (multipart form)
curl -X POST http://localhost:8000/generate/image \
  -F "prompt=mountain keycap" -F "image_model=nanobanana"

# 3D from existing image
curl -X POST http://localhost:8000/generate/3d \
  -H "Content-Type: application/json" \
  -d '{"image_path":"outputs/abc123.png","three_d_model":"trellis"}'
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
- **Tables**: `generations` (3D models with status tracking), `likes` (social engagement)
- **Key files**:
  - `schema.ts` - DB schema with indexes for userId, batchId, isPublic, status
  - `generations.ts` - CRUD mutations/queries
  - `actions/batchGenerate.ts` - Orchestrates parallel generation (creates 2 variations per prompt)

### Python Backend (`backend-project-3d/`)
- **Framework**: FastAPI with Uvicorn (Gunicorn for production)
- **AI Pipeline** (`gen_pipeline.py`):
  - `NanoBanana` class: Google Gemini 2.5 Flash image generation with keycap-specific system prompt
  - `Trellis` class: 3D model generation via Replicate (outputs GLB/PLY)
  - `HunYuan3d` class: Alternative 3D generator (not working)
  - Output: Files saved to `outputs/` directory, served via `/files/{path}` endpoint
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /generate` - Full pipeline (image → 3D)
  - `POST /generate/image` - Image only (multipart form with optional ref_image)
  - `POST /generate/3d` - 3D from existing image path
  - `GET /files/{path}` - Serve generated files

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
1. User submits prompt → `startBatch` action creates 2 parallel generation records (pending status)
2. `generateSingle` internal action is scheduled for each record
3. Status updated to "generating", calls Python backend `/generate` endpoint
4. Python pipeline: Gemini generates image → Trellis generates 3D model → saves to `outputs/`
5. Convex fetches file from `/files/{path}` endpoint, uploads to Convex storage
6. Status updated to "completed" with `outputStorageId`, or "failed" with error message
7. Frontend displays results in GenerationModal

### Key Patterns
- **Client Components**: Use `"use client"` directive for interactivity (all 3D components, animations)
- **Dynamic Imports**: 3D components use `dynamic(..., { ssr: false })` to prevent server-side R3F errors
- **Physics Animations**: Uses @react-three/cannon for physics-based loading animations
- **Path Alias**: `@/*` maps to frontend project root
- **Convex Actions**: Use `"use node"` directive for Node.js runtime in actions

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
- **HunYuan3D**: Not implemented/working - use Trellis instead.
