import 'dotenv/config';
import { decision, workflow } from '@jevflow/core';
import { JevProvider } from '@jevflow/provider-jev';

const provider = new JevProvider({ apiKey: process.env.TYPESAFE_API_KEY });

const issueType = decision.choice({
  name: 'issue-type',
  description: 'What kind of issue is this?',
  question: 'What kind of issue is this?',
  options: ['bug', 'feature', 'question', 'other'],
});

const severity = decision.choice({
  name: 'severity',
  description: 'How severe is this issue?',
  question: 'How severe is this issue?',
  options: ['low', 'medium', 'high', 'critical'],
});

const component = decision.choice({
  name: 'component',
  description: 'Which product component does this affect?',
  question: 'Which product component does this concern?',
  options: ['billing', 'auth', 'api', 'ui', 'other'],
});

async function main() {
  const issue = 'Production API returns 500 when generating invoices.';

  const outcome = await workflow('issue-triage')
    .evaluate(issueType)
    .evaluate(severity)
    .evaluate(component)
    .when(issueType.value.equals('bug')).then('assign-engineering')
    .when(severity.value.equals('critical')).then('page-oncall')
    .when(severity.value.equals('high')).then('prioritize-sprint')
    .when(component.value.equals('billing')).then('notify-billing-team')
    .run({ issue }, provider);

  console.log('Decisions:');
  for (const record of outcome.decisions) {
    console.log(`  ${record.decision}:`, record.result.value, record.result.probabilities);
  }
  console.log('\nActions:', outcome.actions);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});