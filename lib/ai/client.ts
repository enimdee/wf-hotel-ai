import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (client) return client;
  client = new Anthropic({
    apiKey: env().ANTHROPIC_API_KEY,
    maxRetries: 1,
  });
  return client;
}

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

/**
 * Calls Claude with the brand-voice system prompt cached.
 * The system prompt is stable across calls — cache_control ephemeral
 * gives ~90% input-cost reduction within a 5-minute window.
 */
export async function generateDraft(args: GenerateDraftArgs): Promise<GenerateDraftResult> {
  const anthropic = getAnthropic();
  const model = env().ANTHROPIC_MODEL;

  const response = await anthropic.messages.create({
    model,
    max_tokens: args.maxTokens ?? 700,
    system: [
      {
        type: "text",
        text: args.systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: args.userContent,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic response contained no text block");
  }

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

/**
 * Parse the model's reply. Expected format:
 *   Subject: ...
 *   <blank line>
 *   <body>
 *
 * If the model returns `CLARIFY: ...` as the first line, the caller should
 * surface the questions to the user instead of treating it as a final draft.
 */
export function parseDraft(raw: string): { subject: string; body: string } | { clarify: string } {
  const trimmed = raw.trim();
  if (trimmed.toUpperCase().startsWith("CLARIFY:")) {
    return { clarify: trimmed.slice("CLARIFY:".length).trim() };
  }

  const match = trimmed.match(/^\s*Subject:\s*(.+?)\s*\n([\s\S]*)$/i);
  if (!match) {
    return { subject: "(no subject)", body: trimmed };
  }
  return { subject: match[1]!.trim(), body: match[2]!.trim() };
}
