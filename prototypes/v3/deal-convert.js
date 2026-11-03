// Opportunity → Deal: the Create Deal wizard (Sale · Commission · Review).
// Spec: bricly-build docs/canonical/05-flows/opportunity-to-deal.md. Replaces deal-flow.js's single-drawer dfConvertOpen;
// the commission it builds is written through dfSplitApply so the deal page, approvals and payouts stay on one model.

const DC_DEPOSIT_PCT=10;
const DC_FLOOR_PCT=97; // units don't carry a floor price yet; workspace floor = 97% of list
const DC_STEPS=['Sale','Commission','Review'];
let DCV=null;

function dcO(){return DCV&&OPPS.find(r=>r.id===DCV.oppId);}
function dcUnit(id){return typeof UN==='function'?UN(id):null;}
function dcFloor(u){return u?(u.floorPrice||Math.ceil(u.price*DC_FLOOR_PCT/100000)*1000):0;}
function dcNum(v){return Number(String(v??'').replace(/[^\d.]/g,''))||0;}
function dcR2(n){return Math.round(n*100)/100;}
function dcContacts(){return typeof CONTACTS!=='undefined'?CONTACTS:[];}
function dcSkipped(o){
  const x=getExt(o), ji=Math.max(0,jIdx(x.jstage)), pi=JOURNEY.findIndex(j=>j.key==='pos');
  return JOURNEY.slice(ji+1,pi).map(j=>j.label);
}
function dcCanCreate(o){
  if(!o||dealFor(o.id)) return false;
  return jIdx(getExt(o).jstage)>=JOURNEY.findIndex(j=>j.key==='negotiating');
}

// Normal journey = unit Reserved for this buyer → deal goes live. Anything else is a POS recorded outside the app → manager approval.
function dcUnitState(o,id){
  const u=dcUnit(id), x=getExt(o);
  const other=DEALS.find(d=>d.oppId!==o.id&&(d.unit||dealOpp(d)?.units[0])===id);
  if(other) return {ok:false,why:`Already on ${other.id} · ${dealOpp(other)?.lead||''}`};
  if(u&&u.status==='sold') return {ok:false,why:'Sold'};
  const mine=(id===o.units[0]&&!!oppHoldState(o,x))||x.hold?.unit===id;
  if(u&&['hold','reserved'].includes(u.status)&&!mine){
    const by=OPPS.find(q=>q.id!==o.id&&q.units[0]===id&&oppHoldState(q,getExt(q)))?.lead;
    return {ok:false,why:`${u.status==='hold'?'On hold':'Reserved'}${by?' for '+by:''} · ask a manager to release it`};
  }
  const reserved=mine&&['reservation','kyc','pos'].includes(x.jstage);
  return {ok:true,reserved,why:reserved?'Reserved for this buyer':mine?'On hold for this buyer, not reserved yet':'Not reserved for this buyer'};
}

// Finish packs and layouts come from the development's catalog (custom-pack.js); prices are € deltas on the list price.
function dcCat(uid){
  if(!uid||typeof cpCat!=='function') return {layouts:[],packs:[]};
  const c=cpCat(uid); return {layouts:c.layouts.filter(Boolean),packs:c.packs.filter(Boolean)};
}
function dcOptDefaults(o,uid){
  const cat=dcCat(uid), cfg=getExt(o).unitConfigs?.[uid];
  const mp=cfg&&cat.packs.find(p=>p.name===cfg.fin), ml=cfg&&cat.layouts.find(l=>l.name===cfg.lay);
  const pack=mp||cat.packs.find(p=>p.isDefault)||cat.packs[0];
  const lay=ml||cat.layouts.find(l=>l.isDefault)||cat.layouts[0];
  return {pack:pack?.id||null,layout:lay?.id||null,fromPack:!!((mp&&cat.packs.length>1)||(ml&&cat.layouts.length>1))};
}
function dcExtras(){
  const v=DCV, p=v.pack?CR_PACK(v.pack):null, l=v.layout?CR_LAYOUT(v.layout):null;
  return {pack:p,layout:l,add:((p?.delta||0)+(l?.delta||0))*1000};
}
function dcList(){return dcUnit(DCV.unit)?.price||0;}
function dcBase(){return dcList()+dcExtras().add;}
function dcFloorTotal(){const u=dcUnit(DCV.unit);return u?dcFloor(u)+dcExtras().add:0;}
function dcFmt(n){return (Math.round(+n||0)).toLocaleString('en-US');}
function dcDelta(n){return n?`+${fmtEur(n)}`:'Included';}

function dcOpen(oppId,origin){
  const o=OPPS.find(r=>r.id===oppId); if(!o||dealFor(o.id)) return;
  const x=getExt(o);
  const ct=dcContacts().find(c=>c.name===o.lead);
  const pick=o.units.find(id=>dcUnitState(o,id).ok)||o.units[0]||'';
  DCV={oppId,origin,step:1,unit:pick,...dcOptDefaults(o,pick),cobuyers:[],pos:dealToday(),
    funding:dfGuessFunding(o,x),posDoc:{mode:'later',file:null},
    comm:{mode:'default',basis:'pct',val:DF_COMM_RULE.rate,why:''},
    ref:{on:o.source==='Referral'&&!!ct?.ref,name:ct?.ref||'',basis:'pct',val:25},
    share:false,team:[{name:o.rep,pct:100}],note:''};
  const base=pick?dcBase():o.value*1000;
  DCV.price=x.offer?.amt||base; DCV.priceTouched=!!x.offer?.amt;
  DCV.deposit=x.offer?.deposit||Math.round(DCV.price*DC_DEPOSIT_PCT/100); DCV.depTouched=!!x.offer?.deposit;
  dcRender();
}
function dcOpenFromActions(){
  const o=oppCur; if(!o) return;
  if(dealFor(o.id)){openDeal(dealFor(o.id).id);return;}
  dcOpen(o.id,'actions');
}
window.dfConvertOpen=dcOpen;

// ---------- calculations ----------
function dcComm(){
  const v=DCV, price=v.price;
  let total, rate;
  if(v.comm.mode==='default'){rate=DF_COMM_RULE.rate;total=Math.round(price*rate)/100;}
  else if(v.comm.basis==='pct'){rate=+v.comm.val||0;total=Math.round(price*rate)/100;}
  else{total=+v.comm.val||0;rate=price?dcR2(total/price*100):0;}
  const ref=v.ref.on?(v.ref.basis==='pct'?Math.round(total*(+v.ref.val||0))/100:+v.ref.val||0):0;
  const pool=Math.max(0,dcR2(total-ref));
  return {total,rate,ref,pool,team:v.team.map(t=>({...t,amt:Math.round(pool*(+t.pct||0))/100}))};
}
// Shares as % of the total: the referral comes off the top, the team splits what's left (OD-03).
function dcShares(){
  const v=DCV, c=dcComm(), refPct=c.total?c.ref/c.total*100:0, reps=dfReps();
  const shares=v.team.map((t,i)=>({kind:'internal',name:t.name,role:i===0?'Deal owner':'Co-rep',pct:dcR2((+t.pct||0)*(100-refPct)/100),paid:0}));
  if(v.ref.on) shares.push({kind:reps.includes(v.ref.name)?'internal':'external',name:v.ref.name,role:'Referrer',pct:dcR2(refPct),paid:0});
  if(shares.length) shares[0].pct=dcR2(shares[0].pct+100-shares.reduce((a,s)=>a+s.pct,0));
  return shares;
}
function dcIssues(step){
  const v=DCV, o=dcO(), out=[];
  if(step===1){
    if(!v.unit) out.push('Choose the unit.');
    else{const s=dcUnitState(o,v.unit);if(!s.ok) out.push(`${v.unit} can’t be used: ${s.why}.`);}
    if(!(v.price>0)) out.push('Enter the final agreed price.');
    if(!v.pos) out.push('Add the POS signed date.');
    else if(v.pos>dealToday()) out.push('The POS signed date can’t be in the future.');
    if(v.deposit<0||v.deposit>v.price) out.push('The deposit must be between €0 and the final price.');
  }
  if(step===2){
    const c=dcComm(), sum=dcR2(v.team.reduce((a,t)=>a+(+t.pct||0),0));
    if(!(c.total>0)) out.push('Set the commission.');
    if(v.comm.mode==='custom'&&v.comm.basis==='pct'&&c.rate>10) out.push('A commission above 10% isn’t allowed.');
    if(v.comm.mode==='custom'&&!v.comm.why.trim()) out.push('Add a reason for the custom commission.');
    if(v.ref.on&&!v.ref.name) out.push('Choose who referred the buyer.');
    if(v.ref.on&&!(c.ref>0)) out.push('Enter the referral fee.');
    if(v.ref.on&&c.ref>=c.total&&c.total>0) out.push('The referral fee must be less than the total commission.');
    if(v.team.some(t=>!t.name)) out.push('Choose a team member for every row.');
    if(new Set(v.team.map(t=>t.name)).size!==v.team.length) out.push('Each team member can appear once.');
    if(v.ref.on&&v.team.some(t=>t.name===v.ref.name)) out.push('The referrer is already on the team. Remove one of them.');
    if(v.team.some(t=>!(+t.pct>0))) out.push('Every team share needs a percentage above 0.');
    if(sum!==100) out.push(`Team shares add up to ${sum}%. They must total 100%.`);
  }
  return out;
}
function dcFlags(){
  const v=DCV, c=dcComm(), f=[], floor=dcFloorTotal(), lay=dcExtras().layout;
  if(floor&&v.price<floor) f.push({k:'price_below_floor',l:`Price below floor · ${fmtEur(v.price)} vs ${fmtEur(floor)}`});
  if(lay&&lay.approval) f.push({k:'layout_approval',l:`${lay.name} needs developer sign-off`});
  if(v.comm.mode==='custom') f.push({k:'custom_commission',l:`Custom commission · ${c.rate}% (default ${DF_COMM_RULE.rate}%)`});
  return f;
}
function dcNeedsApproval(){return !dcUnitState(dcO(),DCV.unit).reserved&&!dfIsManager();}

// ---------- rendering ----------
function dcSeg(key,cur,opts){
  return `<div class="df-seg" role="radiogroup">${opts.map(([k,l])=>`<button type="button" role="radio" aria-checked="${k===cur}" class="${k===cur?'on':''}" onclick="dcPick('${key}','${k}')">${l}</button>`).join('')}</div>`;
}
function dcRender(){
  const v=DCV, o=dcO();
  const steps=`<ol class="dc-steps" aria-label="Create deal steps">${DC_STEPS.map((l,i)=>`<li class="${i+1===v.step?'on':i+1<v.step?'done':''}" ${i+1===v.step?'aria-current="step"':''}><span>${i+1<v.step?'✓':i+1}</span>${l}</li>`).join('')}</ol>`;
  const body=v.step===1?dcStep1(o):v.step===2?dcStep2(o):dcStep3(o);
  const last=v.step===3, primary=last?(dcNeedsApproval()?'Submit for approval':'Create deal'):'Next';
  dfDrawer('Create deal',`<p class="df-mu">${dfEsc(o.lead)} · ${dfEsc(o.id)} · ${dfEsc(o.devs[0])}</p>${steps}<div id="dc-body">${body}</div><p class="dc-err" id="dc-err" role="alert"></p>`,
    `${v.step>1?'<button class="btn-ghost" onclick="dcBack()">Back</button>':'<button class="btn-ghost" onclick="dcCancel()">Cancel</button>'}<button class="btn-primary" id="dc-next" onclick="${last?'dcCreate()':'dcNext()'}">${primary}</button>`,600);
  dcLive();
}
function dcStep1(o){
  const v=DCV, skipped=dcSkipped(o), us=v.unit?dcUnitState(o,v.unit):null, u=dcUnit(v.unit);
  const names=dcContacts().filter(c=>c.name!==o.lead).map(c=>`<option value="${dfEsc(c.name)}">`).join('');
  return `${skipped.length?`<div class="dc-note warn"><b>POS signed outside Bricly?</b> ${dfEsc(skipped.join(', '))} will be marked <i>Skipped — POS recorded</i> on this opportunity.</div>`:''}
    <label class="df-field"><span>Unit</span>${o.units.length>1
      ?`<select onchange="dcPick('unit',this.value)">${o.units.map(id=>{const s=dcUnitState(o,id),un=dcUnit(id);return `<option value="${dfEsc(id)}" ${id===v.unit?'selected':''} ${s.ok?'':'disabled'}>${dfEsc(id)}${un?` · ${un.beds} bed ${un.type} · ${fmtEur(un.price)}`:''}${s.ok?'':' — '+s.why}</option>`;}).join('')}</select>`
      :`<input value="${dfEsc(v.unit||'No unit linked')}${u?` · ${u.beds} bed ${u.type} · ${fmtEur(u.price)} list`:''}" readonly>`}
      ${us?`<span class="df-mu ${us.ok?'':'bad'}">${dfEsc(us.why)}${us.ok&&!us.reserved?` · ${dfIsManager()?'you’re a manager, so it goes live on create':'a manager approves before the unit is locked'}`:''}</span>`:''}</label>
    <div class="df-field"><span>Buyer(s)</span><div class="dc-buyers"><span class="dc-chip">${dfEsc(o.lead)}</span>
      ${v.cobuyers.map((n,i)=>`<span class="dc-cob"><input list="dc-contacts" placeholder="Co-buyer name" value="${dfEsc(n)}" data-k="cobuyers.${i}" oninput="dcIn(this)" aria-label="Co-buyer ${i+1}"><button type="button" class="tool" aria-label="Remove co-buyer" onclick="dcCobuyer(${i})">${sbIcon('x')}</button></span>`).join('')}
      <button type="button" class="btn-ghost df-sm" onclick="dcCobuyer()">+ Co-buyer</button></div><datalist id="dc-contacts">${names}</datalist></div>
    ${dcOptionsHtml(o)}
    ${dcPriceHtml()}
    <div class="df-grid2">
      <label class="df-field"><span>POS signed</span><input type="date" value="${v.pos}" max="${dealToday()}" data-k="pos" oninput="dcIn(this)"></label>
      <label class="df-field"><span>Deposit paid (€)</span><input id="dc-dep" inputmode="numeric" value="${dcFmt(v.deposit)}" data-k="deposit" data-num oninput="dcMoneyIn(this)"><span class="df-mu" id="dc-dep-hint"></span></label>
    </div>
    <div class="df-field"><span>Funding</span>${dcSeg('funding',v.funding,Object.entries(DF_FUND))}</div>
    <div class="df-field"><span>Signed POS document</span>${dcSeg('posDoc.mode',v.posDoc.mode,[['upload','Upload now'],['later','Add later']])}
      ${v.posDoc.mode==='upload'?`<input type="file" accept=".pdf,image/*" onchange="dcFile(this)" aria-label="Signed POS file">${v.posDoc.file?`<span class="df-mu ok">${dfEsc(v.posDoc.file.name)} attached</span>`:''}`:'<span class="df-mu">An “Upload the signed POS” task is added to the deal.</span>'}</div>`;
}
function dcOptionsHtml(o){
  const v=DCV, cat=dcCat(v.unit);
  if(cat.packs.length<2&&cat.layouts.length<2) return '';
  const group=(key,label,items,cur)=>items.length<2?'':`<div class="df-field"><span>${label}</span><div class="dc-opts" role="radiogroup" aria-label="${label}">${items.map(it=>`<button type="button" role="radio" aria-checked="${it.id===cur}" class="dc-opt ${it.id===cur?'on':''}" onclick="dcPick('${key}','${it.id}')">
      ${it.render?`<span class="dc-opt-sw" style="background:${it.render}"></span>`:''}<span class="dc-opt-n">${dfEsc(it.name)}</span><span class="dc-opt-p">${dcDelta((it.delta||0)*1000)}</span>${it.approval?'<span class="dc-opt-a">Developer sign-off</span>':''}</button>`).join('')}</div></div>`;
  return `<div class="df-eyebrow">Finishes &amp; layout${v.fromPack?` <span class="df-mu">· pre-selected from ${dfEsc(o.lead.split(' ')[0])}’s custom pack</span>`:''}</div>
    ${group('pack','Finish pack',cat.packs,v.pack)}${group('layout','Layout',cat.layouts,v.layout)}`;
}
function dcPriceHtml(){
  const v=DCV, ex=dcExtras(), list=dcList();
  const rows=list?[[`List price · ${v.unit}`,fmtEur(list)]]:[];
  if(ex.pack&&dcCat(v.unit).packs.length>1) rows.push([`Finish · ${ex.pack.name}`,dcDelta((ex.pack.delta||0)*1000)]);
  if(ex.layout&&dcCat(v.unit).layouts.length>1) rows.push([`Layout · ${ex.layout.name}`,dcDelta((ex.layout.delta||0)*1000)]);
  return `<div class="dc-price">
    ${rows.map(([a,b])=>`<div class="dc-price-row"><span>${dfEsc(a)}</span><span>${b}</span></div>`).join('')}
    ${ex.add?`<div class="dc-price-row sub"><span>Price with options</span><b>${fmtEur(dcBase())}</b></div>`:''}
    <label class="df-field dc-final"><span>Final agreed price (€)</span><input id="dc-price" inputmode="numeric" value="${dcFmt(v.price)}" data-k="price" data-num oninput="dcMoneyIn(this)"><span class="df-mu" id="dc-price-hint"></span></label>
  </div>`;
}
function dcStep2(o){
  const v=DCV, c=dcComm(), reps=dfReps();
  const partners=dcContacts().filter(x=>x.type==='partner'), others=dcContacts().filter(x=>x.type!=='partner'&&x.name!==o.lead);
  const known=new Set([...partners,...others].map(x=>x.name).concat(reps));
  const opt=(n,l)=>`<option value="${dfEsc(n)}" ${n===v.ref.name?'selected':''}>${dfEsc(l||n)}</option>`;
  return `<div class="df-eyebrow">Total commission <span class="df-mu">· excluding VAT</span></div>
    ${dcSeg('comm.mode',v.comm.mode,[['default',`Default · ${DF_COMM_RULE.rate}%`],['custom','Custom']])}
    ${v.comm.mode==='custom'?`<div class="df-grid2">
      <div class="df-field"><span>Basis</span>${dcSeg('comm.basis',v.comm.basis,[['pct','% of price'],['fixed','Fixed €']])}</div>
      <label class="df-field"><span>${v.comm.basis==='pct'?'Rate (%)':'Amount (€)'}</span>${v.comm.basis==='pct'?`<input inputmode="decimal" value="${v.comm.val}" data-k="comm.val" data-num oninput="dcIn(this)">`:`<input inputmode="numeric" value="${dcFmt(v.comm.val)}" data-k="comm.val" data-num oninput="dcMoneyIn(this)">`}</label></div>
      <label class="df-field"><span>Reason for the custom commission</span><input value="${dfEsc(v.comm.why)}" data-k="comm.why" oninput="dcIn(this)" placeholder="e.g. Agreed with the developer for a bulk purchase"></label>`:''}
    <div class="df-split-total"><span class="df-mu">Total commission</span><b id="dc-total"></b></div>

    <div class="df-eyebrow">Was this a referral?</div>
    ${dcSeg('ref.on',v.ref.on?'yes':'no',[['no','No'],['yes','Yes']])}
    ${v.ref.on?`<label class="df-field"><span>Referred by</span><select onchange="dcPick('ref.name',this.value)"><option value="">Choose…</option>
        ${partners.length?`<optgroup label="Partners & agents">${partners.map(p=>opt(p.name,`${p.name}${p.company?' · '+p.company:''}`)).join('')}</optgroup>`:''}
        ${others.length?`<optgroup label="Contacts">${others.map(p=>opt(p.name)).join('')}</optgroup>`:''}
        <optgroup label="Team">${reps.map(n=>opt(n)).join('')}</optgroup>
        ${v.ref.name&&!known.has(v.ref.name)?opt(v.ref.name):''}</select></label>
      <div class="df-grid2"><div class="df-field"><span>Referral fee</span>${dcSeg('ref.basis',v.ref.basis,[['pct','% of commission'],['fixed','Fixed €']])}</div>
        <label class="df-field"><span>${v.ref.basis==='pct'?'Share of commission (%)':'Amount (€)'}</span>${v.ref.basis==='pct'?`<input inputmode="decimal" value="${v.ref.val}" data-k="ref.val" data-num oninput="dcIn(this)">`:`<input inputmode="numeric" value="${dcFmt(v.ref.val)}" data-k="ref.val" data-num oninput="dcMoneyIn(this)">`}</label></div>
      <span class="df-mu">Paid out of the commission, before the team’s split.</span>`:''}

    <div class="df-eyebrow">Share with a team member?</div>
    ${dcSeg('share',v.share?'yes':'no',[['no',`No · 100% to ${dfEsc(v.team[0].name)}`],['yes','Yes']])}
    ${v.share?`<div class="dc-team">${v.team.map((t,i)=>`<div class="dc-team-row">
        <span class="df-av internal" aria-hidden="true">${t.name?initials(t.name):'?'}</span>
        ${i===0?`<span class="dc-team-n"><b>${dfEsc(t.name)}</b><span class="df-mu"> · Deal owner</span></span>`
          :`<select aria-label="Team member" onchange="dcPick('team.${i}.name',this.value)"><option value="">Choose…</option>${reps.filter(n=>n!==v.team[0].name).map(n=>`<option ${n===t.name?'selected':''}>${dfEsc(n)}</option>`).join('')}</select>`}
        <span class="dfs-pctw"><input class="dfs-pct" inputmode="decimal" value="${t.pct}" data-k="team.${i}.pct" data-num oninput="dcIn(this)" aria-label="Share percent">%</span>
        ${i>0?`<button type="button" class="tool" aria-label="Remove team member" onclick="dcTeam(${i})">${sbIcon('x')}</button>`:'<span></span>'}
      </div>`).join('')}</div>
      <button type="button" class="btn-ghost df-sm" onclick="dcTeam()">+ Add team member</button>`:''}

    <div class="df-eyebrow">Breakdown</div>
    <div id="dc-break"></div>
    <div id="dc-rule" class="df-split-rule"></div>`;
}
function dcBreakHtml(){
  const v=DCV, c=dcComm();
  const rows=[[`Total commission`,v.comm.mode==='custom'&&v.comm.basis==='fixed'?'Fixed':`${c.rate}% of ${fmtEur(v.price)}`,fmtEur(c.total),'tot']];
  if(v.ref.on) rows.push([`Referral${v.ref.name?' — '+v.ref.name:''}`,v.ref.basis==='pct'?`${+v.ref.val||0}% of total`:'Fixed','−'+fmtEur(c.ref),'']);
  if(v.ref.on) rows.push(['Team pool','',fmtEur(c.pool),'sub']);
  c.team.forEach((t,i)=>rows.push([`${t.name||'—'}${i===0?' (owner)':''}`,`${+t.pct||0}%`,fmtEur(t.amt),'']));
  return `<table class="dc-break">${rows.map(([a,b,cc,k])=>`<tr class="${k}"><td>${dfEsc(a)}</td><td>${dfEsc(b)}</td><td>${cc}</td></tr>`).join('')}</table>`;
}
function dcStep3(o){
  const v=DCV, c=dcComm(), u=dcUnit(v.unit), flags=dcFlags(), skipped=dcSkipped(o), appr=dcNeedsApproval(), ex=dcExtras();
  const docs=ensureDocs(o,getExt(o)), has=rx=>docs.some(d=>d.file&&rx.test(d.label)&&['signed','filed','verified'].includes(d.status));
  const need=[
    [v.posDoc.mode==='upload'&&!!v.posDoc.file,'Signed POS document'],
    [has(/deposit/i),'Deposit receipt'],
    [has(/provisional duty/i),'Provisional duty receipt (1%)'],
    [has(/source of funds/i),'KYC · source of funds'],
    [false,v.funding==='cash'?'Proof of funds for the balance':'Bank sanction letter · loan deadline'],
    [false,'Final deed target date · notaries · buyer’s lawyer'],
    [false,'Payment plan & stage payments'],
  ];
  return `${appr?`<div class="dc-note warn"><b>Needs manager approval.</b> ${dfEsc(v.unit)} isn’t reserved for ${dfEsc(o.lead.split(' ')[0])}, so ${dfEsc(DF_COMM_RULE.approver)} approves the deal before the unit is locked. The deal shows as Awaiting approval until then.</div>`:''}
    <div class="dc-sum">
      <div><div class="k">Unit</div><div class="v">${dfEsc(v.unit)}${u?` · ${u.beds} bed ${dfEsc(u.type)}`:''}</div></div>
      <div><div class="k">Buyer(s)</div><div class="v">${dfEsc([o.lead,...v.cobuyers.filter(Boolean)].join(', '))}</div></div>
      <div><div class="k">Final price</div><div class="v">${fmtEur(v.price)}${u&&v.price!==dcBase()?` <span class="df-mu">· ${ex.add?'with options':'list'} ${fmtEur(dcBase())}</span>`:''}</div></div>
      ${ex.pack||ex.layout?`<div><div class="k">Finishes &amp; layout</div><div class="v">${dfEsc(dcOptLabel())}</div></div>`:''}
      <div><div class="k">POS signed</div><div class="v">${dfEsc(dfFmtIso(v.pos))}</div></div>
      <div><div class="k">Deposit paid</div><div class="v">${fmtEur(v.deposit)}</div></div>
      <div><div class="k">Funding</div><div class="v">${DF_FUND[v.funding]}</div></div>
      <div><div class="k">Commission</div><div class="v">${fmtEur(c.total)} · ${c.rate}%${v.comm.mode==='custom'?' · custom':' · default'}</div></div>
      <div><div class="k">Split</div><div class="v">${dfEsc(dcShares().map(s=>`${s.name} ${fmtEur(Math.round(c.total*s.pct)/100)}`).join(' · '))}</div></div>
    </div>
    ${skipped.length?`<div class="df-mu">Marked skipped: ${dfEsc(skipped.join(', '))}</div>`:''}
    ${flags.length?`<div class="dc-flags">${flags.map(f=>`<span class="dc-flag">⚑ ${dfEsc(f.l)}</span>`).join('')}<span class="df-mu">Flagged for manager review · doesn’t hold the deal up.</span></div>`:''}
    <div class="df-eyebrow">Still needed on the deal · tracked there, not required now</div>
    ${need.map(([ok,l])=>`<div class="df-att"><span class="df-dot ${ok?'on':''}"></span><span>${dfEsc(l)}</span><span class="df-mu">${ok?'On file':'To do'}</span></div>`).join('')}
    <label class="df-field"><span>Note (optional)</span><input value="${dfEsc(v.note)}" data-k="note" oninput="dcIn(this)" placeholder="${appr?'e.g. POS signed at the notary on Tuesday, deposit paid to the developer':'Anything the deal team should know'}"></label>`;
}
// Updates the computed bits without re-rendering inputs, so typing keeps focus.
function dcLive(){
  const v=DCV; if(!v) return;
  const u=dcUnit(v.unit), set=(id,h)=>{const e=document.getElementById(id);if(e)e.innerHTML=h;};
  if(v.step===1){
    if(u){
      const base=dcBase(), floor=dcFloorTotal(), diff=v.price-base, ref=dcExtras().add?'the price with options':'list';
      const vs=!diff?`Matches ${ref}`:`${fmtEur(Math.abs(diff))} ${diff<0?'below':'above'} ${ref} (${diff<0?'−':'+'}${Math.abs(dcR2(diff/base*100))}%) · <button type="button" class="dc-link" onclick="dcResetPrice()">Use ${fmtEur(base)}</button>`;
      set('dc-price-hint',`${vs} · ${v.price<floor?`<span class="bad">below floor (${fmtEur(floor)}) · flagged for review</span>`:`floor ${fmtEur(floor)}`}`);
    }
    set('dc-dep-hint',v.price?`${dcR2(v.deposit/v.price*100)}% of the price`:'');
  }
  if(v.step===2){
    const c=dcComm(); set('dc-total',fmtEur(c.total)); set('dc-break',dcBreakHtml());
    const devs=dfCommDeviation({rate:c.rate,trigger:DF_COMM_RULE.trigger,shares:dcShares()});
    const r=document.getElementById('dc-rule');
    if(r){r.className='df-split-rule '+(devs.length?'warn':'');r.innerHTML=devs.length?`<b>Differs from the default:</b> ${dfEsc(devs.join(' · '))}. ${dfIsManager()?'You’re a manager, so it’s agreed on create and logged.':`The split goes to ${dfEsc(DF_COMM_RULE.approver)} to approve. The deal goes live anyway.`}`:`Matches the default (${DF_COMM_RULE.rate}%, 100% to the deal owner).`;}
  }
  const issues=v.step<3?dcIssues(v.step):[...dcIssues(1),...dcIssues(2)];
  const e=document.getElementById('dc-err'); if(e) e.textContent=issues[0]||'';
  const n=document.getElementById('dc-next'); if(n) n.disabled=!!issues.length;
}

// ---------- input ----------
function dcPath(k,val){const p=k.split('.');let t=DCV;for(let i=0;i<p.length-1;i++)t=t[p[i]];t[p[p.length-1]]=val;}
function dcIn(el){
  const k=el.dataset.k;
  dcPath(k,el.dataset.num!==undefined?dcNum(el.value):el.value);
  if(k==='price'){DCV.priceTouched=true;dcSyncDeposit();}
  if(k==='deposit') DCV.depTouched=true;
  dcLive();
}
// Money fields show thousands separators as you type; the caret stays after the same digit.
function dcMoneyIn(el){
  const pos=el.selectionStart??el.value.length, before=el.value.slice(0,pos).replace(/\D/g,'').length, digits=el.value.replace(/\D/g,'');
  el.value=digits?dcFmt(+digits):'';
  let i=0,n=0; while(i<el.value.length&&n<before){if(/\d/.test(el.value[i]))n++;i++;}
  if(document.activeElement===el) el.setSelectionRange(i,i);
  dcIn(el);
}
function dcSyncDeposit(){
  if(DCV.depTouched) return;
  DCV.deposit=Math.round(DCV.price*DC_DEPOSIT_PCT/100);
  const e=document.getElementById('dc-dep'); if(e) e.value=dcFmt(DCV.deposit);
}
function dcSyncPrice(){
  if(!DCV.priceTouched) DCV.price=dcBase();
  dcSyncDeposit();
}
function dcResetPrice(){
  DCV.price=dcBase(); DCV.priceTouched=false; dcSyncDeposit();
  const e=document.getElementById('dc-price'); if(e) e.value=dcFmt(DCV.price);
  dcLive();
}
function dcOptLabel(){const ex=dcExtras();return [ex.pack&&`${ex.pack.name} finish`,ex.layout&&ex.layout.name].filter(Boolean).join(' · ')+(ex.add?` (+${fmtEur(ex.add)})`:'');}
function dcPick(k,val){
  const v=DCV;
  if(k==='ref.on'){v.ref.on=val==='yes';}
  else if(k==='share'){v.share=val==='yes';v.team=v.share?[{name:v.team[0].name,pct:50},{name:'',pct:50}]:[{name:v.team[0].name,pct:100}];}
  else if(k==='comm.mode'){v.comm.mode=val;if(val==='custom'){v.comm.basis='pct';v.comm.val=DF_COMM_RULE.rate;}}
  else if(k==='comm.basis'){v.comm.basis=val;v.comm.val=val==='pct'?DF_COMM_RULE.rate:Math.round(v.price*DF_COMM_RULE.rate/100);}
  else if(k==='ref.basis'){v.ref.basis=val;v.ref.val=val==='pct'?25:Math.round(dcComm().total/4);}
  else dcPath(k,val);
  if(k==='unit'){Object.assign(v,dcOptDefaults(dcO(),v.unit));v.priceTouched=false;dcSyncPrice();}
  if(k==='pack'||k==='layout'){v.fromPack=false;dcSyncPrice();}
  dcRender();
}
function dcCobuyer(i){if(i===undefined)DCV.cobuyers.push('');else DCV.cobuyers.splice(i,1);dcRender();}
function dcTeam(i){
  const t=DCV.team;
  if(i===undefined){const give=Math.min(30,Math.floor(+t[0].pct/2));t[0].pct=+t[0].pct-give;t.push({name:'',pct:give});}
  else{const [gone]=t.splice(i,1);t[0].pct=+t[0].pct+(+gone.pct||0);if(t.length===1)DCV.share=false;}
  dcRender();
}
function dcFile(el){const f=el.files&&el.files[0];DCV.posDoc.file=f?{name:f.name,size:Math.max(1,Math.round(f.size/1024))+' KB'}:null;dcRender();}
function dcNext(){const iss=dcIssues(DCV.step);if(iss.length){dcLive();return;}DCV.step++;dcRender();}
function dcBack(){DCV.step=Math.max(1,DCV.step-1);dcRender();}
function dcCancel(){DCV=null;qaDrawerClose();if(typeof renderBoard==='function')renderBoard();}

// ---------- create ----------
function dcCreate(){
  const issues=[...dcIssues(1),...dcIssues(2)]; if(issues.length){dcLive();return;}
  const v=DCV, o=dcO(), x=getExt(o), c=dcComm(), skipped=dcSkipped(o), pending=dcNeedsApproval(), me=dfMe();
  const posLabel=dfFmtIso(v.pos).replace(/^[A-Za-z]{3}\s+/,'');
  const pre={stage:o.stage,jstage:x.jstage,done:[...(x.done||[])],blocker:x.blocker||null,value:o.value,units:[...o.units],rep:o.rep};

  o.units=[v.unit,...o.units.filter(id=>id!==v.unit)];
  skipped.forEach(l=>x.comms.unshift({ch:'sys',t:'Just now',text:`${l} — Skipped · POS recorded ${posLabel} by ${me}`}));
  x.jstage='pos'; x.done=[]; x.blocker=null;
  x.comms.unshift({ch:'sys',t:'Just now',text:'Stage advanced to POS Signed'});
  o.stage='Closed Won'; o.value=v.price/1000;

  const d=ensureDeal(o);
  Object.assign(d,{pos:posLabel,status:pending?'pending':'active',unit:v.unit,buyers:[o.lead,...v.cobuyers.filter(Boolean)],deposit:v.deposit,
    skipped,flags:dcFlags().map(f=>({...f,reviewed:false})),pre,createdBy:me,note:v.note});
  delete o.closed.df; o.closed.step=0;
  if(v.posDoc.mode==='upload'&&v.posDoc.file) dfFileDoc(o,x,{id:'pos',label:'Promise of Sale (POS)',group:'Contract'},v.posDoc.file,'Uploaded when the deal was created','Today');
  const df=dfState(o); df.funding=v.funding;
  if(v.posDoc.mode==='later') df.extraTasks.push({id:'t-pos-upload',step:DF_TPL.steps[0].key,title:'Upload the signed POS',owner:o.rep,done:false});

  DFS={oppId:o.id,price:v.price,rate:c.rate,trigger:DF_COMM_RULE.trigger,note:v.comm.mode==='custom'?v.comm.why:v.note,shares:dcShares()};
  dfSplitApply(o,'');
  Object.assign(df.comm,{total:c.total,rate:c.rate,basis:v.comm.mode==='default'?'default':v.comm.basis==='pct'?'custom_pct':'custom_fixed',
    customReason:v.comm.mode==='custom'?v.comm.why:'',referral:v.ref.on?{name:v.ref.name,basis:v.ref.basis,val:+v.ref.val,amount:c.ref}:null});
  DFS=null;

  dfLog(o,`POS signed — ${d.id} created${pending?' · awaiting manager approval':''}`,`${me}${skipped.length?` · skipped ${skipped.join(', ')}`:''}${v.note?' · '+v.note:''}`,{strong:true});
  const ex=dcExtras();
  if(ex.pack||ex.layout){
    d.options={pack:ex.pack?.name||null,layout:ex.layout?.name||null,list:dcList(),extras:ex.add,base:dcBase()};
    x.unitConfigs=x.unitConfigs||{}; x.unitConfigs[v.unit]={...(x.unitConfigs[v.unit]||{}),fin:ex.pack?.name,lay:ex.layout?.name,adds:x.unitConfigs[v.unit]?.adds||[],price:v.price};
    dfLog(o,`Finishes & layout · ${dcOptLabel()}`,me);
  }
  if(v.price!==dcBase()) dfLog(o,`Final agreed price ${fmtEur(v.price)} · ${ex.add?'price with options':'list'} ${fmtEur(dcBase())}`,me);
  d.flags.forEach(f=>dfLog(o,`Flagged for review · ${f.l}`,me));

  if(pending) dcFileRequest(o,d,c,pre);
  else dcActivate(o,d,dfIsManager()&&!dcUnitState(o,v.unit).reserved?`${me} · manager`:null);
  dfAfter(o,'Documents carried over from the closing room');

  DCV=null; qaDrawerClose();
  if(typeof renderOpp==='function'&&document.getElementById('p-opp')?.classList.contains('on')){renderOpp();if(!pending&&typeof ojConfetti==='function')ojConfetti();}
  pipeRenderAll(); if(typeof renderDeals==='function') renderDeals(); if(typeof apBadge==='function') apBadge();
  const split=df.comm.state==='pending'?` · split sent to ${DF_COMM_RULE.approver.split(' ')[0]}`:'';
  showToast(pending?`📄 ${d.id} sent to ${DF_COMM_RULE.approver.split(' ')[0]} for approval · ${v.unit} stays as is until then`:`📄 POS signed — ${d.id} created${split}`);
  return d;
}
function dcFileRequest(o,d,c,pre){
  const now=new Date(), r={id:'REQ-'+(apSeq++),type:'deal',unit:d.unit,buyer:o.lead,opp:o.id,deal:d.id,rep:d.createdBy,via:'App',
    filed:`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,age:0,note:d.note||'',
    price:o.value*1000,base:d.options?.base||dcList(),floor:dcFloorTotal(),options:d.options?dcOptLabel():'',pos:d.pos,deposit:d.deposit,skipped:[...d.skipped],flags:d.flags.map(f=>f.l),prevStage:pre.stage,commTotal:c.total,commRate:c.rate};
  APPROVALS.push(r); d.approvalReq=r.id;
  return r;
}
// Deal goes live: unit hard-locked as Reserved, competing unit requests auto-decline.
function dcActivate(o,d,approvedBy){
  d.status='active';
  const u=dcUnit(d.unit||o.units[0]);
  if(u&&u.status!=='sold') u.status='reserved';
  if(typeof APPROVALS!=='undefined') APPROVALS.filter(r=>!r.decided&&r.unit===(u&&u.id)&&r.id!==d.approvalReq&&(r.type==='hold'||r.type==='reservation'))
    .forEach(r=>Object.assign(r,{decided:'rejected',by:'System',decidedAt:'Just now',reason:r.opp===o.id?'Superseded by the deal':'Unit reserved'}));
  if(approvedBy) dfLog(o,`${d.id} approved · ${d.unit} reserved`,approvedBy,{strong:true});
  else dfLog(o,`${d.unit} reserved · POS signed`,'Rule · unit was reserved for this buyer');
}
function dcDiscard(o,d,r){
  const x=getExt(o), p=d.pre||{};
  const i=DEALS.indexOf(d); if(i>=0) DEALS.splice(i,1);
  if(typeof APPROVALS!=='undefined') APPROVALS.filter(q=>!q.decided&&q.opp===o.id&&q.type==='commission').forEach(q=>Object.assign(q,{decided:'rejected',by:'System',decidedAt:'Just now',reason:'Deal rejected'}));
  delete o.closed;
  Object.assign(o,{stage:p.stage||o.stage,value:p.value??o.value,units:p.units||o.units,rep:p.rep||o.rep});
  Object.assign(x,{jstage:p.jstage||x.jstage,done:p.done||[],blocker:p.blocker||null});
  x.comms.unshift({ch:'sys',tone:'bad',t:'Just now',text:`${d.id} rejected by ${r.by} · ${r.reason||'No reason'}${r.reasonNote?' · '+r.reasonNote:''} · back to ${p.stage||o.stage}`});
}
// Approvals queue → deal. Runs after apCommitDecision restores its baseline, so edits and undo stay consistent.
function dcApplyDecision(r){
  const o=OPPS.find(q=>q.id===r.opp), d=r.deal&&dealById(r.deal); if(!o||!d) return;
  if(r.decided==='approved') dcActivate(o,d,`${r.by} · approvals queue`);
  else dcDiscard(o,d,r);
  setTimeout(()=>{if(typeof renderDeals==='function')renderDeals();if(dealCur&&dealCur.id===d.id&&document.getElementById('p-deal')?.classList.contains('on')){if(r.decided==='approved')renderDeal();else go('deals');}});
}
function dcApTerms(r){return `${fmtEur(r.price)} · POS ${r.pos}${r.skipped?.length?` · skipped ${r.skipped.length} stage${r.skipped.length>1?'s':''}`:''}`;}
function dcApDetail(r){
  const o=OPPS.find(q=>q.id===r.opp), u=dcUnit(r.unit), can=typeof apCanDecide!=='function'||apCanDecide(), d=r.deal&&dealById(r.deal);
  const comm=d&&o?.closed?dfState(o).comm:null;
  return `<div class="dcard apq-d">
    <div class="apq-d-head">
      <div><div class="apq-d-meta"><span class="apq-tag res">Deal from POS</span>${r.id} · Filed ${r.filed} by ${dfEsc(r.rep)} via ${r.via}</div>
        <h2 class="apq-d-title">Create ${dfEsc(r.deal)} · ${dfEsc(r.buyer)} · ${dfEsc(r.unit)}</h2>
        <div class="apq-d-sub">${r.decided?apDecisionLine(r):`POS recorded without ${dfEsc(r.unit)} being reserved for this buyer. Approving makes the deal live and locks the unit.`}</div></div>
      ${r.decided?`<div class="apq-d-acts"><button class="btn-ghost" onclick="apEditDecision('${r.id}')" ${can?'':'disabled'}>Edit decision</button></div>`
        :`<div class="apq-d-acts"><button class="btn-ghost" onclick="apRejectOpen('${r.id}')" ${can?'':'disabled'}>Reject</button><button class="btn-primary" onclick="apApprove('${r.id}')" ${can?'':'disabled'}>Approve</button></div>`}
    </div>
    <div class="apq-sec"><h3>Sale</h3><div class="apq-kv">
      <div><div class="k">Unit</div><div class="v">${dfEsc(r.unit)}${u?` · ${u.beds} bed ${dfEsc(u.type)} · ${dfEsc(u.dev)}`:''}</div></div>
      <div><div class="k">Buyer</div><div class="v"><a onclick="openOpp('${r.opp}')">${dfEsc(r.buyer)} · ${r.opp}</a></div></div>
      <div><div class="k">Final price</div><div class="v">${fmtEur(r.price)}${r.base?` <span class="df-mu">· ${r.options?'with options':'list'} ${fmtEur(r.base)} · floor ${fmtEur(r.floor)}</span>`:''}</div></div>
      ${r.options?`<div><div class="k">Finishes &amp; layout</div><div class="v">${dfEsc(r.options)}</div></div>`:''}
      <div><div class="k">POS signed · deposit</div><div class="v">${dfEsc(r.pos)} · ${fmtEur(r.deposit||0)}</div></div>
      <div><div class="k">Commission</div><div class="v">${fmtEur(r.commTotal)} · ${r.commRate}%${comm?` · ${dfEsc(comm.shares.map(s=>`${s.name.split(' ')[0]} ${s.pct}%`).join(' / '))}`:''}</div></div>
      <div><div class="k">Stages skipped</div><div class="v">${r.skipped?.length?dfEsc(r.skipped.join(', ')):'None'}</div></div>
    </div>
    ${r.flags?.length?`<div class="apq-kv-note"><div class="k">Flags</div><div class="v">${r.flags.map(dfEsc).join(' · ')}</div></div>`:''}
    ${r.note?`<div class="apq-kv-note"><div class="k">Note from ${dfEsc(r.rep.split(' ')[0])}</div><div class="v">${dfEsc(r.note)}</div></div>`:''}</div>
    <div class="apq-sec"><h3>Effect · ${r.decided==='rejected'?'Not applied':r.decided?'Applied':'If approved'}</h3>
      ${r.decided==='rejected'?`<div class="apq-ctx-v">Deal discarded</div><div class="apq-ctx-s">The opportunity went back to ${dfEsc(r.prevStage)}. ${dfEsc(r.unit)} didn’t change.</div>`
        :`<div class="apq-ctx-v">${dfEsc(r.deal)} → <b>Active</b> · ${dfEsc(r.unit)} ${u?STATUS_LABEL_AP(u.status):''} → <b>Reserved</b></div><div class="apq-ctx-s">Other hold requests on ${dfEsc(r.unit)} are declined. If rejected, the deal is discarded and the opportunity goes back to ${dfEsc(r.prevStage)}.${d?` <a onclick="openDeal('${d.id}')">Open the deal</a>`:''}</div>`}
    </div>
  </div>`;
}

// ---------- deal page, deals list and opportunity hand-off ----------
function dcFlagReview(i){
  const d=dealCur, o=d&&dealOpp(d); if(!o||!dfIsManager()) return;
  const f=d.flags[i]; if(!f) return; f.reviewed=true;
  dfLog(o,`Flag reviewed · ${f.l}`,`${dfMe()} · manager`); renderDeal(); showToast('Flag marked reviewed');
}
function dcDealBannerHtml(d){
  const o=dealOpp(d), open=(d.flags||[]).map((f,i)=>({...f,i})).filter(f=>!f.reviewed), out=[];
  if(d.status==='pending'){
    const r=typeof APPROVALS!=='undefined'&&APPROVALS.find(q=>q.id===d.approvalReq), can=dfIsManager();
    out.push(`<div class="dc-banner warn"><div><b>Awaiting manager approval.</b> The POS was recorded without ${dfEsc(d.unit)} being reserved for ${dfEsc(o.lead.split(' ')[0])}. ${dfEsc(d.unit)} isn’t locked until ${dfEsc(DF_COMM_RULE.approver)} approves.</div>
      ${r?`<div class="dc-banner-a">${can?`<button class="btn-ghost df-sm" onclick="apRejectOpen('${r.id}')">Reject</button><button class="btn-primary df-sm" onclick="apApprove('${r.id}');setTimeout(()=>renderDeal())">Approve</button>`:`<button class="btn-ghost df-sm" onclick="apOpenDecision('${r.id}')">View request ${r.id}</button>`}</div>`:''}</div>`);
  }
  if(open.length) out.push(`<div class="dc-banner flag"><div>${open.map(f=>`<span class="dc-flag">⚑ ${dfEsc(f.l)}${dfIsManager()?` <button type="button" class="dc-flag-btn" onclick="dcFlagReview(${f.i})">Mark reviewed</button>`:''}</span>`).join('')}</div></div>`);
  return out.join('');
}
(function(){
  const baseRender=window.renderDeal;
  window.renderDeal=function(){
    baseRender.apply(this,arguments);
    const d=dealCur; if(!d) return;
    const html=dcDealBannerHtml(d);
    if(html) document.querySelector('#deal-root .df-bar')?.insertAdjacentHTML('afterend',html);
    if(d.status==='pending'){const p=document.getElementById('df-status');if(p){p.textContent='Awaiting approval';p.className='df-pill warn';}}
  };
  const baseStep=window.closedStepLabel;
  window.closedStepLabel=function(o){
    const d=o&&dealFor(o.id);
    if(d&&d.status==='pending') return '<b>Awaiting manager approval</b> · POS recorded outside the journey';
    return baseStep.apply(this,arguments);
  };
  const baseHero=window.handoffHeroHtml;
  window.handoffHeroHtml=function(o,dl){
    if(dl&&dl.status==='pending') return `<div class="dcard oj-hero owns" id="oj-hero" onclick="openDeal('${dl.id}')">
      <div class="owns-ic">◆</div>
      <div style="flex:1;min-width:0">
        <div class="owns-t"><b>POS recorded</b> — <b>${dl.id}</b> is waiting for ${xesc(DF_COMM_RULE.approver)}’s approval</div>
        <div class="owns-s">Signed ${xesc(dl.pos)} · ${fmtEur(o.value*1000)} · ${xesc(dl.unit)} isn’t locked until the deal is approved</div>
      </div>
      <button class="btn-primary" onclick="event.stopPropagation();openDeal('${dl.id}')">View this deal →</button>
    </div>`;
    return baseHero.apply(this,arguments);
  };
})();
