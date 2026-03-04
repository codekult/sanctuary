# Monorepo Setup with Bun + Turborepo

## Problem

Setting up a monorepo with Bun workspaces and Turborepo requires careful attention to:

1. **`packageManager` field**: Turborepo v2.8+ requires `"packageManager": "bun@x.y.z"` in root `package.json` to resolve workspaces.

2. **ESLint in monorepos**: Each package needs `eslint` as a direct devDependency even when using a shared config, because turbo runs scripts in isolated package dirs where only direct dependencies are available in `$PATH`.

3. **`@types/bun` vs `@types/node`**: Packages that reference `process.env` or other Node/Bun globals need either `@types/bun` (for packages) or `@types/node` (for Next.js apps). Next.js auto-detects and tries to install `@types/node` using `npm` — if `npm` isn't installed (bun-only env), pre-install it as a devDependency.

4. **ESLint plugin resolution in Next.js monorepos**: When using `eslint-config-next` with bun workspaces, peer dependencies like `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`, and `@eslint/eslintrc` must be explicit devDependencies in the web app package.

5. **TypeScript module setting**: Use `"module": "ESNext"` (not `"ES2022"`) in the shared tsconfig to support import attributes (`with { type: "json" }`) for JSON imports.

6. **Lazy DB initialization**: The Drizzle client throws if `DATABASE_URL` is missing. For Next.js builds (where env vars aren't available at bundle time), use lazy initialization via a Proxy or getter function, and mark API routes as `dynamic = "force-dynamic"`.

7. **`.js` extensions**: Internal packages use `.js` extensions in imports (ESM convention). Next.js/webpack apps should NOT use `.js` extensions for local imports — webpack resolves `.ts`/`.tsx` directly.

## What Worked

- Bun workspaces with `workspace:*` protocol
- Shared tsconfig and eslint via `tooling/` workspace
- Turborepo for orchestrating builds with dependency-aware caching
- `drizzle-kit push` for schema sync (faster than migrations during dev)
