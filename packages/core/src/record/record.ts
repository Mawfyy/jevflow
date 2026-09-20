/**
 * Evaluation records — structured, explainable outputs.
 *
 * Every decision evaluation produces an `EvaluationRecord`. It captures
 * *which* decision ran, *which* provider answered, the *calibrated* result,
 * and infra metadata (latency, attempts, request id, timestamp). It
 * deliberately does NOT contain the input, so records are safe to log and
 * persist without leaking sensitive application state.
 */

import type { RawResult } from '../decision/result';

/**
 * A complete record of a single decision evaluation.
 */
export interface EvaluationRecord {
  /** The decision name. */
  readonly decision: string;
  /** The provider id that answered (e.g. `'jev'`, `'mock'`). */
  readonly provider: string;
  /** The decision version used. */
  readonly version: string;
  /** The calibrated result (probability / score / choice). */
  readonly result: RawResult;
  /** Latency of the provider call, in milliseconds. */
  readonly latencyMs: number;
  /** Number of provider attempts (>= 1). */
  readonly attempts: number;
  /** Provider request id, when the provider exposes one. */
  readonly requestId?: string;
  /** ISO-8601 timestamp of completion. */
  readonly timestamp: string;
}