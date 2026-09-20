import { describe, expect, it } from 'vitest';
import { binaryEntropy, noulConfidence } from '../src/decision/result';

describe('binaryEntropy', () => {
  it('is 0 at the extremes', () => {
    expect(binaryEntropy(0)).toBe(0);
    expect(binaryEntropy(1)).toBe(0);
  });

  it('is 1 at maximum uncertainty (0.5)', () => {
    expect(binaryEntropy(0.5)).toBeCloseTo(1, 10);
  });

  it('is symmetric around 0.5', () => {
    expect(binaryEntropy(0.3)).toBeCloseTo(binaryEntropy(0.7), 10);
  });

  it('clamps out-of-range values to the extreme', () => {
    expect(binaryEntropy(1.5)).toBe(0);
    expect(binaryEntropy(-0.2)).toBe(0);
  });
});

describe('noulConfidence', () => {
  it('is highest at the extremes and lowest at 0.5', () => {
    expect(noulConfidence(0.99)).toBeCloseTo(1, 0);
    expect(noulConfidence(0.5)).toBe(0);
  });
});