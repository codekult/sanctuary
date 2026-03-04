# ADR-007: Bun as Runtime and Package Manager

**Status**: Accepted
**Date**: 2026-03-04
**Supersedes**: Parts of ADR-005 (pnpm workspaces → bun workspaces)

## Context

The developer environment has Bun installed but not Node.js. Rather than installing Node.js, we evaluated using Bun as both the JavaScript runtime and package manager.

Options considered:

- **Install Node.js + pnpm** — the originally planned stack. Proven, widely documented. Requires additional installation.
- **Bun** — already installed. Built-in package manager (replaces pnpm), faster installs, faster runtime, built-in test runner. Works with Turborepo workspaces, Next.js, and Drizzle.

## Decision

Use Bun as the runtime and package manager. Replace pnpm workspaces with bun workspaces. Keep Turborepo as the monorepo build orchestrator.

## Consequences

- **Positive**: Zero additional installation needed — bun is already present. Significantly faster package installs and script execution. Built-in test runner eliminates need for Vitest/Jest.
- **Positive**: `bun.lockb` is a binary lockfile — faster to parse than `pnpm-lock.yaml`.
- **Positive**: Turborepo supports bun workspaces natively.
- **Negative**: Expo/React Native has partial bun support — we may need to use `bunx expo` or fall back to npx for some Expo CLI commands. To be evaluated in Phase 5.
- **Negative**: Some Next.js edge cases may behave differently under bun vs Node.js. Unlikely to affect us, but worth noting.
- **Accepted tradeoff**: Slight ecosystem risk in exchange for simpler DX and faster tooling. If we hit bun-specific issues, Node.js can be installed as a fallback without changing application code.
