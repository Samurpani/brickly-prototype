// Tasks, signals and notifications (Bricly Tasks · Tasks Signals Notifications Flows).
// Design data is anchored to "today" the same way as the calendar; records link to the prototype's
// opportunities by buyer name where they exist.
const TQ_DESIGN_TODAY='2026-09-30';
const TQ_USERS={sam:{name:'Sam',ini:'SU'},manager:{name:'Rachel Mifsud',ini:'RM'},karl:{name:'Karl Zammit',ini:'KZ'}};
const TQ_REC={
  daniel:{type:'Opportunity',id:'OPP-1004',name:'Daniel Vella',owner:'sam'},anna:{type:'Opportunity',id:'OPP-1018',name:'Anna Spiteri',owner:'sam'},
  karlb:{type:'Opportunity',id:'OPP-1033',name:'Karl Buhagiar',owner:'sam'},nicole:{type:'Opportunity',id:'OPP-1021',name:'Nicole Galea',owner:'sam'},
  maria:{type:'Opportunity',id:'OPP-1007',name:'Maria Borg',owner:'sam'},paul:{type:'Opportunity',id:'OPP-1030',name:'Paul Micallef',owner:'sam'},
  clara:{type:'Opportunity',id:'OPP-1026',name:'Clara Vella',owner:'sam'},luca:{type:'Deal',id:'DL-2041',name:'Luca Camilleri',owner:'sam'},
  joseph:{type:'Deal',id:'DL-2038',name:'Joseph Grech',owner:'karl'},mark:{type:'Opportunity',id:'OPP-1022',name:'Mark Debono',owner:'karl'},
  u9710:{type:'Unit',id:'#CM9710',name:'#CM9710 · 3 bed',owner:'sam',unit:'#CM9710'},
};
const TQ_DRAFTS={
  t2:'Hi Nicole, as promised, here’s the revised payment plan for #CM9824 at La Lex. I’ve attached the updated schedule. Happy to go through it on a call if that helps.',
  t3:'Hi Anna, here’s the finance checklist for #CM9710. It lists the documents the bank will ask for. Bring what you have to this evening’s viewing and we can go through the rest together.',
  t6:'Hi Clara, thanks for your enquiry about La Lex. I’ve attached the current price list for the two-bedroom apartments. Would you like to book a viewing this week?',
  t4:'Hi Maria, a quick check on the bank letter for #CM9706. Once we have it we can move to the promise of sale. Is there anything I can help with?',
  b1:'Hi Daniel, it was good to show you #CM2702 on Friday. You asked about parking: there are two spaces left in the Mercury garage at €25,000 each. Would you like me to hold one while you decide?',
};
const TQ_SEED=[
  ['t4','Chase the bank letter from Maria','maria',-1,null],
  ['t2','Send Nicole the revised payment plan','nicole',0,'12:00',{remind:'11:45'}],
  ['t5','Call Paul Micallef back','paul',0,null,{createdBy:'manager'}],
  ['t3','Send Anna the finance checklist','anna',0,'16:00'],
  ['t6','Send Clara the La Lex price list','clara',0,'17:00'],
  ['t1','Chase Luca’s deposit','luca',2,null,{source:'whatsapp',remind:'09:00 on the day'}],
  ['t8','Call Daniel after his mortgage meeting','daniel',2,'15:00'],
  ['t9','Collect KYC documents from Luca','luca',5,null,{source:'stage_action'}],
  ['t7','Upload floor plans for #CM9710','u9710',null,null],
  ['t10','Send Daniel the #CM2702 floor plan','daniel',-5,null,{status:'done',doneOff:-5}],
  ['t11','Log Anna’s finance pre-approval','anna',-1,null,{status:'done',doneOff:-1}],
  ['h1','Book Daniel’s second appointment at Mercury','daniel',-2,null,{status:'done',doneOff:-2}],
  ['h3','Call Clara about La Lex parking','clara',-6,null,{status:'cancelled',doneOff:-6}],
  ['k1','Send the offer summary to Joseph Grech','joseph',-2,null,{owner:'karl',createdBy:'karl'}],
  ['k2','Call Mark Debono about the second appointment','mark',0,'14:00',{owner:'karl',createdBy:'karl'}],
  ['k3','Chase Joseph’s KYC documents','joseph',6,null,{owner:'karl',createdBy:'karl'}],
  ['r1','Check Karl’s offer summary for Joseph','joseph',0,null,{owner:'manager',createdBy:'manager'}],
  ['b1','Follow-up draft for Daniel Vella','daniel',0,null,{agent:true,waitingOn:'sam',status:'needs_approval',detail:'Drafted at 08:00 after 5 quiet days · waiting for you to approve'}],
  ['b2','Qualify new Meta lead — Karl Buhagiar','karlb',0,null,{agent:true,status:'running',detail:'Lead routing agent · started 07:31 · checking budget and timing from the Meta form'}],
  ['b3','Re-engagement draft for Clara Vella','clara',0,null,{agent:true,status:'running',detail:'Started from Chats at 09:02 · writing a WhatsApp message about new La Lex 2 beds'}],
  ['b4','Custom pack for Anna Spiteri','anna',-1,null,{agent:true,status:'done',doneOff:-1,detail:'Floor plans, render and payment plan for #CM9710'}],
  ['b5','Sync Anna’s appointment to Google Calendar','anna',0,null,{agent:true,status:'failed',detail:'Google Calendar didn’t respond at 08:14. Nothing was sent to Anna.'}],
  ['b6','Offer summary PDF for Joseph Grech','joseph',0,null,{agent:true,waitingOn:'karl',status:'needs_approval',detail:'Waiting for Karl to approve'}],
];
const TQ_NOTIFS=[
  ['n2','sam','Tasks','Rachel Mifsud assigned you a task','“Call Paul Micallef back”, due today.','paul','09:20','Today'],
  ['n3','sam','Approvals','Hold approved on #CM9710','Rachel approved your hold for Anna Spiteri until tomorrow, 18:00.','anna','09:12','Today',{read:true}],
  ['n4','sam','Tasks','Daniel Vella has been quiet 5 days','Bricly drafted a WhatsApp follow-up. Nothing is sent until you approve it.','daniel','08:00','Today',{action:'Review draft',kind:'draft'}],
  ['n5','sam','Leads','New lead assigned to you: Karl Buhagiar','Meta · La Lex 2 bed. Bricly drafted an intro message for you.','karlb','07:30','Today',{read:true}],
  ['n6','sam','Tasks','Task overdue: Chase the bank letter from Maria','Was due yesterday.','maria','18:00','Yesterday',{read:true}],
  ['n7','sam','Holds','#CM9823 was sold on another deal','It was on Nicole Galea’s shortlist and is no longer available.','nicole','16:40','Yesterday',{read:true}],
  ['n8','sam','Payments','Payment due in 4 days: Luca Camilleri','€45,000 POS deposit due in 4 days.','luca','09:00','Yesterday',{read:true}],
  ['n9','sam','Appointments','Anna Spiteri’s appointment moved','Now today, 17:30 at Onyx Rise sales suite.','anna','Mon 11:02','Earlier',{read:true}],
  ['m1','manager','Approvals','Karl Zammit asked to hold #CM9824 for Mark Debono','5 days · 1st in line on the unit.','mark','09:38','Today',{action:'Approve',kind:'approve'}],
  ['m2','manager','Holds','Hold on #CM9710 ends tomorrow','Anna Spiteri · Sam’s opportunity · tomorrow, 18:00.','anna','09:00','Today'],
  ['m3','manager','Leads','Clara Vella moved from Karl Zammit to Sam','1 open task moved with it.','clara','08:15','Today',{read:true}],
  ['m4','manager','Payments','Sale recorded: #CM9823 to Joseph Grech','POS signed by Karl Zammit · €358,000.','joseph','16:40','Yesterday',{read:true}],
];
let TQ=null, BN=null, tqViews={}, tqTab={}, tqMenu=null, tqBellOpen=false, bnCat='All';
function tqIso(off){return off==null?null:cvISO(cvOffsetDate(off));}
function tqInit(){
  if(TQ) return;
  TQ=TQ_SEED.map(([id,title,rec,off,time,x={}])=>({id,title,rec,due:tqIso(off),time,owner:x.owner||(x.agent?'agent':'sam'),agent:!!x.agent,source:x.agent?'agent':x.source||'manual',status:x.status||'open',createdBy:x.createdBy||'sam',remind:x.remind||'',detail:x.detail||'',waitingOn:x.waitingOn||'',doneOn:x.doneOff!=null?tqIso(x.doneOff):null}));
  BN=TQ_NOTIFS.map(([id,who,cat,title,body,rec,t,day,x={}])=>({id,who,cat,title,body,rec,t,day,read:!!x.read,action:x.action||'',kind:x.kind||''}));
}
function tqMe(){return typeof curPersona!=='undefined'&&(curPersona==='manager'||curPersona==='owner')?'manager':'sam';}
function tqToday(){return cvISO(cvToday());}
function tqDiff(iso){return Math.round((new Date(iso+'T12:00')-new Date(tqToday()+'T12:00'))/864e5);}
function tqDay(iso){return new Date(iso+'T12:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});}
function tqOver(t){return t.status==='open'&&t.due&&(tqDiff(t.due)<0||(tqDiff(t.due)===0&&t.time&&t.time<new Date().toTimeString().slice(0,5)));}
function tqDue(t){
  if(!t.due) return 'No date';
  const d=tqDiff(t.due);
  if(d<0) return 'Overdue · '+tqDay(t.due);
  return (d===0?'Today':d===1?'Tomorrow':tqDay(t.due))+(t.time?', '+t.time:'');
}
function tqOpp(rec){const r=TQ_REC[rec];return r?OPPS.find(o=>o.lead===r.name):null;}
function tqRecLabel(rec){const r=TQ_REC[rec];if(r)return `${r.name} · ${r.id}`;const o=OPPS.find(x=>x.id===rec);return o?`${o.lead} · ${o.id}`:rec||'';}
function tqOpenRec(rec){const r=TQ_REC[rec];if(r&&r.unit){openUnit(r.unit);return;}const o=tqOpp(rec)||OPPS.find(x=>x.id===rec);if(o)openOpp(o.id);else showToast(`${r?r.name:rec} isn’t in this demo’s records`);}
function tqMine(){const me=tqMe();return TQ.filter(t=>!t.agent&&t.owner===me);}
function tqNeedsMe(){const me=tqMe();return TQ.filter(t=>t.agent&&t.status==='needs_approval'&&t.waitingOn===me);}
function tqAgentMine(){const me=tqMe();return TQ.filter(t=>t.agent&&((TQ_REC[t.rec]||{}).owner===me||t.waitingOn===me)&&t.waitingOn!=='karl');}
function tqBadge(){
  tqInit();
  const open=tqMine().filter(t=>t.status==='open'&&t.due&&tqDiff(t.due)<=0).length+tqNeedsMe().length;
  const el=document.getElementById('tqNavBadge'); if(el){el.textContent=open;el.hidden=!open;}
  const unread=BN.filter(n=>n.who===tqMe()&&!n.read).length, b=document.getElementById('bnBadge'); if(b){b.textContent=unread;b.hidden=!unread;}
}
// ---------- Tasks page ----------
function tqSections(){
  const me=tqMe(), mgr=me==='manager', view=tqViews[me]||(mgr?'team':'all'), my=tqMine(), open=my.filter(t=>t.status==='open');
  const todayL=open.filter(t=>t.due&&tqDiff(t.due)<=0), upL=open.filter(t=>t.due&&tqDiff(t.due)>0).sort((a,b)=>a.due<b.due?-1:1), noL=open.filter(t=>!t.due);
  const past=l=>{const days=[...new Set(l.map(t=>t.doneOn||tqToday()))].sort().reverse();return days.map(d=>{const items=l.filter(t=>(t.doneOn||tqToday())===d);return [tqDiff(d)===0?'Today':tqDiff(d)===-1?'Yesterday · '+tqDay(d):tqDay(d),`${items.filter(t=>t.status==='done').length} done`,items];});};
  const byTime=(a,b)=>(a.time||'23:59')<(b.time||'23:59')?-1:1;
  const agent=tqAgentMine(), A=st=>agent.filter(t=>st.includes(t.status));
  const pastMine=my.filter(t=>t.status==='done'||t.status==='cancelled');
  let tabs=[],secs=[];const tab=tqTab[view]||(view==='bricly'?'running':'today');
  const days=l=>[...new Set(l.map(t=>t.due))].map(d=>[tqDiff(d)===1?'Tomorrow · '+tqDay(d):tqDay(d),'',l.filter(t=>t.due===d)]);
  if(view==='mine'||view==='all'){
    const working=view==='all'?A(['running','failed']):[];
    tabs=[['today','Today',todayL.length+tqNeedsMe().length+working.length],['upcoming','Upcoming',upL.length],['nodate','No date',noL.length],['done','History',pastMine.length+(view==='all'?A(['done','cancelled']).length:0)]];
    if(tab==='today') secs=[['Needs you','Bricly drafted these. Nothing reaches a buyer until you approve.',[...tqNeedsMe(),...todayL.filter(t=>TQ_DRAFTS[t.id]&&!tqOver(t))]],['Overdue','',todayL.filter(tqOver)],['Today','',todayL.filter(t=>!tqOver(t)&&!TQ_DRAFTS[t.id]).sort(byTime)],...(working.length?[['Bricly is working on','You don’t tick these off.',working]]:[])];
    if(tab==='upcoming') secs=days(upL);
    if(tab==='nodate') secs=[['No date','Tasks without a due date never turn red.',noL]];
    if(tab==='done') secs=past([...pastMine,...(view==='all'?A(['done','cancelled']):[])]);
  }
  if(view==='bricly'){
    tabs=[['running','Running',A(['running']).length],['needs','Needs approval',A(['needs_approval']).length],['done','Done',A(['done']).length],['failed','Failed',A(['failed']).length]];
    const m={running:['Running','What Bricly is working on for you right now.',['running']],needs:['Needs approval','These also show in Mine.',['needs_approval']],done:['Done','',['done']],failed:['Failed','Nothing was sent to a buyer. Retry or do it yourself.',['failed']]}[tab];
    secs=[[m[0],m[1],A(m[2])]];
  }
  if(view==='team'){
    const reps=['sam','karl','manager'];
    tabs=[['open','Open',TQ.filter(t=>!t.agent&&t.status==='open').length],['overdue','Overdue',TQ.filter(t=>!t.agent&&tqOver(t)).length]];
    secs=reps.map(r=>{const l=TQ.filter(t=>!t.agent&&t.owner===r&&t.status==='open'&&(tab!=='overdue'||tqOver(t))).sort((a,b)=>(tqOver(b)-tqOver(a))||((a.due||'9')<(b.due||'9')?-1:1));const ov=l.filter(tqOver).length;return [TQ_USERS[r].name,ov?`${ov} overdue`:'',l,r];});
  }
  return {view,tab,tabs,secs:secs.filter(s=>s[2].length||view==='team'),mgr};
}
function tqRow(t){
  const over=tqOver(t), done=t.status==='done'||t.status==='cancelled', me=tqMe();
  const ST={needs_approval:t.waitingOn===me?['Needs you','dark']:['Needs approval','warn'],running:['Running','info'],done:['Done','ok'],failed:['Failed','err'],cancelled:['Cancelled','']};
  const st=t.agent?ST[t.status]:null, SRC={whatsapp:'WhatsApp',stage_action:'Stage action',from_signal:'From signal'};
  const drafted=!t.agent&&t.status==='open'&&t.owner===me&&TQ_DRAFTS[t.id];
  const act=t.agent&&t.status==='needs_approval'&&t.waitingOn===me&&TQ_DRAFTS[t.id]?'Review draft':drafted?'Review & send':t.agent&&t.status==='failed'?'Retry':'';
  const note=t.agent?t.detail:drafted?'Bricly drafted the message · not sent':t.createdBy==='manager'&&t.owner!=='manager'?'Assigned by Rachel Mifsud':t.fresh?'Just added':t.remind?'Reminder '+t.remind:'';
  const owner=TQ_USERS[t.owner]||TQ_USERS.sam;
  return `<div class="tq-row ${over?'over':''} ${t.fresh?'fresh':''} ${done?'done':''}" data-tq-id="${t.id}">
    ${t.agent?`<span class="tq-st t-${st[1]}">${st[0]}</span>`:`<button type="button" class="tq-cb ${t.status==='done'?'on':''}" role="checkbox" aria-checked="${t.status==='done'}" aria-label="Complete ${xesc(t.title)}" data-tq="complete" ${t.status==='cancelled'?'disabled':''}>${t.status==='done'?'✓':''}</button>`}
    <div class="tq-main"><span class="tq-title">${xesc(t.title)}</span><span class="tq-sub"><button type="button" class="tq-rec" data-tq="rec">${xesc(tqRecLabel(t.rec))}</button>${note?` · <span class="${drafted||t.fresh?'tq-pri':''}">${xesc(note)}</span>`:''}</span></div>
    <span class="tq-due">${t.agent?(t.status==='done'?'Done':t.status==='running'?'In progress':t.status==='failed'?'Failed 08:14':'Waiting'):done?(t.status==='done'?'Done':'Cancelled'):xesc(tqDue(t))}</span>
    <span class="tq-tags">${SRC[t.source]?`<span class="tq-src">${SRC[t.source]}</span>`:''}${act?`<button type="button" class="tq-act" data-tq="act">${act}</button>`:''}</span>
    <span class="tq-av">${t.agent?'✦':owner.ini}</span>
    ${done&&!t.agent?'<span></span>':`<button type="button" class="tq-more" aria-label="More actions" data-tq="menu">⋯</button>`}
    ${tqMenu===t.id?tqMenuHtml(t):''}
  </div>`;
}
function tqMenuHtml(t){
  const items=t.agent?[['Open chat','chat'],['Open record','rec'],['Cancel','cancel']]:[['Tomorrow','rs:1'],['Next Monday','rs:mon'],['In a week','rs:7'],['Reassign','reassign'],['Edit','edit'],['Cancel task','cancel']];
  return `<div class="tq-menu" role="menu">${t.agent?'':'<div class="tq-mh">Reschedule · the reminder moves with it</div>'}${items.map(([l,k])=>`<button type="button" role="menuitem" class="${k==='cancel'?'danger':''}" data-tq="m:${k}">${l}</button>`).join('')}</div>`;
}
function tqRender(){
  const root=document.getElementById('tq-root'); if(!root) return; tqInit();
  const {view,tab,tabs,secs,mgr}=tqSections();
  const intro={all:'Your tasks and Bricly’s work in one list. Bricly drafts what it can, and nothing is sent until you approve.',mine:'Your own tasks, plus Bricly work that’s waiting on you.',bricly:'Work Bricly is doing or has finished for you. You don’t tick these off.',team:'Every rep’s open tasks, overdue first.'}[view];
  const views=[['all','All'],['mine','Mine'],['bricly','✦ Bricly'],...(mgr?[['team','Team']]:[])];
  root.innerHTML=`<div class="crm-page-heading tq-head"><div><div class="page-title">Tasks</div><div class="page-sub">${intro}</div></div>
      <div class="cr-actions"><button class="btn-primary cr-actions-btn" onclick="tqToggleActions(event)">Actions <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button>
      <div class="cr-actions-menu" id="tq-actions-menu" style="display:none"><button onclick="tqAddOpen()">Add task</button><button onclick="chatNavClick()">Hand work to Bricly in Chats</button></div></div></div>
    <div class="crm-page-controls tq-controls"><div class="seg tq-views">${views.map(([k,l])=>`<button type="button" class="${view===k?'on':''}" onclick="tqViews[tqMe()]='${k}';tqMenu=null;tqRender()">${l}</button>`).join('')}</div>
      <div class="tabs">${tabs.map(([k,l,n])=>`<button type="button" class="tab ${tab===k?'on':''}" onclick="tqTab['${view}']='${k}';tqMenu=null;tqRender()">${l} · ${n}</button>`).join('')}</div></div>
    ${secs.length?secs.map(([h,sub,rows,who])=>`<section class="tq-sec"><div class="tq-sh">${who?`<span class="tq-av">${TQ_USERS[who].ini}</span>`:''}<b>${xesc(h)}</b>${sub?`<span class="${/overdue/.test(sub)?'tq-bad':'tq-mu'}">${xesc(sub)}</span>`:''}</div>${rows.map(tqRow).join('')||'<div class="tq-empty">Nothing open.</div>'}</section>`).join(''):`<div class="tq-empty big"><b>✓ All clear</b><span>Nothing here. Add a task, or hand work to Bricly in Chats.</span></div>`}`;
  tqBadge();
}
function tqToggleActions(e){e.stopPropagation();const m=document.getElementById('tq-actions-menu');m.style.display=m.style.display==='none'?'':'none';}
document.addEventListener('click',e=>{if(!e.target.isConnected)return;const m=document.getElementById('tq-actions-menu');if(m&&!e.target.closest('#tq-root .cr-actions'))m.style.display='none';if(tqMenu&&!e.target.closest('.tq-menu,[data-tq="menu"]')&&document.getElementById('tq-root')?.contains(document.querySelector('.tq-menu'))){tqMenu=null;tqRender();}});
function tqFind(id){return TQ.find(t=>t.id===id);}
function tqComplete(t){
  if(t.status==='done'){t.status='open';t.doneOn=null;tqRender();return;}
  t.status='done';t.doneOn=tqToday();tqRender();
  const o=tqOpp(t.rec);if(o)getExt(o).comms.unshift({ch:'sys',t:'Just now',text:'Task done · '+t.title});
  showToast('Done · '+t.title+' · tick it again to undo');
}
function tqReschedule(t,k){
  const base=cvToday();let d;
  if(k==='mon'){d=new Date(base);d.setDate(d.getDate()+((8-d.getDay())%7||7));}else d=cvAddDays(base,+k);
  t.due=cvISO(d);tqMenu=null;tqRender();showToast(`Moved to ${tqDay(t.due)}${t.remind?' · the reminder moved with it':''}`);
}
function tqReassign(t){
  tqMenu=null;tqRender();
  qaDrawerOpen('Reassign task',`<div class="tq-mu" style="margin-bottom:10px">${xesc(t.title)}</div><div class="od-field"><label>Assign to</label><div class="cv-days" id="tqWho">${Object.entries(TQ_USERS).map(([k,u])=>`<button type="button" class="${k===t.owner?'on':''}" onclick="document.querySelectorAll('#tqWho button').forEach(b=>b.classList.remove('on'));this.classList.add('on');this.dataset.pick='1'" data-k="${k}">${u.name}</button>`).join('')}</div></div><div class="tq-mu">They get a notification and the task keeps its record and due date.</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="tqReassignSave('${t.id}')">Reassign</button>`);
}
function tqReassignSave(id){const t=tqFind(id),k=document.querySelector('#tqWho button.on')?.dataset.k||t.owner;t.owner=k;qaDrawerClose();tqRender();showToast(`Reassigned to ${TQ_USERS[k].name} · they were told`);}
function tqDraft(t){
  const text=TQ_DRAFTS[t.id], r=TQ_REC[t.rec], first=(r?r.name:'').split(' ')[0];
  qaDrawerOpen(t.agent?'Review draft':'Review & send',`<div class="tq-mu">To ${xesc(r?r.name:'')} · WhatsApp · English</div>
    <textarea id="tqDraftText" class="ll-text" rows="5" aria-label="Message">${xesc(text)}</textarea>
    <div class="tq-mu" style="margin-top:8px">Drafted from ${t.agent?'the quiet-deal signal':'your task'}. Nothing is sent until you approve.</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="tqDraftSend('${t.id}')">Send to ${xesc(first)}</button>`);
}
function tqDraftSend(id){
  const t=tqFind(id), text=document.getElementById('tqDraftText').value.trim(), o=tqOpp(t.rec);
  t.status='done';t.doneOn=tqToday();
  if(o)getExt(o).comms.unshift({ch:'wa',dir:'out',who:'You',t:'Just now',text});
  qaDrawerClose();tqRender();showToast(`Sent on WhatsApp · logged to ${(TQ_REC[t.rec]||{}).name||'the record'}’s activity`);
}
function tqAction(btn){
  const row=btn.closest('[data-tq-id]'), t=row&&tqFind(row.dataset.tqId), k=btn.dataset.tq;
  if(!t) return;
  if(k==='complete') return tqComplete(t);
  if(k==='rec') return tqOpenRec(t.rec);
  if(k==='menu'){tqMenu=tqMenu===t.id?null:t.id;tqRender();return;}
  if(k==='act'){if(t.status==='failed'){t.status='running';t.detail='Retrying · started just now';tqRender();showToast('Retrying · '+t.title);}else tqDraft(t);return;}
  if(k.startsWith('m:rs:')) return tqReschedule(t,k.slice(5));
  if(k==='m:reassign') return tqReassign(t);
  if(k==='m:edit'){tqMenu=null;tqAddOpen({edit:t});return;}
  if(k==='m:cancel'){t.status='cancelled';t.doneOn=tqToday();tqMenu=null;tqRender();showToast('Cancelled · '+t.title);return;}
  if(k==='m:rec'){tqMenu=null;return tqOpenRec(t.rec);}
  if(k==='m:chat'){tqMenu=null;chatNavClick();return;}
}
document.addEventListener('click',e=>{const b=e.target.closest('#tq-root [data-tq]');if(b&&!b.disabled){e.stopPropagation();tqAction(b);}},true);
// ---------- Add / edit task (Flows 1–2): from the Tasks page or a record ----------
function tqAddOpen(o={}){
  tqInit(); const m=document.getElementById('tq-actions-menu'); if(m) m.style.display='none';
  const t=o.edit, rec=t?t.rec:o.rec||'';
  const opts=OPPS.filter(x=>!EXIT_STAGES.includes(x.stage)).sort((a,b)=>a.lead.localeCompare(b.lead));
  qaDrawerOpen(t?'Edit task':'Add task',`
    <div class="od-field"><label for="tqTitle">Task</label><input id="tqTitle" value="${xesc(t?t.title:o.title||'')}" placeholder="e.g. Send Daniel the parking options"></div>
    <div class="od-field"><label for="tqRec">Record</label>${t&&TQ_REC[t.rec]?`<input value="${xesc(tqRecLabel(t.rec))}" readonly>`:`<select id="tqRec" ${o.recLocked?'disabled':''}><option value="">Choose an opportunity</option>${opts.map(x=>`<option value="${x.id}" ${x.id===rec?'selected':''}>${xesc(x.lead)} · ${x.id}</option>`).join('')}</select>`}<span class="tq-mu">Every task belongs to a record.</span></div>
    <div class="od-field" style="display:flex;gap:10px"><div style="flex:1"><label for="tqDue">Due</label><input id="tqDue" type="date" value="${t?t.due||'':cvISO(cvAddDays(cvToday(),1))}"></div><div style="flex:1"><label for="tqTime">Time (optional)</label><input id="tqTime" type="time" value="${t?t.time||'':''}"></div></div>
    <div class="od-field"><label for="tqRemind">Reminder</label><select id="tqRemind">${['None','15 minutes before','1 hour before','09:00 on the day'].map(r=>`<option ${t&&t.remind===r?'selected':''}>${r}</option>`).join('')}</select></div>
    <div class="tq-mu">Assigned to you. You can reassign it from the task’s ⋯ menu.</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="tqAddSave(${t?`'${t.id}'`:'null'})">${t?'Save':'Add task'}</button>`);
  document.getElementById('tqTitle').focus();
}
function tqAddSave(id){
  const title=document.getElementById('tqTitle').value.trim(); if(!title){showToast('Give the task a title');return;}
  const recEl=document.getElementById('tqRec'), due=document.getElementById('tqDue').value||null, time=document.getElementById('tqTime').value||null, remind=document.getElementById('tqRemind').value;
  if(id){const t=tqFind(id);Object.assign(t,{title,due,time,remind:remind==='None'?'':remind});}
  else{
    if(recEl&&!recEl.value){showToast('Link the task to an opportunity');return;}
    const rec=recEl?recEl.value:'';
    TQ.unshift({id:'n'+Date.now(),title,rec,due,time,owner:tqMe(),agent:false,source:'manual',status:'open',createdBy:tqMe(),remind:remind==='None'?'':remind,fresh:true});
    const o=OPPS.find(x=>x.id===rec); if(o) getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`Task added · ${title}${due?' · due '+tqDay(due):''}`});
  }
  qaDrawerClose(); tqBadge();
  if(document.getElementById('p-tasks')?.classList.contains('on')) tqRender();
  else if(document.getElementById('p-opp')?.classList.contains('on')) renderOpp();
  showToast(id?'Task saved':`Task added${due?' · due '+tqDay(due):''}`);
}
function oppAddTask(){tqAddOpen({rec:oppCur.id,recLocked:true});}
// ---------- Bell (Flow 12) ----------
function bnList(all){tqInit();const me=tqMe();return BN.filter(n=>n.who===me&&(all||bnCat==='All'||n.cat===bnCat));}
function bnItem(n){
  return `<div class="bn-item ${n.read?'':'unread'}" data-bn="${n.id}" role="button" tabindex="0">
    ${n.read?'<span class="bn-dot off"></span>':'<span class="bn-dot"></span>'}
    <div class="bn-body"><div class="bn-top"><b>${xesc(n.title)}</b><span class="tq-mu">${xesc(n.t)}</span></div>
      <div class="tq-mu">${xesc(n.body)}</div><button type="button" class="bn-rec" data-bn-rec="${n.rec}">${xesc(tqRecLabel(n.rec))}</button>
      ${n.action?`<div><button type="button" class="btn-primary bn-act" data-bn-act="${n.id}" ${n.taken?'disabled':''}>${n.taken?xesc(n.taken):xesc(n.action)}</button></div>`:''}</div></div>`;
}
function bnGroups(list){return ['Today','Yesterday','Earlier'].map(d=>{const l=list.filter(n=>n.day===d);return l.length?`<div class="bn-day">${d}</div>${l.map(bnItem).join('')}`:'';}).join('')||'<div class="tq-empty">You’re all caught up.</div>';}
function bnToggle(e){
  e&&e.stopPropagation(); tqBellOpen=!tqBellOpen;
  let p=document.getElementById('bn-panel');
  if(!tqBellOpen){p&&p.remove();return;}
  if(!p){p=document.createElement('div');p.id='bn-panel';p.className='bn-panel';p.setAttribute('role','dialog');p.setAttribute('aria-label','Notifications');document.querySelector('.app').appendChild(p);}
  p.innerHTML=`<div class="bn-head"><b>Notifications</b><button type="button" class="tq-link" onclick="bnReadAll()">Mark all as read</button></div><div class="bn-scroll">${bnGroups(bnList(true))}</div><button type="button" class="bn-all" onclick="bnToggle();go('notifs')">See all notifications →</button>`;
}
function bnReadAll(){BN.forEach(n=>{if(n.who===tqMe())n.read=true;});tqBadge();bnRefresh();}
function bnRefresh(){if(tqBellOpen){tqBellOpen=false;bnToggle();}if(document.getElementById('p-notifs')?.classList.contains('on'))bnRender();}
function bnOpen(id){const n=BN.find(x=>x.id===id);if(!n)return;n.read=true;tqBadge();if(tqBellOpen){tqBellOpen=false;document.getElementById('bn-panel')?.remove();}tqOpenRec(n.rec);}
function bnAct(id){
  const n=BN.find(x=>x.id===id); n.read=true;
  if(n.kind==='draft'){const t=TQ.find(x=>x.id==='b1');if(tqBellOpen)bnToggle();if(t&&t.status==='needs_approval'){tqDraft(t);return;}tqOpenRec(n.rec);return;}
  if(n.kind==='approve'){n.taken='Approved';tqBadge();bnRefresh();showToast('Hold on #CM9824 approved for Mark Debono · Karl was told');}
}
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-bn-act]'); if(a){e.stopPropagation();bnAct(a.dataset.bnAct);return;}
  const r=e.target.closest('[data-bn-rec]'); if(r){e.stopPropagation();const it=r.closest('[data-bn]');if(it)BN.find(x=>x.id===it.dataset.bn).read=true;tqBadge();if(tqBellOpen)bnToggle();tqOpenRec(r.dataset.bnRec);return;}
  const i=e.target.closest('[data-bn]'); if(i){bnOpen(i.dataset.bn);return;}
  if(tqBellOpen&&e.target.isConnected&&!e.target.closest('#bn-panel,#bnBell')){tqBellOpen=false;document.getElementById('bn-panel')?.remove();}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tqBellOpen){tqBellOpen=false;document.getElementById('bn-panel')?.remove();}});
// ---------- All notifications page ----------
function bnRender(){
  const root=document.getElementById('bn-root'); if(!root) return;
  const cats=['All',...new Set(bnList(true).map(n=>n.cat))];
  root.innerHTML=`<div class="crm-page-heading tq-head"><div><div class="page-title">Notifications</div><div class="page-sub">Everything Bricly told you, newest first. Choose what reaches you, and where, in Settings.</div></div><button type="button" class="tq-link" onclick="go('settings');stGo('p:mynotif')">Notification settings →</button></div>
    <div class="crm-page-controls"><div class="tabs">${cats.map(c=>`<button type="button" class="tab ${bnCat===c?'on':''}" onclick="bnCat='${c}';bnRender()">${c}</button>`).join('')}</div><div class="toolbar"><button class="btn-ghost" onclick="bnReadAll()">Mark all as read</button></div></div>
    <div class="dcard bn-page">${bnGroups(bnList(false))}</div>`;
}
function tqOnNav(page){if(page==='tasks'){tqMenu=null;tqRender();}if(page==='notifs')bnRender();tqBadge();}
