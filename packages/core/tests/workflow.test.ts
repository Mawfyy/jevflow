import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { workflow } from '../src/workflow';
import { MockProvider } from '../src/provider';
import { noul, score, choice } from '../src/decision';
import { MemoryListener, EventNames } from '../src/record';

describe('workflow', () => {
  const suspicious = noul({ name: 'suspicious-payment', question: 'Is this payment suspicious?' });
  const risk = score({
    name: 'payment-risk',
    question: 'How risky?',
    levels: ['very low', 'low', 'medium', 'high', 'very high'],
  });

  it('produces actions for matching thresholds', async () => {
    const provider = new MockProvider({
      'suspicious-payment': { probability: 0.93 },
      'payment-risk': { value: 4, confidence: 0.95 },
    });

    const outcome = await workflow('payment-review')
      .evaluate(suspicious)
      .evaluate(risk)
      .when(suspicious.probability.greaterThan(0.9))
      .then('human-review')
      .run({}, provider);

    expect(outcome.actions).toEqual(['human-review']);
    expect(outcome.matchedRules).toHaveLength(1);
    expect(outcome.matchedRules[0]).toMatchObject({ action: 'human-review', decision: 'suspicious-payment', field: 'probability', actual: 0.93 });
  });

  it('yields empty actions when nothing matches', async () => {
    const provider = new MockProvider({ 'suspicious-payment': { probability: 0.2 } });

    const outcome = await workflow('payment-review')
      .evaluate(suspicious)
      .when(suspicious.probability.greaterThan(0.9))
      .then('human-review')
      .run({}, provider);

    expect(outcome.actions).toEqual([]);
    expect(outcome.matchedRules).toEqual([]);
  });

  it('collects multiple actions in declaration order and de-duplicates', async () => {
    const provider = new MockProvider({
      'suspicious-payment': { probability: 0.93 },
      'payment-risk': { value: 4, confidence: 0.95 },
    });

    const outcome = await workflow('payment-review')
      .evaluate(suspicious)
      .evaluate(risk)
      .when(suspicious.probability.greaterThan(0.9)).then('human-review')
      .when(risk.value.greaterThanOrEqual(4)).then('enhanced-verification')
      .when(suspicious.probability.greaterThan(0.9)).then('human-review')
      .run({}, provider);

    expect(outcome.actions).toEqual(['human-review', 'enhanced-verification']);
  });

  it('distinguishes strict vs inclusive boundaries', async () => {
    const provider = new MockProvider({ 'payment-risk': { value: 4, confidence: 1 } });

    const strict = await workflow('w')
      .evaluate(risk)
      .when(risk.value.greaterThan(4)).then('strict')
      .run({}, provider);
    expect(strict.actions).toEqual([]);

    const inclusive = await workflow('w')
      .evaluate(risk)
      .when(risk.value.greaterThanOrEqual(4)).then('inclusive')
      .run({}, provider);
    expect(inclusive.actions).toEqual(['inclusive']);
  });

  it('supports choice value equality', async () => {
    const provider = new MockProvider({ 'support-ticket-category': { value: 'billing' } });
    const category = choice({
      name: 'support-ticket-category',
      question: 'Which category?',
      options: ['billing', 'technical', 'other'],
    });

    const outcome = await workflow('triage')
      .evaluate(category)
      .when(category.value.equals('billing')).then('priority-queue')
      .run({}, provider);

    expect(outcome.actions).toEqual(['priority-queue']);
  });

  it('throws when a rule references a decision that was not evaluated', async () => {
    const provider = new MockProvider();
    await expect(
      workflow('w')
        .when(suspicious.probability.greaterThan(0.9)).then('x')
        .run({}, provider),
    ).rejects.toThrowError(/not evaluated/);
  });

  it('validates input against the attached schema', async () => {
    const schema = z.object({ amount: z.number().positive() });
    const provider = new MockProvider({ 'suspicious-payment': { probability: 0.93 } });

    await expect(workflow('w').evaluate(suspicious).input(schema).run({ amount: -1 }, provider)).rejects.toThrowError();
  });

  it('emits lifecycle events', async () => {
    const listener = new MemoryListener();
    const provider = new MockProvider({ 'suspicious-payment': { probability: 0.93 } });

    await workflow('w').evaluate(suspicious).run({}, provider, { listener });

    const names = listener.events.map((e) => e.name);
    expect(names).toContain(EventNames.workflowStarted);
    expect(names).toContain(EventNames.workflowCompleted);
  });

  it('records provider id and decision metadata', async () => {
    const provider = new MockProvider({ 'suspicious-payment': { probability: 0.93 } });
    const outcome = await workflow('w').evaluate(suspicious).run({}, provider);

    expect(outcome.decisions[0]).toMatchObject({
      decision: 'suspicious-payment',
      provider: 'mock',
      version: '1',
    });
    expect(outcome.decisions[0].result).toHaveProperty('probability');
  });
});