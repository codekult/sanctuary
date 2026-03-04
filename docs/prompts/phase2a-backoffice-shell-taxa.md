# Phase 2a: Backoffice Shell + Taxa Management — Ralph Loop Prompt

> **Status**: Not started
>
> Invoke with:
>
> ```
> /ralph-loop Read and implement docs/prompts/phase2a-backoffice-shell-taxa.md exactly. Assess progress each iteration then continue from where you left off. --max-iterations 30 --completion-promise "PHASE2A_COMPLETE"
> ```

---

## Context

You are building **Sanctuary**, a biodiversity tracking platform. Before doing ANY work on each iteration, read these files:

1. `CLAUDE.md` — project conventions, coding standards, CI/workflow
2. `docs/proposals/001-product-proposal.md` — full product proposal and data model
3. `docs/proposals/003-phase2a-backoffice-shell-taxa.md` — detailed spec for this phase
4. `docs/decisions/` — all ADRs (especially 007-bun-runtime, 008-cicd-workflow)
5. `docs/learnings/` — solved problems (especially 001-monorepo-bun-turborepo)

**Runtime**: Bun only. Use `bun install`, `bun run`, `bunx`. NOT npm, npx, node.

## Task

Implement Phase 2a: Backoffice shell (auth, layout, navigation) and taxa CRUD with iNaturalist search/import. All work happens in `apps/web/`.

## Deliverable

A single feature branch with conventional commits, ready for PR to `main`. When all steps are complete and the quality checklist passes:

1. Create branch `feat/phase2a-backoffice-taxa` (if not already on it)
2. Ensure all work is committed with conventional commit messages
3. Push the branch and create a PR to `main` using `gh pr create`
4. Then output `<promise>PHASE2A_COMPLETE</promise>`

Do NOT merge the PR. The owner will review and merge.

## Iteration Protocol

This prompt runs in a Ralph Loop. On each iteration:

1. **Assess progress**: Check what's been done by reading files and running `bun run build`, `bun run typecheck`, `bun run lint`, `bun run format:check`
2. **Pick the next incomplete step** from the Implementation Order below
3. **Implement it**, then **verify it compiles and builds** before moving on
4. **If a step fails**: debug, fix, and re-verify in the same iteration
5. **Commit completed steps** with conventional commit messages (e.g., `feat(web): add tailwind and shadcn/ui setup`)
6. **After all steps pass**: run the full Quality Checklist, fix any failures, push branch, create PR, then output the completion promise

Do NOT output the completion promise until every item in the Quality Checklist passes AND the PR is created.

## Implementation Order

Work through these sequentially. Skip steps already complete from previous iterations.

### Step 0: Environment safeguards

- Ensure SSH key is loaded for git push: `ssh-add ~/.ssh/id_ed25519_codekult 2>/dev/null || true`
- Verify git identity: `git config user.email` should be `codekult@gmail.com`
- Verify gh CLI: `gh auth status` should show `codekult`
- **If any fail**: stop and report. Do not proceed without these.

### Step 1: Create feature branch

- `git checkout main && git pull origin main`
- `git checkout -b feat/phase2a-backoffice-taxa`
- **Verify**: on the correct branch

### Step 2: Tailwind CSS setup

- Install `tailwindcss`, `@tailwindcss/postcss`, `postcss` as devDeps in `apps/web`
- Create `apps/web/postcss.config.mjs`:
  ```js
  const config = { plugins: { "@tailwindcss/postcss": {} } };
  export default config;
  ```
- Create `apps/web/src/app/globals.css` with `@import "tailwindcss";`
- Import `globals.css` in `src/app/layout.tsx`
- **Verify**: `bun run build` succeeds in apps/web, Tailwind classes work

### Step 3: shadcn/ui setup

- Run `bunx shadcn@latest init -d -y --base-color neutral` in `apps/web` (non-interactive: defaults + neutral palette)
- If init fails, manually configure: create `components.json`, add CSS variables to `globals.css`, create `src/lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
- Install initial components: `bunx shadcn@latest add button input label textarea select dialog dropdown-menu sheet sonner badge card separator skeleton form table popover command`
- **Verify**: `bun run build` succeeds, a test button with shadcn styling renders

### Step 4: User sync in tRPC context

The tRPC context (`packages/api/src/trpc.ts` or the route handler in `apps/web/src/lib/trpc/server.ts`) reads the Supabase Auth session but does NOT auto-create a row in the `users` table. Fix this:

- In the tRPC route handler (`apps/web/src/lib/trpc/server.ts`), after getting the Supabase Auth user, upsert a row into the `users` table:
  - If user exists in `users` table → use it
  - If not → insert with `id` = Supabase Auth user ID, `email`, `name` (from email prefix or Supabase metadata), `role` = "contributor" (default)
- This ensures the first login always works regardless of seed data
- **Verify**: `bun run typecheck` passes
- **Commit**: `feat(api): add user sync on authenticated requests`

### Step 5: Auth flow

- Create `src/lib/supabase/client.ts` — browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`
- Create `src/middleware.ts`:
  - Use `@supabase/ssr` to check session on `/admin/*` routes
  - No session → redirect to `/login`
  - Also refresh session on every request (Supabase SSR pattern)
- Create `src/app/(auth)/login/page.tsx`:
  - Email + password form using shadcn components
  - Calls Supabase `signInWithPassword` client-side (use browser client)
  - On success: redirect to `/admin/taxa`
  - On failure: show error message
  - If already logged in: redirect to `/admin/taxa`
- Test credentials (a real Supabase Auth user exists): `admin@sanctuary.local` / `sanctuary-dev`
- **Verify**: visiting `/admin/taxa` without a session redirects to `/login`, logging in redirects back
- **Commit**: `feat(web): add auth flow with login page and middleware`

### Step 6: Backoffice layout

- Create `src/app/admin/layout.tsx`:
  - Wraps all `/admin/*` pages
  - Sidebar + main content area
  - Fetches current user for display
- Create `src/components/admin-sidebar.tsx`:
  - App name/logo at top
  - Nav links: Taxa (active, links to `/admin/taxa`), Individuals, Observations, Phenology, Media, Property (all disabled/greyed out with "Coming soon" tooltip)
  - User info + logout button at bottom
  - Desktop: persistent sidebar (w-60)
  - Mobile: hidden by default, shown as Sheet when hamburger is clicked
- Create `src/components/admin-header.tsx`:
  - Mobile hamburger toggle
  - Page title slot
- **Verify**: layout renders with sidebar, navigation works, responsive behavior works
- **Commit**: `feat(web): add backoffice layout with sidebar navigation`

### Step 7: Data table components

- Install `@tanstack/react-table` in `apps/web`
- Create reusable table components in `src/components/data-table/`:
  - `data-table.tsx` — main wrapper: takes columns + data, renders shadcn Table with TanStack Table
  - `data-table-column-header.tsx` — sortable column header with icon
  - `data-table-pagination.tsx` — page controls (prev/next, page size, showing X of Y)
  - `data-table-toolbar.tsx` — search input + filter controls slot
- **Verify**: `bun run typecheck` passes
- **Commit**: `feat(web): add reusable data table components`

### Step 8: Taxa list page

- Create `src/app/admin/taxa/page.tsx`:
  - Fetch taxa via tRPC `taxon.list` (server-side initial load)
  - Data table with columns: thumbnail (40x40 rounded), scientific name (italic), common name EN, kingdom (badge), rank (badge), source (badge: iNaturalist/manual), actions (edit/delete dropdown)
  - Toolbar: search input (debounced), kingdom filter dropdown, rank filter dropdown
  - Server-side pagination: pass `page`, `limit`, `search`, `kingdom`, `rank` to API
  - Row click → navigate to `/admin/taxa/[id]`
  - "New taxon" button + "Import from iNaturalist" button in page header
  - Empty state when no taxa exist
  - Loading skeleton while data loads
- Create `src/components/page-header.tsx` — title + action buttons
- Create `src/components/empty-state.tsx` — icon + message + CTA button
- Update `taxon.list` tRPC endpoint if needed to support search/filter/pagination params properly (it should already support this from Phase 1, but verify and fix if needed)
- **Verify**: taxa list renders with seed data, sorting/filtering/pagination work
- **Commit**: `feat(web): add taxa list page with data table`

### Step 9: Taxa create/edit pages

- Create `src/app/admin/taxa/new/page.tsx`:
  - Form with all taxon fields per spec section 5
  - Uses react-hook-form + Zod resolver with schemas from `@sanctuary/types`
  - Install `react-hook-form` and `@hookform/resolvers` in apps/web
  - Taxonomy detail fields (phylum through specific_epithet) in a collapsible section
  - Submit → `taxon.create` tRPC mutation → redirect to list + toast
- Create `src/app/admin/taxa/[id]/page.tsx`:
  - Fetch taxon by ID via tRPC `taxon.getById`
  - Same form as create, pre-populated
  - Submit → `taxon.update` tRPC mutation → toast
  - Delete button → confirmation dialog → `taxon.delete` → redirect to list + toast
- Create `src/components/confirm-dialog.tsx` — reusable confirmation dialog
- **Verify**: create, edit, and delete all work end-to-end
- **Commit**: `feat(web): add taxa create and edit pages`

### Step 10: iNaturalist search & import

- Create `src/components/inaturalist-search-dialog.tsx`:
  - Dialog triggered by "Import from iNaturalist" button on taxa list
  - Search input (debounced) → calls `taxon.searchExternal` tRPC endpoint
  - Results displayed as cards: thumbnail (or placeholder icon), scientific name (italic), common name, rank badge, kingdom badge
  - "Import" button per result → calls `taxon.importFromExternal`
  - On success: close dialog, invalidate taxa list query, show toast
  - On failure: show inline error
  - Loading spinner while searching
  - Empty state when no results
- **Verify**: search returns results from iNaturalist, importing adds the taxon to the local DB and it appears in the list
- **Commit**: `feat(web): add iNaturalist search and import dialog`

### Step 11: Polish & toast setup

- Set up Sonner toast provider in root layout (or admin layout)
- Ensure all mutations show success/error toasts
- Add loading states (skeletons) for:
  - Taxa list while loading
  - Taxon detail while loading
  - Search results while loading
- Verify responsive design: test sidebar collapse, table scroll on mobile
- **Commit**: `chore(web): polish loading states and toast notifications`

### Step 12: Final cleanup

- Run `bun run format` to format all new code
- Run `bun run lint` and fix any issues
- Run `bun run typecheck` and fix any issues
- Run `bun run build` and fix any issues
- Ensure all changes are committed with proper conventional commit messages
- Push branch and create PR to main
- **Commit** any final fixes, then push and create PR

## Constraints

- **Bun everywhere**. Use `bun install`, `bun run`, `bunx`. NOT npm, npx, node.
- **No default exports** except for Next.js pages and layouts (which require them).
- **No `any` types**. Use proper typing everywhere.
- **Bilingual fields**: display EN fields in the UI. ES fields are editable in forms but not displayed in tables (keep tables clean).
- **Coordinate privacy**: Not relevant for taxa (no coordinates), but maintain awareness for future phases.
- **shadcn/ui components**: Use the CLI to install them (`bunx shadcn@latest add <component>`). Do not copy-paste from the website.
- **File naming**: kebab-case for all files (e.g., `admin-sidebar.tsx`, `data-table.tsx`).
- **Conventional commits**: Every commit must follow the format `<type>(<scope>): <description>`. Use scope `web` for all changes in this phase.
- **Feature branch**: All work goes on `feat/phase2a-backoffice-taxa`. Do NOT commit to `main`.
- **PR, not merge**: Create the PR but do NOT merge it. The owner reviews and merges.
- **Follow existing patterns**: Read the existing code in `apps/web/src/` and `packages/` before writing new code. Match the style.
- **Supabase client**: Use `@supabase/ssr` for server-side auth (already installed). For client-side, create a browser client helper.
- **tRPC patterns**: Server components use `serverClient` for direct calls. Client components use React Query hooks (`trpc.taxon.list.useQuery()`).

## Quality Checklist

Run ALL of these before creating the PR:

```bash
# 1. Format
bun run format

# 2. Lint
bun run lint

# 3. Type check
bun run typecheck

# 4. Build
bun run build

# 5. Format check (must pass clean after formatting)
bun run format:check
```

If ANY check fails, fix it and re-run. Only when ALL pass:

1. Commit any remaining changes
2. Push: `git push -u origin feat/phase2a-backoffice-taxa`
3. Create PR: `gh pr create --title "feat(web): add backoffice shell and taxa management" --base main`
4. Output: `<promise>PHASE2A_COMPLETE</promise>`

## After Completion (Final Iteration Only)

1. The PR description should include:
   - Summary of what was built
   - Screenshots if possible (not required in headless mode)
   - Test plan (manual steps to verify)
2. Then output the completion promise
