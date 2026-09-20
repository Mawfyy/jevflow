/**
 * Decision primitives — typed, versioned, reusable AI judgments.
 *
 * Usage:
 * ```ts
 * import { decision } from '@jevflow/core';
 *
 * const paymentRisk = decision.score({
 *   name: 'payment-risk',
 *   question: 'How risky is this payment?',
 *   levels: ['Very low', 'Low', 'Medium', 'High', 'Very high'],
 * });
 * ```
 */

import { noul } from './noul';
import { score } from './score';
import { choice } from './choice';

export { noul, score, choice };

/**
 * Namespace exposing the three primitive builders.
 */
export const decision = { noul, score, choice };

export type {
  NoulDecision,
  ScoreDecision,
  ChoiceDecision,
  Decision,
  BaseDecisionOptions,
  NoulDecisionOptions,
  ScoreDecisionOptions,
  ChoiceDecisionOptions,
  ResultOf,
} from './decision';

export type { NoulResult, ScoreResult, ChoiceResult, RawResult, DecisionKind } from './result';
export { binaryEntropy, noulConfidence } from './result';
export { Selector, NumericSelector, evaluateThreshold } from './threshold';
export type { Threshold, ComparisonOp } from './threshold';