import { describe, expect, it } from 'vitest';
import { NumericSelector, Selector, evaluateThreshold } from '../src/decision/threshold';

describe('NumericSelector', () => {
  const probability = new NumericSelector('suspicious-payment', 'probability');

  it('names its decision and field', () => {
    expect(probability.decision).toBe('suspicious-payment');
    expect(probability.field).toBe('probability');
  });

  it('builds greaterThan thresholds', () => {
    const t = probability.greaterThan(0.9);
    expect(t).toEqual({ decision: 'suspicious-payment', field: 'probability', op: 'gt', value: 0.9 });
  });

  it('builds greaterThanOrEqual thresholds with strict boundary semantics', () => {
    const t = probability.greaterThanOrEqual(0.9);
    expect(t.op).toBe('gte');
    expect(evaluateThreshold(t, 0.9)).toBe(true);
    expect(evaluateThreshold(t, 0.899)).toBe(false);
  });

  it('builds lessThan and lessThanOrEqual thresholds', () => {
    expect(evaluateThreshold(probability.lessThan(0.6), 0.59)).toBe(true);
    expect(evaluateThreshold(probability.lessThan(0.6), 0.6)).toBe(false);
    expect(evaluateThreshold(probability.lessThanOrEqual(0.6), 0.6)).toBe(true);
  });

  it('builds between thresholds inclusive of both bounds', () => {
    const t = probability.between(0.2, 0.8);
    expect(evaluateThreshold(t, 0.2)).toBe(true);
    expect(evaluateThreshold(t, 0.8)).toBe(true);
    expect(evaluateThreshold(t, 0.81)).toBe(false);
  });
});

describe('Selector (string equality)', () => {
  const value = new Selector('support-ticket-category', 'value');

  it('builds equality thresholds against string values', () => {
    const t = value.equals('billing');
    expect(t).toEqual({ decision: 'support-ticket-category', field: 'value', op: 'eq', value: 'billing' });
    expect(evaluateThreshold(t, 'billing')).toBe(true);
    expect(evaluateThreshold(t, 'technical')).toBe(false);
  });
});

describe('evaluateThreshold', () => {
  it('gt is strict — 0.9 is not greater than 0.9', () => {
    expect(evaluateThreshold({ decision: 'd', field: 'probability', op: 'gt', value: 0.9 }, 0.9)).toBe(false);
    expect(evaluateThreshold({ decision: 'd', field: 'probability', op: 'gt', value: 0.9 }, 0.91)).toBe(true);
  });
});