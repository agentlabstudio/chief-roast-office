/* Browser-local coffee continuity. Only fixed fictional choice IDs are retained. */
'use strict';
(() => {
  const key = 'chief-coffee-shift-v1';
  const routes = {'plain/show':['teach','chief'],'plain/point':['show','pair'],'sign/replace':['backup','batch'],'sign/audit':['release','finish'],'none/assign':['split','round'],'none/wait':['volunteer','rotate']};
  function validate(value) {
    if (!value || value.version !== 1 || !['plain','sign','none'].includes(value.policy)) return null;
    const {policy, route, phase, action} = value;
    if (['feedback','test'].includes(phase) && route === null && action === null)
      return {version:1,policy,route:null,phase,action:null};
    if (typeof route !== 'string' || !Object.hasOwn(routes, route) || route.split('/')[0] !== policy) return null;
    if (['ending','return'].includes(phase) && action === null)
      return {version:1,policy,route,phase,action:null};
    if (phase === 'return-ending' && routes[route].includes(action))
      return {version:1,policy,route,phase,action};
    return null;
  }
  function read() {
    try { return {state:validate(JSON.parse(localStorage.getItem(key))),available:true}; }
    catch (_) { return {state:null,available:false}; }
  }
  function write(state) {
    const safe = validate(state);
    if (!safe) return false;
    try { localStorage.setItem(key,JSON.stringify(safe)); return true; } catch (_) { return false; }
  }
  function clear() {
    try { localStorage.removeItem(key); return localStorage.getItem(key) === null; } catch (_) { return false; }
  }
  window.chiefCoffeeProgress = {key,validate,read,write,clear};
  document.addEventListener('chief:local-clear', event => {
    const cleared = clear();
    if (event.detail) event.detail.coffeeCleared = cleared;
  });
  // QA mode follows internal navigation, so a review never becomes an audience visit.
  if (new URLSearchParams(window.location.search).get('chief_preview') === '1') {
    for (const link of document.querySelectorAll('a[href]')) {
      const target = new URL(link.getAttribute('href'),window.location.href);
      if (target.origin === window.location.origin && /(?:\/|\.html)$/.test(target.pathname)) {
        target.searchParams.set('chief_preview','1'); link.href = target.href;
      }
    }
  }
  function resume() {
    const panel = document.getElementById('coffee-resume');
    if (!panel) return;
    const {state} = read();
    panel.hidden = !state;
    if (!state) return;
    const messages = {
      feedback:'You chose a coffee rule. Try its first empty-pot test.',
      test:'Your coffee rule is waiting for its first test.',
      ending:'Your first receipt is filed. See what the next shift inherits.',
      return:'Your first rule has a consequence. Finish the next-shift decision.',
      'return-ending':'Both shifts are filed. Reopen your coffee receipts.'
    };
    document.getElementById('coffee-resume-context').textContent = messages[state.phase];
    document.getElementById('coffee-resume-link').textContent = state.phase === 'return-ending' ? 'Reopen your coffee receipts →' : 'Continue your coffee shift →';
  }
  resume();
  window.addEventListener('pageshow',resume);
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null)resume();});
})();
