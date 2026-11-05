'use strict';
const $=id=>document.getElementById(id);
const form=$('check-form'), result=$('result'), content=$('result-content');
const initial=content.innerHTML;
const storageKey='insulin-check-session-v1';
let session=null, savedPending=null, timeEdited=false, storageAvailable=true, storageValue=null, externalChanged=false;
const formatTime=ms=>new Date(ms).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
function localTime(){const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
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
function showSession(){
  if(externalChanged)return;
  $('session-panel').hidden=!session;
  $('history-panel').hidden=!session;
  if(!session)return;
  $('session-title').textContent='Current session';
  $('session-summary').textContent=`Last glucose: ${session.previous} mg/dL · ${session.mode==='resume'?'Pre-hold':'Last confirmed'} rate: ${session.rate??'not started'}${session.rate===null?'':' units/hr'}`;
  $('due-time').textContent=session.nextDue===null?'Recheck timing: follow the hypoglycemia protocol.':`Next glucose check: ${formatTime(session.nextDue)}${Date.now()>session.nextDue?' · Due now':''}`;
  $('storage-note').textContent=storageAvailable?'Saved in this browser only. Clear the session for a new patient.':'Browser saving is unavailable. Keep this tab open; entries will be lost when it closes.';
  $('history-body').replaceChildren();
  for(const row of [...session.history].reverse()){
    const tr=document.createElement('tr');
    for(const value of [formatTime(row.at),`${row.bg} mg/dL`,row.potassium===null?'Not entered':`${row.potassium} mEq/L`,`${row.rate} units/hr`]){const td=document.createElement('td');td.textContent=value;tr.append(td);}
    $('history-body').append(tr);
  }
}
function prepareNext(){
  form.elements.mode.value=session.mode;setMode();
  $('bg').value='';$('previous').value=String(session.previous);
  $('rate').value=session.rate===null?'':String(session.rate);
  $('hold').value=session.hold;
  $('potassium').value=session.potassium===null?'':String(session.potassium);
  $('potassium-review').hidden=session.potassium===null;
  $('potassium-reviewed').checked=false;
  $('check-time').value='';timeEdited=false;
  form.querySelector('.mode-set').disabled=true;
  $('hold').disabled=true;
  $('previous').readOnly=true;
  $('mode-help').textContent=session.mode==='continue'?'Enter the new glucose. Review the carried-forward pump rate and potassium.':session.mode==='resume'?'Enter the new glucose to reassess the hold. The pre-hold rate is retained.':'The infusion has not started. Enter the next glucose to reassess.';
  showSession();$('bg').focus();
}
function invalidateExternal(){
  externalChanged=true;clearResult();form.hidden=true;$('session-panel').hidden=false;$('restore-actions').hidden=true;$('history-panel').hidden=true;
  $('session-title').textContent='Session changed in another tab';$('session-summary').textContent='Reload and review the latest saved session before continuing.';$('due-time').textContent='';$('storage-note').textContent='';$('reload-session').hidden=false;
}
function checkStorage(){
  if(externalChanged)throw Error('Reload the latest session before continuing.');
  let latest;
  try{latest=localStorage.getItem(storageKey);}catch{return;}
  if(latest!==storageValue){invalidateExternal();throw Error('The saved session changed in another tab. Reload before continuing.');}
}
function persist(next){
  checkStorage();
  try{const value=JSON.stringify(next);localStorage.setItem(storageKey,value);storageValue=value;storageAvailable=true;}catch{storageAvailable=false;}
}
function newPatient(){
  try{checkStorage();}catch{return;}
  try{localStorage.removeItem(storageKey);storageValue=null;}catch{storageAvailable=false;}
  session=null;savedPending=null;form.hidden=false;form.reset();
  form.querySelector('.mode-set').disabled=false;$('hold').disabled=false;$('previous').readOnly=false;
  $('restore-actions').hidden=true;$('potassium-review').hidden=true;$('clear-confirm').hidden=true;
  setMode();$('check-time').value='';timeEdited=false;showSession();$('bg').focus();
}
form.addEventListener('input',event=>{
  clearResult();
  if(event.target.id==='check-time')timeEdited=true;
  if(event.target.id==='bg'&&!timeEdited)$('check-time').value=localTime();
  if(event.target.id==='potassium'){$('potassium-review').hidden=true;$('potassium-reviewed').checked=false;}
});
form.addEventListener('change',event=>{clearResult();if(event.target.name==='mode')setMode();});
form.addEventListener('submit',event=>{
  event.preventDefault();
  try{checkStorage();}catch{return;}
  const input={mode:mode(),bg:$('bg').value,potassium:$('potassium').value,previous:$('previous').value,rate:$('rate').value,hold:$('hold').value,hourly:$('hourly').checked};
  if(!$('potassium-review').hidden&&!$('potassium-reviewed').checked)input.potassium='';
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
  if(['rate','stop','hold'].includes(r.kind)){
    const advanceButton=add('button',r.kind==='rate'?'Rate applied — next glucose check':'Infusion off — next glucose check','primary');
    advanceButton.type='button';
    advanceButton.addEventListener('click',()=>{
      const at=new Date($('check-time').value).getTime();
      const errorId='advance-error';$(errorId)?.remove();
      try{
        if(!Number.isFinite(at)||at>Date.now())throw Error('Enter the actual glucose check time; it cannot be in the future.');
        if(input.potassium==='')throw Error('Review or enter potassium before saving this check. The displayed stop instruction still applies.');
        const nextSession=InsulinSession.advance(input,r,session,at);
        persist(nextSession);session=nextSession;prepareNext();
        form.scrollIntoView({behavior:'auto',block:'start'});
      }catch(error){const message=add('p',error.message);message.id=errorId;message.setAttribute('role','alert');}
    });
  }
  result.focus({preventScroll:true});
  result.scrollIntoView({behavior:'auto',block:'nearest'});
});
$('clear-entries').addEventListener('click',()=>{if(session)$('clear-confirm').hidden=false;else newPatient();});
$('confirm-clear').addEventListener('click',newPatient);
$('cancel-clear').addEventListener('click',()=>{$('clear-confirm').hidden=true;});
$('discard-session').addEventListener('click',newPatient);
$('restore-session').addEventListener('click',()=>{session=savedPending;savedPending=null;$('restore-actions').hidden=true;form.hidden=false;prepareNext();});
$('reload-session').addEventListener('click',()=>location.reload());
window.addEventListener('storage',event=>{if(event.key===storageKey||event.key===null)invalidateExternal();});
setMode();
try{
  const raw=localStorage.getItem(storageKey);
  storageValue=raw;
  if(raw){
    const stored=JSON.parse(raw);
    if(!InsulinSession.validSession(stored))throw Error('Invalid saved session');
    savedPending=stored;$('session-panel').hidden=false;$('restore-actions').hidden=false;form.hidden=true;
    $('session-title').textContent='Saved session found';
    $('session-summary').textContent=`Last check: ${formatTime(stored.history.at(-1).at)} · glucose ${stored.previous} mg/dL. Confirm this is the same patient before continuing.`;
    $('storage-note').textContent='Check the actual pump rate and current lab results before using saved values.';
  }
}catch{storageAvailable=false;$('session-panel').hidden=false;$('session-title').textContent='Saved session unavailable';$('session-summary').textContent='Start with verified current values. Previous saved values were not loaded.';}
setInterval(()=>{if(session)showSession();},30000);
