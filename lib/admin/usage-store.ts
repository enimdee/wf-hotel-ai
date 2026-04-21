/**
 * File-based usage log — DATA_DIR/usage.json
 * Logs every successful draft generation with token counts and THB cost.
 * Phase 2+: migrate to MySQL usage_logs table for multi-tenant queries.
 *
 * Deliberately written without DB dependency so Phase 1 works on any VPS
 * with just a data volume — no MySQL needed yet.
 */
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "usage.json");

/** Hard cap: never store more than this many entries (last N kept). */
const MAX_ENTRIES = 100_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UsageEntry {
  /** Unique entry ID (timestamp + random suffix). */
  id: string;
  /** Matches the draft_id returned to the client (e.g. "drf_01J..."). */
  draft_id: string;
  /** AI provider used: "anthropic" | "openai" | "google". */
  provider: string;
  /** Exact model string from the API response. */
  model: string;
  /** Total input tokens (fresh + cached). */
  input_tokens: number;
  /** Cache-read input tokens (subset of input_tokens, already counted above). */
  cached_input_tokens: number;
  /** Output tokens. */
  output_tokens: number;
  /** Estimated cost in THB (4 decimal places). */
  cost_thb: number;
  /** End-to-end latency in milliseconds. */
  latency_ms: number;
  /** Task type from the compose form. */
  task_type?: string;
  /** Client IP for rough abuse detection (optional). */
  ip?: string;
  /** ISO-8601 UTC timestamp. */
  created_at: string;
}

export interface DayStat {
  cost_thb: number;
  drafts: number;
}

export interface ProviderStat {
  cost_thb: number;
  drafts: number;
}

export interface MonthlySummary {
  /** "YYYY-MM" */
  month: string;
  total_cost_thb: number;
  total_drafts: number;
  total_input_tokens: number;
  total_output_tokens: number;
  /** By-provider breakdown. */
  by_provider: Record<string, ProviderStat>;
  /** By-day breakdown — keys are "YYYY-MM-DD". */
  daily: Record<string, DayStat>;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readAll(): Promise<UsageEntry[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as UsageEntry[];
  } catch {
    return [];
  }
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Append one usage record. This is called after every successful /api/generate
 * response. Failures here must not propagate — callers should use `.catch(()=>{})`.
 */
export async function appendUsage(
  entry: Omit<UsageEntry, "id" | "created_at">,
): Promise<void> {
  await ensureDir();
  const all = await readAll();
  const newEntry: UsageEntry = {
    ...entry,
    id: makeId(),
    created_at: new Date().toISOString(),
  };
  // Compact JSON (no pretty-print) to keep the file small at scale.
  const updated = [...all, newEntry].slice(-MAX_ENTRIES);
  await fs.writeFile(FILE, JSON.stringify(updated), "utf8");
}

// ─── Read / aggregate ─────────────────────────────────────────────────────────

/** Returns "YYYY-MM" for the current month in UTC. */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Seconds remaining until the start of next calendar month (UTC). */
export function secondsUntilNextMonth(): number {
  const now = new Date();
  const firstOfNext = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return Math.max(0, Math.floor((firstOfNext.getTime() - now.getTime()) / 1000));
}

/** Fast check used inside /api/generate before spending tokens. */
export async function getMonthlyTotal(
  month?: string,
): Promise<{ cost_thb: number; drafts: number }> {
  const m = month ?? currentMonth();
  const all = await readAll();
  const entries = all.filter((e) => e.created_at.startsWith(m));
  const cost_thb = entries.reduce((s, e) => s + e.cost_thb, 0);
  return { cost_thb: Number(cost_thb.toFixed(4)), drafts: entries.length };
}

/** Full monthly breakdown for the admin dashboard. */
export async function getMonthlySummary(month?: string): Promise<MonthlySummary> {
  const m = month ?? currentMonth();
  const all = await readAll();
  const entries = all.filter((e) => e.created_at.startsWith(m));

  const summary: MonthlySummary = {
    month: m,
    total_cost_thb: 0,
    total_drafts: entries.length,
    total_input_tokens: 0,
    total_output_tokens: 0,
    by_provider: {},
    daily: {},
  };

  for (const e of entries) {
    summary.total_cost_thb += e.cost_thb;
    summary.total_input_tokens += e.input_tokens;
    summary.total_output_tokens += e.output_tokens;

    // By provider
    const prov = (summary.by_provider[e.provider] ??= { cost_thb: 0, drafts: 0 });
    prov.cost_thb += e.cost_thb;
    prov.drafts += 1;

    // By day
    const day = e.created_at.slice(0, 10);
    const d = (summary.daily[day] ??= { cost_thb: 0, drafts: 0 });
    d.cost_thb += e.cost_thb;
    d.drafts += 1;
  }

  summary.total_cost_thb = Number(summary.total_cost_thb.toFixed(4));
  return summary;
}

/** Most-recent N entries, newest first. For the admin "recent activity" table. */
export async function getRecentUsage(limit = 50): Promise<UsageEntry[]> {
  const all = await readAll();
  return all.slice(-limit).reverse();
}

/**
 * Summaries for multiple past months — useful for the 3-month trend chart.
 * Returns months in ascending order.
 */
export async function getMultiMonthSummaries(
  months: string[],
): Promise<MonthlySummary[]> {
  const all = await readAll();
  return months.map((m) => {
    const entries = all.filter((e) => e.created_at.startsWith(m));
    const out: MonthlySummary = {
      month: m,
      total_cost_thb: 0,
      total_drafts: entries.length,
      total_input_tokens: 0,
      total_output_tokens: 0,
      by_provider: {},
      daily: {},
    };
    for (const e of entries) {
      out.total_cost_thb += e.cost_thb;
      out.total_input_tokens += e.input_tokens;
      out.total_output_tokens += e.output_tokens;
    }
    out.total_cost_thb = Number(out.total_cost_thb.toFixed(4));
    return out;
  });
}
