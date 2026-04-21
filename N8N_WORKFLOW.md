# N8N_WORKFLOW.md

Node-by-node design for the three core workflows.

---

## Workflow 1: `generate-draft`

**Trigger:** Webhook `POST /webhook/generate`

| # | Node | Type | Purpose |
|---|---|---|---|
| 1 | **Webhook** | Webhook | Receive JSON body from frontend |
| 2 | **Validate JWT** | Function (JS) | Decode `session_token` header. If invalid → return 401. Set `user_id` on item. |
| 3 | **Rate limit** | MySQL | `SELECT COUNT(*) FROM audit_log WHERE user_id=? AND action='generate' AND created_at > NOW() - INTERVAL 1 HOUR`. If ≥ 20 → return 429. |
| 4 | **Load user** | MySQL | `SELECT id, email, name, role, property FROM users WHERE id=?` |
| 5 | **Load brand voice** | MySQL | `SELECT prompt_text FROM brand_voice_prompts WHERE is_active=TRUE LIMIT 1` |
| 6 | **Load prior drafts** (P3) | MySQL | `SELECT subject, created_at FROM drafts WHERE recipient_name=? ORDER BY created_at DESC LIMIT 3`. Skip in Phase 1–2. |
| 7 | **Compose messages** | Function (JS) | Build the `system` and `user` content per `BRAND_VOICE_PROMPT.md`. |
| 8 | **Call Claude** | HTTP Request | POST `https://api.anthropic.com/v1/messages` with prompt-caching headers. See `BRAND_VOICE_PROMPT.md` for exact body. |
| 9 | **Parse response** | Function (JS) | Split `content[0].text` into `subject` and `body`. Detect `CLARIFY:` prefix → return `{ clarify: true, questions: [...] }` instead. |
| 10 | **QC checks** | Function (JS) | Run all 5 checks from `SPEC.md §5`. |
| 11 | **Regenerate if needed** | IF → loop | If any critical QC fails AND this is the first attempt, append corrective instruction to the user message and loop back to node 8 once. |
| 12 | **Save draft** | MySQL | `INSERT INTO drafts (...) VALUES (...)` |
| 13 | **Audit log** | MySQL | `INSERT INTO audit_log (user_id, action, metadata) VALUES (?, 'generate', ?)`. Include token usage and cost. |
| 14 | **Respond** | Respond to Webhook | Return the JSON response shape defined in `SPEC.md §3`. |

### Error branches

- Any node that throws → **Error Trigger** workflow → `audit_log` INSERT with severity=error → return `500 { error_code: "BACKEND_DOWN" }`.
- Claude returns 429 → wait 3 s, retry once. If retry also 429 → return `429 { error_code: "RATE_LIMITED", retry_after_seconds: 10 }`.

### Prompt caching node (critical)

The HTTP Request node must send the body **with** `cache_control: ephemeral` on the system block. Example in n8n:

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 700,
  "system": [
    {
      "type": "text",
      "text": "={{ $('Load brand voice').item.json.prompt_text }}",
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": "={{ $('Compose messages').item.json.user_content }}"
    }
  ]
}
```

Headers:
- `x-api-key`: from n8n credentials store
- `anthropic-version`: `2023-06-01`
- `anthropic-beta`: `prompt-caching-2024-07-31`
- `content-type`: `application/json`

Verify caching is working by checking `usage.cache_read_input_tokens` in the
response. On the first request of a 5-min window it will be 0. On subsequent
requests it should be ~900 (the system prompt length).

---

## Workflow 2: `auth-request-link`

**Trigger:** Webhook `POST /webhook/auth/request-link`

| # | Node | Type | Purpose |
|---|---|---|---|
| 1 | **Webhook** | Webhook | Receive `{ email }` |
| 2 | **Validate email domain** | Function (JS) | Must end with `@chatrium.com` or `@maitria.com`. If not → still return 200 but do nothing (don't leak enumeration). |
| 3 | **Lookup or create user** | MySQL | `INSERT INTO users (email) VALUES (?) ON DUPLICATE KEY UPDATE email=email; SELECT id FROM users WHERE email=?` |
| 4 | **Generate token** | Function (JS) | 32-byte random, hex-encoded. TTL 15 minutes. |
| 5 | **Store token** | MySQL | `INSERT INTO login_tokens (user_id, token_hash, expires_at) VALUES (?, SHA2(?,256), NOW() + INTERVAL 15 MINUTE)` |
| 6 | **Send email** | SMTP / Hostinger mail | Subject: "Sign in to Chatrium AI Assistant". Body contains `https://ai.chatrium.com/auth/verify?token=<raw token>` |
| 7 | **Respond** | Respond to Webhook | `{ ok: true }` always |

---

## Workflow 3: `auth-verify`

**Trigger:** Webhook `GET /webhook/auth/verify`

| # | Node | Type | Purpose |
|---|---|---|---|
| 1 | **Webhook** | Webhook | Receive `?token=...` |
| 2 | **Validate token** | MySQL | `SELECT user_id FROM login_tokens WHERE token_hash=SHA2(?,256) AND expires_at > NOW() AND used=FALSE` |
| 3 | **Mark used** | MySQL | `UPDATE login_tokens SET used=TRUE WHERE token_hash=SHA2(?,256)` |
| 4 | **Issue JWT** | Function (JS) | Sign JWT with `user_id`, `exp = NOW + 7 days`, HS256, secret from n8n credentials. |
| 5 | **Set cookie + redirect** | Respond to Webhook | Set-Cookie: `session=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/`. 302 redirect to `/`. |

---

## Additional workflows (Phase 2+)

### `drafts-recent`

`GET /webhook/drafts/recent` → returns last 20 drafts of the signed-in user.

### `admin-update-brand-voice`

`POST /webhook/admin/brand-voice` → guarded by admin role. Inserts new prompt version, deactivates old. See `SPEC.md §2.4`.

### `admin-usage`

`GET /webhook/admin/usage?from=&to=` → aggregates audit_log. Returns per-user counts and cost.

---

## Credentials to create in n8n

| Credential | Type | Scope |
|---|---|---|
| `anthropic_api` | HTTP Header Auth or Custom | Header `x-api-key` = the Anthropic key |
| `chatrium_mysql` | MySQL | Host, port, db `chatrium_ai`, user, password |
| `hostinger_smtp` | SMTP | For sending magic-link emails |
| `jwt_secret` | Generic (variable) | 32-byte random string, used to sign session JWTs |

Never paste these into Function nodes. Always reference via `{{$credentials...}}`.

---

## Exporting the workflow

Once all three workflows are working, export them:

```
n8n export:workflow --all --output=./workflows/
```

Commit the JSON files to the project repo. Do not commit credentials — n8n
exports reference credentials by name only.
