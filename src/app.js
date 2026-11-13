/* ================= MICROVERSE application ================= */
const $ = id => document.getElementById(id);
const h = (t, a = {}, ...k) => {
  const e = document.createElement(t);
  for (const [x, v] of Object.entries(a)) {
    if (x === 'class') e.className = v; else if (x.startsWith('on')) e.addEventListener(x.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(x, v);
  }
  k.flat().forEach(c => { if (c != null && c !== false) e.append(c instanceof Node ? c : document.createTextNode(c)); });
  return e;
};
const BUILD = {
  amoeba: buildAmoeba, paramecium: buildParamecium, euglena: buildEuglena, giardia: buildGiardia, rotifer: buildRotifer,
  ecoli: buildEcoli, lacto: buildLactobacillus, spirillum: buildSpirillum, staph: buildStaph,
  rbc: buildRBC, wbc: buildWBC, neuron: buildNeuron, muscle: buildMuscle, epithelial: buildEpithelial,
  plant: buildPlantCell, guard: buildGuard, pollen: buildPollen, chloroplast: buildChloroplast,
  phage: buildPhage, flu: buildInfluenza, corona: buildCorona, animal: buildAnimalCell,
};
const LIB = SPEC.filter(s => s.cat !== 'anat');
const catOf = id => CATS.find(c => c.id === id);
const catName = id => (catOf(id) || { name: 'Cell anatomy' }).name;
const ANA_LABEL = { animal: 'Animal cell', plant: 'Plant cell', ecoli: 'Bacterial cell', chloroplast: 'Chloroplast' };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};
const fmtUm = u => u < 1 ? `${+(u * 1000).toPrecision(2)} nm` : u >= 1000 ? `${+(u / 1000).toPrecision(2)} mm` : `${+u.toPrecision(3)} µm`;
const ease = t => t * t * (3 - 2 * t);

/* ---------- renderer / scene ---------- */
const stage = $('stage'), canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
renderer.localClippingEnabled = true; renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(38, 1, .02, 400);
scene.add(camera);
function rig(cam) {
  cam.add(new THREE.HemisphereLight(0x9fd8ff, 0x0a1420, .45));
  const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(4, 6, 5); cam.add(k);
  const f = new THREE.DirectionalLight(0x5aa8ff, .7); f.position.set(-6, -2, 2); cam.add(f);
  const r = new THREE.DirectionalLight(0x41d3d6, 1.5); r.position.set(-2, 3, -6); cam.add(r);
}
rig(camera);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, dampingFactor: .07, zoomSpeed: .8, rotateSpeed: .8, panSpeed: .7, screenSpacePanning: true, autoRotate: true, autoRotateSpeed: 1.1 });

/* floating particulate for depth */
const motes = (() => {
  const n = 240, pos = new Float32Array(n * 3), R = rng(5);
  for (let i = 0; i < n; i++) { const d = randDir(R), r = .8 + R() * .9; pos.set([d.x * r, d.y * r * .7, d.z * r], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const map = canvasTex(32, 32, (c, w, hh) => { const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, hh); });
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, color: 0x9fe7ea, map, transparent: true, opacity: .32, depthWrite: false }));
  p.frustumCulled = false; scene.add(p); return p;
})();

/* ---------- state ---------- */
let cur = null, curDef = null, simT = 0, animOn = true, secOn = false, introK = 1, loadTok = 0, view = 'explore', tw = null;
let J = store.get('mv-journal', {}); const PARTS = store.get('mv-parts', {});
const THUMB = {};
const hlMats = new Set(); let selPart = null;
const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2400); };

/* ---------- specimen build / dispose ---------- */
function buildSpec(def) {
  const S = new Spec(def); BUILD[def.id](S);
  S.group.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { if (m && !m.clippingPlanes) m.clippingPlanes = CLIP; }); });
  S.anims.forEach(f => f(0));
  PARTS[def.id] = S.parts.map(p => p.name);
  return S;
}
function disposeSpec(S) {
  S.group.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) [].concat(o.material).forEach(m => m && m.dispose && m.dispose());
  });
}

/* ---------- loading ---------- */
const frame = () => new Promise(r => requestAnimationFrame(() => r()));
async function load(id, { keep = false } = {}) {
  const def = BYID[id]; if (!def || !BUILD[id]) return;
  const tok = ++loadTok;
  $('loading').classList.add('on'); await frame(); await frame();
  if (tok !== loadTok) return;
  let S;
  try { S = buildSpec(def); } catch (e) { console.error('build failed', id, e); $('loading').classList.remove('on'); toast('Could not build ' + def.name); return; }
  clearSel();
  if (cur) { scene.remove(cur.group); disposeSpec(cur); }
  cur = S; curDef = def; scene.add(S.group); introK = 0; simT = 0;
  controls.minDistance = def.dist * .08; controls.maxDistance = def.dist * 2.4 * fitK();
  const dir = V(.28, .2, 1).normalize();
  camera.position.copy(dir).multiplyScalar(def.dist * fitK()); controls.target.set(0, 0, 0); controls.update(); tw = null;
  motes.scale.setScalar(def.dist * 1.5 * fitK());
  if (!keep && view === 'anatomy' && !ANATOMY.includes(id)) setView('explore');
  if (def.cut && secOn) $('secR').value = 0;
  renderInfo(); renderCats($('search').value); syncAna();
  try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignore */ }
  store.set('mv-parts', PARTS);
  $('loading').classList.remove('on');
  $('main').classList.remove('sopen');
}
const fitK = () => Math.min(2.4, Math.max(1, .92 / camera.aspect));
const home = () => V(.28, .2, 1).normalize().multiplyScalar(curDef.dist * fitK());
function tweenTo(pos, tgt, dur = .7) { tw = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: tgt.clone(), k: 0, dur }; }
function resetView() { if (curDef) tweenTo(home(), V(0, 0, 0), .7); }

/* ---------- info panel ---------- */
function renderInfo() {
  const d = curDef;
  $('hCat').textContent = catName(d.cat); $('hName').textContent = d.name; $('hSci').textContent = d.latin;
  $('iCat').textContent = catName(d.cat); $('iName').textContent = d.name; $('iSci').textContent = d.latin; $('iDesc').textContent = d.desc;
  const f = $('iFacts'); f.replaceChildren(); [['Size', d.size], ...d.facts].forEach(([a, b]) => f.append(h('dt', {}, a), h('dd', {}, b)));
  $('sLbl').textContent = ANATOMY.includes(d.id) ? 'Organelles and structures' : 'Structures';
  renderStructs(); showPart(null);
}
function renderStructs() {
  const box = $('structs'); box.replaceChildren();
  const seen = J[curDef.id] || {};
  cur.parts.forEach(p => box.append(h('button', { class: 'st' + (seen[p.name] ? ' seen' : '') + (p === selPart ? ' on' : ''), onclick: () => selectPart(p, true) }, h('i'), p.name)));
}
function showPart(p) {
  const card = $('partCard'); card.classList.toggle('show', !!p);
  if (p) { $('pName').textContent = p.name; $('pDesc').textContent = p.desc; }
  const b = $('actBtn'); b.hidden = !p; if (p) b.textContent = 'Focus on structure';
}

/* ---------- selection / highlight ---------- */
const hlCache = new WeakMap();
function hlMat(m) {
  if (Array.isArray(m)) return m.map(hlMat);
  if (hlCache.has(m)) return hlCache.get(m);
  const c = m.clone(); c.clippingPlanes = m.clippingPlanes;
  if ('emissive' in c) { c.emissive = new THREE.Color(0x41d3d6); c.emissiveIntensity = .5; hlMats.add(c); }
  hlCache.set(m, c); return c;
}
function clearSel() {
  if (selPart) selPart.meshes.forEach(m => { if (m.userData._om) { m.material = m.userData._om; delete m.userData._om; } });
  hlMats.forEach(m => m.dispose()); hlMats.clear(); selPart = null;
}
function selectPart(p, focus = false) {
  clearSel(); selPart = p;
  if (p) {
    p.meshes.forEach(m => { if (!m.userData._om) { m.userData._om = m.material; m.material = hlMat(m.material); } });
    J[curDef.id] = J[curDef.id] || {};
    if (!J[curDef.id][p.name]) { J[curDef.id][p.name] = Date.now(); store.set('mv-journal', J); toast('Added to Discovery Journal'); }
    if (matchMedia('(max-width:980px)').matches) $('main').classList.add('iopen');
    if (focus) focusPart(p);
  }
  showPart(p); renderStructs();
}
function focusPart(p) {
  const b = new THREE.Box3(), t = new THREE.Box3();
  p.meshes.forEach(m => { t.setFromObject(m); if (!t.isEmpty()) b.union(t); });
  if (b.isEmpty()) return;
  const c = b.getCenter(V()), sz = b.getSize(V()).length();
  const dir = camera.position.clone().sub(controls.target).normalize();
  const d = THREE.MathUtils.clamp(sz * 1.8, controls.minDistance * 1.05, controls.maxDistance);
  tweenTo(c.clone().addScaledVector(dir, d), c, .8);
}

/* ---------- picking ---------- */
const ray = new THREE.Raycaster(); ray.params.Line.threshold = .02; ray.params.Points.threshold = .02;
const mouse = new THREE.Vector2();
function pick(cx, cy) {
  if (!cur) return [];
  const r = canvas.getBoundingClientRect();
  mouse.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const seq = [], seen = new Set();
  for (const hit of ray.intersectObject(cur.group, true)) {
    const p = hit.object.userData.part;
    if (!p || seen.has(p) || CLIP_PLANE.distanceToPoint(hit.point) < 0) continue;
    seen.add(p); seq.push(p);
  }
  return [...seq.filter(p => !p.shell), ...seq.filter(p => p.shell)];
}
let down = null, last = null, hover = null, hoverT = 0;
canvas.addEventListener('pointerdown', e => { if (!e.isPrimary) return; down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }; canvas.classList.add('drag'); $('tip').style.opacity = 0; });
canvas.addEventListener('pointermove', e => {
  if (down) { if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.moved = true; return; }
  hover = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerleave', () => { hover = null; $('tip').style.opacity = 0; canvas.classList.remove('hot'); });
canvas.addEventListener('pointerup', e => {
  canvas.classList.remove('drag');
  if (!down || !e.isPrimary) return;
  const d = down; down = null;
  if (d.moved || performance.now() - d.t > 450) return;
  const seq = pick(e.clientX, e.clientY);
  if (!seq.length) { selectPart(null); last = null; return; }
  let idx = 0;
  if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 8 && last.top === seq[0]) idx = (last.idx + 1) % seq.length;
  last = { x: e.clientX, y: e.clientY, idx, top: seq[0] };
  selectPart(seq[idx]);
  $('main').classList.remove('sopen');
});
canvas.addEventListener('pointercancel', () => { down = null; canvas.classList.remove('drag'); });
controls.addEventListener('start', () => { tw = null; if (controls.autoRotate) { controls.autoRotate = false; $('tRot').classList.remove('on'); } });

/* ---------- zoom / hud ---------- */
let zGuard = false;
function dist() { return camera.position.distanceTo(controls.target); }
function syncZoom() {
  if (!curDef) return; const mx = controls.maxDistance, mn = controls.minDistance;
  const s = Math.log(mx / THREE.MathUtils.clamp(dist(), mn, mx)) / Math.log(mx / mn) * 100;
  zGuard = true; $('zoomR').value = s; zGuard = false;
}
$('zoomR').addEventListener('input', e => {
  if (zGuard || !curDef) return; tw = null;
  const mx = controls.maxDistance, mn = controls.minDistance, d = mx * Math.pow(mn / mx, e.target.value / 100);
  const dir = camera.position.clone().sub(controls.target).normalize(); camera.position.copy(controls.target).addScaledVector(dir, d);
});
let hudKey = '';
function updateHud() {
  if (!curDef) return;
  const H = stage.clientHeight || 1, umPerUnit = curDef.sizeUm / curDef.U;
  const worldH = 2 * dist() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const pxPerUm = H / (worldH * umPerUnit), mag = pxPerUm * 264.6;
  const ideal = 120 / pxPerUm, p10 = Math.pow(10, Math.floor(Math.log10(ideal)));
  const nice = [5, 2, 1].map(m => m * p10).find(v => v <= ideal) || p10;
  const key = nice + '|' + Math.round(nice * pxPerUm) + '|' + (+mag.toPrecision(3));
  if (key === hudKey) return; hudKey = key;
  $('bar').style.width = Math.round(nice * pxPerUm) + 'px'; $('barLbl').textContent = fmtUm(nice);
  const mg = +mag.toPrecision(3); $('magV').textContent = (mg >= 1e6 ? +(mg / 1e6).toPrecision(3) + 'M' : mg.toLocaleString('en-US')) + '×';
}

/* ---------- cross-section ---------- */
const fwd = V();
function updateClip() {
  if (!secOn || !curDef) { CLIP_PLANE.constant = 1e6; return; }
  camera.getWorldDirection(fwd); CLIP_PLANE.normal.copy(fwd);
  const pp = controls.target.clone().addScaledVector(fwd, $('secR').value / 100 * curDef.U * .5);
  CLIP_PLANE.constant = -fwd.dot(pp);
}
$('tSec').onclick = () => { secOn = !secOn; $('tSec').classList.toggle('on', secOn); $('secWrap').classList.toggle('show', secOn); };

/* ---------- toolbar ---------- */
$('tReset').onclick = resetView;
$('tRot').onclick = () => { controls.autoRotate = !controls.autoRotate; $('tRot').classList.toggle('on', controls.autoRotate); };
$('tAnim').onclick = () => { animOn = !animOn; $('tAnim').classList.toggle('on', animOn); };
$('tCmp').onclick = () => setView('compare');
$('actBtn').onclick = () => selPart && focusPart(selPart);
$('btnSpecs').onclick = () => { $('main').classList.toggle('sopen'); $('main').classList.remove('iopen'); };
$('btnInfo').onclick = () => { $('main').classList.toggle('iopen'); $('main').classList.remove('sopen'); };
$('btnFs').onclick = () => {
  if (document.fullscreenElement) { document.exitFullscreen(); return; }
  try { const p = $('app').requestFullscreen && $('app').requestFullscreen(); if (p && p.catch) p.catch(() => toast('Fullscreen is not available in this view')); }
  catch (e) { toast('Fullscreen is not available in this view'); }
};
document.addEventListener('fullscreenchange', () => { $('btnFs').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen'; });

/* ---------- library sidebar ---------- */
const closed = new Set();
function renderCats(filter = '') {
  const f = filter.trim().toLowerCase(), box = $('catList'); box.replaceChildren();
  CATS.forEach(c => {
    const items = LIB.filter(s => s.cat === c.id && (!f || (s.name + ' ' + s.latin).toLowerCase().includes(f)));
    if (!items.length) return;
    const sec = h('div', { class: 'cat' + (closed.has(c.id) && !f ? ' closed' : '') });
    sec.append(
      h('button', { onclick: () => { closed.has(c.id) ? closed.delete(c.id) : closed.add(c.id); sec.classList.toggle('closed'); }, 'aria-expanded': !closed.has(c.id) },
        h('span', { class: 'lbl', style: 'color:' + c.col }, c.name), h('span', { class: 'n' }, items.length)),
      h('ul', {}, items.map(s => h('li', {}, h('button', { class: 'sp' + (curDef && curDef.id === s.id ? ' on' : ''), onclick: () => load(s.id) }, h('span', {}, s.name), h('small', {}, fmtUm(s.sizeUm))))))
    );
    box.append(sec);
  });
  if (!box.children.length) box.append(h('div', { class: 'lbl', style: 'padding:16px 14px' }, 'No matching specimens'));
}
$('search').addEventListener('input', e => renderCats(e.target.value));

/* ---------- thumbnails (background renderer) ---------- */
let tr = null, tScene, tCam, thumbRunning = false;
function ensureThumbRenderer() {
  if (tr) return true;
  try {
    const c = document.createElement('canvas'); c.width = 480; c.height = 300;
    tr = new THREE.WebGLRenderer({ canvas: c, antialias: true, preserveDrawingBuffer: true });
    tr.setPixelRatio(1); tr.setSize(480, 300, false); tr.toneMapping = THREE.ACESFilmicToneMapping; tr.toneMappingExposure = .95;
    tr.localClippingEnabled = true; tr.setClearColor(0x0b1b2c, 1);
    tScene = new THREE.Scene(); tScene.environment = new THREE.PMREMGenerator(tr).fromScene(new RoomEnvironment(), .04).texture;
    tCam = new THREE.PerspectiveCamera(38, 1.6, .02, 400); tScene.add(tCam); rig(tCam);
    return true;
  } catch (e) { tr = null; return false; }
}
function makeThumb(def) {
  const S = buildSpec(def); S.anims.forEach(f => f(2.5));
  const saveC = CLIP_PLANE.constant; CLIP_PLANE.constant = 1e6;
  tScene.add(S.group); tCam.position.set(.28, .2, 1).normalize().multiplyScalar(def.dist * .72); tCam.lookAt(0, 0, 0);
  tr.render(tScene, tCam); const url = tr.domElement.toDataURL('image/jpeg', .85);
  tScene.remove(S.group); disposeSpec(S); CLIP_PLANE.constant = saveC; return url;
}
function startThumbs() {
  if (thumbRunning || !ensureThumbRenderer()) return; thumbRunning = true;
  const todo = LIB.filter(s => !THUMB[s.id]);
  const step = () => {
    const def = todo.shift();
    if (!def) { thumbRunning = false; store.set('mv-parts', PARTS); if (view === 'journal') renderJournal(); return; }
    try {
      THUMB[def.id] = makeThumb(def);
      const slot = document.querySelector(`[data-thumb="${def.id}"]`); if (slot) slot.replaceChildren(h('img', { src: THUMB[def.id], alt: '', width: 480, height: 300 }));
    } catch (e) { console.warn('thumb failed', def.id, e); }
    setTimeout(step, 60);
  };
  setTimeout(step, 80);
}

/* part-name registry for the journal, built quietly after start-up */
function warmParts() {
  const todo = [...LIB, BYID.animal];
  const step = () => {
    const d = todo.shift();
    if (!d) { store.set('mv-parts', PARTS); if (view === 'journal') renderJournal(); return; }
    try { disposeSpec(buildSpec(d)); } catch (e) { console.warn('registry', d.id, e); }
    setTimeout(step, 40);
  };
  setTimeout(step, 1500);
}

/* ---------- overlays ---------- */
function renderLib() {
  const box = $('libBody'); box.replaceChildren();
  CATS.forEach(c => {
    const items = LIB.filter(s => s.cat === c.id);
    box.append(h('div', { class: 'libcat' }, h('h3', { style: 'color:' + c.col }, c.name), h('span', { class: 'lbl' }, items.length + ' specimens')));
    box.append(h('div', { class: 'grid' }, items.map(s => h('button', { class: 'card', onclick: () => { setView('explore'); load(s.id); } },
      h('div', { class: 'th', 'data-thumb': s.id }, THUMB[s.id] ? h('img', { src: THUMB[s.id], alt: '', width: 480, height: 300 }) : h('span', { class: 'lbl' }, 'Rendering')),
      h('div', { class: 'meta' }, h('b', {}, s.name), h('em', {}, s.latin), h('small', {}, fmtUm(s.sizeUm)))))));
  });
}
function renderJournal() {
  const box = $('jBody'); box.replaceChildren();
  const specs = [...LIB, BYID.animal];
  let found = 0, total = 0, known = 0;
  specs.forEach(s => { const f = Object.keys(J[s.id] || {}).length; found += f; if (PARTS[s.id]) { total += Math.max(PARTS[s.id].length, f); known++; } else total += f; });
  box.append(h('div', { style: 'display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:6px' },
    h('div', { class: 'mono', style: 'color:var(--dim);font-size:12px' }, `${found} structures identified` + (known === specs.length ? ` of ${total}` : '')),
    h('button', { class: 'x', id: 'jReset', onclick: e => { const b = e.currentTarget; if (b.dataset.arm) { J = {}; store.set('mv-journal', J); renderJournal(); renderStructs(); } else { b.dataset.arm = 1; b.textContent = 'Confirm reset'; setTimeout(() => { if (b.isConnected) { delete b.dataset.arm; b.textContent = 'Reset journal'; } }, 3000); } } }, 'Reset journal')));
  if (!found) box.append(h('p', { style: 'color:var(--dim);max-width:60ch' }, 'Nothing recorded yet. Click any structure on a specimen and it is added here with the specimen it belongs to.'));
  specs.forEach(s => {
    const got = J[s.id] || {}, names = PARTS[s.id] || Object.keys(got), nf = Object.keys(got).length;
    const pct = names.length ? Math.round(nf / Math.max(names.length, nf) * 100) : 0;
    box.append(h('div', { class: 'jrow' },
      h('button', { onclick: () => { setView(ANATOMY.includes(s.id) ? 'anatomy' : 'explore'); load(s.id, { keep: true }); } },
        h('b', {}, s.name), h('div', { class: 'lbl', style: 'margin-top:3px' }, `${nf} / ${names.length || '?'} found`), h('div', { class: 'prog' }, h('i', { style: `width:${pct}%` }))),
      h('div', { class: 'chips' }, [
        ...names.filter(n => got[n]).map(n => h('button', { class: 'chip', onclick: () => { setView(ANATOMY.includes(s.id) ? 'anatomy' : 'explore'); load(s.id, { keep: true }).then(() => { const p = cur.parts.find(q => q.name === n); if (p) selectPart(p, true); }); } }, n)),
        names.length - nf > 0 ? h('span', { class: 'chip no' }, `${names.length - nf} not yet identified`) : h('span', { class: 'chip no' }, 'Complete'),
      ])));
  });
}
function renderCmp() {
  const lo = -2.8, hi = 3.4, pos = u => ((Math.log10(u) - lo) / (hi - lo) * 100).toFixed(2) + '%';
  const wrap = h('div', { id: 'cmp' });
  const ticks = [[.01, '10 nm'], [.1, '100 nm'], [1, '1 µm'], [10, '10 µm'], [100, '100 µm'], [1000, '1 mm']];
  wrap.append(h('div', { class: 'axis' }, ticks.map(([u, t]) => h('span', { style: 'left:' + pos(u) }, t)), ticks.map(([u]) => h('i', { style: 'left:' + pos(u) }))));
  const lv = [6, 50, 20, 64];
  const row = (label, sub, items, cls = '') => {
    const rt = h('div', { class: 'rt' }, ticks.map(([u]) => h('div', { class: 'gl', style: 'left:' + pos(u) })));
    items.sort((a, b) => a.u - b.u).forEach((it, i) => {
      const cur_ = curDef && curDef.id === it.id;
      rt.append(h('i', { class: 'dot' + (cur_ ? ' cur' : ''), style: 'left:' + pos(it.u) }));
      const attrs = { class: 'dl' + (cur_ ? ' cur' : ''), style: `left:${pos(it.u)};top:${lv[i % 4]}px` };
      rt.append(it.id ? h('button', { ...attrs, onclick: () => { setView('explore'); load(it.id); } }, it.name, h('small', {}, fmtUm(it.u))) : h('span', attrs, it.name, h('small', {}, fmtUm(it.u))));
    });
    return h('div', { class: 'crow ' + cls }, h('div', { class: 'rl' }, h('div', { class: 'lbl' }, label), h('div', { style: 'font-size:11px;color:var(--mute);margin-top:2px' }, sub)), rt);
  };
  CATS.forEach(c => { const it = LIB.filter(s => s.cat === c.id).map(s => ({ id: s.id, name: s.name, u: s.sizeUm })); wrap.append(row(c.name, it.length + ' specimens', it)); });
  wrap.append(row('Reference', 'Familiar scales', [{ name: 'DNA helix width', u: .0023 }, { name: 'Ribosome', u: .025 }, { name: 'Human hair width', u: 70 }, { name: 'Grain of table salt', u: 400 }], 'ref'));
  const box = $('cmpBody'); box.replaceChildren(wrap, h('div', { class: 'note' }, 'Each tick is ten times larger than the one before. Select a specimen name to open it.'));
}
function syncAna() {
  const bar = $('anaBar'); if (!bar) return;
  bar.replaceChildren(...ANATOMY.map(id => h('button', { class: curDef && curDef.id === id ? 'on' : '', onclick: () => load(id, { keep: true }) }, ANA_LABEL[id])));
}
function setView(v) {
  view = v;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === (v === 'compare' ? 'explore' : v)));
  ['ovLib', 'ovJ', 'ovCmp', 'ovAbout'].forEach(id => $(id).classList.remove('show'));
  $('anaBar').classList.toggle('show', v === 'anatomy');
  $('main').classList.remove('sopen', 'iopen');
  if (v === 'library') { renderLib(); $('ovLib').classList.add('show'); startThumbs(); }
  else if (v === 'journal') { renderJournal(); $('ovJ').classList.add('show'); startThumbs(); }
  else if (v === 'compare') { renderCmp(); $('ovCmp').classList.add('show'); }
  else if (v === 'about') $('ovAbout').classList.add('show');
  else if (v === 'anatomy' && curDef && !ANATOMY.includes(curDef.id)) load('animal', { keep: true });
}
document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => setView('explore')));
stage.addEventListener('pointerdown', () => $('main').classList.remove('sopen', 'iopen'));

/* ---------- keyboard ---------- */
addEventListener('keydown', e => {
  if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'range') { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.key === 'Escape') { setView('explore'); return; }
  if (view !== 'explore' && view !== 'anatomy') return;
  if (e.key === 'r' || e.key === 'R') resetView();
  else if (e.key === ' ') { e.preventDefault(); $('tAnim').click(); }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    if (e.target.type === 'range') return;
    const i = LIB.findIndex(s => s.id === curDef.id), n = (i + (e.key === 'ArrowRight' ? 1 : -1) + LIB.length) % LIB.length; load(LIB[n].id);
  }
});
addEventListener('hashchange', () => { const id = location.hash.slice(1); if (BYID[id] && (!curDef || curDef.id !== id)) load(id, { keep: true }); });

/* ---------- resize / main loop ---------- */
function resize() {
  const w = stage.clientWidth, hh = stage.clientHeight; if (!w || !hh) return;
  renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); hudKey = '';
}
new ResizeObserver(resize).observe(stage); resize();
controls.addEventListener('change', syncZoom);
let lastT = performance.now(), frameN = 0;
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; frameN++;
  if (cur) {
    if (animOn) simT += dt;
    cur.anims.forEach(f => f(simT));
    if (introK < 1) { introK = Math.min(1, introK + dt / .7); cur.group.scale.setScalar(.86 + .14 * ease(introK)); }
  }
  if (tw) { tw.k += dt / tw.dur; const e = ease(Math.min(1, tw.k)); camera.position.lerpVectors(tw.p0, tw.p1, e); controls.target.lerpVectors(tw.t0, tw.t1, e); if (tw.k >= 1) tw = null; }
  motes.rotation.y += dt * .012;
  controls.update(); updateClip();
  if (hlMats.size) { const k = .4 + .22 * Math.sin(now / 320); hlMats.forEach(m => { m.emissiveIntensity = k; }); }
  if (hover && !down && frameN % 3 === 0) {
    const seq = pick(hover.x, hover.y), tip = $('tip'), r = stage.getBoundingClientRect();
    if (seq.length) { tip.textContent = seq[0].name; tip.style.left = hover.x - r.left + 'px'; tip.style.top = hover.y - r.top + 'px'; tip.style.opacity = 1; canvas.classList.add('hot'); }
    else { tip.style.opacity = 0; canvas.classList.remove('hot'); }
  }
  updateHud();
  renderer.render(scene, camera);
}
requestAnimationFrame(tick);

/* ---------- boot ---------- */
syncAna(); renderCats(); warmParts();
{ const id = location.hash.slice(1); load(BYID[id] ? id : 'amoeba', { keep: true }); }
window.__mv = { build: buildSpec, info: () => renderer.info.render, load, setView, get cur() { return cur; }, LIB, selectPart, secToggle: () => $('tSec').click() };
