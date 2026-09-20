/**
 * Workflow DSL — composing decisions with deterministic conditions.
 *
 * A workflow evaluates a list of decisions against a typed input, then
 * applies declarative thresholds (`.when(predicate).then(action)`) to
 * produce an ordered, explainable action set. It never runs side effects
 * itself; the application executes the returned actions.
 */

import type { z } from 'zod';
import type { Decision } from '../decision/decision';
import type { RawResult } from '../decision/result';
import type { Threshold } from '../decision/threshold';
import { evaluateThreshold } from '../decision/threshold';
import type { DecisionProvider } from '../provider/types';
import type { EvaluationRecord } from '../record/record';
import { EventNames, type Listener } from '../record/events';
import type { WorkflowOutcome, MatchedRule } from './outcome';

/** Options controlling a workflow run. */
export interface WorkflowRunOptions {
  /** Optional listener for lifecycle events (defaults to no-op). */
  listener?: Listener;
}

/** Builds a workflow declaration. */
export class WorkflowBuilder<TInput = unknown> {
  private readonly name: string;
  private inputSchema?: z.ZodType<TInput>;
  private readonly decisions: Decision[] = [];
  private readonly rules: { threshold: Threshold; action: string }[] = [];

  constructor(name: string) {
    this.name = name;
  }

  /** Attach a Zod schema to validate and type the workflow input. */
  input(schema: z.ZodType<TInput>): WorkflowBuilder<TInput> {
    this.inputSchema = schema;
    return this;
  }

  /** Add a decision to evaluate when the workflow runs. */
  evaluate(decision: Decision): WorkflowBuilder<TInput> {
    this.decisions.push(decision);
    return this;
  }

  /**
   * Begin a rule. Pair with `.then(action)` to attach the action fired when
   * the threshold matches.
   */
  when(threshold: Threshold): { then(action: string): WorkflowBuilder<TInput> } {
    return {
      then: (action: string): WorkflowBuilder<TInput> => {
        this.rules.push({ threshold, action });
        return this;
      },
    };
  }

  /**
   * Run the workflow. Evaluates decisions (in a batch when the provider
   * supports it), applies rules in declaration order, and returns an
   * explainable outcome with the ordered action set.
   */
  async run(
    input: TInput,
    provider: DecisionProvider,
    options: WorkflowRunOptions = {},
  ): Promise<WorkflowOutcome> {
    const listener = options.listener;
    const startedAt = new Date().toISOString();

    listener?.onEvent({ name: EventNames.workflowStarted, workflow: this.name, timestamp: startedAt });

    const validated = this.inputSchema ? this.inputSchema.parse(input) : input;

    const records = await this.evaluateAll(validated, provider, listener);

    const { matchedRules, actions } = this.applyRules(records);

    listener?.onEvent({
      name: EventNames.workflowCompleted,
      workflow: this.name,
      timestamp: new Date().toISOString(),
    });

    return {
      name: this.name,
      decisions: records,
      matchedRules,
      actions,
    };
  }

  private async evaluateAll(
    input: TInput,
    provider: DecisionProvider,
    listener?: Listener,
  ): Promise<EvaluationRecord[]> {
    if (this.decisions.length === 0) return [];

    if (provider.evaluateBatch) {
      const started = Date.now();
      const runs = this.decisions.map((decision) => ({ decision, input }));
      const raw = await provider.evaluateBatch(runs);
      const latencyMs = Date.now() - started;
      return this.decisions.map((decision, index) => {
        const result = raw[index];
        if (!result) {
          throw new Error(`provider "${provider.id}" returned no result for "${decision.name}"`);
        }
        return this.toRecord(decision, result, provider.id, latencyMs);
      });
    }

    const records: EvaluationRecord[] = [];
    for (const decision of this.decisions) {
      const started = Date.now();
      listener?.onEvent({
        name: EventNames.decisionStarted,
        decision: decision.name,
        timestamp: new Date().toISOString(),
      });
      try {
        const result = await provider.evaluate(decision, input);
        const latencyMs = Date.now() - started;
        records.push(this.toRecord(decision, result, provider.id, latencyMs));
        listener?.onEvent({
          name: EventNames.decisionCompleted,
          decision: decision.name,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        listener?.onEvent({
          name: EventNames.decisionFailed,
          decision: decision.name,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    }
    return records;
  }

  private toRecord(
    decision: Decision,
    result: RawResult,
    providerId: string,
    latencyMs: number,
  ): EvaluationRecord {
    return {
      decision: decision.name,
      provider: providerId,
      version: decision.version,
      result,
      latencyMs,
      attempts: 1,
      timestamp: new Date().toISOString(),
    };
  }

  private applyRules(records: readonly EvaluationRecord[]): {
    matchedRules: MatchedRule[];
    actions: string[];
  } {
    const byName = new Map<string, RawResult>();
    for (const record of records) byName.set(record.decision, record.result);

    const matchedRules: MatchedRule[] = [];
    const actions: string[] = [];

    for (const { threshold, action } of this.rules) {
      const result = byName.get(threshold.decision);
      if (!result) {
        throw new Error(
          `workflow "${this.name}" references decision "${threshold.decision}" which was not evaluated`,
        );
      }
      const actual = readField(result, threshold.field);
      if (evaluateThreshold(threshold, actual)) {
        matchedRules.push({
          action,
          decision: threshold.decision,
          field: threshold.field,
          threshold,
          actual,
        });
        if (!actions.includes(action)) actions.push(action);
      }
    }

    return { matchedRules, actions };
  }
}

/** Reads a named field from a raw result. */
function readField(result: RawResult, field: string): number | string {
  switch (field) {
    case 'probability':
      return (result as { probability: number }).probability;
    case 'value':
      return (result as { value: number | string }).value;
    case 'confidence':
      return (result as { confidence: number }).confidence;
    default:
      throw new Error(`unknown result field "${field}"`);
  }
}

/** Creates a new workflow builder. */
export function workflow<TInput = unknown>(name: string): WorkflowBuilder<TInput> {
  return new WorkflowBuilder<TInput>(name);
}