// Lead intake · ad platform integrations. Meta Lead Ads and Google Ads lead forms share one model:
// connect once per account → assign a platform form to a development → map questions → test → live.
const LI_PF={
  meta:{name:'Facebook & Instagram lead ads',short:'Meta',ic:'f',cls:'meta',channel:'Meta Lead Form',method:'Meta lead form',form:'Instant Form',art:'an',days:90,
    test:'Open Meta’s Lead Ads Testing Tool, choose the Page and this form, then press “Create lead”.',testUrl:'developers.facebook.com/tools/lead-ads-testing'},
  google:{name:'Google Ads lead forms',short:'Google',ic:'G',cls:'goog',channel:'Google Ads',method:'Google lead form',form:'lead form',art:'a',days:30,
    test:'In Google Ads, open the lead form asset → Lead delivery → press “Send test data”.',testUrl:'ads.google.com'},
};
function liAcct(pf){return LI.acct[pf];}
function liAutoMap(label){
  const l=label.toLowerCase();
  if(/full.?name/.test(l))return 'Full name';if(/first.?name/.test(l))return 'First name';if(/last.?name|surname/.test(l))return 'Last name';
  if(/phone/.test(l))return 'Phone';if(/e-?mail/.test(l))return 'Email';
  if(/buying for|investment or own|own use/.test(l))return 'Buyer type';if(/budget|price/.test(l))return 'Budget';
  if(/when|timeline|timeframe/.test(l))return 'Timeline';if(/looking for|property type|bedroom|type of property/.test(l))return 'Property interest';
  if(/pay|finance|mortgage/.test(l))return 'Finance';if(/contact you|reach you/.test(l))return 'Preferred channel';if(/city|country|based/.test(l))return 'Nationality';
  return '';
}
function liCatalog(pf){
  const A=liAcct(pf);if(A.forms)return A.forms;
  const std=pf==='meta'?['Full name','Phone number','Email']:['Full name','Email','Phone number'];
  A.forms=DEVS.slice(0,6).map((d,i)=>({id:`${pf}_${d.id}`,name:pf==='meta'?`${d.name} · Spring launch`:`${d.name} · Lead form`,
    where:pf==='meta'?LI_META_PAGES[i%2===0?0:Math.min(2,i)].name:`Search · ${d.name}`,created:['12 Sep','3 Sep','28 Aug','19 Aug','2 Aug','21 Jul'][i],
    qs:[...std,pf==='meta'?'What are you buying for?':'Which type of property are you interested in?','What is your budget?','When are you looking to buy?'].map(l=>({label:l,opts:[]})),
    backlog:2+i%3,devId:null,status:'unassigned',map:{},leads:0,last:'',suggest:d.id}));
  if(pf==='meta'){
    A.forms.push({id:'meta_inv',name:'Investor carousel',where:LI_META_PAGES[0].name,created:'30 Aug',qs:['Full name','Phone number','Email','Investment or own use?','Rough budget','Do you need parking?'].map(l=>({label:l,opts:[]})),backlog:4,devId:null,status:'unassigned',map:{},leads:0,last:'',suggest:null});
    A.forms.push({id:'meta_rsvp',name:'Open day RSVP',where:LI_META_PAGES[0].name,created:'14 Aug',qs:['Full name','City','Will you attend the open day?'].map(l=>({label:l,opts:[]})),backlog:6,devId:null,status:'unassigned',map:{},leads:0,last:'',suggest:null});
  }else A.forms.push({id:'google_brand',name:'Grech brand · Lead form',where:'Performance Max · Grech brand',created:'1 Sep',qs:['Full name','Email','Phone number','Which development are you interested in?'].map(l=>({label:l,opts:[]})),backlog:3,devId:null,status:'unassigned',map:{},leads:0,last:'',suggest:null});
  return A.forms;
}
function liCanContact(f){return Object.values(f.map).some(v=>v==='Phone'||v==='Email');}

// ---- Development view for one platform ----
function liAdHtml(pf){
  const P=LI_PF[pf], A=liAcct(pf), d=liDev(), back=`<div class="li-crumb">${liBtn('← Lead capture','view','home','link')}</div>`;
  if(!A.connected){
    const steps=pf==='meta'?['Connect your Facebook account and choose the Pages that run your ads','Pick an existing Instant Form for this development, or let Bricly create one','Questions are matched to Bricly fields automatically','Send a test lead, then go live. New leads arrive in seconds']
      :['Connect the Google account that manages your Google Ads','Pick an existing lead form, or let Bricly create one on your campaign','Bricly installs its webhook on the form for you, no keys to copy','Send test data, then go live. New leads arrive in seconds'];
    return `${back}${liHeader(P.name,`Leads from ${pf==='meta'?'Facebook and Instagram Instant Forms':'Google Search, YouTube and Performance Max lead forms'} go straight into ${liEsc(d.name)}, tagged with the campaign, ad set and ad.`)}
    <div class="li-hero ${P.cls}"><div class="li-col" style="flex:1;gap:12px"><b>Connect once for the whole account</b>
      ${steps.map((s,i)=>`<div class="li-step"><span class="li-n">${i+1}</span><span>${s}</span></div>`).join('')}
      <div class="li-row">${liBtn(pf==='meta'?'Continue with Facebook':'Continue with Google','connect',pf,'primary '+P.cls)}<span class="li-mu">Takes about 2 minutes. You need admin access to the ${pf==='meta'?'Facebook Page':'Google Ads account'}.</span></div></div>
      <div class="li-flow">${[P.short+' ad','Buyer fills the form','Bricly · '+liEsc(d.name),'Assigned rep notified'].map((s,i)=>`<span class="li-flow-s">${s}</span>${i<3?'<span class="li-mu">↓</span>':''}`).join('')}</div></div>
    ${pf==='google'?liGoogleManual():''}`;
  }
  const all=liCatalog(pf).filter(f=>pf!=='meta'||A.pages.includes(f.where)||f.devId), mine=all.filter(f=>f.devId===d.id), other=all.filter(f=>f.devId!==d.id);
  const row=f=>{
    const other_=f.devId&&f.devId!==d.id?liDevById(f.devId).name:'', st={live:['Live','ok'],mapping:['Needs mapping','warn'],paused:['Paused','neu'],unassigned:['Not assigned','neu']}[f.status]||['—','neu'];
    return `<div class="li-q-row"><span class="li-src-ic ${P.cls}">${P.ic}</span><span class="li-col" style="flex:1"><b>${liEsc(f.name)}</b><span class="li-mu">${liEsc(f.where)} · created ${liEsc(f.created)}${f.devId===d.id?` · ${f.leads} leads${f.last?' · last '+liEsc(f.last):''}`:''}</span></span>
      ${f.devId===d.id?liChip(st[0],st[1])+liBtn('Questions','ad-assign',pf+'|'+f.id+'|map','link')+liBtn('Send test lead','ad-assign',pf+'|'+f.id+'|test','link')+liBtn(f.status==='paused'?'Resume':'Pause','ad-pause',pf+'|'+f.id,'link')+liBtn('Unassign','ad-unassign',pf+'|'+f.id,'link')
        :other_?`<span class="li-mu">Assigned to ${liEsc(other_)}</span>`:`${f.suggest===d.id?liChip('Looks like '+d.name,'info'):''}${liBtn('Assign to '+liEsc(d.name),'ad-assign',pf+'|'+f.id+'|confirm',f.suggest===d.id?'primary':'ghost')}`}</div>`;
  };
  return `${back}${liHeader(P.name,`Connected${pf==='meta'?` as ${liEsc(A.business)} · ${A.pages.length} Page${A.pages.length===1?'':'s'}`:` · Google Ads ${liEsc(A.account.name)} (${liEsc(A.account.id)})`}`,liBtn('Manage connection','ad-manage',pf))}
  <div class="li-sec-h"><b>Forms feeding ${liEsc(d.name)}</b></div>
  ${mine.length?`<div class="li-card flush">${mine.map(row).join('')}</div>`:`<div class="li-empty"><b>No ${P.form}s assigned yet</b><span class="li-mu">Pick one below, or let Bricly create a ready-mapped one.</span></div>`}
  <div class="li-hero sm ${P.cls}"><div class="li-col" style="flex:1"><b>Create ${P.art} ${P.form} for ${liEsc(d.name)}</b><span class="li-mu">Bricly builds it ${pf==='meta'?'on your Facebook Page':'on your Google Ads campaign'} with the same questions as your registration form, already mapped and live. You then pick it when you set up the ad.</span></div>${liBtn('Create it for me','ad-create',pf,'primary')}</div>
  <div class="li-sec-h"><b>Other ${P.form}s in your account</b><span class="li-mu">${other.length} found</span></div>
  <div class="li-card flush">${other.map(row).join('')}</div>
  ${pf==='google'?liGoogleManual():''}`;
}
function liGoogleManual(){
  const st=liState(), M=st.google.manual;
  return `<details class="li-card li-manual"><summary><b>Can’t connect the account? Set up a form by hand</b><span class="li-mu">For agencies running ads in an account you can’t sign in to.</span></summary>
    <ol class="li-ol"><li>In Google Ads, open the lead form asset → <b>Lead delivery option</b> → Webhook.</li><li>Paste this address and key.</li><li>Press <b>Send test data</b>. It appears in the leads log as a test.</li></ol>
    <div class="li-codebox"><span class="li-mu">Webhook URL</span><span class="li-mono">${liEsc(M.url)}</span>${liBtn('Copy','copy',M.url)}</div>
    <div class="li-codebox"><span class="li-mu">Key</span><span class="li-mono">${liEsc(M.key)}</span>${liBtn('Copy','copy',M.key)}${liBtn('Regenerate','toast','New key created. Paste it into Google Ads within the hour; leads with the old key are logged as Failed.','link')}</div></details>`;
}

// ---- Connect wizards ----
function liConnectOpen(pf){LI.ui.modal={kind:'connect',pf,step:'intro',biz:'Grech Developments',pages:{pg1:true,pg2:true,pg3:true},acct:LI_GOOGLE_ACCTS[0].id,checks:null};}
function liConnectHtml(){
  const m=LI.ui.modal, P=LI_PF[m.pf], meta=m.pf==='meta';let b='',f='';
  if(m.step==='intro'){
    b=`<div class="li-callout"><b>Before you start</b><span>${meta?'Log in with a Facebook account that is an admin of the Page your ads run from.':'Sign in with a Google account that has Standard or Admin access to the Google Ads account.'}</span></div>
    <div class="li-sub-h">Bricly will be able to</div><ul class="li-ul">${(meta?['Receive leads from Instant Forms on the Pages you choose','Create Instant Forms on those Pages when you ask it to','Read campaign, ad set and ad names so each lead shows where it came from']:['See your lead form assets and campaign names','Add Bricly’s webhook to lead forms you assign, so leads are delivered instantly','Create lead forms on a campaign when you ask it to']).map(x=>`<li>${x}</li>`).join('')}</ul>
    <div class="li-sub-h">Bricly will never</div><ul class="li-ul"><li>Post, change budgets, or edit or pause your ads</li></ul>`;
    f=liBtn('Cancel','close')+liBtn(meta?'Continue with Facebook':'Continue with Google','cn-next','oauth','primary '+P.cls);
  }else if(m.step==='oauth'){
    b=meta?`<div class="li-oauth meta"><div class="li-oauth-h">facebook</div><div class="li-oauth-b"><b>Bricly is requesting access</b><span class="li-mu">Logged in as ${liEsc(LI.acct.meta.user)}</span>
      <div class="li-sub-h">Business</div>${['Grech Developments','Grech Holdings (personal)'].map(x=>`<button type="button" class="li-radio ${m.biz===x?'on':''}" data-li="cn-set" data-arg="biz|${x}"><span class="li-dot"></span><b>${x}</b></button>`).join('')}
      <div class="li-sub-h">Pages</div>${LI_META_PAGES.map(p=>`<label class="li-ck"><input type="checkbox" data-li-cn="${p.id}" ${m.pages[p.id]?'checked':''}> <b>${p.name}</b> <span class="li-mu">${p.fans}</span></label>`).join('')}
      <div class="li-mu">Permissions: leads_retrieval, pages_manage_metadata, pages_show_list, pages_read_engagement, ads_read, business_management</div></div></div>`
    :`<div class="li-oauth goog"><div class="li-oauth-h">Google</div><div class="li-oauth-b"><b>Sign in to continue to Bricly</b>
      <button type="button" class="li-radio on"><span class="li-dot"></span><span class="li-col"><b>Mark Grech</b><span class="li-mu">${liEsc(LI.acct.google.user)}</span></span></button>
      <div class="li-sub-h">Bricly wants to</div><ul class="li-ul"><li>See, edit and create your Google Ads lead form assets</li></ul>
      <div class="li-sub-h">Google Ads account</div>${LI_GOOGLE_ACCTS.map(a=>`<button type="button" class="li-radio ${m.acct===a.id?'on':''}" data-li="cn-set" data-arg="acct|${a.id}"><span class="li-dot"></span><span class="li-col"><b>${a.name}</b><span class="li-mu">${a.id}</span></span></button>`).join('')}</div></div>`;
    f=liBtn('Back','cn-next','intro')+liBtn(meta?'Save and continue':'Allow','cn-next','checks','primary '+P.cls);
  }else if(m.step==='checks'){
    if(meta){
      const pages=LI_META_PAGES.filter(p=>m.pages[p.id]);
      b=`<div class="li-mu">Checking each Page can deliver leads to Bricly.</div>${pages.map(p=>{const ok=m.checks[p.id];return `<div class="li-card"><b>${p.name}</b>
        <div class="li-chk ok">✓ Page access</div><div class="li-chk ${ok?'ok':'warn'}">${ok?'✓':'!'} Leads access for Bricly</div><div class="li-chk ${ok?'ok':'neu'}">${ok?'✓ Subscribed to new leads':'· Subscribe to new leads (waiting)'}</div>
        ${ok?'':`<div class="li-callout warn"><b>One setting to change on Facebook</b><span>Meta Business Suite → Settings → Integrations → <b>Leads access</b> → ${p.name} → CRMs → add <b>Bricly</b>. Usually already allowed; some Pages restrict it.</span>${liBtn('Check again','cn-recheck',p.id)}</div>`}</div>`;}).join('')}`;
      f=liBtn('Finish','cn-done','','primary',pages.every(p=>m.checks[p.id])?'':'disabled title="Fix the Page above first, or untick it"')+liBtn('Skip that Page','cn-skip');
    }else{
      b=`<div class="li-card"><b>${liEsc(LI_GOOGLE_ACCTS.find(a=>a.id===m.acct).name)}</b><div class="li-chk ok">✓ Account access</div><div class="li-chk ok">✓ Can read lead form assets (${liCatalog('google').length} found)</div><div class="li-chk ok">✓ Can install webhooks on lead forms</div></div>`;
      f=liBtn('Finish','cn-done','','primary');
    }
  }else{
    b=`<div class="li-callout ok"><b>${P.short} is connected</b><span>${meta?`${LI.acct.meta.pages.length} Page${LI.acct.meta.pages.length===1?'':'s'} connected for ${liEsc(LI.acct.meta.business)}.`:`Google Ads account ${liEsc(LI.acct.google.account.name)} connected.`} Next, assign a form to each development. Forms already named after a development are suggested.</span></div>`;
    f=liBtn(LI.ui.view===m.pf||document.getElementById('li-host')?'Assign forms':'Done','cn-finish',m.pf,'primary');
  }
  return liModalShell(meta?'Connect Facebook & Instagram lead ads':'Connect Google Ads lead forms',`Step ${['intro','oauth','checks','done'].indexOf(m.step)+1} of 4`,b,f);
}
function liConnectStep(step){
  const m=LI.ui.modal;
  if(step==='checks'&&m.pf==='meta'){if(!Object.values(m.pages).some(Boolean)){showToast('Choose at least one Page');return;}m.checks={pg1:true,pg2:true,pg3:false};}
  m.step=step;liModalRender();
}
function liConnectDone(){
  const m=LI.ui.modal, A=liAcct(m.pf);
  if(m.pf==='meta'){A.pages=LI_META_PAGES.filter(p=>m.pages[p.id]).map(p=>p.name);A.business=m.biz;}
  else A.account=LI_GOOGLE_ACCTS.find(a=>a.id===m.acct);
  A.connected=true;liCatalog(m.pf).forEach(f=>{if(f.status==='paused'&&f.devId)f.status='live';});
  m.step='done';liModalRender();liRender();if(typeof stRender==='function'&&document.getElementById('st-root'))try{stRender();}catch(e){}
}

// ---- Assign → map → test → live ----
function liAssignOpen(pf,id,step){
  const f=liCatalog(pf).find(x=>x.id===id);
  if(!Object.keys(f.map).length)f.qs.forEach(q=>f.map[q.label]=liAutoMap(q.label)||(/\?$/.test(q.label)?'Custom answer':''));
  LI.ui.modal={kind:'assign',pf,id,step,backfill:true,listen:'',entry:null};
}
function liAssignHtml(){
  const m=LI.ui.modal, P=LI_PF[m.pf], f=liCatalog(m.pf).find(x=>x.id===m.id), d=liDev();
  const steps=['confirm','map','test'], ix=steps.indexOf(m.step);let b='',ft='';
  if(m.step==='confirm'){
    b=`<div class="li-card li-row"><span class="li-src-ic lg ${P.cls}">${P.ic}</span><span class="li-col" style="flex:1"><b>${liEsc(f.name)}</b><span class="li-mu">${liEsc(f.where)} · ${f.qs.length} questions</span></span></div>
    <div class="li-mu">New leads from this ${P.form} become <b>${liEsc(d.name)}</b> leads, tagged ${liEsc(P.channel)} with the campaign, ${m.pf==='meta'?'ad set and ad':'ad group and keyword'} they came from.</div>
    ${m.pf==='google'?`<div class="li-callout ok"><b>No keys to copy</b><span>Bricly adds its webhook to this lead form in Google Ads for you.</span></div>`:''}
    <label class="li-ck"><input type="checkbox" data-li-as="backfill" ${m.backfill?'checked':''}> Also bring in the <b>${f.backlog} leads</b> this form collected in the last ${P.days} days</label>`;
    ft=liBtn('Cancel','close')+liBtn('Continue','as-step','map','primary');
  }else if(m.step==='map'){
    const ok=liCanContact(f), unm=f.qs.filter(q=>!f.map[q.label]).length;
    b=`<div class="li-mu">Each question on the ${P.form} saves to a field in Bricly. We matched what we could.</div>
    <div class="li-tbl"><div class="li-tr th map"><span>${P.short} question</span><span></span><span>Saves to</span><span></span></div>
    ${f.qs.map((q,i)=>{const v=f.map[q.label]||'';return `<div class="li-tr map"><span>${liEsc(q.label)}</span><span class="li-mu">→</span><select data-li-map="${i}" aria-label="Field for ${liEsc(q.label)}"><option value="" ${v?'':'selected'}>Choose a field…</option>${LI_FIELDS.map(k=>`<option ${v===k?'selected':''}>${k}</option>`).join('')}</select>${v?liChip(v==='Custom answer'?'Kept as text':'Matched',v==='Custom answer'?'neu':'ok'):liChip('Choose','warn')}</div>`;}).join('')}</div>
    ${ok?'':`<div class="li-callout warn"><b>This form can’t go live yet</b><span>It collects neither a phone number nor an email, so nobody could follow up. ${m.pf==='meta'?'In Meta Ads Manager, duplicate the form and add “Phone number” or “Email” under Contact fields, then assign the new one.':'Add Phone number or Email to the lead form in Google Ads.'}</span></div>`}
    ${unm&&ok?`<div class="li-callout warn"><b>${unm} question${unm>1?'s':''} still need${unm>1?'':'s'} a field</b><span>Pick one, or choose “Custom answer” to keep the answer as text on the lead.</span></div>`:''}`;
    ft=liBtn('Back','as-step','confirm')+liBtn('Save for later','as-save')+liBtn('Continue to test','as-step','test','primary',ok&&!unm?'':'disabled');
  }else{
    const e=m.entry;
    b=`<div class="li-callout"><b>Send a test lead</b><span>${P.test}</span>${liBtn('Open '+P.testUrl+' ↗','toast','Opens '+P.testUrl+' in a new tab','link')}</div>
    ${m.listen==='on'?`<div class="li-card li-row"><span class="li-spin"></span><span><b>Listening for a test lead…</b> <span class="li-mu">Keep this open. Times out after 10 minutes.</span></span></div>`:''}
    ${e?`<div class="li-card">${[['Received from '+P.short,1],['Questions mapped',1],['Development set: '+d.name,1],['Source: '+P.channel+' · '+f.name,1],['Assigned to '+e.rep,1]].map(([t])=>`<div class="li-chk ok">✓ ${liEsc(t)}</div>`).join('')}
      <div class="li-row" style="margin-top:8px">${liBtn('Open the test opportunity','opp',e.oppId,'link')}</div></div>`:''}`;
    ft=liBtn('Back','as-step','map')+(e?liBtn('Go live','as-live','','primary'):liBtn(m.listen==='on'?'Listening…':'Listen for a test lead','as-listen','','primary',m.listen==='on'?'disabled':''))+(e?'':liBtn('Skip test and go live','as-live','','link'));
  }
  return liModalShell(`${m.step==='confirm'?'Assign':m.step==='map'?'Match the questions':'Test'} · ${liEsc(f.name)}`,`${P.name} → ${liEsc(d.name)} · step ${ix+1} of 3`,b,ft);
}
function liSampleAnswers(f){
  return f.qs.filter(q=>!['Full name','First name','Last name','Phone','Email'].includes(f.map[q.label])&&f.map[q.label]&&f.map[q.label]!=='Don’t import').map((q,i)=>({q:q.label,a:f.map[q.label]==='Budget'?'€300k to €350k':f.map[q.label]==='Buyer type'?'An investment':f.map[q.label]==='Timeline'?'Within 3 months':f.map[q.label]==='Property interest'?'2 bedrooms':['Yes','Morning','No'][i%3],maps:f.map[q.label]}));
}
function liAdLead(pf,f,i,test){
  const P=LI_PF[pf], s=liSample(i), d=liDevById(f.devId);
  const camp=pf==='meta'?f.name.split(' · ').pop():f.where;
  const e=liCapture({devId:d.id,channel:P.channel,method:P.method,form:f.name,formId:f.id,campaign:camp,adset:pf==='meta'?'Malta 25–55 · new homes':'New homes · exact',ad:pf==='meta'?'carousel-a':'',
    utm:{source:pf==='meta'?'meta':'google',medium:'paid',campaign:camp.toLowerCase().replace(/[^a-z0-9]+/g,'-')},...s,answers:liSampleAnswers(f),optin:i%2===0,test,
    raw:pf==='meta'?{leadgen_id:String(88210000+i),form_id:f.id}:{lead_id:'TeSter-'+i,form_id:f.id,is_test:!!test}});
  if(!test){f.leads++;f.last='just now';}
  return e;
}
function liAssignListen(){
  const m=LI.ui.modal, f=liCatalog(m.pf).find(x=>x.id===m.id);
  if(!f.devId){f.devId=liDev().id;f.status='mapping';}
  m.listen='on';liModalRender();
  setTimeout(()=>{if(LI.ui.modal!==m)return;m.entry=liAdLead(m.pf,f,LI.seq,true);m.listen='done';liModalRender();liRender();},1600);
}
function liAssignLive(){
  const m=LI.ui.modal, f=liCatalog(m.pf).find(x=>x.id===m.id);
  f.devId=liDev().id;f.status='live';
  let n=0;if(m.backfill&&!f.backfilled){for(let i=0;i<f.backlog;i++){liAdLead(m.pf,f,i+3,false);n++;}f.backfilled=true;}
  liModalClose();liRender();showToast(`${f.name} is live${n?` · ${n} past leads imported`:''}`);
}

// ---- Create the platform form for me ----
function liCreateOpen(pf){
  const d=liDev(), reg=liState(d).forms[0];
  LI.ui.modal={kind:'create',pf,step:'edit',where:pf==='meta'?LI.acct.meta.pages[0]:`Search · ${d.name}`,name:pf==='meta'?`${d.name} · Register interest`:`Register for ${d.name}`.slice(0,30),
    type:'intent',qsel:Object.fromEntries(reg.qs.map(q=>[q.id,/choice|multi/.test(q.type)])),desc:`Live prices and availability for ${d.name}.`};
}
function liCreateHtml(){
  const m=LI.ui.modal, P=LI_PF[m.pf], d=liDev(), st=liState(d), reg=st.forms[0], meta=m.pf==='meta';
  if(m.step==='creating')return liModalShell(`Creating on ${P.short}…`,'',`<div class="li-card li-row"><span class="li-spin"></span><span>Building the ${P.form}, adding the privacy notice and subscribing Bricly to its leads…</span></div>`,'');
  if(m.step==='done')return liModalShell(`${liEsc(m.name)} is ready`,`${P.name} · ${liEsc(d.name)}`,
    `<div class="li-callout ok"><b>Created, assigned to ${liEsc(d.name)} and live</b><span>Questions are already mapped. ${meta?'In Ads Manager, create a campaign with the Leads objective and choose this Instant Form in the ad.':'It’s attached to the campaign. Leads arrive here as soon as the ad serves.'}</span></div>
     <ol class="li-ol">${(meta?['Ads Manager → Create → Leads objective','Conversion location: Instant forms','Ad level: choose “'+m.name+'”','Publish. Leads appear in Bricly within seconds']:['The lead form is attached to '+m.where,'Bricly’s webhook is installed on it','Leads appear in Bricly within seconds of submit']).map(s=>`<li>${liEsc(s)}</li>`).join('')}</ol>`,
    liBtn('Send a test lead','ad-assign',m.pf+'|'+m.newId+'|test')+liBtn('Done','close','','primary'));
  const opts=meta?LI.acct.meta.pages:[`Search · ${d.name}`,'Performance Max · Grech brand','YouTube · launch film'];
  return liModalShell(`Create ${P.art} ${P.form} for ${liEsc(d.name)}`,`${P.name} · created ${meta?'on your Page':'in your Google Ads account'}`,
    `<div class="li-f2"><label class="li-f"><span>${meta?'Facebook Page':'Campaign'}</span><select data-li-m="where">${opts.map(o=>`<option ${m.where===o?'selected':''}>${liEsc(o)}</option>`).join('')}</select></label>
      <label class="li-f"><span>${meta?'Form name':'Headline'} ${meta?'':'<i class="li-mu">max 30 characters</i>'}</span><input data-li-m="name" value="${liEsc(m.name)}" ${meta?'':'maxlength="30"'}></label></div>
    ${meta?`<div class="li-f"><span>Form type</span>${[['intent','Higher intent','Adds a review screen. Fewer but better leads. Recommended for property.'],['volume','More volume','Quickest to submit.']].map(([k,l,s])=>`<button type="button" class="li-radio ${m.type===k?'on':''}" data-li="cr-type" data-arg="${k}"><span class="li-dot"></span><span class="li-col"><b>${l}</b><span class="li-mu">${s}</span></span></button>`).join('')}</div>`
      :`<label class="li-f"><span>Description</span><input data-li-m="desc" value="${liEsc(m.desc)}" maxlength="200"></label>`}
    <div class="li-sub-h">Contact details · prefilled by ${P.short}</div><div class="li-mu">Full name, Phone number, Email. ${meta?'Facebook':'Google'} fills these from the buyer’s profile.</div>
    <div class="li-sub-h">Questions from your registration form</div>
    ${reg.qs.map(q=>`<label class="li-ck"><input type="checkbox" data-li-cq="${q.id}" ${m.qsel[q.id]?'checked':''} ${/choice|multi/.test(q.type)?'':'disabled'}> <b>${liEsc(q.label)}</b> <span class="li-mu">${/choice|multi/.test(q.type)?liEsc(q.opts.join(' · ')):'Free-text questions aren’t supported here'}</span></label>`).join('')}
    <div class="li-sub-h">Privacy and thank-you</div><div class="li-mu">Privacy notice: ${liEsc(reg.design.privacy)}<br>Thank-you button: “See prices and availability” → ${liEsc(st.host)}/register?utm_source=${meta?'meta':'google'}</div>`,
    liBtn('Cancel','close')+liBtn(meta?'Create on Facebook':'Create in Google Ads','cr-go','','primary '+P.cls));
}
function liCreateGo(){
  const m=LI.ui.modal, d=liDev(), reg=liState(d).forms[0], all=liCatalog(m.pf);
  m.step='creating';liModalRender();
  setTimeout(()=>{
    const qs=[...(m.pf==='meta'?['Full name','Phone number','Email']:['Full name','Email','Phone number']).map(l=>({label:l,opts:[]})),...reg.qs.filter(q=>m.qsel[q.id]).map(q=>({label:q.label,opts:q.opts}))];
    const f={id:`${m.pf}_new_${liId('')}`,name:m.name,where:m.where,created:'today',qs,backlog:0,devId:d.id,status:'live',map:{},leads:0,last:'',suggest:d.id,backfilled:true};
    qs.forEach(q=>{const r=reg.qs.find(x=>x.label===q.label);f.map[q.label]=r?r.maps:liAutoMap(q.label);});
    all.unshift(f);m.newId=f.id;m.step='done';liModalRender();liRender();
  },1400);
}

// ---- Manage connection ----
function liManageHtml(){
  const m=LI.ui.modal, P=LI_PF[m.pf], A=liAcct(m.pf), meta=m.pf==='meta', forms=liCatalog(m.pf).filter(f=>f.devId);
  return liModalShell(`${P.name}`,meta?`Connected as ${liEsc(A.business)} by ${liEsc(A.user)}`:`Connected · ${liEsc(A.account.name)} (${liEsc(A.account.id)})`,
    `${meta?`<div class="li-sub-h">Pages</div>${A.pages.map(p=>`<div class="li-q-row"><b style="flex:1">${liEsc(p)}</b>${liChip('Receiving leads','ok')}</div>`).join('')}`:''}
    <div class="li-sub-h">Health</div><div class="li-chk ok">✓ Access valid${meta?' · Meta asks to re-confirm every 60 days, we remind you 7 days before':''}</div><div class="li-chk ok">✓ Daily check for missed leads · nothing missed in the last 7 days</div>
    <div class="li-sub-h">Assigned forms (${forms.length})</div>${forms.map(f=>`<div class="li-q-row"><span class="li-col" style="flex:1"><b>${liEsc(f.name)}</b><span class="li-mu">${liEsc(liDevById(f.devId).name)}</span></span>${liChip(f.status==='live'?'Live':f.status,f.status==='live'?'ok':'neu')}</div>`).join('')||'<div class="li-mu">None yet.</div>'}`,
    liBtn('Disconnect','ad-disconnect',m.pf)+liBtn(meta?'Add or remove Pages':'Switch account','connect',m.pf)+liBtn('Done','close','','primary'));
}
