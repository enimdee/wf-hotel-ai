"use client";

import { useState, useEffect, useRef } from "react";
import type { GenerateResponse } from "@/lib/schemas";

// ── Preset refine instructions ────────────────────────────────────────────────
const PRESETS = [
  { label: "Shorter",       instruction: "Make this email 30% shorter. Remove redundancy but keep all essential information and the warm, professional tone." },
  { label: "Warmer",        instruction: "Make the tone warmer and more personal. Add a touch more emotional connection while remaining professional and brand-aligned." },
  { label: "More formal",   instruction: "Make the tone slightly more formal and businesslike while staying within the brand voice guidelines." },
  { label: "Add detail",    instruction: "Add one more specific, personalised detail or thoughtful touch. Keep the email concise overall." },
  { label: "↻ New version", instruction: "Rewrite this draft completely with fresh phrasing and sentence structure. Preserve every fact and maintain the brand voice." },
] as const;

export function DraftPreview({
  result,
  loading,
  brandAuthor,
}: {
  result: GenerateResponse | null;
  loading: boolean;
  brandAuthor?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [outlookStatus, setOutlookStatus] = useState<"idle" | "opened" | "copied">("idle");

  // ── Variant state ──────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<GenerateResponse[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState("");
  const prevResultId = useRef<string | null>(null);

  // Reset variants whenever a brand-new generation arrives from parent
  useEffect(() => {
    if (result && result.draft_id !== prevResultId.current) {
      prevResultId.current = result.draft_id;
      setVariants([result]);
      setActiveIdx(0);
      setRefineError(null);
    }
  }, [result]);

  // The draft currently shown (may be a refined variant)
  const activeDraft = variants[activeIdx] ?? result;

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "var(--color-muted)" }}>
        Drafting your email… typically 6–10 seconds.
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="rounded-lg border p-8 space-y-5"
        style={{ borderColor: "var(--color-line)", background: "#0d0f11" }}
      >
        <div className="text-center" style={{ color: "var(--color-muted)" }}>
          <div className="text-3xl mb-3">✉</div>
          <div className="text-[13px]">Your draft will appear here.</div>
          <div className="text-[12px] mt-1" style={{ color: "#5a5e66" }}>
            Fill in the form on the left, then click Generate Email.
          </div>
        </div>
        <div
          className="rounded-lg p-4 space-y-2 text-[12px]"
          style={{
            background: "var(--color-panel)",
            borderLeft: "2px solid var(--color-gold)",
            color: "#c7b48a",
          }}
        >
          <div
            className="font-semibold tracking-wide uppercase text-[10px]"
            style={{ color: "var(--color-gold)" }}
          >
            Brand Voice{brandAuthor ? `: ${brandAuthor}` : ""}
          </div>
          {[
            "Emotional — write to a real person, not a file",
            "Connection — reference the guest's history",
            "Example — be specific, name the property and amenity",
            'Remarkable — close with "Remarkably yours,"',
          ].map((tip) => (
            <div key={tip} className="flex gap-2 items-start">
              <span style={{ color: "var(--color-gold)" }}>·</span>
              <span style={{ color: "#c7c9cc" }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const copyToClipboard = async () => {
    if (!activeDraft) return;
    const text = `Subject: ${activeDraft.subject}\n\n${activeDraft.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInOutlook = async () => {
    if (!activeDraft) return;
    const subject = encodeURIComponent(activeDraft.subject);
    const body    = encodeURIComponent(activeDraft.body);
    const url     = `mailto:?subject=${subject}&body=${body}`;

    if (url.length <= 1900) {
      // Happy path — open the user's default mail client directly
      const a = document.createElement("a");
      a.href = url;
      a.click();
      setOutlookStatus("opened");
      setTimeout(() => setOutlookStatus("idle"), 3000);
    } else {
      // Body too long for mailto: — copy to clipboard instead
      await navigator.clipboard.writeText(`Subject: ${activeDraft!.subject}\n\n${activeDraft!.body}`);
      setOutlookStatus("copied");
      setTimeout(() => setOutlookStatus("idle"), 4000);
    }
  };

  // ── Refine: call /api/refine, push new variant ────────────────────────────
  const refine = async (instruction: string) => {
    if (!activeDraft || refineLoading) return;
    setRefineLoading(true);
    setRefineError(null);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { subject: activeDraft.subject, body: activeDraft.body },
          instruction,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const refined = await res.json() as GenerateResponse;
      setVariants((prev) => [...prev, refined]);
      setActiveIdx((prev) => prev + 1);
      setCustomInstruction("");
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Refine failed");
    } finally {
      setRefineLoading(false);
    }
  };

  if (!activeDraft) return null;

  const qcChecks: { label: string; ok: boolean }[] = [
    { label: "No em-dashes",       ok: activeDraft.qc.no_em_dash },
    { label: "No slang",           ok: activeDraft.qc.no_slang },
    { label: "CTA included",       ok: activeDraft.qc.cta_present },
    { label: "Loyalty recognised", ok: activeDraft.qc.loyalty_recognised },
    { label: "Length sane",        ok: activeDraft.qc.length_ok },
  ];

  return (
    <div>
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background: "#0d0f11",
          borderColor: "var(--color-line)",
          boxShadow: "0 8px 40px rgba(0,0,0,.28)",
        }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between border-b gap-2"
          style={{ background: "var(--color-panel)", borderColor: "var(--color-line)" }}
        >
          <span
            className="text-[11px] tracking-[0.14em] uppercase shrink-0"
            style={{ color: "var(--color-gold)" }}
          >
            Generated · Business English
          </span>
          <div className="flex gap-2 items-center">
            {/* Outlook deep-link button */}
            <button
              type="button"
              onClick={openInOutlook}
              title="Open in your default email client (Outlook)"
              className="text-[11px] px-3 py-1.5 rounded border cursor-pointer transition-colors"
              style={{
                background:
                  outlookStatus === "opened" ? "rgba(197,165,114,0.15)"
                  : outlookStatus === "copied" ? "rgba(100,180,100,0.12)"
                  : "transparent",
                color:
                  outlookStatus === "opened" ? "var(--color-gold)"
                  : outlookStatus === "copied" ? "var(--color-success)"
                  : "var(--color-muted)",
                borderColor:
                  outlookStatus === "opened" ? "var(--color-gold)"
                  : outlookStatus === "copied" ? "var(--color-success)"
                  : "var(--color-line)",
              }}
            >
              {outlookStatus === "opened" ? "✓ Opening…"
               : outlookStatus === "copied" ? "✓ Copied — paste in Outlook"
               : "Open in Outlook ↗"}
            </button>

            {/* Copy all button */}
            <button
              type="button"
              onClick={copyToClipboard}
              className="text-[11px] px-3 py-1.5 rounded border cursor-pointer"
              style={{
                background: "transparent",
                color: copied ? "var(--color-success)" : "var(--color-muted)",
                borderColor: copied ? "var(--color-success)" : "var(--color-line)",
              }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>

        <div
          className="p-6 text-[14px] leading-[1.75]"
          style={{ fontFamily: "Georgia, serif", color: "var(--color-ink)" }}
        >
          <p className="mb-3">
            <b>Subject:</b> {activeDraft.subject}
          </p>
          <div className="whitespace-pre-wrap">{activeDraft.body}</div>
        </div>
      </div>

      <div
        className="flex gap-4 mt-4 px-4 py-2.5 rounded text-[12px] flex-wrap"
        style={{ background: "var(--color-panel)", color: "var(--color-muted)" }}
      >
        {qcChecks.map((c) => (
          <span key={c.label} className="flex items-center gap-1.5">
            <span className={`qc-dot ${c.ok ? "" : "fail"}`} />
            {c.label}: {c.ok ? "passed" : "check"}
          </span>
        ))}
      </div>

      {/* Variant switcher */}
      {variants.length > 1 && (
        <div className="mt-3 flex items-center gap-2" style={{ color: "var(--color-muted)" }}>
          <button
            type="button"
            disabled={activeIdx === 0}
            onClick={() => setActiveIdx((i) => i - 1)}
            className="text-[12px] px-2 py-1 rounded border disabled:opacity-30 cursor-pointer"
            style={{ borderColor: "var(--color-line)", background: "transparent", color: "var(--color-muted)" }}
          >
            ←
          </button>
          <span className="text-[12px]">
            v{activeIdx + 1} <span style={{ color: "#5a5e66" }}>of {variants.length}</span>
          </span>
          <button
            type="button"
            disabled={activeIdx === variants.length - 1}
            onClick={() => setActiveIdx((i) => i + 1)}
            className="text-[12px] px-2 py-1 rounded border disabled:opacity-30 cursor-pointer"
            style={{ borderColor: "var(--color-line)", background: "transparent", color: "var(--color-muted)" }}
          >
            →
          </button>
          {activeIdx > 0 && (
            <span className="text-[11px] ml-1" style={{ color: "#5a5e66" }}>
              (refined from v{activeIdx})
            </span>
          )}
        </div>
      )}

      <div
        className="mt-4 text-[11px] tracking-wider uppercase flex gap-5 flex-wrap"
        style={{ color: "var(--color-muted)" }}
      >
        <span>Tokens: <b style={{ color: "var(--color-ink)" }}>{activeDraft.usage.input_tokens + activeDraft.usage.output_tokens}</b></span>
        <span>Cached: <b style={{ color: "var(--color-ink)" }}>{activeDraft.usage.input_tokens_cached}</b></span>
        <span>Cost: <b style={{ color: "var(--color-ink)" }}>฿{activeDraft.usage.estimated_cost_thb.toFixed(2)}</b></span>
        <span>Latency: <b style={{ color: "var(--color-ink)" }}>{(activeDraft.usage.latency_ms / 1000).toFixed(1)}s</b></span>
        <span>Model: <b style={{ color: "var(--color-ink)" }}>{activeDraft.model}</b></span>
      </div>

      {/* ── Refine section ──────────────────────────────────────────────────── */}
      <div
        className="mt-5 rounded-lg p-4 space-y-3"
        style={{ background: "#0d0f11", border: "1px solid var(--color-line)" }}
      >
        <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: "var(--color-muted)" }}>
          Refine this draft
        </div>

        {/* Preset chips */}
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={refineLoading}
              onClick={() => refine(p.instruction)}
              className="text-[12px] px-3 py-1.5 rounded-full border cursor-pointer transition-colors disabled:opacity-40"
              style={{
                background: "var(--color-panel)",
                color: "#c7c9cc",
                borderColor: "var(--color-line)",
              }}
              onMouseEnter={(e) => {
                if (!refineLoading) {
                  e.currentTarget.style.borderColor = "var(--color-gold)";
                  e.currentTarget.style.color = "var(--color-gold)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-line)";
                e.currentTarget.style.color = "#c7c9cc";
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom instruction */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customInstruction.trim().length >= 3) {
                void refine(customInstruction.trim());
              }
            }}
            placeholder="Custom: e.g. mention the spa award, add Thai greeting…"
            disabled={refineLoading}
            className="flex-1 text-[12px] rounded px-3 py-2 outline-none"
            style={{
              background: "#1a1d21",
              border: "1px solid var(--color-line)",
              color: "#e8e6e0",
            }}
          />
          <button
            type="button"
            disabled={refineLoading || customInstruction.trim().length < 3}
            onClick={() => refine(customInstruction.trim())}
            className="text-[12px] px-4 py-2 rounded cursor-pointer disabled:opacity-40"
            style={{ background: "var(--color-panel)", color: "var(--color-gold)", border: "1px solid var(--color-gold)" }}
          >
            {refineLoading ? "…" : "Apply"}
          </button>
        </div>

        {/* Loading indicator */}
        {refineLoading && (
          <div className="text-[12px]" style={{ color: "var(--color-muted)" }}>
            Refining… typically 4–6 seconds.
          </div>
        )}

        {/* Error */}
        {refineError && (
          <div
            className="text-[12px] p-2 rounded"
            style={{ background: "rgba(201,122,122,0.08)", borderLeft: "2px solid #c97a7a", color: "#e8d4d4" }}
          >
            {refineError}
          </div>
        )}
      </div>
    </div>
  );
}
