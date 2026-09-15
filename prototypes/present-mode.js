/* Bricly Present Mode — vanilla prototype implementation, September 2026.
 * No network sends or render production. Storage contains demo data only.
 * The legacy prototype remains intact; its public entry hooks delegate here.
 */
(() => {
  'use strict';
  const KEY = 'bricly.present.v1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const uuid = prefix => prefix + '-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
  const lenses = {general:'General view',investment:'Investment view',relocation:'Relocation view',first_home:'First home view',second_home:'Second home view'};
  // Unlike buyerTypeFor's demo hash fallback, only inherit an explicit choice or a known tag.
  const buyerLens = o => ({'Investment property':'investment','First home':'first_home','First-time buyer':'first_home','Relocation':'relocation','Second home':'second_home'}[o?.buyerType || (o?.tags?.includes('Investor')?'Investment property':o?.tags?.includes('First-Time Buyer')?'First home':o?.tags?.includes('Foreign Buyer')?'Second home':'')] || 'general');
  const available = uid => UN(uid)?.status === 'available';
  const devOf = uid => DEV(UN(uid)?.dev);
  const catalogDefault = () => ({layout:'architect',preset:'std',pack:'signature'});
  function canonical(c) {
    const d = catalogDefault();
    if (!c) return d;
    const layout = CR_LAYOUT(c.layout);
    return {layout:layout?.id || d.layout, preset:layout?.presets.some(p => p.id === c.preset) ? c.preset : (layout?.presets[0].id || d.preset), pack:CR_PACK(c.pack)?.id || d.pack};
  }
  function price(uid, c) {
    const u = UN(uid); if (!u) return 0;
    return u.price + ((CR_LAYOUT(c?.layout)?.delta || 0) + (CR_PACK(c?.pack)?.delta || 0)) * 1000;
  }
  const labelCfg = c => [CR_LAYOUT(c?.layout)?.name, CR_LAYOUT(c?.layout)?.presets.find(p => p.id === c?.preset)?.name, CR_PACK(c?.pack)?.name].filter(Boolean).join(' · ');
  // The v2 opportunity rail still reads display-only fin/lay/adds labels.
  // Keep these aliases at that boundary; the contractual keys remain canonical.
  const recordConfig=(uid,c)=>({...c,fin:CR_PACK(c.pack)?.name||'',lay:CR_LAYOUT(c.layout)?.name||'',adds:[],price:price(uid,c)});
  const B = (text, action, arg = '', cls = '', disabled = false) => `<button type="button" class="pm-btn ${cls}" data-pm="${action}" data-arg="${esc(arg)}" ${disabled ? 'disabled' : ''}>${text}</button>`;
  const options = (values, chosen) => values.map(([v,t]) => `<option value="${esc(v)}" ${String(chosen) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const select = (title, field, values, chosen, extra = '') => `<label class="pm-field ${extra}">${esc(title)}<select data-field="${field}">${options(values, chosen)}</select></label>`;
  const field = (title, key, value = '', type = 'text') => `<label class="pm-field">${esc(title)}<input type="${type}" data-field="${key}" value="${esc(value)}"></label>`;
  const check = (title, key, value) => `<label class="pm-check"><input type="checkbox" data-field="${key}" ${value ? 'checked' : ''}>${esc(title)}</label>`;
  const brand = () => '<div class="pm-brand"><span class="pm-mark" aria-hidden="true">▥</span>bricly<span class="pm-muted" style="font-size:11px;letter-spacing:.1em;font-weight:400">PRESENT</span></div>';
  let store = {version:1,sessions:{},selections:{},records:{},contacts:{},outputs:{},inventory:{}};
  let storageError = '', s = null, root = null, timer = null, openingTimer = null, drawer = null, noteId = null, returnFocus = null, locked = [], recognition = null;
  let inventorySignature = '', message = '', sharingBusy = false, originFocus = null;
  const selection = () => store.selections[s.selection_id];
  const item = uid => selection()?.items.find(i => i.unit_id === uid);
  const selected = () => selection().items.filter(i => i.is_shortlisted);
  const eligible = () => selected().filter(i => i.unit_id && available(i.unit_id));
  const selectedDevs = () => [...new Set(selected().map(i => i.development_id))];
  const money = n => s.prices_hidden ? 'On request' : fmtEur(n);
  const status = uid => `<span class="pm-status ${esc(UN(uid)?.status)}">${esc(UN_STATUS[UN(uid)?.status]?.l || 'Unavailable')}</span>`;
  const inRoom = () => !!s && !['review','checkout','ready','preview'].includes(s.last_screen);
  const UI_SCREENS = new Set(['intro','review','preflight','preferences','preparing','opening','portfolio','showroom','unit','shortlist','compare','devcompare','closing','checkout','ready','preview']);
  let transitionId=0;
  let disposeExplorer=()=>{};
  function cleanupExplorer(){const dispose=disposeExplorer;disposeExplorer=()=>{};dispose();}
  function migrateSession(a) {
    a.preferences ||= {style:'',finish:''};
    a.preferences.style = CR_STYLE(a.preferences.style)?.id || '';
    a.preferences.finish = CR_PACK(a.preferences.finish)?.id || '';
    a.ui.tour ||= (a.scope.type==='units' ? [...new Set(a.scope.ids.map(id=>devOf(id)?.id))] : a.scope.order || a.scope.ids).filter(id=>DEV(id));
    a.ui.portfolioView ||= 'collection';
    a.ui.compareMode ||= a.last_screen==='devcompare'?'developments':'units';
    a.ui.questionStep ??= 0;
    a.ui.answers ||= a.ui.preferencesSet?{lens:true,style:true,finish:true}:{};
    a.ui.unitPreview ||= {};
    a.ui.spatial ||= {};
    a.ui.neighbourhood ||= {};
    if(a.last_screen==='devcompare')a.last_screen='compare';
    if(a.last_buyer_screen==='devcompare')a.last_buyer_screen='compare';
    if(a.ui.media==='documents')a.ui.media='exterior';
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY); if (!raw) return;
      const data = JSON.parse(raw);
      if (data.version !== 1 || !data.sessions || !data.selections || !data.records || !data.contacts || !data.outputs) throw new Error('Unsupported saved data');
      for (const a of Object.values(data.selections)) if (!Array.isArray(a.items)) throw new Error('Invalid selection');
      for (const a of Object.values(data.sessions)) if (!data.selections[a.selection_id] || !UI_SCREENS.has(a.last_screen) || !a.scope || !Array.isArray(a.scope.ids) || !a.ui || !Array.isArray(a.viewed)) throw new Error('Invalid session');
      store = data; store.inventory ||= {};
      Object.values(store.sessions).forEach(migrateSession);
      Object.values(store.contacts).forEach(c => { if (!CONTACTS.some(x => x.id === c.id)) CONTACTS.push(c); });
      Object.values(store.records).forEach(r => {
        const existing = OPPS.find(o => o.id === r.opportunity.id);
        if (existing) { existing.units = [...new Set([...existing.units,...r.opportunity.units])]; existing.devs = [...new Set([...existing.devs,...r.opportunity.devs])]; }
        else OPPS.push(r.opportunity);
        Object.assign(getExt(existing || r.opportunity),r.extension);
      });
      Object.entries(store.inventory).forEach(([id,st]) => { if (UN(id) && UN_STATUS[st]) UN(id).status = st; });
    } catch (e) { storageError = 'Saved data could not be loaded. A fresh session is available; the original storage has not been overwritten.'; }
  }
  load();
  function write() {
    if (s?.ui.publicPreview) return; // buyer links are read-only snapshots
    if (s) {
      s.updated_at = now(); selection().updated_at = now();
      selection().items.forEach(i => { if(i.unit_id) { i.configured_price = price(i.unit_id,i.config); i.visual_state = asset(i) ? 'approved' : 'pending'; } });
      const o = OPPS.find(o => o.id === s.opportunity_id);
      if (o) {
        const x = getExt(o); x.presentSelection = s.selection_id;
        if(s.ui.preferencesSet)x.presentPreferences = {...s.preferences,lens:s.lens};
        x.presentSessions ||= []; if (!x.presentSessions.includes(s.id)) x.presentSessions.push(s.id);
        store.records[o.id] = {opportunity:clone(o),extension:clone(x)};
      }
      if (s.contact_id) { const c = CONTACTS.find(c => c.id === s.contact_id); if(c) store.contacts[c.id] = clone(c); }
    }
    if (storageError.startsWith('Saved data')) return;
    try { localStorage.setItem(KEY,JSON.stringify(store)); storageError = ''; }
    catch (e) { storageError = 'Changes are held in this tab only. Browser storage is unavailable; do not close this tab.'; }
  }
  // Supplied asset metadata must explicitly prove a configuration match.
  // Do not derive approval from filenames or the legacy generated-render cache.
  function asset(i) {
    if (!i?.unit_id) return null;
    return (window.PM_ASSETS || []).find(a => a.approved === true && a.development_id === i.development_id &&
      (a.unit_id === i.unit_id || (!a.unit_id && a.typology === crTypologyKey(UN(i.unit_id)))) &&
      a.layout === i.config.layout && a.preset === i.config.preset && a.pack === i.config.pack &&
      (!(i.visual_preference?.style || i.style) || a.style === (i.visual_preference?.style || i.style)) &&
      (!i.visual_preference?.finish || a.pack === i.visual_preference.finish) && a.url);
  }
  function touch(uid, cfg, shortlisted = false, source = 'present') {
    let i = item(uid); const u = UN(uid); if (!u) return null;
    if (!i) {
      i = {development_id:DEV(u.dev).id,unit_id:uid,config:canonical(cfg),style:null,visual_preference:clone(s.preferences || {style:'',finish:''}),request_note:'',source,added_at:now(),is_shortlisted:shortlisted,visual_state:'pending'};
      if (cfg?.layout) { i.style=cfg.style || null; i.request_note=cfg.modifier || cfg.request_note || ''; }
      if (cfg && !cfg.layout && (cfg.fin || cfg.lay || cfg.adds?.length)) i.legacy_config = clone(cfg);
      selection().items.push(i);
    }
    if (shortlisted) i.is_shortlisted = true;
    return i;
  }
  function newSession({type='portfolio',ids=[],oppId=null,contactId=null,lens=null,unitIds=[],source='present',isCompare=false} = {}) {
    const o = OPPS.find(o => o.id === oppId);
    const existing = o && store.selections[getExt(o).presentSelection];
    const sel = existing || {id:uuid('sel'),opportunity_id:oppId,contact_id:contactId,items:[],created_by:UN_REP,created_at:now(),updated_at:now()};
    store.selections[sel.id] = sel;
    const c = CONTACTS.find(c => contactId ? c.id === contactId : !!oppId && c.oppIds?.includes(oppId));
    const route = document.querySelector('.page.on')?.id || 'p-today';
    s = {id:uuid('session'),scope:{type,ids:ids.slice(),order:ids.slice()},lens:lens || buyerLens(o),opportunity_id:oppId,contact_id:contactId || c?.id || null,selection_id:sel.id,
      viewed:[],prices_hidden:false,last_screen:'preflight',last_buyer_screen:'portfolio',started_at:now(),ended_at:null,outcome:'saved',source,isCompare,
      ui:{dev:ids.map(id => DEV(id)).find(Boolean)?.id || null,unit:null,visited:[],companyOpened:false,filter:{dev:'',beds:'',type:'',price:'',view:'',completion:'',floor:'',q:'',unavailable:false},panel:'units',media:'exterior',focus:false,compare:[],compareDevs:[],shortlistView:'units',origin:{page:route,opp:typeof oppCur !== 'undefined' ? oppCur?.id : null,compare:source==='compare'},linkType:oppId?'opportunity':contactId?'contact':'new',linkId:oppId || contactId || '',name:'',email:'',phone:'',includeComparison:true,includeDevelopments:true,pdf:true,link:true,output:null,ack:false}};
    store.sessions[s.id] = s;
    const importIds = unitIds.length ? unitIds : (!existing && o ? o.units : []);
    importIds.filter(UN).forEach(uid => {
      const saved = o && getExt(o).unitConfigs?.[uid];
      const tray = source === 'compare' && trState.items.find(i => i.unitId === uid)?.config;
      touch(uid,tray || saved, true,source);
    });
    s.preferences = clone(o && getExt(o).presentPreferences || {style:'',finish:''});
    if(lenses[s.preferences.lens] && !lens)s.lens=s.preferences.lens;
    migrateSession(s);
    s.ui.preferencesSet = !!(o && getExt(o).presentPreferences);
    s.ui.answers=s.ui.preferencesSet?{lens:true,style:true,finish:true}:{lens:s.lens!=='general',style:!!s.preferences.style,finish:!!s.preferences.finish};
    s.ui.compare = eligible().slice(0,4).map(i => i.unit_id);
    return s;
  }
  function mount() {
    if (root) return;
    originFocus = document.activeElement;
    root = document.createElement('section'); root.id = 'pm-shell'; root.setAttribute('aria-label','Bricly Present Mode');
    document.body.append(root); document.body.classList.add('pm-active');
    locked = [...document.body.children].filter(e => e !== root && !['SCRIPT','STYLE','LINK'].includes(e.tagName)).map(e => [e,e.inert,e.getAttribute('aria-hidden')]);
    locked.forEach(([e]) => { e.inert = true; e.setAttribute('aria-hidden','true'); });
    root.addEventListener('click',click);
    root.addEventListener('change',change);
    root.addEventListener('input',input);
    root.addEventListener('error',imageError,true);
    inventorySignature = inventoryKey();
    timer = setInterval(reconcile,750);
  }
  function enter(args = {}) {
    if (s && inRoom()) return;
    message = ''; newSession(args); mount();
    const legacy = selection().items.some(i => i.legacy_config && !i.legacy_reviewed);
    if (args.isCompare) { s.last_screen = legacy ? 'review' : 'compare'; }
    else if (args.type === 'units' && !legacy) { s.last_screen = 'compare'; }
    else if(legacy||args.review){s.last_screen='review';}
    else { intro();return; }
    render();
  }
  const questionKeys=['lens','style','finish'];
  function intro() {
    nav('intro');const id=s.id;
    openingTimer=setTimeout(()=>{if(s?.id===id&&s.last_screen==='intro')beginQuestions();},matchMedia('(prefers-reduced-motion: reduce)').matches?80:1600);
  }
  function beginQuestions() {
    const next=questionKeys.findIndex(k=>!s.ui.answers[k]);
    if(next<0){start();return;}
    s.ui.questionStep=next;nav('preflight');
  }
  function answerQuestion(key,value) {
    if(questionKeys[s.ui.questionStep]!==key)return;
    if(key==='lens'){if(!lenses[value])return;s.lens=value;}
    else {if(value && !(key==='style'?CR_STYLE(value):CR_PACK(value)))return;s.preferences[key]=value;}
    s.ui.answers[key]=true;s.ui.output=null;
    selection().items.filter(i=>i.unit_id).forEach(i=>{i.visual_preference=clone(s.preferences);});
    const editing=s.last_screen==='preferences';
    let next=s.ui.questionStep+1;
    if(!editing)while(next<3&&s.ui.answers[questionKeys[next]])next++;
    if(next<3){s.ui.questionStep=next;render();root.querySelector('h1')?.focus();}
    else {s.ui.preferencesSet=true;if(editing){if(s.ui.preferenceStart){s.ui.preferenceStart=false;preparing();}else nav(s.ui.preferenceReturn||'portfolio');}else start();}
  }
  function preparing() {
    nav('preparing');const id=s.id,token=++transitionId;
    const d=DEV(s.ui.tour[0]);
    const imageReady=d?new Promise(resolve=>{const image=new Image();image.onload=image.onerror=resolve;image.src=UN_ASSET+d.photo;}):Promise.resolve();
    const motion=new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:450));
    Promise.race([Promise.all([imageReady,window.PMMap.load(),motion]),new Promise(resolve=>setTimeout(resolve,2500))]).then(()=>{
      if(s?.id===id&&s.last_screen==='preparing'&&transitionId===token)finishPreparing();
    });
  }
  function finishPreparing() {if(s.ui.tour.length)openDevelopment(s.ui.tour[0]);else nav('portfolio');}
  function start() {
    if (!s.scope.ids.length && s.scope.type !== 'portfolio' && s.scope.type !== 'units') { message = 'Keep at least one development, or explore the portfolio.'; render(); return; }
    selection().items.forEach(i => { if(i.legacy_config) i.legacy_reviewed = true; });
    if (s.scope.type === 'units' || s.isCompare) { nav('compare'); return; }
    s.ui.preferencesSet = true;
    selection().items.filter(i=>i.unit_id).forEach(i=>{i.visual_preference=clone(s.preferences);});
    preparing();
  }
  function opening(dev, next) {
    if (dev ? s.ui.visited.includes(dev) : s.ui.companyOpened) { nav(next); return; }
    if (dev) s.ui.visited.push(dev); else s.ui.companyOpened = true;
    s.ui.openingName = dev ? DEV(dev)?.name : 'bricly'; s.ui.openingNext = next;
    nav('opening');
    const id = s.id;
    clearTimeout(openingTimer);
    openingTimer = setTimeout(() => { if(s?.id === id && s.last_screen === 'opening') nav(next); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 1600);
  }
  function openDevelopment(id) {
    const d = DEV(id); if (!d) return;
    if (!s.ui.tour.includes(d.id)) {s.ui.tour.push(d.id);syncTour();}
    s.ui.dev = d.id; s.ui.panel = 'units'; s.ui.media = 'intro'; s.ui.focus = false; drawer = null;
    s.viewed.push({development_id:d.id,at:now()});
    opening(d.id,'showroom');
  }
  function openUnit(uid) {
    const u = UN(uid); if (!u) return;
    s.ui.unitReturn = ['compare','shortlist'].includes(s.last_screen) ? s.last_screen : 'showroom';
    s.ui.unitMediaReturn = s.last_screen==='showroom'?s.ui.media:null;
    s.ui.dev = DEV(u.dev).id; s.ui.unit = uid; s.ui.focus = false; touch(uid);
    PMSpatial.selectUnit(s.ui.dev,spatialContext().state,uid);
    if(!s.ui.tour.includes(s.ui.dev)){s.ui.tour.push(s.ui.dev);syncTour();}
    s.viewed.push({development_id:s.ui.dev,unit_id:uid,at:now()}); drawer = null; nav('unit');
  }
  function nav(screen) {
    if (!s || !UI_SCREENS.has(screen)) return;
    if (['checkout','ready'].includes(screen) && !s.ui.ack && !s.isCompare) return;
    transitionId++;
    clearTimeout(openingTimer); drawer = null; noteId = null;
    s.last_screen = screen;
    if (['portfolio','showroom','unit','shortlist','compare'].includes(screen)) s.last_buyer_screen = screen;
    if(screen === 'compare') s.ui.compare = s.ui.compare.filter(available).slice(0,4);
    render(); root.querySelector('.pm-main')?.scrollTo(0,0);
    root.querySelector('h1,h2,.pm-opening')?.focus({preventScroll:true});
  }
  function end() {
    window.PMViewer.clear();
    s.ui.ack = false; s.ended_at = now(); s.outcome = 'saved';
    s.selection_snapshot = clone(selection());
    log('saved','Presentation session saved'); nav('closing');
  }
  function back() {
    if (!s) return;
    if(window.PMViewer.active){window.PMViewer.close();return;}
    if (drawer) { closeDrawer(); return; }
    if (s.ui.focus) { s.ui.focus = false; render(); return; }
    if (s.last_screen === 'opening') { nav(s.ui.openingNext); return; }
    if (s.last_screen === 'unit') { if(s.ui.unitReturn==='showroom'&&s.ui.unitMediaReturn)s.ui.media=s.ui.unitMediaReturn;nav(s.ui.unitReturn || 'showroom'); return; }
    if (s.last_screen === 'showroom') { nav('portfolio'); return; }
    if (['preflight','preferences'].includes(s.last_screen)) {
      if(s.ui.questionStep>0){s.ui.questionStep--;render();return;}
      if(s.last_screen==='preferences')nav(s.ui.preferenceReturn||'portfolio');else end();return;
    }
    if(s.last_screen==='intro'||s.last_screen==='preparing'){end();return;}
    if (s.last_screen==='shortlist') { nav(s.ui.dev ? 'showroom' : 'portfolio'); return; }
    if (['compare','devcompare'].includes(s.last_screen) && !s.isCompare) { nav('shortlist'); return; }
    if (s.last_screen === 'closing') { resumeTour(); return; }
    if (s.last_screen === 'preview') { if(s.ui.publicPreview) close(); else nav('checkout'); return; }
    if (['review','checkout','ready'].includes(s.last_screen) || s.isCompare) { close(); return; }
    end();
  }
  function resumeTour() { s.ended_at = null; s.ui.ack = false; nav(s.last_buyer_screen || 'portfolio'); }
  function close(toOpportunity = false) {
    if (!s) return;
    if (inRoom() && !s.isCompare) { end(); return; }
    const origin = s.ui.origin, oid = s.opportunity_id;
    cleanupExplorer();
    window.PMViewer.clear();transitionId++;
    write(); clearInterval(timer); clearTimeout(openingTimer); recognition?.stop(); recognition = null;
    root?.remove(); root = null; drawer = null; s = null; document.body.classList.remove('pm-active');
    locked.forEach(([e,inert,aria]) => { e.inert = inert; if(aria === null) e.removeAttribute('aria-hidden'); else e.setAttribute('aria-hidden',aria); }); locked = [];
    if (toOpportunity && oid) openOpp(oid);
    else if (origin?.compare && trState.items.length>=2) { document.getElementById('cmp').classList.add('on'); cmpState.mode='compare'; cmpRender(); }
    else if (origin?.page === 'p-opp' && origin.opp) openOpp(origin.opp);
    originFocus?.focus?.({preventScroll:true});
    if (typeof pipeRenderAll === 'function') pipeRenderAll();
  }
  function resume(id) {
    const saved = store.sessions[id]; if (!saved || !store.selections[saved.selection_id]) return;
    s = saved; migrateSession(s); s.ui.ack = false; s.ui.publicPreview = false; s.isCompare = false; message = '';
    if (['checkout','ready','preview','closing','review','opening','preparing'].includes(s.last_screen)) s.last_screen = s.last_buyer_screen || 'portfolio';
    if(s.last_screen==='intro')s.last_screen='preflight';
    s.ended_at = null; s.resumed_at = now(); mount(); render();
  }
  function filterUnits(d) {
    const f = s.ui.filter;
    const list = UNITS.filter(u => (!d || u.dev === d.name) &&
      (f.unavailable || available(u.id)) && (d || !f.dev || DEV(u.dev).id === f.dev) &&
      (f.beds === '' || u.beds === +f.beds) && (!f.type || u.type === f.type) &&
      (!f.price || UN_PRICE_BANDS[f.price]?.(u.price)) && (!f.view || u.views.includes(f.view)) &&
      (!f.completion || u.ready === f.completion) && (f.floor === '' || u.floor === +f.floor) &&
      (!f.q || (u.id+' '+u.type+' '+u.dev).toLowerCase().includes(f.q.toLowerCase())));
    return list.sort((a,b) => s.lens === 'investment' ? price(a.id,item(a.id)?.config)/a.sqm - price(b.id,item(b.id)?.config)/b.sqm :
      s.lens === 'first_home' ? price(a.id,item(a.id)?.config)-price(b.id,item(b.id)?.config) :
      s.lens === 'relocation' ? b.beds-a.beds : a.floor-b.floor);
  }
  function filters(panel = false) {
    const f = s.ui.filter, any = title => ['',title];
    return `<div class="pm-filters">${panel ? field('Search units','filter.q',f.q) : select('Development','filter.dev',[any('All developments'),...scopeDevs().map(d=>[d.id,d.name])],f.dev)}
      ${select('Bedrooms','filter.beds',[any('Any beds'),['0','Studio'],['1','1 bed'],['2','2 beds'],['3','3 beds']],f.beds)}
      ${select('Type','filter.type',[any('Any type'),...['Apartment','Studio','Penthouse','Maisonette'].map(x=>[x,x])],f.type)}
      ${!s.prices_hidden ? select('Price band','filter.price',[any('Any price'),...Object.keys(UN_PRICE_BANDS).map(x=>[x,x])],f.price) : ''}
      ${select('View','filter.view',[any('Any view'),...UN_VIEWS.map(x=>[x,x])],f.view)}
      ${select('Completion','filter.completion',[any('Any date'),...new Set(DEVS.map(d=>d.completion))].map(x=>Array.isArray(x)?x:[x,x]),f.completion)}
      ${panel ? select('Floor','filter.floor',[any('Any floor'),...[...new Set(UNITS.filter(u=>u.dev===DEV(s.ui.dev)?.name).map(u=>u.floor))].sort((a,b)=>a-b).map(n=>[n,n===0?'Ground':String(n)])],f.floor) : ''}
      ${check('Show held, reserved & sold','filter.unavailable',f.unavailable)}${B('Reset','resetFilters','','quiet')}</div>`;
  }
  function scopeDevs() {
    return DEVS;
  }
  function photo(d, badge = '') { return `<div class="pm-photo"><img src="${esc(UN_ASSET+d.photo)}" alt="${esc(d.name)} project exterior" loading="lazy">${badge ? `<span>${esc(badge)}</span>` : ''}</div>`; }
  function identity(d) {
    return d.presentLogo?.approved && d.presentLogo.url ? `<img class="pm-dev-logo" src="${esc(d.presentLogo.url)}" alt="${esc(d.name)}">` : `<span class="pm-dev-monogram" aria-label="${esc(d.name)} brand monogram">${esc(DV_BRAND[d.name]?.mark || d.name)}</span>`;
  }
  function companyBrand() {
    const c=PMData.company();
    return `<div class="pm-company-brand">${c.logoUrl?`<img src="${esc(c.logoUrl)}" alt="${esc(c.name)} logo">`:'<span class="pm-company-mark" aria-hidden="true">✧</span>'}<span>${esc(c.name)}</span></div>`;
  }
  function preferenceSummary() {
    return [lenses[s.lens].replace(' view',''),CR_STYLE(s.preferences.style)?.name,CR_PACK(s.preferences.finish)?.name].filter(Boolean).join(' · ');
  }
  function preferenceFields() {
    const step=s.ui.questionStep,key=questionKeys[step];
    const title=['What brings you here?','What feels like you?','Which finish draws you in?'][step];
    let choices='';
    if(key==='lens')choices=`<div class="pm-answer-grid">${Object.entries(lenses).map(([k,t])=>B(esc(k==='general'?'Just exploring':t.replace(' view','')),'lens',k,s.lens===k?'selected':'')).join('')}</div>`;
    if(key==='style')choices=`<div class="pm-style-grid">${CR_STYLES.map(st=>`<button class="pm-style-card ${s.preferences.style===st.id?'selected':''}" data-pm="stylePreference" data-arg="${st.id}" aria-pressed="${s.preferences.style===st.id}"><span class="pm-style-palette" style="background:${st.g}"><span>${esc(st.kw[0])}</span></span><strong>${esc(st.name)}</strong><small>${esc(st.kw.join(' · '))}</small></button>`).join('')}</div>`;
    if(key==='finish')choices=`<div class="pm-finish-grid">${CR_PACKS.map(p=>`<button class="pm-style-card ${s.preferences.finish===p.id?'selected':''}" data-pm="finishPreference" data-arg="${p.id}" aria-pressed="${s.preferences.finish===p.id}"><span class="pm-style-palette" style="background:${p.render}"></span><strong>${esc(p.name)}</strong><div class="pm-swatches">${p.swatches.map(sw=>`<span class="pm-swatch" style="${crTexStyle(sw.k,sw.c)}" title="${esc(sw.m)}"></span>`).join('')}</div></button>`).join('')}</div>`;
    return `<div class="pm-scene"><div class="pm-scene-orb" aria-hidden="true"></div><section class="pm-question-glass" aria-label="Set the scene"><div class="pm-eyebrow">Set the scene · ${step+1} of 3</div><h1 tabindex="-1">${title}</h1><p class="pm-muted">${step===0?'A little context. A more personal journey.':'Visual preferences only. Your specification and price stay the same.'}</p>${choices}<div class="pm-question-footer">${B('← Back','back','','quiet')}${B(step===0?'Skip / General':'No preference','skipQuestion','','quiet')}<span class="pm-muted">Select an answer to continue</span></div>${step>0?'<p class="pm-palette-note">Illustrative material palettes, not generated residence previews.</p>':''}</section></div>`;
  }
  function preferences() {
    return preferenceFields();
  }
  function setPreference(key,value) {
    if(key==='style' && value && !CR_STYLE(value) || key==='finish' && value && !CR_PACK(value))return;
    s.preferences[key]=value;
    selection().items.filter(i=>i.unit_id).forEach(i=>{i.visual_preference=clone(s.preferences);});
    s.ui.output=null;render();
  }
  function beginTour() {
    if(!s.ui.tour.length){message='Choose at least one development for your tour.';render();return;}
    if(!s.ui.preferencesSet){s.ui.preferenceReturn='portfolio';s.ui.preferenceStart=true;s.ui.questionStep=0;nav('preferences');return;}
    openDevelopment(s.ui.tour[0]);
  }
  function tourChrome() {
    if(!['showroom','unit','shortlist','compare'].includes(s.last_screen) || s.isCompare)return '';
    const n=s.ui.tour.indexOf(s.ui.dev),review=['shortlist','compare'].includes(s.last_screen);
    return `<nav class="pm-tour" aria-label="Presentation progress"><span class="pm-tour-label">${review?'Your favourites':`Development ${n+1} of ${s.ui.tour.length}`}</span><div class="pm-tour-stops">${s.ui.tour.map((id,index)=>`<button class="pm-btn ${!review&&id===s.ui.dev?'selected':''}" data-pm="dev" data-arg="${id}" ${!review&&id===s.ui.dev?'aria-current="step"':''}><span class="pm-count">${index+1}</span>${esc(DEV(id).name)}${s.ui.visited.includes(id)?'<span class="pm-visited" aria-label="Introduced">✓</span>':''}</button>`).join('')}${B('Shortlist','shortlist','',review?'selected':'')}</div>${!review?B(n<s.ui.tour.length-1?'Next development →':'Review shortlist →','nextDevelopment','','primary'):B('Continue to checkout →','end','','primary')}</nav>`;
  }
  function preflight() {
    return preferenceFields();
  }
  function review() {
    const sessions = Object.values(store.sessions).filter(a => a.id !== s.id && (!s.opportunity_id || a.opportunity_id === s.opportunity_id)).sort((a,b)=>b.started_at.localeCompare(a.started_at));
    const legacy = selection().items.filter(i=>i.legacy_config && !i.legacy_reviewed);
    return `<div class="pm-page pm-checkout"><div class="pm-heading"><div><div class="pm-eyebrow">Rep only · before screen sharing</div><h1 tabindex="-1">Review your presentation.</h1><p>Your saved choices stay with you.</p></div>${B('Cancel','close')}</div>
      <div class="pm-stack">
      ${s.ui.tour.length && s.scope.type !== 'units' ? `<div class="pm-card pm-card-body"><h3>Your developments</h3><p>This order is the tour. You can return to the full portfolio at any time.</p>${s.ui.tour.map((id,n)=>`<div class="pm-unit-row"><span class="pm-spacer">${esc(DEV(id)?.name)}</span>${B('↑','reorder',id+':-1','',n===0)}${B('↓','reorder',id+':1','',n===s.ui.tour.length-1)}${B('Remove','removeScope',id)}</div>`).join('')}</div>` : ''}
      ${legacy.length ? `<div class="pm-note pm-warning"><h3>Review earlier configuration choices</h3><p>The earlier finish/layout system is different. Original choices are retained below; this presentation uses Architect layout + Signature until you choose approved options.</p>${legacy.map(i=>`<p>${esc(i.unit_id)}: ${esc(JSON.stringify(i.legacy_config))}</p>`).join('')}<p>Starting confirms this review. Nothing from the earlier configuration is deleted.</p></div>` : ''}
      <div class="pm-row wrap">${B('Continue →','reviewContinue','','primary')}</div>
      ${sessions.length ? `<section class="pm-stack"><h3>Resume a saved session</h3>${sessions.slice(0,8).map(a=>`<div class="pm-session pm-row"><div class="pm-spacer"><strong>${esc(a.opportunity_id ? OPPS.find(o=>o.id===a.opportunity_id)?.lead || 'Linked session' : 'Unlinked session')}</strong><div class="pm-muted">${esc(new Date(a.started_at).toLocaleString())} · ${esc(lenses[a.lens])}</div></div>${B('Resume','resume',a.id)}</div>`).join('')}</section>` : ''}</div></div>`;
  }
  function portfolio() {
    const devs = DEVS.filter(d=>(!s.ui.filter.dev || d.id===s.ui.filter.dev) && filterUnits(d).length);
    return `<div class="pm-page"><div class="pm-heading"><div><div class="pm-eyebrow">The collection</div><h1 tabindex="-1">Choose the places. We’ll set the scene.</h1><p>Select one or more developments. Introduce them one at a time, then bring your favourites together.</p></div><div class="pm-segment">${B('Collection','portfolioView','collection',s.ui.portfolioView==='collection'?'selected':'')}${B('Map','portfolioView','map',s.ui.portfolioView==='map'?'selected':'')}</div></div>
      ${s.ui.portfolioView==='map'?`<div class="pm-map-layout"><aside class="pm-map-results" aria-label="Filter and select developments">${filters()}<div class="pm-map-result-list">${devs.map(d=>`<button class="pm-map-result ${s.ui.tour.includes(d.id)?'selected':''}" data-pm="toggleDev" data-arg="${d.id}" aria-pressed="${s.ui.tour.includes(d.id)}"><img src="${esc(UN_ASSET+d.photo)}" alt=""><span><strong>${esc(d.name)}</strong><small>${esc(d.loc)} · ${PMData.stats(d.id).available} available</small></span><span>${s.ui.tour.includes(d.id)?'✓':'+'}</span></button>`).join('')||'<p class="pm-empty">No matches. Your tour selections are retained.</p>'}</div></aside><div class="pm-map-geography">${window.PMMap.render(devs,{selectedIds:s.ui.tour,showLegend:false})}</div></div>`:`${filters()}<div class="pm-grid">${devs.map(d=>{
        const us=filterUnits(d), av=us.filter(u=>available(u.id));
        const chosen=s.ui.tour.includes(d.id);
        return `<button class="pm-card pm-select-card ${chosen?'selected':''}" data-pm="toggleDev" data-arg="${d.id}" aria-pressed="${chosen}" aria-label="${chosen?'Remove':'Select'} ${esc(d.name)} for tour">${photo(d,d.completion)}<span class="pm-select-indicator">${chosen?s.ui.tour.indexOf(d.id)+1:'+'}</span><div class="pm-card-body"><div class="pm-eyebrow">${esc(d.loc)}</div><h2>${esc(d.name)}</h2><p>${esc(d.tag)}</p><div class="pm-facts"><span>${av.length} available</span><strong>${av.length?money(Math.min(...av.map(u=>price(u.id,item(u.id)?.config)))):'No available units'}</strong></div></div></button>`;
      }).join('')}</div>`}${!devs.length?'<div class="pm-empty">No developments match these filters. Try resetting them.</div>':''}
      <div class="pm-tour-selection"><div class="pm-spacer"><h3>${s.ui.tour.length} development${s.ui.tour.length===1?'':'s'} in your tour</h3><p class="pm-muted">Selections stay with you when you filter.</p><div class="pm-row wrap">${s.ui.tour.map((id,n)=>`<div class="pm-tour-chip"><span>${n+1}. ${esc(DEV(id).name)}</span>${B('↑','tourReorder',id+':-1','quiet',n===0)}${B('↓','tourReorder',id+':1','quiet',n===s.ui.tour.length-1)}${B('×','toggleDev',id,'quiet')}</div>`).join('')}</div></div>${B('Start tour →','beginTour','','primary',!s.ui.tour.length)}</div></div>`;
  }
  function overview(d) {
    const sections={story:`<h3>The development</h3><p>${esc(d.about)}</p>`,completion:`<h3>Completion</h3><p>${esc(d.completion)}</p>`,amenities:`<h3>Everyday details</h3>${d.amen.map(a=>`<p>${esc(a)}</p>`).join('')}`,location:`<h3>Connected to what matters</h3>${d.dist.map(([a,b])=>`<div class="pm-row between"><span>${esc(a)}</span><span class="pm-muted">${esc(b)}</span></div>`).join('')}`};
    const order = s.lens==='investment'?['completion','story','amenities','location']:s.lens==='relocation'?['location','completion','amenities','story']:s.lens==='second_home'?['amenities','location','story','completion']:['story','completion','amenities','location'];
    return `<div class="pm-stack">${order.map(k=>`<section class="pm-stack">${sections[k]}</section>`).join('')}${B(selectedDevs().includes(d.id)?'Development shortlisted':'Shortlist development','shortDev',d.id,'primary')}</div>`;
  }
  function perspective(d) {
    const title={investment:'The investment perspective',relocation:'A new everyday',first_home:'Room for your first chapter',second_home:'Somewhere to come back to',general:'Life, in this neighbourhood'}[s.lens];
    const facts=s.lens==='investment' ? [['Completion',d.completion],['Rental yield',d.attributes?.yield_estimate || 'Not supplied'],['Payment plan',s.prices_hidden?'On request':d.attributes?.payment_plan || 'Not supplied']] : s.lens==='relocation' ? d.dist.slice(0,3) : s.lens==='first_home' ? [['Completion',d.completion],['Neighbourhood',d.loc],['Everyday life',d.amen[0]]] : d.amen.slice(0,3).map(a=>[a,'']);
    return `<h2>${title}</h2><p>${esc(d.about)}</p><div class="pm-lifestyle-facts">${facts.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;
  }
  function developmentVisual(d) {
    // Project-level approved variants are distinct from a contractual unit render.
    return (window.PM_PROJECT_ASSETS || []).find(a=>a.approved===true && a.development_id===d.id && a.kind==='interior' &&
      (!s.preferences.style || a.style===s.preferences.style) && (!s.preferences.finish || a.finish===s.preferences.finish) && a.url);
  }
  function unitRow(u) { const i=item(u.id); return `<div class="pm-unit-row"><button class="pm-unit-open" data-pm="unit" data-arg="${esc(u.id)}"><strong>${esc(u.id)}</strong><small>${esc(u.type)} · ${u.beds} beds · ${u.sqm} m² · Floor ${u.floor}</small><small>${money(price(u.id,i?.config))}</small></button>${status(u.id)}${B(i?.is_shortlisted?'−':'+','shortUnit',u.id,'',!available(u.id))}</div>`; }
  function spatialContext() {
    const id=s.ui.dev;
    const state=s.ui.spatial[id] ||= {};
    PMSpatial.ensure(id,state);
    return {developmentId:id,mode:s.ui.media,state,selectedIds:selected().filter(i=>i.unit_id).map(i=>i.unit_id),priceFor:uid=>s.prices_hidden?null:price(uid,item(uid)?.config),money};
  }
  function neighbourhoodContext() {
    const id=s.ui.dev;
    s.ui.neighbourhood[id]=PMNeighbourhood.ensure(id,s.ui.neighbourhood[id]);
    return {developmentId:id,state:s.ui.neighbourhood[id]};
  }
  function panel() {
    const d=DEV(s.ui.dev);
    if(s.ui.media==='floors'&&drawer!=='panel')return PMSpatial.renderPanel(spatialContext());
    return `<div class="pm-stack"><div class="pm-segment">${B('Units','panel','units',s.ui.panel==='units'?'selected':'')}${B('Overview','panel','overview',s.ui.panel==='overview'?'selected':'')}</div>${s.ui.panel==='overview'?overview(d):`${filters(true)}<div class="pm-muted">${filterUnits(d).length} matching units</div>${filterUnits(d).map(unitRow).join('')||'<div class="pm-empty">No matching units.</div>'}`}</div>`;
  }
  function showroom() {
    const d=DEV(s.ui.dev); if(!d) return portfolio();
    const hasFloors=PMSpatial.project(d.id).hasFloors;
    if(s.ui.media==='floors'&&!hasFloors)s.ui.media='exterior';
    const media=s.ui.media, exterior=d.media?.renders?.ext?.[0]?.img || d.photo;
    const variant=developmentVisual(d);
    const image=media==='interiors' ? d.media?.renders?.int?.[0]?.img || exterior : media==='lifestyle' ? d.media?.photos?.find(p=>p.tag==='Lifestyle')?.img || d.media?.photos?.[0]?.img || exterior : exterior;
    let overlay='';
    if(media==='lifestyle')overlay=`<div class="pm-stage-content pm-stack pm-lifestyle">${perspective(d)}</div>`;
    if(media==='amenities')overlay=`<div class="pm-stage-content pm-stack"><div class="pm-eyebrow">Life at ${esc(d.name)}</div><h1 tabindex="-1">More than a residence.</h1><div class="pm-amenity-list">${d.amen.map(a=>`<div><span aria-label="Included">✓</span>${esc(a)}</div>`).join('')||'<p>Amenities not supplied.</p>'}</div></div>`;
    if(media==='timeline')overlay=`<div class="pm-stage-content pm-stack"><div class="pm-eyebrow">The journey to your new address</div><h1 tabindex="-1">Development timeline.</h1><ol class="pm-timeline">${PMData.timeline(d.id).map(t=>`<li><span class="pm-timeline-dot"></span><div><strong>${esc(t.label)}</strong><p>${esc(t.date)}</p><small>${esc(t.status)}</small></div></li>`).join('')}</ol>${!d.presentTimeline?'<p class="pm-muted">Completion is the only milestone supplied. Detailed construction milestones are not available yet.</p>':''}</div>`;
    if(media==='video') overlay=`<div class="pm-stage-content pm-stack"><h2>Development film</h2>${d.media?.video?.url?`<video controls preload="metadata" poster="${esc(UN_ASSET+exterior)}" src="${esc(d.media.video.url)}"></video>`:'<p class="pm-muted">No approved film is attached yet. The exterior remains on stage.</p>'}</div>`;
    const mapped=(d.presentHotspots || []).filter(h=>h.asset===exterior && h.approved && UN(h.unit_id));
    const gallery=['gallery','interiors'].includes(media);
    return `<div class="pm-showroom ${media==='floors'?'pm-showroom-floors':''} ${media==='location'?'pm-showroom-location':''}"><nav class="pm-media-rail" aria-label="Project media">${[['intro','▷','Intro'],['exterior','▥','Project'],...(hasFloors?[['floors','▤','Floors']]:[]),['lifestyle','✧','Lifestyle'],['interiors','⌑','Interiors'],['gallery','▦','Gallery'],['amenities','✓','Amenities'],['timeline','◷','Timeline'],...(d.media?.video?.url?[['video','▷','Video']]:[]),['location','◎','Location']].map(([k,icon,t])=>`<button class="pm-media-btn ${media===k?'selected':''}" data-pm="media" data-arg="${k}" aria-pressed="${media===k}"><b aria-hidden="true">${icon}</b>${t}</button>`).join('')}</nav>
      ${media==='intro'?projectIntro(d):['exterior','floors'].includes(media)?`<section class="pm-stage pm-spatial-stage">${PMSpatial.renderStage(spatialContext())}<div class="pm-spatial-unit-entry">${B('Explore residences','residences','','quiet')}${B('Project imagery','media','gallery','quiet')}</div></section>`:media==='location'?PMNeighbourhood.render(neighbourhoodContext()):gallery?`<section class="pm-stage pm-gallery-stage">${projectGalleryHtml(d)}</section>`:`<section class="pm-stage"><img class="pm-stage-photo" src="${esc(media==='interiors'&&variant?variant.url:UN_ASSET+image)}" data-fallback="${esc(UN_ASSET+d.photo)}" alt="${esc(d.name)} — ${media==='interiors'?'project interior imagery, not a configured unit':media==='lifestyle'?'project lifestyle imagery':'exterior'}"><div class="pm-stage-shade"></div>
      <span class="pm-stage-badge">${media==='interiors'?variant?'Approved project style · not a unit specification':s.preferences.style||s.preferences.finish?'Preferred visual unavailable · showing original project imagery':'Original project imagery · not a unit specification':'Project collection'}</span>
      ${media==='exterior'&&mapped.length?`<svg class="pm-hotspots" viewBox="${esc(d.presentViewBox||'0 0 1000 700')}" preserveAspectRatio="xMidYMid slice">${mapped.map(h=>`<polygon points="${esc(h.points)}" tabindex="0" role="button" data-pm="unit" data-arg="${esc(h.unit_id)}" aria-label="${esc(h.unit_id+' · '+UN_STATUS[UN(h.unit_id).status].l)}"><title>${esc(h.unit_id)}</title></polygon>`).join('')}</svg>`:''}
      ${overlay || `<div class="pm-stage-title">${identity(d)}<div class="pm-eyebrow">${esc(d.loc)} · ${esc(d.completion)}</div><h1 tabindex="-1">${esc(d.name)}</h1><p>${esc(d.tag)}</p><div class="pm-row wrap" style="margin-top:24px">${B('Explore residences','residences','','primary')}${B('Discover the lifestyle','media','lifestyle')}${s.ui.focus?B('Show controls','focus'):''}</div></div>`}</section>`}
      ${media==='location'?'':`<aside class="pm-panel">${panel()}</aside>`}</div>`;
  }
  const failedProjectImages=new Set();
  function projectIntro(d) {
    const cover=UN_ASSET+(d.media?.renders?.ext?.[0]?.img||d.photo);
    const url=d.media?.video?.url;
    let video='';
    try{if(url&&['http:','https:'].includes(new URL(url,location.href).protocol))video=url;}catch(_){}
    const auto=!matchMedia('(prefers-reduced-motion: reduce)').matches;
    return `<section class="pm-stage pm-project-intro" aria-label="${esc(d.name)} project introduction"><img class="pm-stage-photo" src="${esc(cover)}" data-fallback="${esc(UN_ASSET+d.photo)}" alt="${esc(d.name)} project hero">${video?`<video class="pm-intro-film" controls playsinline muted ${auto?'autoplay loop':''} preload="metadata" poster="${esc(cover)}" src="${esc(video)}" aria-label="${esc(d.name)} introduction film"></video>`:''}<div class="pm-stage-shade"></div><span class="pm-stage-badge">${video?'Project film · sound off by default':'Project introduction'}</span><div class="pm-stage-title">${identity(d)}<div class="pm-eyebrow">${esc(d.loc)} · ${esc(d.completion)}</div><h1 tabindex="-1">${esc(d.name)}</h1><p>${esc(d.tag)}</p><div class="pm-row wrap pm-intro-actions">${B('Explore project →','media','exterior','primary')}${B('Explore residences','residences')}</div></div><p class="pm-intro-film-status" role="status" hidden></p></section>`;
  }
  function projectImages() {return PMData.projectGallery(s.ui.dev,{kind:s.ui.media==='interiors'?'interior':undefined,preferences:s.preferences}).map(im=>failedProjectImages.has(new URL(im.url,location.href).href)?{...im,url:UN_ASSET+DEV(s.ui.dev).photo,caption:'Project exterior',provenance:'Requested image unavailable · showing project exterior'}:im);}
  function projectGalleryHtml(d) {
    const images=projectImages();
    return `<div class="pm-project-gallery"><header><div class="pm-eyebrow">${esc(d.name)}</div><h1 tabindex="-1">${s.ui.media==='interiors'?'Interiors':'The gallery'}</h1><p class="pm-muted">${images.length} images · select any image to explore fullscreen</p></header><div class="pm-project-images">${images.map((im,n)=>`<figure><button data-pm="viewProjectImage" data-arg="${n}" aria-label="Open ${esc(im.caption)} fullscreen"><img src="${esc(im.url)}" data-fallback="${esc(UN_ASSET+d.photo)}" alt="${esc(im.caption)}" loading="lazy"></button><figcaption><strong>${esc(im.caption)}</strong><small>${esc(im.provenance)}</small></figcaption></figure>`).join('')||'<p class="pm-empty">No images supplied for this collection.</p>'}</div></div>`;
  }
  function openProjectMedia(index) {window.PMViewer.open({root,items:projectImages(),index,title:DEV(s.ui.dev).name,onClose:()=>render()});}
  // Preview state belongs to this presentation, never to the saved specification.
  function unitGalleryData(uid) {
    return window.PMData.unitGallery(item(uid),s.ui.unitPreview?.[uid] || {});
  }
  function reconcileUnitPreview(uid, gallery=unitGalleryData(uid)) {
    s.ui.unitPreview ||= {};
    const preview=s.ui.unitPreview[uid] ||= {layout:gallery.layout,style:gallery.style};
    // Keep an explicit request intact if an asset disappears; PMData labels its fallback.
    if(!Object.prototype.hasOwnProperty.call(preview,'layout')) preview.layout=gallery.layout;
    if(!Object.prototype.hasOwnProperty.call(preview,'style')) preview.style=gallery.style;
    let index=gallery.items.findIndex(image=>image.key===preview.imageKey);
    if(index<0 && preview.room) index=gallery.items.findIndex(image=>image.room===preview.room);
    if(index<0) index=0;
    const image=gallery.items[index];
    preview.index=index; preview.imageKey=image?.key || null; preview.room=image?.room || null;
    return preview;
  }
  function setUnitPreview(uid, field, value) {
    if(!UN(uid) || !['previewLayout','previewStyle'].includes(field)) return false;
    if(!item(uid)) touch(uid);
    const gallery=unitGalleryData(uid), key=field==='previewLayout'?'layout':'style';
    if(!gallery[key==='layout'?'layouts':'styles'].some(option=>option.id===value && !option.disabled)) return false;
    const preview=reconcileUnitPreview(uid,gallery);
    preview[key]=value;
    const resolved=unitGalleryData(uid);
    preview.layout=resolved.layout; preview.style=resolved.style;
    reconcileUnitPreview(uid,resolved);
    return true;
  }
  function openUnitMedia(uid,index=0) {
    if(!root || !UN(uid) || !window.PMViewer) return;
    if(!item(uid)) touch(uid);
    const gallery=unitGalleryData(uid), preview=reconcileUnitPreview(uid,gallery);
    if(!gallery.items.length) return;
    index=Number(index);
    index=Number.isInteger(index)?Math.max(0,Math.min(index,gallery.items.length-1)):preview.index;
    const image=gallery.items[index];
    preview.index=index; preview.imageKey=image.key; preview.room=image.room || null;
    window.PMViewer.open({root,items:gallery.items,index,title:uid+' · '+UN(uid).dev,onIndex:(n,image)=>{preview.index=n;preview.imageKey=image.key;preview.room=image.room||null;},onClose:()=>render()});
  }
  function openPlanMedia(uid) {
    if(!root || !UN(uid) || !window.PMViewer) return;
    if(!item(uid)) touch(uid);
    const media=window.PMData.plan(uid,item(uid)?.config);
    if(media) window.PMViewer.open({root,items:[media],title:uid+' · Saved specification plan',onClose:()=>render()});
  }
  function detailFacts(uid) {
    const details=window.PMData.details(uid);
    return `<section class="pm-card pm-card-body pm-stack pm-detail-facts"><h2>Residence details</h2><dl class="pm-detail-grid">${details.facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>${details.rooms.length?`<h3>Rooms</h3><ul class="pm-detail-rooms">${details.rooms.map(room=>`<li><strong>${esc(room.name)}</strong><span>${esc([room.area!=null?room.area+' m²':null,room.dimensions].filter(Boolean).join(' · ') || 'Dimensions not supplied')}</span></li>`).join('')}</ul>`:''}${details.features.length?`<h3>Features</h3><ul class="pm-detail-features">${details.features.map(feature=>`<li>${esc(feature)}</li>`).join('')}</ul>`:''}</section>`;
  }
  function unitFactSummary(uid) {
    return window.PMData.details(uid).facts.filter(f=>['Bedrooms','Bathrooms','Internal area','Outdoor area','Floor','Views'].includes(f.label)).map(f=>f.label+': '+f.value).join(' · ');
  }
  function inventorySummary(id) {
    const stock=window.PMData.stats(id);
    return `${esc(stock.available)} available · ${esc(stock.registered)} registered units · ${stock.total===null?'Development total not confirmed':esc(stock.total)+' confirmed development total'}`;
  }
  function previewSelector(title,field,choices,chosen) {
    return `<label class="pm-field">${esc(title)}<select data-field="${esc(field)}" ${choices.some(choice=>!choice.disabled)?'':'disabled'}>${chosen==null?'<option value="" selected>No supported unit visual</option>':''}${choices.map(choice=>`<option value="${esc(choice.id)}" ${choice.id===chosen?'selected':''} ${choice.disabled?'disabled':''}>${esc(choice.name)}${choice.disabled?' — unavailable':''}</option>`).join('')}</select></label>`;
  }
  function planThumbnail(uid) {
    const media=window.PMData.plan(uid,item(uid)?.config);
    if(!media) return '<span class="pm-detail-no-plan">Plan not supplied</span>';
    return `<button type="button" class="pm-detail-plan-thumb" data-pm="viewPlan" data-arg="${esc(uid)}" aria-label="${esc('Open '+uid+' floor plan · '+media.provenance)}"><span class="pm-detail-plan-media" aria-hidden="true">${media.html || `<img loading="lazy" src="${esc(media.url)}" alt="">`}</span><span>${esc(media.caption)}</span></button>`;
  }
  function comparisonRowsMarkup(rows,columnCount) {
    let group=null;
    return rows.map(row=>{
      const heading=row.group!==group?`<tr class="pm-detail-compare-group"><th colspan="${columnCount+1}" scope="colgroup">${esc(row.group)}</th></tr>`:'';
      group=row.group;
      return `${heading}<tr class="${new Set(row.values).size>1?'pm-different ':''}${row.highlight?'pm-detail-priority':''}"><th scope="row">${esc(row.label)}${row.highlight?'<span class="pm-detail-priority-label">Lens priority</span>':''}</th>${row.values.map((value,index)=>`<td class="${row.bestIndex===index?'pm-detail-best':''}">${esc(value)}</td>`).join('')}</tr>`;
    }).join('') || `<tr><td colspan="${columnCount+1}">No differences in the supplied comparison facts. Turn off “Differences only” to see all facts.</td></tr>`;
  }
  function plan(uid) {
    const media=window.PMData.plan(uid,item(uid)?.config);
    if(!media) return '<section class="pm-plan pm-detail-plan"><h3>Floor plan</h3><p>Plan not supplied for this residence.</p></section>';
    return `<section class="pm-plan pm-detail-plan"><div class="pm-row between wrap"><div><h3>Saved specification plan</h3><p class="pm-muted">${esc(media.provenance)}</p></div>${B('Open floor plan ↗','viewPlan',uid)}</div><button type="button" class="pm-detail-plan-open" data-pm="viewPlan" data-arg="${esc(uid)}" aria-label="${esc('Open '+uid+' floor plan fullscreen')}">${media.html || `<img src="${esc(media.url)}" alt="${esc(media.caption)}">`}</button><p class="pm-muted">${esc(media.caption)}</p><p class="pm-muted">${Number.isFinite(media.northBearing)?'North bearing: '+esc(media.northBearing)+'°':'Plan orientation not supplied.'} Visual preview layouts do not change this plan.</p></section>`;
  }
  function configPanel() {
    const uid=s.ui.unit,i=item(uid),u=UN(uid),c=i.config,readOnly=!available(uid);
    return `<div class="pm-config pm-stack"><div><div class="pm-eyebrow">The residence</div><h2>The details, considered.</h2></div>${readOnly?`<div class="pm-note">${esc(UN_STATUS[u.status].l)} · For reference only.</div>`:''}
      <section class="pm-stack"><h3>Saved specification</h3><p>${esc(labelCfg(c))}</p><div class="pm-swatches">${CR_PACK(c.pack).swatches.map(sw=>`<span class="pm-swatch" style="${crTexStyle(sw.k,sw.c)}" title="${esc(sw.m)}"></span>`).join('')}</div><p class="pm-muted">${esc(CR_PACK(c.pack).swatches.map(sw=>sw.m).join(' · '))}</p></section>
      <div><div class="pm-muted">Price for this specification</div><div class="pm-price">${money(price(uid,c))}</div></div>
      <section class="pm-note"><h3>Presentation preference</h3><p>${esc(preferenceSummary())}</p>${B('Change preferences','preferences','','quiet')}<p>Visual only. No specification or price changes.</p></section>
      ${B(i.is_shortlisted?'Remove from shortlist':'Add to shortlist','shortUnit',uid,'primary',readOnly&&!i.is_shortlisted)}${B(i.request_note?'Edit request note':'Add a request note','note',uid)}
      <p class="pm-muted">Layout changes, furnishing and bespoke renders can follow in Custom Pack. Nothing is generated during your presentation.</p></div>`;
  }
  function unit() {
    const uid=s.ui.unit,u=UN(uid); if(!u) return portfolio();
    const i=touch(uid),gallery=unitGalleryData(uid),preview=reconcileUnitPreview(uid,gallery),image=gallery.items[preview.index];
    return `<div class="pm-page pm-details"><div class="pm-heading"><div><div class="pm-eyebrow">${esc(u.dev)} · ${esc(DEV(u.dev)?.loc)}</div><h1 tabindex="-1">A closer look at ${esc(uid)}.</h1><p>${esc(u.type)} · ${esc(unitFactSummary(uid))}</p></div><div class="pm-row wrap">${status(uid)}${B('Options','config')}${B('Back','back')}</div></div>
      <div class="pm-unit-layout"><div class="pm-stack"><section class="pm-card pm-detail-gallery"><div class="pm-card-body pm-stack"><div class="pm-row between wrap"><h2>Explore the spaces</h2>${B('Floor plan ↗','viewPlan',uid,'',!window.PMData.plan(uid,i.config))}${B('Gallery ↗','viewUnitGallery',uid,'',!gallery.items.length)}</div><div class="pm-detail-preview-controls">${previewSelector('Layout · visual preview','previewLayout',gallery.layouts,gallery.layout)}${previewSelector('Style · visual preview','previewStyle',gallery.styles,gallery.style)}</div><p class="pm-muted">Visual exploration only. Your saved layout, finish pack and price stay unchanged.</p></div>${image?`<figure class="pm-detail-hero"><button type="button" data-pm="viewUnitImage" data-arg="${preview.index}" aria-label="${esc('Open '+image.caption+' fullscreen')}"><img src="${esc(image.url)}" alt="${esc(image.caption)}"><span class="pm-detail-expand" aria-hidden="true">View fullscreen ↗</span></button><figcaption><strong>${esc(image.caption)}</strong><span>${esc(image.provenance)}</span></figcaption></figure><div class="pm-detail-thumbnails" aria-label="Residence gallery">${gallery.items.map((shot,index)=>`<button type="button" class="pm-detail-thumbnail" data-pm="viewUnitImage" data-arg="${index}" aria-label="${esc('Open '+shot.caption+' · '+shot.provenance)}" aria-current="${index===preview.index?'true':'false'}"><img loading="lazy" src="${esc(shot.url)}" alt=""><span>${esc(shot.room || shot.caption)}</span></button>`).join('')}</div>`:'<div class="pm-card-body"><p class="pm-muted">No imagery is attached. Explore the supplied residence details and floor plan below.</p></div>'}</section>${plan(uid)}${detailFacts(uid)}${i.request_note?`<section class="pm-note"><h3>Your request</h3><p>${esc(i.request_note)}</p></section>`:''}</div><aside class="pm-card pm-detail-spec">${configPanel()}</aside></div></div>`;
  }
  function shortlist() {
    const devs=selectedDevs(),items=selected(),isDev=s.ui.shortlistView==='developments';
    const compareUnits=s.ui.compare.filter(available),compareDevs=s.ui.compareDevs.filter(id=>DEV(id));
    return `<div class="pm-page pm-detail-shortlist"><div class="pm-heading"><div><div class="pm-eyebrow">Your favourites, together</div><h1 tabindex="-1">The places you connected with.</h1><p>All your shortlisted residences, grouped by development. Choose up to four units or three introduced developments to compare.</p></div>${B('Return to tour','back')}</div><div class="pm-stack"><div class="pm-segment">${B('Units','shortView','units',!isDev?'selected':'')}${B('Developments','shortView','developments',isDev?'selected':'')}</div>
      ${!items.length?'<div class="pm-empty">A little space for your favourites.<br>Shortlist a development or a unit as you explore.</div>':devs.map(id=>{
        const d=DEV(id),units=items.filter(i=>i.development_id===id&&i.unit_id);
        if(!d) return '';
        return `<section class="pm-card pm-card-body"><div class="pm-row between wrap"><div><h2>${esc(d.name)}</h2><p>${inventorySummary(id)}</p></div>${B('Open','dev',id)}</div>${isDev?`<p>${esc(units.length)} shortlisted units</p><label class="pm-check"><input type="checkbox" data-field="compareDev.${esc(id)}" ${compareDevs.includes(id)?'checked':''} ${!s.ui.visited.includes(id)||(!compareDevs.includes(id)&&compareDevs.length>=3)?'disabled':''}>Compare this development</label>${!s.ui.visited.includes(id)?'<p class="pm-muted">Introduce this development before comparing.</p>':''}${B('Remove development interest','removeDev',id,'quiet')}`:units.map(i=>{
          const uid=i.unit_id,u=UN(uid),isAvailable=available(uid),interest=['unset','interested','favourite'].includes(i.interest)?i.interest:'unset';
          const count=window.PMData.marketInterest(uid,s.opportunity_id,s.contact_id);
          return `<article class="pm-detail-short-unit"><div class="pm-detail-short-media">${planThumbnail(uid)}</div><div class="pm-stack"><div class="pm-row between wrap"><button type="button" class="pm-unit-open" data-pm="unit" data-arg="${esc(uid)}"><strong>${esc(uid)}</strong><small>${esc(u?.type || 'Residence record unavailable')}</small></button>${status(uid)}</div><p>${esc(unitFactSummary(uid))}</p><div class="pm-detail-saved"><span class="pm-muted">Saved specification</span><p>${esc(labelCfg(i.config))}</p><strong>${u?esc(money(price(uid,i.config))):'Price not supplied'}</strong></div><p class="pm-detail-market">${esc(count)} other active ${count===1?'opportunity':'opportunities'} · aggregated prototype data, not a reservation or demand forecast.</p>${!isAvailable?'<p class="pm-note">Read-only inventory status · retained in your shortlist history; excluded from comparison and deliverables.</p>':''}${i.added_at?`<p class="pm-muted">Added to selection: ${esc(i.added_at)}</p>`:''}${i.request_note?`<p class="pm-muted">Request: ${esc(i.request_note)}</p>`:''}<div class="pm-row wrap"><label class="pm-check"><input type="checkbox" data-field="compareUnit.${esc(uid)}" ${compareUnits.includes(uid)?'checked':''} ${!isAvailable||(!compareUnits.includes(uid)&&compareUnits.length>=4)?'disabled':''}>Compare ${esc(uid)}</label><label class="pm-field">Buyer interest<select data-field="interest.${esc(uid)}">${options([['unset','Not set'],['interested','Interested'],['favourite','Favourite']],interest)}</select></label>${B('Request note','note',uid,'quiet')}${B('Remove','shortUnit',uid,'quiet')}</div></div></article>`;
        }).join('')||'<p class="pm-muted">Interested in this development. No unit chosen yet.</p>'}</section>`;
      }).join('')}
      <div class="pm-note">${esc(eligible().length)} available shortlisted units · Combined configured price ${esc(money(eligible().reduce((n,i)=>n+price(i.unit_id,i.config),0)))}</div>
      <div class="pm-footer">${B('Compare '+(isDev?'developments':'units'),'openComparison',isDev?'developments':'units','primary',isDev?compareDevs.length<2||compareDevs.length>3||compareDevs.some(id=>!s.ui.visited.includes(id)):compareUnits.length<2||compareUnits.length>4)}${B('Continue to checkout →','end')}</div>
      <p class="pm-muted">Introduce each development before comparing it. Unavailable units stay in your history, not your deliverables.</p></div></div>`;
  }
  function unitRows(entries=s.ui.compare.filter(available).slice(0,4).map(item).filter(Boolean)) {
    return window.PMData.unitRows(entries,{lens:s.lens,pricesHidden:s.prices_hidden,priceFor:(u,c)=>price(u.id,c),diffOnly:!!s.ui.diffOnly});
  }
  function devRows(ids=s.ui.compareDevs.filter(id=>DEV(id)).slice(0,3)) {
    return window.PMData.devRows(ids,{lens:s.lens,pricesHidden:s.prices_hidden,diffOnly:!!s.ui.diffOnly});
  }
  function comparison(developments=s.ui.compareMode==='developments',print=false) {
    const ids=developments?s.ui.compareDevs.filter(id=>DEV(id)).slice(0,3):s.ui.compare.filter(available).slice(0,4);
    const entries=developments?ids:ids.map(item).filter(Boolean);
    const switcher=`<div class="pm-segment pm-compare-switch" aria-label="Comparison type">${B('Units','compareMode','units',!developments?'selected':'')}${B('Developments','compareMode','developments',developments?'selected':'')}</div>`;
    if(entries.length<2) return `<div class="pm-page"><div class="pm-heading"><div><div class="pm-eyebrow">Side by side</div><h1 tabindex="-1">A clearer picture.</h1></div>${switcher}</div><div class="pm-empty">Choose at least two ${developments?'introduced developments':'available units'} to compare.</div><div class="pm-footer">${B('Edit selection','shortlist')}${B('Continue to checkout →','end','','primary')}</div></div>`;
    const rows=developments?devRows(entries):unitRows(entries);
    const table=`<div class="pm-compare-scroll pm-detail-comparison" tabindex="0" role="region" aria-label="${developments?'Development':'Unit'} comparison"><table class="pm-table pm-detail-table pm-detail-columns-${entries.length}"><caption class="pm-detail-table-caption">${esc(lenses[s.lens])} · ${developments?'Development':'Saved unit specification'} comparison${s.ui.diffOnly?' · Differences only':''}</caption><thead><tr><th scope="col">${esc(lenses[s.lens])}</th>${entries.map(e=>{
      const d=DEV(developments?e:e.development_id);
      if(developments) {
        const shot=window.PMData.projectGallery(e)[0];
        return `<th scope="col" class="pm-detail-column-head">${shot?`<figure class="pm-detail-column-image"><img loading="lazy" src="${esc(shot.url)}" alt="${esc(shot.caption)}"><figcaption>${esc(shot.provenance)}</figcaption></figure>`:''}<div class="pm-eyebrow">${esc(d?.loc)}</div><h3>${esc(d?.name)}</h3><p>${esc(d?.completion)}</p><p class="pm-muted">${inventorySummary(e)}</p>${!print?B('Explore','dev',e,'quiet'):''}</th>`;
      }
      const uid=e.unit_id,u=UN(uid),gallery=unitGalleryData(uid),shot=gallery.items[0];
      return `<th scope="col" class="pm-detail-column-head"><div class="pm-eyebrow">${esc(d?.name)}</div><h3>${esc(uid)}</h3><p>${esc(u?.type)}</p>${print?`<p class="pm-muted">${esc(window.PMData.plan(uid,e.config)?.provenance || 'Plan not supplied')}</p>`:planThumbnail(uid)}<p class="pm-muted">${esc(labelCfg(e.config))}</p><p>${esc(money(price(uid,e.config)))}</p>${shot?`<p class="pm-muted pm-detail-media-label">${esc(shot.provenance)}</p>`:''}${!print?`<div class="pm-row wrap">${B('Gallery ↗','viewUnitGallery',uid,'',!gallery.items.length)}${B('Explore','unit',uid,'quiet')}</div>`:''}</th>`;
    }).join('')}</tr></thead><tbody>${comparisonRowsMarkup(rows,entries.length)}</tbody></table></div>`;
    if(print) return table;
    return `<div class="pm-page"><div class="pm-heading"><div><div class="pm-eyebrow">Side by side</div><h1 tabindex="-1">${developments?'Different places. Your priorities.':'The details that make a difference.'}</h1><p>${developments?'Only supplied project facts are compared. Missing attributes are marked —.':'Saved specifications and prices, not visual previews. Shaded rows highlight differences.'}</p></div>${switcher}</div><div class="pm-row wrap pm-compare-controls">${select('What matters most','lens',Object.entries(lenses),s.lens)}${check('Differences only','diffOnly',!!s.ui.diffOnly)}${B('Edit selection','shortlist')}</div>${table}<div class="pm-footer">${B('Back to shortlist','shortlist')}${B('Continue to checkout →','end','','primary')}</div></div>`;
  }
  function closing() { return `<div class="pm-center">${brand()}<h1 tabindex="-1">Thank you for exploring.</h1><p class="pm-muted">${esc(DEV(s.ui.dev)?.name || 'The Bricly collection')}</p><p>${esc(UN_REP)} · Your property advisor</p><div class="pm-row wrap">${B('Return to the showroom','returnTour','','quiet')}${B('Sharing stopped / screen turned back →','ack','','primary')}</div><p class="pm-muted">Continue only when this screen is no longer visible to the buyer.</p></div>`; }

  // Present-specific checkout. The newer CRM Compare checkout stays intact.
  function checkout() {
    const ui=s.ui, excluded=selected().filter(i=>i.unit_id&&!available(i.unit_id));
    const output=ui.output&&store.outputs[ui.output];
    return `<div class="pm-page pm-checkout"><div class="pm-heading"><div><div class="pm-eyebrow">Rep workspace · not for screen sharing</div><h1 tabindex="-1">Keep the conversation going.</h1><p>Send the shortlist first. Personalised renders can follow.</p></div>${B('Save session only','saveOnly')}</div>
      <div class="pm-check-grid"><div class="pm-stack"><section class="pm-card pm-card-body pm-stack"><h3>Attach to the right record</h3>
      ${select('Link to','linkType',[['opportunity','Existing opportunity'],['contact','Existing contact'],['new','New contact']],ui.linkType)}
      ${ui.linkType==='opportunity'?select('Opportunity','linkId',[['','Choose an opportunity'],...OPPS.map(o=>[o.id,o.lead+' · '+o.id])],ui.linkId):ui.linkType==='contact'?select('Contact','linkId',[['','Choose a contact'],...CONTACTS.map(c=>[c.id,c.name])],ui.linkId):`${field('Name (required)','name',ui.name)}${field('Email (optional)','email',ui.email,'email')}${field('Phone (optional)','phone',ui.phone,'tel')}`}
      </section><section class="pm-card pm-card-body pm-stack"><h3>Your deliverables</h3>${check('Interactive local preview','link',ui.link)}${check('Printable shortlist / Save as PDF','pdf',ui.pdf)}${check('Include unit comparison','includeComparison',ui.includeComparison)}${check('Include developments considered','includeDevelopments',ui.includeDevelopments)}<p class="pm-muted">Price mode: ${s.prices_hidden?'On request':'Show configured prices'}</p><div class="pm-note">Prototype: links work in this browser profile only. WhatsApp and email are explicit simulations; no message is actually sent.</div></section></div>
      <aside class="pm-card pm-card-body pm-stack"><h3>Your shortlist</h3>${eligible().map(i=>`<div><strong>${esc(i.unit_id)}</strong><p class="pm-muted">${esc(labelCfg(i.config))}</p><p>${money(price(i.unit_id,i.config))}</p></div>`).join('')}${selectedDevs().map(id=>`<p>${esc(DEV(id).name)}</p>`).join('')||'<p class="pm-muted">Nothing shortlisted. You can save this session without creating a contact.</p>'}${excluded.length?`<div class="pm-note pm-warning">Excluded from deliverables: ${excluded.map(i=>esc(i.unit_id)).join(', ')}. Availability changed or these units were already unavailable.</div>`:''}</aside></div>
      <div class="pm-footer">${output?`${B('Preview shortlist','preview')}${ui.pdf?B('Print / Save PDF','print'):''}${B('Share shortlist','share','','primary')}`:B('Prepare shortlist →','prepare','','primary',!canPrepare())}</div></div>`;
  }
  function canPrepare() {
    const ui=s.ui;
    return (eligible().length>0 || selected().some(i=>!i.unit_id)) && (ui.pdf||ui.link) &&
      (ui.linkType==='new'?!!ui.name.trim():ui.linkType==='contact'?CONTACTS.some(c=>c.id===ui.linkId):OPPS.some(o=>o.id===ui.linkId));
  }
  function linkRecord() {
    const ui=s.ui; let o, c;
    if(ui.linkType==='opportunity') { o=OPPS.find(o=>o.id===ui.linkId); c=CONTACTS.find(c=>c.oppIds?.includes(o?.id)); }
    else {
      c=ui.linkType==='contact'?CONTACTS.find(c=>c.id===ui.linkId):null;
      if(!c && ui.linkType==='new') {
        c={id:uuid('contact'),name:ui.name.trim(),email:ui.email.trim(),phone:ui.phone.trim(),type:'lead',status:'active',btype:'',company:'',nat:'',lang:'English',source:'Present mode',rep:UN_REP,tags:[],oppIds:[],consent:{wa:false,em:false,sms:false},notesList:[],created:now(),last:'Today',lastD:now(),bmin:0,bmax:0}; CONTACTS.push(c);
      }
      if(!c) return false;
      o=OPPS.find(o=>o.id===s.opportunity_id && c.oppIds.includes(o.id));
      if(!o) {
        const max=Math.max(0,...eligible().map(i=>price(i.unit_id,i.config)));
        o={id:uuid('OPP'),lead:c.name,devs:[],units:[],stage:'Qualified',source:'Present mode',budget:Math.ceil(max/50000)*50,value:Math.round(max/1000),tags:[],rep:UN_REP,next:{d:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'}),t:'Follow up on shortlist'},ago:'Today'}; OPPS.push(o); c.oppIds.push(o.id);
      }
    }
    if(!o) return false;
    o.devs=[...new Set([...o.devs,...selectedDevs().map(id=>DEV(id).name)])]; o.units=[...new Set([...o.units,...eligible().map(i=>i.unit_id)])];
    s.opportunity_id=o.id; s.contact_id=c?.id || null; selection().opportunity_id=o.id; selection().contact_id=c?.id || null;
    ui.linkType='opportunity'; ui.linkId=o.id;
    const x=getExt(o); x.unitConfigs ||= {}; eligible().forEach(i=>{x.unitConfigs[i.unit_id]=recordConfig(i.unit_id,{...i.config,style:i.style,modifier:i.request_note});});
    write(); return true;
  }
  function log(kind,text) {
    const o=OPPS.find(o=>o.id===s.opportunity_id); if(!o) return;
    const x=getExt(o); x.comms ||= [];
    const key=s.id+':'+kind;
    if(!x.comms.some(e=>e.presentKey===key)) x.comms.unshift({ch:'sys',t:'Just now',text,presentKey:key});
  }
  function outputKey() {
    return JSON.stringify({items:selected().map(i=>[i.unit_id||i.development_id,i.unit_id?UN(i.unit_id)?.status:'development',i.config,i.request_note,i.style,i.visual_preference,i.unit_id?price(i.unit_id,i.config):null]),preferences:s.preferences,hidden:s.prices_hidden,lens:s.lens,compare:s.ui.compare,link:s.ui.link,pdf:s.ui.pdf,includeComparison:s.ui.includeComparison,includeDevelopments:s.ui.includeDevelopments});
  }
  function prepare() {
    reconcile(false); if(!canPrepare()) { message='Choose eligible shortlist items, a recipient record and at least one deliverable.'; render(); return; }
    if(s.ui.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.ui.email)) { message='Please check the email address, or leave it blank.'; render(); return; }
    if(!linkRecord()) return;
    const id=uuid('shortlist');
    store.outputs[id]={id,session_id:s.id,created_at:now(),signature:outputKey(),price_mode:s.prices_hidden?'request':'show',lens:s.lens,preferences:clone(s.preferences),items:clone(selected().filter(i=>!i.unit_id||available(i.unit_id))),compare:s.ui.includeComparison?s.ui.compare.filter(available).slice(0,4):[],developments:s.ui.includeDevelopments?selectedDevs():[],buyer:OPPS.find(o=>o.id===s.opportunity_id)?.lead || '',pdf:s.ui.pdf,link:s.ui.link};
    s.ui.output=id; s.ui.shared=null; log('saved','Presentation session saved'); write(); render();
  }
  function outputURL() { const url=new URL(location.href); url.hash='shortlist='+s.ui.output; return url.href; }
  function validOutput() {
    const o=store.outputs[s.ui.output];
    if(!o || o.signature!==outputKey()) { s.ui.output=null; message='Your shortlist changed. Prepare it again before sharing.'; nav('checkout'); return false; }
    return true;
  }
  function shareDialog() {
    const c=CONTACTS.find(c=>c.id===s.contact_id),o=OPPS.find(o=>o.id===s.opportunity_id);
    const text=`Hi ${o?.lead || 'there'}, here is your shortlist: ${eligible().map(i=>i.unit_id+' ('+labelCfg(i.config)+')').join(', ') || selectedDevs().map(id=>DEV(id).name).join(', ')}. ${s.prices_hidden?'Prices on request.':''}`;
    return `<div class="pm-stack"><p>${esc(text)}</p><label class="pm-field">Local preview link<input readonly value="${esc(outputURL())}"></label><p class="pm-muted">Local prototype link — not a public buyer link. Email and WhatsApp below simulate a send without contacting anyone.</p>${B('Copy local link','copy','','primary',sharingBusy||!s.ui.link)}${B('Simulate WhatsApp send','send','wa','',sharingBusy||!c?.phone)}${B('Simulate email send','send','em','',sharingBusy||!c?.email)}${!c?.phone&&!c?.email?'<p class="pm-muted">No phone or email is attached. Copy remains available.</p>':''}${s.ui.pdf?B('Print / Save PDF','print'):''}</div>`;
  }
  async function share(channel) {
    if(sharingBusy || !validOutput()) return;
    const sessionId=s.id,outputId=s.ui.output;
    sharingBusy=true;
    try {
      if(channel==='copy') { if(!s.ui.link) return; await navigator.clipboard.writeText(outputURL()); }
      else { const c=CONTACTS.find(c=>c.id===s.contact_id); if(!(channel==='wa'?c?.phone:c?.email)) return; }
      if(!s || s.id!==sessionId || s.ui.output!==outputId) return;
      if(!validOutput()) return;
      const outcome=channel==='copy'?'Copied local link':`Simulated ${channel==='wa'?'WhatsApp':'email'} send`;
      s.ui.shared={channel,outcome,at:now()}; s.outcome=channel==='copy'?'shortlist_copied':'shortlist_sent_demo';
      log(s.ui.output+':'+channel,outcome+' — '+eligible().map(i=>i.unit_id).join(', '));
      const o=OPPS.find(o=>o.id===s.opportunity_id); if(o) {
        const sh=ensureShared(o,getExt(o)),key=s.ui.output+':'+channel;
        if(!sh.some(x=>x.presentKey===key)) sh.unshift({n:'Presentation shortlist',d:eligible().length+' available units · '+selectedDevs().length+' developments',eng:outcome+' · prototype',presentKey:key});
      }
      nav('ready');
    } catch(e) { if(s?.id===sessionId){message='Clipboard access was denied. Select and copy the link manually; no send or copy has been logged.';render();} }
    finally { sharingBusy=false; }
  }
  function ready() {
    const o=OPPS.find(o=>o.id===s.opportunity_id);
    return `<div class="pm-center">${brand()}<div class="pm-eyebrow">${esc(s.ui.shared?.outcome || 'Shortlist ready')}</div><h1 tabindex="-1">A good place to continue.</h1><p class="pm-muted">${esc(o?.lead || 'Your buyer')} · ${eligible().length} available units<br>${s.ui.shared?.channel==='copy'?'Copied only. No message has been sent.':'Prototype simulation. No message has been delivered.'}</p><div class="pm-row wrap">${B('View shortlist','preview')}${B('Follow up with personalised renders','followup','','primary',!s.ui.shared||!eligible().length)}${B('Done','done')}</div><p class="pm-muted">Renders are a concierge follow-up, never a gate to sharing the shortlist.</p></div>`;
  }
  function preview() {
    const out=store.outputs[s.ui.output]; if(!out) return '<div class="pm-empty">This local shortlist is not available in this browser.</div>';
    const rows=out.items.filter(i=>!i.unit_id||available(i.unit_id));
    const removed=out.items.filter(i=>i.unit_id&&!available(i.unit_id));
    const cash=n=>out.price_mode==='request'?'On request':fmtEur(n);
    return `<div class="pm-page pm-checkout"><div class="pm-heading"><div><div class="pm-eyebrow">Your property shortlist</div><h1 tabindex="-1">The places you connected with.</h1><p>${esc(out.buyer)} · Prepared ${esc(new Date(out.created_at).toLocaleDateString())}</p></div><div class="pm-no-print">${out.pdf?B('Print / Save PDF','printNow'):''}${!s.ui.publicPreview?B('Back','previewBack'):''}</div></div>
      ${out.preferences?.style||out.preferences?.finish?`<div class="pm-note pm-preview-preferences"><strong>Your presentation preferences</strong><p>${esc([CR_STYLE(out.preferences.style)?.name,CR_PACK(out.preferences.finish)?.name].filter(Boolean).join(' · '))}. Visual preferences for review, not changes to the saved specifications or prices.</p></div>`:''}
      ${removed.length?`<div class="pm-note">${removed.length} unit(s) are no longer available and have been removed from this preview.</div>`:''}<div class="pm-grid">${rows.map(i=>{const d=DEV(i.development_id);return `<article class="pm-card">${photo(d)}<div class="pm-card-body"><div class="pm-eyebrow">${esc(d.name)}</div><h2>${esc(i.unit_id||'Development interest')}</h2>${i.unit_id?`<p>${esc(labelCfg(i.config))}</p><strong>${cash(i.configured_price)}</strong><p>${esc(UN(i.unit_id).views.join(' · '))}</p>${i.request_note?`<p>Request: ${esc(i.request_note)}</p>`:''}`:`<p>${esc(d.tag)}</p>`}</div></article>`;}).join('')}</div>
      ${out.compare.filter(available).length>=2?`<section style="margin-top:32px"><h2>Side by side</h2>${previewCompare(out)}</section>`:''}${out.developments.length?`<section style="margin-top:32px"><h2>Developments considered</h2>${out.developments.map(id=>`<div class="pm-unit-row"><strong>${esc(DEV(id).name)}</strong><span>${esc(DEV(id).loc)} · ${esc(DEV(id).completion)}</span></div>`).join('')}</section>`:''}<p class="pm-muted" style="margin-top:32px">Local prototype preview. Availability can change. Illustrations are not contractual.</p></div>`;
  }
  function previewCompare(out) {
    const entries=out.compare.filter(available).map(uid=>out.items.find(i=>i.unit_id===uid)).filter(Boolean);
    const cash=n=>out.price_mode==='request'?'On request':fmtEur(n);
    const rows=[['Configuration',i=>labelCfg(i.config)],['Configured price',i=>cash(i.configured_price)],['Price / m²',i=>cash(Math.round(i.configured_price/UN(i.unit_id).sqm))],['Area',i=>UN(i.unit_id).sqm+' m²'],['Beds',i=>UN(i.unit_id).beds],['Completion',i=>UN(i.unit_id).ready]];
    return `<div class="pm-compare-scroll"><table class="pm-table"><thead><tr><th>Details</th>${entries.map(i=>`<th>${esc(i.unit_id)}</th>`).join('')}</tr></thead><tbody>${rows.map(([t,f])=>`<tr><th>${t}</th>${entries.map(i=>`<td>${esc(f(i))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function followup(replace=false) {
    if(!s.ui.shared || !eligible().length) return;
    const o=OPPS.find(o=>o.id===s.opportunity_id); if(!o) { message='Link an opportunity before starting a Custom Pack.'; nav('checkout'); return; }
    if(crHasDraft(o) && !replace) { openDrawer('draft'); return; }
    const seed=crFreshState(o); seed.step=2; seed.unitIds=eligible().map(i=>i.unit_id); seed.extraUnits=seed.unitIds.filter(uid=>!o.units.includes(uid));
    seed.cfg={}; eligible().forEach(i=>{
      const pref=i.visual_preference || s.preferences,requested=CR_STYLE(pref.style),finish=CR_PACK(pref.finish);
      const style=CR_PACK(i.config.pack).styles.includes(requested?.id)?requested.id:i.style||CR_PACK(i.config.pack).styles[0];
      const preferenceNote=[requested?'Preferred visual style: '+requested.name:'',finish?'Preferred finish for review: '+finish.name+' (not applied to specification or price)':''].filter(Boolean).join('. ');
      seed.cfg[i.unit_id]={...crMkCfg(i.unit_id),...i.config,style,modifier:[i.request_note,preferenceNote].filter(Boolean).join('\n')};
    });
    seed.presentPreferences=clone(s.preferences);
    seed.activeCfg=seed.unitIds[0]; seed.applyAll=false; seed.priceMode=s.prices_hidden?'request':'show'; seed.presentSelectionId=selection().id;
    s.outcome='pack_started'; log('pack','Custom Pack started from presentation shortlist'); write();
    if(replace) delete getExt(o).crDraft;
    s.ui.origin.compare=false; close(); crOpen(o.id,seed);
  }
  function openDrawer(kind,uid) { returnFocus=document.activeElement; drawer=kind; if(uid)noteId=uid; render(); root.querySelector('.pm-overlay textarea,.pm-overlay button,.pm-overlay input')?.focus(); }
  function closeDrawer() { recognition?.stop(); recognition=null; drawer=null; noteId=null; render(); if(returnFocus?.isConnected) returnFocus.focus(); else root.querySelector('[data-pm="shortlist"]')?.focus(); }
  function drawerHtml() {
    const titles={panel:DEV(s.ui.dev)?.name,config:'Residence details',note:'A request for later',share:'Share shortlist',draft:'A Custom Pack draft already exists'};
    let content='';
    if(drawer==='panel')content=panel(); if(drawer==='config')content=configPanel();
    if(drawer==='note')content=`<div class="pm-stack"><p class="pm-muted">${esc(noteId)} · Saved with the unit. This request does not trigger production.</p><label class="pm-field">Request note<textarea data-field="note" maxlength="4000">${esc(item(noteId)?.request_note||'')}</textarea></label><div class="pm-row">${B('Done','dismiss','','primary')}${window.SpeechRecognition||window.webkitSpeechRecognition?B('Dictate note','dictate'):''}</div><p class="pm-muted">Text is always available. Device dictation may require microphone permission.</p></div>`;
    if(drawer==='share')content=shareDialog();
    if(drawer==='draft')content=`<div class="pm-stack"><p>Replace the draft with this shortlist, or keep it unchanged and return to the opportunity.</p>${B('Replace draft with this selection','replaceDraft','','primary')}${B('Keep existing draft','keepDraft')}</div>`;
    const centered=['note','share','draft'].includes(drawer);
    return `<div class="pm-overlay ${centered?'center':''}"><section role="dialog" aria-modal="true" aria-label="${esc(titles[drawer])}" class="${centered?'pm-dialog':'pm-drawer'}"><div class="pm-drawer-head"><h2>${esc(titles[drawer])}</h2>${B('Close','dismiss','','quiet')}</div>${content}</section></div>`;
  }
  function topbar() {
    const screen=s.last_screen;
    if(['intro','opening','preparing','closing'].includes(screen))return '';
    if(['preflight','preferences'].includes(screen))return `<header class="pm-top pm-scene-header">${companyBrand()}<span class="pm-spacer"></span>${B('End','end','','quiet')}</header>`;
    const rep=['review','checkout','ready'].includes(screen)||s.isCompare;
    if(screen==='preview') return `<header class="pm-top">${brand()}<span class="pm-spacer"></span><span class="pm-muted">Local shortlist preview</span></header>`;
    return `<header class="pm-top">${brand()}<div class="pm-context">${esc(rep?'Your presentation workspace':DEV(s.ui.dev)?.name||'The collection')}<small>${rep?'Rep only · prepare before sharing':esc(preferenceSummary())}</small></div>${rep?B('Close','close','','quiet'):`<div class="pm-tools">${B('Developments','portfolio','','quiet')}${screen==='showroom'?B('Units / Overview','openPanel','','quiet'):''}${B('Preferences','preferences','','quiet')}${B('Shortlist <span class="pm-count">'+selected().length+'</span>','shortlist')}${B(s.prices_hidden?'Show prices':'Hide prices','prices','','quiet')}${B('End','end','','quiet')}</div>`}</header>`;
  }
  function render() {
    if(!s||!root)return;
    write();
    if(window.PMViewer.active)return;
    cleanupExplorer();
    const active=root.contains(document.activeElement)?document.activeElement:null;
    const fieldName=active?.dataset.field, pos=active?.selectionStart;
    const action=active?.dataset.pm,arg=active?.dataset.arg,label=active?.getAttribute('aria-label');
    const functions={preflight,review,preferences,portfolio,showroom,unit,shortlist,compare:()=>comparison(),devcompare:()=>comparison(true),closing,checkout,ready,preview,
      intro:()=>`<div class="pm-scene pm-intro"><div class="pm-scene-orb" aria-hidden="true"></div><div class="pm-intro-content">${companyBrand()}<div class="pm-chat-arrival"><span class="pm-eyebrow">Your personal introduction</span><h1 tabindex="-1">A new way to find your place.</h1><p>${esc(PMData.company().tagline||'Let’s shape the experience around you.')}</p><span class="pm-thinking" aria-hidden="true"><i></i><i></i><i></i></span></div>${B('Let’s begin →','introContinue','','primary')}</div></div>`,
      preparing:()=>`<div class="pm-scene pm-intro"><div class="pm-scene-orb" aria-hidden="true"></div><div class="pm-intro-content">${companyBrand()}<span class="pm-thinking" aria-hidden="true"><i></i><i></i><i></i></span><h1 tabindex="-1" role="status">Preparing developments</h1><p class="pm-muted">Bringing your collection into view.</p>${B('Continue →','prepared','','quiet')}${B('Back','back','','quiet')}</div></div>`,
      opening:()=>`<button class="pm-opening" data-pm="skip" aria-label="Skip opening"><span class="pm-opening-content">${s.ui.openingNext==='showroom'?identity(DEV(s.ui.dev)):brand()}<span class="pm-opening-name">${esc(s.ui.openingName)}</span><span class="pm-muted">${esc(preferenceSummary())}</span><span class="pm-opening-hint">Your next chapter. Tap to continue.</span></span></button>`};
    const mainScroll=root.querySelector('.pm-main')?.scrollTop||0,drawScroll=root.querySelector('.pm-drawer')?.scrollTop||0;
    const stageScroll=root.querySelector('.pm-stage')?.scrollTop||0,panelScroll=root.querySelector('.pm-panel')?.scrollTop||0;
    root.innerHTML=`<div class="pm-chrome" ${drawer?'inert':''}>${topbar()}${tourChrome()}</div>${storageError?`<p role="status" class="pm-inline-alert">${esc(storageError)}</p>`:''}${message?`<p role="status" class="pm-inline-alert">${esc(message)}</p>`:''}<main class="pm-main ${s.ui.focus?'pm-focus':''}" ${drawer?'inert':''}>${functions[s.last_screen]()}</main>${drawer?drawerHtml():''}`;
    root.querySelector('.pm-main').scrollTop=mainScroll; if(root.querySelector('.pm-drawer'))root.querySelector('.pm-drawer').scrollTop=drawScroll;
    if(root.querySelector('.pm-stage'))root.querySelector('.pm-stage').scrollTop=stageScroll;
    if(root.querySelector('.pm-panel'))root.querySelector('.pm-panel').scrollTop=panelScroll;
    if(fieldName) { const target=[...root.querySelectorAll('[data-field]')].find(el=>el.dataset.field===fieldName); if(target) {target.focus(); if(typeof pos==='number'&&['text','search','tel'].includes(target.type))target.setSelectionRange(pos,pos);} }
    else if(action){[...root.querySelectorAll('[data-pm]')].find(el=>el.dataset.pm===action&&el.dataset.arg===arg&&el.getAttribute('aria-label')===label)?.focus({preventScroll:true});}
    if(s.last_screen==='showroom'&&!drawer){
      const id=s.id,dev=s.ui.dev,persist=()=>{if(s?.id===id&&s.ui.dev===dev)write();};
      if(s.ui.media==='floors')disposeExplorer=PMSpatial.mount(root,spatialContext(),persist);
      else if(s.ui.media==='location')disposeExplorer=PMNeighbourhood.mount(root,neighbourhoodContext(),persist);
    }
    write(); // include normalized spatial state in the same persisted render
  }
  function syncTour() {
    if(s.scope.type!=='units')s.scope={type:'portfolio',ids:s.ui.tour.slice(),order:s.ui.tour.slice()};
  }
  function reviewShortlist() {
    s.ui.compareDevs=s.ui.compareDevs.filter(id=>selectedDevs().includes(id)&&s.ui.visited.includes(id));
    if(!s.ui.compareDevs.length)s.ui.compareDevs=selectedDevs().filter(id=>s.ui.visited.includes(id)).slice(0,3);
    s.ui.focus=false;nav('shortlist');
  }
  function change(e) { update(e.target,true); }
  function input(e) { if(e.target.matches('input:not([type=checkbox]),textarea'))update(e.target,false); }
  function update(el,rerender) {
    const key=el.dataset.field;if(!key||!s)return; const value=el.type==='checkbox'?el.checked:el.value;
    if(key==='previewLayout'||key==='previewStyle'){setUnitPreview(s.ui.unit,key,value);render();return;}
    if(key==='diffOnly'){s.ui.diffOnly=!!value;render();return;}
    if(key.startsWith('interest.')){const i=item(key.slice(9));if(i&&['unset','interested','favourite'].includes(value)){i.interest=value;s.ui.output=null;render();}return;}
    if(key.startsWith('filter.')) { s.ui.filter[key.slice(7)]=value; render(); return; }
    if(key==='lens') { s.lens=lenses[value]?value:'general'; s.ui.output=null; render(); return; }
    if(key.startsWith('compareUnit.')) {
      const uid=key.slice(12); if(!available(uid))return;
      if(value&&s.ui.compare.length>=4)message='Four columns at a time. Your other units stay in the shortlist.';
      else s.ui.compare=value?[...new Set([...s.ui.compare,uid])]:s.ui.compare.filter(x=>x!==uid);
      s.ui.output=null;render();return;
    }
    if(key.startsWith('compareDev.')) {
      const id=key.slice(11); if(value&&s.ui.compareDevs.length>=3)message='Compare up to three developments at a time.';
      else s.ui.compareDevs=value?[...new Set([...s.ui.compareDevs,id])]:s.ui.compareDevs.filter(x=>x!==id);
      render();return;
    }
    if(key==='note') { const i=item(noteId); if(i)i.request_note=value; s.ui.output=null; syncTray(); write(); return; }
    if(key==='linkType'){s.ui.linkType=value;s.ui.linkId='';s.ui.output=null;render();return;}
    if(['linkId','name','email','phone','link','pdf','includeComparison','includeDevelopments'].includes(key)){s.ui[key]=value;s.ui.output=null;write();render();}
  }
  function click(e) {
    const el=e.target.closest('[data-pm]'); if(!el||!root?.contains(el)||el.disabled)return;
    const a=el.dataset.pm,v=el.dataset.arg; message='';
    if(a.startsWith('sp-')&&s.last_screen==='showroom'){
      const result=PMSpatial.handleAction(a,v,spatialContext());
      if(!result.handled)return;
      if(result.media)s.ui.media=result.media;
      if(result.openUnit){openUnit(result.openUnit);return;}
      if(result.shortlistUnit&&available(result.shortlistUnit)){
        const i=touch(result.shortlistUnit);i.is_shortlisted=true;
        if(s.ui.compare.length<4&&!s.ui.compare.includes(i.unit_id))s.ui.compare.push(i.unit_id);
        s.ui.output=null;syncTray();
      }
      if(result.openViewer){write();PMViewer.open({...result.openViewer,root,onClose:()=>render()});return;}
      render();if(result.media||a==='sp-building')root.querySelector('.pm-stage')?.scrollTo(0,0);return;
    }
    if(a.startsWith('nb-')&&s.last_screen==='showroom'){
      if(PMNeighbourhood.handleAction(a,v,neighbourhoodContext()).handled)render();return;
    }
    switch(a) {
      case 'start':start();break; case 'close':close();break; case 'back':back();break; case 'resume':resume(v);break;
      case 'introContinue':beginQuestions();break;
      case 'prepared':finishPreparing();break;
      case 'reviewContinue':selection().items.forEach(i=>{if(i.legacy_config)i.legacy_reviewed=true;});if(s.scope.type==='units')nav('compare');else intro();break;
      case 'skipQuestion':{const k=questionKeys[s.ui.questionStep];answerQuestion(k,k==='lens'?'general':'');break;}
      case 'skip':nav(s.ui.openingNext);break; case 'lens':if(['preflight','preferences'].includes(s.last_screen))answerQuestion('lens',v);else {s.lens=v;render();}break;
      case 'dev':openDevelopment(v);break; case 'unit':openUnit(v);break;
      case 'portfolio':s.ui.focus=false;nav('portfolio');break;
      case 'chooseDevelopments':s.ui.preferencesSet=true;nav('portfolio');break;
      case 'expand':nav('portfolio');break;
      case 'portfolioView':s.ui.portfolioView=v;render();break;
      case 'toggleDev':if(DEV(v)){s.ui.tour=s.ui.tour.includes(v)?s.ui.tour.filter(id=>id!==v):[...s.ui.tour,v];syncTour();render();}break;
      case 'reorder':case 'tourReorder':{const [id,delta]=v.split(':'),ids=s.ui.tour,n=ids.indexOf(id),next=n+Number(delta);if(next>=0&&next<ids.length)[ids[n],ids[next]]=[ids[next],ids[n]];syncTour();render();break;}
      case 'removeScope':s.ui.tour=s.ui.tour.filter(id=>id!==v);syncTour();render();break;
      case 'beginTour':beginTour();break;
      case 'nextDevelopment':{const n=s.ui.tour.indexOf(s.ui.dev);if(n<s.ui.tour.length-1)openDevelopment(s.ui.tour[n+1]);else reviewShortlist();break;}
      case 'preferences':if(s.last_screen!=='preferences'){s.ui.preferenceReturn=s.last_screen;s.ui.preferenceStart=false;s.ui.questionStep=0;s.ui.focus=false;nav('preferences');}break;
      case 'stylePreference':answerQuestion('style',v);break;
      case 'finishPreference':answerQuestion('finish',v);break;
      case 'finishPreferences':s.ui.preferencesSet=true;if(s.ui.preferenceStart){s.ui.preferenceStart=false;beginTour();}else nav(s.ui.preferenceReturn||'portfolio');break;
      case 'resetFilters':s.ui.filter={dev:'',beds:'',type:'',price:'',view:'',completion:'',floor:'',q:'',unavailable:false};render();break;
      case 'panel':s.ui.panel=v;render();break; case 'openPanel':openDrawer('panel');break;
      case 'residences':s.ui.panel='units';openDrawer('panel');break;
      case 'viewUnitImage':openUnitMedia(s.ui.unit,Number(v));break;
      case 'viewUnitGallery':openUnitMedia(v,s.ui.unitPreview?.[v]?.index??0);break;
      case 'viewPlan':openPlanMedia(v);break;
      case 'viewProjectImage':openProjectMedia(Number(v));break;
      case 'media':s.ui.media=v;render();root.querySelector('.pm-stage')?.scrollTo(0,0);break; case 'focus':s.ui.focus=!s.ui.focus;render();break;
      case 'prices':s.prices_hidden=!s.prices_hidden;s.ui.output=null;render();break;
      case 'config':openDrawer('config');break; case 'shortlist':reviewShortlist();break;
      case 'shortView':s.ui.shortlistView=v;render();break;
      case 'shortUnit':{const i=touch(v);if(!i)return;if(!available(v)&&!i.is_shortlisted)return;i.is_shortlisted=!i.is_shortlisted;if(i.is_shortlisted&&s.ui.compare.length<4&&available(v))s.ui.compare.push(v);else if(!i.is_shortlisted)s.ui.compare=s.ui.compare.filter(id=>id!==v);s.ui.output=null;syncTray();render();break;}
      case 'shortDev':{let i=selection().items.find(i=>i.development_id===v&&!i.unit_id);if(i)i.is_shortlisted=!i.is_shortlisted;else selection().items.push({development_id:v,unit_id:null,is_shortlisted:true,visual_state:'n/a',source:'present',added_at:now()});render();break;}
      case 'removeDev':selection().items.filter(i=>i.development_id===v).forEach(i=>i.is_shortlisted=false);s.ui.compareDevs=s.ui.compareDevs.filter(id=>id!==v);s.ui.compare=s.ui.compare.filter(uid=>devOf(uid)?.id!==v);render();break;
      case 'note':openDrawer('note',v);break;case 'dismiss':closeDrawer();break;
      case 'openComparison':case 'compareMode':s.ui.compareMode=v;nav('compare');break;
      case 'compare':s.ui.compareMode='units';nav('compare');break;case 'devcompare':s.ui.compareMode='developments';nav('compare');break;
      case 'end':end();break;case 'returnTour':resumeTour();break;
      case 'ack':s.ui.ack=true;nav('checkout');break;
      case 'checkout':if(s.isCompare){s.ui.ack=true;nav('checkout');}break;
      case 'presentLive':s.isCompare=false;s.ui.ack=false;nav('compare');break;
      case 'saveOnly':s.outcome='saved';s.ended_at=now();log('saved','Presentation session saved');close();break;
      case 'prepare':prepare();break;case 'share':if(validOutput())openDrawer('share');break;
      case 'copy':share('copy');break;case 'send':share(v);break;
      case 'preview':if(validOutput()){s.ui.previewReturn=s.last_screen;nav('preview');}break;
      case 'print':if(validOutput()){s.ui.previewReturn=s.last_screen;nav('preview');setTimeout(()=>window.print(),50);}break;
      case 'printNow':window.print();break;case 'previewBack':nav(s.ui.previewReturn||'checkout');break;
      case 'followup':followup();break;case 'replaceDraft':followup(true);break;case 'keepDraft':close(true);break;case 'done':close(true);break;
      case 'dictate':dictate();break;
    }
  }
  function dictate() {
    const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Speech)return;
    recognition?.stop(); recognition=new Speech(); recognition.lang='en-GB'; recognition.interimResults=false;
    const id=noteId,sessionId=s.id;
    recognition.onresult=e=>{if(s?.id!==sessionId||noteId!==id)return;const i=item(id);i.request_note=[i.request_note,e.results[0][0].transcript].filter(Boolean).join(' ');s.ui.output=null;write();render();};
    recognition.onerror=()=>{message='Dictation is unavailable. Type your request instead.';render();};recognition.start();
  }
  function imageError(e) {
    const img=e.target;
    if(img.matches?.('.pm-intro-film')){img.hidden=true;img.removeAttribute('src');img.load();const note=img.parentElement.querySelector('.pm-intro-film-status');note.hidden=false;note.textContent='Film unavailable · showing project hero';return;}
    if(img.tagName!=='IMG')return;
    if(img.closest('.pm-viewer'))return;
    if(img.dataset.fallback&&img.src!==new URL(img.dataset.fallback,location.href).href){
      if(img.closest('.pm-project-images'))failedProjectImages.add(img.src);
      img.src=img.dataset.fallback;delete img.dataset.fallback;
      const figure=img.closest('.pm-project-images figure');
      if(figure){img.alt='Fallback project exterior imagery';figure.querySelector('figcaption').textContent='Requested image unavailable · showing project exterior';figure.querySelector('button').setAttribute('aria-label','Open fallback project exterior fullscreen');}
      if(img.classList.contains('pm-stage-photo')){
        img.alt='Fallback project exterior imagery';
        const badge=img.parentElement.querySelector('.pm-stage-badge');
        if(badge)badge.textContent='Requested image unavailable · showing project exterior';
      }
      return;
    }
    img.style.display='none'; const text=document.createElement('span');text.className='pm-status';text.textContent='Image unavailable';img.after(text);
  }
  const inventoryKey=()=>JSON.stringify(UNITS.map(u=>[u.id,u.status,u.price]));
  function reconcile(redraw=true) {
    if(!s)return;const sig=inventoryKey();if(sig===inventorySignature)return;inventorySignature=sig;
    if(s.ui.publicPreview){if(redraw)render();return;}
    s.ui.compare=s.ui.compare.filter(available);s.ui.output=null;
    message='Availability or pricing has changed. Your saved interests remain; only available units can be compared or shared.';
    if(redraw)render();else write();
  }
  function syncTray() {
    if(!s)return;
    trState.items=selected().filter(i=>i.unit_id).slice(0,5).map(i=>({unitId:i.unit_id,config:{...i.config,style:i.style,modifier:i.request_note}}));
    trSave();
  }
  // Capture phase prevents all of the prototype's older Escape handlers firing.
  document.addEventListener('keydown',e=>{
    if(!root||!s)return;
    if(window.PMViewer.active){window.PMViewer.handleKey(e);return;}
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();back();return;}
    const spatialControl=e.target.closest('[data-pm^="sp-"]');
    if((e.key==='Enter'||e.key===' ')&&spatialControl instanceof SVGElement){
      e.preventDefault();e.stopImmediatePropagation();spatialControl.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;
    }
    // Let the mounted viewport handle its own navigation keys, never Escape/Tab.
    if(!drawer&&s.last_screen==='showroom'&&['+','=','-','_','0','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&
      (e.target.matches('[data-sp-plan]')||e.target.closest('.nb-map')))return;
    if(e.key==='Tab') {
      const container=root.querySelector('.pm-overlay')||root;
      const focusables=[...container.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.closest('[inert]'));
      const first=focusables[0],last=focusables.at(-1);
      if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)||!container.contains(document.activeElement)){e.preventDefault();(e.shiftKey?last:first)?.focus();}
    }
    if(e.key==='Enter'&&e.target.matches('polygon[data-pm]')){e.preventDefault();openUnit(e.target.dataset.arg);}
    e.stopPropagation();
  },true);
  window.addEventListener('popstate',()=>{if(inRoom()&&!s.isCompare)end();});
  window.addEventListener('storage',e=>{
    if(e.key!==KEY||!e.newValue)return;
    try{const other=JSON.parse(e.newValue);Object.entries(other.inventory||{}).forEach(([uid,st])=>{if(UN(uid)&&UN_STATUS[st]){UN(uid).status=st;store.inventory[uid]=st;}});reconcile();}catch(e){}
  });
  window.addEventListener('beforeunload',()=>{if(s)write();});
  // Hide late-added global overlays from focus/accessibility as well as visually.
  new MutationObserver(records=>{if(!root)return;records.forEach(r=>r.addedNodes.forEach(e=>{if(e.nodeType===1&&e.parentElement===document.body&&e!==root&&!['SCRIPT','STYLE','LINK'].includes(e.tagName)){locked.push([e,e.inert,e.getAttribute('aria-hidden')]);e.inert=true;e.setAttribute('aria-hidden','true');}}));}).observe(document.body,{childList:true});

  // Compatibility boundary. No legacy renderer reads canonical tray configs.
  const oldToast=window.showToast;
  window.showToast=function(...args){if(root)return;return oldToast(...args);};
  for(const name of ['go','openOpp','openUnit','openDev','exitWorkspace','switchWorkspace','openAsk']) {
    const original=window[name];if(typeof original==='function')window[name]=function(...args){if(root)return;return original.apply(this,args);};
  }
  window.prOpenLobby=()=>enter({review:Object.keys(store.sessions).length>0});
  window.prOpenDev=id=>{const d=DEV(id);if(d)enter({type:'development',ids:[d.id]});};
  window.prOpen=uid=>{if(UN(uid)){enter({type:'development',ids:[devOf(uid).id]});}};
  window.qaPresent=()=>{
    const o=oppCur;if(!o)return;
    const ids=o.devs.map(DEV).filter(Boolean).map(d=>d.id);
    const existing=Object.values(store.sessions).find(a=>a.opportunity_id===o.id&&!a.ended_at);
    if(existing){resume(existing.id);return;}
    enter({oppId:o.id,type:ids.length===1?'development':ids.length?'developments':'portfolio',ids});
  };
  // Keep v2's newer Compare / gallery / checkout interface intact.
  // Only its explicit Present live action enters this buyer-safe surface.
  window.cmpPresent=()=>{
    const ids=trState.items.map(i=>i.unitId).filter(UN);
    if(ids.length<2){oldToast('Select at least two units to present');return;}
    const lens={all:'general',investor:'investment',firsthome:'first_home',relocation:'relocation',secondhome:'second_home'}[cmpState.lens]||'general';
    const oppId=cmpState.link?.mode==='opp'?cmpState.link.oppId:null;
    const contactId=cmpState.link?.mode==='contact'?cmpState.link.ctId:null;
    cmpClose();
    enter({type:'units',ids,unitIds:ids,source:'compare',lens,oppId,contactId});
  };
  window.trPriceFor=(u,c)=>c?.layout?price(u.id,c):u.price+(PZ_FIN.find(f=>f.k===c?.fin)?.add||0)+(PZ_LAY.find(l=>l.k===c?.lay)?.add||0)+PZ_ADD.filter(a=>c?.adds?.includes(a.k)).reduce((n,a)=>n+a.add,0);
  window.crPrice=uid=>{const id=uid||crState?.activeCfg;return price(id,crState?.cfg?.[id]);};
  const oldCrApply=window.crApplyCfg;
  window.crApplyCfg=function(mut){
    oldCrApply(mut);
    const sel=store.selections[crState?.presentSelectionId];
    if(sel){
      crState.unitIds.forEach(uid=>{
        const i=sel.items.find(i=>i.unit_id===uid),c=crState.cfg[uid];
        if(i&&c){
          i.config=canonical(c);i.style=c.style;i.request_note=c.modifier;i.configured_price=price(uid,c);
          const tray=trState.items.find(it=>it.unitId===uid);if(tray)tray.config={...i.config,style:i.style,modifier:i.request_note};
          const o=OPPS.find(o=>o.id===crState.oppId);if(o){getExt(o).unitConfigs||={};getExt(o).unitConfigs[uid]=recordConfig(uid,{...i.config,style:i.style,modifier:i.request_note});}
        }
      });
      trSave();sel.updated_at=now();write();
    }
  };
  const oldCrExit=window.crExit;
  window.crExit=function(){const oid=crState?.oppId;oldCrExit();const o=OPPS.find(o=>o.id===oid);if(o){store.records[oid]={opportunity:clone(o),extension:clone(getExt(o))};write();}};

  // Narrow v2 adapters: preserve its rows, lens controls and galleries while
  // reading the same contractual configuration when a session returns to Compare.
  const trayConfig=uid=>trState.items.find(it=>it.unitId===uid)?.config;
  const trayPrice=u=>trayConfig(u.id)?.layout?price(u.id,trayConfig(u.id)):u.price;
  window.cmpBaseTotal=()=>trState.items.reduce((n,it)=>n+trayPrice(UN(it.unitId)),0);
  for(const row of CMP_ROWS) {
    if(row.key==='base'){row.label='Configured price';row.v=u=>fmtEur(trayPrice(u));}
    if(row.key==='psqm'){row.v=u=>fmtEur(Math.round(trayPrice(u)/u.sqm));row.raw=u=>trayPrice(u)/u.sqm;}
    if(row.key==='psqmVsAvg')row.v=u=>{const avg=cmpDevAvgPsq(u.dev);const p=avg?Math.round((trayPrice(u)/u.sqm/avg-1)*100):null;return p===null?'—':(p>0?'+':'')+p+'% €/m²';};
    if(row.key==='yield'){row.v=u=>((CMP_RENT_PSQM[u.dev]||16)*u.sqm*12/trayPrice(u)*100).toFixed(1)+'% p.a. (demo)';row.raw=u=>(CMP_RENT_PSQM[u.dev]||16)*u.sqm*12/trayPrice(u);}
  }
  PMData.installCompareAdapters((u,c)=>c?.layout?price(u.id,c):c?trPriceFor(u,c):trayPrice(u));
  const oldCmpCol=window.cmpColHtml;
  window.cmpColHtml=(it,u,plan,lens)=>{
    const html=oldCmpCol(it,u,plan,lens);
    if(!it.config?.layout)return html;
    return html.replace('<div class="cmp-sigs">',`<div class="cmp-config-summary" style="padding-top:10px;font-size:12px;color:var(--on-variant)">${esc(labelCfg(it.config))}</div><div class="cmp-sigs">`)
      .replace(`<span>Price</span><b>${fmtEur(u.price)}</b>`,`<span>Configured price</span><b>${fmtEur(price(u.id,it.config))}</b>`);
  };
  // The existing checkout remains available. Persist canonical choices at its
  // prepare boundary too, rather than dropping them when returning from a tour.
  const oldCmpPrepare=window.cmpPrepare;
  window.cmpPrepare=function(){
    const configs=clone(trState.items);oldCmpPrepare();
    const o=OPPS.find(o=>o.id===cmpState._oppId);
    if(o){const x=getExt(o);x.unitConfigs||={};configs.filter(it=>it.config?.layout).forEach(it=>{x.unitConfigs[it.unitId]=recordConfig(it.unitId,it.config);});store.records[o.id]={opportunity:clone(o),extension:clone(x)};write();}
  };
  const oldRenderDevs=window.renderDevs;
  window.renderDevs=function(){
    oldRenderDevs();
    const toolbar=document.querySelector('#dv-toolbar > .toolbar');
    if(toolbar){const button=document.createElement('button');button.className='btn-primary';button.id='dv-present';button.textContent=dvSelection.size?`Present ${dvSelection.size} development${dvSelection.size===1?'':'s'}`:'Enter Present Mode';button.onclick=()=>PM.presentDevelopments([...dvSelection]);toolbar.append(button);}
  };
  const oldToggleDevSelection=window.dvToggleSelection;
  window.dvToggleSelection=function(id){
    oldToggleDevSelection(id);
    const button=document.getElementById('dv-present');
    if(button)button.textContent=dvSelection.size?`Present ${dvSelection.size} development${dvSelection.size===1?'':'s'}`:'Enter Present Mode';
  };
  SB_SURFACES.find(surface=>surface.pageId==='p-developments').actions.unshift({
    id:'dv-present',label:'Present',icon:'compare',roles:['rep','manager','marketing','owner'],clearAfter:false,
    run:ids=>{PM.presentDevelopments(ids);return{};}
  });
  const oldDayRoom=window.openDayRoom;
  window.openDayRoom=function(index){
    if(root)return;oldDayRoom(index);
    const day=PERSONAS[curPersona].day[index];
    const o=OPPS.find(o=>day?.cal?.with===o.lead);
    if(o){const button=document.createElement('button');button.className='btn-primary';button.textContent='Present to buyer';button.onclick=()=>{closeRoom();PM.presentOpportunity(o.id);};document.querySelector('#room .room-body')?.append(button);}
  };
  renderDevs();
  window.PMMap.load().then(()=>{if(root && s && ['portfolio','showroom'].includes(s.last_screen))render();});

  window.PM={enter,resume,price,canonical,asset,available,reconcile,
    get session(){return s;},get store(){return store;},get selection(){return s?selection():null;},
    presentOpportunity(id){if(root)return;const o=OPPS.find(o=>o.id===id);if(o){const ids=o.devs.map(DEV).filter(Boolean).map(d=>d.id);enter({oppId:id,type:ids.length===1?'development':'developments',ids});}},
    presentDevelopments(ids){const ds=ids.map(DEV).filter(Boolean).map(d=>d.id);enter({type:ds.length===1?'development':ds.length?'developments':'portfolio',ids:ds});},
    simulateInventory(uid,st){if(inRoom())throw new Error('Inventory simulation is rep-only. Use another local tab or leave the showroom.');if(!UN(uid)||!UN_STATUS[st])throw new Error('Invalid unit/status');UN(uid).status=st;store.inventory[uid]=st;write();reconcile();},
    canPrepare,outputKey,
  };
  // The buyer preview never mounts the CRM, even when its local link is missing.
  const previewId=new URLSearchParams(location.hash.slice(1)).get('shortlist');
  if(previewId) {
    const out=store.outputs[previewId];
    if(out&&store.sessions[out.session_id]) {
      s=clone(store.sessions[out.session_id]);s.ui=clone(s.ui);s.ui.output=previewId;s.ui.publicPreview=true;s.ui.ack=true;s.last_screen='preview';
      // Rendering a buyer preview must not rewrite the originating session.
      const savedSession=store.sessions[s.id];mount();render();store.sessions[s.id]=savedSession;
    } else {
      newSession();s.last_screen='preview';s.ui.publicPreview=true;s.ui.output=previewId;mount();render();
    }
  }
})();
