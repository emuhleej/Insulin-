'use strict';
const $=id=>document.getElementById(id);
const form=$('check-form'), result=$('result'), content=$('result-content');
const initial=content.innerHTML;
function mode(){return form.elements.mode.value;}
function clearResult(){content.innerHTML=initial;delete result.dataset.kind;}
function setMode(){
  const m=mode();
  $('hold-field').hidden=m!=='resume';
  $('rate-field').hidden=m==='start';
  $('previous-fields').hidden=m!=='continue';
  $('rate-label').textContent=m==='resume'?'Rate immediately before the hold':'Current running rate';
  $('rate-help').textContent=m==='resume'?'Use the actual pre-hold rate, not the current 0 units/hr.':'Read the current rate from the infusion pump.';
  $('mode-help').textContent={start:'Check the starting instructions for a new infusion.',continue:'Compare consecutive hourly readings while the infusion is running.',resume:'Review restart instructions after an infusion hold.'}[m];
  // Prevent mode-specific values from silently carrying into another workflow.
  for(const id of ['rate','previous','hold'])$(id).value='';
  $('hourly').checked=false;
  clearResult();
}
function add(tag,text,className){const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;content.append(e);return e;}
form.addEventListener('input',clearResult);
form.addEventListener('change',event=>{clearResult();if(event.target.name==='mode')setMode();});
form.addEventListener('submit',event=>{
  event.preventDefault();
  const input={mode:mode(),bg:$('bg').value,potassium:$('potassium').value,previous:$('previous').value,rate:$('rate').value,hold:$('hold').value,hourly:$('hourly').checked};
  const r=InsulinProtocol.evaluate(input);
  content.replaceChildren();result.dataset.kind=r.kind;
  add('span',r.kind==='rate'?'ORDER-BASED CALCULATION':r.kind==='invalid'?'INPUT NEEDED':r.kind==='clarify'?'NO DOSE CALCULATED':'HOLD / STOP INSTRUCTION','status');
  add('h3',r.title);
  if(r.rate!==null){const dose=add('div',String(r.rate),'dose');const units=document.createElement('small');units.textContent='units/hr';dose.append(units);}
  add('p',r.reason);
  add('p',r.next,'next');
  if(r.kind==='rate')add('p','Verify this result against the active order. Confirm pump precision; this reference does not round or convert to mL/hr.');
  const parts=[input.mode.toUpperCase(),`Glucose: ${input.bg||'missing'} mg/dL`,`K: ${input.potassium||'missing'} mEq/L`];
  if(input.mode==='continue')parts.push(`Previous glucose: ${input.previous||'missing'} mg/dL`,`Running rate: ${input.rate||'missing'} units/hr`);
  if(input.mode==='resume')parts.push(`Hold: ${$('hold').selectedOptions[0].textContent}`,`Pre-hold rate: ${input.rate||'missing'} units/hr`);
  add('p',parts.join(' · '),'snapshot');
  result.focus({preventScroll:true});
  result.scrollIntoView({behavior:'auto',block:'nearest'});
});
$('clear-entries').addEventListener('click',()=>{form.reset();setMode();$('bg').focus();});
setMode();
