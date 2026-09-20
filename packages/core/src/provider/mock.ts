/**
 * Mock provider for testing
 *
 * Returns mock responses without making real API calls.
 */

import type { DecisionProvider, DecisionRun, ProviderOutput } from '../decisions/types';

interface MockProviderOptions {
  /** Simulate failures for specific decisions */
  fails?: string[];
  /** Simulate latency in ms */
  latencyMs?: number;
  /** Default noul probability when no specific mock is set */
  defaultNoul?: number;
}

export const MockProvider: DecisionProvider & {
  fails: string[];
  setOptions: (opts: MockProviderOptions) => void;
} = {
  id: 'mock',
  name: 'Mock Provider',
  fails: [],

  setOptions(opts: MockProviderOptions) {
    if (opts.fails) this.fails = opts.fails;
  },

  async evaluateBatch(
    decisions: readonly DecisionRun[],
    input: unknown,
    opts?: Record<string, unknown>
  ): Promise<readonly ProviderOutput[]> {
    const results: ProviderOutput[] = [];
    for (const run of decisions) {
      const result = await this.evaluateSingle(run, input, opts);
      results.push(result);
    }
    return results;
  },

  async evaluateSingle(
    decision: DecisionRun,
    input: unknown,
    opts?: Record<string, unknown>
  ): Promise<ProviderOutput> {
    // Simulate latency if configured
    const latencyMs = (opts?.latencyMs as number) ?? 10;
    if (latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
    }

    // Check if this decision should fail
    if (this.fails.includes(decision.decision.name)) {
      throw new Error(`Mock failure for decision: ${decision.decision.name}`);
    }

    // Return mock output based on decision type
    const outputType = decision.decision.output.type;

    let produced: unknown;
    switch (outputType) {
      case 'noul':
        produced = {
          type: 'noul',
          noul: (opts?.defaultNoul as number) ?? 0.85,
        };
        break;
      case 'score':
        produced = {
          type: 'score',
          score: 1.5,
          confidence: 0.7,
          probabilities: { 0: 0.1, 1: 0.6, 2: 0.3 },
        };
        break;
      case 'choice':
        produced = {
          type: 'choice',
          choice: 'option_a',
          confidence: 0.9,
          probabilities: { option_a: 0.9, option_b: 0.1 },
        };
        break;
      default:
        produced = { type: 'noul', noul: 0.5 };
    }

    return {
      type: outputType as 'noul' | 'score' | 'choice',
      produced,
      latencyMs,
      attempts: 1,
    };
  },
};
