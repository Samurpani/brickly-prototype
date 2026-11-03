/* ═══════════════ CUSTOM PACK v2 (CP-00 … CP-14) ═══════════════
   Default path: the agent builds, the rep approves (CP-00). Manual path: Units → Options (only when
   the catalog has real options) → Review & send. Website and PDF are one issue; revisions never edit
   in place. crState stays the builder state so Present and Compare hand-offs keep working. */

const CP_STEPS=['Units','Options','Review & send'];
const CP_DEVELOPER={dolphin:'Seashore Developments',onyx:'Seashore Developments',mercury:'Mercury Group',lalex:'La Lex Heritage Ltd',verdala:'Verdala Homes'};
const CP_CATALOG={dolphin:{layouts:['architect','open-kitchen','third-bed'],packs:['signature','urban','riviera']},mercury:{layouts:['architect','open-kitchen'],packs:['signature','riviera']},lalex:{layouts:['architect','open-kitchen'],packs:['signature']},verdala:{layouts:['architect'],packs:['signature']},onyx:{layouts:['architect'],packs:['signature','urban']}};
// Approved render library: the default layout in every finish, plus open-plan in the standard finish.
const CP_LIB=new Set();
const CP_ROOM='Living / kitchen';
let CP_DEFAULTS={trigger:'Appointment completed · session saved · buyer asks',renders:'Approved and kept only · never request new',note:'Short · warm · mentions the next step',profile:'Hide budget and financing',actions:'All on',ask:true,autopilot:false,inherits:true};
let CP_STD={v:4,when:'12 Oct',by:'Robert Falzon',priceWording:'Always visible · “from” for estimates · valid 30 days',expiry:30,msg:'Rep edits the issue message and next step only',log:[{v:4,when:'12 Oct',by:'Robert Falzon',note:'Legal footer updated'},{v:3,when:'2 Sep',by:'Robert Falzon',note:'Expiry 30 days'},{v:2,when:'14 Jul',by:'Mark Galea',note:'Compare section auto-added for 2+ units'},{v:1,when:'1 Jun',by:'Mark Galea',note:'First standards'}]};

const cpU=uid=>UN(uid);
const cpDevId=uid=>{const u=cpU(uid),d=u&&DEV(u.dev);return d?d.id:'';};
const cpDeveloper=uid=>CP_DEVELOPER[cpDevId(uid)]||((cpU(uid)||{}).dev||'Developer');
const cpKey=(uid,c)=>[cpDevId(uid),crTypologyKey(cpU(uid)),c.layout,c.pack].join('|');
(function(){Object.keys(CP_CATALOG).forEach(d=>Object.keys(CR_TYPOLOGIES).forEach(t=>{CR_PACKS.forEach(p=>CP_LIB.add([d,t,'architect',p.id].join('|')));CP_LIB.add([d,t,'open-kitchen','signature'].join('|'));}));})();
function cpCat(uid){
  const u=cpU(uid), c=CP_CATALOG[cpDevId(uid)]||{layouts:['architect'],packs:['signature']};
  return {layouts:c.layouts.filter(l=>(l!=='third-bed'||(u&&u.beds===2))&&(l!=='open-kitchen'||(u&&u.beds>0))).map(CR_LAYOUT),packs:c.packs.map(CR_PACK)};
}
const cpHasOptions=uid=>{const c=cpCat(uid);return c.layouts.length>1||c.packs.length>1;};
function cpSpec(u){return `${u.beds?u.beds+' bed':'Studio'} · ${u.baths} bath`;}
function cpStatus(u){return u.status==='available'?['Available','ok']:u.status==='hold'?['Held','warn']:u.status==='reserved'?['Reserved','err']:u.status==='sold'?['Sold','err']:[u.status,''];}
function cpRecipient(o){
  const c=swContact(o), first=swFirst(o);
  if(c&&(c.status==='dnc'||c.dnc)) return {ok:false,why:`${c.phone||''} · do not contact`};
  const wa=!c||(c.consent?c.consent.wa!==false:true), em=!c||(c.consent?c.consent.em!==false:true);
  if(wa&&(!c||c.phone)) return {ok:true,ch:'wa',label:`${o.lead} · WhatsApp`};
  if(em&&swEmail(o)) return {ok:true,ch:'em',label:`${o.lead} · Email`};
  return {ok:false,why:`${(c&&c.phone)||'no phone'} · WhatsApp not permitted · ${swEmail(o)||'no email'}`,first};
}
function cpPackAssets(o){return swAssets(o).filter(a=>a.type==='pack');}

// ---------- builder state ----------
const cpBaseFresh=window.crFreshState;
window.crFreshState=function(o){
  const s=cpBaseFresh(o), r=cpRecipient(o);
  return Object.assign(s,{source:'opp',search:'',dialog:null,reqs:[],priceAt:{},tab:'web',optSeen:false,issueOf:null,issueV:1,
    channel:r.ok?r.ch:'wa',msg:'',next:{label:(getExt(o).next&&getExt(o).next.label)||'Second appointment',owner:o.rep,date:'Sat 26 Oct'},shortlist:null,bulk:null,alts:null});
};
function cpCfgFor(uid,src){
  const c={...crMkCfg(uid),...(src||{})}, cat=cpCat(uid);
  if(!cat.layouts.some(l=>l.id===c.layout)) c.layout=cat.layouts[0].id;
  if(!cat.packs.some(p=>p.id===c.pack)) c.pack=cat.packs[0].id;
  c.tags=c.tags||{layout:c.layout===cat.layouts[0].id?'std':'buyer',pack:c.pack===cat.packs[0].id?'std':'buyer'};
  c.buyer=c.buyer||{layout:c.tags.layout==='buyer'?c.layout:null,pack:c.tags.pack==='buyer'?c.pack:null};
  return c;
}
function cpEnsure(st){
  st.cfg=st.cfg||{};
  st.unitIds.forEach(uid=>{st.cfg[uid]=st.cfg[uid]&&st.cfg[uid].tags?st.cfg[uid]:cpCfgFor(uid,st.cfg[uid]);});
  st.activeCfg=st.unitIds[0]||null; if(st.activeCfg) crSyncTop();
}
const cpOptsApply=st=>st.unitIds.some(cpHasOptions);
function cpEarliest(st){
  if(!st.unitIds.length||cpUnitBlockers(st).length) return 1;
  if(cpOptsApply(st)&&!st.optSeen) return 2;
  return 3;
}

// ---------- open / exit ----------
window.crOpen=function(oppId,seed){
  const o=OPPS.find(r=>r.id===oppId)||oppCur; oppCur=o; const x=getExt(o);
  if(seed){
    crState=Object.assign(crFreshState(o),seed);
    if(seed.presentSelectionId){
      crState.source='present'; crState.shortlist=seed.unitIds.slice();
      // Options only when the buyer asked for a change; saved choices stay per unit.
      const asked=Object.values(seed.cfg||{}).some(c=>(c.modifier||'').split('\n').some(l=>l.trim()&&!/^Preferred /.test(l)));
      crState.step=asked?2:1;
    } else if(!seed.source) crState.source='compare';
  }
  else if(x.crDraft){
    crState=Object.assign(crFreshState(o),JSON.parse(JSON.stringify(x.crDraft)));
    cpEnsure(crState); crState.step=cpEarliest(crState);
    if(cpPackAssets(o).some(a=>swIsShared(a))) crState.dialog='draftFound';
  }
  else crState=crFreshState(o);
  cpEnsure(crState);
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('p-crwiz').classList.add('on');
  document.getElementById('crumb').innerHTML=`<a onclick="crExit()">${xesc(o.lead)}</a><span class="sep">/</span><span class="cur">Custom pack</span>`;
  cpRender(); document.getElementById('content').scrollTop=0;
};
window.crResume=function(oppId){crOpen(oppId);};
// "Send unit details": same builder; the opportunity's linked units start selected, search adds any other unit.
window.cpUnitDetails=function(oppId){
  const o=OPPS.find(r=>r.id===oppId)||oppCur, x=getExt(o);
  if(x.crDraft){(x.cpParked=x.cpParked||[]).push(x.crDraft);delete x.crDraft;}
  const ids=o.units.filter(u=>cpU(u)&&['available','hold'].includes(cpU(u).status));
  crOpen(o.id,{source:'details',unitIds:ids});
};
window.crRender=function(){cpRender();};
function cpSnap(){const s=JSON.parse(JSON.stringify(crState));s.dialog=null;s.savedAt=swNow();return s;}
window.crExit=function(){
  const o=OPPS.find(r=>r.id===(crState&&crState.oppId))||oppCur;
  if(crState&&crState.unitIds.length&&!crState.sent) getExt(o).crDraft=cpSnap();
  crState=null; openOpp(o.id);
};
function cpSaveDraft(){const o=OPPS.find(r=>r.id===crState.oppId);getExt(o).crDraft=cpSnap();showToast('Draft saved · continue any time from the opportunity');cpRender();}
window.crCloseSave=function(){crExit();showToast('Saved — pick up any time from the opportunity');};
window.crCloseDiscard=function(){const o=OPPS.find(r=>r.id===(crState&&crState.oppId))||oppCur;crState=null;delete getExt(o).crDraft;openOpp(o.id);showToast('Draft discarded');};
window.crDiscardDraft=function(oppId){const o=OPPS.find(r=>r.id===oppId)||oppCur;delete getExt(o).crDraft;renderOpp();showToast('Draft discarded');};
function cpNewIssue(id,opt={}){
  const o=oppCur,a=swA(o,id); if(!a) return;
  const x=getExt(o); if(x.crDraft){(x.cpParked=x.cpParked||[]).push(x.crDraft);delete x.crDraft;}
  const seed=crFreshState(o);
  seed.source='issue'; seed.issueOf=a.id; seed.issueV=a.pub+1;
  seed.unitIds=a.units.filter(u=>u!==opt.remove&&cpU(u)&&['available','hold'].includes(cpU(u).status));
  seed.cfg={}; seed.unitIds.forEach(u=>{seed.cfg[u]=cpCfgFor(u,(a.cur.cfg||{})[u]);});
  seed.msg=a.cur.msg||''; seed.next=a.cur.next||seed.next;
  if(opt.remove){const gone=cpU(opt.remove);seed.alts=UNITS.filter(u=>u.status==='available'&&u.dev===gone.dev&&u.id!==gone.id&&Math.abs(u.beds-gone.beds)<=1&&!seed.unitIds.includes(u.id)).slice(0,3).map(u=>u.id);}
  seed.step=opt.step||1; if(opt.step===2) seed.optSeen=false;
  seed.only=opt.only||null;
  crOpen(o.id,seed);
}

// ---------- builder frame ----------
function cpUnitBlockers(st){
  return st.unitIds.map(uid=>{const u=cpU(uid);if(!u)return null;
    if(!u.price) return {uid,text:`No price on the unit record. Set it on the unit; the pack won’t use a typed value.`,link:`Open ${uid}`};
    if(['reserved','sold'].includes(u.status)) return {uid,text:`${uid} is ${u.status} now · remove it to continue.`};
    return null;}).filter(Boolean);
}
function cpDevr(st){
  const ids=st.unitIds.length?st.unitIds:(OPPS.find(r=>r.id===st.oppId).units||[]).slice(0,1);
  return [...new Set(ids.map(cpDeveloper))].join(' · ')||'Developer';
}
function cpRender(){
  const st=crState; if(!st) return;
  const o=OPPS.find(r=>r.id===st.oppId), first=swFirst(o), rec=cpRecipient(o);
  const page=document.getElementById('p-crwiz');
  if(!page.dataset.cp){page.dataset.cp='1';page.innerHTML=`<div class="wrap cp-wrap"><div id="cp-root"></div></div>`;}
  const skip=st.unitIds.length&&!cpOptsApply(st);
  const rail=CP_STEPS.map((l,i)=>{const n=i+1,cls=n===st.step?'on':n<st.step?'done':'';return `<li class="${cls} ${n===2&&skip?'skip':''}" ${n===st.step?'aria-current="step"':''}><span>${n<st.step&&!(n===2&&skip)?'✓':n}</span>${l}${n===2&&skip?' · not needed':''}</li>`;}).join('');
  const body=st.step===1?cpUnitsHtml(o,st,rec):st.step===2?cpOptionsHtml(o,st):cpReviewHtml(o,st,rec);
  document.getElementById('cp-root').innerHTML=`
    <div class="row-between cp-top"><button class="btn-back" onclick="crExit()"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8.5 3L4 7l4.5 4"/></svg>Back to opportunity</button>
      <div class="cp-top-r"><span class="sw-more"><button class="btn-ghost df-sm" aria-haspopup="menu" onclick="cpMenu(event,'demo')">Prototype scenarios</button>${st.menu==='demo'?cpBuilderDemo(st):''}</span>
      <span class="sw-more"><button class="cr-close-btn" aria-label="Close builder" onclick="cpMenu(event,'close')"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7"/></svg></button>${st.menu==='close'?`<div class="sw-menu" role="menu"><button role="menuitem" onclick="crCloseSave()">Save draft and leave</button><button role="menuitem" onclick="crCloseDiscard()">Discard draft</button><button role="menuitem" onclick="cpMenu(event,null)">Keep editing</button></div>`:''}</span></div></div>
    <div class="crm-page-heading cp-head"><div><div class="page-title">${st.step===3?'Review & send':st.source==='details'?'Send unit details':'Build custom pack'} · ${xesc(o.lead)}</div>
      <div class="page-sub">${st.source==='present'?'From Present session':st.source==='details'?'Unit details · units linked to the opportunity':'Opportunity'} · ${xesc(cpDevr(st))} · issue v${st.issueV} draft${st.savedAt?' · saved '+xesc(st.savedAt):''}</div></div><span class="sh-chip">Draft · issue v${st.issueV}</span></div>
    <ol class="cp-rail" aria-label="Stages">${rail}</ol>
    <div class="cp-ctx">${[['Buyer',xesc(o.lead)],['Opportunity',`${xesc(o.devs.join(', '))} · ${xesc(o.stage.toLowerCase())}`],['Developer',xesc(cpDevr(st))],['Recipient',rec.ok?xesc(rec.label):'<span class="sw-err">No eligible contact</span>']].map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>
    ${body}
    ${st.dialog?cpDialogHtml(o,st):''}`;
}
function cpMenu(e,k){if(e)e.stopPropagation();crState.menu=crState.menu===k?null:k;cpRender();}
document.addEventListener('click',e=>{if(crState&&crState.menu&&!e.target.closest('.sw-more')){crState.menu=null;if(document.getElementById('p-crwiz')?.classList.contains('on'))cpRender();}});
function cpFoot(left,btns){return `<div class="cp-foot"><div class="cp-foot-l">${left||''}</div><div class="cp-foot-r">${btns}</div></div>`;}
function cpBuilderDemo(st){
  const u=st.unitIds[st.unitIds.length-1], it=(l,fn)=>`<button role="menuitem" onclick="${fn}">${l}</button>`;
  const prod=st.reqs.find(r=>r.status==='production');
  return `<div class="sw-menu sw-demo" role="menu"><div class="sw-menu-h">Prototype scenarios</div>
    ${u?it(`Reprice ${xesc(u)} at source (+€7,000)`,`cpDemo('reprice','${u}')`)+it(`Clear the price on ${xesc(u)}`,`cpDemo('noprice','${u}')`):''}
    ${prod?it('Studio delivers the requested render',`cpDemo('deliver')`):''}
    ${it('Contact has no eligible channel',`cpDemo('norecip')`)}</div>`;
}
function cpDemo(k,uid){
  const st=crState,o=OPPS.find(r=>r.id===st.oppId); st.menu=null;
  if(k==='reprice'){const u=cpU(uid);u._was=u._was||u.price;u.price+=7000;showToast(`${uid} repriced on the unit record`);}
  if(k==='noprice'){const u=cpU(uid);u._was=u._was||u.price;u.price=0;st.step=1;showToast(`${uid} has no price on the unit record`);}
  if(k==='deliver'){cpDeliverReq(o);}
  if(k==='norecip'){const c=swContact(o);if(c){c.consent={...(c.consent||{}),wa:false,em:false};}showToast('Consent withdrawn on the contact');}
  cpRender();
}

// ---------- M2 · Units ----------
function cpUnitCard(o,st,uid,opt={}){
  const u=cpU(uid); if(!u) return '';
  const sel=st.unitIds.includes(uid), [stl,stt]=cpStatus(u), blocked=['reserved','sold'].includes(u.status)&&!sel;
  const prev=cpPackAssets(o).find(a=>a.units.includes(uid)&&swIsShared(a)), ok=prev&&swLastOk(prev);
  const hist=opt.viewed?'Viewed in the session · not shortlisted':prev?`Pack v${ok.ver} sent ${swDay(ok.when)}${prev.cp&&prev.cp.recips[0]&&prev.cp.recips[0].opens?` · opened ${prev.cp.recips[0].opens} time${prev.cp.recips[0].opens>1?'s':''}`:''}`:'No pack yet';
  const c=st.cfg[uid], cat=cpCat(uid);
  const hint=c&&st.source==='present'?`${CR_LAYOUT(c.layout).name} · ${CR_PACK(c.pack).name} · saved`:cat.layouts.length>1&&cat.packs.length>1?'Layout and finish options':cat.layouts.length>1?'Layout options':cat.packs.length>1?'Finish options':'';
  let warn='',wt='warn',link='';
  if(blocked) {warn=`${u.status==='sold'?'Sold':'Reserved on another opportunity'} · can’t go in a new pack.`;wt='err';}
  else if(!u.price){warn='No price on the unit record. Set it on the unit; the pack won’t use a typed value.';wt='err';link=`<button class="df-link" onclick="event.stopPropagation();openUnit('${uid}')">Open ${xesc(uid)}</button>`;}
  else if(u.status==='hold') warn=`Held for another buyer. It can still go in; ${xesc(swFirst(o))} sees the price, not the hold.`;
  if(opt.alt) warn=warn||`Suggested alternative · same development, similar size`;
  return `<div class="cp-unit ${sel?'sel':''} ${blocked?'blocked':''}" role="checkbox" aria-checked="${sel}" aria-disabled="${blocked}" tabindex="${blocked?-1:0}" data-uid="${xesc(uid)}" ${blocked?'':`onclick="cpToggle('${uid}')" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();cpToggle('${uid}')}"`}>
    <span class="cp-mark">${sel?'✓':''}</span>
    <div class="cp-unit-b"><div class="cp-unit-top"><b>${xesc(uid)}</b><span class="sw-mu">${xesc(u.dev)}</span><span class="sh-chip ${stt}">${stl}</span></div>
      <div class="sw-mu">${cpSpec(u)} · Floor ${u.floor} · ${u.sqm} m²</div>
      <div class="cp-price ${u.price?'':'sw-err'}">${u.price?fmtEur(u.price):'Price missing'}</div>
      <div class="sw-mu">${xesc(hist)}</div>${hint&&!blocked?`<div class="cp-hint">${xesc(hint)}</div>`:''}
      ${warn?`<div class="cp-warn ${wt}">${warn} ${link}</div>`:''}</div></div>`;
}
function cpUnitsHtml(o,st,rec){
  const first=swFirst(o), devs=new Set(st.unitIds.map(u=>cpU(u).dev).concat(o.devs));
  const groups=[], shown=new Set();
  if(st.source==='present'){
    groups.push(['Shortlisted in the session',(st.shortlist||[]).map(u=>cpUnitCard(o,st,u))]);
    const viewed=o.units.filter(u=>!(st.shortlist||[]).includes(u)&&cpU(u));
    if(viewed.length) groups.push(['Not shortlisted · viewed only',viewed.map(u=>cpUnitCard(o,st,u,{viewed:1}))]);
  } else {
    const linked=[...new Set([...o.units,...st.unitIds])].filter(cpU);
    groups.push([st.issueOf?`In issue v${st.issueV-1} and linked to this opportunity`:'Linked to this opportunity',linked.map(u=>cpUnitCard(o,st,u))]);
    if(st.alts&&st.alts.length) groups.push(['Suggested alternatives',st.alts.map(u=>cpUnitCard(o,st,u,{alt:1}))]);
    linked.concat(st.alts||[]).forEach(u=>shown.add(u));
    if(st.source!=='details') devs.forEach(d=>{if(d===st.browseDev) return;const more=UNITS.filter(u=>u.dev===d&&!shown.has(u.id)&&['available','hold'].includes(u.status)).slice(0,4);more.forEach(u=>shown.add(u.id));if(more.length)groups.push([`Also at ${d}`,more.map(u=>cpUnitCard(o,st,u.id))]);});
  }
  if(st.source==='present') (st.shortlist||[]).concat(o.units).forEach(u=>shown.add(u));
  const added=st.unitIds.filter(u=>!shown.has(u)&&cpU(u)&&cpU(u).dev!==st.browseDev);
  if(added.length){added.forEach(u=>shown.add(u));groups.splice(1,0,['Added to this pack',added.map(u=>cpUnitCard(o,st,u))]);}
  let browse=null;
  if(st.browseDev){
    const rank={available:0,hold:1}, all=UNITS.filter(u=>u.dev===st.browseDev&&!shown.has(u.id)).sort((a,b)=>(rank[a.status]??2)-(rank[b.status]??2));
    browse=[`Browsing ${st.browseDev}`,all.length?all.map(u=>cpUnitCard(o,st,u.id)):['<div class="sw-mu">Every unit here is already shown above.</div>']];
  }
  const q=(st.search||'').trim().toLowerCase();
  const hits=q?UNITS.filter(u=>[u.id,u.dev,cpDeveloper(u.id)].some(t=>String(t).toLowerCase().includes(q))).slice(0,12):[];
  const hitDevs=new Set(hits.map(u=>u.dev)).size;
  const devOpts=[...new Set(UNITS.map(u=>u.dev))].sort();
  const blockers=cpUnitBlockers(st), n=st.unitIds.length;
  const banner=st.source==='present'?`<div class="sw-banner info">From Present session · ${n} shortlisted${o.units.some(u=>!(st.shortlist||[]).includes(u))?' · others viewed only':''} · saved layout and finish carried through.</div>`:'';
  const recBanner=rec.ok?'':`<div class="sw-banner err">No contact on this opportunity can receive a pack yet. Fix consent or contact details on the opportunity and come back; your draft is saved.<div class="cp-recips"><div><b>${xesc(o.lead)}</b><span class="sw-mu">${xesc(rec.why)}</span><span class="sh-chip err">Not eligible</span></div></div></div>`;
  const count=n?`${n} home${n>1?'s':''} selected · ${n>1?'compare section included':xesc(st.unitIds[0])}${blockers.length?` · ${blockers.length} blocker${blockers.length>1?'s':''}`:''}`:'Nothing selected yet';
  const countSub=blockers.length?`${blockers.map(b=>b.uid).join(', ')} need${blockers.length>1?'':'s'} attention before you can continue.`:n>1?`${st.unitIds.join(', ')} · compare section generated automatically`:n?'Add a second home and the compare section is generated automatically.':'Pick the homes for this pack.';
  const can=n&&!blockers.length&&rec.ok;
  const btns=st.source==='present'?`${swB('Back','crExit()')}${swB('Save draft','cpSaveDraft()')}${cpOptsApply(st)?swB(`${xesc(first)} asked for a change · Options`,'cpGo(2)','',!can):''}${swB('Continue to Review & send','cpGo(3)','p',!can)}`
    :`${swB('Back','crExit()')}${swB('Save draft','cpSaveDraft()')}${swB('Continue','cpUnitsNext()','p',!can)}`;
  const grp=([h,cards])=>`<div class="cp-gh">${xesc(h)}</div><div class="cp-grid">${cards.join('')}</div>`;
  const finder=`<div class="cp-search"><input id="cp-q" type="search" placeholder="Search units across all developments…" value="${xesc(st.search||'')}" oninput="cpSearch(this.value)" aria-label="Search units">
      <select aria-label="Browse a development" onchange="cpBrowse(this.value)"><option value="">Browse a development…</option>${devOpts.map(d=>`<option value="${xesc(d)}" ${d===st.browseDev?'selected':''}>${xesc(d)}</option>`).join('')}</select></div>
    <div id="cp-hits">${q?`<div class="cp-gh">Search · “${xesc(st.search)}”${hitDevs>1?` · across ${hitDevs} developments`:''}</div><div class="cp-grid">${hits.map(u=>cpUnitCard(o,st,u.id)).join('')||'<div class="sw-mu">No units match.</div>'}</div>`:''}</div>${browse?grp(browse):''}`;
  if(st.source==='details') return `${recBanner}
    <div class="cp-sub">Units linked to ${xesc(first)}’s opportunity are selected. Untick any you don’t want to send, or add other units from any development below.</div>
    ${groups.map(grp).join('')}
    <div class="cp-gh cp-add-h">Add other units</div>
    ${finder}
    ${cpFoot(`<b>${count}</b><div class="sw-mu">${countSub}</div>`,btns)}`;
  return `${recBanner}${banner}
    <div class="cp-sub">Add homes from any development. Sold and reserved units stay visible with their status but can’t be added.</div>
    ${finder}
    ${groups.map(grp).join('')}
    ${cpFoot(`<b>${count}</b><div class="sw-mu">${countSub}</div>`,btns)}`;
}
function cpBrowse(d){crState.browseDev=d||null;cpRender();}
function cpSearch(v){crState.search=v;const o=OPPS.find(r=>r.id===crState.oppId);const el=document.getElementById('cp-hits');cpRender();const i=document.getElementById('cp-q');if(i){i.focus();i.setSelectionRange(v.length,v.length);}}
function cpToggle(uid){
  const st=crState,u=cpU(uid); if(!u) return;
  const i=st.unitIds.indexOf(uid);
  if(i>=0){st.unitIds.splice(i,1);delete st.cfg[uid];}
  else{
    if(['reserved','sold'].includes(u.status)) return;
    st.unitIds.push(uid); if(!o_has(st,uid)) st.extraUnits.push(uid);
  }
  cpEnsure(st); st.optSeen=false; cpRender();
}
function o_has(st,uid){const o=OPPS.find(r=>r.id===st.oppId);return o.units.includes(uid);}
function cpUnitsNext(){cpGo(cpOptsApply(crState)?2:3);}
function cpGo(n){
  const st=crState;
  if((n>=2&&(!st.unitIds.length||cpUnitBlockers(st).length))){st.step=1;cpRender();return;}
  if(n===3){if(st.step===2)st.optSeen=true;st.unitIds.forEach(u=>{if(st.priceAt[u]==null)st.priceAt[u]=cpU(u).price;});if(!st.msg)st.msg=cpDefaultMsg(OPPS.find(r=>r.id===st.oppId),st);}
  st.step=n; st.bulk=n===2?st.bulk:null; cpRender(); document.getElementById('content').scrollTop=0;
}
function cpDefaultMsg(o,st){
  const first=swFirst(o), u=st.unitIds;
  return u.length>1?`${first}, after our visit I’ve put ${u.slice(0,-1).join(', ')} and ${u[u.length-1]} side by side so you can compare the terraces and the payment plans.`:`${first}, here is ${u[0]} with everything we talked about, including the payment plan.`;
}

// ---------- M3 · Options ----------
const CP_TAG={std:['Standard',''],buyer:['Buyer requested','ok'],rep:['Rep selected','info'],appr:['Approval required','warn']};
function cpTagFor(c,kind,val){
  if(c[kind]!==val) return null;
  if(kind==='layout'&&CR_LAYOUT(val).approval) return CP_TAG.appr;
  return CP_TAG[c.tags[kind]]||CP_TAG.std;
}
function cpOptionsHtml(o,st){
  const first=swFirst(o);
  const units=st.only?st.unitIds.filter(u=>u===st.only):st.unitIds;
  const appr=st.unitIds.filter(u=>CR_LAYOUT(st.cfg[u].layout).approval);
  const card=uid=>{
    const u=cpU(uid),c=st.cfg[uid],cat=cpCat(uid), delta=crPrice(uid)-u.price, lay=CR_LAYOUT(c.layout),pk=CR_PACK(c.pack);
    const note=(c.modifier||'').split('\n').filter(l=>l.trim());
    const opt=(kind,o2,sel,tag)=>`<button type="button" class="cp-opt ${sel?'on':''}" aria-pressed="${sel}" onclick="cpPick('${uid}','${kind}','${o2.id}')"><b>${xesc(o2.name)}</b><span>${xesc(o2.desc||(o2.swatches?o2.swatches.slice(0,2).map(s=>s.m).join(' · '):''))}</span><em>${o2.delta?'+ '+fmtEur(o2.delta*1000):'Included'}</em>${tag?`<span class="sh-chip ${tag[1]}">${tag[0]}</span>`:''}</button>`;
    const cat2=(name,kind,list)=>list.length>1?`<div class="cp-cat"><div class="cp-cat-h">${name}</div><div class="cp-opts">${list.map(x=>opt(kind,x,c[kind]===x.id,cpTagFor(c,kind,x.id))).join('')}</div></div>`:`<div class="cp-cat"><div class="cp-cat-h">${name}</div><div class="sw-mu">${xesc(list[0].name)} · the only ${name.toLowerCase()} for this type</div></div>`;
    return `<div class="cp-ou"><div class="row-between"><div><b>${xesc(uid)}</b><div class="sw-mu">${cpSpec(u)} · floor ${u.floor}${c.tags.layout==='buyer'||c.tags.pack==='buyer'?` · ${xesc(first)} chose this in the session`:''}</div></div><div class="cp-total">${st.priceMode==='request'?'Price on request':fmtEur(crPrice(uid))}${delta?`<div class="sw-mu">includes + ${fmtEur(delta)} ${lay.delta&&pk.delta?'options':lay.delta?'layout':'finish'}</div>`:''}</div></div>
      ${note.length?`<div class="cp-note"><b>Request note</b>${note.map(l=>`<div>${xesc(l)}</div>`).join('')}<div class="sw-mu">Saved with the unit. Notes don’t change the specification or price.</div></div>`:''}
      ${cat2('Layout','layout',cat.layouts)}${cat2('Finish','pack',cat.packs)}</div>`;
  };
  const b=st.bulk;
  const left=b?`${xesc(CR_PACK(b.pack).name)} is also available on ${b.units.join(', ')} at the same price. <button class="df-link" onclick="cpBulkAsk()">Apply to ${b.units.length>1?'them':b.units[0]} too?</button>`:`Prices and options come from the ${xesc([...new Set(st.unitIds.map(u=>cpU(u).dev))].join(' and '))} catalog. Each choice stays with its unit.`;
  return `${appr.length?`<div class="sw-banner warn">${appr.map(u=>`${CR_LAYOUT(st.cfg[u].layout).name} at ${u}`).join(', ')} needs the developer’s structural sign-off · usually 3 working days. The pack shows it as “requested, pending approval” and never as accepted.</div>`:''}
    ${st.only?`<div class="sw-banner info">${xesc(first)} asked for an updated pack · reopening Options for ${xesc(st.only)} only, as issue v${st.issueV}. <button class="df-link" onclick="crState.only=null;cpRender()">Show all units</button></div>`:''}
    <div class="cp-sub">Only options the catalog offers for each home. Nothing here asks about style.</div>
    ${units.map(card).join('')}
    ${cpFoot(left+(appr.length?'<div class="sw-mu">You can continue. Send is allowed; the pack states the approval status.</div>':''),`${swB('Back','cpGo(1)')}${swB('Save draft','cpSaveDraft()')}${swB('Continue to Review & send','cpGo(3)','p')}`)}`;
}
function cpPick(uid,kind,val){
  const st=crState,c=st.cfg[uid],cat=cpCat(uid); if(c[kind]===val) return;
  c[kind]=val; c.tags[kind]=val===(c.buyer||{})[kind]?'buyer':val===(kind==='layout'?cat.layouts[0].id:cat.packs[0].id)?'std':'rep';
  crSyncTop(); st.bulk=null;
  if(kind==='pack'&&c.tags.pack==='rep'){const others=st.unitIds.filter(u=>u!==uid&&cpCat(u).packs.some(p=>p.id===val)&&st.cfg[u].pack!==val);if(others.length)st.bulk={pack:val,from:uid,units:others};}
  cpRender();
}
function cpBulkAsk(){crState.dialog={k:'bulk'};cpRender();}
function cpBulkApply(){const st=crState,b=st.bulk;b.units.forEach(u=>{st.cfg[u].pack=b.pack;st.cfg[u].tags.pack='rep';});st.bulk=null;st.dialog=null;crSyncTop();cpRender();showToast(`${CR_PACK(b.pack).name} applied to ${b.units.join(', ')} · labelled Rep selected`);}

// ---------- M4 · Review & send ----------
function cpNeed(st,uid){
  const c=st.cfg[uid], key=cpKey(uid,c);
  if(CP_LIB.has(key)) return {st:'ok'};
  const r=st.reqs.find(q=>q.key===key);
  if(!r) return {st:'missing'};
  return {st:r.status,r};
}
function cpChecks(o,st,rec){
  const out=[], stale=st.unitIds.filter(u=>st.priceAt[u]!=null&&cpU(u).price!==st.priceAt[u]);
  const gone=st.unitIds.filter(u=>['reserved','sold'].includes(cpU(u).status));
  if(stale.length) out.push(['err',`Prices stale · ${stale.join(', ')} changed at source`,'Refresh from source','cpRefresh()']);
  else out.push(['ok',`Prices and availability current · refreshed ${new Date().toTimeString().slice(0,5)}`]);
  gone.forEach(u=>out.push(['err',`${u} is ${cpU(u).status} now · remove it from this issue`,'Back to units','cpGo(1)']));
  st.unitIds.forEach(u=>{const n=cpNeed(st,u),lay=CR_LAYOUT(st.cfg[u].layout).name.toLowerCase();
    if(n.st==='missing') out.push(['err',`No approved ${CP_ROOM.toLowerCase()} render for ${u} · ${lay}`,'Request custom visuals',`cpReqAsk('${u}')`]);
    if(n.st==='production') out.push(['warn',`${CP_ROOM} · ${u} · in production with Studio · rev ${n.r.rev}`]);
    if(n.st==='delivered') out.push(['warn',`${CP_ROOM} · ${u} · rev ${n.r.rev} awaits your confirmation`,'Review revision',`cpRevOpen('${u}')`]);});
  if(!out.some(c=>/render/.test(c[1])||/Studio|revision|rev /.test(c[1]))) out.push(['ok',`Approved assets matched for ${st.unitIds.length>1?'all '+st.unitIds.length+' homes':'the home'}`]);
  st.unitIds.filter(u=>CR_LAYOUT(st.cfg[u].layout).approval).forEach(u=>out.push(['warn',`${CR_LAYOUT(st.cfg[u].layout).name} at ${u} shown as pending approval`]));
  out.push(['ok',`Website and PDF match · issue v${st.issueV}`]);
  out.push(rec.ok?['ok',`${o.lead} · ${rec.ch==='wa'?'WhatsApp':'email'} permitted · no suppression`]:['err','No eligible recipient · fix consent or contact details','Open opportunity','crExit()']);
  out.push(['ok','Required sections and disclosures present'+(st.unitIds.length>1?' · compare section added':'')]);
  return out;
}
function cpBlocked(checks){return checks.some(c=>c[0]==='err'||(c[0]==='warn'&&/Studio|awaits/.test(c[1])));}
function cpWords(t){return (t||'').trim().split(/\s+/).filter(Boolean).length;}
function cpReviewHtml(o,st,rec){
  const first=swFirst(o), checks=cpChecks(o,st,rec), blocked=cpBlocked(checks), errs=checks.filter(c=>c[0]==='err').length, conf=checks.filter(c=>/awaits/.test(c[1])).length;
  const stale=st.unitIds.filter(u=>st.priceAt[u]!=null&&cpU(u).price!==st.priceAt[u]);
  const vb=errs?[`${errs} need${errs>1?'':'s'} attention`,'err']:conf?[`${conf} to confirm`,'warn']:blocked?['In production','warn']:['Ready','ok'];
  const price=u=>st.priceMode==='request'?'Price on request':stale.includes(u)?fmtEur(st.priceAt[u]-(cpU(u).price-crPrice(u)))+' · stale':fmtEur(crPrice(u));
  const prices=st.unitIds.map(u=>crPrice(u)), web=st.tab!=='pdf';
  const del=st.reqs.find(r=>r.status==='delivered');
  const chL=st.channel==='em'?'email':'WhatsApp', link=`bricly.mt/p/${swHash(o.id+'pk'+st.issueV).toString(36).slice(0,5)}`;
  const words=cpWords(st.msg);
  const slot=u=>{const n=cpNeed(st,u),lay=CR_LAYOUT(st.cfg[u].layout).name;return n.st==='ok'?`${CP_ROOM} · ${u} · approved asset`:n.st==='missing'?`${CP_ROOM} · ${u} ${lay.toLowerCase()} · no approved asset`:n.st==='delivered'?`${CP_ROOM} · ${u} · rev ${n.r.rev} · awaiting confirmation`:`${CP_ROOM} · ${u} · in production`;};
  const banner=stale.length?`<div class="sw-banner warn">${stale.map(u=>`${u} was repriced on the unit record · ${fmtEur(st.priceAt[u])} → ${fmtEur(cpU(u).price)}`).join('. ')}. Price sections are stale until refreshed.</div>`
    :del?`<div class="sw-banner info">Studio delivered ${CP_ROOM} · ${del.uid} · ${xesc(CR_LAYOUT(del.layout).name.toLowerCase())} · rev ${del.rev}. Confirm this exact revision to include it.</div>`:'';
  return `${banner}<div class="cp-rv">
    <div class="cp-rv-l">
      <div class="cp-tabs" role="tablist">${[['web','Website'],['pdf','PDF']].map(([k,l])=>`<button role="tab" aria-selected="${(web?'web':'pdf')===k}" class="${(web?'web':'pdf')===k?'on':''}" onclick="crState.tab='${k}';cpRender()">${l}</button>`).join('')}<span class="sw-mu">Issue v${st.issueV} · website and PDF · not yet published</span></div>
      <div class="cp-prev ${web?'':'pdf'}">
        <div class="cp-prev-hero"><b>${xesc([...new Set(st.unitIds.map(u=>cpU(u).dev))].join(' · '))}</b><span>${st.priceMode==='request'?'Prices on request':prices.length>1?`${fmtEur(Math.min(...prices))} to ${fmtEur(Math.max(...prices))}${stale.length?' · stale':''}`:fmtEur(prices[0]||0)}</span></div>
        ${st.unitIds.map(u=>`<div class="cp-prev-u"><span>${xesc(u)} · ${cpSpec(cpU(u))} · floor ${cpU(u).floor}</span><b class="${stale.includes(u)?'sw-err':''}">${price(u)}</b></div><div class="cp-slot ${cpNeed(st,u).st}">${xesc(slot(u))}</div>`).join('')}
        ${st.unitIds.length>1?'<div class="sw-mu">Compare · added automatically for 2+ homes</div>':''}
        ${web?'':`<div class="sw-mu">PDF · the matching output of this issue · ${st.unitIds.length+5} pages</div>`}
      </div>
      <div class="od-field"><label for="cp-msg">Message · editable</label><textarea id="cp-msg" rows="4" oninput="crState.msg=this.value;document.getElementById('cp-wc').textContent=cpWords(this.value)+' of 80 words'">${xesc(st.msg)}</textarea><div class="sw-mu" id="cp-wc">${words} of 80 words</div></div>
      <div class="cp-next">${[['label','Next step'],['owner','Owner'],['date','Date']].map(([k,l])=>`<div class="od-field"><label for="cp-n-${k}">${l}</label><input id="cp-n-${k}" value="${xesc(st.next[k]||'')}" oninput="crState.next.${k}=this.value"></div>`).join('')}</div>
      <div class="sw-lock">Read-only here: prices, sections, order, brand and legal wording follow Buyer pack standards.</div>
    </div>
    <div class="cp-rv-r">
      <div class="row-between"><b>Checks</b><span class="sh-chip ${vb[1]}">${vb[0]}</span></div>
      ${checks.map(([t,txt,l,fn])=>`<div class="cp-chk ${t}"><span></span><div>${xesc(txt)}${l?` <button class="df-link" onclick="${fn}">${l}</button>`:''}</div></div>`).join('')}
      <div class="sw-h">Configuration</div>
      ${st.unitIds.map(u=>{const c=st.cfg[u],t=CR_LAYOUT(c.layout).approval?CP_TAG.appr:(c.tags.layout==='rep'||c.tags.pack==='rep')?CP_TAG.rep:(c.tags.layout==='buyer'||c.tags.pack==='buyer')?CP_TAG.buyer:CP_TAG.std;return `<div class="cp-cfg"><b>${xesc(u)}</b><span>${xesc(CR_LAYOUT(c.layout).name)} · ${xesc(CR_PACK(c.pack).name)}</span><span class="sh-chip ${t[1]}">${t[0]}</span></div>`;}).join('')}
      ${del?`<div class="cp-render"><div class="cp-render-img">${CP_ROOM} · rev ${del.rev}</div><b>${CP_ROOM} · ${xesc(del.uid)}</b><div class="sw-mu">Rev ${del.rev} · delivered · ${xesc(CR_LAYOUT(del.layout).name)} · ${xesc(CR_PACK(del.pack).name)} · image disclaimer applies · confirming records ${xesc(o.rep)}, rev ${del.rev}, time</div><div class="sw-row">${swB(`Confirm rev ${del.rev}`,`cpRevConfirm('${del.key}')`,'p')}${swB('Reject',`cpRevReject('${del.key}')`)}</div></div>`:''}
      <div class="sw-h">Send</div>
      ${[['Recipient',rec.ok?xesc(o.lead):'<span class="sw-err">Not eligible</span>'],['Channel',`${rec.ok&&rec.ch==='em'?'Email':'WhatsApp'} · preferred`],['Website',stale.length?'<span class="sw-err">Will regenerate on refresh</span>':`${link} · created on send`],['PDF',stale.length?'<span class="sw-err">Will regenerate on refresh</span>':'Attached · matches website']].map(([k,v])=>`<div class="cp-cfg"><span class="sw-mu">${k}</span><span>${v}</span></div>`).join('')}
    </div></div>
    ${cpFoot(stale.length?'Blocked until the pack is recalculated and reviewed again.':blocked?(st.reqs.some(r=>r.status==='production')?'Send is held until the requested revision is delivered and confirmed. Everything else is saved.':'Send is held until the checks above pass.'):web?`Send publishes the issue, creates ${xesc(first)}’s tracked link and records one send attempt.`:'Downloading the PDF is logged as a download, not a send.',
      `${swB('Back',`cpGo(${cpOptsApply(st)?2:1})`)}${web?swB('Save draft','cpSaveDraft()'):swB('Download PDF',"showToast('PDF downloaded · logged as a download, not a send')")}${stale.length?swB('Refresh and review','cpRefresh()'):''}${swB(`Send to ${xesc(first)} via ${chL}`,'cpSend()','p',blocked||words>80)}`)}`;
}
function cpRefresh(){const st=crState;st.unitIds.forEach(u=>st.priceAt[u]=cpU(u).price);cpRender();showToast('Recalculated both outputs from source · review again before sending');}
function cpReqAsk(uid){crState.dialog={k:'render',uid};cpRender();}
function cpReqSend(){
  const st=crState,uid=st.dialog.uid,c=st.cfg[uid],o=OPPS.find(r=>r.id===st.oppId);
  st.reqs.push({uid,key:cpKey(uid,c),layout:c.layout,pack:c.pack,status:'production',rev:'A',at:swNow()});
  st.dialog=null; getExt(o).crDraft=cpSnap();
  getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`Custom visuals requested · ${CP_ROOM} · ${uid} · ${CR_LAYOUT(c.layout).name}`});
  crState=null; openOpp(o.id); showToast('Requested from Studio · draft saved. We’ll notify you when the revision is ready to confirm.');
}
function cpDeliverReq(o){
  const x=getExt(o), d=crState&&crState.oppId===o.id?crState:x.crDraft; if(!d) return;
  const r=(d.reqs||[]).find(q=>q.status==='production'); if(!r) return;
  r.status='delivered'; r.rev=r.rev==='A'?'B':String.fromCharCode(r.rev.charCodeAt(0)+1);
  if(d!==crState) x.crDraft=d;
  if(typeof tqInit==='function'){tqInit();BN.unshift({id:'cp'+Date.now(),who:tqMe(),cat:'Custom pack',title:`Rev ${r.rev} ready to confirm · ${r.uid}`,body:`${CP_ROOM} for ${o.lead}’s pack`,rec:o.id,t:'Just now',day:'Today',read:false,action:'Review revision',kind:'pack'});tqBadge();}
  showToast(`Studio delivered ${CP_ROOM} · ${r.uid} · rev ${r.rev}`);
}
function cpRevOpen(uid){crState.tab='web';cpRender();document.querySelector('.cp-render')?.scrollIntoView({block:'center'});}
function cpRevConfirm(key){const st=crState,r=st.reqs.find(q=>q.key===key);r.status='confirmed';r.confirmedBy=OPPS.find(o=>o.id===st.oppId).rep;CP_LIB.add(key);cpRender();showToast(`Rev ${r.rev} confirmed · recorded with your name and time`);}
function cpRevReject(key){const st=crState,r=st.reqs.find(q=>q.key===key);r.status='production';cpRender();showToast(`Rev ${r.rev} sent back to Studio · nothing else changed`);}

// ---------- dialogs ----------
function cpDialogHtml(o,st){
  const d=st.dialog, first=swFirst(o); let t='',b='',f='';
  if(d==='draftFound'||d.k==='draftFound'){
    const stage=CP_STEPS[cpEarliest(st)-1];
    t=`You already have a draft for ${xesc(first)}`;
    b=`<p>Saved ${xesc(st.savedAt||'earlier')} at ${stage} · ${xesc(st.unitIds.join(', '))}. Continuing reopens the earliest unresolved decision.</p>
      <button class="sw-opt on" onclick="cpDlgClose()"><b>Continue draft</b><span>Reopens at ${stage}</span></button>
      <button class="sw-opt" onclick="cpDraftNewIssue()"><b>Start a new issue</b><span>Keeps the draft. The new issue starts at Units.</span></button>`;
    f=swB('Cancel','crExit()');
  }
  else if(d.k==='bulk'){
    const b0=st.bulk, p=CR_PACK(b0.pack);
    t=`Apply ${xesc(p.name)} to ${xesc(b0.units.join(', '))}?`;
    b=`<p>Only units that support the identical choice are affected. This preview is what changes.</p>
      ${b0.units.map(u=>`<div class="cp-cfg"><b>✓ ${xesc(u)} · Finish → ${xesc(p.name)}</b><span class="sw-mu">${p.delta?'+ '+fmtEur(p.delta*1000)+' · ':''}${fmtEur(cpU(u).price+((CR_LAYOUT(st.cfg[u].layout).delta+p.delta)*1000))} · labelled Rep selected</span></div>`).join('')}
      <div class="cp-cfg"><span>${xesc(b0.from)} · unchanged</span><span class="sw-mu">Already ${xesc(p.name)}</span></div><div class="sw-mu">Layout isn’t touched.</div>`;
    f=swB('Cancel','cpDlgClose()')+swB(`Apply to ${xesc(b0.units.length>1?b0.units.length+' units':b0.units[0])}`,'cpBulkApply()','p');
  }
  else if(d.k==='render'){
    const c=st.cfg[d.uid];
    t=`Request custom visuals · ${xesc(d.uid)}`;
    b=`<p>${CP_ROOM} · ${xesc(CR_LAYOUT(c.layout).name.toLowerCase())} · ${xesc(CR_PACK(c.pack).name)}. Studio produces it, usually within 2 working days. Your draft is saved; we’ll notify you when the exact revision is ready to confirm. Requesting doesn’t approve anything.</p>
      <div class="cp-cfg"><b>✓ ${CP_ROOM} · ${xesc(d.uid)} · ${xesc(CR_LAYOUT(c.layout).name.toLowerCase())} · ${xesc(CR_PACK(c.pack).name)}</b><span class="sw-mu">Required by the SOP minimum</span></div>
      <div class="sw-mu">Free-text modifiers and reference images belong to the Studio request, not this builder.</div>`;
    f=swB('Cancel','cpDlgClose()')+swB('Request and save draft','cpReqSend()','p');
  }
  return `<div class="cp-dlg-scrim" onclick="if(event.target===this)cpDlgClose()"><div class="cp-dlg" role="dialog" aria-modal="true" aria-label="${t.replace(/"/g,'')}"><h3>${t}</h3>${b}<div class="cp-dlg-f">${f}</div></div></div>`;
}
function cpDlgClose(){crState.dialog=null;cpRender();}
function cpDraftNewIssue(){const o=OPPS.find(r=>r.id===crState.oppId),a=cpPackAssets(o).filter(swIsShared).pop();crState=null;oppCur=o;cpNewIssue(a.id);}

// ---------- send ----------
function cpSend(){
  const st=crState,o=OPPS.find(r=>r.id===st.oppId),x=getExt(o),rec=cpRecipient(o);
  if(cpBlocked(cpChecks(o,st,rec))) return;
  const a=cpCommit(o,st);
  st.unitIds.forEach(u=>{if(!o.units.includes(u))o.units.push(u);const d=cpU(u).dev;if(d&&!o.devs.includes(d))o.devs.push(d);});
  const ch=rec.ch==='em'?'Email':'WhatsApp';
  const status=SW_SIM.next||'Delivered'; SW_SIM.next=null;
  a.attempts.push({when:swNow(),ch,ver:a.pub,fmt:'both',status,why:status==='Failed'?(ch==='Email'?'mailbox full':'number not on WhatsApp'):'',msg:st.msg});
  a.cp.recips=[{name:o.lead,ch,link:swLink(o,a),st:status==='Delivered'?'Delivered':status,opens:0,last:''}];
  a.cp.events.unshift({when:swNow(),text:status==='Delivered'?`Delivered to ${swFirst(o)} on ${ch}`:status==='Failed'?`Couldn’t deliver on ${ch}`:`Sent on ${ch} · waiting for confirmation`});
  x.comms.unshift(status==='Failed'?{ch:'sys',t:'Just now',text:`Custom pack v${a.pub} published · ${ch} send failed`}:{ch:ch==='Email'?'em':'wa',dir:'out',who:'You',t:'Just now',sub:xesc(`📎 Custom pack v${a.pub} · ${a.units.join(', ')} · website and PDF`),text:xesc(st.msg)});
  x.packSent=true; delete x.crDraft; crState=null; oppShareF='all';
  openOpp(o.id); if(typeof pipeRenderAll==='function') pipeRenderAll();
  SW={oid:o.id,id:a.id,sheet:'cpResult',attempt:a.attempts.length-1}; swRender();
  showToast(status==='Delivered'?`Pack v${a.pub} sent to ${swFirst(o)} on ${ch}`:status==='Failed'?`Couldn’t send ${swFirst(o)}’s pack on ${ch}`:`Sending ${swFirst(o)}’s pack · waiting for confirmation`);
  if(status==='Delivered'&&typeof crStagePrompt==='function') crStagePrompt(o);
}
// Publishes the builder state as a pack issue (new pack, or the next version of an existing one).
function cpCommit(o,st){
  const x=getExt(o), all=swAssets(o,x), cfg={};
  st.unitIds.forEach(u=>{const c=st.cfg[u];cfg[u]={layout:c.layout,pack:c.pack,preset:c.preset,style:c.style,modifier:c.modifier,tags:{...c.tags},price:crPrice(u),appr:!!CR_LAYOUT(c.layout).approval};});
  let a=st.issueOf&&all.find(r=>r.id===st.issueOf);
  const note=a?cpDiffNote(a,st):'first issue · '+st.unitIds.join(' and ');
  if(!a){a={id:'pk'+(all.filter(r=>r.type==='pack').length+1)+swHash(st.unitIds.join()).toString(36).slice(0,3),type:'pack',title:'',icon:'PACK',units:[],pub:0,draft:null,cur:{},versions:[],attempts:[],access:{state:'active',exp:cpExpiry()},eng:'',cp:cpBlank()};all.unshift(a);}
  a.pub++; a.units=st.unitIds.slice(); a.title=`Custom pack · ${a.units.join(', ')}`;
  a.cur={msg:st.msg,next:{...st.next},cfg,priceMode:st.priceMode};
  a.versions.push({v:a.pub,when:swNow(),by:o.rep,note});
  a.cp.events.unshift({when:swNow(),text:`Issue v${a.pub} published by ${o.rep}${a.pub>1?' · '+note:''}`});
  a.cp.unitChange=null; a.cp.expired=false; a.cp.notOpened=false;
  st.unitIds.forEach(u=>{if(!o.units.includes(u)){o.units.push(u);if(!o.devs.includes(cpU(u).dev))o.devs.push(cpU(u).dev);}});
  x.unitConfigs=x.unitConfigs||{}; st.unitIds.forEach(u=>{x.unitConfigs[u]={fin:CR_PACK(cfg[u].pack).name,lay:CR_LAYOUT(cfg[u].layout).name,adds:[],price:cfg[u].price};});
  return a;
}
function cpDiffNote(a,st){
  const was=a.units, add=st.unitIds.filter(u=>!was.includes(u)), rm=was.filter(u=>!st.unitIds.includes(u));
  const ch=st.unitIds.filter(u=>was.includes(u)&&a.cur.cfg&&a.cur.cfg[u]&&(a.cur.cfg[u].layout!==st.cfg[u].layout||a.cur.cfg[u].pack!==st.cfg[u].pack));
  return [add.length?'added '+add.join(', '):'',rm.length?'removed '+rm.join(', '):'',ch.length?'options changed on '+ch.join(', '):''].filter(Boolean).join(' · ')||'message updated';
}
function cpBlank(){return {recips:[],events:[],expired:false,expiredTried:false,extended:null,unitChange:null,notOpened:false,copied:false,most:'',fav:'',pdf:0,requests:[]};}
function cpExpiry(){const d=new Date(Date.now()+CP_STD.expiry*864e5);return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});}

// ---------- CP-10 · the pack on "Shared with client" ----------
function cpSeedIssue(o){
  const ix=STAGES.indexOf(o.stage);
  if(EXIT_STAGES.includes(o.stage)||ix<STAGES.indexOf('Appointment Booked')||!o.units.length||!cpU(o.units[0])) return null;
  const u=o.units.slice(0,2), first=swFirst(o), cfg={};
  u.forEach(id=>{const c=cpCfgFor(id);cfg[id]={layout:c.layout,pack:c.pack,tags:c.tags,price:cpU(id).price};});
  return {id:'pk1',type:'pack',title:`Custom pack · ${u.join(', ')}`,icon:'PACK',units:u,pub:1,draft:null,
    cur:{msg:`${first}, here is ${u.join(' and ')} with the layout we talked about after your viewing.`,next:{label:'Second appointment',owner:o.rep,date:'Sat 26 Sep'},cfg},
    versions:[{v:1,when:'Fri 25 Sep',by:o.rep,note:'first issue · '+u.join(' and ')}],
    attempts:[{when:'Fri 25 Sep, 12:40',ch:'WhatsApp',ver:1,fmt:'both',status:'Delivered',msg:`Hi ${first}, here is your personalised pack for ${u.join(' and ')}. It includes the brochure PDF and your buyer page.`}],
    access:{state:'active',exp:'Sun 25 Oct'},eng:'',
    cp:{...cpBlank(),recips:[{name:o.lead,ch:'WhatsApp',link:'',st:'Opened',opens:3,last:'yesterday 21:40'}],most:u[0],fav:u[0],pdf:1,
      events:[{when:'Sat 26 Sep 21:40',text:`${first} returned · 6 min on ${u[0]} price`},{when:'Sat 26 Sep 21:38',text:`${first} favourited ${u[0]}`},{when:'Fri 25 Sep 18:02',text:`${first} downloaded the PDF`},{when:'Fri 25 Sep 17:05',text:`${first} opened his pack for the first time · iPhone`},{when:'Fri 25 Sep 12:41',text:`Delivered to ${first} on WhatsApp`},{when:'Fri 25 Sep 12:40',text:`Issue v1 published by ${o.rep}`}]}};
}
function cpIsListed(a){return a.attempts.length>0||a.cp.copied;}
function cpEngLine(o,a){
  const r=a.cp.recips[0]; if(!r) return '';
  return r.opens?`Opened ${r.opens} time${r.opens>1?'s':''} · last ${r.last}`:'Delivered · not opened yet';
}
function cpOpensTxt(n){return n===1?'Opened once':`Opened ${n} times`;}
function cpCardHtml(o,a){
  const c=a.cp, ok=swLastOk(a), last=swLastTry(a), first=swFirst(o), menu=SW.menu===a.id, live=a.access&&a.access.state==='active';
  const names=c.recips.map(r=>r.name);
  const who=names.length>1?`${names.map(n=>n.split(' ')[0]).join(' and ')} ${o.lead.split(' ').slice(1).join(' ')}`:o.lead;
  let badge=['',''], lines=[], alert=null, acts=['view','details','issue','resend','copy'], sub=`${who} · website and PDF · ${ok?`sent ${ok.when} on ${ok.ch}`:''}`;
  const opens=c.recips.reduce((n,r)=>n+(r.opens||0),0);
  if(!ok&&last&&last.status==='Failed'){badge=['Couldn’t send','err'];sub=`${who} · issue v${a.pub} published · ${last.when}`;alert=['err',`Couldn’t deliver · ${last.why}. The link ${swLink(o,a)} is live.`];acts=['retry','email','copy','details'];}
  else if(!ok&&last&&last.status==='Unknown'){badge=['Sent, awaiting confirmation','warn'];sub=`${who} · issue v${a.pub} published · ${last.when}`;alert=['warn','Checking with the provider before any retry. A follow-up task appears if nothing confirms within an hour.'];acts=['check','details'];}
  else if(!ok&&c.copied){badge=['Link copied, not sent','warn'];sub=`${who} · website and PDF · published ${a.versions[a.versions.length-1].when}`;lines=[`Opens on this link still attach to ${first} · available until ${a.access.exp}`];acts=['send','view','details','copy'];}
  else if(c.expired){badge=[`Expired ${a.access.exp}`,''];sub=`${who} · website and PDF · sent ${ok.when} · expired ${a.access.exp}`;acts=['extend','issue','details'];}
  else if(c.unitChange){const u=c.unitChange;badge=[`1 unit ${u.kind}`,'err'];lines=[`${u.uid} ${u.kind} ${u.when} · shown as ${u.kind==='sold'?'sold':'no longer available'} in the pack`];
    alert=u.notice==='sent'?['ok',`Notice sent to ${first} on WhatsApp · ${u.at}.`,'View notice',`cpDetails('${a.id}','Timeline')`]:u.notice==='queued'?['warn','Notice queued for 08:00 · quiet hours 21:00 to 08:00.','Send now',`cpNotice('${a.id}','sent')`]:['err','Notice failed · number not on WhatsApp.','Send by email',`cpNotice('${a.id}','email')`];
    acts=['alts','view','details','issue','resend','copy'];}
  else if(c.notOpened){badge=['Sent, not opened','warn'];alert=['warn','Not opened in 48 hours.',`Follow-up task · ${c.notOpened}`,`go('tasks')`];}
  else {badge=[opens?cpOpensTxt(opens):'Delivered',opens?'ok':'ok'];}
  if(!c.unitChange&&!c.copied&&ok&&!c.expired){
    if(c.most) lines.push(`Most viewed ${c.most}${c.most===a.units[0]?' · 6 min on its price':''}${c.fav?` · favourited ${c.fav}`:''}`);
    lines.push(`${c.pdf?`PDF downloaded ${c.pdf===1?'once':c.pdf+' times'} · `:''}available until ${a.access.exp}`);
    if(c.extended) lines.unshift(`Extended to ${a.access.exp} by ${c.extended.by} · ${c.extended.when} · logged`);
  }
  if(c.expired&&c.recips[0]) c.recips[0].note=`${c.recips[0].last?'Last opened '+c.recips[0].last:'Never opened'}${c.expiredTried?' · tried the expired link once':''}`;
  (c.requests||[]).filter(r=>!r.done).forEach(r=>lines.push(`${first} asked to ${r.what} · task created`));
  const A={view:['View pack',`swOpen('view','${a.id}')`],details:['Details',`cpDetails('${a.id}')`],issue:['New issue',`cpNewIssue('${a.id}')`],resend:['Resend',`swOpen('resend','${a.id}')`],copy:['Copy link',`swOpen('share','${a.id}');swCopy()`],
    retry:['Retry',`cpRetry('${a.id}')`],email:['Send by email',`swOpen('share','${a.id}',{channel:'email'})`],check:['Check status',`cpCheck('${a.id}')`],send:['Send',`swOpen('share','${a.id}')`],extend:['Extend',`cpDetails('${a.id}','Summary','extend')`],alts:['Suggest alternatives',`cpNewIssue('${a.id}',{remove:'${c.unitChange&&c.unitChange.uid}'})`]};
  const primary=new Set(['retry','check','send','extend','alts']);
  const ctx=acts.filter(k=>primary.has(k)), menuActs=acts.filter(k=>!primary.has(k)&&k!=='view');
  if(ctx.length&&!alert) alert=['warn',lines.shift()||badge[0]||'Needs attention'];
  const dev=swDev(o,a), chips=[];
  if(badge[0]) chips.push([badge[0],badge[1]]);
  if(ok&&live&&!c.expired&&!c.unitChange) chips.push([`Link active · expires ${a.access.exp}`,'']);
  if(ok&&a.pub!==ok.ver) chips.push([`Current published v${a.pub}`,'warn']);
  if(a.draft) chips.push(['Unpublished update','warn']);
  const via=ok?`${who} · ${ok.ch} · ${ok.when} · v${ok.ver}`:'';
  return `<div class="cr-lc sh-item cp-card" data-sw="${a.id}">
    <span class="sh-thumb">PACK</span>
    <div class="sh-body">
      <div class="sh-top"><span class="sh-n">${xesc(a.title)}</span>
        <span class="sh-acts"><button class="sh-btn" onclick="swOpen('view','${a.id}')">View</button><button class="sh-btn" onclick="swOpen('edit','${a.id}')">Edit</button><button class="sh-btn primary" onclick="swOpen('share','${a.id}')">Share</button>
          <span class="sw-more"><button class="sh-btn sh-more" aria-label="More actions for ${xesc(a.title)}" aria-haspopup="menu" aria-expanded="${menu}" onclick="swMenu(event,'${a.id}')">⋯</button>${menu?`<div class="sw-menu" role="menu">${menuActs.map(k=>`<button role="menuitem" onclick="${A[k][1]}">${A[k][0]}</button>`).join('')}<button role="menuitem" onclick="swOpen('history','${a.id}')">History</button><button role="menuitem" onclick="cpDetails('${a.id}','Summary')">Manage links</button></div>`:''}</span></span></div>
      <div class="cr-lc-meta">${xesc(dev)}${a.units.length?' · '+xesc(a.units.join(', ')):''}</div>
      ${via?`<div class="sh-via">${xesc(via)}</div>`:`<div class="cr-lc-meta">${xesc(sub)}</div>`}
      ${chips.length?`<div class="sh-chips">${chips.map(([t,k])=>`<span class="sh-chip ${k}">${xesc(t)}</span>`).join('')}</div>`:''}
      ${c.recips.map(r=>`<div class="cr-lc-meta ${r.revoked?'sw-err':''}">${xesc(r.name)} · ${xesc(r.ch)} · ${xesc(r.revoked?`Link revoked by ${r.revoked.by} · ${r.revoked.when}`:r.note||(r.opens?`${cpOpensTxt(r.opens)} · last ${r.last}`:`${r.st==='Copied'?'Published · copied · not sent':'Delivered · not opened'}`))}</div>`).join('')}
      ${lines.map(l=>`<div class="cr-lc-meta">${xesc(l)}</div>`).join('')}
      ${alert?`<div class="cp-alert ${alert[0]}"><span>${xesc(alert[1])}</span>${alert[2]?`<button class="df-link" onclick="${alert[3]}">${xesc(alert[2])}</button>`:''}${ctx.map(k=>`<button class="sh-btn primary" onclick="${A[k][1]}">${A[k][0]}</button>`).join('')}</div>`:''}
    </div></div>`;
}
function cpRetry(id){const o=oppCur,a=swA(o,id),t=swLastTry(a);a.attempts.push({...t,when:swNow(),status:'Delivered',why:''});a.cp.recips.forEach(r=>{if(r.st==='Failed')r.st='Delivered';});a.cp.events.unshift({when:swNow(),text:`Retried · delivered to ${swFirst(o)} on ${t.ch} · one message`});renderOpp();showToast('Delivered · nothing was sent twice');}
function cpCheck(id){const o=oppCur,a=swA(o,id),t=swLastTry(a);t.status='Delivered';a.cp.recips.forEach(r=>{if(r.st==='Unknown')r.st='Delivered';});a.cp.events.unshift({when:swNow(),text:`Provider confirmed delivery to ${swFirst(o)}`});renderOpp();showToast('Provider confirmed delivery. Nothing was resent.');}
function cpNotice(id,how){const o=oppCur,a=swA(o,id),u=a.cp.unitChange;u.notice='sent';u.at=new Date().toTimeString().slice(0,5);a.cp.events.unshift({when:swNow(),text:`Notice sent to ${swFirst(o)} by ${how==='email'?'email':'WhatsApp'} · ${u.uid} ${u.kind}`});renderOpp();showToast(`Notice sent to ${swFirst(o)}${how==='email'?' by email':''}`);}
function cpCopied(o,a){if(!swIsShared(a)){a.cp.copied=true;if(!a.cp.recips.length)a.cp.recips=[{name:o.lead,ch:'link',st:'Copied',opens:0}];a.cp.events.unshift({when:swNow(),text:`Link copied by ${o.rep} · not sent`});}}
function cpAfterSend(o,a,status){
  a.cp.copied=false;
  const ch=swLastTry(a).ch, r=a.cp.recips.find(x=>x.name===o.lead);
  if(r){r.ch=ch;r.st=status;} else a.cp.recips.push({name:o.lead,ch,st:status,opens:0});
  a.cp.events.unshift({when:swNow(),text:`${SW.intent==='resend'?'Resent':'Sent'} to ${swFirst(o)} on ${ch} · v${SW.ver||a.pub} · ${status==='Delivered'?'delivered':status==='Failed'?'failed':'awaiting confirmation'}`});
}

// In preparation: builder drafts (7a–7c), pack update drafts, agent proposals.
function cpPrepHtml(o,x){
  const out=[], d=x.crDraft, first=swFirst(o);
  const card=(dot,title,badge,meta,acts,prog)=>`<div class="cr-lc ${dot==='draft'?'draft':''}"><div class="cr-lc-top"><span class="cr-lc-dot ${dot}"></span>${title}<span class="cr-lc-badge">${badge}</span></div>${prog!=null?`<div class="cr-prog" style="background:var(--sc-high)"><span style="animation:none;width:${prog}%"></span></div>`:''}<div class="cr-lc-meta">${meta}</div><div class="cr-lc-actions">${acts}</div></div>`;
  if(typeof cpAgentPrepHtml==='function'){const p=cpAgentPrepHtml(o,x);if(p)out.push(p);}
  if(d&&d.unitIds&&d.unitIds.length){
    const reqs=d.reqs||[], prod=reqs.filter(r=>r.status==='production'), del=reqs.filter(r=>r.status==='delivered'), units=xesc(d.unitIds.join(', '));
    const tmp=Object.assign(crFreshState(o),d), at=CP_STEPS[cpEarliestSafe(tmp)-1];
    if(prod.length) out.push(card('prod','Custom pack · in production',`${reqs.length-prod.length} of ${reqs.length} ready`,`${units} · usually 2 working days · we’ll notify you when a revision is ready to confirm`,`<button class="sh-btn" onclick="crResume('${o.id}')">Open draft</button>`,Math.round((reqs.length-prod.length)/reqs.length*100)));
    else if(del.length) out.push(card('ready','Custom pack · ready to review',`${del.length} ready`,`${units} · confirm rev ${del[0].rev}, then send`,`<button class="sh-btn primary" onclick="cpResumeAt('${o.id}',3)">Review and send</button>`));
    else out.push(card('draft','Custom pack · draft','Not sent',`Stopped at ${at} · ${units} · saved ${xesc(d.savedAt||'just now')}`,`<button class="sh-btn primary" onclick="crResume('${o.id}')">Continue</button><button class="sh-btn" onclick="crDiscardDraft('${o.id}')">Discard</button>`));
  }
  (x.cpParked||[]).forEach((p,i)=>out.push(card('draft','Custom pack · earlier draft','Not sent',`${xesc(p.unitIds.join(', '))} · saved ${xesc(p.savedAt||'')}`,`<button class="sh-btn" onclick="cpUnpark('${o.id}',${i})">Continue</button>`)));
  cpPackAssets(o).filter(a=>a.draft&&swIsShared(a)).forEach(a=>out.push(`<div class="sh-prep"><div class="sh-prep-t"><div class="sh-n">Custom pack · draft update</div><div class="cr-lc-meta">Update to the shared pack above · the live pack is unchanged</div></div><span class="sh-chip">Private draft</span><button class="sh-btn" onclick="swOpen('edit','${a.id}',{review:1})">Review update</button></div>`));
  return out;
}
function cpEarliestSafe(st){try{return cpEarliest(st);}catch(e){return 1;}}
function cpResumeAt(id,n){crOpen(id);if(crState){crState.dialog=null;cpGo(n);}}
function cpUnpark(id,i){const o=OPPS.find(r=>r.id===id),x=getExt(o),p=x.cpParked.splice(i,1)[0];if(x.crDraft)x.cpParked.push(x.crDraft);x.crDraft=p;crOpen(id);if(crState)crState.dialog=null;cpRender();}

// ---------- pack edit (compose only; configuration starts a new issue) ----------
function cpEditBase(o,a){const s=a.draft||a.cur;return {msg:s.msg||'',next:{...(s.next||{})},cfg:a.cur.cfg};}
function cpChanges(o,a,e){const out=[];if((e.msg||'')!==(a.cur.msg||''))out.push(['Changed','Message','mu']);if(JSON.stringify(e.next||{})!==JSON.stringify(a.cur.next||{}))out.push(['Changed',`Next step · ${e.next.label} · ${e.next.date}`,'mu']);out.push(['Units',`${a.units.join(', ')} unchanged · no new renders`,'mu']);return out;}
function cpPublish(o,a,e){a.cur={...a.cur,msg:e.msg,next:{...e.next}};a.cp.events.unshift({when:swNow(),text:`Issue v${a.pub+1} published by ${o.rep} · message updated · no message sent`});}

// ---------- sheets for packs ----------
function cpSheet(o,a){
  const s=SW, first=swFirst(o);
  if(s.sheet==='cpResult'){
    const t=a.attempts[s.attempt]||swLastTry(a), d=t.status, tm=(t.when.split(', ')[1])||'—', ch=t.ch;
    const steps=d==='Delivered'?[['Published · links created',tm,'ok'],['Sent',tm,'ok'],['Delivered',tm,'ok']]:d==='Failed'?[['Published · links created',tm,'ok'],[`Failed · ${t.why}`,tm,'err'],['Delivered','—','']]:[['Published · links created',tm,'ok'],['Sent','—','q'],['Delivered','—','']];
    const B=`<div class="sw-big">${d==='Delivered'?`Delivered to ${xesc(first)} on ${xesc(ch)} · issue v${a.pub}`:d==='Failed'?`Couldn’t deliver · issue v${a.pub} published`:`Outcome unknown · issue v${a.pub} published`}</div>
      <div class="sw-steps">${steps.map(([l,w,k])=>`<div class="sw-step ${k}"><span>${k==='ok'?'✓':k==='err'?'!':k==='q'?'?':''}</span><b>${xesc(l)}</b><em>${xesc(w)}</em></div>`).join('')}</div>
      ${d==='Failed'?swBanner(`The link ${swLink(o,a)} is live. Send by email, correct the number, or copy the link and the card shows Link copied, not sent.`,'err'):''}
      ${d==='Unknown'?swBanner('We’re checking with the provider. The card shows Sent, awaiting confirmation; a follow-up task appears if nothing confirms within an hour.','warn'):''}
      ${s.dupAsk?`<div class="sw-confirm"><b>Send again anyway?</b><div class="sw-mu">If the first message did go out, ${xesc(first)} gets it twice.</div><div class="sw-row">${swB('Cancel',"swSet('dupAsk',false)")}${swB('Send anyway',`cpRetry('${a.id}');swClose()`,'e')}</div></div>`:''}`;
    const F=d==='Delivered'?swB('View pack',`swOpen('view','${a.id}')`)+swB('Return to opportunity','swClose()','p')
      :d==='Failed'?swB('Send by email',`swOpen('share','${a.id}',{channel:'email'})`)+swB('Correct number',`swClose();showToast('Opens ${xesc(o.lead)}’s contact; you return with the pack intact.')`)+swB('Retry',`cpRetry('${a.id}');swClose()`,'p')
      :swB('Send again anyway…',"swSet('dupAsk',true)")+swB('Check status',`cpCheck('${a.id}');swClose()`,'p');
    return [d==='Delivered'?'Sent':d==='Failed'?'Not delivered':'Waiting for confirmation',a.title,B,F,false];
  }
  if(s.sheet==='cpDetails') return cpDetailsSheet(o,a);
  if(s.sheet==='editor'){
    const e=s.ed;
    const B=`${swBanner(`Private draft. The live pack and ${first}’s link stay on v${a.pub} until you publish.`)}
      <div class="od-field"><label for="swIntro">Message</label><textarea id="swIntro" rows="4" oninput="SW.ed.msg=this.value">${xesc(e.msg)}</textarea></div>
      <div class="cp-next">${[['label','Next step'],['owner','Owner'],['date','Date']].map(([k,l])=>`<div class="od-field"><label for="sw-n-${k}">${l}</label><input id="sw-n-${k}" value="${xesc(e.next[k]||'')}" oninput="SW.ed.next.${k}=this.value"></div>`).join('')}</div>
      <div class="sw-h">In this issue · read-only</div>${a.units.map(u=>{const c=(a.cur.cfg||{})[u]||{};return `<div class="cp-cfg"><b>${xesc(u)}</b><span>${xesc((CR_LAYOUT(c.layout)||{}).name||'')} · ${xesc((CR_PACK(c.pack)||{}).name||'')} · approved renders kept</span></div>`;}).join('')}
      <div class="sw-lock">Sections, order, prices, brand and legal wording follow Buyer pack standards. No new renders are made here.</div>
      ${s.packConfig?`<div class="sw-confirm"><b>Change units, layout or finish?</b><div>That starts issue v${a.pub+1} in the builder. Production impact first: renders for changed choices may need Studio (usually 2 working days); approved renders are kept. ${xesc(first)}’s live pack stays on v${a.pub} until you send the new issue.</div><div class="sw-row">${swB('Keep editing',"swSet('packConfig',false)")}${swB('Start new issue',`swClose();cpNewIssue('${a.id}')`,'p')}</div></div>`:`<button class="df-link" onclick="swSet('packConfig',true)">Change pack configuration</button>`}`;
    return [`Edit ${a.title.toLowerCase()}`,'Private draft',B,swB('Discard','swClose()')+swB('Save draft','swSaveDraft()')+swB('Review update',"swGo('review')",'p'),true];
  }
  if(s.sheet==='history') return cpDetailsSheet(o,a);
  return null;
}
function cpDetails(id,tab,dlg){const o=oppCur;SW={oid:o.id,id,sheet:'cpDetails',tab:tab||'Summary',dlg:dlg||null};swRender();}
function cpDetailsSheet(o,a){
  const s=SW, c=a.cp, first=swFirst(o), ok=swLastOk(a)||{when:'—',ch:'—'}, tab=s.tab||'Summary';
  const chans=[...new Set(c.recips.map(r=>r.ch))].join(' and ');
  const meta=[['Issue',`v${a.pub} · published ${a.versions[a.versions.length-1].when}`],['Sent',`${ok.when} · ${chans||ok.ch}`],['Expiry',`${a.access?a.access.exp:'—'} · extend is logged`]];
  const bars=a.units.flatMap((u,i)=>i===0?[[u,100,'6 min'],[`${u} · price`,70,'4 min']]:[[u,35,'2 min']]);
  bars.unshift(['Overview',40,'1 min']); if(a.units.length>1) bars.push(['Compare',25,'1 min']); bars.push(['Next steps',15,'30 s']);
  const links=c.recips.map((r,i)=>`<div class="cp-link"><div><b>${xesc(r.name)}</b><span class="sw-mu">${xesc(r.ch)} · ${xesc(swLink(o,a))}${i?String.fromCharCode(97+i):''}</span></div><span class="sh-chip ${r.revoked?'err':r.opens?'ok':''}">${r.revoked?'Revoked':r.opens?'Opened':xesc(r.st||'Delivered')}</span>${r.revoked?'':`<button class="df-link sw-danger" onclick="SW.dlg='revoke:${i}';swRender()">Revoke link</button>`}</div>`).join('');
  let body='';
  if(tab==='Summary') body=`${swKV(meta.map(([k,v])=>[k,xesc(v)]))}<div class="sw-h">Recipient links</div>${links||'<div class="sw-mu">No recipient links yet.</div>'}
    <div class="sw-h">Time per screen</div>${bars.map(([l,w,v])=>`<div class="st-bar"><span>${xesc(l)}</span><span class="st-bar-t"><span style="width:${w}%"></span></span><span class="r">${v}</span></div>`).join('')}
    <div class="sw-mu">Engagement is a signal for you. Do not quote it to the buyer.</div>`;
  if(tab==='Engagement') body=`${c.recips.map(r=>`<div class="cp-rc"><b>${xesc(r.name)} · ${xesc(r.ch)}</b><span>${r.opens?`${cpOpensTxt(r.opens)} · last ${xesc(r.last)}`:'Not opened yet'}</span></div>`).join('')}
    ${c.most?`<div class="cr-lc-meta">Most viewed ${xesc(c.most)} · favourited ${xesc(c.fav||'—')} · PDF downloaded ${c.pdf===1?'once':c.pdf+' times'}</div>`:''}
    ${bars.map(([l,w,v])=>`<div class="st-bar"><span>${xesc(l)}</span><span class="st-bar-t"><span style="width:${w}%"></span></span><span class="r">${v}</span></div>`).join('')}<div class="sw-mu">Engagement is a signal for you. Do not quote it to the buyer.</div>`;
  if(tab==='Timeline') body=c.events.map(e=>`<div class="sw-li"><em>${xesc(e.when)}</em><span>${xesc(e.text)}</span></div>`).join('')||'<div class="sw-mu">Nothing yet.</div>';
  if(tab==='Versions') body=[...a.versions].reverse().map(v=>`<div class="sw-li"><b>v${v.v}</b><span>${v.v===a.pub?'current · ':''}${xesc(v.note)} · ${xesc(v.by)}</span><em>${xesc(v.when)}</em></div>`).join('');
  let dlg='';
  if(s.dlg==='extend'){const ext=new Date(Date.now()+(CP_STD.expiry+30)*864e5).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});s.extTo=s.extTo||ext;
    dlg=`<div class="sw-confirm"><b>Extend expiry</b><div class="sw-mu">Currently available until ${xesc(a.access.exp)}. The extension is logged and the buyer link keeps working.</div>
      <button class="sw-opt ${s.extTo===ext?'on':''}" onclick="SW.extTo='${ext}';swRender()"><b>30 more days · until ${ext}</b><span>Workspace default</span></button>
      <label class="sw-opt ${s.extTo!==ext?'on':''}"><b>Custom date</b><input type="date" onchange="SW.extTo=new Date(this.value).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});swRender()"></label>
      <div class="sw-row">${swB('Cancel',"SW.dlg=null;swRender()")}${swB(`Extend to ${xesc(s.extTo)}`,'cpExtend()','p')}</div></div>`;}
  if(s.dlg&&s.dlg.startsWith('revoke:')){const r=c.recips[+s.dlg.split(':')[1]], other=c.recips.filter(x=>x!==r&&!x.revoked);
    dlg=`<div class="sw-confirm"><b>Revoke ${xesc(r.name.split(' ')[0])}’s link?</b><div class="sw-mu">${xesc(swLink(o,a))} stops working immediately. ${other.length?`${xesc(other.map(x=>x.name.split(' ')[0]).join(', '))}’s link and the`:'The'} published issue are unaffected. Any PDF already downloaded isn’t affected.</div><div class="sw-row">${swB('Keep link',"SW.dlg=null;swRender()")}${swB('Revoke',`cpRevokeRc(${c.recips.indexOf(r)})`,'e')}</div></div>`;}
  const B=`<div class="cp-tabs" role="tablist">${['Summary','Engagement','Timeline','Versions'].map(t=>`<button role="tab" aria-selected="${t===tab}" class="${t===tab?'on':''}" onclick="SW.tab='${t}';swRender()">${t}</button>`).join('')}</div>${dlg}${body}`;
  return [`${a.title} · details`,`${o.lead} · ${a.units.join(', ')}`,B,swB('Extend expiry',"SW.dlg='extend';swRender()")+swB('New issue',`swClose();cpNewIssue('${a.id}')`,'p'),true];
}
function cpExtend(){const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id);a.access.exp=SW.extTo;a.cp.expired=false;a.cp.extended={by:o.rep,when:swNow().split(',')[0]};a.cp.events.unshift({when:swNow(),text:`Extended to ${SW.extTo} by ${o.rep}`});SW.dlg=null;swRender();showToast(`Extended to ${a.access.exp} · logged`);}
function cpRevokeRc(i){const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id),r=a.cp.recips[i];r.revoked={by:o.rep,when:swNow().split(',')[0]};a.cp.events.unshift({when:swNow(),text:`${r.name}’s link revoked by ${o.rep}`});SW.dlg=null;swRender();showToast(`${r.name.split(' ')[0]}’s link revoked · the issue is unaffected`);}

// ---------- CP-00 · agent-built, rep-approved ----------
function cpAgentUnits(o){return o.units.filter(u=>cpU(u)&&['available','hold'].includes(cpU(u).status)).slice(0,3);}
function cpAgentProposal(o){
  const x=getExt(o), first=swFirst(o), units=cpAgentUnits(o), rec=cpRecipient(o);
  const waN=x.comms.filter(c=>c.ch==='wa').length;
  const cfg=units.map(u=>cpCfgFor(u));
  const ask=x.cpAsk&&units.includes(x.cpAsk.uid)&&!x.cpAsk.answer?x.cpAsk:null;
  const msg=x.cpAgentMsg||`${first}, great to see you at the viewing. Here ${units.length>1?`are ${units.join(' and ')} side by side`:`is ${units[0]}`} with the payment plan. Shall we book the second viewing for Saturday?`;
  return {first,units,cfg,rec,ask,msg,sources:[`Appointment · ${(o.appt&&o.appt.at)||'this week'}`,...(waN?[`WhatsApp · ${waN} message${waN===1?'':'s'}`]:[]),units.length?`Linked units · ${units.join(', ')}`:'No linked units','Your pack defaults'],
    inside:[[`${units.join(' and ')||o.devs[0]} · ${cfg.map(c=>CR_PACK(c.pack).name).filter((v,i,a)=>a.indexOf(v)===i).join(', ')}`,'from the opportunity'],[`${units.length*3} renders · approved and kept only · no new renders`,'approved assets'],[`Note · ${cpWords(msg)} words · ${x.cpChat&&x.cpChat.length?'edited in chat':'the appointment and the next step'}`,'from notes and chat'],[`${x.next&&x.next.label&&!/pack/i.test(x.next.label)?x.next.label:'Second appointment'} · ${o.rep}`,'from the opportunity'],[`Budget and financing hidden · website and PDF · until ${cpExpiry()}`,'your defaults']]};
}
function cpAgentPrepHtml(o,x){
  if(x.crDraft||x.packSent||x.cpAgentDismissed) return '';
  const j=x.jstage||'';
  if(!(j==='viewing_held'||o.stage==='Appointment Completed')||!cpAgentUnits(o).length) return '';
  const p=cpAgentProposal(o);
  return `<div class="cr-lc cp-agent"><div class="cr-lc-top"><span class="cr-lc-dot ready"></span>Pack for ${xesc(p.first)} is ready<span class="cr-lc-badge">${p.ask?'1 question':'Checks passed'}</span></div><div class="cr-lc-meta">Built by the agent after the appointment was marked completed · nothing is sent until you tap Send</div><div class="cr-lc-actions"><button class="sh-btn primary" onclick="cpAgentOpen()">${p.ask?'Answer':'Review'}</button></div></div>`;
}
let CP_AG={mode:'ready'};
function cpAgentOpen(mode){
  const o=oppCur,p=cpAgentProposal(o); CP_AG={mode:mode||(p.ask?'ask':'ready'),pick:0};
  cpAgentRender();
}
function cpAgentRender(){
  const o=oppCur, x=getExt(o), p=cpAgentProposal(o), m=CP_AG.mode, chL=p.rec.ch==='em'?'email':'WhatsApp';
  const sendBtn=`<button class="btn-primary" onclick="cpAgentSend()" ${p.rec.ok&&p.units.length?'':'disabled'}>Send to ${xesc(p.first)} on ${chL}</button>`;
  if(m==='ready'){
    qaDrawerOpen(`Pack for ${p.first} is ready`,`
      <div class="cp-ag-h"><span class="sw-mu">Built by the agent · after the appointment was marked completed</span><span class="sh-chip ok">Checks passed</span></div>
      <div class="sw-h">Built from</div><div class="cp-src">${p.sources.map(s=>`<span>${xesc(s)}</span>`).join('')}</div>
      <div class="sw-h">What’s inside</div>${p.inside.map(([t,s])=>`<div class="cp-in"><span>${xesc(t)}</span><em>${xesc(s)}</em></div>`).join('')}
      <div class="sw-h">Note to ${xesc(p.first)}</div><div class="sw-box">${xesc(p.msg)}</div>
      <div class="sw-row"><button class="df-link" onclick="cpAgentOpen('chat')">Edit in chat</button><button class="df-link" onclick="cpAgentReview()">Review everything</button><button class="df-link" onclick="cpAgentOpen('defaults')">Your pack defaults</button></div>
      <div class="sw-mu">One tracked link for ${xesc(p.first)}. Preview as ${xesc(p.first)} before sending if you want to; most reps won’t need to.</div>`,
      `<button class="btn-ghost" onclick="qaDrawerClose()">Not now</button>${sendBtn}`);
  }
  if(m==='ask'){
    const ans=[['Send now with the approved renders',`Note says the ${CR_LAYOUT(p.ask.layout).name.toLowerCase()} version follows. Fastest.`],['Request the render and send when it lands','Usually 2 working days. I’ll hold the pack and remind you.'],...(p.units.length>1?[[`Drop ${p.ask.uid}, send the rest`,'Keeps the pack to what’s fully approved.']]:[])];
    qaDrawerOpen(`Pack for ${p.first} · one thing to decide`,`
      <div class="cp-ag-h"><span class="sw-mu">Built by the agent · everything else is ready</span><span class="sh-chip warn">1 question</span></div>
      <div class="sw-box">${xesc(p.first)} asked for ${xesc(p.ask.uid)} with ${xesc(CR_LAYOUT(p.ask.layout).name.toLowerCase())}. There’s no approved ${CP_ROOM.toLowerCase()} render for that layout. How should I handle it?</div>
      ${ans.map(([l,s],i)=>`<button class="sw-opt ${CP_AG.pick===i?'on':''}" onclick="CP_AG.pick=${i};cpAgentRender()"><b>${xesc(l)}</b><span>${xesc(s)}</span></button>`).join('')}
      <button class="df-link" onclick="qaDrawerClose();crOpen('${o.id}')">Open the builder instead</button>
      <div class="sw-mu">The agent never invents a render or changes a price to get past a check.</div>`,
      `<button class="btn-ghost" onclick="qaDrawerClose()">Not now</button><button class="btn-primary" onclick="cpAgentAnswer()">Continue</button>`);
  }
  if(m==='chat'){
    const chat=x.cpChat||[];
    qaDrawerOpen(`Pack for ${p.first} · editing`,`
      <div class="cp-ag-h"><span class="sw-mu">Changes apply to this issue only · your defaults are unchanged</span><span class="sh-chip ok">${chat.length?'Updated · checks passed':'Checks passed'}</span></div>
      <div class="cp-chat" id="cp-chat">${chat.map(c=>`<div class="cp-bub ${c.me?'me':''}">${xesc(c.t)}</div>`).join('')||`<div class="sw-mu">Tell the agent what to change, for example “mention parking is included”.</div>`}</div>
      <div class="cp-chat-in"><input id="cp-chat-in" placeholder="Ask for a change…" aria-label="Message the agent" onkeydown="if(event.key==='Enter')cpAgentSay()"><button class="btn-ghost" onclick="cpAgentSay()">Send</button></div>
      <div class="sw-box"><div class="sw-mu">Note preview</div>${xesc(p.msg)}</div>
      <button class="df-link" onclick="cpAgentReview()">Open Review &amp; send</button>
      <div class="sw-mu">Facts, prices, disclaimers and screen order can’t be changed from chat or anywhere else.</div>`,
      `<button class="btn-ghost" onclick="CP_AG.mode='ready';cpAgentRender()">Back</button><button class="btn-ghost" onclick="showToast('Preview as ${xesc(p.first)} · sandboxed, not counted as a visit')">Preview as ${xesc(p.first)}</button>${sendBtn}`);
    setTimeout(()=>{const c=document.getElementById('cp-chat');if(c)c.scrollTop=c.scrollHeight;document.getElementById('cp-chat-in')?.focus();},0);
  }
  if(m==='defaults'){
    const D=CP_DEFAULTS, row=(l,s,v)=>`<div class="cp-def"><div><b>${l}</b><span class="sw-mu">${s}</span></div><span>${xesc(v)}</span></div>`;
    const sw=(k,l,s)=>`<label class="cp-def"><div><b>${l}</b><span class="sw-mu">${s}</span></div><input type="checkbox" role="switch" ${D[k]?'checked':''} onchange="CP_DEFAULTS.${k}=this.checked;CP_DEFAULTS.inherits=false;cpAgentRender()"></label>`;
    qaDrawerOpen('Your pack defaults',`
      <div class="cp-ag-h"><span class="sw-mu">${xesc(o.rep)} · applied to every pack the agent builds for you</span><span class="sh-chip">${D.inherits?'Inherits workspace':'Customised'}</span></div>
      ${row('Build a pack when','The agent starts without being asked',D.trigger)}${row('Renders','What the agent may use without asking',D.renders)}${row('Note','Length and voice',D.note)}${row('Client profile','Fields shown by default',D.profile)}${row('Buyer actions','Reserve and Book a meeting',D.actions)}
      ${sw('ask','Ask me before sending','Off means the agent sends ready packs itself for quick sends')}
      ${sw('autopilot','Autopilot for quick sends','Linked units, approved assets, no note changes · sends and tells you')}
      <button class="df-link" onclick="CP_DEFAULTS={...CP_DEFAULTS,ask:true,autopilot:false,inherits:true};cpAgentRender()">Reset to workspace</button>
      <div class="sw-mu">Expiry, social proof, alert thresholds and the notice template stay in Buyer pack standards.</div>`,
      `<button class="btn-ghost" onclick="CP_AG.mode='ready';cpAgentRender()">Back</button><button class="btn-primary" onclick="CP_AG.mode='ready';cpAgentRender();showToast('Pack defaults saved')">Save defaults</button>`);
  }
}
function cpAgentSay(){
  const o=oppCur,x=getExt(o),inp=document.getElementById('cp-chat-in'),t=(inp&&inp.value||'').trim(); if(!t) return;
  const p=cpAgentProposal(o); x.cpChat=x.cpChat||[]; x.cpChat.push({t,me:1});
  let r, msg=p.msg;
  if(/price|discount|cheaper|€|disclaimer|order/i.test(t)) r='I can’t change prices, facts, disclaimers or screen order. Those come from the unit record and Buyer pack standards. Anything else?';
  else if(/reserve/i.test(t)) r='Yes, Reserve is on. It opens your hold approval flow; it never reserves the unit by itself.';
  else if(/remove|take out|drop/i.test(t)) {r='Removed for this pack only. Your workspace default stays on.';}
  else if(/parking|terrace|mention|add|say/i.test(t)) {const add=/parking/i.test(t)?'Parking is included in the price.':t.replace(/^(please\s+)?(add|mention|say)\s+(that\s+)?/i,'').replace(/^./,c=>c.toUpperCase()).replace(/[.]?$/,'.');msg=`${p.msg} ${add}`;r=`Done. Added a line to the note: “${add}” Now ${cpWords(msg)} of 80 words. Checks passed.`;}
  else {r='Done. Updated for this issue only. Checks passed.';}
  x.cpAgentMsg=msg; x.cpChat.push({t:r}); cpAgentRender();
}
function cpAgentAnswer(){
  const o=oppCur,x=getExt(o),a=x.cpAsk;
  if(CP_AG.pick===1){
    const seed=crFreshState(o);seed.unitIds=cpAgentUnits(o);seed.cfg={};seed.unitIds.forEach(u=>{seed.cfg[u]=cpCfgFor(u,u===a.uid?{layout:a.layout}:null);});
    seed.unitIds.forEach(u=>{seed.priceAt[u]=cpU(u).price;});const c=seed.cfg[a.uid];seed.reqs=[{uid:a.uid,key:cpKey(a.uid,c),layout:c.layout,pack:c.pack,status:'production',rev:'A',at:swNow()}];
    seed.msg=cpAgentProposal(o).msg;seed.savedAt=swNow();x.crDraft=seed;a.answer='request';qaDrawerClose();renderOpp();showToast('Render requested · the pack waits for it and I’ll remind you');return;
  }
  a.answer=CP_AG.pick===2?'drop':'now';
  if(CP_AG.pick===2) x.cpAgentDrop=a.uid;
  CP_AG.mode='ready'; cpAgentRender();
}
function cpAgentReview(){
  const o=oppCur,p=cpAgentProposal(o),seed=crFreshState(o);
  seed.source='agent';seed.unitIds=p.units.filter(u=>u!==getExt(o).cpAgentDrop);seed.cfg={};seed.unitIds.forEach(u=>seed.cfg[u]=cpCfgFor(u));seed.msg=p.msg;seed.optSeen=true;
  seed.unitIds.forEach(u=>seed.priceAt[u]=cpU(u).price); seed.step=3;
  qaDrawerClose(); crOpen(o.id,seed);
}
function cpAgentSend(){
  const o=oppCur,x=getExt(o),p=cpAgentProposal(o),first=p.first;
  const st=crFreshState(o); st.unitIds=p.units.filter(u=>u!==x.cpAgentDrop); st.cfg={}; st.unitIds.forEach(u=>st.cfg[u]=cpCfgFor(u)); st.msg=p.msg;
  const a=cpCommit(o,st), ch=p.rec.ch==='em'?'Email':'WhatsApp';
  a.attempts.push({when:swNow(),ch,ver:a.pub,fmt:'both',status:'Delivered',msg:p.msg});
  a.cp.recips=[{name:o.lead,ch,st:'Delivered',opens:0}]; a.cp.events.unshift({when:swNow(),text:`Delivered to ${first} on ${ch} · built by the agent, approved by ${o.rep}`});
  x.comms.unshift({ch:ch==='Email'?'em':'wa',dir:'out',who:'You',t:'Just now',sub:xesc(`📎 Custom pack v${a.pub} · ${a.units.join(', ')} · website and PDF`),text:xesc(p.msg)});
  x.packSent=true; x.cpChat=null; x.cpAgentMsg=null; oppShareF='all';
  x.next={label:`Ask ${first} for an offer`,due:'In 3 days',overdue:false};
  if(typeof otFinish==='function') otFinish(`Pack v${a.pub} sent to ${first} on ${ch}`); else {qaDrawerClose();renderOpp();showToast(`Pack sent to ${first}`);}
}
window.otPackOpen=function(){cpAgentOpen();};

// ---------- CP-12–14 · buyer requests, unit status, alerts (prototype triggers) ----------
function cpDemoItems(o){
  const a=cpPackAssets(o).find(swIsShared), it=(l,fn)=>`<button role="menuitem" onclick="${fn}">${l}</button>`;
  const x=getExt(o);
  return `${a?`<div class="sw-menu-h">Live pack · ${xesc(a.units.join(', '))}</div>${it('Buyer asks to reserve',`cpEvt('reserve')`)}${it('Buyer asks to book a meeting',`cpEvt('meet')`)}${it('Buyer asks for an updated pack',`cpEvt('update')`)}${it('Unit reserved by another buyer',`cpEvt('reserved')`)}${it('Unit reserved in quiet hours',`cpEvt('quiet')`)}${it('Unit sold · notice fails',`cpEvt('sold')`)}${it('Not opened in 48 hours',`cpEvt('notopen')`)}${it('Pack link expires',`cpEvt('expire')`)}${it('Add a second recipient',`cpEvt('second')`)}`:''}
    ${x.crDraft&&(x.crDraft.reqs||[]).some(r=>r.status==='production')?it('Studio delivers the requested render',`cpDeliverReq(oppCur);renderOpp()`):''}
    ${o.units.length>1&&!x.cpAsk?it('Buyer asked for a layout with no approved render',`cpEvt('ask')`):''}
    ${it(`Pack after appointment · agent proposal`,`cpEvt('agent')`)}`;
}
function cpNotify(o,title,body,tier,action){if(typeof tqInit!=='function')return;tqInit();BN.unshift({id:'cp'+Date.now()+Math.random(),who:tqMe(),cat:'Custom pack',title,body:`${body} · ${tier}`,rec:o.id,t:'Just now',day:'Today',read:false,action:action||'',kind:'pack'});tqBadge();}
function cpTask(o,title,detail){if(typeof tqInit!=='function')return;tqInit();TQ.unshift({id:'cp'+Date.now()+Math.random(),title,rec:o.id,due:cvISO(cvToday()),time:null,owner:tqMe(),agent:false,source:'from_signal',status:'open',createdBy:'agent',remind:'',fresh:true,detail});tqBadge();}
function cpEvt(k){
  const o=oppCur,x=getExt(o),a=cpPackAssets(o).find(swIsShared),first=swFirst(o); SW.menu=null;
  const u=a&&a.units[0], u2=a&&(a.units[1]||a.units[0]), now=new Date().toTimeString().slice(0,5);
  if(k==='reserve'){a.cp.requests.push({what:`reserve ${u}`});a.cp.events.unshift({when:swNow(),text:`${first} asked to reserve ${u} · task created for ${o.rep}`});cpTask(o,`${first} asked to reserve ${u}`,'From his pack · opens the hold approval flow, nothing is held yet');cpNotify(o,`${first} asked to reserve ${u}`,'Opens the hold flow','tier 1, immediate','Open hold flow');showToast(`Task created · ${first} asked to reserve ${u}. Nothing is held yet.`);}
  if(k==='meet'){a.cp.requests.push({what:'book a meeting'});a.cp.events.unshift({when:swNow(),text:`${first} asked to book a meeting · task created`});cpTask(o,`${first} asked to book a meeting`,`Pack · ${a.units.join(' and ')} · prefers Saturday morning`);showToast('Task created · book a meeting');}
  if(k==='update'){a.cp.requests.push({what:`update ${u2}`});a.cp.events.unshift({when:swNow(),text:`${first} asked for an updated pack · ${u2}`});cpTask(o,`${first} asked for an updated pack`,`Reopens Options for ${u2} only, as issue v${a.pub+1}`);showToast(`Task created · start a new issue reopens Options for ${u2}`);}
  if(k==='reserved'||k==='quiet'||k==='sold'){const kind=k==='sold'?'sold':'reserved';a.cp.unitChange={uid:u2,kind,when:swNow(),notice:k==='quiet'?'queued':k==='sold'?'failed':'sent',at:now};
    a.cp.events.unshift({when:swNow(),text:`${u2} ${kind} by another buyer · live pack updated`});cpTask(o,`${u2} ${kind} · suggest alternatives to ${first}`,'Suggest alternatives opens a new issue at Units');cpNotify(o,`${u2} is ${kind} · in ${first}’s live pack`,'Pack updated within 5 minutes','tier 1, immediate','Suggest alternatives');showToast(`${u2} ${kind} · the pack shows it, an alert and a task were created`);}
  if(k==='notopen'){a.cp.recips.forEach(r=>{r.opens=0;r.st='Delivered';});a.cp.most='';a.cp.pdf=0;a.cp.notOpened=new Date(Date.now()+2*864e5).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});cpTask(o,`Follow up · ${first} hasn’t opened his pack`,'Tier 3 · in the morning digest');showToast('Follow-up task created · tier 3, morning digest');}
  if(k==='expire'){a.cp.expired=true;a.cp.expiredTried=true;a.cp.events.unshift({when:swNow(),text:`${first} opened the expired link`});cpNotify(o,`${first} opened the expired link`,'Extend or start a new issue','tier 2','Extend');showToast('Pack expired · the buyer link shows the expired screen');}
  if(k==='second'){const n=`Claire ${o.lead.split(' ').slice(1).join(' ')}`;a.cp.recips.push({name:n,ch:'Email',st:'Delivered',opens:0});a.cp.events.unshift({when:swNow(),text:`Delivered to ${n} by email`});showToast(`${n} added · each link reports on its own`);}
  if(k==='ask'){x.cpAsk={uid:o.units[1]||o.units[0],layout:'open-kitchen'};x.jstage='viewing_held';x.packSent=false;showToast('Buyer request logged · the agent will ask one question');}
  if(k==='agent'){x.jstage='viewing_held';x.packSent=false;x.cpAgentDismissed=false;delete x.crDraft;showToast('Appointment marked completed · the agent built a pack');}
  renderOpp();
}

// ---------- Buyer pack standards (settings, owner and manager, versioned) ----------
(function(){
  if(typeof ST_NAV_ACC==='undefined'||!window.BST) return;
  const i=ST_NAV_ACC.findIndex(([k])=>k==='approvals'); ST_NAV_ACC.splice(i+1,0,['packs','Buyer pack standards']);
  ST_ACCESS.packs={owner:'f',manager:'f'};
  const rows=()=>[
    ['Brand and layout','Approved logos, colours, type · responsive website and PDF page design','Lalex brand kit v3 · website + PDF templates','Preview','Read-only in the pack preview. No per-issue theme.'],
    ['Required sections and order','Mandatory content for every pack','10 sections · fixed order · compare auto-added for 2+ units','View','Reps can’t remove or reorder sections.'],
    ['Price display','Visibility and wording for estimates and validity',CP_STD.priceWording,'Edit wording','Source data is corrected on the unit record, never hidden in a pack.'],
    ['Legal and disclosures','Image disclaimer, privacy notice, contact and footer',`Set · last edited ${CP_STD.when} by ${CP_STD.by}`,'Edit','No per-pack edits. Required before any send.'],
    ['Message standards','Copy style and the editable buyer message',CP_STD.msg,'Edit template','Template copy changes need this permission.'],
    ['Buyer profile fields','Which confirmed fields a pack may include','Confirmed fields only · budget and financing never shown','Edit','The system includes only eligible fields; reps don’t choose.'],
    ['Asset eligibility','Approved source libraries and matching','Studio approved library · matching status visible to reps','Open library','New renders need exact-revision confirmation by the rep.'],
    ['Unit option catalogs','Layout, finish and price deltas per project',Object.entries(CP_CATALOG).map(([d,c])=>`${(DEV(d)||{}).name||d} · ${c.layouts.length} layout${c.layouts.length>1?'s':''}, ${c.packs.length} finish${c.packs.length>1?'es':''}`).join(' · '),'Open catalogs','Reps see only options valid for the selected unit.'],
    ['Generation and expiry','Website and PDF as one issue',`One required pair · parity check before send · expiry ${CP_STD.expiry} days`,'Edit','Expiry follows workspace policy; extensions are logged.'],
  ];
  window.BST.pages.packs={nav:'packs',t:'Buyer pack standards',tag:'v'+CP_STD.v,d:'Every custom pack follows these. Reps edit the message and next step only; everything here is versioned.',b:[
    {k:'custom',span:12,render:ro=>`<div class="cp-std">${rows().map(([l,n,v,act,side],i)=>`<div class="cp-std-r"><div><b>${l}</b><div class="st-sub">${n}</div></div><div><div>${xesc(v)}</div><div class="st-sub">${side}</div></div><button type="button" class="st-link" ${ro?'disabled':''} onclick="cpStdEdit(${i})">${act}</button></div>`).join('')}</div>`},
    {k:'custom',span:12,title:'Versions',render:()=>`<div class="cp-std-v">${CP_STD.log.map(v=>`<div class="sw-li"><b>v${v.v}</b><span>${xesc(v.note)} · ${xesc(v.by)}</span><em>${xesc(v.when)}</em></div>`).join('')}</div>`},
  ]};
})();
function cpStdEdit(i){
  const edits={2:['Price display wording','priceWording'],4:['Message standard','msg'],8:['Expiry (days)','expiry']};
  const e=edits[i]; if(!e){showToast('Opens the read-only view for this standard');return;}
  qaDrawerOpen(e[0],`<div class="od-field"><label for="cpStdV">${e[0]}</label><input id="cpStdV" value="${xesc(String(CP_STD[e[1]]))}"></div><div class="sw-mu">Saving publishes v${CP_STD.v+1} of Buyer pack standards. Live packs keep the version they were issued with.</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="cpStdSave('${e[1]}','${e[0]}')">Publish v${CP_STD.v+1}</button>`);
}
function cpStdSave(k,l){
  const v=document.getElementById('cpStdV').value.trim(); if(!v) return;
  CP_STD[k]=k==='expiry'?(+v||30):v; CP_STD.v++; CP_STD.when=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}); CP_STD.by=(PERSONAS&&PERSONAS[curPersona]&&PERSONAS[curPersona].name)||'You';
  CP_STD.log.unshift({v:CP_STD.v,when:CP_STD.when,by:CP_STD.by,note:`${l} changed`});
  window.BST.pages.packs.tag='v'+CP_STD.v; qaDrawerClose(); if(typeof stRender==='function')stRender(); showToast(`Buyer pack standards v${CP_STD.v} published`);
}

// ---------- M0 · entry points ----------
(function(){
  const base=window.renderOpp;
  window.renderOpp=function(){
    base.apply(this,arguments);
    const m=document.getElementById('cr-actions-menu'); if(!m) return;
    const b=m.querySelector(`button[onclick="crAct('crOpen')"]`);
    if(b){const o=oppCur;b.lastChild.textContent=crHasDraft(o)?'Continue custom pack (draft)':'Build custom pack';b.title='Units → Options when applicable → Review & send';}
    const q=m.querySelector(`button[onclick="crAct('qaBrochure')"]`);
    if(q){q.lastChild.textContent='Send unit details';q.title='Linked units → Options when applicable → Review & send';q.setAttribute('onclick',`crAct('cpUnitDetails','${oppCur.id}')`);}
  };
})();
