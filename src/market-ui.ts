import policy from '../data/store-policy.json';
import { escape } from './catalogue';
import { readRegion, type Region } from './delivery';
import { fetchExchangeRate, formatPrice, sizeLabel, displayRegion, type ExchangeRate } from './market';

let rate: ExchangeRate | null = null;
let pending: Promise<void> | null = null;
let status: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
const regionAttribute = (region?:Region) => region ? ` data-display-region="${region}"` : '';
export const priceMarkup = (gbp: number, region?:Region) =>
  `<span data-price-gbp="${gbp}"${regionAttribute(region)}>${formatPrice(gbp, region??readRegion(), rate)}</span>`;
export const subtotalMarkup = (gbp: number[], region?:Region) =>
  `<span data-price-items="${gbp.join(',')}"${regionAttribute(region)}>${formatPrice(gbp, region??readRegion(), rate)}</span>`;
export const sizeMarkup = (uk: string, region?:Region) =>
  `<span data-size-uk="${escape(uk)}"${regionAttribute(region)}>${escape(sizeLabel(uk, region??readRegion()))}</span>`;
export const pricingNote = (region?:Region) => `<p class="market-note" data-pricing-note${regionAttribute(region)} role="status"></p>`;
export const sizeReferenceNote = (region?:Region) => `<p class="market-note" data-size-reference${regionAttribute(region)} ${(region??readRegion()) === 'EU' ? '' : 'hidden'}>${escape(policy.sizeReference.note)}</p>`;
export function marketSelector(id: string) {
  const region = readRegion();
  return `<label class="market-selector" for="${id}">Shopping region<select id="${id}" data-market-region><option value="UK" ${region === 'UK' ? 'selected' : ''}>UK · GBP · UK sizes</option><option value="EU" ${region === 'EU' ? 'selected' : ''}>EU · EUR estimate · EU sizes</option></select></label>`;
}
function paintMarket(region: Region) {
  document.querySelectorAll<HTMLElement>('[data-price-gbp]').forEach(el => {
    el.textContent = formatPrice(Number(el.dataset.priceGbp), displayRegion(el.dataset.displayRegion,region), rate);
  });
  document.querySelectorAll<HTMLElement>('[data-price-items]').forEach(el => {
    el.textContent = formatPrice(el.dataset.priceItems!.split(',').map(Number), displayRegion(el.dataset.displayRegion,region), rate);
  });
  document.querySelectorAll<HTMLElement>('[data-size-uk]').forEach(el => {
    el.textContent = sizeLabel(el.dataset.sizeUk!, displayRegion(el.dataset.displayRegion,region));
  });
  document.querySelectorAll<HTMLElement>('[data-size-reference]').forEach(el => { el.hidden = displayRegion(el.dataset.displayRegion,region) !== 'EU'; });
  document.querySelectorAll<HTMLSelectElement>('#delivery-region, [data-market-region]').forEach(el => { el.value = region; });
  document.querySelectorAll<HTMLElement>('[data-pricing-note]').forEach(el => {
  const selected=displayRegion(el.dataset.displayRegion,region);
  const note = selected === 'UK' ? 'Prices in GBP.' : rate
    ? `Euro estimates from GBP prices. Rate dated ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${rate.date}T00:00:00Z`))}.`
    : status === 'failed' ? 'Euro conversion is unavailable. Prices are shown in GBP.'
    : 'Prices in GBP while the euro reference rate loads.';
  el.textContent = note;
  });
}
/** One rate request per page. A recommendation may need EU rates without changing page region. */
export async function updateMarket(region = readRegion()) {
  paintMarket(readRegion());
  if (region !== 'EU' || rate) return;
  if (!pending) {
    status = 'loading';
    pending = fetchExchangeRate().then(value => { rate = value; status = 'ready'; })
      .catch(() => { status = 'failed'; });
  }
  await pending;
  // The shopper may have changed back to UK while the rate was loading.
  paintMarket(readRegion());
}
