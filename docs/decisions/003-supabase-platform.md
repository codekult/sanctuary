# ADR-003: Supabase as Backend Platform

**Status**: Accepted
**Date**: 2026-03-03

## Context

We need: PostgreSQL database, user authentication (multi-admin with invite flow), and S3-compatible image storage. These could be provisioned separately or via a unified platform.

Options considered:

- **Supabase** — managed Postgres + Auth + Storage + Realtime in one platform. Generous free tier. Self-hostable if needed later.
- **Neon (DB) + Auth.js + Cloudflare R2** — best-of-breed for each concern. More flexible, but more integration work and more accounts to manage.
- **PlanetScale + Clerk + S3** — MySQL-based (not Postgres), adds cost for auth.
- **Self-hosted Postgres + custom auth** — maximum control, maximum maintenance burden.

## Decision

Use Supabase for database, authentication, and image storage.

## Consequences

- **Positive**: Single platform, single dashboard, single billing. Auth, storage, and DB are co-located and pre-integrated. Generous free tier covers the MVP and beyond.
- **Positive**: Supabase Storage provides automatic image transforms (thumbnails, resizing) — eliminates need for a separate image processing pipeline.
- **Positive**: Self-hostable via Docker if we ever need to migrate away from the hosted service.
- **Negative**: Vendor coupling — auth, storage, and DB are all tied to Supabase's APIs. Migration would require replacing multiple pieces.
- **Negative**: Supabase's auth has some rough edges compared to dedicated auth providers.
- **Accepted tradeoff**: Platform convenience and cost savings outweigh vendor lock-in risk for a personal/portfolio project. The escape hatch (self-hosting or migration) exists if needed.
