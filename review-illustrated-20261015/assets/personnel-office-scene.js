/* Chief's original office. A read-only view of the personnel game's visible DOM. */
(function () {
  'use strict';

  function init() {
    if (document.getElementById('chief-stage__office-scene')) return;
    const intro = document.querySelector('.intro');
    const grid = document.querySelector('.grid');
    const form = document.getElementById('review-form');
    const paper = document.getElementById('paper');
    if (!intro || !grid || !form || !paper || intro.parentNode !== grid.parentNode) return;

    function html(tag, className, text) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    }
    function append(parent, ...children) {
      children.forEach(child => parent.appendChild(child));
      return parent;
    }
    function textIfChanged(element, text) {
      if (element.textContent !== text) element.textContent = text;
    }
    function attributeIfChanged(element, name, value) {
      if (element.getAttribute(name) !== String(value)) element.setAttribute(name, String(value));
    }

    const figure = html('figure', 'chief-stage__figure');
    figure.id = 'chief-stage__office-scene';
    figure.setAttribute('data-chief-stage', 'personnel-office-v2');
    const media = html('div', 'chief-stage__media');
    const illustration = html('img', 'chief-stage__illustration');
    illustration.src = 'assets/chief-office-room-20261014.png';
    illustration.alt = 'Chief at his cluttered desk in the original office, with a worn intern chair, a paper-filled printer and a cork noticeboard.';
    illustration.width = 1774;
    illustration.height = 887;
    illustration.decoding = 'async';
    const unavailable = html('p', 'chief-stage__unavailable', 'The office illustration is unavailable. Chief’s desk, the intern chair, printer and noticeboard are still represented below; your shift continues.');
    unavailable.hidden = true;
    illustration.addEventListener('error', function () {
      illustration.hidden = true;
      unavailable.hidden = false;
    });
    illustration.addEventListener('load', function () {
      illustration.hidden = false;
      unavailable.hidden = true;
    });
    append(media, illustration, unavailable);

    const caption = html('figcaption', 'chief-stage__caption');
    const heading = html('h2', 'chief-stage__room', 'Chief’s office');
    const departments = html('ul', 'chief-stage__departments');
    departments.setAttribute('aria-label', 'Office departments; the current decision is highlighted');
    const chips = {};
    const names = {desk: 'Chief’s desk', intern: 'Intern chair', printer: 'Printer', board: 'Noticeboard'};
    for (const [key, name] of Object.entries(names)) {
      const chip = html('li', 'chief-stage__department', name);
      chip.setAttribute('data-department', key);
      chip.setAttribute('data-active', 'false');
      chips[key] = chip;
      departments.appendChild(chip);
    }
    const status = html('p', 'chief-stage__status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const title = html('h3', 'chief-stage__title');
    const chiefLine = html('p', 'chief-stage__reply');
    const stampText = html('p', 'chief-stage__stamp');
    const actions = html('nav', 'chief-stage__actions');
    actions.setAttribute('aria-label', 'Office scene navigation');
    const shiftLink = html('a', 'chief-stage__link', 'Go to the shift ↓');
    shiftLink.href = '#review-form';
    const officeLink = html('a', 'chief-stage__link', 'Back to the office ↗');
    officeLink.href = '../index.html#office-life';
    append(actions, shiftLink, officeLink);
    append(caption, heading, departments, status, title, chiefLine, stampText, actions);
    append(figure, media, caption);
    grid.parentNode.insertBefore(figure, grid);

    const roots = [form, paper];
    function node(id) {
      const found = document.getElementById(id);
      return found && roots.some(root => root.contains(found)) ? found : null;
    }
    function visible(found) {
      if (!found) return false;
      for (let current = found; current && current !== document.body; current = current.parentElement) {
        if (current.hidden || current.getAttribute('aria-hidden') === 'true') return false;
      }
      return true;
    }
    function read(id, limit) {
      const found = node(id);
      if (!visible(found)) return '';
      const text = String(found.textContent || '').trim();
      return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
    }
    function snapshot() {
      const shift = read('shift-label', 80);
      const bar = node('shift-progress');
      const count = bar && visible(bar) ? Number(bar.value) : NaN;
      const max = bar && visible(bar) ? Number(bar.max) : NaN;
      const valid = Number.isInteger(count) && count >= 0 && (max === 6 || max === 5) && count <= max;
      const stage = visible(node('feedback-heading')) ? 'feedback'
        : visible(node('scene-heading')) ? 'decision'
        : visible(node('end-heading')) ? 'complete'
        : visible(node('welcome-heading')) ? 'welcome' : 'unknown';
      return {
        shift, stage,
        phase: /\breturn\b/i.test(shift) ? 'return' : /\bopening\b/i.test(shift) ? 'opening' : 'unknown',
        count: valid ? count : null, max: valid ? max : null,
        title: read('scene-heading', 180) || read('feedback-heading', 180) || read('welcome-heading', 180) || read('end-heading', 180),
        reply: read('chief-feedback', 600), stamp: read('stamp', 140)
      };
    }
    function departmentFor(state) {
      if (state.stage !== 'decision' && state.stage !== 'feedback') return '';
      // Match only the current scene heading, never player text, reactions or hidden scenes.
      if (/\bprinter\b/i.test(state.title)) return 'printer';
      if (/\b(intern|questions?)\b/i.test(state.title)) return 'intern';
      if (/\b(notice|review|correction)\b/i.test(state.title)) return 'board';
      return 'desk';
    }
    let previous = '';
    function update() {
      const state = snapshot();
      const signature = JSON.stringify(state);
      if (signature === previous) return;
      previous = signature;
      const department = departmentFor(state);
      const stages = {welcome: 'Ready to clock in', decision: 'Decision in progress', feedback: 'Decision filed', complete: 'Shift closed', unknown: 'Office status'};
      const progress = state.count !== null ? state.count + ' / ' + state.max + ' decisions filed' : 'Progress is not currently displayed';
      textIfChanged(status, (state.shift || 'Personnel office') + ' · ' + stages[state.stage] + ' · ' + progress);
      textIfChanged(title, state.title || 'Your shift is below.');
      textIfChanged(chiefLine, state.reply);
      chiefLine.hidden = !state.reply;
      textIfChanged(stampText, state.stamp ? 'Review stamp · ' + state.stamp : '');
      stampText.hidden = !state.stamp;
      attributeIfChanged(figure, 'data-shift', state.phase);
      attributeIfChanged(figure, 'data-stage', state.stage);
      for (const [key, chip] of Object.entries(chips)) {
        const active = key === department;
        attributeIfChanged(chip, 'data-active', active);
        textIfChanged(chip, names[key] + (active ? ' · current' : ''));
        attributeIfChanged(chip, 'aria-label', names[key] + (active ? ' — current decision' : ''));
      }
      attributeIfChanged(shiftLink, 'href', state.stage === 'complete' ? '#paper' : '#review-form');
      textIfChanged(shiftLink, state.stage === 'complete' ? 'Go to your review ↓' : state.stage === 'feedback' ? 'Continue the shift ↓' : 'Go to the shift ↓');
    }
    update();
    // The event announces a render; the visible DOM remains the sole source of truth.
    document.addEventListener('chief:shift-render', update);

    if (typeof window.MutationObserver !== 'function') return;
    const relevantIds = new Set(['shift-label', 'progress', 'shift-progress', 'scene-heading', 'feedback-heading', 'chief-feedback', 'stamp', 'welcome-heading', 'end-heading']);
    const visibilityIds = new Set(['review-form', 'paper', 'welcome', 'decision', 'feedback', 'shift-end', 'report']);
    function relevant(record) {
      let target = record.target.nodeType === 3 ? record.target.parentElement : record.target;
      if (roots.includes(target) && record.type === 'childList') return true;
      if (record.type === 'attributes' && visibilityIds.has(target.id)) return true;
      while (target && !roots.includes(target)) {
        if (relevantIds.has(target.id)) return true;
        target = target.parentElement;
      }
      return false;
    }
    let queued = false;
    const observer = new window.MutationObserver(function (records) {
      if (queued || !records.some(relevant)) return;
      queued = true;
      Promise.resolve().then(function () { queued = false; update(); });
    });
    for (const root of roots) observer.observe(root, {childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'value', 'max', 'aria-hidden']});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();

