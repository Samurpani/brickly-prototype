// Lead intake · views: Sources home, leads log, log detail and the opportunity "Source and answers" card.
const liChip=(t,tone='neu')=>`<span class="li-chip ${tone}">${liEsc(t)}</span>`;
const liBtn=(t,act,arg='',kind='ghost',extra='')=>`<button type="button" class="li-btn ${kind}" data-li="${act}" data-arg="${liEsc(arg)}" ${extra}>${t}</button>`;
const LI_OUT_TONE={Created:'ok',Matched:'info',Held:'warn',Failed:'err',Test:'neu'};
const LI_CH_ICON={'Meta Lead Form':'f','Google Ads':'G','Website':'◎','Instagram':'◉','Facebook':'f','Portal':'P','Agency partner':'A','Hoarding / sign':'▤','Brochure':'▤','Email newsletter':'@','WhatsApp':'W'};
function liSrcChip(ch,sub){return `<span class="li-src"><span class="li-src-ic ${/meta|facebook|instagram/i.test(ch)?'meta':/google/i.test(ch)?'goog':'web'}">${liEsc(LI_CH_ICON[ch]||'•')}</span><span class="li-col"><b>${liEsc(ch)}</b>${sub?`<span class="li-mu">${liEsc(sub)}</span>`:''}</span></span>`;}
function liFormLeads(st,f){return st.log.filter(e=>e.form===f.name&&e.outcome!=='Held').length;}
function liMetaForms(d){return (LI.acct.meta.forms||[]).filter(f=>f.devId===d.id);}
function liGoogleForms(d){return (LI.acct.google.forms||[]).filter(f=>f.devId===d.id);}

function liHeader(title,sub,right=''){
  return `<div class="li-head"><div class="li-col"><div class="li-h1">${title}</div><div class="li-mu">${sub}</div></div><div class="li-row">${right}</div></div>`;
}
function liNav(){
  const v=LI.ui.view, tabs=[['home','Sources'],['log','Leads log'],['links','Tracked links']];
  return `<div class="li-seg" role="tablist">${tabs.map(([k,l])=>`<button type="button" role="tab" aria-selected="${v===k}" class="${v===k?'on':''}" data-li="view" data-arg="${k}">${l}</button>`).join('')}</div>`;
}

function liHomeHtml(){
  const d=liDev(), st=liState(d), reg=st.forms[0], enq=st.forms[1];
  const mf=liMetaForms(d), gf=liGoogleForms(d), real=st.log.filter(e=>!e.test);
  const by={};real.filter(e=>e.outcome!=='Held').forEach(e=>by[e.channel]=(by[e.channel]||0)+1);
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
  const held=st.log.filter(e=>e.outcome==='Held').length;
  const steps=[
    {done:reg.status==='live',t:'Registration form is live',s:'Created automatically with this development',act:liBtn('Edit form','form',reg.id)},
    {done:st.site.domains.length>0,t:'Replace the form on your website',s:'Paste one snippet where the old form was',act:liBtn('Put it on my website','share',reg.id+'|website','primary')},
    {done:mf.some(f=>f.status==='live'),t:'Facebook & Instagram lead ads',s:'Leads from Instant Forms arrive in seconds',act:liBtn(LI.acct.meta.connected?'Assign a form':'Connect Facebook','view','meta',LI.acct.meta.connected?'ghost':'primary')},
    {done:gf.some(f=>f.status==='live'),t:'Google Ads lead forms',s:'Leads from lead form assets arrive in seconds',act:liBtn(LI.acct.google.connected?'Assign a form':'Connect Google Ads','view','google',LI.acct.google.connected?'ghost':'primary')},
  ];
  const nDone=steps.filter(s=>s.done).length;
  const site=st.site.domains.length?`Installed on ${st.site.domains.map(x=>x.d).join(', ')}`:'Not on your website yet';
  const card=(ic,cls,t,status,sub,meta,btns)=>`<div class="li-src-card"><div class="li-row"><span class="li-src-ic lg ${cls}">${ic}</span><div class="li-col" style="flex:1"><b>${t}</b><span class="li-mu">${sub}</span></div>${status}</div><div class="li-src-meta">${meta}</div><div class="li-row">${btns}</div></div>`;
  return `${liHeader('Lead capture',`Every lead for ${liEsc(d.name)} arrives here with where it came from and the answers the buyer gave.`,liBtn('Send a test lead','buyer',reg.id+'|test')+liBtn('Share the form','share',reg.id+'|link','primary'))}
  ${liNav()}
  <div class="li-kpis">
    <div><span class="li-mu">Leads captured</span><b>${real.filter(e=>e.outcome!=='Held').length}</b><span class="li-mu">all sources</span></div>
    <div><span class="li-mu">Top source</span><b>${top?liEsc(top[0]):'—'}</b><span class="li-mu">${top?top[1]+' leads':'No leads yet'}</span></div>
    <div><span class="li-mu">Live sources</span><b>${1+(st.site.domains.length?1:0)+(mf.some(f=>f.status==='live')?1:0)+(gf.some(f=>f.status==='live')?1:0)}</b><span class="li-mu">of 4</span></div>
    <div><span class="li-mu">Held for review</span><b class="${held?'warn':''}">${held}</b><span class="li-mu">${held?'Missing phone or email':'Nothing held'}</span></div>
  </div>
  ${nDone<4?`<div class="li-card"><div class="li-row li-card-h"><b>Get ${liEsc(d.name)} capturing leads</b><span class="li-mu">${nDone} of 4 done</span><div class="li-prog"><span style="width:${nDone*25}%"></span></div></div>
    ${steps.map((s,i)=>`<div class="li-step ${s.done?'done':''}"><span class="li-n">${s.done?'✓':i+1}</span><div class="li-col" style="flex:1"><b>${s.t}</b><span class="li-mu">${s.s}</span></div>${s.done?liChip('Done','ok'):s.act}</div>`).join('')}</div>`:''}
  <div class="li-sec-h"><b>Where leads come from</b><span class="li-mu">Each source adds the development, channel, form and campaign to the lead automatically.</span></div>
  <div class="li-src-grid">
    ${card('B','web','Registration form',liChip(liDirty(reg)?'Unpublished changes':'Live',liDirty(reg)?'warn':'ok'),'Hosted page, QR and website embed',`<span class="li-mono">${liEsc(st.host)}/register</span> · ${liFormLeads(st,reg)} leads`,liBtn('Edit questions','form',reg.id)+liBtn('Share','share',reg.id+'|link')+liBtn('Preview','buyer',reg.id))}
    ${card('◎','web','Your website',liChip(st.site.domains.length?'Installed':'Not installed',st.site.domains.length?'ok':'neu'),'Replaces the form you have today',`${liEsc(site)}${st.site.domains[0]?` · seen ${liEsc(st.site.domains[0].seen)}`:''}`,liBtn(st.site.domains.length?'Manage':'Put it on my website','share',reg.id+'|website',st.site.domains.length?'ghost':'primary'))}
    ${card('f','meta','Facebook & Instagram lead ads',liChip(!LI.acct.meta.connected?'Not connected':mf.length?`${mf.filter(f=>f.status==='live').length} live`:'No form assigned',!LI.acct.meta.connected?'neu':mf.some(f=>f.status==='live')?'ok':'warn'),'Instant Forms on your Facebook Pages',LI.acct.meta.connected?`${mf.length} form${mf.length===1?'':'s'} for ${liEsc(d.name)} · ${liFormCount(mf)} leads`:'Connect once for the whole account',liBtn(LI.acct.meta.connected?'Manage':'Connect Facebook','view','meta','',''))}
    ${card('G','goog','Google Ads lead forms',liChip(!LI.acct.google.connected?'Not connected':gf.length?`${gf.filter(f=>f.status==='live').length} live`:'No form assigned',!LI.acct.google.connected?'neu':gf.some(f=>f.status==='live')?'ok':'warn'),'Lead form assets on Search, YouTube and PMax',LI.acct.google.connected?`${gf.length} form${gf.length===1?'':'s'} for ${liEsc(d.name)} · ${liFormCount(gf)} leads`:'Connect once for the whole account',liBtn(LI.acct.google.connected?'Manage':'Connect Google Ads','view','google'))}
    ${card('?','web','Enquiry form',liChip('Live','ok'),'For “Ask about this home” and appointment requests',`${liFormLeads(st,enq)} enquiries`,liBtn('Edit questions','form',enq.id)+liBtn('Share','share',enq.id+'|link'))}
    ${card('↗','web','Tracked links & QR codes',liChip(st.links.length+' links','neu'),'Signs, brochures, Instagram bio, agents',st.links.length?`${st.links.reduce((a,l)=>a+l.leads,0)} leads through tracked links`:'Know which sign or post brought each lead',liBtn('Create a tracked link','share',reg.id+'|link'))}
  </div>
  <div class="li-sec-h"><b>Latest leads</b>${liBtn('Open the log','view','log','link')}</div>
  ${liLogTable(st.log.slice(0,6))}`;
}
function liFormCount(fs){return fs.reduce((a,f)=>a+(f.leads||0),0);}

function liLogTable(rows){
  if(!rows.length)return `<div class="li-empty"><b>No leads yet</b><span class="li-mu">Send a test lead to see exactly what a buyer’s submission looks like here and in the pipeline.</span></div>`;
  return `<div class="li-tbl"><div class="li-tr th"><span>Received</span><span>Lead</span><span>Source</span><span>Outcome</span><span>Assigned</span><span></span></div>
  ${rows.map(e=>`<div class="li-tr go" data-li="logrow" data-arg="${e.id}"><span class="li-mu">${liEsc(e.t)}</span><span><b>${liEsc(e.name)}</b>${e.test?' '+liChip('Test'):''}</span>${liSrcChip(e.channel,[e.form,e.campaign].filter(Boolean).join(' · '))}<span>${liChip(e.outcome,LI_OUT_TONE[e.outcome])}</span><span class="li-mu">${liEsc(e.rep||'—')}</span><span>${e.oppId?liBtn('Open','opp',e.oppId,'link'):''}</span></div>`).join('')}</div>`;
}
function liLogHtml(){
  const d=liDev(), st=liState(d), F=LI.ui.logF, outs=['All','Created','Matched','Held','Test'];
  const rows=st.log.filter(e=>F==='All'||(F==='Test'?e.test:e.outcome===F));
  return `${liHeader('Leads log',`Every submission for ${liEsc(d.name)}, from every source, with its outcome.`,liBtn('Export CSV','toast','Exporting the leads log as CSV'))}${liNav()}
  <div class="li-row li-filters">${outs.map(o=>`<button type="button" class="li-fchip ${F===o?'on':''}" data-li="logf" data-arg="${o}">${o} <span class="li-mu">${o==='All'?st.log.length:o==='Test'?st.log.filter(e=>e.test).length:st.log.filter(e=>e.outcome===o).length}</span></button>`).join('')}</div>
  ${liLogTable(rows)}`;
}
function liLinksHtml(){
  const d=liDev(), st=liState(d), reg=st.forms[0];
  return `${liHeader('Tracked links',`One form, many links. Each link stamps its source and campaign on every lead it brings in.`,liBtn('Create a tracked link','share',reg.id+'|link','primary'))}${liNav()}
  ${st.links.length?`<div class="li-tbl"><div class="li-tr th l4"><span>Link</span><span>Source</span><span>Leads</span><span></span></div>${st.links.map(l=>`<div class="li-tr l4"><span class="li-col"><b>${liEsc(l.name)}</b><span class="li-mono li-mu">${liEsc(l.url)}</span></span>${liSrcChip(l.channel,l.campaign)}<span>${l.leads}</span><span class="li-row">${liBtn('Copy','copy',l.url,'link')}${liBtn('Test','buyer',reg.id+'|link|'+l.id,'link')}</span></div>`).join('')}</div>`
  :`<div class="li-empty"><b>No tracked links yet</b><span class="li-mu">Make one for each place you share the form: the hoarding, the brochure, your Instagram bio, each agency partner.</span>${liBtn('Create a tracked link','share',reg.id+'|link','primary')}</div>`}`;
}

function liCapDetailHtml(cap,extra=''){
  const kv=(k,v)=>v?`<div class="li-kv"><span class="li-mu">${k}</span><span>${v}</span></div>`:'';
  const utm=cap.utm?Object.entries(cap.utm).map(([k,v])=>`utm_${k}=${liEsc(v)}`).join(' · '):'';
  return `${extra}
  <div class="li-sub-h">Where it came from</div>
  ${kv('Channel',liSrcChip(cap.channel))}${kv('Method',liEsc(cap.method))}${kv('Form',liEsc(cap.form))}${kv('Campaign',liEsc([cap.campaign,cap.adset,cap.ad].filter(Boolean).join(' · ')))}
  ${kv('Tracking',utm?`<span class="li-mono">${utm}</span>`:'')}${kv('Landing page',cap.landing?`<span class="li-mono">${liEsc(cap.landing)}</span>`:'')}${kv('Received',liEsc(cap.receivedAt))}
  <div class="li-sub-h">What they answered</div>
  ${(cap.answers||[]).map(a=>kv(liEsc(a.q),`<b>${liEsc(a.a)}</b> <span class="li-mu">→ ${liEsc(a.maps)}</span>`)).join('')||'<div class="li-mu">No qualifying questions on this form.</div>'}
  <div class="li-sub-h">Consent</div>
  ${kv('Privacy notice',liEsc(cap.consent?.privacy||'—'))}${kv('Marketing opt-in',cap.consent?.optin?'Yes':'No')}
  ${cap.touches&&cap.touches.length>1?`<div class="li-sub-h">All touches</div>${cap.touches.map(t=>`<div class="li-kv"><span class="li-mu">${liEsc(t.at)}</span><span>${liEsc(t.channel)} · ${liEsc(t.form)}</span></div>`).join('')}`:''}
  ${kv('Capture ID',`<span class="li-mono">${liEsc(cap.captureId)}</span>`)}`;
}
function liLogModal(id){
  const st=liState(), e=st.log.find(x=>x.id===id);if(!e)return '';
  const o=e.oppId&&OPPS.find(x=>x.id===e.oppId);
  const top=`<div class="li-callout ${e.outcome==='Held'?'warn':''}"><b>${liEsc(e.outcome)}${e.test?' · test lead':''}</b><span>${liEsc(e.reason||(e.outcome==='Created'?`New contact and opportunity ${e.oppId}, assigned to ${e.rep}. ${e.rep} was notified.`:''))}</span></div>`;
  return liModalShell(`${liEsc(e.name)}`,`${liEsc(e.channel)} · ${liEsc(e.at||e.t)}`,liCapDetailHtml(e.cap||{},top),
    (o?liBtn('Open opportunity','opp',o.id,'primary'):e.outcome==='Held'?liBtn('Discard','held-discard',e.id)+liBtn('Ask the rep to call','toast','Task created for the sales manager','primary'):'')+liBtn('Close','close'),'drawer');
}

// Shown on the opportunity Details tab.
function liSourceCardHtml(o){
  const cap=o.capture;
  if(!cap)return `<section class="dcard opp-details-card li-opp-src"><h3>Source and answers</h3><div class="li-mu">Added by hand, source “${liEsc(o.source||'Not recorded')}”. Leads from Bricly forms, Meta and Google show their campaign, form and answers here.</div></section>`;
  return `<section class="dcard opp-details-card li-opp-src"><h3>Source and answers</h3>${liCapDetailHtml(cap)}<button type="button" class="li-btn link" data-li="open-log" data-arg="${liEsc(cap.devId+'|'+cap.captureId)}">See it in the leads log</button></section>`;
}
