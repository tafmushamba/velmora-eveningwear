import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPieces, daysUntil } from '../src/choosing';

test('matching respects occasion, exact sizes, budget and availability', () => {
 const results=findPieces({occasion:'winter wedding',size:'UK 10',budget:400,region:'UK'},'VLM-008');
 assert.ok(results.length);
 assert.equal(results[0].id,'VLM-008');
 for (const p of results) { assert.ok(p.occasions.includes('winter wedding')); assert.ok(p.sizes.includes('UK 10')); assert.ok(p.price_gbp<=400); assert.ok(p.in_stock||p.made_to_order); }
 assert.equal(findPieces({occasion:'winter wedding',size:'UK 10',budget:1,region:'UK'},'VLM-008').length,0);
});
test('a considered product outside preferences is excluded', () => {
 assert.ok(!findPieces({occasion:'winter wedding',size:'UK 10',budget:100,region:'EU'},'VLM-008').some(p=>p.id==='VLM-008'));
});
test('date comparison handles calendar days and rejects invalid dates without predicting arrival', () => {
 assert.equal(daysUntil('2026-12-18','2026-10-29'),50);
 assert.equal(daysUntil('2026-10-29','2026-10-29'),0);
 assert.equal(daysUntil('2026-10-28','2026-10-29'),-1);
 assert.equal(daysUntil('2026-02-30','2026-01-01'),null);
 assert.equal(daysUntil('invalid','2026-01-01'),null);
 assert.equal(daysUntil('2026-03-30','2026-03-28'),2);
});
