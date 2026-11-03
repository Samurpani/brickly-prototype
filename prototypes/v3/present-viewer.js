/* Bricly Present Viewer — dependency-free, ephemeral gallery / plan annotation.
 * Load with present-viewer.css after the host's styles. No host rendering,
 * persistence, canvas, export, or server-side rendering is used here.
 *
 * PMViewer.open({ root: document.getElementById('pm-shell'), items, index: 0,
 *                 title: '', onClose: () => {} });
 * Items: { key: string|number, url?, html?, caption?, provenance?, plan: boolean,
 *          northBearing?: number }.
 * `html` is trusted, self-contained app-generated SVG, NOT arbitrary HTML.
 * A supplied SVG takes precedence over url. SVG is displayed as an isolated
 * image; scripts and external SVG resources are not supported.
 * North bearing is clockwise degrees from the source's upward direction.
 * Keys must be unique in a gallery and stable per asset/version across opens.
 *
 * Host capture listeners MUST delegate FIRST while PMViewer.active:
 *   if (window.PMViewer?.active) { PMViewer.handleKey(event); return; }
 * Defer root.innerHTML / host render() while active; onClose can flush it.
 * close() retains ink; clear() deletes ALL ink without closing the viewer.
 * Call clear() when the presentation session ends (not on each gallery close).
 * Accidental external detachment closes and cleans up, but never auto-reopens.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 12;
  const annotations = new Map(); // key -> strokes of normalized source points
  const handledKeys = new WeakSet();
  let current = null;
  let sequence = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const text = value => String(value ?? '');
  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function button(label, content, action) {
    const node = element('button', 'pm-viewer-button', content);
    node.type = 'button';
    node.setAttribute('aria-label', label);
    node.title = label;
    node.addEventListener('click', action);
    return node;
  }
  function listen(state, target, type, action, options) {
    target.addEventListener(type, action, options);
    state.cleanup.push(() => target.removeEventListener(type, action, options));
  }
  function restoreAttribute(node, name, value) {
    if (value === null) node.removeAttribute(name);
    else node.setAttribute(name, value);
  }
  function announce(state, message) {
    state.status.textContent = message;
  }
  function live(state) {
    return current === state && state.overlay.isConnected;
  }
  function focusables(state) {
    return [...state.overlay.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
      .filter(node => node.tabIndex >= 0 && !node.closest('[hidden], [inert]') && node.getClientRects().length);
  }
  function focus(node) {
    if (!node?.isConnected || node.closest('[inert]')) return;
    node.focus({ preventScroll: true });
    const overlay = node.closest('.pm-viewer');
    // Reveal keyboard focus in our scroll containers only, never the host.
    // This matters when the mobile footer is taller than its allowed height.
    if (!overlay) return;
    for (let parent = node.parentElement; parent && parent !== overlay; parent = parent.parentElement) {
      if (!parent.matches('.pm-viewer-footer, .pm-viewer-thumbnails')) continue;
      const item = node.getBoundingClientRect();
      const bounds = parent.getBoundingClientRect();
      if (item.top < bounds.top + 4) parent.scrollTop -= bounds.top + 4 - item.top;
      else if (item.bottom > bounds.bottom - 4) parent.scrollTop += item.bottom - bounds.bottom + 4;
      if (item.left < bounds.left + 4) parent.scrollLeft -= bounds.left + 4 - item.left;
      else if (item.right > bounds.right - 4) parent.scrollLeft += item.right - bounds.right + 4;
    }
  }
  function lockChildren(state) {
    for (const child of state.root.children) {
      if (child === state.overlay || state.locked.has(child)) continue;
      state.locked.set(child, {
        inert: child.getAttribute('inert'),
        ariaHidden: child.getAttribute('aria-hidden')
      });
      child.setAttribute('inert', '');
      child.setAttribute('aria-hidden', 'true');
    }
  }

  // SVGs are parsed for intrinsic aspect ratio, then isolated in image context.
  // No untrusted markup is inserted into the live document.
  function sourceFor(item, state) {
    if (item.html !== undefined && item.html !== null) {
      const parsed = new DOMParser().parseFromString(text(item.html), 'text/html');
      const svg = parsed.body.firstElementChild;
      if (parsed.body.children.length !== 1 || svg?.localName !== 'svg' || svg.namespaceURI !== SVG_NS) {
        throw new Error('The supplied plan is not an SVG.');
      }
      const viewBox = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
      const length = name => {
        const value = svg.getAttribute(name)?.trim() || '';
        return /^(?:\d+\.?\d*|\.\d+)(?:px)?$/.test(value) ? parseFloat(value) : NaN;
      };
      let width, height;
      if (viewBox?.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0) {
        [, , width, height] = viewBox;
      } else {
        width = length('width'); height = length('height');
        if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) throw new Error('The SVG has no usable source dimensions.');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
      svg.setAttribute('xmlns', SVG_NS);
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      state.objectURLs.push(url);
      return { url, width, height };
    }
    if (typeof item.url !== 'string' || !item.url.trim()) throw new Error('No source asset was supplied.');
    const url = new URL(item.url, document.baseURI);
    if (!['http:', 'https:', 'blob:', 'data:', 'file:'].includes(url.protocol)) throw new Error('Unsupported asset URL.');
    if (url.protocol === 'data:' && !/^data:image\//i.test(item.url)) throw new Error('The source is not an image.');
    return { url: url.href };
  }

  function createChrome(state, title) {
    const id = `pm-viewer-${++sequence}`;
    const overlay = state.overlay = element('section', 'pm-viewer');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `${id}-title`);
    overlay.setAttribute('aria-describedby', `${id}-help`);
    overlay.tabIndex = -1;

    const header = element('header', 'pm-viewer-header');
    const heading = element('div', 'pm-viewer-heading');
    const name = element('h2', 'pm-viewer-title', title || 'Gallery & plans');
    name.id = `${id}-title`;
    state.counter = element('span', 'pm-viewer-counter');
    heading.append(name, state.counter);
    state.closeButton = button('Close viewer (Escape)', 'Close ×', close);
    header.append(heading, state.closeButton);

    const stage = state.stage = element('div', 'pm-viewer-stage');
    stage.tabIndex = 0;
    stage.setAttribute('role', 'region');
    stage.setAttribute('aria-label', 'Image viewport');
    stage.setAttribute('aria-describedby', `${id}-help`);
    state.world = element('div', 'pm-viewer-world');
    state.world.setAttribute('aria-hidden', 'true');
    state.media = element('div', 'pm-viewer-media');
    state.ink = document.createElementNS(SVG_NS, 'svg');
    state.ink.classList.add('pm-viewer-ink');
    state.ink.setAttribute('aria-hidden', 'true');
    state.ink.setAttribute('focusable', 'false');
    state.world.append(state.media, state.ink);
    state.unavailable = element('div', 'pm-viewer-unavailable');
    state.unavailable.setAttribute('role', 'status');
    state.compass = element('div', 'pm-viewer-compass');
    state.compass.setAttribute('role', 'img');
    state.compassArrow = element('span', 'pm-viewer-compass-arrow', '↑');
    state.compassArrow.setAttribute('aria-hidden', 'true');
    state.compass.append(state.compassArrow, element('span', '', 'N'));
    stage.append(state.world, state.unavailable, state.compass);

    const footer = element('footer', 'pm-viewer-footer');
    const metadata = element('div', 'pm-viewer-metadata');
    state.caption = element('p', 'pm-viewer-caption');
    state.provenance = element('p', 'pm-viewer-provenance');
    const temporary = element('p', 'pm-viewer-temporary', 'Temporary marks only · Not saved, shared or exported');
    metadata.append(state.caption, state.provenance, temporary);

    const toolbar = element('div', 'pm-viewer-toolbar');
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Viewer controls');
    const navigation = element('div', 'pm-viewer-group');
    state.previous = button('Previous item (Left arrow)', '←', () => select(state, state.index - 1));
    state.next = button('Next item (Right arrow)', '→', () => select(state, state.index + 1));
    navigation.append(state.previous, state.next);
    const viewport = element('div', 'pm-viewer-group');
    state.zoomOut = button('Zoom out (−)', '−', () => zoomAt(state, 1 / 1.25));
    state.zoomLabel = element('span', 'pm-viewer-zoom', '100%');
    state.zoomLabel.setAttribute('aria-label', 'Zoom relative to fit');
    state.zoomIn = button('Zoom in (+)', '+', () => zoomAt(state, 1.25));
    state.fitButton = button('Fit / reset viewport (0); retain marks', 'Fit / reset', () => reset(state));
    viewport.append(state.zoomOut, state.zoomLabel, state.zoomIn, state.fitButton);
    state.planTools = element('div', 'pm-viewer-group pm-viewer-plan-tools');
    state.planTools.setAttribute('role', 'group');
    state.planTools.setAttribute('aria-label', 'Temporary plan annotations');
    state.panButton = button('Pan mode (P)', 'Pan', () => setMode(state, 'pan'));
    state.drawButton = button('Draw mode (D)', 'Draw', () => setMode(state, 'draw'));
    state.undoButton = button('Undo last mark (Control or Command Z)', 'Undo', () => undo(state));
    state.clearButton = button('Clear marks on this plan', 'Clear marks', () => clearItem(state));
    state.planTools.append(state.panButton, state.drawButton, state.undoButton, state.clearButton);
    toolbar.append(navigation, viewport, state.planTools);

    state.thumbnails = element('nav', 'pm-viewer-thumbnails');
    state.thumbnails.setAttribute('aria-label', 'Gallery items');
    state.thumbs = state.items.map((item, index) => {
      const thumb = button(`View ${index + 1}: ${item.caption || (item.plan ? 'Plan' : 'Image')}`, '', () => select(state, index));
      thumb.className = 'pm-viewer-button pm-viewer-thumbnail';
      const preview = element('span', 'pm-viewer-thumbnail-preview');
      const source = state.sources[index];
      if (source.url) {
        const image = new Image();
        image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
        image.addEventListener('error', () => { preview.replaceChildren(element('span', '', 'Unavailable')); });
        image.src = source.url;
        preview.append(image);
      } else preview.textContent = 'Unavailable';
      thumb.append(preview, element('span', 'pm-viewer-thumbnail-label', item.caption || (item.plan ? 'Plan' : `Image ${index + 1}`)));
      state.thumbnails.append(thumb);
      return thumb;
    });
    const help = element('p', 'pm-viewer-help', '← → Browse · + − Zoom · 0 Fit · Drag / Shift + arrows to pan · Pinch to zoom · Plans: D Draw / P Pan · Esc Close');
    help.id = `${id}-help`;
    state.status = element('div', 'pm-viewer-sr-only');
    state.status.setAttribute('role', 'status');
    state.status.setAttribute('aria-live', 'polite');
    state.status.setAttribute('aria-atomic', 'true');
    footer.append(metadata, toolbar, state.thumbnails, help);
    overlay.append(header, stage, footer, state.status);
  }

  function syncControls(state) {
    const enabled = state.ready;
    const plan = !!state.items[state.index]?.plan;
    state.zoomOut.disabled = !enabled || state.zoom <= MIN_ZOOM;
    state.zoomIn.disabled = !enabled || state.zoom >= MAX_ZOOM;
    state.fitButton.disabled = !enabled;
    state.drawButton.disabled = state.panButton.disabled = !enabled;
    state.planTools.hidden = !plan;
    state.panButton.setAttribute('aria-pressed', String(state.mode === 'pan'));
    state.drawButton.setAttribute('aria-pressed', String(state.mode === 'draw'));
    const hasInk = (annotations.get(state.items[state.index]?.key)?.length || 0) > 0;
    state.undoButton.disabled = state.clearButton.disabled = !plan || !hasInk;
    state.stage.dataset.mode = enabled ? state.mode : 'unavailable';
  }
  function constrain(state) {
    const scale = state.fit * state.zoom;
    const xLimit = Math.max(0, (state.width * scale - state.stageWidth) / 2 + 24);
    const yLimit = Math.max(0, (state.height * scale - state.stageHeight) / 2 + 24);
    state.panX = clamp(state.panX, -xLimit, xLimit);
    state.panY = clamp(state.panY, -yLimit, yLimit);
  }
  function paint(state) {
    state.frame = 0;
    if (!live(state) || !state.ready) return;
    const scale = state.fit * state.zoom;
    const x = (state.stageWidth - state.width * scale) / 2 + state.panX;
    const y = (state.stageHeight - state.height * scale) / 2 + state.panY;
    state.world.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    state.ink.style.setProperty('--pmv-ink-width', String(3 / scale));
    state.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    if (state.draft) state.draft.node.setAttribute('d', state.draft.path);
    syncControls(state);
  }
  function schedule(state) {
    if (!state.frame) state.frame = requestAnimationFrame(() => paint(state));
  }
  function measure(state, initial = false) {
    const { width, height } = state.stage.getBoundingClientRect();
    if (!width || !height) return;
    if (!initial && width === state.stageWidth && height === state.stageHeight) return;
    cancelGesture(state);
    const oldFit = state.fit;
    state.stageWidth = width; state.stageHeight = height;
    state.fit = Math.min(Math.max(1, width - 32) / state.width, Math.max(1, height - 32) / state.height);
    if (!initial && oldFit) { state.panX *= state.fit / oldFit; state.panY *= state.fit / oldFit; }
    constrain(state);
    schedule(state);
  }
  function reset(state) {
    if (!state.ready) return;
    cancelGesture(state);
    state.zoom = 1; state.panX = state.panY = 0;
    schedule(state);
    announce(state, 'Viewport fitted. Temporary marks retained.');
  }
  function zoomAt(state, factor, anchor, destination) {
    if (!state.ready) return;
    const point = anchor || { x: state.stageWidth / 2, y: state.stageHeight / 2 };
    const target = destination || point;
    const next = clamp(state.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const ratio = next / state.zoom;
    state.panX = target.x - state.stageWidth / 2 - (point.x - state.stageWidth / 2 - state.panX) * ratio;
    state.panY = target.y - state.stageHeight / 2 - (point.y - state.stageHeight / 2 - state.panY) * ratio;
    state.zoom = next;
    constrain(state); schedule(state);
  }
  function pathFor(points, state) {
    return points.map((point, index) => `${index === 0 || point.move ? 'M' : 'L'}${point.x * state.width} ${point.y * state.height}${index === 0 ? 'l0 0' : ''}`).join(' ');
  }
  function inkNode() {
    const node = document.createElementNS(SVG_NS, 'path');
    node.setAttribute('fill', 'none');
    return node;
  }
  function renderInk(state) {
    state.ink.replaceChildren();
    if (!state.items[state.index]?.plan) return;
    for (const points of annotations.get(state.items[state.index].key) || []) {
      const node = inkNode();
      node.setAttribute('d', pathFor(points, state));
      state.ink.append(node);
    }
  }
  function discardDraft(state) {
    state.draft?.node.remove();
    state.draft = null;
  }
  function cancelGesture(state) {
    discardDraft(state);
    const ids = [...state.pointers.keys()];
    state.pointers.clear();
    state.pinch = null; state.pinched = false;
    state.stage.removeAttribute('data-dragging');
    for (const id of ids) {
      if (state.stage.hasPointerCapture?.(id)) state.stage.releasePointerCapture(id);
    }
  }
  function setMode(state, mode) {
    if (!state.ready || !state.items[state.index]?.plan) return;
    cancelGesture(state);
    state.mode = mode;
    syncControls(state);
    announce(state, mode === 'draw' ? 'Draw mode. Marks are temporary; use two fingers to pan and zoom.' : 'Pan mode. Drag to move the plan.');
  }
  function undo(state) {
    cancelGesture(state);
    if (!state.items[state.index]?.plan) return;
    const key = state.items[state.index].key;
    const strokes = annotations.get(key);
    if (!strokes?.length) return;
    strokes.pop();
    if (!strokes.length) annotations.delete(key);
    renderInk(state); syncControls(state);
    announce(state, 'Last temporary mark removed.');
  }
  function clearItem(state) {
    cancelGesture(state);
    annotations.delete(state.items[state.index]?.key);
    renderInk(state); syncControls(state);
    announce(state, 'Temporary marks on this plan cleared.');
  }
  function unavailable(state, reason) {
    state.ready = false;
    state.world.hidden = true;
    state.compass.hidden = true;
    state.stage.setAttribute('aria-busy', 'false');
    state.unavailable.hidden = false;
    state.unavailable.replaceChildren(element('strong', '', 'Asset unavailable'), element('p', '', reason));
    syncControls(state);
  }
  function select(state, index) {
    if (!live(state) || (state.items.length && (index < 0 || index >= state.items.length))) return;
    cancelGesture(state);
    if (state.image) state.image.onload = state.image.onerror = null;
    state.index = index; state.ready = false; state.mode = 'pan';
    if(typeof state.onIndex==='function')state.onIndex(index,state.items[index]);
    state.zoom = 1; state.panX = state.panY = 0;
    state.zoomLabel.textContent = '100%';
    state.world.hidden = true;
    state.compass.hidden = true;
    state.media.replaceChildren(); state.ink.replaceChildren();
    state.previous.disabled = index <= 0 || !state.items.length;
    state.next.disabled = index >= state.items.length - 1;
    state.counter.textContent = state.items.length ? `${index + 1} / ${state.items.length}` : 'No items';
    state.thumbnails.hidden = state.items.length < 2;
    state.thumbs.forEach((thumb, i) => {
      thumb.setAttribute('aria-current', i === index ? 'true' : 'false');
      thumb.tabIndex = i === index ? 0 : -1;
    });
    const thumb = state.thumbs[index];
    if (thumb) {
      // Scroll only the rail, never scrollIntoView() on the host/document.
      const left = thumb.offsetLeft - state.thumbnails.offsetLeft;
      if (left < state.thumbnails.scrollLeft) state.thumbnails.scrollLeft = left;
      else if (left + thumb.offsetWidth > state.thumbnails.scrollLeft + state.thumbnails.clientWidth) {
        state.thumbnails.scrollLeft = left + thumb.offsetWidth - state.thumbnails.clientWidth;
      }
    }
    const item = state.items[index];
    state.caption.textContent = item?.caption || (item?.plan ? 'Floor plan' : 'Image');
    state.provenance.textContent = `Provenance: ${item?.provenance || 'Not supplied — source / approval unverified'}`;
    syncControls(state);
    if (!item) { unavailable(state, 'No images or plans were supplied.'); return; }
    const source = state.sources[index];
    if (source.error) { unavailable(state, source.error); return; }
    state.unavailable.hidden = false;
    state.unavailable.textContent = 'Loading asset…';
    state.stage.setAttribute('aria-busy', 'true');
    const image = state.image = new Image();
    image.alt = item.caption || (item.plan ? 'Floor plan' : 'Gallery image');
    image.draggable = false; image.decoding = 'async';
    image.onload = () => {
      if (!live(state) || state.image !== image) return;
      if (!(image.naturalWidth && image.naturalHeight)) { unavailable(state, 'The image has no usable dimensions.'); return; }
      state.width = source.width || image.naturalWidth;
      state.height = source.height || image.naturalHeight;
      state.world.style.width = `${state.width}px`;
      state.world.style.height = `${state.height}px`;
      state.ink.setAttribute('viewBox', `0 0 ${state.width} ${state.height}`);
      state.stage.setAttribute('aria-label', `${item.plan ? 'Plan' : 'Image'} viewport: ${item.caption || 'Untitled'}`);
      state.stage.setAttribute('aria-busy', 'false');
      state.ready = true;
      state.unavailable.hidden = true;
      if (item.plan && Number.isFinite(item.northBearing)) {
        const bearing = ((item.northBearing % 360) + 360) % 360;
        state.compassArrow.style.transform = `rotate(${bearing}deg)`;
        state.compass.setAttribute('aria-label', `Supplied north bearing: ${bearing} degrees clockwise from plan up`);
        state.compass.title = `Supplied north bearing: ${bearing}°`;
        state.compass.hidden = false;
      }
      renderInk(state); measure(state, true);
      // Paint before revealing to avoid a one-frame unscaled source flash.
      if (state.frame) cancelAnimationFrame(state.frame);
      paint(state);
      state.world.hidden = false;
      announce(state, `${index + 1} of ${state.items.length}. ${state.caption.textContent}. ${state.provenance.textContent}.`);
    };
    image.onerror = () => {
      if (!live(state) || state.image !== image) return;
      state.media.replaceChildren();
      unavailable(state, 'The source could not be loaded as an image. No substitute or generated preview is shown.');
    };
    state.media.append(image);
    image.src = source.url;
  }

  function localPoint(state, event) {
    const bounds = state.stage.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }
  function sourcePoint(state, point) {
    const scale = state.fit * state.zoom;
    // Inverse of the exact transform used by both source and SVG ink.
    return {
      x: ((point.x - state.stageWidth / 2 - state.panX) / scale + state.width / 2) / state.width,
      y: ((point.y - state.stageHeight / 2 - state.panY) / scale + state.height / 2) / state.height
    };
  }
  const inside = point => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
  function addPoint(state, point) {
    const draft = state.draft;
    if (!draft) return;
    const source = sourcePoint(state, point);
    if (!inside(source)) { draft.gap = true; return; }
    const previous = draft.points[draft.points.length - 1];
    const distance = Math.hypot((source.x - previous.x) * state.width, (source.y - previous.y) * state.height) * state.fit * state.zoom;
    if (distance < 0.8 && !draft.gap) return;
    source.move = draft.gap;
    draft.gap = false;
    draft.points.push(source);
    draft.path += ` ${source.move ? 'M' : 'L'}${source.x * state.width} ${source.y * state.height}`;
    schedule(state);
  }
  function pinchPoints(state) {
    const [a, b] = [...state.pointers.values()];
    return { center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) };
  }
  function pointerDown(state, event) {
    if (!state.ready || (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1)) return;
    event.preventDefault();
    focus(state.stage);
    const point = localPoint(state, event);
    state.pointers.set(event.pointerId, point);
    try { state.stage.setPointerCapture(event.pointerId); } catch (_) { /* Detached / already-cancelled pointer. */ }
    if (state.pointers.size >= 2) {
      discardDraft(state); // A second contact must never leave accidental ink.
      state.pinched = true;
      state.pinch = pinchPoints(state);
    } else if (state.mode === 'draw' && event.button !== 1 && !state.pinched) {
      const source = sourcePoint(state, point);
      if (inside(source)) {
        const node = inkNode();
        state.draft = { node, points: [source], path: pathFor([source], state), gap: false };
        state.ink.append(node);
        schedule(state);
      }
    }
    state.stage.dataset.dragging = 'true';
  }
  function pointerMove(state, event) {
    if (!state.pointers.has(event.pointerId)) return;
    event.preventDefault();
    const previous = state.pointers.get(event.pointerId);
    const point = localPoint(state, event);
    state.pointers.set(event.pointerId, point);
    if (state.pointers.size >= 2) {
      const next = pinchPoints(state);
      if (state.pinch) zoomAt(state, next.distance / state.pinch.distance, state.pinch.center, next.center);
      state.pinch = next;
    } else if (state.draft) {
      const samples = event.getCoalescedEvents?.() || [];
      for (const sample of samples) addPoint(state, localPoint(state, sample));
      addPoint(state, point);
    } else if (state.mode === 'pan' || state.pinched || event.buttons === 4) {
      state.panX += point.x - previous.x; state.panY += point.y - previous.y;
      constrain(state); schedule(state);
    }
  }
  function pointerEnd(state, event) {
    if (!state.pointers.has(event.pointerId)) return;
    const cancelled = event.type !== 'pointerup';
    if (state.draft) {
      if (cancelled) discardDraft(state);
      else {
        addPoint(state, localPoint(state, event));
        const { points, node, path } = state.draft;
        node.setAttribute('d', path);
        const key = state.items[state.index].key;
        if (!annotations.has(key)) annotations.set(key, []);
        annotations.get(key).push(points);
        state.draft = null;
        syncControls(state);
        announce(state, 'Temporary mark added. Not saved or exported.');
      }
    }
    state.pointers.delete(event.pointerId);
    if (state.stage.hasPointerCapture?.(event.pointerId)) state.stage.releasePointerCapture(event.pointerId);
    state.pinch = state.pointers.size >= 2 ? pinchPoints(state) : null;
    if (!state.pointers.size) {
      state.pinched = false;
      state.stage.removeAttribute('data-dragging');
    }
  }

  /** Returns true for every key while active; browser defaults remain for
   * ordinary button activation / browser shortcuts, but host handlers stop. */
  function handleKey(event) {
    const state = current;
    if (!state) return false;
    if (handledKeys.has(event)) return true;
    handledKeys.add(event);
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); close(); return true; }
    if (event.key === 'Tab') {
      event.preventDefault();
      const nodes = focusables(state);
      const index = nodes.indexOf(document.activeElement);
      const next = index < 0 ? (event.shiftKey ? nodes.length - 1 : 0) : (index + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length;
      focus(nodes[next] || state.overlay);
      return true;
    }
    if (event.isComposing) return true;
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'z' && state.items[state.index]?.plan) {
      event.preventDefault(); undo(state); return true;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return true;
    let action;
    if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) && document.activeElement === state.stage) {
      action = () => {
        if (!state.ready || state.pointers.size) return;
        state.panX += event.key === 'ArrowLeft' ? 48 : event.key === 'ArrowRight' ? -48 : 0;
        state.panY += event.key === 'ArrowUp' ? 48 : event.key === 'ArrowDown' ? -48 : 0;
        constrain(state); schedule(state);
      };
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      action = () => {
        const onThumb = state.thumbnails.contains(document.activeElement);
        select(state, state.index + (event.key === 'ArrowLeft' ? -1 : 1));
        if (onThumb) focus(state.thumbs[state.index]);
      };
    } else if (event.key === '+' || event.key === '=') action = () => zoomAt(state, 1.25);
    else if (event.key === '-' || event.key === '_') action = () => zoomAt(state, 1 / 1.25);
    else if (event.key === '0') action = () => reset(state);
    else if (event.key.toLowerCase() === 'd') action = () => setMode(state, 'draw');
    else if (event.key.toLowerCase() === 'p') action = () => setMode(state, 'pan');
    else if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && document.activeElement === state.stage) {
      action = () => { state.panY += event.key === 'ArrowUp' ? 48 : -48; constrain(state); schedule(state); };
    }
    if (action) { event.preventDefault(); action(); }
    // Avoid Space scrolling the dialog when the viewport itself has focus.
    if (event.key === ' ' && document.activeElement === state.stage) event.preventDefault();
    return true;
  }

  function open({ root, items, index = 0, title = '', onClose, onIndex } = {}) {
    if (!(root instanceof HTMLElement) || root.id !== 'pm-shell' || !root.isConnected) {
      throw new TypeError('PMViewer.open requires the connected #pm-shell element as root.');
    }
    if (!Array.isArray(items)) throw new TypeError('PMViewer.open requires an items array.');
    if (onClose != null && typeof onClose !== 'function') throw new TypeError('onClose must be a function.');
    const keys = new Set();
    const copy = items.map(item => {
      if (!item || !((typeof item.key === 'string' && item.key.length) || (typeof item.key === 'number' && Number.isFinite(item.key))) || keys.has(item.key)) {
        throw new TypeError('Viewer items require unique, nonempty string or finite number keys.');
      }
      keys.add(item.key);
      return { ...item, caption: text(item.caption), provenance: text(item.provenance), plan: item.plan === true };
    });
    if (current) close();
    if (current) throw new Error('The previous onClose callback opened another viewer.');
    if (!root.isConnected) throw new Error('The viewer root was removed by the previous onClose callback.');
    const state = {
      root, items: copy, index: -1, onClose, onIndex, returnFocus: document.activeElement,
      cleanup: [], locked: new Map(), objectURLs: [], pointers: new Map(),
      frame: 0, ready: false, zoom: 1, fit: 1, width: 1, height: 1,
      stageWidth: 1, stageHeight: 1, panX: 0, panY: 0, mode: 'pan',
      draft: null, pinch: null, pinched: false,
      overflow: ['overflow-x', 'overflow-y'].map(name => ({
        name, value: root.style.getPropertyValue(name), priority: root.style.getPropertyPriority(name)
      }))
    };
    state.sources = copy.map(item => {
      try { return sourceFor(item, state); }
      catch (error) { return { error: error.message }; }
    });
    createChrome(state, text(title));
    current = state;
    root.append(state.overlay);
    root.style.setProperty('overflow', 'hidden', 'important');
    // Move focus before aria-hiding its old ancestor.
    focus(state.closeButton);
    lockChildren(state);
    listen(state, window, 'keydown', handleKey, true);
    listen(state, document, 'focusin', event => {
      if (live(state) && !state.overlay.contains(event.target)) focus(state.closeButton);
    }, true);
    // Viewer events must not activate delegated host controls or gestures.
    for (const type of ['click', 'dblclick', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'keyup', 'keypress', 'contextmenu']) {
      listen(state, state.overlay, type, event => event.stopPropagation());
    }
    listen(state, state.stage, 'contextmenu', event => event.preventDefault());
    listen(state, state.stage, 'dragstart', event => event.preventDefault());
    listen(state, state.stage, 'pointerdown', event => pointerDown(state, event));
    listen(state, state.stage, 'pointermove', event => pointerMove(state, event));
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(state, state.stage, type, event => pointerEnd(state, event));
    listen(state, state.overlay, 'wheel', event => {
      event.stopPropagation();
      if (!state.stage.contains(event.target)) return;
      event.preventDefault();
      if (state.pointers.size) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? state.stageHeight : 1;
      zoomAt(state, Math.exp(clamp(-event.deltaY * unit * 0.002, -0.5, 0.5)), localPoint(state, event));
    }, { passive: false });
    // Safari's proprietary gesture default must not zoom the entire page.
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
      listen(state, state.overlay, type, event => { event.preventDefault(); event.stopPropagation(); }, { passive: false });
    }
    listen(state, window, 'blur', () => cancelGesture(state));
    listen(state, document, 'visibilitychange', () => { if (document.hidden) cancelGesture(state); });
    const resize = new ResizeObserver(() => { if (live(state) && state.ready) measure(state); });
    resize.observe(state.stage);
    state.cleanup.push(() => resize.disconnect());
    const mutation = new MutationObserver(() => {
      if (current !== state) return;
      if (!state.overlay.isConnected || state.overlay.parentElement !== root) close();
      else lockChildren(state);
    });
    mutation.observe(root, { childList: true });
    // Also clean up when a host removes #pm-shell itself.
    if (root.parentNode) mutation.observe(root.parentNode, { childList: true });
    state.cleanup.push(() => mutation.disconnect());
    select(state, copy.length ? clamp(Number.isFinite(index) ? Math.trunc(index) : 0, 0, copy.length - 1) : 0);
  }

  function close() {
    const state = current;
    if (!state) return;
    current = null; // callback may safely render, clear, or open another viewer
    cancelGesture(state);
    if (state.frame) cancelAnimationFrame(state.frame);
    if (state.image) state.image.onload = state.image.onerror = null;
    state.cleanup.forEach(dispose => dispose());
    state.overlay.remove();
    state.objectURLs.forEach(url => URL.revokeObjectURL(url));
    for (const [child, saved] of state.locked) {
      restoreAttribute(child, 'inert', saved.inert);
      restoreAttribute(child, 'aria-hidden', saved.ariaHidden);
    }
    state.root.style.removeProperty('overflow');
    for (const { name, value, priority } of state.overflow) {
      if (value) state.root.style.setProperty(name, value, priority);
    }
    focus(state.returnFocus);
    if (!document.activeElement || document.activeElement === document.body) {
      const previousTabIndex = state.root.getAttribute('tabindex');
      state.root.setAttribute('tabindex', '-1');
      focus(state.root);
      restoreAttribute(state.root, 'tabindex', previousTabIndex);
    }
    if (state.onClose) state.onClose();
  }
  function clear() {
    annotations.clear();
    if (current) {
      cancelGesture(current);
      renderInk(current); syncControls(current);
      announce(current, 'All temporary viewer marks cleared.');
    }
  }

  window.PMViewer = Object.freeze({ open, close, clear, handleKey, get active() { return current !== null; } });
})();