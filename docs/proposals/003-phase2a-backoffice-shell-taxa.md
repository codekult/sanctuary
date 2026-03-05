# Proposal 003 — Phase 2a: Backoffice Shell + Taxa Management

**Status**: Proposed
**Date**: 2026-03-04
**Depends on**: [001-product-proposal](./001-product-proposal.md), [002-phase1-foundation](./002-phase1-foundation.md)

## Goal

Build the backoffice shell (auth, layout, navigation) and the first CRUD module (taxa), including GBIF/iNaturalist search-and-import. At the end of this phase, an authenticated admin can log in, browse a taxa data table, create/edit/delete taxa manually, and import taxa from iNaturalist — all within a polished, responsive admin layout.

## Scope

### Included

- Tailwind CSS + shadcn/ui component system
- Auth flow: login page, session handling, protected routes, logout
- Backoffice layout: sidebar navigation, header with user info, responsive
- Taxa list page: data table with sorting, filtering (kingdom, rank, search text), pagination
- Taxa detail/edit page: form with all taxon fields, save/delete
- Taxa create page: manual entry form
- iNaturalist search modal: search external API, preview results, import selected taxon
- Toast notifications for success/error feedback
- Loading states and error boundaries

### Excluded (future slices)

- Individuals CRUD (Phase 2b)
- Observations CRUD (Phase 2c)
- Media upload (Phase 2c)
- Phenology events (Phase 4)
- Property map (Phase 2d)
- Dashboard (Phase 2e)
- Public library (Phase 3)

---

## Technical Specification

### 1. UI Stack Setup

**Tailwind CSS**:

- Install `tailwindcss`, `@tailwindcss/postcss`, `postcss` in `apps/web`
- Configure `postcss.config.mjs` with `@tailwindcss/postcss` plugin
- Create `src/app/globals.css` with `@import "tailwindcss"`
- Import globals.css in root layout

**shadcn/ui**:

- Initialize with `bunx shadcn@latest init` (New York style, neutral palette, CSS variables)
- Install components as needed: `button`, `input`, `label`, `textarea`, `select`, `table`, `dialog`, `dropdown-menu`, `sheet`, `toast`, `sonner`, `badge`, `card`, `separator`, `skeleton`, `command`, `popover`, `form`
- shadcn/ui components live in `src/components/ui/` (default)
- Custom components live in `src/components/` (not in `ui/`)

**TanStack Table**:

- Install `@tanstack/react-table` in `apps/web`
- Build a reusable `DataTable` component wrapping shadcn's table with TanStack Table

**React Hook Form + Zod**:

- Install `react-hook-form`, `@hookform/resolvers` in `apps/web`
- Forms validate using the existing Zod schemas from `@sanctuary/types`
- Use shadcn's `<Form>` component (wraps react-hook-form)

### 2. Auth Flow

**Login page** (`/login`):

- Email + password form
- Calls Supabase Auth `signInWithPassword`
- On success: redirect to `/admin/taxa`
- On failure: display error toast
- Unauthenticated users visiting `/admin/*` are redirected to `/login`

**Middleware** (`src/middleware.ts`):

- Check Supabase session on every `/admin/*` request
- If no session → redirect to `/login`
- If session → continue (attach user to request)

**Logout**:

- Button in the sidebar/header
- Calls Supabase Auth `signOut`
- Redirects to `/login`

**Session handling**:

- Use `@supabase/ssr` for server-side session management (already installed)
- Refresh session on every server request via middleware

### 3. Backoffice Layout

**Route structure**:

```
src/app/
  (auth)/
    login/page.tsx          # Login page (public)
  admin/
    layout.tsx              # Backoffice shell (sidebar + header)
    taxa/
      page.tsx              # Taxa list (data table)
      new/page.tsx          # Create taxon
      [id]/page.tsx         # View/edit taxon
```

**Sidebar** (`src/components/admin-sidebar.tsx`):

- Logo/app name at top
- Navigation links (only "Taxa" is active in this phase; others shown as disabled/coming soon):
  - Taxa (active)
  - Individuals (disabled)
  - Observations (disabled)
  - Phenology (disabled)
  - Media (disabled)
  - Property (disabled)
- Collapse button for mobile
- User info + logout at bottom

**Header** (`src/components/admin-header.tsx`):

- Page title (dynamic, based on current route)
- Mobile sidebar toggle (hamburger)
- Breadcrumbs (optional — only if naturally fits)

**Responsive behavior**:

- Desktop: persistent sidebar (240px) + content area
- Mobile: sidebar as sheet/drawer, toggle via hamburger

### 4. Taxa List Page

**Data table features**:

- Columns: thumbnail (small image), scientific name, common name (EN), kingdom, rank, source (badge: manual/iNaturalist), actions
- Sorting: by scientific name, common name, kingdom, rank, created date
- Filtering:
  - Text search (scientific name + common name, debounced)
  - Kingdom dropdown filter
  - Rank dropdown filter
- Pagination: 25 rows per page, server-side
- Row click → navigate to taxon detail page
- Actions column: edit, delete (with confirmation dialog)

**Empty state**: Friendly message with CTA to create or import a taxon.

**API**: Uses `taxon.list` tRPC endpoint. Server-side pagination — send `page`, `limit`, `search`, `kingdom`, `rank` params.

### 5. Taxa Create/Edit Pages

**Form fields** (matching Taxon schema):

- Scientific name (required)
- Common name EN
- Common name ES
- Taxon rank (required, select dropdown)
- Kingdom (required, select dropdown)
- Phylum, Class, Order, Family, Genus, Specific epithet (optional text fields, collapsible "Taxonomy details" section)
- Description EN (textarea)
- Description ES (textarea)
- Conservation status (optional text)
- Thumbnail URL (optional — text input for now, image upload in Phase 2c)
- External ID and External Source (read-only, shown only if imported)

**Validation**: Uses `createTaxonSchema` / `updateTaxonSchema` from `@sanctuary/types` via react-hook-form Zod resolver.

**Behavior**:

- Create: POST via `taxon.create`, redirect to list on success, toast confirmation
- Edit: pre-populate form, PATCH via `taxon.update`, toast on success
- Delete: confirmation dialog, DELETE via `taxon.delete`, redirect to list

### 6. iNaturalist Search & Import

**Trigger**: "Import from iNaturalist" button on the taxa list page.

**Modal/dialog flow**:

1. Open dialog with search input
2. User types a species name → debounced call to `taxon.searchExternal` tRPC endpoint (which calls iNaturalist API)
3. Results displayed as cards: thumbnail, scientific name, common name, rank, kingdom
4. User clicks "Import" on a result → calls `taxon.importFromExternal` tRPC endpoint
5. On success: close dialog, refresh table, toast "Taxon imported successfully"
6. On failure: show error inline in dialog

**Search result card**: thumbnail image (or placeholder), scientific name (italic), common name, rank badge, kingdom badge.

### 7. Shared Components to Build

These are project-specific components (NOT shadcn/ui primitives):

- `DataTable` — reusable TanStack Table + shadcn table wrapper with sorting, filtering, pagination
- `DataTableColumnHeader` — sortable column header
- `DataTablePagination` — pagination controls
- `DataTableToolbar` — search input + filter dropdowns
- `ConfirmDialog` — "Are you sure?" dialog for destructive actions
- `PageHeader` — page title + optional action buttons
- `EmptyState` — empty table/list placeholder with icon and CTA

### 8. tRPC Client Updates

The existing tRPC client (`src/lib/trpc/`) needs to work with React Query for client-side data fetching:

- Server components: use the existing `serverClient` (direct call)
- Client components: use `trpc.taxon.list.useQuery()` etc. via the React Query provider (already wired in `provider.tsx`)

Ensure the tRPC React Query provider is properly set up in the root layout.

---

## Deliverables Checklist

- [ ] Tailwind + shadcn/ui fully configured and working
- [ ] Login page works (email + password via Supabase Auth)
- [ ] Unauthenticated users redirected to `/login`
- [ ] Backoffice layout: sidebar with navigation, responsive
- [ ] Taxa list page with data table (sort, filter, paginate)
- [ ] Taxa create page with validated form
- [ ] Taxa edit page with pre-populated form
- [ ] Taxa delete with confirmation dialog
- [ ] iNaturalist search and import working in UI
- [ ] Toast notifications for all user actions
- [ ] Loading skeletons for async data
- [ ] Empty states for no-data scenarios
- [ ] `bun run build` succeeds
- [ ] `bun run typecheck` succeeds
- [ ] `bun run lint` succeeds
- [ ] `bun run format:check` succeeds

---

## Open Questions

1. **Color theme**: Use shadcn's default neutral theme for now? Can be customized later.
2. **Dark mode**: Skip for now? Add in Phase 6 (Polish).

Both are deferred — defaults are fine for MVP.
