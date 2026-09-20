import { describe, expect, it } from 'vitest';
import { noul, score, choice } from '../src/decision';

describe('decision builders', () => {
  it('builds a noul decision with selectors', () => {
    const d = noul({ name: 'suspicious-payment', question: 'Is this suspicious?' });
    expect(d.kind).toBe('noul');
    expect(d.version).toBe('1');
    expect(d.probability.field).toBe('probability');
    expect(d.confidence.greaterThan(0.6).op).toBe('gt');
  });

  it('builds a score decision with levels and value selector', () => {
    const d = score({
      name: 'payment-risk',
      question: 'How risky?',
      levels: ['Low', 'Medium', 'High'],
    });
    expect(d.kind).toBe('score');
    expect(d.levels).toHaveLength(3);
    expect(d.value.greaterThanOrEqual(2).value).toBe(2);
  });

  it('builds a choice decision with string value selector', () => {
    const d = choice({
      name: 'support-ticket-category',
      question: 'Which category?',
      options: ['billing', 'technical', 'other'],
    });
    expect(d.kind).toBe('choice');
    expect(d.value.equals('billing').op).toBe('eq');
  });

  it('rejects a score with fewer than two levels', () => {
    expect(() => score({ name: 'x', question: 'q', levels: ['only'] })).toThrowError();
  });

  it('rejects a choice with fewer than two options', () => {
    expect(() => choice({ name: 'x', question: 'q', options: ['only'] })).toThrowError();
  });

  it('persists optional metadata without explicit-undefined properties', () => {
    const d = noul({
      name: 'flagged',
      question: 'q',
      version: '2',
      description: 'desc',
      criteria: { true: 'yes means flagged', false: 'no means not flagged' },
    });
    expect(d.version).toBe('2');
    expect(d.description).toBe('desc');
    expect(d.criteria).toEqual({ true: 'yes means flagged', false: 'no means not flagged' });
  });
});