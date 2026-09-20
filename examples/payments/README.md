# Payment risk example

This is the canonical JevFlow example. It demonstrates the separation of
**probabilistic intelligence** (the `payment-risk` score and
`suspicious-payment` noul) from **deterministic policy** (the `.when(...)`
thresholds).

It runs against `MockProvider`, so it is fully deterministic and needs no API
key — ideal for reproducing the exact behavior in the spec.

## Run

```bash
pnpm examples:payments
```

## What to notice

- The workflow returns an ordered, explainable `actions` array, not side
  effects. Your application executes the actions.
- Each `matchedRules` entry records *which* field fired, the operator, the
  threshold, and the **actual** value — so "why did this run?" is answerable.
- The same workflow and policy run against a risky payment and a safe payment
  with identical code; only the provider's calibrated values differ.

To target the real Jev model, swap `MockProvider` for `JevProvider` (see the
comment at the bottom of `index.ts`).