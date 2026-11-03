// Edit development (Bricly Edit Development · ED01–ED13): a full-page editor with a draft that publishes
// as a new content version, and a separate inventory batch for unit changes that never rides along with a publish.
// Admins (owner) publish and apply batches; managers and marketing save drafts and request review.

const DE={devId:null,section:'overview',drawer:null,modal:null,sel:{},fStatus:'all',fType:'all',mediaTab:'All',fSide:'front',fSel:null,floor:null,imp:null,pendingNav:null};
const DE_NAV=[
  {id:'overview',label:'Overview',code:'ED01'},
  {group:'Development'},{id:'details',label:'Details & location',code:'ED02'},{id:'lifestyle',label:'Lifestyle, amenities & team',code:'ED03'},
  {group:'Inventory'},{id:'units',label:'Units & availability',code:'ED04'},{id:'plans',label:'Plans & property views',code:'ED05'},{id:'facade',label:'Facade mapping',code:'ED05'},{id:'finishes',label:'Finishes, packs & extras',code:'ED06'},
  {group:'Sales content'},{id:'media',label:'Media & documents',code:'ED07'},{id:'payment',label:'Payment terms',code:'ED08'},{id:'timeline',label:'Timeline & delivery',code:'ED09'},{id:'presentation',label:'Presentation, brand & links',code:'ED10'},
  {group:'Publish'},{id:'review',label:'Review & publish',code:'ED11'},{id:'history',label:'History',code:'ED11'},
  {group:'Uploads'},{id:'uploads',label:'Upload history',code:'ED13'},
];
const DE_SECTION_KEYS={details:['name','tagline','about','logo','loc','street','locality','country','lat','lng','dests'],lifestyle:['amen','stories','team'],finishes:['packs','extras'],
  media:['assets','docs','video'],payment:['pay','financing'],timeline:['timeline'],presentation:['chapters','logoDark','colors','fontH','fontB','voice','links'],facade:['facades'],plans:['plans']};
const DE_LABEL={details:'Details & location',lifestyle:'Lifestyle, amenities & team',finishes:'Finishes, packs & extras',media:'Media & documents',payment:'Payment terms',timeline:'Timeline & delivery',presentation:'Presentation, brand & links',facade:'Facade mapping',plans:'Plans & property views'};

function deDev(){return DEVS.find(d=>d.id===DE.devId);}
function deCode(d){return 'DEV-'+String(140+Math.max(0,DEVS.indexOf(d))).padStart(4,'0');}
function deAdmin(){return typeof curPersona==='undefined'||curPersona==='owner';}
function deCanEdit(){return typeof curPersona==='undefined'||['owner','manager','marketing'].includes(curPersona);}
function deMe(){return (typeof PERSONAS!=='undefined'&&PERSONAS[curPersona]?.name)||'You';}
function deEsc(s){return xesc(String(s??''));}
function deUnits(d){return UNITS.filter(u=>u.dev===d.name);}
function deNow(){const n=new Date();return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;}
function deClone(v){return JSON.parse(JSON.stringify(v));}
function deTypeKey(u){return u.type==='Studio'?'Studio':u.type==='Penthouse'?'Penthouse':u.type==='Maisonette'?`${u.beds}-bed maisonette`:`${u.beds}-bed`;}

// ---------- content model: live snapshot + draft ----------
function deSeedContent(d){
  const lalex=d.id==='lalex', units=deUnits(d), [street,locality]=lalex?['14–18 Triq Manwel Dimech','Sliema SLM 1051']:['',d.loc];
  const assets=[
    ...d.media.renders.ext.map((r,i)=>({id:'r'+i,n:r.cap,img:r.img,cat:'Render',label:'Render',alt:r.cap,cover:i===0,units:[],types:[],packs:[],room:'',orient:'',src:'Studio render'})),
    ...d.media.renders.int.map((r,i)=>({id:'i'+i,n:r.cap,img:r.img,cat:'Render',label:'Representative',alt:r.cap,cover:false,units:[],types:[...new Set(units.filter(u=>u.beds===2).map(deTypeKey))].slice(0,1),packs:[],room:'Living',orient:'',src:'Studio render'})),
    ...d.media.photos.map((p,i)=>({id:'p'+i,n:p.cap,img:p.img,cat:'Photo',label:'Photo',alt:lalex&&/café|caf\u00e9/i.test(p.cap)?'':p.cap,cover:false,units:[],types:[],packs:[],room:'',orient:'',src:'Photo · 3 May 2026'})),
  ];
  const cat=n=>/pool|gym|spa|garden|courtyard|terrace|trail/i.test(n)?'Outdoor':/park|garage|ev/i.test(n)?'Parking':/lift|concierge|security|valet|hotel/i.test(n)?'Access':/storage|cellar/i.test(n)?'Storage':/facade|heritage/i.test(n)?'Heritage':'Lifestyle';
  const sample=units.filter(u=>u.status==='available').map(u=>u.price).sort((a,b)=>a-b);
  return {
    name:d.name,tagline:d.tag||'',about:d.about||'',logo:d.logo||'',loc:d.loc,street,locality,country:'Malta',lat:d.lat,lng:d.lng,
    dests:d.dist.map(([n,v])=>({n,mode:/drive/i.test(v)?'Drive':/ferry/i.test(n)?'Walk':'Walk',v:v.replace(/\s*(walk|drive)$/i,''),src:'Google Maps · Sep 2026'})),
    amen:d.amen.map(n=>({n,cat:cat(n),acc:/cellar|storage|garage/i.test(n)?'Paid · €9,500':'Included',del:d.completion==='Ready'?'Delivered':'Planned · opening '+d.completion})),
    stories:lalex?[{h:'Sliema at your door',c:'Cafés on Bisazza Street, the seafront promenade and the Valletta ferry, all within a few minutes on foot.',img:'cafe.jpg',aud:'Everyone'},{h:'A restored entrance',c:'Terrazzo floors and the original stair, kept and restored.',img:'cine-lobby.jpg',aud:'Everyone'}]
      :[{h:d.tag||d.name,c:d.about.split('.')[0]+'.',img:d.photo,aud:'Everyone'}],
    team:[{ini:'VH',n:'Vella Holdings',role:'Developer · shared profile',note:'Bio · logo · 3 credentials'},{ini:'AC',n:'Anna Cassar Architects',role:lalex?'Architect · heritage restoration':'Architect',note:'Logo missing'},{ini:'BC',n:'Borg Construction',role:'Contractor',note:'Bio hidden in buyer view'}],
    packs:[{n:'Classic oak',d:'Oak floors, white oak joinery, brushed nickel fittings',price:0,mode:'Included',def:true,dl:'30 Nov 2026',mats:[{room:'Floors',name:'White oak engineered',finish:'Matte lacquer',sw:'#c8a97e'},{room:'Kitchen',name:'Oak veneer fronts',finish:'Natural oil',sw:'#b89068'},{room:'Bathroom',name:'Porcelain 60×120',finish:'Warm grey',sw:'#bdb6ab'},{room:'Fittings',name:'Brushed nickel',finish:'Satin',sw:'#a7a9a8'}]},
      {n:'Warm stone',d:'Limestone floors, travertine bath, bronze fittings',price:6500,mode:'Addition',def:false,dl:'30 Nov 2026',mats:[{room:'Floors',name:'Maltese limestone',finish:'Honed',sw:'#d9cfbf'},{room:'Bathroom',name:'Travertine',finish:'Filled, honed',sw:'#cbb89c'},{room:'Fittings',name:'Bronze',finish:'Brushed',sw:'#8a6a45'}]},
      {n:'Noir',d:'Dark oak, black marble, matte black fittings',price:9800,mode:'Addition',def:false,dl:'30 Nov 2026',mats:[{room:'Floors',name:'Smoked oak',finish:'Matte',sw:'#4a3a2e'},{room:'Kitchen',name:'Nero Marquina marble',finish:'Honed',sw:'#1f1f1f'},{room:'Fittings',name:'Matte black',finish:'PVD',sw:'#2b2b2b'}]}],
    extras:[{n:'Cellar storage unit',note:'3 of 6 left',price:'€9,500'},{n:'Smart home package',note:'Includes smart lighting · don’t charge twice',price:'€4,200'},{n:'Bespoke joinery',note:'Adds ~4 weeks',price:'Quote required'}],
    docs:d.files.map((f,i)=>({n:f.n,meta:`${f.s} · ${f.d}`,vis:/notes|internal|yield/i.test(f.n)?'Internal':'Public',kind:/xlsx/i.test(f.n)?'XLS':'PDF'})),
    video:'',assets,
    pay:{dep:10,stg:30,bal:60,sample:sample[Math.floor(sample.length/2)]||385000},
    financing:'Illustration from Bank of Valletta home loans: 90% loan-to-value, 3.25% variable, 30 years · valid to 31 Dec 2026.',
    timeline:d.completion==='Ready'
      ?[{n:'Planning permit',type:'Actual',date:'14 Nov 2022',src:'Planning Authority',asof:'Nov 2022'},{n:'Structure & facade',type:'Actual',date:'Aug 2025',src:'Architect’s certificate',asof:'Aug 2025'},{n:'Completion',type:'Actual',date:'Mar 2026',src:'Completion certificate',asof:'Mar 2026'},{n:'Handover',type:'Per contract',date:'Within 30 days of deed',src:'Payment terms (ED08)',asof:'—'}]
      :[{n:'Planning permit',type:'Actual',date:'Mar 2024',src:'Planning Authority',asof:'Mar 2024'},{n:'Shell complete',type:'Estimated range',date:'Q2–Q3 2026',src:'Contractor',asof:'Sep 2026'},{n:'Completion',type:'Estimated range',date:d.completion,src:'Contractor',asof:'Sep 2026'},{n:'Handover',type:'Per contract',date:'Within 30 days of deed',src:'Payment terms (ED08)',asof:'—'}],
    chapters:[{n:'Developer credibility',on:true},{n:'About the project',on:true},{n:'Location',on:true},{n:'Lifestyle',on:true},{n:'Amenities',on:true},{n:'Property types & finishes',on:true},{n:'Availability & configuration',on:true},{n:'Payment terms & timeline',on:true,locked:true}],
    logoDark:'',colors:[{n:'Primary',v:'#657A32'},{n:'Ink',v:'#2E2D2C'},{n:'Surface',v:'#FCFBF9'}],fontH:'Martina Plantijn',fontB:'Inter',voice:'Warm, specific and unhurried. Lead with the place, then the home.',
    links:{web:'',ig:lalex?'http://instagram.com/lalexsliema':'',fb:''},
    facades:deSeedFacades(d,units),
    plans:{},
  };
}
function deSeedFacades(d,units){
  const lalexM={front:[['#CM9602',20,80],['#CM9611',80,80],['#CM9820',24,60],['#CM9803',72,60],['#CM9805',28,40],['#CM9814',70,40],['#CM9402',30,20],['#CM9822',68,20]],court:[['#CM9602',30,75],['#CM9611',72,75],['#CM9803',62,45]]};
  const toM=list=>Object.fromEntries(list.filter(([id])=>units.some(u=>u.id===id)).map(([id,x,y])=>[id,[x,y]]));
  const grid=Object.fromEntries(units.slice(0,8).map((u,i)=>[u.id,[20+(i%3)*30,85-Math.min(4,u.floor||0)*16]]));
  const second=d.media.renders.ext[1]?.img||d.media.renders.int[0]?.img||d.photo;
  return {front:{label:`Front · ${d.id==='lalex'?'Triq Manwel Dimech':'street elevation'}`,img:d.photo,m:d.id==='lalex'?toM(lalexM.front):grid},
    court:{label:d.id==='lalex'?'Rear · garden court':'Rear elevation',img:second,m:d.id==='lalex'?toM(lalexM.court):{}},
    side:{label:'Side · party wall',na:'Shared wall, no windows',m:{}}};
}
function deState(d){
  if(d.editor) return d.editor;
  const live=deSeedContent(d);
  d.editor={live,draft:deClone(live),version:d.version||13,publishedBy:'Maria Borg',publishedAt:'22 Sep',save:'clean',savedAt:'',review:null,batch:[],
    uploads:[],fixup:d.id==='lalex'?[{n:'FP_unit7_v3.pdf',size:'0.9 MB',who:'Luke Borg',pick:''},{n:'plan-top-floor.pdf',size:'1.4 MB',who:'Luke Borg',pick:''}]:[],
    uploadBatches:[{when:'25 Sep, 09:10',title:'12 files · drag and drop',routed:'8 plans to units · 3 renders to Media · 1 sheet to Documents',who:'Luke Borg',status:d.id==='lalex'?'2 need a unit':'Done'},{when:'12 Jun, 14:02',title:'Unit plans v2 · 4 files',routed:'4 plans to unit types',who:'Anna Cassar Architects',status:'Done'}],
    history:[{v:d.version||13,what:'Payment terms and price list updated',who:'Maria Borg',when:'22 Sep',snap:deClone(live)},{v:(d.version||13)-1,what:'Lifestyle stories and amenities',who:'Claire Azzopardi',when:'2 Sep',snap:null},{v:(d.version||13)-2,what:'Launch content',who:'Claire Azzopardi',when:'14 Jul',snap:null}],
    staged:null};
  return d.editor;
}
function deDraft(){return deState(deDev()).draft;}
// Called after every edit: marks the draft unsaved and refreshes the status line without re-rendering inputs.
function deMark(){const st=deState(deDev());st.save='unsaved';deHeaderRefresh();}
function deSet(path,val,rerender=false){
  const dr=deDraft(), keys=path.split('.'); let o=dr; keys.slice(0,-1).forEach(k=>o=o[k]);
  o[keys.at(-1)]=val; deMark(); if(rerender) deRender();
}
function deChanges(d){
  const st=deState(d), out=[];
  Object.entries(DE_SECTION_KEYS).forEach(([sec,keys])=>keys.forEach(k=>{
    if(JSON.stringify(st.draft[k])!==JSON.stringify(st.live[k])) out.push({sec,label:DE_LABEL[sec],d:deChangeText(k,st.live[k],st.draft[k])});
  }));
  return out;
}
function deChangeText(k,a,b){
  const names={name:'Display name',tagline:'Tagline',about:'About',logo:'Project logo',loc:'Location label',street:'Street address',locality:'Locality',country:'Country',lat:'Latitude',lng:'Longitude',dests:'Nearby destinations',amen:'Amenities',stories:'Lifestyle stories',team:'Project team',packs:'Finish packs',extras:'Extras',assets:'Media',docs:'Documents',video:'Hero video',pay:'Payment milestones',financing:'Financing content',timeline:'Timeline',chapters:'Presentation chapters',logoDark:'Dark logo',colors:'Brand colours',fontH:'Heading typeface',fontB:'Body typeface',voice:'Voice',links:'Links',facades:'Facade markers',plans:'Unit plans'};
  if(typeof a==='string'&&typeof b==='string'&&a.length<60&&b.length<60) return `${names[k]}: “${a||'—'}” → “${b||'—'}”`;
  if(Array.isArray(a)&&Array.isArray(b)&&a.length!==b.length) return `${names[k]}: ${a.length} → ${b.length}`;
  return `${names[k]} edited`;
}
function deMustFix(d){
  const dr=deState(d).draft, out=[];
  if(!dr.name.trim()) out.push({t:'Display name is required',sec:'details'});
  if(dr.about.length>600) out.push({t:`About is ${dr.about.length} characters · limit 600`,sec:'details'});
  if(!(dr.lat>=-90&&dr.lat<=90)||!(dr.lng>=-180&&dr.lng<=180)) out.push({t:'Latitude or longitude is out of range',sec:'details'});
  dr.assets.filter(a=>a.img&&!a.alt.trim()).forEach(a=>out.push({t:`Alt text is missing on “${a.n}”`,sec:'media',asset:a.id}));
  Object.entries(dr.links).forEach(([k,v])=>{if(v&&!/^https:\/\//i.test(v)) out.push({t:`${{web:'Website',ig:'Instagram',fb:'Facebook'}[k]} link must use HTTPS`,sec:'presentation'});});
  const total=dr.pay.dep+dr.pay.stg+dr.pay.bal; if(total!==100) out.push({t:`Payment milestones add up to ${total}% · must be 100%`,sec:'payment'});
  dr.timeline.filter(r=>r.needsReason&&!r.reason).forEach(r=>out.push({t:`Give a reason for revising “${r.n}”`,sec:'timeline'}));
  dr.stories.filter(s=>!s.h.trim()).forEach((s,i)=>out.push({t:`Lifestyle story ${i+1} needs a heading`,sec:'lifestyle'}));
  return out;
}
function deWarnings(d){
  const st=deState(d), dr=st.draft, out=[];
  if(dr.name!==st.live.name) out.push(`Rename to “${dr.name}”: previously sent PDFs keep “${st.live.name}”. Links stay attached via ${deCode(d)}.`);
  if(!dr.video) out.push(`No hero video. The ${dr.assets.find(a=>a.cover)?.n||'cover image'} will show instead.`);
  dr.assets.filter(a=>a.label==='Representative').forEach(a=>out.push(`${a.n} is representative. It’s labelled as such${a.types.length?' on '+a.types.join(', ')+' units':''}.`));
  return out;
}
function deSecFix(d,sec){return deMustFix(d).filter(m=>m.sec===sec).length;}

// ---------- page shell ----------
function deMount(){
  let p=document.getElementById('p-devedit'); if(p) return p;
  const host=document.getElementById('dv-root').closest('.page');
  p=document.createElement('section'); p.className='page'; p.id='p-devedit';
  p.innerHTML='<div id="de-root"></div>'; host.parentNode.insertBefore(p,host.nextSibling);
  return p;
}
function deOpen(id,section='overview'){
  const d=DEVS.find(x=>x.id===id); if(!d) return;
  if(!deCanEdit()){showToast('Only admins, managers and marketing can edit developments');return;}
  DE.devId=id; DE.section=section; DE.drawer=null; DE.modal=null; DE.sel={}; DE.floor=null; DE.fSel=null; DE.imp=null;
  deState(d); deMount();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('p-devedit').classList.add('on');
  document.querySelectorAll('.ni').forEach(n=>n.classList.toggle('on',n.dataset.page==='developments'));
  document.getElementById('crumb').innerHTML=`<a onclick="go('developments')">Developments</a><span class="sep">/</span><a onclick="deLeave(()=>openDev('${d.id}'))">${deEsc(d.name)}</a><span class="sep">/</span><span class="cur">Edit</span>`;
  deRender(); document.getElementById('content').scrollTop=0;
  if(section==='units'&&DE.imp===null&&arguments[2]==='import') deImpOpen();
}
function deOpenUnit(unitId){
  const u=UN(unitId),d=u&&DEV(u.dev); if(!d) return;
  deOpen(d.id,'units'); if(DE.devId!==d.id) return;
  DE.drawer={k:'unit',id:u.id,tab:'details'}; deRender();
}
function deGo(sec){DE.section=sec;DE.drawer=null;deRender();document.getElementById('content').scrollTop=0;}
function deStatusTxt(st){
  if(st.save==='unsaved') return '● Unsaved changes';
  if(st.save==='saved'||JSON.stringify(st.draft)!==JSON.stringify(st.live)) return `Draft saved ${st.savedAt||''} · not published`.replace('  ',' ');
  return `No draft changes · last published ${st.publishedAt} by ${st.publishedBy}`;
}
function dePubChip(st,d){const ch=deChanges(d).length;return ch?`<span class="de-chip warn">Draft · ${ch} change${ch===1?'':'s'}</span>`:`<span class="de-chip ok">Published · v${st.version}</span>`;}
function deHeaderRefresh(){
  const d=deDev(), st=deState(d), el=document.getElementById('de-status'), chip=document.getElementById('de-pubchip');
  if(el){el.textContent=deStatusTxt(st);el.className='de-status '+(st.save==='unsaved'?'warn':'');}
  if(chip) chip.innerHTML=dePubChip(st,d);
  document.querySelectorAll('[data-de-fix]').forEach(b=>{const n=deSecFix(d,b.dataset.deFix);b.textContent=n?`${n} to fix`:'';b.hidden=!n;});
}
function deRender(){
  const d=deDev(); if(!d) return;
  const st=deState(d), admin=deAdmin(), body={overview:deOverviewHtml,details:deDetailsHtml,lifestyle:deLifestyleHtml,units:deUnitsHtml,plans:dePlansHtml,facade:deFacadeHtml,finishes:deFinishesHtml,
    media:deMediaHtml,payment:dePaymentHtml,timeline:deTimelineHtml,presentation:dePresentationHtml,review:deReviewHtml,history:deHistoryHtml,uploads:deUploadsHtml}[DE.section]||deOverviewHtml;
  document.getElementById('de-root').innerHTML=`
  <header class="de-top">
    <button type="button" class="de-back" onclick="deLeave(()=>openDev('${d.id}'))">‹ ${deEsc(st.live.name)}</button>
    <div class="de-title"><div class="de-title-row"><h1>Edit ${deEsc(st.draft.name||st.live.name)}</h1><span id="de-pubchip">${dePubChip(st,d)}</span>${st.review?`<span class="de-chip info">Review requested by ${deEsc(st.review)}</span>`:''}</div>
      <div id="de-status" class="de-status ${st.save==='unsaved'?'warn':''}">${deStatusTxt(st)}</div></div>
    <div class="de-top-acts">
      <button type="button" class="btn-ghost" onclick="deLeave(()=>openDev('${d.id}'))">View live</button>
      <button type="button" class="btn-ghost" onclick="dePreview()">Preview draft</button>
      <button type="button" class="btn-ghost" onclick="deSaveDraft()">Save draft</button>
      <button type="button" class="btn-primary" onclick="deGo('review')">${admin?'Review & publish':'Request review'}</button>
    </div>
  </header>
  <div class="de-layout">
    <nav class="de-nav" aria-label="Edit sections">${DE_NAV.map(n=>n.group?`<div class="de-nav-g">${n.group}</div>`:`<button type="button" class="de-nav-i ${DE.section===n.id?'on':''}" aria-current="${DE.section===n.id?'page':'false'}" onclick="deGo('${n.id}')"><span>${n.label}</span><span class="de-fix" data-de-fix="${n.id}" ${deSecFix(d,n.id)?'':'hidden'}>${deSecFix(d,n.id)} to fix</span>${n.id==='units'&&st.batch.length?`<span class="de-fix info">${st.batch.length}</span>`:''}${n.id==='uploads'&&st.fixup.length?`<span class="de-fix">${st.fixup.length}</span>`:''}</button>`).join('')}</nav>
    <main class="de-main" id="de-main">${body(d,st)}</main>
  </div>
  ${DE.drawer?deDrawerHtml(d,st):''}
  ${DE.modal?deModalHtml(d,st):''}`;
}
function deHead(code,title,sub,acts=''){return `<div class="de-sec-head"><div><div class="de-code">${code}</div><h2>${title}</h2><p>${sub}</p></div>${acts?`<div class="de-acts">${acts}</div>`:''}</div>`;}
function deField(label,inner,hint=''){return `<label class="de-field"><span>${label}</span>${inner}${hint?`<small>${hint}</small>`:''}</label>`;}
function deInput(path,val,attrs=''){return `<input value="${deEsc(val)}" ${attrs} oninput="deSet('${path}',this.value)">`;}
function deToast(msg){showToast(msg);}

// Saving, leaving with unsaved changes
function deSaveDraft(){const st=deState(deDev());st.save='saved';st.savedAt='at '+deNow();deHeaderRefresh();deToast('Draft saved · live content isn’t affected');}
function deLeave(fn){
  const d=deDev(); if(!d){fn();return;}
  if(deState(d).save==='unsaved'){DE.pendingNav=fn;DE.modal='leave';deRender();return;}
  fn();
}
function deLeaveChoice(k){
  const fn=DE.pendingNav; DE.pendingNav=null; DE.modal=null;
  if(k==='stay'){deRender();return;}
  const st=deState(deDev());
  if(k==='discard'){st.draft=deClone(st.live);st.save='clean';}
  if(k==='save'){st.save='saved';st.savedAt='at '+deNow();}
  fn&&fn();
}

// ---------- ED01 overview ----------
function deOverviewHtml(d,st){
  const ch=deChanges(d), mf=deMustFix(d), s=dvStats(d.name), units=deUnits(d), tl=st.draft.timeline.find(r=>/completion/i.test(r.n));
  return deHead('ED01','What needs attention','Content drafts publish together. Inventory changes are applied separately and never ride along with a publish.')+`
  <div class="de-grid3">
    <div class="de-card"><div class="row-between"><b>Content draft</b>${dePubChip(st,d)}</div>
      ${ch.length?ch.map(c=>`<button type="button" class="de-row-btn" onclick="deGo('${c.sec}')"><span>${deEsc(c.label)}</span><span class="de-mu">${deEsc(c.d)}</span></button>`).join(''):`<p class="de-mu">No changes yet. Live content is v${st.version}, published ${st.publishedAt} by ${deEsc(st.publishedBy)}.</p>`}</div>
    <div class="de-card"><div class="row-between"><b>Must fix before publishing</b>${mf.length?`<span class="de-chip bad">${mf.length}</span>`:''}</div>
      ${mf.map(m=>`<button type="button" class="de-row-btn" onclick="deFix('${m.sec}','${m.asset||''}')"><span>${deEsc(m.t)}</span><span class="de-mu">${DE_LABEL[m.sec]||m.sec} ›</span></button>`).join('')||'<p class="de-mu">Nothing blocking. You can publish once you’ve reviewed the changes.</p>'}</div>
    <div class="de-card"><b>Inventory batches</b><p class="de-mu">${st.batch.length} proposed unit change${st.batch.length===1?'':'s'} waiting. These apply from Units & availability, not with Publish.</p>
      ${st.batch.length?`<button type="button" class="btn-ghost df-sm" onclick="deGo('units')">Review batch</button>`:''}
      ${d.id==='lalex'?'<p class="de-mu">Setup request SR-0418 · expected 14 units (planning number) · 8 units recorded</p>':''}</div>
  </div>
  <div class="de-card"><div class="row-between"><b>Calculated from units</b><span class="de-mu">Read-only · edit the units to change these</span></div>
    <div class="de-stats">${[[s.total,'Units'],[s.avail,'Available'],[fmtK(s.min),'Lowest listing price'],['€'+s.psq.toLocaleString(),'Average €/m² (internal)']].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div></div>
  <div class="de-grid3">
    <div class="de-card"><span class="de-mu">Content publication</span><b>${dePubChip(st,d)}</b><span class="de-mu">Controlled here · ${deAdmin()?'you publish':'an admin publishes'}</span></div>
    <div class="de-card"><span class="de-mu">Construction & delivery</span><b>${d.completion==='Ready'?'Complete · ready now':'Under construction · '+deEsc(d.completion)}</b><span class="de-mu">From Timeline & delivery${tl?' · '+deEsc(tl.date):''}</span></div>
    <div class="de-card"><span class="de-mu">Inventory availability</span><b>${s.avail} available · ${s.held} held · ${s.sold} sold</b><span class="de-mu">From live units and deals</span></div>
  </div>`;
}
function deFix(sec,asset){DE.section=sec;if(asset){DE.drawer={k:'asset',id:asset};}deRender();setTimeout(()=>document.querySelector('#de-main .de-invalid, #de-drawer input')?.focus(),30);}

// ---------- ED02 details & location ----------
function deDetailsHtml(d,st){
  const dr=st.draft, tl=dr.timeline.find(r=>/completion/i.test(r.n));
  return deHead('ED02','Details & location','Shown on the development page, sales links and Present Mode.')+`
  <div class="de-card"><b>Identity</b>
    <div class="de-g2">${deField('Display name · required to publish',`<input class="${dr.name.trim()?'':'de-invalid'}" value="${deEsc(dr.name)}" oninput="deSet('name',this.value);this.classList.toggle('de-invalid',!this.value.trim())">`)}${deField('System ID',`<input value="${deCode(d)}" readonly>`)}</div>
    ${dr.name!==st.live.name?`<div class="de-note">Renaming from “${deEsc(st.live.name)}”. Units, deals and shared links stay attached through ${deCode(d)}. The rename is reviewed at publish and previously sent PDFs keep the old name.</div>`:''}
    ${deField('Tagline',deInput('tagline',dr.tagline))}
    ${deField('Project logo · shown on the development page, sales links and Present Mode',deLogoHtml('logo',dr.logo,dr.name),'The same file is used in Presentation › Brand. Add a white version there for dark backgrounds.')}
    <label class="de-field"><span class="row-between">About <span class="de-mu" id="de-about-n">${dr.about.length} / 600</span></span><textarea rows="4" class="${dr.about.length>600?'de-invalid':''}" oninput="deSet('about',this.value);document.getElementById('de-about-n').textContent=this.value.length+' / 600';this.classList.toggle('de-invalid',this.value.length>600)">${deEsc(dr.about)}</textarea></label>
  </div>
  <div class="de-card"><b>Location</b>
    <div class="de-g2">${deField('Location label',deInput('loc',dr.loc))}${deField('Street address',deInput('street',dr.street))}${deField('Locality',deInput('locality',dr.locality))}${deField('Country',deInput('country',dr.country))}</div>
    <div class="de-map"><iframe title="Map with pin at ${deEsc(dr.name)}" loading="lazy" src="https://www.google.com/maps?q=${dr.lat},${dr.lng}&z=16&output=embed"></iframe><span class="de-mu">Search to move the pin, or type the coordinates</span></div>
    <div class="de-g2">${deField('Latitude (−90 to 90)',`<input type="number" step="any" min="-90" max="90" value="${dr.lat}" onchange="deSet('lat',Number(this.value),true)">`)}${deField('Longitude (−180 to 180)',`<input type="number" step="any" min="-180" max="180" value="${dr.lng}" onchange="deSet('lng',Number(this.value),true)">`)}</div>
  </div>
  <div class="de-card"><div class="row-between"><b>Nearby destinations</b><button type="button" class="btn-ghost df-sm" onclick="deListAdd('dests',{n:'',mode:'Walk',v:'',src:'Added by you'})">+ Add destination</button></div>
    <div class="de-table"><div class="de-tr de-th de-dest"><span></span><span>Destination</span><span>Mode</span><span>Time</span><span>Source</span><span></span></div>
    ${dr.dests.map((x,i)=>`<div class="de-tr de-dest"><button type="button" class="tool" aria-label="Move up" ${i?'':'disabled'} onclick="deListMove('dests',${i},-1)">↑</button>
      <input aria-label="Destination" placeholder="e.g. Tigné Point" value="${deEsc(x.n)}" oninput="deSet('dests.${i}.n',this.value)">
      <select aria-label="Mode" onchange="deSet('dests.${i}.mode',this.value)">${['Walk','Drive','Ferry','Bus'].map(m=>`<option ${m===x.mode?'selected':''}>${m}</option>`).join('')}</select>
      <input aria-label="Time" placeholder="4 min" value="${deEsc(x.v)}" oninput="deSet('dests.${i}.v',this.value)">
      <span class="de-mu">${deEsc(x.src)}</span><button type="button" class="tool" aria-label="Remove ${deEsc(x.n)}" onclick="deListDel('dests',${i})">×</button></div>`).join('')}</div>
  </div>
  <div class="de-card row-between"><div><b>Expected delivery · read from Timeline</b><div class="de-mu">${d.completion==='Ready'?'Ready now · completed '+deEsc(tl?.date||''):deEsc(tl?.date||d.completion)}</div></div><button type="button" class="btn-ghost df-sm" onclick="deGo('timeline')">Edit timeline</button></div>`;
}
function deLogoHtml(path,val,name){
  return `<div class="de-logo">${val?`<span class="de-logo-prev"><img src="${deEsc(val)}" alt="${deEsc(name)} logo"></span><button type="button" class="btn-ghost df-sm" onclick="this.nextElementSibling.click()">Replace</button><input type="file" hidden accept="image/svg+xml,image/png" onchange="deLogoFile('${path}',this)"><button type="button" class="btn-ghost df-sm" onclick="deSet('${path}','',true)">Remove</button>`
    :`<button type="button" class="de-drop" onclick="this.nextElementSibling.click()"><b>Upload logo</b><span class="de-mu">SVG or PNG, transparent, up to 5 MB</span></button><input type="file" hidden accept="image/svg+xml,image/png" onchange="deLogoFile('${path}',this)">`}</div>`;
}
function deLogoFile(path,input){const f=input.files[0];if(!f)return;if(f.size>5*1024*1024){deToast('Logo must be 5 MB or less');return;}deSet(path,URL.createObjectURL(f),true);deToast('Logo added to the draft');}
function deListAdd(key,item){deDraft()[key].push(item);deMark();deRender();}
function deListDel(key,i){deDraft()[key].splice(i,1);deMark();deRender();}
function deListMove(key,i,dir){const a=deDraft()[key],j=i+dir;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];deMark();deRender();}

// ---------- ED03 lifestyle, amenities & team ----------
function deLifestyleHtml(d,st){
  const dr=st.draft, imgs=dr.assets.filter(a=>a.img);
  return deHead('ED03','Lifestyle, amenities & team','Images are picked from Media, not uploaded again here.')+`
  <div class="de-card"><div class="row-between"><b>Amenities</b><button type="button" class="btn-ghost df-sm" onclick="deListAdd('amen',{n:'',cat:'Lifestyle',acc:'Included',del:'Delivered'})">+ Add amenity</button></div>
    ${dr.amen.map((a,i)=>`<div class="de-tr de-amen"><button type="button" class="tool" aria-label="Move up" ${i?'':'disabled'} onclick="deListMove('amen',${i},-1)">↑</button>
      <input aria-label="Amenity" value="${deEsc(a.n)}" oninput="deSet('amen.${i}.n',this.value)">
      <select aria-label="Category" onchange="deSet('amen.${i}.cat',this.value)">${['Outdoor','Heritage','Access','Storage','Parking','Lifestyle','Wellness'].map(c=>`<option ${c===a.cat?'selected':''}>${c}</option>`).join('')}</select>
      <input aria-label="Access" value="${deEsc(a.acc)}" oninput="deSet('amen.${i}.acc',this.value)">
      <select aria-label="Delivery" onchange="deSet('amen.${i}.del',this.value)">${['Delivered','Planned · opening Q2 2027','Planned · opening Q4 2027'].map(c=>`<option ${c===a.del?'selected':''}>${c}</option>`).join('')}</select>
      <button type="button" class="tool" aria-label="Remove ${deEsc(a.n)}" onclick="deListDel('amen',${i})">×</button></div>`).join('')}
    <p class="de-mu">Planned amenities show “Planned · opening Q2 2027” to buyers. Paid access is always labelled.</p></div>
  <div class="de-card"><div class="row-between"><b>Lifestyle story <span class="de-mu">${dr.stories.length} stor${dr.stories.length===1?'y':'ies'} · shown in order in Present Mode › Lifestyle</span></b><button type="button" class="btn-ghost df-sm" onclick="deListAdd('stories',{h:'',c:'',img:'',aud:'Everyone'})">+ Add story</button></div>
    ${dr.stories.map((s,i)=>`<div class="de-story"><div class="de-story-n">${i+1}<button type="button" class="tool" aria-label="Move up" ${i?'':'disabled'} onclick="deListMove('stories',${i},-1)">↑</button><button type="button" class="tool" aria-label="Move down" ${i<dr.stories.length-1?'':'disabled'} onclick="deListMove('stories',${i},1)">↓</button></div>
      <div class="de-story-img">${s.img?`<img src="${deEsc(awAsset(s.img))}" alt="">`:'<span class="de-mu">No image</span>'}<select aria-label="Choose from Media" onchange="deSet('stories.${i}.img',this.value,true)"><option value="">Choose from Media</option>${imgs.map(a=>`<option value="${deEsc(a.img)}" ${a.img===s.img?'selected':''}>${deEsc(a.n)}</option>`).join('')}</select></div>
      <div class="de-story-b"><input aria-label="Heading" class="${s.h.trim()?'':'de-invalid'}" placeholder="Heading" value="${deEsc(s.h)}" oninput="deSet('stories.${i}.h',this.value);this.classList.toggle('de-invalid',!this.value.trim())"><textarea aria-label="Story" rows="2" oninput="deSet('stories.${i}.c',this.value)">${deEsc(s.c)}</textarea>
        <select aria-label="Show for" onchange="deSet('stories.${i}.aud',this.value)">${['Everyone','Families','Investors','Downsizers'].map(k=>`<option value="${k}" ${k===s.aud?'selected':''}>Show for ${k}</option>`).join('')}</select></div>
      <button type="button" class="tool" aria-label="Remove story ${i+1}" onclick="deListDel('stories',${i})">×</button></div>`).join('')||'<p class="de-mu">No stories yet. The Lifestyle chapter is hidden in Present Mode until you add one.</p>'}</div>
  <div class="de-card"><div class="row-between"><b>Project team</b><button type="button" class="btn-ghost df-sm" onclick="deTeamAdd()">+ Add member</button></div>
    ${dr.team.map((m,i)=>`<div class="de-tr de-team"><span class="df-av">${deEsc(m.ini)}</span><span><b>${deEsc(m.n)}</b><span class="de-mu"> · ${deEsc(m.role)}</span></span><span class="de-mu">${deEsc(m.note)}</span><button type="button" class="tool" aria-label="Remove ${deEsc(m.n)}" onclick="deListDel('team',${i})">×</button></div>`).join('')}
    <div class="de-sub"><b>Developer proof</b> <span class="de-mu">From Vella Holdings’ shared profile · pick, don’t edit</span>
      <div class="de-mu">Onyx Rise, Mrieħel · completed 2024 · “212 homes delivered since 2011” · as of Jun 2026 · Testimonial, Maria Borg · pending approval, can’t be shown yet</div>
      <div class="de-mu">Changing company-wide figures affects every development. Ask a shared-profile editor.</div></div></div>`;
}
function deTeamAdd(){
  DE.modal='team'; deRender();
}

// ---------- ED04 units & availability (inventory batch) ----------
const DE_PROTECTED=['hold','reserved','sold'];
function deUnitDeal(u){
  const o=OPPS.find(x=>x.units.includes(u.id)&&(dealFor(x.id)||['Closed Won','Contract Booked','Negotiating'].includes(x.stage)));
  return o?{o,d:dealFor(o.id)}:null;
}
function deBatchFor(u){return deState(deDev()).batch.filter(b=>b.unit===u.id);}
function deUnitsHtml(d,st){
  const units=deUnits(d).filter(u=>(DE.fStatus==='all'||u.status===DE.fStatus)&&(DE.fType==='all'||u.type===DE.fType));
  const sel=Object.keys(DE.sel).filter(k=>DE.sel[k]), admin=deAdmin(), types=[...new Set(deUnits(d).map(u=>u.type))];
  return deHead('ED04','Units & availability','Unit changes collect in an inventory batch. Publishing content never applies them.')+`
  ${st.batch.length?`<div class="de-card de-batch"><div class="row-between"><b>Inventory batch · ${st.batch.length} proposed change${st.batch.length===1?'':'s'} · not live</b>
      <span class="de-acts"><button type="button" class="btn-ghost df-sm" onclick="deBatchDiscard()">Discard batch</button>${admin?`<button type="button" class="btn-primary df-sm" onclick="DE.modal='apply';deRender()">Review & apply changes</button>`:`<button type="button" class="btn-primary df-sm" onclick="deBatchSubmit()">Submit for approval</button>`}</span></div>
    ${st.batch.map((b,i)=>`<div class="de-tr de-brow"><span>${deEsc(b.unit)} · ${deEsc(b.field)}: ${deEsc(b.oldTxt)} → <b>${deEsc(b.newTxt)}</b></span><span class="de-mu">${deEsc(b.by)} · ${deEsc(b.at)}${b.submitted?' · submitted':''}</span><button type="button" class="tool" aria-label="Remove change" onclick="deState(deDev()).batch.splice(${i},1);deRender()">×</button></div>`).join('')}</div>`:''}
  <div class="de-toolbar">
    <select aria-label="Status" onchange="DE.fStatus=this.value;deRender()"><option value="all">All statuses</option>${['available','hold','reserved','sold','off_market'].map(s=>`<option value="${s}" ${DE.fStatus===s?'selected':''}>${UN_STATUS[s]?.l||s}</option>`).join('')}</select>
    <select aria-label="Type" onchange="DE.fType=this.value;deRender()"><option value="all">All types</option>${types.map(s=>`<option ${DE.fType===s?'selected':''}>${s}</option>`).join('')}</select>
    <span class="de-grow"></span>
    ${admin?`<button type="button" class="btn-ghost df-sm" onclick="awUnit(null,'${d.id}')">+ Add unit</button>`:''}
    <button type="button" class="btn-ghost df-sm" onclick="deImpOpen()">Export / import</button>
    <button type="button" class="btn-ghost df-sm" onclick="deGo('facade')">Map facade</button>
  </div>
  ${sel.length?`<div class="de-selbar"><b>${sel.length} selected</b><button type="button" class="btn-ghost df-sm" onclick="DE.drawer={k:'bulk'};deRender()">Bulk edit</button><button type="button" class="btn-ghost df-sm" onclick="deExport(true)">Export ${sel.length} unit${sel.length===1?'':'s'}</button><button type="button" class="df-link" onclick="DE.sel={};deRender()">Clear</button></div>`:''}
  <div class="de-table de-units">
    <div class="de-tr de-th"><input type="checkbox" aria-label="Select all" ${units.length&&units.every(u=>DE.sel[u.id])?'checked':''} onchange="units_all(this.checked)"><span>Unit</span><span>Type</span><span>Beds</span><span>Floor</span><span>Size</span><span>Listing price</span><span>€/m²</span><span>Status</span></div>
    ${units.map(u=>{const pend=deBatchFor(u);return `<div class="de-tr ${pend.length?'pending':''}"><input type="checkbox" aria-label="Select ${deEsc(u.id)}" ${DE.sel[u.id]?'checked':''} onchange="DE.sel['${u.id}']=this.checked;deRender()">
      <button type="button" class="de-link-btn" onclick="DE.drawer={k:'unit',id:'${u.id}',tab:'details'};deRender()"><b>${deEsc(u.id)}</b>${pend.length?`<span class="de-mu"> Proposed: ${pend.map(b=>deEsc(b.newTxt)).join(', ')}</span>`:''}</button>
      <span>${deEsc(u.type)}</span><span>${u.beds===0?'Studio':u.beds+' bed'} · ${u.baths||1} bath</span><span>${u.floor===0?'G':u.floor}</span><span>${u.sqm} m²${u.ext?' + '+u.ext:''}</span><span>${fmtEur(u.price)}</span><span>€${Math.round(u.price/u.sqm).toLocaleString('en-US')}</span><span class="de-st ${u.status}">${UN_STATUS[u.status]?.l||u.status}</span></div>`;}).join('')||'<div class="de-mu" style="padding:12px">No units match these filters.</div>'}
  </div>
  <p class="de-mu">Prices in EUR. Reserved, held and sold units change only through their deal.</p>`;
}
function units_all(on){deUnits(deDev()).forEach(u=>DE.sel[u.id]=on);deRender();}
function deBatchAdd(unit,field,oldV,newV,oldTxt,newTxt){
  const st=deState(deDev());
  st.batch=st.batch.filter(b=>!(b.unit===unit&&b.field===field));
  if(JSON.stringify(oldV)!==JSON.stringify(newV)) st.batch.push({unit,field,old:oldV,nw:newV,oldTxt,newTxt,by:deMe(),at:deNow()});
}
function deBatchDiscard(){deState(deDev()).batch=[];deRender();deToast('Inventory batch discarded · nothing changed on live units');}
function deBatchSubmit(){const st=deState(deDev());st.batch.forEach(b=>b.submitted=true);deRender();deToast(`Batch of ${st.batch.length} change${st.batch.length===1?'':'s'} sent to an admin for approval`);}
function deBatchApply(){
  const d=deDev(), st=deState(d), skipped=[], applied=[];
  st.batch.forEach(b=>{
    const u=UNITS.find(x=>x.id===b.unit); if(!u) return;
    if(b.field==='Availability'&&DE_PROTECTED.includes(u.status)){skipped.push(b);return;}
    const key={'Listing price':'price','Availability':'status','Type':'type','Floor':'floor','Bedrooms':'beds','Bathrooms':'baths','Internal area':'sqm','Outdoor area':'ext','Delivery':'ready','Description':'desc','Features':'views'}[b.field];
    if(key){u[key]=b.nw;applied.push(b);}
  });
  st.batch=skipped; DE.modal=null; DE.sel={};
  deRender(); if(typeof renderUnits==='function') renderUnits();
  deToast(`${applied.length} change${applied.length===1?'':'s'} applied to live units${skipped.length?` · ${skipped.length} kept back (status changed through a deal)`:''}`);
}
function deUnitSave(id){
  const u=UNITS.find(x=>x.id===id), v=k=>document.getElementById('du-'+k)?.value;
  const num=k=>Number(String(v(k)).replace(/[^\d.]/g,''));
  const fields=[['Type','type',v('type'),u.type,x=>x],['Floor','floor',num('floor'),u.floor,x=>x===0?'G':x],['Bedrooms','beds',num('beds'),u.beds,x=>x],['Bathrooms','baths',num('baths'),u.baths||1,x=>x],
    ['Internal area','sqm',num('sqm'),u.sqm,x=>x+' m²'],['Outdoor area','ext',num('ext'),u.ext||0,x=>x+' m²'],['Listing price','price',num('price'),u.price,x=>fmtEur(x)],['Description','desc',v('desc')||'',u.desc||'',x=>x?'“'+x.slice(0,24)+'…”':'—'],
    ['Features','views',(v('feat')||'').split(',').map(s=>s.trim()).filter(Boolean),u.views||[],x=>x.join(', ')||'—']];
  if(!DE_PROTECTED.includes(u.status)) fields.push(['Availability','status',v('status'),u.status,x=>UN_STATUS[x]?.l||x]);
  const exc=document.getElementById('du-exc')?.checked;
  if(exc){const when=v('when'),why=v('why');if(!when||!why){deToast('Give the expected handover and a reason for the exception');return;}fields.push(['Delivery','ready',when,u.ready,x=>x]);}
  if(!(num('price')>0)){deToast('Enter a listing price');return;}
  fields.forEach(([label,key,nw,old,fmt])=>deBatchAdd(u.id,label,old,nw,fmt(old),fmt(nw)));
  DE.drawer=null; deRender(); deToast('Saved to the inventory batch · not live yet');
}
function deBulkSave(){
  const ids=Object.keys(DE.sel).filter(k=>DE.sel[k]), pOn=document.getElementById('bk-price-on').checked, aOn=document.getElementById('bk-avail-on').checked, rOn=document.getElementById('bk-ready-on').checked;
  if(!pOn&&!aOn&&!rOn){deToast('Tick at least one field to change');return;}
  const pct=Number(document.getElementById('bk-price').value), avail=document.getElementById('bk-avail').value, ready=document.getElementById('bk-ready').value.trim();
  let n=0, kept=0;
  ids.forEach(id=>{const u=UNITS.find(x=>x.id===id); if(!u) return;
    if(pOn&&pct){const nw=Math.round(u.price*(1+pct/100)/1000)*1000;deBatchAdd(id,'Listing price',u.price,nw,fmtEur(u.price),fmtEur(nw));n++;}
    if(aOn){if(DE_PROTECTED.includes(u.status))kept++;else{deBatchAdd(id,'Availability',u.status,avail,UN_STATUS[u.status]?.l,UN_STATUS[avail]?.l);n++;}}
    if(rOn&&ready){deBatchAdd(id,'Delivery',u.ready,ready,u.ready,ready);n++;}
  });
  DE.drawer=null; DE.sel={}; deRender(); deToast(`${n} change${n===1?'':'s'} added to the inventory batch${kept?` · ${kept} protected unit${kept===1?'':'s'} skipped`:''}`);
}
function deExport(selected){
  const d=deDev(), ids=selected?Object.keys(DE.sel).filter(k=>DE.sel[k]):null, units=deUnits(d).filter(u=>!ids||ids.includes(u.id));
  const csv=['Unit ID,Type,Beds,Floor,Size,Listing price EUR,Status,Currency',...units.map(u=>[u.id.replace('#',''),u.type,u.beds,u.floor,u.sqm,u.price,UN_STATUS[u.status]?.l||u.status,'EUR'].join(','))].join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`${d.id}-units-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  deToast(`Exported ${units.length} unit${units.length===1?'':'s'} · a dated snapshot, not live inventory`);
}

// Import flow (6 steps): choose → upload → number format → match columns → review differences → confirm
function deImpRows(d){
  const units=deUnits(d), rows=[]; let r=2;
  units.forEach((u,i)=>{
    const bump=[0.021,0.03,0.026,0,0.028,0,0.104,0.02][i%8], nw=Math.round(u.price*(1+bump)/1000)*1000;
    const kind=DE_PROTECTED.includes(u.status)&&u.status==='sold'?'sold':bump===0?'same':'update';
    rows.push({r:r++,unit:u.id,field:kind==='sold'?'Availability':'Listing price',old:kind==='sold'?'Sold':fmtEur(u.price),nw:kind==='sold'?'Available':fmtEur(nw),nwV:kind==='sold'?'available':nw,delta:kind==='update'?`+${(bump*100).toFixed(1)}%`:'',kind,
      warn:bump>0.1?'Large change: over the 10% policy threshold.':'',note:kind==='sold'?`Sold through a deal. Releasing it needs the deal cancellation workflow.`:u.status==='reserved'?'Reserved unit: listing price only. The deal amount is unchanged.':''});
  });
  if(units[1]) rows.push({r:r++,unit:units[1].id,field:'Listing price',old:fmtEur(units[1].price),nw:fmtEur(Math.round(units[1].price*1.04/1000)*1000),nwV:Math.round(units[1].price*1.04/1000)*1000,delta:'+4.0%',kind:'dup'});
  if(units[1]) rows.find(x=>x.unit===units[1].id).kind='dup';
  rows.push({r:r++,unit:'DC0412',field:'Listing price',old:'—',nw:'€245,000',kind:'cross',note:'Belongs to another development. It will not be moved or applied here.'});
  rows.push({r:r++,unit:'CM9899',field:'Listing price',old:'—',nw:'€410,000',kind:'unknown',note:'No matching unit. Update-only mode never creates units.'});
  return rows;
}
function deImpOpen(){DE.imp={step:1,purpose:'Update prices',mode:'update',fmtOk:false,mapOk:false,dec:{},rows:null,result:null};DE.drawer={k:'import'};deRender();}
function deImpStep(n){
  const I=DE.imp;
  if(n===3&&!I.rows) I.rows=deImpRows(deDev());
  if(n===4&&!I.fmtOk){deToast('Confirm the number format to continue');return;}
  if(n===5&&!I.mapOk){deToast('Confirm the mappings to continue');return;}
  if(n===6&&deImpUnresolved().length){deToast('Resolve every flagged row to continue');return;}
  I.step=n; deRender();
}
function deImpUnresolved(){const I=DE.imp;return (I.rows||[]).filter(r=>['dup','sold'].includes(r.kind)&&!I.dec[r.kind==='dup'?'dup:'+r.unit:'sold:'+r.unit]);}
function deImpFinal(){
  const I=DE.imp, out=[];
  (I.rows||[]).forEach(r=>{
    if(r.kind==='update') out.push(r);
    if(r.kind==='dup'){const pick=I.dec['dup:'+r.unit];if(pick&&pick!=='skip'&&String(r.r)===pick&&!out.some(x=>x.unit===r.unit))out.push(r);}
  });
  return out;
}
function deImpApply(mode){
  const d=deDev(), I=DE.imp, rows=deImpFinal();
  if(mode==='apply'){
    const held=rows.filter(r=>{const u=UNITS.find(x=>x.id===r.unit);return u&&r.field==='Availability'&&DE_PROTECTED.includes(u.status);});
    rows.forEach(r=>{const u=UNITS.find(x=>x.id===r.unit);if(u&&r.field==='Listing price')u.price=r.nwV;});
    I.result={applied:rows.length,notApplied:(I.rows.length-rows.length),batch:`IMP-${new Date().toISOString().slice(5,10).replace('-','')}-03`,draft:false};
    if(typeof renderUnits==='function') renderUnits();
  }else{
    rows.forEach(r=>{const u=UNITS.find(x=>x.id===r.unit);if(u)deBatchAdd(u.id,r.field,r.field==='Listing price'?u.price:u.status,r.nwV,r.old,r.nw);});
    I.result={applied:rows.length,notApplied:I.rows.length-rows.length,batch:'IMP-draft',draft:true};
  }
  I.step=7; deRender();
}

// ---------- ED05 plans & property views ----------
function deFloors(d){
  const fl=[...new Set(deUnits(d).map(u=>u.floor))].sort((a,b)=>a-b);
  return fl.map(f=>({f,label:f===0?'Ground floor':'Floor '+f,units:deUnits(d).filter(u=>u.floor===f),ver:(d.floorPlans?.[f]?.version)||(f<2?'v2':'v1'),img:d.floorPlans?.[f]?.img||null}));
}
function dePlansHtml(d,st){
  const floors=deFloors(d); if(DE.floor===null&&floors.length) DE.floor=floors[0].f;
  const cur=floors.find(x=>x.f===DE.floor)||floors[0], stg=st.staged&&st.staged.floor===cur?.f?st.staged:null;
  const types=[...new Set(deUnits(d).map(deTypeKey))], dr=st.draft;
  const pos=(u,i)=>d.floorPlans?.[cur.f]?.positions?.[u.id]||{x:25+(i%3)*25,y:35+Math.floor(i/3)*25};
  return deHead('ED05','Plans & property views',`${deEsc(d.name)} › Floor › Unit. Floor drawings power visual search; unit plans show in each unit.`)+`
  <div class="de-floors">${floors.map(f=>`<button type="button" class="de-floor ${f.f===cur?.f?'on':''}" onclick="DE.floor=${f.f};deRender()"><b>${f.label}</b><span class="de-mu">${f.units.length} unit${f.units.length===1?'':'s'} · drawing ${f.ver} · ${st.staged?.floor===f.f?'staged '+st.staged.ver:'live'}</span></button>`).join('')}</div>
  ${cur?`<div class="de-card"><div class="row-between"><b>${cur.label} · general arrangement ${cur.ver}</b>${stg?'':`<button type="button" class="btn-ghost df-sm" onclick="this.nextElementSibling.click()">Replace drawing</button><input type="file" hidden accept="application/pdf,image/png,image/jpeg" onchange="deStageDrawing(${cur.f},this)">`}</div>
    ${stg?`<div class="de-note">${stg.ver} is staged, not live. Buyers still see ${cur.ver}. Confirm each unit’s position on the new drawing, then release. Reserved and sold units keep their status.</div>`:''}
    <div class="de-plan">${stg?.url||cur.img?`<img src="${deEsc(stg?.url||awAsset(cur.img))}" alt="${cur.label} drawing">`:`<div class="de-plan-ph">${cur.label} · ${stg?stg.ver:cur.ver}</div>`}
      ${cur.units.map((u,i)=>{const p=pos(u,i);return `<span class="de-pin ${u.status} ${stg&&!stg.ok[u.id]?'unconfirmed':''}" style="left:${p.x}%;top:${p.y}%">${deEsc(u.id.replace('#',''))}</span>`;}).join('')}</div>
    ${stg?`<div class="de-tr-list">${cur.units.map(u=>`<div class="de-tr"><b>${deEsc(u.id)}</b><span class="de-mu">${UN_STATUS[u.status]?.l} · ${stg.ok[u.id]?'Position confirmed on '+stg.ver:'Same position as '+cur.ver+' · confirm on the new drawing'}</span>${stg.ok[u.id]?'<span class="de-chip ok">Confirmed</span>':`<button type="button" class="btn-ghost df-sm" onclick="deState(deDev()).staged.ok['${u.id}']=true;deRender()">Confirm position</button>`}</div>`).join('')}</div>
      <div class="de-acts"><button type="button" class="btn-ghost df-sm" onclick="deState(deDev()).staged=null;deRender();deToast('Staged drawing discarded')">Discard ${stg.ver}</button>${cur.units.every(u=>stg.ok[u.id])?`<button type="button" class="btn-primary df-sm" onclick="deReleaseDrawing()">Release ${stg.ver}</button>`:'<span class="de-mu">Confirm every unit to release</span>'}</div>`:''}
  </div>`:''}
  <div class="de-card"><b>Unit plans</b>${types.map(t=>{const us=deUnits(d).filter(u=>deTypeKey(u)===t);return `<div class="de-tr"><span><b>${deEsc(t)} — type plan</b></span><span class="de-mu">${us.length>2?us.length+' units':us.map(u=>u.id).join(', ')} · ${/2-bed/.test(t)?'dimensions unverified':'rooms labelled'}</span><button type="button" class="df-link" onclick="DE.drawer={k:'unit',id:'${us[0].id}',tab:'plan'};deRender()">Open</button></div>`;}).join('')}</div>
  <div class="de-card"><b>Property views</b>${dr.assets.filter(a=>a.cat!=='Photo').map(a=>`<div class="de-tr"><span><b>${deEsc(a.n)}</b></span><span class="de-mu">${a.units.length?a.units.join(', '):a.types.length?'All '+a.types.join(', ')+' units':'Development-wide'} · ${deEsc(a.room||a.cat)}</span><span class="de-chip ${a.label==='Actual'?'ok':''}">${deEsc(a.label)}</span><button type="button" class="df-link" onclick="DE.drawer={k:'asset',id:'${a.id}'};deRender()">Edit</button></div>`).join('')}</div>`;
}
function deStageDrawing(f,input){
  const file=input.files[0]; if(!file) return;
  const d=deDev(), cur=deFloors(d).find(x=>x.f===f), n=Number(cur.ver.replace('v',''))+1;
  deState(d).staged={floor:f,ver:'v'+n,ok:{},url:/image/.test(file.type)?URL.createObjectURL(file):null,file:file.name};
  deRender(); deToast(`${file.name} staged as v${n} · confirm each unit to release`);
}
function deReleaseDrawing(){
  const d=deDev(), st=deState(d), s=st.staged;
  d.floorPlans=d.floorPlans||{}; d.floorPlans[s.floor]={...(d.floorPlans[s.floor]||{}),version:s.ver,img:s.url||d.floorPlans[s.floor]?.img||null,positions:d.floorPlans[s.floor]?.positions||{}};
  st.staged=null; deRender(); deToast(`${s.ver} released · visual search uses the new drawing`);
}

// ---------- ED05 facade mapping ----------
function deFacadeHtml(d,st){
  const F=st.draft.facades, side=F[DE.fSide]||F.front, units=deUnits(d);
  return deHead('ED05','Facade mapping','Place each unit on every side of the building where it can be seen. These markers power visual search and Present Mode.')+`
  <div class="de-floors">${Object.entries(F).map(([k,f])=>`<button type="button" class="de-floor ${DE.fSide===k?'on':''}" onclick="DE.fSide='${k}';DE.fSel=null;deRender()"><b>${deEsc(f.label)}</b><span class="de-mu">${f.na?'Not applicable':Object.keys(f.m).length+' of '+units.length+' placed'}</span></button>`).join('')}
    <button type="button" class="de-floor" onclick="deFacadeAdd()"><b>+ Add side</b><span class="de-mu">Another elevation</span></button></div>
  ${side.na?`<div class="de-card"><b>${deEsc(side.label)}</b><p class="de-mu">Marked as not applicable: ${deEsc(side.na)}. Buyers won’t see this side.</p><button type="button" class="btn-ghost df-sm" onclick="deFacadeNa(false)">Upload elevation anyway</button></div>`
  :`<div class="de-card"><div class="row-between"><b>${deEsc(side.label)}</b><span class="de-acts"><button type="button" class="btn-ghost df-sm" onclick="this.nextElementSibling.click()">Replace image</button><input type="file" hidden accept="image/*" onchange="deFacadeImg(this)"><button type="button" class="df-link" onclick="deFacadeNa(true)">Mark not applicable</button></span></div>
    <div class="de-facade" onclick="deFacadeClick(event)" role="img" aria-label="${deEsc(side.label)} with unit markers">${side.img?`<img src="${deEsc(/^blob:/.test(side.img)?side.img:awAsset(side.img))}" alt="">`:''}
      ${Object.entries(side.m).map(([id,[x,y]])=>{const u=units.find(z=>z.id===id);return `<button type="button" class="de-pin ${u?.status||''} ${DE.fSel===id?'sel':''}" style="left:${x}%;top:${y}%" onclick="event.stopPropagation();DE.fSel='${id}';deRender()" aria-label="${deEsc(id)}">${deEsc(id.replace('#',''))}</button>`;}).join('')}</div>
    <div class="de-mu">${DE.fSel?`${deEsc(DE.fSel)} · click the image to place it, or type a position`:'Select a unit, then click the image to place it'} · Marker colour = live availability · blue ring = selected</div>
    ${DE.fSel?`<div class="de-acts"><label class="de-mini">x % <input type="number" min="0" max="100" value="${side.m[DE.fSel]?.[0]??''}" onchange="deFacadeXY('x',this.value)"></label><label class="de-mini">y % <input type="number" min="0" max="100" value="${side.m[DE.fSel]?.[1]??''}" onchange="deFacadeXY('y',this.value)"></label>${side.m[DE.fSel]?`<button type="button" class="btn-ghost df-sm" onclick="delete deDraft().facades[DE.fSide].m[DE.fSel];deMark();deRender()">Remove</button>`:''}</div>`:''}
    <div class="de-chips">${units.map(u=>`<button type="button" class="de-uchip ${u.status} ${DE.fSel===u.id?'sel':''} ${side.m[u.id]?'placed':''}" onclick="DE.fSel='${u.id}';deRender()">${deEsc(u.id)} <span>${UN_STATUS[u.status]?.l}${side.m[u.id]?' · placed':''}</span></button>`).join('')}</div>
  </div>`}`;
}
function deFacadeClick(e){
  if(!DE.fSel){deToast('Select a unit first');return;}
  const r=e.currentTarget.getBoundingClientRect();
  deDraft().facades[DE.fSide].m[DE.fSel]=[Math.round((e.clientX-r.left)/r.width*100),Math.round((e.clientY-r.top)/r.height*100)];
  deMark(); deRender();
}
function deFacadeXY(axis,v){const m=deDraft().facades[DE.fSide].m,cur=m[DE.fSel]||[50,50];m[DE.fSel]=axis==='x'?[Math.max(0,Math.min(100,+v)),cur[1]]:[cur[0],Math.max(0,Math.min(100,+v))];deMark();deRender();}
function deFacadeImg(input){const f=input.files[0];if(!f)return;deDraft().facades[DE.fSide].img=URL.createObjectURL(f);deMark();deRender();}
function deFacadeNa(on){const s=deDraft().facades[DE.fSide];if(on){s.na='Marked by '+deMe();s.m={};}else{delete s.na;s.img=s.img||deDev().photo;}deMark();deRender();}
function deFacadeAdd(){const F=deDraft().facades,k='side'+Object.keys(F).length;F[k]={label:'New elevation',img:deDev().photo,m:{}};DE.fSide=k;deMark();deRender();}

// ---------- ED06 finishes, packs & extras ----------
function deFinishesHtml(d,st){
  const dr=st.draft, units=deUnits(d), def=dr.packs.find(p=>p.def&&!p.retired);
  return deHead('ED06','Finishes, packs & extras','One pricing source for Present Mode. Signed specs and accepted quotes keep the version they were agreed on.')+`
  <div class="de-card"><div class="row-between"><b>Finish packs</b><span class="de-mu">Default scope: all ${deEsc(d.name)} units</span></div>
    ${dr.packs.map((p,i)=>`<button type="button" class="de-pack ${p.retired?'retired':''}" onclick="DE.drawer={k:'pack',i:${i}};deRender()"><span class="de-sw">${(p.mats||[]).slice(0,4).map(m=>`<i style="background:${m.sw}"></i>`).join('')}</span><span class="de-grow"><b>${deEsc(p.n)}</b>${p.def?' <span class="de-chip ok">Default</span>':''}${p.retired?' <span class="de-chip">Retired</span>':''}<span class="de-mu"> · ${deEsc(p.d)}</span></span><b>${p.price?'+'+fmtEur(p.price):'Included'}</b></button>`).join('')}
    <button type="button" class="btn-ghost df-sm" onclick="deListAdd('packs',{n:'New pack',d:'',price:0,mode:'Addition',def:false,dl:'30 Nov 2026',mats:[]});DE.drawer={k:'pack',i:deDraft().packs.length-1};deRender()">+ Add pack</button></div>
  <div class="de-card"><b>Applicability & overrides</b>
    ${units[0]?`<div class="de-tr"><b>${deEsc(units[0].id)}</b><span class="de-mu">${deEsc(dr.packs[1]?.n||'Upgrade')} included at no charge</span><span class="de-chip">Unit override</span></div>`:''}
    ${units[2]?`<div class="de-tr"><b>${deEsc(units[2].id)}</b><span class="de-mu">${deEsc(dr.packs[2]?.n||'Pack')} · accepted quote Q-0911 at ${fmtEur(dr.packs[2]?.price||0)} · locked</span><span class="de-chip ok">Accepted · v2</span></div>`:''}
    <div class="de-tr"><b>Other units</b><span class="de-mu">${deEsc(def?.n||'No default')} by default · selection deadline ${deEsc(def?.dl||'—')}</span><span class="de-chip">Inherited from development</span></div></div>
  <div class="de-card"><div class="row-between"><b>Extras</b><button type="button" class="btn-ghost df-sm" onclick="deListAdd('extras',{n:'',note:'',price:''})">+ Add extra</button></div>
    ${dr.extras.map((x,i)=>`<div class="de-tr de-extra"><input aria-label="Extra" value="${deEsc(x.n)}" oninput="deSet('extras.${i}.n',this.value)"><input aria-label="Note" value="${deEsc(x.note)}" oninput="deSet('extras.${i}.note',this.value)"><input aria-label="Price" value="${deEsc(x.price)}" oninput="deSet('extras.${i}.price',this.value)"><button type="button" class="tool" aria-label="Remove" onclick="deListDel('extras',${i})">×</button></div>`).join('')}</div>`;
}

// ---------- ED07 media & documents ----------
function deMediaHtml(d,st){
  const dr=st.draft, tabs=['All','Render','Photo','View'], list=dr.assets.filter(a=>DE.mediaTab==='All'||a.cat===DE.mediaTab);
  const linkTxt=a=>{const l=[...a.units,...a.types,...a.packs.map(p=>p+' pack')];return l.length?'Linked: '+l.join(' · '):a.cat==='Photo'?'Development-wide':'Not linked to units yet';};
  return deHead('ED07','Media & documents','One library. Link renders and views to units, unit types or finish packs and they show there automatically.')+`
  <button type="button" class="de-drop big" onclick="this.nextElementSibling.click()"><b>Drop files or click to upload</b><span class="de-mu">Images JPG, PNG, WebP up to 20 MB · Video MP4, MOV up to 500 MB · Documents PDF, XLSX up to 50 MB</span></button>
  <input type="file" hidden multiple onchange="deUploadFiles(this,'media')">
  ${deUploadList(st)}
  <div class="de-tabs">${tabs.map(t=>`<button type="button" class="ff-chip ${DE.mediaTab===t?'on':''}" onclick="DE.mediaTab='${t}';deRender()">${t==='All'?'All':t+'s'} <span class="de-mu">${t==='All'?dr.assets.length:dr.assets.filter(a=>a.cat===t).length}</span></button>`).join('')}</div>
  <div class="de-assets">${list.map(a=>`<button type="button" class="de-asset ${a.img&&!a.alt?'bad':''}" onclick="DE.drawer={k:'asset',id:'${a.id}'};deRender()">
      <span class="de-asset-img">${a.img?`<img src="${deEsc(/^blob:/.test(a.img)?a.img:awAsset(a.img))}" alt="${deEsc(a.alt)}">`:'<span class="de-mu">Preview processing</span>'}${a.cover?'<span class="de-chip ok de-cover">Cover</span>':''}</span>
      <b>${deEsc(a.n)}</b><span class="de-mu">${deEsc(a.label)} · ${deEsc(linkTxt(a))}</span>${a.img&&!a.alt?'<span class="de-bad">Alt text missing · fix</span>':''}</button>`).join('')}</div>
  <div class="de-card row-between"><div><b>${dr.video?'Hero film':'No video yet'}</b><div class="de-mu">${dr.video?deEsc(dr.video):'Present Mode shows the cover image as a poster until a hero film is added. MP4 or MOV, up to 500 MB.'}</div></div><button type="button" class="btn-ghost df-sm" onclick="this.nextElementSibling.click()">${dr.video?'Replace video':'Upload video'}</button><input type="file" hidden accept="video/mp4,video/quicktime" onchange="deVideo(this)"></div>
  <div class="de-card"><b>Documents</b>${dr.docs.map((x,i)=>`<div class="de-tr"><span class="de-chip">${x.kind}</span><span class="de-grow"><b>${deEsc(x.n)}</b><div class="de-mu">${deEsc(x.meta)} · ${x.vis==='Public'?'Buyer-facing':'Internal only · never shown in previews'}${x.kind==='XLS'?' · document only · doesn’t update unit prices':''}</div></span>
      <select aria-label="Visibility" onchange="deSet('docs.${i}.vis',this.value,true)">${['Public','Internal'].map(v=>`<option ${v===x.vis?'selected':''}>${v}</option>`).join('')}</select>
      ${x.kind==='XLS'?`<button type="button" class="btn-ghost df-sm" onclick="deGo('units');deImpOpen()">Import data</button>`:`<button type="button" class="btn-ghost df-sm" onclick="this.nextElementSibling.click()">Replace version</button><input type="file" hidden accept="application/pdf" onchange="deDocReplace(${i},this)">`}</div>`).join('')}</div>`;
}
function deVideo(input){const f=input.files[0];if(!f)return;if(f.size>500*1024*1024){deToast('Video must be 500 MB or less');return;}deSet('video',`${f.name} · ${(f.size/1048576).toFixed(1)} MB`,true);deToast('Hero film added to the draft');}
function deDocReplace(i,input){const f=input.files[0];if(!f)return;const x=deDraft().docs[i];x.meta=`${(f.size/1048576).toFixed(1)} MB · replaced today`;x.n=f.name;deMark();deRender();deToast('New version added to the draft');}

// ---------- ED08 payment terms ----------
function dePaymentHtml(d,st){
  const p=st.draft.pay, total=p.dep+p.stg+p.bal, amt=pc=>fmtEur(Math.round(p.sample*pc/100));
  const row=(label,key,trigger)=>`<div class="de-tr de-pay"><b>${label}</b><label class="de-mini"><input type="number" min="0" max="100" value="${p[key]}" aria-label="${label} percent" onchange="deSet('pay.${key}',Number(this.value)||0,true)">%</label><span class="de-mu">${trigger}</span><b>${amt(p[key])}</b></div>`;
  return deHead('ED08','Payment terms','Listing prices live in Units. Changing a default here doesn’t amend signed agreements.')+`
  <div class="de-card"><div class="row-between"><b>Standard plan · EUR · default for all units</b><span class="de-mu">Effective 1 Sep 2026 · no expiry</span></div>
    <div class="de-tr de-pay de-th"><span>Milestone</span><span>% of price</span><span>Trigger</span><span>On ${fmtEur(p.sample)}</span></div>
    ${row('Deposit','dep','On promise of sale')}${row('Stage payment','stg','30 days after promise')}${row('Balance','bal','On final deed')}
    <div class="de-tr de-pay"><b>Total</b><b class="${total===100?'':'de-bad'}">${total}%</b><span class="de-mu">deposit counted once</span><b>${amt(total)}</b></div>
    ${total!==100?`<div class="de-note bad">Total is ${total}%. Milestones must add up to 100% before this can publish.</div>`:''}
    <p class="de-mu">Stamp duty 5% and notary fees are paid by the buyer · estimated · source: Notary Camilleri, Aug 2026</p></div>
  <div class="de-card"><b>Financing content</b><textarea rows="3" aria-label="Financing content" oninput="deSet('financing',this.value)">${deEsc(st.draft.financing)}</textarea><p class="de-mu">Shown with “Illustrative only. Not an offer or financial advice.”</p></div>`;
}

// ---------- ED09 timeline & delivery ----------
function deTimelineHtml(d,st){
  const T=st.draft.timeline, comp=T.find(r=>/completion/i.test(r.n));
  return deHead('ED09','Timeline & delivery','The single source for delivery dates on the development, units and Present Mode.',`<button type="button" class="btn-ghost df-sm" onclick="deListAdd('timeline',{n:'New milestone',type:'Estimated range',date:'',src:'',asof:'${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}'})">+ Add milestone</button>`)+`
  <div class="de-grid3"><div class="de-card"><span class="de-mu">Current stage</span><b>${d.completion==='Ready'?'Completed · ready now':'Under construction'}</b></div><div class="de-card"><span class="de-mu">Completion</span><b>${deEsc(comp?.date||d.completion)} · ${deEsc((comp?.type||'').toLowerCase())}</b></div><div class="de-card"><span class="de-mu">Unit exceptions</span><b>${deUnits(d).filter(u=>u.ready&&u.ready!==d.completion&&u.ready!=='Ready').length||'None'}</b></div></div>
  <div class="de-card de-table"><div class="de-tr de-tl de-th"><span>Milestone</span><span>Type</span><span>Date or window</span><span>Source</span><span>As of</span><span></span></div>
    ${T.map((r,i)=>`<div class="de-tr de-tl"><input aria-label="Milestone" value="${deEsc(r.n)}" oninput="deSet('timeline.${i}.n',this.value)">
      <select aria-label="Type" onchange="deSet('timeline.${i}.type',this.value,true)">${['Actual','Estimated range','Per contract'].map(x=>`<option ${x===r.type?'selected':''}>${x}</option>`).join('')}</select>
      <input aria-label="Date" value="${deEsc(r.date)}" onchange="deTlDate(${i},this.value)"><input aria-label="Source" value="${deEsc(r.src)}" oninput="deSet('timeline.${i}.src',this.value)"><span class="de-mu">${deEsc(r.asof)}</span>
      <button type="button" class="tool" aria-label="Remove" onclick="deListDel('timeline',${i})">×</button>
      ${r.needsReason?`<input class="de-reason ${r.reason?'':'de-invalid'}" aria-label="Reason for revising ${deEsc(r.n)}" placeholder="Reason for revising this estimate · required" value="${deEsc(r.reason||'')}" oninput="deSet('timeline.${i}.reason',this.value);this.classList.toggle('de-invalid',!this.value)">`:''}</div>`).join('')}
  </div>
  <p class="de-mu">Revising an estimate asks for a reason and flags related content for review. It never moves a signed payment date.</p>`;
}
function deTlDate(i,v){const r=deDraft().timeline[i], live=deState(deDev()).live.timeline[i];r.date=v;if(r.type==='Estimated range'&&live&&live.date!==v){r.needsReason=true;r.asof=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}deMark();deRender();}

// ---------- ED10 presentation, brand & links ----------
function dePresentationHtml(d,st){
  const dr=st.draft, ok=v=>!v||/^https:\/\//i.test(v);
  return deHead('ED10','Presentation, brand & links','Chapters reuse content from the other sections. Agents can still jump between chapters when presenting.')+`
  <div class="de-card"><b>Present Mode chapters</b>${dr.chapters.map((c,i)=>`<div class="de-tr de-ch"><span class="de-num">${i+1}</span><span class="de-grow"><b>${deEsc(c.n)}</b><span class="de-mu"> · ${c.locked?'always shown':c.on?'shown':'hidden'}</span></span>
      <button type="button" class="tool" aria-label="Move up" ${i?'':'disabled'} onclick="deListMove('chapters',${i},-1)">↑</button><button type="button" class="tool" aria-label="Move down" ${i<dr.chapters.length-1?'':'disabled'} onclick="deListMove('chapters',${i},1)">↓</button>
      <label class="df-task"><input type="checkbox" ${c.on?'checked':''} ${c.locked?'disabled':''} onchange="deSet('chapters.${i}.on',this.checked,true)"><span>Show</span></label></div>`).join('')}</div>
  <div class="de-card"><b>Brand <span class="de-mu">Project brand for ${deEsc(dr.name)} · company brand is managed in Studio</span></b>
    <div class="de-g2">${deField('Logo · light backgrounds',deLogoHtml('logo',dr.logo,dr.name))}${deField('Logo · dark backgrounds',deLogoHtml('logoDark',dr.logoDark,dr.name))}</div>
    <div class="de-colors">${dr.colors.map((c,i)=>`<label class="de-color"><input type="color" value="${c.v}" aria-label="${c.n} colour" onchange="deSet('colors.${i}.v',this.value,true)"><span>${c.n}<span class="de-mu"> ${c.v}</span></span></label>`).join('')}</div>
    <div class="de-g2">${deField('Heading typeface',`<select onchange="deSet('fontH',this.value)">${['Martina Plantijn','Season Sans','Inter'].map(f=>`<option ${f===dr.fontH?'selected':''}>${f}</option>`).join('')}</select>`)}${deField('Body typeface',`<select onchange="deSet('fontB',this.value)">${['Inter','Season Sans'].map(f=>`<option ${f===dr.fontB?'selected':''}>${f}</option>`).join('')}</select>`)}</div>
    ${deField('Voice',`<textarea rows="2" oninput="deSet('voice',this.value)">${deEsc(dr.voice)}</textarea>`)}
    <div class="de-mu">Brand files · ${deEsc(dr.name)} brand guide.pdf, logo pack.zip</div></div>
  <div class="de-card"><b>Links</b>
    ${[['web','Website · external URL'],['ig','Instagram · external URL'],['fb','Facebook · external URL']].map(([k,l])=>`${deField(l,`<input type="url" class="${ok(dr.links[k])?'':'de-invalid'}" placeholder="https://" value="${deEsc(dr.links[k])}" oninput="deSet('links.${k}',this.value);this.classList.toggle('de-invalid',!!this.value&&!/^https:\\/\\//i.test(this.value))">`,!ok(dr.links[k])?'<span class="de-bad">Use a secure https:// link. This blocks publishing.</span>':dr.links[k]?'Secure link · not yet checked for reachability':'')}`).join('')}
    <div class="de-tr"><b>Sales brochure</b><span class="de-mu">Managed file · ${deEsc(dr.docs.find(x=>/brochure/i.test(x.n))?.n||'—')}</span></div>
    <div class="de-tr"><b>Availability list</b><span class="de-mu">Built-in · live inventory</span></div>
    <div class="de-tr"><b>Present Mode</b><span class="de-mu">Built-in destination</span></div></div>`;
}

// ---------- ED11 review & publish, history ----------
function deReviewHtml(d,st){
  const mf=deMustFix(d), warn=deWarnings(d), ch=deChanges(d), admin=deAdmin();
  const blocked=mf.length?`${mf.length} item${mf.length===1?'':'s'} must be fixed before publishing`:!ch.length?'No content changes to publish':'';
  return deHead('ED11','Review & publish',`Publishing replaces live v${st.version} with this draft. Live content stays up while you edit and if publishing fails.`)+`
  <div class="de-card"><div class="row-between"><b>Must fix</b>${mf.length?`<span class="de-chip bad">${mf.length}</span>`:''}</div>
    ${mf.map(m=>`<div class="de-tr"><span class="de-grow">${deEsc(m.t)} <span class="de-mu">${DE_LABEL[m.sec]||''}</span></span><button type="button" class="btn-ghost df-sm" onclick="deFix('${m.sec}','${m.asset||''}')">Fix</button></div>`).join('')||'<p class="de-mu">All required content is valid.</p>'}</div>
  ${warn.length?`<div class="de-card"><b>Warnings</b>${warn.map(w=>`<div class="de-tr"><span class="de-mu">${deEsc(w)}</span></div>`).join('')}</div>`:''}
  <div class="de-card"><b>Changes in this draft</b>${ch.map(c=>`<div class="de-tr"><span class="de-grow"><b>${deEsc(c.label)}</b> <span class="de-mu">${deEsc(c.d)}</span></span><button type="button" class="df-link" onclick="deGo('${c.sec}')">Open ›</button></div>`).join('')||'<p class="de-mu">No content changes yet.</p>'}</div>
  <div class="de-card de-publish"><p class="de-mu">Publishes to: development page, sales links, Present Mode. Not included: ${st.batch.length} proposed inventory change${st.batch.length===1?'':'s'} (applied from Units).</p>
    ${st.publishing?'<p><b>Checking versions and publishing…</b></p>':`${blocked?`<p class="de-bad">${blocked}</p>`:''}
    <div class="de-acts">${admin?`<button type="button" class="btn-ghost" onclick="deRequestReview()" ${ch.length?'':'disabled'}>Request review</button><button type="button" class="btn-primary" onclick="dePublish()" ${blocked?'disabled':''}>Publish v${st.version+1}</button>`
      :`<button type="button" class="btn-primary" onclick="deRequestReview()" ${blocked?'disabled':''}>Request review</button><span class="de-mu">An admin publishes</span>`}</div>`}</div>`;
}
function deRequestReview(){const st=deState(deDev());st.save='saved';st.savedAt='at '+deNow();st.review=deMe();deRender();deToast('Review requested · an admin was notified');}
function dePublish(){
  const d=deDev(), st=deState(d); if(deMustFix(d).length||!deChanges(d).length) return;
  st.publishing=true; deRender();
  setTimeout(()=>{
    const dr=st.draft, ch=deChanges(d), oldName=d.name;
    if(dr.name!==oldName){UNITS.forEach(u=>{if(u.dev===oldName)u.dev=dr.name;});OPPS.forEach(o=>{o.devs=o.devs.map(n=>n===oldName?dr.name:n);});}
    Object.assign(d,{name:dr.name,tag:dr.tagline,about:dr.about,loc:dr.loc,lat:Number(dr.lat),lng:Number(dr.lng),logo:dr.logo,
      dist:dr.dests.filter(x=>x.n).map(x=>[x.n,`${x.v} ${x.mode.toLowerCase()}`.trim()]),amen:dr.amen.filter(a=>a.n).map(a=>a.n),
      files:dr.docs.map(x=>({n:x.n,s:x.meta.split(' · ')[0],d:x.meta.split(' · ')[1]||'Updated today'}))});
    d.media.renders={ext:dr.assets.filter(a=>a.cat==='Render'&&a.label!=='Representative'&&a.img).map(a=>({img:a.img,cap:a.n})),int:dr.assets.filter(a=>a.cat==='Render'&&a.label==='Representative'&&a.img).map(a=>({img:a.img,cap:a.n}))};
    d.media.photos=dr.assets.filter(a=>a.cat!=='Render'&&a.img).map(a=>({img:a.img,cap:a.n,tag:a.cat==='View'?'Views':'Lifestyle'}));
    const cover=dr.assets.find(a=>a.cover&&a.img); if(cover) d.photo=cover.img;
    st.version++; d.version=st.version; st.publishedBy=deMe(); st.publishedAt='today '+deNow();
    st.history.unshift({v:st.version,what:ch.map(c=>c.label).filter((v,i,a)=>a.indexOf(v)===i).join(', '),who:deMe(),when:'Today '+deNow(),snap:deClone(dr)});
    st.live=deClone(dr); st.save='clean'; st.review=null; st.publishing=false;
    if(typeof awAudit==='function') awAudit(d,`Content v${st.version} published`,null);
    deRender(); deToast(`Published v${st.version} · development page, sales links and Present Mode updated`);
  },700);
}
function deHistoryHtml(d,st){
  const units=deUnits(d), deals=OPPS.filter(o=>o.devs.includes(d.name)), assets=st.draft.assets.length+st.draft.docs.length;
  return deHead('ED11','History','Restoring creates a new draft. It never reverses later sales, deals or inventory batches.')+`
  <div class="de-card">${st.history.map((h,i)=>`<div class="de-tr"><b>v${h.v}</b><span class="de-grow">${deEsc(h.what)}<div class="de-mu">${deEsc(h.who)} · ${deEsc(h.when)}</div></span>${i===0?'<span class="de-chip ok">Live</span>':`<button type="button" class="btn-ghost df-sm" onclick="deRestore(${i})">Restore as draft</button>`}</div>`).join('')}</div>
  <div class="de-card row-between"><div><b>Archive development</b><div class="de-mu">${units.length} units, ${deals.length} deals and ${assets} assets stay on record. Restoring later doesn’t make stock available.</div></div><button type="button" class="btn-ghost df-sm" onclick="DE.modal='archive';deRender()">Review archive impact</button></div>`;
}
function deRestore(i){
  const st=deState(deDev()), h=st.history[i];
  st.draft=deClone(h.snap||st.live); st.save='unsaved';
  deGo('review'); deToast(`v${h.v} restored as a draft${h.snap?'':' · content before this session isn’t stored, so live content was used'} · publish to make it live`);
}

// ---------- ED13 uploads (filename routing) ----------
function deRoute(d,f){
  const n=f.name, units=deUnits(d), hit=units.find(u=>new RegExp(u.id.replace('#',''),'i').test(n));
  if(/\.(xlsx|xls|csv)$/i.test(n)) return {kind:'sheet',msg:'Sheet → Documents · use Import data to change prices'};
  if(/\.(mp4|mov)$/i.test(n)) return {kind:'video',msg:'Video → Media · hero film'};
  if(/plan|fp[_-]/i.test(n)) return hit?{kind:'plan',unit:hit.id,msg:`Plan → ${hit.id} · staged as a new plan version`}:{kind:'nomatch',msg:'Plan, but the name matched no unit'};
  if(/\.(png|jpe?g|webp)$/i.test(n)) return {kind:'image',msg:'Image → Media · needs alt text'};
  if(/\.pdf$/i.test(n)) return {kind:'doc',msg:'PDF → Documents'};
  return {kind:'reject',msg:'Unsupported file type'};
}
function deUploadFiles(input,where){
  const d=deDev(), st=deState(d), files=[...input.files]; if(!files.length) return;
  const rows=files.map(f=>({n:f.name,size:(f.size/1048576).toFixed(1)+' MB',...deRoute(d,f),p:0,st:'Uploading',url:/image/.test(f.type)?URL.createObjectURL(f):null}));
  st.uploads=rows; deRender();
  let t=0; const iv=setInterval(()=>{t++;rows.forEach(r=>{if(r.kind==='reject'){r.st='Rejected';return;}r.p=Math.min(100,r.p+50);r.st=r.p<100?'Uploading':'Ready';});
    if(t>=2){clearInterval(iv);deUploadRoute(rows,where);} if(document.getElementById('p-devedit')?.classList.contains('on')) deRender();},350);
}
function deUploadRoute(rows,where){
  const d=deDev(), st=deState(d), dr=st.draft; let routed=[];
  rows.forEach(r=>{
    if(r.kind==='image'){dr.assets.push({id:'u'+Date.now()+Math.random().toString(36).slice(2,5),n:r.n.replace(/\.\w+$/,'').replace(/[-_]/g,' '),img:r.url,cat:'Render',label:'Render',alt:'',cover:false,units:[],types:[],packs:[],room:'',orient:'',src:'Uploaded today'});routed.push('image');}
    else if(r.kind==='doc'||r.kind==='sheet'){dr.docs.push({n:r.n,meta:`${r.size} · uploaded today`,vis:'Internal',kind:r.kind==='sheet'?'XLS':'PDF'});routed.push('doc');}
    else if(r.kind==='video'){dr.video=`${r.n} · ${r.size}`;routed.push('video');}
    else if(r.kind==='plan'){dr.plans[r.unit]={file:r.n,staged:true};routed.push('plan');}
    else if(r.kind==='nomatch'){st.fixup.push({n:r.n,size:r.size,who:deMe(),pick:''});routed.push('nomatch');}
  });
  if(routed.length) st.save='unsaved';
  const c=k=>routed.filter(x=>x===k).length;
  st.uploadBatches.unshift({when:'Today '+deNow(),title:`${rows.length} file${rows.length===1?'':'s'} · ${where==='media'?'Media':'Uploads'}`,routed:[c('plan')&&`${c('plan')} plan${c('plan')>1?'s':''} to units`,c('image')&&`${c('image')} to Media`,c('doc')&&`${c('doc')} to Documents`,c('video')&&'1 video'].filter(Boolean).join(' · ')||'Nothing routed',who:deMe(),status:c('nomatch')?`${c('nomatch')} need a unit`:'Done'});
  deToast(c('nomatch')?`${c('nomatch')} plan${c('nomatch')>1?'s':''} matched no unit · see Upload history`:'Uploads routed into the draft');
}
function deUploadList(st){
  return st.uploads.length?`<div class="de-card">${st.uploads.map(u=>`<div class="de-tr"><span class="de-grow"><b>${deEsc(u.n)}</b> · ${deEsc(u.size)}<div class="de-mu">${deEsc(u.msg)}</div></span><span class="de-chip ${u.st==='Ready'?'ok':u.st==='Rejected'?'bad':''}">${u.st}${u.st==='Uploading'?' '+u.p+'%':''}</span>${u.kind==='nomatch'&&u.st==='Ready'?`<button type="button" class="btn-ghost df-sm" onclick="deGo('uploads')">Choose unit</button>`:''}</div>`).join('')}<button type="button" class="df-link" onclick="deState(deDev()).uploads=[];deRender()">Clear list</button></div>`:'';
}
function deUploadsHtml(d,st){
  const units=deUnits(d);
  return deHead('ED13','Uploads','Drop files in bulk. Bricly reads filenames and routes each file: plans to units, renders to media, sheets to documents. When it can’t tell, it asks here.',`<button type="button" class="btn-primary df-sm" onclick="this.nextElementSibling.click()">Upload files</button><input type="file" hidden multiple onchange="deUploadFiles(this,'uploads')">`)+`
  ${deUploadList(st)}
  ${st.fixup.length?`<div class="de-card"><b>Needs a unit · ${st.fixup.length}</b><p class="de-mu">These floor plans were uploaded but their names didn’t match a unit. They aren’t shown anywhere and nothing is linked until you choose a unit.</p>
    ${st.fixup.map((f,i)=>`<div class="de-tr"><span class="de-grow"><b>${deEsc(f.n)}</b><div class="de-mu">${deEsc(f.size)} · uploaded by ${deEsc(f.who)} · left for later</div></span>
      <select aria-label="Unit for ${deEsc(f.n)}" onchange="deState(deDev()).fixup[${i}].pick=this.value"><option value="">Suggest a unit ⌄</option>${units.map(u=>`<option ${f.pick===u.id?'selected':''}>${deEsc(u.id)}</option>`).join('')}</select>
      <button type="button" class="btn-ghost df-sm" onclick="DE.drawer={k:'fixup',i:${i}};deRender()">View & link</button><button type="button" class="btn-ghost df-sm" onclick="deState(deDev()).fixup.splice(${i},1);deRender();deToast('File deleted for good')">Delete</button></div>`).join('')}
    <p class="de-mu">A suggestion comes from the filename only; linking always happens after you’ve seen the drawing. Linking stages the file as a new plan version for that unit, applied when you publish.</p></div>`:''}
  <div class="de-card"><b>Upload history</b> <span class="de-mu">Every batch, who uploaded it and where the files went.</span>
    ${st.uploadBatches.map(b=>`<div class="de-tr"><span class="de-mu">${deEsc(b.when)}</span><span class="de-grow"><b>${deEsc(b.title)}</b><div class="de-mu">${deEsc(b.routed)}</div></span><span class="de-mu">${deEsc(b.who)}</span><span class="de-chip ${/need/.test(b.status)?'warn':'ok'}">${deEsc(b.status)}</span></div>`).join('')}</div>`;
}

// ---------- drawers ----------
function deDrawerHtml(d,st){
  const k=DE.drawer.k;
  const body={unit:deUnitDrawer,bulk:deBulkDrawer,asset:deAssetDrawer,pack:dePackDrawer,import:deImpDrawer,fixup:deFixDrawer}[k];
  if(!body) return '';
  const r=body(d,st);
  return `<div class="de-scrim" onclick="DE.drawer=null;deRender()"></div><aside class="de-drawer ${k==='import'?'wide':''}" id="de-drawer" role="dialog" aria-label="${deEsc(r.title)}">
    <header><div><h3>${r.title}</h3>${r.sub?`<div class="de-mu">${r.sub}</div>`:''}</div><button type="button" class="tool" aria-label="Close" onclick="DE.drawer=null;deRender()">×</button></header>
    <div class="de-dbody">${r.body}</div><footer>${r.foot}</footer></aside>`;
}
function deUnitDrawer(d,st){
  const u=UNITS.find(x=>x.id===DE.drawer.id), tab=DE.drawer.tab||'details', prot=DE_PROTECTED.includes(u.status), deal=deUnitDeal(u), t=deTypeKey(u), dr=st.draft;
  const tabs=[['details','Details'],['plan','Plan'],['media','Media'],['facade','Facade']];
  const pend=deBatchFor(u), sides=Object.entries(dr.facades).filter(([,f])=>!f.na);
  let body=`<div class="de-tabs">${tabs.map(([k,l])=>`<button type="button" class="ff-chip ${tab===k?'on':''}" onclick="DE.drawer.tab='${k}';deRender()">${l}</button>`).join('')}</div>
    ${pend.length?`<div class="de-note">In the inventory batch: ${pend.map(b=>`${deEsc(b.field)} → ${deEsc(b.newTxt)}`).join(' · ')}</div>`:''}`;
  if(tab==='details') body+=`
    <div class="de-g2">${deField('Unit reference · protected',`<input value="${deEsc(u.id)}" readonly>`)}${deField('Building / block',`<input value="${deEsc(d.name)}" readonly>`)}
      ${deField('Type',`<select id="du-type">${['Studio','Apartment','Maisonette','Penthouse'].map(x=>`<option ${x===u.type?'selected':''}>${x}</option>`).join('')}</select>`)}${deField('Floor',`<input id="du-floor" type="number" min="0" value="${u.floor}">`)}
      ${deField('Bedrooms',`<input id="du-beds" type="number" min="0" value="${u.beds}">`)}${deField('Bathrooms',`<input id="du-baths" type="number" min="1" value="${u.baths||1}">`)}
      ${deField('Internal area · m²',`<input id="du-sqm" type="number" min="1" value="${u.sqm}">`)}${deField('Outdoor area · m²',`<input id="du-ext" type="number" min="0" value="${u.ext||0}">`)}</div>
    ${deField('Listing price · EUR',`<input id="du-price" inputmode="decimal" value="${u.price}">`,'Listing price, not an agreed contract amount.')}
    ${deField('Description',`<textarea id="du-desc" rows="2">${deEsc(u.desc||'')}</textarea>`)}${deField('Features · comma separated',`<input id="du-feat" value="${deEsc((u.views||[]).join(', '))}">`)}
    ${prot?`<div class="de-note">${UN_STATUS[u.status]?.l} ${deal?`through ${deal.d?deal.d.id:deal.o.id} · ${deEsc(deal.o.lead)}`:'through a deal'}. This status can only change inside the deal, for example by recording a cancellation. ${deal?`<button type="button" class="df-link" onclick="${deal.d?`openDeal('${deal.d.id}')`:`openOpp('${deal.o.id}')`}">Open ${deal.d?'deal':'opportunity'}</button>`:''}</div>`
      :deField('Availability',`<select id="du-status"><option value="available" ${u.status==='available'?'selected':''}>Available</option><option value="off_market" ${u.status==='off_market'?'selected':''}>Off market</option></select>`,'Holds, reservations and sales are made from a deal.')}
    <div class="de-field"><span>Delivery</span><label class="df-task"><input type="radio" name="du-del" ${u.ready===d.completion||!u.ready?'checked':''} onchange="document.getElementById('du-excf').hidden=true;document.getElementById('du-exc').checked=false"><span>Inherit from development · ${deEsc(d.completion==='Ready'?'ready now':d.completion)}</span></label>
      <label class="df-task"><input type="radio" name="du-del" id="du-exc" onchange="document.getElementById('du-excf').hidden=false"><span>Unit-specific exception</span></label>
      <div id="du-excf" hidden class="de-g2">${deField('Expected handover',`<input id="du-when" placeholder="e.g. Q1 2027">`)}${deField('Reason · required',`<input id="du-why">`)}</div></div>`;
  if(tab==='plan'){const up=dr.plans[u.id];body+=`<div class="de-tr"><span class="de-grow"><b>${deEsc(t)} type plan</b><div class="de-mu">v2 PDF + PNG · uploaded 12 Jun 2026 by Anna Cassar Architects</div></span><button type="button" class="btn-ghost df-sm" onclick="deToast('Demo file · nothing to download in this session')">Download</button></div>
    ${up?`<div class="de-note">${deEsc(up.file)} uploaded as a unit-specific plan. Buyers still see the type plan until you confirm the rooms and publish. <button type="button" class="df-link" onclick="delete deDraft().plans['${u.id}'];deMark();deRender()">Remove</button></div>`:`<button type="button" class="btn-ghost df-sm" onclick="this.nextElementSibling.click()">Upload unit-specific plan</button><input type="file" hidden accept="application/pdf,image/*" onchange="deDraft().plans['${u.id}']={file:this.files[0].name,staged:true};deMark();deRender()">`}
    <div class="de-table">${(({Studio:[['Living / sleeping','28.4'],['Kitchen','6.2'],['Bath','4.1']],'1-bed':[['Living / kitchen','30.2'],['Bedroom','12.8'],['Bath','5.0']],'2-bed':[['Living / kitchen','38.5'],['Bedroom 1','14.2'],['Bedroom 2','11.0'],['Bath / en suite','8.4']]})[t]||[['Living','34.0'],['Kitchen / dining','22.5'],['Bedroom 1','16.1'],['Bedroom 2','12.4'],['Bedroom 3','10.2']]).map(([r,a])=>`<div class="de-tr"><span class="de-grow">${r}</span><span>${a} m²</span><span class="de-chip ok">Mapped</span></div>`).join('')}</div>
    <p class="de-mu">Dimensions are shown to buyers as “approx.” until the architect confirms them.</p>`;}
  if(tab==='media'){const linked=dr.assets.filter(a=>a.units.includes(u.id)||a.types.includes(t)), rest=dr.assets.filter(a=>!linked.includes(a)&&a.cat!=='Photo');
    body+=`<b>Shows on this unit</b>${linked.map(a=>`<div class="de-tr"><span class="de-grow"><b>${deEsc(a.n)}</b><div class="de-mu">${a.units.includes(u.id)?'Linked directly':'Via '+deEsc(t)+' type'} · ${deEsc(a.label)}</div></span>${a.units.includes(u.id)?`<button type="button" class="btn-ghost df-sm" onclick="deAssetLink('${a.id}','units','${u.id}',false)">Unlink</button>`:''}</div>`).join('')||'<p class="de-mu">No views or renders yet. Buyers see the type plan and development gallery.</p>'}
    <b>Link from library</b>${rest.map(a=>`<div class="de-tr"><span class="de-grow">${deEsc(a.n)} <span class="de-mu">· ${deEsc(a.cat)}</span></span><button type="button" class="btn-ghost df-sm" onclick="deAssetLink('${a.id}','units','${u.id}',true)">Link</button></div>`).join('')}
    <p class="de-mu">Renders linked to the ${deEsc(t)} type show on every unit of that type. Link directly for unit-specific views.</p>`;}
  if(tab==='facade') body+=sides.map(([k,f])=>`<div class="de-tr"><span class="de-grow"><b>${deEsc(f.label)}</b><div class="de-mu">${f.m[u.id]?`Placed at x ${f.m[u.id][0]}% · y ${f.m[u.id][1]}%`:'Not placed on this facade'}</div></span><button type="button" class="btn-ghost df-sm" onclick="DE.drawer=null;DE.fSide='${k}';DE.fSel='${u.id}';deGo('facade')">Edit position on facade</button></div>`).join('')+(sides.every(([,f])=>!f.m[u.id])?'<p class="de-mu">Not placed on any facade yet, so it won’t appear in visual search.</p>':'');
  return {title:`${u.id}`,sub:`${deEsc(u.type)} · floor ${u.floor===0?'G':u.floor} · ${u.beds===0?'studio':u.beds+' bed'} · ${deEsc(t)} type`,body,
    foot:tab==='details'?`<span class="de-mu">Adds to the inventory batch</span><button type="button" class="btn-ghost" onclick="DE.drawer=null;deRender()">Cancel</button><button type="button" class="btn-primary" onclick="deUnitSave('${u.id}')">Save proposed change</button>`:`<button type="button" class="btn-primary" onclick="DE.drawer=null;deRender()">Done</button>`};
}
function deAssetLink(id,key,val,on){const a=deDraft().assets.find(x=>x.id===id);a[key]=on?[...new Set([...a[key],val])]:a[key].filter(x=>x!==val);deMark();deRender();}
function deBulkDrawer(d,st){
  const ids=Object.keys(DE.sel).filter(k=>DE.sel[k]);
  return {title:`Bulk edit ${ids.length} units`,sub:'Only ticked fields change',body:`
    <label class="df-task"><input type="checkbox" id="bk-price-on"><span>Listing price · EUR</span></label><label class="de-mini">Change by <input id="bk-price" type="number" step="0.5" value="2">%</label>
    <label class="df-task"><input type="checkbox" id="bk-avail-on"><span>Availability</span></label><select id="bk-avail"><option value="available">Available</option><option value="off_market">Off market</option></select>
    <label class="df-task"><input type="checkbox" id="bk-ready-on"><span>Delivery exception</span></label><input id="bk-ready" placeholder="e.g. Q1 2027">
    <div class="de-table"><div class="de-tr de-th"><span>Unit</span><span>Current price</span><span>Status</span></div>${ids.map(id=>{const u=UNITS.find(x=>x.id===id);return `<div class="de-tr"><b>${deEsc(id)}</b><span>${fmtEur(u.price)}</span><span class="de-st ${u.status}">${UN_STATUS[u.status]?.l}${DE_PROTECTED.includes(u.status)?' · protected':''}</span></div>`;}).join('')}</div>`,
    foot:`<button type="button" class="btn-ghost" onclick="DE.drawer=null;deRender()">Cancel</button><button type="button" class="btn-primary" onclick="deBulkSave()">Add to inventory batch</button>`};
}
function deAssetDrawer(d,st){
  const a=st.draft.assets.find(x=>x.id===DE.drawer.id); if(!a){DE.drawer=null;return {title:'',body:'',foot:''};}
  const i=st.draft.assets.indexOf(a), units=deUnits(d), types=[...new Set(units.map(deTypeKey))], sel=(key,opts)=>`<select onchange="deSet('assets.${i}.${key}',this.value,true)">${opts.map(o=>`<option ${o===a[key]?'selected':''}>${o}</option>`).join('')}</select>`;
  const chk=(key,list)=>list.map(v=>`<label class="df-task"><input type="checkbox" ${a[key].includes(v)?'checked':''} onchange="deAssetLink('${a.id}','${key}','${v}',this.checked)"><span>${deEsc(v)}</span></label>`).join('');
  return {title:deEsc(a.n),sub:`${deEsc(a.cat)} · ${deEsc(a.label)}`,body:`
    <div class="de-asset-img big">${a.img?`<img src="${deEsc(/^blob:/.test(a.img)?a.img:awAsset(a.img))}" alt="${deEsc(a.alt)}">`:'<span class="de-mu">Preview still processing</span>'}</div>
    ${deField('Display title',`<input value="${deEsc(a.n)}" oninput="deSet('assets.${i}.n',this.value)">`)}
    ${deField('Alt text · required to publish',`<input id="de-alt" class="${a.alt?'':'de-invalid'}" value="${deEsc(a.alt)}" oninput="deSet('assets.${i}.alt',this.value);this.classList.toggle('de-invalid',!this.value.trim())">`)}
    <div class="de-g2">${deField('Category',sel('cat',['Render','Photo','View']))}${deField('Buyer label',sel('label',['Render','Photo','Actual','Representative','Illustrative']))}${deField('Room / space',sel('room',['','Living','Kitchen','Bedroom 1','Bedroom 2','Terrace','Balcony']))}${deField('Orientation',sel('orient',['','North','East','South-east','South','West']))}</div>
    ${deField('Source & date',`<input value="${deEsc(a.src)}" oninput="deSet('assets.${i}.src',this.value)">`)}
    ${a.cat==='Photo'?'<p class="de-mu">Photography is development-wide. Change the category to View to link it to units.</p>':`<b>Linked units</b><div class="de-checks">${chk('units',units.map(u=>u.id))}</div><b>Unit types · shows on every unit of the type</b><div class="de-checks">${chk('types',types)}</div><b>Finish packs</b><div class="de-checks">${chk('packs',st.draft.packs.map(p=>p.n))}</div>`}`,
    foot:`<button type="button" class="btn-ghost" ${a.cover||!a.img?'disabled':''} onclick="deDraft().assets.forEach(x=>x.cover=x.id==='${a.id}');deMark();deRender();deToast('Set as cover')">Set as cover</button><button type="button" class="btn-ghost" onclick="deDraft().assets.splice(${i},1);DE.drawer=null;deMark();deRender()">Remove</button><button type="button" class="btn-primary" onclick="DE.drawer=null;deRender()">Done</button>`};
}
function dePackDrawer(d,st){
  const i=DE.drawer.i, p=st.draft.packs[i], base=deUnits(d)[0]?.price||0;
  return {title:`${deEsc(p.n)} pack`,sub:p.def?'Default':'',body:`
    ${deField('Pack name',`<input value="${deEsc(p.n)}" oninput="deSet('packs.${i}.n',this.value)">`)}${deField('Description',`<textarea rows="2" oninput="deSet('packs.${i}.d',this.value)">${deEsc(p.d)}</textarea>`)}
    <div class="de-g2">${deField('Pricing against base specification',`<select onchange="deSet('packs.${i}.mode',this.value,true)">${['Included','Addition'].map(m=>`<option ${m===p.mode?'selected':''}>${m}</option>`).join('')}</select>`)}${deField('Price · EUR',`<input type="number" min="0" step="100" value="${p.price}" onchange="deSet('packs.${i}.price',Number(this.value)||0,true)">`)}</div>
    ${deField('Selection deadline',`<input value="${deEsc(p.dl)}" oninput="deSet('packs.${i}.dl',this.value)">`)}
    <div class="de-card"><b>Preview on ${deEsc(deUnits(d)[0]?.id||'a unit')}</b><div class="de-tr"><span class="de-grow">Listing price</span><span>${fmtEur(base)}</span></div><div class="de-tr"><span class="de-grow">${deEsc(p.n)}</span><span>${p.price?'+'+fmtEur(p.price):'Included'}</span></div><div class="de-tr"><b class="de-grow">Total</b><b>${fmtEur(base+(p.mode==='Addition'?p.price:0))}</b></div></div>
    <div class="row-between"><b>Materials</b><button type="button" class="btn-ghost df-sm" onclick="deDraft().packs[${i}].mats.push({room:'Floors',name:'',finish:'',sw:'#cccccc'});deMark();deRender()">+ Add material</button></div>
    ${(p.mats||[]).map((m,j)=>`<div class="de-tr de-mat"><input type="color" value="${m.sw}" aria-label="Swatch" onchange="deSet('packs.${i}.mats.${j}.sw',this.value,true)"><select aria-label="Room" onchange="deSet('packs.${i}.mats.${j}.room',this.value)">${['Floors','Kitchen','Bathroom','Joinery','Fittings','Walls'].map(r=>`<option ${r===m.room?'selected':''}>${r}</option>`).join('')}</select><input aria-label="Material" value="${deEsc(m.name)}" oninput="deSet('packs.${i}.mats.${j}.name',this.value)"><input aria-label="Finish" value="${deEsc(m.finish)}" oninput="deSet('packs.${i}.mats.${j}.finish',this.value)"><button type="button" class="tool" aria-label="Remove" onclick="deDraft().packs[${i}].mats.splice(${j},1);deMark();deRender()">×</button></div>`).join('')}
    <p class="de-mu">Applies to units inheriting from the development. Unit overrides and accepted quotes keep the version they were agreed on.</p>`,
    foot:`<button type="button" class="btn-ghost" ${p.def?'disabled':''} onclick="deDraft().packs.forEach((x,j)=>x.def=j===${i});deMark();deRender()">Set as default</button><button type="button" class="btn-ghost" ${p.def?'disabled title="Choose another default first"':''} onclick="deSet('packs.${i}.retired',!deDraft().packs[${i}].retired,true)">${p.retired?'Restore pack':'Retire pack'}</button><button type="button" class="btn-primary" onclick="DE.drawer=null;deRender()">Done</button>`};
}
function deFixDrawer(d,st){
  const f=st.fixup[DE.drawer.i], units=deUnits(d), pick=f.pick, u=units.find(x=>x.id===pick);
  return {title:deEsc(f.n),sub:`${deEsc(f.size)} · 2 pages · uploaded by ${deEsc(f.who)}`,body:`
    <div class="de-plan"><div class="de-plan-ph">Floor plan preview · ${deEsc(f.n)}</div></div>
    <p><b>What we read from the drawing</b> <span class="de-mu">2 bedrooms · 1 bathroom · approx. 96 m² · north arrow top right</span></p>
    ${deField('Link to unit',`<select onchange="deState(deDev()).fixup[${DE.drawer.i}].pick=this.value;deRender()"><option value="">Choose a unit</option>${units.map(x=>`<option ${x.id===pick?'selected':''}>${deEsc(x.id)}</option>`).join('')}</select>`)}
    ${u?`<div class="de-note">${deEsc(u.id)} · ${u.beds===0?'studio':u.beds+' bed'} · ${u.sqm} m² · Current plan ${deEsc(deTypeKey(u))} type plan v2</div>`:''}
    <p class="de-mu">Check the room count and area against the drawing above before you confirm. Buyers keep seeing the current plan until you publish.</p>`,
    foot:`<button type="button" class="btn-ghost" onclick="deState(deDev()).fixup.splice(${DE.drawer.i},1);DE.drawer=null;deRender();deToast('File deleted')">Delete file</button><button type="button" class="btn-ghost" onclick="DE.drawer=null;deRender()">Leave for later</button><button type="button" class="btn-primary" ${pick?'':'disabled'} onclick="deFixLink()">Confirm link</button>`};
}
function deFixLink(){const st=deState(deDev()),f=st.fixup[DE.drawer.i];st.draft.plans[f.pick]={file:f.n,staged:true};st.fixup.splice(DE.drawer.i,1);DE.drawer=null;deMark();deRender();deToast(`${f.n} linked to ${f.pick} · staged until you publish`);}
function deImpDrawer(d,st){
  const I=DE.imp, steps=['Choose','Upload','Number format','Match columns','Review','Confirm'];
  const head=`<div class="de-steps">${steps.map((s,i)=>`<span class="${I.step===i+1?'on':I.step>i+1?'done':''}">${i+1} ${s}</span>`).join('')}</div>`;
  let body='',foot='';
  if(I.step===1){body=`<b>What do you want to do?</b>${['Update prices','Update availability','Add new units'].map(p=>`<label class="df-task"><input type="radio" name="imp-p" ${I.purpose===p?'checked':''} onchange="DE.imp.purpose='${p}'"><span>${p}</span></label>`).join('')}
    <div class="de-card"><b>Start from current units</b><p class="de-mu">Export includes stable IDs, EUR currency and today’s values. It’s a dated snapshot, not live inventory.</p><div class="de-acts"><button type="button" class="btn-ghost df-sm" onclick="deExport(false)">Export all units</button><button type="button" class="btn-ghost df-sm" onclick="deExport(false)">Download template</button></div></div>
    <b>Matching mode</b><label class="df-task"><input type="radio" name="imp-m" ${I.mode==='update'?'checked':''} onchange="DE.imp.mode='update'"><span>Update existing units only (recommended)</span></label><label class="df-task"><input type="radio" name="imp-m" ${I.mode==='add'?'checked':''} onchange="DE.imp.mode='add'"><span>Update and add new units · new units start as off-market drafts</span></label>
    <p class="de-mu">Rows for other developments are flagged, never moved into ${deEsc(d.name)}.</p>`;foot=`<button type="button" class="btn-primary" onclick="deImpStep(2)">Continue</button>`;}
  if(I.step===2){body=`<button type="button" class="de-drop big" onclick="deImpStep(3)"><b>Upload your spreadsheet</b><span class="de-mu">XLSX or CSV · or use the sample ${deEsc(d.id)}-prices-sep.xlsx</span></button>`;foot=`<button type="button" class="btn-ghost" onclick="deImpStep(1)">Back</button><button type="button" class="btn-primary" onclick="deImpStep(3)">Use sample file</button>`;}
  if(I.step===3){const rows=I.rows.slice(0,3);body=`<p><b>${deEsc(d.id)}-prices-sep.xlsx</b> <span class="de-mu">18 KB · sheet “Units” · header row 1 · ${I.rows.length} data rows · values read, formulas not run</span></p>
    <div class="de-table"><div class="de-tr de-th"><span>Row</span><span>Unit ID</span><span>Price</span><span>Status</span></div>${rows.map(r=>`<div class="de-tr"><span>${r.r}</span><span>${deEsc(r.unit.replace('#',''))}</span><span>${deEsc(r.nw.replace('€','').replace(/,/g,'.'))}</span><span>${deEsc(r.field==='Availability'?r.nw:'Available')}</span></div>`).join('')}</div>
    <label class="df-task"><input type="checkbox" ${I.fmtOk?'checked':''} onchange="DE.imp.fmtOk=this.checked;deRender()"><span>Numbers use a dot for thousands. “${deEsc(rows[0]?.nw.replace('€','').replace(/,/g,'.')||'199.000')}” means ${deEsc(rows[0]?.nw||'€199,000')}, not ${deEsc((rows[0]?.nw||'€199').split(',')[0])}.</span></label>`;
    foot=`<button type="button" class="btn-ghost" onclick="deImpStep(2)">Back</button><button type="button" class="btn-primary" ${I.fmtOk?'':'disabled'} onclick="deImpStep(4)">Continue</button>`;}
  if(I.step===4){body=`<b>Match columns</b>${[['Unit ID','Unit reference (stable ID)','Used to match'],['Price','Listing price · EUR','Suggested'],['Status','Availability','Protected changes are routed'],['Notes','Don’t import','']].map(([a,b,c])=>`<div class="de-tr"><b>${a}</b><span>→ ${b}</span><span class="de-mu">${c}</span></div>`).join('')}
    <p class="de-mu">Blank cells leave values unchanged. Units missing from the file are left as they are, never removed or taken off market.</p>
    <label class="df-task"><input type="checkbox" ${I.mapOk?'checked':''} onchange="DE.imp.mapOk=this.checked;deRender()"><span>These mappings are correct</span></label>`;
    foot=`<button type="button" class="btn-ghost" onclick="deImpStep(3)">Back</button><button type="button" class="btn-primary" ${I.mapOk?'':'disabled'} onclick="deImpStep(5)">Review differences</button>`;}
  if(I.step===5){const left=deImpUnresolved().length;body=`<b>Review the differences</b> <span class="de-mu">${left?left+' flagged row'+(left===1?'':'s')+' left to resolve':'Every flagged row is resolved'}</span>
    <div class="de-table">${I.rows.map(r=>{const dupKey='dup:'+r.unit, soldKey='sold:'+r.unit;return `<div class="de-tr de-imp ${r.kind}"><span>${r.r}</span><b>${deEsc(r.unit)}</b><span>${deEsc(r.field)}</span><span>${deEsc(r.old)} → ${deEsc(r.nw)} <span class="de-mu">${deEsc(r.delta||'')}</span></span>
      <span>${r.kind==='update'?'<span class="de-chip ok">Update</span>':r.kind==='same'?'<span class="de-chip">No change</span>':r.kind==='cross'||r.kind==='unknown'?'<span class="de-chip bad">Excluded</span>':''}
      ${r.kind==='dup'?`<label class="df-task"><input type="radio" name="${dupKey}" ${I.dec[dupKey]===String(r.r)?'checked':''} onchange="DE.imp.dec['${dupKey}']='${r.r}';deRender()"><span>Use row ${r.r}</span></label>`:''}
      ${r.kind==='sold'?`<button type="button" class="btn-ghost df-sm" onclick="DE.imp.dec['${soldKey}']='skip';deRender()">Skip row</button><button type="button" class="btn-ghost df-sm" onclick="DE.imp.dec['${soldKey}']='recon';deRender()">Send to reconciliation</button>${I.dec[soldKey]?`<span class="de-chip">${I.dec[soldKey]==='recon'?'Sent to reconciliation':'Skipped'}</span>`:''}`:''}</span>
      ${r.note?`<span class="de-mu de-full">${deEsc(r.note)}</span>`:''}${r.warn?`<span class="de-bad de-full">${deEsc(r.warn)}</span>`:''}</div>`;}).join('')}
      ${I.rows.some(r=>r.kind==='dup')?`<div class="de-tr"><span class="de-mu">${deEsc(I.rows.find(r=>r.kind==='dup').unit)} appears twice.</span><button type="button" class="btn-ghost df-sm" onclick="DE.imp.dec['dup:${I.rows.find(r=>r.kind==='dup').unit}']='skip';deRender()">Skip both</button></div>`:''}</div>`;
    foot=`<button type="button" class="btn-ghost" onclick="deImpStep(4)">Back</button><button type="button" class="btn-primary" ${left?'disabled':''} onclick="deImpStep(6)">${left?'Resolve every flagged row to continue':`Continue with ${deImpFinal().length} changes`}</button>`;}
  if(I.step===6){const fin=deImpFinal();body=`<b>Confirm the final set</b><div class="de-grid3"><div class="de-card"><b>${fin.length}</b><span class="de-mu">Changes that will apply together</span></div><div class="de-card"><b>${I.rows.length-fin.length}</b><span class="de-mu">Rows unchanged, skipped or excluded</span></div></div>
    ${fin.map(r=>`<div class="de-tr"><b>${deEsc(r.unit)}</b><span>${deEsc(r.old)} → ${deEsc(r.nw)}</span><span class="de-mu">row ${r.r}</span></div>`).join('')}`;
    foot=`<button type="button" class="btn-ghost" onclick="deImpStep(5)">Back</button><button type="button" class="btn-ghost" onclick="deImpApply('batch')">Save as inventory batch</button>${deAdmin()?`<button type="button" class="btn-primary" onclick="deImpApply('apply')">Apply ${fin.length} changes</button>`:`<button type="button" class="btn-primary" onclick="deImpApply('batch');deBatchSubmit()">Request approval</button>`}`;}
  if(I.step===7){const R=I.result;body=R.draft?`<b>Saved to the inventory batch · not applied</b><p class="de-mu">${R.applied} proposed change${R.applied===1?'':'s'}. Nothing changed on live units. An admin reviews and applies it from Units & availability.</p>`
    :`<b>Changes applied</b><p class="de-mu">${R.applied} listing price${R.applied===1?'':'s'} updated · batch ${R.batch} · ${deEsc(deMe())} · today ${deNow()}. ${R.notApplied} rows not applied. Buyers weren’t notified. The Present Mode price cache refreshes within 5 minutes.</p>`;
    foot=`<button type="button" class="btn-ghost" onclick="deToast('Row report downloaded')">Download row report</button><button type="button" class="btn-primary" onclick="DE.drawer=null;DE.imp=null;deRender()">Back to units</button>`;}
  return {title:'Import / export units',sub:'Flow · Standard import flow',body:head+body,foot};
}

// ---------- modals ----------
function deModalHtml(d,st){
  const m=DE.modal; let title='',body='',foot='';
  if(m==='leave'){title='Save your changes before leaving?';body='<p class="de-mu">Your draft edits aren’t saved yet. Live content isn’t affected either way.</p>';foot=`<button type="button" class="btn-ghost" onclick="deLeaveChoice('stay')">Stay</button><button type="button" class="btn-ghost" onclick="deLeaveChoice('discard')">Discard</button><button type="button" class="btn-primary" onclick="deLeaveChoice('save')">Save draft</button>`;}
  if(m==='apply'){title=`Apply ${st.batch.length} inventory change${st.batch.length===1?'':'s'}`;body=`<p class="de-mu">These update live units straight away. Content publishing isn’t affected. Units held, reserved or sold through a deal keep their status.</p>${st.batch.map(b=>`<div class="de-tr"><b>${deEsc(b.unit)}</b><span>${deEsc(b.field)}: ${deEsc(b.oldTxt)} → ${deEsc(b.newTxt)}</span></div>`).join('')}`;foot=`<button type="button" class="btn-ghost" onclick="DE.modal=null;deRender()">Cancel</button><button type="button" class="btn-primary" onclick="deBatchApply()">Apply to live units</button>`;}
  if(m==='team'){title='Add team member';body=`${deField('Name',`<input id="tm-n" placeholder="e.g. Grech Landscaping">`)}${deField('Role',`<select id="tm-r">${['Architect','Contractor','Interior designer','Landscape architect','Engineer','Agent'].map(r=>`<option>${r}</option>`).join('')}</select>`)}`;foot=`<button type="button" class="btn-ghost" onclick="DE.modal=null;deRender()">Cancel</button><button type="button" class="btn-primary" onclick="deTeamSave()">Add member</button>`;}
  if(m==='archive'){const units=deUnits(d),avail=units.filter(u=>u.status==='available').length,deals=OPPS.filter(o=>o.devs.includes(d.name)&&!EXIT_STAGES.includes(o.stage)).length;
    title=`Archive ${deEsc(d.name)}`;body=`<p class="de-mu">Archiving hides the development from new sales. Everything stays on record.</p><div class="de-tr"><span class="de-grow">Units</span><b>${units.length} · ${avail} still available would be taken off market</b></div><div class="de-tr"><span class="de-grow">Open opportunities and deals</span><b>${deals} keep running</b></div><div class="de-tr"><span class="de-grow">Shared links</span><b>Stop showing new availability</b></div>${deField('Reason',`<textarea id="ar-why" rows="2"></textarea>`)}`;
    foot=`<button type="button" class="btn-ghost" onclick="DE.modal=null;deRender()">Cancel</button><button type="button" class="btn-primary" onclick="deArchive()">${deAdmin()?'Archive development':'Request archive'}</button>`;}
  if(m==='preview'){const dr=st.draft, s=dvStats(d.name), cover=dr.assets.find(a=>a.cover&&a.img);title='Buyer preview · Not published';
    body=`<div class="de-preview">${cover?`<img src="${deEsc(/^blob:/.test(cover.img)?cover.img:awAsset(cover.img))}" alt="${deEsc(cover.alt)}">`:''}<h2>${deEsc(dr.name)}</h2><p><i>${deEsc(dr.tagline)}</i></p><p>${deEsc(dr.about)}</p><p class="de-mu">${s.avail} of ${s.total} units available · from ${fmtK(s.min)} · live inventory</p>
      <div class="de-chips">${dr.amen.filter(a=>a.n).map(a=>`<span class="tag-chip">${deEsc(a.n)}${/planned/i.test(a.del)?' · '+deEsc(a.del.replace('Planned · ','')):''}</span>`).join('')}</div>
      ${dr.stories.map(x=>`<div class="de-card"><b>${deEsc(x.h)}</b><p class="de-mu">${deEsc(x.c)}</p></div>`).join('')}
      <p class="de-mu">Internal files and notes hidden · ${dr.docs.filter(x=>x.vis==='Internal').length} internal document${dr.docs.filter(x=>x.vis==='Internal').length===1?'':'s'} not shown</p></div>`;
    foot=`<button type="button" class="btn-primary" onclick="DE.modal=null;deRender()">Close preview</button>`;}
  return `<div class="de-scrim" onclick="${m==='leave'?"deLeaveChoice('stay')":'DE.modal=null;deRender()'}"></div><div class="de-modal ${m==='preview'?'wide':''}" role="dialog" aria-modal="true" aria-label="${deEsc(title)}"><header><h3>${title}</h3></header><div class="de-dbody">${body}</div><footer>${foot}</footer></div>`;
}
function dePreview(){DE.modal='preview';deRender();}
function deTeamSave(){const n=document.getElementById('tm-n').value.trim(),r=document.getElementById('tm-r').value;if(!n){deToast('Add a name');return;}deDraft().team.push({ini:n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase(),n,role:r,note:'Bio not added yet'});DE.modal=null;deMark();deRender();}
function deArchive(){
  const d=deDev(), why=document.getElementById('ar-why').value.trim(); if(!why){deToast('Add a reason');return;}
  DE.modal=null;
  if(deAdmin()){d.archived={why,by:deMe(),at:'Today'};deUnits(d).forEach(u=>{if(u.status==='available')u.status='off_market';});deState(d).history.unshift({v:deState(d).version,what:`Archived · ${why}`,who:deMe(),when:'Today '+deNow(),snap:null});deRender();deToast(`${d.name} archived · available units taken off market`);}
  else{deRender();deToast('Archive requested · an admin reviews the impact');}
}

// ---------- hooks: development page entry points open the editor ----------
(function(){
  window.awEditDevelopment=function(id){deOpen(id,'details');};
  const baseGo=window.go;
  window.go=function(page){
    if(document.getElementById('p-devedit')?.classList.contains('on')&&DE.devId&&deState(deDev()).save==='unsaved'){deLeave(()=>baseGo(page));return;}
    return baseGo.apply(this,arguments);
  };
  const baseRender=window.renderDev;
  window.renderDev=function(){
    baseRender.apply(this,arguments);
    const d=dvCur, menu=document.getElementById('dv-actions-menu'); if(!d||!menu) return;
    const edit=[...menu.querySelectorAll('[role=menuitem]')].find(b=>/Edit development/.test(b.textContent));
    if(!edit&&deCanEdit()) menu.insertAdjacentHTML('afterbegin',`<button role="menuitem" onclick="dvAct(()=>deOpen('${d.id}','overview'))"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M9.5 2.5l2 2L5 11H3V9z"/></svg>Edit development</button>`);
    else if(edit) edit.setAttribute('onclick',`dvAct(()=>deOpen('${d.id}','overview'))`);
    if(deCanEdit()&&!menu.querySelector('[data-de-imp]')) (menu.querySelector('[role=menuitem]:nth-of-type(2)')||menu.lastElementChild).insertAdjacentHTML('afterend',`<button role="menuitem" data-de-imp onclick="dvAct(()=>{deOpen('${d.id}','units');deImpOpen();})"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7 2v7M4.5 6.5L7 9l2.5-2.5M2.5 11.5h9"/></svg>Import / export units</button>`);
    document.querySelectorAll('#dv-tabc .dv-edit-link').forEach(b=>{if(/about|location/i.test(b.textContent))b.setAttribute('onclick',`deOpen('${d.id}','details')`);});
    const st=d.editor; const chip=document.querySelector('#dv-root .dv-head-chips .dv-chip');
    if(chip&&st) chip.textContent=`Live · v${st.version}${deChanges(d).length?' · draft pending':''}`;
  };
})();
