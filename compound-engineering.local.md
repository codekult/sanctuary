---
review_agents:
  [
    kieran-typescript-reviewer,
    code-simplicity-reviewer,
    security-sentinel,
    performance-oracle,
    architecture-strategist,
    pattern-recognition-specialist,
  ]
plan_review_agents: [kieran-typescript-reviewer, code-simplicity-reviewer]
---

# Review Context

## Stack

TypeScript monorepo (Turborepo + Bun) with Next.js 15 (App Router), tRPC, Drizzle ORM, Supabase Auth, and Zod shared schemas. See `CLAUDE.md` for full architecture.

## Vercel Skills — Apply During All React/Next.js Reviews

These skills are installed in `.agents/skills/` and must be referenced when reviewing frontend code:

- **vercel-react-best-practices** — 58 rules across 8 categories for React/Next.js performance (waterfall elimination, bundle optimization, server-side perf, re-render prevention). Apply when reviewing any React component, Next.js page, or data fetching code.
- **vercel-composition-patterns** — Compound components, state lifting, context interfaces, avoiding boolean prop proliferation. Apply when reviewing component architecture or APIs.
- **web-design-guidelines** — UI compliance, accessibility, UX patterns. Apply when reviewing any UI changes.

## Project-Specific Review Instructions

- **Shared schemas**: All Zod schemas live in `@sanctuary/types` — form schemas must derive from them, never duplicate.
- **Package boundaries**: Web app must not import `drizzle-orm` directly — operators re-exported from `@sanctuary/db`.
- **Server components**: Prefer RSC for data fetching. Only use `"use client"` when interactivity is needed. Auth data should be read server-side and passed as props.
- **ILIKE searches**: Always escape `%` and `_` wildcards in user input before interpolation.
- **External API input**: Validate format strictly (e.g., numeric IDs with regex) before interpolating into URL paths.
- **DB indexes**: Every column used in WHERE, ORDER BY, or unique constraints must have an index.
- **A11y**: Icon-only buttons need `aria-label`. Disabled nav items use `<button disabled>`, not `<span>`.
- **tRPC types**: Use `RouterOutputs` for API return types, never manual interfaces.
