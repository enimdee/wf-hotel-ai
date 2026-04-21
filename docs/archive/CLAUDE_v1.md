# Chatrium AI Communication Assistant

> **Read this file first.** This is the project bootstrap for Claude Code.
> Full details live in the supporting files listed below.

---

## 1. What we are building (in one paragraph)

An internal web application for employees of **Chatrium Rawai Phuket** (pilot: ~30 users)
that drafts professional, brand-aligned guest emails. The employee logs in, picks
a task type and recipient context, types the objective in Thai or English, and
receives a ready-to-send email in business English that follows the Chatrium brand
voice defined by Group General Manager Rene Balmer. The brand voice is enforced by
the system — employees cannot accidentally send off-brand copy.

If the Rawai pilot succeeds, the app will be rolled out to all Chatrium and Maitria
properties (~200 users total). Design with that in mind, but ship for Rawai first.

---

## 2. Who is this for

- **Primary user:** Front-line staff at Chatrium Rawai Phuket (Front Office, Reservations, Sales, Guest Relations, Food & Beverage). Often Thai-native, sometimes limited in written English.
- **Secondary user:** General Manager (Richard Adrian Mehr) — writes high-stakes emails to VIP guests, corporate clients, partners.
- **Admin user:** MARCOM team — owns the brand voice prompt and template library.
- **Auditor:** IT (k Anuwat) — reviews usage logs, manages access.

---

## 3. Tech stack (decisions already made)

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Static HTML/CSS/JS or Next.js | Start with static HTML built on top of the mockup in `assets/mockup.html`. Upgrade to Next.js if SSR/routing is needed. |
| Hosting (frontend) | Hostinger static hosting or Hostinger VPS | Company already uses Hostinger. Deploy as static site. |
| Backend / AI orchestration | **n8n** (self-hosted on Hostinger VPS) | No custom backend code. All logic lives in the n8n workflow. |
| Database | **MySQL** (included with Hostinger) | 4 tables. See `schema.sql`. |
| Auth | Simple email + magic-link via n8n (Phase 1) → Microsoft 365 SSO (Phase 2) | Start simple. |
| AI API | **Anthropic Claude Sonnet 4.6** with **prompt caching** | Model: `claude-sonnet-4-6`. Cache the system prompt — it cuts input cost ~90%. |
| Domain | `ai.chatrium.com` (proposed) | Hosted on Hostinger. TLS via Hostinger auto-SSL. |
| Monitoring | Sentry free tier + Hostinger logs | Log every API call with user, tokens, latency. |

---

## 4. Architecture

```
[Browser]
    │ HTTPS
    ▼
[Static frontend — ai.chatrium.com] ◄── Hostinger static hosting
    │ POST /webhook/generate (JSON)
    ▼
[n8n on Hostinger VPS]
    ├─► Validate + auth check (JWT in header)
    ├─► Read user profile from MySQL
    ├─► Load brand voice + role context from MySQL
    ├─► Call Anthropic Claude API (Sonnet 4.6 + caching)
    ├─► Persist draft to MySQL (`drafts` table)
    └─► Return JSON { draft, usage, draft_id } to frontend
```

The frontend is a thin shell. All business logic (auth, DB, brand-voice injection,
AI call, logging) is in the n8n workflow. This is deliberate — we want MARCOM and IT
to be able to tune the workflow without re-deploying code.

---

## 5. Phased build order

Each phase must be shippable on its own. Do not build phase N+1 until phase N is running in the wild.

**Phase 1 — Working prototype (Days 1–5)**
- n8n webhook → Claude API → response
- Single HTML page with the compose form from the mockup
- Brand voice hardcoded in the n8n workflow
- No auth, no DB, no history — just generate-and-return
- Tested by Sakchai only

**Phase 2 — Multi-user + persistence (Days 6–10)**
- MySQL tables per `schema.sql`
- Simple email + magic-link auth
- History sidebar shows the signed-in user's past drafts
- Brand voice lives in DB (MARCOM can edit without touching n8n)
- Deploy to `ai.chatrium.com`, invite 5 pilot users at Rawai

**Phase 3 — Full Rawai pilot (Weeks 3–4)**
- All 30 Rawai staff onboarded
- Template library (5 seed templates)
- Thai↔English input toggle
- Recipient memory (pull last N drafts for the same recipient into context)
- Usage dashboard for k Anuwat

**Phase 4 — Out of scope for now (document only)**
- Microsoft 365 SSO
- Outlook plug-in
- PMS/Opera integration
- Rollout to other properties

---

## 6. Files in this project

| File | Purpose |
|---|---|
| `README.md` | High-level overview (for humans first opening the folder) |
| **`CLAUDE.md`** | **This file — bootstrap for Claude Code** |
| `SPEC.md` | Full functional requirements + webhook API contract |
| `ARCHITECTURE.md` | Tech stack rationale, data flow, deploy topology |
| `BRAND_VOICE_PROMPT.md` | The Claude system prompt, ready to copy into n8n |
| `N8N_WORKFLOW.md` | Node-by-node workflow design |
| `schema.sql` | MySQL schema (4 tables) |
| `DEPLOYMENT.md` | How to deploy to Hostinger |
| `DECISIONS_NEEDED.md` | Open questions that need a human to answer |
| `assets/mockup.html` | UI reference — Phase 1 should look like this |

---

## 7. Conventions

- **Code style:** simple, explicit, no frameworks unless justified. Prefer vanilla JS + fetch over React for Phase 1.
- **Comments:** Thai OK for internal comments, English for anything that might be read by Anthropic engineers or external devs.
- **Commit messages:** English, imperative ("add magic-link auth endpoint").
- **Secrets:** never in code. Use n8n credentials store for the Anthropic API key and MySQL password. Never check API keys into Git.
- **Prompt changes:** always version them in the `brand_voice_prompts` table. Never mutate a row in place — insert a new version with `is_active = true` and set the previous one `is_active = false`.
- **Logs:** log every Claude API call with token usage. We must be able to tell k Anuwat the cost-per-user-per-month at any time.

---

## 8. Non-goals (do not build these)

- Multi-tenant architecture. One property, one DB.
- Real-time collaboration / multiple users editing the same draft.
- Voice input, image generation, file upload.
- Automatic email sending. The user always copies the draft to Outlook themselves.
- Custom AI model training or fine-tuning.

---

## 9. Current state when you read this

Nothing is built yet. The repo contains only specification files and a static HTML
mockup. Your job is to:

1. Read `SPEC.md` and `ARCHITECTURE.md` in full.
2. Confirm or challenge the open questions in `DECISIONS_NEEDED.md`.
3. Start with Phase 1 as defined above.

---

## 10. Who to ask when something is unclear

- Product / scope: Sakchai Nimdee (sakchai.nim@chatrium.com)
- Brand voice: MARCOM, via Sakchai
- Infrastructure / VPS access: k Anuwat (anuwat.wat@chatrium.com)
- Pilot user coordination: Richard A. Mehr (richard.meh@chatrium.com)
