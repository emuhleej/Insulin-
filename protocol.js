(function(root){
  'use strict';
  const number = x => (typeof x === 'number' || (typeof x === 'string' && x.trim() !== '')) && Number.isFinite(Number(x)) ? Number(x) : NaN;
  const result=(kind,title,rate,reason,next='Verify the active order with the responsible clinician before changing the infusion.')=>({kind,title,rate,reason,next});
  const clarify=reason=>result('clarify','Clarify order',null,reason);
  const invalid=reason=>result('invalid','Check your entries',null,reason,'Correct the entries, then review again.');
  const hourly='Next glucose check: in 1 hour. Record the hourly insulin rate, including an unchanged rate or 0 units/hr when off.';
  // Decimal integer arithmetic removes binary representation artifacts, not pump rounding.
  function adjust(rate,step){
    const parts=value=>{const [m,e='0']=String(value).split('e');return {digits:BigInt(m.replace('.','')),scale:(m.split('.')[1]||'').length-Number(e)};};
    const a=parts(rate), b=parts(step), scale=Math.max(a.scale,b.scale,0);
    const digits=a.digits*10n**BigInt(scale-a.scale)+b.digits*10n**BigInt(scale-b.scale);
    return Number(String(digits)+'e-'+scale);
  }
  function evaluate(input){
    const {mode,hold}=input;
    const bg=number(input.bg), k=number(input.potassium), rate=number(input.rate), previous=number(input.previous);
    if(!['start','continue','resume'].includes(mode))return invalid('Choose Start, Continue or Resume.');
    if(!Number.isInteger(bg)||bg<=0)return invalid('Enter a positive whole-number glucose result in mg/dL. Do not round a fractional result or convert a meter HI/LO message.');
    // Explicit stop clauses are displayed even if other inputs are incomplete.
    if(bg<100){
      const emergency=bg<70;
      return result('stop',mode==='start'?'Do not start insulin':'Stop insulin infusion',0,
        emergency?'Glucose is less than 70 mg/dL: use the hypoglycemia protocol and notify the provider.':'Glucose is less than 100 mg/dL: stop the infusion.',
        (emergency?'Follow the hypoglycemia protocol for immediate treatment and recheck timing. ':'')+'The supplied order states hourly glucose checks until greater than 120 mg/dL. Record 0 units/hr while off. Before restarting, select Resume and reassess glucose, potassium and the reason for the hold. The 50% restart rule is only available for a confirmed glucose-only hold; clarify the order for a new start, potassium, combined or other hold.');
    }
    if(!(k>0))return invalid('Enter the current serum potassium in mEq/L. A missing value cannot be treated as normal.');
    if(k<3.3)return result('hold',mode==='start'?'Do not start insulin':'Hold insulin infusion',0,'Potassium is below 3.3 mEq/L. The supplied order permits resumption only when potassium is at least 3.3 mEq/L, but does not specify the restart rate after this hold.','Clarify the restart rate and potassium recheck timing. Continue hourly glucose checks per the supplied order.');
    if(mode==='start'){
      if(bg<140)return clarify('The order says start at 4 units/hr, but also specifies reductions for glucose 100–139 mg/dL. It does not establish an initial rate for this overlap.');
      return result('rate','Starting rate',4,'The supplied order starts at 4 units/hr. Entered potassium meets the stated minimum of 3.3 mEq/L.',hourly);
    }
    if(mode==='resume'){
      if(!['glucose','potassium','both','other'].includes(hold))return clarify('Select why the infusion was held.');
      if(hold!=='glucose')return clarify('The supplied order does not define a restart rate for a potassium hold, combined holds, or another interruption. Obtain a clarified restart order.');
      if(bg<=120)return result('hold','Continue holding insulin',0,'After a low-glucose hold, glucose must be strictly greater than 120 mg/dL before the stated restart rule applies. A value of exactly 120 does not qualify.','Check glucose every hour per the supplied order; follow any more frequent checks required by the hypoglycemia protocol.');
      if(!(rate>0))return invalid('Enter the actual infusion rate immediately before the low-glucose hold, in units/hr.');
      return result('rate','Restart rate',rate/2,'Glucose is greater than 120 mg/dL and potassium is at least 3.3 mEq/L. Restart at 50% of the rate immediately before the low-glucose hold.',hourly);
    }
    if(!(rate>0))return invalid('Enter the current running rate in units/hr. If the infusion is off, choose Resume or Start.');
    if(!Number.isInteger(previous)||previous<=0)return invalid('Enter the previous positive whole-number glucose result in mg/dL.');
    if(input.hourly!==true)return clarify('This algorithm compares consecutive hourly glucose checks. The supplied order does not define an adjustment for a different interval.');
    const drop=previous-bg, actions=[];
    if((bg>=120&&bg<=139)||drop>75)actions.push({type:'decrease',why:bg>=120&&bg<=139?'Glucose is 120–139 mg/dL.':'Glucose fell by more than 75 mg/dL.'});
    if((drop>=50&&drop<=75)||(bg>=140&&bg<=180))actions.push({type:'same',why:bg>=140&&bg<=180?'Glucose is 140–180 mg/dL.':'Glucose fell by 50–75 mg/dL.'});
    if(bg>180&&drop<50)actions.push({type:'increase',why:'Glucose is greater than 180 mg/dL and has not fallen by at least 50 mg/dL.'});
    if(bg>=100&&bg<=119)actions.push({type:'half',why:'Glucose is 100–119 mg/dL.'});
    if(actions.length!==1)return clarify('More than one instruction applies: '+actions.map(a=>a.why+' '+({decrease:'Decrease by the rate-band amount.',same:'Continue the current rate.',increase:'Increase by the rate-band amount.',half:'Decrease by 50%.'}[a.type])).join(' ')+' The supplied order does not state which takes priority.');
    const {type,why}=actions[0];
    let nextRate=rate;
    if(type==='half')nextRate=rate/2;
    if(type==='decrease'||type==='increase'){
      if(rate>9&&rate<10)return clarify('The table lists 2–9 and 10–20 units/hr. It does not cover a rate greater than 9 and less than 10 units/hr.');
      const step=rate<2?0.5:rate<=9?1:rate<=20?2:4;
      nextRate=adjust(rate,type==='decrease'?-step:step);
      if(nextRate<=0)return clarify('The listed decrease produces a zero or negative rate. The supplied order does not specify how to handle this result.');
    }
    // Keep the mathematical result; do not invent pump rounding or a precision rule.
    return result('rate',type==='same'?'Continue current rate':type==='increase'?'Increase infusion rate':'Decrease infusion rate',nextRate,why+(type==='half'?' Decrease by 50%.':''),hourly);
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={evaluate};
  else root.InsulinProtocol={evaluate};
})(typeof globalThis!=='undefined'?globalThis:this);
