/**
 * Anthropic Claude Sonnet 4.6 pricing, converted to THB for audit_log.
 * Update these three constants when pricing or FX moves materially.
 */
const USD_PER_M_INPUT_TOKENS = 3.0;
const USD_PER_M_INPUT_TOKENS_CACHED_READ = 0.3;
const USD_PER_M_INPUT_TOKENS_CACHE_WRITE = 3.75;
const USD_PER_M_OUTPUT_TOKENS = 15.0;
const THB_PER_USD = 36;

export interface TokenUsage {
  input_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens: number;
}

export function estimateCostThb(u: TokenUsage): number {
  const freshInput = u.input_tokens;
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const output = u.output_tokens;

  const usd =
    (freshInput * USD_PER_M_INPUT_TOKENS) / 1_000_000 +
    (cacheWrite * USD_PER_M_INPUT_TOKENS_CACHE_WRITE) / 1_000_000 +
    (cacheRead * USD_PER_M_INPUT_TOKENS_CACHED_READ) / 1_000_000 +
    (output * USD_PER_M_OUTPUT_TOKENS) / 1_000_000;

  return Number((usd * THB_PER_USD).toFixed(4));
}
