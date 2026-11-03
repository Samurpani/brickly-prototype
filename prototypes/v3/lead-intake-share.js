// Lead intake · Share window: hosted link + tracked links, website embed (replace your form), QR and social copy.
const LI_PLATFORMS={
  wordpress:['WordPress',['Open the page that has your current form and click Edit.','Delete the old form block (Contact Form 7, WPForms, Gravity Forms…).','Add a “Custom HTML” block in the same spot and paste the code.','Click Update, then press “Check my page” below.']],
  elementor:['Elementor',['Edit the page with Elementor.','Delete the old Form widget.','Drag an HTML widget into its place and paste the code.','Click Update, then press “Check my page” below.']],
  wix:['Wix',['Open the Wix Editor on the page with your current form.','Delete the old form.','Add (+) → Embed code → Embed HTML, choose “Code” and paste. Drag the box to full width.','Publish, then press “Check my page” below.']],
  squarespace:['Squarespace',['Edit the page and remove the old Form block.','Add a Code block in the same place and paste the code.','Save, then press “Check my page” below.']],
  webflow:['Webflow',['In the Designer, delete the old Form Block.','Add an Embed element in its place and paste the code.','Publish, then press “Check my page” below.']],
  shopify:['Shopify',['Online Store → Pages → open the page.','Click Show HTML (<>) and paste the code where the old form was.','Save, then press “Check my page” below.']],
  gtm:['Google Tag Manager',['New tag → Custom HTML → paste the code.','Trigger: Page View on the pages where the form should appear.','Remove the old form from the page, publish the container, then check below.']],
  html:['Other / HTML',['Open the page’s HTML.','Replace the old <form> … </form> with the code.','Deploy, then press “Check my page” below.']],
};
const LI_STYLES=[['inline','In the page','Sits where your old form was'],['popup','Button + popup','Your button opens the form'],['floating','Floating tab','Follows the visitor on every page']];

function liShareOpen(formId,tab){LI.ui.modal={kind:'share',formId,tab:tab||'link',lk:{channel:'Instagram',campaign:''},made:null,check:{url:'',state:''},qr:'hosted'};}
function liSnippet(f,st){
  const s=st.site, src='https://embed.bricly.com/v2.js';
  if(s.style==='popup')return `<button type="button" data-bricly-popup="${f.id}">${s.btn}</button>\n<script src="${src}" async></script>`;
  if(s.style==='floating')return `<script src="${src}" data-bricly-floating="${f.id}" data-label="${s.btn}" async></script>`;
  return `<div data-bricly-form="${f.id}"></div>\n<script src="${src}" async></script>`;
}
function liTrackedUrl(st,ch,camp,id){
  const src={'Meta Lead Form':'meta',Instagram:'instagram',Facebook:'facebook','Google Ads':'google','Email newsletter':'newsletter',WhatsApp:'whatsapp','Hoarding / sign':'sign',Brochure:'brochure','Agency partner':'agency',Portal:'portal',Website:'website',Other:'other'}[ch]||'other';
  const med=/Meta|Google/.test(ch)?'paid':/sign|Brochure/.test(ch)?'offline':/Agency|Portal/.test(ch)?'referral':'social';
  const c=(camp||'always-on').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return {url:`${st.host}/register?bl=${id}&utm_source=${src}&utm_medium=${med}&utm_campaign=${c}`,utm:{source:src,medium:med,campaign:c}};
}
function liShareHtml(){
  const m=LI.ui.modal, f=liForm(m.formId), st=liState(), d=liDev(), url=`${st.host}/${f.kind==='enquiry'?'ask':'register'}`;
  const tabs=[['link','Link'],['website','Your website'],['qr','QR & print'],['social','Social & messages']];
  let body='';
  if(m.tab==='link'){
    body=`<div class="li-sub-h">Your form’s link</div><div class="li-codebox"><span class="li-mono">${liEsc(url)}</span>${liBtn('Copy','copy',url)}${liBtn('Open','buyer',f.id)}</div>
    <div class="li-mu">Works anywhere: bio links, emails, WhatsApp, buttons on your site. Leads from this plain link are tagged “Website”.</div>
    <div class="li-sub-h">Know exactly where each lead came from</div>
    <div class="li-mu">Create a tracked link for each place you share it. Every lead through it carries that source and campaign.</div>
    <div class="li-f2"><label class="li-f"><span>Where will you share it?</span><select data-li-m="lk.channel">${LI_CHANNELS.filter(c=>c!=='Website').map(c=>`<option ${m.lk.channel===c?'selected':''}>${c}</option>`).join('')}</select></label>
      <label class="li-f"><span>Campaign or placement <i class="li-mu">optional</i></span><input data-li-m="lk.campaign" value="${liEsc(m.lk.campaign)}" placeholder="e.g. Tower Road hoarding"></label></div>
    <div class="li-row">${liBtn('Create tracked link','link-make','','primary')}</div>
    ${m.made?`<div class="li-callout ok"><b>${liEsc(m.made.name)}</b><span class="li-mono">${liEsc(m.made.url)}</span><div class="li-row">${liBtn('Copy','copy',m.made.url)}${liBtn('QR code','stab','qr|'+m.made.id)}${liBtn('Test it','buyer',f.id+'|link|'+m.made.id)}</div></div>`:''}
    ${st.links.length?`<div class="li-sub-h">Tracked links (${st.links.length})</div>${st.links.map(l=>`<div class="li-q-row"><span class="li-col" style="flex:1"><b>${liEsc(l.name)}</b><span class="li-mono li-mu">${liEsc(l.url)}</span></span><span class="li-mu">${l.leads} leads</span>${liBtn('Copy','copy',l.url,'link')}</div>`).join('')}`:''}`;
  }else if(m.tab==='website'){
    const P=LI_PLATFORMS[st.site.platform], code=liSnippet(f,st), ck=m.check;
    body=`<div class="li-callout"><b>Replace the form on your website with this one</b><span>Leads then land in Bricly instantly with their answers and source, assigned to a rep. No more copying from emails, and nothing is lost.</span></div>
    <div class="li-sub-h">1 · How should it appear?</div>
    <div class="li-tiles">${LI_STYLES.map(([k,l,s])=>`<button type="button" class="li-tile ${st.site.style===k?'on':''}" data-li="site-style" data-arg="${k}"><span class="li-tile-art ${k}"><i></i></span><b>${l}</b><span class="li-mu">${s}</span></button>`).join('')}</div>
    ${st.site.style!=='inline'?`<label class="li-f"><span>Button text</span><input data-li-site="btn" value="${liEsc(st.site.btn)}"></label>`:''}
    <div class="li-sub-h">2 · Where is your website built?</div>
    <div class="li-row li-wrap">${Object.entries(LI_PLATFORMS).map(([k,[l]])=>`<button type="button" class="li-fchip ${st.site.platform===k?'on':''}" data-li="site-plat" data-arg="${k}">${l}</button>`).join('')}</div>
    <ol class="li-ol">${P[1].map(s=>`<li>${liEsc(s)}</li>`).join('')}</ol>
    <div class="li-code"><pre>${liEsc(code)}</pre>${liBtn('Copy code','copy',code,'primary')}</div>
    <div class="li-card li-row"><div class="li-col" style="flex:1"><b>Someone else looks after your website?</b><span class="li-mu">We email them the code, these ${liEsc(P[0])} steps and a link to check it.</span></div>
      <input class="li-inline-in" data-li-site="devEmail" value="${liEsc(st.site.devEmail)}" placeholder="developer@agency.com" aria-label="Web developer email">${liBtn('Send instructions','site-email')}</div>
    <div class="li-sub-h">3 · Check it’s working</div>
    <div class="li-row"><input class="li-inline-in grow" data-li-m="check.url" value="${liEsc(ck.url)}" placeholder="https://yourwebsite.com/contact" aria-label="Page address">${liBtn(ck.state==='checking'?'Checking…':'Check my page','site-check','','primary',ck.state==='checking'?'disabled':'')}</div>
    ${ck.state==='found'?`<div class="li-callout ok"><b>Found the form on ${liEsc(ck.host)}</b><span>The site was added to your allowed sites. Send a test from that page to see it arrive.</span></div>`:ck.state==='missing'?`<div class="li-callout warn"><b>We couldn’t find the form on that page</b><span>Check the page is published and the code is pasted in full. Some builders need you to press Publish twice.</span></div>`:''}
    ${st.site.domains.length?`<div class="li-sub-h">Allowed sites</div>${st.site.domains.map((x,i)=>`<div class="li-q-row"><span class="li-col" style="flex:1"><b>${liEsc(x.d)}</b><span class="li-mu">Seen ${liEsc(x.seen)} on ${liEsc(x.page)}</span></span>${liChip('Receiving','ok')}${liBtn('Remove','site-rm',i,'link')}</div>`).join('')}`:''}
    <div class="li-card"><b>After you switch</b><ul class="li-ul"><li>Delete the old form so buyers can’t use both.</li><li>Your Meta Pixel and Google tag still get a <b>Lead</b> event on every submit, set up in Tracking.</li><li>Need it on several pages? Paste the same code on each, or use the floating tab.</li></ul></div>`;
  }else if(m.tab==='qr'){
    const opts=[['hosted','Plain form link',url],...st.links.map(l=>[l.id,l.name,l.url])], cur=opts.find(o=>o[0]===m.qr)||opts[0];
    body=`<div class="li-row" style="align-items:flex-start;gap:20px"><div class="li-qr">${liQrSvg(cur[2])}</div><div class="li-col" style="flex:1;gap:10px">
      <label class="li-f"><span>Which link?</span><select data-li-m="qr">${opts.map(o=>`<option value="${o[0]}" ${o[0]===cur[0]?'selected':''}>${liEsc(o[1])}</option>`).join('')}</select></label>
      <span class="li-mono li-mu">${liEsc(cur[2])}</span>
      <div class="li-mu">Use a tracked link for each sign, brochure or show-flat stand, so you can tell which one brought each lead.</div>
      <div class="li-row">${liBtn('Download SVG','qr-dl',cur[2],'primary')}${liBtn('A4 poster (PDF)','toast','A4 poster with QR and headline downloaded')}${liBtn('Make a tracked link','stab','link')}</div></div></div>`;
  }else{
    const msgs=[['Instagram bio',`Register for prices and availability at ${d.name} 👇\n${url}`],['Facebook post',`${d.name} — ${d.tag||'new homes'}. Register for live prices and availability: ${url}`],['WhatsApp message',`Hi! Here’s the link to register for ${d.name}. You’ll get prices and availability straight away: ${url}`],['Email signature',`New: ${d.name}. Register for prices → ${url}`]];
    body=msgs.map(([t,x])=>`<div class="li-card"><div class="li-row"><b style="flex:1">${t}</b>${liBtn('Copy','copy',x)}</div><div class="li-pre">${liEsc(x)}</div></div>`).join('');
  }
  return liModalShell(`Share the ${liEsc(f.name.toLowerCase())}`,`${liEsc(d.name)} · ${liDirty(f)?'unpublished changes are not shared until you publish':'live'}`,
    `<div class="li-seg">${tabs.map(([k,l])=>`<button type="button" class="${m.tab===k?'on':''}" data-li="stab" data-arg="${k}">${l}</button>`).join('')}</div>${body}`,liBtn('Done','close','','primary'),'wide');
}
// Visual QR stand-in (finder patterns + hashed modules). Swap for a real encoder in the product build.
function liQrSvg(text){
  const n=25,h=liHash(text);let r='',seed=h;
  const rnd=()=>{seed=(seed*1103515245+12345)>>>0;return seed>>>16&1;};
  const finder=(x,y)=>`<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x+1}" y="${y+1}" width="5" height="5" fill="#fff"/><rect x="${x+2}" y="${y+2}" width="3" height="3"/>`;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){if((x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9))continue;if(rnd())r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`;}
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n+4} ${n+4}" width="168" height="168" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n+4}" height="${n+4}" fill="#fff"/><g fill="#191919">${finder(0,0)}${finder(n-7,0)}${finder(0,n-7)}${r}</g></svg>`;
}
function liMakeLink(){
  const m=LI.ui.modal, st=liState(), id='tl_'+liId('').slice(1,6);
  const {url,utm}=liTrackedUrl(st,m.lk.channel,m.lk.campaign,id);
  const l={id,name:m.lk.campaign?`${m.lk.campaign} · ${m.lk.channel}`:m.lk.channel,channel:m.lk.channel,campaign:m.lk.campaign,url,utm,leads:0};
  st.links.unshift(l);m.made=l;m.qr=l.id;showToast('Tracked link created');
}
function liCheckSite(){
  const m=LI.ui.modal, st=liState(), u=m.check.url.trim();
  if(!u){m.check.state='missing';liModalRender();return;}
  m.check.state='checking';liModalRender();
  setTimeout(()=>{
    if(!LI.ui.modal||LI.ui.modal.kind!=='share')return;
    let host='',page='/';try{const x=new URL(/^https?:/.test(u)?u:'https://'+u);host=x.hostname.replace(/^www\./,'');page=x.pathname;}catch(e){}
    if(!host||!host.includes('.')||/notfound|missing/.test(u)){m.check.state='missing';}
    else{m.check.state='found';m.check.host=host;if(!st.site.domains.some(x=>x.d===host))st.site.domains.push({d:host,seen:'just now',page});}
    liModalRender();liRender();
  },1100);
}
