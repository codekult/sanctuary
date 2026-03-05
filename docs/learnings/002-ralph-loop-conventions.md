# Ralph Loop & Plugin Conventions

## Plugins Overview

This project uses two complementary Claude Code plugins:

| Plugin                   | Source                 | Commands                                                                                                                                   | Purpose                                                                  |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **compound-engineering** | EveryInc (third-party) | `/workflows:brainstorm`, `/workflows:plan`, `/workflows:work`, `/workflows:review`, `/workflows:compound`, `/lfg`, `/slfg`, `/deepen-plan` | Structured workflow orchestration, specialized review agents, swarm mode |
| **ralph-wiggum**         | Anthropic (official)   | `/ralph-loop`, `/cancel-ralph`                                                                                                             | Iterative autonomous loops with fresh context per iteration              |

**They are NOT the same thing.** `/workflows:work` executes a plan within one session. `/ralph-loop` runs repeated iterations with fresh context via a Stop hook.

## When to Use Each

| Scenario                                    | Command                                         |
| ------------------------------------------- | ----------------------------------------------- |
| Interactive feature work with quality gates | `/workflows:work`                               |
| Overnight unattended implementation         | `/ralph-loop`                                   |
| Full pipeline: plan → build → review → ship | `/lfg` (sequential) or `/slfg` (parallel swarm) |
| PR code review with multi-agent analysis    | `/workflows:review`                             |
| Document learnings from solved problems     | `/workflows:compound`                           |

## Ralph Loop Mechanics

The `/ralph-loop` command (from ralph-wiggum) works via a **Stop hook**:

1. You invoke `/ralph-loop "prompt" --max-iterations N --completion-promise "DONE"`
2. The setup script writes the prompt to `.claude/ralph-loop.local.md`
3. Claude works on the task and eventually tries to exit
4. The **Stop hook** fires → checks for completion promise in transcript
5. If not complete: increments iteration counter, feeds the same prompt back
6. If complete (promise found or max iterations reached): allows exit

**Key insight:** The prompt never changes between iterations. Claude sees its prior work via modified files and git history, giving it fresh context each cycle.

## Invocation Pattern

The ralph-loop prompt arg is a **short pointer**, not the full spec:

```
/ralph-loop Read and implement docs/prompts/phase2-backoffice.md exactly. Assess progress each iteration and continue. --max-iterations 30 --completion-promise "PHASE2_COMPLETE"
```

**Do NOT use `$(cat file)`** — shell substitution is rejected by the permission checker. Put the full spec in `docs/prompts/` and reference it by path.

## Prompt File Structure

Keep prompt files in `docs/prompts/`:

```markdown
# Phase N: Title

## Context

List files to read before each iteration (CLAUDE.md, proposal, spec, etc.)

## Task

One-sentence goal.

## Iteration Protocol

1. Assess progress (build, typecheck, check what files exist)
2. Pick next incomplete step from Implementation Order
3. Implement and verify
4. If all steps pass Quality Checklist → output <promise>...</promise>

## Implementation Order

Sequential steps with verify gates.

## Constraints

Non-negotiable rules (runtime, conventions, privacy, etc.)

## Quality Checklist

Concrete commands that must all pass before completion.
```

## Permissions

Pre-approve Bash patterns in `.claude/settings.local.json` before launching unattended loops. Required patterns for a typical build phase:

```json
{
  "permissions": {
    "allow": [
      "Bash(bun *)",
      "Bash(bunx *)",
      "Bash(cd * && *)",
      "Bash(export * && *)",
      "Bash(pwd)",
      "Bash(ls *)",
      "Bash(rm -rf node_modules*)",
      "Bash(rm -rf .next*)",
      "Bash(rm -rf .turbo*)",
      "Bash(rm -rf dist*)",
      "Bash(mkdir *)",
      "Bash(git *)"
    ]
  }
}
```

## /slfg — Full Autonomous Pipeline with Swarm

`/slfg` orchestrates the entire feature lifecycle with parallelism:

1. (Optional) Activate ralph-loop if available
2. `/workflows:plan` — create implementation plan
3. `/deepen-plan` — enhance with research agents
4. `/workflows:work` in **swarm mode** — parallel agent subteams
5. `/workflows:review` + `/test-browser` — run in parallel
6. `/resolve_todo_parallel` — resolve findings
7. `/feature-video` — record walkthrough

## Compound Engineering Review Agents

Available specialized agents for thorough reviews (invoked via `/workflows:review` or directly as Agent subagent types):

- `kieran-typescript-reviewer` — TS quality, type safety, patterns
- `security-sentinel` — OWASP, auth, secrets, input validation
- `performance-oracle` — bottlenecks, DB queries, memory, scalability
- `pattern-recognition-specialist` — codebase consistency, naming, duplication
- `code-simplicity-reviewer` — YAGNI violations, simplification
- `architecture-strategist` — structural compliance, design integrity

## Lessons Learned

1. **Plugin confusion:** "compound-engineering" and "ralph-wiggum" are separate plugins from different authors. Don't confuse `/workflows:work` (single-session plan execution) with `/ralph-loop` (multi-iteration fresh-context loops).
2. **`$(cat file)` is rejected** — use a short pointer as the prompt arg, reference files by path.
3. **Pre-approve permissions** — any unapproved Bash pattern blocks the loop waiting for human input.
4. **Always set `--max-iterations`** — primary safety mechanism. The completion promise uses exact string matching.
5. **Use `/workflows:review` for PRs** — it runs parallel review agents in worktrees, much more thorough than manual review.
6. **Use `/workflows:compound` for learnings** — it follows a structured format for documenting solved problems.
