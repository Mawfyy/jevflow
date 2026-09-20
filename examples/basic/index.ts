import 'dotenv/config';
import { decision, workflow } from '@jevflow/core';
import { JevProvider } from '@jevflow/provider-jev';

const provider = new JevProvider({ apiKey: process.env.TYPESAFE_API_KEY });

// Declare three reusable decisions covering each primitive.
const isSupported = decision.noul({
  name: 'is-supported',
  description: 'Is this a supported language/framework question?',
  question: 'Is this question about a technology we support?',
});

const satisfaction = decision.score({
  name: 'satisfaction',
  description: "How positive is the customer's sentiment?",
  question: 'How positive is the sentiment of this message?',
  levels: ['Very negative', 'Negative', 'Neutral', 'Positive', 'Very positive'],
});

const category = decision.choice({
  name: 'category',
  description: 'Which department should handle this message?',
  question: 'Which department should handle this message?',
  options: ['billing', 'technical', 'sales', 'other'],
});

async function main() {
  const message = 'I was charged twice for my subscription and need a refund.';

  // 1. Evaluate the three decisions together (one round-trip).
  const outcome = await workflow('basic-demo')
    .evaluate(isSupported)
    .evaluate(satisfaction)
    .evaluate(category)
    .run({ message }, provider);

  for (const record of outcome.decisions) {
    console.log(`${record.decision}:`, record.result);
  }

  // 2. Apply deterministic policy on top of the calibrated results.
  const route = await workflow('route')
    .evaluate(category)
    .evaluate(isSupported)
    .when(category.value.equals('billing')).then('billing-team')
    .when(isSupported.probability.lessThan(0.5)).then('escalate')
    .run({ message }, provider);

  console.log('\nActions:', route.actions);
  console.log('Matched rules:', JSON.stringify(route.matchedRules, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});