# TASKS — Wokeflow AI Communication Assistant
**อัพเดทล่าสุด:** 21 เมษายน 2569  
**สถานะ:** 🟢 Commercial SaaS — ขายทั่วไป  
**Product URL:** https://wokeflow.net/products/ai-comm  
**Customer #1:** Chatrium Rawai Phuket (ai.wokeflow.net)

---

## ✅ Done — Product Core (Feature Complete)

- [x] AI Email Draft — generate จาก objective ภาษาไทย/อังกฤษ
- [x] Brand Voice Enforcement — ฝัง brand rules ใน AI ถาวร
- [x] Magic-link Auth — login ไม่ต้อง password
- [x] Draft History (A1) — sidebar บันทึก 30 drafts ล่าสุด
- [x] Outlook Deep-link (A2) — "Open in Outlook ↗" 1 คลิก
- [x] Template Library (A3) — 8 templates, modal filter
- [x] Regenerate / Refine (A4) — Shorter/Warmer/Custom + switcher
- [x] Multi-language Output (A5) — EN / 中文 / 日本語 / 한국어 / ไทย
- [x] Cost Ceiling + Usage Dashboard
- [x] Admin Panel (brand voice, users, settings)
- [x] Multi-customer deploy — `new-customer.sh` 10 นาที/customer
- [x] Product Bible v1.0 (MD + DOCX)

---

## 🔴 Active — Go-to-Market (ทำก่อน)

### Product Branding & Sales
- [ ] **GTM-1** Rename repo จาก `chatrium-ai` → `wokeflow-hotel-ai` (generic SaaS name)
- [ ] **GTM-2** Landing page `wokeflow.net/hotel-ai` — value prop, pricing, demo request
- [ ] **GTM-3** Demo instance ที่ใช้ show ลูกค้า (ไม่ใช่ Chatrium data)
- [ ] **GTM-4** Sales deck (PowerPoint/Google Slides) — 10 slides
- [ ] **GTM-5** One-pager PDF สำหรับแจก hotel decision makers

### Operations & Billing
- [ ] **OPS-1** Wokeflow Master Admin — dashboard เห็นทุก customer, usage, status
- [ ] **OPS-2** Subscription gate — auto-suspend เมื่อ payment fail
- [ ] **OPS-3** Payment gateway — Stripe หรือ Omise (บาท)
- [ ] **OPS-4** Terms of Service + Privacy Policy (PDPA compliant)
- [ ] **OPS-5** Onboarding email sequence — welcome → brand voice setup → first draft

### Customer Acquisition
- [ ] **BIZ-1** Customer #2 — identify + pitch (โรงแรม 4–5 ดาว กทม หรือ รีสอร์ท)
- [ ] **BIZ-2** Case study Chatrium Rawai — "ประหยัด X ชม/เดือน" (รอ pilot data)
- [ ] **BIZ-3** Pricing page live บน wokeflow.net

---

## 🔵 Next — Product Tier B

- [ ] **B1** Brand Voice Score — คะแนน 0–100 ต่อ draft
- [ ] **B4** Analytics for Managers — draft/user/week, time saved estimate
- [ ] **B2** Recipient Memory — จำ context ลูกค้า repeat guest
- [ ] **B3** Team Review Workflow — FO draft → GM approve
- [ ] **B5** Mobile-responsive layout

---

## 🟡 Pending — Decisions รอ

- [ ] **D-1** Pricing final — Starter ฿1,990 / Pro ฿3,990 / Enterprise Custom (ยืนยัน)
- [ ] **D-2** Anthropic billing corporate card
- [ ] **D-3** Brand voice sign-off จาก Chatrium MARCOM (Customer #1)
- [ ] **D-4** Pilot user list 30 คน (Chatrium Rawai)
- [ ] **D-5** Custom domain per customer? (ai.chatrium.com) หรือ subdomain.wokeflow.net เท่านั้น

---

## 🔮 Someday — Tier C/D

- [ ] PMS Integration (Opera/Protel)
- [ ] M365 SSO + Outlook Native Add-in
- [ ] White-label (โลโก้/สีของโรงแรมเอง)
- [ ] Guest Review Response AI (Booking.com, Agoda)
- [ ] Marketing Copy AI
- [ ] Cross-property HQ Dashboard
- [ ] ขยายตลาด ASEAN (SG, MY, VN, ID)

---

## 📋 Technical Info

| รายการ | รายละเอียด |
|---|---|
| Repo | github.com/enimdee/chatrium-ai (rename pending GTM-1) |
| Image | ghcr.io/enimdee/chatrium-ai:latest |
| VPS | srv1467971 · KVM2 · 2vCPU/8GB/100GB |
| Capacity | ~5–6 customers/VPS · Scale: KVM4 = 12–14 |
| Deploy | `./scripts/new-customer.sh` → 10 นาที/customer |
| CI/CD | GitHub Actions → push main → deploy อัตโนมัติ |
| AI | Claude Sonnet 4.6 + prompt caching (~86% cost saving) |
| Auth | Magic-link (custom JWT, no third-party) |

## 👥 People

| บทบาท | คน |
|---|---|
| Product Owner / Engineering | Sakchai Nimdee (Wokeflow) |
| Customer #1 Contact | Richard A. Mehr (Chatrium Rawai) |
| VPS / Infra | Anuwat |
