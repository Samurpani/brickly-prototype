/* Present Mode v3 · Gallery: carousel/grid of developments, filters, presentation
 * queue, Ask Bricly AI, search, settings and the full-screen overview.
 */
(() => {
  'use strict';
  const P = window.PV3, D = P.D, {esc, I, eur, kEur} = P;
  const S = () => P.S;

  const allDevs = () => { const ds = DEVS.slice(); const i = ds.findIndex(d => d.id === D.MT); if (i > 0) ds.unshift(...ds.splice(i,1)); return ds; };
  const avail = d => D.unitsOf(d.id).filter(u => u.status === 'available');
  const fromPrice = d => { const a = avail(d); return a.length ? Math.min(...a.map(u => u.price)) : 0; };
  const PRICE_MIN = () => Math.floor(Math.min(...allDevs().flatMap(d => avail(d).map(u => u.price)))/50000)*50000;
  const PRICE_MAX = () => Math.ceil(Math.max(...allDevs().flatMap(d => avail(d).map(u => u.price)),1e6)/50000)*50000;
  const bedsMatch = (u,beds) => !beds.length || beds.some(b => b === 4 ? u.beds >= 4 : u.beds === b);
  function unitMatches(u,f) {
    if (u.status !== 'available') return false;
    if (!bedsMatch(u,f.beds)) return false;
    if (f.types.length && !f.types.includes(u.type)) return false;
    if (f.min != null && u.price < f.min) return false;
    if (f.max != null && u.price > f.max) return false;
    const fs = D.featuresOf(u);
    return f.feats.every(k => fs.includes(k));
  }
  const devMatches = (d,f) => (!f.loc || d.loc === f.loc) && avail(d).some(u => unitMatches(u,f));
  const visible = () => allDevs().filter(d => devMatches(d,S().g.f));
  P.galleryDevs = visible;
  P.rangeHooks ||= {};
  P.rangeHooks.g = {
    preview:(min,max) => { const n = allDevs().filter(d => devMatches(d,{...S().g.f,min,max})).length; return `Show ${n} matching ${n === 1 ? 'development' : 'developments'}`; },
    commit:(min,max) => { const g = S().g; g.f.min = min; g.f.max = max; g.idx = 0; R(); },
  };
  P.fromPrice = fromPrice;
  const activeCount = f => (f.loc ? 1 : 0)+(f.beds.length ? 1 : 0)+(f.types.length ? 1 : 0)+(f.min != null || f.max != null ? 1 : 0)+f.feats.length;

  // Shared filter pieces (used by gallery and availability filters).
  P.fsec = (key,label,value,body,open) => `<div class="pv-fsec"><button data-a="fsec" data-v="${key}" aria-expanded="${!!open}">${esc(label)}<span>${esc(value)}${I(open ? 'expand_less' : 'expand_more')}</span></button>${open ? `<div class="body">${body}</div>` : ''}</div>`;
  P.typesLabel = ts => !ts.length ? 'Any' : ts.length > 2 ? ts.length+' types' : ts.join(', ');
  P.typeOpts = (types,on,action) => `<div class="pv-opts" role="group" aria-label="Property types">${['',...types].map(t => `<button class="pv-opt" data-a="${action}" data-v="${esc(t)}" aria-pressed="${t === '' ? !on.length : on.includes(t)}">${t === '' ? 'Any' : I(on.includes(t) ? 'check' : 'add')+esc(t)}</button>`).join('')}</div>`;
  // Dual-handle price range. Dragging updates the panel live without re-rendering
  // (re-rendering mid-drag dropped the handle); the filter commits on release.
  const stepFor = span => [5e3,1e4,25e3,5e4,1e5].find(x => span/x <= 120) || 25e4;
  P.priceBlock = (prices,min,max,lo,hi,prefix) => {
    const bins = 24, w = (hi-lo)/bins, counts = Array(bins).fill(0);
    prices.forEach(p => { counts[Math.min(bins-1,Math.max(0,Math.floor((p-lo)/w)))]++; });
    const top = Math.max(1,...counts), a = min ?? lo, b = max ?? hi, step = stepFor(hi-lo);
    const pct = v => ((v-lo)/(hi-lo))*100;
    const thumb = (t,v,label) => `<span class="thumb" role="slider" tabindex="0" data-t="${t}" data-f="${prefix}-${t}" aria-label="${label}" aria-valuemin="${lo}" aria-valuemax="${hi}" aria-valuenow="${v}" aria-valuetext="${eur(v)}" style="left:${pct(v)}%"></span>`;
    return `<div class="pv-range" data-range="${prefix}" data-lo="${lo}" data-hi="${hi}" data-step="${step}">
      <div class="pv-range-label" data-lbl="range">${eur(a)} — ${eur(b)}</div>
      <div class="pv-histo" aria-hidden="true">${counts.map((c,i) => { const mid = lo+w*(i+.5); return `<i data-mid="${mid}" class="${mid >= a && mid <= b ? 'in' : ''}" style="height:${c ? 10+c/top*90 : 4}%;--i:${i}"></i>`; }).join('')}</div>
      <div class="pv-slider"><div class="track"></div><div class="fillr" style="left:${pct(a)}%;right:${100-pct(b)}%"></div>${thumb('min',a,'Minimum price')}${thumb('max',b,'Maximum price')}</div>
      <div class="pv-minmax"><span data-lbl="min">${kEur(a)} min</span><span data-lbl="max">${kEur(b)} max</span></div></div>`;
  };
  function rangeState(el) { const d = el.dataset, th = el.querySelectorAll('.thumb'); return {lo:+d.lo,hi:+d.hi,step:+d.step,a:+th[0].getAttribute('aria-valuenow'),b:+th[1].getAttribute('aria-valuenow')}; }
  function rangePaint(el,a,b) {
    const {lo,hi} = rangeState(el), pct = v => ((v-lo)/(hi-lo))*100, th = el.querySelectorAll('.thumb');
    [[th[0],a],[th[1],b]].forEach(([t,v]) => { t.style.left = pct(v)+'%'; t.setAttribute('aria-valuenow',v); t.setAttribute('aria-valuetext',eur(v)); });
    const f = el.querySelector('.fillr'); f.style.left = pct(a)+'%'; f.style.right = (100-pct(b))+'%';
    el.querySelector('[data-lbl=range]').textContent = `${eur(a)} — ${eur(b)}`;
    el.querySelector('[data-lbl=min]').textContent = kEur(a)+' min'; el.querySelector('[data-lbl=max]').textContent = kEur(b)+' max';
    el.querySelectorAll('.pv-histo i').forEach(i => i.classList.toggle('in',+i.dataset.mid >= a && +i.dataset.mid <= b));
    const hook = P.rangeHooks[el.dataset.range], show = el.closest('.pv-panel')?.querySelector('.pv-show');
    if (hook?.preview && show) show.firstChild.textContent = hook.preview(a === lo ? null : a,b === hi ? null : b)+' ';
  }
  function rangeSet(el,t,v,commit) {
    const st = rangeState(el); v = Math.round((v-st.lo)/st.step)*st.step+st.lo; v = Math.max(st.lo,Math.min(st.hi,v));
    let {a,b} = st;
    if (t === 'min') a = Math.min(v,b-st.step); else b = Math.max(v,a+st.step);
    rangePaint(el,a,b);
    if (commit) P.rangeHooks[el.dataset.range]?.commit(a <= st.lo ? null : a,b >= st.hi ? null : b);
  }
  P.after.push(root => {
    if (root._pvRange) return; root._pvRange = true;
    let drag = null;
    root.addEventListener('pointerdown',e => {
      const sl = e.target.closest?.('.pv-range .pv-slider'); if (!sl || e.button) return;
      const el = sl.closest('.pv-range'), r = sl.getBoundingClientRect(), st = rangeState(el);
      const val = x => st.lo+Math.max(0,Math.min(1,(x-r.left)/r.width))*(st.hi-st.lo);
      const v = val(e.clientX), t = e.target.closest('.thumb')?.dataset.t || (Math.abs(v-st.a) <= Math.abs(v-st.b) ? 'min' : 'max');
      drag = {el,t,val,id:e.pointerId,sl}; sl.setPointerCapture(e.pointerId); el.classList.add('dragging');
      el.querySelector(`.thumb[data-t="${t}"]`).classList.add('active'); el.querySelector(`.thumb[data-t="${t}"]`).focus({preventScroll:true});
      rangeSet(el,t,v,false); e.preventDefault();
    });
    root.addEventListener('pointermove',e => { if (drag && e.pointerId === drag.id) rangeSet(drag.el,drag.t,drag.val(e.clientX),false); });
    const end = e => { if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; d.el.classList.remove('dragging'); rangeSet(d.el,d.t,d.val(e.clientX),true); };
    root.addEventListener('pointerup',end); root.addEventListener('pointercancel',end);
  });
  P.keys.unshift(e => {
    const t = e.target.closest?.('.pv-range .thumb'); if (!t) return;
    const el = t.closest('.pv-range'), st = rangeState(el), cur = t.dataset.t === 'min' ? st.a : st.b;
    const next = {ArrowLeft:cur-st.step,ArrowDown:cur-st.step,ArrowRight:cur+st.step,ArrowUp:cur+st.step,PageDown:cur-st.step*10,PageUp:cur+st.step*10,Home:st.lo,End:st.hi}[e.key];
    if (next == null) return;
    rangeSet(el,t.dataset.t,next,true); return true;
  });
  P.tiles = (keys,on,action) => `<div class="pv-tiles">${keys.map(k => `<button class="pv-tile" data-a="${action}" data-v="${k}" aria-pressed="${on.includes(k)}">${I(D.FEATURES[k].icon)}${esc(D.FEATURES[k].label)}</button>`).join('')}</div>`;

  function filtersPanel() {
    const g = S().g, f = g.f, o = g.open, n = visible().length;
    const locs = [...new Set(allDevs().map(d => d.loc))];
    const types = [...new Set(allDevs().flatMap(d => D.unitsOf(d.id).map(u => u.type)))];
    const prices = allDevs().flatMap(d => avail(d).map(u => u.price));
    const bedsLabel = f.beds.length ? f.beds.map(b => b === 0 ? 'Studio' : b === 4 ? '4+' : b).join(', ')+' beds' : 'Any';
    return `<div class="pv-panel pv-filters" data-pk="gfilters" data-keep="gfilters" role="dialog" aria-label="Filters">
      <div class="pv-panel-h">Filters<button class="pv-esc" data-a="gReset" aria-label="Reset filters">${I('restart_alt')}</button></div>
      ${P.fsec('loc','Location',f.loc || 'Any',`<div class="pv-opts">${['',...locs].map(l => `<button class="pv-opt" data-a="gLoc" data-v="${esc(l)}" aria-pressed="${f.loc === l}">${esc(l || 'Any')}</button>`).join('')}</div>`,o.loc)}
      ${P.fsec('beds','Bedrooms',bedsLabel,`<div class="pv-opts">${[0,1,2,3,4].map(b => `<button class="pv-opt" data-a="gBeds" data-v="${b}" aria-pressed="${f.beds.includes(b)}">${b === 0 ? 'Studio' : b === 4 ? '4+' : b}</button>`).join('')}</div>`,o.beds)}
      ${P.fsec('type','Property type',P.typesLabel(f.types),P.typeOpts(types,f.types,'gType'),o.type)}
      ${P.fsec('price','Price range',f.min != null || f.max != null ? `${kEur(f.min ?? PRICE_MIN())}–${kEur(f.max ?? PRICE_MAX())}` : 'Any',P.priceBlock(prices,f.min,f.max,PRICE_MIN(),PRICE_MAX(),'g'),o.price)}
      ${P.fsec('feat','Features',f.feats.length ? f.feats.length+' selected' : 'Any',P.tiles(D.GALLERY_FEATURES,f.feats,'gFeat'),o.feat)}
      <button class="pv-show" data-a="gPanel" data-v="">Show ${n} matching ${n === 1 ? 'development' : 'developments'} ${I('arrow_forward')}</button>
    </div>`;
  }
  function queuePanel() {
    const q = S().queue;
    return `<div class="pv-panel pv-dock pv-queue" data-pk="queue" role="dialog" aria-label="Presentation queue">
      <div class="pv-panel-h">Presentation Queue<button class="pv-esc" data-a="gPanel" data-v="">Esc</button></div>
      ${q.length ? q.map((id,i) => { const d = DEV(id); return `<div class="pv-row" draggable="true" data-drag="${id}"><img src="${esc(P.devPhoto(d))}" alt=""><div class="t"><b>${esc(d.name)}</b><small>${i+1} of ${q.length} · ${esc(d.loc)}</small></div>
        <button class="pv-ib handle" data-a="qMove" data-v="${id}:-1" aria-label="Move ${esc(d.name)} up" ${i ? '' : 'disabled'}>${I('drag_indicator')}</button><button class="pv-ib" data-a="qToggle" data-v="${id}" aria-label="Remove ${esc(d.name)}">${I('close')}</button></div>`; }).join('')
      : '<div class="pv-sel-empty">Select developments with ✓ to build the presentation.</div>'}
    </div>`;
  }
  const AI_HINTS = ['Sea views, two or three bedrooms','Under €400k with parking','Penthouses in Miami','Two bedrooms with a terrace'];
  function aiPanel() {
    return `<div class="pv-panel pv-dock pv-ai" data-pk="ai" role="dialog" aria-label="Ask Bricly AI">
      <textarea data-f="ai" data-enter="aiAsk" placeholder="Show me all the developments that have sea views and are either two or three bedrooms" aria-label="Ask Bricly AI" data-autofocus>${esc(S().g.ai)}</textarea>
      <div class="hint">${AI_HINTS.map(h => `<button class="pv-opt" data-a="aiHint" data-v="${esc(h)}">${esc(h)}</button>`).join('')}</div>
      <div class="foot"><button class="ask" data-a="aiAsk">Ask Bricly AI</button><button class="pv-esc" data-a="gPanel" data-v="">Esc</button></div></div>`;
  }
  function searchPanel() {
    const q = S().g.q.trim().toLowerCase();
    const hits = allDevs().filter(d => !q || [d.name,d.loc,d.tag].join(' ').toLowerCase().includes(q));
    return `<div class="pv-panel pv-dock pv-search" data-pk="search" role="dialog" aria-label="Search developments">
      <div class="in">${I('search')}<input data-f="q" value="${esc(S().g.q)}" placeholder="Search developments" aria-label="Search developments" data-autofocus><button class="pv-esc" data-a="gPanel" data-v="">Esc</button></div>
      ${hits.map(d => { const on = S().queue.includes(d.id); return `<button class="pv-row ${on ? 'on' : ''}" data-a="qToggle" data-v="${d.id}" aria-pressed="${on}"><img src="${esc(P.devPhoto(d))}" alt=""><div class="t"><b>${esc(d.name)}</b><small>${esc(d.loc)} · from ${eur(fromPrice(d))}</small></div><span class="pv-check ${on ? 'on' : ''}">${on ? I('check') : ''}</span></button>`; }).join('') || '<div class="pv-sel-empty">No developments match.</div>'}
    </div>`;
  }
  function settingsPanel() {
    const g = S().g;
    const seg = (a,opts,cur) => `<div class="pv-group" style="height:40px;padding:3px">${opts.map(([v,ic,l]) => `<button class="pv-ib ${cur === v ? 'on' : ''}" style="width:34px;height:34px" data-a="${a}" data-v="${v}" aria-label="${l}" aria-pressed="${cur === v}">${I(ic)}</button>`).join('')}</div>`;
    return `<div class="pv-panel pv-settings" data-pk="settings" role="dialog" aria-label="Gallery settings">
      <div class="line">Theme ${seg('gTheme',[['dark','dark_mode','Dark'],['light','light_mode','Light'],['system','desktop_windows','System']],g.theme)}</div>
      <div class="line">Grid size ${seg('gSize',[[1,'apps','Small'],[2,'grid_view','Medium'],[3,'window','Large']].map(([v,i,l]) => [String(v),i,l]),String(g.size))}</div></div>`;
  }

  function cardFacts(d) { return `<div class="pv-facts"><span>${I('location_on')}${esc(d.loc)}</span><span>${I('sell')}From ${eur(fromPrice(d))}</span></div>`; }
  function acts(d) {
    const on = S().queue.includes(d.id), pop = S().g.pop === d.id;
    return `<div class="acts"><button data-a="qToggle" data-v="${d.id}" data-stop aria-pressed="${on}" class="${on ? 'on' : ''} ${pop ? (on ? 'pop' : 'unpop') : ''}" aria-label="${on ? 'Remove' : 'Add'} ${esc(d.name)} ${on ? 'from' : 'to'} presentation">${I('check')}</button><button data-a="ovOpen" data-v="${d.id}" data-stop aria-label="Open ${esc(d.name)} overview">${I('arrow_outward')}</button></div>`;
  }
  const cardT = k => k === 0 ? 'translate(-50%,-50%)' : `translate(calc(-50% + ${k}*(64.8vw + 16px)),-50%) scale(.8)`;
  const words = t => t.split(' ').map((w,i) => `<span class="wm"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
  function card(d,i,k) {
    const qi = S().queue.indexOf(d.id), far = Math.abs(k) > 1;
    return `<div class="pv-card ${k ? 'side' : 'center'} ${qi > -1 ? 'sel' : ''}" data-i="${i}" data-a="gCard" data-v="${i}" role="group" aria-label="${esc(d.name)}" ${k ? 'aria-hidden="true"' : ''}
      style="width:72vw;height:min(calc(100vh - 168px),46vw);transform:${cardT(k)};opacity:${far ? 0 : 1};pointer-events:${far ? 'none' : 'auto'};--dx:${k < 0 ? '-14vw' : '14vw'}">
      <img src="${esc(P.devPhoto(d))}" alt="${esc(d.name)}" loading="${far ? 'lazy' : 'eager'}" decoding="async">
      ${qi > -1 ? `<span class="badge ${S().g.pop === d.id ? 'pop' : ''}">${I('check')}${qi+1} in presentation</span>` : ''}${acts(d)}
      <div class="cap"><h2>${words(d.name)}</h2><div class="pv-facts"><span style="--i:0">${I('location_on')}${esc(d.loc)}</span><span style="--i:1">${I('sell')}From ${eur(fromPrice(d))}</span></div></div></div>`;
  }
  function carousel(devs) {
    const g = S().g; g.idx = Math.max(0,Math.min(g.idx,devs.length-1));
    // ±3 cards stay in the DOM so the next move can glide without a re-render.
    return `<div class="pv-stage" aria-roledescription="carousel" aria-label="Developments">${devs.map((d,i) => Math.abs(i-g.idx) > 3 ? '' : card(d,i,i-g.idx)).join('')}
      <button class="pv-chip sq pv-nav prev" data-a="gStep" data-v="-1" aria-label="Previous development" ${g.idx > 0 ? '' : 'hidden'}>${I('chevron_left')}</button>
      <button class="pv-chip sq pv-nav next" data-a="gStep" data-v="1" aria-label="Next development" ${g.idx < devs.length-1 ? '' : 'hidden'}>${I('chevron_right')}</button></div>`;
  }
  // Next / previous: the caption lifts away, the cards glide on a slow in-out curve
  // while the images trade depth, then the new name, location and price arrive in turn.
  let navTok = 0;
  P.carouselTo = target => {
    const s = S(), g = s.g, devs = visible(), i = Math.max(0,Math.min(devs.length-1,+target));
    if (g.busy) { g.pending = i; return; }
    if (i === g.idx) return;
    let stage = P.root.querySelector('.pv-stage');
    if (P.reduce() || !stage || g.view !== 'carousel') { g.idx = i; R(); return; }
    const has = x => x < 0 || x >= devs.length || stage.querySelector(`.pv-card[data-i="${x}"]`);
    if (![i-1,i,i+1].every(has)) { R(); stage = P.root.querySelector('.pv-stage'); if (![i-1,i,i+1].every(has)) { g.idx = i; R(); return; } }
    g.busy = true; g.target = i; const tok = ++navTok;
    // Intro choreography must not replay when cards trade centre/side roles.
    P.root.querySelector('.pv-gal.intro')?.classList.remove('intro');
    const from = stage.querySelector('.pv-card.center');
    from?.querySelector('.cap')?.classList.add('out');
    from?.classList.remove('arrive');
    setTimeout(() => {
      if (S() !== s) return;
      g.idx = i;
      stage.querySelectorAll('.pv-card').forEach(el => {
        const k = +el.dataset.i-i, far = Math.abs(k) > 1;
        el.style.transform = cardT(k); el.style.opacity = far ? 0 : 1; el.style.pointerEvents = far ? 'none' : 'auto';
        el.style.setProperty('--dx',k < 0 ? '-14vw' : '14vw');
        el.classList.toggle('side',k !== 0); el.classList.toggle('center',k === 0); el.classList.remove('arrive');
        if (k) el.setAttribute('aria-hidden','true'); else el.removeAttribute('aria-hidden');
        if (el !== from) el.querySelector('.cap')?.classList.remove('out');
      });
      const to = stage.querySelector(`.pv-card[data-i="${i}"]`);
      void to.offsetWidth; to.classList.add('arrive');
      stage.querySelector('.pv-nav.prev').hidden = i === 0;
      stage.querySelector('.pv-nav.next').hidden = i === devs.length-1;
    },240);
    setTimeout(() => { if (S() !== s) return; g.busy = false; if (g.pending != null) { const p = g.pending; g.pending = null; P.carouselTo(p); } },240+720);
    // Settle into a fresh render once everything has landed (identical frame, no motion).
    setTimeout(() => { if (S() === s && tok === navTok && !g.busy && s.screen === 'gallery' && g.view === 'carousel') R(); },240+2200);
  };
  function grid(devs) {
    const cols = {1:4,2:3,3:2}[S().g.size] || 3;
    return `<div class="pv-grid" style="--cols:${cols}" data-keep="ggrid">${devs.map((d,i) => `<div class="pv-gcard" style="--i:${i}" data-a="ovOpen" data-v="${d.id}" role="group" aria-label="${esc(d.name)}"><img src="${esc(P.devPhoto(d))}" alt="" loading="lazy">${acts(d)}<small>${esc(d.loc)} · From ${eur(fromPrice(d))}</small><h3>${esc(d.name)}</h3></div>`).join('')}</div>`;
  }

  function overview() {
    const s = S(), d = DEV(s.ov); if (!d) return '';
    const c = D.content(d.id), imgs = c.gallery, i = ((s.ovIdx % imgs.length)+imgs.length) % imgs.length;
    const us = D.unitsOf(d.id), av = avail(d), beds = [...new Set(av.map(u => u.beds))].sort((a,b) => a-b);
    const on = s.queue.includes(d.id);
    const label = imgs[i].includes('tower') || imgs[i].includes('dev-') ? 'Exterior' : 'Interior';
    const o = s.ovFrom; s.ovFrom = null;
    const from = o ? `--t0:${o.t}px;--r0:${o.r}px;--b0:${o.b}px;--l0:${o.l}px;--rad:${o.rad}px` : '';
    return `<div class="pv-ov ${o ? 'opening' : ''} ${o?.fade ? 'fade' : ''}" style="${from}" role="dialog" aria-modal="true" aria-label="${esc(d.name)} overview">
      <div class="bg" style="background-image:url('${esc(imgs[i])}')"></div>
      <button class="x" data-a="ovClose" aria-label="Close overview">${I('close')}</button>
      <div class="wrap"><div class="head"><h2 tabindex="-1">${esc(d.name)}</h2><span class="from">From ${eur(fromPrice(d))}</span></div>
      <div class="pv-facts" style="color:var(--secondary)"><span>${I('location_on')}${esc(d.loc)}</span><span>${I('bed')}${beds.length ? beds[0]+(beds.length > 1 ? '–'+beds[beds.length-1] : '')+' bedrooms' : '—'}</span><span>${I('apartment')}${av.length} of ${us.length} properties available</span><span>${I('event')}${esc(d.completion)}</span></div>
      <p class="desc">${esc(d.about)}</p>
      <div class="pv-amen">${d.amen.map((a,j) => `<span style="--j:${j}">${I(D.amenityIcon(a))}${esc(a)}</span>`).join('')}</div>
      <div class="pv-carousel"><img src="${esc(imgs[i])}" alt="${esc(d.name)} image ${i+1}"><button class="nav l" data-a="ovImg" data-v="${i-1}" aria-label="Previous image">${I('chevron_left')}</button><button class="nav r" data-a="ovImg" data-v="${i+1}" aria-label="Next image">${I('chevron_right')}</button></div>
      <div class="pv-thumbs">${imgs.slice(0,8).map((im,j) => `<button class="${j === i ? 'on' : ''}" data-a="ovImg" data-v="${j}" aria-label="Image ${j+1}"><img src="${esc(im)}" alt="" loading="lazy"></button>`).join('')}<span class="count">${String(i+1).padStart(2,'0')} / ${String(imgs.length).padStart(2,'0')} · ${label}</span></div>
      <div class="pv-actionbar"><span>${esc(d.name)} · ${av.length} properties available</span><div style="display:flex;gap:8px"><button class="pv-ghost" data-a="ovPresent" data-v="${d.id}">${I('slideshow')}Present now</button><button class="pv-cta sm pv-addq ${on ? 'in' : ''} ${s.g.pop === d.id ? (on ? 'pop' : 'unpop') : ''}" data-a="qToggle" data-v="${d.id}" aria-pressed="${on}"><span class="ic">${I(on ? 'check' : 'add')}</span><span class="lb">${on ? 'In presentation' : 'Add to presentation'}</span></button></div></div>
      </div></div>`;
  }

  P.screens.gallery = () => {
    const s = S(), g = s.g, devs = visible(), n = s.queue.length, fc = activeCount(g.f);
    const intro = P.from !== 'gallery' || g.reveal; g.reveal = false;
    // One-shot animation flags are consumed after this render.
    queueMicrotask(() => { g.pop = null; g.qroll = null; g.wake = false; });
    return `<div class="pv-gal ${intro ? 'intro' : ''}"><div class="pv-top"><div class="pv-chip" style="padding:0 4px 0 12px;gap:8px">${P.WORDMARK}<button class="pv-ib ${g.panel === 'filters' ? 'on' : ''}" data-a="gPanel" data-v="filters" aria-label="Filters${fc ? ', '+fc+' active' : ''}" aria-expanded="${g.panel === 'filters'}">${I('tune')}</button></div>
      <h1 class="pv-sr" tabindex="-1">Developments gallery</h1>
      <div class="r"><div class="pv-group"><button class="pv-ib" data-a="gView" data-v="grid" aria-pressed="${g.view === 'grid'}" aria-label="Grid view">${I('grid_view')}</button><button class="pv-ib" data-a="gView" data-v="carousel" aria-pressed="${g.view === 'carousel'}" aria-label="Carousel view">${I('view_carousel')}</button></div>
      <div class="pv-group"><button class="pv-ib ${g.panel === 'settings' ? 'on' : ''}" data-a="gPanel" data-v="settings" aria-label="Gallery settings">${I('wallpaper')}</button></div>
      <button class="pv-chip sq" data-a="exit" aria-label="Leave present mode">${I('close')}</button></div></div>
      ${devs.length ? (g.view === 'grid' ? grid(devs) : carousel(devs)) : `<div class="pv-empty"><b>No developments match</b>Try fewer filters.<button class="pv-ghost" data-a="gReset">${I('restart_alt')}Reset filters</button></div>`}
      ${g.panel === 'filters' ? filtersPanel() : g.panel === 'queue' ? queuePanel() : g.panel === 'ai' ? aiPanel() : g.panel === 'search' ? searchPanel() : g.panel === 'settings' ? settingsPanel() : ''}
      <div class="pv-bottom"><div class="pv-group pv-qpill"><button class="pv-ib wide pv-qbtn ${g.panel === 'queue' ? 'on' : ''}" data-a="gPanel" data-v="queue" aria-expanded="${g.panel === 'queue'}" aria-label="${n} selected">${I('playlist_play')}<span style="font-size:12px" aria-hidden="true">${roll(n)} Selected</span></button>
        <button class="pv-ib ${g.panel === 'ai' ? 'on' : ''}" data-a="gPanel" data-v="ai" aria-label="Ask Bricly AI">${I('auto_awesome')}</button><button class="pv-ib ${g.panel === 'search' ? 'on' : ''}" data-a="gPanel" data-v="search" aria-label="Search developments">${I('search')}</button></div>
        <button class="pv-cta pv-go ${g.wake ? 'wake' : ''}" data-a="presentQueue" ${n ? '' : 'disabled'}><span class="lb">Present selection</span><span class="arr">${I('arrow_forward')}</span></button></div>
      ${s.ov ? overview() : ''}</div>`;
  };

  // Count that rolls to its new value once the flying thumbnail lands.
  const roll = n => { const q = S().g.qroll; if (!q || q.from === n) return n; const up = n > q.from;
    return `<span class="pv-roll ${up ? 'up' : 'down'}" style="--d:${q.delay}ms"><span>${up ? q.from : n}</span><span>${up ? n : q.from}</span></span>`; };
  const A = P.actions, R = () => P.render();
  const toggle = (arr,v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr,v];
  A.gPanel = v => { const g = S().g; g.panel = g.panel === v ? null : (v || null); R(); P.root.querySelector('.pv-panel [data-autofocus]')?.focus(); };
  A.gView = v => { if (S().g.view === v) return; S().g.view = v; S().g.reveal = true; R(); };
  A.gIdx = v => P.carouselTo(v);
  A.gStep = v => { const g = S().g; P.carouselTo((g.busy ? (g.pending ?? g.target) : g.idx)+ +v); };
  A.gCard = v => { const g = S().g; if (g.busy) return; if (+v === g.idx) A.ovOpen(visible()[+v].id); else P.carouselTo(+v); };
  A.gTheme = v => { S().g.theme = v; R(); };
  A.gSize = v => { S().g.size = +v; S().g.view = 'grid'; R(); };
  A.fsec = v => { const o = S().screen === 'gallery' ? S().g.open : S().av[S().dev].open; o[v] = !o[v]; R(); if (o[v]) P.root.querySelector(`.pv-panel [data-a=fsec][data-v="${v}"]`)?.parentElement.classList.add('grow'); };
  A.gReset = () => { S().g.f = P.blankFilters(); S().g.idx = 0; R(); };
  A.gLoc = v => { S().g.f.loc = v; S().g.idx = 0; R(); };
  A.gBeds = v => { S().g.f.beds = toggle(S().g.f.beds,+v); S().g.idx = 0; R(); };
  A.gType = v => { const f = S().g.f; f.types = v === '' ? [] : toggle(f.types,v); S().g.idx = 0; R(); };
  A.gFeat = v => { S().g.f.feats = toggle(S().g.f.feats,v); S().g.idx = 0; R(); };
  A.qToggle = (v,el) => {
    const s = S(), g = s.g, before = s.queue.length, adding = !s.queue.includes(v);
    const src = el?.closest?.('.pv-card,.pv-gcard,.pv-row')?.querySelector('img') || el;
    const r0 = src?.getBoundingClientRect?.();
    s.queue = toggle(s.queue,v); P.persist();
    const fly = adding && r0 && !P.reduce() && !s.ov && g.panel !== 'search';
    g.pop = v; g.qroll = {from:before,delay:fly ? 620 : 60}; g.wake = before === 0 && adding;
    R();
    if (fly) flyTo(DEV(v),r0,P.root.querySelector('.pv-qbtn'));
  };
  // A thumbnail of the development arcs from the card into the "Selected" pill.
  function flyTo(d,r0,target) {
    if (!target) return;
    const r1 = target.getBoundingClientRect(), size = 76;
    const x0 = r0.left+r0.width/2-size/2, y0 = r0.top+r0.height/2-size/2, x1 = r1.left+22-size/2, y1 = r1.top+r1.height/2-size/2;
    const el = document.createElement('div');
    el.className = 'pv-fx pv-fly'; el.setAttribute('aria-hidden','true');
    el.style.cssText = `left:${x0}px;top:${y0}px;width:${size}px;height:${size}px;background-image:url('${P.devPhoto(d)}')`;
    P.root.append(el);
    const dx = x1-x0, dy = y1-y0, lift = Math.min(-120,dy*-.35);
    el.animate([
      {transform:'translate(0,0) scale(.4)',opacity:0,borderRadius:'50%'},
      {transform:'translate(0,0) scale(1.15)',opacity:1,borderRadius:'16px',offset:.18},
      {transform:`translate(${dx*.5}px,${dy*.5+lift}px) scale(.8)`,opacity:1,borderRadius:'50%',offset:.62},
      {transform:`translate(${dx}px,${dy}px) scale(.3)`,opacity:.2,borderRadius:'50%'},
    ],{duration:760,easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'}).finished.then(() => {
      el.remove();
      const pill = P.root?.querySelector('.pv-qpill'); if (!pill) return;
      pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    });
  }
  A.qMove = v => { const [id,dir] = v.split(':'), q = S().queue, i = q.indexOf(id), j = i+ +dir; if (i < 0 || j < 0 || j >= q.length) return; [q[i],q[j]] = [q[j],q[i]]; R(); };
  A['in:q'] = v => { S().g.q = v; R(); };
  A['in:ai'] = v => { S().g.ai = v; };
  A.aiHint = v => { S().g.ai = v; A.aiAsk(); };
  A.aiAsk = () => {
    const s = S(), t = (s.g.ai || '').toLowerCase(); if (!t.trim()) return;
    const f = P.blankFilters(), words = {studio:0,one:1,two:2,three:3,four:4};
    const nums = [...t.matchAll(/\b(studio|one|two|three|four|[1-4])\b(?=[^.]*bed)/g)].map(m => words[m[1]] ?? +m[1]);
    if (/studio/.test(t)) nums.push(0);
    f.beds = [...new Set(nums)];
    if (/sea|ocean|bay|harbour|water/.test(t)) f.feats.push('sea');
    if (/terrace|balcony/.test(t)) f.feats.push('terrace');
    if (/pool/.test(t)) f.feats.push('pool');
    if (/parking|garage/.test(t)) f.feats.push('parking');
    if (/garden/.test(t)) f.feats.push('garden');
    const under = t.match(/(?:under|below|less than|max(?:imum)?|up to)\s*€?\s*([\d.,]+)\s*(k|m)?/);
    if (under) { const n = parseFloat(under[1].replace(/,/g,'')); f.max = Math.round(n*(under[2] === 'm' ? 1e6 : under[2] === 'k' || n < 10000 ? 1000 : 1)); }
    if (/penthouse/.test(t)) f.types = ['Penthouse'];
    allDevs().forEach(d => { if (t.includes(d.loc.toLowerCase().split(' ')[0]) || t.includes(d.name.toLowerCase())) f.loc = f.loc || d.loc; });
    if (/miami/.test(t)) f.loc = DEV(D.MT).loc;
    s.g.f = f; s.g.idx = 0; s.g.panel = null;
    const devs = visible();
    const parts = [f.beds.length && f.beds.map(b => b === 0 ? 'studio' : b+'-bed').join(' or '),...f.feats.map(k => D.FEATURES[k].label.toLowerCase()),f.max && 'under '+kEur(f.max),f.types.length && f.types.map(x => x.toLowerCase()+'s').join(' or '),f.loc && 'in '+f.loc].filter(Boolean);
    P.toast(`${devs.length} ${devs.length === 1 ? 'development' : 'developments'}${parts.length ? ' · '+parts.join(' · ') : ''}. Filters updated.`);
  };
  A.ovOpen = (v,el) => {
    const s = S(); if (s.ov) return;
    const card = el?.closest?.('.pv-card,.pv-gcard') || P.root.querySelector('.pv-card.center');
    const r = card?.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    s.ovFrom = P.reduce() ? null : r ? {t:r.top,r:W-r.right,b:H-r.bottom,l:r.left,rad:card.classList.contains('pv-gcard') ? 20 : 24} : {t:0,r:0,b:0,l:0,rad:0,fade:true};
    s.ov = v; s.ovIdx = 0; s.g.panel = null; R(); P.root.querySelector('.pv-ov h2')?.focus({preventScroll:true});
  };
  A.ovClose = () => {
    const s = S(), ov = P.root.querySelector('.pv-ov:not(.pv-lb)');
    if (!ov || P.reduce() || ov.classList.contains('closing')) { s.ov = null; R(); return; }
    // Reverse of opening: details lift away, the blur clears, then the image settles back into its card.
    const card = P.root.querySelector(`.pv-gcard[data-v="${s.ov}"]`) || P.root.querySelector('.pv-card.center');
    const r = card?.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    if (r) Object.entries({'--t0':r.top,'--r0':W-r.right,'--b0':H-r.bottom,'--l0':r.left,'--rad':card.classList.contains('pv-gcard') ? 20 : 24}).forEach(([k,v]) => ov.style.setProperty(k,v+'px'));
    ov.classList.remove('opening','fade'); ov.classList.add('closing',r ? 'toCard' : 'toFade');
    setTimeout(() => {
      if (S() !== s || !s.ov) return; s.ov = null; R();
      const c = P.root.querySelector('.pv-card.center'); if (c) { void c.offsetWidth; c.classList.add('arrive'); }
    },r ? 1150 : 450);
  };
  A.ovImg = v => { S().ovIdx = +v; R(); };
  A.ovPresent = v => { const s = S(); s.ov = null; if (!s.queue.includes(v)) s.queue.unshift(v); else { s.queue = [v,...s.queue.filter(x => x !== v)]; } P.startDev(v); };
  A.presentQueue = () => {
    const s = S(); if (!s.queue.length || s.launching) return; s.origin = 'gallery'; P.persist();
    const gal = P.root.querySelector('.pv-gal');
    if (P.reduce() || !gal) { P.startDev(s.queue[0]); return; }
    s.launching = true; s.g.panel = null;
    P.root.querySelectorAll('.pv-panel').forEach(p => p.remove());
    gal.classList.remove('intro'); gal.classList.add('launch');
    setTimeout(() => { s.launching = false; if (S() === s && s.screen === 'gallery') P.startDev(s.queue[0]); },720);
  };
  A.exit = () => P.close();

  P.keys.push(e => {
    const s = S(); if (s.screen !== 'gallery' || s.ov || s.g.panel || s.g.view !== 'carousel') return;
    const n = visible().length;
    if (e.key === 'ArrowRight' && s.g.idx < n-1) { A.gStep(1); return true; }
    if (e.key === 'ArrowLeft' && s.g.idx > 0) { A.gStep(-1); return true; }
    if (e.key === 'Enter' && n) { A.ovOpen(visible()[s.g.idx].id); return true; }
  });
  P.keys.push(e => {
    const s = S(); if (s.screen !== 'gallery' || !s.ov) return;
    if (e.key === 'ArrowRight') { s.ovIdx++; R(); return true; }
    if (e.key === 'ArrowLeft') { s.ovIdx--; R(); return true; }
  });

  // Drag to reorder the presentation queue.
  P.after.push(root => {
    if (root._pvDnd) return; root._pvDnd = true;
    let from = null;
    root.addEventListener('dragstart',e => { const r = e.target.closest?.('[data-drag]'); if (!r) return; from = r.dataset.drag; r.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain',from); });
    root.addEventListener('dragover',e => { const r = e.target.closest?.('[data-drag]'); if (!r || !from) return; e.preventDefault(); root.querySelectorAll('.over').forEach(x => x.classList.remove('over')); r.classList.add('over'); });
    root.addEventListener('drop',e => {
      const r = e.target.closest?.('[data-drag]'); if (!r || !from) return; e.preventDefault();
      const q = S().queue, to = r.dataset.drag; if (to === from) return;
      q.splice(q.indexOf(from),1); q.splice(q.indexOf(to),0,from); from = null; P.persist(); R();
    });
    root.addEventListener('dragend',() => { from = null; root.querySelectorAll('.drag,.over').forEach(x => x.classList.remove('drag','over')); });
  });
})();
