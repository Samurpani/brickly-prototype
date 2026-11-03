// Putting a unit on hold (FS-106 Unit state machine · Unit Hold Flows 1–5).
// A hold always belongs to an opportunity, whether it starts from the Units page, the opportunity
// Actions menu or Linked units. Every hold waits in Approvals; approval puts the unit on hold everywhere,
// rejection leaves it Available. Releasing is a reversal: only a sales manager can do it, with a reason,
// and the unit is then offered to the next request in line.
const UH_DAYS=14;
let UH=null; // open dialog: {mode:'unit'|'link'|'join'|'opp', unitId, oppId, pick, q}
const UH_PEEK={}; // per-unit preview panels: {refused} | {release} | {reject}
let uhReorder=false;

function uhMe(){return (typeof PERSONAS!=='undefined'&&PERSONAS[curPersona]?.name)||'Sam';}
function uhMgr(){return typeof apCanDecide==='function'?apCanDecide():curPersona!=='rep';}
function uhOrd(n){return n===1?'1st':n===2?'2nd':n===3?'3rd':n+'th';}
function uhDay(d){return `${d.getDate()} ${d.toLocaleString('en-GB',{month:'short'})}`;}
function uhStamp(){const d=new Date();return `${uhDay(d)}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function uhUntil(days=UH_DAYS){const d=new Date();d.setDate(d.getDate()+days);return uhDay(d);}
function uhFirst(name){return String(name||'').split(' ')[0];}

// ---------- State, read from Approvals so the queue stays the single source of truth ----------
function uhLine(unitId){return typeof APPROVALS==='undefined'?[]:APPROVALS.filter(r=>!r.decided&&r.unit===unitId&&apUnitLine(r));}
function uhPending(unitId){return uhLine(unitId).filter(r=>r.type==='hold');}
// One numbering everywhere: the holder is 1st, then the waiting requests in order.
function uhPlace(r){
  if(!r||!r.unit) return 0;
  const line=uhLine(r.unit), i=line.indexOf(r), u=typeof UN==='function'?UN(r.unit):null;
  return i<0?0:i+1+(u&&uhHolder(u)?1:0);
}
function uhHeldReq(unitId){return typeof APPROVALS==='undefined'?null:APPROVALS.find(r=>r.decided==='approved'&&!r.released&&r.type==='hold'&&r.unit===unitId)||null;}
function uhHolder(u){
  if(!u||u.status!=='hold') return null;
  const r=uhHeldReq(u.id);
  if(r) return {buyer:r.buyer,opp:r.opp,rep:r.rep,until:(r.until||'').split(',')[0],req:r};
  // Holds that predate the queue: the active opportunity on the unit holds it.
  const o=OPPS.find(x=>x.units.includes(u.id)&&!['Closed Won','Lost'].includes(x.stage));
  if(!u.holdUntil) u.holdUntil=uhUntil(8);
  return {buyer:o?.lead||'a buyer',opp:o?.id||'',rep:o?.rep||'',until:u.holdUntil,req:null};
}
// Units waiting on a hold decision while still Available (the "Pending approval" filter).
function uhIsPending(u){return u.status==='available'&&uhPending(u.id).length>0;}
function uhPendingUnits(){return typeof UNITS==='undefined'?[]:UNITS.filter(uhIsPending);}
function uhLog(u,entry){u.holdLog=u.holdLog||[];u.holdLog.unshift({when:uhStamp(),...entry});}
function uhOppUnitState(o,x,unitId,i){
  if(typeof APPROVALS!=='undefined'){
    const open=APPROVALS.find(r=>!r.decided&&r.type==='hold'&&r.opp===o.id&&r.unit===unitId);
    if(open) return {s:'requested',r:open};
    const ok=APPROVALS.find(r=>r.decided==='approved'&&!r.released&&r.type==='hold'&&r.opp===o.id&&r.unit===unitId);
    if(ok) return {s:'held',r:ok};
  }
  if(x.hold&&x.hold.unit===unitId) return x.hold.state?{s:x.hold.state}:null;
  if(i===0&&!x.hold){const h=oppHoldState(o,x);if(h) return {s:h};}
  return null;
}

// ---------- Refresh every surface that shows the unit ----------
function uhRefresh(unitId){
  if(document.getElementById('p-properties')?.classList.contains('on')&&typeof renderUnits==='function') renderUnits();
  if(unitId&&typeof unPeekId!=='undefined'&&unPeekId===unitId&&document.getElementById('unPeek')?.classList.contains('open')) openUnPeek(unitId);
  if(document.getElementById('p-unit')?.classList.contains('on')&&typeof renderUnit==='function') renderUnit();
  if(typeof oppCur!=='undefined'&&oppCur&&document.getElementById('p-opp')?.classList.contains('on')) renderOpp();
  if(typeof pipeRenderAll==='function') pipeRenderAll();
  if(typeof apBadge==='function') apBadge();
  if(document.getElementById('p-approvals')?.classList.contains('on')&&typeof apRender==='function') apRender();
}

// ---------- Dialog: choose the opportunity (or unit) the hold is for ----------
function uhOpen(mode,opts={}){
  UH={mode,unitId:opts.unitId||null,oppId:opts.oppId||null,pick:null,q:''};
  if(mode==='opp'){
    const o=OPPS.find(x=>x.id===UH.oppId); if(!o) return;
    const ok=uhOppLinked(o).filter(r=>r.ok);
    UH.pick=opts.pick&&uhUnitSelectable(o,opts.pick)?opts.pick:ok[0]?.id||null;
  }
  let el=document.getElementById('uh-modal');
  if(!el){
    el=document.createElement('div');el.className='cr-modal uhx-modal';el.id='uh-modal';
    el.onclick=e=>{if(e.target===el)uhClose();};
    el.onkeydown=e=>{if(e.key==='Escape')uhClose();};
    document.body.appendChild(el);
  }
  uhRender();
  el.querySelector('.uhx-search input')?.focus();
}
function uhClose(){document.getElementById('uh-modal')?.remove();UH=null;}
function uhOppActive(o){return !['Closed Won','Lost'].includes(o.stage)&&!o.unassigned;}
function uhOppCandidates(){
  const id=UH.unitId, q=UH.q.trim().toLowerCase();
  return OPPS.filter(o=>uhOppActive(o)
    &&(UH.mode==='link'?!o.units.includes(id):!APPROVALS.some(r=>r.opp===o.id&&r.unit===id&&apUnitLine(r)&&(!r.decided||(r.decided==='approved'&&!r.released))))
    &&(!q||[o.lead,o.id,o.rep,o.stage,...o.devs].join(' ').toLowerCase().includes(q)))
    .sort((a,b)=>(b.units.includes(id)?1:0)-(a.units.includes(id)?1:0));
}
function uhUnitSelectable(o,unitId){
  const u=UN(unitId);
  return !!u&&u.status==='available'&&!uhOppUnitState(o,getExt(o),unitId,o.units.indexOf(unitId));
}
function uhOppLinked(o){
  return o.units.map(id=>{const u=UN(id);if(!u) return null;const st=uhOppUnitState(o,getExt(o),id,o.units.indexOf(id));return {id,u,st,ok:uhUnitSelectable(o,id)};}).filter(Boolean);
}
function uhOppOthers(o){
  const q=UH.q.trim().toLowerCase();
  const list=UNITS.filter(u=>u.status==='available'&&!o.units.includes(u.id)
    &&(!q||[u.id,u.dev,u.type,DEV(u.dev).loc].join(' ').toLowerCase().includes(q)));
  return list.slice(0,q?8:4);
}
function uhUnitLine(u){return `${u.type} \u00b7 ${unBedsLabel(u)} \u00b7 ${u.sqm} m\u00b2`;}
function uhSwatch(){return '<span class="uhx-sw" aria-hidden="true"></span>';}
function uhRender(){
  const el=document.getElementById('uh-modal'); if(!el||!UH) return;
  const m=UH.mode, u=UH.unitId?UN(UH.unitId):null, o=UH.oppId?OPPS.find(x=>x.id===UH.oppId):null;
  const title=m==='link'?`Add ${u.id} to an opportunity`:m==='join'?`Join the line for ${u.id}`:m==='opp'?`Put a unit on hold for ${xesc(o.lead)}`:`Put ${u.id} on hold`;
  const holder=u?uhHolder(u):null, ahead=u?uhLine(u.id).length+(holder?1:0):0;
  const sub=m==='link'?'The unit joins the buyer\u2019s shortlist. Its status doesn\u2019t change.'
    :m==='join'?`${u.id} is ${holder?`on hold for ${xesc(holder.buyer)}`:'waiting on a hold request'}. Your request joins the line in request order and is offered to the buyer when it\u2019s their turn.`
    :m==='opp'?`${o.id} \u00b7 ${xesc(o.stage)} \u00b7 Rep: ${xesc(o.rep)}. Pick one of the linked units, or another available unit to link.`
    :'A hold must be linked to an opportunity. Choose the buyer it\u2019s for.';
  const cta=m==='link'?'Add to opportunity':m==='join'?'Join the line':'Request hold';
  el.innerHTML=`<div class="cr-modal-box uhx-box" role="dialog" aria-modal="true" aria-labelledby="uh-title">
    <div class="uhx-head"><div><div class="uhx-title" id="uh-title">${title}</div><div class="uhx-sub">${sub}</div></div>
      <button type="button" class="uhx-x" aria-label="Close" onclick="uhClose()">\u00d7</button></div>
    ${u?`<div class="uhx-unit">${uhSwatch(u)}<b>${u.id}</b> \u00b7 ${xesc(u.dev)} \u2014 ${xesc(DEV(u.dev).loc)} \u00b7 ${xesc(u.type)}<span>${fmtK(u.price)}</span></div>`:''}
    <div id="uh-list">${m==='opp'?uhOppListHtml(o):uhSearchHtml('Search opportunities')+uhOppListHtml()}</div>
    <div id="uh-sum">${m==='link'?'':uhSummaryHtml(u,o,ahead)}</div>
    <div class="uhx-foot"><button type="button" class="btn-ghost" onclick="uhClose()">Cancel</button>
      <button type="button" class="btn-primary" id="uh-submit" ${UH.pick?'':'disabled'} onclick="uhSubmit()">${cta}</button></div>
  </div>`;
}
function uhSearchHtml(placeholder){
  return `<label class="uhx-search"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg><input type="search" aria-label="${placeholder}" placeholder="${placeholder}" value="${xesc(UH.q)}" oninput="uhSetQ(this.value)"></label>`;
}
function uhOppListHtml(o){
  if(UH.mode==='opp'){
    const linked=uhOppLinked(o), others=uhOppOthers(o);
    const row=(u,chip,ok)=>`<button type="button" class="uhx-row ${UH.pick===u.id?'on':''}" role="radio" aria-checked="${UH.pick===u.id}" ${ok?`onclick="uhPick('${u.id}')"`:'disabled'}>
      ${uhSwatch(u)}<span class="uhx-row-t"><b>${u.id} \u00b7 ${xesc(u.dev)} \u00b7 ${fmtK(u.price)}</b><span>${uhUnitLine(u)}</span></span>${chip}<span class="uhx-radio" aria-hidden="true"></span></button>`;
    const linkedHtml=linked.map(({u,st,ok})=>{
      const chip=st?`<span class="pill ${st.s==='held'?'p-res':'p-hold'}">${HOLD_LABEL[st.s]}</span>`:`<span class="pill ${UN_STATUS[u.status].p}">${UN_STATUS[u.status].l}</span>`;
      return row(u,chip,ok);
    }).join('')||'<div class="uhx-empty">No units linked yet. Pick an available unit below.</div>';
    const othersHtml=others.map(u=>row(u,UH.pick===u.id?'<span class="uhx-chip">Will be linked</span>':'',true)).join('')||'<div class="uhx-empty">No available units match.</div>';
    return `<div class="uhx-sec">Linked units</div>${linkedHtml}<div class="uhx-sec">Other available units</div>${uhSearchHtml('Search by unit, development or location')}<div id="uh-others">${othersHtml}</div>`;
  }
  const list=uhOppCandidates();
  return `<div class="uhx-list" role="radiogroup" aria-label="Opportunities">${list.map(x=>`<button type="button" class="uhx-row ${UH.pick===x.id?'on':''}" role="radio" aria-checked="${UH.pick===x.id}" onclick="uhPick('${x.id}')">
      <span class="uhx-av">${initials(x.lead)}</span><span class="uhx-row-t"><b>${xesc(x.lead)}</b><span>${x.id} \u00b7 ${xesc(x.stage)} \u00b7 ${xesc(x.rep)}</span></span>
      ${x.units.includes(UH.unitId)?'<span class="uhx-chip">Linked</span>':''}<span class="uhx-radio" aria-hidden="true"></span></button>`).join('')||'<div class="uhx-empty">No opportunities match.</div>'}</div>`;
}
function uhSummaryHtml(u,o,ahead){
  let heldFor='Choose an opportunity';
  if(UH.mode==='opp'&&UH.pick){const p=UN(UH.pick);heldFor=`${p.id} \u00b7 ${xesc(p.dev)}${o.units.includes(p.id)?'':' (will be linked)'}`;}
  else if(UH.pick){const p=OPPS.find(x=>x.id===UH.pick);heldFor=`${xesc(p.lead)} \u00b7 ${p.id}${p.units.includes(u.id)?'':' (will be linked)'}`;}
  const rows=[['Hold period',`${UH_DAYS} days \u00b7 until ${uhUntil()}`],['Held for',heldFor]];
  if(UH.mode==='join') rows.push(['Place in line',`${uhOrd(ahead+1)}, behind ${ahead} ${ahead===1?'request':'requests'}`],['Approval','When it\u2019s this buyer\u2019s turn, the request goes to a sales manager.']);
  else rows.push(['Approval','Sent to a sales manager. The unit stays Available until approved.']);
  return `<div class="uhx-sum">${rows.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
}
function uhSetQ(v){
  UH.q=v;
  if(UH.mode==='opp'){const o=OPPS.find(x=>x.id===UH.oppId);document.getElementById('uh-others').innerHTML=uhOppOthers(o).map(u=>`<button type="button" class="uhx-row ${UH.pick===u.id?'on':''}" role="radio" aria-checked="${UH.pick===u.id}" onclick="uhPick('${u.id}')">${uhSwatch(u)}<span class="uhx-row-t"><b>${u.id} \u00b7 ${xesc(u.dev)} \u00b7 ${fmtK(u.price)}</b><span>${uhUnitLine(u)}</span></span>${UH.pick===u.id?'<span class="uhx-chip">Will be linked</span>':''}<span class="uhx-radio" aria-hidden="true"></span></button>`).join('')||'<div class="uhx-empty">No available units match.</div>';return;}
  document.querySelector('#uh-list .uhx-list').outerHTML=uhOppListHtml();
}
function uhPick(id){
  UH.pick=id;
  const q=UH.q;uhRender();
  const input=document.querySelector(UH.mode==='opp'?'#uh-others':'#uh-list .uhx-search input');
  if(q&&UH.mode!=='opp') input?.focus();
}
function uhSubmit(){
  if(!UH||!UH.pick) return;
  const {mode,pick}=UH;
  if(mode==='opp'){const o=OPPS.find(x=>x.id===UH.oppId);uhClose();uhFile(o,pick);return;}
  const o=OPPS.find(x=>x.id===pick), unitId=UH.unitId;
  uhClose();
  if(mode==='link') uhLink(o,unitId);
  else uhFile(o,unitId,mode==='join');
}

// ---------- Actions ----------
function uhLinkUnit(o,u){
  if(o.units.includes(u.id)) return false;
  o.units.push(u.id);
  if(!o.devs.includes(u.dev)) o.devs.push(u.dev);
  return true;
}
function uhLink(o,unitId){
  const u=UN(unitId); if(!o||!u) return;
  uhLinkUnit(o,u);
  getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`${u.id} (${u.dev}) added to the shortlist by ${uhMe()}`});
  uhRefresh(unitId);
  showToast(`${u.id} added to ${o.lead}\u2019s shortlist \u00b7 its status hasn\u2019t changed`);
}
function uhFile(o,unitId,join=false){
  const u=UN(unitId), me=uhMe(); if(!o||!u) return;
  const ahead=uhLine(unitId).length+(uhHolder(u)?1:0);
  const linked=!uhLinkUnit(o,u);
  const r=apFile(o,unitId,'hold');
  if(!r.requestedBy) Object.assign(r,{days:UH_DAYS,until:`${uhUntil()}, 18:00`,requestedBy:me,filedAt:uhStamp()});
  const x=getExt(o);
  if(!x.hold||x.hold.state!=='held') x.hold={unit:unitId,state:'requested'};
  x.blocker=`Hold on ${unitId} \u2014 ${r.id} waiting in Approvals`;
  if(tlIdx(o,x)<1) x.tl=1;
  x.comms.unshift({ch:'sys',tone:'warn',t:'Just now',text:`Hold requested on ${unitId} by ${me}${linked?'':' (unit linked)'}. Sent to Approvals.`});
  uhLog(u,join||ahead?{t:`Joined the line \u00b7 ${uhOrd(ahead+1)}`,who:`${me} \u00b7 for ${o.lead}`,req:r.id}:{t:'Hold requested',who:`${me} \u00b7 for ${o.lead}`,req:r.id});
  delete UH_PEEK[unitId];
  uhRefresh(unitId);
  showToast(ahead
    ?`Joined the line \u00b7 ${o.lead} is ${uhOrd(ahead+1)} for ${unitId}. ${uhFirst(o.rep)} is notified when it\u2019s their turn.`
    :`Hold requested \u00b7 Sent to Approvals. ${unitId} stays Available until a sales manager approves the hold for ${o.lead}.`);
}
function uhHoldFromPeek(unitId){uhOpen('unit',{unitId});}
function uhLinkFromPeek(unitId){uhOpen('link',{unitId});}
function uhJoin(unitId){uhOpen('join',{unitId});}
// Opportunity entry points: Actions menu, Linked units row, Assist and the timeline.
function uhOpenForOpp(oppId,unitId){uhOpen('opp',{oppId,pick:unitId});}
function uhReserve(oppId,unitId){
  const o=OPPS.find(x=>x.id===oppId); if(!o) return;
  if(typeof oppCur!=='undefined'&&oppCur?.id===oppId&&typeof otDepositOpen==='function'){otDepositOpen();return;}
  showToast(`Open ${o.lead}\u2019s opportunity to reserve ${unitId}`);
}

// Manager decisions from the unit preview reuse the Approvals queue rules (first in line, reasons, undo).
function uhApprove(reqId){if(uhMgr()) apApprove(reqId);}
function uhRejectOpen(unitId,reqId){UH_PEEK[unitId]={reject:reqId};openUnPeek(unitId);document.querySelector('#unPeek .uhx-reject')?.scrollIntoView({block:'nearest'});}
function uhReject(unitId,reqId){
  if(!document.querySelector('#apRsn .on')){showToast('Choose a reason');return;}
  delete UH_PEEK[unitId];
  apReject(reqId);
}
function uhReleaseOpen(unitId){
  UH_PEEK[unitId]=uhMgr()?{release:true}:{refused:true};
  openUnPeek(unitId);
  const box=document.querySelector('#unPeek .uhx-release, #unPeek .uhx-refused');
  box?.scrollIntoView({block:'nearest'});
  document.getElementById('uh-release-reason')?.focus();
}
function uhCancelPanel(unitId){delete UH_PEEK[unitId];openUnPeek(unitId);}
function uhRelease(unitId){
  const u=UN(unitId), field=document.getElementById('uh-release-reason'), reason=field?.value.trim();
  if(!u||!uhMgr()) return;
  if(!reason){showToast('Add a reason to release the hold');field?.focus();return;}
  const h=uhHolder(u), me=uhMe();
  if(h?.req) h.req.released={by:me,reason,at:uhStamp()};
  u.status='available';
  const holderOpp=h?.opp?OPPS.find(x=>x.id===h.opp):null;
  if(holderOpp){
    const x=getExt(holderOpp);
    x.hold={unit:unitId,state:null,released:true};
    x.comms.unshift({ch:'sys',tone:'bad',t:'Just now',text:`Hold on ${unitId} released by ${me} \u00b7 \u201c${reason}\u201d`});
  }
  uhLog(u,{t:'On hold \u2192 Available',who:`${me} \u00b7 released from ${h?.buyer||'the buyer'}`,quote:reason});
  const line=uhLine(unitId), next=line[0];
  delete UH_PEEK[unitId];
  if(next){
    next.offered=true;
    uhLog(u,{t:'Offered to next in line',who:`System \u00b7 ${next.buyer} \u00b7 ${AP_TYPES[next.type].l.toLowerCase()} request sent to Approvals`});
    const no=next.opp?OPPS.find(x=>x.id===next.opp):null;
    if(no) getExt(no).comms.unshift({ch:'sys',tone:'warn',t:'Just now',text:`${unitId} is back on the market and offered to ${next.buyer}, next in line. ${next.id} is first in Approvals.`});
    uhRefresh(unitId);
    const more=line.length-1;
    showToast(`${unitId} offered to ${next.buyer} \u00b7 ${uhFirst(next.buyer)} was next in line. ${uhFirst(next.rep)} has been notified, and the request is first in Approvals.${more?` ${more} more moved up in the line.`:''}`);
    return;
  }
  uhRefresh(unitId);
  showToast(`${unitId} is Available again \u00b7 the reason is in its history${holderOpp?` and on ${holderOpp.lead}\u2019s opportunity`:''}`);
}
// Managers can change the order of requests waiting behind the hold.
function uhToggleReorder(unitId){uhReorder=!uhReorder;UH_MOVE=null;uhRefresh(unitId);}
// FS-508: only a manager reorders; every move needs a reason, is logged on the unit and tells the affected rep.
let UH_MOVE=null; // {unitId, reqId, dir}
function uhMove(unitId,reqId,dir){
  if(!uhMgr()) return;
  const line=uhLine(unitId), i=line.findIndex(r=>r.id===reqId), j=i+dir;
  if(i<0||j<0||j>=line.length) return;
  UH_MOVE={unitId,reqId,dir};uhRefresh(unitId);
  setTimeout(()=>document.querySelector('.uhx-move-reason textarea')?.focus(),0);
}
function uhMoveCancel(unitId){UH_MOVE=null;uhRefresh(unitId);}
function uhMoveConfirm(btn,unitId){
  const m=UH_MOVE; if(!m||!uhMgr()) return;
  const box=btn.closest('.uhx-move-reason'), reason=box?.querySelector('textarea')?.value.trim();
  if(!reason){box?.querySelector('.uhx-move-err')?.removeAttribute('hidden');box?.querySelector('textarea')?.focus();return;}
  const line=uhLine(unitId), i=line.findIndex(r=>r.id===m.reqId), j=i+m.dir;
  if(i<0||j<0||j>=line.length){uhMoveCancel(unitId);return;}
  const moved=line[i], other=line[j];
  const a=APPROVALS.indexOf(moved), b=APPROVALS.indexOf(other);
  [APPROVALS[a],APPROVALS[b]]=[APPROVALS[b],APPROVALS[a]];
  uhLog(UN(unitId),{t:`Line reordered \u00b7 ${moved.buyer} moved ${m.dir<0?'up':'down'} to ${uhOrd(uhPlace(moved))}`,who:uhMe(),quote:reason});
  [moved,other].forEach(r=>{const o=r.opp&&OPPS.find(x=>x.id===r.opp);if(o)getExt(o).comms.unshift({ch:'sys',tone:'warn',t:'Just now',text:`${uhMe()} reordered the line on ${unitId}. ${r.buyer} is now ${uhOrd(uhPlace(r))}. Reason: ${reason}`});});
  UH_MOVE=null;
  showToast(`${moved.buyer} is now ${uhOrd(uhPlace(moved))} on ${unitId}. ${uhFirst(moved.rep)} and ${uhFirst(other.rep)} have been notified.`);
  uhRefresh(unitId);
}

// ---------- Unit preview sections ----------
function uhOppLabel(u){
  const h=uhHolder(u); if(h) return 'Opportunity: '+xesc(h.buyer);
  const w=uhLine(u.id)[0]; if(w) return 'Opportunity: '+xesc(w.buyer);
  const deals=typeof unDealsFor==='function'?unDealsFor(u.id):[];
  return deals.length===1?'Opportunity: '+xesc(deals[0].lead):deals.length?`${deals.length} opportunities`:'No opportunity';
}
function uhPeekTags(u){
  const h=uhHolder(u), line=uhLine(u.id), offered=line[0]?.offered;
  const inLine=h?line.length:offered?line.length-1:0;
  return `${inLine>0?`<span class="uhx-inline">${inLine} in line</span>`:''}<span class="uhx-opp">${uhOppLabel(u)}</span>`;
}
function uhBanner(u){
  const h=uhHolder(u), line=uhLine(u.id), first=line[0], mgr=uhMgr();
  if(h) return `<div class="uhx-banner bad">On hold for ${xesc(h.buyer)}${h.opp?` (${h.opp})`:''} until ${xesc(h.until)}. It\u2019s released to Available automatically if it isn\u2019t reserved by then.</div>`;
  if(u.status!=='available'||!first) return '';
  const acts=mgr&&first.type==='hold'&&!UH_PEEK[u.id]?.reject?`<div class="uhx-banner-acts"><button type="button" class="btn-primary" onclick="uhApprove('${first.id}')">Approve hold</button><button type="button" class="btn-ghost" onclick="uhRejectOpen('${u.id}','${first.id}')">Reject</button></div>`:'';
  if(first.offered) return `<div class="uhx-banner warn">Back on the market and offered to ${xesc(first.buyer)}, who was next in line. The ${AP_TYPES[first.type].l.toLowerCase()} request is first in Approvals.${acts}</div>`;
  if(first.type!=='hold') return '';
  const by=xesc(first.requestedBy||first.rep);
  return mgr?`<div class="uhx-banner warn">Hold requested by ${by} for ${xesc(first.buyer)}. Review it in Approvals.${acts}</div>`
    :`<div class="uhx-banner warn">Hold requested by ${by} for ${xesc(first.buyer)}. Waiting in Approvals. The unit stays Available until then.</div>`;
}
function uhPriority(u){
  const h=uhHolder(u), line=uhLine(u.id);
  if(!h&&!line[0]?.offered&&line.length<2) return '';
  const mgr=uhMgr(), rows=[];
  if(h) rows.push({n:h.buyer,s:`${h.opp?h.opp+' \u00b7 ':''}Rep: ${h.rep||'\u2014'}`,chip:`<span class="uhx-chip bad">Holding until ${xesc(h.until)}</span>`});
  line.forEach((r,i)=>rows.push({n:r.buyer,s:`${r.opp?r.opp+' \u00b7 ':''}Rep: ${r.rep}`,id:r.id,i,
    chip:r.offered?'<span class="uhx-chip warn">Offered \u00b7 awaiting approval</span>':!h&&i===0?'<span class="uhx-chip warn">First \u00b7 awaiting approval</span>':`<span class="uhx-chip">Waiting since ${xesc(r.filedAt||'today '+r.filed)}</span>`}));
  const canMove=mgr&&uhReorder&&line.length>1;
  return `<div class="uhx-prio"><div class="uhx-prio-h"><b>Priority list</b><span>Ordered by request time${mgr&&line.length>1?` \u00b7 <button type="button" class="uhx-link" onclick="uhToggleReorder('${u.id}')">${uhReorder?'Done':'Reorder'}</button>`:''}</span></div>
    ${rows.map((r,k)=>`<div class="uhx-prio-row"><span class="uhx-n">${k+1}</span><span class="uhx-row-t"><b>${xesc(r.n)}</b><span>${xesc(r.s)}</span></span>${r.chip}
      ${canMove&&r.id?`<span class="uhx-move"><button type="button" aria-label="Move ${xesc(r.n)} up" ${r.i===0?'disabled':''} onclick="uhMove('${u.id}','${r.id}',-1)">\u2191</button><button type="button" aria-label="Move ${xesc(r.n)} down" ${r.i===line.length-1?'disabled':''} onclick="uhMove('${u.id}','${r.id}',1)">\u2193</button></span>`:''}</div>`).join('')}
    ${UH_MOVE&&UH_MOVE.unitId===u.id&&mgr?uhMoveReasonHtml(u,line):''}
    <div class="uhx-prio-note">${h||line[0]?.offered?'If the hold ends or a reservation falls through, the unit is offered to the next in line and their rep is notified.':'The first request is decided in Approvals. If it is rejected, the next buyer moves up and their rep is notified.'}${mgr?'':' Only a sales manager can change the order.'}</div></div>`;
}
function uhMoveReasonHtml(u,line){
  const r=line.find(x=>x.id===UH_MOVE.reqId); if(!r) return '';
  const to=uhPlace(r)+UH_MOVE.dir;
  return `<div class="uhx-card uhx-move-reason"><b>Move ${xesc(r.buyer)} ${UH_MOVE.dir<0?'up':'down'} to ${uhOrd(to)}</b>
    <label>Reason (required, saved to the unit history and sent to both reps)</label><textarea rows="2" placeholder="e.g. Deposit ready today, agreed with the director"></textarea>
    <div class="uhx-move-err" hidden style="color:var(--error);font-size:12px">Add a reason to reorder the line.</div>
    <div class="uhx-card-acts"><button type="button" class="btn-ghost" onclick="uhMoveCancel('${u.id}')">Cancel</button><button type="button" class="btn-primary" onclick="uhMoveConfirm(this,'${u.id}')">Move</button></div></div>`;
}
function uhPanel(u){
  const p=UH_PEEK[u.id]; if(!p) return '';
  if(p.refused) return `<div class="uhx-banner bad uhx-refused" role="alert">Refused. Releasing a hold is a reversal. Only a sales manager can release it, with a reason.</div>`;
  if(p.release&&uhMgr()) return `<div class="uhx-card uhx-release"><b>Release hold on ${u.id}</b>
    <label for="uh-release-reason">Reason (required, saved to the unit history)</label>
    <textarea id="uh-release-reason" rows="3"></textarea>
    <div class="uhx-card-acts"><button type="button" class="btn-ghost" onclick="uhCancelPanel('${u.id}')">Cancel</button><button type="button" class="btn-primary" onclick="uhRelease('${u.id}')">Release to Available</button></div></div>`;
  if(p.reject&&uhMgr()){
    const r=APPROVALS.find(q=>q.id===p.reject); if(!r||r.decided) return '';
    return `<div class="uhx-card uhx-reject"><b>Reject the hold for ${xesc(r.buyer)}</b>
      <label>Reason</label><div class="chk-row" id="apRsn">${AP_REASONS.map(l=>`<button type="button" class="fm-opt" onclick="qaPick(this)">${l}</button>`).join('')}</div>
      <label for="apRsnNote">Note to ${xesc(uhFirst(r.requestedBy||r.rep))} (optional)</label><textarea id="apRsnNote" rows="2"></textarea>
      <div class="uhx-card-acts"><button type="button" class="btn-ghost" onclick="uhCancelPanel('${u.id}')">Cancel</button><button type="button" class="btn-primary" onclick="uhReject('${u.id}','${r.id}')">Reject request</button></div></div>`;
  }
  return '';
}
function uhPeekSections(u){return uhBanner(u)+uhPriority(u)+uhPanel(u);}
function uhHistoryHtml(u){
  const log=u.holdLog||[];
  return `<div class="uhx-hist"><div class="uhx-hist-h">History</div>${log.length?log.map(e=>`<div class="uhx-hist-row"><b>${xesc(e.t)}</b><span>${xesc(e.who)} \u00b7 ${xesc(e.when)}</span>${e.quote?`<q>${xesc(e.quote)}</q>`:''}</div>`).join(''):'<div class="uhx-hist-empty">No status changes yet.</div>'}</div>`;
}
function uhPeekFoot(u){
  const st=UN_STATUS[u.status], mgr=uhMgr(), line=uhLine(u.id);
  if(u.status==='hold') return `<button class="btn-ghost" onclick="uhJoin('${u.id}')">Join the line</button><button class="btn-ghost" onclick="uhReleaseOpen('${u.id}')">Release hold</button>`;
  if(u.status!=='available') return `<button class="btn-ghost" onclick="openUnit('${u.id}')">Open unit</button><button class="btn-primary" disabled style="opacity:.4;cursor:default">${st.l}</button>`;
  if(line.length){
    return mgr?`<button class="btn-primary" onclick="uhReview('${line[0].id}')">Review in Approvals</button><button class="btn-ghost" onclick="uhJoin('${u.id}')">Join the line</button>`
      :`<button class="btn-ghost" onclick="uhLinkFromPeek('${u.id}')">Add to opportunity</button><button class="btn-primary" disabled>Hold requested</button><button class="btn-ghost" onclick="uhJoin('${u.id}')">Join the line</button>`;
  }
  return `<button class="btn-ghost" onclick="openUnit('${u.id}')">Open unit</button><button class="btn-ghost" onclick="uhLinkFromPeek('${u.id}')">Add to opportunity</button><button class="btn-primary" onclick="uhHoldFromPeek('${u.id}')">Put on hold</button>`;
}
function uhReview(reqId){closeUnPeek();apTab='open';apType='all';apSel=reqId;go('approvals');apRender();}

// ---------- Unit page: same flow as the opportunity page (choose the opportunity → request waits in Approvals) ----------
function uhUnitHold(unitId){uhOpen('unit',{unitId});}
function uhUnitPageBtns(u){
  const line=uhLine(u.id), mgr=uhMgr();
  if(u.status==='hold') return `<button type="button" class="btn-ghost" onclick="uhJoin('${u.id}')">Join the line</button><button type="button" class="btn-ghost" onclick="uhReleaseOpen('${u.id}')">Release hold</button>`;
  if(u.status!=='available') return '';
  if(line.length) return mgr
    ?`<button type="button" class="btn-ghost" onclick="uhJoin('${u.id}')">Join the line</button><button type="button" class="btn-ghost" onclick="uhReview('${line[0].id}')">Review hold request</button>`
    :`<button type="button" class="btn-ghost" onclick="uhJoin('${u.id}')">Join the line</button><button type="button" class="btn-ghost" disabled>Hold requested</button>`;
  return `<button type="button" class="btn-ghost" onclick="uhUnitHold('${u.id}')">Put on hold</button>`;
}
function uhUnitPageMenuItem(u){
  if(u.status!=='available'||uhLine(u.id).length) return '';
  return `<button onclick="unAct('uhUnitHold','${u.id}')"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="3" y="6" width="8" height="6" rx="1"/><path d="M5 6V4.5a2 2 0 014 0V6"/></svg>Put on hold</button>`;
}

// ---------- Units page: pending tag, banner and filter ----------
function uhIntTag(u){return uhIsPending(u)?'<span class="un-int uhx-req">Hold requested</span>':'';}
function uhUnitsBanner(){
  if(!uhMgr()) return '';
  const units=uhPendingUnits(); if(!units.length) return '';
  const parts=units.map(u=>`${u.id} for ${xesc(uhPending(u.id)[0].buyer)}`);
  const text=parts.length===1?parts[0]:parts.length===2?parts.join(' and '):`${parts.slice(0,2).join(', ')} and ${parts.length-2} more`;
  return `<div class="uhx-units-banner" role="status"><span>${units.length} hold request${units.length>1?'s':''} waiting for your approval: ${text}.</span><button type="button" class="uhx-link" onclick="uhReviewUnits()">Review</button></div>`;
}
function uhReviewUnits(){
  const units=uhPendingUnits();
  if(units.length===1){openUnPeek(units[0].id);return;}
  unState.tab='pending';renderUnits();
}
// Unit page: same banner and line as the preview, plus the shared history.
function uhUnitPageHtml(u){return uhBanner(u).replace(/<div class="uhx-banner-acts">[\s\S]*?<\/div>/,'')+uhPriority(u);}

// ---------- Keep the unit history in step with Approvals decisions (including Undo) ----------
(function(){
  const commit=apCommitDecision, capture=apCaptureState, restore=apRestoreState, finish=apFinishDecision;
  apCommitDecision=function(r){
    const before=apUnit(r.unit)?.status;
    commit.apply(this,arguments);
    const u=apUnit(r.unit); if(!u||!apUnitLine(r)) return;
    u.holdLog=(u.holdLog||[]).filter(e=>!(e.req===r.id&&e.decision));
    delete r.offered;
    const who=`${r.by} \u00b7 for ${r.buyer} \u00b7 requested by ${r.requestedBy||r.rep}`;
    const o=r.opp&&OPPS.find(x=>x.id===r.opp);
    if(r.decided==='approved'&&o&&uhLinkUnit(o,u)) getExt(o).comms.splice(1,0,{ch:'sys',t:'Just now',text:`${u.id} (${u.dev}) linked so the hold and the shortlist stay in step`});
    if(r.decided==='approved') uhLog(u,{t:`${UN_STATUS[before]?.l||'Available'} \u2192 ${UN_STATUS[u.status].l}`,who,req:r.id,decision:true});
    else if(r.decided==='rejected') uhLog(u,{t:`${AP_TYPES[r.type].l} request rejected`,who,req:r.id,decision:true,quote:r.reason});
  };
  apCaptureState=function(r){const s=capture.apply(this,arguments),u=apUnit(r.unit);s.uhLog=u?JSON.parse(JSON.stringify(u.holdLog||[])):null;return s;};
  apRestoreState=function(r,state){restore.apply(this,arguments);const u=apUnit(r.unit);if(u&&state.uhLog) u.holdLog=state.uhLog;};
  apFinishDecision=function(r){finish.apply(this,arguments);if(r.unit){delete UH_PEEK[r.unit];uhRefresh(r.unit);}};
  const undo=apUndoDecision;
  apUndoDecision=function(){const id=AP_UNDO?.id,r=id&&APPROVALS.find(q=>q.id===id);undo.apply(this,arguments);if(r?.unit) uhRefresh(r.unit);};
})();
