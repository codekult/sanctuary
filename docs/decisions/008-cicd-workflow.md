# ADR 008: CI/CD Workflow

**Status**: Accepted

## Context

Phase 1 code is complete. We need a professional development workflow that supports:

- Automated quality checks on every PR
- Consistent code formatting across the team
- Conventional commit messages for automated changelogs
- Pre-commit hooks that don't block autonomous Ralph Loop execution
- Local Claude-powered PR reviews

## Options Considered

### Git Hooks

| Option               | Pros                                                       | Cons                                                             |
| -------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| **Husky**            | Popular, well-known                                        | Relies on npm `prepare` script — Bun doesn't execute it reliably |
| **Lefthook**         | Single binary, YAML config, works with any package manager | Less widespread                                                  |
| **simple-git-hooks** | Minimal                                                    | Limited configuration                                            |

### Commit Convention

| Option                                | Pros                                                | Cons                                    |
| ------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| **Conventional Commits + commitlint** | Standard, tooling ecosystem, enables auto-changelog | Requires learning format                |
| **No enforcement**                    | Zero friction                                       | Inconsistent history, no auto-changelog |

### CI

| Option             | Pros                                    | Cons                    |
| ------------------ | --------------------------------------- | ----------------------- |
| **GitHub Actions** | Native to GitHub, free for public repos | Vendor lock-in          |
| **External CI**    | Portable                                | Extra service to manage |

### PR Review

| Option                         | Pros                                                               | Cons                                        |
| ------------------------------ | ------------------------------------------------------------------ | ------------------------------------------- |
| **Local Claude CLI script**    | Uses existing Claude Code access, no API key needed, project-aware | Requires manual or scripted invocation      |
| **GitHub Action with API key** | Fully automated                                                    | Requires API key, costs money, less context |

## Decision

- **Lefthook** for git hooks — works reliably with Bun
- **lint-staged** in pre-commit — runs prettier + eslint on staged files only
- **commitlint** with `@commitlint/config-conventional` in commit-msg hook
- **Typecheck NOT in pre-commit** — too slow, would block Ralph Loop; runs in CI only
- **GitHub Actions CI** with 4 parallel jobs: typecheck, lint, build, format
- **Local review script** (`scripts/review-pr.sh`) using Claude Code CLI
- **Branch protection** on main: require CI + 1 approval, no force pushes

### Conventional Commit Scopes

`web`, `mobile`, `api`, `db`, `types`, `i18n`, `tooling`, `ci`, `docs`, `deps`

## Consequences

- Every commit is formatted and linted automatically
- Bad commit messages are rejected locally before push
- CI catches type errors and build failures that pre-commit skips for speed
- PRs get Claude review with project-specific criteria
- Ralph Loop can commit freely as long as it uses conventional commit format
- Developers must install hooks via `bun install` (postinstall runs `lefthook install`)
