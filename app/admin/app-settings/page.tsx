"use client";

import { useActionState, useEffect, useState } from "react";
import { saveAppSettings, type AppSettingsState } from "./actions";

interface AppConfig {
  app_name: string;
  app_tagline: string;
  brand_voice_author: string;
  properties_text?: string;
  roles_text?: string;
  monthly_cost_ceiling_thb?: number;
  cost_alert_percent?: number;
}

const initial: AppSettingsState = { status: "idle" };

export default function AppSettingsPage() {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [state, formAction, pending] = useActionState(saveAppSettings, initial);

  const load = () =>
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setCfg(d as AppConfig));

  useEffect(() => { void load(); }, []);
  useEffect(() => { if (state.status === "success") void load(); }, [state]);

  if (!cfg) return <p className="text-sm text-gray-500 animate-pulse">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">App Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          White-label branding — change the app name, brand voice author, and the
          property / role dropdowns shown on the compose page.
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

      <form action={formAction} className="space-y-6">
        {/* ── Identity ── */}
        <fieldset className="rounded-xl border border-gray-200 p-5 space-y-4">
          <legend className="text-sm font-semibold text-gray-700 px-1">Brand Identity</legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">App Name</label>
              <input
                name="app_name"
                required
                maxLength={60}
                defaultValue={cfg.app_name}
                placeholder="e.g. Grand Hotel AI"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <p className="text-xs text-gray-400">Shown in the sidebar logo.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Tagline</label>
              <input
                name="app_tagline"
                maxLength={60}
                defaultValue={cfg.app_tagline}
                placeholder="e.g. Communication Assistant"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <p className="text-xs text-gray-400">Shown below the app name.</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Brand Voice Author</label>
            <input
              name="brand_voice_author"
              maxLength={80}
              defaultValue={cfg.brand_voice_author}
              placeholder="e.g. Brand Manager, or a person's name"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <p className="text-xs text-gray-400">
              Shown in the compose page header: &ldquo;Brand Voice · [author] · Auto-applied&rdquo;
            </p>
          </div>
        </fieldset>

        {/* ── Dropdowns ── */}
        <fieldset className="rounded-xl border border-gray-200 p-5 space-y-4">
          <legend className="text-sm font-semibold text-gray-700 px-1">Compose Page Dropdowns</legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Properties</label>
              <textarea
                name="properties_text"
                required
                rows={6}
                defaultValue={cfg.properties_text ?? "Main Property\nBranch 1"}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                placeholder={"Grand Hotel Bangkok\nGrand Hotel Phuket\nGrand Hotel Pattaya"}
              />
              <p className="text-xs text-gray-400">One property per line.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Roles</label>
              <textarea
                name="roles_text"
                required
                rows={6}
                defaultValue={cfg.roles_text ?? "General Manager\nFront Office Manager\nSales & Marketing\nReservations\nGuest Relations"}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                placeholder={"General Manager\nFront Office Manager\nSales & Marketing"}
              />
              <p className="text-xs text-gray-400">One role per line.</p>
            </div>
          </div>
        </fieldset>

        {/* ── Cost Ceiling ── */}
        <fieldset className="rounded-xl border border-gray-200 p-5 space-y-4">
          <legend className="text-sm font-semibold text-gray-700 px-1">Cost Ceiling</legend>

          <p className="text-xs text-gray-500">
            Drafts are blocked when the monthly spend reaches the ceiling. Use this to protect
            against unexpected API cost spikes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Monthly Ceiling (฿ THB)
              </label>
              <input
                name="monthly_cost_ceiling_thb"
                type="number"
                min={1}
                max={100000}
                step={1}
                required
                defaultValue={cfg.monthly_cost_ceiling_thb ?? 50}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <p className="text-xs text-gray-400">
                Hard limit per month. New drafts are blocked at 100%.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Alert Threshold (%)</label>
              <input
                name="cost_alert_percent"
                type="number"
                min={10}
                max={100}
                step={5}
                defaultValue={cfg.cost_alert_percent ?? 80}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <p className="text-xs text-gray-400">
                Show a warning banner in the admin dashboard above this %.
              </p>
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save App Settings"}
          </button>
          <a
            href="/"
            target="_blank"
            className="text-sm text-amber-600 hover:text-amber-800 underline"
          >
            Preview compose page ↗
          </a>
        </div>
      </form>
    </div>
  );
}
