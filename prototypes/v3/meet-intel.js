// Meeting intelligence on the opportunity (Bricly Message Intelligence · EP-7 flow 1, FS-411 · AI-601).
// Each appointment carries its own state (Upcoming → Needs outcome → Held) and opens its own page. It is closed by
// an uploaded recording, the rep's own summary (voice, typed or WhatsApp), a Bricly Meet video call or a call through
// the Bricly line. All of them land in the same transcript + proposals page and the same approval gate.
// Every number in a proposal is read from the unit and opportunity records.

const MI_ME='Sam', MI_MGR='Rachel Mifsud';
const MI_ST={booked:['Upcoming','info'],pending:['Needs outcome','warn'],proc:['Transcribing','info'],ready:['Proposals ready','info'],held:['Held','ok'],noshow:['Didn’t happen','neu'],live:['On a call','warn'],cancelled:['Cancelled','neu']};
const MI_KIND={viewing:'Viewing',video:'Video call',call:'Call'};
const MI_CREDITS={rec:25,note:2,call:6};
let MI={oppId:null,apptId:null}, MI_N=0, MI_TIMER=null, MI_CALL_T=null;

// Seeds: Maria's viewing has just ended (Needs outcome), her video call is still to come; Daniel has one held viewing.
const MI_SEED={
  'OPP-1008':[
    {id:'MT-1008-1',kind:'viewing',label:'Viewing',dev:'Onyx Rise',date:'Thu 1 Oct',mon:'OCT',day:'1',start:'09:30',end:'10:15',where:'Onyx Rise sales suite, Sliema',status:'pending',booked:'Mon 28 Sep',via:'WhatsApp',
      notes:[{who:'Rachel Mifsud',role:'Sales manager',t:'Wed 30 Sep, 17:40',text:'Three buyers raised 30% on signing this month. If Maria does, offer to check a 20/80 split with me before she leaves.',mgr:true}]},
    {id:'MT-1008-2',kind:'video',label:'Video call',dev:'Onyx Rise',date:'Mon 5 Oct',mon:'OCT',day:'5',start:'18:00',end:'18:30',where:'Bricly Meet link',status:'booked',booked:'Thu 1 Oct',via:'the app'}],
  'OPP-1004':[
    {id:'MT-1004-1',kind:'viewing',label:'First interest viewing',dev:'Mercury',date:'Fri 25 Sep',mon:'SEP',day:'25',start:'11:00',end:'11:45',where:'Mercury Towers sales suite',status:'held',src:'note',dur:'0:52',
      note:'Loved the light in 2702 · kitchen felt small · 3 updates written',written:['Viewing logged as held','Kitchen size logged as an objection','Task: send the POS draft'],waiting:[],booked:'Tue 22 Sep',via:'WhatsApp',
      tasks:[{t:'Send Daniel the POS draft for #CM2702',s:'Task · Sam · due Mon 5 Oct'},{t:'Ask Mercury about a larger kitchen layout',s:'Task · Sam · done Mon 28 Sep',done:true}],
      notes:[{who:'Sam',role:'Sales rep',t:'Fri 25 Sep, 12:10',text:'Cooks a lot, so the kitchen is the real question. Bring the 2704 plan next time, same floor, bigger kitchen.'},{who:'Rachel Mifsud',role:'Sales manager',t:'Fri 25 Sep, 15:30',text:'Good call on the bank letter. Push the POS draft before he looks at Verdala.',mgr:true}],
      seed:{turns:[['0:04','Sam','Showed Daniel 2702 on floor 18. He loved the light, says it’s the brightest he’s seen.','A1'],['0:15','Sam','The kitchen felt small to him, he cooks a lot.','A2'],['0:27','Sam','Finance is with HSBC, he expects the offer letter next week.'],['0:38','Sam','He wants the POS draft before deciding. I said I’d send it.','A3']],
        props:[{id:'A1',verb:'Log meeting',title:'Log the viewing as held',fields:[['Units shown','#CM2702 · 3 bed, floor 18'],['Summary','Loved the light. Kitchen felt small. Wants the POS draft before deciding.'],['Stage','Appointment Completed','Appointment Booked']],ts:'0:04',q:'Reported by Sam · Showed Daniel 2702 on floor 18. He loved the light.'},
          {id:'A2',verb:'Log objection',title:'Size and layout: kitchen feels small',fields:[['Category','Size and layout'],['Unit','#CM2702 · 3 bed, floor 18']],ts:'0:15',q:'Reported by Sam · The kitchen felt small to him, he cooks a lot.'},
          {id:'A3',verb:'Create task',title:'Send Daniel the POS draft for #CM2702',fields:[['Due','Mon 5 Oct'],['Owner','Sam']],ts:'0:38',q:'Reported by Sam · He wants the POS draft before deciding.'}],
        objs:[{cat:'Size and layout',q:'Reported by Sam: the kitchen felt small to him, he cooks a lot.',src:'First interest viewing · Fri 25 Sep, 0:15 · #CM2702',open:true,ts:'0:15'}],
        fu:'Hi Daniel, thanks for coming to see 2702 today.\n\nAs promised, I’ll send you the POS draft for 2702. The price is €455,000, with 10% on the promise of sale and 20% when the shell is finished, planned for March 2027.\n\nSend me the HSBC offer letter when you have it and we’ll move quickly.'},
      result:{source:'From Sam’s 0:52 voice note · approved by Sam Fri 25 Sep, 12:04',summary:'Daniel viewed #CM2702 on floor 18 with Sam. He loved the light, the brightest he’s seen, but the kitchen felt small because he cooks a lot. Finance is with HSBC and the offer letter is expected next week. He wants the POS draft before deciding.',
        chips:[['Positive on #CM2702','ok'],['Kitchen size is the open question','warn'],['Stage → Appointment Completed','ok']],
        discussed:[['#CM2702 · light and views','0:04','','','0:04'],['Kitchen size','0:15','','','0:15'],['Finance with HSBC','0:27','','','0:27'],['POS draft before deciding','0:38','','','0:38']],
        objections:[['Size and layout · kitchen feels small','#CM2702 · reported by Sam','Open','warn','0:15']],actions:[['Send Daniel the POS draft for #CM2702','Task · Sam · due Mon 5 Oct','Open']],actionsSub:'1 task',
        written:[['Stage Appointment Booked → Appointment Completed','Meeting logged as held','','','0:04'],['Size and layout objection logged','Source: reported by Sam · 0:15','','','0:15'],['Task: send the POS draft','Source: reported by Sam · 0:38','','','0:38']],writtenSub:'Approved by Sam · Fri 25 Sep, 12:04',
        counts:'3 proposed · 3 written',decided:'All decided by Sam on Fri 25 Sep, 12:04.'}}],
};
const MI_FACTS={'OPP-1008':[['Budget','€350,000','Web enquiry · Mon 14 Sep'],['Bedrooms','2 to 3','Web enquiry · Mon 14 Sep'],['Move in by','Not known','']]};

// Maria's August no-show was rebooked for Thu 1 Oct, which has just ended.
(function miSeedOpps(){
  const o=typeof OPPS!=='undefined'&&OPPS.find(v=>v.id==='OPP-1008'); if(!o) return;
  o.stage='Appointment Booked'; o.next={d:'Today',t:'Log the viewing outcome'}; o.appt={kind:'viewing',at:'Oct 1 09:30'};
})();

function miFirst(o){return o.lead.split(' ')[0];}
function miShort(id){return String(id||'').replace('#CM','');}
function miK(n){return Math.round(n/1000);}
function miNowHm(){const d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function miOpp(id){return OPPS.find(v=>v.id===(id||MI.oppId));}
function miAppts(o,x){
  x=x||getExt(o);
  if(!x.miSeeded){
    x.miSeeded=true;
    const s=MI_SEED[o.id];
    if(s) x.appts=[...(x.appts||[]),...s.map(a=>({...a,when:`${a.date}, ${a.start} · ${a.where}`}))];
    if(MI_FACTS[o.id]&&!x.miFacts) x.miFacts=MI_FACTS[o.id].map(r=>[...r]);
    if(o.id==='OPP-1008'){x.next={label:'Log the viewing outcome',due:'Due today',overdue:false};x.draft=null;}
  }
  (x.appts||[]).forEach(a=>{
    if(!a.id) a.id='MT-N'+(++MI_N);
    if(!a.status) a.status='booked';
    if(!a.date&&a.when){
      const ev=a.evId&&typeof cvExtra!=='undefined'?cvExtra.find(e=>e.id===a.evId):null, p=a.when.split(' · ');
      a.date=p[0]; a.start=ev?.start||(/^\d{1,2}:\d{2}$/.test(p[1]||'')?p[1]:''); a.end=ev?.end||''; a.where=ev?.location||p.slice(a.start?2:1).join(' · ');
      if(ev?.dateISO){const d=new Date(ev.dateISO+'T00:00:00');a.mon=d.toLocaleString('en-GB',{month:'short'}).toUpperCase();a.day=String(d.getDate());}
      if(ev?.mode==='online') a.kind='video';
    }
    if(!a.kind) a.kind=/video|virtual/i.test(a.label||'')?'video':/call/i.test(a.label||'')?'call':'viewing';
    if(!a.m) a.m={props:{},edits:{}};
    if(a.seed&&!a.m.seeded){a.m.seeded=true;a.m.src='note';a.seed.props.forEach(p=>a.m.props[p.id]='ok');if(a.seed.objs)x.objections=[...(x.objections||[]),...a.seed.objs.map(v=>({...v,apptId:a.id,oppId:o.id}))];}
  });
  return x.appts||[];
}
function miFind(o,id){return miAppts(o).find(a=>a.id===id);}
function miOrder(a){return {live:0,pending:1,proc:1,ready:1,booked:2,held:3,noshow:4,cancelled:5}[a.status]??6;}
function miSorted(o,x){return miAppts(o,x).filter(a=>a.status!=='cancelled').slice().sort((p,q)=>miOrder(p)-miOrder(q));}
function miTitle(o,a){return a.title||`${a.label||MI_KIND[a.kind]} · ${a.kind==='call'?o.lead:(a.dev||o.devs[0]||'')}`;}
function miWhen(a){return a.date?`${a.date}, ${a.start}`:(a.when||'Time not set').split(' · ')[0];}
function miWhere(a){return a.where||(a.when||'').split(' · ').slice(1).join(' · ');}
function miCrumb(o,a){return `${a.kind==='call'?'Call':a.kind==='video'?'Video call':a.label||'Viewing'}, ${a.date||miWhen(a)}`;}
function miChip(st,extra){const [l,t]=MI_ST[st]||[st,'neu'];return `<span class="chd-chip t-${t}${extra?' '+extra:''}">${l}</span>`;}

// ---------- Meeting content, read from the records ----------
// Frozen once the meeting is read, so a held transcript keeps the numbers it was read with.
function miUnits(o,a){
  const sn=a.m&&a.m.snap;
  if(sn) return {dev:sn.dev,u1:UN(sn.u1),u2:UN(sn.u2),big:sn.big.map(UN),was:sn.was,now:sn.now};
  const r=miUnitsLive(o,a);
  if(a.m&&!['booked','pending'].includes(a.status)) a.m.snap={dev:r.dev,u1:r.u1.id,u2:r.u2.id,big:r.big.map(u=>u.id),was:r.was,now:r.now};
  return r;
}
function miUnitsLive(o,a){
  const dev=a.dev||o.devs[0], dv=UNITS.filter(u=>u.dev===dev);
  const mine=o.units.map(UN).filter(u=>u&&u.dev===dev);
  const was=(o.budget||350)*1000, now=was+30000;
  const u1=mine[0]||dv.find(u=>u.status==='available')||dv[0];
  const u2=mine[1]||dv.filter(u=>u!==u1&&u.status==='available'&&u.price<=now*1.05).sort((p,q)=>Math.abs(p.price-now)-Math.abs(q.price-now))[0]||u1;
  const big=dv.filter(u=>u!==u1&&u!==u2&&u.beds>=3&&u.type!=='Penthouse').slice(0,2);
  return {dev,u1,u2,big,was,now};
}
function miUnitLine(u){return `${u.id} · ${u.beds} bed, floor ${u.floor}`;}
function miSrcLabel(a){return a.m.src==='note'?(a.m.nv==='text'?'Sam’s notes':'Sam’s summary'):a.kind==='call'?'call transcript':a.kind==='video'?'video call transcript':'viewing transcript';}
// Returns {turns, props, unclear, notProposed, n}. Turns: [ts, who, text, ref, translation]. Props: proposal cards.
function miData(o,a){
  if(a.seed) return {turns:a.seed.turns,props:a.seed.props,unclear:false,notProposed:[],...miUnits(o,a),bud:{v:0,c:''},lbl:'viewing'};
  const f=miFirst(o), {u1,u2,big,was,now}=miUnits(o,a), s1=miShort(u1.id), s2=miShort(u2.id), x=getExt(o);
  const src=a.m.src, isNote=src==='note', isCall=a.kind==='call', unclear=a.kind==='video'&&!isNote;
  const csec=Math.max(a.m.sec||0,10), ct=f=>miClock(Math.round(f*csec));
  const lbl=isCall?'call':a.kind==='video'?'video call':'viewing';
  let turns;
  if(isNote&&a.m.nv==='text') turns=miNoteLines(a.m.noteText||'').map((t,i)=>[`L${i+1}`,MI_ME,t,miNoteRef(t)]);
  else if(isNote) turns=[['0:03',MI_ME,`Showed ${s1} and ${s2}. She loved the terrace on ${s2}.`,'A1'],['0:08',MI_ME,`Bedrooms on ${s1} felt tight.`,'A4'],['0:14',MI_ME,`Budget was ${miK(was)}, could stretch to ${miK(now)} if the payment plan works.`,'A2'],['0:21',MI_ME,'Thirty percent on signing is too much for them.','A3'],['0:27',MI_ME,'They need to move by September 2027.','A2'],['0:33',MI_ME,`I promised the payment plan for ${s2} by Monday.`,'A5'],['0:41',MI_ME,`She asked if we could keep ${s2} until next Friday.`,'A6']];
  else if(isCall) turns=[[ct(.03),MI_ME,`Hi ${f}, it’s Sam from Bricly. I wanted to follow up on ${s2}.`],[ct(.15),o.lead,'The payment plan is the open point. Thirty percent on signing is too much right now.','A3'],[ct(.4),o.lead,`Our budget was ${miK(was)}, but we could stretch to ${miK(now)} if the plan works.`,'A2'],[ct(.7),o.lead,`Can you keep ${s2} for us until next Friday?`,'A6'],[ct(.95),MI_ME,`I’ll send you the payment plan for ${s2} by Monday.`,'A5']];
  else turns=[['00:42',MI_ME,a.kind==='video'?`Hi ${f}, thanks for joining. I’ll share ${s1} on floor ${u1.floor} first, then ${s2}.`:`Morning ${f}, thanks for coming in. We’ll start with ${s1} on floor ${u1.floor}, then go up to ${s2}.`],
    ['03:12',o.lead,`The light ${a.kind==='video'?'looks':'in here is'} lovely. The bedrooms feel a bit tight though.`,'A4'],
    ['08:55',o.lead,'Okay, it-terrazzin hawn fuq, dak li ġejna għalih.','A1','The terrace up here, that’s what we came for.'],
    ['12:40',o.lead,`Our budget was ${miK(was)}, but we could stretch to ${miK(now)} if the payment plan works.`,'A2'],
    ['14:10',MI_ME,`On ${s2} it’s 30% when you sign the promise of sale, then stage payments to completion.`],
    ['18:05',o.lead,'Thirty percent on signing is too much for us right now.','A3'],
    ['27:30',o.lead,'When would it be finished? We have to be out of our rental by next September.','A2'],
    ['27:52',MI_ME,`Completion is planned for ${u2.ready}.`],
    ['31:22',MI_ME,`I’ll send you the payment plan for ${s2} by Monday.`,'A5'],
    ['36:40',o.lead,`Can you keep it for us until next Friday?`,'A6'],
    ...(big.length===2&&a.kind!=='video'?[['38:02',o.lead,'And the three-bed upstairs, is that still there?','A7']]:[])];
  const UNC={'14:10':'[Unclear · 14:02 to 15:30 · background noise]','36:40':'[Unclear · 36:31 to 36:58 · two people talking]'};
  if(unclear) turns=turns.map(t=>UNC[t[0]]?[t[0],'Unclear',UNC[t[0]],null,null,true]:t);
  const refs=new Set(turns.map(t=>t[3]).filter(Boolean));
  const tsOf=id=>(turns.find(t=>t[3]===id)||[])[0]||'';
  const qOf=id=>{const t=turns.find(t=>t[3]===id);return t?(isNote?'Reported by Sam · '+t[2]:`“${t[4]||t[2]}”`):'';};
  const ed=a.m.edits||{}, bud=ed.A2||{v:now,c:'if the payment plan works'};
  const all=[
    {id:'A1',verb:'Log meeting',title:`Log the ${lbl} as held`,fields:[['Units shown',`${miUnitLine(u1)} · ${miUnitLine(u2)}`],['Summary',`Liked the terrace on ${s2}. Bedrooms on ${s1} felt tight. The payment plan is the open question.`],['Stage','Appointment Completed',o.stage]]},
    {id:'A2',verb:'Update facts',title:`Update ${f}’s budget and move-in date`,fields:[['Budget',`${fmtEur(bud.v)}${bud.c?' '+bud.c:''}`,fmtEur(was)],['Move in by','Sep 2027',(x.buyer&&x.buyer.timing)||'Not known']],editable:true},
    {id:'A3',verb:'Log objection',title:'Payment plan: 30% on signing',fields:[['Category','Payment plan'],['Unit',miUnitLine(u2)]]},
    {id:'A4',verb:'Log objection',title:'Size and layout: bedrooms feel tight',fields:[['Category','Size and layout'],['Unit',miUnitLine(u1)]]},
    {id:'A5',verb:'Create task',title:`Send ${f} the payment plan for ${u2.id}`,fields:[['Due','Mon 5 Oct'],['Owner',MI_ME]]},
    {id:'A6',verb:'Request hold',title:`Hold ${u2.id} until Fri 9 Oct`,fields:[['Unit',`${u2.id} · ${UN_STATUS[u2.status]?.l||u2.status}`],['Until','Fri 9 Oct, 18:00 · 8 days']],gate:`Holds need a manager. This goes to ${MI_MGR}’s approval queue. The unit isn’t held until she approves.`},
    {id:'A7',verb:'Add unit',title:'Which unit is “the three-bed upstairs”?',fields:[],need:true,warn:`${big.length} three-bed units match. Pick one to add it to ${f}’s interested units.`,
      opts:big.map(u=>[u.id,`${u.id} · ${u.beds} bed, floor ${u.floor}, ${u.sqm} m² · ${UN_STATUS[u.status]?.l||u.status}`,u.status==='available'?`${fmtEur(u.price)}${u.price>now?' · above her budget':''}`:'Can be noted, can’t be offered']).concat([['none','Neither','Nothing is added']])},
  ];
  const props=all.filter(p=>refs.has(p.id)).map(p=>({...p,ts:tsOf(p.id),q:qOf(p.id)}));
  if(props.some(p=>p.id==='A7')) props.unshift(props.splice(props.findIndex(p=>p.id==='A7'),1)[0]);
  const notProposed=unclear?[`Hold request: ${f} may have asked to hold ${u2.id} at 36:40, but the audio is unclear. Add it by hand if she did.`]:[];
  return {turns,props,unclear,notProposed,u1,u2,was,now,bud,lbl};
}
function miNoteLines(t){return t.split(/\n+|(?<=\.)\s+/).map(s=>s.trim()).filter(Boolean);}
function miNoteRef(t){
  const s=t.toLowerCase();
  if(/thirty|30 ?%|on signing/.test(s)) return 'A3';
  if(/budget|stretch|€|\d{3} ?k/.test(s)) return 'A2';
  if(/september|move (in|by)/.test(s)) return 'A2';
  if(/tight|small|bedroom/.test(s)) return 'A4';
  if(/keep|hold/.test(s)) return 'A6';
  if(/promised|send|by monday/.test(s)) return 'A5';
  if(/terrace|loved|liked|showed/.test(s)) return 'A1';
  return null;
}
// ---------- On the opportunity: Activity card, banner, Appointments side card ----------
function miCardHtml(o,a){
  const f=miFirst(o), id=a.id, us=o.units.filter(u=>UN(u)?.dev===(a.dev||o.devs[0])).join(', ');
  const meta=a.kind==='call'?`${a.start}${a.end?' to '+a.end:''} · ${miWhere(a)} · ${MI_ME}`:`${a.start||''}${a.end?' to '+a.end:''}${a.start?' · ':''}${miWhere(a)}${us?' · '+us:''} · ${MI_ME} with ${f}`;
  const C=(l,fn,p)=>`<button type="button" class="${p?'btn-primary':'btn-ghost'} chd-b" onclick="event.stopPropagation();${fn}">${l}</button>`;
  let right='', body='', acts='', foot='';
  if(a.status==='booked'){right=`Booked ${a.booked||'today'}`;
    body=a.kind==='video'?`Bricly Meet link is in the invite. The call records itself; ${f} accepts the recording notice on joining.`:`Reminder goes to ${f} on WhatsApp the evening before. The pre-meeting brief is prepared at 08:30 on the day.`;
    acts=C('Reschedule','miReschedule(\''+id+'\')')+C('Add a unit','miAddUnit(\''+id+'\')')+C('Cancel','miCancel(\''+id+'\')');
    foot=`Booked by ${MI_ME} · from ${a.via||'the app'} <button type="button" class="mi-demo" onclick="event.stopPropagation();miSimEnd('${id}')">Demo · end the ${a.kind==='video'?'call':'meeting'} now</button>`;}
  else if(a.status==='pending'){right=`Ended ${a.end||''}`;body='No outcome yet. Add the recording, or tell Bricly how it went in your own words.';
    acts=C('Upload recording','miOpen(\''+o.id+'\',\''+id+'\',\'upload\')',true)+C('How did the meeting go?','miOpen(\''+o.id+'\',\''+id+'\',\'note\')')+C('Didn’t happen','miNoShow(\''+id+'\')');foot='Pre-meeting brief · 08:30';}
  else if(a.status==='proc'){right='Reading';body=`Bricly is reading the ${a.m.src==='note'?'summary':'recording'}. A notification arrives on the app and WhatsApp when the proposals are ready.`;}
  else if(a.status==='ready'){right='Proposals ready';body=`${miData(o,a).props.length} proposals are waiting for you. Nothing is written until you approve.`;acts=C('Review proposals','miOpen(\''+o.id+'\',\''+id+'\',\'trans\')',true);}
  else if(a.status==='live'){right='Live';body=`On a call with ${f} through the Bricly line. Live notes show on the call page.`;acts=C('Return to call','miOpen(\''+o.id+'\',\''+id+'\')',true);}
  else if(a.status==='held'){right=a.dur?`${a.dur} ${a.src==='note'?'summary':'transcript'}`:'Held';
    body=a.note||'Held.';
    acts=(a.written||[]).length?`<span class="mi-wr">${a.written.length} written${(a.waiting||[]).length?` · ${a.waiting.length} waiting`:''}</span>`:'';
    foot=(a.waiting||[]).length?a.waiting.join(' · '):'All changes written';}
  else if(a.status==='noshow'){right='Didn’t happen';body=a.note||`Marked as not held. A follow-up to rebook ${f} was proposed.`;}
  return `<div class="mi-card st-${a.status}" role="button" tabindex="0" onclick="miOpen('${o.id}','${id}')" onkeydown="if(event.key==='Enter')miOpen('${o.id}','${id}')">
    <div class="mi-date"><span>${a.mon||''}</span><b>${a.day||'·'}</b></div>
    <div class="mi-cb">
      <div class="mi-ch"><b>${xesc(miTitle(o,a))}</b>${miChip(a.status)}<span class="mi-right">${xesc(right)}</span><span class="mi-go" aria-hidden="true">›</span></div>
      <div class="in-mu">${xesc(meta)}</div>
      <div class="mi-body">${xesc(body)}</div>
      ${acts||foot?`<div class="mi-cf"><span class="mi-acts">${acts}</span><span class="in-mu">${foot}</span></div>`:''}
    </div></div>`;
}
function miCardsHtml(o,x){
  const l=miSorted(o,x).filter(a=>a.status!=='noshow'||a.recent);
  return l.length?`<div class="mi-cards">${l.map(a=>miCardHtml(o,a)).join('')}</div>`:'';
}
function miBannerHtml(o,x){
  const p=miSorted(o,x).find(a=>a.status==='pending');
  if(p) return `<div class="mi-ban t-warn"><span>The ${xesc((p.label||'meeting').toLowerCase())} ended at ${p.end}. Open it to upload the recording or say how it went. The updates come back for you to approve.</span><button type="button" class="mi-ban-a" onclick="miOpen('${o.id}','${p.id}')">Open the appointment</button><button type="button" class="mi-ban-a" onclick="miNoShow('${p.id}')">Didn’t happen</button></div>`;
  const b=x.miBanner, h=b&&miFind(o,b.id);
  if(h) return `<div class="mi-ban t-ok"><span>${xesc(b.text)}</span><button type="button" class="mi-ban-a" onclick="miOpen('${o.id}','${h.id}','trans')">Open transcript</button><button type="button" class="mi-ban-x" aria-label="Dismiss" onclick="getExt(oppCur).miBanner=null;renderOpp()">×</button></div>`;
  return '';
}
function miSideHtml(o,x){
  const l=miSorted(o,x);
  const row=a=>`<div class="mi-row" role="button" tabindex="0" onclick="miOpen('${o.id}','${a.id}')" onkeydown="if(event.key==='Enter')miOpen('${o.id}','${a.id}')">
    <div class="mi-rt"><b>${xesc(a.label||MI_KIND[a.kind])}</b>${miChip(a.status)}<span class="mi-go" aria-hidden="true">›</span></div>
    <div class="in-mu">${xesc(miWhen(a))} · ${xesc(miWhere(a))}${a.status==='held'&&a.dur?' · '+a.dur:''}</div>
    ${a.status==='held'&&a.note?`<div class="mi-rn">${xesc(a.note)}</div>`:''}</div>`;
  return `<div class="dcard" id="opp-appts-card">
    <div class="row-between rail-h"><div class="side-h">Appointments</div><button type="button" class="rail-link" onclick="qaViewing()">+ Book</button></div>
    ${l.length?l.map(row).join(''):'<div class="rail-empty">None booked. Any type can be booked at any stage.</div>'}
    <div class="rail-note">Final deed and handover are booked on the deal.</div>
  </div>`;
}
function miFactsHtml(o,x){
  if(!x.miFacts) return '';
  return `<div class="dcard"><div class="row-between rail-h"><div class="side-h">What we know</div><span class="in-mu">Every fact has a source</span></div>
    ${x.miFacts.map(([k,v,s,link])=>`<div class="mi-fact"><span class="in-mu">${xesc(k)}</span><div><div>${xesc(v)}</div>${s?`<div class="in-mu">${link?`<button type="button" class="mi-src" onclick="miOpen('${o.id}','${link[0]}','trans','${link[1]}')">${xesc(s)}</button>`:xesc(s)}</div>`:''}</div></div>`).join('')}</div>`;
}

const miBase={hero:window.heroHtml,rail:window.railHtml,top:window.oppFeedInlineTop,sum:window.oppApptSummary,head:window.oppHeadHtml};
window.heroHtml=function(o,x,ji){return miBannerHtml(o,x)+miBase.hero(o,x,ji);};
window.oppFeedInlineTop=function(o,x){return (oppFeedF==='all'?miCardsHtml(o,x):'')+(miBase.top?miBase.top(o,x):'');};
window.railHtml=function(o,x,ji){
  let h=miBase.rail(o,x,ji);
  h=h.replace(/<div class="dcard" id="opp-appts-card">[\s\S]*?Final deed and handover are booked on the deal\.<\/div>\s*<\/div>/,()=>miFactsHtml(o,x)+miSideHtml(o,x));
  h=h.replace(/(<div class="k">Phone<\/div><div class="v">)([^<]*)(<\/div>)/,(m,a,b,c)=>`${a}${b} <button type="button" class="rail-link" onclick="miCall()">Call</button>${c}`);
  return h;
};
window.oppApptSummary=function(o,x){
  const l=miSorted(o,x), a=l[0];
  if(!a) return miBase.sum(o,x);
  const v=`${a.label||MI_KIND[a.kind]} · ${miWhen(a)}`;
  if(a.status==='held') return {v:`${a.label||'Viewing'} held`,d:`${a.date||''}${a.dur?' · '+a.dur:''}`};
  if(a.status==='pending') return {v,d:`Ended ${a.end}`};
  if(a.status==='noshow') return {v,d:'Didn’t happen'};
  return {v,d:miWhere(a)};
};
// The Actions menu opens the appointment page instead of the old overlay; "Call" goes through the Bricly line.
window.oppHeadHtml=function(o,j,comp){
  return miBase.head(o,j,comp).replace(/(<button onclick="crAct\('qaMessage'\)">)/,`<button onclick="crAct('miCall')"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 2h2.5l1 3-1.5 1a7 7 0 003 3l1-1.5 3 1V11a1 1 0 01-1 1A9.5 9.5 0 012 3a1 1 0 011-1z"/></svg>Call</button>$1`);
};
if(typeof window.inMeeting==='function'){const b=window.inMeeting;window.inMeeting=function(o,x){const l=miAppts(o,x);const a=l.filter(v=>v.status==='booked').sort((p,q)=>miOrder(p)-miOrder(q))[0];if(a)return {title:`${a.label||MI_KIND[a.kind]} with ${o.lead}`,when:a.when};return l.length?null:b(o,x);};}
window.inMeetingOpen=function(){
  const o=oppCur, x=getExt(o), l=miSorted(o,x);
  const a=l.find(v=>['pending','ready','proc','live'].includes(v.status))||l.find(v=>v.status==='booked');
  if(a){if(a.status==='booked')a.status='pending';miOpen(o.id,a.id);return;}
  const n={id:'MT-N'+(++MI_N),kind:'viewing',label:'Meeting',dev:o.devs[0],date:'Today',start:miNowHm(),end:miNowHm(),where:'Logged after the fact',status:'pending',m:{props:{},edits:{}}};
  n.when=`Today, ${n.start} · ${n.where}`; x.appts=[n,...(x.appts||[])]; miOpen(o.id,n.id,'choose');
};
if(typeof window.otApptOpen==='function'){const b=window.otApptOpen;window.otApptOpen=function(mode){const a=oppCur&&miSorted(oppCur).find(v=>['pending','ready','proc'].includes(v.status));if(a){miOpen(oppCur.id,a.id);return;}b(mode);};}
if(typeof window.ojCta==='function'){const b=window.ojCta;window.ojCta=function(o,x){const a=miSorted(o,x).find(v=>['pending','ready'].includes(v.status));return a?[a.status==='ready'?'Review proposals':'Log the outcome',`miOpen('${o.id}','${a.id}')`]:b(o,x);};}
// ---------- The appointment page: same header as the opportunity, tabs at the top, a side rail ----------
// Tabs that don't apply yet are hidden: nothing to transcribe before the meeting, nothing to approve until it's read.
const MI_TABS=[['overview','Overview'],['transcript','Transcript'],['updates','Updates'],['objections','Objections'],['followups','Follow-ups'],['notes','Notes'],['details','Details']];
function miRead(a){return a.status==='ready'||(a.status==='held'&&!!(a.result||a.seed));}
function miTabs(a){return MI_TABS.filter(([k])=>!['transcript','updates','objections'].includes(k)||miRead(a));}
function miDefTab(a){return a.status==='ready'?'transcript':'overview';}
function miOpen(oppId,id,mode,ts){
  const o=miOpp(oppId); if(!o) return; oppCur=o;
  const a=miFind(o,id); if(!a) return;
  MI={oppId:o.id,apptId:a.id,menu:false};
  const m=a.m;
  if(['upload','note','choose'].includes(mode)&&['pending','booked'].includes(a.status)){if(a.status==='booked')a.status='pending';m.mode=mode;if(mode==='note')m.nv=m.nv||'voice';m.tab='overview';}
  else if(mode==='trans'&&miRead(a)) m.tab='transcript';
  else if(mode&&MI_TABS.some(([k])=>k===mode)) m.tab=mode;
  if(!m.tab||!miTabs(a).some(([k])=>k===m.tab)) m.tab=miDefTab(a);
  if(ts&&miRead(a)){m.hl=ts;m.playing=/^L/.test(ts)?null:ts;m.tab='transcript';}
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('p-mtg').classList.add('on');
  document.querySelectorAll('.ni').forEach(n=>n.classList.toggle('on',n.dataset.page==='pipeline'));
  document.getElementById('crumb').innerHTML=`<a onclick="go('pipeline')">Opportunities</a><span class="sep">/</span><a onclick="openOpp('${o.id}')">${xesc(o.lead)}</a><span class="sep">/</span><span class="cur">${xesc(miCrumb(o,a))}</span>`;
  miRender(); document.getElementById('content').scrollTop=0;
  if(ts) setTimeout(()=>document.querySelector('.mi-turn.hl')?.scrollIntoView({block:'center',behavior:'smooth'}),60);
  miCallBar();
}
function miCur(){const o=miOpp();return o?{o,x:getExt(o),a:miFind(o,MI.apptId)}:{};}
function miSet(k,v){const {a}=miCur();if(!a)return;a.m[k]=v;miRender();}
function miTab(t){const {a}=miCur();if(!a)return;MI.menu=false;a.m.tab=t;miRender();document.getElementById('content').scrollTop=0;}
function miOnPage(){return document.getElementById('p-mtg')?.classList.contains('on');}
function miStatusChip(a){
  const m=a.m;
  if(a.status==='pending'&&m.mode==='note') return `<span class="chd-chip">Ended ${a.end} · no recording</span>`;
  if(a.status==='held') return `<span class="chd-chip t-ok">Held · ${(a.written||[]).length} updates written</span>`;
  if(a.status==='ready'&&m.src==='note') return '<span class="chd-chip t-info">Proposals ready · from Sam’s summary</span>';
  if(a.status==='proc'&&a.kind==='video') return '<span class="chd-chip t-info">Recorded · transcribing</span>';
  return miChip(a.status);
}
function miTabCount(o,x,a,k){
  if(k==='updates'){if(a.status==='ready'){const d=miData(o,a);return d.props.filter(p=>['prop','need','gate','edit'].includes(miPropState(a,p))).length;}return (a.written||[]).length;}
  if(k==='objections') return miObjList(o,x,a).length;
  if(k==='followups') return (a.tasks||[]).filter(t=>!t.done).length;
  if(k==='notes') return (a.notes||[]).length;
  return 0;
}
function miRender(){
  const root=document.getElementById('mi-root'), {o,x,a}=miCur(); if(!root||!a) return;
  const m=a.m, f=miFirst(o), us=o.units.filter(u=>UN(u)?.dev===(a.dev||o.devs[0]));
  if(m.mode==='trans'){m.mode=null;m.tab='transcript';} if(m.mode==='overview'){m.mode=null;m.tab='overview';}
  if(!miTabs(a).some(([k])=>k===m.tab)) m.tab=miDefTab(a);
  const sub=a.kind==='call'?`${a.date}, ${a.start}${a.end&&a.status!=='live'?'–'+a.end:''} · outbound · Bricly line · ${MI_ME} with ${o.lead}`:`${a.date||miWhen(a)}, ${a.start}${a.end?'–'+a.end:''} · ${miWhere(a)} · ${MI_ME} with ${o.lead}`;
  const tabs=miTabs(a).map(([k,l])=>{const n=miTabCount(o,x,a,k);return `<button type="button" class="tab ${m.tab===k?'on':''}" onclick="miTab('${k}')">${l}${n?` <span class="mi-tc">${n}</span>`:''}</button>`;}).join('');
  const head=`<button class="btn-back" onclick="openOpp('${o.id}')"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8.5 3L4 7l4.5 4"/></svg>Back to ${xesc(f)}</button>
    <div class="mi-page-head">
      <div class="crm-page-heading"><div class="page-title">${xesc(miTitle(o,a))} ${miStatusChip(a)}</div><div class="page-sub">${xesc(sub)}</div>
        <div class="mi-tags"><button type="button" class="mi-tag" onclick="openOpp('${o.id}')">${o.id} · ${xesc(o.lead)}</button>${us.map(u=>`<span class="mi-tag">${u}</span>`).join('')}</div></div>
      <div class="crm-page-controls"><div class="tabs" role="tablist">${tabs}</div>
        <div class="toolbar"><div class="cr-actions"><button type="button" class="btn-primary cr-actions-btn" aria-haspopup="menu" aria-expanded="${!!MI.menu}" onclick="event.stopPropagation();MI.menu=!MI.menu;miRender()">Actions <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button>
          ${MI.menu?`<div class="cr-actions-menu" role="menu">${miActions(o,a).map(([l,fn,pri])=>l==='-'?'<div class="cr-am-div"></div>':`<button type="button" role="menuitem" class="${pri?'cr-am-primary':''}" onclick="MI.menu=false;${fn}">${l}</button>`).join('')}</div>`:''}</div></div></div>
    </div>`;
  const body={overview:miOvTab,transcript:miTransTab,updates:miUpdatesTab,objections:miObjTab,followups:miFollowTab,notes:miNotesTab,details:miDetailsTab}[m.tab]||miOvTab;
  root.innerHTML=head+(m.tab==='transcript'?body(o,x,a):`<div class="mi-grid"><div class="mi-main">${body(o,x,a)}</div><aside class="mi-panel">${miRailHtml(o,x,a)}</aside></div>`);
}
document.addEventListener('click',e=>{if(MI.menu&&!e.target.closest('#p-mtg .cr-actions')){MI.menu=false;if(miOnPage())miRender();}});
function miActions(o,a){
  const id=a.id, O=`'${o.id}','${id}'`;
  if(a.status==='booked') return [['Reschedule',`miReschedule('${id}')`],['Add a unit',`miAddUnit('${id}')`],['Open in Calendar',`go('calendar')`],['-'],['Log the outcome now',`miOpen(${O},'choose')`,1],['Demo · end the meeting now',`miSimEndHere('${id}')`],['-'],['Cancel appointment',`miCancel('${id}')`]];
  if(a.status==='pending') return [['Upload recording',`miOpen(${O},'upload')`,1],['How did the meeting go?',`miOpen(${O},'note')`],['Didn’t happen',`miNoShow('${id}')`],['-'],['Reschedule',`miReschedule('${id}')`]];
  if(a.status==='ready') return [['Review updates',`miTab('updates')`,1],['Open transcript',`miTab('transcript')`],['-'],['Discard all proposals',`miDiscard()`]];
  if(a.status==='held') return [['Send a follow-up',`miTab('followups')`,1],['Book the next appointment',`miReschedule('${id}')`],['Add a note',`miTab('notes')`],['-'],['Share the summary with the buyer',`miShare()`],['Open in Calendar',`go('calendar')`]];
  if(a.status==='noshow') return [['Book again',`miReschedule('${id}')`,1],['Add a note',`miTab('notes')`]];
  if(a.status==='live') return [['End call',`miCallEnd()`,1]];
  return [['Back to the opportunity',`openOpp('${o.id}')`]];
}
function miSimEndHere(id){const o=oppCur,a=miFind(o,id);if(a.kind==='video'){a.m.src='rec';miRun('rec');return;}a.end=a.end||miNowHm();a.status='pending';a.m.tab='overview';miRender();showToast(`The ${(a.label||'meeting').toLowerCase()} ended · it now needs an outcome`);}
function miShare(){const {o,a}=miCur();a.m.tab='followups';a.fu=a.fu||{};a.fu.text=miFuText(o,a)+`\n\nA short summary of what we discussed: ${(a.result?.summary||a.note||'').replace(/^.*? with Sam\. /,'')}`;miRender();showToast('Summary added to the follow-up draft · review before sending');}

// Side rail: the same small set on every tab.
function miRailHtml(o,x,a){
  const us=o.units.filter(u=>UN(u)?.dev===(a.dev||o.devs[0])).map(UN), f=miFirst(o);
  const line={booked:`Starts ${miWhen(a)}`,pending:`Ended ${a.end} · no outcome yet`,proc:'Being read · you can leave',ready:'Proposals waiting for you',held:`${a.src==='note'?'From Sam’s summary':'From the '+(a.kind==='call'?'call':'recording')}${a.dur?' · '+a.dur:''}`,noshow:a.note||'',live:'Live on the Bricly line'}[a.status]||'';
  const ppl=[[MI_ME,'Sales rep · host'],[o.lead,'Buyer'],...(a.guests||[]).map(g=>[g[0],g[1]])];
  const sec=(t,b)=>`<div class="mi-rs"><div class="side-h">${t}</div>${b}</div>`;
  return sec('Status',`<div>${miChip(a.status)}</div><div class="in-mu" style="margin-top:6px">${xesc(line)}</div>`)
    +sec(a.status==='booked'?'Units to show':'Units shown',us.length?us.map(u=>`<div class="mi-ru"><span class="cell-id" style="cursor:pointer" onclick="openUnPeek('${u.id}')">${u.id}</span><span class="in-mu">${u.beds} bed · floor ${u.floor} · ${IN_K(u.price)} · ${UN_STATUS[u.status]?.l||u.status}</span></div>`).join(''):'<div class="in-mu">No units linked</div>')
    +sec('People',ppl.map(([n,r])=>`<div class="mi-ru"><span class="avatar-sm neutral">${initials(n)}</span><span><div>${xesc(n)}</div><div class="in-mu">${xesc(r)}</div></span></div>`).join(''))
    +((a.waiting||[]).length?sec('Waiting on a manager',a.waiting.map(w=>`<div class="mi-wait">${xesc(w)}</div>`).join('')):'')
    +(['pending','proc'].includes(a.status)?sec('Proposals',`<div class="mi-skel"><span></span><span></span></div><div class="in-mu">Appear once the meeting is read, from a recording or from your summary. Nothing is written to ${xesc(f)}’s records until you approve.</div>`):'');
}

// ---------- Overview tab ----------
function miOvTab(o,x,a){
  const m=a.m;
  if(a.status==='booked') return miBriefHtml(o,x,a);
  if(a.status==='live'||(a.kind==='call'&&a.status==='proc')) return miPhoneHtml(o,x,a);
  if(a.status==='proc') return miProcHtml(o,x,a);
  if(a.status==='pending') return ({upload:miUploadHtml,note:miNoteHtml}[m.mode]||miChooseHtml)(o,x,a);
  if(a.status==='ready') return m.mode==='note'&&m.nv==='wa'?miWaHtml(o,x,a):miReadyHtml(o,x,a);
  if(a.status==='noshow') return miNoShowHtml(o,x,a);
  return miOverviewHtml(o,x,a);
}
// Before the meeting the Overview is the pre-meeting brief, read from the records.
function miBriefHtml(o,x,a){
  let body=''; const keep=window.qaDrawerOpen;
  try{window.qaDrawerOpen=(t,b)=>{body=b;};if(typeof inBriefOpen==='function')inBriefOpen();}finally{window.qaDrawerOpen=keep;}
  body=body.replace(/<button class="tq-link" onclick="inBudgetEdit\(\)">Correct<\/button>/,'').replace(/<h3 class="in-h">[\s\S]*?<\/h3><div class="in-mu">[^<]*<\/div>/,'');
  const video=a.kind==='video';
  return `<div class="mi-card-lite"><div class="row-between"><div><b>${video?'Video call':'Upcoming'} · ${xesc(miWhen(a))}</b><div class="in-mu">${video?`Bricly Meet link in the invite. It records itself; ${xesc(miFirst(o))} accepts the recording notice on joining.`:`Reminder goes to ${xesc(miFirst(o))} on WhatsApp the evening before.`}</div></div>
      <span class="chd-row">${video?`<button class="btn-ghost chd-b" onclick="showToast('Bricly Meet link copied')">Copy Meet link</button>`:''}<button class="btn-ghost chd-b" onclick="miReschedule('${a.id}')">Reschedule</button></span></div></div>
    <div class="mi-brief"><div class="row-between"><h3 class="in-h" style="margin:0">Pre-meeting brief</h3></div>${body||'<div class="in-mu">The brief is prepared an hour before the meeting.</div>'}</div>`;
}
function miReadyHtml(o,x,a){
  const d=miData(o,a), open=d.props.filter(p=>['prop','need','gate','edit'].includes(miPropState(a,p))).length, need=d.props.some(p=>miPropState(a,p)==='need');
  return `<div class="mi-card-lite"><b>${d.props.length} updates are ready for you</b><div class="in-mu">Read from ${a.m.src==='note'?'your summary':a.kind==='call'?'the call':'the recording'}. Each one shows the line it came from. Nothing is written to ${xesc(miFirst(o))}’s records until you approve.</div>
    ${need?`<div class="mi-wait" style="margin-top:8px">One needs you first: which unit did ${xesc(miFirst(o))} mean?</div>`:''}
    <div class="mi-acts-l" style="margin-top:12px"><button class="btn-primary" onclick="miTab('transcript')">Review against the transcript</button><button class="btn-ghost" onclick="miTab('updates')">Review the ${open} open updates</button></div></div>
    <div class="mi-ob"><b>What’s proposed</b>${d.props.map(p=>`<div class="mi-oi"><div><div>${p.id} · ${xesc(p.title)}</div><div class="in-mu">${p.verb}${p.ts?' · '+p.ts:''}</div></div>${(()=>{const s=miPropState(a,p);return `<span class="chd-chip ${s==='ok'?'t-ok':s==='need'?'t-warn':s==='prop'?'t-info':''}">${{prop:'Proposed',ok:'Approved',skip:'Skipped',need:'Needs you',gate:'Needs a manager',edit:'Editing'}[s]}</span>`;})()}</div>`).join('')}</div>`;
}

// ---------- Transcript and Updates tabs share the same proposal cards ----------
function miTransLeft(o,a,d){
  const m=a.m, note=m.src==='note'||a.src==='note';
  const dur=a.seed?a.dur:note?(m.nv==='text'?`${d.turns.length} lines`:'0:48'):a.kind==='call'?miClock(a.m.sec||0):'44:12';
  const srcMeta=note?(m.nv==='text'?`${MI_ME}’s typed notes · after the ${d.lbl}`:`${MI_ME}’s voice note · after the ${d.lbl}`):'English, Maltese · 2 speakers matched';
  const player=m.playing?`<div class="mi-player"><button type="button" class="chd-play" onclick="miSet('playing',null)" aria-label="Stop">■</button><span class="chd-wave"></span><span class="in-mu">Playing from ${m.playing}</span></div>`:'';
  return `<div class="mi-trans"><div class="row-between"><div><b>${note?'Your summary':a.kind==='call'?'Call transcript':'Transcript'}</b> <span class="in-mu">${dur} · ${srcMeta}</span></div>${/^L/.test(d.turns[0]?.[0]||'L')?'':`<button type="button" class="btn-ghost chd-b" onclick="miPlay('${d.turns[0][0]}')">▶ Play</button>`}</div>${player}
    ${d.turns.map(([ts,who,txt,ref,tr,unc])=>`<div class="mi-turn ${m.hl===ts?'hl':''} ${unc?'unclear':''}" data-ts="${ts}"><button type="button" class="in-ts" onclick="miPlay('${ts}')">${ts}</button><b class="${who===MI_ME||unc?'in-mu':''}">${xesc(who)}</b><div>${xesc(txt)}${tr?`<div class="in-mu">Translated · ${xesc(tr)}</div>`:''}</div>${ref&&!unc&&d.props.some(p=>p.id===ref)?`<button type="button" class="mi-ref ${m.hl===ts?'on':''}" onclick="document.getElementById('mi-p-${ref}')?.scrollIntoView({block:'center',behavior:'smooth'})">${ref}</button>`:'<span></span>'}</div>`).join('')}</div>`;
}
function miPropsPanel(o,a,d,main){
  const m=a.m, held=a.status==='held', note=m.src==='note'||a.src==='note';
  const open=d.props.filter(p=>['prop','need','gate','edit'].includes(miPropState(a,p)));
  const need=d.props.some(p=>miPropState(a,p)==='need'), editing=d.props.some(p=>miPropState(a,p)==='edit');
  const go=need?`Approve all ${d.props.length}`:editing?`Approve the other ${open.length-1}`:open.length?`Approve all ${open.length}`:`Write ${d.props.filter(p=>miPropState(a,p)==='ok').length} approved changes`;
  return `<${main?'div':'aside'} class="mi-props ${main?'main':''}"><div class="mi-ph"><b>${held?`${d.props.length} proposed · ${(a.written||[]).length} written${(a.waiting||[]).length?` · ${a.waiting.length} waiting`:''}`:`${d.props.length} from ${note?`${MI_ME}’s ${m.nv==='text'?'notes':'voice note'}`:'the '+(a.kind==='call'?'call':'recording')}`}</b>
      <div class="in-mu">${held?'Decided by '+MI_ME+'. Each one shows the line it came from.':note?`Each one shows the line of your summary it came from. Facts are stored as reported by you, not as ${xesc(miFirst(o))}’s words. Nothing is written until you approve.`:`Each one shows the line it came from. Nothing is written to ${xesc(miFirst(o))}’s records until you approve.`}</div></div>
    ${d.unclear&&!held?`<div class="mi-ban t-warn sm">Two parts were unclear: 14:02 to 15:30 and 36:31 to 36:58. Nothing from them is proposed. Play them back if something was agreed there.</div>`:''}
    ${d.props.length?d.props.map(p=>miPropHtml(o,a,p,held)).join(''):`<div class="tq-empty"><b>Nothing to propose</b><span>None of these lines matched ${xesc(miFirst(o))}’s records. Add more detail, or upload the recording.</span></div>`}
    ${d.notProposed.length&&!held?`<div class="mi-not"><b>Not proposed</b>${d.notProposed.map(t=>`<div class="in-mu">${xesc(t)}</div>`).join('')}<button type="button" class="btn-ghost chd-b" onclick="miPlay('36:40',true)">▶ Play 36:31</button></div>`:''}
    ${held?'':`<div class="mi-foot"><span class="in-mu">${need?'A7 needs an answer first':`${note?MI_CREDITS.note:a.kind==='call'?MI_CREDITS.call:MI_CREDITS.rec} credits used · ${note?'source: Sam’s summary, not the buyer’s words':'speakers: Sam, '+xesc(o.lead)}`}</span><span class="chd-row"><button class="btn-ghost" onclick="miDiscard()">Discard all</button><button class="btn-primary" ${need||!d.props.length?'disabled':''} onclick="miApproveAll()">${go}</button></span></div>`}</${main?'div':'aside'}>`;
}
function miTransTab(o,x,a){const d=miData(o,a);return `<div class="mi-tgrid">${miTransLeft(o,a,d)}${miPropsPanel(o,a,d,false)}</div>`;}
function miUpdatesTab(o,x,a){
  const d=miData(o,a);
  if(a.status!=='held') return miPropsPanel(o,a,d,true);
  const r=a.result||{};
  const list=(t,sub,items,tone)=>`<div class="mi-ob"><div class="row-between"><b>${t}</b><span class="in-mu">${sub}</span></div>${items.length?items.map(([t1,s1,ts])=>`<div class="mi-oi"><div><div>${xesc(t1)}</div>${s1?`<div class="in-mu">${ts?`<button type="button" class="mi-src" onclick="miPlay('${ts}',true)">${xesc(s1)}</button>`:xesc(s1)}</div>`:''}</div>${tone?`<span class="chd-chip t-${tone}">${tone==='ok'?'Written':'Waiting'}</span>`:''}</div>`).join(''):'<div class="in-mu">None</div>'}</div>`;
  const skipped=d.props.filter(p=>miPropState(a,p)==='skip');
  return list('Written to the records',r.writtenSub||`Approved by ${MI_ME}`,(r.written||[]).map(w=>[w[0],w[1],w[4]]),'ok')
    +((a.waiting||[]).length?list(`Waiting on ${MI_MGR}`,'Holds and discounts need a manager',a.waiting.map(w=>[w,'In the approval queue']),'warn'):'')
    +(skipped.length?list('Skipped','Not written',skipped.map(p=>[p.title,p.q,p.ts])):'')
    +`<details class="mi-det"><summary>All ${d.props.length} proposals as they were approved</summary>${d.props.map(p=>miPropHtml(o,a,p,true)).join('')}</details>`;
}

// ---------- Objections tab ----------
function miObjList(o,x,a){
  if(a.status==='ready'){const d=miData(o,a);return d.props.filter(p=>p.verb==='Log objection').map(p=>({cat:p.fields[0][1],q:p.q,unit:p.fields[1]?.[1]||'',ts:p.ts,proposed:miPropState(a,p)}));}
  if(a.status!=='held') return [];
  return (x.objections||[]).map((v,i)=>({...v,i})).filter(v=>v.apptId===a.id).map(v=>({cat:v.cat,q:v.q,unit:(v.src||'').split(' · ').pop(),ts:v.ts,open:v.open,i:v.i}));
}
function miObjTab(o,x,a){
  const l=miObjList(o,x,a), f=miFirst(o), mgr=curPersona==='owner'||curPersona==='manager', dev=DEVS.find(d=>d.name===(a.dev||o.devs[0]));
  return `<div class="row-between" style="margin-bottom:10px"><div class="in-mu">Objections raised in this ${xesc((a.label||'meeting').toLowerCase())}, in ${xesc(f)}’s words. Same categories on every development.</div>${mgr&&dev?`<button type="button" class="rail-link" onclick="openDev('${dev.id}');dvSetTab('objections')">${xesc(dev.name)} objections ›</button>`:''}</div>
    ${l.length?`<div class="mi-ob">${l.map(v=>`<div class="mi-oi"><div><div><b class="in-objc">${xesc(v.cat)}</b> <span class="in-mu">· ${xesc(v.unit)}</span></div><div>${xesc(v.q)}</div>${v.ts?`<button type="button" class="mi-src" onclick="miPlay('${v.ts}',true)">▶ ${v.ts} in the ${a.src==='note'||a.m.src==='note'?'summary':'transcript'}</button>`:''}</div>
      ${v.proposed?`<span class="chd-chip ${v.proposed==='ok'?'t-ok':'t-info'}">${v.proposed==='ok'?'Approved':v.proposed==='skip'?'Skipped':'Proposed'}</span>`:`<button type="button" class="chd-chip t-${v.open?'warn':'ok'}" style="border:0;cursor:pointer" onclick="miObjToggle(${v.i})">${v.open?'Open':'Answered'}</button>`}</div>`).join('')}</div>
      ${a.status==='ready'?`<div class="in-mu">Approve them in Updates. They’re logged on ${xesc(f)}’s opportunity and counted on the development.</div>`:''}`
    :`<div class="tq-empty big"><b>No objections in this meeting</b><span>When ${xesc(f)} raises one, it’s proposed here with the line it came from.</span></div>`}`;
}
function miObjToggle(i){const {x}=miCur();x.objections[i].open=!x.objections[i].open;miRender();showToast(x.objections[i].open?'Marked as open':'Marked as answered');}

// ---------- Follow-ups tab ----------
function miFuText(o,a){
  if(a.seed?.fu) return a.seed.fu;
  const {u1,u2}=miUnits(o,a), f=miFirst(o), held=a.status==='held', hold=(a.waiting||[]).some(w=>/Hold/.test(w));
  return `Hi ${f}, thanks for ${a.kind==='call'?'the call':'coming to see '+miShort(u1.id)+' and '+miShort(u2.id)} today.\n\nAs promised, I’ll send you the payment plan for ${miShort(u2.id)} by Monday. ${u2.id} is ${fmtEur(u2.price)}, and completion is planned for ${u2.ready}.${hold&&held?`\n\nI’ve asked to keep ${miShort(u2.id)} for you until Fri 9 Oct and will confirm as soon as it’s approved.`:''}`;
}
function miFollowTab(o,x,a){
  const f=miFirst(o);
  if(a.status==='booked') return `<div class="mi-ob"><b>Before the ${xesc((a.label||'meeting').toLowerCase())}</b>${[['Reminder to '+f,'WhatsApp · the evening before · automatic','Scheduled','info'],['Pre-meeting brief','Prepared an hour before · only you','Scheduled','info'],['Confirm attendance',`${f} replied on ${a.via||'WhatsApp'}`,'Confirmed','ok']].map(([t,s,c,tone])=>`<div class="mi-oi"><div><div>${t}</div><div class="in-mu">${s}</div></div><span class="chd-chip t-${tone}">${c}</span></div>`).join('')}</div>
    <div class="in-mu">After the meeting, tasks and a follow-up message to ${xesc(f)} appear here.</div>`;
  const tasks=a.tasks||[], read=a.status==='held', nexts=miSorted(o).filter(v=>v.id!==a.id&&v.status==='booked'), fu=a.fu||{};
  return `<div class="mi-ob"><div class="row-between"><b>Tasks from this meeting</b><button type="button" class="rail-link" onclick="oppAddTask()">+ Add task</button></div>
      ${tasks.length?tasks.map((t,i)=>`<label class="mi-oi mi-task ${t.done?'done':''}"><span class="chd-row"><input type="checkbox" ${t.done?'checked':''} onchange="miTaskDone(${i},this.checked)"><span><div>${xesc(t.t)}</div><div class="in-mu">${xesc(t.s)}</div></span></span></label>`).join(''):`<div class="in-mu">${read?'No tasks were created.':'Tasks are proposed once the meeting is read.'}</div>`}</div>
    <div class="mi-ob"><div class="row-between"><b>Follow-up to ${xesc(f)}</b><span class="in-mu">${fu.sent?`Sent on WhatsApp · ${fu.sent}`:'Draft · every number comes from a record'}</span></div>
      ${read?(fu.sent?`<div class="mi-bub out" style="max-width:none">${xesc(fu.text).replace(/\n/g,'<br>')}</div>`:`<textarea class="mi-ta" id="mi-fu" rows="7" oninput="miCur().a.fu=Object.assign(miCur().a.fu||{},{text:this.value})">${xesc(fu.text||miFuText(o,a))}</textarea>
        <div class="mi-acts-r"><span class="in-mu">Nothing is sent until you press send</span><button class="btn-primary" onclick="miFuSend()">Send on WhatsApp</button></div>`):`<div class="in-mu">A draft appears once the meeting is read and the updates are approved.</div>`}</div>
    <div class="mi-ob"><b>Next appointment</b>${nexts.length?nexts.map(v=>`<button type="button" class="mi-oi mi-link" onclick="miOpen('${o.id}','${v.id}')"><div><div>${xesc(v.label||MI_KIND[v.kind])} · ${xesc(miWhen(v))}</div><div class="in-mu">${xesc(miWhere(v))}</div></div>${miChip(v.status)}</button>`).join(''):`<div class="mi-oi"><span class="in-mu">Nothing booked yet.</span><button class="btn-ghost chd-b" onclick="miReschedule('${a.id}')">Book the next appointment</button></div>`}</div>`;
}
function miTaskDone(i,v){const {a}=miCur();a.tasks[i].done=v;(a.hist=a.hist||[]).push([miNowHm(),`Task ${v?'done':'reopened'}: ${a.tasks[i].t}`]);miRender();}
function miFuSend(){
  const {o,x,a}=miCur(), t=(document.getElementById('mi-fu')?.value||'').trim(); if(!t){showToast('Write the message first');return;}
  a.fu={text:t,sent:'today '+miNowHm()}; x.comms.unshift({ch:'wa',dir:'out',who:'You',t:'Just now',text:xesc(t)});
  (a.hist=a.hist||[]).push([miNowHm(),`Follow-up sent to ${miFirst(o)} on WhatsApp`]); miRender(); showToast(`Follow-up sent to ${miFirst(o)}`);
}

// ---------- Notes tab ----------
function miNotesTab(o,x,a){
  const n=(a.notes||[]).slice().reverse();
  return `<div class="mi-ob"><b>Add a note</b><span class="in-mu">Private to your team. Never sent to ${xesc(o.lead)}.</span>
      <textarea class="mi-ta" id="mi-note-add" rows="3" placeholder="What you noticed, what to do differently next time…"></textarea>
      <div class="mi-acts-r"><button class="btn-primary" onclick="miNoteAdd()">Add note</button></div></div>
    ${n.length?n.map(v=>`<div class="mi-nt ${v.mgr?'mgr':''}"><div class="row-between"><span class="chd-row"><span class="avatar-sm neutral">${initials(v.who)}</span><b>${xesc(v.who)}</b><span class="in-mu">${xesc(v.role||'')}</span></span><span class="in-mu">${xesc(v.t)}</span></div><div>${xesc(v.text)}</div></div>`).join(''):'<div class="tq-empty"><b>No notes yet</b><span>Notes stay with this appointment and show on the opportunity’s Notes tab.</span></div>'}`;
}
function miNoteAdd(){
  const {o,x,a}=miCur(), t=document.getElementById('mi-note-add').value.trim(); if(!t){showToast('Write the note first');return;}
  (a.notes=a.notes||[]).push({who:MI_ME,role:'Sales rep',t:'Just now',text:t}); x.comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text:xesc(`${a.label||'Appointment'} note · ${t}`)});
  miRender(); showToast('Note added');
}

// ---------- Details tab ----------
function miHist(o,a){
  const f=miFirst(o), h=[[a.booked||'—',`Booked by ${MI_ME} · from ${a.via||'the app'}`]];
  if(a.status!=='booked'&&a.kind!=='call') h.push(['Evening before',`Reminder sent to ${f} on WhatsApp`]);
  if(['pending','proc','ready','held'].includes(a.status)&&a.end) h.push([`${a.date}, ${a.end}`,`${a.kind==='call'?'Call':'Meeting'} ended`]);
  if(a.status==='noshow') h.push(['Today','Marked as didn’t happen']);
  if(miRead(a)) h.push([a.seed?a.date:'Today',`Read from ${a.src==='note'||a.m.src==='note'?'Sam’s summary':'the '+(a.kind==='call'?'call':'recording')}`]);
  if(a.status==='held') h.push([a.seed?a.date:'Today',`${(a.written||[]).length} updates approved by ${MI_ME}`]);
  (a.waiting||[]).forEach(w=>h.push([a.seed?a.date:'Today',w]));
  return h.concat(a.hist||[]);
}
function miDetailsTab(o,x,a){
  const us=o.units.filter(u=>UN(u)?.dev===(a.dev||o.devs[0])), read=miRead(a), note=a.src==='note'||a.m.src==='note';
  const kv=[['Type',`${a.label||MI_KIND[a.kind]}${a.kind==='video'?' · Bricly Meet':a.kind==='call'?' · Bricly line':' · in person'}`],['When',`${a.date||miWhen(a)}, ${a.start}${a.end?'–'+a.end:''}`],['Where',miWhere(a)],
    ['With',[`${MI_ME} (you)`,o.lead,...(a.guests||[]).map(g=>g[0])].join(', ')],['Units',us.join(', ')||'None'],['Opportunity',`${o.id} · ${o.lead} · ${o.stage}`],
    ['Booked',a.booked?`${a.booked} · by ${MI_ME} · from ${a.via||'the app'}`:'—'],['Reminders',a.kind==='call'?'None · dialled directly':`${miFirst(o)} · WhatsApp the evening before · You · 1 hour before`],
    ['Recording',read?(note?'No recording · read from Sam’s summary':a.kind==='call'?'Call recording · notice played before connecting · consent saved':'Recording kept · consent confirmed and saved with the file'):a.kind==='video'?'Records itself through Bricly Meet':'Not yet'],
    ['Credits',read?`${note?MI_CREDITS.note:a.kind==='call'?MI_CREDITS.call:MI_CREDITS.rec} credits`:'None used yet']];
  return `<div class="mi-kv">${kv.map(([k,v])=>`<div><span class="in-mu">${k}</span><span>${xesc(v)}</span></div>`).join('')}</div>
    <div class="mi-ob"><b>History</b>${miHist(o,a).map(([t,s])=>`<div class="mi-oi mi-hi"><span>${xesc(s)}</span><span class="in-mu">${xesc(t)}</span></div>`).join('')}</div>`;
}
function miChooseHtml(o,x,a){
  const f=miFirst(o);
  return `<h3 class="in-h">The ${xesc((a.label||'meeting').toLowerCase())} ended at ${a.end}. Close it one of two ways</h3>
    <p class="in-mu">Either way Bricly reads it, proposes the updates to ${xesc(f)}’s records and waits for you. If you message your Bricly WhatsApp number about this meeting, it lands here on its own.</p>
    <div class="mi-choices">
      <div class="mi-choice"><span class="mi-ic">↑</span><b>Upload recording</b><span class="in-mu">A file from your phone, or paste the link to a Google Meet, Zoom or Teams recording. Bricly transcribes it and matches who said what.</span><button type="button" class="btn-primary" onclick="miSet('mode','upload')">Upload or paste a link</button></div>
      <div class="mi-choice"><span class="mi-ic">🎙</span><b>How did the meeting go?</b><span class="in-mu">A 30-second voice note or a few typed lines. Facts are stored as reported by you, not as ${xesc(f)}’s words.</span><span class="mi-row2"><button type="button" class="btn-ghost" onclick="miNoteStart('voice')">Voice note</button><button type="button" class="btn-ghost" onclick="miNoteStart('text')">Type it</button></span></div>
    </div>
    <button type="button" class="mi-line" onclick="miNoShow('${a.id}')">The meeting didn’t take place</button>
    <div class="mi-hint"><span class="in-mu">From the car? Message your Bricly number, text or voice. It’s matched to this appointment and shows up here.</span><button type="button" class="mi-demo" onclick="miWaArrive()">Demo · a WhatsApp summary arrives</button></div>`;
}
function miUploadHtml(o,x,a){
  const m=a.m, f=miFirst(o), how=m.how||'file', ok=(how==='file'?!!m.file:miLinkOk(m.link))&&m.consent;
  const kind=how==='link'&&miLinkOk(m.link)?miLinkKind(m.link):'';
  return `<button type="button" class="mi-line back" onclick="miSet('mode','choose')">‹ Two ways to close it</button><h3 class="in-h">Upload recording</h3>
    <div class="qa-seg mi-seg">${[['file','File'],['link','Paste a link']].map(([k,l])=>`<button type="button" class="ff-chip ${how===k?'on':''}" onclick="miSet('how','${k}')">${l}</button>`).join('')}</div>
    ${how==='file'?`<button type="button" class="in-drop" onclick="miSet('file','viewing_${a.date?a.date.replace(/\s/g,'_'):'today'}.m4a · 44:12 · 38 MB')">${m.file?`🎙 ${xesc(m.file)}`:'Drop the file from your phone, or choose an audio or video file'}</button>`
      :`<label class="mi-lbl">Recording link<input class="mi-in" id="mi-link" value="${xesc(m.link||'')}" placeholder="https://meet.google.com/… · zoom.us/rec/… · Teams or Drive link" oninput="miLink(this.value)"></label>
      <div class="in-mu" id="mi-link-st">${m.link?(kind?`✓ ${kind} · Bricly fetches it, 44:12`:'That isn’t a Google Meet, Zoom, Teams or Drive recording link'):'Bricly fetches the recording from the link.'}</div>`}
    <label class="cv-toggle mi-consent"><input type="checkbox" ${m.consent?'checked':''} onchange="miSet('consent',this.checked)"> ${xesc(f)} agreed to be recorded. Consent is saved with the recording.</label>
    <div class="in-mu">Transcribing a 44-minute meeting uses ${MI_CREDITS.rec} credits.</div>
    <div class="mi-acts-r"><button class="btn-ghost" onclick="miSet('mode','choose')">Cancel</button><button class="btn-primary" ${ok?'':'disabled'} onclick="miRun('rec')">Transcribe and read · ${MI_CREDITS.rec} credits</button></div>`;
}
function miLinkOk(v){return /(meet\.google\.com|zoom\.us|teams\.(microsoft|live)\.com|drive\.google\.com)\//i.test(v||'');}
function miLinkKind(v){return /meet\.google/i.test(v)?'Google Meet recording':/zoom/i.test(v)?'Zoom recording':/teams/i.test(v)?'Teams recording':'Drive file';}
function miLink(v){const {a}=miCur();a.m.link=v;const ok=miLinkOk(v);const st=document.getElementById('mi-link-st');if(st)st.textContent=v?(ok?`✓ ${miLinkKind(v)} · Bricly fetches it, 44:12`:'That isn’t a Google Meet, Zoom, Teams or Drive recording link'):'Bricly fetches the recording from the link.';const b=document.querySelector('.mi-acts-r .btn-primary');if(b)b.disabled=!(ok&&a.m.consent);}
function miProcHtml(o,x,a){
  const m=a.m, note=m.src==='note', call=a.kind==='call';
  const steps=note?[['Summary received',m.nv==='text'?`${miNoteLines(m.noteText||'').length} lines`:'0:48 voice note'],['Reading your words',''],[`Matching to ${miFirst(o)}’s records`,''],['Drafting proposals','']]
    :[[call?'Call recording saved':a.kind==='video'?'Recorded through Bricly Meet':'Uploaded',call?miClock(m.sec||0):'44:12 · 38 MB'],['Transcribing','English, Maltese'],['Matching people and units',''],['Drafting proposals','']];
  return `<h3 class="in-h">${note?'Reading your summary':call?'Call ended · being read':'Transcribing'}</h3>
    ${a.kind==='video'&&!note?`<p class="in-mu">The video call used a Bricly Meet link, so recording, consent and linking happened on their own. ${xesc(miFirst(o))} accepted the recording notice on joining.</p>`:''}
    <div class="mi-steps">${steps.map(([t,meta],i)=>`<div class="mi-step ${i<m.step?'done':i===m.step?'cur':''}"><span class="mi-dot">${i<m.step?'✓':''}</span><div><b>${t}</b>${meta?` <span class="in-mu">${meta}</span>`:''}${i===m.step?`<div class="mi-bar"><span style="width:${m.pct||0}%"></span></div>`:''}</div></div>`).join('')}</div>
    <p class="in-mu">You can leave this page. A notification arrives on the app and WhatsApp when the proposals are ready.</p>
    <button type="button" class="btn-ghost" onclick="openOpp('${o.id}')">Back to ${xesc(miFirst(o))}</button>`;
}
function miNoteHtml(o,x,a){
  const m=a.m, f=miFirst(o);
  if(m.nv==='wa') return miWaHtml(o,x,a);
  const tabs=`<div class="qa-seg mi-seg">${[['voice','Voice note'],['text','Type it']].map(([k,l])=>`<button type="button" class="ff-chip ${m.nv===k?'on':''}" onclick="miNoteStart('${k}')">${l}</button>`).join('')}</div>`;
  const lead=`<button type="button" class="mi-line back" onclick="miNoteStop();miSet('mode','choose')">‹ Two ways to close it</button><h3 class="in-h">How did the meeting go?</h3><p class="in-mu">No recording. Leave a voice note or type the important points. It’s read, matched to ${xesc(f)}’s records and proposed for your approval.</p>${tabs}`;
  if(m.nv==='text') return lead+`<textarea class="mi-ta" id="mi-note" rows="7" placeholder="Shorthand is enough, e.g. loved terrace on 9702, bedrooms tight. budget 380 if plan works. 30% on signing too much. move by Sep 2027. send plan Mon. keep 9702 till Fri" oninput="miNoteText(this.value)">${xesc(m.noteText||'')}</textarea>
    <div class="in-mu">Unit numbers, amounts and dates are matched to ${xesc(f)}’s records. Anything that doesn’t match comes back as a question, never a guess.</div>
    <div class="mi-acts-r"><span class="in-mu">${MI_CREDITS.note} credits</span><button class="btn-primary" id="mi-note-go" ${(m.noteText||'').trim()?'':'disabled'} onclick="miRun('note')">Read my notes</button></div>`;
  const words=miVoiceText(o,a).split(' '), n=m.words||0, said=words.slice(0,n).join(' ');
  const {u1,u2,now}=miUnits(o,a), ER=new RegExp(`\\b(${miShort(u1.id)}|${miShort(u2.id)}|${miK(now)}|September 2027|Monday|next Friday|thirty percent)\\b`,'gi');
  const ents=[...new Set(said.match(ER)||[])];
  return lead+`<div class="mi-voice ${m.rec?'rec':''}">
      <button type="button" class="mi-mic" aria-label="${m.rec?'Recording':'Start voice note'}" onclick="miVoice()">${m.rec?'■':'●'}</button>
      <div><b>${m.rec?'Recording · '+miClock(Math.round(n/3.2)):n?'Paused · '+miClock(Math.round(n/3.2)):'Tap to record'}</b><div class="in-mu">${m.rec?'Talk normally. Names and units are picked up as you speak.':n?'Stop and read sends it through the same reading as a recording.':'Under a minute is plenty.'}</div></div></div>
    <div class="mi-live">${said?xesc(said).replace(ER,'<mark>$1</mark>'):'<span class="in-mu">The transcript builds here as you speak.</span>'}</div>
    ${ents.length?`<div class="mi-tags">${ents.map(e=>`<span class="mi-tag">${xesc(/^\d{4}$/.test(e)?'#CM'+e:e)}</span>`).join('')}</div>`:''}
    <div class="mi-acts-r"><span class="in-mu">${MI_CREDITS.note} credits</span><button class="btn-primary" ${n>8?'':'disabled'} onclick="miNoteStop();miRun('note')">Stop and read</button></div>`;
}
function miClock(s){return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function miWaHtml(o,x,a){
  const d=miData(o,a), g=d.props.filter(p=>!p.gate).length;
  return `<h3 class="in-h">Your WhatsApp summary arrived</h3><p class="in-mu">You messaged your Bricly number after the ${xesc((a.label||'meeting').toLowerCase())}. It was matched to this appointment and to ${xesc(o.lead)}, and read like any summary: proposed, then approved by you.</p>
    <div class="mi-wa">
      <div class="mi-wa-h"><b>Bricly</b><span class="in-mu">+356 2010 0101 · your WhatsApp</span></div>
      <div class="mi-bub out"><div class="chd-audio"><div class="chd-row"><span class="chd-play">▶</span><span class="chd-wave"></span><span class="in-mu">0:48</span></div><div class="chd-trans">${xesc(miVoiceText(o,a))}</div></div><span class="in-mu">${MI_ME} · ${a.end?miAdd(a.end,6):'just now'}</span></div>
      <div class="mi-bub in">Matched to the ${xesc((a.label||'meeting').toLowerCase())} with ${xesc(o.lead)} at ${a.start}. ${d.props.length} updates proposed. Reply <b>yes</b> to approve the ${g} that don’t need a manager. The hold goes to ${MI_MGR}.<span class="in-mu">Bricly · ${a.end?miAdd(a.end,7):'just now'}</span></div>
      ${a.m.waYes?`<div class="mi-bub out">yes<span class="in-mu">${MI_ME}</span></div>`:''}
    </div>
    <div class="mi-acts-r"><button class="btn-ghost" onclick="miWaYes()">Reply yes</button><button class="btn-primary" onclick="miSet('mode','trans')">Open proposals</button></div>`;
}
function miAdd(hm,mins){const [h,mm]=hm.split(':').map(Number),t=h*60+mm+mins;return `${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;}

function miPropState(a,p){const s=a.m.props[p.id];if(s)return s;return p.need?'need':p.gate?'gate':'prop';}
function miPropHtml(o,a,p,ro){
  const m=a.m, s=miPropState(a,p), edit=s==='edit', chip={prop:['Proposed','info'],ok:[p.gate?'Sent to Approvals':'Approved','ok'],skip:['Skipped',''],need:['Needs you','warn'],gate:['Needs a manager',''],edit:['Editing','warn']}[s];
  const B=(l,fn,pri)=>`<button type="button" class="${pri?'btn-primary':'btn-ghost'} chd-b" onclick="${fn}">${l}</button>`;
  let acts='';
  if(!ro){
    if(s==='prop') acts=B('Skip',`miProp('${p.id}','skip')`)+(p.editable?B('Edit',`miProp('${p.id}','edit')`):'')+B('Approve',`miProp('${p.id}','ok')`,1);
    else if(s==='gate') acts=B('Skip',`miProp('${p.id}','skip')`)+B('Send for approval',`miProp('${p.id}','ok')`,1);
    else if(s==='need') acts=B('Confirm',`miPickConfirm()`,1).replace('<button',`<button ${m.pick?'':'disabled'}`);
    else if(s==='edit') acts=B('Cancel',`miProp('${p.id}','prop')`)+B('Save',`miEditSave('${p.id}')`,1);
    else acts=B('Undo',`miProp('${p.id}',null)`);
  }
  const d=miData(o,a);
  const fields=edit?`<div class="mi-edit"><label class="mi-lbl">Budget<input class="mi-in" id="mi-ed-v" value="${fmtEur(d.bud.v)}"></label><label class="mi-lbl">Condition<input class="mi-in" id="mi-ed-c" value="${xesc(d.bud.c)}"></label><div class="in-mu">The condition is saved with the budget and shows wherever the budget is used.</div></div>${p.fields.slice(1).map(([k,v,b])=>`<div class="chd-fields"><div><span class="chd-mu">${k}</span><span>${b?`<s class="chd-mu">${xesc(b)}</s> → `:''}${xesc(v)}</span></div></div>`).join('')}`
    :p.fields.length?`<div class="chd-fields">${p.fields.map(([k,v,b])=>`<div><span class="chd-mu">${k}</span><span>${b?`<s class="chd-mu">${xesc(b)}</s> → `:''}${xesc(v)}</span></div>`).join('')}</div>`:'';
  return `<div class="chd-card in-pc ${s} ${p.ts&&m.hl===p.ts?'mi-hlc':''}" id="mi-p-${p.id}"><div class="chd-ch"><span class="chd-ref">${p.id}</span><span class="chd-verb">${p.verb}</span><b>${xesc(p.title)}</b><span class="chd-chip ${chip[1]?'t-'+chip[1]:''}">${chip[0]}</span></div>
    ${p.warn&&s==='need'?`<div class="chd-warn">${xesc(p.warn)}</div>`:''}${p.gate&&s!=='skip'?`<div class="chd-warn">${xesc(p.gate)}</div>`:''}
    ${fields}
    ${p.opts&&s==='need'?`<div class="in-opts">${p.opts.map(([k,l,s2])=>`<button type="button" class="${m.pick===k?'on':''}" onclick="miSet('pick','${k}')"><b>${xesc(l)}</b><span class="in-mu">${xesc(s2)}</span></button>`).join('')}</div>`:''}
    ${p.opts&&s==='ok'&&m.pick?`<div class="chd-effect">${m.pick==='none'?'Neither. Nothing is added.':`${m.pick} added to ${miFirst(o)}’s interested units.`}</div>`:''}
    <div class="chd-cf">${p.ts?`<button type="button" class="mi-ts" onclick="miPlay('${p.ts}',true)">${/^L/.test(p.ts)?p.ts:'▶ '+p.ts}</button><span class="in-mu mi-q">${xesc(p.q)}</span>`:'<span></span>'}<span class="chd-row">${acts}</span></div></div>`;
}
function miOverviewHtml(o,x,a){
  const r=a.result; if(!r) return `<div class="mi-ov"><div class="in-mu">From ${MI_ME}’s ${a.src==='note'?a.dur+' summary':'recording'} · ${xesc(a.date||'')}</div><p class="mi-sum">${xesc(a.note||'Held.')}</p><div class="mi-ob"><b>Written to the records</b>${(a.written||[]).map(w=>`<div class="mi-oi">${xesc(w)}</div>`).join('')||'<div class="in-mu">Nothing</div>'}</div></div>`;
  const blk=(t,sub,items)=>`<div class="mi-ob"><div class="row-between"><b>${t}</b><span class="in-mu">${sub}</span></div>${items.map(([t1,s1,ch,tone,ts])=>`<div class="mi-oi"><div><div>${xesc(t1)}</div>${s1?`<div class="in-mu">${ts?`<button type="button" class="mi-src" onclick="miPlay('${ts}',true)">${xesc(s1)}</button>`:xesc(s1)}</div>`:''}</div>${ch?`<span class="chd-chip ${tone?'t-'+tone:''}">${ch}</span>`:''}</div>`).join('')||'<div class="in-mu">None</div>'}</div>`;
  return `<div class="mi-ov"><div class="in-mu">${xesc(r.source)}</div><p class="mi-sum">${xesc(r.summary)}</p>
    <div class="mi-tags">${r.chips.map(([t,tone])=>`<span class="chd-chip t-${tone}">${xesc(t)}</span>`).join('')}</div>
    ${blk('Discussed',`${r.discussed.length} topics`,r.discussed)}${blk('Objections',`${r.objections.length} logged`,r.objections)}${blk('Actions',r.actionsSub,r.actions)}${blk('Written to the records',r.writtenSub,r.written)}</div>`;
}
function miNoShowHtml(o,x,a){return `<h3 class="in-h">Didn’t happen</h3><p class="in-mu">${xesc(a.note||'')}</p><div class="mi-acts-r"><button class="btn-primary" onclick="miReschedule('${a.id}')">Book again</button></div>`;}
function miPhoneHtml(o,x,a){
  const live=a.status==='live', m=a.m, f=miFirst(o);
  const rows=live?[['Consent',`Recording notice played at ${a.start} · ${f} stayed on the line · saved with the call`],['Linked to',`${o.id} · ${o.lead} · logged as “Call · ${a.date}, ${a.start}” when it ends`],['Reading','Starts when the call ends · proposals go through the same approval gate']]
    :[['Consent',`Recording notice played at ${a.start} · ${f} stayed on the line · saved with the call`],['Logged',`Call · ${a.date}, ${a.start} to ${a.end} · outbound · ${MI_ME} · appears in Activity as a call card`],['Reading',`Transcribing ${miClock(m.sec||0)} · ${MI_CREDITS.call} credits · proposals in about a minute`]];
  const notes=(m.live||[]);
  return `<h3 class="in-h">${live?'Call from the opportunity':'Call ended · being read'}</h3>
    <p class="in-mu">${live?`Dialled from ${xesc(f)}’s record through the Bricly line, so the call, its recording and its transcript land on this opportunity without any typing. ${xesc(f)} heard the recording notice before you were connected.`:'The recording and transcript are already attached to the call. Proposals arrive in a minute; you can go back to the opportunity.'}</p>
    <div class="mi-call"><span class="mi-cdot ${live?'live':''}"></span><b id="mi-call-clock">${live?'Connected · '+miClock(m.sec||0)+' · recording':`Ended ${a.end} · ${miClock(m.sec||0)} · recording saved`}</b></div>
    <div class="mi-acts-l">${live?`<button class="btn-ghost" onclick="showToast('Muted')">Mute</button><button class="btn-ghost" onclick="showToast('Keypad')">Keypad</button><button class="btn-ghost" onclick="miSet('paused',!${!!m.paused})">${m.paused?'Resume recording':'Pause recording'}</button><button class="btn-danger" onclick="miCallEnd()">End call</button>`:`<button class="btn-ghost" onclick="miCall()">Call again</button><button class="btn-primary" ${a.status==='ready'?'':'disabled'} onclick="miSet('mode','trans')">Open transcript</button>`}</div>
    <div class="mi-kv">${rows.map(([k,v])=>`<div><span class="in-mu">${k}</span><span>${xesc(v)}</span></div>`).join('')}</div>
    ${live?`<div class="mi-ob"><b>Live notes</b><span class="in-mu">What Bricly is hearing. Nothing is written yet.</span>${notes.length?notes.map(t=>`<div class="mi-oi">${xesc(t)}</div>`).join(''):'<div class="in-mu">Listening…</div>'}</div>`:''}`;
}
// ---------- Actions ----------
function miVoiceText(o,a){const {u1,u2,now}=miUnits(o,a);return `Showed ${miShort(u1.id)} and ${miShort(u2.id)}. She loved the terrace, bedrooms felt tight. Budget could stretch to ${miK(now)} if the payment plan works, thirty percent on signing is too much. They need to move by September 2027. I promised the payment plan by Monday, and she asked us to keep it until next Friday.`;}
function miNoteStart(v){const {a}=miCur();miNoteStop();a.m.mode='note';a.m.nv=v;miRender();if(v==='text')setTimeout(()=>document.getElementById('mi-note')?.focus(),30);}
function miNoteText(v){const {a}=miCur();a.m.noteText=v;const b=document.getElementById('mi-note-go');if(b)b.disabled=!v.trim();}
function miVoice(){
  const {o,a}=miCur(), m=a.m, total=miVoiceText(o,a).split(' ').length;
  if(m.rec){miNoteStop();miRender();return;}
  m.rec=true; m.words=m.words>=total?0:(m.words||0); miRender();
  MI_TIMER=setInterval(()=>{const c=miCur();if(!c.a||c.a!==a||!miOnPage()){miNoteStop();return;}m.words++;if(m.words>=total){miNoteStop();}miRender();},140);
}
function miNoteStop(){if(MI_TIMER){clearInterval(MI_TIMER);MI_TIMER=null;}const {a}=miCur();if(a)a.m.rec=false;}
// Reading: the same four steps for a recording, a summary or a call. The rep may leave; a notification brings them back.
function miRun(src){
  const {o,a}=miCur(); if(!a) return; const m=a.m;
  m.src=src==='note'?'note':'rec'; if(src==='note'&&m.nv!=='text') m.noteText='';
  if(src==='note'&&m.nv==='voice') m.noteText='';
  m.mode=a.kind==='call'?'phone':'proc'; m.step=0; m.pct=0; m.props={}; m.pick=null; m.hl=null; m.playing=null; a.status='proc';
  miRender(); miTick(o.id,a.id);
}
function miTick(oppId,id){
  const o=miOpp(oppId), a=miFind(o,id); if(!a||a.status!=='proc') return; const m=a.m;
  m.pct=(m.pct||0)+(m.src==='note'?50:34);
  if(m.pct>=100){m.pct=0;m.step++;}
  if(m.step>=4){
    a.status='ready'; m.mode='trans';
    const here=miOnPage()&&MI.apptId===id;
    if(here) miRender(); else {showToast(`Proposals ready · ${miTitle(o,a)} with ${o.lead}. Also sent to your WhatsApp.`);if(document.getElementById('p-opp')?.classList.contains('on')&&oppCur?.id===o.id)renderOpp();}
    return;
  }
  if(miOnPage()&&MI.apptId===id) miRender();
  setTimeout(()=>miTick(oppId,id),260);
}
function miPlay(ts,toTrans){
  const {a}=miCur(); if(!a) return; a.m.hl=ts; a.m.playing=/^L/.test(ts)?null:ts; if(toTrans&&miRead(a)) a.m.tab='transcript'; miRender();
  setTimeout(()=>document.querySelector(`.mi-turn[data-ts="${ts}"]`)?.scrollIntoView({block:'center',behavior:'smooth'}),40);
}
function miProp(id,v){const {a}=miCur();if(v==null)delete a.m.props[id];else a.m.props[id]=v;if(id==='A7'&&v==null)a.m.pick=null;miRender();}
function miPickConfirm(){const {a}=miCur();if(!a.m.pick)return;a.m.props.A7=a.m.pick==='none'?'skip':'ok';miRender();}
function miEditSave(id){
  const {a}=miCur(), raw=document.getElementById('mi-ed-v').value, c=document.getElementById('mi-ed-c').value.trim();
  const n=Number(String(raw).replace(/[^\d]/g,'')); if(!n){showToast('Enter the budget as an amount');return;}
  a.m.edits[id]={v:n<10000?n*1000:n,c}; a.m.props[id]='ok'; miRender(); showToast('Budget saved with its condition · approved');
}
function miDiscard(){
  const {o,a}=miCur();
  if(!confirm('Discard all proposals? Nothing is written and the appointment goes back to Needs outcome.')) return;
  a.status=a.kind==='call'?'held':'pending'; a.m={props:{},edits:{},mode:a.kind==='call'?'phone':'choose'};
  if(a.kind==='call'){a.note='Call logged · proposals discarded';a.written=[];a.waiting=[];a.m.mode='overview';}
  openOpp(o.id); showToast('Proposals discarded · nothing was written');
}
function miApproveAll(){
  const {o,a}=miCur(), d=miData(o,a);
  if(d.props.some(p=>miPropState(a,p)==='need')){showToast('Answer A7 first');return;}
  d.props.forEach(p=>{const s=miPropState(a,p);if(['prop','gate','edit'].includes(s))a.m.props[p.id]='ok';});
  miCommit(o,a,d);
}
// Writes every approved proposal to the records, each with its own feed line and source. The hold only goes to Approvals.
function miCommit(o,a,d){
  const x=getExt(o), ok=id=>a.m.props[id]==='ok'&&d.props.some(p=>p.id===id), f=miFirst(o), note=a.m.src==='note';
  const srcOf=id=>{const p=d.props.find(v=>v.id===id);return p&&p.ts?`${note?'Reported by '+MI_ME:miSrcLabel(a)[0].toUpperCase()+miSrcLabel(a).slice(1)} · ${a.date}, ${p.ts}`:'';};
  const written=[], waiting=[], log=[], obj=[], acts=[], wr=[];
  const sys=t=>x.comms.unshift({ch:'sys',t:'Just now',text:t,tone:'ok'});
  if(ok('A1')){const was=o.stage;if(!EXIT_STAGES.includes(o.stage))o.stage='Appointment Completed';x.jstage='viewing_held';sys(`Stage moved to Appointment Completed · ${d.lbl} logged as held`);written.push('Meeting logged');wr.push([`Stage ${was} → Appointment Completed`,`Meeting logged as held${note?'':' · '+(a.kind==='call'?miClock(a.m.sec||0):'44 min')}`]);}
  if(ok('A2')){oppSetBudget(o,o.budgetMin??null,Math.round(d.bud.v/1000));x.buyer=x.buyer||{};x.buyer.timing='Sep 2027';const bt=`${fmtEur(d.bud.v)}${d.bud.c?' '+d.bud.c:''}`;
    sys(`Budget ${fmtEur(d.was)} → ${bt} · move in by Sep 2027 · ${note?'reported by '+MI_ME:'from the '+miSrcLabel(a)}`);written.push('Budget and move-in date');
    const p=d.props.find(v=>v.id==='A2'), t2=d.turns.find(t=>/September/i.test(t[2]))?.[0]||p.ts;
    if(x.miFacts){const set=(k,v,s,ts)=>{const r=x.miFacts.find(r=>r[0]===k);const row=[k,v,s,[a.id,ts]];if(r)Object.assign(r,row);else x.miFacts.push(row);};set('Budget',bt,srcOf('A2'),p.ts);set('Move in by','Sep 2027',`${note?'Reported by '+MI_ME:miSrcLabel(a)[0].toUpperCase()+miSrcLabel(a).slice(1)} · ${a.date}, ${t2}`,t2);}
    wr.push([`Budget ${fmtEur(d.was)} → ${bt}`,`Source: ${srcOf('A2').toLowerCase()}`,'', '',p.ts],['Move in by Sep 2027',`Source: ${note?'reported by '+MI_ME:miSrcLabel(a)} · ${t2}`,'','',t2]);}
  x.objections=x.objections||[];
  [['A3','Payment plan','“Thirty percent on signing is too much for us right now.”',d.u2.id,'30% on signing is too high'],['A4','Size and layout','“The bedrooms feel a bit tight though.”',d.u1.id,'bedrooms feel tight']].forEach(([id,cat,q,u,short])=>{
    if(!ok(id))return; const p=d.props.find(v=>v.id===id), qq=note?p.q.replace(/^Reported by Sam · /,'Reported by Sam: '):q;
    x.objections.unshift({cat,q:qq,src:`${a.label||'Meeting'} · ${a.date}, ${p.ts} · ${u}`,open:true,oppId:o.id,apptId:a.id,ts:p.ts});
    obj.push([`${cat} · ${short}`,`${u} · ${qq}`,'Open','warn',p.ts]);});
  if(obj.length){sys(`${obj.length} objection${obj.length>1?'s':''} logged: ${obj.map(v=>v[0].split(' · ')[0].toLowerCase()).join(', ')}`);written.push(`${obj.length} objection${obj.length>1?'s':''}`);}
  if(ok('A5')){if(typeof TQ!=='undefined'){tqInit();TQ.unshift({id:'n'+Date.now(),title:`Send ${f} the payment plan for ${d.u2.id}`,rec:o.id,due:cvISO(cvAddDays(cvToday(),3)),time:null,owner:tqMe(),agent:false,source:'from_signal',status:'open',createdBy:'agent',remind:'',fresh:true});tqBadge();}
    x.next={label:`Send the payment plan for ${d.u2.id}`,due:'Due Mon 5 Oct',overdue:false};(a.tasks=a.tasks||[]).push({t:`Send ${f} the payment plan for ${d.u2.id}`,s:`Task · ${MI_ME} · due Mon 5 Oct`});sys(`Task: send ${f} the payment plan for ${d.u2.id} · due Mon 5 Oct`);written.push('Task created');acts.push([`Send ${f} the payment plan for ${d.u2.id}`,`Task · ${MI_ME} · due Mon 5 Oct`,'Open']);}
  if(ok('A6')){const r=typeof apFile==='function'?apFile(o,d.u2.id,'hold'):{id:'REQ'};x.hold={unit:d.u2.id,state:'requested'};x.blocker=`Hold on ${d.u2.id} — ${r.id} waiting in Approvals`;
    x.comms.unshift({ch:'sys',t:'Just now',text:`Hold on ${d.u2.id} until Fri 9 Oct requested · waiting in Approvals`,tone:'warn'});waiting.push(`Hold on ${d.u2.id} · waiting in ${MI_MGR}’s approval queue`);acts.push([`Hold ${d.u2.id} until Fri 9 Oct`,`Sent to ${MI_MGR}’s approval queue`,'Waiting','warn']);}
  if(ok('A7')&&a.m.pick&&a.m.pick!=='none'&&!o.units.includes(a.m.pick)){o.units.push(a.m.pick);sys(`${a.m.pick} added to ${f}’s interested units`);written.push(`${a.m.pick} added`);}
  if(!written.length&&!waiting.length){showToast('Approve at least one proposal');return;}
  const dur=note?(a.m.nv==='text'?'typed notes':'0:48'):a.kind==='call'?miClock(a.m.sec||0):'44:12';
  a.status='held'; a.src=note?'note':'rec'; a.dur=note&&a.m.nv==='text'?'notes':dur; a.written=written; a.waiting=waiting; a.recent=true;
  a.note=`${ok('A1')?`Liked the terrace on ${miShort(d.u2.id)}`:'Read'} · ${written.length} update${written.length>1?'s':''} written${waiting.length?' · hold waiting for Rachel':''}`;
  wr.push([`Summary and ${note?'your notes':'transcript'} attached to this appointment`,note?'Facts marked “reported by Sam”':'Recording kept · consent saved']);
  a.result={source:note?`From ${MI_ME}’s ${a.m.nv==='text'?'typed notes':'0:48 voice note'} · approved by ${MI_ME} ${miNowHm()}`:`From the ${a.kind==='call'?'call':'recording'} · ${dur} · approved by ${MI_ME} ${miNowHm()}`,
    summary:`${o.lead} ${a.kind==='call'?'spoke with':'viewed '+miShort(d.u1.id)+' and '+miShort(d.u2.id)+' with'} ${MI_ME}. She liked the terrace on ${miShort(d.u2.id)}; the bedrooms on ${miShort(d.u1.id)} felt tight. She can stretch to ${fmtEur(d.bud.v)} if the payment plan works, but 30% on signing is too much right now. They need to move in by September 2027. ${MI_ME} promised the payment plan for ${miShort(d.u2.id)} by Monday${ok('A6')||d.notProposed.length?` and she asked to keep ${miShort(d.u2.id)} until next Friday`:''}.`,
    chips:[[`Positive on ${d.u2.id}`,'ok'],['Payment plan is the open question','warn'],...(ok('A1')?[['Stage → Appointment Completed','ok']]:[])],
    discussed:d.props.filter(p=>p.ts&&p.id!=='A7').map(p=>[p.title.replace(/^Log the .* as held$/,`${d.u2.id} · terrace, payment plan`),p.ts,'','',p.ts]),
    objections:obj, actions:acts, actionsSub:`${acts.filter(v=>!v[3]).length} task · ${acts.filter(v=>v[3]).length} approval`, written:wr, writtenSub:`Approved by ${MI_ME} · ${miNowHm()}`,
    counts:`${d.props.length} proposed · ${written.length} written${waiting.length?` · ${waiting.length} waiting for Rachel`:''}`,decided:`All decided by ${MI_ME} at ${miNowHm()}. Open Transcript to see each one against its line.`};
  a.m.mode=null; a.m.tab='overview';
  x.miBanner={id:a.id,text:`${written.length} update${written.length>1?'s':''} from the ${d.lbl} ${written.length>1?'are':'is'} written.${waiting.length?` The hold on ${d.u2.id} is waiting for ${MI_MGR}.`:''}`};
  if(typeof pipeRenderAll==='function') pipeRenderAll();
  openOpp(o.id); showToast(`Written to ${f}’s opportunity · ${written.join(', ').toLowerCase()}${waiting.length?' · hold sent to Approvals':''}`);
}
function miNoShow(id){
  const o=oppCur||miOpp(), a=miFind(o,id); if(!a) return; const f=miFirst(o);
  qaDrawerOpen('The meeting didn’t take place',`<div class="in-mu" style="margin-bottom:10px">${xesc(miTitle(o,a))} · ${xesc(miWhen(a))}. Nothing is read or written from it.</div>
    <div class="chd-opts">${[['noshow',`${f} didn’t show up`],['late','Cancelled on the day'],['moved','Moved to another date']].map(([k,l],i)=>`<label class="chd-opt"><input type="radio" name="mi-ns" value="${k}" ${i?'':'checked'}> ${xesc(l)}</label>`).join('')}</div>
    <label class="cv-toggle" style="margin-top:12px"><input type="checkbox" id="mi-ns-task" checked> Propose a follow-up task to rebook ${xesc(f)}</label>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="miNoShowSave('${id}')">Save</button>`);
}
function miNoShowSave(id){
  const o=oppCur, x=getExt(o), a=miFind(o,id), why=document.querySelector('input[name="mi-ns"]:checked')?.value||'noshow', task=document.getElementById('mi-ns-task')?.checked, f=miFirst(o);
  qaDrawerClose();
  a.status='noshow'; a.recent=true; a.m.mode='noshow';
  a.note={noshow:`${f} didn’t show up.`,late:'Cancelled on the day.',moved:'Moved to another date.'}[why]+(task?` Follow-up to rebook ${f} proposed.`:'');
  x.comms.unshift({ch:'sys',t:'Just now',text:`${miTitle(o,a)} · didn’t happen · ${a.note}`});
  if(why==='noshow'){o.noShows=o.noShows||{appt:0,contract:0};o.noShows.appt++;}
  if(task){x.next={label:`Rebook the ${(a.label||'meeting').toLowerCase()} with ${f}`,due:'Due tomorrow',overdue:false};
    if(typeof TQ!=='undefined'){tqInit();TQ.unshift({id:'n'+Date.now(),title:`Rebook the ${(a.label||'meeting').toLowerCase()} with ${f}`,rec:o.id,due:cvISO(cvAddDays(cvToday(),1)),time:null,owner:tqMe(),agent:false,source:'from_signal',status:'open',createdBy:'agent',remind:'',fresh:true});tqBadge();}}
  openOpp(o.id); showToast(`Marked as not held${task?' · follow-up task created':''}`);
  if(why==='moved') setTimeout(()=>qaViewing(),120);
}
function miReschedule(id){const o=oppCur;if(!o)return;openOpp(o.id);setTimeout(()=>qaViewing(),60);}
function miAddUnit(id){const o=oppCur;if(!o)return;showToast(`Pick a unit from Units to add it to the ${(miFind(o,id)?.label||'appointment').toLowerCase()}`);}
function miCancel(id){
  const o=oppCur, x=getExt(o), a=miFind(o,id); if(!a||!confirm(`Cancel the ${(a.label||'appointment').toLowerCase()} on ${miWhen(a)}? ${miFirst(o)} is told on WhatsApp.`)) return;
  a.status='cancelled'; x.comms.unshift({ch:'sys',t:'Just now',text:`${miTitle(o,a)} on ${miWhen(a)} cancelled · ${miFirst(o)} told on WhatsApp`}); renderOpp(); showToast('Appointment cancelled');
}
// Demo controls: the end time passes (in-person → Needs outcome), or a Bricly Meet call ends (→ already transcribing).
function miSimEnd(id){
  const o=oppCur, a=miFind(o,id); if(!a) return;
  if(a.kind==='video'){MI={oppId:o.id,apptId:id};a.m.src='rec';miOpen(o.id,id);miRun('rec');return;}
  a.end=a.end||miNowHm(); a.status='pending'; renderOpp(); showToast(`The ${(a.label||'meeting').toLowerCase()} ended · it now needs an outcome`);
}
function miWaArrive(){const {a}=miCur();a.m.tab='overview';a.m.mode='note';a.m.nv='wa';a.m.src='note';a.status='ready';a.m.props={};miRender();showToast('WhatsApp summary matched to this appointment');}
function miWaYes(){
  const {o,a}=miCur(), d=miData(o,a); a.m.waYes=true;
  d.props.forEach(p=>{if(!p.gate&&miPropState(a,p)==='prop')a.m.props[p.id]='ok';if(p.gate&&miPropState(a,p)==='gate')a.m.props[p.id]='ok';});
  miCommit(o,a,d);
}
// Calls through the Bricly line: logged on the opportunity, recorded after the notice, read when they end.
function miCall(){
  const o=oppCur; if(!o) return; const x=getExt(o);
  const live=miAppts(o,x).find(a=>a.status==='live'); if(live){miOpen(o.id,live.id);return;}
  const now=miNowHm(), a={id:'MT-N'+(++MI_N),kind:'call',label:'Call',date:'Today',mon:new Date().toLocaleString('en-GB',{month:'short'}).toUpperCase(),day:String(new Date().getDate()),start:now,end:'',where:'Bricly line · outbound',status:'live',m:{props:{},edits:{},mode:'phone',sec:0,live:[]}};
  a.when=`Today, ${now} · Bricly line`; x.appts=[a,...(x.appts||[])];
  miOpen(o.id,a.id);
  clearInterval(MI_CALL_T);
  MI_CALL_T=setInterval(()=>{
    if(a.status!=='live'){clearInterval(MI_CALL_T);MI_CALL_T=null;miCallBar();return;}
    const m=a.m; if(!m.paused) m.sec++;
    if(m.sec===4) m.live.push(`${miFirst(o)}: the payment plan is the open point, 30% on signing is too much right now.`);
    if(m.sec===9) m.live.push(`${miFirst(o)} asks whether ${miUnits(o,a).u2.id} can be kept until next Friday.`);
    if(miOnPage()&&MI.apptId===a.id){if([4,9].includes(m.sec))miRender();else{const c=document.getElementById('mi-call-clock');if(c)c.textContent=`Connected · ${miClock(m.sec)} · ${m.paused?'recording paused':'recording'}`;}}
    miCallBar();
  },1000);
}
function miCallLive(){for(const o of OPPS){const x=EXT[o.id];const a=x&&(x.appts||[]).find(v=>v.status==='live');if(a)return {o,a};}return null;}
function miCallEnd(){
  const {o,x,a}=miCur(); if(!a) return;
  a.end=miNowHm(); a.status='proc'; a.m.src='rec'; a.m.mode='phone'; a.m.step=0; a.m.pct=0;
  x.comms.unshift({ch:'sys',t:'Just now',text:`Call · ${a.start} to ${a.end} · outbound · ${miClock(a.m.sec)} · recording and transcript attached`});
  miCallBar(); miRender();
  setTimeout(()=>{a.status='ready';if(miOnPage()&&MI.apptId===a.id){a.m.mode='trans';miRender();}else showToast(`Proposals ready from your call with ${o.lead}`);},2200);
}
function miCallBar(){
  let bar=document.getElementById('mi-callbar'); const c=miCallLive();
  const show=c&&!(miOnPage()&&MI.apptId===c.a.id);
  if(!show){if(bar)bar.hidden=true;return;}
  if(!bar){bar=document.createElement('div');bar.id='mi-callbar';bar.className='mi-callbar';document.querySelector('.app').appendChild(bar);}
  bar.hidden=false;
  bar.innerHTML=`<span class="mi-cdot live"></span><b>${xesc(c.o.lead)}</b><span>${miClock(c.a.m.sec||0)} · recording</span><button type="button" class="btn-ghost chd-b" onclick="miOpen('${c.o.id}','${c.a.id}')">Return</button><button type="button" class="btn-danger chd-b" onclick="miOpen('${c.o.id}','${c.a.id}');miCallEnd()">End call</button>`;
}
const miBaseGo=window.go, miBaseOpenOpp=window.openOpp;
window.go=function(p){miNoteStop();miBaseGo(p);miCallBar();if(p==='unmatched')miUnmRender();};
window.openOpp=function(id){miNoteStop();miBaseOpenOpp(id);miCallBar();};

// ---------- Contacts › Unmatched messages (FS-412 · 2d) ----------
let MI_UNM=[
  {id:'U1',from:'+356 9912 3344',when:'10:48',text:'Hi, is B-12 at Verdala still available? Saw it on the portal and would like to see it this week.',hint:'Possible match: Karl Buhagiar',match:'Karl Buhagiar',ev:'Same first name in the signature. Enquired about Verdala on Fri 25 Sep from +356 7921 4480.',dev:'Verdala',unit:'B-12'},
  {id:'U2',from:'anna.c@outlook.com',when:'09:15',text:'Do you have anything with three bedrooms at Mercury? Budget around 450.',hint:'No match · new enquiry',dev:'Mercury'},
  {id:'U3',from:'+44 7700 900412',when:'Wed 30 Sep',text:'Following up on the brochure you sent my husband. Is the penthouse still available?',hint:'Possible match: 2 contacts',dev:'Onyx Rise'},
];
let MI_UNM_SEL='U1', MI_UNM_PICK={};
function miUnmBadge(){const b=document.getElementById('miUnmBadge');if(b){b.textContent=MI_UNM.length;b.hidden=!MI_UNM.length;}}
function miUnmRender(){
  const root=document.getElementById('unm-root'); if(!root) return;
  const m=MI_UNM.find(v=>v.id===MI_UNM_SEL)||MI_UNM[0];
  const opts=m?[...(m.match?[['add',`${m.match} · add this number to him`,m.ev]]:[]),['lead','Create a new lead',`${m.dev}${m.unit?' · interested in '+m.unit:''} · source ${/@/.test(m.from)?'email':'WhatsApp'}`],['none','Not a buyer','Keep the message, don’t create anything']]:[];
  const pick=m&&(MI_UNM_PICK[m.id]||opts[0][0]);
  root.innerHTML=`<div class="crm-page-heading"><div><div class="page-title">Unmatched messages</div><div class="page-sub">Messages from numbers and emails that aren’t on a contact. A reply is drafted only after the match.</div></div></div>
    ${MI_UNM.length?`<div class="mi-unm"><div class="mi-unm-list">${MI_UNM.map(v=>`<button type="button" class="mi-unm-i ${v===m?'on':''}" onclick="MI_UNM_SEL='${v.id}';miUnmRender()"><div class="row-between"><b>${xesc(v.from)}</b><span class="in-mu">${xesc(v.when)}</span></div><div class="mi-clip">${xesc(v.text)}</div><div class="in-mu">${xesc(v.hint)}</div></button>`).join('')}</div>
      <div class="dcard mi-unm-d"><div class="row-between"><b>${xesc(m.from)}</b><span class="in-mu">${/@/.test(m.from)?'Email':'WhatsApp'} · ${xesc(m.when)}</span></div><div class="mi-bub in">${xesc(m.text)}</div>
        <div class="side-h" style="margin-top:14px">Who is this?</div>
        <div class="in-opts">${opts.map(([k,l,s])=>`<button type="button" class="${pick===k?'on':''}" onclick="MI_UNM_PICK['${m.id}']='${k}';miUnmRender()"><b>${xesc(l)}</b><span class="in-mu">${xesc(s)}</span></button>`).join('')}</div>
        <div class="mi-acts-r"><span class="in-mu">Nothing is created until you choose.</span><button class="btn-primary" onclick="miUnmDo()">${{add:`Add to ${m.match||''}`,lead:'Create lead',none:'Mark not a buyer'}[pick]}</button></div></div></div>`
      :'<div class="tq-empty big"><b>All messages matched</b><span>New messages from unknown numbers and emails wait here.</span></div>'}`;
}
function miUnmDo(){
  const m=MI_UNM.find(v=>v.id===MI_UNM_SEL)||MI_UNM[0]; if(!m) return;
  const pick=MI_UNM_PICK[m.id]||(m.match?'add':'lead');
  MI_UNM=MI_UNM.filter(v=>v!==m); MI_UNM_SEL=MI_UNM[0]?.id; miUnmBadge();
  if(pick==='add'){const o=OPPS.find(v=>v.lead===m.match);if(o){getExt(o).comms.unshift({ch:'wa',dir:'in',who:m.match,t:`Today ${m.when}`,text:m.text},{ch:'sys',t:'Just now',text:`${m.from} added to ${m.match} · the message was matched from Unmatched and read`});openOpp(o.id);showToast(`${m.from} added to ${m.match} · Bricly is reading the message on his opportunity`);return;}showToast(`${m.from} added to ${m.match}`);}
  else if(pick==='lead') showToast(`New lead created · ${m.dev} · source ${/@/.test(m.from)?'email':'WhatsApp'}`);
  else showToast('Marked as not a buyer · the message is kept');
  miUnmRender();
}
if(typeof window.renderContacts==='function'){const b=window.renderContacts;window.renderContacts=function(){b();const t=document.getElementById('ct-tabs');if(t&&MI_UNM.length)t.insertAdjacentHTML('beforeend',`<button class="tab mi-unm-tab" onclick="go('unmatched')">Unmatched messages <span class="ni-badge">${MI_UNM.length}</span></button>`);};}

// ---------- Settings › Calls and meetings (1s) ----------
(function miSettings(){
  if(!window.BST||typeof ST_NAV_ACC==='undefined') return;
  const f=(l,c,v,x)=>[l,c,v,x||{}];
  if(!ST_NAV_ACC.some(([k])=>k==='calls')) ST_NAV_ACC.splice(ST_NAV_ACC.findIndex(([k])=>k==='approvals')+1,0,['calls','Calls and meetings']);
  ST_ACCESS.calls={owner:'f',manager:'f'};
  window.BST.pages.calls={nav:'calls',t:'Calls and meetings',tag:'v1',cr:'Calls and meetings',d:'How calls and meetings reach Bricly without typing. Recordings are read into proposals with the same approval gate as chat. Applies to every rep; changes are logged.',b:[
    {k:'fields',title:'Phone calls',desc:'Bricly line · +356 2010 0101',rows:[
      f('Call buyers through Bricly','toggle',true,{v:'On for all reps',s:'Click to call from any contact or opportunity. The call is logged where it was dialled from.'}),
      f('Record and transcribe calls','toggle',true,{v:'On · notice in English and Maltese',s:'A recording notice plays before the buyer is connected. Calls under 30 seconds are logged, not read.'}),
      f('Inbound calls to the Bricly line','toggle',true,{v:'On · 20 s then team',s:'Ring the owning rep first, then the team. Missed calls become a task with the voicemail transcribed.'}),
      f('Read calls into proposals','toggle',true,{v:'On · 6 credits per 10 min',s:'Same extraction and approval gate as meetings and messages.'})]},
    {k:'fields',title:'Video calls',desc:'Bricly Meet and external links',rows:[
      f('Bricly Meet link in every video invite','toggle',true,{v:'On',s:'Recorded and transcribed on its own. The buyer accepts the recording notice on joining.'}),
      f('Notetaker for Zoom, Teams, Google Meet','toggle',true,{v:'On · announces itself',s:'Joins when the invite has an external link. Asks to join; the rep can decline per call.'}),
      f('Keep the video','toggle',false,{v:'Audio only after 30 days',s:'Audio is always kept. Video is kept 30 days unless a manager extends it.'})]},
    {k:'fields',title:'In-person meetings',desc:'Sales suite and site',rows:[
      f('Phone app recording','toggle',true,{v:'On',s:'One tap in the Bricly app. Consent is confirmed on screen before recording starts and saved with the file.'}),
      f('Upload a recording','toggle',true,{v:'On',s:'Fallback for any device. Same consent step.'}),
      f('Ask for the outcome when a meeting ends','toggle',true,{v:'On · 15 min after the end time',s:'Appointment card turns “Needs outcome” and the rep is nudged on the app and WhatsApp.'})]}]};
})();

(function miInit(){
  const ni=document.querySelector('.ni[data-page="contacts"]');
  if(ni&&!document.getElementById('miUnmBadge')) ni.insertAdjacentHTML('beforeend','<span class="ni-badge" id="miUnmBadge"></span>');
  miUnmBadge();
  if(typeof CRUMB!=='undefined') CRUMB.unmatched='<a onclick="go(\'contacts\')">Contacts</a><span class="sep">/</span><span class="cur">Unmatched messages</span>';
})();
