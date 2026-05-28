/**
 * Money — currency-aware monetary value.
 *
 * Every monetary field in the data model is a Money, never a raw number.
 * This makes multi-currency support free and rounding errors traceable.
 *
 * Amounts are stored in MAJOR UNITS (dollars, euros) as floats. We accept
 * the small floating-point risk here in exchange for readability. The calc
 * engine rounds at presentation time, not at storage time.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'BRL';

export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

/** Construct a Money value. */
export const money = (amount: number, currency: CurrencyCode = 'USD'): Money => ({
  amount,
  currency,
});

/** Zero in the given currency. Useful for reducers. */
export const zero = (currency: CurrencyCode = 'USD'): Money => ({
  amount: 0,
  currency,
});

/**
 * Add two Money values. Throws if currencies differ.
 * (Multi-currency totaling requires FX conversion via the calc engine.)
 */
export const add = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot add ${a.currency} and ${b.currency} directly — convert via the calc engine first.`,
    );
  }
  return { amount: a.amount + b.amount, currency: a.currency };
};

/** Multiply a Money value by a scalar. */
export const scale = (m: Money, factor: number): Money => ({
  amount: m.amount * factor,
  currency: m.currency,
});
