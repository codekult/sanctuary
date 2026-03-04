# Common Frontend & API Pitfalls

Patterns that surfaced during the Phase 2a taxa management PR review. These are easy to introduce and easy to miss — check for them in every new feature.

## Debounce in React Event Handlers

**Problem:** A debounce pattern that returns a cleanup function only works inside `useEffect`. When called from an `onChange` handler, the returned cleanup is discarded, so every keystroke schedules a new timeout and none are cleared.

**Fix:** Store the timeout in a `useRef` and call `clearTimeout` at the top of the callback:

```ts
const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

const handleSearchChange = useCallback((value: string) => {
  setValue(value);
  clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => setDebouncedValue(value), 300);
}, []);
```

**Prevention:** When writing any debounce logic, ask: "Where is the cleanup called?" If it's not `useEffect`, use `useRef`.

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

## zodResolver Type Depth Issue

**Problem:** `zodResolver(schema)` causes "Type instantiation is excessively deep" with schemas that have many nullable fields. This is a known issue between `@hookform/resolvers`, `react-hook-form`, and `zod`.

**Workaround:** Use `zodResolver(schema as any) as any` with an explanatory comment. The runtime behavior is correct; only the type inference breaks.
