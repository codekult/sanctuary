# ADR-002: Next.js as Web Framework

**Status**: Accepted
**Date**: 2026-03-03

## Context

The web layer serves two distinct purposes:
1. **Backoffice** — authenticated admin interface for managing data (interactive, dynamic)
2. **Public library** — read-only catalogue for public browsing (needs SEO, fast loads)

Options considered:
- **Next.js (App Router)** — SSR for public pages (SEO), server components for performance, server actions for mutations, API routes for mobile. One framework covers both use cases.
- **Remix** — similar SSR capabilities, good data loading patterns. Smaller ecosystem, less deployment flexibility.
- **SPA (Vite + React)** — simple for backoffice, but poor SEO for public library without additional SSR setup.
- **Separate apps** — one SPA for backoffice, one SSR framework for public. More complexity, two deployments.

## Decision

Use Next.js 15 with App Router for both the backoffice and public library in a single application.

## Consequences

- **Positive**: SSR/SSG for public pages gives excellent SEO and performance. Server components reduce client JS bundle. Server actions simplify form handling in backoffice.
- **Positive**: Single deployment on Vercel with zero config. Route groups cleanly separate `/admin/*` from public routes.
- **Negative**: App Router has a learning curve (server vs. client components, caching model). Some community patterns are still stabilizing.
- **Accepted tradeoff**: Complexity of the App Router mental model is worth the unified deployment and SEO benefits.
