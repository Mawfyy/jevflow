/**
 * Provider contract.
 *
 * A `DecisionProvider` turns a decision + input into a calibrated raw
 * result. The core wraps that result with infra metadata (latency,
 * attempts, request id, timestamp); providers stay purely about the
 * semantic judgment. This is the seam that keeps JevFlow independent of
 * any single AI vendor.
 */

import type { Decision, ResultOf } from '../decision/decision';
import type { RawResult } from '../decision/result';

/**
 * A single batch entry: a decision paired with the state to evaluate.
 */
export interface DecisionRun {
  readonly decision: Decision;
  readonly input: unknown;
}

/**
 * The passive seam all providers implement.
 */
export interface DecisionProvider {
  /** Stable provider identifier, e.g. `'jev'` or `'mock'`. */
  readonly id: string;
  /** Human-readable name, used in records and observability events. */
  readonly name: string;
  /**
   * Evaluate a single decision.
   *
   * Returns the calibrated raw result for the decision's kind. The
   * provider must not apply the application's thresholds or business logic.
   */
  evaluate<D extends Decision>(decision: D, input: unknown): Promise<ResultOf<D>>;
  /**
   * Optional: evaluate several decisions together (e.g. one round-trip to
   * a model API). Defaults to sequential `evaluate` calls when omitted.
   */
  evaluateBatch?(runs: readonly DecisionRun[]): Promise<readonly RawResult[]>;
}