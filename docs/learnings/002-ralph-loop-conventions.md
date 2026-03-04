# Ralph Loop Conventions

## Problem

Running autonomous implementation via the Ralph Loop plugin requires careful setup to avoid blocking on permission prompts or failing at invocation time. Our first attempt (Phase 1) hit two issues:

1. **`$(cat file)` in the skill invocation** — the Skill tool rejects shell command substitution in Bash arguments, so `$(cat docs/prompts/phase1-foundation.md)` never reached the setup script.
2. **Permission prompts** — every Bash tool call that wasn't pre-approved paused the loop waiting for human input, defeating the purpose of unattended execution.

## What We Tried

- Passing the entire prompt file content via `$(cat ...)` — rejected by the permission checker.
- Running without pre-approved permissions — required manual approval for `bun install`, file writes, etc.

## Solution

### Invocation Pattern

The ralph-loop skill accepts the prompt as **positional words**, not piped input. Use a short pointer as the prompt arg, and put the full spec in a file:

```
/ralph-loop Read and implement docs/prompts/phase2-backoffice.md exactly. Assess progress each iteration and continue. --max-iterations 30 --completion-promise "PHASE2_COMPLETE"
```

The skill writes the prompt text to `.claude/ralph-loop.local.md`. On each iteration, the Stop hook feeds this text back as the next turn's input. Claude then reads the referenced file(s) for the full spec.

### Prompt File Structure

Keep prompt files in `docs/prompts/`. Structure:

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

### Permissions

Pre-approve tools in `.claude/settings.local.json` before launching. Required patterns for a typical build phase:

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

The `Write`, `Edit`, `Read`, `Glob`, `Grep` tools are auto-approved by default in most permission modes. The `Bash` tool is the one that requires explicit patterns.

### How Ralph Loop Works (Internals)

1. `/ralph-loop` runs `setup-ralph-loop.sh` → writes prompt + state to `.claude/ralph-loop.local.md`
2. Claude works on the task and eventually tries to exit
3. A **Stop hook** fires → reads the state file → checks for completion promise in transcript
4. If not complete: increments iteration, feeds the prompt back as the next turn
5. If complete (promise found or max iterations reached): allows exit

To monitor: `head -10 .claude/ralph-loop.local.md`
To cancel: `/cancel-ralph`

## Key Insight

The ralph-loop prompt arg is a **pointer**, not the payload. Keep it under ~200 words. Reference files by path for the full spec — Claude reads them fresh each iteration, which also means it picks up any changes you make to spec files mid-loop.
