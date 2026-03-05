# Common Frontend & API Pitfalls

Patterns that surfaced during the Phase 2a taxa management PR review. These are easy to introduce and easy to miss — check for them in every new feature.

## Debounce in React: Always Use a Hook

**Problem:** Manual debounce with `useRef` + `setTimeout` in event handlers is error-prone: easy to forget unmount cleanup (causing stale state updates), and duplicated across components.

**Fix:** Extract a `useDebouncedValue` hook that handles cleanup automatically via `useEffect`:

```ts
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

**Rule:** Never write manual debounce logic in components. Always use this hook. It handles cleanup on unmount automatically.

## Paginated Queries Need Deterministic Ordering

**Problem:** Pagination without `ORDER BY` means rows can shift between pages or be duplicated/skipped when the DB planner changes strategy.

**Fix:** Always add an `ORDER BY` clause to any paginated query — even if the UI doesn't expose sorting controls yet.

## External API Integration Checklist

When integrating with external APIs (like iNaturalist), always include:

1. **Error handling on fetch:** Check `response.ok` before calling `.json()`. Return a user-friendly error.
2. **Input validation:** External data may not match your schema (e.g., iNaturalist ranks like `"hybrid"` that aren't in the DB enum). Validate before insert.
3. **Duplicate prevention:** Check if the record already exists before inserting (by external ID + source). Either use `ON CONFLICT` or a pre-check query.
4. **Access control:** External API proxies should use `protectedProcedure` unless there's a specific reason to expose them publicly.

## Shared Constants Over Local Duplicates

**Problem:** Kingdom lists and rank lists were defined in multiple components. They drift out of sync.

**Fix:** Export canonical constants from `@sanctuary/types` (e.g., `KINGDOMS`, `TAXON_RANKS`). Derive from Zod enums where possible (`taxonRankEnum.options`).

## Package Boundary Discipline

**Problem:** The web app had `drizzle-orm` as a direct dependency even though DB access should go through the API layer.

**Fix:** Re-export commonly used operators (`eq`, `and`, `or`, `sql`, etc.) from `@sanctuary/db`. The web app should only import from `@sanctuary/db`, never from `drizzle-orm` directly.

**Rule:** If a package is an implementation detail of another package, it should not appear in consumer `package.json`. Re-export what consumers need.

## Module-Scope Initialization in Next.js

**Constraint:** In Next.js with `"use client"` components, module-scope code runs during SSR/prerendering. `createSupabaseBrowserClient()` requires browser env vars that aren't available at build time, so it cannot be moved to module scope.

**Rule:** Only move client initialization to module scope if the constructor is safe to call without browser APIs/env vars. When in doubt, keep it inside the component or a `useEffect`.

## Prefer Server Components for Auth Data

**Problem:** Using `useEffect` + `getUser()` in a client-component layout causes an extra client-side round-trip and a flash of empty state (e.g., sidebar shows no email until the promise resolves). The middleware already verified the user — this is redundant work.

**Fix:** Make the layout a server component (`async function`) that reads user info via `createSupabaseServerClient()`, then passes it as props to a client shell component. This eliminates the flash and the extra request.

**Pattern:**

```tsx
// layout.tsx — server component
export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <AdminShell userEmail={user?.email ?? null}>{children}</AdminShell>;
}

// admin-shell.tsx — client component ("use client")
export function AdminShell({ userEmail, children }) {
  /* interactive UI */
}
```

**Rule:** If a layout only needs auth data for display (not for interactivity), read it server-side and pass down. Reserve client-side auth calls for mutations (sign-out, sign-in).

## zodResolver Type Depth Issue

**Problem:** `zodResolver(schema)` causes "Type instantiation is excessively deep" with schemas that have many nullable fields. This is a known issue between `@hookform/resolvers`, `react-hook-form`, and `zod`.

**Workaround:** Use `zodResolver(schema) as unknown as Resolver<FormValues>` — narrower and more intentional than double `as any`. Import `Resolver` from `react-hook-form`.

## ILIKE Pattern Injection

**Problem:** Drizzle parameterizes ILIKE values (no SQL injection), but `%` and `_` are ILIKE wildcards. A search for `%` returns all rows; `___` matches any 3-char name.

**Fix:** Escape ILIKE meta-characters before interpolation:

```ts
function escapeIlike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}
```

**Rule:** Always escape user input used in ILIKE/LIKE patterns.

## URL Path Construction with User Input (SSRF)

**Problem:** Interpolating user input into URL paths (e.g., `fetch(\`https://api.example.com/v1/${input.id}\`)`) allows path traversal (`../../other-endpoint`) or query injection (`123?param=value`).

**Fix:** Validate the input format strictly. For numeric IDs: `z.string().regex(/^\d+$/)`.

**Rule:** Any user input that becomes part of a URL path must be validated against a strict allowlist or pattern.

## syncUser Performance: Upsert + In-Memory Cache

**Problem:** Running a SELECT on every authenticated tRPC request to check if a user exists adds unnecessary DB round-trips.

**Fix:** Use `INSERT ... ON CONFLICT DO NOTHING` (one query, idempotent) plus a module-level `Set<string>` to skip the DB entirely for repeat requests. The Set resets on cold start — acceptable for invite-only.

## Non-Null Assertions on Auth Data

**Problem:** `user.email!` passes `undefined` into the DB if a user signs in via a provider without email.

**Fix:** Guard with `if (!user.email) return createContext(db, null)` before using the value.

**Rule:** Never use `!` on Supabase auth fields — they can be absent depending on the auth provider.

## Form Schemas: Derive, Don't Duplicate

**Problem:** Defining a form schema separately from the shared Zod schema causes silent drift — fields can be added to the API schema without the form knowing.

**Fix:** Import and use the shared `createTaxonSchema` directly in the form. This ensures validation is consistent between client and server.

**Rule:** Form schemas should derive from (or be identical to) the shared API schemas in `@sanctuary/types`.

## Use Inferred Types from tRPC, Not Manual Interfaces

**Problem:** Manually defining `interface TaxonRow { ... }` for API data silently drifts if the API changes.

**Fix:** Use `type TaxonRow = RouterOutputs["taxon"]["list"]["items"][number]`. Export `RouterOutputs` from the tRPC client setup.

## Database Indexes for Common Query Patterns

**Rule:** Always add indexes for:

- Columns used in `WHERE` filters (kingdom, taxon_rank)
- Columns used in `ORDER BY` (scientific_name)
- Composite unique constraints for business rules (external_id + external_source)

Add them when creating the table, not as an afterthought.

## Delete Mutations: Check for Dependents

**Problem:** Deleting a parent record with FK-dependent children throws an opaque DB error.

**Fix:** Pre-check for dependents and return a clear user-facing message:

```ts
const [dep] = await ctx.db.select({ count: sql`count(*)::int` }).from(children).where(...);
if (dep && dep.count > 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "..." });
```

## A11y: Icon-Only Buttons Need Labels

**Rule:** Any `<Button>` with only an icon (no visible text) must have `aria-label`. Disabled nav items should use `<button disabled>` not `<span>` for proper semantics.

## Login Page: Use `router.replace` After Auth

**Rule:** After successful login, use `router.replace("/admin/...")` not `router.push(...)` so `/login` doesn't stay in the back-navigation stack.
