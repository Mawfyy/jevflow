/**
 * Builder for `choice` decisions — selecting one label from a defined set.
 */

import { Selector, NumericSelector } from './threshold';
import type { ChoiceDecision, ChoiceDecisionOptions } from './decision';

/**
 * Declares a reusable choice decision.
 *
 * The result `value` is the selected label; `probabilities` holds the full
 * distribution over every option.
 *
 * @example
 * const classifySupportTicket = choice({
 *   name: 'support-ticket-category',
 *   question: 'What category best describes this support ticket?',
 *   options: ['billing', 'technical', 'account', 'sales', 'other'],
 * });
 */
export function choice<TInput = unknown>(options: ChoiceDecisionOptions<TInput>): ChoiceDecision<TInput> {
  if (options.options.length < 2) {
    throw new Error(`choice decision "${options.name}" requires at least two options`);
  }

  return {
    kind: 'choice',
    name: options.name,
    version: options.version ?? '1',
    question: options.question,
    options: options.options,
    ...(options.description !== undefined ? { description: options.description } : {}),
    ...(options.inputSchema !== undefined ? { inputSchema: options.inputSchema } : {}),
    ...(options.providerId !== undefined ? { providerId: options.providerId } : {}),
    value: new Selector(options.name, 'value'),
    confidence: new NumericSelector(options.name, 'confidence'),
  };
}