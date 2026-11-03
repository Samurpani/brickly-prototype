// Performance under Reports (Bricly Performance · Management Visibility Flows 2–6), rendered from perf-data.js.
// Owners and managers get Business, Team, Weekly roll-up and Targets; reps get their own view and the roll-up.
const PF_TABS_MGR=[['Business','3a'],['Team','4a'],['Weekly roll-up','5a'],['Targets','2b']];
const PF_TABS_REP=[['Mine','4b'],['Weekly roll-up','5a']];
let pfScn=null, pfDrawer=false, pfMenu=null;
const PF_INK='rgb(25,25,25)';
function pfRep(){return typeof curPersona!=='undefined'&&curPersona==='rep';}
function pfTabs(){return pfRep()?PF_TABS_REP:PF_TABS_MGR;}
function pfC(v){return v===PF_INK?'var(--on-surface)':v;}
function pfChip(c){return c&&c.t?`<span class="pf-chip" style="background:${c.bg};color:${pfC(c.fg)}">${xesc(c.t)}</span>`:'';}
function pfBT(x){return typeof x==='string'?x:Array.isArray(x)?x[0]:x.t;}
function pfBtn(x,cls){const t=pfBT(x), ink=Array.isArray(x)?x[1]==='p':x&&x.bg===PF_INK;return `<button type="button" class="${cls||(ink?'btn-primary':'btn-ghost')} pf-b" data-pf="${xesc(t)}">${xesc(t)}</button>`;}
function pfSegs(segs){return segs.map(s=>s.isRef?`<sup class="pf-ref">${s.ref}</sup>`:xesc(s.t)).join('');}
function pfBlock(b){
  if(b.cols==='150px repeat(6,minmax(0,1fr)) 150px') b={...b,cols:'120px repeat(3,46px minmax(92px,1fr)) 140px'};
  let h=`<section class="pf-card">`;
  if(b.hasHead) h+=`<div class="pf-bh"><b>${xesc(b.title)}</b><span class="pf-mu">${xesc(b.sub||'')}</span>${b.right?`<span class="pf-right">${xesc(b.right)}</span>`:''}</div>`;
  if(b.isKpis) h+=`<div class="pf-kpis" style="grid-template-columns:${b.kcols||'repeat(4,minmax(0,1fr))'}">${b.items.map(k=>`<div class="pf-kpi"><span class="pf-mu">${xesc(k.label)}</span><span class="pf-kv">${xesc(k.val)}</span>${k.hasBar?`<div class="pf-bar"><div style="width:${k.w};background:${k.fill}"></div>${k.hasPace?`<i style="left:${k.pace}"></i>`:''}</div>`:''}<div class="pf-row">${k.hasChip?pfChip(k.chip):''}<span class="pf-mu">${xesc(k.sub)}</span></div></div>`).join('')}</div>`;
  if(b.isBars) h+=`<div>${b.items.map(p=>`<div class="pf-proj" ${p.name==='Verdala'?'data-pf="drill:Verdala" role="button" tabindex="0"':''}><span class="pf-col"><span>${xesc(p.name)}</span><span class="pf-mu">${xesc(p.meta)}</span></span><div class="pf-bar wide"><div style="width:${p.w};background:${p.fill}"></div><i style="left:${p.pace}"></i></div><span>${xesc(p.val)}</span><span>${pfChip(p.chip)}</span></div>`).join('')}</div>`;
  if(b.isFunnel) h+=`<div class="pf-funnel">${b.items.map(f=>`<div class="pf-frow"><span>${xesc(f.label)}</span><div class="pf-bar wide tall"><div style="width:${f.w};background:${f.fill}"></div></div><span class="r">${xesc(f.n)}</span><span class="pf-mu">${xesc(f.conv)}</span></div>`).join('')}</div>`;
  if(b.isTable) h+=`<div class="pf-tbl"><div class="pf-tr th" style="grid-template-columns:${b.cols}">${(b.head||[]).map(x=>`<span>${xesc(x)}</span>`).join('')}</div>${b.rows.map(r=>`<div class="pf-tr" style="grid-template-columns:${b.cols};background:${r.bg}">${r.cells.map(c=>`<div class="pf-cell">${c.plain?`<span style="color:${pfC(c.fg)};font-weight:${c.fw}">${xesc(c.t)}</span>`:''}${c.inp?`<input class="pf-in" value="${xesc(c.t)}" aria-label="Target" data-pf-edit>`:''}${c.isChip?pfChip(c.chip):''}${c.hasS?`<span class="pf-mu">${xesc(c.s)}</span>`:''}</div>`).join('')}</div>`).join('')}${b.hasNote?`<div class="pf-note">${xesc(b.note)}</div>`:''}</div>`;
  if(b.isCallout) h+=`<div class="pf-callout"><div class="pf-col"><b>${xesc(b.head2)}</b><span class="pf-mu">${xesc(b.body)}</span></div><div class="pf-row">${(b.btns||[]).map(x=>pfBtn(x)).join('')}</div></div>`;
  if(b.isNarr) h+=`<div class="pf-narr">${b.head2?`<b>${xesc(b.head2)}</b>`:''}${b.paras.map(p=>`<div>${p.hasLabel?`<div class="pf-mu">${xesc(p.label)}</div>`:''}<p>${pfSegs(p.segs)}</p></div>`).join('')}${b.hasFoot?`<span class="pf-mu">${xesc(b.foot)}</span>`:''}</div>`;
  if(b.isList) h+=`<div>${b.items.map(l=>`<div class="pf-li" style="border-top:${l.bt}" ${/^Open the full roll-up/.test(l.k)?'data-pf="tab:Weekly roll-up" role="button" tabindex="0"':''}>${l.hasRef?`<sup class="pf-ref">${l.ref}</sup>`:''}<span class="pf-col"><span>${xesc(l.k)}</span>${l.hasV?`<span class="pf-mu">${xesc(l.v)}</span>`:''}</span>${l.hasR?`<span>${xesc(l.r)}</span>`:''}</div>`).join('')}</div>`;
  if(b.isChips) h+=`<div>${b.items.map(c=>`<div class="pf-li" style="border-top:${c.bt}"><span class="pf-col"><span>${xesc(c.t)}</span><span class="pf-mu">${xesc(c.s)}</span></span>${pfChip(c.chip)}</div>`).join('')}<div class="pf-li"><button type="button" class="tq-link" data-pf="phones">Preview what each person received →</button></div></div>`;
  if(b.isSteps) h+=`<div>${b.items.map(s=>`<div class="pf-li"><span class="pf-n">${xesc(s.n)}</span><span class="pf-col"><span style="font-weight:${s.fw}">${xesc(s.t)}</span><span class="pf-mu">${xesc(s.sub)}</span></span>${pfChip(s.chip)}</div>`).join('')}</div>`;
  if(b.isKv) h+=`<div>${(b.rows||[]).map(v=>`<div class="pf-li"><span class="pf-mu" style="width:140px">${xesc(v.k)}</span><span class="pf-col"><span>${xesc(v.v)}</span>${v.hasNote?`<span class="pf-mu">${xesc(v.note)}</span>`:''}</span></div>`).join('')}</div>`;
  if(b.isText&&b.text) h+=`<div class="pf-li pf-mu">${xesc(b.text)}</div>`;
  if((b.btns||[]).length&&!b.isCallout) h+=`<div class="pf-bbtns">${b.btns.map(x=>pfBtn(x)).join('')}</div>`;
  return h+'</section>';
}
function pfDrawerHtml(){
  const d=window.PFD.DRAWER;
  return `<div class="pf-drawer" role="dialog" aria-label="${xesc(d.title)}"><div class="pf-dh"><div class="pf-col"><b>${xesc(d.title)}</b><span class="pf-mu">${xesc(d.sub)}</span></div><button type="button" class="st-x" aria-label="Close" data-pf="close-drawer">×</button></div>
    <div class="pf-ask">${xesc(d.prompt)}</div>
    <div class="pf-narr">${d.paras.map(p=>`<div><div class="pf-mu">${xesc(p.label)}</div><p>${pfSegs(p.segs)}</p></div>`).join('')}</div>
    <div class="pf-mu" style="margin:6px 0">Sources</div>${d.items.map(l=>`<div class="pf-li"><sup class="pf-ref">${l.ref}</sup><span class="pf-col"><span>${xesc(l.k)}</span><span class="pf-mu">${xesc(l.v)}</span></span></div>`).join('')}
    <div class="pf-mu" style="margin-top:8px">${xesc(d.note)}</div><div class="pf-bbtns">${d.btns.map(x=>pfBtn(x)).join('')}</div></div>`;
}
function pfRender(){
  const root=document.getElementById('rp-root'); if(!root||!window.PFD) return;
  const tabs=pfTabs(); if(!pfScn||(!tabs.some(t=>t[1]===pfScn)&&!['3b','6a'].includes(pfScn))||(pfRep()&&['3b','6a'].includes(pfScn))) pfScn=tabs[0][1];
  const c=window.PFD.SCN[pfScn], drill=pfScn==='3b';
  const crumbs=drill?`<button type="button" class="st-back" data-pf="tab:Business">‹ Performance</button>`:'';
  root.innerHTML=`${crumbs}<div class="crm-page-heading pf-head"><div><div class="page-title">${xesc(c.title)} ${c.st?pfChip(c.st):''}</div><div class="page-sub">${xesc(c.sub)}</div></div></div>
    <div class="row-between crm-page-controls"><div class="tabs">${tabs.map(([l,k])=>`<button type="button" class="tab ${(c.tabsOn===l||pfScn===k)?'on':''}" data-pf="tab:${l}">${l}</button>`).join('')}</div>
      <div class="toolbar pf-tools">${(c.btns||[]).map(b=>{const t=pfBT(b);return `<span class="pf-rel">${pfBtn(b)}${pfMenu===t?pfMenuHtml(t):''}</span>`;}).join('')}</div></div>
    <div class="pf-grid ${drill&&pfDrawer?'with-drawer':''}" style="--pf-cols:${pfScn==='2b'?'minmax(0,1fr)':c.cols}">${(drill&&pfDrawer?c.columns.slice(0,1):c.columns).map(col=>`<div class="pf-colm">${col.map(pfBlock).join('')}</div>`).join('')}${drill&&pfDrawer?pfDrawerHtml():''}</div>`;
}
function pfMenuHtml(t){
  const items=/projects/.test(t)?['All projects','Onyx Rise','Mercury','Verdala']:['October','September','August','Year to date'];
  return `<div class="pf-menu" role="menu">${items.map(i=>`<button type="button" role="menuitem" data-pf="pick:${i}">${i}</button>`).join('')}</div>`;
}
function pfPhones(){
  qaDrawerOpen('What each person received',window.PFD.PHONES.map(p=>`<div class="pf-phone"><div class="pf-row"><b>${xesc(p.who)}</b><span class="pf-mu">${xesc(p.scope)}</span></div><div class="pf-wa"><b>${xesc(p.head)}</b><div>${xesc(p.body).replace(/\n/g,'<br>')}</div><span class="pf-mu">${p.hasPdf?'📄 Weekly roll-up.pdf · ':''}${xesc(p.link)}</span></div></div>`).join(''),`<button class="btn-primary" onclick="qaDrawerClose()">Done</button>`);
}
function pfAction(k){
  pfMenu=pfMenu&&k!==pfMenu?null:pfMenu;
  if(k.startsWith('tab:')){const t=pfTabs().find(x=>x[0]===k.slice(4));pfScn=t?t[1]:pfTabs()[0][1];pfDrawer=false;pfMenu=null;pfRender();document.getElementById('content').scrollTop=0;return;}
  if(k==='drill:Verdala'){pfScn='3b';pfDrawer=false;pfRender();document.getElementById('content').scrollTop=0;return;}
  if(k==='Brief me on Verdala'){pfDrawer=true;pfRender();return;}
  if(k==='close-drawer'){pfDrawer=false;pfRender();return;}
  if(k==='phones'){pfPhones();return;}
  if(/⌄$/.test(k)){pfMenu=pfMenu===k?null:k;pfRender();return;}
  if(k.startsWith('pick:')){const v=k.slice(5);pfMenu=null;if(v==='Verdala'){pfAction('drill:Verdala');return;}if(['Onyx Rise','Mercury'].includes(v)){pfRender();showToast(`${v} is on pace · open Verdala to see a project drill-down in this demo`);return;}pfRender();if(v!=='All projects'&&v!=='October')showToast(`${v} figures aren’t in this demo`);return;}
  if(k==='Save targets'||k==='Save'){showToast('Targets saved · pace lines update tomorrow at 06:00');return;}
  showToast(k);
}
rpRender=pfRender;
document.addEventListener('click',e=>{
  const root=document.getElementById('rp-root'); if(!root||!root.contains(e.target)){return;}
  const t=e.target.closest('[data-pf]'); if(t){pfAction(t.dataset.pf);return;}
  if(pfMenu){pfMenu=null;pfRender();}
});
