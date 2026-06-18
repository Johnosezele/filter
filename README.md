# PR Spam Checker

GitHub App that scores pull requests for spam likelihood and posts a Coveralls-style commit status. PRs scoring ≥ 70% fail the check until a maintainer overrides.

## Phase 3 status

- [x] PR comment with score breakdown (upsert via `<!-- pr-spam-checker -->`)
- [x] Repo-rules analyzer (issue refs, sections, forbidden phrases/paths)
- [x] Comments on medium+ risk PRs (`warn_threshold` or `always_comment`)

## Phase 2 status

- [x] Types, Zod config loader, weighted scorer
- [x] Analyzers: reputation, description, diff, AI patterns
- [x] Pipeline runs analyzers in parallel and posts tiered status
- [x] Unit tests for scorer, description analyzer, and score thresholds

## Phase 1 status

- [x] Probot + TypeScript scaffold
- [x] `pull_request` webhook handler (`opened`, `synchronize`, `reopened`)
- [x] Pending → success commit status (`pr-spam-checker/status`)
- [x] GitHub App registered and installed on a test repo

## Quick start (local)

### 1. Install dependencies

```bash
npm install
npm run build
```

### 2. Create a GitHub App

**Option A — Probot setup (recommended for local dev)**

```bash
npm run dev
```

Probot prints a URL to create and configure the app from `app.yml`. Follow the prompts.

**Option B — Manual registration**

1. Go to [github.com/settings/apps/new](https://github.com/settings/apps/new)
2. Set webhook URL to your tunnel endpoint + `/api/github/webhooks`
3. Webhook secret: generate one and save it
4. Permissions:
   - Pull requests: Read & write
   - Commit statuses: Read & write
   - Contents: Read-only
   - Issues: Read & write
   - Metadata: Read-only
5. Subscribe to events: **Pull request**, **Issue comment**
6. Generate a private key and note the App ID

### 3. Configure environment

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `APP_ID` | GitHub App ID |
| `PRIVATE_KEY` | PEM private key (use `\n` for newlines in `.env`) |
| `WEBHOOK_SECRET` | Webhook HMAC secret |
| `WEBHOOK_PROXY_URL` | [Smee.io](https://smee.io) URL for local dev |

### 4. Forward webhooks locally

In a second terminal:

```bash
npx smee -u $WEBHOOK_PROXY_URL -t http://localhost:3000
```

Or use Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

Paste the public URL into your GitHub App webhook settings as `https://<host>/api/github/webhooks`.

### 5. Install the app on a test repo

GitHub App settings → Install App → select a repository.

### 6. Verify

Open a pull request on the test repo. You should see:

1. **Pending** — `PR Spam Check: analyzing...`
2. **Success** — `PR Spam Check: passed (0%)`

### Branch protection (required to block merges in later phases)

Repo **Settings → Branches → Add rule**:

- Require status check: `pr-spam-checker/status`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `lib/` |
| `npm run dev` | Build and start Probot |
| `npm start` | Start Probot (requires prior build) |
| `npm test` | Run Vitest |

## Project layout

```
src/
  index.ts          # Webhook handlers
  pipeline.ts         # Analysis orchestration
  report/status.ts    # Commit status posting
  constants.ts        # Shared constants
```


## License

MIT

<!-- spam-check test PR -->
