// Settings › Team: the members model, Add/Edit user drawer, deactivation with record hand-off,
// and the editable Roles and permissions matrix. Builds on window.BST from settings-data-a/b.js.
(function(){
const X=window.BST; if(!X) return;
const P=X.pages,D=X.dialogs;
const C=(t,c)=>({t,c}),M=t=>({t,mu:true}),A=(t,s)=>({t,s,av:true});
const esc=v=>typeof xesc==='function'?xesc(String(v??'')):String(v??'');
const cellText=c=>c&&typeof c==='object'?c.t:c;

// ---------- Roles and capabilities ----------
const ROLES=[
  {key:'owner',name:'Owner',d:'The developer who signed. One per account, with billing authority.',locked:true},
  {key:'admin',name:'Admin',d:'Runs the workspace: every record, the team and settings.'},
  {key:'manager',name:'Sales Manager',d:'Runs a team’s pipeline and decides their approvals.'},
  {key:'rep',name:'Sales Rep',d:'Works their own leads and deals. Requests approvals from their manager.'},
  {key:'marketing',name:'Marketing',d:'Lead capture, campaigns and reporting. Never decides approvals.'},
  {key:'ops',name:'Ops',d:'Deal paperwork, KYC documents and payment milestones.'},
];
// Per-user defaults a role brings to the Add/Edit user drawer.
const ROLE_PROFILE={
  owner:{see:'all',areas:['opps','deals','units','devs','contacts','approvals','calendar','reports','automations','present','marketing']},
  admin:{see:'all',areas:['opps','deals','units','devs','contacts','approvals','calendar','reports','automations','present','marketing']},
  manager:{see:'team',areas:['opps','deals','units','devs','contacts','approvals','calendar','reports','automations','present']},
  rep:{see:'own',areas:['opps','deals','units','devs','contacts','calendar','present']},
  marketing:{see:'all',areas:['contacts','units','devs','calendar','reports','automations','marketing']},
  ops:{see:'all',areas:['deals','units','devs','contacts','calendar','reports']},
};
const LEVELS={
  none:{l:'No access',chip:'—'},
  own:{l:'Own',d:'Only records they own',tone:'info'},
  team:{l:'Team',d:'Their team’s records',tone:'info'},
  all:{l:'All',d:'Every record',tone:'pri'},
  view:{l:'View',d:'Can see, can’t change',tone:'neu'},
  full:{l:'Full',d:'Can see and change',tone:'pri'},
  scope:{l:'Scoped',d:'Only records they can already see',tone:'info'},
};
const lv=(...keys)=>keys;
const CAPS=[
  {g:'Records',k:'opps',l:'Opportunities and deals',lv:lv('none','own','team','all'),v:['all','all','team','own','none','all']},
  {g:'Records',k:'contacts',l:'Contacts',lv:lv('none','own','team','all'),v:['all','all','team','own','all','all']},
  {g:'Records',k:'units',l:'Units and availability',lv:lv('none','view','full'),v:['full','full','full','view','view','view']},
  {g:'Records',k:'kyc',l:'KYC and source-of-funds documents',s:'AML records',lv:lv('none','view','full'),v:['full','full','none','none','none','full']},
  {g:'Selling',k:'approve',l:'Decide holds, reservations and price exceptions',lv:lv('none','team','full'),v:['full','full','team','none','none','none']},
  {g:'Selling',k:'prices',l:'Change unit prices',lv:lv('none','full'),v:['full','full','full','none','none','none']},
  {g:'Selling',k:'import',l:'Import units and deals',lv:lv('none','full'),v:['full','full','full','none','none','full']},
  {g:'Selling',k:'export',l:'Export data',lv:lv('none','scope','full'),v:['full','full','scope','none','scope','scope']},
  {g:'Team and settings',k:'users',l:'Add, edit and deactivate users',lv:lv('none','full'),v:['full','full','none','none','none','none']},
  {g:'Team and settings',k:'approvalRules',l:'Edit approval rules',lv:lv('none','team','full'),v:['full','full','team','none','none','none']},
  {g:'Team and settings',k:'sales',l:'Edit Sales setup',s:'Stages, labels, holds, checklists',lv:lv('none','view','full'),v:['full','full','view','none','view','none']},
  {g:'Team and settings',k:'integrations',l:'Connect integrations',lv:lv('none','view','full'),v:['full','full','none','none','view','none']},
  {g:'Team and settings',k:'automations',l:'Create and run automations',lv:lv('none','view','full'),v:['full','full','full','none','full','none']},
  {g:'Billing and compliance',k:'plan',l:'Plan and invoices',lv:lv('none','view','full'),v:['full','view','none','none','none','none']},
  {g:'Billing and compliance',k:'credits',l:'Credits and usage',lv:lv('none','own','view','full'),v:['full','full','view','own','view','own']},
  {g:'Billing and compliance',k:'buyCredits',l:'Request credit top-ups',lv:lv('none','full'),v:['full','full','none','none','none','none']},
  {g:'Billing and compliance',k:'privacy',l:'Data and privacy rules',lv:lv('none','view','full'),v:['full','full','none','none','none','view']},
  {g:'Billing and compliance',k:'audit',l:'Audit log',lv:lv('none','view'),v:['view','view','none','none','none','view']},
];
const PERM={};
ROLES.forEach((r,i)=>{PERM[r.key]={};CAPS.forEach(c=>{PERM[r.key][c.k]=c.v[i];});});
const pKey=(r,c)=>`perm:${r}:${c}`;
// Saved value (base data, or what was saved this session).
const pSaved=(r,c)=>stSaved[pKey(r,c)]??PERM[r][c];
// What the matrix shows: an unsaved edit wins.
const pVal=(r,c)=>pKey(r,c) in stEdits?stEdits[pKey(r,c)]:pSaved(r,c);
const roleBy=k=>ROLES.find(r=>r.key===k);
const roleByName=n=>ROLES.find(r=>r.name===n);
const profileFor=name=>{const r=roleByName(name);return ROLE_PROFILE[r?.base||r?.key]||ROLE_PROFILE.rep;};

// ---------- Members ----------
const AU_AREAS=[['opps','Opportunities'],['deals','Deals'],['units','Units'],['devs','Developments'],['contacts','Contacts'],['approvals','Approvals'],['calendar','Calendar'],['reports','Reports'],['automations','Automations'],['present','Present mode'],['marketing','Marketing']];
const AU_SEE={own:'Only their own records',team:'Their team’s records',all:'Every record'};
const AU_APPROVALS=['Team default','New rep · everything needs approval','Trusted rep · holds and reservations go straight through','Custom · set in Approvals'];
const CUSTOM_APPROVALS=new Set(['Karl Zammit','Matthew Vella','Sarah Azzopardi']);
const STATUS_TONE={Active:'ok',Invited:'info',Deactivated:'neu'};
let seq=0;
const MEMBERS=P.team.b[0].rows.map(r=>{
  const c=r.c||r,name=cellText(c[0]),[first,...rest]=name.split(' '),devs=cellText(c[2]),role=cellText(c[1]),prof=profileFor(role);
  const digits=[...name].reduce((a,ch)=>(a*31+ch.charCodeAt(0))%10000,7);
  return {id:'m'+(++seq),first,last:rest.join(' '),email:c[0].s,phone:name==='Sam'?'+356 7912 4410':`+356 79${String(digits).padStart(4,'0').slice(0,2)} ${String(digits*7%10000).padStart(4,'0')}`,title:'',
    role,reportsTo:cellText(c[3])==='—'?'':cellText(c[3]),devScope:devs==='All'?'all':'selected',devs:devs==='All'?[]:devs.split(', '),
    see:prof.see,areas:[...prof.areas],approvals:role==='Sales Rep'?(CUSTOM_APPROVALS.has(name)?AU_APPROVALS[3]:AU_APPROVALS[0]):'',rotation:role==='Sales Rep',
    wa:cellText(c[4]),lastSeen:cellText(c[5]),status:cellText(c[6])};
});
const fullName=m=>`${m.first} ${m.last}`.trim();
const memberBy=id=>MEMBERS.find(m=>m.id===id);
function syncTeam(){
  P.team.b[0].rows=MEMBERS.map(m=>({c:[A(fullName(m),m.email),m.role,m.role==='Owner'||m.role==='Admin'||m.devScope==='all'?'All':m.devs.join(', '),m.reportsTo||M('—'),C(m.wa,m.wa==='Not registered'?'warn':'ok'),m.lastSeen,C(m.status,STATUS_TONE[m.status]||'neu')],go:`f:stMemberOpen:${m.id}`,dim:m.status==='Deactivated'}));
}
syncTeam();
// Shared with settings-approvals.js so approval teams follow who reports to whom.
X.team={MEMBERS,fullName,memberBy,refresh:syncTeam};
['team','team-invited','team-deact'].forEach(k=>{P[k].acts=[['Add users','f:stAddUserOpen']];});

const managers=exclude=>MEMBERS.filter(m=>m.status==='Active'&&['Owner','Admin','Sales Manager'].includes(m.role)&&m.id!==exclude).map(fullName);
const devNames=()=>[...new Set([...(typeof DEVS!=='undefined'?DEVS.map(d=>d.name):[]),...MEMBERS.flatMap(m=>m.devs)])];
const assignableRoles=()=>ROLES.filter(r=>!r.locked).map(r=>r.name);
// CRM records are owned by first name (Sam, Maria…); members whose first name matches carry them.
const crmOwned=m=>{
  if(typeof OPPS==='undefined')return {opps:0,deals:0,contacts:0};
  const mine=OPPS.filter(o=>o.rep===m.first);
  return {opps:mine.filter(o=>!EXIT_STAGES.includes(o.stage)).length,deals:mine.filter(o=>o.stage==='Closed Won').length,contacts:typeof CONTACTS==='undefined'?0:CONTACTS.filter(c=>c.rep===m.first).length};
};

// ---------- Add / Edit user drawer ----------
let au=null,auOpenPicker=null;
const needsReportsTo=()=>['Sales Rep','Marketing','Ops'].includes(au.role)||roleByName(au.role)?.custom;
const auReadOnly=()=>au.mode==='view'||(au.mode==='edit'&&au.status==='Deactivated');

function auPicker(key,label,options,{multi=false,placeholder='Select',req=false,summary}={}){
  const value=au[key],selected=multi?value:[value];
  const opts=options.map(o=>Array.isArray(o)?{value:o[0],label:o[1]}:{value:o,label:o});
  const group=fdGroup(label,opts,v=>selected.includes(v),v=>`stAuChoose('${key}',${esc(JSON.stringify(v))})`,{value:o=>o.value,text:o=>esc(o.label),radio:!multi});
  const text=summary?summary():opts.filter(o=>selected.includes(o.value)).map(o=>o.label).join(', ');
  return `<div class="od-field"><label id="au-${key}-l">${label}${req?' *':''}</label><details class="nf-picker${text?'':' is-empty'}" id="au-${key}" ${auOpenPicker===key?'open':''}><summary aria-labelledby="au-${key}-l">${esc(text||placeholder)}</summary><div class="nf-menu">${group}</div></details></div>`;
}
function auInput(key,label,type,{req=true,placeholder='',hint='',auto=''}={}){
  return `<div class="od-field"><label for="au-${key}">${label}${req?' *':''}</label><input id="au-${key}" type="${type}" ${req?'required':''} ${auto?`autocomplete="${auto}"`:''} placeholder="${esc(placeholder)}" value="${esc(au[key])}" oninput="stAuSet('${key}',this.value)">${hint?`<div class="au-hint">${hint}</div>`:''}</div>`;
}
function auStatic(label,value,hint=''){return `<div class="od-field"><label>${label}</label><div class="au-static">${esc(value)}</div>${hint?`<div class="au-hint">${hint}</div>`:''}</div>`;}
function auSummary(){
  if(au.mode==='add')return '';
  const name=`${au.first} ${au.last}`.trim()||'Unnamed';
  return `<div class="au-card"><span class="au-av">${esc(name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase())}</span><div class="au-card-t"><b>${esc(name)}</b><span>${esc(au.role)} · last active ${esc(au.lastActive)}</span></div><span class="st-chip t-${STATUS_TONE[au.status]||'neu'}">${esc(au.status)}</span></div>
    ${au.status==='Deactivated'?'<div class="au-note">Deactivated users can’t sign in. Reactivate them to make changes.</div>':''}
    ${au.status==='Invited'?`<div class="au-note">Invite sent to ${esc(au.email)}. It expires 7 days after it was sent.</div>`:''}
    ${au.mode==='view'?'<div class="au-note">You can view this person. Admins and the Owner can change them.</div>':''}`;
}
function auFormBody(){
  const isOwner=au.role==='Owner',prof=au.role?profileFor(au.role):null,roleObj=roleByName(au.role);
  return `${auSummary()}<fieldset class="au-fs" ${auReadOnly()?'disabled':''}>
    <div class="au-sec">Details</div>
    <div class="au-two">${auInput('first','First name','text',{auto:'given-name'})}${auInput('last','Last name','text',{auto:'family-name',req:au.mode==='add'||!!au.orig?.last})}</div>
    ${auInput('email','Work email','email',{auto:'email',placeholder:'name@company.com',hint:au.mode==='add'?'Their sign-in. The invite is sent here.':'Their sign-in. Changing it signs them out everywhere.'})}
    ${auInput('phone','Mobile number','tel',{auto:'tel',placeholder:'+356 7900 0000',hint:'Bricly recognises their WhatsApp messages from this number.'})}
    ${auInput('title','Job title','text',{req:false,placeholder:'Optional'})}
    <div class="au-sec">Role</div>
    ${isOwner?auStatic('Role','Owner','To hand over ownership, use Transfer ownership in the Team actions.')
      :auPicker('role','Role',assignableRoles(),{req:true,placeholder:'Select a role'})}
    ${roleObj&&!isOwner?`<div class="au-hint au-role-d">${esc(roleObj.d)} <button type="button" class="au-link" onclick="stRoleOpen('${roleObj.key}')">See permissions</button></div>`:''}
    ${au.role&&!isOwner&&au.mode!=='add'&&au.role!==au.orig?.role?'<div class="au-note">The new role applies on their next request. Approval requests already waiting keep their route.</div>':''}
    ${au.role&&needsReportsTo()?auPicker('reportsTo','Reports to',managers(au.id),{req:au.role==='Sales Rep',placeholder:'Select a manager'}):''}
    ${au.role?`<div class="au-sec">Access</div>
      ${isOwner||au.role==='Admin'?auStatic('Developments','All developments',`${isOwner?'The Owner':'Admins'} always see every development.`)
        :auPicker('devScope','Developments',[['all','All developments'],['selected','Selected developments']],{req:true,placeholder:'Select development access'})}
      ${au.devScope==='selected'&&!isOwner&&au.role!=='Admin'?auPicker('devs','Which developments',devNames(),{multi:true,req:true,placeholder:'Select developments'}):''}
      ${auPicker('see','Records they can see',Object.entries(AU_SEE),{req:true})}
      ${auPicker('areas','CRM access',AU_AREAS,{multi:true,req:true,placeholder:'Select areas',summary:()=>au.areas.length?`${au.areas.length} of ${AU_AREAS.length} areas · ${AU_AREAS.filter(([k])=>au.areas.includes(k)).map(([,l])=>l).slice(0,3).join(', ')}${au.areas.length>3?'…':''}`:''})}
      ${au.mode==='add'&&prof?'<div class="au-hint">Pre-filled from the role. Adjust anything before you add them.</div>':''}`:''}
    ${au.role==='Sales Rep'?`<div class="au-sec">Selling</div>
      ${auPicker('approvals','Approval rules',AU_APPROVALS,{req:true,placeholder:'Select approval rules'})}
      <div class="od-field au-toggle-row"><div><label for="au-rotation">Add to lead rotation</label><div class="au-hint">New leads on their developments can be allocated to them.</div></div><button type="button" id="au-rotation" class="st-toggle ${au.rotation?'on':''}" role="switch" aria-checked="${au.rotation}" onclick="stAuSet('rotation',!stAuState().rotation,true)"><span></span></button></div>`:''}
    </fieldset><div id="au-error" class="au-error" role="alert"></div>`;
}
function auDeactivateBody(){
  const m=memberBy(au.id),own=crmOwned(m),total=own.opps+own.deals+own.contacts;
  const targets=MEMBERS.filter(x=>x.id!==m.id&&x.status==='Active').map(fullName);
  return `<div class="au-sec">Deactivate ${esc(fullName(m))}</div>
    <ul class="au-list"><li>They can’t sign in, and their WhatsApp number stops being recognised.</li><li>They leave the lead rotation. Approval requests waiting on them move to their manager.</li><li>Their history stays. You can reactivate them later.</li></ul>
    <div class="au-sec">What they own</div>
    <div class="au-own"><div><b>${own.opps}</b><span>Open opportunities</span></div><div><b>${own.deals}</b><span>Deals</span></div><div><b>${own.contacts}</b><span>Contacts</span></div></div>
    ${total?auPicker('handoff','Move their records to',targets,{req:true,placeholder:'Select who takes over'})+'<div class="au-hint">Buyers keep the same history; the new owner is told.</div>':'<div class="au-hint">They own no open records, so nothing needs to move.</div>'}
    <div id="au-error" class="au-error" role="alert"></div>`;
}
function auFoot(){
  if(au.mode==='add')return `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="stAuSubmit()">Add user</button>`;
  if(au.mode==='view')return `<button class="btn-primary" onclick="qaDrawerClose()">Close</button>`;
  if(au.mode==='deactivate'){const own=crmOwned(memberBy(au.id)),n=own.opps+own.deals+own.contacts;return `<button class="btn-ghost" onclick="stAuMode('edit')">Back</button><button class="btn-danger" onclick="stAuDeactivate()">${n?`Deactivate and move ${n} record${n===1?'':'s'}`:'Deactivate'}</button>`;}
  const left=au.status==='Deactivated'?`<button class="btn-ghost" onclick="stAuReactivate()">Reactivate</button>`
    :au.status==='Invited'?`<button class="btn-ghost au-danger" onclick="stAuRevoke(this)">Revoke invite</button><button class="btn-ghost" onclick="stAuResend()">Resend invite</button>`
    :au.role==='Owner'?'':`<button class="btn-ghost au-danger" onclick="stAuMode('deactivate')">Deactivate</button>`;
  return `${left}<span class="au-spacer"></span><button class="btn-ghost" onclick="qaDrawerClose()">${au.status==='Deactivated'?'Close':'Cancel'}</button>${au.status==='Deactivated'?'':'<button class="btn-primary" onclick="stAuSubmit()">Save changes</button>'}`;
}
function auRender(){
  const body=document.getElementById('qaDrawerBody'); if(!body||!au)return;
  const scroll=body.scrollTop;
  body.innerHTML=au.mode==='deactivate'?auDeactivateBody():auFormBody();
  document.getElementById('qaDrawerFoot').innerHTML=auFoot();
  body.scrollTop=scroll;
}
function auOpen(state,title){
  au=state;auOpenPicker=null;roleDraft=null;
  qaDrawerOpen(title,'','');auRender();
  if(au.mode==='add')document.getElementById('au-first')?.focus();
}
window.stAuState=()=>au;
window.stAddUserOpen=()=>auOpen({mode:'add',first:'',last:'',email:'',phone:'',title:'',role:'',reportsTo:'',devScope:'',devs:[],see:'',areas:[],approvals:'',rotation:false},'Add user');
window.stMemberOpen=id=>{
  const m=memberBy(id); if(!m)return;
  const ro=typeof stAccess==='function'&&stAccess('team')!=='f';
  if(m.role==='Sales Rep'&&X.apRepSummary)m.approvals=X.apRepSummary(m.id);
  auOpen({...structuredClone(m),mode:ro?'view':'edit',lastActive:m.lastSeen,role0:m.role,orig:structuredClone(m)},fullName(m));
};
window.stAuMode=mode=>{au.mode=mode;au.handoff='';auOpenPicker=null;auRender();document.getElementById('qaDrawerBody').scrollTop=0;};
window.stAuSet=(key,value,rerender=false)=>{au[key]=value;if(rerender)auRender();};
window.stAuChoose=(key,value)=>{
  if(Array.isArray(au[key])){au[key]=au[key].includes(value)?au[key].filter(v=>v!==value):[...au[key],value];auOpenPicker=key;}
  else{
    au[key]=value;auOpenPicker=null;
    if(key==='role'){
      const prof=profileFor(value),wasAdmin=au.role0==='Admin';au.role0=value;
      au.see=prof.see;au.areas=[...prof.areas];
      if(!needsReportsTo())au.reportsTo='';
      if(value==='Admin'){au.devScope='all';au.devs=[];}else if(wasAdmin)au.devScope='';
      if(value!=='Sales Rep'){au.approvals='';au.rotation=false;}
    }
    if(key==='devScope'&&value==='all')au.devs=[];
  }
  // Deferred so the global picker-closing click handler sees the clicked option inside its picker.
  setTimeout(()=>{auRender();if(auOpenPicker)document.querySelector(`#au-${key} summary`)?.focus();});
};
function auValidate(){
  const err=document.getElementById('au-error'),fail=(m,id)=>{err.textContent=m;if(id)document.getElementById(id)?.focus();return false;};
  const email=au.email.trim().toLowerCase();
  const lastOptional=au.mode!=='add'&&!au.orig?.last;
  if(!au.first.trim()||(!au.last.trim()&&!lastOptional))return fail('Enter their first and last name',au.first.trim()?'au-last':'au-first');
  if(!email||!document.getElementById('au-email').checkValidity())return fail('Enter a valid work email','au-email');
  if(MEMBERS.some(m=>m.id!==au.id&&m.email.toLowerCase()===email))return fail('Someone on the team already uses that email','au-email');
  if(au.phone.replace(/\D/g,'').length<7)return fail('Enter a valid mobile number','au-phone');
  if(!au.role)return fail('Select a role','au-role');
  if(au.role==='Sales Rep'&&!au.reportsTo)return fail('Select who they report to','au-reportsTo');
  if(!['Owner','Admin'].includes(au.role)&&!au.devScope)return fail('Select which developments they can access','au-devScope');
  if(au.devScope==='selected'&&!['Owner','Admin'].includes(au.role)&&!au.devs.length)return fail('Select at least one development','au-devs');
  if(!au.areas.length)return fail('Give them access to at least one CRM area','au-areas');
  if(au.role==='Sales Rep'&&!au.approvals)return fail('Select their approval rules','au-approvals');
  return true;
}
const FIELD_LABELS={first:'name',last:'name',email:'email',phone:'mobile',title:'job title',role:'role',reportsTo:'manager',devScope:'developments',devs:'developments',see:'record access',areas:'CRM access',approvals:'approval rules',rotation:'lead rotation'};
function afterChange(){syncTeam();if(typeof stRender==='function')stRender();}
window.stAuSubmit=()=>{
  if(!auValidate())return;
  const keys=Object.keys(FIELD_LABELS),clean={};
  keys.forEach(k=>{clean[k]=typeof au[k]==='string'?au[k].trim():au[k];});
  if(['Owner','Admin'].includes(clean.role)){clean.devScope='all';clean.devs=[];}
  if(au.mode==='add'){
    const m={id:'m'+(++seq),...clean,wa:'Pre-registered',lastSeen:'Not yet',status:'Invited'};
    MEMBERS.push(m);X.apApplyPreset?.(m.id,m.approvals);qaDrawerClose();afterChange();
    showToast(`${fullName(m)} added. Invite sent to ${m.email}; it expires in 7 days.`);au=null;return;
  }
  const m=memberBy(au.id),changed=[...new Set(keys.filter(k=>JSON.stringify(m[k])!==JSON.stringify(clean[k])).map(k=>FIELD_LABELS[k]))];
  if(!changed.length){qaDrawerClose();au=null;return;}
  Object.assign(m,clean);X.apApplyPreset?.(m.id,m.approvals);qaDrawerClose();afterChange();
  showToast(`Saved ${fullName(m)}: ${changed.join(', ')}. The change is in the audit log.`);au=null;
};
window.stAuDeactivate=()=>{
  const m=memberBy(au.id),own=crmOwned(m),total=own.opps+own.deals+own.contacts;
  if(total&&!au.handoff){document.getElementById('au-error').textContent='Select who takes over their records';document.getElementById('au-handoff')?.querySelector('summary')?.focus();return;}
  const to=total?MEMBERS.find(x=>fullName(x)===au.handoff):null;
  if(to&&typeof OPPS!=='undefined'){
    OPPS.forEach(o=>{if(o.rep===m.first)o.rep=to.first;});
    if(typeof CONTACTS!=='undefined')CONTACTS.forEach(c=>{if(c.rep===m.first)c.rep=to.first;});
    if(typeof pipeRenderAll==='function')pipeRenderAll();
  }
  m.status='Deactivated';m.rotation=false;
  qaDrawerClose();afterChange();
  showToast(to?`${fullName(m)} deactivated. ${total} record${total===1?'':'s'} moved to ${fullName(to)}.`:`${fullName(m)} deactivated.`);au=null;
};
window.stAuReactivate=()=>{const m=memberBy(au.id);m.status='Active';qaDrawerClose();afterChange();showToast(`${fullName(m)} reactivated. They can sign in again.`);au=null;};
window.stAuResend=()=>{showToast(`Invite resent to ${au.email}. It expires in 7 days.`);};
window.stAuRevoke=btn=>{
  // Two-step: the first click arms the button so a revoke is never one stray click.
  if(!btn.dataset.armed){btn.dataset.armed='1';btn.textContent='Click again to revoke';btn.classList.add('armed');return;}
  const i=MEMBERS.findIndex(m=>m.id===au.id),m=MEMBERS[i];MEMBERS.splice(i,1);
  qaDrawerClose();afterChange();showToast(`Invite for ${m.email} revoked.`);au=null;
};

// ---------- Roles and permissions ----------
const chip=(level)=>{const L=LEVELS[level];return level==='none'?`<span class="pm-none" aria-label="No access">—</span>`:`<span class="st-chip t-${L.tone}">${esc(L.l)}</span>`;};
const roleCount=r=>MEMBERS.filter(m=>m.role===r.name&&m.status!=='Deactivated').length;
function permMatrixHtml(ro){
  const groups=[...new Set(CAPS.map(c=>c.g))];
  const changes=Object.keys(stEdits).filter(k=>k.startsWith('perm:')).length;
  return `<div class="pm-help">${ro?'You can view the permissions for each role.':'Click a cell to change one permission, or a role name to edit the whole role. Changes save together.'}${changes?` <b>${changes} unsaved change${changes===1?'':'s'}.</b>`:''}</div>
  <div class="pm-scroll"><table class="pm-table"><thead><tr><th scope="col" class="pm-cap">Permission</th>${ROLES.map(r=>`<th scope="col"><button type="button" class="pm-role" onclick="stRoleOpen('${r.key}')" title="Edit ${esc(r.name)}">${esc(r.name)}${r.locked?' <span aria-hidden="true">🔒</span>':''}<span>${roleCount(r)} ${roleCount(r)===1?'person':'people'}</span></button></th>`).join('')}</tr></thead>
  <tbody>${groups.map(g=>`<tr class="pm-g"><th colspan="${ROLES.length+1}" scope="colgroup">${esc(g)}</th></tr>${CAPS.filter(c=>c.g===g).map(c=>`<tr><th scope="row" class="pm-cap">${esc(c.l)}${c.s?`<span>${esc(c.s)}</span>`:''}</th>${ROLES.map(r=>{
    const v=pVal(r.key,c.k),chg=pKey(r.key,c.k) in stEdits,lock=r.locked||ro;
    return `<td><span class="pm-w"><button type="button" class="pm-cell${chg?' chg':''}" ${lock?'disabled':''} title="${esc(r.name)} · ${esc(c.l)}: ${esc(LEVELS[v].l)}${r.locked?' · the Owner always has every permission':''}" aria-label="${esc(r.name)}, ${esc(c.l)}: ${esc(LEVELS[v].l)}" onclick="stPermCell(this,'${r.key}','${c.k}')">${chip(v)}</button></span></td>`;
  }).join('')}</tr>`).join('')}`).join('')}</tbody></table></div>`;
}
function rolesListHtml(){
  return `<div class="pm-roles">${ROLES.map(r=>`<button type="button" class="pm-rolecard" onclick="stRoleOpen('${r.key}')"><span class="pm-rc-t"><b>${esc(r.name)}</b>${r.custom?'<span class="st-chip t-neu">Custom</span>':''}${r.locked?'<span class="st-chip t-neu">Locked</span>':''}</span><span class="pm-rc-d">${esc(r.d)}</span><span class="pm-rc-n">${roleCount(r)} ${roleCount(r)===1?'person':'people'} →</span></button>`).join('')}</div>`;
}
window.stPermCell=(btn,role,cap)=>{
  const w=btn.parentElement,open=w.querySelector('.st-fmenu');
  document.querySelectorAll('#st-root .st-fmenu').forEach(m=>m.remove());
  if(open)return;
  const c=CAPS.find(x=>x.k===cap),cur=pVal(role,cap),saved=pSaved(role,cap);
  w.insertAdjacentHTML('beforeend',`<span class="st-fmenu pm-pop" role="listbox" aria-label="${esc(c.l)} for ${esc(roleBy(role).name)}">${c.lv.map(l=>`<button type="button" role="option" aria-selected="${l===cur}" onclick="stPermSet('${role}','${cap}','${l}')"><span><b>${esc(LEVELS[l].l)}</b>${LEVELS[l].d?`<small>${esc(LEVELS[l].d)}</small>`:''}</span>${l===saved&&l!==cur?'<small class="pm-was">Saved</small>':''}${l===cur?'<span class="pm-tick" aria-hidden="true">✓</span>':''}</button>`).join('')}</span>`);
  // Fixed positioning so the table's scroll container never clips the menu.
  const pop=w.querySelector('.pm-pop'),r=btn.getBoundingClientRect(),h=pop.offsetHeight,wd=pop.offsetWidth;
  pop.style.left=`${Math.max(8,Math.min(window.innerWidth-wd-8,r.left+r.width/2-wd/2))}px`;
  pop.style.top=`${r.bottom+4+h>window.innerHeight?Math.max(8,r.top-h-4):r.bottom+4}px`;
  pop.querySelector('button[aria-selected="true"]')?.focus({preventScroll:true});
};
document.addEventListener('scroll',()=>document.querySelectorAll('#st-root .pm-pop').forEach(m=>m.remove()),true);
window.stPermSet=(role,cap,level)=>{
  const key=pKey(role,cap);
  if(level===pSaved(role,cap)){delete stEdits[key];if(!Object.keys(stEdits).length)stDirty=false;}
  else{stEdits[key]=level;stDirty=true;}
  stRender();
  document.querySelector(`#st-root .pm-cell[onclick*="'${role}','${cap}'"]`)?.focus();
};
// Saving permission edits confirms who is affected, then writes to the audit log.
(X.beforeSaveHooks=X.beforeSaveHooks||[]).push(edits=>{
  const keys=Object.keys(edits).filter(k=>k.startsWith('perm:'));
  if(!keys.length)return null;
  const roles=new Set();
  const items=keys.map(k=>{const [,r,c]=k.split(':');roles.add(r);const role=roleBy(r),cap=CAPS.find(x=>x.k===c);return `${role.name} · ${cap.l}: ${LEVELS[pSaved(r,c)].l} → ${LEVELS[edits[k]].l}`;});
  const people=MEMBERS.filter(m=>m.status!=='Deactivated'&&[...roles].some(r=>roleBy(r).name===m.role)).length;
  D.permsave={t:`Save ${keys.length} permission change${keys.length===1?'':'s'}?`,ok:'Save changes',w:560,b:[{k:'note',tone:'neu',items},{k:'note',tone:'info',text:`Applies to ${people} ${people===1?'person':'people'} on their next request. Approval requests already waiting keep their route.`}],done:'Permissions saved. The change is in the audit log.'};
  return 'permsave';
});

// Role drawer: every permission for one role, with segmented levels.
let roleDraft=null;
function roleBody(){
  const r=roleBy(roleDraft.key),ro=r.locked||(typeof stAccess==='function'&&stAccess('team')!=='f');
  const members=MEMBERS.filter(m=>m.role===r.name&&m.status!=='Deactivated');
  const groups=[...new Set(CAPS.map(c=>c.g))];
  return `${r.locked?'<div class="au-note">The Owner always has every permission. Use Transfer ownership to change who the Owner is.</div>':''}
    <div class="au-sec">Role</div>
    ${r.custom&&!ro?`<div class="od-field"><label for="rd-name">Name *</label><input id="rd-name" value="${esc(roleDraft.name)}" oninput="stRoleDraft('name',this.value)"></div>`:auStatic('Name',r.name)}
    <div class="od-field"><label for="rd-d">Description</label><textarea id="rd-d" rows="2" ${ro?'disabled':''} oninput="stRoleDraft('d',this.value)">${esc(roleDraft.d)}</textarea></div>
    <div class="od-field"><label>People with this role</label>${members.length?`<div class="au-people">${members.map(m=>`<button type="button" class="au-person" onclick="stMemberOpen('${m.id}')"><span class="au-av sm">${esc((m.first[0]+(m.last[0]||'')).toUpperCase())}</span>${esc(fullName(m))}</button>`).join('')}</div>`:'<div class="au-hint">Nobody has this role yet.</div>'}</div>
    ${groups.map(g=>`<div class="au-sec">${esc(g)}</div>${CAPS.filter(c=>c.g===g).map(c=>{const v=roleDraft.perm[c.k],chg=v!==pSaved(r.key,c.k);return `<div class="rd-row${chg?' chg':''}"><div class="rd-l">${esc(c.l)}${c.s?`<span>${esc(c.s)}</span>`:''}</div><div class="rd-seg" role="radiogroup" aria-label="${esc(c.l)}">${c.lv.map(l=>`<button type="button" role="radio" aria-checked="${l===v}" class="${l===v?'on':''}" ${ro?'disabled':''} title="${esc(LEVELS[l].d||LEVELS[l].l)}" onclick="stRoleLevel('${c.k}','${l}')">${esc(l==='none'?'None':LEVELS[l].l)}</button>`).join('')}</div></div>`;}).join('')}`).join('')}
    <div id="au-error" class="au-error" role="alert"></div>`;
}
function roleFoot(){
  const r=roleBy(roleDraft.key),ro=r.locked||(typeof stAccess==='function'&&stAccess('team')!=='f');
  if(ro)return `<button class="btn-primary" onclick="qaDrawerClose()">Close</button>`;
  const left=`<button class="btn-ghost" onclick="stRoleNew('${r.key}')">Duplicate</button>${r.custom?`<button class="btn-ghost au-danger" onclick="stRoleDelete(this)">Delete role</button>`:`<button class="btn-ghost" onclick="stRoleReset()">Reset to defaults</button>`}`;
  return `${left}<span class="au-spacer"></span><button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="stRoleSave()">Save role</button>`;
}
function roleRender(){
  const body=document.getElementById('qaDrawerBody'),scroll=body.scrollTop;
  body.innerHTML=roleBody();document.getElementById('qaDrawerFoot').innerHTML=roleFoot();body.scrollTop=scroll;
}
window.stRoleOpen=key=>{
  const r=roleBy(key);if(!r)return;
  au=null;roleDraft={key,name:r.name,d:r.d,perm:Object.fromEntries(CAPS.map(c=>[c.k,pVal(key,c.k)]))};
  qaDrawerOpen(r.name,'','');roleRender();
};
window.stRoleDraft=(k,v)=>{roleDraft[k]=v;};
window.stRoleLevel=(cap,level)=>{roleDraft.perm[cap]=level;roleRender();};
window.stRoleReset=()=>{const i=ROLES.findIndex(r=>r.key===roleDraft.key);CAPS.forEach(c=>{roleDraft.perm[c.k]=c.v[i];});roleRender();showToast('Defaults loaded. Save the role to apply them.');};
window.stRoleSave=()=>{
  const r=roleBy(roleDraft.key);
  if(r.custom){
    const name=roleDraft.name.trim();
    if(!name){document.getElementById('au-error').textContent='Give the role a name';return;}
    if(ROLES.some(x=>x.key!==r.key&&x.name.toLowerCase()===name.toLowerCase())){document.getElementById('au-error').textContent='Another role already has that name';return;}
    if(name!==r.name)MEMBERS.forEach(m=>{if(m.role===r.name)m.role=name;});
    r.name=name;
  }
  r.d=roleDraft.d.trim();
  let n=0;
  CAPS.forEach(c=>{const k=pKey(r.key,c.k),v=roleDraft.perm[c.k];if(v!==pSaved(r.key,c.k))n++;stSaved[k]=v;delete stEdits[k];});
  if(!Object.keys(stEdits).length)stDirty=false;
  const people=roleCount(r);
  qaDrawerClose();afterChange();
  showToast(n?`${r.name} saved: ${n} permission${n===1?'':'s'} changed. Applies to ${people} ${people===1?'person':'people'} on their next request.`:`${r.name} saved.`);
};
window.stRoleDelete=btn=>{
  const r=roleBy(roleDraft.key),n=roleCount(r);
  if(n){document.getElementById('au-error').textContent=`Move the ${n} ${n===1?'person':'people'} with this role to another role first.`;return;}
  if(!btn.dataset.armed){btn.dataset.armed='1';btn.textContent='Click again to delete';btn.classList.add('armed');return;}
  ROLES.splice(ROLES.indexOf(r),1);Object.keys(stSaved).filter(k=>k.startsWith(`perm:${r.key}:`)).forEach(k=>delete stSaved[k]);
  qaDrawerClose();afterChange();showToast(`${r.name} deleted.`);
};
// New role: name it and pick the role it starts from; its permissions are then edited in the role drawer.
let newRole=null;
window.stRoleNew=(from)=>{
  roleDraft=null;au=null;
  const base=roleBy(from)||null;
  newRole={name:base?`Copy of ${base.name}`:'',from:base?base.key:'',d:base?base.d:''};
  qaDrawerOpen('New role','','');newRoleRender();document.getElementById('nr-name')?.focus();
};
function newRoleRender(){
  const opts=ROLES.filter(r=>!r.locked);
  document.getElementById('qaDrawerBody').innerHTML=`<div class="od-field"><label for="nr-name">Name *</label><input id="nr-name" value="${esc(newRole.name)}" placeholder="e.g. Agency partner" oninput="stNewRoleSet('name',this.value)"></div>
    <div class="od-field"><label id="nr-from-l">Start from *</label><details class="nf-picker${newRole.from?'':' is-empty'}" id="nr-from"><summary aria-labelledby="nr-from-l">${esc(roleBy(newRole.from)?.name||'Select a role to copy')}</summary><div class="nf-menu">${fdGroup('Start from',opts,r=>r.key===newRole.from,r=>`stNewRoleSet('from','${r}',true)`,{value:r=>r.key,text:r=>esc(r.name),radio:true})}</div></details><div class="au-hint">Its permissions are copied. You can change any of them next.</div></div>
    <div class="od-field"><label for="nr-d">Description</label><textarea id="nr-d" rows="2" oninput="stNewRoleSet('d',this.value)">${esc(newRole.d)}</textarea></div>
    <div id="au-error" class="au-error" role="alert"></div>`;
  document.getElementById('qaDrawerFoot').innerHTML=`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="stNewRoleCreate()">Create role</button>`;
}
window.stNewRoleSet=(k,v,rerender)=>{newRole[k]=v;if(rerender){if(k==='from'&&!newRole.d.trim())newRole.d=roleBy(v).d;setTimeout(newRoleRender);}};
window.stNewRoleCreate=()=>{
  const err=document.getElementById('au-error'),name=newRole.name.trim();
  if(!name){err.textContent='Give the role a name';return;}
  if(ROLES.some(r=>r.name.toLowerCase()===name.toLowerCase())){err.textContent='A role with that name already exists';return;}
  if(!newRole.from){err.textContent='Select a role to start from';return;}
  const key='custom'+(++seq),base=roleBy(newRole.from);
  ROLES.push({key,name,d:newRole.d.trim()||`Based on ${base.name}.`,custom:true,base:base.base||base.key});
  PERM[key]=Object.fromEntries(CAPS.map(c=>[c.k,pSaved(base.key,c.k)]));
  afterChange();showToast(`${name} created from ${base.name}. Adjust its permissions, then save.`);
  stRoleOpen(key);
};

// ---------- Page wiring ----------
const rp=P['team/roles'];
rp.d='Roles decide what each person can do. Everyone has exactly one role; per-person extras live on their profile.';
rp.acts=[['New role','f:stRoleNew']];
rp.b=[
  {k:'custom',title:'Permissions',desc:'Rows are permissions, columns are roles.',render:ro=>permMatrixHtml(ro)},
  {k:'custom',title:'Roles',desc:'Open a role to see who has it and edit every permission at once.',render:()=>rolesListHtml()},
];
})();
