/**
 * Threshold selectors and predicates.
 *
 * A `Selector` references a field of a decision's result (e.g. the
 * `probability` of a noul, or the `value` of a score) *by decision name*,
 * so a workflow can later evaluate it against the actual result. It
 * produces `Threshold` descriptors — pure data — rather than closures,
 * keeping them serializable and inspectable.
 *
 * Numeric fields use `NumericSelector`, which adds comparison operators.
 * The `value` of a choice decision is a string, so it uses the base
 * `Selector`, which only offers equality checks.
 */

/** A comparison operator. */
export type ComparisonOp = 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'eq' | 'neq';

/**
 * A deterministic threshold over one field of one decision's result.
 *
 * This is the seam where the model's calibrated value meets application
 * policy. A threshold is plain data: it names the decision and field and
 * records what comparison to perform, so it can be logged, serialized,
 * and re-evaluated.
 */
export interface Threshold {
  /** The decision name this threshold reads from. */
  readonly decision: string;
  /** Which field of the result to read (e.g. `probability`, `value`, `confidence`). */
  readonly field: string;
  readonly op: ComparisonOp;
  readonly value: number | string;
  /** Upper bound, only populated for `op: 'between'`. */
  readonly valueMax?: number;
}

/**
 * A typed reference to one field of a decision's result.
 *
 * Instances are attached to decision objects by the decision builders
 * (e.g. `suspiciousPayment.probability`), so predicate expressions read
 * naturally: `suspiciousPayment.probability.greaterThan(0.9)`.
 */
export class Selector {
  readonly decision: string;
  readonly field: string;

  constructor(decision: string, field: string) {
    this.decision = decision;
    this.field = field;
  }

  equals(value: string | number): Threshold {
    return { decision: this.decision, field: this.field, op: 'eq', value };
  }

  notEquals(value: string | number): Threshold {
    return { decision: this.decision, field: this.field, op: 'neq', value };
  }
}

/**
 * A selector over a numeric field, adding comparison operators.
 */
export class NumericSelector extends Selector {
  greaterThan(value: number): Threshold {
    return { decision: this.decision, field: this.field, op: 'gt', value };
  }

  greaterThanOrEqual(value: number): Threshold {
    return { decision: this.decision, field: this.field, op: 'gte', value };
  }

  lessThan(value: number): Threshold {
    return { decision: this.decision, field: this.field, op: 'lt', value };
  }

  lessThanOrEqual(value: number): Threshold {
    return { decision: this.decision, field: this.field, op: 'lte', value };
  }

  between(min: number, max: number): Threshold {
    return {
      decision: this.decision,
      field: this.field,
      op: 'between',
      value: min,
      valueMax: max,
    };
  }
}

/**
 * Evaluates a threshold against a single actual value.
 *
 * Kept as a free function (rather than a method on `Threshold`) so the
 * descriptor stays pure data; this function is the deterministic
 * comparison used by workflows.
 */
export function evaluateThreshold(threshold: Threshold, actual: number | string): boolean {
  switch (threshold.op) {
    case 'gt':
      return Number(actual) > (threshold.value as number);
    case 'gte':
      return Number(actual) >= (threshold.value as number);
    case 'lt':
      return Number(actual) < (threshold.value as number);
    case 'lte':
      return Number(actual) <= (threshold.value as number);
    case 'between':
      return (
        threshold.valueMax !== undefined &&
        Number(actual) >= (threshold.value as number) &&
        Number(actual) <= threshold.valueMax
      );
    case 'eq':
      return actual === threshold.value;
    case 'neq':
      return actual !== threshold.value;
  }
}