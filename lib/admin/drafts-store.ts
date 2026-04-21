/**
 * File-based draft history — DATA_DIR/drafts.json
 * Stores the last MAX_ENTRIES drafts including full result + input fields
 * so users can reload and refine previous drafts.
 * Phase 2+: migrate to MySQL `drafts` table.
 */
import fs from "node:fs/promises";
import path from "node:path";
import type { GenerateResponse } from "@/lib/schemas";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "drafts.json");
const MAX_ENTRIES = 200;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DraftInput {
  property: string;
  role: string;
  task_type: string;
  recipient_context: string;
  objective: string;
  input_language: string;
  additional_notes: string;
}

export interface DraftEntry {
  /** Matches the draft_id in GenerateResponse. */
  draft_id: string;
  /** Email subject — for sidebar display. */
  subject: string;
  /** Task type slug — for sidebar badge. */
  task_type: string;
  /** Recipient context — for sidebar subtitle. */
  recipient_context: string;
  /** ISO-8601 UTC. */
  created_at: string;
  /** Full form input so staff can reload and regenerate. */
  input: DraftInput;
  /** Full GenerateResponse for immediate display without re-calling AI. */
  result: GenerateResponse;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readAll(): Promise<DraftEntry[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as DraftEntry[];
  } catch {
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Save a draft after successful generation. Fire-and-forget safe. */
export async function appendDraft(
  entry: Omit<DraftEntry, "created_at">,
): Promise<void> {
  await ensureDir();
  const all = await readAll();
  const newEntry: DraftEntry = { ...entry, created_at: new Date().toISOString() };
  const updated = [...all, newEntry].slice(-MAX_ENTRIES);
  await fs.writeFile(FILE, JSON.stringify(updated), "utf8");
}

/** Most-recent N drafts, newest first. Used by the sidebar. */
export async function getRecentDrafts(limit = 30): Promise<DraftEntry[]> {
  const all = await readAll();
  return all.slice(-limit).reverse();
}
