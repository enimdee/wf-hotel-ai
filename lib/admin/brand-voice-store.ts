/**
 * File-based brand voice version store.
 * Append-only: every save creates a new version; old versions are kept.
 * Phase 2: swap for `brand_voice_prompts` DB table.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { ulid } from "ulid";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "brand-voice-versions.json");

// Seed prompt path (committed to repo)
const SEED_PROMPT_PATH = path.join(process.cwd(), "lib", "brand-voice", "prompt.md");

export interface BrandVoiceVersion {
  id: string;
  content: string;
  is_active: boolean;
  created_at: string;
  note?: string;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readSeedPrompt(): Promise<string> {
  try {
    return await fs.readFile(SEED_PROMPT_PATH, "utf8");
  } catch {
    return "You are a helpful assistant.";
  }
}

export async function listVersions(): Promise<BrandVoiceVersion[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as BrandVoiceVersion[];
  } catch {
    // First run — seed from the committed prompt.md
    const seed = await readSeedPrompt();
    const initial: BrandVoiceVersion = {
      id: ulid(),
      content: seed,
      is_active: true,
      created_at: new Date().toISOString(),
      note: "Initial seed from prompt.md",
    };
    await ensureDir();
    await fs.writeFile(FILE, JSON.stringify([initial], null, 2), "utf8");
    return [initial];
  }
}

export async function getActiveVersion(): Promise<BrandVoiceVersion | null> {
  const versions = await listVersions();
  return versions.find((v) => v.is_active) ?? versions[0] ?? null;
}

export async function saveNewVersion(content: string, note?: string): Promise<BrandVoiceVersion> {
  await ensureDir();
  const versions = await listVersions();
  // Deactivate all existing
  const deactivated = versions.map((v) => ({ ...v, is_active: false }));
  const newVersion: BrandVoiceVersion = {
    id: ulid(),
    content,
    is_active: true,
    created_at: new Date().toISOString(),
    note: note ?? `Updated ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })}`,
  };
  const updated = [newVersion, ...deactivated];
  await fs.writeFile(FILE, JSON.stringify(updated, null, 2), "utf8");
  return newVersion;
}

export async function activateVersion(id: string): Promise<void> {
  await ensureDir();
  const versions = await listVersions();
  const updated = versions.map((v) => ({ ...v, is_active: v.id === id }));
  await fs.writeFile(FILE, JSON.stringify(updated, null, 2), "utf8");
}
