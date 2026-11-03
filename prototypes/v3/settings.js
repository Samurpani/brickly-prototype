// Settings (set1–set8) — native renderer for the Claude Design settings content in settings-data-a/b.js (window.BST).
// Links in the data use 'p:<page>' (navigate), 'd:<dialog>' (open dialog) and 's:<message>' (toast).
const ST_NAV_ACC=[['company','Company profile'],['team','Team'],['plan','Plan and billing'],['credits','Credits and usage'],['integrations','Integrations'],['approvals','Approvals'],['sales','Sales setup'],['notifications','Notifications'],['data','Data and privacy'],['security','Security']];
const ST_NAV_PER=[['me','My profile'],['mysecurity','Sign-in and sessions'],['calendar','Connected calendar'],['mywa','WhatsApp'],['mynotif','My notifications'],['myusage','My usage']];
// f = full edit, v = view only, missing = no access. Marketing is its own role: it reads the lead-capture side, never approvals or the team.
const ST_ACCESS={company:{owner:'f'},team:{owner:'f',manager:'v'},plan:{owner:'f'},credits:{owner:'f',manager:'v',marketing:'v'},integrations:{owner:'f',marketing:'v'},approvals:{owner:'f',manager:'f'},sales:{owner:'f',manager:'v',marketing:'v'},notifications:{owner:'f'},data:{owner:'f'},security:{owner:'f'},dev:{owner:'f',manager:'v'}};
const ST_PERSONAL=new Set(ST_NAV_PER.map(([k])=>k));
const ST_TONES=new Set(['ok','warn','err','info','pri','neu','dark','out']);
// The design data ships each dropdown with only its current value; these are the real choices.
const ST_SELECT_OPTS={
  'Main contact':['Mark Galea · Owner','Claire Azzopardi · Admin','Rachel Mifsud · Sales Manager'],
  'Default market':['Malta','Cyprus','Spain','Portugal','Greece'],
  'Currency':['EUR · Euro','GBP · Pound sterling','USD · US dollar'],
  'Time zone':['Europe/Malta (CEST, UTC+2)','Europe/London (BST, UTC+1)','Europe/Athens (EEST, UTC+3)','Asia/Dubai (GST, UTC+4)'],
  'Date format':['30 Sep 2026','30/09/2026','2026-09-30','Sep 30, 2026'],
  'Interface language':['English','Maltese','Italian'],
  'Bricly writes to':['Work · sam@lalex.mt','Personal · sam.u@gmail.com','Don’t write events'],
  'From':['18:00','19:00','20:00','21:00','22:00'],
  'Until':['06:00','07:00','07:30','08:00','09:00'],
  'Role':['Sales Rep','Sales Manager','Admin','Marketing','Ops'],
  'New role':['Sales Rep','Sales Manager','Admin','Marketing','Ops'],
  'Role scope':['Sales Rep','Sales Manager','Admin','Read only'],
  'Reports to':['Rachel Mifsud','Paul Grech','Mark Galea'],
  'Retention period':['6 years after a deal closes · 2 years after a lead goes cold','5 years after a deal closes · 2 years after a lead goes cold','3 years after a deal closes · 1 year after a lead goes cold'],
  'Identity documents':['Keep for the retention period · Ops and Admins only','Keep 5 years after the deal (AML) · Ops and Admins only','Delete after verification · keep a verification record'],
  'Source-of-funds records':['Keep 5 years after the deal (AML) · Ops and Admins only','Keep for the retention period · Ops and Admins only'],
  'Session length':['1 hour of inactivity','4 hours of inactivity','12 hours of inactivity','24 hours of inactivity','7 days'],
  'Applies to':['Rachel Mifsud’s team','Paul Grech’s team','Everyone','Sam','Karl Zammit','Matthew Vella','Sarah Azzopardi'],
  'Claim pool fallback':['Round robin after 15 min','Round robin after 30 min','Round robin after 60 min','Assign to the sales manager','Never — leave in the pool'],
  'Decided by':['The development’s sales manager','Any sales manager','The account owner'],
  'If nobody decides':['Assign to the original rep','Use the allocation rule','Leave it waiting'],
  'New owner':['Claire Azzopardi · Admin','Rachel Mifsud · Sales Manager'],
  'Person':['Luke Borg · Sales Rep','Anna Vella · Sales Rep','Sam · Sales Rep','Karl Zammit · Sales Rep'],
  'Developments':['All developments','Verdala','Marina Heights','Onyx Rise'],
  'Expires':['In 30 days','In 90 days','In 1 year','Never'],
  'Applies':['Every new lead','Leads from ads only','Leads from the website only'],
  'Development':['Verdala','Marina Heights','Onyx Rise','All developments'],
  'Request type':['Access (copy of data)','Erasure (delete)','Rectification (correct)','Objection to marketing','Portability'],
  'Required':['Required','Optional'],
  'Uploaded by':['Buyer','Ops','Lawyer','Rep'],
  'Stage':['Reservation','Promise of sale','Deed'],
  'Events':['All events','Opportunity changes','Deal milestones','Unit status changes'],
  'Ad platform':['Meta Ads','Google Ads','TikTok Ads'],
  'Merge into':['Investor','First-time buyer','Overseas'],
};
// Changing these settings has consequences for live records, so the change is confirmed in a dialog first.
const ST_CONFIRM_CHANGE={'Retention period':'retention'};
let stPage='company', stDlg=null, stMenuOpen=false, stDirty=false, stPendingGo=null, stPendingCancel=null;
const stEdits={}, stSaved={};
function stRole(){return typeof curPersona==='undefined'?'owner':curPersona;}
function stVal(id,fallback){const store=stStore(id);return id in store?store[id]:id in stSaved?stSaved[id]:fallback;}
function stAccess(nav){return ST_PERSONAL.has(nav)?'f':(ST_ACCESS[nav]||{})[stRole()]||null;}
function stTone(t){return ST_TONES.has(t)?t:'neu';}
function stEsc(v){return typeof xesc==='function'?xesc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stIni(s){return String(s).split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();}
function stLinkAttr(link){return link?` data-st-go="${stEsc(link)}"`:'';}
function stGo(link){
  if(!link)return;
  const k=link.slice(0,1),v=link.slice(2);
  if(k==='p'){
    const navigate=()=>{stDirty=false;stClearEdits();stPage=window.BST.pages[v]?v:'company';stDlg=null;stMenuOpen=false;stRender();document.getElementById('content').scrollTop=0;};
    if(stDirty&&v!==stPage){stAskLeave(navigate);return;}
    navigate();
  }
  else if(k==='d'){stMenuOpen=false;stDlg=v;stRender();}
  else if(k==='s'){stMenuOpen=false;stDlg=null;stRender();showToast(v);}
  else if(k==='f'){stMenuOpen=false;const [fn,...args]=v.split(':');if(typeof window[fn]==='function')window[fn](...args);}
  else if(k==='a'){
    stMenuOpen=false;stDlg=null;
    const [page,arg]=v.split('/');
    const leave=()=>{stDirty=false;stClearEdits();if(page==='dev'&&arg&&typeof openDev==='function')openDev(arg);else go(page);};
    if(stDirty){stAskLeave(leave);return;}
    leave();
  }
}
function stClearEdits(){Object.keys(stEdits).forEach(k=>delete stEdits[k]);}
function stDirtyCount(){return Object.keys(stEdits).length;}
// In-app guard (replaces window.confirm): keep editing, or discard and continue.
function stAskLeave(then){
  const d=window.BST.dialogs.leave;
  if(d){const n=stDirtyCount(),title=(window.BST.pages[stPage]||{}).t||'this page';d.d=`You have ${n} unsaved change${n===1?'':'s'} on ${title}.`;}
  stPendingGo=then;stMenuOpen=false;stDlg='leave';stRender();
}
// Called by go() before leaving Settings for another page.
function stBeforeNavigate(page){
  const on=document.getElementById('p-settings')?.classList.contains('on');
  if(!on||page==='settings'||!stDirty)return true;
  stAskLeave(()=>{stDirty=false;stClearEdits();go(page);});
  return false;
}
function stChip(v){const [t,tn]=Array.isArray(v)?v:[v,'neu'];return `<span class="st-chip t-${stTone(tn)}">${stEsc(t)}</span>`;}
// Inline row links in the design data are plain text; these are their real actions.
const ST_LINKS={
  'Sign out':'s:Signed out of that session. It ends on its next request.',
  'Download':'s:Downloading the export archive',
  'Override':'s:Override created for Verdala. It no longer follows the account default.',
  'Reset to default':'s:Verdala now uses the account default payment plan.',
  'Open in Studio':'s:Opening the launch in Bricly Studio',
  'Campaign report':'a:reports',
  'PDF':'s:Downloading the invoice PDF',
  'Needs approval · set in Approvals':'p:approvals',
  'Thread':'a:chats',
  'Revoke':'d:revoke',
  'Use default':'s:Now using the team default. The change is in the audit log.',
  'Merge':'d:mergetag','Delete':'d:deletetag',
  'Add stage':'d:addstage','Add document':'d:adddoc','Add endpoint':'d:addendpoint',
  'New template':'d:newplan','New tag':'d:newtag','Log a request':'d:dsar','Add account':'d:addadaccount','Contact billing':'d:contactbilling',
  'Export CSV':'s:Audit log exported as CSV with the current search and filters.','Export list':'s:Team list exported as CSV.',
  'Download contract':'s:Downloading your signed Bricly contract (PDF).','Export ledger':'s:Credit ledger exported as CSV.',
  'Send test message':'d:wa3','Apply New rep preset':'d:preset-new','Apply Trusted rep preset':'d:preset-trusted','Reset to defaults':'d:resetnotif',
  'Change role':'d:changerole','Reset password':'s:Password reset link sent.','Disconnect':'d:caldisc','Transfer ownership':'d:transfer',
  'Request registration':'s:Registration requested. Rachel Mifsud approves it in Team.',
};
// Actions without an explicit target fall back to their real action, never to a toast that repeats the label.
function stTarget(a){return a[1]||ST_LINKS[a[0]]||'s:'+a[0];}
function stLinkBtn(text,ro){
  const link=ST_LINKS[text]||'s:'+text;
  const nav=/^[pa]:/.test(link);
  return `<button type="button" class="st-link" data-st-go="${stEsc(link)}" ${ro&&!nav?'disabled':''}>${stEsc(text)}</button>`;
}
function stCell(c,id='',ro=false){
  if(c==null)c='';
  if(typeof c!=='object')c={t:String(c)};
  if(c.tg!==undefined){const on=stVal(id,!!c.tg);return `<button type="button" class="st-toggle ${on?'on':''}" ${id?`id="${id}"`:''} role="switch" aria-checked="${on}" ${ro?'disabled':''} data-st-toggle><span></span></button>`;}
  if(c.st!==undefined)return `<span class="st-step">${stEsc(c.st)}</span>`;
  if(c.ch)return `<span class="st-chans">${c.ch.map(([t,v,lk],j)=>{const cid=`${id}-${j}`,on=stVal(cid,!!v);return `<button type="button" class="st-chan ${on?'on':''}" id="${cid}" aria-pressed="${on}" ${lk||ro?'disabled':''} ${lk?`title="${stEsc(t)} is mandatory for this event"`:''} data-st-chan>${lk?'🔒 ':''}${stEsc(t)}</button>`;}).join('')}</span>`;
  if(c.c)return `<span class="st-chip t-${stTone(c.c)}">${stEsc(c.t)}</span>${c.s?`<span class="st-sub">${stEsc(c.s)}</span>`:''}`;
  if(c.lnk){const t=String(c.t??''),parts=t.split(' · ');return (parts.length>1&&parts.every(p=>ST_LINKS[p])?parts:[t]).map(p=>stLinkBtn(p,ro)).join('<span class="st-sub" aria-hidden="true">·</span>');}
  const cls=[c.mu?'mu':'',c.b?'b':'',c.mono?'mono':''].join(' ');
  const main=`<span class="st-t ${cls}">${c.lock?'🔒 ':''}${stEsc(c.t??'')}</span>`;
  const body=c.s?`<span class="st-ts">${main}<span class="st-sub">${stEsc(c.s)}</span></span>`:main;
  return c.av?`<span class="st-av-row"><span class="st-av" style="background:hsl(${[...String(c.t)].reduce((a,ch)=>a+ch.charCodeAt(0),0)%360} 30% 45%)">${stIni(c.t)}</span>${body}</span>`:body;
}
function stField(r,i,ro,key){
  const [label,T,val,x={}]=r, id=`st-f-${key}-${i}`, dis=ro||x.lock?'disabled':'';
  const store=stStore(id),ed=id in store?store[id]:stSaved[id];
  let ctl='';
  if(T==='text'||T==='secret')ctl=`<input class="st-in" id="${id}" type="${T==='secret'?'password':'text'}" value="${stEsc(ed??val)}" ${dis} data-st-edit>`;
  else if(T==='area')ctl=`<textarea class="st-in st-area" id="${id}" ${dis} data-st-edit>${stEsc(ed??val)}</textarea>`;
  else if(T==='select'){const src=(window.BST.selectOpts||{})[label],live=typeof src==='function'?src():Array.isArray(src)?src:null,base=live&&!live.includes(val)?live[0]:val,cur=ed??base,opts=[...new Set([...(live||ST_SELECT_OPTS[label]||[]),base,cur].filter(o=>o!=null&&o!==''))];ctl=`<select class="st-in st-sel" id="${id}" ${dis} data-st-edit data-st-label="${stEsc(label)}">${opts.map(o=>`<option ${o===cur?'selected':''}>${stEsc(o)}</option>`).join('')}</select>`;}
  else if(T==='toggle'){const on=ed??!!val;ctl=`<button type="button" class="st-toggle ${on?'on':''}" id="${id}" role="switch" aria-checked="${on}" aria-label="${stEsc(label)}" ${dis} data-st-toggle data-st-edit><span></span></button><span class="st-sub">${stEsc(x.v??(on?'On':'Off'))}</span>`;}
  else if(T==='radio'){const sel=ed??x.sel??0;ctl=`<span class="st-radio" role="radiogroup" aria-label="${stEsc(label)}">${val.map((o,j)=>`<button type="button" role="radio" aria-checked="${j===sel}" class="${j===sel?'on':''}" data-st-radio="${id}" data-i="${j}" ${dis}>${stEsc(o)}</button>`).join('')}</span>`;}
  else if(T==='chips'){
    const editable=!ro&&val.some(v=>Array.isArray(v)&&v[1]==='out');
    const items=ed??val.filter(v=>!(Array.isArray(v)&&v[1]==='out'));
    const addLabel=(val.find(v=>Array.isArray(v)&&v[1]==='out')||[])[0]||'+ Add';
    ctl=`<span class="st-chips">${items.map((v,j)=>{const [t,tn]=Array.isArray(v)?v:[v,'neu'];return `<span class="st-chip t-${stTone(tn)}">${stEsc(t)}${editable?`<button type="button" class="st-chip-x" aria-label="Remove ${stEsc(t)}" data-st-chipdel="${id}" data-i="${j}">×</button>`:''}</span>`;}).join('')}${editable?`<input class="st-chip-in" id="${id}" placeholder="${stEsc(addLabel)}" aria-label="Add to ${stEsc(label)}" data-st-chipadd>`:''}</span>`;
  }
  else if(T==='upload')ctl=`<span class="st-upload"><span class="st-logo">${stEsc(val)}</span>${ro?'':'<button type="button" class="st-link" data-st-go="s:Choose a PNG or SVG to upload">Replace</button>'}</span>`;
  else if(T==='stepper')ctl=`<span class="st-stepper"><button type="button" ${dis} data-st-step="${-(x.step||1)}" data-for="${id}" aria-label="Decrease ${stEsc(label)}">−</button><input class="st-in" id="${id}" value="${stEsc(ed??val)}" ${dis} data-st-edit><button type="button" ${dis} data-st-step="${x.step||1}" data-for="${id}" aria-label="Increase ${stEsc(label)}">+</button></span>`;
  else if(T==='button')ctl=`<button type="button" class="btn-ghost" ${dis} data-st-go="${stEsc(x.go||ST_LINKS[val]||'s:'+val)}">${stEsc(val)}</button>`;
  else ctl=`<span class="st-static ${x.b?'b':''}">${typeof val==='object'&&val?stCell(val):stEsc(val)}</span>`;
  return `<div class="st-frow">
    <div class="st-lbl"><label for="${id}">${stEsc(label)}</label>${x.s?`<span class="st-sub">${stEsc(x.s)}</span>`:''}</div>
    <div class="st-ctl">${ctl}${x.chip?stChip(x.chip):''}${x.h?`<span class="st-hint ${x.hw?'warn':''}">${stEsc(x.h)}</span>`:''}</div>
  </div>`;
}
function stBlock(b,bi,ro,key){
  const span=`style="grid-column:span ${b.span||12}"`;
  const head=b.title&&b.k!=='note'?`<div class="st-bh"><div><h3>${stEsc(b.title)}</h3>${b.desc?`<div class="st-sub">${stEsc(b.desc)}</div>`:''}</div>${b.link?`<button type="button" class="st-link" data-st-go="${stEsc(stTarget(b.link))}" ${ro?'disabled':''}>${stEsc(b.link[0])}</button>`:''}</div>`:'';
  const dim=ro&&(b.k==='fields'||b.k==='table')&&!b.keep?' ro':'';
  if(b.k==='note')return `<div class="st-note t-${b.tone==='out'?'out':stTone(b.tone)}" ${span}>${b.nt?`<b>${stEsc(b.nt)}</b>`:''}${b.text?`<div>${stEsc(b.text)}</div>`:''}${(b.items||[]).length?`<ul>${b.items.map(t=>`<li>${stEsc(t)}</li>`).join('')}</ul>`:''}${b.act?`<button type="button" class="st-link" data-st-go="${stEsc(b.act[1])}">${stEsc(b.act[0])}</button>`:''}</div>`;
  if(b.k==='fields')return `<section class="st-card${dim}" ${span}>${head}${b.rows.map((r,i)=>stField(r,i,ro,key+'-'+bi)).join('')}</section>`;
  if(b.k==='table'){
    const right=i=>(b.ra||[]).includes(i)?' r':'';
    const gc=b.gc||`repeat(${b.cols.length},minmax(0,1fr))`;
    const cellRo=ro&&!b.keep;
    // Filters only render when they match a column, so every visible control works.
    const fcol=f=>b.cols.findIndex(c=>c&&(c===f||c.startsWith(f)||f.startsWith(c)));
    const filters=(b.filters||[]).map(f=>Array.isArray(f)?f[0]:f).map(f=>[f,fcol(f.replace(/^Record: .*/,'Record'))]).filter(([,i])=>i>=0);
    const tools=b.search||filters.length?`<div class="st-tools">${b.search?`<input type="search" class="st-search" placeholder="${stEsc(b.q?'Search':b.search)}" ${b.q?`value="${stEsc(b.search)}"`:''} aria-label="${stEsc(b.title||'Search this table')}" data-st-search>`:''}${filters.map(([f,i])=>`<span class="st-filter-w"><button type="button" class="st-filter" data-st-filter="${i}" data-label="${stEsc(f)}" aria-haspopup="listbox" aria-expanded="false">${stEsc(f)} ⌄</button></span>`).join('')}</div>`:'';
    return `<section class="st-card${dim}" ${span}>${head}${tools}<div class="st-table" role="table"><div class="st-tr st-th" role="row" style="grid-template-columns:${gc}">${b.cols.map((c,i)=>`<span role="columnheader" class="${right(i)}">${stEsc(c)}</span>`).join('')}</div>
      ${b.rows.map((r,ri)=>{const o=Array.isArray(r)?{c:r}:r;return `<div class="st-tr ${o.hl?'hl':''} ${o.sel?'sel':''} ${o.dim?'dim':''} ${o.go?'go':''}" role="row" style="grid-template-columns:${gc}"${stLinkAttr(o.go)}${o.go?' tabindex="0"':''}>${o.c.map((c,i)=>`<span role="cell" class="${right(i)}">${stCell(c,`st-t-${key}-${bi}-${ri}-${i}`,cellRo)}</span>`).join('')}</div>`;}).join('')}
      <div class="st-tr st-tempty" role="row" hidden><span role="cell" class="st-sub">No rows match</span></div>
      ${b.foot?`<div class="st-tr st-tf" role="row" style="grid-template-columns:${gc}">${b.foot.map((t,i)=>`<span class="${right(i)}">${stEsc(t)}</span>`).join('')}</div>`:''}</div></section>`;
  }
  if(b.k==='stats')return `<section class="st-card" ${span}>${head}<div class="st-stats" style="grid-template-columns:repeat(${b.items.length},minmax(0,1fr))">${b.items.map(m=>`<div class="st-stat"><div class="st-sub">${stEsc(m.l)}</div><div class="st-sv ${m.vt?'t-'+m.vt:''}">${stEsc(m.v)}</div>${m.m!=null?`<div class="st-meter"><span class="t-${m.mt||'pri'}" style="width:${Math.min(100,m.m*100)}%"></span></div>`:''}${m.s?`<div class="st-sub">${stEsc(m.s)}</div>`:''}${m.chip?stChip(m.chip):''}</div>`).join('')}</div></section>`;
  if(b.k==='cards')return `<section class="st-card" ${span}>${head}<div class="st-cards">${b.items.map(c=>`<div class="st-ic ${c.dim?'dim':''}"><div class="st-ic-top"><span class="st-logo">${stEsc(c.logo||stIni(c.t))}</span><div><div class="st-t b">${stEsc(c.t)}</div>${c.s?`<div class="st-sub">${stEsc(c.s)}</div>`:''}</div></div>${stChip(c.chip||['Not connected','neu'])}${c.meta?`<div class="st-sub">${stEsc(c.meta)}</div>`:''}${c.act?`<button type="button" class="st-link" data-st-go="${stEsc(c.go||ST_LINKS[c.act]||'s:'+c.act)}">${stEsc(c.act)}</button>`:''}</div>`).join('')}</div></section>`;
  if(b.k==='bars'){const mx=Math.max(...b.items.map(x=>x[1]));return `<section class="st-card" ${span}>${head}${b.items.map(([l,v])=>`<div class="st-bar"><span>${stEsc(l)}</span><span class="st-bar-t"><span style="width:${v/mx*100}%"></span></span><span class="r">${v.toLocaleString('en-GB')}</span></div>`).join('')}</section>`;}
  if(b.k==='chart'){
    const max=b.ceil*1.08,X=i=>(i*600/(b.days-1)).toFixed(1),Y=v=>(150-v/max*146).toFixed(1),last=b.pts.length-1,rate=b.pts[last]/Math.max(1,last);
    const pts=b.pts.map((v,i)=>`${X(i)},${Y(v)}`).join(' '),proj=[last,b.days-1].map(i=>`${X(i)},${Y(Math.min(max,b.pts[last]+rate*(i-last)))}`).join(' ');
    return `<section class="st-card" ${span}>${head}<svg class="st-chart" viewBox="0 0 600 150" preserveAspectRatio="none" aria-label="${stEsc(b.title||'Usage chart')}"><line x1="0" x2="600" y1="${Y(b.ceil)}" y2="${Y(b.ceil)}" class="ceil"/><polyline points="${pts}" class="line"/><polyline points="${proj}" class="proj"/></svg><div class="st-xl">${(b.xl||[]).map(t=>`<span>${stEsc(t)}</span>`).join('')}<span class="st-sub">${stEsc(b.ceilLabel||'Pool')}</span></div></section>`;
  }
  if(b.k==='custom')return `<section class="st-card" ${span}>${head}${b.render(ro)}</section>`;
  if(b.k==='empty'||b.k==='error')return `<section class="st-card st-empty ${b.k}" ${span}><div class="st-t b">${stEsc(b.et)}</div><div class="st-sub">${stEsc(b.ex)}</div>${b.act?`<button type="button" class="btn-ghost" data-st-go="${stEsc(b.act[1])}">${stEsc(b.act[0])}</button>`:''}</section>`;
  return '';
}
function stNavHtml(nav){
  const item=([k,l])=>`<button type="button" class="st-rail-i ${nav===k?'on':''}" data-st-go="p:${k}" ${nav===k?'aria-current="page"':''}>${stEsc(l)}</button>`;
  const acc=ST_NAV_ACC.filter(([k])=>stAccess(k));
  return `<nav class="st-rail" aria-label="Settings sections">${acc.length?`<div class="st-rail-h">Account</div>${acc.map(item).join('')}`:''}<div class="st-rail-h">Personal</div>${ST_NAV_PER.map(item).join('')}</nav>`;
}
function stDialogHtml(){
  const d=window.BST.dialogs[stDlg]; if(!d)return '';
  return `<div class="st-scrim" data-st-close></div><div class="st-dlg" role="dialog" aria-modal="true" aria-labelledby="st-dlg-t" style="max-width:${d.w||520}px">
    ${d.step?`<div class="st-sub">${stEsc(d.step)}</div>`:''}
    <div class="st-dlg-h"><h2 id="st-dlg-t">${stEsc(d.t)}</h2><button type="button" class="st-x" aria-label="Close" data-st-close>×</button></div>
    ${d.d?`<div class="st-sub" style="margin-bottom:12px">${stEsc(d.d)}</div>`:''}
    <div class="st-grid">${(d.b||[]).map((b,i)=>stBlock(b,i,false,'dlg-'+stDlg)).join('')}</div>
    <div class="st-dlg-f">${d.chip?stChip([d.chip,'neu']):''}<button type="button" class="btn-ghost" data-st-close>${stEsc(d.cancel||'Cancel')}</button><button type="button" class="${d.danger?'btn-danger':'btn-primary'}" data-st-ok>${stEsc(d.ok||'Done')}</button></div>
  </div>`;
}
// Variant pages (team-invited, credits-low, plan/homes-after…) light up the tab they belong to.
function stTabOn(P,k){return stPage===k||P.tab===k||(stPage.startsWith(k+'-')&&!P.tabs.some(([,o])=>o===stPage));}
function stRender(){
  const root=document.getElementById('st-root'); if(!root||!window.BST)return;
  let P=window.BST.pages[stPage]||window.BST.pages.company;
  if(!stAccess(P.nav)){stPage='me';P=window.BST.pages.me;}
  const acc=stAccess(P.nav), ro=acc==='v';
  const bans=[...(ro?[{tone:'neu',text:'You can view this page. The account owner and admins can change it.'}]:[]),...(P.ban||[])];
  const menu=(P.menu||[]).filter(m=>!m.ownerOnly||stRole()==='owner');
  // Tabbed pages: the top header carries the section; the selected tab's title, description, buttons and Actions sit under the tabs.
  const H={tabbed:!!P.tabs};
  const acts=P.sub?.acts||P.acts||[];
  H.controls=`${acts.map(a=>`<button type="button" class="btn-primary" data-st-go="${stEsc(stTarget(a))}" ${ro?'disabled':''}>${stEsc(a[0])}</button>`).join('')}${menu.length?`<span class="st-menu-w"><button type="button" class="btn-ghost" aria-haspopup="menu" aria-expanded="${stMenuOpen}" data-st-menu>Actions ⌄</button>${stMenuOpen?`<span class="st-menu" role="menu">${menu.map(m=>`<button type="button" role="menuitem" class="${m[2]==='danger'?'danger':''}" data-st-go="${stEsc(stTarget(m))}" ${ro&&m[0]!=='History'?'disabled':''}>${stEsc(m[0])}</button>`).join('')}</span>`:''}</span>`:''}`;
  if(H.tabbed){
    const firstKey=P.tabs[0][1],active=P.tabs.find(([,k])=>stTabOn(P,k))||P.tabs[0];
    const first=window.BST.pages[firstKey];
    H.secD=window.BST.sectionDesc?.[firstKey]??(first&&first.t===P.t?first.d:P.d);
    H.subT=P.sub?.t||active[0];
    H.subD=P.sub?.d??window.BST.tabDesc?.[active[1]]??(P.d&&P.d!==H.secD?P.d:'');
  }else H.secD=P.d;
  root.innerHTML=`<div class="st-shell">${stNavHtml(P.nav)}
    <div class="st-main">
      ${P.back?`<button type="button" class="st-back" data-st-go="${P.back[1].includes(':')?P.back[1]:'p:'+P.back[1]}">‹ ${stEsc(P.back[0])}</button>`:''}
      <div class="crm-page-heading st-head">
        <div><div class="page-title">${stEsc(P.t)}</div>${H.secD?`<div class="page-sub">${stEsc(H.secD)}</div>`:''}</div>
        ${H.tabbed?'':`<div class="st-head-acts">${H.controls}</div>`}
      </div>
      ${H.tabbed?`<div class="tabs st-tabs">${P.tabs.map(([l,k])=>`<button type="button" class="tab ${stTabOn(P,k)?'on':''}" data-st-go="p:${k}">${stEsc(l)}</button>`).join('')}</div>
      <div class="st-subhead"><div class="st-subhead-t"><h2>${stEsc(H.subT)}</h2>${H.subD?`<p>${stEsc(H.subD)}</p>`:''}</div>${H.controls.trim()?`<div class="st-subhead-acts">${H.controls}</div>`:''}</div>`:''}
      ${bans.map(n=>`<div class="st-note t-${stTone(n.tone)}">${n.title?`<b>${stEsc(n.title)}</b>`:''}<div>${stEsc(n.text)}</div>${n.act?`<button type="button" class="st-link" data-st-go="${stEsc(n.act[1])}">${stEsc(n.act[0])}</button>`:''}</div>`).join('')}
      <div class="st-grid">${(P.b||[]).map((b,i)=>stBlock(b,i,ro,stPage)).join('')}</div>
      ${stDirty?ST_SAVEBAR:''}
    </div></div>${stDlg?stDialogHtml():''}`;
  if(stDlg){const dlg=root.querySelector('.st-dlg');(dlg.querySelector('input:not([disabled]),textarea:not([disabled]),select:not([disabled])')||dlg.querySelector('[data-st-ok]'))?.focus();}
}
function stOnNav(page){if(page==='settings'){stDlg=null;stMenuOpen=false;stRender();}}
const ST_SAVEBAR='<div class="st-savebar" role="region" aria-label="Unsaved changes"><span>Unsaved changes</span><button type="button" class="btn-ghost" data-st-discard>Discard</button><button type="button" class="btn-primary" data-st-save>Save changes</button></div>';
// Dialog fields keep their own scratch state so typing in a dialog never marks the page dirty.
const stDlgEdits={};
function stStore(id){return /^st-[ft]-dlg-/.test(id)?stDlgEdits:stEdits;}
function stRecord(id,value){const store=stStore(id);store[id]=value;if(store===stEdits)stMarkDirty();}
// Marks the page dirty without re-rendering, so in-place edits (inputs, table toggles) are kept.
function stMarkDirty(){stDirty=true;const main=document.querySelector('#st-root .st-main');if(main&&!main.querySelector('.st-savebar'))main.insertAdjacentHTML('beforeend',ST_SAVEBAR);}
function stLabelOf(id){return document.getElementById(id)?.closest('.st-frow')?.querySelector('.st-lbl label')?.textContent.trim();}
// Saves that touch live records confirm first (e.g. hold expiry: running holds keep their old expiry).
const ST_CONFIRM_SAVE={'Hold expires after':'hold'};
function stSave(){
  // Pages can ask for a confirmation that summarises the change (e.g. permissions and who they affect).
  const hook=!stSave.confirmed&&(window.BST.beforeSaveHooks||[]).map(h=>h(stEdits)).find(Boolean);
  if(hook){stPendingGo=()=>{stSave.confirmed=true;stSave();stSave.confirmed=false;};stDlg=hook;stRender();return;}
  for(const id of Object.keys(stEdits)){
    const dlg=ST_CONFIRM_SAVE[stLabelOf(id)],d=dlg&&window.BST.dialogs[dlg];
    if(d&&!stSave.confirmed){
      if(dlg==='hold'){d.t=`Change hold expiry to ${stEdits[id]}?`;d.done=`Hold expiry is ${stEdits[id]} for new holds.`;}
      stPendingGo=()=>{stSave.confirmed=true;stSave();stSave.confirmed=false;};
      stDlg=dlg;stRender();return;
    }
  }
  // After-save hooks get each change with its field label (read before the page re-renders).
  const changes=Object.keys(stEdits).map(id=>({id,label:stLabelOf(id),value:stEdits[id]}));
  Object.assign(stSaved,stEdits);stClearEdits();stDirty=false;
  (window.BST.afterSaveHooks||[]).forEach(h=>h(changes));
  stRender();
  if(!stSave.confirmed)showToast('Saved. Changes apply to new records; the change is in the audit log.');
}
function stDialogValues(){
  const vals={};
  document.querySelectorAll('#st-root .st-dlg .st-frow').forEach(row=>{
    const label=row.querySelector('.st-lbl label')?.textContent.trim(),ctl=row.querySelector('.st-ctl');
    if(!label||!ctl)return;
    const radio=ctl.querySelector('[role="radio"].on'),input=ctl.querySelector('input:not(.st-chip-in),textarea,select'),toggle=ctl.querySelector('[role="switch"]');
    vals[label]=radio?radio.textContent.trim():toggle?toggle.getAttribute('aria-checked')==='true':input?input.value.trim():[...ctl.querySelectorAll('.st-chip')].map(c=>c.firstChild?.textContent.trim());
  });
  return vals;
}
function stCloseDialog(){
  stDlg=null;stPendingGo=null;Object.keys(stDlgEdits).forEach(k=>delete stDlgEdits[k]);
  const cancel=stPendingCancel;stPendingCancel=null;if(cancel)cancel();
  stRender();
}
function stConfirmDialog(){
  const key=stDlg,d=window.BST.dialogs[key];
  if(d?.run){const res=d.run(stDialogValues());if(res===false)return;}
  const then=stPendingGo;stPendingGo=null;stPendingCancel=null;Object.keys(stDlgEdits).forEach(k=>delete stDlgEdits[k]);
  if(d?.next&&window.BST.dialogs[d.next]){stDlg=d.next;stRender();return;}
  stDlg=null;
  if(then){then();if(key!=='leave'&&d?.done)showToast(d.done);return;}
  stRender();if(key!=='leave')showToast(typeof d?.done==='function'?d.done():d?.done||'Done');
}
// Table search + column filters work on the rendered rows, so they compose with any table in the data.
function stApplyTable(card){
  const q=(card.querySelector('[data-st-search]')?.value||'').trim().toLowerCase();
  const active=[...card.querySelectorAll('[data-st-filter][data-value]')].map(b=>[+b.dataset.stFilter,b.dataset.value]);
  let shown=0;
  card.querySelectorAll('.st-tr:not(.st-th):not(.st-tf):not(.st-tempty)').forEach(row=>{
    const cells=[...row.children];
    const ok=(!q||row.textContent.toLowerCase().includes(q))&&active.every(([i,v])=>stCellText(cells[i]).includes(v));
    row.hidden=!ok;if(ok)shown++;
  });
  const empty=card.querySelector('.st-tempty');if(empty)empty.hidden=shown>0;
}
function stCellText(cell){return cell?(cell.querySelector('.st-t,.st-chip')?.textContent||cell.textContent).trim():'';}
function stFilterMenu(btn){
  const open=btn.parentElement.querySelector('.st-fmenu');
  document.querySelectorAll('#st-root .st-fmenu').forEach(m=>{m.previousElementSibling?.setAttribute('aria-expanded','false');m.remove();});
  if(open)return;
  const card=btn.closest('.st-card'),i=+btn.dataset.stFilter;
  const values=[...new Set([...card.querySelectorAll('.st-tr:not(.st-th):not(.st-tf):not(.st-tempty)')].map(r=>stCellText(r.children[i])).filter(v=>v&&v!=='—'))].sort();
  btn.insertAdjacentHTML('afterend',`<span class="st-fmenu" role="listbox">${['',...values].map(v=>`<button type="button" role="option" aria-selected="${(btn.dataset.value||'')===v}" data-st-fval="${stEsc(v)}">${v?stEsc(v):'Any'}</button>`).join('')}</span>`);
  btn.setAttribute('aria-expanded','true');
}
document.addEventListener('click',e=>{
  const root=document.getElementById('st-root'); if(!root||!root.contains(e.target)){if(stMenuOpen&&root){stMenuOpen=false;stRender();}return;}
  if(!e.target.closest('.st-filter-w,.pm-w'))document.querySelectorAll('#st-root .st-fmenu').forEach(m=>m.remove());
  const t=e.target.closest('[data-st-go],[data-st-menu],[data-st-close],[data-st-ok],[data-st-toggle],[data-st-chan],[data-st-radio],[data-st-step],[data-st-save],[data-st-discard],[data-st-filter],[data-st-fval],[data-st-chipdel]');
  if(!t){if(stMenuOpen){stMenuOpen=false;stRender();}return;}
  if(t.disabled)return;
  if(t.dataset.stMenu!==undefined){stMenuOpen=!stMenuOpen;stRender();return;}
  if(t.dataset.stClose!==undefined){stCloseDialog();return;}
  if(t.dataset.stOk!==undefined){stConfirmDialog();return;}
  if(t.dataset.stSave!==undefined){stSave();return;}
  if(t.dataset.stDiscard!==undefined){stDirty=false;stClearEdits();stRender();return;}
  if(t.dataset.stFilter!==undefined){stFilterMenu(t);return;}
  if(t.dataset.stFval!==undefined){const btn=t.closest('.st-filter-w').querySelector('[data-st-filter]'),v=t.dataset.stFval;if(v){btn.dataset.value=v;btn.textContent=`${btn.dataset.label}: ${v} ⌄`;btn.classList.add('on');}else{delete btn.dataset.value;btn.textContent=`${btn.dataset.label} ⌄`;btn.classList.remove('on');}t.parentElement.remove();btn.setAttribute('aria-expanded','false');stApplyTable(btn.closest('.st-card'));return;}
  if(t.dataset.stToggle!==undefined){const on=!t.classList.contains('on');t.classList.toggle('on',on);t.setAttribute('aria-checked',String(on));if(t.id){const s=t.nextElementSibling;if(s&&s.classList.contains('st-sub'))s.textContent=on?'On':'Off';stRecord(t.id,on);}return;}
  if(t.dataset.stChan!==undefined){const on=!t.classList.contains('on');t.classList.toggle('on',on);t.setAttribute('aria-pressed',String(on));stRecord(t.id,on);return;}
  if(t.dataset.stChipdel){const id=t.dataset.stChipdel,inp=document.getElementById(id),chips=[...inp.parentElement.querySelectorAll('.st-chip')].map(c=>c.firstChild.textContent.trim());chips.splice(+t.dataset.i,1);stRecord(id,chips);stRender();document.getElementById(id)?.focus();return;}
  if(t.dataset.stRadio){stRecord(t.dataset.stRadio,+t.dataset.i);stRender();return;}
  if(t.dataset.stStep){const inp=document.getElementById(t.dataset.for),n=parseInt(String(inp.value).replace(/[^\d-]/g,''),10)||0,suffix=String(inp.value).replace(/^[\d\s-]+/,'');inp.value=`${Math.max(0,n+(+t.dataset.stStep))}${suffix?(suffix.startsWith(' ')?'':' ')+suffix.trim():''}`;stRecord(inp.id,inp.value);return;}
  if(t.dataset.stGo){stGo(t.dataset.stGo);}
});
document.addEventListener('input',e=>{
  const t=e.target;if(!t.matches)return;
  if(t.matches('#st-root [data-st-search]')){stApplyTable(t.closest('.st-card'));return;}
  if(t.matches('#st-root [data-st-edit]'))stRecord(t.id,t.value);
});
document.addEventListener('change',e=>{
  const t=e.target;if(!t.matches||!t.matches('#st-root select[data-st-label]'))return;
  const dlg=ST_CONFIRM_CHANGE[t.dataset.stLabel],d=dlg&&window.BST.dialogs[dlg];
  const original=t.querySelector('option[selected]')?.value;
  if(!d||t.value===original)return;
  if(dlg==='retention'){
    const years=v=>(String(v).match(/(\d+) years?/)||[])[1];
    d.b[0].items[0].v=`${years(original)} years`;d.b[0].items[1].v=`${years(t.value)} years`;
    d.done=`Retention changed. Audit row written: ${years(original)} years → ${years(t.value)} years.`;
  }
  const id=t.id,saved=stSaved[id];
  stPendingGo=()=>{stSaved[id]=t.value;delete stEdits[id];if(!Object.keys(stEdits).length)stDirty=false;stRender();};
  stPendingCancel=()=>{delete stEdits[id];if(saved!==undefined)stSaved[id]=saved;if(!Object.keys(stEdits).length)stDirty=false;};
  stDlg=dlg;stRender();
});
document.addEventListener('keydown',e=>{
  const t=e.target;
  if(t.matches&&t.matches('#st-root [data-st-chipadd]')&&e.key==='Enter'){
    e.preventDefault();const v=t.value.trim();if(!v)return;
    const chips=[...t.parentElement.querySelectorAll('.st-chip')].map(c=>c.firstChild.textContent.trim());
    if(chips.some(c=>c.toLowerCase()===v.toLowerCase())){showToast(`${v} is already added`);return;}
    stRecord(t.id,[...chips,v]);stRender();document.getElementById(t.id)?.focus();return;
  }
  if(t.matches&&t.matches('#st-root .st-tr.go')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();stGo(t.dataset.stGo);return;}
  if(e.key==='Escape'){
    if(document.querySelector('#st-root .st-fmenu')){document.querySelectorAll('#st-root .st-fmenu').forEach(m=>m.remove());return;}
    if(stDlg){stCloseDialog();return;}
    if(stMenuOpen){stMenuOpen=false;stRender();}
  }
  if(e.key==='Tab'&&stDlg){
    const f=[...document.querySelectorAll('#st-root .st-dlg button:not([disabled]),#st-root .st-dlg input:not([disabled]),#st-root .st-dlg select:not([disabled]),#st-root .st-dlg textarea:not([disabled])')];
    if(!f.length)return;
    if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus();}
    else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus();}
  }
});
