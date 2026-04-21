"use server";

import { writeSettings } from "@/lib/admin/settings-store";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  app_name:                  z.string().min(1, "App name is required").max(60),
  app_tagline:               z.string().max(60).default("Communication Assistant"),
  brand_voice_author:        z.string().max(80).default("Brand Manager"),
  properties_text:           z.string().min(1, "Enter at least one property"),
  roles_text:                z.string().min(1, "Enter at least one role"),
  monthly_cost_ceiling_thb:  z.coerce.number().min(1, "Minimum ฿1").max(100_000),
  cost_alert_percent:        z.coerce.number().min(10).max(100).default(80),
});

export type AppSettingsState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function saveAppSettings(
  _prev: AppSettingsState,
  formData: FormData,
): Promise<AppSettingsState> {
  const raw = {
    app_name:                  formData.get("app_name"),
    app_tagline:               formData.get("app_tagline") || "Communication Assistant",
    brand_voice_author:        formData.get("brand_voice_author") || "Brand Manager",
    properties_text:           formData.get("properties_text"),
    roles_text:                formData.get("roles_text"),
    monthly_cost_ceiling_thb:  formData.get("monthly_cost_ceiling_thb") || "50",
    cost_alert_percent:        formData.get("cost_alert_percent") || "80",
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await writeSettings(parsed.data);
    revalidatePath("/admin/app-settings");
    revalidatePath("/api/app-config");
    return { status: "success", message: "App settings saved." };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Unknown error" };
  }
}
