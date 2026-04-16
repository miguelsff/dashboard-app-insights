import type { ModelPricing } from '@/types/telemetry';

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (inputTokens / 1_000_000) * pricing.inputPer1M
       + (outputTokens / 1_000_000) * pricing.outputPer1M;
}
