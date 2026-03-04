# ADR-001: TypeScript Full-Stack

**Status**: Accepted
**Date**: 2026-03-03

## Context

Sanctuary needs a web backoffice, a public library, and a mobile app. We need to choose a primary language and ecosystem that spans all three.

Options considered:
- **Ruby on Rails** — excellent for rapid web development, but no native mobile story. Would require a separate stack for the mobile app and lose type sharing.
- **Python (Django/FastAPI)** — strong backend, but same mobile gap as Rails. No shared types with a JS/TS frontend.
- **TypeScript full-stack** — one language across web (Next.js), mobile (React Native), and API layer. Shared types, validation schemas, and business logic.

## Decision

Use TypeScript across the entire stack.

## Consequences

- **Positive**: Shared types between web, mobile, and API eliminate an entire class of bugs. One language to maintain. Strong ecosystem for all three targets. Excellent portfolio signal (modern, in-demand stack).
- **Positive**: Can share Zod validation schemas, tRPC routers, and utility code across apps via monorepo packages.
- **Negative**: TypeScript tooling can be complex (build configs, module resolution). More boilerplate than Rails for simple CRUD.
- **Accepted tradeoff**: We trade Rails' convention-over-configuration speed for cross-platform type safety and code sharing.
