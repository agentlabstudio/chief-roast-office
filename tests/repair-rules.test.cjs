const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const crypto=require('node:crypto');
const repair=require('../assets/personnel-repair-model.js');
function core(file){const html=fs.readFileSync(path.join(__dirname,file),'utf8');const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);const box={window:{}};vm.runInNewContext(scripts[0][1],box);return box.window.roastOfficeGame;}
const now=core('../personnel-game.html');
function routes(size){return Array.from({length:3**size},(_,n)=>Array.from({length:size},(_,i)=>Math.floor(n/3**i)%3));}
function plain(v){return JSON.parse(JSON.stringify(v));}
// Every existing outcome and exported review text remains byte-for-byte identical.
const reviews=[];for(const shift of [0,1])for(const answers of routes(shift?5:6))reviews.push([now.reviewFor(answers,shift),now.cardText(now.reviewFor(answers,shift))]);
// Golden digest measured from main7e58 before this change; includes all972 full reviews and share texts.
assert.equal(crypto.createHash('sha256').update(JSON.stringify(reviews)).digest('hex'),'6750d7ca6c4331fb990b50e511f2f556e355cd394bb4ae62480bffff19e4ec00');
const initial={version:2,shift:0,answers:[],stage:'welcome',completed:[]};assert.deepEqual(plain(now.validateState(initial)),initial);
let saved=now.advance(initial);for(let i=0;i<6;i++)saved=now.advance(now.choose(saved,i%3));
assert.deepEqual(plain(now.validateState(saved)),plain(saved));
assert.equal(now.storageKey,'chief-office-shifts-v2');assert.notEqual(repair.storageKey,now.storageKey);
// One representative for every reachable starting condition, including all returns.
const contexts=new Map();
for(const opening of routes(6))for(const returning of [null,...routes(5)]){const source={opening,returning},c=repair.context(source);const signature=JSON.stringify([c.minutes,c.clarity,c.evidence,c.intern,c.noise]);if(!contexts.has(signature))contexts.set(signature,source);}
let terminals=0,closed=0;
function walk(state){assert.deepEqual(repair.validate(JSON.parse(JSON.stringify(state))),state);if(state.stage==='result'){terminals++;const c=repair.condition(state),result=repair.outcome(state);assert.equal(result.closed,Boolean(c.work>0&&c.test>0&&c.receipt));assert.ok(c.minutes>=0);if(result.closed)closed++;return result.closed?1:0;}if(state.stage==='feedback')return walk(repair.advance(state));const options=repair.options(state);assert.ok(options.some(o=>o.enabled),'Every turn has a legal action');let wins=0;for(const option of options){if(!option.enabled){assert.throws(()=>repair.choose(state,option.id));continue;}wins+=walk(repair.choose(state,option.id));}return wins;}
for(const source of contexts.values())for(let day=14;day<=20;day++){const state=repair.advance(repair.create(source,'2026-10-'+day));assert.ok(walk(state)>0,'Every inherited condition has a reachable verified repair');}
const source={opening:[2,2,2,2,2,2],returning:[2,2,2,2,2]};
let difficult=repair.advance(repair.create(source,'2026-10-14'));
assert.equal(repair.options(difficult).find(o=>o.id==='intern').enabled,false);
for(const id of ['inspect','small','bench','receipt'])difficult=repair.advance(repair.choose(difficult,id));
assert.equal(repair.outcome(difficult).closed,true);
assert.equal(repair.condition(difficult).minutes,0);
assert.ok(repair.receiptText(difficult).includes('Scripted fictional game'));
const corrupt=[null,{}, {...difficult,date:'2026-02-30'}, {...difficult,answers:['guess','small','bench','receipt']}, {...difficult,stage:'question'}, {...difficult,source:{opening:Array(6),returning:null}}, {...difficult,answers:['inspect','small','announce','receipt']}];
for(const value of corrupt)assert.throws(()=>repair.validate(value));
assert.equal(new Set(Array.from({length:7},(_,i)=>repair.orderFor('2026-10-'+(14+i)).name)).size,7);
assert.equal(repair.sourceFrom({completed:[]}),null);
console.log(JSON.stringify({legacyOutcomes:972,startingConditions:contexts.size,legalRepairEndings:terminals,verifiedRepairEndings:closed,allConditionsWinnable:true,invalidRoutesRejected:true},null,2));
