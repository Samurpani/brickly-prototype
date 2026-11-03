// Lead intake · form editor and the buyer-facing form (preview / test lead / tracked-link test).
const LI_TYPES=[['choice','Single choice'],['multi','Multiple choice'],['short','Short text'],['long','Long text'],['number','Number'],['date','Date']];
const LI_IDENTITY=[['First name','Text',true],['Last name','Text',false],['Phone with country code','Phone · used to spot repeat buyers',true],['Email','Email',true],['Privacy notice','Consent record',true],['Marketing opt-in','Unticked by default',false]];
function liForm(id){const st=liState();return st.forms.find(f=>f.id===id)||st.forms[0];}
function liCurForm(){return liForm(LI.ui.formId);}

function liFormHtml(){
  const f=liCurForm(), t=LI.ui.tab, dirty=liDirty(f);
  const tabs=[['questions','Questions'],['design','Look and wording'],['after','After they submit']];
  return `<div class="li-crumb"><button type="button" class="li-btn link" data-li="view" data-arg="home">← Lead capture</button></div>
  ${liHeader(`${liEsc(f.name)} <span id="li-stchip">${liChip(dirty?'Unpublished changes':'Live',dirty?'warn':'ok')}</span>`,`Published ${liEsc(String(f.pubAt||'').replace(/^At/,'at'))}. Edits stay in draft until you publish; links and embeds keep working.`,
    liBtn('Preview','buyer',f.id)+liBtn('Share','share',f.id+'|link'))}
  <div id="li-pubbar">${liPubBar(f)}</div>
  <div class="li-seg">${tabs.map(([k,l])=>`<button type="button" class="${t===k?'on':''}" data-li="ftab" data-arg="${k}">${l}</button>`).join('')}</div>
  <div class="li-ed"><div class="li-ed-l">${t==='questions'?liQuestionsHtml(f):t==='design'?liDesignHtml(f):liAfterHtml(f)}</div>
  <div class="li-ed-r"><div class="li-row li-pv-h"><span class="li-mu">Live preview</span>${f.twoStep&&t!=='after'?`<div class="li-seg sm">${[1,2].map(n=>`<button type="button" class="${LI.ui.pvStep===n?'on':''}" data-li="pvstep" data-arg="${n}">Step ${n}</button>`).join('')}</div>`:''}</div><div id="li-pv">${liPreviewHtml(f,t==='after'?3:LI.ui.pvStep)}</div></div></div>`;
}
function liPubBar(f){
  return liDirty(f)?`<div class="li-pub"><span><b>Unpublished changes.</b> Buyers still see the published version.</span>${liBtn('Discard','discard',f.id)}${liBtn('Publish changes','publish',f.id,'primary')}</div>`:'';
}
function liQRow(q,i,n){
  const open=LI.ui.editQ===q.id, typ=(LI_TYPES.find(x=>x[0]===q.type)||[])[1];
  const sub=`${typ}${q.opts.length&&/choice|multi/.test(q.type)?' · '+q.opts.length+' options':''} · saves to ${q.maps}`;
  return `<div class="li-q ${open?'open':''}" draggable="true" data-li-drag="${q.id}">
    <div class="li-q-row"><span class="li-handle" title="Drag to reorder" aria-hidden="true">⋮⋮</span>
      <button type="button" class="li-q-main" data-li="q-edit" data-arg="${q.id}" aria-expanded="${open}"><b>${liEsc(q.label)}</b><span class="li-mu">${liEsc(sub)}</span></button>
      <button type="button" class="li-req ${q.req?'on':''}" data-li="q-req" data-arg="${q.id}" aria-pressed="${q.req}">${q.req?'Required':'Optional'}</button>
      <button type="button" class="li-ib" data-li="q-up" data-arg="${q.id}" ${i===0?'disabled':''} aria-label="Move up">↑</button>
      <button type="button" class="li-ib" data-li="q-down" data-arg="${q.id}" ${i===n-1?'disabled':''} aria-label="Move down">↓</button>
      <button type="button" class="li-ib" data-li="q-del" data-arg="${q.id}" aria-label="Remove question">✕</button></div>
    ${open?`<div class="li-q-ed">
      <label class="li-f"><span>Question</span><input data-li-q="label" data-qid="${q.id}" value="${liEsc(q.label)}"></label>
      <label class="li-f"><span>Help text <i class="li-mu">optional</i></span><input data-li-q="help" data-qid="${q.id}" value="${liEsc(q.help)}" placeholder="Shown under the question"></label>
      <div class="li-f2"><label class="li-f"><span>Answer type</span><select data-li-q="type" data-qid="${q.id}">${LI_TYPES.map(([k,l])=>`<option value="${k}" ${q.type===k?'selected':''}>${l}</option>`).join('')}</select></label>
      <label class="li-f"><span>Saves to</span><select data-li-q="maps" data-qid="${q.id}">${LI_FIELDS.slice(5,15).map(k=>`<option ${q.maps===k?'selected':''}>${k}</option>`).join('')}</select></label></div>
      ${/choice|multi/.test(q.type)?`<div class="li-f"><span>Options ${q.fromUnits?liBtn('Refresh from units and prices','q-refresh',q.id,'link'):''}</span>
        ${q.opts.map((o,k)=>`<div class="li-opt"><input data-li-opt="${k}" data-qid="${q.id}" value="${liEsc(o)}" aria-label="Option ${k+1}"><button type="button" class="li-ib" data-li="opt-del" data-arg="${q.id}|${k}" aria-label="Remove option">✕</button></div>`).join('')}
        ${liBtn('+ Add option','opt-add',q.id,'link')}</div>`:''}
      <div class="li-row" style="justify-content:flex-end">${liBtn('Done','q-edit',q.id,'primary')}</div></div>`:''}
  </div>`;
}
function liQuestionsHtml(f){
  const d=liDev(), have=new Set(f.qs.map(q=>q.key)), lib=liLibrary(d).filter(q=>!have.has(q.key));
  const id=`<div class="li-step-h"><b>${f.twoStep?'Step 1 · Contact details':'Contact details'}</b><span class="li-mu">Fixed, so every lead can be followed up and deduplicated.${f.twoStep?' Submitting step 1 already creates the lead.':''}</span></div>
    <div class="li-locked">${LI_IDENTITY.map(([l,s,r])=>`<div class="li-q-row locked"><span class="li-handle" aria-hidden="true">🔒</span><span class="li-col" style="flex:1"><b>${l}</b><span class="li-mu">${s}</span></span>${liChip(r?'Required':'Optional')}</div>`).join('')}</div>`;
  return `${f.kind==='registration'?`<div class="li-card li-row"><div class="li-col" style="flex:1"><b>Layout</b><span class="li-mu">Two steps converts best: contact details first, questions second.</span></div><div class="li-seg sm">${[[true,'Two steps'],[false,'One step']].map(([v,l])=>`<button type="button" class="${f.twoStep===v?'on':''}" data-li="twostep" data-arg="${v}">${l}</button>`).join('')}</div></div>`:''}
  ${id}
  <div class="li-step-h"><b>${f.twoStep?'Step 2 · Qualifying questions':'Questions'}</b><span class="li-mu">Click a question to change its wording or options. Drag or use the arrows to reorder.</span></div>
  <div id="li-qs">${f.qs.map((q,i)=>liQRow(q,i,f.qs.length)).join('')||'<div class="li-mu">No questions. Leads will only have contact details.</div>'}</div>
  ${f.qs.length>5?`<div class="li-callout warn"><b>${f.qs.length} questions</b><span>Forms with 3 or 4 questions get noticeably more completions. Consider making some optional or removing them.</span></div>`:''}
  <div class="li-row">${liBtn('+ Add from question library','lib','', 'ghost',`aria-expanded="${LI.ui.lib}"`)}${liBtn('+ Write your own question','q-custom')}</div>
  ${LI.ui.lib?`<div class="li-lib">${lib.length?lib.map(q=>`<div class="li-q-row"><span class="li-col" style="flex:1"><b>${liEsc(q.label)}</b><span class="li-mu">${q.opts.length?liEsc(q.opts.slice(0,4).join(' · ')):'Free text'} · saves to ${q.maps}</span></span>${liBtn('Add','q-add',q.key)}</div>`).join(''):'<div class="li-mu">Every library question is already on the form.</div>'}</div>`:''}`;
}
function liDesignHtml(f){
  const D=f.design, inp=(k,l,h='')=>`<label class="li-f"><span>${l}${h?` <i class="li-mu">${h}</i>`:''}</span><input data-li-in="design.${k}" value="${liEsc(D[k])}"></label>`;
  return `<div class="li-card">${inp('headline','Headline')}<label class="li-f"><span>Intro</span><textarea data-li-in="design.intro" rows="2">${liEsc(D.intro)}</textarea></label>${inp('button','Button text')}${inp('thanks','Thank-you message','{first} is replaced with their first name')}</div>
  <div class="li-card"><div class="li-f"><span>Accent colour</span><div class="li-row">${LI_ACCENTS.map(c=>`<button type="button" class="li-sw ${D.accent===c?'on':''}" style="background:${c}" data-li="accent" data-arg="${c}" aria-label="Accent ${c}"></button>`).join('')}</div></div>
    ${liTog('Show the development logo','design.logo',D.logo)}${liTog('Show a hero image','design.hero',D.hero)}
    <label class="li-f"><span>Language</span><select data-li-in="design.lang">${['English','Maltese','Italian','German'].map(l=>`<option ${D.lang===l?'selected':''}>${l}</option>`).join('')}</select></label></div>
  <div class="li-card">${inp('privacy','Privacy notice link')}${inp('optin','Marketing opt-in wording','always unticked by default')}</div>`;
}
function liTog(label,path,on,sub=''){return `<div class="li-tog"><span class="li-col"><span>${label}</span>${sub?`<span class="li-mu">${sub}</span>`:''}</span><button type="button" class="li-switch ${on?'on':''}" role="switch" aria-checked="${!!on}" aria-label="${liEsc(label)}" data-li="tog" data-arg="${path}"><span></span></button></div>`;}
function liAfterHtml(f){
  const A=f.after, modes=f.kind==='registration'?[['availability','Show live prices and availability','Recommended. Buyers get what they came for, and you see which homes they open.'],['thanks','Show a thank-you message','Uses the thank-you text from “Look and wording”.'],['redirect','Send them to a page on your website','For your own thank-you page.']]:[['thanks','Show a thank-you message',''],['redirect','Send them to a page on your website','']];
  return `<div class="li-card">${modes.map(([k,l,s])=>`<button type="button" class="li-radio ${A.mode===k?'on':''}" data-li="after-mode" data-arg="${k}"><span class="li-dot"></span><span class="li-col"><b>${l}</b>${s?`<span class="li-mu">${s}</span>`:''}</span></button>`).join('')}
    ${A.mode==='redirect'?`<label class="li-f"><span>Page address</span><input data-li-in="after.url" value="${liEsc(A.url)}" placeholder="https://yourwebsite.com/thank-you"></label>`:''}</div>
  <div class="li-card">${liTog('Offer a consultation slot straight away','after.booking',A.booking,'Shows the assigned rep’s free slots')}${liTog('Send an instant WhatsApp reply','after.autoReply',A.autoReply,'From your WhatsApp Business number, in the buyer’s language')}${liTog('Notify the assigned rep immediately','after.notify',A.notify,'In the app and by push. Speed-to-lead target: 15 minutes')}</div>`;
}
function liPreviewHtml(f,step){
  const D=f.design, d=liDev();
  const head=`${D.hero?`<div class="li-pv-hero" style="background-image:url('${typeof awAsset==='function'?liEsc(awAsset(d.photo)):''}')"></div>`:''}<div class="li-pv-b">${D.logo?`<div class="li-pv-logo">${liEsc(d.name)}</div>`:''}`;
  if(step===3){
    const A=f.after;
    return `<div class="li-pv">${head}<b>${liEsc(D.thanks.replace('{first}','Maria'))}</b>${A.mode==='availability'?'<span class="li-mu">→ Opens live prices and availability</span>':A.mode==='redirect'?`<span class="li-mu">→ Redirects to ${liEsc(A.url||'your page')}</span>`:''}${A.booking?`<div class="li-pv-slots">${['Sat 09:30','Sat 11:00','Mon 17:00'].map(s=>`<span>${s}</span>`).join('')}</div>`:''}</div></div>`;
  }
  const idf=`${['First name','Last name','Phone','Email'].map(l=>`<div class="li-pv-f"><span>${l}</span><span class="li-pv-in"></span></div>`).join('')}<div class="li-pv-ck">☐ I have read the <u>privacy notice</u></div><div class="li-pv-ck">☐ ${liEsc(D.optin)}</div>`;
  const qs=f.qs.map(q=>`<div class="li-pv-f"><span>${liEsc(q.label)}${q.req?'':' <i>(optional)</i>'}</span>${q.help?`<i class="li-mu">${liEsc(q.help)}</i>`:''}${/choice|multi/.test(q.type)?`<div class="li-pv-opts">${q.opts.map(o=>`<span>${liEsc(o)}</span>`).join('')}</div>`:`<span class="li-pv-in ${q.type==='long'?'tall':''}"></span>`}</div>`).join('');
  const body=!f.twoStep?(f.kind==='enquiry'?qs+idf:idf+qs):step===1?idf:qs;
  return `<div class="li-pv">${head}${f.twoStep?`<span class="li-mu">Step ${step} of 2</span>`:''}<b class="li-pv-t">${liEsc(step===2&&f.twoStep?'A few questions so we can help':D.headline)}</b>${step===1||!f.twoStep?`<span class="li-mu">${liEsc(D.intro)}</span>`:''}${body}<span class="li-pv-btn" style="background:${D.accent}">${liEsc(f.twoStep&&step===1?'Continue':D.button)}</span></div></div>`;
}

// Buyer-facing form, rendered as the buyer sees it. Submitting runs the real capture path.
function liBuyerOpen(formId,mode,linkId){
  const st=liState(), link=linkId?st.links.find(l=>l.id===linkId):null;
  LI.ui.modal={kind:'buyer',formId,test:true,link,step:1,vals:{},err:'',done:null};
}
function liBuyerHtml(){
  const m=LI.ui.modal, f=liForm(m.formId), D=f.design, st=liState(), d=liDev();
  const url=m.link?m.link.url:`${st.host}/${f.kind==='enquiry'?'ask':'register'}`;
  let body;
  if(m.done){
    const e=m.done, A=f.after;
    body=`<div class="li-bf-done"><b>${liEsc(D.thanks.replace('{first}',m.vals.first||''))}</b>${A.mode==='availability'?`<span class="li-mu">Next, the buyer lands on live prices and availability for ${liEsc(d.name)}.</span>`:''}${A.booking?`<div class="li-pv-slots">${['Sat 09:30','Sat 11:00','Mon 17:00'].map(s=>`<span>${s}</span>`).join('')}</div>`:''}</div>
    <div class="li-callout ${e.outcome==='Held'?'warn':'ok'}"><b>In Bricly: ${liEsc(e.outcome)}</b><span>${e.outcome==='Created'?`${liEsc(e.name)} is now ${liEsc(e.oppId)} in New Lead, assigned to ${liEsc(e.rep)}. Source: ${liEsc(e.channel)} · ${liEsc(e.form)}${e.campaign?' · '+liEsc(e.campaign):''}.`:liEsc(e.reason)}</span>
      <div class="li-row">${e.oppId?liBtn('Open the opportunity','opp',e.oppId,'primary'):''}${liBtn('See it in the log','logrow',e.id)}</div></div>`;
  }else{
    const inp=(k,l,type='text',ph='')=>`<label class="li-f"><span>${l}</span><input type="${type}" data-li-b="${k}" value="${liEsc(m.vals[k]||'')}" placeholder="${ph}"></label>`;
    const ident=`<div class="li-f2">${inp('first','First name')}${inp('last','Last name')}</div>${inp('phone','Phone','tel','+356 …')}${inp('email','Email','email')}
      <label class="li-ck"><input type="checkbox" data-li-b="privacy" ${m.vals.privacy?'checked':''}> I have read the <u>privacy notice</u>. Grech Developments will contact me about ${liEsc(d.name)}.</label>
      <label class="li-ck"><input type="checkbox" data-li-b="optin" ${m.vals.optin?'checked':''}> ${liEsc(D.optin)}</label>`;
    const qs=f.qs.map(q=>`<div class="li-f"><span>${liEsc(q.label)}${q.req?'':' <i class="li-mu">optional</i>'}</span>${/choice|multi/.test(q.type)?`<div class="li-bf-opts">${q.opts.map(o=>{const v=m.vals[q.id],on=Array.isArray(v)?v.includes(o):v===o;return `<button type="button" class="${on?'on':''}" data-li="b-opt" data-arg="${q.id}|${liEsc(o)}" style="${on?`border-color:${D.accent};background:${D.accent}14`:''}">${liEsc(o)}</button>`;}).join('')}</div>`:q.type==='long'?`<textarea data-li-b="${q.id}" rows="3">${liEsc(m.vals[q.id]||'')}</textarea>`:`<input data-li-b="${q.id}" type="${q.type==='number'?'number':q.type==='date'?'date':'text'}" value="${liEsc(m.vals[q.id]||'')}">`}</div>`).join('');
    const two=f.twoStep, s=m.step;
    body=`${D.hero?`<div class="li-pv-hero lg" style="background-image:url('${typeof awAsset==='function'?liEsc(awAsset(d.photo)):''}')"></div>`:''}
    ${two?`<span class="li-mu">Step ${s} of 2</span>`:''}<h3 class="li-bf-t">${liEsc(two&&s===2?'A few questions so we can help':D.headline)}</h3>${s===1?`<p class="li-mu">${liEsc(D.intro)}</p>`:''}
    ${!two?(f.kind==='enquiry'?qs+ident:ident+qs):s===1?ident:qs}
    ${m.err?`<div class="li-err" role="alert">${liEsc(m.err)}</div>`:''}
    <div class="li-row" style="justify-content:space-between">${s===1?liBtn('Fill with a sample buyer','b-fill','','link'):'<span></span>'}<button type="button" class="li-btn primary" style="background:${D.accent}" data-li="b-next">${liEsc(two&&s===1?'Continue':D.button)}</button></div>`;
  }
  return `<div class="li-scrim" data-li="close"></div><div class="li-modal li-buyer" role="dialog" aria-modal="true" aria-label="Buyer view of ${liEsc(f.name)}">
    <div class="li-browser"><span class="li-dots"><i></i><i></i><i></i></span><span class="li-mono">${liEsc(url)}</span><button type="button" class="li-x" data-li="close" aria-label="Close">×</button></div>
    ${m.test?`<div class="li-testbar">${m.link?`Testing tracked link “${liEsc(m.link.name)}”.`:'Test mode.'} Submitting creates a real lead tagged <b>Test lead</b> so you can follow it into the pipeline.</div>`:liDirty(f)?'<div class="li-testbar">Preview includes unpublished changes.</div>':''}
    <div class="li-bf">${body}</div></div>`;
}
function liBuyerNext(){
  const m=LI.ui.modal, f=liForm(m.formId), v=m.vals, two=f.twoStep;
  const checkIdent=()=>{
    if(!v.first)return 'Add your first name.';
    if(!v.phone&&!v.email)return 'Add a phone number or an email so the team can reply.';
    if(v.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email))return 'That email address does not look right.';
    if(v.phone&&String(v.phone).replace(/\D/g,'').length<8)return 'Add the full phone number with country code.';
    if(!v.privacy)return 'Tick the privacy notice to continue.';
    return '';
  };
  const checkQs=()=>{const miss=f.qs.find(q=>q.req&&!(Array.isArray(v[q.id])?v[q.id].length:v[q.id]));return miss?`Answer “${miss.label}”.`:'';};
  m.err=two&&m.step===1?checkIdent():two?checkQs():(checkIdent()||checkQs());
  if(m.err){liModalRender();return;}
  if(two&&m.step===1){m.step=2;liModalRender();return;}
  const d=liDev(), st=liState(d), L=m.link;
  const answers=f.qs.filter(q=>v[q.id]&&(!Array.isArray(v[q.id])||v[q.id].length)).map(q=>({q:q.label,a:Array.isArray(v[q.id])?v[q.id].join(', '):String(v[q.id]),maps:q.maps}));
  m.done=liCapture({devId:d.id,channel:L?L.channel:'Website',method:L?'Bricly form · tracked link':'Bricly form · hosted page',form:f.name,formId:f.id,campaign:L?L.campaign||L.name:'',
    utm:L?L.utm:null,landing:(L?L.url:st.host+'/register').replace(/^https?:\/\//,''),first:v.first,last:v.last,phone:v.phone,email:v.email,optin:!!v.optin,answers,test:m.test});
  if(L)L.leads++;
  liModalRender();if(LI.ui.view!=='form')liRender();
}
