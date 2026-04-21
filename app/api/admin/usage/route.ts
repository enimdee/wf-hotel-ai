import { NextResponse } from "next/server";
import {
  getMonthlySummary,
  getRecentUsage,
  getMultiMonthSummaries,
  currentMonth,
} from "@/lib/admin/usage-store";
import { readSettings } from "@/lib/admin/settings-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/usage — returns full usage dashboard data. */
export async function GET() {
  // Build last 3 months list (including current)
  const now = new Date();
  const months: string[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }

  const [summary, recent, history, settings] = await Promise.all([
    getMonthlySummary(currentMonth()),
    getRecentUsage(30),
    getMultiMonthSummaries(months),
    readSettings(),
  ]);

  return NextResponse.json({
    summary,
    recent,
    history,
    ceiling: settings.monthly_cost_ceiling_thb,
    alert_percent: settings.cost_alert_percent,
  });
}
