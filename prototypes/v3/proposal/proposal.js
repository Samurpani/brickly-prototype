/* Buyer proposal renderer.
   SECTIONS is the shared block library for the page. PANELS hold the detail for a development or a
   home and open in a side panel with their own section nav. A template is a page order plus a CSS
   class, so new templates reuse every section. Brand comes from tokens only: the developer brand
   frames the page and each development's panel and cards use that development's brand. */
(function(){
  const P=window.PROPOSAL, PERSONAS=window.PROPOSAL_PERSONAS;
  const qs=new URLSearchParams(location.search);
  const S={type:qs.get('type')||P.buyer.type,template:qs.get('template')||P.template,context:qs.get('context')||P.context.kind,
    reserved:qs.get('reserved')||P.reserved,requested:new Set(),cmp:'homes',cur:null,events:[]};
  const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('rm');

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const eur=n=>'€'+Math.round(n).toLocaleString('en-GB');
  const dev=id=>P.developments.find(d=>d.id===id);
  const unit=id=>P.units.find(u=>u.id===id);
  const unitsOf=d=>P.units.filter(u=>u.dev===d.id);
  const persona=()=>PERSONAS[S.type]||PERSONAS.investment;
  const repFirst=P.rep.name.split(' ')[0];
  const handoverOf=d=>d.timeline[d.timeline.length-1].d;
  const fact=(d,re)=>(d.facts.find(f=>re.test(f.l))||{}).v;
  const BEDS=['Studio','One-bedroom','Two-bedroom','Three-bedroom','Four-bedroom'];

  // ---------- brand tokens → CSS variables ----------
  function lum(hex){const n=parseInt(hex.slice(1),16),c=[n>>16,(n>>8)&255,n&255].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
  function vars(b){
    const L=lum(b.accent), on=(1.05/(L+.05))>=((L+.05)/(lum(b.ink)+.05))?'#FFFFFF':b.ink;
    return `--bg:${b.bg};--surface:${b.surface};--ink:${b.ink};--muted:${b.muted};--accent:${b.accent};--on-accent:${on};--tint:${b.tint};--line:${b.line};--display:${b.display};--text:${b.text}`;
  }
  const logo=(b,cls='')=>`<span class="lg ${cls}">${b.logo.img?`<img src="${esc(b.logo.img)}" alt="${esc(b.logo.alt||'')}">`:`<b>${esc(b.logo.text)}</b><small>${esc(b.logo.sub||'')}</small>`}</span>`;
  const head=(kick,title,sub)=>`<header class="sh rv"><p class="kick">${esc(kick)}</p><h2 class="mask"><span>${title}</span></h2>${sub?`<p class="lede">${sub}</p>`:''}</header>`;
  const count=(v,{pre='',suf='',plain=false}={})=>plain?`<span>${v}</span>`:`<span data-count="${v}" data-pre="${esc(pre)}" data-suf="${esc(suf)}">${pre}${Number(v).toLocaleString('en-GB')}${suf}</span>`;
  const spec=u=>`${u.beds} bed · ${u.sqm} m² · Level ${u.floor}`;

  // ---------- unit maths ----------
  const rentMid=u=>(u.invest.rent[0]+u.invest.rent[1])/2;
  const gross=u=>rentMid(u)*12/u.price*100;
  const net=u=>(rentMid(u)*12*u.invest.occ/100-u.invest.fees)/u.price*100;
  const pm2=u=>u.price/u.sqm;
  const statusOf=u=>S.reserved===u.id?['Reserved for you','held']:S.requested.has(u.id)?['Reservation requested','held']:u.status==='held'?['On hold for you','held']:['Available',''];

  // ---------- drawings ----------
  function plan(u){
    const R=[[12,12,226,128],[12,140,120,94],[132,140,60,94],[238,12,170,122],[238,134,170,100],[12,234,226,44]];
    const lab=[...u.rooms.map(r=>r[0]).slice(0,2),'Bath',...u.rooms.map(r=>r[0]).slice(2,4),u.rooms[4]?u.rooms[4][0]:'Terrace'];
    const map=[0,1,null,2,3,4];
    return `<svg class="plan" viewBox="0 0 420 290" role="img" aria-label="Floor plan of ${esc(u.name)}">
      ${R.map(([x,y,w,h],i)=>`<g class="room${i===5?' ext':''}" data-room="${map[i]??''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" pathLength="1"/><text x="${x+w/2}" y="${y+h/2+4}">${esc(lab[i])}</text></g>`).join('')}
      <path class="door" pathLength="1" d="M132 140 a26 26 0 0 1 26 -26 M238 92 a24 24 0 0 0 -24 24 M238 170 a22 22 0 0 1 -22 -22"/>
      <path class="compass" d="M398 262 l6 -16 l6 16 l-6 -4z"/><text class="n" x="404" y="282">N</text>
    </svg>`;
  }
  // The home's level within the building.
  function stack(u,d){
    const F=fact(d,/Floors/)||6, h=Math.min(22,240/F), top=24, W=150;
    const rows=Array.from({length:F},(_,i)=>F-1-i).map((lv,i)=>{const y=top+i*h, me=lv===u.floor;
      return `<g class="lv${me?' me':''}"><rect x="40" y="${y}" width="${W-60}" height="${h-3}" pathLength="1"/><text class="lvn" x="32" y="${y+h/2+2}">${lv?lv:'G'}</text></g>`;}).join('');
    return `<svg class="stack" viewBox="0 0 ${W+90} ${top+F*h+20}" role="img" aria-label="${esc(u.name)} is on level ${u.floor} of ${F}">
      <path class="roof" d="M36 ${top-6} H${W-16}"/>${rows}<path class="ground" d="M10 ${top+F*h+4} H${W+80}"/>
      <text class="tag" x="${W-12}" y="${top+(F-1-u.floor)*h+h/2+2}">Level ${u.floor}</text></svg>`;
  }
  // Where the home sits on its level.
  function plate(u,d){
    const per=d.plate.perRow, w=380/per, me=u.plate;
    const cell=(i)=>{const row=i<per?0:1, col=i%per, x=20+col*w, y=row?140:30;
      return `<g class="pu${i===me?' me':''}"><rect x="${x+2}" y="${y}" width="${w-4}" height="80" pathLength="1"/>${i===me?`<text x="${x+w/2}" y="${y+45}">${esc(u.name.replace('Residence ',''))}</text>`:''}</g>`;};
    return `<svg class="plate" viewBox="0 0 420 270" role="img" aria-label="${esc(u.name)} on the level ${u.floor} floor plan, facing ${esc(d.plate.face)}">
      ${Array.from({length:per*2},(_,i)=>cell(i)).join('')}
      <rect class="core" x="170" y="114" width="80" height="22"/><text class="corel" x="210" y="129">Lifts · stairs</text>
      <text class="face" x="210" y="252">${esc(d.plate.face)} ↓</text>
      <path class="compass" d="M398 22 l6 -16 l6 16 l-6 -4z"/><text class="n" x="404" y="34">N</text></svg>`;
  }

  // ---------- page sections ----------
  const SECTIONS={
    cover(){
      const pr=P.profile, goals=S.context==='request'?'Your requests':'Your goals';
      const rows=[['Looking for',pr.looking],['Budget',pr.budget],['Handover',pr.handover],['Purpose',persona().purpose],['Areas',pr.areas]];
      return `<section class="cover" id="top" data-track="Cover">
        <div class="cv-media"><figure><span class="media"><img src="${esc(P.developer.cover||P.developer.hero)}" alt=""></span></figure></div>
        <div class="cv-main">
          <header class="cv-top rv">${logo(P.developer.brand)}<span class="cvl">Private proposal · ${esc(P.id)}</span><span class="cvl">${esc(P.issued)}</span></header>
          <div class="cv-title"><p class="cvl rv">Prepared for</p><h1 class="cover-name mask rv"><span>${esc(P.buyer.first)} ${esc(P.buyer.last)}</span></h1></div>
          <div class="cv-grid rv">
            <dl class="profile" aria-label="Your buyer profile">${rows.map(([t,d],i)=>`<div><span class="no" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><dt>${t}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
            <aside class="cv-goals" aria-label="${goals}"><p class="cvl">${goals}</p>
              <ol>${P.requirements.map(r=>`<li><span><b>${esc(r.ask)}</b><small>${esc(r.answer)}</small></span></li>`).join('')}</ol></aside>
          </div>
          <footer class="cv-foot cvl rv"><div>Prepared by<span>${esc(P.rep.name)}</span></div><div>${P.developments.length>1?'Developments':'Development'}<span>${P.developments.map(d=>esc(d.name)).join(', ')}</span></div><div>Prices valid until<span>${esc(P.validUntil)}</span></div><div>Contact<span>${esc(P.rep.phone)}</span></div></footer>
        </div>
      </section>`;
    },
    letter(){
      const r=P.rep, c=P.context, first=P.buyer.first;
      const open=S.context==='call'?`${first}, thanks for the call on ${c.day}.`:S.context==='request'?`${first}, thanks for getting in touch about ${c.place}.`:`${first}, thank you for coming to see ${c.place} on ${c.day}.`;
      return `<section class="letter" id="letter" data-track="Letter"><div class="wrap">
        <div class="letter-rep rv"><span class="mono" aria-hidden="true">${esc(r.initials)}</span><div><b>${esc(r.name)}</b><small>${esc(r.role)}</small></div></div>
        <div class="letter-body"><p class="first rv">${esc(open)}</p>${P.letter.map(p=>`<p class="rv">${esc(p)}</p>`).join('')}<p class="sig rv">${esc(repFirst)}</p></div>
      </div></section>`;
    },
    selection(){
      return `<section class="selection" id="selection" data-track="Your selection"><div class="wrap">
        ${head('Your selection','The properties you’re interested in.','Open a development for the full details, or a home for its plans, views and payments.')}
        ${P.developments.map(d=>{const us=unitsOf(d);return `<div class="sel-group rv" style="${vars(d.brand)}">
          <header class="sel-gh">${logo(d.brand)}<span class="sel-gmeta">${us.length} ${us.length>1?'homes':'home'} · Handover ${esc(handoverOf(d))}</span><button type="button" class="btn ghost sm" data-open="d-${d.id}">About ${esc(d.name)}</button></header>
          <div class="sel-row">
            <button type="button" class="sel-dev" data-open="d-${d.id}" aria-label="Open ${esc(d.name)}">
              <span class="media"><img src="${esc(d.hero)}" alt="" loading="lazy"></span>
              <span class="sel-dev-in"><span class="sel-meta">${esc(d.place)} · ${d.progress.pct}% built</span><span class="link">View development →</span></span>
            </button>
            <div class="sel-units">${us.map(ucard).join('')}</div>
          </div>
        </div>`;}).join('')}
      </div></section>`;
    },
    compare(){
      if(P.units.length<2&&P.developments.length<2) return '';
      return `<section class="compare" id="compare" data-track="Side by side"><div class="wrap">
        ${head('Side by side','Compare them.',null)}
        <div class="seg rv" role="tablist" aria-label="Compare">${[['homes','Homes'],['devs','Developments']].map(([k,l])=>`<button type="button" role="tab" aria-selected="${S.cmp===k}" data-cmp="${k}">${l}</button>`).join('')}</div>
        <div id="cmp-body">${cmpBody()}</div>
      </div></section>`;
    },
    developer(){
      const D=P.developer;
      return `<section class="developer" id="developer" data-track="About the developer"><div class="wrap">
        ${head('Built on trust',`Why buy from ${esc(D.name.split(' ')[0])}.`,null)}
        <div class="stats">${D.stats.map(s=>`<div class="stat rv"><b>${count(s.v,{suf:s.s||''})}</b><span>${esc(s.l)}</span></div>`).join('')}</div>
        <div class="delivered">${D.delivered.map(p=>`<figure class="rv"><div class="media"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"></div><figcaption><b>${esc(p.name)}</b><span>${esc(p.place)} · Delivered ${p.year}</span></figcaption></figure>`).join('')}</div>
        <ul class="promises">${D.promises.map(([t,x])=>`<li class="rv"><b>${esc(t)}</b><span>${esc(x)}</span></li>`).join('')}</ul>
      </div></section>`;
    },
    next(){
      const r=P.rep, res=S.reserved&&unit(S.reserved), req=[...S.requested].map(unit)[0];
      let body;
      if(res){const dep=res.price*res.pay[0].pct/100;
        body=`<h2 class="mask rv"><span>Book your promise of sale</span></h2>
          <p class="lede rv">${esc(res.name)} at ${esc(dev(res.dev).name)} is reserved for you. Pick a time to sign the promise of sale with ${esc(repFirst)} at the notary. The ${res.pay[0].pct}% deposit of ${eur(dep)} is paid on the day.</p>
          <div class="next-cta rv"><button type="button" class="btn primary" data-act="pos">Book your promise of sale</button></div>`;}
      else if(req){
        body=`<h2 class="mask rv"><span>${esc(repFirst)} is confirming your reservation</span></h2>
          <p class="lede rv">You asked to reserve ${esc(req.name)}. ${esc(repFirst)} will confirm by ${req.status==='held'?'Friday':'tomorrow'}. Once it’s confirmed, you can book the promise of sale here.</p>
          <div class="next-cta rv"><button type="button" class="btn primary" disabled>Book your promise of sale</button></div>`;}
      else{
        const def=(P.units.find(u=>u.status==='held')||P.units[0]).id;
        body=`<h2 class="mask rv"><span>Ready to reserve?</span></h2>
          <p class="lede rv">Choose a home and ${esc(repFirst)} will hold it while the paperwork is prepared. Nothing is charged until you sign the promise of sale.</p>
          <fieldset class="pick rv"><legend class="sr">Choose a home</legend>${P.units.map(u=>`<label><input type="radio" name="pick" value="${u.id}" ${u.id===def?'checked':''}><span><b>${esc(u.name)}</b><small>${esc(dev(u.dev).name)} · ${eur(u.price)}</small></span></label>`).join('')}</fieldset>
          <div class="next-cta rv"><button type="button" class="btn primary" data-act="reserve-pick">Reserve this home</button></div>`;}
      return `<section class="next" id="next" data-track="Next step"><div class="wrap narrow">
        <p class="kick rv">Your next step</p>${body}
        <div class="rep-card rv"><span class="mono" aria-hidden="true">${esc(r.initials)}</span><div><b>${esc(r.name)}</b><small>${esc(r.role)} · ${esc(P.developer.name)}</small></div>
          <div class="rep-act"><a class="btn ghost" href="https://wa.me/${esc(r.whatsapp)}" data-ev="WhatsApp tapped">WhatsApp</a><a class="btn ghost" href="tel:${esc(r.phone.replace(/\s/g,''))}" data-ev="Call tapped">Call</a><a class="btn ghost" href="mailto:${esc(r.email)}" data-ev="Email tapped">Email</a></div></div>
      </div></section>`;
    },
    footer(){
      return `<footer class="foot" data-track="Downloads"><div class="wrap">
        <div class="dl"><p class="kick">Downloads</p><ul>${P.downloads.map(([n,s])=>`<li><button type="button" data-dl="${esc(n)}"><span>${esc(n)}</span><small>${esc(s)}</small><i aria-hidden="true">↓</i></button></li>`).join('')}</ul></div>
        <p class="legal">${esc(P.legal)}</p>
        <div class="foot-meta">${logo(P.developer.brand,'sm')}<span>A private proposal for ${esc(P.buyer.first)} ${esc(P.buyer.last)} · Issue v${P.version} · ${esc(P.issued)} · Valid until ${esc(P.validUntil)}</span><span class="pw">Prepared with Bricly</span></div>
      </div></footer>`;
    },
  };

  function ucard(u){
    const [st,tone]=statusOf(u);
    return `<button type="button" class="ucard" data-open="u-${u.id}" aria-label="Open ${esc(u.name)}">
      <span class="media"><img src="${esc(u.renders[0])}" alt="" loading="lazy"></span>
      <span class="ucard-in"><span class="pill ${tone}">${st}</span><b>${esc(u.name)}</b><span class="ucard-spec">${spec(u)}</span><span class="ucard-view">${esc(u.view)}</span><span class="ucard-price">${eur(u.price)}</span></span>
    </button>`;
  }

  function cmpBody(){
    if(S.cmp==='devs'){
      const ds=P.developments;
      const near=d=>d.life.filter(l=>l.for.includes('all')||l.for.includes(S.type)).slice(0,2).map(l=>`${l.n} · ${l.d}`).join('<br>');
      const ROWS=[['Location',d=>esc(d.place)],['Handover',d=>esc(handoverOf(d))],['Build progress',d=>`${d.progress.pct}% · ${esc(d.progress.stage)}`],
        ['Homes in the building',d=>fact(d,/^Homes$/)],['Floors',d=>fact(d,/Floors/)],['Amenities',d=>d.amenities.map(a=>esc(a.n)).join('<br>')],['Close by',near],
        ['Price per m² today',d=>eur(d.market.now)],['Your homes here',d=>{const us=unitsOf(d);return `${us.length} · from ${eur(Math.min(...us.map(u=>u.price)))}`;}]];
      return `<p class="cmp-hint">Swipe to compare →</p><div class="cmp-scroll" tabindex="0" role="region" aria-label="Development comparison"><table class="cmp" style="--n:${ds.length}">
        <thead><tr><th scope="col"><span class="sr">Measure</span></th>${ds.map(d=>`<th scope="col" style="${vars(d.brand)}"><img src="${esc(d.hero)}" alt="" loading="lazy"><span class="dot"></span><b>${esc(d.name)}</b><small>${esc(d.place)}</small></th>`).join('')}</tr></thead>
        <tbody>${ROWS.map(([l,f])=>`<tr><th scope="row">${l}</th>${ds.map(d=>`<td>${f(d)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    const us=P.units;
    const ROWS={price:['Price',u=>eur(u.price)],size:['Internal area',u=>u.sqm+' m²'],ext:['Terrace',u=>u.ext+' m²'],floor:['Floor',u=>'Level '+u.floor],view:['View',u=>esc(u.view)],
      handover:['Handover',u=>esc(u.handover)],rent:['Estimated rent',u=>`${eur(u.invest.rent[0])}–${eur(u.invest.rent[1])} /mo`],yield:['Estimated gross yield*',u=>gross(u).toFixed(1)+'%'],
      occ:['Estimated occupancy*',u=>u.invest.occ+'%'],pricem2:['Price per m²',u=>eur(pm2(u))]};
    const rows=persona().compare;
    const best={yield:Math.max(...us.map(gross)),pricem2:Math.min(...us.map(pm2)),price:Math.min(...us.map(u=>u.price))};
    const isBest=(k,u)=>(k==='yield'&&gross(u)===best.yield)||(k==='pricem2'&&pm2(u)===best.pricem2)||(k==='price'&&u.price===best.price);
    return `<p class="cmp-hint">Swipe to compare →</p><div class="cmp-scroll" tabindex="0" role="region" aria-label="Home comparison"><table class="cmp" style="--n:${us.length}">
        <thead><tr><th scope="col"><span class="sr">Measure</span></th>${us.map(u=>`<th scope="col" style="${vars(dev(u.dev).brand)}"><button type="button" class="cmp-open" data-open="u-${u.id}"><img src="${esc(u.renders[0])}" alt="" loading="lazy"><span class="dot"></span><b>${esc(u.name)}</b><small>${esc(dev(u.dev).name)}</small></button></th>`).join('')}</tr></thead>
        <tbody>${rows.map(k=>`<tr><th scope="row">${ROWS[k][0]}</th>${us.map(u=>`<td class="${isBest(k,u)?'best':''}">${ROWS[k][1](u)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>${rows.some(k=>k==='yield'||k==='occ')?'<p class="disc">*Estimates based on comparable lettings. They are not guaranteed.</p>':''}`;
  }

  // ---------- panel content ----------
  function devTabs(d){
    const life=d.life.filter(l=>l.for.includes('all')||l.for.includes(S.type));
    const g=d.progress;
    return [
      ['overview','Overview',`<div class="pd-hero media"><img src="${esc(d.open||d.hero)}" alt="${esc(d.name)}"></div>
        <p class="pd-tag rv">${esc(d.tagline)}</p>
        <div class="facts rv">${d.facts.map(f=>`<div class="fact"><b>${count(f.v,{plain:f.plain})}</b><span>${esc(f.l)}</span></div>`).join('')}</div>
        <p class="pd-story rv">${esc(d.story)}</p>`],
      ['amenities','Amenities',`<h3 class="pn-h3">Amenities</h3><div class="amen">${d.amenities.map(a=>`<figure class="rv"><div class="media"><img src="${esc(a.img)}" alt="" loading="lazy"></div><figcaption>${esc(a.n)}</figcaption></figure>`).join('')}</div>`],
      ['location','Location',`<h3 class="pn-h3">${esc(persona().lifeTitle)}</h3><ul class="life">${life.map(l=>`<li class="rv"><span class="media"><img src="${esc(l.img)}" alt="" loading="lazy"></span><span><b>${esc(l.n)}</b><small>${esc(l.d)}</small></span></li>`).join('')}</ul>`],
      ['progress','Progress',`<h3 class="pn-h3">${g.pct}% built · ${esc(g.stage)}</h3><div class="prog-grid">
          <figure class="rv"><div class="media"><img src="${esc(g.photo)}" alt="Construction progress at ${esc(d.name)}" loading="lazy"></div><figcaption>${esc(g.date)}</figcaption></figure>
          <div><div class="bar rv" role="progressbar" aria-valuenow="${g.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Build progress"><i style="--w:${g.pct}%"></i></div>
          <ol class="tl">${d.timeline.map(t=>`<li class="rv ${t.done?'done':''} ${t.now?'now':''}"><span class="pt" aria-hidden="true"></span><b>${esc(t.l)}</b><small>${esc(t.d)}</small></li>`).join('')}</ol></div></div>`],
      ['homes','Your homes',`<h3 class="pn-h3">Your homes at ${esc(d.name)}</h3><div class="pd-units">${unitsOf(d).map(ucard).join('')}</div>`],
    ];
  }
  function unitTabs(u,d){
    const [st,tone]=statusOf(u), F=fact(d,/Floors/)||6;
    const money=u.pay.map(p=>({...p,amt:u.price*p.pct/100}));
    const tabs=[
      ['overview','Overview',`<div class="pu-ov"><div class="media pu-ov-media"><img src="${esc(u.renders[0])}" alt="${esc(u.name)}, ${esc(u.finish)}"></div>
        <div class="pu-ov-side"><span class="pill ${tone}">${st}</span>
          <dl class="keys"><div><dt>Bedrooms</dt><dd>${u.beds}</dd></div><div><dt>Bathrooms</dt><dd>${u.baths}</dd></div><div><dt>Internal</dt><dd>${u.sqm} m²</dd></div><div><dt>Terrace</dt><dd>${u.ext} m²</dd></div><div><dt>Aspect</dt><dd>${esc(u.aspect)}</dd></div><div><dt>View</dt><dd>${esc(u.view)}</dd></div></dl>
        </div></div>
        <p class="u-note rv"><span class="mono sm" aria-hidden="true">${esc(P.rep.initials)}</span>${esc(u.note)}</p>`],
      ['views','Renders and views',`<h3 class="pn-h3">Renders</h3>
        <div class="gal" data-gal="${u.id}"><div class="gal-main media"><img src="${esc(u.renders[0])}" alt="${esc(u.name)}"></div>
          <div class="gal-thumbs" role="tablist" aria-label="${esc(u.name)} renders">${u.renders.map((r,i)=>`<button type="button" role="tab" aria-selected="${!i}" data-src="${esc(r)}" class="${i?'':'on'}"><img src="${esc(r)}" alt="" loading="lazy"></button>`).join('')}</div>
          <p class="gal-cap">${esc(u.layout)} · ${esc(u.finish)} · images are indicative</p></div>
        ${u.views&&u.views.length?`<h3 class="pn-h3">Views from this home</h3><div class="views">${u.views.map(v=>`<figure class="rv"><div class="media"><img src="${esc(v.img)}" alt="" loading="lazy"></div><figcaption>${esc(v.l)}</figcaption></figure>`).join('')}</div>`:''}`],
      ['plan','Floor plan',`<h3 class="pn-h3">Floor plan</h3><div class="u-plan"><div class="rv">${plan(u)}</div>
        <div class="rooms rv"><ul>${u.rooms.map((r,i)=>`<li data-room="${i}" tabindex="0"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></li>`).join('')}</ul>
          <p class="kick">In your ${esc(u.finish.toLowerCase())}</p><ul class="spec">${u.spec.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div></div>`],
      ['position','In the building',`<h3 class="pn-h3">Level ${u.floor} of ${F} · faces the ${esc(d.plate.face)}</h3>
        <div class="pos rv"><figure>${stack(u,d)}<figcaption>Level in the building</figcaption></figure><figure>${plate(u,d)}<figcaption>Where it sits on level ${u.floor} · ${esc(u.aspect)} aspect</figcaption></figure></div>`],
      ['payment','Payment plan',`<h3 class="pn-h3">Payment plan</h3>
        <div class="pay-bar rv" aria-hidden="true">${money.map(p=>`<i style="--w:${p.pct}%"><span>${p.pct}%</span></i>`).join('')}</div>
        <ol class="pay-rows">${money.map(p=>`<li><span class="pct">${p.pct}%</span><span class="lbl">${esc(p.label)}<small>${esc(p.when)}</small></span><b>${count(p.amt,{pre:'€'})}</b></li>`).join('')}</ol>`],
    ];
    if(S.type==='investment') tabs.push(['investment','Investment',`<h3 class="pn-h3">Investment view</h3>
      <div class="kpis rv"><div><b>${eur(u.invest.rent[0])}–${eur(u.invest.rent[1])}</b><span>Estimated rent / month*</span></div><div><b>${gross(u).toFixed(1)}%</b><span>Estimated gross yield*</span></div><div><b>${net(u).toFixed(1)}%</b><span>Estimated net yield after fees*</span></div><div><b>${u.invest.occ}%</b><span>Estimated occupancy*</span></div></div>
      <p class="disc">*Estimates from comparable lettings near ${esc(d.name)}. They are not guaranteed and can go down as well as up. Service charge estimate ${eur(u.invest.fees)} a year.</p>`]);
    if(S.type==='growth') tabs.push(['investment','Value',`<h3 class="pn-h3">Value view</h3>
      <div class="kpis rv"><div><b>${eur(d.market.launch)}</b><span>Price per m² at launch</span></div><div><b>${eur(d.market.now)}</b><span>Price per m² today</span></div><div><b>${eur(pm2(u))}</b><span>This home per m²</span></div><div><b>+${((d.market.now/d.market.launch-1)*100).toFixed(1)}%</b><span>Since launch</span></div></div>
      <p class="disc">Past price movement at ${esc(d.name)}. It is not a forecast of future value.</p>`]);
    return tabs;
  }
  function unitFoot(u){
    const res=S.reserved===u.id, req=S.requested.has(u.id), held=u.status==='held';
    const line=res?'Reserved for you':req?`Reservation requested · ${repFirst} will confirm`:held?`On hold for you until ${u.hold}`:dev(u.dev).remaining;
    const cta=res?`<button type="button" class="btn primary" data-act="pos">Book your promise of sale</button>`
      :`<button type="button" class="btn primary" data-reserve="${u.id}"${req?' disabled>Reservation requested':'>Reserve this home'}</button>`;
    return `<footer class="pn-f"><div><b>${eur(u.price)}</b><span>${esc(line)}</span></div><div class="pn-f-act"><button type="button" class="btn ghost" data-ask="${u.id}">Ask ${esc(repFirst)}</button>${cta}</div></footer>`;
  }

  // ---------- panel ----------
  const panel=()=>document.getElementById('panel');
  function openPanel(id,sub){
    const dlg=panel();
    S.cur=id; renderPanel(sub);
    if(!dlg.open){dlg.showModal();document.body.classList.add('panel-open');}
  }
  let pio,spy;
  function renderPanel(sub){
    const dlg=panel(), id=S.cur, isU=id.startsWith('u-');
    const u=isU?unit(id.slice(2)):null, d=isU?dev(u.dev):dev(id.slice(2)), name=isU?u.name:d.name;
    const tabs=isU?unitTabs(u,d):devTabs(d);
    dlg.setAttribute('style',vars(d.brand));
    dlg.setAttribute('aria-label',name);
    // Switcher: every development, and the homes in it, one tap away.
    const sw=`<nav class="pn-sw" aria-label="Developments and homes">${P.developments.map(x=>`<div class="pn-sw-g${x.id===d.id?' on':''}">
        <button type="button" class="pn-sw-d" data-open="d-${x.id}"${!isU&&x.id===d.id?' aria-current="page"':''}>${esc(x.name)}</button>
        ${unitsOf(x).map(y=>`<button type="button" class="pn-sw-u" data-open="u-${y.id}"${isU&&y.id===u.id?' aria-current="page"':''}>${esc(y.name.replace('Residence ',''))}</button>`).join('')}
      </div>`).join('<span class="pn-sw-div" aria-hidden="true"></span>')}</nav>`;
    dlg.innerHTML=`<div class="pn">
      <header class="pn-h">${sw}<button type="button" class="pn-x" data-close aria-label="Close">×</button></header>
      <div class="pn-title-row">${isU?`<p class="kick">${esc(d.name)} · Level ${u.floor}</p><h2 class="pn-t">${esc(name)}</h2>`:`${logo(d.brand)}`}</div>
      <nav class="pn-nav" aria-label="${esc(name)} sections">${tabs.map(([k,l],i)=>`<a href="#p-${k}" data-tab="${k}" class="${i?'':'on'}">${l}</a>`).join('')}</nav>
      <div class="pn-body" id="pn-body">${tabs.map(([k,l,h])=>`<section class="pn-s" id="p-${k}" data-track="${esc(name)} · ${l}">${h}</section>`).join('')}</div>
      ${isU?unitFoot(u):''}</div>`;
    const body=dlg.querySelector('#pn-body');
    pio&&pio.disconnect(); spy&&spy.disconnect();
    pio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('in');e.target.querySelectorAll('[data-count]').forEach(countUp);pio.unobserve(e.target);}),{root:body,threshold:.1});
    body.querySelectorAll('.pn-s,.rv,.media').forEach(el=>pio.observe(el));
    const seen=new Set();
    spy=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const k=e.target.id.slice(2);
      dlg.querySelectorAll('.pn-nav a').forEach(a=>{const on=a.dataset.tab===k;a.classList.toggle('on',on);if(on){a.setAttribute('aria-current','true');a.scrollIntoView({block:'nearest',inline:'nearest'});}else a.removeAttribute('aria-current');});
      if(!seen.has(k)){seen.add(k);track('Viewed · '+e.target.dataset.track);}}),{root:body,rootMargin:'0px 0px -75% 0px'});
    body.querySelectorAll('.pn-s').forEach(el=>spy.observe(el));
    body.scrollTop=0;
    dlg.querySelector('.pn-sw [aria-current]')?.scrollIntoView({block:'nearest',inline:'center'});
    if(sub){const t=body.querySelector('#p-'+sub);if(t) requestAnimationFrame(()=>{body.scrollTop=t.offsetTop-body.offsetTop;});}
    track('Opened · '+name);
  }
  function closePanel(){const dlg=panel();if(dlg.open)dlg.close();}

  // ---------- render ----------
  const TEMPLATES={
    signature:{name:'Signature',cls:'t-signature',order:['cover','letter','selection','compare','developer','next','footer']},
  };
  window.PROPOSAL_TEMPLATES=TEMPLATES;

  function render(){
    const t=TEMPLATES[S.template]||TEMPLATES.signature, keep=['intro-open','panel-open'].filter(c=>document.body.classList.contains(c));
    document.body.className=[t.cls,'type-'+S.type,...keep].join(' ');
    document.documentElement.setAttribute('style',vars(P.developer.brand));
    document.getElementById('main').innerHTML=t.order.map(k=>SECTIONS[k](t)).join('');
    document.getElementById('bar-logo').innerHTML=logo(P.developer.brand);
    document.getElementById('bar-for').textContent=`Prepared for ${P.buyer.first} ${P.buyer.last}`;
    document.getElementById('bar-cta').textContent=`Talk to ${repFirst}`;
    fabRender(); wire();
  }
  function refreshState(){
    const y=scrollY; render(); scrollTo(0,y);
    document.querySelectorAll('#main .rv,#main .media').forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight)el.classList.add('in');});
    if(panel().open) {const b=panel().querySelector('#pn-body'),st=b.scrollTop;renderPanel();panel().querySelector('#pn-body').scrollTop=st;}
  }

  // ---------- floating call to action: one tap, follows the buyer, changes with the deal ----------
  function fabState(){
    const held=P.units.find(u=>u.status==='held');
    if(S.reserved) return {k:'pos',label:'Book promise of sale'};
    if(S.requested.size) return {k:'talk',label:`Contact ${repFirst}`};
    if(held) return {k:'reserve:'+held.id,label:'Reserve unit'};
    return {k:'pick',label:'Reserve unit'};
  }
  function fabRender(){
    const f=fabState();
    document.getElementById('fab').innerHTML=`<button type="button" id="fab-go" data-fab="${f.k}">${esc(f.label)}<i aria-hidden="true">→</i></button>`;
  }
  function fabAct(k){
    if(k==='pos'){toast(`${repFirst} will send you times for the promise of sale today.`);return;}
    if(k==='talk'){document.getElementById('next').scrollIntoView({behavior:reduce()?'auto':'smooth'});return;}
    if(k.startsWith('reserve:')){openReserve(k.slice(8));return;}
    document.getElementById('next').scrollIntoView({behavior:reduce()?'auto':'smooth'});
  }

  // ---------- engagement (in the product these post to the opportunity timeline) ----------
  function track(what){
    const t=new Date().toTimeString().slice(0,5);
    S.events.unshift({t,what}); S.events=S.events.slice(0,30);
    const el=document.getElementById('demo-ev'); if(el) el.innerHTML=S.events.map(e=>`<li><span>${e.t}</span> ${esc(e.what)}</li>`).join('');
  }

  // ---------- motion ----------
  let io,dwell;
  function countUp(el){
    const v=+el.dataset.count, pre=el.dataset.pre||'', suf=el.dataset.suf||'', dec=String(v).includes('.')?1:0;
    if(reduce()){el.textContent=pre+v.toLocaleString('en-GB',{minimumFractionDigits:dec})+suf;return;}
    const t0=performance.now(), D=1400;
    (function f(now){const k=Math.min(1,(now-t0)/D), e=1-Math.pow(1-k,3);el.textContent=pre+(v*e).toLocaleString('en-GB',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;if(k<1)requestAnimationFrame(f);})(t0);
  }
  function wire(){
    io&&io.disconnect(); dwell&&dwell.disconnect();
    io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;el.classList.add('in');el.querySelectorAll('[data-count]').forEach(countUp);io.unobserve(el);}),{rootMargin:'0px 0px -8% 0px',threshold:.12});
    document.querySelectorAll('#main .rv,#main .media,#main .cover').forEach(el=>io.observe(el));
    const seen=new Set();
    dwell=new IntersectionObserver(es=>es.forEach(e=>{const k=e.target.dataset.track;if(e.isIntersecting&&!seen.has(k)){seen.add(k);track('Viewed · '+k);}}),{threshold:.35});
    document.querySelectorAll('#main [data-track]').forEach(el=>dwell.observe(el));
  }

  // ---------- interaction ----------
  document.addEventListener('click',e=>{
    const t=e.target;
    const o=t.closest('[data-open]'); if(o){openPanel(o.dataset.open);return;}
    if(t.closest('[data-close]')){closePanel();return;}
    const tab=t.closest('.pn-nav a'); if(tab){e.preventDefault();const b=panel().querySelector('#pn-body'),s=b.querySelector('#p-'+tab.dataset.tab);b.scrollTo({top:s.offsetTop-b.offsetTop,behavior:reduce()?'auto':'smooth'});track('Panel tab · '+tab.textContent);return;}
    const c=t.closest('[data-cmp]'); if(c){S.cmp=c.dataset.cmp;document.querySelectorAll('[data-cmp]').forEach(b=>b.setAttribute('aria-selected',b===c));document.getElementById('cmp-body').innerHTML=cmpBody();track('Compare · '+c.textContent);return;}
    const th=t.closest('.gal-thumbs button');
    if(th){const gl=th.closest('.gal'), img=gl.querySelector('.gal-main img');gl.querySelectorAll('.gal-thumbs button').forEach(b=>{b.classList.toggle('on',b===th);b.setAttribute('aria-selected',b===th);});
      img.classList.add('swap');setTimeout(()=>{img.src=th.dataset.src;img.onload=()=>img.classList.remove('swap');if(img.complete)img.classList.remove('swap');},reduce()?0:260);track('Gallery · '+gl.dataset.gal);return;}
    const rs=t.closest('[data-reserve]'); if(rs){openReserve(rs.dataset.reserve);return;}
    if(t.closest('[data-act="reserve-pick"]')){const v=document.querySelector('input[name="pick"]:checked');if(v)openReserve(v.value);return;}
    if(t.closest('[data-act="pos"]')){track('Promise of sale booking opened');toast(`${repFirst} will send you times for the promise of sale today.`);return;}
    const fab=t.closest('#fab-go'); if(fab){track('Floating action · '+fab.textContent.trim());fabAct(fab.dataset.fab);return;}
    const ask=t.closest('[data-ask]'); if(ask){track('Asked about · '+unit(ask.dataset.ask).name);toast(`${repFirst} has your question about ${unit(ask.dataset.ask).name}. Expect a reply on WhatsApp shortly.`);return;}
    const dl=t.closest('[data-dl]'); if(dl){track('Downloaded · '+dl.dataset.dl);toast(dl.dataset.dl+' is downloading.');return;}
    const ev=t.closest('[data-ev]'); if(ev){track(ev.dataset.ev);e.preventDefault();toast('Opens '+ev.textContent+' with '+repFirst+'.');}
  });
  document.addEventListener('pointerover',e=>{const r=e.target.closest('.rooms li[data-room]');if(r)hl(r);});
  document.addEventListener('focusin',e=>{const r=e.target.closest('.rooms li[data-room]');if(r)hl(r);});
  function hl(li){const u=li.closest('.pn-s');u.querySelectorAll('.room').forEach(g=>g.classList.toggle('hl',g.dataset.room===li.dataset.room));u.querySelectorAll('.rooms li').forEach(x=>x.classList.toggle('hl',x===li));}

  addEventListener('scroll',()=>{const h=document.documentElement;document.getElementById('bar-prog').style.transform=`scaleX(${h.scrollTop/(h.scrollHeight-h.clientHeight)||0})`;
    document.getElementById('bar').classList.toggle('solid',h.scrollTop>window.innerHeight*.5);const nx=document.getElementById('next'), r=nx&&nx.getBoundingClientRect();document.getElementById('fab').classList.toggle('on',h.scrollTop>window.innerHeight*.35&&!(r&&r.top<innerHeight*.8&&r.bottom>0));},{passive:true});

  let tt; function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),3200);}

  // ---------- reserve ----------
  function openReserve(id){
    const u=unit(id), d=dev(u.dev), dlg=document.getElementById('reserve'), held=u.status==='held';
    dlg.setAttribute('style',vars(d.brand));
    dlg.innerHTML=`<form method="dialog" class="rs">
      <button class="rs-x" value="cancel" aria-label="Close">×</button>
      <div class="rs-media"><img src="${esc(u.renders[0])}" alt=""></div>
      <div class="rs-body">
        <p class="kick">${esc(d.name)} · Level ${u.floor}</p><h2>Reserve ${esc(u.name)}</h2>
        <p class="rs-price">${eur(u.price)} · ${u.beds} bed · ${u.sqm} m²${held?` · on hold for you until ${esc(u.hold)}`:''}</p>
        <ol class="rs-steps"><li><b>Request</b><span>Send this request. It doesn’t commit you to anything.</span></li><li><b>${esc(repFirst)} confirms</b><span>Within 24 hours, ${esc(repFirst)} holds the home and sends the reservation form.</span></li><li><b>Promise of sale</b><span>Sign at the notary with a ${u.pay[0].pct}% deposit of ${eur(u.price*u.pay[0].pct/100)}.</span></li><li><b>Handover</b><span>${esc(u.handover)}. The rest is paid as in your payment plan.</span></li></ol>
        <div class="rs-f"><label>Full name<input name="n" required value="${esc(P.buyer.first+' '+P.buyer.last)}" autocomplete="name"></label>
          <label>Best way to reach you<select name="c"><option>WhatsApp</option><option>Phone call</option><option>Email</option></select></label>
          <label class="full">Anything ${esc(repFirst)} should know? <small>(optional)</small><textarea name="m" rows="2"></textarea></label></div>
        <div class="rs-a"><button class="btn ghost" value="cancel">Not yet</button><button class="btn primary" value="send" id="rs-send">Send reservation request</button></div>
      </div></form>`;
    dlg.querySelector('#rs-send').addEventListener('click',ev=>{ev.preventDefault();
      const ch=dlg.querySelector('select').value;
      dlg.querySelector('.rs-body').innerHTML=`<div class="rs-done"><span class="tick" aria-hidden="true"></span><p class="kick">Request sent</p><h2>We’ve sent your request to ${esc(repFirst)}.</h2><p>${esc(repFirst)} will confirm ${esc(u.name)} by ${held?'Friday':'tomorrow'} on ${esc(ch)}. Nothing is charged until you sign the promise of sale.</p><button class="btn primary" value="close">Back to your proposal</button></div>`;
      track('Reservation requested · '+u.name); S.requested.add(u.id); refreshState();});
    dlg.showModal(); track('Reserve opened · '+u.name);
  }

  // ---------- intro: plays for ~2 s, then opens the proposal on its own ----------
  function intro(){
    const k='bricly.proposal.seen.'+P.token, back=!!localStorage.getItem(k)&&!qs.has('intro');
    const el=document.getElementById('intro'), b=P.developer.brand;
    el.setAttribute('style',vars(b));
    el.innerHTML=`<div class="in-c">${logo(b,'engr i1')}<i class="in-rule" aria-hidden="true"></i>
        <p class="in-for i3">${back?'Welcome back':'This proposal is for'}</p>
        <h1 class="in-name"><span>${esc(P.buyer.first)}</span></h1>
        <p class="in-by i5">Prepared by ${esc(P.rep.name)}</p></div>`;
    document.body.classList.add('intro-open'); el.classList.remove('out','play'); el.classList.toggle('short',back); el.hidden=false;
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('play')));
    let done=false;
    const finish=()=>{if(done)return;done=true;clearTimeout(timer);localStorage.setItem(k,'1');el.classList.add('out');document.body.classList.remove('intro-open');track(back?'Returned to proposal':'Opened proposal');
      document.querySelector('.cover')?.classList.add('in');document.querySelectorAll('.cover .rv').forEach(x=>x.classList.add('in'));
      setTimeout(()=>{el.hidden=true;el.classList.remove('out','play');},reduce()?200:1100);};
    const timer=setTimeout(finish,back?1300:2300);
    el.onclick=finish;
  }

  // ---------- prototype controls (not part of the buyer page) ----------
  function demo(){
    const box=document.getElementById('demo');
    const sel=(id,label,opts,val)=>`<label>${label}<select id="${id}">${opts.map(([k,v])=>`<option value="${k}" ${k===val?'selected':''}>${v}</option>`).join('')}</select></label>`;
    box.innerHTML=`<button type="button" class="demo-t" aria-expanded="false">Prototype</button><div class="demo-p" hidden>
      ${sel('demo-type','Buyer type',Object.entries(PERSONAS).map(([k,v])=>[k,v.label]),S.type)}
      ${sel('demo-ctx','How they reached us',[['viewing','Viewing'],['call','Call'],['request','Enquiry or request']],S.context)}
      ${sel('demo-res','Reservation',[['','Nothing reserved'],...P.units.map(u=>[u.id,'Reserved · '+u.name])],S.reserved||'')}
      ${sel('demo-tpl','Template',Object.entries(TEMPLATES).map(([k,v])=>[k,v.name]),S.template)}
      <label class="chk"><input type="checkbox" id="demo-rm"> Reduce motion</label>
      <button type="button" id="demo-intro" class="btn ghost sm">Replay intro</button>
      <p class="demo-h">What ${esc(repFirst)} sees</p><ol id="demo-ev"></ol></div>`;
    const t=box.querySelector('.demo-t'), p=box.querySelector('.demo-p');
    t.onclick=()=>{p.hidden=!p.hidden;t.setAttribute('aria-expanded',!p.hidden);};
    box.querySelector('#demo-type').onchange=e=>{S.type=e.target.value;refreshState();track('Buyer type preview · '+persona().label);};
    box.querySelector('#demo-ctx').onchange=e=>{S.context=e.target.value;refreshState();};
    box.querySelector('#demo-res').onchange=e=>{S.reserved=e.target.value||null;S.requested.clear();refreshState();};
    box.querySelector('#demo-tpl').onchange=e=>{S.template=e.target.value;refreshState();};
    box.querySelector('#demo-rm').onchange=e=>{document.documentElement.classList.toggle('rm',e.target.checked);};
    box.querySelector('#demo-intro').onclick=()=>{localStorage.removeItem('bricly.proposal.seen.'+P.token);closePanel();scrollTo(0,0);intro();};
  }

  document.getElementById('panel').addEventListener('close',()=>{S.cur=null;pio&&pio.disconnect();spy&&spy.disconnect();panel().innerHTML='';document.body.classList.remove('panel-open');});
  document.getElementById('panel').addEventListener('click',e=>{if(e.target===e.currentTarget)closePanel();});

  window.PROPOSAL_APP={render,state:S,track,openPanel};
  render(); demo(); intro();
})();
