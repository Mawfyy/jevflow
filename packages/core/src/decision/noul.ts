/**
 * Builder for binary `noul` (yes/no) decisions.
 */

import { NumericSelector } from './threshold';
import type { NoulDecision, NoulDecisionOptions } from './decision';

/**
 * Declares a reusable binary decision.
 *
 * The result carries the calibrated probability of "yes" and a derived
 * confidence. No boolean is computed here — a developer derives one by
 * applying a threshold in a workflow or policy.
 *
 * @example
 * const suspiciousPayment = noul({
 *   name: 'suspicious-payment',
 *   question: 'Is this payment suspicious?',
 *   criteria: { true: 'Buyer/seller seems fraudulent', false: 'Looks ordinary' },
 * });
 */
export function noul<TInput = unknown>(options: NoulDecisionOptions<TInput>): NoulDecision<TInput> {
  return {
    kind: 'noul',
    name: options.name,
    version: options.version ?? '1',
    question: options.question,
    ...(options.description !== undefined ? { description: options.description } : {}),
    ...(options.inputSchema !== undefined ? { inputSchema: options.inputSchema } : {}),
    ...(options.providerId !== undefined ? { providerId: options.providerId } : {}),
    ...(options.criteria !== undefined ? { criteria: options.criteria } : {}),
    probability: new NumericSelector(options.name, 'probability'),
    confidence: new NumericSelector(options.name, 'confidence'),
  };
}