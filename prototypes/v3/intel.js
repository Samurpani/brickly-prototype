// Matching (Bricly Matching · flows 2 and 4) and meeting / message intelligence (Bricly Message Intelligence · flows 1–3).
// Every number shown is computed from the unit and opportunity records; nothing is invented.
const IN_K=n=>'€'+Math.round(n/1000)+'k';
const IN_RQ={Ready:0,'Q4 2026':1,'Q1 2027':2,'Q2 2027':3,'Q3 2027':4,'Q4 2027':5};
const IN_OBJ_CATS=['Price','Payment plan','Size and layout','View and light','Completion timing','Location','Parking','Finance','Finishes and spec','Other'];
// ---------- Buyer profile and fit (Flow 2) ----------
function inProfile(o){
  const units=o.units.map(UN).filter(Boolean), u0=units[0];
  const budget=o.budget!=null?o.budget*1000:null;
  const p={budget,beds:u0?u0.beds:null,outdoor:units.some(u=>u.ext>=8)||buyerTypeFor(o)==='Second home',devs:o.devs.slice(),shortlist:o.units.slice()};
  p.facts=[budget!=null,p.beds!=null,p.outdoor,o.devs.length>0,o.units.length>0,!!getExt(o).offer].filter(Boolean).length;
  p.thin=budget==null||p.beds==null;
  if(p.thin&&budget!=null) p.band=[budget*0.85,budget*1.15];
  return p;
}
function inScore(u,o,p){
  const ch=[], add=(t,bad)=>ch.push({t,bad:!!bad}), first=o.lead.split(' ')[0];
  if(u.status!=='available'){add(`${UN_STATUS[u.status]?.l||u.status}, can’t be offered`,true);return {s:-99,ch,ok:false};}
  let s=0;
  if(p.thin){
    if(p.band){const inB=u.price>=p.band[0]&&u.price<=p.band[1];if(inB){s+=3;add(`In ${first}’s ${IN_K(p.band[0])}–${IN_K(p.band[1]).slice(1)} band`);}else add(`Outside ${first}’s band`,true);}
    if(p.devs.includes(u.dev)){s+=2;add(u.dev);}
    return {s,ch,ok:true};
  }
  const over=u.price-p.budget;
  if(over<=0){s+=3;add(over===0?'At budget':`${IN_K(-over)} under budget`);}else{s+=over<=p.budget*0.05?1:-3;add(`${IN_K(over)} over budget`,true);}
  if(u.beds===p.beds){s+=2;add(`${u.beds===0?'Studio':u.beds+' bed'}, as asked`);}else{s-=2;add(`${u.beds} bed, asked for ${p.beds}`,true);}
  if(p.outdoor){if(u.ext>=20){s+=2;add(`${u.ext} m² outdoor`);}else if(u.ext>=8){s+=1;add(`${u.ext} m² terrace`);}else add(u.ext?`${u.ext} m² balcony only`:'No outdoor space',true);}
  if(p.devs.includes(u.dev)){s+=1;add(`In ${u.dev}, which ${first} asked about`);}
  if(u.ready==='Ready'){s+=1;add('Ready now');}
  if(p.shortlist.includes(u.id)){s+=1;add(`On ${first}’s shortlist`);}
  return {s,ch,ok:true};
}
function inFit(s,thin){return thin?(s>=5?'In band, area':s>=3?'In band':'—'):s>=7?'Strong fit':s>=5?'Good fit':s>=2?'Partial fit':s>-99?'Weak fit':'Not available';}
function inRanked(o){const p=inProfile(o);return UNITS.map(u=>({u,...inScore(u,o,p)})).sort((a,b)=>b.s-a.s||a.u.price-b.u.price);}
let inBuyer=null;
const inUnFilteredBase=unFiltered;
unFiltered=function(){
  const list=inUnFilteredBase(); if(!inBuyer) return list;
  const o=OPPS.find(x=>x.id===inBuyer); if(!o){inBuyer=null;return list;}
  const p=inProfile(o), sc=new Map(list.map(u=>[u.id,inScore(u,o,p).s]));
  return list.slice().sort((a,b)=>sc.get(b.id)-sc.get(a.id)||a.price-b.price);
};
const inRenderUnitsBase=renderUnits;
renderUnits=function(){
  inRenderUnitsBase();
  const bar=document.querySelector('#p-properties .crm-page-controls > .toolbar');
  if(bar&&!document.getElementById('in-buyer-btn')) bar.insertAdjacentHTML('afterbegin',`<button class="btn-ghost" id="in-buyer-btn" onclick="inPickOpen()">Sort for a buyer…</button>`);
  let banner=document.getElementById('in-buyer-bar');
  const o=inBuyer&&OPPS.find(x=>x.id===inBuyer);
  if(!o){banner&&banner.remove();return;}
  const p=inProfile(o), rank=new Map(); let r=0;
  unFiltered().forEach(u=>{const sc=inScore(u,o,p);if(sc.ok)rank.set(u.id,++r);});
  const chips=[p.budget!=null?`Budget ${IN_K(p.budget)}`:null,p.beds!=null?`${p.beds} bed`:null,p.outdoor?'Wants outdoor space':null,p.devs.length?p.devs.join(', '):null,o.units.length?`${o.units.length} on shortlist`:null].filter(Boolean);
  if(!banner){banner=document.createElement('div');banner.id='in-buyer-bar';document.getElementById('un-rows').closest('table').before(banner);}
  banner.className='in-buyer-bar';
  banner.innerHTML=`<span>Sorted for <b>${xesc(o.lead)}</b> · ${o.id}</span>${chips.map(c=>`<span class="in-chip">${xesc(c)}</span>`).join('')}<button class="tq-link" onclick="openOpp('${o.id}')">Open opportunity</button><button class="tq-link" onclick="inBuyer=null;renderUnits()">Clear</button>
    ${p.thin?`<div class="in-thin">${xesc(o.lead.split(' ')[0])} has ${p.facts} fact${p.facts===1?'':'s'}. Units in ${p.band?'the budget band and ':''}the developments asked about come first, and nothing else is ranked. Add bedrooms and budget to the opportunity to rank properly.</div>`:'<div class="in-mu">Reasons are computed from each unit’s record. Units that can’t be offered go last.</div>'}`;
  document.querySelectorAll('#un-rows > tr').forEach(tr=>{
    const m=String(tr.getAttribute('onclick')||'').match(/openUnPeek\('([^']+)'\)/); if(!m) return;
    const u=UN(m[1]), sc=inScore(u,o,p), fit=inFit(sc.s,p.thin);
    tr.classList.add('in-ranked');
    tr.insertAdjacentHTML('afterend',`<tr class="in-fitrow"><td></td><td colspan="12"><div class="in-fitwrap"><span class="in-fit ${sc.s>=5?'good':sc.s>=2?'mid':''}">${fit}</span>${rank.has(u.id)?`<span class="in-mu">#${rank.get(u.id)} for ${xesc(o.lead.split(' ')[0])}</span>`:''}${sc.ch.map(c=>`<span class="in-reason ${c.bad?'bad':''}">${xesc(c.t)}</span>`).join('')}</div></td></tr>`);
  });
};
function inPickOpen(){
  const opps=OPPS.filter(o=>!EXIT_STAGES.includes(o.stage)&&!dealFor(o.id)&&o.rep!=='Unassigned').sort((a,b)=>a.lead.localeCompare(b.lead));
  qaDrawerOpen('Sort for a buyer',`<div class="in-mu" style="margin-bottom:10px">Units are re-ordered by the facts on the buyer’s opportunity. Every reason comes from the unit record.</div>
    <div class="in-picks">${opps.map(o=>{const p=inProfile(o);return `<button type="button" class="in-pick" onclick="inSortFor('${o.id}')"><span class="auv-col"><b>${xesc(o.lead)}</b><span class="in-mu">${o.id} · ${xesc(o.stage)} · ${xesc(o.devs.join(', '))}</span></span><span class="${p.thin?'in-warn':'in-mu'}">${p.facts} fact${p.facts===1?'':'s'}${p.thin?' · thin':''}</span></button>`;}).join('')}</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button>`);
}
function inSortFor(id){qaDrawerClose();inBuyer=id;if(!document.getElementById('p-properties').classList.contains('on'))go('properties');else renderUnits();document.getElementById('content').scrollTop=0;}
// ---------- Pre-meeting brief (Flow 4) ----------
function inMeeting(o,x){
  if(x.appts&&x.appts.length) return {title:`${x.appts[0].label} with ${o.lead}`,when:x.appts[0].when};
  if(o.appt) return {title:`${o.appt.kind==='signing'?'Signing':'Viewing'} with ${o.lead}`,when:o.appt.dateISO?`${o.appt.dateISO} ${o.appt.start||''}`:o.appt.at||''};
  if(/Appointment Booked|Contract Booked/.test(o.stage)) return {title:`${o.stage==='Contract Booked'?'POS signing':'Viewing'} with ${o.lead}`,when:o.next&&o.next.d!=='—'?o.next.d:'Upcoming'};
  return null;
}
function inBriefCard(o,x){
  const m=inMeeting(o,x); if(!m||isCompleted(o)) return '';
  return `<div class="dcard in-brief-card"><div class="row-between rail-h"><div class="side-h">Pre-meeting brief</div><span class="in-mu">Only you</span></div>
    <div><b>${xesc(m.title)}</b></div><div class="in-mu">${xesc(m.when)} · prepared an hour before</div>
    <button class="btn-primary" style="margin-top:10px" onclick="inBriefOpen()">Open brief</button></div>`;
}
function inBriefOpen(){
  const o=oppCur, x=getExt(o), p=inProfile(o), m=inMeeting(o,x)||{title:`Meeting with ${o.lead}`,when:''}, first=o.lead.split(' ')[0];
  const top=inRanked(o).filter(r=>r.ok).slice(0,p.thin?2:3).filter(r=>!p.thin||r.s>=3);
  const u0=o.units.map(UN).filter(Boolean)[0];
  const facts=[
    p.budget!=null?['Budget',`Up to ${IN_K(p.budget)}`,x.budgetFixed?'Corrected by you · just now':`Opportunity · ${o.source}`,'budget']:null,
    p.beds!=null?['Bedrooms',`${p.beds===0?'Studio':p.beds+' bedrooms'}`,`Linked unit ${u0.id}`]:null,
    p.outdoor?['Outdoor space','Wants somewhere to sit outside',u0&&u0.ext>=8?`Shortlisted ${u0.id} has ${u0.ext} m²`:'Buyer type']:null,
    ['Interest',o.units.length?`${o.units.join(', ')} · ${o.devs.join(', ')}`:o.devs.join(', '),'Opportunity'],
    x.offer?['Offer',`${fmtEur(x.offer.amt)} · ${x.offer.status}`,'Offer log']:null,
    ['Buyer type',buyerTypeFor(o),'Opportunity'],
  ].filter(Boolean);
  const t=top[0]&&top[0].u, diff=t&&p.budget!=null?p.budget-t.price:null;
  const lead=p.thin?[`Ask before you show anything. ${p.beds==null?'Bedrooms, ':''}timing and how ${first} is paying are unknown.`,top.length?`If ${first} wants options, ${top.map(r=>r.u.id).join(' and ')} fit what’s known.`:`Nothing on record narrows the units yet.`]
    :[t?`Open on ${t.id}. At ${IN_K(t.price)} it ${diff===0?'sits exactly at':diff>0?`is ${IN_K(diff)} under`:`is ${IN_K(-diff)} over`} the ${IN_K(p.budget)} budget${t.ext>=8&&p.outdoor?`, and its ${t.ext} m² outdoor space answers what ${first} asked for`:''}.`:'No available unit fits yet.',t?`${t.dev} is ${t.ready==='Ready'?'ready now':'ready '+t.ready}.`:'',`Walk the layout room by room. ${first} has ${o.units.length} unit${o.units.length===1?'':'s'} on the shortlist.`].filter(Boolean);
  const open=[!x.offer&&!(x.buyer&&x.buyer.finance)?[`How is ${first} paying, and is there a bank letter?`,'No finance on record.']:null,[`When does ${first} need to move or complete?`,'No timing on record.'],['Is anyone else part of the decision?','Nobody else is mentioned on the record.'],['Does the buyer need parking?','Not discussed.']].filter(Boolean);
  const strategy=t?[`Show ${t.id} first.`,top[1]?`If ${first} wants an alternative, ${top[1].u.id} is ${IN_K(Math.abs(top[1].u.price-t.price))} ${top[1].u.price<t.price?'less':'more'} with ${top[1].u.ext} m² outdoor.`:null,`Bring up the payment plan once ${first} is interested.`,`Close on a next step: a hold on ${t.id} while finance is confirmed.`].filter(Boolean):['Treat this as a discovery conversation. Listen more than you pitch.','Log what you learn as facts on the opportunity so the next brief and the unit sort have something to work with.'];
  qaDrawerOpen('Pre-meeting brief',`<div class="in-mu">Only you can see this · prepared automatically an hour before · from ${p.facts} fact${p.facts===1?'':'s'}</div><h3 class="in-h">${xesc(m.title)}</h3><div class="in-mu">${xesc(m.when)}</div>
    ${p.thin?`<div class="in-thin">Little is known about ${xesc(first)} yet, so this brief is mostly questions.</div>`:''}
    ${x.budgetFixed?`<div class="in-okbar">Updated from your correction. The budget is now ${IN_K(p.budget)}, and the units and lead-with points use it.</div>`:''}
    <div class="in-sec"><b>What’s known</b>${facts.map(([k,v,src,key])=>`<div class="in-fact"><span class="in-mu">${k}</span><span class="auv-col"><span>${key==='budget'?`<span id="in-budget-v">${xesc(v)}</span> <button class="tq-link" onclick="inBudgetEdit()">Correct</button>`:xesc(v)}</span><span class="in-mu">${xesc(src)}</span></span></div>`).join('')}</div>
    <div class="in-sec"><b>What to lead with</b><ul>${lead.map(l=>`<li>${xesc(l)}</li>`).join('')}</ul></div>
    <div class="in-sec"><b>Units to show</b>${top.map((r,i)=>`<div class="in-unit"><div class="row-between"><span><b>${i+1} · ${r.u.id}</b> · ${r.u.dev}</span><span>${IN_K(r.u.price)}</span></div><div class="in-mu">${r.u.type} · ${r.u.beds} bed · ${r.u.sqm} m²${r.u.ext?' + '+r.u.ext+' m² outdoor':''} · Floor ${r.u.floor===0?'G':r.u.floor} · Ready ${r.u.ready}</div><div>${r.ch.map(c=>`<span class="in-reason ${c.bad?'bad':''}">${xesc(c.t)}</span>`).join('')}</div></div>`).join('')||'<div class="in-mu">No available units fit what’s known.</div>'}<button class="tq-link" onclick="qaDrawerClose();inSortFor('${o.id}')">See all units sorted for ${xesc(first)} →</button></div>
    <div class="in-sec"><b>What’s unresolved</b> <span class="in-mu">Ask about these</span>${open.map(([q,w])=>`<div class="in-q"><span>${xesc(q)}</span><span class="in-mu">${xesc(w)}</span></div>`).join('')}</div>
    <div class="in-sec"><b>Selling strategy</b><ul>${strategy.map(l=>`<li>${xesc(l)}</li>`).join('')}</ul></div>`,
    `<button class="btn-primary" onclick="qaDrawerClose()">Done</button>`);
}
function inBudgetEdit(){
  const el=document.getElementById('in-budget-v');
  el.innerHTML=`<input id="in-budget-in" type="number" step="5000" value="${oppCur.budget*1000}" style="width:120px"> <button class="btn-primary" style="min-height:24px;padding:2px 8px" onclick="inBudgetSave()">Save</button>`;
  document.getElementById('in-budget-in').focus();
}
function inBudgetSave(){
  const v=+document.getElementById('in-budget-in').value; if(!v){showToast('Enter the budget');return;}
  const o=oppCur,x=getExt(o),was=o.budget; o.budget=Math.round(v/1000); x.budgetFixed=true;
  x.comms.unshift({ch:'sys',t:'Just now',text:`Budget corrected €${was}k → €${o.budget}k from the pre-meeting brief`});
  inBriefOpen(); renderOpp();
}
// Meeting recording → proposals (flow 1) lives on the appointment page: see meet-intel.js.
// ---------- Inbound buyer message (flow 2) · Daniel Vella ----------
// One message carries every variant: two files Bricly recognises, one it can't (B3, 2c), and a question the records
// can't answer (2b). The draft only uses numbers from listed records; the gap is left out and said so.
const IN_MSG_OPP='OPP-1004';
const IN_MSG_FOLDERS=[['Finance','Bank or income document'],['KYC','Identity or address'],['Signed form','Reservation, POS'],['none','Don’t file · kept on the message only']];
function inMsgSeed(o,x){
  if(o.id!==IN_MSG_OPP||x.inMsg) return;
  x.inMsg={state:'read',props:{B1:'prop',B2:'prop'},folder:null,b3:'need',gap:'open',answer:'',text:`Hi Daniel, thanks, I’ve received the offer letter and your ID.\n\nParking isn’t included with 2702. Garage spaces at Mercury are sold separately at €18,000, and two are still available on level -1.\n\nAfter the promise of sale, the next payment is 20% (€69,000) when the shell is finished, planned for March 2027. I’ll send the full schedule with the POS draft.`};
  x.comms.unshift({ch:'wa',dir:'in',intel:'inMsg',who:'Daniel Vella',t:'Today 11:02',text:'Hi, attached the bank’s offer letter and my ID. Is a parking space included with 2702? When is the next payment due after the promise of sale? And can we move in before the pool is finished?',sub:'📎 HSBC_offer_letter.pdf · 📎 IMG_4410.jpg · 📎 scan_0921.pdf'});
}
function inMsgProps(){
  return [['B1','File document','Bank offer letter → Documents · Finance',[['Lender','HSBC Malta'],['Loan amount','€292,000'],['Valid until','Mon 30 Nov 2026']],'From HSBC_offer_letter.pdf, page 1','Finance moves from In progress to Approved, and the “Needs finance” blocker clears.'],
    ['B2','File document','ID card → Documents · KYC',[['Name','Daniel Vella · matches the contact'],['Expires','Fri 14 Mar 2031']],'From IMG_4410.jpg · stored with restricted access','']];
}
function inMsgHtml(o,x){
  inMsgSeed(o,x); const m=x.inMsg; if(!m) return '';
  if(m.state==='done') return `<div class="dcard in-msg done" id="in-msg"><div class="ll-dh"><span class="ll-ai">✦</span><b>Daniel’s message</b><span class="ll-mu">Today 11:02</span><span class="ll-st t-ok">Approved and sent</span></div>
    <div class="chd-fields">${m.done.map(([k,v])=>`<div><span class="chd-mu">${k}</span><span>${xesc(v)}</span></div>`).join('')}</div></div>`;
  const P=inMsgProps(), B=(l,fn,p,dis)=>`<button class="${p?'btn-primary':'btn-ghost'} chd-b" ${dis?'disabled':''} onclick="${fn}">${l}</button>`;
  const b3=m.b3==='need'?`<div class="chd-card in-pc need"><div class="chd-ch"><span class="chd-ref">B3</span><span class="chd-verb">File document</span><b>What is scan_0921.pdf?</b><span class="chd-chip t-warn">Needs you</span></div>
      <div class="chd-warn">It isn’t a bank letter, ID or signed form Bricly recognises. It stays unfiled until you choose. The other proposals can still be approved.</div>
      <div class="in-opts">${IN_MSG_FOLDERS.map(([k,s])=>`<button type="button" class="${m.folder===k?'on':''}" onclick="inMsgFolder('${k}')"><b>${k==='none'?'Don’t file':k}</b><span class="in-mu">${s}</span></button>`).join('')}</div>
      <div class="chd-cf"><span class="chd-mu">One page, mostly handwriting</span><span class="chd-row">${B('Confirm','inMsgB3()',1,!m.folder)}</span></div></div>`
    :`<div class="chd-card"><div class="chd-ch"><span class="chd-ref">B3</span><span class="chd-verb">File document</span><b>scan_0921.pdf → ${m.folder==='none'?'kept on the message':'Documents · '+m.folder}</b><span class="chd-chip t-ok">Decided</span></div><div class="chd-cf"><span class="chd-mu">Chosen by you</span><span class="chd-row">${B('Undo','inMsgFolder(null,1)')}</span></div></div>`;
  const gap=m.gap==='open'?`<div class="chd-warn">Not in the records: whether buyers can move in before the pool is finished. The draft doesn’t answer it. Add the answer, or ask Operations and the reply waits.<div class="chd-row" style="margin-top:8px">${B('Ask Operations','inMsgGap(\'ask\')')}${B('Add the answer','inMsgGap(\'add\')',1)}</div></div>`
    :m.gap==='add'?`<div class="chd-warn">Add the answer. It’s saved as a fact on Mercury and used from now on.<input class="mi-in" id="in-gap" style="margin-top:6px" placeholder="e.g. Yes, the pool is finished before handover in Q2 2027"><div class="chd-row" style="margin-top:8px">${B('Cancel','inMsgGap(\'open\')')}${B('Save fact','inMsgGapSave()',1)}</div></div>`
    :m.gap==='asked'?`<div class="chd-effect">Asked Operations about moving in before the pool is finished · task created. The reply waits until they answer.</div>`
    :`<div class="chd-effect">Fact saved on Mercury · “${xesc(m.answer)}” · added to the draft.</div>`;
  return `<div class="dcard in-msg" id="in-msg"><div class="ll-dh"><span class="ll-ai">✦</span><b>Bricly read Daniel’s message</b><span class="ll-mu">WhatsApp · today 11:02 · 3 attachments, 3 questions · 1 credit</span><span class="ll-st t-info">Proposed</span></div>
    <div class="chd-fields"><div><span class="chd-mu">Sent</span><span>Bank offer letter, ID card and one file Bricly can’t identify</span></div><div><span class="chd-mu">Asks</span><span>Is parking included with #CM2702? When is the next payment after POS? Can they move in before the pool is finished?</span></div></div>
    ${P.map(([id,verb,title,fields,src,eff])=>{const s=m.props[id];return `<div class="chd-card"><div class="chd-ch"><span class="chd-ref">${id}</span><span class="chd-verb">${verb}</span><b>${title}</b><span class="chd-chip t-${s==='ok'?'ok':s==='skip'?'':'info'}">${{prop:'Proposed',ok:'Approved',skip:'Skipped'}[s]}</span></div><div class="chd-fields">${fields.map(([k,v])=>`<div><span class="chd-mu">${k}</span><span>${v}</span></div>`).join('')}</div>${eff?`<div class="chd-effect">${eff}</div>`:''}<div class="chd-cf"><span class="chd-mu">${src}</span><span class="chd-row">${s==='prop'?`${B('Skip',`inMsgSet('${id}','skip')`)}${B('Approve',`inMsgSet('${id}','ok')`,1)}`:B('Undo',`inMsgSet('${id}','prop')`)}</span></div></div>`;}).join('')}
    ${b3}
    <div class="chd-card"><div class="chd-ch"><span class="chd-ref">B4</span><span class="chd-verb">Reply</span><b>Draft reply to Daniel</b><span class="chd-chip t-${m.gap==='asked'?'warn':'info'}">${m.gap==='asked'?'Waits for Operations':'Proposed'}</span></div><textarea id="in-msg-text" class="ll-text" rows="7" aria-label="Reply to Daniel" style="border:0;border-radius:0" oninput="getExt(oppCur).inMsg.text=this.value">${xesc(m.text)}</textarea>
      ${gap}
      <div class="chd-effect">Every number comes from a record: Mercury price list (garage €18,000 · 2 available) · Payment plan #CM2702 (10% on POS, 20% at shell) · #CM2702 price €345,000 · Construction programme (shell March 2027).</div></div>
    <div class="ll-acts"><button class="btn-primary" onclick="inMsgSend()">${m.gap==='asked'?'Approve and file · reply waits':'Approve all and send'}</button><span class="ll-mu">Nothing is filed or sent until you approve</span></div></div>`;
}
function inMsgSet(id,v){getExt(oppCur).inMsg.props[id]=v;renderOpp();}
function inMsgFolder(k,undo){const m=getExt(oppCur).inMsg;m.folder=k;if(undo)m.b3='need';renderOpp();}
function inMsgB3(){const m=getExt(oppCur).inMsg;if(!m.folder)return;m.b3='done';renderOpp();showToast(m.folder==='none'?'scan_0921.pdf stays on the message':'scan_0921.pdf will be filed under '+m.folder);}
function inMsgGap(v){
  const o=oppCur,x=getExt(o),m=x.inMsg;
  if(v==='ask'){m.gap='asked';x.comms.unshift({ch:'sys',t:'Just now',text:'Asked Operations: can Mercury buyers move in before the pool is finished? · from Daniel’s message'});
    if(typeof TQ!=='undefined'){tqInit();TQ.unshift({id:'n'+Date.now(),title:'Operations: can Mercury buyers move in before the pool is finished?',rec:o.id,due:cvISO(cvAddDays(cvToday(),1)),time:null,owner:tqMe(),agent:false,source:'from_signal',status:'open',createdBy:'agent',remind:'',fresh:true});tqBadge();}
    showToast('Asked Operations · task created');}
  else m.gap=v;
  renderOpp(); if(v==='add') setTimeout(()=>document.getElementById('in-gap')?.focus(),30);
}
function inMsgGapSave(){
  const o=oppCur,x=getExt(o),m=x.inMsg,v=document.getElementById('in-gap').value.trim(); if(!v){showToast('Type the answer first');return;}
  m.answer=v; m.gap='answered'; m.text=m.text.replace(/\n\nI’ll send the full schedule/,`\n\nOn the pool: ${v}\n\nI’ll send the full schedule`);
  if(!m.text.includes(v)) m.text+=`\n\nOn the pool: ${v}`;
  x.comms.unshift({ch:'sys',t:'Just now',text:`Fact saved on Mercury · “${v}” · added by ${MI_ME}`});
  renderOpp(); showToast('Fact saved on Mercury and added to the draft');
}
function inMsgSend(){
  const o=oppCur,x=getExt(o),m=x.inMsg,text=(document.getElementById('in-msg-text')?.value||m.text).trim();
  ['B1','B2'].forEach(id=>{if(m.props[id]==='prop')m.props[id]='ok';});
  const ds=ensureDocs(o,x), done=[];
  if(m.props.B2==='ok'){const idDoc=ds.find(d=>/Passport|ID/.test(d.label));if(idDoc){idDoc.status='received';idDoc.file={name:'IMG_4410.jpg',size:'1.1 MB'};idDoc.hist.push({t:'Just now',who:'Daniel Vella',act:'Received from client'});}done.push('ID card · KYC, restricted');}
  if(m.props.B1==='ok'){ds.push({id:'dfin',g:'KYC',label:'Bank offer letter · HSBC',flow:'file',status:'filed',file:{name:'HSBC_offer_letter.pdf',size:'0.4 MB'},hist:[{t:'Just now',who:'You',act:'Filed'}]});x.buyer=x.buyer||{};x.buyer.finance='Approved · €292,000 · HSBC Malta';if(x.blocker&&/financ/i.test(x.blocker))x.blocker=null;done.push('Bank offer letter · Finance');}
  if(m.b3==='done'&&m.folder&&m.folder!=='none'){ds.push({id:'dscan',g:'KYC',label:`scan_0921.pdf · ${m.folder}`,flow:'file',status:'filed',file:{name:'scan_0921.pdf',size:'0.2 MB'},hist:[{t:'Just now',who:'You',act:'Filed'}]});done.push(`scan_0921.pdf · ${m.folder}`);}
  const waits=m.gap==='asked';
  if(!waits) x.comms.unshift({ch:'wa',dir:'out',who:'You',t:'Just now',text});
  m.done=[['Filed',done.join(' · ')||'Nothing filed'],['Unfiled',m.b3==='done'&&m.folder==='none'||m.b3!=='done'?'scan_0921.pdf · kept on the message':'None'],['Finance',m.props.B1==='ok'?'Approved · €292,000 · HSBC Malta · blocker cleared':'Unchanged'],['Reply',waits?'Waiting for Operations to answer the pool question':`Sent on WhatsApp at ${miNowHm()}, as you approved it${m.gap==='answered'?' · includes the pool answer':''}`],['Next action','Send the POS draft']];
  x.next={label:'Send the POS draft',due:'Due Mon 5 Oct',overdue:false};
  m.state='done'; renderOpp(); showToast(waits?`Filed ${done.length} document${done.length===1?'':'s'} · the reply waits for Operations`:`Filed ${done.length} document${done.length===1?'':'s'} and sent the reply to Daniel`);
}
// ---------- Objections (flow 3) ----------
// One fixed category list on every development so clusters compare. Each objection keeps the buyer's words and its source.
const IN_SEED_OBJ={'Maria Borg':[{cat:'Price',q:'“The penthouse is more than we planned.”',src:'WhatsApp · Thu 24 Sep · answered by the budget update',open:false}]};
let inObjMenu=null;
function inObjHtml(o,x){
  if(!x.objections&&IN_SEED_OBJ[o.lead]) x.objections=IN_SEED_OBJ[o.lead].map(v=>({...v}));
  const l=x.objections||[]; if(!l.length) return '';
  const open=l.filter(v=>v.open).length, dev=DEVS.find(d=>d.name===o.devs[0]), mgr=curPersona==='owner'||curPersona==='manager';
  return `<div class="dcard" id="opp-obj-card"><div class="row-between rail-h"><div class="side-h">Objections</div><span class="in-mu">${open} open · ${l.length-open} answered</span></div>
    ${l.map((v,i)=>`<div class="in-obj"><div class="row-between"><b class="in-objc">${xesc(v.cat)}</b><span class="chd-row"><button type="button" class="chd-chip t-${v.open?'warn':'ok'}" style="border:0;cursor:pointer" title="Mark as ${v.open?'answered':'open'}" onclick="inObjToggle(${i})">${v.open?'Open':'Answered'}</button><button type="button" class="in-objm" aria-label="Change category" aria-expanded="${inObjMenu===i}" onclick="inObjMenu=inObjMenu===${i}?null:${i};renderOpp()">⋯</button></span></div>
      ${inObjMenu===i?`<div class="in-objmenu" role="menu"><div class="in-mu">Change the category · same list on every development</div>${IN_OBJ_CATS.map(c=>`<button type="button" role="menuitem" class="${c===v.cat?'on':''}" onclick="inObjCat(${i},'${c}')"><span>${c}</span>${c===v.cat?'✓':''}</button>`).join('')}</div>`:''}
      <div>${xesc(v.q)}</div><div class="in-mu">${v.apptId?`<button type="button" class="mi-src" onclick="miOpen('${v.oppId}','${v.apptId}','trans','${v.ts}')">${xesc(v.src)}</button>`:xesc(v.src)}</div></div>`).join('')}
    ${mgr&&dev?`<div class="rail-note"><button type="button" class="rail-link" onclick="openDev('${dev.id}');dvSetTab('objections')">See ${xesc(dev.name)} objections across buyers ›</button></div>`:''}</div>`;
}
function inObjCat(i,c){const x=getExt(oppCur),was=x.objections[i].cat;inObjMenu=null;x.objections[i].cat=c;if(was!==c)x.comms.unshift({ch:'sys',t:'Just now',text:`Objection recategorised: ${was} → ${c} · recounted on the development`});renderOpp();showToast('Category changed to '+c);}
function inObjToggle(i){const x=getExt(oppCur);x.objections[i].open=!x.objections[i].open;renderOpp();}
// Onyx Rise clusters: [category, name, units, mentions, opportunities, lost after, last, vs previous 90 days, mentions in the last 30 days, Sam's mentions]
let IN_CLUSTERS=[['Payment plan','30% on signing is too high','Penthouses · 2-beds',14,9,3,'Today','↑ from 4',8,5],['Size and layout','Second bedroom feels small','2-beds, floors 5 to 7',9,7,1,'Today','↑ from 6',4,3],['Price','Penthouse above budget','Penthouses',8,6,2,'Mon 28 Sep','same',3,2],['Completion timing','Needs to move in before Q2 2027','All types',6,5,1,'Thu 1 Oct','↓ from 8',2,2],['Parking','No parking space included','2-beds and 3-beds',5,5,0,'Wed 30 Sep','same',2,1],['Payment plan','Deposit too high to reserve','2-beds',4,3,1,'Fri 25 Sep','new',3,1],['View and light','Lower floors are overlooked','Floors 1 to 3',3,3,0,'Tue 22 Sep','same',1,0]];
const IN_QUOTES=[['“Thirty percent on signing is too much for us right now.”','Maria Borg · viewing · Thu 1 Oct · Sam','OPP-1008'],['“Can the 30% be split over the first year?”','Ben Zammit · WhatsApp · Mon 28 Sep · Karl Zammit'],['“We’d have to sell our flat first to find 30%.”','Clara Spiteri · call · Tue 22 Sep · Sam'],['“Mercury only asks 10% on the promise of sale.”','Joseph Grech · viewing · Fri 18 Sep · Matthew Vella']];
let IN_OBJF={period:'90',rep:'all',type:'all'}, IN_MERGE='suggest';
function inObjRows(d){
  if(d.name!=='Onyx Rise'){
    const live=OPPS.filter(o=>o.devs.includes(d.name)).flatMap(o=>(getExt(o).objections||[]).map(v=>({...v,o})));
    return Object.entries(live.reduce((m,v)=>{(m[v.cat]=m[v.cat]||[]).push(v);return m;},{})).map(([c,l])=>[c,l[0].q.replace(/[“”]/g,''),'—',l.length,new Set(l.map(v=>v.o.id)).size,0,'Today','new',l.length,l.length]);
  }
  const t={pent:/Penthouse/i,two:/2-bed/i,three:/3-bed|All types/i}[IN_OBJF.type];
  return IN_CLUSTERS.map((r,i)=>({r,i})).filter(({r})=>!t||t.test(r[2])||r[2]==='All types')
    .map(({r,i})=>{const n=IN_OBJF.rep==='sam'?r[9]:IN_OBJF.period==='30'?r[8]:r[3];return {r:[r[0],r[1],r[2],n,Math.min(r[4],n),Math.min(r[5],n),r[6],IN_OBJF.period==='90'&&IN_OBJF.rep==='all'?r[7]:'—'],i};})
    .filter(({r})=>r[3]>0).sort((p,q)=>q.r[3]-p.r[3]);
}
function inDevObjHtml(d){
  const onyx=d.name==='Onyx Rise', rows=onyx?inObjRows(d):inObjRows(d).map((r,i)=>({r,i})), max=Math.max(1,...rows.map(v=>v.r[3]));
  const sel=(k,opts)=>`<select class="in-cat" aria-label="${k}" onchange="IN_OBJF.${k}=this.value;renderDev()">${opts.map(([v,l])=>`<option value="${v}" ${IN_OBJF[k]===v?'selected':''}>${l}</option>`).join('')}</select>`;
  const pi=IN_CLUSTERS.findIndex(r=>r[1]==='30% on signing is too high'), di=IN_CLUSTERS.findIndex(r=>r[1]==='Deposit too high to reserve');
  return `<div class="row-between" style="margin-bottom:12px;gap:12px;flex-wrap:wrap"><div class="in-mu">Clustered from objections approved in meetings and messages. Categories are the same on every development so the clusters compare.</div>
    ${onyx?`<span class="chd-row">${sel('period',[['90','Last 90 days'],['30','Last 30 days']])}${sel('rep',[['all','All reps'],['sam','Sam']])}${sel('type',[['all','All unit types'],['pent','Penthouses'],['two','2-beds'],['three','3-beds']])}</span>`:''}</div>
    ${onyx&&IN_MERGE==='suggest'&&pi>=0&&di>=0?`<div class="mi-ban t-warn"><span>“${IN_CLUSTERS[pi][1]}” and “${IN_CLUSTERS[di][1]}” look like the same objection: both are about cash needed up front. You decide; quotes and sources are kept.</span><button type="button" class="mi-ban-a" onclick="inMergeOpen()">Review merge</button></div>`:''}
    ${rows.length?`<div class="auv-table"><div class="auv-tr th in-ob"><span>Category</span><span>What buyers say</span><span>Units</span><span class="r">Mentions</span><span class="r">Opportunities</span><span class="r">Lost after</span><span>Last</span><span>vs previous 90 days</span></div>
    ${rows.map(({r,i})=>`<div class="auv-tr in-ob" ${onyx?`role="button" tabindex="0" style="cursor:pointer" onclick="inQuotes(${i},'${xesc(d.name)}')"`:''}><span><b>${r[0]}</b></span><span>${xesc(r[1])}</span><span class="in-mu">${xesc(r[2])}</span><span class="r in-bar"><i style="width:${Math.round(r[3]/max*100)}%"></i>${r[3]}</span><span class="r">${r[4]}</span><span class="r">${r[5]}</span><span>${r[6]}</span><span class="${String(r[7]).startsWith('↑')||r[7]==='new'?'tq-bad':'in-mu'}">${r[7]}</span></div>`).join('')}</div>`:'<div class="tq-empty big"><b>No objections logged yet</b><span>They appear here as reps approve them from meetings and buyer messages.</span></div>'}`;
}
function inQuotes(i,dev){
  const r=IN_CLUSTERS[i], qs=r[0]==='Payment plan'?IN_QUOTES:IN_QUOTES.slice(1,3);
  const maria=OPPS.find(o=>o.id==='OPP-1008'), mx=maria&&getExt(maria), ap=mx&&(mx.objections||[]).find(v=>v.apptId&&v.cat===r[0]);
  const where=r[0]==='Payment plan'?[['#CM9712 · penthouse','6'],['#CM9702 · 2-bed','5'],['Other 2-beds','3']]:[[r[2],String(r[3])]];
  const now=[['Still open',String(Math.max(0,r[4]-r[5]-Math.round(r[4]/4)))],['Moved to nurture',String(Math.round(r[4]/4))],['Lost',`${r[5]}${r[5]?' · reason given: '+r[0].toLowerCase():''}`]];
  qaDrawerOpen(`${r[0]} · ${r[1]}`,`<div class="in-mu" style="margin-bottom:10px">${dev} · ${r[3]} mentions across ${r[4]} opportunities · ${r[5]} lost after it came up</div>
    <div class="side-h">What buyers said</div>${qs.map(([q,s,opp])=>`<div class="in-q"><span>${xesc(q)}</span>${opp&&ap?`<button type="button" class="mi-src" onclick="qaDrawerClose();miOpen('${ap.oppId}','${ap.apptId}','trans','${ap.ts}')">${xesc(s)} · open at the line</button>`:`<button type="button" class="mi-src" onclick="showToast('Opens the ${/WhatsApp/.test(s)?'message':'transcript'} at that line')">${xesc(s)}</button>`}</div>`).join('')}
    <div class="side-h" style="margin-top:16px">Where it comes up</div>${where.map(([k,v])=>`<div class="in-fact"><span>${xesc(k)}</span><span>${v}</span></div>`).join('')}
    <div class="side-h" style="margin-top:16px">Where those opportunities are now</div>${now.map(([k,v])=>`<div class="in-fact"><span>${k}</span><span>${xesc(v)}</span></div>`).join('')}`,`<button class="btn-primary" onclick="qaDrawerClose()">Close</button>`);
}
function inMergeOpen(){
  const a=IN_CLUSTERS.find(r=>r[1]==='30% on signing is too high'), b=IN_CLUSTERS.find(r=>r[1]==='Deposit too high to reserve'); if(!a||!b) return;
  const card=r=>`<div class="in-unit"><b>${xesc(r[1])}</b><span class="in-mu">${r[0]} · ${r[3]} mentions · ${r[4]} opportunities · ${r[2]}</span></div>`;
  qaDrawerOpen('Merge two clusters?',`<div class="in-mu" style="margin-bottom:10px">Bricly thinks these are the same objection. Merging keeps every quote and source; the counts add up.</div>${card(a)}<div class="in-mu" style="text-align:center;margin:6px 0">+</div>${card(b)}
    <label class="mi-lbl" style="margin-top:14px">Name of the merged cluster<input class="mi-in" id="in-merge-name" value="Too much cash needed up front"></label>`,
    `<button class="btn-ghost" onclick="IN_MERGE='kept';qaDrawerClose();renderDev();showToast('Kept separate')">Keep separate</button><button class="btn-primary" onclick="inMerge()">Merge</button>`);
}
function inMerge(){
  const ai=IN_CLUSTERS.findIndex(r=>r[1]==='30% on signing is too high'), bi=IN_CLUSTERS.findIndex(r=>r[1]==='Deposit too high to reserve'); if(ai<0||bi<0) return;
  const a=IN_CLUSTERS[ai], b=IN_CLUSTERS[bi], name=document.getElementById('in-merge-name')?.value.trim()||a[1];
  IN_CLUSTERS[ai]=['Payment plan',name,'Penthouses · 2-beds',a[3]+b[3],a[4]+b[4],a[5]+b[5],a[6],'↑ from 4',a[8]+b[8],a[9]+b[9]];
  IN_CLUSTERS.splice(bi,1); IN_MERGE='merged'; qaDrawerClose(); renderDev(); showToast(`Merged into “${name}” · ${a[3]+b[3]} mentions, sources kept`);
}

// ---------- Opportunity "Bricly found" strip (same cards as the deal page) ----------
// Collects what Bricly already proposes on this opportunity; the full cards sit inline in Activity.
function oppSuggestionsHtml(o,x){
  if(typeof dfSuggStrip!=='function'||isCompleted(o)||dealFor(o.id)) return '';
  const cards=[], first=o.lead.split(' ')[0];
  inMsgSeed(o,x); const m=x.inMsg;
  if(m&&m.state!=='done'){
    inMsgProps().forEach(([id,verb,title,fields,src,eff])=>{
      if(m.props[id]!=='prop') return;
      const [what,where]=title.split(' → ');
      cards.push(dfSuggCard({channel:'WhatsApp',time:'Today 11:02',conf:'high',title:`${what} in ${first}’s message`,preview:fields.map(f=>f[1]).join(' · '),from:src,
        target:`${verb} to ${where}${eff?' · '+eff:''}`,
        acts:`<button type="button" class="btn-primary df-sm" onclick="inMsgSet('${id}','ok')">Approve</button><button type="button" class="btn-ghost df-sm" onclick="inMsgSet('${id}','skip')">Skip</button><button type="button" class="df-link" onclick="oppSuggJump('in-msg')">View in activity</button>`}));
    });
    cards.push(dfSuggCard({channel:'WhatsApp',time:'Today 11:02',conf:'high',title:`Reply drafted to ${first}’s questions`,preview:m.text.split('\n').filter(Boolean).slice(1,3).join(' '),
      from:'Every number comes from a record',target:'Review the reply, then approve and send',
      acts:`<button type="button" class="btn-primary df-sm" onclick="oppSuggJump('in-msg')">Review reply</button>`}));
  }
  const d=typeof llDraftFor==='function'?llDraftFor(o,x):null;
  if(d&&!['sent','rejected'].includes(d.status)) cards.push(dfSuggCard({channel:'Bricly',time:'Today',conf:'high',title:`${d.trigger} · draft to ${first}`,preview:d.text.length>140?d.text.slice(0,137)+'…':d.text,from:d.why,
    target:'Send on WhatsApp · nothing goes until you approve',
    acts:`<button type="button" class="btn-primary df-sm" onclick="llDraft('approve')">Approve and send</button><button type="button" class="btn-ghost df-sm" onclick="llDraft('edit');oppSuggJump('ll-draft')">Edit</button><button type="button" class="btn-ghost df-sm" onclick="llDraft('reject');oppSuggJump('ll-draft')">Reject</button>`}));
  return dfSuggStrip('opp-sugg-track','opportunity',cards);
}
// Inline recommendations: the full cards sit inside Activity next to the message they came from; the strip only lists open decisions.
function oppFeedInlineTop(o,x){
  const d=typeof llDraftFor==='function'?llDraftFor(o,x):null;
  return d?`<div class="fi-inline">${llDraftHtml(o,x)}</div>`:'';
}
function oppFeedInlineAfter(o,x,c){return c.intel==='inMsg'&&x.inMsg?`<div class="fi-inline">${inMsgHtml(o,x)}</div>`:'';}
function oppSuggJump(id){
  const el=document.getElementById(id); if(!el) return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  el.classList.remove('df-flash'); void el.offsetWidth; el.classList.add('df-flash');
}
