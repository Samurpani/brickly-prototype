/* ═══════════════ BUYER PROPOSALS: ADMIN STANDARD + REP SEND ═══════════════
   Three layers. Settings › Proposal page (owner and manager) sets the template, sections, buyer-type
   rules, reservations, access and legal text as a versioned standard. Developments supply the content.
   The rep only confirms the homes and the message, then sends. The buyer page is proposal/index.html. */
(function(){
  if(!window.PROPOSAL_STD) return;
  const PS=window.PROPOSAL_STD;
  const PA={st:PS.load(),bsel:'company'};
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
    if(JSON.stringify(a.brand)!==JSON.stringify(b.brand)) out.push('Company brand updated');
    Object.keys(b.devBrands||{}).forEach(k=>{if(JSON.stringify((a.devBrands||{})[k])!==JSON.stringify(b.devBrands[k])) out.push(`${devName(k)} brand updated`);});
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
  window.paPreview=(which,type)=>{
    paIssue(null);
    window.open(`proposal/index.html?intro=1${which==='draft'&&PA.st.draft?'&std=draft':''}${type?'&type='+type:''}`,'_blank','noopener');
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
  const devName=k=>((typeof DEVS!=='undefined'&&DEVS.find(d=>d.id===k))||{}).name||(k.charAt(0).toUpperCase()+k.slice(1));
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
    const head=`<div class="pa-be-h"><b>${isDev?E(devName(sel)):'Company brand'}</b><span class="st-sub">From ${E(kit.src)}</span></div>`;
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
  function brand(){
    const d=work();
    const item=(k,n,kit,sub)=>`<button type="button" class="pa-bl ${PA.bsel===k?'on':''}" aria-pressed="${PA.bsel===k}" onclick="paBrandSel('${k}')">${sw((kit.own===false?d.brand:kit).colors)}<span><b>${E(n)}</b><span class="st-sub">${E(sub)}</span></span>${PS.checks((kit.own===false?d.brand:kit).colors).some(c=>!c.ok)?'<span class="sh-chip warn">Check</span>':''}</button>`;
    return `<div class="pa-brand"><div class="pa-blist">${item('company','Company brand',d.brand,'Frames every proposal')}
      <div class="pa-h">Developments</div>${Object.entries(d.devBrands).map(([k,b])=>item(k,devName(k),b,b.own?'Own brand':'Company brand')).join('')}</div>
      <div class="pa-bedit">${brandEditor(d)}</div></div>
      <div class="pa-foot">Brands come from Company profile and New development setup. Change them here for proposals. Each development’s section uses its own brand; the cover, letter and next step use the company brand.</div>`;
  }
  window.paBrandSel=k=>{PA.bsel=k;rerenderKeepScroll();};
  window.paBrandSet=(path,val)=>{edit(d=>{const kit=kitOf(d,PA.bsel);const ks=path.split('.');let o=kit;ks.slice(0,-1).forEach(k=>o=o[k]);o[ks[ks.length-1]]=val;});rerenderKeepScroll();};
  window.paBrandOwn=v=>{edit(d=>{d.devBrands[PA.bsel].own=v==='own';});rerenderKeepScroll();};
  window.paBrandFile=(kind,inp)=>{
    const f=inp.files&&inp.files[0]; if(!f) return;
    const max=kind==='logo'?300e3:500e3;
    if(f.size>max){showToast(`That file is ${Math.round(f.size/1e3)} KB. Use one under ${max/1e3} KB.`);inp.value='';return;}
    const r=new FileReader();
    r.onload=()=>{edit(d=>{const kit=kitOf(d,PA.bsel);
      if(kind==='logo') kit.logo.img=r.result;
      else kit.fonts[kind]={name:f.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' '),data:r.result};});
      rerenderKeepScroll();showToast(kind==='logo'?'Logo uploaded · see the preview':'Font uploaded · see the preview');};
    r.readAsDataURL(f);
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
      {k:'custom',span:6,title:'Investment figures',desc:'By buyer type',render:()=>`<div class="pa-body">${investRule()}</div>`},
      {k:'custom',span:6,title:'Reservations',desc:'The buyer’s main button on each home',render:()=>`<div class="pa-body">${reserve()}</div>`},
      {k:'custom',span:6,title:'Sending',desc:'What happens after an appointment or enquiry',render:()=>`<div class="pa-body">${sending()}</div>`},
      {k:'custom',span:6,title:'Link and privacy',render:()=>`<div class="pa-body">${access()}</div>`},
      {k:'custom',span:12,title:'Legal footer',render:()=>`<div class="pa-body">${legal()}</div>`},
      {k:'custom',span:12,title:'Development readiness',desc:'Content each development supplies once. Missing content hides its section instead of blocking a send.',render:()=>`<div class="pa-body">${readiness()}</div>`},
      {k:'custom',span:12,title:'Versions',render:()=>`<div class="pa-body">${versions()}</div>`},
    ]};
  }
  window.paOpenSettings=()=>{PA.st=PS.load();if(typeof go==='function')go('settings');if(typeof stGo==='function')stGo('p:proposals');};

  // ---------- rep: send proposal (homes + message only) ----------
  const SEND={};
  const uOk=u=>u&&['available','hold'].includes(u.status);
  function msgFor(o,ids){
    const first=o.lead.split(' ')[0], x=getExt(o), kind=x.jstage==='viewing_held'||(o.appt&&o.appt.kind==='viewing')?'viewing':'enquiry';
    const homes=ids.length===1?'the home':`the ${ids.length} homes`;
    const open=kind==='viewing'?`${first}, thank you for coming to see ${o.devs[0]||'us'}.`:`${first}, thanks for getting in touch about ${o.devs[0]||'our homes'}.`;
    return `${open} I’ve put together ${homes} that fit what you asked for, with plans, views and the payment plan for each. Have a look and tell me what you think.`;
  }
  function candidates(o,sel){
    return UNITS.filter(u=>uOk(u)&&!sel.includes(u.id)&&(o.devs.includes(u.dev)||sel.some(s=>(UN(s)||{}).dev===u.dev))).slice(0,8);
  }
  window.paSend=function(oppId){
    const o=OPPS.find(r=>r.id===oppId)||oppCur; oppCur=o; PA.st=PS.load();
    let ids=o.units.filter(id=>uOk(UN(id)));
    if(!ids.length) ids=UNITS.filter(u=>uOk(u)&&o.devs.includes(u.dev)).slice(0,2).map(u=>u.id);
    Object.assign(SEND,{oid:o.id,ids,msg:msgFor(o,ids),edited:false});
    paSendRender();
  };
  function paSendRender(){
    const o=OPPS.find(r=>r.id===SEND.oid), std=PA.st.pub, rec=typeof cpRecipient==='function'?cpRecipient(o):{ok:true,ch:'wa',label:o.lead};
    const words=SEND.msg.trim().split(/\s+/).filter(Boolean).length, cands=candidates(o,SEND.ids);
    const tpl=PS.TEMPLATES.find(t=>t.k===std.template);
    const devs=[...new Set(SEND.ids.map(id=>UN(id).dev))];
    const body=`<div class="pa-send">
      <div class="pa-to">${rec.ok?`To <b>${E(rec.label)}</b>`:`<span class="sw-err">Can’t send: ${E(rec.why)}</span>`}</div>
      <div class="pa-step"><span>1</span><div><b>Homes</b><span class="st-sub">From the opportunity. Remove or add one.</span></div></div>
      <div class="pa-homes">${SEND.ids.map(id=>{const u=UN(id);return `<div class="pa-home"><div><b>${E(id)}</b><span class="st-sub">${E(u.dev)} · ${u.beds?u.beds+' bed':'Studio'} · ${u.sqm} m² · ${E(fmtEur(u.price))}${u.status==='hold'?' · on hold':''}</span></div><button type="button" class="pa-x" aria-label="Remove ${E(id)}" onclick="paSendUnit('${id}',false)">×</button></div>`;}).join('')||'<div class="st-sub">Add at least one home.</div>'}
        ${cands.length?`<label class="pa-sr" for="pa-add">Add a home</label><select id="pa-add" class="pa-add" onchange="if(this.value)paSendUnit(this.value,true)"><option value="">+ Add a home</option>${cands.map(u=>`<option value="${E(u.id)}">${E(u.id)} · ${E(u.dev)} · ${u.beds?u.beds+' bed':'Studio'} · ${E(fmtEur(u.price))}</option>`).join('')}</select>`:''}</div>
      <div class="pa-step"><span>2</span><div><b>Message</b><span class="st-sub">Drafted from the opportunity. It opens the proposal as your letter.</span></div></div>
      <label class="pa-sr" for="pa-msg">Message</label><textarea id="pa-msg" class="pa-ta" rows="5" oninput="paSendMsg(this.value)">${E(SEND.msg)}</textarea>
      <div class="st-sub ${words>80?'sw-err':''}" id="pa-wc">${words} of 80 words</div>
      <div class="pa-set">
        <div class="pa-h">Set by your admin</div>
        <div><span>Template</span><b>${E(tpl.n)}</b></div>
        <div><span>Developments</span><b>${devs.map(E).join(', ')||'—'}</b></div>
        <div><span>Sections</span><b>${PS.SECTIONS.filter(s=>std.sections[s.k]!=='off').length} of ${PS.SECTIONS.length} · standard v${std.v}</b></div>
        <div><span>Link</span><b>Expires in ${std.access.expiry} days${std.access.passcode?' · passcode':''}${std.access.prices?'':' · prices on request'}</b></div>
        ${editable()?`<button type="button" class="pa-link" onclick="qaDrawerClose();paOpenSettings()">Change in Settings</button>`:''}
      </div></div>`;
    const can=rec.ok&&SEND.ids.length&&words<=80&&words>0;
    qaDrawerOpen(`Send proposal to ${o.lead.split(' ')[0]}`,body,
      `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-ghost" ${SEND.ids.length?'':'disabled'} onclick="paSendPreview()">Preview</button><button class="btn-primary" id="pa-send-go" ${can?'':'disabled'} onclick="paSendGo()">Send on ${rec.ch==='em'?'email':'WhatsApp'}</button>`);
  }
  window.paSendUnit=(id,add)=>{SEND.ids=add?[...SEND.ids,id]:SEND.ids.filter(x=>x!==id);if(!SEND.edited)SEND.msg=msgFor(OPPS.find(r=>r.id===SEND.oid),SEND.ids);paSendRender();};
  window.paSendMsg=v=>{SEND.msg=v;SEND.edited=true;const w=v.trim().split(/\s+/).filter(Boolean).length,el=document.getElementById('pa-wc'),b=document.getElementById('pa-send-go');
    if(el){el.textContent=`${w} of 80 words`;el.classList.toggle('sw-err',w>80);}if(b)b.disabled=!(w>0&&w<=80&&SEND.ids.length);};
  // The buyer page reads this issue so the preview shows this buyer, these homes and this message.
  function paIssue(o){
    if(!o){localStorage.removeItem('bricly.proposal.issue');return;}
    const [first,...rest]=o.lead.split(' ');
    localStorage.setItem('bricly.proposal.issue',JSON.stringify({first,last:rest.join(' '),rep:o.rep,units:SEND.ids.map(id=>id.replace('#','')),msg:SEND.msg}));
  }
  window.paSendPreview=()=>{const o=OPPS.find(r=>r.id===SEND.oid);paIssue(o);window.open('proposal/index.html?issue=1&intro=1','_blank','noopener');};
  window.paSendGo=function(){
    const o=OPPS.find(r=>r.id===SEND.oid), x=getExt(o), std=PA.st.pub, rec=cpRecipient(o), ch=rec.ch==='em'?'Email':'WhatsApp';
    paIssue(o);
    const exp=new Date(Date.now()+std.access.expiry*864e5).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
    const list=swAssets(o), n=list.filter(a=>a.pp).length+1;
    list.unshift({id:'pp'+n+swHash(o.id+Date.now()).toString(36).slice(0,3),pp:1,type:'microsite',title:'Buyer proposal',icon:'WEB',units:[...SEND.ids],pub:1,draft:null,
      cur:{intro:SEND.msg,units:[...SEND.ids],secs:{welcome:1,gallery:1,plans:1,downloads:1,contact:1},seg:'desktop'},
      versions:[{v:1,when:swNow(),by:o.rep,note:`${PS.TEMPLATES.find(t=>t.k===std.template).n} · standard v${std.v}`}],
      attempts:[{when:swNow(),ch,ver:1,fmt:'link',status:'Delivered',msg:SEND.msg}],
      access:{state:'active',exp},eng:'Not opened yet'});
    x.ppReady=false; x.ppSent=true;
    qaDrawerClose(); if(typeof renderOpp==='function')renderOpp();
    showToast(`Proposal sent to ${o.lead.split(' ')[0]} on ${ch} · it’s in Shared with client`);
  };

  // ---------- entry points on the opportunity ----------
  const baseHero=window.heroHtml;
  if(baseHero) window.heroHtml=function(o,x,ji){
    const h=baseHero.apply(this,arguments);
    if(x.ppSent||x.ppDismiss||!o.units.length||/Closed/.test(o.stage)) return h;
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
