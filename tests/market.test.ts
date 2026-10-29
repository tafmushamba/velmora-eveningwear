import { test } from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../data/products.json';
import { sizeLabel, formatPrice, parseExchangeRate, fetchExchangeRate } from '../src/market';
const now = new Date('2026-10-29T12:00:00Z');
const fixture = {date: '2026-10-29', base: 'GBP', quote: 'EUR', rate: 1.2};
test('reference pricing preserves GBP, applies the validated rate and labels EUR approximate', () => {
  const rate = parseExchangeRate(fixture, now);
  assert.equal(formatPrice(90, 'EU', rate), 'Approx. €108.00');
  assert.equal(formatPrice(90, 'UK', rate), '£90');
  assert.equal(formatPrice(90, 'EU', null), '£90');
  assert.equal(formatPrice([60, 90], 'EU', rate), 'Approx. €180.00');
  assert.equal(formatPrice([350, 350], 'EU', {...rate,rate:1.1965}), 'Approx. €837.56');
  assert.equal(formatPrice(90, 'EU', {...rate,rate:1.1965}), 'Approx. €107.69');
  assert.equal(formatPrice(310, 'EU', {...rate,rate:1.1965}), 'Approx. €370.92');
});
test('rejects inverted, missing, invalid, future and stale reference rates', () => {
  for (const value of [null, {}, {...fixture,base:'EUR',quote:'GBP'}, {...fixture,rate:0}, {...fixture,rate:-1}, {...fixture,rate:NaN}, {...fixture,date:'2026-02-30'}, {...fixture,date:'2026-10-30'}, {...fixture,date:'2026-10-21'}]) {
    assert.throws(() => parseExchangeRate(value, now));
  }
  assert.equal(parseExchangeRate({...fixture,date:'2026-10-26'}, now).rate,1.2);
});
test('every supplied clothing size has an EU reference without changing canonical option values', () => {
  for (const product of catalogue) for (const size of product.sizes) {
    assert.equal(sizeLabel(size,'UK'),size);
    if (size === 'one size') assert.equal(sizeLabel(size,'EU'),'one size');
    else assert.match(sizeLabel(size,'EU'), /^EU \d+ \/ UK \d+$/);
  }
  assert.equal(sizeLabel('UK 8','EU'),'EU 36 / UK 8');
  assert.equal(sizeLabel('unknown','EU'),'unknown');
});
test('failed exchange service never fabricates a conversion', async () => {
  await assert.rejects(fetchExchangeRate(async () => new Response('Unavailable',{status:503})));
  await assert.rejects(fetchExchangeRate(async () => new Response(JSON.stringify({...fixture,rate:'1.2'}))));
  await assert.rejects(fetchExchangeRate(async () => { throw new Error('offline'); }));
});

test('recommendation display regions stay explicit while the page region changes', async () => {
 const {displayRegion}=await import('../src/market');
 const {priceMarkup,sizeMarkup,pricingNote}=await import('../src/market-ui');
 assert.equal(displayRegion('EU','UK'),'EU');
 assert.equal(displayRegion('UK','EU'),'UK');
 assert.equal(displayRegion(undefined,'EU'),'EU');
 assert.equal(displayRegion('France','UK'),'UK');
 assert.match(priceMarkup(90,'EU'),/data-display-region="EU"/);
 assert.match(sizeMarkup('UK 8','EU'),/EU 36 \/ UK 8/);
 assert.match(sizeMarkup('UK 8','EU'),/data-display-region="EU"/);
 assert.match(pricingNote('UK'),/data-display-region="UK"/);
});
