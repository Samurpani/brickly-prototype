// New development setup v2 (Bricly New Development v2 + New Development Flows v2), rendered from newdev-data.js.
// Questions first: one question per screen, files read in the background, imports reviewed near the end,
// a brief built from the answers, and a draft that only becomes visible to the team once activated.
let ndS=null;
const ndT={};
const ND_STORAGE_KEY='bricly.newdev.v2';
let ndStorageErrorNotified=false;
const ND_SPIN='<span class="nd-spin" aria-hidden="true"></span>';
const ND_MORE={place:[{n:'Qammieħ Bay',why:'The ridge and the bay below it'},{n:'Kala Point',why:'The headland over the small bay'}],building:[{n:'Three Terraces',why:'Three blocks of deep terraces'},{n:'The Steps',why:'The stepped blocks down the ridge'}],story:[{n:'Watchtower Rise',why:'The coastal tower on the skyline'},{n:'Torri Gardens',why:'The tower and the old farm terraces'}],lifestyle:[{n:'Bay Mornings',why:'Coffee on the terrace, then the beach'},{n:'North Shore Living',why:'Clear for overseas buyers'}]};
function ndD(){return window.ND2;}
function ndNew(){
  return {view:'setup',step:'project',si:null,ans:{},files:{},chip:{},own:{},ownOpen:{},helpOn:{},sugOff:{},text:{},form:{},addr:'',addrState:null,
    picks:{primary:[],secondary:[]},countries:ndD().COUNTRIES.map((c,i)=>({...c,st:i?'proposed':'approved'})),ctyQ:'',proc:'idle',rev:{},save:'saved',done:{},
    requested:false,exported:false,modal:null,activated:false,nameSel:null,nameFrom:null,nameTab:'place',more:{},ownName:null,blockN:3,blocks:['A','B','C','D','E','F'],
    qp:{},direct:50,soldQ:{},finishes:[['','']],terms:{dep:'',stage:'',bal:'',notes:''},ldate:'2027-01-18',sorting:false,sortN:0,mood:null,briefEdit:{},
    releaseCap:42,hubTab:'overview',activity:[{text:'Draft created',at:new Date().toISOString()}],savedAt:new Date()};
}
function ndPersist(){
  if(!ndS)return;
  try{localStorage.setItem(ND_STORAGE_KEY,JSON.stringify(ndS));}
  catch(error){
    console.error('Unable to save the development draft.',error);
    if(!ndStorageErrorNotified){showToast('Could not save this draft in browser storage. Your changes may not survive a reload.');ndStorageErrorNotified=true;}
  }
}
function ndQueuePersist(){clearTimeout(ndT.persist);ndT.persist=setTimeout(ndPersist,250);}
function ndRestore(){
  try{
    const raw=localStorage.getItem(ND_STORAGE_KEY);if(!raw)return;
    const data=JSON.parse(raw);
    if(!data||typeof data!=='object'||!data.ans||!data.files)throw new Error('Saved development draft is incomplete.');
    const base=ndNew(),saved={...base,...data};
    ['ans','files','chip','own','ownOpen','helpOn','sugOff','text','form','rev','done','more','qp','soldQ','terms','briefEdit'].forEach(k=>{saved[k]={...base[k],...(data[k]||{})};});
    saved.picks={...base.picks,...(data.picks||{}),primary:[...(data.picks?.primary||[])],secondary:[...(data.picks?.secondary||[])]};
    saved.countries=Array.isArray(data.countries)?data.countries:base.countries;
    saved.blocks=Array.isArray(data.blocks)?data.blocks:base.blocks;
    saved.finishes=Array.isArray(data.finishes)?data.finishes:base.finishes;
    saved.activity=Array.isArray(data.activity)?data.activity:base.activity;
    saved.savedAt=new Date(data.savedAt||Date.now());
    if(Number.isNaN(saved.savedAt.getTime()))saved.savedAt=new Date();
    saved.save='saved';
    if(saved.step==='name'){saved.step='project';saved.si=saved.ans.name==='Needs a name'?'nameProps':'blockNames';}
    if(!ndD().STEPS.some(([k])=>k===saved.step))saved.step='project';
    if(!['setup','brief','act','hub'].includes(saved.view))saved.view='setup';
    if(saved.proc==='running'){saved.proc='done';saved.sorting=false;saved.sortN=ndFileCountFor(saved);}
    saved.modal=null;saved.mood=null;saved.sorting=false;
    ndS=saved;
  }catch(error){
    console.error('Unable to restore the development draft.',error);
    showToast('Your saved development draft could not be restored. Check browser storage before starting a new setup.');
  }
}
function ndFileCountFor(s){return ndInvSlots().filter(x=>s.files[x[0]]).length;}
function ndLog(text){
  ndS.activity.unshift({text,at:new Date().toISOString()});
  ndS.activity=ndS.activity.slice(0,30);
}
function ndCtx(){const s=ndS,B=ndD().BUY;const pk=[...s.picks.primary,...s.picks.secondary].map(k=>B.find(b=>b.k===k)).filter(Boolean);return {...s.ans,intl:pk.some(b=>b.intl),investor:pk.some(b=>b.inv)};}
function ndSteps(){const c=ndCtx();return ndD().STEPS.filter(([k])=>k!=='launch'||c.launch!=='Already selling');}
function ndScreens(step){const c=ndCtx();return (ndD().Q[step]||[]).filter(q=>!q.show||q.show(c));}
function ndCurQ(){
  const s=ndS,sc=ndScreens(s.step),hit=sc.find(q=>q.id===s.si);if(hit)return hit;
  const all=ndD().Q[s.step]||[],oi=all.findIndex(q=>q.id===s.si),after=all.slice(oi+1).find(q=>sc.includes(q));
  return after||sc.find(q=>s.ans[q.id]==null)||sc[sc.length-1];
}
function ndFmt(a){return Array.isArray(a)?a.join(', '):(a==null?'':String(a));}
function ndAnd(a){return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];}
function ndTitle(){const a=ndS.ans;return ndS.nameSel||(a.name&&!['Needs a name','Not decided yet'].includes(a.name)?a.name:'New development');}
function ndInvSlots(){return ndD().Q.inventory.find(q=>q.id==='files').slots;}
function ndFileCount(){return ndInvSlots().filter(x=>ndS.files[x[0]]).length;}
function ndSavedTxt(){return ndS.save==='saving'?'Saving…':'Saved just now';}
function ndFlash(){
  const s=ndS;s.save='saving';s.savedAt=new Date();const el=document.getElementById('nd-saved');if(el)el.textContent=ndSavedTxt();
  ndQueuePersist();
  clearTimeout(ndT.save);ndT.save=setTimeout(()=>{s.save='saved';const e=document.getElementById('nd-saved');if(e)e.textContent=ndSavedTxt();ndPersist();},600);
}
function ndOn(){const p=document.getElementById('p-newdev');return !!(p&&p.classList.contains('on'));}

// Entry points
function ndStart(){
  if(typeof awCan==='function'&&!awCan('development'))return;
  if(ndS&&!ndS.activated){showToast('You have a setup in progress. Picking up where you left off.');ndShow();return;}
  ndS=ndNew();ndShow();
}
function ndResume(){if(ndS){if(ndS.activated){ndS.view='hub';ndS.hubTab='overview';ndShow();return;}ndShow();}}
function ndShow(){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('p-newdev').classList.add('on');
  document.querySelectorAll('.ni').forEach(n=>n.classList.toggle('on',n.dataset.page==='developments'));
  ndRender(true);
}
function ndCrumb(){
  const t=ndS.view==='hub'?'Development hub':ndS.view==='brief'?'Brief':ndS.view==='act'?'Activate':'Setup';
  document.getElementById('crumb').innerHTML=`<a onclick="go('developments')">Developments</a><span class="sep">/</span><span class="cur">${xesc(t==='Setup'?ndTitle():t+' · '+ndTitle())}</span>`;
}
function ndExit(msg){go('developments');if(msg)showToast(msg);}

// Navigation between questions and steps
function ndGoStep(k){
  const s=ndS;if(k==='buyers'&&!s.picks.primary.length&&s.ans.buyers==null)s.picks={primary:[ndD().SUG.primary.k],secondary:[ndD().SUG.secondary.k]};
  const sc=ndScreens(k),f=k==='imports'?sc.find(q=>q.id==='imports'):sc.find(q=>s.ans[q.id]==null)||sc[0];s.view='setup';s.step=k;s.si=f?f.id:null;ndRender(true);
}
function ndStartImport(){
  const s=ndS;if(s.proc!=='idle'||!ndFileCount())return;s.proc='running';
  clearTimeout(ndT.proc);ndT.proc=setTimeout(()=>ndFinishImport(),9000);
}
function ndFinishImport(){
  const s=ndS;if(!s||s.proc!=='running')return;clearTimeout(ndT.proc);s.proc='done';
  ndPersist();if(ndOn()){showToast('Your files are read. Review them at the end of setup.');ndRender();}
}
function ndAdvance(fromId){
  const s=ndS,sc=ndScreens(s.step),i=sc.findIndex(q=>q.id===fromId),nx=sc[i+1];
  if(nx){s.si=nx.id;ndRender(true);return;}
  const steps=ndSteps(),k=steps.findIndex(([x])=>x===s.step),ns=steps[k+1];s.done[s.step]=1;
  if(s.step==='inventory'&&ndFileCount()){
    ndStartImport();s.sorting=true;s.sortN=0;ndRender(true);clearInterval(ndT.sort);let n=0;const total=ndFileCount();
    ndT.sort=setInterval(()=>{n++;s.sortN=n;if(ndS!==s){clearInterval(ndT.sort);return;}if(ndOn())ndRender();
      if(n>=total){clearInterval(ndT.sort);setTimeout(()=>{s.sorting=false;if(ndS===s&&ns){if(ndOn())ndGoStep(ns[0]);else{s.step=ns[0];s.si=null;}}},600);}},420);
    return;
  }
  if(ns)ndGoStep(ns[0]);else ndRender(true);
}
function ndAnswer(id,v){ndS.ans[id]=v;ndFlash();ndAdvance(id);}
function ndBack(){
  const s=ndS;if(s.view==='hub'){s.hubTab='overview';return ndRender(true);}
  if(s.view!=='setup'){s.view='setup';s.step='review';s.si=s.ans.review?'complete':'review';return ndRender(true);}
  const sc=ndScreens(s.step),i=sc.findIndex(q=>q.id===(ndCurQ()||{}).id);if(i>0){s.si=sc[i-1].id;return ndRender(true);}
  const steps=ndSteps(),k=steps.findIndex(([x])=>x===s.step);if(k>0){const p=steps[k-1][0],ps=ndScreens(p);s.step=p;s.si=ps.length?ps[ps.length-1].id:null;ndRender(true);}
}
function ndSkipStage(){
  const s=ndS,q=ndCurQ();s.ans[q.id]='Skipped';s.done[s.step]=1;ndFlash();
  const steps=ndSteps(),k=steps.findIndex(([x])=>x===s.step),ns=steps[k+1];if(ns)ndGoStep(ns[0]);
}

// Header and step rail
function ndHeadHtml(){
  const s=ndS,pill=s.ans.imports!=null?'':s.proc==='running'?`<span class="nd-pill run">${ND_SPIN}Reading ${ndFileCount()} files in the background</span>`:s.proc==='done'?'<span class="nd-pill ok">Imports ready to review</span>':'';
  return `<div class="nd-head"><button type="button" class="nd-link" data-nd="exit">‹ Developments</button>
    <div class="nd-head-t"><div class="nd-row"><b>${xesc(ndTitle())}</b><span class="nd-chip warn">Draft</span>${pill}</div><span class="nd-saved"><i></i><span id="nd-saved">${ndSavedTxt()}</span></span></div>
    <div class="nd-head-a"><button type="button" class="btn-ghost" data-nd="hub">Open hub</button><button type="button" class="btn-ghost nd-outline" data-nd="close">Close and resume later</button></div></div>`;
}
function ndStepLine(k){
  const s=ndS,A=s.ans;
  if(k==='inventory'&&s.done.inventory)return s.proc==='running'?'Reading files in the background':s.proc==='done'?'Files read · review at the end':'Saved';
  if(k==='project'&&A.ptype)return A.ptype+(A.tier?' · '+A.tier:'');
  if(k==='buyers'&&s.done.buyers)return (s.picks.primary.length+s.picks.secondary.length)+' buyer types selected';
  if(k==='collateral'&&s.done.collateral)return A.cintro==='Skipped'?'Skipped · add later':'Collateral recorded';
  if(k==='launch'&&s.done.launch)return A.lintro==='Skipped'?'Skipped · add later':A.plan==='Yes'?'Plan uploaded':'Decisions recorded';
  return '';
}
function ndRailHtml(){
  const s=ndS,steps=ndSteps(),doneN=steps.filter(([k])=>s.done[k]).length,cq=ndCurQ();
  const prog=steps.map(([k])=>`<i class="${s.done[k]?'done':k===s.step?'cur':''}"></i>`).join('');
  const items=steps.map(([k,l,est],i)=>{
    const st=s.step===k?'cur':s.done[k]?'done':'todo',line=st!=='cur'?ndStepLine(k):'';
    const subs=st==='cur'?`<div class="nd-subs">${ndScreens(k).map(q=>{const a=s.ans[q.id],cur=cq&&cq.id===q.id&&!s.sorting;
      return `<button type="button" class="nd-sub${cur?' on':''}${a!=null?' ans':''}" data-nd="q:${q.id}"><i></i><span class="nd-col"><span>${xesc(q.s)}</span>${a!=null&&!cur&&q.type!=='intro'&&ndFmt(a)?`<small>${xesc(ndFmt(a))}</small>`:''}</span></button>`;}).join('')}</div>`:'';
    return `<div class="nd-step ${st}"><button type="button" class="nd-stepb" data-nd="step:${k}"><span class="nd-num">${st==='done'?'✓':i+1}</span><span class="nd-col"><span>${xesc(l)}</span>${line?`<small>${xesc(line)}</small>`:''}</span>${st==='todo'&&est?`<span class="nd-est">${est}</span>`:''}</button>${subs}</div>`;
  }).join('');
  return `<aside class="nd-rail"><div class="nd-rail-h"><span>Setup</span><span>${doneN} of ${steps.length} done</span></div><div class="nd-prog">${prog}</div>${items}<p class="nd-rail-f">Jump to any step. Answers save as you go, and only activation has hard requirements.</p></aside>`;
}

// Question bodies
function ndSugHtml(q){
  if(!q.sug||ndS.sugOff[q.id]||ndS.ans[q.id]!=null)return '';
  return `<div class="nd-sug"><div class="nd-sug-h">✦ Suggested · not saved until you pick it</div><b>${xesc(q.sug.v)}</b><p>${xesc(q.sug.why)}</p>
    <div class="nd-row nd-mu">Based on ${q.sug.basis.map(x=>`<span class="nd-basis">${xesc(x)}</span>`).join('')}</div>
    <div class="nd-row"><button type="button" class="btn-primary" data-nd="usesug">Use this</button><button type="button" class="nd-link" data-nd="sugoff">I’ll choose</button></div></div>`;
}
function ndCardsHtml(q){
  const a=ndS.ans[q.id],sug=q.sug&&q.sug.v;
  if(q.mood)return ndSugHtml(q)+`<div class="nd-moods">${q.opts.map(([l,d],i)=>{const m=ndD().MOOD[l]||{pal:['#ddd','#bbb','#999','#777'],f:'inherit',w:500};
    return `<div class="nd-mood${a===l?' on':''}" role="button" tabindex="0" data-nd="card:${i}"><div class="nd-sw">${m.pal.map((c,j)=>`<span style="background:${c}">${j===0?`<b style="font-family:${m.f};font-weight:${m.w};color:${m.pal[1]}">Aa</b>`:''}</span>`).join('')}<button type="button" class="nd-moodb" data-nd="mood:${i}">⤢ View moodboard</button></div>
      <div class="nd-mood-t"><div class="nd-row"><b>${xesc(l)}</b>${sug===l?'<span class="nd-chip sug">Suggested</span>':''}</div><span class="nd-mu">${xesc(d)}</span></div></div>`;}).join('')}</div><p class="nd-mu nd-note">Open any option to see its moodboard full screen.</p>`;
  return ndSugHtml(q)+`<div class="nd-cards n${Math.min(q.opts.length,3)}">${q.opts.map(([l,d],i)=>`<button type="button" class="nd-opt${a===l?' on':''}" data-nd="card:${i}"><span class="nd-row"><b>${xesc(l)}</b>${sug===l?'<span class="nd-chip sug">Suggested</span>':''}</span>${d?`<span class="nd-mu">${xesc(d)}</span>`:''}</button>`).join('')}</div>`;
}
function ndChipOpts(q){return [...q.opts.map(o=>Array.isArray(o)?o[0]:o),...(ndS.own[q.id]||[])];}
function ndChipDefault(q){
  const s=ndS;if(q.id!=='langs')return [];
  const ok=s.countries.filter(c=>c.st==='approved').map(c=>c.n),L=['English'];
  if(ok.includes('Italy'))L.push('Italian');if(ok.includes('Germany'))L.push('German');return L;
}
function ndChipSel(q){const s=ndS;if(!s.chip[q.id])s.chip[q.id]=Array.isArray(s.ans[q.id])?[...s.ans[q.id]]:ndChipDefault(q);return s.chip[q.id];}
function ndChipsHtml(q){
  const s=ndS,sel=ndChipSel(q),opts=ndChipOpts(q);
  let h=q.list?`<div class="nd-list">${q.opts.map(([l,d],i)=>`<button type="button" class="nd-li${sel.includes(l)?' on':''}" data-nd="chip:${i}"><span class="nd-box">${sel.includes(l)?'✓':''}</span><span class="nd-col"><b>${xesc(l)}</b><span class="nd-mu">${xesc(d)}</span></span></button>`).join('')}</div>`
    :`<div class="nd-chips">${opts.map((l,i)=>`<button type="button" class="nd-chipb${sel.includes(l)?' on':''}" data-nd="chip:${i}">${sel.includes(l)?'✓ ':''}${xesc(l)}${q.sugChips&&i<q.opts.length?' <span class="nd-chip sug">Suggested</span>':''}</button>`).join('')}
      ${q.free?(s.ownOpen[q.id]?`<span class="nd-own"><input class="nd-input sm" data-nd-in="own" placeholder="Type and press Enter" aria-label="Add your own"><button type="button" class="btn-ghost nd-outline" data-nd="ownadd">Add</button></span>`:`<button type="button" class="nd-chipb add" data-nd="ownopen">+ Add your own</button>`):''}</div>`;
  h+=`<p class="nd-mu nd-note">${sel.length?sel.length+' selected':'Pick any that apply'}</p>`;
  if(q.help){
    h+=s.helpOn[q.id]?`<div class="nd-sug"><div class="nd-sug-h">✦ Draft answer · edit before you use it</div><p>${xesc(q.help)}</p><div class="nd-row nd-mu">Based on ${q.helpBasis.map(x=>`<span class="nd-basis">${xesc(x)}</span>`).join('')}</div>
      <div class="nd-row"><button type="button" class="btn-primary" data-nd="usehelp">Use this answer</button><button type="button" class="nd-link" data-nd="nohelp">Discard</button></div></div>`
      :`<button type="button" class="nd-help" data-nd="help">✦ Help me answer</button>`;
  }
  return h;
}
function ndQuarterHtml(key,p){
  const Y=[2026,2027,2028,2029,2030];
  return `<div class="nd-lab">Quarter</div><div class="nd-qgrid q4">${['Q1','Q2','Q3','Q4'].map(x=>`<button type="button" class="nd-opt c${p.q===x?' on':''}" data-nd="qp:${key}:q:${x}">${x}</button>`).join('')}</div>
    <div class="nd-lab">Year</div><div class="nd-qgrid q5">${Y.map(x=>`<button type="button" class="nd-opt c${p.y===String(x)?' on':''}" data-nd="qp:${key}:y:${x}">${x}</button>`).join('')}</div>`;
}
function ndUploadsHtml(q){
  const s=ndS,wip=(q.id==='brandUp'&&s.ans.brand==='Still changing')||(q.id==='rendUp'&&s.ans.renders==='Still changing');
  return `<div class="nd-ups">${q.slots.map(([k,l,d,sample,kind,ph])=>{const f=s.files[k];
    if(kind==='link')return `<div class="nd-up"><span class="nd-upic">↗</span><span class="nd-col"><b>${xesc(l)}</b><input class="nd-input sm" data-nd-in="file:${k}" placeholder="${xesc(ph||'Paste the link')}" value="${xesc(f||'')}" aria-label="${xesc(l)}"></span></div>`;
    return `<div class="nd-up${f?' on':''}"><span class="nd-upic">${f?'✓':'⇪'}</span><span class="nd-col"><b>${xesc(l)}</b>${f?`<span class="nd-row"><span>${xesc(f)}</span>${wip?'<span class="nd-chip warn">Work in progress</span>':''}</span>`:d?`<span class="nd-mu">${xesc(d)}</span>`:''}</span>
      ${f?`<button type="button" class="nd-link" data-nd="rm:${k}">Remove</button>`:`<button type="button" class="btn-ghost nd-outline" data-nd="up:${k}" aria-label="Upload ${xesc(l)}">Upload</button>`}</div>`;}).join('')}</div>
    <p class="nd-mu nd-note">Images, PDF, documents, spreadsheets or video. You can also paste a link.</p>`;
}
function ndTermsTotal(){const t=ndS.terms;return ['dep','stage','bal'].reduce((n,k)=>n+(Number(t[k])||0),0);}
function ndTermsHtml(){
  const s=ndS,t=s.terms;
  if(s.files.terms)return `<div class="nd-ups"><div class="nd-up on"><span class="nd-upic">✓</span><span class="nd-col"><b>Payment terms and finishes</b><span>${xesc(s.files.terms)}</span></span><button type="button" class="nd-link" data-nd="rm:terms">Remove</button></div></div>`;
  const row=(k,l)=>`<label class="nd-trow"><span>${l}</span><span class="nd-pct"><input class="nd-input sm" inputmode="numeric" data-nd-in="terms:${k}" value="${xesc(t[k])}" aria-label="${l}"><span>%</span></span></label>`;
  return `<div class="nd-card"><div class="nd-row nd-between"><b>Payment terms</b><span class="nd-mu" id="nd-ttot">Total ${ndTermsTotal()}%</span></div>
      ${row('dep','Deposit on promise of sale')}${row('stage','Stage payments during construction')}${row('bal','Balance on final deed')}
      <label class="nd-col nd-gap"><span class="nd-lab">Notes</span><textarea class="nd-input" rows="2" data-nd-in="terms:notes" aria-label="Notes">${xesc(t.notes)}</textarea></label></div>
    <div class="nd-card"><b>Finishes list</b><div class="nd-fins"><div class="nd-fin h"><span>Area</span><span>Finish or specification</span><span></span></div>
      ${s.finishes.map((f,i)=>`<div class="nd-fin"><input class="nd-input sm" data-nd-in="fin:${i}:0" value="${xesc(f[0])}" placeholder="e.g. Kitchen" aria-label="Area ${i+1}"><input class="nd-input sm" data-nd-in="fin:${i}:1" value="${xesc(f[1])}" placeholder="e.g. Quartz worktops, integrated appliances" aria-label="Finish ${i+1}"><button type="button" class="nd-link" data-nd="finrm:${i}" aria-label="Remove finish">×</button></div>`).join('')}</div>
      <button type="button" class="nd-link" data-nd="finadd">+ Add finish</button></div>
    <button type="button" class="btn-ghost nd-outline" data-nd="up:terms">Upload a document instead</button>`;
}
function ndBuyersHtml(){
  const s=ndS,ND=ndD(),bn=k=>(ND.BUY.find(b=>b.k===k)||{}).n,sugK=[ND.SUG.primary.k,ND.SUG.secondary.k];
  const note=s.proc==='done'?'We’ve preselected the buyers marked Suggested from your unit mix, prices and sales nearby.':'We’ve preselected the buyers marked Suggested from location and sales nearby. Once your availability list is read, we’ll refine them using unit mix and prices.';
  return `<div class="nd-sug flat"><span>✦</span><p>${note}</p></div>
    <p class="nd-mu">Primary: ${xesc(s.picks.primary.map(bn).join(', ')||'none yet')} · Secondary: ${xesc(s.picks.secondary.map(bn).join(', ')||'none yet')}</p>
    <div class="nd-buyers">${ND.BUY.map(b=>{const p=s.picks.primary.includes(b.k),se=s.picks.secondary.includes(b.k);
      return `<div class="nd-buyer${p||se?' on':''}"><div class="nd-row nd-between nd-top"><b>${xesc(b.n)}</b>${sugK.includes(b.k)?'<span class="nd-chip sug">✦ Suggested</span>':''}</div><p class="nd-mu">${xesc(b.d)}</p>
        <div class="nd-row nd-between nd-budget"><span class="nd-mu">Budget</span><span>${xesc(b.b)}</span></div>
        <div class="nd-pair"><button type="button" class="${p?'on':''}" data-nd="pick:${b.k}:primary" aria-pressed="${p}">${p?'✓ ':''}Primary</button><button type="button" class="${se?'on':''}" data-nd="pick:${b.k}:secondary" aria-pressed="${se}">${se?'✓ ':''}Secondary</button></div></div>`;}).join('')}</div>`;
}
function ndCountriesHtml(q){
  const s=ndS;
  return `<p class="nd-mu nd-src">✦ ${xesc(q.src)}</p><div class="nd-ctys">${s.countries.map((c,i)=>`<div class="nd-cty ${c.st}"><div class="nd-col"><div class="nd-row"><b>${xesc(c.n)}</b><span class="nd-chip ${c.st==='approved'?'ok':'sug'}">${c.st==='approved'?'Approved':'Suggested'}</span></div><span class="nd-mu">${xesc(c.why)}</span>
      ${c.pct?`<div class="nd-row"><span class="nd-bar"><i style="width:${Math.min(100,c.pct*2.2)}%"></i></span><span class="nd-mu">${c.pct}% of buyers</span></div>`:''}</div>
      <div class="nd-row">${c.st!=='approved'?`<button type="button" class="btn-primary nd-ink" data-nd="cty:ok:${i}">Approve</button>`:''}<button type="button" class="nd-link" data-nd="cty:rm:${i}">Remove</button></div></div>`).join('')}</div>
    <div class="nd-row nd-ctyadd"><input class="nd-input" data-nd-in="ctyq" placeholder="Search countries" value="${xesc(s.ctyQ)}" aria-label="Add a country"><button type="button" class="btn-ghost nd-outline" data-nd="ctyadd">Add</button>${s.countries.some(c=>c.st!=='approved')?'<button type="button" class="btn-primary nd-ink" data-nd="ctyall">Approve all</button>':''}</div>`;
}
function ndSplitHtml(){
  const s=ndS,d=s.direct;
  return `<div class="nd-card"><b>Sales split</b><div class="nd-two"><label class="nd-col"><span class="nd-lab">Sold direct (%)</span><input class="nd-input" inputmode="numeric" id="nd-dir" data-nd-in="direct" value="${d}"></label>
      <label class="nd-col"><span class="nd-lab">Sold by agents (%)</span><input class="nd-input" id="nd-agt" value="${100-d}" readonly></label></div>
      <input type="range" min="0" max="100" step="5" id="nd-dirr" data-nd-in="directr" value="${d}" aria-label="Sold direct">
      <span class="nd-bar big"><i id="nd-sbar" style="width:${d}%"></i></span><div class="nd-row nd-between nd-mu"><span id="nd-dl">Direct ${d}%</span><span id="nd-al">Agents ${100-d}%</span></div></div>
    <div class="nd-card"><b>Sold-out target</b>${ndQuarterHtml('sold',s.soldQ)}</div>`;
}
function ndNamingHtml(){
  const s=ndS,ND=ndD(),ang=ND.NAMES.find(a=>a.k===s.nameTab)||ND.NAMES[0],names=[...ang.names,...(s.more[ang.k]?ND_MORE[ang.k]:[])];
  return `<div class="nd-angles">${ND.NAMES.map(a=>`<button type="button" class="nd-angle${a.k===s.nameTab?' on':''}" data-nd="ntab:${a.k}"><span class="nd-row"><b>${xesc(a.l)}</b>${s.nameFrom===a.k?'<i class="nd-dot" aria-label="Your pick is from here"></i>':''}</span><span>${xesc(a.d)}</span></button>`).join('')}</div>
    <div class="nd-names">${names.map((n,i)=>`<button type="button" class="nd-name${s.nameSel===n.n?' on':''}" data-nd="nsel:${i}"><span class="nd-serif">${xesc(n.n)}</span><span class="nd-mu">${xesc(n.why)}</span></button>`).join('')}
      ${s.nameFrom==='own'?`<button type="button" class="nd-name on"><span class="nd-serif">${xesc(s.nameSel)}</span><span class="nd-mu">Your own name</span></button>`:''}</div>
    ${s.ownName!=null?`<div class="nd-row"><input class="nd-input" data-nd-in="ownname" value="${xesc(s.ownName)}" placeholder="Type a name" aria-label="Your own name"><button type="button" class="btn-primary" data-nd="ownname">Use this name</button></div>`:''}
    <div class="nd-row">${s.more[ang.k]?'':'<button type="button" class="btn-ghost nd-outline nd-green" data-nd="nmore">More names like these</button>'}<button type="button" class="btn-ghost nd-outline" data-nd="nown">Type my own</button></div>
    <p class="nd-mu nd-note">Checking trademarks and domains is up to you. The selected name becomes the development name and can change later.</p>`;
}
function ndImpState(k){const r=ndS.rev;return k==='avail'?(r.avail?'ok':'need'):k==='plans'?(r.plans?'ok':'need'):'ready';}
function ndImportsHtml(){
  const s=ndS,run=s.proc==='running',rows=ndD().IMPORTS.filter(r=>s.files[r.k]);
  if(!rows.length)return `<div class="nd-sug flat"><span>!</span><p>No inventory files were uploaded. Add the availability list from the development page when you have it. It’s the only file activation needs.</p></div>`;
  const notice=run?`<div class="nd-sug flat"><span>${ND_SPIN}</span><p>Still reading ${Math.min(2,rows.length)} file${rows.length>1?'s':''}. You can review the finished ones now; the rest appear here when ready.</p></div>`:'';
  return notice+`<div class="nd-imps">${rows.map((r,i)=>{const pend=run&&i>=rows.length-2,st=ndImpState(r.k);
    const res=r.k==='avail'&&s.rev.avail?'42 units reviewed':r.k==='plans'&&s.rev.plans?'24 plans matched to units':r.res;
    return `<div class="nd-card nd-imp"><div class="nd-col"><div class="nd-row"><b>${xesc(r.n)}</b>${r.need?`<span class="nd-chip">${xesc(r.need)}</span>`:''}</div><span class="nd-mu">${xesc(s.files[r.k])}</span>${pend?`<span class="nd-mu">${ND_SPIN} Reading…</span>`:`<span>${xesc(res)}</span>`}</div>
      ${pend?'':`<div class="nd-row">${st==='need'?'<span class="nd-chip warn">Needs you</span>':st==='ok'?'<span class="nd-chip ok">Reviewed</span>':'<span class="nd-chip">Ready</span>'}<button type="button" class="btn-ghost nd-outline" data-nd="imp:${r.k}">${st==='ok'?'View':xesc(r.act)}</button></div>`}</div>`;}).join('')}</div>
    <p class="nd-mu nd-note">Prices and statuses stay as drafts until you confirm them. Only the availability list is needed to activate.</p>`;
}
function ndSavedHtml(){
  const f=ndS.files,R=[['avail','42 units','Saved as off-market draft units'],['plans','24 floor plans',ndS.rev.plans?'Matched to units':'21 matched · 3 to place later'],['arch','18 drawing sheets','Filed under Files'],['elev','4 elevations','Ready for unit mapping'],['site','Site plan','Filed under Files'],['spec','Specification','36 inclusions saved']].filter(r=>f[r[0]]);
  return `<div class="nd-card nd-center"><span class="nd-okc">✓</span><p>Saved as a draft. Only you and the Bricly team can see it until you activate.</p></div>
    ${R.length?`<div class="nd-card nd-rows">${R.map(r=>`<div class="nd-row nd-between"><b>${r[1]}</b><span class="nd-mu">${r[2]}</span></div>`).join('')}</div>`:''}
    <p class="nd-mu nd-note">Next, confirm the unit imports and finish setup.</p>`;
}
function ndAddrHtml(q){
  const s=ndS,a=s.ans[q.id],st=s.addrState||(a?'found':null);
  return `<div class="nd-row"><input class="nd-input" data-nd-in="addr" placeholder="Search the address" value="${xesc(s.addr)}" aria-label="Address"><button type="button" class="btn-ghost nd-outline" data-nd="addrgo">Search</button></div>
    ${!st?'<button type="button" class="nd-addrsug" data-nd="addrpick"><b>Triq il-Qammieħ, Mellieħa</b><span class="nd-mu">Mellieħa, Malta · from your recent searches</span></button>':''}
    ${st==='nf'?'<div class="nd-err">We couldn’t find that address. New roads often aren’t on the map yet. Drag the pin to the site instead.</div>':''}
    ${st?`<div class="nd-map"><span class="nd-pin"></span><span class="nd-map-l">${st==='nf'?'Drag to adjust':'Pin on the site'}</span></div>
      <div class="nd-row">${a?'<span class="nd-chip ok">✓ Pin confirmed</span>':'<button type="button" class="btn-primary" data-nd="pin">Confirm pin</button>'}</div>`:''}`;
}
function ndBody(q){
  const s=ndS,a=s.ans[q.id];
  switch(q.type){
    case 'text':return `<input class="nd-input lg" data-nd-in="text:${q.id}" placeholder="${xesc(q.ph||'')}" value="${xesc(s.text[q.id]??(a&&a!==q.alt?.v&&a!=='Not decided yet'?a:''))}" aria-label="${xesc(q.s)}">
      ${q.alt?`<div class="nd-or"><span>or</span></div><button type="button" class="nd-alt${a===q.alt.v?' on':''}" data-nd="alt"><span class="nd-altic">✦</span><span class="nd-col"><b>${xesc(q.alt.l)}</b><span class="nd-mu">${xesc(q.alt.note)}</span></span></button>`:''}`;
    case 'address':return ndAddrHtml(q);
    case 'cards':return ndCardsHtml(q);
    case 'blocks':return `<div class="nd-qgrid q5">${[2,3,4,5,6].map(n=>`<button type="button" class="nd-opt c${s.blockN===n?' on':''}" data-nd="blk:${n}">${n}</button>`).join('')}</div>
      <div class="nd-lab">What are they called?</div><div class="nd-blocks">${Array.from({length:s.blockN},(_,i)=>`<label class="nd-col"><span class="nd-mu">Block ${i+1}</span><input class="nd-input sm" data-nd-in="block:${i}" value="${xesc(s.blocks[i]||'')}" aria-label="Block ${i+1} name"></label>`).join('')}</div>
      <div class="nd-or"><span>or</span></div><button type="button" class="nd-alt${/names to come/.test(a||'')?' on':''}" data-nd="blklater"><span class="nd-altic">✦</span><span class="nd-col"><b>${xesc(q.alt.l)}</b><span class="nd-mu">${xesc(q.alt.note)}</span></span></button>`;
    case 'chips':return ndChipsHtml(q);
    case 'quarter':return ndQuarterHtml(q.id,s.qp[q.id]||{});
    case 'form':return `<div class="nd-form">${q.fields.map(([l,,ph],i)=>`<label class="nd-col"><span class="nd-lab">${xesc(l)}</span><input class="nd-input" data-nd-in="form:${q.id}:${i}" placeholder="${xesc(ph)}" value="${xesc((s.form[q.id]||[])[i]||'')}"></label>`).join('')}</div>`;
    case 'date':return `<label class="nd-col"><span class="nd-lab">Launch date</span><input type="date" class="nd-input nd-date" data-nd-in="ldate" value="${xesc(s.ldate)}"></label>${s.ldate?`<p class="nd-mu nd-note">${ndWeeks()} weeks from today.</p>`:''}`;
    case 'uploads':return ndUploadsHtml(q);
    case 'terms':return ndTermsHtml();
    case 'buyers':return ndBuyersHtml();
    case 'countries':return ndCountriesHtml(q);
    case 'intro':return q.id==='cintro'?`<p class="nd-lead">Next we’ll go through your marketing material one item at a time: brand, renders, brochure, then everything else. For each, tell us whether you have it, don’t, or it’s still changing.</p>
      <div class="nd-cards n3">${[['Have it','Upload it. It’s stored on the development and used across Bricly.'],['Still changing','Upload what exists. It’s labelled work in progress until you replace it.'],['Don’t have it','A few questions, then it goes into a brief for Bricly or your own team.']].map(([l,d])=>`<div class="nd-opt static"><b>${l}</b><span class="nd-mu">${d}</span></div>`).join('')}</div><p class="nd-mu nd-note">About 5 minutes. Missing material never blocks activation.</p>`:'';
    case 'note':return `<div class="nd-card"><p>${xesc(q.body)}</p></div>`;
    case 'split':return ndSplitHtml();
    case 'naming':return ndNamingHtml();
    case 'imports':return ndImportsHtml();
    case 'saved':return ndSavedHtml();
    case 'review':return ndReviewHtml();
    case 'complete':return ndCompleteHtml();
  }
  return '';
}
function ndSortHtml(){
  const s=ndS,rows=ndD().SORT.filter((r,i)=>s.files[ndInvSlots()[i][0]]),steps=ndSteps(),k=steps.findIndex(([x])=>x==='inventory'),ns=steps[k+1];
  return `<div class="nd-sorting"><span class="nd-spin big"></span><h2>Evaluating your uploads</h2><p class="nd-mu">Bricly is sorting your files and reading what’s inside. This carries on in the background once you move on.</p>
    <div class="nd-card nd-rows">${rows.map((r,i)=>`<div class="nd-row"><span class="nd-sortic">${i<s.sortN?'<span class="nd-okc sm">✓</span>':i===s.sortN?ND_SPIN:'<i class="nd-o"></i>'}</span><span class="nd-col"><span${i>s.sortN?' class="nd-mu"':''}>${r[0]}</span>${i<s.sortN?`<small class="nd-mu">${r[1]}</small>`:''}</span></div>`).join('')}</div>
    ${ns?`<p class="nd-mu">Next: ${xesc(ns[1])}</p>`:''}</div>`;
}

// Review, brief and activation
function ndWeeks(){const v=ndS.ldate;if(!v)return null;const t=new Date();t.setHours(0,0,0,0);return Math.max(0,Math.round((new Date(v+'T00:00')-t)/6048e5));}
function ndFmtDate(v){if(!v)return '';const d=new Date(v+'T00:00');return d.getDate()+' '+d.toLocaleString('en-GB',{month:'short'})+' '+d.getFullYear();}
function ndBlocksTxt(){
  const A=ndS.ans,m=/^(\d+) blocks?/.exec(A.blocks||'');if(!m)return '';
  const named=A.blockNames&&A.blockNames!=='Not decided yet'?A.blockNames.split(' · '):(/names to come/.test(A.blocks)?[]:(A.blocks.split(' · ')[1]||'').split(/,\s*|\s+and\s+/).filter(Boolean));
  return m[1]+' blocks'+(named.length?' ('+named.join(', ')+')':'');
}
function ndNeedList(){
  const A=ndS.ans,r=[];if(A.brandHelp==='Yes, help me')r.push('Brand identity');if(A.renders!=='Yes'&&Array.isArray(A.rendNeed)&&A.rendNeed.length)r.push('Renders shot list');
  if(A.broNeed==='Yes, add it')r.push('Brochure');(Array.isArray(A.otherNeed)?A.otherNeed:[]).forEach(x=>r.push(x));return r;
}
function ndBrief(){
  const s=ndS,A=s.ans,B=ndD().BUY,bn=k=>(B.find(b=>b.k===k)||{}).n||'',F=x=>Array.isArray(x)?x.join(', '):(x==null||x==='Not decided yet'?'':String(x));
  const nm=ndTitle()==='New development'?'Working title to be confirmed':ndTitle(),sell=A.launch==='Already selling',ctry=s.countries.filter(x=>x.st==='approved').map(x=>x.n),w=ndWeeks(),c=ndCtx();
  const need=[];if(A.brandHelp==='Yes, help me')need.push('brand identity');if(A.renders!=='Yes'&&Array.isArray(A.rendNeed)&&A.rendNeed.length)need.push('renders ('+A.rendNeed.map(x=>x.toLowerCase()).join(', ')+')');
  if(A.broNeed==='Yes, add it')need.push('brochure'+(A.broSpec?' ('+A.broSpec.toLowerCase()+')':''));(Array.isArray(A.otherNeed)?A.otherNeed:[]).forEach(x=>need.push(x.toLowerCase()));
  const have=[];if(A.brand==='Yes')have.push('project brand');if(A.renders==='Yes'||A.renders==='Still changing')have.push('renders'+(A.renders==='Still changing'?' (work in progress)':''));if(A.brochure==='Yes')have.push('brochure');
  (Array.isArray(A.otherHave)?A.otherHave:[]).forEach(x=>have.push(x.toLowerCase()));(Array.isArray(A.live)?A.live:[]).forEach(x=>have.push(x.toLowerCase()+' (live)'));
  const S=[];
  S.push(['Project context',[nm+' is a '+(F(A.ptype)||'residential').toLowerCase()+' development'+(ndBlocksTxt()?' of '+ndBlocksTxt():'')+(A.loc?' on Triq il-Qammieħ, Mellieħa':'')+' by Vella Holdings.',A.tier&&A.tier!=='Not decided yet'?'Positioned as '+F(A.tier).toLowerCase()+'.':'',A.build&&A.build!=='Not decided yet'?F(A.build)+(F(A.compl)?', completion expected '+F(A.compl):'')+'.':'',sell?'Already selling.'+(A.sold?' Sales so far recorded in Bricly.':''):(F(A.ldate)?'Launch planned for '+F(A.ldate)+'.':''),'Unit mix and prices come from the availability list'+(A.pricing==='Units yes, prices not yet'?' (prices to follow)':'')+'.'].filter(Boolean).join(' ')]);
  S.push(['Target buyers',['Primary: '+(s.picks.primary.map(bn).join(', ')||'to be confirmed')+'.',s.picks.secondary.length?'Secondary: '+s.picks.secondary.map(bn).join(', ')+'.':'',ctry.length?'Buyer countries: '+ctry.join(', ')+'.':'',Array.isArray(A.langs)&&A.langs.length?'Marketing in '+ndAnd(A.langs)+'.':'',c.intl&&A.legal==='No'?'No legal or visa partner yet for overseas buyers.':''].filter(Boolean).join(' ')]);
  if(Array.isArray(A.features)&&A.features.length)S.push(['Project features',A.features.join(', ')+'.']);
  if(F(A.reasons))S.push(['Top reasons to buy',F(A.reasons).replace(/\.$/,'')+'.']);
  if(Array.isArray(A.comp)&&A.comp.length)S.push(['Competitors',A.comp.join(', ')+'.']);
  if(A.brandHelp==='Yes, help me')S.push(['Brand brief',['A project brand is needed.',F(A.feel)?'Feel: '+F(A.feel).toLowerCase()+'.':'',A.devline==='Yes'?'Show “by Vella Holdings” under the logo.':'',A.refs&&A.refs!=='Nothing uploaded yet'?'References supplied.':''].filter(Boolean).join(' ')]);
  if(need.length)S.push(['Requested deliverables','Planned, not yet produced: '+need.join(' · ')+'.'+(F(A.rendStyle)?' Render style: '+F(A.rendStyle).toLowerCase()+'.':'')]);
  if(have.length)S.push(['Existing material',have.join(', ').replace(/^./,x=>x.toUpperCase())+'.']);
  if(!sell){const g=[];if(A.plan==='Yes')g.push('Launch plan supplied by the developer; decisions below confirmed from it.');if(F(A.model))g.push(F(A.model)+'.');if(F(A.plist))g.push('Price list '+F(A.plist).toLowerCase()+'.');if(Array.isArray(A.chan)&&A.chan.length)g.push('Channels: '+A.chan.join(', ')+'.');if(F(A.budget))g.push('Budget range recorded.');if(F(A.target))g.push(F(A.target)+'.');if(A.gtm==='No, I need help')g.push('A go-to-market plan is requested as part of this brief.');if(g.length)S.push(['Go-to-market',g.join(' ')]);}
  else S.push(['Sales to date',[A.sold?'Sales so far recorded.':'',Array.isArray(A.live)&&A.live.length?'Already live: '+A.live.join(', ')+'.':'',A.deals&&A.deals!=='No'?'Existing leads and deals to be migrated.':''].filter(Boolean).join(' ')||'Already selling; details to follow.']);
  if(!sell&&w!=null&&F(A.ldate))S.push(['Timing',w+' weeks to launch'+(w<(c.intl?16:12)?', which is tight'+(c.intl?' with overseas buyers':'')+'.':'.')+(need.length?' Brand first, then renders, brochure and website. Ads go live four weeks before launch.':'')]);
  const open=[];Object.keys(A).forEach(k=>{if(A[k]==='Not decided yet'){const q=Object.values(ndD().Q).flat().find(x=>x.id===k);if(q)open.push(q.s);}});if(open.length)S.push(['Open questions',open.join(' · ')+'.']);
  return S.map(([t,b])=>[t,ndS.briefEdit[t]??b]);
}
function ndGaps(){
  const s=ndS,A=s.ans,c=ndCtx(),g=[];
  Object.keys(ndD().Q).forEach(st=>ndD().Q[st].forEach(q=>{if(A[q.id]==='Not decided yet')g.push({t:q.s+' · not decided yet',k:st});}));
  if(!s.files.terms&&!((Number(s.terms.dep)||0)>0))g.push({t:'Payment terms not added',k:'inventory'});
  if(A.pricing==='Units yes, prices not yet')g.push({t:'Prices still to be added to units',k:'inventory'});
  if(c.intl&&A.legal==='No')g.push({t:'No legal or visa partner for overseas buyers',k:'buyers'});
  if(!s.files.avail)g.push({t:'Availability list not uploaded yet',k:'inventory'});
  return g;
}
function ndTagCls(v){return {'Supplied':'ok','Goes in the brief':'info','Shot list in brief':'info','Still changing':'warn','Not needed':''}[v]||'';}
function ndReviewHtml(){
  const s=ndS,A=s.ans,B=ndD().BUY,bn=k=>(B.find(b=>b.k===k)||{}).n,F2=x=>ndFmt(x)||'—',c=ndCtx(),sell=A.launch==='Already selling',W=ndWeeks();
  const rev=[{t:'Project',k:'project',rows:[['Name',A.name==='Needs a name'?(s.nameSel?s.nameSel+' · picked in setup':'Needs a name'):F2(A.name)],['Location',A.loc?'Confirmed':'Not confirmed'],['Type',F2(A.ptype)+(ndBlocksTxt()?' · '+ndBlocksTxt():'')],['Completion',F2(A.compl)],['Launch',sell?'Already selling':(A.ldate&&A.ldate!=='Not decided yet'?'Planned '+A.ldate:'—')]]},
    {t:'Inventory',k:'imports',rows:[['Availability list',!s.files.avail?'Not uploaded':s.rev.avail?'42 units reviewed':'Read · not reviewed'],['Floor plans',!s.files.plans?'Not uploaded':s.rev.plans?'All matched':'3 to place'],['Drawings',s.files.arch||s.files.elev?'Read · elevations detected':'Not uploaded']]},
    {t:'Buyers',k:'buyers',rows:[['Primary',s.picks.primary.map(bn).join(', ')||'—'],['Secondary',s.picks.secondary.map(bn).join(', ')||'—'],['Countries',F2(A.countries)]]},
    sell?{t:'Sales so far',k:'project',rows:[['Sales',F2(A.sold)],['Already live',F2(A.live)],['Existing deals',F2(A.deals)]]}:{t:'Launch',k:'launch',rows:[['Launch plan',F2(A.plan)],['Go-to-market',F2(A.gtm)],['Targets',F2(A.target)],['Production',A.production?(/Bricly/.test(A.production)?'Bricly produces everything':'Own creative agency'):'—']]}];
  const ON=Array.isArray(A.otherNeed)?A.otherNeed:[],OH=Array.isArray(A.otherHave)?A.otherHave:[];
  const oth=n=>ON.includes(n)?'Goes in the brief':(OH.includes(n)?'Supplied':'Not needed');
  const col=[['Brand',A.brand==='Yes'?'Supplied':A.brandHelp==='Yes, help me'?'Goes in the brief':A.brand==='Still changing'?'Still changing':'Not needed'],['Renders',A.renders==='Yes'?'Supplied':A.renders==='Still changing'?'Still changing':(Array.isArray(A.rendNeed)&&A.rendNeed.length?'Shot list in brief':'Not needed')],['Brochure',A.brochure==='Yes'?'Supplied':A.brochure==='Still changing'?'Still changing':A.broNeed==='Yes, add it'?'Goes in the brief':'Not needed'],['Website',oth('Website')],['Sales presentation',oth('Sales presentation')],['Ad designs',oth('Ad designs')],['Lifestyle content',oth('Lifestyle content')],['Marketing / lifestyle video',oth('Marketing / lifestyle video')],['Social media',ON.includes('Social media')?'Goes in the brief':OH.includes('Social media profiles')?'Supplied':'Not needed'],['Email templates',oth('Email templates')]];
  const gaps=ndGaps(),need=c.intl?16:12,res=W==null?'':W>=need?'On track':W>=need-4?'Tight':'At risk',lt=!sell&&W!=null&&A.ldate&&A.ldate!=='Not decided yet';
  const bricly=/Bricly/.test(A.production||'');
  return `${lt?`<div class="nd-lead-t ${res==='On track'?'ok':res==='Tight'?'warn':'err'}"><div class="nd-row nd-between"><span class="nd-cap">Lead-time check</span><span>${W} weeks until launch</span></div><b>${res}</b>
      <p>${c.intl?'With overseas buyers, 16 or more weeks is comfortable':'For local buyers, 12 or more weeks is comfortable'}: assets take one to two months and ads go live four weeks before launch.</p><small>This check never blocks anything.</small></div>`:''}
    <div class="nd-revs">${rev.map(r=>`<div class="nd-card"><div class="nd-row nd-between"><b>${r.t}</b><button type="button" class="nd-link green" data-nd="step:${r.k}">Edit</button></div><dl class="nd-dl">${r.rows.map(([l,v])=>`<dt>${l}</dt><dd>${xesc(v)}</dd>`).join('')}</dl></div>`).join('')}</div>
    <div class="nd-card"><b>Marketing collateral</b><div class="nd-colls">${col.map(([n,v])=>`<div class="nd-row nd-between"><span>${n}</span><span class="nd-chip ${ndTagCls(v)}">${v}</span></div>`).join('')}</div></div>
    <div class="nd-card"><div class="nd-row nd-between"><b>Gaps</b><span class="nd-chip ${gaps.length?'warn':'ok'}">${gaps.length||'None'}</span></div>${gaps.length?gaps.map(g=>`<button type="button" class="nd-gap" data-nd="step:${g.k}"><span>${xesc(g.t)}</span><span class="nd-mu">Answer ›</span></button>`).join(''):'<p class="nd-mu">Nothing open.</p>'}<small class="nd-mu">Gaps never block activation.</small></div>
    <div class="nd-card"><b>Brief</b><p class="nd-mu">${A.production?(bricly?'You chose Bricly to produce everything. Send the brief and we’ll reply with a quote.':'You chose your own creative agency. Export the brief and hand it to them.'):'Choose who produces the material first.'}</p>
      <div class="nd-row"><button type="button" class="btn-ghost nd-outline" data-nd="brief">Open the brief</button>${s.requested?'<span class="nd-chip ok">Sent to Bricly</span>':s.exported?'<span class="nd-chip ok">Exported</span>':''}</div></div>`;
}
function ndCompleteHtml(){
  const s=ndS,gaps=ndGaps();
  const rows=[['Project and buyers','Facts, buyer types and countries recorded','Saved',1],['Imports',s.rev.avail?'42 units reviewed. Floor plans and drawings filed.':'Files read. Units still to review before activation.',s.rev.avail?'Reviewed':'To review',s.rev.avail],['Brief',s.requested?'Sent to Bricly for a quote':s.exported?'Exported for your agency':'Ready to send or export',s.requested?'Sent':s.exported?'Exported':'Ready',s.requested||s.exported],['Gaps',gaps.length?gaps.length+' open item'+(gaps.length===1?'':'s')+', listed on the development page':'No open items',gaps.length?String(gaps.length):'None',!gaps.length]];
  const next=[['Bricly replies',s.requested?'Scope and price for the brief, usually within two working days.':'Send the brief when you’re ready. Nothing starts without your go-ahead.'],['Activate when ready',`Your sales team sees the development and ${s.releaseCap} units become active in Bricly.`],['Fill the gaps','Anything marked Not decided yet can be answered from the development page.']];
  return `<div class="nd-card nd-center"><span class="nd-okc lg">✓</span><h3>${xesc(ndTitle())} is set up as a draft</h3><p class="nd-mu">Only you and the Bricly team can see it. Your sales team sees it once you activate. Nothing has been published anywhere.</p></div>
    <div class="nd-card nd-rows">${rows.map(([t,d,v,ok])=>`<div class="nd-row nd-between"><span class="nd-row"><span class="nd-okc sm ${ok?'':'warn'}">${ok?'✓':'!'}</span><span class="nd-col"><b>${t}</b><span class="nd-mu">${xesc(d)}</span></span></span><span class="nd-chip ${ok?'ok':'warn'}">${v}</span></div>`).join('')}</div>
    <b class="nd-h4">What happens next</b><div class="nd-cards n3">${next.map(([t,d])=>`<div class="nd-opt static"><b>${t}</b><span class="nd-mu">${d}</span></div>`).join('')}</div>
    <div class="nd-row"><button type="button" class="btn-ghost nd-outline" data-nd="act">Activate now</button><span class="nd-mu">or open the development and activate later</span></div>`;
}
function ndBriefHtml(){
  const s=ndS,S=ndBrief(),req=ndNeedList(),bricly=/Bricly/.test(s.ans.production||''),today=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  const send=`<button type="button" class="${bricly?'btn-primary':'btn-ghost nd-outline'}" data-nd="sendbrief" ${s.requested?'disabled':''}>${s.requested?'Sent to Bricly':'Send to Bricly for a quote'}</button>`,exp=`<button type="button" class="${bricly?'btn-ghost nd-outline':'btn-primary'}" data-nd="export">Export for my agency</button>`;
  return `<div class="nd-head"><button type="button" class="nd-link" data-nd="back">‹ Review</button><div class="nd-head-t"><div class="nd-row"><b>Brief · ${xesc(ndTitle())}</b><span class="nd-chip">Planned work only</span></div><span class="nd-saved"><i></i><span id="nd-saved">${ndSavedTxt()}</span></span></div>
      <div class="nd-head-a">${bricly?exp+send:send+exp}</div></div>
    <div class="nd-brief"><div class="nd-bedit"><div class="nd-card nd-req"><b>Requested deliverables</b>${req.length?req.map(r=>`<div class="nd-row nd-between"><span>${xesc(r)}</span><span class="nd-chip ${s.requested?'ok':'info'}">${s.requested?'Requested':'Planned'}</span></div>`).join(''):'<p class="nd-mu">Nothing to produce. Everything on your checklist is supplied.</p>'}</div>
      ${S.map(([t,b],i)=>`<label class="nd-col nd-gap"><span class="nd-lab">${xesc(t)}</span><textarea class="nd-input" rows="3" data-nd-in="bed:${i}">${xesc(b)}</textarea></label>`).join('')}</div>
      <div class="nd-bdoc"><article class="nd-paper"><div class="nd-row nd-between nd-cap"><span>Marketing brief</span><span>${today} · v1</span></div><h1 class="nd-serif">${xesc(ndTitle()==='New development'?'Working title':ndTitle())}</h1><p class="nd-mu">Vella Holdings · Mellieħa, Malta</p>
        <div class="nd-planned">This brief describes planned work. None of the requested deliverables exist yet.</div>
        ${S.map(([t,b],i)=>`<section><span class="nd-cap">${xesc(t)}</span><p id="nd-bp-${i}">${xesc(b)}</p></section>`).join('')}</article></div></div>`;
}
function ndHubHtml(){
  const s=ndS,A=s.ans,active=s.activated,steps=ndSteps(),done=steps.filter(([k])=>s.done[k]).length;
  const tabs=[['overview','Overview'],['inventory','Inventory'],['marketing','Marketing'],['files','Files'],['activity','Activity'],['activation','Activation']];
  let content='';
  if(s.hubTab==='inventory'){
    content=`<div class="nd-card"><div class="nd-row nd-between"><b>Inventory and drawings</b><span class="nd-chip ${s.rev.avail?'ok':'warn'}">${s.rev.avail?'Units reviewed':'Review needed'}</span></div>
      <p class="nd-mu">${s.rev.avail?'42 units confirmed as off-market drafts. They stay off market until activation.':s.files.avail?'Availability list read. Confirm the unit data before activation.':'Upload an availability list to add units.'}</p>
      <div class="nd-row">${s.files.avail?`<button type="button" class="btn-ghost nd-outline" data-nd="imp:avail">${s.rev.avail?'View units':'Review units'}</button>`:`<button type="button" class="btn-ghost nd-outline" data-nd="step:inventory">Add inventory</button>`}<button type="button" class="btn-ghost nd-outline" data-nd="step:inventory">Manage files</button></div></div>${ndSavedHtml()}`;
  }else if(s.hubTab==='marketing'){
    const needs=ndNeedList();
    content=`<div class="nd-card"><div class="nd-row nd-between"><b>Marketing brief</b><span class="nd-chip ${s.requested?'ok':'info'}">${s.requested?'Sent for a quote':s.exported?'Exported':'Draft'}</span></div>
      <p class="nd-mu">${s.requested?'Bricly will reply with scope and price. Nothing starts until you accept the quote.':s.exported?'The brief is ready for your agency.':'Planned work and requested deliverables are collected here.'}</p>
      <div class="nd-row"><button type="button" class="btn-ghost nd-outline" data-nd="brief">Open the brief</button>${!active?'<button type="button" class="btn-ghost nd-outline" data-nd="setup">Continue setup</button>':''}</div></div>
      <div class="nd-card nd-rows"><b>Requested deliverables</b>${needs.length?needs.map(x=>`<div class="nd-row nd-between"><span>${xesc(x)}</span><span class="nd-chip info">${s.requested?'Requested':'Planned'}</span></div>`).join(''):'<p class="nd-mu">Nothing is currently on the production checklist.</p>'}</div>
      <div class="nd-card">${ndBrief().map(([title,body])=>`<div class="nd-gap static"><b>${xesc(title)}</b><p class="nd-mu">${xesc(body)}</p></div>`).join('')}</div>`;
  }else if(s.hubTab==='files'){
    content=`<div class="nd-card nd-rows"><div class="nd-row nd-between"><b>Development files</b><button type="button" class="btn-ghost nd-outline" data-nd="step:inventory">Add files</button></div>
      ${ndD().IMPORTS.map(f=>{const has=s.files[f.k],status=s.rev[f.k]?'Reviewed':has&&s.proc==='done'?'Ready to review':has?'Saved':'Not added';return `<div class="nd-row nd-between"><span class="nd-col"><b>${xesc(f.n)}</b><span class="nd-mu">${xesc(has?s.files[f.k]:f.f)}</span></span><span class="nd-row"><span class="nd-chip ${s.rev[f.k]?'ok':has?'info':''}">${status}</span>${has?`<button type="button" class="btn-ghost nd-outline" data-nd="imp:${f.k}">View</button>`:''}</span></div>`;}).join('')}</div>`;
  }else if(s.hubTab==='activity'){
    content=`<div class="nd-card nd-rows"><b>Activity</b>${s.activity.length?s.activity.map(item=>{const d=new Date(item.at),when=Number.isNaN(d.getTime())?'':d.toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});return `<div class="nd-row nd-between"><span>${xesc(item.text)}</span><span class="nd-mu">${xesc(when)}</span></div>`;}).join(''):'<p class="nd-mu">No activity recorded yet.</p>'}</div>`;
  }else if(s.hubTab==='activation'){
    content=ndActHtml();
  }else{
    const project=[['Location',A.loc||'Not confirmed'],['Project type',A.ptype||'Not decided'],['Build stage',A.build||'Not decided'],['Buyers',s.picks.primary.length+s.picks.secondary.length+' selected']];
    const needs=ndNeedList();
    content=`<div class="nd-card"><div class="nd-row nd-between"><span class="nd-chip ${active?'ok':'warn'}">${active?'Active':'Draft · private'}</span><span class="nd-mu">Setup ${done} of ${steps.length} steps</span></div>
      <div class="nd-row nd-between"><h3>${xesc(ndTitle())}</h3>${!active?'<button type="button" class="btn-ghost nd-outline" data-nd="setup">Continue setup</button>':''}</div>
      <dl class="nd-dl">${project.map(([label,value])=>`<dt>${label}</dt><dd>${xesc(value)}</dd>`).join('')}</dl></div>
      <div class="nd-card"><div class="nd-row nd-between"><b>Inventory</b><span class="nd-chip ${s.rev.avail?'ok':'warn'}">${s.rev.avail?'Reviewed':'Needs review'}</span></div><p class="nd-mu">${s.rev.avail?'42 units reviewed and held as off-market drafts.':s.files.avail?'Availability list read · confirm units before activation.':'Availability list not uploaded.'}</p><button type="button" class="btn-ghost nd-outline" data-nd="hubtab:inventory">Open inventory</button></div>
      <div class="nd-card"><div class="nd-row nd-between"><b>Brief and production</b><span class="nd-chip ${s.requested?'ok':'info'}">${s.requested?'Sent':s.exported?'Exported':'In progress'}</span></div><p class="nd-mu">${needs.length?needs.length+' deliverables planned.':'No production deliverables planned yet.'}</p><button type="button" class="btn-ghost nd-outline" data-nd="hubtab:marketing">Open marketing</button></div>
      <div class="nd-card"><div class="nd-row nd-between"><b>Activation</b><span class="nd-chip ${active?'ok':ndCanActivate()?'info':'warn'}">${active?'Active':ndCanActivate()?'Ready':'Not ready'}</span></div><p class="nd-mu">${active?`${s.releaseCap} units are active.`:'Confirm the location and review availability to activate.'}</p><button type="button" class="btn-ghost nd-outline" data-nd="hubtab:activation">View activation</button></div>`;
  }
  return `<div class="nd-hub"><div class="nd-head"><button type="button" class="nd-link" data-nd="exit">‹ Developments</button><div class="nd-head-t"><div class="nd-row"><b>${xesc(ndTitle())}</b><span class="nd-chip ${active?'ok':'warn'}">${active?'Active':'Draft'}</span></div><span class="nd-mu">${active?'Development hub':'Private until activated'}</span></div><div class="nd-head-a">${!active?'<button type="button" class="btn-ghost nd-outline" data-nd="act">Activate</button>':''}</div></div>
    <div class="nd-row">${tabs.map(([key,label])=>`<button type="button" class="${s.hubTab===key?'btn-primary':'btn-ghost nd-outline'}" data-nd="hubtab:${key}">${label}</button>`).join('')}</div>
    <div class="nd-hub-content">${content}</div></div>`;
}
function ndCanActivate(){
  const s=ndS,cap=Number(s.releaseCap);
  return !!(s.files.avail&&s.rev.avail&&s.ans.loc&&Number.isInteger(cap)&&cap>=1&&cap<=42);
}
function ndActHtml(){
  const s=ndS,name=ndTitle()==='New development'?'this development':ndTitle();
  if(s.activated)return `<div class="nd-actwrap"><div class="nd-card nd-center"><span class="nd-okc lg">✓</span><h3>${xesc(ndTitle())} is active</h3><p class="nd-mu">Your managers and sales reps can now see it in Developments, search and Present Mode. ${s.releaseCap} units are live in the CRM. Nothing was published to a website, portal or campaign.</p><button type="button" class="btn-primary" data-nd="livehub">Open the live hub</button></div></div>`;
  const units=!!(s.files.avail&&s.rev.avail),loc=!!s.ans.loc,gaps=ndGaps().filter(g=>!/Availability list/.test(g.t));
  const cap=Number.isInteger(Number(s.releaseCap))?Number(s.releaseCap):0,after=186+cap;
  const CK=ok=>ok?'<span class="nd-okc sm">✓</span>':'<span class="nd-okc sm err">!</span>';
  const checks=[['Activation fee','Recorded by Bricly as cleared for this development.','Cleared',true],['Name and location',loc?`${ndTitle()==='New development'?'Working title':ndTitle()} · Triq il-Qammieħ, Mellieħa`:'Confirm the site location before activating.',loc?'Confirmed':'Missing',loc],
    ['Units reviewed',units?'42 units reviewed.':s.files.avail?'Your availability list was read but no units are reviewed yet.':'No availability list yet. Upload it to add units.',units?'42 units':'0 of 42',units],['Unit cap',`${after} of 250 active units after activation.`,after<=250?'Within cap':'Over account cap',after<=250]];
  const can=ndCanActivate(),why=!loc?'Confirm the location before activating.':!units?'Review at least one unit before activating.':cap<1||cap>42?'Choose between 1 and 42 units.':'';
  return `<div class="nd-actwrap"><button type="button" class="nd-link" data-nd="back">‹ ${xesc(ndTitle())}</button><div class="page-title">Activate ${xesc(name)}</div><p class="page-sub">Activation makes the development available to your sales team in Bricly. It publishes nothing to a website, portal or campaign.</p>
    <div class="nd-card nd-rows">${checks.map(([l,d,v,ok])=>`<div class="nd-row nd-between"><span class="nd-row">${CK(ok)}<span class="nd-col"><b>${l}</b><span class="nd-mu">${xesc(d)}</span></span></span><span class="nd-chip ${ok?'ok':'err'}">${v}</span></div>`).join('')}<small class="nd-mu">The fee status is set by Bricly and is read-only here.</small></div>
    <div class="nd-card"><b>Unit cap</b><div class="nd-capg">${[['186','Active units now'],['250','Account cap'],['+'+cap,'This development adds'],[String(after),'After activation']].map(([n,l])=>`<div><span class="nd-kv">${n}</span><span class="nd-mu">${l}</span></div>`).join('')}</div>
      <span class="nd-bar big cap"><i style="width:74%"></i><i class="add" style="width:${Math.min(100,cap/250*100)}%"></i></span><label class="nd-col"><span class="nd-lab">Units to release (1–42)</span><input type="number" min="1" max="42" class="nd-input sm" data-nd-in="cap" value="${cap||''}" aria-label="Units to release"></label><small class="nd-mu">Available, held and reserved units count. Sold, off-market and draft units don’t.</small></div>
    <div class="nd-card"><div class="nd-row nd-between"><b>Gaps</b><span class="nd-mu">For information · never blocks activation</span></div>${gaps.length?gaps.map(g=>`<div class="nd-gap static">${xesc(g.t)}</div>`).join(''):'<p class="nd-mu">Nothing open.</p>'}</div>
    <div class="nd-row nd-end">${why?`<span class="nd-mu">${why}</span>`:''}${!units?`<button type="button" class="btn-ghost nd-outline" data-nd="step:${s.files.avail?'imports':'inventory'}">Open availability import</button>`:''}<button type="button" class="btn-primary" data-nd="activate" ${can?'':'disabled'}>Activate</button></div></div>`;
}
function ndModalHtml(){
  const s=ndS;if(!s.modal)return '';const name=ndTitle()==='New development'?'this development':ndTitle();
  const M=s.modal==='request'?{t:'Send this brief to Bricly for a quote?',b:'The Bricly team will reply with a quote for the material below. Nothing starts until you accept it.',list:ndNeedList(),p:'Send to Bricly'}
    :{t:`Activate ${name}?`,b:`Managers and sales reps on your account will see it in Developments, search, selectors and Present Mode. ${s.releaseCap} units become active. Nothing is published to a website, portal or campaign.`,list:[],p:'Activate'};
  return `<div class="nd-modal-bg" data-nd="modal-x"><div class="nd-modal" role="dialog" aria-modal="true" aria-label="${xesc(M.t)}"><h3>${xesc(M.t)}</h3><p class="nd-mu">${xesc(M.b)}</p>${M.list.length?`<ul>${M.list.map(x=>`<li>${xesc(x)}</li>`).join('')}</ul>`:''}
    <div class="nd-row nd-end"><button type="button" class="btn-ghost nd-outline" data-nd="modal-x">Cancel</button><button type="button" class="btn-primary" data-nd="modal-ok">${M.p}</button></div></div></div>`;
}
function ndMoodHtml(){
  const s=ndS;if(s.mood==null)return '';const q=ndD().Q.collateral.find(x=>x.id==='feel'),[l,d]=q.opts[s.mood],m=ndD().MOOD[l];
  return `<div class="nd-mood-full" role="dialog" aria-modal="true" aria-label="Moodboard · ${xesc(l)}"><div class="nd-row nd-between"><div class="nd-col"><b>${xesc(l)}</b><span>${xesc(d)} · placeholder images</span></div><button type="button" class="nd-x" data-nd="moodx" aria-label="Close moodboard">×</button></div>
    <div class="nd-mood-stage"><button type="button" class="nd-arrow" data-nd="moodnav:-1" aria-label="Previous feel">‹</button>
      <div class="nd-mood-board"><div class="nd-mb-type" style="background:${m.pal[0]};color:${m.pal[3]}"><span style="font-family:${m.f};font-weight:${m.w}">${xesc(l.split(' ')[0])}</span><small style="font-family:${m.f}">Aa Bb Cc 0123</small></div>${m.pal.map((c,i)=>`<div class="nd-mb-tile t${i}" style="background:linear-gradient(135deg,${c},${m.pal[(i+1)%4]})"></div>`).join('')}</div>
      <button type="button" class="nd-arrow" data-nd="moodnav:1" aria-label="Next feel">›</button></div>
    <div class="nd-row nd-between"><div class="nd-row">${q.opts.map(([x],i)=>`<button type="button" class="nd-thumb${i===s.mood?' on':''}" data-nd="moodgo:${i}" aria-label="${xesc(x)}" style="background:linear-gradient(90deg,${ndD().MOOD[x].pal.join(',')})"></button>`).join('')}</div><button type="button" class="btn-primary" data-nd="moodpick">Choose this feel</button></div></div>`;
}
function ndCanCont(q){
  const s=ndS,a=s.ans[q.id];
  switch(q.type){case 'text':return !!((s.text[q.id]||'').trim()||a!=null);case 'address':case 'cards':return a!=null;case 'quarter':{const p=s.qp[q.id]||{};return !!(p.q&&p.y)||a!=null;}
    case 'buyers':return s.picks.primary.length>0;case 'naming':return !!s.nameSel;default:return true;}
}
function ndQHtml(){
  const s=ndS;if(s.sorting)return ndSortHtml();const q=ndCurQ();if(!q)return '';
  const steps=ndSteps(),si=steps.findIndex(([k])=>k===s.step),sc=ndScreens(s.step),qi=sc.indexOf(q),ns=steps[si+1],last=qi===sc.length-1;
  const first=si===0&&qi===0,contL=q.type==='intro'?'Start':last&&ns?'Continue to '+ns[1]:'Continue';
  const foot=q.type==='complete'?`<div class="nd-foot"><button type="button" class="nd-link" data-nd="back">‹ Back</button><span></span><button type="button" class="btn-primary" data-nd="finish">Open development hub</button></div>`
    :`<div class="nd-foot">${first?'<span></span>':'<button type="button" class="nd-link" data-nd="back">‹ Back</button>'}<span class="nd-row">${q.skipStage?'<button type="button" class="btn-ghost nd-outline" data-nd="skipstage">Skip this stage</button>':''}${!q.noSkip?'<button type="button" class="nd-link u" data-nd="nd">Not decided yet</button>':''}<button type="button" class="btn-primary" data-nd="cont" ${ndCanCont(q)?'':'disabled'}>${contL}</button></span></div>`;
  return `<div class="nd-meta">Step ${si+1} · ${xesc(steps[si][1])} · ${qi+1} of ${sc.length}${q.grp?` <span class="nd-chip">${xesc(q.grp)}</span>`:''}</div><h2 class="nd-qt">${xesc(q.t)}</h2>${q.h?`<p class="nd-qh">${xesc(q.h)}</p>`:''}
    <div class="nd-qb">${ndBody(q)}</div>${foot}`;
}
function ndRender(top){
  const root=document.getElementById('nd-root');if(!root||!ndS||!ndOn())return;
  const s=ndS;ndCrumb();ndPersist();
  const main=s.view==='hub'?ndHubHtml():s.view==='brief'?ndBriefHtml():s.view==='act'?ndActHtml():`${ndHeadHtml()}<div class="nd-body">${ndRailHtml()}<main class="nd-main"><div class="nd-q">${ndQHtml()}</div></main></div>`;
  root.className='nd-shell nd-v-'+s.view;root.innerHTML=main+ndModalHtml()+ndMoodHtml();
  if(top){const c=document.getElementById('content');if(c)c.scrollTop=0;}
}

// Actions
function ndSlotSample(k){if(k==='terms')return 'Payment terms and finishes.pdf';for(const st of Object.values(ndD().Q))for(const q of st)for(const sl of q.slots||[])if(sl[0]===k)return sl[3]||sl[1]+'.pdf';return k+'.pdf';}
function ndContinue(){
  const s=ndS,q=ndCurQ();if(!q||!ndCanCont(q))return;
  switch(q.type){
    case 'text':{const v=(s.text[q.id]??'').trim();return v?ndAnswer(q.id,v):ndAdvance(q.id);}
    case 'address':case 'cards':return ndAdvance(q.id);
    case 'blocks':{const names=s.blocks.slice(0,s.blockN).map(x=>(x||'').trim()).filter(Boolean);return ndAnswer(q.id,s.blockN+' blocks · '+(names.length?ndAnd(names):'names to come'));}
    case 'chips':return ndAnswer(q.id,[...ndChipSel(q)]);
    case 'quarter':{const p=s.qp[q.id]||{};return p.q&&p.y?ndAnswer(q.id,p.q+' '+p.y):ndAdvance(q.id);}
    case 'form':return ndAnswer(q.id,(s.form[q.id]||[]).some(Boolean)?q.fmt:'Not decided yet');
    case 'date':return ndAnswer(q.id,s.ldate?ndFmtDate(s.ldate):'Not decided yet');
    case 'uploads':{const got=q.slots.filter(x=>s.files[x[0]]);return ndAnswer(q.id,q.id==='otherHave'?got.map(x=>x[1]):got.length?got.length+' of '+q.slots.length+' uploaded':'Nothing uploaded yet');}
    case 'terms':return ndAnswer(q.id,s.files.terms?'Document uploaded':ndTermsTotal()>0?'Terms recorded':s.finishes.some(f=>f[0]||f[1])?'Finishes recorded':'Nothing added yet');
    case 'buyers':{const bn=k=>ndD().BUY.find(b=>b.k===k).n;return ndAnswer('buyers',[...s.picks.primary,...s.picks.secondary].map(bn).join(' · '));}
    case 'countries':return ndAnswer(q.id,s.countries.filter(c=>c.st==='approved').map(c=>c.n));
    case 'split':return ndAnswer(q.id,`Direct ${s.direct}% · agents ${100-s.direct}%`+(s.soldQ.q&&s.soldQ.y?` · sold out by ${s.soldQ.q} ${s.soldQ.y}`:''));
    case 'naming':return ndAnswer(q.id,s.nameSel);
    case 'imports':return ndAnswer(q.id,s.rev.avail?'Reviewed':'Read · not reviewed');
  }
  return ndAnswer(q.id,{intro:'Started',note:'Noted',saved:'Done',review:'Reviewed'}[q.type]||'Done');
}
function ndImportDrawer(k){
  const s=ndS,r=ndD().IMPORTS.find(x=>x.k===k);
  if(k==='avail'&&!s.rev.avail){
    const F=[['A-102','Price missing','Left blank · add it on the unit'],['B-101','Two rows for the same unit','Merged into one'],['C-301','Status “Res.”','Read as Reserved'],['C-401','Size 0 m²','Taken from the floor plan: 112 m²']];
    qaDrawerOpen('Review units · availability list',`<p class="nd-mu">42 units read from ${xesc(s.files.avail)}. 4 rows need you; the rest match the columns we expected. Units are saved as off-market drafts until you activate.</p>
      <div class="nd-drows">${F.map(f=>`<div class="nd-row nd-between"><span class="nd-col"><b>${f[0]}</b><span class="nd-mu">${f[1]}</span></span><span>${f[2]}</span></div>`).join('')}</div>`,
      `<button type="button" class="btn-ghost" onclick="qaDrawerClose()">Later</button><button type="button" class="btn-primary" data-nd="impok:avail">Confirm 42 units</button>`);return;
  }
  if(k==='plans'&&!s.rev.plans){
    const P=[['MR-TypeC-PH.pdf','C-401'],['Block-B-ground-2.pdf','B-102'],['Plan 17.pdf','A-201']];
    qaDrawerOpen('Place 3 floor plans',`<p class="nd-mu">21 of 24 plans matched to units by name. Pick the unit for the other three.</p><div class="nd-drows">${P.map(([f,u])=>`<label class="nd-row nd-between"><span class="nd-col"><b>${f}</b><span class="nd-mu">Suggested: ${u}</span></span><select class="nd-input sm" aria-label="Unit for ${f}">${ndD().CAPUNITS.map(x=>`<option${x===u?' selected':''}>${x}</option>`).join('')}</select></label>`).join('')}</div>`,
      `<button type="button" class="btn-ghost" onclick="qaDrawerClose()">Later</button><button type="button" class="btn-primary" data-nd="impok:plans">Save matches</button>`);return;
  }
  showToast(k==='avail'?'42 units reviewed. They stay off market until you activate.':k==='plans'?'All 24 floor plans are matched to units.':`${r.n}: ${r.res}`);
}
function ndAction(k,el){
  const s=ndS,q=s.view==='setup'?ndCurQ():null,[a,b,c]=k.split(':');
  switch(a){
    case 'exit':return ndExit();
    case 'close':return ndExit('Draft saved. Continue setup from Developments.');
    case 'hub':s.view='hub';s.hubTab='overview';return ndRender(true);
    case 'hubtab':s.hubTab=b;return ndRender(true);
    case 'setup':s.view='setup';return ndRender(true);
    case 'resume':return ndResume();
    case 'step':s.sorting=false;return ndGoStep(b);
    case 'q':s.si=b;s.sorting=false;return ndRender(true);
    case 'back':if(s.view==='act'&&s.activated){s.view='hub';s.hubTab='overview';return ndRender(true);}return ndBack();
    case 'cont':return ndContinue();
    case 'nd':return ndAnswer(q.id,'Not decided yet');
    case 'skipstage':return ndSkipStage();
    case 'alt':return ndAnswer(q.id,q.alt.v);
    case 'usesug':return ndAnswer(q.id,q.sug.v);
    case 'sugoff':s.sugOff[q.id]=1;return ndRender();
    case 'card':return ndAnswer(q.id,q.opts[+b][0]);
    case 'mood':s.mood=+b;return ndRender();
    case 'moodx':s.mood=null;return ndRender();
    case 'moodnav':s.mood=(s.mood+(+b)+6)%6;return ndRender();
    case 'moodgo':s.mood=+b;return ndRender();
    case 'moodpick':{const v=ndD().Q.collateral.find(x=>x.id==='feel').opts[s.mood][0];s.mood=null;return ndAnswer('feel',v);}
    case 'chip':{const sel=ndChipSel(q),v=ndChipOpts(q)[+b],i=sel.indexOf(v);if(i>=0)sel.splice(i,1);else sel.push(v);return ndRender();}
    case 'ownopen':s.ownOpen[q.id]=1;ndRender();return document.querySelector('[data-nd-in="own"]')?.focus();
    case 'ownadd':{const v=(s.ownDraft||'').trim();if(!v)return;(s.own[q.id]=s.own[q.id]||[]).push(v);ndChipSel(q).push(v);s.ownDraft='';s.ownOpen[q.id]=0;return ndRender();}
    case 'help':s.helpOn[q.id]=1;return ndRender();
    case 'nohelp':s.helpOn[q.id]=0;return ndRender();
    case 'usehelp':s.helpOn[q.id]=0;return ndAnswer(q.id,q.help);
    case 'qp':{const p=b==='sold'?s.soldQ:(s.qp[b]=s.qp[b]||{});p[c]=k.split(':')[3];return ndRender();}
    case 'blk':s.blockN=+b;return ndRender();
    case 'blklater':return ndAnswer(q.id,s.blockN+' blocks · names to come');
    case 'up':s.files[b]=ndSlotSample(b);ndFlash();return ndRender();
    case 'rm':delete s.files[b];ndFlash();return ndRender();
    case 'finadd':s.finishes.push(['','']);return ndRender();
    case 'finrm':s.finishes.splice(+b,1);if(!s.finishes.length)s.finishes.push(['','']);return ndRender();
    case 'pick':{const other=c==='primary'?'secondary':'primary',L=s.picks[c],i=L.indexOf(b);if(i>=0)L.splice(i,1);else{L.push(b);s.picks[other]=s.picks[other].filter(x=>x!==b);}return ndRender();}
    case 'cty':if(b==='ok')s.countries[+c].st='approved';else s.countries.splice(+c,1);return ndRender();
    case 'ctyall':s.countries.forEach(x=>x.st='approved');return ndRender();
    case 'ctyadd':{const v=s.ctyQ.trim();if(!v)return;if(!s.countries.some(x=>x.n.toLowerCase()===v.toLowerCase()))s.countries.push({n:v,why:'Added by you',pct:0,st:'approved'});s.ctyQ='';return ndRender();}
    case 'addrpick':s.addr='Triq il-Qammieħ, Mellieħa';s.addrState='found';return ndRender();
    case 'addrgo':s.addrState=/qamm/i.test(s.addr)?'found':s.addr.trim()?'nf':null;if(s.addrState==='found')s.addr='Triq il-Qammieħ, Mellieħa';return ndRender();
    case 'pin':return ndAnswer('loc',s.addrState==='nf'?`${s.addr.trim()} · pin placed by hand`:ndD().Q.project.find(x=>x.id==='loc').fmt);
    case 'ntab':s.nameTab=b;return ndRender();
    case 'nsel':{const ang=ndD().NAMES.find(x=>x.k===s.nameTab),L=[...ang.names,...(s.more[ang.k]?ND_MORE[ang.k]:[])];s.nameSel=L[+b].n;s.nameFrom=s.nameTab;ndFlash();return ndRender();}
    case 'nmore':s.more[s.nameTab]=1;return ndRender();
    case 'nown':s.ownName=s.ownName??'';ndRender();return document.querySelector('[data-nd-in="ownname"]')?.focus();
    case 'ownname':{const v=(s.ownName||'').trim();if(!v)return;s.nameSel=v;s.nameFrom='own';s.ownName=null;ndFlash();return ndRender();}
    case 'imp':return ndImportDrawer(b);
    case 'impok':s.rev[b]=true;ndLog(b==='avail'?'Availability reviewed':'Floor plans reviewed');qaDrawerClose();showToast(b==='avail'?'42 units confirmed as off-market drafts':'Floor plans matched to units');ndFlash();return ndRender();
    case 'brief':s.view='brief';return ndRender(true);
    case 'sendbrief':s.modal='request';return ndRender();
    case 'export':s.exported=true;ndLog('Marketing brief exported');ndFlash();showToast('Brief exported as a PDF for your agency');return ndRender();
    case 'act':if(s.view==='hub'){s.hubTab='activation';return ndRender(true);}s.view='act';return ndRender(true);
    case 'activate':if(!ndCanActivate()){showToast('Review the availability list, confirm the location, and choose a valid unit cap before activating.');return;}s.modal='activate';return ndRender();
    case 'modal-x':s.modal=null;return ndRender();
    case 'modal-ok':
      if(s.modal==='request'){s.requested=true;s.modal=null;ndLog('Marketing brief sent to Bricly');showToast('Brief sent. We’ll notify you when Bricly replies with scope and price.');}
      else if(s.modal==='activate'&&ndCanActivate()){s.modal=null;s.activated=true;s.done.imports=1;ndLog(`${s.releaseCap} units activated`);}
      else{s.modal=null;showToast('The development is not ready to activate. Review the activation requirements.');}
      ndFlash();return ndRender();
    case 'livehub':s.view='hub';s.hubTab='overview';return ndRender(true);
    case 'finish':s.ans.complete='Done';s.done.imports=1;s.view='hub';s.hubTab='overview';return ndRender(true);
  }
}
document.addEventListener('click',e=>{const el=e.target.closest('[data-nd]');if(!el||!ndS||el.disabled)return;if(el.classList.contains('nd-modal-bg')&&e.target!==el)return;ndAction(el.dataset.nd,el);});
document.addEventListener('keydown',e=>{
  if(!ndS)return;
  if(e.key==='Escape'&&(ndS.mood!=null||ndS.modal)&&ndOn()){ndS.mood=null;ndS.modal=null;ndRender();return;}
  const el=e.target.closest&&e.target.closest('[data-nd],[data-nd-in]');if(!el||e.key!=='Enter')return;
  if(el.matches('[role=button][data-nd]')&&e.target===el){e.preventDefault();ndAction(el.dataset.nd,el);return;}
  const k=el.dataset.ndIn||'';const map={addr:'addrgo',own:'ownadd',ctyq:'ctyadd',ownname:'ownname'};
  if(k.startsWith('text:')){e.preventDefault();ndContinue();}else if(map[k]){e.preventDefault();ndAction(map[k],el);}
});
document.addEventListener('input',e=>{
  const el=e.target.closest&&e.target.closest('#nd-root [data-nd-in]');if(!el||!ndS)return;
  const s=ndS,v=el.value,[a,b,c]=el.dataset.ndIn.split(':');
  switch(a){
    case 'text':s.text[b]=v;{const q=ndCurQ(),btn=document.querySelector('#nd-root [data-nd="cont"]');if(btn&&q)btn.disabled=!ndCanCont(q);}break;
    case 'addr':s.addr=v;break;
    case 'own':s.ownDraft=v;break;
    case 'block':s.blocks[+b]=v;break;
    case 'form':(s.form[b]=s.form[b]||[])[+c]=v;break;
    case 'ldate':s.ldate=v;break;
    case 'file':if(v.trim())s.files[b]=v.trim();else delete s.files[b];break;
    case 'terms':s.terms[b]=v;{const t=document.getElementById('nd-ttot');if(t)t.textContent='Total '+ndTermsTotal()+'%';}break;
    case 'fin':s.finishes[+b][+c]=v;break;
    case 'ctyq':s.ctyQ=v;break;
    case 'ownname':s.ownName=v;break;
    case 'cap':s.releaseCap=v.trim()?Math.max(1,Math.min(42,Math.round(Number(v)||1))):0;{const btn=document.querySelector('#nd-root [data-nd="activate"]');if(btn)btn.disabled=!ndCanActivate();}break;
    case 'direct':case 'directr':{const d=Math.max(0,Math.min(100,Math.round(Number(v)||0)));s.direct=d;
      const set=(id,p,x)=>{const n=document.getElementById(id);if(n&&n!==el)n[p]=x;};set('nd-dir','value',d);set('nd-dirr','value',d);set('nd-agt','value',100-d);
      const bar=document.getElementById('nd-sbar');if(bar)bar.style.width=d+'%';set('nd-dl','textContent','Direct '+d+'%');set('nd-al','textContent','Agents '+(100-d)+'%');break;}
    case 'bed':{const t=ndBrief()[+b][0];s.briefEdit[t]=v;const p=document.getElementById('nd-bp-'+b);if(p)p.textContent=v;break;}
  }
  ndQueuePersist();
});
document.addEventListener('change',e=>{
  const el=e.target.closest&&e.target.closest('#nd-root [data-nd-in]');
  if(!el||!ndS)return;
  if(el.dataset.ndIn==='ldate'){ndS.ldate=el.value;ndRender();}
  if(el.dataset.ndIn==='cap'){ndFlash();ndRender();}
});

// Draft card on the Developments list
function ndCardHtml(){
  const s=ndS,steps=ndSteps(),done=steps.filter(([k])=>s.done[k]).length,act=s.activated,t=s.savedAt;
  const imp=s.proc==='running'?`Reading ${ndFileCount()} files`:s.proc==='done'?(s.rev.avail?'Reviewed':'Ready to review'):ndFileCount()?'Saved':'No files yet';
  const time=t.toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),name=ndTitle()==='New development'?'New development · unnamed':ndTitle();
  return `<div class="dv-card nd-dcard" role="button" tabindex="0" data-nd="resume" aria-label="${act?'Open':'Continue setup for'} ${xesc(name)}">
    <div class="ph nd-dph"><span class="dv-card-status ${act?'selling':'nd-draft'}">${act?'Active':'Draft'}</span><span>Images added during setup</span></div>
    <div class="bd"><div class="dv-card-name">${xesc(name)}</div><div class="dv-card-meta"><span>${s.ans.loc?'Mellieħa':'Location to confirm'}</span><span>${act?'Active · just now':'Draft · private'}</span></div>
      <dl class="dv-card-facts"><div><dt>Setup</dt><dd>${done} of ${steps.length} steps</dd></div><div><dt>Last saved</dt><dd>${time}</dd></div><div><dt>Imports</dt><dd>${imp}</dd></div></dl>
      <div class="nd-row nd-between nd-dfoot"><span class="nd-bar"><i style="width:${Math.round(done/steps.length*100)}%"></i></span><span class="nd-green">${act?'Open ›':'Continue setup ›'}</span></div></div></div>`;
}
function ndListRowHtml(){
  const s=ndS,steps=ndSteps(),done=steps.filter(([k])=>s.done[k]).length,act=s.activated,t=s.savedAt;
  const name=ndTitle()==='New development'?'New development · unnamed':ndTitle();
  const time=t.toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const imp=s.proc==='running'?`Reading ${ndFileCount()} files`:s.proc==='done'?(s.rev.avail?'Reviewed':'Ready to review'):ndFileCount()?'Saved':'No files yet';
  return `<div class="dv-list-row nd-dlist" role="button" tabindex="0" data-nd="resume" aria-label="${act?'Open':'Continue setup for'} ${xesc(name)}" style="grid-template-columns:1.6fr 1fr 1fr 1fr 1.4fr">
    <div><div class="nm">${xesc(name)}</div><div class="sub">${act?'Active':'Draft · private'}</div></div><div class="sub">${s.ans.loc?'Mellieħa':'Location to confirm'}</div><div class="sub">${act?'Active':`${done} of ${steps.length} steps`}</div><div class="sub">${imp}</div><div class="sub">Last saved ${time}</div></div>`;
}
function ndListCard(){
  if(!ndS||typeof dvListState==='undefined'||(typeof awCan==='function'&&!awCan('development')))return;
  const g=document.getElementById('dv-grid');if(!g)return;
  if(dvListState.view==='list'){
    if(g.querySelector('.nd-dlist'))return;
    const parent=g.querySelector('.dv-list-row')?.parentElement||g;
    parent.insertAdjacentHTML('afterbegin',ndListRowHtml());
    return;
  }
  if(!g.querySelector('.nd-dcard'))g.insertAdjacentHTML('afterbegin',ndCardHtml());
}
if(typeof dvRenderGrid==='function'){const ndGrid0=dvRenderGrid;dvRenderGrid=function(){const r=ndGrid0.apply(this,arguments);ndListCard();return r;};}
ndRestore();
ndListCard();
