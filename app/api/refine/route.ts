import { type NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";
import { refineRequestSchema, type GenerateResponse, type ErrorResponse } from "@/lib/schemas";
import { loadActivePrompt } from "@/lib/brand-voice";
import { generateDraft, parseDraft } from "@/lib/ai/client";
import { runQCChecks } from "@/lib/ai/qc";
import { estimateCostThb } from "@/lib/ai/cost";
import { readSettings } from "@/lib/admin/settings-store";
import { appendUsage, getMonthlyTotal, secondsUntilNextMonth } from "@/lib/admin/usage-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorJson(status: number, body: ErrorResponse): NextResponse<ErrorResponse> {
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  const start = Date.now();

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorJson(400, { error: "Request body is not valid JSON", error_code: "BAD_INPUT" });
  }

  const parsed = refineRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorJson(400, {
      error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      error_code: "BAD_INPUT",
    });
  }

  // ── Cost ceiling check ────────────────────────────────────────────────────
  const settings = await readSettings();
  const ceiling = settings.monthly_cost_ceiling_thb;
  const { cost_thb: monthUsed } = await getMonthlyTotal();
  if (monthUsed >= ceiling) {
    return errorJson(429, {
      error: `Monthly cost ceiling reached (฿${monthUsed.toFixed(2)} / ฿${ceiling.toFixed(2)}). Wait until next month or ask admin to raise the limit.`,
      error_code: "RATE_LIMITED",
      retry_after_seconds: secondsUntilNextMonth(),
    });
  }

  const { source, instruction } = parsed.data;
  const { text: systemPrompt } = await loadActivePrompt();

  // ── Build user content for refinement ────────────────────────────────────
  // The brand voice system prompt is already cached — this call benefits
  // from the same cache hit as /api/generate.
  const userContent = [
    `Refine the following email draft by applying this transformation: "${instruction}"`,
    ``,
    `Rules:`,
    `- Keep ALL brand voice guidelines from the system prompt`,
    `- Preserve every factual detail: guest name, property, dates, offer specifics`,
    `- Return ONLY the refined draft in this exact format:`,
    `  Subject: <one-liner>`,
    `  <blank line>`,
    `  <body>`,
    ``,
    `Current draft:`,
    `Subject: ${source.subject}`,
    ``,
    source.body,
  ].join("\n");

  let result: Awaited<ReturnType<typeof generateDraft>>;
  try {
    result = await generateDraft({ systemPrompt, userContent, maxTokens: 800 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    const isTimeout = /timeout|timed out|ECONNABORTED/i.test(message);
    return errorJson(isTimeout ? 504 : 502, {
      error: message,
      error_code: isTimeout ? "AI_TIMEOUT" : "BACKEND_DOWN",
    });
  }

  const parsedDraft = parseDraft(result.text);
  if ("clarify" in parsedDraft) {
    // Shouldn't happen for refine — fall back gracefully
    return errorJson(400, { error: "Model asked for clarification instead of refining. Try a more specific instruction.", error_code: "BAD_INPUT" });
  }

  const qc = runQCChecks({ body: parsedDraft.body, recipientContext: "" });
  const latencyMs = Date.now() - start;
  const draftId = `ref_${ulid()}`;
  const costThb = estimateCostThb(
    {
      input_tokens: result.usage.input_tokens,
      cache_creation_input_tokens: result.usage.cache_creation_input_tokens,
      cache_read_input_tokens: result.usage.cache_read_input_tokens,
      output_tokens: result.usage.output_tokens,
    },
    settings.ai_provider,
  );

  const response: GenerateResponse = {
    draft_id: draftId,
    subject: parsedDraft.subject,
    body: parsedDraft.body,
    qc,
    usage: {
      input_tokens: result.usage.input_tokens,
      input_tokens_cached: result.usage.cache_read_input_tokens,
      output_tokens: result.usage.output_tokens,
      estimated_cost_thb: costThb,
      latency_ms: latencyMs,
    },
    model: result.model,
  };

  // Log usage (fire-and-forget)
  void appendUsage({
    draft_id: draftId,
    provider: settings.ai_provider ?? "anthropic",
    model: result.model,
    input_tokens: result.usage.input_tokens,
    cached_input_tokens: result.usage.cache_read_input_tokens,
    output_tokens: result.usage.output_tokens,
    cost_thb: costThb,
    latency_ms: latencyMs,
    task_type: "guest_email",
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
  }).catch(() => {});

  return NextResponse.json(response);
}
