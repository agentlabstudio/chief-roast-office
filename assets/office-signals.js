/* Shared Chief Roast Office counts and voluntary feedback. No game saves are read or changed. */
(function () {
  'use strict';

  const ENDPOINT = 'https://piltqqaxevmkswklbyms.supabase.co/functions/v1/chief-site-signals';
  const PUBLIC_ANON_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbHRxcWF4ZXZta3N3a2xieW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NzEzNTgsImV4cCI6MjEwNzM0NzM1OH0.Gf5PxXviMkKQwfwlv1d7drd-H_wL0Lr4PZlAWT_It8U';
  const SESSION_KEY = 'chief-signals-session-v1';
  const SITES = ['office', 'personnel', 'quiet', 'handover'];
  const TOPICS = ['useful', 'confusing', 'bug', 'idea'];
  const DELIVERY_FAILURE = 'Could not confirm delivery. Keep your text and try again.';
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function randomUUID() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      const value = window.crypto.randomUUID();
      return UUID.test(value) ? value : null;
    }
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    }
    return null;
  }

  function validStats(stats) {
    if (!stats || typeof stats !== 'object' || Array.isArray(stats) || stats.started_at !== '2026-10-14' ||
      typeof stats.checked_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(stats.checked_at) ||
      !Number.isFinite(Date.parse(stats.checked_at))) return false;
    const fields = ['office_total', 'game_total', 'feedback_total', 'office_today', 'game_today', 'feedback_today'];
    if (!fields.every(field => Number.isSafeInteger(stats[field]) && stats[field] >= 0)) return false;
    return stats.office_today <= stats.office_total && stats.game_today <= stats.game_total && stats.feedback_today <= stats.feedback_total;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function append(parent) {
    for (let i = 1; i < arguments.length; i++) parent.appendChild(arguments[i]);
    return parent;
  }

  function feedbackContext(query, pageContext) {
    const key = query.get('feedback') || pageContext;
    if (key === 'personnel-20261015') return {
      label: 'Personnel game · personnel-20261015',
      returnLabel: 'Return to your personnel shift',
      returnHref: 'personnel-game.html'
    };
    if (key !== 'coffee-20261015') return null;
    const route = query.get('route');
    const knownRoutes = ['plain/show', 'plain/point', 'sign/replace', 'sign/audit', 'none/assign', 'none/wait'];
    return {
      label: 'Coffee CASE-021 · coffee-20261015' + (knownRoutes.includes(route) ? ' · route ' + route : ''),
      returnLabel: 'Try another coffee policy',
      returnHref: 'case-021.html'
    };
  }

  function init() {
    const site = document.body && document.body.getAttribute('data-chief-site');
    if (!SITES.includes(site) || document.querySelector('[data-chief-signals]')) return;
    const query = new URLSearchParams(window.location?.search || '');
    const preview = query.get('chief_preview') === '1';
    const context = feedbackContext(query, document.body.getAttribute('data-chief-feedback'));
    const contextPrefix = context ? '[' + context.label + ']\n' : '';
    const maximumDraftLength = 1200 - contextPrefix.length;

    let session = null;
    let sessionMemoryUnavailable = false;
    try {
      const saved = window.sessionStorage.getItem(SESSION_KEY);
      if (typeof saved === 'string' && UUID.test(saved)) session = saved;
    } catch (_) { sessionMemoryUnavailable = true; }
    if (!session) {
      try { session = randomUUID(); } catch (_) { session = null; }
      if (session && !sessionMemoryUnavailable) {
        try { window.sessionStorage.setItem(SESSION_KEY, session); }
        catch (_) { sessionMemoryUnavailable = true; }
      }
    }

    const panel = element('section', 'chief-signals');
    panel.id = 'office-noticeboard';
    panel.setAttribute('data-chief-signals', 'v1');
    panel.setAttribute('aria-labelledby', 'chief-signals-title');
    const heading = element('h2', 'chief-signals__title', 'Office noticeboard');
    heading.id = 'chief-signals-title';
    const kicker = element('p', 'chief-signals__kicker', 'Visits & feedback');
    const refresh = element('button', 'chief-signals__refresh', 'Refresh counts');
    refresh.type = 'button';
    append(panel, append(element('div', 'chief-signals__header'), append(element('div'), kicker, heading), refresh));
    if (preview) append(panel, element('p', 'chief-signals__preview', 'Development preview · visits and test feedback are excluded from public counts.'));

    const table = element('table', 'chief-signals__table');
    append(table, element('caption', 'chief-signals__sr-only', 'Shared office and game counts'));
    const head = element('thead');
    const headerRow = element('tr');
    for (const label of ['Activity', 'Today', 'All time']) {
      const cell = element('th', '', label);
      cell.setAttribute('scope', 'col');
      append(headerRow, cell);
    }
    append(table, append(head, headerRow));
    const body = element('tbody');
    const cells = {};
    for (const [label, today, total] of [['Office visits', 'office_today', 'office_total'], ['Game visits', 'game_today', 'game_total'], ['Feedback received', 'feedback_today', 'feedback_total']]) {
      const row = element('tr');
      const rowHeading = element('th', '', label);
      rowHeading.setAttribute('scope', 'row');
      append(row, rowHeading);
      for (const field of [today, total]) {
        cells[field] = element('td', '', '—');
        cells[field].setAttribute('data-chief-count', field);
        append(row, cells[field]);
      }
      append(body, row);
    }
    append(panel, append(table, body));
    append(panel, element('p', 'chief-signals__note', 'Counted browser sessions since 14 Oct 2026. These are not unique visitors or customers. Game visits combine all three games. Today follows the Helsinki calendar.'));
    const countStatus = element('p', 'chief-signals__status', 'Loading counts…');
    countStatus.id = 'chief-signals-count-status';
    countStatus.setAttribute('role', 'status');
    countStatus.setAttribute('aria-live', 'polite');
    append(panel, countStatus);
    if (sessionMemoryUnavailable) append(panel, element('p', 'chief-signals__note', 'Browser session memory is unavailable; revisiting may count again.'));
    const officeLink = element('a', 'chief-signals__office-link', 'Visit Chief’s office');
    officeLink.setAttribute('href', './#office');
    append(panel, officeLink);

    const details = element('details', 'chief-signals__feedback');
    details.id = 'game-feedback';
    details.open = Boolean(context && query.get('feedback'));
    append(details, element('summary', '', 'Leave optional development feedback'));
    const form = element('form', 'chief-signals__form');
    form.setAttribute('aria-label', 'Optional development feedback');
    const topicLabel = element('label', 'chief-signals__label', 'Feedback topic');
    topicLabel.htmlFor = 'chief-signals-topic';
    const topic = element('select', 'chief-signals__select');
    topic.id = 'chief-signals-topic';
    topic.name = 'topic';
    topic.required = true;
    for (const [value, label] of [['useful', 'Useful'], ['confusing', 'Confusing'], ['bug', 'Problem or bug'], ['idea', 'Idea']]) {
      const option = element('option', '', label);
      option.value = value;
      append(topic, option);
    }
    const textLabel = element('label', 'chief-signals__label', 'Your feedback');
    textLabel.htmlFor = 'chief-signals-text';
    const text = element('textarea', 'chief-signals__text');
    text.id = 'chief-signals-text';
    text.name = 'text';
    text.maxLength = maximumDraftLength;
    text.minLength = 3;
    text.rows = 4;
    text.required = true;
    text.setAttribute('aria-describedby', 'chief-signals-text-help chief-signals-privacy');
    const textHelp = element('p', 'chief-signals__note', context ? '3–' + maximumDraftLength.toLocaleString('en-GB') + ' characters, plus the episode label below.' : '3–1,200 characters.');
    textHelp.id = 'chief-signals-text-help';
    const privacy = element('p', 'chief-signals__privacy', "Optional feedback goes privately to the AI-assisted development team; don't include passwords, keys or personal details. Anonymous session marker used only to avoid duplicate counts.");
    privacy.id = 'chief-signals-privacy';
    const trap = element('div', 'chief-signals__honeypot');
    trap.setAttribute('aria-hidden', 'true');
    const trapLabel = element('label', '', 'Office extension — leave blank');
    trapLabel.htmlFor = 'chief-signals-extension';
    const honeypot = element('input');
    honeypot.id = 'chief-signals-extension';
    honeypot.name = 'office_extension';
    honeypot.type = 'text';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    append(trap, trapLabel, honeypot);
    const submit = element('button', 'chief-signals__submit', 'Send optional feedback');
    submit.type = 'submit';
    const feedbackStatus = element('p', 'chief-signals__status');
    feedbackStatus.id = 'chief-signals-feedback-status';
    feedbackStatus.setAttribute('role', 'status');
    feedbackStatus.setAttribute('aria-live', 'polite');
    if (context) {
      const about = element('p', 'chief-signals__note', 'Included only when you send: ' + context.label + '.');
      about.id = 'chief-signals-context';
      text.setAttribute('aria-describedby', 'chief-signals-text-help chief-signals-context chief-signals-privacy');
      append(form, element('p', 'chief-signals__note', 'What did you choose, what did you expect, and what happened? One useful observation is enough. If you are returning, you may mention that; it is not inferred from your visit.'), about);
    }
    append(form, topicLabel, topic, textLabel, text, textHelp, privacy, trap, submit, feedbackStatus);
    if (context) {
      const returnLink = element('a', 'chief-signals__office-link', context.returnLabel);
      returnLink.setAttribute('href', context.returnHref + (preview ? '?chief_preview=1' : ''));
      append(form, returnLink, element('p', 'chief-signals__note', 'Feedback is optional. You can return to the game without sending.'));
    }
    append(panel, append(details, form));
    const footer = document.querySelector('footer');
    if (footer && footer.parentNode) footer.parentNode.insertBefore(panel, footer);
    else append(document.body, panel);

    let activeRequest = false;
    let feedbackActive = false;
    let confirmedStats = false;
    let intakeLimit = false;
    let pendingAttempt = null;

    function busy(value, feedback) {
      activeRequest = value;
      feedbackActive = value && feedback;
      refresh.disabled = value || !session;
      submit.disabled = value || !session;
      text.disabled = feedbackActive;
      topic.disabled = feedbackActive;
      panel.setAttribute('aria-busy', String(value));
    }

    function intakeMessage(message) {
      return message + (intakeLimit ? ' New visit counting is paused at the intake limit.' : '');
    }

    function renderStats(stats, intakeLimited) {
      for (const field of Object.keys(cells)) cells[field].textContent = stats[field].toLocaleString('en-GB');
      confirmedStats = true;
      if (typeof intakeLimited === 'boolean') intakeLimit = intakeLimited;
      let checked = stats.checked_at;
      try {
        checked = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(stats.checked_at)) + ' Helsinki time';
      } catch (_) { /* The validated ISO timestamp remains useful without locale support. */ }
      countStatus.textContent = intakeMessage('Confirmed counts · updated ' + checked + '.');
    }

    async function post(payload) {
      let timer = null;
      const abort = typeof window.AbortController === 'function' ? new window.AbortController() : null;
      if (abort) timer = window.setTimeout(function () { abort.abort(); }, 12000);
      try {
        const response = await window.fetch(ENDPOINT, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PUBLIC_ANON_TOKEN },
          body: JSON.stringify(preview ? { ...payload, preview: true } : payload), credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
          ...(abort ? { signal: abort.signal } : {})
        });
        if (!response.ok) throw new Error('Unconfirmed response');
        const result = await response.json();
        if (!result || result.ok !== true || !validStats(result.stats)) throw new Error('Unconfirmed response');
        return result;
      } finally { if (timer !== null) window.clearTimeout(timer); }
    }

    async function counts(action) {
      if (activeRequest || !session) return;
      busy(true, false);
      countStatus.textContent = intakeMessage(action === 'visit' ? 'Loading counts…' : 'Refreshing counts…');
      try {
        const result = await post({ action, site, session });
        if (result.counted !== undefined && typeof result.counted !== 'boolean') throw new Error('Unconfirmed visit');
        renderStats(result.stats, result.intake_limit);
      } catch (_) {
        countStatus.textContent = intakeMessage(confirmedStats ? 'Could not refresh counts. Previous confirmed counts are still shown.' : 'Counts are unavailable right now. Try Refresh counts.');
      } finally { busy(false, false); }
    }

    refresh.addEventListener('click', function () { counts('stats'); });
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (activeRequest || !session) return;
      const draft = text.value;
      const selectedTopic = topic.value;
      if (honeypot.value) { feedbackStatus.textContent = DELIVERY_FAILURE; return; }
      if (!TOPICS.includes(selectedTopic) || typeof draft !== 'string' || draft.trim().length < 3 || draft.length > maximumDraftLength) {
        feedbackStatus.textContent = 'Choose a topic and write feedback of 3–' + maximumDraftLength.toLocaleString('en-GB') + ' characters.';
        return;
      }
      if (!pendingAttempt || pendingAttempt.topic !== selectedTopic || pendingAttempt.draft !== draft) {
        let requestId = null;
        try { requestId = randomUUID(); } catch (_) { /* Keep the form when a secure random ID is unavailable. */ }
        if (!requestId) { feedbackStatus.textContent = DELIVERY_FAILURE; return; }
        pendingAttempt = { request_id: requestId, topic: selectedTopic, text: contextPrefix + draft, draft };
      }
      const attempt = pendingAttempt;
      busy(true, true);
      feedbackStatus.textContent = 'Sending feedback…';
      try {
        const result = await post({ action: 'feedback', site, session, request_id: attempt.request_id, topic: attempt.topic, text: attempt.text });
        if (result.feedback_saved !== true || (preview && result.preview !== true)) throw new Error('Unconfirmed feedback');
        renderStats(result.stats, result.intake_limit);
        if (text.value === attempt.draft && topic.value === attempt.topic) text.value = '';
        pendingAttempt = null;
        feedbackStatus.textContent = preview ? 'Test feedback saved privately; excluded from public counts.' : 'Feedback received. Thank you for helping the office improve.';
      } catch (_) { feedbackStatus.textContent = DELIVERY_FAILURE; }
      finally { busy(false, false); }
    });

    busy(false, false);
    if (!session) {
      countStatus.textContent = 'Counts and feedback are unavailable in this browser. A secure anonymous session marker could not be created.';
      return;
    }
    counts('visit');
    function openRequestedFeedback() {
      if (context && window.location?.hash === '#game-feedback') {
        details.open = true;
        if (typeof details.scrollIntoView === 'function') details.scrollIntoView({ block: 'start' });
      }
    }
    openRequestedFeedback();
    if (typeof window.addEventListener === 'function') window.addEventListener('hashchange', openRequestedFeedback);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

