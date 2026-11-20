// Offer to promise of sale as one flow (Opportunity flow S-07 · D-36, D-38, D-39).
// One Offer per opportunity (x.offer): Logged → Waiting for approval → Accepted → POS booked, or Countered, Rejected, Expired.
// An offer below asking (by the rep's rule in Settings › Approvals) goes to Approvals as an 'offer' request; the manager approves the offer itself.
// Accepting requests the hold. Booking the POS signing needs an offer price, and Contract Booked needs an accepted offer.
// Loads after appt-book.js so it can extend the shared booking drawer for POS signings.
const OF_LIMIT_PCT=3;
const OF_GATED=['Contract Booked','Contract No Show'];
const OF_STATE={logged:['Logged','neu'],approval:['Waiting for approval','warn'],accepted:['Accepted','ok'],pos:['POS booked','ok'],countered:['Countered','info'],rejected:['Rejected','bad'],expired:['Expired','bad']};
const OF_PLANS=['10/20/70','20/20/60','10/90','30/70'];

const ofE=s=>xesc(String(s??''));
function ofNum(v){return +String(v??'').replace(/[^\d]/g,'')||0;}
function ofFirst(o){return o.lead.split(' ')[0];}
// The rep's saved rule from Settings › Approvals ('price' = Offer below asking price). Falls back to a 3% limit.
function ofPolicy(o){
  const p=o&&typeof window.stApPolicy==='function'?window.stApPolicy(o.rep,'price'):null;
  return p&&p.rule?p:{rule:'over',limitPct:OF_LIMIT_PCT,limitEur:0,approver:typeof apApprover==='function'?apApprover():'Rachel Mifsud'};
}
function ofMgr(o){return String(ofPolicy(o).approver||'Rachel Mifsud').split(' ')[0];}
function ofRuleText(o){const p=ofPolicy(o);return p.rule==='approve'?'Any offer below asking needs approval':p.rule==='auto'?'Offers below asking don’t need approval':`The limit is ${[p.limitPct?p.limitPct+'%':'',p.limitEur?fmtEur(p.limitEur):''].filter(Boolean).join(' or ')} below asking`;}
function ofAsk(o,u){const x=getExt(o),cfg=x.unitConfigs&&x.unitConfigs[u],un=u&&typeof UN==='function'?UN(u):null;return (cfg&&cfg.price)||(un&&un.price)||(o.value||0)*1000;}
// Does this offer need the approver? 'approve': any amount below asking. 'over': more than the % or € limit. 'auto': never.
function ofNeedsOk(amt,ask,o){
  if(!ask||!(amt<ask)) return false;
  const p=ofPolicy(o||oppCur);
  if(p.rule==='auto') return false;
  if(p.rule==='approve') return true;
  return (p.limitPct>0&&amt<ask*(1-p.limitPct/100))||(p.limitEur>0&&ask-amt>p.limitEur);
}
function ofPct(amt,ask){return ask?Math.round((ask-amt)/ask*1000)/10:0;}
function ofDay(iso){return iso?new Date(iso+'T12:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):'';}
function ofToday(){return cvISO(cvToday());}

// ---------- model ----------
// Older records only carry {amt,status}; they're read into the same shape the first time they're touched.
function ofGet(o){
  const x=getExt(o), of=x.offer; if(!of) return null;
  if(!of.state){
    const s=String(of.status||'');
    of.state=/POS signed|Deed signed|POS booked/i.test(s)?'pos':/accept/i.test(s)||jIdx(x.jstage)>=jIdx('hold')?'accepted':/counter/i.test(s)?'countered':/reject/i.test(s)?'rejected':'logged';
    of.unit=of.unit||o.units[0]||'';
    of.ask=of.ask||ofAsk(o,of.unit);
    of.rounds=of.rounds||(x.bids||[]).map(b=>({d:b.d,by:b.by,amt:ofNum(b.amt),res:b.res}));
    if(!of.rounds.length&&of.amt) of.rounds=[{d:'Earlier',by:o.lead,amt:of.amt,res:OF_STATE[of.state][0]}];
    of.events=of.events||[];
  }
  return of;
}
function ofState(of){
  if(!of) return null;
  if(['logged','approval','countered'].includes(of.state)&&of.expiry&&of.expiry<ofToday()) return 'expired';
  return of.state;
}
function ofAccepted(o){const of=ofGet(o);return !!of&&['accepted','pos'].includes(of.state);}
function ofSetState(o,state){
  const of=ofGet(o); of.state=state; of.status=OF_STATE[state][0];
  const last=of.rounds[of.rounds.length-1]; if(last) last.res=OF_STATE[state][0];
}
// Every offer event goes to the timeline (of.events) and the activity feed (x.comms) with its status.
function ofEvent(o,text,state){
  const of=ofGet(o), x=getExt(o);
  of.events.unshift({t:'Just now',text,state});
  x.comms.unshift({ch:'sys',t:'Just now',text,offer:state,tone:{accepted:'ok',pos:'ok',approval:'warn',rejected:'bad'}[state]});
}
function ofRound(o,f,out){
  const x=getExt(o); let of=ofGet(o);
  if(!of||of.state==='pos') of=x.offer={rounds:[],events:[],state:'logged'};
  if(of.reqId&&typeof APPROVALS!=='undefined'){
    const i=APPROVALS.findIndex(r=>r.id===of.reqId&&!r.decided);
    if(i>=0){APPROVALS.splice(i,1);otLog(x,`${of.reqId} withdrawn. A new offer round replaces it.`);}
    delete of.reqId;
  }
  Object.assign(of,f,{ask:ofAsk(o,f.unit)});
  of.rounds.push({d:'Today',by:o.lead,amt:f.amt,res:out});
  x.bids=x.bids||[]; x.bids.push({d:'Today',by:o.lead,amt:fmtEur(f.amt),type:x.bids.length?'Revised offer':'Initial offer',res:out});
  return of;
}
function ofSendApproval(o){
  const x=getExt(o), of=ofGet(o), first=ofFirst(o), mgr=ofMgr(o);
  const r=apFile(o,of.unit,'offer');
  Object.assign(r,{offer:of.amt,ask:of.ask,deposit:of.deposit,plan:of.plan,expiry:of.expiry?ofDay(of.expiry):'',conditions:of.conditions||'',note:of.conditions||'',until:'',days:0});
  of.reqId=r.id; ofSetState(o,'approval');
  ofEvent(o,`${first} offered ${fmtEur(of.amt)} on ${of.unit}. Waiting for ${mgr}’s approval.`,'approval');
  otMove(o,'negotiating',{tl:1});
  x.next={label:`Waiting for ${mgr} to approve the offer`,due:'Today',overdue:false};
  if(typeof apBadge==='function') apBadge();
  return r;
}
// Accepting commits the buyer: the timeline moves to Committed and the hold is requested (as before).
function ofAccept(o,{via='logged',by='',hold=true,fromReq=''}={}){
  const x=getExt(o), of=ofGet(o), first=ofFirst(o), u=of.unit||o.units[0];
  ofSetState(o,'accepted');
  ofEvent(o,via==='approved'?`${by.split(' ')[0]} approved ${first}’s offer of ${fmtEur(of.amt)} on ${u}. Offer accepted.`
    :via==='pos'?`${first}’s offer of ${fmtEur(of.amt)} on ${u} accepted when the POS signing was booked.`
    :`${first}’s offer of ${fmtEur(of.amt)} on ${u} accepted.`,'accepted');
  let crossed=false;
  if(hold&&u){
    const hadHold=oppHoldState(o,x), early=jIdx(x.jstage)<=jIdx('hold');
    crossed=otMove(o,'hold',{tl:2,next:early?(hadHold==='held'?{label:'Take the reservation deposit',due:'This week'}:{label:'Chase hold approval',due:'Today'}):undefined});
    if(!hadHold&&typeof apFile==='function'){
      const r=apFile(o,u,'hold');
      if(!r.requestedBy) Object.assign(r,{days:typeof UH_DAYS!=='undefined'?UH_DAYS:14,until:`${typeof uhUntil==='function'?uhUntil():'in 14 days'}, 18:00`,requestedBy:o.rep});
      if(fromReq) r.fromOffer=fromReq;
      x.hold={unit:u,state:'requested'}; x.blocker=`Hold on ${u} — ${r.id} waiting in Approvals`;
      otLog(x,`Hold requested on ${u} · ${r.id}`);
    }
  }else if(tlIdx(o,x)<2) x.tl=2;
  if(STAGES.indexOf(o.stage)<STAGES.indexOf('Negotiating')&&!EXIT_STAGES.includes(o.stage)) o.stage='Negotiating';
  return crossed;
}
// Approvals decided an 'offer' request (called from apSyncOpp).
function ofApDecision(r,o){
  const x=getExt(o), of=ofGet(o); if(!of) return;
  const first=ofFirst(o), by=String(r.by||ofMgr(o));
  if(r.decided==='approved'){
    of.reqId=r.id;
    const pend=of.posPending; delete of.posPending;
    ofAccept(o,{via:'approved',by,hold:!pend,fromReq:r.id});
    if(pend) ofBookPending(o,pend,r.id);
  }else{
    ofSetState(o,'rejected');
    ofEvent(o,`${by.split(' ')[0]} rejected ${first}’s offer of ${fmtEur(of.amt)} on ${of.unit}. Reason: ${r.reason||'not given'}.`,'rejected');
    if(of.posPending){delete of.posPending;otLog(x,'POS signing not booked because the offer was rejected.');}
    x.next={label:`Talk to ${first} about a new offer`,due:'Today',overdue:false};
  }
}

// ---------- log an offer ----------
function oppOfferOpen(){
  const o=oppCur, of=ofGet(o), units=o.units;
  const u=of&&units.includes(of.unit)?of.unit:units[0]||'';
  const ask=ofAsk(o,u), amt=of&&of.amt?of.amt:ask, plan=of&&of.plan||'10/20/70';
  const exp=of&&of.expiry&&of.expiry>=ofToday()?of.expiry:cvISO(cvAddDays(cvToday(),7));
  const body=`<div class="od-field"><label for="ofUnit">Unit</label>${units.length>1
      ?`<select id="ofUnit" onchange="ofFormSync()">${units.map(id=>`<option value="${ofE(id)}" ${id===u?'selected':''}>${ofE(id)}</option>`).join('')}</select>`
      :`<input id="ofUnit" value="${ofE(u)}" readonly>`}</div>
    <div class="od-field"><label for="ofAmt">Offer amount (€)</label><input id="ofAmt" type="number" min="0" step="1000" value="${amt||''}" oninput="ofFormSync()"><div class="of-hint" id="ofHint"></div></div>
    <div class="of-two"><div class="od-field"><label for="ofDep">Deposit (€)</label><input id="ofDep" type="number" min="0" step="500" value="${of&&of.deposit||Math.round((amt||0)/10)}" oninput="this.dataset.edited='1'"></div>
      <div class="od-field"><label for="ofPlan">Payment plan</label><select id="ofPlan">${[...new Set([plan,...OF_PLANS])].map(p=>`<option ${p===plan?'selected':''}>${ofE(p)}</option>`).join('')}</select></div></div>
    <div class="od-field"><label for="ofExp">Offer expires</label><input id="ofExp" type="date" value="${exp}"></div>
    <div class="od-field"><label for="ofCond">Conditions <span class="ll-mu">(optional)</span></label><textarea id="ofCond" rows="2" placeholder="e.g. Subject to bank loan approval">${ofE(of&&of.conditions||'')}</textarea></div>
    <div class="od-field"><label>Outcome</label><div class="chk-row" id="ofOut">${['Accepted','Countered','Pending','Rejected'].map(l=>`<button type="button" class="fm-opt ${l==='Pending'?'on':''}" onclick="qaPick(this);ofFormSync()">${l}</button>`).join('')}</div></div>`;
  qaDrawerOpen('Log an offer',body,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" id="ofSave" onclick="oppOfferSave()">Log offer</button>`);
  ofFormSync();
}
function ofFormSync(){
  const o=oppCur, u=document.getElementById('ofUnit')?.value||'', amt=ofNum(document.getElementById('ofAmt')?.value), ask=ofAsk(o,u);
  const out=document.querySelector('#ofOut .on')?.textContent||'Pending', below=ofNeedsOk(amt,ask,o), pct=ofPct(amt,ask);
  const dep=document.getElementById('ofDep'); if(dep&&!dep.dataset.edited) dep.value=Math.round(amt/10)||'';
  const hint=document.getElementById('ofHint');
  if(hint) hint.innerHTML=!ask?'':!amt?`Asking price ${fmtEur(ask)}.`
    :pct<=0?`Asking price ${fmtEur(ask)}. This offer is at or above asking.`
    :below?`<span class="of-warn">${pct}% below the ${fmtEur(ask)} asking price.</span> ${ofRuleText(o)}, so ${ofMgr(o)} approves it before it’s accepted.`
    :`${pct}% below the ${fmtEur(ask)} asking price. ${ofRuleText(o)}, so you can accept it.`;
  const btn=document.getElementById('ofSave'); if(btn) btn.textContent=out==='Accepted'&&below?'Send for approval':'Log offer';
}
function oppOfferSave(){
  const o=oppCur, x=getExt(o), first=ofFirst(o), amt=ofNum(document.getElementById('ofAmt')?.value);
  if(!amt){showToast('Enter the offer amount');return;}
  const u=document.getElementById('ofUnit')?.value||o.units[0]||'', out=document.querySelector('#ofOut .on')?.textContent||'Pending';
  const f={unit:u,amt,deposit:ofNum(document.getElementById('ofDep')?.value)||Math.round(amt/10),plan:document.getElementById('ofPlan')?.value||'10/20/70',
    expiry:document.getElementById('ofExp')?.value||'',conditions:(document.getElementById('ofCond')?.value||'').trim()};
  const of=ofRound(o,f,out);
  qaDrawerClose();
  let crossed=false, msg;
  if(out==='Accepted'){
    if(ofNeedsOk(amt,of.ask,o)){ofSendApproval(o);msg=`Offer sent to ${ofMgr(o)} for approval`;}
    else{crossed=ofAccept(o);msg='Offer accepted · hold requested';}
  }else{
    const st=out==='Countered'?'countered':out==='Rejected'?'rejected':'logged';
    ofSetState(o,st);
    ofEvent(o,`${first} offered ${fmtEur(amt)} on ${u}. ${st==='logged'?'Logged, not accepted yet.':OF_STATE[st][0]+'.'}`,st);
    otMove(o,'negotiating',{tl:1});
    if(STAGES.indexOf(o.stage)<STAGES.indexOf('Negotiating')&&!EXIT_STAGES.includes(o.stage)) o.stage='Negotiating';
    x.next={label:st==='countered'?`Wait for ${first}’s reply to the counter`:st==='rejected'?`Discuss alternatives with ${first}`:ofNeedsOk(amt,of.ask,o)?'Send the offer for approval':'Chase a decision on the offer',due:'In 2 days',overdue:false};
    msg=`Offer ${out.toLowerCase()} · round ${of.rounds.length} logged`;
  }
  renderOpp(); if(typeof pipeRenderAll==='function') pipeRenderAll(); if(typeof apBadge==='function') apBadge();
  if(crossed&&typeof ojConfetti==='function') ojConfetti();
  showToast(msg);
}
// Rail buttons
function ofSendForApproval(){const o=oppCur;ofSendApproval(o);renderOpp();if(typeof pipeRenderAll==='function')pipeRenderAll();showToast(`Offer sent to ${ofMgr(o)} for approval`);}
function ofMarkAccepted(){
  const o=oppCur, of=ofGet(o); if(!of) return;
  if(ofNeedsOk(of.amt,of.ask,o)){ofSendForApproval();return;}
  const crossed=ofAccept(o); renderOpp(); if(typeof pipeRenderAll==='function') pipeRenderAll(); if(typeof apBadge==='function') apBadge();
  if(crossed&&typeof ojConfetti==='function') ojConfetti();
  showToast('Offer accepted · hold requested');
}

// ---------- the Offer card on the record ----------
function ofNextBtn(o,of){
  const st=ofState(of);
  if(st==='approval') return `<button class="btn-ghost" onclick="apSel='${of.reqId}';apTab='open';apType='all';go('approvals');apRender()">Waiting for ${ofMgr(o)}</button>`;
  if(['logged','countered'].includes(st)) return ofNeedsOk(of.amt,of.ask,o)?`<button class="btn-primary" onclick="ofSendForApproval()">Send for approval</button>`:`<button class="btn-primary" onclick="ofMarkAccepted()">Mark accepted</button>`;
  if(st==='accepted') return `<button class="btn-primary" onclick="oppPosOpen()">Book POS signing</button>`;
  if(st==='rejected'||st==='expired') return `<button class="btn-primary" onclick="oppOfferOpen()">Log a new offer</button>`;
  return '';
}
function ofCardHtml(o){
  const of=ofGet(o);
  if(!of) return `<div class="dcard of-card" id="opp-offer-card"><div class="row-between rail-h"><div class="side-h">Offer</div></div>
    <div class="rail-empty">No offer yet.</div><button class="btn-ghost of-btn" onclick="oppOfferOpen()" ${o.units.length?'':'disabled'}>Log an offer</button></div>`;
  const st=ofState(of), [lab,tone]=OF_STATE[st], pct=ofPct(of.amt,of.ask);
  return `<div class="dcard of-card" id="opp-offer-card">
    <div class="row-between rail-h"><div class="side-h">Offer</div><span class="of-pill t-${tone}">${lab}</span></div>
    <div class="of-amt">${fmtEur(of.amt)}</div>
    <div class="of-vs">${of.ask?`Asking ${fmtEur(of.ask)}${pct>0?`, <span class="${ofNeedsOk(of.amt,of.ask,o)?'of-warn':''}">${pct}% below</span>`:pct<0?', above asking':''}`:''}${of.unit?` on ${ofE(of.unit)}`:''}</div>
    ${of.expiry&&!['accepted','pos'].includes(st)?`<div class="side-kv"><div class="k">Expires</div><div class="v ${st==='expired'?'of-bad':''}">${ofDay(of.expiry)}</div></div>`:''}
    ${of.deposit?`<div class="side-kv"><div class="k">Deposit</div><div class="v">${fmtEur(of.deposit)}</div></div>`:''}
    ${of.plan?`<div class="side-kv"><div class="k">Payment plan</div><div class="v">${ofE(of.plan)}</div></div>`:''}
    ${of.conditions?`<div class="side-kv"><div class="k">Conditions</div><div class="v">${ofE(of.conditions)}</div></div>`:''}
    ${of.posPending?`<div class="of-note">POS signing on ${ofE(cvDayLabel(of.posPending.date))} at ${ofE(of.posPending.start)} is saved. We’ll book it once ${ofMgr(o)} approves.</div>`:''}
    ${of.rounds.length?`<details class="of-rounds"><summary>Rounds (${of.rounds.length})</summary>${of.rounds.slice().reverse().map(r=>`<div class="of-round"><span>${ofE(r.d)}</span><b>${r.amt?fmtEur(r.amt):'—'}</b><span class="ll-mu">${ofE(r.res||'')}</span></div>`).join('')}</details>`:''}
    <div class="of-acts">${ofNextBtn(o,of)}${['pos'].includes(st)?'':`<button class="rail-link" onclick="oppOfferOpen()">Log offer round</button>`}</div>
  </div>`;
}

// ---------- D-36 · Contract Booked needs an accepted offer ----------
function ofGateOk(o,stage){return !OF_GATED.includes(stage)||OF_GATED.includes(o.stage)||ofAccepted(o)||!!(typeof dealFor==='function'&&dealFor(o.id));}
function ofGateBlock(o,stage){
  const of=ofGet(o), st=ofState(of), first=ofFirst(o);
  const why=!of?`${first} has no offer yet.`:st==='approval'?`${first}’s offer of ${fmtEur(of.amt)} is waiting for ${ofMgr(o)}’s approval.`:`${first}’s offer of ${fmtEur(of.amt)} is ${OF_STATE[st][0].toLowerCase()}, not accepted.`;
  qaDrawerOpen('Accept an offer first',`<div class="of-gate"><b>${ofE(o.lead)} can’t move to ${ofE(stage)} yet.</b><p>An opportunity moves to ${ofE(stage)} only after an offer is accepted. ${ofE(why)}</p></div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button>${st==='approval'
      ?`<button class="btn-primary" onclick="qaDrawerClose();apSel='${of.reqId}';apTab='open';apType='all';go('approvals');apRender()">Open in Approvals</button>`
      :`<button class="btn-primary" onclick="qaDrawerClose();oppCur=OPPS.find(r=>r.id==='${o.id}');oppOfferOpen()">Log an offer</button>`}`);
}

// ---------- POS signing: offer price, location, checklist from Settings, email preview ----------
function ofPosLive(){return !!(typeof AB!=='undefined'&&AB&&!AB.ctx&&AB.mode==='book'&&AB.type==='signing'&&AB.sign==='pos'&&abOpp());}
function ofPosPlan(o){
  const of=ofGet(o), price=ofNum(AB.offerPrice), u=AB.signUnit||(of&&of.unit)||o.units[0]||'', ask=ofAsk(o,u);
  const same=!!of&&['accepted','pos'].includes(of.state)&&of.amt===price&&(!of.unit||!AB.signUnit||of.unit===AB.signUnit);
  return {of,price,u,ask,same,pending:!!price&&!same&&ofNeedsOk(price,ask,o)};
}
function ofMailHtml(o){
  const p=ofPosPlan(o), c=typeof abContact==='function'?abContact(o):null, first=ofFirst(o);
  const email=(c&&c.email)||getExt(o).buyer?.email||o.lead.toLowerCase().replace(/\s+/g,'.')+'@email.com';
  const un=p.u&&UN(p.u), place=document.getElementById('ab-place')?.value||abPlace();
  const cc=(AB.guests||[]).map(g=>g.name||g.email);
  const rows=[['Date',cvDayLabel(AB.date)],['Time',`${AB.start} to ${abEnd()}`],['Location',place||'Not set'],['Unit',p.u?`${p.u}${un?', '+un.dev:''}`:'Not chosen'],['Offer price',p.price?fmtEur(p.price):'Not entered']];
  return `<div class="of-mail-h"><div><span>To</span><b>${ofE(o.lead)}</b> &lt;${ofE(email)}&gt;</div>${cc.length?`<div><span>Cc</span>${ofE(cc.join(', '))}</div>`:''}<div><span>Subject</span>Your promise of sale signing</div></div>
    <div class="of-mail-b"><p>Hi ${ofE(first)}, your promise of sale signing is booked.</p>
      <dl>${rows.map(([k,v])=>`<dt>${k}</dt><dd>${ofE(v)}</dd>`).join('')}</dl>
      <p>Please bring your ID card or passport. Reply to this email if you need to change the time.</p><p>${ofE(typeof CV_ME!=='undefined'?CV_ME:o.rep)}</p></div>`;
}
function ofPosSync(){
  if(!ofPosLive()) return;
  const o=abOpp(), p=ofPosPlan(o), first=ofFirst(o), hint=document.getElementById('of-pos-hint');
  if(hint) hint.innerHTML=!p.price?(p.of&&['accepted','pos'].includes(p.of.state)?`Enter the agreed price. ${first}’s accepted offer is ${fmtEur(p.of.amt)}.`:`No accepted offer yet. Enter the price agreed with ${first}. Booking records it as the offer.`)
    :p.same?`${first}’s accepted offer.`
    :p.pending?`<span class="of-warn">${ofPct(p.price,p.ask)}% below the ${fmtEur(p.ask)} asking price.</span> ${ofMgr(o)} approves the offer first. We’ll book the signing once ${ofMgr(o)} approves.`
    :`Booking accepts ${first}’s offer at this price.`;
  const btn=document.querySelector('#qaDrawerFoot .btn-primary');
  if(btn){if(!btn.dataset.base)btn.dataset.base=btn.textContent;btn.textContent=p.pending?'Send for approval':btn.dataset.base;}
  const mail=document.getElementById('of-mail-box'); if(mail) mail.innerHTML=ofMailHtml(o);
  const note=document.getElementById('of-mail-note'); if(note) note.textContent=p.pending?`Sent once ${ofMgr(o)} approves the offer and the signing is booked.`:`Sent to ${first} when you book.`;
}
function ofPosPrice(v){AB.offerPrice=v;ofPosSync();}
function ofPosDecorate(){
  const o=abOpp(), body=document.getElementById('qaDrawerBody'); if(!o||!body) return;
  const of=ofGet(o);
  if(AB.offerPrice===undefined) AB.offerPrice=of&&['accepted','pos'].includes(of.state)?String(of.amt):'';
  if(typeof llPosOn==='function'&&!llPosOn()) [...body.querySelectorAll('.od-field')].find(f=>/^Before the signing/.test(f.querySelector('label')?.textContent||''))?.remove();
  const price=`<div class="od-field" id="of-pos-price"><label for="of-pos-amt">Offer price <span class="ab-mu">(required)</span></label>
    <div class="of-cur"><span aria-hidden="true">€</span><input id="of-pos-amt" inputmode="numeric" autocomplete="off" value="${ofE(ofNum(AB.offerPrice)?ofNum(AB.offerPrice).toLocaleString('en-GB'):'')}" placeholder="e.g. 300,000" oninput="ofPosPrice(this.value)" onblur="if(ofNum(this.value))this.value=ofNum(this.value).toLocaleString('en-GB')"></div>
    <div class="ab-mu" id="of-pos-hint"></div></div>`;
  const anchor=document.getElementById('ab-sign')||[...body.querySelectorAll('.od-field')].find(f=>/being signed/.test(f.querySelector('label')?.textContent||''));
  if(anchor) anchor.insertAdjacentHTML('afterend',price); else body.insertAdjacentHTML('afterbegin',price);
  const pl=body.querySelector('label[for="ab-place"]'); if(pl) pl.textContent='Location';
  document.getElementById('ab-place')?.addEventListener('input',ofPosSync);
  const mail=`<div class="od-field of-mail" id="of-mail"><label>Confirmation email</label><div class="of-mail-box" id="of-mail-box"></div><div class="ab-mu" id="of-mail-note"></div></div>`;
  const sync=body.querySelector('.ab-sync'); if(sync) sync.insertAdjacentHTML('beforebegin',mail); else body.insertAdjacentHTML('beforeend',mail);
  ofPosSync();
}
function ofPosInfo(o){const p=ofPosPlan(o);return {date:AB.date,day:cvDayLabel(AB.date),start:AB.start,end:abEnd(),place:abPlace(),unit:AB.signUnit,price:p.price,guests:(AB.guests||[]).map(g=>g.email)};}
function ofPosBooked(o,info){
  const x=getExt(o), of=ofGet(o), first=ofFirst(o);
  ofSetState(o,'pos'); of.pos={date:info.date,start:info.start,place:info.place};
  ofEvent(o,`POS signing for ${first}’s offer of ${fmtEur(of.amt)} on ${of.unit} booked for ${info.day} at ${info.start}.`,'pos');
  const c=typeof abContact==='function'?abContact(o):null, email=(c&&c.email)||x.buyer?.email||'';
  x.comms.unshift({ch:'em',dir:'out',who:'You',t:'Just now',sub:'Your promise of sale signing',
    text:[`Hi ${first}, your promise of sale signing is booked.`,`Date: ${info.day}`,`Time: ${info.start} to ${info.end}`,`Location: ${info.place}`,`Unit: ${info.unit}`,`Offer price: ${fmtEur(info.price)}`,email?`Sent to ${email}`:''].filter(Boolean).map(ofE).join('<br>')});
}
// Approval came through for an offer that was waiting with a POS signing saved: book it now.
function ofBookPending(o,snap,reqId){
  const prev=typeof AB!=='undefined'?AB:null, n=cvExtra.length;
  AB=snap; AB.offerPrice=String(ofGet(o).amt);
  const info=ofPosInfo(o);
  ofBaseSave();
  if(cvExtra.length>n) cvExtra[cvExtra.length-1].fromOffer=reqId;
  ofPosBooked(o,info);
  AB=prev;
}
let ofBaseSave=()=>{};
(function(){
  if(typeof window.abRender!=='function'||typeof window.abSave!=='function') return;
  const render=window.abRender, save=window.abSave;
  ofBaseSave=()=>save.call(window);
  window.abRender=function(){render.apply(this,arguments);if(ofPosLive())ofPosDecorate();};
  window.abSave=function(){
    if(!ofPosLive()||!AB.signUnit) return save.apply(this,arguments);
    const o=abOpp(), x=getExt(o), first=ofFirst(o), p=ofPosPlan(o);
    if(!p.price){showToast('Enter the offer price to book the POS signing');document.getElementById('of-pos-amt')?.focus();return;}
    const info=ofPosInfo(o);
    const waiting=p.of&&p.of.state==='approval'&&p.of.amt===p.price&&p.of.unit===AB.signUnit;
    if(waiting){
      p.of.posPending=JSON.parse(JSON.stringify(AB));
      otLog(x,`POS signing on ${info.day} at ${info.start} saved. We’ll book it once ${ofMgr(o)} approves the offer.`);
      qaDrawerClose(); AB=null; renderOpp();
      showToast(`We’ll book the signing once ${ofMgr(o)} approves`);
      return;
    }
    if(!p.same){
      const of=ofRound(o,{unit:AB.signUnit,amt:p.price,deposit:Math.round(p.price/10),plan:(p.of&&p.of.plan)||'10/20/70',expiry:'',conditions:(p.of&&p.of.conditions)||''},'Accepted');
      if(p.pending){
        ofSendApproval(o);
        of.posPending=JSON.parse(JSON.stringify(AB));
        otLog(x,`POS signing on ${info.day} at ${info.start} saved. We’ll book it once ${ofMgr(o)} approves the offer.`);
        qaDrawerClose(); AB=null;
        renderOpp(); if(typeof pipeRenderAll==='function') pipeRenderAll();
        showToast(`We’ll book the signing once ${ofMgr(o)} approves`);
        return;
      }
      ofAccept(o,{via:'pos',hold:false});
    }
    save.apply(this,arguments);
    if(AB) return; // the booking drawer kept itself open (validation)
    ofPosBooked(o,info);
    if(oppCur&&oppCur.id===o.id&&document.getElementById('p-opp')?.classList.contains('on')) renderOpp();
  };
})();

// ---------- record wiring ----------
(function(){
  // D-36: nothing reaches the Committed step (or later) without an accepted offer, an approved hold included.
  const tl=window.tlIdx;
  window.tlIdx=function(o,x){const i=tl.apply(this,arguments);return i>=2&&!(typeof dealFor==='function'&&dealFor(o.id))&&!ofAccepted(o)?1:i;};
  const rail=window.railHtml;
  window.railHtml=function(o,x,ji){
    let h=rail.apply(this,arguments);
    h=h.replace(/<div class="dcard">\s*<div class="side-h">Offer<\/div>[\s\S]*?<div class="k">Deposit<\/div><div class="v">[^<]*<\/div><\/div>\s*<\/div>/,'');
    if(EXIT_STAGES.includes(o.stage)&&!x.offer) return h;
    const card=ofCardHtml(o), at=h.search(/<div class="dcard">\s*<div class="row-between rail-h"><div class="side-h">Documents · KYC/);
    return at>=0?h.slice(0,at)+card+h.slice(at):h+card;
  };
  // The Offer status row on the timeline is drawn by the opportunity strip (opp-strip.js).
  // Stage moves that land on Contract Booked check for an accepted offer first.
  const drop=window.colDrop;
  window.colDrop=function(e,stage){
    const id=dragOppId||e.dataTransfer?.getData('text/plain'), o=OPPS.find(r=>r.id===id);
    if(o&&!ofGateOk(o,stage)){e.preventDefault();if(typeof pipeDropLineClear==='function')pipeDropLineClear();dragOppId=null;renderBoard();ofGateBlock(o,stage);return;}
    return drop.apply(this,arguments);
  };
  const apply=window.oppDetailsApply;
  window.oppDetailsApply=function(id,field,value){
    const o=field==='stage'&&OPPS.find(r=>r.id===id);
    if(o&&!ofGateOk(o,value)){
      if(oppCur?.id===o.id&&document.getElementById('p-opp')?.classList.contains('on')) renderOpp();
      if(typeof oppPeekRender==='function') oppPeekRender();
      ofGateBlock(o,value);return;
    }
    return apply.apply(this,arguments);
  };
  const adv=window.ojAdvance;
  window.ojAdvance=function(){
    const o=oppCur, x=getExt(o), nj=JOURNEY[jIdx(x.jstage)+1], to=nj&&J2STAGE[nj.key];
    if(to&&!ofGateOk(o,to)){ofGateBlock(o,to);return;}
    return adv.apply(this,arguments);
  };
  const dep=window.otDepositOpen;
  if(dep) window.otDepositOpen=function(){
    const o=oppCur, x=getExt(o);
    if(jIdx(x.jstage)<jIdx('reservation')&&!ofGateOk(o,'Contract Booked')){ofGateBlock(o,'Contract Booked');return;}
    return dep.apply(this,arguments);
  };
  const surf=typeof SB_SURFACES!=='undefined'&&SB_SURFACES.find(s=>s.pageId==='p-pipeline'), act=surf&&surf.actions.find(a=>a.id==='o-stage');
  if(act){
    const run=act.run;
    act.run=function(ids,v){
      const blocked=ids.filter(id=>{const o=OPPS.find(r=>r.id===id);return o&&!ofGateOk(o,v);});
      if(!blocked.length) return run.apply(this,arguments);
      const ok=ids.filter(id=>!blocked.includes(id)), res=ok.length?run.call(this,ok,v):{msg:''};
      return {...res,msg:`${ok.length} moved to ${v}. ${blocked.length} need${blocked.length===1?'s':''} an accepted offer first.`};
    };
  }
})();

(function(){
  if(document.getElementById('of-css')) return;
  const s=document.createElement('style'); s.id='of-css';
  s.textContent=`
.of-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.of-hint{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.45}
.of-warn{color:var(--crm-warning,#8d6715);font-weight:500}.of-bad{color:var(--crm-error,#b3261e)}
.of-pill{display:inline-flex;align-items:center;font-size:11.5px;font-weight:500;border-radius:999px;padding:1px 9px;white-space:nowrap;background:var(--surface-2,#f1efe9);color:var(--on-variant)}
.of-pill.t-ok{background:#e3f1e3;color:#2f6b2f}.of-pill.t-warn{background:#fbefd7;color:#8d6715}.of-pill.t-bad{background:#fbe4e1;color:#a2342a}.of-pill.t-info{background:#e5eef8;color:#2f5a8a}
.of-card .of-amt{font-size:20px;font-weight:600;letter-spacing:-.3px}
.of-card .of-vs{font-size:12.5px;color:var(--muted);margin:2px 0 12px}
.of-card .side-kv{margin-bottom:8px}
.of-note{font-size:12.5px;background:#fbefd7;color:#6d5212;border-radius:8px;padding:8px 10px;margin:8px 0}
.of-rounds{margin:8px 0 4px;font-size:12.5px}.of-rounds summary{cursor:pointer;color:var(--on-variant)}
.of-round{display:grid;grid-template-columns:1fr auto auto;gap:10px;padding:5px 0;border-bottom:1px solid var(--outline-variant,#eeeae2)}
.of-acts{display:flex;align-items:center;gap:12px;margin-top:12px;flex-wrap:wrap}
.of-btn{margin-top:10px}
.of-tl{display:flex;gap:16px;align-items:flex-start;padding:10px 0 2px;margin-top:12px;border-top:1px solid var(--outline-variant,#eeeae2)}
.of-tl-k{font-size:13px;color:var(--muted);min-width:56px;padding-top:2px}
.of-tl-list{flex:1;min-width:0}
.of-tl-row{display:flex;gap:10px;align-items:baseline;padding:3px 0;font-size:13px}
.of-tl-tx{flex:1;min-width:0}.of-tl-t{font-size:12px;color:var(--muted);white-space:nowrap}
.of-tl-more summary{cursor:pointer;font-size:12px;color:var(--muted);padding:2px 0}
.of-gate b{display:block;font-size:14px;margin-bottom:6px}.of-gate p{margin:0;color:var(--on-variant);line-height:1.5}
.of-cur{display:flex;align-items:center;border:1px solid var(--outline);border-radius:8px;background:var(--surface);padding-left:10px}
.of-cur span{color:var(--muted)}.of-cur input{border:0!important;box-shadow:none!important;background:transparent;flex:1}
.of-mail-box{border:1px solid var(--outline);border-radius:10px;overflow:hidden;font-size:12.5px;background:var(--surface)}
.of-mail-h{padding:8px 12px;border-bottom:1px solid var(--outline-variant,#eeeae2);background:var(--surface-2,#f7f5f0)}
.of-mail-h div{padding:1px 0}.of-mail-h span{display:inline-block;width:56px;color:var(--muted)}
.of-mail-b{padding:10px 12px}.of-mail-b p{margin:0 0 8px}
.of-mail-b dl{display:grid;grid-template-columns:90px 1fr;gap:3px 10px;margin:0 0 10px}.of-mail-b dt{color:var(--muted)}.of-mail-b dd{margin:0;font-weight:500}
`;
  document.head.appendChild(s);
})();
