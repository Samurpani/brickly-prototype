/* ═══════════════ SEND PROPOSAL: one drawer, one output ═══════════════
   Every "send to the buyer" entry opens this drawer: the opportunity's Send proposal step and action,
   the Proposal ready banner, Present checkout, the contact page, the compare shortlist hand-off and the
   old custom pack, unit details and brochure entries. It sends one thing, the Buyer proposal
   (proposal/index.html, built from the account standard in Settings › Proposal page), as a website plus
   an optional PDF copy, on one link bricly.mt/p/<hash>. Sending again publishes the next version on the
   same link. The opportunity needs a linked development or home first.
   Load after client-share.js, present-v3-checkout.js and proposal-admin.js. */

(function(){
  if(typeof qaDrawerOpen!=='function'||typeof swAssets!=='function') return;
  const PS=window.PROPOSAL_STD;
  const E=s=>xesc(String(s??''));
  const SB={};
  const std=()=>PS?PS.load().pub:{v:1,template:'signature',sections:{},access:{expiry:30,prices:true,passcode:false}};
  const opp=id=>OPPS.find(o=>o.id===id);
  const firstOf=o=>o.lead.split(' ')[0];
  const uOk=u=>u&&['available','hold'].includes(u.status);
  const inPresent=()=>document.body.classList.contains('pv-active')&&!!(window.PV3&&PV3.S);
  const toast=m=>inPresent()&&PV3.toast?PV3.toast(m):showToast(m);
  const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
  const CH={wa:'WhatsApp',em:'Email',link:'Copy link'};
  const ENG_KEY='bricly.proposal.eng', ISSUES_KEY='bricly.proposal.issues';

  // ---------- options: from the development's published content ----------
  function devOf(uid){const u=UN(uid);return u&&typeof DEV==='function'?DEV(u.dev):null;}
  function liveOf(uid){const d=devOf(uid);try{return d&&typeof deState==='function'?deState(d).live:null;}catch(e){return null;}}
  const CACHE={};
  function opts(uid){
    if(CACHE[uid]) return CACHE[uid];
    const u=UN(uid), d=devOf(uid), c=liveOf(uid);
    const fits=r=>typeof UM!=='undefined'&&UM.fits?UM.fits(r,u):true;
    let lay=c&&c.interiors?c.interiors.layouts.filter(l=>fits(l.rule)).map(l=>({id:l.id,name:l.n,delta:l.price||0,def:!!l.def})):[];
    let fin=d&&window.PV3?PV3.D.finishesFor(d.id).map(f=>({id:f.id,name:f.name,delta:f.delta||0})):[];
    if(!lay.length&&typeof cpCat==='function') lay=cpCat(uid).layouts.map((l,i)=>({id:l.id,name:l.name,delta:(l.delta||0)*1000,def:!i}));
    if(!fin.length&&typeof cpCat==='function') fin=cpCat(uid).packs.map(p=>({id:p.id,name:p.name,delta:(p.delta||0)*1000}));
    const df=d&&window.PV3?PV3.D.defaultFinish(d.id):'';
    return CACHE[uid]={lay,fin,defLay:(lay.find(l=>l.def)||lay[0]||{}).id,defFin:fin.some(f=>f.id===df)?df:(fin[0]||{}).id};
  }
  const hasOpts=uid=>{const O=opts(uid);return O.lay.length>1||O.fin.length>1;};
  const pick=(list,id)=>list.find(x=>x.id===id)||list[0]||{name:'',delta:0};
  function priceOf(uid,c){const u=UN(uid),O=opts(uid);c=c||SB.cfg[uid]||{};return u.price+(pick(O.lay,c.lay).delta||0)+(pick(O.fin,c.fin).delta||0);}
  function cfgFor(uid,pre){
    const O=opts(uid), c={lay:O.defLay,fin:O.defFin,chosen:null};
    if(pre){if(pre.lay&&O.lay.some(l=>l.id===pre.lay))c.lay=pre.lay;if(pre.fin&&O.fin.some(f=>f.id===pre.fin))c.fin=pre.fin;if(pre.chosen)c.chosen={lay:c.lay,fin:c.fin};}
    return c;
  }
  // Options already saved on the opportunity (Present, an earlier proposal) are stored by name.
  function cfgFromOpp(x,uid){
    const uc=(x.unitConfigs||{})[uid]; if(!uc) return null; const O=opts(uid);
    return {lay:(O.lay.find(l=>l.name===uc.lay)||{}).id,fin:(O.fin.find(f=>f.name===uc.fin)||{}).id};
  }
  function snapCfg(ids,cfg){
    const out={}; ids.forEach(id=>{const O=opts(id),c=cfg[id]||{};out[id]={layout:pick(O.lay,c.lay).id||'',finish:pick(O.fin,c.fin).id||'',layName:pick(O.lay,c.lay).name,finName:pick(O.fin,c.fin).name,price:priceOf(id,c),chosen:!!c.chosen,opts:hasOpts(id)};});
    return out;
  }

  // ---------- the one proposal per opportunity ----------
  const proposals=o=>swAssets(o).filter(a=>a.type==='proposal');
  const liveProposal=o=>proposals(o).find(a=>a.attempts.length&&!(a.access&&a.access.state==='revoked'));
  const newId=o=>'pp'+swHash(o.id+':proposal').toString(36).slice(0,5);
  function channels(o){
    const c=swContact(o), dnc=!!(c&&(c.status==='dnc'||c.dnc)), cons=c&&c.consent, phone=c?c.phone:'on file', email=swEmail(o);
    return {
      wa:dnc?'Marked do not contact':!phone?'No phone number on file':cons&&cons.wa===false?'No WhatsApp consent recorded':SW_SIM.outside?'Outside the WhatsApp 24-hour window':'',
      em:dnc?'Marked do not contact':!email?'No email on file':cons&&cons.em===false?'No email consent recorded':'',
      link:''};
  }
  function defaultCh(o){const C=channels(o);return !C.wa?'wa':!C.em?'em':'link';}
  function expDate(days){return new Date(Date.now()+days*864e5).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});}
  const words=t=>(t||'').trim().split(/\s+/).filter(Boolean).length;

  function draft(o){
    const f=firstOf(o), n=SB.ids.length, x=getExt(o), dev=[...new Set(SB.ids.map(id=>UN(id).dev))][0]||o.devs[0]||'us';
    const homes=n===1?'the home':`the ${n} homes`;
    if(SB.kind==='present') return `${f}, thank you for today. Here ${n===1?'is the home':`are ${homes}`} you picked, with the finishes we looked at${SB.compare&&n>1?' and a side-by-side comparison':''}. Have a look and tell me what you think.`;
    const viewing=x.jstage==='viewing_held'||(o.appt&&o.appt.kind==='viewing')||/Appointment Completed/.test(o.stage);
    const open=viewing?`${f}, thank you for coming to see ${dev}.`:`${f}, thanks for getting in touch about ${dev}.`;
    return `${open} I’ve put together ${homes} that ${n===1?'fits':'fit'} what you asked for, with plans, prices and the payment plan for each. Have a look and tell me what you think.`;
  }

  // ---------- open ----------
  // src.kind: 'opp' (default) · 'present' {items,dropped,compare} · 'shortlist' {ids,cfg}
  window.sbOpen=function(oppId,src){
    src=src||{};
    const o=opp(oppId)||oppCur; if(!o) return;
    if(!inPresent()) oppCur=o;
    const x=getExt(o), kind=src.kind||'opp', pre={};
    let ids, dropped=src.dropped||[];
    if(kind==='present'){ids=(src.items||[]).map(i=>i.uid);(src.items||[]).forEach(i=>{pre[i.uid]={lay:i.layout,fin:i.finish,chosen:true};});}
    else if(src.ids&&src.ids.length){ids=src.ids.filter(id=>UN(id));ids.forEach(id=>{pre[id]=(src.cfg||{})[id]||cfgFromOpp(x,id);});}
    else{
      // The proposal is built from what's linked: the opportunity's homes, or the rep picks from its developments.
      if(!o.units.some(id=>UN(id))&&!o.devs.length){blocked(o);return;}
      ids=o.units.filter(id=>uOk(UN(id)));
      dropped=o.units.filter(id=>UN(id)&&!uOk(UN(id)));
      ids.forEach(id=>{pre[id]=cfgFromOpp(x,id);});
    }
    ids=[...new Set(ids)];
    const cfg={}; ids.forEach(id=>{cfg[id]=cfgFor(id,pre[id]);});
    const live=liveProposal(o), st=std();
    Object.assign(SB,{oid:o.id,kind,ids,cfg,step:'homes',edited:false,expiry:st.access.expiry,pdf:true,
      compare:src.compare!=null?!!src.compare:ids.length>1,ch:defaultCh(o),dropped,aid:live?live.id:null});
    SB.msg=draft(o);
    render();
  };
  function blocked(o){
    const f=firstOf(o);
    qaDrawerOpen(`Send proposal to ${f}`,`<div class="sb pa-send sb-blocked">
      <div class="sb-to">To <b>${E(o.lead)}</b></div>
      <div class="sb-warn">Link a development or a home to ${E(f)}’s opportunity first. The proposal is built from them: plans, prices and the payment plan.</div></div>`,
      `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-ghost" onclick="qaDrawerClose();oppQuickEditOpen('${o.id}','units')">Link a home</button><button class="btn-primary" onclick="qaDrawerClose();oppQuickEditOpen('${o.id}','devs')">Link a development</button>`);
  }

  function steps(){return [['homes','Homes'],...(SB.ids.some(hasOpts)?[['options','Options']]:[]),['send','Message & send']];}
  function srcLine(){
    const n=SB.ids.length;
    if(SB.kind==='present') return 'Homes, finishes and layouts picked in today’s presentation.';
    if(SB.kind==='shortlist') return 'Homes from the compare shortlist.';
    if(!n) return `Pick the homes for ${firstOf(opp(SB.oid))} from ${opp(SB.oid).devs.join(', ')}.`;
    return 'Homes from the opportunity.';
  }

  // ---------- step 1 · homes ----------
  function candidates(o){
    return UNITS.filter(u=>uOk(u)&&!SB.ids.includes(u.id)&&(o.devs.includes(u.dev)||SB.ids.some(s=>(UN(s)||{}).dev===u.dev))).slice(0,12);
  }
  function homesHtml(o){
    const cands=candidates(o);
    return `<div class="sb-sub">${E(srcLine())}${SB.ids.length?' Remove one or add another.':''}</div>
      ${SB.dropped.length?`<div class="sb-warn">${E(SB.dropped.join(', '))} ${SB.dropped.length===1?'is':'are'} no longer available and ${SB.dropped.length===1?'was':'were'} left out.</div>`:''}
      <div class="pa-homes">${SB.ids.map(id=>{const u=UN(id),c=SB.cfg[id],O=opts(id);
        return `<div class="pa-home sb-home"><div><b>${E(id)}</b><span class="st-sub">${E(u.dev)} · ${u.beds?u.beds+' bed':'Studio'} · ${u.sqm} m² · ${E(fmtEur(priceOf(id)))}${u.status==='hold'?' · on hold':''}</span>${hasOpts(id)?`<span class="st-sub">${E(pick(O.lay,c.lay).name)} · ${E(pick(O.fin,c.fin).name)} finish${c.chosen?' · picked in Present':''}</span>`:''}</div><button type="button" class="pa-x" aria-label="Remove ${E(id)}" onclick="sbUnit('${E(id)}',false)">×</button></div>`;}).join('')||'<div class="st-sub">Add at least one home.</div>'}
        ${cands.length?`<label class="pa-sr" for="sb-add">Add a home</label><select id="sb-add" class="pa-add" onchange="if(this.value)sbUnit(this.value,true)"><option value="">+ Add a home</option>${cands.map(u=>`<option value="${E(u.id)}">${E(u.id)} · ${E(u.dev)} · ${u.beds?u.beds+' bed':'Studio'} · ${E(fmtEur(u.price))}</option>`).join('')}</select>`:''}</div>`;
  }

  // ---------- step 2 · options ----------
  function optionsHtml(){
    const withO=SB.ids.filter(hasOpts), without=SB.ids.filter(id=>!hasOpts(id));
    const group=(id,kind,label,list,cur,chosen)=>list.length>1?`<div class="sb-og"><div class="sb-ol">${label}</div><div class="sb-chips" role="group" aria-label="${E(id)} ${label.toLowerCase()}">${list.map(v=>`<button type="button" class="sb-chip ${v.id===cur?'on':''}" aria-pressed="${v.id===cur}" onclick="sbPick('${E(id)}','${kind}','${E(v.id)}')"><b>${E(v.name)}</b><span>${v.delta?'+ '+E(fmtEur(v.delta)):'Included'}</span>${chosen===v.id?'<em>Picked in Present</em>':''}</button>`).join('')}</div></div>`
      :`<div class="sb-og"><div class="sb-ol">${label}</div><div class="st-sub">${E(list[0]?list[0].name:'As designed')} · the only ${label.toLowerCase()} for this home</div></div>`;
    return `<div class="sb-sub">Only what each development offers for that home. The price updates with each choice.</div>
      ${withO.map(id=>{const u=UN(id),c=SB.cfg[id],O=opts(id);
        return `<div class="sb-opt"><div class="sb-oh"><div><b>${E(id)}</b><span class="st-sub">${E(u.dev)} · ${u.beds?u.beds+' bed':'Studio'} · floor ${u.floor}</span></div><b class="sb-price">${E(fmtEur(priceOf(id)))}</b></div>
          ${group(id,'lay','Layout',O.lay,c.lay,c.chosen&&c.chosen.lay)}${group(id,'fin','Finish',O.fin,c.fin,c.chosen&&c.chosen.fin)}</div>`;}).join('')}
      ${without.length?`<div class="st-sub">${E(without.join(', '))}: one layout and one finish, nothing to choose.</div>`:''}`;
  }

  // ---------- step 3 · message & send ----------
  function sendHtml(o){
    const st=std(), f=firstOf(o), C=channels(o), w=words(SB.msg), live=SB.aid&&swA(o,SB.aid);
    const tpl=PS?(PS.TEMPLATES.find(t=>t.k===st.template)||{n:st.template}):{n:'Signature'};
    const link=swLink(o,{type:'proposal',id:SB.aid||newId(o)});
    const sw=(k,label,sub,on,dis)=>`<label class="sb-sw"><span><b>${label}</b>${sub?`<span class="st-sub">${sub}</span>`:''}</span><input type="checkbox" role="switch" ${on?'checked':''} ${dis?'disabled':''} onchange="sbSet('${k}',this.checked)"></label>`;
    const days=[...new Set([7,14,30,st.access.expiry])].sort((a,b)=>a-b);
    const devs=[...new Set(SB.ids.map(id=>UN(id).dev))];
    return `<label class="sb-ol" for="sb-msg">Message</label>
      <textarea id="sb-msg" class="pa-ta" rows="5" oninput="sbMsg(this.value)">${E(SB.msg)}</textarea>
      <div class="st-sub ${w>80?'sw-err':''}" id="sb-wc">${w} of 80 words · it opens the proposal as your letter</div>
      <div class="sb-ol">What ${E(f)} gets</div>
      <div class="sb-list">
        ${sw('web','Proposal website','Your template and brand, '+plural(SB.ids.length,'home'),true,true)}
        ${sw('pdf','PDF copy','Same content, to download or print',SB.pdf)}
        ${SB.ids.length>1?sw('compare','Side-by-side comparison','',SB.compare):''}
      </div>
      <div class="sb-row"><span class="sb-ol">Link expires</span><div class="sb-seg" role="group" aria-label="Link expires">${days.map(n=>`<button type="button" class="${SB.expiry===n?'on':''}" aria-pressed="${SB.expiry===n}" onclick="sbSet('expiry',${n})">${n} days</button>`).join('')}</div></div>
      <div class="sb-ol">Send by</div>
      <div class="sb-chans" role="radiogroup" aria-label="Send by">${Object.entries(CH).map(([k,l])=>`<button type="button" role="radio" class="sb-ch ${SB.ch===k?'on':''}" aria-checked="${SB.ch===k}" ${C[k]?'disabled':''} title="${E(C[k])}" onclick="sbSet('ch','${k}')"><b>${l}</b><span>${E(C[k]||(k==='wa'?swPhone(o)||'Phone on file':k==='em'?swEmail(o):'Paste it anywhere'))}</span></button>`).join('')}</div>
      <div class="sb-link"><span>Link</span><code>${E(link)}</code></div>
      ${live?`<div class="sb-note">${E(f)} already has proposal v${live.pub} (sent ${E(swDay(swLastTry(live).when))}). This sends v${live.pub+1} on the same link.</div>`:''}
      <div class="pa-set sb-set">
        <div class="pa-h">Set by your admin</div>
        <div><span>Template</span><b>${E(tpl.n)} · standard v${st.v}</b></div>
        <div><span>Developments</span><b>${devs.map(E).join(', ')||'—'}</b></div>
        <div><span>Sections</span><b>${PS?`${PS.SECTIONS.filter(s=>st.sections[s.k]!=='off').length} of ${PS.SECTIONS.length}`:'All'}${st.access.prices?'':' · prices on request'}${st.access.passcode?' · passcode':''}</b></div>
        ${typeof paOpenSettings==='function'&&/owner|manager/.test(typeof curPersona!=='undefined'?curPersona:'')&&!inPresent()?`<button type="button" class="pa-link" onclick="qaDrawerClose();paOpenSettings()">Change in Settings</button>`:''}
      </div>`;
  }

  function canSend(o){const w=words(SB.msg);return SB.ids.length&&w>0&&w<=80&&!channels(o)[SB.ch];}
  function sendLabel(){return SB.ch==='wa'?'Send on WhatsApp':SB.ch==='em'?'Send by email':'Copy link';}
  function render(){
    const o=opp(SB.oid), S=steps();
    if(!S.some(s=>s[0]===SB.step)) SB.step='send';
    const i=S.findIndex(s=>s[0]===SB.step), last=i===S.length-1;
    const head=`<div class="sb-to">To <b>${E(o.lead)}</b></div>
      <ol class="sb-steps" aria-label="Steps">${S.map(([k,l],n)=>`<li><button type="button" class="${k===SB.step?'on':''} ${n<i?'done':''}" ${k!=='homes'&&!SB.ids.length?'disabled':''} ${k===SB.step?'aria-current="step"':''} onclick="sbStep('${k}')"><span>${n<i?'✓':n+1}</span>${l}</button></li>`).join('')}</ol>`;
    const body=SB.step==='homes'?homesHtml(o):SB.step==='options'?optionsHtml():sendHtml(o);
    const back=i?`<button class="btn-ghost" onclick="sbStep('${S[i-1][0]}')">Back</button>`:`<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button>`;
    const foot=last?`${back}<button class="btn-ghost" ${SB.ids.length?'':'disabled'} onclick="sbPreview()">Preview</button><button class="btn-primary" id="sb-go" ${canSend(o)?'':'disabled'} onclick="sbSend()">${sendLabel()}</button>`
      :`${back}<button class="btn-primary" id="sb-next" ${SB.ids.length?'':'disabled'} onclick="sbStep('${S[i+1][0]}')">Continue</button>`;
    qaDrawerOpen(`Send proposal to ${firstOf(o)}`,`<div class="sb pa-send" data-step="${SB.step}">${head}${body}</div>`,foot);
    const d=document.getElementById('qaDrawer'); d.classList.add('sb-drawer'); d.dataset.sb=SB.kind;
    overPresent(true);
  }

  window.sbStep=k=>{if(k!=='homes'&&!SB.ids.length)return;SB.step=k;render();document.getElementById('qaDrawerBody').scrollTop=0;};
  window.sbUnit=(id,add)=>{
    const o=opp(SB.oid);
    SB.ids=add?[...SB.ids,id]:SB.ids.filter(x=>x!==id);
    if(add) SB.cfg[id]=cfgFor(id,cfgFromOpp(getExt(o),id));
    if(!SB.edited) SB.msg=draft(o);
    render();
  };
  window.sbPick=(id,kind,val)=>{SB.cfg[id][kind]=val;render();};
  window.sbMsg=v=>{
    SB.msg=v;SB.edited=true;const w=words(v),el=document.getElementById('sb-wc'),b=document.getElementById('sb-go');
    if(el){el.textContent=`${w} of 80 words · it opens the proposal as your letter`;el.classList.toggle('sw-err',w>80);}
    if(b) b.disabled=!canSend(opp(SB.oid));
  };
  window.sbSet=(k,v)=>{
    SB[k]=v;
    if(k==='compare'&&!SB.edited) SB.msg=draft(opp(SB.oid));
    render();
  };

  // ---------- the buyer page reads an issue: this buyer, these homes, these options, this message ----------
  function homeFor(id,c){
    const u=UN(id), d=devOf(id)||{};
    return {id:id.replace('#',''),dev:d.id||u.dev,devName:u.dev,place:d.loc||'',photo:d.photo||'',handover:u.ready||d.completion||'',beds:u.beds,baths:u.baths,sqm:u.sqm,ext:u.ext||0,floor:u.floor,
      price:c.price,status:u.status,layout:c.opts?c.layName:'',finish:c.opts?c.finName:''};
  }
  function issueFor(o,{id,v,units,cfg,msg,compare,pdf}){
    const [first,...rest]=o.lead.split(' ');
    return {id,v,first,last:rest.join(' '),rep:o.rep,units:units.map(u=>u.replace('#','')),msg,compare,pdf,homes:units.map(u=>homeFor(u,cfg[u])),link:swLink(o,{type:'proposal',id})};
  }
  function storeIssue(i,keyed){
    try{
      localStorage.setItem('bricly.proposal.issue',JSON.stringify(i));
      if(keyed){const all=JSON.parse(localStorage.getItem(ISSUES_KEY)||'{}');all[i.id]=i;localStorage.setItem(ISSUES_KEY,JSON.stringify(all));}
    }catch(e){/* storage full or blocked */}
  }
  const PAGE='proposal/index.html';
  window.sbPreview=function(){
    const o=opp(SB.oid), live=SB.aid&&swA(o,SB.aid);
    storeIssue(issueFor(o,{id:SB.aid||newId(o),v:live?live.pub+1:1,units:SB.ids,cfg:snapCfg(SB.ids,SB.cfg),msg:SB.msg.trim(),compare:SB.compare&&SB.ids.length>1,pdf:SB.pdf}));
    window.open(PAGE+'?issue=1&intro=1&preview=1','_blank','noopener');
  };
  function assetIssue(o,a){return issueFor(o,{id:a.id,v:a.pub,units:a.cur.units,cfg:a.cur.cfg||snapCfg(a.cur.units,{}),msg:a.cur.msg,compare:a.cur.compare,pdf:a.cur.pdf});}
  window.sbView=function(id){const o=oppCur,a=swA(o,id);storeIssue(assetIssue(o,a),true);window.open(`${PAGE}?issue=1&a=${encodeURIComponent(id)}&preview=1`,'_blank','noopener');};
  // Prototype: opens the page as the buyer would, so opens and time on homes are recorded.
  window.sbAsBuyer=function(id){const o=oppCur,a=swA(o,id);SW.menu=null;storeIssue(assetIssue(o,a),true);window.open(`${PAGE}?issue=1&a=${encodeURIComponent(id)}`,'_blank','noopener');};

  // ---------- send ----------
  function diffNote(prev,cur){
    const add=cur.units.filter(u=>!prev.units.includes(u)), rm=prev.units.filter(u=>!cur.units.includes(u));
    const ch=cur.units.filter(u=>prev.units.includes(u)&&prev.cfg&&prev.cfg[u]&&prev.cfg[u].opts&&(prev.cfg[u].layout!==cur.cfg[u].layout||prev.cfg[u].finish!==cur.cfg[u].finish));
    return [add.length?'added '+add.join(', '):'',rm.length?'removed '+rm.join(', '):'',ch.length?'options changed on '+ch.join(', '):'',prev.msg!==cur.msg?'new message':''].filter(Boolean).join(' · ')||'sent again';
  }
  window.sbSend=function(){
    const o=opp(SB.oid), x=getExt(o), f=firstOf(o);
    if(!canSend(o)) return;
    const st=std(), list=swAssets(o,x), now=swNow(), chL=SB.ch==='link'?'Link':CH[SB.ch];
    let a=SB.aid&&list.find(r=>r.id===SB.aid);
    if(!a){a={id:newId(o),type:'proposal',pp:1,title:'Buyer proposal',icon:'WEB',units:[],pub:0,draft:null,cur:{},versions:[],attempts:[],access:{state:'active',exp:''},eng:{opens:0,homes:{},last:''}};list.unshift(a);}
    else{list.splice(list.indexOf(a),1);list.unshift(a);}
    const prev=a.pub?a.cur:null;
    a.pub++; a.units=[...SB.ids]; a.src=SB.kind;
    a.cur={msg:SB.msg.trim(),units:[...SB.ids],cfg:snapCfg(SB.ids,SB.cfg),compare:SB.compare&&SB.ids.length>1,pdf:SB.pdf,expiry:SB.expiry,template:st.template,std:st.v};
    a.access={state:'active',exp:expDate(SB.expiry)};
    a.versions.push({v:a.pub,when:now,by:o.rep,ch:chL,from:SB.kind,units:[...SB.ids],note:prev?diffNote(prev,a.cur):'first issue · '+SB.ids.join(', ')});
    a.attempts.push({when:now,ch:chL,ver:a.pub,fmt:SB.pdf?'both':'link',status:SB.ch==='link'?'Copied':'Delivered',msg:a.cur.msg});
    const homes=plural(SB.ids.length,'home'), link=swLink(o,a);
    x.comms=x.comms||[];
    x.comms.unshift(SB.ch==='link'
      ?{ch:'sys',t:'Just now',text:`Proposal link copied for ${f} · ${homes} · v${a.pub}`,proposal:a.id}
      :{ch:SB.ch,dir:'out',who:'You',t:'Just now',sub:E(`📎 Proposal v${a.pub} · ${link} · website${SB.pdf?' and PDF':''}`),text:E(`Proposal sent to ${f} on ${chL} · ${homes}`),proposal:a.id});
    SB.ids.forEach(id=>{if(!o.units.includes(id))o.units.push(id);const d=UN(id).dev;if(d&&!o.devs.includes(d))o.devs.push(d);});
    x.unitConfigs=x.unitConfigs||{};
    SB.ids.forEach(id=>{const c=a.cur.cfg[id];x.unitConfigs[id]={...(x.unitConfigs[id]||{}),fin:c.finName,lay:c.layName,adds:(x.unitConfigs[id]||{}).adds||[],price:c.price};});
    // Both flags: older readers check either one (follow-up step, Proposal ready banner).
    x.ppSent=true; x.packSent=true; x.ppReady=false;
    if(x.jstage==='viewing_held') x.next={label:`Ask ${f} for an offer`,due:'In 3 days',overdue:false};
    storeIssue(assetIssue(o,a),true);
    if(SB.ch==='link'){try{navigator.clipboard&&navigator.clipboard.writeText('https://'+link).catch(()=>{});}catch(e){/* clipboard blocked */}}
    const kind=SB.kind;
    qaDrawerClose();
    if(kind==='present'&&inPresent()){
      const P=PV3;
      (P.S.shares||(P.S.shares=[])).unshift({text:SB.ch==='link'?`Proposal v${a.pub} link copied`:`Proposal v${a.pub} sent on ${chL}`,icon:'send',at:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})});
      if(P.store&&P.clone){P.store.records[o.id]={opportunity:P.clone(o),extension:P.clone(x)};}
      if(P.persist) P.persist();
      P.render();
    } else {
      if(typeof oppShareF!=='undefined') oppShareF='all';
      if(typeof renderOpp==='function'&&document.getElementById('opp-root')) renderOpp();
      if(typeof pipeRenderAll==='function') pipeRenderAll();
    }
    toast(SB.ch==='link'?`Link copied · proposal v${a.pub} for ${f}`:`Proposal v${a.pub} sent to ${f} on ${chL}`);
  };

  // ---------- engagement: seeded numbers plus what the buyer page recorded ----------
  function engOf(o,a){
    const s=(a.eng&&typeof a.eng==='object')?a.eng:{opens:0,homes:{}};
    let rec={opens:[],homes:{}};
    try{rec=JSON.parse(localStorage.getItem(ENG_KEY)||'{}')[a.id]||rec;}catch(e){/* ignore */}
    const homes={...(s.homes||{})};
    Object.entries(rec.homes||{}).forEach(([k,ms])=>{const id=a.units.find(u=>u.replace('#','')===k)||k;homes[id]=(homes[id]||0)+ms;});
    const opens=(s.opens||0)+(rec.opens||[]).length, lastTs=(rec.opens||[]).slice(-1)[0];
    const last=lastTs?'today '+new Date(lastTs).toTimeString().slice(0,5):s.last||'';
    return {opens,homes,last};
  }
  const dur=ms=>ms<60000?`${Math.max(1,Math.round(ms/1000))} s`:`${Math.round(ms/60000)} min`;
  window.sbEngLine=function(o,a){
    const e=engOf(o,a), t=swLastTry(a);
    if(a.access&&a.access.state==='revoked') return 'Link stopped';
    if(!e.opens) return t&&t.status==='Copied'?'Link copied · not sent yet':'Not opened yet';
    const top=Object.entries(e.homes).filter(([,ms])=>ms>=1000).sort((p,q)=>q[1]-p[1]).slice(0,2).map(([id,ms])=>`${dur(ms)} on ${id}`);
    return `${e.opens===1?'Opened once':`Opened ${e.opens} times`}${e.last?' · last '+e.last:''}${top.length?' · '+top.join(', '):''}`;
  };

  // ---------- the card in Shared with client ----------
  // Homes in a sent version that can no longer be bought: the buyer page still shows them as sent.
  const GONE={sold:'sold',reserved:'reserved',contract:'under contract'};
  const goneOf=ids=>(ids||[]).map(id=>[id,UN(id)]).filter(([,u])=>u&&!uOk(u)).map(([id,u])=>[id,GONE[u.status]||'no longer available']);
  const goneText=g=>g.map(([id,s])=>`${id} ${s}`).join(' · ');
  window.sbCardHtml=function(o,a){
    const t=swLastTry(a), e=engOf(o,a), menu=SW.menu===a.id, stopped=a.access&&a.access.state==='revoked', copied=t&&t.status==='Copied';
    const gone=goneOf(a.units), old=a.versions.filter(v=>v.legacy).length;
    const devs=[...new Set(a.units.map(u=>(UN(u)||{}).dev).filter(Boolean))].join(', ');
    const status=stopped?['Link stopped','err']:copied?['Link copied · not sent yet','warn']:e.opens?[e.opens===1?'Opened once':`Opened ${e.opens} times`,'ok']:['Delivered · not opened yet',''];
    const homes=Object.entries(e.homes).filter(([,ms])=>ms>=1000).sort((p,q)=>q[1]-p[1]).slice(0,3).map(([id,ms])=>`${id} ${dur(ms)}`);
    const mi=(l,fn)=>`<button role="menuitem" onclick="${fn}">${l}</button>`;
    return `<div class="cr-lc sh-item sb-card" data-sw="${a.id}">
      <span class="sh-thumb">WEB</span>
      <div class="sh-body">
        <div class="sh-top"><span class="sh-n">Buyer proposal <span class="sb-v">v${a.pub}</span></span>
          <span class="sh-acts"><button class="sh-btn" onclick="sbView('${a.id}')">View</button><button class="sh-btn primary" onclick="sbOpen('${o.id}')">Send new version</button>
            <span class="sw-more"><button class="sh-btn sh-more" aria-label="More actions for the proposal" aria-haspopup="menu" aria-expanded="${menu}" onclick="swMenu(event,'${a.id}')">⋯</button>${menu?`<div class="sw-menu" role="menu">${mi('Copy link',`sbCopy('${a.id}')`)}${a.cur.pdf?mi('Download PDF',`sbPdf('${a.id}')`):''}${mi('Versions and activity',`sbHistory('${a.id}')`)}${stopped?'':mi('Stop the link',`sbStop('${a.id}')`)}</div>`:''}</span></span></div>
        <div class="cr-lc-meta">${E(devs)} · ${E(a.units.join(', '))}</div>
        <div class="sh-via">${E(o.lead)} · ${E(t.ch==='Link'?'link copied':t.ch)} · ${E(t.when)} · v${t.ver}</div>
        <div class="sh-chips"><span class="sh-chip ${status[1]}">${E(status[0])}</span><span class="sh-chip">Website${a.cur.pdf?' and PDF':''}</span>${stopped?'':`<span class="sh-chip">Expires ${E(a.access.exp)}</span>`}</div>
        ${e.opens?`<div class="cr-lc-meta">Last opened ${E(e.last)}${homes.length?` · time on homes: ${E(homes.join(', '))}`:''}</div>`:''}
        ${gone.length&&!stopped?`<div class="sh-fail sb-gone"><span>${E(goneText(gone))} since v${a.pub}. ${E(firstOf(o))} still sees ${gone.length===1?'it':'them'} in the proposal.</span><button onclick="sbOpen('${o.id}')">Send new version</button></div>`:''}
        ${old?`<div class="cr-lc-meta">Includes ${plural(old,'earlier pack')} sent before proposals · <button type="button" class="pa-link" onclick="sbHistory('${a.id}')">Versions</button></div>`:''}
        <div class="cr-lc-meta sb-cardlink">${E(swLink(o,a))}</div>
      </div></div>`;
  };
  window.sbCopy=function(id){const o=oppCur,a=swA(o,id),l=swLink(o,a);SW.menu=null;try{navigator.clipboard&&navigator.clipboard.writeText('https://'+l).catch(()=>{});}catch(e){/* blocked */}renderOpp();showToast(`${l} copied`);};
  // Opens the buyer page for this version, which builds the PDF and downloads it.
  window.sbPdf=function(id){const o=oppCur,a=swA(o,id);SW.menu=null;renderOpp();storeIssue(assetIssue(o,a),true);window.open(`${PAGE}?issue=1&a=${encodeURIComponent(id)}&preview=1&pdf=proposal`,'_blank','noopener');};
  window.sbStop=function(id){
    const o=oppCur,a=swA(o,id);SW.menu=null;
    a.access={...a.access,state:'revoked',when:swDay(swNow()),by:o.rep};
    getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`Proposal link stopped by ${o.rep} · ${firstOf(o)} can no longer open it`});
    renderOpp();showToast('Link stopped. Send a new version to share again.');
  };
  window.sbHistory=function(id){
    const o=oppCur,a=swA(o,id),e=engOf(o,a);SW.menu=null;renderOpp();
    qaDrawerOpen(`Proposal for ${firstOf(o)} · versions`,`<div class="sb-hist">
      <div class="sb-ol">Link</div><div class="sb-link"><code>${E(swLink(o,a))}</code></div>
      <div class="sb-ol">Versions</div>${[...a.versions].reverse().map(v=>{const g=goneOf(v.units);
        return `<div class="sw-li"><b>v${v.v}</b><span>${E(v.note)} · ${E(v.by)}${v.ch?' · '+E(v.ch==='Link'?'link copied':v.ch):''}${g.length?`<span class="sb-hgone">${E(goneText(g))} since</span>`:''}</span><em>${E(v.when)}</em></div>`;}).join('')}
      ${a.versions.some(v=>v.legacy)?`<div class="st-sub">Packs and brochures sent before proposals are kept here as earlier versions, with the homes and prices as they were sent. Their old links now open the latest version.</div>`:''}
      <div class="sb-ol">${E(firstOf(o))}’s activity</div><div class="st-sub">${E(sbEngLine(o,a))}</div>
      ${Object.entries(e.homes).map(([u,ms])=>`<div class="sw-li"><b>${E(u)}</b><span>${E(dur(ms))} on this home</span></div>`).join('')}
      <div class="st-sub">Every version opens on the same link. ${E(firstOf(o))} always sees the latest one.</div></div>`,
      `<button class="btn-ghost" onclick="qaDrawerClose()">Close</button><button class="btn-primary" onclick="sbOpen('${o.id}')">Send new version</button>`);
  };

  // ---------- Present: the drawer sits above the presentation ----------
  function overPresent(on){
    const els=['qaDrawer','qaScrim','briclyToast'].map(id=>document.getElementById(id)).filter(Boolean);
    if(on&&inPresent()){document.body.classList.add('sb-pv');els.forEach(el=>{el.inert=false;el.removeAttribute('aria-hidden');});}
    else if(!on&&document.body.classList.contains('sb-pv')){
      document.body.classList.remove('sb-pv');
      if(document.body.classList.contains('pv-active')) els.forEach(el=>{el.inert=true;el.setAttribute('aria-hidden','true');});
    }
  }
  const baseOpen=window.qaDrawerOpen, baseClose=window.qaDrawerClose;
  window.qaDrawerOpen=function(){const d=document.getElementById('qaDrawer');if(d){d.classList.remove('sb-drawer');delete d.dataset.sb;}return baseOpen.apply(this,arguments);};
  window.qaDrawerClose=function(){const r=baseClose.apply(this,arguments);overPresent(false);return r;};
  // Keys typed in the drawer stay in the drawer; Escape closes it instead of leaving the presentation.
  window.addEventListener('keydown',e=>{
    if(!document.body.classList.contains('sb-pv')) return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();qaDrawerClose();return;}
    if(e.target.closest&&e.target.closest('#qaDrawer')) e.stopPropagation();
  },true);

  // ---------- every entry point opens this drawer ----------
  window.paSend=id=>sbOpen(id||oppCur.id);
  window.otPackOpen=()=>sbOpen(oppCur.id);
  // Retired entries (custom pack, unit details, brochure) from older links, tasks and saved views.
  window.cpAgentOpen=()=>sbOpen(oppCur.id);
  window.cpUnitDetails=id=>sbOpen(id||oppCur.id);
  window.qaBrochure=()=>sbOpen(oppCur.id);
  window.crResume=id=>sbOpen(id||oppCur.id);
  window.crOpen=function(oppId,seed){
    const o=opp(oppId)||oppCur;
    if(seed&&seed.unitIds&&seed.unitIds.length){
      const cfg={};seed.unitIds.forEach(u=>{const c=seed.cfg&&seed.cfg[u];if(c)cfg[u]={lay:c.layout,fin:c.pack};});
      sbOpen(o.id,{kind:'shortlist',ids:seed.unitIds,cfg});
    } else sbOpen(o.id);
  };
  window.cpDemoItems=function(o){
    const a=liveProposal(o); if(!a) return '';
    const u=a.units.find(id=>uOk(UN(id)));
    return `<div class="sw-menu-h">Proposal v${a.pub}</div><button role="menuitem" onclick="sbAsBuyer('${a.id}')">Open as ${E(firstOf(o))} (counts as a visit)</button><button role="menuitem" onclick="sbSimOpen('${a.id}')">${E(firstOf(o))} opens it</button>${u?`<button role="menuitem" onclick="sbSimSold('${E(u)}')">${E(u)} sells to another buyer</button>`:''}`;
  };
  window.sbSimSold=function(uid){const u=UN(uid);SW.menu=null;if(u)u.status='sold';renderOpp();showToast(`${uid} marked sold`);};
  window.sbSimOpen=function(id){
    const o=oppCur,a=swA(o,id);SW.menu=null;
    try{const all=JSON.parse(localStorage.getItem(ENG_KEY)||'{}'),r=all[id]||(all[id]={opens:[],homes:{}});r.opens.push(Date.now());const k=a.units[0].replace('#','');r.homes[k]=(r.homes[k]||0)+95000;localStorage.setItem(ENG_KEY,JSON.stringify(all));}catch(e){/* ignore */}
    renderOpp();showToast(`${firstOf(o)} opened the proposal`);
  };
  window.SB_STATE=SB;
})();
