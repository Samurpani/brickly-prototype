// Approvals queue — holds, reservations and price exceptions in arrival order.
// Design: Bricly Approvals (apr1) + Approval Queue Flows 1–8.
const AP_TYPES={hold:{l:'Hold',tone:'hold'},reservation:{l:'Reservation',tone:'res'},price:{l:'Price exception',tone:'price'},returning:{l:'Returning lead',tone:'lead'},takeover:{l:'Takeover',tone:'lead'},commission:{l:'Commission split',tone:'price'},deal:{l:'Deal from POS',tone:'res'}};
// Lead ownership requests (Cold Lead Returns flows) have no unit line; holds and reservations queue per unit.
const AP_LEAD_TYPES=new Set(['returning','takeover']);
function apUnitLine(r){return r.type==='hold'||r.type==='reservation';}
const AP_REASONS=['Unit already committed','Terms outside policy','Buyer not qualified yet','Needs more information','Other'];
const AP_REPS={'Sam':{ini:'SU',av:'var(--primary)'},'Karl Zammit':{ini:'KZ',av:'#9b5a3c'}};
let apTab='open', apType='all', apSel=null, apSeq=1050;
let AP_UNDO=null;
const AP_DECISION_BASELINES=new Map();
const APPROVALS=[
  {id:'REQ-1041',type:'hold',unit:'#CM9822',buyer:'Daniel Vella',opp:'OPP-1004',rep:'Sam',via:'App',filed:'08:12',age:147,until:'1 Oct, 18:00',days:5,note:'Second appointment with his partner on Tuesday.'},
  {id:'REQ-1042',type:'hold',unit:'#CM9822',buyer:'Luca Camilleri',rep:'Karl Zammit',via:'WhatsApp',filed:'08:47',age:112,until:'29 Sep, 18:00',days:3,note:'“Can you hold the La Lex 2-bed for Luca till Tuesday?”'},
  {id:'REQ-1043',type:'reservation',unit:'#CM9706',buyer:'Maria Borg',rep:'Sam',via:'App',filed:'09:05',age:94,deposit:10000,posBy:'24 Oct',clock:'8 days left on Maria’s hold',note:'Deposit ready by bank transfer this week.'},
  {id:'REQ-1044',type:'price',unit:'#CM1203',buyer:'Joseph Grech',rep:'Karl Zammit',via:'WhatsApp',filed:'09:31',age:68,offer:480000,floor:482000,note:'Cash buyer, can sign the POS within two weeks.'},
  {id:'REQ-1045',type:'hold',unit:'#CM9710',buyer:'Anna Spiteri',rep:'Sam',via:'App',filed:'10:22',age:17,until:'3 Oct, 18:00',days:7,note:''},
  {id:'REQ-1046',type:'returning',buyer:'Karl Micallef',rep:'Verdala registration form',via:'Web form',filed:'10:41',age:38,dev:'Verdala',orig:'Sam',lostOpp:'OPP-0931',lost:'Lost in March · Timing',lastAct:'Sam · WhatsApp · 14 Mar',changes:[['Budget','~€300k','~€420k'],['Bedrooms','2 bed','3 bed']],note:'Same phone as March. Filled the Verdala registration form again.'},
  {id:'REQ-1047',type:'takeover',buyer:'Daniela Spiteri',opp:'OPP-1005',rep:'Sam',via:'App',filed:'10:55',age:24,orig:'Maria',lastAct:'Maria · 14 days ago',note:'Walked into the sales office yesterday and wants to view Verdala this week. Maria hasn’t replied to her since August.'},
];
const AP_LOG=[];
function apUnit(id){return typeof UN==='function'?UN(id):null;}
function apOpen(){return APPROVALS.filter(r=>!r.decided);}
function apAge(m){return m>=60?`${Math.floor(m/60)}h ${m%60}m`:`${m}m`;}
function apLine(r){if(AP_LEAD_TYPES.has(r.type)||r.type==='commission'||r.type==='deal')return {pos:1,n:1};const same=apOpen().filter(q=>q.unit===r.unit&&!AP_LEAD_TYPES.has(q.type));return {pos:same.indexOf(r)+1,n:same.length};}
function apHeldBy(r){return apUnitLine(r)?APPROVALS.find(q=>q.decided==='approved'&&!q.released&&q.unit===r.unit&&apUnitLine(q)&&q.id!==r.id)||null:null;}
function apCanDecide(){return typeof curPersona==='undefined'||curPersona!=='rep';}
function apTerms(r){
  const u=apUnit(r.unit);
  if(r.type==='commission') return typeof dfApTerms==='function'?dfApTerms(r):'Commission split';
  if(r.type==='deal') return typeof dcApTerms==='function'?dcApTerms(r):'Deal from POS';
  if(r.type==='returning') return `${r.lost} · back on ${r.dev}`;
  if(r.type==='takeover') return `Take over from ${r.orig} · quiet ${r.lastAct.split('· ').pop().replace(' ago','')}`;
  if(r.type==='hold') return `Hold until ${r.until.split(',')[0]} · ${r.days} days`;
  if(r.type==='reservation') return `${fmtEur(r.deposit)} deposit · promise of sale by ${r.posBy}`;
  return `€${Math.round(r.offer/1000)}k offer on €${Math.round((u?u.price:r.offer)/1000)}k list`;
}
function apBadge(){
  const n=apOpen().length, el=document.getElementById('apNavBadge');
  if(el){el.textContent=n;el.hidden=!n;}
}
function apOnNav(page){if(page==='approvals')apRender();}
function apList(){
  const base=apTab==='open'?apOpen():APPROVALS.filter(r=>r.decided);
  return apType==='all'?base:apType==='lead'?base.filter(r=>AP_LEAD_TYPES.has(r.type)):base.filter(r=>r.type===apType);
}
function apRender(){
  const root=document.getElementById('ap-root'); if(!root) return;
  apBadge();
  const list=apList();
  if(!list.find(r=>r.id===apSel)) apSel=null;
  const decided=APPROVALS.filter(r=>r.decided).length;
  root.innerHTML=`
    <div class="crm-page-heading apq-head">
      <div><div class="page-title">Approvals</div><div class="page-sub">Holds, reservations, price exceptions and commission splits from your team, in the order they arrived.</div></div>
      <div class="cr-actions apq-actions">
        <button type="button" class="btn-ghost cr-actions-btn" id="ap-actions-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="ap-actions-menu" onclick="apToggleActions(event)" onkeydown="apActionsTriggerKeydown(event)">Actions <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button>
        <div class="cr-actions-menu" id="ap-actions-menu" role="menu" aria-label="Approval actions" style="display:none" onkeydown="apActionsMenuKeydown(event)">
          ${apCanDecide()?'<button type="button" role="menuitem" onclick="apRunAction(\'settings\')">Approval settings</button>':''}
          <button type="button" role="menuitem" onclick="apRunAction('audit')">Audit log</button>
        </div>
      </div>
    </div>
    <div class="row-between crm-page-controls">
      <div class="tabs"><button class="tab ${apTab==='open'?'on':''}" onclick="apSetTab('open')">Open · ${apOpen().length}</button><button class="tab ${apTab==='decided'?'on':''}" onclick="apSetTab('decided')">Decided · ${decided}</button></div>
      <div class="apq-types">${[['all','All types'],['hold','Holds'],['reservation','Reservations'],['price','Price exceptions'],['commission','Commission splits'],['deal','Deals from POS'],['lead','Leads']].map(([k,l])=>`<button type="button" class="apq-type ${apType===k?'on':''}" onclick="apSetType('${k}')">${l}</button>`).join('')}</div>
    </div>
    ${apCanDecide()?'':'<div class="apq-note">Approvals are decided by managers. You can see where your requests are in line.</div>'}
    <div class="apq-grid">
      <div class="apq-list" role="list">${list.map((r,i)=>apCard(r,i)).join('')||`<div class="col-empty">${apTab==='open'?'Nothing waiting. New requests land here in arrival order.':'No decisions yet.'}</div>`}</div>
      <div class="apq-detail">${apSel?apDetail(APPROVALS.find(r=>r.id===apSel)):'<div class="apq-empty-detail">Select a request to view its details.</div>'}</div>
    </div>`;
}
function apCard(r,i){
  const t=AP_TYPES[r.type], line=apLine(r), rep=AP_REPS[r.rep]||{ini:initials(r.rep),av:'var(--on-variant)'};
  const lineChip=r.decided?`<span class="apq-chip ${r.decided==='approved'||r.decided==='auto'?'ok':'bad'}">${r.decided==='auto'?'Auto approved':r.decided==='approved'?'Approved':'Rejected'}</span>`
    :AP_LEAD_TYPES.has(r.type)?'<span class="apq-chip warn">Decide within 2h</span>'
    :r.type==='commission'?'<span class="apq-chip">Differs from default</span>'
    :r.type==='deal'?'<span class="apq-chip warn">Unit not reserved</span>'
    :apUnitLine(r)&&apHeldBy(r)?`<span class="apq-chip warn">Unit held · ${typeof uhPlace==='function'&&uhPlace(r)?uhOrd(uhPlace(r))+' in line':'waiting'}</span>`
    :line.n<2?'<span class="apq-chip">Only one on unit</span>':line.pos===1?`<span class="apq-chip">1st of ${line.n} on unit</span>`:`<span class="apq-chip warn">${line.pos===2?'2nd':line.pos+'th'} · waiting</span>`;
  return `<div class="apq-card ${r.id===apSel?'on':''}" role="listitem" tabindex="0" onclick="apPick('${r.id}')" onkeydown="if(event.key==='Enter')apPick('${r.id}')">
    <div class="apq-card-top"><span class="apq-n">${i+1}</span><span class="apq-tag ${t.tone}">${t.l}</span><span class="apq-id">${r.id}</span>
      <span class="apq-age ${!r.decided&&r.age>120?'bad':''}">${r.decided?r.decidedAt:(r.age>120?'Overdue · ':'')+apAge(r.age)}</span></div>
    <div class="apq-title">${AP_LEAD_TYPES.has(r.type)?xesc(r.buyer):r.type==='commission'||r.type==='deal'?xesc((r.deal||r.unit)+' · '+r.buyer):r.unit+' · '+xesc(r.buyer)}</div>
    <div class="apq-terms">${apTerms(r)}</div>
    <div class="apq-card-foot"><span class="apq-av" style="background:${rep.av}">${rep.ini}</span><span class="apq-by">${xesc(r.rep)} · ${r.via}</span>${lineChip}</div>
  </div>`;
}
function apDetail(r){
  if(!r) return '';
  if(AP_LEAD_TYPES.has(r.type)) return apLeadDetail(r);
  if(r.type==='commission'&&typeof dfApDetail==='function') return dfApDetail(r);
  if(r.type==='deal'&&typeof dcApDetail==='function') return dcApDetail(r);
  const t=AP_TYPES[r.type], u=apUnit(r.unit), line=apLine(r), others=apOpen().filter(q=>q.unit===r.unit&&q.id!==r.id);
  const title=r.type==='hold'?`Hold ${r.unit} for ${r.buyer}`:r.type==='reservation'?`Reserve ${r.unit} for ${r.buyer}`:`Price exception on ${r.unit} for ${r.buyer}`;
  const heldBy=r.type!=='price'&&!r.decided?apHeldBy(r):null;
  const blockedBy=r.type!=='price'&&!r.decided&&(line.pos>1||!!heldBy);
  const devAvail=u?UNITS.filter(x=>x.dev===u.dev&&x.status==='available').length:0;
  const bedAvail=u?UNITS.filter(x=>x.dev===u.dev&&x.beds===u.beds&&x.status==='available').length:0;
  const after=r.type==='hold'?'On hold':r.type==='reservation'?'Reserved':'Price agreed';
  const effect=r.decided==='rejected'
    ?`<div class="apq-ctx-v">No inventory change</div><div class="apq-ctx-s">The request was rejected.</div>`
    :r.type==='price'
    ?`<div class="apq-ctx-v">${fmtEur(r.offer)} agreed for ${xesc(r.buyer)}</div><div class="apq-ctx-s">€${Math.round(((u?u.price:r.offer)-r.offer)/1000)}k below list${r.floor&&r.offer<r.floor?` and €${Math.round((r.floor-r.offer)/1000)}k below the floor price`:''}. The unit’s list price doesn’t change.</div>`
    :`<div class="apq-ctx-s">${r.unit}</div><div class="apq-ctx-v">${u?STATUS_LABEL_AP(u.status):'Available'} → <b>${after}</b></div>
      ${u&&u.status==='available'?`<div class="apq-ctx-s" style="margin-top:8px">${u.dev} available</div><div class="apq-ctx-v">${devAvail} → <b>${devAvail-1}</b></div>
      <div class="apq-ctx-s" style="margin-top:8px">${u.beds} bed available in ${u.dev}</div><div class="apq-ctx-v">${bedAvail} → <b>${bedAvail-1}</b></div>`:''}`;
  return `<div class="dcard apq-d">
    <div class="apq-d-head">
      <div><div class="apq-d-meta"><span class="apq-tag ${t.tone}">${t.l}</span>${r.id} · Filed ${r.filed} by ${xesc(r.rep)} via ${r.via}</div>
        <h2 class="apq-d-title">${xesc(title)}</h2>
        <div class="apq-d-sub">${r.decided?apDecisionLine(r):apUnitLine(r)&&apHeldBy(r)&&typeof uhPlace==='function'&&uhPlace(r)?`${uhOrd(uhPlace(r))} in line on ${r.unit} · ${xesc(apHeldBy(r).buyer)} holds it · first come, first served`:line.n>1?`${line.pos===1?'1st':line.pos===2?'2nd':line.pos+'th'} of ${line.n} requests on ${r.unit} · first come, first served`:'Only request on this unit'}</div></div>
      ${r.decided?`<div class="apq-d-acts"><button class="btn-ghost" onclick="apEditDecision('${r.id}')" ${apCanDecide()?'':'disabled'}>Edit decision</button></div>`:`<div class="apq-d-acts"><button class="btn-ghost" onclick="apRejectOpen('${r.id}')" ${apCanDecide()?'':'disabled'}>Reject</button><button class="btn-primary" onclick="apApprove('${r.id}')" ${apCanDecide()&&!blockedBy?'':'disabled'} ${blockedBy?`title="Waiting for ${heldBy?heldBy.id:others[0].id} on this unit"`:''}>Approve</button></div>`}
    </div>
    ${blockedBy?`<div class="apq-wait">${heldBy?`Can’t be approved while ${r.unit} is held for ${xesc(heldBy.buyer)} (${heldBy.id}).`:`Can’t be approved while ${others[0].id} is first in line on ${r.unit}.`} It moves up if that hold is released or expires.</div>`:''}
    <div class="apq-sec"><h3>Terms</h3><div class="apq-kv">
      <div><div class="k">Unit</div><div class="v">${r.unit}${u?` · ${u.beds} bed ${u.type} · ${u.dev}`:''}</div></div>
      <div><div class="k">Buyer</div><div class="v">${r.opp?`<a onclick="openOpp('${r.opp}')">${xesc(r.buyer)} · ${r.opp}</a>`:xesc(r.buyer)}</div></div>
      ${r.type==='hold'?`<div><div class="k">Hold until</div><div class="v">${r.until} · ${r.days} days</div></div>`:''}
      ${r.type==='reservation'?`<div><div class="k">Deposit</div><div class="v">${fmtEur(r.deposit)} · promise of sale by ${r.posBy}</div></div>`:''}
      ${r.type==='price'?`<div><div class="k">Offer</div><div class="v">${fmtEur(r.offer)}</div></div>`:''}
      <div><div class="k">Price</div><div class="v">${u?'€'+Math.round(u.price/1000)+'k list':'—'}</div></div>
    </div>
    ${r.note?`<div class="apq-kv-note"><div class="k">${r.via==='WhatsApp'?'Original message':'Note from '+xesc(r.rep.split(' ')[0])}</div><div class="v">${xesc(r.note)}</div></div>`:''}</div>
    <div class="apq-sec"><div class="row-between"><h3>Context</h3><span class="apq-src">From records · updated live</span></div>
      <div class="apq-ctx">
        <div class="apq-ctx-c"><div class="apq-ctx-h">Other demand on ${r.unit}</div>${others.length?others.map(q=>`<div class="apq-ctx-v">${q.id} · ${AP_TYPES[q.type].l} for ${xesc(q.buyer)}</div><div class="apq-ctx-s">${xesc(q.rep)} · ${apLine(q).pos===1?'1st':apLine(q).pos===2?'2nd':apLine(q).pos+'th'} in line</div>`).join(''):'<div class="apq-ctx-s">No other requests on this unit.</div>'}</div>
        <div class="apq-ctx-c"><div class="apq-ctx-h">Hold clock</div>${r.clock?`<div class="apq-ctx-v">${r.clock}</div><div class="apq-ctx-s">Approving turns it into a reservation and stops the clock.</div>`:`<div class="apq-ctx-v">No hold on this unit</div>${r.type==='hold'?`<div class="apq-ctx-s">If approved: held until ${r.until} (${r.days} days).</div>`:''}`}</div>
        <div class="apq-ctx-c"><div class="apq-ctx-h">Inventory effect · ${r.decided==='rejected'?'Not applied':r.decided?'Applied':'If approved'}</div>${effect}</div>
      </div>
    </div>
  </div>`;
}
function STATUS_LABEL_AP(s){return {available:'Available',hold:'On hold',reserved:'Reserved',sold:'Sold'}[s]||s;}
function apDecisionLine(r){if(AP_LEAD_TYPES.has(r.type)&&r.decided==='approved')return `Assigned to ${r.assignedTo} by ${r.by}${r.newOpp?' · '+r.newOpp:''}`;return r.decided==='rejected'?`Rejected by ${r.by} · ${r.reason}`:r.decided==='auto'?'Auto approved by a setting':`Approved by ${r.by} · ${r.decidedAt}`;}
function apSetTab(t){apTab=t;apSel=null;apRender();}
function apSetType(t){apType=t;apSel=null;apRender();}
function apPick(id){apSel=id;apRender();}
function apToggleActions(event){
  event.stopPropagation();
  const menu=document.getElementById('ap-actions-menu'),trigger=document.getElementById('ap-actions-trigger');
  if(!menu||!trigger)return;
  const open=menu.style.display==='none';
  menu.style.display=open?'':'none';
  trigger.setAttribute('aria-expanded',String(open));
  if(open)menu.querySelector('[role="menuitem"]')?.focus();
}
function apCloseActions(restoreFocus=false){
  const menu=document.getElementById('ap-actions-menu'),trigger=document.getElementById('ap-actions-trigger');
  if(menu)menu.style.display='none';
  trigger?.setAttribute('aria-expanded','false');
  if(restoreFocus)trigger?.focus({preventScroll:true});
}
function apActionsTriggerKeydown(event){
  if(['ArrowDown','ArrowUp'].includes(event.key)){
    event.preventDefault();
    const menu=document.getElementById('ap-actions-menu');
    if(menu?.style.display==='none')apToggleActions(event);
    if(event.key==='ArrowUp')menu?.querySelectorAll('[role="menuitem"]')?.item(menu.querySelectorAll('[role="menuitem"]').length-1)?.focus();
  }else if(event.key==='Escape')apCloseActions();
}
function apActionsMenuKeydown(event){
  const items=[...event.currentTarget.querySelectorAll('[role="menuitem"]:not([hidden]):not(:disabled)')],index=items.indexOf(document.activeElement);
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
    event.preventDefault();event.stopPropagation();
    const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
    items[next]?.focus();
  }else if(event.key==='Escape'){
    event.preventDefault();event.stopPropagation();apCloseActions(true);
  }else if(event.key==='Tab')apCloseActions();
}
function apRunAction(action){
  apCloseActions(true);
  if(action==='settings'){go('settings');stGo('p:approvals');}
  else if(action==='audit')apAudit();
}
document.addEventListener('click',event=>{
  const menu=document.getElementById('ap-actions-menu');
  if(menu&&menu.style.display!=='none'&&!event.target.closest('.apq-actions'))apCloseActions();
});
function apCanApproveNow(r){
  if(apHeldBy(r)) return false;
  const index=APPROVALS.indexOf(r);
  return !APPROVALS.slice(0,index).some(q=>!q.decided&&q.unit===r.unit&&apUnitLine(q));
}
function apMe(){return typeof PERSONAS!=='undefined'&&PERSONAS[curPersona]?.name||'Rachel Mifsud';}
function apClone(value){return JSON.parse(JSON.stringify(value));}
function apRestoreObject(target,snapshot){
  Object.keys(target).forEach(key=>delete target[key]);
  Object.assign(target,apClone(snapshot));
}
function apCaptureEffects(r){
  const opportunity=r.opp?OPPS.find(o=>o.id===r.opp):null;
  const ext=opportunity&&EXT[opportunity.id];
  return {
    opps:[...OPPS],
    extKeys:Object.keys(EXT),
    opportunity:opportunity?{ref:opportunity,data:apClone(opportunity)}:null,
    ext:ext?{ref:ext,data:apClone(ext)}:null,
    unit:apUnit(r.unit),
    unitStatus:apUnit(r.unit)?.status,
    // A deal decision creates or discards a Deal and closes related requests, so those are part of its baseline.
    deals:r.type==='deal'&&typeof DEALS!=='undefined'?{list:[...DEALS],items:DEALS.map(d=>({ref:d,data:apClone(d)}))}:null,
    reqs:r.type==='deal'?APPROVALS.filter(q=>q!==r&&(q.opp===r.opp||q.unit===r.unit)).map(q=>({ref:q,data:apClone(q)})):null
  };
}
function apRestoreEffects(r,state){
  if(state.deals){DEALS.splice(0,DEALS.length,...state.deals.list);state.deals.items.forEach(i=>apRestoreObject(i.ref,i.data));}
  if(state.reqs) state.reqs.forEach(i=>apRestoreObject(i.ref,i.data));
  for(const id of Object.keys(EXT)) if(!state.extKeys.includes(id)) delete EXT[id];
  OPPS.splice(0,OPPS.length,...state.opps);
  if(state.opportunity) apRestoreObject(state.opportunity.ref,state.opportunity.data);
  if(state.ext){
    apRestoreObject(state.ext.ref,state.ext.data);
    EXT[state.opportunity.ref.id]=state.ext.ref;
  }else if(state.opportunity) delete EXT[state.opportunity.ref.id];
  if(state.unit) state.unit.status=state.unitStatus;
}
function apCaptureState(r){
  return {
    request:apClone(r),
    effects:apCaptureEffects(r),
    log:apClone(AP_LOG),
    hasBaseline:AP_DECISION_BASELINES.has(r.id),
    baseline:AP_DECISION_BASELINES.get(r.id),
    view:{tab:apTab,type:apType,sel:apSel}
  };
}
function apRestoreState(r,state){
  apRestoreEffects(r,state.effects);
  apRestoreObject(r,state.request);
  AP_LOG.splice(0,AP_LOG.length,...state.log);
  if(state.hasBaseline) AP_DECISION_BASELINES.set(r.id,state.baseline);
  else AP_DECISION_BASELINES.delete(r.id);
}
function apApplyLeadDecision(r){
  if(r.type==='returning'){
    const pick=r.assignedTo||r.orig;
    const o={id:'OPP-'+(1188+OPPS.filter(x=>x.linkedFrom).length),lead:r.buyer,devs:[r.dev],units:[],stage:'New Lead',source:'Website',budget:420,value:420,tags:[],rep:pick,next:{d:'Today',t:'Make first contact'},ago:'Just now',linkedFrom:r.lostOpp};
    OPPS.push(o);
    getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`Returning lead · assigned to ${pick} by ${r.by} · linked to ${r.lostOpp}`});
    r.newOpp=o.id;
  }else if(r.assignedTo!==r.orig){
    const o=OPPS.find(x=>x.id===r.opp);
    if(o){o.rep=r.assignedTo;getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`Taken over from ${r.orig} by ${r.assignedTo} · decided by ${r.by}`});}
  }else{
    r.decided='rejected';
    r.reason=`Kept with ${r.orig}`;
  }
}
function apCommitDecision(r,decision,reason='',note='',edited=false){
  if(!AP_DECISION_BASELINES.has(r.id)) AP_DECISION_BASELINES.set(r.id,apCaptureEffects(r));
  apRestoreEffects(r,AP_DECISION_BASELINES.get(r.id));
  r.decided=decision;
  r.by=apMe();
  r.decidedAt='Just now';
  if(decision==='rejected'){
    r.reason=reason;
    r.reasonNote=note;
    if(r.type==='takeover') r.assignedTo=r.orig;
    if(r.type==='returning'){delete r.assignedTo;delete r.newOpp;}
  }else{
    delete r.reason;
    delete r.reasonNote;
    if(r.type==='takeover'&&r.assignedTo===r.orig) r.assignedTo=r.rep;
  }
  if(decision==='approved'&&AP_LEAD_TYPES.has(r.type)) apApplyLeadDecision(r);
  else if(r.type==='commission'){if(typeof dfApplyCommissionDecision==='function') dfApplyCommissionDecision(r);}
  else if(r.type==='deal'){if(typeof dcApplyDecision==='function') dcApplyDecision(r);}
  else if(!AP_LEAD_TYPES.has(r.type)){
    const u=apUnit(r.unit);
    if(decision==='approved'&&u&&r.type!=='price') u.status=r.type==='hold'?'hold':'reserved';
    apSyncOpp(r);
  }
  const act=edited?`Decision edited · ${r.decided==='approved'?'Approved':'Rejected'}${r.reason?' · '+r.reason:''}`
    :AP_LEAD_TYPES.has(r.type)&&r.decided==='approved'?`Assigned to ${r.assignedTo}`
    :r.decided==='rejected'?'Rejected · '+r.reason:'Approved';
  AP_LOG.unshift({id:r.id,act,by:r.by,t:'Just now'});
}
function apFinishDecision(r,state,message){
  // Stay in the current list so the approver can work through the queue; "View decision" in the toast jumps to it.
  apSel=apTab==='decided'?r.id:null;
  apRender();
  if(typeof sbRefresh==='function') sbRefresh();
  if(typeof pipeRenderAll==='function') pipeRenderAll();
  if(typeof oppCur!=='undefined'&&oppCur&&r.opp===oppCur.id&&document.getElementById('p-opp')?.classList.contains('on')) renderOpp();
  AP_UNDO={id:r.id,state};
  apShowDecisionToast(message,r.id);
}
function apShowDecisionToast(message,id){
  let toast=document.getElementById('briclyToast');
  if(!toast){toast=document.createElement('div');toast.id='briclyToast';document.body.appendChild(toast);}
  toast.className='toast approval-toast show';
  toast.setAttribute('role','group');
  toast.innerHTML=`<button type="button" class="apq-toast-open" onclick="apOpenDecision('${id}')" aria-label="${xesc(message)}. View decision"><span>${xesc(message)}</span><span class="apq-toast-link">View decision →</span></button><button type="button" class="apq-toast-undo" onclick="apUndoDecision(event)">Undo</button>`;
  toast.onmouseenter=()=>clearTimeout(toast._tid);
  toast.onmouseleave=()=>{clearTimeout(toast._tid);toast._tid=setTimeout(()=>toast.classList.remove('show'),2800);};
  clearTimeout(toast._tid);
  toast._tid=setTimeout(()=>toast.classList.remove('show'),3500);
}
function apOpenDecision(id){
  const r=APPROVALS.find(q=>q.id===id);
  if(!r) return;
  qaDrawerClose();
  apTab='decided'; apType='all'; apSel=id;
  go('approvals');
  apRender();
}
function apUndoDecision(event){
  event?.stopPropagation();
  if(!AP_UNDO) return;
  const {id,state}=AP_UNDO, r=APPROVALS.find(q=>q.id===id);
  if(!r) return;
  apRestoreState(r,state);
  AP_UNDO=null;
  apTab=state.view.tab; apType=state.view.type; apSel=state.view.sel;
  go('approvals');
  apRender();
  if(typeof sbRefresh==='function') sbRefresh();
  if(typeof pipeRenderAll==='function') pipeRenderAll();
  if(typeof oppCur!=='undefined'&&oppCur&&r.opp===oppCur.id&&document.getElementById('p-opp')?.classList.contains('on')) renderOpp();
  document.getElementById('briclyToast')?.classList.remove('approval-toast');
  showToast('Decision undone');
}
function apApprove(id){
  const r=APPROVALS.find(q=>q.id===id); if(!r||r.decided||!apCanDecide()) return;
  if(apUnitLine(r)&&(apLine(r).pos>1||apHeldBy(r))){showToast(`${r.id} is waiting in line on ${r.unit}`);return;}
  const state=apCaptureState(r);
  if(AP_LEAD_TYPES.has(r.type)) r.assignedTo=apLeadPick[r.id]||(r.type==='takeover'?r.rep:r.orig);
  const keepWithCurrent=r.type==='takeover'&&r.assignedTo===r.orig;
  apCommitDecision(r,keepWithCurrent?'rejected':'approved',keepWithCurrent?`Kept with ${r.orig}`:'');
  const next=apOpen().find(q=>q.unit===r.unit);
  const message=AP_LEAD_TYPES.has(r.type)
    ?r.type==='returning'?`${r.buyer} assigned to ${r.assignedTo}${r.newOpp?' · '+r.newOpp+' created':''}`:r.decided==='rejected'?`${r.buyer} stays with ${r.orig}`:`${r.buyer} moved to ${r.assignedTo}`
    :r.type==='commission'?`${r.id} approved · commission split agreed`
    :r.type==='deal'?`${r.id} approved · ${r.deal} live · ${r.unit} reserved`
    :`${r.id} approved · ${r.unit} ${r.type==='price'?'price agreed':r.type==='hold'?'on hold':'reserved'}${next?` · ${next.id} stays in line`:''}`;
  apFinishDecision(r,state,message);
}
function apRejectOpen(id){
  const r=APPROVALS.find(q=>q.id===id); if(!r||!apCanDecide()) return;
  qaDrawerOpen(`Reject ${r.id}`,`<div class="od-field"><label>Reason</label><div class="chk-row" id="apRsn">${AP_REASONS.map(l=>`<button type="button" class="fm-opt" onclick="qaPick(this)">${l}</button>`).join('')}</div></div>
    <div class="od-field"><label>Note to ${xesc(r.rep.split(' ')[0])} (optional)</label><textarea id="apRsnNote" rows="3"></textarea></div>
    <div class="apq-ctx-s">${xesc(r.rep.split(' ')[0])} is told the reason. The buyer isn’t notified; ${xesc(r.rep.split(' ')[0])} follows up.</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="apReject('${r.id}')">Reject request</button>`);
}
function apReject(id){
  const r=APPROVALS.find(q=>q.id===id), reason=document.querySelector('#apRsn .on')?.textContent;
  if(!r||!reason){showToast('Choose a reason');return;}
  const state=apCaptureState(r);
  apCommitDecision(r,'rejected',reason,document.getElementById('apRsnNote').value.trim());
  qaDrawerClose();
  apFinishDecision(r,state,`${r.id} rejected · ${r.rep.split(' ')[0]} notified with the reason`);
}
function apEditDecision(id){
  const r=APPROVALS.find(q=>q.id===id);
  if(!r||!r.decided||!apCanDecide()) return;
  const reasonOptions=[...new Set([...AP_REASONS,r.reason].filter(Boolean))];
  qaDrawerOpen(`Edit decision · ${r.id}`,`<div class="od-field"><label for="apEditStatus">Decision</label><select id="apEditStatus" class="apq-edit-select" onchange="apEditStatusChanged()"><option value="approved" ${r.decided==='approved'?'selected':''}>Approve request</option><option value="rejected" ${r.decided==='rejected'?'selected':''}>Reject request</option></select></div>
    <div id="apEditRejectFields" ${r.decided==='rejected'?'':'hidden'}><div class="od-field"><label for="apEditReason">Reason</label><select id="apEditReason" class="apq-edit-select">${reasonOptions.map(option=>`<option ${option===r.reason?'selected':''}>${xesc(option)}</option>`).join('')}</select></div>
    <div class="od-field"><label for="apEditNote">Note to ${xesc(r.rep.split(' ')[0])} (optional)</label><textarea id="apEditNote" rows="3">${xesc(r.reasonNote||'')}</textarea></div></div>
    <div class="apq-ctx-s">Saving updates the request, related opportunity and audit log. The previous state can be restored with Undo.</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="apSaveDecision('${r.id}')">Save decision</button>`);
}
function apEditStatusChanged(){
  const status=document.getElementById('apEditStatus')?.value;
  const fields=document.getElementById('apEditRejectFields');
  if(fields) fields.hidden=status!=='rejected';
}
function apSaveDecision(id){
  const r=APPROVALS.find(q=>q.id===id), decision=document.getElementById('apEditStatus')?.value;
  if(!r||!r.decided||!apCanDecide()||!['approved','rejected'].includes(decision)) return;
  if(decision==='approved'&&apUnitLine(r)&&!apCanApproveNow(r)){showToast(`${r.id} is waiting in line on ${r.unit}`);return;}
  const reason=decision==='rejected'?document.getElementById('apEditReason')?.value:'';
  if(decision==='rejected'&&!reason){showToast('Choose a reason');return;}
  const state=apCaptureState(r), note=decision==='rejected'?document.getElementById('apEditNote')?.value.trim()||'':'';
  apCommitDecision(r,decision,reason,note,true);
  qaDrawerClose();
  apFinishDecision(r,state,`${r.id} decision updated · ${r.decided==='approved'?'approved':'rejected'}`);
}
// Decisions flow back to the opportunity the request came from (Opportunity progression WT01 2d).
function apSyncOpp(r){
  if(!r.opp||typeof OPPS==='undefined') return;
  const o=OPPS.find(q=>q.id===r.opp); if(!o) return;
  const x=getExt(o);
  if(r.decided==='approved'){
    if(r.type==='hold') x.hold={unit:r.unit,state:'held'};
    x.blocker=null; if(tlIdx(o,x)<2) x.tl=2;
    x.comms.unshift(r.type==='hold'
      ?{ch:'sys',tone:'ok',t:'Just now',text:`${r.unit} put on hold until ${String(r.until||'').split(',')[0]} · approved by ${r.by}`}
      :{ch:'sys',t:'Just now',text:`${AP_TYPES[r.type].l} on ${r.unit} approved by ${r.by} · moved to Committed`});
  }else{
    if(x.hold&&x.hold.unit===r.unit) x.hold=null;
    x.blocker=null;
    x.comms.unshift({ch:'sys',tone:r.type==='hold'?'bad':undefined,t:'Just now',text:`${AP_TYPES[r.type].l} on ${r.unit} rejected by ${r.by} · ${r.reason}`});
  }
  if(typeof oppCur!=='undefined'&&oppCur&&oppCur.id===o.id&&document.getElementById('p-opp')?.classList.contains('on')) renderOpp();
}
// Called by the opportunity page when a rep requests a hold.
function apFile(o,unit,type){
  const ex=APPROVALS.find(r=>!r.decided&&r.opp===o.id&&r.unit===unit&&r.type===type); if(ex) return ex;
  const now=new Date(), r={id:'REQ-'+(apSeq++),type,unit,buyer:o.lead,opp:o.id,rep:o.rep,via:'App',filed:`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,age:0,until:'in 5 days',days:5,note:''};
  APPROVALS.push(r); apBadge(); return r;
}
function apAudit(){
  const rows=AP_LOG.length?AP_LOG.map(l=>`<button type="button" class="apq-audit-row" onclick="apAuditPick('${l.id}')"><span>${l.id} · ${xesc(l.act)}</span><span class="kyc-st">${xesc(l.by)} · ${xesc(l.t)}</span></button>`).join(''):'<div class="apq-ctx-s">No decisions today yet. Every decision made in the queue is logged here.</div>';
  qaDrawerOpen('Audit log',`<div class="apq-audit-list">${rows}</div>`,`<button class="btn-ghost" onclick="qaDrawerClose()">Close</button>`);
}
function apAuditPick(id){
  if(!APPROVALS.some(r=>r.id===id)) return;
  qaDrawerClose();
  apTab='decided'; apType='all'; apSel=id;
  go('approvals');
  apRender();
}
document.addEventListener('DOMContentLoaded',apBadge);
if(document.readyState!=='loading') apBadge();

// ---------- Lead ownership requests (Cold Lead Returns flows 1–2) ----------
const apLeadPick={};
function apReps(){return [...new Set(OPPS.map(o=>o.rep).filter(n=>n&&n!=='Unassigned'))];}
function apLeadDetail(r){
  const pick=apLeadPick[r.id]||(r.type==='takeover'?r.rep:r.orig);
  const opp=r.opp?OPPS.find(o=>o.id===r.opp):null;
  const title=r.type==='returning'?`${r.buyer} is back`:`${r.rep} asks to take over ${r.buyer}`;
  const sub=r.type==='returning'?`Was ${r.orig}’s lead · ${r.lost}. Decide who owns the new opportunity. No decision in 2 hours and it goes to ${r.orig}.`:`Owned by ${r.orig} · last activity ${r.lastAct.split('· ').pop()}. Protection has lapsed, so a manager can move it.`;
  const choices=r.type==='returning'?apReps():[r.orig,r.rep];
  return `<div class="dcard apq-d">
    <div class="apq-d-head"><div><div class="apq-d-meta"><span class="apq-tag lead">${AP_TYPES[r.type].l}</span>${r.id} · Filed ${r.filed} via ${xesc(r.via)}</div>
      <h2 class="apq-d-title">${xesc(title)}</h2><div class="apq-d-sub">${r.decided?apDecisionLine(r):xesc(sub)}</div></div>
      ${r.decided?`<div class="apq-d-acts"><button class="btn-ghost" onclick="apEditDecision('${r.id}')" ${apCanDecide()?'':'disabled'}>Edit decision</button></div>`:`<div class="apq-d-acts"><button class="btn-primary" onclick="apApprove('${r.id}')" ${apCanDecide()?'':'disabled'}>${r.type==='takeover'?(pick===r.orig?`Keep with ${xesc(r.orig)}`:`Move to ${xesc(pick)}`):`Assign to ${xesc(pick)}`}</button></div>`}
    </div>
    <div class="apq-sec"><h3>${r.type==='returning'?'What came in':'Request'}</h3><div class="apq-kv">
      <div><div class="k">Buyer</div><div class="v">${opp?`<a onclick="openOpp('${opp.id}')">${xesc(r.buyer)} · ${opp.id}</a>`:xesc(r.buyer)}</div></div>
      <div><div class="k">${r.type==='returning'?'Previous opportunity':'Current owner'}</div><div class="v">${r.type==='returning'?`${r.lostOpp} · ${xesc(r.orig)}`:xesc(r.orig)}</div></div>
      <div><div class="k">Last activity</div><div class="v">${xesc(r.lastAct)}</div></div>
      ${r.type==='returning'?`<div><div class="k">Development</div><div class="v">${xesc(r.dev)}</div></div>`:`<div><div class="k">Requested by</div><div class="v">${xesc(r.rep)}</div></div>`}
    </div>
    ${(r.changes||[]).length?`<div class="apq-kv-note"><div class="k">Changed since ${r.lost.split(' · ')[0].replace('Lost in ','')}</div><div class="v">${r.changes.map(([k,a,b])=>`${k}: ${a} → <b>${b}</b>`).join(' · ')}</div></div>`:''}
    ${r.note?`<div class="apq-kv-note"><div class="k">${r.type==='takeover'?'Reason from '+xesc(r.rep):'Note'}</div><div class="v">${xesc(r.note)}</div></div>`:''}</div>
    ${r.decided?'':`<div class="apq-sec"><h3>${r.type==='returning'?'Who owns the new opportunity':'Owner'}</h3><div class="apq-picks" role="radiogroup">${choices.map(n=>`<button type="button" role="radio" aria-checked="${n===pick}" class="apq-pick ${n===pick?'on':''}" onclick="apLeadPick['${r.id}']='${n}';apRender()">${xesc(n)}${n===(r.type==='takeover'?r.orig:r.orig)?` <span class="apq-ctx-s">${r.type==='takeover'?'current owner':'original rep · suggested'}</span>`:''}${r.type==='takeover'&&n===r.rep?' <span class="apq-ctx-s">requested</span>':''}</button>`).join('')}</div>
      <div class="apq-ctx-s" style="margin-top:8px">${r.type==='returning'?(pick===r.orig?`${xesc(r.orig)} is notified. The new opportunity links to ${r.lostOpp}.`:`${xesc(pick)} is notified and ${xesc(r.orig)} gets a note. The new opportunity still links to ${r.lostOpp}.`):(pick===r.orig?`${xesc(r.rep)} is told the request was declined.`:`${xesc(r.orig)}’s opportunity closes as Taken over and links to ${xesc(r.rep)}’s. ${xesc(r.orig)} is told.`)}</div></div>`}
  </div>`;
}
