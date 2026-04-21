# Chatrium AI Communication Assistant

Internal web app that drafts brand-aligned guest emails for Chatrium Rawai Phuket (pilot: ~30 users).

Code-first stack: **Next.js 15 + TypeScript + MySQL (Drizzle) + Claude Sonnet 4.6**.
See [`ARCHITECTURE_v2.md`](./ARCHITECTURE_v2.md) for the full design and [`CLAUDE.md`](./CLAUDE.md) for Claude Code bootstrap.

---

## Quick start (local dev)

```bash
# 1. Install deps
npm install

# 2. Configure secrets
cp .env.example .env
# edit .env and paste your ANTHROPIC_API_KEY

# 3. Run dev server (no DB needed for Phase 1)
npm run dev
#   → http://localhost:3000
```

Phase 1 runs without MySQL. Drafts are generated and returned inline; no
persistence, no auth, no history.

## Phase 2 setup (auth + DB)

```bash
# Start MySQL via docker compose
docker compose -f infra/docker-compose.yml up -d mysql

# Apply schema
npm run db:push

# Seed brand voice prompt + pilot users
npm run seed
```

## Running tests

```bash
npm test                       # unit tests (QC, parsing) — free, fast
RUN_GOLDEN=1 npm run test:golden   # golden set, hits live Anthropic API (~฿2 per run)
```

## Deploy (Hostinger VPS)

See [`infra/docker-compose.yml`](./infra/docker-compose.yml) and the deploy
notes in [`ARCHITECTURE_v2.md`](./ARCHITECTURE_v2.md). Summary:

```bash
# On the VPS
git pull
cp .env.example .env && vi .env        # set ANTHROPIC_API_KEY, DATABASE_URL, etc.
docker compose -f infra/docker-compose.yml up -d --build
```

Caddy auto-issues TLS for the domain in [`infra/Caddyfile`](./infra/Caddyfile).
Update the hostname there once D-1 (subdomain decision) is resolved.

## Project layout

```
app/             Next.js App Router (UI + API routes)
components/      React components for the compose screen
lib/
  ai/            Anthropic client, prompt caching, QC checks, cost calc
  db/            Drizzle schema + MySQL client
  brand-voice/   Seed prompt (markdown) + DB loader
  schemas.ts     Zod request/response schemas
  env.ts         Zod-validated env loader
drizzle/         Generated migrations (run `npm run db:generate` after schema edits)
infra/           Dockerfile, docker-compose, Caddyfile
scripts/         seed.ts, cost-report.ts
tests/
  unit/          Vitest unit tests — free, fast
  golden/        Prompt regression tests against live Anthropic API (opt-in)
```

## Open decisions

See `DECISIONS_NEEDED.md` in the parent repo. Status:

- **D-1 Subdomain** — TBD (fallback: `ai.chatrium.com`)
- **D-2 Anthropic billing owner** — TBD (will use Anthropic regardless)
- D-3 Brand voice MARCOM sign-off — pending
- D-4 Pilot user list — pending
- **D-5 Hostinger VPS** — decided: reuse `srv1467971` (KVM 2, already running n8n)
