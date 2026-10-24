'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const html=fs.readFileSync(process.env.COFFEE_SOURCE||path.join(root,'case-021.html'),'utf8');
const helper=fs.readFileSync(path.join(root,'assets/coffee-progress.js'),'utf8');

class Element {
  constructor(tag='div',id=''){
    this.tagName=tag.toUpperCase();this.id=id;this.hidden=false;this.children=[];this.listeners={};
    this.textContent='';this.dataset={};this.attributes={};this.parentNode=null;this.ownerDocument=null;
  }
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  append(...children){for(const child of children)this.appendChild(child);}
  appendChild(child){this.children.push(child);child.parentNode=this;return child;}
  replaceChildren(...children){this.children=[];this.append(...children);}
  focus(){this.focused=true;if(this.ownerDocument)this.ownerDocument.activeElement=this;}
  setAttribute(key,value){this.attributes[key]=String(value);}
  removeAttribute(key){delete this.attributes[key];}
  getAttribute(key){return this.attributes[key]??null;}
  closest(tag){return this.tagName===tag.toUpperCase()?this:this.parentNode?.closest(tag);}
  contains(child){return child===this||this.children.some(item=>item.contains(child));}
  async click(){const event={target:this};for(let node=this;node;node=node.parentNode)for(const fn of node.listeners.click||[])await fn(event);}
}

function boot(saved){
  const ids=new Map([...html.matchAll(/<([\w-]+)[^>]*\bid="([^"]+)"[^>]*>/g)].map(match=>{
    const element=new Element(match[1],match[2]);element.hidden=/\bhidden\b/.test(match[0]);return[match[2],element];
  }));
  const document={activeElement:null,getElementById:id=>ids.get(id),querySelectorAll:()=>[],createElement(tag){const element=new Element(tag);element.ownerDocument=this;return element;},addEventListener(){}};
  for(const element of ids.values())element.ownerDocument=document;
  for(const id of ['replay-confirmation-title','confirm-replay','cancel-replay'])ids.get('replay-confirmation').appendChild(ids.get(id));
  for(const match of html.matchAll(/<button[^>]*data-policy="([^"]+)"[^>]*>/g)){
    const button=new Element('button');button.dataset.policy=match[1];ids.get('choices').appendChild(button);
  }
  const data=new Map([['chief-coffee-shift-v1',JSON.stringify(saved)]]),windowListeners={};let reloads=0,readBlocked=false;
  const context={
    URL,URLSearchParams,
    localStorage:{getItem(key){if(readBlocked)throw Error('blocked');return data.get(key)??null;},setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)},
    document,
    window:{location:{search:'',href:'https://example.invalid/case-021.html',origin:'https://example.invalid',reload(){reloads++;}},addEventListener(type,fn){(windowListeners[type]??=[]).push(fn);}}
  };
  vm.runInNewContext(helper,context);
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(Boolean);
  vm.runInNewContext(scripts.at(-1),context,{timeout:1000});
  return{$:id=>ids.get(id),data,reloads:()=>reloads,setReadBlocked(value){readBlocked=value;},emit(type,event){for(const fn of windowListeners[type]||[])fn(event);}};
}

(async()=>{
  const states=[
    {version:1,policy:'plain',route:null,phase:'feedback',action:null},
    {version:1,policy:'plain',route:null,phase:'test',action:null},
    {version:1,policy:'plain',route:'plain/show',phase:'ending',action:null},
    {version:1,policy:'plain',route:'plain/show',phase:'return',action:null},
    {version:1,policy:'plain',route:'plain/show',phase:'return-ending',action:'teach'}
  ];
  let firstPage=null;
  for(const saved of states){
    const page=boot(saved),before=page.data.get('chief-coffee-shift-v1');firstPage??=page;
    await page.$('replay').click();
    assert.equal(page.$('replay-confirmation').hidden,false,'reset confirmation opens intentionally');
    assert.equal(page.$('replay-actions').hidden,true);

    page.emit('pageshow',{persisted:true});
    assert.equal(page.reloads(),0,'unchanged saved state does not force a reload');
    assert.equal(page.$('replay-confirmation').hidden,true,'BFCache return disarms the stale destructive confirmation');
    assert.equal(page.$('replay-actions').hidden,false,'normal replay action returns after the prompt is disarmed');
    assert.equal(page.$('replay').focused,true,'focus leaves the hidden prompt for the restored replay action');

    await page.$('confirm-replay').click();
    assert.equal(page.data.get('chief-coffee-shift-v1'),before,'a stale hidden confirm cannot clear the saved shift');
  }

  await firstPage.$('replay').click();
  await firstPage.$('confirm-replay').click();
  assert.equal(firstPage.data.has('chief-coffee-shift-v1'),false,'an explicitly reopened confirmation still clears coffee progress');

  const outside=boot(states[2]),outsideBefore=outside.data.get('chief-coffee-shift-v1');
  await outside.$('replay').click();outside.$('scene-heading').focus();outside.emit('pageshow',{persisted:true});
  assert.equal(outside.$('replay-confirmation').hidden,true);assert.equal(outside.$('replay').focused,undefined,'unrelated focus is not moved');
  assert.equal(outside.data.get('chief-coffee-shift-v1'),outsideBefore);

  const ordinary=boot(states[2]),ordinaryBefore=ordinary.data.get('chief-coffee-shift-v1');
  await ordinary.$('replay').click();ordinary.emit('pageshow',{persisted:false});
  assert.equal(ordinary.$('replay-confirmation').hidden,false,'non-BFCache pageshow does not impersonate a history return');
  assert.equal(ordinary.data.get('chief-coffee-shift-v1'),ordinaryBefore);

  const noPrompt=boot(states[2]);noPrompt.emit('pageshow',{persisted:true});
  assert.equal(noPrompt.$('replay-confirmation').hidden,true);assert.equal(noPrompt.$('replay').focused,undefined);assert.equal(noPrompt.reloads(),0);

  const changed=boot(states[2]);await changed.$('replay').click();
  changed.data.set('chief-coffee-shift-v1',JSON.stringify(states[3]));changed.emit('pageshow',{persisted:true});
  assert.equal(changed.$('replay-confirmation').hidden,true);assert.equal(changed.reloads(),1,'a changed readable save still requests reconciliation');

  const unreadable=boot(states[2]),unreadableBefore=unreadable.data.get('chief-coffee-shift-v1');
  await unreadable.$('replay').click();unreadable.setReadBlocked(true);unreadable.emit('pageshow',{persisted:true});
  assert.equal(unreadable.$('replay-confirmation').hidden,true);assert.equal(unreadable.reloads(),0,'unreadable storage cannot discard the live shift');
  assert.equal(unreadable.data.get('chief-coffee-shift-v1'),unreadableBefore);

  console.log(JSON.stringify({status:'PASS',checks:49,phases:states.map(state=>state.phase),changed_and_unreadable_storage:true,scope:'actual inline game script in simulated DOM; not browser/layout QA'}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
