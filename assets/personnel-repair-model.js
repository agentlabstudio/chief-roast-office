/* Original Chief office repair game. Pure rules; no network, DOM or storage access. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChiefRepair = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const STORAGE_KEY = 'chief-office-repair-v1';
  const ORDERS = [
    {name:'The printer prints the queue twice',fault:'One visitor has become two tickets. Close one duplicate without losing the original.',limit:4,evidence:false,chief:'The printer has invented growth. We will be removing it.'},
    {name:'The welcome form grows overnight',fault:'Twenty-nine questions have returned. Give one fictional visitor a working first step.',limit:4,evidence:false,chief:'The form has reproduced. Please contain the paperwork.'},
    {name:'The microphone blocks the desk',fault:'Chief’s daily address is covering the error message. Test the repair with office noise at 2 or less.',limit:2,evidence:false,chief:'I have agreed to be quiet. The minutes will record this historic loss.'},
    {name:'Yesterday’s failure returns',fault:'The demo fails again. A visitor test alone will not close it: inspect the evidence, then use the bench test.',limit:4,evidence:true,chief:'A familiar failure. Apparently it has a season ticket.'},
    {name:'The intern finds a missing step',fault:'The welcome works until someone reaches the final button. Repair one small step and test it.',limit:4,evidence:false,chief:'The intern found the button. Management found an adjective.'},
    {name:'A handover has no next action',fault:'A perfect notebook ends with “later”. Leave a tested change and a receipt the next operator can use.',limit:4,evidence:false,chief:'An archive has arrived dressed as a handover. Its shoes are suspicious.'},
    {name:'The reserved chair gets a ticket',fault:'The returning visitor has a partial result. Preserve the useful part and close one small repair.',limit:4,evidence:false,chief:'The chair is reserved for a person. Please stop scheduling keynotes on it.'}
  ];
  const ACTIONS = [['inspect','intern','guess'],['small','pair','rewrite'],['bench','visitor','announce'],['receipt','delegate','promise']];
  function copyAnswers(value, size) {
    if (!Array.isArray(value) || value.length !== size || !Array.from({length:size},(_,i)=>Object.hasOwn(value,i)&&Number.isInteger(value[i])&&value[i]>=0&&value[i]<=2).every(Boolean)) throw new TypeError('Invalid previous shift.');
    return value.slice();
  }
  function cleanSource(value) {
    if (!value || typeof value !== 'object') throw new TypeError('A completed opening shift is required.');
    return {opening:copyAnswers(value.opening,6),returning:value.returning == null ? null : copyAnswers(value.returning,5)};
  }
  function sourceFrom(state) {
    if (!state || !Array.isArray(state.completed)) return null;
    let opening=null, returning=null;
    for (const item of state.completed) {
      if (item.shift === 0) opening=item.answers;
      if (item.shift === 1) returning=item.answers;
    }
    return opening ? cleanSource({opening,returning}) : null;
  }
  function dateValue(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError('Invalid work order date.');
    const number=Date.parse(value+'T00:00:00Z');
    if (!Number.isFinite(number) || new Date(number).toISOString().slice(0,10)!==value) throw new TypeError('Invalid work order date.');
    return number;
  }
  function orderFor(date) { return ORDERS[((Math.floor(dateValue(date)/86400000)%7)+7)%7]; }
  function context(source) {
    const clean=cleanSource(source),o=clean.opening,r=clean.returning;
    const handover=o[5]===0 || !!(r && r[1]===0);
    const clarity=o[1]===0 || !!(r && r[2]===0);
    const evidence=o[2]!==2 || !!(r && r[0]===1);
    const intern=clarity || !!(r && r[2]===0);
    const noise=(o[3]===2?2:0)+(r && r[3]===2?1:0);
    const inherited=[
      handover?'Your short handover gives this repair an extra minute.':'The missing next action costs this repair its spare minute.',
      clarity?'Your useful welcome question gives the intern a clear brief.':'The intern needs a clear brief before a small repair is available.',
      evidence?'Your recorded failure leaves evidence on the desk.':'Yesterday’s unverified explanation leaves an empty evidence drawer.'
    ];
    return {minutes:handover?7:6,clarity,evidence,intern,noise,work:0,test:0,receipt:false,tested:false,wide:false,inherited};
  }
  function create(source,date) { dateValue(date);return {version:1,date,source:cleanSource(source),answers:[],stage:'welcome'}; }
  function transition(c,id,order) {
    const next={...c};let result='',chief='';
    if (id==='inspect') {next.minutes--;next.clarity=true;next.evidence=true;next.noise=Math.max(0,next.noise-1);result='You recover the failed step and one clear next action. The small repair is now available.';chief='A fact has entered the room. The printer is checking its credentials.';}
    if (id==='intern') {next.minutes--;next.clarity=true;next.noise=Math.max(0,next.noise-1);result='The intern gives you the useful next step. Existing evidence stays as it was.';chief='The desk you gave the intern appears to have been a sound investment.';}
    if (id==='guess') {next.noise++;result='You keep the minute. Any missing brief or evidence remains missing; the office gets louder.';chief='A guess is a hypothesis wearing an expensive tie.';}
    if (id==='small') {next.minutes-=2;next.work=1;result='One small step is repaired. It still needs a test and a receipt.';chief='A change small enough to explain. How will the keynote survive?';}
    if (id==='pair') {next.minutes-=2;next.work=2;next.noise++;result='You and the intern repair two connected steps. Pairing costs one unit of office noise.';chief='Two people, an actual boundary, and useful output. I am choosing to tolerate this.';}
    if (id==='rewrite') {next.minutes-=3;next.work=2;next.wide=true;next.evidence=false;next.noise+=2;result=order.evidence?'The replacement discards the evidence this work order requires. This route cannot close today’s evidence-only ticket; file the honest failure.':'The replacement looks impressive. Old evidence no longer describes it; only a bench test can prove this wider change.';chief='You have expanded the repair. The available afternoon remains its original size.';}
    if (id==='bench') {next.minutes-=2;next.tested=true;const passes=next.work>0 && next.clarity && next.noise<=order.limit && (!order.evidence || next.evidence);next.test=passes?1:0;next.evidence=true;result=passes?'The bench reproduces the problem and checks the changed step. Test passed; a receipt can close this ticket.':'The bench finds an unresolved condition. Keep the failure: your brief, earlier evidence, or office noise still blocks a verified repair.';chief=passes?'The machine did the same useful thing twice. I am nearly convinced.':'A useful failure. File the condition, not the victory speech.';}
    if (id==='visitor') {next.minutes--;next.tested=true;const passes=next.work>0 && next.noise<=order.limit && !next.wide && !order.evidence;next.test=passes?1:0;result=passes?'The fictional visitor completes the changed step. Test passed; the next operator still needs a receipt.':'The visitor finds the gap. This work order needs a bench test or a quieter desk; a friendly welcome cannot verify it.';chief=passes?'A visitor has used the improvement. Please resist counting this as a keynote.':'The visitor has brought an observation. Its lack of applause is irrelevant.';}
    if (id==='announce') {next.noise+=2;result='The announcement is ready. The change remains untested, so this ticket cannot close.';chief='High definition progress. Low definition evidence.';}
    if (id==='receipt') {next.minutes--;next.receipt=true;result='The receipt names the working step, the test, and the next limit. The next operator can continue.';chief='I have stamped something that exists. A difficult day for the printer.';}
    if (id==='delegate') {next.receipt=true;result='The intern files the tested change using the brief you already agreed. Your spare minute survives.';chief='Delegation with a recipient and a record. I may need to sit down.';}
    if (id==='promise') {next.noise++;result='You leave an honest unfinished note. This run ends with an open ticket; no tested receipt is invented.';chief='“Still open” is an acceptable finding. “Basically done” has been asked to leave.';}
    return {condition:next,result,chief};
  }
  function condition(state) {
    let c=context(state.source);const order=orderFor(state.date);
    for (const id of state.answers) c=transition(c,id,order).condition;
    return c;
  }
  function options(state) {
    const step=state.answers.length,c=condition(state),order=orderFor(state.date);
    if (step>=4) return [];
    const list=[
      [{id:'inspect',label:'Read the failed step. Write one clear next action.',cost:1,detail:'Recover both brief and evidence; lower office noise by 1.'},{id:'intern',label:'Ask the intern for the small next step.',cost:1,detail:'Uses the trust from your earlier shift; lower noise by 1.',requires:c.intern?'':'A useful welcome question or bounded intern authority is needed.'},{id:'guess',label:'Keep the minute. Work from what you already know.',cost:0,detail:'No new evidence or brief; office noise rises by 1.'}],
      [{id:'small',label:'Repair only the failed step.',cost:2,detail:'One working step, with the old evidence preserved.',requires:c.clarity?'':'A clear next action is needed.'},{id:'pair',label:'Pair with the intern on two bounded steps.',cost:2,detail:'Two working steps; office noise rises by 1.',requires:c.intern&&c.clarity?'':'The intern needs a trusted role and a clear brief.'},{id:'rewrite',label:'Replace the whole route.',cost:3,detail:order.evidence?'Discard required evidence: this route cannot close today’s ticket. Costs 3 minutes and 2 noise.':'Two steps; discard old evidence, add 2 noise, require a bench test.'}],
      [{id:'bench',label:'Reproduce the failure. Run a bench test.',cost:2,detail:'Checks the brief and noise limit'+(order.evidence?', using the evidence you recovered.':'.')},{id:'visitor',label:'Have the intern guide one visitor through the change.',cost:1,detail:'Faster, but cannot verify a rewrite or an evidence-only work order.',requires:c.intern&&c.clarity?'':'A trusted intern with a clear brief is needed.'},{id:'announce',label:'Spend the remaining attention on an announcement.',cost:0,detail:'Adds 2 noise; leaves the change untested.'}],
      [{id:'receipt',label:'File the tested step, its limit, and next action.',cost:1,detail:'Close this work order with a usable handover.',requires:c.test?'':'A passing test is needed before a closed receipt.'},{id:'delegate',label:'Let the intern file the tested receipt.',cost:0,detail:'Use the agreed boundary and evidence; preserve your minute.',requires:c.test&&c.intern&&c.evidence?'':'A passing test, a trusted intern, and evidence are needed.'},{id:'promise',label:'Leave a clear unfinished note for the next shift.',cost:0,detail:'Keep the failure honest. The ticket stays open.'}]
    ][step];
    return list.map(a=>({...a,blocked:a.requires || (a.cost>c.minutes?'Not enough minutes remain.':''),enabled:!a.requires&&a.cost<=c.minutes}));
  }
  function validate(value) {
    if (!value || value.version!==1 || !['welcome','question','feedback','result'].includes(value.stage) || !Array.isArray(value.answers) || value.answers.length>4) throw new TypeError('Invalid repair file.');
    let replay=create(value.source,value.date);replay.stage='question';
    for (let i=0;i<value.answers.length;i++) {
      const id=value.answers[i];if (!ACTIONS[i].includes(id) || !options(replay).some(a=>a.id===id&&a.enabled)) throw new TypeError('Invalid repair route.');
      replay.answers.push(id);
    }
    if ((value.stage==='welcome'&&replay.answers.length!==0)||(value.stage==='question'&&replay.answers.length>=4)||(value.stage==='feedback'&&replay.answers.length===0)||(value.stage==='result'&&replay.answers.length!==4)) throw new TypeError('Invalid repair progress.');
    return {...replay,stage:value.stage};
  }
  function choose(value,id) {
    const state=validate(value);
    if (state.stage!=='question'||!options(state).some(a=>a.id===id&&a.enabled)) throw new TypeError('That repair choice is unavailable.');
    return {...state,answers:[...state.answers,id],stage:'feedback'};
  }
  function advance(value) {
    const state=validate(value);
    if (state.stage==='welcome')return {...state,stage:'question'};
    if (state.stage!=='feedback')throw new TypeError('Read the consequence first.');
    return {...state,stage:state.answers.length===4?'result':'question'};
  }
  function feedback(state) {
    state=validate(state);if (!state.answers.length) return null;
    const before={...state,answers:state.answers.slice(0,-1)};
    return transition(condition(before),state.answers.at(-1),orderFor(state.date));
  }
  function outcome(state) {
    state=validate(state);if (state.stage!=='result')throw new TypeError('Finish this repair first.');
    const c=condition(state),closed=c.work>0&&c.test>0&&c.receipt;
    return {closed,title:closed?'One useful repair. Filed.':c.tested?'A useful failure. Still open.':'An announcement. Still open.',
      stamp:closed?'REPAIR VERIFIED':'NEXT STEP REQUIRED',
      copy:closed?'The next operator inherits a tested step and a usable receipt. The reserved chair has earned its keep.':'The ticket stays open. Your next run can recover the missing brief, choose a smaller change, leave time for a test, or quiet the desk.',
      chief:closed?'The printer is demanding credit. I have given it paper.':'The office has learned something. Please do not promote it to finished.',
      returnTicket:'Tomorrow brings a different work order. You can replay today now; completing the return shift can improve the brief and authority you bring back.'};
  }
  function receiptText(state) {
    const result=outcome(state),c=condition(state);
    return 'CHIEF ROAST OFFICE — REPAIR DESK\n'+state.date+' · '+orderFor(state.date).name+'\n'+result.stamp+'\n'+c.work+' working step(s) · '+c.test+' passing test · '+(c.receipt?'receipt filed':'receipt missing')+'\n'+result.copy+'\nChief: '+result.chief+'\n'+result.returnTicket+'\nScripted fictional game · https://agentlabstudio.github.io/chief-roast-office/personnel-game.html';
  }
  return {storageKey:STORAGE_KEY,orders:ORDERS,create,validate,sourceFrom,context,orderFor,condition,options,choose,advance,feedback,outcome,receiptText};
});
