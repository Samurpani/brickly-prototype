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
  {k:'price',l:'Price exception',d:'Sell below the list price',threshold:true},
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

// ---------- Matrix ----------
function cellBtn(kind,id,t,v,inherited,ro,team){
  const tone=RULE[v].tone,chg=(kind==='team'?tKey(id,t.k):rKey(id,t.k)) in stEdits;
  return `<span class="pm-w"><button type="button" class="pm-cell${chg?' chg':''}${inherited?' inh':''}" ${ro?'disabled':''} aria-label="${esc(t.l)}: ${esc(label(t.k,v,team))}${inherited?' (team default)':''}" title="${inherited?'Follows the team default':esc(RULE[v].d)}" onclick="stApCell(this,'${kind}',${esc(JSON.stringify(id))},'${t.k}')"><span class="st-chip t-${tone}">${esc(label(t.k,v,team))}</span></button></span>`;
}
function matrixHtml(ro){
  const changes=Object.keys(stEdits).filter(k=>k.startsWith('ap:')).length;
  const rows=teamNames().map(team=>{
    const c=teamCfg(team),members=reps().filter(m=>teamOf(m)===team);
    return `<tr class="pm-g"><th colspan="${TYPES.length+1}" scope="colgroup"><span class="ap-team-h"><button type="button" class="ap-team" onclick="stApTeamOpen(${esc(JSON.stringify(team))})">${esc(team)}’s team</button><span>Approver ${esc(c.approver)}${c.backup?` · backup ${esc(c.backup)}`:''}${c.after!=='Never'?` · escalates to ${esc(c.to)} after ${esc(c.after)}`:''}</span></span></th></tr>
      <tr class="ap-default"><th scope="row" class="pm-cap"><b>Team default</b><span>${members.length} ${members.length===1?'person follows':'people follow'} it unless set below</span></th>${TYPES.map(t=>`<td>${cellBtn('team',team,t,teamVal(team,t.k),false,ro,team)}</td>`).join('')}</tr>
      ${members.map(m=>`<tr><th scope="row" class="pm-cap"><button type="button" class="ap-person" onclick="stApRepOpen('${m.id}')">${esc(fullName(m))}</button>${hasOverrides(m.id)||TYPES.some(t=>rKey(m.id,t.k) in stEdits)?'<span>Custom</span>':''}</th>${TYPES.map(t=>{const own=repVal(m.id,t.k);return `<td>${cellBtn('rep',m.id,t,repEffective(m,t.k),own==='default',ro,team)}</td>`;}).join('')}</tr>`).join('')}`;
  }).join('');
  return `<div class="pm-help">${ro?'You can view who needs approval for what.':'Click a cell to change one rule. Faded cells follow their team default. Click a team or person to edit everything at once.'}${changes?` <b>${changes} unsaved change${changes===1?'':'s'}.</b>`:''}</div>
    <div class="pm-scroll"><table class="pm-table ap-table"><thead><tr><th scope="col" class="pm-cap">Who</th>${TYPES.map(t=>`<th scope="col" title="${esc(t.d)}">${esc(t.l)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function legendHtml(){
  return `<div class="ap-legend">${Object.entries(RULE).map(([k,r])=>`<span><span class="st-chip t-${r.tone}">${esc(k==='over'?'Over 2%':r.l)}</span>${esc(r.d)}</span>`).join('')}</div>`;
}
window.stApCell=(btn,kind,id,t)=>{
  const w=btn.parentElement,open=w.querySelector('.st-fmenu');
  document.querySelectorAll('#st-root .st-fmenu').forEach(m=>m.remove());
  if(open)return;
  const type=TYPES.find(x=>x.k===t);
  let opts,cur,saved,team;
  if(kind==='team'){team=id;opts=levelsFor(type);cur=teamVal(id,t);saved=teamSaved(id,t);}
  else{const m=memberBy(id);team=teamOf(m);opts=['default',...levelsFor(type)];cur=repVal(id,t);saved=repSaved(id,t);}
  const text=v=>v==='default'?`Team default · ${label(t,teamVal(team,t),team)}`:label(t,v,team);
  const desc=v=>v==='default'?'Follows the team. Changes when the team changes':v==='over'?`Above ${teamCfg(team).limitPct}% or €${teamCfg(team).limitEur} below list`:RULE[v].d;
  w.insertAdjacentHTML('beforeend',`<span class="st-fmenu pm-pop" role="listbox" aria-label="${esc(type.l)}">${opts.map(v=>`<button type="button" role="option" aria-selected="${v===cur}" onclick="stApSet('${kind}',${esc(JSON.stringify(id))},'${t}','${v}')"><span><b>${esc(text(v))}</b><small>${esc(desc(v))}</small></span>${v===saved&&v!==cur?'<small class="pm-was">Saved</small>':''}${v===cur?'<span class="pm-tick" aria-hidden="true">✓</span>':''}</button>`).join('')}</span>`);
  const pop=w.querySelector('.pm-pop'),r=btn.getBoundingClientRect(),h=pop.offsetHeight,wd=pop.offsetWidth;
  pop.style.left=`${Math.max(8,Math.min(window.innerWidth-wd-8,r.left+r.width/2-wd/2))}px`;
  pop.style.top=`${r.bottom+4+h>window.innerHeight?Math.max(8,r.top-h-4):r.bottom+4}px`;
  pop.querySelector('button[aria-selected="true"]')?.focus({preventScroll:true});
};
window.stApSet=(kind,id,t,v)=>{
  const key=kind==='team'?tKey(id,t):rKey(id,t),saved=kind==='team'?teamSaved(id,t):repSaved(id,t);
  if(v===saved){delete stEdits[key];if(!Object.keys(stEdits).length)stDirty=false;}
  else{stEdits[key]=v;stDirty=true;}
  stRender();
};
X.beforeSaveHooks.push(edits=>{
  const keys=Object.keys(edits).filter(k=>k.startsWith('ap:'));
  if(!keys.length)return null;
  const affected=new Set();
  const items=keys.map(k=>{
    const [,kind,id,t]=k.split(':'),type=TYPES.find(x=>x.k===t);
    if(kind==='team'){reps().filter(m=>teamOf(m)===id&&repVal(m.id,t)==='default').forEach(m=>affected.add(m.id));return `${id}’s team · ${type.l}: ${label(t,teamSaved(id,t),id)} → ${label(t,edits[k],id)}`;}
    const m=memberBy(id),team=teamOf(m),show=v=>v==='default'?`team default (${label(t,teamVal(team,t),team)})`:label(t,v,team);
    affected.add(id);return `${fullName(m)} · ${type.l}: ${show(repSaved(id,t))} → ${show(edits[k])}`;
  });
  D.apsave={t:`Save ${keys.length} approval change${keys.length===1?'':'s'}?`,ok:'Save changes',w:560,b:[{k:'note',tone:'neu',items},{k:'note',tone:'info',text:`Affects ${affected.size} ${affected.size===1?'person':'people'} from their next request. Requests already waiting keep their route.`}],done:'Approval rules saved. The change is in the audit log.'};
  return 'apsave';
});

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
    ${d.rules.price==='over'?`<div class="ap-limit"><div class="au-hint">Price exceptions go straight through up to this limit. Above it, the approver decides.</div><div class="au-two"><div class="od-field"><label for="ap-pct">% below list price</label><input id="ap-pct" inputmode="decimal" value="${esc(d.limitPct)}" oninput="stApTeamSet('limitPct',this.value,true)"></div><div class="od-field"><label for="ap-eur">€ below list price</label><div class="nf-currency"><span aria-hidden="true">€</span><input id="ap-eur" inputmode="numeric" value="${esc(d.limitEur)}" oninput="this.value=oppFmtDigits(this.value);stApTeamSet('limitEur',this.value,true)"></div></div></div><div class="au-hint">Whichever is lower applies.</div></div>`:''}
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
  if(d.rules.price==='over'&&!(parseFloat(d.limitPct)>0)&&!d.limitEur.replace(/\D/g,'')){err.textContent='Set a percentage or euro limit for price exceptions';return;}
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
  {k:'custom',title:'Rules',desc:'Rows are teams and people; columns are the requests the CRM raises.',render:ro=>matrixHtml(ro)},
  {k:'custom',title:'What the rules mean',render:()=>legendHtml()},
];
})();
