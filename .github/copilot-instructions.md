# Portfolio — Copilot Instructions

## Project
Next.js 15 App Router personal portfolio with Tailwind CSS v4, shadcn/ui, Framer Motion.

## Design System
- **Background:** `#050510` / `#0a0a1f`
- **Neons:** cyan `#00f5ff`, purple `#bf00ff`, pink `#ff00aa`
- **Typography:** Syne (h1-h4) via `var(--font-syne)`, DM Sans (body) via `var(--font-dm-sans)`
- **Glass card:** `bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-2xl`
- **CSS variables:** defined in `app/globals.css` — `--glow-cyan`, `--glow-purple`, `--glow-pink`, etc.

## Components
- All components in `components/` are Client Components (`"use client"`)
- Use Framer Motion `Variants` type for animation objects
- Use `ease: [0.25, 0.46, 0.45, 0.94]` (bezier array) instead of `ease: "easeOut"` strings
- Use `useInView({ once: true })` for scroll-triggered animations

## Rules
- Never use `ease: "easeOut"` string — use bezier arrays for Framer Motion compatibility
- Always add `pointer-events-none` to decorative background blobs
- Buttons must have `cursor-pointer`
- Keep all neon color values as inline styles where Tailwind arbitrary values don't apply
