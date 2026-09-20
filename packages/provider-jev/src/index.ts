/**
 * Jev provider — the TypeSafe System One integration.
 *
 * This package is the *only* place that knows about the TypeSafe SDK. It
 * adapts JevFlow decisions into TypeSafe `systemOne` questions and maps
 * the calibrated answers back to JevFlow result types. The core remains
 * provider-agnostic; swap this out to target a different model.
 */

import { TypeSafeClient } from '@typesafe-ai/sdk';
import {
  noulConfidence,
  type ChoiceResult,
  type Decision,
  type DecisionProvider,
  type DecisionRun,
  type NoulResult,
  type RawResult,
  type ResultOf,
  type ScoreResult,
} from '@jevflow/core';

/** Configuration for the Jev provider. */
export interface JevProviderOptions {
  /** TypeSafe API key; falls back to `TYPESAFE_API_KEY`. */
  apiKey?: string;
  /** API root URL; falls back to the SDK default. */
  baseURL?: string;
  /** Default model; falls back to `jev-latest`. */
  defaultModel?: string;
  /** Per-attempt timeout in milliseconds. */
  timeout?: number;
}

/**
 * Provider backed by TypeSafe's Jev/System One model.
 *
 * @example
 * const provider = new JevProvider({ apiKey: process.env.TYPESAFE_API_KEY });
 */
export class JevProvider implements DecisionProvider {
  readonly id = 'jev';
  readonly name = 'Jev Provider';

  private readonly client: TypeSafeClient;

  constructor(options: JevProviderOptions = {}) {
    this.client = new TypeSafeClient({
      ...(options.apiKey !== undefined ? { apiKey: options.apiKey } : {}),
      ...(options.baseURL !== undefined ? { baseURL: options.baseURL } : {}),
      ...(options.defaultModel !== undefined ? { defaultModel: options.defaultModel } : {}),
      ...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
    });
  }

  async evaluate<D extends Decision>(decision: D, input: unknown): Promise<ResultOf<D>> {
    const [result] = await this.evaluateBatch([{ decision, input }]);
    return result as ResultOf<D>;
  }

  async evaluateBatch(runs: readonly DecisionRun[]): Promise<readonly RawResult[]> {
    if (runs.length === 0) return [];

    const questions: Record<string, unknown> = {};
    for (const run of runs) {
      questions[run.decision.name] = toTypeSafeQuestion(run.decision);
    }

    // All runs in a batch share the same workflow state; use the first.
    const state = runs[0]?.input ?? null;

    const response = await this.client.systemOne({
      state: state as never,
      questions: questions as never,
    });

    return runs.map((run) => fromTypeSafeAnswer(run.decision, response.answers[run.decision.name]));
  }
}

/** Builds a TypeSafe question object from a JevFlow decision. */
export function toTypeSafeQuestion(decision: Decision): unknown {
  switch (decision.kind) {
    case 'noul':
      return {
        type: 'noul',
        instructions: decision.question,
        criteria: decision.criteria ?? null,
      };
    case 'score':
      return {
        type: 'score',
        instructions: decision.question,
        criteria: decision.levels,
      };
    case 'choice': {
      const criteria: Record<string, null> = {};
      for (const option of decision.options) criteria[option] = null;
      return { type: 'choice', instructions: decision.question, criteria };
    }
  }
}

/** Maps a TypeSafe answer back to a JevFlow result of the matching kind. */
export function fromTypeSafeAnswer(decision: Decision, answer: unknown): RawResult {
  switch (decision.kind) {
    case 'noul': {
      const raw = answer as { noul: number };
      const probability = raw.noul;
      const noulResult: NoulResult = {
        probability,
        confidence: noulConfidence(probability),
      };
      return noulResult;
    }
    case 'score': {
      const raw = answer as {
        score: number;
        confidence: number;
        legend: Record<string, string>;
        probabilities: Record<string, number>;
      };
      const probabilities: Record<number, number> = {};
      for (const [level, p] of Object.entries(raw.probabilities)) probabilities[Number(level)] = p;
      const legend = decision.levels;
      const scoreResult: ScoreResult = {
        value: raw.score,
        confidence: raw.confidence,
        probabilities,
        legend,
      };
      return scoreResult;
    }
    case 'choice': {
      const raw = answer as {
        choice: string;
        confidence: number;
        probabilities: Record<string, number>;
      };
      const choiceResult: ChoiceResult = {
        value: raw.choice,
        confidence: raw.confidence,
        probabilities: raw.probabilities,
      };
      return choiceResult;
    }
  }
}