"use client";

import { useState } from "react";
import type {
  GenerateRequest,
  GenerateResponse,
  InputLanguage,
  Property,
  Role,
  TaskType,
} from "@/lib/schemas";
import { DraftPreview } from "./draft-preview";

const PROPERTIES: { value: Property; label: string }[] = [
  { value: "rawai", label: "Chatrium Rawai Phuket" },
  { value: "grand_bangkok", label: "Chatrium Grand Bangkok" },
  { value: "riverside_bangkok", label: "Chatrium Riverside Bangkok" },
  { value: "maitria_rama9", label: "Maitria Residence Rama 9" },
  { value: "maitria_sukhumvit18", label: "Maitria Hotel Sukhumvit 18" },
];

const ROLES: { value: Role; label: string }[] = [
  { value: "general_manager", label: "General Manager" },
  { value: "front_office_manager", label: "Front Office Manager" },
  { value: "sales_marketing", label: "Sales & Marketing" },
  { value: "reservations", label: "Reservations" },
  { value: "guest_relations", label: "Guest Relations" },
];

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "guest_email", label: "Guest email" },
  { value: "corporate_partner", label: "Corporate / partner" },
  { value: "internal_memo", label: "Internal memo" },
  { value: "apology_recovery", label: "Apology & recovery" },
  { value: "upsell_offer", label: "Upsell / offer" },
];

export function ComposeWorkspace() {
  const [language, setLanguage] = useState<InputLanguage>("th");
  const [property, setProperty] = useState<Property>("rawai");
  const [role, setRole] = useState<Role>("general_manager");
  const [taskType, setTaskType] = useState<TaskType>("guest_email");
  const [recipientContext, setRecipientContext] = useState("");
  const [objective, setObjective] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (objective.trim().length < 10) {
      setError("Please describe the objective in more detail (minimum 10 characters).");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    const payload: GenerateRequest = {
      input: {
        property,
        role,
        task_type: taskType,
        recipient_context: recipientContext,
        objective,
        input_language: language,
        additional_notes: additionalNotes,
      },
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as GenerateResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-[260px_1fr] min-h-screen">
      {/* Sidebar */}
      <aside
        className="bg-[#0b0d0f] border-r border-line p-5 flex flex-col gap-4 overflow-y-auto"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-center gap-3 pb-4 border-b border-line" style={{ borderColor: "var(--color-line)" }}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
            style={{
              background: "linear-gradient(135deg, var(--color-gold), #8a6d3f)",
              color: "#17191c",
              fontFamily: "Georgia, serif",
            }}
          >
            C
          </div>
          <div>
            <div className="serif text-lg tracking-[0.14em] uppercase">Chatrium</div>
            <div className="text-[11px] text-muted tracking-[0.18em] uppercase mt-0.5" style={{ color: "var(--color-muted)" }}>
              AI Assistant
            </div>
          </div>
        </div>

        <button type="button" className="btn-gold text-xs py-2.5">+ New Draft</button>

        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: "var(--color-muted)" }}>
            Phase 1 notice
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "#c7c9cc" }}>
            Drafts are not saved yet. History, templates, and auth arrive in Phase 2.
          </p>
        </div>

        <div className="mt-auto p-3 rounded-lg flex items-center gap-2.5" style={{ background: "var(--color-panel)" }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[13px]"
            style={{ background: "#2a2d33", color: "var(--color-gold)" }}
          >
            P1
          </div>
          <div>
            <div className="text-[12px]">Preview build</div>
            <div className="text-[11px]" style={{ color: "var(--color-muted)" }}>
              Rawai pilot
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col overflow-hidden">
        <div
          className="px-7 py-4 border-b flex items-center justify-between gap-5"
          style={{ background: "#0d0f11", borderColor: "var(--color-line)" }}
        >
          <div>
            <h1 className="serif text-base font-medium tracking-wider m-0">Professional Communication Drafting</h1>
            <div className="text-[11px] tracking-[0.16em] uppercase mt-1" style={{ color: "var(--color-muted)" }}>
              Brand Voice · Rene Balmer · v1.0 · Auto-applied
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["Emotional", "Connection", "Example", "Remarkable"].map((p) => (
              <span
                key={p}
                className="text-[11px] px-2.5 py-1 rounded-full tracking-wider border"
                style={{
                  borderColor: "var(--color-line)",
                  background: "var(--color-panel)",
                  color: "#c7b48a",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden">
          {/* Left: Form */}
          <form
            onSubmit={onSubmit}
            className="overflow-y-auto p-7 lg:border-r"
            style={{ background: "#111316", borderColor: "var(--color-line)" }}
          >
            <h2 className="serif text-[22px] tracking-wider m-0 mb-1">Compose</h2>
            <p className="text-xs mb-5" style={{ color: "var(--color-muted)" }}>
              Describe the objective. The Chatrium brand voice is applied automatically.
            </p>

            <div className="field mb-4">
              <label>Input language</label>
              <div className="toggle-group">
                <button type="button" className={language === "th" ? "active" : ""} onClick={() => setLanguage("th")}>
                  ไทย
                </button>
                <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
                  English
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 mb-4">
              <div className="field">
                <label>Property</label>
                <select value={property} onChange={(e) => setProperty(e.target.value as Property)}>
                  {PROPERTIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Your role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field mb-4">
              <label>Task type</label>
              <div className="flex gap-1.5 flex-wrap">
                {TASK_TYPES.map((t) => (
                  <span
                    key={t.value}
                    className={`chip ${taskType === t.value ? "active" : ""}`}
                    onClick={() => setTaskType(t.value)}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="field mb-4">
              <label>Recipient context</label>
              <input
                type="text"
                placeholder="e.g. Ms. Chen — Diamond member — honeymoon stay Apr 24–28"
                value={recipientContext}
                onChange={(e) => setRecipientContext(e.target.value)}
              />
            </div>

            <div className="field mb-4">
              <label>Your objective (Thai or English)</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="อธิบายวัตถุประสงค์ของ email เช่น ยืนยันการจอง, ขอโทษลูกค้า, offer upgrade..."
              />
            </div>

            <div className="field mb-4">
              <label>Additional notes (optional)</label>
              <input
                type="text"
                placeholder="e.g. mention MICHELIN 2026 recognition for Etcha"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2.5 items-center mt-5 flex-wrap">
              <button type="submit" className="btn-gold" disabled={loading}>
                {loading ? "Drafting…" : "Generate Email ›"}
              </button>
            </div>

            {error && (
              <div
                className="mt-4 p-3 rounded text-[12px]"
                style={{ background: "rgba(201, 122, 122, 0.08)", borderLeft: "2px solid #c97a7a", color: "#e8d4d4" }}
              >
                {error}
              </div>
            )}

            <div
              className="mt-5 px-3.5 py-3 text-[12px] rounded-r"
              style={{
                background: "rgba(197, 165, 114, 0.06)",
                borderLeft: "2px solid var(--color-gold)",
                color: "#d8d6cf",
              }}
            >
              <b>Brand voice enforced automatically:</b> No em-dashes · No slang · Warm executive clarity · Guest-first · Concise and elegant.
            </div>
          </form>

          {/* Right: Output */}
          <section className="overflow-y-auto p-7" style={{ background: "#141619" }}>
            <h2 className="serif text-[22px] tracking-wider m-0 mb-1">Draft Output</h2>
            <p className="text-xs mb-5" style={{ color: "var(--color-muted)" }}>
              English output, brand-aligned and ready to review.
            </p>
            <DraftPreview result={result} loading={loading} />
          </section>
        </div>
      </main>
    </div>
  );
}
