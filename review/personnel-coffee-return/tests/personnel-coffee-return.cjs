'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const key='chief-coffee-shift-v1',personnelKey='chief-office-shifts-v2';
const helper=fs.readFileSync(path.join(root,'assets/coffee-progress.js'),'utf8');
const html=fs.readFileSync(process.env.PERSONNEL_SOURCE||path.join(root,'personnel-game.html'),'utf8');
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
function boot({saved=null,blocked=false,removeBlocked=false,preview=false}={}){
  const ids=new Map([...html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)].map(m=>[m[1],{hidden:/\bhidden\b/.test(m[0]),textContent:'',href:m[0].match(/href="([^"]+)"/)?.[1]}]));
  const data=new Map([[personnelKey,'personnel choices must stay untouched']]);if(saved!==null)data.set(key,saved);
  const docEvents={},winEvents={},writes=[];
  const anchors=[...html.matchAll(/<a[^>]+href="([^"]*)"[^>]*>/g)].map(m=>({href:m[1],getAttribute(){return m[1];}}));
  const context={URL,URLSearchParams,localStorage:{getItem(k){if(blocked)throw Error('blocked');return data.get(k)??null;},setItem(k,v){writes.push(k);data.set(k,v);},removeItem(k){if(blocked||removeBlocked)throw Error('blocked');data.delete(k);}},
    document:{getElementById:id=>ids.get(id),querySelectorAll:()=>anchors,addEventListener:(name,fn)=>(docEvents[name]??=[]).push(fn)},
    window:{location:{search:preview?'?chief_preview=1':'',href:'https://example.invalid/personnel-game.html',origin:'https://example.invalid'},addEventListener:(name,fn)=>(winEvents[name]??=[]).push(fn)}};
  vm.runInNewContext(helper,context);
  return{ids,data,writes,anchors,emit(name,event={}){for(const fn of winEvents[name]||[])fn(event);},clear(){const detail={};for(const fn of docEvents['chief:local-clear']||[])fn({detail});return detail;}};
}
const states=[
  {version:1,policy:'plain',route:null,phase:'feedback',action:null},
  {version:1,policy:'plain',route:null,phase:'test',action:null},
  {version:1,policy:'plain',route:'plain/show',phase:'ending',action:null},
  {version:1,policy:'plain',route:'plain/show',phase:'return',action:null},
  {version:1,policy:'plain',route:'plain/show',phase:'return-ending',action:'teach'}
];
test('Personnel exposes one accessible, initially hidden return panel before its shift',()=>{
  assert.match(html,/<section id="coffee-resume"[^>]*hidden aria-labelledby="coffee-resume-title">/);
  assert.equal((html.match(/id="coffee-resume"/g)||[]).length,1);
  assert.ok(html.indexOf('id="coffee-resume"')<html.indexOf('id="review-form"'));
  assert.match(html,/id="coffee-resume-link" href="case-021.html#coffee-desk"/);
});
for(const state of states)test('reopens '+state.phase+' without changing Personnel or coffee state',()=>{
  const saved=JSON.stringify(state),p=boot({saved});assert.equal(p.ids.get('coffee-resume').hidden,false);
  assert.ok(p.ids.get('coffee-resume-context').textContent.length>20);
  assert.match(p.ids.get('coffee-resume-link').textContent,state.phase==='return-ending'?/Reopen your coffee receipts/:/Continue your coffee shift/);
  assert.equal(p.data.get(key),saved);assert.equal(p.data.get(personnelKey),'personnel choices must stay untouched');assert.deepEqual(p.writes,[]);
});
for(const saved of [null,'bad json',JSON.stringify({...states[0],policy:'<script>'}),JSON.stringify({...states[3],route:'sign/audit'}),JSON.stringify({...states[4],action:'wrong'})])test('no false invitation for '+saved,()=>{assert.equal(boot({saved}).ids.get('coffee-resume').hidden,true);});
test('blocked local reading does not invent saved activity',()=>{assert.equal(boot({saved:JSON.stringify(states[3]),blocked:true}).ids.get('coffee-resume').hidden,true);});
test('successful Personnel clear hides resume immediately, no navigation needed',()=>{const p=boot({saved:JSON.stringify(states[3])});assert.equal(p.clear().coffeeCleared,true);assert.equal(p.ids.get('coffee-resume').hidden,true);assert.equal(p.data.has(key),false);assert.equal(p.data.has(personnelKey),true);});
test('failed clearing keeps the still-saved ticket visible and reports failure',()=>{const p=boot({saved:JSON.stringify(states[3]),removeBlocked:true});assert.equal(p.clear().coffeeCleared,false);assert.equal(p.ids.get('coffee-resume').hidden,false);});
test('other-tab clear removes stale invitation',()=>{const p=boot({saved:JSON.stringify(states[3])});p.data.delete(key);p.emit('storage',{key});assert.equal(p.ids.get('coffee-resume').hidden,true);});
test('other-tab progress refreshes pending decision into receipt',()=>{const p=boot({saved:JSON.stringify(states[3])});p.data.set(key,JSON.stringify(states[4]));p.emit('storage',{key});assert.match(p.ids.get('coffee-resume-link').textContent,/Reopen/);});
test('pageshow catches changed progress and full-storage clear',()=>{const p=boot();p.data.set(key,JSON.stringify(states[3]));p.emit('pageshow',{persisted:true});assert.equal(p.ids.get('coffee-resume').hidden,false);p.data.clear();p.emit('storage',{key:null});assert.equal(p.ids.get('coffee-resume').hidden,true);});
test('unrelated storage event cannot mutate the current invitation',()=>{const p=boot({saved:JSON.stringify(states[3])});p.data.delete(key);p.emit('storage',{key:'unrelated'});assert.equal(p.ids.get('coffee-resume').hidden,false);});
test('private preview stays private across the actual coffee anchor',()=>{const p=boot({preview:true});const link=p.anchors.find(a=>a.getAttribute('href')==='case-021.html#coffee-desk');assert.ok(link);const url=new URL(link.href);assert.equal(url.searchParams.get('chief_preview'),'1');assert.equal(url.hash,'#coffee-desk');});
console.log(`${checks} source/VM tests passed; not browser or layout QA.`);
