# ADR-004: Drizzle ORM

**Status**: Accepted
**Date**: 2026-03-03

## Context

We need a TypeScript ORM to interact with PostgreSQL. The ORM must support type-safe queries, migrations, and work well with Supabase's Postgres instance.

Options considered:
- **Drizzle ORM** — lightweight, SQL-like API, excellent TypeScript inference, schema-as-code, fast migrations. Generates raw SQL that's easy to inspect.
- **Prisma** — most popular TS ORM. Declarative schema (`.prisma` file), auto-generated client. Heavier runtime, query engine binary, slower cold starts on serverless.
- **Kysely** — type-safe query builder (not a full ORM). Very lightweight but requires more manual work for migrations and relations.
- **Raw SQL + pg** — maximum control, no abstraction overhead. No type safety without manual typing.

## Decision

Use Drizzle ORM.

## Consequences

- **Positive**: Schema defined in TypeScript — no separate schema language, full IDE support. Inferred types flow directly to tRPC and frontend.
- **Positive**: Lightweight — no query engine binary, fast serverless cold starts on Vercel.
- **Positive**: SQL-like API means the abstraction is thin and predictable. Easy to reason about generated queries.
- **Negative**: Smaller ecosystem than Prisma. Fewer tutorials, fewer community examples.
- **Negative**: Relational queries API is newer and less battle-tested than Prisma's includes.
- **Accepted tradeoff**: We prefer the lighter runtime and SQL-transparency over Prisma's larger ecosystem. For a project this size, Drizzle's relational features are sufficient.
