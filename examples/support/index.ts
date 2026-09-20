import 'dotenv/config';
import { decision, workflow } from '@jevflow/core';
import { JevProvider } from '@jevflow/provider-jev';

const provider = new JevProvider({ apiKey: process.env.TYPESAFE_API_KEY });

const category = decision.choice({
  name: 'support-ticket-category',
  question: 'What category best describes this support ticket?',
  options: ['billing', 'technical', 'account', 'sales', 'other'],
});

const urgency = decision.score({
  name: 'urgency',
  question: 'How urgent is this ticket?',
  levels: ['Very low', 'Low', 'Medium', 'High', 'Very high'],
});

const requiresHuman = decision.noul({
  name: 'requires-human',
  question: 'Does this ticket require a human agent?',
});

async function main() {
  const ticket = {
    message: 'I was charged twice for my subscription and cannot log in.',
    customerTier: 'enterprise',
  };

  const outcome = await workflow('support-ticket')
    .evaluate(category)
    .evaluate(urgency)
    .evaluate(requiresHuman)
    .when(requiresHuman.probability.greaterThan(0.8)).then('route-to-agent')
    .when(urgency.value.greaterThanOrEqual(3)).then('priority-queue')
    .when(category.value.equals('billing')).then('billing-team')
    .run(ticket, provider);

  console.log('Decisions:');
  for (const record of outcome.decisions) {
    console.log(`  ${record.decision}:`, record.result);
  }
  console.log('\nActions:', outcome.actions);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});