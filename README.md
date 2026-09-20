# JevFlow

Probabilistic AI decisions as composable backend programming primitives.

## Overview

JevFlow treats probabilistic AI decisions (noul, score, choice) as first-class primitives that compose with deterministic application logic. It uses [TypeSafe](https://typesafe.ai) System One models to return fast, typed judgments.

## Installation

```bash
npm install @jevflow/core
```

## Quick Start

```typescript
import { run, TypeSafeProvider } from '@jevflow/core';

const provider = new TypeSafeProvider({
  apiKey: process.env.TYPESAFE_API_KEY,
});

const decision = {
  name: 'is_satisfied',
  version: '1.0',
  description: 'Is the customer satisfied?',
  output: {
    type: 'noul' as const,
    parse: (raw: unknown) => raw as { type: 'noul'; noul: number },
  },
};

const result = await run(decision, { message: 'Thanks, that fixed it!' }, provider);
console.log(result.output.produced); // { type: 'noul', noul: 0.85 }
```

## Decision Types

### Noul (Yes/No)

Returns a probability that the answer is yes (0 to 1).

```typescript
const decision = {
  name: 'is_human_escalation',
  version: '1.0',
  description: 'Is the customer asking for a human agent?',
  output: {
    type: 'noul',
    parse: (raw) => raw,
  },
};
```

### Score (Rating)

Returns a position on an ordered scale with probabilities for each level.

```typescript
const decision = {
  name: 'bug_severity',
  version: '1.0',
  description: 'How severe is this bug?',
  output: {
    type: 'score',
    parse: (raw) => raw,
    criteria: [
      'Cosmetic; no impact',
      'Broken but workaround exists',
      'Blocking issue; no workaround',
    ],
  },
};
```

### Choice (Selection)

Returns the selected option with probabilities for all options.

```typescript
const decision = {
  name: 'route_ticket',
  version: '1.0',
  description: 'Which team should handle this?',
  output: {
    type: 'choice',
    parse: (raw) => raw,
    criteria: {
      returns: 'Exchanges, wrong items',
      shipping: 'Delivery status, delays',
      billing: 'Charges, invoices',
    },
  },
};
```

## Batch Evaluation

Run multiple decisions in parallel:

```typescript
import { runBatch, TypeSafeProvider } from '@jevflow/core';

const results = await runBatch(
  [decision1, decision2, decision3],
  input,
  provider
);
```

## Providers

### TypeSafeProvider

Uses the real TypeSafe API:

```typescript
import { TypeSafeProvider } from '@jevflow/core';

const provider = new TypeSafeProvider({
  apiKey: 'your_api_key',
  model: 'jev-latest',
});
```

### MockProvider

For testing without API calls:

```typescript
import { MockProvider } from '@jevflow/core';

const result = await run(decision, input, MockProvider);
```

## API Reference

### `run(decision, input, provider)`

Runs a single decision.

**Parameters:**
- `decision: Decision` - The decision to evaluate
- `input: unknown` - State/context for the decision
- `provider: DecisionProvider` - The provider to use

**Returns:** `Promise<EvaluationRecord>`

### `runBatch(decisions, input, provider)`

Runs multiple decisions in parallel.

**Parameters:**
- `decisions: readonly Decision[]` - Decisions to evaluate
- `input: unknown` - State/context for all decisions
- `provider: DecisionProvider` - The provider to use

**Returns:** `Promise<readonly EvaluationRecord[]>`

## Environment Variables

```
TYPESAFE_API_KEY=your_api_key_here
```

## Examples

See `example.ts` for MockProvider usage and `example-typesafe.ts` for real API usage.

## License

MIT
