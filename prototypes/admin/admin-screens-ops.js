// Control Station UI: Integrations health, Data Doctor (fleet), Fulfilment queue, Support access,
// Usage & adoption, Commercial, Platform, Compliance, and Staff & security screens.
(function(){
const CS=window.CS,UI=window.CSUI,{esc,eur,ago,pct,can,acct,staffName,seatName}=CS;
const {chip,sev,tbl,card,btn,bar,healthChip,life}=UI;
const $=s=>document.querySelector(s);

// ---------- Integrations ----------
const WA_STATUS={connected:['Connected','ok'],flagged:['Flagged','bad'],disabled:['Disabled','bad'],not_connected:['Not connected','']};
UI.integrationCards=a=>{
  const wa=a.integrations.wa,em=a.integrations.email,forms=a.integrations.forms;
  const stale=a.seats.filter(s=>s.active&&!s.calendarOk);
  const unlinked=a.seats.filter(s=>s.active&&['rep','manager'].includes(s.role)&&!s.waLinked);
  const opBtn=(op,target,label)=>btn(label||esc(CS.OPS[op].label),`CSUI.opFlow('${op}','${a.id}','${esc(target)}')`,{dis:!can('ops.request')});
  return `<div class="grid g2" data-integrations="${a.id}">
  ${card('WhatsApp (Twilio / Meta)',wa.status==='not_connected'?'<div class="empty">Not connected yet. This is part of onboarding.</div>':`<dl class="kv">
    <dt>Number status</dt><dd>${chip(...WA_STATUS[wa.status])}${CS.paused[a.id]?' '+chip('Outbound paused by Bricly','bad'):''}</dd>
    <dt>Quality rating</dt><dd>${chip(wa.quality,wa.quality==='high'?'ok':wa.quality==='medium'?'warn':'bad')}</dd>
    <dt>Messaging limit</dt><dd>${wa.tier} unique contacts / 24h</dd>
    <dt>Webhook failures</dt><dd>${wa.webhookFail}% (15 min) ${wa.webhookFail>5?opBtn('replay_webhooks',a.id):''}</dd>
    <dt>Command parse rate</dt><dd>${wa.parseRate}% first time</dd>
    <dt>Templates</dt><dd>${wa.templatesRejected?chip(wa.templatesRejected+' rejected','bad'):chip('All approved','ok')}</dd>
    <dt>Reps linked</dt><dd>${unlinked.length?`${unlinked.map(s=>esc(s.name)).join(', ')} not linked`:'All linked'}</dd></dl>`)}
  ${card('Email',`<dl class="kv"><dt>Domain authentication</dt><dd>${em.auth==='ok'?chip('SPF, DKIM, DMARC pass','ok'):em.auth==='pending'?chip('Pending DNS','warn'):chip('DKIM failing','bad')}</dd><dt>Bounce rate</dt><dd>${em.bounce}% ${em.bounce>5?chip('Above 5%','bad'):''}</dd><dt>Complaint rate</dt><dd>${em.complaint}%</dd></dl>`)}
  ${card('Hosted lead forms',forms.length?`<div class="list">${forms.map(f=>`<div><div class="row"><b>${esc(f.name)}</b><span class="sp"></span>${f.subs7===0&&f.baseline?chip('Silent','bad'):chip('Receiving','ok')}</div><div class="muted small">${f.subs7} submissions this week · usual ~${f.baseline} · last ${f.lastDays===0?'today':f.lastDays+'d ago'}${f.adsRunning?' · ads running':''}</div></div>`).join('')}</div>`:'<div class="empty">No forms yet.</div>')}
  ${card('Google Calendar',stale.length?`<div class="list">${stale.map(s=>`<div class="row">${esc(s.name)} ${chip('Token expired','bad')}<span class="sp"></span>${opBtn('resync_calendar',s.id)}</div>`).join('')}</div>`:`<p>${a.seats.filter(s=>s.active).length} users syncing. No errors.</p>`)}
  ${card('AI credits',`<div class="row" style="margin-bottom:6px"><b>${a.credits.used.toLocaleString()}</b><span class="muted">of ${a.credits.allowance.toLocaleString()} used</span><span class="sp"></span>${a.credits.forecast>a.credits.allowance?chip(`Forecast ${a.credits.forecast.toLocaleString()}`,'warn'):chip('Forecast within allowance','ok')}</div>${bar(pct(a.credits.used,a.credits.allowance))}`)}
  ${card('Coming later',`<p class="muted">Meta / Google Ads lead webhooks, DocuSign, Stripe and MCP agent monitoring arrive with v1.1–v1.2.</p>`)}
  </div>`;
};
UI.screens.integrations=()=>{
  const rows=CS.accounts.map(a=>{const wa=a.integrations.wa,em=a.integrations.email,f=a.integrations.forms;
    const cell=(ok,txt)=>`<span class="row"><span class="dot ${ok===null?'neu':ok?'ok':'bad'}"></span>${txt}</span>`;
    return `<tr class="click" onclick="CSUI.go('#/accounts/${a.id}/integrations')"><td><a href="#/accounts/${a.id}/integrations">${esc(a.name)}</a></td>
    <td>${wa.status==='not_connected'?cell(null,'Not connected'):cell(wa.status==='connected'&&wa.quality!=='low'&&!CS.paused[a.id],`${WA_STATUS[wa.status][0]} · ${wa.quality}${CS.paused[a.id]?' · paused':''}`)}</td>
    <td>${wa.webhookFail==null?'—':cell(wa.webhookFail<=5,wa.webhookFail+'%')}</td><td>${wa.parseRate?cell(wa.parseRate>=80,wa.parseRate+'%'):'—'}</td>
    <td>${cell(em.auth==='ok'&&em.bounce<=5,em.auth==='dkim_broken'?'DKIM failing':em.auth==='pending'?'Pending DNS':`Bounce ${em.bounce}%`)}</td>
    <td>${f.length?cell(!f.some(x=>x.subs7===0&&x.baseline),`${f.reduce((s,x)=>s+x.subs7,0)} leads / 7d`):'—'}</td>
    <td>${cell(a.seats.every(s=>!s.active||s.calendarOk),a.seats.some(s=>s.active&&!s.calendarOk)?'Token expired':'OK')}</td></tr>`;});
  return `<div class="page-head"><div><h1>Integrations health</h1><p>One row per account. Open an account for failing records and fixes.</p></div></div>
  <div class="card">${tbl(['Account','WhatsApp','Webhook failures','Parse rate','Email','Lead forms','Calendar'],rows)}</div>`;
};

// ---------- Data Doctor (fleet) ----------
UI.screens.doctor=()=>{
  const all=CS.accounts.flatMap(a=>CS.doctor(a).found.map(f=>({...f,a})));
  const byCheck=CS.CHECKS.map(c=>({c,f:all.filter(x=>x.check===c.id)}));
  return `<div class="page-head"><div><h1>Data Doctor</h1><p>${CS.CHECKS.length} invariant checks across every account. Fixes are named operations with a preview, a reason and an audit entry. Nobody edits the database directly.</p></div></div>
  <div class="grid g3" style="margin-bottom:16px">${CS.accounts.map(a=>{const d=CS.doctor(a);return `<a class="card" style="text-decoration:none;color:inherit" href="#/accounts/${a.id}/data"><div class="row"><b>${esc(a.name)}</b><span class="sp"></span><b>${d.score}</b></div>${bar(d.score,d.score<50?'bad':d.score<75?'warn':'')}<div class="muted small" style="margin-top:6px">${d.found.length?`${d.found.length} failing checks`:'All checks pass'}</div></a>`;}).join('')}</div>
  ${card('Checks',tbl(['Check','Group','Default sev','Failing in',''],byCheck.map(({c,f})=>`<tr><td>${esc(c.label)}</td><td class="muted">${esc(c.group)}</td><td>${sev(c.sev)}</td><td>${f.length?f.map(x=>`<a href="#/accounts/${x.a.id}/data">${esc(x.a.name)}</a> <span class="muted small">${esc(x.entity)}</span>`).join('<br>'):'<span class="muted">Passing everywhere</span>'}</td><td>${f.length?chip(f.length+' failing','bad'):chip('Pass','ok')}</td></tr>`)))}`;
};

// ---------- Fulfilment queue ----------
const Q_STATUS={requested:['Requested',''],in_production:['In production','info'],revision:['Revision requested','warn'],delivered:['Delivered','ok']};
UI.queueTable=items=>{
  const mayAct=can('queue.act');
  return tbl(['Item','Type','Account','Context','Status','Assignee','SLA','#Hours',''],items.map(q=>{
    const left=Math.round((q.dueAt-Date.now())/CS.H),done=q.status==='delivered',used=pct(q.slaH-left,q.slaH);
    const mine=q.assignee===CS.me,canWork=mayAct||mine;
    const next={requested:'Start',in_production:'Mark delivered',revision:'Start revision'}[q.status];
    const rv=q.review&&CS.reviews[q.review];
    return `<tr data-q="${q.id}"><td class="mono">${rv?`<a href="#/queue/${q.id}">${q.id}</a>`:q.id}</td><td>${esc(q.type)}</td><td>${esc(acct(q.acct).name)}</td><td>${esc(q.ctx)}</td><td>${chip(...Q_STATUS[q.status])}</td>
    <td>${mayAct?`<select aria-label="Assignee for ${q.id}" onchange="CSUI.qAssign('${q.id}',this.value)"><option value="">Unassigned</option>${CS.staff.filter(s=>['contractor','cs','founder'].includes(s.role)).map(s=>`<option value="${s.id}" ${q.assignee===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select>`:esc(staffName(q.assignee))}</td>
    <td>${done?'<span class="muted">Done</span>':`${chip(left<0?`${-left}h overdue`:`${left}h left`,left<0?'bad':used>=75?'warn':'')}<div style="margin-top:4px;width:80px">${bar(Math.min(100,used),left<0?'bad':used>=75?'warn':'')}</div>`}</td>
    <td class="num">${q.hours}</td><td><div class="row">${rv&&(canWork||done)?btn(done?'View review':'Open review',`CSUI.go('#/queue/${q.id}')`,{tone:done?'':'primary'}):''}${!rv&&!done&&canWork&&next?btn(next,`CSUI.qNext('${q.id}')`):''}${!done&&canWork?btn('Log hours',`CSUI.qHours('${q.id}')`):''}${done&&mayAct&&!rv?btn('Request revision',`CSUI.qRevise('${q.id}')`):''}</div></td></tr>`;}),'No items.');
};
UI.screens.queue=id=>{
  if(id&&UI.screens.devReview)return UI.screens.devReview(id);
  const own=!can('queue');
  const f=UI.view.queue;
  let items=CS.queue.filter(q=>!own||q.assignee===CS.me);
  items=items.filter(q=>f==='all'||(f==='open'?q.status!=='delivered':q.status==='delivered')).sort((x,y)=>x.dueAt-y.dueAt);
  const producers=CS.staff.filter(s=>['contractor','cs','founder'].includes(s.role));
  const load=producers.map(s=>{const its=CS.queue.filter(q=>q.assignee===s.id&&q.status!=='delivered');return {s,n:its.length,over:its.filter(q=>q.dueAt<Date.now()).length};});
  const delivered=CS.queue.filter(q=>q.status==='delivered'),onTime=delivered.filter(q=>!q.late).length;
  return `<div class="page-head"><div><h1>${own?'My assigned work':'Fulfilment queue'}</h1><p>${own?'Only the briefs and assets assigned to you. Contractors never see CRM data.':'Concierge work behind Studio, renders, imports and onboarding. Hours logged here become the v1.1 automation priority signal.'}</p></div></div>
  <div class="row" style="margin-bottom:12px"><div class="seg" role="group">${[['open','Open'],['delivered','Delivered'],['all','All']].map(([k,l])=>`<button class="${f===k?'on':''}" aria-pressed="${f===k}" onclick="CSUI.view.queue='${k}';CSUI.render()">${l}</button>`).join('')}</div></div>
  ${own?'':`<div class="grid g4" style="margin-bottom:16px"><div class="card stat"><b>${CS.queue.filter(q=>q.status!=='delivered').length}</b><span>Open items</span></div><div class="card stat"><b>${CS.queue.filter(q=>q.status!=='delivered'&&q.dueAt<Date.now()).length}</b><span>Overdue</span></div><div class="card stat"><b>${CS.queue.filter(q=>q.status!=='delivered'&&!q.assignee).length}</b><span>Unassigned</span></div><div class="card stat"><b>${pct(onTime,delivered.length)}%</b><span>Delivered on time</span></div></div>`}
  <div class="card" style="margin-bottom:16px">${UI.queueTable(items)}</div>
  ${own?'':card('Capacity',tbl(['Producer','Role','#Open items','#Overdue',''],load.map(l=>`<tr><td>${esc(l.s.name)}</td><td>${esc(l.s.skill||CS.ROLE_LABEL[l.s.role])}</td><td class="num">${l.n}</td><td class="num">${l.over}</td><td style="width:160px">${bar(Math.min(100,l.n*34),l.n>=3?'bad':l.n>=2?'warn':'')}</td></tr>`))+'<p class="muted small" style="margin-top:8px">When every producer has 3 or more open items, pause new onboardings for the week.</p>')}`;
};
const qGet=id=>CS.queue.find(q=>q.id===id);
const qLog=(q,text)=>CS.log({kind:'queue',acct:q.acct,text:`${q.id} ${q.type}: ${text}`,customerVisible:false});
UI.qAssign=(id,staff)=>{const q=qGet(id);q.assignee=staff||null;qLog(q,staff?`assigned to ${staffName(staff)}`:'unassigned');
  const a=acct(q.acct),step=a.onboarding?.steps.find(s=>s.queue===id&&!s.done);if(step&&staff){step.waitingDays=0;q.dueAt=Date.now()+q.slaH*CS.H;qLog(q,'SLA clock restarted');}
  UI.toast(staff?`Assigned to ${staffName(staff)}`:'Unassigned');UI.render();};
UI.qNext=id=>{const q=qGet(id),to={requested:'in_production',in_production:'delivered',revision:'in_production'}[q.status];
  if(to==='in_production'&&!q.assignee)q.assignee=CS.me;
  if(to==='delivered'){q.late=q.dueAt<Date.now();CS.timeline(q.acct,'staff',`${q.type} delivered (${q.id})`,staffName(CS.me));
    const a=acct(q.acct),step=a.onboarding?.steps.find(s=>s.queue===id);if(step){step.done=true;step.days=0;delete step.waitingDays;}}
  q.status=to;qLog(q,Q_STATUS[to][0]);UI.toast(`${q.id}: ${Q_STATUS[to][0]}`);UI.render();};
UI.qHours=id=>UI.dialog(`Log hours · ${id}`,`<label class="field"><span>Hours spent</span><input id="qhN" type="number" min="0.25" step="0.25" value="1"></label>`,`${btn('Cancel','CSUI.close()',{sm:false})}${btn('Log',`CSUI.qHoursSave('${id}')`,{tone:'primary',sm:false})}`);
UI.qHoursSave=id=>{const q=qGet(id),n=Number(UI.val('qhN'));if(!(n>0))return;q.hours=Math.round((q.hours+n)*100)/100;qLog(q,`${n}h logged`);UI.close();UI.render();};
UI.qRevise=id=>{const q=qGet(id);q.status='revision';q.dueAt=Date.now()+q.slaH*CS.H;qLog(q,'revision requested');UI.render();};

// ---------- Support access ----------
UI.sessionDialog=(acctId,user)=>{
  const accts=acctId?[acct(acctId)]:CS.accounts;
  const a=accts[0];
  UI.dialog('Open support session',`<div class="note">Standing access: the customer agreed to Bricly support access in their contract and DPA. You still need a reason, the session ends after 1 hour, and the customer sees it in their audit log.</div>
    <label class="field"><span>Account</span><select id="ssAcct" ${acctId?'disabled':''} onchange="CSUI.ssUsers()">${accts.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
    <label class="field"><span>View as</span><select id="ssUser">${a.seats.filter(s=>s.active).map(s=>`<option value="${s.id}" ${s.id===user?'selected':''}>${esc(s.name)} (${s.role})</option>`).join('')}</select></label>
    <fieldset style="border:0;padding:0;margin:0;display:flex;flex-direction:column;gap:6px"><legend style="font-weight:500;margin-bottom:6px">Level</legend>
      <label class="check"><input type="radio" name="ssLvl" value="L1" checked><span><b>L1 Read-only</b>: see the workspace as this user</span></label>
      <label class="check"><input type="radio" name="ssLvl" value="L2" ${can('support.l2')?'':'disabled'}><span><b>L2 Act-as</b>: make changes, attributed as "Bricly support on behalf of" this user${can('support.l2')?'':' (not available to your role)'}</span></label></fieldset>
    <label class="field"><span>Reason</span><input id="ssReason" placeholder="Ticket number or alert, e.g. #1190 approvals not showing"></label>
    <p class="err" id="ssErr" role="alert"></p>
    <p class="muted small">KYC files and bulk exports still need a second approver inside a session. Sending anything to a buyer is never possible.</p>`,
    `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Open session',`CSUI.ssOpen()`,{tone:'primary',sm:false})}`);
};
UI.ssUsers=()=>{const a=acct(UI.val('ssAcct'));$('#ssUser').innerHTML=a.seats.filter(s=>s.active).map(s=>`<option value="${s.id}">${esc(s.name)} (${s.role})</option>`).join('');};
UI.ssOpen=()=>{
  const id=$('#ssAcct').value,user=UI.val('ssUser'),lvl=document.querySelector('input[name=ssLvl]:checked').value,r=UI.val('ssReason');
  if(!r)return $('#ssErr').textContent='Add a reason (ticket or alert).';
  if(lvl==='L2'&&!can('support.l2'))return;
  const open=CS.activeSession(id);if(open)CS.endSession(open.id);
  CS.openSession(id,user,lvl,r);UI.close();UI.toast(`Support session open for 60 min`);location.hash=`#/accounts/${id}/pipeline`;UI.render();
};
UI.screens.support=()=>{
  const live=CS.sessions.filter(s=>!s.endedAt&&s.end>Date.now());
  const pend=CS.pendingOps.filter(r=>r.status==='pending'),sens=CS.sensitive.filter(r=>r.status==='pending');
  const sessRows=CS.sessions.map(s=>{const a=acct(s.acct),on=!s.endedAt&&s.end>Date.now();
    return `<tr><td>${esc(staffName(s.staff))}</td><td><a href="#/accounts/${a.id}">${esc(a.name)}</a></td><td>${esc(seatName(a,s.asUser))}</td><td>${chip(s.level==='L2'?'L2 Act-as':'L1 Read-only',s.level==='L2'?'warn':'info')}</td><td>${esc(s.reason)}</td><td>${ago(s.start)}</td><td>${on?chip(`${Math.round((s.end-Date.now())/60e3)} min left`,'ok'):chip(s.endedAt?'Ended':'Expired','')}</td><td>${on&&s.staff===CS.me?btn('End',`CSUI.endSession('${s.id}')`):''}</td></tr>`;});
  return `<div class="page-head"><div><h1>Support access</h1><p>Standing access under the contract and DPA. Every session has a reason, ends after an hour, and shows in the customer's audit log.</p></div><span class="sp"></span>${can('support.l1')?btn('Open support session','CSUI.sessionDialog()',{tone:'primary',sm:false}):''}</div>
  <div class="grid g3" style="margin-bottom:16px">
    <div class="card"><h3>L0 Metadata</h3><p class="muted small">Default for every role except contractors. Counts, statuses, IDs, errors. Personal data is masked.</p></div>
    <div class="card"><h3>L1 Read-only · L2 Act-as</h3><p class="muted small">CS / Ops, Engineers and Founders open L1. Only CS / Ops and Founders open L2. Reason required, 1 hour limit.</p></div>
    <div class="card"><h3>Sensitive data</h3><p class="muted small">KYC / AML files and bulk contact exports need a second approver (Founder or Engineer, not the requester).</p></div></div>
  ${card(`Waiting for a second approver (${pend.length+sens.length})`,pend.length||sens.length?tbl(['Request','Account','Requested by','Reason','When',''],[
    ...pend.map(r=>`<tr data-pending="${r.id}"><td><b>${esc(CS.OPS[r.op].label)}</b> <span class="muted small">${esc(r.target)}</span><div class="muted small">P1-class repair · ${esc(r.ticket)}</div></td><td>${esc(acct(r.acct).name)}</td><td>${esc(staffName(r.requestedBy))}</td><td>${esc(r.reason)}</td><td>${ago(r.at)}</td>
      <td><div class="row">${CS.canApprove(r)?btn('Approve and run',`CSUI.approveOp('${r.id}')`,{tone:'primary'})+btn('Reject',`CSUI.rejectOp('${r.id}')`):`<span class="muted small">${r.requestedBy===CS.me?'Needs someone else':'Founder or Engineer approves'}</span>`}</div></td></tr>`),
    ...sens.map(r=>`<tr data-sensitive="${r.id}"><td><b>${esc(r.what)}</b><div class="muted small">Sensitive data</div></td><td>${esc(acct(r.acct).name)}</td><td>${esc(staffName(r.requestedBy))}</td><td>${esc(r.reason)}</td><td>${ago(r.at)}</td>
      <td><div class="row">${can('sensitive.approve')&&r.requestedBy!==CS.me?btn('Approve',`CSUI.decideSens('${r.id}',true)`,{tone:'primary'})+btn('Reject',`CSUI.decideSens('${r.id}',false)`):`<span class="muted small">${r.requestedBy===CS.me?'Needs someone else':'Founder or Engineer approves'}</span>`}</div></td></tr>`)]):'<div class="empty">Nothing waiting.</div>')}
  <div style="height:16px"></div>
  ${card(`Sessions (${live.length} live)`,tbl(['Staff','Account','As user','Level','Reason','Started','Status',''],sessRows,'No sessions yet.'))}`;
};
UI.approveOp=id=>{const e=CS.approveOp(id);if(e){UI.toast(`Approved and run: ${e.text}`,e.id);}UI.render();};
UI.rejectOp=id=>{CS.rejectOp(id);UI.toast('Request rejected');UI.render();};
UI.decideSens=(id,ok)=>{CS.decideSensitive(id,ok);UI.toast(ok?'Approved. The requester can download once.':'Rejected');UI.render();};

// ---------- Usage & adoption ----------
UI.screens.usage=()=>{
  const FEATURES=[['Pipeline',a=>a.opps.length>0],['Opportunity journeys',a=>a.opps.some(o=>o.next)],['WhatsApp commands',a=>a.seats.some(s=>s.wa7>0)],['Approvals',a=>a.approvalsPending.length>0||a.units.some(u=>u.approval)],['Imports',a=>a.imports.length>0],['Present Mode',a=>CS.flags.find(f=>f.key==='present_v3').on.includes(a.id)],['Buyer proposals',a=>CS.flags.find(f=>f.key==='proposals').on.includes(a.id)],['Lead forms',a=>a.integrations.forms.length>0]];
  const rows=CS.accounts.map(a=>{const seats=a.seats.filter(s=>s.active),wau=seats.filter(s=>s.lastLogin<7&&s.acts7>0);const reps=seats.filter(s=>s.role==='rep');const open=a.opps.filter(o=>o.stage!=='closed_won');
    return `<tr class="click" onclick="CSUI.go('#/accounts/${a.id}/team')"><td><a href="#/accounts/${a.id}/team">${esc(a.name)}</a></td><td>${life(a.lifecycle)}</td><td class="num">${wau.length}/${seats.length}</td><td class="num">${reps.filter(s=>s.acts7>0).length}/${reps.length}</td>
    <td class="num">${reps.length?Math.round(reps.reduce((s,x)=>s+x.acts7,0)/reps.length):0}</td><td class="num">${seats.reduce((s,x)=>s+x.wa7,0)}</td><td class="num">${pct(open.filter(o=>o.next).length,open.length)}%</td><td class="num">${pct(open.filter(o=>o.lastAct>=14).length,open.length)}%</td><td class="num">${FEATURES.filter(([,f])=>f(a)).length}/${FEATURES.length}</td></tr>`;});
  const feat=FEATURES.map(([l,f])=>{const n=CS.accounts.filter(f).length;return `<div class="pillar"><span>${l}</span>${bar(pct(n,CS.accounts.length))}<b class="num">${n}/${CS.accounts.length}</b></div>`;}).join('');
  const sold=CS.accounts.reduce((s,a)=>s+a.units.filter(u=>u.status==='sold').length,0),res=CS.accounts.reduce((s,a)=>s+a.units.filter(u=>u.status==='reserved').length,0);
  return `<div class="page-head"><div><h1>Usage &amp; adoption</h1><p>If reps don't use Bricly, the data is wrong. These are the signals that tell us.</p></div></div>
  <div class="grid g4" style="margin-bottom:16px"><div class="card stat"><b>${CS.accounts.reduce((s,a)=>s+a.integrations.forms.reduce((t,f)=>t+f.subs7,0),0)}</b><span>Leads captured (7d)</span></div><div class="card stat"><b>${CS.accounts.reduce((s,a)=>s+a.seats.reduce((t,x)=>t+x.acts7,0),0)}</b><span>Activities logged (7d)</span></div><div class="card stat"><b>${res}</b><span>Units reserved (tracked)</span></div><div class="card stat"><b>${sold}</b><span>Units sold (tracked)</span></div></div>
  <div class="grid g-main"><div class="card">${tbl(['Account','Lifecycle','#Weekly active','#Active reps','#Acts / rep','#WA cmds','#Next action','#Stale','#Features'],rows)}</div>
  ${card('Feature adoption across accounts',feat)}</div>`;
};

// ---------- Commercial ----------
UI.commercialPanel=a=>{
  const inv=a.invoices.map(i=>`<tr><td class="mono">${i.id}</td><td>${esc(i.label)}</td><td class="num">${eur(i.amt)}</td><td>${i.dueDays<0?`${-i.dueDays}d ago`:`in ${i.dueDays}d`}</td><td>${i.status==='paid'?chip('Paid','ok'):i.dueDays<-14?chip('Overdue','bad'):chip('Open','warn')}</td><td>${i.status!=='paid'&&can('commercial.act')?btn('Mark paid',`CSUI.markPaid('${a.id}','${i.id}')`):''}</td></tr>`);
  const r=CS.restrictions[a.id];
  return `<div class="stack"><div class="grid g2">
    ${card('Contract',`<dl class="kv"><dt>Recurring</dt><dd>${eur(a.arr)} / year</dd><dt>Developments</dt><dd>${a.devs.map(d=>`${esc(d.name)} (${esc(d.band)})`).join(', ')}</dd><dt>Activation type</dt><dd>${esc(a.contract.activation)}</dd><dt>Onboarding</dt><dd>${esc(a.contract.onboarding)}</dd><dt>Performance</dt><dd>${esc(a.contract.retainer)}</dd><dt>Renewal</dt><dd>In ${a.renewalDays} days</dd></dl>`)}
    ${card('Credits',`<div class="row" style="margin-bottom:6px"><b>${a.credits.used.toLocaleString()}</b><span class="muted">of ${a.credits.allowance.toLocaleString()}</span><span class="sp"></span>Forecast ${a.credits.forecast.toLocaleString()}</div>${bar(pct(a.credits.used,a.credits.allowance),a.credits.forecast>a.credits.allowance?'warn':'')}<p class="muted small" style="margin-top:8px">Overage is sold as an output block (€1,800 / 10,000 credits). It never cuts the customer off.</p>`)}</div>
    ${card('Invoices',tbl(['Invoice','For','#Amount','Due','Status',''],inv))}
    ${card('Product restrictions',`${r?`<div class="note bad">Restricted: ${esc(r.what)}. Decided by ${esc(staffName(r.by))}: ${esc(r.reason)}</div><div style="margin-top:8px">${CS.current().role==='founder'?btn('Lift restriction',`CSUI.lift('${a.id}')`):''}</div>`:
      `<p>Bricly never restricts an account automatically. Overdue invoices and allowance overage raise alerts only. A Founder must decide and record a reason.</p><div style="margin-top:10px">${btn('Restrict account',`CSUI.restrictDialog('${a.id}')`,{dis:CS.current().role!=='founder',title:CS.current().role==='founder'?'':'Founders only'})}</div>`}`)}</div>`;
};
UI.markPaid=(id,inv)=>{const i=acct(id).invoices.find(x=>x.id===inv);i.status='paid';CS.log({kind:'commercial',acct:id,text:`Marked ${inv} as paid`,customerVisible:false});
  const a=acct(id),d=a.devs.find(x=>i.label.includes(x.name));if(d&&d.clearance==='outstanding'){d.clearance='paid';d.ref=inv;CS.log({kind:'commercial',acct:id,text:`Activation clearance for ${d.name} set to Paid (${inv})`,reason:'Activation invoice paid'});UI.toast(`Paid. ${d.name} is now cleared for activation.`);}else UI.toast('Invoice marked paid');UI.render();};
UI.restrictDialog=id=>UI.dialog('Restrict account',`<div class="note warn">Founder decision. The customer is told before the restriction applies.</div><label class="field"><span>Restriction</span><select id="rsWhat"><option>New development activation blocked</option><option>Studio requests paused</option><option>Read-only workspace</option></select></label><label class="field"><span>Reason</span><textarea id="rsWhy"></textarea></label><p class="err" id="rsE" role="alert"></p>`,
  `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Restrict',`CSUI.restrict('${id}')`,{tone:'danger',sm:false})}`);
UI.restrict=id=>{const r=UI.val('rsWhy');if(!r)return $('#rsE').textContent='Add a reason.';CS.restrictions[id]={what:UI.val('rsWhat'),reason:r,by:CS.me};CS.log({kind:'commercial',acct:id,text:`Restricted: ${UI.val('rsWhat')}`,reason:r});UI.close();UI.render();};
UI.lift=id=>{const r=CS.restrictions[id];delete CS.restrictions[id];CS.log({kind:'commercial',acct:id,text:`Lifted restriction: ${r.what}`});UI.render();};
UI.screens.commercial=()=>{
  const rows=CS.accounts.map(a=>{const open=a.invoices.filter(i=>i.status!=='paid');const over=open.filter(i=>i.dueDays<-14);
    return `<tr class="click" onclick="CSUI.go('#/accounts/${a.id}/commercial')"><td><a href="#/accounts/${a.id}/commercial">${esc(a.name)}</a></td><td class="num">${eur(a.arr)}</td><td>${a.devs.length}</td><td>${a.devs.map(d=>`${esc(d.name)}: ${chip(...({paid:['Paid','ok'],covered:['Covered','info'],outstanding:['Outstanding','bad']})[d.clearance])}`).join('<br>')}</td>
    <td class="num">${eur(open.reduce((s,i)=>s+i.amt,0))}${over.length?' '+chip('Overdue','bad'):''}</td><td class="num">${pct(a.credits.used,a.credits.allowance)}%${a.credits.forecast>a.credits.allowance?' '+chip('Over forecast','warn'):''}</td><td>${a.renewalDays}d</td><td>${healthChip(a)}</td></tr>`;});
  const arr=CS.accounts.reduce((s,a)=>s+a.arr,0);
  return `<div class="page-head"><div><h1>Commercial</h1><p>Contracts feed entitlements. Nothing here restricts a customer automatically.</p></div></div>
  <div class="grid g4" style="margin-bottom:16px"><div class="card stat"><b>${eur(arr)}</b><span>Recurring ARR</span></div><div class="card stat"><b>${eur(arr/CS.accounts.length)}</b><span>Average ACV</span></div><div class="card stat"><b>${eur(CS.accounts.flatMap(a=>a.invoices).filter(i=>i.status!=='paid').reduce((s,i)=>s+i.amt,0))}</b><span>Open invoices</span></div><div class="card stat"><b>${CS.accounts.filter(a=>a.renewalDays<=90).length}</b><span>Renewals in 90 days</span></div></div>
  <div class="card">${tbl(['Account','#ARR','Devs','Activation clearance','#Open invoices','#Credits used','Renewal','Health'],rows)}</div>`;
};

// ---------- Platform ----------
UI.screens.platform=()=>{
  const act=can('platform.act');
  const inc=CS.incidents;
  const flagRows=CS.flags.map(f=>{const targets=f.scope==='account'?CS.accounts.map(a=>[a.id,a.name]):CS.accounts.flatMap(a=>a.devs.map(d=>[d.id,`${d.name}`]));
    return `<tr><td><b>${esc(f.label)}</b><div class="muted small mono">${f.key}</div></td><td>${esc(f.ring)}</td><td>${f.scope==='account'?'Per account':'Per development'}</td><td><div class="row">${targets.map(([id,n])=>`<label class="check small" style="margin-right:8px"><input type="checkbox" ${f.on.includes(id)?'checked':''} ${act?'':'disabled'} onchange="CSUI.flag('${f.key}','${id}',this.checked)"><span>${esc(n)}</span></label>`).join('')}</div></td></tr>`;});
  return `<div class="page-head"><div><h1>Platform</h1><p>Service health, incidents mapped to affected accounts, releases and feature flags.</p></div><span class="sp"></span>${act?btn('Declare incident','CSUI.incidentDialog()',{tone:'danger',sm:false}):''}</div>
  <div class="grid g3" style="margin-bottom:16px">${CS.services.map(s=>`<div class="card"><div class="row"><span class="dot ${s.status==='ok'?'ok':s.status==='degraded'?'warn':'bad'}"></span><b>${esc(s.name)}</b><span class="sp"></span>${chip(s.status==='ok'?'Operational':s.status==='degraded'?'Degraded':'Outage',s.status==='ok'?'ok':s.status==='degraded'?'warn':'bad')}</div><div class="muted small" style="margin-top:6px">${s.latency?`p95 ${s.latency} ms · `:''}${s.errors}% errors</div></div>`).join('')}</div>
  ${card('Incidents',inc.length?`<div class="list">${inc.map(i=>`<div data-incident="${i.id}"><div class="row"><b>${esc(i.title)}</b>${chip(i.status==='open'?'Open':'Resolved',i.status==='open'?'bad':'ok')}<span class="sp"></span>${i.status==='open'&&act?btn('Resolve incident',`CSUI.resolveIncident('${i.id}')`):''}</div>
    <div class="muted small">${esc(i.component)} · declared ${ago(i.at)} by ${esc(staffName(i.by))}</div><div style="margin-top:6px">Affected: ${i.affected.map(id=>`<a href="#/accounts/${id}">${esc(acct(id).name)}</a>`).join(', ')||'none'}</div>
    <details style="margin-top:6px"><summary>Customer notice draft</summary><p class="note" style="margin-top:6px">${esc(i.notice)}</p></details></div>`).join('')}</div>`:'<div class="empty">No incidents.</div>')}
  <div style="height:16px"></div>
  <div class="grid g-main">${card('Feature flags',tbl(['Flag','Ring','Scope','Enabled for'],flagRows)+'<p class="muted small" style="margin-top:8px">Rings: Internal → Founding cohort → All accounts. Every change is logged. Account kill switches (pause outbound WhatsApp) live on each Account 360.</p>')}
  ${card('Releases',`<div class="list">${CS.releases.map(r=>`<div><b class="mono">${r.v}</b> <span class="muted small">${r.days}d ago</span><div>${esc(r.note)}</div></div>`).join('')}</div>`)}</div>`;
};
const COMPONENT_USERS={'Twilio (WhatsApp)':a=>a.integrations.wa.status!=='not_connected','Email provider':()=>true,'Google Calendar':a=>a.seats.length>1,'Hosted lead forms':a=>a.integrations.forms.length>0,'CRM API':()=>true,'Background jobs':()=>true};
UI.incidentDialog=()=>UI.dialog('Declare incident',`<label class="field"><span>Component</span><select id="inC" onchange="CSUI.incAffected()">${CS.services.map(s=>`<option>${esc(s.name)}</option>`).join('')}</select></label><label class="field"><span>Title</span><input id="inT" placeholder="e.g. WhatsApp messages delayed"></label><div><h3>Affected accounts</h3><p id="inA" class="muted"></p></div><p class="err" id="inE" role="alert"></p>`,
  `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Declare',`CSUI.declare()`,{tone:'danger',sm:false})}`);
UI.incAffected=()=>{const c=UI.val('inC');$('#inA').textContent=CS.accounts.filter(COMPONENT_USERS[c]).map(a=>a.name).join(', ');};
const _inc=UI.incidentDialog;UI.incidentDialog=()=>{_inc();UI.incAffected();};
UI.declare=()=>{const c=UI.val('inC'),t=UI.val('inT');if(!t)return $('#inE').textContent='Add a title.';
  const affected=CS.accounts.filter(COMPONENT_USERS[c]).map(a=>a.id);
  const i={id:CS.uid('INC'),title:t,component:c,affected,status:'open',at:Date.now(),by:CS.me,notice:`We're investigating an issue with ${c.toLowerCase()} that may affect your Bricly workspace. Your data is safe. We'll update you within 30 minutes.`};
  CS.incidents.unshift(i);const s=CS.services.find(x=>x.name===c);if(s)s.status='outage';
  CS.log({kind:'platform',text:`Declared incident: ${t} (${affected.length} accounts)`});affected.forEach(id=>CS.timeline(id,'alert',`Platform incident: ${t}`));UI.close();UI.toast('Incident declared and posted to Slack');UI.render();};
UI.resolveIncident=id=>{const i=CS.incidents.find(x=>x.id===id);i.status='resolved';const s=CS.services.find(x=>x.name===i.component);if(s)s.status='ok';CS.log({kind:'platform',text:`Resolved incident: ${i.title}`});UI.render();};
UI.flag=(key,id,on)=>{const f=CS.flags.find(x=>x.key===key);if(on)f.on.push(id);else f.on=f.on.filter(x=>x!==id);
  const a=CS.accounts.find(x=>x.id===id||x.devs.some(d=>d.id===id));CS.log({kind:'platform',acct:a?.id,text:`Feature flag ${f.label} ${on?'enabled':'disabled'} for ${a?.id===id?a.name:id}`,customerVisible:false});UI.toast(`${f.label} ${on?'enabled':'disabled'}`);UI.render();};

// ---------- Compliance ----------
UI.screens.compliance=()=>{
  const act=can('compliance.act');
  const rows=CS.dsars.map(r=>{const left=30-r.receivedDays;return `<tr data-dsar="${r.id}"><td class="mono">${r.id}</td><td>${esc(acct(r.acct).name)}</td><td>${esc(r.kind)}</td><td class="mono">${esc(r.subject)}</td><td>${r.receivedDays}d ago</td><td>${r.status==='closed'?chip('Closed','ok'):chip(left<=7?`Due in ${left}d`:`${left}d left`,left<=7?'bad':'')}</td><td>${r.status==='open'&&act?btn('Mark fulfilled',`CSUI.closeDsar('${r.id}')`):''}</td></tr>`;});
  const inc=CS.complianceIncidents||[];
  return `<div class="page-head"><div><h1>Compliance</h1><p>GDPR data requests, retention and incidents. All data is hosted in the EU.</p></div></div>
  <div class="stack">${card('Data subject requests',tbl(['ID','Account','Type','Subject','Received','Deadline (1 month)',''],rows))}
  ${card('Compliance incidents',inc.length?tbl(['ID','Account','What','Opened','Status'],inc.map(i=>`<tr><td class="mono">${i.id}</td><td>${esc(acct(i.acct).name)}</td><td>${esc(i.what)}</td><td>${ago(i.at)}</td><td>${chip('Open · DPO notified','warn')}</td></tr>`)):'<div class="empty">No incidents. Containing an opted-out send from Data Doctor opens one here.</div>')}
  <div class="grid g2">${card('Retention',tbl(['Account','Retention period'],CS.accounts.map(a=>`<tr><td>${esc(a.name)}</td><td>${esc(CS.retention[a.id])}</td></tr>`)))}
  ${card('Data residency',`<dl class="kv"><dt>Product database</dt><dd>EU (decided)</dd><dt>Logs and errors</dt><dd>EU</dd><dt>Product analytics</dt><dd>EU, no personal data</dd><dt>Support inbox</dt><dd>EU</dd></dl><p class="muted small" style="margin-top:8px">Every new vendor must host in the EU.</p>`)}</div></div>`;
};
UI.closeDsar=id=>{const r=CS.dsars.find(x=>x.id===id);r.status='closed';CS.log({kind:'compliance',acct:r.acct,text:`Fulfilled ${r.kind.toLowerCase()} ${r.id}`});UI.toast('Request marked fulfilled');UI.render();};

// ---------- Staff & security ----------
UI.screens.staff=()=>{
  const isF=CS.current().role==='founder';
  const kinds=[...new Set(CS.staffLog.map(e=>e.kind))];
  const f=UI.view.log||'all';
  const log=CS.staffLog.filter(e=>f==='all'||e.kind===f);
  return `<div class="page-head"><div><h1>Staff &amp; security</h1><p>Separate admin app with SSO + MFA. Staff actions are logged here and can't be edited or deleted.</p></div></div>
  <div class="grid g2" style="margin-bottom:16px">
  ${card('Staff and roles',tbl(['Person','Role','Accounts owned'],CS.staff.map(s=>`<tr><td>${esc(s.name)}${s.id===CS.me?' <span class="muted small">(you)</span>':''}</td><td>${isF&&s.id!==CS.me?`<select aria-label="Role for ${esc(s.name)}" onchange="CSUI.setRole('${s.id}',this.value)">${Object.entries(CS.ROLE_LABEL).map(([k,l])=>`<option value="${k}" ${s.role===k?'selected':''}>${l}</option>`).join('')}</select>`:esc(CS.ROLE_LABEL[s.role])}</td><td>${CS.accounts.filter(a=>a.owner===s.id).map(a=>esc(a.name)).join(', ')||'<span class="muted">—</span>'}</td></tr>`)))}
  ${card('On-call rota (Slack)',`<p class="muted small" style="margin-bottom:8px">The on-call person gets the @mention for P1 alerts in #bricly-alerts and acknowledges within 15 minutes, including evenings and weekends.</p>
    ${CS.oncall.map((w,i)=>`<label class="field" style="margin-bottom:8px"><span>${w.label}</span><select ${isF||can('alerts.act')?'':'disabled'} onchange="CSUI.setOncall(${i},this.value)"><option value="">Not set</option>${CS.staff.filter(s=>['founder','cs','eng'].includes(s.role)).map(s=>`<option value="${s.id}" ${w.staff===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>`).join('')}`)}</div>
  ${card('Staff action log',`<div class="row" style="margin-bottom:10px"><div class="seg" role="group">${['all',...kinds].map(k=>`<button class="${f===k?'on':''}" aria-pressed="${f===k}" onclick="CSUI.view.log='${k}';CSUI.render()">${k==='all'?'All':k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div></div>
    ${tbl(['When','Staff','Account','Action','Reason','Approver',''],log.map(e=>`<tr data-log="${e.id}"><td>${ago(e.at)}</td><td>${esc(staffName(e.staff))}</td><td>${e.acct?esc(acct(e.acct).name):'—'}</td><td>${esc(e.text)}${e.changes?`<details><summary class="small">Changes</summary><ul class="changes small">${e.changes.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></details>`:''}</td><td>${esc(e.reason||'')}${e.ticket?` <span class="muted small">${esc(e.ticket)}</span>`:''}</td><td>${e.approver?esc(staffName(e.approver)):''}</td><td>${e.undo&&!e.undone&&can('ops.request')?btn('Undo',`CSUI.undo('${e.id}')`):e.undone?chip('Undone',''):''}</td></tr>`),'No staff actions yet.')}`)}`;
};
UI.setRole=(id,role)=>{const s=CS.staff.find(x=>x.id===id),prev=s.role;s.role=role;CS.log({kind:'security',text:`Changed ${s.name}'s role from ${CS.ROLE_LABEL[prev]} to ${CS.ROLE_LABEL[role]}`});UI.toast('Role updated');UI.render();};
UI.setOncall=(i,id)=>{CS.oncall[i].staff=id||null;CS.log({kind:'security',text:`On-call ${CS.oncall[i].label.toLowerCase()}: ${id?staffName(id):'not set'}`});UI.toast('On-call rota updated');UI.render();};
})();
