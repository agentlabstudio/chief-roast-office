/* Isolated state for the unfinished Negotiation scene. No existing save keys are touched. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ChiefNegotiation = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'chief-negotiation-layout-v1';
  const layouts = ['chief-desk', 'cat-desk'];
  function valid(value) {
    return value && value.version === 1 && layouts.includes(value.layout) && typeof value.boxOpened === 'boolean';
  }
  function read(storage) {
    try { const value = JSON.parse(storage.getItem(KEY)); return valid(value) ? value : null; }
    catch (_) { return null; }
  }
  function save(storage, state) {
    if (!valid(state)) throw new TypeError('Invalid negotiation state');
    try { storage.setItem(KEY, JSON.stringify(state)); return true; } catch (_) { return false; }
  }
  function choose(state, layout) {
    if (!layouts.includes(layout)) throw new TypeError('Invalid layout');
    return { version: 1, layout, boxOpened: valid(state) ? state.boxOpened : false };
  }
  function openBox(state) {
    if (!valid(state)) throw new TypeError('Choose a layout first');
    return { ...state, boxOpened: true };
  }
  return Object.freeze({ KEY, read, save, choose, openBox });
});
