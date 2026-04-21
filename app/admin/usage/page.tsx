"use client";

import { useEffect, useState } from "react";
import type { MonthlySummary, UsageEntry } from "@/lib/admin/usage-store";

interface UsageData {
  summary: MonthlySummary;
  recent: UsageEntry[];
  history: MonthlySummary[];
  ceiling: number;
  alert_percent: number;
}

function formatThb(n: number): string {
  return `฿${n.toFixed(2)}`;
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ProgressBar({ value, max, alertPct }: { value: number; max: number; alertPct: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const isAlert = pct >= alertPct;
  const isCritical = pct >= 100;

  const color = isCritical
    ? "bg-red-500"
    : isAlert
    ? "bg-amber-500"
    : "bg-green-500";

  return (
    <div className="w-full">
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-gray-500">
        <span>{formatThb(value)} used</span>
        <span>{Math.round(pct)}% of {formatThb(max)}</span>
      </div>
    </div>
  );
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/usage")
      .then((r) => r.json())
      .then((d) => { setData(d as UsageData); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-500 animate-pulse">Loading usage data…</p>;
  }

  if (!data) {
    return (
      <p className="text-sm text-red-600">
        Failed to load usage data. Check that the data directory is writable.
      </p>
    );
  }

  const { summary, recent, history, ceiling, alert_percent } = data;
  const usedPct = Math.min(100, (summary.total_cost_thb / ceiling) * 100);
  const isAlert = usedPct >= alert_percent;
  const isCritical = usedPct >= 100;

  // Sort daily keys ascending
  const dailyRows = Object.entries(summary.daily).sort(([a], [b]) => a.localeCompare(b)).reverse();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Usage &amp; Cost</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time spend tracking for {summary.month}. All costs are estimates in Thai Baht (฿).
        </p>
      </div>

      {/* Alert banners */}
      {isCritical && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
          <span className="text-base">🚫</span>
          <span>
            <strong>Ceiling reached.</strong> New drafts are blocked until the ceiling is raised in{" "}
            <a href="/admin/app-settings" className="underline font-medium">App Settings</a>.
          </span>
        </div>
      )}
      {!isCritical && isAlert && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span>
            <strong>Approaching ceiling.</strong> Usage is at {Math.round(usedPct)}% of the{" "}
            {formatThb(ceiling)} monthly limit.
          </span>
        </div>
      )}

      {/* Month summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Monthly Spend</p>
          <p className="text-2xl font-bold text-gray-900">{formatThb(summary.total_cost_thb)}</p>
          <p className="text-xs text-gray-400">of {formatThb(ceiling)} ceiling</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Drafts</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_drafts}</p>
          <p className="text-xs text-gray-400">this month</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Avg Cost</p>
          <p className="text-2xl font-bold text-gray-900">
            {summary.total_drafts > 0
              ? formatThb(summary.total_cost_thb / summary.total_drafts)
              : "฿0.00"}
          </p>
          <p className="text-xs text-gray-400">per draft</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tokens</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatK(summary.total_input_tokens + summary.total_output_tokens)}
          </p>
          <p className="text-xs text-gray-400">total this month</p>
        </div>
      </div>

      {/* Ceiling progress bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Monthly Ceiling</h2>
          <a
            href="/admin/app-settings"
            className="text-xs text-amber-600 hover:text-amber-800 underline"
          >
            Adjust limit ↗
          </a>
        </div>
        <ProgressBar value={summary.total_cost_thb} max={ceiling} alertPct={alert_percent} />
      </div>

      {/* 3-month trend */}
      {history.length > 1 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">3-Month Trend</h2>
          <div className="grid grid-cols-3 gap-4">
            {history.map((m) => (
              <div key={m.month} className="text-center space-y-1">
                <p className="text-xs text-gray-500">{m.month}</p>
                <p className="text-lg font-bold text-gray-800">{formatThb(m.total_cost_thb)}</p>
                <p className="text-xs text-gray-400">{m.total_drafts} drafts</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider breakdown */}
      {Object.keys(summary.by_provider).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">By Provider</h2>
          <div className="divide-y divide-gray-100">
            {Object.entries(summary.by_provider).map(([prov, stat]) => (
              <div key={prov} className="flex justify-between items-center py-2 text-sm">
                <span className="font-medium text-gray-700 capitalize">{prov}</span>
                <span className="text-gray-500">{stat.drafts} drafts</span>
                <span className="font-semibold text-gray-900">{formatThb(stat.cost_thb)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily breakdown */}
      {dailyRows.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Daily Breakdown (this month)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium text-right">Drafts</th>
                  <th className="pb-2 font-medium text-right">Cost (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dailyRows.map(([day, stat]) => (
                  <tr key={day}>
                    <td className="py-2 pr-4 text-gray-700 font-mono text-xs">{day}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{stat.drafts}</td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {formatThb(stat.cost_thb)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">No drafts generated yet this session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 uppercase tracking-wider">
                  <th className="pb-2 pr-3 font-medium">When</th>
                  <th className="pb-2 pr-3 font-medium">Task</th>
                  <th className="pb-2 pr-3 font-medium">Model</th>
                  <th className="pb-2 pr-3 font-medium text-right">Tokens</th>
                  <th className="pb-2 pr-3 font-medium text-right">Cost</th>
                  <th className="pb-2 font-medium text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((e) => (
                  <tr key={e.id}>
                    <td className="py-1.5 pr-3 text-gray-500">{relativeTime(e.created_at)}</td>
                    <td className="py-1.5 pr-3 text-gray-700">{e.task_type ?? "—"}</td>
                    <td className="py-1.5 pr-3 text-gray-500 font-mono truncate max-w-[120px]">
                      {e.model}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-gray-600">
                      {formatK(e.input_tokens + e.output_tokens)}
                    </td>
                    <td className="py-1.5 pr-3 text-right font-medium text-gray-900">
                      {formatThb(e.cost_thb)}
                    </td>
                    <td className="py-1.5 text-right text-gray-500">{e.latency_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Costs are estimates based on published token pricing. Actual billing may differ slightly.
        Data is stored in <code className="font-mono bg-gray-100 px-1 rounded">DATA_DIR/usage.json</code>.
      </p>
    </div>
  );
}
