# JevFlow

> Treat probabilistic AI decisions as a programming primitive that composes with deterministic application logic.

JevFlow lets backend developers define **typed probabilistic judgments** (yes/no,
scoring, classification) and use them inside normal workflows — with **explicit
thresholds**, **deterministic policy**, and **full explainability**. It defaults to
[TypeSafe](https://typesafe.ai)'s Jev/System One model as the AI provider, but the
provider is a replaceable seam, not a hard dependency.

---

## The core idea

Two things are often conflated in "add AI to your backend" tools:

1. **Probabilistic intelligence** — the model answers a question about some state.
   > *"Is this transaction suspicious?" → 0.93*

2. **Deterministic policy** — your application decides what that number means.
   > *`if (suspicious > 0.9) requireHumanReview()`*

JevFlow keeps them **strictly separate**. The model never sees your business rules,
and your business rules never guess what the model meant. Every decision returns a
structured, calibrated result; every workflow returns an explainable plan of which
rules matched and why.

```ts
const paymentRisk = decision.score({
  name: 'payment-risk',
  question: 'How risky is this payment?',
  levels: ['Very low', 'Low', 'Medium', 'High', 'Very high'],
});

const suspiciousPayment = decision.noul({
  name: 'suspicious-payment',
  question: 'Is this payment suspicious?',
});

const paymentWorkflow = workflow('payment-review')
  .input(PaymentSchema)
  .evaluate(paymentRisk)
  .evaluate(suspiciousPayment)
  .when(suspiciousPayment.probability.greaterThan(0.9))
  .then('human-review')
  .when(paymentRisk.value.greaterThanOrEqual(8))
  .then('enhanced-verification')
  .when(suspiciousPayment.confidence.lessThan(0.6))
  .then('human-review');

const outcome = await paymentWorkflow.run(payment, provider);
// outcome.actions => ['human-review', 'enhanced-verification']
```

The workflow does **not** run side effects — it returns an ordered action set that
*your* application executes. This makes workflows predictable, testable, and
replayable.

---

## Package layout

```
jevflow/
├── packages/
│   ├── core/           # @jevflow/core — decisions, thresholds, workflows, records
│   └── provider-jev/   # @jevflow/provider-jev — TypeSafe Jev/System One provider
├── examples/
│   ├── basic/          # one of each primitive, real API
│   ├── payments/       # payment-risk workflow (deterministic, mock)
│   ├── github/         # issue triage
│   └── support/        # support-ticket routing
└── README.md
```

`@jevflow/core` is **provider-agnostic**. It contains no TypeSafe code; the Jev
integration lives entirely in `@jevflow/provider-jev`. A different model, a local
model, a traditional ML model, or a rules engine can be added by implementing one
small interface.

---

## Installation

```bash
pnpm add @jevflow/core @jevflow/provider-jev
```

Set your TypeSafe API key (or pass it to the provider directly):

```bash
export TYPESAFE_API_KEY=apikey_...
```

---

## Decision types

Decisions are **declared once** and **evaluated many times**. They are pure data —
name, version, question, options — with no provider and no execution logic baked in.

### Noul — yes/no probability

```ts
const isSpam = decision.noul({
  name: 'is-spam',
  question: 'Does this message contain unsolicited advertising?',
  criteria: { true: 'promotional bulk content', false: 'personal or transactional' },
});

// result: { probability: 0.94, confidence: 0.56 }
```

A noul has no native confidence (returned by the model); JevFlow derives one from
binary entropy — how far the probability is from 0.5. It is clearly labeled as
*derived*, not model-reported.

### Score — a position on ordered levels

```ts
const urgency = decision.score({
  name: 'urgency',
  question: 'How urgent is this ticket?',
  levels: ['Very low', 'Low', 'Medium', 'High', 'Very high'],
});

// result: { value: 3.2, confidence: 0.87, probabilities: {...}, legend: [...] }
```

`value` is the probability-weighted position in `[0, levels.length - 1]`.
`confidence` is native to the model.

### Choice — select one label

```ts
const category = decision.choice({
  name: 'support-ticket-category',
  question: 'Which category best describes this ticket?',
  options: ['billing', 'technical', 'account', 'sales', 'other'],
});

// result: { value: 'billing', confidence: 1.0, probabilities: {...} }
```

---

## Workflows and thresholds

Workflows combine decisions with **deterministic** conditions. Each decision
exposes typed selectors that build thresholds:

| Selector | Applies to | Operators |
| --- | --- | --- |
| `decision.probability` | noul | `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `between`, `equals` |
| `decision.value` | score (number) / choice (string) | numeric ops for score, `equals`/`notEquals` for choice |
| `decision.confidence` | all | numeric ops |

```ts
workflow('triage')
  .evaluate(category)
  .evaluate(urgency)
  .when(category.value.equals('billing')).then('billing-team')
  .when(urgency.value.greaterThanOrEqual(3)).then('priority-queue')
  .when(urgency.confidence.lessThan(0.6)).then('human-review')
  .run(ticket, provider);
```

Thresholds are strict on the boundary: `greaterThan(0.9)` does **not** match `0.9`;
use `greaterThanOrEqual` for an inclusive bound.

The `WorkflowOutcome` is fully inspectable:

```ts
{
  name: 'triage',
  decisions: [ /* EvaluationRecord... */ ],
  matchedRules: [
    { action: 'billing-team', decision: 'category', field: 'value', threshold: {...}, actual: 'billing' }
  ],
  actions: ['billing-team']
}
```

Each matched rule records the field, operator, threshold, and **actual** value —
so "why did this run?" is a data question, not a guess.

---

## Providers

### Jev / TypeSafe

```ts
import { JevProvider } from '@jevflow/provider-jev';

const provider = new JevProvider({ apiKey: process.env.TYPESAFE_API_KEY });

const outcome = await workflow('...').run(input, provider);
```

The provider batches independent decisions into a single `systemOne` request.
Configuration options include `apiKey`, `baseURL`, `defaultModel`, and `timeout`.

### Mock — deterministic testing

```ts
import { MockProvider } from '@jevflow/core';

const provider = new MockProvider({
  'payment-risk': { value: 8.4, confidence: 0.91 },
  'suspicious-payment': { probability: 0.93 },
});

// Simulate provider failures:
provider.fail('payment-risk');

const outcome = await paymentWorkflow.run(payment, provider);
expect(outcome.actions).toContain('human-review');
```

Unmocked decisions fall back to sensible per-kind defaults. The mock provider
makes workflow and policy tests deterministic — no API key, no network.

### Writing your own

```ts
interface DecisionProvider {
  readonly id: string;
  readonly name: string;
  evaluate<D extends Decision>(decision: D, input: unknown): Promise<ResultOf<D>>;
  evaluateBatch?(runs: readonly DecisionRun[]): Promise<readonly RawResult[]>;
}
```

---

## Records and observability

Every evaluation produces an `EvaluationRecord` — decision name, provider, version,
calibrated result, latency, attempt count, request id, and timestamp. Input is
**never** included, so records are safe to log or persist.

Lifecycle events (`decision.started`, `decision.completed`, `decision.failed`,
`workflow.started`, `workflow.completed`, `provider.error`) are emitted to an
optional listener:

```ts
const listener = new MemoryListener();
const outcome = await workflow('...').run(input, provider, { listener });
```

No observability vendor is imposed — integrate your own logger or metrics system
via the `Listener` interface.

---

## Examples

```bash
pnpm install
pnpm build

pnpm examples:payments   # deterministic, no API key needed
pnpm examples:basic      # one of each primitive (real API)
pnpm examples:github     # issue triage (real API)
pnpm examples:support    # ticket routing (real API)
```

The API-key examples read the key from `.env` (see `.env.example` note in the
READMEs under `examples/`).

---

## Development

```bash
pnpm install
pnpm build       # build both packages
pnpm test        # run unit tests (41 tests)
pnpm typecheck   # strict type checking
```

---

## Design principles

- **Type safety first** — decisions and results are typed by kind.
- **Provider independence** — core has no vendor dependency.
- **Deterministic business logic** — policy lives in thresholds, never in the model.
- **Explicit AI uncertainty** — probability, confidence, and threshold are distinct.
- **Explainability by default** — records and matched rules capture the "why".
- **Testability** — mock provider, pure workflow outcomes, no hidden side effects.
- **No premature complexity** — a library, not a service.

## License

MIT