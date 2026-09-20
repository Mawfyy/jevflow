/**
 * Core types for JevFlow decisions
 */

import type { z } from 'zod';

/**
 * Decision type - represents a probabilistic AI judgment
 */
export interface Decision<TInput = unknown, TOutput = unknown> {
  /** Unique identifier for this decision */
  readonly name: string;
  /** Version of this decision */
  readonly version: string;
  /** Description of what this decision evaluates */
  readonly description?: string;
  /** Input schema (Zod) */
  readonly inputSchema?: z.ZodType<TInput>;
  /** Prompt/instructions for the AI */
  readonly prompt?: string;
  /** Output configuration */
  readonly output: {
    readonly type: 'noul' | 'score' | 'choice';
    readonly parse: (raw: unknown) => TOutput;
    /** Criteria for choice or score types */
    readonly criteria?: Record<string, unknown> | readonly unknown[];
  };
  /** Which provider to use */
  readonly provider?: string;
  /** Settings for execution */
  readonly settings?: {
    timeoutMs?: number;
    retries?: number;
    fallbackProviderId?: string | null;
  };
}

/**
 * Decision run - a decision bound to its input
 */
export interface DecisionRun<TInput = unknown, TOutput = unknown> {
  readonly decision: Decision<TInput, TOutput>;
  readonly input: TInput;
}

/**
 * Provider output - the result from evaluating a decision
 */
export interface ProviderOutput<TOutput = unknown> {
  readonly type: 'noul' | 'score' | 'choice';
  readonly produced: TOutput;
  readonly latencyMs: number;
  readonly attempts: number;
  readonly cacheHit?: boolean;
}

/**
 * Evaluation record - a complete record of a decision evaluation
 */
export interface EvaluationRecord<TOutput = unknown> {
  readonly decision: string;
  readonly provider: string;
  readonly output: ProviderOutput<TOutput>;
  readonly usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Provider interface - what a decision provider must implement
 */
export interface DecisionProvider {
  readonly id: string;
  readonly name: string;
  evaluateBatch(
    decisions: readonly DecisionRun[],
    input: unknown,
    opts?: Record<string, unknown>
  ): Promise<readonly ProviderOutput[]>;
  evaluateSingle(
    decision: DecisionRun,
    input: unknown,
    opts?: Record<string, unknown>
  ): Promise<ProviderOutput>;
}
