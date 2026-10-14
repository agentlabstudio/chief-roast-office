/* Script integration in a minimal DOM harness. This is not a browser/layout test. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Node {
  constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.listeners={};this.attributes={};this.dataset={};this.hidden=false;this.disabled=false;this.className='';this._text='';}
  set id(v){this.attributes.id=v;this.doc.ids.set(v,this);}get id(){return this.attributes.id||'';}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
  setAttribute(k,v){if(k==='id')this.id=v;else this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}removeAttribute(k){delete this.attributes[k];}
  append(...nodes){nodes.forEach(n=>this.appendChild(n));}appendChild(n){n.parentNode=this;this.children.push(n);return n;}
  replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
  insertAdjacentElement(_,node){const parent=this.parentNode;const index=parent.children.indexOf(this);parent.children.splice(index+1,0,node);node.parentNode=parent;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}dispatchEvent(event){for(const fn of this.listeners[event.type]||[])fn(event);return true;}
  click(){assert.ok(!this.disabled,'Cannot click a disabled action');this.dispatchEvent({type:'click'});}
  focus(){this.doc.activeElement=this;}select(){}remove(){const p=this.parentNode;if(p)p.children=p.children.filter(n=>n!==this);}
  querySelector(selector){const nodes=this.children.flatMap(n=>[n,...n.walk()]);if(selector.startsWith('.'))return nodes.find(n=>n.className.split(' ').includes(selector.slice(1)))||null;return null;}
  walk(){return this.children.flatMap(n=>[n,...n.walk()]);}
}
class Document extends Node {
  constructor(){super('document',null);this.doc=this;this.ids=new Map();this.readyState='complete';this.body=new Node('body',this);this.appendChild(this.body);}
  createElement(tag){return new Node(tag,this);}createElementNS(_,tag){return this.createElement(tag);}getElementById(id){return this.ids.get(id)||null;}
}
function run(denyStorage=false){
  const doc=new Document(),memory=new Map(),html=fs.readFileSync(path.join(__dirname,'../personnel-game.html'),'utf8');
  for(const match of html.matchAll(/<([a-z0-9]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)){const node=doc.createElement(match[1]);node.id=match[2];node.hidden=/\bhidden\b/.test(match[0]);doc.body.appendChild(node);}
  const storage={getItem:k=>{if(denyStorage)throw Error('Denied');return memory.get(k)||null;},setItem:(k,v)=>{if(denyStorage)throw Error('Denied');memory.set(k,v);},removeItem:k=>{if(denyStorage)throw Error('Denied');memory.delete(k);}};
  const box={document:doc,localStorage:storage,navigator:{},URL,setTimeout:()=>{},CustomEvent:class{constructor(type,opts={}){this.type=type;this.detail=opts.detail;}},Date,console};box.window=box;
  vm.createContext(box);const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];vm.runInContext(script,box);
  for(const name of ['personnel-repair-model.js','personnel-repair.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets',name),'utf8'),box);
  const repair=doc.getElementById('repair-desk');assert.ok(repair.hidden);
  function findClass(name){return repair.walk().find(n=>n.className.split(' ').includes(name));}
  function coreChoice(index){const node=doc.getElementById('choices').children.find(n=>n.dataset.choice===String(index));assert.ok(node);node.click();doc.getElementById('next').click();}
  doc.getElementById('start').click();for(let i=0;i<6;i++)coreChoice(0);
  assert.equal(box.roastOfficeGame.getState().stage,'result');assert.equal(repair.hidden,false);assert.equal(doc.getElementById('story-code').textContent,'CASE-017 · REVISE');
  const original=denyStorage?null:memory.get(box.roastOfficeGame.storageKey);
  findClass('primary').click();
  for(const id of ['inspect','small','bench','receipt']){const action=repair.walk().find(n=>n.dataset.repairChoice===id);assert.ok(action,id);action.click();findClass('primary').click();}
  assert.equal(findClass('repair__stamp').textContent,'REPAIR VERIFIED');assert.equal(doc.getElementById('card-ref').textContent,'HR FILE: HR-001\nCLASSIFICATION: FICTION');
  if(!denyStorage){assert.equal(memory.get(box.roastOfficeGame.storageKey),original,'Repair must not write the original save');const saved=JSON.parse(memory.get(box.ChiefRepair.storageKey));assert.equal(saved.current.stage,'result');assert.equal(saved.completed.length,1);assert.equal(box.ChiefRepair.outcome(saved.current).closed,true);}
  else assert.ok(repair.textContent.includes('Local saving is unavailable'));
  doc.getElementById('return-shift').click();assert.ok(repair.hidden);for(let i=0;i<5;i++)coreChoice(0);assert.equal(repair.hidden,false);assert.equal(box.roastOfficeGame.getState().completed.length,2);
  doc.getElementById('clear-file').click();doc.getElementById('confirm-clear').click();assert.ok(repair.hidden);assert.equal(box.roastOfficeGame.getState().stage,'welcome');assert.equal(memory.has(box.ChiefRepair.storageKey),false);assert.equal(memory.has(box.roastOfficeGame.storageKey),false); assert.ok(doc.getElementById('result-status').textContent.includes(denyStorage?'could not be fully cleared':'was cleared'));
}
run();run(true);console.log('Full opening → repair → return → clear flow passed in DOM harness, with normal and unavailable local storage.');
