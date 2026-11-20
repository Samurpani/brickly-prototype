// Opportunity strip, derived (update 12). Nothing in it is typed: units, next step, next booked and the blocker all come
// from record data (units, holds, offers, appointments, tasks, documents, contact fields).
// Layout: Units · Next step · Next booked · Blocker (only when a rule fires) · primary button, then status rows (Offer, Hold)
// in the Offer-row style, then the stage bar with every step tick visible. window.oppStrip(o) returns the computed fields.
const OSP_STEPS=[
  {key:'qualify',label:'Qualify',stage:'lead'},
  {key:'viewing',label:'Viewing',stage:'interested'},
  {key:'hold',label:'Hold a unit',stage:'interested'},
  {key:'offer',label:'Agree an offer',stage:'interested'},
  {key:'pos',label:'Book POS signing',stage:'committed'},
  {key:'sign',label:'Sign the POS',stage:'contracted'},
];
const OSP_QUIET_DAYS=5;
const ospOpenUnits={};
const ospE=s=>xesc(String(s??''));
const ospJs=s=>String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
function ospFirst(o){return o.lead.split(' ')[0];}
function ospMe(){return (typeof PERSONAS!=='undefined'&&PERSONAS[curPersona]?.name)||'Sam';}
function ospApprover(o,type){
  const p=typeof window.stApPolicy==='function'?window.stApPolicy(o.rep,type):null;
  return String(p&&p.approver||(typeof apApprover==='function'?apApprover():'Rachel Mifsud')).split(' ')[0];
}
const OSP_MON={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
// "Fri 27 Nov", "1 Oct, 18:00", "Aug 14" → Date in the current year, or null.
function ospParseDay(s){
  const t=String(s||''); let m=t.match(/(\d{1,2})\s+([A-Za-z]{3})/), d, mon;
  if(m){d=+m[1];mon=OSP_MON[m[2].toLowerCase()];}else{m=t.match(/([A-Za-z]{3})\s+(\d{1,2})/);if(m){mon=OSP_MON[m[1].toLowerCase()];d=+m[2];}}
  if(mon==null||!d) return null;
  const tm=t.match(/(\d{1,2}):(\d{2})/), dt=new Date(cvToday().getFullYear(),mon,d,tm?+tm[1]:18,tm?+tm[2]:0);
  return dt;
}
function ospHoursTo(dt){return dt?(dt-new Date())/36e5:null;}
function ospShortDay(dt){return dt?dt.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):'';}

// ---------- units ----------
function ospHoldReq(o,u,decided){return typeof APPROVALS==='undefined'?null:APPROVALS.find(r=>r.opp===o.id&&r.unit===u&&r.type==='hold'&&(decided?r.decided==='approved'&&!r.released:!r.decided))||null;}
function ospHoldUntil(o,x,u){
  const r=ospHoldReq(o,u,true);
  if(r&&r.until) return ospParseDay(r.until);
  if(x.date&&/hold/i.test(x.date.label)) return ospParseDay(x.date.value);
  return null;
}
function ospUnitInfo(o,x,u,i){
  const un=typeof UN==='function'?UN(u):null, st=typeof uhOppUnitState==='function'?uhOppUnitState(o,x,u,i):null, of=typeof ofGet==='function'?ofGet(o):null;
  const mine=st&&(st.s==='held'||st.s==='requested');
  const resMine=un&&un.status==='reserved'&&(x.offer?.depositPaid||jIdx(x.jstage)>=jIdx('kyc'))&&(x.hold?.unit===u||i===0);
  let chip;
  if(resMine) chip={l:`Reserved · deposit ${fmtEur(x.offer?.deposit||Math.round((o.value||0)*100))}`,t:'ok',k:'reserved'};
  else if(un&&un.status==='hold'&&!(st&&st.s==='held')&&(typeof uhHolder!=='function'||(uhHolder(un)?.opp||'')!==o.id)){
    const r=ospHoldReq(o,u,false), place=r&&typeof uhPlace==='function'?uhPlace(r):0;
    chip={l:`Held for another buyer${place?` · you're ${typeof uhOrd==='function'?uhOrd(place):place+'th'}`:''}`,t:'warn',k:'elsewhere'};
  }
  else if(un&&['reserved','sold'].includes(un.status)&&!mine) chip={l:`Gone · ${un.status} to another buyer`,t:'bad',k:'gone'};
  else if(st&&st.s==='held'){const until=ospHoldUntil(o,x,u),h=ospHoursTo(until);chip={l:`Held${until?` · until ${ospShortDay(until)}`:''}`,t:h!=null&&h>=0&&h<48?'warn':'info',k:'held',until};}
  else if(st&&st.s==='requested') chip={l:'Hold requested',t:'info',k:'requested'};
  else chip={l:'Shortlisted',t:'neu',k:'shortlisted'};
  return {id:u,type:un?(un.beds?`${un.beds}-bed`:'Studio'):'',price:un?un.price:null,dev:un?un.dev:'',chip,offer:of&&of.unit===u&&of.amt?of.amt:null};
}

// ---------- appointments and tasks ----------
function ospAppts(o,x){
  const list=typeof miAppts==='function'?miAppts(o,x):(x.appts||[]), now=new Date(), out=[];
  list.forEach(a=>{
    if(['cancelled','noshow'].includes(a.status)) return;
    const ev=a.evId&&typeof cvExtra!=='undefined'?cvExtra.find(e=>e.id===a.evId):null;
    const at=ev?new Date(`${ev.dateISO}T${ev.start||'09:00'}`):ospParseDay(`${a.date||''} ${a.start||''}`);
    const past=!!ev&&at<now;
    const need=['pending','ready','proc'].includes(a.status)||(a.status==='booked'&&past);
    out.push({src:'appt',id:a.id,label:a.label||'Appointment',kind:a.kind,at,status:a.status,need,held:a.status==='held',
      when:a.date?`${a.date}${a.start?', '+a.start:''}`:(a.when||'').split(' · ')[0],with:a.with||o.lead,evId:a.evId});
  });
  const ids=new Set(list.map(a=>a.evId).filter(Boolean));
  if(typeof cvBuildEvents==='function') cvBuildEvents().forEach(e=>{
    if(e.oppId!==o.id||e.cancelled||ids.has(e.id)||e.type==='busy') return;
    const at=new Date(`${e.dateISO}T${e.start||'09:00'}`); if(at<now) return;
    out.push({src:'event',id:e.id,label:String(e.title||'Appointment').split(' · ')[0],kind:e.type,at,status:'booked',need:false,held:false,when:`${cvDayLabel(e.dateISO)}, ${e.start}`,with:o.lead});
  });
  return out;
}
function ospTasks(o){
  if(typeof oppTasksFor!=='function') return [];
  return oppTasksFor(o).filter(t=>t.status==='open'&&t.due).map(t=>({src:'task',id:t.id,label:t.title,at:new Date(`${t.due}T${t.time||'09:00'}`),overdue:!!(typeof tqOver==='function'&&tqOver(t)),
    when:typeof tqDue==='function'?tqDue(t):t.due,with:(typeof TQ_USERS!=='undefined'&&TQ_USERS[t.owner]?.name)||''}));
}
const isViewing=a=>/viewing|appointment|video|call|present/i.test(`${a.kind} ${a.label}`)&&!/sign|pos|deed/i.test(`${a.kind} ${a.label}`);

// ---------- the five steps ----------
function ospQualify(o,x){
  const c=typeof oppDetailsContact==='function'?oppDetailsContact(o)||{}:{}, b=typeof oppBudget==='function'?oppBudget(o):{};
  const budget=b.min!=null||b.max!=null||!!o.budget, fin=c.finance||x.buyer?.finance||'';
  const finOk=!!fin&&!/not discussed|not known/i.test(fin), tl=c.timeline||x.buyer?.timeline;
  const miss=[!budget&&'budget',!finOk&&'finance'].filter(Boolean), soft=[!tl&&'timeline'].filter(Boolean);
  return {done:!miss.length,miss,soft,fin,finOk};
}
function ospPosBooked(o,x){return typeof otPosBooked==='function'?otPosBooked(x):!!(x.date&&/POS/.test(x.date.label));}
function ospKycMissing(o,x){return typeof otKycMissing==='function'?otKycMissing(o,x):[];}
function ospState(o){
  const x=getExt(o), of=typeof ofGet==='function'?ofGet(o):null, ofSt=of&&typeof ofState==='function'?ofState(of):null;
  const units=o.units.map((u,i)=>ospUnitInfo(o,x,u,i));
  const appts=ospAppts(o,x), views=appts.filter(isViewing), deal=typeof dealFor==='function'&&dealFor(o.id);
  const q=ospQualify(o,x);
  const viewHeld=views.some(a=>a.held)||(!views.length&&jIdx(x.jstage)>=jIdx('viewing_held'));
  const viewNeed=views.find(a=>a.need), viewNext=views.filter(a=>a.status==='booked'&&!a.need).sort((a,b)=>(a.at||0)-(b.at||0))[0];
  const held=units.filter(u=>u.chip.k==='held'), req=units.find(u=>u.chip.k==='requested');
  const holdDone=held.length>0||units.some(u=>u.chip.k==='reserved')||jIdx(x.jstage)>=jIdx('reservation');
  const offerOk=typeof ofAccepted==='function'?ofAccepted(o):/accept/i.test(x.offer?.status||'');
  const posDone=ospPosBooked(o,x)||!!deal, kyc=ospKycMissing(o,x), dep=!!x.offer?.depositPaid||jIdx(x.jstage)>=jIdx('kyc');
  const skips=x.skips||{};
  const done={qualify:q.done,viewing:viewHeld,hold:holdDone,offer:offerOk,pos:posDone,sign:!!deal};
  return {x,of,ofSt,units,appts,q,viewNeed,viewNext,views,held,req,offerOk,posDone,kyc,dep,skips,done,deal};
}
function ospStepFor(o,S,key){
  const x=S.x, first=ospFirst(o), mgr=ospApprover(o,'hold');
  if(key==='qualify'){
    const r=S.q.miss.length?`${S.q.miss.join(' and ')} missing`:'details missing';
    return {reason:r+(S.q.soft.length?`, ${S.q.soft.join(' and ')} not known`:''),btn:'Qualify buyer',fn:`ospQualifyOpen('${o.id}')`};
  }
  if(key==='viewing'){
    if(S.viewNeed) return {reason:'outcome needed',btn:'Log outcome',fn:ospApptFn(o,S.viewNeed,true),ref:S.viewNeed.id,overdue:true};
    if(S.viewNext) return {reason:S.viewNext.when,btn:'Open viewing',fn:ospApptFn(o,S.viewNext),ref:S.viewNext.id};
    return {reason:'not booked',btn:'Book viewing',fn:'qaViewing()'};
  }
  if(key==='hold'){
    if(S.req){const r=ospHoldReq(o,S.req.id,false);return {reason:`waiting for ${mgr}`,btn:'Chase approval',fn:'otHoldOpen()',overdue:!!(r&&r.age>120),key:'hold-wait'};}
    if(!S.units.length) return {reason:'no units yet',btn:'Add units',fn:`oppQuickEditOpen('${o.id}','units')`};
    const pick=ospEngaged(o,S);
    if(!pick) return {reason:'no unit free to hold',btn:'Find units',fn:`typeof inSortFor==='function'?inSortFor('${o.id}'):oppQuickEditOpen('${o.id}','units')`};
    const n=S.units.filter(u=>u.chip.k==='shortlisted').length;
    return {reason:`${n} shortlisted`,btn:'Request hold',fn:`oppHoldRequest('${ospJs(pick)}')`};
  }
  if(key==='offer'){
    if(S.ofSt==='approval') return {reason:`waiting for ${ospApprover(o,'price')}`,btn:'Open approval',fn:`apSel='${S.of.reqId}';apTab='open';apType='all';go('approvals');apRender()`,key:'offer-wait'};
    const h=S.held[0];
    if(S.ofSt==='expired') return {reason:'offer expired',btn:'Log offer',fn:'oppOfferOpen()',overdue:true};
    if(S.ofSt==='countered') return {reason:`${fmtEur(S.of.amt)} countered`,btn:'Log offer',fn:'oppOfferOpen()'};
    return {reason:h&&h.chip.until?`hold ends ${h.chip.until.toLocaleDateString('en-GB',{weekday:'short'})}`:S.of&&S.of.amt&&S.ofSt!=='rejected'?`${fmtEur(S.of.amt)} logged`:'no offer yet',btn:'Log offer',fn:'oppOfferOpen()'};
  }
  if(key==='pos'){
    if(!S.dep) return {reason:'reservation deposit not received',btn:'Collect deposit',fn:'otDepositOpen()'};
    if(S.kyc.length) return {reason:'KYC docs missing',btn:'Request documents',fn:'otKycOpen()',key:'kyc'};
    return {reason:'ready to book',btn:'Book POS signing',fn:'oppPosOpen()'};
  }
  return {reason:x.date&&/POS signing/i.test(x.date.label)?x.date.value:'booked',btn:'Sign POS',fn:'ojAdvance()'};
}
function ospEngaged(o,S){
  const free=S.units.filter(u=>u.chip.k==='shortlisted');
  if(!free.length) return null;
  return (free.find(u=>S.of&&S.of.unit===u.id)||free[0]).id;
}
function ospApptFn(o,a,outcome){
  if(a.src==='appt'&&typeof miOpen==='function') return `miOpen('${o.id}','${ospJs(a.id)}')`;
  if(outcome) return "otApptOpen('outcome')";
  return `ospEventOpen('${o.id}','${ospJs(a.id)}')`;
}

// ---------- blocker rules ----------
function ospBlockers(o,S,step){
  const out=[], x=S.x, first=ospFirst(o);
  S.held.forEach(u=>{const h=ospHoursTo(u.chip.until);if(h!=null&&h>=0&&h<48)out.push({key:'hold-ends',cause:`Hold on ${u.id} ends ${ospShortDay(u.chip.until)}`,owner:'Us',fix:'Extend hold',fn:`ospExtendHold('${ospJs(u.id)}')`,shownIn:'hold',unit:u.id});});
  if(S.ofSt==='approval') out.push({key:'offer-wait',cause:`Offer waiting for ${ospApprover(o,'price')} in Approvals`,owner:'Us',fix:'Open approval',fn:`apSel='${S.of.reqId}';apTab='open';apType='all';go('approvals');apRender()`,shownIn:'offer'});
  if(S.offerOk&&!S.posDone&&S.kyc.length) out.push({key:'kyc',cause:`${S.kyc.map(d=>d.label).join(', ')} missing before POS`,owner:'Buyer',fix:'Request documents',fn:'otKycOpen()'});
  if(S.offerOk&&!S.deal&&!S.q.finOk) out.push({key:'finance',cause:'Finance not confirmed',owner:'Buyer',fix:`Message ${first}`,fn:'qaMessage()'});
  const quiet=typeof llQuietDays==='function'?llQuietDays(o):0;
  if(quiet>=OSP_QUIET_DAYS) out.push({key:'quiet',cause:`No reply from ${first} in ${quiet} days`,owner:'Us',fix:'Open composer',fn:`ospCompose()`});
  // No duplicates: a blocker already told by the Next step or a status row isn't drawn in the Blocker slot.
  // It stays in the list for the API, with shownIn saying where it's shown.
  out.forEach(b=>{if(b.key===step.key) b.shownIn='next';});
  return out;
}
function ospExtendHold(unit){
  const o=oppCur, x=getExt(o), mgr=ospApprover(o,'hold');
  qaDrawerOpen(`Extend the hold on ${unit}`,`<div class="ll-mu" style="margin-bottom:10px">${ospE(mgr)} decides. ${ospE(unit)} stays held for ${ospE(ospFirst(o))} while the request waits.</div>
    <div class="od-field"><label for="ospExtDays">Extend by</label><select id="ospExtDays"><option>3 days</option><option selected>7 days</option><option>14 days</option></select></div>
    <div class="od-field"><label for="ospExtWhy">Reason <span class="ll-mu">(optional)</span></label><textarea id="ospExtWhy" rows="2" placeholder="e.g. Bank letter expected next week"></textarea></div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="ospExtendSend('${ospJs(unit)}')">Send to ${ospE(mgr)}</button>`);
}
function ospExtendSend(unit){
  const o=oppCur, x=getExt(o), mgr=ospApprover(o,'hold'), days=document.getElementById('ospExtDays').value, why=(document.getElementById('ospExtWhy').value||'').trim();
  x.comms.unshift({ch:'sys',t:'Just now',text:`${ospMe()} asked ${mgr} to extend the hold on ${unit} by ${days}${why?`. Reason: ${why}`:''}.`});
  qaDrawerClose(); renderOpp(); showToast(`Extension request sent to ${mgr}`);
}

// ---------- public: what the strip shows ----------
function oppStrip(o){
  if(typeof o==='string') o=OPPS.find(r=>r.id===o);
  if(!o) return null;
  const S=ospState(o);
  const steps=OSP_STEPS.map(s=>({...s,done:!!S.done[s.key],skipped:!S.done[s.key]&&!!S.skips[s.key]}));
  const cur=steps.find(s=>!s.done&&!s.skipped)||steps[steps.length-1];
  const d=ospStepFor(o,S,cur.key);
  const nextStep={key:cur.key,label:cur.label,reason:d.reason,text:`${cur.label} · ${d.reason}`,action:{label:d.btn,fn:d.fn},overdue:!!d.overdue,ref:d.ref||null,ruleKey:d.key||null};
  if(cur.done) Object.assign(nextStep,{reason:'done',text:`${cur.label} · done`});
  const items=[...S.appts.filter(a=>a.status==='booked'||a.need),...ospTasks(o)].filter(a=>a.id!==nextStep.ref).sort((a,b)=>(a.need?0:1)-(b.need?0:1)||(a.at||0)-(b.at||0));
  const it=items[0];
  const nextBooked=!it?{state:'none',text:'Nothing booked',action:{label:'Book',fn:'qaViewing()'}}
    :it.need?{state:'outcome',text:`${it.label} · outcome needed`,action:{label:'Log outcome',fn:ospApptFn(o,it,true)},item:it}
    :it.src==='task'?{state:it.overdue?'overdue':'task',text:`Task · ${it.label}${it.overdue?' · overdue':` · ${it.when}`}`,action:{label:'Open task',fn:`ospTaskOpen('${ospJs(it.id)}')`},item:it}
    :{state:'booked',text:`${it.label} · ${it.when}${it.with?` · with ${ospFirst({lead:it.with})}`:''}`,action:{label:'Open',fn:ospApptFn(o,it)},item:it};
  const blockers=ospBlockers(o,S,{key:nextStep.ruleKey});
  return {units:S.units,nextStep,nextBooked,blocker:blockers[0]||null,blockers,shownBlockers:blockers.filter(b=>!b.shownIn),steps,offer:S.of?{state:S.ofSt,amt:S.of.amt,unit:S.of.unit}:null};
}
window.oppStrip=oppStrip;
window.oppNextAction=function(o){const s=oppStrip(o);return s?s.nextStep.text:'';};

// ---------- actions ----------
function ospQualifyOpen(id){
  if(oppCur?.id!==id) openOpp(id);
  oppSetTab('details');
  const S=ospState(oppCur);
  setTimeout(()=>{
    const f=[S.q.miss.includes('budget')&&'#opp-dt-budgetMin',S.q.miss.includes('finance')&&'[data-opp-picker="finance"]',S.q.soft.includes('timeline')&&'[data-opp-picker="timeline"]'].filter(Boolean)
      .map(k=>document.querySelector('#opp-root '+k)?.closest('.od-field')).filter(Boolean);
    f.forEach(el=>el.classList.add('osp-missing'));
    f[0]?.scrollIntoView({block:'center'}); f[0]?.querySelector('input,summary,button')?.focus({preventScroll:true});
  },40);
}
function ospCompose(){const t=document.getElementById('opp-comp');t?.scrollIntoView({block:'center'});t?.focus();}
function ospTaskOpen(id){const t=typeof tqFind==='function'&&(tqInit(),tqFind(id));if(t)tqAddOpen({edit:t});}
function ospEventOpen(oppId,evId){
  const o=OPPS.find(r=>r.id===oppId), e=cvBuildEvents().find(v=>String(v.id)===String(evId)); if(!o||!e) return;
  qaDrawerOpen(String(e.title||'Appointment'),`<div class="opp-event-preview"><div class="opp-event-name">${ospE(e.title)}</div><div class="opp-event-when">${ospE(cvDayLabel(e.dateISO))}, ${ospE(e.start)}${e.end?' to '+ospE(e.end):''}</div>
    <div class="opp-event-meta"><span>With</span><b>${ospE(e.with||o.lead)}</b></div>${e.location?`<div class="opp-event-meta"><span>Location</span><b>${ospE(e.location)}</b></div>`:''}</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Close</button><button class="btn-primary" onclick="qaDrawerClose();go('calendar')">Open calendar</button>`);
}
function ospSkipOpen(){
  const o=oppCur, s=oppStrip(o).nextStep;
  qaDrawerOpen(`Skip ${s.label}`,`<div class="ll-mu" style="margin-bottom:10px">${ospE(s.label)} shows as skipped on the stage bar and the next step moves on. It’s logged in Activity.</div>
    <div class="od-field"><label for="ospSkipWhy">Reason <span class="ll-mu">(optional)</span></label><textarea id="ospSkipWhy" rows="2" placeholder="e.g. Bought off plan without a viewing"></textarea></div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="ospSkip('${s.key}')">Skip step</button>`);
}
function ospSkip(key){
  const o=oppCur, x=getExt(o), step=OSP_STEPS.find(s=>s.key===key), why=(document.getElementById('ospSkipWhy')?.value||'').trim();
  x.skips=x.skips||{}; x.skips[key]={by:ospMe(),t:'Just now',reason:why};
  x.comms.unshift({ch:'sys',t:'Just now',text:`${ospMe()} skipped ${step.label}${why?`. Reason: ${why}`:''}.`});
  qaDrawerClose(); renderOpp(); if(typeof pipeRenderAll==='function') pipeRenderAll();
  showToast(`${step.label} skipped`);
}
function ospUnitsMore(id){ospOpenUnits[id]=!ospOpenUnits[id];renderOpp();}

// ---------- remove a unit from the opportunity (timeline chips, Linked units, list and board cells) ----------
function ospRemoveState(o,unit){
  const x=getExt(o), i=o.units.indexOf(unit), info=ospUnitInfo(o,x,unit,i), of=typeof ofGet==='function'?ofGet(o):null;
  return {x,info,k:info.chip.k,offer:of&&of.unit===unit&&of.amt?of.amt:null,req:info.chip.k==='requested'?ospHoldReq(o,unit,false):null};
}
function ospRerender(o){
  if(typeof oppCur!=='undefined'&&oppCur?.id===o.id&&typeof renderOpp==='function'&&document.getElementById('opp-root')) renderOpp();
  if(typeof pipeRenderAll==='function') pipeRenderAll();
}
function oppUnitRemove(oppId,unit){
  const o=OPPS.find(r=>r.id===oppId); if(!o||!o.units.includes(unit)) return;
  const R=ospRemoveState(o,unit), first=ospFirst(o);
  if(R.k==='reserved'){showToast(`${unit} is reserved for ${first}. It can’t be removed while the reservation stands.`);return;}
  if(R.k==='held'){
    const mgr=typeof uhMgr==='function'&&uhMgr();
    qaDrawerOpen(`Remove ${unit}`,`<div class="ll-mu">${ospE(unit)} is held for ${ospE(first)}. Release the hold first, then remove the unit.${mgr?'':` Only ${ospE(ospApprover(o,'hold'))} or another manager can release it.`}</div>`,
      `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button>${mgr?`<button class="btn-primary" onclick="qaDrawerClose();uhReleaseOpen('${ospJs(unit)}')">Release hold</button>`:''}`);
    return;
  }
  if(R.k==='requested'||R.offer){
    const notes=[R.k==='requested'?`The hold request${R.req?` ${R.req.id}`:''} is withdrawn from Approvals.`:'',R.offer?`The ${fmtEur(R.offer)} offer stays in the offer history.`:''].filter(Boolean);
    qaDrawerOpen(`Remove ${unit} from ${first}’s opportunity?`,`<div class="ll-mu">${notes.map(ospE).join(' ')} It’s logged in Activity.</div>`,
      `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-danger" onclick="qaDrawerClose();ospUnitRemoveGo('${o.id}','${ospJs(unit)}')">Remove unit</button>`);
    return;
  }
  ospUnitRemoveGo(o.id,unit);
}
function ospUnitRemoveGo(oppId,unit){
  const o=OPPS.find(r=>r.id===oppId); if(!o) return;
  const R=ospRemoveState(o,unit), x=R.x;
  if(R.k==='requested'&&typeof APPROVALS!=='undefined'){
    for(let i=APPROVALS.length-1;i>=0;i--){const r=APPROVALS[i];if(!r.decided&&r.unit===unit&&r.type==='hold'&&r.opp===o.id)APPROVALS.splice(i,1);}
    if(x.blocker&&x.blocker.includes(unit)) x.blocker='';
    if(typeof UN==='function'&&UN(unit)&&typeof uhLog==='function') uhLog(UN(unit),{t:'Hold request withdrawn',who:`${ospMe()} · ${o.lead}`});
  }
  if(x.hold&&x.hold.unit===unit) x.hold=null;
  o.units=o.units.filter(u=>u!==unit);
  x.comms.unshift({ch:'sys',t:'Just now',text:`${unit} removed from the opportunity by ${ospMe()}${R.k==='requested'?' · hold request withdrawn':''}.`});
  delete ospOpenUnits[o.id];
  ospRerender(o);
  showToast(`${unit} removed from ${o.lead}’s opportunity`);
}
window.oppUnitRemove=oppUnitRemove;
window.ospUnitRemoveGo=ospUnitRemoveGo;
// Timeline chips: show as many as fit on one line (up to 3); the rest go behind +N.
function ospFitUnits(){
  const row=document.querySelector('#osp-units .osp-units'); if(!row) return;
  const w=row.querySelector('.osp-more-w'), pop=w&&w.querySelector('.osp-pop'), more=w&&w.querySelector('.osp-more'); if(!w) return;
  const sync=()=>{const n=pop.children.length;w.hidden=!n;more.textContent=`+${n}`;more.setAttribute('aria-label',`${n} more unit${n>1?'s':''}`);};
  sync();
  let chips=[...row.querySelectorAll(':scope > .osp-unit')];
  while(chips.length>1&&row.scrollWidth>row.clientWidth+1){pop.prepend(chips.pop());sync();}
}
addEventListener('resize',()=>{clearTimeout(ospFitUnits.t);ospFitUnits.t=setTimeout(()=>{if(document.getElementById('osp-units'))renderOpp();},150);});

// ---------- rendering ----------
// One-line unit chip: id and a short status. The full status, type, price and offer are in the tooltip.
function ospUnitShort(c){
  if(c.k==='held') return c.until?`Held · ${c.until.toLocaleDateString('en-GB',{weekday:'short'})}`:'Held';
  return {reserved:'Reserved',elsewhere:'Held elsewhere',gone:`Gone`}[c.k]||c.l;
}
function ospUnitCard(u,oppId){
  const tip=[u.id,u.type,u.price?fmtEur(u.price):'',u.offer?`Offer ${fmtEur(u.offer)}`:'',u.chip.l].filter(Boolean).join(' · ');
  return `<span class="osp-unit" title="${ospE(tip)}"><button type="button" class="osp-unit-o" onclick="openUnPeek('${ospJs(u.id)}')" aria-label="Open ${ospE(tip)}">
    <b>${ospE(u.id)}</b><span class="osp-chip t-${u.chip.t}">${ospE(ospUnitShort(u.chip))}</span></button>${u.chip.k==='reserved'?'':`<button type="button" class="osp-unit-x" onclick="event.stopPropagation();oppUnitRemove('${ospJs(oppId)}','${ospJs(u.id)}')" aria-label="Remove ${ospE(u.id)} from the opportunity" title="Remove from the opportunity">×</button>`}</span>`;
}
function ospRowsHtml(o,S,P){
  const fix=(where,unit)=>(P.blockers.find(b=>b.shownIn===where&&(!unit||b.unit===unit)));
  const rows=[], first=ospFirst(o);
  const of=S.of;
  if(of){
    const st=S.ofSt, ev=of.events&&of.events[0], lab=OF_STATE[st]||['',''];
    rows.push({k:'Offer',pill:lab[0],tone:lab[1],text:ev?ev.text:`${fmtEur(of.amt)} on ${of.unit||'the unit'}.`,t:ev?ev.t:'',fix:fix('offer')});
  }
  S.units.forEach(u=>{
    if(u.chip.k==='requested'){const r=ospHoldReq(o,u.id,false);rows.push({k:'Hold',pill:'Requested',tone:'info',text:`Hold on ${u.id} is waiting for ${ospApprover(o,'hold')}.`,t:r?`Filed ${r.filed}`:''});}
    if(u.chip.k==='held'){const h=ospHoursTo(u.chip.until),r=ospHoldReq(o,u.id,true);rows.push({k:'Hold',pill:h!=null&&h>=0&&h<48?'Expiring':'Held',tone:h!=null&&h>=0&&h<48?'warn':'ok',fix:fix('hold',u.id),text:`${u.id} is held for ${first}${u.chip.until?` until ${ospShortDay(u.chip.until)}`:''}.`,t:r?.decidedAt||''});}
  });
  return rows.length?`<div class="osp-rows">${rows.map(r=>`<div class="of-tl-row osp-row" data-row="${r.k}"><span class="osp-row-k">${r.k}</span><span class="of-pill t-${r.tone}">${ospE(r.pill)}</span><span class="of-tl-tx">${ospE(r.text)}</span>${r.fix?`<button type="button" class="osp-link osp-row-fix" onclick="${r.fix.fn}">${ospE(r.fix.fix)}</button>`:''}${r.t?`<span class="of-tl-t">${ospE(r.t)}</span>`:''}</div>`).join('')}</div>`:'';
}
function ospHeroHtml(o,x,ji){
  const S=ospState(o), P=oppStrip(o), ns=P.nextStep, nb=P.nextBooked, ti=tlIdx(o,x), first=ospFirst(o);
  const assist=typeof oppAssist==='function'?oppAssist(o,x,ti):[];
  const units=S.units, open=ospOpenUnits[o.id], shown=units.slice(0,3), rest=units.slice(3);
  const card=u=>ospUnitCard(u,o.id);
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(ospFitUnits);
  const unitsHtml=units.length?`<div class="osp-units">${shown.map(card).join('')}<div class="osp-more-w${open?' is-open':''}" ${rest.length?'':'hidden'}><button type="button" class="osp-more" onclick="ospUnitsMore('${o.id}')" aria-expanded="${!!open}" aria-label="${rest.length} more unit${rest.length>1?'s':''}">+${rest.length}</button><div class="osp-pop" role="group" aria-label="More units">${rest.map(card).join('')}</div></div></div>`
    :`<div class="osp-empty">No units yet</div><button type="button" class="osp-link" onclick="oppQuickEditOpen('${o.id}','units')">Add units</button>`;
  const bl=P.shownBlockers;
  const cells=[
    `<div class="now-cell osp-cell" id="osp-units"><div class="k">Units</div>${unitsHtml}</div>`,
    `<div class="now-cell osp-cell" id="osp-next"><div class="k">Next step</div><button type="button" class="osp-val osp-step ${ns.overdue?'bad':''}" data-step="${ns.key}" onclick="${ns.action.fn}">${ospE(ns.text)}</button>${ns.key!=='sign'?`<button type="button" class="osp-skip" onclick="ospSkipOpen()">Skip</button>`:''}</div>`,
    `<div class="now-cell osp-cell" id="osp-booked"><div class="k">Next booked</div><button type="button" class="osp-val osp-nb is-${nb.state}" onclick="${nb.action.fn}">${ospE(nb.text)}</button>${nb.state==='none'?`<button type="button" class="osp-link" onclick="qaViewing()">Book</button>`:''}</div>`,
    bl.length?`<div class="now-cell osp-cell" id="oj-blocker"><div class="k">Blocker</div>${bl.slice(0,2).map(b=>`<div class="osp-bl"><span class="osp-bl-c">${ospE(b.cause)}</span><span class="osp-mu">${b.owner}</span><button type="button" class="osp-link" onclick="${b.fn}">${ospE(b.fix)}</button></div>`).join('')}</div>`:'',
  ].filter(Boolean);
  const stages=TL4.map((s,i)=>{
    const ticks=P.steps.filter(t=>t.stage===s.key);
    return `<div class="oj-st ${i<ti?'done':i===ti?'cur':'todo'}">
      <span class="oj-dot"></span><span class="oj-lb">${s.label}</span>
      <ul class="osp-ticks">${ticks.map(t=>`<li class="${t.done?'is-done':t.skipped?'is-skip':'is-open'} ${t.key===ns.key?'is-cur':''}" data-step="${t.key}"><span class="osp-tk" aria-hidden="true">${t.done?'✓':t.skipped?'–':'○'}</span>${ospE(t.label)}<span class="sr-only">${t.done?' (done)':t.skipped?' (skipped)':' (open)'}</span></li>`).join('')||'<li class="osp-mu">Starts on an enquiry</li>'}</ul>
      ${i===ti&&assist.length?`<button type="button" class="oj-assist" onclick="event.stopPropagation();ojAssistToggle(event)" aria-haspopup="menu">Assist · ${assist.length} <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button>
        <div class="oj-assist-menu" id="oj-assist-menu" role="menu" hidden>${assist.map(a=>`<button type="button" role="menuitem" onclick="ojAssistToggle();${a.fn}">${a.t}</button>`).join('')}</div>`:''}
    </div>`;}).join('');
  return `<div class="dcard oj-hero v2 osp-hero" id="oj-hero">
    <div class="oj-head"><h3 class="oj-title">Timeline</h3><span class="oj-note">Everything here comes from the record. Steps tick as things happen.</span></div>
    <div class="now-strip osp-strip" style="grid-template-columns:minmax(0,2fr) minmax(0,1.2fr) minmax(0,1fr)${bl.length?' minmax(0,1.1fr)':''} auto">${cells.join('')}
      <button class="btn-primary osp-cta" data-step="${ns.key}" onclick="${ns.action.fn}">${ospE(ns.action.label)}</button></div>
    ${ospRowsHtml(o,S,P)}
    <div class="oj-bar"><div class="oj-stages">${stages}
      <div class="oj-st oj-deal" title="Continues on the deal"><span class="oj-dot"></span><span class="oj-lb">Deal →</span><span class="oj-ds">Final deed, handover, KYC</span></div>
    </div></div>
  </div>`;
}
window.heroHtml=ospHeroHtml;
// The primary button and every other "next" entry point run the same derived action.
window.ojCta=function(o,x){const a=oppStrip(o).nextStep.action;return [a.label,a.fn];};

// ---------- list and board ----------
const OSP_FILTERS=[['none','Nothing booked'],['overdue','Next step overdue'],['outcome','Outcome needed'],['blocker','Has blocker']];
function ospMatches(o,k){
  if(EXIT_STAGES.includes(o.stage)) return false;
  const s=oppStrip(o);
  return k==='none'?s.nextBooked.state==='none':k==='overdue'?s.nextStep.overdue||s.nextBooked.state==='overdue':k==='outcome'?s.nextStep.reason==='outcome needed'||s.nextBooked.state==='outcome':!!s.blocker;
}
function ospCellsHtml(o){
  if(EXIT_STAGES.includes(o.stage)||(typeof dealFor==='function'&&dealFor(o.id))) return '<td class="osp-mu">—</td><td class="osp-mu">—</td>';
  const s=oppStrip(o);
  return `<td><span class="osp-tcell ${s.nextStep.overdue?'bad':''}">${ospE(s.nextStep.text)}</span></td><td><span class="osp-tcell osp-nb is-${s.nextBooked.state}">${ospE(s.nextBooked.text)}</span></td>`;
}
function ospCardRows(o){
  if(EXIT_STAGES.includes(o.stage)||(typeof dealFor==='function'&&dealFor(o.id))) return '';
  const s=oppStrip(o);
  return `<div class="card-row opp-next-step" title="Next step: ${ospE(s.nextStep.text)}"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><title>Next step</title><path d="M2 7h8M7 3.5L10.5 7 7 10.5"/></svg><span class="${s.nextStep.overdue?'osp-bad':''}">${ospE(s.nextStep.text)}</span></div>
    <div class="card-row opp-next-booked" title="Next booked: ${ospE(s.nextBooked.text)}">${typeof PIPE_CAL_ICON!=='undefined'?PIPE_CAL_ICON:''}<span class="osp-nb is-${s.nextBooked.state}">${ospE(s.nextBooked.text)}</span></div>`;
}

// ---------- typed next actions become tasks (nothing is lost) ----------
function ospUserKey(rep){
  const map={sam:'sam','karl zammit':'karl','rachel mifsud':'manager'}, k=String(rep||'').toLowerCase();
  if(map[k]) return map[k];
  const key='rep-'+k.replace(/[^a-z]+/g,'-');
  if(typeof TQ_USERS!=='undefined'&&!TQ_USERS[key]) TQ_USERS[key]={name:rep,ini:(typeof initials==='function'?initials(rep):rep.slice(0,2)).toUpperCase()};
  return key;
}
function ospConvertTyped(){
  OPPS.forEach(o=>{
    if(EXIT_STAGES.includes(o.stage)||o.rep==='Unassigned'||(typeof dealFor==='function'&&dealFor(o.id))) return;
    const label=(o.next&&o.next.t)||'';
    if(!label||label==='—'||TQ.some(t=>t.rec===o.id&&t.title.toLowerCase()===label.toLowerCase())) return;
    const d=String(o.next.d||''), due=/today/i.test(d)?cvISO(cvToday()):/tomorrow/i.test(d)?cvISO(cvAddDays(cvToday(),1)):null;
    TQ.push({id:'nx-'+o.id,title:label,desc:due||!d?'':`Was due ${d}. Moved from the old next action field.`,rec:o.id,due,time:null,owner:ospUserKey(o.rep),agent:false,source:'next_action',status:'open',createdBy:ospUserKey(o.rep),remind:''});
  });
}
(function(){
  if(typeof window.tqInit==='function'){
    const base=window.tqInit;
    window.tqInit=function(){const fresh=typeof TQ==='undefined'||!TQ;base.apply(this,arguments);if(fresh&&TQ)ospConvertTyped();};
  }
  if(document.getElementById('osp-css')) return;
  const c=document.createElement('style'); c.id='osp-css';
  c.textContent=`.app .oj-hero .osp-strip .now-cell{order:0}
.app .oj-hero .osp-strip{align-items:start}
.osp-cell .k{margin-bottom:4px}
.osp-val{display:block;text-align:left;font:inherit;font-size:14px;line-height:21px;font-weight:600;color:var(--on-surface);background:none;border:0;padding:0;cursor:pointer}
.osp-val:hover{text-decoration:underline}.osp-val.bad,.osp-bad{color:var(--crm-error,#b3261e)}
.osp-nb.is-none,.osp-nb.is-outcome{color:var(--crm-warning,#8d6715)}.osp-nb.is-overdue{color:var(--crm-error,#b3261e)}
.osp-skip,.osp-link{font:inherit;font-size:12.5px;background:none;border:0;padding:0;margin-top:4px;color:var(--on-variant);text-decoration:underline;cursor:pointer}
.osp-link{color:var(--primary);margin-right:8px}
.osp-row-fix{margin:0 4px 0 0;white-space:nowrap}
.osp-units{display:flex;flex-wrap:nowrap;align-items:center;gap:6px;min-width:0}
.osp-unit{display:inline-flex;align-items:center;flex:none;max-width:100%;height:32px;font-size:12.5px;white-space:nowrap;border:1px solid var(--outline);background:var(--surface);border-radius:8px}
.osp-unit-o{display:inline-flex;align-items:center;gap:8px;min-width:0;height:100%;font:inherit;background:none;border:0;padding:0 8px 0 10px;cursor:pointer;color:inherit}
.osp-unit b{flex:none;font-weight:600}
.osp-unit .osp-chip{min-width:0;overflow:hidden;text-overflow:ellipsis;padding:2px 8px;line-height:16px}
.osp-unit:hover{border-color:var(--on-variant)}
.osp-unit-x{flex:none;width:28px;height:100%;font:inherit;font-size:15px;line-height:1;background:none;border:0;border-left:1px solid var(--outline-variant,#eeeae2);color:var(--muted);cursor:pointer;border-radius:0 8px 8px 0}
.osp-unit-x:hover,.osp-unit-x:focus-visible{color:var(--crm-error,#b3261e);background:var(--sc-low,#f3f0ea)}
.osp-mu{font-size:12px;color:var(--muted)}
.osp-chip{font-size:11.5px;border-radius:999px;padding:1px 8px;background:var(--surface-2,#f1efe9);color:var(--on-variant);white-space:nowrap}
.osp-chip.t-info{background:#e5eef8;color:#2f5a8a}.osp-chip.t-ok{background:#e3f1e3;color:#2f6b2f}.osp-chip.t-warn{background:#fbefd7;color:#8d6715}.osp-chip.t-bad{background:#fbe4e1;color:#a2342a}
.osp-more-w{position:relative;flex:none}
.osp-more{height:32px;font:inherit;font-size:12.5px;font-weight:600;border:1px solid var(--outline);background:var(--surface);border-radius:8px;padding:0 10px;cursor:pointer}
.osp-more:hover,.osp-more-w.is-open .osp-more{border-color:var(--on-variant)}
.osp-pop{display:none;position:absolute;z-index:30;top:100%;left:0;flex-direction:column;align-items:stretch;gap:4px;min-width:180px;max-height:260px;overflow-y:auto;margin-top:4px;padding:6px;background:var(--surface);border:1px solid var(--outline);border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.12)}
.osp-pop::before{content:'';position:absolute;left:0;right:0;top:-6px;height:6px}
.osp-more-w:hover .osp-pop,.osp-more-w:focus-within .osp-pop,.osp-more-w.is-open .osp-pop{display:flex}
.osp-pop .osp-unit{width:100%}.osp-pop .osp-unit-o{flex:1;justify-content:space-between}
.app .oj-hero .oj-bar>.oj-stages{flex:1 1 auto;width:100%;min-width:0}
.osp-empty{font-size:13.5px;color:var(--muted)}
.osp-bl{display:flex;flex-direction:column;align-items:flex-start;gap:1px;margin-bottom:6px}.osp-bl-c{font-size:13.5px;font-weight:600;color:var(--crm-warning,#8d6715)}
.osp-rows{border-top:1px solid var(--outline-variant,#eeeae2);margin-top:12px;padding-top:6px}
.osp-row-k{font-size:13px;color:var(--muted);min-width:56px}
.osp-ticks{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:3px}
.osp-ticks li{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--on-variant)}
.osp-ticks li.is-done{color:var(--muted)}.osp-ticks li.is-skip{color:var(--muted);text-decoration:line-through}
.osp-ticks li.is-cur{color:var(--on-surface);font-weight:600}
.osp-tk{width:14px;height:14px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;border:1.3px solid var(--outline);flex:none}
.osp-ticks li.is-done .osp-tk{background:var(--primary);border-color:var(--primary);color:#fff}
.osp-ticks li.is-cur .osp-tk{border-color:var(--on-surface);box-shadow:0 0 0 2px var(--surface),0 0 0 3.5px var(--on-surface)}
.od-field.osp-missing{outline:2px solid var(--crm-warning,#d29b2b);outline-offset:4px;border-radius:6px}
.osp-tcell{font-size:13px}.card-row .osp-nb{font-size:inherit}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`;
  document.head.appendChild(c);
})();
