/* ═══════════════ SHARED WITH CLIENT (S01–S17) ═══════════════
   The module lists what was actually sent. Editing is private until published; publishing never
   sends; a resend is a new attempt, not a new version; sharing never changes stage, units, prices
   or holds. Custom packs (custom-pack.js) are assets of type 'pack' in the same list. */

const SW_SEEDED=new Set(OPPS.map(o=>o.id));
const SW_NOUN={brochure:'brochure',microsite:'property selection',pack:'personalised pack',floorplan:'floor plan',pricelist:'price list',spec:'spec sheet',other:'link'};
const SW_FMT={brochure:'pdf',microsite:'link',pack:'both',floorplan:'pdf',pricelist:'pdf',spec:'pdf',other:'link'};
const SW_SECTIONS={
  brochure:[['cover','Cover and welcome','p1'],['plans','Floor plans','p2–3'],['kitchen','Kitchen options','p4'],['finishes','Finishes','p5'],['payment','Payment plan','p6'],['location','Location','p7']],
  microsite:[['welcome','Welcome',''],['gallery','Gallery',''],['plans','Floor plans',''],['downloads','Downloads',''],['contact','Contact your rep','']],
  pack:[['intro','Introduction','p1'],['renders','Renders','p2–4'],['plans','Floor plan','p5'],['payment','Payment plan','p6']],
  floorplan:[['plan','Floor plan','p1']],pricelist:[['prices','Price list','p1'],['terms','Payment terms','p2']],spec:[['spec','Specification','p1–2']],
};
const SW_ROUTED=new Set(['floorplan','pricelist','spec']);
let SW={sheet:null};
let SW_SIM={next:null,outside:false,noEmail:false};

const swE=s=>xesc(String(s??''));
const swFirst=o=>o.lead.split(' ')[0];
function swNow(){const d=new Date();return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})+', '+d.toTimeString().slice(0,5);}
function swDay(w){return String(w||'').split(',')[0];}
function swHash(s){let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h;}
function swLink(o,a){return (a.type==='pack'?'bricly.mt/p/':'bricly.mt/s/')+swHash(o.id+a.id).toString(36).slice(0,5);}
function swContact(o){return typeof CONTACTS==='undefined'?null:(CONTACTS.find(c=>(c.oppIds||[]).includes(o.id))||CONTACTS.find(c=>c.name===o.lead)||null);}
function swEmail(o){const c=swContact(o);return SW_SIM.noEmail?'':(c&&c.email)||'';}
function swPhone(o){const c=swContact(o);return (c&&c.phone)||'';}
function swUnits(a){return (a.units||[]).join(', ');}
function swDev(o,a){return (a.units&&a.units[0]&&UN(a.units[0])?UN(a.units[0]).dev:o.devs[0])||'Development';}

// ---------- model ----------
function swSeed(o){
  const first=swFirst(o), dev=o.devs[0]||'Development', u0=o.units[0]||'';
  const u1=(UNITS.find(u=>u.dev===dev&&u.id!==u0&&u.status==='available')||{}).id;
  const ms=[u0,u1].filter(Boolean);
  const A=[
    {id:'br',type:'brochure',title:'Personalised brochure',icon:'PDF',units:[u0].filter(Boolean),pub:2,draft:null,
      cur:{intro:`${first}, here is ${u0||dev} with the options we talked about after your viewing.`,units:[u0].filter(Boolean),secs:{cover:1,plans:1,kitchen:1,finishes:1,payment:1,location:1},seg:'show',tmpl:'Personal',lang:'English'},
      versions:[{v:1,when:'Wed 16 Sep',by:o.rep,note:'first issue'},{v:2,when:'Mon 21 Sep',by:o.rep,note:'payment plan updated'}],
      attempts:[{when:'Tue 22 Sep, 17:40',ch:'WhatsApp',ver:2,fmt:'both',status:'Delivered',msg:`Hi ${first}, here is your personalised brochure for ${dev}, covering ${u0}. I’ve attached the brochure PDF.`}],
      access:{state:'active',exp:'Thu 22 Oct'},eng:'Opened 3× · 12 min on floor plans'},
    {id:'ms',type:'microsite',title:'Buyer microsite',icon:'WEB',units:ms,pub:2,draft:null,
      cur:{intro:`Welcome back, ${first}. I’ve added ${u1||'a second home'} you asked about next to ${u0}.`,units:ms,secs:{welcome:1,gallery:1,plans:1,downloads:1,contact:1},seg:'desktop'},
      versions:[{v:1,when:'Wed 23 Sep',by:o.rep,note:'first issue'},{v:2,when:'Sat 26 Sep',by:o.rep,note:`added ${u1||'a unit'} and new welcome text`}],
      attempts:[{when:'Wed 23 Sep, 09:15',ch:'Email',ver:1,fmt:'link',status:'Sent',msg:`Hi ${first}, here is your property selection for ${dev}: LINK.`}],
      access:{state:'active',exp:'Thu 22 Oct'},eng:'Visited yesterday · saved 2 units',util:[{what:'Link copied',by:o.rep,when:'Fri 25 Sep'}]},
    {id:'fp',type:'floorplan',title:`Floor plan · ${u0||dev}`,icon:'PDF',units:[u0].filter(Boolean),pub:1,draft:null,cur:{caption:'As drawn. Dimensions are approximate.'},
      versions:[{v:1,when:'Thu 24 Sep',by:o.rep,note:'project asset'}],
      attempts:[{when:'Thu 24 Sep, 14:02',ch:'Email',ver:1,fmt:'pdf',status:'Delivered',msg:`Hi ${first}, here is the floor plan for ${u0}. I’ve attached the PDF.`},
        {when:'Sat 26 Sep, 09:02',ch:'Email',ver:1,fmt:'pdf',status:'Failed',why:'mailbox full',msg:'Resend · same message'}],
      access:null,eng:'Tracking unavailable'},
    {id:'pl',type:'pricelist',title:`Price list · ${dev}`,icon:'PDF',units:[],pub:1,draft:null,cur:{caption:'Valid 14 days from issue.'},
      versions:[{v:1,when:'Sat 26 Sep',by:o.rep,note:'issued · valid 14 days'}],attempts:[],access:null,eng:''},
    {id:'ss',type:'spec',title:`Spec sheet · ${u0?CR_TYPOLOGIES[crTypologyKey(UN(u0))].name:'standard'}`,icon:'PDF',units:[u0].filter(Boolean),pub:1,draft:null,cur:{caption:''},
      versions:[{v:1,when:'Sat 26 Sep',by:o.rep,note:'project asset'}],
      attempts:[{when:'Sat 26 Sep, 10:12',ch:'WhatsApp',ver:1,fmt:'pdf',status:'Unknown',msg:`Hi ${first}, here is the spec sheet for ${u0||dev}.`}],access:null,eng:''},
  ];
  if(typeof cpSeedIssue==='function'){const p=cpSeedIssue(o);if(p)A.splice(2,0,p);}
  return A;
}
function swAssets(o,x){
  x=x||getExt(o);
  if(!x.swAssets) x.swAssets=SW_SEEDED.has(o.id)&&!x.swEmpty?swSeed(o):[];
  // Entries other modules push through ensureShared() (compare shortlists, Present) join the list.
  (x.shared||[]).forEach(s=>{if(!s._sw&&s.n){s._sw=1;x.swAssets.unshift({id:'lg'+swHash(s.n+x.swAssets.length),type:'other',title:s.n,icon:s.k||'LINK',units:[],pub:1,versions:[{v:1,when:'Just now',by:o.rep,note:'generated'}],attempts:[],access:null,legacy:s,eng:''});}});
  return x.swAssets;
}
const swA=(o,id)=>swAssets(o).find(a=>a.id===id);
const SW_OK=new Set(['Delivered','Sent','External','Opened']);
function swLastOk(a){
  if(a.legacy) return /not yet sent/i.test(a.legacy.eng||'')?null:{when:'Just now',ch:'Shared',ver:1,status:'Sent'};
  return [...a.attempts].reverse().find(t=>SW_OK.has(t.status))||null;
}
function swLastTry(a){return a.attempts[a.attempts.length-1]||null;}
function swIsShared(a){return !!swLastOk(a);}

// ---------- legacy shape for older readers (contact page, Present) ----------
function swLegacy(o,a){
  const ok=swLastOk(a), c=swChips(o,a);
  return {n:a.title,k:a.icon,d:a.legacy?a.legacy.d:`${swDev(o,a)}${a.units.length?' · '+swUnits(a):''}`,via:ok&&!a.legacy?`${o.lead} · ${ok.ch} · ${ok.when} · v${ok.ver}`:'',
    chips:c.map(([t,tone])=>[t,tone]),eng:a.legacy?a.legacy.eng:(typeof cpEngLine==='function'&&a.type==='pack'?cpEngLine(o,a):a.eng),fail:swFailText(a)};
}
window.ensureShared=function(o,x){
  x=x||getExt(o); if(!x.shared) x.shared=[];
  const live=swAssets(o,x).filter(a=>!a.legacy&&swIsShared(a)).map(a=>swLegacy(o,a));
  // Writers that address a fixed index on the old seeded list get a harmless stand-in.
  return new Proxy(x.shared,{get(t,k){
    if(k==='length') return t.length+live.length;
    if(typeof k==='string'&&/^\d+$/.test(k)){const i=+k;return i<t.length?t[i]:(live[i-t.length]||{});}
    if(k==='map'||k==='forEach'||k==='filter'||k==='some'||k==='find'||k==='flatMap'||k==='slice') return (...args)=>[...t.filter(s=>s.n),...live][k](...args);
    const v=t[k]; return typeof v==='function'?v.bind(t):v;
  }});
};
window.ensurePrep=function(o,x){return swPrepRows(o,x||getExt(o)).map(p=>({n:p.title,d:p.sub,chip:[p.status,p.tone],act:p.act}));};

function swChips(o,a){
  const ok=swLastOk(a), out=[];
  if(!ok) return out;
  if(a.legacy) return [['Sent','']];
  out.push([ok.status==='External'?'Shared externally · agent recorded':ok.status,ok.status==='Delivered'||ok.status==='Opened'?'ok':'']);
  if(a.access){
    if(a.access.state==='revoked') out.push([`Revoked ${a.access.when} by ${a.access.by}`,'err']);
    else out.push([a.type==='microsite'&&a.pub!==ok.ver?`Live link · now opens v${a.pub}`:`Link active · expires ${a.access.exp}`,'']);
  }
  if(a.pub!==ok.ver) out.push([`Current published v${a.pub}`,'warn']);
  if(a.draft) out.push(['Unpublished update','warn']);
  return out;
}
function swFailText(a){
  const t=swLastTry(a), ok=swLastOk(a);
  if(!t||t.status!=='Failed'||!ok) return '';
  return `Resend failed ${t.when.split(',')[0]} · ${t.why||'not delivered'}. Last delivered ${swDay(ok.when)}.`;
}
function swPrepRows(o,x){
  const rows=[], first=swFirst(o);
  swAssets(o,x).forEach(a=>{
    const ok=swLastOk(a), t=swLastTry(a), noun=SW_NOUN[a.type];
    if(a.legacy){if(!ok) rows.push({id:a.id,title:a.title,sub:a.legacy.d||'',status:'Generated · not sent',tone:'',act:'Share'});return;}
    if(a.type==='pack') return;
    if(!ok&&t&&t.status==='Unknown') rows.push({id:a.id,title:a.title,sub:`First send · ${t.ch} · ${t.when} · provider didn’t confirm`,status:'Outcome unknown',tone:'warn',act:'Reconcile'});
    else if(!ok&&t&&t.status==='Failed') rows.push({id:a.id,title:a.title,sub:`First send · ${t.ch} · ${t.when} · ${t.why||'not delivered'}`,status:'Not delivered',tone:'err',act:'Retry'});
    else if(!ok) rows.push({id:a.id,title:a.title,sub:`Issued ${a.versions[a.versions.length-1].when}${a.type==='pricelist'?' · valid 14 days':''}`,status:'Published · not shared',tone:'ok',act:'Share'});
    if(ok&&a.draft) rows.push({id:a.id,title:`${a.title} · draft update`,sub:`Update to the shared ${noun} above · ${first}’s copy is unchanged`,status:'Private draft',tone:'',act:'Review update'});
  });
  (x.swStudio||[]).forEach(r=>rows.push({id:null,title:r.title,sub:r.sub,status:'With Studio',tone:'',act:null}));
  return rows;
}

// ---------- the card ----------
function swAssetCard(o,a){
  if(a.type==='pack'&&typeof cpCardHtml==='function') return cpCardHtml(o,a);
  const ok=swLastOk(a), chips=swChips(o,a), fail=swFailText(a), menu=SW.menu===a.id;
  if(a.legacy) return `<div class="cr-lc sh-item"><span class="sh-thumb">${swE(a.icon)}</span><div class="sh-body"><div class="sh-top"><span class="sh-n">${swE(a.title)}</span></div><div class="cr-lc-meta">${swE(a.legacy.d||'')}</div>${a.legacy.eng?`<div class="cr-lc-meta">${swE(a.legacy.eng)}</div>`:''}</div></div>`;
  return `<div class="cr-lc sh-item" data-sw="${a.id}">
    <span class="sh-thumb">${swE(a.icon)}</span>
    <div class="sh-body">
      <div class="sh-top"><span class="sh-n">${swE(a.title)}</span>
        <span class="sh-acts"><button class="sh-btn" onclick="swOpen('view','${a.id}')">View</button><button class="sh-btn" onclick="swOpen('edit','${a.id}')">Edit</button><button class="sh-btn primary" onclick="swOpen('share','${a.id}')">Share</button>
          <span class="sw-more"><button class="sh-btn sh-more" aria-label="More actions for ${swE(a.title)}" aria-haspopup="menu" aria-expanded="${menu}" onclick="swMenu(event,'${a.id}')">⋯</button>${menu?`<div class="sw-menu" role="menu"><button role="menuitem" onclick="swOpen('resend','${a.id}')">Resend</button><button role="menuitem" onclick="swOpen('history','${a.id}')">History</button>${a.access?`<button role="menuitem" onclick="swOpen('history','${a.id}',{access:1})">Manage access</button>`:''}</div>`:''}</span></span></div>
      <div class="cr-lc-meta">${swE(swDev(o,a))}${a.units.length?' · '+swE(swUnits(a)):''}</div>
      ${ok?`<div class="sh-via">${swE(o.lead)} · ${swE(ok.ch)} · ${swE(ok.when)} · v${ok.ver}</div>`:''}
      ${chips.length?`<div class="sh-chips">${chips.map(([t,tone])=>`<span class="sh-chip ${tone}">${swE(t)}</span>`).join('')}</div>`:''}
      ${a.eng?`<div class="cr-lc-meta">${swE(a.eng)}</div>`:''}
      ${fail?`<div class="sh-fail"><span>${swE(fail)}</span><button onclick="swRetry('${a.id}')">Retry</button><button onclick="swFix('${a.id}')">Fix address</button></div>`:''}
    </div></div>`;
}
window.crPackPanelHtml=function(o,x){
  const all=swAssets(o,x), shared=all.filter(a=>a.type==='pack'?(typeof cpIsListed==='function'&&cpIsListed(a)):swIsShared(a));
  const prep=swPrepRows(o,x), cpPrep=typeof cpPrepHtml==='function'?cpPrepHtml(o,x):[];
  const nS=shared.length, nP=prep.length+cpPrep.length, f=oppShareF, first=swFirst(o);
  const prepHtml=cpPrep.join('')+prep.map(p=>`<div class="sh-prep"><div class="sh-prep-t"><div class="sh-n">${swE(p.title)}</div><div class="cr-lc-meta">${swE(p.sub)}</div></div><span class="sh-chip ${p.tone}">${swE(p.status)}</span>${p.act?`<button class="sh-btn" onclick="swPrepAct('${p.id}','${p.act}')">${p.act}</button>`:''}</div>`).join('');
  const empty=!nS&&!nP;
  return `<div class="dcard sh-card" id="sw-card">
    <div class="row-between rail-h"><div class="side-h">Shared with client</div>
      <div class="sw-head-r">${empty?'':`<div class="seg sh-seg">${[['all','All'],['shared',`Shared ${nS}`],['prep',`In preparation ${nP}`]].map(([k,l])=>`<button type="button" class="${f===k?'on':''}" onclick="oppShareFilter('${k}')">${l}</button>`).join('')}</div>`}
      <span class="sw-more"><button class="sw-dots" aria-label="Prototype scenarios" aria-haspopup="menu" onclick="swMenu(event,'__demo')">⋯</button>${SW.menu==='__demo'?swDemoMenu(o):''}</span></div></div>
    ${empty?`<div class="sw-empty"><div class="sh-n">Nothing shared with ${swE(first)} yet</div><div class="cr-lc-meta">Brochures, links and packs you send appear here with delivery, access and what ${swE(first)} opened. Present sessions start from Actions.</div><div class="sw-row"><button class="sh-btn" onclick="qaBrochure()">Send unit details</button><button class="sh-btn primary" onclick="crOpen('${o.id}')">Build custom pack</button></div></div>`:''}
    ${!empty&&f!=='prep'?`<div class="sh-sec">Shared · ${nS}</div><div class="sh-list">${shared.map(a=>swAssetCard(o,a)).join('')||`<div class="cr-lc-meta sw-pad">Nothing has been sent yet. Items waiting to go are under In preparation.</div>`}</div>`:''}
    ${!empty&&f!=='shared'?`<div class="sh-sec">In preparation · not shared yet · ${nP}</div><div class="sh-list">${prepHtml||`<div class="cr-lc-meta sw-pad">Nothing in preparation.</div>`}</div>`:''}
  </div>`;
};
function swDemoMenu(o){
  const it=(l,fn)=>`<button role="menuitem" onclick="${fn}">${l}</button>`;
  return `<div class="sw-menu sw-demo" role="menu"><div class="sw-menu-h">Prototype scenarios</div>
    ${it(`${SW_SIM.noEmail?'✓ ':''}No email on file`,`swSim('noEmail')`)}${it(`${SW_SIM.outside?'✓ ':''}Outside WhatsApp 24-hour window`,`swSim('outside')`)}
    ${it(`${SW_SIM.next==='Unknown'?'✓ ':''}Next send: outcome unknown`,`swSim('Unknown')`)}${it(`${SW_SIM.next==='Failed'?'✓ ':''}Next send: fails`,`swSim('Failed')`)}
    ${typeof cpDemoItems==='function'?cpDemoItems(o):''}
    ${it('Show empty state',`swSim('empty')`)}</div>`;
}
function swSim(k){
  const o=oppCur,x=getExt(o); SW.menu=null;
  if(k==='noEmail'||k==='outside') SW_SIM[k]=!SW_SIM[k];
  else if(k==='Unknown'||k==='Failed') SW_SIM.next=SW_SIM.next===k?null:k;
  else if(k==='empty'){x.swEmpty=true;x.swAssets=[];x.shared=[];delete x.crDraft;}
  renderOpp(); showToast(k==='empty'?'Showing a buyer with nothing shared':'Scenario updated');
}
function swMenu(e,id){e.stopPropagation();SW.menu=SW.menu===id?null:id;renderOpp();}
document.addEventListener('click',e=>{if(SW.menu&&!e.target.closest('.sw-more')){SW.menu=null;if(document.getElementById('sw-card'))renderOpp();}});
function swPrepAct(id,act){
  const o=oppCur,a=swA(o,id); if(!a) return;
  if(act==='Share') swOpen('share',id);
  else if(act==='Review update') swOpen('edit',id,{review:1});
  else if(act==='Reconcile'){swOpen('deliver',id,{dstate:'unknown',attempt:a.attempts.length-1});}
  else if(act==='Retry') swOpen('share',id);
}
function swRetry(id){
  const o=oppCur,a=swA(o,id),t=swLastTry(a);
  a.attempts.push({when:swNow(),ch:t.ch,ver:t.ver,fmt:t.fmt,status:'Delivered',msg:t.msg});
  getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`${a.title} v${t.ver} resent via ${t.ch} · delivered`});
  renderOpp(); showToast('Retry sent to the same address. Tracking in history.');
}
function swFix(id){swOpen('share',id,{intent:'resend',channel:'email',fixAddr:1});}

// ---------- sheet scaffold ----------
function swSheetEl(){
  let el=document.getElementById('swSheet');
  if(!el){
    document.body.insertAdjacentHTML('beforeend',`<div class="scrim" id="swScrim" onclick="swClose()"></div><aside class="opp-drawer sw-sheet" id="swSheet" role="dialog" aria-modal="true" aria-labelledby="swTitle"><div class="od-head"><div><span id="swTitle"></span><div class="sw-sub" id="swSub"></div></div><button class="x" aria-label="Close" onclick="swClose()"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 3l8 8M11 3l-8 8"/></svg></button></div><div class="od-body" id="swBody"></div><div class="od-foot" id="swFoot"></div></aside>`);
    el=document.getElementById('swSheet');
  }
  return el;
}
function swShow(title,sub,body,foot,wide){
  const el=swSheetEl();
  document.getElementById('swTitle').textContent=title; document.getElementById('swSub').textContent=sub||'';
  document.getElementById('swBody').innerHTML=body; document.getElementById('swFoot').innerHTML=foot;
  el.style.width=wide?'min(860px,96vw)':'min(620px,96vw)';
  el.classList.add('open'); document.getElementById('swScrim').classList.add('on');
}
function swClose(){
  const el=document.getElementById('swSheet'); if(el) el.classList.remove('open');
  const s=document.getElementById('swScrim'); if(s) s.classList.remove('on');
  SW={sheet:null}; if(oppCur&&document.getElementById('p-opp')?.classList.contains('on')) renderOpp();
}
function swToast(t){showToast(t);}
const swB=(label,fn,kind,dis)=>`<button class="${kind==='p'?'btn-primary':'btn-ghost'}${kind==='e'?' sw-danger':''}" ${dis?'disabled':''} onclick="${fn}">${label}</button>`;
const swBanner=(t,tone)=>t?`<div class="sw-banner ${tone||''}">${t}</div>`:'';
const swKV=rows=>`<div class="sw-kv">${rows.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
const swRows=rows=>`<div class="sw-rows">${rows.map(([k,v])=>`<div><span>${k}</span><div>${v}</div></div>`).join('')}</div>`;
const swPick=(name,opts,cur,fn)=>`<div class="seg sw-seg" role="radiogroup" aria-label="${name}">${opts.map(([v,l])=>`<button type="button" role="radio" aria-checked="${cur===v}" class="${cur===v?'on':''}" onclick="${fn}('${v}')">${l}</button>`).join('')}</div>`;

// ---------- open ----------
function swOpen(sheet,id,opt={}){
  const o=oppCur, a=swA(o,id); if(!a) return;
  SW.menu=null;
  const base={oid:o.id,id,viewVer:'shared',page:0,dtab:a.type==='microsite'?'web':'pdf',device:'desktop',revokeAsk:false,packConfig:false,dupAsk:false,fixAddr:!!opt.fixAddr};
  if(sheet==='edit'){
    if(SW_ROUTED.has(a.type)){SW={...base,sheet:'router',ed:{title:a.title,caption:(a.cur&&a.cur.caption)||''}};}
    else if(a.type==='pack'&&typeof cpEditBase==='function'){SW={...base,sheet:opt.review?'review':'editor',ed:cpEditBase(o,a)};}
    else{const src=a.draft||a.cur;SW={...base,sheet:opt.review?'review':'editor',ed:JSON.parse(JSON.stringify(src))};}
  }
  else if(sheet==='share'||sheet==='update') SW={...base,sheet:'setup',intent:opt.intent||(sheet==='update'?'update':'share'),ver:a.pub,format:SW_FMT[a.type],channel:opt.channel||(swOkWa(o)?'whatsapp':'email')};
  else if(sheet==='resend') SW={...base,sheet:'resend',intent:'resend',resendVer:'updated',resendMsg:'resend',format:(swLastOk(a)||{}).fmt||SW_FMT[a.type],channel:/mail/i.test((swLastOk(a)||{}).ch||'')?'email':'whatsapp'};
  else if(sheet==='deliver') SW={...base,sheet:'deliver',dstate:opt.dstate||'delivered',attempt:opt.attempt,channel:/mail/i.test((a.attempts[opt.attempt]||{}).ch||'')?'email':'whatsapp'};
  else SW={...base,sheet,access:!!opt.access};
  swRender();
}
function swOkWa(o){const c=swContact(o);return !c||!c.consent||c.consent.wa!==false;}
function swSet(k,v){SW[k]=v;swRender();}
function swGo(sheet){SW.sheet=sheet;swRender();}

// ---------- copy ----------
function swStarter(o,a,intent,fmt){
  const first=swFirst(o), noun=SW_NOUN[a.type], link=swLink(o,a), dev=swDev(o,a), u=a.units[0]||dev;
  const d=fmt==='link'?`You can view it here: ${link}.`:fmt==='both'?`I’ve attached the PDF, and you can also view it here: ${link}.`:`I’ve attached the ${a.type==='brochure'?'brochure PDF':'PDF'}.`;
  if(a.type==='microsite') return intent==='resend'?`Hi ${first}, here is the link to your property selection again: ${link}. Let me know which options you would like to discuss.`:intent==='update'?`Hi ${first}, I’ve updated your property selection: ${link}.`:`Hi ${first}, here is your property selection for ${dev}: ${link}. You can review the floor plans, gallery and downloads, and contact me with any questions.`;
  if(intent==='resend') return `Hi ${first}, sharing your ${noun} for ${u} again so you have it handy. ${d} Let me know if you have any questions.`;
  if(intent==='update') return `Hi ${first}, I’ve updated your ${noun} for ${u}. ${d} Let me know if you would like to discuss it.`;
  return `Hi ${first}, here is your ${noun} for ${a.type==='floorplan'||a.type==='spec'?u:dev+(a.units.length?', covering '+swUnits(a):'')}. ${d} Let me know which options you would like to discuss.`;
}
function swSubject(o,a,intent){const n=SW_NOUN[a.type],dev=swDev(o,a);return intent==='resend'?`Your ${n} - shared again`:intent==='update'?`Updated ${n} for ${dev}`:`Your ${n} for ${dev}`;}
function swFileName(o,a,v){return `${a.type==='pack'?'pack':a.type}-${o.lead.toLowerCase().replace(/\s+/g,'-')}-v${v}.pdf`;}
function swDeliverables(o,a,fmt,v){
  const out=[];
  if(fmt==='pdf'||fmt==='both') out.push({icon:'PDF',name:swFileName(o,a,v),sub:a.type==='pack'?'6.1 MB · attached':'2.4 MB · attached'});
  if(fmt==='link'||fmt==='both') out.push({icon:'LINK',name:swLink(o,a),sub:`Opens v${v} · for ${swFirst(o)} only · expires ${(a.access&&a.access.exp)||'in 30 days'}`});
  return out;
}

// ---------- render ----------
function swRender(){
  const o=OPPS.find(r=>r.id===SW.oid), a=o&&swA(o,SW.id); if(!a) return;
  const first=swFirst(o), s=SW, ok=swLastOk(a)||{ver:a.pub,when:'—',ch:'—'};
  if(a.type==='pack'&&typeof cpSheet==='function'){const r=cpSheet(o,a);if(r){swShow(...r);return;}}
  let T='',S='',B='',F='',W=false;
  const close='swClose()';
  if(s.sheet==='view'){
    const v=s.viewVer==='shared'?ok.ver:a.pub, web=a.type==='microsite'||(a.type==='pack'&&s.dtab==='web');
    T=a.title; S=`Read-only · v${v}`; W=true;
    const pages=(SW_SECTIONS[a.type]||[['p','Document','p1']]);
    B=`${a.pub!==ok.ver&&s.viewVer==='shared'?swBanner(`You’re viewing v${ok.ver}, the version last shared. v${a.pub} is published${a.access&&a.access.state==='active'?`, and ${first}’s live link opens v${a.pub} now`:''}.`,'warn'):''}
      ${swKV([['Buyer',swE(o.lead)],['Units',swE(swUnits(a)||'—')],['Version',s.viewVer==='shared'?`v${ok.ver} · last shared`:`v${a.pub} · current published`],['Issued',swE(s.viewVer==='shared'?swDay(ok.when):a.versions[a.versions.length-1].when)]])}
      ${a.pub!==ok.ver?`<div class="sw-line"><span class="sw-mu">Show</span>${swPick('Version',[['shared',`v${ok.ver} · what ${first} got`],['pub',`v${a.pub} · what the live link opens now`]],s.viewVer,"swSetV")}</div>`:''}
      ${a.type==='pack'?`<div class="sw-tabrow"><div class="sw-tabs" role="tablist"><button role="tab" aria-selected="true" class="on">Content</button><button role="tab" aria-selected="false" onclick="swGo('history')">History</button></div>${swPick('Deliverable',[['pdf','Brochure PDF'],['web','Buyer page']],s.dtab,"swSetTab")}</div>`:''}
      ${web?swWebMock(o,a,s.viewVer==='shared'?ok.ver:a.pub,'100%'):swPdfMock(o,a,v,pages)}
      <div class="sw-row">${web?`<button class="df-link" onclick="swGo('preview')">Client preview</button>`:''}<button class="df-link" onclick="swGo('history')">History and access</button></div>`;
    F=swB('Close',close)+swB('Edit',`swOpen('edit','${a.id}')`)+swB('Share',`swOpen('share','${a.id}')`,'p');
  }
  else if(s.sheet==='preview'){
    T=`${a.title} · client preview`; S=`What ${first} sees`; W=true;
    B=`<div class="sw-stage"><div class="sw-stage-h"><span class="sw-mu">Staff preview · form submissions sandboxed · not counted as a buyer visit</span>${swPick('Device',[['desktop','Desktop'],['mobile','Mobile']],s.device,"swSetDev")}</div>
      <div class="sw-device ${s.device}">${swWebMock(o,a,a.pub,s.device==='mobile'?'280px':'100%')}</div></div>`;
    F=swB('Back',`swGo('view')`)+swB('Open client link',`swToast('Opens the real link, subject to its access rules. Not counted as ${swE(first)}’s visit.')`,'p');
  }
  else if(s.sheet==='history'){
    T=`${a.title} · history and access`; S=`${swDev(o,a)}${a.units.length?' · '+swUnits(a):''}`;
    const vs=[...a.versions].reverse().map(v=>`<div class="sw-li"><span><b>v${v.v}</b> · ${v.v===a.pub?'current published':v.v===ok.ver?'last shared':'superseded'}${v.note?` <span class="sw-mu">· ${swE(v.note)}</span>`:''}</span><em>${swE(v.when)} · ${swE(v.by)}</em></div>`).join('');
    const at=[...a.attempts].reverse().map(t=>`<div class="sw-att"><span class="sw-mu">${swE(t.when)}</span><div><div>${swE(o.lead)} · ${swE(t.ch)} · v${t.ver}</div><div class="sw-msg">“${swE(t.msg||'')}”</div></div><div class="sw-att-r"><span class="sh-chip ${t.status==='Failed'?'err':t.status==='Unknown'?'warn':SW_OK.has(t.status)?'ok':''}">${t.status==='External'?'Agent recorded':t.status==='Unknown'?'Outcome unknown':swE(t.status)}${t.why?' · '+swE(t.why):''}</span><button class="df-link" onclick="swOpen('resend','${a.id}')">Resend</button></div></div>`).join('')||'<div class="sw-mu">No sends yet.</div>';
    const util=(a.util||[]).map(u=>`<div class="sw-mu sw-util">${swE(u.what)} by ${swE(u.by)} · ${swE(u.when)} · utility, not a send</div>`).join('');
    const acc=a.access?(a.access.state==='revoked'?`<b>${swE(`Revoked ${a.access.when} by ${a.access.by}`)}</b><div class="sw-mu">The link stopped working at once. Anything ${swE(first)} already downloaded isn’t affected; the history stays.</div>`:`<b>Access</b><div>Live link for ${swE(first)} only · opens the current published version · expires ${swE(a.access.exp)}.</div>
      ${s.revokeAsk?`<div class="sw-confirm"><b>Revoke ${swE(first)}’s link?</b><div class="sw-mu">${swE(swLink(o,a))} stops working immediately. Attachments already sent aren’t affected.</div><div class="sw-row">${swB('Keep link',"swSet('revokeAsk',false)")}${swB('Revoke','swRevoke()','e')}</div></div>`:`<div class="sw-row">${swB('Renew',"swRenew()")}${swB('Revoke access',"swSet('revokeAsk',true)",'e')}</div>`}`):`<b>Access</b><div class="sw-mu">Sent as an attachment. There is no hosted link to manage.</div>`;
    B=`<div class="sw-h">Published versions</div>${vs}<div class="sw-h">Delivery attempts</div>${at}${util}<div class="sw-box" id="sw-access">${acc}</div>`;
    F=swB('Close',close)+swB('Resend',`swOpen('resend','${a.id}')`,'p');
  }
  else if(s.sheet==='editor'){
    const e=s.ed, secs=SW_SECTIONS[a.type]||[], ms=a.type==='microsite';
    T=`Edit ${a.title.toLowerCase()}`; S='Private draft'; W=true;
    const pool=[...new Set([...(a.cur.units||[]),...o.units,...UNITS.filter(u=>u.dev===swDev(o,a)&&u.status==='available').map(u=>u.id)])].slice(0,3);
    const unitLine=u=>UN(u)?`${UN(u).beds?UN(u).beds+' bed':'Studio'} · floor ${UN(u).floor}`:'';
    B=`${swBanner(ms?`Private draft. ${first}’s live page stays on v${a.pub} until you publish.`:`Private draft. The live PDF and ${first}’s link stay on v${a.pub} until you publish.`)}
      <div class="sw-ed"><div>
        ${a.type==='brochure'?`<div class="od-field"><label for="swTmpl">Template</label><select id="swTmpl" onchange="SW.ed.tmpl=this.value">${['Personal','Classic','Investor'].map(t=>`<option value="${t}" ${e.tmpl===t?'selected':''}>${swE(swDev(o,a))} · ${t}</option>`).join('')}</select></div>`:''}
        <div class="od-field"><label for="swIntro">${ms?'Welcome text':'Introduction'}</label><textarea id="swIntro" rows="4" oninput="SW.ed.intro=this.value">${swE(e.intro||'')}</textarea></div>
        <div class="od-field"><label>Units</label><div class="sw-checks sw-plain">${pool.map(u=>`<label class="sw-check"><input type="checkbox" ${(e.units||[]).includes(u)?'checked':''} onchange="swEdUnit('${u}',this.checked)"><span>${swE(u)} · ${swE(unitLine(u))}</span></label>`).join('')}</div></div>
        <div class="od-field"><label>Sections</label><div class="sw-checks sw-plain">${secs.map(([k,l])=>`<label class="sw-check"><input type="checkbox" ${e.secs&&e.secs[k]?'checked':''} onchange="swEdSec('${k}',this.checked)"><span>${l}</span></label>`).join('')}</div></div>
        <div class="od-field"><label>${ms?'Preview':'Prices'}</label>${swPick(ms?'Preview':'Prices',ms?[['desktop','Desktop'],['mobile','Mobile']]:[['show','Show'],['request','On request']],e.seg,"swEdSeg")}</div>
        ${a.type==='brochure'?`<div class="od-field"><label>Language</label>${swPick('Language',['English','Maltese','Italian'].map(t=>[t,t]),e.lang||'English',"swEdLang")}</div>`:''}
        <div class="sw-lock">${ms?'Locked: unit prices, availability and other buyers’ pages. Change those at source.':'Locked: measurements, prices, factual claims and required disclaimers. Changes go to their owner.'}</div>
      </div><div><div class="sw-mu">${ms?'Page preview':'PDF preview · same output as the final file'}</div>
        <div class="stage-prev"><div class="sw-prev ${ms&&e.seg==='mobile'?'mobile':''}"><div class="sw-pdf-eyebrow">${swE(swDev(o,a))} · DRAFT</div><div class="sw-pdf-h">Prepared for ${swE(o.lead)}</div><p>${swE(e.intro||'')}</p>${secs.filter(([k])=>e.secs&&e.secs[k]).map(([,l,p])=>`<div class="sw-prev-sec"><span>${l}</span><em>${p}</em></div>`).join('')}${(e.units||[]).map(u=>`<div class="sw-prev-u">${swE(u)}${UN(u)?` · ${e.seg==='request'?'Price on request':fmtEur(UN(u).price)}`:''}</div>`).join('')}</div></div></div></div>`;
    F=swB('Discard',close)+swB('Save draft','swSaveDraft()')+swB('Review update',"swGo('review')",'p');
  }
  else if(s.sheet==='router'){
    T=`Edit ${a.title}`; S='Supporting asset';
    B=`${swBanner(`${a.type==='pricelist'?'Price lists are issued from the price book':'Floor plans and spec sheets are project assets'}. Here you can change what ${first} sees around it, not the ${a.type==='pricelist'?'prices':'plan'} itself.`)}
      <div class="od-field"><label for="swRtTitle">Title</label><input id="swRtTitle" value="${swE(s.ed.title)}" oninput="SW.ed.title=this.value"></div>
      <div class="od-field"><label for="swRtCap">Caption</label><textarea id="swRtCap" rows="3" oninput="SW.ed.caption=this.value">${swE(s.ed.caption)}</textarea></div>
      <div class="sw-lock">Locked: the ${a.type==='pricelist'?'prices and validity':'drawing, dimensions and disclaimers'}. <button class="df-link" onclick="swStudio()">Request a revision from Studio</button></div>`;
    F=swB('Cancel',close)+swB('Save for this opportunity','swRouterSave()','p');
  }
  else if(s.sheet==='review'){
    const ch=swChanges(o,a,s.ed), linkOn=a.access&&a.access.state==='active';
    T='Review update'; S=a.title; W=true;
    const tone={Added:'ok',Removed:'err'};
    B=`<div class="sw-review"><div><div class="sw-vh">v${a.pub} live → v${a.pub+1} proposed</div>
        ${ch.length?ch.map(([k,v,t])=>`<div class="sw-li sw-diff"><b class="sw-${tone[k]||'mu'}">${k}</b><span>${swE(v)}</span></div>`).join(''):'<div class="sw-mu sw-pad-s">No content changes. Publishing creates the same content as a new version.</div>'}</div>
      <div class="sw-side">
        <div class="sw-box"><b>Checks</b><div class="sw-chk">✓ ${a.type==='pack'?'PDF and buyer page both ready':'Prices from inventory, Sat 26 Sep · valid 14 days'}</div><div class="sw-chk">✓ Required disclaimers present</div><div class="sw-chk">✓ ${a.type==='pack'?'Renders kept from the approved issue':'PDF ready · 2.4 MB · retrieved'}</div></div>
        <div class="sw-box"><b>What changes for ${swE(first)}</b><div class="sw-chk">${linkOn?`${swE(first)}’s live link will open v${a.pub+1}. `:''}${ok.fmt!=='link'&&swLastOk(a)?`The PDF attached on ${swE(swDay(ok.when))} stays v${ok.ver}. `:''}Nothing is sent when you publish.</div></div></div></div>`;
    F=swB('Back to edit',"swGo('editor')")+swB('Save draft and exit','swSaveDraft()')+swB('Publish and share','swPublish(true)')+swB('Publish update','swPublish()','p');
  }
  else if(s.sheet==='result'){
    T='Published'; S=a.title;
    const linkOn=a.access&&a.access.state==='active';
    B=`<div class="sw-result"><div class="sw-big">Published. No message sent.</div><div class="sw-mu">v${a.pub} · ${swE(a.versions[a.versions.length-1].when)} · by ${swE(o.rep)}</div>
      ${linkOn?`<div>${swE(first)}’s live link now opens v${a.pub}.</div>`:''}${swLastOk(a)&&ok.fmt!=='link'?`<div class="sw-mu">The PDF attached on ${swE(swDay(ok.when))} stays v${ok.ver}.</div>`:''}</div>`;
    F=swB('Return to opportunity',close)+swB('Share update',`swOpen('update','${a.id}')`,'p');
  }
  else if(s.sheet==='setup'){
    const v=s.ver||a.pub, email=swEmail(o), noEmail=s.channel==='email'&&!email;
    T=s.intent==='resend'?'Resend':s.intent==='update'?'Share update':'Share'; S=a.title;
    const fmts=a.type==='microsite'||a.type==='other'?[['link','Link']]:a.type==='pack'?[['pdf','PDF'],['link','Buyer page'],['both','Both']]:[['pdf','PDF attachment'],['link','Hosted link'],['both','Both']];
    const dl=swDeliverables(o,a,s.format,v);
    B=`${a.draft?swBanner(`This asset has unpublished changes. They aren’t included; ${first} gets v${a.pub}.`,'warn'):''}
      ${swRows([['To',`${swE(o.lead)} · ${swE(swPhone(o)||'no phone')} · ${swE(email||'no email on file')}`],['From',`${swE(o.rep)} · ${swE(swDev(o,a))} sales WhatsApp · ${swE(o.rep.toLowerCase())}@bricly.mt`],['Asset',`${swE(a.title)} · v${v}${v===a.pub?' (latest published)':' (pinned)'}`],['Intent',s.intent==='update'?`Update · published v${a.pub}`:s.intent==='resend'?'Resend · new attempt, same content version':'New share'],['Deliverables',swPick('Deliverables',fmts,s.format,"swSetFmt")],['Channel',swPick('Channel',[['whatsapp','WhatsApp'],['email','Email']],s.channel,"swSetCh")]])}
      <div class="sw-h">What ${swE(first)} receives</div>
      <div class="sw-dl">${dl.map(d=>`<div class="sw-dli"><span class="sh-thumb">${d.icon}</span><div><b>${swE(d.name)}</b><div class="sw-mu">${swE(d.sub)}</div></div></div>`).join('')}</div>
      ${noEmail||s.fixAddr?`<div class="sw-banner ${noEmail?'warn':''}">${noEmail?`No email on file for ${swE(first)}. We won’t invent an address.`:`Correct ${swE(first)}’s address. You return here with the resend intact.`}<div class="sw-row"><input id="swAddEmail" type="email" placeholder="name@email.com" value="${swE(s.fixAddr?email:'')}" aria-label="Email address"><button class="btn-ghost" onclick="swSaveEmail()">Save to contact</button></div></div>`:''}
      <div class="sw-row"><button class="df-link" onclick="swCopy()">Copy link</button>${s.format!=='link'?`<button class="df-link" onclick="swToast('Downloaded ${swE(swFileName(o,a,v))}. Logged as a download, not a send.')">Download PDF</button>`:''}${s.channel==='whatsapp'?`<button class="df-link" onclick="swToast('Opens WhatsApp with the message prefilled. Not recorded as a send.')">Open in WhatsApp app</button>`:''}<span class="sw-mu">These don’t count as sending.</span></div>`;
    F=swB('Cancel',close)+swB('Save message draft',`swClose();swToast('Message draft saved. Nothing was sent.')`)+swB('Continue','swCont()','p',noEmail);
  }
  else if(s.sheet==='whatsapp'){
    const out=SW_SIM.outside, v=s.ver||a.pub, link=swLink(o,a);
    T='WhatsApp'; S=a.title;
    B=`${out?swBanner(`${first} last replied 3 days ago, outside WhatsApp’s 24-hour window. Use an approved template or send by email.`,'warn'):''}
      <div class="sw-to">To ${swE(o.lead)} · ${swE(swPhone(o))} · <span class="sw-mu">from ${swE(swDev(o,a))} sales WhatsApp</span></div>
      <div class="sw-wa-grid"><div>
        ${out?`<div class="od-field"><label>Approved template · asset_share_v2</label><textarea rows="5" readonly>first_name: ${swE(first)}\nasset: your ${swE(SW_NOUN[a.type])}\nlink: ${swE(link)}</textarea></div>`:`<div class="od-field"><label for="swMsg">Message · editable</label><textarea id="swMsg" rows="7" oninput="SW.msg=this.value;document.getElementById('swWaPrev').textContent=this.value">${swE(s.msg)}</textarea></div>`}
        ${s.format!=='link'?`<div class="sw-attach"><span class="sh-thumb">PDF</span><span class="sw-attach-n">${swE(swFileName(o,a,v))}</span><span class="sw-mu">· ${a.type==='pack'?'6.1':'2.4'} MB · attached</span></div>`:''}
      </div><div><div class="sw-mu">Preview</div><div class="sw-wa"><div class="sw-bubble"><span id="swWaPrev">${swE(out?`Hi ${first}, here is your ${SW_NOUN[a.type]} from ${swDev(o,a)}: ${link}`:s.msg)}</span></div></div>
        <div class="sw-mu sw-note">No sent or read ticks until the provider confirms.</div></div></div>`;
    F=swB('Back',"swGo('setup')")+(out?swB('Send by email instead',"SW.channel='email';swCont()"):swB('Save draft',`swClose();swToast('Message draft saved.')`))+swB(out?'Send template':'Send on WhatsApp','swSend()','p');
  }
  else if(s.sheet==='email'){
    const v=s.ver||a.pub;
    T='Email'; S=a.title;
    B=`${swRows([['To',`${swE(o.lead)} · ${swE(swEmail(o))}`],['From',`${swE(o.rep)} · sales · ${swE(o.rep.toLowerCase())}@bricly.mt`]])}
      ${s.cc?`<div class="od-field"><label for="swCc">CC</label><input id="swCc" type="email"></div>`:`<div class="sw-mu">No CC or BCC by default. <button class="df-link" onclick="swSet('cc',true)">Add CC</button></div>`}
      <div class="od-field"><label for="swSubj">Subject</label><input id="swSubj" value="${swE(s.subject)}" oninput="SW.subject=this.value"></div>
      <div class="od-field"><label for="swMsg">Message</label><textarea id="swMsg" rows="7" oninput="SW.msg=this.value">${swE(s.msg)}\n\nKind regards,\n${swE(o.rep)}</textarea></div>
      <div class="sw-dl">${swDeliverables(o,a,s.format,v).map(d=>`<div class="sw-dli"><span class="sh-thumb">${d.icon}</span><div><b>${swE(d.name)}</b><div class="sw-mu">${swE(d.sub)}</div></div></div>`).join('')}</div>`;
    F=swB('Back',"swGo('setup')")+swB('Save draft',`swClose();swToast('Email draft saved.')`)+swB('Send email','swSend()','p');
  }
  else if(s.sheet==='resend'){
    const last=swLastOk(a)||swLastTry(a);
    T='Resend'; S=a.title;
    B=`<div class="sw-h">Previous attempt</div><div class="sw-box"><b>${swE(last.when)} · ${swE(last.ch)} to ${swE(first)} · v${last.ver}</b><div class="sw-msg">${swE(last.msg||'')}</div></div>
      ${a.pub!==last.ver?`<div class="sw-h">Which version?</div>${[['original',`Send the original · v${last.ver}`,`What ${first} got on ${swDay(last.when)}. Sent as a version-pinned link.`],['updated',`Send the updated version · v${a.pub}`,a.versions[a.versions.length-1].note||'The current published version.']].map(([v,l,sub])=>`<button type="button" class="sw-opt ${s.resendVer===v?'on':''}" onclick="swSet('resendVer','${v}')"><b>${swE(l)}</b><span>${swE(sub)}</span></button>`).join('')}`:`<div class="sw-mu">Same version v${a.pub}. A resend is a new attempt, not a new version.</div>`}
      <div class="od-field"><label>Message</label>${swPick('Message',[['keep','Keep original message'],['resend','Use resend draft']],s.resendMsg,"swSetRm")}</div>`;
    F=swB('Cancel',close)+swB('Continue','swCont()','p');
  }
  else if(s.sheet==='handoff'){
    T='Copy link'; S=a.title;
    B=`<div class="sw-result"><div class="sw-big">Link copied. Nothing was sent.</div><div class="sw-linkbox">${swE(swLink(o,a))}</div><div class="sw-mu">Opens v${a.pub} · for ${swE(first)} only. Opens on this link still count as ${swE(first)}’s.</div></div>
      <label class="sw-check sw-ext"><input type="checkbox" ${s.extOk?'checked':''} onchange="swSet('extOk',this.checked)"> I shared it with ${swE(first)} myself</label>
      ${s.extOk?`<div class="od-field"><label>How</label>${swPick('How',[['In person','In person'],['Personal WhatsApp','Personal WhatsApp'],['Phone','Phone']],s.extCh||'In person',"swSetExt")}</div>`:''}`;
    F=swB('Done',close)+swB('Record external share','swRecordExt()','p',!s.extOk);
  }
  else if(s.sheet==='deliver'){
    const t=a.attempts[s.attempt]||swLastTry(a), d=s.dstate, chL=/mail/i.test(t.ch)?'email':'WhatsApp';
    T=d==='delivered'?'Sent':d==='unknown'?'Outcome unknown':'Not delivered'; S=a.title;
    const tm=(t.when.split(', ')[1])||'—';
    const steps=d==='unknown'?[['Queued',tm,'ok'],['Sent','—','q'],['Delivered','—','']]:d==='failed'?[['Queued',tm,'ok'],[`Failed · ${t.why||'not delivered'}`,tm,'err'],['Delivered','—','']]:[['Queued',tm,'ok'],['Sent',tm,'ok'],['Delivered',tm,'ok']];
    B=`<div class="sw-big">${d==='unknown'?'Outcome unknown':d==='failed'?'Couldn’t deliver':`Delivered to ${swE(first)} on ${chL}`}</div>
      <div class="sw-mu">${swE(a.title)} · v${t.ver} · ${t.fmt==='both'?'PDF + link':t.fmt==='link'?'link':'PDF'} · ${s.intent==='resend'?'new attempt, same content version':'one send attempt'}</div>
      <div class="sw-steps">${steps.map(([l,w,k])=>`<div class="sw-step ${k}"><span>${k==='ok'?'✓':k==='err'?'!':k==='q'?'?':''}</span><b>${swE(l)}</b><em>${swE(w)}</em></div>`).join('')}</div>
      ${d==='delivered'?`<div class="sw-mu">Opening is tracked separately from delivery.</div>`:''}
      ${d==='unknown'?swBanner(`The provider accepted the message but hasn’t confirmed it was sent. We’re checking before anything is retried, so ${first} doesn’t get it twice.`,'warn'):''}
      ${d==='failed'?swBanner(swLastOk(a)?`${first}’s ${t.why||'address failed'}. The earlier share on ${swDay(swLastOk(a).when)} still stands; only this attempt failed.`:`Nothing reached ${first}. Correct the address or retry.`,'err'):''}
      ${s.dupAsk?`<div class="sw-confirm"><b>Send again anyway?</b><div class="sw-mu">If the first message did go out, ${swE(first)} gets it twice.</div><div class="sw-row">${swB('Cancel',"swSet('dupAsk',false)")}${swB('Send anyway','swResolve(\'dup\')','e')}</div></div>`:''}`;
    F=d==='unknown'?swB('Send again anyway…',"swSet('dupAsk',true)")+swB('Check status',"swResolve('check')",'p'):d==='failed'?swB('Return to opportunity',close)+swB('Correct address',`swFix('${a.id}')`)+swB('Retry',"swResolve('retry')",'p'):swB('View attempt',`swOpen('history','${a.id}')`)+swB('Return to opportunity',close,'p');
  }
  swShow(T,S,B,F,W);
  if(s.sheet==='history'&&s.access) setTimeout(()=>document.getElementById('sw-access')?.scrollIntoView({block:'start'}),0);
}
function swPdfMock(o,a,v,pages){
  const p=Math.min(SW.page,pages.length-1), pg=pages[p], cover=p===0;
  return `<div class="sw-pdf"><div class="sw-pdf-stage"><div class="sw-pdf-page">
      <div class="sw-pdf-eyebrow">${swE(swDev(o,a))} · V${v}</div>
      <div class="sw-pdf-h">${cover?`Prepared for ${swE(o.lead)}`:swE(pg[1])}</div>
      <div class="sw-pdf-sub">${swE(swUnits(a)||swDev(o,a))}${pg[2]?' · '+swE(pg[2]):''}</div>
      <div class="sw-pdf-lines"><i></i><i></i><i></i></div></div>
    <div class="sw-pager"><button aria-label="Previous page" ${p===0?'disabled':''} onclick="swSet('page',${p-1})">‹</button><span>Page ${p+1} of ${pages.length}</span><button aria-label="Next page" ${p>=pages.length-1?'disabled':''} onclick="swSet('page',${p+1})">›</button><span class="sw-dot">·</span><span>100%</span><span class="sw-dot">·</span><button class="df-link" onclick="swToast('Downloaded ${swE(swFileName(o,a,v))}. Logged as a download, not a send.')">Download</button></div></div></div>`;
}
function swWebMock(o,a,v,w){
  const units=a.type==='microsite'&&v<a.pub?(a.units||[]).slice(0,1):(a.units||[]);
  const intro=v<a.pub?'Homes picked for you, with floor plans and a gallery for each.':(a.cur&&a.cur.intro)||'Your selection';
  return `<div class="sw-web" style="width:${w}"><div class="sw-web-bar"><span aria-hidden="true">🔒</span> ${swE(swLink(o,a).replace(/(\/[sp]\/).*/,'$1•••••••'))}</div>
    <div class="sw-web-body"><div class="sw-web-h">Hi ${swE(swFirst(o))}, here’s your selection at ${swE(swDev(o,a))}</div><p>${swE(intro)}</p>
    <div class="sw-web-units">${units.map(u=>`<div><b>${swE(u)}${UN(u)?` · ${UN(u).beds?UN(u).beds+' bed':'Studio'} · floor ${UN(u).floor}`:''}</b><span>Floor plan · Gallery</span></div>`).join('')}</div>
    <span class="sw-web-cta">Contact ${swE(o.rep)}</span></div></div>`;
}
function swSetV(v){SW.viewVer=v;swRender();}
function swSetTab(v){SW.dtab=v;swRender();}
function swSetDev(v){SW.device=v;swRender();}
function swSetFmt(v){SW.format=v;swRender();}
function swSetCh(v){SW.channel=v;swRender();}
function swSetRm(v){SW.resendMsg=v;swRender();}
function swSetExt(v){SW.extCh=v;swRender();}
function swEdUnit(u,on){const e=SW.ed;e.units=(e.units||[]).filter(x=>x!==u);if(on)e.units.push(u);swRender();}
function swEdSec(k,on){SW.ed.secs={...SW.ed.secs,[k]:on?1:0};swRender();}
function swEdSeg(v){SW.ed.seg=v;swRender();}
function swEdLang(v){SW.ed.lang=v;swRender();}
function swChanges(o,a,e){
  if(a.type==='pack'&&typeof cpChanges==='function') return cpChanges(o,a,e);
  const c=a.cur||{}, out=[], secs=SW_SECTIONS[a.type]||[];
  secs.forEach(([k,l,p])=>{const was=!!(c.secs&&c.secs[k]),now=!!(e.secs&&e.secs[k]);if(now&&!was)out.push(['Added',`${l}${p?', '+p:''}`,'ok']);if(was&&!now)out.push(['Removed',`${l} section`,'err']);});
  if((e.intro||'')!==(c.intro||'')) out.push(['Changed',a.type==='microsite'?'Welcome text':'Introduction text','mu']);
  const add=(e.units||[]).filter(u=>!(c.units||[]).includes(u)),rm=(c.units||[]).filter(u=>!(e.units||[]).includes(u));
  out.push(['Units',add.length||rm.length?[add.length?'added '+add.join(', '):'',rm.length?'removed '+rm.join(', '):''].filter(Boolean).join(' · '):`${(e.units||[]).join(', ')||'none'} unchanged`,'mu']);
  if(e.seg!==c.seg&&a.type==='brochure') out.push(['Changed',`Prices ${e.seg==='request'?'on request':'shown'}`,'mu']);
  if(e.tmpl!==c.tmpl&&e.tmpl) out.push(['Changed',`Template · ${e.tmpl}`,'mu']);
  if(e.lang!==c.lang&&e.lang) out.push(['Changed',`Language · ${e.lang}`,'mu']);
  return out;
}

// ---------- actions ----------
function swSaveDraft(){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id);
  a.draft=JSON.parse(JSON.stringify(SW.ed));
  const first=swFirst(o), linkOn=a.access&&a.access.state==='active';
  swClose(); showToast(`Draft saved. ${linkOn?`${first}’s link still opens v${a.pub}.`:`${first}’s copy is unchanged.`}`);
}
function swPublish(thenShare){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id),x=getExt(o), ch=swChanges(o,a,SW.ed);
  if(a.type==='pack'&&typeof cpPublish==='function') cpPublish(o,a,SW.ed);
  else{a.cur=JSON.parse(JSON.stringify(SW.ed)); if(a.cur.units) a.units=a.cur.units.slice();}
  a.pub++; a.draft=null;
  a.versions.push({v:a.pub,when:swNow(),by:o.rep,note:ch.filter(c=>c[0]!=='Units').map(c=>c[0].toLowerCase()+' '+c[1].toLowerCase()).join(' · ')||'republished'});
  x.comms.unshift({ch:'sys',t:'Just now',text:`${a.title} v${a.pub} published · no message sent`});
  if(thenShare){SW={oid:o.id,id:a.id,sheet:'setup',intent:'update',ver:a.pub,format:SW_FMT[a.type],channel:swOkWa(o)?'whatsapp':'email'};swRender();return;}
  SW.sheet='result'; swRender();
}
function swRouterSave(){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id);
  a.title=SW.ed.title.trim()||a.title; a.cur={...(a.cur||{}),caption:SW.ed.caption};
  swClose(); showToast(`Caption saved for ${swFirst(o)}’s copy. The project ${a.type==='pricelist'?'price list':'floor plan'} is unchanged.`);
}
function swStudio(){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id),x=getExt(o);
  (x.swStudio=x.swStudio||[]).push({title:`${a.title} · revision`,sub:'Requested from Studio · usually 2 working days'});
  showToast('Revision request sent to Studio. Tracked under In preparation.');
}
function swRevoke(){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id);
  a.access={...a.access,state:'revoked',when:new Date().toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}),by:o.rep};
  getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`${a.title} link revoked for ${swFirst(o)}`});
  SW.revokeAsk=false; swRender(); showToast('Link revoked. Attachments already sent aren’t affected.');
}
function swRenew(){const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id);a.access.exp='Sun 22 Nov';swRender();showToast('Renewed until Sun 22 Nov. Audience unchanged.');}
function swSaveEmail(){
  const v=(document.getElementById('swAddEmail')?.value||'').trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){showToast('Enter a valid email address');return;}
  const o=OPPS.find(r=>r.id===SW.oid), c=swContact(o); if(c) c.email=v; SW_SIM.noEmail=false; SW.fixAddr=false;
  swRender(); showToast(`Saved to ${o.lead}’s contact. Your draft is intact.`);
}
function swCont(){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id);
  if(SW.sheet==='resend'){const last=swLastOk(a)||swLastTry(a);SW.ver=SW.resendVer==='original'?last.ver:a.pub;SW.sheet='setup';SW.keepMsg=SW.resendMsg==='keep'?last.msg:null;swRender();return;}
  if(SW.channel==='email'&&!swEmail(o)){SW.sheet='setup';swRender();return;}
  SW.msg=SW.keepMsg||swStarter(o,a,SW.intent,SW.format); SW.subject=swSubject(o,a,SW.intent);
  SW.sheet=SW.channel==='email'?'email':'whatsapp'; swRender();
}
function swSend(){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id),x=getExt(o), email=SW.channel==='email';
  const forceFail=a.type==='floorplan'&&email&&SW.intent==='resend'&&!SW.fixed&&swLastTry(a)?.status==='Failed';
  const status=SW_SIM.next||(forceFail?'Failed':email&&a.type==='microsite'?'Sent':'Delivered'); SW_SIM.next=null;
  const msg=SW.msg||swStarter(o,a,SW.intent,SW.format);
  a.attempts.push({when:swNow(),ch:email?'Email':(SW_SIM.outside?'WhatsApp template':'WhatsApp'),ver:SW.ver||a.pub,fmt:SW.format,status,why:status==='Failed'?(email?'mailbox full':'number not on WhatsApp'):'',msg,intent:SW.intent});
  if(a.access&&a.access.state==='revoked'&&SW.format!=='pdf') a.access={state:'active',exp:'Sun 22 Nov'};
  if(!a.access&&SW.format!=='pdf') a.access={state:'active',exp:'Sun 22 Nov'};
  if(status==='Failed') x.comms.unshift({ch:'sys',t:'Just now',text:`${a.title} v${SW.ver||a.pub} · ${email?'email':'WhatsApp'} not delivered`});
  else x.comms.unshift({ch:email?'em':'wa',dir:'out',who:'You',t:'Just now',sub:xesc(`📎 ${a.title} · v${SW.ver||a.pub}`),text:xesc(msg)});
  if(a.legacy) a.legacy.eng='Sent just now · not yet opened';
  oppShareF='all'; SW.sheet='deliver'; SW.attempt=a.attempts.length-1; SW.dstate=status==='Unknown'?'unknown':status==='Failed'?'failed':'delivered';
  swRender(); if(typeof cpAfterSend==='function'&&a.type==='pack') cpAfterSend(o,a,status);
}
function swResolve(kind){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id),t=a.attempts[SW.attempt]||swLastTry(a);
  oppShareF='all';
  if(kind==='check'){t.status='Delivered';SW.dstate='delivered';showToast('Provider confirmed delivery. Nothing was resent.');}
  else{a.attempts.push({...t,when:swNow(),status:'Delivered',why:''});SW.attempt=a.attempts.length-1;SW.dstate='delivered';SW.dupAsk=false;showToast(kind==='dup'?'Sent again · recorded as a separate attempt':'Retry delivered');}
  swRender();
}
function swCopy(){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id);
  try{navigator.clipboard&&navigator.clipboard.writeText('https://'+swLink(o,a)).catch(()=>{});}catch(e){}
  if(!a.access) a.access={state:'active',exp:'Sun 22 Nov'};
  if(a.type==='pack'&&typeof cpCopied==='function') cpCopied(o,a);
  (a.util=a.util||[]).push({what:'Link copied',by:o.rep,when:swDay(swNow())});
  SW.sheet='handoff'; SW.extOk=false; SW.extCh='In person'; swRender();
}
function swRecordExt(){
  const o=OPPS.find(r=>r.id===SW.oid),a=swA(o,SW.id);
  if(!SW.extOk) return;
  oppShareF='all';
  a.attempts.push({when:swNow(),ch:`${SW.extCh||'In person'} · agent recorded`,ver:a.pub,fmt:'link',status:'External',msg:'Shared outside Bricly by the agent'});
  getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`${a.title} v${a.pub} shared externally (${SW.extCh||'In person'}) · agent recorded`});
  swClose(); showToast('Recorded as shared externally · agent recorded.');
}

// "Send unit details" quick send records a real attempt on the brochure.
window.qaBrochureSend=function(){
  const o=oppCur,x=getExt(o);
  const units=[...document.querySelectorAll('.qaBrUnit:checked')].map(b=>b.dataset.u);
  if(!units.length){showToast('Select at least one unit');return;}
  const chEl=document.querySelector('#qaBrCh .on'), ch=chEl?chEl.textContent.trim():'WhatsApp';
  let a=swAssets(o,x).find(r=>r.type==='brochure');
  if(!a){a={id:'br',type:'brochure',title:'Unit details',icon:'PDF',units,pub:1,draft:null,cur:{intro:'',units,secs:{cover:1,plans:1,payment:1},seg:'show'},versions:[{v:1,when:swNow(),by:o.rep,note:'approved unit details'}],attempts:[],access:null,eng:''};x.swAssets.unshift(a);}
  a.attempts.push({when:swNow(),ch,ver:a.pub,fmt:'pdf',status:'Delivered',msg:`Unit details for ${units.join(', ')}`});
  a.eng='Sent just now · not yet opened';
  x.comms.unshift({ch:'sys',t:'Just now',text:`Unit details sent via ${ch} — ${units.join(', ')}`});
  qaDrawerClose(); renderOpp(); if(document.getElementById('p-contact')?.classList.contains('on')&&typeof ctCur!=='undefined'&&ctCur) renderContact(); showToast('Unit details sent to '+swFirst(o));
};
