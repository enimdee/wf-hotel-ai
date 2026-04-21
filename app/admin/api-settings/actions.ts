"use server";

import { writeSettings, readSettings } from "@/lib/admin/settings-store";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  ai_provider:        z.enum(["anthropic", "openai", "google"]),
  anthropic_model:    z.string().min(1),
  openai_model:       z.string().min(1),
  google_model:       z.string().min(1),
  // Keys are optional — blank = keep existing
  anthropic_api_key:  z.string().optional(),
  openai_api_key:     z.string().optional(),
  google_api_key:     z.string().optional(),
});

export type SaveSettingsState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function saveSettings(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  const raw = {
    ai_provider:       formData.get("ai_provider"),
    anthropic_model:   formData.get("anthropic_model"),
    openai_model:      formData.get("openai_model"),
    google_model:      formData.get("google_model"),
    anthropic_api_key: formData.get("anthropic_api_key") || undefined,
    openai_api_key:    formData.get("openai_api_key")    || undefined,
    google_api_key:    formData.get("google_api_key")    || undefined,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const current = await readSettings();

    // Only update keys that were actually filled in; blank = keep old value
    const patch = {
      ai_provider:      parsed.data.ai_provider,
      anthropic_model:  parsed.data.anthropic_model,
      openai_model:     parsed.data.openai_model,
      google_model:     parsed.data.google_model,
      anthropic_api_key: parsed.data.anthropic_api_key ?? current.anthropic_api_key,
      openai_api_key:    parsed.data.openai_api_key    ?? current.openai_api_key,
      google_api_key:    parsed.data.google_api_key    ?? current.google_api_key,
    };

    await writeSettings(patch);
    revalidatePath("/admin/api-settings");
    return { status: "success", message: "Settings saved." };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function clearKey(
  provider: "anthropic" | "openai" | "google",
): Promise<void> {
  const field =
    provider === "anthropic" ? "anthropic_api_key" :
    provider === "openai"    ? "openai_api_key"    : "google_api_key";

  await writeSettings({ [field]: undefined });
  revalidatePath("/admin/api-settings");
}
