"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  GenerateRequest,
  GenerateResponse,
  InputLanguage,
  Property,
  Role,
  TaskType,
} from "@/lib/schemas";
import type { DraftEntry } from "@/lib/admin/drafts-store";
import { DraftPreview } from "./draft-preview";

// ── Task types are universal for hospitality ──────────────────────────────────
const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "guest_email",       label: "Guest email" },
  { value: "corporate_partner", label: "Corporate / partner" },
  { value: "internal_memo",     label: "Internal memo" },
  { value: "apology_recovery",  label: "Apology & recovery" },
  { value: "upsell_offer",      label: "Upsell / offer" },
];

interface AppConfig {
  app_name: string;
  app_tagline: string;
  brand_voice_author: string;
  properties: { value: string; label: string }[];
  roles: { value: string; label: string }[];
}

const FALLBACK_CONFIG: AppConfig = {
  app_name: "HotelAI",
  app_tagline: "Communication Assistant",
  brand_voice_author: "Brand Manager",
  properties: [{ value: "main", label: "Main Property" }],
  roles:      [{ value: "general_manager", label: "General Manager" }],
};

function formatAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ComposeWorkspace() {
  const [config, setConfig] = useState<AppConfig>(FALLBACK_CONFIG);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [language, setLanguage]               = useState<InputLanguage>("th");
  const [property, setProperty]               = useState<Property>("");
  const [role, setRole]                       = useState<Role>("");
  const [taskType, setTaskType]               = useState<TaskType>("guest_email");
  const [recipientContext, setRecipientContext] = useState("");
  const [objective, setObjective]             = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [result, setResult]           = useState<GenerateResponse | null>(null);
  const [costWarning, setCostWarning] = useState<string | null>(null);
  const [history, setHistory]         = useState<DraftEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    fetch("/api/drafts")
      .then((r) => r.json())
      .then((d: DraftEntry[]) => setHistory(d))
      .catch(() => {});
  }, []);

  // Load config once on mount
  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d: AppConfig) => {
        setConfig(d);
        if (d.properties[0]) setProperty(d.properties[0].value as Property);
        if (d.roles[0])      setRole(d.roles[0].value as Role);
      })
      .catch(() => {
        setProperty(FALLBACK_CONFIG.properties[0]!.value as Property);
        setRole(FALLBACK_CONFIG.roles[0]!.value as Role);
      });

    // Load current user session
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { authenticated?: boolean; email?: string }) => {
        if (d.authenticated) setUserEmail(d.email ?? null);
      })
      .catch(() => {});

    loadHistory();
  }, [loadHistory]);

  function onHistoryClick(entry: DraftEntry) {
    // Restore form fields
    setProperty(entry.input.property as Property);
    setRole(entry.input.role as Role);
    setTaskType(entry.input.task_type as TaskType);
    setRecipientContext(entry.input.recipient_context);
    setObjective(entry.input.objective);
    setAdditionalNotes(entry.input.additional_notes);
    setLanguage(entry.input.input_language as InputLanguage);
    // Restore output
    setResult(entry.result);
    setActiveHistoryId(entry.draft_id);
    setError(null);
    setCostWarning(null);
  }

  function resetForm() {
    if (config.properties[0]) setProperty(config.properties[0].value as Property);
    if (config.roles[0])      setRole(config.roles[0].value as Role);
    setLanguage("th");
    setTaskType("guest_email");
    setRecipientContext("");
    setObjective("");
    setAdditionalNotes("");
    setResult(null);
    setError(null);
    setCostWarning(null);
  }

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
        property: property as Property,
        role: role as Role,
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
      // Surface cost warning header if present
      const warn = res.headers.get("X-Cost-Warning");
      setCostWarning(warn);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as GenerateResponse;
      setResult(data);
      setActiveHistoryId(data.draft_id);
      // Refresh history sidebar after a short delay (server saves async)
      setTimeout(loadHistory, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const initial = config.app_name.charAt(0).toUpperCase();

  return (
    <div className="grid grid-cols-[260px_1fr] min-h-screen">
      {/* ── Sidebar ── */}
      <aside
        className="bg-[#0b0d0f] border-r border-line p-5 flex flex-col gap-4 overflow-y-auto"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div
          className="flex items-center gap-3 pb-4 border-b border-line"
          style={{ borderColor: "var(--color-line)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--color-gold), #8a6d3f)",
              color: "#17191c",
              fontFamily: "Georgia, serif",
            }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="serif text-base tracking-[0.12em] uppercase truncate">{config.app_name}</div>
            <div
              className="text-[11px] tracking-[0.16em] uppercase mt-0.5 truncate"
              style={{ color: "var(--color-muted)" }}
            >
              {config.app_tagline}
            </div>
          </div>
        </div>

        <button type="button" className="btn-gold text-xs py-2.5" onClick={resetForm}>
          + New Draft
        </button>

        {/* ── Draft History ──────────────────────────────────────────────── */}
        {history.length > 0 && (
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "var(--color-muted)" }}>
              Recent Drafts
            </div>
            <div className="space-y-1">
              {history.map((entry) => {
                const isActive = entry.draft_id === activeHistoryId;
                const taskLabel = TASK_TYPES.find((t) => t.value === entry.task_type)?.label ?? entry.task_type;
                const age = formatAge(entry.created_at);
                return (
                  <button
                    key={entry.draft_id}
                    type="button"
                    onClick={() => onHistoryClick(entry)}
                    className="w-full text-left px-2.5 py-2 rounded-lg transition-colors"
                    style={{
                      background: isActive ? "rgba(197,165,114,0.12)" : "transparent",
                      border: `1px solid ${isActive ? "rgba(197,165,114,0.3)" : "transparent"}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      className="text-[12px] leading-tight truncate"
                      style={{ color: isActive ? "#c5a572" : "#d4d6d9" }}
                    >
                      {entry.subject}
                    </div>
                    <div className="flex gap-1.5 items-center mt-1 flex-wrap">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(197,165,114,0.1)", color: "#8a7a60" }}
                      >
                        {taskLabel}
                      </span>
                      <span className="text-[10px]" style={{ color: "#5a5e66" }}>
                        {age}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-1 space-y-2">
          <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: "var(--color-muted)" }}>
            How to use
          </div>
          {["1. Fill in the form", "2. Click Generate Email", "3. Copy → paste into Outlook"].map(
            (s) => (
              <p key={s} className="text-[12px] leading-relaxed" style={{ color: "#c7c9cc" }}>
                {s}
              </p>
            ),
          )}
        </div>

        <div className="mt-auto pt-4 border-t space-y-1" style={{ borderColor: "var(--color-line)" }}>
          <a
            href="/admin/app-settings"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: "#a0a4aa", background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-gold)";
              e.currentTarget.style.background = "rgba(197,165,114,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#a0a4aa";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span className="text-base">⚙</span>
            <span>Admin Settings</span>
          </a>

          {userEmail && (
            <div
              className="px-3 py-2.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p
                className="text-[11px] truncate mb-1.5"
                style={{ color: "#6b7280" }}
                title={userEmail}
              >
                {userEmail}
              </p>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-[11px] tracking-wider hover:opacity-80 transition-opacity"
                  style={{ color: "#a0a4aa" }}
                >
                  Sign out
                </button>
              </form>
            </div>
          )}

          {/* Powered by Wokeflow */}
          <a
            href="https://wokeflow.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 pt-3 pb-1 transition-opacity hover:opacity-100"
            style={{ opacity: 0.35 }}
          >
            <span className="text-[10px] tracking-[0.18em] uppercase" style={{ color: "#c5a572" }}>
              Powered by
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "#c5a572" }}>
              Wokeflow
            </span>
          </a>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-7 py-4 border-b flex items-center justify-between gap-5"
          style={{ background: "#0d0f11", borderColor: "var(--color-line)" }}
        >
          <div>
            <h1 className="serif text-base font-medium tracking-wider m-0">
              Professional Communication Drafting
            </h1>
            <div
              className="text-[11px] tracking-[0.16em] uppercase mt-1"
              style={{ color: "var(--color-muted)" }}
            >
              Brand Voice · {config.brand_voice_author} · Auto-applied
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
              Describe the objective. The brand voice is applied automatically.
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
                  {config.properties.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Your role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {config.roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
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
                placeholder="e.g. Ms. Chen — VIP member — anniversary stay"
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
                placeholder="e.g. mention the restaurant award or upcoming event"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2.5 items-center mt-5 flex-wrap">
              <button type="submit" className="btn-gold" disabled={loading}>
                {loading ? "Drafting…" : "Generate Email ›"}
              </button>
            </div>

            {costWarning && (
              <div
                className="mt-4 p-3 rounded text-[12px]"
                style={{
                  background: "rgba(197, 165, 114, 0.1)",
                  borderLeft: "2px solid #c5a572",
                  color: "#d4c4a0",
                }}
              >
                ⚠ {costWarning}
              </div>
            )}

            {error && (
              <div
                className="mt-4 p-3 rounded text-[12px]"
                style={{
                  background: "rgba(201, 122, 122, 0.08)",
                  borderLeft: "2px solid #c97a7a",
                  color: "#e8d4d4",
                }}
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
              <b>Brand voice enforced automatically:</b> No em-dashes · No slang · Warm professional clarity · Guest-first · Concise and elegant.
            </div>
          </form>

          {/* Right: Output */}
          <section className="overflow-y-auto p-7" style={{ background: "#141619" }}>
            <h2 className="serif text-[22px] tracking-wider m-0 mb-1">Draft Output</h2>
            <p className="text-xs mb-5" style={{ color: "var(--color-muted)" }}>
              English output, brand-aligned and ready to review.
            </p>
            <DraftPreview result={result} loading={loading} brandAuthor={config.brand_voice_author} />
          </section>
        </div>
      </main>
    </div>
  );
}
