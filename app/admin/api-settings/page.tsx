"use client";

import { useActionState } from "react";
import { saveSettings, type SaveSettingsState } from "./actions";
import { useEffect, useState } from "react";

// ─── Static provider catalogue ────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: "anthropic" as const,
    name: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    modelField: "anthropic_model",
    models: ["claude-sonnet-4-6", "claude-opus-4-5", "claude-haiku-3-5"],
    pricing: "$3 / $15 per 1M tokens (in/out)",
    note: "Prompt caching enabled — ~90 % cost saving on repeated system prompts.",
  },
  {
    id: "openai" as const,
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
    modelField: "openai_model",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    pricing: "$2.50 / $10 per 1M tokens",
    note: "",
  },
  {
    id: "google" as const,
    name: "Google Gemini",
    envKey: "GOOGLE_API_KEY",
    modelField: "google_model",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    pricing: "$0.075 / $0.30 per 1M tokens",
    note: "Lowest cost option.",
  },
];

// ─── Fetched from server on mount ─────────────────────────────────────────────

interface SettingsSnapshot {
  ai_provider: "anthropic" | "openai" | "google";
  anthropic_model: string;
  openai_model: string;
  google_model: string;
  updated_at: string;
  // key presence flags (resolved server-side, never expose key value)
  hasAnthropic: boolean;
  hasOpenAI: boolean;
  hasGoogle: boolean;
}

const initial: SaveSettingsState = { status: "idle" };

export default function ApiSettingsPage() {
  const [settings, setSettings] = useState<SettingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current settings from GET route
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => { setSettings(d as SettingsSnapshot); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const [state, formAction, pending] = useActionState(saveSettings, initial);

  // After successful save, re-fetch to reflect new active provider
  useEffect(() => {
    if (state.status === "success") {
      fetch("/api/admin/settings")
        .then((r) => r.json())
        .then((d) => setSettings(d as SettingsSnapshot));
    }
  }, [state]);

  if (loading) {
    return <p className="text-sm text-gray-500 animate-pulse">Loading…</p>;
  }

  const keyPresence: Record<string, boolean> = {
    anthropic: settings?.hasAnthropic ?? false,
    openai: settings?.hasOpenAI ?? false,
    google: settings?.hasGoogle ?? false,
  };

  const modelValues: Record<string, string> = {
    anthropic_model: settings?.anthropic_model ?? "claude-sonnet-4-6",
    openai_model: settings?.openai_model ?? "gpt-4o",
    google_model: settings?.google_model ?? "gemini-2.0-flash",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">API Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose the active AI provider. API keys must be set as environment variables on the
          server — they are never stored in the database.
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
          const hasKey = keyPresence[p.id];
          const isActive = settings?.ai_provider === p.id;

          return (
            <label
              key={p.id}
              className={`flex gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                isActive
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="ai_provider"
                value={p.id}
                defaultChecked={isActive}
                className="mt-1 accent-amber-500"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="text-xs text-gray-400">{p.pricing}</span>
                  {hasKey ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Key configured
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {p.envKey} not set
                    </span>
                  )}
                  {isActive && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                      Active
                    </span>
                  )}
                </div>

                {p.note && <p className="text-xs text-gray-500">{p.note}</p>}

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-16 shrink-0">Model</label>
                  <select
                    name={p.modelField}
                    defaultValue={modelValues[p.modelField]}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    {p.models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </label>
          );
        })}

        <div className="pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save Settings"}
          </button>
          {settings?.updated_at && (
            <span className="ml-3 text-xs text-gray-400">
              Last saved: {new Date(settings.updated_at).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })}
            </span>
          )}
        </div>
      </form>

      {/* Key setup instructions */}
      <details className="text-sm text-gray-500 border border-gray-200 rounded-lg">
        <summary className="cursor-pointer px-4 py-3 font-medium text-gray-700 select-none">
          How to set API keys
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-2">
          <p>Add the relevant keys to your <code className="bg-gray-100 rounded px-1">.env</code> file (or Docker Compose environment) and restart the server:</p>
          <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto">
{`# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENAI_API_KEY=sk-...

# Google Gemini
GOOGLE_API_KEY=AIza...`}
          </pre>
          <p className="text-xs">Keys are read from the environment at startup — they are never stored in files or the database.</p>
        </div>
      </details>
    </div>
  );
}
