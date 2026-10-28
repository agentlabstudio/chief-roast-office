'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const cards=JSON.parse(html.match(/let cards=(\[[\s\S]*?\]);\n/)[1]);
const start=html.indexOf('  const officeEpisodes=');
const end=html.indexOf("  document.getElementById('diary-share').addEventListener",start);
assert.ok(start>0&&end>start,'diary implementation block');
const source=html.slice(start,end);
assert.match(html,/id="diary-previous">← Previous office file<\/button><button[^>]+id="diary-next"/);

function boot(search=''){
  const ids=['diary-title','diary-code','diary-case-title','diary-incident','diary-verdict','diary-image','diary-freshness','diary-latest','diary-note','diary-return','diary-share-status','diary-download','diary-previous','diary-next'];
  const elements=new Map(ids.map(id=>[id,{id,textContent:'',src:'',alt:'',width:0,height:0,disabled:false,href:'',download:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},click(){this.listeners.click();}}]));
  const hero={src:'',alt:''};
  const context={cards,URLSearchParams,location:{search},document:{getElementById:id=>elements.get(id),querySelector:selector=>{assert.equal(selector,'.hero .art img');return hero;}}};
  vm.runInNewContext(source,context);
  return{elements,hero,click:id=>elements.get(id).click(),get code(){return elements.get('diary-code').textContent.split(' · ')[0];}};
}
function assertSynced(page,number){
  const card=cards.find(item=>item.number===number);assert.ok(card);
  assert.equal(page.code,card.code);assert.equal(page.elements.get('diary-case-title').textContent,card.title);
  assert.equal(page.elements.get('diary-incident').textContent,card.incident);assert.equal(page.elements.get('diary-verdict').textContent,card.verdict);
  assert.equal(page.elements.get('diary-return').textContent,card.return_ticket);assert.equal(page.elements.get('diary-image').src,card.image);
  assert.equal(page.hero.src,card.image);assert.equal(page.elements.get('diary-download').href,card.image);
  assert.equal(page.elements.get('diary-download').download,'Chief_'+card.code+'.png');
}
let checks=0;
const latest=boot();assertSynced(latest,'021');assert.equal(latest.elements.get('diary-latest').disabled,true);checks++;
latest.click('diary-previous');assertSynced(latest,'018');assert.equal(latest.elements.get('diary-latest').disabled,false);checks++;
latest.click('diary-next');assertSynced(latest,'021');assert.equal(latest.elements.get('diary-latest').disabled,true);checks++;
const earliest=boot('?file=015');assertSynced(earliest,'015');earliest.click('diary-previous');assertSynced(earliest,'021');checks++;
const requested=boot('?file=017');assertSynced(requested,'017');requested.click('diary-next');assertSynced(requested,'018');checks++;
const invalid=boot('?file=999');assertSynced(invalid,'021');checks++;
console.log(JSON.stringify({status:'PASS',checks,latest_previous_next:true,earliest_wrap:true,requested_file:true,invalid_file_fallback:true,fields_and_assets_synced:true,scope:'actual diary implementation in VM; not browser/layout QA'}));
