/**
 * formatMoney - render a Money or raw number in human-readable form.
 *
 * USD: $1,234,567 (no cents above $100K, two decimals below)
 * Other: EUR 1,234,567
 *
 * For chrome / KPI display only. Detail rows handle their own formatting.
 */

import type { Money, CurrencyCode } from '@/types/money';

const SUPPRESS_CENTS_ABOVE = 100_000;

export function formatMoney(input: Money | number, currency: CurrencyCode = 'USD'): string {
  let amount: number;
  let ccy: CurrencyCode;

  if (typeof input === 'number') {
    amount = input;
    ccy = currency;
  } else {
    amount = input.amount;
    ccy = input.currency;
  }

  const showCents = Math.abs(amount) < SUPPRESS_CENTS_ABOVE;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  if (ccy === 'USD') {
    return `${sign}$${formatted}`;
  }
  return `${sign}${ccy} ${formatted}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
