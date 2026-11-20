// Data activity: one history of every import (contacts, opportunities, deals, units, files).
// Opened pre-filtered from each list's Actions menu, from a development's Imports tab and from
// Settings › Data and privacy › Data activity. Also owns the contacts / opportunities / deals import flow.
// Loaded last: wraps go, renderDev, ctDetailsHtml, deImpApply and setPersona.
(function(){
const IH=window.IH={batches:[],seq:1048,recSeq:0,view:{type:'all',dev:'all',status:'all',q:'',from:null},open:null,rowF:'all',confirmUndo:false,flow:null};
const TYPES=[['contacts','Contacts'],['opportunities','Opportunities'],['deals','Deals'],['units','Units'],['files','Files']];
const TYPE_LABEL=Object.fromEntries(TYPES);
const TYPE_PAGE={contacts:'contacts',opportunities:'pipeline',deals:'deals',units:'properties'};
const IMPORTABLE=['contacts','opportunities','deals'];
const STATUS={applied:['Applied','ok'],waiting:['Waiting for approval','warn'],undone:['Undone','neu'],rejected:['Rejected','bad'],failed:['Failed','bad'],draft:['Saved as inventory batch','info'],attention:['Needs attention','warn']};
const OUTCOME={created:['Created','ok'],updated:['Matched','info'],skipped:['Skipped','neu'],failed:['Failed','bad']};
const UNDO_DAYS=7;
const esc=s=>(typeof xesc==='function'?xesc(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
const me=()=>(typeof PERSONAS!=='undefined'&&PERSONAS[curPersona]?.name)||'You';
const canImport=()=>['owner','manager'].includes(curPersona);
const canApprove=()=>curPersona==='owner';
const mins=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};
const hhmm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const ord=(days,m)=>1e9-days*1e4+m;
const normPhone=p=>String(p||'').replace(/[^\d]/g,'').replace(/^00/,'');
const updatedWord=t=>t==='units'?'updated':'matched';
const ic=p=>`<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${p}</svg>`;
const IC={imp:ic('<path d="M7 2v7M4.5 6.5L7 9l2.5-2.5M2.5 11.5h9"/>'),exp:ic('<path d="M7 9V2M4.5 4.5L7 2l2.5 2.5M2.5 11.5h9"/>'),hist:ic('<circle cx="7" cy="7" r="5"/><path d="M7 4.2V7l2 1.3"/>')};
function chip(map,k,extra=''){const [l,t]=map[k]||[k,'neu'];return `<span class="ih-chip ${t}">${esc(extra||l)}</span>`;}
function nextId(){return 'IMP-'+(IH.seq++);}

// ---------- fields, mapping and sample files ----------
const FIELDS={
  contacts:[['name','Full name'],['first','First name'],['last','Last name'],['email','Email'],['phone','Phone'],['source','Source'],['btype','Buyer type'],['nat','Nationality'],['budget','Budget'],['rep','Assigned rep'],['tags','Tags'],['notes','Notes']],
  opportunities:[['name','Full name'],['first','First name'],['last','Last name'],['email','Email'],['phone','Phone'],['dev','Development'],['unit','Unit'],['stage','Stage'],['budget','Budget'],['source','Source'],['rep','Assigned rep'],['notes','Notes']],
  deals:[['name','Buyer name'],['email','Email'],['phone','Phone'],['dev','Development'],['unit','Unit'],['price','Agreed price'],['pos','POS signed date'],['rep','Assigned rep']],
};
const SYN={name:['name','full name','buyer','buyer name','contact','client','lead'],first:['first name','first','given name'],last:['last name','surname','family name'],email:['email','e-mail','email address','mail'],
  phone:['phone','mobile','telephone','tel','phone number','whatsapp'],source:['source','lead source','channel','origin'],btype:['buyer type','type','client type'],nat:['nationality','country'],budget:['budget','max budget','budget eur'],
  rep:['rep','agent','owner','assigned to','assigned rep','sales rep'],tags:['tags','labels'],notes:['notes','note','comments','comment'],dev:['development','project','dev','building'],unit:['unit','unit ref','unit id','property','apartment'],
  stage:['stage','status','pipeline stage'],price:['price','agreed price','sale price','amount','value'],pos:['pos','pos date','pos signed','pos signed date','promise of sale','signed']};
function suggest(type,h){const k=String(h).trim().toLowerCase();const f=FIELDS[type].find(([id])=>(SYN[id]||[]).includes(k));return f?f[0]:'';}
function availUnits(dev,n){return UNITS.filter(u=>u.dev===dev&&u.status==='available'&&!DEALS.some(d=>dealOpp(d)?.units.includes(u.id))).slice(0,n);}
function sample(type,dev){
  if(type==='contacts')return {name:'expo-2026-visitors-sample.csv',rows:[
    ['Name','Email','Phone','Source','Nationality','Budget','Notes'],
    ['Hannah Weber','hannah.weber@email.de','+49 151 2203 4471','Property Expo 2026','German','350000','Wants a sea view'],
    ['Liam O\u2019Brien','liam.obrien@email.ie','+353 87 410 2290','Property Expo 2026','Irish','420000',''],
    ['Tania Muscat','tania.muscat@email.com','','Property Expo 2026','Maltese','300000','Visited the stand again'],
    ['Marco Rossi','marco.rossi@email.it','+39 333 118 4420','Property Expo 2026','Italian','500000',''],
    ['Marco Rossi','marco.rossi@email.it','+39 333 118 4420','Property Expo 2026','Italian','500000',''],
    ['Anna Kowalska','','','Property Expo 2026','Polish','280000','Card left, no details'],
    ['Peter Grech','peter.grech@email','+356 7912 0044','Property Expo 2026','Maltese','',''],
    ['Omar Haddad','omar.haddad@email.com','','Property Expo 2026','British','450000','']]};
  if(type==='opportunities')return {name:'portal-leads-sample.csv',rows:[
    ['Full name','Email','Mobile','Development','Unit','Budget','Lead source','Agent'],
    ['Sven Larsson','sven.larsson@email.se','+46 70 221 9034',dev||'Verdala','','380000','Portal','Maria'],
    ['Claudia Farrugia','claudia.farrugia@email.com','+356 7955 1200',dev||'Verdala','','300000','Portal',''],
    ['Daniela Spiteri','','+356 '+(CONTACTS.find(c=>c.name==='Daniela Spiteri')?.phone||'').replace(/^\+356\s*/,''),dev||'Verdala','','450000','Portal',''],
    ['Kevin Borg','kevin.borg@email.com','+356 7700 4410','Sunset Towers','','250000','Portal',''],
    ['Rita Zammit','rita.zammit@email.com','','','','','Portal','']]};
  const d=dev||'La Lex', av=availUnits(d,3), sold=UNITS.find(u=>u.dev===d&&u.status==='sold');
  return {name:`${d.toLowerCase().replace(/[^a-z]+/g,'-')}-sales-to-date-sample.xlsx`,rows:[
    ['Buyer name','Email','Phone','Unit','Agreed price','POS signed date'],
    ...av.map((u,i)=>[['Thomas Becker','Alessia Vella','Jean Dupont'][i],['thomas.becker@email.de','alessia.vella@email.com','jean.dupont@email.fr'][i],['+49 160 330 1180','+356 7944 2210','+33 6 12 44 80 19'][i],u.id,String(Math.round(u.price*0.98/1000)*1000),['12 Sep','20 Sep','1 Oct'][i]]),
    ['Nadia Camilleri','nadia.camilleri@email.com','+356 7988 0012',sold?sold.id:'#CM0000','300000','5 Oct'],
    ['Paul Agius','paul.agius@email.com','+356 7900 7781','#CM0000','310000','8 Oct']]};
}

// ---------- evaluation ----------
function rowFields(type,map,row){const f={};map.forEach((k,i)=>{if(k&&row[i]!=null&&String(row[i]).trim()!=='')f[k]=String(row[i]).trim();});if(!f.name&&(f.first||f.last))f.name=[f.first,f.last].filter(Boolean).join(' ');return f;}
function findContact(f){const e=(f.email||'').toLowerCase(),p=normPhone(f.phone);return CONTACTS.find(c=>(e&&String(c.email).toLowerCase()===e)||(p&&p.length>6&&normPhone(c.phone)===p));}
function findDev(name){const n=String(name||'').trim().toLowerCase();return n?DEVS.find(d=>d.name.toLowerCase()===n||d.id===n):null;}
function evaluate(type,rows,map,opts){
  const seen=new Map(),out=[];
  rows.forEach((row,i)=>{
    if(!row.some(v=>String(v??'').trim()))return;
    const f=rowFields(type,map,row),n=i+2,r={row:n,name:f.name||'(no name)',f,outcome:'created',reason:'',warn:''};
    out.push(r);
    const fail=t=>{r.outcome='failed';r.reason=t;};
    if(!f.name)return fail('Missing name');
    if(f.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email))return fail('Email looks wrong: '+f.email);
    if(type!=='deals'&&!f.email&&!f.phone)return fail('No phone or email');
    const devName=f.dev||opts.dev, dv=findDev(devName);
    if(type!=='contacts'){
      if(!devName)return fail('No development');
      if(!dv)return fail(`Unknown development “${devName}”`);
      r.dev=dv.name;
    }
    let unit=null;
    if(f.unit){const id=f.unit.startsWith('#')?f.unit:'#'+f.unit;unit=UNITS.find(u=>u.id.toLowerCase()===id.toLowerCase()&&(!dv||u.dev===dv.name));}
    if(type==='deals'){
      if(!f.unit)return fail('Missing unit');
      if(!unit)return fail(`Unit ${f.unit} isn’t in ${dv.name}`);
      if(['sold','reserved'].includes(unit.status))return fail(`${unit.id} is already ${unit.status}`);
      const has=DEALS.find(d=>dealOpp(d)?.units[0]===unit.id);
      if(has)return Object.assign(r,{outcome:'skipped',reason:`${unit.id} already has ${has.id}`});
      const price=Number(String(f.price||'').replace(/[€,\s]/g,''));
      if(!f.price||!Number.isFinite(price)||price<=0)return fail('Missing or invalid price');
      if(!f.pos)return fail('Missing POS signed date');
      r.unit=unit.id;r.price=price;
      if(unit.status==='hold')r.warn='Unit was on hold · the hold is released';
    }else if(type==='opportunities'&&f.unit){if(unit)r.unit=unit.id;else r.warn=`Unit ${f.unit} not found · left blank`;}
    const key=type==='deals'?'u:'+r.unit:(f.email||'').toLowerCase()||normPhone(f.phone);
    if(seen.has(key))return Object.assign(r,{outcome:'skipped',reason:`Same ${type==='deals'?'unit':'person'} as row ${seen.get(key)}`});
    seen.set(key,n);
    const c=findContact(f);r.match=c?c.id:null;
    if(c&&c.status==='dnc')r.warn='Do-not-contact kept';
    if(type==='contacts'&&c){
      if(opts.mode==='add')return Object.assign(r,{outcome:'skipped',reason:`Already in Bricly as ${c.name}`});
      const fill=[['nat','Nationality'],['btype','Buyer type'],['phone','Phone'],['email','Email']].filter(([k])=>f[k]&&!c[k]).map(([,l])=>l);
      return Object.assign(r,{outcome:'updated',reason:`Matched ${c.name}${fill.length?' · fills '+fill.join(', ').toLowerCase():' · nothing new'}`});
    }
    if(type==='opportunities'&&c){
      const open=OPPS.find(o=>c.oppIds?.includes(o.id)&&o.devs.includes(dv.name)&&!['Closed Won','Lost'].includes(o.stage));
      if(open)return Object.assign(r,{outcome:'skipped',reason:`${c.name} already has ${open.id} for ${dv.name}`});
      r.reason=`Linked to existing contact ${c.name}`;
    }
    if(type==='deals'&&c)r.reason=`Linked to existing contact ${c.name}`;
  });
  return out;
}
function counts(recs){const c={created:0,updated:0,skipped:0,failed:0};recs.forEach(r=>c[r.outcome]++);return c;}

// ---------- applying and undoing ----------
const REPS=['Sam','Sarah','Chris','Lucy','Matthew','Maria'];
let repTurn=0;
function pickRep(f){const r=f.rep&&REPS.find(x=>x.toLowerCase()===f.rep.toLowerCase());return r||REPS[(repTurn++)%5];}
function budgetK(v){const n=Number(String(v||'').replace(/[€,\s]/g,''));return n>0?(n>5000?Math.round(n/1000):n):null;}
function newContact(b,f,undo){
  const c={id:'CT-I'+(++IH.recSeq),name:f.name,type:'lead',btype:f.btype||null,company:null,status:'lead',email:f.email||'',phone:f.phone||'',nat:f.nat||'',lang:'',source:f.source||'Import',ref:null,
    bmin:null,bmax:budgetK(f.budget),interest:f.unit||'',ploc:f.dev||'',finance:null,timeline:null,rep:pickRep(f),tags:f.tags?f.tags.split(/[;,]/).map(s=>s.trim()).filter(Boolean):[],oppIds:[],
    consent:{wa:false,em:false,sms:false},created:'Today',last:'Today',lastD:0,notesList:f.notes?[f.notes]:[],buyingWith:'',preferredChannel:'',bedrooms:'',mustHaves:[],importId:b.id,
    comms:[{ch:'sys',t:'Just now',text:`Created by import ${b.id} · ${b.file} · ${b.by}`}],audit:[{text:`Created by import ${b.id} · ${b.file}`,by:b.by,t:'Just now'}]};
  CONTACTS.push(c);undo.push(()=>{const i=CONTACTS.indexOf(c);if(i>=0)CONTACTS.splice(i,1);});
  return c;
}
function matchContact(b,c,f,undo){
  const prev={nat:c.nat,btype:c.btype,phone:c.phone,email:c.email,comms:c.comms,audit:c.audit};
  ['nat','btype','phone','email'].forEach(k=>{if(f[k]&&!c[k])c[k]=f[k];});
  c.comms=[{ch:'sys',t:'Just now',text:`Matched by import ${b.id} · ${b.file}`},...(c.comms||[])];
  c.audit=[{text:`Matched by import ${b.id} · blanks filled`,by:b.by,t:'Just now'},...(c.audit||[])];
  undo.push(()=>Object.assign(c,prev));
}
function newOpp(b,c,f,r,stage,value,undo){
  const o={id:'OPP-'+(4000+(++IH.recSeq)),contactId:c.id,lead:c.name,devs:[r.dev],units:r.unit?[r.unit]:[],stage,source:f.source||'Import',budget:value||budgetK(f.budget)||0,value:value||budgetK(f.budget)||0,
    tags:[],rep:c.rep||pickRep(f),next:{d:stage==='Closed Won'?'—':'Today',t:stage==='Closed Won'?'Deal imported':'First contact after import'},ago:'Today',importId:b.id};
  OPPS.push(o);c.oppIds.push(o.id);
  getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`${stage==='Closed Won'?'Deal':'Opportunity'} created by import ${b.id} · ${b.file} · ${b.by}`});
  undo.push(()=>{const i=OPPS.indexOf(o);if(i>=0)OPPS.splice(i,1);c.oppIds=c.oppIds.filter(id=>id!==o.id);if(typeof EXT!=='undefined')delete EXT[o.id];});
  return o;
}
function applyBatch(b){
  const undo=[];
  b.records.forEach(r=>{
    if(!['created','updated'].includes(r.outcome))return;
    const f=r.f, existing=r.match&&CONTACTS.find(c=>c.id===r.match);
    if(b.type==='contacts'){
      if(existing){matchContact(b,existing,f,undo);r.link={k:'contact',id:existing.id};}
      else r.link={k:'contact',id:newContact(b,f,undo).id};
      return;
    }
    const c=existing||newContact(b,{...f,dev:r.dev},undo);
    if(b.type==='opportunities'){
      const stage=STAGES.includes(f.stage)&&!['Closed Won','Lost'].includes(f.stage)?f.stage:'New Lead';
      r.link={k:'opp',id:newOpp(b,c,f,r,stage,0,undo).id};return;
    }
    const o=newOpp(b,c,f,r,'Closed Won',Math.round(r.price/1000),undo), d=ensureDeal(o), u=UNITS.find(x=>x.id===r.unit), was=u?.status;
    Object.assign(d,{pos:f.pos,unit:r.unit,buyers:[c.name],status:'active',createdBy:b.by,importId:b.id});
    if(u)u.status='reserved';
    if(typeof dfLog==='function')dfLog(o,`Deal imported · ${b.id} · ${b.file}`,`${b.by}${b.approvedBy?' · approved by '+b.approvedBy:''}`,{strong:true});
    undo.push(()=>{const i=DEALS.indexOf(d);if(i>=0)DEALS.splice(i,1);if(u)u.status=was;});
    r.link={k:'deal',id:d.id};
  });
  b._undo=undo;b.status='applied';b.undoable=true;b.days=0;
  refreshLists();
}
function undoBatch(id){
  const b=IH.batches.find(x=>x.id===id);if(!b||!b._undo)return;
  b._undo.slice().reverse().forEach(fn=>fn());b._undo=null;b.undoable=false;
  b.status='undone';b.undoneBy=me();b.undoneAt=nowTxt();
  b.records.forEach(r=>{r.link=null;});
  IH.confirmUndo=false;refreshLists();ihRefresh();
  showToast(`${b.id} undone · ${counts(b.records).created} created records removed${b.type==='deals'?' · units released':''}`);
}
function nowTxt(){return 'Today, '+hhmm(mins());}
function refreshLists(){
  if(typeof renderContacts==='function')renderContacts();
  if(typeof pipeRenderAll==='function')try{pipeRenderAll();}catch(e){}
  if(typeof renderDeals==='function')renderDeals();
  if(typeof renderUnits==='function')try{renderUnits();}catch(e){}
}

// ---------- seeded history ----------
function seed(){
  const C=n=>CONTACTS.find(c=>c.name===n), byDev=dev=>CONTACTS.filter(c=>c.oppIds.some(id=>OPPS.find(o=>o.id===id)?.devs.includes(dev)));
  const rec=(c,outcome,reason='',row)=>({row,name:c.name,outcome,reason,link:{k:'contact',id:c.id}});
  const fake=(name,outcome,reason,row)=>({row,name,outcome,reason});
  const ver=byDev('Verdala').slice(0,5);
  const add=b=>{IH.batches.push(Object.assign({undoable:false,records:[],source:'',mode:''},b));};
  // A deal import from setup waiting on the owner: approval runs the real apply.
  const lal=sample('deals','La Lex');
  add({id:'IMP-1047',type:'deals',file:'lalex-sales-to-date.xlsx',dev:'La Lex',by:'Maria',when:'Today, 09:12',days:0,m:552,status:'waiting',source:'New development setup · Existing deals',mode:'Add new',rows:lal.rows.length-1,
    pending:{rows:lal.rows.slice(1),map:['name','email','phone','unit','price','pos'],dev:'La Lex'}});
  add({id:'IMP-1046',type:'opportunities',file:'verdala-portal-leads-oct.csv',dev:'Verdala',by:'Maria',when:'Yesterday, 16:05',days:1,m:965,status:'applied',source:'Opportunities list',mode:'Add new and match existing',rows:86,
    counts:{created:71,updated:9,skipped:3,failed:3},undoNote:'Undo isn’t available: 41 of these opportunities have been worked on since (messages, appointments).',
    records:[fake('Sven Larsson','created','',2),fake('Claudia Farrugia','created','',3),fake('Ahmed Saleh','created','',4),
      ...ver.slice(0,2).map((c,i)=>rec(c,'updated',`Matched existing contact ${c.name} · open opportunity kept`,9+i)),fake('Mark Tonna','skipped','Same person as row 14',22),fake('J. Pisani','failed','No phone or email',37),fake('Ivana Petrova','failed','Email looks wrong: ivana@petrova',58),fake('Ray Fenech','failed','No phone or email',71)]});
  add({id:'IMP-1045',type:'units',file:'onyx-rise-units.xlsx',dev:'Onyx Rise',by:'Claire Azzopardi',when:'Yesterday, 12:55',days:1,m:775,status:'applied',source:'Units list',mode:'Add new only',rows:16,counts:{created:16,updated:0,skipped:0,failed:0},
    undoNote:'Undo isn’t available: 2 of these units are already held by buyers.',records:UNITS.filter(u=>u.dev==='Onyx Rise').slice(0,6).map((u,i)=>({row:i+2,name:u.id,sub:`${u.type} · floor ${u.floor}`,outcome:'created',link:{k:'unit',id:u.id}}))});
  const expo=['Tania Muscat','Sofia Lindqvist','Claire Bugeja'].map(C).filter(Boolean);
  add({id:'IMP-1044',type:'contacts',file:'expo-2026-visitors.xlsx',dev:null,by:'Joseph',when:'3 Oct, 14:20',days:7,m:860,status:'applied',source:'Contacts list',mode:'Add new and match existing',rows:142,counts:{created:118,updated:17,skipped:4,failed:3},
    undoNote:`Undo window closed. Imports can be undone for ${UNDO_DAYS} days.`,records:[fake('Greta Hansen','created','',2),fake('Luis Ortega','created','',3),...expo.map((c,i)=>rec(c,'updated',`Matched ${c.name} · nothing new`,11+i)),fake('Tom Hili','skipped','Same person as row 40',41),fake('—','failed','Missing name',88),fake('L. Saliba','failed','No phone or email',120)]});
  add({id:'IMP-1043',type:'contacts',file:'old-crm-export.csv',dev:null,by:'Maria',when:'28 Sep, 10:02',days:12,m:602,status:'undone',undoneBy:'Maria',undoneAt:'28 Sep, 10:15',source:'Contacts list',mode:'Add new and match existing',rows:40,counts:{created:38,updated:0,skipped:0,failed:2},
    note:'Phone numbers were mapped to Full name. Undone after 13 minutes; nothing was messaged.',records:[fake('+356 7911 2034','created','',2),fake('+356 7920 8871','created','',3),fake('','failed','Missing name',17)]});
  const onyx=DEALS.map(d=>({d,o:dealOpp(d)})).filter(x=>x.o?.devs.includes('Onyx Rise'));
  add({id:'IMP-1042',type:'deals',file:'onyx-rise-deals.xlsx',dev:'Onyx Rise',by:'Ben Attard (Bricly support)',when:'26 Sep, 10:05',days:14,m:605,status:'applied',approvedBy:'Joseph',source:'New development setup · Existing deals',mode:'Add new',rows:3,
    counts:{created:Math.max(1,onyx.length),updated:0,skipped:0,failed:0},undoNote:`Undo window closed. Imports can be undone for ${UNDO_DAYS} days.`,records:onyx.map((x,i)=>({row:i+2,name:x.o.lead,sub:`${x.o.units[0]} · POS ${x.d.pos}`,outcome:'created',link:{k:'deal',id:x.d.id}}))});
  add({id:'IMP-1041',type:'units',file:'mercury-prices-q4.xlsx',dev:'Mercury',by:'Joseph',when:'22 Sep, 17:40',days:18,m:1060,status:'applied',source:'Development editor · Import / export units',mode:'Update prices',rows:14,counts:{created:0,updated:12,skipped:2,failed:0},
    undoNote:`Undo window closed. Imports can be undone for ${UNDO_DAYS} days.`,records:UNITS.filter(u=>u.dev==='Mercury').slice(0,4).map((u,i)=>({row:i+2,name:u.id,sub:'Listing price updated',outcome:'updated',link:{k:'unit',id:u.id}}))});
  add({id:'IMP-1040',type:'opportunities',file:'facebook-leads-backfill.csv',dev:'Dolphin Court',by:'Maria',when:'19 Sep, 11:30',days:21,m:690,status:'failed',source:'Opportunities list',mode:'Add new and match existing',rows:0,counts:{created:0,updated:0,skipped:0,failed:0},
    note:'We couldn’t read this file: it was saved as UTF-16 with tab separators. Nothing was created.'});
  IH.batches.forEach(b=>{
    if(b.pending)b.records=evaluate(b.type,b.pending.rows,b.pending.map,{dev:b.pending.dev,mode:'both'});
  });
}

// ---------- list of batches ----------
function fileBatches(){
  return DEVS.filter(d=>d.editor&&d.editor.uploadBatches).flatMap(d=>d.editor.uploadBatches.map((u,i)=>{
    const today=/^Today/.test(u.when),days=today?0:Math.max(1,Math.round(typeof ctAgeKey==='function'?ctAgeKey(u.when):30));
    const hm=String(u.when).match(/(\d{1,2}):(\d{2})/),m=hm?+hm[1]*60+ +hm[2]:0;
    return {id:`UPL-${d.id}-${d.editor.uploadBatches.length-i}`,type:'files',file:u.title,dev:d.name,devId:d.id,by:u.who,when:u.when,days,m,status:/need/.test(u.status)?'attention':'applied',statusTxt:u.status,summary:u.routed,source:'Development editor · Uploads',records:[]};
  }));
}
function allBatches(){return [...IH.batches,...fileBatches()].sort((a,b)=>ord(b.days,b.m)-ord(a.days,a.m));}
function summary(b){
  if(b.type==='files')return b.summary;
  const c=b.counts||counts(b.records);
  const parts=[[c.created,'created'],[c.updated,updatedWord(b.type)],[c.skipped,'skipped'],[c.failed,'failed']].filter(([n])=>n).map(([n,l])=>`${n.toLocaleString()} ${l}`);
  return b.status==='waiting'?`${c.created} ready · ${c.failed+c.skipped} won’t import`:parts.join(' · ')||'Nothing imported';
}
function filtered(scope){
  const v=IH.view;
  return allBatches().filter(b=>(scope?.dev?b.dev===scope.dev:(v.type==='all'||b.type===v.type)&&(v.dev==='all'||b.dev===v.dev))
    &&(v.status==='all'||b.status===v.status)&&(!v.q||`${b.id} ${b.file} ${b.by}`.toLowerCase().includes(v.q.toLowerCase())));
}
function rowsHtml(list,scope){
  if(!list.length)return `<div class="ih-empty"><b>No imports yet</b><span>${scope?.dev?`Imports for ${esc(scope.dev)} will show here.`:'Imports you run show here with who ran them and what changed.'}</span></div>`;
  return `<div class="ih-table" role="table" aria-label="Imports"><div class="ih-tr ih-th" role="row"><span role="columnheader">When</span><span role="columnheader">Import</span><span role="columnheader">Type</span>${scope?.dev?'':'<span role="columnheader">Development</span>'}<span role="columnheader">By</span><span role="columnheader">Result</span><span role="columnheader">Status</span></div>
    ${list.map(b=>`<button type="button" class="ih-tr${scope?.dev?' nodev':''}" role="row" data-ih-batch="${esc(b.id)}" onclick="ihDetail('${esc(b.id)}')"><span role="cell" class="c-when ih-mu">${esc(b.when)}</span><span role="cell" class="c-imp"><b>${esc(b.file)}</b><span class="ih-mu">${esc(b.id.startsWith('UPL')?'Upload batch':b.id)}</span></span><span role="cell" class="c-type">${esc(TYPE_LABEL[b.type])}</span>${scope?.dev?'':`<span role="cell" class="c-dev">${esc(b.dev||'—')}</span>`}<span role="cell" class="c-by">${esc(b.by)}</span><span role="cell" class="c-res ih-mu">${esc(summary(b))}</span><span role="cell" class="c-st">${chip(STATUS,b.status,b.type==='files'?b.statusTxt:'')}</span></button>`).join('')}</div>`;
}
function filtersHtml(surface){
  const v=IH.view,all=allBatches(),devs=[...new Set(all.map(b=>b.dev).filter(Boolean))].sort();
  const n=t=>all.filter(b=>t==='all'||b.type===t).length;
  const canStart=canImport()&&(IMPORTABLE.includes(v.type)||v.type==='units');
  return `<div class="row-between crm-page-controls ih-controls"><div class="tabs" role="tablist" aria-label="Import type">${[['all','All'],...TYPES].map(([k,l])=>`<button type="button" role="tab" class="tab ${v.type===k?'on':''}" aria-selected="${v.type===k}" onclick="ihSet('type','${k}')">${l} <span class="ih-n">${n(k)}</span></button>`).join('')}</div>
    <div class="toolbar"><input type="search" class="ih-search" placeholder="File, import ID or person" aria-label="Search imports" value="${esc(v.q)}" oninput="ihSearch(this.value)">
      <select class="ih-sel" aria-label="Development" onchange="ihSet('dev',this.value)"><option value="all">All developments</option>${devs.map(d=>`<option ${v.dev===d?'selected':''}>${esc(d)}</option>`).join('')}</select>
      <select class="ih-sel" aria-label="Status" onchange="ihSet('status',this.value)"><option value="all">Any status</option>${Object.entries(STATUS).map(([k,[l]])=>`<option value="${k}" ${v.status===k?'selected':''}>${l}</option>`).join('')}</select>
      ${canStart&&surface==='page'?`<button type="button" class="btn-primary" onclick="${v.type==='units'?'ihUnitImport()':`ihStart('${v.type}')`}">Import ${esc(TYPE_LABEL[v.type].toLowerCase())}</button>`:''}</div></div>`;
}
function panelHtml(surface){return `${filtersHtml(surface)}<div data-ih-list>${rowsHtml(filtered())}</div>`;}
function pageHtml(){
  const from=IH.view.from&&TYPE_PAGE[IH.view.from];
  return `${from?`<button class="btn-back" onclick="go('${from}')"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8.5 3L4 7l4.5 4"/></svg>Back to ${esc(CRUMB[from])}</button>`:''}
    <div class="crm-page-heading"><div class="page-title">Data activity</div><div class="page-sub">Every import, who ran it and what it changed. Applied imports can be undone for ${UNDO_DAYS} days if nobody has worked on the records yet.</div></div>
    ${panelHtml('page')}`;
}
function ihRender(){const root=document.getElementById('ih-root');if(root)root.innerHTML=pageHtml();}
function ihRefresh(){
  if(document.getElementById('p-imports')?.classList.contains('on'))ihRender();
  if(document.getElementById('p-settings')?.classList.contains('on')&&typeof stRender==='function'&&typeof stPage!=='undefined'&&stPage==='data/activity')stRender();
  if(document.getElementById('p-development')?.classList.contains('on')&&typeof dvTabCur!=='undefined'&&dvTabCur==='imports')renderDev();
  if(IH.open&&document.getElementById('qaDrawer')?.classList.contains('open')&&!IH.flow)drawDetail();
}
window.ihSet=(k,v)=>{IH.view[k]=v;if(k==='type'&&v!=='all')IH.view.from=TYPE_PAGE[v]?v:IH.view.from;ihRefresh();};
window.ihSearch=v=>{IH.view.q=v;document.querySelectorAll('[data-ih-list]').forEach(el=>{el.innerHTML=rowsHtml(filtered());});};
window.ihOpen=(type='all',dev='all')=>{
  Object.assign(IH.view,{type,dev,status:'all',q:'',from:TYPE_PAGE[type]?type:null});
  document.querySelectorAll('.cr-actions-menu[data-ih-menu]').forEach(m=>m.hidden=true);
  go('imports');
};
window.ihUnitImport=()=>{if(typeof uiImportOpen==='function'){go('properties');uiImportOpen();}};

// ---------- detail drawer ----------
function linkBtn(l){
  if(!l)return '';
  const fn={contact:'openContact',opp:'openOpp',deal:'openDeal',unit:'openUnit'}[l.k];
  const ok={contact:()=>CONTACTS.some(c=>c.id===l.id),opp:()=>OPPS.some(o=>o.id===l.id),deal:()=>DEALS.some(d=>d.id===l.id),unit:()=>UNITS.some(u=>u.id===l.id)}[l.k]();
  return ok?`<button type="button" class="df-link" onclick="qaDrawerClose();IH.open=null;${fn}('${esc(l.id)}')">Open</button>`:'';
}
function drawDetail(){
  const b=allBatches().find(x=>x.id===IH.open);if(!b)return;
  const kv=(k,v)=>v?`<div class="ih-kv"><span>${k}</span><b>${esc(v)}</b></div>`:'';
  if(b.type==='files'){
    qaDrawerOpen(`${b.file}`,`<div class="ih-d">${chip(STATUS,b.status,b.statusTxt)}
      <div class="ih-kvs">${kv('Development',b.dev)}${kv('Uploaded by',b.by)}${kv('When',b.when)}${kv('Where the files went',b.summary)}${kv('Source',b.source)}</div>
      <p class="ih-mu">File uploads are routed into the development’s draft. Plans that matched no unit wait in Uploads until someone links them.</p></div>`,
      `<button class="btn-ghost" onclick="qaDrawerClose();IH.open=null">Close</button><button class="btn-primary" onclick="qaDrawerClose();IH.open=null;deOpen('${b.devId}','uploads')">Open Uploads</button>`);
    return;
  }
  const c=b.counts||counts(b.records), shown=b.records.filter(r=>IH.rowF==='all'||r.outcome===IH.rowF), wait=b.status==='waiting';
  const lbl=k=>k==='created'&&wait?'Ready':k==='updated'?updatedWord(b.type)[0].toUpperCase()+updatedWord(b.type).slice(1):OUTCOME[k][0];
  const notice=b.status==='waiting'?`<div class="ih-note warn"><b>Waiting for approval</b><span>Deal imports reserve units, so the owner approves them first. Nothing has changed yet.${c.created?` Approving creates ${c.created} deal${c.created===1?'':'s'} and reserves ${b.records.filter(r=>r.outcome==='created').map(r=>r.unit).join(', ')}.`:''}</span></div>`
    :b.status==='undone'?`<div class="ih-note"><b>Undone by ${esc(b.undoneBy)} · ${esc(b.undoneAt)}</b><span>Everything this import created was removed and matched records were put back as they were.${b.note?' '+esc(b.note):''}</span></div>`
    :b.status==='rejected'?`<div class="ih-note bad"><b>Rejected by ${esc(b.rejectedBy)}</b><span>Nothing was imported.</span></div>`
    :b.status==='failed'?`<div class="ih-note bad"><b>Import failed</b><span>${esc(b.note||'Nothing was created.')}</span></div>`
    :b.status==='draft'?`<div class="ih-note"><b>Saved as an inventory batch</b><span>Nothing changed on live units. An admin applies it from Units & availability in the development editor.</span></div>`:'';
  const undo=b.status==='applied'&&b.undoable&&b._undo&&canImport();
  const confirm=IH.confirmUndo&&undo?`<div class="ih-note bad"><b>Undo ${esc(b.id)}?</b><span>This removes ${c.created} created record${c.created===1?'':'s'}${b.type==='deals'?' and releases their units':''}${c.updated?` and puts ${c.updated} matched contact${c.updated===1?'':'s'} back as they were`:''}. It’s written to the audit log.</span>
    <div class="ih-row"><button type="button" class="btn-ghost df-sm" onclick="IH.confirmUndo=false;ihRedraw()">Keep import</button><button type="button" class="btn-danger df-sm" data-ih-confirm-undo onclick="ihUndo('${b.id}')">Undo import</button></div></div>`:'';
  const body=`<div class="ih-d">
    <div class="ih-row">${chip(STATUS,b.status)}<span class="ih-chip neu">${esc(TYPE_LABEL[b.type])}</span></div>
    ${notice}${confirm}
    <div class="ih-stats">${['created','updated','skipped','failed'].map(k=>`<div><b>${(c[k]||0).toLocaleString()}</b><span>${lbl(k)}</span></div>`).join('')}</div>
    <div class="ih-kvs">${kv('File',b.file)}${kv('Rows in file',b.rows!=null?String(b.rows):'')}${kv('Development',b.dev)}${kv('Ran by',b.by)}${kv('When',b.when)}${kv('Approved by',b.approvedBy)}${kv('Source',b.source)}${kv('Mode',b.mode)}</div>
    ${b.records.length?`<div class="ih-row ih-filters" role="group" aria-label="Filter rows">${[['all','All'],...['created','updated','skipped','failed'].map(k=>[k,lbl(k)])].map(([k,l])=>`<button type="button" class="ih-fchip ${IH.rowF===k?'on':''}" aria-pressed="${IH.rowF===k}" onclick="IH.rowF='${k}';ihRedraw()">${l}</button>`).join('')}</div>
    <div class="ih-recs">${shown.map(r=>`<div class="ih-rec"><span class="ih-mu">Row ${r.row??'—'}</span><span class="ih-grow"><b>${esc(r.name)}</b>${r.sub||r.reason||r.warn?`<span class="ih-mu">${esc([r.sub,r.reason,r.warn].filter(Boolean).join(' · '))}</span>`:''}</span>${chip(OUTCOME,r.outcome,lbl(r.outcome))}${linkBtn(r.link)}</div>`).join('')||'<p class="ih-mu">No rows with this outcome.</p>'}</div>
    ${b.rows>b.records.length?`<p class="ih-mu">Showing ${b.records.length} of ${b.rows} rows. The full report has every row.</p>`:''}`:''}
    ${b.status==='applied'&&!undo&&b.undoNote?`<p class="ih-mu">${esc(b.undoNote)}</p>`:''}
    <p class="ih-mu">Written to the audit log with the source Import.</p></div>`;
  const foot=[`<button class="btn-ghost" onclick="qaDrawerClose();IH.open=null">Close</button>`,
    b.records.length?`<button class="btn-ghost" onclick="ihReport('${b.id}',false)">Download report</button>`:'',
    c.failed&&b.records.some(r=>r.outcome==='failed')?`<button class="btn-ghost" onclick="ihReport('${b.id}',true)">Download failed rows</button>`:'',
    undo&&!IH.confirmUndo?`<button class="btn-ghost" data-ih-undo onclick="IH.confirmUndo=true;ihRedraw()">Undo import</button>`:'',
    b.status==='waiting'&&canApprove()?`<button class="btn-ghost" onclick="ihReject('${b.id}')">Reject</button><button class="btn-primary" data-ih-approve onclick="ihApprove('${b.id}')">Approve and import</button>`:''].join('');
  qaDrawerOpen(`${b.id} · ${b.file}`,body,foot);
}
window.ihDetail=id=>{IH.flow=null;IH.open=id;IH.rowF='all';IH.confirmUndo=false;drawDetail();};
window.ihRedraw=drawDetail;
window.ihUndo=undoBatch;
window.ihApprove=id=>{
  const b=IH.batches.find(x=>x.id===id);if(!b||b.status!=='waiting'||!canApprove())return;
  b.records=evaluate(b.type,b.pending.rows,b.pending.map,{dev:b.pending.dev,mode:'both'});
  b.approvedBy=me();b.when=nowTxt();b.m=mins();b.days=0;b.counts=null;
  applyBatch(b);ihRefresh();showToast(`${b.id} approved · ${counts(b.records).created} deals created and units reserved`);
};
window.ihReject=id=>{const b=IH.batches.find(x=>x.id===id);if(!b)return;b.status='rejected';b.rejectedBy=me();ihRefresh();showToast(`${b.id} rejected · nothing imported`);};
window.ihReport=(id,failedOnly)=>{
  const b=IH.batches.find(x=>x.id===id);if(!b)return;
  const rows=b.records.filter(r=>!failedOnly||r.outcome==='failed').map(r=>[r.row,r.name,OUTCOME[r.outcome][0],[r.reason,r.warn].filter(Boolean).join(' · ')]);
  sbDownload(sbCsv(['Row','Name','Outcome','Reason'],rows),`${b.id.toLowerCase()}-${failedOnly?'failed-rows':'report'}.csv`);
  showToast(failedOnly?`${rows.length} failed rows downloaded · fix and import them again`:'Import report downloaded');
};

// ---------- import flow (contacts, opportunities, deals) ----------
const STEPS=['Source','Match columns','Review','Done'];
window.ihStart=(type,dev)=>{
  if(!canImport()||!IMPORTABLE.includes(type))return;
  document.querySelectorAll('.cr-actions-menu[data-ih-menu]').forEach(m=>m.hidden=true);
  IH.open=null;
  IH.flow={type,step:1,dev:dev||(type==='deals'?'':''),mode:'both',file:null,map:[],recs:null,batch:null,err:''};
  drawFlow();
};
function flowReady(F){
  if(F.step===1)return !!F.file&&(F.type!=='deals'||!!F.dev);
  if(F.step===2){const m=F.map;return (m.includes('name')||m.includes('first'))&&(F.type==='deals'?m.includes('unit')&&m.includes('price')&&m.includes('pos'):m.includes('email')||m.includes('phone'))&&(F.type!=='opportunities'||m.includes('dev')||!!F.dev);}
  return true;
}
function drawFlow(){
  const F=IH.flow;if(!F)return;
  const T=TYPE_LABEL[F.type],t=T.toLowerCase(),devOpts=DEVS.map(d=>`<option ${F.dev===d.name?'selected':''}>${esc(d.name)}</option>`).join('');
  const prog=`<ol class="ih-steps">${STEPS.map((s,i)=>`<li class="${i+1===F.step?'on':i+1<F.step?'done':''}" ${i+1===F.step?'aria-current="step"':''}>${i+1}. ${s}</li>`).join('')}</ol>`;
  let body='',foot='';
  if(F.step===1){
    body=`${F.type!=='contacts'?`<label class="ih-field"><span>Development${F.type==='deals'?'':' for rows without one'}</span><select class="ih-sel" onchange="IH.flow.dev=this.value;ihFlowDraw()"><option value="">${F.type==='deals'?'Choose a development':'Use the Development column'}</option>${devOpts}</select></label>`:''}
      ${F.type!=='deals'?`<fieldset class="ih-field"><legend>When a row matches someone already in Bricly</legend><label class="ih-radio"><input type="radio" name="ih-mode" ${F.mode==='both'?'checked':''} onchange="IH.flow.mode='both'"> Link to them and fill blank fields <span class="ih-mu">Existing values are never overwritten</span></label><label class="ih-radio"><input type="radio" name="ih-mode" ${F.mode==='add'?'checked':''} onchange="IH.flow.mode='add'"> Skip the row</label></fieldset>`:`<p class="ih-note warn"><span>Each imported deal starts at POS signed and reserves its unit. ${canApprove()?'You approve deal imports, so they apply straight away.':'The owner approves deal imports before anything changes.'}</span></p>`}
      <div class="ih-field"><span>File</span><label class="ih-drop"><input type="file" accept=".csv,.xlsx,.xls" onchange="ihFlowFile(this)"><b>Choose a CSV or Excel file</b><span class="ih-mu">One ${TYPE_ONE(F.type)} per row, with a header row</span></label>
        <button type="button" class="df-link" data-ih-sample onclick="ihFlowSample()">Use a sample file</button></div>
      ${F.err?`<p class="ih-note bad"><span>${esc(F.err)}</span></p>`:''}
      ${F.file?`<div class="ih-file"><b>${esc(F.file.name)}</b><span class="ih-mu">${F.file.rows.length-1} rows · ${F.file.rows[0].length} columns</span></div>`:''}`;
  }else if(F.step===2){
    const head=F.file.rows[0],first=F.file.rows[1]||[];
    body=`<p class="ih-mu">We matched the columns we recognised. Check each one; columns set to “Don’t import” are ignored.</p>
      <div class="ih-map">${head.map((h,i)=>`<div class="ih-maprow"><span><b>${esc(h||'Column '+(i+1))}</b><span class="ih-mu">${esc(first[i]||'—')}</span></span><span aria-hidden="true">→</span><select class="ih-sel" aria-label="Bricly field for ${esc(h)}" onchange="IH.flow.map[${i}]=this.value;ihFlowDraw()"><option value="">Don’t import</option>${FIELDS[F.type].map(([k,l])=>`<option value="${k}" ${F.map[i]===k?'selected':''}>${l}</option>`).join('')}</select></div>`).join('')}</div>
      <p class="ih-mu">${F.type==='deals'?'Needed: buyer name, unit, agreed price and POS signed date.':`Needed: a name and a phone or email${F.type==='opportunities'?', plus a development (column or default)':''}.`}${flowReady(F)?' ✓ All set.':''}</p>`;
  }else if(F.step===3){
    const c=counts(F.recs),issues=F.recs.filter(r=>r.outcome!=='created'||r.warn);
    body=`<div class="ih-stats">${[['created',F.type==='contacts'?'New contacts':`New ${t}`],['updated','Matched existing'],['skipped','Skipped'],['failed','Won’t import']].map(([k,l])=>`<div><b>${c[k]}</b><span>${l}</span></div>`).join('')}</div>
      ${issues.length?`<div class="ih-recs">${issues.map(r=>`<div class="ih-rec"><span class="ih-mu">Row ${r.row}</span><span class="ih-grow"><b>${esc(r.name)}</b><span class="ih-mu">${esc([r.reason,r.warn].filter(Boolean).join(' · '))}</span></span>${chip(OUTCOME,r.outcome)}</div>`).join('')}</div>`:'<p class="ih-note"><span>Every row is ready.</span></p>'}
      <p class="ih-mu">${F.type!=='deals'?'Messaging consent isn’t imported. Imported contacts start with every channel off until they opt in. ':''}Nothing changes until you ${F.type==='deals'&&!canApprove()?'send this for approval':'import'}. You can undo an import for ${UNDO_DAYS} days.</p>`;
  }else{
    const b=F.batch,c=counts(b.records);
    body=`<div class="ih-done"><b>${b.status==='waiting'?`Sent for approval · ${b.id}`:`Import complete · ${b.id}`}</b>
      <span>${b.status==='waiting'?`${c.created} deal${c.created===1?'':'s'} wait for the owner. Nothing has changed yet.`:`${[[c.created,'created'],[c.updated,'matched'],[c.skipped,'skipped'],[c.failed,'failed']].filter(([n])=>n).map(([n,l])=>n+' '+l).join(' · ')}. Each record shows it came from this import.`}</span></div>
      <p class="ih-mu">This import is listed in Data activity with every row’s outcome${b.status==='applied'?' and an undo option':''}.</p>`;
  }
  const n=F.step===3?counts(F.recs).created+counts(F.recs).updated:0;
  if(F.step<3)foot=`<button class="btn-ghost" onclick="${F.step===1?'ihFlowClose()':'IH.flow.step--;ihFlowDraw()'}">${F.step===1?'Cancel':'Back'}</button><button class="btn-primary" data-ih-next ${flowReady(F)?'':'disabled'} onclick="ihFlowNext()">Continue</button>`;
  else if(F.step===3)foot=`<button class="btn-ghost" onclick="IH.flow.step--;ihFlowDraw()">Back</button><button class="btn-primary" data-ih-run ${n?'':'disabled'} onclick="ihFlowRun()">${F.type==='deals'&&!canApprove()?`Send ${n} deal${n===1?'':'s'} for approval`:`Import ${n} ${n===1?TYPE_ONE(F.type):t}`}</button>`;
  else foot=`<button class="btn-ghost" onclick="ihFlowClose()">Close</button><button class="btn-primary" onclick="const id=IH.flow.batch.id,ty=IH.flow.type;ihFlowClose();ihOpen(ty);ihDetail(id)">View in Data activity</button>`;
  qaDrawerOpen(`Import ${t}`,`<div class="ih-d ih-flow">${prog}${body}</div>`,foot);
}
function TYPE_ONE(t){return {contacts:'contact',opportunities:'opportunity',deals:'deal'}[t]||t;}
window.ihFlowDraw=drawFlow;
window.ihFlowClose=()=>{IH.flow=null;qaDrawerClose();};
function setFile(name,rows){
  const F=IH.flow;rows=rows.filter(r=>r.some(v=>String(v??'').trim()));
  if(rows.length<2){F.err=`${name} has no rows under the header. Nothing was imported.`;F.file=null;drawFlow();return;}
  F.err='';F.file={name,rows:rows.map(r=>r.map(v=>String(v??'')))};F.map=F.file.rows[0].map(h=>suggest(F.type,h));drawFlow();
}
window.ihFlowSample=()=>{const s=sample(IH.flow.type,IH.flow.dev||null);setFile(s.name,s.rows);};
window.ihFlowFile=async input=>{
  const file=input.files&&input.files[0];if(!file)return;
  try{
    const X=typeof uiImportParser==='function'?await uiImportParser():window.XLSX;
    const wb=X.read(await file.arrayBuffer(),{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];
    setFile(file.name,X.utils.sheet_to_json(ws,{header:1,defval:'',raw:false}));
  }catch(e){IH.flow.err=`We couldn’t read ${file.name}. Choose an unencrypted CSV or XLSX file.`;IH.flow.file=null;drawFlow();}
};
window.ihFlowNext=()=>{
  const F=IH.flow;if(!flowReady(F))return;
  if(F.step===2)F.recs=evaluate(F.type,F.file.rows.slice(1),F.map,{dev:F.dev,mode:F.mode});
  F.step++;drawFlow();
};
window.ihFlowRun=()=>{
  const F=IH.flow;
  const b={id:nextId(),type:F.type,file:F.file.name,dev:F.type==='contacts'?null:(F.dev||[...new Set(F.recs.map(r=>r.dev).filter(Boolean))].join(', ')||null),by:me(),when:nowTxt(),days:0,m:mins(),
    source:`${TYPE_LABEL[F.type]} list`,mode:F.type==='deals'?'Add new':F.mode==='add'?'Add new only':'Add new and match existing',rows:F.file.rows.length-1,records:F.recs,undoable:false};
  if(F.type==='deals'&&!canApprove()){b.status='waiting';b.pending={rows:F.file.rows.slice(1),map:F.map.slice(),dev:F.dev};}
  IH.batches.unshift(b);
  if(b.status!=='waiting'){if(F.type==='deals')b.approvedBy=me();applyBatch(b);}
  F.batch=b;F.step=4;drawFlow();ihRefresh();
  showToast(b.status==='waiting'?`${b.id} sent to the owner for approval`:`${b.id} imported · ${counts(b.records).created} created`);
};

// ---------- entry points ----------
function menuHtml(type){
  const exp={contacts:`<button type="button" role="menuitem" onclick="ihMenuClose();ctExport()">${IC.exp}Export CSV</button>`,
    opportunities:`<button type="button" role="menuitem" onclick="ihMenuClose();sbExportOpps(OPPS.map(o=>o.id))">${IC.exp}Export CSV</button>`,deals:''}[type];
  return `${canImport()?`<button type="button" role="menuitem" data-ih-import onclick="ihStart('${type}')">${IC.imp}Import ${TYPE_LABEL[type].toLowerCase()}</button>`:''}${exp}${canImport()?`<hr role="separator"><button type="button" role="menuitem" data-ih-history onclick="ihOpen('${type}')">${IC.hist}View import history</button>`:''}`;
}
window.ihMenuClose=()=>document.querySelectorAll('.cr-actions-menu[data-ih-menu]').forEach(m=>{m.hidden=true;m.previousElementSibling?.setAttribute('aria-expanded','false');});
window.ihMenu=(e,type)=>{
  e.stopPropagation();const m=document.querySelector(`[data-ih-menu="${type}"]`),open=m.hidden;ihMenuClose();
  m.hidden=!open;e.currentTarget.setAttribute('aria-expanded',String(open));if(open)m.querySelector('button')?.focus();
};
document.addEventListener('click',e=>{if(!e.target.closest('.ih-actions'))ihMenuClose();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('.cr-actions-menu[data-ih-menu]:not([hidden])'))ihMenuClose();});
function toolbars(){
  for(const [page,type] of [['contacts','contacts'],['pipeline','opportunities'],['deals','deals']]){
    const bar=document.querySelector(`#p-${page} .crm-page-controls > .toolbar`);if(!bar)continue;
    let w=bar.querySelector(`[data-ih-actions="${type}"]`);
    const html=menuHtml(type);
    if(!w){
      w=document.createElement('div');w.className='cr-actions ih-actions';w.dataset.ihActions=type;
      w.innerHTML=`<button type="button" class="btn-ghost cr-actions-btn" aria-haspopup="menu" aria-expanded="false" onclick="ihMenu(event,'${type}')">Actions <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button><div class="cr-actions-menu" role="menu" aria-label="${TYPE_LABEL[type]} actions" data-ih-menu="${type}" hidden></div>`;
      const anchor=bar.querySelector('[data-aw-action]')||[...bar.querySelectorAll(':scope > .btn-primary')].pop();
      bar.insertBefore(w,anchor||null);
    }
    w.querySelector('[data-ih-menu]').innerHTML=html;
    w.hidden=!html;
  }
  const ctExp=[...document.querySelectorAll('#p-contacts .toolbar > .btn-ghost')].find(b=>/Export CSV/.test(b.textContent));if(ctExp)ctExp.style.display='none';
  const hist=[...document.querySelectorAll('#ui-import-menu [role=menuitem]')].find(b=>/View history/.test(b.textContent));
  if(hist){hist.disabled=false;hist.removeAttribute('title');hist.removeAttribute('aria-description');hist.innerHTML=hist.innerHTML.replace('View history','View import history');hist.onclick=()=>{if(typeof uiImportMenuClose==='function')uiImportMenuClose();ihOpen('units');};hist.hidden=!canImport();}
}

// Page section
const sec=document.createElement('section');sec.className='page';sec.id='p-imports';sec.innerHTML='<div class="wrap" id="ih-root"></div>';
document.getElementById('p-contacts').after(sec);
CRUMB.imports='Data activity';
const baseGo=window.go;
window.go=function(page){
  const r=baseGo.apply(this,arguments);
  if(page==='imports'&&document.getElementById('p-imports').classList.contains('on')){
    const from=TYPE_PAGE[IH.view.from];
    if(from){document.querySelectorAll('.ni').forEach(n=>n.classList.toggle('on',n.dataset.page===from));document.getElementById('crumb').innerHTML=`<a onclick="go('${from}')">${esc(CRUMB[from])}</a><span class="sep">/</span><span class="cur">Import history</span>`;}
    ihRender();
  }
  if(['contacts','pipeline','deals','properties'].includes(page))toolbars();
  return r;
};
const baseSetPersona=window.setPersona;
if(baseSetPersona)window.setPersona=function(){const r=baseSetPersona.apply(this,arguments);toolbars();if(document.getElementById('p-imports')?.classList.contains('on')&&!canImport())go('today');else ihRefresh();return r;};

// Development page: Imports tab
const baseRenderDev=window.renderDev;
window.renderDev=function(){
  if(dvTabCur==='imports'&&!canImport())dvTabCur='overview';
  const imports=dvTabCur==='imports';if(imports)dvTabCur='deals';
  baseRenderDev.apply(this,arguments);
  if(imports)dvTabCur='imports';
  const d=dvCur,tabs=document.querySelector('#dv-root .crm-page-controls .tabs');if(!d||!tabs||!canImport())return;
  if(typeof deState==='function')deState(d);
  const mine=allBatches().filter(b=>b.dev===d.name);
  tabs.insertAdjacentHTML('beforeend',`<button class="tab ${imports?'on':''}" data-ih-devtab onclick="dvSetTab('imports')">Imports (${mine.length})</button>`);
  if(!imports)return;
  tabs.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.hasAttribute('data-ih-devtab')));
  document.getElementById('dv-tabc').innerHTML=`<div class="dcard ih-devcard"><div class="row-between"><div><h3 style="margin:0">Imports for ${esc(d.name)}</h3><div class="ih-mu">Units, files, opportunities and deals brought into this development, including setup imports.</div></div>
    <div class="ih-row"><button type="button" class="btn-ghost df-sm" onclick="ihStart('opportunities','${esc(d.name)}')">Import opportunities</button><button type="button" class="btn-ghost df-sm" onclick="ihStart('deals','${esc(d.name)}')">Import deals</button>${typeof deOpen==='function'?`<button type="button" class="btn-ghost df-sm" onclick="deOpen('${d.id}','uploads')">Upload files</button>`:''}</div></div>
    ${rowsHtml(mine,{dev:d.name})}<button type="button" class="df-link" onclick="ihOpen('all','${esc(d.name)}')">Open in Data activity</button></div>`;
};

// Contact details: where the record came from
const baseCtDetails=window.ctDetailsHtml;
if(baseCtDetails)window.ctDetailsHtml=function(c){
  const html=baseCtDetails.apply(this,arguments),b=c.importId&&IH.batches.find(x=>x.id===c.importId);
  if(!b)return html;
  return html.replace('<div class="side-h">Source</div>',`<div class="side-h">Source</div><div class="side-kv"><div class="k">Imported</div><div class="v"><button type="button" class="df-link" data-ih-prov onclick="ihDetail('${b.id}')">${esc(b.id)} · ${esc(b.file)}</button><div class="df-mu">${esc(b.by)} · ${esc(b.when)}${b.status==='undone'?' · undone':''}</div></div></div>`);
};

// Development editor unit imports land in Data activity too
const baseDeImpApply=window.deImpApply;
if(baseDeImpApply)window.deImpApply=function(mode){
  const d=deDev(),rows=deImpFinal(),total=(DE.imp.rows||[]).length;
  const r=baseDeImpApply.apply(this,arguments);
  IH.batches.unshift({id:nextId(),type:'units',file:`${d.name} · ${DE.imp.purpose||'Unit import'}`,dev:d.name,by:me(),when:nowTxt(),days:0,m:mins(),status:mode==='apply'?'applied':'draft',
    source:'Development editor · Import / export units',mode:DE.imp.purpose||'Update',rows:total,undoable:false,undoNote:'Unit price changes are reversed from Units & availability in the development editor.',
    counts:{created:0,updated:rows.length,skipped:total-rows.length,failed:0},records:rows.map(x=>({row:x.r,name:x.unit,sub:`${x.field}: ${x.old} → ${x.nw}`,outcome:'updated',link:{k:'unit',id:x.unit}}))});
  return r;
};

// Settings › Data and privacy › Data activity
const BST=window.BST;
if(BST&&BST.pages.data){
  const tabs=BST.pages.data.tabs;if(!tabs.some(t=>t[1]==='data/activity'))tabs.splice(1,0,['Data activity','data/activity']);
  BST.pages['data/activity']={nav:'data',t:'Data and privacy',tag:'Not in PRD',d:'Every import, bulk change and upload, who ran it and what it changed. Applied imports can be undone for 7 days.',cr:'Data and privacy / Data activity',tabs,
    b:[{k:'custom',render:()=>panelHtml('settings')}]};
  const note=BST.pages.data.b.find(b=>b.nt==='Data activity');if(note)note.act=['Open Data activity','p:data/activity'];
}

if(typeof deState==='function')DEVS.forEach(d=>{try{deState(d);}catch(e){}});
seed();
toolbars();
})();
