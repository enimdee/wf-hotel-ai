"use client";

import { useState, useEffect } from "react";
import { DEFAULT_TEMPLATES, TASK_LABELS, type DraftTemplate } from "@/lib/templates";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (template: DraftTemplate) => void;
}

const ALL_TASKS = ["all", "guest_email", "upsell_offer", "apology_recovery", "corporate_partner"] as const;

export function TemplatesModal({ open, onClose, onSelect }: Props) {
  const [filter, setFilter] = useState<string>("all");

  // Reset filter when modal opens
  useEffect(() => {
    if (open) setFilter("all");
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const visible = filter === "all"
    ? DEFAULT_TEMPLATES
    : DEFAULT_TEMPLATES.filter((t) => t.task_type === filter);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl overflow-hidden"
        style={{ background: "#111316", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--color-line)" }}
        >
          <div>
            <h2 className="text-base font-medium" style={{ color: "#e8e6e0", fontFamily: "Georgia, serif" }}>
              Quick-Start Templates
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--color-muted)" }}>
              Select a template to pre-fill the form — edit the <span style={{ color: "#c5a572" }}>[brackets]</span> then generate.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[18px] leading-none cursor-pointer"
            style={{ color: "var(--color-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-1.5 px-6 py-3 border-b shrink-0 flex-wrap"
          style={{ borderColor: "var(--color-line)" }}
        >
          {ALL_TASKS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className="text-[11px] px-3 py-1.5 rounded-full border cursor-pointer transition-colors"
              style={{
                background:   filter === t ? "rgba(197,165,114,0.15)" : "transparent",
                color:        filter === t ? "var(--color-gold)" : "var(--color-muted)",
                borderColor:  filter === t ? "var(--color-gold)" : "var(--color-line)",
              }}
            >
              {t === "all" ? "All" : TASK_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => { onSelect(tmpl); onClose(); }}
              className="text-left rounded-lg p-4 transition-colors cursor-pointer group"
              style={{
                background: "var(--color-panel)",
                border: "1px solid var(--color-line)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(197,165,114,0.4)";
                e.currentTarget.style.background = "rgba(197,165,114,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-line)";
                e.currentTarget.style.background = "var(--color-panel)";
              }}
            >
              {/* Title + badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className="text-[13px] font-medium leading-tight"
                  style={{ color: "#e8e6e0" }}
                >
                  {tmpl.label}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "rgba(197,165,114,0.12)", color: "#8a7a60" }}
                >
                  {TASK_LABELS[tmpl.task_type] ?? tmpl.task_type}
                </span>
              </div>

              {/* Objective preview */}
              <p
                className="text-[12px] leading-relaxed line-clamp-2"
                style={{ color: "#7a7e86" }}
              >
                {tmpl.objective}
              </p>

              {/* CTA */}
              <div
                className="mt-3 text-[11px] tracking-wider"
                style={{ color: "var(--color-gold)", opacity: 0.7 }}
              >
                Use this template →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
