# Basic example

Declares one decision of each primitive (`noul`, `score`, `choice`), evaluates
them together in a single workflow, then applies deterministic policy on top of
the calibrated results.

## Run

```bash
# from the repo root
pnpm examples:basic
```

Requires a TypeSafe API key in `.env`:

```
TYPESAFE_API_KEY=apikey_...
```

The output shows the calibrated result of each decision, followed by the
ordered actions produced by the deterministic rules.