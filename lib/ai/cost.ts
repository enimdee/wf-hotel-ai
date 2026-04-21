/**
 * Per-provider token pricing (USD per 1 M tokens) → converted to THB.
 * Update when pricing or FX moves materially.
 */
const THB_PER_USD = 36;

interface ProviderRates {
  input: number;
  output: number;
  cachedRead: number;
  cacheWrite: number;
}

const PRICING: Record<string, ProviderRates> = {
  // https://www.anthropic.com/pricing
  anthropic: { input: 3.0, output: 15.0, cachedRead: 0.30, cacheWrite: 3.75 },
  // https://openai.com/pricing  (gpt-4o)
  openai:    { input: 2.5, output: 10.0, cachedRead: 1.25, cacheWrite: 0 },
  // https://ai.google.dev/pricing  (gemini-2.0-flash)
  google:    { input: 0.075, output: 0.30, cachedRead: 0, cacheWrite: 0 },
};

export interface TokenUsage {
  input_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens: number;
}

export function estimateCostThb(u: TokenUsage, provider = "anthropic"): number {
  const rates = PRICING[provider] ?? PRICING.anthropic!;
  const usd =
    (u.input_tokens                     * rates.input)      / 1_000_000 +
    ((u.cache_creation_input_tokens ?? 0) * rates.cacheWrite) / 1_000_000 +
    ((u.cache_read_input_tokens ?? 0)     * rates.cachedRead) / 1_000_000 +
    (u.output_tokens                    * rates.output)     / 1_000_000;
  return Number((usd * THB_PER_USD).toFixed(4));
}
