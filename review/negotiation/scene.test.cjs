const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const model = require('../../assets/negotiation-state.js');
const code = fs.readFileSync(require('node:path').join(__dirname, '../../assets/negotiation-scene.js'), 'utf8');
function makePage(storage) {
  const el = () => ({dataset:{}, hidden:false, textContent:'', attrs:{}, handlers:{}, setAttribute(k,v){this.attrs[k]=v}, addEventListener(k,f){this.handlers[k]=f}, click(){this.handlers.click()}, focus(){this.focused=true}});
  const stage=el(), result=el(), box=el(), boxResult=el(), open=el(), save=el(), chief=el(), cat=el();
  chief.dataset.layoutChoice='chief-desk'; cat.dataset.layoutChoice='cat-desk';
  const lookup={'.negotiation__stage':stage,'.negotiation__result':result,'.negotiation__box':box,'.negotiation__box-result':boxResult,'.negotiation__open':open,'.negotiation__save':save};
  const section=el(); section.querySelector=s=>lookup[s]; section.querySelectorAll=()=>[chief,cat];
  const intro={insertAdjacentElement(_,v){assert.equal(v,section)}};
  const document={readyState:'complete',querySelector:s=>s==='.intro'?intro:null,getElementById:()=>null,createElement:()=>section};
  vm.runInNewContext(code,{window:{ChiefNegotiation:model,localStorage:storage},document});
  return {stage,result,box,boxResult,open,chief,cat,save};
}
test('choice, box and changes survive reload while other saves remain intact',()=>{
  const data=new Map([['chief-coffee-progress','coffee'],['chief-personnel-shift','shift']]);
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  let p=makePage(storage); assert.equal(p.box.hidden,true); p.cat.click(); assert.equal(p.stage.dataset.layout,'cat-desk'); assert.equal(p.cat.attrs['aria-pressed'],'true'); assert.equal(p.box.hidden,false); p.open.click(); assert.equal(p.boxResult.hidden,false); assert.equal(p.boxResult.focused,true);
  p=makePage(storage); assert.equal(p.stage.dataset.layout,'cat-desk'); assert.equal(p.boxResult.hidden,false); p.chief.click(); assert.equal(p.stage.dataset.layout,'chief-desk'); assert.equal(p.boxResult.hidden,false);
  p=makePage(storage); assert.equal(p.stage.dataset.layout,'chief-desk'); assert.equal(data.get('chief-coffee-progress'),'coffee'); assert.equal(data.get('chief-personnel-shift'),'shift');
});
test('blocked storage still allows play and warns that it cannot persist',()=>{
 const storage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};const p=makePage(storage);p.cat.click();assert.equal(p.stage.dataset.layout,'cat-desk');assert.match(p.save.textContent,/could not save/);p.open.click();assert.equal(p.boxResult.hidden,false);
});
