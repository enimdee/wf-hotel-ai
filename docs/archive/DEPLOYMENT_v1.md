# DEPLOYMENT.md

How to deploy the Chatrium AI Communication Assistant on Hostinger.

Audience: Sakchai (IT). Assumes basic familiarity with SSH, DNS, and Linux.

---

## Prerequisites

- [ ] Hostinger VPS plan that supports Docker (KVM 2 or higher).
- [ ] Hostinger MySQL database (any shared or managed plan).
- [ ] Hostinger static hosting OR a static directory served by Caddy on the same VPS.
- [ ] Domain `chatrium.com` already managed by Hostinger DNS.
- [ ] Anthropic API key (production, billing enabled).
- [ ] SMTP credentials for sending magic-link emails (Hostinger email or any SMTP provider).

---

## Step 1: DNS

In the Hostinger DNS zone for `chatrium.com`:

| Record | Type | Value | TTL |
|---|---|---|---|
| `ai` | A | `<VPS public IP>` | 3600 |

Confirm: `dig +short ai.chatrium.com` returns the VPS IP.

---

## Step 2: VPS prep

SSH into the VPS as root, then create a non-root user:

```bash
adduser chatrium
usermod -aG sudo chatrium
rsync --archive --chown=chatrium:chatrium ~/.ssh /home/chatrium
```

Install Docker and Docker Compose:

```bash
curl -fsSL https://get.docker.com | sh
sudo apt-get install -y docker-compose-plugin
sudo usermod -aG docker chatrium
```

Log out and back in as `chatrium`.

---

## Step 3: MySQL setup

Create the database via Hostinger control panel:

- Database name: `chatrium_ai`
- Username: `chatrium_app`
- Generate a strong password and store it in your password manager.

Apply the schema:

```bash
mysql -h <hostinger_mysql_host> -u chatrium_app -p chatrium_ai < schema.sql
```

Seed the initial brand voice prompt and pilot users (uncomment the INSERT
statements at the bottom of `schema.sql` after pasting in the actual prompt
text from `BRAND_VOICE_PROMPT.md`).

---

## Step 4: n8n + Caddy via Docker Compose

Create `~/chatrium-ai/docker-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./frontend:/srv/frontend
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - n8n

  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    environment:
      - N8N_HOST=ai.chatrium.com
      - N8N_PROTOCOL=https
      - N8N_PORT=5678
      - WEBHOOK_URL=https://ai.chatrium.com/
      - N8N_PATH=/n8n/
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_ADMIN_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_ADMIN_PASSWORD}
      - GENERIC_TIMEZONE=Asia/Bangkok
      - DB_TYPE=mysqldb
      - DB_MYSQLDB_HOST=${MYSQL_HOST}
      - DB_MYSQLDB_PORT=3306
      - DB_MYSQLDB_DATABASE=chatrium_ai
      - DB_MYSQLDB_USER=${MYSQL_USER}
      - DB_MYSQLDB_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  caddy_data:
  caddy_config:
  n8n_data:
```

Create `~/chatrium-ai/Caddyfile`:

```
ai.chatrium.com {
  encode zstd gzip

  # n8n admin UI (basic-auth protected)
  handle_path /n8n/* {
    reverse_proxy n8n:5678
  }

  # n8n webhooks (the API the frontend calls)
  handle_path /webhook/* {
    reverse_proxy n8n:5678
  }

  # Static frontend
  handle {
    root * /srv/frontend
    try_files {path} {path}.html /index.html
    file_server
  }
}
```

Create `~/chatrium-ai/.env`:

```
N8N_ADMIN_USER=sakchai.nim@chatrium.com
N8N_ADMIN_PASSWORD=<generate-strong-password>

MYSQL_HOST=<hostinger-mysql-host>
MYSQL_USER=chatrium_app
MYSQL_PASSWORD=<from-password-manager>
```

Bring it up:

```bash
cd ~/chatrium-ai
docker compose up -d
docker compose logs -f
```

Verify:
- `https://ai.chatrium.com/n8n/` → n8n login (basic auth) → n8n editor
- `https://ai.chatrium.com/` → 404 until the frontend is uploaded (next step)

---

## Step 5: Frontend deploy

Phase 1 frontend is the static mockup. Copy:

```bash
mkdir -p ~/chatrium-ai/frontend
cp /path/to/assets/mockup.html ~/chatrium-ai/frontend/index.html
# add app.js and app.css if you split them out
```

Replace the static "Generate" button with a real fetch call:

```javascript
async function generate(payload) {
  const r = await fetch('/webhook/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
```

No CORS config needed because frontend and n8n share the `ai.chatrium.com` origin.

---

## Step 6: Configure n8n credentials

Open `https://ai.chatrium.com/n8n/`, sign in, then:

1. **Credentials → New → HTTP Header Auth**
   - Name: `anthropic_api`
   - Header name: `x-api-key`
   - Header value: `<your Anthropic API key>`

2. **Credentials → New → MySQL**
   - Name: `chatrium_mysql`
   - Host, port, database, user, password from `.env`

3. **Credentials → New → SMTP**
   - Name: `hostinger_smtp`
   - From: `noreply@chatrium.com`
   - Host, port, user, pass from Hostinger email settings

---

## Step 7: Import workflows

Build the three workflows per `N8N_WORKFLOW.md`. Once working, export:

```bash
docker exec -it chatrium-ai-n8n-1 n8n export:workflow --all --output=/tmp/wf
docker cp chatrium-ai-n8n-1:/tmp/wf ./workflows
```

Commit `./workflows/*.json` to the project repo.

---

## Step 8: Smoke test

```bash
# Magic link
curl -X POST https://ai.chatrium.com/webhook/auth/request-link \
  -H 'Content-Type: application/json' \
  -d '{"email":"sakchai.nim@chatrium.com"}'
```

Check inbox, click link, verify session cookie is set.

```bash
# Generate
curl -X POST https://ai.chatrium.com/webhook/generate \
  -H 'Content-Type: application/json' \
  -H 'Cookie: session=<jwt>' \
  -d '{
    "input": {
      "property": "rawai",
      "role": "general_manager",
      "task_type": "guest_email",
      "recipient_context": "Ms. Chen, Diamond member, honeymoon",
      "objective": "Confirm booking and offer late check-out",
      "input_language": "en"
    }
  }'
```

Expected: ~6–10 second response with `subject`, `body`, `qc`, `usage`.

---

## Step 9: Pilot rollout

1. Insert 5 pilot users into `users` table.
2. Send each one a "Welcome to the Rawai pilot" email with the magic-link URL.
3. Walk them through one draft each via Teams call.
4. Collect feedback in a Google Form for 2 weeks.
5. Iterate on prompt, then expand to remaining 25 users.

---

## Step 10: Backups

Hostinger provides daily MySQL backups by default. Verify they are enabled
and test a restore once before Phase 2 launch.

For n8n workflow backup, schedule a weekly cron on the VPS:

```bash
# /etc/cron.weekly/n8n-backup
docker exec chatrium-ai-n8n-1 n8n export:workflow --all --output=/tmp/wf-$(date +%F)
docker cp chatrium-ai-n8n-1:/tmp/wf-$(date +%F) /home/chatrium/backups/
```

---

## Rollback plan

If a release breaks production:

1. `docker compose down`
2. Revert `frontend/` to previous version (keep prior copies in `frontend.bak.<date>/`)
3. Re-import previous workflow JSON into n8n
4. `docker compose up -d`

For MySQL schema rollbacks, never DROP columns in production. Add new columns
as nullable, migrate data, then drop in a follow-up release.
