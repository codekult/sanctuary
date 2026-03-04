# ADR-006: tRPC API Layer

**Status**: Accepted
**Date**: 2026-03-03

## Context

The mobile app and web backoffice both need to communicate with the same backend logic. We need an API layer that serves both clients with type safety.

Options considered:

- **tRPC** — end-to-end type-safe RPC. No code generation, no schema files. Types flow from server to client via TypeScript inference. Works with Next.js API routes.
- **REST (Next.js API routes)** — simple, well-understood. No automatic type sharing — requires manual typing or code generation (e.g., OpenAPI + codegen).
- **GraphQL** — flexible queries, strong schema. Heavy setup (schema definition, resolvers, codegen). Overkill for a single-consumer API.

## Decision

Use tRPC for the API layer, hosted within Next.js API routes.

## Consequences

- **Positive**: Type changes in the API router are immediately reflected in both web and mobile clients — zero codegen, zero drift.
- **Positive**: Zod validators defined once in the shared `types` package are used for both tRPC input validation and client-side form validation.
- **Positive**: tRPC's React Query integration gives caching, optimistic updates, and loading states out of the box.
- **Negative**: tRPC is tightly coupled to TypeScript clients. If we ever need a non-TS consumer (e.g., a third-party integration), we'd need to add REST endpoints alongside.
- **Negative**: Less discoverable than REST or GraphQL for external developers.
- **Accepted tradeoff**: Both our consumers (web and mobile) are TypeScript. The type safety benefits far outweigh the lack of external API discoverability, which we don't need for MVP.
