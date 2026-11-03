// Settings › Sales setup: every tab is editable. Lists reorder by drag and drop (or the ↑ ↓ buttons) and save through the
// Save bar; rows open a drawer that saves on its own — the same pattern as Team and Approvals.
// Sources, tags, lost reasons and hold expiry feed the CRM, so a change here shows up in the pipeline.
(function(){
const X=window.BST; if(!X||!X.team) return;
const P=X.pages,D=X.dialogs,{MEMBERS,fullName,memberBy}=X.team;
const esc=v=>typeof xesc==='function'?xesc(String(v??'')):String(v??'');
const js=v=>esc(JSON.stringify(v));
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const plural=(n,one,many)=>`${n} ${n===1?one:(many||one+'s')}`;
const opps=()=>typeof OPPS==='undefined'?[]:OPPS;
let seq=0;const uid=p=>`${p}${++seq}`;

// ---------- Drawer engine (one draft at a time, same parts as the member drawer) ----------
let SD=null;
function sdOpen(title,d,render,save){SD={title,d,render,save,open:null};qaDrawerOpen(title,'','');sdRender();}
function sdRender(){
  if(!SD)return;
  const body=document.getElementById('qaDrawerBody'),scroll=body.scrollTop,[b,f]=SD.render(SD.d);
  body.innerHTML=b+'<div id="au-error" class="au-error" role="alert"></div>';
  document.getElementById('qaDrawerFoot').innerHTML=f;body.scrollTop=scroll;
}
window.stSdSet=(k,v,re)=>{SD.d[k]=v;if(re)setTimeout(sdRender);};
window.stSdPick=(k,v)=>{const cur=SD.d[k];if(Array.isArray(cur)){SD.d[k]=cur.includes(v)?cur.filter(x=>x!==v):[...cur,v];SD.open=k;}else{SD.d[k]=v;SD.open=null;}setTimeout(sdRender);};
window.stSdSave=()=>{const err=SD.save(SD.d);if(typeof err==='string'){document.getElementById('au-error').textContent=err;return;}qaDrawerClose();SD=null;stRender();if(err&&err.toast)showToast(err.toast);};
window.stSdDanger=(btn,fn)=>{if(!btn.dataset.armed){btn.dataset.armed='1';btn.dataset.label=btn.textContent;btn.textContent='Click again to confirm';btn.classList.add('armed');return;}const res=SD.danger[fn](SD.d);if(typeof res==='string'){document.getElementById('au-error').textContent=res;btn.textContent=btn.dataset.label;delete btn.dataset.armed;btn.classList.remove('armed');return;}qaDrawerClose();SD=null;stRender();if(res&&res.toast)showToast(res.toast);};
const ro=()=>typeof stAccess==='function'&&stAccess('sales')!=='f';
const fIn=(k,label,{req,ph='',hint='',type='text',mode=''}={})=>`<div class="od-field"><label for="sd-${k}">${label}${req?' *':''}</label><input id="sd-${k}" type="${type}" ${mode?`inputmode="${mode}"`:''} value="${esc(SD.d[k])}" placeholder="${esc(ph)}" ${ro()?'disabled':''} oninput="stSdSet('${k}',this.value)">${hint?`<div class="au-hint">${hint}</div>`:''}</div>`;
const fArea=(k,label,ph='')=>`<div class="od-field"><label for="sd-${k}">${label}</label><textarea id="sd-${k}" rows="2" placeholder="${esc(ph)}" ${ro()?'disabled':''} oninput="stSdSet('${k}',this.value)">${esc(SD.d[k])}</textarea></div>`;
function fPick(k,label,options,{multi=false,ph='Select',req=false,hint=''}={}){
  const v=SD.d[k],sel=multi?v:[v],opts=options.map(o=>Array.isArray(o)?{value:o[0],label:o[1]}:{value:o,label:o});
  const text=opts.filter(o=>sel.includes(o.value)).map(o=>o.label).join(', ');
  if(ro())return `<div class="od-field"><label>${label}</label><div class="au-static">${esc(text||'—')}</div></div>`;
  return `<div class="od-field"><label id="sd-${k}-l">${label}${req?' *':''}</label><details class="nf-picker${text?'':' is-empty'}" id="sd-${k}" ${SD.open===k?'open':''}><summary aria-labelledby="sd-${k}-l">${esc(text||ph)}</summary><div class="nf-menu">${fdGroup(label,opts,x=>sel.includes(x),x=>`stSdPick('${k}',${js(x)})`,{value:o=>o.value,text:o=>esc(o.label),radio:!multi})}</div></details>${hint?`<div class="au-hint">${hint}</div>`:''}</div>`;
}
const fSeg=(k,label,levels,{hint=''}={})=>`<div class="od-field"><label>${label}</label><div class="rd-seg" role="radiogroup" aria-label="${esc(label)}">${levels.map(l=>{const [v,t]=Array.isArray(l)?l:[l,l];return `<button type="button" role="radio" aria-checked="${SD.d[k]===v}" class="${SD.d[k]===v?'on':''}" ${ro()?'disabled':''} onclick="stSdSet('${k}',${js(v)},true)">${esc(t)}</button>`;}).join('')}</div>${hint?`<div class="au-hint">${hint}</div>`:''}</div>`;
const fToggle=(k,label,hint='')=>`<div class="od-field au-toggle-row"><div><label for="sd-${k}">${label}</label>${hint?`<div class="au-hint">${hint}</div>`:''}</div><button type="button" id="sd-${k}" class="st-toggle ${SD.d[k]?'on':''}" role="switch" aria-checked="${!!SD.d[k]}" ${ro()?'disabled':''} onclick="stSdSet('${k}',!${!!SD.d[k]},true)"><span></span></button></div>`;
const fStatic=(label,value,hint='')=>`<div class="od-field"><label>${label}</label><div class="au-static">${esc(value)}</div>${hint?`<div class="au-hint">${hint}</div>`:''}</div>`;
const fChips=(k,label,ph,hint='')=>`<div class="od-field"><label for="sd-${k}-in">${label}</label><div class="nf-tag-control">${SD.d[k].map((c,i)=>`<span class="nf-tag-chip"><span>${esc(c)}</span>${ro()?'':`<button type="button" aria-label="Remove ${esc(c)}" onclick="stSdChipDel('${k}',${i})">${typeof sbIcon==='function'?sbIcon('x'):'×'}</button>`}</span>`).join('')}${ro()?'':`<input id="sd-${k}-in" placeholder="${esc(ph)}" onkeydown="if(event.key==='Enter'){event.preventDefault();stSdChipAdd('${k}',this.value)}">`}</div>${hint?`<div class="au-hint">${hint}</div>`:''}</div>`;
window.stSdChipAdd=(k,v)=>{v=v.trim();if(!v)return;if(SD.d[k].some(c=>c.toLowerCase()===v.toLowerCase())){showToast(`${v} is already on the list`);return;}SD.d[k]=[...SD.d[k],v];sdRender();document.getElementById(`sd-${k}-in`)?.focus();};
window.stSdChipDel=(k,i)=>{SD.d[k]=SD.d[k].filter((_,j)=>j!==i);sdRender();};
const sec=t=>`<div class="au-sec">${esc(t)}</div>`;
const foot=({save='Save',danger=null,left=''}={})=>ro()?`<button class="btn-primary" onclick="qaDrawerClose()">Close</button>`:`${danger?`<button class="btn-ghost au-danger" onclick="stSdDanger(this,'${danger[0]}')">${esc(danger[1])}</button>`:''}${left}<span class="au-spacer"></span><button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="stSdSave()">${esc(save)}</button>`;

// ---------- Sortable lists: drag and drop, with ↑ ↓ buttons for keyboard users ----------
const oKey=list=>`ss:${list}`;
const savedOrder=(list,ids)=>{const o=stSaved[oKey(list)];return o?[...o.filter(i=>ids.includes(i)),...ids.filter(i=>!o.includes(i))]:ids;};
const orderOf=(list,ids)=>{const o=stEdits[oKey(list)]??stSaved[oKey(list)];return o?[...o.filter(i=>ids.includes(i)),...ids.filter(i=>!o.includes(i))]:ids;};
const LISTS={};// list → {ids:()=>[], canDrop:(order)=>true|string}
function setOrder(list,order){
  const L=LISTS[list],ok=L.canDrop?L.canDrop(order):true;
  if(ok!==true){showToast(ok);stRender();return;}
  const saved=savedOrder(list,L.ids());
  if(JSON.stringify(order)===JSON.stringify(saved)){delete stEdits[oKey(list)];if(!Object.keys(stEdits).length)stDirty=false;}
  else{stEdits[oKey(list)]=order;stDirty=true;}
  stRender();
}
window.stSsMove=(list,id,dir)=>{const o=orderOf(list,LISTS[list].ids()),i=o.indexOf(id),j=i+dir;if(j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];setOrder(list,o);requestAnimationFrame(()=>document.querySelector(`#st-root [data-ss="${list}"][data-id="${id}"] [data-dir="${dir}"]`)?.focus());};
function sortTable(list,{cols,gc,rows,locked=()=>false,open,empty='Nothing here yet'}){
  const L=LISTS[list],ids=orderOf(list,L.ids()),moved=oKey(list) in stEdits,R=ro();
  return `<div class="st-table ss-table${moved?' moved':''}" role="table"><div class="st-tr st-th" role="row" style="grid-template-columns:44px ${gc}"><span role="columnheader" aria-label="Order"></span>${cols.map(c=>`<span role="columnheader">${esc(c)}</span>`).join('')}</div>
    ${ids.length?ids.map((id,i)=>{const lk=locked(id);return `<div class="st-tr go ss-row${lk?' locked':''}" role="row" style="grid-template-columns:44px ${gc}" data-ss="${list}" data-id="${esc(id)}" ${!lk&&!R?'draggable="true"':''} tabindex="0" onclick="if(!event.target.closest('button'))${open}(${js(id)})" onkeydown="if(event.key==='Enter'&&event.target===this)${open}(${js(id)})">
      <span role="cell" class="ss-grip">${lk?'<span class="ss-lock" title="Fixed position" aria-label="Fixed position">🔒</span>':R?'':`<span class="ss-handle" aria-hidden="true">⋮⋮</span><span class="ss-mv"><button type="button" data-dir="-1" aria-label="Move up" ${i===0?'disabled':''} onclick="stSsMove('${list}',${js(id)},-1)">↑</button><button type="button" data-dir="1" aria-label="Move down" ${i===ids.length-1?'disabled':''} onclick="stSsMove('${list}',${js(id)},1)">↓</button></span>`}</span>
      ${rows(id,i).map(c=>`<span role="cell">${c}</span>`).join('')}</div>`;}).join(''):`<div class="st-tr" role="row"><span role="cell" class="st-sub">${esc(empty)}</span></div>`}
    ${moved?'<div class="ss-moved st-sub">Order changed · save to apply</div>':''}</div>`;
}
let dragging=null;
document.addEventListener('dragstart',e=>{const row=e.target.closest?.('#st-root .ss-row[draggable="true"]');if(!row)return;dragging={list:row.dataset.ss,id:row.dataset.id};row.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',row.dataset.id);});
document.addEventListener('dragover',e=>{const row=e.target.closest?.('#st-root .ss-row');if(!dragging||!row||row.dataset.ss!==dragging.list)return;e.preventDefault();const r=row.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;document.querySelectorAll('#st-root .ss-row.drop-before,#st-root .ss-row.drop-after').forEach(x=>x.classList.remove('drop-before','drop-after'));row.classList.add(after?'drop-after':'drop-before');});
document.addEventListener('drop',e=>{const row=e.target.closest?.('#st-root .ss-row');if(!dragging||!row||row.dataset.ss!==dragging.list)return;e.preventDefault();const after=row.classList.contains('drop-after'),L=LISTS[dragging.list],o=orderOf(dragging.list,L.ids()).filter(i=>i!==dragging.id);let at=o.indexOf(row.dataset.id);if(at<0)return;if(after)at++;o.splice(at,0,dragging.id);const list=dragging.list;dragging=null;setOrder(list,o);});
document.addEventListener('dragend',()=>{dragging=null;document.querySelectorAll('#st-root .ss-row').forEach(x=>x.classList.remove('dragging','drop-before','drop-after'));});
// Saved orders are applied to the models so the CRM and drawers see the same order.
(X.afterSaveHooks=X.afterSaveHooks||[]).push(changes=>{
  changes.filter(c=>c.id.startsWith('ss:')).forEach(c=>{const L=LISTS[c.id.slice(3)];if(L?.apply)L.apply(c.value);delete stSaved[c.id];});
  if(changes.some(c=>c.id==='ss:sources'||c.id==='ss:tags'||c.id==='ss:lost'))crmSync();
});
const reorderArr=(arr,order,key='id')=>{arr.sort((a,b)=>order.indexOf(a[key])-order.indexOf(b[key]));};

// ================= Pipeline =================
const STAGES=[
  {id:'new',label:'New enquiry',next:'Make first contact',date:'Enquiry date',locked:true,checklist:['Contact details captured','Source recorded'],prob:5},
  {id:'contacted',label:'Contacted',next:'Book appointment',date:'',checklist:['Budget and timeline asked'],prob:10},
  {id:'viewing_booked',label:'Appointment booked',next:'Confirm the day before',date:'Appointment date',checklist:['Appointment time confirmed','Unit shortlist sent'],prob:25},
  {id:'viewed',label:'Viewed',next:'Send a follow-up pack',date:'',checklist:['Feedback captured'],prob:40},
  {id:'offer',label:'Offer made',next:'Chase decision in 3 days',date:'Offer date',checklist:['Offer logged'],prob:60},
  {id:'reserved',label:'Reserved',next:'Collect reservation documents',date:'Reservation date',locked:true,checklist:['Reservation form signed','Deposit received'],prob:80},
  {id:'promise_of_sale',label:'Promise of sale',next:'Collect deposit',date:'POS date',locked:true,checklist:['POS signed at the notary'],prob:95},
  {id:'deed',label:'Deed',next:'Book notary',date:'Deed date',locked:true,checklist:['Final deed signed'],prob:100},
];
STAGES.forEach(s=>{s.gate=false;});
LISTS.stages={ids:()=>STAGES.map(s=>s.id),apply:o=>reorderArr(STAGES,o),
  canDrop:o=>{const core=STAGES.filter(s=>s.locked).map(s=>s.id),pos=o.filter(i=>core.includes(i));if(o[0]!=='new')return 'New enquiry always comes first';if(pos.join()!==core.join())return 'Core stages keep their order';const firstLocked=o.indexOf('reserved');return o.every((id,i)=>core.includes(id)||i<firstLocked)?true:'Custom stages sit before Reserved, so deals and payments stay consistent';}};
const stageBy=id=>STAGES.find(s=>s.id===id);
function stagesHtml(){
  const ids=orderOf('stages',STAGES.map(s=>s.id));
  return sortTable('stages',{cols:['Stage','Next action','Key date','Checklist','Win chance'],gc:'1.3fr 1.5fr 1fr 1fr .7fr',open:'stStageOpen',locked:id=>stageBy(id).locked,
    rows:(id,i)=>{const s=stageBy(id);return [`<span class="st-t b">${ids.indexOf(id)+1}. ${esc(s.label)}</span>`,esc(s.next||'—'),esc(s.date||'—'),`<span class="st-sub">${plural(s.checklist.length,'item')}${s.gate?' · required':''}</span>`,`${s.prob}%`];}});
}
window.stStageOpen=id=>{
  const s=id?stageBy(id):null;
  const before=STAGES.filter(x=>!x.locked||x.id==='new').filter(x=>orderOf('stages',STAGES.map(y=>y.id)).indexOf(x.id)<orderOf('stages',STAGES.map(y=>y.id)).indexOf('reserved')).map(x=>x.label);
  sdOpen(s?s.label:'Add a stage',s?{...structuredClone(s)}:{id:'',label:'',next:'',date:'',checklist:[],prob:'50',gate:false,after:before.at(-1),locked:false},
    d=>[`${d.locked?'<div class="au-note">Core stage. You can rename it and change what happens in it, but it can’t move or be deleted.</div>':''}
      ${sec('Stage')}${fIn('label','Label',{req:true})}
      ${s?fStatic('Key',s.id,'Used by automations and reports. It never changes.'):fPick('after','Add after',before,{req:true,hint:'Custom stages sit before Reserved.'})}
      ${fIn('next','Next action',{ph:'e.g. Confirm the day before',hint:'Shown on opportunity cards in this stage.'})}
      ${fIn('date','Key date',{ph:'e.g. Appointment date',hint:'Leave empty if this stage has no date.'})}
      ${fIn('prob','Win chance (%)',{mode:'numeric',hint:'Weights the pipeline value in forecasts.'})}
      ${sec('Checklist')}${fChips('checklist','Items','Add an item and press Enter')}
      ${fToggle('gate','Must be complete to move on','Reps tick every item before the opportunity can move to the next stage.')}`,
      foot({save:s?'Save stage':'Add stage',danger:s&&!s.locked?['del','Delete stage']:null})],
    d=>{
      const label=d.label.trim(),prob=parseInt(d.prob,10);
      if(!label)return 'Give the stage a label';
      if(STAGES.some(x=>x.id!==d.id&&x.label.toLowerCase()===label.toLowerCase()))return 'Another stage has that label';
      if(!(prob>=0&&prob<=100))return 'Win chance is a number from 0 to 100';
      const fields={label,next:d.next.trim(),date:d.date.trim(),checklist:d.checklist,prob,gate:d.gate};
      if(s){Object.assign(s,fields);return {toast:`${label} saved.`};}
      const nid=slug(label)||uid('stage'),o=orderOf('stages',STAGES.map(x=>x.id)),at=o.indexOf(STAGES.find(x=>x.label===d.after)?.id)+1;
      STAGES.push({id:nid,locked:false,...fields});o.splice(at,0,nid);reorderArr(STAGES,o);
      if(oKey('stages') in stEdits)stEdits[oKey('stages')]=o;
      return {toast:`${label} added after ${d.after}.`};
    });
  SD.danger={del:d=>{STAGES.splice(STAGES.findIndex(x=>x.id===d.id),1);return {toast:`${d.label} deleted. Opportunities in it move back to the stage before.`};}};
};
// Lost reasons: what reps pick when they close an opportunity as lost.
const LOST=['Not interested','Budget mismatch','Chose another property','Unresponsive','Other'].map(l=>({id:slug(l),label:l,note:l==='Other',archived:false}));
[...new Set(opps().filter(o=>o.lost).map(o=>o.lost.reason))].forEach(r=>{if(!LOST.some(x=>x.label===r))LOST.push({id:slug(r),label:r,note:false,archived:true});});
LISTS.lost={ids:()=>LOST.map(x=>x.id),apply:o=>reorderArr(LOST,o)};
X.lostReasons=()=>LOST.filter(x=>!x.archived).map(x=>x.label);
const lostUses=label=>opps().filter(o=>o.lost?.reason===label).length;
function lostHtml(){
  return sortTable('lost',{cols:['Reason','Used on','Status'],gc:'1.6fr 1fr 1fr',open:'stLostOpen',
    rows:id=>{const r=LOST.find(x=>x.id===id);return [`<span class="st-t">${esc(r.label)}</span>${r.note?' <span class="st-sub">asks for a note</span>':''}`,plural(lostUses(r.label),'opportunity','opportunities'),`<span class="st-chip t-${r.archived?'neu':'ok'}">${r.archived?'Archived':'Active'}</span>`];}});
}
window.stLostOpen=id=>{
  const r=id?LOST.find(x=>x.id===id):null;
  sdOpen(r?r.label:'Add a lost reason',r?{...r}:{id:'',label:'',note:false,archived:false},
    d=>[`${fIn('label','Reason',{req:true,ph:'e.g. Bought elsewhere'})}${fToggle('note','Ask for a note','The rep explains in a sentence when they pick this reason.')}${fSeg('archived','Status',[[false,'Active'],[true,'Archived']],{hint:'Archived reasons stay on past opportunities but can’t be picked.'})}${r?`<div class="au-hint">Used on ${plural(lostUses(r.label),'opportunity','opportunities')}.</div>`:''}`,
      foot({save:r?'Save reason':'Add reason',danger:r&&!lostUses(r.label)?['del','Delete']:null})],
    d=>{const label=d.label.trim();if(!label)return 'Name the reason';if(LOST.some(x=>x.id!==d.id&&x.label.toLowerCase()===label.toLowerCase()))return 'That reason already exists';
      if(r){if(r.label!==label)opps().forEach(o=>{if(o.lost?.reason===r.label)o.lost.reason=label;});Object.assign(r,{label,note:d.note,archived:d.archived});}
      else LOST.push({id:uid('lost'),label,note:d.note,archived:d.archived});
      return {toast:r?`${label} saved.`:`${label} added. Reps can pick it when they close as lost.`};});
  SD.danger={del:d=>{LOST.splice(LOST.findIndex(x=>x.id===d.id),1);return {toast:`${d.label} deleted.`};}};
};

// ================= Unit statuses and holds =================
const STATUS=[
  {id:'available',label:'Available',reverse:'—',buyer:'Available',tone:'ok'},
  {id:'held',label:'Held',reverse:'The holder, their manager, or expiry',buyer:'Available',tone:'warn'},
  {id:'reserved',label:'Reserved',reverse:'Manager, with approval',buyer:'Reserved',tone:'info'},
  {id:'sold',label:'Sold',reverse:'Admin only, with a reason',buyer:'Sold',tone:'pri'},
  {id:'off_market',label:'Off market',reverse:'Manager or Admin',buyer:'Hidden',tone:'neu'},
];
const REVERSE=['The holder, their manager, or expiry','Manager, with approval','Manager or Admin','Admin only, with a reason'];
const BUYER_AS=['Available','Under offer','Reserved','Sold','Hidden'];
function statusHtml(){
  return `<div class="st-table" role="table"><div class="st-tr st-th" role="row" style="grid-template-columns:1fr .9fr 1.8fr 1fr"><span>Label</span><span>Key</span><span>Who can reverse it</span><span>Buyers see</span></div>
    ${STATUS.map(s=>`<div class="st-tr go" role="row" tabindex="0" style="grid-template-columns:1fr .9fr 1.8fr 1fr" onclick="stStatusOpen('${s.id}')" onkeydown="if(event.key==='Enter')stStatusOpen('${s.id}')"><span role="cell"><span class="st-chip t-${s.tone}">${esc(s.label)}</span></span><span role="cell" class="st-t mono">${s.id}</span><span role="cell">${esc(s.reverse)}</span><span role="cell">${esc(s.buyer)}</span></div>`).join('')}</div>`;
}
window.stStatusOpen=id=>{
  const s=STATUS.find(x=>x.id===id);
  sdOpen(`Unit status · ${s.label}`,{...s},
    d=>[`<div class="au-note">The five statuses are fixed so availability, holds and deals stay consistent. You can rename them and choose what buyers see.</div>
      ${fIn('label','Label',{req:true})}${fStatic('Key',s.id)}
      ${s.id==='available'?fStatic('Who can reverse it','—','Available is the starting point.'):fPick('reverse','Who can reverse it',REVERSE,{req:true})}
      ${fPick('buyer','Buyers see it as',BUYER_AS,{req:true,hint:'Used on the public availability page and buyer packs.'})}`,foot({save:'Save status'})],
    d=>{const label=d.label.trim();if(!label)return 'Give the status a label';if(STATUS.some(x=>x.id!==d.id&&x.label.toLowerCase()===label.toLowerCase()))return 'Another status has that label';Object.assign(s,{label,reverse:d.reverse,buyer:d.buyer});return {toast:`${label} saved.`};});
};
X.selectOpts=Object.assign(X.selectOpts||{},{
  'Remind the holder':()=>['24 hours before','12 hours before','4 hours before','Don’t remind'],
  'When a hold expires':()=>['Release the unit','Offer it to the next buyer waiting'],
  'Extending a hold':()=>['Not allowed','Once, by the holder','With manager approval'],
  'Default method':()=>['Round robin','Weighted','Claim pool'],
});
// Hold expiry also drives the guidance reps see on opportunities.
X.afterSaveHooks.push(changes=>{
  const c=changes.find(x=>x.label==='Hold expires after');
  if(c&&typeof JOURNEY!=='undefined'){const j=JOURNEY.find(x=>x.key==='hold');if(j)j.guide=`Holds expire after ${c.value} — push for reservation early.`;}
});

// ================= Lead handling: sources =================
const SRC_TYPES=['Paid ads','Website','Portal','Referral','Walk-in','Agency or partner','Other'];
const typeFor=n=>/meta|google|ads|instagram|tiktok/i.test(n)?'Paid ads':/website/i.test(n)?'Website':/portal/i.test(n)?'Portal':/referral/i.test(n)?'Referral':/walk/i.test(n)?'Walk-in':/agency|partner/i.test(n)?'Agency or partner':'Other';
const SOURCES=[...new Set([...(typeof FILTER_OPTS!=='undefined'?FILTER_OPTS.source:[]),'Website','Walk-in','Referral','Portal'])].filter(Boolean).map(n=>({id:slug(n),label:n,type:typeFor(n),askReferrer:/referral|agency|partner/i.test(n),archived:false}));
LISTS.sources={ids:()=>SOURCES.map(s=>s.id),apply:o=>reorderArr(SOURCES,o)};
const srcUses=label=>opps().filter(o=>o.source===label).length;
function sourcesHtml(){
  return sortTable('sources',{cols:['Source','Type','Used on','Status'],gc:'1.4fr 1fr 1fr .8fr',open:'stSourceOpen',
    rows:id=>{const s=SOURCES.find(x=>x.id===id);return [`<span class="st-t b">${esc(s.label)}</span>`,esc(s.type),plural(srcUses(s.label),'opportunity','opportunities'),`<span class="st-chip t-${s.archived?'neu':'ok'}">${s.archived?'Archived':'Active'}</span>`];}});
}
window.stSourceOpen=id=>{
  const s=id?SOURCES.find(x=>x.id===id):null;
  sdOpen(s?s.label:'Add a lead source',s?{...s}:{id:'',label:'',type:'',askReferrer:false,archived:false},
    d=>[`${fIn('label','Name',{req:true,ph:'e.g. Instagram ads',hint:s&&srcUses(s.label)?`Renaming updates ${plural(srcUses(s.label),'opportunity','opportunities')}.`:''})}
      ${fPick('type','Type',SRC_TYPES,{req:true,ph:'Select a type',hint:'Groups sources in reports, e.g. all paid ads together.'})}
      ${fToggle('askReferrer','Ask who referred them','The new opportunity form asks for the referring contact or agency.')}
      ${fSeg('archived','Status',[[false,'Active'],[true,'Archived']],{hint:'Archived sources stay on past opportunities but can’t be picked for new ones.'})}`,
      foot({save:s?'Save source':'Add source',danger:s&&!srcUses(s.label)?['del','Delete']:null})],
    d=>{
      const label=d.label.trim();if(!label)return 'Name the source';if(!d.type)return 'Select a type';
      if(SOURCES.some(x=>x.id!==d.id&&x.label.toLowerCase()===label.toLowerCase()))return 'That source already exists';
      let moved=0;
      if(s){if(s.label!==label){opps().forEach(o=>{if(o.source===s.label){o.source=label;moved++;}});if(typeof CONTACTS!=='undefined')CONTACTS.forEach(c=>{if(c.source===s.label)c.source=label;});}Object.assign(s,{label,type:d.type,askReferrer:d.askReferrer,archived:d.archived});}
      else SOURCES.push({id:uid('src'),label,type:d.type,askReferrer:d.askReferrer,archived:d.archived});
      crmSync();
      return {toast:s?(moved?`${label} saved and renamed on ${plural(moved,'opportunity','opportunities')}.`:`${label} saved.`):`${label} added. It’s now in the new opportunity form.`};
    });
  SD.danger={del:d=>{SOURCES.splice(SOURCES.findIndex(x=>x.id===d.id),1);crmSync();return {toast:`${d.label} deleted.`};}};
};

// ================= Lead allocation =================
const DEV_NAMES=()=>typeof DEVS!=='undefined'?DEVS.map(d=>d.name):['Mercury','Dolphin Court','Onyx Rise','La Lex','Verdala'];
const ALLOC={default:{method:'Round robin',fallback:'Round robin after 30 min'},dev:{Mercury:{method:'Weighted'},'Dolphin Court':{method:'Claim pool',fallback:'Round robin after 30 min'}}};
// People added later get allocation defaults the first time this page sees them.
const allocReps=()=>MEMBERS.filter(m=>m.role==='Sales Rep'&&m.status!=='Deactivated').map(m=>{m.alloc=m.alloc||{weight:1,pause:'',cap:''};return m;});
MEMBERS.forEach(m=>{m.alloc=m.alloc||{weight:1,pause:'',cap:''};});
const karl=MEMBERS.find(m=>fullName(m)==='Karl Zammit');if(karl)karl.alloc.weight=2;
// Rotation order lives here, separate from the Members list order.
const REP_ORDER=[];
LISTS.reps={ids:()=>{const ids=allocReps().map(m=>m.id);return [...REP_ORDER.filter(i=>ids.includes(i)),...ids.filter(i=>!REP_ORDER.includes(i))];},apply:o=>{REP_ORDER.splice(0,REP_ORDER.length,...o);}};
const rotKey=id=>`alloc:rot:${id}`;
const inRotation=m=>rotKey(m.id) in stEdits?stEdits[rotKey(m.id)]:m.rotation;
const paused=m=>m.alloc.pause&&new Date(m.alloc.pause+'T23:59')>=new Date();
const openLeads=m=>opps().filter(o=>o.rep===m.first&&!(typeof EXIT_STAGES!=='undefined'&&EXIT_STAGES.includes(o.stage))).length;
const repShare=m=>{const pool=allocReps().filter(x=>inRotation(x)&&!paused(x)&&!(x.alloc.cap&&openLeads(x)>=+x.alloc.cap));if(!pool.includes(m))return '—';const tot=pool.reduce((a,x)=>a+(+x.alloc.weight||1),0);return `${Math.round((+m.alloc.weight||1)/tot*100)}%`;};
function repsHtml(){
  return sortTable('reps',{cols:['Rep','In rotation','Weight','Status','Share','Open leads'],gc:'1.4fr .8fr .6fr 1.3fr .6fr .7fr',open:'stAllocRepOpen',empty:'No sales reps yet. Add them in Team.',
    rows:id=>{const m=memberBy(id),on=inRotation(m),chg=rotKey(id) in stEdits,full=m.alloc.cap&&openLeads(m)>=+m.alloc.cap;
      return [`<span class="st-av-row"><span class="st-av" style="background:hsl(${[...fullName(m)].reduce((a,c)=>a+c.charCodeAt(0),0)%360} 30% 45%)">${esc((m.first[0]+(m.last[0]||'')).toUpperCase())}</span><span class="st-t">${esc(fullName(m))}</span></span>`,
        `<button type="button" class="st-toggle ${on?'on':''}${chg?' chg':''}" role="switch" aria-checked="${on}" aria-label="${esc(fullName(m))} in rotation" ${ro()?'disabled':''} onclick="stAllocRot('${id}')"><span></span></button>`,
        `×${m.alloc.weight||1}`,
        paused(m)?`<span class="st-chip t-warn">Paused until ${esc(new Date(m.alloc.pause+'T12:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}))}</span>`:full?`<span class="st-chip t-warn">At limit · ${m.alloc.cap} open</span>`:on?'<span class="st-chip t-ok">Taking leads</span>':'<span class="st-chip t-neu">Not in rotation</span>',
        repShare(m),String(openLeads(m))];}});
}
window.stAllocRot=id=>{const m=memberBy(id),k=rotKey(id),next=!inRotation(m);if(next===m.rotation){delete stEdits[k];if(!Object.keys(stEdits).length)stDirty=false;}else{stEdits[k]=next;stDirty=true;}stRender();};
X.afterSaveHooks.push(changes=>{changes.filter(c=>c.id.startsWith('alloc:rot:')).forEach(c=>{const m=memberBy(c.id.slice(10));if(m)m.rotation=c.value;delete stSaved[c.id];});});
window.stAllocRepOpen=id=>{
  const m=memberBy(id);
  sdOpen(`${fullName(m)} · allocation`,{rotation:inRotation(m),weight:String(m.alloc.weight||1),pause:m.alloc.pause,cap:m.alloc.cap},
    d=>[`<div class="au-card"><span class="au-av">${esc((m.first[0]+(m.last[0]||'')).toUpperCase())}</span><div class="au-card-t"><b>${esc(fullName(m))}</b><span>${plural(openLeads(m),'open lead')} · ${m.devScope==='all'?'all developments':esc(m.devs.join(', '))}</span></div></div>
      ${fToggle('rotation','In the lead rotation','New leads on their developments can be allocated to them.')}
      ${fSeg('weight','Weight',[['1','×1'],['2','×2'],['3','×3']],{hint:'Used when a development allocates by weight. ×2 gets twice as many leads as ×1.'})}
      <div class="od-field"><label for="sd-pause">Pause new leads until</label><input id="sd-pause" type="date" value="${esc(d.pause)}" ${ro()?'disabled':''} oninput="stSdSet('pause',this.value)"><div class="au-hint">For holidays or training. They’re skipped without stalling the rotation. Leave empty to keep them active.</div></div>
      ${fIn('cap','Most open leads at once',{mode:'numeric',ph:'No limit',hint:'Once they hit this, they’re skipped until a lead closes.'})}`,
      foot({save:'Save allocation'})],
    d=>{
      if(d.cap&&!(parseInt(d.cap,10)>0))return 'The limit is a whole number above 0, or leave it empty';
      if(d.pause&&new Date(d.pause+'T23:59')<new Date())return 'Pick a date in the future, or leave it empty';
      m.rotation=d.rotation;delete stEdits[rotKey(id)];if(!Object.keys(stEdits).length)stDirty=false;
      Object.assign(m.alloc,{weight:+d.weight,pause:d.pause,cap:d.cap?String(parseInt(d.cap,10)):''});
      return {toast:d.pause?`${fullName(m)} paused until ${new Date(d.pause+'T12:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}. Their leads go to the next rep.`:`${fullName(m)}’s allocation saved.`};
    });
};
const devMethod=dev=>ALLOC.dev[dev]?.method||'Workspace default';
function devAllocHtml(){
  const def=ALLOC.default.method;
  return `<div class="st-table" role="table"><div class="st-tr st-th" role="row" style="grid-template-columns:1.2fr 1fr 1.4fr"><span>Development</span><span>Method</span><span>Reps</span></div>
    ${DEV_NAMES().map(dev=>{const o=ALLOC.dev[dev],reps=o?.reps?.length?o.reps.map(id=>fullName(memberBy(id))).join(', '):'Everyone on the development';return `<div class="st-tr go" role="row" tabindex="0" style="grid-template-columns:1.2fr 1fr 1.4fr" onclick="stAllocDevOpen(${js(dev)})" onkeydown="if(event.key==='Enter')stAllocDevOpen(${js(dev)})"><span role="cell" class="st-t b">${esc(dev)}</span><span role="cell">${o?`<span class="st-chip t-info">${esc(o.method)}</span> <span class="st-sub">Override</span>`:`<span class="st-chip t-neu">${esc(def)}</span> <span class="st-sub">Default</span>`}</span><span role="cell" class="st-sub">${esc(reps)}</span></div>`;}).join('')}</div>`;
}
window.stAllocDevOpen=dev=>{
  const o=ALLOC.dev[dev]||{};
  sdOpen(`${dev} · allocation`,{method:o.method||'Workspace default',fallback:o.fallback||ALLOC.default.fallback,reps:o.reps?[...o.reps]:[]},
    d=>[`${fPick('method','How new leads get an owner',[['Workspace default',`Workspace default · ${ALLOC.default.method}`],'Round robin','Weighted','Claim pool'],{req:true,hint:{'Round robin':'The next rep in the rotation order, skipping anyone paused or at their limit.','Weighted':'Like round robin, but reps with a higher weight get more leads. Set weights per rep below the table.','Claim pool':'Leads wait in a shared pool and the first rep to claim gets them.','Workspace default':'Follows the workspace default; changes when the default changes.'}[d.method]})}
      ${d.method==='Claim pool'?fPick('fallback','If nobody claims it',['Round robin after 15 min','Round robin after 30 min','Round robin after 60 min','Assign to the sales manager','Never — leave in the pool']):''}
      ${d.method==='Workspace default'?'':fPick('reps','Reps on this development',allocReps().map(m=>[m.id,fullName(m)]),{multi:true,ph:'Everyone in the rotation',hint:'Leave empty to use every rep in the rotation.'})}`,
      foot({save:'Save allocation',left:o.method?`<button class="btn-ghost" onclick="stSdSet('method','Workspace default',true)">Use default</button>`:''})],
    d=>{if(d.method==='Workspace default'){delete ALLOC.dev[dev];return {toast:`${dev} now follows the workspace default.`};}ALLOC.dev[dev]={method:d.method,fallback:d.fallback,reps:d.reps};return {toast:`${dev} allocation saved: ${d.method}.`};});
};
X.afterSaveHooks.push(changes=>{changes.forEach(c=>{if(c.label==='Default method')ALLOC.default.method=c.value;if(c.label==='Claim pool fallback')ALLOC.default.fallback=c.value;});});

// ================= Lead ownership: change history follows saves =================
const ownHist=P['sales/ownership'].b.find(b=>b.title==='Change history');
X.afterSaveHooks.push(changes=>{
  if(stPage!=='sales/ownership'||!ownHist)return;
  const list=changes.filter(c=>c.label).map(c=>`${c.label} → ${typeof c.value==='boolean'?(c.value?'On':'Off'):Array.isArray(c.value)?c.value.join(', '):typeof c.value==='number'?['Original rep','Allocation rule'][c.value]:c.value}`);
  if(list.length)ownHist.rows.unshift([new Date().toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),{t:'You',av:true},list.join(' · '),{t:'Kept their route',mu:true}]);
});

// ================= Documents =================
const DOCS=[];
P['sales/docs'].b.forEach(b=>b.rows.forEach(r=>DOCS.push({id:uid('doc'),stage:b.title,label:cellT(r[0]),required:cellT(r[1])==='Required',by:cellT(r[2]),blocks:cellT(r[1])==='Required',template:/form|promise of sale, signed|deed/i.test(cellT(r[0]))?'Bricly template':'None'})));
function cellT(c){return c&&typeof c==='object'?c.t:c;}
const DOC_STAGES=['Reservation','Promise of sale','Deed'];
DOC_STAGES.forEach(st=>{LISTS['docs-'+slug(st)]={ids:()=>DOCS.filter(d=>d.stage===st).map(d=>d.id),apply:o=>reorderArr(DOCS,[...DOCS.filter(d=>d.stage!==st).map(d=>d.id),...o])};});
const docsHtml=st=>sortTable('docs-'+slug(st),{cols:['Document','Required','Uploaded by','Template'],gc:'1.8fr .9fr .9fr 1fr',open:'stDocOpen',empty:'No documents for this stage',
  rows:id=>{const d=DOCS.find(x=>x.id===id);return [`<span class="st-t">${esc(d.label)}</span>${d.blocks?' <span class="st-sub">blocks the stage</span>':''}`,`<span class="st-chip t-${d.required?'warn':'neu'}">${d.required?'Required':'Optional'}</span>`,esc(d.by),`<span class="st-sub">${esc(d.template)}</span>`];}});
window.stDocOpen=(id,stage)=>{
  const doc=id?DOCS.find(x=>x.id===id):null;
  sdOpen(doc?doc.label:'Add a document',doc?{...doc}:{id:'',stage:stage||'Reservation',label:'',required:true,by:'Buyer',blocks:true,template:'None'},
    d=>[`${fIn('label','Document',{req:true,ph:'e.g. Bank sanction letter'})}
      ${fPick('stage','Needed at',DOC_STAGES,{req:true})}
      ${fSeg('required','Required',[[true,'Required'],[false,'Optional']])}
      ${d.required?fToggle('blocks','Blocks the stage','The deal can’t move past this stage until it’s uploaded and checked.'):''}
      ${fPick('by','Uploaded by',['Buyer','Rep','Ops','Lawyer','Notary'],{req:true,hint:'Buyers upload through their secure link; everyone else in the deal’s Documents tab.'})}
      ${fPick('template','Template',['None','Bricly template','Upload your own'],{hint:'Templates are filled with the buyer, unit and price automatically.'})}`,
      foot({save:doc?'Save document':'Add document',danger:doc?['del','Remove']:null})],
    d=>{const label=d.label.trim();if(!label)return 'Name the document';if(DOCS.some(x=>x.id!==d.id&&x.stage===d.stage&&x.label.toLowerCase()===label.toLowerCase()))return `${d.stage} already has that document`;
      const fields={label,stage:d.stage,required:d.required,blocks:d.required&&d.blocks,by:d.by,template:d.template};
      if(doc)Object.assign(doc,fields);else DOCS.push({id:uid('doc'),...fields});
      return {toast:doc?`${label} saved.`:`${label} added to ${d.stage}. New deals ask for it.`};});
  SD.danger={del:d=>{DOCS.splice(DOCS.findIndex(x=>x.id===d.id),1);return {toast:`${d.label} removed. Deals already collecting it keep it.`};}};
};

// ================= Payment plans =================
const DUE=['On signing','On reservation','On shell complete','On finishes','On deed','On a date','30 days after signing'];
const PLANS=P['sales/plans'].b.filter(b=>b.k==='table').map((b,i)=>({id:uid('plan'),name:b.title,isDefault:i===0,ms:b.rows.map(r=>({label:r[0],amt:r[1],due:r[2]}))}));
const pct=a=>/%$/.test(String(a).trim())?parseFloat(a):null;
function planCheck(ms){
  if(ms.length<2)return 'A plan needs at least two milestones';
  if(ms.some(m=>!m.label.trim()||!String(m.amt).trim()))return 'Every milestone needs a name and an amount';
  const rem=ms.filter(m=>/^remainder$/i.test(String(m.amt).trim())).length;
  if(rem>1)return 'Only one milestone can be the remainder';
  const bad=ms.find(m=>!/^remainder$/i.test(String(m.amt).trim())&&pct(m.amt)===null&&!/^€\s?[\d,]+$/.test(String(m.amt).trim()));
  if(bad)return `“${bad.amt}” isn’t a percentage, a euro amount or Remainder`;
  const total=ms.reduce((a,m)=>a+(pct(m.amt)||0),0);
  if(!rem&&ms.every(m=>pct(m.amt)!==null)&&Math.abs(total-100)>0.01)return `Percentages add up to ${total}%. Make them 100%, or set the last one to Remainder.`;
  if(total>100)return `Percentages add up to ${total}%, more than the price`;
  return true;
}
const planTotal=ms=>{const t=ms.reduce((a,m)=>a+(pct(m.amt)||0),0),rem=ms.some(m=>/^remainder$/i.test(String(m.amt).trim()));return rem?`${t}% + remainder`:ms.some(m=>/€/.test(m.amt))?`${t}% + fixed amounts`:`${t}%`;};
function plansHtml(){
  return `<div class="pl-cards">${PLANS.map(p=>`<button type="button" class="pl-card" onclick="stPlanOpen('${p.id}')"><span class="pl-h"><b>${esc(p.name)}</b>${p.isDefault?'<span class="st-chip t-pri">Default</span>':''}</span>
    <span class="pl-ms">${p.ms.map(m=>`<span><span>${esc(m.label)}</span><b>${esc(m.amt)}</b><small>${esc(m.due)}</small></span>`).join('')}</span><span class="pl-f">${esc(planTotal(p.ms))} · Edit →</span></button>`).join('')}</div>`;
}
window.stPlanOpen=id=>{
  const p=id?PLANS.find(x=>x.id===id):null;
  sdOpen(p?p.name:'New payment plan',p?{id:p.id,name:p.name,isDefault:p.isDefault,ms:structuredClone(p.ms)}:{id:'',name:'',isDefault:false,ms:[{label:'Deposit at promise of sale',amt:'10%',due:'On signing'},{label:'Final balance at deed',amt:'Remainder',due:'On deed'}]},
    d=>{const check=planCheck(d.ms);return [`${fIn('name','Name',{req:true,ph:'e.g. Investor · 30/70'})}${fToggle('isDefault','Default plan','New deals start with it. Reps can still pick another.')}
      ${sec('Milestones')}
      <div class="pl-edit">${d.ms.map((m,i)=>`<div class="pl-row"><input aria-label="Milestone ${i+1} name" value="${esc(m.label)}" ${ro()?'disabled':''} oninput="stPlanMs(${i},'label',this.value)"><input class="pl-amt" aria-label="Milestone ${i+1} amount" value="${esc(m.amt)}" placeholder="10%" ${ro()?'disabled':''} oninput="stPlanMs(${i},'amt',this.value,true)"><select aria-label="Milestone ${i+1} due" ${ro()?'disabled':''} onchange="stPlanMs(${i},'due',this.value)">${[...new Set([...DUE,m.due])].map(x=>`<option ${x===m.due?'selected':''}>${esc(x)}</option>`).join('')}</select>${ro()?'':`<span class="pl-acts"><button type="button" aria-label="Move up" ${i===0?'disabled':''} onclick="stPlanMove(${i},-1)">↑</button><button type="button" aria-label="Move down" ${i===d.ms.length-1?'disabled':''} onclick="stPlanMove(${i},1)">↓</button><button type="button" aria-label="Remove milestone" onclick="stPlanDel(${i})">×</button></span>`}</div>`).join('')}</div>
      ${ro()?'':'<button type="button" class="au-link pl-add" onclick="stPlanAdd()">+ Add milestone</button>'}
      <div class="pl-total ${check===true?'ok':'bad'}" id="pl-total">${check===true?`Total ${esc(planTotal(d.ms))} ✓`:esc(check)}</div>
      <div class="au-hint">Amounts are a percentage of the price (10%), a fixed amount (€25,000), or Remainder.</div>`,
      foot({save:p?'Save plan':'Create plan',danger:p&&!p.isDefault?['del','Delete plan']:null,left:p?`<button class="btn-ghost" onclick="stPlanDuplicate()">Duplicate</button>`:''})];},
    d=>{const name=d.name.trim();if(!name)return 'Name the plan';if(PLANS.some(x=>x.id!==d.id&&x.name.toLowerCase()===name.toLowerCase()))return 'A plan with that name exists';const check=planCheck(d.ms);if(check!==true)return check;
      if(d.isDefault)PLANS.forEach(x=>{x.isDefault=false;});
      const fields={name,isDefault:d.isDefault||(p?.isDefault&&!PLANS.some(x=>x.id!==d.id&&x.isDefault)),ms:d.ms.map(m=>({label:m.label.trim(),amt:String(m.amt).trim(),due:m.due}))};
      if(p)Object.assign(p,fields);else PLANS.push({id:uid('plan'),...fields});
      return {toast:p?`${name} saved. New deals use it; existing deals keep their plan.`:`${name} created.`};});
  SD.danger={del:d=>{PLANS.splice(PLANS.findIndex(x=>x.id===d.id),1);return {toast:`${d.name} deleted. Deals already on it keep their schedule.`};}};
};
window.stPlanMs=(i,k,v,live)=>{SD.d.ms[i][k]=v;if(live){const c=planCheck(SD.d.ms),el=document.getElementById('pl-total');if(el){el.className=`pl-total ${c===true?'ok':'bad'}`;el.textContent=c===true?`Total ${planTotal(SD.d.ms)} ✓`:c;}}};
window.stPlanMove=(i,dir)=>{const ms=SD.d.ms,j=i+dir;[ms[i],ms[j]]=[ms[j],ms[i]];sdRender();};
window.stPlanDel=i=>{SD.d.ms.splice(i,1);sdRender();};
window.stPlanAdd=()=>{const ms=SD.d.ms,at=ms.findIndex(m=>/deed/i.test(m.due));ms.splice(at<0?ms.length:at,0,{label:'Construction instalment',amt:'10%',due:'On shell complete'});sdRender();};
window.stPlanDuplicate=()=>{SD.d={id:'',name:`Copy of ${SD.d.name}`,isDefault:false,ms:structuredClone(SD.d.ms)};SD.title='New payment plan';document.getElementById('qaDrawerTitle').textContent=SD.title;SD.danger={};sdRender();};

// ================= Targets =================
const METRICS=['Company · reservations','Activity volume per rep','First-touch time','Conversion · appointment to offer','Time in Offer made','Stalled deals','Company · sales value','New leads'];
const TARGETS=P['sales/targets'].b[0].rows.map(r=>({id:uid('tgt'),metric:r[0],value:r[1],period:r[2],applies:/per rep/i.test(r[0])?'Each rep':'Company',by:r[3],when:r[4]}));
const TEAMS=()=>[...new Set(MEMBERS.filter(m=>m.role==='Sales Manager').map(m=>`${fullName(m)}’s team`))];
function targetsHtml(){
  return `<div class="st-table" role="table"><div class="st-tr st-th" role="row" style="grid-template-columns:1.6fr .9fr .7fr .9fr .9fr .8fr"><span>Metric</span><span>Target</span><span>Period</span><span>Applies to</span><span>Set by</span><span>Last changed</span></div>
    ${TARGETS.map(t=>`<div class="st-tr go" role="row" tabindex="0" style="grid-template-columns:1.6fr .9fr .7fr .9fr .9fr .8fr" onclick="stTargetOpen('${t.id}')" onkeydown="if(event.key==='Enter')stTargetOpen('${t.id}')"><span role="cell" class="st-t b">${esc(t.metric)}</span><span role="cell">${esc(t.value)}</span><span role="cell">${esc(t.period)}</span><span role="cell">${esc(t.applies)}</span><span role="cell">${esc(t.by)}</span><span role="cell" class="st-sub">${esc(t.when)}</span></div>`).join('')}</div>`;
}
window.stTargetOpen=id=>{
  const t=id?TARGETS.find(x=>x.id===id):null;
  sdOpen(t?t.metric:'New target',t?{...t}:{id:'',metric:'',value:'',period:'Month',applies:'Company'},
    d=>[`${t?fStatic('Metric',t.metric):fPick('metric','Metric',METRICS.filter(m=>!TARGETS.some(x=>x.metric===m)),{req:true,ph:'Select a metric'})}
      ${fIn('value','Target',{req:true,ph:'e.g. 6, 25%, Under 15 min'})}
      ${fSeg('period','Period',['Week','Month','Quarter'])}
      ${fPick('applies','Applies to',['Company','Each rep',...TEAMS()],{req:true,hint:'Dashboards compare against this target, never the team median.'})}`,
      foot({save:t?'Save target':'Add target',danger:t?['del','Delete target']:null})],
    d=>{if(!d.metric)return 'Select a metric';if(!String(d.value).trim())return 'Set a target';
      const fields={metric:d.metric,value:String(d.value).trim(),period:d.period,applies:d.applies,by:'You',when:'Today'};
      if(t)Object.assign(t,fields);else TARGETS.push({id:uid('tgt'),...fields});
      return {toast:t?`${d.metric} target saved. Dashboards update now.`:`${d.metric} target added.`};});
  SD.danger={del:d=>{TARGETS.splice(TARGETS.findIndex(x=>x.id===d.id),1);return {toast:`${d.metric} target deleted.`};}};
};

// ================= Tags =================
const TAGS=[...new Set([...opps().flatMap(o=>o.tags),'Investor','Overseas'])].map(n=>({id:slug(n),label:n,d:''}));
LISTS.tags={ids:()=>TAGS.map(t=>t.id),apply:o=>reorderArr(TAGS,o)};
const tagUses=label=>opps().filter(o=>o.tags.includes(label)).length;
function tagsHtml(){
  return sortTable('tags',{cols:['Tag','Used on','Description'],gc:'1.2fr 1fr 1.8fr',open:'stTagOpen',empty:'No tags yet',
    rows:id=>{const t=TAGS.find(x=>x.id===id);return [`<span class="tag-chip">${esc(t.label)}</span>`,plural(tagUses(t.label),'opportunity','opportunities'),`<span class="st-sub">${esc(t.d||'—')}</span>`];}});
}
window.stTagOpen=id=>{
  const t=id?TAGS.find(x=>x.id===id):null;
  sdOpen(t?t.label:'New tag',t?{...t,merge:''}:{id:'',label:'',d:'',merge:''},
    d=>[`${fIn('label','Name',{req:true,ph:'e.g. Golden visa',hint:t&&tagUses(t.label)?`Renaming updates ${plural(tagUses(t.label),'opportunity','opportunities')}.`:''})}
      ${fArea('d','Description','When should reps use this tag?')}
      ${t?`${sec('Merge')}${fPick('merge','Merge into',TAGS.filter(x=>x.id!==t.id).map(x=>x.label),{ph:'Select a tag',hint:`Every opportunity tagged ${esc(t.label)} gets the other tag instead, and ${esc(t.label)} is removed.`})}${d.merge?`<button type="button" class="btn-ghost" onclick="stTagMerge()">Merge into ${esc(d.merge)}</button>`:''}`:''}`,
      foot({save:t?'Save tag':'Create tag',danger:t?['del','Delete tag']:null})],
    d=>{const label=d.label.trim();if(!label)return 'Name the tag';if(TAGS.some(x=>x.id!==d.id&&x.label.toLowerCase()===label.toLowerCase()))return 'That tag already exists';
      let n=0;if(t&&t.label!==label)opps().forEach(o=>{const i=o.tags.indexOf(t.label);if(i>=0){o.tags[i]=label;n++;}});
      if(t)Object.assign(t,{label,d:d.d.trim()});else TAGS.push({id:uid('tag'),label,d:d.d.trim()});
      crmSync();return {toast:t?(n?`${label} saved and renamed on ${plural(n,'opportunity','opportunities')}.`:`${label} saved.`):`${label} created. Reps can add it to opportunities now.`};});
  SD.danger={del:d=>{const n=tagUses(t.label);opps().forEach(o=>{o.tags=o.tags.filter(x=>x!==t.label);});TAGS.splice(TAGS.indexOf(t),1);crmSync();return {toast:`${t.label} deleted${n?` and removed from ${plural(n,'opportunity','opportunities')}`:''}.`};}};
};
window.stTagMerge=()=>{
  const d=SD.d,from=TAGS.find(x=>x.id===d.id),into=d.merge;let n=0;
  opps().forEach(o=>{if(o.tags.includes(from.label)){o.tags=[...new Set(o.tags.map(x=>x===from.label?into:x))];n++;}});
  TAGS.splice(TAGS.indexOf(from),1);crmSync();qaDrawerClose();SD=null;stRender();
  showToast(`${from.label} merged into ${into} on ${plural(n,'opportunity','opportunities')}.`);
};

// ---------- CRM sync: the pipeline's pickers read active sources and tags from here ----------
function crmSync(){
  if(typeof FILTER_OPTS==='undefined')return;
  FILTER_OPTS.source=[...new Set([...SOURCES.filter(s=>!s.archived).map(s=>s.label),...opps().map(o=>o.source)])].filter(Boolean);
  FILTER_OPTS.tag=[...new Set([...TAGS.map(t=>t.label),...opps().flatMap(o=>o.tags)])];
  if(typeof pipeRenderAll==='function'&&document.getElementById('p-pipeline'))try{pipeRenderAll();}catch(e){}
}
if(typeof pipeRefreshFilterOptions==='function'){
  const base=pipeRefreshFilterOptions;
  window.pipeRefreshFilterOptions=function(){base();FILTER_OPTS.source=[...new Set([...SOURCES.filter(s=>!s.archived).map(s=>s.label),...FILTER_OPTS.source])];FILTER_OPTS.tag=[...new Set([...TAGS.map(t=>t.label),...FILTER_OPTS.tag])];};
}
crmSync();

// ---------- Page wiring ----------
const C=(k,title,desc,render,extra={})=>({k:'custom',title,desc,render,...extra});
const addLink=(label,fn)=>`<div class="ss-add"><button type="button" class="au-link" ${ro()?'disabled':''} onclick="${fn}">+ ${esc(label)}</button></div>`;
const pg=P.sales;
pg.b=[pg.b[0],
  C('custom','Stages','Drag to reorder, or open a stage to change it. Core stages are fixed so deals and payments stay consistent.',()=>stagesHtml()),
  C('custom','Lost reasons','What reps choose when they close an opportunity as lost.',()=>lostHtml()+addLink('Add lost reason','stLostOpen()'))];
pg.acts=[['Add stage','f:stStageOpen']];
const st=P['sales/statuses'];
st.b=[C('custom','Unit statuses','Five fixed statuses. Open one to rename it or choose what buyers see.',()=>statusHtml()),
  {k:'fields',title:'Holds',desc:'Changes apply to new holds; running holds keep their expiry.',rows:[
    ['Hold expires after','stepper','72 hours',{h:'Running holds keep their old expiry',step:12}],
    ['Remind the holder','select','24 hours before',{}],
    ['When a hold expires','select','Offer it to the next buyer waiting',{h:'Buyers waiting on the unit are in its waitlist, in order'}],
    ['Extending a hold','select','With manager approval',{}],
    ['Holds per rep at once','stepper','5 holds',{h:'Stops one rep blocking the best units'}],
    ['Holds per buyer at once','stepper','2 holds',{}]]}];
const ld=P['sales/leads'];
ld.b=[ld.b[0],C('custom','Lead sources','Where leads come from. Drag to set the order reps see them in the new opportunity form.',()=>sourcesHtml())];
ld.acts=[['Add source','f:stSourceOpen']];
const al=P['sales/allocation'];
al.b=[C('custom','Per development','Open a development to override the workspace default.',()=>devAllocHtml()),
  {k:'fields',title:'Workspace default',desc:'Used by every development without an override.',rows:[['Default method','select','Round robin',{h:'Round robin: next rep in the order below. Paused reps and reps at their limit are skipped.'}],['Claim pool fallback','select','Round robin after 30 min',{s:'Unclaimed leads in a claim pool',h:'A lead nobody claims is allocated so it never waits'}]]},
  C('custom','Reps who take part','Drag to set the rotation order. Open a rep to pause them for holidays, change their weight or set a limit.',()=>repsHtml())];
const dc=P['sales/docs'];
dc.b=DOC_STAGES.map(s=>C('custom',s,s==='Reservation'?'Drag to reorder. Required documents can block the stage until they’re in.':'',()=>docsHtml(s)+addLink(`Add ${s.toLowerCase()} document`,`stDocOpen(null,${js(s)})`)));
dc.acts=[['Add document','f:stDocOpen']];
const pl=P['sales/plans'];
pl.b=[C('custom','Payment plan templates','A starting point for each deal. Open one to change its milestones.',()=>plansHtml())];
pl.acts=[['New plan','f:stPlanOpen']];
const tg=P['sales/targets'];
tg.b=[C('custom',undefined,undefined,()=>targetsHtml())];
tg.acts=[['Add target','f:stTargetOpen']];
X.tabDesc['sales/targets']='Dashboards compare against these targets, never the team median. Open a target to change it.';
const tags=P['sales/tags'];
tags.b=[C('custom','Tags','Tags reps can add to opportunities and contacts. Drag to set the order they’re suggested in.',()=>tagsHtml())];
tags.acts=[['New tag','f:stTagOpen']];
})();
