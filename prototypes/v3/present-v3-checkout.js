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
  P.cmpTable = (items,{print = false,diffOnly = false,prices = true} = {}) => {
    const cols = items.map(i => ({...i,u:D.unit(i.uid)})).filter(c => c.u);
    if (!cols.length) return '';
    const fin = c => P.finish(c.uid,c.finish), price = c => c.price ?? c.u.price+(fin(c)?.delta || 0);
    const rows = [
      ['Development',c => DEV(c.u.dev).name+' · '+DEV(c.u.dev).loc],
      ['Price',c => price(c),{best:'min',fmt:eur}],
      ['Price per m²',c => Math.round(price(c)/D.area(c.u)),{best:'min',fmt:eur}],
      ['Bedrooms · baths',c => (c.u.beds ? c.u.beds+' bed' : 'Studio')+' · '+c.u.baths+' bath'],
      ['Total area',c => D.area(c.u),{best:'max',fmt:v => v+' m²'}],
      ['Internal · external',c => c.u.sqm+' m² · '+c.u.ext+' m²'],
      ['Floor',c => c.u.floor === 0 ? 'Ground' : String(c.u.floor)],
      ['View',c => D.viewOf(c.u)],
      ['Features',c => D.featuresOf(c.u).map(k => D.FEATURES[k].label).join(' · ') || '—'],
      ['Finish',c => (fin(c)?.name || '—')+(fin(c)?.delta ? ' (+'+eur(fin(c).delta)+')' : '')],
      ['Render style',c => D.styleName(DEV(c.u.dev)?.id,c.style) || '—'],
      ['Completion',c => c.u.ready || DEV(c.u.dev).completion],
      ['Status',c => P.statusText(c.u)],
    ];
    const out = rows.filter(([k]) => prices || !/^Price/.test(k)).map(([k,fn,o = {}]) => {
      const vals = cols.map(fn), diff = new Set(vals.map(String)).size > 1;
      let best = -1; if (o.best && diff && cols.length > 1) { const t = o.best === 'min' ? Math.min(...vals) : Math.max(...vals); if (vals.filter(v => v === t).length === 1) best = vals.indexOf(t); }
      if (diffOnly && !diff) return '';
      return `<div class="k ${diff ? 'diff' : ''}">${k}</div>`+vals.map((v,i) => `<div class="${diff ? 'diff' : ''}">${esc(o.fmt ? o.fmt(v) : v)}${i === best ? `<span class="best">${I('star','fill')}Best</span>` : ''}</div>`).join('');
    }).join('');
    const head = `<div class="head k">${print ? '' : `${cols.length} residence${cols.length === 1 ? '' : 's'}`}</div>`+cols.map(c => {
      const b = D.brand(DEV(c.u.dev).id);
      return `<div class="head"><div class="media" style="background:${b.bg}"><div class="plan">${P.planHtml(c.u,130)}</div>${print ? '' : `<button class="rm" data-a="cmpToggle" data-v="${esc(c.uid)}" aria-label="Remove ${esc(c.uid)} from comparison">${I('close')}</button>`}</div>
        <div><small style="color:var(--secondary)">${esc(DEV(c.u.dev).name)}</small><div class="uid" style="font-family:${b.display}">${esc(c.uid)}</div></div>${print ? '' : `<button class="pv-ghost" data-a="openUnit" data-v="${esc(c.uid)}">${I('arrow_outward')}Open residence</button>`}</div>`;
    }).join('');
    return `<div class="pv-cmp" style="--n:${cols.length}" role="table" aria-label="Unit comparison">${head}${out}</div>`;
  };

  P.screens.compare = () => {
    const s = S(), items = s.sel.filter(i => i.cmp), devs = new Set(items.map(i => i.dev));
    return `<div class="pv-dark" data-keep="cmp"><div class="pv-top"><div class="r"><button class="pv-chip" data-a="cmpBack">${I('arrow_back')}Back to presentation</button></div>
      <div class="r"><button class="pv-chip" data-a="cmpDiff" aria-pressed="${s.cmpDiff}">${I(s.cmpDiff ? 'check_box' : 'check_box_outline_blank')}Differences only</button></div></div>
      <div class="wrap"><div class="pv-hd"><div><div class="pv-eyebrow">${I('compare_arrows')}Side by side</div><h1 tabindex="-1">Compare ${items.length} residence${items.length === 1 ? '' : 's'}</h1>
      <p>${devs.size > 1 ? 'Across '+devs.size+' developments. ' : ''}Prices include each residence’s chosen finish package.</p></div></div>
      ${items.length ? P.cmpTable(items,{diffOnly:s.cmpDiff}) : '<div class="pv-empty" style="position:static;padding:80px 0"><b>Nothing to compare</b>Tick residences in the Selected panel to compare them.</div>'}
      ${s.sel.length > items.length ? `<p class="pv-muted" style="margin-top:16px">${s.sel.length-items.length} more in your selection: ${s.sel.filter(i => !i.cmp).map(i => `<button class="pv-ghost" style="display:inline-flex;margin:4px" data-a="cmpToggle" data-v="${esc(i.uid)}" ${items.length >= 4 ? 'disabled' : ''}>${I('add')}${esc(i.uid)}</button>`).join('')}</p>` : ''}</div>
      <div class="pv-dock-bar"><button class="pv-chip" data-a="cmpBack">Keep exploring</button><button class="pv-cta" data-a="finishPresentation" ${s.sel.length ? '' : 'disabled'}>Finish presentation ${I('arrow_forward')}</button></div></div>`;
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
    return `<div class="pv-orb pv-thanks">${P.aurora(devs[0] ? P.brandPal(devs[0]) : '')}
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
        c = {id:P.uuid('contact'),name:L.name.trim(),email:L.email.trim(),phone:L.phone.trim(),type:'lead',status:'active',btype:'',company:'',nat:'',lang:'English',source:'Present mode',rep:UN_REP,tags:[],oppIds:[],consent:{wa:false,em:false,sms:false},notesList:[],created:P.now(),last:'Today',lastD:P.now(),bmin:0,bmax:0};
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
    store().outputs[id] = {id,sig:outputSig(),created:P.now(),buyer:o?.lead || '',rep:UN_REP,oppId:s.oppId,prices:s.prices,compare:s.includeCompare,
      items:s.sel.map(i => ({uid:i.uid,dev:i.dev,finish:i.finish,layout:i.layout,style:i.style,cmp:i.cmp,price:P.unitPrice(i.uid,i.finish)}))};
    s.output = id; sync(o); return store().outputs[id];
  }
  P.outputURL = id => location.origin+location.pathname+'#present='+id;

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
        <div style="padding:4px 6px 6px"><button class="pv-cta sm" data-a="linkNew" ${L.name.trim() ? '' : 'disabled'}>Create buyer &amp; opportunity</button></div>`
      : `<div class="pv-search"><div class="in">${I('search')}<input data-f="lq" value="${esc(L.q)}" placeholder="Search ${L.type === 'opportunity' ? 'opportunities' : 'contacts'}" aria-label="Search"></div></div><div class="pv-list2" data-keep="linklist">${list.join('') || '<div class="pv-sel-empty">No matches. Try New buyer.</div>'}</div>`}</section>`;
  }
  function shareBox() {
    const s = S(), out = ensureOutput(), c = CONTACTS.find(x => x.id === s.contactId);
    if (!out) return `<section class="pv-box" aria-disabled="true"><h3><span class="n">2</span>Share the selection</h3><p>${s.sel.length ? 'Link an opportunity and the buyer’s link is created automatically.' : 'Add residences to the selection first.'}</p></section>`;
    const url = P.outputURL(out.id);
    return `<section class="pv-box"><h3><span class="n ok">${I('check')}</span>Share the selection</h3><p>Their personal link was created automatically. It stays in sync until you change the selection.</p>
      <div class="pv-link">${I('link')}<code>${esc(url)}</code><button class="pv-cta sm" data-a="share" data-v="copy">${I('content_copy')}Copy</button></div>
      <div class="pv-share"><button data-a="share" data-v="wa" ${c?.phone ? '' : 'disabled title="No phone number on the record"'}>${I('chat')}WhatsApp</button><button data-a="share" data-v="email" ${c?.email ? '' : 'disabled title="No email on the record"'}>${I('mail')}Email</button>
        <button data-a="share" data-v="pdf">${I('picture_as_pdf')}PDF</button><button data-a="buyerPreview">${I('visibility')}Preview</button></div>
      <button class="pv-optrow" data-a="optPrices" aria-pressed="${s.prices}">Show prices<span class="pv-toggle ${s.prices ? 'on' : ''}"></span></button>
      <button class="pv-optrow" data-a="optCompare" aria-pressed="${s.includeCompare}">Include the comparison<span class="pv-toggle ${s.includeCompare ? 'on' : ''}"></span></button>
      ${s.shares.length ? `<div class="pv-log">${s.shares.map(x => `<div>${I(x.icon)}${esc(x.text)}<span style="margin-left:auto">${esc(x.at)}</span></div>`).join('')}</div>` : ''}
      <p class="pv-muted" style="padding:2px 10px 8px;font-size:11px">Prototype: WhatsApp and email are simulated; nothing is sent. The link opens in this browser.</p></section>`;
  }
  P.screens.checkout = () => {
    const s = S(), total = s.sel.reduce((a,i) => a+P.unitPrice(i.uid,i.finish),0), o = OPPS.find(x => x.id === s.oppId);
    return `<div class="pv-dark" data-keep="co"><div class="pv-top"><div class="r"><button class="pv-chip" data-a="cmpBack">${I('arrow_back')}Back to presentation</button></div><div class="r"><button class="pv-chip" data-a="exit">Save &amp; close</button></div></div>
      <div class="wrap"><div class="pv-hd"><div><div class="pv-eyebrow">${I('lock')}Rep only · not for screen sharing</div><h1 tabindex="-1">Keep the conversation going.</h1><p>Link the presentation to the buyer, then send them their selection.</p></div></div>
      <div class="pv-co"><div style="display:flex;flex-direction:column;gap:16px">${linkBox()}${shareBox()}</div>
      <aside class="pv-box"><h3>Selection<small class="pv-muted" style="margin-left:auto;font-weight:400">${s.sel.length} residence${s.sel.length === 1 ? '' : 's'}</small></h3>
        ${s.sel.map(i => { const u = D.unit(i.uid), f = P.finish(i.uid,i.finish); return `<div class="pv-sum"><img src="${esc(P.unitImg(i.uid))}" alt=""><div class="t"><b style="font-weight:500">${esc(i.uid)}</b><small>${esc(DEV(u.dev).name)} · ${u.beds ? u.beds+' bed' : 'Studio'} · ${D.area(u)} m²</small><small>${esc(f?.name || '—')} finish${D.styleName(i.dev,i.style) ? ' · '+esc(D.styleName(i.dev,i.style))+' style' : ''}</small></div><span>${eur(P.unitPrice(i.uid,i.finish))}</span><button class="pv-ib" data-a="heart" data-v="${esc(i.uid)}" aria-label="Remove ${esc(i.uid)}">${I('close')}</button></div>`; }).join('') || '<div class="pv-sel-empty">No residences selected.</div>'}
        ${s.sel.length ? `<div class="pv-sumtotal"><span>Combined value</span><b style="color:var(--primary);font-weight:500">${eur(total)}</b></div>` : ''}
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
    const items = out.items.filter(i => D.unit(i.uid)), cash = n => out.prices ? eur(n) : 'Price on request';
    const byDev = [...new Set(items.map(i => i.dev))];
    const cmp = items.filter(i => i.cmp);
    return `<div class="pv-buyer"><div class="wrap"><div class="pv-hd" style="align-items:center"><div><div class="pv-eyebrow">${P.WORDMARK}</div><h1 tabindex="-1">${out.buyer ? esc(out.buyer.split(' ')[0])+', your' : 'Your'} selection</h1><p>Prepared by ${esc(out.rep)} · ${new Date(out.created).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} · ${items.length} residence${items.length === 1 ? '' : 's'}</p></div>
      <div class="pv-noprint" style="display:flex;gap:8px">${s.buyerBack ? `<button class="pv-ghost" data-a="buyerBack">${I('arrow_back')}Back to checkout</button>` : ''}<button class="pv-cta sm" data-a="print">${I('print')}Print / Save PDF</button></div></div>
      ${byDev.map(id => { const d = DEV(id); return `<h2 style="margin:28px 0 12px;font-weight:400;font-size:22px">${esc(d.name)} <span class="pv-muted" style="font-size:14px">${esc(d.loc)} · ${esc(d.completion)}</span></h2><div class="pv-bcards">${items.filter(i => i.dev === id).map(i => { const u = D.unit(i.uid), f = P.finish(i.uid,i.finish);
        return `<article class="pv-bcard" style="${P.brandVars(id)}"><div class="img"><img src="${esc(P.unitImg(i.uid))}" alt=""><span>${P.statusText(u)}</span></div><div class="b"><h3>${esc(u.id)}</h3>
          <small>Floor ${u.floor} · ${u.beds ? u.beds+' bedrooms' : 'Studio'} · ${u.baths} bath · ${D.area(u)} m² (${u.sqm} int / ${u.ext} ext)</small><small>${esc(D.viewOf(u))} · ${D.featuresOf(u).map(k => D.FEATURES[k].label).join(' · ')}</small>
          <div style="height:150px;display:flex;align-items:center;justify-content:center;background:var(--b-surface);border-radius:6px;padding:8px">${P.planHtml(u,140).replace('<img ','<img style="max-height:134px;mix-blend-mode:multiply" ')}</div>
          <small>${esc(f?.name || '')} finish${f?.mood ? ' · '+esc(f.mood) : ''}</small><div class="p">${cash(i.price)}</div>${u.status !== 'available' ? '<small>Availability has changed since this was shared. Ask your advisor for alternatives.</small>' : ''}</div></article>`; }).join('')}</div>`; }).join('')}
      ${out.compare && cmp.length >= 2 ? `<h2 style="margin:36px 0 12px;font-weight:400;font-size:22px">Side by side</h2>${P.cmpTable(cmp,{print:true,prices:out.prices})}` : ''}
      <p class="pv-muted" style="margin-top:32px;font-size:12px">Illustrations and renders are indicative. Availability and prices can change; your advisor will confirm before reservation.</p></div></div>`;
  };
  A.buyerBack = () => P.go(S().buyerBack || 'checkout');
  A.print = () => window.print();

  // Buyer links open straight into their selection.
  const id = (location.hash.match(/^#present=([\w-]+)/) || [])[1];
  if (id) P.open({mode:'buyer',id});
})();
