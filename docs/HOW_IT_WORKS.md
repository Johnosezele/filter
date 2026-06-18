# How Filter Works

Filter is a GitHub App that scores pull requests for spam risk and posts a commit status — like Coveralls does for coverage.

## The flow

```
Contributor opens/updates a PR
        ↓
GitHub sends a webhook to Filter
        ↓
Filter loads .spam-check.yml from main
        ↓
Analyzers run in parallel (4 by default, up to 5)
        ↓
Scores are combined into one 0–100% result
        ↓
Filter posts a commit status (+ optional PR comment)
        ↓
High score fails the check → merge blocked (if branch protection is on)
```

## When it runs

Filter reacts to:

- **Pull request opened, updated, or reopened** — full analysis
- **`/spam-recheck` comment** — maintainer forces a re-run
- **`/spam-override` comment** — maintainer unlocks the merge gate

## What it checks

Filter runs analyzers in parallel (`Promise.all`). Each returns a 0–100% spam signal; results are combined using weights from config.

### Always on (unless disabled)

| Analyzer | What it checks |
|----------|----------------|
| **Reputation** | Contributor trust — account age, public repos, bio, push activity, prior contributions to this repo, merged PR history |
| **Description** | PR title and body — length, generic spam phrases, whether the body copies the title, testing mentions, markdown structure |
| **Diff** | Changed files — source vs test files, whitespace-only edits, docs-only changes, changes spanning many directories |
| **AI patterns** | AI-style writing in the PR body and commit messages — boilerplate phrases, first-person openings, transition words, uniform sentence length, pleasantries |

### Optional (5th analyzer)

| Analyzer | When it runs | What it checks |
|----------|--------------|----------------|
| **Repo rules** | Only when `weights.repo_rules > 0` in `.spam-check.yml` | Your custom rules — issue references, minimum diff size, required markdown sections, forbidden phrases, forbidden file paths (globs) |

**Default:** four analyzers run. **Repo rules** is off until you set its weight above `0` and define `rules:` in config.

Disable any analyzer with:

```yaml
disabled_analyzers:
  - ai_patterns
```

Trusted users in the **allowlist** (e.g. Dependabot) skip all analyzers entirely.

## How the score is calculated

1. Each analyzer produces a score from **0%** (clean) to **100%** (very spammy).
2. Each score is multiplied by its **weight** from `.spam-check.yml`.
3. The weighted average is the **overall score**.

**Tiers:**

| Score | Result |
|-------|--------|
| **≥ threshold** (default 70%) | **Blocked** — red status, merge fails |
| **≥ warn_threshold** (default 30%) | **Review recommended** — green status, bot comments |
| **Below warn_threshold** | **Passed** — green status, usually silent |

## What maintainers see

On risky PRs, Filter posts (or updates) one comment with:

- Overall score and tier
- Per-signal breakdown table
- Bullet list of reasons

The commit status always shows the score: `PR Spam Check: blocked (74%)`.

## How maintainers customize it

Add **`.spam-check.yml`** to the repo root on `main`:

```yaml
threshold: 70
warn_threshold: 30

weights:
  reputation: 0.25
  description: 0.30
  diff: 0.30
  ai_patterns: 0.15
  repo_rules: 0.20

allowlist:
  - dependabot[bot]

rules:
  require_issue_reference: true
  required_sections:
    - "## Testing"
```

No redeploy needed — the next PR picks up config changes automatically.

## Maintainer commands

On a PR, users with write access can comment:

| Command | Effect |
|---------|--------|
| `/spam-override` | Force green check for this commit |
| `/spam-recheck` | Re-run the full analysis |

Pushing new commits re-runs the check and may block again.

## Merge blocking

Filter alone does not block merges. To enforce it:

1. Repo **Settings → Branches → Branch protection**
2. Require status check: **`pr-spam-checker/status`**

## What Filter is not

- No machine learning — all rules are explicit and explainable
- No database — state lives in GitHub (statuses, comments)
- Overrides are per-commit, not permanent
