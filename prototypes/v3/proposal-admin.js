/* ═══════════════ BUYER PROPOSALS: ADMIN STANDARD + REP SEND ═══════════════
   Three layers. Settings › Proposal page (owner and manager) sets the template, sections, buyer-type
   rules, reservations, access and legal text as a versioned standard. Developments supply the content.
   The rep only confirms the homes and the message, then sends. The buyer page is proposal/index.html. */
(function(){
  if(!window.PROPOSAL_STD) return;
  const PS=window.PROPOSAL_STD;
  // Accounts often have many developments with their own brand; these seeds make the list long enough to need search.
  const SEED_DEVS=[
    ['tasliema','Ta’ Sliema Point','own',{bg:'#F3F1EE',surface:'#FFFFFF',ink:'#1B1C20',muted:'#55575E',accent:'#2C3E66',tint:'#DCE2EE',line:'#DDDCD8'},'Fraunces','28 Oct'],
    ['gzira','Gżira Quay','company',null,null,'21 Oct'],
    ['mellieha','Mellieħa Heights','own',{bg:'#F5F2EC',surface:'#FFFFFF',ink:'#22201B',muted:'#5D5850',accent:'#7A4E2D',tint:'#EBDDCB',line:'#E1D9CC'},'Playfair Display','15 Oct'],
    ['xemxija','Xemxija Bay','own',{bg:'#EFF3F3',surface:'#FFFFFF',ink:'#15262A',muted:'#4C5E62',accent:'#1F5A64',tint:'#D2E5E7',line:'#D6DFE0'},'EB Garamond','9 Oct'],
    ['birgu','Birgu Wharf','company',null,null,'30 Sep'],
    ['naxxar','Naxxar Green','own',{bg:'#F1F3EE',surface:'#FFFFFF',ink:'#1C2219',muted:'#56604F',accent:'#3E5A30',tint:'#DAE5D0',line:'#D8DED2'},'Cormorant Garamond','22 Sep'],
    ['swieqi','Swieqi Court','company',null,null,'11 Sep'],
    ['balzan','Balzan Villas','own',{bg:'#F6F2EE',surface:'#FFFFFF',ink:'#26201C',muted:'#625952',accent:'#8B3F2F',tint:'#F0DAD3',line:'#E5DAD3'},'Libre Caslon Text','27 Aug'],
    ['marsascala','Marsascala Front','company',null,null,'14 Aug'],
  ];
  const EDITED={dolphin:'2 Sep',onyx:'18 Sep',mercury:'4 Aug',lalex:'12 Jul',verdala:'1 Nov'};
  const co=()=>(window.BST&&window.BST.company&&window.BST.company.get())||null;
  // Company profile owns the company brand: name, logo and brand colour are copied into the standard.
  function applyCompany(d,c){
    if(!d||!c) return;
    d.brand.logo={text:c.tradingName,sub:c.logoSub||'',img:c.logoLight||''};
    PS.COLOR_KEYS.forEach(([k])=>{if(c[k])d.brand.colors[k]=c[k];});
    const font=(n,data)=>data?{name:n,data}:{name:n};
    if(c.fontDisplay)d.brand.fonts.display=font(c.fontDisplay,c.fontDisplayData);
    if(c.fontText)d.brand.fonts.text=font(c.fontText,c.fontTextData);
    d.brand.src='Company profile';
  }
  function seed(d){
    if(!d) return;
    SEED_DEVS.forEach(([k,name,b,colors,font,ed])=>{
      if(d.devBrands[k]) return;
      const base=PS.clone(d.brand);
      d.devBrands[k]=b==='own'?{own:true,name,edited:ed,src:'New development setup',logo:{text:name,sub:''},colors:{...colors},fonts:{display:{name:font},text:{name:'Hanken Grotesk'}}}
        :{own:false,name,edited:ed,src:'No project brand · uses the company brand',logo:{text:name,sub:''},colors:base.colors,fonts:base.fonts};
    });
    Object.entries(EDITED).forEach(([k,ed])=>{if(d.devBrands[k]&&!d.devBrands[k].edited)d.devBrands[k].edited=ed;});
  }
  // Developer section (“Built on trust” on the buyer page). Image paths are relative to prototypes/v3.
  const TRUST_DEFAULT={years:'28',projects:'14',units:'1,260',guarantees:'',awards:'',delivered:[
    {id:'dp1',name:'Marina Point',place:'Kalkara',year:'2019',img:'assets/present/harbour.jpg'},
    {id:'dp2',name:'The Ramparts',place:'Valletta',year:'2021',img:'assets/present/dev-lalex.jpg'},
    {id:'dp3',name:'Laguna Terraces',place:'St Paul’s Bay',year:'2024',img:'assets/present/dev-verdala.jpg'}]};
  function loadSt(){
    const st=PS.load(),c=co();
    [st.pub,st.draft].forEach(d=>{seed(d);applyCompany(d,c);if(d&&!d.trust)d.trust=PS.clone(TRUST_DEFAULT);if(d)delete d.track;});
    PS.save(st); return st;
  }
  const PA={st:loadSt(),bsel:null,dq:'',dall:false};
  if(window.BST&&window.BST.company) window.BST.company.onChange(()=>{PA.st=loadSt();});
  const E=s=>xesc(String(s??''));
  const work=()=>PA.st.draft||PA.st.pub;
  const editable=()=>typeof stAccess!=='function'||stAccess('proposals')==='f';
  const ST_LABEL={always:'Always',data:'When there’s data',off:'Off'};
  const today=()=>new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'});
  const me=()=>(typeof PERSONAS!=='undefined'&&typeof curPersona!=='undefined'&&PERSONAS[curPersona]&&PERSONAS[curPersona].name)||'You';
  const SENT_LIVE=3;

  // ---------- draft editing ----------
  function edit(fn){
    if(!editable()) return;
    if(!PA.st.draft) PA.st.draft=PS.clone(PA.st.pub);
    fn(PA.st.draft); PS.save(PA.st); paRender();
  }
  function changes(){
    const a=PA.st.pub,b=PA.st.draft; if(!b) return [];
    const out=[];
    if(a.template!==b.template) out.push(`Template → ${PS.TEMPLATES.find(t=>t.k===b.template).n}`);
    PS.SECTIONS.forEach(s=>{if(a.sections[s.k]!==b.sections[s.k]) out.push(`${s.l} → ${ST_LABEL[b.sections[s.k]]}`);});
    if(a.investFor.join()!==b.investFor.join()) out.push('Investment figures: buyer types changed');
    if(a.reserve.mode!==b.reserve.mode) out.push(b.reserve.mode==='request-pos'?'Buyers can book the promise of sale':'Buyers send a reservation request only');
    if(a.reserve.to!==b.reserve.to) out.push(`Reservation requests go to ${b.reserve.to==='rep'?'the rep':'the sales manager'}`);
    if(a.sending!==b.sending) out.push(b.sending==='auto'?'Proposals send automatically':'Reps approve before sending');
    if(a.access.expiry!==b.access.expiry) out.push(`Links expire after ${b.access.expiry} days`);
    if(a.access.passcode!==b.access.passcode) out.push(b.access.passcode?'Passcode on':'Passcode off');
    if(a.access.prices!==b.access.prices) out.push(b.access.prices?'Prices shown':'Prices on request');
    if(a.access.tracking!==b.access.tracking) out.push(b.access.tracking?'Viewing activity shared with the rep':'Viewing activity not tracked');
    if(a.legal!==b.legal) out.push('Legal footer edited');
    if(JSON.stringify(a.trust)!==JSON.stringify(b.trust)) out.push('Developer section updated');
    if((a.singleDev||'company')!==(b.singleDev||'company')) out.push(b.singleDev==='development'?'One-development proposals use the development brand':'One-development proposals use the company brand');
    if(JSON.stringify(a.brand)!==JSON.stringify(b.brand)) out.push('Company brand updated');
    const kitJson=x=>JSON.stringify(x?{...x,edited:0}:x);
    Object.keys(b.devBrands||{}).forEach(k=>{if(kitJson((a.devBrands||{})[k])!==kitJson(b.devBrands[k])) out.push(`${devName(k)} brand updated`);});
    return out;
  }
  function paRender(){if(typeof stRender==='function'&&stPage==='proposals')stRender();}
  function rerenderKeepScroll(){const c=document.getElementById('content'),y=c&&c.scrollTop;paRender();if(c)c.scrollTop=y;}

  window.paSet=(path,val)=>{edit(d=>{const ks=path.split('.');let o=d;ks.slice(0,-1).forEach(k=>o=o[k]);const last=ks[ks.length-1];o[last]=val==='true'?true:val==='false'?false:/^\d+$/.test(val)?+val:val;});rerenderKeepScroll();};
  window.paSection=(k,v)=>{edit(d=>{d.sections[k]=v;});rerenderKeepScroll();};
  window.paInvest=(k,on)=>{edit(d=>{d.investFor=PS.TYPES.map(([t])=>t).filter(t=>t===k?on:d.investFor.includes(t));});rerenderKeepScroll();};
  window.paLegal=v=>{if(!PA.st.draft)PA.st.draft=PS.clone(PA.st.pub);PA.st.draft.legal=v;PS.save(PA.st);
    const bar=document.getElementById('pa-bar');if(bar)bar.outerHTML=barHtml();};
  window.paDiscard=()=>{PA.st.draft=null;PS.save(PA.st);paRender();showToast('Draft discarded · the published standard is unchanged');};
  window.paPreview=(which,type,dev)=>{
    // Settings previews show the sample buyer, not the last proposal a rep previewed.
    localStorage.removeItem('bricly.proposal.issue');
    window.open(`proposal/index.html?intro=1${which==='draft'&&PA.st.draft?'&std=draft':''}${type?'&type='+type:''}${dev?'&dev='+dev:''}`,'_blank','noopener');
  };
  window.paPublishAsk=()=>{
    const ch=changes(), v=PA.st.pub.v+1;
    qaDrawerOpen(`Publish proposal standard v${v}?`,`<div class="pa-pub">
      <p>New proposals use v${v} from now on. The ${SENT_LIVE} proposals already sent keep v${PA.st.pub.v}, so nothing a buyer has open changes.</p>
      <div class="pa-h">Changes</div><ul>${ch.map(c=>`<li>${E(c)}</li>`).join('')||'<li>No changes</li>'}</ul></div>`,
      `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="paPublish()">Publish v${v}</button>`);
  };
  window.paPublish=()=>{
    const ch=changes(), d=PA.st.draft; if(!d) return;
    d.v=PA.st.pub.v+1; d.when=today(); d.by=me();
    d.log=[{v:d.v,when:d.when,by:d.by,note:ch.slice(0,2).join(' · ')+(ch.length>2?` · ${ch.length-2} more`:'')||'Republished'},...PA.st.pub.log];
    PA.st={pub:d,draft:null}; PS.save(PA.st); qaDrawerClose(); paRender(); showToast(`Proposal standard v${d.v} published · new proposals use it`);
  };

  // ---------- settings page blocks ----------
  function brandFails(d){
    const kits=[['Company brand',d.brand],...Object.entries(d.devBrands||{}).filter(([,b])=>b.own).map(([k,b])=>[devName(k),b])];
    return kits.filter(([,b])=>PS.checks(b.colors).some(c=>!c.ok)).map(([n])=>n);
  }
  function barHtml(){
    const ch=changes(), p=PA.st.pub, ro=!editable(), fails=PA.st.draft?brandFails(PA.st.draft):[];
    return `<div class="pa-bar ${PA.st.draft?'draft':''}" id="pa-bar">
      <div><b>${PA.st.draft?`Draft · ${ch.length} change${ch.length===1?'':'s'}`:`Published v${p.v}`}</b>
        <span class="st-sub">${fails.length?`<span class="pa-bad">Can’t publish: ${E(fails.join(', '))} ${fails.length>1?'have':'has'} text buyers may not be able to read. Fix the colours in Brand.</span>`:PA.st.draft?`Not live yet. Proposals keep using v${p.v} until you publish.`:`${E(p.when)} by ${E(p.by)} · every proposal reps send follows this`}</span></div>
      <div class="pa-bar-a">${PA.st.draft&&!ro?`<button type="button" class="btn-ghost" onclick="paDiscard()">Discard</button><button type="button" class="btn-ghost" onclick="paPreview('draft')">Preview draft</button><button type="button" class="btn-primary" ${fails.length?'disabled':''} onclick="paPublishAsk()">Publish v${p.v+1}</button>`
        :`<button type="button" class="btn-ghost" onclick="paPreview('pub')">Preview a proposal</button>`}</div></div>`;
  }
  // call(v) returns the onclick JS for option v.
  function seg(name,opts,val,call,dis){
    return `<div class="pa-seg" role="radiogroup" aria-label="${E(name)}">${opts.map(([v,l])=>`<button type="button" role="radio" aria-checked="${v===val}" class="${v===val?'on':''}" ${dis?'disabled':''} onclick="${call(v)}">${E(l)}</button>`).join('')}</div>`;
  }
  const setter=path=>v=>`paSet('${path}','${v}')`;
  function templates(){
    const d=work(), ro=!editable();
    return `<div class="pa-tpls">${PS.TEMPLATES.map(t=>`<button type="button" class="pa-tpl ${d.template===t.k?'on':''}" ${!t.ready||ro?'disabled':''} onclick="paSet('template','${t.k}')" aria-pressed="${d.template===t.k}">
      <span class="pa-thumb t-${t.k}" aria-hidden="true"><i></i><i></i><i></i></span>
      <b>${E(t.n)}</b><span class="st-sub">${E(t.d)}</span>${t.ready?(d.template===t.k?'<span class="sh-chip ok">In use</span>':''):'<span class="sh-chip">Coming soon</span>'}</button>`).join('')}</div>
      <div class="pa-foot">Colours, fonts and logos come from Brand below. Reps can’t change the template or the brand.</div>`;
  }
  function sections(){
    const d=work(), ro=!editable(), groups=[...new Set(PS.SECTIONS.map(s=>s.g))];
    return groups.map(g=>`<div class="pa-h">${E(g)}</div><div class="pa-rows">${PS.SECTIONS.filter(s=>s.g===g).map(s=>`<div class="pa-row">
        <div><b>${E(s.l)}</b><span class="st-sub">${E(s.d)}${s.note?` · ${E(s.note)}`:''}</span></div>
        <span class="pa-src">${E(s.src)}</span>
        <div>${s.lock?`<span class="pa-lock">Always · required</span>`:seg(s.l,(s.opts||['always','data','off']).map(o=>[o,ST_LABEL[o]]),d.sections[s.k],v=>`paSection('${s.k}','${v}')`,ro)}</div></div>`).join('')}</div>`).join('')
      +`<div class="pa-foot">The order is set by the template. “When there’s data” sections hide on their own if the development or opportunity has nothing to show, so reps never fill gaps.</div>`;
  }
  function investRule(){
    const d=work(), ro=!editable();
    return `<p class="st-sub pa-p">Show estimated rent, yield or price per m² to:</p><div class="pa-checks">${PS.TYPES.map(([k,l])=>`<label class="pa-check"><input type="checkbox" ${d.investFor.includes(k)?'checked':''} ${ro||d.sections.investment==='off'?'disabled':''} onchange="paInvest('${k}',this.checked)"><span>${E(l)}</span></label>`).join('')}</div>
      <div class="pa-foot">${d.sections.investment==='off'?'Investment figures are off for every buyer.':'Every figure carries its disclaimer next to it. Growth buyers see price per m² since launch instead of rent.'}</div>`;
  }
  function reserve(){
    const d=work(), ro=!editable();
    return `<div class="pa-field"><span>What buyers can do</span>${seg('What buyers can do',[['request','Request a reservation'],['request-pos','Request, then book the promise of sale']],d.reserve.mode,setter('reserve.mode'),ro)}</div>
      <div class="pa-field"><span>Requests go to</span>${seg('Requests go to',[['rep','The rep'],['manager','The sales manager first']],d.reserve.to,setter('reserve.to'),ro)}</div>
      <div class="pa-foot">A request never reserves a home on its own. It creates a task, and the hold still follows Approvals.</div>`;
  }
  function sending(){
    const d=work(), ro=!editable();
    return `${seg('Sending',[['approve','Rep approves each proposal'],['auto','Send automatically']],d.sending,setter('sending'),ro)}
      <div class="pa-foot">${d.sending==='auto'?'After an appointment or enquiry is logged, the proposal is sent from the rep’s WhatsApp with the drafted message. The rep is told and can follow up.':'After an appointment or enquiry is logged, the rep gets “Proposal ready”. They confirm the homes and message, then send.'}</div>`;
  }
  function access(){
    const a=work().access, ro=!editable();
    const sw=(k,l,s)=>`<label class="pa-sw"><span><b>${l}</b><span class="st-sub">${s}</span></span><input type="checkbox" role="switch" ${a[k]?'checked':''} ${ro?'disabled':''} onchange="paSet('access.${k}','${!a[k]}')"></label>`;
    return `<div class="pa-field"><span>Link expires after</span>${seg('Link expires after',[['14','14 days'],['30','30 days'],['60','60 days']],String(a.expiry),setter('access.expiry'),ro)}</div>
      ${sw('prices','Show prices','Off shows “Price on request” and hides payment amounts')}
      ${sw('passcode','Ask for a passcode','The buyer enters a code sent with the link')}
      ${sw('tracking','Tell the rep what the buyer viewed','Sections opened, homes viewed and requests. The buyer sees a notice.')}`;
  }
  function legal(){
    const ro=!editable();
    return `<label class="pa-sr" for="pa-legal">Legal footer</label><textarea id="pa-legal" class="pa-ta" rows="4" ${ro?'disabled':''} oninput="paLegal(this.value)">${E(work().legal)}</textarea>
      <div class="pa-foot">Shown at the end of every proposal and in the PDF. Reps can’t edit it.</div>`;
  }
  // ---------- brand ----------
  const devName=k=>((work().devBrands||{})[k]||{}).name||((typeof DEVS!=='undefined'&&DEVS.find(d=>d.id===k))||{}).name||(k.charAt(0).toUpperCase()+k.slice(1));
  const kitOf=(d,sel)=>sel==='company'?d.brand:d.devBrands[sel];
  const sw=c=>`<span class="pa-sws" aria-hidden="true">${['bg','ink','accent','tint'].map(k=>`<i style="background:${E(c[k])}"></i>`).join('')}</span>`;
  function logoHtml(l,fam){return l.img?`<img src="${E(l.img)}" alt="${E(l.text||'Logo')}">`:`<b style="font-family:${E(fam)}">${E(l.text)}</b><small>${E(l.sub||'')}</small>`;}
  function previewHtml(kit,co){
    const t=PS.tokens(kit), c=kit.colors; PS.loadFonts(kit); if(co)PS.loadFonts(co);
    return `<div class="pa-prev" style="background:${E(c.bg)};color:${E(c.ink)};font-family:${E(t.text)}">
      <div class="pa-prev-top" style="border-color:${E(c.line)}"><span class="pa-prev-lg">${logoHtml(kit.logo,t.display)}</span></div>
      <p class="pa-prev-k" style="color:${E(c.muted)}">Prepared for</p>
      <p class="pa-prev-h" style="font-family:${E(t.display)}">Mike Gatt</p>
      <p class="pa-prev-p" style="color:${E(c.muted)}">Two-bedroom apartment with a terrace, before summer 2027.</p>
      <div class="pa-prev-card" style="background:${E(c.surface)};border-color:${E(c.line)}"><span class="pa-prev-pill" style="background:${E(c.tint)}">On hold for you</span><b style="font-family:${E(t.display)}">Residence 9802</b><span style="color:${E(c.muted)}">2 bed · 88 m² · Level 2</span>
        <span class="pa-prev-btn" style="background:${E(c.accent)};color:${E(PS.onAccent(c))}">Reserve this home</span></div></div>`;
  }
  function checksHtml(c){
    return `<div class="pa-checks-row">${PS.checks(c).map(x=>`<span class="sh-chip ${x.ok?'ok':'warn'}" title="${x.ok?'Meets WCAG AA (4.5:1)':'Below 4.5:1 · hard to read'}">${E(x.l)} ${x.r}:1 ${x.ok?'✓':'· too low'}</span>`).join('')}</div>`;
  }
  function fontPick(kit,role,ro){
    const f=kit.fonts[role], opts=PS.FONTS.map(x=>x.n); if(!opts.includes(f.name)) opts.unshift(f.name);
    return `<div class="pa-fontrow"><label class="pa-sr" for="pa-f-${role}">${role==='display'?'Headline font':'Body font'}</label>
      <select id="pa-f-${role}" ${ro?'disabled':''} onchange="paBrandSet('fonts.${role}',{name:this.value})">${opts.map(n=>`<option ${n===f.name?'selected':''}>${E(n)}${n===f.name&&f.data?' · uploaded':''}</option>`).join('')}</select>
      <label class="pa-upl ${ro?'dis':''}">Upload font<input type="file" accept=".woff2,.woff,.ttf,.otf" ${ro?'disabled':''} onchange="paBrandFile('${role}',this)"></label></div>
      <span class="pa-fontdemo" style="font-family:${E(PS.tokens(kit)[role])}">${role==='display'?'Residence 9802, Dolphin Court':'Two bedrooms, a terrace and a harbour view.'}</span>`;
  }
  function brandEditor(d){
    const sel=PA.bsel, ro=!editable(), co=d.brand;
    const isDev=sel!=='company', kit=kitOf(d,sel);
    const head=`<div class="pa-be-h"><b>${isDev?E(devName(sel)):'Company brand'}</b><span class="st-sub">From ${E(kit.src)}</span><button type="button" class="pa-link pa-be-x" onclick="paBrandSel(null)">Close</button></div>`;
    if(isDev&&!kit.own) return `${head}${seg('Brand source',[['company','Use the company brand'],['own','Own brand']],'company',v=>`paBrandOwn('${v}')`,ro)}
      <p class="pa-foot">This development’s section uses the company colours and fonts, with its name as the logo.</p>
      ${previewHtml({...co,logo:{text:devName(sel),sub:''}},co)}`;
    const t=PS.tokens(kit);
    return `${head}${isDev?seg('Brand source',[['company','Use the company brand'],['own','Own brand']],'own',v=>`paBrandOwn('${v}')`,ro):''}
      <div class="pa-be">
        <div class="pa-be-l">
          <div class="pa-h">Logo</div>
          <div class="pa-logo"><span class="pa-logo-box" style="background:${E(kit.colors.bg)};color:${E(kit.colors.ink)}">${logoHtml(kit.logo,t.display)}</span>
            <label class="pa-upl ${ro?'dis':''}">Upload logo<input type="file" accept="image/svg+xml,image/png,image/webp" ${ro?'disabled':''} onchange="paBrandFile('logo',this)"></label>
            ${kit.logo.img&&!ro?`<button type="button" class="pa-link" onclick="paBrandSet('logo.img','')">Use a text logo</button>`:''}</div>
          ${kit.logo.img?'':`<div class="pa-2"><label>Name<input value="${E(kit.logo.text)}" ${ro?'disabled':''} onchange="paBrandSet('logo.text',this.value)"></label><label>Line under the name<input value="${E(kit.logo.sub||'')}" ${ro?'disabled':''} onchange="paBrandSet('logo.sub',this.value)"></label></div>`}
          <div class="pa-h">Colours</div>
          <div class="pa-colors">${PS.COLOR_KEYS.map(([k,l])=>`<label class="pa-color"><input type="color" value="${E(kit.colors[k])}" ${ro?'disabled':''} onchange="paBrandSet('colors.${k}',this.value)" aria-label="${E(l)} colour"><span><b>${E(l)}</b><input class="pa-hex" value="${E(kit.colors[k])}" ${ro?'disabled':''} aria-label="${E(l)} hex value" onchange="if(/^#?[0-9a-f]{6}$/i.test(this.value))paBrandSet('colors.${k}',this.value[0]==='#'?this.value:'#'+this.value)"></span></label>`).join('')}</div>
          <div class="pa-h">Fonts</div>
          <div class="pa-font"><span>Headlines</span>${fontPick(kit,'display',ro)}</div>
          <div class="pa-font"><span>Body text</span>${fontPick(kit,'text',ro)}</div>
        </div>
        <div class="pa-be-r"><div class="pa-h">Preview</div>${previewHtml(kit)}<div class="pa-h">Readability</div>${checksHtml(kit.colors)}</div>
      </div>`;
  }
  function companyHtml(d){
    const kit=d.brand, c=co()||{}, t=PS.tokens(kit), canEdit=typeof stAccess!=='function'||stAccess('company')==='f';
    return `<div class="pa-co" id="pa-co">
      <div class="pa-co-l">
        <div class="pa-co-h"><b>Company brand</b><span class="pa-from">From Company profile</span>${canEdit?`<button type="button" class="pa-link" onclick="paEditCompany()">Edit</button>`:''}</div>
        <p class="st-sub">Frames ${(d.singleDev||'company')==='development'?'proposals with homes in more than one development':'every proposal'}: the cover, the letter and the next step.</p>
        <dl class="pa-co-dl">
          <dt>Logo</dt><dd><span class="pa-logo-box sm" style="background:${E(kit.colors.bg)};color:${E(kit.colors.ink)}">${logoHtml(kit.logo,t.display)}</span></dd>
          <dt>Brand colour</dt><dd><span class="pa-co-sw" style="background:${E(kit.colors.accent)}"></span><code>${E(kit.colors.accent)}</code></dd>
          <dt>Trading name</dt><dd>${E(c.tradingName||kit.logo.text)}</dd>
          <dt>Colours</dt><dd>${sw(kit.colors)}<span class="st-sub">${PS.COLOR_KEYS.length} colours</span></dd>
          <dt>Fonts</dt><dd><span style="font-family:${E(t.display)}">${E(kit.fonts.display.name)}</span> and <span style="font-family:${E(t.text)}">${E(kit.fonts.text.name)}</span></dd>
        </dl>
        ${PS.checks(kit.colors).some(x=>!x.ok)?`<div class="pa-h">Readability</div>${checksHtml(kit.colors)}`:''}
      </div>
      <div class="pa-co-r">${previewHtml(kit)}</div></div>`;
  }
  const devList=d=>Object.entries(d.devBrands);
  function devRowsHtml(){
    const d=work(), all=devList(d), q=PA.dq.trim().toLowerCase();
    const hits=q?all.filter(([k])=>devName(k).toLowerCase().includes(q)):all;
    const rows=q||PA.dall?hits:hits.slice(0,5);
    return `<table class="pa-dt"><thead><tr><th scope="col">Development</th><th scope="col">Brand</th><th scope="col">Last edited</th></tr></thead><tbody>
      ${rows.map(([k,b])=>{const colors=(b.own?b:d.brand).colors,bad=b.own&&PS.checks(colors).some(c=>!c.ok);return `<tr class="${PA.bsel===k?'on':''}" data-dev="${E(k)}" onclick="paBrandSel('${E(k)}')"><th scope="row"><button type="button" class="pa-dn" aria-pressed="${PA.bsel===k}">${sw(colors)}<b>${E(devName(k))}</b></button>${bad?'<span class="sh-chip warn">Check colours</span>':''}</th><td><span class="sh-chip ${b.own?'own':''}">${b.own?'Own':'Company'}</span></td><td class="pa-dt-m">${E(b.edited||'—')}</td></tr>`;}).join('')}
      ${rows.length?'':`<tr><td colspan="3" class="pa-dt-m">No developments match “${E(PA.dq)}”</td></tr>`}</tbody></table>
      ${!q&&all.length>5?`<button type="button" class="pa-link pa-more" onclick="paDevAll()">${PA.dall?'Show fewer':`Show all (${all.length})`}</button>`:''}`;
  }
  function singleDevHtml(d){
    const v=d.singleDev||'company', ro=!editable();
    return `<div class="pa-single" id="pa-single"><div><b>When a proposal has one development</b>
        <span class="st-sub">${v==='development'?'If every home in the proposal is in the same development, the whole proposal uses that development’s logo, colours and fonts. The company name, logo and “Built on trust” section don’t show. Proposals with homes in more than one development keep the company brand.':'The company brand frames every proposal, even when all the homes are in one development. Each development’s box and panel use its own brand.'}</span></div>
      <div class="pa-single-a">${seg('When a proposal has one development',[['company','Company brand'],['development','Development brand']],v,setter('singleDev'),ro)}
        <button type="button" class="pa-link" onclick="paPreview('${PA.st.draft?'draft':'pub'}',null,'dolphin')">Preview with one development</button></div></div>`;
  }
  function brand(){
    const d=work(), n=devList(d).length;
    return `${companyHtml(d)}${singleDevHtml(d)}
      <div class="pa-devs"><div class="pa-devs-h"><div><b>Developments</b><span class="st-sub">${n} developments. Each one’s section uses its own brand, or the company brand if it has none.</span></div>
        ${n>5?`<input type="search" class="pa-dsearch" placeholder="Search developments" aria-label="Search developments" value="${E(PA.dq)}" oninput="paDevSearch(this.value)">`:''}</div>
        <div id="pa-devlist">${devRowsHtml()}</div></div>
      ${PA.bsel&&PA.bsel!=='company'&&d.devBrands[PA.bsel]?`<div class="pa-bedit" id="pa-bedit">${brandEditor(d)}</div>`:''}`;
  }
  window.paDevSearch=v=>{PA.dq=v;const el=document.getElementById('pa-devlist');if(el)el.innerHTML=devRowsHtml();};
  window.paDevAll=()=>{PA.dall=!PA.dall;rerenderKeepScroll();};
  window.paEditCompany=()=>{if(typeof go==='function')go('settings');stGo('p:company');};
  window.paBrandSel=k=>{PA.bsel=k;rerenderKeepScroll();};
  window.paBrandSet=(path,val)=>{edit(d=>{const kit=kitOf(d,PA.bsel);if(PA.bsel!=='company')kit.edited=today();const ks=path.split('.');let o=kit;ks.slice(0,-1).forEach(k=>o=o[k]);o[ks[ks.length-1]]=val;});rerenderKeepScroll();};
  window.paBrandOwn=v=>{edit(d=>{d.devBrands[PA.bsel].own=v==='own';d.devBrands[PA.bsel].edited=today();});rerenderKeepScroll();};
  window.paBrandFile=(kind,inp)=>{
    const f=inp.files&&inp.files[0]; if(!f) return;
    const max=kind==='logo'?300e3:500e3;
    if(f.size>max){showToast(`That file is ${Math.round(f.size/1e3)} KB. Use one under ${max/1e3} KB.`);inp.value='';return;}
    const r=new FileReader();
    r.onload=()=>{edit(d=>{const kit=kitOf(d,PA.bsel);if(PA.bsel!=='company')kit.edited=today();
      if(kind==='logo') kit.logo.img=r.result;
      else kit.fonts[kind]={name:f.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' '),data:r.result};});
      rerenderKeepScroll();showToast(kind==='logo'?'Logo uploaded · see the preview':'Font uploaded · see the preview');};
    r.readAsDataURL(f);
  };

  // ---------- developer section ----------
  function trustHtml(){
    const T=work().trust, ro=!editable(), dis=ro?'disabled':'';
    const inp=(k,l)=>`<label>${l}<input id="pa-t-${k}" inputmode="numeric" value="${E(T[k])}" ${dis} onchange="paTrust('${k}',this.value)"></label>`;
    const rows=T.delivered.map((p,i)=>`<div class="pa-dp" data-proj="${E(p.id)}">
      <span class="pa-dp-img">${p.img?`<img src="${E(p.img)}" alt="${E(p.name||'Project photo')}">`:'<span>No photo</span>'}</span>
      <div class="pa-dp-f"><label>Project name<input value="${E(p.name)}" ${dis} aria-label="Project name" onchange="paProj('${E(p.id)}','name',this.value)"></label>
        <label>Place<input value="${E(p.place||'')}" ${dis} aria-label="Place" placeholder="Optional" onchange="paProj('${E(p.id)}','place',this.value)"></label>
        <label>Year<input value="${E(p.year)}" ${dis} inputmode="numeric" aria-label="Year delivered" onchange="paProj('${E(p.id)}','year',this.value)"></label></div>
      ${ro?'':`<div class="pa-dp-a"><label class="pa-upl">${p.img?'Replace photo':'Upload photo'}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Photo for ${E(p.name||'project')}" onchange="paProjPhoto('${E(p.id)}',this)"></label>
        <span class="pa-dp-mv"><button type="button" class="pa-x" ${i===0?'disabled':''} aria-label="Move ${E(p.name)} up" onclick="paProjMove('${E(p.id)}',-1)">↑</button><button type="button" class="pa-x" ${i===T.delivered.length-1?'disabled':''} aria-label="Move ${E(p.name)} down" onclick="paProjMove('${E(p.id)}',1)">↓</button><button type="button" class="pa-x" aria-label="Remove ${E(p.name)}" onclick="paProjRemove('${E(p.id)}')">×</button></span></div>`}
    </div>`).join('');
    return `<div class="pa-trust"><div class="pa-trust-l">
      <div class="pa-h">Track record</div>
      <div class="pa-3">${inp('years','Years in business')}${inp('projects','Projects delivered')}${inp('units','Units delivered')}</div>
      <div class="pa-2"><label>Guarantees<textarea id="pa-t-guarantees" rows="3" ${dis} placeholder="For example a 10-year structural guarantee" onchange="paTrust('guarantees',this.value)">${E(T.guarantees)}</textarea></label>
        <label>Awards<textarea id="pa-t-awards" rows="3" ${dis} placeholder="One per line" onchange="paTrust('awards',this.value)">${E(T.awards)}</textarea></label></div>
      <div class="pa-h">Delivered projects</div>
      <div class="pa-dps">${rows||'<p class="st-sub">No projects yet. The section shows the track record only.</p>'}</div>
      ${ro||T.delivered.length>=6?'':`<button type="button" class="pa-link pa-more" onclick="paProjAdd()">Add project</button>`}
      <div class="pa-foot">Up to 6 projects. JPG, PNG or WebP under 400 KB. A project needs a photo and a name to show.</div>
    </div><div class="pa-trust-r"><div class="pa-h">Preview</div>${trustPreview(T)}</div></div>`;
  }
  function trustPreview(T){
    const kit=work().brand, c=kit.colors, t=PS.tokens(kit);
    const stats=[[T.years,'Years building'],[T.projects,'Developments delivered'],[T.units,'Homes handed over']].filter(([v])=>String(v||'').trim());
    return `<div class="pa-prev pa-tp" style="background:${E(c.bg)};color:${E(c.ink)};font-family:${E(t.text)}">
      <p class="pa-prev-k" style="color:${E(c.muted)}">Built on trust</p>
      <div class="pa-tp-s">${stats.map(([v,l])=>`<span style="border-color:${E(c.line)}"><b style="font-family:${E(t.display)}">${E(v)}</b><small style="color:${E(c.muted)}">${E(l)}</small></span>`).join('')}</div>
      <div class="pa-tp-p">${T.delivered.slice(0,3).map(p=>`<figure>${p.img?`<img src="${E(p.img)}" alt="">`:'<i></i>'}<figcaption style="font-family:${E(t.display)}">${E(p.name)}<small style="color:${E(c.muted)};font-family:${E(t.text)}">${p.place?E(p.place)+' · ':''}${E(p.year)}</small></figcaption></figure>`).join('')}</div></div>`;
  }
  const trustEdit=fn=>{edit(d=>fn(d.trust));rerenderKeepScroll();};
  window.paTrust=(k,v)=>trustEdit(T=>{T[k]=v.trim();});
  window.paProj=(id,k,v)=>trustEdit(T=>{const p=T.delivered.find(x=>x.id===id);if(p)p[k]=v.trim();});
  window.paProjAdd=()=>{trustEdit(T=>{T.delivered.push({id:'dp'+Date.now().toString(36),name:'',place:'',year:'',img:''});});
    const last=[...document.querySelectorAll('.pa-dp')].pop();last?.querySelector('input')?.focus();};
  window.paProjRemove=id=>trustEdit(T=>{T.delivered=T.delivered.filter(x=>x.id!==id);});
  window.paProjMove=(id,dir)=>trustEdit(T=>{const i=T.delivered.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=T.delivered.length)return;[T.delivered[i],T.delivered[j]]=[T.delivered[j],T.delivered[i]];});
  window.paProjPhoto=(id,inp)=>{
    const f=inp.files&&inp.files[0]; if(!f) return;
    if(f.size>400e3){showToast(`That photo is ${Math.round(f.size/1e3)} KB. Use one under 400 KB.`);inp.value='';return;}
    const r=new FileReader();r.onload=()=>{trustEdit(T=>{const p=T.delivered.find(x=>x.id===id);if(p)p.img=r.result;});showToast('Photo uploaded · see the preview');};r.readAsDataURL(f);
  };

  function readiness(){
    const rows=(typeof DEVS!=='undefined'?DEVS:[]).map(d=>{
      const items=[
        ['Cover image',!!d.photo,'Cover and selection'],
        ['Amenities',!!(d.amen&&d.amen.length),'Amenities'],
        ['Places nearby',!!(d.dist&&d.dist.length),'Location'],
        ['Interior renders',!!(d.media&&d.media.renders&&d.media.renders.int&&d.media.renders.int.length),'Renders and views'],
        ['Build progress photo',d.completion==='Ready'||!!(d.media&&d.media.photos||[]).some(p=>/progress/i.test(p.tag||p.cap||'')),'Build progress'],
        ['Payment plan',!!(d.files||[]).some(f=>/payment/i.test(f.n)),'Payment plan'],
      ];
      const miss=items.filter(i=>!i[1]);
      return {d,items,miss};
    });
    return `<div class="pa-ready">${rows.map(({d,items,miss})=>`<div class="pa-rd">
        <div class="pa-rd-h"><b>${E(d.name)}</b>${miss.length?`<span class="sh-chip warn">${miss.length} missing</span>`:'<span class="sh-chip ok">Ready</span>'}
          <button type="button" class="st-link" onclick="paOpenDev('${d.id}')">Open development</button></div>
        <div class="pa-rd-i">${items.map(([l,ok,sec])=>`<span class="${ok?'ok':'miss'}" title="${ok?'Ready':`Until added, ${sec} hides in proposals`}">${ok?'✓':'○'} ${E(l)}</span>`).join('')}</div>
        ${miss.length?`<div class="st-sub">Until added: ${miss.map(m=>E(m[2])).join(', ')} ${miss.length>1?'hide':'hides'} in proposals. Sending isn’t blocked.</div>`:''}
      </div>`).join('')}</div>`;
  }
  window.paOpenDev=id=>{if(typeof deOpen==='function')deOpen(id);};
  function versions(){
    return `<div class="cp-std-v">${PA.st.pub.log.map(v=>`<div class="sw-li"><b>v${v.v}</b><span>${E(v.note)} · ${E(v.by)}</span><em>${E(v.when)}</em></div>`).join('')}</div>`;
  }

  if(typeof ST_NAV_ACC!=='undefined'&&window.BST){
    const at=ST_NAV_ACC.findIndex(([k])=>k==='packs'||k==='approvals');
    ST_NAV_ACC.splice(at+1,0,['proposals','Proposal page']);
    ST_ACCESS.proposals={owner:'f',manager:'f',marketing:'v'};
    window.BST.pages.proposals={nav:'proposals',t:'Proposal page',d:'How every buyer proposal looks and behaves. Reps only confirm the homes and the message. Changes are drafted, previewed and published as a new version.',b:[
      {k:'custom',span:12,cls:'pa-barcard',render:()=>barHtml()},
      {k:'custom',span:12,title:'Template',desc:'One template for the whole account',render:()=>`<div class="pa-body">${templates()}</div>`},
      {k:'custom',span:12,title:'Brand',desc:'Logo, colours and fonts used in proposals',render:()=>`<div class="pa-body">${brand()}</div>`},
      {k:'custom',span:12,title:'Sections',desc:'What every proposal shows, and where its content comes from',render:()=>`<div class="pa-body">${sections()}</div>`},
      {k:'custom',span:12,title:'Developer section',desc:'“Built on trust” on the buyer page: your track record and delivered projects',render:()=>`<div class="pa-body">${trustHtml()}</div>`},
      {k:'custom',span:6,title:'Investment figures',desc:'By buyer type',render:()=>`<div class="pa-body">${investRule()}</div>`},
      {k:'custom',span:6,title:'Reservations',desc:'The buyer’s main button on each home',render:()=>`<div class="pa-body">${reserve()}</div>`},
      {k:'custom',span:6,title:'Sending',desc:'What happens after an appointment or enquiry',render:()=>`<div class="pa-body">${sending()}</div>`},
      {k:'custom',span:6,title:'Link and privacy',render:()=>`<div class="pa-body">${access()}</div>`},
      {k:'custom',span:12,title:'Legal footer',render:()=>`<div class="pa-body">${legal()}</div>`},
      {k:'custom',span:12,title:'Development readiness',desc:'Content each development supplies once. Missing content hides its section instead of blocking a send.',render:()=>`<div class="pa-body">${readiness()}</div>`},
      {k:'custom',span:12,title:'Versions',render:()=>`<div class="pa-body">${versions()}</div>`},
    ]};
  }
  window.paOpenSettings=()=>{PA.st=loadSt();if(typeof go==='function')go('settings');if(typeof stGo==='function')stGo('p:proposals');};

  // ---------- rep: send proposal ----------
  // The rep's Send proposal drawer is sbOpen() in send-buyer.js; paSend() opens it.

  // ---------- entry points on the opportunity ----------
  const baseHero=window.heroHtml;
  if(baseHero) window.heroHtml=function(o,x,ji){
    const h=baseHero.apply(this,arguments);
    if(x.ppSent||x.ppDismiss||!o.units.length||/Closed/.test(o.stage)||swAssets(o).some(a=>a.type==='proposal'&&a.attempts.length)) return h;
    const auto=PA.st.pub.sending==='auto';
    return `<div class="mi-ban t-ok pa-ban"><span><b>Proposal ready for ${E(o.lead.split(' ')[0])}.</b> ${o.units.length} home${o.units.length>1?'s':''} and a drafted message${auto?'. It will send automatically at 18:00.':'. Check and send.'}</span><button type="button" class="mi-ban-a" onclick="paSend('${o.id}')">${auto?'Review now':'Review and send'}</button><button type="button" class="mi-ban-x" aria-label="Dismiss" onclick="getExt(oppCur).ppDismiss=true;renderOpp()">×</button></div>`+h;
  };
  const baseOpp=window.renderOpp;
  if(baseOpp) window.renderOpp=function(){
    baseOpp.apply(this,arguments);
    const m=document.getElementById('cr-actions-menu'); if(!m||m.querySelector('[data-pa]')) return;
    m.querySelectorAll('.cr-am-primary').forEach(b=>b.classList.remove('cr-am-primary'));
    m.insertAdjacentHTML('afterbegin',`<button class="cr-am-primary" data-pa onclick="crAct('paSend','${oppCur.id}')"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 7l10-5-3.5 10L7 8 2 7z"/></svg>Send proposal</button>`);
  };

  window.PA_STATE=PA;
})();
