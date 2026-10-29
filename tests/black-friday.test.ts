import {test} from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../data/products.json';
import {blackFridayPage,blackFridaySelection,readBlackFridayFilters,blackFridayUrl} from '../src/black-friday';
import type {Product} from '../src/catalogue';

test('campaign selection excludes made-to-order and unavailable pieces and keeps source prices',()=>{
  const original=JSON.stringify(catalogue);
  for(const region of ['UK','EU'] as const){
    const selected=blackFridaySelection(catalogue,region);
    assert.equal(selected.clothing.length,4);
    assert.equal(selected.accessories.length,2);
    for(const piece of [...selected.clothing,...selected.accessories]){
      assert.equal(piece.in_stock,true);
      assert.equal(piece.made_to_order,false);
      assert.equal(piece.price_gbp,catalogue.find(p=>p.id===piece.id)!.price_gbp);
    }
    assert.ok(selected.clothing.every(p=>p.category!=='accessory'));
    assert.ok(selected.accessories.every(p=>p.category==='accessory'));
  }
  assert.equal(JSON.stringify(catalogue),original);
});

test('shorter preparation wins before ID, ties sort by catalogue ID independently of input order',()=>{
  // Isolated test records exercise differing preparation times absent from current stock.
  const source=catalogue.find(p=>p.in_stock && !p.made_to_order && p.category!=='accessory')!;
  const records:Product[]=[
    {...source,id:'VLM-103',lead_time_days:7},
    {...source,id:'VLM-102',lead_time_days:2},
    {...source,id:'VLM-101',lead_time_days:2},
  ];
  for(const region of ['UK','EU'] as const){
    assert.deepEqual(blackFridaySelection(records,region).clothing.map(p=>p.id),['VLM-101','VLM-102','VLM-103']);
  }
  assert.deepEqual(records.map(p=>p.id),['VLM-103','VLM-102','VLM-101']);
});

const fixtureRender=(products:Product[])=>blackFridayPage({
  products,region:'UK',filters:{occasion:null,budget:null,all:false},
  card:product=>`<article>${product.id}</article>`,
  delivery:()=>'<section>Delivery renderer fixture</section>',
  link:updates=>`/collection.html${Object.keys(updates).length?'?'+new URLSearchParams(Object.entries(updates).filter((entry):entry is [string,string]=>entry[1]!==null)).toString():''}`,
  arrow:'',
});

test('empty clothing gets an honest collection action; empty accessories have no section',()=>{
  const page=fixtureRender([]);
  assert.match(page,/Explore the collection/);
  assert.match(page,/No clothing is currently available from stock/);
  assert.doesNotMatch(page,/bf-accessories-heading/);
  assert.match(page,/Explore the wider collection/);
});

test('an accessory-only source retains accessory shopping without claiming clothing is in stock',()=>{
  const page=fixtureRender(catalogue.filter(p=>p.category==='accessory'));
  assert.match(page,/No clothing matches yet/);
  assert.match(page,/bf-accessories-heading/);
  assert.match(page,/VLM-047/);
  assert.match(page,/VLM-048/);
  assert.match(page,/Explore the wider collection/);
});

test('the in-stock action uses a real page anchor and collection shortcut',()=>{
  const page=fixtureRender(catalogue);
  assert.match(page,/href="#in-stock"/);
  assert.match(page,/id="bf-finder"/);
  assert.match(page,/Maximum budget in GBP/);
  assert.match(page,/Show all 7 matching pieces/);
  assert.match(page,/Occasion pieces at their usual prices/);
});

test('occasion and inclusive GBP budget narrow clothing and accessories without fabricating a dress',()=>{
  for(const region of ['UK','EU'] as const) {
    const wedding=blackFridaySelection(catalogue,region,{occasion:'winter wedding',budget:230,all:false});
    assert.deepEqual(wedding.allClothing.map(p=>p.id),['VLM-035']);
    assert.equal(wedding.allClothing[0].category,'top');
    assert.equal(wedding.accessories.length,0);
    assert.equal(blackFridaySelection(catalogue,region,{occasion:'winter wedding',budget:229.99,all:false}).allClothing.length,0);
    const blackTie=blackFridaySelection(catalogue,region,{occasion:'black tie',budget:100,all:false});
    assert.equal(blackTie.allClothing.length,0);
    assert.deepEqual(blackTie.accessories.map(p=>p.id),['VLM-048']);
    const nye=blackFridaySelection(catalogue,region,{occasion:"new year's eve",budget:200,all:false});
    assert.deepEqual(nye.allClothing.map(p=>p.id),['VLM-038','VLM-040']);
  }
});

test('campaign URLs validate source occasions and decimal GBP budgets and retain the region on return',()=>{
  const parsed=readBlackFridayFilters(new URLSearchParams("occasion=winter+wedding&budget=230&all=1"),catalogue);
  assert.deepEqual(parsed,{occasion:'winter wedding',budget:230,all:true});
  assert.equal(blackFridayUrl(parsed,'EU'),'/black-friday.html?region=EU&occasion=winter+wedding&budget=230&all=1');
  for(const raw of ['-1','NaN','Infinity','1e3','3.456','<script>']) {
    assert.equal(readBlackFridayFilters(new URLSearchParams({budget:raw}),catalogue).budget,null);
  }
  assert.equal(readBlackFridayFilters(new URLSearchParams({occasion:'invented'}),catalogue).occasion,null);
  assert.equal(readBlackFridayFilters(new URLSearchParams({budget:'0'}),catalogue).budget,0);
});
