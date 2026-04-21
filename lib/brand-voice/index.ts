import { getActiveVersion } from "@/lib/admin/brand-voice-store";
import fs from "node:fs";
import path from "node:path";

/**
 * Returns the currently active brand voice prompt.
 * Phase 1: reads from DATA_DIR/brand-voice-versions.json (file-based store).
 * Phase 2: swap for DB read of `brand_voice_prompts WHERE is_active = 1`.
 */
export async function loadActivePrompt(): Promise<{ text: string; version: string }> {
  const active = await getActiveVersion();
  if (!active) throw new Error("No active brand voice prompt found.");
  return { text: active.content, version: active.id };
}

// ── Seed helpers (used by scripts/seed.ts for Phase 2 DB seeding) ─────────────

export const SEED_PROMPT_VERSION = "v1-seed";

/** Synchronously read the committed prompt.md for DB seeding. */
export function getSeedPrompt(): string {
  const filePath = path.join(process.cwd(), "lib", "brand-voice", "prompt.md");
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "You are a helpful assistant.";
  }
}
