'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
// Reuse the actual inline-UI harness without executing the historical suite.
const suitePath=path.join(__dirname,'coffee-return.cjs'),suite=fs.readFileSync(suitePath,'utf8');
const {boot,firstReceipt,receipt,routeActions}=vm.runInNewContext(suite.slice(0,suite.indexOf('(async()=>{'))+'\n({boot,firstReceipt,receipt,routeActions})',{require:createRequire(suitePath),__dirname,console,process,URL,URLSearchParams,setTimeout});
const sourceFile=process.env.COFFEE_SOURCE||path.resolve(__dirname,'../../../case-021.html');
const open=options=>boot('case-021.html',{sourceFile,...options});
let checks=0;
(async()=>{
  const initial=open();assert.ok(initial.$('revisit-return'),'completed players need a next-shift-only replay control');
  assert.equal(initial.$('revisit-return').hidden,true);
  assert.match(initial.html,/id="revisit-return"[^>]*aria-describedby="revisit-note"/);checks++;
  for(const [route,actions] of Object.entries(routeActions))for(const action of actions){
    const p=open({search:'?chief_preview=1',saved:'personnel untouched'});
    await p.$('revisit-return').click();assert.equal(p.$('progress').value,'');
    await firstReceipt(p,route);const first=p.$('ending-result').textContent;
    assert.equal(p.$('revisit-return').hidden,true);
    await p.$('return-coffee').click();await p.$('choices').children.find(b=>b.dataset.action===action).click();
    const oldReceipt=receipt(p),oldSave=p.data.get('chief-coffee-shift-v1');
    assert.equal(p.$('revisit-return').hidden,false);
    // Earlier choices also focused this heading; require a fresh transfer now.
    p.$('scene-heading').focused=false;
    await p.$('revisit-return').click();
    assert.equal(p.$('decision').hidden,false);assert.equal(p.$('ending').hidden,true);
    assert.equal(p.$('return-context').hidden,false);assert.equal(p.$('return-previous').textContent,first);
    assert.equal(p.$('scene-heading').focused,true,'revisit must freshly focus the decision heading');assert.equal(p.$('progress').value,2);
    assert.equal(p.$('revisit-return').hidden,true);assert.equal(p.$('revisit-note').hidden,true);
    assert.equal(p.$('earlier-receipt').hidden,true);
    const state=JSON.parse(p.data.get('chief-coffee-shift-v1'));
    assert.deepEqual(state,{version:1,policy:route.split('/')[0],route,phase:'return',action:null});
    assert.equal(p.data.get('chief-office-shifts-v2'),'personnel untouched');
    assert.ok(!new URL(p.$('episode-feedback').href,'https://example.invalid').searchParams.get('route').includes('/'+action));
    const pending=p.data.get('chief-coffee-shift-v1');await p.$('revisit-return').click();assert.equal(p.data.get('chief-coffee-shift-v1'),pending);
    p.windowEvent('pageshow',{persisted:true});assert.equal(p.reloadRequests(),0);
    const q=open({coffee:pending,search:'?chief_preview=1'});assert.equal(q.$('scene-heading').textContent,'The next shift inherits your rule.');
    const other=actions.find(id=>id!==action);await q.$('choices').children.find(b=>b.dataset.action===other).click();
    assert.notEqual(q.$('ending-heading').textContent,oldReceipt[0]);assert.equal(q.$('earlier-result').textContent,first);
    assert.equal(JSON.parse(q.data.get('chief-coffee-shift-v1')).action,other);
    assert.equal(new URL(q.$('episode-feedback').href,'https://example.invalid').searchParams.get('chief_preview'),'1');
    const restored=open({coffee:q.data.get('chief-coffee-shift-v1')});assert.equal(restored.$('revisit-return').hidden,false);
    await restored.$('revisit-return').click();await restored.$('replay').click();
    assert.equal(restored.data.has('chief-coffee-shift-v1'),false);assert.equal(restored.$('revisit-return').hidden,true);
    assert.equal(restored.$('choices').children.length,3);
    // Readable but write-denied storage must not erase the in-memory revisit on BFCache return.
    const denied=open({coffee:oldSave,writeBlocked:true});await denied.$('revisit-return').click();
    assert.match(denied.$('coffee-save-status').textContent,/unavailable/);denied.windowEvent('pageshow',{persisted:true});
    assert.equal(denied.reloadRequests(),0);assert.equal(denied.$('decision').hidden,false);
    await denied.$('choices').children.find(b=>b.dataset.action===other).click();assert.notEqual(denied.$('ending-heading').textContent,oldReceipt[0]);
    assert.equal(denied.data.get('chief-coffee-shift-v1'),oldSave);checks++;
  }
  const blocked=open({blocked:true});await firstReceipt(blocked,'none/wait');await blocked.$('return-coffee').click();await blocked.$('choices').children[0].click();
  await blocked.$('revisit-return').click();assert.equal(blocked.$('choices').children.length,2);assert.match(blocked.$('coffee-save-status').textContent,/unavailable/);checks++;
  console.log(JSON.stringify({status:'PASS',checks,all_return_outcomes:12,scope:'source/VM; not real browser QA'}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
