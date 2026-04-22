# Product Bible
# Wokeflow AI Communication Assistant
### สำหรับอุตสาหกรรมการบริการ (Hospitality)

**เวอร์ชัน:** 1.1  
**วันที่:** 21 เมษายน 2569  
**เจ้าของ Product:** Sakchai Nimdee — Wokeflow  
**สถานะ:** 🟢 Commercial SaaS — General Availability  
**Customer #1:** Chatrium Rawai Phuket (Reference Customer)

---

> ⚠️ **Strategic Note (v1.1):** Product นี้ไม่ได้สร้างเพื่อ Chatrium โรงแรมเดียว — Chatrium Rawai เป็น Customer #1 และ Reference Customer เท่านั้น  
> **Wokeflow AI Communication Assistant** เป็น SaaS product ของ Wokeflow สำหรับขายให้โรงแรม 4–5 ดาวทั่วไป

---

## 1. ONE-LINER

> **Wokeflow AI** ช่วยให้พนักงานโรงแรมเขียน email ภาษาอังกฤษระดับมืออาชีพที่ตรงกับ brand voice ของโรงแรม ภายใน 10 วินาที โดยพิมพ์เพียงวัตถุประสงค์เป็นภาษาไทย

---

## 2. ปัญหาที่แก้ไข (Problem Statement)

### ปัญหาหลัก

โรงแรมระดับ 4–5 ดาวในไทยมีพนักงานที่ต้องเขียน email ภาษาอังกฤษวันละ 20–50 ฉบับ ได้แก่ Front Office, Reservations, Sales, Guest Relations และ GM ปัญหาที่เกิดขึ้นมี 3 ระดับ:

| ระดับ | ปัญหา | ผลกระทบ |
|---|---|---|
| **พนักงาน** | ภาษาอังกฤษไม่มั่นใจ ใช้เวลาเขียน 10–20 นาที/ฉบับ | ทำงานอื่นได้น้อยลง / เครียด |
| **Manager** | draft ที่พนักงานส่งให้ review มักไม่ตรง brand voice | แก้ไขซ้ำ เสียเวลา GM |
| **MARCOM/HQ** | ไม่มีทางรู้ว่า email ที่ส่งออกไปทุกวัน on-brand หรือไม่ | ความสม่ำเสมอของ brand เสีย |

### ทำไม solution เดิมไม่พอ

| วิธีเดิม | ข้อเสีย |
|---|---|
| ChatGPT / Gemini (free) | ไม่รู้จัก brand voice ของโรงแรม ต้องพิมพ์ context ทุกครั้ง ผลลัพธ์ไม่สม่ำเสมอ |
| Grammarly | แก้ grammar เท่านั้น ไม่ generate draft ให้ |
| Template Word/Excel | ไม่ยืดหยุ่น ยังต้องเขียนเนื้อหาหลักเอง |
| จ้าง native speaker review | ช้า แพง ไม่ scalable |

---

## 3. Solution

**Wokeflow AI** คือ web application ที่ฝัง brand voice ของโรงแรมไว้ใน AI model ถาวร พนักงานพิมพ์แค่วัตถุประสงค์ (ภาษาไทยหรืออังกฤษ) แล้ว AI generate email สำเร็จรูปออกมาพร้อมใช้ ผ่าน Outlook ได้ใน 1 คลิก

### กระบวนการ (User Flow)

```
พนักงานเปิด ai.[hotel].wokeflow.net
        ↓
เลือก Template (หรือพิมพ์ objective เอง)
        ↓  ~10 วินาที
AI generate draft (English + brand voice)
        ↓
ตรวจ → Refine ถ้าต้องการ (Shorter / Warmer / ฯลฯ)
        ↓
"Open in Outlook" → 1 คลิก → ใส่ recipient → ส่ง
```

### เวลาที่ประหยัดได้

| ขั้นตอน | เดิม | ใหม่ |
|---|---|---|
| คิด/เขียน draft | 10–20 นาที | พิมพ์ objective 1–2 นาที |
| แก้ไขตาม brand | 5–10 นาที (GM review) | อัตโนมัติ |
| Copy → Outlook | 2–3 นาที (5–7 steps) | 1 คลิก |
| **รวม** | **~20–30 นาที/ฉบับ** | **~3–5 นาที/ฉบับ** |

โรงแรมที่มีพนักงานส่ง email 30 ฉบับ/วัน → **ประหยัด 8–12 ชั่วโมง/วัน**

---

## 4. กลุ่มเป้าหมาย (Target Market)

### Primary Market: โรงแรมระดับ 4–5 ดาวในไทย

| Segment | จำนวน | Notes |
|---|---|---|
| โรงแรมระดับ 4–5 ดาว (กทม + รีสอร์ท) | ~800 แห่ง | ตลาดหลัก |
| โรงแรม boutique 3 ดาวขึ้นไป | ~2,000 แห่ง | Secondary |
| Hotel chains (Chatrium, Centara, Dusit) | ~50 groups | Enterprise |
| โรงแรมในอาเซียน (เฟส 2+) | ~5,000 แห่ง | ขยาย |

### Go-to-Market Strategy

**Customer #1 (Reference):** Chatrium Rawai Phuket  
→ ใช้เป็น case study + testimonial → ขายโรงแรม 4–5 ดาวอื่นทั่วไทยและ ASEAN

**Target acquisition pipeline:**
- Customer #2–5: โรงแรม 4–5 ดาวในกรุงเทพ / ภูเก็ต / เชียงใหม่
- Customer #6–20: ขยาย chain hotels (Centara, Dusit, ONYX)
- Customer #21+: ASEAN (SG, MY, VN, ID)

### User Personas

**Persona 1: Pim — Front Office Staff (28 ปี)**
- ส่ง email 30–40 ฉบับ/วัน ทั้ง guest, OTA, ทีมงาน
- ภาษาอังกฤษพอใช้แต่ไม่มั่นใจเรื่อง formal tone
- Goal: ส่ง email ถูกต้อง รวดเร็ว ไม่ต้องรอ GM แก้

**Persona 2: Khun Nok — General Manager (45 ปี)**
- review draft ของทีม 5–10 ฉบับ/วัน
- อยากแน่ใจว่า brand voice ถูกต้องก่อนส่ง
- Goal: ลด review time, เห็น analytics ว่าทีมใช้งานจริง

**Persona 3: MARCOM Manager (HQ)**
- ดูแล brand voice ของทุก property
- ปัจจุบันไม่รู้ว่า email ที่ส่งออกไปทุกวัน on-brand หรือไม่
- Goal: มี central control, report ให้ CEO ได้

---

## 5. Features หลัก (Feature Set)

### ✅ Launched (v1.0 — เมษายน 2569)

| Feature | คำอธิบาย |
|---|---|
| **AI Email Draft** | Generate email ภาษาอังกฤษจาก objective ภาษาไทย/อังกฤษ |
| **Brand Voice Enforcement** | Prompt engineering ฝัง brand rules ถาวร — พนักงานเปลี่ยนไม่ได้ |
| **Magic-link Auth** | Login ผ่าน email link ไม่ต้องจำ password |
| **Draft History** | บันทึก draft ทุกฉบับ — click กลับมาแก้ต่อได้ |
| **Outlook Deep-link** | 1 คลิกเปิด Outlook พร้อม subject + body |
| **Regenerate / Refine** | Shorter / Warmer / More formal / Custom instruction |
| **Template Library** | 8 templates สำเร็จรูปสำหรับ scenarios ที่พบบ่อย |
| **Multi-language Output** | Generate email ภาษา EN / 中文 / 日本語 / 한국어 / ไทย |
| **QC Auto-check** | ตรวจ 5 จุด: no em-dash, no slang, CTA, loyalty mention, length |
| **Cost Ceiling** | จำกัด cost/เดือน ป้องกันค่าใช้จ่าย AI เกินงบ |
| **Admin Dashboard** | Brand voice editor, user management, usage analytics |
| **Multi-property** | รองรับหลาย property ใน 1 instance |

### 🔜 Roadmap (เฟส 2 — Q3 2569)

| Priority | Feature | Impact |
|---|---|---|
| High | **Brand Voice Score** | ให้คะแนน 0–100 ต่อ draft — MARCOM มี data |
| High | **Analytics for Managers** | draft/user/week, avg score, time saved estimate |
| Medium | **Recipient Memory** | จำ context ลูกค้า repeat guest |
| Medium | **Team Review Workflow** | FO draft → GM approve → send |
| Medium | **Mobile-responsive** | ใช้ได้บนมือถือ |

### 🔮 Long-term (เฟส 3–4)

- M365 SSO + Outlook Native Add-in
- PMS Integration (Opera / Protel)
- Guest Review Response AI (Booking.com, Google)
- Marketing Copy AI (Newsletter, Social)
- Cross-property Analytics (HQ view)

---

## 6. Business Model

### Pricing Structure

**SaaS รายเดือน — Per Instance (Per Hotel)**

| Plan | ราคา/เดือน | Users | Features |
|---|---|---|---|
| **Starter** | ฿1,990 | ≤10 users | Core features, 1 property |
| **Professional** | ฿3,990 | ≤50 users | All features, 3 properties, analytics |
| **Enterprise** | Custom | Unlimited | SSO, SLA, custom brand voice, HQ dashboard |

> *ตัวเลข pricing เป็น draft — ยืนยันกับ pilot feedback ก่อน go-live*

### Unit Economics (ประมาณการ)

| รายการ | ต่อ instance/เดือน |
|---|---|
| Claude API cost (500 drafts × ฿0.15) | ~฿75 |
| VPS infra cost (shared) | ~฿200 |
| **COGS รวม** | **~฿275** |
| Revenue (Starter) | ฿1,990 |
| **Gross Margin** | **~86%** |

### Revenue Model

- **MRR target Y1:** 10 hotels × ฿3,990 = ฿39,900/เดือน (~฿480K/ปี)
- **MRR target Y2:** 50 hotels × ฿3,990 = ฿199,500/เดือน (~฿2.4M/ปี)
- **Upsell:** Enterprise plan + custom brand voice setup fee ฿15,000–30,000

### Go-to-Market

1. **Chatrium pilot** → testimonial + case study
2. **Direct sales** ผ่าน connections ใน hospitality (Sakchai network)
3. **Channel partner** ผ่าน hotel technology vendors (PMS vendors, OTA managers)
4. **Inbound** ผ่าน content เรื่อง hotel AI, LinkedIn hospitality community

---

## 7. เทคโนโลยี (Technical Stack)

| ชั้น | เทคโนโลยี | เหตุผล |
|---|---|---|
| Frontend | Next.js 15, React 19, Tailwind 4 | Modern, fast, SSR |
| AI | Claude Sonnet (Anthropic) + Prompt Caching | คุณภาพสูง, cost ต่ำด้วย caching |
| Auth | Custom magic-link (JWT + HMAC-SHA256) | ไม่ต้องพึ่ง third-party, works on Edge |
| Data (Phase 1) | File-based JSON (no DB) | Deploy ง่าย, scale ได้ถึง 200 users/instance |
| Data (Phase 2) | MySQL 8 + Drizzle ORM | Multi-tenant ready |
| Deployment | Docker Compose + Traefik + Hostinger VPS | Per-customer isolation |
| CI/CD | GitHub Actions → ghcr.io → VPS | Push-to-deploy ใน 3 นาที |

### Deployment Architecture

```
Customer A: ai.chatrium-rawai.wokeflow.net
Customer B: ai.grand-bkk.wokeflow.net
Customer C: ai.maitria.wokeflow.net
         ↕              ↕              ↕
   [Container]    [Container]    [Container]    ← isolated per customer
   [MySQL]        [MySQL]        [MySQL]
         ↕              ↕              ↕
              [Traefik + TLS]
              [Hostinger VPS KVM2]
              2 vCPU / 8GB RAM / 100GB NVMe
```

**VPS Capacity:** รองรับ 5–6 customers ต่อ VPS (KVM2 / 8GB)  
**Scale path:** KVM4 (16GB) → 12–14 customers, หรือเพิ่ม VPS

---

## 8. Competitive Advantage

| ข้อได้เปรียบ | คำอธิบาย |
|---|---|
| **Brand Voice Lock-in** | ฝัง brand rules ไว้ใน system prompt — พนักงานเปลี่ยนไม่ได้ ทำให้ output สม่ำเสมอ 100% |
| **Hospitality-specific** | Templates, task types, QC rules ออกแบบมาสำหรับโรงแรมโดยเฉพาะ |
| **Thai-first Input** | Staff พิมพ์ภาษาไทยได้ ไม่ต้องแปลก่อน — ลด friction หลัก |
| **Multi-language Output** | สร้าง email ภาษาจีน/ญี่ปุ่น/เกาหลีได้ในคลิกเดียว — Critical สำหรับ APAC hotels |
| **Outlook Integration** | 1 คลิกเปิด Outlook พร้อม pre-fill — ลด workflow จาก 7 steps เหลือ 2 |
| **Per-instance Isolation** | Data ของแต่ละโรงแรมแยกกันสมบูรณ์ — ตอบโจทย์ enterprise ด้าน security |
| **Cost Predictability** | Hard ceiling รายเดือน ป้องกัน overspend AI cost |
| **Deploy in 10 min** | Onboard customer ใหม่ได้ใน 10 นาที ด้วย script เดียว |

---

## 9. Constraints & Non-goals

### สิ่งที่ตั้งใจไม่ทำ (Non-goals)

- ❌ **ส่ง email อัตโนมัติ** — พนักงานต้อง copy-paste เสมอ (human-in-the-loop)
- ❌ **Multi-tenant DB** — แต่ละ customer มี DB ของตัวเอง
- ❌ **Voice input / Image generation / File upload**
- ❌ **Fine-tune custom model** — Claude ดีพอแล้ว, prompt engineering เพียงพอ
- ❌ **Real-time collaboration** — ไม่ใช่ Google Docs
- ❌ **CRM / PMS replacement** — เป็นแค่ email drafting tool

### Constraints

- ต้องใช้งานได้โดยไม่ต้องติดตั้งอะไร (web-only)
- Login ต้องง่ายมาก (magic-link, ไม่มี password)
- ราคา AI cost ต้องควบคุมได้ (hard ceiling)
- Draft ต้องใช้งานได้จาก Outlook โดยตรง (ไม่ใช่แค่ copy text)

---

## 10. Metrics ความสำเร็จ (Success Metrics)

### Pilot KPIs (Chatrium Rawai — 3 เดือนแรก)

| Metric | Target |
|---|---|
| DAU / Registered Users | ≥ 50% (15/30 users ใช้ทุกวัน) |
| Drafts per active user/day | ≥ 5 drafts |
| Time-to-draft (median) | ≤ 90 วินาที |
| GM review rejection rate | ลดลง ≥ 50% vs baseline |
| NPS (staff survey) | ≥ 40 |
| Cost per draft | ≤ ฿0.20 |

### Business KPIs (Y1)

| Metric | Target |
|---|---|
| MRR | ฿40,000 (10 customers) |
| Customer churn | ≤ 5%/เดือน |
| Gross Margin | ≥ 80% |
| CAC | ≤ ฿10,000 |
| LTV | ≥ ฿120,000 (2 ปี × Professional) |

---

## 11. ความเสี่ยงและการรับมือ (Risks)

| ความเสี่ยง | โอกาส | ผลกระทบ | วิธีรับมือ |
|---|---|---|---|
| Staff ไม่ยอม adopt | Medium | High | Training + quick win demo, template ลด friction |
| AI hallucinate ข้อมูลผิด | Low | High | Staff review ก่อนส่งเสมอ, QC check |
| Anthropic เพิ่มราคา API | Low | Medium | Cost ceiling + provider switching (OpenAI/Gemini ready) |
| โรงแรมเปลี่ยน brand voice | Low | Medium | Admin self-serve editor — MARCOM แก้ได้เอง |
| Data breach | Very Low | High | Per-instance isolation, httpOnly cookie, no PII stored in AI |
| Competitor ทำเหมือนกัน | Medium | Medium | Brand voice lock-in + hospitality-specific UX = moat |

---

## 12. Open Decisions (รอตัดสินใจ)

| ID | เรื่อง | ผู้รับผิดชอบ | Deadline |
|---|---|---|---|
| D-1 | Pricing final (pilot feedback) | Sakchai | หลัง pilot เดือน 1 |
| D-2 | Anthropic billing ownership (corporate card) | Sakchai | ก่อน go-live |
| D-3 | Brand voice MARCOM sign-off (Chatrium) | Richard Mehr | เดือน 1 |
| D-4 | Pilot user list 30 คน | Richard Mehr | เดือน 1 |
| D-5 | Subdomain final (ai.chatrium.com vs ai.wokeflow.net) | Sakchai + IT | ก่อน staff training |

---

## 13. People

| บทบาท | คน | Contact |
|---|---|---|
| Product / Engineering | Sakchai Nimdee (Wokeflow) | sakchai.nim@chatrium.com |
| Brand Voice | MARCOM via Sakchai | — |
| Pilot Customer | Richard A. Mehr | richard.meh@chatrium.com |
| VPS / Infra | Anuwat | anuwat.wat@chatrium.com |

---

## 14. Changelog

| วันที่ | เวอร์ชัน | รายการ |
|---|---|---|
| 21 เม.ย. 2569 | 1.1 | Strategic pivot — เปลี่ยนจาก Chatrium internal tool → Wokeflow commercial SaaS |
| 21 เม.ย. 2569 | 1.0 | Initial Product Bible — post Tier A feature complete |
| — | 0.9 | Sprint 1 (Auth + Cost tracking + Wokeflow branding) |
| — | 0.1 | Phase 1 scaffold (compose + generate API) |

---

*Document นี้เป็น living document — อัพเดทเมื่อ feature, pricing หรือ strategy เปลี่ยน*  
*เจ้าของ: Sakchai Nimdee / Wokeflow — อย่า distribute โดยไม่ได้รับอนุญาต*
