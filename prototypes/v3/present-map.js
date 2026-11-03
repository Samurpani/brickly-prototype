/* Local, dependency-free Present Mode map. The host owns mounting and events.
 * Call PMMap.load().then(() => renderHost()) and insert PMMap.render(...) markup.
 * Geometry has no embedded provenance; retain OpenStreetMap attribution.
 */
(() => {
  'use strict';

  const WIDTH = 800, HEIGHT = 500, PAD = 64;
  let pending = null, geometry = null, state = 'idle';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const finitePair = point => Array.isArray(point) &&
    Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
    Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90;

  function prepare(data) {
    const source = data?.type === 'Feature' ? data.geometry : data;
    const polygons = source?.type === 'MultiPolygon' ? source.coordinates :
      source?.type === 'Polygon' ? [source.coordinates] : null;
    if (!Array.isArray(polygons) || !polygons.length) throw new Error('Missing geometry');
    let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
    polygons.forEach(polygon => {
      if (!Array.isArray(polygon) || !polygon.length) throw new Error('Invalid polygon');
      polygon.forEach(ring => {
        if (!Array.isArray(ring) || ring.length < 4 || !ring.every(finitePair)) {
          throw new Error('Invalid ring');
        }
        ring.forEach(([lng, lat]) => {
          west = Math.min(west, lng); east = Math.max(east, lng);
          south = Math.min(south, lat); north = Math.max(north, lat);
        });
      });
    });
    if (!(east > west && north > south)) throw new Error('Invalid bounds');
    // Equirectangular at the islands' mid-latitude, with one uniform scale.
    const cosine = Math.cos((south + north) / 2 * Math.PI / 180);
    const spanX = (east - west) * cosine, spanY = north - south;
    const scale = Math.min((WIDTH - PAD * 2) / spanX, (HEIGHT - PAD * 2) / spanY);
    const left = (WIDTH - spanX * scale) / 2, top = (HEIGHT - spanY * scale) / 2;
    const project = (lng, lat) => ({x: left + (lng - west) * cosine * scale, y: top + (north - lat) * scale});
    const paths = polygons.map(polygon => polygon.map(ring => ring.map(([lng, lat], i) => {
      const p = project(lng, lat);
      return `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(' ') + ' Z').join(' '));
    return {paths, project, west, east, south, north};
  }

  async function load() {
    if (!pending) {
      state = 'loading';
      pending = Promise.resolve().then(async () => {
        const response = await fetch('vendor/malta-geo.json');
        if (!response.ok) throw new Error('Geometry unavailable');
        geometry = prepare(await response.json());
        state = 'ready';
        return true;
      }).catch(() => {
        geometry = null;
        state = 'failed';
        return false;
      });
    }
    return pending;
  }

  // Layout at the minimum 320px canvas width: 120 SVG units = 48px.
  // Never change coordinates: displaced badges have leaders to exact data dots.
  function place(point, placed) {
    const candidates = [{x: point.x, y: point.y}];
    for (let y = 60; y <= HEIGHT - 60; y += 120) {
      for (let x = 60; x <= WIDTH - 60; x += 120) candidates.push({x, y});
    }
    candidates.sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y));
    return candidates.find(p => p.x >= 60 && p.x <= WIDTH - 60 && p.y >= 60 && p.y <= HEIGHT - 60 &&
      placed.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= 120)) || null;
  }

  function render(developments, {selectedIds = [], activeId = null, action = 'toggleDev', showLegend = true} = {}) {
    const selected = new Set(Array.from(selectedIds || [], String));
    const placed = [];
    const entries = (Array.isArray(developments) ? developments : []).map((dev, index) => {
      const id = String(dev?.id ?? '');
      const name = String(dev?.name || `Development ${index + 1}`);
      const loc = String(dev?.loc || '');
      const entry = {id, name, loc, number: index + 1, selected: selected.has(id),
        active: activeId !== null && String(activeId) === id, point: null, pin: null};
      if (geometry && finitePair([dev?.lng, dev?.lat]) &&
          dev.lng >= geometry.west && dev.lng <= geometry.east &&
          dev.lat >= geometry.south && dev.lat <= geometry.north) {
        entry.point = geometry.project(dev.lng, dev.lat);
        entry.pin = place(entry.point, placed);
        if (entry.pin) placed.push(entry.pin);
      }
      return entry;
    });
    const classes = entry => `${entry.selected ? ' pm-map-selected' : ''}${entry.active ? ' pm-map-active' : ''}`;
    const label = entry => `${entry.number}. ${entry.name}${entry.loc ? ' · ' + entry.loc : ''}${entry.active ? ' · Current development' : ''}`;
    const control = (entry, className, content, style = '') => {
      const attrs = `class="${className}${classes(entry)}"${style ? ` style="${style}"` : ''}`;
      return action === null
        ? `<span ${attrs} role="img" aria-label="${escape(label(entry) + (entry.selected ? ' · Selected' : ''))}">${content}</span>`
        : `<button type="button" ${attrs} data-pm="${escape(action)}" data-arg="${escape(entry.id)}" aria-label="${escape(label(entry))}" aria-pressed="${entry.selected}">${content}</button>`;
    };
    const legend = entries.length ? `<ol class="pm-map-legend" aria-label="Development locations">${entries.map(entry => {
      const note = !geometry ? '' : !entry.point ? 'Location unavailable on this map' : !entry.pin ? 'See location dot; pin listed below' : '';
      return `<li class="pm-map-legend-item">${control(entry, 'pm-map-legend-control',
        `<span class="pm-map-number" aria-hidden="true">${entry.number}</span><span class="pm-map-name"><strong>${escape(entry.name)}</strong><span>${escape(entry.loc)}</span>${note ? `<small>${note}</small>` : ''}</span><span class="pm-map-state">${entry.active ? 'Current' : ''}${entry.active && entry.selected ? ' · ' : ''}${entry.selected ? 'Selected' : ''}</span>`)}</li>`;
    }).join('')}</ol>` : '<p class="pm-map-empty">No developments to display.</p>';
    let map;
    if (geometry) {
      const dots = entries.filter(entry => entry.point).map(entry => {
        const p = entry.point, pin = entry.pin;
        return `${pin ? `<line class="pm-map-leader" x1="${p.x.toFixed(2)}" y1="${p.y.toFixed(2)}" x2="${pin.x.toFixed(2)}" y2="${pin.y.toFixed(2)}"/>` : ''}<circle class="pm-map-dot" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4"/>`;
      }).join('');
      const pins = entries.filter(entry => entry.pin).map(entry => control(entry, 'pm-map-pin',
        `<span aria-hidden="true">${entry.number}</span>`,
        `left:${(entry.pin.x / WIDTH * 100).toFixed(3)}%;top:${(entry.pin.y / HEIGHT * 100).toFixed(3)}%`)).join('');
      map = `<div class="pm-map-scroll"><div class="pm-map-canvas"><svg class="pm-map-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" aria-hidden="true" focusable="false"><g class="pm-map-land" fill-rule="evenodd">${geometry.paths.map(path => `<path d="${path}"/>`).join('')}</g>${dots}</svg>${pins}<span class="pm-map-north" aria-hidden="true">↑ N</span></div></div>`;
    } else {
      const message = state === 'failed' ? 'Map unavailable. Development names are listed below.' :
        state === 'loading' ? 'Loading Malta map. Development names are listed below.' :
          'Malta map not loaded yet. Development names are listed below.';
      map = `<div class="pm-map-fallback" role="status"><p>${message}</p></div>`;
    }
    return `<section class="pm-map" aria-label="Malta development map"><header class="pm-map-header"><strong>Malta &amp; Gozo</strong><span>Development locations</span></header>${map}<div class="pm-map-caption"><p>Illustrative locations · prototype data</p><p>Not surveyed positions. Offset pins connect to plotted data locations.</p><span class="pm-map-attribution">© OpenStreetMap contributors</span></div>${showLegend?legend:''}</section>`;
  }

  window.PMMap = {load, render};
})();