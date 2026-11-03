// Calendar (Bricly Calendar · Calendar Flows 1–10), layered on the cv* engine.
// Design events are anchored to "today" so the week always looks like the design's Wed 30 Sep week.
Object.assign(CV_TYPE_META,{
  appointment:{label:'Appointment',color:'#6a5a9c'},
  video:{label:'Video call',color:'#b0703a'},
  internal:{label:'Internal',color:'#7d7a72'},
  busy:{label:'Google Calendar',color:'#b9b5ac'},
});
const CV_DESIGN_TODAY='2026-09-30';
const CV_ME='Sam';
const CV_REC={paul:'Paul Micallef',clara:'Clara Vella',anna:'Anna Spiteri',karlb:'Karl Buhagiar',nicole:'Nicole Galea',daniel:'Daniel Vella',luca:'Luca Camilleri',maria:'Maria Borg',rebecca:'Rebecca Farrugia',mark:'Mark Debono',joseph:'Joseph Grech',ian:'Ian Borg',claire:'Claire Azzopardi'};
const CV_OWNERS={sam:'Sam',manager:'Rachel Mifsud',karl:'Karl Zammit',maria:'Maria Farrugia'};
const CV_SEED=[
  ['e1','viewing','2026-09-28','10:00','10:45',{rec:'maria',loc:'Onyx Rise sales suite',outcome:'Held · Interested · next: second appointment Sat'}],
  ['e2','call','2026-09-28','15:00','15:20',{rec:'paul',outcome:'Held · sent floor plans'}],
  ['e3','viewing','2026-09-29','09:30','10:15',{rec:'daniel',loc:'Mercury sales suite',outcome:'Held · Interested · asked about parking'}],
  ['e4','video','2026-09-29','11:00','11:30',{rec:'nicole',loc:'Google Meet',outcome:'Held · wants a revised payment plan'}],
  ['g1','busy','2026-09-29','13:00','14:00',{title:'Busy'}],
  ['e5','internal','2026-09-29','16:00','16:30',{title:'1:1 with Rachel',loc:'Office'}],
  ['e6','internal','2026-09-30','08:00','08:20',{title:'Team stand-up',loc:'Office'}],
  ['e7','viewing','2026-09-30','08:30','09:15',{rec:'clara',loc:'La Lex show apartment',needs:true,rem:['You · sent 07:30','Clara · sent the day before, 08:30 · no reply']}],
  ['e8','call','2026-09-30','12:00','12:20',{rec:'nicole',title:'Call · Nicole Galea · payment plan',rem:['You · 11:00']}],
  ['g2','busy','2026-09-30','13:00','14:00',{title:'Busy'}],
  ['e9','viewing','2026-09-30','17:30','18:15',{rec:'anna',title:'Second appointment · Anna Spiteri',loc:'Onyx Rise sales suite',with:'Sam, Anna Spiteri, Mark Spiteri',rem:['You · 16:30, app and WhatsApp','Anna · sent the day before · Confirmed']}],
  ['e10','call','2026-10-01','10:00','10:20',{rec:'karlb',rem:['You · 09:00']}],
  ['e11','viewing','2026-10-01','11:00','11:45',{rec:'rebecca',loc:'La Lex sales suite',src:'Booking link',rem:['You · 10:00','Rebecca · confirmation sent','Rebecca · reminder the day before']}],
  ['e12','viewing','2026-10-01','16:00','16:45',{rec:'karlb',loc:'La Lex sales suite',src:'WhatsApp',rem:['You · 15:00','Karl · reminder the day before']}],
  ['g3','busy','2026-10-02','08:00','09:00',{title:'Busy'}],
  ['e13','signing','2026-10-02','14:00','15:00',{rec:'luca',loc:'Notary Vella, Valletta',with:'Sam, Luca Camilleri, Notary Vella',rem:['You · 1 day and 1 hour before','Luca · the day before, 14:00']}],
  ['e14','viewing','2026-10-03','10:00','10:45',{rec:'maria',title:'Second appointment · Maria Borg',loc:'Onyx Rise sales suite',rem:['You · 09:00','Maria · the day before, 10:00']}],
  ['t1','internal','2026-09-30','08:00','08:20',{owner:'manager',title:'Team stand-up'}],
  ['t2','internal','2026-09-30','10:15','11:00',{owner:'manager',title:'Bank call · facility review'}],
  ['t3','internal','2026-09-30','15:00','15:30',{owner:'manager',title:'1:1 with Karl'}],
  ['t4','internal','2026-09-30','08:00','08:20',{owner:'karl',title:'Team stand-up'}],
  ['t5','viewing','2026-09-30','09:30','10:15',{owner:'karl',rec:'mark',outcome:'Held'}],
  ['t6','call','2026-09-30','11:30','11:50',{owner:'karl',rec:'joseph'}],
  ['t7','internal','2026-09-30','15:00','15:30',{owner:'karl',title:'1:1 with Rachel'}],
  ['t8','signing','2026-09-30','16:00','17:00',{owner:'karl',rec:'joseph',title:'Hold review · Joseph Grech'}],
  ['t9','internal','2026-09-30','08:00','08:20',{owner:'maria',title:'Team stand-up'}],
  ['t10','viewing','2026-09-30','10:00','10:45',{owner:'maria',rec:'claire'}],
  ['t11','viewing','2026-09-30','14:00','14:45',{owner:'maria',rec:'ian'}],
  ['t12','busy','2026-09-30','12:00','13:00',{owner:'maria',title:'Busy'}],
  ['t13','call','2026-09-30','17:00','17:20',{owner:'maria',rec:'ian'}],
];
let cvSeed=null, cvTeam=false, cvGcal='connected';
function cvMins(t){const [h,m]=t.split(':').map(Number);return h*60+m;}
function cvHm(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function cvSeedEvents(){
  if(cvSeed) return cvSeed;
  const base=new Date(CV_DESIGN_TODAY+'T00:00:00');
  cvSeed=CV_SEED.map(([sid,type,date,start,end,x],i)=>{
    const off=Math.round((new Date(date+'T00:00:00')-base)/86400000);
    const contact=x.rec?CV_REC[x.rec]:'';
    const title=x.title||`${CV_TYPE_META[type].label} · ${contact}`;
    return {id:80000+i,sid,seed:true,title,type,dateISO:cvISO(cvOffsetDate(off)),start,end,contact,location:x.loc||'',oppId:contact?cvOppForContact(contact):null,
      owner:CV_OWNERS[x.owner||'sam'],with:x.with||'',rem:x.rem||[],src:x.src||'',outcome:x.outcome||'',needs:!!x.needs};
  });
  return cvSeed;
}
const cvBuildEventsBase=cvBuildEvents;
cvBuildEvents=function(){
  const mine=cvSeedEvents().filter(e=>e.owner===CV_ME&&!e.cancelled);
  return [...cvBuildEventsBase(),...mine].sort((a,b)=>a.dateISO===b.dateISO?a.start.localeCompare(b.start):a.dateISO.localeCompare(b.dateISO));
};
function cvFind(id){return cvBuildEvents().find(x=>String(x.id)===String(id))||cvSeedEvents().find(x=>String(x.id)===String(id));}
function cvNeedsOutcome(e){
  if(e.outcome||!['viewing','appointment','call','video'].includes(e.type)) return false;
  if(e.needs) return true;
  if(e.seed) return false; // design events follow the design's own statuses
  const today=cvISO(cvToday()), now=new Date();
  return e.dateISO<today||(e.dateISO===today&&cvMins(e.end||e.start)<now.getHours()*60+now.getMinutes());
}
// Free times inside working hours (rep) or booking hours (client: 15 min gap, 4 h notice, closed Sunday).
function cvFreeSlots(date,dur,mode,exclude){
  const today=cvISO(cvToday()); if(date<today) return [];
  const dow=new Date(date+'T00:00:00').getDay();
  const r=mode==='client'?(dow===0?null:dow===6?[600,780]:[540,1080]):[480,1140]; if(!r) return [];
  const buf=mode==='client'?15:0, now=new Date(), nowM=now.getHours()*60+now.getMinutes();
  const min=date===today?(mode==='client'?nowM+240:nowM):0;
  const evs=cvBuildEvents().filter(e=>e.dateISO===date&&String(e.id)!==String(exclude)&&e.end);
  const out=[];
  for(let t=r[0];t+dur<=r[1];t+=30){if(t<min)continue;if(evs.some(e=>t-buf<cvMins(e.end)&&t+dur+buf>cvMins(e.start)))continue;out.push(cvHm(t));}
  return out;
}
function cvDayLabel(iso){return new Date(iso+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});}
// ---------- Flow 2 · popover ----------
cvShowPop=function(evt,id){
  evt.stopPropagation();
  const e=cvFind(id); if(!e) return;
  const pop=document.getElementById('cv-pop'), meta=CV_TYPE_META[e.type]||CV_TYPE_META.followup, needs=cvNeedsOutcome(e);
  pop.style.setProperty('--c',meta.color);
  pop.innerHTML=e.type==='busy'?`<div class="cv-pop-type">${meta.label}</div><div class="cv-pop-title">Busy</div><div class="cv-pop-kv">${e.start} – ${e.end}</div><div class="cv-pop-kv cv-mu">From your Google Calendar. Details stay private; the time is blocked for bookings.</div>`:
  `<div class="cv-pop-type">${meta.label}${e.src?` <span class="cv-src">${xesc(e.src)}</span>`:''}</div>
    <div class="cv-pop-title">${xesc(e.title)}</div>
    <div class="cv-pop-kv">${cvDayLabel(e.dateISO)} · ${e.start}${e.end?' – '+e.end:''}</div>
    ${e.contact?`<div class="cv-pop-kv">${xesc(e.contact)}${e.oppId?` · ${e.oppId}`:''}</div>`:''}
    ${e.location?`<div class="cv-pop-kv">${xesc(e.location)}</div>`:''}
    ${e.with?`<div class="cv-pop-kv cv-mu">With ${xesc(e.with)}</div>`:''}
    ${e.rem&&e.rem.length?`<div class="cv-rem"><div class="cv-mu">Reminders</div>${e.rem.map(r=>`<div>${/no reply/i.test(r)?'○':'✓'} ${xesc(r)}</div>`).join('')}</div>`:''}
    ${e.outcome?`<div class="cv-outcome">${xesc(e.outcome)}</div>`:''}
    ${needs?`<div class="cv-needs">Outcome needed · it ended at ${e.end}</div>`:''}
    <div class="cv-pop-foot">${needs?`<button class="btn-primary" style="flex:1;justify-content:center" onclick="cvOutcomeOpen('${e.id}')">Log outcome</button>`:''}${e.oppId?`<button class="${needs?'btn-ghost':'btn-primary'}" style="flex:1;justify-content:center" onclick="cvClosePop();openOpp('${e.oppId}')">Open opportunity</button>`:''}</div>
    ${e.seed||cvExtra.some(x=>x.id===e.id)?`<div class="cv-pop-links">${!needs&&!e.outcome?`<button onclick="cvReschedOpen('${e.id}')">Reschedule</button><button onclick="cvCancel('${e.id}')">Cancel event</button>`:''}</div>`:''}`;
  const r=evt.currentTarget.getBoundingClientRect(), popW=290;
  let left=r.right+8; if(left+popW>window.innerWidth-10) left=r.left-popW-8;
  pop.style.left=Math.max(10,left)+'px'; pop.style.top=Math.max(10,Math.min(r.top,window.innerHeight-380))+'px';
  pop.classList.add('on');
};
function cvCancel(id){const e=cvFind(id);if(!e)return;e.cancelled=true;cvExtra=cvExtra.filter(x=>String(x.id)!==String(id));cvClosePop();cvRender();showToast(`Cancelled · ${e.contact||e.title} was told${e.contact?' on WhatsApp':''}`);}
// ---------- Flow 4 · reschedule ----------
let cvRs=null;
function cvReschedOpen(id){
  const e=cvFind(id); cvClosePop();
  const dur=cvMins(e.end)-cvMins(e.start);
  const day=[...Array(14)].map((_,i)=>cvISO(cvOffsetDate(i))).find(d=>d>=e.dateISO&&cvFreeSlots(d,dur,'rep',e.id).length)||e.dateISO;
  cvRs={id,day,slot:null,notify:!!e.contact};
  cvReschedRender();
}
function cvReschedRender(){
  const e=cvFind(cvRs.id), dur=cvMins(e.end)-cvMins(e.start);
  const days=[...Array(7)].map((_,i)=>cvISO(cvOffsetDate(i)));
  const slots=cvFreeSlots(cvRs.day,dur,'rep',e.id);
  const first=(e.contact||'').split(' ')[0];
  const body=`<div class="cv-mu" style="margin-bottom:10px">${xesc(e.title)} · now ${cvDayLabel(e.dateISO)}, ${e.start}</div>
    <div class="od-field"><label>Day</label><div class="cv-days">${days.map(d=>`<button type="button" class="${d===cvRs.day?'on':''}" onclick="cvRs.day='${d}';cvRs.slot=null;cvReschedRender()">${cvDayLabel(d)}</button>`).join('')}</div></div>
    <div class="od-field"><label>Free times · ${dur} min</label><div class="cv-slots">${slots.map(s=>`<button type="button" class="${s===cvRs.slot?'on':''}" onclick="cvRs.slot='${s}';cvReschedRender()">${s}</button>`).join('')||'<span class="cv-mu">No free time this day.</span>'}</div></div>
    ${e.contact?`<label class="cv-toggle"><input type="checkbox" ${cvRs.notify?'checked':''} onchange="cvRs.notify=this.checked;cvReschedRender()"> Tell ${xesc(first)} on WhatsApp</label>
    ${cvRs.notify?`<div class="cv-preview">Hi ${xesc(first)}, could we move your ${CV_TYPE_META[e.type].label.toLowerCase()} to ${cvRs.slot?cvDayLabel(cvRs.day)+' at '+cvRs.slot:'…'}? Reply here if that doesn’t suit and I’ll find another time.</div>`:''}`:''}`;
  qaDrawerOpen('Reschedule',body,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" ${cvRs.slot?'':'disabled'} onclick="cvReschedSave()">Move</button>`);
}
function cvReschedSave(){
  const e=cvFind(cvRs.id), dur=cvMins(e.end)-cvMins(e.start);
  e.dateISO=cvRs.day; e.start=cvRs.slot; e.end=cvHm(cvMins(cvRs.slot)+dur);
  qaDrawerClose(); cvState.cursor=new Date(e.dateISO+'T00:00:00'); cvRender();
  showToast(`Moved to ${cvDayLabel(e.dateISO)}, ${e.start}${cvRs.notify?` · ${e.contact.split(' ')[0]} was messaged`:''} · Google Calendar updated`);
}
// ---------- Flow 3 · new event with clash check ----------
let cvNf=null;
cvOpenNew=function(){
  const iso=cvISO(cvState.view==='month'?cvToday():cvState.cursor);
  cvNf={type:'viewing',opp:'',date:iso<cvISO(cvToday())?cvISO(cvToday()):iso,start:'10:00',dur:45,force:false,title:''};
  cvNewRender();
};
function cvNewLoc(){const o=OPPS.find(x=>x.id===cvNf.opp);return cvNf.type==='video'?'Google Meet':cvNf.type==='call'?'Phone':cvNf.type==='signing'?'Notary':cvNf.type==='internal'?'Office':o?`${o.devs[0]} sales suite`:'Sales suite';}
function cvNewClash(){const s=cvMins(cvNf.start),e=s+cvNf.dur;return cvBuildEvents().find(x=>x.dateISO===cvNf.date&&x.end&&s<cvMins(x.end)&&e>cvMins(x.start))||null;}
function cvNewRender(){
  const o=OPPS.find(x=>x.id===cvNf.opp), clash=cvNewClash();
  const near=clash?cvFreeSlots(cvNf.date,cvNf.dur,'rep').filter(t=>Math.abs(cvMins(t)-cvMins(cvNf.start))<=180).slice(0,4):[];
  const opps=OPPS.filter(x=>!EXIT_STAGES.includes(x.stage)).sort((a,b)=>a.lead.localeCompare(b.lead));
  const types=[['viewing','Viewing'],['call','Call'],['video','Video call'],['signing','Signing'],['internal','Internal']];
  document.querySelector('#cvDrawer .od-head span').textContent='New event';
  document.getElementById('cvDrawerBody').innerHTML=`
    <div class="od-field"><label>Type</label><div class="cv-days">${types.map(([k,l])=>`<button type="button" class="${cvNf.type===k?'on':''}" onclick="cvNf.type='${k}';cvNewRender()">${l}</button>`).join('')}</div></div>
    ${cvNf.type==='internal'?`<div class="od-field"><label for="cv-nf-title">Title</label><input id="cv-nf-title" value="${xesc(cvNf.title)}" oninput="cvNf.title=this.value" placeholder="e.g. Team stand-up"></div>`:
    `<div class="od-field"><label for="cv-nf-opp">Linked record</label><select id="cv-nf-opp" onchange="cvNf.opp=this.value;cvNewRender()"><option value="">Choose an opportunity</option>${opps.map(x=>`<option value="${x.id}" ${x.id===cvNf.opp?'selected':''}>${xesc(x.lead)} · ${x.id} · ${xesc(x.devs[0]||'')}</option>`).join('')}</select><span class="cv-mu">Every appointment belongs to a record.</span></div>`}
    <div class="od-field"><label for="cv-nf-date">Day</label><input id="cv-nf-date" type="date" value="${cvNf.date}" onchange="cvNf.date=this.value;cvNf.force=false;cvNewRender()"></div>
    <div class="od-field" style="display:flex;gap:10px"><div style="flex:1"><label for="cv-nf-start">Start</label><input id="cv-nf-start" type="time" value="${cvNf.start}" onchange="cvNf.start=this.value;cvNf.force=false;cvNewRender()"></div><div style="flex:1"><label for="cv-nf-dur">Length</label><select id="cv-nf-dur" onchange="cvNf.dur=+this.value;cvNewRender()">${[20,30,45,60,90].map(n=>`<option value="${n}" ${n===cvNf.dur?'selected':''}>${n} min</option>`).join('')}</select></div></div>
    <div class="od-field"><label>Place</label><div class="cv-mu">${xesc(cvNewLoc())} · filled in from the type${o?' and development':''}</div></div>
    ${clash&&!cvNf.force?`<div class="cv-clash"><b>Overlaps ${xesc(clash.title)}</b> · ${clash.start}–${clash.end}<div class="cv-slots">${near.map(t=>`<button type="button" onclick="cvNf.start='${t}';cvNewRender()">${t}</button>`).join('')}<button type="button" class="ghost" onclick="cvNf.force=true;cvNewRender()">Book anyway</button></div></div>`:''}
    ${o?`<div class="cv-preview"><div class="cv-mu">${xesc(o.lead.split(' ')[0])} gets on WhatsApp</div>Hi ${xesc(o.lead.split(' ')[0])}, your ${cvNf.type==='video'?'video call':cvNf.type} is booked for ${cvDayLabel(cvNf.date)} at ${cvNf.start}, ${xesc(cvNewLoc())}. I’ll send a reminder the day before.</div>`:''}`;
  document.getElementById('cvDrawer').classList.add('open');
  document.getElementById('cvDrawerScrim').classList.add('on');
}
cvSaveNew=function(){
  const o=OPPS.find(x=>x.id===cvNf.opp);
  if(cvNf.type!=='internal'&&!o){showToast('Link the appointment to an opportunity');return;}
  if(cvNf.type==='internal'&&!cvNf.title.trim()){showToast('Give the event a title');return;}
  if(cvNewClash()&&!cvNf.force){showToast('Pick a free time or book anyway');return;}
  const title=cvNf.type==='internal'?cvNf.title.trim():`${CV_TYPE_META[cvNf.type].label} · ${o.lead}`;
  cvExtra.push({id:Date.now(),title,type:cvNf.type,dateISO:cvNf.date,start:cvNf.start,end:cvHm(cvMins(cvNf.start)+cvNf.dur),contact:o?o.lead:'',location:cvNewLoc(),oppId:o?o.id:null,rem:o?['You · 1 hour before',`${o.lead.split(' ')[0]} · confirmation sent now`]:[]});
  if(o){getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`${CV_TYPE_META[cvNf.type].label} booked · ${cvDayLabel(cvNf.date)} ${cvNf.start}`});getExt(o).appts=[{label:CV_TYPE_META[cvNf.type].label,when:`${cvDayLabel(cvNf.date)} · ${cvNf.start}`}];}
  cvCloseNew(); cvState.cursor=new Date(cvNf.date+'T00:00:00'); cvRender();
  showToast(o?`${CV_TYPE_META[cvNf.type].label} booked with ${o.lead} · confirmation sent on WhatsApp`:'Event added to calendar');
};
// ---------- Flow 9 · log how it went ----------
let cvOc=null;
function cvOutcomeOpen(id){cvClosePop();cvOc={id,what:'held',int:'Interested',units:[],next:'Send price list',note:''};cvOutcomeRender();}
function cvOutcomeRender(){
  const e=cvFind(cvOc.id), o=e.oppId?OPPS.find(x=>x.id===e.oppId):null, first=(e.contact||'').split(' ')[0];
  const free=[...Array(5)].flatMap((_,i)=>cvFreeSlots(cvISO(cvOffsetDate(i+1)),45,'rep').slice(0,1).map(t=>[cvISO(cvOffsetDate(i+1)),t])).slice(0,2);
  const body=`<div class="cv-mu" style="margin-bottom:10px">${xesc(e.title)} · ${cvDayLabel(e.dateISO)}, ${e.start}–${e.end}</div>
    <div class="od-field"><label>What happened</label><div class="cv-days">${[['held','Held'],['noshow','Didn’t show'],['moved','Rescheduled']].map(([k,l])=>`<button type="button" class="${cvOc.what===k?'on':''}" onclick="cvOc.what='${k}';cvOutcomeRender()">${l}</button>`).join('')}</div></div>
    ${cvOc.what==='held'?`<div class="od-field"><label>Interest</label><div class="cv-days">${['Interested','Thinking it over','Not interested'].map(l=>`<button type="button" class="${cvOc.int===l?'on':''}" onclick="cvOc.int='${l}';cvOutcomeRender()">${l}</button>`).join('')}</div></div>
      ${o&&o.units.length?`<div class="od-field"><label>Units seen</label><div class="cv-days">${o.units.map(u=>`<button type="button" class="${cvOc.units.includes(u)?'on':''}" onclick="cvOc.units=cvOc.units.includes('${u}')?cvOc.units.filter(x=>x!=='${u}'):[...cvOc.units,'${u}'];cvOutcomeRender()">${u}</button>`).join('')}</div></div>`:''}
      <div class="od-field"><label for="cv-oc-next">Next step</label><select id="cv-oc-next" onchange="cvOc.next=this.value">${['Send price list','Book another appointment','Send payment plan','Nothing yet'].map(n=>`<option ${n===cvOc.next?'selected':''}>${n}</option>`).join('')}</select></div>
      <div class="od-field"><label for="cv-oc-note">Note</label><textarea id="cv-oc-note" rows="3" oninput="cvOc.note=this.value" placeholder="What they liked, what worries them…">${xesc(cvOc.note)}</textarea></div>`:''}
    ${cvOc.what==='noshow'?`<div class="cv-preview"><div class="cv-mu">Draft to ${xesc(first)} · nothing is sent until you approve</div>Hi ${xesc(first)}, sorry we missed each other. I have two times free: ${free.map(([d,t])=>`${cvDayLabel(d)} at ${t}`).join(' or ')}. Would either work for you?</div>`:''}
    ${cvOc.what==='moved'?`<div class="cv-mu">Pick the new time on the next step.</div>`:''}`;
  qaDrawerOpen('Log outcome',body,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="cvOutcomeSave()">${cvOc.what==='noshow'?'Approve and send':cvOc.what==='moved'?'Continue':'Save outcome'}</button>`);
}
function cvOutcomeSave(){
  const e=cvFind(cvOc.id), o=e.oppId?OPPS.find(x=>x.id===e.oppId):null;
  if(cvOc.what==='moved'){qaDrawerClose();cvReschedOpen(e.id);return;}
  e.needs=false;
  if(cvOc.what==='held'){
    e.outcome=`Held · ${cvOc.int}${cvOc.units.length?' · saw '+cvOc.units.join(', '):''} · next: ${cvOc.next.toLowerCase()}`;
    if(o){const x=getExt(o);x.comms.unshift({ch:'sys',t:'Just now',text:`${CV_TYPE_META[e.type].label} held · ${cvOc.int}${cvOc.note?' · '+cvOc.note:''}`});if(cvOc.next!=='Nothing yet')x.next={label:cvOc.next,due:'Today',overdue:false};if(e.type==='viewing'&&!EXIT_STAGES.includes(o.stage))o.stage='Appointment Completed';}
    showToast(`Outcome saved${cvOc.next!=='Nothing yet'?' · '+cvOc.next+' added for today':''}`);
  } else {
    e.outcome='Didn’t show · rebooking message sent';
    if(o){const x=getExt(o);o.noShows=o.noShows||{appt:0,contract:0};o.noShows.appt++;if(!EXIT_STAGES.includes(o.stage))o.stage='Appointment No Show';x.comms.unshift({ch:'sys',t:'Just now',text:'No-show logged · rebooking message sent with two free times'});}
    showToast(`No-show logged · ${e.contact.split(' ')[0]} was sent two free times`);
  }
  qaDrawerClose(); cvRender(); if(typeof pipeRenderAll==='function')pipeRenderAll();
}
// ---------- Flow 5 · booking links and the client booking page ----------
const CV_LINKS=[['viewing','Viewing',45],['video','Video call',30],['call','Phone call',20]];
function cvLinksOpen(){
  const body=`<div class="cv-mu" style="margin-bottom:10px">Each type has its own link. Clients pick a free time inside booking hours, and the booking arrives as a lead. Signings have no link.</div>
    ${CV_LINKS.map(([k,l,d])=>`<div class="cv-link"><div><b>${l}</b> · ${d} min<div class="cv-mu">bricly.link/sam/${k}</div></div><button class="btn-ghost" onclick="showToast('Link copied')">Copy</button><button class="btn-ghost" onclick="cvBookOpen('${k}')">Open as a client</button></div>`).join('')}
    <div class="cv-link"><div><b>All types</b><div class="cv-mu">bricly.link/sam · the client chooses</div></div><button class="btn-ghost" onclick="showToast('Link copied')">Copy</button></div>
    <div class="cv-mu" style="margin-top:12px">Booking hours: Mon–Fri 09:00–18:00, Sat 10:00–13:00 · 15 min gap · 4 hours’ notice${cvGcal!=='connected'?' · <b>paused until Google Calendar syncs</b>':''}</div>`;
  qaDrawerOpen('Booking links',body,`<button class="btn-ghost" onclick="qaDrawerClose();go('settings');stGo('p:calendar')">Calendar settings</button><button class="btn-primary" onclick="qaDrawerClose()">Done</button>`);
}
let cvBk=null;
function cvBookOpen(type){
  if(cvGcal!=='connected'){showToast('The booking link is paused until Google Calendar syncs again');return;}
  qaDrawerClose(); cvBk={type,step:'pick',day:null,slot:null,name:'',phone:'',email:'',consent:true}; cvBookRender();
}
function cvBookRender(){
  const [k,l,dur]=CV_LINKS.find(x=>x[0]===cvBk.type);
  const days=[...Array(10)].map((_,i)=>cvISO(cvOffsetDate(i))).filter(d=>cvFreeSlots(d,dur,'client').length);
  if(!cvBk.day) cvBk.day=days[0];
  let body;
  if(cvBk.step==='pick') body=`<div class="cv-mu">Sam · ${l} · ${dur} min · La Lex sales suite</div>
    <div class="cv-days" style="margin:12px 0">${days.map(d=>`<button type="button" class="${d===cvBk.day?'on':''}" onclick="cvBk.day='${d}';cvBk.slot=null;cvBookRender()">${cvDayLabel(d)}</button>`).join('')}</div>
    <div class="cv-slots">${cvFreeSlots(cvBk.day,dur,'client').map(t=>`<button type="button" onclick="cvBk.slot='${t}';cvBk.step='form';cvBookRender()">${t}</button>`).join('')}</div>`;
  else if(cvBk.step==='form') body=`<div class="cv-mu" style="margin-bottom:10px">${l} · ${cvDayLabel(cvBk.day)} at ${cvBk.slot} · <button class="cv-linkbtn" onclick="cvBk.step='pick';cvBookRender()">Change</button></div>
    <div class="od-field"><label for="cv-bk-name">Name</label><input id="cv-bk-name" value="${xesc(cvBk.name)}" oninput="cvBk.name=this.value"></div>
    <div class="od-field"><label for="cv-bk-phone">WhatsApp number</label><input id="cv-bk-phone" type="tel" value="${xesc(cvBk.phone)}" oninput="cvBk.phone=this.value"></div>
    <div class="od-field"><label for="cv-bk-email">Email</label><input id="cv-bk-email" type="email" value="${xesc(cvBk.email)}" oninput="cvBk.email=this.value"></div>
    <label class="cv-toggle"><input type="checkbox" ${cvBk.consent?'checked':''} onchange="cvBk.consent=this.checked"> Send me the confirmation and a reminder on WhatsApp</label>`;
  else body=`<div class="cv-booked"><b>You’re booked</b><div>${l} with Sam · ${cvDayLabel(cvBk.day)} at ${cvBk.slot}</div><div class="cv-mu">La Lex sales suite · confirmation sent on WhatsApp</div></div>`;
  const foot=cvBk.step==='form'?`<button class="btn-ghost" onclick="cvBk.step='pick';cvBookRender()">Back</button><button class="btn-primary" onclick="cvBookConfirm()">Book</button>`:cvBk.step==='done'?`<button class="btn-primary" onclick="qaDrawerClose();cvState.cursor=new Date(cvBk.day+'T00:00:00');cvState.view='week';cvRender()">See it in Sam’s calendar</button>`:`<button class="btn-ghost" onclick="qaDrawerClose()">Close</button>`;
  qaDrawerOpen('Client view · book a '+l.toLowerCase(),body,foot);
}
function cvBookConfirm(){
  if(!cvBk.name.trim()||cvBk.phone.replace(/\D/g,'').length<7){showToast('Add a name and a WhatsApp number');return;}
  const [k,l,dur]=CV_LINKS.find(x=>x[0]===cvBk.type);
  const o={id:'OPP-'+(1041+OPPS.length+60),lead:cvBk.name.trim(),devs:['La Lex'],units:[],stage:'Appointment Booked',source:'Booking link',budget:null,value:null,tags:[],rep:CV_ME,next:{d:'—',t:'Prepare for the '+l.toLowerCase()},ago:'Today',buyer:{phone:cvBk.phone,email:cvBk.email}};
  OPPS.push(o); getExt(o).buyer={phone:cvBk.phone,email:cvBk.email,type:'Buyer'};
  getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`${l} booked through Sam’s booking link · ${cvDayLabel(cvBk.day)} ${cvBk.slot}`});
  cvExtra.push({id:Date.now(),title:`${l} · ${o.lead}`,type:k,dateISO:cvBk.day,start:cvBk.slot,end:cvHm(cvMins(cvBk.slot)+dur),contact:o.lead,location:k==='viewing'?'La Lex sales suite':k==='video'?'Google Meet':'Phone',oppId:o.id,src:'Booking link',rem:[`${o.lead.split(' ')[0]} · confirmation sent`,'You · 1 hour before']});
  cvBk.step='done'; cvBookRender(); if(typeof pipeRenderAll==='function')pipeRenderAll();
}
// ---------- Flow 1d · team day (managers) and Flow 6 sync banner ----------
function cvTeamHtml(){
  const iso=cvISO(cvState.cursor), reps=Object.values(CV_OWNERS);
  const gridH=CV_HOURS.length*44;
  const head=`<div></div>`+reps.map(r=>`<div class="cv-dowhead">${xesc(r)}</div>`).join('');
  const labelCol=`<div>${CV_HOURS.map(h=>`<div class="cv-hour-label" style="height:44px">${h}:00</div>`).join('')}</div>`;
  const cols=reps.map(r=>{
    const evs=(r===CV_ME?cvBuildEvents():cvSeedEvents().filter(e=>e.owner===r)).filter(e=>e.dateISO===iso&&!e.cancelled);
    return `<div class="cv-hour-col" style="height:${gridH}px">${CV_HOURS.map(()=>'<div class="cv-hour-line"></div>').join('')}${evs.map(e=>`<div class="cv-evblock ${e.type==='busy'?'busy':''}" style="--c:${CV_TYPE_META[e.type].color};top:${cvTimeToY(e.start)}px;height:${cvDurationH(e.start,e.end)}px" onclick="cvShowPop(event,'${e.id}')"><b>${xesc(e.title)}</b>${e.start}</div>`).join('')}</div>`;
  }).join('');
  return `<div class="cv-hourgrid team" style="grid-template-columns:46px repeat(${reps.length},minmax(0,1fr))">${head}${labelCol}${cols}</div>`;
}
const cvRenderBase=cvRender;
cvRender=function(){
  const mgr=typeof curPersona!=='undefined'&&(curPersona==='manager'||curPersona==='owner');
  if(!mgr) cvTeam=false;
  cvRenderBase();
  const seg=document.getElementById('cv-view-seg');
  if(seg){
    if(mgr) seg.insertAdjacentHTML('beforeend',`<button class="${cvTeam?'on':''}" onclick="cvTeam=!cvTeam;if(cvTeam)cvState.view='day';cvRender()">Team</button>`);
    if(cvTeam) seg.querySelectorAll('button').forEach(b=>{if(b.textContent!=='Team')b.classList.remove('on');});
  }
  const grid=document.getElementById('cv-grid');
  if(grid){
    if(cvTeam&&cvState.view==='day') grid.innerHTML=cvTeamHtml();
    grid.querySelectorAll('.cv-evblock,.cv-chip,.cv-day-card').forEach(el=>{const m=String(el.getAttribute('onclick')||'').match(/cvShowPop\(event,'?([^')]+)'?\)/);const e=m&&cvFind(m[1]);if(e&&cvNeedsOutcome(e))el.classList.add('needs');if(e&&e.type==='busy')el.classList.add('busy');});
  }
  cvToolbarExtras(); cvSyncBanner(); cvSideOutcome();
};
function cvToolbarExtras(){
  const bar=document.querySelector('#p-calendar .crm-page-controls .toolbar'); if(!bar||bar.querySelector('#cv-links-btn')) return;
  bar.insertAdjacentHTML('afterbegin',`<button class="btn-ghost" id="cv-sync-btn" onclick="go('settings');stGo('p:calendar')"></button><button class="btn-ghost" id="cv-links-btn" onclick="cvLinksOpen()">Booking links</button>`);
}
function cvSyncBanner(){
  const btn=document.getElementById('cv-sync-btn'); if(btn) btn.textContent=cvGcal==='connected'?'Google Calendar · synced':cvGcal==='error'?'Google Calendar · sync stopped':'Connect Google Calendar';
  const wrap=document.querySelector('#p-calendar .cv-layout'); if(!wrap) return;
  let b=document.getElementById('cv-banner');
  if(cvGcal==='connected'){if(b)b.remove();return;}
  if(!b){b=document.createElement('div');b.id='cv-banner';wrap.before(b);}
  b.className='cv-banner '+(cvGcal==='error'?'err':'');
  b.innerHTML=cvGcal==='error'?`<b>Google Calendar sync stopped</b><span>Google asked you to sign in again. Your booking link is paused so nobody books over a clash.</span><button class="btn-ghost" onclick="cvGcal='connected';cvRender();showToast('Signed in · sync resumed')">Sign in again</button>`
    :`<b>Connect Google Calendar</b><span>Your Google busy time will block booking slots, and Bricly appointments appear in Google.</span><button class="btn-primary" onclick="cvGcal='connected';cvRender();showToast('Google Calendar connected')">Connect</button>`;
}
function cvSideOutcome(){
  const side=document.querySelector('#p-calendar .cv-side'); if(!side) return;
  let card=document.getElementById('cv-needs-card');
  const list=cvBuildEvents().filter(cvNeedsOutcome).slice(0,3);
  if(!list.length){if(card)card.remove();return;}
  if(!card){card=document.createElement('div');card.id='cv-needs-card';card.className='dcard cv-needs-card';side.prepend(card);}
  card.innerHTML=`<h3>Outcome needed</h3>${list.map(e=>`<div class="cv-needs-row"><div><b>${xesc(e.title)}</b><div class="cv-mu">${cvDayLabel(e.dateISO)} · ended ${e.end}</div></div><button class="btn-ghost" onclick="cvOutcomeOpen('${e.id}')">Log</button></div>`).join('')}`;
}
cvState.view='week';
