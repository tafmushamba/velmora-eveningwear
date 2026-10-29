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
export const regionSelector = (region: Region) => `<label class="region-selector">Deliver to<select id="delivery-region" name="region"><option value="UK" ${region === 'UK' ? 'selected' : ''}>United Kingdom</option><option value="EU" ${region === 'EU' ? 'selected' : ''}>European Union</option></select></label>`;
export function deliverySummary(product: Product, region: Region) {
  const estimate = estimateDelivery(product, region);
  return estimate ? `Estimated ${region} delivery: ${estimate.total.min}–${estimate.total.max} days total` : 'Currently unavailable';
}
export function deliveryBreakdown(product: Product, region: Region) {
  const estimate = estimateDelivery(product, region);
  return estimate ? `${estimate.preparation} days ${product.made_to_order ? 'to make' : 'before dispatch'}, then ${estimate.shipping.min}–${estimate.shipping.max} days for delivery.` : 'No delivery estimate available.';
}
