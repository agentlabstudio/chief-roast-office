'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const html=fs.readFileSync(process.env.OFFICE_SOURCE==='-'?0:process.env.OFFICE_SOURCE||path.join(root,'index.html'),'utf8');
const helper=fs.readFileSync(path.join(root,'assets/coffee-progress.js'),'utf8');
const cards=JSON.parse(fs.readFileSync(path.join(root,'cards.json'),'utf8'));
const start=html.indexOf('  const deckPacks='),end=html.indexOf('  const officeEpisodes=',start);
const currentKey='roast_office_current_file_v1',seenKey='roast_office_drawn_v1';
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
function boot({current=null,blocked=false,writeBlocked=false,preview=false,random=0}={}){
  const ids=new Map([...html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)].map(m=>[m[1],{hidden:/\bhidden\b/.test(m[0]),href:m[0].match(/href="([^"]+)"/)?.[1],textContent:'',attributes:{},focus(){this.focused=true;},setAttribute(k,v){this.attributes[k]=v;},addEventListener(t,f){this[t]=f;}}]));
  const anchors=[...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>/g)].map(m=>{const id=m[0].match(/\bid="([^"]+)"/)?.[1];const a=ids.get(id)||{};a.getAttribute=()=>m[1];return a;});
  const data=new Map([['chief-coffee-shift-v1','unchanged coffee'],['chief-office-shifts-v2','unchanged personnel']]);
  if(current!==null)data.set(currentKey,current);
  const writes=[],events={},packs=['receipts','systems','office'].map(pack=>({dataset:{pack},addEventListener(t,f){this[t]=f;}}));
  const context={cards,URL,URLSearchParams,Math:Object.assign(Object.create(Math),{random:()=>random}),localStorage:{getItem(k){if(blocked)throw Error('blocked');return data.get(k)??null;},setItem(k,v){if(blocked||writeBlocked)throw Error('blocked');writes.push(k);data.set(k,v);},removeItem(k){if(blocked)throw Error('blocked');writes.push(k);data.delete(k);}},document:{getElementById:id=>ids.get(id),querySelectorAll:q=>q==='a[href]'?anchors:packs,addEventListener(){}},window:{location:{search:preview?'?chief_preview=1':'',href:'https://example.invalid/index.html',origin:'https://example.invalid'},addEventListener(t,f){(events[t]??=[]).push(f);}}};
  // The real page's async catalog code can run after the shared preview helper.
  vm.runInNewContext(helper,context);
  vm.runInNewContext(html.slice(start,end),context);
  return{ids,data,writes,packs,emit(t,key){for(const fn of events[t]||[])fn({key});}};
}
test('one initially hidden contextual action points straight to the existing decision',()=>{
  assert.equal((html.match(/id="drawn-play"/g)||[]).length,1);
  assert.match(html,/<a id="drawn-play"[^>]*href="case-021.html#coffee-desk"[^>]*hidden>Play this coffee case →<\/a>/);
  assert.ok(html.indexOf('id="drawn-play"')>html.indexOf('id="drawn-file"'));
  assert.ok(html.indexOf('id="drawn-play"')<html.indexOf('id="deck-status"'));
  assert.equal(boot().ids.get('drawn-play').hidden,true);
});
for(const card of cards)test('restored '+card.code+' respects the coffee action allowlist',()=>{
  const p=boot({current:card.number});assert.equal(p.ids.get('drawn-play').hidden,card.number!=='021');
  assert.deepEqual(p.writes,[],'restoring a file does not write any save');
});
test('first-time Office draw exposes coffee without requiring Telegram or a saved game',()=>{
  const p=boot({random:.999999});p.packs[2].click();assert.match(p.ids.get('drawn-code').textContent,/CASE-021/);assert.equal(p.ids.get('drawn-play').hidden,false);
  assert.deepEqual([...new Set(p.writes)].sort(),[currentKey,seenKey].sort());
  assert.equal(p.data.get('chief-coffee-shift-v1'),'unchanged coffee');assert.equal(p.data.get('chief-office-shifts-v2'),'unchanged personnel');
});
test('switching to another file removes a stale coffee action',()=>{const p=boot({current:'021'});p.packs[0].click();assert.equal(p.ids.get('drawn-play').hidden,true);});
test('cross-tab return, replacement and clear reconcile the contextual action',()=>{
  const p=boot({current:'015'});p.data.set(currentKey,'021');p.emit('storage',currentKey);assert.equal(p.ids.get('drawn-play').hidden,false);
  p.data.set(currentKey,'016');p.emit('pageshow');assert.equal(p.ids.get('drawn-play').hidden,true);
  p.data.set(currentKey,'021');p.emit('storage',currentKey);p.ids.get('clear-drawn').click();p.ids.get('confirm-clear-drawn').click();assert.equal(p.ids.get('drawn-file').hidden,true);
});
for(const options of [{blocked:true},{writeBlocked:true}])test('memory-only coffee draw remains playable with '+JSON.stringify(options),()=>{const p=boot({...options,random:.999999});p.packs[2].click();assert.equal(p.ids.get('drawn-play').hidden,false);p.emit('pageshow');assert.equal(p.ids.get('drawn-file').hidden,false);assert.equal(p.ids.get('drawn-play').hidden,false);});
test('private preview survives late card rendering and retains the decision fragment',()=>{
  const p=boot({current:'021',preview:true}),target=new URL(p.ids.get('drawn-play').href);
  assert.equal(target.origin,'https://example.invalid');assert.equal(target.pathname,'/case-021.html');assert.equal(target.searchParams.get('chief_preview'),'1');assert.equal(target.hash,'#coffee-desk');
  const game=fs.readFileSync(path.join(root,'case-021.html'),'utf8');assert.match(game,/id="coffee-desk"/);
});
console.log(`${checks} source/VM tests passed; not browser, focus or layout QA.`);

