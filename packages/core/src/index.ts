/**
 * @jevflow/core - Probabilistic AI decisions as composable backend primitives
 *
 * This package provides the core types, engine, and provider interface
 * for the JevFlow library.
 */

// Core types
export type { Decision, DecisionRun, ProviderOutput, EvaluationRecord, DecisionProvider } from './decisions/types';

// Engine
export { run, runBatch } from './decisions/engine';

// Providers
export { MockProvider } from './provider/mock';
export { TypeSafeProvider } from './provider/typesafe';
