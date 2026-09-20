/**
 * Observability events.
 *
 * JevFlow emits lifecycle events for decisions, workflows, and providers.
 * Applications register a `Listener` to integrate their own logger or
 * metrics system. No observability vendor is imposed; the default is a
 * silent no-op.
 */

/** A structured event emitted by JevFlow. */
export interface DecisionEvent {
  readonly name: string;
  readonly timestamp: string;
  readonly [key: string]: unknown;
}

/** Receives lifecycle events. */
export interface Listener {
  onEvent(event: DecisionEvent): void;
}

/** Named lifecycle events. */
export const EventNames = {
  decisionStarted: 'decision.started',
  decisionCompleted: 'decision.completed',
  decisionFailed: 'decision.failed',
  workflowStarted: 'workflow.started',
  workflowCompleted: 'workflow.completed',
  providerError: 'provider.error',
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];

/** Collects events in memory (useful for tests and deferred flushing). */
export class MemoryListener implements Listener {
  readonly events: DecisionEvent[] = [];

  onEvent(event: DecisionEvent): void {
    this.events.push(event);
  }
}

/** A listener that does nothing (the default). */
export class NoopListener implements Listener {
  onEvent(_event: DecisionEvent): void {}
}