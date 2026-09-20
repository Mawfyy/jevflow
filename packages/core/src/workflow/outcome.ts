/**
 * Workflow outcome — the explainable execution plan.
 *
 * A workflow does not run side effects; it returns an outcome describing
 * which decisions ran, which rules matched (and why), and the ordered
 * action set. The application then executes the actions. This keeps
 * workflows predictable, deterministic, and testable.
 */

import type { EvaluationRecord } from '../record/record';
import type { Threshold } from '../decision/threshold';

/**
 * A rule that matched against an evaluated threshold.
 */
export interface MatchedRule {
  /** The action label attached to the `.then(...)` clause. */
  readonly action: string;
  /** The decision the threshold read from. */
  readonly decision: string;
  /** Which field was compared (e.g. `probability`, `value`, `confidence`). */
  readonly field: string;
  readonly threshold: Threshold;
  /** The actual value that satisfied the threshold (for explainability). */
  readonly actual: number | string;
}

/**
 * The result of running a workflow.
 */
export interface WorkflowOutcome {
  readonly name: string;
  /** Records for every decision evaluated, in declaration order. */
  readonly decisions: readonly EvaluationRecord[];
  /** Rules that matched, in declaration order. */
  readonly matchedRules: readonly MatchedRule[];
  /** Ordered, de-duplicated action labels. */
  readonly actions: readonly string[];
}