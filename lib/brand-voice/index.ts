import fs from "node:fs";
import path from "node:path";

export const SEED_PROMPT_VERSION = "v1.0";

let cachedSeed: string | null = null;

export function getSeedPrompt(): string {
  if (cachedSeed) return cachedSeed;
  const p = path.join(process.cwd(), "lib", "brand-voice", "prompt.md");
  cachedSeed = fs.readFileSync(p, "utf-8");
  return cachedSeed;
}

/**
 * Phase 1 returns the seed prompt from disk. Phase 2 will swap this for a
 * DB read of `brand_voice_prompts WHERE is_active = 1`.
 */
export async function loadActivePrompt(): Promise<{ text: string; version: string }> {
  return { text: getSeedPrompt(), version: SEED_PROMPT_VERSION };
}
