const {test}=require('node:test');
const assert=require('node:assert/strict');
const {evaluate}=require('../protocol.js');
const base={mode:'continue',bg:200,previous:220,potassium:4,rate:4,hourly:true};
const run=(x)=>evaluate({...base,...x});
test('start uses ordered rate with potassium at boundary',()=>assert.equal(run({mode:'start',potassium:3.3}).rate,4));
test('start with conflicting low glucose asks for clarification',()=>assert.equal(run({mode:'start',bg:130}).kind,'clarify'));
for(const bg of [1,69,70,99])test(`stop at BG ${bg}`,()=>{let r=run({bg,potassium:''});assert.equal(r.rate,0);assert.equal(r.kind,'stop');if(bg<70)assert.match(r.reason,/hypoglycemia protocol.*notify/i)});
test('potassium below threshold holds in every mode',()=>{for(const mode of ['start','continue','resume'])assert.equal(run({mode,potassium:3.29}).rate,0)});
for(const bg of [100,119,120])test(`resume remains held at ${bg}`,()=>assert.equal(run({mode:'resume',bg,hold:'glucose',rate:8}).rate,0));
test('resume uses half pre-hold rate above 120',()=>assert.equal(run({mode:'resume',bg:121,hold:'glucose',rate:7.5}).rate,3.75));
for(const hold of ['potassium','both','other',''])test(`no invented ${hold} restart`,()=>assert.equal(run({mode:'resume',hold}).kind,'clarify'));
for(const [rate,step] of [[1,0.5],[2,1],[9,1],[10,2],[20,2],[20.5,4]]){
test(`increase band ${rate}`,()=>assert.equal(run({rate}).rate,rate+step));
test(`decrease band ${rate}`,()=>assert.equal(run({rate,bg:130,previous:140}).rate,rate-step));}
test('fractional band gap blocks adjustments',()=>assert.equal(run({rate:9.5}).kind,'clarify'));
test('band gap does not block a defined unchanged rate',()=>assert.equal(run({rate:9.5,bg:160,previous:170}).rate,9.5));
for(const drop of [50,75])test(`drop ${drop} continues`,()=>assert.equal(run({previous:200+drop}).rate,4));
test('drop greater than 75 decreases',()=>assert.equal(run({previous:276}).rate,3));
test('target range unchanged',()=>assert.equal(run({bg:180,previous:190}).rate,4));
test('target plus rapid fall conflicts',()=>assert.equal(run({bg:160,previous:240}).kind,'clarify'));
test('120–139 plus fall of 50 conflicts',()=>assert.equal(run({bg:130,previous:180}).kind,'clarify'));
test('100–119 without other matching clause halves',()=>assert.equal(run({bg:110,previous:120}).rate,2));
test('100–119 plus rapid fall conflicts even if numeric answers coincide',()=>assert.equal(run({bg:110,previous:200,rate:1}).kind,'clarify'));
test('zero or negative calculated rate not silently clamped',()=>{for(const rate of [0.25,0.5])assert.equal(run({bg:130,previous:140,rate}).kind,'clarify')});
test('missing and invalid numeric inputs never calculate',()=>{for(const value of ['',null,undefined,NaN,Infinity,-1,'4abc'])for(const field of ['bg','potassium','rate','previous'])assert.equal(run({[field]:value}).rate,null)});
test('fractional glucose rejected without rounding',()=>assert.equal(run({bg:139.5}).kind,'invalid'));
test('non-hourly comparison not inferred',()=>assert.equal(run({hourly:false}).kind,'clarify'));
test('unknown mode rejected',()=>assert.equal(run({mode:'x'}).kind,'invalid'));
test('zero rate cannot continue a running infusion',()=>assert.equal(run({rate:0}).kind,'invalid'));
test('low glucose stop never authorizes an unspecified restart',()=>{
  for(const fields of [{mode:'start'}, {potassium:3}, {mode:'resume',hold:'both'}, {mode:'resume',hold:'other'}]){
    const r=run({bg:90,...fields}); assert.equal(r.rate,0); assert.match(r.next,/clarify/i); assert.doesNotMatch(r.next,/then restart at 50%/i);
  }
});
test('decimal adjustment does not expose binary floating-point artifacts',()=>assert.equal(run({bg:130,previous:140,rate:4.1}).rate,3.1));
