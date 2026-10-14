'use strict';

// A local address comparison only. No proof of signature authority is produced.
const CHIEF_OWNER_FID = 3354501;
const CHIEF_ACCOUNT_METHODS = Object.freeze(['eth_requestAccounts']);

function parseCustodyFragment(fragment) {
  if (typeof fragment !== 'string') return null;
  const match = /^#custody=(0x[0-9a-f]{40})$/i.exec(fragment);
  return match ? match[1].toLowerCase() : null;
}

function createOwnerWalletChecker(options) {
  const sdk = options.sdk || null;
  const expected = parseCustodyFragment(options.custodyFragment);
  const injected = options.injectedProvider || null;
  const notify = typeof options.onChange === 'function' ? options.onChange : function () {};
  const timer = options.setTimeout || setTimeout;
  const clear = options.clearTimeout || clearTimeout;
  const runtimeMs = options.runtimeTimeoutMs || 2000;
  const accountsMs = options.accountsTimeoutMs || 12000;
  let active = false;
  let accountRequestPending = false;
  let prepared = null;
  let readySent = false;
  let capabilities = null;
  let context = { available: false, fid: null };
  let last = { kind: expected ? 'idle' : 'missing', busy: false, message: expected ? 'Osoitetta ei ole vielä tarkistettu.' : 'Vertailuosoite puuttuu; avaa perustajan oma tarkistuslinkki', detail: '', address: '' };

  function emit(kind, detail, address) {
    const messages = { idle: 'Osoitetta ei ole vielä tarkistettu.', missing: 'Vertailuosoite puuttuu; avaa perustajan oma tarkistuslinkki', checking: 'Tarkistetaan lompakkoyhteyttä…',
      match: 'Omistajalompakko täsmää', different: 'Eri lompakko — älä allekirjoita', unavailable: 'Lompakkoyhteys ei ole saatavilla' };
    last = { kind, busy: active, message: messages[kind], detail: detail || '', address: address || '' };
    notify({ ...last });
    return { ...last };
  }
  function bounded(value, milliseconds) {
    let timeout;
    const limit = new Promise(function (_, reject) { timeout = timer(function () { const error = new Error('timeout'); error.kind = 'timeout'; reject(error); }, milliseconds); });
    return Promise.race([Promise.resolve(value), limit]).finally(function () { clear(timeout); });
  }
  function blocked() { return context.available && context.fid !== CHIEF_OWNER_FID; }
  function acceptContext(value) {
    if (value === undefined || value === null) context = { available: false, fid: null };
    else {
      const fid = value && typeof value === 'object' && value.user && value.user.fid;
      context = { available: true, fid: Number.isSafeInteger(fid) && fid > 0 ? fid : null };
    }
    if (blocked()) emit('unavailable', 'MiniApp-konteksti ei kuulu tarkistettavalle Farcaster-tilille. Osoitetta ei näytetä.');
    return { ...context };
  }
  async function readContext() {
    if (!sdk) return context;
    let value;
    try { value = sdk.context; } catch (_) { return context; }
    // Observe a late context as well, so a mismatching FID invalidates a displayed result.
    const resolved = Promise.resolve(value).then(acceptContext);
    try { return await bounded(resolved, runtimeMs); }
    catch (_) { return context; }
  }
  function prepare() {
    if (prepared) return prepared;
    prepared = (async function () {
      if (!expected || !sdk) return;
      const tasks = [readContext()];
      tasks.push(ready());
      if (typeof sdk.getCapabilities === 'function') tasks.push(bounded(Promise.resolve().then(function () { return sdk.getCapabilities(); }), runtimeMs).then(function (values) {
        capabilities = Array.isArray(values) && values.every(function (value) { return typeof value === 'string'; }) ? values : null;
      }).catch(function () { capabilities = null; }));
      await Promise.all(tasks);
    })();
    return prepared;
  }
  function ready() {
    if (readySent || !sdk || !sdk.actions || typeof sdk.actions.ready !== 'function') return Promise.resolve();
    readySent = true;
    // Splash dismissal only: no context, capability or Ethereum account request on page load.
    return bounded(Promise.resolve().then(function () { return sdk.actions.ready(); }), runtimeMs).catch(function () {});
  }
  async function provider() {
    if (sdk && capabilities && (capabilities.includes('wallet.getEthereumProvider') || capabilities.includes('wallet.getEvmProvider')) &&
      sdk.wallet && typeof sdk.wallet.getEthereumProvider === 'function') {
      try {
        const result = await bounded(Promise.resolve().then(function () { return sdk.wallet.getEthereumProvider(); }), runtimeMs);
        if (result && typeof result.request === 'function') return { value: result, name: 'MiniApp-lompakko' };
      } catch (_) { /* Retrieval failure can fall back before an account request is made. */ }
    }
    if (injected && typeof injected.request === 'function') return { value: injected, name: 'Selaimen lompakko' };
    return null;
  }
  async function requestAccounts(wallet) {
    const method = 'eth_requestAccounts';
    if (!CHIEF_ACCOUNT_METHODS.includes(method)) throw new Error('method_not_allowed');
    accountRequestPending = true;
    const pending = Promise.resolve().then(function () { return wallet.request({ method }); }).finally(function () { accountRequestPending = false; });
    return bounded(pending, accountsMs);
  }
  async function check() {
    if (!expected) return emit('missing', 'Vertailuosoite luetaan vain paikallisesta URL-fragmentista.');
    if (active) return { ...last };
    if (accountRequestPending) return emit('unavailable', 'Lompakon aiempi osoitepyyntö on yhä kesken. Sulje se ennen uutta yritystä.');
    active = true;
    emit('checking', 'Lompakolta pyydetään vain julkinen osoite.');
    try {
      await prepare();
      await readContext();
      if (blocked()) return emit('unavailable', 'MiniApp-konteksti ei kuulu FID-tilille 3354501. Osoitetta ei pyydetty.');
      const wallet = await provider();
      if (blocked()) return emit('unavailable', 'MiniApp-konteksti ei kuulu FID-tilille 3354501. Osoitetta ei pyydetty.');
      if (!wallet) return emit('unavailable', 'Avaa tämä sivu Farcasterin Mini App -esikatselussa tai lompakkoa tukevassa selaimessa.');
      const accounts = await requestAccounts(wallet.value);
      if (blocked()) return emit('unavailable', 'MiniApp-konteksti vaihtui eri Farcaster-tilille. Luettua osoitetta ei näytetä.');
      if (!Array.isArray(accounts) || !accounts.length || accounts.length > 16 || !accounts.every(function (address) {
        return typeof address === 'string' && /^0x[0-9a-f]{40}$/i.test(address);
      })) return emit('unavailable', 'Lompakko ei palauttanut kelvollista osoitetta.');
      // The first selected account is compared; a later matching account does not override it.
      const selected = accounts[0];
      if (selected.toLowerCase() === expected) return emit('match', wallet.name + ': valittu osoite vastaa linkin vertailuosoitetta. Tämä ei todista allekirjoitusoikeutta.', selected);
      return emit('different', wallet.name + ': valittu osoite ei vastaa linkin vertailuosoitetta.', selected);
    } catch (error) {
      if (Number(error && (error.code ?? error.cause?.code)) === 4001) return emit('unavailable', 'Tarkistus peruttiin. Osoitetta ei vahvistettu.');
      if (error && error.kind === 'timeout') return emit('unavailable', 'Lompakko ei vastannut ajoissa. Voit yrittää uudelleen.');
      return emit('unavailable', 'Osoitetta ei voitu lukea. Voit yrittää uudelleen.');
    } finally {
      active = false;
      last = { ...last, busy: false };
      notify({ ...last });
    }
  }
  notify({ ...last });
  return { ready, prepare, check };
}

function bindOwnerWalletPage(document, window) {
  const button = document.getElementById('owner-check-button');
  if (!button || button.getAttribute('data-owner-check-bound') === 'true') return;
  button.setAttribute('data-owner-check-bound', 'true');
  const status = document.getElementById('owner-check-status');
  const detail = document.getElementById('owner-check-detail');
  const address = document.getElementById('owner-check-address');
  const addressBox = document.getElementById('owner-check-address-box');
  const expectedField = document.getElementById('owner-check-expected');
  const fragment = window.location && window.location.hash;
  const expected = parseCustodyFragment(fragment);
  expectedField.value = expected || '';
  let injected = null;
  try { injected = window.ethereum || null; } catch (_) { /* No provider is treated as unavailable. */ }
  const checker = createOwnerWalletChecker({ sdk: window.miniapp && window.miniapp.sdk, injectedProvider: injected, custodyFragment: fragment,
    setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window),
    onChange: function (result) {
      status.textContent = result.message;
      status.setAttribute('data-result', result.kind);
      detail.textContent = result.detail;
      address.value = result.address;
      addressBox.hidden = !result.address;
      button.disabled = result.busy || !expected;
      button.setAttribute('aria-busy', String(result.busy));
    } });
  button.addEventListener('click', function () { checker.check(); });
  checker.ready();
}

if (typeof module !== 'undefined' && module.exports) module.exports = { createOwnerWalletChecker, bindOwnerWalletPage, parseCustodyFragment, CHIEF_OWNER_FID, CHIEF_ACCOUNT_METHODS };
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bindOwnerWalletPage(document, window); }, { once: true });
  else bindOwnerWalletPage(document, window);
}
