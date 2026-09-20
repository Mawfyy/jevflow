/**
 * Example: Using JevFlow with MockProvider
 *
 * This example demonstrates how to use JevFlow to evaluate decisions
 * using the MockProvider (no real API calls).
 */

import { run, runBatch, MockProvider } from './packages/core/src/index';

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
  output: {
    type: 'score' as const,
    parse: (raw: unknown) => raw as { type: 'score'; score: number; confidence: number },
  },
};

// Example 3: Choice decision (select from options)
const routeTicket = {
  name: 'route_ticket',
  version: '1.0',
  description: 'Which team should handle this ticket?',
  output: {
    type: 'choice' as const,
    parse: (raw: unknown) => raw as { type: 'choice'; choice: string; confidence: number },
  },
};

// Example input
const supportTicket = {
  message: 'My order arrived damaged and I want a refund.',
  customer_id: 'cust_123',
  order_id: 'ord_456',
};

async function main() {
  console.log('=== JevFlow Example ===\n');

  // Example 1: Run a single noul decision
  console.log('1. Single Noul Decision (Customer Satisfaction)');
  const satisfactionResult = await run(customerSatisfaction, supportTicket, MockProvider);
  console.log('   Result:', satisfactionResult.output.produced);
  console.log('   Latency:', satisfactionResult.output.latencyMs, 'ms');
  console.log();

  // Example 2: Run a batch of decisions
  console.log('2. Batch Decisions (Multiple Questions)');
  const batchResults = await runBatch(
    [customerSatisfaction, bugSeverity, routeTicket],
    supportTicket,
    MockProvider
  );

  batchResults.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.decision}:`);
    console.log('      Output:', result.output.produced);
  });
  console.log();

  // Example 3: Use with options (simulate latency)
  console.log('3. Decision with Custom Options');
  MockProvider.setOptions({ latencyMs: 50 });
  const latencyResult = await run(customerSatisfaction, supportTicket, MockProvider);
  console.log('   Latency:', latencyResult.output.latencyMs, 'ms');
  console.log();

  // Example 4: Handle failures
  console.log('4. Failure Handling');
  MockProvider.setOptions({ fails: ['bug_severity'] });
  try {
    await run(bugSeverity, supportTicket, MockProvider);
  } catch (error) {
    console.log('   Caught expected error:', (error as Error).message);
  }
  console.log();

  console.log('=== Example Complete ===');
}

main().catch(console.error);
