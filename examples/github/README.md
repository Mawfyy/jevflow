# GitHub issue triage example

Classifies an incoming issue by type, severity, and component, then runs a
deterministic workflow to decide which action to take (assign, page on-call,
notify a team).

Runs against the real Jev model.

## Run

```bash
pnpm examples:github
```

Requires a TypeSafe API key in `.env`.