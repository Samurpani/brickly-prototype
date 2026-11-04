// Deal progression (Deal page flow updates · DF01–DF08) and the deal's sales team + commission split.
// Steps are calculated from document slots: only an accepted document moves a step. Commission runs off the stepper.
// Steps, slots and tasks come from a country template (Malta v1 here); nothing below lists steps outside DF_TPL.

const DF_TODAY=new Date(2026,7,12); // the prototype's demo "today"
const DF_MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DF_FUND={cash:'Cash',loan:'Bank loan',mixed:'Mixed'};
const DF_UNDO_MS=10*60*1000;
const DF_COMM_RULE={rate:2,trigger:'deed',approver:'Rachel Mifsud'};
const DF_COMM_ST={estimated:'Estimated',pending:'Awaiting approval',changes:'Changes requested',agreed:'Agreed',earned:'Earned',payable:'Payable',part:'Part settled',settled:'Settled'};
const DF_TRIGGERS={deed:'Earned at final deed',pos:'Earned at POS'};
const DF_ROLES={internal:['Deal owner','Co-rep','Referrer'],external:['External agency','Referrer']};
const DF_UI={pop:null,menu:false};

const DF_TPL={id:'mt-v1',country:'MT',version:1,label:'Malta v1',effective:'1 Sep 2026',reviewed:'Local counsel · Sep 2026',
  steps:[
    {key:'agreement',label:()=>'POS signed',slots:()=>['pos','@dep','duty'],
      tasks:()=>[['Confirm funding type',1],['Confirm payment plan',1],['Book notary for searches',1],['Share deposit terms with buyer',1]]},
    {key:'funding',label:f=>f==='cash'?'Funds confirmed':'Loan approved',
      slots:f=>f==='cash'?['pof','sof','guarantee']:f==='loan'?['sanction','guarantee']:['sanction','pof','guarantee'],
      tasks:f=>f==='cash'?[['Request proof of funds',0],['Check the amount covers the balance',0],['Flag to manager if funds sit outside the EU',0]]
        :[['Confirm loan application submitted',0],['Chase bank before the financing deadline',0],['Send valuation access details to the bank’s architect',0],['Update buyer on status',0]]},
    {key:'pre_completion',label:()=>'Ready for deed',slots:()=>['searches','@pre','cert'],
      tasks:()=>[['Book the final deed appointment',0],['Send final balance statement to buyer',0]]},
    {key:'completion',label:()=>'Final deed appointment',slots:()=>['deed','@final','handover_form'],
      tasks:()=>[['Confirm attendees',0],['Send the buyer the what-to-bring list',0],['Send the welcome and warranty pack',0]]},
  ]};

const DF_SLOTS={
  pos:{label:'Promise of Sale (POS)',group:'Contract',signed:true,match:/promise of sale/i,chase:'notary',need:'Signed contract · needs manager approval',sample:'pos-signed.pdf',
    fields:o=>[['Document type','Signed promise of sale'],['Parties',`${o.lead} · ${dfDevCo(o)}`],['Unit',`${o.units[0]} · ${o.devs[0]}`],['Price',fmtEur(o.value*1000)]]},
  duty:{label:'Provisional duty receipt',group:'Contract',match:/provisional duty/i,chase:'notary',need:'Proof of the 1% provisional duty and POS registration',sample:'provisional-duty.pdf',
    fields:o=>[['Document type','Provisional duty receipt'],['Amount',fmtEur(Math.round(o.value*10))],['Unit',o.units[0]]]},
  sof:{label:'Source of funds declaration',group:'KYC',match:/source of funds/i,chase:'buyer',need:'Carried over from KYC if already verified',sample:'source-of-funds.pdf',
    fields:o=>[['Document type','Source of funds declaration'],['Declared by',o.lead]]},
  pof:{label:'Proof of funds',group:'KYC',match:/proof of funds/i,chase:'buyer',need:o=>`Must cover the ${fmtEur(dfFinalAmt(o))} balance`,sample:'statement-hsbc-aug.pdf',
    fields:o=>[['Document type','Proof of funds · bank statement'],['Account holder',o.lead],['Balance',`${fmtEur(Math.ceil(dfFinalAmt(o)*1.0886/100)*100)} on 11 Aug`],['Covers balance',`Yes · ${fmtEur(dfFinalAmt(o))} outstanding`]]},
  sanction:{label:'Bank sanction letter',group:'Contract',match:/sanction|bank offer/i,chase:'bank',need:'Amount, bank and date checked against the deal',sample:'bank-sanction-letter.pdf',
    fields:o=>[['Document type','Bank sanction letter'],['Bank',o.closed.bank&&!/tbc|—/i.test(o.closed.bank)?o.closed.bank:'Bank of Valletta'],['Amount',fmtEur(Math.round(o.value*800))],['Date','14 Aug 2026']]},
  guarantee:{label:'Bank guarantee',group:'Contract',chase:'bank',cond:df=>df.guarantee?null:'POS doesn’t require one'},
  searches:{label:'Notary searches report',group:'Contract',match:/searches/i,chase:'notary',need:'From the notary, confirming searches are clear',sample:'searches-report.pdf',
    fields:o=>[['Document type','Notary searches report'],['Issued by',dfNotary(o)+', Notary'],['Unit',`${o.units[0]} · ${o.devs[0]}`],['Result','Clear · no encumbrances'],['Date','12 Aug 2026']]},
  cert:{label:'Completion certificate',group:'Contract',chase:'developer',cond:(df,o)=>df.certRequired?null:`Deed isn’t tied to a construction milestone on ${o.devs[0]}`},
  deed:{label:'Signed final deed',group:'Contract',signed:true,match:/signed final deed|deed signed/i,chase:'notary',need:'Signed at the appointment',sample:'final-deed-signed.pdf',
    fields:o=>[['Document type','Signed final deed'],['Parties',`${o.lead} · ${dfDevCo(o)}`],['Unit',`${o.units[0]} · ${o.devs[0]}`],['Price',fmtEur(o.value*1000)],['Signed',dfState(o).appt.date||'Today']]},
  handover_form:{label:'Signed handover form',group:'Contract',optional:true,chase:'buyer',sample:'handover-form.pdf',
    cond:df=>df.handoverAtDeed?null:`Handover is a separate appointment${df.delivery?', '+df.delivery:''}`},
};
const DF_CHASE={buyer:o=>'Chase '+o.lead.split(' ')[0],notary:()=>'Chase notary',bank:()=>'Chase bank',developer:()=>'Chase developer'};

// ---------- small helpers ----------
function dfDevCo(o){return `${o.devs[0]} Developments`;}
function dfNotary(o){return dfState(o)?.appt?.notary||'Dr. Rachel Aquilina';}
function dfIsManager(){return typeof curPersona==='undefined'||curPersona!=='rep';}
function dfMe(){return (typeof PERSONAS!=='undefined'&&PERSONAS[curPersona]?.name)||'You';}
function dfParseDate(s){
  const m=String(s||'').match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*(?:\s+(\d{4}))?|([A-Za-z]{3})[a-z]*\s+(\d{1,2})(?:\s+(\d{4}))?/);
  if(!m) return null;
  const mon=DF_MON.indexOf((m[2]||m[4]).slice(0,1).toUpperCase()+(m[2]||m[4]).slice(1,3).toLowerCase());
  return mon<0?null:new Date(+(m[3]||m[6]||2026),mon,+(m[1]||m[5]));
}
function dfIn(s){
  const d=dfParseDate(s); if(!d) return '';
  const n=Math.round((d-DF_TODAY)/864e5);
  return n===0?'today':n>0?`in ${n} day${n===1?'':'s'}`:`${-n} day${n===-1?'':'s'} overdue`;
}
function dfFmtIso(iso){if(!iso) return ''; const d=new Date(iso+'T00:00'); return `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]} ${d.getDate()} ${DF_MON[d.getMonth()]}`;}
function dfEsc(s){return xesc(String(s??''));}

// ---------- payments → receipt slots ----------
function dfPayKind(p,i){
  if(/deed|final|completion/i.test(p.label)) return 'final';
  if(i===0||/deposit|reservation/i.test(p.label)) return 'dep';
  return 'pre';
}
function dfPayLabel(p,kind){
  if(kind==='dep') return 'Deposit receipt';
  if(kind==='final') return 'Final balance receipt';
  if(/on pos|konven/i.test(p.label)) return 'POS instalment receipt';
  return p.label.replace(/\s*\(.*?\)\s*/g,'').replace(/\s*payment$/i,'').trim()+' receipt';
}
function dfPayDocRx(p,kind){
  if(kind==='dep') return /deposit|reservation/i;
  if(kind==='final') return /final balance|final receipt/i;
  if(/on pos|konven/i.test(p.label)) return /pos instalment/i;
  const w=p.label.split(/[\s(—-]+/)[0];
  return w?new RegExp(w.replace(/[^a-z]/gi,''),'i'):null;
}
function dfPayments(o){
  const x=getExt(o);
  return (x.payments||[]).map((p,i)=>{dealReceipts(p);const kind=dfPayKind(p,i);return {p,kind,id:'pay:'+p.id,label:dfPayLabel(p,kind)};});
}
function dfPayById(o,id){return dfPayments(o).find(r=>r.id===id);}
function dfPayEvidence(p){
  const rs=dealReceipts(p).filter(r=>!r.voided);
  const sum=list=>Math.round(list.reduce((s,r)=>s+r.amount,0)*100)/100;
  return {rs,confirmed:sum(rs.filter(r=>r.documentIds?.length)),reported:sum(rs.filter(r=>!r.documentIds?.length))};
}
function dfPayState(p){
  const e=dfPayEvidence(p);
  if(e.confirmed>=p.amt-0.005) return 'accepted';
  if(e.reported>0) return 'reported';
  return e.confirmed>0?'partial':'empty';
}
function dfCash(o){
  let confirmed=0,reported=0,total=0;
  dfPayments(o).forEach(({p})=>{const e=dfPayEvidence(p);confirmed+=e.confirmed;reported+=e.reported;total+=p.amt;});
  return {confirmed:Math.round(confirmed*100)/100,reported:Math.round(reported*100)/100,total:total||o.value*1000};
}
function dfFinalAmt(o){const f=dfPayments(o).find(r=>r.kind==='final');return f?f.p.amt:Math.max(0,dfCash(o).total-dfCash(o).confirmed);}
function dfReceiver(o,r){const df=dfState(o);return df.receivedBy[r.p.id]||(r.kind==='final'||/on pos|konven/i.test(r.p.label)?`Notary · ${dfNotary(o)}`:'Developer');}

// ---------- deal state ----------
function dfGuessFunding(o,x){
  const t=(x.buyer?.type||'')+' '+(o.tags||[]).join(' ')+' '+(o.closed?.bank||'');
  return /cash|—/i.test(t)?'cash':'loan';
}
function dfState(o){
  const c=o&&o.closed; if(!c) return null;
  if(c.df) return c.df;
  const x=getExt(o), legacyStep=c.step||0;
  const df=c.df={v:1,template:DF_TPL.id,funding:dfGuessFunding(o,x),slots:{},proposals:[],tasks:{},extraTasks:[],
    appt:{state:'target',target:c.deed&&c.deed!=='TBC'?c.deed:null,postponed:0,notary:null},signed:false,completed:null,handover:null,
    handoverAtDeed:true,delivery:null,guarantee:false,certRequired:false,legacy:[],cur:0,undo:null,comm:null,receivedBy:{}};
  const kd=(x.keyDates||[]).find(k=>/delivery|handover/i.test(k.label));
  if(kd&&kd.value&&!/^\d{1,2}\s/.test(kd.value)){df.delivery=kd.value;df.handoverAtDeed=false;}
  if(DF_SEEDS[o.id]) DF_SEEDS[o.id](o,x,df); else dfSeedGeneric(o,x,df,legacyStep);
  if(!df.comm) df.comm=dfCommInit(o);
  if(DF_COMM_SEEDS[o.id]) DF_COMM_SEEDS[o.id](o,df);
  df.cur=dfProgress(o).cur; dfSync(o);
  return df;
}
// Register documents already filed in the closing room fill their slots; payment receipts pick up their proof.
function dfLinkRegister(o,x,df){
  const docs=ensureDocs(o,x);
  Object.entries(DF_SLOTS).forEach(([id,def])=>{
    if(!def.match||df.slots[id]) return;
    const doc=docs.find(d=>d.file&&def.match.test(d.label)&&['verified','signed','filed'].includes(d.status));
    if(doc) df.slots[id]={state:'accepted',docId:doc.id,file:doc.file.name,size:doc.file.size,at:doc.hist?.at(-1)?.t||'',via:'Carried over from Offer Progress',by:doc.hist?.at(-1)?.who||''};
  });
  dfPayments(o).forEach(r=>{
    if(dealReceived(r.p)<r.p.amt) return;
    const rx=dfPayDocRx(r.p,r.kind), doc=rx&&docs.find(d=>d.g==='Payments'&&d.file&&rx.test(d.label));
    if(doc) r.p.receipts.filter(rc=>!rc.voided&&!rc.documentIds?.length).forEach(rc=>{rc.documentIds=[doc.id];rc.date=rc.date||doc.hist?.at(-1)?.t||null;});
  });
}
// Deals that were past a step before this flow shipped keep it as Reported, never as Accepted without a document.
function dfSeedGeneric(o,x,df,legacyStep){
  dfLinkRegister(o,x,df);
  const done=!!o.completed||legacyStep>=4, n=done?3:Math.min(legacyStep,3);
  for(let i=0;i<n;i++){
    df.legacy.push(DF_TPL.steps[i].key);
    dfSlotsFor(o,i).forEach(id=>{if(!id.startsWith('pay:')&&dfSlotState(o,id)==='empty') df.slots[id]={state:'reported',legacy:true,note:'Recorded previously · date unknown'};});
  }
  if(done){
    df.legacy.push('completion'); df.signed=true; df.appt.state='held';
    if(dfSlotState(o,'deed')==='empty') df.slots.deed={state:'reported',legacy:true,note:'Recorded previously · date unknown'};
    df.completed={legacy:true,date:o.completed?.date||o.closed.deed,by:'Recorded before Bricly'};
  }
}
const DF_SEEDS={
  // Luca Camilleri · the design's worked example, with the prototype's contradictions fixed.
  'OPP-1002':(o,x,df)=>{
    df.funding='cash'; df.handoverAtDeed=false; df.delivery='Mar 2027'; df.appt.target='28 Nov'; df.appt.notary='Dr. Rachel Aquilina';
    dfLinkRegister(o,x,df);
    if(df.slots.pos) Object.assign(df.slots.pos,{note:'Manager approved — 12 Jul',by:'Rachel Mifsud'});
    if(df.slots.sof) Object.assign(df.slots.sof,{note:'Carried over from KYC — 11 Jun'});
    const duty=dfFileDoc(o,x,{label:'Provisional duty receipt',group:'Contract'},{name:'provisional-duty-CM9803.pdf',size:'96 KB'},'Filed at POS','12 Jul','filed');
    df.slots.duty={state:'accepted',docId:duty.id,file:duty.file.name,size:duty.file.size,at:'12 Jul',via:'Filed at POS',by:'You'};
    const docs=ensureDocs(o,x);
    if(!docs.some(d=>d.unmatched)) docs.push({id:'d-valnotes',g:'Other',label:'Valuation access notes',flow:'file',status:'filed',unmatched:true,src:'Forwarded by Matthew',file:{name:'valuation-access-notes.pdf',size:'240 KB'},hist:[{t:'12 Aug',who:'Matthew',act:'Forwarded by email'}]});
    const pays=dfPayments(o), shell=pays.find(r=>/shell/i.test(r.p.label)), dep=pays.find(r=>r.kind==='dep'), pos=pays.find(r=>/on pos/i.test(r.p.label));
    if(dep) df.receivedBy[dep.p.id]='Developer';
    if(pos) df.receivedBy[pos.p.id]='Notary · Dr. Aquilina';
    df.tasks={'funding:0':true};
    if(shell) df.extraTasks.push({id:'t-shell',step:'pre_completion',title:'Follow up Fri 15 Aug on shell-complete transfer',owner:'Bricly agent · from WhatsApp',done:false,payment:shell.p.id,note:'Luca said funds clear Friday'});
    df.proposals=[
      {id:'pr-pof',kind:'attach',slot:'pof',channel:'Email',time:'Today 08:41',title:'Bank statement for proof of funds',preview:'statement-hsbc-aug.pdf · €152,400 available on 11 Aug',from:'Luca Camilleri',conf:'high',file:{name:'statement-hsbc-aug.pdf',size:'640 KB'}},
      {id:'pr-photo',kind:'pick',channel:'WhatsApp',time:'Today 09:20',title:'Photo of a transfer receipt',preview:'IMG_2231.jpg · €70,000 · 15 Aug · ref LC-9803',from:'Matthew',conf:'low',amount:70000,file:{name:'IMG_2231.jpg',size:'1.2 MB'}},
      {id:'pr-invite',kind:'appt',channel:'Calendar',time:'Yesterday 17:12',title:'Final deed — Camilleri / La Lex',preview:'Fri 28 Nov, 10:00 · Notary’s office, Valletta',from:'Dr. Rachel Aquilina (notary)',conf:'high',appt:{date:'Fri 28 Nov',time:'10:00',place:'Notary’s office, Valletta'}},
    ];
  },
};
// Example splits: a co-rep (Luca), an external agency referral (Josef) and one waiting on approval (Andrew).
const DF_COMM_SEEDS={
  'OPP-1002':(o,df)=>{dfCommSet(df.comm,[['internal','Matthew','Deal owner',70],['internal','Sam','Co-rep',30]]);df.comm.approval={status:'approved',by:'Rachel Mifsud',at:'12 Jul',reasons:['2 people share it','Deal owner at 70%']};df.comm.note='Sam ran both appointments while Matthew was on leave.';},
  'OPP-1017':(o,df)=>{dfCommSet(df.comm,[['internal','Maria','Deal owner',50],['external','Christine Abela','External agency',50]]);df.comm.approval={status:'approved',by:'Rachel Mifsud',at:'20 Jul',reasons:['External agent included','Deal owner at 50%']};df.comm.note='Referred by Abela Estates · 50/50 on referred closings.';},
  'OPP-1013':(o,df)=>{dfCommSet(df.comm,[['internal','Sam','Deal owner',80],['internal','Sarah','Co-rep',20]]);df.comm.state='pending';df.comm.approval={status:'pending',reasons:['2 people share it','Deal owner at 80%']};df.comm.note='Sarah covered the POS signing.';df.comm.pendingSeed=true;},
};
function dfSlotsFor(o,i){
  const df=dfState(o), pays=dfPayments(o);
  return DF_TPL.steps[i].slots(df.funding).flatMap(s=>s[0]==='@'?pays.filter(r=>r.kind===s.slice(1)).map(r=>r.id):[s]);
}
function dfSlotStep(o,id){for(let i=0;i<4;i++) if(dfSlotsFor(o,i).includes(id)) return i; return -1;}
function dfSlotState(o,id){
  const df=dfState(o);
  if(id.startsWith('pay:')){
    const r=dfPayById(o,id); if(!r) return 'na';
    const s=dfPayState(r.p);
    return s!=='accepted'&&df.proposals.some(p=>p.slot===id)?'proposed':s;
  }
  const def=DF_SLOTS[id]; if(!def) return 'na';
  const na=def.cond&&def.cond(df,o); if(na) return 'na';
  const rec=df.slots[id]; if(rec&&rec.state) return rec.state;
  if(df.proposals.some(p=>p.slot===id)) return 'proposed';
  return def.optional?'optional':'empty';
}
function dfSlotInfo(o,id){
  const df=dfState(o), st=dfSlotState(o,id), step=dfSlotStep(o,id);
  if(id.startsWith('pay:')){
    const r=dfPayById(o,id), e=dfPayEvidence(r.p), docs=ensureDocs(o,getExt(o));
    const docId=e.rs.find(rc=>rc.documentIds?.length)?.documentIds[0], doc=docs.find(d=>d.id===docId);
    const remaining=Math.max(0,Math.round((r.p.amt-e.confirmed)*100)/100);
    return {id,label:r.label,group:'Payments',state:st,step,payment:r.p,kind:r.kind,doc,file:doc?.file?.name,size:doc?.file?.size,
      at:e.rs.find(rc=>rc.documentIds?.length)?.date||'',need:`${fmtEur(remaining)} · ${r.p.due}`,chase:DF_CHASE.buyer(o),sample:`receipt-${r.label.toLowerCase().replace(/[^a-z]+/g,'-')}${(o.units[0]||'').replace('#','')}.pdf`,
      fields:[['Document type','Payment receipt · bank transfer'],['Payer',o.lead],['Amount',fmtEur(remaining||r.p.amt)],['Date','15 Aug 2026'],['Instalment',r.p.label]]};
  }
  const def=DF_SLOTS[id], rec=df.slots[id]||{};
  const docs=ensureDocs(o,getExt(o)), doc=rec.docId?docs.find(d=>d.id===rec.docId):null;
  return {id,label:def.label,group:def.group,state:st,step,signed:!!def.signed,na:def.cond?def.cond(df,o):null,rec,doc,file:rec.file,size:rec.size,at:rec.at,
    need:typeof def.need==='function'?def.need(o):def.need,chase:DF_CHASE[def.chase||'buyer'](o),sample:def.sample||id+'.pdf',fields:def.fields?def.fields(o):[['Document type',def.label]]};
}
function dfProgress(o){
  const df=dfState(o);
  const steps=DF_TPL.steps.map((def,i)=>{
    const slots=dfSlotsFor(o,i);
    const req=slots.filter(id=>!['na','optional'].includes(dfSlotState(o,id)));
    const acc=req.filter(id=>['accepted','exception'].includes(dfSlotState(o,id))).length;
    const legacy=df.legacy.includes(def.key);
    const done=i===3?!!df.completed:(legacy||acc===req.length);
    return {i,key:def.key,label:def.label(df.funding),slots,req:req.length,acc,done,legacy};
  });
  let cur=steps.findIndex(s=>!s.done); if(cur<0) cur=4;
  return {steps,cur};
}
function dfSync(o){
  const df=o.closed.df; if(!df) return;
  const P=dfProgress(o);
  o.closed.step=df.completed?5:Math.min(P.cur,3);
  o.closed.comm=Math.round(df.comm.total/100)/10;
  o.closed.paid=df.comm.state==='settled';
  const a=df.appt;
  if(df.completed&&df.completed.date) o.closed.deed=df.completed.date.replace(/\s+\d{4}$/,'');
  else o.closed.deed=(a.state==='confirmed'||a.state==='held')&&a.date?a.date.replace(/^[A-Za-z]{3}\s+/,''):a.target||o.closed.deed;
}
function dfStatus(o){
  const df=dfState(o), P=dfProgress(o);
  if(df.completed) return ['Completed','ok'];
  if(Object.values(df.slots).some(s=>['expired','rejected','needs_revalidation'].includes(s.state))) return ['Needs attention','bad'];
  if(o.closed.stalled||df.appt.postponed>=2) return ['At risk','bad'];
  if(P.cur===0) return ['Waiting on POS documents','warn'];
  if(P.cur===1) return df.funding==='cash'?['Waiting on buyer','warn']:['Waiting on bank','warn'];
  if(P.cur===2){
    const s=P.steps[2], payMissing=s.slots.some(id=>id.startsWith('pay:')&&dfSlotState(o,id)!=='accepted');
    return payMissing?['Waiting on buyer','warn']:dfSlotState(o,'searches')!=='accepted'?['Waiting on notary','warn']:['On track','ok'];
  }
  if(P.cur===3) return df.appt.state==='target'?['Waiting on booking','warn']:['On track','ok'];
  return ['On track','ok'];
}

// ---------- register documents, feed, undo ----------
function dfFileDoc(o,x,info,file,via,when='Today',status){
  const docs=ensureDocs(o,x), def=DF_SLOTS[info.id];
  const st=status||(info.group==='KYC'?'verified':info.group==='Payments'?'filed':def?.signed?'signed':'filed');
  let doc=def?.match?docs.find(d=>def.match.test(d.label)):docs.find(d=>d.label===info.label);
  if(doc){if(doc.file){doc.versions=doc.versions||[];doc.versions.push(doc.file);} }
  else{doc={id:crypto.randomUUID(),g:info.group||'Contract',label:info.label,flow:info.group==='KYC'?'kyc':def?.signed?'sign':'file',hist:[]};docs.push(doc);}
  doc.file={...file}; doc.status=st; doc.hist.push({t:when,who:'You',act:st==='uploaded'?`Uploaded · ${via} · awaiting manager approval`:`Accepted · ${via}`});
  return doc;
}
function dfLog(o,text,by,extra={}){getExt(o).comms.unshift({ch:'sys',t:'Just now',text,by,df:true,...extra});}
function dfSnap(o){
  const x=getExt(o);
  return JSON.stringify({df:{...o.closed.df,undo:null},payments:x.payments||null,docs:x.docs||null,comms:x.comms.length,unit:UN(o.units[0])?.status??null,
    completed:o.completed||null,step:o.closed.step,paid:o.closed.paid,comm:o.closed.comm,deed:o.closed.deed});
}
function dfArmUndo(o,snap,label){const df=dfState(o);df.undo={id:Date.now(),at:Date.now(),snap,label,oppId:o.id};return df.undo.id;}
function dfCanUndo(o,id){const u=dfState(o).undo;return !!u&&u.id===id&&Date.now()-u.at<DF_UNDO_MS;}
function dfUndo(oppId){
  const o=oppId?OPPS.find(r=>r.id===oppId):dealCur&&dealOpp(dealCur); if(!o) return;
  const u=dfState(o).undo;
  if(!u||Date.now()-u.at>DF_UNDO_MS){showToast('The 10 minute undo window has passed. Ask a manager to reopen the step.');return;}
  const s=JSON.parse(u.snap), x=getExt(o);
  o.closed.df=s.df; x.payments=s.payments; x.docs=s.docs; x.comms.splice(0,x.comms.length-s.comms);
  if(s.unit&&UN(o.units[0])) UN(o.units[0]).status=s.unit;
  if(s.completed) o.completed=s.completed; else delete o.completed;
  Object.assign(o.closed,{step:s.step,paid:s.paid,comm:s.comm,deed:s.deed});
  dfLog(o,`Undone · ${u.label}`,'You · within 10 minutes');
  dfRefresh(); showToast(`Undone · ${u.label}`);
}
function dfToast(msg,undoOpp){
  let t=document.getElementById('briclyToast');
  if(!t){t=document.createElement('div');t.id='briclyToast';document.body.appendChild(t);}
  t.className='toast show df-toast'; t.setAttribute('role','status');
  t.innerHTML=`<span>${dfEsc(msg)}</span>${undoOpp?`<button type="button" class="df-toast-undo" onclick="dfUndo('${undoOpp}')">Undo</button>`:''}`;
  clearTimeout(t._tid); t._tid=setTimeout(()=>t.classList.remove('show'),undoOpp?7000:2800);
}
// The auto-advance rule: re-check after every slot change; steps complete in order and each move is logged.
function dfAfter(o,cause){
  const df=dfState(o), P=dfProgress(o), moved=[];
  if(P.cur>df.cur) for(let i=df.cur;i<Math.min(P.cur,3);i++){moved.push(P.steps[i].label);dfLog(o,`Step completed: ${P.steps[i].label}`,`Completed by ${cause} · rule`,{strong:true});}
  else if(P.cur<df.cur&&!df.completed) dfLog(o,`Back to step ${P.cur+1} · ${P.steps[P.cur].label}`,cause);
  df.cur=P.cur; dfSync(o);
  return {moved,P};
}
function dfRefresh(){
  if(dealCur&&document.getElementById('p-deal')?.classList.contains('on')) renderDeal();
  if(typeof renderDeals==='function') renderDeals();
  if(typeof pipeRenderAll==='function') pipeRenderAll();
  if(typeof apBadge==='function') apBadge();
}

// ---------- commission: sales team, split and payout ----------
function dfContact(name){return (typeof CONTACTS!=='undefined'?CONTACTS:[]).find(c=>c.name===name);}
function dfReps(){return [...new Set(OPPS.map(o=>o.rep).filter(n=>n&&/^[A-Z][a-z]+(?: [A-Z][a-z]+)?$/.test(n)&&n!=='Unassigned'&&n!=='Pending'))].sort();}
function dfAgents(){return (typeof CONTACTS!=='undefined'?CONTACTS:[]).filter(c=>c.type==='partner'&&/agen|refer|broker/i.test(c.btype||''));}
function dfShareAmt(comm,s){return Math.round(comm.total*(+s.pct||0))/100;}
function dfCommSet(comm,rows){comm.shares=rows.map(([kind,name,role,pct])=>({id:crypto.randomUUID(),kind,name,role,pct,paid:0,company:kind==='external'?dfContact(name)?.company||'':''}));}
function dfCommInit(o){
  const c=o.closed, total=Math.round((c.comm||o.value*0.02)*1000), rate=Math.round(total/(o.value*1000)*1000)/10||DF_COMM_RULE.rate;
  const comm={rate,total,trigger:DF_COMM_RULE.trigger,payer:dfDevCo(o),shares:[],state:'agreed',approval:{status:'not_needed'},disputed:null,note:''};
  dfCommSet(comm,[['internal',o.rep,'Deal owner',100]]);
  if(c.paid){comm.state='settled';comm.shares.forEach(s=>s.paid=dfShareAmt(comm,s));}
  else if(c.df&&c.df.completed) comm.state='earned';
  return comm;
}
function dfCommOwner(comm){return comm.shares.find(s=>s.role==='Deal owner');}
function dfCommNames(o){const df=o.closed&&dfState(o);return df?df.comm.shares.map(s=>s.name):[o.rep];}
function dfCommSummary(comm){return comm.shares.map(s=>`${s.name} ${s.pct}%`).join(' · ')+` · ${fmtEur(comm.total)} (${comm.rate}%)`;}
// Anything other than the workspace default (2%, 100% to the deal owner) needs a manager's approval.
function dfCommDeviation(comm){
  const r=[], owner=dfCommOwner(comm);
  if(+comm.rate!==DF_COMM_RULE.rate) r.push(`Rate ${comm.rate}% (default ${DF_COMM_RULE.rate}%)`);
  if(comm.trigger!==DF_COMM_RULE.trigger) r.push(`${DF_TRIGGERS[comm.trigger]} (default: at final deed)`);
  if(comm.shares.length>1) r.push(`${comm.shares.length} people share it`);
  if(comm.shares.some(s=>s.kind==='external')) r.push('External agent included');
  if(owner&&+owner.pct<100) r.push(`Deal owner at ${owner.pct}%`);
  return r;
}
function dfShareState(comm,s){
  const amt=dfShareAmt(comm,s);
  if(s.paid>=amt-0.005&&amt>0) return 'settled';
  if(s.paid>0) return 'part';
  return comm.state==='part'||comm.state==='settled'?'payable':comm.state;
}
function dfCommRequest(o,reasons){
  const comm=dfState(o).comm;
  comm.state='pending'; comm.approval={status:'pending',reasons:[...reasons]};
  if(typeof APPROVALS==='undefined') return null;
  APPROVALS.filter(r=>!r.decided&&r.type==='commission'&&r.opp===o.id).forEach(r=>Object.assign(r,{decided:'rejected',by:'System',decidedAt:'Just now',reason:'Superseded by a newer split'}));
  const now=new Date(), d=dealFor(o.id);
  const r={id:'REQ-'+(apSeq++),type:'commission',unit:o.units[0],buyer:o.lead,opp:o.id,deal:d?d.id:'',rep:o.rep,via:'App',
    filed:`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,age:0,note:comm.note||'',reasons:[...reasons]};
  APPROVALS.push(r); comm.approval.reqId=r.id;
  if(typeof apBadge==='function') apBadge();
  return r;
}
function dfCommOpenRequest(o){return typeof APPROVALS==='undefined'?null:APPROVALS.find(r=>!r.decided&&r.type==='commission'&&r.opp===o.id);}
// Approvals queue → deal. Called from apCommitDecision after its baseline restore, so edits and undo stay consistent.
function dfApplyCommissionDecision(r){
  const o=OPPS.find(q=>q.id===r.opp); if(!o||!o.closed) return;
  const comm=dfState(o).comm;
  if(r.decided==='approved'){
    comm.state=comm.trigger==='pos'||dfState(o).completed?'earned':'agreed';
    comm.approval={...comm.approval,status:'approved',by:r.by,at:'Today',reqId:r.id};
    dfLog(o,`Commission split approved · ${dfCommSummary(comm)}`,`${r.by} · approvals queue`);
  }else{
    comm.state='changes';
    comm.approval={...comm.approval,status:'rejected',by:r.by,at:'Today',reason:r.reason,reqId:r.id};
    dfLog(o,`Commission split sent back · ${r.reason||'No reason'}`,`${r.by} · approvals queue`);
  }
  dfSync(o);
  if(dealCur&&dealCur.oppId===o.id&&document.getElementById('p-deal')?.classList.contains('on')) setTimeout(renderDeal);
}
function dfApTerms(r){
  const o=OPPS.find(q=>q.id===r.opp), comm=o&&dfState(o).comm;
  return comm?`${fmtEur(comm.total)} · ${comm.shares.map(s=>`${s.name.split(' ')[0]} ${s.pct}%`).join(' / ')}`:'Commission split';
}
function dfApDetail(r){
  const o=OPPS.find(q=>q.id===r.opp); if(!o) return '';
  const comm=dfState(o).comm, can=typeof apCanDecide!=='function'||apCanDecide();
  return `<div class="dcard apq-d">
    <div class="apq-d-head">
      <div><div class="apq-d-meta"><span class="apq-tag price">Commission split</span>${r.id} · Filed ${r.filed} by ${dfEsc(r.rep)} via ${r.via}</div>
        <h2 class="apq-d-title">Commission split on ${dfEsc(r.deal||o.id)} · ${dfEsc(o.lead)}</h2>
        <div class="apq-d-sub">${r.decided?apDecisionLine(r):'Differs from the default rule, so it needs a manager before it counts as Agreed.'}</div></div>
      ${r.decided?`<div class="apq-d-acts"><button class="btn-ghost" onclick="apEditDecision('${r.id}')" ${can?'':'disabled'}>Edit decision</button></div>`
        :`<div class="apq-d-acts"><button class="btn-ghost" onclick="apRejectOpen('${r.id}')" ${can?'':'disabled'}>Reject</button><button class="btn-primary" onclick="apApprove('${r.id}')" ${can?'':'disabled'}>Approve</button></div>`}
    </div>
    <div class="apq-sec"><h3>Split</h3>
      <div class="df-ap-shares">${comm.shares.map(s=>`<div class="df-ap-share"><span class="df-av ${s.kind}">${initials(s.name)}</span><span><b>${dfEsc(s.name)}</b><span class="df-mu"> · ${dfEsc(s.role)}${s.company?' · '+dfEsc(s.company):''}</span></span><span>${s.pct}%</span><b>${fmtEur(dfShareAmt(comm,s))}</b></div>`).join('')}</div>
      <div class="apq-kv">
        <div><div class="k">Total</div><div class="v">${fmtEur(comm.total)} · ${comm.rate}% of ${fmtEur(o.value*1000)}</div></div>
        <div><div class="k">Earned</div><div class="v">${DF_TRIGGERS[comm.trigger]}</div></div>
        <div><div class="k">Paid by</div><div class="v">${dfEsc(comm.payer)}</div></div>
        <div><div class="k">Unit</div><div class="v">${dfEsc(o.units[0])} · ${dfEsc(o.devs[0])}</div></div>
      </div>
      <div class="apq-kv-note"><div class="k">Why it needs approval</div><div class="v">${(r.reasons||[]).map(dfEsc).join(' · ')||'Differs from the default'}</div></div>
      ${r.note?`<div class="apq-kv-note"><div class="k">Note from ${dfEsc(r.rep.split(' ')[0])}</div><div class="v">${dfEsc(r.note)}</div></div>`:''}
    </div>
    <div class="apq-sec"><h3>Effect</h3><div class="apq-ctx-v">Commission → <b>${r.decided==='rejected'?'Changes requested':'Agreed'}</b></div><div class="apq-ctx-s">Commission runs off the stepper. Approving or rejecting never moves the buyer’s deal. <a onclick="openDeal('${r.deal}')">Open the deal</a></div></div>
  </div>`;
}

// ---------- deal page ----------
const DF_CHIP={accepted:['Accepted','acc'],empty:['Required','req'],proposed:['Proposed','prop'],awaiting:['Awaiting approval','warn'],reported:['Reported','warn'],
  partial:['Part paid','warn'],na:['Not applicable','na'],optional:['Optional','na'],exception:['Exception approved','info'],rejected:['Rejected','bad'],expired:['Expired','bad']};
function dfChip(st){const c=DF_CHIP[st]||[st,'req'];return `<span class="df-chip df-c-${c[1]}">${c[0]}</span>`;}
const DF_CHECK='<svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5"/></svg>';
function dfO(){return dealCur?dealOpp(dealCur):null;}

window.renderDeal=function(){
  const d=dealCur; if(!d) return;
  const o=dealOpp(d), x=getExt(o), df=dfState(o), P=dfProgress(o), st=dfStatus(o);
  const tabs=[['overview','Overview'],['payments','Payments'],['deed','Deed appointment'],['documents','Documents'],['activity','Activity']];
  document.getElementById('deal-root').innerHTML=`
  <div class="crm-page-heading df-head">
    <div class="page-title">${dfEsc(o.lead)}</div>
    <div class="page-sub df-sub">${dfEsc(o.devs[0])} · ${dfEsc(o.units[0]||'')} · ${d.id}
      <button type="button" class="df-fund-chip" onclick="dfFundingOpen()" title="Change funding type" aria-label="Funding type ${DF_FUND[df.funding]}. Change">${DF_FUND[df.funding]} <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button></div>
  </div>
  <div class="df-bar">
    <nav class="df-tabs" aria-label="Deal sections">${tabs.map(([k,l],i)=>`<button type="button" class="df-tab ${i===0?'on':''}" onclick="dfJump('${k}',this)">${l}</button>`).join('')}</nav>
    <div class="df-bar-r"><span class="df-pill ${st[1]}" id="df-status">${st[0]}</span>
      <div class="df-menu-wrap"><button type="button" class="btn-primary df-actions" aria-haspopup="menu" aria-expanded="${DF_UI.menu}" onclick="dfMenuToggle(event)">Actions <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button>${DF_UI.menu?dfMenuHtml(o):''}</div></div>
  </div>
  <div class="dcard df-hero" id="oj-hero">
    <span id="df-sec-overview"></span>
    ${dfTilesHtml(o)}
    <div class="df-stepper" role="list">${P.steps.map(s=>dfStepHtml(o,s,P)).join('')}${DF_UI.pop!==null?dfPopHtml(o,P.steps[DF_UI.pop],P):''}</div>
  </div>
  ${dfSuggestionsHtml(o)}
  <div class="opp-grid df-grid">
    <div>${dfNextHtml(o)}${dfPaymentsHtml(o)}${dfDeedHtml(o)}${dfRegisterHtml(o)}${dfActivityHtml(o)}</div>
    <div>${dfRailHtml(o,x,d)}</div>
  </div>`;
};
function dfJump(k,btn){
  document.querySelectorAll('.df-tab').forEach(b=>b.classList.toggle('on',b===btn));
  document.getElementById('df-sec-'+k)?.scrollIntoView({behavior:'smooth',block:'start'});
}
function dfTilesHtml(o){
  const df=dfState(o), cash=dfCash(o), comm=df.comm, a=df.appt, booked=a.state==='confirmed'||a.state==='held';
  const deedV=df.completed?(df.completed.date||'—'):booked?`${a.date.replace(/^[A-Za-z]{3}\s+/,'')}, ${a.time}`:a.state==='tentative'?`${a.date.replace(/^[A-Za-z]{3}\s+/,'')} (tentative)`:a.target?`Target ${a.target}`:'Not set';
  const deedS=df.completed?'Signed':booked?`Booked · ${dfIn(a.date)}`:a.state==='tentative'?'Tentative · not scheduled':a.target?'From the POS · not booked':'Add a target date';
  const others=comm.shares.length-1, owner=dfCommOwner(comm);
  return `<div class="df-tiles">
    <div class="df-tile"><div class="k">Cash collected</div><div class="v">${fmtEur(cash.confirmed)}</div><div class="d">${fmtEur(Math.max(0,cash.total-cash.confirmed))} outstanding</div>${cash.reported?`<div class="d df-rep">+ ${fmtEur(cash.reported)} reported</div>`:''}</div>
    <div class="df-tile"><div class="k">Sale price</div><div class="v">${fmtEur(o.value*1000)}</div><div class="d">${dfEsc(o.units[0])} · ${dfEsc(o.devs[0])}</div></div>
    <div class="df-tile"><div class="k">${df.completed||booked?'Deed':'Expected deed'}</div><div class="v">${dfEsc(deedV)}</div><div class="d">${deedS}</div></div>
    <button type="button" class="df-tile df-tile-btn" onclick="dfJumpComm()"><div class="k">Commission</div><div class="v">${fmtEur(comm.total)}</div><div class="d">${DF_COMM_ST[comm.state]}${comm.state==='agreed'?' · not yet earned':''}${comm.disputed?' · disputed':''}</div><div class="d">${dfEsc(owner?.name||o.rep)}${others>0?` +${others}`:''}</div></button>
  </div>`;
}
function dfJumpComm(){document.getElementById('df-sec-commission')?.scrollIntoView({behavior:'smooth',block:'center'});}
function dfStepHtml(o,s,P){
  const df=dfState(o), done=s.done&&s.i<P.cur, cur=s.i===P.cur;
  const a=df.appt, date=s.i===3?(df.completed?`Signed ${df.completed.date||''}`:a.state==='confirmed'||a.state==='held'?`${a.date}, ${a.time}`:a.target?`Target ${a.target}`:''):'';
  const count=s.legacy&&s.acc<s.req?'Recorded before documents were required':`${s.acc} of ${s.req} document${s.req===1?'':'s'}`;
  return `<button type="button" role="listitem" class="df-step ${done?'done':cur?'cur':''}" onclick="dfPop(${s.i})" aria-expanded="${DF_UI.pop===s.i}" aria-label="Step ${s.i+1}, ${s.label}. ${done?'Complete':cur?'Current':'Not started'}. ${count}">
    <span class="df-step-bar"></span>
    <span class="df-step-l">${s.i+1}. ${dfEsc(s.label)}${cur?' <span class="df-cur">Current</span>':''}</span>
    <span class="df-step-s">${date?dfEsc(date)+' · ':''}${count}</span>
  </button>`;
}
function dfPop(i){DF_UI.pop=DF_UI.pop===i?null:i;renderDeal();}
function dfPopHtml(o,s,P){
  const sub=s.done&&s.i<P.cur?'Complete':s.i===P.cur?`Current · ${s.acc} of ${s.req} documents`:`Not started · ${s.acc} of ${s.req} documents, can arrive early`;
  return `<div class="df-pop" style="left:clamp(0px, calc(${s.i*25}% + 4px), calc(100% - 400px))" role="dialog" aria-label="${dfEsc(s.label)} checklist">
    <div class="row-between"><div><b>${s.i+1}. ${dfEsc(s.label)}</b><div class="df-mu">${sub}</div></div><button type="button" class="tool" aria-label="Close" onclick="dfPop(${s.i})">${sbIcon('x')}</button></div>
    <div class="df-eyebrow">Required documents</div>
    ${s.slots.map(id=>dfSlotRow(o,id,true)).join('')}
    <div class="df-eyebrow">Tasks · never block</div>
    ${dfTasks(o,s.i).map(t=>dfTaskRow(o,t)).join('')}
  </div>`;
}
function dfTasks(o,i){
  const df=dfState(o), def=DF_TPL.steps[i], doneStep=df.legacy.includes(def.key)||!!df.completed;
  const list=def.tasks(df.funding).map(([title,dflt],j)=>{
    const key=`${def.key}:${j}`; let done=df.tasks[key]??(!!dflt||doneStep);
    if(def.key==='pre_completion'&&j===0) done=df.appt.state!=='target';
    return {key,title,owner:o.rep,done};
  });
  df.extraTasks.filter(t=>t.step===def.key).forEach(t=>{
    const paid=t.payment&&dfPayments(o).find(r=>r.p.id===t.payment&&dfPayState(r.p)==='accepted');
    list.push({key:'x:'+t.id,title:t.title,owner:t.owner,done:t.done||!!paid});
  });
  return list;
}
function dfTaskRow(o,t){
  return `<label class="df-task ${t.done?'done':''}"><input type="checkbox" ${t.done?'checked':''} onchange="dfTaskToggle('${t.key}',this.checked)"><span>${dfEsc(t.title)}</span><span class="df-mu">${dfEsc(t.owner)}</span></label>`;
}
function dfTaskToggle(key,on){
  const o=dfO(), df=dfState(o);
  if(key.startsWith('x:')){const t=df.extraTasks.find(e=>'x:'+e.id===key);if(t)t.done=on;}else df.tasks[key]=on;
  renderDeal();
}
// One row per document slot · used by the next-step card, the step popover and the register.
function dfSlotRow(o,id,compact=false,showStep=false,register=false){
  const s=dfSlotInfo(o,id), st=s.state, isMgr=dfIsManager();
  const prop=dfState(o).proposals.find(p=>p.slot===id);
  let meta=s.need||'No file yet';
  if(st==='accepted') meta=`${s.file||'On file'}${s.size?' · '+s.size:''} · ${s.rec?.note||('Accepted'+(s.at?' — '+s.at:''))}`;
  else if(st==='na'||st==='optional'&&s.na) meta=s.na;
  else if(st==='optional') meta='Optional · doesn’t block the step';
  else if(st==='proposed') meta=`Found by Bricly${prop?' in '+prop.channel.toLowerCase():''} · confirm to accept`;
  else if(st==='awaiting') meta=`${s.file} · waiting on manager approval`;
  else if(st==='reported') meta=s.rec?.note||'Reported, receipt missing';
  else if(st==='partial') meta=`Part received · ${s.need}`;
  const canView=st==='accepted'||st==='awaiting'||st==='exception'&&s.file, canUpload=['empty','reported','partial','optional'].includes(st);
  const open=canView?`dfViewerOpen('${id}')`:canUpload?`dfUploadOpen('${id}')`:'';
  let acts='';
  if(register) acts=canUpload?`<button type="button" class="btn-ghost df-sm" onclick="dfUploadOpen('${id}')">Upload</button>`:canView?`<button type="button" class="btn-ghost df-sm" onclick="dfViewerOpen('${id}')">View</button>`:'';
  else if(st==='accepted') acts=`<button type="button" class="btn-ghost df-sm" onclick="dfViewerOpen('${id}')">View</button>`;
  else if(st==='proposed'&&prop) acts=prop.kind==='attach'?`<button type="button" class="btn-primary df-sm" onclick="dfProposalConfirm('${prop.id}')">Confirm proposal</button>`:`<button type="button" class="btn-ghost df-sm" onclick="dfJump('overview')">See suggestion</button>`;
  else if(st==='awaiting') acts=isMgr?`<button type="button" class="btn-primary df-sm" onclick="${id==='deed'?'dfCompleteOpen()':`dfApproveSigned('${id}')`}">${id==='deed'?'Review &amp; complete sale':'Review &amp; approve'}</button>`:`<span class="df-mu">Waiting on manager</span>`;
  else if(['empty','reported','partial','optional'].includes(st)) acts=`<button type="button" class="btn-ghost df-sm" onclick="dfUploadOpen('${id}')">Upload</button>${compact||st==='optional'?'':`<button type="button" class="btn-ghost df-sm" onclick="dfChase('${id}')">${dfEsc(s.chase)}</button>`}`;
  return `<div class="df-slot df-s-${st}${compact?' compact':''}" data-slot="${id}">
    <span class="df-box">${st==='accepted'?DF_CHECK:''}</span>
    <div class="df-slot-b${open?' df-click':''}"${open?` onclick="${open}"`:''}><div class="df-slot-l">${dfEsc(s.label)}${showStep?` <span class="df-tag">${s.step>=0?'Step '+(s.step+1):'KYC'}</span>`:''}</div><div class="df-mu">${dfEsc(meta)}</div></div>
    ${dfChip(st)}<div class="df-slot-a">${acts}</div>
  </div>`;
}
// ---------- "Bricly found" strip · shared by the deal page and the opportunity page ----------
const DF_SUGG_CH={Email:['E','#6a5a9c'],WhatsApp:['W','#3f7d5a'],Calendar:['C','#b58a3a'],SMS:['S','#5a7d8c'],Bricly:['✦','#657A32']};
// p: {channel,time,conf,title,preview,from,target,acts} · acts is ready-made button HTML.
function dfSuggCard(p){
  const ch=DF_SUGG_CH[p.channel]||['B','#6D6D62'];
  return `<article class="df-card">
    <div class="df-card-top"><span class="df-ch" style="background:${ch[1]}" aria-hidden="true">${ch[0]}</span><span class="df-mu">${dfEsc(p.channel==='Bricly'?'Bricly':p.channel)} · ${dfEsc(p.time)}</span><span class="df-conf ${p.conf}">${p.conf==='low'?'Low':'High'} confidence</span></div>
    <div class="df-card-t">${dfEsc(p.title)}</div>
    ${p.preview?`<div class="df-mu df-card-p">${dfEsc(p.preview)}</div>`:''}${p.from?`<div class="df-mu">${dfEsc(p.from)}</div>`:''}
    <div class="df-target">${dfEsc(p.target)}</div>
    <div class="df-card-a">${p.acts}</div>
  </article>`;
}
function dfSuggStrip(trackId,label,cards){
  if(!cards.length) return '';
  const slider=cards.length>=3;
  return `<section class="df-sugg" aria-label="Bricly suggestions">
    <div class="row-between df-sugg-h"><span class="df-mu">✦ Bricly found ${cards.length} update${cards.length===1?'':'s'} for this ${label} · newest first</span>${slider?`<span class="df-slide"><button type="button" class="tool" aria-label="Previous" onclick="dfSlide(-1,'${trackId}')">‹</button><button type="button" class="tool" aria-label="Next" onclick="dfSlide(1,'${trackId}')">›</button></span>`:''}</div>
    <div class="df-sugg-track ${slider?'slider':''}" id="${trackId}">${cards.join('')}</div>
  </section>`;
}
function dfSlide(dir,id='df-sugg-track'){const t=document.getElementById(id);if(t)t.scrollBy({left:dir*t.clientWidth*0.8,behavior:'smooth'});}
function dfSuggestionsHtml(o){
  const df=dfState(o); if(df.completed) return '';
  const list=df.proposals.filter(p=>!p.slot||dfSlotState(o,p.slot)==='proposed'||p.kind!=='attach');
  return dfSuggStrip('df-sugg-track','deal',list.map(p=>dfProposalCard(o,p)));
}
function dfProposalCard(o,p){
  let target='', acts='';
  if(p.kind==='attach'){const s=dfSlotInfo(o,p.slot);target=`Attach to ${s.label} · Step ${s.step+1}`;acts=`<button type="button" class="btn-primary df-sm" onclick="dfProposalConfirm('${p.id}')">Confirm</button>`;}
  else if(p.kind==='pick'){
    target='Low confidence. Which instalment is this for?';
    acts=dfPayments(o).filter(r=>dfPayState(r.p)!=='accepted').map(r=>`<button type="button" class="btn-ghost df-sm" onclick="dfProposalPick('${p.id}','${r.id}')">${dfEsc(r.p.label.replace(/\s*\(.*?\)/,''))}</button>`).join('');
  }else if(p.kind==='appt'){target='Set as final deed appointment';acts=`<button type="button" class="btn-primary df-sm" onclick="dfProposalConfirm('${p.id}')">Confirm</button>`;}
  acts+=`<button type="button" class="btn-ghost df-sm" onclick="dfProposalDismiss('${p.id}')">Dismiss</button><button type="button" class="df-link" onclick="showToast('Opens the original ${p.channel.toLowerCase()} from ${dfEsc(p.from).replace(/'/g,'')}')">View source</button>`;
  return dfSuggCard({...p,from:'From '+p.from,target,acts});
}
function dfNextHtml(o){
  const df=dfState(o), P=dfProgress(o);
  if(df.completed){
    const cash=dfCash(o), comm=df.comm, d=dealFor(o.id), x=getExt(o), first=o.lead.split(' ')[0], out=Math.max(0,cash.total-cash.confirmed);
    const receipts=dfPayments(o).reduce((n,r)=>n+dealReceipts(r.p).filter(rc=>!rc.voided&&rc.documentIds?.length).length,0);
    const pos=dfParseDate(d?.pos), end=dfParseDate(df.completed.date), days=pos&&end?Math.round((end-pos)/864e5):null;
    const by=df.completed.legacy?df.completed.by:`Approved by ${df.completed.by}`;
    const ct=dfContact(o.lead), owner=ct?`openContact('${ct.id}')`:`showToast('Opens ${dfEsc(o.lead)} · owner of ${dfEsc(o.units[0])}')`;
    const after=[
      ['Handover',df.handover?`Recorded ${df.handover.at} · ${df.handover.keys} keys, ${df.handover.fobs} fobs`:df.handoverAtDeed?'At the deed appointment · keys, meters, photos':`Separate appointment${df.delivery?' · delivery '+df.delivery:''} · keys, meters, photos`,df.handover?['Recorded',1]:['Booked',0],df.handover?'':['Record handover','dfHandoverOpen()']],
      ['Welcome & warranty pack',df.welcomeSent?`Sent ${df.welcomeSent.at} · ${df.welcomeSent.by}`:`Drafted from the ${o.devs[0]} template`,df.welcomeSent?['Sent',1]:['Draft ready',0],df.welcomeSent?'':['Review & send','dfWelcomeSend()']],
      [`Commission · ${fmtEur(comm.total)}`,comm.state==='earned'?`Earned at deed · finance invoices ${o.devs[0]}`:DF_COMM_ST[comm.state],[DF_COMM_ST[comm.state],['earned','payable','part','settled'].includes(comm.state)?1:0],['View','dfJumpComm()']],
      ['Owner record',`${o.lead} · owner of ${o.units[0]} · after-sales requests land here`,['Created',1],['Open',owner]],
    ];
    return `<div class="dcard df-next df-won">
      <div class="row-between"><div><div class="df-eyebrow">Won · closed ${dfEsc(df.completed.date||'')}</div><h3 class="df-next-t">Sale completed</h3></div><span class="df-mu">4 of 4 steps</span></div>
      <p class="df-mu" style="margin:0 0 12px">Deed signed${out<=0?' and final balance received':''}. Unit ${dfEsc(o.units[0])} moved to Sold and ${dfEsc(first)} is now an owner. The deal is read-only; the items below run on after the sale.</p>
      <div class="df-won-kv">
        <div><div class="k">Completed</div><div class="v">${dfEsc(df.completed.date||'—')}</div><div class="df-mu">${dfEsc(by)}</div></div>
        <div><div class="k">Final price</div><div class="v">${fmtEur(o.value*1000)}</div><div class="df-mu">${x.bids?.length?`${x.bids.length} offer round${x.bids.length===1?'':'s'}`:'—'}</div></div>
        <div><div class="k">Collected</div><div class="v">${fmtEur(cash.confirmed)}</div><div class="df-mu">${receipts} receipt${receipts===1?'':'s'} · ${fmtEur(out)} outstanding</div></div>
        <div><div class="k">POS to deed</div><div class="v">${days!==null?days+' days':'—'}</div><div class="df-mu">${dfEsc(d?.pos||'—')} → ${dfEsc((df.completed.date||'—').replace(/\s+\d{4}$/,''))}</div></div>
      </div>
      <div class="df-eyebrow">After the sale · never reopens the deal</div>
      ${after.map(([l,sub,[chip,ok],act])=>`<div class="df-after"><span class="df-dot ${ok?'on':''}"></span><div><div>${dfEsc(l)}</div><div class="df-mu">${dfEsc(sub)}</div></div><span class="df-chip ${ok?'df-c-ok':'df-c-req'}">${dfEsc(chip)}</span>${act?`<button type="button" class="btn-ghost df-sm" onclick="${act[1]}">${dfEsc(act[0])}</button>`:'<span></span>'}</div>`).join('')}
      <div class="df-acts" style="margin-top:12px"><button type="button" class="btn-ghost df-sm" onclick="dfDownloadDealFile()">Download deal file</button><button type="button" class="btn-ghost df-sm" onclick="${owner}">Open owner record</button></div>
    </div>`;
  }
  const s=P.steps[P.cur]; let body='';
  if(P.cur===3&&!df.signed){
    const a=df.appt;
    body=a.state==='confirmed'
      ?`<div class="df-lead"><div><b>Deed appointment · ${dfEsc(a.date)}, ${dfEsc(a.time)}</b><div class="df-mu">${dfEsc(a.place)} · ${dfIn(a.date)}. The appointment doesn’t complete the step.</div></div><button type="button" class="btn-primary df-sm" onclick="dfOutcomeOpen()">Record outcome</button></div>`
      :`<div class="df-lead"><div><b>Book the final deed appointment</b><div class="df-mu">${a.state==='tentative'?`Tentative ${dfEsc(a.date)} · confirm with the notary.`:`Nothing booked yet${a.target?' · target '+dfEsc(a.target):''}.`} Signed deed and final balance receipt open after signing.</div></div><button type="button" class="btn-primary df-sm" onclick="dfBookOpen()">${a.state==='tentative'?'Confirm booking':'Book appointment'}</button></div>`;
  }else body=s.slots.map(id=>dfSlotRow(o,id)).join('');
  return `<div class="dcard df-next" id="df-next">
    <div class="row-between"><div><div class="df-eyebrow">Next step · Step ${s.i+1} of 4</div><h3 class="df-next-t">${dfEsc(s.label)}</h3></div><span class="df-mu">${s.acc} of ${s.req} documents</span></div>
    ${body}
    <div class="df-eyebrow">Tasks · help the team, never block the step</div>
    ${dfTasks(o,s.i).map(t=>dfTaskRow(o,t)).join('')}
  </div>`;
}
function dfPaymentsHtml(o){
  const rows=dfPayments(o), x=getExt(o), df=dfState(o);
  if(!rows.length) return `<div class="dcard" id="df-sec-payments"><h3>Payment schedule</h3><div class="col-empty">No payment plan recorded yet — milestones are added from the POS.</div></div>`;
  const cash=dfCash(o), out=Math.max(0,cash.total-cash.confirmed);
  return `<div class="dcard" id="df-sec-payments">
    <div class="row-between"><h3 style="margin:0">Payment schedule</h3>${out<=0?'<span class="pill p-res">fully paid · '+fmtEur(cash.total)+'</span>':`<span class="dr-owed">${fmtEur(out)} outstanding</span>`}</div>
    <div class="progress" style="margin:10px 0 12px"><span style="width:${Math.min(100,Math.round(cash.confirmed/cash.total*100))}%"></span></div>
    ${rows.map(r=>{
      const p=r.p, received=dealReceived(p), state=dealPaymentStatus(p), ev=dfPayState(p), receipts=dealReceipts(p).filter(rc=>!rc.voided);
      const pending=receipts.some(rc=>!rc.documentIds?.length), step=dfSlotStep(o,r.id);
      const pill=ev==='accepted'?['paid','p-res']:pending?['Reported','p-hold']:state==='overdue'?['overdue','p-bad']:state==='partial'?['Partially paid','p-hold']:['upcoming','p-avail'];
      const note=pending?(state==='partial'?'Partially paid · receipt missing':'Reported, receipt missing'):ev==='accepted'?`Receipt accepted · ${dfSlotInfo(o,r.id).file||''}`:'';
      const tasks=df.extraTasks.filter(t=>t.payment===p.id&&!t.done&&ev!=='accepted');
      return `<div class="deal-payment" data-payment-id="${p.id}">
        <div><strong>${dfEsc(p.label)}</strong><div class="deal-muted">${dfEsc(p.due)} · ${fmtEur(p.amt)} scheduled</div><div class="deal-muted">Received by ${dfEsc(dfReceiver(o,r))}${step>=0?` · feeds step ${step+1}`:''}</div></div>
        <div><strong>${(()=>{const e=dfPayEvidence(p);return e.confirmed||!e.reported?fmtEur(e.confirmed)+' received'+(e.reported?' · '+fmtEur(e.reported)+' reported':''):fmtEur(e.reported)+' reported';})()}</strong><div class="deal-muted">${fmtEur(Math.max(0,p.amt-dfPayEvidence(p).confirmed))} remaining</div></div>
        <div class="deal-payment-state"><span class="pill ${pill[1]}">${pill[0]}</span>${note?`<span class="deal-muted">${dfEsc(note)}</span>`:''}${tasks.map(t=>`<span class="deal-muted">Task: ${dfEsc(t.title.replace(/ on .*$/,''))}${t.note?' · '+dfEsc(t.note):''}</span>`).join('')}</div>
        <div class="deal-payment-actions">${received<p.amt?`<button class="btn-ghost" onclick="dfReceiptOpen('${r.id}')">${sbIcon('pay')}Record payment</button>`:''}${ev!=='accepted'?`<button class="btn-ghost" onclick="dfUploadOpen('${r.id}')">${sbIcon('doc')}Add receipt</button>`:''}${receipts.length?`<button class="btn-ghost" onclick="dealEventOpen('${o.id}','receipts','${p.id}')">${sbIcon('doc')}${pending?'Add proof / receipts':'View receipts'}</button>`:''}</div>
      </div>`;
    }).join('')}
    <div class="df-mu" style="margin-top:8px">“Paid” shows only once a receipt is accepted. Reported payments don’t count towards cash collected or move a step.</div>
  </div>`;
}
function dfAttendees(o){
  const df=dfState(o), a=df.appt, conf=a.state==='confirmed'||a.state==='held';
  const list=[[o.lead,'Buyer'],[dfNotary(o),'Notary']];
  if(df.funding!=='cash') list.push([o.closed.bank&&!/tbc|—/i.test(o.closed.bank)?o.closed.bank+' representative':'Bank representative','Bank']);
  list.push(['Joseph Vella','Developer rep'],[dfCommOwner(df.comm)?.name||o.rep,'Deal owner']);
  return list.map(([name,role],i)=>({name,role,rsvp:a.state==='target'?'To invite':conf&&role!=='Developer rep'?'Accepted':'Pending'}));
}
function dfDeedHtml(o){
  const df=dfState(o), a=df.appt, P=dfProgress(o);
  const stt=df.completed?['Completed','ok']:df.signed?['Outcome: signed','info']:a.state==='confirmed'?['Confirmed','ok']:a.state==='tentative'?['Tentative','warn']:['Target only','neu'];
  const line=df.completed?`Signed ${dfEsc(df.completed.date||'')} · ${dfEsc(dfNotary(o))}`:df.signed||a.state==='confirmed'?`${dfEsc(a.date)}, ${dfEsc(a.time)} · ${dfEsc(a.place)} · ${dfIn(a.date)}`:a.state==='tentative'?`Proposed ${dfEsc(a.date)}, ${dfEsc(a.time)} · awaiting notary confirmation`:`${a.target?'Target deed '+dfEsc(a.target)+' from the POS':'No target date'} · not booked`;
  const s3=P.steps[2], missing3=s3.slots.filter(id=>!['accepted','na','optional','exception'].includes(dfSlotState(o,id))).map(id=>dfSlotInfo(o,id).label.toLowerCase());
  const dot=ok=>`<span class="df-dot ${ok?'on':''}"></span>`;
  const acts=df.completed?(df.handover?'':`<button type="button" class="btn-ghost" onclick="dfHandoverOpen()">Record handover</button>`)
    :df.signed?`<button type="button" class="btn-ghost" onclick="dfUploadOpen('deed')">Upload deed</button>`
    :a.state==='confirmed'?`<button type="button" class="btn-primary" onclick="dfOutcomeOpen()">Record outcome</button><button type="button" class="btn-ghost" onclick="dfBookOpen()">Reschedule</button><button type="button" class="btn-ghost" onclick="dfReminder()">Send reminder</button>`
    :`<button type="button" class="btn-primary" onclick="dfBookOpen()">${a.state==='tentative'?'Confirm booking':'Book appointment'}</button>`;
  const fin=dfPayments(o).find(r=>r.kind==='final');
  return `<div class="dcard" id="df-sec-deed">
    <div class="row-between"><h3 style="margin:0">Final deed appointment</h3><span class="df-pill ${stt[1]}">${stt[0]}</span></div>
    <div class="df-mu" style="margin:4px 0 12px">${line}${a.postponed?` · postponed ${a.postponed}×`:''}</div>
    ${a.state==='confirmed'&&P.cur<3&&missing3.length?`<div class="df-warn">Scheduled, documents outstanding: ${dfEsc(missing3.join(', '))}</div>`:''}
    <div class="df-deed-grid">
      <div><div class="df-eyebrow">Attendees</div>${dfAttendees(o).map(t=>`<div class="df-att"><span>${dfEsc(t.name)} <span class="df-mu">· ${t.role}</span></span><span class="df-mu ${t.rsvp==='Accepted'?'ok':''}">${t.rsvp}</span></div>`).join('')}${df.funding==='cash'?'<div class="df-mu">No bank representative, cash buyer</div>':''}</div>
      <div><div class="df-eyebrow">Ready</div>${s3.slots.filter(id=>dfSlotState(o,id)!=='na').map(id=>`<div class="df-att">${dot(dfSlotState(o,id)==='accepted')}<span>${dfEsc(dfSlotInfo(o,id).label)}</span></div>`).join('')}
        <div class="df-eyebrow">After signing</div>${['deed',...(fin?[fin.id]:[])].map(id=>`<div class="df-att">${dot(dfSlotState(o,id)==='accepted')}<span>${dfEsc(dfSlotInfo(o,id).label)}</span></div>`).join('')}</div>
    </div>
    <div class="df-deed-foot"><div class="df-acts">${acts}</div><span class="df-mu">Handover · ${df.handover?'recorded':df.handoverAtDeed?'at the deed':'separate appointment'+(df.delivery?', '+dfEsc(df.delivery):'')}</span></div>
  </div>`;
}
function dfRegisterHtml(o){
  const x=getExt(o), docs=ensureDocs(o,x), P=dfProgress(o), df=dfState(o);
  const ids=[...new Set(P.steps.flatMap(s=>s.slots))];
  const linked=new Set(ids.map(id=>dfSlotInfo(o,id).doc?.id).filter(Boolean));
  const slotRx=[...Object.values(DF_SLOTS).map(d=>d.match).filter(Boolean),...dfPayments(o).map(r=>dfPayDocRx(r.p,r.kind)).filter(Boolean)];
  const unlinked=docs.filter(d=>!linked.has(d.id)&&!(d.g!=='KYC'&&slotRx.some(rx=>rx.test(d.label)))&&!(d.g==='KYC'&&/source of funds|proof of funds/i.test(d.label)));
  const kycDocs=unlinked.filter(d=>d.g==='KYC'), other=unlinked.filter(d=>d.g!=='KYC');
  const req=ids.filter(id=>!['na','optional'].includes(dfSlotState(o,id))), acc=req.filter(id=>['accepted','exception'].includes(dfSlotState(o,id))).length;
  const docLabel=d=>typeof DOC_STATUS!=='undefined'&&DOC_STATUS[d.status]?DOC_STATUS[d.status].label:d.status;
  const kycRow=d=>{
    const ok=['verified','signed','filed'].includes(d.status), last=d.hist?.at(-1), view=d.file?`dfViewerOpen('doc:${d.id}')`:'';
    return `<div class="df-slot ${ok?'df-s-accepted':'df-s-empty'}"><span class="df-box">${ok?DF_CHECK:''}</span>
      <div class="df-slot-b ${view?'df-click':''}" ${view?`onclick="${view}"`:''}><div class="df-slot-l">${dfEsc(d.label)} <span class="df-tag">KYC</span></div><div class="df-mu">${d.file?dfEsc(d.file.name)+(d.file.size?' · '+dfEsc(d.file.size):''):'No file yet'}${last?' · '+dfEsc(last.act)+' — '+dfEsc(last.t):''}</div></div>
      ${ok?dfChip('accepted'):`<span class="df-chip df-c-req">${dfEsc(docLabel(d))}</span>`}<div class="df-slot-a">${view?`<button type="button" class="btn-ghost df-sm" onclick="${view}">View</button>`:''}</div></div>`;
  };
  const otherRow=d=>{
    const last=d.hist?.at(-1), view=`dfViewerOpen('doc:${d.id}')`;
    const meta=d.unmatched?`${d.src||'Forwarded'} · ${last?.t||''} · no slot matched`:`${d.file?dfEsc(d.file.name)+(d.file.size?' · '+dfEsc(d.file.size):'')+' · ':''}${last?dfEsc(last.act)+' — '+dfEsc(last.t)+' · ':''}not a required slot`;
    return `<div class="df-slot df-s-other"><span class="df-box"></span>
      <div class="df-slot-b df-click" onclick="${view}"><div class="df-slot-l">${dfEsc(d.unmatched?d.file?.name||d.label:d.label)}</div><div class="df-mu">${d.unmatched?dfEsc(meta):meta}</div></div>
      ${d.unmatched?'<span class="df-mu">Classifier: not a required document</span>':`<span class="df-chip df-c-other">${dfEsc(docLabel(d))}</span>`}<div class="df-slot-a">${d.file?`<button type="button" class="btn-ghost df-sm" onclick="${view}">View</button>`:''}</div></div>`;
  };
  const groups=['KYC','Contract','Payments'].map(g=>{
    const rows=[...(g==='KYC'?kycDocs.map(kycRow):[]),...ids.filter(id=>(dfSlotInfo(o,id).group||'Contract')===g).map(id=>dfSlotRow(o,id,false,true,true))];
    return rows.length?`<div class="df-eyebrow">${g}</div>${rows.join('')}`:'';
  }).join('');
  return `<div class="dcard" id="df-sec-documents">
    <div class="row-between"><div><h3 style="margin:0">Documents</h3><div class="df-mu">Single source of truth — everything requested, sent, viewed, agreed and signed on this deal.</div></div>
      <div class="df-acts">${df.completed?`<button type="button" class="btn-ghost df-sm" onclick="dfDownloadDealFile()">Download deal file</button>`:''}<button type="button" class="btn-ghost df-sm" onclick="dfUploadPick()">+ Add document</button></div></div>
    <div class="df-reg-bar"><div class="progress"><span style="width:${req.length?Math.round(acc/req.length*100):0}%"></span></div><span class="df-mu">${acc} of ${req.length} required accepted</span></div>
    ${groups}
    ${other.length?`<div class="df-eyebrow">Other documents</div>${other.map(otherRow).join('')}`:''}
  </div>`;
}
function dfDownloadDealFile(){
  const o=dfO(), P=dfProgress(o), ids=[...new Set(P.steps.flatMap(s=>s.slots))];
  const n=ids.filter(id=>dfSlotState(o,id)==='accepted').length+ensureDocs(o,getExt(o)).filter(d=>d.g==='KYC'&&d.file&&['verified','signed','filed'].includes(d.status)&&!/source of funds|proof of funds/i.test(d.label)).length;
  DF_UI.menu=false; dfLog(o,'Deal file downloaded',`You · ${n} accepted documents, 1 ZIP`); renderDeal();
  showToast(`Preparing deal file · ${n} documents, 1 ZIP`);
}
// The deal shares the opportunity's conversation (same EXT record), so chats, emails and notes sent here show on both.
function dfActivityHtml(o){
  const x=getExt(o), f=DF_UI.feed||'all', ch=DF_UI.ch||'wa', first=o.lead.split(' ')[0];
  const chips=[['all','All'],['wa','WhatsApp'],['sms','SMS'],['em','Email'],['note','Notes'],['sys','System']];
  const list=x.comms.filter(c=>f==='all'||c.ch===f), shown=DF_UI.feedAll?list:list.slice(0,20);
  const items=shown.map(c=>{
    if(!c.df) return feedItem(c);
    return `<div class="fi sys df-fi ${c.strong?'strong':''}"><span>${dfEsc(c.text)}${c.by?`<span class="df-mu df-by">${dfEsc(c.by)}</span>`:''}</span><span class="t">${dfEsc(c.t)}${c.undoId&&dfCanUndo(o,c.undoId)?` · <button type="button" class="df-link" onclick="dfUndo('${o.id}')">Undo</button>`:''}</span></div>`;
  }).join('');
  return `<div class="dcard" id="df-sec-activity">
    <div class="row-between" style="margin-bottom:4px"><h3 style="margin:0">Activity</h3>
      <div class="ff-chips" role="group" aria-label="Filter activity">${chips.map(([k,l])=>`<button type="button" class="ff-chip ${f===k?'on':''}" aria-pressed="${f===k}" onclick="dfFeed('${k}')">${l}</button>`).join('')}</div></div>
    <div class="df-mu" style="margin-bottom:12px">One conversation with ${dfEsc(first)}, shared with ${o.id}${o.origin==='external'?'':` · <button type="button" class="df-link" onclick="openOpp('${o.id}')">Open opportunity</button>`}</div>
    <div class="opp-comp">
      <div class="oc-ch" role="group" aria-label="Send as">${[['wa','WhatsApp'],['sms','SMS'],['em','Email'],['note','Note']].map(([k,l])=>`<button type="button" class="ff-chip ${ch===k?'on':''}" aria-pressed="${ch===k}" onclick="dfCh('${k}')">${l}</button>`).join('')}</div>
      ${ch==='em'?`<input id="df-comp-sub" class="df-comp-sub" placeholder="Subject" aria-label="Email subject">`:''}
      <textarea id="df-comp" rows="2" aria-label="${ch==='note'?'Internal note':'Message '+dfEsc(first)}" placeholder="${ch==='note'?'Add an internal note…':`Message ${dfEsc(first)} on ${CH_META[ch].label}…`}" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();dfSend()}"></textarea>
      <div class="oc-foot"><button type="button" class="ai-chip" style="margin-right:auto" onclick="dfDraft()">✦ AI draft</button><button type="button" class="btn-primary" style="padding:5px 12px;font-size:12px" onclick="dfSend()">${ch==='note'?'Add note':'Send'}</button></div>
    </div>
    <div class="feed">${items||'<div class="col-empty">No activity in this channel yet</div>'}</div>
    ${list.length>20?`<button type="button" class="btn-ghost df-sm" style="margin-top:10px" onclick="DF_UI.feedAll=!DF_UI.feedAll;renderDeal();dfJump('activity')">${DF_UI.feedAll?'Show less':`Show all ${list.length}`}</button>`:''}
  </div>`;
}
function dfKeepComposer(fn){
  const ta=document.getElementById('df-comp'), v=ta?ta.value:'', sub=document.getElementById('df-comp-sub')?.value||'';
  fn(); renderDeal();
  const t2=document.getElementById('df-comp'); if(t2){t2.value=v;t2.focus();}
  const s2=document.getElementById('df-comp-sub'); if(s2) s2.value=sub;
}
function dfFeed(k){dfKeepComposer(()=>{DF_UI.feed=k;});}
function dfCh(k){dfKeepComposer(()=>{DF_UI.ch=k;});}
function dfSend(){
  const o=dfO(), ta=document.getElementById('df-comp'), v=ta&&ta.value.trim(); if(!o||!v) return;
  const ch=DF_UI.ch||'wa', sub=document.getElementById('df-comp-sub')?.value.trim();
  getExt(o).comms.unshift({ch,dir:'out',who:'You',t:'Just now',text:xesc(v),...(ch==='em'?{sub:xesc(sub||`${o.devs[0]} ${o.units[0]} — update`)}:{})});
  if(DF_UI.feed&&DF_UI.feed!=='all'&&DF_UI.feed!==ch) DF_UI.feed='all';
  renderDeal(); dfJump('activity');
  showToast(ch==='note'?'Note added · visible on the opportunity too':`Sent to ${o.lead.split(' ')[0]} via ${CH_META[ch].label}`);
}
// Drafts from the deal's own state: the missing document on the current step, or the deed booking.
function dfDraft(){
  const o=dfO(), t=document.getElementById('df-comp'); if(!o||!t) return;
  const df=dfState(o), P=dfProgress(o), first=o.lead.split(' ')[0];
  const miss=P.cur<4?P.steps[P.cur].slots.map(id=>dfSlotInfo(o,id)).find(s=>['empty','reported','partial','proposed'].includes(s.state)):null;
  t.value=df.completed?`Hi ${first}, congratulations again on ${o.units[0]} at ${o.devs[0]}. Your welcome and warranty pack is on its way; let me know if you need anything for the handover.`
    :miss?`Hi ${first}, a quick one on ${o.units[0]} at ${o.devs[0]}: could you send the ${miss.label.toLowerCase()}${miss.payment?` (${miss.need})`:''}? Once it's in we can move to the next step.`
    :P.cur===3?`Hi ${first}, the final deed for ${o.units[0]} is ${['confirmed','held'].includes(df.appt.state)?`booked for ${df.appt.date}, ${df.appt.time} at ${df.appt.place}`:`targeted for ${df.appt.target||'the coming weeks'}`}. I'll send the what-to-bring list ahead of it.`
    :`Hi ${first}, just checking in on ${o.units[0]} at ${o.devs[0]}. Anything you need from us this week?`;
  t.focus();
}
function dfRailHtml(o,x,d){
  const b=x.buyer||{}, df=dfState(o), ct=CONTACTS.find(k=>k.oppIds.includes(o.id)), comm=df.comm;
  const pays=dfPayments(o), next=pays.find(r=>dfPayState(r.p)!=='accepted'), a=df.appt;
  const dueM=next&&next.p.due.match(/(\d{1,2}\s+[A-Za-z]{3})/);
  return `
  <div class="dcard">
    <div class="row-between" style="margin-bottom:14px"><div class="side-h" style="margin:0">Contact</div>${ownsFor(o.lead).length&&!isCompleted(o)?'<span class="own-badge">Repeat client</span>':''}</div>
    <div class="rep"><div class="avatar">${initials(o.lead)}</div><div><div style="font-size:13.5px;font-weight:600">${dfEsc(o.lead)}</div><div style="font-size:12px;color:var(--muted)">Buyer · ${DF_FUND[df.funding].toLowerCase()}${df.funding==='mixed'?' funding':''}</div></div></div>
    <div class="side-kv"><div class="k">Email</div><div class="v">${dfEsc(b.email||(o.origin==='external'?'Not recorded':ctSlug(o.lead)+'@email.com'))}</div></div>
    <div class="side-kv"><div class="k">Phone</div><div class="v">${dfEsc(b.phone||(o.origin==='external'?'Not recorded':'+356 9912 3456'))}</div></div>
    <div class="side-kv" style="margin:0"><div class="k">Deal owner</div><div class="v">${dfEsc(dfCommOwner(comm)?.name||o.rep)}${comm.shares.length>1?` <span class="df-mu">+ ${comm.shares.length-1} on the sales team</span>`:''}</div></div>
    ${ct?`<button class="btn-ghost" style="width:100%;margin-top:12px;justify-content:center" onclick="openContact('${ct.id}')">Open contact</button>`:''}
  </div>
  ${dfCommCardHtml(o)}
  <div class="dcard"><div class="side-h">Key dates</div>
    ${next?`<div class="side-kv"><div class="k">Payment due</div><div class="v">${dfEsc(dueM?dueM[1]:next.p.due)}${dueM?` <span class="df-mu ${/overdue/.test(dfIn(dueM[1]))?'bad':''}">· ${dfIn(dueM[1])}</span>`:''}</div></div>`:''}
    <div class="side-kv"><div class="k">${df.completed?'Deed signed':a.state==='confirmed'?'Final deed':'Expected deed'}</div><div class="v">${df.completed?dfEsc(df.completed.date||'—'):a.state==='confirmed'||a.state==='held'?`${dfEsc(a.date)}, ${dfEsc(a.time)} <span class="df-mu">· ${dfIn(a.date)}</span>`:a.target?`Target ${dfEsc(a.target)} <span class="df-mu">· ${dfIn(a.target)}</span>`:'Not set'}</div></div>
    <div class="side-kv" style="margin:0"><div class="k">Handover</div><div class="v">${df.handover?'Recorded':df.handoverAtDeed?'At the deed':`${dfEsc(df.delivery||'TBC')} · separate appointment`}</div></div>
  </div>
  <div class="dcard">
    <div class="side-h">Originating opportunity</div>
    <div class="side-kv"><div class="k">Opportunity</div><div class="v">${o.id} · ${dfEsc(o.source)}</div></div>
    <div class="side-kv"><div class="k">POS signed</div><div class="v">${dfEsc(d.pos)}</div></div>
    ${x.bids?.length?`<div class="side-kv"><div class="k">Offer rounds</div><div class="v">${x.bids.length} — final ${x.bids[x.bids.length-1].amt}</div></div>`:''}
    ${o.origin==='external'?'<p class="deal-muted">Recorded externally. No prior selling activity in Bricly.</p>':`<button class="btn-ghost" style="width:100%;margin-top:4px;justify-content:center" onclick="openOpp('${o.id}')">View selling history</button>`}
  </div>
  ${portfolioCardHtml(o.lead)}`;
}
function dfCommCardHtml(o){
  const df=dfState(o), comm=df.comm, isMgr=dfIsManager(), st=comm.state;
  const tone={pending:'warn',changes:'bad',agreed:'neu',earned:'info',payable:'info',part:'warn',settled:'ok'}[st];
  const order=['estimated','agreed','earned','payable','settled'], at={pending:0,changes:0,agreed:1,earned:2,payable:3,part:3,settled:4}[st];
  const ap=comm.approval||{}, req=dfCommOpenRequest(o), editable=['pending','changes','agreed','estimated'].includes(st);
  const apLine=st==='pending'?`<div class="df-comm-ap warn"><b>Waiting on manager approval</b><span>${dfEsc((ap.reasons||[]).join(' · '))}</span>${isMgr&&req?`<span class="df-acts"><button type="button" class="btn-primary df-sm" onclick="apApprove('${req.id}')">Approve split</button><button type="button" class="btn-ghost df-sm" onclick="apRejectOpen('${req.id}')">Reject</button></span>`:req?`<span class="df-mu">${req.id} · in ${DF_COMM_RULE.approver.split(' ')[0]}’s approvals queue</span>`:''}</div>`
    :st==='changes'?`<div class="df-comm-ap bad"><b>Changes requested</b><span>${dfEsc(ap.by||'Manager')} · ${dfEsc(ap.reason||'')}</span></div>`
    :ap.status==='approved'?`<div class="df-mu">Split approved by ${dfEsc(ap.by)}${ap.at?' · '+dfEsc(ap.at):''}</div>`
    :`<div class="df-mu">Default rule · ${DF_COMM_RULE.rate}%, 100% to the deal owner</div>`;
  return `<div class="dcard df-comm" id="df-sec-commission">
    <div class="row-between"><div class="side-h" style="margin:0">Sales team &amp; commission</div><span class="df-pill ${tone}">${DF_COMM_ST[st]}</span></div>
    <div class="df-comm-total"><b>${fmtEur(comm.total)}</b><span class="df-mu">${comm.rate}% of sale · ${DF_TRIGGERS[comm.trigger].toLowerCase()}</span></div>
    <div class="df-comm-track">${order.map((k,i)=>`<span class="${i<=at?'on':''}"></span>`).join('')}</div>
    <div class="df-comm-lbl">${order.map((k,i)=>`<span class="${i===at?'cur':''}">${DF_COMM_ST[k]}</span>`).join('')}</div>
    <div class="df-team" role="list" aria-label="Sales team">
      ${comm.shares.map(s=>{const ss=dfShareState(comm,s);return `<div class="df-share" role="listitem"><span class="df-av ${s.kind}" aria-hidden="true">${initials(s.name)}</span>
        <div class="df-share-b"><div><b>${dfEsc(s.name)}</b> <span class="df-mu">${s.pct}%</span></div><div class="df-mu">${dfEsc(s.role)}${s.company?' · '+dfEsc(s.company):''} · ${dfEsc(comm.payer)} pays ${dfEsc(s.kind==='external'&&s.company?s.company:s.name.split(' ')[0])}</div></div>
        <div class="df-share-r"><b>${fmtEur(dfShareAmt(comm,s))}</b><span class="df-mu">${s.paid>0&&ss!=='settled'?fmtEur(s.paid)+' paid':DF_COMM_ST[ss]}</span></div></div>`;}).join('')}
    </div>
    ${apLine}
    ${comm.disputed?`<div class="df-comm-ap bad"><b>Disputed</b><span>${dfEsc(comm.disputed.reason)} · ${dfEsc(comm.disputed.by)}</span></div>`:''}
    <div class="df-acts">
      ${editable?`<button type="button" class="btn-ghost df-sm" onclick="dfSplitOpen()">Edit team &amp; split</button>`:''}
      ${st==='earned'&&isMgr?`<button type="button" class="btn-primary df-sm" onclick="dfCommPayable()">Mark payable</button>`:''}
      ${(st==='payable'||st==='part')&&isMgr?`<button type="button" class="btn-primary df-sm" onclick="dfPayoutOpen()">Record payout</button>`:''}
      <button type="button" class="btn-ghost df-sm" onclick="dfDisputeOpen()">${comm.disputed?'Resolve dispute':'Flag dispute'}</button>
    </div>
    <div class="df-mu">Runs off the stepper and never holds back the buyer’s deal.</div>
  </div>`;
}

// ---------- modal + drawer scaffolds ----------
function dfModal(title,body,foot,wide=false){
  let m=document.getElementById('dfModal');
  if(!m){m=document.createElement('dialog');m.id='dfModal';m.setAttribute('aria-labelledby','dfModalTitle');m.addEventListener('click',e=>{if(e.target===m)m.close();});document.body.appendChild(m);}
  m.className=wide?'wide':'';
  m.innerHTML=`<form method="dialog" onsubmit="return false"><header><h2 id="dfModalTitle">${title}</h2><button type="button" class="tool" aria-label="Close" onclick="dfModalClose()">${sbIcon('x')}</button></header><div class="df-mbody">${body}</div><footer>${foot}<p class="df-err" id="dfModalErr" role="alert"></p></footer></form>`;
  if(!m.open) m.showModal();
  (m.querySelector('.df-mbody input:not([type=hidden]),.df-mbody select,.df-mbody textarea')||m.querySelector('footer button'))?.focus();
}
function dfModalClose(){document.getElementById('dfModal')?.close();}
function dfModalErr(t){const e=document.getElementById('dfModalErr');if(e)e.textContent=t;}
function dfDrawer(title,body,foot,width=440){
  const dr=document.getElementById('qaDrawer'); if(dr) dr.style.width=width+'px';
  qaDrawerOpen(title,body,foot);
}
function dfVal(id){return (document.getElementById(id)?.value||'').trim();}

// ---------- actions menu ----------
function dfMenuToggle(e){e.stopPropagation();DF_UI.menu=!DF_UI.menu;renderDeal();}
document.addEventListener('click',e=>{if(DF_UI.menu&&!e.target.closest('.df-menu-wrap')){DF_UI.menu=false;if(document.getElementById('p-deal')?.classList.contains('on'))renderDeal();}});
function dfMenuHtml(o){
  const df=dfState(o), mgr=dfIsManager();
  const it=(l,sub,fn,dis)=>`<button type="button" role="menuitem" onclick="DF_UI.menu=false;${fn}" ${dis?'disabled':''}><span>${l}</span>${sub?`<span class="df-menu-s">${sub}</span>`:''}</button>`;
  if(df.completed) return `<div class="df-menu" role="menu">
    <div class="df-menu-h">After the sale</div>${it('Record handover',df.handover?'Recorded':`Keys, meters, photos${df.delivery?' · '+dfEsc(df.delivery):''}`,'dfHandoverOpen()',!!df.handover)}${it('Send welcome &amp; warranty pack',df.welcomeSent?'Sent':'Drafted · needs your tap to send','dfWelcomeSend()',!!df.welcomeSent)}${it('Download deal file','Every accepted document, one ZIP','dfDownloadDealFile()')}
    <div class="df-menu-h">Deal</div>${it('Edit deal details','Locked after completion','',true)}${it('Reopen deal…',mgr?'':'Needs a manager','dfReopenOpen()',!mgr)}
    <div class="df-menu-n">Closed deals are read-only. Reopening needs a manager and is logged.</div></div>`;
  const P=dfProgress(o), cur=P.steps[Math.min(P.cur,3)], next=cur.slots.find(id=>['empty','reported','partial'].includes(dfSlotState(o,id)));
  const booked=df.appt.state!=='target';
  return `<div class="df-menu" role="menu">
    <div class="df-menu-h">This step</div>${it('Upload document',next?`Next needed: ${dfEsc(dfSlotInfo(o,next).label)}`:'Any file · Bricly matches it to a slot',next?`dfUploadOpen('${next}')`:'dfUploadPick()')}${dfPayments(o).length?it('Record payment','Report it now, attach the receipt later','dfRecordPaymentPick()'):''}${it(booked?'Reschedule deed appointment':'Book deed appointment','Never moves a step','dfBookOpen()')}
    <div class="df-menu-h">Deal</div>${it('Edit deal details','Unit, price, payment plan, buyers, owner','dfEditOpen()')}${it('Edit sales team &amp; split','Commission split · re-approval if it changes','dfSplitOpen()',!['pending','changes','agreed'].includes(df.comm.state))}${it('Change funding type',`Currently ${DF_FUND[df.funding]} · updates step 2`,'dfFundingOpen()')}${it('Cancel deal…','POS collapse · needs a manager','dfCollapseOpen()')}
    <div class="df-menu-n">There is no manual “update step”. Steps move on their own once the last required document is accepted.</div></div>`;
}
function dfWelcomeSend(){
  const o=dfO(), df=dfState(o), first=o.lead.split(' ')[0];
  dfModal('Welcome &amp; warranty pack',`<div class="df-mu">Drafted from the ${dfEsc(o.devs[0])} template. Review before it goes to ${dfEsc(first)}.</div>
    <div class="df-att"><span>To</span><span>${dfEsc(o.lead)} · email</span></div>
    <div class="df-att"><span>Includes</span><span>Welcome letter · warranty schedule · snagging form · handover checklist</span></div>
    <label class="df-field"><span>Message</span><textarea id="dfWpMsg" rows="3">Hi ${dfEsc(first)}, congratulations on your new home at ${dfEsc(o.devs[0])}. Your welcome and warranty pack is attached. Snagging requests can be sent straight back to us.</textarea></label>`,
    `<button class="btn-ghost" onclick="dfModalClose()">Not yet</button><button class="btn-primary" onclick="dfWelcomeSave()">Send pack</button>`);
}
function dfWelcomeSave(){
  const o=dfO(), df=dfState(o); df.welcomeSent={at:'Today',by:dfMe()};
  dfLog(o,'Welcome & warranty pack sent',`${dfMe()} · email to ${o.lead}`);
  dfModalClose(); dfRefresh(); showToast(`Welcome & warranty pack sent to ${o.lead.split(' ')[0]}`);
}
function dfNotice(msg){renderDeal();showToast(msg);}
function dfRecordPaymentPick(){
  const o=dfO(), r=dfPayments(o).find(r=>dfRcRoom(r.p)>0.005);
  renderDeal(); if(r) dfReceiptOpen(r.id); else showToast('Every instalment is fully received');
}

// ---------- record payment (frames 13/14) · "Paid" shows only once a receipt is accepted ----------
let DF_RC=null;
function dfRcRoom(p){return Math.max(0,Math.round((p.amt-dealReceived(p))*100)/100);}
function dfRcReceivers(o){return [`Developer · ${dfDevCo(o)}`,`Notary · ${dfNotary(o).replace(/^(Dr\.)\s+\S+\s+/,'$1 ')}`,'Escrow'];}
function dfReceiptOpen(rowId){
  const o=dfO(), rows=dfPayments(o).filter(r=>dfRcRoom(r.p)>0.005), r=rows.find(r=>r.id===rowId)||rows[0];
  if(!r){showToast('Every instalment is fully received');return;}
  const room=dfRcRoom(r.p), recv=dfRcReceivers(o), cur=dfReceiver(o,r);
  DF_RC={oppId:o.id,rowId:r.id,mode:'reported',amount:room,date:dealToday(),by:recv.find(v=>v.split(' · ')[0]===cur.split(' · ')[0])||recv[0],alloc:{[r.id]:room},file:null};
  dfReceiptRender();
}
function dfRcCollect(){
  if(!DF_RC) return;
  DF_RC.amount=Number(dfVal('dfRcAmt'))||0; DF_RC.date=dfVal('dfRcDate'); DF_RC.by=dfVal('dfRcBy');
  document.querySelectorAll('[data-rc-row]').forEach(i=>{DF_RC.alloc[i.dataset.rcRow]=Number(i.value)||0;});
}
function dfRcMode(m){dfRcCollect();DF_RC.mode=m;dfReceiptRender();}
function dfRcFile(input){
  const f=input.files[0]; if(!f) return;
  if(!['application/pdf','image/png','image/jpeg','image/webp'].includes(f.type)||f.size>20*1024*1024){showToast('Choose a PDF, PNG, JPEG or WebP file up to 20 MB.');return;}
  dfRcCollect(); DF_RC.file={name:f.name,size:(f.size/1024).toFixed(0)+' KB',url:URL.createObjectURL(f)}; dfReceiptRender();
}
function dfRcUnalloc(){
  const amt=Number(dfVal('dfRcAmt'))||0, sum=[...document.querySelectorAll('[data-rc-row]')].reduce((s,i)=>s+(Number(i.value)||0),0);
  const el=document.getElementById('dfRcUn'); if(el) el.textContent=fmtEur(Math.round((amt-sum)*100)/100);
}
function dfReceiptRender(){
  const o=OPPS.find(x=>x.id===DF_RC.oppId), rows=dfPayments(o).filter(r=>dfRcRoom(r.p)>0.005), conf=DF_RC.mode==='confirmed';
  const s=dfSlotInfo(o,DF_RC.rowId), f=DF_RC.file||{name:s.sample};
  const sum=Object.values(DF_RC.alloc).reduce((a,b)=>a+b,0);
  dfModal('Record payment',`
    <div class="df-mu">“Paid” only shows once a receipt is accepted.</div>
    <div class="df-seg" role="radiogroup" aria-label="Receipt"><button type="button" role="radio" aria-checked="${!conf}" class="${conf?'':'on'}" onclick="dfRcMode('reported')">No receipt yet · reported</button><button type="button" role="radio" aria-checked="${conf}" class="${conf?'on':''}" onclick="dfRcMode('confirmed')">Receipt attached · confirmed</button></div>
    <div class="df-grid2"><label class="df-field"><span>Amount (€)</span><input id="dfRcAmt" inputmode="decimal" value="${DF_RC.amount}" oninput="dfRcUnalloc()"></label><label class="df-field"><span>Date received</span><input id="dfRcDate" type="date" value="${DF_RC.date}" max="${dealToday()}"></label></div>
    <label class="df-field"><span>Received by</span><select id="dfRcBy">${dfRcReceivers(o).map(v=>`<option ${v===DF_RC.by?'selected':''}>${dfEsc(v)}</option>`).join('')}</select></label>
    <div class="df-eyebrow">Allocate to instalments · counted once</div>
    ${rows.map(r=>`<label class="df-alloc"><span>${dfEsc(r.p.label)}<span class="df-mu"> · ${fmtEur(dfRcRoom(r.p))} open</span></span><input data-rc-row="${r.id}" inputmode="decimal" value="${DF_RC.alloc[r.id]||0}" oninput="dfRcUnalloc()" aria-label="Allocate to ${dfEsc(r.p.label)}"></label>`).join('')}
    <div class="df-alloc"><span>Unallocated credit</span><b id="dfRcUn">${fmtEur(Math.round((DF_RC.amount-sum)*100)/100)}</b></div>
    ${conf?`<div class="df-file"><span class="df-file-ic">${sbIcon('doc')}</span><div><b>${dfEsc(f.name)} attached</b><div class="df-mu">You have payment permission · accepted on save</div></div></div><label class="df-mu df-replace">Choose a different file <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onchange="dfRcFile(this)"></label>`
      :`<div class="df-warn">Saved as reported. The row reads “Reported, receipt missing”, cash collected doesn’t change and a task to get the receipt is added.</div>`}`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfReceiptSave()">Save</button>`);
}
function dfReceiptSave(){
  dfRcCollect();
  const o=OPPS.find(x=>x.id===DF_RC.oppId), df=dfState(o), rc=DF_RC;
  const amt=Math.round(rc.amount*100)/100, parts=dfPayments(o).filter(r=>(rc.alloc[r.id]||0)>0).map(r=>({r,a:Math.round(rc.alloc[r.id]*100)/100}));
  const sum=Math.round(parts.reduce((s,x)=>s+x.a,0)*100)/100;
  if(!(amt>0)){dfModalErr('Enter the amount received.');return;}
  if(!rc.date||rc.date>dealToday()){dfModalErr('Date received can’t be in the future.');return;}
  const over=parts.find(x=>x.a>dfRcRoom(x.r.p)+0.005); if(over){dfModalErr(`${over.r.p.label} only has ${fmtEur(dfRcRoom(over.r.p))} open.`);return;}
  if(Math.abs(sum-amt)>0.005){dfModalErr(`Allocate the full ${fmtEur(amt)} across the instalments.`);return;}
  const by=rc.by.startsWith('Developer')?'Developer':rc.by;
  parts.forEach(({r})=>{df.receivedBy[r.p.id]=by;});
  DF_RC=null; dfModalClose();
  if(rc.mode==='confirmed'){parts.forEach(({r,a})=>dfAccept(o,r.id,{via:'receipt form',file:rc.file,amount:a}));return;}
  const snap=dfSnap(o), undoId=dfArmUndo(o,snap,'reported payment');
  parts.forEach(({r,a})=>{
    r.p.receipts.push({id:crypto.randomUUID(),amount:a,date:rc.date,method:'Bank transfer',reference:'',documentIds:[],who:'You',recordedAt:new Date().toISOString()});
    dealPaymentStatus(r.p);
    const step=dfSlotStep(o,r.id), key=DF_TPL.steps[step>=0?step:Math.min(dfProgress(o).cur,3)].key;
    df.extraTasks.push({id:'t-rc-'+Date.now()+r.p.id,step:key,title:`Get the receipt for ${r.p.label.replace(/\s*\(.*?\)/,'')}`,owner:dfMe(),done:false,payment:r.p.id,note:`${fmtEur(a)} reported ${dfFmtIso(rc.date)}`});
    dfLog(o,`Payment reported: ${r.p.label.replace(/\s*\(.*?\)/,'')} ${fmtEur(a)}`,'You · receipt missing, not counted in cash collected',{undoId});
  });
  dfRefresh(); dfToast('Reported. Cash collected unchanged until a receipt is accepted.',o.id);
}

// ---------- upload & confirm drawer (DF03) ----------
let DF_UP=null;
function dfUploadPick(){
  const o=dfO(), P=dfProgress(o); renderDeal();
  const open=[...new Set(P.steps.flatMap(s=>s.slots))].filter(id=>['empty','reported','partial','optional'].includes(dfSlotState(o,id)));
  dfDrawer('Upload a document',`<p class="df-mu">Pick the slot this file fills. Documents for later steps can arrive early.</p>${open.map(id=>{const s=dfSlotInfo(o,id);return `<button type="button" class="df-pick" onclick="dfUploadOpen('${id}')"><span>${dfEsc(s.label)}</span><span class="df-tag">Step ${s.step+1}</span></button>`;}).join('')||'<div class="col-empty">Every slot is filled.</div>'}`,`<button class="btn-ghost" onclick="qaDrawerClose()">Close</button>`);
}
function dfUploadOpen(id,file){
  const o=dfO(); if(!o) return;
  const s=dfSlotInfo(o,id);
  clearTimeout(DF_UP?.t1);clearTimeout(DF_UP?.t2);
  DF_UP={id,oppId:o.id,stage:'uploading',file:file||{name:s.sample,size:id.startsWith('pay:')?'160 KB':'640 KB'}};
  dfUploadRender();
  DF_UP.t1=setTimeout(()=>{if(DF_UP&&DF_UP.id===id){DF_UP.stage='scan';dfUploadRender();}},700);
  DF_UP.t2=setTimeout(()=>{if(DF_UP&&DF_UP.id===id){DF_UP.stage='details';dfUploadRender();}},1600);
}
function dfUploadFile(input){
  const f=input.files[0]; if(!f) return;
  if(!['application/pdf','image/png','image/jpeg','image/webp'].includes(f.type)||f.size>20*1024*1024){showToast('Choose a PDF, PNG, JPEG or WebP file up to 20 MB.');return;}
  dfUploadOpen(DF_UP.id,{name:f.name,size:(f.size/1024).toFixed(0)+' KB',url:URL.createObjectURL(f)});
}
function dfUploadRender(){
  const o=OPPS.find(r=>r.id===DF_UP.oppId), s=dfSlotInfo(o,DF_UP.id), stg=DF_UP.stage, f=DF_UP.file;
  const status=stg==='uploading'?'Uploading…':stg==='scan'?'Pending scan · checking type, buyer, unit and amount':'Scanned · type, buyer, unit and amount match this slot';
  const fields=s.fields.map(([k,v],i)=>`<label class="df-field"><span>${dfEsc(k)}</span><input id="dfup-${i}" class="hl" value="${dfEsc(k==='Amount'&&s.payment?String(Math.max(0,s.payment.amt-dfPayEvidence(s.payment).confirmed)):v)}" ${k==='Amount'&&s.payment?'inputmode="decimal"':''}></label>`).join('');
  dfDrawer(`Upload · ${s.label}`,`
    <div class="df-mu">Step ${s.step+1} · ${dfEsc(o.lead)} · ${dfEsc(o.units[0])}</div>
    <div class="df-file"><span class="df-file-ic">${sbIcon('doc')}</span><div><b>${dfEsc(f.name)} · ${dfEsc(f.size)}</b><div class="${stg==='details'?'df-ok':'df-mu'}" aria-live="polite">${status}</div></div></div>
    <label class="df-mu df-replace">Choose a different file <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onchange="dfUploadFile(this)"></label>
    ${stg==='details'?`<p class="df-mu">Confirm the key facts. Highlighted values were read from the file.</p>${fields}${s.signed?'<div class="df-warn">Signed contract · it goes to a manager for approval before it counts.</div>':''}`:'<div class="df-skel"></div><div class="df-skel"></div>'}
  `,`<button class="btn-ghost" onclick="dfUploadCancel()">Cancel</button><button class="btn-primary" ${stg==='details'?'':'disabled'} onclick="dfUploadSave()">${s.signed?'Send for approval':'Confirm and accept'}</button>`);
}
function dfUploadCancel(){clearTimeout(DF_UP?.t1);clearTimeout(DF_UP?.t2);DF_UP=null;qaDrawerClose();}
function dfUploadSave(){
  if(!DF_UP||DF_UP.stage!=='details') return;
  const o=OPPS.find(r=>r.id===DF_UP.oppId), s=dfSlotInfo(o,DF_UP.id);
  const fields=s.fields.map(([k],i)=>[k,dfVal('dfup-'+i)]);
  let amount=null;
  if(s.payment){
    amount=Number(String(fields.find(f=>f[0]==='Amount')?.[1]||'').replace(/[^\d.]/g,''));
    const left=Math.round((s.payment.amt-dfPayEvidence(s.payment).confirmed)*100)/100;
    if(!(amount>0)||amount>left+0.005){showToast(`Enter an amount up to ${fmtEur(left)}`);return;}
  }
  const id=DF_UP.id, {fromDoc,...file}=DF_UP.file; DF_UP=null; qaDrawerClose();
  dfAccept(o,id,{via:fromDoc?'matched from other documents':'upload',file,fields,amount});
  if(fromDoc){
    const x=getExt(o), i=(x.docs||[]).findIndex(d=>d.id===fromDoc);
    if(i>=0){x.docs.splice(i,1);dfRefresh();}
  }
}
// Accepting a slot: the only thing that can complete a step.
function dfAccept(o,id,{via='upload',file=null,fields=null,amount=null,approvedBy=null}={}){
  const x=getExt(o), df=dfState(o), snap=dfSnap(o), s=dfSlotInfo(o,id);
  const f=file||{name:s.sample,size:'160 KB'};
  let awaiting=false;
  if(s.payment){
    const doc=dfFileDoc(o,x,s,f,via);
    const p=s.payment; let left=amount??Math.round((p.amt-dfPayEvidence(p).confirmed)*100)/100;
    dealReceipts(p).filter(rc=>!rc.voided&&!rc.documentIds?.length).forEach(rc=>{if(left>0){rc.documentIds=[doc.id];left-=rc.amount;}});
    const room=Math.round((p.amt-dealReceived(p))*100)/100;
    if(left>0.005&&room>0) p.receipts.push({id:crypto.randomUUID(),amount:Math.min(left,room),date:dealToday(),method:'Bank transfer',documentIds:[doc.id]});
    dealPaymentStatus(p);
  }else{
    awaiting=s.signed&&!approvedBy;
    const doc=dfFileDoc(o,x,s,f,via,'Today',awaiting?'uploaded':undefined);
    df.slots[id]={state:awaiting?'awaiting':'accepted',docId:doc.id,file:f.name,size:f.size,at:'Today',via,by:approvedBy||'You',fields,note:approvedBy?`Manager approved — Today · ${approvedBy}`:null};
  }
  df.proposals=df.proposals.filter(p=>p.slot!==id);
  const undoId=dfArmUndo(o,snap,`${s.label} ${awaiting?'upload':'acceptance'}`);
  dfLog(o,awaiting?`${s.label} uploaded · awaiting manager approval`:`${s.label} accepted`,`${approvedBy||'You'} · ${via}`,{undoId});
  const n0=x.comms.length, {moved,P}=dfAfter(o,s.label);
  x.comms.slice(0,x.comms.length-n0).forEach(c=>c.undoId=undoId);
  const msg=moved.length?`Moved to ${P.steps[Math.min(P.cur,3)].label}, completed by: ${s.label}`:awaiting?`${s.label} sent for manager approval`:`${s.label} accepted`;
  dfRefresh(); dfToast(msg,o.id);
  return moved;
}
function dfApproveSigned(id){
  if(!dfIsManager()){showToast('Only a manager can approve a signed contract');return;}
  const o=dfO(), rec=dfState(o).slots[id]; if(!rec) return;
  dfAccept(o,id,{via:'manager approval',file:{name:rec.file,size:rec.size},approvedBy:dfMe()});
}
function dfChase(id){
  const o=dfO(), s=dfSlotInfo(o,id), who=s.chase.replace(/^Chase /,'');
  dfLog(o,`Chase drafted · ${s.label}`,`You · draft to ${who}`);
  renderDeal(); showToast(`Draft ready: message to ${who} about the ${s.label.toLowerCase()}. Review before sending.`);
}

// ---------- proposals (suggestions strip) ----------
function dfProposal(o,pid){return dfState(o).proposals.find(p=>p.id===pid);}
function dfProposalConfirm(pid){
  const o=dfO(), df=dfState(o), p=dfProposal(o,pid); if(!p) return;
  if(p.kind==='attach'){dfAccept(o,p.slot,{via:`${p.channel} proposal`,file:p.file});return;}
  if(p.kind==='appt'){
    const snap=dfSnap(o);
    Object.assign(df.appt,{state:'confirmed',date:p.appt.date,time:p.appt.time,place:p.appt.place});
    df.proposals=df.proposals.filter(q=>q.id!==pid);
    const undoId=dfArmUndo(o,snap,'deed appointment');
    dfLog(o,`Final deed appointment booked · ${p.appt.date}, ${p.appt.time}`,`You · confirmed ${p.channel.toLowerCase()} proposal from ${p.from}`,{undoId});
    dfSync(o); dfRefresh(); dfToast(`Deed appointment set for ${p.appt.date}, ${p.appt.time}. Steps unchanged.`,o.id);
  }
}
function dfProposalPick(pid,slot){
  const o=dfO(), p=dfProposal(o,pid), r=dfPayById(o,slot); if(!p||!r) return;
  const left=Math.round((r.p.amt-dfPayEvidence(r.p).confirmed)*100)/100;
  if(Math.abs(left-p.amount)>0.5){showToast(`Amount doesn’t match ${r.p.label.replace(/\s*\(.*?\)/,'')} (${fmtEur(left)}). Pick another row or dismiss.`);return;}
  dfState(o).proposals=dfState(o).proposals.filter(q=>q.id!==pid);
  dfAccept(o,slot,{via:`${p.channel} photo`,file:p.file,amount:p.amount});
}
function dfProposalDismiss(pid){
  const o=dfO(), df=dfState(o), p=dfProposal(o,pid); if(!p) return;
  df.proposals=df.proposals.filter(q=>q.id!==pid);
  dfLog(o,`Proposal dismissed · ${p.title}`,'You'); dfRefresh();
}

// ---------- document viewer + share (frames 06/07/24) ----------
// ref is a slot id ('pof', 'pay:…') or 'doc:<id>' for a register document that fills no required slot.
let DF_VIEW=null;
const DF_SHARE_ACCESS=['View only','Can download'], DF_SHARE_EXPIRY=['In 7 days','In 30 days','Never'];
function dfViewerDoc(o,ref){
  const x=getExt(o), docs=ensureDocs(o,x);
  if(ref.startsWith('doc:')){
    const doc=docs.find(d=>d.id===ref.slice(4)); if(!doc) return null;
    const first=doc.hist?.[0], last=doc.hist?.at(-1), st=typeof DOC_STATUS!=='undefined'&&DOC_STATUS[doc.status]?DOC_STATUS[doc.status].label:doc.status;
    return {ref,other:true,doc,label:doc.unmatched?doc.file?.name||doc.label:doc.label,file:doc.file?.name||'No file',size:doc.file?.size||'',
      chip:`<span class="df-chip df-c-other">${dfEsc(doc.unmatched?'Unmatched':st)}</span>`,docType:doc.label,updateLabel:'Match to slot',
      meta:[['Slot','No required slot'],['Step','—'],['Source',doc.src||(first?`${first.act} · ${first.who}`:'—')],['Status',last?`${last.act} — ${last.t}`:st],['Visible to','Deal team · managers']],facts:[],hist:doc.hist||[]};
  }
  const s=dfSlotInfo(o,ref), rec=s.rec||{}, doc=s.doc;
  const via=rec.via?rec.via.charAt(0).toUpperCase()+rec.via.slice(1):null;
  const facts=(rec.fields||s.fields||[]).slice(1);
  const status=rec.note||(s.state==='accepted'?`Accepted — ${s.at||'Today'}`:s.state==='awaiting'?'Waiting on manager approval':(DF_CHIP[s.state]||[s.state])[0]);
  return {ref,other:false,slot:s,doc,label:s.label,file:s.file||doc?.file?.name||'No file',size:s.size||doc?.file?.size||'',chip:dfChip(s.state),
    docType:(s.fields&&s.fields[0]?.[1])||s.label,updateLabel:'Replace',
    meta:[['Slot',s.label],['Step',s.step>=0?`Step ${s.step+1} · ${dfProgress(o).steps[s.step]?.label||''}`:'KYC'],['Source',via?`${via} · ${rec.by||'You'}`:doc?.hist?.[0]?`${doc.hist[0].act} · ${doc.hist[0].who}`:'Upload · You'],['Status',status],['Visible to','Deal team · managers']],
    facts:s.state==='accepted'||s.state==='awaiting'?facts:[],hist:doc?.hist||(s.state==='accepted'?[{t:s.at||'Today',who:rec.by||'You',act:'Accepted · key facts confirmed'}]:[])};
}
function dfShareRecips(o){
  const df=dfState(o), notary=dfNotary(o).replace(/^(Dr\.)\s+\S+\s+/,'$1 ');
  const bank=o.closed.bank&&!/tbc|—/i.test(o.closed.bank)?o.closed.bank:'Bank';
  return [['buyer',o.lead,'Buyer'],['notary',notary,'Notary'],['dev','Joseph Vella',o.devs[0]],...(df.funding!=='cash'?[['bank',bank,'Bank']]:[])];
}
function dfViewerOpen(ref,share=false){
  if(DF_VIEW&&DF_VIEW.ref===ref){DF_VIEW.share=share;dfViewerRender();return;}
  DF_VIEW={ref,share,sel:['buyer'],access:DF_SHARE_ACCESS[0],expiry:DF_SHARE_EXPIRY[0],note:''};
  dfViewerRender();
}
function dfViewerClose(){DF_VIEW=null;document.getElementById('dfViewer')?.remove();}
function dfShareCollect(){
  if(!DF_VIEW) return;
  const a=document.getElementById('dfShAccess'), e=document.getElementById('dfShExpiry'), n=document.getElementById('dfShNote');
  if(a) DF_VIEW.access=a.value; if(e) DF_VIEW.expiry=e.value; if(n) DF_VIEW.note=n.value;
}
function dfShareToggle(){dfShareCollect();DF_VIEW.share=!DF_VIEW.share;dfViewerRender();}
function dfSharePick(k){dfShareCollect();const s=DF_VIEW.sel;DF_VIEW.sel=s.includes(k)?s.filter(x=>x!==k):[...s,k];dfViewerRender();}
function dfViewerRender(){
  const o=dfO(); if(!o||!DF_VIEW) return dfViewerClose();
  const v=dfViewerDoc(o,DF_VIEW.ref); if(!v) return dfViewerClose();
  const df=dfState(o), shares=(df.shares||{})[v.ref]||[], url=v.doc?.file?.url, isImg=url&&/\.(png|jpe?g|webp)$/i.test(v.file);
  const pages=/MB/.test(v.size)?4:1;
  const hist=[...v.hist.map(h=>[h.act,`${h.who} · ${h.t}`]),...shares.map(s=>[`Shared with ${s.to} · ${s.via}`,`${s.access.toLowerCase()} · ${s.at}`])];
  const kv=rows=>rows.map(([k,val])=>`<div class="df-v-kv"><span>${dfEsc(k)}</span><span>${dfEsc(val)}</span></div>`).join('');
  const recips=dfShareRecips(o).map(([k,n,r])=>`<button type="button" class="df-sh-pill ${DF_VIEW.sel.includes(k)?'on':''}" aria-pressed="${DF_VIEW.sel.includes(k)}" onclick="dfSharePick('${k}')">${dfEsc(n)} · ${dfEsc(r)}</button>`).join('');
  const opt=(list,cur)=>list.map(l=>`<option ${l===cur?'selected':''}>${l}</option>`).join('');
  const sharePop=DF_VIEW.share?`<div class="df-sh-pop" role="dialog" aria-label="Share ${dfEsc(v.label)}">
      <div><b>Share ${dfEsc(v.label)}</b><div class="df-mu">Sends a secure link. Every open is logged to activity.</div></div>
      <div><div class="df-sh-k">To</div><div class="df-sh-pills">${recips}</div></div>
      <div class="df-grid2"><label class="df-field"><span>Access</span><select id="dfShAccess">${opt(DF_SHARE_ACCESS,DF_VIEW.access)}</select></label><label class="df-field"><span>Link expires</span><select id="dfShExpiry">${opt(DF_SHARE_EXPIRY,DF_VIEW.expiry)}</select></label></div>
      <textarea id="dfShNote" rows="2" placeholder="Add a note (optional)">${dfEsc(DF_VIEW.note)}</textarea>
      <div class="df-sh-acts"><button type="button" class="btn-primary df-sm" onclick="dfShare('email')">Send by email</button><button type="button" class="btn-ghost df-sm" onclick="dfShare('WhatsApp')">WhatsApp</button><button type="button" class="btn-ghost df-sm" onclick="dfShare('link')">Copy link</button></div>
    </div>`:'';
  const preview=isImg?`<img src="${dfEsc(url)}" alt="${dfEsc(v.label)}" class="df-v-img">`:`<div class="df-v-page">
      <span class="df-v-type">${dfEsc(v.docType)}</span><b>${dfEsc(v.label)}</b><span class="df-mu">${dfEsc(o.lead)} · ${dfEsc(o.units[0]||'')} · ${dfEsc(o.devs[0])}</span>
      <span class="df-v-rule"></span><span class="df-v-line" style="width:92%"></span><span class="df-v-line" style="width:84%"></span><span class="df-v-line" style="width:88%"></span><span class="df-v-line" style="width:60%"></span>
      <span style="flex:1"></span><span class="df-v-foot">Preview · page 1 of ${pages}</span></div>`;
  let el=document.getElementById('dfViewer');
  if(!el){el=document.createElement('div');el.id='dfViewer';document.body.appendChild(el);}
  el.innerHTML=`<div class="df-v-scrim" onclick="dfViewerClose()"></div>
  <aside class="df-v" role="dialog" aria-modal="true" aria-label="${dfEsc(v.label)}">
    <header class="df-v-head">
      <div class="df-v-title"><div><b>${dfEsc(v.label)}</b> ${v.chip}</div><div class="df-mu">${dfEsc(v.file)}${v.size?' · '+dfEsc(v.size):''}</div></div>
      <div class="df-v-acts">
        <button type="button" class="btn-ghost df-sm" onclick="dfViewerDownload()">Download</button>
        <button type="button" class="btn-primary df-sm" aria-expanded="${DF_VIEW.share}" onclick="dfShareToggle()">Share</button>
        <button type="button" class="btn-ghost df-sm" onclick="dfViewerUpdate()">${v.updateLabel}</button>
        <button type="button" class="tool" aria-label="Close" onclick="dfViewerClose()">${sbIcon('x')}</button>
        ${sharePop}
      </div>
    </header>
    <div class="df-v-body">
      <div class="df-v-prev">${preview}<div class="df-mu df-v-pg"><span>Page 1 / ${pages}</span><span>·</span><span>100%</span></div></div>
      <div class="df-v-side">
        <section><div class="df-eyebrow">Details</div>${kv(v.meta)}</section>
        ${v.facts.length?`<section><div class="df-eyebrow">Checked facts</div>${kv(v.facts)}</section>`:''}
        <section><div class="df-eyebrow">History</div>${hist.length?kv(hist):'<div class="df-mu">No history yet</div>'}</section>
      </div>
    </div>
  </aside>`;
  if(!el._esc){el._esc=e=>{if(e.key==='Escape'&&DF_VIEW){if(DF_VIEW.share){dfShareToggle();}else dfViewerClose();}};document.addEventListener('keydown',el._esc);}
}
function dfViewerDownload(){
  const v=dfViewerDoc(dfO(),DF_VIEW.ref), url=v?.doc?.file?.url;
  if(url) window.open(url,'_blank'); else showToast(`Downloading ${v?.file||'file'}`);
}
function dfViewerUpdate(){
  const o=dfO(), ref=DF_VIEW.ref; dfViewerClose();
  if(!ref.startsWith('doc:')){dfUploadOpen(ref);return;}
  const doc=ensureDocs(o,getExt(o)).find(d=>d.id===ref.slice(4)); if(!doc) return;
  const P=dfProgress(o), open=[...new Set(P.steps.flatMap(s=>s.slots))].filter(id=>['empty','reported','partial','optional'].includes(dfSlotState(o,id)));
  const file=JSON.stringify({...doc.file,fromDoc:doc.id}).replace(/"/g,'&quot;');
  dfDrawer('Match to slot',`<p class="df-mu">Pick the required slot ${dfEsc(doc.file?.name||doc.label)} fills. Its key facts are checked before it’s accepted.</p>${open.map(id=>{const s=dfSlotInfo(o,id);return `<button type="button" class="df-pick" onclick="dfUploadOpen('${id}',${file})"><span>${dfEsc(s.label)}</span><span class="df-tag">Step ${s.step+1}</span></button>`;}).join('')||'<div class="col-empty">Every slot is filled.</div>'}`,`<button class="btn-ghost" onclick="qaDrawerClose()">Close</button>`);
}
function dfShare(via){
  dfShareCollect();
  const o=dfO(), v=dfViewerDoc(o,DF_VIEW.ref), df=dfState(o);
  const names=dfShareRecips(o).filter(([k])=>DF_VIEW.sel.includes(k)).map(([,n])=>n);
  const exp=DF_VIEW.expiry==='Never'?'no expiry':DF_VIEW.expiry.replace(/^In /,'');
  if(via==='link'){DF_VIEW.share=false;dfViewerRender();showToast(`Secure link copied · ${DF_VIEW.expiry==='Never'?'never expires':'expires '+DF_VIEW.expiry.toLowerCase()}`);return;}
  if(!names.length){showToast('Pick at least one recipient');return;}
  const to=names.join(', ');
  df.shares=df.shares||{}; (df.shares[v.ref]=df.shares[v.ref]||[]).push({to,via,access:DF_VIEW.access,expiry:DF_VIEW.expiry,note:DF_VIEW.note,at:'Just now'});
  dfLog(o,`Shared ${v.label} with ${to}`,`You · ${via} · secure link, ${DF_VIEW.access.toLowerCase()}, ${exp}${DF_VIEW.note?' · “'+DF_VIEW.note+'”':''}`);
  DF_VIEW.share=false; DF_VIEW.note=''; renderDeal(); dfViewerRender();
  showToast(`${v.label} shared with ${to} by ${via}`);
}

// ---------- funding type (DF04) ----------
function dfFundingOpen(pick){
  const o=dfO(), df=dfState(o); pick=pick||df.funding;
  const now=DF_TPL.steps[1].slots(df.funding).filter(id=>dfSlotState(o,id)!=='na');
  const nxt=DF_TPL.steps[1].slots(pick).filter(id=>!(DF_SLOTS[id].cond&&DF_SLOTS[id].cond(df,o)));
  const added=nxt.filter(id=>!now.includes(id)), removed=now.filter(id=>!nxt.includes(id));
  dfModal('Change funding type',`
    <div class="df-seg" role="radiogroup" aria-label="Funding type">${Object.entries(DF_FUND).map(([k,l])=>`<button type="button" role="radio" aria-checked="${k===pick}" class="${k===pick?'on':''}" onclick="dfFundingOpen('${k}')">${l}</button>`).join('')}</div>
    <input type="hidden" id="dfFundPick" value="${pick}">
    <div class="df-eyebrow">Step 2 becomes ${dfEsc(DF_TPL.steps[1].label(pick))}</div>
    ${pick===df.funding?'<div class="df-mu">No change.</div>':[...added.map(id=>`<div class="df-att"><span class="df-tag ok">Added</span><span>${DF_SLOTS[id].label}</span></div>`),...removed.map(id=>`<div class="df-att"><span class="df-tag bad">Removed</span><span>${DF_SLOTS[id].label}${dfSlotState(o,id)==='accepted'?' · file kept in register':''}</span></div>`)].join('')||'<div class="df-mu">Same documents, new label.</div>'}
    <label class="df-field"><span>Reason</span><textarea id="dfFundReason" rows="2" placeholder="e.g. Loan refused, buyer switching to cash"></textarea></label>
    <div class="df-mu">Accepted files stay in the register. If step 2 is no longer complete, the deal steps back to it.</div>`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfFundingSave()">Change funding</button>`);
}
function dfFundingSave(){
  const o=dfO(), df=dfState(o), pick=dfVal('dfFundPick'), reason=dfVal('dfFundReason');
  if(pick===df.funding){dfModalClose();return;}
  if(!reason){dfModalErr('Add a reason for the change.');return;}
  const snap=dfSnap(o), from=DF_FUND[df.funding]; df.funding=pick;
  const undoId=dfArmUndo(o,snap,'funding change');
  dfLog(o,`Funding changed · ${from} → ${DF_FUND[pick]}`,`You · ${reason}`,{undoId});
  dfAfter(o,'Funding type change'); dfModalClose(); dfRefresh(); dfToast(`Funding set to ${DF_FUND[pick]} · step 2 is now ${DF_TPL.steps[1].label(pick)}`,o.id);
}

// ---------- deed appointment: book, outcome, complete, handover (DF06/07) ----------
function dfBookOpen(){
  const o=dfO(), df=dfState(o), a=df.appt, t=dfParseDate(a.date||a.target)||new Date(2026,10,28);
  const iso=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  dfModal(a.state==='confirmed'?'Reschedule final deed':'Book final deed appointment',`
    <div class="df-grid2"><label class="df-field"><span>Date</span><input type="date" id="dfBkDate" value="${iso}"></label><label class="df-field"><span>Time</span><input type="time" id="dfBkTime" value="${a.time||'10:00'}"></label></div>
    <label class="df-field"><span>Notary office</span><input id="dfBkPlace" value="${dfEsc(a.place||'Notary’s office, Valletta')}"></label>
    <div class="df-eyebrow">Attendees · prefilled by role</div>
    ${dfAttendees(o).map(t=>`<label class="df-task"><input type="checkbox" checked><span>${dfEsc(t.name)}</span><span class="df-mu">${t.role}</span></label>`).join('')}
    ${df.funding==='cash'?'<div class="df-mu">No bank representative · cash buyer</div>':''}
    <div class="df-seg" role="radiogroup" aria-label="Booking status"><button type="button" role="radio" aria-checked="${a.state!=='tentative'}" class="${a.state!=='tentative'?'on':''}" onclick="dfSeg(this,'dfBkState','confirmed')">Confirmed with notary</button><button type="button" role="radio" aria-checked="${a.state==='tentative'}" class="${a.state==='tentative'?'on':''}" onclick="dfSeg(this,'dfBkState','tentative')">Tentative</button></div>
    <input type="hidden" id="dfBkState" value="${a.state==='tentative'?'tentative':'confirmed'}">
    <div class="df-mu">Booking never moves a step. Tentative doesn’t count as scheduled. Invites and calendar sync go out on save.</div>`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfBookSave()">Save booking</button>`);
}
function dfSeg(btn,inputId,val){btn.parentElement.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b===btn);b.setAttribute('aria-checked',b===btn);});document.getElementById(inputId).value=val;}
function dfBookSave(){
  const o=dfO(), df=dfState(o), date=dfVal('dfBkDate'), time=dfVal('dfBkTime'), place=dfVal('dfBkPlace'), state=dfVal('dfBkState');
  if(!date||!time||!place){dfModalErr('Pick a date, time and office.');return;}
  const snap=dfSnap(o), was=df.appt.state;
  Object.assign(df.appt,{state,date:dfFmtIso(date),time,place});
  const undoId=dfArmUndo(o,snap,'deed booking');
  dfLog(o,`Final deed appointment ${was==='confirmed'?'rescheduled':state==='tentative'?'proposed':'booked'} · ${df.appt.date}, ${time}`,`You · ${place}${state==='confirmed'?' · invites sent':''}`,{undoId});
  dfSync(o); dfModalClose(); dfRefresh(); dfToast(`${state==='tentative'?'Tentative deed':'Deed'} ${df.appt.date}, ${time}. Steps unchanged.`,o.id);
}
function dfReminder(){const o=dfO();dfLog(o,'Deed reminder drafted for the buyer · what-to-bring list','You · approved template');renderDeal();showToast('Reminder drafted from the approved template. Review before sending.');}
function dfOutcomeOpen(){
  dfModal('Record deed outcome',`
    <div class="df-seg" role="radiogroup" aria-label="Outcome"><button type="button" role="radio" aria-checked="true" class="on" onclick="dfSeg(this,'dfOcK','signed');dfOcFields()">Signed</button><button type="button" role="radio" aria-checked="false" onclick="dfSeg(this,'dfOcK','postponed');dfOcFields()">Postponed</button><button type="button" role="radio" aria-checked="false" onclick="dfSeg(this,'dfOcK','not');dfOcFields()">Did not go ahead</button></div>
    <input type="hidden" id="dfOcK" value="signed"><div id="dfOcF"></div>`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfOutcomeSave()">Save outcome</button>`);
  dfOcFields();
}
function dfOcFields(){
  const k=dfVal('dfOcK'), el=document.getElementById('dfOcF'); if(!el) return;
  el.innerHTML=k==='signed'?'<div class="df-mu">Signed doesn’t complete the step. It opens the signed deed and final balance receipt slots; the sale completes when a manager approves the signed deed.</div>'
    :k==='postponed'?'<div class="df-grid2"><label class="df-field"><span>New date</span><input type="date" id="dfOcDate"></label><label class="df-field"><span>Reason</span><input id="dfOcWhy" placeholder="e.g. Bank funds not released"></label></div><div class="df-mu">Attendees are re-notified. Two postponements flag the deal At risk.</div>'
    :'<label class="df-field"><span>Reason</span><input id="dfOcWhy"></label><div class="df-mu">The manager is notified.</div>';
}
function dfOutcomeSave(){
  const o=dfO(), df=dfState(o), k=dfVal('dfOcK'), snap=dfSnap(o);
  if(k==='postponed'&&(!dfVal('dfOcDate')||!dfVal('dfOcWhy'))){dfModalErr('Add the new date and a reason.');return;}
  if(k==='not'&&!dfVal('dfOcWhy')){dfModalErr('Add a reason.');return;}
  let msg;
  if(k==='signed'){df.signed=true;df.appt.state='held';msg='Outcome recorded: signed · upload the signed deed and final balance receipt';}
  else if(k==='postponed'){df.appt.postponed++;df.appt.date=dfFmtIso(dfVal('dfOcDate'));msg=`Deed postponed to ${df.appt.date} · ${dfVal('dfOcWhy')}`;}
  else{df.appt.state='target';msg=`Deed did not go ahead · ${dfVal('dfOcWhy')} · manager notified`;}
  const undoId=dfArmUndo(o,snap,'deed outcome');
  dfLog(o,msg,'You · deed appointment',{undoId});
  dfSync(o); dfModalClose(); dfRefresh(); dfToast(msg,o.id);
}
function dfCompleteOpen(){
  if(!dfIsManager()){showToast('Only users with completion permission can complete a sale');return;}
  const o=dfO(), df=dfState(o), P=dfProgress(o), rec=df.slots.deed||{};
  const others=P.steps[3].slots.filter(id=>id!=='deed'&&!['accepted','na','optional','exception'].includes(dfSlotState(o,id)));
  const earlier=P.steps.slice(0,3).filter(s=>!s.done);
  const cash=dfCash(o), u=UN(o.units[0]), comm=df.comm;
  const ready=!others.length&&!earlier.length;
  dfModal('Approve deed and complete sale',`
    <div class="df-eyebrow">Signed deed</div>
    ${(rec.fields||DF_SLOTS.deed.fields(o)).map(([k,v])=>`<div class="side-kv"><div class="k">${dfEsc(k)}</div><div class="v">${dfEsc(v)}</div></div>`).join('')}
    <div class="side-kv"><div class="k">File</div><div class="v">${dfEsc(rec.file||'—')}</div></div>
    <div class="df-eyebrow">On approval</div>
    <div class="df-att"><span>Unit ${dfEsc(o.units[0])}</span><span>${u?dfEsc(u.status):'—'} → <b>Sold</b></span></div>
    <div class="df-att"><span>${dfEsc(o.lead)}</span><span>Buyer → <b>Owner</b></span></div>
    <div class="df-att"><span>Balances left</span><span>${fmtEur(Math.max(0,cash.total-cash.confirmed))}</span></div>
    <div class="df-att"><span>Commission ${fmtEur(comm.total)}</span><span>${DF_COMM_ST[comm.state]} → <b>${comm.state==='agreed'&&comm.trigger==='deed'?'Earned':DF_COMM_ST[comm.state]}</b></span></div>
    <div class="df-att"><span>Notified</span><span>${dfEsc(comm.shares.map(s=>s.name.split(' ')[0]).join(', '))} · finance · ${dfEsc(o.devs[0])} team</span></div>
    ${ready?'':`<div class="df-warn">Still open: ${dfEsc([...earlier.map(s=>s.label),...others.map(id=>dfSlotInfo(o,id).label)].join(', '))}. Approving now accepts the deed; the sale completes when ${earlier.length?'the earlier steps and ':''}these land.</div>`}`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfCompleteSale()">${ready?'Approve and complete sale':'Approve deed'}</button>`,true);
}
function dfCompleteSale(){
  const o=dfO(), df=dfState(o), rec=df.slots.deed; if(!rec) return;
  const snap=dfSnap(o), me=dfMe();
  Object.assign(rec,{state:'accepted',note:`Manager approved — Today · ${me}`,by:me});
  const doc=ensureDocs(o,getExt(o)).find(d=>d.id===rec.docId); if(doc){doc.status='signed';doc.hist.push({t:'Today',who:me,act:'Approved'});}
  const P=dfProgress(o), ready=P.steps.slice(0,3).every(s=>s.done)&&P.steps[3].slots.filter(id=>id!=='deed').every(id=>['accepted','na','optional','exception'].includes(dfSlotState(o,id)));
  const undoId=dfArmUndo(o,snap,ready?'sale completion':'deed approval');
  dfLog(o,'Signed final deed approved',`${me} · manager`,{undoId});
  if(ready) dfFinish(o,me,undoId); else df.completionAuthorisedBy=me;
  dfAfter(o,'Signed final deed'); dfModalClose(); dfRefresh();
  dfToast(ready?`Sale completed · ${o.units[0]} moved to Sold · ${o.lead} is now an owner`:'Signed deed approved · the sale completes when the remaining documents land',o.id);
}
function dfFinish(o,by,undoId){
  const df=dfState(o), u=UN(o.units[0]), comm=df.comm;
  df.completed={date:`${DF_TODAY.getDate()} ${DF_MON[DF_TODAY.getMonth()]} ${DF_TODAY.getFullYear()}`,by:`${by} · manager`};
  if(u) u.status='sold';
  o.completed={date:df.completed.date};
  dfLog(o,`Sale completed · unit ${o.units[0]} moved to Sold · ${o.lead} added as owner`,`Approved by ${by} · manager`,{strong:true,undoId});
  dfLog(o,'Step completed: Final deed appointment','Completed by Signed final deed · rule',{strong:true,undoId});
  if(comm.state==='agreed'&&comm.trigger==='deed'){comm.state='earned';dfLog(o,`Commission moved to Earned · ${fmtEur(comm.total)}`,'Rule · earned at final deed',{undoId});}
  if(typeof ojConfetti==='function') setTimeout(ojConfetti,50);
}
function dfHandoverOpen(){
  const o=dfO(), df=dfState(o); renderDeal();
  dfModal('Handover record',`
    <div class="df-mu">${df.handoverAtDeed?'Handover at the deed appointment.':`Separate handover appointment${df.delivery?', '+dfEsc(df.delivery):''}.`} Never gates completion.</div>
    <div class="df-grid2"><label class="df-field"><span>Keys handed over</span><input id="dfHoKeys" type="number" min="0" value="3"></label><label class="df-field"><span>Fobs</span><input id="dfHoFobs" type="number" min="0" value="2"></label>
    <label class="df-field"><span>Electricity meter</span><input id="dfHoEl" placeholder="kWh reading"></label><label class="df-field"><span>Water meter</span><input id="dfHoWa" placeholder="m³ reading"></label></div>
    <label class="df-drop"><input type="file" id="dfHoPh" multiple accept="image/*" onchange="this.nextElementSibling.textContent=this.files.length?this.files.length+' photo'+(this.files.length===1?'':'s')+' added':'Drop handover photos'"><span>Drop handover photos</span></label>
    <label class="df-field"><span>Notes</span><textarea id="dfHoNote" rows="2"></textarea></label>
    <div class="df-mu">Signed handover form is optional on ${dfEsc(o.devs[0])}. Recorded by ${dfEsc(dfMe())}.</div>`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfHandoverSave()">Save handover</button>`);
}
function dfHandoverSave(){
  const o=dfO(), df=dfState(o);
  df.handover={keys:+dfVal('dfHoKeys')||0,fobs:+dfVal('dfHoFobs')||0,electricity:dfVal('dfHoEl'),water:dfVal('dfHoWa'),photos:document.getElementById('dfHoPh')?.files.length||0,notes:dfVal('dfHoNote'),by:dfMe(),at:'Today'};
  dfLog(o,`Handover recorded · ${df.handover.keys} keys, ${df.handover.fobs} fobs${df.handover.photos?`, ${df.handover.photos} photos`:''}`,`${dfMe()} · handover`);
  dfModalClose(); dfRefresh(); showToast('Handover recorded');
}
function dfReopenOpen(){
  renderDeal();
  dfModal('Reopen deal',`<label class="df-field"><span>Reason</span><textarea id="dfRoWhy" rows="2"></textarea></label><div class="df-mu">Reopening keeps every accepted document. The unit stays Sold until a manager changes it.</div>`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfReopenSave()">Reopen</button>`);
}
function dfReopenSave(){
  const o=dfO(), df=dfState(o), why=dfVal('dfRoWhy'); if(!why){dfModalErr('Add a reason.');return;}
  const snap=dfSnap(o); df.completed=null; delete o.completed;
  const undoId=dfArmUndo(o,snap,'reopen');
  dfLog(o,'Deal reopened at Final deed appointment',`${dfMe()} · ${why}`,{undoId});
  dfAfter(o,'Manager reopen'); dfModalClose(); dfRefresh(); dfToast('Deal reopened',o.id);
}
function dfCollapseOpen(){
  dfModal('Cancel deal · request POS collapse',`<label class="df-field"><span>Reason code</span><select id="dfClWhy"><option>Loan refused within the financing window</option><option>Buyer withdrew</option><option>Searches not clear</option><option>Other</option></select></label>
    <label class="df-field"><span>Note</span><textarea id="dfClNote" rows="2"></textarea></label><div class="df-mu">Collapse needs manager approval. Nothing changes until it’s approved.</div>`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfCollapseSave()">Send for approval</button>`);
}
function dfCollapseSave(){
  const o=dfO();
  dfLog(o,`POS collapse requested · ${dfVal('dfClWhy')}`,`You · ${dfVal('dfClNote')||'awaiting manager approval'}`);
  dfModalClose(); renderDeal(); showToast('Collapse request sent to your manager');
}
function dfEditOpen(){
  const o=dfO(), df=dfState(o), owner=dfCommOwner(df.comm)?.name||o.rep;
  dfModal('Edit deal details',`
    <div class="df-grid2"><label class="df-field"><span>Sale price (€)</span><input id="dfEdPrice" inputmode="decimal" value="${o.value*1000}"></label><label class="df-field"><span>Target deed</span><input id="dfEdDeed" value="${dfEsc(df.appt.target||'')}" placeholder="e.g. 28 Nov"></label></div>
    <label class="df-field"><span>Deal owner</span><select id="dfEdOwner">${dfReps().map(r=>`<option ${r===owner?'selected':''}>${dfEsc(r)}</option>`).join('')}</select></label>
    <div class="side-kv"><div class="k">Commission</div><div class="v">${comm_line(df.comm)} · <button type="button" class="df-link" onclick="dfModalClose();dfSplitOpen()">Edit team &amp; split</button></div></div>
    <label class="df-field"><span>Reason</span><textarea id="dfEdWhy" rows="2"></textarea></label>
    <div class="df-mu">Changes re-check the slots and payment rows and are logged.</div>`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfEditSave()">Save changes</button>`);
  function comm_line(c){return `${fmtEur(c.total)} · ${c.rate}% · ${DF_COMM_ST[c.state]}`;}
}
function dfEditSave(){
  const o=dfO(), df=dfState(o), comm=df.comm, why=dfVal('dfEdWhy'), price=Number(dfVal('dfEdPrice').replace(/[^\d.]/g,'')), owner=dfVal('dfEdOwner'), deed=dfVal('dfEdDeed');
  if(!why){dfModalErr('Add a reason for the change.');return;}
  if(!(price>0)){dfModalErr('Enter a valid sale price.');return;}
  const changes=[];
  if(price!==o.value*1000){changes.push(`price ${fmtEur(o.value*1000)} → ${fmtEur(price)}`);o.value=price/1000;comm.total=Math.round(price*comm.rate)/100;}
  if(deed&&deed!==df.appt.target){changes.push(`target deed ${df.appt.target||'—'} → ${deed}`);df.appt.target=deed;}
  const cur=dfCommOwner(comm);
  if(cur&&owner&&owner!==cur.name){changes.push(`deal owner ${cur.name} → ${owner}`);const dup=comm.shares.find(s=>s.name===owner&&s!==cur);if(dup){cur.pct=+cur.pct+ +dup.pct;comm.shares=comm.shares.filter(s=>s!==dup);}cur.name=owner;o.rep=owner;}
  if(!changes.length){dfModalClose();return;}
  dfLog(o,`Deal details edited · ${changes.join(' · ')}`,`You · ${why}`);
  dfAfter(o,'Deal edit'); dfModalClose(); dfRefresh(); showToast('Deal updated');
}

// ---------- sales team & split editor (shared by conversion and the deal's commission card) ----------
let DFS=null;
function dfSplitDraft(o,comm){
  return {oppId:o.id,price:o.value*1000,rate:comm?comm.rate:DF_COMM_RULE.rate,trigger:comm?comm.trigger:DF_COMM_RULE.trigger,note:comm?.note||'',
    shares:comm?comm.shares.map(s=>({kind:s.kind,name:s.name,role:s.role,pct:s.pct,paid:s.paid||0})):[{kind:'internal',name:o.rep,role:'Deal owner',pct:100,paid:0}]};
}
function dfSplitTotal(){return Math.round(DFS.price*(+DFS.rate||0))/100;}
function dfSplitCollect(){
  if(!DFS) return;
  const r=document.getElementById('dfs-rate'); if(r) DFS.rate=+r.value;
  const t=document.getElementById('dfs-trigger'); if(t) DFS.trigger=t.value;
  const n=document.getElementById('dfs-note'); if(n) DFS.note=n.value;
  const p=document.getElementById('dfc-price'); if(p) DFS.price=Number(p.value.replace(/[^\d.]/g,''))||DFS.price;
  document.querySelectorAll('.dfs-row').forEach(row=>{
    const s=DFS.shares[+row.dataset.i]; if(!s) return;
    s.name=row.querySelector('.dfs-name').value; s.role=row.querySelector('.dfs-role').value; s.pct=+row.querySelector('.dfs-pct').value;
  });
}
function dfSplitIssues(){
  const sum=Math.round(DFS.shares.reduce((a,s)=>a+(+s.pct||0),0)*100)/100, issues=[];
  if(!(DFS.rate>0&&DFS.rate<=10)) issues.push('Set a commission rate between 0 and 10%.');
  if(sum!==100) issues.push(`Shares add up to ${sum}%. They must total 100%.`);
  if(DFS.shares.filter(s=>s.role==='Deal owner').length!==1) issues.push('Pick exactly one deal owner.');
  if(DFS.shares.some(s=>s.role==='Deal owner'&&s.kind!=='internal')) issues.push('The deal owner must be on your team.');
  if(DFS.shares.some(s=>!s.name)) issues.push('Choose a person for every row.');
  if(new Set(DFS.shares.map(s=>s.name)).size!==DFS.shares.length) issues.push('Each person can appear once.');
  if(DFS.shares.some(s=>!(+s.pct>0))) issues.push('Every share needs a percentage above 0.');
  return {sum,issues};
}
function dfSplitTeamHtml(){
  const total=dfSplitTotal(), {sum,issues}=dfSplitIssues();
  const devs=dfSplitDeviation(), mgr=dfIsManager();
  const opt=(list,val)=>`<option value="">Choose…</option>`+list.map(([v,l])=>`<option value="${dfEsc(v)}" ${v===val?'selected':''}>${dfEsc(l)}</option>`).join('');
  return `<div class="df-grid2">
      <label class="df-field"><span>Commission rate (% of sale)</span><input id="dfs-rate" type="number" min="0" max="10" step="0.1" value="${DFS.rate}" oninput="dfSplitRecalc()"></label>
      <label class="df-field"><span>Earned</span><select id="dfs-trigger" onchange="dfSplitRerender()">${Object.entries(DF_TRIGGERS).map(([k,l])=>`<option value="${k}" ${k===DFS.trigger?'selected':''}>${l}</option>`).join('')}</select></label>
    </div>
    <div class="df-split-total"><span class="df-mu">Total commission</span><b id="dfs-total">${fmtEur(total)}</b></div>
    <div class="df-split-rows" role="list" aria-label="Sales team">
      ${DFS.shares.map((s,i)=>`<div class="dfs-row" role="listitem" data-i="${i}">
        <span class="df-av ${s.kind}" aria-hidden="true">${s.name?initials(s.name):'?'}</span>
        <select class="dfs-name" aria-label="Person" onchange="dfSplitRerender()">${s.kind==='internal'?opt(dfReps().map(r=>[r,r]),s.name):opt(dfAgents().map(c=>[c.name,`${c.name} · ${c.company}`]),s.name)}</select>
        <select class="dfs-role" aria-label="Role" onchange="dfSplitRerender()">${DF_ROLES[s.kind].map(r=>`<option ${r===s.role?'selected':''}>${r}</option>`).join('')}</select>
        <span class="dfs-pctw"><input class="dfs-pct" type="number" min="0" max="100" step="1" value="${s.pct}" aria-label="Share percent" oninput="dfSplitRecalc()">%</span>
        <b class="dfs-amt">${fmtEur(Math.round(total*(+s.pct||0))/100)}</b>
        ${DFS.shares.length>1?`<button type="button" class="tool" aria-label="Remove ${dfEsc(s.name||'row')}" onclick="dfSplitRemove(${i})">${sbIcon('x')}</button>`:'<span></span>'}
      </div>`).join('')}
    </div>
    <div class="df-acts"><button type="button" class="btn-ghost df-sm" onclick="dfSplitAdd('internal')">+ Add rep</button><button type="button" class="btn-ghost df-sm" onclick="dfSplitAdd('external')">+ Add external agent</button></div>
    <div id="dfs-check" class="df-split-check ${issues.length?'bad':'ok'}">${issues.length?dfEsc(issues[0]):`Shares total ${sum}% ✓`}</div>
    <div id="dfs-rule" class="df-split-rule ${devs.length?'warn':''}">${devs.length
      ?`<b>Differs from the default:</b> ${dfEsc(devs.join(' · '))}. ${mgr?'You’re a manager, so it’s agreed on save and logged.':`Goes to ${DF_COMM_RULE.approver} for approval. Commission shows Awaiting approval until then; the deal itself isn’t held up.`}`
      :`Matches the default rule (${DF_COMM_RULE.rate}%, 100% to the deal owner, earned at final deed). Agreed on save.`}</div>
    <label class="df-field"><span>Note for the approver (optional)</span><input id="dfs-note" value="${dfEsc(DFS.note)}" placeholder="e.g. Sam ran both appointments"></label>`;
}
function dfSplitDeviation(){return dfCommDeviation({rate:+DFS.rate,trigger:DFS.trigger,shares:DFS.shares});}
function dfSplitRecalc(){
  dfSplitCollect(); const total=dfSplitTotal(), {sum,issues}=dfSplitIssues();
  document.getElementById('dfs-total').textContent=fmtEur(total);
  document.querySelectorAll('.dfs-row').forEach(row=>{const s=DFS.shares[+row.dataset.i];row.querySelector('.dfs-amt').textContent=fmtEur(Math.round(total*(+s.pct||0))/100);});
  const c=document.getElementById('dfs-check'); c.className='df-split-check '+(issues.length?'bad':'ok'); c.textContent=issues.length?issues[0]:`Shares total ${sum}% ✓`;
  const devs=dfSplitDeviation(), r=document.getElementById('dfs-rule');
  r.className='df-split-rule '+(devs.length?'warn':'');
  r.innerHTML=devs.length?`<b>Differs from the default:</b> ${dfEsc(devs.join(' · '))}. ${dfIsManager()?'You’re a manager, so it’s agreed on save and logged.':`Goes to ${DF_COMM_RULE.approver} for approval. Commission shows Awaiting approval until then; the deal itself isn’t held up.`}`:`Matches the default rule (${DF_COMM_RULE.rate}%, 100% to the deal owner, earned at final deed). Agreed on save.`;
}
function dfSplitRerender(collect=true){if(collect)dfSplitCollect();const el=document.getElementById('dfs-team');if(el)el.innerHTML=dfSplitTeamHtml();}
function dfSplitAdd(kind){
  dfSplitCollect();
  const owner=DFS.shares.find(s=>s.role==='Deal owner'), give=kind==='external'?50:30;
  if(owner&&owner.pct>give) owner.pct=+owner.pct-give;
  DFS.shares.push({kind,name:'',role:kind==='external'?'External agency':'Co-rep',pct:owner?give:0,paid:0});
  dfSplitRerender(false);
}
function dfSplitRemove(i){
  dfSplitCollect();
  const [gone]=DFS.shares.splice(i,1), owner=DFS.shares.find(s=>s.role==='Deal owner');
  if(owner&&gone) owner.pct=+owner.pct+ +gone.pct;
  dfSplitRerender(false);
}
// Writes the draft to the deal; returns the deviation reasons so the caller can route it.
function dfSplitApply(o,reason){
  const df=dfState(o), comm=df.comm, devs=dfSplitDeviation();
  comm.rate=+DFS.rate; comm.trigger=DFS.trigger; comm.total=dfSplitTotal(); comm.note=DFS.note;
  comm.shares=DFS.shares.map(s=>({id:crypto.randomUUID(),kind:s.kind,name:s.name,role:s.role,pct:+s.pct,paid:s.paid||0,company:s.kind==='external'?dfContact(s.name)?.company||'':''}));
  const owner=dfCommOwner(comm); if(owner) o.rep=owner.name;
  if(devs.length&&!dfIsManager()){dfCommRequest(o,devs);}
  else{
    comm.state=comm.trigger==='pos'||df.completed?'earned':'agreed';
    comm.approval=devs.length?{status:'approved',by:dfMe(),at:'Today',reasons:devs}:{status:'not_needed'};
    const open=dfCommOpenRequest(o); if(open) Object.assign(open,{decided:'rejected',by:'System',decidedAt:'Just now',reason:'Superseded by a newer split'});
  }
  dfLog(o,`Sales team & split ${reason?'edited':'set'} · ${dfCommSummary(comm)}`,`${dfMe()}${reason?' · '+reason:''}${comm.state==='pending'?` · sent to ${DF_COMM_RULE.approver} for approval`:devs.length?' · approved as manager':' · default rule'}`);
  dfSync(o);
  return devs;
}
function dfSplitOpen(){
  const o=dfO(), df=dfState(o); DF_UI.menu=false; renderDeal();
  if(!['pending','changes','agreed','estimated'].includes(df.comm.state)){showToast('The split is locked once commission is earned. Raise a dispute instead.');return;}
  DFS=dfSplitDraft(o,df.comm);
  dfDrawer('Edit sales team & split',`<p class="df-mu">${dfEsc(o.lead)} · ${dfEsc(o.units[0])} · ${fmtEur(o.value*1000)}</p><div id="dfs-team">${dfSplitTeamHtml()}</div>
    <label class="df-field"><span>Reason for the change</span><textarea id="dfs-why" rows="2"></textarea></label>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="dfSplitSave()">Save split</button>`,560);
}
function dfSplitSave(){
  dfSplitCollect(); const {issues}=dfSplitIssues(), why=dfVal('dfs-why');
  if(issues.length){showToast(issues[0]);return;}
  if(!why){showToast('Add a reason for the change');return;}
  const o=OPPS.find(r=>r.id===DFS.oppId), devs=dfSplitApply(o,why);
  qaDrawerClose(); dfRefresh();
  showToast(dfState(o).comm.state==='pending'?`Split sent to ${DF_COMM_RULE.approver} for approval`:'Sales team & split saved');
}
function dfCommPayable(){
  const o=dfO(), comm=dfState(o).comm; if(!dfIsManager()) return;
  comm.state='payable'; dfLog(o,`Commission marked payable · ${fmtEur(comm.total)}`,`${dfMe()} · manager`); dfSync(o); dfRefresh(); showToast('Commission marked payable');
}
function dfPayoutOpen(){
  const o=dfO(), comm=dfState(o).comm;
  dfDrawer('Record commission payout',`<p class="df-mu">${dfEsc(comm.payer)} pays each share. Part payments are fine.</p>
    ${comm.shares.map((s,i)=>{const left=Math.max(0,dfShareAmt(comm,s)-s.paid);return `<label class="df-field"><span>${dfEsc(s.name)}${s.company?' · '+dfEsc(s.company):''} · ${fmtEur(left)} left</span><input id="dfpo-${i}" type="number" min="0" max="${left}" step="0.01" value="${left}"></label>`;}).join('')}
    <label class="df-field"><span>Payment reference</span><input id="dfpo-ref"></label>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="dfPayoutSave()">Save payout</button>`);
}
function dfPayoutSave(){
  const o=dfO(), comm=dfState(o).comm, ref=dfVal('dfpo-ref'); if(!ref){showToast('Add the payment reference');return;}
  const paid=[];
  comm.shares.forEach((s,i)=>{const left=Math.max(0,dfShareAmt(comm,s)-s.paid), v=Math.min(left,Math.max(0,+dfVal('dfpo-'+i)||0));if(v>0){s.paid=Math.round((s.paid+v)*100)/100;paid.push(`${fmtEur(v)} to ${s.name}`);}});
  if(!paid.length){showToast('Enter at least one amount');return;}
  comm.state=comm.shares.every(s=>s.paid>=dfShareAmt(comm,s)-0.005)?'settled':'part';
  dfLog(o,`Commission payout · ${paid.join(' · ')}`,`${dfMe()} · ref ${ref}`);
  dfSync(o); qaDrawerClose(); dfRefresh(); showToast(comm.state==='settled'?'Commission settled':'Payout recorded · part settled');
}
function dfDisputeOpen(){
  const o=dfO(), comm=dfState(o).comm; DF_UI.menu=false; renderDeal();
  if(comm.disputed){comm.disputed=null;dfLog(o,'Commission dispute resolved',dfMe());renderDeal();showToast('Dispute resolved');return;}
  dfModal('Flag a commission dispute',`<label class="df-field"><span>What’s disputed?</span><textarea id="dfDsWhy" rows="2" placeholder="e.g. Co-rep share not agreed"></textarea></label><div class="df-mu">The flag sits on top of the status. It never holds back the buyer’s deal.</div>`,
    `<button class="btn-ghost" onclick="dfModalClose()">Cancel</button><button class="btn-primary" onclick="dfDisputeSave()">Flag dispute</button>`);
}
function dfDisputeSave(){
  const o=dfO(), why=dfVal('dfDsWhy'); if(!why){dfModalErr('Describe the dispute.');return;}
  dfState(o).comm.disputed={reason:why,by:dfMe(),at:'Today'}; dfLog(o,`Commission disputed · ${why}`,dfMe());
  dfModalClose(); renderDeal(); showToast('Dispute flagged on the commission');
}

// ---------- conversion: Confirm POS & create deal ----------
let DFC=null;
function dfConvertOpen(oppId,origin){
  const o=OPPS.find(r=>r.id===oppId); if(!o||dealFor(o.id)) return;
  const x=getExt(o);
  DFC={oppId,origin,funding:dfGuessFunding(o,x),pos:dealToday()};
  DFS=dfSplitDraft(o,null);
  dfConvertRender();
}
function dfConvertRender(){
  const o=OPPS.find(r=>r.id===DFC.oppId), x=getExt(o), docs=ensureDocs(o,x);
  const has=rx=>docs.some(d=>d.file&&rx.test(d.label)&&['signed','filed','verified'].includes(d.status));
  const carry=[['Promise of Sale (POS)',has(/promise of sale/i)],['Deposit receipt',has(/deposit/i)],['Provisional duty receipt',has(/provisional duty/i)]];
  dfDrawer('Confirm POS & create deal',`
    <p class="df-mu">${dfEsc(o.lead)} · ${dfEsc(o.units[0]||'No unit')} · ${dfEsc(o.devs[0])}. The opportunity hands off here; the deal follows the ${DF_TPL.label} template.</p>
    <div class="df-grid2"><label class="df-field"><span>Agreed price (€)</span><input id="dfc-price" inputmode="decimal" value="${DFS.price}" oninput="dfSplitRecalc()"></label><label class="df-field"><span>POS signed</span><input id="dfc-pos" type="date" value="${DFC.pos}" max="${dealToday()}"></label></div>
    <div class="df-field"><span>Funding type</span><div class="df-seg" role="radiogroup" aria-label="Funding type">${Object.entries(DF_FUND).map(([k,l])=>`<button type="button" role="radio" aria-checked="${k===DFC.funding}" class="${k===DFC.funding?'on':''}" onclick="dfConvFunding('${k}')">${l}</button>`).join('')}</div>
      <span class="df-mu">Step 2 will be ${dfEsc(DF_TPL.steps[1].label(DFC.funding))}.</span></div>
    <div class="df-eyebrow">Step 1 documents · carried over from Offer Progress</div>
    ${carry.map(([l,ok])=>`<div class="df-att"><span class="df-dot ${ok?'on':''}"></span><span>${l}</span><span class="df-mu">${ok?'On file':'Missing · stays on the next-step card'}</span></div>`).join('')}
    <div class="df-eyebrow">Sales team &amp; commission</div>
    <div id="dfs-team">${dfSplitTeamHtml()}</div>`,
    `<button class="btn-ghost" onclick="dfConvertCancel()">Cancel</button><button class="btn-primary" onclick="dfConvertSave()">Create deal</button>`,600);
}
function dfConvFunding(k){dfSplitCollect();DFC.pos=dfVal('dfc-pos')||DFC.pos;DFC.funding=k;dfConvertRender();}
function dfConvertCancel(){DFC=null;DFS=null;qaDrawerClose();if(typeof renderBoard==='function')renderBoard();}
function dfConvertSave(){
  dfSplitCollect(); const {issues}=dfSplitIssues();
  const pos=dfVal('dfc-pos'); if(!pos){showToast('Add the POS signed date');return;}
  if(!(DFS.price>0)){showToast('Enter the agreed price');return;}
  if(issues.length){showToast(issues[0]);return;}
  const o=OPPS.find(r=>r.id===DFC.oppId), x=getExt(o), origin=DFC.origin;
  if(origin==='journey'){x.jstage='pos';x.done=[];x.blocker=null;x.comms.unshift({ch:'sys',t:'Just now',text:'Stage advanced to POS Signed'});}
  o.stage='Closed Won'; o.value=DFS.price/1000;
  const d=ensureDeal(o); d.pos=dfFmtIso(pos).replace(/^[A-Za-z]{3}\s+/,'');
  delete o.closed.df; o.closed.step=0;
  const df=dfState(o); df.funding=DFC.funding;
  const devs=dfSplitApply(o,'');
  x.comms.unshift({ch:'sys',t:'Just now',text:'POS signed — deal '+d.id+' created'});
  dfAfter(o,'Documents carried over from Offer Progress');
  DFC=null; DFS=null; qaDrawerClose();
  if(origin==='journey'&&typeof renderOpp==='function'&&document.getElementById('p-opp')?.classList.contains('on')){renderOpp();if(typeof ojConfetti==='function')ojConfetti();}
  pipeRenderAll(); if(typeof renderDeals==='function') renderDeals();
  showToast(`📄 POS signed — ${d.id} created${dfState(o).comm.state==='pending'?` · split sent to ${DF_COMM_RULE.approver.split(' ')[0]} for approval`:''}`);
  return d;
}

// ---------- hooks into the rest of the prototype ----------
(function(){
  const baseOpen=window.openDeal;
  window.openDeal=function(id){DF_UI.pop=null;DF_UI.menu=false;DF_UI.feed='all';DF_UI.feedAll=false;baseOpen.apply(this,arguments);};
  const baseRefresh=window.dealEventRefresh;
  window.dealEventRefresh=function(){const o=dealCur&&dealOpp(dealCur);if(o&&o.closed)dfAfter(o,'Payment receipt');baseRefresh.apply(this,arguments);};
  const baseClose=window.qaDrawerClose;
  window.qaDrawerClose=function(){baseClose.apply(this,arguments);const dr=document.getElementById('qaDrawer');if(dr)dr.style.width='440px';};
})();
// Deals list + dashboards: the four-step stepper and status follow the deal's slots.
window.closedStepLabel=function(o){
  if(!o.closed) return '';
  const df=dfState(o), P=dfProgress(o), st=dfStatus(o);
  if(df.completed) return `<b>Completed</b> — commission ${DF_COMM_ST[df.comm.state].toLowerCase()}`;
  return `<b>${dfEsc(P.steps[P.cur].label)}</b> · ${P.steps[P.cur].acc} of ${P.steps[P.cur].req} docs${st[1]==='bad'?` <span class="stall">· ${st[0]}</span>`:''}`;
};
function dfListComm(o){const comm=dfState(o).comm,n=comm.shares.length;return `Commission · ${DF_COMM_ST[comm.state]}${n>1?` · ${n} people`:''}${comm.disputed?' · disputed':''}`;}
function dfReady(o){
  const P=dfProgress(o);
  return P.steps.slice(0,3).every(s=>s.done)&&P.steps[3].slots.every(id=>['accepted','na','optional','exception'].includes(dfSlotState(o,id)));
}
(function(){
  const base=dfAfter;
  dfAfter=function(o,cause){
    const df=dfState(o);
    if(!df.completed&&df.completionAuthorisedBy&&dfReady(o)) dfFinish(o,df.completionAuthorisedBy);
    return base(o,cause);
  };
})();
// Seed every existing deal once so lists, dashboards and the approvals queue agree from the first render.
DEALS.forEach(d=>{const o=dealOpp(d);if(o&&o.closed){const df=dfState(o);if(df.comm.pendingSeed){delete df.comm.pendingSeed;dfCommRequest(o,df.comm.approval.reasons);}}});
