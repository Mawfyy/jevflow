/**
 * Example: Using JevFlow with TypeSafe API
 *
 * This example demonstrates how to use JevFlow to evaluate decisions
 * using the real TypeSafe API.
 *
 * Make sure to set TYPESAFE_API_KEY in your .env file:
 *   TYPESAFE_API_KEY=your_api_key_here
 */

import 'dotenv/config';
import { run, runBatch, TypeSafeProvider } from './packages/core/src/index';

// Create TypeSafe provider
const provider = new TypeSafeProvider({
  apiKey: process.env.TYPESAFE_API_KEY,
});

// Example 1: Simple noul decision (yes/no probability)
const customerSatisfaction = {
  name: 'customer_satisfaction',
  version: '1.0',
  description: 'Is the customer satisfied with our product?',
  output: {
    type: 'noul' as const,
    parse: (raw: unknown) => raw as { type: 'noul'; noul: number },
  },
};

// Example 2: Score decision (rating on a scale)
const bugSeverity = {
  name: 'bug_severity',
  version: '1.0',
  description: 'How severe is this bug?',
  prompt: 'Rate the severity of this bug from 0 to 2',
  output: {
    type: 'score' as const,
    parse: (raw: unknown) => raw as { type: 'score'; score: number; confidence: number },
    criteria: [
      'Cosmetic; no impact to functionality',
      'Broken or degraded feature, but workaround exists',
      'Blocking issue; no workaround exists',
    ],
  },
};

// Example 3: Choice decision (select from options)
const routeTicket = {
  name: 'route_ticket',
  version: '1.0',
  description: 'Which team should handle this ticket?',
  prompt: 'Which team should handle this support ticket?',
  output: {
    type: 'choice' as const,
    parse: (raw: unknown) => raw as { type: 'choice'; choice: string; confidence: number },
    criteria: {
      returns: 'Exchanges, wrong or damaged items',
      shipping: 'Delivery status, delays, lost packages',
      billing: 'Charges, invoices, payment problems',
    },
  },
};

// Example input
const supportTicket = {
  message: 'My running shoes arrived in the wrong size. Can I swap them for a size 10?',
  customer_id: 'cust_123',
  order_id: 'ord_456',
};

async function main() {
  console.log('=== JevFlow TypeSafe Example ===\n');

  // Check for API key
  if (!process.env.TYPESAFE_API_KEY) {
    console.error('Error: TYPESAFE_API_KEY environment variable is not set.');
    console.error('Please set it before running this example:');
    console.error('  export TYPESAFE_API_KEY=your_api_key_here');
    process.exit(1);
  }

  // Example 1: Run a single noul decision
  console.log('1. Single Noul Decision (Customer Satisfaction)');
  try {
    const satisfactionResult = await run(customerSatisfaction, supportTicket, provider);
    console.log('   Result:', satisfactionResult.output.produced);
    console.log('   Latency:', satisfactionResult.output.latencyMs, 'ms');
  } catch (error) {
    console.error('   Error:', (error as Error).message);
  }
  console.log();

  // Example 2: Run a batch of decisions
  console.log('2. Batch Decisions (Multiple Questions)');
  try {
    const batchResults = await runBatch(
      [customerSatisfaction, bugSeverity, routeTicket],
      supportTicket,
      provider
    );

    batchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.decision}:`);
      console.log('      Output:', result.output.produced);
    });
  } catch (error) {
    console.error('   Error:', (error as Error).message);
  }
  console.log();

  console.log('=== Example Complete ===');
}

main().catch(console.error);
