# DECISIONS_NEEDED.md

Open questions Sakchai must resolve **before Claude Code starts building**.
None of these block reading the spec, but all of them block writing the first
line of code or workflow.

---

## Critical (block Phase 1 start)

### D-1. Subdomain
- **Question:** Use `ai.chatrium.com` or something else (e.g. `assist.chatrium.com`, `rawai-ai.chatrium.com`)?
- **Default in spec:** `ai.chatrium.com`
- **Owner:** Sakchai + k Anuwat
- **Impact if wrong:** DNS, Caddy config, SMTP "from" address, frontend deploy target.

### D-2. Anthropic API account ownership
- **Question:** Whose name and credit card are on the Anthropic Console account?
- **Options:** (a) Sakchai personal initially, expense reimbursed; (b) Chatrium corporate card from day one.
- **Recommendation:** (b) — corporate card. Avoids reimbursement friction and keeps the API key on a non-personal billing identity.
- **Owner:** k Anuwat
- **Impact if wrong:** Hard to transfer ownership later. Billing audit issues.

### D-3. Brand voice prompt approval
- **Question:** Is the prompt in `BRAND_VOICE_PROMPT.md` good enough to pilot, or does it need MARCOM sign-off first?
- **Recommendation:** Show MARCOM (k Panida) the file, get a one-page approval, then proceed. Iterate inside the app afterwards.
- **Owner:** Sakchai → k Panida (MARCOM)
- **Impact if wrong:** Pilot users see drafts that contradict MARCOM's standards.

### D-4. Pilot user list
- **Question:** Which 5 Rawai staff are the Phase 2 pilot users?
- **Recommendation:** Mix of seniority and function — e.g., Richard (GM), 1 Front Office, 1 Reservations, 1 Sales, 1 Guest Relations.
- **Owner:** Richard A. Mehr
- **Impact if wrong:** Feedback skewed; rollout to 30 users surfaces issues that should have been caught at 5.

### D-5. Hostinger VPS plan
- **Question:** Which existing VPS will host n8n? Or do we provision a new one?
- **Recommendation:** Use a dedicated small VPS (KVM 2: 2 vCPU, 8 GB RAM) so other Chatrium workloads are not at risk.
- **Owner:** Sakchai + k Anuwat
- **Impact if wrong:** Resource contention; harder to debug.

---

## Important (block Phase 2 start, can be deferred 2 weeks)

### D-6. SMTP / magic-link sender
- **Question:** Which mail server sends the magic-link emails? Hostinger email? Microsoft 365? Postmark / Resend?
- **Recommendation:** Hostinger email if SPF/DKIM are clean. Otherwise Postmark (~$15/mo for low volume, very high deliverability).
- **Owner:** Sakchai
- **Impact if wrong:** Login emails go to spam; users blocked from signing in.

### D-7. PDPA owner
- **Question:** Who owns PDPA compliance for guest names appearing in stored drafts?
- **Recommendation:** Whoever owns Chatrium's overall PDPA programme. The app must respect the same retention and right-to-delete policies as the PMS.
- **Owner:** Legal / Compliance lead at Chatrium HQ
- **Impact if wrong:** Audit findings, regulator complaints.

### D-8. MARCOM admin access
- **Question:** Who from MARCOM gets admin access to edit the brand voice prompt?
- **Recommendation:** k Panida + one backup. Limit to two people to avoid prompt drift.
- **Owner:** k Panida
- **Impact if wrong:** Either nobody can update the prompt (bottleneck) or too many people can (drift).

---

## Useful (can be answered during build)

### D-9. Logo and favicon
- **Question:** Do we use the official Chatrium wordmark, or design something pilot-specific?
- **Recommendation:** Use the official wordmark. Ask MARCOM for the SVG.
- **Owner:** MARCOM

### D-10. Outlook integration timing
- **Question:** When does an Outlook plug-in / "Send to Outlook" deep link become a priority?
- **Recommendation:** Park until after Phase 3 is stable. Most users will copy-paste happily for a few weeks.
- **Owner:** Sakchai (defer)

### D-11. Rollout to other properties
- **Question:** When and in what order do other properties get added?
- **Recommendation:** Decide after 4 weeks of Rawai data. Likely order: Grand Bangkok → Riverside Bangkok → Maitria sites.
- **Owner:** k Anuwat + GMs

### D-12. Recipient memory privacy
- **Question:** Should one staff member be able to read drafts another staff member wrote to the same guest?
- **Recommendation:** No, by default. Only the same user sees their own drafts. MARCOM and IT admins can see all (audit role).
- **Owner:** Sakchai
- **Impact if wrong:** Awkward "I didn't write that" moments with guests.

---

## Decision tracking

When you make a decision, edit this file and append to the row:

> **Decided 2026-04-21 by Sakchai:** Going with `ai.chatrium.com`.

Keep the original question intact for audit history.
