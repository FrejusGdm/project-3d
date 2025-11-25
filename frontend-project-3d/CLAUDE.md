# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev          # Development server with Turbopack (http://localhost:3000)
pnpm build        # Production build with Turbopack
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Project Overview

**Forge** - AI-powered custom keycap design and manufacturing platform. This is the frontend-only portion; backend is developed separately. The workflow is: Prompt → 3D Models → 3D Prints → Final Products.

## Technology Stack

- **Framework**: Next.js 15.5.6 with App Router
- **Language**: TypeScript 5.x (strict mode)
- **React**: 19.1.0
- **Styling**: Tailwind CSS 4 with PostCSS
- **Icons**: lucide-react
- **Theme**: next-themes with CSS variables (dark/light modes)
- **Package Manager**: pnpm

## Architecture

### App Router Structure
- `/app` - Next.js pages and layouts (Server Components by default)
- `/components` - Reusable React components
- `/lib` - Utility functions (currently `cn()` for Tailwind class merging)

### Key Patterns
- **Client Components**: Mark with `"use client"` for interactivity (HeroInput, ModeToggle, ThemeProvider)
- **Server Components**: Default for pages and layouts
- **Styling**: Tailwind utilities + CSS variables for theming
- **Path Alias**: `@/*` maps to project root

### Component Variants
Uses `class-variance-authority` for component variants with `clsx` and `tailwind-merge` (via the `cn()` utility in `lib/utils.ts`).

### shadcn/ui Configuration
- Style: new-york
- Base color: neutral
- RSC enabled
- Component path: `@/components/ui`

## MCP Integrations

Configured in `.mcp.json`:
- Supabase (database, read-only)
- Vapi (voice AI)
- Exa (search API)
- Render (deployment)
