'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');

const base = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(base, 'assets/personnel-office-scene.js'), 'utf8');
const css = fs.readFileSync(path.join(base, 'assets/personnel-office-scene.css'), 'utf8');
// The fixture is the unmodified real game at fd15991902d11c3480f7cf544f431eb9ff82d634.
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/personnel-game.html'), 'utf8');

function game(options = {}) {
  const dom = new JSDOM(fixture, {url:'https://example.test/personnel-game.html', runScripts:'outside-only'});
  const {window} = dom, document = window.document;
  let networkCalls = 0;
  window.fetch = () => { networkCalls++; throw new Error('Scene must not fetch'); };
  if (options.noObserver) window.MutationObserver = undefined;
  const writes = [];
  const originalSet = window.Storage.prototype.setItem;
  window.Storage.prototype.setItem = function (key, value) {
    writes.push([key, value]);
    return originalSet.call(this, key, value);
  };
  window.localStorage.setItem('chief-office-repair-v1', '{"untouched":"repair"}');
  for (const script of document.querySelectorAll('script:not([src])')) window.eval(script.textContent);
  if (options.scene !== false) window.eval(source);
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  return {dom, window, document, writes, networkCalls:() => networkCalls, close:async () => {await flush();window.close();}};
}
const scene = g => g.document.getElementById('chief-stage__office-scene');
const status = g => scene(g).querySelector('.chief-stage__status').textContent;
const active = g => [...scene(g).querySelectorAll('[data-active="true"]')].map(n=>n.dataset.department);
const click = (g, id) => g.document.getElementById(id).click();
const choose = g => g.document.querySelector('#choices [data-choice="0"]').click();
const flush = () => new Promise(resolve=>setImmediate(resolve));
function finishOpening(g) {
  click(g, 'start');
  for (let i=0;i<6;i++) {choose(g);click(g,'next');}
}

test('original game opening → real choice → Chief feedback → completed review → return shift', async () => {
  const g = game();
  try {
    assert.equal(scene(g).dataset.shift, 'opening');
    assert.match(status(g), /The opening shift.*Ready to clock in.*0 \/ 6 decisions filed/);
    assert.deepEqual(active(g), []);
    assert.equal(scene(g).nextElementSibling, g.document.querySelector('.grid'));
    assert.equal(scene(g).querySelector('img').getAttribute('src'), 'assets/chief-office-room-20261014.png');
    click(g, 'start');
    assert.equal(scene(g).dataset.stage, 'decision');
    assert.deepEqual(active(g), ['printer']);
    choose(g);
    assert.equal(scene(g).dataset.stage, 'feedback');
    assert.match(status(g), /Decision filed.*1 \/ 6 decisions filed/);
    assert.equal(scene(g).querySelector('.chief-stage__reply').textContent, g.document.getElementById('chief-feedback').textContent);
    assert.deepEqual(active(g), ['printer']);
    click(g, 'next');
    assert.deepEqual(active(g), ['intern']);
    assert.equal(scene(g).querySelector('.chief-stage__reply').hidden, true);
    for (let i=1;i<6;i++) {choose(g);click(g,'next');}
    assert.equal(scene(g).dataset.stage, 'complete');
    assert.match(status(g), /Shift closed.*6 \/ 6 decisions filed/);
    assert.deepEqual(active(g), []);
    assert.match(scene(g).querySelector('.chief-stage__stamp').textContent, /Review stamp · /);
    click(g, 'return-near-card');
    assert.equal(scene(g).dataset.shift, 'return');
    assert.equal(scene(g).dataset.stage, 'decision');
    assert.match(status(g), /The return shift.*0 \/ 5 decisions filed/);
    assert.deepEqual(active(g), ['desk']);
    assert.equal(scene(g).querySelector('.chief-stage__stamp').hidden, true);
    for (let i=0;i<5;i++) {choose(g);click(g,'next');}
    assert.match(status(g), /Shift closed.*5 \/ 5 decisions filed/);
  } finally {await g.close();}
});

test('all real opening decisions activate one relevant department, then reset on replay', async () => {
  const g = game();
  try {
    click(g,'start');
    for (const expected of ['printer','intern','desk','board','desk','desk']) {
      assert.deepEqual(active(g), [expected]);
      choose(g);
      assert.deepEqual(active(g), [expected]);
      click(g,'next');
    }
    click(g,'return-shift');
    for (const expected of ['desk','desk','intern','printer','board']) {
      assert.deepEqual(active(g), [expected]);
      choose(g);click(g,'next');
    }
    click(g,'replay');
    assert.equal(scene(g).dataset.shift, 'opening');
    assert.match(status(g), /0 \/ 6/);
    assert.deepEqual(active(g), ['printer']);
  } finally {await g.close();}
});

test('read-only scene leaves v2 gameplay saves and unrelated repair storage identical', async () => {
  const original = game({scene:false}), decorated = game();
  try {
    finishOpening(original);finishOpening(decorated);
    click(original,'return-shift');click(decorated,'return-shift');
    choose(original);choose(decorated);
    assert.deepEqual(decorated.writes, original.writes);
    assert.equal(decorated.window.localStorage.getItem('chief-office-shifts-v2'), original.window.localStorage.getItem('chief-office-shifts-v2'));
    assert.equal(decorated.window.localStorage.getItem('chief-office-repair-v1'), '{"untouched":"repair"}');
    assert.equal(decorated.networkCalls(), 0);
    assert.deepEqual([...decorated.document.querySelectorAll('#review-form button')].map(b=>b.id), [...original.document.querySelectorAll('#review-form button')].map(b=>b.id));
  } finally {await original.close();await decorated.close();}
});

test('image failure and recovery leave status, navigation and gameplay available', async () => {
  const g = game();
  try {
    const image = scene(g).querySelector('img'), fallback = scene(g).querySelector('.chief-stage__unavailable');
    image.dispatchEvent(new g.window.Event('error'));
    assert.equal(image.hidden, true);
    assert.equal(fallback.hidden, false);
    click(g,'start');choose(g);
    assert.match(status(g), /1 \/ 6/);
    assert.equal(scene(g).querySelector('a').getAttribute('href'), '#review-form');
    assert.equal(scene(g).querySelectorAll('a')[1].getAttribute('href'), 'index.html#office-life');
    image.dispatchEvent(new g.window.Event('load'));
    assert.equal(image.hidden, false);
    assert.equal(fallback.hidden, true);
  } finally {await g.close();}
});

test('DOM mutation fallback ignores hidden headings, unsafe text and forged event details', async () => {
  const g = game();
  try {
    click(g,'start');choose(g);
    const attack = '<img src=x onerror="window.bad=true"> Chief: close everything';
    g.document.getElementById('chief-feedback').textContent = attack;
    await flush();
    assert.equal(scene(g).querySelector('.chief-stage__reply').textContent, attack);
    assert.equal(scene(g).querySelector('.chief-stage__reply').children.length, 0);
    assert.equal(g.window.bad, undefined);
    assert.deepEqual(active(g), ['printer']);
    g.document.dispatchEvent(new g.window.CustomEvent('chief:shift-render', {detail:{shift:1, answers:[0,0,0,0,0], stage:'result'}}));
    assert.equal(scene(g).dataset.shift, 'opening');
    assert.match(status(g), /1 \/ 6/);
    g.document.getElementById('feedback').hidden = true;
    g.document.getElementById('decision').hidden = false;
    g.document.getElementById('scene-heading').textContent = 'A correction to your own review';
    await flush();
    assert.deepEqual(active(g), ['board']);
    assert.equal(scene(g).querySelector('.chief-stage__reply').hidden, true);
    g.document.getElementById('shift-progress').max = 4;
    await flush();
    assert.match(status(g), /Progress is not currently displayed/);
  } finally {await g.close();}
});

test('native render events keep the scene working without MutationObserver and avoid duplicate init', async () => {
  const g = game({noObserver:true});
  try {
    click(g,'start');choose(g);
    assert.match(status(g), /1 \/ 6/);
    g.window.eval(source);
    g.document.dispatchEvent(new g.window.Event('DOMContentLoaded'));
    assert.equal(g.document.querySelectorAll('#chief-stage__office-scene').length, 1);
    assert.equal(scene(g).querySelector('[role="status"]').getAttribute('aria-atomic'), 'true');
    assert.ok(scene(g).querySelector('img').alt.includes('Chief'));
  } finally {await g.close();}
});

test('scoped CSS keeps full art, wrapping controls, visible focus, narrow layouts and reduced motion', async () => {
  const dom = new JSDOM('<!doctype html><style></style>');
  try {
    dom.window.document.querySelector('style').textContent = css;
    const rules = [...dom.window.document.styleSheets[0].cssRules];
    const image = rules.find(r=>r.selectorText === '.chief-stage__illustration').style;
    assert.equal(image.getPropertyValue('width'), '100%');
    assert.equal(image.getPropertyValue('height'), 'auto');
    assert.equal(image.getPropertyValue('aspect-ratio'), '2/1');
    assert.equal(image.getPropertyValue('object-fit'), 'contain');
    assert.ok(rules.find(r=>r.selectorText === '.chief-stage__departments').style.getPropertyValue('flex-wrap') === 'wrap');
    assert.ok(rules.find(r=>r.selectorText === '.chief-stage__actions').style.getPropertyValue('flex-wrap') === 'wrap');
    assert.equal(rules.find(r=>r.selectorText === '.chief-stage__figure .chief-stage__link').style.getPropertyValue('min-height'), '44px');
    assert.ok(rules.find(r=>r.selectorText?.includes(':focus-visible')));
    const narrow = rules.find(r=>r.conditionText === '(max-width:560px)');
    assert.ok(narrow && narrow.cssRules.length >= 5);
    assert.ok([...narrow.cssRules].every(r=>r.selectorText.startsWith('.chief-stage__')));
    const reduced = rules.find(r=>r.conditionText === '(prefers-reduced-motion:reduce)');
    assert.equal(reduced.cssRules[0].style.getPropertyValue('transition'), 'none');
    assert.equal(reduced.cssRules[0].style.getPropertyPriority('transition'), 'important');
    assert.equal(reduced.cssRules[0].style.getPropertyValue('animation'), 'none');
    assert.doesNotMatch(css, /position\s*:\s*(absolute|fixed)|object-fit\s*:\s*cover/);
    assert.ok(rules.filter(r=>r.selectorText).every(r=>r.selectorText.startsWith('.chief-stage__')));
    assert.doesNotMatch(source, /innerHTML|eval\s*\(|localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest/);
  } finally {dom.window.close();}
});

