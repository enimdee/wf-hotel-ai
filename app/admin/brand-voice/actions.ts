"use server";

import { saveNewVersion, activateVersion } from "@/lib/admin/brand-voice-store";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Save new version ─────────────────────────────────────────────────────────

const saveSchema = z.object({
  content: z.string().min(20, "Prompt must be at least 20 characters"),
  note: z.string().max(200).optional(),
});

export type BrandVoiceActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function savePrompt(
  _prev: BrandVoiceActionState,
  formData: FormData,
): Promise<BrandVoiceActionState> {
  const raw = {
    content: formData.get("content"),
    note: formData.get("note") || undefined,
  };

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const v = await saveNewVersion(parsed.data.content, parsed.data.note);
    revalidatePath("/admin/brand-voice");
    return { status: "success", message: `Version ${v.id} saved and activated.` };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Restore / activate existing version ─────────────────────────────────────

const activateSchema = z.object({ id: z.string().min(1) });

export async function activatePromptVersion(formData: FormData): Promise<void> {
  const parsed = activateSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  await activateVersion(parsed.data.id);
  revalidatePath("/admin/brand-voice");
}
