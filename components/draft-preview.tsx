"use client";

import { useState } from "react";
import type { GenerateResponse } from "@/lib/schemas";

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
    const text = `Subject: ${result.subject}\n\n${result.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInOutlook = async () => {
    const subject = encodeURIComponent(result.subject);
    const body    = encodeURIComponent(result.body);
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
      await navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
      setOutlookStatus("copied");
      setTimeout(() => setOutlookStatus("idle"), 4000);
    }
  };

  const qcChecks: { label: string; ok: boolean }[] = [
    { label: "No em-dashes",       ok: result.qc.no_em_dash },
    { label: "No slang",           ok: result.qc.no_slang },
    { label: "CTA included",       ok: result.qc.cta_present },
    { label: "Loyalty recognised", ok: result.qc.loyalty_recognised },
    { label: "Length sane",        ok: result.qc.length_ok },
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
            <b>Subject:</b> {result.subject}
          </p>
          <div className="whitespace-pre-wrap">{result.body}</div>
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

      <div
        className="mt-4 text-[11px] tracking-wider uppercase flex gap-5 flex-wrap"
        style={{ color: "var(--color-muted)" }}
      >
        <span>Tokens: <b style={{ color: "var(--color-ink)" }}>{result.usage.input_tokens + result.usage.output_tokens}</b></span>
        <span>Cached: <b style={{ color: "var(--color-ink)" }}>{result.usage.input_tokens_cached}</b></span>
        <span>Cost: <b style={{ color: "var(--color-ink)" }}>฿{result.usage.estimated_cost_thb.toFixed(2)}</b></span>
        <span>Latency: <b style={{ color: "var(--color-ink)" }}>{(result.usage.latency_ms / 1000).toFixed(1)}s</b></span>
        <span>Model: <b style={{ color: "var(--color-ink)" }}>{result.model}</b></span>
      </div>
    </div>
  );
}
