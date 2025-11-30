# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Forge** - AI-powered custom keycap design and manufacturing platform. Workflow: Prompt → AI Image Generation → 3D Model Generation → 3D Print → Final Products.

This is a monorepo with two separate packages:
- `frontend-project-3d/` - Next.js 15 frontend with 3D visualization
- `backend-project-3d/` - Convex backend with AI pipeline

## Build & Development Commands

### Frontend (pnpm)
```bash
cd frontend-project-3d
pnpm dev          # Development server with Turbopack (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # Run ESLint
```

### Backend (Convex)
```bash
cd backend-project-3d
npx convex dev    # Start Convex development server
npx convex deploy # Deploy to production
```

## Architecture

### Frontend (`frontend-project-3d/`)
- **Framework**: Next.js 15.5.6 with App Router, TypeScript, React 19
- **3D Rendering**: React Three Fiber + Drei + @react-three/cannon (physics)
- **Styling**: Tailwind CSS 4 with `cn()` utility (class-variance-authority + tailwind-merge)
- **Animations**: Framer Motion
- **Package Manager**: pnpm

Key structure:
- `/app` - Next.js App Router (page.tsx is main entry, client component)
- `/components` - UI components including 3D Scene components
- `/components/animations` - Loading animation variants (TetrisVertical, WaveBlocks, etc.)
- `/lib/utils.ts` - `cn()` utility for Tailwind class merging

### Backend (`backend-project-3d/convex/`)
- **Platform**: Convex (serverless functions + realtime database)
- **3D Pipeline** (`gen_pipeline.py`): Python-based AI generation pipeline
  - Image generation: Google Gemini (NanoBanana) or GPT Image
  - 3D model generation: HunYuan3D or Trellis (via Replicate)
  - Output format: PLY files saved to `outputs/` directory

Environment variables needed:
- `GOOGLE_API_KEY` - For Gemini image generation
- `REPLICATE_API_KEY` - For 3D model generation

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
