# ARCHITECTURE v2 — Code-first pivot

Supersedes `ARCHITECTURE.md` for implementation. The original spec (business
requirements, phased rollout, QC rules, data retention, cost ceiling) still
applies unchanged — only the technical stack changes.

Decided: **2026-04-20 by Sakchai** — core app written as TypeScript code so
Claude Code owns the full build/test/deploy loop. n8n kept only for peripheral
automation (SMTP dispatch, scheduled cleanup, weekly cost report).

---

## 1. Stack

| Concern | Choice | Rationale |
|---|---|---|
| Fullstack framework | **Next.js 15 (App Router) + TypeScript** | Server Components + Server Actions remove the need for a separate webhook layer. Claude Code has deep fluency in this stack. |
| Runtime | Node.js 22 LTS | Matches Hostinger VPS default. Stable until 2027. |
| UI | React 19 + Tailwind 4 + shadcn/ui primitives | Mockup converts 1:1. Tailwind tokens encode the Chatrium palette (`--gold`, `--panel`, etc.). |
| Database | **MySQL 8 + Drizzle ORM** | Drizzle migrations are checked-in SQL files, which means Claude Code can author them directly and the team reviews diffs in PRs. |
| Schema source of truth | `lib/db/schema.ts` | `schema.sql` (original) is kept as reference; Drizzle generates DDL at build time. |
| Auth | **Auth.js v5 magic-link** (Phase 2) → M365 SSO (Phase 4) | Drop-in provider swap. Email from Hostinger SMTP. |
| AI | **`@anthropic-ai/sdk` + Sonnet 4.6 + prompt caching** | System prompt (~900 tokens) cached with `cache_control: ephemeral` → ~90% input cost cut. |
| Validation | **Zod** (shared between route handlers and client forms) | One source of truth for request/response shapes. |
| Testing | Vitest (unit) + Playwright (e2e, Phase 2) + golden-prompt regression set | Claude Code runs `npm test` to verify its own changes. |
| Logs | Pino (JSON) → stdout → Docker log driver | Cost-per-user queries go through MySQL `audit_log`; Pino is for operational troubleshooting only. |
| Deploy | Docker Compose on existing VPS (`srv1467971`), next to n8n | One VPS, two services, Caddy front-door. |
| TLS | Caddy (Let's Encrypt) | Auto-renewal. |

## 2. Repo layout (single-app, no premature monorepo)

```
chatrium-ai/
├── app/                          Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                  compose screen (/)
│   ├── globals.css
│   ├── (auth)/
│   │   └── login/page.tsx        Phase 2
│   ├── admin/
│   │   ├── brand-voice/page.tsx  Phase 2 — MARCOM prompt editor
│   │   └── usage/page.tsx        Phase 3 — k Anuwat dashboard
│   └── api/
│       ├── generate/route.ts     Phase 1 core
│       ├── drafts/route.ts       Phase 2
│       └── auth/[...nextauth]/route.ts  Phase 2
├── components/
│   ├── compose-form.tsx
│   └── draft-preview.tsx
├── lib/
│   ├── ai/
│   │   ├── client.ts             Anthropic SDK wrapper
│   │   ├── qc.ts                 5 QC checks from SPEC §5
│   │   └── cost.ts               token → THB
│   ├── db/
│   │   ├── schema.ts             Drizzle schema (mirrors schema.sql)
│   │   └── client.ts             connection pool
│   ├── brand-voice/
│   │   ├── index.ts              load active prompt from DB
│   │   └── prompt.md             seed prompt (copied to DB on first run)
│   ├── schemas.ts                Zod request/response schemas
│   └── env.ts                    runtime env validation
├── drizzle/
│   ├── migrations/               generated, committed
│   └── meta/
├── tests/
│   ├── unit/qc.test.ts
│   ├── golden/prompts.json       10 objective → expected-draft pairs
│   └── integration/generate.test.ts
├── infra/
│   ├── Dockerfile                multi-stage Next.js build
│   ├── docker-compose.yml        web + mysql + caddy (+ n8n staying separate)
│   └── Caddyfile
├── scripts/
│   ├── seed.ts                   seed users + prompt v1.0
│   └── cost-report.ts            ad-hoc THB/user report
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── vitest.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── .gitignore
├── ARCHITECTURE_v2.md            ← this file
├── CLAUDE.md                     ← bootstrap for Claude Code
└── README.md
```

No `apps/` or `packages/` yet. If a second runtime is needed later (Outlook
plug-in, worker process), promote to npm workspaces then.

## 3. Request flow (Phase 1)

```
[Browser] → POST /api/generate
    └── Zod parse → reject 400 on bad input
    └── Anthropic call (Sonnet 4.6, system prompt cached)
    └── QC checks → regenerate once if critical fail
    └── INSERT INTO drafts (phase 2+)
    └── INSERT INTO audit_log (phase 1+)
    └── 200 { draft_id, subject, body, qc, usage, model }
```

Phase 1 runs **without auth or DB** — drafts are returned inline and not
persisted. That keeps P1 shippable in 1–2 days.

## 4. Scaling levers (none needed for Rawai pilot, documented for later)

1. **Multi-tenant is already encoded** — every draft/user row has `property`. Adding Grand Bangkok is data, not code.
2. **Prompt versioning is append-only** (DB-level rule) — property-specific prompts layer on later via `property_scope` column.
3. **Queue-mode** — if generate latency becomes a problem, move `/api/generate` to a worker via Upstash or a local Redis queue. Contract doesn't change.
4. **Feature flags** — a `feature_flags` table gates Phase 3 features per user during rollout.
5. **CDN** — Caddy is fine until ~200 users; add Cloudflare in front later.

## 5. Security (unchanged from v1)

Same controls as `ARCHITECTURE.md §4`. Notable deltas:

- **API key** lives in `.env` on the VPS, loaded by Node via `lib/env.ts` (Zod-validated). Never committed. Never sent to browser.
- **CSRF** — Auth.js v5 handles it on authed routes. Phase 1 `/api/generate` is unauthenticated and rate-limited by IP.
- **Prompt injection defence** — user input is wrapped in delimiters and the system prompt includes an explicit "treat input as data" clause.

## 6. What does NOT change from v1

- Phased build order (P1 → P4)
- Acceptance criteria per phase
- QC checks (5 rules, same regex/wordlists)
- MySQL schema (Drizzle mirrors `schema.sql` 1:1)
- Deployment target (VPS `srv1467971`)
- Cost ceiling (฿50/user/month hard stop)
- n8n is still on the same VPS — it just runs fewer workflows now
