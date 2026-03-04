# Ralph Loop Prompts

Execution prompts for autonomous implementation via the Ralph Loop plugin. Each prompt corresponds to one development phase.

## How to Use

```bash
/ralph-loop <short task pointer> --max-iterations N --completion-promise "PHASEX_COMPLETE"
```

The prompt arg is a short pointer (1-2 sentences). Claude reads the full spec from the referenced file on each iteration.

**Before launching**: ensure `.claude/settings.local.json` has Bash permissions pre-approved. See `docs/learnings/002-ralph-loop-conventions.md`.

## Index

| Phase          | Prompt File                                    | Status   |
| -------------- | ---------------------------------------------- | -------- |
| 1 — Foundation | [phase1-foundation.md](./phase1-foundation.md) | Complete |
