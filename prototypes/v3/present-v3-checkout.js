/* Present Mode v3 · Checkout: compare selected units, buyer-safe thank-you
 * gate, link to an opportunity (existing, via contact, or new buyer), the
 * automatically created share link, and the buyer's view of that link.
 */
(() => {
  'use strict';
  const P = window.PV3, D = P.D, {esc, I, eur} = P;
  const S = () => P.S;
  const R = () => P.render();
  const A = P.actions;
  const store = () => P.store;

  // Comparison table, shared by the live compare screen and the buyer link.
  P.cmpTable = (items,{print = false,diffOnly = false,prices = true,kind = 'res',chosen = null} = {}) => {
    const cols = items.map(i => ({...i,u:D.unit(i.uid)})).filter(c => c.u);
    if (!cols.length) return '';
    const fin = c => P.finish(c.uid,c.finish), price = c => c.price ?? c.u.price+(fin(c)?.delta || 0);
    // Values are compared in one currency; each cell still reads in its own market's terms.
    const ccys = new Set(cols.map(c => P.ccyOf(c.u))), CC = P.prefs.ccy !== 'local' ? P.prefs.ccy : ccys.size === 1 ? [...ccys][0] : 'EUR';
    const cv = c => P.toCcy(price(c),c.u,CC), show = (v,c) => P.fmtIn(v,CC,P.ccyOf(c.u) !== CC);
    // Payments & value: the money side by side, in one currency, stage by stage.
    const com = c => D.commerce(DEV(c.u.dev).id), money = (v,c) => prices ? show(v,c) : P.t('Price on request');
    const stage = (c,from,to) => com(c).plan.slice(from,to).reduce((a,p) => a+p[2],0)/100*cv(c);
    const sz = c => com(c).charges.per === 'sqft' ? D.area(c.u)*10.7639 : D.area(c.u);
    const chargeYr = c => P.toCcy(sz(c)*com(c).charges.rate*(com(c).charges.period === 'month' ? 12 : 1),c.u,CC);
    const rentMo = c => P.toCcy(com(c).rent.rate*(com(c).rent.per === 'sqft' ? c.u.sqm*10.7639 : c.u.sqm),c.u,CC);
    const valRows = [
      ['Price incl. finish',cv,{best:'min',fmt:money}],
      ['Price per area',c => cv(c)/D.area(c.u),{best:'min',fmt:(v,c) => prices ? show(P.areaOf(c.u) === 'sqft' ? v/10.7639 : v,c)+' / '+P.areaUnit(c.u) : '—'}],
      ['Hold deposit',c => com(c).hold.deposit],
      ['Due on signing',c => stage(c,0,1),{fmt:(v,c) => money(v,c)+' · '+com(c).plan[0][2]+'%'}],
      ['During construction',c => stage(c,1,-1),{fmt:(v,c) => com(c).plan.length > 2 ? money(v,c)+' · '+com(c).plan.slice(1,-1).reduce((a,p) => a+p[2],0)+'%' : '—'}],
      ['On completion',c => stage(c,-1),{fmt:(v,c) => money(v,c)+' · '+com(c).plan.at(-1)[2]+'%'}],
      ['Completion',c => com(c).completion],
      ['Ownership costs / yr',chargeYr,{best:'min',fmt:(v,c) => show(v,c)+' · '+com(c).charges.label}],
      ['Est. rent / month',rentMo,{best:'max',fmt:show}],
      ['Est. gross yield',c => rentMo(c)*12/cv(c)*100,{best:'max',fmt:v => v.toFixed(1)+'%'}],
      ['Deposit protection',c => com(c).currency === 'USD' ? 'Escrow agent' : 'Notary + bank guarantee'],
    ];
    const rows = kind === 'val' ? valRows : [
      ['Development',c => DEV(c.u.dev).name+' · '+DEV(c.u.dev).loc],
      ['Price',cv,{best:'min',fmt:show}],
      ['Price per area',c => cv(c)/D.area(c.u),{best:'min',fmt:(v,c) => show(P.areaOf(c.u) === 'sqft' ? v/10.7639 : v,c)+' / '+P.areaUnit(c.u)}],
      ['Bedrooms · baths',c => (c.u.beds ? c.u.beds+' bed' : 'Studio')+' · '+c.u.baths+' bath'],
      ['Total area',c => D.area(c.u),{best:'max',fmt:(v,c) => P.ar(v,c.u)}],
      ['Internal · external',c => P.ar(c.u.sqm,c.u)+' · '+P.ar(c.u.ext,c.u)],
      ['Floor',c => c.u.floor === 0 ? 'Ground' : String(c.u.floor)],
      ['View',c => D.viewOf(c.u)],
      ['Features',c => D.featuresOf(c.u).map(k => D.FEATURES[k].label).join(' · ') || '—'],
      ['Finish',c => (fin(c)?.name || '—')+(fin(c)?.delta && prices ? ' (+'+P.fmtIn(fin(c).delta,P.ccyOf(c.u))+')' : '')],
      ['Payment plan',c => D.commerce(DEV(c.u.dev).id).plan.map(p => p[2]+'%').join(' · ')],
      ['Render style',c => D.styleName(DEV(c.u.dev)?.id,c.style) || '—'],
      ['Completion',c => c.u.ready || DEV(c.u.dev).completion],
      ['Status',c => P.statusText(c.u)],
    ];
    const out = rows.filter(([k]) => kind === 'val' || prices || !/^Price/.test(k)).map(([k,fn,o = {}]) => {
      const vals = cols.map(fn), diff = new Set(vals.map(String)).size > 1;
      let best = -1; if (o.best && diff && cols.length > 1) { const t = o.best === 'min' ? Math.min(...vals) : Math.max(...vals); if (vals.filter(v => v === t).length === 1) best = vals.indexOf(t); }
      if (diffOnly && !diff) return '';
      return `<div class="k ${diff ? 'diff' : ''}">${k}</div>`+vals.map((v,i) => `<div class="${diff ? 'diff' : ''} ${cols[i].uid === chosen ? 'chosen' : ''}">${esc(o.fmt ? o.fmt(v,cols[i]) : v)}${i === best ? `<span class="best">${I('star','fill')}Best</span>` : ''}</div>`).join('');
    }).join('');
    const head = `<div class="head k">${print ? '' : `${cols.length} residence${cols.length === 1 ? '' : 's'}`}</div>`+cols.map(c => {
      const b = D.brand(DEV(c.u.dev).id);
      const ch = c.uid === chosen, ok = !P.canTake || P.canTake(c.u);
      return `<div class="head ${ch ? 'chosen' : ''}"><div class="media" style="background:${b.bg}"><div class="plan">${P.planHtml(c.u,130)}</div>${print ? '' : `<button class="rm" data-a="cmpToggle" data-v="${esc(c.uid)}" aria-label="Remove ${esc(c.uid)} from comparison">${I('close')}</button>`}</div>
        <div><small style="color:var(--secondary)">${esc(DEV(c.u.dev).name)}</small><div class="uid" style="font-family:${b.display}">${esc(c.uid)}</div></div>${print ? '' : `<div class="pv-cmpacts"><button class="pv-ghost" data-a="openUnit" data-v="${esc(c.uid)}" aria-label="Open ${esc(c.uid)}">${I('arrow_outward')}Open</button>${ok ? `<button class="pv-choose ${ch ? 'on' : ''}" data-a="choose" data-v="${esc(c.uid)}" aria-pressed="${ch}">${I(ch ? 'check_circle' : 'radio_button_unchecked')}${ch ? 'Chosen' : 'Choose this one'}</button>` : `<span class="pv-muted" style="font-size:12px">${esc(P.statusText(c.u))}</span>`}</div>`}</div>`;
    }).join('');
    return `<div class="pv-cmp" style="--n:${cols.length}" role="table" aria-label="Unit comparison">${head}${out}</div>`;
  };

  P.screens.compare = () => {
    const s = S(), items = s.sel.filter(i => i.cmp), devs = new Set(items.map(i => i.dev)), tab = s.cmpTab || 'res';
    if (s.chosen && !items.some(i => i.uid === s.chosen)) s.chosen = null;
    return `<div class="pv-dark" data-keep="cmp"><div class="pv-top"><div class="r"><button class="pv-chip" data-a="cmpBack">${I('arrow_back')}Back to presentation</button></div>
      <div class="r"><button class="pv-chip" data-a="cmpDiff" aria-pressed="${s.cmpDiff}">${I(s.cmpDiff ? 'check_box' : 'check_box_outline_blank')}Differences only</button>${P.closeBtn()}</div></div>
      <div class="wrap"><div class="pv-hd"><div><div class="pv-eyebrow">${I('compare_arrows')}Side by side</div><h1 tabindex="-1">Compare ${items.length} residence${items.length === 1 ? '' : 's'}</h1>
      <p>${devs.size > 1 ? 'Across '+devs.size+' developments. ' : ''}Prices include each residence’s chosen finish package.</p>
      <div class="pv-seg pv-cmptabs" role="tablist" aria-label="Compare">${[['res','Residences'],['val','Payments & value']].map(([k,l]) => `<button role="tab" data-a="cmpTab" data-v="${k}" aria-selected="${tab === k}" aria-pressed="${tab === k}">${l}</button>`).join('')}</div></div></div>
      ${items.length ? `<div class="pv-cmpwrap" data-tab="${tab}">${P.cmpTable(items,{diffOnly:s.cmpDiff,prices:!s.hidePrices,kind:tab,chosen:s.chosen})}</div>` : '<div class="pv-empty" style="position:static;padding:80px 0"><b>Nothing to compare</b>Tick residences in the Selected panel to compare them.</div>'}
      ${s.chosen ? secure(s.chosen) : items.length > 1 ? `<p class="pv-choosehint">${I('touch_app')}Choose the residence that feels right to secure it: hold, reserve and book the signing.</p>` : ''}
      ${s.sel.length > items.length ? `<p class="pv-muted" style="margin-top:16px">${s.sel.length-items.length} more in your selection: ${s.sel.filter(i => !i.cmp).map(i => `<button class="pv-ghost" style="display:inline-flex;margin:4px" data-a="cmpToggle" data-v="${esc(i.uid)}" ${items.length >= 4 ? 'disabled' : ''}>${I('add')}${esc(i.uid)}</button>`).join('')}</p>` : ''}</div>
      <div class="pv-dock-bar"><button class="pv-chip" data-a="cmpBack">Keep exploring</button><button class="pv-cta" data-a="finishPresentation" ${s.sel.length ? '' : 'disabled'}>${s.chosen ? 'Send the proposal' : 'Finish presentation'} ${I('arrow_forward')}</button></div></div>`;
  };
  // Closing on the compare page: the chosen residence, then hold → buyer → reservation → signing → proposal.
  const days = () => { const out = [], d = new Date(); while (out.length < 5) { d.setDate(d.getDate()+1); if (d.getDay() % 6) out.push(new Date(d)); } return out; };
  const dayKey = d => d.toISOString().slice(0,10), dayLabel = d => d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
  function secure(uid) {
    const s = S(), u = D.unit(uid), i = s.sel.find(x => x.uid === uid), d = DEV(u.dev), c = D.commerce(d.id), f = P.finish(uid,i?.finish);
    const o = OPPS.find(x => x.id === s.oppId), held = P.heldByMe?.(uid), h = store().holds?.[uid], cl = (s.closing ||= {})[uid] ||= {};
    const usd = c.currency === 'USD', signing = usd ? 'contract signing' : 'promise of sale', L = s.link;
    const step = (n,done,title,body,act,lock) => `<div class="pv-sstep ${done ? 'done' : ''} ${lock ? 'lock' : ''}"><span class="n">${done ? I('check') : n}</span><b>${title}</b><p>${body}</p>${act || ''}</div>`;
    const buyerForm = `<div class="pv-sform"><input data-f="lname" value="${esc(L.name)}" placeholder="Full name" aria-label="Buyer name" data-enter="linkNew"><input type="email" data-f="lemail" value="${esc(L.email)}" placeholder="Email" aria-label="Email" data-enter="linkNew"><input type="tel" data-f="lphone" value="${esc(L.phone)}" placeholder="Phone" aria-label="Phone" data-enter="linkNew">
      <button class="pv-optrow" data-a="lconsent" data-v="cem" aria-pressed="${!!L.cem}">Email updates<span class="pv-toggle ${L.cem ? 'on' : ''}"></span></button><button class="pv-optrow" data-a="lconsent" data-v="cwa" aria-pressed="${!!L.cwa}">WhatsApp updates<span class="pv-toggle ${L.cwa ? 'on' : ''}"></span></button>
      <button class="pv-cta sm" data-a="linkNew" ${L.name.trim() ? '' : 'disabled'}>Save buyer</button></div>`;
    return `<section class="pv-secure" aria-label="Secure ${esc(uid)}"><div class="pv-sechd"><img src="${esc(P.unitImg(uid))}" alt="">
      <div><div class="pv-eyebrow">${I('verified')}Your residence</div><h2>${esc(uid)} <span>· ${esc(d.name)}</span></h2>
      <p>${u.beds ? u.beds+' bedrooms' : 'Studio'} · ${P.ar(D.area(u),u)} · Floor ${u.floor} · ${esc(D.viewOf(u))} · ${esc(f?.name || '')} finish</p></div>
      <div class="pv-secprice"><b>${P.fmt(P.unitPrice(uid,i?.finish),u)}</b><small>${c.plan[0][2]}% on signing${s.hidePrices ? '' : ' · '+P.fmt(P.unitPrice(uid,i?.finish)*c.plan[0][2]/100,u)}</small></div>
      <button class="pv-ib" data-a="choose" data-v="${esc(uid)}" aria-label="Choose a different residence">${I('close')}</button></div>
      <div class="pv-ssteps">
        ${step(1,held,'Hold it',held ? `Held for 48 hours · <span data-hold-cd="${esc(uid)}"></span> left. Nobody else can reserve it.` : `Take it off the market for ${c.hold.hours} hours while you decide. ${esc(c.hold.deposit)}.`,
          held ? `<button class="pv-ghost" data-a="release" data-v="${esc(uid)}">${I('lock_open')}Release</button>` : `<button class="pv-cta sm" data-a="hold" data-v="${esc(uid)}">${I('timer')}Hold for 48 hours</button>`)}
        ${step(2,!!o,'Your details',o ? `${esc(o.lead)} · saved to your file.` : 'So the hold, the reservation and the appointment are in your name.',o ? `<button class="pv-ghost" data-a="unlink">Change</button>` : buyerForm)}
        ${step(3,!!h?.agreement,'Reserve',h?.agreement ? `Reservation agreement sent. Deposit ${esc(c.hold.deposit.replace(' refundable',''))} secures it.` : `Sign the reservation agreement and pay the ${esc(c.hold.deposit)} deposit${usd ? ' into escrow' : ''}.`,
          h?.agreement ? '' : `<button class="pv-cta sm" data-a="reserve" data-v="${esc(uid)}" ${held && o ? '' : 'disabled'}>${I('draw')}Send reservation agreement</button>`,!(held && o))}
        ${step(4,!!cl.booked,'Book the '+signing,cl.booked ? `${esc(cl.booked)} · in the calendar and on your file.` : usd ? 'With the sales team and your attorney, within 30 days of reserving.' : 'At the notary, where the 10% deposit is paid.',
          cl.booked ? `<button class="pv-ghost" data-a="rebook" data-v="${esc(uid)}">Change</button>` : `<div class="pv-slots">${days().map(x => `<button data-a="slotDay" data-v="${dayKey(x)}" aria-pressed="${cl.day === dayKey(x)}">${dayLabel(x)}</button>`).join('')}</div>
          <div class="pv-slots">${['10:00','12:00','15:00','17:30'].map(t => `<button data-a="slotTime" data-v="${t}" aria-pressed="${cl.time === t}">${t}</button>`).join('')}</div>
          <button class="pv-cta sm" data-a="book" data-v="${esc(uid)}" ${o && cl.day && cl.time ? '' : 'disabled'}>${I('event')}Book ${signing}</button>`,!o)}
        ${step(5,s.shares.length > 0,'Send the proposal',s.shares.length ? 'Sent. Everything you chose, in one place.' : 'Your selection, this comparison and the payment plan, sent to you after the meeting.',`<button class="pv-ghost" data-a="finishPresentation">${I('send')}Send the proposal</button>`)}
      </div></section>`;
  }
  A.cmpTab = v => { S().cmpTab = v; R(); };
  A.choose = v => { const s = S(); s.chosen = s.chosen === v ? null : v; R(); if (s.chosen) requestAnimationFrame(() => P.root.querySelector('.pv-secure')?.scrollIntoView({behavior:P.reduce() ? 'auto' : 'smooth',block:'start'})); };
  A.slotDay = v => { const s = S(); s.closing[s.chosen].day = v; R(); };
  A.slotTime = v => { const s = S(); s.closing[s.chosen].time = v; R(); };
  A.rebook = v => { S().closing[v].booked = null; R(); };
  A.book = v => {
    const s = S(), cl = s.closing[v], o = OPPS.find(x => x.id === s.oppId); if (!o || !cl.day || !cl.time) return;
    const u = D.unit(v), usd = D.commerce(DEV(u.dev).id).currency === 'USD', what = usd ? 'Contract signing' : 'Promise of sale';
    const when = new Date(cl.day+'T12:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})+' at '+cl.time;
    cl.booked = what+' · '+when;
    o.stage = 'Contract Booked'; o.next = {d:new Date(cl.day+'T12:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}),t:what+' · '+v};
    const x = getExt(o); x.comms ||= []; x.comms.unshift({ch:'sys',t:'Just now',text:`${what} booked for ${v} · ${when} (Present Mode)`});
    store().records[o.id] = {opportunity:P.clone(o),extension:P.clone(x)}; P.persist(); R(); P.toast(what+' booked · '+when);
  };
  A.compare = () => { const s = S(); s.panel = null; s.cmpBack = s.screen === 'unit' ? 'unit' : 'present'; P.go('compare'); };
  A.cmpBack = () => P.go(S().cmpBack || 'present');
  A.cmpDiff = () => { S().cmpDiff = !S().cmpDiff; R(); };
  A.finishPresentation = () => { P.persist(); P.go('thanks'); };

  // Buyer-safe closing screen. The rep confirms the screen is turned away before checkout shows CRM data.
  P.screens.thanks = () => {
    const s = S(), o = OPPS.find(x => x.id === s.oppId), first = o?.lead?.split(' ')[0];
    // The developer's logo crowns the closing screen; a multi-development selection shows each.
    const devs = [...new Set([s.dev,...s.sel.map(i => i.dev)].filter(Boolean))].slice(0,3), nd = new Set(s.sel.map(i => i.dev)).size;
    const logo = id => { const b = D.brand(id); return b.logo.img ? `<img src="${esc(b.logo.img)}" alt="${esc(b.logo.alt)}">` : `<span class="lock" style="font-family:${b.display}">${esc(b.logo.text)}</span>`; };
    return `<div class="pv-orb pv-thanks">${P.aurora(devs[0] ? P.brandPal(devs[0]) : '')}<div class="pv-top"><span></span><div class="r">${P.closeBtn()}</div></div>
      <div class="pv-thanks-logos">${devs.map((id,i) => `<span style="--d:${(.1+i*.12).toFixed(2)}s">${logo(id)}</span>`).join('')}</div>
      <div class="pv-loadwrap"><h1 tabindex="-1" aria-label="Thank you${first ? ', '+esc(first) : ''}." style="--d:.35s">${P.split('Thank you'+(first ? ', '+first : '')+'.')}</h1>
      <p class="pv-thanks-sub">${s.sel.length} residence${s.sel.length === 1 ? '' : 's'} selected${nd ? ` across ${nd} development${nd === 1 ? '' : 's'}` : ''}</p>
      <p class="pv-meta" style="animation-delay:1s">${esc(UN_REP)} · Your property advisor</p></div>
      <div class="rep"><span>Rep only · continue when the screen is no longer visible to the buyer</span><div class="row"><button class="pv-ghost" style="background:rgba(255,255,255,.08);color:#fff" data-a="cmpBack">Return to presentation</button><button class="pv-ghost" style="background:rgba(255,255,255,.16);color:#fff" data-a="toCheckout">${I('visibility_off')}Screen turned away · continue</button></div></div></div>`;
  };
  A.toCheckout = () => P.go('checkout');

  // Linking
  const initials = n => (n || '?').split(/\s+/).map(x => x[0]).slice(0,2).join('').toUpperCase();
  function link(kind,id) {
    const s = S(), L = s.link; let o = null, c = null;
    if (kind === 'opportunity') { o = OPPS.find(x => x.id === id); c = CONTACTS.find(x => x.oppIds?.includes(id)) || null; }
    else {
      if (kind === 'contact') c = CONTACTS.find(x => x.id === id);
      else {
        if (!L.name.trim()) { P.toast('Add the buyer’s name to create their record.'); return; }
        if (L.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(L.email)) { P.toast('Check the email address, or leave it blank.'); return; }
        c = {id:P.uuid('contact'),name:L.name.trim(),email:L.email.trim(),phone:L.phone.trim(),type:'lead',status:'active',btype:'',company:'',nat:'',lang:D.LANGS[P.prefs.lang] || 'English',source:s.partner ? 'Partner: '+s.partner.name : 'Present mode',rep:UN_REP,tags:s.partner ? ['Partner registration'] : [],oppIds:[],consent:{wa:!!L.cwa && !!L.phone.trim(),em:!!L.cem && !!L.email.trim(),sms:false,at:P.now(),by:UN_REP,how:'Recorded in Present Mode'},notesList:[],created:P.now(),last:'Today',lastD:P.now(),bmin:0,bmax:0};
        CONTACTS.push(c);
      }
      if (!c) return;
      c.oppIds ||= [];
      o = OPPS.find(x => c.oppIds.includes(x.id) && !/won|lost|closed/i.test(x.stage));
      if (!o) {
        const max = Math.max(0,...s.sel.map(i => P.unitPrice(i.uid,i.finish)));
        o = {id:P.uuid('OPP'),lead:c.name,devs:[],units:[],stage:'Qualified',source:'Present mode',budget:Math.ceil(max/50000)*50,value:Math.round(max/1000),tags:[],rep:UN_REP,next:{d:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}),t:'Follow up on presentation'},ago:'Today'};
        OPPS.push(o); c.oppIds.push(o.id);
      }
    }
    if (!o) return;
    s.oppId = o.id; s.contactId = c?.id || null; s.output = null;
    sync(o,c);
    P.toast('Linked to '+o.lead+' · '+o.id);
  }
  // Write the selection, finishes and activity onto the opportunity.
  function sync(o,c) {
    const s = S();
    o.devs = [...new Set([...o.devs,...s.sel.map(i => DEV(i.dev).name)])];
    o.units = [...new Set([...o.units,...s.sel.map(i => i.uid)])];
    const x = getExt(o); x.unitConfigs ||= {}; x.comms ||= [];
    s.sel.forEach(i => { x.unitConfigs[i.uid] = {...(x.unitConfigs[i.uid] || {}),fin:P.finish(i.uid,i.finish)?.name || '',lay:D.layoutName(i.dev,i.layout) || 'As designed',adds:[],price:P.unitPrice(i.uid,i.finish),style:i.style}; });
    const key = s.id+':linked';
    if (!x.comms.some(e => e.presentKey === key)) x.comms.unshift({ch:'sys',t:'Just now',text:`Present Mode · ${s.sel.length} residence${s.sel.length === 1 ? '' : 's'} selected: ${s.sel.map(i => i.uid).join(', ')}`,presentKey:key});
    store().records[o.id] = {opportunity:P.clone(o),extension:P.clone(x)};
    const contact = c || CONTACTS.find(k => k.id === s.contactId);
    if (contact && contact.source === 'Present mode') store().contacts[contact.id] = P.clone(contact);
    P.persist();
  }
  const outputSig = () => JSON.stringify([S().sel.map(i => [i.uid,i.finish,i.layout,i.style,i.cmp]),S().prices,S().includeCompare,S().oppId]);
  function ensureOutput() {
    const s = S(); if (!s.oppId || !s.sel.length) return null;
    const cur = s.output && store().outputs[s.output];
    if (cur && cur.sig === outputSig()) return cur;
    const o = OPPS.find(x => x.id === s.oppId), id = P.uuid('sel').replace('sel-','');
    // Re-check availability at the moment of sharing; anything sold or reserved elsewhere is left out.
    const ok = s.sel.filter(i => P.canTake(D.unit(i.uid))), dropped = s.sel.filter(i => !ok.includes(i)).map(i => i.uid), day = 864e5;
    store().outputs[id] = {id,sig:outputSig(),created:P.now(),buyer:o?.lead || '',rep:UN_REP,oppId:s.oppId,prices:s.prices,compare:s.includeCompare,
      days:14,expires:Date.now()+14*day,validUntil:Date.now()+14*day,lang:P.prefs.lang,ccy:P.prefs.ccy,dropped,events:[],
      items:ok.map(i => ({uid:i.uid,dev:i.dev,finish:i.finish,layout:i.layout,style:i.style,cmp:i.cmp,price:P.unitPrice(i.uid,i.finish)}))};
    s.output = id; sync(o); return store().outputs[id];
  }
  P.outputURL = id => location.origin+location.pathname+'#present='+id;
  P.ensureOutput = () => ensureOutput();

  function linkBox() {
    const s = S(), L = s.link, o = OPPS.find(x => x.id === s.oppId);
    if (o) {
      const c = CONTACTS.find(x => x.id === s.contactId);
      return `<section class="pv-box"><h3><span class="n ok">${I('check')}</span>Linked opportunity</h3>
        <div class="pv-linked"><span class="pv-avatar">${initials(o.lead)}</span><div class="t"><b style="font-weight:500">${esc(o.lead)}</b><small>${esc(o.id)} · ${esc(o.stage)}${c?.email ? ' · '+esc(c.email) : ''}</small></div><button class="pv-ghost" data-a="unlink">Change</button></div>
        <p style="padding:6px 10px 8px">${s.sel.length} residence${s.sel.length === 1 ? '' : 's'}, finishes and this session are saved to the opportunity’s activity.</p></section>`;
    }
    const q = L.q.trim().toLowerCase();
    const list = L.type === 'opportunity' ? OPPS.filter(x => !q || (x.lead+' '+x.id).toLowerCase().includes(q)).slice(0,30).map(x => `<button class="pv-row" style="min-height:48px" data-a="link" data-v="opportunity:${esc(x.id)}"><span class="pv-avatar">${initials(x.lead)}</span><div class="t"><b>${esc(x.lead)}</b><small>${esc(x.id)} · ${esc(x.stage)} · ${esc(x.devs.slice(0,2).join(', ') || 'No development')}</small></div>${I('add_link')}</button>`)
      : L.type === 'contact' ? CONTACTS.filter(x => !q || (x.name+' '+(x.email || '')).toLowerCase().includes(q)).slice(0,30).map(x => `<button class="pv-row" style="min-height:48px" data-a="link" data-v="contact:${esc(x.id)}"><span class="pv-avatar">${initials(x.name)}</span><div class="t"><b>${esc(x.name)}</b><small>${esc(x.email || x.phone || 'No contact details')} · ${x.oppIds?.length || 0} opportunit${x.oppIds?.length === 1 ? 'y' : 'ies'}</small></div>${I('add_link')}</button>`) : [];
    return `<section class="pv-box"><h3><span class="n">1</span>Link to an opportunity</h3><p>Who was this presentation for? Their selection is saved to the record.</p>
      <div class="pv-seg" role="group" aria-label="Link type">${[['opportunity','Opportunity'],['contact','Contact'],['new','New buyer']].map(([v,l]) => `<button data-a="linkType" data-v="${v}" aria-pressed="${L.type === v}">${l}</button>`).join('')}</div>
      ${L.type === 'new' ? `<label class="pv-field">Name<input data-f="lname" value="${esc(L.name)}" autocomplete="off" data-enter="linkNew"></label><label class="pv-field">Email (optional)<input type="email" data-f="lemail" value="${esc(L.email)}" data-enter="linkNew"></label><label class="pv-field">Phone (optional)<input type="tel" data-f="lphone" value="${esc(L.phone)}" data-enter="linkNew"></label>
        <div class="pv-consent"><span>Marketing consent</span><button class="pv-optrow" data-a="lconsent" data-v="cwa" aria-pressed="${!!L.cwa}">Agrees to WhatsApp messages<span class="pv-toggle ${L.cwa ? 'on' : ''}"></span></button><button class="pv-optrow" data-a="lconsent" data-v="cem" aria-pressed="${!!L.cem}">Agrees to email<span class="pv-toggle ${L.cem ? 'on' : ''}"></span></button></div>
        <div style="padding:4px 6px 6px"><button class="pv-cta sm" data-a="linkNew" ${L.name.trim() ? '' : 'disabled'}>Create buyer &amp; opportunity</button></div>`
      : `<div class="pv-search"><div class="in">${I('search')}<input data-f="lq" value="${esc(L.q)}" placeholder="Search ${L.type === 'opportunity' ? 'opportunities' : 'contacts'}" aria-label="Search"></div></div><div class="pv-list2" data-keep="linklist">${list.join('') || '<div class="pv-sel-empty">No matches. Try New buyer.</div>'}</div>`}</section>`;
  }
  function shareBox() {
    const s = S(), out = ensureOutput(), c = CONTACTS.find(x => x.id === s.contactId);
    if (!out) return `<section class="pv-box" aria-disabled="true"><h3><span class="n">2</span>Share the selection</h3><p>${s.sel.length ? 'Link an opportunity and the buyer’s link is created automatically.' : 'Add residences to the selection first.'}</p></section>`;
    const url = P.outputURL(out.id);
    return `<section class="pv-box"><h3><span class="n ok">${I('check')}</span>Share the selection</h3><p>Their personal link was created automatically. It stays in sync until you change the selection.</p>
      <div class="pv-link">${I('link')}<code>${esc(url)}</code><button class="pv-cta sm" data-a="share" data-v="copy">${I('content_copy')}Copy</button></div>
      ${out.dropped?.length ? `<div class="pv-warn">${I('error')}<span>${out.dropped.map(esc).join(', ')} ${out.dropped.length === 1 ? 'is' : 'are'} no longer available and ${out.dropped.length === 1 ? 'was' : 'were'} left out of the link.</span></div>` : ''}
      <div class="pv-share"><button data-a="share" data-v="wa" ${c?.phone && c?.consent?.wa ? '' : 'disabled'} title="${!c?.phone ? 'No phone number on the record' : !c?.consent?.wa ? 'No WhatsApp consent recorded' : ''}">${I('chat')}WhatsApp</button><button data-a="share" data-v="email" ${c?.email && c?.consent?.em ? '' : 'disabled'} title="${!c?.email ? 'No email on the record' : !c?.consent?.em ? 'No email consent recorded' : ''}">${I('mail')}Email</button>
        <button data-a="share" data-v="pdf">${I('picture_as_pdf')}PDF</button><button data-a="buyerPreview">${I('visibility')}Preview</button></div>
      ${c && ((c.phone && !c.consent?.wa) || (c.email && !c.consent?.em)) ? `<div class="pv-consent">${c.phone && !c.consent?.wa ? `<button class="pv-ghost" data-a="consent" data-v="wa">${I('verified')}Record WhatsApp consent</button>` : ''}${c.email && !c.consent?.em ? `<button class="pv-ghost" data-a="consent" data-v="em">${I('verified')}Record email consent</button>` : ''}<small class="pv-muted">Only once ${esc(c.name.split(' ')[0])} has agreed. It is logged on the contact.</small></div>` : ''}
      <div class="pv-optrow"><span>Link expires</span><div class="pv-seg" style="margin:0">${[7,14,30].map(n => `<button data-a="linkExpiry" data-v="${n}" aria-pressed="${(out.days || 14) === n}" aria-label="${n} days">${n}d</button>`).join('')}</div></div>
      <div class="pv-optrow"><span>Prices valid until</span><b style="font-weight:500">${new Date(out.validUntil).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</b></div>
      <button class="pv-optrow" data-a="optPrices" aria-pressed="${s.prices}">Show prices<span class="pv-toggle ${s.prices ? 'on' : ''}"></span></button>
      <button class="pv-optrow" data-a="optCompare" aria-pressed="${s.includeCompare}">Include the comparison<span class="pv-toggle ${s.includeCompare ? 'on' : ''}"></span></button>
      ${P.engagementHtml ? P.engagementHtml(out) : ''}
      ${s.shares.length ? `<div class="pv-log">${s.shares.map(x => `<div>${I(x.icon)}${esc(x.text)}<span style="margin-left:auto">${esc(x.at)}</span></div>`).join('')}</div>` : ''}
      <p class="pv-muted" style="padding:2px 10px 8px;font-size:11px">Prototype: WhatsApp and email are simulated; nothing is sent. The link opens in this browser.</p></section>`;
  }
  P.screens.checkout = () => {
    const s = S(), o = OPPS.find(x => x.id === s.oppId);
    const ccys = new Set(s.sel.map(i => P.ccyOf(D.unit(i.uid)))), TC = P.prefs.ccy !== 'local' ? P.prefs.ccy : ccys.size === 1 ? [...ccys][0] : 'EUR';
    const total = s.sel.reduce((a,i) => a+P.toCcy(P.unitPrice(i.uid,i.finish),D.unit(i.uid),TC),0), mixed = [...ccys].some(c => c !== TC);
    return `<div class="pv-dark" data-keep="co"><div class="pv-top"><div class="r"><button class="pv-chip" data-a="cmpBack">${I('arrow_back')}Back to presentation</button></div><div class="r">${P.closeBtn()}</div></div>
      <div class="wrap"><div class="pv-hd"><div><div class="pv-eyebrow">${I('lock')}Rep only · not for screen sharing</div><h1 tabindex="-1">Keep the conversation going.</h1><p>Link the presentation to the buyer, then send them their selection.</p></div></div>
      <div class="pv-co"><div style="display:flex;flex-direction:column;gap:16px">${linkBox()}${shareBox()}</div>
      <aside class="pv-box"><h3>Selection<small class="pv-muted" style="margin-left:auto;font-weight:400">${s.sel.length} residence${s.sel.length === 1 ? '' : 's'}</small></h3>
        ${s.sel.map(i => { const u = D.unit(i.uid), f = P.finish(i.uid,i.finish); return `<div class="pv-sum"><img src="${esc(P.unitImg(i.uid))}" alt=""><div class="t"><b style="font-weight:500">${esc(i.uid)}</b><small>${esc(DEV(u.dev).name)} · ${u.beds ? u.beds+' bed' : 'Studio'} · ${P.ar(D.area(u),u)}</small><small>${esc(f?.name || '—')} finish${D.styleName(i.dev,i.style) ? ' · '+esc(D.styleName(i.dev,i.style))+' style' : ''}</small></div><span>${P.fmt(P.unitPrice(i.uid,i.finish),u,{force:true})}</span><button class="pv-ib" data-a="heart" data-v="${esc(i.uid)}" aria-label="Remove ${esc(i.uid)}">${I('close')}</button></div>`; }).join('') || '<div class="pv-sel-empty">No residences selected.</div>'}
        ${s.sel.length ? `<div class="pv-sumtotal"><span>Combined value</span><b style="color:var(--primary);font-weight:500">${P.fmtIn(total,TC,mixed)}</b></div>` : ''}
        ${P.holdsHtml ? P.holdsHtml() : ''}${P.signalsHtml ? P.signalsHtml() : ''}
        <div style="display:flex;gap:6px;padding:4px"><button class="pv-ghost" data-a="compare">${I('compare_arrows')}Compare</button><button class="pv-cta sm" style="margin-left:auto" data-a="done" ${o ? '' : 'disabled'}>Done · open ${o ? esc(o.lead.split(' ')[0]) : 'opportunity'}${I('arrow_forward')}</button></div></aside></div></div></div>`;
  };
  A.linkType = v => { S().link.type = v; R(); };
  A['in:lq'] = v => { S().link.q = v; R(); };
  A['in:lname'] = v => { S().link.name = v; const b = P.root.querySelector('[data-a="linkNew"].pv-cta'); if (b) b.disabled = !v.trim(); };
  A['in:lemail'] = v => { S().link.email = v; };
  A['in:lphone'] = v => { S().link.phone = v; };
  A.link = v => { const [k,...id] = v.split(':'); link(k,id.join(':')); };
  A.linkNew = () => link('new');
  A.unlink = () => { S().oppId = null; S().contactId = null; S().output = null; R(); };
  A.optPrices = () => { S().prices = !S().prices; R(); };
  A.lconsent = v => { S().link[v] = !S().link[v]; R(); };
  A.consent = v => {
    const s = S(), c = CONTACTS.find(x => x.id === s.contactId); if (!c) return;
    c.consent = {...(c.consent || {}),[v]:true,at:P.now(),by:UN_REP,how:'Verbal, recorded in Present Mode'};
    const o = OPPS.find(x => x.id === s.oppId); if (o) { const x = getExt(o); x.comms ||= []; x.comms.unshift({ch:'sys',t:'Just now',text:`${v === 'wa' ? 'WhatsApp' : 'Email'} consent recorded by ${UN_REP} in Present Mode`}); }
    store().contacts[c.id] = P.clone(c); P.persist(); R(); P.toast((v === 'wa' ? 'WhatsApp' : 'Email')+' consent recorded');
  };
  A.linkExpiry = v => { const out = store().outputs[S().output]; if (!out) return; out.days = +v; out.expires = Date.parse(out.created)+(+v)*864e5; P.save(); R(); };
  A.optCompare = () => { S().includeCompare = !S().includeCompare; R(); };
  A.done = () => P.close(true);
  A.share = async v => {
    const s = S(), out = ensureOutput(); if (!out) return;
    const o = OPPS.find(x => x.id === s.oppId), x = getExt(o), url = P.outputURL(out.id), first = o.lead.split(' ')[0];
    const names = {copy:['Link copied','content_copy'],wa:['WhatsApp sent (simulated)','chat'],email:['Email sent (simulated)','mail'],pdf:['PDF prepared','picture_as_pdf']};
    if (v === 'copy') { try { await navigator.clipboard.writeText(url); } catch (e) { P.toast('Clipboard blocked. Select the link and copy it manually.'); return; } }
    if (v === 'pdf') { S().buyerBack = 'checkout'; S().buyer = out.id; P.go('buyer'); setTimeout(() => window.print(),300); }
    const at = new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    s.shares.unshift({text:names[v][0],icon:names[v][1],at});
    const sh = typeof ensureShared === 'function' ? ensureShared(o,x) : (x.shared ||= []), key = out.id+':'+v;
    if (!sh.some(e => e.presentKey === key)) sh.unshift({n:'Presentation selection',k:'WEB',d:`${[...new Set(out.items.map(i => DEV(i.dev).name))].join(', ')} · ${out.items.length} units`,via:`${first} · ${{copy:'Link',wa:'WhatsApp',email:'Email',pdf:'PDF'}[v]} · Today, ${at}`,chips:[[v === 'copy' ? 'Copied' : 'Sent',v === 'copy' ? '' : 'ok'],['Link active','']],eng:'Not opened yet · prototype',presentKey:key});
    x.comms ||= []; x.comms.unshift({ch:'sys',t:'Just now',text:`Present Mode · ${names[v][0]} · ${out.items.map(i => i.uid).join(', ')}`});
    store().records[o.id] = {opportunity:P.clone(o),extension:P.clone(x)}; P.persist();
    if (v !== 'pdf') { R(); P.toast(names[v][0]+(v === 'copy' ? '' : ' to '+first)); }
  };
  A.buyerPreview = () => { const out = ensureOutput(); if (!out) return; S().buyerBack = 'checkout'; S().buyer = out.id; P.go('buyer'); };

  // The buyer's link: their selection in each development's branding.
  P.screens.buyer = () => {
    const s = S(), out = store().outputs[s.buyer];
    if (!out) return `<div class="pv-empty"><b>This selection isn’t available</b>Links open in the browser they were created in during the prototype.</div>`;
    if (!s.buyerBack && out.lang) P.prefs.lang = out.lang;
    if (!s.buyerBack && out.expires && Date.now() > out.expires) return `<div class="pv-empty"><b>This selection has expired</b>Prices and availability move quickly. Ask ${esc(out.rep)} for an up-to-date selection.</div>`;
    const items = out.items.filter(i => D.unit(i.uid)), cash = (n,u) => out.prices ? P.fmtIn(n,P.ccyOf(u)) : P.t('Price on request');
    const valid = out.validUntil ? new Date(out.validUntil).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '';
    const byDev = [...new Set(items.map(i => i.dev))];
    const cmp = items.filter(i => i.cmp);
    return `<div class="pv-buyer"><div class="wrap"><div class="pv-hd" style="align-items:center"><div><div class="pv-eyebrow pv-hostmark">${esc(D.COMPANY.name)}</div><h1 tabindex="-1">${P.prefs.lang === 'en' ? (out.buyer ? esc(out.buyer.split(' ')[0])+', your' : 'Your')+' selection' : (out.buyer ? esc(out.buyer.split(' ')[0])+' · ' : '')+P.t('Your selection')}</h1><p>${P.t('Prepared by')} ${esc(out.rep)} · ${new Date(out.created).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} · ${items.length} residence${items.length === 1 ? '' : 's'}${valid && out.prices ? ` · ${P.t('Prices valid until')} ${valid}` : ''}</p></div>
      <div class="pv-noprint" style="display:flex;gap:8px">${s.buyerBack ? `<button class="pv-ghost" data-a="buyerBack">${I('arrow_back')}Back to checkout</button>` : ''}<button class="pv-cta sm" data-a="print">${I('print')}Print / Save PDF</button></div></div>
      ${byDev.map(id => { const d = DEV(id); return `<h2 style="margin:28px 0 12px;font-weight:400;font-size:22px">${esc(d.name)} <span class="pv-muted" style="font-size:14px">${esc(d.loc)} · ${esc(d.completion)}</span></h2><div class="pv-bcards">${items.filter(i => i.dev === id).map(i => { const u = D.unit(i.uid), f = P.finish(i.uid,i.finish);
        return `<article class="pv-bcard" style="${P.brandVars(id)}"><div class="img" data-track="${esc(i.uid)}"><img src="${esc(P.unitImg(i.uid))}" alt=""><span>${P.t(P.statusText(u))}</span>${P.aiLabel ? P.aiLabel() : ''}</div><div class="b"><h3>${esc(u.id)}</h3>
          <small>Floor ${u.floor} · ${u.beds ? u.beds+' '+P.t('bedrooms') : 'Studio'} · ${u.baths} bath · ${P.ar(D.area(u),u)} (${P.ar(u.sqm,u)} int / ${P.ar(u.ext,u)} ext)</small><small>${esc(D.viewOf(u))} · ${D.featuresOf(u).map(k => D.FEATURES[k].label).join(' · ')}</small>
          <div style="height:150px;display:flex;align-items:center;justify-content:center;background:var(--b-surface);border-radius:6px;padding:8px">${P.planHtml(u,140).replace('<img ','<img style="max-height:134px;mix-blend-mode:multiply" ')}</div>
          <small>${esc(f?.name || '')} finish${f?.mood ? ' · '+esc(f.mood) : ''}</small><div class="p">${cash(i.price,u)}</div>${out.prices ? `<small>${D.commerce(DEV(u.dev).id).plan.map(p => p[2]+'% '+p[0].toLowerCase()).join(' · ')}</small>` : ''}${u.status === 'hold' && store().holds?.[u.id] ? `<small class="pv-heldnote">${P.t('Held for you')} · until ${new Date(store().holds[u.id].until).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small>` : u.status !== 'available' ? '<small>Availability has changed since this was shared. Ask your advisor for alternatives.</small>' : ''}</div></article>`; }).join('')}</div>`; }).join('')}
      ${out.compare && cmp.length >= 2 ? `<h2 style="margin:36px 0 12px;font-weight:400;font-size:22px">Side by side</h2>${P.cmpTable(cmp,{print:true,prices:out.prices})}` : ''}
      <p class="pv-muted" style="margin-top:32px;font-size:12px">Illustrations and renders are indicative and not contractual. The specification, areas and payment terms are confirmed in the ${byDev.some(id => P.ccyOf(id) === 'USD') ? 'purchase agreement and condominium documents' : 'promise of sale'}. Availability and prices can change; your advisor will confirm before reservation.${out.expires ? ' This link is valid until '+new Date(out.expires).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+'.' : ''}</p></div></div>`;
  };
  A.buyerBack = () => P.go(S().buyerBack || 'checkout');
  A.print = () => window.print();

  // Buyer links open straight into their selection.
  const id = (location.hash.match(/^#present=([\w-]+)/) || [])[1];
  if (id) P.open({mode:'buyer',id});
})();
