import { type NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";
import { generateRequestSchema, type GenerateResponse, type ErrorResponse } from "@/lib/schemas";
import { loadActivePrompt } from "@/lib/brand-voice";
import { buildUserContent } from "@/lib/ai/user-content";
import { generateDraft, parseDraft } from "@/lib/ai/client";
import { runQCChecks, anyCriticalQCFailed, formatQCCorrective } from "@/lib/ai/qc";
import { estimateCostThb } from "@/lib/ai/cost";
import { readSettings } from "@/lib/admin/settings-store";
import {
  appendUsage,
  getMonthlyTotal,
  secondsUntilNextMonth,
} from "@/lib/admin/usage-store";
import { appendDraft } from "@/lib/admin/drafts-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorJson(
  status: number,
  body: ErrorResponse,
): NextResponse<ErrorResponse> {
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  const start = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson(400, {
      error: "Request body is not valid JSON",
      error_code: "BAD_INPUT",
    });
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson(400, {
      error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      error_code: "BAD_INPUT",
    });
  }

  // ── Cost ceiling check (before spending any tokens) ───────────────────────
  const settings = await readSettings();
  const ceiling = settings.monthly_cost_ceiling_thb;
  const { cost_thb: monthUsed, drafts: monthDrafts } = await getMonthlyTotal();

  if (monthUsed >= ceiling) {
    return errorJson(429, {
      error: `Monthly cost ceiling reached (฿${monthUsed.toFixed(2)} used / ฿${ceiling.toFixed(2)} limit). Please contact your administrator to raise the limit or wait until next month.`,
      error_code: "RATE_LIMITED",
      retry_after_seconds: secondsUntilNextMonth(),
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { text: systemPrompt, version: promptVersion } = await loadActivePrompt();
  const userContent = buildUserContent(parsed.data);

  let attempt = 0;
  let result: Awaited<ReturnType<typeof generateDraft>> | null = null;
  let parsedDraft: ReturnType<typeof parseDraft> | null = null;
  let qc = { no_em_dash: true, no_slang: true, cta_present: true, loyalty_recognised: true, length_ok: true };
  let effectiveUserContent = userContent;
  const accumulatedUsage = {
    input_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    output_tokens: 0,
  };

  try {
    while (attempt < 2) {
      attempt += 1;
      result = await generateDraft({
        systemPrompt,
        userContent: effectiveUserContent,
      });

      accumulatedUsage.input_tokens += result.usage.input_tokens;
      accumulatedUsage.cache_creation_input_tokens += result.usage.cache_creation_input_tokens;
      accumulatedUsage.cache_read_input_tokens += result.usage.cache_read_input_tokens;
      accumulatedUsage.output_tokens += result.usage.output_tokens;

      parsedDraft = parseDraft(result.text);
      if ("clarify" in parsedDraft) {
        return NextResponse.json(
          {
            clarify: true,
            questions: parsedDraft.clarify,
            usage: {
              ...accumulatedUsage,
              estimated_cost_thb: estimateCostThb(accumulatedUsage, settings.ai_provider),
              latency_ms: Date.now() - start,
            },
            model: result.model,
          },
          { status: 200 },
        );
      }

      qc = runQCChecks({
        body: parsedDraft.body,
        recipientContext: parsed.data.input.recipient_context,
      });

      if (!anyCriticalQCFailed(qc) || attempt >= 2) break;

      effectiveUserContent = `${userContent}\n\n${formatQCCorrective(qc)}`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    const isTimeout = /timeout|timed out|ECONNABORTED/i.test(message);
    return errorJson(isTimeout ? 504 : 502, {
      error: message,
      error_code: isTimeout ? "AI_TIMEOUT" : "BACKEND_DOWN",
    });
  }

  if (!result || !parsedDraft || "clarify" in parsedDraft) {
    return errorJson(500, { error: "Unreachable state", error_code: "BACKEND_DOWN" });
  }

  const latencyMs = Date.now() - start;
  const draftId = `drf_${ulid()}`;
  const costThb = estimateCostThb(accumulatedUsage, settings.ai_provider);

  const response: GenerateResponse = {
    draft_id: draftId,
    subject: parsedDraft.subject,
    body: parsedDraft.body,
    qc,
    usage: {
      input_tokens: accumulatedUsage.input_tokens,
      input_tokens_cached: accumulatedUsage.cache_read_input_tokens,
      output_tokens: accumulatedUsage.output_tokens,
      estimated_cost_thb: costThb,
      latency_ms: latencyMs,
    },
    model: result.model,
  };

  // ── Log usage (fire-and-forget — never fail the response) ─────────────────
  void appendUsage({
    draft_id: draftId,
    provider: settings.ai_provider ?? "anthropic",
    model: result.model,
    input_tokens: accumulatedUsage.input_tokens,
    cached_input_tokens: accumulatedUsage.cache_read_input_tokens,
    output_tokens: accumulatedUsage.output_tokens,
    cost_thb: costThb,
    latency_ms: latencyMs,
    task_type: parsed.data.input.task_type,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
  }).catch(() => {/* silently ignore log failures */});

  // ── Save to draft history (fire-and-forget) ───────────────────────────────
  void appendDraft({
    draft_id: draftId,
    subject: parsedDraft.subject,
    task_type: parsed.data.input.task_type,
    recipient_context: parsed.data.input.recipient_context,
    input: {
      property:          parsed.data.input.property,
      role:              parsed.data.input.role,
      task_type:         parsed.data.input.task_type,
      recipient_context: parsed.data.input.recipient_context,
      objective:         parsed.data.input.objective,
      input_language:    parsed.data.input.input_language,
      additional_notes:  parsed.data.input.additional_notes,
    },
    result: response,
  }).catch(() => {});

  // Warn in response headers if approaching the ceiling
  const alertThreshold = ceiling * (settings.cost_alert_percent / 100);
  const newTotal = monthUsed + costThb;
  const headers: Record<string, string> = {};
  if (newTotal >= alertThreshold) {
    headers["X-Cost-Warning"] = `Usage at ฿${newTotal.toFixed(2)} of ฿${ceiling.toFixed(2)} ceiling (${Math.round((newTotal / ceiling) * 100)}%)`;
  }

  // Phase 2+ will persist to `drafts` and `audit_log` tables here.
  void promptVersion;
  void monthDrafts;

  return NextResponse.json(response, { headers });
}
