/* ═══════════════ BOOK AN APPOINTMENT (one drawer everywhere) ═══════════════
   Calendar "New appointment" sheet from the Bricly Calendar design: pick the type first, then the
   details that type needs. Used from the calendar, the opportunity (Actions, rail, quick panel,
   timeline), the contact page and POS booking. Every booking lands on the calendar and the record.
   Guests can be invited by email; they get the time, place and a calendar file, never the record. */

const AB_TYPES=[
  ['viewing','Viewing',45,'At the sales suite or on site'],
  ['appointment','Appointment',30,'In person or online'],
  ['signing','Signing',60,'POS, final deed or hold review'],
  ['internal','Internal',30,'Team only · no buyer'],
];
const AB_LENS=[15,30,45,60,90];
const AB_SIGN=[['pos','Promise of sale (POS)'],['deed','Final deed'],['hold','Hold review'],['other','Other signing']];
const AB_VIDEO=[['meet','Google Meet'],['zoom','Zoom'],['teams','Microsoft Teams']];
const AB_TEAM=[['Rachel Mifsud','rachel.mifsud@lalex.mt','Sales manager'],['Karl Zammit','karl.zammit@lalex.mt','Sales rep'],['Maria Farrugia','maria.farrugia@lalex.mt','Sales rep']];
let AB=null;

const abE=s=>xesc(String(s??''));
const abT=k=>AB_TYPES.find(t=>t[0]===k)||AB_TYPES[0];
const abOpp=()=>AB&&AB.opp?OPPS.find(o=>o.id===AB.opp):null;
const abFirst=o=>o.lead.split(' ')[0];
function abContact(o){return o&&typeof CONTACTS!=='undefined'?(CONTACTS.find(c=>(c.oppIds||[]).includes(o.id))||CONTACTS.find(c=>c.name===o.lead)||null):null;}
function abMeta(k){return CV_TYPE_META[k]||CV_TYPE_META[k==='video'?'virtual':'meeting']||{label:abT(k)[1],color:'#7d7a72'};}
function abValidEmail(v){return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v);}

// ---------- open ----------
function abOpen(opts={}){
  const o=opts.opp?(typeof opts.opp==='string'?OPPS.find(r=>r.id===opts.opp):opts.opp):null;
  const today=cvISO(cvToday()), type=opts.type||'viewing', c=abContact(o);
  AB={opp:o?o.id:'',lockRec:!!o&&opts.lockRec!==false,type,dur:abT(type)[2],date:opts.date&&opts.date>=today?opts.date:today,start:opts.start||'10:00',force:false,
    mode:'book',sign:opts.sign||'pos',video:'meet',fmt:'person',signUnit:'',holdIt:true,uq:'',uFind:false,place:'',placeEdited:false,title:'',notes:'',
    remind:(typeof CVS==='undefined'||!!CVS.remOn.confirm)&&(!c||!c.consent||c.consent.wa!==false),guests:[],gErr:'',origin:opts.origin||'opp',checks:[],linkCh:'wa'};
  if(AB.date===today){const now=new Date(),m=now.getHours()*60+now.getMinutes();if(cvMins(AB.start)<=m){const f=cvFreeSlots(today,AB.dur,'rep')[0];if(f)AB.start=f;else AB.date=cvISO(cvOffsetDate(1));}}
  if(!opts.start&&abClash()){const f=cvFreeSlots(AB.date,AB.dur,'rep').find(t=>cvMins(t)>=540)||cvFreeSlots(AB.date,AB.dur,'rep')[0];if(f)AB.start=f;}
  abSignInit();
  abRender();
}
function abSet(k,v){AB[k]=v;if(k==='type'){AB.dur=abT(v)[2];AB.placeEdited=false;AB.force=false;if(v==='internal'&&!AB.lockRec)AB.opp='';if(v==='signing')abSignInit();}if(k==='fmt'||k==='video')AB.placeEdited=false;if(k==='sign'&&!AB.signUnit)abSignInit();if(['date','start','dur'].includes(k))AB.force=false;abRender();}
function abPlace(){
  if(AB.placeEdited) return AB.place;
  const o=abOpp(), dev=o?o.devs[0]:'';
  return AB.type==='viewing'?(dev?`${dev} sales suite`:'Sales suite'):AB.type==='appointment'?(AB.fmt==='online'?AB_VIDEO.find(v=>v[0]===AB.video)[1]:(dev?`${dev} sales suite`:'Office')):AB.type==='signing'?(AB.sign==='hold'?'Office':'Notary Vella, Valletta'):'Office';
}
function abEnd(){return cvHm(cvMins(AB.start)+AB.dur);}
function abClash(){const s=cvMins(AB.start),e=s+AB.dur;return cvBuildEvents().find(x=>x.dateISO===AB.date&&x.end&&!x.cancelled&&s<cvMins(x.end)&&e>cvMins(x.start))||null;}
function abLabel(){return AB.type==='signing'?(AB.sign==='pos'?'POS signing':AB.sign==='deed'?'Final deed':AB.sign==='hold'?'Hold review':'Signing'):abT(AB.type)[1];}

// ---------- render ----------
const abChip=(on,label,fn,extra='')=>`<button type="button" class="ab-chip ${on?'on':''}" aria-pressed="${on}" onclick="${fn}" ${extra}>${label}</button>`;
function abRender(){
  const o=abOpp(), first=o?abFirst(o):'', c=abContact(o), today=cvISO(cvToday());
  const clash=abClash(), near=clash?cvFreeSlots(AB.date,AB.dur,'rep').filter(t=>Math.abs(cvMins(t)-cvMins(AB.start))<=180).slice(0,4):[];
  const opps=OPPS.filter(x=>!EXIT_STAGES.includes(x.stage)).sort((a,b)=>a.lead.localeCompare(b.lead));
  const days=[0,1,2,3,4].map(i=>cvISO(cvOffsetDate(i)));
  const canLink=o&&['viewing','appointment'].includes(AB.type);
  if(!canLink) AB.mode='book';
  const head=`<div class="ab-sub">${o?`Linked to ${abE(o.lead)} · ${o.id}, so it shows on the record, in Today and on your calendar.`:AB.type==='internal'?'A team event. It blocks your time but no buyer is told.':'Link it to a record so it shows on the opportunity and in Today.'}</div>`;
  const typeHtml=`<div class="od-field"><label>Type</label><div class="ab-types" role="radiogroup" aria-label="Appointment type">${AB_TYPES.filter(t=>!(t[0]==='internal'&&AB.lockRec)).map(([k,l,,s])=>`<button type="button" role="radio" aria-checked="${AB.type===k}" class="ab-type ${AB.type===k?'on':''}" onclick="abSet('type','${k}')"><span class="ab-sw" style="background:${abMeta(k).color}"></span><b>${l}</b><em>${s}</em></button>`).join('')}</div></div>`;
  const recHtml=AB.type==='internal'?`<div class="od-field"><label for="ab-title">Title</label><input id="ab-title" value="${abE(AB.title)}" oninput="AB.title=this.value" placeholder="e.g. Team stand-up"></div>`
    :AB.lockRec&&o?`<div class="od-field"><label>Linked record</label><div class="ab-rec">Opportunity · ${abE(o.lead)} · ${o.id} · ${abE(o.devs.join(', '))}</div></div>`
    :`<div class="od-field"><label for="ab-opp">Linked record</label><select id="ab-opp" onchange="AB.opp=this.value;abSignInit();abRender()"><option value="">Choose an opportunity</option>${opps.map(x=>`<option value="${x.id}" ${x.id===AB.opp?'selected':''}>${abE(x.lead)} · ${x.id} · ${abE(x.devs[0]||'')}</option>`).join('')}</select></div>`;
  const modeHtml=canLink?`<div class="ab-mode" role="tablist">${[['book','Book a time'],['link',`Let ${abE(first)} pick`]].map(([k,l])=>`<button role="tab" aria-selected="${AB.mode===k}" class="${AB.mode===k?'on':''}" onclick="abSet('mode','${k}')">${l}</button>`).join('')}</div>`:'';
  let body;
  if(AB.mode==='link'){
    const slug={viewing:'viewing',appointment:'appointment'}[AB.type], link=`bricly.app/b/${CV_ME.toLowerCase()}/${slug}`;
    body=`${head}${typeHtml}${recHtml}${modeHtml}
      <div class="od-field"><label>Booking link · ${abE(abT(AB.type)[1].toLowerCase())}</label><div class="qa-linkbox"><span>${link}</span><button class="ai-chip" onclick="shareCopy('Booking')">Copy</button></div></div>
      <div class="ab-mu">${abE(first)} sees only times free in Bricly and your Google Calendar, inside your booking hours. Their pick books itself and lands here.</div>
      <div class="od-field"><label>Send via</label><div class="ab-chips">${[['wa','WhatsApp'],['em','Email'],['sms','SMS']].map(([k,l])=>abChip(AB.linkCh===k,l,`abSet('linkCh','${k}')`)).join('')}</div></div>
      <div class="od-field"><label for="ab-linkmsg">Message</label><textarea id="ab-linkmsg" rows="3">Hi ${abE(first)}, pick a time for a ${abE(abT(AB.type)[1].toLowerCase())} that suits you here: ${link}</textarea></div>`;
    qaDrawerOpen('Send booking link',body,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="abSendLink()">Send link</button>`);
    return;
  }
  // type-specific details
  let det='';
  const meetAt=places=>`<div class="od-field"><label>Meet at</label><div class="ab-chips">${places.map(p=>abChip(abPlace()===p,abE(p),`AB.place='${abE(p).replace(/'/g,'\\\'')}';AB.placeEdited=true;abRender()`)).join('')}</div></div>`;
  if(AB.type==='viewing'&&o) det+=meetAt([`${o.devs[0]} sales suite`,'Show apartment',`On site · ${o.devs[0]}`]);
  if(AB.type==='appointment'){
    det+=`<div class="od-field"><label>Format</label><div class="ab-chips" role="radiogroup" aria-label="Appointment format">${[['person','In person'],['online','Online']].map(([k,l])=>`<button type="button" role="radio" aria-checked="${AB.fmt===k}" class="ab-chip ${AB.fmt===k?'on':''}" onclick="abSet('fmt','${k}')">${l}</button>`).join('')}</div></div>`;
    det+=AB.fmt==='online'
      ?`<div class="od-field"><label>Platform</label><div class="ab-chips">${AB_VIDEO.map(([k,l])=>abChip(AB.video===k,l,`abSet('video','${k}')`)).join('')}</div><div class="ab-mu">A private link is created when you save and goes in the confirmation and every invite.</div></div>`
      :meetAt([o&&o.devs[0]?`${o.devs[0]} sales suite`:'Sales suite','Office',...(o&&o.devs[0]?[`On site · ${o.devs[0]}`]:[])]);
  }
  if(AB.type==='signing'){
    det+=`<div class="od-field"><label>What’s being signed</label><div class="ab-chips">${AB_SIGN.map(([k,l])=>abChip(AB.sign===k,l,`abSet('sign','${k}')`)).join('')}</div></div>`;
    if(o) det+=abSignHtml(o);
    if(AB.sign==='pos'&&typeof LL_POS_CHECK!=='undefined') det+=`<div class="od-field"><label>Before the signing <span class="ab-mu">· optional</span></label><div class="ab-list">${LL_POS_CHECK.map((t,i)=>`<label class="ab-row"><input type="checkbox" ${AB.checks.includes(i)?'checked':''} onchange="abCheck(${i},this.checked)"><span>${abE(t)}</span></label>`).join('')}</div><div class="ab-mu">${AB.checks.length} of ${LL_POS_CHECK.length} ticked · you can book now.</div></div>`;
  }
  const placeHtml=AB.type==='appointment'&&AB.fmt==='online'?'':`<div class="od-field"><label for="ab-place">Place</label><input id="ab-place" value="${abE(abPlace())}" oninput="AB.place=this.value;AB.placeEdited=true"></div>`;
  const whenHtml=`<div class="od-field"><label>Day</label><div class="ab-chips">${days.map(d=>abChip(AB.date===d,d===today?'Today':cvDayLabel(d),`abSet('date','${d}')`)).join('')}<input id="abDate" class="ab-date" type="date" aria-label="Pick another day" value="${days.includes(AB.date)?'':AB.date}" onchange="if(this.value)abSet('date',this.value)"></div>${AB.date<today?'<div class="ab-warn">This day has passed · it’s logged as a past appointment.</div>':''}</div>
    <div class="ab-two"><div class="od-field"><label for="ab-start">Start</label><input id="ab-start" type="time" value="${AB.start}" onchange="if(this.value)abSet('start',this.value)"></div>
      <div class="od-field"><label>Length</label><div class="ab-chips">${AB_LENS.map(m=>abChip(AB.dur===m,m+' min',`abSet('dur',${m})`)).join('')}</div></div></div>
    ${clash&&!AB.force?`<div class="ab-clash cv-clash"><b>Overlaps with ${abE(clash.title)}, ${clash.start}–${clash.end}.</b>${near.length?`<div class="ab-mu">Free nearby:</div><div class="ab-chips">${near.map(t=>abChip(false,t,`abSet('start','${t}')`)).join('')}</div>`:''}</div>`:''}`;
  const withHtml=`<div class="od-field"><label>With</label><div class="ab-with"><span class="ab-pp">${abE(CV_ME)} (you)</span>${o&&AB.type!=='internal'?`<span class="ab-pp">${abE(o.lead)}</span>`:''}${AB.guests.map(g=>`<span class="ab-pp guest">${abE(g.name||g.email)}</span>`).join('')}</div></div>`;
  const remHtml=`<div class="od-field"><label>Reminders</label><div class="ab-mu">You’re reminded 1 hour before, in the app and on WhatsApp.</div>
    ${o&&AB.type!=='internal'?(c&&c.consent&&c.consent.wa===false?`<div class="ab-warn">${abE(first)} hasn’t agreed to WhatsApp. Send the confirmation by email, or add guests below.</div>`:`<label class="ab-switch"><input type="checkbox" role="switch" ${AB.remind?'checked':''} onchange="abSet('remind',this.checked)"><span><b>Message ${abE(first)} on WhatsApp</b><span class="ab-mu">A confirmation when you save, then a reminder the day before at ${AB.start}. To ${abE((c&&c.phone)||'the number on record')}.</span></span></label>
    ${AB.remind?`<div class="ab-bubble">Hi ${abE(first)}, your ${abE(abLabel().toLowerCase())} with ${abE(CV_ME)} is booked for ${cvDayLabel(AB.date)} at ${AB.start}${AB.type==='appointment'&&AB.fmt==='online'?` on ${abE(abPlace())}`:`, ${abE(abPlace())}`}. I’ll send a reminder the day before.</div>`:''}`):''}</div>`;
  body=`${head}${typeHtml}${recHtml}${modeHtml}${det}${whenHtml}${placeHtml}
    <div class="od-field"><label for="ab-notes">Notes <span class="ab-mu">· optional, only you and invited teammates see them</span></label><textarea id="ab-notes" rows="2" oninput="AB.notes=this.value" placeholder="${AB.type==='viewing'?'Bring floor plans, confirm parking…':'Agenda, what to prepare…'}">${abE(AB.notes)}</textarea></div>
    ${withHtml}${abGuestsHtml()}${remHtml}
    <div class="ab-mu ab-sync">${typeof cvGcal!=='undefined'&&cvGcal==='none'?'Google Calendar isn’t connected, so this stays in Bricly only.':'Added to your Google Calendar when you save.'}${AB.guests.length?` ${AB.guests.length} email invite${AB.guests.length>1?'s go':' goes'} out when you save.`:''}</div>`;
  const primary=clash&&!AB.force?'Book anyway':AB.type==='internal'?'Add event':'Book appointment';
  qaDrawerOpen(AB.type==='internal'?'New event':'Book appointment',body,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="abSave()">${primary}</button>`);
  document.getElementById('qaDrawer').classList.add('ab-drawer');
}
// ---------- signing: the unit being signed ----------
// Viewings don't link a unit (off-plan, nothing to walk through). A signing needs one so it can be held.
function abSignRows(o){
  const x=getExt(o), first=abFirst(o);
  return o.units.map(id=>{
    const u=UN(id); if(!u) return null;
    const st=typeof uhOppUnitState==='function'?uhOppUnitState(o,x,id,o.units.indexOf(id)):null;
    const mine=!!st&&(st.s==='held'||st.s==='requested');
    const other=u.status!=='available'&&!mine;
    const note=st&&st.s==='held'?`On hold for ${first}`:st&&st.s==='requested'?'Hold requested · waiting in Approvals':u.status==='hold'?'Held for another buyer':u.status==='available'?'Available':u.status==='reserved'?'Reserved':'Sold';
    return {id,u,mine,held:!!st&&st.s==='held',ok:!other,note};
  }).filter(Boolean);
}
function abSignInit(){
  const o=abOpp(); AB.signUnit=''; AB.uq=''; AB.uFind=false; AB.holdIt=true;
  if(!o||AB.type!=='signing') return;
  const rows=abSignRows(o), ok=rows.filter(r=>r.ok), held=ok.filter(r=>r.mine);
  if(rows.length===1&&ok.length===1) AB.signUnit=ok[0].id;
  else if(held.length===1) AB.signUnit=held[0].id;
  AB.uFind=!rows.length;
}
function abSignOthers(o){
  const q=(AB.uq||'').trim().toLowerCase();
  const list=UNITS.filter(u=>u.status==='available'&&!o.units.includes(u.id)&&(!q||[u.id,u.dev,u.type,(DEV(u.dev)||{}).loc].join(' ').toLowerCase().includes(q)));
  const near=list.filter(u=>o.devs.includes(u.dev)), rest=list.filter(u=>!o.devs.includes(u.dev));
  return [...near,...rest].slice(0,q?8:5);
}
const abUnitLine=u=>`${u.beds?u.beds+' bed':'Studio'} · floor ${u.floor} · ${fmtEur(u.price)}`;
function abSignRowHtml(id,u,note,ok,sel){
  return `<label class="ab-row ab-urow ${ok?'':'off'}"><input type="radio" name="ab-unit" ${sel?'checked':''} ${ok?'':'disabled'} onchange="abSet('signUnit','${id}')"><b>${abE(id)}</b><span class="ab-mu ab-grow">${abE(u.dev)} · ${abE(abUnitLine(u))}</span><em class="ab-ust">${abE(note)}</em></label>`;
}
function abSignOthersHtml(o){
  const list=abSignOthers(o);
  return list.length?list.map(u=>abSignRowHtml(u.id,u,'Available · not linked yet',true,AB.signUnit===u.id)).join(''):'<div class="ab-mu ab-pad">No available units match. Try a development name, type or unit number.</div>';
}
function abSignFind(v){AB.uq=v;const el=document.getElementById('ab-ures');if(el)el.innerHTML=abSignOthersHtml(abOpp());}
function abSignHtml(o){
  const rows=abSignRows(o), first=abFirst(o);
  const sel=AB.signUnit?(rows.find(r=>r.id===AB.signUnit)||{id:AB.signUnit,u:UN(AB.signUnit),mine:false,held:false,note:'Available'}):null;
  const linked=rows.length?`<div class="ab-list" role="radiogroup" aria-label="Unit being signed">${rows.map(r=>abSignRowHtml(r.id,r.u,r.note,r.ok,AB.signUnit===r.id)).join('')}</div>`:'';
  const find=AB.uFind||!rows.length
    ?`<div class="ab-ufind"><input id="ab-uq" type="search" placeholder="Find a unit · number, development or type" value="${abE(AB.uq)}" oninput="abSignFind(this.value)" aria-label="Find a unit"><div class="ab-list" id="ab-ures" role="radiogroup" aria-label="Available units">${abSignOthersHtml(o)}</div></div>`
    :`<button type="button" class="ab-linkbtn" onclick="AB.uFind=true;abRender()">Find another unit</button>`;
  let hold='';
  const canHold=sel&&sel.u&&sel.u.status==='available'&&!sel.mine&&['pos','other'].includes(AB.sign);
  if(sel&&sel.held) hold=`<div class="ab-mu">${abE(sel.id)} is already on hold for ${abE(first)}, so this signing is linked to it. Nothing more to request.</div>`;
  else if(sel&&sel.mine) hold=`<div class="ab-mu">A hold on ${abE(sel.id)} is already waiting in Approvals. This signing is linked to it.</div>`;
  else if(canHold) hold=`<label class="ab-switch"><input type="checkbox" role="switch" ${AB.holdIt?'checked':''} onchange="abSet('holdIt',this.checked)"><span><b>Put ${abE(sel.id)} on hold for ${abE(first)}</b><span class="ab-mu">${AB.holdIt?`Sent to Approvals when you save. ${abE(sel.id)} stays available until a manager approves, then it’s held for ${UH_DAYS} days.`:`${abE(sel.id)} won’t be held. Anyone else can still take it.`}</span></span></label>`;
  return `<div class="od-field" id="ab-sign"><label>Unit being signed <span class="ab-mu">· required</span></label>
    ${rows.length?'':`<div class="ab-mu">No unit is linked to ${abE(first)} yet. Find the one being signed. It’s linked to the opportunity when you save.</div>`}
    ${rows.length>1&&!AB.signUnit?`<div class="ab-mu">${rows.length} units are linked. Choose which one this signing is for.</div>`:''}
    ${linked}${find}${hold}</div>`;
}
function abCheck(i,on){AB.checks=AB.checks.filter(x=>x!==i);if(on)AB.checks.push(i);abRender();}

// ---------- guests (shared with the event popover and the deal deed booking) ----------
function abGuestSuggest(){
  const o=abOpp(), c=abContact(o), have=new Set((AB.guests||[]).map(g=>g.email.toLowerCase())), out=[];
  if(c&&c.email&&AB.type!=='internal') out.push([o.lead,c.email,'Buyer · email copy']);
  if(AB.type==='signing'||AB.ctx==='deed') out.push(['Notary Vella','office@notaryvella.mt','Notary']);
  AB_TEAM.forEach(t=>out.push(t));
  return out.filter(([,e])=>!have.has(e.toLowerCase())).slice(0,4);
}
function abGuestsHtml(){
  const sug=abGuestSuggest();
  return `<div class="od-field ab-guests" id="ab-guests"><label for="ab-guest-in">Invite people</label>
    <div class="ab-mu">They get an email invite with the time, place and a calendar file, and can accept or decline. Guests never see the opportunity or other records.</div>
    <div class="ab-gin"><input id="ab-guest-in" type="email" placeholder="name@email.com" autocomplete="off" aria-describedby="ab-gerr" onkeydown="if(event.key==='Enter'||event.key===','){event.preventDefault();abGuestAdd()}"><button type="button" class="btn-ghost" onclick="abGuestAdd()">Add</button></div>
    ${AB.gErr?`<div class="ab-err" id="ab-gerr" role="alert">${abE(AB.gErr)}</div>`:''}
    ${AB.guests.length?`<div class="ab-list">${AB.guests.map((g,i)=>`<div class="ab-row"><span class="ab-av">${abE((g.name||g.email).slice(0,1).toUpperCase())}</span><span class="ab-grow">${g.name?`<b>${abE(g.name)}</b> <span class="ab-mu">${abE(g.email)}</span>`:`<b>${abE(g.email)}</b>`}${g.role?`<span class="ab-mu"> · ${abE(g.role)}</span>`:''}</span><span class="ab-st ${g.status||'new'}">${g.status==='accepted'?'Accepted':g.status==='declined'?'Declined':g.status==='invited'?'Invited · no reply yet':'Invite on save'}</span><button type="button" class="ab-x" aria-label="Remove ${abE(g.email)}" onclick="abGuestRm(${i})">×</button></div>`).join('')}</div>`:''}
    ${sug.length?`<div class="ab-chips ab-sug"><span class="ab-mu">Suggested:</span>${sug.map(([n,e,r])=>`<button type="button" class="ab-chip" onclick="abGuestPush('${abE(e)}','${abE(n).replace(/'/g,'\\\'')}','${abE(r)}')">+ ${abE(n)}</button>`).join('')}</div>`:''}
  </div>`;
}
function abGuestsRefresh(){
  if(!AB.ctx){abRender();}
  else{const el=document.getElementById('ab-guests');if(el)el.outerHTML=abGuestsHtml();}
  document.getElementById('ab-guest-in')?.focus();
}
function abGuestPush(email,name,role){
  const e=email.trim().toLowerCase();
  if(!abValidEmail(e)){AB.gErr='Enter a full email address, for example name@email.com.';abGuestsRefresh();return false;}
  if(AB.guests.some(g=>g.email.toLowerCase()===e)){AB.gErr=`${e} is already invited.`;abGuestsRefresh();return false;}
  AB.guests.push({email:e,name:name||'',role:role||'',status:'new'}); AB.gErr=''; abGuestsRefresh(); return true;
}
function abGuestAdd(){
  const inp=document.getElementById('ab-guest-in'); const raw=(inp&&inp.value||'').trim(); if(!raw) return;
  raw.split(/[,;\s]+/).filter(Boolean).forEach(v=>abGuestPush(v));
  const i2=document.getElementById('ab-guest-in'); if(i2&&!AB.gErr) i2.value='';
}
function abGuestRm(i){AB.guests.splice(i,1);AB.gErr='';abGuestsRefresh();}

// ---------- save ----------
function abSave(){
  const o=abOpp(), today=cvISO(cvToday());
  const pend=(document.getElementById('ab-guest-in')?.value||'').trim(); if(pend){abGuestAdd();if(AB.gErr)return;}
  if(AB.type!=='internal'&&!o){showToast('Link the appointment to an opportunity');document.getElementById('ab-opp')?.focus();return;}
  if(AB.type==='internal'&&!AB.title.trim()){showToast('Give the event a title');document.getElementById('ab-title')?.focus();return;}
  if(AB.type==='signing'&&!AB.signUnit){showToast('Select the unit being signed');document.getElementById('ab-sign')?.scrollIntoView({block:'center'});return;}
  const label=abLabel(), place=abPlace(), online=AB.type==='appointment'&&AB.fmt==='online';
  const vlink=online?`${{meet:'meet.google.com',zoom:'zoom.us/j',teams:'teams.microsoft.com/l'}[AB.video]}/${Math.random().toString(36).slice(2,5)}-${Math.random().toString(36).slice(2,6)}`:'';
  const guests=AB.guests.map(g=>({...g,status:'invited'}));
  const title=AB.type==='internal'?AB.title.trim():`${label} · ${o.lead}`, end=abEnd(), dstr=cvDayLabel(AB.date);
  const ev={id:Date.now(),title,type:AB.type,mode:AB.type==='appointment'?AB.fmt:undefined,dateISO:AB.date,start:AB.start,end,contact:o?o.lead:'',location:vlink?`${place} · ${vlink}`:place,oppId:o?o.id:null,owner:CV_ME,
    with:[`${CV_ME} (you)`,o&&AB.type!=='internal'?o.lead:null,...guests.map(g=>g.name||g.email)].filter(Boolean).join(', '),guests,notes:AB.notes.trim(),units:AB.type==='signing'?[AB.signUnit]:[],
    rem:['You · 1 hour before',...(o&&AB.remind&&AB.type!=='internal'?[`${abFirst(o)} · confirmation sent now`,`${abFirst(o)} · reminder ${cvDayLabel(cvISO(new Date(new Date(AB.date+'T00:00:00').getTime()-864e5)))}, ${AB.start}`]:[])],src:''};
  cvExtra.push(ev);
  let sg=null;
  if(o){
    const x=getExt(o), when=`${dstr} · ${AB.start} · ${place}`, un=AB.type==='signing'?AB.signUnit:'';
    sg=un?abSignApply(o,un):null;
    x.appts=[{label,when,evId:ev.id,guests:guests.length,unit:un||undefined},...(x.appts||[])];
    x.comms.unshift({ch:'sys',t:'Just now',text:xesc(`Appointment booked · ${label} — ${dstr} ${AB.start}–${end} · ${place}${un?' · '+un+(sg&&sg.hold?' · hold requested':''):''}${guests.length?` · email invites to ${guests.map(g=>g.email).join(', ')}`:''}`)});
    if(AB.remind&&AB.type!=='internal') x.comms.unshift({ch:'wa',dir:'out',who:'You',t:'Just now',text:xesc(`Hi ${abFirst(o)}, your ${label.toLowerCase()} with ${CV_ME} is booked for ${dstr} at ${AB.start}${online?'':', '+place}${vlink?'. Join here: '+vlink:''}. I’ll send a reminder the day before.`)});
    if(AB.notes.trim()) x.comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text:xesc(`${label} notes · ${AB.notes.trim()}`)});
    abEffects(o,x,label,dstr);
  }
  const origin=AB.origin; qaDrawerClose(); document.getElementById('qaDrawer').classList.remove('ab-drawer');
  if(document.getElementById('p-opp')?.classList.contains('on')&&o&&oppCur&&oppCur.id===o.id) renderOpp();
  if(document.getElementById('p-contact')?.classList.contains('on')&&typeof renderContact==='function') renderContact();
  if(document.getElementById('p-calendar')?.classList.contains('on')){cvState.cursor=new Date(AB.date+'T00:00:00');cvRender();}
  if(typeof pipeRenderAll==='function') pipeRenderAll();
  showToast(o&&AB.type!=='internal'?`Appointment booked with ${o.lead} · ${label.toLowerCase()}${sg&&sg.hold?` · hold requested on ${AB.signUnit}`:''}${AB.remind?' · confirmation sent on WhatsApp':''}${guests.length?` · ${guests.length} invite${guests.length>1?'s':''} emailed`:''}`:`Event added to your calendar${guests.length?` · ${guests.length} invite${guests.length>1?'s':''} emailed`:''}`);
  AB=null;
}
// Links the chosen unit to the opportunity and, if asked, files the hold. Holds always go through Approvals.
function abSignApply(o,unitId){
  const u=UN(unitId); if(!u) return null;
  const st=typeof uhOppUnitState==='function'?uhOppUnitState(o,getExt(o),unitId,o.units.indexOf(unitId)):null;
  const wantHold=AB.holdIt&&['pos','other'].includes(AB.sign)&&u.status==='available'&&!(st&&(st.s==='held'||st.s==='requested'));
  if(wantHold&&typeof uhFile==='function'){uhFile(o,unitId);return {hold:true};}
  if(typeof uhLinkUnit==='function'&&uhLinkUnit(o,u)) getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`${u.id} (${u.dev}) linked to the opportunity for the signing`});
  return {hold:false};
}
// What a booking means for the opportunity journey.
function abEffects(o,x,label,dstr){
  const first=abFirst(o);
  if(AB.type==='appointment'){
    x.next={label:`Confirm the appointment with ${first}`,due:dstr,overdue:false};
  } else if(AB.type==='viewing'){
    if(typeof otMove==='function') otMove(o,'viewing_booked',{tl:1});
    x.next={label:`Confirm the ${label.toLowerCase()} with ${first}`,due:dstr,overdue:false};
  } else if(AB.type==='signing'&&AB.sign==='pos'){
    if(tlIdx(o,x)<2) x.tl=2;
    if(!EXIT_STAGES.includes(o.stage)) o.stage='Contract Booked';
    x.date={label:'POS signing',value:`${dstr}, ${AB.start}`,in:'',tone:''};
    x.next={label:'Confirm POS signing',due:dstr,overdue:false};
  } else if(AB.type==='signing'){
    x.next={label:`${label} with ${first}`,due:dstr,overdue:false};
  }
}
function abSendLink(){
  const o=abOpp(), x=getExt(o), ch={wa:'WhatsApp',em:'Email',sms:'SMS'}[AB.linkCh], msg=document.getElementById('ab-linkmsg').value.trim();
  x.comms.unshift({ch:AB.linkCh==='em'?'em':AB.linkCh,dir:'out',who:'You',t:'Just now',text:xesc(msg)});
  x.comms.unshift({ch:'sys',t:'Just now',text:`${abT(AB.type)[1]} booking link sent via ${ch} — waiting for ${abFirst(o)} to pick a time`});
  x.next={label:`Waiting for ${abFirst(o)} to pick a time`,due:'',overdue:false};
  qaDrawerClose(); if(oppCur&&oppCur.id===o.id&&document.getElementById('p-opp')?.classList.contains('on')) renderOpp();
  if(document.getElementById('p-contact')?.classList.contains('on')&&typeof renderContact==='function') renderContact();
  showToast(`Booking link sent to ${abFirst(o)}`); AB=null;
}

// ---------- invite people to an existing event (calendar popover) ----------
function abInviteOpen(id){
  const e=cvFind(id); if(!e) return; if(typeof cvClosePop==='function') cvClosePop();
  const o=e.oppId?OPPS.find(r=>r.id===e.oppId):null;
  AB={ctx:'event',evId:e.id,opp:o?o.id:'',type:e.type==='signing'?'signing':e.type,guests:JSON.parse(JSON.stringify(e.guests||[])),gErr:''};
  qaDrawerOpen('Invite people',`<div class="ab-sub">${abE(e.title)} · ${cvDayLabel(e.dateISO)}, ${e.start}${e.end?'–'+e.end:''}${e.location?' · '+abE(e.location):''}</div>${abGuestsHtml()}<div class="ab-mu">New guests get the invite when you save. Removing someone sends them a cancellation.</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="abInviteSave()">Send invites</button>`);
}
function abInviteSave(){
  const pend=(document.getElementById('ab-guest-in')?.value||'').trim(); if(pend){abGuestAdd();if(AB.gErr)return;}
  const e=cvFind(AB.evId), before=new Set((e.guests||[]).map(g=>g.email)), now=new Set(AB.guests.map(g=>g.email));
  const added=AB.guests.filter(g=>!before.has(g.email)), removed=(e.guests||[]).filter(g=>!now.has(g.email));
  e.guests=AB.guests.map(g=>({...g,status:g.status==='new'?'invited':g.status}));
  const base=(e.with||'').split(', ').filter(n=>n&&!(removed.some(g=>(g.name||g.email)===n)));
  added.forEach(g=>base.push(g.name||g.email)); e.with=[...new Set(base)].join(', ');
  if(e.oppId){const x=getExt(OPPS.find(r=>r.id===e.oppId));if(added.length||removed.length)x.comms.unshift({ch:'sys',t:'Just now',text:xesc(`${e.title} · ${added.length?'invited '+added.map(g=>g.email).join(', '):''}${added.length&&removed.length?' · ':''}${removed.length?'removed '+removed.map(g=>g.email).join(', '):''}`)});}
  qaDrawerClose(); AB=null; if(document.getElementById('p-calendar')?.classList.contains('on')) cvRender();
  showToast(added.length||removed.length?`${added.length?`${added.length} invite${added.length>1?'s':''} emailed`:''}${added.length&&removed.length?' · ':''}${removed.length?`${removed.length} cancellation${removed.length>1?'s':''} sent`:''}`:'No changes');
}

// ---------- wiring ----------
window.qaViewing=function(){if(!oppCur)return;abOpen({opp:oppCur,type:'viewing'});};
window.oppPosOpen=function(){if(!oppCur)return;abOpen({opp:oppCur,type:'signing',sign:'pos'});};
window.cvOpenNew=function(){abOpen({date:cvISO(cvState.view==='month'?cvToday():cvState.cursor),origin:'calendar',type:'viewing'});};
window.cvCloseNew=function(){if(AB)qaDrawerClose();const d=document.getElementById('cvDrawer');if(d)d.classList.remove('open');document.getElementById('cvDrawerScrim')?.classList.remove('on');};
(function(){
  const close=window.qaDrawerClose;
  window.qaDrawerClose=function(){document.getElementById('qaDrawer')?.classList.remove('ab-drawer');return close.apply(this,arguments);};
  // Seeded guests so the calendar shows invites in action.
  if(typeof cvSeedEvents==='function'){const e9=cvSeedEvents().find(e=>e.sid==='e9');if(e9&&!e9.guests)e9.guests=[{email:'mark.spiteri@gmail.com',name:'Mark Spiteri',role:'Partner',status:'accepted'}];
    const e13=cvSeedEvents().find(e=>e.sid==='e13');if(e13&&!e13.guests)e13.guests=[{email:'office@notaryvella.mt',name:'Notary Vella',role:'Notary',status:'accepted'},{email:'mortgages@bov.com.mt',name:'',role:'Bank',status:'invited'}];}
  const pop=window.cvShowPop;
  window.cvShowPop=function(evt,id){
    pop.apply(this,arguments);
    const e=cvFind(id), el=document.getElementById('cv-pop'); if(!e||!el||e.type==='busy') return;
    const g=e.guests||[];
    const html=`<div class="cv-rem ab-popg"><div class="cv-mu">Guests${g.length?` · ${g.length}`:''}</div>${g.map(x=>`<div>${x.status==='accepted'?'✓':x.status==='declined'?'✕':'○'} ${xesc(x.name||x.email)} <span class="cv-mu">· ${x.status==='accepted'?'accepted':x.status==='declined'?'declined':'invited'}</span></div>`).join('')||'<div class="cv-mu">Nobody invited by email.</div>'}${e.notes?`<div class="cv-mu" style="margin-top:4px">Notes · ${xesc(e.notes)}</div>`:''}</div>`;
    const foot=el.querySelector('.cv-pop-foot'); if(foot) foot.insertAdjacentHTML('beforebegin',html);
    let links=el.querySelector('.cv-pop-links'); if(!links){el.insertAdjacentHTML('beforeend','<div class="cv-pop-links"></div>');links=el.querySelector('.cv-pop-links');}
    links.insertAdjacentHTML('afterbegin',`<button onclick="abInviteOpen('${e.id}')">Invite people</button>`);
    const h=el.offsetHeight,top=parseFloat(el.style.top)||10; if(top+h>window.innerHeight-10) el.style.top=Math.max(10,window.innerHeight-h-10)+'px';
    el.style.maxHeight=(window.innerHeight-20)+'px'; el.style.overflowY='auto';
  };
  // Deal deed booking keeps its own steps, and gains email invites.
  const dfOpen=window.dfBookOpen, dfSave=window.dfBookSave;
  if(typeof dfOpen==='function'){
    window.dfBookOpen=function(){
      const o=dfO(), a=dfState(o).appt;
      AB={ctx:'deed',opp:o.id,type:'signing',guests:JSON.parse(JSON.stringify(a.guests||[])),gErr:''};
      dfOpen.apply(this,arguments);
      const anchor=[...document.querySelectorAll('.df-mu')].find(n=>/Booking never moves a step/.test(n.textContent));
      if(anchor) anchor.insertAdjacentHTML('beforebegin',abGuestsHtml());
    };
    window.dfBookSave=function(){
      const pend=(document.getElementById('ab-guest-in')?.value||'').trim(); if(pend){abGuestAdd();if(AB.gErr)return;}
      const o=dfO(), a=dfState(o).appt, guests=(AB&&AB.guests||[]).map(g=>({...g,status:g.status==='new'?'invited':g.status}));
      const added=guests.filter(g=>!(a.guests||[]).some(x=>x.email===g.email));
      dfSave.apply(this,arguments);
      if(document.getElementById('dfModal')?.open) return; // validation failed, modal still open
      a.guests=guests; if(added.length) dfLog(o,`Email invites sent · ${added.map(g=>g.email).join(', ')}`,'You · final deed');
      AB=null; if(typeof renderDeal==='function') renderDeal();
    };
  }
})();

/* ═══════════════ Calendar and booking settings + sidebar (Bricly Calendar design) ═══════════════ */
const CVS={
  avail:{mon:['09:00','18:00'],tue:['09:00','18:00'],wed:['09:00','18:00'],thu:['09:00','18:00'],fri:['09:00','18:00'],sat:['10:00','13:00'],sun:null},
  rules:{buf:'15 min',notice:'4 hours',window:'30 days',max:'6'},
  btOn:{viewing:1,video:1,call:1},
  remOn:{me:1,buyer:1,confirm:1,brief:1,outcome:1,noshow:1},
  gc:{work:1,personal:1,hol:0},priv:'Busy only',show:{viewing:1,appointment:1,call:1,video:1,signing:1,internal:1,busy:1,other:1},
};
const CVS_DAYS=[['mon','Monday'],['tue','Tuesday'],['wed','Wednesday'],['thu','Thursday'],['fri','Friday'],['sat','Saturday'],['sun','Sunday']];
const CVS_BT=[['viewing','Viewing','In person at the development’s sales suite',45,'viewing'],['video','Video call','Google Meet link sent with the confirmation',30,'video-call'],['call','Phone call','You call the number they give',15,'phone-call'],['signing','Signing','Internal only. You book it from a deal.',60,null]];
const cvsLink=k=>`bricly.app/b/${CV_ME.toLowerCase()}${k?'/'+k:''}`;
function cvsSet(path,v){const [a,b]=path.split('.');if(b===undefined)CVS[a]=v;else CVS[a][b]=v;if(typeof stRender==='function'&&document.getElementById('p-settings')?.classList.contains('on'))stRender();if(document.getElementById('p-calendar')?.classList.contains('on'))cvRender();}
function cvsToggle(path){const [a,b]=path.split('.');cvsSet(path,CVS[a][b]?0:1);}

// Client booking follows the hours and rules set here.
(function(){
  const base=window.cvFreeSlots;
  window.cvFreeSlots=function(date,dur,mode,exclude){
    if(mode!=='client') return base.apply(this,arguments);
    const today=cvISO(cvToday()); if(date<today) return [];
    const ahead=parseInt(CVS.rules.window)||30; if((new Date(date+'T00:00:00')-new Date(today+'T00:00:00'))/864e5>ahead) return [];
    const key=['sun','mon','tue','wed','thu','fri','sat'][new Date(date+'T00:00:00').getDay()], h=CVS.avail[key]; if(!h) return [];
    const r=[cvMins(h[0]),cvMins(h[1])], buf=parseInt(CVS.rules.buf)||0, n=CVS.rules.notice, now=new Date(), nowM=now.getHours()*60+now.getMinutes();
    const noticeM=/day/.test(n)?1440:(parseInt(n)||0)*60;
    const min=date===today?nowM+noticeM:(noticeM>=1440&&(new Date(date+'T00:00:00')-new Date(today+'T00:00:00'))/864e5<1?Infinity:0);
    const evs=cvBuildEvents().filter(e=>e.dateISO===date&&String(e.id)!==String(exclude)&&e.end&&!e.cancelled);
    if(evs.filter(e=>!['busy','internal'].includes(e.type)).length>=(+CVS.rules.max||99)) return [];
    const out=[]; for(let t=r[0];t+dur<=r[1];t+=30){if(t<min)continue;if(evs.some(e=>t-buf<cvMins(e.end)&&t+dur+buf>cvMins(e.start)))continue;out.push(cvHm(t));}
    return out;
  };
  window.CV_LINKS&&CV_LINKS.splice(0,CV_LINKS.length,...CVS_BT.filter(b=>b[4]).map(([k,l,,d])=>[k,l,d]));
  const linksOpen=window.cvLinksOpen;
  window.cvLinksOpen=function(){linksOpen.apply(this,arguments);document.querySelectorAll('#qaDrawerBody .cv-link').forEach(row=>{const k=(row.querySelector('[onclick*="cvBookOpen"]')?.getAttribute('onclick')||'').match(/cvBookOpen\('(\w+)'\)/);if(k&&!CVS.btOn[k[1]]){row.classList.add('off');row.querySelector('.cv-mu').textContent='Switched off in Calendar and booking';row.querySelectorAll('button').forEach(b=>b.disabled=true);}});};
  const bookOpen=window.cvBookOpen;
  window.cvBookOpen=function(type){if(!CVS.btOn[type]){showToast('This booking type is switched off');return;}return bookOpen.apply(this,arguments);};
})();

// ---------- settings page ----------
(function(){
  if(!window.BST||typeof ST_NAV_PER==='undefined') return;
  const nav=ST_NAV_PER.find(n=>n[0]==='calendar'); if(nav) nav[1]='Calendar and booking';
  const tabs=[['Booking hours','calendar'],['Booking page','calendar/booking'],['Reminders','calendar/rem'],['Connected calendars','calendar/conn']];
  const base={nav:'calendar',t:'Calendar and booking',tag:'v1',tabs,d:'When clients can book you, what they can book, and who gets reminded.'};
  const sw=(on,fn,label)=>`<label class="cvs-sw"><input type="checkbox" role="switch" ${on?'checked':''} onchange="${fn}" aria-label="${label}"><span></span></label>`;
  const chips=(path,opts)=>{const [a,b]=path.split('.');return `<div class="ab-chips">${opts.map(o=>`<button type="button" class="ab-chip ${CVS[a][b]===o?'on':''}" aria-pressed="${CVS[a][b]===o}" onclick="cvsSet('${path}','${o}')">${o}</button>`).join('')}</div>`;};
  const times=(k,i)=>`<select aria-label="${k} ${i?'to':'from'}" onchange="CVS.avail.${k}[${i}]=this.value;stRender()">${Array.from({length:27},(_,j)=>cvHm(420+j*30)).map(t=>`<option ${CVS.avail[k][i]===t?'selected':''}>${t}</option>`).join('')}</select>`;
  window.BST.pages.calendar={...base,b:[
    {k:'custom',span:12,title:'Booking hours',desc:'Clients can only pick times inside these hours. You can still book outside them yourself.',render:()=>`<div class="cvs-rows">${CVS_DAYS.map(([k,l])=>`<div class="cvs-row"><b>${l}</b>${sw(CVS.avail[k],`cvsSet('avail.${k}',CVS.avail.${k}?null:['09:00','${k==='sat'?'13:00':'18:00'}'])`,l+' bookable')}${CVS.avail[k]?`<span class="cvs-hrs">${times(k,0)} to ${times(k,1)}</span>`:'<span class="ab-mu">Not bookable</span>'}</div>`).join('')}</div>`},
    {k:'custom',span:12,title:'Rules',render:()=>`<div class="cvs-rows">${[['buf','Gap between appointments','Time to reset the show apartment or travel',['None','15 min','30 min']],['notice','Minimum notice','How soon a client can book',['2 hours','4 hours','1 day']],['window','How far ahead','Clients can book up to',['14 days','30 days','60 days']],['max','Most appointments a day','Client bookings stop after this',['4','6','8']]].map(([k,l,s,o])=>`<div class="cvs-row"><div><b>${l}</b><div class="ab-mu">${s}</div></div>${chips('rules.'+k,o)}</div>`).join('')}</div><div class="cvs-note">Bricly offers a time only when it’s free in Bricly and in your connected Google Calendar.</div>`},
  ]};
  window.BST.pages['calendar/booking']={...base,b:[
    {k:'custom',span:12,title:'Your booking page',render:()=>`<div class="cvs-row"><div><b>All types · ${cvsLink('')}</b><div class="ab-mu">Lets the client choose. To send them straight to one type, share its own link below.</div></div><button type="button" class="btn-ghost" onclick="showToast('Link copied')">Copy</button></div>`},
    {k:'custom',span:12,title:'What clients can book',desc:'Each type has its own length, place and link. Signings are booked by you, never by clients.',render:()=>`<div class="cvs-rows">${CVS_BT.map(([k,l,s,d,slug])=>`<div class="cvs-row"><span class="ab-sw" style="background:${abMeta(k).color}"></span><div class="ab-grow"><b>${l}</b> <span class="ab-mu">· ${d} min</span><div class="ab-mu">${s}</div></div>${slug?`<span class="cvs-link ${CVS.btOn[k]?'':'off'}">${cvsLink(slug)}</span><button type="button" class="btn-ghost" ${CVS.btOn[k]?'':'disabled'} onclick="showToast('Link copied')">Copy</button>${sw(CVS.btOn[k],`cvsToggle('btOn.${k}')`,l+' bookable by clients')}`:'<span class="ab-mu">No public link</span>'}</div>`).join('')}</div>`},
    {k:'custom',span:12,title:'What we ask the client',render:()=>`<div class="ab-chips">${['Full name','WhatsApp number','Email','Development','What they’re looking for (optional)'].map(q=>`<span class="ab-pp">${q}</span>`).join('')}</div><div class="cvs-note">A new booking creates a lead in Opportunities and assigns it to you. If the WhatsApp number matches a contact, the booking goes on their record.</div><button type="button" class="btn-ghost" style="margin-top:10px" onclick="go('calendar');setTimeout(()=>cvBookOpen('viewing'),50)">Preview what clients see</button>`},
  ]};
  window.BST.pages['calendar/rem']={...base,b:[
    {k:'custom',span:12,title:'Reminders and follow-ups',desc:'These run on every appointment linked to a record. Messages to a buyer go from your WhatsApp Business number.',render:()=>`<div class="cvs-rows">${[['me','Remind me','In the app and on WhatsApp. Includes the record, unit and last note.','1 hour before'],['buyer','Remind the buyer','On WhatsApp, with Confirm and Reschedule buttons. You approve it when you book; clients who book through your link get it automatically.','24 hours before','Hi Anna, this is a reminder of your viewing with Sam tomorrow, Wed 30 Sep at 17:30, at the Onyx Rise sales suite.'],['confirm','Confirm new bookings','Sent to the buyer on WhatsApp and email as soon as a time is booked or moved. Invited guests get an email invite.','Right away'],['brief','Morning brief','Today’s appointments in your WhatsApp brief and on Today.','07:30'],['outcome','Ask for the outcome','After an appointment or call ends, Bricly asks how it went, in the app and on WhatsApp.','15 min after'],['noshow','If the buyer doesn’t show','Bricly drafts a message offering two free times. Nothing is sent until you approve it.','When you log it']].map(([k,l,s,w,prev])=>`<div class="cvs-row top"><div class="ab-grow"><b>${l}</b><div class="ab-mu">${s}</div>${prev&&CVS.remOn[k]?`<div class="ab-bubble">${prev}<div class="cvs-btns"><span>Confirm</span><span>Reschedule</span></div></div>`:''}</div><span class="ab-mu">${w}</span>${sw(CVS.remOn[k],`cvsToggle('remOn.${k}')`,l)}</div>`).join('')}</div>`},
  ]};
  window.BST.pages['calendar/conn']={...base,b:[
    {k:'custom',span:12,title:'Google Calendar',desc:'Connect it so clients can’t book over your personal plans, and so your appointments show on your phone.',render:()=>typeof cvGcal!=='undefined'&&cvGcal==='none'?`<div class="cvs-row"><div class="ab-grow"><b>Not connected</b><div class="ab-mu">Booking links are paused until a calendar is connected.</div></div><button type="button" class="btn-primary" onclick="cvGcal='connected';stRender();showToast('Google Calendar connected')">Connect Google Calendar</button></div>`
      :`<div class="cvs-row"><span class="ab-av">G</span><div class="ab-grow"><b>Google Calendar · sam@lalex.mt</b><div class="ab-mu ${cvGcal==='error'?'ab-err':''}">${cvGcal==='error'?'Stopped syncing today at 08:12. Google asked you to sign in again.':'Two-way sync · last synced 2 min ago'}</div></div>${cvGcal==='error'?`<button type="button" class="btn-primary" onclick="cvGcal='connected';stRender();showToast('Reconnected · syncing again')">Reconnect</button>`:`<button type="button" class="btn-ghost" onclick="cvGcal='none';stRender();showToast('Google Calendar disconnected · booking links paused')">Disconnect</button>`}</div>
      <div class="cvs-sub">Check these calendars for conflicts</div><div class="cvs-rows">${[['work','sam@lalex.mt'],['personal','Personal'],['hol','Holidays in Malta']].map(([k,n])=>`<label class="cvs-row"><input type="checkbox" ${CVS.gc[k]?'checked':''} onchange="cvsToggle('gc.${k}')"><b>${n}</b></label>`).join('')}</div>
      <div class="cvs-sub">Add Bricly events to</div><div class="cvs-row"><div class="ab-grow"><div class="ab-mu">Appointments, calls and signings you book in Bricly or on WhatsApp</div></div><select aria-label="Calendar to write to"><option>sam@lalex.mt</option><option>Personal</option></select></div>
      <div class="cvs-sub">Google events show in Bricly as</div><div class="ab-chips">${['Busy only','Busy with title'].map(o=>`<button type="button" class="ab-chip ${CVS.priv===o?'on':''}" onclick="cvsSet('priv','${o}')">${o}</button>`).join('')}</div><div class="cvs-note">Your manager sees the same in the team view.</div>`},
    {k:'cards',span:12,title:'Other calendars',items:[{t:'Outlook',s:'Two-way sync',logo:'O',chip:['Coming later','neu'],meta:'v1.2',dim:true},{t:'iCloud',s:'Two-way sync',logo:'iC',chip:['Coming later','neu'],meta:'v1.2',dim:true}]},
  ]};
})();

// ---------- calendar sidebar: show filter, booking links, empty week ----------
(function(){
  let filtering=false;
  const build=window.cvBuildEvents;
  window.cvBuildEvents=function(){const all=build.apply(this,arguments);if(!filtering)return all;return all.filter(e=>CVS.show[CVS.show[e.type]===undefined?'other':e.type]);};
  const render=window.cvRender;
  window.cvRender=function(){
    filtering=true; try{render.apply(this,arguments);}finally{filtering=false;}
    const side=document.querySelector('#p-calendar .cv-side'); if(!side) return;
    const upcoming=[...side.children].find(c=>/^\s*Upcoming/.test(c.textContent));
    const place=el=>{if(upcoming)side.insertBefore(el,upcoming);else side.appendChild(el);};
    let show=document.getElementById('cv-show-card');
    if(!show){show=document.createElement('div');show.id='cv-show-card';show.className='dcard cvs-card';}place(show);
    show.innerHTML=`<h3>Show</h3>${[['viewing','Viewings'],['appointment','Appointments'],['signing','Signings'],['internal','Internal'],['busy','Google Calendar']].map(([k,l])=>`<label class="cvs-chk"><input type="checkbox" ${CVS.show[k]?'checked':''} onchange="${k==='appointment'?'CVS.show.call=CVS.show.video=':''}CVS.show.${k}=this.checked?1:0;cvRender()"><span class="ab-sw" style="background:${abMeta(k).color}"></span>${l}</label>`).join('')}`;
    let links=document.getElementById('cv-blinks-card');
    if(!links){links=document.createElement('div');links.id='cv-blinks-card';links.className='dcard cvs-card';}place(links);
    const paused=cvGcal!=='connected';
    links.innerHTML=`<h3>Your booking links</h3><div class="ab-mu">${paused?'Paused until Google Calendar syncs again.':'Clients pick a free time inside your booking hours.'}</div>${CVS_BT.filter(b=>b[4]&&CVS.btOn[b[0]]).map(([k,l,,d,slug])=>`<div class="cvs-bl"><div class="ab-grow"><b>${l}</b> <span class="ab-mu">· ${d} min</span><div class="ab-mu">${cvsLink(slug)}</div></div><button type="button" class="btn-ghost df-sm" onclick="showToast('Link copied')">Copy</button></div>`).join('')}
      <button type="button" class="cv-linkbtn" onclick="cvBookOpen('viewing')" ${paused?'disabled':''}>Preview what clients see →</button> <button type="button" class="cv-linkbtn" onclick="go('settings');stGo('p:calendar/booking')">Booking settings</button>`;
    // empty week
    const grid=document.getElementById('cv-grid');
    if(grid&&cvState.view==='week'&&!cvTeam){
      const start=new Date(cvState.cursor); start.setDate(start.getDate()-((start.getDay()+6)%7));
      const days=[0,1,2,3,4,5,6].map(i=>{const d=new Date(start);d.setDate(d.getDate()+i);return cvISO(d);});
      const any=build().some(e=>days.includes(e.dateISO)&&!['busy','internal'].includes(e.type)&&!e.cancelled);
      grid.querySelector('.cv-empty-week')?.remove();
      if(!any){grid.style.position='relative';grid.insertAdjacentHTML('beforeend',`<div class="cv-empty-week"><b>Nothing booked this week</b><div class="ab-mu">Share your booking link so clients can pick a time that suits them, or add an appointment yourself.</div><div class="ab-chips" style="justify-content:center;margin-top:8px"><button class="btn-ghost" onclick="cvLinksOpen()">Share booking link</button><button class="btn-primary" onclick="cvOpenNew()">+ New appointment</button></div></div>`);}
    }
    const nb=document.querySelector('#p-calendar button[onclick="cvOpenNew()"]'); if(nb) nb.textContent='+ New appointment';
    const sync=document.getElementById('cv-sync-btn'); if(sync) sync.setAttribute('onclick',"go('settings');stGo('p:calendar/conn')");
  };
})();
