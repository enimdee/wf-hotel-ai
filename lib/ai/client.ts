import Anthropic from "@anthropic-ai/sdk";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "@/lib/env";
import { getResolvedKey } from "@/lib/admin/settings-store";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface GenerateDraftArgs {
  systemPrompt: string;
  userContent: string;
  maxTokens?: number;
}

export interface GenerateDraftResult {
  text: string;
  usage: {
    input_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    output_tokens: number;
  };
  model: string;
  stopReason: string | null;
}

// ─── Provider implementations ─────────────────────────────────────────────────

/** Anthropic — keeps prompt-cache (ephemeral) for ~90 % input-cost saving. */
async function generateWithAnthropic(args: GenerateDraftArgs): Promise<GenerateDraftResult> {
  const e = env();
  const apiKey = await getResolvedKey("anthropic");
  if (!apiKey) throw new Error("Anthropic API key not configured. Add it in Admin → API Settings.");

  const client = new Anthropic({ apiKey, maxRetries: 1 });
  const response = await client.messages.create({
    model: e.ANTHROPIC_MODEL,
    max_tokens: args.maxTokens ?? 700,
    system: [{ type: "text", text: args.systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: args.userContent }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text block in Anthropic response");

  return {
    text: textBlock.text,
    usage: {
      input_tokens: response.usage.input_tokens,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
      output_tokens: response.usage.output_tokens,
    },
    model: response.model,
    stopReason: response.stop_reason ?? null,
  };
}

/** OpenAI — via Vercel AI SDK. */
async function generateWithOpenAI(args: GenerateDraftArgs): Promise<GenerateDraftResult> {
  const e = env();
  const apiKey = await getResolvedKey("openai");
  if (!apiKey) throw new Error("OpenAI API key not configured. Add it in Admin → API Settings.");

  const client = createOpenAI({ apiKey });
  const result = await generateText({
    model: client(e.OPENAI_MODEL),
    system: args.systemPrompt,
    prompt: args.userContent,
    maxOutputTokens: args.maxTokens ?? 700,
  });

  return {
    text: result.text,
    usage: {
      input_tokens: result.usage.inputTokens ?? 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: result.usage.outputTokens ?? 0,
    },
    model: result.response.modelId,
    stopReason: result.finishReason ?? null,
  };
}

/** Google Gemini — via Vercel AI SDK. */
async function generateWithGoogle(args: GenerateDraftArgs): Promise<GenerateDraftResult> {
  const e = env();
  const apiKey = await getResolvedKey("google");
  if (!apiKey) throw new Error("Google API key not configured. Add it in Admin → API Settings.");

  const client = createGoogleGenerativeAI({ apiKey });
  const result = await generateText({
    model: client(e.GOOGLE_MODEL),
    system: args.systemPrompt,
    prompt: args.userContent,
    maxOutputTokens: args.maxTokens ?? 700,
  });

  return {
    text: result.text,
    usage: {
      input_tokens: result.usage.inputTokens ?? 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: result.usage.outputTokens ?? 0,
    },
    model: result.response.modelId,
    stopReason: result.finishReason ?? null,
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

/** Route to the active provider set by AI_PROVIDER env var. */
export async function generateDraft(args: GenerateDraftArgs): Promise<GenerateDraftResult> {
  switch (env().AI_PROVIDER) {
    case "openai":  return generateWithOpenAI(args);
    case "google":  return generateWithGoogle(args);
    default:        return generateWithAnthropic(args);
  }
}

// ─── Response parser (provider-agnostic) ─────────────────────────────────────

/**
 * Parse the model reply. Expected format:
 *   Subject: <one-liner>
 *   <blank line>
 *   <body>
 *
 * If the first line is `CLARIFY: ...` the caller surfaces questions instead.
 */
export function parseDraft(raw: string): { subject: string; body: string } | { clarify: string } {
  const trimmed = raw.trim();
  if (trimmed.toUpperCase().startsWith("CLARIFY:")) {
    return { clarify: trimmed.slice("CLARIFY:".length).trim() };
  }
  const match = trimmed.match(/^\s*Subject:\s*(.+?)\s*\n([\s\S]*)$/i);
  if (!match) return { subject: "(no subject)", body: trimmed };
  return { subject: match[1]!.trim(), body: match[2]!.trim() };
}
