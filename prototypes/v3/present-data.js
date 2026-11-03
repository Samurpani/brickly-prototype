/* Present/Compare data boundary. Load after the v2 inline script, before present-mode.js.
 * No DOM, session/tray state, storage, rendering hooks, or network side effects.
 * All strings are PLAIN TEXT: the host must escape them, including captions and labels.
 * Only plan().html is trusted HTML, produced exclusively by the host's unPlanSVG.
 *
 * priceFor(u, config) -> finite EUR number. An omitted callback uses u.price only;
 * configured pricing must be supplied by the host. Never reads configured_price caches.
 * installCompareAdapters(priceFor) is opt-in; call AFTER the host CMP_ROWS adapter loop.
 * Its callback receives the explicit cmpActivePlan config (including legacy configs).
 * If legacy callers omit config, the callback may resolve that fallback in the host.
 *
 * Rows: {key,group,label,values:string[],highlight:boolean,bestIndex?:number}.
 * group is the CMP_GROUPS display name; amenities have their own 'Amenities' group.
 * unitNumeric mirrors unitValue and returns number|null; ties have no bestIndex.
 * stats: registered = all registered records; available = status 'available';
 * from/avgPsqm use NONSOLD registered stock (including hold/reserved), base prices,
 * and the arithmetic mean of per-unit price/sqm, just like cmpDevAvgPsq.
 * Invalid ratios are omitted; an empty sample is null, not Infinity/NaN/zero.
 *
 * Asset inputs use the existing PM_* array schemas. Approval means approved === true.
 * Gallery provenance is a plain, explicit display label, not an approval boolean.
 * Project originals are returned after approved variants, separately labelled.
 * Unit layout option IDs are layout IDs for their preferred preset, or
 * 'layout:preset' for additional furnishing presets. Pass the returned layout/style
 * back as VISUAL preview state; item.config is never mutated. A bare layout chooses
 * its canonical preset (saved preset for the saved layout, otherwise catalog first).
 * Render matching always retains the saved pack. Other layouts/styles are previews,
 * never changed specifications. A fallback is explicitly labelled in provenance.
 *
 * details(uid) -> {facts:[{label,value}], rooms:[{name,area?,dimensions?}],
 *                 features:string[], orientation:string|null}.
 * Missing rooms remain []; a 'Rooms: Not supplied' fact explains the fallback.
 * timeline returns only supplied {label,date,status} strings (missing values blank).
 */
(() => {
  'use strict';

  const EMPTY = '—';
  const HIDDEN = 'On request';
  const list = value => Array.isArray(value) ? value : [];
  const number = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value)) ? Number(value) : null;
  const text = value => value == null || (typeof value === 'number' && !Number.isFinite(value)) ? EMPTY : Array.isArray(value) ? value.map(text).join(', ') || EMPTY : typeof value === 'object' ? EMPTY : String(value);
  const money = value => number(value) === null ? EMPTY : '€' + Math.round(number(value)).toLocaleString('en-GB');
  const area = value => number(value) === null ? EMPTY : number(value) + ' m²';
  const ratio = (a, b) => number(a) === null || number(b) === null || number(b) <= 0 ? null : number(number(a) / number(b));
  const units = () => typeof UNITS === 'undefined' ? [] : UNITS;
  const devs = () => typeof DEVS === 'undefined' ? [] : DEVS;
  const unit = id => units().find(u => u.id === id);
  const dev = id => devs().find(d => d.id === id || d.name === id);
  const descriptors = () => typeof CMP_ROWS === 'undefined' ? [] : CMP_ROWS;
  const layouts = () => typeof CR_LAYOUTS === 'undefined' ? [] : CR_LAYOUTS;
  const styles = () => typeof CR_STYLES === 'undefined' ? [] : CR_STYLES;
  const packs = () => typeof CR_PACKS === 'undefined' ? [] : CR_PACKS;
  const pricingKeys = new Set(['base', 'psqm', 'psqmVsAvg', 'yield', 'plan']);
  const aliases = {general:'all', investment:'investor', first_home:'firsthome', second_home:'secondhome'};

  function lensFor(id = 'general') {
    const all = typeof CMP_LENSES === 'undefined' ? [] : CMP_LENSES;
    return all.find(l => l.k === (aliases[id] || id)) || all[0] || {k:'all', order:['pricing','unit','dev','location'], hi:[]};
  }
  function groupName(key) {
    return (typeof CMP_GROUPS !== 'undefined' && CMP_GROUPS[key]) || key;
  }
  function stats(devId) {
    const d = dev(devId);
    const registered = d ? units().filter(u => u.dev === d.name) : [];
    const stock = registered.filter(u => u.status !== 'sold');
    const prices = stock.map(u => number(u.price)).filter(n => n !== null);
    const ratios = stock.map(u => ratio(u.price, u.sqm)).filter(n => n !== null);
    const total = number(d?.attributes?.total_units);
    const sum = ratios.reduce((n, value) => n + value, 0);
    // Preserve Compare's exact arithmetic for ordinary data; avoid sum overflow.
    const average = ratios.length ? (Number.isFinite(sum) ? sum / ratios.length : ratios.reduce((n, value) => n + value / ratios.length, 0)) : null;
    return {
      registered:registered.length,
      available:registered.filter(u => u.status === 'available').length,
      total:total !== null && Number.isInteger(total) && total >= 0 ? total : null,
      from:prices.length ? Math.min(...prices) : null,
      avgPsqm:number(average)
    };
  }
  function configuredPrice(u, config, priceFor) {
    if (!u) return null;
    return number(typeof priceFor === 'function' ? priceFor(u, config) : u.price);
  }
  function unitNumeric(key, u, config, {priceFor, pricesHidden = false} = {}) {
    if (!u || (pricesHidden && pricingKeys.has(key))) return null;
    if (key === 'base') return configuredPrice(u, config, priceFor);
    if (key === 'psqm') return ratio(configuredPrice(u, config, priceFor), u.sqm);
    if (key === 'psqmVsAvg') {
      const relative = ratio(unitNumeric('psqm', u, config, {priceFor}), stats(u.dev).avgPsqm);
      return relative === null ? null : number((relative - 1) * 100);
    }
    if (key === 'yield') {
      const rent = typeof CMP_RENT_PSQM === 'undefined' ? null : number(CMP_RENT_PSQM[u.dev]);
      const sqm = number(u.sqm);
      return sqm === null ? null : ratio((rent ?? 16) * sqm * 12, configuredPrice(u, config, priceFor));
    }
    if (key === 'left') return stats(u.dev).available;
    if (key === 'devsize') return stats(u.dev).registered;
    if (key === 'outdoor') return number(u.ext);
    return number(u[key]);
  }
  function payment(u) {
    if (u?.ready == null) return EMPTY;
    return (u.ready === 'Ready' ? '10% reservation · 90% on deed' : '20% res · 20% on POS · 60% on deed') + ' (demo)';
  }
  function distances(d) {
    return list(d?.dist).map(pair => list(pair).map(text).join(' — ')).filter(Boolean).join(' · ') || EMPTY;
  }
  function amenities(d) {
    return [...new Set([...list(d?.amen).filter(a => typeof a === 'string'), ...Object.keys(d?.attributes?.amenityAvailability || {})])];
  }
  function amenityValue(d, name) {
    const explicit = d?.attributes?.amenityAvailability?.[name];
    if (explicit === false) return 'Not included';
    return explicit === true || list(d?.amen).includes(name) ? '✓ Included' : '— Not listed';
  }
  function unitValue(key, u, config, options = {}) {
    if (options.pricesHidden && pricingKeys.has(key)) return HIDDEN;
    if (!u) return EMPTY;
    const d = dev(u.dev);
    switch (key) {
      case 'base': case 'psqm': return money(unitNumeric(key, u, config, options));
      case 'psqmVsAvg': {
        const n = unitNumeric(key, u, config, options);
        if (n === null) return EMPTY;
        const rounded = Math.round(n);
        return (rounded > 0 ? '+' : '') + rounded + '% €/m²';
      }
      case 'yield': {
        const n = unitNumeric(key, u, config, options);
        return n === null || number(n * 100) === null ? EMPTY : (n * 100).toFixed(1) + '% p.a. (demo)';
      }
      case 'plan': return payment(u);
      case 'beds': return (u.beds === 0 ? 'Studio' : text(u.beds) + ' bed') + ' · ' + text(u.baths) + ' bath';
      case 'floor': return u.floor === 0 ? 'Ground' : text(u.floor);
      case 'sqm': return area(u.sqm);
      case 'outdoor': return area(u.ext);
      case 'status': return text((typeof UN_STATUS !== 'undefined' && UN_STATUS[u.status]?.l) || u.status);
      case 'delivery': return text(d?.completion);
      case 'amen': return amenities(d).map(a => a + ': ' + amenityValue(d, a)).join(' · ') || EMPTY;
      case 'left': { const n = stats(u.dev).available; return n + ' unit' + (n === 1 ? '' : 's'); }
      case 'devsize': return stats(u.dev).registered + ' registered units';
      case 'loc': return text(d?.loc);
      case 'around': return distances(d);
      case 'orientation': return text(u.orientation ?? u.presentDetails?.orientation);
      case 'parking': return text(u.parking ?? u.presentDetails?.parking);
      default: return text(u[key]); // Never execute descriptor render functions or their stateful closures.
    }
  }
  function rowLabel(row) {
    return ({base:'Configured price', psqmVsAvg:'vs development average (nonsold stock)', yield:'Est. gross yield (demo)', plan:'Payment plan (demo)', devsize:'Registered stock'})[row.key] || row.label;
  }
  function record(row, values, raw, lens) {
    const result = {key:row.key, group:groupName(row.g), label:rowLabel(row), values:values.map(text), highlight:list(lens.hi).includes(row.key)};
    if (row.best && raw && raw.length > 1 && raw.every(n => number(n) !== null)) {
      const best = row.best === 'min' ? Math.min(...raw) : Math.max(...raw);
      const winners = raw.map((n, i) => n === best ? i : -1).filter(i => i >= 0);
      if (winners.length === 1) result.bestIndex = winners[0];
    }
    return result;
  }
  function amenityRows(developments) {
    const union = [...new Set(developments.flatMap(amenities))];
    return union.map(name => ({key:'amenity:' + name, group:'Amenities', label:name, values:developments.map(d => amenityValue(d, name)), highlight:false}));
  }
  function finishRows(rows, diffOnly) {
    return diffOnly ? rows.filter(r => new Set(r.values).size > 1) : rows;
  }
  function orderedRows(rows, lens) {
    const order = [...new Set([...list(lens.order), ...rows.map(r => r.g)])];
    return order.flatMap(g => rows.filter(r => r.g === g && (!r.lens || r.lens.includes(lens.k))));
  }
  function unitRows(items, {lens = 'general', pricesHidden = false, priceFor, diffOnly = false} = {}) {
    const columns = list(items).map(i => ({u:unit(typeof i === 'string' ? i : i?.unit_id ?? i?.unitId ?? i?.id), config:typeof i === 'object' ? i?.config : undefined}));
    if (!columns.length) return [];
    const perspective = lensFor(lens);
    const multiDev = new Set(columns.map(c => c.u?.dev).filter(Boolean)).size > 1;
    const source = descriptors().filter(r => r.key !== 'amen' && (!r.multiDev || multiDev)).slice();
    for (const [key, label] of [['orientation','Orientation'], ['parking','Parking']]) {
      if (!source.some(r => r.key === key)) source.push({key, label, g:'unit'});
    }
    const rows = orderedRows(source, perspective).map(r => record(r,
      columns.map(c => unitValue(r.key, c.u, c.config, {priceFor, pricesHidden})),
      columns.map(c => unitNumeric(r.key, c.u, c.config, {priceFor, pricesHidden})), perspective));
    return finishRows([...rows, ...amenityRows(columns.map(c => dev(c.u?.dev)))], diffOnly);
  }

  function devRows(devIds, {lens = 'general', pricesHidden = false, diffOnly = false} = {}) {
    const ds = list(devIds).map(dev);
    if (!ds.length) return [];
    const perspective = lensFor(lens);
    const source = descriptors().filter(r => ['base','psqm','yield','plan','delivery','left','devsize','loc','around'].includes(r.key))
      .map(r => ({...r, label:({base:'From · nonsold registered stock', psqm:'Average €/m² · nonsold registered stock', devsize:'Registered stock'})[r.key] || rowLabel(r)}));
    const extra = [
      ['total','dev','Total development units'], ['demand','dev','Rental demand'],
      ['management','dev','Management service'], ['schools','location','Schools'],
      ['transport','location','Transport'], ['coast','location','Distance to coast']
    ];
    source.push(...extra.map(([key,g,label]) => ({key,g,label})));
    function value(key, d) {
      if (pricesHidden && pricingKeys.has(key)) return HIDDEN;
      if (!d) return EMPTY;
      const s = stats(d.id), a = d.attributes || {};
      switch (key) {
        case 'base': return money(s.from);
        case 'psqm': return money(s.avgPsqm);
        case 'yield': return a.yield_estimate == null ? EMPTY : text(a.yield_estimate) + ' (demo)';
        case 'plan': return a.payment_plan == null ? EMPTY : text(a.payment_plan) + ' (demo)';
        case 'delivery': return text(d.completion);
        case 'left': return text(s.available);
        case 'devsize': return text(s.registered);
        case 'total': return text(s.total);
        case 'loc': return text(d.loc);
        case 'around': return distances(d);
        default: return text(a[({demand:'rental_demand',coast:'coast_distance'})[key] || key]);
      }
    }
    const rows = orderedRows(source, perspective).map(r => {
      const out = record(r, ds.map(d => value(r.key, d)), null, perspective);
      out.label = r.label; // development-specific stock/price labels, not unit labels
      return out;
    });
    return finishRows([...rows, ...amenityRows(ds)], diffOnly);
  }

  function marketInterest(uid, oppId, contactId) {
    if (!unit(uid)) return 0;
    const opportunities = typeof OPPS === 'undefined' ? [] : OPPS;
    const contacts = typeof CONTACTS === 'undefined' ? [] : CONTACTS;
    const current = opportunities.find(o => o.id === oppId);
    const ids = new Set([oppId].filter(Boolean));
    const buyerContacts = contacts.filter(c => c.id === contactId ||
      ((!c.type || ['buyer','lead'].includes(c.type)) && (list(c.oppIds).includes(oppId) || (current?.lead && c.name === current.lead))));
    const contactIds = new Set([contactId, current?.contact_id, current?.contactId, ...buyerContacts.map(c => c.id)].filter(Boolean));
    contacts.filter(c => contactIds.has(c.id)).forEach(c => list(c.oppIds).forEach(id => ids.add(id)));
    const names = new Set([current?.lead, ...buyerContacts.map(c => c.name)].filter(Boolean));
    const active = opportunities.filter(o => !['closed won','closed lost','lost'].includes(String(o.stage || '').trim().toLowerCase()) &&
      !ids.has(o.id) && !names.has(o.lead) && !contactIds.has(o.contact_id) && !contactIds.has(o.contactId) && list(o.units).includes(uid));
    return new Set(active.map(o => o.id)).size;
  }

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim() || /[\u0000-\u0020\\]/.test(value)) return null;
    if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^https?:/i.test(value)) return null;
    return value;
  }
  function originalUrl(value) {
    const url = safeUrl(value);
    if (!url) return null;
    return /^(?:https?:|\/)/i.test(url) ? url : (typeof UN_ASSET === 'undefined' ? '' : UN_ASSET) + url;
  }
  function variantKey(a) {
    return JSON.stringify([a.url, a.development_id, a.unit_id, a.typology, a.layout, a.preset, a.pack ?? a.finish, a.style, a.variant ?? a.variant_id]);
  }
  function dedupe(records) {
    const seen = new Set();
    return records.filter(r => { const key = r.key; if (seen.has(key)) return false; seen.add(key); return true; });
  }
  function shot(a, provenance, url = safeUrl(a.url)) {
    if (!url) return null;
    const result = {key:variantKey({...a,url}), url, caption:text(a.caption ?? a.cap ?? a.room ?? 'Image'), provenance, plan:false};
    for (const k of ['room','style','layout','preset']) if (a[k] != null) result[k] = text(a[k]);
    return result;
  }
  function kindMatches(a, kind) {
    if (!kind || kind === 'all') return true;
    const target = ({ext:'exterior',int:'interior',interiors:'interior',photos:'photo'})[kind] || kind;
    return a.kind === target || (target === 'lifestyle' && a.kind === 'photo' && a.tag === 'Lifestyle') ||
      (target === 'location' && a.kind === 'photo' && a.tag === 'Location');
  }
  function projectGallery(devId, {kind, preferences = {}} = {}) {
    const d = dev(devId);
    if (!d) return [];
    const prefs = preferences || {};
    const approved = list(window.PM_PROJECT_ASSETS).filter(a => a?.approved === true && a.development_id === d.id && kindMatches(a, kind) &&
      (!prefs.style || a.style === prefs.style) && (!prefs.finish || (a.finish ?? a.pack) === prefs.finish) &&
      (!prefs.pack || (a.pack ?? a.finish) === prefs.pack) && (!prefs.layout || a.layout === prefs.layout) && (!prefs.preset || a.preset === prefs.preset))
      .map(a => shot(a, 'Approved project imagery · not a unit specification')).filter(Boolean);
    const originals = [
      ...list(d.media?.renders?.ext).map(a => ({...a,kind:'exterior'})),
      ...list(d.media?.renders?.int).map(a => ({...a,kind:'interior'})),
      ...list(d.media?.photos).map(a => ({...a,kind:'photo'}))
    ];
    if (d.photo && !originals.some(a => a.img === d.photo)) originals.push({img:d.photo,cap:d.name,kind:'exterior'});
    const fallback = Object.values(prefs).some(Boolean) && !approved.length ? 'Preferred project visual unavailable · ' : '';
    const originalShots = originals.filter(a => kindMatches(a, kind)).map(a => shot({...a,development_id:d.id,variant:'original'},
      fallback + 'Original project imagery · not a configured unit visual', originalUrl(a.img ?? a.url))).filter(Boolean);
    return dedupe([...approved, ...originalShots]);
  }

  function configFor(c = {}) {
    const layout = c.layout ?? layouts().find(l => l.isDefault)?.id ?? 'architect';
    return {layout, preset:c.preset ?? list(layouts().find(l => l.id === layout)?.presets)[0]?.id ?? 'std', pack:c.pack ?? packs().find(p => p.isDefault)?.id ?? 'signature'};
  }
  function layoutOptions(config) {
    return layouts().flatMap(l => {
      const preferred = l.id === config.layout ? config.preset : list(l.presets)[0]?.id;
      return list(l.presets).map(p => ({id:p.id === preferred ? l.id : l.id + ':' + p.id,
        name:l.name + ' · ' + p.name, layout:l.id, preset:p.id}));
    });
  }
  function unitGallery(item, {layout:requestedLayout, style:requestedStyle} = {}) {
    const u = unit(item?.unit_id ?? item?.unitId ?? item?.id);
    if (!u) return {items:[],layouts:[],styles:[],layout:null,style:null};
    const d = dev(u.dev), c = configFor(item?.config);
    const typology = typeof crTypologyKey === 'function' ? crTypologyKey(u) : u.typology;
    const choices = layoutOptions(c);
    const pack = packs().find(p => p.id === c.pack);
    const candidates = list(window.PM_ASSETS).filter(a => a?.approved === true && safeUrl(a.url) && a.development_id === d?.id &&
      (a.unit_id === u.id || (!a.unit_id && typology != null && a.typology === typology)) && a.pack === c.pack &&
      choices.some(l => l.layout === a.layout && l.preset === a.preset) && styles().some(s => s.id === a.style) &&
      (!pack?.styles || pack.styles.includes(a.style)));
    const availableFor = l => candidates.filter(a => a.layout === l?.layout && a.preset === l?.preset);
    const wanted = requestedLayout ?? c.layout;
    const wantedChoice = choices.find(l => l.id === wanted);
    const preferredStyle = requestedStyle ?? (item?.visual_preference?.style || item?.style || item?.config?.style);
    let chosen = wantedChoice && availableFor(wantedChoice).length ? wantedChoice : null;
    if (!chosen) chosen = choices.find(l => availableFor(l).some(a => a.style === preferredStyle)) || choices.find(l => availableFor(l).length) || null;
    const matchingLayout = availableFor(chosen);
    const preferredMatch = matchingLayout.some(a => a.style === preferredStyle);
    const style = preferredMatch ? preferredStyle : styles().find(s => matchingLayout.some(a => a.style === s.id))?.id ?? null;
    const messages = [];
    if (chosen && chosen.id !== wanted) messages.push('Requested layout/preset unavailable · showing approved alternative');
    if (preferredStyle && !preferredMatch && style) messages.push('Requested style unavailable · showing ' + (styles().find(s => s.id === style)?.name || style));
    if (item?.visual_preference?.finish && item.visual_preference.finish !== c.pack) messages.push('Visual finish preference differs · saved finish pack retained');
    const variantLabel = chosen ? [chosen.name, pack?.name || c.pack, styles().find(s => s.id === style)?.name || style].filter(Boolean).join(' · ') : '';
    const preview = chosen && (chosen.layout !== c.layout || chosen.preset !== c.preset);
    const provenance = [...messages, preview ? 'Alternative layout preview · saved specification unchanged' : 'Saved specification unchanged', variantLabel].filter(Boolean).join(' · ');
    let images = matchingLayout.filter(a => a.style === style).map(a => shot(a,
      (a.unit_id ? 'Approved unit visual' : 'Approved typology visual · not unit-specific') + ' · ' + provenance)).filter(Boolean);
    if (!images.length) images = projectGallery(d?.id, {preferences:item?.visual_preference || {}}).map(a => ({...a,
      provenance:'No approved unit visual for the saved finish pack · ' + a.provenance}));
    return {items:dedupe(images),
      layouts:choices.map(l => ({id:l.id,name:l.name,disabled:availableFor(l).length === 0})),
      styles:styles().map(s => ({id:s.id,name:s.name,disabled:!matchingLayout.some(a => a.style === s.id)})),
      layout:chosen?.id ?? null, style};
  }

  function plan(uid, config) {
    const u = unit(uid);
    if (!u) return null;
    const c = configFor(config), d = dev(u.dev);
    // Missing preset means an explicitly layout-wide plan; an explicit preset must match.
    const a = list(window.PM_PLANS).find(p => p?.approved === true && p.unit_id === uid && p.layout === c.layout &&
      (!p.development_id || p.development_id === d?.id) && (p.preset == null || p.preset === c.preset) &&
      (p.pack == null || p.pack === c.pack) && safeUrl(p.url));
    if (a) {
      const result = {key:variantKey(a),url:a.url,caption:text(a.caption ?? a.cap ?? 'Approved unit floor plan'),provenance:'Approved unit floor plan',plan:true};
      const bearing = number(a.northBearing);
      if (bearing !== null) result.northBearing = bearing;
      return result;
    }
    if (typeof unPlanSVG !== 'function') return null;
    return {key:'illustrative:' + uid, html:unPlanSVG(u, 280),caption:'Illustrative plan · not to scale · not an approved layout',
      provenance:'Illustrative unit diagram · no approved plan matches the saved layout · not a specification',plan:true};
  }
  function details(uid) {
    const u = unit(uid);
    if (!u) return {facts:[],rooms:[],features:[],orientation:null};
    const supplied = u.presentDetails || {};
    const orientation = u.orientation ?? supplied.orientation ?? null;
    const facts = [['Unit',u.id],['Type',u.type],['Bedrooms',u.beds],['Bathrooms',u.baths],['Internal area',area(u.sqm)],
      ['Outdoor area',area(u.ext)],['Floor',u.floor === 0 ? 'Ground' : u.floor],['Views',u.views],['Ready',u.ready],
      ['Status',unitValue('status',u)],['Orientation',orientation ?? 'Not supplied'],['Parking',u.parking ?? supplied.parking ?? 'Not supplied']]
      .map(([label,value]) => ({label,value:text(value)}));
    const rooms = list(supplied.rooms).filter(r => r && typeof r.name === 'string' && r.name).map(r => {
      const room = {name:r.name};
      if (number(r.area) !== null) room.area = number(r.area);
      if (r.dimensions != null && text(r.dimensions) !== EMPTY) room.dimensions = text(r.dimensions);
      return room;
    });
    const features = [...new Set([...list(u.features), ...list(supplied.features)].filter(f => typeof f === 'string'))];
    if (!rooms.length) facts.push({label:'Rooms',value:'Not supplied'});
    for (const [key,value] of Object.entries(supplied)) {
      if (['rooms','features','orientation','parking'].includes(key) || value == null || typeof value === 'object' || /price|yield|payment|rent|cost/i.test(key)) continue;
      facts.push({label:key.replace(/[_-]/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,s => s.toUpperCase()),value:text(value)});
    }
    return {facts,rooms,features,orientation:orientation == null ? null : text(orientation)};
  }
  function company() {
    const c = window.PM_COMPANY || {};
    const result = {name:typeof c.name === 'string' && c.name.trim() ? c.name : 'Your development collection'};
    if (safeUrl(c.logoUrl)) result.logoUrl = c.logoUrl;
    if (typeof c.tagline === 'string') result.tagline = c.tagline;
    if (typeof c.accent === 'string') result.accent = c.accent;
    return result;
  }
  function timeline(devId) {
    const d = dev(devId);
    if (!d) return [];
    if (Array.isArray(d.presentTimeline)) return d.presentTimeline.filter(t => t && typeof t === 'object')
      .map(t => ({label:text(t.label ?? ''),date:text(t.date ?? ''),status:text(t.status ?? '')}));
    return d.completion == null ? [] : [{label:'Completion',date:text(d.completion),status:''}];
  }
  function installCompareAdapters(priceFor) {
    let updated = 0;
    for (const row of descriptors()) {
      if (!pricingKeys.has(row.key) && !['devsize','status','amen','around'].includes(row.key)) continue;
      const key = row.key;
      row.label = rowLabel(row);
      row.v = (u, config) => unitValue(key, u, config, {priceFor});
      if (pricingKeys.has(key) && key !== 'plan') row.raw = (u, config) => unitNumeric(key, u, config, {priceFor});
      updated++;
    }
    return updated;
  }

  window.PMData = Object.freeze({unitRows,devRows,unitValue,unitNumeric,stats,marketInterest,projectGallery,unitGallery,plan,details,company,timeline,installCompareAdapters});
})();