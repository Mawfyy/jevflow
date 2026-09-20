/**
 * Builder for `score` decisions — a position on ordered descriptive levels.
 */

import { NumericSelector } from './threshold';
import type { ScoreDecision, ScoreDecisionOptions } from './decision';

/**
 * Declares a reusable score decision.
 *
 * `levels` are plain descriptions ordered from low to high (matching
 * TypeSafe's native `criteria`). The result `value` is the
 * probability-weighted position in `[0, levels.length - 1]`.
 *
 * @example
 * const paymentRisk = score({
 *   name: 'payment-risk',
 *   question: 'How risky is this payment?',
 *   levels: ['Very low', 'Low', 'Medium', 'High', 'Very high'],
 * });
 */
export function score<TInput = unknown>(options: ScoreDecisionOptions<TInput>): ScoreDecision<TInput> {
  if (options.levels.length < 2) {
    throw new Error(`score decision "${options.name}" requires at least two levels`);
  }

  return {
    kind: 'score',
    name: options.name,
    version: options.version ?? '1',
    question: options.question,
    levels: options.levels,
    ...(options.description !== undefined ? { description: options.description } : {}),
    ...(options.inputSchema !== undefined ? { inputSchema: options.inputSchema } : {}),
    ...(options.providerId !== undefined ? { providerId: options.providerId } : {}),
    value: new NumericSelector(options.name, 'value'),
    confidence: new NumericSelector(options.name, 'confidence'),
  };
}