import policy from '../data/store-policy.json' with { type: 'json' };
import type { Product } from './catalogue.ts';
export type Region = keyof typeof policy.deliveryDays;
export type DeliveryEstimate = { preparation: number; shipping: { min: number; max: number }; total: { min: number; max: number } };
export const isRegion = (value: unknown): value is Region => value === 'UK' || value === 'EU';
export function estimateDelivery(product: Product, region: Region): DeliveryEstimate | null {
  if (!product.made_to_order && !product.in_stock) return null;
  const shipping = policy.deliveryDays[region];
  return { preparation: product.lead_time_days, shipping, total: { min: product.lead_time_days + shipping.min, max: product.lead_time_days + shipping.max } };
}
/** A catalogue-wide range is guidance; each product keeps its own exact lead time. */
export function catalogueDeliveryWindow(products: Product[], region: Region, madeToOrder: boolean) {
  const estimates = products.filter(p => p.made_to_order === madeToOrder)
    .flatMap(p => { const estimate = estimateDelivery(p, region); return estimate ? [estimate] : []; });
  if (!estimates.length) return null;
  return {
    preparation: { min: Math.min(...estimates.map(e => e.preparation)), max: Math.max(...estimates.map(e => e.preparation)) },
    shipping: policy.deliveryDays[region],
    total: { min: Math.min(...estimates.map(e => e.total.min)), max: Math.max(...estimates.map(e => e.total.max)) },
  };
}
export function readRegion(): Region {
  const query = new URLSearchParams(location.search).get('region');
  if (isRegion(query)) { saveRegion(query); return query; }
  try { const saved = sessionStorage.getItem('velmora-region'); if (isRegion(saved)) return saved; } catch { /* URL and default remain usable without storage. */ }
  return 'UK';
}
export function saveRegion(region: Region) {
  try { sessionStorage.setItem('velmora-region', region); } catch { /* URL retains selection when storage is unavailable. */ }
}
export const regionSelector = (region: Region, compact = false) => `<label class="region-selector">Deliver to<select id="delivery-region" name="region"><option value="UK" ${region === 'UK' ? 'selected' : ''}>${compact ? 'UK' : 'United Kingdom'}</option><option value="EU" ${region === 'EU' ? 'selected' : ''}>${compact ? 'EU' : 'European Union'}</option></select></label>`;
type DayRange = { min: number; max: number };
const dayRange = (days: number | DayRange) => typeof days === 'number' ? String(days) : days.min === days.max ? String(days.min) : `${days.min}–${days.max}`;
export function formatDeliverySummary(total: DayRange, region: Region): string {
  return `Estimated ${region} delivery: ${dayRange(total)} days`;
}
export function formatDeliveryBreakdown(preparation: number | DayRange, shipping: DayRange, madeToOrder: boolean): string {
  const preparationCopy = madeToOrder ? 'to make the piece' : 'of preparation';
  return `Includes ${dayRange(preparation)} days ${preparationCopy} and ${dayRange(shipping)} days of shipping.`;
}
export function deliverySummary(product: Product, region: Region) {
  const estimate = estimateDelivery(product, region);
  return estimate ? formatDeliverySummary(estimate.total, region) : 'Currently unavailable';
}
export function deliveryBreakdown(product: Product, region: Region) {
  const estimate = estimateDelivery(product, region);
  return estimate ? formatDeliveryBreakdown(estimate.preparation, estimate.shipping, product.made_to_order) : 'No delivery estimate available.';
}
