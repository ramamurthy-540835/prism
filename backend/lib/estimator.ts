export function estimateUsage(input: {
  userMessage: string;
  systemPrompt?: string;
  outputTokenRatio?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  calls?: number;
  users?: number;
}) {
  const text = `${input.systemPrompt ?? ""}\n${input.userMessage ?? ""}`;
  const inputTokens = Math.max(1, Math.ceil(text.length / 4));
  const outputTokens = Math.max(1, Math.ceil(inputTokens * (input.outputTokenRatio ?? 0.6)));

  const inRate = input.inputCostPer1k ?? 0.00015;
  const outRate = input.outputCostPer1k ?? 0.0006;

  const costPerCall = (inputTokens / 1000) * inRate + (outputTokens / 1000) * outRate;
  const calls = input.calls ?? 100;
  const users = input.users ?? 500;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_per_call_usd: Number(costPerCall.toFixed(8)),
    cost_100_calls_usd: Number((costPerCall * calls).toFixed(8)),
    cost_500_users_usd: Number((costPerCall * users).toFixed(8)),
  };
}
