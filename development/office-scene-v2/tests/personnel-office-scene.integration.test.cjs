'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, ResourceLoader, VirtualConsole} = require('jsdom');

// Execute the actual page, inline gameplay and external defer scripts together.
// All resources come from local source files; fetch is a deterministic local stub.
// This checks DOM/script behavior, not browser rendering, image decoding or layout.
const root = path.resolve(__dirname, '../../..');
const html = fs.readFileSync(path.join(root, 'personnel-game.html'), 'utf8');
const resources = [
  'assets/office-signals.css', 'assets/office-signals.js',
  'assets/personnel-office-scene.css', 'assets/personnel-office-scene.js',
  'assets/personnel-repair.css', 'assets/personnel-repair-model.js', 'assets/personnel-repair.js'
];
const gameKey = 'chief-office-shifts-v2', repairKey = 'chief-office-repair-v1';
const flush = () => new Promise(resolve => setImmediate(resolve));

async function assembled(options = {}) {
  const loaded = [], blocked = [], errors = [], calls = [];
  class LocalResources extends ResourceLoader {
    fetch(url) {
      const parsed = new URL(url), relative = parsed.pathname.slice(1);
      if (parsed.origin !== 'https://example.test' || !resources.includes(relative)) {
        blocked.push(parsed.pathname);
        return null;
      }
      loaded.push(relative);
      return Promise.resolve(fs.readFileSync(path.join(root, relative)));
    }
  }
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: 'https://example.test/personnel-game.html',
    runScripts: 'dangerously', resources: new LocalResources(), virtualConsole,
    beforeParse(window) {
      if (options.deniedStorage) {
        for (const name of ['localStorage', 'sessionStorage']) {
          Object.defineProperty(window, name, {get() {throw new window.DOMException('Storage denied', 'SecurityError');}});
        }
      } else {
        for (const [key, value] of Object.entries(options.local || {})) window.localStorage.setItem(key, value);
        for (const [key, value] of Object.entries(options.session || {})) window.sessionStorage.setItem(key, value);
      }
      window.fetch = async (_url, request) => {
        const payload = JSON.parse(request.body);
        calls.push(payload);
        return {ok:true, json:async () => ({
          ok:true, counted:true, feedback_saved:payload.action === 'feedback',
          stats:{started_at:'2026-10-14', checked_at:'2026-10-15T08:00:00Z',
            office_total:4, game_total:3, feedback_total:2, office_today:2, game_today:1, feedback_today:1}
        })};
      };
    }
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local assembled page did not load')), 5000);
    dom.window.addEventListener('load', () => {clearTimeout(timer);resolve();}, {once:true});
  });
  await flush();
  const document = dom.window.document;
  assert.deepEqual(errors, [], 'actual assembled scripts must initialize without errors');
  assert.deepEqual(blocked, [], 'resource loader never permits remote or unknown resources');
  assert.deepEqual(loaded, resources, 'the real page requests the complete current external asset list');
  assert.equal(document.querySelectorAll('#chief-stage__office-scene').length, 1);
  assert.equal(document.getElementById('chief-stage__office-scene').dataset.chiefStage, 'personnel-office-v2');
  assert.equal(document.querySelectorAll('#repair-desk').length, 1);
  assert.equal(document.querySelectorAll('[data-chief-signals]').length, 1);
  return {dom, window:dom.window, document, calls, errors, close:async () => {await flush();dom.window.close();}};
}
const node = (g, id) => g.document.getElementById(id);
const scene = g => node(g, 'chief-stage__office-scene');
const shiftLink = g => scene(g).querySelector('.chief-stage__link');
function click(g, id) {node(g, id).click();}
function finishShift(g, count) {
  for (let i=0; i<count; i++) {
    g.document.querySelector('#choices [data-choice="0"]').click();
    assert.equal(scene(g).dataset.stage, 'feedback');
    assert.equal(shiftLink(g).getAttribute('href'), '#review-form');
    click(g, 'next');
  }
  assert.equal(scene(g).dataset.stage, 'complete');
  assert.equal(shiftLink(g).getAttribute('href'), '#paper');
}
function finishRepair(g) {
  const panel = node(g, 'repair-desk');
  assert.equal(panel.hidden, false);
  panel.querySelector('.primary').click();
  for (const choice of ['inspect', 'small', 'bench', 'receipt']) {
    const button = panel.querySelector('[data-repair-choice="'+choice+'"]');
    assert.ok(button, 'repair choice '+choice+' is present');
    assert.equal(button.disabled, false, 'repair choice '+choice+' is available');
    button.click();
    panel.querySelector('.primary').click();
  }
  assert.equal(panel.querySelector('.repair__stamp').textContent, 'REPAIR VERIFIED');
}
function saved(storage) {return Object.fromEntries(Array.from({length:storage.length}, (_,i) => {
  const key = storage.key(i);return [key, storage.getItem(key)];
}));}

test('actual assembled page: opening, repair, return, isolated feedback and preserved reload', async () => {
  const g = await assembled({local:{'unrelated-office-key':'leave this alone'}});
  let reopened;
  try {
    assert.deepEqual(g.calls.map(call => call.action), ['visit']);
    assert.equal(scene(g).dataset.stage, 'welcome');
    click(g, 'start');finishShift(g, 6);
    const opening = JSON.parse(g.window.localStorage.getItem(gameKey));
    assert.equal(opening.completed.length, 1);
    const story = g.window.roastOfficeGame.reviewFor(opening.answers, 0).story;
    assert.ok(node(g, 'story-code').textContent.startsWith(story.code));
    assert.equal(node(g, 'story-image').getAttribute('src'), 'assets/chief-case-'+story.code.slice(5)+'.png');
    finishRepair(g);
    const repair = g.window.localStorage.getItem(repairKey);
    assert.equal(JSON.parse(repair).completed.length, 1);
    assert.deepEqual(JSON.parse(repair).current.source.opening, [0,0,0,0,0,0]);
    click(g, 'return-near-card');
    assert.equal(node(g, 'repair-desk').hidden, true);
    assert.equal(shiftLink(g).getAttribute('href'), '#review-form');
    finishShift(g, 5);
    assert.equal(node(g, 'repair-desk').hidden, false);
    assert.equal(g.window.localStorage.getItem(repairKey), repair, 'return gameplay preserves the saved repair receipt');
    const beforeFeedback = saved(g.window.localStorage);
    node(g, 'chief-signals-text').value = 'Local automated fixture feedback';
    g.document.querySelector('.chief-signals__form').dispatchEvent(new g.window.Event('submit', {bubbles:true,cancelable:true}));
    await flush();
    const feedback = g.calls.at(-1);
    assert.equal(feedback.action, 'feedback');
    assert.deepEqual(Object.keys(feedback).sort(), ['action','request_id','session','site','text','topic']);
    assert.deepEqual(saved(g.window.localStorage), beforeFeedback, 'optional feedback does not change personnel or repair saves');
    assert.match(node(g, 'chief-signals-feedback-status').textContent, /Feedback received/);
    assert.equal(node(g, 'chief-signals-text').value, '');
    assert.deepEqual(g.calls.map(call => call.action), ['visit','feedback'], 'gameplay and repair generate no additional fetches');
    const local = saved(g.window.localStorage), session = saved(g.window.sessionStorage);
    reopened = await assembled({local,session});
    assert.deepEqual(saved(reopened.window.localStorage), local, 'initialization reopens existing bytes without rewriting files');
    assert.equal(scene(reopened).dataset.shift, 'return');
    assert.equal(scene(reopened).dataset.stage, 'complete');
    assert.equal(shiftLink(reopened).getAttribute('href'), '#paper');
    assert.equal(JSON.parse(reopened.window.localStorage.getItem(gameKey)).completed.length, 2);
    assert.equal(node(reopened, 'repair-desk').querySelector('.repair__stamp').textContent, 'REPAIR VERIFIED');
    assert.deepEqual(g.errors, []);
    assert.deepEqual(reopened.errors, []);
  } finally {if(reopened)await reopened.close();await g.close();}
});

test('actual assembled page reopens an existing v2 shift without changing its save or choices', async () => {
  const existing = JSON.stringify({version:2,shift:0,answers:[2,1],stage:'question',completed:[]});
  const g = await assembled({local:{[gameKey]:existing, 'unrelated-office-key':'keep'}});
  try {
    assert.equal(g.window.localStorage.getItem(gameKey), existing);
    assert.equal(g.window.localStorage.getItem('unrelated-office-key'), 'keep');
    assert.equal(scene(g).dataset.stage, 'decision');
    assert.match(scene(g).querySelector('.chief-stage__status').textContent, /2 \/ 6/);
    finishShift(g, 4);
    assert.deepEqual(JSON.parse(g.window.localStorage.getItem(gameKey)).answers, [2,1,0,0,0,0]);
    assert.equal(node(g, 'repair-desk').hidden, false);
    assert.deepEqual(g.errors, []);
  } finally {await g.close();}
});

test('actual assembled page completes both shifts and repair when browser storage is denied', async () => {
  const g = await assembled({deniedStorage:true});
  try {
    assert.match(node(g, 'local-status').textContent, /Local saving is unavailable/);
    click(g, 'start');finishShift(g, 6);finishRepair(g);
    assert.match(node(g, 'repair-desk').textContent, /Local saving is unavailable/);
    click(g, 'return-near-card');finishShift(g, 5);
    assert.equal(g.window.roastOfficeGame.getState().completed.length, 2);
    assert.match(node(g, 'local-status').textContent, /Local saving is unavailable/);
    assert.deepEqual(g.errors, []);
  } finally {await g.close();}
});
