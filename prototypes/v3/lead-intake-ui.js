// Lead intake · controller: renders the development's Lead capture tab, modals, and wires every interaction.
function liViewHtml(){
  const d=liDev();
  if(LI.ui.dev!==d.id)Object.assign(LI.ui,{dev:d.id,view:'home',formId:null,editQ:null,lib:false,modal:null});
  const v=LI.ui.view;
  return v==='form'?liFormHtml():v==='log'?liLogHtml():v==='links'?liLinksHtml():v==='meta'?liAdHtml('meta'):v==='google'?liAdHtml('google'):liHomeHtml();
}
function lcTabHtml(){return `<div id="li-host" class="li-root">${liViewHtml()}</div>`;}
function liRender(){const h=document.getElementById('li-host');if(h)h.innerHTML=liViewHtml();}
function liLive(){
  const f=liCurForm(), pv=document.getElementById('li-pv'), pb=document.getElementById('li-pubbar'), sc=document.getElementById('li-stchip');
  if(pv)pv.innerHTML=liPreviewHtml(f,LI.ui.tab==='after'?3:LI.ui.pvStep);
  if(pb)pb.innerHTML=liPubBar(f);
  if(sc)sc.innerHTML=liChip(liDirty(f)?'Unpublished changes':'Live',liDirty(f)?'warn':'ok');
}

function liModalRoot(){let r=document.getElementById('li-modal-root');if(!r){r=document.createElement('div');r.id='li-modal-root';(document.getElementById('appShell')||document.body).appendChild(r);}return r;}
function liModalShell(title,sub,body,foot,cls=''){
  return `<div class="li-scrim" data-li="close"></div><div class="li-modal ${cls}" role="dialog" aria-modal="true" aria-label="${liEsc(String(title).replace(/<[^>]+>/g,''))}" tabindex="-1">
    <div class="li-mh"><div class="li-col"><b>${title}</b>${sub?`<span class="li-mu">${sub}</span>`:''}</div><button type="button" class="li-x" data-li="close" aria-label="Close">×</button></div>
    <div class="li-mb">${body}</div>${foot?`<div class="li-mf">${foot}</div>`:''}</div>`;
}
function liModalRender(){
  const m=LI.ui.modal, root=liModalRoot();
  if(!m){root.innerHTML='';return;}
  const prev=root.querySelector('.li-mb,.li-bf'), top=prev?prev.scrollTop:0, fresh=!root.firstChild||root.dataset.kind!==m.kind;
  const ae=document.activeElement, keep=ae&&root.contains(ae)&&ae.matches('input,textarea')?{sel:ae.dataset.liM?`[data-li-m="${ae.dataset.liM}"]`:null,pos:ae.selectionStart}:null;
  root.dataset.kind=m.kind;
  root.innerHTML=m.kind==='share'?liShareHtml():m.kind==='buyer'?liBuyerHtml():m.kind==='log'?liLogModal(m.id):m.kind==='connect'?liConnectHtml():m.kind==='assign'?liAssignHtml():m.kind==='create'?liCreateHtml():m.kind==='manage'?liManageHtml():'';
  const body=root.querySelector('.li-mb,.li-bf');if(body&&!fresh)body.scrollTop=top;
  if(fresh){const dlg=root.querySelector('.li-modal');if(dlg)dlg.focus();}
  else if(keep&&keep.sel){const el=root.querySelector(keep.sel);if(el){el.focus();try{el.setSelectionRange(keep.pos,keep.pos);}catch(e){}}}
}
function liModalClose(){LI.ui.modal=null;liModalRender();}
function liCopy(t){
  const done=()=>showToast('Copied');
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(done,()=>liCopyFallback(t,done));else liCopyFallback(t,done);
}
function liCopyFallback(t,done){const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');}catch(e){}a.remove();done();}
function liSetPath(obj,path,val){const k=path.split('.');let o=obj;for(let i=0;i<k.length-1;i++)o=o[k[i]];o[k[k.length-1]]=val;}
function liGetPath(obj,path){return path.split('.').reduce((o,k)=>o&&o[k],obj);}
function liConnectFromSettings(pf){liConnectOpen(pf);if(liAcct(pf).connected)LI.ui.modal={kind:'manage',pf};liModalRender();}

const LI_ACT={
  view:a=>{LI.ui.view=a;liRender();document.getElementById('content')?.scrollTo?.(0,0);},
  form:a=>{Object.assign(LI.ui,{view:'form',formId:a,tab:'questions',editQ:null,lib:false,pvStep:1});liRender();},
  share:a=>{const [id,tab]=a.split('|');liShareOpen(id,tab);liModalRender();},
  buyer:a=>{const [id,mode,lid]=a.split('|');liBuyerOpen(id,mode,lid);liModalRender();},
  toast:a=>showToast(a),copy:a=>liCopy(a),close:()=>liModalClose(),
  opp:a=>{liModalClose();if(typeof openOpp==='function')openOpp(a);},
  logrow:a=>{LI.ui.modal={kind:'log',id:a};liModalRender();},
  logf:a=>{LI.ui.logF=a;liRender();},
  'open-log':a=>{const [dev,id]=a.split('|');if(typeof openDev==='function'){openDev(dev);dvSetTab('leadcapture');}LI.ui.view='log';liRender();LI.ui.modal={kind:'log',id};liModalRender();},
  'held-discard':a=>{const st=liState();st.log=st.log.filter(e=>e.id!==a);liModalClose();liRender();showToast('Discarded');},
  // form editor
  ftab:a=>{LI.ui.tab=a;liRender();},pvstep:a=>{LI.ui.pvStep=+a;liLive();document.querySelectorAll('[data-li="pvstep"]').forEach(b=>b.classList.toggle('on',b.dataset.arg===a));},
  twostep:a=>{liCurForm().twoStep=a==='true';LI.ui.pvStep=1;liRender();},
  'q-edit':a=>{LI.ui.editQ=LI.ui.editQ===a?null:a;liRender();},
  'q-req':a=>{const q=liCurForm().qs.find(x=>x.id===a);q.req=!q.req;liRender();},
  'q-up':a=>liMoveQ(a,-1),'q-down':a=>liMoveQ(a,1),
  'q-del':a=>{const f=liCurForm(),q=f.qs.find(x=>x.id===a);f.qs=f.qs.filter(x=>x.id!==a);liRender();showToast(`Removed “${q.label}”. Discard to undo.`);},
  lib:()=>{LI.ui.lib=!LI.ui.lib;liRender();},
  'q-add':a=>{const f=liCurForm(),q=liQ(liDev(),a,{req:false});f.qs.push(q);LI.ui.editQ=q.id;LI.ui.pvStep=2;liRender();},
  'q-custom':()=>{const f=liCurForm(),q={key:'custom_'+liId(''),id:liId('q'),label:'New question',type:'choice',opts:['Option 1','Option 2'],maps:'Custom answer',req:false,help:''};f.qs.push(q);LI.ui.editQ=q.id;LI.ui.pvStep=2;liRender();setTimeout(()=>document.querySelector(`[data-li-q="label"][data-qid="${q.id}"]`)?.select(),0);},
  'q-refresh':a=>{const f=liCurForm(),q=f.qs.find(x=>x.id===a),L=liLibrary(liDev()).find(x=>x.key===q.key);if(L){q.opts=[...L.opts];liRender();showToast('Options refreshed from units and prices');}},
  'opt-add':a=>{const q=liCurForm().qs.find(x=>x.id===a);q.opts.push('New option');liRender();},
  'opt-del':a=>{const [id,k]=a.split('|'),q=liCurForm().qs.find(x=>x.id===id);q.opts.splice(+k,1);liRender();},
  accent:a=>{liCurForm().design.accent=a;liRender();},
  tog:a=>{const f=liCurForm();liSetPath(f,a,!liGetPath(f,a));liRender();},
  'after-mode':a=>{liCurForm().after.mode=a;liRender();},
  publish:a=>{const f=liForm(a);liPublish(f);liRender();showToast(`${f.name} published. Hosted page and every embed updated.`);},
  discard:a=>{liDiscard(liForm(a));LI.ui.editQ=null;liRender();showToast('Changes discarded');},
  // buyer form
  'b-opt':a=>{const i=a.indexOf('|'),qid=a.slice(0,i),o=a.slice(i+1),m=LI.ui.modal,q=liForm(m.formId).qs.find(x=>x.id===qid);
    if(q.type==='multi'){const v=m.vals[qid]||[];m.vals[qid]=v.includes(o)?v.filter(x=>x!==o):[...v,o];}else m.vals[qid]=o;liModalRender();},
  'b-fill':()=>{const m=LI.ui.modal,s=liSample(LI.seq+Object.keys(LI.devs).length);Object.assign(m.vals,s,{privacy:true});m.err='';liModalRender();},
  'b-next':()=>liBuyerNext(),
  // share
  stab:a=>{const [t,l]=a.split('|');LI.ui.modal.tab=t;if(l)LI.ui.modal.qr=l;liModalRender();},
  'link-make':()=>{liMakeLink();liModalRender();liRender();},
  'site-style':a=>{liState().site.style=a;liModalRender();},'site-plat':a=>{liState().site.platform=a;liModalRender();},
  'site-email':()=>{const s=liState().site;if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.devEmail)){showToast('Add your web developer’s email first');return;}showToast(`Sent to ${s.devEmail}: the code, ${LI_PLATFORMS[s.platform][0]} steps and a check link`);},
  'site-check':()=>liCheckSite(),
  'site-rm':a=>{liState().site.domains.splice(+a,1);liModalRender();liRender();},
  'qr-dl':a=>{const b=new Blob([liQrSvg(a)],{type:'image/svg+xml'}),u=URL.createObjectURL(b),x=document.createElement('a');x.href=u;x.download=`${liState().slug}-qr.svg`;x.click();setTimeout(()=>URL.revokeObjectURL(u),500);showToast('QR code downloaded');},
  // integrations
  connect:a=>{liConnectOpen(a);liModalRender();},
  'cn-next':a=>liConnectStep(a),
  'cn-set':a=>{const [k,v]=a.split('|');LI.ui.modal[k]=v;liModalRender();},
  'cn-recheck':a=>{const m=LI.ui.modal;m.checks[a]='checking';liModalRender();setTimeout(()=>{if(LI.ui.modal===m){m.checks[a]=true;liModalRender();}},900);},
  'cn-skip':()=>{const m=LI.ui.modal;Object.keys(m.checks).forEach(k=>{if(m.checks[k]!==true)m.pages[k]=false;});liModalRender();},
  'cn-done':()=>liConnectDone(),
  'cn-finish':a=>{liModalClose();if(document.getElementById('li-host')){LI.ui.view=a;liRender();}},
  'ad-assign':a=>{const [pf,id,step]=a.split('|');liAssignOpen(pf,id,step);liModalRender();},
  'ad-pause':a=>{const [pf,id]=a.split('|'),f=liCatalog(pf).find(x=>x.id===id);f.status=f.status==='paused'?'live':'paused';liRender();showToast(f.status==='paused'?`${f.name} paused. Its leads are held in the log until you resume.`:`${f.name} resumed`);},
  'ad-unassign':a=>{const [pf,id]=a.split('|'),f=liCatalog(pf).find(x=>x.id===id);f.devId=null;f.status='unassigned';liRender();showToast(`${f.name} unassigned. Existing leads stay where they are.`);},
  'ad-manage':a=>{LI.ui.modal={kind:'manage',pf:a};liModalRender();},
  'ad-create':a=>{liCreateOpen(a);liModalRender();},
  'ad-disconnect':a=>{const A=liAcct(a);A.connected=false;liCatalog(a).forEach(f=>{if(f.devId)f.status='paused';});liModalClose();liRender();showToast(`${LI_PF[a].short} disconnected. Reconnecting restores every form assignment.`);},
  'as-step':a=>{LI.ui.modal.step=a;liModalRender();},
  'as-save':()=>{const m=LI.ui.modal,f=liCatalog(m.pf).find(x=>x.id===m.id);if(!f.devId){f.devId=liDev().id;}f.status='mapping';liModalClose();liRender();showToast('Saved. The form shows “Needs mapping” until it goes live.');},
  'as-listen':()=>liAssignListen(),'as-live':()=>liAssignLive(),
  'cr-type':a=>{LI.ui.modal.type=a;liModalRender();},'cr-go':()=>liCreateGo(),
};
function liMoveQ(id,dir){const f=liCurForm(),i=f.qs.findIndex(q=>q.id===id),j=i+dir;if(j<0||j>=f.qs.length)return;[f.qs[i],f.qs[j]]=[f.qs[j],f.qs[i]];liRender();}
function liInScope(el){return el.closest('#li-host,#li-modal-root');}

document.addEventListener('click',e=>{
  const t=e.target.closest('[data-li]');if(!t||!liInScope(t)||t.disabled)return;
  const fn=LI_ACT[t.dataset.li];if(!fn)return;
  e.preventDefault();fn(t.dataset.arg||'');
});
function liOnField(e){
  const el=e.target;if(!liInScope(el))return;
  const ev=e.type, val=el.type==='checkbox'?el.checked:el.value, ds=el.dataset;
  if(ds.liQ){const q=liCurForm().qs.find(x=>x.id===ds.qid);q[ds.liQ]=val;
    if(ds.liQ==='type'&&/choice|multi/.test(val)&&!q.opts.length)q.opts=['Option 1','Option 2'];
    if(ev==='change'&&el.tagName==='SELECT')liRender();else{liLive();if(ds.liQ==='label'){const b=el.closest('.li-q')?.querySelector('.li-q-main b');if(b)b.textContent=val;}}return;}
  if(ds.liOpt!==undefined){const q=liCurForm().qs.find(x=>x.id===ds.qid);q.opts[+ds.liOpt]=val;liLive();return;}
  if(ds.liIn){liSetPath(liCurForm(),ds.liIn,val);liLive();return;}
  const m=LI.ui.modal;if(!m)return;
  if(ds.liB){m.vals[ds.liB]=val;if(m.err&&ev==='change'){m.err='';}return;}
  if(ds.liM){liSetPath(m,ds.liM,val);if(el.tagName==='SELECT')liModalRender();return;}
  if(ds.liSite){liState().site[ds.liSite]=val;if(ev==='change'&&ds.liSite==='btn')liModalRender();return;}
  if(ds.liCn){m.pages[ds.liCn]=val;return;}
  if(ds.liAs){m[ds.liAs]=val;return;}
  if(ds.liCq){m.qsel[ds.liCq]=val;return;}
  if(ds.liMap!==undefined&&ev==='change'){const f=liCatalog(m.pf).find(x=>x.id===m.id);f.map[f.qs[+ds.liMap].label]=val;liModalRender();}
}
document.addEventListener('input',liOnField);
document.addEventListener('change',e=>{if(e.target.matches('select,input[type=checkbox]')||e.target.dataset.liSite)liOnField(e);});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&LI.ui.modal){liModalClose();return;}
  if(e.key==='Enter'&&e.target.matches('#li-modal-root input[data-li-b]')){e.preventDefault();liBuyerNext();}
});
// Drag to reorder questions.
document.addEventListener('dragstart',e=>{const q=e.target.closest?.('#li-host [data-li-drag]');if(!q)return;LI.ui.drag=q.dataset.liDrag;e.dataTransfer.effectAllowed='move';q.classList.add('dragging');});
document.addEventListener('dragover',e=>{const q=e.target.closest?.('#li-host [data-li-drag]');if(q&&LI.ui.drag){e.preventDefault();document.querySelectorAll('#li-host .li-q.over').forEach(x=>x.classList.remove('over'));q.classList.add('over');}});
document.addEventListener('drop',e=>{
  const q=e.target.closest?.('#li-host [data-li-drag]');if(!q||!LI.ui.drag)return;e.preventDefault();
  const f=liCurForm(),from=f.qs.findIndex(x=>x.id===LI.ui.drag),to=f.qs.findIndex(x=>x.id===q.dataset.liDrag);
  if(from>=0&&to>=0&&from!==to){const [m]=f.qs.splice(from,1);f.qs.splice(to,0,m);}
  LI.ui.drag=null;liRender();
});
document.addEventListener('dragend',()=>{LI.ui.drag=null;document.querySelectorAll('#li-host .li-q.dragging,#li-host .li-q.over').forEach(x=>x.classList.remove('dragging','over'));});

// Settings → Integrations: Meta and Google lead ads are real integrations now, not "Phase 2".
(function liPatchSettings(){
  const pages=window.BST&&window.BST.pages;if(!pages)return;
  const spec={'Meta Ads':['meta','Meta lead ads','Facebook & Instagram Instant Forms into each development','M'],'Google Ads':['google','Google Ads lead forms','Lead form assets into each development','GA']};
  Object.values(pages).forEach(p=>(p.b||[]).forEach(b=>{
    if(b.k!=='cards')return;
    b.items.forEach((it,i)=>{
      const s=spec[it.t];if(!s)return;const pf=s[0];
      b.items[i]={t:s[1],s:s[2],logo:s[3],go:'f:liConnectFromSettings:'+pf,
        get chip(){const A=LI.acct[pf];return A.connected?['Connected','ok']:['Not connected','neu'];},
        get meta(){const A=LI.acct[pf];if(!A.connected)return 'Connect once, then assign forms per development';const n=(A.forms||[]).filter(f=>f.devId).length;return `${n} form${n===1?'':'s'} assigned`;},
        get act(){return LI.acct[pf].connected?'Manage':'Connect';}};
    });
  }));
})();
