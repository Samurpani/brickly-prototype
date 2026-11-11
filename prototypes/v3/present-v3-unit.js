/* Present Mode v3 · Unit page (Unit Page v2 design): full-bleed Plan / Renders /
 * Views / Finishes, glass detail card, and Add to selection carrying the chosen
 * finish and render style.
 */
(() => {
  'use strict';
  const P = window.PV3, D = P.D, {esc, I, eur} = P;
  const S = () => P.S;
  const R = () => P.render();
  const A = P.actions;

  P.openUnit = uid => {
    const s = S(), u = D.register(uid); if (!u) return;
    const d = DEV(u.dev);
    if (!s.queue.includes(d.id)) s.queue.push(d.id);
    if (s.screen !== 'unit') s.unitFrom = s.screen === 'compare' ? 'compare' : 'present';
    s.dev = d.id; s.av[d.id] ||= P.blankAvail(); s.unit = uid; s.ut = 'plan'; s.zoom = {s:1,x:0,y:0,r:0}; s.room = 0; s.rimg = 0; s.view = 0; s.panel = null;
    s.fin[uid] ||= P.unitFinish(uid);
    P.go('unit');
  };
  A.unitBack = () => { const s = S(); if (s.unitFrom === 'compare') { P.go('compare'); return; } s.sec = P.SECS.indexOf('availability'); P.go('present'); };

  const TABS = [['plan','Plan'],['renders','Renders'],['views','Views'],['finishes','Finishes']];
  const curFinish = () => P.finish(S().unit,P.unitFinish(S().unit));
  // Tabs only appear when the unit has content for them in the published development data.
  const tabsFor = u => TABS.filter(([k]) => k === 'renders' ? D.renderRooms(u,P.combo(u.id)).length : k === 'views' ? D.viewsFor(u).length : true);
  const capOf = (cap,room) => cap.toLowerCase().startsWith(room.toLowerCase()) ? cap.slice(room.length).replace(/^\s*[—–-]\s*/,'') : cap;

  function card(u) {
    const s = S(), a = s.acc, f = curFinish(), price = P.unitPrice(u.id), c = D.commerce(DEV(u.dev).id);
    const sz = c.charges.per === 'sqft' ? D.area(u)*10.7639 : D.area(u), charge = sz*c.charges.rate;
    const rent = c.rent.rate*(c.rent.per === 'sqft' ? u.sqm*10.7639 : u.sqm), gross = rent*12/price*100;
    const acc = (k,label,val,body) => `<div class="pv-acc"><button data-a="acc" data-v="${k}" aria-expanded="${!!a[k]}">${label}<span>${val}${I(a[k] ? 'expand_less' : 'expand_more')}</span></button>${a[k] ? `<div class="body">${body}</div>` : ''}</div>`;
    const sched = D.roomSchedule(u), floors = D.floorsOf(DEV(u.dev).id), top = Math.max(...floors);
    const pos = 1-(u.floor-Math.min(...floors))/Math.max(1,top-Math.min(...floors));
    const where = `<div class="pv-where"><svg viewBox="0 0 60 120" aria-hidden="true"><rect x="14" y="4" width="32" height="112" rx="2" fill="none" stroke="rgba(255,255,255,.4)"/>${Array.from({length:14},(_, i) => `<line x1="16" x2="44" y1="${10+i*7.6}" y2="${10+i*7.6}" stroke="rgba(255,255,255,.12)"/>`).join('')}<rect x="12" y="${4+pos*104}" width="36" height="6" fill="#FAF9F5"/></svg>
      <div style="font-size:12px;line-height:18px"><b style="font-weight:500">${u.floor === 0 ? 'Ground floor' : 'Floor '+u.floor} of ${top}</b><br><span style="color:#C6C9C2">${esc(D.viewOf(u))}${D.position(u) ? ' · position '+esc(D.position(u).label) : ''}<br>${esc(D.plateSides(DEV(u.dev).id).filter(Boolean).slice(0,2).join(' · '))}</span></div></div>`;
    return `<aside class="pv-ucard" aria-label="Unit details"><div class="hd"><div class="a"><h2 tabindex="-1">${esc(u.id)}</h2><small>${P.statusText(u)}</small></div>
      <small>Floor ${u.floor} · ${u.beds ? u.beds+' '+P.t(u.beds > 1 ? 'bedrooms' : 'bedroom') : 'Studio'} · ${u.baths} bathroom${u.baths > 1 ? 's' : ''} · ${P.ar(D.area(u),u)}</small>
      <div class="p"><b>${P.fmt(price,u)}</b><small>${P.ppa(price,D.area(u),u)}</small></div>${f?.delta && !s.hidePrices ? `<small>Includes ${esc(f.name)} upgrade +${P.fmt(f.delta,u)}</small>` : ''}${P.holdChip ? P.holdChip(u) : ''}</div>
      ${acc('details',P.t('Details'),'',`<div class="pv-facts2">${D.details(u,f?.name,m => P.ar(m,u)).map(([k,v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>`)}
      ${acc('sched',P.t('Room schedule'),P.ar(D.area(u),u),`<div class="pv-sched">${sched.map(([n,m]) => `<div><span>${esc(n)}</span><span>${P.ar(+m.toFixed(1),u)}</span></div>`).join('')}</div>`)}
      ${acc('where',P.t('Where it sits'),`Floor ${u.floor} / ${top}`,where)}
      ${acc('pay',P.t('Payment plan'),c.plan.length+' stages',`<div class="pv-sched pv-paysched">${c.plan.map(([t,when,pct]) => `<div><span>${pct}% · ${esc(t)}<small>${esc(when)}</small></span><span>${s.hidePrices ? '' : P.fmt(price*pct/100,u)}</span></div>`).join('')}</div><p class="pv-fine">${esc(c.protection)}</p>`)}
      ${acc('own',P.t('Ownership costs'),'',`<div class="pv-facts2"><div><small>${esc(c.charges.label)}</small><b>${P.fmt(charge,u,{force:true})} / ${c.charges.period === 'month' ? 'mo' : 'yr'}</b></div><div><small>Est. gross yield</small><b>${gross.toFixed(1)}%</b></div><div><small>Est. rent</small><b>${P.fmt(rent,u,{force:true})} / mo</b></div><div><small>Completion</small><b>${esc(c.completion)}</b></div></div><p class="pv-fine">Estimates from comparable rents and current charges. Not a forecast or guarantee.</p>`)}</aside>`;
  }

  function plan(u) {
    const z = S().zoom;
    return `<div class="pv-plan" data-plan><div class="inner" style="padding-left:${S().card ? 320 : 0}px;transform:translate(${z.x}px,${z.y}px) scale(${z.s}) rotate(${z.r}deg)">${P.planHtml(u,420).replace('<img ','<img draggable="false" ')}</div>
      <div class="pv-compass" style="transform:rotate(${z.r}deg)" aria-hidden="true">N</div><span class="pv-ailabel pv-ailabel-plan">${P.t('Indicative plan')}</span></div>
      <div class="pv-zoom pv-group" style="height:40px;padding:3px;border-radius:9px;font-family:Inter,sans-serif;color:#FAF9F5;--hover:rgba(255,255,255,.12)">
        <button class="pv-ib" style="width:34px;height:34px" data-a="zoom" data-v="-1" aria-label="Zoom out">${I('remove')}</button><span style="font-size:12px;min-width:44px;text-align:center">${Math.round(z.s*100)}%</span>
        <button class="pv-ib" style="width:34px;height:34px" data-a="zoom" data-v="1" aria-label="Zoom in">${I('add')}</button><button class="pv-ib" style="width:34px;height:34px" data-a="rotate" aria-label="Rotate plan">${I('rotate_right')}</button>
        <button class="pv-ib wide" style="height:34px;font-size:12px" data-a="zoomReset">Reset</button></div>`;
  }
  function renders(u) {
    const s = S(), combo = P.combo(u.id), rooms = D.renderRooms(u,combo), room = rooms[s.room % rooms.length], n = room.imgs.length, shot = room.imgs[s.rimg % n];
    const ax = D.renderAxes(u,combo.pack), shown = [['layout',ax.layout],['pack',ax.pack],['style',ax.style]].filter(([,l]) => l.length > 1)
      .map(([k,l]) => l.find(x => x.id === room.eff[k])?.name || l.find(x => x.id === ax.def[k])?.name).filter(Boolean);
    const cap = [capOf(shot.cap,room.name),n > 1 ? `${s.rimg % n+1} of ${n}` : '',shot.tags].filter(Boolean).join(' · ');
    return `<div class="pv-render" style="background-image:url('${esc(shot.img)}')" role="img" aria-label="${esc(shot.cap)}"></div><div class="pv-shade"></div>${P.aiLabel()}
      <div class="pv-roomname">${esc(room.name)}</div><div class="pv-roomcap">${esc(cap)}</div>
      ${shown.length ? `<div class="pv-uleft"><button class="pv-selbar" style="padding:0 12px" data-a="finpop" aria-expanded="${s.finpop}" aria-label="Layout, finish and style">${I('tune')}${esc(shown.join(' · '))}</button></div>${s.finpop ? finPop(u,ax,combo) : ''}` : ''}
      <div class="pv-uright pv-utabs" style="font-family:Inter,sans-serif"><button class="ic" data-a="room" data-v="-1" aria-label="Previous room">${I('keyboard_arrow_up')}</button><button aria-selected="true" data-a="rimg" data-v="1" aria-label="Next ${esc(room.name)} render">${esc(room.name)}</button><button class="ic" data-a="room" data-v="1" aria-label="Next room">${I('keyboard_arrow_down')}</button></div>`;
  }
  // Only options that have renders of their own get a button here; every finish stays selectable on the Finishes tab.
  function finPop(u,ax,combo) {
    const sec = (title,act,list,cur) => list.length > 1 ? `<div class="pv-panel-h">${title}</div><div class="pv-opts" style="padding:0 6px 6px">${list.map(x => `<button class="pv-opt" data-a="${act}" data-v="${x.id}" aria-pressed="${x.id === cur}">${esc(x.name)}</button>`).join('')}</div>` : '';
    return `<div class="pv-panel pv-finpop" data-pk="finpop" role="dialog" aria-label="Layout, finish and style" style="position:absolute">${sec('Layout','layout',ax.layout,combo.layout)}${sec('Finish','finish',ax.pack,combo.pack)}${sec('Style','style',ax.style,combo.style)}</div>`;
  }
  function views(u) {
    const s = S(), vs = D.viewsFor(u), v = vs[s.view % vs.length];
    return `<div class="pv-render" style="background-image:url('${esc(v.img)}')" role="img" aria-label="${esc(v.name)}"></div><div class="pv-shade"></div>${P.aiLabel('Indicative view')}
      <div class="pv-roomname">${esc(v.name)}</div><div class="pv-roomcap">Seen from ${esc(v.rooms.toLowerCase())} · floor ${u.floor}</div>
      <div class="pv-viewchips pv-chips" style="height:36px;font-family:Inter,sans-serif">${vs.map((x,i) => `<button data-a="view" data-v="${i}" aria-pressed="${i === s.view % vs.length}">${esc(x.name)}<small>${x.dir}</small></button>`).join('')}</div>`;
  }
  // A render for each finish pack: its own render if one is tagged for the pack (kitchen first), otherwise the
  // closest render, gently graded towards the pack's main material so the three still read apart.
  function finishRender(u,f) {
    const rooms = D.renderRooms(u,{...P.combo(u.id),pack:f.id}), by = rooms.find(r => r.id === 'kitchen') || rooms.find(r => r.id === 'living') || rooms[0];
    const own = rooms.find(r => r.eff?.pack === f.id && r.imgs.length) || null, pick = own || by;
    return pick?.imgs[0] ? {img:pick.imgs[0].img,room:pick.name,own:!!own} : {img:P.unitImg(u.id),room:'Interior',own:false};
  }
  function finishes(u) {
    const fins = D.finishesFor(DEV(u.dev).id), cur = P.unitFinish(u.id);
    return `<div class="pv-finishes" style="padding-left:${S().card ? 336 : 24}px"><div class="intro"><span>${fins.length} finishing packages. ${esc(P.finish(u.id,cur)?.name || '')} selected${P.finish(u.id,cur)?.delta ? ', +'+P.fmt(P.finish(u.id,cur).delta,u) : ', no upgrade cost'}.</span><span>Kitchen and wardrobes included in all packages</span></div>
      <div class="pv-fincards">${fins.map(f => { const on = f.id === cur, r = finishRender(u,f); return `<div class="pv-fin ${on ? 'on' : ''}"><figure class="pv-finimg ${r.own ? '' : 'tint'}" style="--tint:${f.sw[0]?.[2] || 'transparent'}"><img src="${esc(r.img)}" alt="${esc(f.name)} finish" loading="lazy" draggable="false"><figcaption>${esc(r.room)}</figcaption>${P.aiLabel ? P.aiLabel() : ''}</figure><div class="h"><h3>${esc(f.name)}</h3><span>${f.delta ? '+ '+P.fmt(f.delta,u) : 'Included'}</span></div><div class="mood">${esc(f.mood)}</div>
        <div class="pv-swatch">${f.sw.map(([n,m,c]) => `<div><i style="background:${c}"></i><small>${esc(n)}</small><small>${esc(m)}</small></div>`).join('')}</div>
        <div class="pv-spec">${f.spec.map(([k,v]) => `<div><span>${esc(k)}</span>${esc(v)}</div>`).join('')}</div>
        <button class="pick" data-a="finish" data-v="${f.id}" aria-pressed="${on}">${on ? 'Selected for '+esc(u.id) : 'Select '+esc(f.name)}</button></div>`; }).join('')}</div></div>`;
  }

  P.screens.unit = () => {
    const s = S(), u = D.unit(s.unit); if (!u) return '';
    const d = DEV(u.dev), inSel = P.isSel(u.id), n = s.sel.length;
    const avail = tabsFor(u); if (!avail.some(([k]) => k === s.ut)) s.ut = 'plan';
    const stage = {plan,renders,views,finishes}[s.ut](u);
    const tabs = `<div class="pv-utabs" role="tablist" aria-label="Unit views"><button class="ic" data-a="cardToggle" aria-pressed="${s.card}" aria-label="${s.card ? 'Hide' : 'Show'} unit details" ${s.card ? 'aria-selected="true"' : ''}>${I('notes')}</button>${avail.map(([k,l]) => `<button role="tab" data-a="ut" data-v="${k}" aria-selected="${s.ut === k}">${P.t(l)}</button>`).join('')}</div>`;
    return `<div class="pv-unit" style="${P.brandVars(d.id)}"><div class="pv-ustage">${stage}</div>
      ${P.navBar(`<button class="pv-chip sq" data-a="unitBack" aria-label="Back to availability">${I('arrow_back')}</button>`,tabs)}
      ${s.card ? card(u) : ''}
      <div class="pv-uctl"><div class="pv-selbar"><button style="background:none;padding:0 8px 0 0" data-a="panel" data-v="sel">${n} ${P.t('Selected')}</button><button class="${inSel ? 'on' : ''}" data-a="heart" data-v="${esc(u.id)}" aria-pressed="${inSel}" ${!P.canTake(u) && !inSel ? 'disabled title="Only available residences can be added"' : ''}>${I(inSel ? 'check' : 'add')}${P.t(inSel ? 'In selection' : 'Add to selection')}</button></div>${P.holdButton ? P.holdButton(u) : ''}</div></div>`;
  };

  A.ut = v => { S().ut = v; S().finpop = false; R(); };
  A.cardToggle = () => { S().card = !S().card; R(); };
  A.acc = v => { S().acc[v] = !S().acc[v]; R(); };
  A.zoom = v => { const z = S().zoom; z.s = Math.max(.5,Math.min(3,+(z.s+ +v*.25).toFixed(2))); R(); };
  A.rotate = () => { S().zoom.r = (S().zoom.r+90) % 360; R(); };
  A.zoomReset = () => { S().zoom = {s:1,x:0,y:0,r:0}; R(); };
  const roomsNow = () => D.renderRooms(D.unit(S().unit),P.combo(S().unit));
  A.room = v => { const s = S(), n = roomsNow().length; if (!n) return; s.room = (s.room+ +v+n) % n; s.rimg = 0; R(); };
  A.rimg = v => {
    const s = S(), rooms = roomsNow(); if (!rooms.length) return; s.room %= rooms.length; const room = rooms[s.room], next = s.rimg+ +v;
    if (next >= room.imgs.length) { s.room = (s.room+1) % rooms.length; s.rimg = 0; }
    else if (next < 0) { s.room = (s.room-1+rooms.length) % rooms.length; s.rimg = rooms[s.room].imgs.length-1; }
    else s.rimg = next;
    R();
  };
  A.view = v => { S().view = +v; R(); };
  A.finpop = () => { S().finpop = !S().finpop; R(); };
  A.style = v => { const s = S(); s.style = v; s.rimg = 0; const i = s.sel.find(x => x.uid === s.unit); if (i) { i.style = v; s.output = null; } R(); };
  A.layout = v => { const s = S(); s.lay[s.unit] = v; s.rimg = 0; const i = s.sel.find(x => x.uid === s.unit); if (i) { i.layout = v; s.output = null; P.persist(); } R(); };
  A.finish = v => { const s = S(); s.fin[s.unit] = v; s.rimg = 0; const i = s.sel.find(x => x.uid === s.unit); if (i) { i.finish = v; s.output = null; P.persist(); } R(); };

  P.keys.push(e => {
    const s = S(); if (s.screen !== 'unit' || s.panel || s.finpop) return;
    const order = tabsFor(D.unit(s.unit)).map(t => t[0]);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const d = e.key === 'ArrowRight' ? 1 : -1;
      if (s.ut === 'renders') { A.rimg(d); return true; }
      if (s.ut === 'views') { const n = D.viewsFor(D.unit(s.unit)).length; if (n) { s.view = (s.view+d+n) % n; R(); } return true; }
    }
    if (/^[1-4]$/.test(e.key) && order[+e.key-1]) { A.ut(order[+e.key-1]); return true; }
    if (s.ut === 'plan' && (e.key === '+' || e.key === '=')) { A.zoom(1); return true; }
    if (s.ut === 'plan' && e.key === '-') { A.zoom(-1); return true; }
  });

  // Plan: drag to move, wheel/pinch to zoom.
  P.after.push(root => {
    const el = root.querySelector('[data-plan]'); if (!el) return;
    const inner = el.querySelector('.inner');
    const apply = z => { inner.style.transform = `translate(${z.x}px,${z.y}px) scale(${z.s}) rotate(${z.r}deg)`; };
    let start = null;
    el.addEventListener('pointerdown',e => { start = {x:e.clientX,y:e.clientY,z:{...S().zoom}}; el.setPointerCapture(e.pointerId); el.classList.add('drag'); inner.classList.add('live'); });
    el.addEventListener('pointermove',e => { if (!start) return; const z = S().zoom; z.x = start.z.x+e.clientX-start.x; z.y = start.z.y+e.clientY-start.y; apply(z); });
    const end = () => { if (!start) return; start = null; el.classList.remove('drag'); inner.classList.remove('live'); };
    el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
    el.addEventListener('wheel',e => {
      e.preventDefault(); const z = S().zoom; z.s = Math.max(.5,Math.min(3,z.s*(e.deltaY < 0 ? 1.08 : 1/1.08))); inner.classList.add('live'); apply(z);
      const lbl = root.querySelector('.pv-zoom span'); if (lbl) lbl.textContent = Math.round(z.s*100)+'%';
      clearTimeout(el._t); el._t = setTimeout(() => inner.classList.remove('live'),120);
    },{passive:false});
  });
})();
