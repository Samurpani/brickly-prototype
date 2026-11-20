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
// The public booking page, shown full screen as the client sees it. Month calendar + times, then details, then confirmation.
let cvBk=null;
// Meeting platforms. Only Google Meet creates links today; Zoom and Teams take a pasted link until their integration ships.
const CV_PLATFORMS=[['meet','Google Meet',null,'meet.google.com/…'],['zoom','Zoom','Date to be confirmed','zoom.us/j/…'],['teams','Microsoft Teams','Date to be confirmed','teams.microsoft.com/l/…']];
function cvPlatform(k){return CV_PLATFORMS.find(p=>p[0]===k)||CV_PLATFORMS[0];}
// One picker used by Book appointment and booking settings. onPick/onLink are JS snippets taking the value as `v`.
function cvPlatformHtml(cur,onPick,link,onLink,id){
  const p=cvPlatform(cur);
  return `<div class="ab-plat" role="radiogroup" aria-label="Meeting platform">${CV_PLATFORMS.map(([k,l,soon])=>`<label class="ab-plat-o ${k===cur?'on':''}"><input type="radio" name="${id}-plat" value="${k}" ${k===cur?'checked':''} onchange="${onPick.replace(/\bv\b/g,`'${k}'`)}"><span><b>${l}</b><span class="ab-mu">${soon?`Coming soon · ${soon}`:'Link created automatically'}</span></span></label>`).join('')}</div>
    ${p[2]?`<div class="ab-plat-own"><label for="${id}-link">Paste your own ${p[1]} link</label><input id="${id}-link" type="url" placeholder="https://${p[3]}" value="${xesc(link||'')}" oninput="${onLink}"><div class="ab-mu">Automatic ${p[1]} links aren’t available yet. The link you paste goes in the confirmation.</div></div>`
      :'<div class="ab-mu">A private Google Meet link is created for each booking and goes in the confirmation.</div>'}`;
}
function cvBkPlat(){return typeof CVS!=='undefined'?cvPlatform(CVS.platform):CV_PLATFORMS[0];}
function cvBkTeam(){return typeof CVS!=='undefined'&&CVS.cal==='account';}
function cvBkWho(){return cvBkTeam()?`the ${cvBkDev().name} team`:CV_ME;}
const CV_BK_CC=[['+356','Malta'],['+44','UK'],['+353','Ireland'],['+39','Italy'],['+49','Germany'],['+33','France'],['+31','Netherlands'],['+46','Sweden'],['+1','US / Canada']];
const CV_BK_BUDGET=['Under €250,000','€250,000 to €400,000','€400,000 to €600,000','€600,000 to €1M','Over €1M'];
const CV_BK_MEET='meet.google.com/kpx-rqwt-bnm';
const CV_BK_IC={
  clock:'<circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/>',pin:'<path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.6"/>',
  video:'<rect x="1.5" y="4" width="9" height="8" rx="1.5"/><path d="M10.5 7l4-2.2v6.4l-4-2.2"/>',phone:'<path d="M3 2h3l1 3-1.8 1.2a8 8 0 0 0 3.6 3.6L10 8l3 1v3a1.5 1.5 0 0 1-1.6 1.5A11.5 11.5 0 0 1 1.5 3.6 1.5 1.5 0 0 1 3 2z"/>',
  user:'<circle cx="8" cy="5.5" r="2.8"/><path d="M2.5 14c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/>',globe:'<circle cx="8" cy="8" r="6.2"/><path d="M1.8 8h12.4M8 1.8c2 2 2 10.4 0 12.4M8 1.8c-2 2-2 10.4 0 12.4"/>',
  cal:'<rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3"/>',check:'<path d="M3.5 8.5l3 3 6-7"/>',
  prev:'<path d="M10 3L5 8l5 5"/>',next:'<path d="M6 3l5 5-5 5"/>'};
function cvBkIc(k){return `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CV_BK_IC[k]}</svg>`;}
function cvBkType(){const [k,l,dur]=CV_LINKS.find(x=>x[0]===cvBk.type)||CV_LINKS[0];return {k,l,dur};}
function cvBkDev(){const name=String(cvBk.devFromLink||'La Lex').split(',')[0].trim();return (typeof DEVS!=='undefined'&&DEVS.find(d=>d.name===name))||{name,loc:'Malta'};}
function cvBkPlace(){const t=cvBkType(),d=cvBkDev();return t.k==='video'?cvBkPlat()[1]:t.k==='call'?'Phone call':`${d.name} sales suite, ${d.loc}`;}
function cvBkTz(iso){
  try{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Malta',timeZoneName:'short'}).formatToParts(new Date(iso+'T12:00:00'));return 'Malta time ('+p.find(x=>x.type==='timeZoneName').value+')';}
  catch(e){return 'Malta time';}
}
function cvBkLong(iso,year){return new Date(iso+'T00:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',...(year?{year:'numeric'}:{})});}
function cvBkLast(){const ahead=typeof CVS!=='undefined'?parseInt(CVS.rules.window)||30:30;const d=cvToday();d.setDate(d.getDate()+ahead);return d;}
function cvBkFree(iso){return cvFreeSlots(iso,cvBkType().dur,'client');}
function cvBookOpen(type,opts={}){
  if(cvGcal!=='connected'){showToast('The booking link is paused until Google Calendar syncs again');return;}
  qaDrawerClose();
  cvBk={type,step:'pick',day:null,slot:null,month:null,size:'desktop',tried:false,devFromLink:opts.dev||'La Lex',
    name:'',cc:'+356',phone:'',email:'',dev:[opts.dev||'La Lex',opts.unit].filter(Boolean).join(', '),budget:'',msg:'',consent:false};
  for(let i=0;i<=62&&!cvBk.day;i++){const iso=cvISO(cvOffsetDate(i));if(new Date(iso+'T00:00:00')>cvBkLast())break;if(cvBkFree(iso).length)cvBk.day=iso;}
  cvBk.month=(cvBk.day||cvISO(cvToday())).slice(0,7);
  cvBookRender();
  document.getElementById('cvPub')?.querySelector('.bp-title')?.focus();
}
function cvBookClose(){document.getElementById('cvPub')?.remove();document.removeEventListener('keydown',cvBkKey);}
function cvBkKey(e){if(e.key==='Escape')cvBookClose();}
function cvBkMonth(dir){
  const [y,m]=cvBk.month.split('-').map(Number), d=new Date(y,m-1+dir,1);
  cvBk.month=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; cvBookRender();
}
function cvBkCalHtml(){
  const [y,m]=cvBk.month.split('-').map(Number), first=new Date(y,m-1,1), days=new Date(y,m,0).getDate();
  const today=cvToday(), last=cvBkLast(), lead=(first.getDay()+6)%7;
  const canPrev=first>new Date(today.getFullYear(),today.getMonth(),1), canNext=new Date(y,m,1)<=last;
  const cells=[...Array(lead)].map(()=>'<span class="bp-blank"></span>');
  for(let n=1;n<=days;n++){
    const iso=`${y}-${String(m).padStart(2,'0')}-${String(n).padStart(2,'0')}`, dt=new Date(iso+'T00:00:00');
    const free=dt>=today&&dt<=last?cvBkFree(iso).length:0, sel=iso===cvBk.day, isToday=iso===cvISO(today);
    const label=`${cvBkLong(iso)}, ${free?free+(free===1?' time':' times')+' free':'no free times'}`;
    cells.push(free?`<button type="button" class="bp-day free ${sel?'sel':''} ${isToday?'today':''}" aria-pressed="${sel}" aria-label="${label}" data-day="${iso}" onclick="cvBk.day='${iso}';cvBk.slot=null;cvBookRender()">${n}</button>`
      :`<button type="button" class="bp-day ${isToday?'today':''}" disabled aria-label="${label}" data-day="${iso}">${n}</button>`);
  }
  return `<section class="bp-cal" aria-label="Choose a day">
    <div class="bp-cal-h"><button type="button" class="bp-nav" aria-label="Previous month" ${canPrev?'':'disabled'} onclick="cvBkMonth(-1)">${cvBkIc('prev')}</button>
      <b aria-live="polite">${first.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</b>
      <button type="button" class="bp-nav" aria-label="Next month" ${canNext?'':'disabled'} onclick="cvBkMonth(1)">${cvBkIc('next')}</button></div>
    <div class="bp-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<span class="bp-dow">${d}</span>`).join('')}${cells.join('')}</div>
    <div class="bp-legend"><span><i class="bp-k free"></i>Times free</span><span><i class="bp-k"></i>Fully booked or closed</span></div>
  </section>`;
}
function cvBkTimesHtml(){
  if(!cvBk.day) return `<section class="bp-times"><div class="bp-empty">Pick a day to see free times.</div></section>`;
  const t=cvBkType(), slots=cvBkFree(cvBk.day);
  return `<section class="bp-times" aria-label="Choose a time">
    <h2 class="bp-h2">${cvBkLong(cvBk.day)}</h2>
    <div class="bp-tz">${cvBkIc('globe')}Times are in ${cvBkTz(cvBk.day)}</div>
    <div class="bp-slots">${slots.map(s=>`<button type="button" class="bp-slot ${s===cvBk.slot?'on':''}" aria-pressed="${s===cvBk.slot}" onclick="cvBk.slot='${s}';cvBookRender()">${s}</button>`).join('')||'<div class="bp-empty">No free times left on this day.</div>'}</div>
    <button type="button" class="btn-primary bp-next" ${cvBk.slot?'':'disabled'} onclick="cvBk.step='form';cvBookRender()">${cvBk.slot?`Next: ${cvBk.slot} to ${cvHm(cvMins(cvBk.slot)+t.dur)}`:'Pick a time'}</button>
  </section>`;
}
function cvBkSumHtml(){
  const t=cvBkType(), end=cvHm(cvMins(cvBk.slot)+t.dur);
  return `<aside class="bp-sum">
    <div class="bp-sum-t">${t.l}, ${t.dur} min</div>
    <div class="bp-sum-r">${cvBkIc('cal')}<span>${cvBkLong(cvBk.day,true)}</span></div>
    <div class="bp-sum-r">${cvBkIc('clock')}<span>${cvBk.slot} to ${end}<br><span class="bp-mu">${cvBkTz(cvBk.day)}</span></span></div>
    <div class="bp-sum-r">${cvBkIc(t.k==='video'?'video':t.k==='call'?'phone':'pin')}<span>${xesc(cvBkPlace())}</span></div>
    <button type="button" class="bp-link" onclick="cvBk.step='pick';cvBookRender()">Change day or time</button>
  </aside>`;
}
const CV_BK_REQ={name:'cv-bk-name',phone:'cv-bk-phone',email:'cv-bk-email',consent:'cv-bk-consent'};
function cvBkErrors(){
  const e={};
  if(cvBk.name.trim().length<2) e.name='Enter your full name';
  const digits=cvBk.phone.replace(/\D/g,'');
  if(!digits) e.phone='Enter your WhatsApp number'; else if(digits.length<6) e.phone='This number looks too short';
  if(!cvBk.email.trim()) e.email='Enter your email'; else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cvBk.email.trim())) e.email='Enter an email like name@example.com';
  if(!cvBk.consent) e.consent='Tick the box so we can contact you about this booking';
  return e;
}
function cvBkSet(k,v){
  cvBk[k]=v; if(!cvBk.tried||!CV_BK_REQ[k]) return;
  const err=cvBkErrors()[k], el=document.getElementById(CV_BK_REQ[k]), msg=document.getElementById(CV_BK_REQ[k]+'-err');
  el?.setAttribute('aria-invalid',err?'true':'false'); el?.closest('.bp-f')?.classList.toggle('bad',!!err); if(msg) msg.textContent=err||'';
}
function cvBkFormHtml(){
  const e=cvBk.tried?cvBkErrors():{}, devs=typeof DEVS!=='undefined'?DEVS.map(d=>d.name):[];
  const req='<span class="bp-req" aria-hidden="true">*</span>';
  const field=(k,label,input)=>`<div class="bp-f ${e[k]?'bad':''}"><label for="${CV_BK_REQ[k]}">${label} ${req}</label>${input}<div class="bp-err" id="${CV_BK_REQ[k]}-err">${e[k]||''}</div></div>`;
  const inv=k=>`aria-invalid="${!!e[k]}" aria-describedby="${CV_BK_REQ[k]}-err" required`;
  return `<div class="bp-two">${cvBkSumHtml()}
    <form class="bp-form" novalidate onsubmit="event.preventDefault();cvBookConfirm()">
      <h2 class="bp-h2">Your details</h2>
      ${field('name','Full name',`<input id="cv-bk-name" autocomplete="name" value="${xesc(cvBk.name)}" oninput="cvBkSet('name',this.value)" ${inv('name')}>`)}
      ${field('phone','WhatsApp number',`<div class="bp-tel"><select id="cv-bk-cc" aria-label="Country code" onchange="cvBk.cc=this.value">${CV_BK_CC.map(([c,n])=>`<option value="${c}" ${c===cvBk.cc?'selected':''}>${n} ${c}</option>`).join('')}</select><input id="cv-bk-phone" type="tel" autocomplete="tel-national" inputmode="tel" placeholder="7912 3456" value="${xesc(cvBk.phone)}" oninput="cvBkSet('phone',this.value)" ${inv('phone')}></div>`)}
      ${field('email','Email',`<input id="cv-bk-email" type="email" autocomplete="email" value="${xesc(cvBk.email)}" oninput="cvBkSet('email',this.value)" ${inv('email')}>`)}
      <div class="bp-f"><label for="cv-bk-dev">Development or unit</label><input id="cv-bk-dev" list="cv-bk-devs" value="${xesc(cvBk.dev)}" oninput="cvBk.dev=this.value" aria-describedby="cv-bk-dev-hint"><datalist id="cv-bk-devs">${devs.map(d=>`<option value="${xesc(d)}">`).join('')}</datalist><div class="bp-hint" id="cv-bk-dev-hint">Filled in from your link. You can change it.</div></div>
      <div class="bp-f"><label for="cv-bk-budget">Budget range <span class="bp-opt">(optional)</span></label><select id="cv-bk-budget" onchange="cvBk.budget=this.value"><option value="">Choose a range</option>${CV_BK_BUDGET.map(b=>`<option ${b===cvBk.budget?'selected':''}>${b}</option>`).join('')}</select></div>
      <div class="bp-f"><label for="cv-bk-msg">Message <span class="bp-opt">(optional)</span></label><textarea id="cv-bk-msg" rows="3" placeholder="Anything we should know before we meet?" oninput="cvBk.msg=this.value">${xesc(cvBk.msg)}</textarea></div>
      <div class="bp-f bp-consent-f ${e.consent?'bad':''}"><label class="bp-consent"><input type="checkbox" id="cv-bk-consent" ${cvBk.consent?'checked':''} onchange="cvBkSet('consent',this.checked)" ${inv('consent')}>
        <span>I agree that ${xesc(cvBkTeam()?`the ${cvBkDev().name} team`:`${cvBkDev().name} and ${CV_ME}`)} can contact me about this booking on WhatsApp and email, and I accept the <a href="#" onclick="event.preventDefault()">privacy policy</a>. ${req}</span></label>
        <div class="bp-err" id="cv-bk-consent-err">${e.consent||''}</div></div>
      ${Object.keys(e).length?'<div class="bp-err bp-err-sum" role="alert">Check the fields marked in red.</div>':''}
      <button type="submit" class="btn-primary bp-submit">Confirm booking</button>
      <div class="bp-mu"><span aria-hidden="true">*</span> Required</div>
    </form></div>`;
}
function cvBkDoneHtml(){
  const t=cvBkType(), end=cvHm(cvMins(cvBk.slot)+t.dur), d=cvBkDev();
  const plat=cvBkPlat(), own=plat[2]?(CVS.ownLink||'').trim():'', who=cvBkWho(), Who=who.charAt(0).toUpperCase()+who.slice(1);
  const where=t.k==='video'?[plat[1],plat[2]?(own?`<a href="#" onclick="event.preventDefault()">${xesc(own.replace(/^https?:\/\//,''))}</a>`:`${xesc(Who)} will send the ${plat[1]} link before the call`):`<a href="#" onclick="event.preventDefault()">${CV_BK_MEET}</a>`]
    :t.k==='call'?['Phone call',`${xesc(Who)} will call you on ${xesc(cvBk.cc+' '+cvBk.phone)}`]
    :['Place',`${xesc(d.name)} sales suite, ${xesc(d.loc)} <a href="#" onclick="event.preventDefault()">Get directions</a>`];
  return `<div class="bp-done cv-booked" role="status">
    <span class="bp-done-ic">${cvBkIc('check')}</span>
    <h2 class="bp-h2">You’re booked</h2>
    <p class="bp-mu">We sent the details to your WhatsApp and to ${xesc(cvBk.email)}.</p>
    <dl class="bp-dl">
      <div><dt>What</dt><dd>${t.l} with ${xesc(who)}, ${t.dur} min</dd></div>
      <div><dt>Date</dt><dd>${cvBkLong(cvBk.day,true)}</dd></div>
      <div><dt>Time</dt><dd>${cvBk.slot} to ${end}, ${cvBkTz(cvBk.day)}</dd></div>
      <div><dt>${where[0]}</dt><dd>${where[1]}</dd></div>
    </dl>
    <div class="bp-acts"><button type="button" class="btn-ghost" onclick="showToast('Opens Google Calendar')">Add to Google Calendar</button><button type="button" class="btn-ghost" onclick="showToast('Calendar file downloaded')">Download .ics</button></div>
    <p class="bp-mu">Need to change it? Reply to the WhatsApp message and ${cvBkTeam()?'we':xesc(CV_ME)} will move it.</p>
  </div>`;
}
function cvBookRender(){
  if(!cvBk) return;
  const t=cvBkType(), d=cvBkDev(), photo=d.photo&&typeof awAsset==='function'?awAsset(d.photo):'';
  const who=cvBkWho(), how=t.k==='video'?['video',`Video call on ${cvBkPlat()[1]}`]:t.k==='call'?['phone',`${who.charAt(0).toUpperCase()+who.slice(1)} calls you`]:['pin',`In person at the ${d.name} sales suite`];
  const body=cvBk.step==='pick'?`<div class="bp-pick">${cvBkCalHtml()}${cvBkTimesHtml()}</div>`:cvBk.step==='form'?cvBkFormHtml():cvBkDoneHtml();
  let el=document.getElementById('cvPub');
  if(!el){el=document.createElement('div');el.id='cvPub';el.className='bp-wrap';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Booking page as clients see it');document.body.appendChild(el);document.addEventListener('keydown',cvBkKey);}
  const scroll=el.querySelector('.bp-stage')?.scrollTop||0;
  el.innerHTML=`<div class="bp-bar">
      <span class="bp-bar-l"><b>Client view</b><span class="bp-url">${typeof cvsLink==='function'?cvsLink(CVS_BT.find(b=>b[0]===t.k)?.[4]||t.k):'bricly.link/sam/'+t.k}</span></span>
      <span class="bp-seg" role="group" aria-label="Preview size">${[['desktop','Desktop'],['mobile','Mobile']].map(([k,l])=>`<button type="button" class="${cvBk.size===k?'on':''}" aria-pressed="${cvBk.size===k}" onclick="cvBk.size='${k}';cvBookRender()">${l}</button>`).join('')}</span>
      ${cvBk.step==='done'?`<button type="button" class="btn-ghost bp-bar-btn" onclick="cvBookClose();go('calendar');cvState.cursor=new Date(cvBk.day+'T00:00:00');cvState.view='week';cvRender()">See it in ${CV_ME}’s calendar</button>`:''}
      <button type="button" class="btn-ghost bp-bar-btn" onclick="cvBookClose()">Close preview</button></div>
    <div class="bp-stage"><div class="bp-frame ${cvBk.size}"><div class="bp-page">
      <header class="bp-head">
        ${photo?`<img class="bp-hero" src="${xesc(photo)}" alt="" onerror="this.remove()">`:''}
        <div class="bp-brand"><span class="bp-logo" aria-hidden="true">${xesc(d.name.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase())}</span><span><b>${xesc(d.name)}</b><span class="bp-mu">${xesc(d.loc)}, Malta</span></span></div>
        <h1 class="bp-title" tabindex="-1">Book a ${t.l.toLowerCase()}</h1>
        <div class="bp-meta"><span>${cvBkIc('clock')}${t.dur} min</span><span>${cvBkIc(how[0])}${xesc(how[1])}</span><span class="bp-with">${cvBkIc('user')}With ${xesc(who)}</span></div>
      </header>
      <main class="bp-body bp-step-${cvBk.step}">${body}</main>
      <footer class="bp-foot">Booking by Bricly</footer>
    </div></div></div>`;
  el.querySelector('.bp-stage').scrollTop=scroll;
}
function cvBookConfirm(){
  cvBk.tried=true;
  const errs=cvBkErrors();
  if(Object.keys(errs).length){cvBookRender();document.getElementById(CV_BK_REQ[Object.keys(errs)[0]])?.focus();return;}
  const t=cvBkType(), dev=(cvBk.dev.split(',')[0]||'').trim()||cvBkDev().name, unit=(cvBk.dev.match(/#\w+/)||[])[0];
  const budget={'Under €250,000':250,'€250,000 to €400,000':400,'€400,000 to €600,000':600,'€600,000 to €1M':1000,'Over €1M':1500}[cvBk.budget]||null;
  const phone=`${cvBk.cc} ${cvBk.phone.trim()}`, email=cvBk.email.trim();
  const o={id:'OPP-'+(1041+OPPS.length+60),lead:cvBk.name.trim(),devs:[dev],units:unit?[unit]:[],stage:'Appointment Booked',source:'Booking link',budget,value:null,tags:[],rep:CV_ME,next:{d:'—',t:'Prepare for the '+t.l.toLowerCase()},ago:'Today',buyer:{phone,email}};
  OPPS.push(o); const x=getExt(o); x.buyer={phone,email,type:'Buyer',consent:true};
  x.comms.unshift({ch:'sys',t:'Just now',text:`${t.l} booked through ${CV_ME}’s booking link · ${cvDayLabel(cvBk.day)} ${cvBk.slot}`});
  if(cvBk.msg.trim()) x.comms.unshift({ch:'note',dir:'in',who:o.lead,t:'Just now',text:xesc(cvBk.msg.trim())});
  cvExtra.push({id:Date.now(),title:`${t.l} · ${o.lead}`,type:t.k,dateISO:cvBk.day,start:cvBk.slot,end:cvHm(cvMins(cvBk.slot)+t.dur),contact:o.lead,location:t.k==='viewing'?`${dev} sales suite`:t.k==='video'?(cvBkPlat()[2]?`${cvBkPlat()[1]}${CVS.ownLink?' · '+CVS.ownLink:''}`:'Google Meet · '+CV_BK_MEET):'Phone',oppId:o.id,src:'Booking link',rem:[`${o.lead.split(' ')[0]} · confirmation sent`,'You · 1 hour before']});
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
