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
function boot(file,{saved=null,blocked=false,search=''}={}){
  const html=fs.readFileSync(path.join(root,'candidate',file),'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const ids=new Map([...html.matchAll(/<([\w-]+)[^>]*\bid="([^"]+)"[^>]*>/g)].map(m=>{const el=new Element(m[1],m[2]);el.hidden=/\bhidden\b/.test(m[0]);return[m[2],el];}));
  const data=new Map();if(saved)data.set('chief-office-shifts-v2',saved);
  const fills=[];let cy=0;const canvasContext={font:'',measureText(text){const n=Number(this.font.match(/(\d+)px/)?.[1]||16);return{width:String(text).length*n*.6};},fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},save(){},restore(){cy=0;},translate(x,y){cy=y;},rotate(){},fillText(text,x,y){fills.push({text,x,y:y+cy});}};
  const doc={getElementById:id=>{assert.ok(ids.has(id),'id '+id);return ids.get(id);},body:new Element('body'),createElement:tag=>{const e=new Element(tag);if(tag==='canvas'){e.getContext=()=>canvasContext;e.toBlob=cb=>cb({size:1});}return e;},dispatchEvent(){},addEventListener(){}};
  if(file==='case-021.html')for(const m of html.matchAll(/<button[^>]*data-policy="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)){const b=new Element('button');b.dataset.policy=m[1];ids.get('choices').appendChild(b);}
  const storage={getItem:k=>{if(blocked)throw Error('blocked');return data.get(k)??null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');data.set(k,v);},removeItem:k=>{if(blocked)throw Error('blocked');data.delete(k);}};
  const context={window:{location:{search}},document:doc,localStorage:storage,navigator:{},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},URLSearchParams,URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}},setTimeout:()=>0};
  vm.runInNewContext(script,context,{timeout:1000});return{ids,data,fills,context,html,$:id=>ids.get(id)};
}
async function pick(page,index){const b=page.$('choices').children.find(b=>b.dataset.choice===String(index));assert.ok(b);await b.click();}
(async()=>{
  let personnelChecks=0;
  const page=boot('personnel-game.html',{search:'?chief_preview=1'});assert.equal(page.$('welcome').hidden,false);assert.equal(page.$('carry-forward').hidden,true);assert.equal(page.$('coffee-next').href,'case-021.html?chief_preview=1');personnelChecks++;
  await page.$('start').click();
  for(let i=0;i<6;i++){await pick(page,i===1?1:0);assert.equal(page.$('feedback').hidden,false);assert.equal(page.$('carry-forward-list').children.length,Math.min(i+1,3));if(i===1)assert.match(page.$('carry-forward-list').children[1].textContent,/clear brief/);await page.$('next').click();}
  assert.equal(page.$('shift-end').hidden,false);assert.equal(page.$('carry-forward-list').children.length,3);personnelChecks++;
  const saved=page.data.get('chief-office-shifts-v2'),reloaded=boot('personnel-game.html',{saved});assert.equal(reloaded.$('shift-end').hidden,false);assert.equal(reloaded.$('carry-forward-list').children.length,3);personnelChecks++;
  await reloaded.$('copy').click();assert.equal(reloaded.$('copy-fallback').selected,true);assert.match(reloaded.$('copy-fallback').value,/Filed decision/);personnelChecks++;
  const api=page.context.window.roastOfficeGame;let exports=0;
  for(const first of [0,1,2])for(const rest of [0,1,2]){page.fills.length=0;const card=api.reviewFor([first,rest,rest,rest,rest,rest],0),canvas=page.context.window.roastCardCanvas(card);assert.ok(page.fills.every(p=>p.y>=0&&p.y<canvas.height));assert.ok(canvas.height>=1350);exports++;}
  await reloaded.$('return-shift').click();assert.equal(reloaded.$('carry-forward').hidden,true);assert.equal(reloaded.$('scene-heading').textContent,'The returning visitor has a result');for(let i=0;i<5;i++){await pick(reloaded,0);await reloaded.$('next').click();}assert.equal(reloaded.$('archive-list').children.length,1);await reloaded.$('archive-list').children[0].click();assert.match(reloaded.$('result-status').textContent,/earlier local review/);personnelChecks++;
  await reloaded.$('replay').click();assert.equal(reloaded.$('carry-forward').hidden,true);assert.equal(reloaded.context.window.roastOfficeGame.getState().completed.length,2);personnelChecks++;
  await reloaded.$('clear-file').click();await reloaded.$('cancel-clear').click();assert.ok(reloaded.data.has('chief-office-shifts-v2'));await reloaded.$('clear-file').click();await reloaded.$('confirm-clear').click();assert.equal(reloaded.data.has('chief-office-shifts-v2'),false);assert.equal(reloaded.$('carry-forward').hidden,true);personnelChecks++;
  const blocked=boot('personnel-game.html',{blocked:true});await blocked.$('start').click();await pick(blocked,0);assert.equal(blocked.$('carry-forward-list').children.length,1);assert.match(blocked.$('local-status').textContent,/unavailable/);personnelChecks++;
  const endings=new Set(),routeDetails=[];
  for(const [policy,action] of [['plain','show'],['plain','point'],['sign','replace'],['sign','audit'],['none','assign'],['none','wait']]){
    const p=boot('case-021.html',{search:'?chief_preview=1'});
    await p.$('choices').children.find(b=>b.dataset.policy===policy).click();assert.equal(p.$('feedback').hidden,false);assert.equal(p.$('progress').value,1);
    await p.$('test-policy').click();assert.equal(p.$('choices').children.length,2);
    await p.$('choices').children.find(b=>b.dataset.action===action).click();assert.equal(p.$('ending').hidden,false);assert.equal(p.$('progress').value,2);assert.ok(p.$('ending-result').textContent.length>70);
    const url=new URL(p.$('episode-feedback').href,'https://example.invalid/');assert.equal(url.searchParams.get('feedback'),'coffee-20261015');assert.equal(url.searchParams.get('route'),policy+'/'+action);assert.equal(url.searchParams.get('chief_preview'),'1');assert.equal(url.hash,'#game-feedback');
    endings.add(p.$('ending-heading').textContent);routeDetails.push({route:policy+'/'+action,title:p.$('ending-heading').textContent,result:p.$('ending-result').textContent});
    await p.$('replay').click();assert.equal(p.$('progress').value,0);assert.equal(p.$('ending').hidden,true);assert.equal(p.$('choices').children.length,3);assert.ok(!p.$('episode-feedback').href.includes('route='));
    assert.equal(p.data.size,0);assert.ok(!/fetch\(|localStorage|sessionStorage|<script[^>]+src=/.test(p.html));
  }
  assert.equal(endings.size,6);
  const report={pass:true,personnel_dom_groups:personnelChecks,canvas_text_bounds_fixtures:exports,coffee_routes:routeDetails,replay_resets:6,network_requests_sent:0,method:'Actual scripts in a minimal simulated DOM. No browser, layout, image-load or physical-device claims.'};fs.writeFileSync(path.join(__dirname,'interaction-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
