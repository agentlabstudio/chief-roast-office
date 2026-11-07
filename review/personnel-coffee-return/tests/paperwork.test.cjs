const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync('assets/personnel-office-scene.js', 'utf8');

function page(storage) {
  const created = [];
  const listeners = {};
  const parent = {insertBefore() {}};
  const el = () => ({
    children: [], attrs: {}, dataset: {}, hidden: false, textContent: '', parentNode: parent,
    appendChild(child) { this.children.push(child); }, setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k] || null; }, addEventListener(k, f) { this[k] = f; },
    contains() { return false; }
  });
  const intro = el(), grid = el(), form = el(), paper = el();
  const doc = {
    readyState: 'complete', body: el(),
    querySelector(s) { return s === '.intro' ? intro : s === '.grid' ? grid : null; },
    getElementById(id) { return id === 'review-form' ? form : id === 'paper' ? paper : null; },
    createElement() { const e = el(); created.push(e); return e; },
    addEventListener(name, fn) { listeners[name] = fn; }
  };
  vm.runInNewContext(code, {document: doc, window: {localStorage: storage}, Number, String, Object, Promise});
  const find = name => created.find(e => e.className === name);
  const choice = find('chief-stage__paper-choice');
  return {stack: find('chief-stage__paper-stack'), buttons: choice.children, status: find('chief-stage__paper-status'), listeners};
}

test('paperwork selection changes, survives reload, and leaves older saves intact', () => {
  const data = new Map([['chief-negotiation-term-v1', 'coffee'], ['coffee-progress', 'saved']]);
  const storage = {getItem(k) {return data.get(k) ?? null;}, setItem(k,v) {data.set(k,v);}, removeItem(k) {data.delete(k);}};
  let p = page(storage);
  assert.equal(p.stack.hidden, true);
  p.buttons[1].click();
  assert.equal(p.stack.dataset.location, 'printer');
  assert.equal(p.buttons[1].attrs['aria-pressed'], 'true');
  p = page(storage);
  assert.equal(p.stack.dataset.location, 'printer');
  p.buttons[0].click();
  p = page(storage);
  assert.equal(p.stack.dataset.location, 'chief');
  const event = {detail: {repairCleared: true}};
  p.listeners['chief:local-clear'](event);
  assert.equal(p.stack.hidden, true);
  assert.equal(event.detail.repairCleared, true);
  assert.equal(data.get('chief-negotiation-term-v1'), 'coffee');
  assert.equal(data.get('coffee-progress'), 'saved');
});

test('blocked storage leaves the choice usable and reports the problem', () => {
  const storage = {getItem() {throw Error('blocked');}, setItem() {throw Error('blocked');}};
  const p = page(storage);
  p.buttons[0].click();
  assert.equal(p.stack.dataset.location, 'chief');
  assert.match(p.status.textContent, /could not save/);
});
