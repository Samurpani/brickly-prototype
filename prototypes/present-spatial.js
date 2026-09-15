/* Bricly spatial demonstrator — classic script, no dependencies or network calls.
 * Load after the prototype's UNITS / UN / DEV / UN_STATUS declarations and before
 * present-mode.js. CSS: after present-mode.css and present-experience.css.
 *
 * HOST CONTRACT
 * context = {developmentId, mode:'exterior'|'floors', state:ui.spatial[devId],
 *   selectedIds:string[], priceFor:(uid)=>EUR|null, money:(EUR)=>string}.
 * A null/nonfinite price hides it; never fall back to base price. The host owns
 * pricing, configuration, shortlist mutation and availability checks on openUnit.
 * ensure(id,state) mutates only state, returns it. Render methods call ensure.
 * selectUnit(id,state,uid) returns boolean; synchronizes without losing viewport.
 * project(id) is a fresh, pure snapshot of current inventory (no shared refs):
 * {developmentId,name,demo:true,mapping,registered,available,unplacedUnitIds,
 *  buildings:[{id,name,demo:true,unitIds,registered,available,facades:string[],
 *    floors:[{value:number,label,unitIds,registered,available,source}]}]}.
 * Only status === 'available' is available. Unknown statuses remain read-only.
 * Building assignment is alphabetical unit-ID round-robin, NOT a unit property.
 * Every building lists the union of recorded development levels, including empty
 * mapped levels. There is NO inferred continuous range or inferred stock count.
 * Optional DEV(id).floors:number[] explicitly registers additional empty levels.
 * Missing/non-numeric unit floors are kept in unplacedUnitIds, never called Ground.
 *
 * STATE (JSON-safe, owned by host; one object per development):
 * {developmentId,buildingId:null|'demo-a'|'demo-b',floor:number|null,unitId:null|string,
 *  facadeIndex:0..3,direction:'north'|'east'|'south'|'west',view:'plan'|'outlook',
 *  viewport:{x,y,zoom:1..4},byBuilding:{[id]:{floor,unitId,facadeIndex,direction,
 *  view,viewport}}}. x/y are SVG viewBox origins in a 1000 x 660 coordinate space.
 * Explicit null buildingId preserves site view. Switching buildings remembers
 * independent selections/transform; returning from a unit must reuse this state.
 *
 * ACTIONS: all data-pm="sp-*", argument in data-arg (plain escaped string).
 * site; building(id); floors; exterior; facade(0..3); facade-prev; facade-next;
 * floor(number); floor-up; floor-down; unit(uid); explore(uid); shortlist(uid);
 * view(plan|outlook); direction(north|east|south|west); fullscreen;
 * zoom-in; zoom-out; reset; pan(left|right|up|down).
 * handleAction -> {handled:boolean,media?,openUnit?,shortlistUnit?,openViewer?}.
 * Unavailable units ARE inspectable/openable, but never shortlisted here. Host
 * must keep their unit screen read-only. Invalid args are handled no-ops.
 * OpenViewer is {items,index,title}; items are generated, self-contained SVGs with
 * plan:false (no annotation tools). Host adds root/onClose and opens PMViewer,
 * WITHOUT rerendering under it; delegate keys to active PMViewer FIRST.
 * mount(root,context,onChange) returns cleanup. It installs only plan pointer /
 * keyboard handlers, updates viewBox directly and calls onChange(state) once per
 * completed gesture (persist only, DO NOT rerender in this callback). Host owns
 * delegated action clicks and SVG Enter/Space synthesis. Cleanup before rerender.
 * SVG keyboard equivalents and HTML unit buttons remain available without mount.
 * Restore focus to the equivalent data-pm/data-arg after host rerenders.
 *
 * FUTURE PROJECT METADATA (not an upload UI or an accepted untrusted SVG input):
 * {version:1,developmentId,approved:true,provenance,buildings:[{id,name,
 *   footprint:number[][],facades:[{id,label,assetId,approved,provenance}],
 *   floors:[{id,elevation,label,unitIds,outline:number[][],
 *     units:[{unitId,polygon:number[][]}],core:number[][],
 *     outlooks:[{direction,assetId,captureElevation,approved,provenance}]}]}]}.
 * Replace project()/geometry adapters after validation: finite coordinates,
 * unique IDs, explicit complete floor registry (incl. empty), exact inventory
 * membership, trusted asset URLs and approved provenance. Keep unit status and
 * prices sourced live from inventory/host. Do not strip demo labels until those
 * adapters have real approved project geometry and outlooks. No true-3D claim.
 */
(() => {
  'use strict';
  const SIDES = ['North · Garden frontage', 'East · Arrival elevation', 'South · Courtyard frontage', 'West · Service elevation'];
  const DIRECTIONS = ['north', 'east', 'south', 'west'];
  const W = 1000, H = 660;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const floorNumber = value => (finite(value) || (typeof value === 'string' && value.trim() && Number.isFinite(+value))) ? +value : null;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const allUnits = () => typeof UNITS !== 'undefined' && Array.isArray(UNITS) ? UNITS : [];
  const unit = id => typeof UN === 'function' ? UN(id) : allUnits().find(u => u.id === id);
  const development = id => typeof DEV === 'function' ? DEV(id) : null;
  const levelLabel = n => n === 0 ? 'Ground' : `Level ${n}`;
  const statusKey = u => ['available','hold','reserved','sold'].includes(u?.status) ? u.status : 'unknown';
  const statusLabel = u => (typeof UN_STATUS !== 'undefined' && UN_STATUS[u?.status]?.l) || ({available:'Available',hold:'On hold',reserved:'Reserved',sold:'Sold'}[u?.status]) || 'Status not supplied';
  const available = ids => ids.filter(id => unit(id)?.status === 'available').length;
  const btn = (label, action, arg = '', pressed, disabled = false, extra = '') => `<button type="button" class="sp-button ${extra}" data-pm="sp-${esc(action)}" data-arg="${esc(arg)}"${pressed === undefined ? '' : ` aria-pressed="${!!pressed}"`}${disabled ? ' disabled' : ''}>${esc(label)}</button>`;
  const svgAction = (action, arg, label, selected = false) => `role="button" tabindex="0" data-pm="sp-${esc(action)}" data-arg="${esc(arg)}" aria-label="${esc(label)}" aria-pressed="${selected}"`;
  const svg = (body, label, extra = '', box = `0 0 ${W} ${H}`) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${esc(box)}" class="sp-diagram" role="group" aria-label="${esc(label)}" ${extra}><title>${esc(label)}</title>${body}</svg>`;
  const text = (x, y, label, size = 16, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" ${extra}>${esc(label)}</text>`;
  const tree = (x,y,r=23) => `<g class="sp-tree"><circle cx="${x+4}" cy="${y+7}" r="${r}" class="sp-shadow"/><circle cx="${x}" cy="${y}" r="${r}"/><path d="M${x-r/2} ${y}h${r}M${x} ${y-r/2}v${r}"/></g>`;

  function project(developmentId) {
    const d = development(developmentId);
    const rows = d ? allUnits().filter(u => u.dev === d.name) : [];
    const ids = rows.map(u => u.id).sort();
    const explicit = Array.isArray(d?.floors) ? d.floors.filter(finite) : [];
    // Villas may have internal storeys, but are sold as whole properties. Never
    // interpret a placeholder inventory floor=0 as an apartment-level explorer.
    const floorSetting=d?.presentSpatial?.floorNavigation;
    const villaOnly=rows.length>0&&rows.every(u=>/\bvilla\b/i.test(String(u.type)));
    const floorNavigation=floorSetting!==false&&(!villaOnly||floorSetting===true);
    const levels = floorNavigation?[...new Set([...explicit, ...rows.map(u => floorNumber(u.floor)).filter(n => n !== null)])].sort((a,b) => a-b):[];
    const buildings = ['demo-a','demo-b'].map((id,index) => {
      const unitIds = ids.filter((_,n) => n % 2 === index);
      return {id, name:index ? 'Building B · Garden House' : 'Building A · Courtyard House', demo:true,
        unitIds, registered:unitIds.length, available:available(unitIds), facades:SIDES.slice(),
        floors:levels.map(value => {
          const onLevel = unitIds.filter(uid => floorNumber(unit(uid)?.floor) === value);
          return {value,label:levelLabel(value),unitIds:onLevel,registered:onLevel.length,available:available(onLevel),
            source:explicit.includes(value) ? 'development floor registry' : 'recorded development unit floors'};
        })};
    });
    return {developmentId:d?.id ?? developmentId,name:d?.name || 'Development not found',demo:true,
      mapping:'Demo mapping: unit IDs sorted alphabetically and alternated between two illustrative buildings. Not actual building assignments.',
      registered:ids.length,available:available(ids),hasFloors:levels.length>0,unplacedUnitIds:rows.filter(u => floorNumber(u.floor) === null).map(u => u.id),buildings};
  }
  function cleanViewport(v) {
    const zoom = clamp(finite(v?.zoom) ? v.zoom : 1,1,4);
    return {zoom,x:clamp(finite(v?.x) ? v.x : 0,0,W-W/zoom),y:clamp(finite(v?.y) ? v.y : 0,0,H-H/zoom)};
  }
  function save(s) {
    if (!s.buildingId) return;
    s.byBuilding[s.buildingId] = {floor:s.floor,unitId:s.unitId,facadeIndex:s.facadeIndex,direction:s.direction,view:s.view,viewport:{...s.viewport}};
  }
  function ensure(developmentId, state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) throw new TypeError('PMSpatial requires a mutable per-development state object.');
    const p = project(developmentId), s = state;
    if (s.developmentId != null && s.developmentId !== p.developmentId) {
      Object.assign(s,{buildingId:null,floor:null,unitId:null,facadeIndex:0,direction:'north',view:'plan',viewport:null,byBuilding:{}});
    }
    s.developmentId = p.developmentId;
    if (!s.byBuilding || typeof s.byBuilding !== 'object' || Array.isArray(s.byBuilding)) s.byBuilding = {};
    // Drop stale memories; always revalidate restored entries against live inventory.
    Object.keys(s.byBuilding).forEach(k => { if (!p.buildings.some(b => b.id === k)) delete s.byBuilding[k]; });
    const b = p.buildings.find(b => b.id === s.buildingId);
    s.buildingId = b?.id ?? null;
    const value = floorNumber(s.floor);
    s.floor = b ? (b.floors.some(f => f.value === value) ? value : b.floors.find(f => f.registered)?.value ?? b.floors[0]?.value ?? null) : null;
    if (!b?.floors.find(f => f.value === s.floor)?.unitIds.includes(s.unitId)) s.unitId = null;
    s.facadeIndex = Number.isInteger(s.facadeIndex) && s.facadeIndex >= 0 && s.facadeIndex < 4 ? s.facadeIndex : 0;
    s.direction = DIRECTIONS.includes(s.direction) ? s.direction : 'north';
    s.view = s.view === 'outlook' ? 'outlook' : 'plan';
    s.viewport = cleanViewport(s.viewport);
    save(s);
    return s;
  }
  function chooseBuilding(id,s,bid) {
    const b = project(id).buildings.find(b => b.id === bid);
    if (!b) return false;
    save(s);
    const remembered = s.byBuilding[bid];
    Object.assign(s,{floor:null,unitId:null,facadeIndex:0,direction:'north',view:'plan',viewport:null},remembered && typeof remembered === 'object' ? remembered : {},{buildingId:bid});
    ensure(id,s);
    return true;
  }
  function selectUnit(id,s,uid) {
    ensure(id,s);
    const p = project(id), b = p.buildings.find(b => b.unitIds.includes(uid));
    const f = b?.floors.find(f => f.unitIds.includes(uid));
    if (!b || !f) return false;
    if (s.buildingId !== b.id) chooseBuilding(id,s,b.id);
    Object.assign(s,{floor:f.value,unitId:uid});
    save(s);
    return true;
  }
  function model(c) {
    const s = ensure(c.developmentId,c.state), p = project(c.developmentId);
    const b = p.buildings.find(b => b.id === s.buildingId);
    return {s,p,b,f:b?.floors.find(f => f.value === s.floor)};
  }
  function disclosure(p) {
    return `<div class="sp-disclosure"><span class="sp-demo-badge">Illustrative demo</span><p>Buildings, geometry, orientation and outlooks are invented for this demonstration. Inventory floors, IDs and statuses come from the prototype.</p><details><summary>About this demo mapping</summary><p>${esc(p.mapping)} Only recorded or explicitly registered levels are shown; gaps are not inferred. Zero registered units does not mean a floor is available or sold out. Plans are not to scale.</p>${p.unplacedUnitIds.length ? `<p>${p.unplacedUnitIds.length} units have no recorded floor and cannot be placed: ${p.unplacedUnitIds.map(esc).join(', ')}.</p>` : ''}</details></div>`;
  }
  function site(p) {
    const blocks = p.buildings.map((b,i) => {
      const x = i ? 548 : 182, y = i ? 182 : 160, w = i ? 232 : 286, h = i ? 284 : 252;
      return `<g class="sp-site-building" ${svgAction('building',b.id,`${b.name}; ${b.registered} registered units; select building`)}>
        <rect x="${x+12}" y="${y+17}" width="${w}" height="${h}" rx="7" class="sp-shadow"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="sp-roof"/>
        ${i ? `<path d="M${x+24} ${y+20}v${h-40}h${w-48}V${y+20}Z" class="sp-roof-detail"/><path d="M${x+40} ${y+55}h${w-80}m-${w-80} 35h${w-80}" class="sp-roof-detail"/>` : `<rect x="${x+70}" y="${y+58}" width="146" height="124" rx="4" class="sp-courtyard"/>${tree(x+143,y+118,32)}`}
        <rect x="${x+22}" y="${y+h-49}" width="${w-44}" height="32" rx="6" class="sp-site-label"/>
        ${text(x+w/2,y+h-27,`BUILDING ${i ? 'B' : 'A'}  →`,16,'text-anchor="middle"')}
      </g>${text(x+w/2,y+h+42,`${b.registered} registered · ${b.available} available`,15,'text-anchor="middle"')}`;
    }).join('');
    return svg(`<rect width="1000" height="660" class="sp-paper"/><path d="M80 84Q470 30 905 115L929 562Q520 633 75 546Z" class="sp-site-land"/>
      <path d="M86 508H912M506 100V551" class="sp-path"/><path d="M86 508H912M506 100V551" class="sp-path-center"/>
      ${[[122,155],[129,267],[133,409],[853,194],[853,301],[851,422],[290,567],[686,567]].map(([x,y])=>tree(x,y,25)).join('')}
      <rect x="570" y="102" width="179" height="32" rx="16" class="sp-water"/>${blocks}
      ${text(499,606,'ILLUSTRATIVE SITE · SELECT A BUILDING',13,'text-anchor="middle" letter-spacing="3"')}
      <path d="M923 78v-36m-8 12 8-12 8 12" class="sp-line"/>${text(923,99,'N*',14,'text-anchor="middle"')}`,'Illustrative two-building site overview; orientation is demo only');
  }
  function facade(b,s) {
    const side = s.facadeIndex, garden = b.id === 'demo-b';
    const width = [garden ? 480 : 620, garden ? 360 : 420, garden ? 540 : 620, garden ? 340 : 420][side];
    const x = (W-width)/2, n = Math.max(1,b.floors.length), row = Math.min(65,410/n), height = n*row, top = 530-height;
    const strips = b.floors.slice().reverse().map((f,i) => {
      const y = top+i*row, selected = f.value === s.floor;
      const cols = side % 2 ? 3 : garden ? 4 : 6;
      const bays = Array.from({length:cols},(_,j) => {
        const wx = x+24+j*(width-48)/cols, ww = (width-48)/cols-14;
        return side === 3 && j === 1 ? `<path d="M${wx} ${y+5}l${ww} ${row-10}m-${ww} 0 ${ww}-${row-10}" class="sp-line"/>` : `<rect x="${wx}" y="${y+row*.19}" width="${ww}" height="${row*.6}" rx="2" class="sp-glass"/>${side === 0 || side === 2 ? `<path d="M${wx-5} ${y+row*.79}h${ww+10}v-8H${wx-5}Z" class="sp-balcony"/>` : ''}`;
      }).join('');
      return `<g class="sp-facade-level" ${svgAction('open-floor',f.value,`${f.label} · ${f.registered} registered units · ${f.available} available; open floor plan`,selected)}><title>${esc(f.label)} · Open floor plan</title><rect x="${x}" y="${y}" width="${width}" height="${row}" class="sp-facade-band ${selected ? 'sp-level-active' : 'sp-wall'}"/>${bays}${text(x-20,y+row*.65,f.label,12,'text-anchor="end"')}<rect class="sp-floor-hit" x="${x}" y="${y}" width="${width}" height="${row}"/><g class="sp-floor-callout" aria-hidden="true"><rect x="${x+width/2-130}" y="${y+row/2-17}" width="260" height="34" rx="8"/>${text(x+width/2,y+row/2+5,`${f.label} · Open floor plan →`,15,'text-anchor="middle"')}</g></g>`;
    }).join('');
    return svg(`<rect width="1000" height="660" class="sp-paper"/><circle cx="787" cy="124" r="52" class="sp-sun"/>
      <path d="M66 533H934" class="sp-line"/><ellipse cx="502" cy="540" rx="${width/2+50}" ry="15" class="sp-shadow"/>
      <path d="M${x+15} ${top}v-25h${width-30}v25" class="sp-roof"/>${strips||`<rect x="${x}" y="${top}" width="${width}" height="${height}" class="sp-wall"/><path d="M${x+30} ${top+15}h${width-60}v35H${x+30}Z" class="sp-glass"/>`}
      ${side === 1 ? `<path d="M460 530v-61h80v61" class="sp-glass"/><path d="M431 472h138l-15-18H446Z" class="sp-roof"/>` : side === 2 ? `<path d="M${x} 540q${width/2}-${70+(garden?35:0)} ${width} 0" class="sp-garden-edge"/>` : ''}
      ${tree(x-65,503,33)}${tree(x+width+65,496,40)}
      ${text(500,586,SIDES[side],22,'text-anchor="middle"')}${text(500,615,'DEMO ELEVATION · RECORDED LEVELS ONLY · NOT TO SCALE',12,'text-anchor="middle" letter-spacing="2"')}`,`${b.name}, illustrative ${SIDES[side]}`,'data-sp-facade');
  }
  function floorControls(b,s) {
    if (!b) return '';
    const i = b.floors.findIndex(f => f.value === s.floor);
    return `<div class="sp-floor-controls" role="group" aria-label="Select a registered floor">${btn('↓ Lower floor','floor-down','',undefined,i <= 0)}<strong>${esc(s.floor === null ? 'No recorded floors' : levelLabel(s.floor))}</strong>${btn('Higher floor ↑','floor-up','',undefined,i < 0 || i === b.floors.length-1)}</div><div class="sp-floor-chips">${b.floors.map(f=>btn(`${f.label} · ${f.registered}`,'floor',f.value,f.value === s.floor)).join('')}</div>`;
  }
  function legend() {
    return `<div class="sp-legend" aria-label="Inventory status legend">${['available','hold','reserved','sold','unknown'].map(k=>`<span><i class="sp-status-dot sp-${k}"></i>${esc(statusLabel({status:k}))}</span>`).join('')}<span>Counts = registered records</span></div>`;
  }
  function plan(b,f,s) {
    const ids = f?.unitIds || [], n = ids.length, cols = Math.max(1,Math.ceil(n/2)), cell = 720/cols;
    const footprints = ids.map((uid,i) => {
      const col = i % cols, lower = i >= cols, x = 140+col*cell, y = lower ? 365 : 120, w = cell-12, h = 170;
      const u = unit(uid), selected = uid === s.unitId;
      return `<g class="sp-footprint sp-${statusKey(u)} ${selected?'sp-selected':''}" ${svgAction('unit',uid,`${uid}, ${statusLabel(u)}, ${f.label}; inspect unit`,selected)}>
        <path d="M${x} ${y}h${w}v${h-24}h-26v24H${x}Z" class="sp-unit-fill"/>
        <path d="M${x+8} ${y+42}h${w*.36}v${h-61}M${x+w*.36} ${y+80}h${w*.64-8}" class="sp-room-line"/>
        <rect x="${x+9}" y="${lower?y+h-12:y-18}" width="${w-18}" height="12" class="sp-terrace"/>
        <path d="M${x+w-46} ${lower?y:y+h}v${lower?23:-23}m0 0q23 0 23 ${lower?-23:23}" class="sp-room-line"/>
        ${text(x+w*.62,y+64,uid,Math.min(18,cell/7),'text-anchor="middle" class="sp-unit-id"')}
        ${text(x+w*.62,y+92,statusLabel(u),Math.min(13,cell/9),'text-anchor="middle"')}
        ${selected ? text(x+w-20,y+26,'✓',20,'text-anchor="middle"') : ''}</g>`;
    }).join('');
    return svg(`<rect width="1000" height="660" class="sp-paper"/>
      <path d="M106 81H895V565H106Z" class="sp-plan-boundary"/>
      <path d="M123 307H878V348H123Z" class="sp-corridor"/>${text(500,333,'SHARED GALLERY · DEMO CIRCULATION',12,'text-anchor="middle" letter-spacing="2"')}
      <rect x="65" y="272" width="55" height="104" class="sp-core"/>${Array.from({length:9},(_,i)=>`<path d="M70 ${281+i*10}h44" class="sp-room-line"/>`).join('')}
      <rect x="878" y="291" width="52" height="68" class="sp-core"/>${text(904,329,'LIFT',11,'text-anchor="middle"')}
      ${footprints || `<rect x="140" y="118" width="720" height="163" class="sp-unmapped"/>${text(500,189,'No registered units on this mapped level',20,'text-anchor="middle"')}${text(500,222,'Blank geometry is not available inventory',14,'text-anchor="middle"')}`}
      ${tree(77,490,22)}${tree(925,159,25)}${text(500,613,'ILLUSTRATIVE WHOLE-LEVEL PLAN · NOT TO SCALE',12,'text-anchor="middle" letter-spacing="2"')}
      <path d="M932 90V50m-7 10 7-10 7 10" class="sp-line"/>${text(932,110,'N*',12,'text-anchor="middle"')}`,`${b.name}, ${f?.label || 'no recorded level'}, whole-level demo plan. Select a footprint or use the unit buttons below.`, 'data-sp-plan tabindex="0"', `${s.viewport.x} ${s.viewport.y} ${W/s.viewport.zoom} ${H/s.viewport.zoom}`);
  }
  function outlook(b,s) {
    // Entirely generated; varied geometry by recorded level, direction and building.
    // Self-contained colours make the exact same SVG safe to show in PMViewer.
    const dir = DIRECTIONS.indexOf(s.direction), floor = s.floor ?? 0;
    const horizon = 272 + Math.min(90,Math.max(-40,floor*3)), seed = dir*37+(b.id==='demo-b'?19:0);
    const skyline = Array.from({length:19},(_,i)=> {
      const x = i*59-15, h = 35+((i*31+seed*7)%103);
      return `<rect x="${x}" y="${horizon-h}" width="48" height="${h+100}" fill="${i%2?'#b0b8ac':'#c4c9bb'}"/><path d="M${x+9} ${horizon-h+15}h28m-28 13h28" stroke="#e5e8dd" stroke-width="3"/>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 660" class="sp-diagram sp-panorama" role="img" aria-label="${esc(`${b.name}, ${levelLabel(floor)}, ${s.direction}. Illustrative view · not an actual outlook`)}">
      <rect width="1000" height="660" fill="#e9ede5"/><circle cx="${190+dir*173}" cy="126" r="46" fill="#f7f4df"/>
      <path d="M0 ${horizon-23}Q220 ${horizon-150} 430 ${horizon-28}T1000 ${horizon-70}V660H0Z" fill="#d1d9c9"/>
      ${skyline}<path d="M0 ${horizon+60}Q310 ${horizon+16} 1000 ${horizon+103}V660H0Z" fill="${dir%2?'#a4b49c':'#a5bfc0'}"/>
      ${Array.from({length:7},(_,i)=>`<path d="M${60+i*91} ${horizon+100+i*14}h${240+i*22}" stroke="#e5e9df" stroke-opacity=".5" fill="none"/>`).join('')}
      <path d="M0 585L500 ${horizon+103} 1000 585V660H0Z" fill="#d7d3c5"/>
      <path d="M0 581H1000M0 603H1000" stroke="#747e72" stroke-width="8"/>
      ${[50,240,430,620,810,980].map(x=>`<path d="M${x} 583v77" stroke="#747e72" stroke-width="6"/>`).join('')}
      <rect x="30" y="28" width="940" height="78" rx="12" fill="#faf9f3" fill-opacity=".96"/>
      <g font-family="Arial,sans-serif" fill="#354338"><text x="52" y="58" font-size="20">Illustrative view · not an actual outlook</text>
      <text x="52" y="85" font-size="14">${esc(b.name)} · ${esc(levelLabel(floor))} · ${esc(s.direction)} (demo direction)</text></g></svg>`;
  }
  function unitDetails(c,f) {
    const u = f?.unitIds.includes(c.state.unitId) ? unit(c.state.unitId) : null;
    if (!u) return `<div class="sp-unit-detail"><span class="sp-kicker">Select a residence</span><h3>${f?.registered ? 'Every footprint has a story.' : 'No registered units here.'}</h3><p>${f?.registered ? 'Select a coloured footprint or a unit below to inspect its live inventory details.' : 'This level remains inspectable. No availability is inferred from the empty demo mapping.'}</p></div>`;
    const av = u.status === 'available', chosen = (c.selectedIds || []).includes(u.id);
    let price = null;
    if (typeof c.priceFor === 'function') price = c.priceFor(u.id);
    const label = finite(price) && typeof c.money === 'function' ? c.money(price) : 'Price on request';
    return `<section class="sp-unit-detail" aria-label="Selected unit details"><span class="sp-kicker">Selected residence</span><div class="sp-unit-title"><h3>${esc(u.id)}</h3><span class="sp-status-pill sp-${statusKey(u)}">${esc(statusLabel(u))}</span></div><p>${esc(u.type)} · ${u.beds===0?'Studio':esc(u.beds??'—')+' bedrooms'} · ${esc(u.sqm??'—')} m² · ${esc(f.label)}</p><strong class="sp-price">${esc(label)}</strong>${!av?'<p class="sp-readonly">Read-only inspection. This unit is not available to shortlist or configure.</p>':''}<div class="sp-actions">${btn(av?'Explore unit →':'Inspect unit →','explore',u.id,undefined,false,'sp-primary')}${btn(chosen?'✓ Shortlisted':av?'Add to shortlist':'Unavailable to shortlist','shortlist',u.id,undefined,!av||chosen)}</div></section>`;
  }
  function unitButtons(c,f) {
    return `<div class="sp-level-units" role="group" aria-label="All registered units on selected floor">${(f?.unitIds||[]).map(uid=>btn(`${uid} · ${statusLabel(unit(uid))}${(c.selectedIds||[]).includes(uid)?' · Shortlisted':''}`,'unit',uid,uid===c.state.unitId)).join('')}</div>`;
  }
  function silhouette(b,s) {
    const n = b.floors.length, h = Math.max(120,n*46+44);
    return `<svg xmlns="http://www.w3.org/2000/svg" class="sp-silhouette" viewBox="0 0 300 ${h}" role="img" aria-label="${esc(b.name)} complete recorded-level outline; selected ${esc(s.floor === null?'none':levelLabel(s.floor))}"><path d="M72 22V8h156v14" class="sp-roof"/>${b.floors.slice().reverse().map((f,i)=>`<g><rect x="${b.id==='demo-b'?80:62}" y="${24+i*46}" width="${b.id==='demo-b'?140:176}" height="44" class="${s.floor===f.value?'sp-level-active':'sp-wall'}"/>${text(10,52+i*46,f.value===0?'G':String(f.value),14)}${text(150,52+i*46,`${f.registered} units · ${f.available} available`,11,'text-anchor="middle"')}</g>`).join('')}<path d="M45 ${h-16}H252" class="sp-line"/></svg>`;
  }
  function renderStage(c) {
    const {s,p,b,f} = model(c), floors = c.mode === 'floors';
    const heading = !b ? 'A place to begin.' : floors ? `${b.name.split(' · ')[1]} · ${f?.label || 'No recorded floors'}` : b.name.split(' · ')[1];
    const navigation = !b ? '' : `${btn('← Site overview','site')}${floors?btn('Project','exterior'):b.floors.length?btn('Explore floors →','floors','',undefined,false,'sp-primary'):''}`;
    const buildingTabs = `<div class="sp-building-tabs" role="group" aria-label="Illustrative buildings">${p.buildings.map(x=>btn(`${x.name} · ${x.registered} units`,'building',x.id,s.buildingId===x.id)).join('')}</div>`;
    let content;
    if (!b) content = `<div class="sp-art">${site(p)}</div><p class="sp-caption">Two illustrative buildings. ${p.registered} registered units · ${p.available} available in current inventory. Choose a building to see its elevations.</p>`;
    else if (!floors) content = `<div class="sp-facade-controls">${btn('← Previous side','facade-prev')}<div class="sp-side-tabs">${SIDES.map((side,i)=>btn(side,'facade',i,s.facadeIndex===i)).join('')}</div>${btn('Next side →','facade-next')}</div>${b.floors.length?'<p class="sp-level-hint">Hover or focus a level to highlight it. Click, tap or press Enter to open its floor plan.</p>':''}<div class="sp-art">${facade(b,s)}</div><div class="sp-inspector"><strong>${esc(b.name)}</strong><p>${b.registered} registered units · ${b.available} available${b.floors.length?` · ${b.floors.length} recorded levels in the demo mapping`:' · Explore individual properties in the Units list.'}</p>${b.floors.length?btn('Explore floors →','floors','',undefined,false,'sp-primary'):''}</div>${b.floors.length?`<div class="sp-facade-floor-list" role="group" aria-label="Open a floor plan">${b.floors.map(f=>btn(`${f.label} →`,'open-floor',f.value,s.floor===f.value)).join('')}</div>`:''}`;
    else content = `<details class="sp-mobile-outline" open><summary>Building outline · ${esc(f?.label||'No recorded floors')}</summary><div class="sp-outline-wrap">${silhouette(b,s)}</div></details><div class="sp-stage-floor-nav">${floorControls(b,s)}</div><div class="sp-view-tabs" role="group" aria-label="Level display">${btn('Whole-level plan','view','plan',s.view==='plan')}${btn('Views from this level · demo','view','outlook',s.view==='outlook',!f)}</div>
      ${s.view==='outlook'?`<div class="sp-directions" role="group" aria-label="Illustrative outlook direction">${DIRECTIONS.map(d=>btn(d[0].toUpperCase()+d.slice(1),'direction',d,s.direction===d)).join('')}${btn('Open fullscreen ↗','fullscreen')}</div><div class="sp-art">${outlook(b,s)}</div><p class="sp-caption">Illustrative view · not an actual outlook. Generated scenery changes with recorded level and demo direction; it does not establish views, sightlines or orientation.</p>`:`<div class="sp-plan-tools" role="group" aria-label="Plan viewport controls">${btn('− Zoom out','zoom-out','',undefined,s.viewport.zoom<=1)}${btn('+ Zoom in','zoom-in','',undefined,s.viewport.zoom>=4)}${btn('Fit plan','reset')}<span>Drag to pan · pinch to zoom · arrow keys to pan</span></div><div class="sp-art sp-plan-art">${plan(b,f,s)}</div>${legend()}<p class="sp-caption">${f?.registered||0} registered units · ${f?.available||0} available on this mapped level. Layout, room partitions, shared spaces and compass are illustrative.</p>`}
      <div class="sp-mobile-detail">${unitDetails(c,f)}${unitButtons(c,f)}</div>`;
    return `<section class="sp-stage-content" aria-label="Illustrative spatial explorer"><header class="sp-heading"><div><span class="sp-kicker">${esc(p.name)} / ${floors?'Explore floors':'Explore the project'}</span><h2>${esc(heading)}</h2></div><div class="sp-actions">${navigation}</div></header>${disclosure(p)}${buildingTabs}${content}</section>`;
  }
  function renderPanel(c) {
    const {s,b,f} = model(c);
    if (!b) return `<section class="sp-panel"><h3>Choose a demo building</h3><p>Select a building in the site overview to inspect its recorded floors.</p></section>`;
    return `<section class="sp-panel" aria-label="Building floors and selected unit"><div><span class="sp-kicker">Demo building outline</span><h3>${esc(b.name)}</h3><p>All ${b.floors.length} recorded levels · ${b.registered} mapped units. Height and spacing are illustrative.</p></div><div class="sp-outline-wrap">${silhouette(b,s)}</div>${floorControls(b,s)}<p class="sp-caption">${f?.registered||0} registered · ${f?.available||0} available on this level</p>${unitDetails(c,f)}${unitButtons(c,f)}</section>`;
  }
  function zoom(s,factor) {
    const v = s.viewport, z = clamp(v.zoom*factor,1,4);
    s.viewport = cleanViewport({zoom:z,x:v.x+W/v.zoom/2-W/z/2,y:v.y+H/v.zoom/2-H/z/2});
  }
  function pan(s,direction) {
    const v = s.viewport, step = 80/v.zoom;
    s.viewport = cleanViewport({...v,x:v.x+(direction==='left'?-step:direction==='right'?step:0),y:v.y+(direction==='up'?-step:direction==='down'?step:0)});
  }
  function handleAction(action,arg,c) {
    if (typeof action !== 'string' || !action.startsWith('sp-')) return {handled:false};
    const {s,p,b,f} = model(c), result = {handled:true};
    const a = action.slice(3), value = String(arg ?? '');
    switch(a) {
      case 'site': save(s); s.buildingId=null; s.floor=null; s.unitId=null; result.media='exterior'; break;
      case 'building': chooseBuilding(c.developmentId,s,value); break;
      case 'floors': if(p.hasFloors){if (!b) chooseBuilding(c.developmentId,s,p.buildings.find(x=>x.floors.length).id);if(project(c.developmentId).buildings.find(x=>x.id===s.buildingId)?.floors.length)result.media='floors';} break;
      case 'open-floor': {
        const next=b?.floors.find(x=>value.trim()&&x.value===+value);
        if(next){s.floor=next.value;s.unitId=null;s.view='plan';result.media='floors';}
        break;
      }
      case 'exterior': result.media='exterior'; break;
      case 'facade': if (/^[0-3]$/.test(value)) s.facadeIndex=+value; break;
      case 'facade-prev': s.facadeIndex=(s.facadeIndex+3)%4; break;
      case 'facade-next': s.facadeIndex=(s.facadeIndex+1)%4; break;
      case 'floor': case 'floor-up': case 'floor-down': {
        const i = b?.floors.findIndex(x=>x.value===s.floor) ?? -1;
        const next = a==='floor' ? b?.floors.find(x=>value.trim() && x.value===+value) : b?.floors[i+(a==='floor-up'?1:-1)];
        if (next) {s.floor=next.value; s.unitId=null;}
        break;
      }
      case 'unit': selectUnit(c.developmentId,s,value); break;
      case 'explore': if (f?.unitIds.includes(value) && unit(value)) {s.unitId=value;result.openUnit=value;} break;
      case 'shortlist': if (f?.unitIds.includes(value) && unit(value)?.status==='available' && !(c.selectedIds||[]).includes(value)) result.shortlistUnit=value; break;
      case 'view': if (['plan','outlook'].includes(value) && (value==='plan'||f)) s.view=value; break;
      case 'direction': if (DIRECTIONS.includes(value)) s.direction=value; break;
      case 'fullscreen': if (b && f) result.openViewer={title:`${b.name} · ${f.label} · Illustrative outlook`,index:DIRECTIONS.indexOf(s.direction),items:DIRECTIONS.map(direction=>({key:`sp-demo-outlook-v1:${p.developmentId}:${b.id}:${f.value}:${direction}`,html:outlook(b,{...s,direction}),caption:`${f.label} · ${direction} · Illustrative view · not an actual outlook`,provenance:'Generated demo scenery. Not actual project imagery, sightlines or orientation.',plan:false}))}; break;
      case 'zoom-in': zoom(s,1.25); break;
      case 'zoom-out': zoom(s,1/1.25); break;
      case 'reset': s.viewport={x:0,y:0,zoom:1}; break;
      case 'pan': if (['left','right','up','down'].includes(value)) pan(s,value); break;
      default: return {handled:false};
    }
    save(s);
    return result;
  }
  function mount(root,c,onChange=()=>{}) {
    const el = root?.querySelector('[data-sp-plan]');
    if (!el) return ()=>{};
    const s = ensure(c.developmentId,c.state), points = new Map(), listeners=[];
    let start=null, moved=false, suppress=false, disposed=false;
    const listen = (type,fn,options) => {el.addEventListener(type,fn,options);listeners.push(()=>el.removeEventListener(type,fn,options));};
    const draw = () => {const v=s.viewport;el.setAttribute('viewBox',`${v.x} ${v.y} ${W/v.zoom} ${H/v.zoom}`);};
    const persist = () => {save(s);onChange(s);};
    const dimensions = () => {const r=el.getBoundingClientRect();return {scale:Math.min(r.width/W,r.height/H),r};};
    const gesture = () => {
      const ps=[...points.values()], a=ps[0], b=ps[1]||a;
      return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)};
    };
    const begin = () => {
      if (!points.size) {start=null;return;}
      const g=gesture(), {scale,r}=dimensions(), v=s.viewport;
      start={...g,v:{...v},scale,anchorX:v.x+(g.x-r.left-(r.width-W*scale)/2)/scale/v.zoom,anchorY:v.y+(g.y-r.top-(r.height-H*scale)/2)/scale/v.zoom};
    };
    listen('pointerdown',e=>{
      if (e.button!==0 || points.size>=2) return;
      if (!points.size) {moved=false;suppress=false;}
      points.set(e.pointerId,{x:e.clientX,y:e.clientY});
      // Capture only after drag threshold: a normal footprint tap must target it.
      begin();
    });
    listen('pointermove',e=>{
      if (!points.has(e.pointerId) || !start) return;
      points.set(e.pointerId,{x:e.clientX,y:e.clientY});
      const g=gesture(), dx=g.x-start.x,dy=g.y-start.y;
      if (Math.hypot(dx,dy)>5 || (points.size===2 && Math.abs(g.d-start.d)>3)) moved=true;
      if (!moved || !start.scale) return;
      e.preventDefault();suppress=true;
      for (const pid of points.keys()) {try {el.setPointerCapture(pid);} catch (_) {/* pointer already ended */}}
      const z=clamp(start.v.zoom*(start.d>0 && points.size===2 ? g.d/start.d : 1),1,4);
      s.viewport=cleanViewport({zoom:z,x:start.anchorX-(start.anchorX-start.v.x)*start.v.zoom/z-dx/start.scale/z,y:start.anchorY-(start.anchorY-start.v.y)*start.v.zoom/z-dy/start.scale/z});
      draw();
    });
    const end = e => {
      if (!points.has(e.pointerId)) return;
      points.delete(e.pointerId);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (!points.size && moved && !disposed) persist();
      begin();
    };
    listen('pointerup',end);listen('pointercancel',end);listen('lostpointercapture',end);
    listen('pointerleave',e=>{if (!el.hasPointerCapture(e.pointerId)) end(e);});
    listen('click',e=>{if (suppress && e.detail!==0) {e.preventDefault();e.stopImmediatePropagation();suppress=false;}},true);
    listen('keydown',e=>{
      if (e.target!==el || e.altKey || e.ctrlKey || e.metaKey) return;
      const dirs={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
      if (dirs[e.key]) pan(s,dirs[e.key]);
      else if (e.key==='+'||e.key==='=') zoom(s,1.25);
      else if (e.key==='-') zoom(s,1/1.25);
      else if (e.key==='0'||e.key==='Home') s.viewport={x:0,y:0,zoom:1};
      else return;
      e.preventDefault();e.stopPropagation();draw();persist();
    });
    draw();
    return ()=>{disposed=true;listeners.forEach(fn=>fn());for (const id of points.keys()) {if(el.hasPointerCapture(id))el.releasePointerCapture(id);}points.clear();};
  }
  window.PMSpatial = Object.freeze({ensure,project,renderStage,renderPanel,handleAction,selectUnit,mount});
})();