/**
 * Deterministic mock provider for testing.
 *
 * The mock provider never touches a real AI model. It returns values from a
 * map keyed by decision name, with sensible per-kind defaults for anything
 * not explicitly mocked. This lets developers test workflows and policies
 * deterministically, including failure and low-confidence cases.
 *
 * @example
 * const provider = new MockProvider({
 *   'payment-risk': { value: 9, confidence: 0.95 },
 *   'suspicious-payment': { probability: 0.93 },
 * });
 */

import type { DecisionProvider, DecisionRun } from './types';
import type { Decision, ResultOf } from '../decision/decision';
import type { NoulResult, ScoreResult, ChoiceResult, RawResult } from '../decision/result';
import { noulConfidence } from '../decision/result';

/**
 * A loose mock value. The provider interprets it according to the decision's
 * kind (e.g. `{ value: 9 }` is a score for a score decision, `{ value:
 * 'technical' }` is the selected label for a choice decision).
 */
export interface MockValue {
  /** For noul: probability of yes. */
  probability?: number;
  /** For score/choice: the numeric position or selected label. */
  value?: number | string;
  /** Optional confidence; derived for noul when omitted. */
  confidence?: number;
  /** Optional probability distribution (choice labels or score levels). */
  probabilities?: Record<string, number>;
}

export interface MockProviderOptions {
  /** Per-attempt delay, in milliseconds (default 0). */
  delayMs?: number;
}

export class MockProvider implements DecisionProvider {
  readonly id = 'mock';
  readonly name = 'Mock Provider';

  private readonly mocks: Record<string, MockValue>;
  private readonly delayMs: number;
  private readonly failures = new Set<string>();

  constructor(mocks: Record<string, MockValue> = {}, options: MockProviderOptions = {}) {
    this.mocks = mocks;
    this.delayMs = options.delayMs ?? 0;
  }

  /** Causes the named decision to throw, simulating a provider failure. */
  fail(...names: string[]): this {
    for (const name of names) this.failures.add(name);
    return this;
  }

  /** Clears all injected failures. */
  clearFailures(): this {
    this.failures.clear();
    return this;
  }

  async evaluate<D extends Decision>(decision: D, input: unknown): Promise<ResultOf<D>> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.failures.has(decision.name)) {
      throw new Error(`MockProvider: simulated failure for decision "${decision.name}"`);
    }

    const mock = this.mocks[decision.name];
    switch (decision.kind) {
      case 'noul':
        return this.noul(mock) as ResultOf<D>;
      case 'score':
        return this.score(decision, mock) as ResultOf<D>;
      case 'choice':
        return this.choice(decision, mock) as ResultOf<D>;
    }
  }

  async evaluateBatch(runs: readonly DecisionRun[]): Promise<readonly RawResult[]> {
    const results: RawResult[] = [];
    for (const run of runs) {
      results.push(await this.evaluate(run.decision, run.input));
    }
    return results;
  }

  private noul(mock?: MockValue): NoulResult {
    const probability = mock?.probability ?? 0.5;
    return {
      probability,
      confidence: mock?.confidence ?? noulConfidence(probability),
    };
  }

  private score(decision: Decision & { kind: 'score' }, mock?: MockValue): ScoreResult {
    const levels = decision.levels;
    const top = levels.length - 1;
    const value = typeof mock?.value === 'number' ? mock.value : top / 2;
    const probabilities: Record<number, number> = {};
    const closest = Math.round(value);
    for (let i = 0; i < levels.length; i++) {
      probabilities[i] = i === closest ? 1 : 0;
    }
    return {
      value,
      confidence: mock?.confidence ?? (Number.isInteger(value) ? 1 : 0.5),
      probabilities,
      legend: levels,
    };
  }

  private choice(decision: Decision & { kind: 'choice' }, mock?: MockValue): ChoiceResult {
    const options = decision.options;
    const value = typeof mock?.value === 'string' ? mock.value : (options[0] ?? '');
    let probabilities: Record<string, number>;
    if (mock?.probabilities) {
      probabilities = mock.probabilities;
    } else {
      probabilities = {};
      for (const option of options) {
        probabilities[option] = option === value ? 1 : 0;
      }
    }
    return {
      value,
      confidence: mock?.confidence ?? (probabilities[value] ?? 0),
      probabilities,
    };
  }
}