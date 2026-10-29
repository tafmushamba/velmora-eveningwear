import {test} from 'node:test';
import assert from 'node:assert/strict';
import {launcherLift} from '../src/choosing';
const launcher={left:190,right:374,top:780,bottom:828};
test('docks 16px above an intersecting purchase button',()=>{
 const purchase={left:16,right:374,top:790,bottom:840};
 const lift=launcherLift(launcher,purchase,16);
 assert.equal(launcher.bottom-lift,purchase.top-16);
 // The natural rectangle is reused so the next frame retains the same position.
 assert.equal(launcherLift(launcher,purchase,16),lift);
});
test('returns to base placement when the purchase control scrolls clear',()=>{
 for(const purchase of [
  {left:16,right:374,top:700,bottom:750},
  {left:16,right:374,top:850,bottom:900},
  {left:16,right:180,top:790,bottom:840},
 ]) assert.equal(launcherLift(launcher,purchase,16),0);
});
