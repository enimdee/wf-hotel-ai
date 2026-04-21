"use client";

import { useActionState, useEffect, useState } from "react";
import { saveSettings, clearKey, type SaveSettingsState } from "./actions";

const PROVIDERS = [
  {
    id: "anthropic" as const,
    name: "Anthropic",
    badge: "⚡ Recommended",
    keyField: "anthropic_api_key",
    modelField: "anthropic_model",
    keyPlaceholder: "sk-ant-api03-...",
    models: ["claude-sonnet-4-6", "claude-opus-4-5", "claude-haiku-3-5"],
    pricing: "$3 / $15 per 1M tokens",
    note: "Prompt caching saves ~90% on repeated requests.",
  },
  {
    id: "openai" as const,
    name: "OpenAI",
    badge: "",
    keyField: "openai_api_key",
    modelField: "openai_model",
    keyPlaceholder: "sk-...",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    pricing: "$2.50 / $10 per 1M tokens",
    note: "",
  },
  {
    id: "google" as const,
    name: "Google Gemini",
    badge: "💸 Cheapest",
    keyField: "google_api_key",
    modelField: "google_model",
    keyPlaceholder: "AIzaSy...",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    pricing: "$0.075 / $0.30 per 1M tokens",
    note: "Best for high-volume / cost-sensitive usage.",
  },
];

interface SettingsSnapshot {
  ai_provider: "anthropic" | "openai" | "google";
  anthropic_model: string;
  openai_model: string;
  google_model: string;
  updated_at: string;
  anthropic_key_preview: string | null;
  openai_key_preview: string | null;
  google_key_preview: string | null;
}

const initial: SaveSettingsState = { status: "idle" };

export default function ApiSettingsPage() {
  const [settings, setSettings] = useState<SettingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const fetchSettings = () =>
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => { setSettings(d as SettingsSnapshot); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { void fetchSettings(); }, []);

  const [state, formAction, pending] = useActionState(saveSettings, initial);

  useEffect(() => {
    if (state.status === "success") void fetchSettings();
  }, [state]);

  if (loading) return <p className="text-sm text-gray-500 animate-pulse">Loading…</p>;

  const keyPreview = (id: string) =>
    id === "anthropic" ? settings?.anthropic_key_preview :
    id === "openai"    ? settings?.openai_key_preview    :
                         settings?.google_key_preview;

  const modelValue = (field: string) =>
    field === "anthropic_model" ? settings?.anthropic_model ?? "claude-sonnet-4-6" :
    field === "openai_model"    ? settings?.openai_model    ?? "gpt-4o"            :
                                  settings?.google_model    ?? "gemini-2.0-flash";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">API Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          เลือก AI provider และใส่ API key — ไม่ต้อง SSH ไปแก้ server
        </p>
      </div>

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

      <form action={formAction} className="space-y-4">
        {PROVIDERS.map((p) => {
          const preview = keyPreview(p.id);
          const isActive = settings?.ai_provider === p.id;
          const visible = showKey[p.id];

          return (
            <div
              key={p.id}
              className={`rounded-xl border p-5 space-y-4 transition-colors ${
                isActive ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"
              }`}
            >
              {/* ── Header row ── */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ai_provider"
                    value={p.id}
                    defaultChecked={isActive}
                    className="accent-amber-500"
                  />
                  <span className="font-semibold text-gray-900">{p.name}</span>
                </label>
                {p.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {p.badge}
                  </span>
                )}
                {isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-semibold">
                    Active
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">{p.pricing}</span>
              </div>

              {p.note && <p className="text-xs text-gray-500 -mt-2">{p.note}</p>}

              {/* ── API Key input ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">API Key</label>
                {preview && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                      {preview}
                    </span>
                    <span className="text-xs text-green-600 font-medium">✓ Configured</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm("Remove this key?")) {
                          await clearKey(p.id);
                          void fetchSettings();
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-600 underline ml-1"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type={visible ? "text" : "password"}
                    name={p.keyField}
                    placeholder={preview ? "ใส่ key ใหม่เพื่อเปลี่ยน (เว้นว่างถ้าไม่เปลี่ยน)" : p.keyPlaceholder}
                    autoComplete="off"
                    className="flex-1 text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => ({ ...s, [p.id]: !s[p.id] }))}
                    className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    {visible ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* ── Model selector ── */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 w-12 shrink-0">Model</label>
                <select
                  name={p.modelField}
                  defaultValue={modelValue(p.modelField)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  {p.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save Settings"}
          </button>
          {settings?.updated_at && (
            <span className="text-xs text-gray-400">
              Last saved:{" "}
              {new Date(settings.updated_at).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
