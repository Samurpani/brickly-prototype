// Lead lifecycle extras (Lead Lifecycle Flows · EP-4): AI draft cards (S09 · Draft Card),
// action checklists (S08 · POS signing) and manager-only rep reassignment.
const LL_QUIET_DAYS=5;
const LL_DRAFT_REASONS=['Already spoke to them','Wrong details','Wrong tone','Not now'];
function llActive(o){return !EXIT_STAGES.includes(o.stage)&&!dealFor(o.id)&&o.rep!=='Unassigned';}
function llQuietDays(o){const d=typeof nfAgeDays==='function'?nfAgeDays(o.ago):0;return llActive(o)&&o.stage!=='New Lead'&&d>=LL_QUIET_DAYS?d:0;}
// One draft per opportunity, built only from records the prototype holds. Detection is rule-based.
function llDraftFor(o,x){
  if(x.draft!==undefined) return x.draft;
  const first=o.lead.split(' ')[0], u=o.units[0], un=u?UN(u):null, dev=o.devs[0], me=o.rep;
  let d=null;
  if(typeof noShowCount==='function'&&noShowCount(o)>0&&llActive(o)) d={kind:'noshow',trigger:'No-show',why:`Appointment logged as no-show. Reminders on this opportunity are paused.`,
    body:`Hi ${first}, sorry we missed each other at ${dev}. I have two slots free this week: Thu at 17:30 or Sat at 10:00. Would either of those work for you?`,
    recs:[[`Appointment · ${u||dev}`,'Logged as no-show'],[`${me}’s calendar`,'Free Thu 17:30, Sat 10:00']]};
  else if(x.date&&/hold/i.test(x.date.label)&&llActive(o)) d={kind:'hold',trigger:'Hold expiring',why:`Hold on ${u} ends ${x.date.value}. Warning window 48 hours.`,
    body:`Hi ${first}, a quick reminder that the hold on ${u} at ${dev} ends ${x.date.value}. If you’d like to keep the unit while we finalise, reply here and I’ll ask for an extension today.`,
    recs:[[`Hold on ${u}`,`Ends ${x.date.value}`],[`${first}’s language`,'English, from their messages']]};
  else if(llQuietDays(o)) d={kind:'quiet',trigger:'Quiet deal',why:`No two-way contact for ${llQuietDays(o)} days. Quiet threshold ${LL_QUIET_DAYS} days.`,
    body:`Hi ${first}, it’s ${me} from ${dev}. I wanted to check in on ${u||'the homes we discussed'}${un?`, the ${un.beds===0?'studio':un.beds+'-bed'} on floor ${un.floor}`:''}. Would a short call this week help with any questions you still have?`,
    recs:[[un?`Unit ${u} · ${un.beds===0?'studio':un.beds+' bed'}, floor ${un.floor}`:`Development · ${dev}`,'On this opportunity'],[`${first}’s last activity`,o.ago+' ago'],[`${me}’s writing style`,'From sent messages']]};
  if(d){d.status='proposed';d.text=d.body;d.edited=false;d.recsOpen=false;d.reason=null;}
  x.draft=d; return d;
}
function llDraftHtml(o,x){
  const d=llDraftFor(o,x); if(!d) return '';
  const ST={proposed:['Proposed','info'],editing:['Editing','warn'],rejecting:['Proposed','info'],sent:[d.edited?'Edited and sent':'Sent','ok'],rejected:['Rejected','neu']}[d.status];
  const done=d.status==='sent'||d.status==='rejected';
  return `<div class="dcard ll-draft" id="ll-draft">
    <div class="ll-dh"><span class="ll-ai">✦</span><b>${d.trigger}</b><span class="ll-mu">Draft to ${xesc(o.lead)} · WhatsApp · English</span><span class="ll-st t-${ST[1]}">${ST[0]}</span></div>
    <div class="ll-mu">${xesc(d.why)}</div>
    ${d.status==='editing'?`<textarea id="ll-draft-text" class="ll-text" rows="4" aria-label="Draft message">${xesc(d.text)}</textarea>`:`<div class="ll-body ${d.status==='rejected'?'struck':''}">${xesc(d.text)}</div>`}
    <button type="button" class="ll-recs" aria-expanded="${d.recsOpen}" onclick="llDraft('recs')">Records used · ${d.recs.length} ${d.recsOpen?'⌃':'⌄'}</button>
    ${d.recsOpen?`<div class="ll-reclist">${d.recs.map(([k,v])=>`<div><span>${xesc(k)}</span><span class="ll-mu">${xesc(v)}</span></div>`).join('')}</div>`:''}
    ${d.status==='rejecting'?`<div class="ll-reasons" role="radiogroup" aria-label="Reason">${LL_DRAFT_REASONS.map(r=>`<button type="button" role="radio" aria-checked="${d.reason===r}" class="${d.reason===r?'on':''}" onclick="llDraft('reason','${r}')">${r}</button>`).join('')}</div>`:''}
    ${done?`<div class="ll-done t-${ST[1]}">${d.status==='sent'?`${ST[0]} on WhatsApp just now · logged to ${xesc(o.lead.split(' ')[0])}’s activity`:`Rejected by ${xesc(o.rep)} · nothing sent${d.reason?' · '+xesc(d.reason):''}`}</div>`:
      `<div class="ll-acts">${d.status==='editing'?`<button class="btn-primary" onclick="llDraft('approve')">Send</button><button class="btn-ghost" onclick="llDraft('cancel')">Cancel</button>`:d.status==='rejecting'?`<button class="btn-primary" onclick="llDraft('confirmReject')">Reject draft</button><button class="btn-ghost" onclick="llDraft('cancel')">Cancel</button>`:`<button class="btn-primary" onclick="llDraft('approve')">Approve and send</button><button class="btn-ghost" onclick="llDraft('edit')">Edit</button><button class="btn-ghost" onclick="llDraft('reject')">Reject</button>`}<span class="ll-mu">Nothing is sent until you approve</span></div>`}
  </div>`;
}
function llDraft(act,arg){
  const o=oppCur,x=getExt(o),d=llDraftFor(o,x); if(!d) return;
  if(act==='recs') d.recsOpen=!d.recsOpen;
  else if(act==='edit') d.status='editing';
  else if(act==='reject') d.status='rejecting';
  else if(act==='reason') d.reason=d.reason===arg?null:arg;
  else if(act==='cancel'){d.status='proposed';d.reason=null;}
  else if(act==='confirmReject'){d.status='rejected';x.comms.unshift({ch:'sys',t:'Just now',text:`${d.trigger} draft rejected${d.reason?' · '+d.reason:''} · nothing sent`});}
  else if(act==='approve'){
    const ta=document.getElementById('ll-draft-text'); if(ta&&ta.value.trim()!==d.text){d.text=ta.value.trim();d.edited=true;}
    d.status='sent'; x.comms.unshift({ch:'wa',dir:'out',who:'You',t:'Just now',text:d.text});
    if(d.kind==='quiet'){o.ago='Today';}
    showToast(`Sent to ${o.lead.split(' ')[0]} on WhatsApp`);
  }
  renderOpp(); if(typeof pipeRenderAll==='function')pipeRenderAll();
}
// ---------- S08 · action drawer with optional checklist (POS signing) ----------
const LL_POS_CHECK=['Draft POS reviewed by the notary','Deposit amount confirmed with the buyer','ID document on file','Payment plan agreed','Bank offer letter received'];
function oppPosOpen(){
  const o=oppCur;
  const body=`<div class="od-field"><label>Unit</label><input value="${xesc(o.units.join(', ')||'—')}" readonly></div>
    <div class="od-field"><label for="llPosDate">Date</label><input id="llPosDate" type="date"></div>
    <div class="od-field"><label for="llPosTime">Time</label><input id="llPosTime" type="time" value="11:00"></div>
    <div class="od-field"><label>Before the signing <span class="ll-mu">· optional, set in Settings</span></label><div class="ll-check" id="llPosCheck">${LL_POS_CHECK.map((t,i)=>`<label><input type="checkbox" data-i="${i}" onchange="llPosCount()"> ${t}</label>`).join('')}</div><span class="ll-mu" id="llPosCount">0 of ${LL_POS_CHECK.length} ticked · you can book now</span></div>`;
  qaDrawerOpen('Book POS signing',body,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="oppPosBook()">Book POS signing</button>`);
}
function llPosCount(){const n=document.querySelectorAll('#llPosCheck input:checked').length;document.getElementById('llPosCount').textContent=`${n} of ${LL_POS_CHECK.length} ticked · you can book now`;}
function oppPosBook(){
  const o=oppCur,x=getExt(o),date=document.getElementById('llPosDate').value;
  if(!date){showToast('Pick a date for the POS signing');return;}
  const ticked=document.querySelectorAll('#llPosCheck input:checked').length, dstr=qaFmtDate(date), time=document.getElementById('llPosTime').value;
  if(tlIdx(o,x)<2) x.tl=2;
  if(!EXIT_STAGES.includes(o.stage)) o.stage='Contract Booked';
  x.next={label:'Confirm POS signing',due:dstr,overdue:false};
  x.date={label:'POS signing',value:`${dstr}${time?', '+time:''}`,in:'',tone:''};
  x.appts=[{label:'POS signing',when:`${dstr}${time?' · '+time:''}`}];
  x.comms.unshift({ch:'sys',t:'Just now',text:`POS signing booked · ${dstr}${time?' '+time:''} · checklist ${ticked}/${LL_POS_CHECK.length}`});
  qaDrawerClose(); renderOpp(); if(typeof pipeRenderAll==='function')pipeRenderAll();
  showToast('POS signing booked · moved to Contract Booked');
}
// ---------- P2 · manager board: summary and reassign ----------
function llIsMgr(){return typeof curPersona!=='undefined'&&(curPersona==='manager'||curPersona==='owner');}
let llMenuFor=null;
function llRepAssignee(o){
  const avatar=`<span class="avatar-sm neutral">${initials(o.rep)}</span><span class="rep-name">${xesc(o.rep)}</span>`;
  return llIsMgr()&&!o.unassigned&&llActive(o)
    ?`<button type="button" class="rep-assignee" aria-label="Reassign ${xesc(o.lead)} from ${xesc(o.rep)}" title="Reassign ${xesc(o.lead)}" onclick="llReassignOpen(event,'${o.id}')">${avatar}</button>`
    :`<span class="rep-assignee">${avatar}</span>`;
}
function llReassignOpen(e,id){
  e.stopPropagation(); document.getElementById('ll-menu')?.remove();
  if(llMenuFor===id){llMenuFor=null;return;}
  llMenuFor=id; const o=OPPS.find(x=>x.id===id); if(!o)return;
  const reps=[...new Set(OPPS.map(x=>x.rep).filter(n=>n&&n!=='Unassigned'))];
  const m=document.createElement('div'); m.id='ll-menu'; m.className='ll-menu'; m.setAttribute('role','menu');
  m.innerHTML=`<div class="ll-mu" style="padding:4px 8px">Reassign to</div>${reps.map(r=>`<button type="button" role="menuitem" ${r===o.rep?'disabled':''} onclick="llReassign('${id}','${r}')"><span class="avatar-sm neutral">${initials(r)}</span><span>${xesc(r)}</span>${r===o.rep?'<span class="ll-current">Current</span>':''}</button>`).join('')}`;
  const anchor=e.currentTarget.getBoundingClientRect(),width=220;
  document.querySelector('.app').appendChild(m);
  const left=Math.max(8,Math.min(window.innerWidth-width-8,anchor.right-width));
  const below=anchor.bottom+4,top=below+m.offsetHeight<=window.innerHeight-8?below:Math.max(8,anchor.top-m.offsetHeight-4);
  m.style.top=top+'px';m.style.left=left+'px';
}
function llReassign(id,rep){
  const o=OPPS.find(x=>x.id===id); document.getElementById('ll-menu')?.remove(); llMenuFor=null;if(!o)return;
  const from=o.rep; o.rep=rep; getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`Reassigned from ${from} to ${rep}`});
  pipeRenderAll(); showToast(`${o.lead} reassigned to ${rep} · ${from} is told`);
}
document.addEventListener('click',e=>{if(!e.target.closest('#ll-menu,.ll-more')){document.getElementById('ll-menu')?.remove();llMenuFor=null;}});
