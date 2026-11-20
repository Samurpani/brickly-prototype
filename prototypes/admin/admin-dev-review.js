// Control Station: New development review. A developer submits the setup wizard and leaves;
// Bricly checks units, prices, floor plans and renders here, then marks it ready and the developer is told.
(function(){
const CS=window.CS,UI=window.CSUI,{esc,ago,can,acct,staffName}=CS;
const {chip,tbl,card,btn,bar}=UI;
const CHECKS=[['units','Units checked'],['prices','Prices checked'],['plans','Floor plans matched'],['renders','Renders tagged']];
const qGet=id=>CS.queue.find(q=>q.id===id);
const rvOf=q=>q&&q.review&&CS.reviews[q.review];
const mayWork=q=>can('queue.act')||q.assignee===CS.me;
const allChecked=r=>CHECKS.every(([k])=>r.checks[k]);
const owner=r=>acct(r.acct).seats.find(s=>s.role==='owner');
UI.view.drUnits=UI.view.drUnits||'flagged';

const unitFlags=(r,u)=>u.flags.filter(f=>!(f==='No floor plan'&&r.plansMatched));
const fileStatus=(r,f)=>{
  if(f.k==='plans'){const left=r.plansMatched?0:f.total-f.done;return [left?`${f.done} matched, ${left} not matched`:`All ${f.total} matched`,left?'warn':'ok'];}
  if(f.k==='int'||f.k==='ext'){const left=f.untagged&&!r.rendersTagged?f.untagged.length:0;return [left?`${f.total-left} tagged, ${left} not tagged`:`All ${f.total} tagged`,left?'warn':'ok'];}
  return [f.note||`${f.total} read`,'ok'];
};

UI.screens.devReview=id=>{
  const q=qGet(id),r=rvOf(q);
  if(!r)return `<div class="empty">Review not found. <a href="#/queue">Back to the queue</a></div>`;
  const a=acct(r.acct),done=q.status==='delivered',work=mayWork(q)&&!done,ready=allChecked(r);
  const flagged=r.units.filter(u=>unitFlags(r,u).length),f=UI.view.drUnits;
  const list=f==='flagged'?flagged:r.units;
  const own=owner(r);
  const unitRows=list.map(u=>{const fl=unitFlags(r,u);return `<tr data-unit="${u.id}"><td class="mono">${esc(u.id)}</td><td>${esc(u.type)}</td><td class="num">${u.m2} m²</td><td class="num">${u.price?'€'+u.price.toLocaleString('en-GB'):'<span class="muted">None</span>'}</td>
    <td>${u.plan||r.plansMatched?'Matched':'<span class="muted">None</span>'}</td><td>${fl.length?fl.map(x=>chip(x,x==='Missing price'?'bad':'warn')).join(' '):chip('OK','ok')}${u.dupRows?` <span class="muted small">${u.dupRows} rows in the list</span>`:''}</td></tr>`;});
  const fileRows=r.files.map(x=>{const [st,tone]=fileStatus(r,x);
    const extra=x.k==='plans'&&!r.plansMatched?x.unmatched.map(n=>`<div class="muted small">${esc(n)} · suggested ${esc(r.units.find(u=>u.suggested===n)?.id||'')}</div>`).join(''):
      x.untagged&&!r.rendersTagged?x.untagged.map(n=>`<div class="muted small">${esc(n)}</div>`).join(''):'';
    const act=!work?'':x.k==='plans'&&!r.plansMatched?btn('Use suggested units',`CSUI.drPlans('${id}')`):x.untagged&&!r.rendersTagged?btn('Tag renders',`CSUI.drTag('${id}')`):'';
    return `<tr data-file="${x.k}"><td><b>${esc(x.n)}</b><div class="muted small">${esc(x.f)}</div>${extra}</td><td>${chip(st,tone)}</td><td>${act}</td></tr>`;});
  const checks=CHECKS.map(([k,l])=>`<label class="check"><input type="checkbox" data-check="${k}" ${r.checks[k]?'checked':''} ${work?'':'disabled'} onchange="CSUI.drCheck('${id}','${k}',this.checked)"><span>${l}</span></label>`).join('');
  const msgs=r.messages.length?`<div class="list" style="margin-top:12px">${r.messages.map(m=>`<div><div class="row"><b>${esc(staffName(m.staff))}</b><span class="sp"></span><span class="muted small">${ago(m.at)}</span></div><div>${esc(m.text)}</div></div>`).join('')}</div>`:'';
  const status=done?chip('Ready · developer told','ok'):q.status==='requested'?chip('Waiting for review',''):chip('In review','info');
  return `<div class="page-head"><div><a class="small" href="#/queue">‹ Fulfilment queue</a><h1>Review ${esc(r.name)}</h1><p>${esc(a.name)} submitted this setup ${r.submittedH}h ago. Units are saved as drafts. Nothing is live.</p></div><span class="sp"></span>${status}</div>
  ${done?`<div class="note" style="margin-bottom:16px" data-ready-note>Marked ready by ${esc(staffName(r.readyBy))} ${ago(r.readyAt)}. ${esc(own?.name||'The developer')} was emailed at ${esc(r.email)}: “Your development is ready”.</div>`:''}
  <div class="grid g2" style="margin-bottom:16px">
    ${card('Setup answers',`<dl class="kv">${r.answers.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`)}
    ${card('Review checklist',`<div style="display:flex;flex-direction:column;gap:8px" data-checklist>${checks}</div>
      <div style="margin:12px 0 6px">${bar(CHECKS.filter(([k])=>r.checks[k]).length/CHECKS.length*100,ready?'':'warn')}</div>
      ${done?'':`<p class="muted small">${ready?'All checked. The developer gets an email and an in-app notification.':'Tick every item to mark it ready.'}</p>
      <div class="row" style="margin-top:8px">${btn('Mark ready and notify developer',`CSUI.drReady('${id}')`,{tone:'primary',dis:!work||!ready,sm:false,title:ready?'':'Tick every item first'})}${btn('Ask the developer a question',`CSUI.drAsk('${id}')`,{dis:!work,sm:false})}</div>`}${msgs}`)}
  </div>
  <div style="margin-bottom:16px">${card(`Units (${r.units.length})`,tbl(['Unit','Type','#Size','#Price','Floor plan','Flags'],unitRows,'No flagged units.'),
    `<div class="seg" role="group" aria-label="Units shown">${[['flagged',`Flagged (${flagged.length})`],['all','All']].map(([k,l])=>`<button class="${f===k?'on':''}" aria-pressed="${f===k}" onclick="CSUI.view.drUnits='${k}';CSUI.render()">${l}</button>`).join('')}</div>`)}</div>
  ${card('Files',tbl(['File','Status',''],fileRows))}`;
};

const touch=q=>{if(q.status==='requested'){q.status='in_production';if(!q.assignee)q.assignee=CS.me;}};
const log=(q,text)=>CS.log({kind:'queue',acct:q.acct,text:`${q.id} ${q.type}: ${text}`,customerVisible:false});
UI.drCheck=(id,k,on)=>{const q=qGet(id),r=rvOf(q);if(!r||!mayWork(q))return;touch(q);r.checks[k]=!!on;UI.render();};
UI.drPlans=id=>{const q=qGet(id),r=rvOf(q);touch(q);r.plansMatched=true;log(q,'3 floor plans matched to suggested units');UI.toast('3 floor plans matched');UI.render();};
UI.drTag=id=>{const q=qGet(id),r=rvOf(q);touch(q);r.rendersTagged=true;log(q,'interior renders tagged');UI.toast('Renders tagged');UI.render();};
UI.drReady=id=>{
  const q=qGet(id),r=rvOf(q);if(!r||!mayWork(q)||!allChecked(r)||q.status==='delivered')return;
  const own=owner(r),d=acct(r.acct).devs.find(x=>x.id===r.dev);
  touch(q);q.late=q.dueAt<Date.now();q.status='delivered';r.readyAt=Date.now();r.readyBy=CS.me;
  r.notified={to:own?.name,email:r.email,subject:'Your development is ready',at:Date.now()};
  if(d)Object.keys(d.ready).forEach(k=>d.ready[k]=true);
  log(q,'marked ready');
  CS.log({kind:'queue',acct:q.acct,text:`Emailed ${own?.name||'the developer'}: “Your development is ready” (${r.name})`});
  try{localStorage.setItem('bricly.devreview',JSON.stringify({status:'ready',name:r.name,at:new Date().toISOString()}));}catch(e){}
  UI.toast(`${r.name} is ready. ${own?.name||'The developer'} was emailed.`);UI.render();
};
UI.drAsk=id=>{
  const q=qGet(id),r=rvOf(q),own=owner(r);
  UI.dialog(`Ask about ${esc(r.name)}`,`<p class="muted">Goes to ${esc(own?.name||'the developer')} by email and in Bricly.</p>
    <label class="field"><span>Message</span><textarea id="drMsg" placeholder="For example: A-102 has no price. Should it be price on request?"></textarea></label><p class="err" id="drErr" role="alert"></p>`,
    `${btn('Cancel','CSUI.close()',{sm:false})}${btn('Send',`CSUI.drSend('${id}')`,{tone:'primary',sm:false})}`);
};
UI.drSend=id=>{
  const q=qGet(id),r=rvOf(q),t=UI.val('drMsg');
  if(!t){document.getElementById('drErr').textContent='Write a message first.';return;}
  touch(q);r.messages.push({staff:CS.me,text:t,at:Date.now()});
  CS.log({kind:'queue',acct:q.acct,text:`Question sent to ${owner(r)?.name||'the developer'} about ${r.name}`});
  UI.close();UI.toast('Question sent');UI.render();
};
})();
