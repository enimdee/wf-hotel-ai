import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  // AI provider — swap without code changes
  AI_PROVIDER: z.enum(["anthropic", "openai", "google"]).default("anthropic"),

  // Anthropic (default)
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-4o"),

  // Google Gemini
  GOOGLE_API_KEY: z.string().min(1).optional(),
  GOOGLE_MODEL: z.string().default("gemini-2.0-flash"),

  DATABASE_URL: z.string().url().optional(),

  AUTH_SECRET: z.string().min(16).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_EMAIL_FROM: z.string().email().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  COST_CEILING_THB_PER_USER_MONTH: z.coerce.number().default(50),
  COST_SOFT_ALERT_THB_PER_USER_MONTH: z.coerce.number().default(30),

  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment:\n${lines.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}
