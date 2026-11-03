// Contact record: one person with every linked opportunity, deal, closed purchase, conversation,
// appointment, task, note, document and shared item, split into tabs so only one section shows at a time.
// Everything is read from the linked records, so the contact page and those records always agree.

const CT_UI={tab:'overview',feedCh:'all',feedRec:'all',ch:'wa',pastOpen:false,moreOpen:false,noteRec:''};
function ctFirst(c){return c.name.split(' ')[0];}
function ctMine(c){return ctKind(c)==='buyer'?ctOpps(c):[];}
function ctMineIds(c){return ctMine(c).map(o=>o.id);}
function ctKind(c){return c.type==='partner'?'partner':['vendor','supplier'].includes(c.type)?'vendor':'buyer';}
function ctEsc(s){return xesc(String(s??''));}

// ---------- linked records ----------
function ctLinks(c){
  const rows=ctMine(c).map(o=>({o,d:dealFor(o.id)}));
  return {
    opps:rows.map(r=>r.o),
    open:rows.filter(r=>!r.d&&!['Nurture','Lost'].includes(r.o.stage)&&!isCompleted(r.o)).map(r=>r.o),
    past:rows.filter(r=>!r.d&&['Nurture','Lost'].includes(r.o.stage)).map(r=>r.o),
    active:rows.filter(r=>r.d&&!dealDone(r.o)),
    closed:[...rows.filter(r=>r.d&&dealDone(r.o)),...rows.filter(r=>!r.d&&isCompleted(r.o))],
  };
}
function ctRecLabel(o){const d=dealFor(o.id);return d?`${d.id} · ${o.units[0]||o.devs[0]}`:`${o.id} · ${o.units[0]||o.devs[0]}`;}
function ctOpenRec(oppId){const d=dealFor(oppId);if(d)openDeal(d.id);else openOpp(oppId);}
function ctRecSelect(id,c,{contactOnly=false,value=''}={}){
  const L=ctLinks(c), list=[...L.open,...L.active.map(r=>r.o),...L.closed.map(r=>r.o),...L.past];
  return `<select id="${id}" class="ct-sel" aria-label="Record">${contactOnly?`<option value="">${ctEsc(c.name)} · contact only</option>`:''}${list.map(o=>`<option value="${o.id}" ${o.id===value?'selected':''}>${ctEsc(ctRecLabel(o))}</option>`).join('')}</select>`;
}
function ctPartnerDeals(c){return DEALS.map(d=>({d,o:dealOpp(d)})).filter(r=>r.o&&r.o.closed&&typeof dfState==='function'&&dfState(r.o).comm.shares.some(s=>s.name===c.name));}
function ctReferred(c){return CONTACTS.filter(k=>k.ref===c.name&&k.id!==c.id);}

// ---------- merged activity (all linked records, newest first) ----------
function ctAgeKey(t){
  t=String(t||'');
  if(/just now/i.test(t)) return -1;
  const hm=t.match(/(\d{1,2}):(\d{2})/), mins=hm?(+hm[1])*60+(+hm[2]):0;
  if(/^today/i.test(t)) return -mins/1440;
  if(/^yesterday/i.test(t)) return 1-mins/1440;
  const ago=t.match(/^(\d+)\s*(day|week|month)/i);
  if(ago) return +ago[1]*({day:1,week:7,month:30}[ago[2].toLowerCase()]);
  const d=typeof dfParseDate==='function'?dfParseDate(t):null;
  if(d){let n=Math.round((DF_TODAY-d)/864e5);if(n<-30)n+=365;return n-mins/1440;}
  return 400;
}
function ctActivity(c){
  const items=[];
  ctMine(c).forEach(o=>getExt(o).comms.forEach((m,i)=>items.push({m,o,k:ctAgeKey(m.t),i})));
  (c.comms||[]).forEach((m,i)=>items.push({m,o:null,k:ctAgeKey(m.t),i}));
  items.sort((a,b)=>a.k-b.k||a.i-b.i);
  items.push({m:{ch:'sys',t:c.created,text:`Contact created from ${c.source}${c.ref?' · referred by '+c.ref:''}`},o:null,k:999,i:0});
  return items;
}
function ctItemHtml(it){
  const base=it.m.df?`<div class="fi sys"><span>${ctEsc(it.m.text)}${it.m.by?`<span class="df-mu df-by">${ctEsc(it.m.by)}</span>`:''}</span><span class="t">${ctEsc(it.m.t)}</span></div>`:feedItem(it.m);
  return `<div class="ct-fi">${base}${it.o?`<button type="button" class="ct-rec" onclick="ctOpenRec('${it.o.id}')">${ctEsc(ctRecLabel(it.o))}</button>`:''}</div>`;
}

// ---------- appointments, tasks, notes, documents, shared ----------
function ctAppts(c){
  const ids=new Set(ctMineIds(c)), out=[], seen=new Set(), today=typeof cvToday==='function'?cvISO(cvToday()):'';
  const evs=typeof cvBuildEvents==='function'?[...cvBuildEvents(),...(typeof cvSeedEvents==='function'?cvSeedEvents():[])]:[];
  evs.forEach(e=>{
    if(seen.has(e.id)||e.cancelled||!(e.contact===c.name||ids.has(e.oppId))) return; seen.add(e.id);
    out.push({type:CV_TYPE_META[e.type]?.label||e.type,title:e.title,when:`${typeof tqDay==='function'?tqDay(e.dateISO):e.dateISO} · ${e.start}${e.end?'–'+e.end:''}`,loc:e.location,outcome:e.outcome,past:e.dateISO<today,sort:e.dateISO+e.start,oppId:e.oppId,cal:true});
  });
  ctMine(c).forEach(o=>{
    const x=getExt(o);
    (x.appts||[]).forEach(a=>out.push({type:a.label,title:`${a.label} with ${ctFirst(c)}`,when:a.when,loc:'',past:false,sort:'~',oppId:o.id}));
    const d=dealFor(o.id); if(!d||!o.closed||typeof dfState!=='function') return;
    const df=dfState(o), a=df.appt;
    if(df.completed) out.push({type:'Final deed',title:'Final deed signed',when:df.completed.date||'',loc:dfNotary(o),past:true,sort:'0',oppId:o.id});
    else if(['confirmed','held','tentative'].includes(a.state)) out.push({type:'Final deed',title:`Final deed · ${a.state==='tentative'?'tentative':'booked'}`,when:`${a.date}, ${a.time}`,loc:a.place,past:false,sort:'~',oppId:o.id});
    else if(a.target) out.push({type:'Final deed',title:'Final deed · target only, not booked',when:'Target '+a.target,loc:'',past:false,sort:'~~',oppId:o.id});
    if(df.handover) out.push({type:'Handover',title:'Handover recorded',when:df.handover.at||'',loc:'',past:true,sort:'0',oppId:o.id});
  });
  return out.sort((a,b)=>a.past===b.past?(a.past?b.sort.localeCompare(a.sort):a.sort.localeCompare(b.sort)):a.past?1:-1);
}
function ctTasks(c){
  if(typeof tqInit!=='function') return [];
  tqInit();
  return TQ.filter(t=>(TQ_REC[t.rec]&&TQ_REC[t.rec].name===c.name)||ctMineIds(c).includes(t.rec)||t.contactId===c.id);
}
function ctNotes(c){
  const out=(c.notesList||[]).map((text,i)=>({text,who:c.rep||'You',t:i===0&&c.noteJust?'Just now':'',o:null,idx:i}));
  ctMine(c).forEach(o=>getExt(o).comms.forEach(m=>{if(m.ch==='note') out.push({text:m.text,who:m.who||'You',t:m.t,o,pinned:m.pinned});}));
  return out;
}
function ctDocRecs(c){
  const L=ctLinks(c);
  return [...L.active.map(r=>r.o),...L.open,...L.closed.map(r=>r.o),...L.past].map(o=>({o,docs:ensureDocs(o,getExt(o)).filter(d=>d.g!=='KYC')})).filter(r=>r.docs.length);
}
function ctShared(c){
  const L=ctLinks(c);
  return [...L.open,...L.active.map(r=>r.o)].flatMap(o=>ensureShared(o,getExt(o)).map(s=>({s,o})));
}
function ctOpenTasks(c){return ctTasks(c).filter(t=>['open','needs_approval','running','failed'].includes(t.status));}

// ---------- page shell ----------
function ctTabsFor(c){
  const k=ctKind(c), L=ctLinks(c), t=[['overview','Overview']];
  if(k==='buyer') t.push(['opps',`Opportunities · ${L.open.length}`],['deals',`Deals · ${L.active.length}`],['closed',`Closed · ${L.closed.length}`]);
  if(k==='partner') t.push(['linked',`Linked deals · ${ctPartnerDeals(c).length+ctOpps(c).length}`]);
  t.push(['activity','Activity']);
  if(k!=='vendor') t.push(['appts',`Appointments · ${ctAppts(c).filter(a=>!a.past).length}`]);
  t.push(['tasks',`Tasks · ${ctOpenTasks(c).length}`],['notes',`Notes · ${ctNotes(c).length}`],['docs','Documents']);
  if(k==='buyer') t.push(['shared',`Shared · ${ctShared(c).length}`]);
  t.push(['details','Details']);
  return t;
}
function ctTabsHtml(c){
  const tabs=ctTabsFor(c);
  if(!tabs.some(([k])=>k===CT_UI.tab)) CT_UI.tab='overview';
  const narrow=window.innerWidth<900, max=4;
  let shown=tabs, more=[];
  if(narrow&&tabs.length>max+1){
    shown=tabs.slice(0,max); more=tabs.slice(max);
    const cur=more.find(([k])=>k===CT_UI.tab); if(cur){shown=[...shown,cur];more=more.filter(t=>t!==cur);}
  }
  return `<div class="tabs ct-tabs" role="tablist" aria-label="Contact sections">${shown.map(([k,l])=>`<button type="button" role="tab" class="tab ${CT_UI.tab===k?'on':''}" aria-selected="${CT_UI.tab===k}" data-ct-tab="${k}" onclick="ctSetTab('${k}')">${l}</button>`).join('')}
    ${more.length?`<span class="ct-more-wrap"><button type="button" class="tab ct-more" aria-haspopup="menu" aria-expanded="${CT_UI.moreOpen}" onclick="event.stopPropagation();CT_UI.moreOpen=!CT_UI.moreOpen;renderContact()">More ▾</button>${CT_UI.moreOpen?`<div class="df-menu ct-more-menu" role="menu">${more.map(([k,l])=>`<button type="button" role="menuitem" onclick="ctSetTab('${k}')">${l}</button>`).join('')}</div>`:''}</span>`:''}</div>`;
}
function ctSetTab(k){CT_UI.tab=k;CT_UI.moreOpen=false;CT_UI.menu=false;renderContact();document.getElementById('content').scrollTop=0;}
document.addEventListener('click',e=>{if((CT_UI.moreOpen||CT_UI.menu)&&!e.target.closest('.ct-more-wrap,.ct-act-wrap')&&document.getElementById('p-contact')?.classList.contains('on')){CT_UI.moreOpen=false;CT_UI.menu=false;renderContact();}});

window.renderContact=function(){
  const c=ctCur; if(!c) return;
  const tab=(ctTabsHtml(c),CT_UI.tab);
  const body={overview:ctOverviewHtml,opps:ctOppsHtml,deals:ctDealsTabHtml,closed:ctClosedHtml,linked:ctLinkedHtml,activity:ctActivityHtml,appts:ctApptsHtml,
    tasks:ctTasksHtml,notes:ctNotesHtml,docs:ctDocsTabHtml,shared:ctSharedHtml,details:ctDetailsHtml}[tab]||ctOverviewHtml;
  document.getElementById('ct-root').innerHTML=`
  <div class="opp-page-head">
    <div class="crm-page-heading">
      <div class="rep" style="margin:0">
        <div class="avatar" style="width:44px;height:44px;font-size:15px;background:${color(c.name)}">${initials(c.name)}</div>
        <div><div class="page-title">${ctEsc(c.name)} <span class="pill ${CT_TYPE[c.type].pill}">${CT_TYPE[c.type].l}</span> <span class="pill ${CT_STATUS[c.status].pill}">${CT_STATUS[c.status].l}</span>${ownsFor(c.name).length?' <span class="own-badge">Owner</span>':''}</div>
        <div class="page-sub">${ctEsc(c.btype)}${c.company?' · '+ctEsc(c.company):''} · ${c.id} · ${ctEsc(c.rep||'Unassigned')}</div></div>
      </div>
    </div>
    <div class="crm-page-controls">
      ${ctTabsHtml(c)}
      <div class="toolbar">
        <button class="qa-btn" onclick="ctMessage()" ${c.status==='dnc'?'disabled title="Do not contact"':''}><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 3h10v7H6l-3 2.5V3z"/></svg>Message</button>
        <button class="qa-btn" onclick="ctLogOpen()"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7 3.5v7M3.5 7h7"/></svg>Log activity</button>
        ${ctKind(c)==='buyer'?`<button class="qa-btn" onclick="ctBookOpen()"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="2.5" width="10" height="9.5" rx="1.5"/><path d="M2 5.5h10M5 2.5V1M9 2.5V1"/></svg>Book appointment</button>`:''}
        <span class="ct-act-wrap"><button class="btn-primary cr-actions-btn" aria-haspopup="menu" aria-expanded="${!!CT_UI.menu}" onclick="event.stopPropagation();CT_UI.menu=!CT_UI.menu;renderContact()">Actions <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button>
        ${CT_UI.menu?`<div class="df-menu" role="menu">${ctKind(c)==='buyer'?`<button type="button" role="menuitem" onclick="ctNewOppFor()">New opportunity</button>`:''}<button type="button" role="menuitem" onclick="ctAddTask()">Add task</button><button type="button" role="menuitem" onclick="ctEditOpen()">Edit details</button><button type="button" role="menuitem" onclick="ctMergeOpen()">Merge with another contact</button>${c.status!=='dnc'?`<button type="button" role="menuitem" onclick="ctDncOpen()">Mark do-not-contact</button>`:`<button type="button" role="menuitem" onclick="ctDncClear()">Allow contact again</button>`}</div>`:''}</span>
      </div>
    </div>
  </div>
  ${ctStripHtml(c)}
  ${ctSuggHtml(c)}
  <div class="ct-body" role="tabpanel" aria-label="${ctEsc((ctTabsFor(c).find(t=>t[0]===tab)||[])[1]||'')}">${body(c)}</div>`;
};
function ctStripHtml(c){
  const k=ctKind(c), L=ctLinks(c), act=ctActivity(c), last=act.find(i=>i.m.ch!=='sys');
  const tile=(key,v,d,tab)=>`<button type="button" class="df-tile df-tile-btn ct-tile" ${tab?`onclick="ctSetTab('${tab}')"`:'disabled'}><div class="k">${key}</div><div class="v">${v}</div><div class="d">${d}</div></button>`;
  const lastTile=tile('Last contact',ctEsc(c.last||'—'),last?`${CH_META[last.m.ch]?.label||'Activity'} · ${ctEsc(last.m.who||'')}`:'No messages yet','activity');
  if(k==='partner'){
    const pd=ctPartnerDeals(c), share=pd.reduce((s,r)=>{const cm=dfState(r.o).comm,sh=cm.shares.find(x=>x.name===c.name);return s+dfShareAmt(cm,sh);},0);
    return `<div class="dcard df-tiles ct-strip">${tile('Linked deals',pd.length,pd.length?pd.map(r=>r.d.id).join(', '):'None yet','linked')}${tile('Commission share',fmtEur(share),pd.length?'Across linked deals':'—','linked')}${tile('Referred contacts',ctReferred(c).length,ctReferred(c).map(r=>r.name).join(', ')||'None yet','details')}${lastTile}</div>`;
  }
  if(k==='vendor') return `<div class="dcard df-tiles ct-strip">${tile('Open tasks',ctOpenTasks(c).length,'Linked to this contact','tasks')}${tile('Notes',ctNotes(c).length,'','notes')}${tile('Source',ctEsc(c.source||'—'),c.ref?'Referred by '+ctEsc(c.ref):'','details')}${lastTile}</div>`;
  const kyc=ctMine(c).length?ctKyc(c):null;
  const openVal=L.open.reduce((s,o)=>s+(o.value||0),0)*1000, closedVal=L.closed.reduce((s,r)=>s+(r.o.value||0),0)*1000;
  const a0=L.active[0];
  return `<div class="dcard df-tiles ct-strip">
    ${tile('Open opportunities',L.open.length,L.open.length?fmtEur(openVal)+' · '+ctEsc(L.open[0].stage):'None open','opps')}
    ${tile('Active deals',L.active.length,a0?ctEsc(closedStepLabel(a0.o).replace(/<[^>]*>/g,'')):'No deal in progress','deals')}
    ${tile('Closed',L.closed.length,L.closed.length?fmtEur(closedVal)+' · owner':'No completed purchase','closed')}
    ${tile('KYC',kyc?(kyc.verified?'Verified':'Incomplete'):'Not started',kyc?`${kyc.rows.filter(r=>r.status==='verified').length} of 3 verified`:'Starts with the first opportunity','docs')}
    ${lastTile}
  </div>`;
}
// Bricly found: open decisions across every linked record. Each card opens the record where it's decided.
function ctSuggHtml(c){
  if(typeof dfSuggStrip!=='function') return '';
  const cards=[], L=ctLinks(c), first=ctFirst(c);
  L.active.forEach(({o,d})=>{
    const df=dfState(o);
    df.proposals.filter(p=>!p.slot||dfSlotState(o,p.slot)==='proposed'||p.kind!=='attach').forEach(p=>{
      const target=p.kind==='attach'?`Attach to ${dfSlotInfo(o,p.slot).label} on ${d.id}`:p.kind==='pick'?`Low confidence · which instalment on ${d.id}?`:`Set as final deed appointment on ${d.id}`;
      cards.push(dfSuggCard({...p,from:'From '+p.from,target,acts:`<button type="button" class="btn-primary df-sm" onclick="openDeal('${d.id}')">Review on ${d.id}</button>`}));
    });
  });
  L.open.forEach(o=>{
    const x=getExt(o);
    if(typeof inMsgSeed==='function'){inMsgSeed(o,x);const m=x.inMsg;if(m&&m.state!=='done'&&Object.values(m.props).some(v=>v==='prop')) cards.push(dfSuggCard({channel:'WhatsApp',time:'Today 11:02',conf:'high',title:`Bricly read ${first}’s message`,preview:'2 attachments to file and a reply drafted to 2 questions',from:'From '+o.lead,target:`Review on ${o.id}`,acts:`<button type="button" class="btn-primary df-sm" onclick="openOpp('${o.id}')">Review on ${o.id}</button>`}));}
    const dr=typeof llDraftFor==='function'?llDraftFor(o,x):null;
    if(dr&&!['sent','rejected'].includes(dr.status)) cards.push(dfSuggCard({channel:'Bricly',time:'Today',conf:'high',title:`${dr.trigger} · draft to ${first}`,preview:dr.text.length>140?dr.text.slice(0,137)+'…':dr.text,from:dr.why,target:`Approve on ${o.id}`,acts:`<button type="button" class="btn-primary df-sm" onclick="openOpp('${o.id}')">Review draft</button>`}));
  });
  if(typeof APPROVALS!=='undefined') APPROVALS.filter(r=>!r.decided&&ctMineIds(c).includes(r.opp)).forEach(r=>cards.push(dfSuggCard({channel:'Bricly',time:`Filed ${r.filed}`,conf:'high',title:`${AP_TYPES[r.type]?.l||'Request'} waiting · ${r.id}`,preview:typeof apTerms==='function'?apTerms(r).replace(/<[^>]*>/g,''):'',from:`Filed by ${r.rep}`,target:'Waiting for a manager in Approvals',acts:`<button type="button" class="btn-primary df-sm" onclick="apSel='${r.id}';go('approvals');apRender()">Open in Approvals</button>`})));
  return dfSuggStrip('ct-sugg-track','contact',cards);
}

// ---------- Overview ----------
function ctEmpty(text,btn){return `<div class="ct-empty"><span>${text}</span>${btn||''}</div>`;}
function ctNextActions(c){
  const L=ctLinks(c), out=[];
  L.open.forEach(o=>{const x=getExt(o);if(x.next) out.push({label:x.next.label,due:x.next.due,bad:x.next.overdue,o});});
  L.active.forEach(({o,d})=>{const P=dfProgress(o),s=P.steps[Math.min(P.cur,3)],miss=s.slots.map(id=>dfSlotInfo(o,id)).find(i=>['empty','reported','partial','proposed'].includes(i.state));out.push({label:`${s.label}${miss?' · '+miss.label.toLowerCase():''}`,due:dfStatus(o)[0],bad:dfStatus(o)[1]==='bad',o});});
  ctOpenTasks(c).filter(t=>t.due&&tqDiff(t.due)<=2).forEach(t=>out.push({label:t.title,due:tqDue(t),bad:tqOver(t),task:t}));
  return out;
}
function ctOverviewHtml(c){
  const k=ctKind(c), L=ctLinks(c), next=ctNextActions(c), act=ctActivity(c).slice(0,5);
  const kv=(a,b)=>b?`<div class="side-kv"><div class="k">${a}</div><div class="v">${b}</div></div>`:'';
  const linked=[...L.active.map(r=>({o:r.o,lbl:'Deal',st:dfStatus(r.o)[0]})),...L.open.map(o=>({o,lbl:'Opportunity',st:o.stage})),...L.closed.map(r=>({o:r.o,lbl:'Closed',st:'Completed'})),...L.past.map(o=>({o,lbl:'Past',st:o.stage}))];
  return `<div class="opp-grid"><div>
    <div class="dcard"><div class="row-between"><h3 style="margin:0">Next actions</h3><button type="button" class="btn-ghost df-sm" onclick="ctAddTask()">+ Task</button></div>
      ${next.map(n=>`<div class="ct-line"><span class="df-dot ${n.bad?'':'on'}" style="${n.bad?'border-color:var(--error)':''}"></span><span class="ct-grow"><b>${ctEsc(n.label)}</b><span class="df-mu ${n.bad?'bad':''}"> · ${ctEsc(n.due||'')}</span></span>${n.o?`<button type="button" class="ct-rec" onclick="ctOpenRec('${n.o.id}')">${ctEsc(ctRecLabel(n.o))}</button>`:n.task?`<button type="button" class="ct-rec" onclick="ctSetTab('tasks')">Task</button>`:''}</div>`).join('')||ctEmpty('Nothing due.')}
    </div>
    <div class="dcard"><div class="row-between"><h3 style="margin:0">Recent activity</h3><button type="button" class="df-link" onclick="ctSetTab('activity')">See all</button></div><div class="feed">${act.map(ctItemHtml).join('')}</div></div>
    ${k==='buyer'?ctUnitsHtml(c)+ctObjectionsHtml(c):''}
  </div><div>
    ${k==='buyer'?`<div class="dcard"><div class="side-h">Preferences</div>${kv('Budget',budgetRangeText(c.bmin,c.bmax,null))}${kv('Looking for',ctEsc(c.interest))}${kv('Location',ctEsc(c.ploc))}${kv('Finance',ctEsc(c.finance))}${kv('Timeline',ctEsc(c.timeline))}${c.bmin||c.interest?'':'<div class="df-mu">No preferences yet</div>'}</div>`
      :`<div class="dcard"><div class="side-h">About</div>${kv('Type',ctEsc(c.btype))}${kv('Company',ctEsc(c.company))}${kv('What they do',ctEsc(c.interest))}${kv('Area',ctEsc(c.ploc))}</div>`}
    ${k!=='vendor'?`<div class="dcard"><div class="side-h">Linked records</div>${linked.map(r=>`<button type="button" class="ct-link-row" onclick="ctOpenRec('${r.o.id}')"><span class="df-tag">${r.lbl}</span><span class="ct-grow">${ctEsc(ctRecLabel(r.o))}</span><span class="df-mu">${ctEsc(r.st)}</span></button>`).join('')||(k==='partner'?ctPartnerDeals(c).map(r=>`<button type="button" class="ct-link-row" onclick="openDeal('${r.d.id}')"><span class="df-tag">Agent</span><span class="ct-grow">${r.d.id} · ${ctEsc(r.o.lead)}</span><span class="df-mu">${ctEsc(dfStatus(r.o)[0])}</span></button>`).join('')||'<div class="df-mu">No linked records</div>':'<div class="df-mu">No linked records yet</div>')}</div>`:''}
    <div class="dcard"><div class="side-h">Contact</div>${kv('Phone',ctEsc(c.phone))}${kv('Email',ctEsc(c.email))}${kv('Languages',ctEsc(c.lang))}<div class="side-kv" style="margin:0"><div class="k">Consent</div><div class="v">${ctConsentHtml(c)}</div></div></div>
  </div></div>`;
}
function ctUnitsHtml(c){
  const L=ctLinks(c), short=[...new Set([...L.open,...L.active.map(r=>r.o)].flatMap(o=>o.units))];
  const o=L.open[0];
  const matches=o&&typeof inRanked==='function'?inRanked(o).filter(r=>r.ok&&!short.includes(r.u.id)&&r.s>=2).slice(0,3):[];
  if(!short.length&&!matches.length) return '';
  const row=(u,extra)=>{const un=UN(u);return `<button type="button" class="ct-link-row" onclick="openUnit('${u}')"><span class="ct-grow"><b>${ctEsc(u)}</b><span class="df-mu"> · ${un?`${ctEsc(un.dev)} · ${un.beds===0?'Studio':un.beds+' bed'} · ${fmtEur(un.price)}`:''}</span></span><span class="df-mu">${extra}</span></button>`;};
  return `<div class="dcard"><div class="row-between"><h3 style="margin:0">Units of interest</h3>${o?`<button type="button" class="df-link" onclick="inSortFor('${o.id}')">Sort all units for ${ctEsc(ctFirst(c))}</button>`:''}</div>
    ${short.length?`<div class="df-eyebrow">Shortlisted</div>${short.map(u=>row(u,UN(u)?(UN_STATUS[UN(u).status]?.l||UN(u).status):'')).join('')}`:''}
    ${matches.length?`<div class="df-eyebrow">✦ Bricly matches</div>${matches.map(r=>row(r.u.id,inFit(r.s,false))).join('')}`:''}</div>`;
}
function ctObjectionsHtml(c){
  const list=ctMine(c).flatMap(o=>{const x=getExt(o);if(!x.objections&&typeof IN_SEED_OBJ!=='undefined'&&IN_SEED_OBJ[o.lead])x.objections=IN_SEED_OBJ[o.lead].map(v=>({...v}));return (x.objections||[]).map(v=>({...v,o}));});
  if(!list.length) return '';
  return `<div class="dcard"><div class="row-between"><h3 style="margin:0">Objections and signals</h3><span class="df-mu">${list.filter(v=>v.open).length} open</span></div>
    ${list.map(v=>`<div class="ct-line"><span class="df-tag ${v.open?'':'ok'}">${ctEsc(v.cat)}</span><span class="ct-grow">${ctEsc(v.q)}<div class="df-mu">${ctEsc(v.src)} · ${v.open?'Open':'Answered'}</div></span></div>`).join('')}</div>`;
}

// ---------- Opportunities ----------
function ctTlDots(o){const ti=tlIdx(o,getExt(o));return `<span class="ct-tl" title="${TL4[ti]?.label||''}">${TL4.map((s,i)=>`<i class="${i<ti?'done':i===ti?'cur':''}"></i>`).join('')}</span>`;}
function ctOppRow(o){
  const x=getExt(o), hold=oppHoldState(o,x), reqs=typeof APPROVALS!=='undefined'?APPROVALS.filter(r=>!r.decided&&r.opp===o.id):[];
  return `<div class="ct-card">
    <div class="ct-card-h"><button type="button" class="ct-title-btn" onclick="openOpp('${o.id}')">${o.id} · ${ctEsc(o.units.join(', ')||o.devs[0])}</button><span class="pill ${STAGE_PILL[o.stage]||''}">${ctEsc(o.stage)}</span></div>
    <div class="ct-card-g">
      <div><div class="k">Timeline</div><div class="v">${ctTlDots(o)} ${TL4[tlIdx(o,x)]?.label||''}</div></div>
      <div><div class="k">Next action</div><div class="v ${x.next?.overdue?'bad':''}">${ctEsc(x.next?.label||'—')}</div><div class="df-mu">${ctEsc(x.next?.due||'')}</div></div>
      <div><div class="k">Value</div><div class="v">${moneyText(o)}</div><div class="df-mu">${ctEsc(o.devs.join(', '))} · ${ctEsc(o.rep)}</div></div>
      <div><div class="k">Offer</div><div class="v">${x.offer?fmtEur(x.offer.amt):'None'}</div><div class="df-mu">${x.offer?ctEsc(x.offer.status):''}${x.bids?.length?` · ${x.bids.length} round${x.bids.length>1?'s':''}`:''}</div></div>
    </div>
    <div class="ct-chips">${hold?`<span class="df-chip df-c-warn">${HOLD_LABEL[hold]}${x.hold?.unit?' · '+ctEsc(x.hold.unit):''}</span>`:''}${reqs.map(r=>`<span class="df-chip df-c-info">${AP_TYPES[r.type]?.l||r.type} · ${r.id} waiting</span>`).join('')}${x.blocker?`<span class="df-chip df-c-bad">${ctEsc(x.blocker)}</span>`:''}
      <button type="button" class="btn-ghost df-sm" style="margin-left:auto" onclick="openOpp('${o.id}')">Open</button></div>
  </div>`;
}
function ctOppsHtml(c){
  const L=ctLinks(c);
  return `<div class="row-between ct-sec-h"><h3>Open opportunities</h3><button type="button" class="btn-ghost df-sm" onclick="ctNewOppFor()">+ New opportunity</button></div>
    ${L.open.map(ctOppRow).join('')||ctEmpty(`No open opportunities for ${ctEsc(ctFirst(c))}.`,`<button type="button" class="btn-primary df-sm" onclick="ctNewOppFor()">New opportunity</button>`)}
    ${L.past.length?`<button type="button" class="ct-past" aria-expanded="${CT_UI.pastOpen}" onclick="CT_UI.pastOpen=!CT_UI.pastOpen;renderContact()">Past · ${L.past.length} ${CT_UI.pastOpen?'▴':'▾'}</button>${CT_UI.pastOpen?L.past.map(ctOppRow).join(''):''}`:''}`;
}

// ---------- Deals (active) ----------
function ctDealsTabHtml(c){
  const L=ctLinks(c);
  if(!L.active.length) return ctEmpty('No deal in progress. A deal is created when the POS is signed.',L.open.length?`<button type="button" class="btn-ghost df-sm" onclick="ctSetTab('opps')">See opportunities</button>`:'');
  return L.active.map(({o,d})=>{
    const df=dfState(o), st=dfStatus(o), cash=dfCash(o), pays=dfPayments(o), next=pays.find(r=>dfPayState(r.p)!=='accepted'), a=df.appt, comm=df.comm;
    return `<div class="ct-card">
      <div class="ct-card-h"><button type="button" class="ct-title-btn" onclick="openDeal('${d.id}')">${d.id} · ${ctEsc(o.units[0])} · ${ctEsc(o.devs[0])}</button><span class="df-pill ${st[1]}">${st[0]}</span></div>
      <div class="ct-step">${stepperHtml(o.closed.step)}<span class="df-mu">${closedStepLabel(o)}</span></div>
      <div class="ct-card-g">
        <div><div class="k">Cash collected</div><div class="v">${fmtEur(cash.confirmed)}</div><div class="df-mu">${fmtEur(Math.max(0,cash.total-cash.confirmed))} outstanding${cash.reported?' · +'+fmtEur(cash.reported)+' reported':''}</div></div>
        <div><div class="k">Next payment</div><div class="v">${next?fmtEur(next.p.amt-dfPayEvidence(next.p).confirmed):'—'}</div><div class="df-mu">${next?ctEsc(next.p.label+' · '+next.p.due):'All received'}</div></div>
        <div><div class="k">Final deed</div><div class="v">${['confirmed','held'].includes(a.state)?ctEsc(a.date+', '+a.time):a.target?'Target '+ctEsc(a.target):'Not set'}</div><div class="df-mu">${['confirmed','held'].includes(a.state)?'Booked':'Not booked'}</div></div>
        <div><div class="k">Sales team</div><div class="v">${fmtEur(comm.total)}</div><div class="df-mu">${comm.shares.map(s=>ctEsc(s.name.split(' ')[0])+' '+s.pct+'%').join(' · ')} · ${DF_COMM_ST[comm.state]}</div></div>
      </div>
      ${pays.length?`<details class="ct-pays"><summary>Payment schedule · ${pays.length} instalments</summary>${pays.map(r=>{const ev=dfPayState(r.p);return `<div class="ct-line"><span class="ct-grow">${ctEsc(r.p.label)}<span class="df-mu"> · ${ctEsc(r.p.due)}</span></span><b>${fmtEur(r.p.amt)}</b>${ctPayChip(ev,r.p)}</div>`;}).join('')}</details>`:''}
      <div class="ct-chips"><button type="button" class="btn-ghost df-sm" style="margin-left:auto" onclick="openDeal('${d.id}')">Open deal</button></div>
    </div>`;
  }).join('');
}

function ctPayChip(ev,p){
  const [l,cls]=ev==='accepted'?['Paid','acc']:ev==='reported'?['Reported · receipt missing','warn']:ev==='partial'?['Part paid','warn']:p.status==='overdue'?['Overdue','bad']:['Upcoming','req'];
  return `<span class="df-chip df-c-${cls}">${l}</span>`;
}

// ---------- Closed (portfolio) ----------
function ctClosedHtml(c){
  const L=ctLinks(c);
  if(!L.closed.length) return ctEmpty(`${ctEsc(ctFirst(c))} hasn’t completed a purchase yet.`);
  return `<div class="ct-sec-h"><h3>Owns ${L.closed.length} propert${L.closed.length>1?'ies':'y'}</h3>${L.open.length?'<span class="own-badge">Repeat client</span>':''}</div>
    ${L.closed.map(({o,d})=>{const df=d&&o.closed?dfState(o):null;return `<div class="ct-card">
      <div class="ct-card-h"><button type="button" class="ct-title-btn" onclick="${d?`openDeal('${d.id}')`:`openOpp('${o.id}')`}">${ctEsc(unitLabel(o))} · ${ctEsc(o.devs[0])}</button><span class="df-pill ok">Completed</span></div>
      <div class="ct-card-g">
        <div><div class="k">Price</div><div class="v">${fmtEur(o.value*1000)}</div></div>
        <div><div class="k">Deed signed</div><div class="v">${ctEsc(df?.completed?.date||completedOn(o)||'—')}</div></div>
        <div><div class="k">Handover</div><div class="v">${df?.handover?'Done':df&&!df.handoverAtDeed?'Separate · '+ctEsc(df.delivery||'TBC'):'At the deed'}</div></div>
        <div><div class="k">Deal</div><div class="v">${d?d.id:'Recorded before Bricly'}</div><div class="df-mu">${df?'Commission '+DF_COMM_ST[df.comm.state].toLowerCase():''}</div></div>
      </div>
      <div class="ct-chips"><button type="button" class="btn-ghost df-sm" onclick="openOpp('${o.id}')">Deal archive</button>${d?`<button type="button" class="btn-ghost df-sm" onclick="openDeal('${d.id}')">Open deal</button>`:''}</div>
    </div>`;}).join('')}`;
}

// ---------- Linked deals (partners) ----------
function ctLinkedHtml(c){
  const pd=ctPartnerDeals(c), refs=ctReferred(c);
  return `<div class="ct-sec-h"><h3>Deals ${ctEsc(ctFirst(c))} is on</h3></div>
    ${pd.map(({d,o})=>{const cm=dfState(o).comm,sh=cm.shares.find(s=>s.name===c.name);return `<div class="ct-card">
      <div class="ct-card-h"><button type="button" class="ct-title-btn" onclick="openDeal('${d.id}')">${d.id} · ${ctEsc(o.lead)} · ${ctEsc(o.units[0])}</button><span class="df-pill ${dfStatus(o)[1]}">${dfStatus(o)[0]}</span></div>
      <div class="ct-card-g">
        <div><div class="k">Role</div><div class="v">${ctEsc(sh.role)}</div><div class="df-mu">${ctEsc(sh.company||c.company||'')}</div></div>
        <div><div class="k">Share</div><div class="v">${sh.pct}% · ${fmtEur(dfShareAmt(cm,sh))}</div><div class="df-mu">${ctEsc(cm.payer)} pays</div></div>
        <div><div class="k">Commission</div><div class="v">${DF_COMM_ST[dfShareState(cm,sh)]}</div><div class="df-mu">${DF_TRIGGERS[cm.trigger].toLowerCase()}</div></div>
        <div><div class="k">Deal owner</div><div class="v">${ctEsc(dfCommOwner(cm)?.name||o.rep)}</div></div>
      </div></div>`;}).join('')||ctEmpty(`${ctEsc(ctFirst(c))} isn’t on any deal’s sales team yet. Add them from a deal’s “Edit team & split”.`)}
    <div class="ct-sec-h"><h3>Opportunities they referred</h3></div>
    ${ctOpps(c).map(o=>`<button type="button" class="ct-link-row" onclick="ctOpenRec('${o.id}')"><span class="ct-grow"><b>${ctEsc(o.lead)}</b><span class="df-mu"> · ${ctEsc(ctRecLabel(o))}</span></span><span class="df-mu">${ctEsc(dealFor(o.id)?dfStatus(o)[0]:o.stage)}</span></button>`).join('')||ctEmpty('No referred opportunities yet.')}
    <div class="ct-sec-h"><h3>Contacts they referred</h3></div>
    ${refs.map(r=>`<button type="button" class="ct-link-row" onclick="openContact('${r.id}')"><span class="ct-grow"><b>${ctEsc(r.name)}</b><span class="df-mu"> · ${ctEsc(r.btype)}</span></span><span class="pill ${CT_STATUS[r.status].pill}">${CT_STATUS[r.status].l}</span></button>`).join('')||ctEmpty('No referrals recorded yet.')}`;
}

// ---------- Activity (merged across every linked record) ----------
function ctActivityHtml(c){
  const all=ctActivity(c), recs=[...new Map(all.filter(i=>i.o).map(i=>[i.o.id,i.o])).values()];
  const list=all.filter(i=>(CT_UI.feedCh==='all'||i.m.ch===CT_UI.feedCh)&&(CT_UI.feedRec==='all'||(i.o?i.o.id:'contact')===CT_UI.feedRec));
  const chips=[['all','All'],['wa','WhatsApp'],['sms','SMS'],['em','Email'],['note','Notes'],['sys','System']];
  const first=ctFirst(c), opps=ctLinks(c);
  const target=CT_UI.feedRec!=='all'&&CT_UI.feedRec!=='contact'?CT_UI.feedRec:(opps.active[0]?.o.id||opps.open[0]?.id||'');
  return `<div class="dcard" id="ct-activity">
    <div class="row-between" style="margin-bottom:8px;flex-wrap:wrap;gap:8px"><h3 style="margin:0">Activity</h3>
      <div class="ff-chips" role="group" aria-label="Filter by channel">${chips.map(([k,l])=>`<button type="button" class="ff-chip ${CT_UI.feedCh===k?'on':''}" aria-pressed="${CT_UI.feedCh===k}" onclick="ctFeed('feedCh','${k}')">${l}</button>`).join('')}</div></div>
    <div class="ct-filter"><label class="df-mu" for="ct-feed-rec">Record</label><select id="ct-feed-rec" class="ct-sel" onchange="ctFeed('feedRec',this.value)"><option value="all">All records</option>${recs.map(o=>`<option value="${o.id}" ${CT_UI.feedRec===o.id?'selected':''}>${ctEsc(ctRecLabel(o))}</option>`).join('')}<option value="contact" ${CT_UI.feedRec==='contact'?'selected':''}>Contact only</option></select></div>
    ${c.status==='dnc'?'<div class="df-warn">Do not contact · messages are turned off. Notes can still be added.</div>':''}
    <div class="opp-comp">
      <div class="oc-ch" role="group" aria-label="Send as">${[['wa','WhatsApp'],['sms','SMS'],['em','Email'],['note','Note']].filter(([k])=>c.status!=='dnc'||k==='note').map(([k,l])=>`<button type="button" class="ff-chip ${CT_UI.ch===k?'on':''}" aria-pressed="${CT_UI.ch===k}" onclick="ctComposeCh('${k}')">${l}</button>`).join('')}</div>
      <textarea id="ct-comp" rows="2" aria-label="Message ${ctEsc(first)}" placeholder="${CT_UI.ch==='note'?'Add an internal note…':`Message ${ctEsc(first)} on ${CH_META[CT_UI.ch]?.label}…`}" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();ctSend()}"></textarea>
      <div class="oc-foot"><span class="df-mu">Logs on</span>${ctRecSelect('ct-comp-rec',c,{contactOnly:true,value:target})}<button type="button" class="btn-primary" style="padding:5px 12px;font-size:12px;margin-left:auto" onclick="ctSend()">${CT_UI.ch==='note'?'Add note':'Send'}</button></div>
    </div>
    <div class="feed">${list.map(ctItemHtml).join('')||'<div class="col-empty">No activity for this filter</div>'}</div>
  </div>`;
}
function ctKeep(fn){const t=document.getElementById('ct-comp'),v=t?t.value:'';fn();renderContact();const t2=document.getElementById('ct-comp');if(t2){t2.value=v;t2.focus();}}
function ctFeed(k,v){ctKeep(()=>{CT_UI[k]=v;});}
function ctComposeCh(k){ctKeep(()=>{CT_UI.ch=k;});}
function ctSend(){
  const c=ctCur, t=document.getElementById('ct-comp'), v=t&&t.value.trim(); if(!v) return;
  const ch=CT_UI.ch==='note'||c.status==='dnc'?'note':CT_UI.ch, rec=document.getElementById('ct-comp-rec')?.value, o=rec&&OPPS.find(x=>x.id===rec);
  const entry={ch,dir:'out',who:'You',t:'Just now',text:xesc(v)};
  if(o) getExt(o).comms.unshift(entry); else {c.comms=c.comms||[];c.comms.unshift(entry);}
  if(ch!=='note'){c.last='Today';c.lastD=0;}
  renderContact();
  showToast(ch==='note'?`Note added${o?' to '+ctRecLabel(o):''}`:`Sent to ${ctFirst(c)} via ${CH_META[ch].label}${o?' · logged on '+o.id:''}`);
}
function ctMessage(){if(ctCur.status==='dnc')return;CT_UI.tab='activity';if(CT_UI.ch==='note')CT_UI.ch='wa';renderContact();setTimeout(()=>{const t=document.getElementById('ct-comp');if(t){t.scrollIntoView({behavior:'smooth',block:'center'});t.focus();}},30);}

// ---------- Appointments ----------
function ctApptsHtml(c){
  const all=ctAppts(c), up=all.filter(a=>!a.past), past=all.filter(a=>a.past);
  const row=a=>`<div class="ct-line ct-appt"><span class="df-tag">${ctEsc(a.type)}</span><span class="ct-grow"><b>${ctEsc(a.title)}</b><div class="df-mu">${ctEsc(a.when)}${a.loc?' · '+ctEsc(a.loc):''}${a.outcome?' · '+ctEsc(a.outcome):''}</div></span>${a.oppId?`<button type="button" class="ct-rec" onclick="ctOpenRec('${a.oppId}')">${ctEsc(ctRecLabel(OPPS.find(o=>o.id===a.oppId)))}</button>`:''}${a.cal?`<button type="button" class="df-link" onclick="go('calendar')">Calendar</button>`:''}</div>`;
  return `<div class="dcard"><div class="row-between"><h3 style="margin:0">Upcoming</h3><button type="button" class="btn-ghost df-sm" onclick="ctBookOpen()">+ Book appointment</button></div>
      ${up.map(row).join('')||ctEmpty('Nothing booked.')}</div>
    <div class="dcard"><h3>Past</h3>${past.map(row).join('')||ctEmpty('No past appointments.')}</div>`;
}
function ctPickRec(title,fn){
  const c=ctCur, L=ctLinks(c), list=[...L.open,...L.active.map(r=>r.o)];
  if(list.length===1){oppCur=list[0];window[fn]();return;}
  if(!list.length){showToast(`Start an opportunity for ${ctFirst(c)} first`);ctNewOppFor();return;}
  qaDrawerOpen(title,`<p class="df-mu">Which record is this for?</p>${list.map(o=>`<button type="button" class="df-pick" onclick="oppCur=OPPS.find(x=>x.id==='${o.id}');${fn}()"><span>${ctEsc(ctRecLabel(o))}</span><span class="df-tag">${dealFor(o.id)?'Deal':ctEsc(o.stage)}</span></button>`).join('')}`,`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button>`);
}
function ctBookOpen(){ctPickRec('Book appointment','qaViewing');}

// ---------- Tasks ----------
function ctTasksHtml(c){
  const all=ctTasks(c), open=all.filter(t=>['open','needs_approval','running','failed'].includes(t.status)).sort((a,b)=>(a.due||'9').localeCompare(b.due||'9')), done=all.filter(t=>!open.includes(t));
  const row=t=>{
    const o=OPPS.find(x=>x.id===t.rec)||OPPS.find(x=>TQ_REC[t.rec]&&x.id===TQ_REC[t.rec].id)||ctMine(c)[0];
    const st=t.agent?{needs_approval:'Needs your approval',running:'Bricly is working',failed:'Failed',done:'Done'}[t.status]||'':'';
    return `<div class="ct-line ct-task ${t.status==='done'||t.status==='cancelled'?'done':''}">
      ${t.agent?'<span class="ct-ai">✦</span>':`<input type="checkbox" aria-label="Done: ${ctEsc(t.title)}" ${t.status==='done'?'checked':''} ${t.status==='cancelled'?'disabled':''} onchange="ctTaskToggle('${t.id}')">`}
      <span class="ct-grow"><b>${ctEsc(t.title)}</b><div class="df-mu ${typeof tqOver==='function'&&tqOver(t)?'bad':''}">${t.status==='done'?'Done '+(t.doneOn?tqDay(t.doneOn):''):t.status==='cancelled'?'Cancelled':tqDue(t)}${st?' · '+st:''} · ${ctEsc((TQ_USERS[t.owner]||{}).name||t.owner)}</div></span>
      ${t.status==='needs_approval'?`<button type="button" class="btn-primary df-sm" onclick="ctTaskReview('${t.id}')">Review</button>`:''}
      ${o?`<button type="button" class="ct-rec" onclick="ctOpenRec('${o.id}')">${ctEsc(ctRecLabel(o))}</button>`:''}
    </div>`;};
  return `<div class="dcard"><div class="row-between"><h3 style="margin:0">Open · ${open.length}</h3><button type="button" class="btn-ghost df-sm" onclick="ctAddTask()">+ Add task</button></div>${open.map(row).join('')||ctEmpty('No open tasks.')}</div>
    <div class="dcard"><h3>Done · ${done.length}</h3>${done.map(row).join('')||ctEmpty('Nothing completed yet.')}</div>`;
}
function ctTaskToggle(id){const t=TQ.find(x=>x.id===id);if(!t)return;tqComplete(t);renderContact();if(typeof tqBadge==='function')tqBadge();}
function ctTaskReview(id){const t=TQ.find(x=>x.id===id);if(t)tqDraft(t);}
function ctAddTask(){
  CT_UI.menu=false; const c=ctCur, L=ctLinks(c), o=L.open[0]||null;
  tqAddOpen({rec:o?o.id:'',title:''});
}

// ---------- Notes ----------
function ctNotesHtml(c){
  const notes=ctNotes(c);
  return `<div class="dcard"><h3>Notes</h3>
    <div class="comm-compose" style="margin:0 0 12px"><textarea id="ct-note" rows="2" aria-label="New note" placeholder="Add a note about ${ctEsc(ctFirst(c))}…"></textarea>
      <div class="cc-btns ct-note-foot"><span class="df-mu">On</span>${ctRecSelect('ct-note-rec',c,{contactOnly:true,value:CT_UI.noteRec})}<button class="btn-primary" style="padding:5px 12px;font-size:12px;margin-left:auto" onclick="ctAddNote()">Save note</button></div></div>
    ${notes.map(n=>`<div class="note-it ${n.pinned?'pinned':''}"><span class="fi-ic" style="background:${CH_META.note.color}">${initials(n.who||'You')}</span><div class="fi-b"><div class="fi-head"><b>${ctEsc(n.who)}</b><span class="t">${ctEsc(n.t||'')}</span></div><div class="fi-tx">${n.text}</div>${n.o?`<button type="button" class="ct-rec" onclick="ctOpenRec('${n.o.id}')">${ctEsc(ctRecLabel(n.o))}</button>`:'<span class="df-mu">Contact note</span>'}</div></div>`).join('')||ctEmpty('No notes yet.')}
  </div>`;
}
window.ctAddNote=function(){
  const c=ctCur, t=document.getElementById('ct-note'), v=t&&t.value.trim(); if(!v) return;
  const rec=document.getElementById('ct-note-rec')?.value||'', o=rec&&OPPS.find(x=>x.id===rec);
  CT_UI.noteRec=rec;
  if(o) getExt(o).comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text:xesc(v)});
  else {c.notesList.unshift(xesc(v));c.noteJust=true;}
  renderContact(); showToast(`Note saved${o?' on '+o.id:''}`);
};

// ---------- Documents ----------
function ctDocsTabHtml(c){
  const recs=ctDocRecs(c), hasOpps=ctMine(c).length, kyc=hasOpps?ctKyc(c):null, L=ctLinks(c), kycOpp=L.open[0]||L.active[0]?.o;
  const st=d=>DOC_STATUS[d.status]||{label:d.status,pill:''};
  return `${kyc?`<div class="dcard"><div class="row-between"><h3 style="margin:0">KYC · ${ctEsc(c.name)}</h3>${kyc.verified?'<span class="pill p-res">Verified</span>':kycOpp?`<button type="button" class="btn-ghost df-sm" onclick="oppCur=OPPS.find(x=>x.id==='${kycOpp.id}');otKycOpen()">Request documents</button>`:''}</div>
      <div class="df-mu" style="margin-bottom:6px">${kyc.verified?'Verified once and reused for repeat purchases.':'Collected on the opportunity and shared across every purchase.'}</div>
      ${kyc.rows.map(r=>`<div class="ct-line"><span class="ct-grow">${ctEsc(r.label)}${r.file?`<span class="df-mu"> · ${ctEsc(r.file.name)}</span>`:''}</span><span class="pill ${DOC_STATUS[r.status].pill}">${DOC_STATUS[r.status].label}</span></div>`).join('')}</div>`:''}
    ${recs.map(({o,docs})=>`<div class="dcard"><div class="row-between"><h3 style="margin:0">${ctEsc(ctRecLabel(o))}</h3><button type="button" class="df-link" onclick="ctOpenRec('${o.id}')">Open ${dealFor(o.id)?'deal':'opportunity'}</button></div>
      ${['Contract','Payments','Other'].map(g=>{const ds=docs.filter(d=>(['Contract','Payments'].includes(d.g)?d.g:'Other')===g);return ds.length?`<div class="df-eyebrow">${g}</div>${ds.map(d=>`<div class="ct-line"><span class="ct-grow">${ctEsc(d.label)}<div class="df-mu">${d.file?ctEsc(d.file.name)+(d.file.size?' · '+ctEsc(d.file.size):''):'No file yet'}${d.hist?.length?' · '+ctEsc(d.hist.at(-1).act)+' — '+ctEsc(d.hist.at(-1).t):''}</div></span><span class="pill ${st(d).pill}">${ctEsc(st(d).label)}</span>${d.file?.url?`<a class="df-link" href="${ctEsc(d.file.url)}" target="_blank" rel="noopener">View</a>`:''}</div>`).join('')}`:'';}).join('')}
    </div>`).join('')}
    ${!kyc&&!recs.length?ctEmpty('No documents yet.'):''}`;
}

// ---------- Shared with client ----------
function ctSharedHtml(c){
  const items=ctShared(c), L=ctLinks(c);
  return `<div class="dcard"><div class="row-between"><h3 style="margin:0">Shared with ${ctEsc(ctFirst(c))}</h3>${L.open.length||L.active.length?`<button type="button" class="btn-ghost df-sm" onclick="ctPickRec('Send brochure','qaBrochure')">+ Send something</button>`:''}</div>
    ${items.map(({s,o})=>`<div class="ct-line"><span class="df-tag">${ctEsc(s.k)}</span><span class="ct-grow"><b>${ctEsc(s.n)}</b><div class="df-mu">${ctEsc(s.d)}${s.via?' · '+ctEsc(s.via):''}</div>${s.eng?`<div class="df-mu">${ctEsc(s.eng)}</div>`:''}${s.fail?`<div class="df-mu bad">${ctEsc(s.fail)}</div>`:''}</span><span class="ct-chips" style="margin:0">${(s.chips||[]).map(([l,t])=>`<span class="df-chip ${t==='ok'?'df-c-acc':t==='warn'?'df-c-warn':'df-c-req'}">${ctEsc(l)}</span>`).join('')}</span><button type="button" class="ct-rec" onclick="ctOpenRec('${o.id}')">${ctEsc(ctRecLabel(o))}</button></div>`).join('')||ctEmpty('Nothing shared yet.')}
  </div>`;
}

// ---------- Details ----------
function ctDetailsHtml(c){
  const kv=(a,b)=>`<div class="side-kv"><div class="k">${a}</div><div class="v">${b||'<span class="df-mu">—</span>'}</div></div>`;
  const refC=c.ref&&CONTACTS.find(k=>k.name===c.ref), refs=ctReferred(c), L=ctLinks(c);
  const agents=[...new Set(L.active.concat(L.closed).filter(r=>r.d&&r.o.closed).flatMap(r=>dfState(r.o).comm.shares.filter(s=>s.kind==='external').map(s=>s.name)))];
  const autos=[...L.open,...L.active.map(r=>r.o)].flatMap(o=>ensureAutos(o,getExt(o)).map(a=>({a,o})));
  const log=c.consentLog||[];
  return `<div class="opp-grid"><div>
    <div class="dcard"><div class="row-between"><h3 style="margin:0">Contact details</h3><button type="button" class="btn-ghost df-sm" onclick="ctEditOpen()">Edit</button></div>
      ${kv('Phone',ctEsc(c.phone))}${kv('Email',ctEsc(c.email))}${kv('Nationality',ctEsc(c.nat))}${kv('Languages',ctEsc(c.lang))}${kv('Preferred channel',ctEsc(c.preferredChannel))}${kv('Assigned rep',ctEsc(c.rep))}${kv('Created',ctEsc(c.created))}${c.company?kv('Company',ctEsc(c.company)):''}</div>
    ${ctKind(c)==='buyer'?`<div class="dcard"><h3>Preferences</h3>${kv('Budget',budgetRangeText(c.bmin,c.bmax,null))}${kv('Looking for',ctEsc(c.interest))}${kv('Location',ctEsc(c.ploc))}${kv('Finance',ctEsc(c.finance))}${kv('Timeline',ctEsc(c.timeline))}${kv('Bedrooms',ctEsc(c.bedrooms))}</div>`:''}
    <div class="dcard"><h3>Relationships</h3>
      ${kv('Buying with',ctEsc(c.buyingWith))}
      ${kv('Referred by',c.ref?(refC?`<button type="button" class="df-link" onclick="openContact('${refC.id}')">${ctEsc(c.ref)}</button>`:ctEsc(c.ref)):'')}
      ${kv('Referred',refs.map(r=>`<button type="button" class="df-link" onclick="openContact('${r.id}')">${ctEsc(r.name)}</button>`).join(', '))}
      ${ctKind(c)==='buyer'?kv('Agents on their deals',agents.map(n=>{const a=CONTACTS.find(k=>k.name===n);return a?`<button type="button" class="df-link" onclick="openContact('${a.id}')">${ctEsc(n)}</button>`:ctEsc(n);}).join(', ')):''}
    </div>
    <div class="dcard"><h3>Automations</h3>${autos.map(({a,o})=>`<div class="ct-line"><span class="ct-grow">${ctEsc(a.txt)}<div class="df-mu">${ctEsc(a.t)}</div></span><button type="button" class="ct-rec" onclick="ctOpenRec('${o.id}')">${o.id}</button></div>`).join('')||ctEmpty('Not enrolled in any automation.')}<button type="button" class="df-link" onclick="go('automations')">Manage rules</button></div>
  </div><div>
    <div class="dcard"><div class="side-h">Source</div>${kv('Source',ctEsc(c.source))}${kv('Referred by',ctEsc(c.ref))}</div>
    <div class="dcard"><div class="side-h">Consent</div>
      <div class="ct-consent">${[['wa','WhatsApp'],['em','Email'],['sms','SMS']].map(([k,l])=>`<label class="df-task"><input type="checkbox" ${c.consent[k]?'checked':''} ${c.status==='dnc'?'disabled':''} onchange="ctConsent('${k}',this.checked)"><span>${l}</span></label>`).join('')}</div>
      ${c.status==='dnc'?'<div class="df-warn">Do not contact. Messaging is off on every channel.</div>':''}
      ${log.length?`<div class="df-eyebrow">History</div>${log.map(e=>`<div class="ct-line"><span class="ct-grow">${ctEsc(e.text)}</span><span class="df-mu">${ctEsc(e.by)} · ${ctEsc(e.t)}</span></div>`).join('')}`:''}
      ${c.status!=='dnc'?`<button class="btn-ghost df-sm" style="margin-top:8px" onclick="ctDncOpen()">Mark do-not-contact</button>`:`<button class="btn-ghost df-sm" style="margin-top:8px" onclick="ctDncClear()">Allow contact again</button>`}
    </div>
    <div class="dcard"><div class="side-h">Tags</div><div class="card-tags" style="margin:0">${c.tags.map(t=>`<span class="tag-chip">${ctEsc(t)}</span>`).join('')||'<span class="df-mu">No tags</span>'}</div></div>
    <div class="dcard"><div class="side-h">Audit</div>${(c.audit||[]).map(e=>`<div class="ct-line"><span class="ct-grow">${ctEsc(e.text)}</span><span class="df-mu">${ctEsc(e.by)} · ${ctEsc(e.t)}</span></div>`).join('')}<div class="ct-line"><span class="ct-grow">Contact created from ${ctEsc(c.source)}</span><span class="df-mu">${ctEsc(c.created)}</span></div></div>
  </div></div>`;
}
function ctAudit(c,text){c.audit=c.audit||[];c.audit.unshift({text,by:typeof dfMe==='function'?dfMe():'You',t:'Just now'});}
function ctConsent(k,on){
  const c=ctCur, l={wa:'WhatsApp',em:'Email',sms:'SMS'}[k];
  c.consent[k]=on; c.consentLog=c.consentLog||[]; c.consentLog.unshift({text:`${l} consent ${on?'given':'withdrawn'}`,by:typeof dfMe==='function'?dfMe():'You',t:'Just now'});
  renderContact(); showToast(`${l} consent ${on?'recorded':'withdrawn'}`);
}

// ---------- header actions ----------
function ctLogOpen(){
  const c=ctCur; CT_UI.menu=false;
  qaDrawerOpen('Log activity',`
    <div class="od-field"><label>Type</label><div class="chk-row" id="ctLogType">${['Call','Meeting','Viewing','WhatsApp','Note'].map((l,i)=>`<button type="button" class="fm-opt ${i===0?'on':''}" onclick="qaPick(this)">${l}</button>`).join('')}</div></div>
    <div class="od-field"><label for="ctLogOut">Outcome</label><select id="ctLogOut">${['Positive','Neutral','Needs follow-up','Not reachable'].map(s=>`<option>${s}</option>`).join('')}</select></div>
    <div class="od-field"><label for="ctLogNotes">Notes</label><textarea id="ctLogNotes" rows="3" placeholder="What was discussed with ${ctEsc(ctFirst(c))}…"></textarea></div>
    <div class="od-field"><label for="ct-log-rec">Log on</label>${ctRecSelect('ct-log-rec',c,{contactOnly:true,value:ctLinks(c).active[0]?.o.id||ctLinks(c).open[0]?.id||''})}</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="ctLogSave()">Log activity</button>`);
}
function ctLogSave(){
  const c=ctCur, type=document.querySelector('#ctLogType .on')?.textContent||'Call', out=document.getElementById('ctLogOut').value, notes=document.getElementById('ctLogNotes').value.trim();
  const rec=document.getElementById('ct-log-rec').value, o=rec&&OPPS.find(x=>x.id===rec), text=xesc(`${type} with ${ctFirst(c)} — ${out}${notes?': '+notes:''}`);
  if(o) getExt(o).comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text}); else {c.comms=c.comms||[];c.comms.unshift({ch:'note',dir:'out',who:'You',t:'Just now',text});}
  if(out!=='Not reachable'){c.last='Today';c.lastD=0;}
  qaDrawerClose(); renderContact(); showToast('Activity logged'+(o?' on '+o.id:''));
}
window.ctLogNote=ctLogOpen;
function ctEditOpen(){
  const c=ctCur; CT_UI.menu=false; renderContact();
  const f=(id,l,v,t='text')=>`<div class="od-field"><label for="${id}">${l}</label><input id="${id}" type="${t}" value="${ctEsc(v||'')}"></div>`;
  qaDrawerOpen('Edit details',`${f('ceName','Name',c.name)}${f('cePhone','Phone',c.phone,'tel')}${f('ceEmail','Email',c.email,'email')}${f('ceLang','Languages',c.lang)}${f('ceNat','Nationality',c.nat)}${f('ceWith','Buying with',c.buyingWith)}
    <div class="od-field"><label for="ceCh">Preferred channel</label><select id="ceCh">${['','WhatsApp','Email','SMS','Phone'].map(v=>`<option ${v===c.preferredChannel?'selected':''}>${v}</option>`).join('')}</select></div>
    ${f('ceTags','Tags (comma separated)',c.tags.join(', '))}`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="ctEditSave()">Save</button>`);
}
function ctEditSave(){
  const c=ctCur, v=id=>document.getElementById(id).value.trim(), name=v('ceName');
  if(!name){showToast('A contact needs a name');return;}
  const next={name,phone:v('cePhone'),email:v('ceEmail'),lang:v('ceLang'),nat:v('ceNat'),buyingWith:v('ceWith'),preferredChannel:v('ceCh'),tags:v('ceTags').split(',').map(s=>s.trim()).filter(Boolean)};
  const changed=Object.keys(next).filter(k=>JSON.stringify(next[k])!==JSON.stringify(c[k]||(k==='tags'?[]:'')));
  if(name!==c.name) ctMine(c).forEach(o=>{o.lead=name;});
  Object.assign(c,next);
  if(changed.length) ctAudit(c,`Edited ${changed.join(', ')}`);
  qaDrawerClose(); renderContact(); document.getElementById('crumb').innerHTML=`<a onclick="go('contacts')">Contacts</a><span class="sep">/</span><span class="cur">${ctEsc(c.name)}</span>`;
  showToast(changed.length?'Contact updated':'No changes');
}
function ctMergeOpen(){
  const c=ctCur; CT_UI.menu=false; renderContact();
  const sur=c.name.split(' ').slice(-1)[0], first=ctFirst(c);
  const list=CONTACTS.filter(k=>k.id!==c.id).sort((a,b)=>((b.name.includes(sur)||b.name.startsWith(first)||b.phone===c.phone)?1:0)-((a.name.includes(sur)||a.name.startsWith(first)||a.phone===c.phone)?1:0)||a.name.localeCompare(b.name));
  qaDrawerOpen('Merge with another contact',`<p class="df-mu">${ctEsc(c.name)} stays. The other contact’s opportunities, deals, notes and tags move here, and it’s removed.</p>
    <div class="od-field"><label for="ctMergeId">Duplicate</label><select id="ctMergeId" onchange="ctMergePreview()"><option value="">Choose a contact</option>${list.map(k=>`<option value="${k.id}">${ctEsc(k.name)} · ${ctEsc(k.btype)} · ${ctEsc(k.phone||'')}</option>`).join('')}</select></div>
    <div id="ctMergePrev" class="df-mu"></div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="ctMergeSave()">Merge</button>`);
}
function ctMergePreview(){
  const k=ctById(document.getElementById('ctMergeId').value), el=document.getElementById('ctMergePrev'); if(!el) return;
  el.innerHTML=k?`Moves ${k.oppIds.length} opportunit${k.oppIds.length===1?'y':'ies'}${k.oppIds.some(id=>dealFor(id))?' (including deals)':''}, ${k.notesList.length} note${k.notesList.length===1?'':'s'} and ${k.tags.length} tag${k.tags.length===1?'':'s'}.`:'';
}
function ctMergeSave(){
  const c=ctCur, k=ctById(document.getElementById('ctMergeId').value); if(!k){showToast('Choose the duplicate contact');return;}
  c.oppIds=[...new Set([...c.oppIds,...k.oppIds])]; c.notesList=[...c.notesList,...k.notesList]; c.tags=[...new Set([...c.tags,...k.tags])];
  c.comms=[...(c.comms||[]),...(k.comms||[])];
  ctMine(c).forEach(o=>{o.lead=c.name;});
  CONTACTS.splice(CONTACTS.indexOf(k),1);
  ctAudit(c,`Merged ${k.name} (${k.id}) into this contact`);
  qaDrawerClose(); renderContact(); showToast(`Merged ${k.name} into ${c.name}`);
}
function ctDncOpen(){
  const c=ctCur; CT_UI.menu=false; renderContact();
  qaDrawerOpen('Mark do-not-contact',`<p class="df-mu">Turns off WhatsApp, email and SMS for ${ctEsc(c.name)}. Linked opportunities and deals stay, and notes can still be added.</p>
    <div class="od-field"><label for="ctDncWhy">Reason</label><select id="ctDncWhy"><option>Asked not to be contacted</option><option>Unsubscribed</option><option>Legal or GDPR request</option><option>Wrong person</option></select></div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="ctDncSave()">Mark do-not-contact</button>`);
}
function ctDncSave(){
  const c=ctCur, why=document.getElementById('ctDncWhy').value;
  c.prevStatus=c.status; c.status='dnc'; c.consent={wa:false,em:false,sms:false};
  c.consentLog=c.consentLog||[]; c.consentLog.unshift({text:`Do-not-contact · ${why}`,by:typeof dfMe==='function'?dfMe():'You',t:'Just now'});
  ctAudit(c,`Marked do-not-contact · ${why}`); CT_UI.ch='note';
  qaDrawerClose(); renderContact(); showToast('Marked do-not-contact · messaging is off');
}
function ctDncClear(){
  const c=ctCur; CT_UI.menu=false;
  c.status=c.prevStatus&&c.prevStatus!=='dnc'?c.prevStatus:'active';
  c.consentLog=c.consentLog||[]; c.consentLog.unshift({text:'Contact allowed again · tick each channel they agree to',by:typeof dfMe==='function'?dfMe():'You',t:'Just now'});
  ctAudit(c,'Do-not-contact removed'); CT_UI.tab='details'; renderContact(); showToast('Contact allowed again · set consent per channel');
}

// ---------- hooks: keep the contact page fresh when shared drawers save ----------
(function(){
  const onCt=()=>document.getElementById('p-contact')?.classList.contains('on');
  const wrap=name=>{const base=window[name];if(typeof base!=='function')return;window[name]=function(){const r=base.apply(this,arguments);if(onCt()&&ctCur)renderContact();return r;};};
  ['qaViewingBook','qaViewingSendLink','qaBrochureSend','tqAddSave','tqDraftSend','otKycSend','otKycMark'].forEach(wrap);
  const baseOpen=window.openContact;
  window.openContact=function(id){CT_UI.menu=false;CT_UI.moreOpen=false;CT_UI.feedRec='all';CT_UI.pastOpen=false;CT_UI.noteRec='';baseOpen.apply(this,arguments);};
})();
