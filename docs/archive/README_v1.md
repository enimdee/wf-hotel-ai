# Chatrium AI Communication Assistant

Internal web app that drafts brand-aligned guest emails for Chatrium Rawai Phuket.
Pilot scope: ~30 users. Built on Hostinger + n8n + Anthropic Claude.

## For humans starting here

Read these in order:

1. **`CLAUDE.md`** — project bootstrap (the most important file)
2. **`SPEC.md`** — what the app does, in detail
3. **`ARCHITECTURE.md`** — how it is built
4. **`DECISIONS_NEEDED.md`** — open questions that need your answer before coding starts

## For Claude Code

Start with `CLAUDE.md`. Everything else is referenced from there.

## Quick facts

| Item | Value |
|---|---|
| Pilot users | ~30 (Chatrium Rawai Phuket) |
| Total addressable | ~200 (all Chatrium + Maitria properties) |
| Estimated emails / month | ~6,600 at pilot scale |
| Tech stack | Hostinger VPS · n8n · MySQL · Anthropic Claude Sonnet 4.6 |
| Year-1 cost estimate | ~฿18,000–25,000 (mostly Claude API) |
| Build effort | 2 weeks part-time DIY |
| Owner | Sakchai Nimdee (IT) |
| Sponsor | k Anuwat (IT), Richard Mehr (Rawai GM) |

## File map

```
chatrium-ai-project/
├── README.md                  ← you are here
├── CLAUDE.md                  ← project bootstrap (start here for Claude Code)
├── SPEC.md                    ← functional requirements + API contract
├── ARCHITECTURE.md            ← tech design
├── BRAND_VOICE_PROMPT.md      ← Claude system prompt
├── N8N_WORKFLOW.md            ← workflow node-by-node
├── schema.sql                 ← MySQL schema
├── DEPLOYMENT.md              ← Hostinger deploy steps
├── DECISIONS_NEEDED.md        ← open questions
└── assets/
    └── mockup.html            ← UI reference for Phase 1
```
