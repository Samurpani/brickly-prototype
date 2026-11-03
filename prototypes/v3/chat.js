// Conversational chat (Bricly Chat · Chat Conversation / Files Voice Offers WhatsApp / Setup boards).
// Design threads are added to the chat history and rendered from chat-data.js; buttons move between the design's
// scenarios. The Anna Spiteri hold runs through the real Approvals queue (REQ-1045).
const CHD_CHATS=[
  {id:'cd-mike',title:'Mike Gatt · Unit 4B purchase',start:'thread',hours:0.4},
  {id:'cd-anna',title:'Anna Spiteri · #CM9710 hold',start:'previewHold',hours:1.2},
  {id:'cd-brief',title:'Daily brief',start:'brief',hours:3},
];
// "Try asking" prompts for the Mike Gatt thread: each opens the design scenario that answers it.
const CHD_TRY=[
  ['answer','What’s 4B’s asking price, finish and completion date?'],
  ['preview','Log my viewing with Mike Gatt at 4B this morning'],
  ['multi','Log the viewing, hold 4B and remind me to call him'],
  ['clarify','Log my viewing with Mike (which Mike?)'],
  ['help','Drop the price on 4B to 650 for Mike'],
  ['upload','Add this receipt to Mike Gatt’s file'],
  ['sensitive','For Mike’s KYC (ID scan)'],
  ['contract','Signed contract for Mike'],
  ['transcript','Voice note: log the viewing'],
  ['unreliable','Voice note: hold 5B for …'],
  ['offerAmbig','Draft an offer for 4B at 665'],
  ['subject','Book a viewing for the Borg family on Saturday'],
  ['resume','Resume Thursday’s offer draft'],
  ['undoLate','Undo the hold on 4B'],
];
const CHD_ROUTES={
  thread:{Summary:'summary'},
  summary:{Summary:'thread'},
  resume:{'Review changes':'edit',Confirm:'receipt',Cancel:'thread',Edit:'edit','Save draft':'!Draft saved'},
  subject:{'*opt':'preview'},
  answer:{'*cite':'source'},
  source:{'Back to answer':'answer','Open file':'!Opening Verdala brochure v4, p.12'},
  sourceGone:{'Ask again':'source',Close:'answer'},
  sourceSensitive:{'Open secure viewer':'!The secure viewer opens outside chat'},
  clarify:{'*opt':'preview'},
  help:{'Request a price change for 4B':'@approvals','Draft offer terms for Mike':'offerAmbig'},
  preview:{Confirm:'receipt',Edit:'edit',Cancel:'thread'},
  edit:{'Review changes':'preview','Cancel edit':'preview'},
  multi:{Confirm:'receipt','Submit request':'receipt',Edit:'edit',Cancel:'thread'},
  receipt:{'Undo until 11:01':'undo','Open activity':'@opp','Submit request':'@approvals',Edit:'edit',Cancel:'thread'},
  unknown:{'Check status':'receipt'},
  undo:{'Confirm undo':'thread','Keep activity':'receipt','Undo until 11:01':'undo'},
  undoLate:{'Request hold release':'@approvals'},
  upload:{},
  understood:{'Review placement':'filing'},
  sensitive:{'Review placement':'filing'},
  filing:{'Confirm filing':'!Filed under Mike Gatt / OPP-118 / Deposit receipt','Edit placement':'understood',Cancel:'thread'},
  contract:{'Submit request':'!Association request sent to a manager',Edit:'!Editing',Cancel:'thread'},
  unclassified:{'Replace file':'upload','Request review':'!Sent for review'},
  transcript:{Confirm:'receipt',Edit:'edit',Cancel:'thread'},
  offerAmbig:{'€665,000':'offer','Another amount':'!Type the amount in full, for example €662,500'},
  offer:{'Request approval':'offerReq','Save draft':'!Draft saved · not sent',Cancel:'thread',Edit:'!Editing the draft'},
  offerReq:{'Review and send':'send','View request':'@approvals','Open draft':'offer'},
  send:{'Send to 2 recipients':'delivery',Cancel:'offerReq'},
  sendCap:{Send:'!Choose no more than 3 recipients',Cancel:'send'},
  delivery:{'Retry Anna only':'!Retrying Anna Gatt by email','View history':'audit'},
  previewHold:{'Submit request':'#annaSubmit',Edit:'!Editing the hold request',Cancel:'@landing'},
  pending:{'View in Approvals':'@approvals'},
  decision:{'Open unit':'@unit','View in Approvals':'@approvals','View audit':'audit'},
  rejected:{'Open unit':'@unit'},
  audit:{'Open unit':'@unit','View audit':'audit',Close:'#annaState'},
};
function chdChat(){return typeof activeChatId!=='undefined'&&activeChatId?chatById(activeChatId):null;}
function chdSeedChats(){
  if(typeof chatStore==='undefined') return;
  const n=Date.now();
  CHD_CHATS.slice().reverse().forEach(d=>{if(!chatById(d.id))chatStore.unshift({id:d.id,title:d.title,scope:'personal',sharedBy:'',updatedAt:n-d.hours*3600000,messages:[],design:true,scn:d.start});});
  chatSave();
}
function chdAnnaState(){
  const r=typeof APPROVALS!=='undefined'?APPROVALS.find(q=>q.id==='REQ-1045'):null, c=chatById('cd-anna');
  if(!r||!c||!c.submitted) return 'previewHold';
  return r.decided==='approved'?'decision':r.decided==='rejected'?'rejected':'pending';
}
function chdTone(k){return {ok:'ok',warn:'warn',err:'err',info:'info'}[k]||'mute';}
function chdChip(c){if(!c||!c.t)return '';const m=String(c.bg).match(/--(success|warning|error|info)/);const t=m?{success:'ok',warning:'warn',error:'err',info:'info'}[m[1]]:'mute';return `<span class="chd-chip t-${t}">${xesc(c.t)}</span>`;}
function chdBtn(b,cls){const t=typeof b==='string'?b:b.t, v=typeof b==='string'?'outline':b.v;return `<button type="button" class="${cls||(v==='primary'?'btn-primary':'btn-ghost')} chd-b" data-chd="${xesc(t)}" ${b.op&&b.op<1?'disabled':''}>${xesc(t)}</button>`;}
function chdItem(it){
  if(it.k==='d') return `<div class="chd-day">${xesc(it.text)}</div>`;
  if(it.k==='u') return `<div class="chd-u">${it.file?`<div class="chd-file"><span class="chd-ext">${xesc((it.file[0].split('.').pop()||'').toUpperCase())}</span><span class="chd-col"><b>${xesc(it.file[0])}</b><span class="chd-mu">${xesc(it.file[1])}</span></span>${chdChip(it.file[2])}</div>`:''}
    ${it.audio?`<div class="chd-audio"><div class="chd-row"><span class="chd-play">▶</span><span class="chd-wave"></span><span class="chd-mu">${xesc(it.audio.dur)}</span></div><div class="chd-mu">${xesc(it.audio.lang)}</div>${it.audio.trans?`<div class="chd-trans">${xesc(it.audio.trans)}</div>`:''}</div>`:''}
    ${it.text?`<div class="chd-bubble">${xesc(it.text)}</div>`:''}<span class="chd-mu">${xesc(it.meta||'')}</span></div>`;
  if(it.k==='a') return `<div class="chd-a">${it.loading?`<span class="chd-mu chd-loading">${xesc(it.text)}</span>`:it.text?`<div>${xesc(it.text)}</div>`:''}
    ${(it.points||[]).length?`<div class="chd-points">${it.points.map(p=>`<div class="${p.h?'h':''}"><span>${xesc(p.t)}</span>${p.c?`<span class="chd-tag">${xesc(p.c)}</span>`:''}</div>`).join('')}</div>`:''}
    ${(it.cites||[]).length?`<div class="chd-row wrap">${it.cites.map((c,j)=>`<button type="button" class="chd-cite" data-chd="*cite" title="Open the source">${j+1} <span>${xesc(c)}</span></button>`).join('')}</div>`:''}
    ${it.unans?`<div class="chd-unans">${xesc(it.unans)}</div>`:''}
    ${(it.opts||[]).length?`<div class="chd-opts">${it.opts.map((o,j)=>`<button type="button" class="chd-opt" data-chd="${xesc(o[0])}" data-chd-opt><span class="chd-mu">${j+1}</span><span class="chd-col"><span>${xesc(o[0])}</span>${o[1]?`<span class="chd-mu">${xesc(o[1])}</span>`:''}</span></button>`).join('')}</div>`:''}
    ${(it.links||[]).length?`<div class="chd-row wrap">${it.links.map(l=>chdBtn(l)).join('')}</div>`:''}
    ${it.foot?`<span class="chd-mu">${xesc(it.foot)}</span>`:''}</div>`;
  if(it.k==='c') return `<div class="chd-card ${it.dim?'dim':''}"><div class="chd-ch"><span class="chd-ref">${xesc(it.ref)}</span><span class="chd-verb">${xesc(it.verb)}</span><b>${xesc(it.title)}</b>${chdChip(it.status)}</div>
    ${it.warn?`<div class="chd-warn">${xesc(it.warn)}</div>`:''}
    <div class="chd-fields">${(it.fields||[]).map(f=>`<div><span class="chd-mu">${xesc(f.k)}</span><span class="${f.miss?'miss':''}">${f.b?`<s class="chd-mu">${xesc(f.b)}</s> → `:''}${xesc(f.v)}</span></div>`).join('')}</div>
    ${it.effect?`<div class="chd-effect">${xesc(it.effect)}</div>`:''}
    <div class="chd-cf"><span class="chd-mu">${xesc(it.meta||'')}</span><span class="chd-row">${(it.btns||[]).map(b=>chdBtn(b)).join('')}</span></div></div>`;
  if(it.k==='r') return `<div class="chd-rcpt"><div class="chd-row"><span class="chd-dot t-${chdTone(it.tone)}"></span><b>${xesc(it.title)}</b><span class="chd-mu">${xesc(it.meta||'')}</span></div>
    ${it.text?`<div class="chd-mu chd-ind">${xesc(it.text)}</div>`:''}
    ${(it.points||[]).length?`<div class="chd-ind">${it.points.map(p=>`<div class="chd-row sp"><span>${xesc(p.t)}</span><span class="chd-mu">${xesc(p.c||'')}</span></div>`).join('')}</div>`:''}
    ${(it.links||[]).length?`<div class="chd-row wrap chd-ind">${it.links.map(l=>`<button type="button" class="chd-link" data-chd="${xesc(typeof l==='string'?l:l.t)}">${xesc(typeof l==='string'?l:l.t)}</button>`).join('')}</div>`:''}</div>`;
  if(it.k==='n') return `<div class="chd-note t-${chdTone(it.tone)}"><span>${xesc(it.text)}</span>${it.cta?`<button type="button" class="chd-link" data-chd="${xesc(it.cta)}">${xesc(it.cta)}</button>`:''}</div>`;
  return '';
}
function chdDrawer(d){
  if(!d) return '';
  return `<aside class="chd-drawer" aria-label="${xesc(d.title)}"><div class="chd-dh"><div class="chd-col"><b>${xesc(d.title)}</b>${d.sub?`<span class="chd-mu">${xesc(d.sub)}</span>`:''}</div>${chdChip(d.tag)}<button type="button" class="chd-x" aria-label="Close" data-chd="×">×</button></div>
    ${d.sections.map(s=>`<div class="chd-ds">${s.h?`<div class="chd-dsh">${xesc(s.h)}</div>`:''}${s.alert?chdChip(s.alert):''}
      ${(s.rows||[]).map(r=>`<div class="chd-kv"><span class="chd-mu">${xesc(r[0])}</span><span>${xesc(r[1])}</span></div>`).join('')}
      ${(s.items||[]).map(r=>`<div class="chd-di"><span class="chd-dot t-${chdTone(r[2])}"></span><span class="chd-col"><span>${xesc(r[0])}</span>${r[1]?`<span class="chd-mu">${xesc(r[1])}</span>`:''}</span></div>`).join('')}
      ${s.para?`<p>${xesc(s.para)}</p>`:''}${s.quote?`<blockquote>${xesc(s.quote)}</blockquote>`:''}
      ${(s.form||[]).map(f=>`<label class="chd-f"><span>${xesc(f.l)}</span><span class="chd-in ${f.err?'err':''} ${f.locked?'lock':''}">${xesc(f.v)}${f.tail?` <span class="chd-mu">${xesc(f.tail)}</span>`:''}</span>${f.note?`<span class="chd-mu">${xesc(f.note)}</span>`:''}</label>`).join('')}</div>`).join('')}
    ${d.foot?`<div class="chd-mu chd-dfoot">${xesc(d.foot)}</div>`:''}
    ${(d.btns||[]).length?`<div class="chd-dbtns">${d.btns.map(b=>chdBtn(b)).join('')}</div>`:''}</aside>`;
}
function chdRender(chat){
  const body=document.getElementById('ctBody'); if(!body) return;
  if(chat.id==='cd-anna'&&chat.scn!=='audit') chat.scn=chdAnnaState();
  const sc=window.CHD.SC[chat.scn]||window.CHD.SC.thread, head={...window.CHD.MIKE,...(sc.head||{})};
  const drawer=chat.hideDrawer?null:sc.drawer;
  const tries=chat.id==='cd-mike'?CHD_TRY.filter(([k])=>k!==chat.scn):[];
  body.innerHTML=`<div class="chd ${drawer?'with-drawer':''}"><div class="chd-main">
    <div class="chd-head"><div class="chd-col"><div class="chd-row wrap">${head.recs.map(r=>`<span class="chd-rec">${xesc(r)}</span>`).join('')}</div></div><span class="chd-mu">${xesc(head.ch||'')}</span>${head.showSummary?`<button type="button" class="btn-ghost chd-b" data-chd="Summary">Summary</button>`:''}</div>
    <div class="chd-items">${(sc.items||[]).map(chdItem).join('')}</div>
    ${tries.length?`<div class="chd-try"><span class="chd-mu">Try asking</span><div class="chd-row wrap">${tries.map(([k,t])=>`<button type="button" class="chd-trybtn" data-chd-go="${k}">${xesc(t)}</button>`).join('')}</div></div>`:''}
  </div>${chdDrawer(drawer)}</div>`;
  const t=document.getElementById('ctTitle'); if(t) t.textContent=chat.title;
}
function chdGo(scn){const c=chdChat();if(!c)return;c.scn=scn;c.hideDrawer=false;c.updatedAt=Date.now();chatSave();chdRender(c);document.getElementById('ctBody').scrollTop=0;}
// In-progress frames move on by themselves, as the real flow would once the file is read.
const CHD_AUTO={upload:'understood',recording:'transcript'};
const chdGoBase=chdGo;
chdGo=function(scn){chdGoBase(scn);const next=CHD_AUTO[scn];if(next)setTimeout(()=>{const c=chdChat();if(c&&c.scn===scn)chdGoBase(next);},1400);};
function chdAction(label,isOpt){
  const c=chdChat(); if(!c) return;
  if(label==='×'){c.hideDrawer=true;chdRender(c);return;}
  const r=CHD_ROUTES[c.scn]||{}, target=r[label]||(isOpt?r['*opt']:null)||(label==='*cite'?r['*cite']:null);
  if(!target){showToast(label);return;}
  if(target[0]==='!'){showToast(target.slice(1));return;}
  if(target==='@approvals'){go('approvals');return;}
  if(target==='@unit'){openUnit(c.id==='cd-anna'?'#CM9710':'#CM9822');return;}
  if(target==='@opp'){showToast('Mike Gatt’s opportunity isn’t in this demo’s data');return;}
  if(target==='@landing'){chatGoLanding();return;}
  if(target==='#annaSubmit'){c.submitted=true;chatSave();if(typeof apBadge==='function')apBadge();chdGo('pending');showToast('Hold request REQ-1045 filed · 1st in line on #CM9710');return;}
  if(target==='#annaState'){c.scn=chdAnnaState();chdRender(c);return;}
  chdGo(target);
}
// Hook the prototype chat: design chats render their scenario; typing matches a "Try asking" prompt.
const chdRenderThreadBase=renderThread;
renderThread=function(id,thinking){const c=chatById(id);if(c&&c.design){chdRender(c);return;}chdRenderThreadBase(id,thinking);};
const chdChatReplyBase=chatReply;
chatReply=function(){
  const c=chdChat(); if(!c||!c.design){chdChatReplyBase();return;}
  const input=document.getElementById('threadInput'), q=(input.value||'').toLowerCase().trim(); if(!q) return;
  const words=q.split(/\W+/).filter(w=>w.length>2);
  let best=null,score=0;
  CHD_TRY.forEach(([k,t])=>{const s=words.filter(w=>t.toLowerCase().includes(w)).length;if(s>score){score=s;best=k;}});
  input.value='';
  if(best&&score>=2) chdGo(best); else showToast('In this demo, try one of the suggested prompts');
};
document.addEventListener('click',e=>{
  const body=document.getElementById('ctBody'); if(!body||!body.contains(e.target)) return;
  const g=e.target.closest('[data-chd-go]'); if(g){chdGo(g.dataset.chdGo);return;}
  const b=e.target.closest('[data-chd]'); if(b&&!b.disabled) chdAction(b.dataset.chd,b.hasAttribute('data-chd-opt'));
});
chdSeedChats();
if(typeof renderSbRecents==='function') renderSbRecents();
