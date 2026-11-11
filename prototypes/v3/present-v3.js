/* Present Mode v3 · core. State, storage, shell, event dispatch, transitions
 * and entry points. Screens and actions are registered by the other present-v3-*
 * modules on window.PV3. Load order: present-v3-data, present-v3, -gallery,
 * -brochure, -unit, -checkout (boots buyer links).
 */
(() => {
  'use strict';
  const D = window.PV3D, KEY = 'bricly.present.v3';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = v => JSON.parse(JSON.stringify(v));
  const now = () => new Date().toISOString();
  const uuid = p => p+'-'+(crypto.randomUUID ? crypto.randomUUID().slice(0,8) : Math.random().toString(36).slice(2,10));
  const eur = n => '€'+Math.round(n).toLocaleString('en-US');
  const kEur = n => n >= 1e6 ? '€'+(Math.round(n/1e5)/10)+'m' : '€'+Math.round(n/1000)+'k';
  const I = (n,c='') => `<span class="pv-i ${c}" aria-hidden="true">${n}</span>`;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WAVES = '<svg viewBox="0 0 16 12" width="16" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 2.5c2-1.6 4 1.6 7 0s5-1.6 7 0M1 6c2-1.6 4 1.6 7 0s5-1.6 7 0M1 9.5c2-1.6 4 1.6 7 0s5-1.6 7 0"/></svg>';
  const WORDMARK = `<span class="pv-wordmark">${WAVES}Bricly</span>`;

  let store = {version:1,sessions:{},outputs:{},records:{},contacts:{}};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.version === 1) store = {...store,...raw};
  } catch (e) { /* demo storage only; a broken record starts fresh */ }
  [...Object.values(store.outputs).flatMap(o => (o.items || []).map(i => i.uid)),...Object.values(store.records).flatMap(r => r.opportunity?.units || [])].forEach(D.register);
  Object.values(store.contacts).forEach(c => { if (!CONTACTS.some(x => x.id === c.id)) CONTACTS.push(c); });
  Object.values(store.records).forEach(r => {
    const ex = OPPS.find(o => o.id === r.opportunity.id);
    if (ex) { ex.units = [...new Set([...ex.units,...r.opportunity.units])]; ex.devs = [...new Set([...ex.devs,...r.opportunity.devs])]; }
    else OPPS.push(r.opportunity);
    Object.assign(getExt(ex || r.opportunity),r.extension);
  });
  const save = () => { try { localStorage.setItem(KEY,JSON.stringify(store)); } catch (e) { /* quota: keep in memory */ } };

  const blankFilters = () => ({loc:'',beds:[],types:[],min:null,max:null,feats:[]});
  const blankAvail = () => ({tab:'list',sort:0,f:{beds:[],types:[],floor:'',min:null,max:null,feats:[],showSold:true},fOpen:false,open:{beds:true,type:false,floor:false,price:true,feat:true},floor:null,plateSel:null,shown:40});
  function session(o = {}) {
    return {id:uuid('pv'),t0:Date.now(),started:now(),screen:'welcome',queue:[],dev:null,sec:0,loadText:'',
      g:{view:'carousel',theme:'dark',size:2,idx:0,f:blankFilters(),open:{loc:false,beds:true,type:false,price:true,feat:true},panel:null,q:'',ai:''},
      ov:null,ovIdx:0,lightbox:null,panel:null,av:{},
      unit:null,ut:'plan',card:true,acc:{details:true,sched:false,where:false},zoom:{s:1,x:0,y:0,r:0},room:0,rimg:0,style:'coastal',view:0,fin:{},lay:{},finpop:false,
      sel:[],cmpDiff:false,oppId:o.oppId || null,contactId:null,link:{type:'opportunity',q:'',name:'',email:'',phone:''},output:null,shares:[],prices:true,includeCompare:true,
      toast:'',origin:o.mode || 'gallery',buyer:null,hidePrices:false,focus:'home',sig:{slides:{},units:{},events:[]}};
  }

  let S = null, root = null, locked = [], originFocus = null, timers = [], toastTimer = 0;
  const P = window.PV3 = {D,esc,clone,now,uuid,eur,kEur,I,WAVES,WORDMARK,reduce,blankFilters,blankAvail,screens:{},actions:{},after:[],keys:[],
    get S() { return S; }, get root() { return root; }, get store() { return store; }, save};

  // Shared helpers used by several screens.
  P.dev = id => DEV(id);
  P.brandVars = id => { const b = D.brand(id); return `--b-bg:${b.bg};--b-surface:${b.surface};--b-ink:${b.ink};--b-muted:${b.muted};--b-accent:${b.accent};--b-tint:${b.tint};--b-reserved:${b.reserved};--b-line:${b.line};--b-display:${b.display};--b-text:${b.text}`; };
  P.devPhoto = d => D.asset+d.photo;
  P.isSel = uid => S.sel.some(i => i.uid === uid);
  P.finish = (uid,id) => { const u = D.unit(uid); const fins = D.finishesFor(DEV(u?.dev)?.id); return fins.find(f => f.id === id) || fins[0] || null; };
  P.unitFinish = uid => S.sel.find(i => i.uid === uid)?.finish || S.fin[uid] || D.defaultFinish(DEV(D.unit(uid)?.dev)?.id);
  P.unitPrice = (uid,finishId = P.unitFinish(uid)) => { const u = D.unit(uid); return u ? u.price+(P.finish(uid,finishId)?.delta || 0) : 0; };
  // Preferences that outlive a session: quick start, language and display currency.
  const PREFS_KEY = 'bricly.present.prefs';
  P.prefs = (() => { try { return {quick:false,lang:'en',ccy:'local',...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')}; } catch (e) { return {quick:false,lang:'en',ccy:'local'}; } })();
  P.savePrefs = () => { try { localStorage.setItem(PREFS_KEY,JSON.stringify(P.prefs)); } catch (e) { /* private mode */ } };
  P.t = k => D.T9N[P.prefs.lang]?.[k] || k;
  // Money and area follow each development's market; a display currency converts approximately.
  const devOfRef = r => !r ? null : typeof r === 'string' ? DEV(r) : r.dev && !r.loc ? DEV(r.dev) : r;
  P.ccyOf = r => D.commerce(devOfRef(r)?.id)?.currency || 'EUR';
  P.areaOf = r => D.commerce(devOfRef(r)?.id)?.area || 'm2';
  P.dispCcy = r => P.prefs.ccy === 'local' ? P.ccyOf(r) : P.prefs.ccy;
  P.toCcy = (n,r,to = P.dispCcy(r)) => { const from = P.ccyOf(r); return from === to ? n : n/D.FX[from].rate*D.FX[to].rate; };
  const sym = c => D.FX[c]?.sym || c+' ';
  P.fmtIn = (n,c,approx = false) => (approx ? '≈ ' : '')+sym(c)+Math.round(n).toLocaleString('en-US');
  P.kIn = (n,c) => sym(c)+(n >= 1e6 ? (Math.round(n/1e5)/10)+'m' : Math.round(n/1000)+'k');
  P.fmt = (n,r,{force = false} = {}) => {
    if (S?.hidePrices && !force) return P.t('Price on request');
    const to = P.dispCcy(r); return P.fmtIn(P.toCcy(n,r,to),to,to !== P.ccyOf(r));
  };
  P.ar = (m2,r) => P.areaOf(r) === 'sqft' ? Math.round(m2*10.7639).toLocaleString('en-US')+' sq ft' : (+m2).toLocaleString('en-US')+' m²';
  P.areaUnit = r => P.areaOf(r) === 'sqft' ? 'sq ft' : 'm²';
  P.ppa = (price,m2,r,o) => { const a = P.areaOf(r) === 'sqft' ? m2*10.7639 : m2; return S?.hidePrices && !o?.force ? '' : P.fmt(price/a,r,o)+' / '+P.areaUnit(r); };
  // The buyer's layout / finish / style for a unit: selection first, then this session's choice, then the defaults.
  P.unitLayout = uid => S.sel.find(i => i.uid === uid)?.layout || S.lay[uid] || D.defaults(D.unit(uid),P.unitFinish(uid)).layout || '';
  P.combo = uid => ({layout:P.unitLayout(uid),pack:P.unitFinish(uid),style:S.style});
  P.unitImg = uid => { const u = D.unit(uid); return D.renderRooms(u,P.combo(uid))[0]?.imgs[0]?.img || P.devPhoto(DEV(u.dev)); };
  P.planHtml = (u,h = 200) => { const img = D.planImg(u) || (u.dev === 'Miami Tropic' ? D.asset+'miami/plan.png' : '');
    return img ? `<img src="${esc(img)}" alt="Floor plan ${esc(u.id)}" loading="lazy">` : (typeof unPlanSVG === 'function' ? unPlanSVG(u,h) : ''); };
  P.statusText = u => ({available:'Available',reserved:'Reserved',hold:'On hold',sold:'Sold',off_market:'Off market'}[u.status] || 'Unavailable');
  // The whole session is snapshotted so a reload or dropped connection can resume mid-presentation.
  const TRANSIENT = ['toast','panel','ov','ovFrom','lightbox','launching','finpop','buyerBack','splashAuto','slideEnter','viewer'];
  P.snapshot = () => { const x = clone(S); TRANSIENT.forEach(k => delete x[k]); x.g.panel = null; x.g.busy = false; x.g.pending = null; return x; };
  P.persist = () => {
    if (!S || S.viewer || S.screen === 'buyer') return;
    store.sessions[S.id] = {id:S.id,started:S.started,queue:S.queue,sel:S.sel,oppId:S.oppId,output:S.output,sig:S.sig,partner:S.partner || null,updated:now()};
    store.active = {at:Date.now(),snap:P.snapshot()}; save();
  };

  function later(ms,fn) { const id = S?.id; const t = setTimeout(() => { if (S && S.id === id) fn(); },reduce() ? Math.min(ms,450) : ms); timers.push(t); }
  P.later = later;
  P.toast = (text,ms = 3200) => { S.toast = text; render(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { if (S && S.toast === text) { S.toast = ''; render(); } },ms); };

  function mount() {
    if (root) return;
    originFocus = document.activeElement;
    root = document.createElement('section');
    root.id = 'pv-shell'; root.className = 'pv'; root.setAttribute('aria-label','Bricly Present Mode');
    document.body.append(root); document.body.classList.add('pv-active');
    locked = [...document.body.children].filter(e => e !== root && !['SCRIPT','STYLE','LINK'].includes(e.tagName)).map(e => [e,e.inert,e.getAttribute('aria-hidden')]);
    locked.forEach(([e]) => { e.inert = true; e.setAttribute('aria-hidden','true'); });
    root.addEventListener('click',click);
    root.addEventListener('input',input);
    root.addEventListener('change',change);
    root.addEventListener('keydown',e => { if (e.target.matches('[data-enter]') && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); act(e.target.dataset.enter,'',e.target,e); } });
    document.addEventListener('keydown',keys,true);
    addEventListener('resize',onResize);
  }
  function unmount() {
    timers.forEach(clearTimeout); timers = [];
    document.removeEventListener('keydown',keys,true); removeEventListener('resize',onResize);
    root?.remove(); root = null; document.body.classList.remove('pv-active');
    locked.forEach(([e,inert,aria]) => { e.inert = inert; if (aria === null) e.removeAttribute('aria-hidden'); else e.setAttribute('aria-hidden',aria); });
    locked = [];
    if (originFocus?.isConnected) originFocus.focus();
  }
  P.close = (toOpp = false) => {
    const oid = S?.oppId; P.persist(); if (!S?.viewer) { delete store.active; save(); } P.onClose?.(S); unmount(); S = null;
    if (/^#present(-live|-partner)?=/.test(location.hash)) history.replaceState(null,'',location.pathname+location.search);
    if (toOpp && oid && typeof openOpp === 'function') openOpp(oid);
  };

  const themeOf = () => S.g.theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : S.g.theme;
  // Screen changes dissolve: the outgoing screen is kept as an inert overlay that animates away.
  let lastScreen = null;
  const LEAVE = {welcome:'soft',loading:'zoom'};
  function render() {
    if (!root || !S) return;
    const from = lastScreen; P.from = from; lastScreen = S.screen;
    // Capture scroll and focus before the old nodes are removed.
    const keep = [...root.querySelectorAll('[data-keep]:not(.pv-leave [data-keep])')].map(e => [e.dataset.keep,e.scrollTop,e.scrollLeft]);
    const a = document.activeElement, focus = root.contains(a) ? {f:a.dataset?.f,a:a.dataset?.a,v:a.dataset?.v,start:a.selectionStart,end:a.selectionEnd} : null;
    // Outgoing nodes stay in place (moving them would restart their animations) and fade above the new screen.
    const leaving = from && from !== S.screen && !reduce();
    // Floating panels: remember which are open so they only animate in once, and animate out when closed.
    const oldPanels = leaving || reduce() ? [] : [...root.querySelectorAll('.pv-panel[data-pk]:not(.pv-panel-out)')];
    root.querySelectorAll('.pv-panel-out').forEach(n => n.remove());
    [...root.childNodes].forEach(n => {
      if (n.nodeType === 1 && n.classList.contains('pv-fx')) return;
      if (leaving && n.nodeType === 1 && !n.classList.contains('pv-leave') && !n.classList.contains('pv-toast')) {
        n.classList.add('pv-leave'); if (LEAVE[from]) n.classList.add(LEAVE[from]);
        n.inert = true; n.setAttribute('aria-hidden','true');
        const done = () => n.remove();
        n.addEventListener('animationend',e => { if (e.target === n) done(); }); setTimeout(done,1500);
      } else n.remove();
    });
    root.dataset.theme = S.screen === 'buyer' ? 'light' : themeOf();
    root.dataset.screen = S.screen;
    const screen = P.screens[S.screen];
    const tpl = document.createElement('template');
    tpl.innerHTML = (screen ? screen() : '')+(S.toast ? `<div class="pv-toast" role="status">${I('auto_awesome')}<span>${esc(S.toast)}</span></div>` : '');
    root.prepend(tpl.content);
    const keys = new Set(oldPanels.map(n => n.dataset.pk));
    root.querySelectorAll('.pv-panel[data-pk]').forEach(n => { if (keys.has(n.dataset.pk)) n.classList.add('still'); });
    oldPanels.forEach(n => {
      if (root.querySelector(`.pv-panel[data-pk="${n.dataset.pk}"]:not(.pv-panel-out)`)) return;
      n.classList.add('pv-panel-out'); n.classList.remove('still'); n.inert = true; n.setAttribute('aria-hidden','true');
      (root.querySelector('.pv-gal,.pv-present,.pv-unit') || root).append(n);
      const done = () => n.remove(); n.addEventListener('animationend',e => { if (e.target === n) done(); }); setTimeout(done,600);
    });
    keep.forEach(([k,t,l]) => { const e = root.querySelector(`[data-keep="${k}"]`); if (e) { e.scrollTop = t; e.scrollLeft = l; } });
    if (focus) {
      const sel = focus.f ? `[data-f="${focus.f}"]` : focus.a ? `[data-a="${focus.a}"][data-v="${CSS.escape(focus.v || '')}"]` : null;
      const el = sel && root.querySelector(sel);
      if (el) { el.focus({preventScroll:true}); if (focus.start != null && el.setSelectionRange) try { el.setSelectionRange(focus.start,focus.end); } catch (e) { /* non-text input */ } }
    }
    P.after.forEach(fn => fn(root,S));
  }
  P.render = render;
  // Leave Present Mode from anywhere. The session is saved and can be resumed.
  P.closeBtn = () => S?.viewer ? '' : `<button class="pv-chip sq pv-exit" data-a="exit" aria-label="Close Present Mode" title="Close Present Mode">${I('close')}</button>`;
  P.actions.exit = () => P.close();
  P.mount = mount; P.setS = x => { S = x; }; P.newSession = session;
  P.go = screen => { S.screen = screen; S.panel = null; S.g.panel = null; S.finpop = false; render(); root?.querySelector('h1,h2,[data-autofocus]')?.focus?.({preventScroll:true}); };

  function act(a,v,el,e) {
    const fn = P.actions[a];
    if (fn) fn(v,el,e);
  }
  function click(e) {
    const el = e.target.closest('[data-a]');
    if (!el || !root.contains(el) || el.disabled) {
      // Clicking outside a floating panel closes it.
      if (!e.target.closest('.pv-panel') && (S.panel || S.g.panel || S.finpop)) { if (P.onPanelsClose?.() === true) return; S.panel = null; S.g.panel = null; S.finpop = false; render(); }
      return;
    }
    if (el.dataset.stop !== undefined) e.stopPropagation();
    if (S.viewer && !el.dataset.a.startsWith('viewer')) return;
    act(el.dataset.a,el.dataset.v ?? '',el,e);
  }
  function input(e) { const el = e.target.closest('[data-f]'); if (el && P.actions['in:'+el.dataset.f]) P.actions['in:'+el.dataset.f](el.value,el,e); }
  function change(e) { const el = e.target.closest('[data-f]'); if (el && P.actions['ch:'+el.dataset.f]) P.actions['ch:'+el.dataset.f](el.value,el,e); }
  function keys(e) {
    if (!root || !S) return;
    const typing = e.target.matches?.('input,textarea,select');
    if (e.key === 'Escape') {
      e.preventDefault();
      if (S.lightbox) { S.lightbox = null; render(); return; }
      if (S.panel || S.g.panel || S.finpop) { if (P.onPanelsClose?.() === true) return; S.panel = null; S.g.panel = null; S.finpop = false; render(); return; }
      if (S.ov) { P.actions.ovClose ? P.actions.ovClose() : (S.ov = null, render()); return; }
      if (typing) { e.target.blur(); return; }
      P.back();
      return;
    }
    if (typing || S.viewer) return;
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role=button][data-a]:not(button)')) { e.preventDefault(); e.target.click(); return; }
    for (const fn of P.keys) if (fn(e) === true) { e.preventDefault(); return; }
  }
  P.back = () => {
    if (!S) return;
    const s = S.screen;
    if (s === 'unit') P.actions.unitBack();
    else if (s === 'compare') P.go(S.cmpBack || 'present');
    else if (s === 'buyer' && S.buyerBack) P.go(S.buyerBack);
    else if (s === 'present' && S.origin !== 'dev') P.go('gallery');
    else if (s === 'welcome' || s === 'loading') P.actions.skipIntro?.();
  };
  let resizeRaf = 0;
  function onResize() { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(() => P.after.forEach(fn => fn(root,S,'resize'))); }

  // Transitions: welcome → loading developments → gallery, or loading {dev} → presentation.
  P.split = (text,cls = 'ch') => [...text].map((c,i) => c === ' ' ? '<span class="sp"> </span>' : `<span class="${cls}" style="--i:${i}">${esc(c)}</span>`).join('');
  // Aurora: drifting light, a slow halo ring and film grain. --t keeps the motion
  // continuous across re-renders by starting every animation at the session's elapsed time.
  P.aurora = (pal = '') => `<div class="pv-aurora" aria-hidden="true" style="--t:${(-(Date.now()-S.t0)/1000).toFixed(2)}s;${pal}"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="b4"></i><i class="ring"><b></b></i><i class="veil"></i><i class="grain"></i></div>`;
  const brandPal = P.brandPal = id => { const b = D.brand(id); return `--c1:${b.accent};--c2:${b.tint};--c3:color-mix(in srgb,${b.accent} 45%,${b.tint});--c4:${b.bg}`; };
  const WAVE_PATHS = ['M1 2.5c2-1.6 4 1.6 7 0s5-1.6 7 0','M1 6c2-1.6 4 1.6 7 0s5-1.6 7 0','M1 9.5c2-1.6 4 1.6 7 0s5-1.6 7 0'];
  const waveMark = () => `<svg class="pv-wave" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">${WAVE_PATHS.map((d,i) => `<path d="${d}" pathLength="1" style="--i:${i}"/>`).join('')}</svg>`;
  // White-label: the seller's brand (or the partner presenting) leads; Bricly is a quiet credit.
  P.screens.welcome = () => { const host = S.partner?.name || D.COMPANY.name;
    return `<div class="pv-orb pv-welcome" data-a="skipIntro">${P.aurora()}
    <div class="pv-loadwrap"><h1 tabindex="-1" aria-label="Welcome to" style="--d:.3s">${P.split('Welcome to')}</h1>
    <div class="pv-brandmark host" aria-label="${esc(host)}"><span style="--d:.9s;--step:42ms" aria-hidden="true">${P.split(host)}</span></div>
    ${S.partner ? `<p class="pv-meta" style="animation-delay:1.4s">Presenting ${esc(D.COMPANY.name)}</p>` : ''}</div>
    <span class="pv-powered">${waveMark()}Powered by Bricly</span>
    <button class="pv-ghost pv-skip" data-a="skipIntro">Skip ${I('arrow_forward')}</button></div>`; };
  P.screens.loading = () => {
    const d = S.loadDev && DEV(S.loadDev), ms = S.loadMs || 1800;
    const devs = S.partner ? S.partner.devs.map(DEV).filter(Boolean) : DEVS;
    const meta = d ? `${esc(d.loc)} · ${D.unitsOf(d.id).filter(u => u.status === 'available').length} residences available`
      : `${devs.length} developments · ${devs.reduce((n,x) => n+D.unitsOf(x.id).filter(u => u.status === 'available').length,0)} residences available`;
    return `<div class="pv-orb pv-loading ${d ? 'dev' : ''}" style="--dur:${ms-250}ms" aria-live="polite" aria-busy="true">${P.aurora(d ? brandPal(d.id) : '')}
      <div class="pv-loadwrap">${d ? `<p class="pv-kicker" style="--d:.05s">${P.split('Now presenting')}</p>` : ''}
      <h1 tabindex="-1" class="pv-shimmer" aria-label="${esc(d ? 'Loading '+d.name : S.loadText)}" style="--d:${d ? '.25s' : '.05s'}${d ? ';font-family:'+D.brand(d.id).display : ''}">${P.split(d ? d.name : S.loadText)}</h1>
      <div class="pv-bar" aria-hidden="true"><i></i></div><p class="pv-meta">${meta}</p></div></div>`;
  };
  // Let the loading copy exit before the screen dissolves.
  const exitThen = fn => { const w = root?.querySelector('.pv-loadwrap'); if (w && !reduce()) { w.classList.add('out'); later(380,fn); } else fn(); };
  function intro() {
    S.screen = 'welcome'; render();
    const q = P.prefs.quick;
    later(q ? 1100 : 2300,() => exitThen(() => {
      if (S.screen !== 'welcome') return;
      S.screen = 'loading'; S.loadDev = null; S.loadText = 'Loading Developments'; S.loadMs = q ? 1000 : 1900; render();
      later(q ? 1000 : 1900,() => exitThen(() => { if (S.screen === 'loading') P.go('gallery'); }));
    }));
  }
  P.actions.skipIntro = () => { if (['welcome','loading'].includes(S.screen) && !S.dev) P.go('gallery'); };
  P.startDev = (id,{uid = null,sec = 0} = {}) => {
    const d = DEV(id); if (!d) return;
    if (!S.queue.includes(d.id)) S.queue.push(d.id);
    S.dev = d.id; S.sec = sec; S.panel = null; S.av[d.id] ||= blankAvail();
    // The development's logo slide is its loading screen; it moves on to the introduction by itself.
    if (!uid && !sec) { S.splashAuto = d.id; P.go('present'); return; }
    S.screen = 'loading'; S.loadDev = d.id; S.loadText = 'Loading '+d.name; S.loadMs = 1700; render();
    later(1700,() => exitThen(() => { if (S.screen !== 'loading') return; if (uid) P.openUnit(uid); else P.go('present'); }));
  };

  function open(o = {}) {
    if (root) return;
    S = session(o); mount();
    if (o.partner) S.partner = o.partner;
    if (o.oppId) { const opp = OPPS.find(x => x.id === o.oppId); S.contactId = CONTACTS.find(c => c.oppIds?.includes(o.oppId))?.id || null; if (opp) S.link.type = 'opportunity'; }
    if (o.mode === 'buyer') { S.buyer = o.id; S.screen = 'buyer'; render(); return; }
    const ids = (o.ids || []).map(DEV).filter(Boolean).map(d => d.id);
    if (o.mode === 'unit' && o.uid) { const u = D.unit(o.uid); if (!u) return P.close(); S.origin = 'dev'; S.queue = [DEV(u.dev).id]; P.startDev(DEV(u.dev).id,{uid:o.uid}); return; }
    if (o.mode === 'dev' && ids.length) { S.origin = 'dev'; S.queue = ids; P.startDev(ids[0]); return; }
    S.queue = ids; intro();
  }
  P.open = open;

  // Entry points. The CRM keeps calling the same global hooks; they now open v3.
  window.prOpenLobby = () => open({mode:'gallery'});
  window.prOpenDev = id => { const d = DEV(id); if (d) open({mode:'dev',ids:[d.id]}); };
  window.prOpen = uid => { if (D.unit(uid)) open({mode:'unit',uid}); };
  window.qaPresent = () => { const o = typeof oppCur !== 'undefined' ? oppCur : null; if (o) P.presentOpportunity(o.id); };
  P.presentOpportunity = id => { const o = OPPS.find(x => x.id === id); if (!o) return; const ids = o.devs.map(DEV).filter(Boolean).map(d => d.id); open({mode:ids.length ? 'dev' : 'gallery',ids,oppId:id}); };
  P.presentDevelopments = ids => { const ds = (ids || []).map(DEV).filter(Boolean).map(d => d.id); open({mode:ds.length ? 'dev' : 'gallery',ids:ds}); };
  if (window.PM) { window.PM.presentDevelopments = P.presentDevelopments; window.PM.presentOpportunity = P.presentOpportunity; }
})();
