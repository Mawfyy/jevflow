import { describe, expect, it } from 'vitest';
import { noul, score, choice } from '@jevflow/core';
import { JevProvider, toTypeSafeQuestion, fromTypeSafeAnswer } from '../src/index';

describe('toTypeSafeQuestion', () => {
  it('maps a noul decision to a TypeSafe noul question', () => {
    const d = noul({ name: 'flagged', question: 'Is it flagged?', criteria: { true: 'yes', false: 'no' } });
    expect(toTypeSafeQuestion(d)).toEqual({
      type: 'noul',
      instructions: 'Is it flagged?',
      criteria: { true: 'yes', false: 'no' },
    });
  });

  it('maps a score decision to a TypeSafe score question', () => {
    const d = score({ name: 'risk', question: 'How risky?', levels: ['low', 'medium', 'high'] });
    expect(toTypeSafeQuestion(d)).toEqual({
      type: 'score',
      instructions: 'How risky?',
      criteria: ['low', 'medium', 'high'],
    });
  });

  it('maps a choice decision to a TypeSafe choice question with null descriptions', () => {
    const d = choice({ name: 'category', question: 'Which?', options: ['billing', 'technical'] });
    expect(toTypeSafeQuestion(d)).toEqual({
      type: 'choice',
      instructions: 'Which?',
      criteria: { billing: null, technical: null },
    });
  });
});

describe('fromTypeSafeAnswer', () => {
  it('maps a noul answer, deriving confidence', () => {
    const d = noul({ name: 'flagged', question: 'q' });
    const result = fromTypeSafeAnswer(d, { type: 'noul', noul: 0.99 });
    expect(result).toHaveProperty('probability', 0.99);
    expect((result as { confidence: number }).confidence).toBeGreaterThan(0.9);
  });

  it('maps a score answer, preserving probabilities and legend', () => {
    const d = score({ name: 'risk', question: 'q', levels: ['low', 'medium', 'high'] });
    const result = fromTypeSafeAnswer(d, {
      type: 'score',
      score: 1.43,
      confidence: 0.35,
      legend: { '0': 'low', '1': 'medium', '2': 'high' },
      probabilities: { '0': 0.0, '1': 0.57, '2': 0.43 },
    });
    expect(result).toMatchObject({
      value: 1.43,
      confidence: 0.35,
      probabilities: { 0: 0.0, 1: 0.57, 2: 0.43 },
      legend: ['low', 'medium', 'high'],
    });
  });

  it('maps a choice answer', () => {
    const d = choice({ name: 'category', question: 'q', options: ['billing', 'technical'] });
    const result = fromTypeSafeAnswer(d, {
      type: 'choice',
      choice: 'billing',
      confidence: 0.9,
      probabilities: { billing: 0.9, technical: 0.1 },
    });
    expect(result).toMatchObject({ value: 'billing', confidence: 0.9 });
  });
});

describe('JevProvider', () => {
  it('exposes its id and name without requiring an API key', () => {
    // Constructing with a dummy key is sufficient for metadata checks;
    // no network call is made here.
    const provider = new JevProvider({ apiKey: 'dummy' });
    expect(provider.id).toBe('jev');
    expect(provider.name).toBe('Jev Provider');
  });
});