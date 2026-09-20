# Changelog

## 0.1.0 (Initial Release)

### Features
- Core types: `Decision`, `DecisionRun`, `ProviderOutput`, `EvaluationRecord`, `DecisionProvider`
- Engine functions: `run()`, `runBatch()`
- `MockProvider` for testing without API calls
- `TypeSafeProvider` for real TypeSafe API integration
- Support for three decision types:
  - **Noul**: Yes/no probability (0-1)
  - **Score**: Rating on ordered scale with probabilities
  - **Choice**: Selection from named options with probabilities

### Providers
- `MockProvider`: Simulates responses with configurable latency and failure injection
- `TypeSafeProvider`: Uses TypeSafe System One models via `@typesafe-ai/sdk`

### Examples
- `example.ts`: MockProvider usage demonstration
- `example-typesafe.ts`: Real TypeSafe API usage demonstration

### Documentation
- README.md with API reference and usage examples
- Package README for @jevflow/core
- JSDoc comments on all public APIs
