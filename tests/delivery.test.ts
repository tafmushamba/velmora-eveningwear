import { test } from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../data/products.json';
import { estimateDelivery, catalogueDeliveryWindow } from '../src/delivery';
import { collectionParams } from '../src/catalogue';

test('source lead time plus regional shipping, without dates', () => {
  const fourteen = catalogue.find(p => p.made_to_order && p.lead_time_days === 14)!;
  const twentyOne = catalogue.find(p => p.made_to_order && p.lead_time_days === 21)!;
  const stock = catalogue.find(p => p.in_stock && p.lead_time_days === 3)!;
  assert.deepEqual(estimateDelivery(fourteen,'UK')?.total,{min:17,max:19});
  assert.deepEqual(estimateDelivery(twentyOne,'EU')?.total,{min:26,max:29});
  assert.deepEqual(estimateDelivery(stock,'UK')?.total,{min:6,max:8});
});
test('unavailable pieces never receive an estimate', () => {
  const unavailable = catalogue.filter(p => !p.in_stock && !p.made_to_order);
  assert.ok(unavailable.length);
  for (const p of unavailable) for (const region of ['UK','EU'] as const) assert.equal(estimateDelivery(p,region),null);
});
test('homepage delivery windows use available source records and the selected shipping region', () => {
  assert.deepEqual(catalogueDeliveryWindow(catalogue,'UK',true)?.total,{min:17,max:26});
  assert.deepEqual(catalogueDeliveryWindow(catalogue,'EU',true)?.total,{min:19,max:29});
  assert.deepEqual(catalogueDeliveryWindow(catalogue,'UK',false)?.total,{min:6,max:8});
  assert.deepEqual(catalogueDeliveryWindow(catalogue,'EU',false)?.total,{min:8,max:11});
  const unavailable=catalogue.filter(p=>!p.in_stock&&!p.made_to_order);
  assert.equal(catalogueDeliveryWindow(unavailable,'UK',false),null);
  assert.equal(catalogueDeliveryWindow([],'EU',true),null);
});
test('every available catalogue record receives its own lead time', () => {
  for (const p of catalogue) for (const region of ['UK','EU'] as const) {
    const result=estimateDelivery(p,region);
    if (result) {
      assert.equal(result.preparation,p.lead_time_days);
      assert.equal(result.total.min,result.preparation+result.shipping.min);
      assert.equal(result.total.max,result.preparation+result.shipping.max);
    }
  }
});
test('unsupported query values and product-only state do not become collection filters', () => {
  const result=collectionParams(new URLSearchParams('fabric=imagined&fit=null&region=US&sort=fake&colour=red&id=VLM-008&collection=unsafe&q=+velvet+'));
  assert.equal(result.toString(),'q=velvet');
  const valid=collectionParams(new URLSearchParams('fabric=crepe&fit=draped&region=EU&sort=soonest&size=UK+10'));
  assert.equal(valid.size,5);
});

test('region precedence: explicit valid URL, session, then UK; unavailable storage is safe', async () => {
  const { readRegion } = await import('../src/delivery');
  const saved = new Map<string,string>([['velmora-region','EU']]);
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:(key:string)=>saved.get(key),setItem:(key:string,value:string)=>saved.set(key,value)}});
  Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?region=UK'}});
  assert.equal(readRegion(),'UK');
  assert.equal(saved.get('velmora-region'),'UK');
  Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?region=invalid'}});
  saved.set('velmora-region','EU'); assert.equal(readRegion(),'EU');
  saved.clear(); assert.equal(readRegion(),'UK');
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get(){throw new Error('disabled storage');}});
  assert.equal(readRegion(),'UK');
  delete (globalThis as any).location; delete (globalThis as any).sessionStorage;
});
