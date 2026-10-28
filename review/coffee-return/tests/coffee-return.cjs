'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
class Element {
  constructor(tag='div',id=''){this.tagName=tag.toUpperCase();this.id=id;this.hidden=false;this.children=[];this.listeners={};this.textContent='';this.value='';this.style={};this.dataset={};this.attributes={};this.parentNode=null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  append(...children){children.forEach(c=>this.appendChild(c));}
  appendChild(child){this.children.push(child);child.parentNode=this;return child;}
  replaceChildren(...children){this.children.forEach(c=>c.parentNode=null);this.children=[];this.append(...children);}
  focus(){this.focused=true;}select(){this.selected=true;}remove(){}
  setAttribute(key,value){this.attributes[key]=String(value);}
  removeAttribute(key){delete this.attributes[key];if(key==='href')delete this.href;}
  getAttribute(key){return this.attributes[key]??null;}
  closest(tag){return this.tagName===tag.toUpperCase()?this:this.parentNode?.closest(tag);}
  contains(child){return child===this||this.children.some(c=>c.contains(child));}
  async click(){const event={target:this,preventDefault(){}};let current=this;while(current){for(const fn of current.listeners.click||[])await fn(event);current=current.parentNode;}}
}
function boot(file,{saved=null,blocked=false,writeBlocked=false,search='',sourceFile=null,coffee=null,helperOnly=false}={}){
  const html=fs.readFileSync(sourceFile || (fs.existsSync(path.join(root,'candidate',file)) ? path.join(root,'candidate',file) : path.resolve(root,'../..',file)),'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const ids=new Map([...html.matchAll(/<([\w-]+)[^>]*\bid="([^"]+)"[^>]*>/g)].map(m=>{const el=new Element(m[1],m[2]);el.hidden=/\bhidden\b/.test(m[0]);el.className=m[0].match(/\bclass="([^"]*)"/)?.[1]||'';return[m[2],el];}));
  const data=new Map();if(saved)data.set('chief-office-shifts-v2',saved);if(coffee)data.set('chief-coffee-shift-v1',coffee);
  const fills=[];let cy=0;const canvasContext={font:'',measureText(text){const n=Number(this.font.match(/(\d+)px/)?.[1]||16);return{width:String(text).length*n*.6};},fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},save(){},restore(){cy=0;},translate(x,y){cy=y;},rotate(){},fillText(text,x,y){fills.push({text,x,y:y+cy});}};
  const anchors=[...html.matchAll(/<a[^>]+href="([^"]*)"[^>]*>/g)].map(m=>{const a=new Element('a');a.setAttribute('href',m[1]);a.href=m[1];return a;});
  const docListeners={};const doc={querySelectorAll:()=>anchors,getElementById:id=>{return ids.get(id)||null;},body:new Element('body'),createElement:tag=>{const e=new Element(tag);if(tag==='canvas'){e.getContext=()=>canvasContext;e.toBlob=cb=>cb({size:1});}return e;},dispatchEvent(event){for(const fn of docListeners[event.type]||[])fn(event);},addEventListener(type,fn){(docListeners[type]??=[]).push(fn);}};
  if(file==='case-021.html')for(const m of html.matchAll(/<button[^>]*data-policy="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)){const b=new Element('button');b.dataset.policy=m[1];ids.get('choices').appendChild(b);}
  const storage={getItem:k=>{if(blocked)throw Error('blocked');return data.get(k)??null;},setItem:(k,v)=>{if(blocked||writeBlocked)throw Error('blocked');data.set(k,v);},removeItem:k=>{if(blocked)throw Error('blocked');data.delete(k);}};
  const windowListeners={};let reloadRequests=0;const context={window:{location:{search,href:'https://example.invalid/'+file+search,origin:'https://example.invalid',reload(){reloadRequests++;}},addEventListener(type,fn){(windowListeners[type]??=[]).push(fn);}},document:doc,localStorage:storage,navigator:{},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},URLSearchParams,URL:Object.assign(URL,{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}}),setTimeout:()=>0};
  if(html.includes('src="assets/coffee-progress.js"'))vm.runInNewContext(fs.readFileSync(path.resolve(root,'../../assets/coffee-progress.js'),'utf8'),context);
  if(!helperOnly)vm.runInNewContext(script,context,{timeout:1000});return{anchors,ids,data,fills,context,html,windowEvent:(type,event)=>{for(const fn of windowListeners[type]||[])fn(event);},reloadRequests:()=>reloadRequests,$:id=>ids.get(id)};
}
const legacyFile=path.resolve(__dirname,'fixtures/case-021-before-return.html');
const routeActions={
  'plain/show':['teach','chief'], 'plain/point':['show','pair'],
  'sign/replace':['backup','batch'], 'sign/audit':['release','finish'],
  'none/assign':['split','round'], 'none/wait':['volunteer','rotate']
};
const expectedInvitations={
  'plain/show':'Next shift: teach now or protect a deadline →',
  'plain/point':'Next shift: the newcomer still needs help →',
  'sign/replace':'Next shift: the refill meets a real deadline →',
  'sign/audit':'Next shift: the audit is done. The pot is empty →',
  'none/assign':'Next shift: the pot is too heavy →',
  'none/wait':'Next shift: who will end the waiting? →'
};
async function firstReceipt(page,route){const [policy,action]=route.split('/');await page.$('choices').children.find(b=>b.dataset.policy===policy).click();await page.$('test-policy').click();await page.$('choices').children.find(b=>b.dataset.action===action).click();}
async function resetCoffee(page){await page.$('replay').click();await page.$('confirm-replay').click();}
function receipt(page){return ['ending-heading','ending-rule','ending-result','ending-next','ending-chief','ending-stamp'].map(id=>page.$(id).textContent);}
(async()=>{
  const records=[];const distinct=new Set();let invalid=0;
  for(const [route,actions] of Object.entries(routeActions)){
    const old=boot('case-021.html',{sourceFile:legacyFile});await firstReceipt(old,route);
    for(const action of actions){
      const p=boot('case-021.html',{search:'?chief_preview=1'});
      await p.$('return-coffee').click();assert.equal(p.$('progress').value,''); // hidden future action has no effect before play
      await firstReceipt(p,route);
      assert.deepEqual(receipt(p),receipt(old),'unchanged first receipt '+route);
      assert.equal(p.$('progress').value,2);assert.equal(p.$('progress').max,2);
      assert.equal(p.$('earlier-receipt').hidden,true);assert.equal(p.$('return-coffee').hidden,false);
      assert.equal(p.$('return-coffee').textContent,expectedInvitations[route]);
      assert.equal(p.$('return-coffee').className,'primary');assert.equal(p.$('replay').className,'secondary');
      assert.ok(p.$('return-coffee').listeners.click.length);assert.ok(p.$('replay').listeners.click.length);
      const initialFeedback=new URL(p.$('episode-feedback').href,'https://example.invalid/');
      assert.equal(initialFeedback.searchParams.get('feedback'),'coffee-20261015-review');assert.equal(initialFeedback.searchParams.get('route'),route);
      const earlier=p.$('ending-result').textContent;
      await p.$('return-coffee').click();assert.equal(p.$('ending').hidden,true);assert.equal(p.$('decision').hidden,false);
      assert.equal(p.$('return-context').hidden,false);assert.equal(p.$('return-previous').textContent,earlier);
      assert.equal(p.$('scene-heading').getAttribute('aria-describedby'),'return-previous');
      assert.equal(p.$('progress').max,3);assert.equal(p.$('progress-text').textContent,'Decision 3 of 3');
      assert.equal(p.$('choices').children.length,2);
      const target=p.$('choices').children.find(b=>b.dataset.action===action);assert.ok(target);
      for(const bad of ['__proto__','constructor','wrong-route',route+'/x']){target.dataset.action=bad;await target.click();assert.equal(p.$('ending').hidden,true);assert.equal(p.$('progress').value,2);invalid++;}
      target.dataset.action=action;await target.click();
      assert.equal(p.$('progress').value,3);assert.equal(p.$('progress-text').textContent,'3 decisions filed');
      assert.equal(p.$('earlier-receipt').hidden,false);assert.equal(p.$('earlier-result').textContent,earlier);
      assert.equal(p.$('return-coffee').hidden,true);assert.equal(p.$('return-context').hidden,true);
      assert.equal(p.$('ending').hidden,false);assert.equal(p.$('ending-heading').focused,true);
      for(const text of receipt(p)){assert.ok(text.length>8);assert.ok(!/undefined|\[object Object\]/.test(text));}
      const url=new URL(p.$('episode-feedback').href,'https://example.invalid/');
      assert.equal(url.searchParams.get('feedback'),'coffee-20261015-review');assert.equal(url.searchParams.get('route'),route+'/'+action);assert.equal(url.searchParams.get('chief_preview'),'1');
      const final=receipt(p);await p.$('return-coffee').click();await target.click();assert.deepEqual(receipt(p),final,'duplicate/stale completion cannot advance');
      distinct.add(p.$('ending-heading').textContent);records.push({route:route+'/'+action,title:p.$('ending-heading').textContent});
      await resetCoffee(p);assert.equal(p.$('progress').value,0);assert.equal(p.$('progress').max,2);
      assert.equal(p.$('ending').hidden,true);assert.equal(p.$('return-context').hidden,true);assert.equal(p.$('earlier-receipt').hidden,true);assert.equal(p.$('return-coffee').hidden,false);
      assert.equal(p.$('choices').children.length,3);assert.ok(!p.$('episode-feedback').href.includes('route='));assert.equal(p.data.size,0);
      assert.equal(p.$('return-coffee').textContent,'Take the next shift →');assert.equal(p.$('return-coffee').className,'primary');assert.equal(p.$('replay').className,'secondary');
      assert.equal(new URL(p.$('episode-feedback').href,'https://example.invalid/').searchParams.get('feedback'),'coffee-20261015-review');
      assert.equal(p.$('scene-heading').getAttribute('aria-describedby'),null);
      const routes=Object.keys(routeActions),nextRoute=routes[(routes.indexOf(route)+1)%routes.length];
      await firstReceipt(p,nextRoute);assert.equal(p.$('return-coffee').textContent,expectedInvitations[nextRoute]);
      assert.equal(p.$('earlier-receipt').hidden,true);assert.equal(p.$('return-coffee').hidden,false);
      assert.equal(new URL(p.$('episode-feedback').href,'https://example.invalid/').searchParams.get('route'),nextRoute);
      assert.ok(!/fetch\(|sessionStorage/.test(p.html));
    }
  }
  assert.equal(distinct.size,12);
  const signals=fs.readFileSync((fs.existsSync(path.join(root,'candidate/assets/office-signals.js')) ? path.join(root,'candidate/assets/office-signals.js') : path.resolve(root,'../../assets/office-signals.js')),'utf8');
  const start=signals.indexOf('  function feedbackContext('),end=signals.indexOf('  function init()',start);
  const parse=vm.runInNewContext(signals.slice(start,end)+'\nfeedbackContext',{URLSearchParams});
  let contexts=0;
  for(const [route,actions] of Object.entries(routeActions)){
    for(const key of ['coffee-20261015','coffee-20261015-return','coffee-20261015-review']){const c=parse(new URLSearchParams({feedback:key,route}));assert.ok(c.label.endsWith('route '+route));contexts++;}
    for(const action of actions){const full=route+'/'+action;for(const key of ['coffee-20261015-return','coffee-20261015-review']){const c=parse(new URLSearchParams({feedback:key,route:full}));assert.ok(c.label.endsWith('route '+full));assert.ok(c.label.length<150);contexts++;}
      const legacy=parse(new URLSearchParams({feedback:'coffee-20261015',route:full}));assert.equal(legacy.label,'Coffee CASE-021 · coffee-20261015');}
  }
  for(const key of ['coffee-20261015-return','coffee-20261015-review'])for(const route of ['<script>alert(1)</script>','plain/show/rotate','constructor','none/wait/rotate/extra']){const c=parse(new URLSearchParams({feedback:key,route}));assert.equal(c.label,'Coffee CASE-021 · '+key);invalid++;}
  for(const key of ['coffee-20261015-return-evil','coffee-20261015-review-evil','coffee-20261015-review/extra'])assert.equal(parse(new URLSearchParams({feedback:key,route:'plain/show/teach'})),null);
  // Frozen pre-review parser from f95b215d66d5b6af0076cda7cc742bf96ff76c5d.
  // Keep this test portable:
  // the original author's untracked game-next checkout is not part of the repo.
  const legacySignals=fs.readFileSync(path.join(__dirname,'fixtures/office-signals-before-review.js'),'utf8');
  const legacyParse=vm.runInNewContext(legacySignals.slice(legacySignals.indexOf('  function feedbackContext('),legacySignals.indexOf('  function init()'))+'\nfeedbackContext',{URLSearchParams});
  let legacyContexts=0;
  for(const [route,actions]of Object.entries(routeActions))for(const key of ['coffee-20261015','coffee-20261015-return'])for(const selectedRoute of [route,...(key==='coffee-20261015-return'?actions.map(action=>route+'/'+action):[])]){
    const query=new URLSearchParams({feedback:key,route:selectedRoute});assert.equal(JSON.stringify(parse(query)),JSON.stringify(legacyParse(query)));legacyContexts++;
  }
  let reloads=0;
  const reload=p=>{reloads++;return boot('case-021.html',{coffee:p.data.get('chief-coffee-shift-v1')});};
  for(const [route,actions] of Object.entries(routeActions)){
    const policy=route.split('/')[0];
    let p=boot('case-021.html');await p.$('choices').children.find(b=>b.dataset.policy===policy).click();
    p=reload(p);assert.equal(p.$('feedback').hidden,false);assert.ok(p.$('feedback-copy').textContent.length>10);
    await p.$('test-policy').click();p=reload(p);assert.equal(p.$('scene-heading').textContent,'The first empty-pot test.');
    await p.$('choices').children.find(b=>b.dataset.action===route.split('/')[1]).click();
    const original=receipt(p);p=reload(p);assert.deepEqual(receipt(p),original);assert.equal(p.$('return-coffee').textContent,expectedInvitations[route]);
    await p.$('return-coffee').click();const returnSnapshot=p.data.get('chief-coffee-shift-v1');p=reload(p);
    assert.equal(p.$('scene-heading').textContent,'The next shift inherits your rule.');assert.equal(p.$('progress').value,2);
    assert.equal(p.$('return-previous').textContent,original[2]);
    for(const action of actions){
      let q=boot('case-021.html',{coffee:returnSnapshot,saved:'untouched-personnel'});
      await q.$('choices').children.find(b=>b.dataset.action===action).click();
      const final=receipt(q);q=boot('case-021.html',{coffee:q.data.get('chief-coffee-shift-v1'),saved:'untouched-personnel'});reloads++;
      assert.deepEqual(receipt(q),final);assert.equal(q.$('earlier-result').textContent,original[2]);assert.equal(q.$('progress').value,3);
      assert.equal(q.$('return-coffee').hidden,true);
      const stable=q.data.get('chief-coffee-shift-v1');await q.$('return-coffee').click();assert.equal(q.data.get('chief-coffee-shift-v1'),stable);
      assert.equal(q.data.get('chief-office-shifts-v2'),'untouched-personnel');
      await resetCoffee(q);assert.equal(q.data.has('chief-coffee-shift-v1'),false);assert.equal(q.data.get('chief-office-shifts-v2'),'untouched-personnel');
    }
  }
  for(const coffee of ['{bad','null',JSON.stringify({version:2,policy:'plain'}),JSON.stringify({version:1,policy:'none',route:'plain/show',phase:'return',action:null}),JSON.stringify({version:1,policy:'plain',route:'plain/show',phase:'return-ending',action:'rotate'})]){
    const p=boot('case-021.html',{coffee});assert.equal(p.$('ending').hidden,true);assert.equal(p.$('return-context').hidden,true);
  }
  const blocked=boot('case-021.html',{blocked:true});await firstReceipt(blocked,'plain/show');assert.match(blocked.$('coffee-save-status').textContent,/unavailable/);assert.equal(blocked.$('ending').hidden,false);
  const coffeeSnapshot=JSON.stringify({version:1,policy:'plain',route:'plain/show',phase:'return',action:null});
  // A BFCache return must not reload away a playable memory-only shift.
  let memoryReturns=0;
  for(const options of [{blocked:true},{writeBlocked:true},{writeBlocked:true,coffee:coffeeSnapshot}]){
    const p=boot('case-021.html',options);
    if(options.coffee){await p.$('choices').children.find(b=>b.dataset.action==='teach').click();}
    else await firstReceipt(p,'plain/show');
    const before=receipt(p),status=p.$('coffee-save-status').textContent;
    p.windowEvent('pageshow',{persisted:false});assert.equal(p.reloadRequests(),0);
    p.windowEvent('pageshow',{persisted:true});assert.equal(p.reloadRequests(),0,'BFCache preserves memory-only play');
    assert.deepEqual(receipt(p),before);assert.equal(p.$('coffee-save-status').textContent,status);
    p.windowEvent('storage',{key:null});assert.equal(p.reloadRequests(),1,'explicit cross-tab clear still wins');memoryReturns++;
  }
  const unchanged=boot('case-021.html');await firstReceipt(unchanged,'plain/show');
  unchanged.windowEvent('pageshow',{persisted:true});assert.equal(unchanged.reloadRequests(),0,'unchanged saved shift needs no reload');
  unchanged.data.set('chief-coffee-shift-v1',coffeeSnapshot);unchanged.windowEvent('pageshow',{persisted:true});
  assert.equal(unchanged.reloadRequests(),1,'another saved phase replaces the cached page');
  const unsavedClear=boot('case-021.html',{writeBlocked:true,coffee:coffeeSnapshot});
  await unsavedClear.$('choices').children.find(b=>b.dataset.action==='teach').click();
  unsavedClear.data.delete('chief-coffee-shift-v1');unsavedClear.windowEvent('pageshow',{persisted:true});
  assert.equal(unsavedClear.reloadRequests(),1,'changed persisted clear wins over memory-only play');
  const replayed=boot('case-021.html',{coffee:coffeeSnapshot});
  await replayed.$('choices').children.find(b=>b.dataset.action==='teach').click();await resetCoffee(replayed);
  replayed.windowEvent('pageshow',{persisted:true});assert.equal(replayed.reloadRequests(),0,'own replay updates persisted baseline');
  assert.equal(replayed.$('choices').children.length,3);
  const personnel=boot('personnel-game.html',{coffee:coffeeSnapshot});await personnel.$('clear-file').click();await personnel.$('confirm-clear').click();assert.equal(personnel.data.has('chief-coffee-shift-v1'),false);
  const cached=boot('case-021.html',{coffee:coffeeSnapshot});cached.data.delete('chief-coffee-shift-v1');
  cached.windowEvent('pageshow',{persisted:true});assert.equal(cached.reloadRequests(),1);
  cached.windowEvent('storage',{key:'other-game'});assert.equal(cached.reloadRequests(),1);
  cached.windowEvent('storage',{key:'chief-coffee-shift-v1'});assert.equal(cached.reloadRequests(),2);
  cached.windowEvent('storage',{key:null});assert.equal(cached.reloadRequests(),3);
  assert.equal(boot('case-021.html',{coffee:cached.data.get('chief-coffee-shift-v1')}).$('return-context').hidden,true);
  const noResume=boot('index.html',{helperOnly:true});assert.equal(noResume.$('coffee-resume').hidden,true);
  for(const phase of ['feedback','test','ending','return','return-ending']){
    const saved={version:1,policy:'plain',route:['feedback','test'].includes(phase)?null:'plain/show',phase,action:phase==='return-ending'?'teach':null};
    const home=boot('index.html',{helperOnly:true,coffee:JSON.stringify(saved),search:'?chief_preview=1'});
    assert.equal(home.$('coffee-resume').hidden,false);assert.ok(home.$('coffee-resume-context').textContent.length>20);assert.ok(home.$('coffee-resume-link').textContent.includes(phase==='return-ending'?'Reopen':'Continue'));
    for(const a of home.anchors){if(a.href.startsWith('https://example.invalid/')&&!/assets\//.test(a.href))assert.equal(new URL(a.href).searchParams.get('chief_preview'),'1');}
    home.data.clear();home.windowEvent('storage',{key:null});assert.equal(home.$('coffee-resume').hidden,true);
  }
  const report={pass:true,office_resume_phases:5,preview_internal_links_preserved:true,bfcache_and_cross_tab_reconcile:true,bfcache_memory_return_cases:memoryReturns,bfcache_changed_store_and_clear_win:true,bfcache_own_save_and_replay_stable:true,reload_phase_checks:reloads,invalid_saves_rejected:5,blocked_storage_playable:true,office_clear_removes_coffee:true,original_receipts_unchanged:6,optional_return_routes:records,contextual_primary_ctas:6,replay_secondary_and_available:true,invalid_actions_or_contexts_rejected:invalid,allowed_feedback_contexts:contexts,legacy_contexts_unchanged:legacyContexts,replay_resets:12,cross_route_replay_cta_resets:12,network_requests_sent:0,storage_scope:'chief-coffee-shift-v1 only; personnel preserved except explicit office clear',method:'Actual inline UI and feedback parser in minimal simulated DOM; no browser/layout/physical-device claims.'};
  fs.writeFileSync(path.join(__dirname,'coffee-return-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,optional_return_routes:records.length}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

