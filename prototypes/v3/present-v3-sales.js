/* Present Mode v3 · Sales layer: the commercial capabilities around the presentation.
 * Holds with a live countdown, live inventory across tabs, session resume, buyer
 * intent signals and owner insights, buyer-link engagement, a live co-viewing link,
 * partner (broker) mode with client registration, and presenter preferences.
 * Load after present-v3-checkout.js.
 */
(() => {
  'use strict';
  const P = window.PV3, D = P.D, {esc, I} = P;
  const S = () => P.S;
  const R = () => P.render();
  const A = P.actions;
  const store = () => P.store;
  const KEY = 'bricly.present.v3', HOUR = 36e5;
  const fmtDur = ms => { const s = Math.round(ms/1000); return s < 60 ? s+'s' : Math.floor(s/60)+'m '+String(s%60).padStart(2,'0')+'s'; };

  // Presenter preferences (shared by the gallery settings and the Pages panel).
  P.prefsRows = (compact = false) => {
    const p = P.prefs, seg = (a,opts,v) => `<div class="pv-seg" style="margin:0">${opts.map(([k,l]) => `<button data-a="${a}" data-v="${k}" aria-pressed="${v === k}">${l}</button>`).join('')}</div>`;
    return `<div class="pv-ctl"><span>Prices in</span>${seg('prefCcy',[['local','Local'],['EUR','€'],['USD','$'],['GBP','£'],['AED','AED']],p.ccy)}</div>
      <div class="pv-ctl"><span>Language</span>${seg('prefLang',Object.entries(D.LANGS).map(([k,l]) => [k,k === 'zh' ? l : k.toUpperCase()]),p.lang)}</div>
      ${compact ? '' : `<button class="pv-optrow" data-a="prefQuick" aria-pressed="${p.quick}"><span>Quick start<small class="pv-muted"> · shorter intro and loading</small></span><span class="pv-toggle ${p.quick ? 'on' : ''}"></span></button>`}`;
  };
  A.prefCcy = v => { P.prefs.ccy = v; P.savePrefs(); S().output = null; R(); };
  A.prefLang = v => { P.prefs.lang = v; P.savePrefs(); S().output = null; R(); };
  A.prefQuick = () => { P.prefs.quick = !P.prefs.quick; P.savePrefs(); R(); };
  P.keys.unshift(e => {
    const s = S(); if (!s || !(e.key === 'P' && e.shiftKey) || !['gallery','present','unit','compare'].includes(s.screen)) return;
    s.hidePrices = !s.hidePrices; R(); P.toast(s.hidePrices ? 'Prices hidden' : 'Prices shown',1600); return true;
  });

  // Holds: a 48-hour courtesy hold the rep can place in the room. Other reps and tabs see it live.
  const holds = () => (store().holds ||= {});
  const mine = uid => holds()[uid]?.by === S()?.id;
  P.heldByMe = uid => mine(uid);
  P.canTake = u => !!u && (u.status === 'available' || (u.status === 'hold' && mine(u.id)));
  const baseStatus = P.statusText;
  P.statusText = u => u?.status === 'hold' && S() && mine(u.id) ? P.t('Held for you') : P.t(baseStatus(u));
  const left = uid => Math.max(0,(holds()[uid]?.until || 0)-Date.now());
  const clock = ms => { const s = Math.floor(ms/1000); return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; };
  P.holdChip = u => mine(u.id) ? `<div class="pv-holdchip">${I('timer')}<span>${P.t('Held for you')} · <b data-hold-cd="${esc(u.id)}">${clock(left(u.id))}</b></span></div>` : '';
  P.holdButton = u => {
    if (S().viewer || S().partner) return '';
    if (mine(u.id)) return `<div class="pv-selbar pv-holdbar"><button class="on" data-a="release" data-v="${esc(u.id)}">${I('lock_open')}Release hold</button></div>`;
    if (!P.canTake(u)) return '';
    const h = D.commerce(DEV(u.dev).id).hold;
    return `<div class="pv-selbar pv-holdbar"><button data-a="hold" data-v="${esc(u.id)}" title="Holds the residence for ${h.hours} hours · ${esc(h.deposit)}">${I('timer')}${P.t('Hold for 48 hours')}</button></div>`;
  };
  function logOpp(text,key) {
    const o = OPPS.find(x => x.id === S().oppId); if (!o) return;
    const x = getExt(o); x.comms ||= []; if (key && x.comms.some(e => e.presentKey === key)) return;
    x.comms.unshift({ch:'sys',t:'Just now',text,presentKey:key}); store().records[o.id] = {opportunity:P.clone(o),extension:P.clone(x)};
  }
  A.hold = uid => {
    const s = S(), u = D.register(uid); if (!u || !P.canTake(u)) return;
    const h = D.commerce(DEV(u.dev).id).hold;
    holds()[uid] = {by:s.id,rep:UN_REP,oppId:s.oppId,at:Date.now(),until:Date.now()+h.hours*HOUR,deposit:h.deposit};
    u.status = 'hold'; (store().inventory ||= {})[uid] = 'hold';
    if (!P.isSel(uid)) { s.popSel = uid; P.toggleSel(uid); s.popSel = null; }
    sig().units[uid] = {...unitSig(uid),held:true};
    logOpp(`Present Mode · ${uid} held for ${h.hours} hours by ${UN_REP}`,s.id+':hold:'+uid);
    P.persist(); R(); P.toast(`${uid} held for ${h.hours} hours`);
  };
  function releaseHold(uid,quiet) {
    const u = D.unit(uid); delete holds()[uid];
    if (u && u.status === 'hold') { u.status = 'available'; (store().inventory ||= {})[uid] = 'available'; }
    P.save(); if (!quiet && S()) { R(); P.toast(`${uid} released`); }
  }
  A.release = uid => { if (mine(uid)) { releaseHold(uid); logOpp(`Present Mode · hold on ${uid} released`); } };
  A.reserve = uid => {
    const s = S(), h = holds()[uid], u = D.unit(uid); if (!h || !s.oppId) return;
    h.agreement = Date.now();
    logOpp(`Reservation agreement sent for ${uid} · ${D.commerce(DEV(u.dev).id).hold.deposit} deposit · ${D.commerce(DEV(u.dev).id).currency === 'USD' ? 'condominium documents attached' : 'promise of sale draft attached'} (simulated)`,s.id+':agree:'+uid);
    P.persist(); R(); P.toast('Reservation agreement sent (simulated)');
  };
  P.holdsHtml = () => {
    const s = S(), mineList = Object.keys(holds()).filter(mine); if (!mineList.length) return '';
    return `<div class="pv-holds"><div class="pv-holds-h">${I('timer')}Held in this presentation</div>${mineList.map(uid => { const h = holds()[uid];
      return `<div class="pv-holdrow"><div><b>${esc(uid)}</b><small><span data-hold-cd="${esc(uid)}">${clock(left(uid))}</span> left · ${esc(h.deposit)}</small></div>
        ${h.agreement ? `<span class="pv-muted" style="font-size:12px">${I('check')}Agreement sent</span>` : `<button class="pv-ghost" data-a="reserve" data-v="${esc(uid)}" ${s.oppId ? '' : 'disabled title="Link an opportunity first"'}>${I('draw')}Send reservation agreement</button>`}
        <button class="pv-ib" data-a="release" data-v="${esc(uid)}" aria-label="Release ${esc(uid)}">${I('close')}</button></div>`; }).join('')}</div>`;
  };

  // Live inventory: statuses are re-checked every second and on changes from other tabs.
  const statusSig = () => { const s = S(); if (!s) return ''; const ids = new Set(s.sel.map(i => i.uid)); if (s.unit) ids.add(s.unit);
    if (s.dev && ['present','unit'].includes(s.screen)) D.unitsOf(s.dev).forEach(u => ids.add(u.id));
    return [...ids].sort().map(id => id+':'+(D.unit(id)?.status || '')).join('|'); };
  let lastSig = '';
  function applyRemote(raw) {
    const inv = raw.inventory || {}, hs = raw.holds || {};
    Object.entries(inv).forEach(([id,st]) => { const u = D.register(id); if (u && UN_STATUS[st]) u.status = st; });
    Object.keys(holds()).forEach(id => { if (!hs[id] && D.unit(id)?.status === 'hold') { D.unit(id).status = inv[id] || 'available'; } });
    store().holds = hs; store().inventory = inv;
    Object.entries(raw.outputs || {}).forEach(([id,o]) => { if (store().outputs[id] && o.events) store().outputs[id].events = o.events; });
  }
  P.simulateStatus = (uid,status) => { const u = D.register(uid); if (!u || !UN_STATUS[status]) throw new Error('Unknown unit or status'); u.status = status; (store().inventory ||= {})[uid] = status; P.save(); };
  addEventListener('storage',e => {
    if (e.key !== KEY || !e.newValue) return;
    try { applyRemote(JSON.parse(e.newValue)); } catch (err) { return; }
    const s = S(); if (s && ['checkout'].includes(s.screen)) R();
  });
  // Re-apply persisted inventory and live holds on load; expired holds lapse.
  Object.entries(store().inventory || {}).forEach(([id,st]) => { const u = D.register(id); if (u && UN_STATUS[st]) u.status = st; });
  Object.entries(holds()).forEach(([id,h]) => { const u = D.register(id); if (!u) return; if (h.until < Date.now()) releaseHold(id,true); else u.status = 'hold'; });

  setInterval(() => {
    const s = S();
    Object.entries(holds()).forEach(([id,h]) => { if (h.until < Date.now()) { const wasMine = mine(id); releaseHold(id,true); if (wasMine && s) P.toast(`The hold on ${id} has lapsed`); } });
    document.querySelectorAll('[data-hold-cd]').forEach(el => { el.textContent = clock(left(el.dataset.holdCd)); });
    if (!s || s.viewer) return;
    const sg = statusSig();
    if (sg !== lastSig) {
      // Each selected residence is flagged once, the moment it stops being available to this buyer.
      s.flagged ||= [];
      const changed = s.sel.map(i => i.uid).filter(id => !P.canTake(D.unit(id)) && !s.flagged.includes(id));
      s.flagged.push(...changed); lastSig = sg;
      if (['present','unit','compare','checkout'].includes(s.screen) && !document.querySelector('.pv-slide.leaving')) R();
      if (changed.length) P.toast(`${changed.join(', ')} ${changed.length === 1 ? 'was' : 'were'} just ${D.unit(changed[0]).status === 'sold' ? 'sold' : 'reserved'} elsewhere`,4200);
    }
    // Buyer intent: attribute time to the slide or residence on screen.
    if (document.visibilityState === 'visible' && s.screen !== 'buyer') {
      if (s.screen === 'present' && s.dev && P.SECS[s.sec] !== 'splash') { const k = s.dev+':'+P.SECS[s.sec]; sig().slides[k] = (sig().slides[k] || 0)+1000; }
      if (s.screen === 'unit' && s.unit) unitSig(s.unit).ms += 1000;
    }
  },1000);

  // Buyer intent signals for this session.
  const sig = () => (S().sig ||= {slides:{},units:{},events:[]});
  const unitSig = uid => (sig().units[uid] ||= {ms:0,opens:0,adds:0,removes:0,compares:0,finish:null,held:false});
  const wrapOpen = P.openUnit; P.openUnit = uid => { if (S() && !S().viewer) unitSig(uid).opens++; return wrapOpen(uid); };
  const wrapSel = P.toggleSel; P.toggleSel = uid => {
    const s = S(), was = P.isSel(uid);
    // Already unavailable when added (e.g. kept for reference): don't announce it as a fresh change.
    if (!was && !P.canTake(D.unit(uid))) (s.flagged ||= []).push(uid);
    const r = wrapSel(uid); if (!s.viewer) unitSig(uid)[was ? 'removes' : 'adds']++; return r;
  };
  const wrapFin = A.finish; if (wrapFin) A.finish = (v,...rest) => { const s = S(); if (s.unit) unitSig(s.unit).finish = v; return wrapFin(v,...rest); };
  const wrapCmp = A.compare; A.compare = (...a) => { S().sel.filter(i => i.cmp).forEach(i => unitSig(i.uid).compares++); return wrapCmp(...a); };
  const slideName = k => { const [dev,id] = k.split(':'); return `${DEV(dev)?.name || dev} · ${P.t(D.PAGES.find(p => p.id === id)?.label || id)}`; };
  function summary(sg = S().sig) {
    const units = Object.entries(sg?.units || {}).sort((a,b) => (b[1].ms+b[1].opens*20000+b[1].adds*40000)-(a[1].ms+a[1].opens*20000+a[1].adds*40000)).slice(0,4);
    const slides = Object.entries(sg?.slides || {}).sort((a,b) => b[1]-a[1]).slice(0,3);
    return {units,slides};
  }
  P.signalsHtml = () => {
    const {units,slides} = summary(); if (!units.length && !slides.length) return '';
    const s = S(), o = OPPS.find(x => x.id === s.oppId);
    if (o) { const x = getExt(o); x.presentSignals = {at:P.now(),units:units.map(([id,v]) => ({id,...v})),slides:slides.map(([k,ms]) => ({slide:slideName(k),ms})),focus:s.focus}; }
    return `<div class="pv-signals"><div class="pv-holds-h">${I('insights')}Buyer signals · rep only</div>
      ${units.map(([id,v]) => `<div class="pv-sigrow"><b>${esc(id)}</b><small>${fmtDur(v.ms)} on the unit · opened ${v.opens}×${v.compares ? ' · compared' : ''}${v.finish ? ' · '+esc(P.finish(id,v.finish)?.name || v.finish)+' finish' : ''}${v.held ? ' · held' : ''}</small></div>`).join('')}
      ${slides.length ? `<div class="pv-sigrow"><b>Longest on</b><small>${slides.map(([k,ms]) => esc(slideName(k))+' ('+fmtDur(ms)+')').join(' · ')}</small></div>` : ''}
      <div class="pv-sigrow"><b>Focus</b><small>${s.focus === 'investor' ? 'Investor · numbers first' : 'Home buyer · lifestyle first'}</small></div></div>`;
  };

  // Owner insights: interest across every presentation, to inform pricing and release strategy.
  A.insightsOpen = () => { const s = S(); s.g.panel = null; s.insBack = s.screen; P.go('insights'); };
  A.insightsBack = () => P.go(S().insBack || 'gallery');
  P.screens.insights = () => {
    const all = [...Object.values(store().sessions).filter(x => x.id !== S().id).map(x => x.sig),S().sig].filter(Boolean);
    const agg = {}, slides = {};
    all.forEach(sg => {
      Object.entries(sg.units || {}).forEach(([id,v]) => { const a = agg[id] ||= {ms:0,opens:0,adds:0,compares:0,held:0,sessions:0}; a.ms += v.ms; a.opens += v.opens; a.adds += v.adds; a.compares += v.compares; a.held += v.held ? 1 : 0; a.sessions++; });
      Object.entries(sg.slides || {}).forEach(([k,ms]) => { slides[k] = (slides[k] || 0)+ms; });
    });
    const rows = Object.entries(agg).map(([id,a]) => ({id,u:D.unit(id),...a})).filter(r => r.u).sort((a,b) => (b.adds*3+b.opens+b.ms/60000)-(a.adds*3+a.opens+a.ms/60000));
    const hot = rows.filter(r => r.u.status === 'available' && (r.adds || r.ms > 45000)).slice(0,6);
    const byType = {}; rows.forEach(r => { const k = DEV(r.u.dev).name+' · '+(r.u.beds ? r.u.beds+'-bed' : 'Studio'); const t = byType[k] ||= {interest:0,taken:0}; t.interest += r.adds+r.opens; t.taken += r.u.status === 'available' ? 0 : 1; });
    return `<div class="pv-dark" data-keep="ins"><div class="pv-top"><div class="r"><button class="pv-chip" data-a="insightsBack">${I('arrow_back')}Back</button></div><div class="r">${P.closeBtn()}</div></div>
      <div class="wrap"><div class="pv-hd"><div><div class="pv-eyebrow">${I('lock')}Rep and owner only · not for screen sharing</div><h1 tabindex="-1">Presentation insights</h1><p>${all.length} presentation${all.length === 1 ? '' : 's'} · ${rows.length} residences viewed. Interest that hasn’t turned into a hold or reservation is your pricing signal.</p></div></div>
      ${rows.length ? `<div class="pv-co"><section class="pv-box"><h3>${I('local_fire_department')}High interest, still available</h3><p>Shown, selected or lingered on, but not yet held or reserved.</p>
        ${hot.map(r => `<div class="pv-sigrow"><b>${esc(r.id)} · ${esc(DEV(r.u.dev).name)}</b><small>Selected ${r.adds}× · opened ${r.opens}× in ${r.sessions} presentation${r.sessions === 1 ? '' : 's'} · ${fmtDur(r.ms)} viewed · ${P.fmt(r.u.price,r.u,{force:true})}</small></div>`).join('') || '<div class="pv-sel-empty">Nothing stands out yet.</div>'}</section>
        <section class="pv-box"><h3>${I('bar_chart')}Demand by residence type</h3><p>Interest compared with units already taken.</p>
        ${Object.entries(byType).sort((a,b) => b[1].interest-a[1].interest).slice(0,8).map(([k,t]) => `<div class="pv-sigrow"><b>${esc(k)}</b><small>${t.interest} interest signals · ${t.taken} taken</small><i class="pv-bar2" style="--w:${Math.min(100,t.interest*8)}%"></i></div>`).join('')}
        <div class="pv-holds-h" style="margin-top:8px">${I('slideshow')}Slides that hold attention</div>
        ${Object.entries(slides).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k,ms]) => `<div class="pv-sigrow"><b>${esc(slideName(k))}</b><small>${fmtDur(ms)} in total</small></div>`).join('')}</section></div>`
      : '<div class="pv-empty" style="position:static;padding:80px 0"><b>No presentation data yet</b>Signals appear after the first presentation.</div>'}</div></div>`;
  };

  // Buyer link engagement, recorded by the buyer's own browser and read back here.
  P.engagementHtml = out => {
    const ev = out.events || [], opens = ev.filter(e => e.t === 'open'), dwell = {};
    ev.filter(e => e.t === 'dwell').forEach(e => { dwell[e.uid] = (dwell[e.uid] || 0)+e.ms; });
    const top = Object.entries(dwell).sort((a,b) => b[1]-a[1])[0];
    return `<div class="pv-optrow"><span>${I(opens.length ? 'visibility' : 'visibility_off')} ${opens.length ? `Opened ${opens.length}× · last ${new Date(opens[opens.length-1].at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}${top ? ` · ${fmtDur(top[1])} on ${esc(top[0])}` : ''}` : 'Not opened yet'}</span></div>`;
  };
  function trackBuyer(root,s) {
    if (s.screen !== 'buyer' || s.buyerBack || root._track === s.buyer) return;
    root._track = s.buyer; const id = s.buyer;
    const push = (e,raw) => { const o = raw.outputs?.[id]; if (!o) return; (o.events ||= []).push(e); };
    const write = fn => { try { const raw = JSON.parse(localStorage.getItem(KEY) || '{}'); fn(raw); localStorage.setItem(KEY,JSON.stringify(raw)); } catch (err) { /* storage unavailable */ } };
    write(raw => push({t:'open',at:Date.now()},raw));
    const vis = new Map(), acc = {};
    const io = new IntersectionObserver(es => es.forEach(e => vis.set(e.target.dataset.track,e.isIntersecting)),{threshold:.5});
    root.querySelectorAll('[data-track]').forEach(el => io.observe(el));
    const t = setInterval(() => {
      if (!root.isConnected) return clearInterval(t);
      if (document.visibilityState === 'visible') vis.forEach((v,uid) => { if (v) acc[uid] = (acc[uid] || 0)+1000; });
    },1000);
    const flush = () => { const keys = Object.keys(acc); if (!keys.length) return; write(raw => keys.forEach(uid => push({t:'dwell',uid,ms:acc[uid],at:Date.now()},raw))); keys.forEach(k => delete acc[k]); };
    setInterval(flush,5000); addEventListener('pagehide',flush);
  }

  // Live co-viewing: family abroad follow the presenter in their own browser.
  const chan = 'BroadcastChannel' in window ? new BroadcastChannel('bricly-present-live') : null;
  const liveKey = id => 'bricly.present.live.'+id;
  P.liveURL = id => location.origin+location.pathname+'#present-live='+id;
  A.liveShare = async () => {
    const s = S(); s.live = true; s.panel = null; broadcast(true);
    try { await navigator.clipboard.writeText(P.liveURL(s.id)); P.toast('Live view link copied · viewers follow along as you present'); }
    catch (e) { P.toast('Live view: '+P.liveURL(s.id),6000); }
    R();
  };
  let bcT = 0;
  function broadcast(now) {
    const s = S(); if (!s?.live || s.viewer) return;
    clearTimeout(bcT); bcT = setTimeout(() => {
      const snap = P.snapshot(); snap.repName = UN_REP;
      try { localStorage.setItem(liveKey(s.id),JSON.stringify(snap)); } catch (e) { /* quota */ }
      chan?.postMessage({id:s.id,snap});
    },now ? 0 : 120);
  }
  const VIEWER_HIDDEN = ['checkout','insights','partner','register'];
  function applyLive(snap) {
    const s = S(); if (!s?.viewer || !snap) return;
    const keep = {viewer:true,id:s.id,t0:s.t0,toast:s.toast,liveOf:s.liveOf};
    const slideOnly = s.screen === 'present' && snap.screen === 'present' && snap.dev === s.dev && snap.sec !== s.sec && snap.focus === s.focus;
    const target = snap.sec, oldSec = s.sec;
    Object.assign(s,snap,keep,{panel:null,ov:null,lightbox:null});
    if (VIEWER_HIDDEN.includes(snap.screen)) s.screen = 'livewait';
    if (slideOnly) { s.sec = oldSec; viewerNav = true; P.goSec(target); viewerNav = false; if (s.sec !== target) { s.sec = target; R(); } }
    else R();
  }
  let viewerNav = false;
  // Slide moves happen in place (no full render), so broadcast and save after each one.
  const wrapGo = P.goSec; P.goSec = i => { if (S()?.viewer && !viewerNav) return; const r = wrapGo(i); if (S() && !S().viewer) { if (S().live) broadcast(); clearTimeout(saveT); saveT = setTimeout(() => P.persist(),400); } return r; };
  P.screens.livewait = () => `<div class="pv-orb">${P.aurora(S().dev ? P.brandPal(S().dev) : '')}<div class="pv-loadwrap"><h1 tabindex="-1" style="--d:.1s">${P.split('One moment')}</h1><p class="pv-meta">${esc(S().repName || 'Your advisor')} is preparing your selection</p></div></div>`;
  chan && chan.addEventListener('message',e => { const s = S(); if (s?.viewer && e.data?.id === s.liveOf) applyLive(e.data.snap); });
  addEventListener('storage',e => { const s = S(); if (s?.viewer && e.key === liveKey(s.liveOf) && e.newValue) applyLive(JSON.parse(e.newValue)); });

  // Partner (broker) mode: a shareable presentation without CRM access; clients register to the developer.
  A.partnerOpen = () => { const s = S(); s.g.panel = null; s.partnerForm = {name:'',devs:s.queue.length ? [...s.queue] : []}; P.go('partner'); };
  A['in:pname'] = v => { S().partnerForm.name = v; const b = P.root.querySelector('[data-a="partnerCreate"]'); if (b) b.disabled = !v.trim() || !S().partnerForm.devs.length; };
  A.partnerDev = v => { const f = S().partnerForm; f.devs = f.devs.includes(v) ? f.devs.filter(x => x !== v) : [...f.devs,v]; R(); };
  A.partnerCreate = async () => {
    const f = S().partnerForm; if (!f.name.trim() || !f.devs.length) return;
    const id = P.uuid('pt').replace('pt-',''); (store().partners ||= {})[id] = {id,name:f.name.trim(),devs:f.devs,created:P.now(),rep:UN_REP}; P.save();
    f.link = location.origin+location.pathname+'#present-partner='+id;
    try { await navigator.clipboard.writeText(f.link); P.toast('Partner link copied'); } catch (e) { /* shown on screen */ }
    R();
  };
  P.screens.partner = () => {
    const f = S().partnerForm, list = (store().partners ? Object.values(store().partners) : []).slice(-5).reverse();
    return `<div class="pv-dark"><div class="pv-top"><div class="r"><button class="pv-chip" data-a="insightsBack">${I('arrow_back')}Back</button></div><div class="r">${P.closeBtn()}</div></div>
      <div class="wrap"><div class="pv-hd"><div><div class="pv-eyebrow">${I('handshake')}Partner presentation</div><h1 tabindex="-1">Give a broker the presentation, not the CRM.</h1><p>Partners present with the same experience. Their clients register to you, and the lead is protected for 90 days.</p></div></div>
      <div class="pv-co"><section class="pv-box"><h3><span class="n">1</span>Partner</h3><label class="pv-field">Agency or broker name<input data-f="pname" value="${esc(f.name)}" placeholder="e.g. Harbour Realty"></label>
        <h3><span class="n">2</span>Developments they can present</h3><div class="pv-list2">${DEVS.map(d => `<button class="pv-row ${f.devs.includes(d.id) ? 'on' : ''}" data-a="partnerDev" data-v="${d.id}" aria-pressed="${f.devs.includes(d.id)}"><img src="${esc(P.devPhoto(d))}" alt=""><div class="t"><b>${esc(d.name)}</b><small>${esc(d.loc)}</small></div><span class="pv-check ${f.devs.includes(d.id) ? 'on' : ''}">${f.devs.includes(d.id) ? I('check') : ''}</span></button>`).join('')}</div>
        <div style="padding:8px 6px"><button class="pv-cta sm" data-a="partnerCreate" ${f.name.trim() && f.devs.length ? '' : 'disabled'}>${I('link')}Create partner link</button></div>
        ${f.link ? `<div class="pv-link">${I('link')}<code>${esc(f.link)}</code></div><p>Prices and availability stay live. Partners never see your opportunities, contacts or notes.</p>` : ''}</section>
      <aside class="pv-box"><h3>Recent partner links</h3>${list.map(p => `<div class="pv-sigrow"><b>${esc(p.name)}</b><small>${p.devs.map(id => esc(DEV(id)?.name || id)).join(', ')} · ${new Date(p.created).toLocaleDateString('en-GB')}</small></div>`).join('') || '<div class="pv-sel-empty">No partner links yet.</div>'}</aside></div></div></div>`;
  };
  // Partners finish with a client registration instead of the CRM checkout.
  const wrapToCheckout = A.toCheckout; A.toCheckout = () => S().partner ? P.go('register') : wrapToCheckout();
  P.screens.register = () => {
    const s = S(), L = s.link, done = s.registered;
    return `<div class="pv-dark"><div class="pv-top"><div class="r"><button class="pv-chip" data-a="cmpBack">${I('arrow_back')}Back to presentation</button></div><div class="r">${P.closeBtn()}</div></div>
      <div class="wrap" style="max-width:640px"><div class="pv-hd"><div><div class="pv-eyebrow">${I('handshake')}${esc(s.partner.name)} · presenting ${esc(D.COMPANY.name)}</div><h1 tabindex="-1">${done ? 'Client registered.' : 'Register your client.'}</h1><p>${done ? `${esc(done)} is registered to ${esc(s.partner.name)} for 90 days. ${esc(D.COMPANY.name)}’s sales team will be in touch about ${s.sel.length} residence${s.sel.length === 1 ? '' : 's'}.` : 'The selection goes to the developer’s sales team, with your agency recorded as the introducer.'}</p></div></div>
      ${done ? '' : `<section class="pv-box"><label class="pv-field">Client name<input data-f="lname" value="${esc(L.name)}"></label><label class="pv-field">Email<input type="email" data-f="lemail" value="${esc(L.email)}"></label><label class="pv-field">Phone<input type="tel" data-f="lphone" value="${esc(L.phone)}"></label>
        <div class="pv-consent"><span>Consent</span><button class="pv-optrow" data-a="lconsent" data-v="cwa" aria-pressed="${!!L.cwa}">Agrees to WhatsApp messages<span class="pv-toggle ${L.cwa ? 'on' : ''}"></span></button><button class="pv-optrow" data-a="lconsent" data-v="cem" aria-pressed="${!!L.cem}">Agrees to email<span class="pv-toggle ${L.cem ? 'on' : ''}"></span></button></div>
        <div style="padding:8px 6px"><button class="pv-cta sm" data-a="registerClient">${I('how_to_reg')}Register client</button></div></section>`}</div></div>`;
  };
  A.registerClient = () => {
    const s = S(), L = s.link; if (!L.name.trim()) { P.toast('Add your client’s name'); return; }
    const c = {id:P.uuid('contact'),name:L.name.trim(),email:L.email.trim(),phone:L.phone.trim(),type:'lead',status:'active',btype:'',company:'',nat:'',lang:D.LANGS[P.prefs.lang] || 'English',source:'Partner: '+s.partner.name,rep:UN_REP,tags:['Partner registration'],oppIds:[],consent:{wa:!!L.cwa,em:!!L.cem,sms:false,at:P.now(),how:'Recorded by partner'},notesList:[`Introduced by ${s.partner.name} · protected until ${new Date(Date.now()+90*864e5).toLocaleDateString('en-GB')}`],created:P.now(),last:'Today',lastD:P.now(),bmin:0,bmax:0};
    const o = {id:P.uuid('OPP'),lead:c.name,devs:[...new Set(s.sel.map(i => DEV(i.dev).name))],units:s.sel.map(i => i.uid),stage:'New Lead',source:'Partner: '+s.partner.name,budget:0,value:Math.round(Math.max(0,...s.sel.map(i => P.unitPrice(i.uid,i.finish)))/1000),tags:['Partner registration'],rep:UN_REP,next:{d:'Today',t:'Call partner client'},ago:'Today'};
    CONTACTS.push(c); OPPS.push(o); c.oppIds.push(o.id);
    store().contacts[c.id] = P.clone(c); store().records[o.id] = {opportunity:P.clone(o),extension:{comms:[{ch:'sys',t:'Just now',text:`Registered by ${s.partner.name} via a partner presentation · ${s.sel.map(i => i.uid).join(', ')}`}]}};
    s.registered = c.name; P.persist(); R();
  };

  // Every render: broadcast to live viewers, track buyer engagement, persist for resume.
  let saveT = 0;
  P.after.push((root,s) => {
    if (!s) return;
    root.toggleAttribute('data-viewer',!!s.viewer);
    if (s.live) broadcast();
    trackBuyer(root,s);
    if (s.viewer && !root.querySelector('.pv-livepill')) { const el = document.createElement('div'); el.className = 'pv-fx pv-livepill'; el.innerHTML = `<i></i>Live · following ${esc(s.repName || 'your advisor')}`; root.append(el); }
    if (!s.viewer && s.screen !== 'buyer') { clearTimeout(saveT); saveT = setTimeout(() => P.persist(),400); }
  });

  // Boot: live viewer and partner links; otherwise resume a presentation interrupted in the last 30 minutes.
  const live = (location.hash.match(/^#present-live=([\w-]+)/) || [])[1];
  const partner = (location.hash.match(/^#present-partner=([\w-]+)/) || [])[1];
  if (S()?.screen === 'buyer') R();
  if (live) {
    const snap = JSON.parse(localStorage.getItem(liveKey(live)) || 'null');
    P.setS({...P.newSession({mode:'gallery'}),viewer:true,liveOf:live,screen:'livewait',repName:snap?.repName});
    P.mount();
    if (snap) applyLive(snap); else R();
  } else if (partner) {
    const pt = store().partners?.[partner];
    if (pt) P.open({mode:'gallery',partner:pt});
  } else if (!location.hash.startsWith('#present=') && store().active && Date.now()-store().active.at < 30*60e3) {
    const snap = store().active.snap;
    if (snap?.id) {
      P.setS({...P.newSession({}),...snap,toast:'',t0:Date.now()});
      if (['welcome','loading','livewait'].includes(snap.screen)) S().screen = snap.dev ? 'present' : 'gallery';
      P.mount(); R(); P.toast('Presentation restored where you left off',3600);
    }
  }
})();
