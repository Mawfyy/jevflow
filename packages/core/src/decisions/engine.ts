/**
 * JevFlow evaluation engine
 *
 * Handles running decisions through providers and collecting results.
 */

import type { Decision, DecisionRun, ProviderOutput, EvaluationRecord, DecisionProvider } from './types';

/**
 * Run a single decision
 */
export async function run<TInput, TOutput>(
  decision: Decision<TInput, TOutput>,
  input: TInput,
  provider: DecisionProvider
): Promise<EvaluationRecord<TOutput>> {
  const decisionRun: DecisionRun<TInput, TOutput> = { decision, input };
  const output = await provider.evaluateSingle(decisionRun as DecisionRun, input);

  return {
    decision: decision.name,
    provider: provider.name,
    output: output as ProviderOutput<TOutput>,
  };
}

/**
 * Run multiple decisions in batch
 */
export async function runBatch(
  decisions: readonly Decision[],
  input: unknown,
  provider: DecisionProvider
): Promise<readonly EvaluationRecord[]> {
  const runs: DecisionRun[] = decisions.map((decision) => ({
    decision,
    input,
  }));

  const outputs = await provider.evaluateBatch(runs, input);

  return decisions.map((decision, index) => ({
    decision: decision.name,
    provider: provider.name,
    output: outputs[index] as ProviderOutput,
  }));
}
