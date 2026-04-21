# ARCHITECTURE — Chatrium AI Communication Assistant

Technical design and deployment topology.

---

## 1. Stack summary

| Concern | Choice | Why not the alternative |
|---|---|---|
| Hosting | **Hostinger VPS + static hosting** | Already owned. No new vendor to onboard. |
| Backend | **n8n (self-hosted)** | No custom backend code to maintain. MARCOM and IT can tune workflows in a UI. |
| Frontend | **Static HTML/CSS/JS** (Phase 1) → **Next.js** (Phase 3 if needed) | Minimal complexity. The mockup already demonstrates that a single-page static app is sufficient. |
| Database | **MySQL 8** (Hostinger managed) | Included in the Hostinger plan. Simpler than Postgres for this use. |
| AI | **Anthropic Claude Sonnet 4.6** via REST API, with prompt caching | Best-in-class for strict style guide adherence. Caching makes cost negligible. |
| Auth | **Magic-link over email** (Phase 1–2) → **Microsoft 365 SSO** (later) | Zero password management. Good enough for 30 users. |
| TLS | **Hostinger auto-SSL** (Let's Encrypt) | Free and automatic. |

---

## 2. Request flow (happy path)

```
┌────────────────────────────────────────────────────────────────┐
│ 1. User fills compose form and clicks "Generate"                │
│    Frontend (ai.chatrium.com) → POST /webhook/generate          │
│    Body: { session_token, input: {...} }                        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. n8n webhook receives request                                 │
│    Node 1: Validate JWT → extract user_id                       │
│    Node 2: MySQL → SELECT user by id                            │
│    Node 3: MySQL → SELECT active brand_voice_prompt             │
│    Node 4: MySQL → SELECT last 3 drafts to same recipient (P3)  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. Compose Claude messages array                                 │
│    - system:  brand voice prompt (CACHED — same every call)     │
│    - user:    { role context, task type, recipient context,     │
│                 objective, additional notes, prior drafts }      │
│    - Header:  anthropic-beta: prompt-caching-2024-07-31          │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. HTTP request to api.anthropic.com/v1/messages                 │
│    Model: claude-sonnet-4-6                                     │
│    Max tokens: 700                                              │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. Run QC checks (em-dash, slang, CTA, loyalty, length)         │
│    If any fail → regenerate once with corrective instruction    │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. Persist draft                                                 │
│    INSERT INTO drafts (...) VALUES (...)                        │
│    INSERT INTO audit_log (...) VALUES (...)                     │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ 7. Return JSON to frontend                                       │
│    { draft_id, subject, body, qc, usage, model }                │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Deployment topology on Hostinger

```
┌──────────────────────────────────────────────────────────┐
│ Hostinger account                                          │
│                                                            │
│  ┌────────────────────────┐                                │
│  │ Static hosting          │   ai.chatrium.com              │
│  │  index.html            │   (Frontend)                   │
│  │  app.css               │                                │
│  │  app.js                │                                │
│  │  login.html            │                                │
│  │  admin.html            │                                │
│  └─────────┬──────────────┘                                │
│            │ fetch                                          │
│            ▼                                                │
│  ┌────────────────────────┐                                │
│  │ VPS (Ubuntu 22.04)      │   n8n.chatrium.internal        │
│  │  Docker compose:        │   (or port 5678 proxied)       │
│  │  ├─ n8n                │                                │
│  │  ├─ caddy (TLS)        │                                │
│  │  └─ redis (n8n queue) │                                │
│  └─────────┬──────────────┘                                │
│            │                                                │
│            ▼                                                │
│  ┌────────────────────────┐                                │
│  │ MySQL database          │   Managed by Hostinger         │
│  │  chatrium_ai            │                                │
│  │  ├─ users              │                                │
│  │  ├─ drafts             │                                │
│  │  ├─ brand_voice_prompts│                                │
│  │  └─ audit_log          │                                │
│  └────────────────────────┘                                │
│                                                            │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTPS
                ┌──────────────────────────┐
                │ api.anthropic.com         │
                │ Claude Sonnet 4.6         │
                └──────────────────────────┘
```

### DNS
- `ai.chatrium.com` → A record → Hostinger static hosting IP
- Frontend fetches n8n at `ai.chatrium.com/api/*` (reverse proxied by Caddy on the VPS) — avoids CORS issues and keeps the frontend same-origin.

### Files
- Frontend is ~5 files, under 100 KB total. Deploy via Hostinger's file manager or rsync.
- n8n workflow is exported as `workflow.json` and committed to the repo.

---

## 4. Security & privacy

| Concern | Control |
|---|---|
| API key exposure | Anthropic key lives in n8n credential store, never in frontend. |
| Session hijack | Magic-link token is single-use, expires in 15 min. Session cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, 7-day lifetime. |
| SQL injection | n8n MySQL node uses parameterised queries only. Never concatenate user input into SQL. |
| Training on our data | Anthropic API defaults to not training on API traffic. Double-check `anthropic-beta` headers do not opt in. |
| Guest PII in logs | Log user_id and metadata only. Do not log full request/response bodies in audit_log. Store the draft body in `drafts`, referenced by id. |
| Right to delete | `DELETE /admin/drafts/by-recipient?name=X` endpoint for PDPA requests. Gated to IT admin role. |
| Rate limiting | n8n workflow caps at 20 generate calls per user per hour. |
| CORS | Frontend and n8n are same-origin; no CORS headers needed. If split later, allowlist `ai.chatrium.com` only. |

---

## 5. Failure handling

| Failure | Response |
|---|---|
| Claude API 429 (rate limited) | Wait 3 s, retry once. If still 429, return `RATE_LIMITED` with `retry_after_seconds`. |
| Claude API 5xx | Retry once. If still failing, return `AI_TIMEOUT` and log for Sakchai. |
| MySQL unreachable | Return `{ error_code: "BACKEND_DOWN" }`. Frontend shows "Service temporarily unavailable". |
| QC check fails twice | Return the draft anyway with `qc.<check>: false`. Frontend shows a warning badge. |
| Invalid JWT | Return `AUTH_EXPIRED`. Frontend redirects to `/login`. |

---

## 6. Scaling notes

At 30 users the pilot stack will sit at <1% of VPS capacity. Scaling levers when moving to 200+ users:

1. **Switch to n8n queue mode** (Redis + multiple worker containers).
2. **Move MySQL to a dedicated managed instance** if draft table grows past 100 k rows.
3. **Add a CDN** (Hostinger or Cloudflare) in front of the static frontend.
4. **Pre-warm prompt cache** with a periodic dummy request so new sessions hit the cache immediately.

None of this is needed for Rawai pilot.
