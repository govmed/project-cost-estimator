import { describe, it, expect } from 'vitest';
import { rampFactor } from '../../src/engine/calculations/cloud';

describe('rampFactor', () => {
  it('flat returns 1 every month', () => {
    for (let i = 0; i < 10; i++) {
      expect(rampFactor('flat', i, 10)).toBe(1);
    }
  });

  it('linear ramps from 0 to 1 across the project', () => {
    const total = 10;
    expect(rampFactor('linear', 0, total)).toBeCloseTo(0, 6);
    expect(rampFactor('linear', 9, total)).toBeCloseTo(1, 6);
    // Midpoint should be ~0.5
    expect(rampFactor('linear', 4, total)).toBeCloseTo(4 / 9, 6);
  });

  it('step is 0 before rampStartMonth and 1 after', () => {
    expect(rampFactor('step', 0, 10, 5)).toBe(0);
    expect(rampFactor('step', 4, 10, 5)).toBe(0);
    expect(rampFactor('step', 5, 10, 5)).toBe(1);
    expect(rampFactor('step', 9, 10, 5)).toBe(1);
  });

  it('sCurve is approximately 0 at start, 1 at end, 0.5 at midpoint', () => {
    const total = 10;
    expect(rampFactor('sCurve', 0, total)).toBeCloseTo(0, 1);
    expect(rampFactor('sCurve', 9, total)).toBeCloseTo(1, 1);
    // Midpoint area should be near 0.5
    const mid = rampFactor('sCurve', 4, total);
    expect(mid).toBeGreaterThan(0.2);
    expect(mid).toBeLessThan(0.8);
  });

  it('frontLoaded is 1 at start, 0 at end', () => {
    const total = 10;
    expect(rampFactor('frontLoaded', 0, total)).toBeCloseTo(1, 6);
    expect(rampFactor('frontLoaded', 9, total)).toBeCloseTo(0, 6);
  });

  it('backLoaded stays low until the last third', () => {
    const total = 12;
    // First 2/3 should be the low baseline.
    expect(rampFactor('backLoaded', 0, total)).toBeCloseTo(0.1, 6);
    expect(rampFactor('backLoaded', 7, total)).toBeCloseTo(0.1, 6);
    // Last month should be 1.
    expect(rampFactor('backLoaded', 11, total)).toBeCloseTo(1, 6);
  });

  it('handles totalMonths=1 edge case for linear', () => {
    expect(rampFactor('linear', 0, 1)).toBe(1);
  });
});
