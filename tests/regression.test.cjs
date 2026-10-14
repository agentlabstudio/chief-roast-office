const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/../personnel-game.html','utf8');const box={window:{}};vm.runInNewContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],box);
const game=box.window.roastOfficeGame,repair=require('../assets/personnel-repair-model.js');
function finish(state,answers){for(const answer of answers)state=game.advance(game.choose(state,answer));return state;}
let state=finish(game.advance(game.newState()),[2,2,2,2,2,2]);
state=finish(game.beginShift(state,0),[0,0,0,0,0,0]);
for(let i=0;i<12;i++){state=finish(game.beginShift(state,1),[1,1,1,1,1]);assert.deepEqual(JSON.parse(JSON.stringify(repair.sourceFrom(state).opening)),[0,0,0,0,0,0]);assert.ok(state.completed.length<=6);}
const source={opening:[0,0,0,0,0,0],returning:null};
let evidenceDate;for(let i=14;i<=20;i++){const date='2026-10-'+i;if(repair.orderFor(date).evidence)evidenceDate=date;}
let r=repair.advance(repair.create(source,evidenceDate));r=repair.advance(repair.choose(r,'inspect'));
assert.match(repair.options(r).find(x=>x.id==='rewrite').detail,/cannot close/);r=repair.choose(r,'rewrite');assert.match(repair.feedback(r).result,/cannot close/);
assert.match(fs.readFileSync(__dirname+'/../assets/personnel-repair.css','utf8'),/choice:disabled\{opacity:1/);
assert.match(fs.readFileSync(__dirname+'/../assets/personnel-repair.js','utf8'),/crooked tie/);
console.log('Regressions passed: latest opening survives twelve returns; honest evidence-only rewrite; no disabled text fade; Chief tie.');
