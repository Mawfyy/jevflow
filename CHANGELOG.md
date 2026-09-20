# Changelog

## 0.1.0 (Initial release)

### Core (`@jevflow/core`)
- **Decisions** — `noul`, `score`, `choice` builders returning typed, versioned,
  reusable decisions (pure data, no provider coupling).
- **Results** — `NoulResult`, `ScoreResult`, `ChoiceResult` with derived noul
  confidence (binary entropy).
- **Thresholds** — `Selector` / `NumericSelector` with `greaterThan`,
  `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `between`, `equals`,
  `notEquals`.
- **Workflows** — `workflow(name).input(schema).evaluate(decision).when(threshold)
  .then(action).run(input, provider)` returning an explainable `WorkflowOutcome`
  (no side effects).
- **MockProvider** — deterministic provider with per-decision mock values,
  defaults, failure injection, and configured latency.
- **Records & observability** — `EvaluationRecord` and lifecycle `Listener`
  (`MemoryListener`, `NoopListener`).

### Provider (`@jevflow/provider-jev`)
- **JevProvider** — TypeSafe System One integration (`noul`, `score`, `choice`),
  batch evaluation, mapped to JevFlow result types.

### Examples
- `basic`, `payments`, `github`, `support` — runnable via `pnpm examples:*`,
  mixing deterministic mock runs and real API calls.