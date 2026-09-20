import { describe, expect, it } from 'vitest';
import { MockProvider } from '../src/provider';
import { noul, score, choice } from '../src/decision';

describe('MockProvider', () => {
  it('returns a mocked noul result', async () => {
    const provider = new MockProvider({ 'suspicious-payment': { probability: 0.93 } });
    const result = await provider.evaluate(
      noul({ name: 'suspicious-payment', question: 'q' }),
      {},
    );
    expect(result.probability).toBe(0.93);
  });

  it('derives confidence for a mocked noul probability', async () => {
    const provider = new MockProvider({ 'suspicious-payment': { probability: 0.99 } });
    const result = await provider.evaluate(
      noul({ name: 'suspicious-payment', question: 'q' }),
      {},
    );
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('returns a mocked score value', async () => {
    const provider = new MockProvider({ 'payment-risk': { value: 9, confidence: 0.95 } });
    const result = await provider.evaluate(
      score({ name: 'payment-risk', question: 'q', levels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] }),
      {},
    );
    expect(result.value).toBe(9);
    expect(result.confidence).toBe(0.95);
  });

  it('returns a mocked choice label', async () => {
    const provider = new MockProvider({ 'support-ticket-category': { value: 'technical' } });
    const result = await provider.evaluate(
      choice({ name: 'support-ticket-category', question: 'q', options: ['billing', 'technical', 'other'] }),
      {},
    );
    expect(result.value).toBe('technical');
  });

  it('falls back to a per-kind default when not mocked', async () => {
    const provider = new MockProvider();
    const noulResult = await provider.evaluate(noul({ name: 'unmocked', question: 'q' }), {});
    expect(noulResult.probability).toBe(0.5);
  });

  it('simulates injected failures', async () => {
    const provider = new MockProvider().fail('boom');
    await expect(provider.evaluate(noul({ name: 'boom', question: 'q' }), {})).rejects.toThrowError(
      /simulated failure/,
    );
  });

  it('honors a configured delay', async () => {
    const provider = new MockProvider({}, { delayMs: 1 });
    const start = Date.now();
    await provider.evaluate(noul({ name: 'slow', question: 'q' }), {});
    expect(Date.now() - start).toBeGreaterThanOrEqual(0);
  });
});