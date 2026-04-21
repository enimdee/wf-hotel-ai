# SPEC — Chatrium AI Communication Assistant

Functional requirements for the pilot release at Chatrium Rawai Phuket.

---

## 1. User stories (Phase 1–3)

### Phase 1 — Working prototype

- **P1.1** As a Rawai staff member, I can open `ai.chatrium.com` and see a single-page form with: property (locked to Rawai), my role, task type, recipient context, and an objective text area.
- **P1.2** I can type my objective in Thai or English and click "Generate".
- **P1.3** Within ~10 seconds, I see a draft email rendered in a clean preview panel, in business English, written in the Chatrium brand voice.
- **P1.4** I can click "Copy" to copy the draft to clipboard.

### Phase 2 — Multi-user + persistence

- **P2.1** I can sign in with my `@chatrium.com` email. The system sends a magic link to that address; clicking it logs me in for 7 days.
- **P2.2** Every draft I generate is saved automatically. I can see my last 20 drafts in the sidebar.
- **P2.3** I can click an old draft to view it again or "duplicate and edit" to start a new draft from it.
- **P2.4** MARCOM can sign in to a separate `/admin` page and edit the active brand voice prompt without involving IT.
- **P2.5** All admin edits create a new prompt version; the previous version is preserved.

### Phase 3 — Full Rawai pilot

- **P3.1** I can choose from a template library (Confirmation, Apology, Upsell, Corporate Inquiry, Loyalty Recognition).
- **P3.2** When I enter a recipient name that has been written to before, the system shows a "Previous correspondence with this guest" panel and uses it as context.
- **P3.3** I can switch input language between Thai and English. Output is always business English unless I explicitly ask otherwise.
- **P3.4** k Anuwat can open `/admin/usage` and see: requests per user, tokens used, cost in THB, and average draft length, by day and by user.

### Out of scope for the pilot

- Sending emails directly (always copy-paste to Outlook).
- Editing the draft inside the app (simple read-only preview is enough).
- Mobile-optimised layout (desktop-only is fine for pilot).
- Multi-property selection (Rawai is hardcoded).

---

## 2. Screens

### 2.1 Compose screen (`/`)

Replicates `assets/mockup.html`. Three regions:

| Region | Contents |
|---|---|
| Left column | Property (read-only "Chatrium Rawai Phuket"), Role dropdown, Task-type chips, Recipient context input, Objective textarea, Additional notes input, Generate button |
| Right column | Output card (subject line, body, sender block), QC indicators, refine buttons (Make shorter, More formal, Translate to Thai) |
| Sidebar | New Draft button, Templates list, Recent drafts list, signed-in user card |

### 2.2 Login screen (`/login`)

Single email field. "Send me a magic link" button. Confirmation message.

### 2.3 Magic link landing (`/auth/verify?token=...`)

Validates token, sets session cookie, redirects to `/`.

### 2.4 Admin — Brand voice (`/admin/brand-voice`)

- View active prompt
- Edit in a textarea
- Save → creates new version, marks old version inactive
- Version history table

### 2.5 Admin — Usage (`/admin/usage`)

- Date range picker (default: last 30 days)
- Total requests, total cost (฿), unique users
- Per-user breakdown table

---

## 3. Webhook API contract

The frontend talks only to two n8n webhooks: `/generate` and `/auth/*`.

### POST `/webhook/generate`

**Request**
```json
{
  "session_token": "jwt-here",
  "input": {
    "property": "rawai",
    "role": "front_office_manager",
    "task_type": "guest_email",
    "recipient_context": "Ms. Chen — Diamond member — honeymoon stay 24–28 Apr",
    "objective": "ลูกค้าคุณ Chen จอง honeymoon package มา 5 คืน...",
    "input_language": "th",
    "additional_notes": "mention MICHELIN 2026 recognition for Etcha",
    "template_id": null
  }
}
```

**Response (200)**
```json
{
  "draft_id": "drf_01HX8K9...",
  "subject": "Your honeymoon stay at Chatrium Rawai Phuket, 24–28 April",
  "body": "Dear Ms. Chen,\n\nThank you for choosing...",
  "qc": {
    "no_em_dash": true,
    "no_slang": true,
    "cta_present": true,
    "loyalty_recognised": true
  },
  "usage": {
    "input_tokens": 2840,
    "input_tokens_cached": 2400,
    "output_tokens": 380,
    "estimated_cost_thb": 0.42
  },
  "model": "claude-sonnet-4-6"
}
```

**Response (4xx/5xx)**
```json
{
  "error": "string",            
  "error_code": "AUTH_EXPIRED" | "RATE_LIMITED" | "AI_TIMEOUT" | "BAD_INPUT",
  "retry_after_seconds": 5
}
```

### POST `/webhook/auth/request-link`

```json
{ "email": "richard.meh@chatrium.com" }
```
Always returns `{ "ok": true }` even if the email is unknown (don't leak user enumeration).

### GET `/webhook/auth/verify?token=...`

Sets `session` cookie, redirects to `/`.

### GET `/webhook/drafts/recent` (Phase 2+)

Returns the signed-in user's last 20 drafts.

---

## 4. Non-functional requirements

| # | Requirement | Target |
|---|---|---|
| NF-1 | First draft latency | p50 ≤ 8 s, p95 ≤ 15 s |
| NF-2 | Availability | 99% during business hours (10:00–22:00 ICT) |
| NF-3 | Concurrency | Handle 10 concurrent generates without queueing |
| NF-4 | Data retention | Drafts kept 18 months, then auto-purged |
| NF-5 | PDPA compliance | Right-to-delete endpoint for guest names that appear in stored drafts |
| NF-6 | Audit | Every generate, login, and prompt edit is logged with timestamp + user_id |
| NF-7 | Cost ceiling | Hard stop at ฿50/user/month; soft alert at ฿30 |

---

## 5. Quality controls (run on every draft before returning)

These checks happen in n8n after the Claude call. If a check fails, regenerate once with a corrective instruction; if it fails again, return the draft anyway with the QC flag set to `false` so the user knows to review.

| Check | Method |
|---|---|
| No em-dash | Regex: text must not contain `—` (U+2014) |
| No slang | Wordlist check (cool, awesome, totally, super, etc.) |
| CTA present | Heuristic: last paragraph contains a verb of request (confirm, share, let us know, etc.) |
| Loyalty recognised | If `recipient_context` mentions Diamond/Platinum/Gold/Silver, body must reference loyalty |
| Length sane | Body ≥ 60 words and ≤ 350 words |

---

## 6. Acceptance criteria for "Phase 1 done"

- Sakchai can hit the compose screen, type an objective, and get a brand-aligned draft in ≤ 15 seconds.
- The draft passes all 5 QC checks for at least 8 of 10 test prompts.
- Total Anthropic API cost for those 10 test prompts is logged and visible in the Hostinger MySQL `audit_log` table.

## 7. Acceptance criteria for "Phase 2 done"

- Five Rawai pilot users can sign in with magic link and generate drafts.
- Each user only sees their own recent drafts.
- MARCOM can edit the brand voice prompt and the change takes effect on the next generate without code deploy.

## 8. Acceptance criteria for "Phase 3 done"

- All 30 Rawai staff onboarded and using the app weekly.
- k Anuwat can open `/admin/usage` and see real numbers.
- Recipient memory works: a second draft to the same guest visibly references the first.
