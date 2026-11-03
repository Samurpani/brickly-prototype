// Lead intake · core: per-development capture state, question library and the capture engine.
// Every lead from a Bricly form, Meta Lead Ads or Google Ads lead forms goes through liCapture(),
// which validates, dedupes, assigns, creates the contact + opportunity and records the attribution.
const LI={
  acct:{
    meta:{connected:false,business:'Grech Developments',user:'Mark Grech',pages:[],checked:{}},
    google:{connected:false,user:'mark@grechdevelopments.com',account:null},
  },
  devs:{},
  ui:{dev:null,view:'home',formId:null,tab:'questions',editQ:null,lib:false,pvStep:1,logF:'All',modal:null},
  seq:0,
};
const LI_FIELDS=['Full name','First name','Last name','Phone','Email','Buyer type','Property interest','Budget','Timeline','Finance','Nationality','Preferred channel','Contact time','Language','Custom answer','Don’t import'];
const LI_CHANNELS=['Website','Meta Lead Form','Google Ads','Instagram','Facebook','Email newsletter','WhatsApp','Hoarding / sign','Brochure','Agency partner','Portal','Other'];
const LI_ACCENTS=['#657A32','#2E2D2C','#486477','#8A5E13','#9B4D3A','#5B4B8A'];
const LI_META_PAGES=[{id:'pg1',name:'Grech Developments',fans:'12.4k followers'},{id:'pg2',name:'La Lex Sliema',fans:'3.1k followers'},{id:'pg3',name:'Verdala Living',fans:'1.8k followers'}];
const LI_GOOGLE_ACCTS=[{id:'412-883-1920',name:'Grech Developments'},{id:'587-220-0143',name:'Grech Group · Manager account'}];

function liEsc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function liSlug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,18)||'dev';}
function liId(p){return p+'_'+(++LI.seq).toString(36)+Math.random().toString(36).slice(2,6);}
function liHash(s){let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h;}
function liDev(){return typeof dvCur!=='undefined'&&dvCur?dvCur:DEVS[0];}
function liDevById(id){return DEVS.find(d=>d.id===id)||liDev();}
function liK(n){return '€'+Math.round(n/1000)+'k';}
function liNow(){const d=new Date();return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})+', '+d.toTimeString().slice(0,5);}

function liUnitOpts(d){
  const us=UNITS.filter(u=>u.dev===d.name), out=new Set();
  us.forEach(u=>{if(/pent/i.test(u.type))out.add('Penthouse');else if(/mais/i.test(u.type))out.add('Maisonette');else out.add(u.beds===0?'Studio':u.beds+' bedroom'+(u.beds>1?'s':''));});
  const arr=[...out].sort();return arr.length?arr:['1 bedroom','2 bedrooms','3 bedrooms','Penthouse'];
}
function liBands(d){
  const ps=UNITS.filter(u=>u.dev===d.name).map(u=>u.price).filter(Boolean);
  const lo=ps.length?Math.floor(Math.min(...ps)/50000)*50000:250000, hi=ps.length?Math.ceil(Math.max(...ps)/50000)*50000:600000;
  const step=Math.max(50000,Math.round((hi-lo)/5/50000)*50000), out=[];
  for(let a=lo;a<hi&&out.length<5;a+=step)out.push(`${liK(a)} to ${liK(Math.min(a+step,hi))}`);
  out.push(`Over ${liK(hi)}`);return out;
}
function liLibrary(d){
  return [
    {key:'btype',label:'What are you buying for?',type:'choice',opts:['A home to live in','An investment','A holiday home','Not sure yet'],maps:'Buyer type'},
    {key:'interest',label:'What are you looking for?',type:'multi',opts:liUnitOpts(d),maps:'Property interest',fromUnits:true},
    {key:'budget',label:'What is your budget?',type:'choice',opts:liBands(d),maps:'Budget',fromUnits:true},
    {key:'timeline',label:'When are you looking to buy?',type:'choice',opts:['Within 3 months','Within 6 months','Within 12 months','Just browsing'],maps:'Timeline'},
    {key:'finance',label:'How do you plan to pay?',type:'choice',opts:['Cash','Mortgage, approved','Mortgage, not yet applied','Not sure yet'],maps:'Finance'},
    {key:'country',label:'Where are you based?',type:'choice',opts:['Malta','Elsewhere in the EU','United Kingdom','Outside Europe'],maps:'Nationality'},
    {key:'channel',label:'How should we contact you?',type:'choice',opts:['WhatsApp','Phone call','Email'],maps:'Preferred channel'},
    {key:'ctime',label:'When is best to reach you?',type:'choice',opts:['Morning','Afternoon','Evening'],maps:'Contact time'},
    {key:'lang',label:'Preferred language',type:'choice',opts:['English','Maltese','Italian'],maps:'Language'},
    {key:'ftb',label:'Is this your first property?',type:'choice',opts:['Yes','No'],maps:'Custom answer'},
    {key:'agent',label:'Are you working with an agent?',type:'choice',opts:['No','Yes'],maps:'Custom answer'},
    {key:'msg',label:'Anything you would like to ask?',type:'long',opts:[],maps:'Custom answer'},
  ];
}
function liQ(d,key,extra){const q=liLibrary(d).find(x=>x.key===key);return {...q,opts:[...q.opts],id:liId('q'),req:true,help:'',...extra};}

function liNewForm(d,kind){
  const s=liSlug(d.name);
  if(kind==='enquiry')return {id:`frm_${s}_enq`,kind,name:'Enquiry form',status:'live',twoStep:false,
    qs:[{key:'reason',id:liId('q'),label:'How can we help?',type:'choice',opts:['Book an appointment','Ask about a home','Request the brochure','General question'],maps:'Custom answer',req:true,help:''},
        {key:'msg',id:liId('q'),label:'Your message',type:'long',opts:[],maps:'Custom answer',req:false,help:''}],
    design:{headline:`Ask about ${d.name}`,intro:'A member of the sales team replies within the hour during office hours.',button:'Send',thanks:'Thanks {first}. We have your message and will reply shortly.',accent:LI_ACCENTS[0],logo:true,hero:false,privacy:`https://${s}.bricly.site/privacy`,optin:'Send me news about other Grech developments (optional)',lang:'English'},
    after:{mode:'thanks',url:'',booking:false,autoReply:true,notify:true}};
  return {id:`frm_${s}_reg`,kind:'registration',name:'Registration form',status:'live',twoStep:true,
    qs:[liQ(d,'btype'),liQ(d,'interest'),liQ(d,'budget'),liQ(d,'timeline',{req:false})],
    design:{headline:`Register for prices and availability at ${d.name}`,intro:'Two quick steps. You get live prices and availability straight after.',button:'See prices and availability',thanks:'Thanks {first}. Your access link is on its way by email.',accent:LI_ACCENTS[0],logo:true,hero:true,privacy:`https://${s}.bricly.site/privacy`,optin:'Send me news about other Grech developments (optional)',lang:'English'},
    after:{mode:'availability',url:'',booking:true,autoReply:true,notify:true}};
}
function liEditable(f){return JSON.stringify({twoStep:f.twoStep,qs:f.qs,design:f.design,after:f.after});}
function liDirty(f){return f.pub!==liEditable(f);}
function liPublish(f){f.pub=liEditable(f);f.status='live';f.pubAt=liNow();}
function liDiscard(f){Object.assign(f,JSON.parse(f.pub));}

// Per-development capture state, created on first open with forms already live.
function liState(d){
  d=d||liDev();
  if(LI.devs[d.id])return LI.devs[d.id];
  const s=liSlug(d.name), idx=Math.max(0,DEVS.indexOf(d));
  const st=LI.devs[d.id]={slug:s,host:`https://${s}.bricly.site`,
    forms:[liNewForm(d,'registration'),liNewForm(d,'enquiry')],
    site:{style:'inline',platform:'wordpress',btn:'Register your interest',domains:idx===0?[{d:`${s}.com.mt`,seen:'2 min ago',page:'/register'}]:[],devEmail:''},
    google:{manual:{url:`https://capture.bricly.com/google/dev_${String(140+idx).padStart(4,'0')}/${liHash(s).toString(16).slice(0,6)}`,key:'gk_live_'+liHash(s+'k').toString(36)+'…'+liHash(s+'z').toString(36).slice(0,4)}},
    links:[],log:[]};
  st.forms.forEach(f=>{liPublish(f);f.pubAt='At setup';});
  liSeedLog(d,st);
  return st;
}
function liSeedCapture(o,d){
  const h=liHash(o.id), meta=/meta|instagram|facebook/i.test(o.source), goog=/google/i.test(o.source);
  const form=meta?`${d.name} · ${['Spring launch','Investor carousel','Open day'][h%3]}`:goog?`${d.name} · Lead form`:'Registration form';
  const campaign=meta?['Spring launch','Investor carousel','Autumn open day'][h%3]:goog?`Search · ${d.name}`:'';
  return {captureId:'cap_'+h.toString(36),devId:d.id,channel:o.source,method:meta?'Meta lead form':goog?'Google lead form':'Bricly form · embedded',form,campaign,
    adset:meta?['Sliema 25–45','Investors EU','Retarget 30d'][h%3]:goog?'Ad group · new homes':'',ad:meta?['carousel-a','video-15s','static-terrace'][h%3]:'',
    utm:meta?{source:'meta',medium:'paid',campaign:campaign.toLowerCase().replace(/\s+/g,'-')}:goog?{source:'google',medium:'cpc',campaign:'search-'+liSlug(d.name)}:null,
    landing:meta||goog?'':`${liSlug(d.name)}.com.mt/register`,receivedAt:o.ago,test:false,
    answers:[{q:'What are you buying for?',a:o.tags.includes('Investor')?'An investment':'A home to live in',maps:'Buyer type'},{q:'What is your budget?',a:o.budget?`Up to ${liK(o.budget*1000)}`:'Not given',maps:'Budget'}],
    consent:{privacy:'Privacy notice v3',optin:h%2===0,at:o.ago},touches:[{at:o.ago,channel:o.source,form}]};
}
function liSeedLog(d,st){
  OPPS.filter(o=>o.devs.includes(d.name)&&/meta|google|website|instagram/i.test(o.source||'')).slice(0,12).forEach(o=>{
    if(!o.capture)o.capture=liSeedCapture(o,d);
    st.log.push({id:o.capture.captureId,t:o.ago,channel:o.source,form:o.capture.form,campaign:o.capture.campaign,name:o.lead,outcome:'Created',oppId:o.id,rep:o.rep,test:false,cap:o.capture});
  });
}

function liPickRep(devName){
  const reps=[...new Set(OPPS.filter(o=>o.devs.includes(devName)).map(o=>o.rep))].filter(r=>r&&r!=='Unassigned');
  if(!reps.length)return typeof UN_REP!=='undefined'?UN_REP:'Sam';
  return reps.map(r=>[r,OPPS.filter(o=>o.rep===r&&o.stage==='New Lead').length]).sort((a,b)=>a[1]-b[1])[0][0];
}
function liBudgetMax(a){if(!a)return null;const m=String(a).match(/€(\d+)k(?!.*€)/)||String(a).match(/(\d+)k/g);if(!m)return null;const v=String(a).match(/(\d+)k/g);return v?parseInt(v[v.length-1],10):null;}

// The one entry point every source uses. p: {devId, channel, method, form, formId, campaign, adset, ad, utm, landing,
// first, last, phone, email, answers:[{q,a,maps}], optin, test, raw}
function liCapture(p){
  const d=liDevById(p.devId), st=liState(d);
  const name=[p.first,p.last].filter(Boolean).join(' ').trim()||p.fullName||'Unknown name';
  const entry={id:liId('cap'),t:'Just now',at:liNow(),channel:p.channel,form:p.form,campaign:p.campaign||'',name,outcome:'',reason:'',oppId:null,rep:'',test:!!p.test};
  const cap={captureId:entry.id,devId:d.id,channel:p.channel,method:p.method,form:p.form,formId:p.formId||'',campaign:p.campaign||'',adset:p.adset||'',ad:p.ad||'',
    utm:p.utm||null,landing:p.landing||'',receivedAt:entry.at,test:!!p.test,answers:p.answers||[],
    consent:{privacy:'Privacy notice v3',optin:!!p.optin,at:entry.at},touches:[{at:entry.at,channel:p.channel,form:p.form}],raw:p.raw||null};
  entry.cap=cap;
  if(!p.phone&&!p.email){entry.outcome='Held';entry.reason='No phone or email, so nobody could follow up';st.log.unshift(entry);return entry;}
  const digits=s=>String(s||'').replace(/\D/g,'').slice(-8);
  const contact=CONTACTS.find(c=>(p.phone&&digits(c.phone)&&digits(c.phone)===digits(p.phone))||(p.email&&c.email&&c.email.toLowerCase()===p.email.toLowerCase()));
  const ans=k=>(cap.answers.find(a=>a.maps===k)||{}).a||'';
  if(contact){
    const open=OPPS.find(o=>contact.oppIds.includes(o.id)&&o.devs.includes(d.name)&&!['Lost','Closed Won','Closed Lost'].includes(o.stage));
    if(open){
      open.capture=open.capture||{...cap,touches:[]};
      open.capture.touches.push({at:entry.at,channel:p.channel,form:p.form});
      cap.answers.forEach(a=>{const i=open.capture.answers.findIndex(x=>x.q===a.q);if(i>=0)open.capture.answers[i]=a;else open.capture.answers.push(a);});
      getExt(open).comms.unshift({ch:'sys',t:'Just now',text:`Registered again from ${p.channel} · ${p.form}. Answers updated, no new opportunity.`});
      Object.assign(entry,{outcome:'Matched',reason:`Same ${p.phone?'phone':'email'} as ${contact.name}, open ${open.id}`,oppId:open.id,rep:open.rep,name:contact.name});
      st.log.unshift(entry);liAfterCapture();return entry;
    }
  }
  const rep=liPickRep(d.name), bmax=liBudgetMax(ans('Budget'));
  const o={id:'OPP-'+(3000+(++LI.seq)),contactId:contact?contact.id:'CT-'+liId('lc'),lead:contact?contact.name:name,devs:[d.name],units:[],stage:'New Lead',source:p.channel,
    budget:bmax,value:bmax,tags:p.test?['Test lead']:[],rep,next:{d:'Today',t:'Make first contact within 15 minutes'},ago:'Just now',capture:cap};
  let c=contact;
  if(!c){
    c={id:o.contactId,name,type:'lead',btype:ans('Buyer type')||null,company:null,status:'lead',email:p.email||'',phone:p.phone||'',nat:ans('Nationality'),lang:ans('Language'),
      source:p.channel,ref:null,bmin:null,bmax,interest:[ans('Property interest'),d.name].filter(Boolean).join(' · '),ploc:d.name,finance:ans('Finance')||null,timeline:ans('Timeline')||null,
      rep,tags:p.test?['Test lead']:[],oppIds:[],consent:{wa:!!p.phone,em:!!p.optin,sms:false},created:'Today',last:'Today',lastD:0,notesList:[],
      buyingWith:'',preferredChannel:ans('Preferred channel'),bedrooms:'',mustHaves:[]};
    CONTACTS.push(c);
  }
  c.oppIds.push(o.id);OPPS.push(o);
  const x=getExt(o);
  x.buyer={name:c.name,phone:c.phone,email:c.email,type:c.btype||'Not specified',budget:bmax?fmtEur(bmax*1000):'Not specified',finance:c.finance||'Not specified',timeline:c.timeline||'Not specified'};
  x.comms=[{ch:'sys',t:'Just now',text:`Lead captured from ${p.channel} · ${p.form}${p.campaign?' · '+p.campaign:''}. Assigned to ${rep}.`}];
  Object.assign(entry,{outcome:'Created',oppId:o.id,rep,name:c.name});
  st.log.unshift(entry);liAfterCapture();return entry;
}
function liAfterCapture(){
  if(typeof FILTER_OPTS!=='undefined')FILTER_OPTS.source=[...new Set(OPPS.map(o=>o.source).filter(Boolean))].sort();
  if(typeof pipeRenderAll==='function')try{pipeRenderAll();}catch(e){}
}
function liSample(i){
  const P=[['Maria','Borg','+356 7912 3456','maria.borg@gmail.com'],['Daniel','Vella','+356 9944 1112','dvella@outlook.com'],['Sophie','Klein','+49 151 2233 4455','sophie.klein@web.de'],['Luke','Camilleri','+356 7700 8123','luke.c@gmail.com'],['Elena','Rossi','+39 347 555 0192','elena.rossi@libero.it']];
  const s=P[(i??LI.seq)%P.length];return {first:s[0],last:s[1],phone:s[2],email:s[3]};
}
