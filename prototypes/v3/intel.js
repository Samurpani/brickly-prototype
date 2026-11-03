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
// ---------- Meeting recording → proposals (Message intelligence flow 1) ----------
let inMt=null;
function inMeetingOpen(){
  const o=oppCur; inMt={oppId:o.id,mode:'upload',consent:false,file:null,props:{},pick:null,hl:null};
  inMtRender();
}
function inMtData(o){
  const f=o.lead.split(' ')[0], dev=o.devs[0]||'the development';
  const devUnits=UNITS.filter(u=>u.dev===dev);
  const u1=UN(o.units[0])||devUnits[0], u2=UN(o.units[1])||devUnits.find(u=>u.id!==u1.id&&u.status==='available')||u1;
  const short=id=>id.replace('#CM','');
  const was=o.budget!=null?o.budget*1000:350000, now=was+30000;
  const corner=devUnits.filter(u=>u.id!==u1.id&&u.id!==u2.id).slice(0,2);
  const turns=[['00:42','Sam',`Morning ${f}, thanks for coming in. We’ll start with ${short(u1.id)}, then go up to ${short(u2.id)}.`],
    ['03:12',o.lead,'The light in here is lovely. The bedrooms feel a bit tight though.','A4'],
    ['08:55',o.lead,'The terrace up here, that’s what we came for.','A1'],
    ['12:40',o.lead,`Our budget was ${Math.round(was/1000)}, but we could stretch to ${Math.round(now/1000)} if the payment plan works.`,'A2'],
    ['14:10','Sam','[Unclear · 14:02 to 15:30 · background noise]',null,true],
    ['18:05',o.lead,'Thirty percent on signing is too much for us right now.','A3'],
    ['27:30',o.lead,'When would it be finished? We have to be out of our rental by next September.','A2'],
    ['31:22','Sam',`I’ll send you the payment plan for ${short(u2.id)} by Monday.`,'A5'],
    ['36:40',o.lead,'Can you keep it for us until next Friday?','A6'],
    ['38:02',o.lead,`And the other one on ${corner[0]?'floor '+corner[0].floor:'that floor'}, is that still there?`,'A7']];
  const props=[
    ['A1','Log meeting','Log the appointment as held',[['Units shown',`${u1.id} · ${u1.beds} bed, floor ${u1.floor} · ${u2.id}`],['Summary',`Liked the terrace on ${u2.id}. Bedrooms on ${u1.id} felt tight. The payment plan is the open question.`],['Stage','Appointment Completed',o.stage]],'08:55'],
    ['A2','Update facts',`Update ${f}’s budget and move-in date`,[['Budget',`${fmtEur(now)} if the payment plan works`,fmtEur(was)],['Move in by','Sep 2027','Not known']],'12:40'],
    ['A3','Log objection','Payment plan: 30% on signing',[['Category','Payment plan'],['Unit',u2.id]],'18:05'],
    ['A4','Log objection','Size and layout: bedrooms feel tight',[['Category','Size and layout'],['Unit',u1.id]],'03:12'],
    ['A5','Create task',`Send ${f} the payment plan for ${u2.id}`,[['Due','Monday'],['Owner',o.rep]],'31:22'],
    ['A6','Request hold',`Hold ${u2.id} until next Friday`,[['Unit',`${u2.id} · ${UN_STATUS[u2.status]?.l||u2.status}`],['Until','Next Friday, 18:00']],'36:40',{gate:'Holds need a manager. This goes to the Approvals queue. The unit isn’t held until a manager approves.'}],
    ['A7','Add unit','Which unit did they mean?',[],'38:02',{need:true,opts:corner.map(u=>[u.id,`${u.beds} bed · ${u.sqm} m² · ${UN_STATUS[u.status]?.l} · ${IN_K(u.price)}${u.price>now?' · above budget':''}`])}],
  ];
  return {turns,props,u1,u2,was,now};
}
function inMtRender(){
  const o=OPPS.find(x=>x.id===inMt.oppId), host=document.querySelector('.app'); let el=document.getElementById('in-meet');
  if(!el){el=document.createElement('div');el.id='in-meet';el.className='in-meet';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Meeting recording');host.appendChild(el);}
  const head=`<div class="auv-bh"><button type="button" class="auv-x" aria-label="Close" onclick="inMtClose()">×</button><b>Meeting recording · ${xesc(o.lead)}</b><span class="in-mu">${o.id} · ${xesc(o.devs[0]||'')}</span></div>`;
  if(inMt.mode==='upload'){el.innerHTML=head+`<div class="in-mt-up"><h3 class="in-h">Add the recording</h3><p class="in-mu">Bricly reads the transcript like a long chat message and proposes changes. Nothing is written until you approve.</p>
    <button type="button" class="in-drop" onclick="inMt.file='viewing_${new Date().toISOString().slice(0,10)}.m4a · 44:12';inMtRender()">${inMt.file?`🎙 ${xesc(inMt.file)}`:'Choose an audio file, or it arrives from the phone app'}</button>
    <label class="cv-toggle"><input type="checkbox" ${inMt.consent?'checked':''} onchange="inMt.consent=this.checked;inMtRender()"> ${xesc(o.lead.split(' ')[0])} agreed to be recorded. Consent is saved with the file.</label>
    <div class="in-mu">Transcribing a 44-minute meeting uses 4 credits.</div>
    <div class="auv-row" style="margin-top:12px"><button class="btn-ghost" onclick="inMtClose()">Cancel</button><button class="btn-primary" ${inMt.file&&inMt.consent?'':'disabled'} onclick="inMtStart()">Start · 4 credits</button></div></div>`;return;}
  if(inMt.mode==='proc'){const steps=['Uploading','Transcribing · English, Maltese','Matching people and units','Writing proposals'];el.innerHTML=head+`<div class="in-mt-up"><h3 class="in-h">Reading the meeting</h3>${steps.map((s,i)=>`<div class="in-step ${i<inMt.step?'done':i===inMt.step?'cur':''}"><span>${i<inMt.step?'✓':i===inMt.step?'…':'·'}</span>${s}</div>`).join('')}<p class="in-mu">You can leave this page. A notification arrives when the proposals are ready.</p></div>`;return;}
  const d=inMtData(o), st=id=>inMt.props[id]||(id==='A6'?'gate':id==='A7'&&!inMt.pick?'need':'prop');
  const needOpen=!inMt.pick&&st('A7')!=='skip';
  el.innerHTML=head+`<div class="in-mt-body"><div class="in-trans"><div class="in-mu">Transcript · 44:12 · English, Maltese</div>${d.turns.map(([ts,who,txt,ref,unclear])=>`<div class="in-turn ${inMt.hl===ts?'hl':''} ${unclear?'unclear':''}"><span class="in-ts">${ts}</span><div><b>${xesc(who)}</b><div>${xesc(txt)}</div>${ref?`<span class="in-mu">→ ${ref}</span>`:''}</div></div>`).join('')}</div>
    <div class="in-props"><div class="row-between"><b>${d.props.length} proposals</b><button class="btn-primary" ${needOpen?'disabled title="Pick the unit in A7 first"':''} onclick="inMtApproveAll()">Approve all</button></div>
    ${d.props.map(([id,verb,title,fields,ts,x={}])=>{const s=st(id);return `<div class="chd-card in-pc ${s}"><div class="chd-ch"><span class="chd-ref">${id}</span><span class="chd-verb">${verb}</span><b>${xesc(title)}</b><span class="chd-chip t-${s==='ok'?'ok':s==='need'?'warn':s==='skip'?'':s==='gate'?'warn':'info'}">${{prop:'Proposed',ok:'Approved',skip:'Skipped',need:'Needs a choice',gate:'Needs approval'}[s]}</span></div>
      ${x.gate?`<div class="chd-warn">${x.gate}</div>`:''}
      ${fields.length?`<div class="chd-fields">${fields.map(([k,v,b])=>`<div><span class="chd-mu">${k}</span><span>${b?`<s class="chd-mu">${xesc(b)}</s> → `:''}${xesc(v)}</span></div>`).join('')}</div>`:''}
      ${x.opts?`<div class="in-opts">${x.opts.map(([u,s2])=>`<button type="button" class="${inMt.pick===u?'on':''}" onclick="inMt.pick='${u}';inMtRender()"><b>${u}</b><span class="in-mu">${xesc(s2)}</span></button>`).join('')}</div>`:''}
      <div class="chd-cf"><button type="button" class="tq-link" onclick="inMt.hl='${ts}';inMtRender()">▶ ${ts}</button><span class="chd-row">${s==='ok'||s==='skip'?`<button class="btn-ghost chd-b" onclick="delete inMt.props['${id}'];inMtRender()">Undo</button>`:`<button class="btn-ghost chd-b" onclick="inMt.props['${id}']='skip';inMtRender()">Skip</button><button class="btn-primary chd-b" ${id==='A7'&&!inMt.pick?'disabled':''} onclick="inMt.props['${id}']='ok';inMtRender()">${id==='A6'?'Send to Approvals':'Approve'}</button>`}</span></div></div>`;}).join('')}
    <div class="in-mu">Not proposed: nothing is proposed from unclear audio (14:02 to 15:30).</div>
    <div class="auv-row" style="justify-content:flex-end"><button class="btn-primary" onclick="inMtFinish()">Write approved changes</button></div></div></div>`;
}
function inMtStart(){inMt.mode='proc';inMt.step=0;inMtRender();const tick=()=>{if(!inMt||inMt.mode!=='proc')return;inMt.step++;if(inMt.step>=4){inMt.mode='trans';inMtRender();return;}inMtRender();setTimeout(tick,350);};setTimeout(tick,350);}
function inMtApproveAll(){['A1','A2','A3','A4','A5','A6','A7'].forEach(id=>{if(inMt.props[id]!=='skip')inMt.props[id]='ok';});inMtRender();}
function inMtClose(){document.getElementById('in-meet')?.remove();inMt=null;}
function inMtFinish(){
  const o=OPPS.find(x=>x.id===inMt.oppId), x=getExt(o), d=inMtData(o), ok=id=>inMt.props[id]==='ok';
  if(!Object.values(inMt.props).some(v=>v==='ok')){showToast('Approve at least one proposal');return;}
  const log=[];
  if(ok('A1')){if(!EXIT_STAGES.includes(o.stage))o.stage='Appointment Completed';x.comms.unshift({ch:'sys',t:'Just now',text:`Appointment held · 44 min · ${d.props[0][3][1][1]}`});log.push('meeting logged');}
  if(ok('A2')){o.budget=Math.round(d.now/1000);x.buyer=x.buyer||{};x.buyer.timing='Sep 2027';x.comms.unshift({ch:'sys',t:'Just now',text:`Budget ${fmtEur(d.was)} → ${fmtEur(d.now)} if the payment plan works · move in by Sep 2027 · from the transcript, 12:40`});log.push('facts updated');}
  x.objections=x.objections||[];
  if(ok('A3'))x.objections.unshift({cat:'Payment plan',q:'“Thirty percent on signing is too much for us right now.”',src:`Appointment · today, 18:05 · ${d.u2.id}`,open:true});
  if(ok('A4'))x.objections.unshift({cat:'Size and layout',q:'“The bedrooms feel a bit tight though.”',src:`Appointment · today, 03:12 · ${d.u1.id}`,open:true});
  if(ok('A3')||ok('A4'))log.push('objections logged');
  if(ok('A5')&&typeof TQ!=='undefined'){tqInit();TQ.unshift({id:'n'+Date.now(),title:`Send ${o.lead.split(' ')[0]} the payment plan for ${d.u2.id}`,rec:o.id,due:cvISO(cvAddDays(cvToday(),3)),time:null,owner:tqMe(),agent:false,source:'from_signal',status:'open',createdBy:'agent',remind:'',fresh:true});tqBadge();log.push('task created');}
  if(ok('A6')&&typeof apFile==='function'){const r=apFile(o,d.u2.id,'hold');x.hold={unit:d.u2.id,state:'requested'};x.blocker=`Hold on ${d.u2.id} — ${r.id} waiting in Approvals`;log.push('hold sent to Approvals');}
  if(ok('A7')&&inMt.pick&&!o.units.includes(inMt.pick)){o.units.push(inMt.pick);log.push(`${inMt.pick} added`);}
  inMtClose(); renderOpp(); if(typeof pipeRenderAll==='function')pipeRenderAll();
  showToast(`Written to the opportunity · ${log.join(', ')}`);
}
// ---------- Inbound buyer message (flow 2) · Daniel Vella ----------
const IN_MSG_OPP='OPP-1004';
function inMsgSeed(o,x){
  if(o.id!==IN_MSG_OPP||x.inMsg) return;
  x.inMsg={state:'read',props:{B1:'prop',B2:'prop'},text:`Hi ${o.rep}, thanks, I’ve received the offer letter and your ID.\n\nParking isn’t included with 2702. Garage spaces at Mercury are sold separately at €18,000, and two are still available on level -1.\n\nAfter the promise of sale, the next payment is 20% when the shell is finished, planned for March 2027. I’ll send the full schedule with the POS draft.`.replace(`Hi ${o.rep}`,'Hi Daniel')};
  x.comms.unshift({ch:'wa',dir:'in',intel:'inMsg',who:'Daniel Vella',t:'Today 11:02',text:'Hi, attached the bank’s offer letter and my ID. Is a parking space included with 2702? And when is the next payment due after the promise of sale?',sub:'📎 HSBC_offer_letter.pdf · 📎 IMG_4410.jpg'});
}
function inMsgProps(){
  return [['B1','File document','Bank offer letter → Documents · Finance',[['Lender','HSBC Malta'],['Loan amount','€292,000'],['Valid until','Mon 30 Nov 2026']],'From HSBC_offer_letter.pdf, page 1','Finance moves to Approved, and the “Needs finance” blocker clears.'],
    ['B2','File document','ID card → Documents · KYC',[['Name','Daniel Vella · matches the contact'],['Expires','Fri 14 Mar 2031']],'From IMG_4410.jpg · stored with restricted access','']];
}
function inMsgHtml(o,x){
  inMsgSeed(o,x); const m=x.inMsg; if(!m) return '';
  if(m.state==='done') return `<div class="dcard in-msg done" id="in-msg"><div class="ll-dh"><span class="ll-ai">✦</span><b>Daniel’s message</b><span class="ll-mu">Today 11:02</span><span class="ll-st t-ok">Approved and sent</span></div><div class="ll-mu">Bank offer letter filed under Finance, ID filed under KYC with restricted access, finance blocker cleared, reply sent as written.</div></div>`;
  const P=inMsgProps();
  return `<div class="dcard in-msg" id="in-msg"><div class="ll-dh"><span class="ll-ai">✦</span><b>Bricly read Daniel’s message</b><span class="ll-mu">WhatsApp · today 11:02 · 2 attachments, 2 questions · 1 credit</span></div>
    ${P.map(([id,verb,title,fields,src,eff])=>{const s=m.props[id];return `<div class="chd-card"><div class="chd-ch"><span class="chd-ref">${id}</span><span class="chd-verb">${verb}</span><b>${title}</b><span class="chd-chip t-${s==='ok'?'ok':s==='skip'?'':'info'}">${{prop:'Proposed',ok:'Approved',skip:'Skipped'}[s]}</span></div><div class="chd-fields">${fields.map(([k,v])=>`<div><span class="chd-mu">${k}</span><span>${v}</span></div>`).join('')}</div>${eff?`<div class="chd-effect">${eff}</div>`:''}<div class="chd-cf"><span class="chd-mu">${src}</span><span class="chd-row">${s==='prop'?`<button class="btn-ghost chd-b" onclick="inMsgSet('${id}','skip')">Skip</button><button class="btn-primary chd-b" onclick="inMsgSet('${id}','ok')">Approve</button>`:`<button class="btn-ghost chd-b" onclick="inMsgSet('${id}','prop')">Undo</button>`}</span></div></div>`;}).join('')}
    <div class="chd-card"><div class="chd-ch"><span class="chd-ref">B3</span><span class="chd-verb">Reply</span><b>Draft reply to Daniel</b><span class="chd-chip t-info">Proposed</span></div><textarea id="in-msg-text" class="ll-text" rows="6" aria-label="Reply to Daniel" style="border:0;border-radius:0">${xesc(m.text)}</textarea>
      <div class="chd-effect">Every number comes from a record: Mercury price list (garage €18,000 · 2 available) · Payment plan #CM2702 · Construction programme (shell March 2027).</div></div>
    <div class="ll-acts"><button class="btn-primary" onclick="inMsgSend()">Approve all and send</button><span class="ll-mu">Nothing is filed or sent until you approve</span></div></div>`;
}
function inMsgSet(id,v){getExt(oppCur).inMsg.props[id]=v;renderOpp();}
function inMsgSend(){
  const o=oppCur,x=getExt(o),m=x.inMsg,text=document.getElementById('in-msg-text').value.trim();
  ['B1','B2'].forEach(id=>{if(m.props[id]==='prop')m.props[id]='ok';});
  const ds=ensureDocs(o,x);
  if(m.props.B2==='ok'){const idDoc=ds.find(d=>/Passport|ID/.test(d.label));if(idDoc){idDoc.status='received';idDoc.file={name:'IMG_4410.jpg',size:'1.1 MB'};idDoc.hist.push({t:'Just now',who:'Daniel Vella',act:'Received from client'});}}
  if(m.props.B1==='ok'){ds.push({id:'dfin',g:'KYC',label:'Bank offer letter · HSBC',flow:'file',status:'filed',file:{name:'HSBC_offer_letter.pdf',size:'0.4 MB'},hist:[{t:'Just now',who:'You',act:'Filed'}]});x.buyer=x.buyer||{};x.buyer.finance='Approved · €292,000 · HSBC Malta';if(x.blocker&&/financ/i.test(x.blocker))x.blocker=null;}
  x.comms.unshift({ch:'wa',dir:'out',who:'You',t:'Just now',text});
  m.state='done'; renderOpp(); showToast('Filed 2 documents and sent the reply to Daniel');
}
// ---------- Objections (flow 3) ----------
const IN_SEED_OBJ={'Maria Borg':[{cat:'Payment plan',q:'“Thirty percent on signing is too much for us right now.”',src:'Appointment · Thu 1 Oct · #CM9703',open:true},{cat:'Size and layout',q:'“The bedrooms feel a bit tight though.”',src:'Appointment · Thu 1 Oct · #CM9703',open:true},{cat:'Price',q:'“The penthouse is more than we planned.”',src:'WhatsApp · Thu 24 Sep · answered by the budget update',open:false}]};
function inObjHtml(o,x){
  if(!x.objections&&IN_SEED_OBJ[o.lead]) x.objections=IN_SEED_OBJ[o.lead].map(v=>({...v}));
  const l=x.objections||[]; if(!l.length) return '';
  const open=l.filter(v=>v.open).length;
  return `<div class="dcard"><div class="row-between rail-h"><div class="side-h">Objections</div><span class="in-mu">${open} open · ${l.length-open} answered</span></div>
    ${l.map((v,i)=>`<div class="in-obj"><div class="row-between"><select class="in-cat" aria-label="Category" onchange="inObjCat(${i},this.value)">${IN_OBJ_CATS.map(c=>`<option ${c===v.cat?'selected':''}>${c}</option>`).join('')}</select><button type="button" class="chd-chip t-${v.open?'warn':'ok'}" style="border:0;cursor:pointer" onclick="inObjToggle(${i})">${v.open?'Open':'Answered'}</button></div><div>${xesc(v.q)}</div><div class="in-mu">${xesc(v.src)}</div></div>`).join('')}</div>`;
}
function inObjCat(i,c){const x=getExt(oppCur);x.objections[i].cat=c;renderOpp();showToast('Category changed to '+c);}
function inObjToggle(i){const x=getExt(oppCur);x.objections[i].open=!x.objections[i].open;renderOpp();}
const IN_CLUSTERS=[['Payment plan','30% on signing is too high','Penthouses · 2-beds',14,9,3,'Today','↑ from 4'],['Size and layout','Second bedroom feels small','2-beds, floors 5 to 7',9,7,1,'Today','↑ from 6'],['Price','Penthouse above budget','Penthouses',8,6,2,'Mon 28 Sep','same'],['Completion timing','Needs to move in before Q2 2027','All types',6,5,1,'Thu 1 Oct','↓ from 8'],['Parking','No parking space included','2-beds and 3-beds',5,5,0,'Wed 30 Sep','same'],['Payment plan','Deposit too high to reserve','2-beds',4,3,1,'Fri 25 Sep','new'],['View and light','Lower floors are overlooked','Floors 1 to 3',3,3,0,'Tue 22 Sep','same']];
const IN_QUOTES=[['“Thirty percent on signing is too much for us right now.”','Maria Borg · appointment · Thu 1 Oct · Sam'],['“Can the 30% be split over the first year?”','Ben Zammit · WhatsApp · Mon 28 Sep · Karl Zammit'],['“We’d have to sell our flat first to find 30%.”','Clara Spiteri · call · Tue 22 Sep · Sam'],['“Mercury only asks 10% on the promise of sale.”','Joseph Grech · appointment · Fri 18 Sep · Matthew Vella']];
function inDevObjHtml(d){
  const live=OPPS.filter(o=>o.devs.includes(d.name)).flatMap(o=>(getExt(o).objections||[]).map(v=>({...v,o})));
  const rows=d.name==='Onyx Rise'?IN_CLUSTERS:Object.entries(live.reduce((m,v)=>{(m[v.cat]=m[v.cat]||[]).push(v);return m;},{})).map(([c,l])=>[c,l[0].q.replace(/[“”]/g,''),'—',l.length,new Set(l.map(v=>v.o.id)).size,l.filter(v=>v.open).length,'Today','new']);
  return `<div class="in-mu" style="margin-bottom:12px">Clustered from objections logged in meetings and messages over the last 90 days. Categories are the same on every development so the clusters compare.</div>
    ${rows.length?`<div class="auv-table"><div class="auv-tr th in-ob"><span>Category</span><span>What buyers say</span><span>Units</span><span class="r">Mentions</span><span class="r">Opportunities</span><span class="r">Open</span><span>Last</span><span>vs previous 90 days</span></div>
    ${rows.map((r,i)=>`<div class="auv-tr in-ob" ${d.name==='Onyx Rise'?`style="cursor:pointer" onclick="inQuotes(${i},'${xesc(d.name)}')"`:''}><span><b>${r[0]}</b></span><span>${xesc(r[1])}</span><span class="in-mu">${xesc(r[2])}</span><span class="r">${r[3]}</span><span class="r">${r[4]}</span><span class="r">${r[5]}</span><span>${r[6]}</span><span class="${String(r[7]).startsWith('↑')?'tq-bad':'in-mu'}">${r[7]}</span></div>`).join('')}</div>`:'<div class="tq-empty big"><b>No objections logged yet</b><span>They appear here as reps approve them from meetings and buyer messages.</span></div>'}`;
}
function inQuotes(i,dev){const r=IN_CLUSTERS[i];qaDrawerOpen(`${r[0]} · ${dev}`,`<div class="in-mu" style="margin-bottom:10px">${xesc(r[1])} · ${r[3]} mentions across ${r[4]} opportunities</div>${(i===0?IN_QUOTES:IN_QUOTES.slice(0,2)).map(([q,s])=>`<div class="in-q"><span>${xesc(q)}</span><span class="in-mu">${xesc(s)}</span></div>`).join('')}`,`<button class="btn-primary" onclick="qaDrawerClose()">Done</button>`);}

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
    cards.push(dfSuggCard({channel:'WhatsApp',time:'Today 11:02',conf:'high',title:`Reply drafted to ${first}’s 2 questions`,preview:m.text.split('\n').filter(Boolean).slice(1,3).join(' '),
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
