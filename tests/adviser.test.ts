import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advise, handleAdvice, matchingProducts, validateCandidate, makeReply, AdviserError, type Generator } from '../server/adviser';
import { defaultPreferences, type Candidate, type AdviserRequest } from '../shared/adviser';
const request:AdviserRequest={message:'Show me a piece',preferences:{...defaultPreferences},currentProductId:null,previousProductIds:[],history:[]};
const good:Candidate={intent:'recommend',reply:'Here are a few pieces to explore.',preferences:{...defaultPreferences},productIds:['VLM-001'],notices:[],unsupported:[]};
test('rejects invented, duplicate, unavailable and preference-violating IDs',()=>{
 for(const productIds of [['invented'],['VLM-021'],['VLM-001','VLM-001']])assert.ok(validateCandidate({...good,productIds}).length);
 for(const preference of [{budget:1},{colour:'black'},{size:'one size'}])assert.ok(validateCandidate({...good,preferences:{...defaultPreferences,...preference}}).length);
 assert.ok(validateCandidate({...good,unsupported:['waterproof']}).length);
});
test('repair receives errors, only a verified second candidate is returned',async()=>{
 const errors:string[][]=[];
 const result=await advise(request,async(_,e)=>{errors.push(e);return errors.length===1?{...good,productIds:['fake']}:good;},'offline-repair',new AbortController().signal);
 assert.deepEqual(result.productIds,['VLM-001']);assert.equal(errors.length,2);assert.match(errors[1][0],/does not exist/);
});
test('two failed candidates stop without fabricated recommendations',async()=>{
 let attempts=0;
 await assert.rejects(advise(request,async()=>{attempts++;return {...good,productIds:['fake']};},'offline-reject',new AbortController().signal),e=>e instanceof AdviserError&&e.code==='validation_failed');
 assert.equal(attempts,2);
});
test('provider failure is not silently retried or converted to filter results',async()=>{
 let attempts=0;await assert.rejects(advise(request,async()=>{attempts++;throw new Error('offline failure');},'offline-fail',new AbortController().signal));assert.equal(attempts,1);
});
test('no matches and unknown requirements stay explicit; accessories use real catalogue',()=>{
 const noMatch={...good,reply:'Nothing matches that budget. Would you like to change it?',preferences:{...defaultPreferences,budget:1},productIds:[]};assert.deepEqual(validateCandidate(noMatch),[]);assert.equal(makeReply(noMatch,'test').reply,noMatch.reply);
 assert.deepEqual(matchingProducts({...defaultPreferences,category:'accessory',size:'one size'}).map(p=>p.id),['VLM-047','VLM-048']);
 const answer={...good,intent:'answer' as const,productIds:[],reply:'The clutch is one size. I don’t have its dimensions, so I can’t confirm whether your phone fits.'};
 assert.deepEqual(validateCandidate(answer),[]);assert.equal(makeReply(answer,'test').reply,answer.reply);

});
test('request boundary rejects malformed, oversized and cross-origin requests',async()=>{
 const handler=(body:string,headers:Record<string,string>={'Content-Type':'application/json'})=>handleAdvice(new Request('http://localhost/api/adviser',{method:'POST',headers,body}),{},async()=>good);
 assert.equal((await handler('{}')).status,400);
 assert.equal((await handler(JSON.stringify({...request,preferences:{...defaultPreferences,region:'USA'}}))).status,400);
 assert.equal((await handler('x'.repeat(12001))).status,413);
 assert.equal((await handler(JSON.stringify(request),{'Content-Type':'application/json',Origin:'https://other.example'})).status,403);
 assert.equal((await handleAdvice(new Request('http://localhost/api/adviser'),{})).status,405);
});
test('missing credentials return an honest unavailable response',async()=>{
 const response=await handleAdvice(new Request('http://localhost/api/adviser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)}),{});
 assert.equal(response.status,503);assert.match((await response.json()).error,/unavailable/);
});
test('cheapest and soonest ordering comes from all eligible catalogue records',()=>{
 for(const sort of ['cheaper','soonest'] as const){
  const preferences={...defaultPreferences,sort};
  const expected=matchingProducts(preferences).sort((a,b)=>sort==='cheaper'?a.price_gbp-b.price_gbp:a.lead_time_days-b.lead_time_days).slice(0,3).map(p=>p.id);
  assert.deepEqual(makeReply({...good,preferences},'ordering').productIds,expected);
 }
});

test('greetings and direct answers do not force cards or stock filter copy',async()=>{
 for(const intent of ['chat','answer','clarify'] as const){
  const output={...good,intent,productIds:[],reply:'What do you have in mind?'};
  const result=await advise(request,async()=>output,'conversation',new AbortController().signal);
  assert.equal(result.reply,output.reply);assert.deepEqual(result.productIds,[]);
  assert.ok(validateCandidate({...output,productIds:['VLM-001']}).length);
 }
});
test('both sides of the conversation reach generation and review; unsupported prose is repaired',async()=>{
 const contextual={...request,currentProductId:'VLM-048',history:[{role:'assistant' as const,message:'Where should it be delivered?'},{role:'user' as const,message:'The EU'}],message:'How long would that take?'};
 let generation=0,reviews=0;
 const generate:Generator=async(r,errors)=>{
  assert.deepEqual(r.history,contextual.history);generation++;
  if(generation===2)assert.match(errors[0],/guarantee/);
  return {...good,intent:'answer',productIds:[],reply:generation===1?'Guaranteed tomorrow.':'The total estimate is 8–11 days for EU delivery.'};
 };
 generate.review=async(r,c)=>{assert.equal(r.currentProductId,'VLM-048');reviews++;return c.reply.includes('Guaranteed')?['Remove the unsupported arrival guarantee.']:[];};
 const result=await advise(contextual,generate,'prose-repair',new AbortController().signal);
 assert.equal(generation,2);assert.equal(reviews,2);assert.match(result.reply,/8–11/);
});
test('prose rejected twice and failed review never reach the shopper',async()=>{
 const generate:Generator=async()=>good;generate.review=async()=>['Unsupported product property.'];
 await assert.rejects(advise(request,generate,'review-reject',new AbortController().signal),e=>e instanceof AdviserError&&e.code==='validation_failed');
 generate.review=async()=>{throw new Error('review unavailable');};
 await assert.rejects(advise(request,generate,'review-fail',new AbortController().signal),/review unavailable/);
});
