/**
 * TypeSafe provider for JevFlow
 *
 * Uses the real TypeSafe API to evaluate decisions.
 */

import { TypeSafeClient } from '@typesafe-ai/sdk';
import type { DecisionProvider, DecisionRun, ProviderOutput } from '../decisions/types';

interface TypeSafeProviderOptions {
  /** API key for TypeSafe */
  apiKey?: string;
  /** Base URL for TypeSafe API */
  baseURL?: string;
  /** Default model to use */
  model?: string;
}

export class TypeSafeProvider implements DecisionProvider {
  readonly id = 'typesafe';
  readonly name = 'TypeSafe Provider';

  private client: TypeSafeClient;
  private model: string;

  constructor(options: TypeSafeProviderOptions = {}) {
    const config: Record<string, string> = {};
    if (options.apiKey) config.apiKey = options.apiKey;
    if (options.baseURL) config.baseURL = options.baseURL;

    this.client = new TypeSafeClient(config as any);
    this.model = options.model || 'jev-latest';
  }

  async evaluateBatch(
    decisions: readonly DecisionRun[],
    input: unknown,
    opts?: Record<string, unknown>
  ): Promise<readonly ProviderOutput[]> {
    // Build questions object from decisions
    const questions: Record<string, any> = {};

    for (const run of decisions) {
      const outputType = run.decision.output.type;

      if (outputType === 'noul') {
        questions[run.decision.name] = {
          type: 'noul' as const,
          instructions: run.decision.prompt || run.decision.description || '',
        };
      } else if (outputType === 'choice') {
        questions[run.decision.name] = {
          type: 'choice' as const,
          instructions: run.decision.prompt || run.decision.description || '',
          criteria: run.decision.output.criteria || {},
        };
      } else if (outputType === 'score') {
        questions[run.decision.name] = {
          type: 'score' as const,
          instructions: run.decision.prompt || run.decision.description || '',
          criteria: run.decision.output.criteria || ['low', 'medium', 'high'],
        };
      }
    }

    // Make API call
    const response = await this.client.systemOne({
      model: this.model,
      state: input as any,
      questions,
    });

    // Parse responses
    return decisions.map((run) => {
      const answer = response.answers[run.decision.name];
      return {
        type: run.decision.output.type as 'noul' | 'score' | 'choice',
        produced: run.decision.output.parse(answer),
        latencyMs: 0,
        attempts: 1,
      };
    });
  }

  async evaluateSingle(
    decision: DecisionRun,
    input: unknown,
    opts?: Record<string, unknown>
  ): Promise<ProviderOutput> {
    const results = await this.evaluateBatch([decision], input, opts);
    return results[0] as ProviderOutput;
  }
}
