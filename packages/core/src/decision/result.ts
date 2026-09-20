/**
 * Result types produced by evaluating a decision.
 *
 * JevFlow distinguishes the *calibrated* value produced by a provider
 * (a probability, a position on a scale, a selection) from the boolean
 * a developer later derives by applying a threshold. None of these types
 * contain an application decision.
 */

/**
 * Result of a binary `noul` (yes/no) decision.
 *
 * `probability` is the calibrated probability that the answer is "yes".
 * `confidence` is derived from binary entropy (distance from 0.5), not a
 * native model value — TypeSafe noul answers carry no separate confidence.
 */
export interface NoulResult {
  readonly probability: number;
  readonly confidence: number;
}

/**
 * Result of a `score` decision.
 *
 * `value` is the probability-weighted position along the ordered levels
 * (ranges from 0 to `levels.length - 1`). `confidence` is native to
 * TypeSafe score answers. `probabilities` and `legend` reproduce the
 * model's full distribution over each level.
 */
export interface ScoreResult {
  readonly value: number;
  readonly confidence: number;
  readonly probabilities: Readonly<Record<number, number>>;
  readonly legend: readonly string[];
}

/**
 * Result of a `choice` decision.
 *
 * `value` is the selected label. `confidence` is native to TypeSafe
 * choice answers. `probabilities` is the full distribution over every
 * option label.
 */
export interface ChoiceResult {
  readonly value: string;
  readonly confidence: number;
  readonly probabilities: Readonly<Record<string, number>>;
}

/**
 * The raw, calibrated result of any decision kind.
 */
export type RawResult = NoulResult | ScoreResult | ChoiceResult;

/** The kind of a decision, mirroring the supported TypeSafe primitives. */
export type DecisionKind = 'noul' | 'score' | 'choice';

/**
 * Binary entropy of a probability, in bits, normalized to [0, 1].
 * Returns 0 at the extremes (0 and 1) and 1 at maximum uncertainty (0.5).
 */
export function binaryEntropy(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

/**
 * Derived confidence for a noul probability.
 *
 * A noul has only two outcomes, so the single probability fully describes
 * the distribution. We expose `1 - entropy` as a convenience "how far from
 * a coin flip" signal, clearly labeled as *derived*, not model-reported.
 */
export function noulConfidence(probability: number): number {
  return 1 - binaryEntropy(probability);
}