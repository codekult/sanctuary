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

| Phase                  | Proposal                                       | Status      |
| ---------------------- | ---------------------------------------------- | ----------- |
| 1 — Foundation         | [002](docs/proposals/002-phase1-foundation.md) | Complete    |
| 2 — Backoffice MVP     | —                                              | Not started |
| 3 — Public Library     | —                                              | Not started |
| 4 — Phenology          | —                                              | Not started |
| 5 — Mobile App         | —                                              | Not started |
| 6 — Polish & Portfolio | —                                              | Not started |

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

This project uses two Claude Code plugins that work together:

- **compound-engineering** (EveryInc) — workflow orchestration, specialized agents, and review
- **ralph-wiggum** (Anthropic) — iterative autonomous loops with fresh context per iteration

### Core Workflow

Follow this loop for every non-trivial feature, using the plugin slash commands:

1. **Brainstorm** — `/workflows:brainstorm` — explore approaches collaboratively
2. **Propose** — write a scoped proposal in `docs/proposals/`
3. **Decide** — write ADRs in `docs/decisions/` for key choices
4. **Plan** — `/workflows:plan` — create a structured implementation plan
5. **Deepen** — `/deepen-plan` — enhance plan with parallel research agents
6. **Implement** — `/workflows:work` (interactive) or `/ralph-loop` (unattended)
7. **Review** — `/workflows:review` — multi-agent code review with worktrees
8. **Compound** — `/workflows:compound` — document learnings for future sessions

### Autonomous Modes

| Command           | Plugin               | When to use                                                                          |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `/workflows:work` | compound-engineering | Interactive implementation with quality gates and incremental commits                |
| `/ralph-loop`     | ralph-wiggum         | Unattended iterative loops — each iteration gets fresh context, reads file/git state |
| `/lfg`            | compound-engineering | Full pipeline: plan → deepen → work → review → ship (sequential)                     |
| `/slfg`           | compound-engineering | Same as `/lfg` but with swarm mode for parallel execution                            |

### Ralph Loop for Unattended Implementation

For phases that can run overnight, use `/ralph-loop` (from the ralph-wiggum plugin):

1. Write a **prompt file** in `docs/prompts/` (see existing prompts for format)
2. Ensure `.claude/settings.local.json` has the required Bash permissions pre-approved
3. Invoke: `/ralph-loop <short pointer to prompt file> --max-iterations N --completion-promise "PHASEX_COMPLETE"`

**How it works:** A Stop hook intercepts exit, checks for the completion promise, and re-feeds the same prompt. Each iteration starts with fresh context but sees prior work via files and git history.

**Prompt file conventions:**

- The ralph-loop prompt arg is a short pointer (1-2 sentences). The full spec lives in `docs/prompts/`.
- The prompt file references the proposal and spec files by path — Claude reads them on each iteration.
- Include an **Iteration Protocol** (assess → pick next step → implement → verify).
- Include a **Quality Checklist** that must pass before the completion promise fires.
- Keep the prompt file self-contained: context paths, implementation order, constraints, quality gates.

See `docs/learnings/002-ralph-loop-conventions.md` for full details.

### Available Review Agents

For thorough PR reviews, use these compound-engineering agents (via `/workflows:review` or directly):

- `kieran-typescript-reviewer` — TypeScript quality and patterns
- `security-sentinel` — security audit (OWASP, auth, secrets)
- `performance-oracle` — performance bottlenecks and complexity
- `pattern-recognition-specialist` — codebase consistency
- `code-simplicity-reviewer` — YAGNI and simplification
- `architecture-strategist` — structural review

### PR Review with Plugin

Prefer `/workflows:review` over manual review. It runs multi-agent analysis in worktrees. For addressing review comments, use the `pr-comment-resolver` agent.

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

## CI/CD & Git Workflow

- **Branch model**: Feature branches → PR to `main`. No direct pushes to `main`.
- **Commit format**: Conventional Commits enforced by commitlint.
  - `<type>(<scope>): <description>`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `revert`
  - Scopes: `web`, `mobile`, `api`, `db`, `types`, `i18n`, `tooling`, `ci`, `docs`, `deps`, `release`
- **Pre-commit**: Lefthook runs lint-staged (prettier + eslint on staged files).
- **CI**: GitHub Actions — 4 parallel jobs: typecheck, lint, build, format.
- **PR review**: `/workflows:review` (compound-engineering plugin) or `./scripts/review-pr.sh [PR_NUMBER]`.
- **Formatting**: Prettier via `@sanctuary/prettier-config` (semi, trailingComma, printWidth: 100).
- **Releases**: `multi-semantic-release` on merge to main — independent per-package versioning with auto-generated GitHub Releases.

See `docs/decisions/008-cicd-workflow.md` for full rationale.

## Data Model

Core entities: Taxon, Individual, Observation, PhenologyEvent, PhenologyEventType, Media, User, Property.

See `docs/proposals/001-product-proposal.md` for full schema.
See `docs/standards/darwin-core-reference.md` for standards alignment.
