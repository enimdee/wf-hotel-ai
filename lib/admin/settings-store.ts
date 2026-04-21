/**
 * File-based settings store — persists to DATA_DIR/settings.json.
 * Phase 2: swap for a DB row in the `settings` table.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "settings.json");

export interface AppSettings {
  // ── AI provider ──────────────────────────────────────────────────────────
  ai_provider: "anthropic" | "openai" | "google";
  anthropic_model: string;
  openai_model: string;
  google_model: string;
  anthropic_api_key?: string;
  openai_api_key?: string;
  google_api_key?: string;

  // ── App identity (white-label) ────────────────────────────────────────────
  app_name: string;          // e.g. "Grand Hotel AI"
  app_tagline: string;       // e.g. "Communication Assistant"
  brand_voice_author: string; // e.g. "Brand Manager" — shown in UI header

  // ── Configurable lists (newline-separated labels, value = slug of label) ─
  properties_text: string;   // one property name per line
  roles_text: string;        // one role name per line

  // ── Cost ceiling ──────────────────────────────────────────────────────────
  /** Hard monthly cost ceiling in THB. /api/generate returns 429 beyond this. */
  monthly_cost_ceiling_thb: number;
  /** Warning threshold: show alert banner when usage exceeds this % of ceiling. */
  cost_alert_percent: number;

  updated_at: string;
}

const DEFAULT_PROPERTIES = [
  "Main Property",
  "Branch 1",
].join("\n");

const DEFAULT_ROLES = [
  "General Manager",
  "Front Office Manager",
  "Sales & Marketing",
  "Reservations",
  "Guest Relations",
].join("\n");

const DEFAULTS: AppSettings = {
  ai_provider: (process.env.AI_PROVIDER as AppSettings["ai_provider"]) ?? "anthropic",
  anthropic_model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  openai_model: process.env.OPENAI_MODEL ?? "gpt-4o",
  google_model: process.env.GOOGLE_MODEL ?? "gemini-2.0-flash",

  app_name: process.env.APP_NAME ?? "HotelAI",
  app_tagline: process.env.APP_TAGLINE ?? "Communication Assistant",
  brand_voice_author: process.env.BRAND_VOICE_AUTHOR ?? "Brand Manager",

  properties_text: DEFAULT_PROPERTIES,
  roles_text: DEFAULT_ROLES,

  monthly_cost_ceiling_thb: Number(process.env.COST_CEILING_THB_PER_USER_MONTH ?? "50"),
  cost_alert_percent: 80,

  updated_at: new Date().toISOString(),
};

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export async function writeSettings(
  patch: Partial<Omit<AppSettings, "updated_at">>,
): Promise<AppSettings> {
  await ensureDir();
  const current = await readSettings();
  const updated: AppSettings = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  await fs.writeFile(FILE, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}

/**
 * Convert newline-separated label text into [{value, label}] pairs.
 * value = trimmed label lowercased with spaces → underscores.
 */
export function parseList(text: string): { value: string; label: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((label) => ({
      value: label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
      label,
    }));
}

/** Priority: settings.json → env var. Empty string treated as unset. */
export async function getResolvedKey(
  provider: "anthropic" | "openai" | "google",
): Promise<string> {
  const settings = await readSettings();
  const e = env();
  if (provider === "anthropic") return settings.anthropic_api_key || e.ANTHROPIC_API_KEY || "";
  if (provider === "openai")    return settings.openai_api_key    || e.OPENAI_API_KEY    || "";
  /* google */                  return settings.google_api_key    || e.GOOGLE_API_KEY    || "";
}

/** Returns last-4 masked key for display: "sk-ant-...ab12" */
export function maskKey(key: string | undefined): string | null {
  if (!key || key.length < 8) return null;
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}
