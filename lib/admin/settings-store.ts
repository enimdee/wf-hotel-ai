/**
 * File-based settings store — persists to DATA_DIR/settings.json.
 * Phase 2: swap for a DB row in the `settings` table.
 */
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "settings.json");

export interface AppSettings {
  ai_provider: "anthropic" | "openai" | "google";
  anthropic_model: string;
  openai_model: string;
  google_model: string;
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
