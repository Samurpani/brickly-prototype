// Control Station UI: shell, router, shared components, dialogs, and the
// Mission Control, Accounts, Account 360 and Alerts screens.
// More screens register on CSUI.screens in admin-screens-ops.js.
(function(){
const CS=window.CS,{esc,eur,ago,inDays,pct,can,acct,staffName,seatName,devName}=CS;
const UI=window.CSUI={screens:{},view:{alerts:{status:'active',sev:'all',acct:'all',mine:false},tl:'all',queue:'open'}};
const $=s=>document.querySelector(s);

// ---------- icons ----------
const ic=p=>`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I={
  mission:ic('<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/>'),
  accounts:ic('<rect x="2" y="3" width="12" height="11" rx="1"/><path d="M5 3V2h6v1M2 7h12"/>'),
  alerts:ic('<path d="M8 2a4 4 0 0 1 4 4v3l1.5 2.5h-11L4 9V6a4 4 0 0 1 4-4zM6.5 13.5a1.5 1.5 0 0 0 3 0"/>'),
  integrations:ic('<path d="M6 10l4-4M5 7L3.5 8.5a2.5 2.5 0 0 0 3.5 3.5L8.5 10.5M11 9l1.5-1.5A2.5 2.5 0 0 0 9 4L7.5 5.5"/>'),
  doctor:ic('<path d="M2 8h3l1.5-3 3 6L11 8h3"/>'),
  queue:ic('<path d="M3 4h10M3 8h10M3 12h6"/>'),
  support:ic('<circle cx="8" cy="6" r="3"/><path d="M2.5 14a5.5 5.5 0 0 1 11 0"/>'),
  usage:ic('<path d="M3 13V8M8 13V3M13 13V6"/>'),
  commercial:ic('<path d="M10.5 5.5A3 3 0 1 0 10.5 10.5M4 7h5M4 9h5"/>'),
  platform:ic('<rect x="2" y="2.5" width="12" height="4" rx="1"/><rect x="2" y="9.5" width="12" height="4" rx="1"/><path d="M5 4.5h.01M5 11.5h.01"/>'),
  compliance:ic('<path d="M8 1.5l5 2v4c0 3-2.2 5.5-5 7-2.8-1.5-5-4-5-7v-4z"/><path d="M5.8 8l1.6 1.6L10.5 6.5"/>'),
  staff:ic('<circle cx="6" cy="6" r="2.5"/><path d="M1.5 13.5a4.5 4.5 0 0 1 9 0M11 4.5a2 2 0 0 1 0 4M12.5 13.5a4 4 0 0 0-1.5-3"/>'),
  search:ic('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>'),
  slack:ic('<path d="M6 2v7M10 7v7M2 10h7M7 6h7"/>'),
  x:ic('<path d="M4 4l8 8M12 4l-8 8"/>'),
};
UI.I=I;

// ---------- small components ----------
const chip=(t,tone='')=>`<span class="chip ${tone}">${esc(t)}</span>`;
const sev=s=>`<span class="sev ${s}" title="Severity ${s}">${s}</span>`;
const LIFE={contracted:['Contracted','neu'],provisioning:['Provisioning','info'],onboarding:['Onboarding','info'],live:['Live','ok'],renewal:['Renewal window','warn'],risk:['At risk','bad'],churned:['Churned','neu']};
const life=k=>chip(...(LIFE[k]||[k,'']));
const STATUS={open:['Open','bad'],ack:['Acknowledged','warn'],snoozed:['Snoozed','neu'],resolved:['Resolved','ok']};
const alertStatus=st=>chip(...STATUS[st.status]);
const bar=(v,tone='')=>`<div class="bar" role="img" aria-label="${v}%"><i class="${tone}" style="width:${Math.min(100,v)}%"></i></div>`;
const spark=vals=>{if(vals.length<2)return '';const w=64,h=20,mx=Math.max(...vals)+2,mn=Math.min(...vals)-2;const pts=vals.map((v,i)=>`${(i/(vals.length-1)*w).toFixed(1)},${(h-(v-mn)/(mx-mn)*h).toFixed(1)}`).join(' ');return `<svg class="spark" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;};
const tbl=(heads,rows,empty='Nothing here.')=>rows.length?`<table class="tbl"><thead><tr>${heads.map(h=>`<th${h.startsWith('#')?' class="num"':''}>${esc(h.replace(/^#/,''))}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`:`<div class="empty">${esc(empty)}</div>`;
const card=(title,body,extra='')=>`<section class="card"><header><h2>${title}</h2><span class="sp"></span>${extra}</header>${body}</section>`;
const btn=(label,on,{tone='',dis=false,title='',sm=true}={})=>`<button class="btn ${tone} ${sm?'sm':''}" ${dis?'disabled':''} ${title?`title="${esc(title)}"`:''} onclick="${on}">${label}</button>`;
const js=v=>esc(JSON.stringify(v));
const healthOf=a=>CS.health(a);
const healthChip=a=>{const h=healthOf(a);return h.mode==='activation'?`<span class="hc"><span class="dot ${h.color}"></span>Activation ${h.pct}%</span>`:`<span class="hc"><span class="dot ${h.color}"></span>${h.score} ${h.color}${h.override?' (override)':''}</span>`;};
Object.assign(UI,{chip,sev,life,alertStatus,bar,spark,tbl,card,btn,js,healthChip,LIFE});

// ---------- toast and dialog ----------
let toastT;
UI.toast=(msg,undoId)=>{
  document.querySelector('.toast')?.remove();clearTimeout(toastT);
  const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');
  t.innerHTML=`<span>${esc(msg)}</span>${undoId?`<button onclick="CSUI.undo('${undoId}')">Undo</button>`:''}`;
  document.body.appendChild(t);toastT=setTimeout(()=>t.remove(),6000);
};
UI.undo=id=>{CS.undoEntry(id);document.querySelector('.toast')?.remove();UI.toast('Undone and logged');UI.render();};
UI.dialog=(title,body,actions)=>{
  let d=$('#csDlg');if(!d){d=document.createElement('dialog');d.id='csDlg';d.className='cs-dlg';document.body.appendChild(d);}
  d.innerHTML=`<form method="dialog" onsubmit="return false"><div class="dlg-h"><h2 id="csDlgT">${title}</h2><button type="button" class="btn ghost sm" aria-label="Close" onclick="CSUI.close()">${I.x}</button></div><div class="dlg-b">${body}</div><div class="dlg-f">${actions}</div></form>`;
  d.setAttribute('aria-labelledby','csDlgT');
  if(!d.open)d.showModal();
  d.querySelector('.dlg-b input,.dlg-b select,.dlg-b textarea')?.focus();
};
UI.close=()=>$('#csDlg')?.close();
UI.val=id=>($('#'+id)?.value||'').trim();

// ---------- navigation ----------
const NAV=[
  ['mission','Mission Control','alerts'],['accounts','Accounts','accounts'],['alerts','Alerts & playbooks','alerts'],
  null,['integrations','Integrations health','integrations'],['doctor','Data Doctor','doctor'],['queue','Fulfilment queue','queue'],['support','Support access','support'],
  null,['usage','Usage & adoption','usage'],['commercial','Commercial','commercial'],
  null,['platform','Platform','platform'],['compliance','Compliance','compliance'],['staff','Staff & security','staff'],
];
const allowed=k=>{const n=NAV.find(x=>x&&x[0]===k);if(!n)return false;return n[2]==='queue'?(can('queue')||can('queue.own')):can(n[2]);};
UI.allowed=allowed;
const route=()=>(location.hash.replace(/^#\/?/,'')||'').split('/').map(decodeURIComponent).filter(Boolean);
UI.go=h=>{if(location.hash===h)UI.render();else location.hash=h;};

function navCounts(){
  const open=CS.alerts.filter(a=>a.state.status==='open');
  return {alerts:[open.length,open.some(a=>a.sev==='P1')],queue:[CS.queue.filter(q=>q.status!=='delivered'&&(can('queue')||q.assignee===CS.me)).length,false],
    support:[CS.sensitive.filter(r=>r.status==='pending').length+CS.pendingOps.filter(r=>r.status==='pending').length,false]};
}

UI.render=()=>{
  CS.evaluate();
  let [screen,...args]=route();
  if(!screen||!allowed(screen)){const first=NAV.find(n=>n&&allowed(n[0]));screen=first[0];args=[];if(location.hash!=='#/'+screen)history.replaceState(null,'','#/'+screen);}
  const counts=navCounts(),m=CS.me;
  $('#csNav').innerHTML=NAV.map(n=>{if(!n)return '<div class="sep"></div>';const [k,label]=n;if(!allowed(k))return '';const c=counts[k];
    return `<a href="#/${k}" class="${k===screen?'on':''}" ${k===screen?'aria-current="page"':''}>${I[k]}<span>${label}</span>${c&&c[0]?`<span class="n ${c[1]?'bad':''}">${c[0]}</span>`:''}</a>`;}).join('');
  $('#csWho').innerHTML=CS.staff.map(s=>`<option value="${s.id}" ${s.id===m?'selected':''}>${esc(s.name)} · ${esc(CS.ROLE_LABEL[s.role])}</option>`).join('');
  const on=CS.oncall[0].staff;
  $('#csOncall').innerHTML=`${I.slack}<span>On call: <b>${on?esc(staffName(on)):'not set'}</b></span>`;
  renderBanner();
  const fn=UI.screens[screen];
  $('#csBody').innerHTML=fn?fn(...args):'<div class="empty">Not found.</div>';
  $('#csBody').dataset.screen=screen;
  document.title=`${$('#csBody h1')?.textContent||'Control Station'} · Bricly Control Station`;
};
function renderBanner(){
  const s=CS.sessions.find(x=>x.staff===CS.me&&!x.endedAt&&x.end>Date.now());
  const b=$('#csBanner');
  if(!s){b.hidden=true;b.innerHTML='';return;}
  const a=acct(s.acct),left=Math.max(0,Math.round((s.end-Date.now())/60e3));
  b.hidden=false;
  b.innerHTML=`<span>Bricly support is ${s.level==='L2'?'acting':'viewing'} as <b>${esc(seatName(a,s.asUser))}</b> in <a href="#/accounts/${a.id}/pipeline">${esc(a.name)}</a> · ${s.level==='L2'?'Changes allowed':'Read-only'} · ${left} min left · Reason: ${esc(s.reason)}</span><span class="sp"></span>${btn('End session',`CSUI.endSession('${s.id}')`)}`;
}
UI.endSession=id=>{CS.endSession(id);UI.toast('Support session ended and logged');UI.render();};
setInterval(()=>{const b=$('#csBanner');const had=!b.hidden;renderBanner();if(had&&b.hidden)UI.render();},30e3);

UI.switchStaff=id=>{CS.me=id;UI.toast(`Signed in as ${staffName(id)} (${CS.ROLE_LABEL[CS.staff.find(s=>s.id===id).role]})`);UI.render();};
UI.search=q=>{
  const box=$('#csSearchRes');q=q.trim().toLowerCase();
  if(!q){box.hidden=true;return;}
  const hits=[];
  CS.accounts.forEach(a=>{
    if(a.name.toLowerCase().includes(q))hits.push([`#/accounts/${a.id}`,a.name,'Account']);
    a.devs.forEach(d=>d.name.toLowerCase().includes(q)&&hits.push([`#/accounts/${a.id}/developments`,d.name,a.name]));
    a.seats.forEach(s=>s.name.toLowerCase().includes(q)&&hits.push([`#/accounts/${a.id}/team`,s.name,`${a.name} · ${s.role}`]));
    a.opps.forEach(o=>o.id.toLowerCase().includes(q)&&hits.push([`#/accounts/${a.id}/pipeline`,o.id,a.name]));
    a.units.forEach(u=>u.id.toLowerCase().includes(q.replace(/^#?/,'#'))&&hits.push([`#/accounts/${a.id}/data`,u.id,a.name]));
  });
  box.hidden=false;
  box.innerHTML=hits.slice(0,8).map(([h,t,s])=>`<a href="${h}" onclick="CSUI.clearSearch()"><span>${esc(t)}</span><span class="muted small">${esc(s)}</span></a>`).join('')||'<div class="empty">No matches</div>';
};
UI.clearSearch=()=>{$('#csSearch').value='';$('#csSearchRes').hidden=true;};

// ---------- shared alert rendering ----------
const acctName=id=>id?acct(id).name:'Platform';
UI.alertRow=(al,{showAcct=true}={})=>{
  const st=al.state;
  return `<div class="al" data-alert="${esc(al.key)}">${sev(al.sev)}<a class="t" href="#/alerts/${encodeURIComponent(al.key)}">${esc(al.title)}</a><span>${alertStatus(st)}</span>
    <div class="d">${esc(al.detail)}</div>
    <div class="m">${showAcct?`<a href="${al.acct?`#/accounts/${al.acct}`:'#/platform'}">${esc(acctName(al.acct))}</a> ·`:''} first seen ${ago(st.firstSeen)} · ${st.assignee?'assigned to '+esc(staffName(st.assignee)):'unassigned'}${st.status==='snoozed'?` · snoozed: ${esc(st.reason)}`:''}</div></div>`;
};

// ---------- repair operation flow ----------
UI.opFlow=(opId,acctId,target)=>{
  const a=acct(acctId),op=CS.OPS[opId];
  const param=op.param==='rep'?a.seats.filter(s=>s.active&&['rep','manager'].includes(s.role)):null;
  const p=param?{rep:param[0].id}:{};
  const plan=op.plan(a,target,p);
  const may=can('ops.request');
  const body=`<p class="muted">${esc(a.name)}${target&&target!==acctId?' · '+esc(target):''}</p>
    ${param?`<label class="field"><span>Reassign to</span><select id="opRep" onchange="CSUI.opPreview('${opId}','${acctId}','${esc(target)}')">${param.map(s=>`<option value="${s.id}">${esc(s.name)} (${s.role})</option>`).join('')}</select></label>`:''}
    <div><h3>Preview (dry run)</h3><ul class="changes" id="opChanges">${plan.changes.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></div>
    ${op.p1?`<div class="note warn">P1-class operation. A second person (Founder or Engineer, not you) must approve it before it runs.</div>`:''}
    ${op.consent?`<label class="check"><input type="checkbox" id="opConsent"><span>The account owner agreed to this change (record where in the reason).</span></label>`:''}
    <label class="field"><span>Reason</span><textarea id="opReason" placeholder="Why this repair is needed"></textarea></label>
    <label class="field"><span>Ticket or alert</span><input id="opTicket" placeholder="e.g. #1190 or the alert title"></label>
    <p class="err" id="opErr" role="alert"></p>
    ${may?'':'<div class="note">Your role can\'t run repairs.</div>'}
    <p class="muted small">Runs through the product's domain services and is recorded in the staff action log and the customer's audit log.</p>`;
  UI.dialog(esc(op.label),body,`${btn('Cancel','CSUI.close()',{sm:false})}${btn(op.p1?'Request approval':'Run repair',`CSUI.opSubmit('${opId}','${acctId}','${esc(target)}')`,{tone:'primary',dis:!may,sm:false})}`);
};
UI.opPreview=(opId,acctId,target)=>{const a=acct(acctId);const plan=CS.OPS[opId].plan(a,target,{rep:UI.val('opRep')});$('#opChanges').innerHTML=plan.changes.map(c=>`<li>${esc(c)}</li>`).join('');};
UI.opSubmit=(opId,acctId,target)=>{
  const op=CS.OPS[opId],reason=UI.val('opReason'),ticket=UI.val('opTicket');
  const err=m=>{$('#opErr').textContent=m;};
  if(!reason)return err('Add a reason.');
  if(!ticket)return err('Add a ticket or alert reference.');
  if(op.consent&&!$('#opConsent').checked)return err('Confirm the account owner agreed.');
  const params=op.param==='rep'?{rep:UI.val('opRep')}:{};
  UI.close();
  if(op.p1){CS.requestOp(opId,acctId,target,params,reason,ticket);UI.toast(`Approval requested from a Founder or Engineer`);UI.render();return;}
  const e=CS.runOp(opId,acctId,target,params,{reason,ticket});
  UI.toast(`${op.label} done and logged`,e.id);UI.render();
};

// ---------- Mission Control ----------
UI.screens.mission=()=>{
  const open=CS.alerts.filter(a=>a.state.status==='open'||a.state.status==='ack');
  const due=CS.queue.filter(q=>q.status!=='delivered'&&q.dueAt-Date.now()<24*CS.H).sort((x,y)=>x.dueAt-y.dueAt);
  const pend=CS.pendingOps.filter(r=>r.status==='pending'),sens=CS.sensitive.filter(r=>r.status==='pending');
  const renew=CS.accounts.filter(a=>a.renewalDays<=90);
  const onb=CS.accounts.filter(CS.isOnboarding);
  const sorted=[...CS.accounts].sort((x,y)=>attention(y)-attention(x));
  const svc=CS.services,incidents=CS.incidents.filter(i=>i.status==='open');
  return `<div class="page-head"><div><h1>Mission Control</h1><p>${CS.accounts.length} accounts · ${open.length} open alerts · ${due.length} concierge items due in 24h</p></div></div>
  ${incidents.map(i=>`<div class="note bad" style="margin-bottom:16px"><b>Incident open:</b> ${esc(i.title)} · ${i.affected.length} accounts affected · <a href="#/platform">Manage</a></div>`).join('')}
  ${pend.length||sens.length?`<div class="note warn" style="margin-bottom:16px">${pend.length?`${pend.length} repair${pend.length>1?'s':''} waiting for a second approver. `:''}${sens.length?`${sens.length} sensitive-data request${sens.length>1?'s':''} waiting. `:''}<a href="#/support">Review</a></div>`:''}
  <h2 style="margin-bottom:10px">Fleet</h2>
  <div class="fleet" style="margin-bottom:20px">${sorted.map(tile).join('')}</div>
  <div class="grid g-main">
    ${card('Alert inbox',open.slice(0,8).map(al=>UI.alertRow(al)).join('')||'<div class="empty">No open alerts.</div>',`<a href="#/alerts" class="small">All alerts (${open.length})</a>`)}
    <div class="stack">
      ${card('Due in 24h or overdue',due.length?`<div class="list">${due.map(q=>{const left=Math.round((q.dueAt-Date.now())/CS.H);return `<div><div class="row"><b>${esc(q.id)}</b> ${esc(q.type)}<span class="sp"></span>${chip(left<0?`${-left}h overdue`:`${left}h left`,left<0?'bad':left<6?'warn':'')}</div><div class="muted small">${esc(acct(q.acct).name)} · ${q.assignee?esc(staffName(q.assignee)):'<b>No assignee</b>'}</div></div>`;}).join('')}</div>`:'<div class="empty">Nothing due.</div>',`<a href="#/queue" class="small">Queue</a>`)}
      ${card('Platform pulse',`<div class="list">${svc.map(s=>`<div class="row"><span class="dot ${s.status==='ok'?'ok':s.status==='degraded'?'warn':'bad'}"></span>${esc(s.name)}<span class="sp"></span><span class="muted small">${s.errors}% errors</span></div>`).join('')}</div>`,`<a href="#/platform" class="small">Platform</a>`)}
      ${card('#bricly-alerts (Slack)',`<div class="slack">${CS.slack.slice(0,5).map(m=>`<div>${m.text.replace(/^(@\S+( \(no on-call set\))?)/,'<b>$1</b>')}<div class="muted small">${ago(m.at)}</div></div>`).join('')||'<div class="empty">No posts.</div>'}</div>`)}
      ${card('This quarter',`<div class="list">${renew.map(a=>`<div class="row"><a href="#/accounts/${a.id}">${esc(a.name)}</a><span class="sp"></span>${healthChip(a)} · renews in ${a.renewalDays}d</div>`).join('')}${onb.map(a=>{const h=healthOf(a);return `<div class="row"><a href="#/accounts/${a.id}">${esc(a.name)}</a><span class="sp"></span>Onboarding day ${h.day} of ${h.target} · ${h.pct}%</div>`;}).join('')}</div>`)}
    </div>
  </div>`;
};
function attention(a){const al=CS.alerts.filter(x=>x.acct===a.id&&x.state.status!=='resolved');return al.filter(x=>x.sev==='P1').length*100+al.filter(x=>x.sev==='P2').length*10+al.length+(healthOf(a).mode==='health'?(100-healthOf(a).score)/10:0);}
function tile(a){
  const h=healthOf(a),al=CS.alerts.filter(x=>x.acct===a.id&&['open','ack'].includes(x.state.status));
  const p1=al.filter(x=>x.sev==='P1').length;
  return `<a class="tile ${h.color}" href="#/accounts/${a.id}" data-acct="${a.id}">
    <div class="row"><b>${esc(a.name)}</b><span class="sp"></span>${life(a.lifecycle)}</div>
    ${h.mode==='activation'?`<div class="score">${h.pct}%</div><div class="muted small">Activation · day ${h.day} of ${h.target}</div>${bar(h.pct,h.color==='Amber'?'warn':'')}`:
    `<div class="row"><span class="score">${h.score}</span><span class="muted">${h.color}</span><span class="sp"></span><span class="muted small">${h.trend>0?'▲':h.trend<0?'▼':'—'} ${Math.abs(h.trend)}</span></div><div class="muted small">${esc(h.drivers[0]?.text||'No issues')}</div>`}
    <div class="meta"><span>${al.length?`${al.length} alerts${p1?` · <b style="color:var(--bad)">${p1} P1</b>`:''}`:'No alerts'}</span><span>Renews ${a.renewalDays}d</span></div></a>`;
}

// ---------- Accounts ----------
UI.screens.accounts=(id,tab)=>id?account360(id,tab||'overview'):accountsList();
function accountsList(){
  const rows=CS.accounts.map(a=>{const h=healthOf(a),al=CS.alerts.filter(x=>x.acct===a.id&&x.state.status!=='resolved');
    return `<tr class="click" onclick="CSUI.go('#/accounts/${a.id}')"><td><a href="#/accounts/${a.id}">${esc(a.name)}</a><div class="muted small">Customer since ${esc(a.since)}</div></td><td>${life(a.lifecycle)}</td><td>${healthChip(a)}</td>
    <td>${a.devs.map(d=>esc(d.name)+(d.state==='draft'?' <span class="muted">(draft)</span>':'')).join('<br>')}</td><td class="num">${CS.activeUnits(a)} / ${CS.allowance(a)||'—'}</td>
    <td class="num">${al.filter(x=>x.sev==='P1').length?sev('P1')+' ':''}${al.length}</td><td class="num">${eur(a.arr)}</td><td>${a.renewalDays}d</td><td>${esc(staffName(a.owner))}</td></tr>`;});
  return `<div class="page-head"><div><h1>Accounts</h1><p>Every customer workspace. Open one for its Account 360.</p></div></div>
  <div class="card">${tbl(['Account','Lifecycle','Health','Developments','#Active units','#Alerts','#ARR','Renewal','Account owner'],rows)}</div>`;
}

const TABS=[['overview','Overview'],['developments','Developments'],['team','Team & adoption'],['integrations','Integrations'],['data','Data health'],['pipeline','Pipeline'],['concierge','Concierge'],['commercial','Commercial'],['timeline','Timeline']];
function account360(id,tab){
  const a=acct(id);if(!a)return '<div class="empty">Account not found.</div>';
  const h=healthOf(a),al=CS.alerts.filter(x=>x.acct===a.id&&x.state.status!=='resolved');
  const sess=CS.activeSession(a.id);
  const counts={data:CS.doctor(a).found.length,overview:al.length};
  const head=`<div class="crumb"><a href="#/accounts">Accounts</a> / ${esc(a.name)}</div>
  <div class="page-head"><div><div class="row"><h1>${esc(a.name)}</h1>${life(a.lifecycle)}${CS.paused[a.id]?chip('Outbound WhatsApp paused','bad'):''}${CS.restrictions[a.id]?chip('Restricted: '+CS.restrictions[a.id].what,'bad'):''}</div>
    <p>${healthChip(a)} · ARR ${eur(a.arr)} · Renews in ${a.renewalDays} days · Account owner ${can('owner.set')?`<select aria-label="Account owner" onchange="CSUI.setOwner('${a.id}',this.value)">${CS.staff.filter(s=>['founder','cs'].includes(s.role)).map(s=>`<option value="${s.id}" ${s.id===a.owner?'selected':''}>${esc(s.name)}</option>`).join('')}</select>`:esc(staffName(a.owner))}
    · ${sess?chip(`Your support session: ${Math.round((sess.end-Date.now())/60e3)} min left`,'warn'):'No active support session'}</p></div><span class="sp"></span>
    <div class="row">${can('support.l1')?btn('Open support session',`CSUI.sessionDialog('${a.id}')`,{tone:'primary'}):''}${btn('Export diagnostics',`CSUI.exportDiag('${a.id}')`)}${can('platform.act')?btn(CS.paused[a.id]?'Resume outbound WhatsApp':'Pause outbound WhatsApp',`CSUI.togglePause('${a.id}')`,{tone:CS.paused[a.id]?'':'danger'}):''}</div></div>
  <nav class="tabs" aria-label="Account sections">${TABS.map(([k,l])=>`<a href="#/accounts/${a.id}/${k}" class="${k===tab?'on':''}" ${k===tab?'aria-current="page"':''}>${l}${counts[k]?`<span class="n">${counts[k]}</span>`:''}</a>`).join('')}</nav>`;
  const fn=T[tab]||T.overview;
  return head+fn(a,h,al);
}
UI.setOwner=(id,staff)=>{const a=acct(id);const prev=a.owner;a.owner=staff;CS.log({kind:'account',acct:id,text:`Account owner changed from ${staffName(prev)} to ${staffName(staff)}`,customerVisible:false});UI.toast('Account owner updated');UI.render();};
UI.exportDiag=id=>{CS.log({kind:'export',acct:id,text:'Exported diagnostics bundle (metadata only, no personal data)',customerVisible:false});UI.toast('Diagnostics bundle exported (no personal data)');UI.render();};
UI.togglePause=id=>{
  const on=!CS.paused[id];
  UI.dialog(on?'Pause outbound WhatsApp':'Resume outbound WhatsApp',`<p>${on?'Stops every automated and rep-initiated outbound WhatsApp message for this account. Inbound messages and rep commands keep working.':'Outbound WhatsApp messages start sending again.'}</p><label class="field"><span>Reason</span><textarea id="pzReason"></textarea></label><p class="err" id="pzErr" role="alert"></p>`,
    `${btn('Cancel','CSUI.close()',{sm:false})}${btn(on?'Pause':'Resume',`CSUI.doPause('${id}',${on})`,{tone:on?'danger':'primary',sm:false})}`);
};
UI.doPause=(id,on)=>{const r=UI.val('pzReason');if(!r){$('#pzErr').textContent='Add a reason.';return;}
  if(on)CS.paused[id]={by:CS.me,at:Date.now(),reason:r};else delete CS.paused[id];
  CS.log({kind:'platform',acct:id,text:`${on?'Paused':'Resumed'} outbound WhatsApp (kill switch)`,reason:r});UI.close();UI.toast(on?'Outbound WhatsApp paused':'Outbound WhatsApp resumed');UI.render();};

const T={};
T.overview=(a,h,al)=>{
  const healthCard=h.mode==='activation'?card('Activation tracker',`<div class="row" style="margin-bottom:8px"><b>Day ${h.day} of ${h.target}</b><span class="muted">· ${h.done} of ${h.total} steps</span><span class="sp"></span>${chip(h.color==='Green'?'On track':'Behind',h.color==='Green'?'ok':'warn')}</div>${bar(h.pct,h.color==='Green'?'':'warn')}
    <div class="steps" style="margin-top:12px">${h.steps.map((s,i)=>`<div><span class="ic ${s.done?'done':s.waitingDays>=5?'stuck':''}">${s.done?'✓':i+1}</span><div><div>${esc(s.label)}</div><div class="muted small">${s.done?`Done ${s.days}d ago`:s.waitingDays?`Waiting ${s.waitingDays} days${s.queue?` · <a href="#/queue">${s.queue}</a>`:''}`:s.queue?`<a href="#/queue">${s.queue}</a>`:'Not started'}</div></div>${!s.done&&can('alerts.act')?`<span class="sp"></span>${btn('Mark done',`CSUI.stepDone('${a.id}','${s.k}')`)}`:''}</div>`).join('')}</div>
    <p class="muted small" style="margin-top:8px">The health score starts once the account goes live.</p>`):
    card('Account health',`<div class="health"><div class="ring ${h.color}" style="--v:${h.score}" role="img" aria-label="Health ${h.score} of 100"><b>${h.score}</b></div><div><div class="row"><b>${h.color}</b><span class="muted">${h.trend>0?'▲':h.trend<0?'▼':'—'} ${Math.abs(h.trend)} vs last week</span>${spark(h.hist)}</div>
      ${h.override?`<div class="note warn small" style="margin-top:6px">Manual override by ${esc(staffName(h.override.by))}: ${esc(h.override.reason)}. Computed score is ${h.computed}. Expires ${CS.inDays(Math.round((h.override.until-Date.now())/CS.D))}.</div>`:''}
      <div class="muted small" style="margin-top:6px">Top drivers</div><ol style="margin:4px 0 0;padding-left:18px">${h.drivers.map(d=>`<li>${esc(d.text)}</li>`).join('')||'<li>Nothing pulling the score down</li>'}</ol></div></div>
      <div style="margin-top:14px">${h.pillars.map(p=>`<div class="pillar"><span>${p.label} <span class="muted small">${p.w}%</span></span>${bar(p.score,p.score<50?'bad':p.score<75?'warn':'')}<b class="num">${p.score}</b></div>`).join('')}</div>`,
      can('alerts.act')?(h.override?btn('Clear override',`CSUI.clearOverride('${a.id}')`):btn('Override score',`CSUI.overrideDialog('${a.id}')`)):'');
  const notes=a.notes.slice().sort((x,y)=>y.at-x.at);
  return `<div class="grid g-main"><div class="stack">${healthCard}
    ${card(`Open alerts (${al.length})`,al.map(x=>UI.alertRow(x,{showAcct:false})).join('')||'<div class="empty">No open alerts.</div>')}</div>
    <div class="stack">
      ${card('Account facts',`<dl class="kv"><dt>Developments</dt><dd>${a.devs.map(d=>esc(d.name)).join(', ')}</dd><dt>Active units</dt><dd>${CS.allowance(a)?`${CS.activeUnits(a)} of ${CS.allowance(a)} allowed`:'No active development yet'}</dd><dt>Seats</dt><dd>${a.seats.filter(s=>s.active).length} active</dd><dt>Activation</dt><dd>${esc(a.contract.activation)}</dd><dt>Retainer</dt><dd>${esc(a.contract.retainer)}</dd><dt>Credits</dt><dd>${pct(a.credits.used,a.credits.allowance)}% used</dd></dl>`)}
      ${card('Notes',`${can('notes')||can('alerts.act')?`<div class="row" style="margin-bottom:8px"><input id="noteIn" class="sp" style="flex:1;padding:6px 8px;border:1px solid var(--line);border-radius:6px" placeholder="Add a note for the team" aria-label="New note">${btn('Add',`CSUI.addNote('${a.id}')`)}</div>`:''}<div class="list">${notes.map(n=>`<div><div>${esc(n.text)}</div><div class="muted small">${esc(staffName(n.by))} · ${ago(n.at)}</div></div>`).join('')}</div>`)}
    </div></div>`;
};
UI.stepDone=(id,k)=>{const a=acct(id),s=a.onboarding.steps.find(x=>x.k===k);s.done=true;s.days=0;delete s.waitingDays;CS.log({kind:'onboarding',acct:id,text:`Onboarding step done: ${s.label}`,customerVisible:false});
  if(a.onboarding.steps.every(x=>x.done)){a.lifecycle='live';CS.log({kind:'onboarding',acct:id,text:'Account activated: success gate passed',customerVisible:false});}
  UI.toast('Step marked done');UI.render();};
UI.addNote=id=>{const t=UI.val('noteIn');if(!t)return;const a=acct(id);a.notes.push({by:CS.me,at:Date.now(),text:t});CS.timeline(id,'note',t,staffName(CS.me));UI.render();};
UI.overrideDialog=id=>UI.dialog('Override health score',`<p class="muted">The computed score stays visible next to your override.</p><label class="field"><span>Score (0–100)</span><input id="ovScore" type="number" min="0" max="100"></label><label class="field"><span>Reason</span><textarea id="ovReason" placeholder="What you know that the signals don't"></textarea></label><label class="field"><span>Expires after</span><select id="ovDays"><option value="7">7 days</option><option value="14" selected>14 days</option><option value="30">30 days</option></select></label><p class="err" id="ovErr" role="alert"></p>`,
  `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Save override',`CSUI.saveOverride('${id}')`,{tone:'primary',sm:false})}`);
UI.saveOverride=id=>{const s=Number(UI.val('ovScore')),r=UI.val('ovReason');if(UI.val('ovScore')===''||s<0||s>100)return $('#ovErr').textContent='Enter a score from 0 to 100.';if(!r)return $('#ovErr').textContent='Add a reason.';
  CS.overrides[id]={score:s,reason:r,by:CS.me,until:Date.now()+Number(UI.val('ovDays'))*CS.D};CS.log({kind:'account',acct:id,text:`Health score overridden to ${s}`,reason:r,customerVisible:false});UI.close();UI.toast('Override saved');UI.render();};
UI.clearOverride=id=>{delete CS.overrides[id];CS.log({kind:'account',acct:id,text:'Health score override cleared',customerVisible:false});UI.render();};

const CLEAR={paid:['Paid','ok'],covered:['Covered by terms','info'],outstanding:['Outstanding','bad']};
T.developments=a=>{
  const n=CS.activeUnits(a),cap=CS.allowance(a);
  const rows=a.devs.map(d=>{const units=a.units.filter(u=>u.dev===d.id);const ready=Object.entries(d.ready).map(([k,v])=>`<span class="${v?'':'muted'}">${v?'✓':'○'} ${({units:'Units reviewed',prices:'Prices',media:'Media',plans:'Level plans'})[k]}</span>`).join('<br>');
    return `<tr data-dev="${d.id}"><td><b>${esc(d.name)}</b><div class="muted small">${units.length} sample units tracked</div></td><td>${chip(d.state==='active'?'Active':d.state==='draft'?'Draft':d.state,d.state==='active'?'ok':'')}</td><td>${esc(d.band)}</td><td class="num">${d.allowance||'—'}</td>
    <td>${chip(...CLEAR[d.clearance])}<div class="muted small">${esc(d.ref||'No reference')}</div></td><td class="small">${ready}</td><td>${d.revisions?`${d.revisions} staged revision, waiting ${d.revisionDays}d`:'<span class="muted">None</span>'}</td>
    <td>${can('clearance.set')?btn('Set clearance',`CSUI.clearanceDialog('${a.id}','${d.id}')`):''} ${can('commercial.act')?btn('Allowance',`CSUI.allowanceDialog('${a.id}','${d.id}')`):''}</td></tr>`;});
  return `<div class="stack">${card('Active-unit allowance',`<div class="row" style="margin-bottom:6px"><b>${n} of ${cap||0}</b><span class="muted">available, on-hold and reserved units on active developments</span><span class="sp"></span>${cap?chip(pct(n,cap)+'%',n>=cap?'bad':n>=cap*.9?'warn':'ok'):''}</div>${bar(pct(n,cap||1),n>=cap?'bad':n>=cap*.9?'warn':'')}`)}
  ${card('Developments',tbl(['Development','State','Size band','#Allowance','Activation clearance','Readiness','Revisions',''],rows))}
  <p class="muted small">Bricly sets activation clearance. The owner can't self-certify it. Activating the development stays the owner's action in the product.</p></div>`;
};
UI.clearanceDialog=(id,devId)=>{const d=acct(id).devs.find(x=>x.id===devId);
  UI.dialog(`Activation clearance · ${esc(d.name)}`,`<fieldset style="border:0;padding:0;margin:0;display:flex;flex-direction:column;gap:8px"><legend class="sr">Clearance</legend>${Object.entries(CLEAR).map(([k,[l]])=>`<label class="check"><input type="radio" name="clr" value="${k}" ${d.clearance===k?'checked':''}><span>${l}</span></label>`).join('')}</fieldset>
  <label class="field"><span>Reference</span><input id="clrRef" value="${esc(d.ref)}" placeholder="Invoice ID or contract clause"></label><p class="err" id="clrErr" role="alert"></p>`,
  `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Save',`CSUI.saveClearance('${id}','${devId}')`,{tone:'primary',sm:false})}`);};
UI.saveClearance=(id,devId)=>{const a=acct(id),d=a.devs.find(x=>x.id===devId),v=document.querySelector('input[name=clr]:checked')?.value,ref=UI.val('clrRef');
  if(v!=='outstanding'&&!ref)return $('#clrErr').textContent='Add the invoice ID or contract clause.';
  d.clearance=v;d.ref=v==='outstanding'?'':ref;
  CS.log({kind:'commercial',acct:id,text:`Set activation clearance for ${d.name}: ${CLEAR[v][0]}`,reason:ref||'—'});UI.close();UI.toast(v==='outstanding'?'Clearance set to outstanding':`Cleared. ${a.seats.find(s=>s.role==='owner').name} can now activate ${d.name}.`);UI.render();};
UI.allowanceDialog=(id,devId)=>{const d=acct(id).devs.find(x=>x.id===devId);
  UI.dialog(`Allowance · ${esc(d.name)}`,`<label class="field"><span>Size band</span><select id="alBand">${['Up to 50','51–150','151–300'].map(b=>`<option ${b===d.band?'selected':''}>${b}</option>`).join('')}</select></label><label class="field"><span>Active-unit allowance</span><input id="alN" type="number" min="0" value="${d.allowance}"></label><label class="field"><span>Reason</span><textarea id="alReason" placeholder="e.g. Band upgrade agreed at renewal"></textarea></label><p class="err" id="alErr" role="alert"></p>`,
  `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Save',`CSUI.saveAllowance('${id}','${devId}')`,{tone:'primary',sm:false})}`);};
UI.saveAllowance=(id,devId)=>{const d=acct(id).devs.find(x=>x.id===devId),r=UI.val('alReason');if(!r)return $('#alErr').textContent='Add a reason.';
  const prev=`${d.band}, ${d.allowance}`;d.band=UI.val('alBand');d.allowance=Number(UI.val('alN'))||0;CS.log({kind:'commercial',acct:id,text:`Changed ${d.name} entitlement from ${prev} to ${d.band}, ${d.allowance} units`,reason:r});UI.close();UI.toast('Entitlement updated');UI.render();};

T.team=a=>{
  const reps=a.seats.filter(s=>s.role==='rep'&&s.active),activeReps=reps.filter(s=>s.acts7>0&&s.lastLogin<7);
  const rows=a.seats.map(s=>{const d=s.actsPrev?Math.round((s.acts7-s.actsPrev)/s.actsPrev*100):0;const myOpps=a.opps.filter(o=>o.rep===s.id&&o.stage!=='closed_won');
    return `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.role)}</td><td>${s.active?chip('Active','ok'):chip('Deactivated','')}</td><td>${s.lastLogin===0?'Today':s.lastLogin+'d ago'}</td>
    <td class="num">${s.acts7} <span class="small" style="color:${d<-30?'var(--bad)':'var(--muted)'}">${s.actsPrev?(d>0?'+':'')+d+'%':''}</span></td><td class="num">${s.wa7}</td><td class="num">${myOpps.length}</td><td class="num">${myOpps.filter(o=>o.lastAct>=14).length}</td>
    <td>${s.waLinked?chip('Linked','ok'):chip('Not linked','warn')}</td><td>${s.calendarOk?chip('OK','ok'):chip('Token expired','bad')}</td></tr>`;});
  return `<div class="stack"><div class="grid g4">
    <div class="card stat"><b>${activeReps.length}/${reps.length}</b><span>Active reps this week</span></div>
    <div class="card stat"><b>${a.seats.reduce((s,x)=>s+x.acts7,0)}</b><span>Activities logged (7d)</span></div>
    <div class="card stat"><b>${a.seats.reduce((s,x)=>s+x.wa7,0)}</b><span>WhatsApp commands (7d)</span></div>
    <div class="card stat"><b>${pct(a.opps.filter(o=>o.stage!=='closed_won'&&o.next).length,a.opps.filter(o=>o.stage!=='closed_won').length)}%</b><span>Opportunities with a next action</span></div></div>
    ${card('Seats and truth signals',tbl(['Person','Role','Status','Last login','#Activities 7d','#WA cmds','#Open opps','#Stale 14d+','WhatsApp','Calendar'],rows))}
    <p class="muted small">If reps don't log their work, the CRM data is wrong. These signals carry the most weight in the health score.</p></div>`;
};

T.integrations=a=>UI.integrationCards(a);

T.data=a=>{
  const doc=CS.doctor(a);
  const groups=[...new Set(CS.CHECKS.map(c=>c.group))];
  const findings=groups.map(g=>{const f=doc.found.filter(x=>x.group===g);const checks=CS.CHECKS.filter(c=>c.group===g);
    return `<h3 style="margin:14px 0 6px">${esc(g)} <span class="muted small">${checks.length-new Set(f.map(x=>x.check)).size} of ${checks.length} checks pass</span></h3>${f.length?tbl(['Sev','Check','Finding',''],f.map(x=>`<tr data-check="${x.check}"><td>${sev(x.sev)}</td><td>${esc(x.label)}</td><td>${esc(x.detail)}</td><td>${x.op?btn(esc(CS.OPS[x.op].label),`CSUI.opFlow('${x.op}','${a.id}','${esc(x.target)}')`,{dis:!can('ops.request')}):'<span class="muted small">Playbook only</span>'}</td></tr>`)):'<div class="muted small">All checks pass.</div>'}`;}).join('');
  const imps=a.imports.map(i=>`<tr><td class="mono">${i.id}</td><td>${esc(i.type)}</td><td>${chip(i.status==='attention'?'Needs attention':i.status==='undone'?'Undone':'Applied',i.status==='attention'?'warn':i.status==='undone'?'':'ok')}</td><td class="num">${i.rows}</td><td class="num">${i.created}</td><td class="num">${i.matched}</td><td class="num">${i.failed}</td><td>${i.days}d ago · ${esc(i.by)}</td><td>${i.days<=7?`Undo window: ${7-i.days}d left`:'<span class="muted">Window closed</span>'}</td></tr>`);
  const jobs=a.jobs.map(j=>`<tr><td class="mono">${j.id}</td><td>${esc(j.kind)}</td><td>${esc(j.target)}</td><td>${chip(j.state==='dead'?'Dead letter':'Done',j.state==='dead'?'bad':'ok')}</td><td class="num">${j.tries}</td><td>${esc(j.error)}</td><td>${j.state==='dead'?btn('Retry',`CSUI.opFlow('retry_job','${a.id}','${j.id}')`,{dis:!can('ops.request')}):''}</td></tr>`);
  return `<div class="stack">${card(`Data Doctor · score ${doc.score}`,findings,`<span class="muted small">Checks run every 15 minutes and after each import</span>`)}
    ${card('Imports',tbl(['Batch','Type','Status','#Rows','#Created','#Matched','#Failed','When','Customer undo'],imps,'No imports yet.'))}
    ${card('Background jobs',tbl(['Job','Kind','Target','State','#Tries','Last error',''],jobs,'No failed jobs.'))}</div>`;
};

T.pipeline=a=>{
  const s=CS.activeSession(a.id);
  const stages=Object.keys(CS.STAGE_LABEL).map(k=>[k,a.opps.filter(o=>o.stage===k).length]).filter(x=>x[1]);
  const rows=a.opps.map(o=>{const b=CS.buyers[o.id]||['Unknown','+356 0000 0000'];
    return `<tr data-opp="${o.id}"><td class="mono">${o.id}</td><td>${esc(CS.STAGE_LABEL[o.stage])}</td><td>${o.units.map(esc).join(', ')||'—'}</td><td>${esc(seatName(a,o.rep))}</td><td>${o.lastAct}d ago</td><td>${o.next?'✓':'<span style="color:var(--bad)">None</span>'}</td>
    <td>${s?esc(b[0]):`<span class="muted" title="Open a support session to see personal data">${esc(CS.mask(b[0]))}</span>`}</td><td class="mono">${s?esc(b[1]):esc(CS.maskPhone(b[1]))}</td>
    <td><div class="row">${s&&s.level==='L2'?btn('Add note',`CSUI.sessionNote('${a.id}','${o.id}')`):''}${btn('KYC files',`CSUI.kyc('${a.id}','${o.id}')`)}${btn('Message buyer','',{dis:true,title:'Staff can never send anything to a buyer. A rep must tap send.'})}</div></td></tr>`;});
  return `<div class="stack">${s?'':'<div class="note">Personal data is hidden. Open a support session (with a reason) to see buyer names and phones. The session is shown in the customer\'s audit log.</div>'}
  <div class="grid g4">${[['Leads (7d)',a.integrations.forms.reduce((t,f)=>t+f.subs7,0)],['Unassigned leads',a.leadsUnassigned.length],['Approvals pending',a.approvalsPending.length],['Holds expiring (7d)',a.units.filter(u=>u.status==='hold'&&u.holdDays>=0&&u.holdDays<=7).length]].map(([l,v])=>`<div class="card stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${card('Opportunities by stage',`<div class="row">${stages.map(([k,n])=>chip(`${CS.STAGE_LABEL[k]} · ${n}`,'info')).join('')||'<span class="muted">No opportunities yet.</span>'}</div>`)}
  ${card('Opportunities',tbl(['ID','Stage','Units','Rep','Last activity','Next action','Buyer','Phone',''],rows,'No opportunities yet.'))}</div>`;
};
UI.kyc=(id,opp)=>{
  const ok=CS.sensitive.find(r=>r.acct===id&&r.what===`KYC files for ${opp}`&&r.status==='approved'&&r.requestedBy===CS.me);
  if(ok){CS.log({kind:'sensitive',acct:id,text:`Downloaded KYC files for ${opp}`,reason:ok.reason});UI.toast('KYC files downloaded and logged');UI.render();return;}
  const pend=CS.sensitive.find(r=>r.acct===id&&r.what===`KYC files for ${opp}`&&r.status==='pending'&&r.requestedBy===CS.me);
  if(pend){UI.toast('Waiting for a second approver');return;}
  UI.dialog('Request KYC files',`<p>KYC and AML documents need a second staff approver (Founder or Engineer, not you) every time.</p><label class="field"><span>Reason</span><textarea id="sdReason"></textarea></label><p class="err" id="sdErr" role="alert"></p>`,
    `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Request approval',`CSUI.reqKyc('${id}','${opp}')`,{tone:'primary',sm:false})}`);
};
UI.reqKyc=(id,opp)=>{const r=UI.val('sdReason');if(!r)return $('#sdErr').textContent='Add a reason.';CS.requestSensitive(id,`KYC files for ${opp}`,r);UI.close();UI.toast('Approval requested');UI.render();};
UI.sessionNote=(id,opp)=>UI.dialog(`Add note to ${opp}`,`<p class="muted">This change is attributed as "Bricly support (${esc(CS.current().name)}) on behalf of ${esc(seatName(acct(id),CS.activeSession(id).asUser))}".</p><label class="field"><span>Note</span><textarea id="snText"></textarea></label>`,
  `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Add note',`CSUI.saveSessionNote('${id}','${opp}')`,{tone:'primary',sm:false})}`);
UI.saveSessionNote=(id,opp)=>{const t=UI.val('snText');if(!t)return;const s=CS.activeSession(id);CS.log({kind:'session',acct:id,text:`Added a note to ${opp} on behalf of ${seatName(acct(id),s.asUser)}`,reason:s.reason});UI.close();UI.toast('Note added and attributed');UI.render();};

T.concierge=a=>{
  const items=CS.queue.filter(q=>q.acct===a.id);
  return `<div class="stack"><div class="grid g3"><div class="card stat"><b>${items.filter(q=>q.status!=='delivered').length}</b><span>Open concierge items</span></div><div class="card stat"><b>${items.filter(q=>q.status==='delivered').length}</b><span>Delivered</span></div><div class="card stat"><b>${a.credits.used.toLocaleString()}</b><span>Credits used of ${a.credits.allowance.toLocaleString()}</span></div></div>
  ${card('Concierge work',UI.queueTable(items),`<a class="small" href="#/queue">Full queue</a>`)}</div>`;
};
T.commercial=a=>UI.commercialPanel(a);
T.timeline=a=>{
  const K={staff:'Staff action',customer:'Customer change',alert:'Alert',import:'Import',note:'Note',billing:'Billing'};
  const f=UI.view.tl,items=(a.timeline||[]).filter(t=>f==='all'||t.kind===f);
  return `<div class="card"><div class="seg" role="group" aria-label="Filter timeline" style="margin-bottom:12px">${[['all','All'],...Object.entries(K)].map(([k,l])=>`<button class="${f===k?'on':''}" aria-pressed="${f===k}" onclick="CSUI.view.tl='${k}';CSUI.render()">${l}</button>`).join('')}</div>
  <div class="tl">${items.map(t=>`<div><span class="muted small">${ago(t.at)}</span><span class="dot ${t.kind==='alert'?'bad':t.kind==='staff'?'warn':t.kind==='customer'?'ok':'neu'}" style="margin-top:6px"></span><div><div>${esc(t.text)}</div><div class="k">${K[t.kind]||t.kind}${t.who?' · '+esc(t.who):''}</div></div></div>`).join('')||'<div class="empty">Nothing yet.</div>'}</div></div>`;
};

// ---------- Alerts ----------
UI.screens.alerts=key=>key?alertDetail(key):alertsList();
function alertsList(){
  const v=UI.view.alerts;
  const all=[...CS.alerts,...CS.resolvedAlerts.map(r=>({key:r.key,state:r.state,sev:'—',title:r.key.split(':')[0].replace(/_/g,' '),acct:CS.acct(r.key.split(':')[1])?r.key.split(':')[1]:null,detail:r.state.resolvedBy==='auto'?'The condition cleared.':esc(r.state.note||'Resolved by staff.'),rule:r.key.split(':')[0]}))];
  const list=all.filter(a=>(v.status==='active'?['open','ack'].includes(a.state.status):a.state.status===v.status)&&(v.sev==='all'||a.sev===v.sev)&&(v.acct==='all'||a.acct===v.acct)&&(!v.mine||a.state.assignee===CS.me));
  const seg=(k,opts)=>`<div class="seg" role="group">${opts.map(([val,l])=>`<button class="${v[k]===val?'on':''}" aria-pressed="${v[k]===val}" onclick="CSUI.view.alerts.${k}='${val}';CSUI.render()">${l}</button>`).join('')}</div>`;
  const n=s=>CS.alerts.filter(a=>s==='active'?['open','ack'].includes(a.state.status):a.state.status===s).length;
  return `<div class="page-head"><div><h1>Alerts &amp; playbooks</h1><p>Alerts dedupe per account, rule and record, auto-resolve when the condition clears, and P1s post to #bricly-alerts in Slack.</p></div></div>
  <div class="row" style="margin-bottom:12px">${seg('status',[['active',`Active (${n('active')})`],['snoozed',`Snoozed (${n('snoozed')})`],['resolved',`Resolved (${CS.resolvedAlerts.length})`]])}
  ${seg('sev',[['all','All'],['P1','P1'],['P2','P2'],['P3','P3']])}
  <select aria-label="Account" onchange="CSUI.view.alerts.acct=this.value;CSUI.render()" style="padding:5px 8px;border:1px solid var(--line);border-radius:6px"><option value="all">All accounts</option>${CS.accounts.map(a=>`<option value="${a.id}" ${v.acct===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select>
  <label class="check"><input type="checkbox" ${v.mine?'checked':''} onchange="CSUI.view.alerts.mine=this.checked;CSUI.render()"><span>Assigned to me</span></label></div>
  <div class="card" id="alertList">${list.map(al=>al.sev==='—'?`<div class="al">${chip('Resolved','ok')}<b>${esc(al.title)}</b><span class="muted small">${ago(al.state.resolvedAt)}</span><div class="d">${al.detail}</div><div class="m">${esc(al.acct?acct(al.acct).name:'Platform')}</div></div>`:UI.alertRow(al)).join('')||'<div class="empty">No alerts match.</div>'}</div>
  ${card('Severity levels',`<dl class="kv"><dt>${sev('P1')}</dt><dd>Revenue, data or compliance damage happening now. Slack @mention to on-call, acknowledge within 15 min.</dd><dt>${sev('P2')}</dt><dd>A customer workflow is broken. Same business day.</dd><dt>${sev('P3')}</dt><dd>Degradation or risk. Weekly review.</dd></dl>`)}`;
}
function alertDetail(key){
  const al=CS.alerts.find(a=>a.key===key);
  if(!al){const st=CS.alertState[key];return `<div class="crumb"><a href="#/alerts">Alerts</a></div><h1>Alert resolved</h1><p class="muted" style="margin:8px 0 16px">${st?.resolvedBy==='auto'?'The condition cleared, so the alert resolved itself.':'This alert is resolved.'}</p>${st?card('History',`<div class="list">${st.history.map(h=>`<div>${esc(h.text)} <span class="muted small">· ${ago(h.at)}${h.by?' · '+esc(staffName(h.by)):''}</span></div>`).join('')}</div>`):''}`;}
  const st=al.state,steps=CS.PLAYBOOKS[al.rule]||[],ticks=CS.playbookTicks[key]||[];
  const act=can('alerts.act');
  return `<div class="crumb"><a href="#/alerts">Alerts</a> / ${esc(al.acct?acct(al.acct).name:'Platform')}</div>
  <div class="page-head"><div><div class="row">${sev(al.sev)}<h1>${esc(al.title)}</h1>${alertStatus(st)}</div><p>${esc(al.detail)}</p></div></div>
  <div class="grid g-main"><div class="stack">
    ${card('Playbook',`<div class="steps">${steps.map((s,i)=>`<label class="check" style="padding:6px 0"><input type="checkbox" ${ticks.includes(i)?'checked':''} ${act?'':'disabled'} onchange="CSUI.tick('${esc(key)}',${i},this.checked)"><span>${esc(s)}</span></label>`).join('')}</div>
      ${al.op?`<div style="margin-top:12px">${btn(esc(CS.OPS[al.op].label),`CSUI.opFlow('${al.op}','${al.acct}','${esc(al.target)}')`,{tone:'primary',dis:!can('ops.request'),sm:false})}</div>`:''}`)}
    ${card('History',`<div class="list"><div>First seen <span class="muted small">· ${ago(st.firstSeen)}</span></div>${st.history.map(h=>`<div>${esc(h.text)} <span class="muted small">· ${ago(h.at)}${h.by?' · '+esc(staffName(h.by)):''}</span></div>`).join('')}</div>`)}
  </div><div class="stack">
    ${card('Actions',act?`<div class="stack">
      <div class="row">${st.status==='open'?btn('Acknowledge',`CSUI.alertAct('${esc(key)}','ack')`,{tone:'primary',sm:false}):''}${btn('Snooze',`CSUI.snoozeDialog('${esc(key)}')`,{sm:false})}${btn('Resolve',`CSUI.resolveDialog('${esc(key)}')`,{sm:false})}</div>
      <label class="field"><span>Assignee</span><select onchange="CSUI.assign('${esc(key)}',this.value)"><option value="">Unassigned</option>${CS.staff.filter(s=>!['contractor','finance'].includes(s.role)).map(s=>`<option value="${s.id}" ${st.assignee===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label></div>`:'<p class="muted">Your role can view alerts but not act on them.</p>')}
    ${card('Evidence',`<p><a href="${al.link||'#/accounts/'+al.acct}">Open the evidence</a></p><p class="muted small" style="margin-top:6px">Rule <span class="mono">${esc(al.rule)}</span> · key <span class="mono">${esc(key)}</span></p>`)}
  </div></div>`;
}
const hist=(key,text)=>CS.alertState[key].history.push({at:Date.now(),text,by:CS.me});
UI.tick=(key,i,on)=>{const t=CS.playbookTicks[key]=CS.playbookTicks[key]||[];if(on)t.push(i);else t.splice(t.indexOf(i),1);hist(key,`${on?'Ticked':'Unticked'} playbook step ${i+1}`);};
UI.alertAct=(key,what)=>{const st=CS.alertState[key];if(what==='ack'){st.status='ack';if(!st.assignee)st.assignee=CS.me;hist(key,'Acknowledged');}UI.toast('Alert acknowledged');UI.render();};
UI.assign=(key,id)=>{CS.alertState[key].assignee=id||null;hist(key,id?`Assigned to ${staffName(id)}`:'Unassigned');UI.render();};
UI.snoozeDialog=key=>UI.dialog('Snooze alert',`<label class="field"><span>For</span><select id="snH"><option value="4">4 hours</option><option value="24" selected>1 day</option><option value="72">3 days</option><option value="168">1 week</option></select></label><label class="field"><span>Reason</span><textarea id="snReason" placeholder="Required. Why is it OK to wait?"></textarea></label><p class="err" id="snErr" role="alert"></p>`,
  `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Snooze',`CSUI.snooze('${esc(key)}')`,{tone:'primary',sm:false})}`);
UI.snooze=key=>{const r=UI.val('snReason');if(!r)return $('#snErr').textContent='Add a reason.';const st=CS.alertState[key],hrs=Number(UI.val('snH'));st.status='snoozed';st.until=Date.now()+hrs*CS.H;st.reason=r;hist(key,`Snoozed for ${hrs}h: ${r}`);UI.close();UI.toast('Alert snoozed');UI.render();};
UI.resolveDialog=key=>UI.dialog('Resolve alert',`<p class="muted">If the condition is still true, the alert opens again on the next check.</p><label class="field"><span>Resolution note</span><textarea id="rsNote"></textarea></label><p class="err" id="rsErr" role="alert"></p>`,
  `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Resolve',`CSUI.resolve('${esc(key)}')`,{tone:'primary',sm:false})}`);
UI.resolve=key=>{const n=UI.val('rsNote');if(!n)return $('#rsErr').textContent='Add a note.';const st=CS.alertState[key];st.status='resolved';st.note=n;st.resolvedAt=Date.now();st.resolvedBy=CS.me;hist(key,`Resolved: ${n}`);UI.close();
  // Re-evaluate so a still-true condition reopens immediately
  CS.evaluate();const again=CS.alerts.find(a=>a.key===key);UI.toast(again?'Resolved, but the condition is still true, so it reopened':'Alert resolved');UI.render();};

// ---------- boot ----------
window.addEventListener('hashchange',UI.render);
window.addEventListener('DOMContentLoaded',()=>{
  $('#csWho').addEventListener('change',e=>UI.switchStaff(e.target.value));
  $('#csSearch').addEventListener('input',e=>UI.search(e.target.value));
  $('#csSearch').addEventListener('keydown',e=>{if(e.key==='Escape')UI.clearSearch();if(e.key==='Enter'){const f=$('#csSearchRes a');if(f){location.hash=f.getAttribute('href');UI.clearSearch();}}});
  document.addEventListener('click',e=>{if(!e.target.closest('.cs-search'))$('#csSearchRes').hidden=true;});
  UI.render();
});
})();
