(function(root){
 'use strict';
 const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 function validSession(s){
  return !!s&&s.version===1&&['start','continue','resume'].includes(s.mode)&&Number.isInteger(s.previous)&&s.previous>0&&
   (s.mode==='start'?s.rate===null:positive(s.rate))&&(s.potassium===null||positive(s.potassium))&&
   ['', 'glucose','potassium','both','other'].includes(s.hold)&&
   (s.mode==='resume'?s.hold!=='':s.hold==='')&&
   (s.nextDue===null||positive(s.nextDue))&&Array.isArray(s.history)&&s.history.length>0&&s.history.length<=1000&&
   s.history.every((r,i)=>r&&positive(r.at)&&Number.isInteger(r.bg)&&r.bg>0&&(r.potassium===null||positive(r.potassium))&&typeof r.rate==='number'&&Number.isFinite(r.rate)&&r.rate>=0&&typeof r.action==='string'&&(i===0||r.at>s.history[i-1].at))&&
   s.previous===s.history.at(-1).bg&&s.potassium===s.history.at(-1).potassium&&
   (s.mode==='continue'?s.rate===s.history.at(-1).rate:s.history.at(-1).rate===0);
 }
 function advance(input,result,prior,at){
  if(!['rate','stop','hold'].includes(result.kind)||!Number.isFinite(result.rate)||result.rate<0)throw Error('Resolve the order before advancing.');
  if(!positive(at)||(prior&&at<=prior.history.at(-1).at))throw Error('The check time must be later than the last saved check.');
  const bg=Number(input.bg), potassium=Number(input.potassium)>0?Number(input.potassium):null;
  let mode='continue',rate=result.rate,hold='';
  if(result.kind!=='rate'){
   const preHold=Number(input.rate);
   if(input.mode==='start'){mode='start';rate=null;}
   else {
    if(!positive(preHold))throw Error('Enter the actual pre-hold infusion rate before saving this hold. The stop instruction still applies.');
    mode='resume';rate=preHold;
    const priorHold=input.mode==='resume'?input.hold:'';
    const lowK=potassium!==null&&potassium<3.3;
    const glucose=bg<100||['glucose','both'].includes(priorHold);
    const k=lowK||['potassium','both'].includes(priorHold);
    hold=priorHold==='other'||(input.mode==='resume'&&!priorHold)?'other':glucose&&k?'both':k?'potassium':glucose?'glucose':'other';
   }
  }
  const next={version:1,mode,rate,hold,previous:bg,potassium,
   nextDue:bg<70?null:at+3600000,
   history:[...(prior?.history||[]),{at,bg,potassium,rate:result.rate,action:result.title||result.kind}].slice(-1000)};
  if(!validSession(next))throw Error('This check cannot be saved. Review the entered values.');
  return next;
 }
 const api={advance,validSession};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.InsulinSession=api;
})(typeof globalThis!=='undefined'?globalThis:this);
