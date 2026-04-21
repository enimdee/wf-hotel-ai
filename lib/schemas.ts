import { z } from "zod";

// White-label: property and role are free strings configured via Admin → App Settings
export const propertySchema = z.string().min(1).max(100);
export type Property = z.infer<typeof propertySchema>;

export const roleSchema = z.string().min(1).max(100);
export type Role = z.infer<typeof roleSchema>;

export const taskTypeSchema = z.enum([
  "guest_email",
  "corporate_partner",
  "internal_memo",
  "apology_recovery",
  "upsell_offer",
]);
export type TaskType = z.infer<typeof taskTypeSchema>;

export const inputLanguageSchema = z.enum(["th", "en"]);
export type InputLanguage = z.infer<typeof inputLanguageSchema>;

export const outputLanguageSchema = z.enum(["en", "zh", "ja", "ko", "th"]);
export type OutputLanguage = z.infer<typeof outputLanguageSchema>;

export const generateRequestSchema = z.object({
  input: z.object({
    property: propertySchema,
    role: roleSchema,
    task_type: taskTypeSchema,
    recipient_context: z.string().max(500).optional().default(""),
    objective: z.string().min(10, "objective must be at least 10 characters").max(2000),
    input_language: inputLanguageSchema.default("en"),
    output_language: outputLanguageSchema.default("en"),
    additional_notes: z.string().max(500).optional().default(""),
    template_id: z.number().int().nullable().optional(),
  }),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const qcReportSchema = z.object({
  no_em_dash: z.boolean(),
  no_slang: z.boolean(),
  cta_present: z.boolean(),
  loyalty_recognised: z.boolean(),
  length_ok: z.boolean(),
});
export type QCReport = z.infer<typeof qcReportSchema>;

export const usageSchema = z.object({
  input_tokens: z.number().int().nonnegative(),
  input_tokens_cached: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  estimated_cost_thb: z.number().nonnegative(),
  latency_ms: z.number().int().nonnegative(),
});
export type Usage = z.infer<typeof usageSchema>;

export const generateResponseSchema = z.object({
  draft_id: z.string(),
  subject: z.string(),
  body: z.string(),
  qc: qcReportSchema,
  usage: usageSchema,
  model: z.string(),
});
export type GenerateResponse = z.infer<typeof generateResponseSchema>;

export const refineRequestSchema = z.object({
  source: z.object({
    subject: z.string().min(1).max(300),
    body:    z.string().min(1).max(5000),
  }),
  instruction: z.string().min(3).max(500),
});
export type RefineRequest = z.infer<typeof refineRequestSchema>;

export const errorCodeSchema = z.enum([
  "AUTH_EXPIRED",
  "RATE_LIMITED",
  "AI_TIMEOUT",
  "BAD_INPUT",
  "BACKEND_DOWN",
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const errorResponseSchema = z.object({
  error: z.string(),
  error_code: errorCodeSchema,
  retry_after_seconds: z.number().int().nonnegative().optional(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
