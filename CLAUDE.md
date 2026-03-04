# Sanctuary — Project Conventions

## What is this project?

Sanctuary is a biodiversity tracking platform for cataloguing and monitoring living species within a property. It follows Darwin Core-aligned data standards.

## Architecture

- **Monorepo**: Turborepo + bun workspaces
- **Runtime / Package Manager**: Bun
- **Web**: Next.js 15 (App Router) — backoffice + public library
- **Mobile**: React Native + Expo — field recording app
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM
- **API**: tRPC (shared between web and mobile)
- **Auth**: Supabase Auth (multi-admin, invite-only)
- **Storage**: Supabase Storage (S3-compatible, image transforms)
- **Validation**: Zod (shared schemas)
- **Maps**: Leaflet + OpenStreetMap

See `docs/decisions/` for rationale behind each choice.

## Implementation Status

| Phase | Proposal | Status |
|---|---|---|
| 1 — Foundation | [002](docs/proposals/002-phase1-foundation.md) | Complete |
| 2 — Backoffice MVP | — | Not started |
| 3 — Public Library | — | Not started |
| 4 — Phenology | — | Not started |
| 5 — Mobile App | — | Not started |
| 6 — Polish & Portfolio | — | Not started |

## Project Structure

```
sanctuary/
  apps/
    web/              # Next.js app (backoffice + public library)
    mobile/           # React Native + Expo app
  packages/
    db/               # Drizzle schema, migrations, seed data
    api/              # tRPC router definitions
    types/            # Shared TypeScript types & Zod schemas
    i18n/             # Internationalization (EN/ES)
  tooling/
    eslint/           # Shared ESLint config
    typescript/       # Shared TypeScript config (strict)
  docs/
    decisions/        # Architecture Decision Records (ADRs)
    proposals/        # Feature proposals (written before implementation)
    prompts/          # Ralph Loop execution prompts (per phase)
    learnings/        # Solved problems and insights
    standards/        # Reference material (Darwin Core, etc.)
```

## Workflow — Compound Engineering

Follow this loop for every non-trivial feature:

1. **Brainstorm** — explore approaches (`/brainstorm`)
2. **Propose** — write a scoped proposal in `docs/proposals/`
3. **Decide** — write ADRs in `docs/decisions/` for key choices
4. **Plan** — create an implementation plan (`/plan`)
5. **Implement** — write code against the proposal (`/work` or `/ralph-loop`)
6. **Review** — check work quality (`/review`, `/simplify`)
7. **Compound** — document learnings in `docs/learnings/` (`/compound`)

### Ralph Loop for Autonomous Implementation

For phases that can run unattended, use a Ralph Loop:

1. Write a **prompt file** in `docs/prompts/` (see existing prompts for format)
2. Ensure `.claude/settings.local.json` has the required Bash permissions pre-approved
3. Invoke: `/ralph-loop <short pointer to prompt file> --max-iterations N --completion-promise "PHASEX_COMPLETE"`

**Prompt file conventions:**
- The ralph-loop prompt arg is a short pointer (1-2 sentences). The full spec lives in `docs/prompts/`.
- The prompt file references the proposal and spec files by path — Claude reads them on each iteration.
- Include an **Iteration Protocol** (assess → pick next step → implement → verify).
- Include a **Quality Checklist** that must pass before the completion promise fires.
- Keep the prompt file self-contained: context paths, implementation order, constraints, quality gates.

See `docs/learnings/002-ralph-loop-conventions.md` for full details.

## Coding Conventions

- **Language**: TypeScript everywhere. Strict mode enabled.
- **Naming**: camelCase for variables/functions, PascalCase for types/components, kebab-case for files.
- **Database columns**: snake_case (Drizzle handles mapping).
- **Imports**: Use path aliases (`@sanctuary/db`, `@sanctuary/api`, `@sanctuary/types`).
- **Components**: Functional components with named exports. Colocate styles.
- **Avoid**: `any` types, default exports (except pages/layouts), barrel files, premature abstraction.

## Documentation Conventions

- **ADRs**: Numbered sequentially (`001-`, `002-`). Follow Context → Options → Decision → Consequences format.
- **Proposals**: Numbered sequentially. Written before implementation, updated if scope changes.
- **Learnings**: Named descriptively by topic. Include the problem, what was tried, and what worked.
- **Commit messages**: Imperative mood, concise. Reference proposal/ADR numbers when relevant.

## Data Model

Core entities: Taxon, Individual, Observation, PhenologyEvent, PhenologyEventType, Media, User, Property.

See `docs/proposals/001-product-proposal.md` for full schema.
See `docs/standards/darwin-core-reference.md` for standards alignment.
