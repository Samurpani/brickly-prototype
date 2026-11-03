// Opportunity timeline flows: every button on the Timeline opens the flow that does the work.
// A stage moves only when the flow records the event (contact made, appointment held, offer accepted, deposit received…).

let OT={};
function otFirst(o){return o.lead.split(' ')[0];}
function otDone(x,item){x.done=x.done||[];if(!x.done.includes(item))x.done.push(item);}
function otLog(x,text,extra={}){x.comms.unshift({ch:'sys',t:'Just now',text,...extra});}
// Moves the journey forward only (never back), keeps the pipeline column and the commitment timeline in step.
function otMove(o,key,{tl,next}={}){
  const x=getExt(o), from=jIdx(x.jstage), to=jIdx(key);
  const crossed=from>=0&&to>from&&JOURNEY[from].phase==='A'&&JOURNEY[to].phase==='B';
  if(to>from){
    x.jstage=key; x.done=[];
    const bs=J2STAGE[key]; if(bs&&!EXIT_STAGES.includes(o.stage)) o.stage=bs;
    otLog(x,'Stage advanced to '+JOURNEY[to].label);
  }
  if(tl!=null&&tlIdx(o,x)<tl) x.tl=tl;
  if(next) x.next={overdue:false,due:'',...next};
  return crossed;
}
function otFinish(toast,crossed){
  qaDrawerClose(); renderOpp();
  if(typeof pipeRenderAll==='function') pipeRenderAll();
  if(crossed&&typeof ojConfetti==='function') ojConfetti();
  showToast(toast);
}
function otChips(id,opts,on,onclick){
  return `<div class="chk-row" id="${id}">${opts.map(([l,k])=>`<button type="button" class="fm-opt ${k===on?'on':''}" data-k="${k}" onclick="${onclick?onclick.replace('$k',k):'qaPick(this)'}">${l}</button>`).join('')}</div>`;
}
function otPicked(id,dflt){return document.querySelector(`#${id} .on`)?.dataset.k||dflt;}
function otSeg(opts,on,fn){return `<div class="qa-seg">${opts.map(([l,k])=>`<button type="button" class="ff-chip ${on===k?'on':''}" onclick="${fn}('${k}')">${l}</button>`).join('')}</div>`;}
const OT_CH=[['WhatsApp','wa'],['SMS','sms'],['Email','em']];
function otPosBooked(x){return !!(x.date&&/POS signing/i.test(x.date.label))||(x.appts||[]).some(a=>/POS/.test(a.label));}
function otKycMissing(o,x){return ensureDocs(o,x).filter(d=>d.g==='KYC'&&d.status!=='verified');}

// ---------- the primary button: the next real piece of work ----------
function ojCta(o,x){
  const j=x.jstage, hold=oppHoldState(o,x);
  if(j==='lead') return ['Make first contact','otContactOpen()'];
  if(j==='qualified') return ['Book appointment','qaViewing()'];
  if(j==='viewing_booked') return ['Confirm appointment','otApptOpen()'];
  if(j==='viewing_held') return x.packSent?['Log an offer','oppOfferOpen()']:['Send follow-up pack','otPackOpen()'];
  if(j==='negotiating') return ['Log offer round','oppOfferOpen()'];
  if(j==='hold') return hold==='held'?['Take reservation','otDepositOpen()']:['Chase hold approval','otHoldOpen()'];
  if(j==='reservation') return ['Collect deposit','otDepositOpen()'];
  if(j==='kyc') return otKycMissing(o,x).length?['Request outstanding docs','otKycOpen()']:otPosBooked(x)?['Sign POS — create deal','ojAdvance()']:['Book POS signing','oppPosOpen()'];
  return [JOURNEY[jIdx(j)]?.cta||'Next step','ojAdvance()'];
}
// Assist: the other flows that make sense right now (never the primary button again).
window.oppAssist=function(o,x,ti){
  const u=o.units[0], hold=oppHoldState(o,x), cta=ojCta(o,x)[1], items=[];
  const add=(t,fn,when=true)=>{if(when&&fn!==cta&&!items.some(i=>i.fn===fn)) items.push({t,fn});};
  add('Send a message','qaMessage()');
  add('Log a call or meeting','qaLog()');
  if(ti<=1){
    add('Book appointment','qaViewing()',!oppApptSummary(o,x).v.startsWith('Viewing'));
    add('Record appointment outcome','otApptOpen()',!!(x.appts?.length||x.jstage==='viewing_booked'));
    add(`Put ${u} on hold`,'oppHoldRequest()',!!u&&!hold);
    add('Log an offer','oppOfferOpen()');
  }
  if(ti===2){
    add('Chase hold approval','otHoldOpen()',hold==='requested');
    add('Collect deposit','otDepositOpen()',jIdx(x.jstage)<jIdx('kyc'));
    add('Request KYC documents','otKycOpen()',otKycMissing(o,x).length>0);
    add('Book the POS signing','oppPosOpen()',!otPosBooked(x));
  }
  return items;
};
// Stage popovers: each "what moves it" line starts that flow.
const OT_MOVES={'A reply or a call':'qaLog()','An appointment booked':'qaViewing()','A hold requested':'oppHoldRequest()','A hold approved':'otHoldOpen()',
  'An offer accepted':'oppOfferOpen()','POS signing booked':'oppPosOpen()','POS signed':'ojAdvance()','Deposit received':'otDepositOpen()'};
(function(){
  const base=window.ojPop;
  window.ojPop=function(e,key){
    base.apply(this,arguments);
    const pop=document.getElementById('oj-pop'); if(!pop) return;
    pop.querySelectorAll('.task').forEach(row=>{
      const txt=row.querySelector('.tt')?.textContent, fn=OT_MOVES[txt], done=row.querySelector('.check.done');
      if(!fn||done||(fn==='oppHoldRequest()'&&(!oppCur.units[0]||oppHoldState(oppCur,getExt(oppCur))))) return;
      row.insertAdjacentHTML('beforeend',`<button type="button" class="ot-do" onclick="document.getElementById('oj-pop')?.remove();${fn}">Do it</button>`);
    });
  };
})();

// ---------- Lead · make first contact ----------
function otContactOpen(mode){
  const o=oppCur, first=otFirst(o), u=o.units[0], dev=o.devs[0];
  OT={mode:mode||'msg',outcome:mode&&OT.flow==='contact'?OT.outcome||'reached':'reached',flow:'contact'};
  const b=getExt(o).buyer||{};
  let body=otSeg([['Send a message','msg'],['Log a call','call']],OT.mode,'otContactOpen');
  if(OT.mode==='msg') body+=`
    <div class="od-field"><label>Send via</label>${otChips('otCh',OT_CH,'wa')}</div>
    <div class="od-field"><label for="otMsg">Message</label><textarea id="otMsg" rows="4">Hi ${first}, it’s ${o.rep} from ${dev}. Thanks for your enquiry${u?` about ${u}`:''}. When suits you for a quick call this week? I can send floor plans and prices ahead of it.</textarea></div>
    <div class="ll-mu">Stays at Lead until ${first} replies or picks up. A follow-up is set for two days.</div>`;
  else body+=`
    <div class="od-field"><label>Outcome</label>${otChips('otOut',[['Reached','reached'],['No answer','noanswer'],['Wrong number','wrong']],OT.outcome,"OT.outcome='$k';otContactOpen('call')")}</div>
    ${OT.outcome==='reached'?`
    <div class="od-field"><label for="otBudget">Budget</label><input id="otBudget" value="${o.budget?'€'+o.budget+'k':''}" placeholder="e.g. €350k"></div>
    <div class="od-field"><label for="otTimeline">Timeline</label><select id="otTimeline">${['Within 3 months','3 to 6 months','6 to 12 months','Just looking'].map(v=>`<option ${b.timeline===v?'selected':''}>${v}</option>`).join('')}</select></div>
    <div class="od-field"><label for="otFinance">Finance</label><select id="otFinance">${['Cash buyer','Mortgage in principle','Needs a mortgage','Not discussed'].map(v=>`<option ${b.finance===v?'selected':''}>${v}</option>`).join('')}</select></div>
    <div class="od-field"><label for="otNotes">Notes</label><textarea id="otNotes" rows="2" placeholder="What ${first} is looking for…"></textarea></div>
    <div class="ll-mu">A call that reaches ${first} moves the timeline to Interested and the opportunity to Qualified.</div>`
    :`<div class="ll-mu">${OT.outcome==='noanswer'?'Logged as a call attempt. A retry is set for tomorrow.':'Flags the contact details as a blocker until they’re fixed.'}</div>`}`;
  qaDrawerOpen('Make first contact',body,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="otContactSave()">${OT.mode==='msg'?'Send message':'Log call'}</button>`);
}
function otContactSave(){
  const o=oppCur, x=getExt(o), first=otFirst(o);
  if(OT.mode==='msg'){
    const text=document.getElementById('otMsg').value.trim(), ch=otPicked('otCh','wa');
    if(!text){showToast('Write a message first');return;}
    x.comms.unshift({ch,dir:'out',who:'You',t:'Just now',text:xesc(text)});
    if(o.stage==='New Lead') o.stage='Contacted';
    otDone(x,'Contact details captured');
    x.next={label:`Follow up if ${first} doesn’t reply`,due:'In 2 days',overdue:false};
    otFinish(`Sent to ${first} via ${CH_META[ch].label}`);
    return;
  }
  if(OT.outcome==='reached'){
    const budget=document.getElementById('otBudget').value.trim(), timeline=document.getElementById('otTimeline').value, finance=document.getElementById('otFinance').value, notes=document.getElementById('otNotes').value.trim();
    if(!budget){showToast('Add the budget '+first+' gave you');return;}
    x.buyer={...(x.buyer||{}),timeline,finance};
    const k=Number(budget.replace(/[^\d.]/g,'')); if(k) o.budget=k>5000?Math.round(k/1000):k;
    x.comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text:xesc(`Call with ${first} — reached · budget ${budget} · ${timeline} · ${finance}${notes?' · '+notes:''}`)});
    const crossed=otMove(o,'qualified',{tl:1,next:{label:'Book appointment',due:'This week'}});
    otFinish(`${first} qualified · moved to Interested`,crossed);
  }else if(OT.outcome==='noanswer'){
    x.comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text:`Call to ${first} — no answer`});
    if(o.stage==='New Lead') o.stage='Contacted';
    x.next={label:`Call ${first} again`,due:'Tomorrow',overdue:false};
    otFinish('Call attempt logged · retry set for tomorrow');
  }else{
    x.comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text:`Call to ${first} — wrong number`});
    x.blocker='Wrong phone number — check contact details';
    otFinish('Flagged: contact details need fixing');
  }
}
// Booking an appointment is an engagement: Appointment Booked and Interested.
(function(){
  const base=window.qaViewingBook;
  window.qaViewingBook=function(){
    const before=getExt(oppCur).comms.length;
    base.apply(this,arguments);
    const o=oppCur, x=getExt(o); if(x.comms.length===before) return;
    otMove(o,'viewing_booked',{tl:1});
    x.next={label:`Confirm the appointment with ${otFirst(o)}`,due:x.appts?.[0]?.when.split(' · ')[0]||'',overdue:false};
    renderOpp(); if(typeof pipeRenderAll==='function') pipeRenderAll();
  };
})();

// ---------- Appointment booked · confirm, then record the outcome ----------
function otApptOpen(mode){
  const o=oppCur, x=getExt(o), first=otFirst(o), ap=oppApptSummary(o,x), dev=o.devs[0];
  OT={mode:mode||'confirm',outcome:mode&&OT.flow==='appt'?OT.outcome||'held':'held',flow:'appt'};
  let body=`<div class="od-field"><label>Appointment</label><input value="${xesc(ap.v)} · ${xesc(ap.d)}" readonly></div>`+otSeg([['Confirm with '+first,'confirm'],['Record outcome','outcome']],OT.mode,'otApptOpen');
  if(OT.mode==='confirm') body+=`
    <div class="od-field"><label>Send via</label>${otChips('otCh',OT_CH,'wa')}</div>
    <div class="od-field"><label for="otMsg">Message</label><textarea id="otMsg" rows="4">Hi ${first}, confirming ${ap.d.replace(/ · /g,', ')} at ${dev}. I’ll have ${o.units.length?o.units.join(' and '):'a few units'} ready to show. Parking is at the sales office. Reply YES to confirm or let me know if you need to move it.</textarea></div>`;
  else body+=`
    <div class="od-field"><label>How did it go?</label>${otChips('otOut',[['Held','held'],['No-show','noshow'],['Reschedule','resched']],OT.outcome,"OT.outcome='$k';otApptOpen('outcome')")}</div>
    ${OT.outcome==='held'?`
    <div class="od-field"><label>Interest</label>${otChips('otInt',[['Hot','hot'],['Warm','warm'],['Cool','cool']],'warm')}</div>
    <div class="od-field"><label>Shortlist</label><div class="qa-checks">${(o.units.length?o.units:[]).map(u=>`<label class="qa-check"><input type="checkbox" class="otShort" value="${u}" checked> <span><b>${u}</b><em>${UN(u)?UN(u).dev+' · '+fmtEur(UN(u).price):dev}</em></span></label>`).join('')||'<span class="ll-mu">No units on this opportunity yet</span>'}</div></div>
    <div class="od-field"><label for="otFb">Feedback</label><textarea id="otFb" rows="3" placeholder="What ${first} liked, objections, next questions…"></textarea></div>
    <div class="ll-mu">Moves to Appointment Completed. Follow up within 24 hours.</div>`
    :OT.outcome==='noshow'?`<div class="ll-mu">Moves to Appointment No Show. Reminders pause and a rebooking draft is prepared.</div>`
    :`<div class="ll-mu">Opens the booking form. The current appointment is replaced.</div>`}`;
  const btn=OT.mode==='confirm'?'Send confirmation':OT.outcome==='resched'?'Pick a new time':'Save outcome';
  qaDrawerOpen('Confirm appointment',body,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="otApptSave()">${btn}</button>`);
}
function otApptSave(){
  const o=oppCur, x=getExt(o), first=otFirst(o), ap=oppApptSummary(o,x);
  if(OT.mode==='confirm'){
    const text=document.getElementById('otMsg').value.trim(), ch=otPicked('otCh','wa');
    if(!text){showToast('Write a message first');return;}
    x.comms.unshift({ch,dir:'out',who:'You',t:'Just now',text:xesc(text)});
    otDone(x,'Reminder sent');
    x.next={label:`${ap.v} with ${first}`,due:ap.d.split(' · ')[0],overdue:false};
    otFinish(`Confirmation sent to ${first}`);
    return;
  }
  if(OT.outcome==='resched'){qaDrawerClose();qaViewing();return;}
  if(OT.outcome==='noshow'){
    o.stage='Appointment No Show';
    o.noShows=o.noShows||{appt:0,contract:0}; o.noShows.appt++;
    o.appt={kind:'viewing',at:ap.d,outcome:'noshow'};
    otLog(x,`${ap.v} — ${first} didn’t show`);
    x.next={label:`Rebook ${first}’s appointment`,due:'Today',overdue:false};
    if(x.draft!==undefined) delete x.draft;
    otFinish('Logged as a no-show · rebooking draft ready');
    return;
  }
  const short=[...document.querySelectorAll('.otShort:checked')].map(i=>i.value), fb=document.getElementById('otFb').value.trim(), interest=otPicked('otInt','warm');
  x.comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text:xesc(`${ap.v} held with ${first} · ${interest}${short.length?' · shortlisted '+short.join(', '):''}${fb?' · '+fb:''}`)});
  x.appts=(x.appts||[]).slice(1);
  if(short.length) o.units=[...short,...o.units.filter(u=>!short.includes(u))];
  const crossed=otMove(o,'viewing_held',{tl:1,next:{label:'Send follow-up pack',due:'Within 24h'}});
  otDone(x,'Feedback captured'); if(short.length) otDone(x,'Units shortlisted');
  otFinish(`${ap.v} logged · send the follow-up pack within 24h`,crossed);
}

// ---------- Appointment completed · follow-up pack ----------
function otPackOpen(){
  const o=oppCur, first=otFirst(o);
  const units=o.units.map(u=>`<label class="qa-check"><input type="checkbox" class="otPackU" value="${u}" checked> <span><b>${u}</b><em>${UN(u)?UN(u).dev+' · '+fmtEur(UN(u).price):o.devs[0]}</em></span></label>`).join('');
  qaDrawerOpen('Send follow-up pack',`
    <div class="od-field"><label>Units</label><div class="qa-checks">${units||'<span class="ll-mu">No units yet · the development overview is sent</span>'}</div></div>
    <div class="od-field"><label>Include</label><div class="qa-checks">${['Floor plans','Price list','Payment plan','Specification sheet'].map(s=>`<label class="qa-check"><input type="checkbox" class="otPackS" value="${s}" checked> <span>${s}</span></label>`).join('')}</div></div>
    <div class="od-field"><label>Send via</label>${otChips('otCh',OT_CH,'wa')}</div>
    <div class="od-field"><label for="otMsg">Message</label><textarea id="otMsg" rows="4">Hi ${first}, great to see you today. As promised, here are the floor plans, prices and payment plan for ${o.units.length?o.units.join(' and '):o.devs[0]}. Happy to talk numbers whenever you’re ready.</textarea></div>
    <div class="ll-mu">Tracked as a personalised pack · you’ll see when ${first} opens it.</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="otPackSend()">Send pack</button>`);
}
function otPackSend(){
  const o=oppCur, x=getExt(o), first=otFirst(o), ch=otPicked('otCh','wa'), text=document.getElementById('otMsg').value.trim();
  const units=[...document.querySelectorAll('.otPackU:checked')].map(i=>i.value), secs=[...document.querySelectorAll('.otPackS:checked')].map(i=>i.value);
  if(!secs.length){showToast('Include at least one section');return;}
  x.comms.unshift({ch,dir:'out',who:'You',t:'Just now',sub:xesc(`📎 Follow-up pack · ${units.join(', ')||o.devs[0]} · ${secs.join(', ')}`),text:xesc(text)});
  x.packSent=true;
  x.next={label:`Ask ${first} for an offer`,due:'In 3 days',overdue:false};
  otFinish(`Follow-up pack sent to ${first}`);
}

// Offers: every round is recorded; an accepted offer commits the buyer and requests the hold.
(function(){
  const base=window.oppOfferSave;
  window.oppOfferSave=function(){
    const o=oppCur, x=getExt(o), amt=+document.getElementById('ofAmt')?.value, out=document.querySelector('#ofOut .on')?.textContent||'Pending';
    if(!amt){base.apply(this,arguments);return;}
    base.apply(this,arguments);
    const u=o.units[0], un=u&&UN(u);
    x.bids=x.bids||[]; x.bids.push({d:'Today',by:o.lead,amt:fmtEur(amt),type:x.bids.length?'Revised offer':'Initial offer',res:out});
    let crossed=false, msg='Offer logged';
    if(out==='Accepted'){
      const hadHold=oppHoldState(o,x);
      crossed=otMove(o,'hold',{tl:2,next:{label:'Chase hold approval',due:'Today'}});
      if(u&&!hadHold&&typeof apFile==='function'){const r=apFile(o,u,'hold');x.hold={unit:u,state:'requested'};x.blocker=`Hold on ${u} — ${r.id} waiting in Approvals`;otLog(x,`Hold requested on ${u} · ${r.id}`);}
      if(un&&amt<un.price&&typeof apFile==='function'){const p=apFile(o,u,'price');Object.assign(p,{offer:amt,floor:Math.round(un.price*0.97/1000)*1000,note:`Accepted at ${fmtEur(amt)} on ${fmtEur(un.price)} list`});otLog(x,`Price exception sent to Approvals · ${p.id}`);}
      msg='Offer accepted · hold requested'+(un&&amt<un.price?' and price exception sent':'');
      if(o.stage!=='Negotiating'&&!EXIT_STAGES.includes(o.stage)) o.stage='Negotiating';
    }else{
      otMove(o,'negotiating',{tl:1});
      x.next={label:out==='Countered'?`Wait for ${otFirst(o)}’s reply to the counter`:out==='Rejected'?`Discuss alternatives with ${otFirst(o)}`:'Chase a decision on the offer',due:'In 2 days',overdue:false};
      msg=`Offer ${out.toLowerCase()} · round ${x.bids.length} logged`;
    }
    renderOpp(); if(typeof pipeRenderAll==='function') pipeRenderAll(); if(typeof apBadge==='function') apBadge();
    if(crossed&&typeof ojConfetti==='function') ojConfetti();
    showToast(msg);
  };
})();

// ---------- Hold · chase the approval ----------
function otHoldReq(o){return typeof APPROVALS==='undefined'?null:APPROVALS.find(r=>!r.decided&&r.opp===o.id&&r.type==='hold');}
function otHoldOpen(){
  const o=oppCur, x=getExt(o), r=otHoldReq(o), u=x.hold?.unit||o.units[0], mgr=typeof apCanDecide==='function'&&apCanDecide();
  const line=r&&typeof apLine==='function'?apLine(r):null;
  const body=r?`
    <div class="od-field"><label>Request</label><input value="${r.id} · hold ${xesc(r.unit)} · ${xesc(r.until||'')}" readonly></div>
    <div class="ll-mu">Filed ${xesc(r.filed)} by ${xesc(r.rep)} · ${line&&line.n>1?`${line.pos===1?'1st':line.pos+'th'} of ${line.n} on ${xesc(r.unit)}`:'only request on this unit'}</div>
    <div class="od-field"><label for="otNudge">Nudge to the manager</label><textarea id="otNudge" rows="3">Hi Rachel, ${otFirst(o)} has accepted on ${u}. Could you approve ${r.id} today so we can take the reservation?</textarea></div>`
    :`<div class="ll-mu">${x.blocker?xesc(x.blocker)+'. ':''}There’s no hold request for ${u||'this unit'} in Approvals yet.</div>
    <div class="ll-mu" style="margin-top:8px">Sending it puts ${u||'the unit'} in the manager’s queue with this opportunity attached.</div>`;
  const foot=r?`<button class="btn-ghost" onclick="qaDrawerClose();apSel='${r.id}';go('approvals');apRender()">Open in Approvals</button>${mgr?`<button class="btn-ghost" onclick="qaDrawerClose();apApprove('${r.id}')">Approve now</button>`:''}<button class="btn-primary" onclick="otHoldNudge('${r.id}')">Send nudge</button>`
    :`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" ${u?'':'disabled'} onclick="qaDrawerClose();oppHoldRequest()">Send to Approvals</button>`;
  qaDrawerOpen('Chase hold approval',body,foot);
}
function otHoldNudge(id){
  const o=oppCur, x=getExt(o), msg=document.getElementById('otNudge').value.trim();
  otLog(x,`Nudged the manager on ${id}${msg?' · “'+msg.slice(0,80)+(msg.length>80?'…':'')+'”':''}`);
  x.next={label:`Hold approval · ${id}`,due:'Today',overdue:false};
  otFinish('Nudge sent to the manager on WhatsApp');
}

// ---------- Reservation · collect the deposit ----------
function otDepositOpen(mode){
  const o=oppCur, x=getExt(o), first=otFirst(o), u=o.units[0];
  const amount=x.offer?.deposit||Math.round((o.value||0)*1000*0.1);
  const form=ensureDocs(o,x).find(d=>/reservation form/i.test(d.label));
  OT={mode:mode||'request',flow:'deposit'};
  let body=`<div class="od-field"><label>Deposit</label><input id="otDepAmt" type="number" min="0" step="100" value="${amount}"></div>
    <div class="ll-mu">${u?u+' · ':''}${x.offer?.plan?'plan '+x.offer.plan+' · ':''}reservation deposit</div>`+otSeg([['Send payment request','request'],['Record deposit received','received']],OT.mode,'otDepositOpen');
  if(OT.mode==='request') body+=`
    <div class="od-field"><label>Send via</label>${otChips('otCh',[['Email','em'],['WhatsApp','wa']],'em')}</div>
    <div class="od-field"><label for="otMsg">Message</label><textarea id="otMsg" rows="5">Hi ${first}, to reserve ${u||'your unit'} please transfer the deposit to:\nIBAN MT84 MALT 0110 0001 2345 MTLC AST0 01S\nReference ${(u||'RES').replace('#','')}-${o.id}\nThe reservation form is attached for signature.</textarea></div>`;
  else body+=`
    <div class="od-field"><label for="otDepDate">Date received</label><input id="otDepDate" type="date" value="${typeof dealToday==='function'?dealToday():''}"></div>
    <div class="od-field"><label>Method</label>${otChips('otDepM',[['Bank transfer','transfer'],['Cheque','cheque']],'transfer')}</div>
    <div class="od-field"><label for="otDepFile">Proof (optional)</label><input id="otDepFile" type="file" accept="application/pdf,image/png,image/jpeg,image/webp"></div>
    <label class="qa-check"><input type="checkbox" id="otFormSigned" ${form&&form.status==='signed'?'checked':''}> <span>Reservation form signed by ${first}</span></label>
    <div class="ll-mu">Reserves ${u||'the unit'} and moves on to KYC.</div>`;
  qaDrawerOpen(OT.mode==='request'?'Collect deposit':'Record deposit received',body,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="otDepositSave()">${OT.mode==='request'?'Send request':'Record deposit'}</button>`);
}
function otDepositSave(){
  const o=oppCur, x=getExt(o), first=otFirst(o), u=o.units[0], amt=+document.getElementById('otDepAmt').value;
  if(!(amt>0)){showToast('Enter the deposit amount');return;}
  if(OT.mode==='request'){
    const ch=otPicked('otCh','em'), text=document.getElementById('otMsg').value.trim();
    x.comms.unshift({ch,dir:'out',who:'You',t:'Just now',sub:ch==='em'?xesc(`Reservation deposit · ${u||o.devs[0]}`):undefined,text:xesc(text).replace(/\n/g,'<br>')});
    const crossed=otMove(o,'reservation',{tl:2,next:{label:`Deposit of ${fmtEur(amt)} due`,due:'In 3 days'}});
    otFinish(`Payment request sent to ${first}`,crossed);
    return;
  }
  if(!document.getElementById('otFormSigned').checked){showToast('Tick the signed reservation form, or send it first');return;}
  const docs=ensureDocs(o,x), f=document.getElementById('otDepFile').files[0];
  const form=docs.find(d=>/reservation form/i.test(d.label));
  if(form&&form.status!=='signed'){form.status='signed';form.hist.push({t:'Just now',who:first,act:'Signed'});}
  docs.push({id:crypto.randomUUID(),g:'Payments',label:'Deposit receipt',flow:'file',status:f?'filed':'required',file:f?{name:f.name,size:(f.size/1024).toFixed(0)+' KB',url:URL.createObjectURL(f)}:null,hist:[{t:'Just now',who:'You',act:f?'Filed':'Reported, receipt to follow'}]});
  x.offer={...(x.offer||{}),deposit:amt,depositPaid:true};
  if(u&&UN(u)&&['available','hold'].includes(UN(u).status)) UN(u).status='reserved';
  x.hold=u?{unit:u,state:'held'}:x.hold; x.blocker=null;
  otLog(x,`Deposit received · ${fmtEur(amt)}${f?'':' · receipt to follow'}${u?' · '+u+' reserved':''}`);
  const crossed=otMove(o,'kyc',{tl:2,next:{label:'Request outstanding docs',due:'This week'}});
  otDone(x,'Reservation form signed'); otDone(x,'Deposit received');
  otFinish(`Deposit recorded · ${u||'unit'} reserved`,crossed);
}

// ---------- KYC · request and verify documents ----------
function otKycOpen(){
  const o=oppCur, x=getExt(o), first=otFirst(o), docs=ensureDocs(o,x).filter(d=>d.g==='KYC');
  const st=d=>typeof DOC_STATUS!=='undefined'&&DOC_STATUS[d.status]?DOC_STATUS[d.status].label:d.status;
  qaDrawerOpen('KYC documents',`
    <div class="ot-kyc">${docs.map(d=>`<div class="ot-kyc-row"><label class="qa-check"><input type="checkbox" class="otKyc" value="${d.id}" ${d.status==='required'?'checked':''} ${d.status==='verified'?'disabled':''}> <span><b>${xesc(d.label)}</b><em>${xesc(st(d))}${d.file?' · '+xesc(d.file.name):''}</em></span></label>
      ${d.status==='required'?`<button type="button" class="btn-ghost ot-sm" onclick="otKycMark('${d.id}','received')">Mark received</button>`:d.status==='received'?`<button type="button" class="btn-primary ot-sm" onclick="otKycMark('${d.id}','verified')">Verify</button>`:'<span class="ll-mu">✓ Verified</span>'}</div>`).join('')}</div>
    <div class="od-field"><label>Send via</label>${otChips('otCh',[['WhatsApp','wa'],['Email','em']],'wa')}</div>
    <div class="od-field"><label for="otMsg">Message</label><textarea id="otMsg" rows="3">Hi ${first}, to prepare the promise of sale we still need the documents below. You can upload them securely here: bricly.link/kyc/${o.id.toLowerCase()}</textarea></div>
    <div class="ll-mu">No POS without complete KYC. Files are stored with restricted access.</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Close</button><button class="btn-primary" onclick="otKycSend()">Send request</button>`);
}
function otKycMark(id,status){
  const o=oppCur, x=getExt(o), d=ensureDocs(o,x).find(r=>r.id===id); if(!d) return;
  d.status=status; d.hist.push({t:'Just now',who:status==='verified'?'You':otFirst(o),act:status==='verified'?'Verified':'Received from client'});
  if(status==='received'&&!d.file) d.file={name:`${d.label.toLowerCase().replace(/[^a-z]+/g,'-')}.pdf`,size:'0.8 MB'};
  otLog(x,`${d.label} ${status==='verified'?'verified':'received'}`);
  if(!otKycMissing(o,x).length){otDone(x,'Passport / ID');otDone(x,'Proof of address');otDone(x,'Source of funds');x.next={label:'Book POS signing',due:'This week',overdue:false};renderOpp();qaDrawerClose();showToast('KYC complete · book the POS signing');return;}
  renderOpp(); otKycOpen();
}
function otKycSend(){
  const o=oppCur, x=getExt(o), ids=[...document.querySelectorAll('.otKyc:checked')].map(i=>i.value), ch=otPicked('otCh','wa');
  if(!ids.length){showToast('Pick at least one document');return;}
  const docs=ensureDocs(o,x).filter(d=>ids.includes(d.id));
  docs.forEach(d=>d.hist.push({t:'Just now',who:'You',act:'Requested'}));
  x.comms.unshift({ch,dir:'out',who:'You',t:'Just now',text:xesc(document.getElementById('otMsg').value.trim()+' Needed: '+docs.map(d=>d.label).join(', ')+'.')});
  x.next={label:`KYC from ${otFirst(o)} · ${docs.length} document${docs.length===1?'':'s'}`,due:'In 3 days',overdue:false};
  otFinish(`Requested ${docs.length} document${docs.length===1?'':'s'} from ${otFirst(o)}`);
}
