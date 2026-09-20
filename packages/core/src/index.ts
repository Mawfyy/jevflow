/**
 * @jevflow/core — probabilistic AI decisions as composable backend primitives.
 *
 * JevFlow separates *probabilistic intelligence* (typed AI judgments) from
 * *deterministic policy* (application thresholds). Decisions are pure data;
 * providers supply calibrated results; workflows apply thresholds to produce
 * explainable actions — which the application then executes.
 */

// Decisions
export { decision, noul, score, choice } from './decision';
export type {
  NoulDecision,
  ScoreDecision,
  ChoiceDecision,
  Decision,
  BaseDecisionOptions,
  NoulDecisionOptions,
  ScoreDecisionOptions,
  ChoiceDecisionOptions,
  ResultOf,
} from './decision';
export type { NoulResult, ScoreResult, ChoiceResult, RawResult, DecisionKind } from './decision';
export { binaryEntropy, noulConfidence } from './decision';

// Thresholds
export { Selector, NumericSelector, evaluateThreshold } from './decision';
export type { Threshold, ComparisonOp } from './decision';

// Providers
export type { DecisionProvider, DecisionRun } from './provider';
export { MockProvider } from './provider';
export type { MockValue, MockProviderOptions } from './provider';

// Workflows
export { workflow, WorkflowBuilder } from './workflow';
export type { WorkflowRunOptions, WorkflowOutcome, MatchedRule } from './workflow';

// Records & observability
export type { EvaluationRecord } from './record';
export { EventNames, MemoryListener, NoopListener } from './record';
export type { DecisionEvent, Listener, EventName } from './record';