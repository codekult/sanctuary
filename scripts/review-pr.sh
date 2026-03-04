#!/usr/bin/env bash
set -euo pipefail

# Review a PR using local Claude Code CLI.
# Usage: ./scripts/review-pr.sh [PR_NUMBER]
# If no PR number given, uses the current branch's PR.

PR_NUMBER="${1:-}"

if [ -z "$PR_NUMBER" ]; then
  PR_NUMBER=$(gh pr view --json number --jq '.number' 2>/dev/null || true)
  if [ -z "$PR_NUMBER" ]; then
    echo "Error: No PR number provided and no PR found for current branch."
    exit 1
  fi
fi

echo "Reviewing PR #${PR_NUMBER}..."

PR_META=$(gh pr view "$PR_NUMBER" --json title,body,baseRefName,headRefName)
PR_DIFF=$(gh pr diff "$PR_NUMBER")

REVIEW_PROMPT=$(cat <<'PROMPT'
You are reviewing a PR for the Sanctuary project. Review against these criteria:

1. **CLAUDE.md conventions**: TypeScript strict, camelCase vars, PascalCase types, kebab-case files, no `any`, no default exports (except pages/layouts), no barrel files
2. **Bun-only**: No npm/npx/node commands, no `prepare` lifecycle scripts
3. **Type safety**: No implicit `any`, proper Zod validation at boundaries
4. **Bilingual fields**: EN/ES where user-facing text exists
5. **Coordinate privacy**: No raw lat/lng exposed in public-facing code
6. **Database**: snake_case columns, proper relations, migration safety
7. **Imports**: Use workspace aliases (@sanctuary/*)

For each issue found, note the file and line. Categorize as:
- 🔴 Must fix (blocks merge)
- 🟡 Should fix (important but not blocking)
- 🟢 Suggestion (nice to have)

If the PR looks good, say so briefly. Be concise.
PROMPT
)

REVIEW=$(echo "PR metadata: ${PR_META}

Diff:
${PR_DIFF}" | claude --print --prompt "$REVIEW_PROMPT" 2>/dev/null)

gh pr comment "$PR_NUMBER" --body "## Claude Code Review

${REVIEW}

---
*Automated review by Claude Code*"

echo "Review posted to PR #${PR_NUMBER}"
