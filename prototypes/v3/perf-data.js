// Generated from Claude Design "Bricly Performance" (Management Visibility Flows): Performance scenarios, pipeline brief and roll-up messages.
window.PFD=(function(){

// Bridges a flow document's block scenario (columns of blk(...) objects) onto the approved
// Bricly Opportunity v2 page. Hosts call OppBridge.vals(scenario, { on, prefix }) and spread the result.
const OppBridge = (function () {
  const toneOf = bg => /info/.test(bg || '') ? 'info' : /warning/.test(bg || '') ? 'warn' : /error/.test(bg || '') ? 'err' : /primary-fixed/.test(bg || '') ? 'ok' : /rgb\(25/.test(bg || '') ? 'dark' : '';
  const chipTo = ch => !ch ? null : typeof ch === 'string' ? (ch ? { label: ch, tone: '' } : null) : ch.t ? { label: ch.t, tone: toneOf(ch.bg) } : null;
  const btnTo = b => ({ label: b.t, primary: b.bg === 'rgb(25,25,25)' || b.bg === 'var(--primary)', disabled: b.op != null && b.op < 1 });
  const cellText = c => c == null ? '' : typeof c === 'string' ? c : Array.isArray(c) ? String(c[0]) : (c.t != null ? String(c.t) : c.chip && c.chip.t ? c.chip.t : '');
  function block(b, out) {
    if (!b) return;
    if (b.isCallout) { const tone = toneOf(b.cardBg); const btns = (b.btns || []).map(btnTo); const text = (b.head2 ? b.head2 + '. ' : '') + (b.body || '');
      if (!out.banner) out.banner = { text, tone, action: btns.length ? btns[btns.length - 1].label : '' }; else out.cards.push({ title: b.head2 || '', text: b.body || '', tone, btns }); return; }
    if (b.isText) { out.cards.push({ title: b.title || '', text: b.text || '' }); return; }
    if (b.isKv) { out.cards.push({ title: b.title || '', action: b.right || '', note: b.sub || b.note || '', rows: (b.rows || []).map(v => ({ k: v.k, v: v.v, chip: chipTo(v.hasSrc === false ? null : v.src), note: v.note || '' })), btns: (b.btns || []).map(btnTo) }); return; }
    if (b.isSteps) { out.cards.push({ title: b.title || '', note: b.sub || '', items: (b.items || []).map(s => ({ t: s.t, s: s.sub || '', chip: s.chip && s.chip.t ? s.chip.t : '', tone: s.chip ? toneOf(s.chip.bg) : '' })) }); return; }
    if (b.isList) { if (/^activity$/i.test(b.title || '')) { (b.items || []).forEach(l => out.feed.push({ kind: 'sys', body: l.v ? l.k + ' · ' + l.v : l.k, when: l.r || '' })); return; }
      out.cards.push({ title: b.title || '', note: b.sub || b.note || '', items: (b.items || []).map(l => ({ t: l.k || l.t || '', s: l.v || l.s || '', chip: l.chip && l.chip.t ? l.chip.t : '', tone: l.chip ? toneOf(l.chip.bg) : '', link: l.r || (l.btns && l.btns.length ? l.btns[0].t : '') })), btns: (b.btns || []).map(btnTo) }); return; }
    if (b.isTable) { const head = b.head || []; out.cards.push({ title: b.title || '', note: b.sub || b.note || '', items: (b.rows || []).map(r => { const cs = (r.cells || []).map(cellText); const last = r.cells && r.cells[r.cells.length - 1]; return { t: cs[0] || '', s: cs.slice(1, -1).filter(Boolean).join(' · '), chip: last && last.chip && last.chip.t ? last.chip.t : (cs.length > 1 ? cs[cs.length - 1] : ''), tone: last && last.chip ? toneOf(last.chip.bg) : '' }; }), btns: (b.btns || []).map(btnTo) }); return; }
    if (b.isChips) { out.cards.push({ title: b.title || '', chips: (b.items || []).map(chipTo).filter(Boolean) }); return; }
    if (b.isKpis) { out.cards.push({ title: b.title || '', rows: (b.items || []).map(k => ({ k: k.label, v: k.val + (k.sub ? ' · ' + k.sub : ''), chip: k.hasChip ? chipTo(k.chip) : null })) }); return; }
    if (b.isNotif || b.isSet) { out.cards.push({ title: b.title || '', note: b.sub || '', items: (b.items || []).map(i => ({ t: i.k || i.t || '', s: i.v || i.sub || '' })) }); return; }
    if (b.title || b.text) out.cards.push({ title: b.title || '', text: b.text || b.body || '' });
  }
  function columns(cols) {
    const top = { cards: [], feed: [], banner: null }, side = { cards: [], feed: [], banner: null };
    (cols && cols[0] || []).forEach(b => block(b, top)); (cols && cols[1] || []).forEach(b => block(b, side));
    return { top, side };
  }
  const ini = n => (n || '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  // c: host scenario { title, sub, st, columns, toast, who, btns }
  function vals(c, o) {
    const on = !!(o && o.on);
    const { top, side } = columns(c.columns);
    const st = c.st || null; const stageLabel = st && st.t ? st.t : '';
    return {
      oppV2: on, notOppV2: !on,
      oppV2Sc: /viewing booked|contacted|qualified|interested/i.test(stageLabel) ? 'h2' : /committed|negotiat|offer/i.test(stageLabel) ? 'h3' : 'h1',
      oppRole: c.who === 'mgr' || c.who === 'manager' ? 'manager' : 'rep',
      oppPerson: { name: c.title || '', sub: c.sub || '', ini: ini(c.title), tag: c.tag === undefined ? null : c.tag, tagTone: 'warn', contactRows: c.contactRows || null },
      oppStage: stageLabel, oppChips: (c.flags || []).map(chipTo).filter(Boolean),
      oppBanner: top.banner || side.banner || null, oppTop: top.cards, oppSide: side.cards, oppFeed: top.feed.concat(side.feed),
      oppNext: c.next ? { next: c.next, due: c.due || '' } : null, oppToast: c.toast || null,
    };
  }
  return { vals, columns, block, toneOf, chipTo };
})();

const NS = 'BriclyDesignSystem_5a575a.';
const ic = s => ({ style: { transform: `scale(${s})`, transformOrigin: '0 0' } });
const TONE = { info: ['var(--info-container)', 'var(--on-info-container)'], ok: ['var(--primary-fixed)', 'var(--on-primary-fixed-variant)'], warn: ['var(--warning-container)', 'var(--on-warning-container)'], neu: ['var(--surface-container-high)', 'var(--on-surface-variant)'], dark: ['rgb(25,25,25)', 'rgb(250,249,247)'] };
const chip = (t, tone = 'neu') => ({ t, bg: TONE[tone][0], fg: TONE[tone][1] });
const btn = (a) => { const [t, k] = Array.isArray(a) ? a : [a]; return { t, bg: k === 'p' ? 'var(--primary)' : k === 'd' ? 'rgb(25,25,25)' : 'var(--surface)', fg: k ? 'rgb(255,255,255)' : 'rgb(25,25,25)', bd: k ? 'transparent' : 'var(--outline)' }; };
const MUT = 'var(--on-surface-variant)', INK = 'rgb(25,25,25)';
const bt = i => i ? '1px solid var(--outline-variant)' : 'none';

const BASE = { isKpis: false, isTable: false, isFunnel: false, isBars: false, isCallout: false, isNarr: false, isList: false, isSteps: false, isChat: false, isKv: false, isText: false, isChips: false,
  title: '', sub: '', right: '', items: [], rows: [], head: [], paras: [], msgs: [], cols: '1fr', kcols: 'repeat(4,minmax(0,1fr))', note: '', text: '', body: '', head2: '', foot: '', ph: '', chatH: 'auto', cardBg: 'var(--surface)', cardBd: 'var(--outline)' };
const blk = (type, o = {}) => ({ ...BASE, ['is' + type]: true, ...o, hasHead: !!o.title, hasNote: !!o.note, hasFoot: !!o.foot, btns: (o.btns || []).map(btn), hasBtns: !!(o.btns && o.btns.length && type !== 'Callout') });

const K = (label, val, sub, o = {}) => ({ label, val, sub, hasBar: o.pct != null, w: (o.pct || 0) + '%', hasPace: o.pace != null, pace: (o.pace || 0) + '%', fill: o.tone === 'warn' ? 'var(--warning)' : 'var(--primary)', hasChip: !!o.chip, chip: o.chip || chip('') });
const PB = (name, meta, val, pct, pace, ch) => ({ name, meta, val, w: pct + '%', pace: pace + '%', fill: ch.t === 'Behind pace' ? 'var(--warning)' : 'var(--primary)', chip: ch });
const F = (label, n, of, conv) => ({ label, n: String(n), w: Math.max(1.5, n / of * 100) + '%', fill: 'var(--primary)', conv });
const cell = x => { const [t, o = {}] = Array.isArray(x) ? x : [x]; return { t, s: o.s || '', hasS: !!o.s, fg: o.fg || INK, fw: o.fw || '400', plain: !o.inp && !o.chip, inp: !!o.inp, ibg: o.ibg || 'var(--surface)', ibd: o.ibd || 'var(--outline)', isChip: !!o.chip, chip: o.chip || chip('') }; };
const R = (cells, bg = 'transparent') => ({ cells: cells.map(cell), bg });
const refStyle = sel => sel ? { rbg: 'rgb(25,25,25)', rfg: 'rgb(250,249,247)' } : { rbg: 'var(--surface-container-high)', rfg: INK };
const segs = (str, sel) => str.split(/(\[\d+\])/).filter(Boolean).map(p => { const m = p.match(/^\[(\d+)\]$/); return m ? { t: '', isRef: true, ref: m[1], ...refStyle(m[1] === sel) } : { t: p, isRef: false, ref: '', ...refStyle(false) }; });
const para = (label, str, sel) => ({ label: label || '', hasLabel: !!label, segs: segs(str, sel) });
const L = (k, v, o = {}) => ({ k, v: v || '', hasV: !!v, hasRef: !!o.ref, ref: o.ref || '', ...refStyle(o.sel), hasR: !!o.r, r: o.r || '', bg: o.sel ? 'var(--surface-container-low)' : 'transparent' });
const list = items => items.map((x, i) => ({ ...x, bt: bt(i) }));
const S = (n, t, sub, st) => ({ n: st === 'done' ? '✓' : String(n), t, sub, fw: st === 'now' ? '500' : '400', chip: st === 'done' ? chip('Done', 'ok') : st === 'now' ? chip('In progress', 'info') : chip('Next'),
  nbg: st === 'done' ? 'var(--primary)' : st === 'now' ? 'rgb(25,25,25)' : 'transparent', nfg: st === 'next' ? MUT : 'rgb(255,255,255)', nbd: st === 'next' ? 'var(--outline)' : 'transparent' });
const M = (who, meta, text, o = {}) => ({ meta, text, al: who === 'user' ? 'flex-end' : 'flex-start', bg: who === 'user' ? 'var(--surface-container-low)' : 'var(--surface)', bd: who === 'user' ? 'transparent' : 'var(--outline)',
  hasFile: !!o.file, file: o.file || '', ext: o.ext || '', hasOpts: !!o.opts, opts: o.opts || [], hasCard: !!o.card, card: (o.card || []).map(([k, v], i) => ({ k, v, bt: bt(i) })) });
const V = (k, v, src, note) => ({ k, v, src, hasNote: !!note, note: note || '', bg: note ? 'var(--warning-container)' : 'transparent' });
const kv = rows => rows.map((r, i) => ({ ...r, bt: bt(i) }));
const D = (t, s, ch) => ({ t, s, chip: ch });

const PACE = 61;
const OCT_KPIS = (noT) => noT ? [
  K('Units sold', '6', 'Promise of sale signed', { chip: chip('No target') }),
  K('Sales value', '€2.31M', 'From 6 signed deals', { chip: chip('No target') }),
  K('Units reserved', '4', 'Offer accepted, not yet signed'),
  K('Leads in', '118', 'Median first reply 9 min'),
  K('Viewings', '41 booked · 33 held', '80% held'),
  K('Offers', '14 sent · 8 accepted', '57% accepted'),
  K('Lead to sale', '5.1%', '6 of 118 leads this month'),
  K('Stalled', '11', 'No activity for 14+ days'),
] : [
  K('Units sold', '6 of 12', 'Pace today 7.4', { pct: 50, pace: PACE, tone: 'warn', chip: chip('Behind pace', 'warn') }),
  K('Sales value', '€2.31M of €4.40M', 'Pace today €2.70M', { pct: 52.5, pace: PACE, tone: 'warn', chip: chip('Behind pace', 'warn') }),
  K('Units reserved', '4', 'Offer accepted, not yet signed'),
  K('Leads in', '118', 'Median first reply 9 min'),
  K('Viewings', '41 booked · 33 held', '80% held'),
  K('Offers', '14 sent · 8 accepted', '57% accepted'),
  K('Lead to sale', '5.1%', '6 of 118 leads this month'),
  K('Stalled', '11', 'No activity for 14+ days'),
];
const FUNNEL = [F('Leads', 118, 118, ''), F('Qualified', 64, 118, '54% of leads'), F('Appointment held', 33, 118, '52% of qualified'), F('Offer sent', 14, 118, '42% of appointments'), F('Offer accepted', 8, 118, '57% of offers'), F('Sold', 6, 118, '75% of accepted')];
const PROJ_BARS = [
  PB('Onyx Rise', '40 units · selling since Mar', '3 of 5 · €1.24M of €2.10M', 60, PACE, chip('On pace', 'ok')),
  PB('Mercury', '32 units · selling since Jan', '3 of 4 · €1.07M of €1.40M', 75, PACE, chip('Ahead of pace', 'ok')),
  PB('Verdala', '28 units · selling since Sep', '0 of 3 · €0 of €0.90M', 0, PACE, chip('Behind pace', 'warn')),
];
const STALLED = blk('Table', { title: 'Stalled opportunities', sub: 'No message, meeting or task in 14 days', right: '11', cols: 'minmax(0,1fr) 90px 60px',
  head: ['Opportunity', 'Stage', 'Quiet'],
  rows: [R([['Joseph Azzopardi', { s: 'Verdala · Kurt' }], 'Appointment held', '21 days']), R([['Claire Galea', { s: 'Onyx Rise · Sam' }], 'Qualified', '18 days']), R([['Mario Debono', { s: 'Verdala · Kurt' }], 'Appointment held', '16 days']), R([['Anna Caruana', { s: 'Mercury · Elena' }], 'Qualified', '15 days']), R([['Paul Borg', { s: 'Verdala · Kurt' }], 'Qualified', '14 days'])],
  note: '6 more · open the full list' });
const ROLLUP_MINI = blk('List', { title: 'Weekly roll-up', sub: '12–18 Oct · sent Mon 08:00', items: list([L('2 units sold this week for €813,000.', 'October is at 6 of 12 units, behind the pace of 7.4. Verdala has no offers yet.'), L('Open the full roll-up', '9 sources · also sent on WhatsApp and email')]) });

const HDR = { all: ['Business', 'Team', 'Weekly roll-up', 'Targets'] };
const tabs = (arr, on) => arr.map(t => ({ t, fg: t === on ? INK : MUT, bd: t === on ? INK : 'transparent' }));

const NARR_PARAS = sel => [
  para('Onyx Rise', 'Onyx Rise sold #CM9810 for €468,000[1] and is at 3 of its 5-unit target[2]. Maria Borg’s offer on #CM9708 was accepted on Thu 15 Oct and is waiting on her bank[3].', sel),
  para('Mercury', 'Mercury sold #CM2702 to Daniel Vella for €345,000[4], reaching 3 of 4 units. One more sale meets October’s target with 12 days to go[2].', sel),
  para('Verdala', 'Verdala has no sales in October against a target of 3[2]. The show apartment opened on Wed 14 Oct[5]; 3 of the month’s 4 appointments were held after that[6]. No offers have been sent. The completion date was raised in 5 of 9 Verdala conversations this month[7].', sel),
  para('Pipeline', '11 opportunities have had no message, meeting or task for 14 days or more, up from 8 last week[8]. 5 of them are on Verdala.', sel),
  para('Leads', '31 new leads this week, 118 this month. Median first reply was 9 minutes[9].', sel),
];
const SOURCES = sel => list([
  L('Deal · #CM9810', 'Promise of sale signed Tue 13 Oct · €468,000', { ref: '1', sel: sel === '1' }),
  L('Targets · October', 'Entered by Mark Grech, Wed 30 Sep', { ref: '2', sel: sel === '2' }),
  L('Opportunity · OPP-1008 Maria Borg', 'Offer accepted Thu 15 Oct', { ref: '3', sel: sel === '3' }),
  L('Deal · #CM2702', 'Promise of sale signed Fri 16 Oct · €345,000', { ref: '4', sel: sel === '4' }),
  L('Development · Verdala', 'Show apartment opened Wed 14 Oct', { ref: '5', sel: sel === '5' }),
  L('Calendar · Verdala appointments', '4 held in October: 6, 15, 16, 17 Oct', { ref: '6', sel: sel === '6' }),
  L('Objections · Verdala · completion date', '5 of 9 conversations · from appointments and WhatsApp', { ref: '7', sel: sel === '7' }),
  L('Stalled opportunities', 'Rolled up Mon 19 Oct, 06:00 · 11 now, 8 a week ago', { ref: '8', sel: sel === '8' }),
  L('WhatsApp · first replies', '118 conversations · working hours 08:00–19:00', { ref: '9', sel: sel === '9' }),
]);

const SCN = {
  '1a': { who: 'dev', nav: 'Developments', crumbs: ['Developments', 'Saline Gardens', 'Launch brief'], title: 'Launch consultation', st: chip('Section 4 of 6', 'info'),
    sub: 'Saline Gardens · with the Bricly consultant · follows the Bricly launch SOP · Lara Vella, your launch lead, reviews the brief', btns: ['Pause', 'View brief so far'], cols: 'minmax(0,1fr) 400px',
    columns: [[blk('Chat', { chatH: '640px', ph: 'Reply, or attach a file', msgs: [
      M('agent', 'Bricly consultant · 14:06', 'Pricing and release. You said 48 units across two blocks. Will both blocks go on sale at launch, or Block A first?'),
      M('user', 'Mark Grech · 14:08', 'Block A first, 24 units. Block B in spring once A is 60% sold.'),
      M('agent', 'Bricly consultant · 14:08', 'Noted. Block A: 24 units at launch. Block B goes on sale when 15 Block A units are sold. Do you have a price list for Block A?'),
      M('user', 'Mark Grech · 14:11', 'Here it is.', { file: 'Saline_BlockA_prices.xlsx', ext: 'XLS' }),
      M('agent', 'Bricly consultant · 14:12', 'I read 24 units from the price list. 22 are priced:', { card: [['Range', '€265,000 to €520,000'], ['Total', '€8.94M'], ['No price', 'A-0.1 and A-0.2, ground-floor commercial']] }),
      M('agent', 'Bricly consultant · 14:12', 'Are A-0.1 and A-0.2 for sale?', { opts: ['Not for sale', 'Price them later', 'Add prices now'] }),
    ] })],
    [blk('Steps', { title: 'Launch brief', sub: 'Bricly launch SOP', right: '3 of 6 done', items: [
      S(1, 'Project basics', 'Salina · 48 units in 2 blocks · completion Q4 2028', 'done'),
      S(2, 'Buyers', 'Local first-time buyers and upgraders · 2-beds most asked for', 'done'),
      S(3, 'Sales team', 'Rachel Mifsud manages · Elena Spiteri and Sam Zammit sell', 'done'),
      S(4, 'Pricing and release', 'Block A at launch · price list read', 'now'),
      S(5, 'Targets', 'Monthly units and value from launch', 'next'),
      S(6, 'Launch assets', 'Renders, floor plans and pages per buyer', 'next'),
    ] }), blk('Text', { text: 'Every answer is saved with where it came from: this conversation, or a file you sent. Nothing goes live until you approve the brief.' })]] },

  '1b': { who: 'dev', nav: 'Developments', crumbs: ['Developments', 'Saline Gardens', 'Launch brief'], title: 'Saline Gardens · launch brief', st: chip('Ready for your approval', 'warn'),
    sub: 'Built from the consultation on Mon 28 Sep and 3 files · reviewed by Lara Vella, launch lead, Tue 29 Sep', btns: ['Download PDF', ['Approve brief', 'p']], cols: 'minmax(0,1fr) 380px',
    columns: [[
      blk('Kv', { title: 'Project and buyers', rows: kv([V('Location', 'Triq il-Melħ, Salina', 'Consultation 13:42'), V('Units', '48 in two blocks · 24 per block', 'Permit PDF'), V('Completion', 'Q4 2028 · shell by Q1 2028', 'Construction programme'), V('Buyers', 'Local first-time buyers and upgraders. 2-beds are the most asked for.', 'Consultation 13:51')]) }),
      blk('Kv', { title: 'Pricing and release', rows: kv([V('Release', 'Block A at launch, Mon 2 Nov. Block B when 15 Block A units are sold.', 'Consultation 14:08'), V('Prices', '22 units priced, €265,000 to €520,000 · €8.94M total', 'Price list'), V('Not for sale', 'A-0.1 and A-0.2, ground-floor commercial', 'Consultation 14:13')]) }),
      blk('Kv', { title: 'Proposed targets', sub: 'Sent to Targets as a draft when you approve', rows: kv([V('November', '3 units · €1.10M', 'Consultation 14:21'), V('December', '4 units · €1.50M', 'Consultation 14:21', 'Changed by Lara: was 6 units. Launch-month sales at Onyx Rise were 4.'), V('January', '4 units · €1.55M', 'Consultation 14:21')]) }),
    ], [
      blk('List', { title: 'Launch lead review', sub: 'Lara Vella · Tue 29 Sep', items: list([L('1 change', 'December target lowered from 6 to 4 units, with the reason.'), L('1 question answered', 'Commercial units confirmed as not for sale.'), L('Nothing missing', 'All 6 SOP sections are complete.')]), btns: [['Approve brief', 'p'], 'Ask for changes'] }),
      blk('Text', { text: 'Approving starts the launch setup: unit records from the price list, the sales team, and draft targets for November to January.' }),
    ]] },

  '2a': { who: 'dev', nav: 'Performance', crumbs: ['Performance', 'Business'], title: 'Performance', tabsOn: 'Business', btns: ['October ⌄', 'All projects ⌄'],
    sub: 'All projects · October to date, 1–19 Oct · rolled up today at 06:00 from WhatsApp, the calendar and deal records', cols: 'minmax(0,1fr) 380px',
    columns: [[
      blk('Callout', { cardBg: 'var(--warning-container)', cardBd: 'transparent', head2: 'No targets for October yet', body: 'Bricly shows what happened, but can’t say whether a project is on track. Add monthly units and value for each project.', btns: [['Add targets', 'd'], 'Start from a launch brief'] }),
      blk('Kpis', { items: OCT_KPIS(true) }),
      blk('Table', { title: 'Projects', sub: 'October to date', cols: 'minmax(0,1fr) 110px 110px 110px', head: ['Project', 'Sold', 'Value', 'Target'],
        rows: [R(['Onyx Rise', '3', '€1.24M', ['Not set', { fg: MUT }]]), R(['Mercury', '3', '€1.07M', ['Not set', { fg: MUT }]]), R(['Verdala', '0', '€0', ['Not set', { fg: MUT }]])] }),
    ], [blk('Funnel', { title: 'Lead to sale', sub: 'October to date', items: FUNNEL }), STALLED]] },

  '2b': { who: 'dev', nav: 'Performance', crumbs: ['Performance', 'Targets'], title: 'Performance', tabsOn: 'Targets', btns: ['Discard', ['Save targets', 'p']],
    sub: 'Monthly targets per project: units sold and sales value. The dashboard and weekly roll-up compare against these.', cols: 'minmax(0,1fr) 340px',
    columns: [[
      blk('Table', { title: 'Targets', sub: 'Units sold · sales value', right: 'October to December', cols: '150px repeat(6,minmax(0,1fr)) 150px',
        head: ['Project', 'Oct units', 'Oct value', 'Nov units', 'Nov value', 'Dec units', 'Dec value', 'Source'],
        rows: [
          R(['Onyx Rise', ['5', { inp: 1 }], ['€2,100,000', { inp: 1 }], ['5', { inp: 1 }], ['€2,100,000', { inp: 1 }], ['4', { inp: 1 }], ['€1,700,000', { inp: 1 }], ['Mark Grech', { s: 'Wed 30 Sep' }]]),
          R(['Mercury', ['4', { inp: 1 }], ['€1,400,000', { inp: 1 }], ['4', { inp: 1 }], ['€1,400,000', { inp: 1 }], ['3', { inp: 1 }], ['€1,050,000', { inp: 1 }], ['Mark Grech', { s: 'Wed 30 Sep' }]]),
          R(['Verdala', ['3', { inp: 1 }], ['€900,000', { inp: 1 }], ['3', { inp: 1 }], ['€900,000', { inp: 1 }], ['3', { inp: 1 }], ['€900,000', { inp: 1 }], ['Mark Grech', { s: 'Wed 30 Sep' }]]),
          R([['Saline Gardens', { s: 'Launches Mon 2 Nov' }], ['–', { fg: MUT }], ['–', { fg: MUT }], ['3', { inp: 1, ibg: 'var(--warning-container)', ibd: 'var(--warning)' }], ['€1,100,000', { inp: 1, ibg: 'var(--warning-container)', ibd: 'var(--warning)' }], ['4', { inp: 1, ibg: 'var(--warning-container)', ibd: 'var(--warning)' }], ['€1,500,000', { inp: 1, ibg: 'var(--warning-container)', ibd: 'var(--warning)' }], ['', { chip: chip('Draft from launch brief', 'warn') }]]),
          R([['Total', { fw: '500' }], ['12', { fw: '500' }], ['€4.40M', { fw: '500' }], ['15', { fw: '500' }], ['€5.50M', { fw: '500' }], ['14', { fw: '500' }], ['€5.15M', { fw: '500' }], ''], 'var(--surface-container-low)'),
        ], note: 'Saline Gardens targets came from the approved launch brief. They count once you save.' }),
    ], [
      blk('List', { title: 'How targets are used', items: list([L('Dashboard', 'Each month to date is compared against a straight-line pace. Day 19 of 31 is 61% of the month.'), L('Weekly roll-up', 'Every Monday at 08:00, against the month’s target.'), L('Who sees them', 'Mark and Rachel see all projects. Reps see the projects they sell.')]) }),
    ]] },

  '3a': { who: 'dev', nav: 'Performance', crumbs: ['Performance', 'Business'], title: 'Performance', tabsOn: 'Business', btns: ['October ⌄', 'All projects ⌄'],
    sub: 'All projects · October to date, 1–19 Oct, day 19 of 31 · rolled up today at 06:00 from WhatsApp, the calendar and deal records', cols: 'minmax(0,1fr) 380px',
    columns: [[
      blk('Kpis', { items: OCT_KPIS(false) }),
      blk('Bars', { title: 'Projects against target', sub: 'Units sold · the line marks today’s pace', items: PROJ_BARS.map((p, i) => ({ ...p, bt: bt(i) })) }),
      blk('Funnel', { title: 'Lead to sale', sub: 'October to date · all projects', items: FUNNEL }),
    ], [ROLLUP_MINI, STALLED]] },

  '3b': { who: 'dev', nav: 'Performance', crumbs: ['Performance', 'Business', 'Verdala'], title: 'Verdala', st: chip('Behind pace', 'warn'), tabsOn: 'Business', btns: ['October ⌄', 'Brief me on Verdala'],
    sub: '28 units · selling since Mon 7 Sep · October to date, 1–19 Oct', cols: 'minmax(0,1fr) 380px',
    columns: [[
      blk('Kpis', { items: [K('Units sold', '0 of 3', 'Pace today 1.8', { pct: 0, pace: PACE, tone: 'warn', chip: chip('Behind pace', 'warn') }), K('Sales value', '€0 of €0.90M', 'Pace today €0.55M', { pct: 0, pace: PACE, tone: 'warn' }), K('Viewings', '9 booked · 4 held', '3 since the show apartment opened'), K('Offers', '0 sent', 'None this month')] }),
      blk('Funnel', { title: 'Lead to sale', sub: 'Verdala · October to date', items: [F('Leads', 29, 29, ''), F('Qualified', 15, 29, '52% of leads'), F('Appointment held', 4, 29, '27% of qualified'), F('Offer sent', 0, 29, 'none yet'), F('Sold', 0, 29, '')] }),
      blk('Table', { title: 'Stalled on Verdala', sub: 'No message, meeting or task in 14 days', right: '5', cols: 'minmax(0,1fr) 120px 100px 90px', head: ['Opportunity', 'Stage', 'Owner', 'Quiet'],
        rows: [R(['Joseph Azzopardi', 'Appointment held', 'Kurt Attard', '21 days']), R(['Mario Debono', 'Appointment held', 'Kurt Attard', '16 days']), R(['Paul Borg', 'Qualified', 'Kurt Attard', '14 days'])], note: '2 more' }),
    ], [
      blk('List', { title: 'Most raised in Verdala conversations', sub: 'From 9 appointments and 41 messages', items: list([L('Completion date', 'Buyers ask whether Q2 2028 will hold', { r: '5' }), L('Parking', 'Not included in the price list', { r: '3' }), L('Price per m²', 'Compared with Onyx Rise', { r: '2' })]) }),
      blk('List', { title: 'This month', items: list([L('Show apartment opened', 'Wed 14 Oct · development record'), L('Price list updated', 'Thu 1 Oct · 3 units reduced by €10,000')]) }),
    ]] },

  '4a': { who: 'mgr', nav: 'Performance', crumbs: ['Performance', 'Team'], title: 'Performance', tabsOn: 'Team', btns: ['October ⌄', 'All projects ⌄'],
    sub: '4 reps · October to date, 1–19 Oct · facts from WhatsApp, the calendar and deal records · sorted by name', cols: 'minmax(0,1fr) 340px',
    columns: [[
      blk('Table', { title: 'Team', sub: 'October to date', cols: 'minmax(0,1.4fr) repeat(7,minmax(0,1fr))', head: ['Rep', 'Leads', 'First reply', 'Appointments held', 'Offers sent', 'Accepted', 'Sold', 'Stalled'],
        rows: [
          R([['Elena Spiteri', { s: 'Mercury, Onyx Rise' }], '28', '7 min', '9', '4', '2', '2', '2']),
          R([['Kurt Attard', { s: 'Verdala, Mercury' }], '31', '14 min', '7', '3', '2', '1', '5']),
          R([['Nicole Farrugia', { s: 'Onyx Rise' }], '26', '6 min', '8', '4', '2', '2', '1']),
          R([['Sam Zammit', { s: 'Mercury, Onyx Rise' }], '33', '9 min', '9', '3', '2', '1', '3']),
          R([['Team', { fw: '500' }], ['118', { fw: '500' }], ['9 min', { fw: '500' }], ['33', { fw: '500' }], ['14', { fw: '500' }], ['8', { fw: '500' }], ['6', { fw: '500' }], ['11', { fw: '500' }]], 'var(--surface-container-low)'),
        ], note: 'No ranking in v1. Targets are per project, so there’s no target per rep.' }),
      blk('Bars', { title: 'Projects against target', sub: 'Units sold · the line marks today’s pace', items: PROJ_BARS.map((p, i) => ({ ...p, bt: bt(i) })) }),
    ], [
      blk('List', { title: 'How this is measured', items: list([L('No one reports on themselves', 'Activity comes from WhatsApp conversations, the calendar and deal records.'), L('First reply', 'Median time from a new lead’s first message to the rep’s first reply, 08:00–19:00.'), L('Stalled', 'An open opportunity with no message, meeting or task in 14 days.'), L('Who sees this', 'You and Mark. Each rep sees only their own row.')]) }),
    ]] },

  '4b': { who: 'rep', nav: 'Performance', crumbs: ['Performance', 'Mine'], title: 'My performance', tabsOn: 'Mine', tabList: ['Mine', 'Weekly roll-up'], btns: ['October ⌄'],
    sub: 'October to date, 1–19 Oct · only you and Rachel see this', cols: 'minmax(0,1fr) 380px',
    columns: [[
      blk('Kpis', { items: [K('Leads', '33', 'Median first reply 9 min'), K('Viewings', '11 booked · 9 held', '82% held'), K('Offers', '3 sent · 2 accepted', 'Maria Borg, Daniel Vella'), K('Sold', '1', '#CM2702 · €345,000')] }),
      blk('Bars', { title: 'Your projects against target', sub: 'Team targets · all reps', items: [PB('Mercury', 'You sold 1 of the 3', '3 of 4 · €1.07M of €1.40M', 75, PACE, chip('Ahead of pace', 'ok')), PB('Onyx Rise', 'You sold 0 of the 3', '3 of 5 · €1.24M of €2.10M', 60, PACE, chip('On pace', 'ok'))].map((p, i) => ({ ...p, bt: bt(i) })) }),
      blk('Table', { title: 'Your stalled opportunities', sub: 'No message, meeting or task in 14 days', right: '3', cols: 'minmax(0,1fr) 110px 200px 80px', head: ['Opportunity', 'Stage', 'Last activity', 'Quiet'],
        rows: [R(['Claire Galea', 'Qualified', 'WhatsApp, Thu 1 Oct', '18 days']), R(['Ryan Pace', 'Appointment booked', 'Appointment cancelled, Sat 3 Oct', '16 days']), R(['Josephine Bonello', 'Qualified', 'WhatsApp, Mon 5 Oct', '14 days'])] }),
    ], [
      blk('List', { title: 'Your week', sub: '12–18 Oct', items: list([L('Sold #CM2702 to Daniel Vella', '€345,000 · promise of sale signed Fri 16 Oct'), L('8 new leads', 'Median first reply 9 min'), L('3 appointments held, 1 offer sent', 'Maria Borg · #CM9708')]) }),
    ]] },

  '5a': { who: 'dev', nav: 'Performance', crumbs: ['Performance', 'Weekly roll-up'], title: 'Week of 12–18 Oct', tabsOn: 'Weekly roll-up', btns: ['‹ Previous week', 'Export PDF'],
    sub: 'All projects · sent Mon 19 Oct, 08:00 to Mark Grech and Rachel Mifsud · against October targets', cols: 'minmax(0,1fr) 420px',
    columns: [[
      blk('Narr', { head2: '2 units sold this week for €813,000. October is at 6 of 12 units and €2.31M of €4.40M, behind the pace of 7.4 units.', paras: NARR_PARAS('7'), foot: 'Only recorded activity is counted. Every number links to the record it came from.' }),
    ], [
      blk('List', { title: 'Sources', right: '9', items: SOURCES('7') }),
      blk('Chips', { title: 'Delivered', items: list([D('In Bricly', 'Performance and Today', chip('Seen', 'ok')), D('WhatsApp', 'Mark, Rachel', chip('Read', 'ok')), D('Email with PDF', 'Mark, cc Rachel', chip('Sent'))]) }),
    ]] },

  '5b': { surf: 'wa' },
  '5c': { surf: 'email' },

  '6a': { who: 'dev', nav: 'Performance', crumbs: ['Performance', 'Business', 'Verdala'], title: 'Verdala', st: chip('Behind pace', 'warn'), tabsOn: 'Business', btns: ['October ⌄', 'Brief me on Verdala'],
    sub: '28 units · selling since Mon 7 Sep · October to date, 1–19 Oct', cols: 'minmax(0,1fr) 380px', drawerOn: true,
    columns: [[
      blk('Kpis', { items: [K('Units sold', '0 of 3', 'Pace today 1.8', { pct: 0, pace: PACE, tone: 'warn', chip: chip('Behind pace', 'warn') }), K('Sales value', '€0 of €0.90M', 'Pace today €0.55M', { pct: 0, pace: PACE, tone: 'warn' }), K('Viewings', '9 booked · 4 held', '3 since the show apartment opened'), K('Offers', '0 sent', 'None this month')] }),
      blk('Funnel', { title: 'Lead to sale', sub: 'Verdala · October to date', items: [F('Leads', 29, 29, ''), F('Qualified', 15, 29, '52% of leads'), F('Appointment held', 4, 29, '27% of qualified'), F('Offer sent', 0, 29, 'none yet'), F('Sold', 0, 29, '')] }),
    ], []] },

  '7a': { who: 'dev', nav: 'Performance', crumbs: ['Performance', 'Forecast'], title: 'Performance', tabsOn: 'Forecast', tabList: ['Business', 'Team', 'Weekly roll-up', 'Forecast', 'Targets'], btns: ['Q4 ⌄', 'Board report'], banner: 'FS-604 Forecasting and board reports. Outside the v1 date.',
    sub: 'All projects · forecast from open opportunities, their stages and past conversion · updated today at 06:00', cols: 'minmax(0,1fr) 380px',
    columns: [[
      blk('Kpis', { kcols: 'repeat(3,minmax(0,1fr))', items: [K('October forecast', '9–11 units', 'Target 12'), K('October value', '€3.4M–€4.0M', 'Target €4.40M'), K('Q4 forecast', '31–38 units', 'Target 41')] }),
      blk('Table', { title: 'By project', sub: 'October', cols: 'minmax(0,1fr) 90px 120px 90px 140px', head: ['Project', 'Sold', 'Forecast', 'Target', 'Based on'],
        rows: [R(['Onyx Rise', '3', '4–5', '5', '6 open offers and appointments']), R(['Mercury', '3', '4', '4', '2 accepted offers']), R(['Verdala', '0', '1–2', '3', '3 appointments booked'])] }),
    ], [blk('List', { title: 'Board report', sub: 'PDF · for the board on Thu 22 Oct', items: list([L('Sales against target', 'October and Q4, by project'), L('Forecast with ranges', 'And what each range is based on'), L('Risks from the records', 'Stalled opportunities, top objections')]), btns: [['Generate', 'd']] })]] },

  '7b': { who: 'mgr', nav: 'Performance', crumbs: ['Performance', 'Leaderboard'], title: 'Performance', tabsOn: 'Leaderboard', tabList: ['Business', 'Team', 'Leaderboard', 'Weekly roll-up'], btns: ['October ⌄', 'Show to reps: off'], banner: 'FS-609 Leaderboards. Off by default; the manager decides whether reps see it. v1 has no ranking.',
    sub: 'Ranked by units sold, then first reply time · October to date', cols: 'minmax(0,1fr) 340px',
    columns: [[blk('Table', { title: 'Leaderboard', cols: '40px minmax(0,1.4fr) repeat(4,minmax(0,1fr))', head: ['', 'Rep', 'Sold', 'Value', 'First reply', 'Appointments held'],
      rows: [R([['1', { fw: '500' }], 'Nicole Farrugia', '2', '€780,000', '6 min', '8']), R([['2', { fw: '500' }], 'Elena Spiteri', '2', '€707,000', '7 min', '9']), R([['3', { fw: '500' }], 'Sam Zammit', '1', '€345,000', '9 min', '9']), R([['4', { fw: '500' }], 'Kurt Attard', '1', '€478,000', '14 min', '7'])] })],
    [blk('List', { title: 'Open questions', items: list([L('Rank by what?', 'Units, value, or activity'), L('Who sees it?', 'Managers only, or the whole team')]) })]] },

  '7c': { who: 'mgr', nav: 'Performance', crumbs: ['Performance', 'Reports'], title: 'Reports', tabsOn: 'Reports', tabList: ['Business', 'Team', 'Weekly roll-up', 'Reports'], btns: [], banner: 'FS-608 Reporting agent, FS-610 Learning from past projects, FS-611 Cross-project evidence.',
    sub: 'Ask for a report in plain words. Bricly schedules it and builds it from the records.', cols: 'minmax(0,1fr) 400px',
    columns: [[blk('Chat', { chatH: '600px', ph: 'Ask for a report', msgs: [
      M('user', 'Rachel Mifsud · 10:02', 'Every Friday at 16:00, send me Verdala appointments and objections for the week.'),
      M('agent', 'Bricly · 10:02', 'Here’s the report. First one on Fri 23 Oct.', { card: [['Project', 'Verdala'], ['Contents', 'Appointments held and booked, objections raised, with sources'], ['When', 'Fridays, 16:00'], ['Where', 'WhatsApp and email']] , opts: ['Schedule it', 'Change'] }),
    ] })],
    [blk('List', { title: 'From past projects', sub: 'Same week after launch', items: list([L('Onyx Rise, week 6', '7 of 40 units sold · 22 appointments held', { r: '7' }), L('Mercury, week 6', '5 of 32 units sold · 18 appointments held', { r: '5' }), L('Verdala, week 6', '0 of 28 units sold · 4 appointments held', { r: '0' })]) })]] },
};

const DRAWER = {
  title: 'Pipeline brief · Verdala', sub: 'Generated Mon 19 Oct, 10:42 from 29 open opportunities · records only',
  prompt: 'Brief me on the Verdala pipeline for Thursday’s board call.',
  paras: [
    para('Where it stands', '29 open opportunities: 14 leads, 11 qualified, 4 with an appointment held, none with an offer[1]. No units sold in October against a target of 3[2].'),
    para('Coming up', '3 appointments booked this week: Tue 20, Wed 21 and Sat 24 Oct[3].'),
    para('Risks', '5 opportunities have been quiet for 14 days or more, 3 of them after an appointment[4]. The completion date came up in 5 of 9 conversations; the construction programme says Q2 2028[5][6].'),
  ],
  items: [L('Opportunities · Verdala', '29 open', { ref: '1' }), L('Targets · October', '3 units', { ref: '2' }), L('Calendar', '3 appointments', { ref: '3' }), L('Stalled opportunities', '5', { ref: '4' }), L('Objections · completion date', '5 of 9', { ref: '5' }), L('Construction programme', 'Rev. 4, Sep', { ref: '6' })],
  note: 'Nothing here is written back to the records.',
  btns: [['Export PDF', 'd'], 'Send to WhatsApp', 'Copy'].map(btn),
};

const PHONES = [
  { who: 'Mark Grech', scope: 'Managing Director · the business', head: 'Weekly roll-up · 12–18 Oct', hasPdf: true, link: 'bricly.app/r/w42',
    body: '2 units sold, €813,000.\nOctober: 6 of 12 units, €2.31M of €4.40M. Behind pace (7.4).\n\nOnyx Rise 3 of 5\nMercury 3 of 4\nVerdala 0 of 3, no offers yet\n\n11 stalled opportunities, up from 8.' },
  { who: 'Rachel Mifsud', scope: 'Sales Manager · the team', head: 'Team · 12–18 Oct', hasPdf: true, link: 'bricly.app/r/w42-team',
    body: '31 new leads, median first reply 9 min.\n11 appointments held, 5 offers sent, 2 sold.\n\nStalled by rep:\nElena 2 · Kurt 5 · Nicole 1 · Sam 3' },
  { who: 'Sam Zammit', scope: 'Sales Rep · only his own', head: 'Your week · 12–18 Oct', hasPdf: false, link: 'Open in Bricly',
    body: 'You sold #CM2702 to Daniel Vella, €345,000.\n8 new leads, median first reply 9 min.\n3 appointments held, 1 offer sent.\n\n3 opportunities are quiet for 14+ days: Claire Galea, Ryan Pace, Josephine Bonello.' },
];

const ME = { dev: { name: 'Mark Grech', role: 'Managing Director', ini: 'MG' }, mgr: { name: 'Rachel Mifsud', role: 'Sales Manager', ini: 'RM' }, rep: { name: 'Sam Zammit', role: 'Sales Rep', ini: 'SZ' } };


return {SCN,DRAWER,PHONES};
})();
