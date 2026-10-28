'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function game(folder){const html=fs.readFileSync(path.join(root,folder,'personnel-game.html'),'utf8');const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];const box={window:{}};vm.runInNewContext(code,box);return box.window.roastOfficeGame;}
const old=game('base'),now=game('candidate');
const plain=v=>JSON.parse(JSON.stringify(v));
function routes(size){return Array.from({length:3**size},(_,n)=>Array.from({length:size},(_,i)=>Math.floor(n/3**i)%3));}
let routesChecked=0,transitions=0;
for(const shift of [0,1])for(const answers of routes(shift?5:6)){
  assert.deepEqual(plain(now.score(answers,shift)),plain(old.score(answers,shift)));
  const before=plain(old.reviewFor(answers,shift)),after=plain(now.reviewFor(answers,shift));
  if(shift===0){delete before.filed_decision;delete after.filed_decision;}
  assert.deepEqual(after,before,'Role, story, action, score and return ticket must not change.');
  let a=old.newState(),b=now.newState();
  if(shift===1){a=old.advance(a);b=now.advance(b);for(let i=0;i<6;i++){a=old.advance(old.choose(a,0));b=now.advance(now.choose(b,0));}a=old.beginShift(a,1);b=now.beginShift(b,1);}
  else {a=old.advance(a);b=now.advance(b);}
  for(const choice of answers){a=old.choose(a,choice);b=now.choose(b,choice);assert.deepEqual(plain(b),plain(a));assert.deepEqual(plain(now.validateState(plain(a))),plain(a));a=old.advance(a);b=now.advance(b);assert.deepEqual(plain(b),plain(a));transitions+=2;}
  for(const next of [0,1])assert.deepEqual(plain(now.beginShift(b,next)),plain(old.beginShift(a,next)));
  routesChecked++;
}
assert.equal(now.storageKey,old.storageKey);
for(let i=0;i<2;i++)for(let j=0;j<old.shifts[i].scenes.length;j++)for(let k=0;k<3;k++)assert.deepEqual(plain(now.shifts[i].scenes[j].choices[k].effect),plain(old.shifts[i].scenes[j].choices[k].effect));
const beforeRepair=fs.readFileSync(path.join(root,'base/assets/personnel-repair-model.js'));
assert.deepEqual(fs.readFileSync(path.join(root,'candidate/assets/personnel-repair-model.js')),beforeRepair);
assert.deepEqual(fs.readFileSync(path.join(root,'candidate/assets/personnel-repair.js')),fs.readFileSync(path.join(root,'base/assets/personnel-repair.js')));
const repair=require(path.join(root,'candidate/assets/personnel-repair-model.js'));
for(const answers of routes(6)){
  const lines=now.openingConsequences(answers),c=repair.context({opening:answers,returning:null});
  assert.equal(lines.length,3);
  assert.equal(lines[1].includes('start available'),c.clarity&&c.intern);
  assert.equal(lines[2].includes('evidence on file'),c.evidence);
  assert.equal(lines[0].includes(['one-sentence opening','intern’s welcome','delayed opening'][answers[0]]),true);
}
for(let length=0;length<=6;length++)assert.equal(now.openingConsequences(Array(length).fill(0)).length,Math.min(length,3));
assert.throws(()=>now.openingConsequences([3]));
const report={pass:true,shift_routes:routesChecked,equal_state_transitions:transitions,score_effects_unchanged:33,repair_model_and_ui_byte_identical:true,opening_consequences_checked:729,storage_key_unchanged:true,method:'Pure rules and saved-state regression; no browser or network'};
fs.writeFileSync(path.join(__dirname,'rules-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
