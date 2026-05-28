import { describe, it, expect } from 'vitest';
import { toBase, sumInBase, addInBase } from '../../src/engine/fx';
import { money } from '../../src/types/money';

const fx = {
  baseCurrency: 'USD' as const,
  fxRates: { USD: 1.0, EUR: 0.93, GBP: 0.79, INR: 83.5, CAD: 1.36, AUD: 1.51, BRL: 5.05 },
};

describe('FX conversion', () => {
  it('returns the same Money when currency matches base', () => {
    const m = money(100, 'USD');
    expect(toBase(m, fx).amount).toBe(100);
    expect(toBase(m, fx).currency).toBe('USD');
  });

  it('converts EUR to USD using the rate', () => {
    // 1 USD = 0.93 EUR, so 93 EUR = 100 USD.
    const m = money(93, 'EUR');
    expect(toBase(m, fx).amount).toBeCloseTo(100, 6);
    expect(toBase(m, fx).currency).toBe('USD');
  });

  it('converts INR to USD using the rate', () => {
    // 1 USD = 83.5 INR, so 8350 INR = 100 USD.
    const m = money(8350, 'INR');
    expect(toBase(m, fx).amount).toBeCloseTo(100, 6);
  });

  it('throws if no rate is defined for the source currency', () => {
    const broken = { baseCurrency: 'USD' as const, fxRates: { USD: 1.0 } as any };
    expect(() => toBase(money(50, 'EUR'), broken)).toThrow();
  });

  it('sums a mixed-currency list correctly', () => {
    // 100 USD + 93 EUR (=100 USD) + 8350 INR (=100 USD) = 300 USD.
    const total = sumInBase([money(100, 'USD'), money(93, 'EUR'), money(8350, 'INR')], fx);
    expect(total.amount).toBeCloseTo(300, 6);
    expect(total.currency).toBe('USD');
  });

  it('adds two values in base', () => {
    const r = addInBase(money(50, 'USD'), money(46.5, 'EUR'), fx);
    expect(r.amount).toBeCloseTo(100, 6);
  });
});
