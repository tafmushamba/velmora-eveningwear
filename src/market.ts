import { z } from 'zod';
import policy from '../data/store-policy.json';
import {isRegion, type Region} from './delivery';

const rateSchema = z.object({
  date: z.iso.date(), base: z.literal('GBP'), quote: z.literal('EUR'),
  rate: z.number().finite().positive(),
});
export type ExchangeRate = z.infer<typeof rateSchema>;
export function parseExchangeRate(value: unknown, now = new Date()): ExchangeRate {
  const result = rateSchema.parse(value);
  const age = Math.floor(now.getTime() / 86400000) - Date.parse(result.date) / 86400000;
  if (age < 0 || age > policy.pricing.maxRateAgeDays) throw new Error('Exchange rate is outside the allowed date range.');
  return result;
}
// Convert finite decimal inputs to a rational before rounding money. Multiplying
// floating-point numbers first can round half-cent values the wrong way.
function decimalRatio(value: number): [bigint, bigint] {
  const [decimal, exponent = '0'] = value.toString().split('e');
  const places = (decimal.split('.')[1]?.length ?? 0) - Number(exponent);
  const numerator = BigInt(decimal.replace('.', ''));
  return places >= 0 ? [numerator, 10n ** BigInt(places)] : [numerator * 10n ** BigInt(-places), 1n];
}
function referenceMinorUnits(amount: number, exchange: number) {
  const [a, b] = decimalRatio(amount);
  const [c, d] = decimalRatio(exchange);
  const numerator = a * c * 100n, denominator = b * d;
  return (numerator * 2n + denominator) / (denominator * 2n);
}
export function formatPrice(gbp: number | number[], region: Region, rate: ExchangeRate | null) {
  const euros = region === 'EU' && rate !== null;
  const items = Array.isArray(gbp) ? gbp : [gbp];
  const amount = Number(items.reduce((total, item) => total + referenceMinorUnits(item, euros ? rate.rate : 1), 0n)) / 100;
  return `${euros ? 'Approx. ' : ''}${new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: euros ? 'EUR' : 'GBP',
    minimumFractionDigits: euros ? 2 : 0, maximumFractionDigits: 2,
  }).format(amount)}`;
}
export function sizeLabel(uk: string, region: Region) {
  const reference = (policy.sizeReference.ukToEu as Record<string, string>)[uk];
  return region === 'EU' && reference ? `${reference} / ${uk}` : uk;
}
export async function fetchExchangeRate(request: typeof fetch = fetch): Promise<ExchangeRate> {
  const response = await request(policy.pricing.rateUrl, {
    credentials: 'omit', referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(policy.pricing.requestTimeoutMs),
  });
  if (!response.ok) throw new Error('Exchange rate is unavailable.');
  return parseExchangeRate(await response.json());
}

/** Explicit recommendation regions survive storefront region/rate refreshes. */
export const displayRegion = (value: unknown, pageRegion: Region): Region => isRegion(value) ? value : pageRegion;
