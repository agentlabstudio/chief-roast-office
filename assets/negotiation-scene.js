(function () {
  'use strict';
  function init() {
    const intro = document.querySelector('.intro');
    if (!intro || !window.ChiefNegotiation || document.getElementById('negotiation')) return;
    const model = window.ChiefNegotiation;
    let storage;
    try { storage = window.localStorage; } catch (_) { storage = null; }
    let state = storage ? model.read(storage) : null;
    const termKey = 'chief-negotiation-term-v1';
    let term = null;
    try { const saved = storage && storage.getItem(termKey); if (['coffee', 'naps'].includes(saved)) term = saved; } catch (_) {}
    const section = document.createElement('section');
    section.id = 'negotiation';
    section.className = 'negotiation';
    section.setAttribute('aria-labelledby', 'negotiation-title');
    section.innerHTML = `<p class="negotiation__eyebrow">A new office encounter</p>
      <h2 id="negotiation-title">The negotiation</h2>
      <p>Chief offers the cat a seat at the desk. Who gets the chair?</p>
      <div class="negotiation__stage" data-layout="unselected" aria-label="Chief and the cat at the negotiation desk">
        <div class="negotiation__seat negotiation__seat--left" aria-hidden="true">DESK</div>
        <div class="negotiation__seat negotiation__seat--right" aria-hidden="true">GUEST</div>
        <div class="negotiation__character negotiation__chief" role="img" aria-label="Chief"></div>
        <div class="negotiation__character negotiation__cat" role="img" aria-label="The cat"></div>
        <div class="negotiation__desk" aria-hidden="true"><span>CONTRACT</span></div>
      </div>
      <div class="negotiation__choices" aria-label="Choose who sits at the desk">
        <button type="button" data-layout-choice="chief-desk" aria-pressed="false">Chief takes the desk</button>
        <button type="button" data-layout-choice="cat-desk" aria-pressed="false">The cat takes the desk</button>
      </div>
      <p class="negotiation__result" role="status" aria-live="polite"></p>
      <div class="negotiation__box" hidden><div class="negotiation__box-art" data-open="false" aria-hidden="true"><span class="negotiation__paper">✦</span><span class="negotiation__lid"></span></div><button type="button" class="negotiation__open">Open the contract box</button><p class="negotiation__box-result" hidden></p></div>
      <div class="negotiation__terms" hidden><h3>The contract needs a clause</h3><p>Both executives insist this is non-negotiable. Choose the office rule.</p><div class="negotiation__choices"><button type="button" data-term="coffee" aria-pressed="false">Protect the espresso</button><button type="button" data-term="naps" aria-pressed="false">Protect the nap</button></div><p class="negotiation__term-result" role="status" aria-live="polite"></p></div><p class="negotiation__save" aria-live="polite"></p>`;
    intro.insertAdjacentElement('afterend', section);
    const stage = section.querySelector('.negotiation__stage');
    const result = section.querySelector('.negotiation__result');
    const box = section.querySelector('.negotiation__box');
    const boxArt = section.querySelector('.negotiation__box-art');
    const boxResult = section.querySelector('.negotiation__box-result');
    const open = section.querySelector('.negotiation__open');
    const saveNote = section.querySelector('.negotiation__save');
    const terms = section.querySelector('.negotiation__terms');
    const termResult = section.querySelector('.negotiation__term-result');
    function render() {
      const layout = state ? state.layout : 'unselected';
      stage.dataset.layout = layout;
      section.querySelectorAll('[data-layout-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layoutChoice === layout)));
      result.textContent = layout === 'cat-desk' ? 'The cat takes the chair. Chief studies the new terms: “Finally. Someone who negotiates.”' : layout === 'chief-desk' ? 'Chief keeps the desk. The cat places a paw on the contract anyway. “A formidable counteroffer.”' : 'Choose a seat to begin. You can change it later.';
      box.hidden = !state;
      boxArt.dataset.open = String(!!(state && state.boxOpened));
      open.hidden = !!(state && state.boxOpened);
      boxResult.hidden = !(state && state.boxOpened);
      terms.hidden = !(state && state.boxOpened);
      section.querySelectorAll('[data-term]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.term === term)));
      termResult.textContent = term === 'coffee' ? 'OFFICE RULE: Espresso is protected. The cat has reserved the saucer.' : term === 'naps' ? 'OFFICE RULE: Naps are protected. Chief has scheduled an emergency nap review.' : 'Choose a clause. You can change it later.';
      boxResult.textContent = state && state.boxOpened ? 'Inside: one contract, two signature spaces, and a paw print exactly where Chief planned to sign.' : '';
    }
    function persist() {
      const saved = storage && model.save(storage, state);
      saveNote.textContent = saved ? 'Your choice is saved on this device. You can change seats whenever you return.' : 'Your choice works for this visit; this browser could not save it.';
    }
    section.querySelectorAll('[data-layout-choice]').forEach(button => button.addEventListener('click', function () {
      state = model.choose(state, button.dataset.layoutChoice); persist(); render();
    }));
    open.addEventListener('click', function () { state = model.openBox(state); persist(); render(); boxResult.focus(); });
    section.querySelectorAll('[data-term]').forEach(button => button.addEventListener('click', function () {
      term = button.dataset.term;
      let saved = false;
      try { if (storage) { storage.setItem(termKey, term); saved = true; } } catch (_) {}
      saveNote.textContent = saved ? 'The office rule is saved on this device. You can change it.' : 'The rule works for this visit; this browser could not save it.';
      render();
    }));
    boxResult.tabIndex = -1;
    render();
    if (state) saveNote.textContent = 'Your previous choice was restored. You can change seats.';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
