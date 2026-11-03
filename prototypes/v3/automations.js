// Automations (oth4 · Bricly Automations · Automations Flows 1–6), replacing the earlier workflow list.
// The design's Marina Heights examples are shown on Mercury so they match the prototype's developments.
const AUV_DEV='Mercury';
const AUV_TYPES={email:{label:'Email',ic:'✉',send:true},whatsapp:{label:'WhatsApp',ic:'💬',send:true},wait:{label:'Wait',ic:'⏱'},notify:{label:'Notify',ic:'🔔'},task:{label:'Create task',ic:'☑'},tag:{label:'Add or remove tag',ic:'#'},stage:{label:'Move stage',ic:'→'}};
const AUV_TRIGS=[['form','Form submitted','A lead form is submitted'],['lead','Lead created','A new contact and deal arrive by any path'],['tag','Tag added','A tag is applied to a contact'],['stage','Stage changed','A deal moves to a stage'],['appt','Appointment','Booked, 24h before, completed or no-show'],['noact','No activity','A deal goes quiet for N days'],['unit','Unit changed','Price drop, back to Available or new release'],['manual','Manual enrolment','You enrol a saved filter or selected contacts']];
const AUV_S=(type,title,sub,x={})=>({type,title,sub,...x});
const AUV_TPL=[
  {id:'ack',name:'Enquiry acknowledgement',trig:{k:'form',pre:'When someone submits the ',em:`${AUV_DEV} enquiry form`},channels:['Email','WhatsApp'],steps:[AUV_S('email',`Email: Thanks for your enquiry about ${AUV_DEV}`,'Utility · from deal owner',{subject:`Thanks for your enquiry about ${AUV_DEV}`,body:`Hi {First name},\n\nThanks for your interest in ${AUV_DEV}. Your brochure, with floor plans and the current price list, is ready to download.\n\n{Deal owner name} will call you shortly to answer any questions.`,button:'Download the brochure'}),AUV_S('whatsapp','WhatsApp: Enquiry acknowledgement','Approved utility template',{body:'Hi {{1}}, thanks for your enquiry about {{2}}. {{3}} will call you today. Reply here any time.'}),AUV_S('task','Task for deal owner: Call within 1 hour','Due 1 hour after enrolment')]},
  {id:'nurture',name:'New lead nurture',trig:{k:'lead',pre:'When a new lead arrives ',em:'from any source'},channels:['Email'],steps:[AUV_S('wait','Wait 1 day','Next send respects the sending window'),AUV_S('email',`Email: The story behind ${AUV_DEV}`,'Marketing · from deal owner'),AUV_S('wait','Wait 3 days','Next send respects the sending window'),AUV_S('email',`Email: Floor plans for ${AUV_DEV}`,'Marketing · from deal owner'),AUV_S('wait','Wait 4 days','Next send respects the sending window'),AUV_S('task','Task for deal owner: Call to book an appointment','Due in 1 day')]},
  {id:'welcome',name:'Campaign lead welcome',trig:{k:'lead',pre:'When a new lead arrives ',em:'from Meta campaign Spring Launch'},channels:['Email'],steps:[AUV_S('email',`Email: Welcome to ${AUV_DEV}`,'Marketing · from deal owner'),AUV_S('tag','Add tag Spring Launch','Contact tag'),AUV_S('notify','Notify deal owner: New Spring Launch lead','In-app')]},
  {id:'viewing',name:'Appointment reminder and follow-up',trig:{k:'appt',pre:'When an appointment is ',em:'booked'},channels:['WhatsApp'],steps:[AUV_S('wait','Wait until 24h before the appointment','Appointment time minus 24 hours'),AUV_S('whatsapp','WhatsApp: Appointment reminder','Approved utility template',{body:'Hi {{1}}, a reminder of your viewing at {{2}} on {{3}}. Reply to reschedule.'}),AUV_S('wait','Wait until 2h after the appointment','Appointment time plus 2 hours'),AUV_S('task','Task for deal owner: Log the outcome','Due when the wait ends')]},
  {id:'noshow',name:'No-show recovery',trig:{k:'appt',pre:'When an appointment is ',em:'marked no-show'},channels:['WhatsApp'],steps:[AUV_S('whatsapp','WhatsApp: Reschedule appointment','Approved utility template',{body:'Hi {{1}}, sorry we missed you at {{2}}. Reply with a time that suits you and we’ll rebook.'}),AUV_S('wait','Wait 1 day','Next action respects the sending window'),AUV_S('task','Task for deal owner: Call to rebook','Due in 1 day')]},
  {id:'price',name:'Price drop or new release',trig:{k:'unit',pre:'When a price drops at ',em:AUV_DEV},channels:['Email'],steps:[AUV_S('email',`Email: A new price at ${AUV_DEV}`,'Marketing · live price and availability link'),AUV_S('notify','Notify deal owners: Price drop sent to your contacts','In-app')]},
  {id:'quiet',name:'Quiet deal nudge',trig:{k:'noact',pre:'When a deal has ',em:'no activity for 7 days'},channels:['Internal only'],steps:[AUV_S('notify','Notify deal owner: No activity for 7 days','In-app and WhatsApp'),AUV_S('task','Task for deal owner: Follow up','Due in 1 day. The follow-up draft writes the buyer message.')]},
  {id:'campaign',name:'Email campaign',trig:{k:'manual',pre:'When I enrol ',em:`Investors, ${AUV_DEV} (142)`,post:' on 14 Jan, 10:00'},channels:['Email'],steps:[AUV_S('email',`Email: ${AUV_DEV}: January investor update`,'Marketing · from the sales team',{subject:`${AUV_DEV}: January investor update`,body:`Hi {First name},\n\nHere is the January update on ${AUV_DEV}. Structural works finished in December and first handovers remain planned for Q3 2027.`,button:'See live availability'})]},
];
const AUV_CHIP={draft:['Draft',''],active:['Active','ok'],pending:['Changes pending','warn'],paused:['Paused',''],error:['Error','err']};
let AUV=[
  {id:'ack',tpl:'ack',name:'Enquiry acknowledgement',status:'active',dev:AUV_DEV,inProg:18,done:212,last:'12 min ago',by:'Rachel Mifsud'},
  {id:'viewing',tpl:'viewing',name:'Appointment reminder and follow-up',status:'active',dev:'All developments',inProg:41,done:96,last:'1 h ago',by:'Rachel Mifsud'},
  {id:'nurture',tpl:'nurture',name:'New lead nurture',status:'pending',dev:AUV_DEV,inProg:57,done:138,last:'25 min ago',by:'Paul Grech'},
  {id:'price',tpl:'price',name:`Price drop · ${AUV_DEV}`,status:'active',dev:AUV_DEV,inProg:0,done:64,last:'26 Sep',by:'Paul Grech'},
  {id:'invite',tpl:'campaign',name:'Launch evening invite',status:'active',dev:AUV_DEV,inProg:38,done:0,last:'Sends 9 Oct, 10:00',by:'Rachel Mifsud',trig:'When I enrol VIP list (38) on 9 Oct, 10:00'},
  {id:'noshow',tpl:'noshow',name:'No-show recovery',status:'paused',dev:'All developments',inProg:4,done:12,last:'9 Sep',by:'Rachel Mifsud'},
  {id:'news',tpl:'campaign',name:'January investor update',status:'draft',dev:AUV_DEV,inProg:'—',done:'—',last:'Never',by:'Rachel Mifsud'},
  {id:'quiet',tpl:'quiet',name:'Quiet deal nudge',status:'draft',dev:'All developments',inProg:'—',done:'—',last:'Never',by:'Paul Grech'},
];
const AUV_CONTACTS=[['Maria Borg','A-203','Step 3 · Task for Karl Zammit','Due today, 11:40','In progress',''],['Luca Camilleri','B-105','Step 2 · WhatsApp','Tomorrow, 09:00','Held','Sending window · form submitted at 21:14'],['Daniel Farrugia','A-110','Step 1 · Email','Tomorrow, 09:00','Held','Frequency cap · messaged today by Appointment reminder'],['Elena Galea','C-302','Step 3 · Task','—','Completed',''],['Nikolai Petrov','A-204','Step 2 · WhatsApp','—','Stopped','Replied on WhatsApp'],['Aisha Rahman','B-201','Step 2 · WhatsApp','—','Skipped','No WhatsApp number · moved to step 3'],['Joseph Debono','A-108','Step 1 · Email','—','Failed','Email bounced after 3 retries']];
const AUV_ENR={'In progress':'info',Waiting:'',Held:'warn',Completed:'ok',Stopped:'',Skipped:'warn',Failed:'err'};
const AUV_HIST=[['30 Sep, 10:46','Activated','Version 3 approved. 2 messages, content recorded.','Rachel Mifsud','active'],['29 Sep, 17:02','Edited','Step 1 subject changed. Status set to Changes pending; version 2 wording kept sending.','Rachel Mifsud','pending'],['21 Sep, 08:15','Error','WhatsApp template Enquiry acknowledgement paused by Meta. Resolved 21 Sep, 09:40.','System','error'],['14 Sep, 12:30','Edited','Step 3 task due time changed from 2 hours to 1 hour. Applied to runs in progress.','Paul Grech','draft'],['12 Sep, 10:14','Activated','Version 1 approved. 2 messages, content recorded.','Rachel Mifsud','active'],['12 Sep, 10:02','Created','From the Enquiry acknowledgement template.','Rachel Mifsud','draft']];
let auvTab='all', auvView='list', auvAct=null, auvActTab='activity', auvCtF='All', auvMenu=null, auvB=null, auvModal=null;
const auvClone=o=>JSON.parse(JSON.stringify(o));
function auvCanEdit(){return typeof curPersona==='undefined'||curPersona!=='rep';}
function auvTpl(id){return AUV_TPL.find(t=>t.id===id);}
function auvTrigText(a){if(a.trig&&typeof a.trig==='string')return a.trig;const t=auvTpl(a.tpl).trig;return t.pre+t.em+(t.post||'');}
function auvChip(st){const c=AUV_CHIP[st]||AUV_CHIP.draft;return `<span class="auv-chip t-${c[1]}">${c[0]}</span>`;}
function auvMe(){return (typeof PERSONAS!=='undefined'&&PERSONAS[curPersona]?.name)||'Rachel Mifsud';}
// ---------- List ----------
function auvList(){
  const f={all:()=>true,active:a=>a.status==='active'||a.status==='pending',paused:a=>a.status==='paused',draft:a=>a.status==='draft',campaign:a=>a.tpl==='campaign'};
  const tabs=[['all','All'],['active','Active'],['paused','Paused'],['draft','Drafts'],['campaign','Campaigns']];
  const rows=AUV.filter(f[auvTab]), edit=auvCanEdit();
  return `<div class="crm-page-heading"><div class="page-title">Automations</div><div class="page-sub">Email campaigns, form follow-ups, lead sequences and reminders. Activating an automation approves its messages.</div></div>
    <div class="row-between crm-page-controls"><div class="tabs">${tabs.map(([k,l])=>`<button type="button" class="tab ${auvTab===k?'on':''}" onclick="auvTab='${k}';auvRender()">${l} <span class="auv-n">${AUV.filter(f[k]).length}</span></button>`).join('')}</div>
      <div class="toolbar">${edit?`<div class="cr-actions"><button class="btn-ghost" onclick="auvToggleMenu(event,'actions')">Actions ⌄</button>${auvMenu==='actions'?`<div class="cr-actions-menu auv-menu"><button onclick="auvBuild('campaign',{name:'January investor update'})">New email campaign</button><button onclick="auvBlank()">Start from blank</button><button onclick="go('settings');stGo('p:integrations')">Sending and channels</button></div>`:''}</div><button class="btn-primary" onclick="auvModal='picker';auvRender()">New automation</button>`:'<span class="auv-mu">Managers create and activate automations.</span>'}</div></div>
    <div class="auv-table"><div class="auv-tr th"><span></span><span>Name</span><span>Trigger</span><span>Development</span><span class="r">In progress</span><span class="r">Completed · 30d</span><span>Last run</span><span>Created by</span><span></span></div>
    ${rows.map(a=>`<div class="auv-tr" data-auv-row="${a.id}">
      <span>${a.status==='draft'?'':`<button type="button" class="st-toggle ${a.status==='active'||a.status==='pending'?'on':''}" role="switch" aria-checked="${a.status!=='paused'}" aria-label="${a.status==='paused'?'Resume':'Pause'} ${xesc(a.name)}" ${edit?'':'disabled'} onclick="event.stopPropagation();auvToggle('${a.id}')"><span></span></button>`}</span>
      <span class="auv-name"><b>${xesc(a.name)}</b>${auvChip(a.status)}</span><span>${xesc(auvTrigText(a))}</span><span>${xesc(a.dev)}</span><span class="r">${a.inProg}</span><span class="r">${a.done}</span><span>${xesc(a.last)}</span><span>${xesc(a.by)}</span>
      <span class="auv-rel">${edit?`<button type="button" class="tq-more" aria-label="More for ${xesc(a.name)}" onclick="auvToggleMenu(event,'row:${a.id}')">⋯</button>${auvMenu==='row:'+a.id?`<div class="auv-rowmenu" role="menu"><button role="menuitem" onclick="auvEdit('${a.id}')">Edit</button><button role="menuitem" onclick="auvDup('${a.id}')">Duplicate</button><button role="menuitem" class="danger" onclick="auvModal='delete:${a.id}';auvMenu=null;auvRender()">Delete</button></div>`:''}`:''}</span></div>`).join('')||'<div class="tq-empty">No automations here yet.</div>'}</div>`;
}
function auvToggleMenu(e,k){e.stopPropagation();auvMenu=auvMenu===k?null:k;auvRender();}
document.addEventListener('click',e=>{if(auvMenu&&e.target.isConnected&&!e.target.closest('.auv-menu,.auv-rowmenu')){auvMenu=null;auvRender();}});
function auvToggle(id){
  const a=AUV.find(x=>x.id===id);
  if(a.status==='paused'){auvModal='resume:'+id;auvRender();return;}
  a.status='paused';auvRender();showToast(`${a.name} paused · runs in progress wait where they are`);
}
function auvDup(id){const a=AUV.find(x=>x.id===id);AUV.unshift({...a,id:'a'+Date.now(),name:a.name+' (copy)',status:'draft',inProg:'—',done:'—',last:'Never',by:auvMe()});auvMenu=null;auvRender();showToast('Duplicated as a draft');}
// ---------- Builder ----------
function auvBuild(tplId,x={}){
  const t=auvClone(auvTpl(tplId));
  auvB={id:x.id||null,name:x.name||t.name,status:x.status||'draft',tpl:tplId,trig:t.trig,steps:t.steps.map((s,i)=>({...s,uid:'s'+i})),sel:'trigger',tested:false,addAt:null,saved:false};
  auvModal=null;auvMenu=null;auvView='builder';auvRender();
}
function auvBlank(){auvB={id:null,name:'Untitled automation',status:'draft',tpl:null,trig:{k:null,pre:'Choose the event that starts this automation',em:''},steps:[],sel:'trigger',tested:false,addAt:null};auvModal=null;auvMenu=null;auvView='builder';auvRender();}
function auvEdit(id){const a=AUV.find(x=>x.id===id);auvBuild(a.tpl,{id,name:a.name,status:a.status});}
function auvSummary(b){
  const ph=s=>({email:'send '+s.title.replace(/^Email: /,'the “')+(s.title.startsWith('Email: ')?'” email':''),whatsapp:'send the WhatsApp '+s.title.replace(/^WhatsApp: /,'').toLowerCase(),wait:s.title.toLowerCase(),task:'create a task: '+s.title.replace(/^Task for deal owner: /,'').toLowerCase(),notify:'notify the deal owner',tag:s.title.toLowerCase(),stage:s.title.toLowerCase()}[s.type]);
  const t=b.trig.k?b.trig.pre+b.trig.em+(b.trig.post||''):'Choose a trigger';
  const parts=b.steps.map(ph);
  return b.trig.k?`${t}, ${parts.length?parts.slice(0,-1).join(', ')+(parts.length>1?', then ':'')+parts.at(-1):'add the first step'}.`:t+'.';
}
function auvNeedsTest(b){return b.steps.some(s=>s.type==='email')&&!b.tested;}
function auvBuilderHtml(){
  const b=auvB;
  const card=(key,ic,label,body,x='')=>`<button type="button" class="auv-card ${b.sel===key?'on':''}" onclick="auvB.sel='${key}';auvRender()">${ic?`<span class="auv-ic">${ic}</span>`:''}<span class="auv-col">${label?`<span class="auv-mu">${label}</span>`:''}<span class="auv-cb">${body}</span></span>${x}</button>`;
  const plus=i=>`<div class="auv-plus"><button type="button" aria-label="Add a step here" onclick="auvB.addAt=${i};auvRender()">+</button>${b.addAt===i?`<div class="auv-addmenu">${Object.entries(AUV_TYPES).map(([k,v])=>`<button type="button" onclick="auvAddStep('${k}',${i})"><span class="auv-ic sm">${v.ic}</span>${v.label}</button>`).join('')}</div>`:''}</div>`;
  return `<div class="auv-builder" role="dialog" aria-modal="true" aria-label="Automation builder">
    <div class="auv-bh"><button type="button" class="auv-x" aria-label="Close builder" onclick="auvView='list';auvB=null;auvRender()">×</button><input class="auv-title" value="${xesc(b.name)}" aria-label="Automation name" oninput="auvB.name=this.value">${auvChip(b.status)}<span class="auv-mu" style="margin-left:auto">${b.saved?'Draft saved just now':''}</span><button class="btn-ghost" onclick="auvSave()">Save draft</button><button class="btn-primary" onclick="auvReview()">Review and activate</button></div>
    <div class="auv-sum"><span class="auv-mu">Summary ·</span> ${xesc(auvSummary(b))}</div>
    <div class="auv-bbody"><div class="auv-canvas">
      ${card('trigger','⚡',`Trigger${b.trig.k?' · '+AUV_TRIGS.find(t=>t[0]===b.trig.k)[1]:''}`,b.trig.k?`${xesc(b.trig.pre)}<b>${xesc(b.trig.em)}</b>${xesc(b.trig.post||'')}`:'<span class="auv-mu">Choose the event that starts this automation</span>')}
      ${card('filters','≡','Filters · optional','No filters. Everyone who triggers it is enrolled.')}
      ${plus(0)}
      ${b.steps.map((s,i)=>`${card(s.uid,AUV_TYPES[s.type].ic,'',`<span>${xesc(s.title)}</span><span class="auv-mu">${xesc(s.sub)}</span>`,`<span class="auv-stepn">${i+1}</span>${s.type==='email'&&!b.tested?'<span class="auv-err" title="Send a test first"></span>':''}<span class="auv-mv"><span role="button" tabindex="0" aria-label="Move up" onclick="event.stopPropagation();auvMove(${i},-1)">▲</span><span role="button" tabindex="0" aria-label="Move down" onclick="event.stopPropagation();auvMove(${i},1)">▼</span></span>`)}
        ${s.type==='email'&&!b.tested?'<div class="auv-errtxt">Send a test to yourself before activating</div>':''}${plus(i+1)}`).join('')}
      <button type="button" class="auv-addstep" onclick="auvB.addAt=${b.steps.length};auvRender()">+ Add step <span class="auv-mu">${b.steps.length} of 12</span></button>
      ${card('stop','⦸','Stop rules · a contact’s run ends early when','<span class="auv-tags"><span>🔒 Replies</span><span>🔒 Opts out</span><span>🔒 Removed by a user</span><span>Deal reaches Reserved, Won or Lost</span></span>')}
      ${card('settings','⚙','Settings','Re-entry · Once per contact<br>Sending window · 09:00 – 20:00, contact’s time zone<br>Sender · Deal owner')}
    </div><aside class="auv-panel">${auvPanel(b)}</aside></div></div>`;
}
function auvPanel(b){
  if(b.sel==='trigger') return `<div class="auv-mu">Trigger</div><h3>${b.trig.k?AUV_TRIGS.find(t=>t[0]===b.trig.k)[1]:'Choose a trigger'}</h3>
    ${b.trig.k==='form'?'<div class="auv-info">Bricly already creates the contact and deal and notifies the rep when this form is submitted. This automation runs in addition and doesn’t notify the rep again.</div>':''}
    <div class="auv-radios" role="radiogroup" aria-label="Trigger">${AUV_TRIGS.map(([k,l,d])=>`<button type="button" role="radio" aria-checked="${b.trig.k===k}" class="${b.trig.k===k?'on':''}" onclick="auvSetTrig('${k}')"><span class="auv-dot"></span><span class="auv-col"><span>${l}</span><span class="auv-mu">${d}</span></span></button>`).join('')}</div>
    <label class="auv-f"><span>Development</span><select onchange="auvB.dev=this.value"><option>All developments</option>${DEVS.map(d=>`<option ${d.name===AUV_DEV?'selected':''}>${d.name}</option>`).join('')}</select></label>`;
  if(b.sel==='filters') return `<div class="auv-mu">Filters</div><h3>Who gets enrolled</h3><p class="auv-mu">Add conditions on the contact or deal, such as development interest, budget or source. Without filters, everyone who triggers it is enrolled.</p><button class="btn-ghost" onclick="showToast('Filter added: Development interest is ${AUV_DEV}')">+ Add filter</button>`;
  if(b.sel==='stop') return `<div class="auv-mu">Stop rules</div><h3>When a run ends early</h3><p class="auv-mu">Replies, opt-outs and removal by a user always stop a run and can’t be turned off. You can add stage-based stops.</p>`;
  if(b.sel==='settings') return `<div class="auv-mu">Settings</div><h3>Sending</h3><label class="auv-f"><span>Re-entry</span><select><option>Once per contact</option><option>Every time it triggers</option></select></label><label class="auv-f"><span>Sending window</span><select><option>09:00 – 20:00, contact’s time zone</option><option>Any time</option></select></label><label class="auv-f"><span>Sender</span><select><option>Deal owner</option><option>Sales team</option></select></label><p class="auv-mu">A frequency cap holds messages if the contact was messaged by another automation today.</p>`;
  const i=b.steps.findIndex(s=>s.uid===b.sel), s=b.steps[i]; if(!s) return '';
  const head=`<div class="auv-row sp"><div><div class="auv-mu">Step ${i+1} · ${AUV_TYPES[s.type].label}</div><h3>${xesc(s.title)}</h3></div><button class="tq-link danger" onclick="auvRemove(${i})">Remove</button></div>`;
  if(s.type==='email'){
    const body=(s.body||`Hi {First name},\n\nPlaceholder copy for “${s.title.replace(/^Email: /,'')}”. The Bricly team writes the final email with you.`).replace(/\{First name\}/g,'Maria').replace(/\{Deal owner name\}/g,'Karl Zammit');
    return head+`<label class="auv-f"><span>Subject</span><input value="${xesc(s.subject||s.title.replace(/^Email: /,''))}" oninput="auvB.steps[${i}].subject=this.value"></label>
      <label class="auv-f"><span>Type</span><select><option>${/Utility/.test(s.sub)?'Utility':'Marketing'}</option></select></label>
      <div class="auv-mail"><div class="auv-mu">From Karl Zammit, deal owner · preview for Maria Borg</div><b>${xesc(s.subject||s.title.replace(/^Email: /,''))}</b><p>${xesc(body).replace(/\n/g,'<br>')}</p>${s.button?`<span class="auv-mailbtn">${xesc(s.button)}</span>`:''}<div class="auv-mu">Unsubscribe · Lalex Developments</div></div>
      <div class="auv-row"><button class="btn-ghost" onclick="auvB.tested=true;auvRender();showToast('Test sent to you · check your inbox')">${b.tested?'Send another test':'Send a test to me'}</button>${b.tested?'<span class="auv-ok">✓ Test sent</span>':'<span class="auv-errtxt">Required before activating</span>'}</div>`;
  }
  if(s.type==='whatsapp') return head+`<div class="auv-info">Approved utility template. Meta approves the wording; variables fill from the record.</div><div class="auv-wa">${xesc(s.body||'Hi {{1}}, …').replace(/\{\{(\d)\}\}/g,'<b>{{$1}}</b>')}</div><div class="auv-mu">{{1}} First name · {{2}} Development name · {{3}} Deal owner or appointment</div><p class="auv-mu">Contacts without a WhatsApp number skip this step and move on.</p>`;
  if(s.type==='wait') return head+`<label class="auv-f"><span>Wait</span><select onchange="auvB.steps[${i}].title=this.value;auvRender()">${['Wait 1 day','Wait 3 days','Wait 4 days','Wait 1 week',s.title].filter((v,j,a)=>a.indexOf(v)===j).map(v=>`<option ${v===s.title?'selected':''}>${v}</option>`).join('')}</select></label><p class="auv-mu">The next send respects the sending window.</p>`;
  return head+`<label class="auv-f"><span>Title</span><input value="${xesc(s.title)}" oninput="auvB.steps[${i}].title=this.value"></label><label class="auv-f"><span>Details</span><input value="${xesc(s.sub)}" oninput="auvB.steps[${i}].sub=this.value"></label>`;
}
function auvSetTrig(k){const t=AUV_TRIGS.find(x=>x[0]===k);auvB.trig={k,pre:{form:'When someone submits the ',lead:'When a new lead arrives ',tag:'When the tag ',stage:'When a deal moves to ',appt:'When an appointment is ',noact:'When a deal has ',unit:'When a price drops at ',manual:'When I enrol '}[k],em:{form:`${AUV_DEV} enquiry form`,lead:'from any source',tag:'VIP is added',stage:'Appointment Booked',appt:'booked',noact:'no activity for 7 days',unit:AUV_DEV,manual:'a saved filter'}[k],post:''};auvRender();}
function auvAddStep(type,at){
  const d={email:AUV_S('email','Email: New email','Marketing · from deal owner'),whatsapp:AUV_S('whatsapp','WhatsApp: Choose a template','Approved utility template',{body:'Hi {{1}}, …'}),wait:AUV_S('wait','Wait 1 day','Next send respects the sending window'),notify:AUV_S('notify','Notify deal owner','In-app'),task:AUV_S('task','Task for deal owner: Follow up','Due in 1 day'),tag:AUV_S('tag','Add tag','Contact tag'),stage:AUV_S('stage','Move stage to Contacted','Pipeline stage')}[type];
  if(auvB.steps.length>=12){showToast('An automation can have up to 12 steps');return;}
  const s={...d,uid:'s'+Date.now()};auvB.steps.splice(at,0,s);auvB.sel=s.uid;auvB.addAt=null;if(type==='email')auvB.tested=false;auvRender();
}
function auvMove(i,d){const j=i+d;if(j<0||j>=auvB.steps.length)return;[auvB.steps[i],auvB.steps[j]]=[auvB.steps[j],auvB.steps[i]];auvRender();}
function auvRemove(i){auvB.steps.splice(i,1);auvB.sel='trigger';auvRender();}
function auvUpsert(status){
  const b=auvB, base={tpl:b.tpl||'quiet',name:b.name,status,dev:b.dev||AUV_DEV,by:auvMe()};
  if(b.id){Object.assign(AUV.find(x=>x.id===b.id),{name:b.name,status});}
  else{b.id='a'+Date.now();AUV.unshift({...base,id:b.id,inProg:status==='active'?0:'—',done:status==='active'?0:'—',last:status==='active'?'Just now':'Never'});}
}
function auvSave(){if(!auvB.trig.k){showToast('Choose a trigger first');auvB.sel='trigger';auvRender();return;}auvUpsert(auvB.status==='active'?'pending':auvB.status);auvB.saved=true;auvRender();showToast(auvB.status==='active'?'Saved · Changes pending until you activate them':'Draft saved');}
function auvReview(){
  if(!auvB.trig.k){showToast('Choose a trigger first');auvB.sel='trigger';auvRender();return;}
  if(!auvB.steps.length){showToast('Add at least one step');return;}
  if(auvNeedsTest(auvB)){const s=auvB.steps.find(x=>x.type==='email');auvB.sel=s.uid;auvRender();showToast('Send a test to yourself before activating');return;}
  auvModal='review';auvRender();
}
function auvActivate(){
  const n=auvB.steps.filter(s=>AUV_TYPES[s.type].send).length, name=auvB.name;
  auvUpsert('active');auvModal=null;auvView='list';auvB=null;auvTab='all';auvRender();
  showToast(`${name} is active · ${n} message${n===1?'':'s'} approved`);
}
// ---------- Activity / History / Settings (Flow 3) ----------
function auvOpen(id){auvAct=id;auvActTab='activity';auvCtF='All';auvView='activity';auvRender();}
function auvActivityHtml(){
  const a=AUV.find(x=>x.id===auvAct), t=auvTpl(a.tpl), draft=a.status==='draft', edit=auvCanEdit();
  const cts=AUV_CONTACTS.filter(c=>auvCtF==='All'||c[4]===auvCtF), cnt=s=>AUV_CONTACTS.filter(c=>c[4]===s).length;
  let body='';
  if(auvActTab==='activity') body=draft?`<div class="tq-empty big"><b>Not running yet</b><span>Activity shows here once you activate it.</span>${edit?`<button class="btn-primary" onclick="auvEdit('${a.id}')">Open in the builder</button>`:''}</div>`:`
    <div class="auv-kpis">${[['In progress',a.inProg,''],['Completed · 30 days',a.done,''],['Stopped early','9','Mostly replies'],['Messages sent','431','Email and WhatsApp'],['Email opens · clicks','68% · 31%','226 emails'],['Failures','1','Bounced after 3 retries']].map(([l,v,s])=>`<div class="dcard"><span class="auv-mu">${l}</span><b>${v}</b>${s?`<span class="auv-mu">${s}</span>`:''}</div>`).join('')}</div>
    <div class="auv-two"><div class="dcard"><h3>Stopped early · top reasons</h3>${[['Replied',6],['Opted out',2],['Deal reached Reserved',1]].map(([l,n])=>`<div class="st-bar"><span>${l}</span><span class="st-bar-t"><span style="width:${n/6*100}%"></span></span><span class="r">${n}</span></div>`).join('')}</div>
      <div class="dcard"><h3>By step · last 30 days</h3>${t.steps.filter(s=>s.type!=='wait').map((s,i)=>`<div class="auv-row sp auv-bystep"><span>${i+1} · ${xesc(s.title.replace(': ',' · '))}</span><span class="auv-mu">${[`226 sent · 1 failed`,`205 sent · 14 skipped, no WhatsApp`,`212 created · 188 done on time`][i]||'—'}</span></div>`).join('')}</div></div>
    <p class="auv-mu">Version 3 activated by Rachel Mifsud on 30 Sep, 10:46. These messages send without a further approval.</p>
    <h3 class="auv-h">Contacts in this automation</h3>
    <div class="auv-filters">${['All','In progress','Waiting','Held','Completed','Stopped','Skipped','Failed'].map(s=>`<button type="button" class="${auvCtF===s?'on':''}" onclick="auvCtF='${s}';auvRender()">${s} ${s==='All'?AUV_CONTACTS.length:cnt(s)}</button>`).join('')}</div>
    <div class="auv-table ct"><div class="auv-tr th"><span>Contact</span><span>Deal</span><span>Current step</span><span>Next action</span><span>Status</span><span></span></div>
      ${cts.map(c=>`<div class="auv-tr"><span class="st-av-row"><span class="tq-av">${initials(c[0])}</span>${xesc(c[0])}</span><span>${AUV_DEV} · ${c[1]}</span><span>${xesc(c[2])}</span><span>${xesc(c[3])}</span><span class="auv-col"><span class="auv-chip t-${AUV_ENR[c[4]]}">${c[4]}</span>${c[5]?`<span class="auv-mu">${xesc(c[5])}</span>`:''}</span><span class="auv-row">${['In progress','Held','Waiting'].includes(c[4])&&edit?`<button class="tq-link danger" onclick="showToast('${xesc(c[0])} removed from this automation')">Remove</button>`:''}</span></div>`).join('')||'<div class="tq-empty">No contacts with this status.</div>'}</div>`;
  if(auvActTab==='history') body=`<div class="auv-table hi"><div class="auv-tr th"><span>When</span><span>Event</span><span>Detail</span><span>By</span></div>${AUV_HIST.map(h=>`<div class="auv-tr"><span>${h[0]}</span><span>${auvChip(h[4]).replace(/>[^<]+</,`>${h[1]}<`)}</span><span>${xesc(h[2])}</span><span>${xesc(h[3])}</span></div>`).join('')}</div>`;
  if(auvActTab==='settings') body=`<div class="dcard auv-set">${[['Trigger',auvTrigText(a)],['Development',a.dev],['Re-entry','Once per contact'],['Sending window','09:00 – 20:00, contact’s time zone'],['Sender','Deal owner'],['Frequency cap','One automated message per contact per day'],['Stop rules','Replies, opts out, removed by a user, deal reaches Reserved, Won or Lost'],['Created by',a.by]].map(([k,v])=>`<div class="chd-kv"><span class="auv-mu">${k}</span><span>${xesc(v)}</span></div>`).join('')}</div>`;
  const desc=`${auvTrigText(a)}, ${t.steps.map(s=>s.title.replace(/^(Email|WhatsApp|Task for deal owner): /,'').toLowerCase()).join(', ')}.`;
  return `<button type="button" class="st-back" onclick="auvView='list';auvRender()">‹ Automations</button>
    <div class="crm-page-heading auv-ah"><div><div class="page-title">${xesc(a.name)} ${auvChip(a.status)}</div><div class="page-sub">${xesc(desc)}</div></div>
      <div class="auv-row">${a.status==='draft'?'':`<button type="button" class="st-toggle ${a.status!=='paused'?'on':''}" role="switch" aria-checked="${a.status!=='paused'}" aria-label="On" ${edit?'':'disabled'} onclick="auvToggle('${a.id}')"><span></span></button><span>${a.status==='paused'?'Off':'On'}</span>`}${edit?`<button class="btn-ghost" onclick="auvEdit('${a.id}')">Edit</button>`:''}</div></div>
    <div class="crm-page-controls"><div class="tabs">${[['activity','Activity'],['history','History'],['settings','Settings']].map(([k,l])=>`<button type="button" class="tab ${auvActTab===k?'on':''}" onclick="auvActTab='${k}';auvRender()">${l}</button>`).join('')}</div></div>${body}`;
}
// ---------- Modals ----------
function auvModalHtml(){
  if(!auvModal) return '';
  let title='',sub='',body='',foot='';
  if(auvModal==='picker'){title='New automation';sub='Start from a template and change anything before you activate. Every template opens as a draft.';
    body=`<div class="auv-tpls">${AUV_TPL.map(t=>`<button type="button" class="auv-tpl" onclick="auvBuild('${t.id}')"><b>${t.name}</b><span class="auv-mu">${xesc(t.trig.pre+t.trig.em+(t.trig.post||''))}</span><span class="auv-tags"><span>${t.steps.length} step${t.steps.length===1?'':'s'}</span>${t.channels.map(c=>`<span>${c}</span>`).join('')}</span></button>`).join('')}<button type="button" class="auv-tpl blank" onclick="auvBlank()"><b>Start from blank</b><span class="auv-mu">Choose a trigger and add your own steps.</span></button></div>`;}
  if(auvModal==='review'){const msgs=auvB.steps.filter(s=>AUV_TYPES[s.type].send);title=`Activate ${auvB.name}?`;sub='Activating approves these messages. They send without a further approval until someone edits them.';
    body=`<div class="auv-review">${msgs.map((s,i)=>`<div class="auv-row"><span class="auv-ic sm">${AUV_TYPES[s.type].ic}</span><span class="auv-col"><span>${xesc(s.title)}</span><span class="auv-mu">${xesc(s.sub)}</span></span></div>`).join('')}</div><p class="auv-mu">${xesc(auvSummary(auvB))}</p><p class="auv-mu">Content is recorded with your name and the time, as version ${auvB.id?2:1}.</p>`;
    foot=`<button class="btn-ghost" onclick="auvModal=null;auvRender()">Back to editing</button><button class="btn-primary" onclick="auvActivate()">Activate and approve ${msgs.length} message${msgs.length===1?'':'s'}</button>`;}
  if(auvModal.startsWith('resume:')){const a=AUV.find(x=>x.id===auvModal.slice(7));title=`Resume ${a.name}?`;sub=`${a.inProg} contacts are waiting. Messages that came due while it was paused send in the next sending window; none are sent twice.`;
    foot=`<button class="btn-ghost" onclick="auvModal=null;auvRender()">Cancel</button><button class="btn-primary" onclick="auvResume('${a.id}')">Resume</button>`;}
  if(auvModal.startsWith('delete:')){const a=AUV.find(x=>x.id===auvModal.slice(7));title=`Delete ${a.name}?`;sub=a.status==='draft'?'The draft is removed.':`${a.inProg} contacts in progress stop now. History and recorded content are kept for audit.`;
    foot=`<button class="btn-ghost" onclick="auvModal=null;auvRender()">Cancel</button><button class="btn-danger" onclick="auvDelete('${a.id}')">Delete</button>`;}
  return `<div class="st-scrim" onclick="auvModal=null;auvRender()"></div><div class="st-dlg auv-dlg ${auvModal==='picker'?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="auv-dlg-t"><div class="st-dlg-h"><h2 id="auv-dlg-t">${xesc(title)}</h2><button type="button" class="st-x" aria-label="Close" onclick="auvModal=null;auvRender()">×</button></div><div class="auv-mu" style="margin-bottom:12px">${xesc(sub)}</div>${body}${foot?`<div class="st-dlg-f">${foot}</div>`:''}</div>`;
}
function auvResume(id){const a=AUV.find(x=>x.id===id);a.status='active';auvModal=null;auvRender();showToast(`${a.name} resumed`);}
function auvDelete(id){const a=AUV.find(x=>x.id===id);AUV=AUV.filter(x=>x.id!==id);auvModal=null;if(auvAct===id)auvView='list';auvRender();showToast(`${a.name} deleted`);}
// ---------- Render ----------
auRender=function(){
  const root=document.getElementById('au-root'); if(!root) return;
  if(auvView==='activity'&&!AUV.find(x=>x.id===auvAct)) auvView='list';
  root.innerHTML=(auvView==='activity'?auvActivityHtml():auvList())+(auvView==='builder'&&auvB?auvBuilderHtml():'')+auvModalHtml();
};
function auvRender(){auRender();}
document.addEventListener('click',e=>{const r=e.target.closest('#au-root [data-auv-row]');if(r&&!e.target.closest('button,.auv-rowmenu'))auvOpen(r.dataset.auvRow);});
