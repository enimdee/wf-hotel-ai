"use client";

import { useActionState, useState } from "react";
import { savePrompt, activatePromptVersion, type BrandVoiceActionState } from "./actions";
import type { BrandVoiceVersion } from "@/lib/admin/brand-voice-store";

const initial: BrandVoiceActionState = { status: "idle" };

interface Props {
  activeContent: string;
  versions: BrandVoiceVersion[];
}

export function BrandVoiceEditor({ activeContent, versions }: Props) {
  const [state, formAction, pending] = useActionState(savePrompt, initial);
  const [charCount, setCharCount] = useState(activeContent.length);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* ── Status banner ── */}
      {state.status === "success" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          ✓ {state.message}
        </div>
      )}
      {state.status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          ✗ {state.message}
        </div>
      )}

      {/* ── Editor ── */}
      <form action={formAction} className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Active prompt</label>
          <span className="text-xs text-gray-400">{charCount} chars</span>
        </div>

        <textarea
          name="content"
          key={activeContent} // reset when page re-renders with new version
          defaultValue={activeContent}
          rows={18}
          onChange={(e) => setCharCount(e.target.value.length)}
          required
          minLength={20}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-mono leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
          placeholder="Write the brand voice system prompt here…"
        />

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            name="note"
            placeholder="Change note (optional)"
            maxLength={200}
            className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 shrink-0"
          >
            {pending ? "Saving…" : "Save as new version"}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Saving creates a new version and activates it immediately. Previous versions are kept.
        </p>
      </form>

      {/* ── Version history ── */}
      {versions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">Version history</h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`flex items-start gap-3 px-4 py-3 text-sm ${
                  v.is_active ? "bg-amber-50" : "bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs text-gray-400 font-mono">{v.id.slice(-8)}</code>
                    {v.is_active && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                        Active
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(v.created_at).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })}
                    </span>
                  </div>
                  {v.note && <p className="text-xs text-gray-500 truncate">{v.note}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreview(preview === v.id ? null : v.id)}
                    className="text-xs text-gray-500 hover:text-gray-800 underline"
                  >
                    {preview === v.id ? "Hide" : "Preview"}
                  </button>
                  {!v.is_active && (
                    <form action={activatePromptVersion}>
                      <input type="hidden" name="id" value={v.id} />
                      <button
                        type="submit"
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium underline"
                      >
                        Restore
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Inline preview ── */}
      {preview && (() => {
        const v = versions.find((x) => x.id === preview);
        if (!v) return null;
        return (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Preview — {v.id.slice(-8)}
              </span>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Close ✕
              </button>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700 leading-relaxed max-h-64 overflow-y-auto">
              {v.content}
            </pre>
          </div>
        );
      })()}
    </div>
  );
}
