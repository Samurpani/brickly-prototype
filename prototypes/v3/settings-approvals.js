// Settings › Approvals: which requests need a manager's OK, per team and per person, plus who approves and when it escalates.
// Same patterns as Roles and permissions: a click-to-edit matrix that saves through the Save bar, and drawers for a whole team or person.
(function(){
const X=window.BST; if(!X||!X.team) return;
const P=X.pages,D=X.dialogs,{MEMBERS,fullName,memberBy}=X.team;
const esc=v=>typeof xesc==='function'?xesc(String(v??'')):String(v??'');

// The five requests the CRM raises (see approvals.js AP_TYPES).
const TYPES=[
  {k:'hold',l:'Hold',d:'Take a unit off the market for a buyer'},
  {k:'reservation',l:'Reservation',d:'Reserve a unit against a deposit'},
  {k:'price',l:'Offer below asking price',d:'Accept an offer under the asking price',threshold:true},
  {k:'returning',l:'Returning lead',d:'A lost or cold buyer comes back'},
  {k:'takeover',l:'Lead takeover',d:'Take over another rep’s lead'},
];
const RULE={
  approve:{l:'Approval',d:'Their approver decides each one',tone:'warn'},
  auto:{l:'No approval',d:'Goes straight through and is logged',tone:'pri'},
  over:{l:'Over limit',d:'Only when it’s above the team’s price limit',tone:'info'},
};
const levelsFor=t=>t.threshold?['approve','over','auto']:['approve','auto'];
const ESCALATE_AFTER=['1 hour','2 hours','4 hours','8 hours','1 working day','Never'];
const PRESETS={
  'New rep · everything needs approval':{hold:'approve',reservation:'approve',price:'approve',returning:'approve',takeover:'approve'},
  'Trusted rep · holds and reservations go straight through':{hold:'auto',reservation:'auto'},
};

// ---------- Model ----------
const owner=()=>MEMBERS.find(m=>m.role==='Owner');
const reps=()=>MEMBERS.filter(m=>m.role==='Sales Rep'&&m.status!=='Deactivated');
// A team is everyone who reports to the same person; every Sales Manager has one even when empty.
const teamNames=()=>[...new Set([...MEMBERS.filter(m=>m.role==='Sales Manager'&&m.status!=='Deactivated').map(fullName),...reps().map(m=>m.reportsTo).filter(Boolean)])];
const teamOf=m=>m.reportsTo||'';
const TEAM={};
const teamCfg=name=>TEAM[name]||(TEAM[name]={approver:name,backup:'',after:'4 hours',to:owner()?fullName(owner()):'',limitPct:'2',limitEur:'5,000',rules:{hold:'approve',reservation:'approve',price:'approve',returning:'approve',takeover:'approve'}});
teamCfg('Rachel Mifsud');
Object.assign(teamCfg('Paul Grech'),{backup:'Rachel Mifsud',after:'2 hours',rules:{hold:'approve',reservation:'approve',price:'over',returning:'auto',takeover:'approve'}});
const byName=n=>MEMBERS.find(m=>fullName(m)===n);
const REP={};
[['Karl Zammit',{hold:'auto',reservation:'auto'}],['Matthew Vella',{hold:'auto'}],['Sarah Azzopardi',{hold:'auto',takeover:'auto'}]].forEach(([n,r])=>{const m=byName(n);if(m)REP[m.id]=r;});

const tKey=(team,t)=>`ap:team:${team}:${t}`, rKey=(id,t)=>`ap:rep:${id}:${t}`;
const teamSaved=(team,t)=>stSaved[tKey(team,t)]??teamCfg(team).rules[t];
const teamVal=(team,t)=>tKey(team,t) in stEdits?stEdits[tKey(team,t)]:teamSaved(team,t);
// A person's own setting: 'default' means they follow the team.
const repSaved=(id,t)=>stSaved[rKey(id,t)]??REP[id]?.[t]??'default';
const repVal=(id,t)=>rKey(id,t) in stEdits?stEdits[rKey(id,t)]:repSaved(id,t);
const repEffective=(m,t)=>{const v=repVal(m.id,t);return v==='default'?teamVal(teamOf(m),t):v;};
const label=(t,v,team)=>v==='over'?`Over ${teamCfg(team).limitPct}%`:RULE[v].l;
const commitRep=(id,t,v)=>{stSaved[rKey(id,t)]=v;delete stEdits[rKey(id,t)];};
const hasOverrides=id=>TYPES.some(t=>repSaved(id,t.k)!=='default');

// Members drawer reads and writes through these, so "Approval rules" on a profile and this page stay in sync.
X.apRepSummary=id=>{
  if(!hasOverrides(id))return 'Team default';
  const match=Object.entries(PRESETS).find(([,p])=>TYPES.every(t=>repSaved(id,t.k)===(p[t.k]||'default')));
  return match?match[0]:'Custom · set in Approvals';
};
X.apApplyPreset=(id,name)=>{
  if(!name||name.startsWith('Custom'))return;
  const p=PRESETS[name]||{};
  TYPES.forEach(t=>commitRep(id,t.k,name==='Team default'?'default':(p[t.k]||'default')));
};

// Plain-English differences from the team, e.g. "Hold: No approval". Used here and on the member drawer.
X.apRepDiff=id=>{const m=memberBy(id),team=m?teamOf(m):'';return TYPES.filter(t=>repSaved(id,t.k)!=='default').map(t=>`${t.l}: ${label(t.k,repSaved(id,t.k),team)}`);};

// ---------- Rules table: one row per request ----------
const teamLabel=team=>`${team}’s team`;
const limitText=team=>{const c=teamCfg(team);return `Over ${c.limitPct}% or €${c.limitEur} below asking`;};
const exceptionsFor=k=>reps().filter(m=>repSaved(m.id,k)!=='default');
function whoNeeds(t){
  const teams=teamNames(),need=teams.filter(team=>teamSaved(team,t.k)!=='auto'),n=exceptionsFor(t.k).length;
  const more=n?`<span class="st-sub">${n} ${n===1?'person has':'people have'} an exception</span>`:'';
  if(!need.length)return `<span class="apx-mu">Nobody</span>${more}`;
  if(need.length===teams.length&&need.every(team=>teamSaved(team,t.k)==='approve'))return `Every sales rep${more}`;
  return need.map(team=>`<span class="apx-line">${esc(teamLabel(team))}${teamSaved(team,t.k)==='over'?' <span class="apx-mu">above the limit</span>':''}</span>`).join('')+more;
}
function whoApproves(t){
  const need=teamNames().filter(team=>teamSaved(team,t.k)!=='auto');
  if(!need.length)return '<span class="apx-mu">—</span>';
  const names=[...new Set(need.map(team=>teamCfg(team).approver))];
  return `${names.map(n=>`<span class="apx-line">${esc(n)}</span>`).join('')}<span class="st-sub">Each team’s approver</span>`;
}
function limitCell(t){
  if(!t.threshold)return '<span class="apx-mu">No limit</span>';
  const need=teamNames().filter(team=>teamSaved(team,t.k)!=='auto');
  if(!need.length)return '<span class="apx-mu">—</span>';
  const many=need.length>1;
  return need.map(team=>`<span class="apx-line">${many?`<span class="apx-mu">${esc(team.split(' ')[0])}:</span> `:''}${teamSaved(team,t.k)==='over'?esc(limitText(team)):'Every offer'}</span>`).join('');
}
function rulesHtml(ro){
  return `<div class="pm-scroll"><table class="apx-table"><thead><tr><th scope="col">Request</th><th scope="col">Who needs approval</th><th scope="col">Who approves</th><th scope="col">Limit</th><th scope="col"><span class="pa-sr">Edit</span></th></tr></thead>
    <tbody>${TYPES.map(t=>`<tr data-type="${t.k}"><th scope="row"><b>${esc(t.l)}</b><span class="st-sub">${esc(t.d)}</span></th><td>${whoNeeds(t)}</td><td>${whoApproves(t)}</td><td>${limitCell(t)}</td>
      <td class="apx-act"><button type="button" class="st-link" onclick="stApRuleOpen('${t.k}')" aria-label="${ro?'View':'Edit'} ${esc(t.l)}">${ro?'View':'Edit'}</button></td></tr>`).join('')}</tbody></table></div>`;
}

// ---------- Exceptions for specific people ----------
function exceptionsHtml(ro){
  const focus=X.focus?.page==='approvals'?memberBy(X.focus.id):null;
  const rows=focus?[focus]:reps().filter(m=>hasOverrides(m.id));
  const bar=focus?`<div class="apx-filter"><span>Showing <b>${esc(fullName(focus))}</b></span><button type="button" class="st-link" onclick="stApFocusClear()">Show everyone</button></div>`:'';
  if(!rows.length)return `${bar}<div class="apx-empty">Nobody has an exception. Everyone follows their team.</div>`;
  return `${bar}<div class="pm-scroll"><table class="apx-table apx-ex"><thead><tr><th scope="col">Person</th><th scope="col">Team</th><th scope="col">Set differently</th><th scope="col"><span class="pa-sr">Edit</span></th></tr></thead>
    <tbody>${rows.map(m=>{const diff=X.apRepDiff(m.id);return `<tr class="${focus?'focus':''}" data-person="${m.id}"><th scope="row"><b>${esc(fullName(m))}</b></th><td>${teamOf(m)?esc(teamLabel(teamOf(m))):'<span class="apx-mu">No team</span>'}</td>
      <td>${diff.length?`<span class="apx-chips">${diff.map(d=>`<span class="st-chip t-info">${esc(d)}</span>`).join('')}</span>`:'<span class="apx-mu">No exception yet. Follows the team default.</span>'}</td>
      <td class="apx-act"><button type="button" class="st-link" onclick="stApRepOpen('${m.id}')">${ro?'View':diff.length?'Edit':'Add exception'}</button></td></tr>`;}).join('')}</tbody></table></div>`;
}
// Settings › Team links here: open Approvals on that person's exception, and start one if they have none.
window.stApFocus=id=>{
  const m=memberBy(id);if(!m)return;
  if(typeof qaDrawerClose==='function')qaDrawerClose();
  if(typeof go==='function')go('settings');
  stGo('p:approvals');
  if(stPage!=='approvals')return;
  X.focus={page:'approvals',id};stRender();
  // Scroll only the page content, never the app shell.
  const row=document.querySelector(`#st-root tr[data-person="${id}"]`),c=document.getElementById('content');
  if(row&&c)c.scrollTop+=row.getBoundingClientRect().top-c.getBoundingClientRect().top-c.clientHeight/3;
  if(!hasOverrides(id)&&stAccess('approvals')==='f')stApRepOpen(id);
};
window.stApFocusClear=()=>{X.focus=null;stRender();};
let addPick='';
window.stApExceptionAdd=()=>{
  const free=reps().filter(m=>!hasOverrides(m.id));
  addPick='';
  const render=()=>{document.getElementById('qaDrawerBody').innerHTML=free.length?`${pick('ap-add','Person',free.map(fullName),addPick,v=>`stApExceptionPick(${esc(JSON.stringify(v))})`,'Select a person')}<div class="au-hint">Only people without an exception are listed.</div><div id="au-error" class="au-error" role="alert"></div>`:'<div class="au-hint">Everyone already has an exception. Edit theirs from the list.</div>';};
  qaDrawerOpen('Add an exception','',`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button>${free.length?'<button class="btn-primary" onclick="stApExceptionNext()">Continue</button>':''}`);
  render();window.stApExceptionPick=v=>{addPick=v;setTimeout(render);};
};
window.stApExceptionNext=()=>{const m=byName(addPick);if(!m){document.getElementById('au-error').textContent='Select a person';return;}stApRepOpen(m.id);};

// ---------- Teams: who approves and when it escalates ----------
function teamsHtml(){
  return `<div class="pm-scroll"><table class="apx-table"><thead><tr><th scope="col">Team</th><th scope="col">Approver</th><th scope="col">When they’re away</th><th scope="col">If nobody decides</th><th scope="col"><span class="pa-sr">Edit</span></th></tr></thead>
    <tbody>${teamNames().map(team=>{const c=teamCfg(team),n=reps().filter(m=>teamOf(m)===team).length;return `<tr><th scope="row"><b>${esc(teamLabel(team))}</b><span class="st-sub">${n} ${n===1?'person':'people'}</span></th><td>${esc(c.approver)}</td><td>${c.backup?esc(c.backup):'<span class="apx-mu">Nobody</span>'}</td><td>${c.after==='Never'?'<span class="apx-mu">Waits</span>':`Goes to ${esc(c.to)} after ${esc(c.after)}`}</td><td class="apx-act"><button type="button" class="st-link" onclick="stApTeamOpen(${esc(JSON.stringify(team))})">Edit</button></td></tr>`;}).join('')}</tbody></table></div>`;
}

// ---------- Rule drawer: one request across every team ----------
let ruleDraft=null;
function ruleBody(){
  const t=TYPES.find(x=>x.k===ruleDraft.k),ex=exceptionsFor(t.k);
  return `<div class="au-hint apx-d">${esc(t.d)}.</div>
    <div class="au-sec">Who needs approval</div>
    ${teamNames().map(team=>{const v=ruleDraft.rules[team],c=teamCfg(team),lim=ruleDraft.limits[team];return `<div class="rd-row"><div class="rd-l">${esc(teamLabel(team))}<span>Approver ${esc(c.approver)}</span></div>${seg(teamLabel(team),levelsFor(t),v,x=>`stApRuleSet(${esc(JSON.stringify(team))},'${x}')`,x=>x==='over'?'Over limit':RULE[x].l)}</div>
      ${t.threshold&&v==='over'?`<div class="ap-limit"><div class="au-two"><div class="od-field"><label for="apr-pct-${esc(team.split(' ')[0])}">% below asking</label><input id="apr-pct-${esc(team.split(' ')[0])}" inputmode="decimal" value="${esc(lim.pct)}" oninput="stApRuleLimit(${esc(JSON.stringify(team))},'pct',this.value)"></div><div class="od-field"><label for="apr-eur-${esc(team.split(' ')[0])}">€ below asking</label><div class="nf-currency"><span aria-hidden="true">€</span><input id="apr-eur-${esc(team.split(' ')[0])}" inputmode="numeric" value="${esc(lim.eur)}" oninput="this.value=oppFmtDigits(this.value);stApRuleLimit(${esc(JSON.stringify(team))},'eur',this.value)"></div></div></div><div class="au-hint">Offers within the limit go straight through. Whichever is lower applies.</div></div>`:''}`;}).join('')}
    <div class="au-hint">Approvers and escalation are set per team in Teams.</div>
    <div class="au-sec">Exceptions</div>
    ${ex.length?`<div class="au-people">${ex.map(m=>`<button type="button" class="au-person" onclick="stApRepOpen('${m.id}')"><span class="au-av sm">${esc((m.first[0]+(m.last[0]||'')).toUpperCase())}</span>${esc(fullName(m))} · ${esc(label(t.k,repSaved(m.id,t.k),teamOf(m)))}</button>`).join('')}</div>`:'<div class="au-hint">Nobody has an exception for this request.</div>'}
    <div id="au-error" class="au-error" role="alert"></div>`;
}
function ruleRender(){
  const body=document.getElementById('qaDrawerBody'),scroll=body.scrollTop;
  body.innerHTML=ruleBody();body.scrollTop=scroll;
  const ro=stAccess('approvals')!=='f';
  document.getElementById('qaDrawerFoot').innerHTML=ro?`<button class="btn-primary" onclick="qaDrawerClose()">Close</button>`:`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="stApRuleSave()">Save</button>`;
  if(ro)body.querySelectorAll('.rd-seg button,input').forEach(b=>{b.disabled=true;});
}
window.stApRuleOpen=k=>{
  const t=TYPES.find(x=>x.k===k);if(!t)return;
  ruleDraft={k,rules:Object.fromEntries(teamNames().map(team=>[team,teamSaved(team,k)])),limits:Object.fromEntries(teamNames().map(team=>[team,{pct:teamCfg(team).limitPct,eur:teamCfg(team).limitEur}]))};
  qaDrawerOpen(t.l,'','');ruleRender();
};
window.stApRuleSet=(team,v)=>{ruleDraft.rules[team]=v;ruleRender();};
window.stApRuleLimit=(team,k,v)=>{ruleDraft.limits[team][k]=v;};
window.stApRuleSave=()=>{
  const t=TYPES.find(x=>x.k===ruleDraft.k),err=document.getElementById('au-error');
  const bad=teamNames().find(team=>ruleDraft.rules[team]==='over'&&!(parseFloat(ruleDraft.limits[team].pct)>0)&&!String(ruleDraft.limits[team].eur).replace(/\D/g,''));
  if(bad){err.textContent=`Set a percentage or euro limit for ${teamLabel(bad)}`;return;}
  let n=0;
  teamNames().forEach(team=>{
    if(ruleDraft.rules[team]!==teamSaved(team,t.k))n++;
    stSaved[tKey(team,t.k)]=ruleDraft.rules[team];delete stEdits[tKey(team,t.k)];
    if(t.threshold)Object.assign(teamCfg(team),{limitPct:ruleDraft.limits[team].pct,limitEur:ruleDraft.limits[team].eur});
  });
  qaDrawerClose();stRender();
  showToast(n?`${t.l} saved. Applies from the next request.`:`${t.l} saved.`);
};

// ---------- Team drawer ----------
let tDraft=null;
const approverOptions=()=>MEMBERS.filter(m=>['Owner','Admin','Sales Manager'].includes(m.role)&&m.status==='Active').map(fullName);
function seg(name,levels,cur,onclick,text){return `<div class="rd-seg" role="radiogroup" aria-label="${esc(name)}">${levels.map(v=>`<button type="button" role="radio" aria-checked="${v===cur}" class="${v===cur?'on':''}" onclick="${onclick(v)}">${esc(text(v))}</button>`).join('')}</div>`;}
function pick(id,label,options,value,onPick,placeholder='Select'){
  return `<div class="od-field"><label id="${id}-l">${label}</label><details class="nf-picker${value?'':' is-empty'}" id="${id}"><summary aria-labelledby="${id}-l">${esc(value||placeholder)}</summary><div class="nf-menu">${fdGroup(label,options,v=>v===value,v=>onPick(v),{radio:true,text:v=>esc(v)})}</div></details></div>`;
}
function teamBody(){
  const d=tDraft,members=reps().filter(m=>teamOf(m)===d.team);
  return `<div class="au-sec">Who approves</div>
    ${pick('ap-approver','Approver',approverOptions(),d.approver,v=>`stApTeamSet('approver',${esc(JSON.stringify(v))})`)}
    ${pick('ap-backup','When they’re away',['Nobody',...approverOptions().filter(n=>n!==d.approver)],d.backup||'Nobody',v=>`stApTeamSet('backup',${esc(JSON.stringify(v))})`)}
    <div class="au-hint ap-hint">Requests go to the backup while the approver is marked away.</div>
    <div class="au-two">${pick('ap-after','If nobody decides within',ESCALATE_AFTER,d.after,v=>`stApTeamSet('after',${esc(JSON.stringify(v))})`)}${d.after==='Never'?'':pick('ap-to','Then send it to',approverOptions().filter(n=>n!==d.approver),d.to,v=>`stApTeamSet('to',${esc(JSON.stringify(v))})`)}</div>
    <div class="au-sec">What needs approval</div>
    ${TYPES.map(t=>`<div class="rd-row"><div class="rd-l">${esc(t.l)}<span>${esc(t.d)}</span></div>${seg(t.l,levelsFor(t),d.rules[t.k],v=>`stApTeamRule('${t.k}','${v}')`,v=>v==='over'?'Over limit':RULE[v].l)}</div>`).join('')}
    ${d.rules.price==='over'?`<div class="ap-limit"><div class="au-hint">Offers within this limit go straight through. Above it, the approver decides.</div><div class="au-two"><div class="od-field"><label for="ap-pct">% below asking</label><input id="ap-pct" inputmode="decimal" value="${esc(d.limitPct)}" oninput="stApTeamSet('limitPct',this.value,true)"></div><div class="od-field"><label for="ap-eur">€ below asking</label><div class="nf-currency"><span aria-hidden="true">€</span><input id="ap-eur" inputmode="numeric" value="${esc(d.limitEur)}" oninput="this.value=oppFmtDigits(this.value);stApTeamSet('limitEur',this.value,true)"></div></div></div><div class="au-hint">Whichever is lower applies.</div></div>`:''}
    <div class="au-sec">People on this team</div>
    ${members.length?`<div class="au-people">${members.map(m=>`<button type="button" class="au-person" onclick="stApRepOpen('${m.id}')"><span class="au-av sm">${esc((m.first[0]+(m.last[0]||'')).toUpperCase())}</span>${esc(fullName(m))}${hasOverrides(m.id)?' · custom':''}</button>`).join('')}</div><div class="au-hint">People marked custom keep their own rules for those requests.</div>`:'<div class="au-hint">Nobody reports to them yet. Set “Reports to” on a person in Members.</div>'}
    <div id="au-error" class="au-error" role="alert"></div>`;
}
function teamRender(){
  const body=document.getElementById('qaDrawerBody'),scroll=body.scrollTop;
  body.innerHTML=teamBody();body.scrollTop=scroll;
  const ro=stAccess('approvals')!=='f';
  document.getElementById('qaDrawerFoot').innerHTML=ro?`<button class="btn-primary" onclick="qaDrawerClose()">Close</button>`:`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="stApTeamSave()">Save team rules</button>`;
  if(ro)body.querySelectorAll('button,input').forEach(b=>{if(!b.closest('.au-people'))b.disabled=true;});
}
window.stApTeamOpen=team=>{
  const c=teamCfg(team);
  tDraft={team,...structuredClone({approver:c.approver,backup:c.backup,after:c.after,to:c.to,limitPct:c.limitPct,limitEur:c.limitEur}),rules:Object.fromEntries(TYPES.map(t=>[t.k,teamVal(team,t.k)]))};
  qaDrawerOpen(`${team}’s team · approvals`,'','');teamRender();
};
window.stApTeamSet=(k,v,quiet)=>{tDraft[k]=k==='backup'&&v==='Nobody'?'':v;if(!quiet)setTimeout(teamRender);};
window.stApTeamRule=(t,v)=>{tDraft.rules[t]=v;teamRender();};
window.stApTeamSave=()=>{
  const d=tDraft,err=document.getElementById('au-error');
  if(d.rules.price==='over'&&!(parseFloat(d.limitPct)>0)&&!d.limitEur.replace(/\D/g,'')){err.textContent='Set a percentage or euro limit for offers below asking price';return;}
  if(d.after!=='Never'&&!d.to){err.textContent='Choose who requests escalate to';return;}
  const c=teamCfg(d.team);
  Object.assign(c,{approver:d.approver,backup:d.backup,after:d.after,to:d.to,limitPct:d.limitPct,limitEur:d.limitEur});
  TYPES.forEach(t=>{stSaved[tKey(d.team,t.k)]=d.rules[t.k];delete stEdits[tKey(d.team,t.k)];});
  if(!Object.keys(stEdits).length)stDirty=false;
  const n=reps().filter(m=>teamOf(m)===d.team).length;
  qaDrawerClose();stRender();
  showToast(`${d.team}’s team saved. Applies to ${n} ${n===1?'person':'people'} from their next request.`);
};

// ---------- Person drawer ----------
let rDraft=null;
function repBody(){
  const m=memberBy(rDraft.id),team=teamOf(m),c=team?teamCfg(team):null;
  return `<div class="au-card"><span class="au-av">${esc((m.first[0]+(m.last[0]||'')).toUpperCase())}</span><div class="au-card-t"><b>${esc(fullName(m))}</b><span>${team?`${esc(team)}’s team · approver ${esc(c.approver)}`:'No team · set “Reports to” in Members'}</span></div></div>
    <div class="od-field"><label>Quick set</label><div class="rd-seg ap-presets">${['Team default',...Object.keys(PRESETS)].map(p=>`<button type="button" onclick="stApRepPreset(${esc(JSON.stringify(p))})" title="${esc(p)}">${esc(p.split(' · ')[0])}</button>`).join('')}</div><div class="au-hint">Fills the rules below. Nothing changes until you save.</div></div>
    <div class="au-sec">What needs approval</div>
    ${TYPES.map(t=>{const v=rDraft.rules[t.k];return `<div class="rd-row${v!=='default'?' chg':''}"><div class="rd-l">${esc(t.l)}<span>${v==='default'?`Team default · ${esc(label(t.k,teamVal(team,t.k),team))}`:'Set for this person'}</span></div>${seg(t.l,['default',...levelsFor(t)],v,x=>`stApRepRule('${t.k}','${x}')`,x=>x==='default'?'Team':x==='over'?'Over limit':RULE[x].l)}</div>`;}).join('')}
    ${team?`<div class="au-hint">Team rules, the approver and escalation are set on <button type="button" class="au-link" onclick="stApTeamOpen(${esc(JSON.stringify(team))})">${esc(team)}’s team</button>.</div>`:''}`;
}
function repRender(){
  const body=document.getElementById('qaDrawerBody'),scroll=body.scrollTop;
  body.innerHTML=repBody();body.scrollTop=scroll;
  const ro=stAccess('approvals')!=='f';
  document.getElementById('qaDrawerFoot').innerHTML=ro?`<button class="btn-primary" onclick="qaDrawerClose()">Close</button>`:`<button class="btn-ghost" onclick="stApRepPreset('Team default')">Reset to team default</button><span class="au-spacer"></span><button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="stApRepSave()">Save rules</button>`;
  if(ro)body.querySelectorAll('.rd-seg button').forEach(b=>{b.disabled=true;});
}
window.stApRepOpen=id=>{rDraft={id,rules:Object.fromEntries(TYPES.map(t=>[t.k,repVal(id,t.k)]))};qaDrawerOpen(`${fullName(memberBy(id))} · approvals`,'','');repRender();};
window.stApRepRule=(t,v)=>{rDraft.rules[t]=v;repRender();};
window.stApRepPreset=name=>{const p=PRESETS[name]||{};TYPES.forEach(t=>{rDraft.rules[t.k]=p[t.k]||'default';});repRender();};
window.stApRepSave=()=>{
  const m=memberBy(rDraft.id);
  TYPES.forEach(t=>commitRep(m.id,t.k,rDraft.rules[t.k]));
  m.approvals=X.apRepSummary(m.id);
  if(!Object.keys(stEdits).length)stDirty=false;
  qaDrawerClose();stRender();
  showToast(`${fullName(m)}’s approval rules saved. They apply from their next request.`);
};

// ---------- Apply a preset to several people ----------
let pDraft=null;
function presetBody(){
  const all=reps(),names=all.map(fullName);
  return `${pick('ap-preset','Preset',['Team default',...Object.keys(PRESETS)],pDraft.preset,v=>`stApPresetSet('preset',${esc(JSON.stringify(v))})`,'Select a preset')}
    ${pDraft.preset?`<div class="au-hint ap-hint">${pDraft.preset==='Team default'?'Removes their own rules so they follow their team.':esc(TYPES.map(t=>{const v=PRESETS[pDraft.preset][t.k];return `${t.l}: ${v?RULE[v].l:'team default'}`;}).join(' · '))}</div>`:''}
    <div class="od-field"><label id="ap-people-l">People</label><details class="nf-picker${pDraft.people.length?'':' is-empty'}" id="ap-people" ${pDraft.open?'open':''}><summary aria-labelledby="ap-people-l">${esc(pDraft.people.length?pDraft.people.join(', '):'Select people')}</summary><div class="nf-menu">${fdGroup('People',names,n=>pDraft.people.includes(n),n=>`stApPresetPerson(${esc(JSON.stringify(n))})`)}</div></details></div>
    <div id="au-error" class="au-error" role="alert"></div>`;
}
const presetRender=()=>{document.getElementById('qaDrawerBody').innerHTML=presetBody();};
window.stApPresetOpen=()=>{pDraft={preset:'',people:[],open:false};qaDrawerOpen('Apply a preset','',`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="stApPresetApply()">Apply preset</button>`);presetRender();};
window.stApPresetSet=(k,v)=>{pDraft[k]=v;pDraft.open=false;setTimeout(presetRender);};
window.stApPresetPerson=n=>{pDraft.people=pDraft.people.includes(n)?pDraft.people.filter(x=>x!==n):[...pDraft.people,n];pDraft.open=true;setTimeout(presetRender);};
window.stApPresetApply=()=>{
  const err=document.getElementById('au-error');
  if(!pDraft.preset){err.textContent='Select a preset';return;}
  if(!pDraft.people.length){err.textContent='Select at least one person';return;}
  pDraft.people.map(byName).forEach(m=>{X.apApplyPreset(m.id,pDraft.preset);m.approvals=X.apRepSummary(m.id);});
  qaDrawerClose();stRender();
  showToast(`${pDraft.preset.split(' · ')[0]} applied to ${pDraft.people.length} ${pDraft.people.length===1?'person':'people'}.`);
};
D.apreset={t:'Reset everyone to team defaults?',ok:'Reset everyone',danger:true,b:[{k:'note',tone:'warn',text:'Every person’s own rules are removed, so they follow their team. Team rules, approvers and escalation stay as they are.'}],
  run:()=>{reps().forEach(m=>{TYPES.forEach(t=>commitRep(m.id,t.k,'default'));m.approvals='Team default';});},done:'Everyone now follows their team’s rules.'};

// ---------- Page ----------
const ap=P.approvals;
ap.d='Which requests need a manager’s approval. Each team has defaults; a person can differ where it matters.';
ap.acts=[];
ap.menu=[['Apply a preset to people','f:stApPresetOpen'],['Reset everyone to team defaults','d:apreset','danger'],['History','s:Opening the audit log filtered to Approvals']];
ap.ban=[{tone:'neu',text:'Requests already waiting keep their original route. Turning approval off never removes audit records or queue positions.'}];
ap.b=[
  {k:'custom',title:'Rules',desc:'What needs approval for each team, and who decides.',render:ro=>rulesHtml(ro)},
  {k:'custom',title:'Exceptions for specific people',desc:'People whose rules differ from their team.',link:['Add exception','f:stApExceptionAdd'],render:ro=>exceptionsHtml(ro)},
  {k:'custom',title:'Teams',desc:'Who approves for each team, and where requests go if nobody decides.',render:()=>teamsHtml()},
];
// Saved rule for one person, read by the opportunity (opp-offer.js). 'price' is "Offer below asking price".
window.stApPolicy=(repName,t)=>{
  const n=String(repName||'').trim().toLowerCase(), m=MEMBERS.find(x=>fullName(x).toLowerCase()===n)||MEMBERS.find(x=>fullName(x).split(' ')[0].toLowerCase()===n);
  if(!m) return null;
  const own=repSaved(m.id,t), team=teamOf(m)||fullName(m), c=teamCfg(team);
  return {rule:own==='default'?teamSaved(team,t):own,limitPct:parseFloat(c.limitPct)||0,limitEur:+String(c.limitEur||'').replace(/\D/g,'')||0,approver:c.approver||team};
};
})();
