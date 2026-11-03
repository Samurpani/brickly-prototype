/* Illustrative, fully local neighbourhood. No geographic data or network requests.
 *
 * HOST CONTRACT — load this script and present-neighbourhood.css after host CSS.
 * context = { developmentId, state: ui.neighbourhood[developmentId] }.
 * ensure(id, state) returns the same mutable object (or a new one if absent).
 * The host must retain that return value per development; no shared UI state.
 * render(context) returns the COMPLETE .pm-stage.pm-neighbourhood-stage element.
 * Delegate bubbling data-pm clicks to handleAction(action, data-arg, context),
 * then dispose the previous mount, render and persist the host state as usual.
 * mount(stageOrContainer, context, onChange) returns an idempotent cleanup.
 * onChange(state, {developmentId, reason:'viewport'}) is a persistence-only
 * callback, coalesced per animation frame. DO NOT rerender from this callback.
 * Always dispose BEFORE replacing markup/navigation. This also transfers focus
 * to the matching control on the next mount, without intercepting global Escape.
 *
 * State: {category:'all', poiId:'development'|demoId|null,
 *         viewport:{x:0.5,y:0.5,zoom:1}}.
 * x/y are normalized SCHEMATIC centre coordinates, never latitude/longitude.
 * Actions: nb-category(category), nb-poi(id|'development'), nb-clear,
 *          nb-reset, nb-zoom-in, nb-zoom-out. Unknown actions: handled:false.
 * DEV is consulted only for the development title. No optional real-place or
 * PM_NEIGHBOURHOODS import is implemented: these demo places stay illustrative.
 */
(() => {
  'use strict';

  const MIN_ZOOM = 1, MAX_ZOOM = 3.5, DEVELOPMENT = 'development';
  const NOTICE = 'Illustrative neighbourhood · demo places, not real locations or routes';
  const categories = [
    {id:'all', label:'All places', icon:'all'},
    {id:'transport', label:'Transport', icon:'transport'},
    {id:'education', label:'Education', icon:'education'},
    {id:'dining', label:'Dining', icon:'dining'},
    {id:'shopping', label:'Shopping', icon:'shopping'},
    {id:'health', label:'Health', icon:'health'},
    {id:'recreation', label:'Recreation', icon:'recreation'}
  ];
  // Original schematic positions, not surveyed locations. No real businesses.
  const places = [
    {id:'demo-bus', category:'transport', label:'Example bus stop', x:.18, y:.72, description:'A sample public-transport stop to explore the transport category. No service or timetable is implied.'},
    {id:'demo-ferry', category:'transport', label:'Example ferry stop', x:.86, y:.77, description:'An illustrative waterfront transport point. This is not an operating terminal or a journey recommendation.'},
    {id:'demo-school', category:'education', label:'Example school', x:.13, y:.23, description:'A sample education point. School identity, admissions and catchment information are not provided.'},
    {id:'demo-cafe', category:'dining', label:'Example café', x:.60, y:.21, description:'A fictional place for a coffee break, included to demonstrate dining discovery.'},
    {id:'demo-bistro', category:'dining', label:'Example bistro', x:.75, y:.47, description:'A fictional dining spot. Menus, opening hours and availability are not represented.'},
    {id:'demo-market', category:'shopping', label:'Example market', x:.39, y:.76, description:'An illustrative local-shopping point. No real market or trading schedule is represented.'},
    {id:'demo-grocer', category:'shopping', label:'Example grocery', x:.60, y:.87, description:'A sample everyday-shopping place. This is not a verified business or amenity.'},
    {id:'demo-clinic', category:'health', label:'Example clinic', x:.16, y:.46, description:'An example health category marker, not a verified care provider or emergency destination.'},
    {id:'demo-park', category:'recreation', label:'Example garden', x:.35, y:.24, description:'An illustrative green space. Access, facilities and paths are not verified.'},
    {id:'demo-promenade', category:'recreation', label:'Example promenade', x:.82, y:.22, description:'A sample waterfront leisure point. The drawn paths are decorative, not usable routes.'}
  ];
  const paths = {
    all:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    transport:'M6 17V5q6-3 12 0v12H6ZM6 10h12M8 17v3m8-3v3M9 14h.01M15 14h.01',
    education:'m2 9 10-5 10 5-10 5L2 9Zm4 3v5q6 5 12 0v-5M22 9v8',
    dining:'M5 3v6m3-6v6M3 6v3q0 3 3 3v9m3-15v3q0 3-3 3M18 21V3q-6 6 0 10',
    shopping:'M5 8h14l1 13H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2',
    health:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z',
    recreation:'m12 2-6 8h3l-5 7h7v5h2v-5h7l-5-7h3L12 2Z',
    development:'M5 21V3h10v18M15 9h4v12M3 21h18M8 7h4M8 11h4M8 15h4M9 21v-3',
    reset:'M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2',
    close:'m6 6 12 12M6 18 18 6',
    plus:'M5 12h14M12 5v14',
    minus:'M5 12h14'
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
  const icon = name => `<svg class="nb-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name] || paths.all}"/></svg>`;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const number = (n, fallback) => typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  const categoryOf = id => categories.find(c => c.id === id);
  const placeOf = id => places.find(p => p.id === id);
  const visible = (p, state) => state.category === 'all' || p.category === state.category;
  const focusTransfers = {pending:null};
  const mounted = new WeakMap();

  function viewport(value) {
    const zoom = clamp(number(value?.zoom, 1), MIN_ZOOM, MAX_ZOOM);
    const edge = .5 / zoom;
    return {x:clamp(number(value?.x, .5), edge, 1-edge),
      y:clamp(number(value?.y, .5), edge, 1-edge), zoom};
  }

  function ensure(developmentId, state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) state = {};
    if (!categoryOf(state.category)) state.category = 'all';
    if (state.poiId === undefined) state.poiId = DEVELOPMENT;
    if (state.poiId !== DEVELOPMENT && state.poiId !== null) {
      const poi = placeOf(state.poiId);
      if (!poi || !visible(poi, state)) state.poiId = null;
    }
    state.viewport = viewport(state.viewport);
    return state;
  }

  function stateOf(context) {
    if (!context || !context.state || typeof context.state !== 'object' || Array.isArray(context.state)) {
      throw new TypeError('PMNeighbourhood requires context.state; retain ensure(developmentId, state) first.');
    }
    return ensure(context.developmentId, context.state);
  }

  function developmentTitle(id) {
    // The host uses a lexical global DEV function, not necessarily window.DEV.
    try {
      const dev = typeof DEV === 'function' ? DEV(id) : null;
      return typeof dev?.name === 'string' && dev.name.trim() ? dev.name : 'Your development';
    } catch { return 'Your development'; }
  }

  function button(label, action, arg, cls, key, attributes = '') {
    return `<button type="button" class="nb-button ${cls || ''}" data-pm="${escape(action)}" data-arg="${escape(arg)}" data-nb-focus="${escape(key)}" ${attributes}>${label}</button>`;
  }

  function zoomAt(state, factor, anchor = {x:.5, y:.5}) {
    const v = state.viewport, zoom = clamp(v.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    state.viewport = viewport({zoom, x:v.x + (anchor.x-.5) * (1/v.zoom-1/zoom),
      y:v.y + (anchor.y-.5) * (1/v.zoom-1/zoom)});
  }

  function handleAction(action, arg, context) {
    if (!['nb-category','nb-poi','nb-clear','nb-reset','nb-zoom-in','nb-zoom-out'].includes(action)) return {handled:false};
    const state = stateOf(context);
    if (action === 'nb-category' && categoryOf(arg)) {
      state.category = arg;
      if (state.poiId !== DEVELOPMENT && !places.some(p => p.id === state.poiId && visible(p, state))) state.poiId = null;
    } else if (action === 'nb-poi') {
      const poi = arg === DEVELOPMENT ? {x:.5, y:.5} : placeOf(arg);
      if (poi && (arg === DEVELOPMENT || visible(poi, state))) {
        state.poiId = arg;
        state.viewport = viewport({...state.viewport, x:poi.x, y:poi.y});
      }
    } else if (action === 'nb-clear') state.poiId = null;
    else if (action === 'nb-reset') {
      state.category = 'all'; state.poiId = DEVELOPMENT; state.viewport = viewport();
    } else if (action === 'nb-zoom-in') zoomAt(state, 1.25);
    else if (action === 'nb-zoom-out') zoomAt(state, 1/1.25);
    return {handled:true};
  }

  function schematic() {
    const blocks = [
      [65,45,125,58],[70,235,120,55],[68,365,135,63],[76,565,111,66],
      [265,280,104,74],[280,403,94,56],[281,578,145,56],[474,52,156,50],
      [487,183,135,68],[634,276,134,62],[668,389,127,74],[486,472,133,56],
      [481,663,133,27],[688,585,82,65],[710,40,119,53]
    ];
    const trees = [[289,108],[317,94],[430,104],[446,155],[288,203],[429,208],[319,187],
      [225,293],[226,329],[225,365],[226,400],[648,70],[665,98],[773,506],[753,550],[790,593]];
    return `<svg class="nb-geography" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect width="1000" height="700" class="nb-land"/>
      <path class="nb-water" d="M900 0H1000V700H807Q897 570 894 440T864 214Q860 110 900 0Z"/>
      <path class="nb-water-line" d="M955 0Q906 125 915 240T946 432Q953 580 865 700M989 80Q953 179 965 285T988 457Q998 594 925 700"/>
      <g class="nb-blocks">${blocks.map(([x,y,w,h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/><path d="M${x+12} ${y+12}h${w-24}"/>`).join('')}</g>
      <path class="nb-park" d="M274 76Q258 76 258 97V210Q258 232 284 232H446Q468 232 468 210V106Q468 76 443 76Z"/>
      <path class="nb-garden-path" d="M276 126Q401 104 427 194M281 200Q335 125 453 129"/>
      <g class="nb-streets"><path d="M-20 324Q172 316 342 350T630 360Q751 343 849 303M234-20V720M-20 530Q261 518 456 563T863 543M676-20Q644 177 667 318T664 710M460-20V268"/></g>
      <g class="nb-road-centres"><path d="M-20 324Q172 316 342 350T630 360Q751 343 849 303M234-20V720M-20 530Q261 518 456 563T863 543M676-20Q644 177 667 318T664 710M460-20V268"/></g>
      <path class="nb-promenade" d="M867-10Q815 127 829 222T860 428Q866 575 771 714"/>
      <path class="nb-footpath" d="M862-10Q810 127 824 222T855 428Q861 575 766 714M350 235V299Q345 309 385 311L456 322M550 406V471"/>
      <g class="nb-trees">${trees.map(([x,y],i) => `<circle cx="${x}" cy="${y}" r="${i%2 ? 11 : 15}"/><circle cx="${x-2}" cy="${y-3}" r="5"/>`).join('')}</g>
      <path class="nb-pier" d="M849 543H954V559H845Z"/>
      <rect class="nb-site-halo" x="407" y="285" width="190" height="148" rx="25"/>
      <rect class="nb-site" x="431" y="307" width="142" height="101" rx="12"/>
      <path class="nb-site-roof" d="M447 392v-68h108v68h-35v-39h-38v39Z"/>
      <g class="nb-map-labels"><text x="356" y="61">GARDEN</text><text x="930" y="342" transform="rotate(90 930 342)">WATERFRONT</text><text x="500" y="456">DEVELOPMENT</text><text x="361" y="510">NEIGHBOURHOOD</text></g>
    </svg>`;
  }

  function marker(poi, state, isDevelopment = false) {
    const selected = state.poiId === poi.id;
    const label = isDevelopment ? `${poi.label} · development anchor, illustrative position` : `${poi.label} · ${categoryOf(poi.category).label} · demo place`;
    return `<div class="nb-pin-position" data-nb-x="${poi.x}" data-nb-y="${poi.y}" style="left:${poi.x*100}%;top:${poi.y*100}%">${button(
      `${icon(isDevelopment ? 'development' : poi.category)}<span class="nb-pin-label">${escape(isDevelopment ? 'Development' : poi.label.replace('Example ',''))}</span>`,
      'nb-poi', poi.id, `nb-pin nb-tone-${isDevelopment ? 'development' : poi.category}${selected ? ' is-selected' : ''}`, `pin:${poi.id}`,
      `aria-label="${escape(label)}" aria-pressed="${selected}" title="${escape(label)}"`)}</div>`;
  }

  function selectionCard(state, title) {
    const poi = placeOf(state.poiId), isDevelopment = state.poiId === DEVELOPMENT;
    const heading = poi?.label || (isDevelopment ? title : 'Choose a place to explore');
    const description = poi?.description || (isDevelopment
      ? 'Your development is the centre of this demo composition. Its position and all surroundings are illustrative.'
      : 'Select a marker or an item below. Filter the example places by what matters to you.');
    return `<section class="nb-selection" aria-label="Selected place" aria-live="polite" aria-atomic="true">
      <span class="nb-selection-icon nb-tone-${poi?.category || 'development'}">${icon(poi?.category || 'development')}</span>
      <div class="nb-selection-copy"><p class="nb-kicker">${poi ? escape(categoryOf(poi.category).label)+' · Demo place' : isDevelopment ? 'Development anchor · Demo' : 'Explore the neighbourhood'}</p><h3>${escape(heading)}</h3><p>${escape(description)}</p>${poi ? '<small>No verified location, distance or route information.</small>' : ''}</div>
      ${state.poiId !== null ? button(icon('close'), 'nb-clear', '', 'nb-icon-button nb-clear', 'clear', 'aria-label="Clear place selection"') : ''}
    </section>`;
  }

  function render(context) {
    const state = stateOf(context), title = developmentTitle(context.developmentId);
    const shown = places.filter(p => visible(p, state));
    const v = state.viewport;
    return `<section class="pm-stage pm-neighbourhood-stage" aria-label="Illustrative neighbourhood">
      <header class="nb-header"><div><p class="nb-kicker">Location / An everyday perspective</p><h2>Around your development</h2><p class="nb-development-name">${escape(title)}</p></div><span class="nb-demo-badge">Schematic demo</span></header>
      <div class="nb-disclaimer">${icon('all')}<strong>${NOTICE}</strong></div>
      <div class="nb-categories" role="group" aria-label="Filter example places">${categories.map(c => button(`${icon(c.icon)}<span>${escape(c.label)}</span>`, 'nb-category', c.id, 'nb-chip', `category:${c.id}`, `aria-pressed="${state.category===c.id}"`)).join('')}</div>
      <div class="nb-map-wrap"><div class="nb-map" tabindex="0" role="group" aria-label="Interactive schematic map. Drag to pan; scroll or pinch to zoom. Arrow keys pan; plus and minus zoom; Home resets. Tab to markers or use the places list." data-nb-focus="map">
        <div class="nb-world" style="--nb-zoom:${v.zoom};transform:translate(${(0.5-v.x*v.zoom)*100}%,${(0.5-v.y*v.zoom)*100}%) scale(${v.zoom})">${schematic()}${shown.map(p => marker(p,state)).join('')}${marker({id:DEVELOPMENT,label:title,x:.5,y:.5},state,true)}</div>
        <div class="nb-map-stamp" aria-hidden="true"><span>BRICLY / LOCAL LIFE</span><span>SCHEMATIC · NOT TO SCALE</span></div>
      </div></div>
      <div class="nb-map-tools"><div class="nb-zoom" role="group" aria-label="Map zoom">${button(icon('minus'),'nb-zoom-out','','nb-icon-button','zoom-out',`aria-label="Zoom out" aria-disabled="${v.zoom<=MIN_ZOOM}"`)}<output class="nb-zoom-value" aria-label="Map zoom">${Math.round(v.zoom*100)}%</output>${button(icon('plus'),'nb-zoom-in','','nb-icon-button','zoom-in',`aria-label="Zoom in" aria-disabled="${v.zoom>=MAX_ZOOM}"`)}</div>${button(`${icon('reset')}<span>Reset to development</span>`,'nb-reset','','nb-reset','reset')}<p class="nb-help">Drag to pan · Scroll or pinch to zoom<br>Keyboard: arrows, + / −, Home</p></div>
      ${selectionCard(state,title)}
      <section class="nb-places" aria-label="Example places list"><header><h3>Explore by place</h3><span>${shown.length} demo ${shown.length===1 ? 'place' : 'places'}</span></header><ul>${shown.map(p => `<li>${button(`<span class="nb-list-icon nb-tone-${p.category}">${icon(p.category)}</span><span class="nb-list-copy"><strong>${escape(p.label)}</strong><small>${escape(categoryOf(p.category).label)} · Demo</small></span><span class="nb-list-indicator" aria-hidden="true">${state.poiId===p.id ? '✓' : '↗'}</span>`, 'nb-poi', p.id, 'nb-place', `list:${p.id}`, `aria-pressed="${state.poiId===p.id}"`)}</li>`).join('')}</ul></section>
      <footer class="nb-footer">An original schematic, not a geographic basemap. Roads, paths and places are illustrative; real project surroundings can be added in a future integration.</footer>
    </section>`;
  }

  function mount(root, context, onChange = () => {}) {
    const stage = root?.matches?.('.pm-neighbourhood-stage') ? root : root?.querySelector?.('.pm-neighbourhood-stage');
    if (!stage) return () => {};
    mounted.get(stage)?.();
    const state = stateOf(context), map = stage.querySelector('.nb-map'), world = stage.querySelector('.nb-world');
    const doc = stage.ownerDocument, win = doc.defaultView;
    const pins = [...stage.querySelectorAll('.nb-pin-position')];
    const listeners = [], pointers = new Map();
    let disposed = false, frame = 0, changed = false, dragged = false, suppressUntil = 0;

    function listen(target, type, fn, options) {
      target.addEventListener(type, fn, options);
      listeners.push(() => target.removeEventListener(type, fn, options));
    }
    function paint() {
      const v = state.viewport;
      world.style.transform = `translate(${(0.5-v.x*v.zoom)*100}%,${(0.5-v.y*v.zoom)*100}%) scale(${v.zoom})`;
      world.style.setProperty('--nb-zoom', v.zoom);
      const rect = map.getBoundingClientRect();
      pins.forEach(pin => {
        const x = (.5 + (Number(pin.dataset.nbX)-v.x)*v.zoom)*rect.width;
        const y = (.5 + (Number(pin.dataset.nbY)-v.y)*v.zoom)*rect.height;
        const hidden = x<24 || y<24 || x>rect.width-24 || y>rect.height-24;
        if (hidden && pin.contains(doc.activeElement)) map.focus({preventScroll:true});
        pin.style.visibility = hidden ? 'hidden' : '';
      });
      stage.querySelector('.nb-zoom-value').textContent = `${Math.round(v.zoom*100)}%`;
      stage.querySelector('[data-pm="nb-zoom-in"]').setAttribute('aria-disabled', String(v.zoom>=MAX_ZOOM));
      stage.querySelector('[data-pm="nb-zoom-out"]').setAttribute('aria-disabled', String(v.zoom<=MIN_ZOOM));
    }
    function flush() {
      if (frame) win.cancelAnimationFrame(frame);
      frame = 0;
      if (!disposed) paint();
      if (changed) {
        changed = false;
        onChange(state, {developmentId:context.developmentId, reason:'viewport'});
      }
    }
    function update() {
      changed = true;
      if (!frame) frame = win.requestAnimationFrame(flush);
    }
    function point(e) { return {x:e.clientX, y:e.clientY}; }
    function measure(points) {
      const a = points[0], b = points[1] || a;
      return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(b.x-a.x,b.y-a.y)};
    }
    function capture(id) {
      try { if (!map.hasPointerCapture(id)) map.setPointerCapture(id); } catch { /* Pointer may already have ended. */ }
    }
    function down(e) {
      if (e.button !== 0 || (e.pointerType === 'mouse' && (e.ctrlKey || e.metaKey || e.altKey))) return;
      if (pointers.size >= 2) return;
      if (!pointers.size) { dragged = false; suppressUntil = 0; }
      pointers.set(e.pointerId, {...point(e), start:point(e)});
      if (pointers.size === 2) {
        dragged = true;
        pointers.forEach((_,id) => capture(id));
      }
      // Do not capture a simple marker tap: retain native button click behavior.
      if (!e.target.closest('button')) map.focus({preventScroll:true});
    }
    function move(e) {
      const old = pointers.get(e.pointerId);
      if (!old) return;
      const before = measure([...pointers.values()]);
      const next = {...point(e),start:old.start};
      if (!dragged && Math.hypot(next.x-old.start.x,next.y-old.start.y)<5) return;
      dragged = true;
      pointers.set(e.pointerId,next);
      pointers.forEach((_,id) => capture(id));
      e.preventDefault();
      map.classList.add('is-dragging');
      const after = measure([...pointers.values()]), rect = map.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const v = state.viewport;
      const zoom = clamp(v.zoom*(before.d>0 && after.d>0 ? after.d/before.d : 1),MIN_ZOOM,MAX_ZOOM);
      const bx = (before.x-rect.left)/rect.width-.5, by = (before.y-rect.top)/rect.height-.5;
      const ax = (after.x-rect.left)/rect.width-.5, ay = (after.y-rect.top)/rect.height-.5;
      state.viewport = viewport({zoom,x:v.x+bx/v.zoom-ax/zoom,y:v.y+by/v.zoom-ay/zoom});
      update();
    }
    function end(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (dragged) suppressUntil = win.performance.now()+600;
      try { if (map.hasPointerCapture(e.pointerId)) map.releasePointerCapture(e.pointerId); } catch { /* Already released. */ }
      if (!pointers.size) { map.classList.remove('is-dragging'); flush(); }
    }
    function wheel(e) {
      if (!Number.isFinite(e.deltaY) || !e.deltaY) return;
      e.preventDefault();
      const rect = map.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const delta = clamp(e.deltaY*(e.deltaMode===1 ? 16 : e.deltaMode===2 ? rect.height : 1),-120,120);
      zoomAt(state, Math.exp(-delta*.0025), {x:clamp((e.clientX-rect.left)/rect.width,0,1),y:clamp((e.clientY-rect.top)/rect.height,0,1)});
      update();
    }
    function key(e) {
      // Escape is intentionally never prevented or stopped; the host owns it.
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.key==='Escape') return;
      if (['+','=','-','_'].includes(e.key)) {
        e.preventDefault(); e.stopPropagation();
        zoomAt(state, e.key==='+' || e.key==='=' ? 1.25 : 1/1.25); update();
      } else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        e.preventDefault(); e.stopPropagation();
        const rect = map.getBoundingClientRect(), v = state.viewport;
        state.viewport = viewport({...v,
          x:v.x+({'ArrowLeft':-1,'ArrowRight':1}[e.key] || 0)*48/Math.max(rect.width,1)/v.zoom,
          y:v.y+({'ArrowUp':-1,'ArrowDown':1}[e.key] || 0)*48/Math.max(rect.height,1)/v.zoom});
        update();
      } else if (e.key==='Home') {
        e.preventDefault(); e.stopPropagation();
        // Route selection + filter changes through the host's normal action path.
        stage.querySelector('[data-pm="nb-reset"]').click();
      }
    }
    listen(map,'pointerdown',down);
    listen(map,'pointermove',move);
    ['pointerup','pointercancel','lostpointercapture'].forEach(type => listen(map,type,end));
    listen(map,'pointerleave',e => { if (!map.hasPointerCapture(e.pointerId)) end(e); });
    listen(map,'wheel',wheel,{passive:false});
    listen(map,'keydown',key);
    listen(map,'dragstart',e => e.preventDefault());
    listen(map,'click',e => {
      if (e.detail!==0 && (dragged && pointers.size || win.performance.now()<suppressUntil)) {
        e.preventDefault(); e.stopImmediatePropagation();
      }
    },true);
    const observer = typeof win.ResizeObserver==='function' ? new win.ResizeObserver(paint) : null;
    observer?.observe(map);
    if (!observer) listen(win,'resize',paint);
    paint();

    const transfer = focusTransfers.pending;
    focusTransfers.pending = null;
    if (transfer?.state === state && transfer.developmentId === context.developmentId &&
        (!doc.activeElement || doc.activeElement===doc.body || stage.contains(doc.activeElement))) {
      const target = [...stage.querySelectorAll('[data-nb-focus]')].find(el => el.dataset.nbFocus===transfer.key);
      const fallback = stage.querySelector(`[data-nb-focus="category:${state.category}"]`);
      (target && win.getComputedStyle(target).visibility!=='hidden' ? target : fallback || map).focus({preventScroll:true});
    }

    function cleanup() {
      if (disposed) return;
      const active = doc.activeElement;
      focusTransfers.pending = stage.contains(active) ? {state,developmentId:context.developmentId,key:active.dataset.nbFocus || 'map'} : null;
      disposed = true;
      listeners.forEach(remove => remove());
      observer?.disconnect();
      pointers.forEach((_,id) => {
        try { if (map.hasPointerCapture(id)) map.releasePointerCapture(id); } catch { /* Detached target. */ }
      });
      pointers.clear();
      map.classList.remove('is-dragging');
      flush();
      mounted.delete(stage);
    }
    mounted.set(stage,cleanup);
    return cleanup;
  }

  window.PMNeighbourhood = Object.freeze({ensure,render,handleAction,mount});
})();