# Chatrium AI Communication Assistant

> **Read this first.** Bootstrap for Claude Code in this worktree.
> Full business spec lives in the parent repo's `SPEC.md`; architecture lives in
> `ARCHITECTURE_v2.md`.

---

## 1. What we are building (in one paragraph)

An internal web app for **Chatrium Rawai Phuket** staff (~30 users at pilot)
that drafts brand-aligned guest emails in business English from a Thai or
English objective. The brand voice is non-negotiable and enforced by the
system — employees cannot accidentally ship off-brand copy. If the Rawai pilot
succeeds, rollout to all Chatrium and Maitria properties (~200 users).

## 2. Stack (code-first pivot — 2026-04-20)

| Layer | Tool |
|---|---|
| Fullstack | **Next.js 15 (App Router) + TypeScript** |
| UI | React 19 + Tailwind 4 |
| DB | **MySQL 8 + Drizzle ORM** |
| AI | **`@anthropic-ai/sdk`** + **Claude Sonnet 4.6** + prompt caching |
| Auth | Auth.js v5 (magic-link, Phase 2) |
| Validation | Zod |
| Tests | Vitest + Playwright + golden-prompt regression set |
| Deploy | Docker Compose on VPS `srv1467971` (Hostinger) |

See `ARCHITECTURE_v2.md` for the full rationale and repo layout.

## 3. Phased build order (unchanged)

- **Phase 1 (Day 1–5)** — `/api/generate` + compose page, no auth, no DB, hardcoded prompt
- **Phase 2 (Day 6–10)** — magic-link auth, Drizzle migrations, `/admin/brand-voice`, history sidebar
- **Phase 3 (Week 3–4)** — templates, recipient memory, Thai↔EN toggle, `/admin/usage`
- **Phase 4** — M365 SSO, Outlook deep-link, rollout to Grand BKK (post-pilot)

Do not build N+1 until N is running in the wild.

## 4. Current state (2026-04-20)

P1 scaffold is in place (this commit). `npm install` + `.env` setup still
needed before `npm run dev` works. Brand voice prompt seed is in
`lib/brand-voice/prompt.md`. No DB connection is wired for Phase 1 —
`/api/generate` returns inline without persisting.

## 5. Commands

```bash
npm install                 # install deps (first time only)
npm run dev                 # local dev on :3000
npm run build               # production build
npm run start               # run the production build
npm run test                # vitest unit + golden
npm run db:generate         # drizzle-kit generate migration from schema
npm run db:push             # apply migrations to configured MySQL
npm run lint                # eslint
npm run typecheck           # tsc --noEmit
```

## 6. Conventions

- **TypeScript strict mode.** No `any`. If you must widen, use `unknown` + a type guard.
- **Drizzle is the schema source.** Do not write migrations by hand. Change `lib/db/schema.ts`, then `npm run db:generate`.
- **Zod at boundaries.** Every route handler validates with `lib/schemas.ts`. Never trust `req.body`.
- **Prompt changes are append-only.** Insert a new row into `brand_voice_prompts` with `is_active = 1` and flip the old row. Never mutate a row in place.
- **Secrets.** Only in `.env` (never committed). Runtime access through `lib/env.ts`.
- **Golden prompts.** Any change to `lib/brand-voice/prompt.md` requires re-running `npm run test:golden` and reviewing the snapshot diff.
- **Cost ceiling.** Every draft logged with token usage. Hard stop at ฿50/user/month.

## 7. Non-goals (do not build)

- Multi-tenant DB. One DB, one property column is enough.
- Real-time collab / multiple users editing the same draft.
- Voice input / image generation / file upload.
- Automatic email sending (always copy-paste to Outlook).
- Fine-tuning a custom model.

## 8. People

- Product / scope: Sakchai Nimdee (sakchai.nim@chatrium.com)
- Brand voice: MARCOM, via Sakchai
- Infra / VPS: k Anuwat (anuwat.wat@chatrium.com)
- Pilot users: Richard A. Mehr (richard.meh@chatrium.com)

## 9. Open decisions

See `DECISIONS_NEEDED.md` in the parent repo. Pending as of this commit:

- D-1 subdomain (defaulting to `ai.chatrium.com` in config, change later)
- D-2 Anthropic billing owner (corporate card preferred)
- D-3 Brand voice prompt MARCOM sign-off
- D-4 Pilot user list (5 names)
- D-5 Hostinger VPS — confirmed: reuse `srv1467971`
