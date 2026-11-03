// Opportunity quick view (pipeline card click), card ··· shortcuts and the opportunity Tasks tab.
const OPK_IC={
  task:'<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="2" width="10" height="10" rx="2"/><path d="M4.8 7l1.6 1.6L9.4 5.6"/></svg>',
  note:'<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 1.8h5.5L11 4.3v7.9H3z"/><path d="M5 6.5h4M5 9h3"/></svg>',
  appt:'<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="2.5" width="10" height="9.5" rx="1.5"/><path d="M2 5.5h10M5 2.5V1M9 2.5V1"/></svg>',
  contact:'<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 3h10v7H6l-3 2.5V3z"/></svg>',
  open:'<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 2h4v4M12 2L6.5 7.5M10.5 8.5V12H2V3.5h3.5"/></svg>',
};
const OPP_GO_ACTIONS=[['task','Add task',OPK_IC.task],['note','Add note',OPK_IC.note],['appt','Add appointment',OPK_IC.appt],['contact','Contact',OPK_IC.contact]];

// ---------- Tasks linked to an opportunity (shared with the Tasks page) ----------
function oppTasksFor(o){
  if(typeof tqInit!=='function'||!o)return [];
  tqInit();
  return TQ.filter(t=>!t.agent&&(t.rec===o.id||tqOpp(t.rec)?.id===o.id));
}
function oppTaskSort(a,b){return (tqOver(b)-tqOver(a))||((a.due||'9999')<(b.due||'9999')?-1:(a.due||'9999')>(b.due||'9999')?1:(a.time||'99')<(b.time||'99')?-1:1);}
function oppTaskRow(t,ctx){
  const done=t.status==='done',cancelled=t.status==='cancelled',over=tqOver(t),owner=TQ_USERS[t.owner]||TQ_USERS.sam;
  return `<div class="opk-task ${done||cancelled?'is-done':''} ${over?'is-over':''}">
    <button type="button" class="opk-cb ${done?'on':''}" role="checkbox" aria-checked="${done}" aria-label="${done?'Reopen':'Complete'} ${xesc(t.title)}" ${cancelled?'disabled':''} onclick="oppTaskToggle('${t.id}')">${done?CHECK_SVG:''}</button>
    <div class="opk-task-main"><span class="opk-task-title">${xesc(t.title)}</span><span class="opk-task-due">${cancelled?'Cancelled':done?'Done':xesc(tqDue(t))}${t.remind&&!done&&!cancelled?` · Reminder ${xesc(t.remind)}`:''}</span></div>
    <span class="opk-av" title="${xesc(owner.name)}">${owner.ini}</span>
    ${ctx==='tab'&&!done&&!cancelled?`<button type="button" class="opk-icon-btn" aria-label="Edit ${xesc(t.title)}" title="Edit" onclick="tqAddOpen({edit:tqFind('${t.id}')})"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 11.5l1.5-.3 6-6-1.2-1.2-6 6zM8.5 3.8l1.2 1.2"/></svg></button><button type="button" class="opk-icon-btn" aria-label="Cancel ${xesc(t.title)}" title="Cancel task" onclick="oppTaskCancel('${t.id}')"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7"/></svg></button>`:''}
  </div>`;
}
function oppTaskAddHtml(o,prefix){
  return `<div class="opk-add" id="${prefix}-add">
    <input id="${prefix}-title" placeholder="Add a task for ${xesc(o.lead.split(' ')[0])}…" aria-label="New task" onkeydown="if(event.key==='Enter'){event.preventDefault();oppTaskQuickAdd('${o.id}','${prefix}')}">
    <input id="${prefix}-due" type="date" aria-label="Due date" value="${cvISO(cvAddDays(cvToday(),1))}">
    <button type="button" class="btn-primary" onclick="oppTaskQuickAdd('${o.id}','${prefix}')">Add</button>
  </div>`;
}
function oppTasksTabHtml(o,rail){
  const all=oppTasksFor(o),open=all.filter(t=>t.status==='open').sort(oppTaskSort),past=all.filter(t=>t.status!=='open');
  const over=open.filter(tqOver).length;
  return `<div class="opp-grid"><div>
    <div class="dcard opk-tasks-card" id="opp-tasks-card">
      <div class="row-between" style="margin-bottom:12px"><div><h3 style="margin:0">Tasks</h3><div class="opk-sub">Follow-ups for ${xesc(o.lead)}. They also show on the Tasks page${over?` · <b class="opk-bad">${over} overdue</b>`:''}.</div></div>
        <button type="button" class="btn-ghost" onclick="oppAddTask()">More options</button></div>
      ${oppTaskAddHtml(o,'opp-task')}
      <div class="opk-sec">Open · ${open.length}</div>
      ${open.map(t=>oppTaskRow(t,'tab')).join('')||'<div class="opk-empty">Nothing open. Add the next follow-up above.</div>'}
      ${past.length?`<details class="opk-past"><summary>Completed · ${past.length}</summary>${past.map(t=>oppTaskRow(t,'tab')).join('')}</details>`:''}
    </div>
  </div><div>${rail}</div></div>`;
}
function oppTaskQuickAdd(id,prefix){
  const o=OPPS.find(item=>item.id===id),input=document.getElementById(prefix+'-title');
  if(!o||!input)return;
  const title=input.value.trim();
  if(!title){showToast('Give the task a title');input.focus();return;}
  const due=document.getElementById(prefix+'-due')?.value||null;
  tqInit();
  TQ.unshift({id:'n'+Date.now(),title,rec:o.id,due,time:null,owner:tqMe(),agent:false,source:'manual',status:'open',createdBy:tqMe(),remind:'',fresh:true});
  getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`Task added · ${title}${due?' · due '+tqDay(due):''}`});
  tqBadge();oppQuickRefresh(o);
  setTimeout(()=>document.getElementById(prefix+'-title')?.focus());
  showToast(`Task added${due?' · due '+tqDay(due):''}`);
}
function oppTaskToggle(id){
  const t=tqFind(id);if(!t)return;
  const o=tqOpp(t.rec)||OPPS.find(item=>item.id===t.rec);
  if(t.status==='done'){t.status='open';t.doneOn=null;showToast('Reopened · '+t.title);}
  else{t.status='done';t.doneOn=tqToday();if(o)getExt(o).comms.unshift({ch:'sys',t:'Just now',text:'Task done · '+t.title});showToast('Done · '+t.title);}
  tqBadge();if(o)oppQuickRefresh(o);
}
function oppTaskCancel(id){
  const t=tqFind(id);if(!t)return;
  t.status='cancelled';t.doneOn=tqToday();
  const o=tqOpp(t.rec)||OPPS.find(item=>item.id===t.rec);
  tqBadge();if(o)oppQuickRefresh(o);
  showToast('Cancelled · '+t.title);
}
// Re-render whichever opportunity views are showing this record.
function oppQuickRefresh(o){
  if(oppCur?.id===o.id&&document.getElementById('p-opp')?.classList.contains('on'))renderOpp();
  else oppPeekRender();
  if(document.getElementById('p-tasks')?.classList.contains('on'))tqRender();
}

// ---------- Card ··· shortcuts: open the right section of the opportunity page ----------
function oppPulse(el){if(!el)return;el.classList.add('qa-pulse');setTimeout(()=>el.classList.remove('qa-pulse'),1600);}
function oppGoTo(id,key){
  oppPeekClose();
  openOpp(id);
  if(key==='contact'){qaMessage();return;}
  if(key==='task'){
    oppSetTab('tasks');
    setTimeout(()=>{const input=document.getElementById('opp-task-title');oppPulse(document.getElementById('opp-task-add'));input?.scrollIntoView({behavior:'smooth',block:'center'});input?.focus();},40);
    return;
  }
  if(key==='note'){
    oppSetTab('notes');
    setTimeout(()=>{const ta=document.getElementById('opp-note');oppPulse(ta?.closest('.opp-comp'));ta?.scrollIntoView({behavior:'smooth',block:'center'});ta?.focus();},40);
    return;
  }
  if(key==='appt'){
    setTimeout(()=>{const card=document.getElementById('opp-appts-card');card?.scrollIntoView({behavior:'smooth',block:'center'});oppPulse(card);qaViewing();},40);
  }
}

// ---------- Quick view drawer ----------
let oppPeekId=null;
function oppPeekOpen(id){
  const o=OPPS.find(item=>item.id===id);
  if(!o){showToast('Opportunity not found');return;}
  if(typeof oppCardMenuClose==='function')oppCardMenuClose();
  oppPeekId=id;oppCur=o;
  // Keeps the hidden opportunity page from rendering the same Details field ids as the drawer.
  if(!document.getElementById('p-opp')?.classList.contains('on'))oppTabB='activity';
  oppPeekRender(true);
  document.getElementById('oppPeek').classList.add('open');
  document.getElementById('oppPeekScrim').classList.add('on');
}
function oppPeekClose(){
  if(!oppPeekId)return;
  oppPeekId=null;
  document.getElementById('oppPeek')?.classList.remove('open');
  document.getElementById('oppPeekScrim')?.classList.remove('on');
}
function oppPeekIsOpen(){return !!oppPeekId&&document.getElementById('oppPeek')?.classList.contains('open');}
function oppPeekRender(fresh=false){
  if(!oppPeekId)return;
  const o=OPPS.find(item=>item.id===oppPeekId);if(!o){oppPeekClose();return;}
  const x=getExt(o),body=document.getElementById('oppPeekBody'),scroll=fresh?0:body.scrollTop;
  const contact=oppDetailsContact(o)||{},budget=oppBudget(o),buyerType=buyerTypeFor(o);
  const sourceOptions=[...new Set([...FILTER_OPTS.source,o.source].filter(Boolean))].sort();
  const repOptions=[...new Set([...FILTER_OPTS.rep,'Unassigned'])].sort();
  const buyerTypes=[...new Set([...CR_BUYER_TYPES,...CONTACTS.map(item=>item.btype).filter(Boolean),buyerType])].sort();
  const unitOptions=UNITS.filter(unit=>o.devs.includes(unit.dev)||o.units.includes(unit.id)).map(unit=>({value:unit.id,label:`${unit.id.replace(/^#/,'')} · ${unit.dev} · ${fmtEur(unit.price)}`}));
  const tasks=oppTasksFor(o).filter(t=>t.status==='open').sort(oppTaskSort);
  const notes=x.comms.filter(item=>item.ch==='note').slice(0,3);
  const activity=x.comms.filter(item=>item.ch!=='note').slice(0,4);
  const appts=x.appts?.length?x.appts:(()=>{const a=oppApptSummary(o,x);return a.v==='None yet'?[]:[{label:a.v,when:a.d}];})();
  const phone=contact.phone||x.buyer?.phone||'',email=contact.email||x.buyer?.email||'';
  const sec=(title,action,inner,id='')=>`<section class="opk-section"${id?` id="${id}"`:''}><div class="opk-sh"><h4>${title}</h4>${action||''}</div>${inner}</section>`;
  body.innerHTML=`
    <div class="opk-hero">
      <span class="avatar opk-avatar" style="background:${color(o.lead)}">${initials(o.lead)}</span>
      <div class="opk-hero-main">
        <button type="button" class="opk-name" onclick="oppPeekClose();openOpp('${o.id}')">${xesc(o.lead)}</button>
        <div class="opk-meta">${xesc(o.id)} · ${xesc(o.stage)} · ${xesc(buyerType)}${o.ago?` · Last activity ${xesc(o.ago)}`:''}</div>
        ${phone||email?`<div class="opk-meta">${[phone,email].filter(Boolean).map(xesc).join(' · ')}</div>`:''}
      </div>
    </div>
    <div class="opk-actions">
      <button type="button" onclick="oppGoTo('${o.id}','contact')">${OPK_IC.contact}Contact</button>
      <button type="button" onclick="oppPeekFocus('opk-task-title')">${OPK_IC.task}Add task</button>
      <button type="button" onclick="oppPeekFocus('opk-note')">${OPK_IC.note}Add note</button>
      <button type="button" onclick="qaViewing()">${OPK_IC.appt}Add appointment</button>
    </div>
    <div class="opk-next"><span>Next action</span><b>${xesc(oppNextAction(o))}</b></div>
    ${sec('Details','<span class="opk-hint">Saves as you change it</span>',`
      ${oppDtPicker(o,'stage','Pipeline stage',STAGES,o.stage)}
      ${oppDtPicker(o,'rep','Assigned rep',repOptions,o.rep)}
      <div class="opk-two">${oppDtPicker(o,'devs','Developments',DEVS.map(dev=>dev.name),o.devs,true)}${oppDtPicker(o,'units','Units',unitOptions,o.units,true)}</div>
      <div class="od-field"><label for="opp-dt-budgetMin">Budget</label><div class="opp-dt-budget">${oppDtBudgetInput(o,'budgetMin','Min',budget.min)}<span class="opp-dt-budget-sep" aria-hidden="true">–</span>${oppDtBudgetInput(o,'budgetMax','Max',budget.max)}</div></div>
      <div class="opk-two">${oppDtPicker(o,'buyerType','Buyer type',buyerTypes,buyerType)}${oppDtPicker(o,'source','Lead source',sourceOptions,o.source)}</div>
      ${oppDtTags(o,'tags','Tags','tag')}`,'opk-details')}
    ${sec(`Tasks · ${tasks.length}`,`<button type="button" class="opk-link" onclick="oppGoTo('${o.id}','task')">All tasks</button>`,`
      ${oppTaskAddHtml(o,'opk-task')}
      ${tasks.map(t=>oppTaskRow(t,'peek')).join('')||'<div class="opk-empty">No open tasks.</div>'}`,'opk-tasks')}
    ${sec('Appointments',`<button type="button" class="opk-link" onclick="qaViewing()">+ Book</button>`,
      appts.map(a=>`<div class="opk-appt">${OPK_IC.appt}<div><b>${xesc(a.label)}</b><span>${xesc(a.when||'Time not set')}</span></div></div>`).join('')||'<div class="opk-empty">Nothing booked.</div>','opk-appts')}
    ${sec('Notes',`<button type="button" class="opk-link" onclick="oppGoTo('${o.id}','note')">All notes</button>`,`
      <div class="opk-note-add"><textarea id="opk-note" rows="2" placeholder="Add an internal note…" aria-label="New note" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();oppPeekNote()}"></textarea><button type="button" class="btn-primary" onclick="oppPeekNote()">Add note</button></div>
      ${notes.map(n=>`<div class="opk-note"><div class="opk-note-h"><b>${xesc(n.who||'You')}</b><span>${xesc(n.t)}</span></div><div>${n.text}</div></div>`).join('')||'<div class="opk-empty">No notes yet.</div>'}`,'opk-notes')}
    ${sec('Recent activity',`<button type="button" class="opk-link" onclick="oppPeekClose();openOpp('${o.id}')">View all</button>`,
      activity.map(item=>`<div class="opk-act"><span class="opk-dot" style="background:${(CH_META[item.ch]||CH_META.sys||{}).color||'var(--outline)'}"></span><div><div>${item.text}</div><span>${xesc(item.t)}${CH_META[item.ch]?' · '+CH_META[item.ch].label:''}</span></div></div>`).join('')||'<div class="opk-empty">No activity yet.</div>')}`;
  body.scrollTop=scroll;
  document.getElementById('oppPeekFoot').innerHTML=`<button class="btn-ghost" onclick="oppPeekClose()">Close</button><button class="btn-primary" onclick="oppPeekClose();openOpp('${o.id}')">${OPK_IC.open}Open full record</button>`;
}
function oppPeekFocus(id){
  const el=document.getElementById(id);if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'center'});el.focus();
  oppPulse(el.closest('.opk-section'));
}
function oppPeekNote(){
  const o=OPPS.find(item=>item.id===oppPeekId),ta=document.getElementById('opk-note');
  const text=ta?.value.trim();if(!o||!text)return;
  getExt(o).comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text:xesc(text)});
  oppPeekRender();pipeRenderAll();
  setTimeout(()=>document.getElementById('opk-note')?.focus());
  showToast('Note added');
}

// Edits made through shared opportunity code (details pickers, booking, tasks drawer) refresh the drawer too.
(function(){
  const baseRender=window.renderOpp;
  window.renderOpp=function(){baseRender.apply(this,arguments);if(oppPeekIsOpen()&&oppCur?.id===oppPeekId)oppPeekRender();};
  const baseClose=window.qaDrawerClose;
  window.qaDrawerClose=function(){baseClose.apply(this,arguments);if(oppPeekIsOpen())setTimeout(()=>{oppPeekRender();if(typeof renderBoard==='function')renderBoard();});};
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||!oppPeekIsOpen())return;
    if(document.getElementById('qaDrawer')?.classList.contains('open'))return;
    if(e.target.closest?.('.nf-picker[open],.opp-dt-tags'))return;
    oppPeekClose();
  });
})();
