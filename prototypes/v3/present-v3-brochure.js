/* Present Mode v3 · Presentation: per-development branded pages, the dark glass
 * navigation (home, development switcher, page switcher, selection), the
 * availability list / by-floor views and the selected-units panel.
 */
(() => {
  'use strict';
  const P = window.PV3, D = P.D, {esc, I, eur, kEur} = P;
  const S = () => P.S;
  const R = () => P.render();
  const A = P.actions;

  // Slide order follows the buyer's focus: investors see the numbers early, home buyers the lifestyle.
  const ORDER = {home:['splash','intro','lifestyle','amenities','location','ownership','types','availability','walkthrough','gallery','plans'],
    investor:['splash','intro','ownership','types','availability','location','amenities','lifestyle','walkthrough','gallery','plans']};
  const secs = () => ORDER[S()?.focus] || ORDER.home;
  const pageOf = id => id === 'splash' ? 'intro' : id;
  Object.defineProperty(P,'SECS',{get:secs});
  const pageLabel = i => P.t(D.PAGES.find(p => p.id === pageOf(secs()[i]))?.label || '');

  // Selection (hearts). Items carry the finish and render style chosen for them.
  P.toggleSel = uid => {
    const s = S(), u = D.register(uid); if (!u) return;
    const i = s.sel.findIndex(x => x.uid === uid);
    // Reserved, sold or held for someone else: it can be removed from a selection, never added.
    if (i < 0 && P.canTake && !P.canTake(u)) { P.toast(`${uid} is ${P.statusText(u).toLowerCase()} and can’t be added`); return; }
    if (i > -1) s.sel.splice(i,1);
    else s.sel.push({uid,dev:DEV(u.dev).id,finish:P.unitFinish(uid),layout:P.unitLayout(uid),style:s.style,added:P.now(),cmp:s.sel.filter(x => x.cmp).length < 4});
    s.output = null; P.persist(); R();
  };
  const heart = (uid,cls = 'pv-add') => { const on = P.isSel(uid), pop = S().popSel === uid, u = D.unit(uid), no = !on && P.canTake && !P.canTake(u);
    if (no) return `<span class="${cls} off" aria-label="${esc(uid)} is ${esc(P.statusText(u))}" title="${esc(P.statusText(u))} · can’t be added">${I('block')}</span>`;
    return `<button class="${cls} ${on ? 'on' : ''} ${pop ? 'pop' : ''}" data-a="heart" data-v="${esc(uid)}" data-stop aria-pressed="${on}" aria-label="${on ? 'Remove '+esc(uid)+' from' : 'Add '+esc(uid)+' to'} selection">${I(on ? 'check' : 'add')}</button>`; };
  P.heart = heart;
  A.heart = v => { S().popSel = v; P.toggleSel(v); S().popSel = null; };

  // Navigation bar shared by the presentation and unit pages.
  P.navBar = (extra = '',right = null) => {
    const s = S(), d = DEV(s.dev), n = s.sel.length;
    const page = s.screen === 'unit' ? 'Units and Availability' : pageLabel(s.sec);
    return `<div class="pv-top"><div class="r">${extra}
      <button class="pv-chip sq" data-a="home" aria-label="Home · all developments">${P.WAVES}</button>
      <button class="pv-chip pv-trigger" data-a="panel" data-v="devs" aria-expanded="${s.panel === 'devs'}" aria-label="Development: ${esc(d.name)}">${esc(d.name)}${I('expand_more')}</button>
      <button class="pv-chip pv-trigger" data-a="panel" data-v="pages" aria-expanded="${s.panel === 'pages'}" data-page-label>${esc(page)}${I('expand_more')}</button>
      ${s.screen === 'unit' ? `<span class="pv-chip">${esc(s.unit)}</span>` : ''}</div>
      <div class="r">${right ?? `<button class="pv-chip pv-selchip ${S().popSel ? 'bump' : ''}" data-a="panel" data-v="sel" aria-expanded="${s.panel === 'sel'}">${n} ${P.t('Selected')}</button>`}${P.closeBtn()}</div></div>
      ${s.panel === 'devs' ? devPanel() : s.panel === 'pages' ? pagePanel() : s.panel === 'sel' ? selPanel() : ''}`;
  };
  function devPanel() {
    const s = S(), ids = [...new Set([...s.queue,s.dev])];
    return `<div class="pv-panel pv-devpanel" data-pk="devs" style="left:60px;top:60px;width:300px" role="dialog" aria-label="Developments">
      <div class="pv-panel-h">Developments<small>${ids.length}</small></div>
      ${ids.map(id => { const d = DEV(id), cur = id === s.dev; return `<button class="pv-row ${cur ? 'on' : ''}" data-a="devSwitch" data-v="${id}" aria-current="${cur}"><img src="${esc(P.devPhoto(d))}" alt=""><div class="t"><b>${esc(d.name)}</b><small>${cur ? 'Current development' : 'In this presentation'}</small></div>${cur ? I('check') : ''}</button>`; }).join('')}
      <button class="pv-row" data-a="home" style="min-height:44px;justify-content:center;color:var(--secondary)">${I('add')}Add developments</button></div>`;
  }
  function pagePanel() {
    const s = S(), d = DEV(s.dev), cur = s.screen === 'unit' ? 'availability' : pageOf(secs()[s.sec]);
    const pages = secs().filter(id => id !== 'splash').map(id => D.PAGES.find(p => p.id === id)).filter(Boolean);
    const seg = (a,opts,v) => `<div class="pv-seg" style="margin:0">${opts.map(([k,l]) => `<button data-a="${a}" data-v="${k}" aria-pressed="${v === k}">${l}</button>`).join('')}</div>`;
    return `<div class="pv-panel pv-pagepanel" data-pk="pages" data-keep="pages" style="left:248px;top:60px;width:300px;max-height:calc(100% - 80px);overflow:auto" role="dialog" aria-label="Pages">
      <div class="pv-panel-h">${esc(d.name)}<small>${pages.length} pages</small></div>
      ${pages.map((p,i) => { const on = p.id === cur;
        return `<button class="pv-row ${on ? 'on' : ''}" style="min-height:38px;padding:4px 10px;gap:12px" data-a="pageGo" data-v="${p.id}" aria-current="${on}">${I(p.icon)}<div class="t"><b>${P.t(p.label)}</b><small>${p.group}</small></div>${on ? I('check') : `<small style="color:var(--secondary)">${String(i+1).padStart(2,'0')}</small>`}</button>`; }).join('')}
      <div class="pv-panel-h" style="padding-top:12px">Presenter controls</div>
      <div class="pv-ctl"><span>Buyer focus</span>${seg('focus',[['home','Home'],['investor','Investor']],s.focus)}</div>
      <button class="pv-optrow" data-a="hidePrices" aria-pressed="${s.hidePrices}"><span>Hide prices <small class="pv-muted">· Shift+P</small></span><span class="pv-toggle ${s.hidePrices ? 'on' : ''}"></span></button>
      ${P.prefsRows(true)}
      ${s.partner ? '' : `<button class="pv-row" style="min-height:44px;padding:4px 10px" data-a="liveShare">${I('cast')}<div class="t"><b>${s.live ? 'Live view is on' : 'Share a live view'}</b><small>${s.live ? 'Copy the link again' : 'Family abroad follow along in their browser'}</small></div></button>`}</div>`;
  }

  function selPanel() {
    const s = S(), devs = new Set(s.sel.map(i => i.dev)), nc = s.sel.filter(i => i.cmp).length;
    return `<div class="pv-panel pv-selpanel" data-pk="sel" role="dialog" aria-label="Selected units">
      <div class="pv-panel-h" style="flex-direction:column;align-items:flex-start;gap:0">Selected units<small>${s.sel.length} unit${s.sel.length === 1 ? '' : 's'} · ${devs.size} development${devs.size === 1 ? '' : 's'}</small></div>
      ${s.sel.length ? s.sel.map(i => { const u = D.unit(i.uid), d = DEV(u.dev); return `<div class="pv-selrow"><button style="display:flex;gap:12px;flex:1;min-width:0;text-align:left;align-items:center" data-a="openUnit" data-v="${esc(i.uid)}"><img src="${esc(P.unitImg(i.uid))}" alt=""><div class="t"><small>${esc(d.name)}</small><b>Unit ${esc(u.id)}</b><div class="meta">${esc(u.type)}<span>${I('bed')}${u.beds}</span><span>${I('bathtub')}${u.baths}</span></div></div><span class="p">${P.fmt(P.unitPrice(i.uid,i.finish),u)}</span></button>
        <button class="pv-check ${i.cmp ? 'on' : ''}" data-a="cmpToggle" data-v="${esc(i.uid)}" aria-pressed="${i.cmp}" aria-label="Compare ${esc(u.id)}" ${!i.cmp && nc >= 4 ? 'disabled' : ''}>${i.cmp ? I('check') : ''}</button></div>`; }).join('')
      : '<div class="pv-sel-empty">Tap + on any residence to add it here.<br>Your selection carries across developments.</div>'}
      <button class="pv-show" data-a="compare" ${nc ? '' : 'disabled'} style="${nc ? '' : 'opacity:.5'}">Compare ${nc} unit${nc === 1 ? '' : 's'}</button></div>`;
  }
  A.panel = v => { S().panel = S().panel === v ? null : v; R(); };
  A.cmpToggle = v => { const i = S().sel.find(x => x.uid === v); if (!i) return; if (!i.cmp && S().sel.filter(x => x.cmp).length >= 4) return; i.cmp = !i.cmp; S().output = null; R(); };
  A.home = () => { S().panel = null; P.go('gallery'); };
  A.devSwitch = v => { const s = S(); s.panel = null; if (v === s.dev && s.screen === 'present') { R(); return; } const sec = s.screen === 'unit' ? secs().indexOf('availability') : s.sec > 1 ? s.sec : 0; P.startDev(v,{sec}); };
  A.pageGo = v => { const s = S(); s.panel = null; const i = secs().indexOf(v); if (s.screen !== 'present') { s.sec = i; P.go('present'); return; } R(); lastNav = 0; P.goSec(i); };
  A.openUnit = v => { S().panel = null; P.openUnit(v); };

  // Slideshow: one full-screen slide at a time. The outgoing slide stays where it is and
  // fades while the incoming slide's choreography plays, so nothing ever scrolls.
  let lastNav = 0;
  P.goSec = i => {
    const s = S(); i = Math.max(0,Math.min(secs().length-1,i));
    if (i === s.sec || s.screen !== 'present') return;
    const now = Date.now(); if (now-lastNav < 650) return; lastNav = now;
    const dir = i > s.sec ? 'next' : 'prev'; s.sec = i; s.panel = null; s.splashAuto = null;
    const host = P.root.querySelector('.pv-slides');
    if (!host || P.reduce()) { R(); return; }
    P.root.querySelectorAll('.pv-panel').forEach(p => p.remove());
    host.querySelectorAll('.pv-slide.leaving').forEach(n => n.remove());
    const old = host.querySelector('.pv-slide');
    if (old) { old.classList.add('leaving',dir); old.inert = true; old.setAttribute('aria-hidden','true'); setTimeout(() => old.remove(),900); }
    const tpl = document.createElement('template'); tpl.innerHTML = slide(DEV(s.dev),dir);
    host.append(tpl.content);
    syncChrome(); setupSlide();
  };
  function syncChrome() {
    const s = S(), root = P.root; if (!root) return;
    const l = root.querySelector('[data-page-label]'); if (l) l.firstChild.textContent = pageLabel(s.sec);
    const [up,dn] = root.querySelectorAll('.pv-step button'); if (up) { up.disabled = s.sec === 0; dn.disabled = s.sec === secs().length-1; }
    const c = root.querySelector('.pv-step .n'); if (c) c.textContent = String(Math.max(1,s.sec)).padStart(2,'0');
    root.querySelector('.pv-present')?.setAttribute('data-sec',secs()[s.sec]);
  }
  A.secUp = () => P.goSec(S().sec-1);
  A.secDown = () => P.goSec(S().sec+1);

  // Choreography helpers. Every element carries its own delay (--d) on top of the
  // slide's base delay, so each slide reads as one composed sequence.
  const words = (t,d = 0) => `<span class="rv-w" style="--d:${d}s">${esc(t).split(' ').map((w,i) => `<span class="w"><span style="--i:${i}">${w}</span></span>`).join(' ')}</span>`;
  const rv = (d,cls = '') => `class="rv ${cls}" style="--d:${d}s"`;
  // Renders are labelled as illustrative wherever they appear (EU, Malta, RERA and Florida practice).
  P.aiLabel = (k = 'Artist’s impression') => `<span class="pv-ailabel">${P.t(k)}</span>`;
  const img = (src,d,from = 'up',extra = '',label = true) => `<div class="rv-img ${from}" style="--d:${d}s" ${extra}><img src="${esc(src)}" alt="" draggable="false">${label ? P.aiLabel() : ''}</div>`;

  function splash(d) {
    const b = D.brand(d.id);
    return `<div class="pv-logo">${b.logo.img ? `<img src="${esc(b.logo.img)}" alt="${esc(b.logo.alt)}" draggable="false">` : `<div class="pv-lockup"><h1 class="pv-display">${esc(b.logo.text)}</h1><p>${esc(b.logo.sub)}</p></div>`}</div>
      <div class="pv-logobar" aria-hidden="true"><i></i></div>`;
  }
  const intro = c => `<div class="txt"><span ${rv(.05,'pv-eyebrow2')}>Introduction</span><h2 class="pv-display">${words(c.intro.title,.1)}</h2><i ${rv(.55,'rv-rule')}></i><p ${rv(.6)}>${esc(c.intro.body)}</p></div>${img(c.intro.img,0,'left')}`;
  function lifestyle(c) {
    const s = S(), cards = c.lifestyle.cards, i = s.life[s.dev+':life'] || 0;
    return `<div class="pv-centerhead"><h2 class="pv-display">${words(c.lifestyle.title)}</h2><p ${rv(.35)}>${esc(c.lifestyle.body)}</p></div>
      <div class="pv-life-wrap" data-life="life"><div class="pv-life-track">${cards.map((x,j) => `<article class="pv-life" style="--k:${j}">${img(x.img,.45+j*.12)}<h3 ${rv(.8+j*.12)}>${esc(x.title)}</h3><p ${rv(.88+j*.12)}>${esc(x.body)}</p></article>`).join('')}</div></div>
      <div ${rv(.9,'pv-life-ctl')} data-life-host="life"><button data-a="lifeStep" data-v="-1" aria-label="Previous" ${i ? '' : 'disabled'}>${I('arrow_back')}</button><div class="prog"><i style="width:${(i+1)/cards.length*100}%"></i></div><span class="cnt">${String(i+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}</span><button data-a="lifeStep" data-v="1" aria-label="Next" ${i < cards.length-1 ? '' : 'disabled'}>${I('arrow_forward')}</button></div>`;
  }
  // Amenities: the list on the left stays; the right side is a slider with a render and a line per amenity.
  function amenities(d,c) {
    const items = D.amenityItems(d.id), i = Math.min(S().life[d.id+':amen'] || 0,items.length-1);
    return `<div class="l"><span ${rv(0,'pv-eyebrow2')}>${P.t('Amenities')}</span><h2 class="pv-display">${words(c.amenities.title,.05)}</h2>
    <div class="pv-amen-list">${items.map((a,j) => `<button ${rv(.4+j*.06,j === i ? 'cur' : '')} data-a="lifeGoTo" data-life-item="amen" data-v="${j}" aria-current="${j === i}">${I(D.amenityIcon(a.name))}<span>${esc(a.name)}</span></button>`).join('')}</div>
    <div class="pv-amen-list one">${d.dist.map(([a,b],j) => `<div ${rv(.75+j*.06)}><span>${esc(a)}</span><span class="m">${esc(b)}</span></div>`).join('')}</div></div>
    <div class="pv-amen-slider pv-life-host">
      <div class="pv-amen-wrap" data-life="amen"><div class="pv-amen-track">${items.map((a,j) => `<figure class="pv-amen-slide ${j === i ? 'cur' : ''}">${img(a.img,0,'right')}<figcaption><b>${esc(a.name)}</b><span>${esc(a.body)}</span></figcaption></figure>`).join('')}</div></div>
      <div ${rv(.9,'pv-life-ctl pv-amen-ctl')} data-life-host="amen"><button data-a="lifeStep" data-v="-1" aria-label="Previous amenity" ${i ? '' : 'disabled'}>${I('arrow_back')}</button><div class="prog"><i style="width:${(i+1)/items.length*100}%"></i></div><span class="cnt">${String(i+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}</span><button data-a="lifeStep" data-v="1" aria-label="Next amenity" ${i < items.length-1 ? '' : 'disabled'}>${I('arrow_forward')}</button></div></div>`;
  }
  function location(d,c) {
    const L = c.location;
    const map = L.map ? `<img src="${esc(L.map)}" alt="Map of ${esc(d.name)} neighbourhood" draggable="false">` : (window.PMMap && P.mapReady ? window.PMMap.render([d],{activeId:d.id,showLegend:false}) : `<div class="pv-mapwait">Loading map…</div>`);
    return `<div class="pv-loc"><div class="pv-centerhead"><h2 class="pv-display">${words(L.title)}</h2><p ${rv(.3)}>${esc(L.body)}</p></div>
      ${L.cats.length ? `<div class="pv-legend">${L.cats.map(([n,col],j) => `<span ${rv(.45+j*.05)}><i style="background:${col}"></i>${esc(n)}</span>`).join('')}</div>` : ''}
      <div class="pv-loc-body"><div class="pv-pois">${L.pois.map((p,j) => `<article tabindex="0" class="rv" style="--d:${(.55+j*.07).toFixed(2)}s;--c:${L.cats[p.cat]?.[1] || 'var(--b-accent)'}"><h3>${esc(p.name)}</h3><p>${esc(p.body)}</p><small>${esc(p.addr)}</small></article>`).join('')}</div>
      <div class="rv-img up pv-map" style="--d:.35s">${map}</div></div></div>`;
  }
  function residences(d) {
    const gs = D.residenceGroups(d.id), all = D.unitsOf(d.id).filter(u => u.status === 'available');
    return `<div class="pv-centerhead"><h2 class="pv-display">${words('Residences')}</h2><p ${rv(.25)}>${gs.length} residence type${gs.length === 1 ? '' : 's'} · ${all.length} available${S().hidePrices ? '' : ', '+P.t('from')+' '+P.fmt(Math.min(...all.map(u => u.price)),d)}</p></div>
      <div class="pv-res" style="--n:${gs.length}">${gs.map((g,j) => { const t = .35+j*.13;
        return `<div class="pv-rescard">${img(g.img,t)}<div class="b"><h3 ${rv(t+.35)}>${esc(g.label)}</h3><small ${rv(t+.42)}>${g.available} of ${g.total} available</small>
          <ul>${g.beds.map((x,k) => `<li ${rv(t+.5+k*.06)}><span>${x.beds ? x.beds+' bedroom'+(x.beds > 1 ? 's' : '') : 'Studio'}</span><b>${!x.from ? 'Sold out' : S().hidePrices ? x.count+' available' : P.t('from')+' '+P.fmt(x.from,d)}</b></li>`).join('')}</ul></div></div>`; }).join('')}</div>`;
  }
  function gallery(c) {
    const g = c.gallery, cap = g.length > 5 ? 9 : 5, shown = g.slice(0,cap), more = g.length-cap;
    return `<div class="pv-centerhead slim"><h2 class="pv-display">${words(P.t('Gallery'))}</h2></div><span class="pv-ailabel pv-ailabel-fixed">${P.t('Artist’s impression')}s and photography</span>
      <div class="pv-bento ${cap === 9 ? 'nine' : 'five'}">${shown.map((src,i) => `<button data-a="lb" data-v="${i}" aria-label="Open image ${i+1} of ${g.length}" class="${i === cap-1 && more > 0 ? 'more' : ''}">${img(src,.2+i*.07,i % 3 === 1 ? 'left' : 'up','',false)}${i === cap-1 && more > 0 ? `<span class="rv" style="--d:${(.9+i*.07).toFixed(2)}s">+${more}</span>` : ''}</button>`).join('')}</div>`;
  }
  const bedsName = b => b === 0 ? 'Studio' : b+' Bedroom'+(b > 1 ? 's' : '');
  const typeGroups = d => { const g = new Map(); D.unitsOf(d.id).forEach(u => { if (!g.has(u.beds)) g.set(u.beds,[]); g.get(u.beds).push(u); }); return [...g.entries()].sort((a,b) => a[0]-b[0]); };
  const repOf = us => us.find(u => u.status === 'available') || us[0];
  function plans(d) {
    const gs = typeGroups(d).slice(0,4);
    return `<div class="pv-centerhead slim"><h2 class="pv-display">${words('Plans')}</h2><p ${rv(.25)}>Representative layouts. Each residence has its own plan on its unit page.</p></div>
      <div class="pv-types" style="--n:${gs.length}">${gs.map(([b,us],j) => { const r = repOf(us), t = .3+j*.12;
        return `<div ${rv(t,'pv-type')}><div class="plan">${P.planHtml(r,200)}</div><h3>${bedsName(b)} · ${esc(r.id)}</h3><div class="pv-spec">${D.roomSchedule(r).slice(0,5).map(([n,m]) => `<div><span>${esc(n)}</span>${P.ar(m,r)}</div>`).join('')}</div><button class="pv-more" data-a="typeGo" data-v="${b}" style="margin:0">View ${us.filter(u => u.status === 'available').length} available</button></div>`; }).join('')}</div>`;
  }
  A.typeGo = v => { const av = S().av[S().dev]; av.f.beds = [+v]; av.tab = 'list'; av.shown = 40; A.pageGo('availability'); };

  // Availability
  function avUnits(devId) {
    const av = S().av[devId], f = av.f;
    const list = D.unitsOf(devId).filter(u => (f.showSold || u.status === 'available') && (!f.beds.length || f.beds.some(b => b === 4 ? u.beds >= 4 : u.beds === b))
      && (!f.types.length || f.types.includes(u.type)) && (!f.floor || u.floor === +f.floor) && (f.min == null || u.price >= f.min) && (f.max == null || u.price <= f.max)
      && f.feats.every(k => D.featuresOf(u).includes(k)));
    const sorts = [(a,b) => a.price-b.price,(a,b) => b.price-a.price,(a,b) => b.floor-a.floor || a.price-b.price];
    return list.sort(sorts[av.sort]);
  }
  P.avUnits = avUnits;
  const SORTS = ['Ascending price','Descending price','Floor'];
  const unitRow = (u,j = 0) => { const dim = u.status === 'sold' ? 'dim' : u.status === 'available' ? '' : 'res', fs = D.featuresOf(u);
    return `<div class="pv-unitrow ${dim}" style="--r:${Math.min(j,12)}" role="button" tabindex="0" data-a="openUnit" data-v="${esc(u.id)}" aria-label="${esc(u.id)}, ${P.statusText(u)}, ${P.fmt(u.price,u)}">
      <span class="thumb">${P.planHtml(u,46)}</span><span><span class="id">${esc(u.id)}</span><small>${P.statusText(u)}</small></span>
      <span><span class="big">${u.beds ? u.beds+' bed' : 'Studio'} · ${u.baths} bath</span><small>Floor ${u.floor}</small></span>
      <span><span class="big">${P.ar(D.area(u),u)}</span><small>${P.ar(u.sqm,u)} int · ${P.ar(u.ext,u)} ext</small></span>
      <span><span class="big">${esc(D.viewOf(u))}</span><small>${fs.filter(k => k !== 'corner').map(k => D.FEATURES[k].label).join(' · ') || '—'}</small></span>
      <span class="price">${P.fmt(u.price,u)}<small>${P.ppa(u.price,D.area(u),u)}</small></span>${heart(u.id)}</div>`; };
  function listView(d) {
    const av = S().av[d.id], us = avUnits(d.id), shown = us.slice(0,av.shown);
    return `<div class="pv-listhead"><h3>${us.length} ${P.t('residences found')}</h3><div class="r"><button class="pv-sort" data-a="avSort">${P.t('Sort by')} <b>${SORTS[av.sort]}</b>${I('expand_more')}</button>
      <button class="pv-fbtn" data-a="avFilters" aria-expanded="${av.fOpen}">${I('filter_list')}${P.t('Filters')}<em>${activeAv(av.f)}</em></button></div></div>
      <div class="pv-cols"><span></span><span>Residence</span><span>Layout</span><span>Area</span><span>View</span><span>Price</span><span></span></div>
      <div class="pv-list" data-keep="avlist-${d.id}">${shown.map((u,j) => unitRow(u,j)).join('') || '<div class="pv-sel-empty" style="color:var(--b-muted)">No residences match. Reset the filters to see everything.</div>'}
      ${us.length > shown.length ? `<button class="pv-more" data-a="avMore">Show ${Math.min(40,us.length-shown.length)} more of ${us.length-shown.length}</button>` : ''}</div>`;
  }
  const activeAv = f => f.beds.length+(f.types.length ? 1 : 0)+(f.floor ? 1 : 0)+(f.min != null || f.max != null ? 1 : 0)+f.feats.length+(f.showSold ? 0 : 1);
  function floorView(d) {
    const s = S(), av = s.av[d.id], b = D.brand(d.id), floors = D.floorsOf(d.id);
    if (av.floor == null || !floors.includes(av.floor)) av.floor = d.id === D.MT ? 32 : floors[Math.floor(floors.length/2)];
    const plate = D.plate(d.id,av.floor), lvl = D.levelOf(d.id,av.floor), us = plate.map(p => p.u), avl = us.filter(u => u.status === 'available');
    const sel = us.find(u => u.id === av.plateSel) || avl[0] || us[0];
    const sides = D.plateSides(d.id), fi = floors.indexOf(av.floor);
    const pal = st => st === 'available' ? [b.tint,b.tint,'0',b.ink] : st === 'sold' ? [b.bg,b.line,'0','#B0ACA3'] : [b.reserved,'#9A9A92','5 4',b.muted];
    const cells = plate.map(({u,rect:[x,y,w,h]},i) => { const on = sel && u.id === sel.id, [fill,stroke,dash,tc] = on ? [b.accent,b.accent,'0','#fff'] : pal(u.status), cx = x+w/2, cy = y+h/2;
      return `<g class="u" data-a="plateUnit" data-v="${esc(u.id)}" role="button" tabindex="0" aria-label="${esc(u.id)} ${P.statusText(u)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-dasharray="${dash}" stroke-width="1.5"/>
        <circle cx="${cx}" cy="${cy}" r="17" fill="${on ? 'none' : b.bg}" stroke="${on ? '#fff' : stroke}" stroke-width="1.2"/><text x="${cx}" y="${cy+5}" text-anchor="middle" font-size="13" font-family="Inter,sans-serif" fill="${tc}">${esc(plate[i].label.length <= 3 ? plate[i].label : String(i+1).padStart(2,'0'))}</text></g>`; }).join('');
    const cr = lvl?.core ? LP.toPlate(lvl,lvl.core) : null;
    const core = (lvl?.img ? `<image href="${esc(lvl.img.startsWith('blob:') ? lvl.img : D.asset+lvl.img)}" x="0" y="0" width="${LP.W}" height="${LP.H}" preserveAspectRatio="xMidYMid slice" opacity=".35"/>` : '')
      +(cr ? `<rect x="${cr[0]}" y="${cr[1]}" width="${cr[2]}" height="${cr[3]}" fill="${b.bg}" stroke="${b.line}"/><text x="${cr[0]+cr[2]/2}" y="${cr[1]+cr[3]/2+5}" text-anchor="middle" font-size="11" letter-spacing="2" fill="${b.muted}" font-family="Inter,sans-serif">CORE · LIFTS</text>` : '');
    const lbl = (t,x,y,rot = 0) => t ? `<text x="${x}" y="${y}" text-anchor="middle" font-size="12" letter-spacing="2.4" fill="${b.muted}" font-family="Inter,sans-serif" ${rot ? `transform="rotate(${rot} ${x} ${y})"` : ''}>${esc(t.toUpperCase())}</text>` : '';
    return `<div class="pv-floor"><div class="side"><div class="pv-floorno"><b>${av.floor}</b><div><button data-a="floorStep" data-v="1" aria-label="Floor up" ${fi >= floors.length-1 ? 'disabled' : ''}>${I('keyboard_arrow_up')}</button><button class="dn" data-a="floorStep" data-v="-1" aria-label="Floor down" ${fi <= 0 ? 'disabled' : ''}>${I('keyboard_arrow_down')}</button></div></div>
      <div class="lbl">${av.floor === 0 ? 'Ground floor' : 'Floor'}</div><div class="sum"><b>${avl.length}</b> of ${us.length} residences available${avl.length && !S().hidePrices ? `<br>from ${P.fmt(Math.min(...avl.map(u => u.price)),d)}` : ''}</div>
      <div class="pv-key"><span><i style="background:${b.tint}"></i>Available</span><span><i style="background:${b.reserved};border-style:dashed"></i>Reserved</span><span><i style="background:${b.bg}"></i>Sold</span><span><i style="background:${b.accent};border-color:${b.accent}"></i>Selected</span></div></div>
      <div class="pv-plate"><svg viewBox="-60 -40 1000 500" role="group" aria-label="Floor ${av.floor} plate"><rect x="36" y="36" width="808" height="348" fill="none" stroke="${b.accent}" stroke-width="2"/>${core}${cells}
        ${lbl(sides[0],440,0)}${lbl(sides[2],440,440)}${lbl(sides[1],905,210,90)}${lbl(sides[3],-20,210,-90)}</svg>
      ${sel ? `<div class="pv-strip" role="button" tabindex="0" data-a="openUnit" data-v="${esc(sel.id)}" aria-label="Open ${esc(sel.id)}"><span class="thumb" style="height:48px;display:flex;align-items:center">${P.planHtml(sel,48)}</span><span><span class="id">${esc(sel.id)}</span><small>${P.statusText(sel)} · Floor ${sel.floor}</small></span>
        <span><span>${sel.beds ? sel.beds+' bed' : 'Studio'} · ${sel.baths} bath</span><small>${P.ar(D.area(sel),sel)} · ${P.ar(sel.sqm,sel)} int / ${P.ar(sel.ext,sel)} ext</small></span><span><span class="vw">${esc(D.viewOf(sel))}</span><small>${D.featuresOf(sel).map(k => D.FEATURES[k].label).join(' · ')}</small></span>
        <span class="price">${P.fmt(sel.price,sel)}<small>${P.ppa(sel.price,D.area(sel),sel)}</small></span>${heart(sel.id)}</div>` : ''}</div></div>`;
  }
  function avFilters(d) {
    const av = S().av[d.id], f = av.f, o = av.open, all = D.unitsOf(d.id), n = avUnits(d.id).length;
    const types = [...new Set(all.map(u => u.type))], floors = D.floorsOf(d.id), prices = all.map(u => u.price);
    const lo = Math.floor(Math.min(...prices)/50000)*50000, hi = Math.ceil(Math.max(...prices)/50000)*50000;
    return `<div class="pv-panel pv-afilters" data-pk="afilters" data-keep="afilters" role="dialog" aria-label="Residence filters"><div class="pv-panel-h">Filters<button class="pv-esc" data-a="avReset" aria-label="Reset filters">${I('restart_alt')}</button></div>
      ${P.fsec('beds','Bedrooms',f.beds.length ? f.beds.map(b => b === 4 ? '4+' : b === 0 ? 'Studio' : b).join(', ') : 'Any',`<div class="pv-opts">${[['','Any'],...[...new Set(all.map(u => Math.min(4,u.beds)))].sort().map(b => [b,b === 4 ? '4+' : b === 0 ? 'Studio' : String(b)])].map(([v,l]) => `<button class="pv-opt" style="flex:1" data-a="avBeds" data-v="${v}" aria-pressed="${v === '' ? !f.beds.length : f.beds.includes(v)}">${l}</button>`).join('')}</div>`,o.beds)}
      ${P.fsec('type','Property type',P.typesLabel(f.types),P.typeOpts(types,f.types,'avType'),o.type)}
      ${P.fsec('floor','Floor',f.floor || 'Any',`<div class="pv-opts" style="max-height:120px;overflow:auto">${['',...floors].map(t => `<button class="pv-opt" data-a="avFloor" data-v="${t}" aria-pressed="${String(f.floor) === String(t)}">${t === '' ? 'Any' : t}</button>`).join('')}</div>`,o.floor)}
      ${P.fsec('price','Price range',f.min != null || f.max != null ? `${P.kIn(f.min ?? lo,P.ccyOf(d))}–${P.kIn(f.max ?? hi,P.ccyOf(d))}` : 'Any',P.priceBlock(prices,f.min,f.max,lo,hi,'a',P.ccyOf(d)),o.price)}
      ${P.fsec('feat','Features',f.feats.length ? f.feats.length+' selected' : 'Any',P.tiles(D.UNIT_FEATURES,f.feats,'avFeat'),o.feat)}
      <button class="pv-fsec" style="display:flex;justify-content:space-between;align-items:center;padding:12px;width:100%" data-a="avSold" aria-pressed="${f.showSold}">Show sold &amp; reserved<span class="pv-toggle ${f.showSold ? 'on' : ''}"></span></button>
      <button class="pv-show" data-a="avFilters">Show ${n} matching residence${n === 1 ? '' : 's'} ${I('arrow_forward')}</button></div>`;
  }
  function availability(d) {
    const s = S(), av = s.av[d.id], c = D.content(d.id);
    return `<div class="pv-avail">${img(c.tower,0,'up','role="img" aria-label="'+esc(d.name)+'"').replace('rv-img','rv-img tower')}<div ${rv(.3,'panel')}>
      <div class="pv-tabs" role="tablist"><button role="tab" aria-selected="${av.tab === 'list'}" data-a="avTab" data-v="list">${P.t('Availability list')}</button><button role="tab" aria-selected="${av.tab === 'floor'}" data-a="avTab" data-v="floor">${P.t('By floor')}</button></div>
      ${av.tab === 'list' ? listView(d) : floorView(d)}</div></div>
      ${av.fOpen ? avFilters(d) : ''}<button class="pv-afbtn ${av.fOpen ? 'open' : ''}" data-a="avFilters" aria-expanded="${av.fOpen}" aria-label="${av.fOpen ? 'Close filters' : 'Open filters'}">${av.fOpen ? 'Close' : 'Filters'}<i>${I(av.fOpen ? 'close' : 'tune')}</i></button>`;
  }
  const AV = () => S().av[S().dev], tog = (arr,v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr,v];
  A.avTab = v => { AV().tab = v; AV().fOpen = false; R(); };
  A.avSort = () => { AV().sort = (AV().sort+1) % SORTS.length; R(); };
  A.avFilters = () => { AV().fOpen = !AV().fOpen; R(); };
  A.avReset = () => { const av = AV(); av.f = P.blankAvail().f; av.shown = 40; R(); };
  A.avBeds = v => { const f = AV().f; f.beds = v === '' ? [] : tog(f.beds,+v); AV().shown = 40; R(); };
  A.avType = v => { const f = AV().f; f.types = v === '' ? [] : tog(f.types,v); AV().shown = 40; R(); };
  A.avFloor = v => { AV().f.floor = v; if (v) AV().floor = +v; R(); };
  A.avFeat = v => { AV().f.feats = tog(AV().f.feats,v); R(); };
  A.avSold = () => { AV().f.showSold = !AV().f.showSold; R(); };
  A.avMore = () => { AV().shown += 40; R(); };
  P.rangeHooks.a = {
    preview:(min,max) => { const av = AV(), keep = av.f; av.f = {...keep,min,max}; const n = avUnits(S().dev).length; av.f = keep; return `Show ${n} matching residence${n === 1 ? '' : 's'}`; },
    commit:(min,max) => { const av = AV(); av.f.min = min; av.f.max = max; av.shown = 40; R(); },
  };
  A.floorStep = v => { const fl = D.floorsOf(S().dev), i = fl.indexOf(AV().floor)+ +v; if (fl[i] != null) { AV().floor = fl[i]; AV().plateSel = null; R(); } };
  A.plateUnit = v => { const av = AV(); if (av.plateSel === v) P.openUnit(v); else { av.plateSel = v; R(); } };

  // Lightbox (brochure gallery)
  A.lb = v => { S().lightbox = {imgs:D.content(S().dev).gallery,i:+v,fresh:true}; R(); };
  A.lbStep = v => { const l = S().lightbox; l.i = (l.i+ +v+l.imgs.length) % l.imgs.length; l.dir = +v > 0 ? 'fromr' : 'froml'; R(); };
  A.lbClose = () => { S().lightbox = null; R(); };
  P.lightboxHtml = () => { const l = S().lightbox; if (!l) return ''; const fresh = l.fresh; l.fresh = false; return `<div class="pv-ov pv-lb ${fresh ? 'fresh' : ''}" role="dialog" aria-modal="true" aria-label="Image viewer"><img src="${esc(l.imgs[l.i])}" alt="" class="${l.dir || ''}" draggable="false">
    <button class="x" data-a="lbClose" aria-label="Close">${I('close')}</button><div class="pv-bottom"><div class="pv-group"><button class="pv-ib" data-a="lbStep" data-v="-1" aria-label="Previous">${I('chevron_left')}</button><span style="padding:0 10px;font-size:12px">${l.i+1} / ${l.imgs.length}</span><button class="pv-ib" data-a="lbStep" data-v="1" aria-label="Next">${I('chevron_right')}</button></div></div></div>`; };
  P.keys.push(e => { const l = S().lightbox; if (!l) return; if (e.key === 'ArrowRight') { A.lbStep(1); return true; } if (e.key === 'ArrowLeft') { A.lbStep(-1); return true; } });

  // Payment & ownership: the money conversation buyers expect before reserving.
  function ownership(d) {
    const c = D.commerce(d.id), av = D.unitsOf(d.id).filter(u => u.status === 'available'), from = av.length ? Math.min(...av.map(u => u.price)) : 0;
    const hide = S().hidePrices, cc = c.charges, unit = av.find(u => u.price === from);
    const yieldPct = unit ? (c.rent.rate*(c.rent.per === 'sqft' ? unit.sqm*10.7639 : unit.sqm)*12/unit.price*100) : null;
    return `<div class="pv-own"><div class="l"><span ${rv(0,'pv-eyebrow2')}>${P.t('Payment & ownership')}</span><h2 class="pv-display">${words('A clear path to the keys',.05)}</h2>
      <p ${rv(.4)}>${hide ? 'Staged payments through construction, held securely until completion.' : `Shown for a residence from ${P.fmt(from,d)}. Every residence follows the same plan.`}</p>
      <ol class="pv-plan-steps">${c.plan.map(([t,when,pct],j) => `<li ${rv(.5+j*.1)}><span class="pct">${pct}%</span><div><b>${esc(t)}</b><small>${esc(when)}</small></div>${hide ? '' : `<span class="amt">${P.fmt(from*pct/100,d)}</span>`}<i style="--w:${pct}%"></i></li>`).join('')}</ol></div>
      <div class="r"><h3 ${rv(1.3,'pv-own-h')}>Timeline and Details of the Project</h3>
        <ol ${rv(1.4,'pv-tl')}>${c.timeline.map(([t,when,st],j) => `<li class="${st}" style="--j:${j}"><i></i><b>${esc(t)}</b><small>${esc(when)}${st === 'now' ? ' · now' : ''}</small></li>`).join('')}</ol>
        <p ${rv(1.5,'pv-tl-note')}>Completion ${esc(c.completion)} · grace period ${esc(c.grace.toLowerCase())}</p>
        ${[['verified_user','Deposit protection',esc(c.protection)],
        ['receipt_long',esc(cc.label),`${(c => (P.PV_SYM?.[c] || {USD:'$',EUR:'€',GBP:'£'}[c] || c+' ')+P.toCcy(cc.rate,d,c).toFixed(2))(P.dispCcy(d))} per ${cc.per === 'sqft' ? 'sq ft' : 'm²'} per ${cc.period}`],
        ['trending_up','Investment',yieldPct ? `Est. gross rental yield ${yieldPct.toFixed(1)}% · based on comparable rents` : '—'],
        ['apartment','Developer',`${esc(c.developer)}`]].map(([ic,k,v],j) => `<div ${rv(1.55+j*.08,'pv-fact')}>${I(ic)}<div><small>${k}</small><p>${v}</p></div></div>`).join('')}
        <div ${rv(1.9,'pv-track')}>${c.track.map(([n,l]) => `<div><b>${n}</b><small>${l}</small></div>`).join('')}</div></div></div>`;
  }
  // Walkthrough: a cinematic preview that plays on arrival; the slot takes a 3D tour when supplied.
  function walkthrough(d) {
    const w = D.walkFor(d.id);
    return `<div class="pv-walk" data-walk>${w.map((x,i) => `<figure class="shot ${i ? '' : 'on'}" style="--k:${i}"><img src="${esc(x.img)}" alt="" draggable="false"><figcaption><small>${String(i+1).padStart(2,'0')} · ${esc(x.title)}</small><span>${esc(x.cap)}</span></figcaption></figure>`).join('')}
      <div class="pv-walk-hd"><span ${rv(0,'pv-eyebrow2')}>${P.t('Walkthrough')}</span><h2 class="pv-display">${words('Step inside',.05)}</h2></div>
      ${P.aiLabel()}<div class="pv-walk-ctl" ${rv(.4)}><button data-a="walkToggle" aria-label="Pause walkthrough">${I('pause')}</button><div class="bars">${w.map((_,i) => `<i data-k="${i}"><b></b></i>`).join('')}</div><span class="note">Cinematic preview · 3D tour available on request</span></div></div>`;
  }
  const BODY = {
    splash:d => [splash(d),'pv-splash'],intro:d => [intro(D.content(d.id)),'pv-hero'],lifestyle:d => [lifestyle(D.content(d.id)),'pv-lifesec'],
    amenities:d => [amenities(d,D.content(d.id)),'pv-amen-page'],location:d => [location(d,D.content(d.id)),''],types:d => [residences(d),'pv-ressec'],ownership:d => [ownership(d),'pv-ownsec'],walkthrough:d => [walkthrough(d),'pv-walksec'],
    availability:d => [availability(d),''],gallery:d => [gallery(D.content(d.id)),'pv-galsec'],plans:d => [plans(d),'pv-plansec'],
  };
  function slide(d,enter) {
    const id = secs()[S().sec], [html,cls] = BODY[id](d);
    return `<section class="pv-slide pv-sec ${cls} ${enter ? 'enter '+enter : ''}" data-sec="${id}" aria-label="${esc(pageLabel(S().sec))}">${html}</section>`;
  }
  P.screens.present = () => {
    const s = S(), d = DEV(s.dev); s.av[d.id] ||= P.blankAvail(); s.life ||= {};
    // Entrance choreography plays when arriving from another screen, not on in-place refreshes.
    const enter = P.from !== 'present' ? 'first' : null;
    return `<div class="pv-present" data-sec="${secs()[s.sec]}" style="${P.brandVars(d.id)}"><h1 class="pv-sr" tabindex="-1">${esc(d.name)} presentation</h1>
      <div class="pv-slides">${slide(d,enter)}</div>
      ${P.navBar()}<div class="pv-step"><button data-a="secUp" aria-label="Previous page" ${s.sec === 0 ? 'disabled' : ''}>${I('keyboard_arrow_up')}</button><span class="n" aria-hidden="true">${String(Math.max(1,s.sec)).padStart(2,'0')}</span><button data-a="secDown" aria-label="Next page" ${s.sec === secs().length-1 ? 'disabled' : ''}>${I('keyboard_arrow_down')}</button></div>
      ${P.lightboxHtml()}</div>`;
  };
  // Per-slide behaviour after a slide is inserted: splash auto-advance and the lifestyle slider.
  function setupSlide() {
    const s = S(), root = P.root; if (!root || s.screen !== 'present') return;
    if (secs()[s.sec] === 'splash' && s.splashAuto === s.dev) {
      const dev = s.dev; s.splashAuto = null;
      P.later(P.reduce() ? 600 : P.prefs.quick ? 1100 : 2300,() => { if (S().screen === 'present' && S().dev === dev && secs()[S().sec] === 'splash') { lastNav = 0; P.goSec(1); } });
    }
    root.querySelectorAll('.pv-slide:not(.leaving) [data-life]').forEach(lifeInit);
    const walk = [...root.querySelectorAll('.pv-slide:not(.leaving) [data-walk]')][0];
    if (walk) walkInit(walk);
  }
  P.after.push((root,s,why) => { if (s.screen === 'present') { if (why === 'resize') { root.querySelectorAll('.pv-slide:not(.leaving) [data-life]').forEach(w => lifePos(w,false)); } else setupSlide(); } });

  // Walkthrough player: each shot holds ~4.5s with a slow push-in, then cross-dissolves.
  const SHOT = 4500;
  function walkInit(el) {
    if (el._pv) return; el._pv = {k:0,t0:performance.now(),paused:false,acc:0};
    const st = el._pv, shots = el.querySelectorAll('.shot'), bars = el.querySelectorAll('.bars b');
    const tick = now => {
      if (!el.isConnected) return;
      if (!st.paused) {
        const p = Math.min(1,(st.acc+now-st.t0)/SHOT);
        bars.forEach((b,i) => { b.style.transform = `scaleX(${i < st.k ? 1 : i === st.k ? p : 0})`; });
        if (p >= 1) { st.k = (st.k+1) % shots.length; st.t0 = now; st.acc = 0; shots.forEach((s,i) => s.classList.toggle('on',i === st.k)); }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  A.walkToggle = (v,btn) => {
    const el = btn.closest('[data-walk]'), st = el?._pv; if (!st) return;
    st.paused = !st.paused; const now = performance.now();
    if (st.paused) st.acc += now-st.t0; else st.t0 = now;
    el.classList.toggle('paused',st.paused);
    btn.innerHTML = I(st.paused ? 'play_arrow' : 'pause'); btn.setAttribute('aria-label',st.paused ? 'Play walkthrough' : 'Pause walkthrough');
  };
  // Presenter controls
  A.focus = v => { const s = S(), id = secs()[s.sec]; s.focus = v; s.sec = Math.max(0,secs().indexOf(id)); R(); };
  A.hidePrices = () => { S().hidePrices = !S().hidePrices; R(); };

  // Carousels (lifestyle cards, amenity slides): drag, flick, buttons or horizontal trackpad swipe; snap to an item.
  const kindOf = wrap => wrap.dataset.life || 'life';
  const lkey = kind => S().dev+':'+kind;
  const lifeIdx = kind => S().life[lkey(kind)] || 0;
  const lifeCount = wrap => wrap.firstElementChild.children.length;
  function lifeX(wrap,i) {
    const track = wrap.firstElementChild, cards = track.children; if (!cards[i]) return 0;
    const max = Math.max(0,track.scrollWidth-wrap.clientWidth+parseFloat(getComputedStyle(wrap).paddingLeft)*2);
    return -Math.min(max,cards[i].offsetLeft-cards[0].offsetLeft);
  }
  function lifePos(wrap,animate = true,i = lifeIdx(kindOf(wrap))) {
    const track = wrap.firstElementChild; track.style.transition = animate ? '' : 'none'; track.style.transform = `translate3d(${lifeX(wrap,i)}px,0,0)`;
    [...track.children].forEach((c,k) => c.classList.toggle('cur',k === i));
    const host = wrap.closest('.pv-life-host') || wrap.parentElement, n = lifeCount(wrap);
    host.closest('.pv-slide')?.querySelectorAll(`[data-life-item="${kindOf(wrap)}"]`).forEach(el => { const on = +el.dataset.v === i; el.classList.toggle('cur',on); el.setAttribute('aria-current',on); });
    const ctl = host.querySelector('.pv-life-ctl'); if (!ctl) return;
    ctl.querySelector('.prog i').style.width = (i+1)/n*100+'%'; ctl.querySelector('.cnt').textContent = `${String(i+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;
    const [p,nx] = ctl.querySelectorAll('button'); p.disabled = i === 0; nx.disabled = i === n-1;
  }
  const liveWrap = kind => P.root.querySelector(`.pv-slide:not(.leaving) [data-life="${kind}"]`);
  function lifeGo(i,wrap) { const kind = kindOf(wrap); S().life[lkey(kind)] = Math.max(0,Math.min(lifeCount(wrap)-1,i)); lifePos(wrap); }
  A.lifeStep = (v,btn) => { const kind = btn?.closest?.('[data-life-host]')?.dataset.lifeHost || 'life', w = liveWrap(kind); if (w) lifeGo(lifeIdx(kind)+ +v,w); };
  A.lifeGoTo = (v,btn) => { const w = liveWrap(btn.dataset.lifeItem); if (w) lifeGo(+v,w); };
  function lifeInit(wrap) {
    if (wrap._pv) return; wrap._pv = true; lifePos(wrap,false);
    const track = wrap.firstElementChild; let drag = null, wheelAt = 0;
    wrap.addEventListener('pointerdown',e => {
      if (e.button) return;
      const m = /translate3d\(([-\d.]+)px/.exec(track.style.transform);
      drag = {x:e.clientX,base:m ? +m[1] : 0,t:performance.now(),last:e.clientX,v:0,moved:false,id:e.pointerId};
      track.style.transition = 'none'; wrap.classList.add('grab');
    });
    wrap.addEventListener('pointermove',e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX-drag.x; if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; wrap.setPointerCapture(e.pointerId); }
      const now = performance.now(); drag.v = (e.clientX-drag.last)/Math.max(1,now-drag.t); drag.last = e.clientX; drag.t = now;
      const min = lifeX(wrap,lifeCount(wrap)-1); let x = drag.base+dx;
      if (x > 0) x *= .35; else if (x < min) x = min+(x-min)*.35;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null; wrap.classList.remove('grab'); track.style.transition = '';
      if (!d.moved) return;
      const m = /translate3d\(([-\d.]+)px/.exec(track.style.transform), x = (m ? +m[1] : 0)+d.v*220;
      let best = 0, dist = Infinity; for (let k = 0; k < lifeCount(wrap); k++) { const dd = Math.abs(lifeX(wrap,k)-x); if (dd < dist) { dist = dd; best = k; } }
      lifeGo(best,wrap);
      wrap.addEventListener('click',ev => { ev.stopPropagation(); ev.preventDefault(); },{capture:true,once:true});
    };
    wrap.addEventListener('pointerup',end); wrap.addEventListener('pointercancel',end);
    wrap.addEventListener('wheel',e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); e.stopPropagation(); const now = Date.now();
      if (Math.abs(e.deltaX) > 12 && now-wheelAt > 450) { wheelAt = now; lifeGo(lifeIdx(kindOf(wrap))+(e.deltaX > 0 ? 1 : -1),wrap); }
    },{passive:false});
  }

  // Wheel and touch move between slides, unless the gesture belongs to a scrollable list.
  const scrollable = (el,dy) => { for (let n = el; n && !n.classList?.contains('pv-slides'); n = n.parentElement) { if (n.nodeType !== 1) continue; const st = getComputedStyle(n); if (/(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight+1) { if (dy > 0 ? n.scrollTop+n.clientHeight < n.scrollHeight-1 : n.scrollTop > 0) return true; } } return false; };
  P.after.push(root => {
    if (root._pvSlides) return; root._pvSlides = true;
    let acc = 0, accT = 0, touch = null, quietUntil = 0;
    root.addEventListener('wheel',e => {
      const s = S(); if (!s || s.screen !== 'present' || s.lightbox || !e.target.closest?.('.pv-slides')) return;
      if (e.target.closest('.pv-panel') || scrollable(e.target,e.deltaY) || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = Date.now();
      // Trackpads keep firing after the fingers lift; wait for 280ms of quiet before the next move.
      if (now < quietUntil) { quietUntil = now+280; return; }
      if (now-accT > 220) acc = 0; accT = now; acc += e.deltaY;
      if (Math.abs(acc) > 50) { const dir = acc > 0 ? 1 : -1; acc = 0; quietUntil = now+700; P.goSec(s.sec+dir); }
    },{passive:false});
    root.addEventListener('touchstart',e => { touch = e.touches.length === 1 && !e.target.closest('[data-life],.pv-list,.pv-pois,.pv-panel') ? {y:e.touches[0].clientY,t:Date.now()} : null; },{passive:true});
    root.addEventListener('touchend',e => { const s = S(); if (!touch || s?.screen !== 'present') return; const dy = touch.y-e.changedTouches[0].clientY; if (Math.abs(dy) > 60 && Date.now()-touch.t < 600) P.goSec(s.sec+(dy > 0 ? 1 : -1)); touch = null; },{passive:true});
  });
  P.keys.push(e => {
    const s = S(); if (s.screen !== 'present' || s.panel || s.lightbox) return;
    if (['PageDown','ArrowDown','ArrowRight'].includes(e.key) || (e.key === ' ' && !e.target.closest?.('button,[role=button]'))) { A.secDown(); return true; }
    if (['PageUp','ArrowUp','ArrowLeft'].includes(e.key)) { A.secUp(); return true; }
    if (e.key === 'P' && e.shiftKey) { A.hidePrices(); return true; }
    if (e.key === 'Home') { P.goSec(1); return true; }
    if (e.key === 'End') { P.goSec(secs().length-1); return true; }
    if (e.key === 'Enter' && e.target.matches?.('[role=button][data-a]')) { e.target.click(); return true; }
  });
  P.mapReady = false;
  window.PMMap?.load?.().then(() => { P.mapReady = true; if (P.S?.screen === 'present' && P.SECS[P.S.sec] === 'location' && !D.content(P.S.dev).location.map) R(); }).catch(() => {});
})();
