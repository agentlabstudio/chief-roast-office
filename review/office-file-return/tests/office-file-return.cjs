'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const a=html.indexOf('  const deckPacks='),b=html.indexOf('  const officeEpisodes=',a);
assert.ok(a>0&&b>a);
const source=html.slice(a,b),cards=JSON.parse(fs.readFileSync(path.join(root,'cards.json'),'utf8'));
const seenKey='roast_office_drawn_v1',currentKey='roast_office_current_file_v1';
function boot({data=new Map(),blocked=false,writeBlocked=false}={}){
 const ids=new Map(),events={},packs=['receipts','systems','office'].map(name=>({dataset:{pack:name},addEventListener(t,f){this.click=f;}}));
 for(const id of ['drawn-file','drawn-code','drawn-title','drawn-verdict','drawn-repair','drawn-return','drawn-image','drawn-download','deck-status','clear-drawn'])ids.set(id,{hidden:id==='drawn-file',textContent:'',focus(){this.focused=true;},addEventListener(t,f){this.click=f;}});
 const storage={getItem(k){if(blocked)throw Error('blocked');return data.get(k)??null;},setItem(k,v){if(blocked||writeBlocked)throw Error('blocked');data.set(k,v);},removeItem(k){if(blocked)throw Error('blocked');data.delete(k);}};
 vm.runInNewContext(source,{cards,localStorage:storage,document:{getElementById:id=>ids.get(id),querySelectorAll:()=>packs},window:{addEventListener(t,f){events[t]=f;}},Math:Object.assign(Object.create(Math),{random:()=>0})});
 return{data,ids,packs,event:(t,key)=>events[t]({key}),block:()=>blocked=true};
}
let checks=0;
for(const pack of ['receipts','systems','office']){
 const p=boot();p.packs.find(x=>x.dataset.pack===pack).click();const number=p.data.get(currentKey),card=cards.find(c=>c.number===number);
 assert.ok(card);assert.equal(p.ids.get('drawn-title').focused,true);assert.equal(p.ids.get('drawn-return').textContent,card.return_ticket);
 const q=boot({data:p.data});assert.equal(q.ids.get('drawn-code').textContent,card.code+' · '+card.disposition);assert.equal(q.ids.get('drawn-title').focused,undefined);assert.equal(q.ids.get('drawn-image').src,card.image);
 q.packs.find(x=>x.dataset.pack===pack).click();assert.notEqual(q.data.get(currentKey),number,'existing history still avoids immediate repeat');checks+=3;
 q.ids.get('clear-drawn').click();assert.equal(q.data.size,0);assert.equal(q.ids.get('drawn-file').hidden,true);assert.equal(boot({data:q.data}).ids.get('drawn-file').hidden,true);checks++;
}
for(const bad of ['999','__proto__','<img src=x onerror=alert(1)>','015<script>','null']){const p=boot({data:new Map([[currentKey,bad]])});assert.equal(p.ids.get('drawn-file').hidden,true);checks++;}
for(const bad of ['{','null','{}','["999",{},"__proto__"]']){const p=boot({data:new Map([[seenKey,bad],[currentKey,'015']])});assert.equal(p.ids.get('drawn-file').hidden,false);assert.match(p.ids.get('deck-status').textContent,/Reopened CASE-015/);checks++;}
const p=boot();p.packs[0].click();const old=p.data.get(currentKey);p.data.delete(currentKey);p.data.delete(seenKey);p.event('pageshow');assert.equal(p.ids.get('drawn-file').hidden,true);checks++;
for(const key of [seenKey,currentKey,null]){p.data.set(currentKey,old);p.event('storage',key);assert.equal(p.ids.get('drawn-file').hidden,false);p.data.clear();p.event('storage',key);assert.equal(p.ids.get('drawn-file').hidden,true);checks++;}
const blocked=boot({blocked:true});assert.match(blocked.ids.get('deck-status').textContent,/storage is unavailable/);blocked.packs[0].click();assert.equal(blocked.ids.get('drawn-file').hidden,false);assert.match(blocked.ids.get('deck-status').textContent,/keep this page open/);blocked.ids.get('clear-drawn').click();assert.equal(blocked.ids.get('drawn-file').hidden,false);assert.match(blocked.ids.get('deck-status').textContent,/Could not clear/);checks++;
for(const prior of [null,'006']){
 const data=new Map(prior?[[currentKey,prior],[seenKey,JSON.stringify([prior])]]:[]),p=boot({data,writeBlocked:true});
 p.packs[0].click();const drawn=p.ids.get('drawn-code').textContent;assert.match(p.ids.get('deck-status').textContent,/keep this page open/);
 p.event('pageshow');assert.equal(p.ids.get('drawn-file').hidden,false);assert.equal(p.ids.get('drawn-code').textContent,drawn);assert.match(p.ids.get('deck-status').textContent,/keep this page open/);
 p.packs[0].click();assert.notEqual(p.ids.get('drawn-code').textContent,drawn,'memory-only history avoids repeat after BFCache');
 data.clear();p.event('storage',null);assert.equal(p.ids.get('drawn-file').hidden,true,'explicit cross-tab clear wins over an unsaved local draw');checks++;
}
const other=new Map([['chief-coffee-shift-v1','coffee'],['chief-office-shifts-v2','personnel']]);const q=boot({data:other});q.packs[0].click();q.ids.get('clear-drawn').click();assert.deepEqual([...other.keys()],['chief-coffee-shift-v1','chief-office-shifts-v2']);checks++;
assert.ok(html.includes('id="drawn-title" tabindex="-1"'));assert.ok(html.includes('Clear opened files and current ticket'));checks++;
console.log(JSON.stringify({status:'PASS',checks,scope:'simulated DOM; no browser/layout QA'},null,2));
