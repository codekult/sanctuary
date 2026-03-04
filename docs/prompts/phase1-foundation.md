# Phase 1: Foundation — Ralph Loop Prompt

> **Status**: Complete (implemented 2026-03-04)
>
> Invoke with:
> ```
> /ralph-loop Read and implement docs/prompts/phase1-foundation.md exactly. Assess progress each iteration then continue from where you left off. --max-iterations 30 --completion-promise "PHASE1_COMPLETE"
> ```

---

## Context

You are building **Sanctuary**, a biodiversity tracking platform. Before doing ANY work on each iteration, read these files:

1. `CLAUDE.md` — project conventions and architecture
2. `docs/proposals/001-product-proposal.md` — full product proposal
3. `docs/proposals/002-phase1-foundation.md` — detailed technical spec for this phase
4. `docs/decisions/` — all ADRs explaining technology choices
5. `docs/standards/darwin-core-reference.md` — biodiversity standards

**Runtime**: Bun (not Node.js, not pnpm). Use `bun install`, `bun run`, `bunx`. See ADR-007.

## Task

Implement Phase 1: Foundation. Monorepo, database, auth, API, and seed data. **No UI in this phase.**

## Iteration Protocol

This prompt runs in a Ralph loop. On each iteration:

1. **Assess progress**: Check what's been done in previous iterations by reading files and running `bun run build`, `bun run lint`, `bun run typecheck`
2. **Pick the next incomplete step** from the Implementation Order below
3. **Implement it**, then **verify it works** before moving on
4. **If a step fails**: debug, fix, and re-verify in the same iteration
5. **After all steps pass**: run the full Quality Checklist, fix any failures, then output `<promise>PHASE1_COMPLETE</promise>`

Do NOT output the completion promise until every item in the Quality Checklist passes.

## Implementation Order

Work through these sequentially. Skip steps that are already complete from previous iterations.

### Step 1: Monorepo Scaffolding
- Initialize Turborepo with **bun workspaces** (not pnpm)
- Create the directory structure from `docs/proposals/002-phase1-foundation.md` section 1
- Shared TypeScript config (strict mode) and ESLint config
- **Verify**: `bun install` succeeds, `bun run build` succeeds across all packages

### Step 2: Shared Types Package (`packages/types`)
- All Zod schemas matching the DB schema in proposal 002 section 2
- All shared enums (taxon rank, individual status, life stage, observation status, media type, user role, phenology applies-to)
- Inferred TypeScript types exported from each Zod schema
- Zero dependencies beyond Zod
- **Verify**: `bun run build` in packages/types succeeds with zero errors

### Step 3: Database Package (`packages/db`)
- Drizzle ORM with Supabase Postgres connection (connection string from `DATABASE_URL` env var)
- All table schemas matching proposal 002 section 2 exactly
- Enums sourced from `@sanctuary/types`
- Bilingual fields use `_en` / `_es` suffix pattern
- Handle `order` as SQL reserved word
- Lazy DB client initialization (for Next.js build compatibility — see `docs/learnings/001-monorepo-bun-turborepo.md`)
- Generate initial migration
- **Verify**: `bun run db:generate` creates migration, `bun run db:push` applies to Supabase without errors

### Step 4: API Package (`packages/api`)
- tRPC with context (Drizzle db client + optional auth session)
- `publicProcedure` and `protectedProcedure` middleware
- **Coordinate stripping**: unauthenticated responses MUST have `latitude` and `longitude` set to `null` on individuals and observations. This is a privacy requirement — the property is the owner's home.
- All routers from proposal 002 section 3
- iNaturalist API integration per proposal 002 section 4 (`api.inaturalist.org/v1`)
- **Verify**: `bun run build` in packages/api succeeds, TypeScript compiles clean

### Step 5: i18n Package (`packages/i18n`)
- JSON locale files for EN and ES
- Initial keys: UI labels, entity names, enum display values
- Typed helper for accessing translations
- **Verify**: `bun run build` succeeds

### Step 6: Next.js App (`apps/web`)
- Next.js 15 with App Router, configured to run under bun
- tRPC client connected
- Supabase Auth (server-side session handling) using **publishable key** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) and **secret key** (`SUPABASE_SECRET_KEY`) — NOT the legacy anon/service_role keys. See `.env.example`.
- Minimal health check page at `/` confirming API connectivity
- API route marked as `dynamic = "force-dynamic"` (no static generation)
- No real UI — just wiring
- **Verify**: `bun run build` succeeds, `bun run dev` starts without crashing

### Step 7: Expo App Shell (`apps/mobile`)
- Expo project with TypeScript — shell only
- Connected to tRPC API client from packages/api
- No screens or navigation
- **Verify**: `bun run typecheck` succeeds for mobile

### Step 8: Seed Script
- `packages/db/src/seed.ts` per proposal 002 section 7
- Imports real taxa from iNaturalist API
- Creates sample individuals from whatever taxa are imported (don't hardcode species names)
- Creates observations, phenology event types
- **Verify**: seed populates database (>= 10 taxa, >= 2 individuals, >= 5 observations)

### Step 9: Dev Tooling & Documentation
- `.env.example` documents all required vars
- `README.md` with: project description, prerequisites (bun), setup steps, dev commands
- Document any learnings in `docs/learnings/`
- **Verify**: all Quality Checklist items pass

## Constraints

- **Bun everywhere**. Use `bun install`, `bun run`, `bunx`. NOT npm, npx, pnpm, yarn, node.
- **No UI in this phase**. No pages, forms, or components beyond the health check.
- **Follow existing ADRs**. Do not substitute technologies without writing a new ADR in `docs/decisions/`.
- **Bilingual fields**: `_en` / `_es` suffixed columns, NOT a translations table.
- **Coordinate privacy**: All public API responses strip coordinates. Non-negotiable.
- **iNaturalist API v1**: No auth needed for reads. Respect rate limits (500ms between requests).
- **Supabase Auth user sync**: Upsert user record on first authenticated API call.
- **Supabase keys**: Use the new key format — `sb_publishable_...` and `sb_secret_...` (NOT legacy anon/service_role).
- **Package naming**: `@sanctuary/db`, `@sanctuary/api`, `@sanctuary/types`, `@sanctuary/i18n`.
- **ESLint**: Every package needs `eslint` as a direct devDependency (bun workspace isolation).
- **`@types/node`** must be an explicit devDependency in the Next.js app (bun has no npm for auto-install).
- **No premature optimization**. Simple, correct code.
- **New ADRs**: If you encounter a decision not covered by existing ADRs, write one in `docs/decisions/` before proceeding.

## Quality Checklist

Run ALL of these before outputting the completion promise:

```bash
# 1. Clean install
rm -rf node_modules && bun install

# 2. Type check
bun run typecheck

# 3. Build
bun run build

# 4. Lint
bun run lint

# 5. Migrations
cd packages/db && bun run db:push

# 6. Seed (if DB is empty)
cd packages/db && bun run seed
```

If ANY check fails, fix it and re-run. Only when ALL pass:

```
<promise>PHASE1_COMPLETE</promise>
```

## After Completion (Final Iteration Only)

1. Document any learnings or surprises in `docs/learnings/`
2. Update `docs/proposals/README.md` and `docs/decisions/README.md` indexes if new entries were added
3. Then output the completion promise
