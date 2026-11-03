// Lead capture tab on the development hub (hub3 · Bricly Lead Capture v2), rendered natively from lead-capture-data.js.
// The design ships static scenario frames; LC_ROUTES links their buttons and rows so the flow can be clicked through.
const LC_HOME={'Overview':'S01b','Forms':'S02a','Ad lead forms':'S11a','Tracking':'S08a','Log':'S16a'};
const LC_ROUTES={
  'Open the form':'S03a','Registration form':'S03a','Enquiry form':'S07a','Share':'S06b','Done':'S03a','Pause form':'S06d','Resume':'S03a',
  'Send a test lead':'S09a','Run again':'S09a','Open in the log':'S16b','Publish changes':'S06a','Publish':'S06b',
  'New':'S02c','Create variant':'S02a','Switch to one step':'S03d','Switch to two steps':'S03a','Open Brand':'S04a',
  'New tracked link':'S08c','Create link':'S08a','Archived (2)':'S08b','Open tracking settings':'S08a',
  'Add':'S12a','Continue to mapping':'S13a','Go live':'S11a','Save for later':'S11a','Save mapping':'S11a','Listen for a test lead':'S09c','Listen again':'S09c',
  'Stop listening':'S11a','Check the connection':'S11a','Recommended question sheet':'S15a','Add a Google form':'S14b','Regenerate key':'S14c','Regenerate':'S14a','Keep the current key':'S14a',
  'Map the question':'S13d','Open the log':'S16d','Dismiss':'S13a','Replay mapping':'S16b',
  'Open Settings, Integrations':'@settings','Reconnect':'@settings','Reconnect in Settings':'@settings','Open opportunity':'@pipeline',
};
const LC_TOAST={'Export CSV':'Exporting the capture log as CSV','Download QR code':'QR code downloaded','Copy all as text':'Question sheet copied','Copy':'Copied',
  'Send a test event':'Test event sent','Discard':'Discarded','Release':'Lead released','Retry':'Capture retried','Check again':'Connection checked',
  'Done':'Done','Create link':'Tracked link created','Publish':'Registration form published','Go live':'Ad form is live','Create variant':'Variant created'};
const LC_INK='rgb(25,25,25)';
let lcScn=null;
function lcEsc(v){return typeof xesc==='function'?xesc(String(v??'')):String(v??'');}
function lcDev(){return typeof dvCur!=='undefined'&&dvCur?dvCur:{name:'La Lex'};}
function lcTxt(v){return lcEsc(v).replaceAll('La Lex',lcEsc(lcDev().name));}
function lcBtn(x,size){
  const ink=x.bg===LC_INK, h=size==='lg'?28:size==='sm'?24:26;
  return `<button type="button" class="lc-btn ${ink?'ink':''}" data-lc="${lcEsc(x.t)}" style="height:${h}px;${ink?'':`background:${x.bg};color:${x.fg};`}box-shadow:inset 0 0 0 1px ${ink?'transparent':x.bd}">${lcTxt(x.t)}</button>`;
}
function lcChip(c){return c&&c.t?`<span class="lc-chip" style="background:${c.bg};color:${c.fg}">${lcTxt(c.t)}</span>`:'';}
function lcBlock(b){
  let h='';
  if(b.hasHead)h+=`<div class="lc-bh"><span class="lc-bt">${lcTxt(b.title)}</span><span class="lc-bs">${lcTxt(b.sub)}</span>${b.hasChip?lcChip(b.chip):''}${b.right?`<button type="button" class="lc-right" data-lc="${lcEsc(b.right)}" style="color:${b.rfg};height:${b.rh};padding:${b.rpad};background:${b.rbg};box-shadow:inset 0 0 0 1px ${b.rbd}">${lcTxt(b.right)}</button>`:''}</div>`;
  if(b.isKpis)h+=`<div class="lc-kpis" style="grid-template-columns:${b.kcols}">${b.items.map(k=>`<div><span class="lc-mu">${lcTxt(k.label)}</span><span class="lc-kv">${lcTxt(k.val)}</span><div class="lc-row">${k.hasChip?lcChip(k.chip):''}<span class="lc-mu s">${lcTxt(k.sub)}</span></div></div>`).join('')}</div>`;
  if(b.isTable)h+=`<div class="lc-tbl"><div class="lc-tr th" style="grid-template-columns:${b.cols}">${b.head.map(x=>`<span>${lcTxt(x)}</span>`).join('')}</div>${b.rows.map(r=>`<div class="lc-tr" data-lc-row="${lcEsc((r.cells[0]||{}).t||'')}" style="grid-template-columns:${b.cols};background:${r.bg}">${r.cells.map(c=>`<div class="lc-cell">${c.plain?`<span style="color:${c.fg===LC_INK?'inherit':c.fg};font-weight:${c.fw}">${lcTxt(c.t)}</span>`:''}${c.isChip?lcChip(c.chip):''}${c.hasS?`<span class="lc-mu s">${lcTxt(c.s)}</span>`:''}</div>`).join('')}</div>`).join('')}${b.hasNote?`<div class="lc-note">${lcTxt(b.note)}</div>`:''}</div>`;
  if(b.isCallout)h+=`<div class="lc-callout"><div><b>${lcTxt(b.head2)}</b><span style="color:${b.bodyFg===LC_INK?'inherit':b.bodyFg}">${lcTxt(b.body)}</span></div><div class="lc-row">${(b.btns||[]).map(x=>lcBtn(x)).join('')}</div></div>`;
  if(b.isList)h+=`<div>${b.items.map(l=>`<div class="lc-li ${LC_ROUTES[l.k]?'go':''}" ${LC_ROUTES[l.k]?`data-lc="${lcEsc(l.k)}"`:''} style="border-top:${l.bt};background:${l.bg}">${l.hasIcon?`<span class="lc-ic" style="background:${l.ibg};color:${l.ifg===LC_INK?'var(--on-surface)':l.ifg}">${lcTxt(l.icon)}</span>`:''}<span class="lc-col"><span style="font-weight:${l.fw}">${lcTxt(l.k)}</span>${l.hasV?`<span class="lc-mu">${lcTxt(l.v)}</span>`:''}</span>${l.hasChip?lcChip(l.chip):''}${l.hasR?`<span class="lc-mu r" style="color:${l.rfg}">${lcTxt(l.r)}</span>`:''}${(l.btns||[]).map(x=>lcBtn(x,'sm')).join('')}${l.more?'<span class="lc-more">···</span>':''}</div>`).join('')}</div>`;
  if(b.isSteps)h+=`<div class="lc-steps">${b.items.map(s=>`<div class="lc-step"><span class="lc-n ${s.nbg===LC_INK?'ink':''}" style="${s.nbg===LC_INK?'':`background:${s.nbg};color:${s.nfg};`}box-shadow:inset 0 0 0 1px ${s.nbd}">${lcTxt(s.n)}</span><span class="lc-col"><span style="font-weight:${s.fw}">${lcTxt(s.t)}</span><span class="lc-mu">${lcTxt(s.sub)}</span></span>${s.hasChip?lcChip(s.chip):''}${s.hasBtn?lcBtn(s.btn,'sm'):''}</div>`).join('')}</div>`;
  if(b.isKv)h+=`<div>${b.rows.map(v=>`<div class="lc-kvr" style="grid-template-columns:${b.kw} minmax(0,1fr) auto;border-top:${v.bt};background:${v.bg}"><span class="lc-mu">${lcTxt(v.k)}</span><span class="lc-col"><span style="color:${v.fg===LC_INK?'inherit':v.fg}">${lcTxt(v.v)}</span>${v.hasNote?`<span class="lc-mu">${lcTxt(v.note)}</span>`:''}</span>${v.hasSrc?lcChip(v.src):'<span></span>'}</div>`).join('')}</div>`;
  if(b.isText)h+=`<div class="lc-text">${lcTxt(b.text)}</div>`;
  if(b.isToggles)h+=`<div>${b.items.map(t=>`<div class="lc-tog" style="border-top:${t.bt}"><span class="lc-col"><span>${lcTxt(t.k)}</span>${t.hasV?`<span class="lc-mu">${lcTxt(t.v)}</span>`:''}</span>${t.hasR?`<span class="lc-mu">${lcTxt(t.r)}</span>`:''}<button type="button" class="lc-switch" role="switch" aria-checked="${t.tbg==='var(--primary)'}" aria-label="${lcEsc(t.k)}" data-lc-switch style="background:${t.tbg};opacity:${t.op}"><span style="left:${t.knob}"></span></button></div>`).join('')}</div>`;
  if(b.isRadio)h+=`<div class="lc-radios">${b.items.map(o=>`<div class="lc-radio" style="border-color:${o.bd===LC_INK?'var(--on-surface)':o.bd};background:${o.bg};opacity:${o.op}"><span class="lc-dot" style="border-color:${o.rbd===LC_INK?'var(--on-surface)':o.rbd}"><span style="background:${o.dot===LC_INK?'var(--on-surface)':o.dot}"></span></span><span class="lc-col"><b>${lcTxt(o.k)}</b><span class="lc-mu">${lcTxt(o.v)}</span>${o.hasWhy?`<span class="lc-why">${lcTxt(o.why)}</span>`:''}</span>${o.hasChip?lcChip(o.chip):''}</div>`).join('')}</div>`;
  if(b.isFields)h+=`<div class="lc-fields" style="grid-template-columns:${b.fcols}">${b.items.map(f=>`<div class="lc-f" style="grid-column:${f.span}"><span class="lc-fl"><span>${lcTxt(f.label)}</span><span class="lc-mu">${lcTxt(f.hint)}</span></span><div class="lc-in" style="min-height:${f.h};align-items:${f.al};border-color:${f.bd===LC_INK?'var(--on-surface)':f.bd};color:${f.fg===LC_INK?'inherit':f.fg};background:${f.bg}">${f.hasPre?`<span class="lc-pre">${lcTxt(f.pre)}</span>`:''}<span class="lc-val">${lcTxt(f.val)}</span>${f.isSel?'<span class="lc-mu">⌄</span>':''}${f.hasAct?`<span class="lc-act">${lcTxt(f.act)}</span>`:''}</div>${f.hasHelp?`<span class="lc-help" style="color:${f.helpFg}">${lcTxt(f.help)}</span>`:''}</div>`).join('')}</div>`;
  if(b.isCode)h+=`<div class="lc-code-w">${b.hasTabs?`<div class="lc-row">${b.tabs.map(t=>`<span class="lc-ctab" style="background:${t.bg};color:${t.fg===LC_INK?'inherit':t.fg}">${lcTxt(t.t)}</span>`).join('')}</div>`:''}<div class="lc-code"><span>${lcTxt(b.code)}</span><button type="button" class="lc-btn" data-lc="Copy" style="height:24px">${lcTxt(b.copy)}</button></div>${b.hasNote?`<span class="lc-mu">${lcTxt(b.note)}</span>`:''}</div>`;
  if(b.isMap)h+=`<div class="lc-tbl"><div class="lc-map th"><span>${lcTxt(b.leftHead)}</span><span></span><span>Bricly field</span><span>State</span></div>${b.rows.map(m=>`<div style="border-top:1px solid var(--outline-variant);background:${m.bg}"><div class="lc-map"><span class="lc-col"><span>${lcTxt(m.q)}</span><span class="lc-mu s">${lcTxt(m.qt)}</span></span><span class="lc-mu">→</span><span class="lc-in sel" style="border-color:${m.fbd===LC_INK?'var(--on-surface)':m.fbd};color:${m.ffg===LC_INK?'inherit':m.ffg}"><span class="lc-val">${lcTxt(m.f)}</span><span class="lc-mu">⌄</span></span>${lcChip(m.chip)}</div>${(m.opts||[]).map(o=>`<div class="lc-map opt"><span class="lc-mu">${lcTxt(o.a)}</span><span class="lc-mu">→</span><span style="color:${o.fg===LC_INK?'inherit':o.fg}">${lcTxt(o.b)}</span><span style="color:${o.sfg};font-size:10px">${lcTxt(o.s)}</span></div>`).join('')}</div>`).join('')}</div>`;
  if(b.isBuilder){
    const pv=b.pv;
    h+=`<div class="lc-builder"><div class="lc-bq">${b.groups.map(g=>`<div><div class="lc-gh"><b>${lcTxt(g.t)}</b><span>${lcTxt(g.s)}</span>${g.hasChip?lcChip(g.chip):''}</div>${g.items.map(q=>`<div class="lc-q" style="border-color:${q.bd===LC_INK?'var(--on-surface)':q.bd};background:${q.bg};opacity:${q.op}"><span class="lc-mu">${lcTxt(q.handle)}</span><span class="lc-col"><span>${lcTxt(q.t)}</span><span class="lc-mu s">${lcTxt(q.s)}</span></span>${q.hasReq?lcChip(q.rq):''}<span class="lc-mu s">${lcTxt(q.fills)}</span></div>`).join('')}${g.hasWarn?`<div class="lc-warn">${lcTxt(g.warn)}</div>`:''}<div class="lc-row lc-gb">${(g.btns||[]).map(x=>lcBtn(x)).join('')}</div></div>`).join('')}</div>
      <div class="lc-pv"><div class="lc-row lc-mu" style="justify-content:space-between"><span>Preview · ${lcTxt(pv.step)}</span><span>Mobile · Desktop</span></div><div class="lc-pvcard"><span class="lc-serif">${lcTxt(lcDev().name)}</span><b>${lcTxt(pv.head)}</b><span class="lc-mu">${lcTxt(pv.intro)}</span>${pv.fields.map(f=>`<div class="lc-col"><span class="s">${lcTxt(f.l)}</span>${f.isInput?`<span class="lc-pvin">${lcTxt(f.ph)}</span>`:''}${f.isChoice?`<div class="lc-row" style="flex-wrap:wrap">${f.opts.map(o=>`<span class="lc-pvopt">${lcTxt(o)}</span>`).join('')}</div>`:''}</div>`).join('')}<span class="lc-pvbtn" style="background:${pv.accent}">${lcTxt(pv.btn)}</span></div></div></div>`;
  }
  if(b.hasBtns)h+=`<div class="lc-bbtns" style="justify-content:${b.bAlign}">${b.btns.map(x=>lcBtn(x,'lg')).join('')}</div>`;
  return h;
}
function lcOverlayHtml(o){
  return `<div class="lc-scrim" data-lc="×"></div><div class="lc-ov ${o.kind==='drawer'?'drawer':''}" role="dialog" aria-modal="true" aria-label="${lcEsc(o.title)}" style="${o.kind==='drawer'?'':`width:min(${o.w||'560px'},calc(100vw - 32px))`}">
    <div class="lc-ovh"><div class="lc-col"><b>${lcTxt(o.title)}</b><span class="lc-mu">${lcTxt(o.sub)}</span></div><button type="button" class="lc-x" aria-label="Close" data-lc="×">×</button></div>
    <div class="lc-ovb">${(o.blocks||[]).map(b=>`<div class="lc-ovblk">${lcBlock({...b,hasHead:!!b.title})}</div>`).join('')}</div>
    <div class="lc-ovf">${(o.btns||[]).map(x=>lcBtn(window.LCD.btn(x),'lg')).join('')}</div></div>`;
}
function lcHtml(){
  const S=window.LCD.SCN, c=S[lcScn]||S.S01b;
  const rail=window.LCD.RAIL.map(t=>`<button type="button" class="lc-rail-i ${t===c.rail?'on':''}" data-lc-rail="${t}" ${t===c.rail?'aria-current="page"':''}><span>${t}</span>${c.railN&&c.railN[t]?`<span class="lc-railn">${c.railN[t]}</span>`:''}</button>`).join('');
  const crumbs=c.crumbs&&c.crumbs.length>3?`<div class="lc-crumbs">${c.crumbs.slice(2).map((t,i,a)=>i<a.length-1?`<button type="button" data-lc-rail="${c.rail}">${lcTxt(t)}</button><span>/</span>`:`<span class="cur">${lcTxt(t)}</span>`).join('')}</div>`:'';
  return `${c.topBanner?`<div class="lc-banner" style="background:${c.topBanner.bg};color:${c.topBanner.fg}"><b>${lcTxt(c.topBanner.t)}</b><span>${lcTxt(c.topBanner.s)}</span><button type="button" data-lc="${lcEsc(c.topBanner.a)}">${lcTxt(c.topBanner.a)}</button></div>`:''}
  <div class="lc-root"><nav class="lc-rail" aria-label="Lead capture">${rail}</nav><div class="lc-main">${crumbs}${(c.panes||[]).map(p=>`<div class="lc-pane" style="grid-column:${p.gc}">
    ${p.hasHead?`<div class="lc-ph"><div class="lc-col"><div class="lc-row"><span class="lc-pt">${lcTxt(p.title)}</span>${p.hasSt?lcChip(p.st):''}</div><span class="lc-mu">${lcTxt(p.sub)}</span></div><div class="lc-row">${p.btns.map(x=>lcBtn(x)).join('')}</div></div>`:''}
    ${(p.blocks||[]).map(b=>`<div class="lc-card" style="background:${b.cardBg};border-color:${b.cardBd}">${lcBlock(b)}</div>`).join('')}</div>`).join('')}</div></div>
  ${c.ov?lcOverlayHtml(c.ov):''}`;
}
function lcRender(){const host=document.getElementById('lc-host');if(host)host.innerHTML=lcHtml();}
function lcOpen(scn){lcScn=scn;lcRender();}
function lcBase(){const c=window.LCD.SCN[lcScn]||{};return LC_HOME[c.rail]||'S01b';}
function lcTabHtml(){if(!lcScn||!window.LCD.SCN[lcScn])lcScn='S01b';return `<div id="lc-host">${lcHtml()}</div>`;}
function lcAction(label){
  const route=LC_ROUTES[label];
  if(label==='×'||label==='Cancel'||label==='Close'||label==='Not yet'||label==='Keep connected'){lcOpen(lcBase());return;}
  if(label==='Preview'||label==='Preview as a buyer'||label==='Preview as new visitor'){lcPreview();return;}
  if(route==='@settings'){go('settings');stGo('p:integrations');return;}
  if(route==='@pipeline'){go('pipeline');return;}
  if(route&&window.LCD.SCN[route]){lcOpen(route);if(LC_TOAST[label])showToast(LC_TOAST[label]);return;}
  const c=window.LCD.SCN[lcScn]||{};
  if(c.ov){lcOpen(lcBase());showToast(LC_TOAST[label]||label);return;}
  showToast(LC_TOAST[label]||label);
}
// Buyer-facing frames (P01a…) from the design, shown in a phone-sized preview.
function lcPreview(){
  const p=window.LCD.SCN.P01a&&window.LCD.SCN.P01a.ph; if(!p){showToast('Preview');return;}
  const host=document.getElementById('lc-host');
  host.insertAdjacentHTML('beforeend',`<div class="lc-scrim" data-lc="×"></div><div class="lc-phone" role="dialog" aria-modal="true" aria-label="Buyer preview"><div class="lc-ovh"><b>Buyer preview · ${lcTxt(p.url)}</b><button type="button" class="lc-x" aria-label="Close" data-lc="×">×</button></div><div class="lc-ovb">${(p.blocks||[]).map(b=>`<div class="lc-ovblk">${lcBlock({...b,hasHead:!!b.title})}</div>`).join('')||'<span class="lc-mu">Preview</span>'}</div></div>`);
}
document.addEventListener('click',e=>{
  const host=document.getElementById('lc-host'); if(!host||!host.contains(e.target))return;
  const rail=e.target.closest('[data-lc-rail]'); if(rail){lcOpen(LC_HOME[rail.dataset.lcRail]);return;}
  const sw=e.target.closest('[data-lc-switch]'); if(sw){const on=sw.getAttribute('aria-checked')!=='true';sw.setAttribute('aria-checked',String(on));sw.style.background=on?'var(--primary)':'var(--sc-highest)';sw.firstElementChild.style.left=on?'14px':'2px';showToast('Saved');return;}
  const row=e.target.closest('[data-lc-row]'); if(row&&!e.target.closest('[data-lc]')&&lcScn&&/^S16/.test(lcScn)){lcOpen('S16b');return;}
  const t=e.target.closest('[data-lc]'); if(t)lcAction(t.dataset.lc);
});
