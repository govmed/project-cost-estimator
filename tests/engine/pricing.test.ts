import { describe, it, expect } from 'vitest';
import { applyPricing } from '../../src/engine/calculations/totals';
import { money } from '../../src/types/money';

const fx = { baseCurrency: 'USD' as const, fxRates: { USD: 1.0 } as any };

describe('applyPricing', () => {
  it('applies contingency and management reserve to base cost', () => {
    const result = applyPricing(money(1000, 'USD'), 10, 5, 0, 0, fx);
    expect(result.contingencyAmount.amount).toBe(100);
    expect(result.managementReserveAmount.amount).toBe(50);
    expect(result.totalCost.amount).toBe(1150);
  });

  it('applies margin on price (gross margin convention)', () => {
    // Cost 1000, margin 25% -> price = 1000 / 0.75 = 1333.33
    const result = applyPricing(money(1000, 'USD'), 0, 0, 25, 0, fx);
    expect(result.totalCost.amount).toBe(1000);
    expect(result.targetPrice.amount).toBeCloseTo(1333.33, 2);
    expect(result.finalPrice.amount).toBeCloseTo(1333.33, 2);
    // Realized margin = 333.33, margin% on price = 25%
    expect(result.realizedMarginPct).toBeCloseTo(25, 4);
  });

  it('applies discount on top of target price', () => {
    // Cost 1000, 25% margin -> target 1333.33; 10% discount -> 1200
    const result = applyPricing(money(1000, 'USD'), 0, 0, 25, 10, fx);
    expect(result.targetPrice.amount).toBeCloseTo(1333.33, 2);
    expect(result.finalPrice.amount).toBeCloseTo(1200, 2);
    // Realized margin: (1200 - 1000) / 1200 = 16.67%
    expect(result.realizedMarginPct).toBeCloseTo(16.667, 2);
  });

  it('correctly reports a negative realized margin when discount exceeds margin', () => {
    // Cost 1000, 20% margin -> price 1250; 30% discount -> 875 (BELOW cost)
    const result = applyPricing(money(1000, 'USD'), 0, 0, 20, 30, fx);
    expect(result.finalPrice.amount).toBeCloseTo(875, 2);
    expect(result.realizedMargin.amount).toBeCloseTo(-125, 2);
    expect(result.realizedMarginPct).toBeLessThan(0);
  });

  it('handles full pricing chain: base + contingency + reserve + margin + discount', () => {
    // base=1000, cont=10%, reserve=5%, margin=25%, discount=5%
    // totalCost = 1000 * 1.15 = 1150
    // targetPrice = 1150 / 0.75 = 1533.33
    // finalPrice = 1533.33 * 0.95 = 1456.67
    const result = applyPricing(money(1000, 'USD'), 10, 5, 25, 5, fx);
    expect(result.totalCost.amount).toBeCloseTo(1150, 2);
    expect(result.targetPrice.amount).toBeCloseTo(1533.33, 2);
    expect(result.finalPrice.amount).toBeCloseTo(1456.67, 2);
  });

  it('handles zero margin (no markup)', () => {
    const result = applyPricing(money(1000, 'USD'), 0, 0, 0, 0, fx);
    expect(result.targetPrice.amount).toBe(1000);
    expect(result.realizedMarginPct).toBe(0);
  });
});
