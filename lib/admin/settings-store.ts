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
  ai_provider: "anthropic" | "openai" | "google";
  anthropic_model: string;
  openai_model: string;
  google_model: string;
  // API keys stored in settings file (optional — env vars used as fallback)
  anthropic_api_key?: string;
  openai_api_key?: string;
  google_api_key?: string;
  updated_at: string;
}

const DEFAULTS: AppSettings = {
  ai_provider: (process.env.AI_PROVIDER as AppSettings["ai_provider"]) ?? "anthropic",
  anthropic_model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  openai_model: process.env.OPENAI_MODEL ?? "gpt-4o",
  google_model: process.env.GOOGLE_MODEL ?? "gemini-2.0-flash",
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

export async function writeSettings(patch: Partial<Omit<AppSettings, "updated_at">>): Promise<AppSettings> {
  await ensureDir();
  const current = await readSettings();
  const updated: AppSettings = { ...current, ...patch, updated_at: new Date().toISOString() };
  await fs.writeFile(FILE, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}

/**
 * Get the resolved API key for a provider.
 * Priority: settings.json → env var
 */
export async function getResolvedKey(provider: "anthropic" | "openai" | "google"): Promise<string> {
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
