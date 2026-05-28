/**
 * FX conversion.
 *
 * Every monetary value in the model carries its currency. Before any summing
 * or comparison, values are normalized to the project's base currency using
 * the project's fxRates.
 *
 * Convention: fxRates is { CCY: rate-per-base-unit }. E.g., for a USD-base
 * project, fxRates.EUR = 0.93 means "1 USD = 0.93 EUR".
 *
 * To convert FROM a currency TO baseCurrency: divide the amount by the rate
 * for that currency.
 */

import { CurrencyCode, Money, money, zero } from '../types/money';

export interface FxContext {
  baseCurrency: CurrencyCode;
  fxRates: Record<CurrencyCode, number>;
}

/**
 * Convert a Money to the project's base currency.
 * If the Money is already in baseCurrency, no conversion happens.
 */
export function toBase(m: Money, ctx: FxContext): Money {
  if (m.currency === ctx.baseCurrency) return m;

  const rate = ctx.fxRates[m.currency];
  if (rate === undefined || rate === 0) {
    throw new Error(
      `No FX rate defined for ${m.currency} to ${ctx.baseCurrency}. ` +
      `Add it to project.fxRates.`,
    );
  }
  return money(m.amount / rate, ctx.baseCurrency);
}

/**
 * Sum an array of Money values, converting each to base first.
 * Empty array returns zero in baseCurrency.
 */
export function sumInBase(values: Money[], ctx: FxContext): Money {
  let total = 0;
  for (const v of values) {
    total += toBase(v, ctx).amount;
  }
  return money(total, ctx.baseCurrency);
}

/**
 * Add two Money values, normalizing both to base if they differ.
 */
export function addInBase(a: Money, b: Money, ctx: FxContext): Money {
  return money(toBase(a, ctx).amount + toBase(b, ctx).amount, ctx.baseCurrency);
}

/**
 * Subtract: a - b, in base currency.
 */
export function subInBase(a: Money, b: Money, ctx: FxContext): Money {
  return money(toBase(a, ctx).amount - toBase(b, ctx).amount, ctx.baseCurrency);
}

/**
 * Multiply a Money by a scalar. No FX involved (preserves currency).
 */
export function mul(m: Money, factor: number): Money {
  return money(m.amount * factor, m.currency);
}

/** Zero in base. */
export function zeroBase(ctx: FxContext): Money {
  return zero(ctx.baseCurrency);
}
