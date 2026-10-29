import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigationState } from '../src/navigation-state';
const url = (path: string) => new URL(path, 'https://velmora.example');
test('section state survives query order and additional filters without marking another section', () => {
  const current = url('/collection.html?size=10&occasion=winter+wedding&region=EU&category=dress');
  assert.equal(navigationState(url('/collection.html?region=UK&occasion=winter+wedding'), current, 'occasion'), 'true');
  assert.equal(navigationState(url('/collection.html?category=dress'), current, 'category'), 'true');
  assert.equal(navigationState(url('/collection.html?occasion=black+tie'), current, 'occasion'), null);
  assert.equal(navigationState(url('/collection.html'), current), 'page');
  assert.equal(navigationState(url('/collection.html'), current, 'all'), null);
  assert.equal(navigationState(url('/collection.html'), url('/collection.html?region=EU&sort=soonest'), 'all'), 'page');
});
test('product parent context identifies its occasion and category without claiming a collection page', () => {
  const current = url('/product.html?id=VLM-048&collection=occasion%3Dblack%2Btie%26region%3DEU');
  assert.equal(navigationState(url('/collection.html?occasion=black+tie'), current, 'occasion', 'accessory'), 'true');
  assert.equal(navigationState(url('/collection.html?category=accessory'), current, 'category', 'accessory'), 'true');
  assert.equal(navigationState(url('/collection.html'), current), 'true');
});
test('care topic state follows the fragment and never marks another page or origin', () => {
  const current = url('/client-care.html#returns');
  assert.equal(navigationState(url('/client-care.html#returns'), current), 'true');
  assert.equal(navigationState(url('/client-care.html#delivery'), current), null);
  assert.equal(navigationState(url('/studio.html'), current), null);
  assert.equal(navigationState(new URL('https://other.example/client-care.html#returns'), current), null);
});
