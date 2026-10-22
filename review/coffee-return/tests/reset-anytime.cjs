'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const suitePath=path.join(__dirname,'coffee-return.cjs'),suite=fs.readFileSync(suitePath,'utf8');
const {boot,firstReceipt,routeActions}=vm.runInNewContext(suite.slice(0,suite.indexOf('(async()=>{'))+'\n({boot,firstReceipt,routeActions})',{require:createRequire(suitePath),__dirname,console,process,URL,URLSearchParams,setTimeout});
const sourceFile=process.env.COFFEE_SOURCE||path.resolve(__dirname,'../../../case-021.html');
const html=fs.readFileSync(sourceFile,'utf8'),open=options=>boot('case-021.html',{sourceFile,...options});
function resetStructure(source){
  const stack=[],voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  let ancestors=null;
  for(const m of source.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)){
    const tag=m[1].toLowerCase();
    if(m[0].startsWith('</')){assert.equal(stack.at(-1)?.tag,tag);stack.pop();continue;}
    if(/\bid="replay"/.test(m[0])){ancestors=stack.slice();break;}
    if(!voids.has(tag)&&!m[0].endsWith('/>'))stack.push({tag,id:m[0].match(/\bid="([^"]+)"/)?.[1],hidden:/\bhidden\b/.test(m[0])});
  }
  assert.ok(ancestors,'existing reset retained');
  assert.ok(!ancestors.some(a=>a.id==='ending'),'reset must not be trapped inside ending');
  assert.equal(ancestors.at(-1).id,'replay-actions');
  assert.equal(ancestors.at(-1).hidden,true,'new-visitor reset starts hidden');
  assert.ok(!ancestors.slice(0,-1).some(a=>a.hidden),'no phase may hide persistent reset row');
  assert.equal((source.match(/\bid="replay"/g)||[]).length,1);
  assert.match(source,/id="replay" aria-describedby="replay-note"/);
  assert.match(source,/id="replay-note" hidden/);
}
let checks=0;
(async()=>{
  resetStructure(html);checks++;
  const initial=open();assert.equal(initial.$('replay-actions').hidden,true);assert.equal(initial.$('replay-note').hidden,true);
  assert.equal(initial.data.size,0);
  await initial.$('choices').children.find(b=>b.dataset.policy==='plain').click();
  assert.equal(initial.$('replay-actions').hidden,false);assert.equal(initial.$('replay-note').hidden,false);
  await initial.$('replay').click();assert.equal(initial.$('replay-actions').hidden,true);assert.equal(initial.$('replay-note').hidden,true);checks++;
  const states=[];
  for(const policy of ['plain','sign','none'])for(const phase of ['feedback','test'])states.push({version:1,policy,route:null,phase,action:null});
  for(const [route,actions]of Object.entries(routeActions)){
    for(const phase of ['ending','return'])states.push({version:1,policy:route.split('/')[0],route,phase,action:null});
    for(const action of actions)states.push({version:1,policy:route.split('/')[0],route,phase:'return-ending',action});
  }
  for(const state of states){
    const coffee=JSON.stringify(state),p=open({coffee,saved:'Personnel untouched',search:'?chief_preview=1'});
    p.data.set('roast_office_current_file_v1','021');
    assert.equal(p.data.get('chief-coffee-shift-v1'),coffee,'restore must not rewrite saves');
    assert.equal(p.$('replay-actions').hidden,false,state.phase);assert.equal(p.$('replay-note').hidden,false,state.phase);
    p.$('scene-heading').focused=false;
    await p.$('replay').click();
    assert.equal(p.$('decision').hidden,false);assert.equal(p.$('feedback').hidden,true);assert.equal(p.$('ending').hidden,true);
    assert.equal(p.$('replay-actions').hidden,true);assert.equal(p.$('replay-note').hidden,true);
    assert.equal(p.$('return-context').hidden,true);assert.equal(p.$('earlier-receipt').hidden,true);
    assert.equal(p.$('revisit-return').hidden,true);assert.equal(p.$('progress').value,0);assert.equal(p.$('progress').max,2);
    assert.equal(p.$('scene-heading').focused,true);assert.equal(p.$('scene-heading').getAttribute('aria-describedby'),null);
    assert.equal(p.$('choices').children.length,3);assert.equal(p.data.has('chief-coffee-shift-v1'),false);
    assert.equal(p.data.get('chief-office-shifts-v2'),'Personnel untouched');assert.equal(p.data.get('roast_office_current_file_v1'),'021');
    const feedback=new URL(p.$('episode-feedback').href,'https://example.invalid');
    assert.equal(feedback.searchParams.get('chief_preview'),'1');assert.equal(feedback.searchParams.has('route'),false);
    p.windowEvent('pageshow',{persisted:true});assert.equal(p.reloadRequests(),0);
    await firstReceipt(p,'none/wait');assert.equal(p.$('replay-actions').hidden,false);
    await p.$('return-coffee').click();assert.equal(p.$('replay-actions').hidden,false);checks++;
  }
  const blocked=open({blocked:true});await firstReceipt(blocked,'plain/show');await blocked.$('return-coffee').click();
  await blocked.$('replay').click();assert.match(blocked.$('coffee-save-status').textContent,/could not be cleared/);
  assert.equal(blocked.$('choices').children.length,3);assert.equal(blocked.$('replay-actions').hidden,true);
  blocked.windowEvent('pageshow',{persisted:true});assert.equal(blocked.reloadRequests(),0);checks++;
  console.log(JSON.stringify({status:'PASS',checks,restored_states:states.length,scope:'source/VM; not browser/layout QA'}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
