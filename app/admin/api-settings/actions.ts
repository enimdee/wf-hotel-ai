"use server";

import { writeSettings } from "@/lib/admin/settings-store";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  ai_provider: z.enum(["anthropic", "openai", "google"]),
  anthropic_model: z.string().min(1),
  openai_model: z.string().min(1),
  google_model: z.string().min(1),
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
    ai_provider: formData.get("ai_provider"),
    anthropic_model: formData.get("anthropic_model"),
    openai_model: formData.get("openai_model"),
    google_model: formData.get("google_model"),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await writeSettings(parsed.data);
    revalidatePath("/admin/api-settings");
    return { status: "success", message: "Settings saved." };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Unknown error" };
  }
}
