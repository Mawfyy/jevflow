/**
 * Decision definitions — reusable, typed, versioned judgments.
 *
 * A decision is declared once and evaluated many times. It is *pure data*:
 * it carries the semantic question, its kind, and metadata, but no provider
 * and no execution logic, which keeps it serializable and provider-agnostic.
 */

import type { z } from 'zod';
import type { DecisionKind, NoulResult, ScoreResult, ChoiceResult, RawResult } from './result';
import type { Selector, NumericSelector } from './threshold';

/**
 * Fields shared by every decision kind.
 */
export interface DecisionBase<K extends DecisionKind, TInput = unknown> {
  readonly kind: K;
  /** Stable identifier used for caching keys, records, and workflow matching. */
  readonly name: string;
  /** Version of this decision, for tracking changes in behavior over time. */
  readonly version: string;
  /** Optional human-readable description of what this decision evaluates. */
  readonly description?: string;
  /** The semantic judgment the provider is asked to make. */
  readonly question: string;
  /** Optional Zod schema for validating/typing the input. */
  readonly inputSchema?: z.ZodType<TInput>;
  /** Which provider id to use; `undefined` means the workflow default. */
  readonly providerId?: string;
}

/** Shared options accepted by every decision builder. */
export interface BaseDecisionOptions<TInput = unknown> {
  name: string;
  question: string;
  description?: string;
  version?: string;
  inputSchema?: z.ZodType<TInput>;
  providerId?: string;
}

/**
 * A binary (yes/no) decision.
 *
 * Results are `NoulResult`. The decision exposes `probability` and
 * `confidence` selectors for building thresholds.
 */
export interface NoulDecision<TInput = unknown> extends DecisionBase<'noul', TInput> {
  readonly probability: NumericSelector;
  readonly confidence: NumericSelector;
  /** Optional descriptions of what `true` and `false` mean. */
  readonly criteria?: { readonly true?: string; readonly false?: string };
}

/** Options for building a `noul` decision. */
export interface NoulDecisionOptions<TInput = unknown> extends BaseDecisionOptions<TInput> {
  /** Optional descriptions of what a `true` and `false` answer mean. */
  criteria?: { readonly true?: string; readonly false?: string };
}

/**
 * A score decision — a position along ordered, descriptive levels.
 *
 * Results are `ScoreResult`. The decision exposes `value` and `confidence`
 * selectors. `levels` are plain descriptions (low to high), matching
 * TypeSafe's native `criteria` shape.
 */
export interface ScoreDecision<TInput = unknown> extends DecisionBase<'score', TInput> {
  /** Ordered level descriptions, from the low end to the high end. */
  readonly levels: readonly string[];
  readonly value: NumericSelector;
  readonly confidence: NumericSelector;
}

/** Options for building a `score` decision. */
export interface ScoreDecisionOptions<TInput = unknown> extends BaseDecisionOptions<TInput> {
  /** Ordered level descriptions, from low to high (at least two). */
  levels: readonly string[];
}

/**
 * A choice decision — selecting one label from a defined set.
 *
 * Results are `ChoiceResult`. The decision exposes `value` (the selected
 * label) and `confidence` selectors.
 */
export interface ChoiceDecision<TInput = unknown> extends DecisionBase<'choice', TInput> {
  /** The available option labels, in stable order. */
  readonly options: readonly string[];
  readonly value: Selector;
  readonly confidence: NumericSelector;
}

/** Options for building a `choice` decision. */
export interface ChoiceDecisionOptions<TInput = unknown> extends BaseDecisionOptions<TInput> {
  /** The available option labels. */
  options: readonly string[];
}

/** Any decision. */
export type Decision<TInput = unknown> = NoulDecision<TInput> | ScoreDecision<TInput> | ChoiceDecision<TInput>;

/** Maps a decision kind to its result type. */
export interface ResultByKind {
  noul: NoulResult;
  score: ScoreResult;
  choice: ChoiceResult;
}

/**
 * Resolves the result type for a decision, preserving input generics.
 */
export type ResultOf<D extends Decision> = D extends NoulDecision
  ? NoulResult
  : D extends ScoreDecision
    ? ScoreResult
    : D extends ChoiceDecision
      ? ChoiceResult
      : RawResult;

export type { RawResult };