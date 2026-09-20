# @jevflow/core

Core library for JevFlow - probabilistic AI decisions as composable backend primitives.

## Installation

```bash
npm install @jevflow/core
```

## Exports

### Types
- `Decision` - Decision definition
- `DecisionRun` - Decision bound to input
- `ProviderOutput` - Provider result
- `EvaluationRecord` - Complete evaluation record
- `DecisionProvider` - Provider interface

### Functions
- `run()` - Evaluate a single decision
- `runBatch()` - Evaluate multiple decisions

### Providers
- `MockProvider` - Mock provider for testing
- `TypeSafeProvider` - TypeSafe API provider

## Usage

```typescript
import { run, TypeSafeProvider } from '@jevflow/core';

const provider = new TypeSafeProvider({ apiKey: '...' });
const result = await run(decision, input, provider);
```
