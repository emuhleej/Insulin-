const {test}=require('node:test');
const assert=require('node:assert/strict');
const {advance,validSession}=require('../session.js');
const at=Date.parse('2026-11-05T12:00:00Z');
const start={mode:'start',bg:220,potassium:4,rate:''};
const ok={kind:'rate',rate:4,title:'Starting rate'};
test('confirmed start prepares continue, carries glucose and rate, and schedules check',()=>{
 const s=advance(start,ok,null,at);assert.equal(s.mode,'continue');assert.equal(s.previous,220);assert.equal(s.rate,4);assert.equal(s.nextDue,at+3600000);assert.equal(s.history.length,1);assert.ok(validSession(s));
});
test('next saved reading replaces prior baseline and appends history',()=>{
 const a=advance(start,ok,null,at); const b=advance({mode:'continue',bg:210,potassium:4,rate:4},{...ok,rate:5},a,at+3600000);
 assert.equal(b.previous,210);assert.equal(b.rate,5);assert.equal(b.history.length,2);
});
test('unclear results cannot advance',()=>assert.throws(()=>advance(start,{kind:'clarify',rate:null},null,at)));
test('glucose hold retains pre-hold rate across repeated checks',()=>{
 const a=advance(start,ok,null,at);
 const b=advance({mode:'continue',bg:90,potassium:4,rate:4},{kind:'stop',rate:0},a,at+3600000);
 const c=advance({mode:'resume',hold:'glucose',bg:110,potassium:4,rate:4},{kind:'hold',rate:0},b,at+7200000);
 assert.equal(c.mode,'resume');assert.equal(c.hold,'glucose');assert.equal(c.rate,4);assert.equal(c.history[2].rate,0);
});
test('potassium plus low glucose records combined hold',()=>{
 const s=advance({mode:'continue',bg:90,potassium:3,rate:4},{kind:'stop',rate:0},null,at);
 assert.equal(s.hold,'both');
});
test('a potassium hold is not forgotten when glucose later falls',()=>{
 const a=advance({mode:'continue',bg:200,potassium:3,rate:4},{kind:'hold',rate:0},null,at);
 const b=advance({mode:'resume',hold:'potassium',bg:90,potassium:4,rate:4},{kind:'stop',rate:0},a,at+3600000);
 assert.equal(b.hold,'both');
});
test('low glucose before first start does not invent pre-hold rate',()=>{
 const s=advance({...start,bg:90},{kind:'stop',rate:0},null,at);assert.equal(s.mode,'start');assert.equal(s.rate,null);
});
test('hypoglycemia does not create a misleading hourly countdown',()=>{
 const s=advance({mode:'continue',bg:60,potassium:4,rate:4},{kind:'stop',rate:0},null,at);assert.equal(s.nextDue,null);
});
test('successful resume returns to continuing workflow',()=>{
 const s=advance({mode:'resume',hold:'glucose',bg:150,potassium:4,rate:8},ok,null,at);assert.equal(s.mode,'continue');assert.equal(s.rate,4);assert.equal(s.hold,'');
});
test('out-of-order check cannot overwrite session',()=>{
 const s=advance(start,ok,null,at);assert.throws(()=>advance(start,ok,s,at));
});
test('corrupt restored data is rejected',()=>{for(const s of [null,{}, {version:1,mode:'continue',rate:-1}, {...advance(start,ok,null,at),rate:'bad'}])assert.equal(validSession(s),false)});
test('unknown original hold never becomes glucose-only after a low reading',()=>{
 const s=advance({mode:'resume',hold:'',bg:90,potassium:4,rate:8},{kind:'stop',rate:0},null,at);assert.equal(s.hold,'other');
});
test('restored baseline must agree with most recent history',()=>{
 const s=advance(start,ok,null,at);assert.equal(validSession({...s,previous:999}),false);assert.equal(validSession({...s,rate:99}),false);
});
