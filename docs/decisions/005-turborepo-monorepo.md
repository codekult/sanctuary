# ADR-005: Turborepo Monorepo

**Status**: Accepted
**Date**: 2026-03-03

## Context

The project has multiple applications (web, mobile) and shared code (types, validation, API definitions, database schema). We need a strategy for code organization and sharing.

Options considered:

- **Turborepo** — build system for JS/TS monorepos. Incremental builds, remote caching, task orchestration. Minimal config.
- **Nx** — more feature-rich monorepo tool. Dependency graph visualization, code generation, plugin system. Heavier, steeper learning curve.
- **pnpm workspaces (no build tool)** — simple workspace linking. No build orchestration or caching.
- **Separate repositories** — independent repos for web and mobile. Shared code via published npm packages.

## Decision

Use Turborepo with pnpm workspaces.

## Consequences

- **Positive**: Shared packages (`db`, `api`, `types`) are imported directly — no publish step. Type changes propagate instantly across apps.
- **Positive**: Turborepo's task caching speeds up builds. Remote caching on Vercel is free.
- **Positive**: Minimal configuration overhead compared to Nx. Convention-based.
- **Negative**: Monorepo adds initial setup complexity. Dependency management requires care (hoisting, version alignment).
- **Accepted tradeoff**: The upfront setup cost pays off immediately when sharing Drizzle schemas, Zod validators, and tRPC routers between web and mobile.
