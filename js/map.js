/* Lingala — Map of the Congo
 * Depends on /js/map-data.js (exposes GEO, PROVINCE_INFO, FEATURES on window).
 */
(function () {
  'use strict';
  const GEO = window.GEO;
  const PROVINCE_INFO = window.PROVINCE_INFO;
  const FEATURES = window.FEATURES;
  if (!GEO || !PROVINCE_INFO || !FEATURES) return;

  function normName(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-\s_]+/g, '').trim();
  }
  const INFO_NORM = {};
  Object.keys(PROVINCE_INFO).forEach((k) => { INFO_NORM[normName(k)] = PROVINCE_INFO[k]; });
  function getInfo(name) { return INFO_NORM[normName(name)] || null; }

  let canvas, ctx, frame;
  const dpr = window.devicePixelRatio || 1;
  let countryBbox = [180, 90, -180, -90];
  let viewBbox = null;
  let targetViewBbox = null;
  let animStart = 0;
  const animDuration = 700;
  let activeIdx = -1;
  let hoverIdx = -1;
  let zoomed = false;
  let projected = [];
  let projectedRivers = [];
  let projectedLakes = [];
  let showProvinceLabels = true;
  let showCountryLabels = true;

  let riverPhase = 0;
  let riverArcLengths = [];
  let animLoopRunning = false;

  window.toggleLabel = function (kind, on) {
    if (kind === 'provinces') showProvinceLabels = on;
    else if (kind === 'countries') showCountryLabels = on;
    placeLabels();
  };

  function computeCountryBbox() {
    const update = (c) => {
      if (typeof c[0] === 'number') {
        countryBbox[0] = Math.min(countryBbox[0], c[0]);
        countryBbox[1] = Math.min(countryBbox[1], c[1]);
        countryBbox[2] = Math.max(countryBbox[2], c[0]);
        countryBbox[3] = Math.max(countryBbox[3], c[1]);
      } else { c.forEach(update); }
    };
    GEO.features.forEach((f) => update(f.geometry.coordinates));
    const pad = 0.8;
    countryBbox[0] -= pad; countryBbox[1] -= pad;
    countryBbox[2] += pad; countryBbox[3] += pad;
  }

  function featureBbox(f) {
    const b = [180, 90, -180, -90];
    const update = (c) => {
      if (typeof c[0] === 'number') {
        b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]);
        b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]);
      } else { c.forEach(update); }
    };
    update(f.geometry.coordinates);
    return b;
  }

  function expandBbox(b, pad) {
    const w = b[2] - b[0], h = b[3] - b[1];
    return [b[0] - w * pad, b[1] - h * pad, b[2] + w * pad, b[3] + h * pad];
  }

  function project(lon, lat, w, h, bb) {
    bb = bb || viewBbox;
    const cLat = (bb[1] + bb[3]) / 2;
    const dLon = bb[2] - bb[0], dLat = bb[3] - bb[1];
    const cosLat = Math.cos(cLat * Math.PI / 180);
    const adjW = dLon * cosLat;
    const padding = 24;
    const availW = w - padding * 2, availH = h - padding * 2;
    const scale = Math.min(availW / adjW, availH / dLat);
    const x = padding + ((lon - bb[0]) * cosLat) * scale + (availW - adjW * scale) / 2;
    const y = padding + (bb[3] - lat) * scale + (availH - dLat * scale) / 2;
    return [x, y];
  }

  function resize() {
    const r = frame.getBoundingClientRect();
    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    preProject();
    draw();
    placeLabels();
  }

  function preProject() {
    const w = canvas.width / dpr, h = canvas.height / dpr;
    projected = GEO.features.map((f) => {
      const polys = [];
      const ringsList = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
      ringsList.forEach((poly) => polys.push(poly.map((ring) => ring.map((c) => project(c[0], c[1], w, h)))));
      return polys;
    });
    projectedRivers = FEATURES.rivers.map((r) => r.path.map((c) => project(c[0], c[1], w, h)));
    projectedLakes = (FEATURES.lakes || []).map((lake) => lake.poly.map((c) => project(c[0], c[1], w, h)));

    riverArcLengths = projectedRivers.map((path) => {
      const lens = [0];
      let total = 0;
      for (let i = 1; i < path.length; i++) {
        const dx = path[i][0] - path[i - 1][0];
        const dy = path[i][1] - path[i - 1][1];
        total += Math.sqrt(dx * dx + dy * dy);
        lens.push(total);
      }
      return lens;
    });
  }

  function draw() {
    const w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    GEO.features.forEach((f, idx) => {
      const polys = projected[idx];
      if (!polys) return;
      const isActive = idx === activeIdx;
      const isHover = idx === hoverIdx;
      const isFaded = zoomed && !isActive;

      polys.forEach((rings) => {
        ctx.beginPath();
        rings.forEach((ring) => {
          ring.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.closePath();
        });

        let fill, stroke, lineWidth;
        if (isFaded) { fill = 'rgba(26, 74, 134, 0.08)'; stroke = 'rgba(255,255,255,0.06)'; lineWidth = 0.5; }
        else if (isActive) { fill = 'rgba(212, 160, 23, 0.42)'; stroke = '#D4A017'; lineWidth = 2.0; }
        else if (isHover) { fill = 'rgba(32, 101, 176, 0.55)'; stroke = 'rgba(255,255,255,0.5)'; lineWidth = 1.2; }
        else { fill = 'rgba(26, 74, 134, 0.30)'; stroke = 'rgba(255,255,255,0.22)'; lineWidth = 0.9; }
        ctx.fillStyle = fill;
        ctx.fill('evenodd');
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      });
    });

    projectedLakes.forEach((poly) => {
      ctx.beginPath();
      poly.forEach((pt, j) => { if (j === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]); });
      ctx.closePath();
      ctx.fillStyle = 'rgba(43, 107, 149, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(110, 170, 210, 0.55)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    });

    projectedRivers.forEach((path, i) => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let j = 1; j < path.length - 1; j++) {
        const xc = (path[j][0] + path[j + 1][0]) / 2;
        const yc = (path[j][1] + path[j + 1][1]) / 2;
        ctx.quadraticCurveTo(path[j][0], path[j][1], xc, yc);
      }
      ctx.lineTo(path[path.length - 1][0], path[path.length - 1][1]);
      ctx.strokeStyle = 'rgba(74, 149, 194, 0.85)';
      ctx.lineWidth = i === 0 ? 2.2 : 1.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });

    drawRiverFlow();

    if (zoomed && activeIdx >= 0) {
      const feat = GEO.features[activeIdx];
      if (feat.properties.capital_lon) {
        drawCapitalDot(feat.properties.capital_lon, feat.properties.capital_lat, feat.properties.capital);
      }
    } else {
      drawNationalCapital();
    }
  }

  function drawRiverFlow() {
    const NUM_LIGHTS = 3;
    const LIGHT_LEN_FRAC = 0.10;
    const SEGMENTS_PER_LIGHT = 18;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';

    projectedRivers.forEach((path, riverIdx) => {
      const lens = riverArcLengths[riverIdx];
      if (!lens || lens.length < 2) return;
      const totalLen = lens[lens.length - 1];
      if (totalLen < 1) return;
      const baseWidth = riverIdx === 0 ? 2.4 : 1.8;

      for (let lightI = 0; lightI < NUM_LIGHTS; lightI++) {
        const headFrac = ((riverPhase + lightI / NUM_LIGHTS) % 1);
        const headLen = headFrac * totalLen;
        const tailLen = Math.max(0, headLen - LIGHT_LEN_FRAC * totalLen);

        for (let s = 0; s < SEGMENTS_PER_LIGHT; s++) {
          const t1 = s / SEGMENTS_PER_LIGHT;
          const t2 = (s + 1) / SEGMENTS_PER_LIGHT;
          const arc1 = tailLen + (headLen - tailLen) * t1;
          const arc2 = tailLen + (headLen - tailLen) * t2;
          const p1 = pointAtArcLength(path, lens, arc1);
          const p2 = pointAtArcLength(path, lens, arc2);
          if (!p1 || !p2) continue;
          const t = (t1 + t2) / 2;
          const bright = Math.pow(t, 2.2);
          const alpha = bright * 0.85;
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.strokeStyle = 'rgba(244, 199, 80, ' + alpha.toFixed(3) + ')';
          ctx.lineWidth = baseWidth;
          ctx.stroke();
        }
      }
    });
    ctx.restore();
  }

  function pointAtArcLength(path, lens, targetLen) {
    if (targetLen <= 0) return path[0];
    const totalLen = lens[lens.length - 1];
    if (targetLen >= totalLen) return path[path.length - 1];
    let lo = 0, hi = lens.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (lens[mid] <= targetLen) lo = mid; else hi = mid;
    }
    const segLen = lens[hi] - lens[lo];
    if (segLen < 1e-9) return path[lo];
    const t = (targetLen - lens[lo]) / segLen;
    return [
      path[lo][0] + (path[hi][0] - path[lo][0]) * t,
      path[lo][1] + (path[hi][1] - path[lo][1]) * t,
    ];
  }

  function startAnimLoop() {
    if (animLoopRunning) return;
    animLoopRunning = true;
    let lastTime = performance.now();
    function step(now) {
      if (document.hidden) { lastTime = now; requestAnimationFrame(step); return; }
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      riverPhase = (riverPhase + dt / 14) % 1;
      draw();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function drawNationalCapital() {
    const w = canvas.width / dpr, h = canvas.height / dpr;
    const [x, y] = project(15.30, -4.32, w, h);
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 7 : 3;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#D4A017';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawCapitalDot(lon, lat, label) {
    const w = canvas.width / dpr, h = canvas.height / dpr;
    const [x, y] = project(lon, lat, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212, 160, 23, 0.22)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#D4A017';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 3.5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.strokeText(label, x, y + 14);
    ctx.fillText(label, x, y + 14);
    ctx.restore();
  }

  function ringCentroid(ring) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
      const cross = x1 * y2 - x2 * y1;
      a += cross;
      cx += (x1 + x2) * cross;
      cy += (y1 + y2) * cross;
    }
    a *= 0.5;
    if (Math.abs(a) < 1e-9) {
      let sx = 0, sy = 0;
      ring.forEach((p) => { sx += p[0]; sy += p[1]; });
      return [sx / ring.length, sy / ring.length, 0];
    }
    return [cx / (6 * a), cy / (6 * a), Math.abs(a)];
  }

  function placeLabels() {
    frame.querySelectorAll('.map-label').forEach((el) => el.remove());
    const w = canvas.width / dpr, h = canvas.height / dpr;

    if (showCountryLabels) {
      FEATURES.neighbors.forEach((n) => {
        const [x, y] = project(n.lon, n.lat, w, h);
        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) return;
        const el = document.createElement('div');
        el.className = 'map-label neighbor';
        if (zoomed) el.classList.add('hidden');
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.textContent = n.name;
        frame.appendChild(el);
      });
    }

    (FEATURES.lakes || []).forEach((lake, i) => {
      const poly = projectedLakes[i];
      if (!poly) return;
      let sx = 0, sy = 0;
      poly.forEach((p) => { sx += p[0]; sy += p[1]; });
      const cx = sx / poly.length, cy = sy / poly.length;
      const el = document.createElement('div');
      el.className = 'map-label lake';
      if (zoomed) el.classList.add('hidden');
      el.style.left = cx + 'px';
      el.style.top = cy + 'px';
      el.textContent = lake.name;
      frame.appendChild(el);
    });

    if (!zoomed) {
      const [rx, ry] = project(18.6, 0.5, w, h);
      const el = document.createElement('div');
      el.className = 'map-label river';
      el.style.left = rx + 'px';
      el.style.top = ry + 'px';
      el.textContent = 'Congo River';
      frame.appendChild(el);
    }

    if (showProvinceLabels) {
      GEO.features.forEach((f, idx) => {
        const polys = projected[idx];
        if (!polys || !polys.length) return;
        let bestArea = 0, bestCx = 0, bestCy = 0;
        polys.forEach((rings) => {
          const [cx, cy, area] = ringCentroid(rings[0]);
          if (area > bestArea) { bestArea = area; bestCx = cx; bestCy = cy; }
        });
        if (bestArea === 0) return;
        const el = document.createElement('div');
        el.className = 'map-label';
        if (zoomed) {
          if (idx === activeIdx) el.classList.add('zoomed');
          else el.classList.add('hidden');
        }
        el.style.left = bestCx + 'px';
        el.style.top = bestCy + 'px';
        el.textContent = f.properties.name;
        frame.appendChild(el);
      });
    }
  }

  function pointInRing(x, y, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  function hitTest(x, y) {
    if (zoomed && activeIdx >= 0) {
      const polys = projected[activeIdx];
      for (const rings of polys) {
        if (pointInRing(x, y, rings[0])) {
          let inHole = false;
          for (let r = 1; r < rings.length; r++) if (pointInRing(x, y, rings[r])) { inHole = true; break; }
          if (!inHole) return activeIdx;
        }
      }
      return -1;
    }
    for (let idx = 0; idx < projected.length; idx++) {
      const polys = projected[idx];
      for (const rings of polys) {
        if (pointInRing(x, y, rings[0])) {
          let inHole = false;
          for (let r = 1; r < rings.length; r++) if (pointInRing(x, y, rings[r])) { inHole = true; break; }
          if (!inHole) return idx;
        }
      }
    }
    return -1;
  }

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return [t.clientX - rect.left, t.clientY - rect.top];
  }

  function onMove(e) {
    const [x, y] = getCanvasCoords(e);
    const idx = hitTest(x, y);
    if (idx !== hoverIdx) {
      hoverIdx = idx;
      draw();
      canvas.style.cursor = idx === -1 ? 'default' : 'pointer';
    }
  }

  function onClick(e) {
    const [x, y] = getCanvasCoords(e);
    const idx = hitTest(x, y);
    if (idx !== -1 && idx !== activeIdx) zoomToProvince(idx);
    else if (zoomed && idx === -1) zoomOut();
  }

  function zoomToProvince(idx) {
    activeIdx = idx;
    const fb = featureBbox(GEO.features[idx]);
    targetViewBbox = expandBbox(fb, 0.20);
    zoomed = true;
    startAnimation();
    showInfo(GEO.features[idx]);
    document.querySelectorAll('.province-btn').forEach((b, i) => b.classList.toggle('on', i === idx));
    document.getElementById('zoomOutBtn').classList.remove('hidden');
    document.getElementById('zoomHint').classList.remove('show');
  }

  window.zoomOut = function () {
    zoomed = false;
    activeIdx = -1;
    targetViewBbox = countryBbox.slice();
    startAnimation();
    resetInfoPanel();
    document.querySelectorAll('.province-btn').forEach((b) => b.classList.remove('on'));
    document.getElementById('zoomOutBtn').classList.add('hidden');
  };

  function startAnimation() {
    animStart = performance.now();
    if (!viewBbox) viewBbox = countryBbox.slice();
    const fromBbox = viewBbox.slice();
    const toBbox = targetViewBbox.slice();
    function step(now) {
      const t = Math.min(1, (now - animStart) / animDuration);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      viewBbox = [
        fromBbox[0] + (toBbox[0] - fromBbox[0]) * e,
        fromBbox[1] + (toBbox[1] - fromBbox[1]) * e,
        fromBbox[2] + (toBbox[2] - fromBbox[2]) * e,
        fromBbox[3] + (toBbox[3] - fromBbox[3]) * e,
      ];
      preProject();
      draw();
      placeLabels();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function showInfo(feature) {
    const p = feature.properties || {};
    const info = getInfo(p.name);
    document.getElementById('infoEmpty').style.display = 'none';
    document.getElementById('infoContent').style.display = 'block';
    document.getElementById('infoPanel').classList.add('has-province');
    document.getElementById('provName').textContent = p.name;
    document.getElementById('provType').textContent = 'Province · formerly part of ' + (p.parent || 'DRC');
    const note = document.getElementById('provNote');
    if (info) {
      document.getElementById('provCapital').textContent = info.capital;
      document.getElementById('provPop').textContent = info.population;
      document.getElementById('provLang').textContent = info.language;
      note.textContent = info.lingala_note;
    } else {
      document.getElementById('provCapital').textContent = p.capital || '—';
      document.getElementById('provPop').textContent = '—';
      document.getElementById('provLang').textContent = '—';
      note.textContent = 'No cultural notes yet for "' + p.name + '."';
    }
  }

  function resetInfoPanel() {
    document.getElementById('infoEmpty').style.display = 'block';
    document.getElementById('infoContent').style.display = 'none';
    document.getElementById('infoPanel').classList.remove('has-province');
  }

  function buildGrid() {
    const grid = document.getElementById('provinceGrid');
    grid.innerHTML = '';
    const sorted = GEO.features.map((f, i) => ({ f, i })).sort((a, b) => a.f.properties.name.localeCompare(b.f.properties.name));
    sorted.forEach(({ f, i }) => {
      const btn = document.createElement('button');
      btn.className = 'province-btn';
      btn.textContent = f.properties.name;
      btn.onclick = () => zoomToProvince(i);
      grid.appendChild(btn);
    });
  }

  function init() {
    canvas = document.getElementById('map');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    frame = document.getElementById('mapFrame');
    computeCountryBbox();
    viewBbox = countryBbox.slice();
    resize();
    buildGrid();
    window.addEventListener('resize', () => resize());
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', () => { hoverIdx = -1; draw(); });
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onClick(e.touches[0] ? e : e); }, { passive: false });
    setTimeout(() => document.getElementById('zoomHint').classList.add('show'), 600);
    setTimeout(() => document.getElementById('zoomHint').classList.remove('show'), 4200);
    startAnimLoop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
