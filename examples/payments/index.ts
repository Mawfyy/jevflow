import { z } from 'zod';
import { decision, workflow, MockProvider } from '@jevflow/core';

// Declare the two decisions once.
const paymentRisk = decision.score({
  name: 'payment-risk',
  description: 'How risky is this payment?',
  question: 'How risky is this payment?',
  levels: ['Very low', 'Low', 'Medium', 'High', 'Very high'],
});

const suspiciousPayment = decision.noul({
  name: 'suspicious-payment',
  description: 'Does this payment look suspicious?',
  question: 'Is this payment suspicious?',
});

const PaymentSchema = z.object({
  amount: z.number().positive(),
  country: z.string(),
  customerAgeDays: z.number().nonnegative(),
  previousPayments: z.number().nonnegative(),
});

// Deterministic policy, layer separated from the AI judgments.
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

async function main() {
  // Deterministic provider — great for tests and CI, no API key needed.
  const riskyProvider = new MockProvider({
    'payment-risk': { value: 8.4, confidence: 0.91 },
    'suspicious-payment': { probability: 0.93, confidence: 0.88 },
  });

  const safeProvider = new MockProvider({
    'payment-risk': { value: 2.0, confidence: 0.9 },
    'suspicious-payment': { probability: 0.1, confidence: 0.9 },
  });

  const riskyPayment = {
    amount: 4_500_000,
    country: 'CO',
    customerAgeDays: 12,
    previousPayments: 1,
  };

  const safePayment = {
    amount: 25,
    country: 'US',
    customerAgeDays: 1200,
    previousPayments: 40,
  };

  const risky = await paymentWorkflow.run(riskyPayment, riskyProvider);
  const safe = await paymentWorkflow.run(safePayment, safeProvider);

  console.log('Risky payment actions:', risky.actions);
  console.log('  rules:', risky.matchedRules.map((r) => `${r.decision}.${r.field} ${r.threshold.op} ${r.threshold.value} (actual ${r.actual})`));
  console.log('\nSafe payment actions:', safe.actions);

  // To run against the real Jev model, swap the provider:
  // import 'dotenv/config';
  // import { JevProvider } from '@jevflow/provider-jev';
  // const provider = new JevProvider({ apiKey: process.env.TYPESAFE_API_KEY });
  // const real = await paymentWorkflow.run(riskyPayment, provider);
}

main().catch(console.error);