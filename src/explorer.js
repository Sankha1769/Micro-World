import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SECTION_CLIP_PLANES, SECTION_CLIP_PLANE } from './engine/geometry-helpers.js';
import { vec3, randomDirection, createSeededRandom } from './engine/math.js';
import { Specimen } from './engine/specimen.js';
import { createCanvasTexture } from './engine/textures.js';
import {
  ANATOMY_DEFINITIONS,
  SPECIMEN_BY_ID,
  CATEGORIES,
  SPECIMEN_DEFINITIONS,
} from './specimens/catalogue.js';
import {
  buildAnimalCell,
  buildChloroplast,
  buildEpithelial,
  buildGuard,
  buildMuscle,
  buildNeuron,
  buildPlantCell,
  buildPollen,
  buildRedBloodCell,
  buildWhiteBloodCell,
} from './specimens/cells.js';
import {
  buildCorona,
  buildEscherichiaColi,
  buildInfluenza,
  buildLactobacillus,
  buildBacteriophage,
  buildSpirillum,
  buildStaphylococcus,
} from './specimens/classic-bacteria-and-viruses.js';
import {
  buildAmoeba,
  buildEuglena,
  buildGiardia,
  buildParamecium,
  buildRotifer,
} from './specimens/classic-protists.js';
import { ADDITIONAL_BUILDERS } from './specimens/shared-helpers.js';
import { createIntro } from './welcome-screen.js';

/**
 * MICROVERSE explorer: the main application module.
 *
 * Owns the Three.js scene, the specimen library UI, the details panel, the compare and
 * journal views, and the animation loop. Specimen models are built by `./specimens/*`
 * on top of the helpers in `./engine/*`.
 */

/* ================= MICROVERSE application ================= */
const $ = (id) => document.getElementById(id);
/**
 * Creates a DOM element: `h('div', { class: 'card', onclick: handler }, child, 'text')`.
 * Attributes named `on*` become event listeners; `false` / `null` attributes and children are skipped.
 *
 * @param {string} tagName
 * @param {Record<string, unknown>} [attributes]
 * @param {...(Node|string|number|false|null|Array)} children
 * @returns {HTMLElement}
 */
const h = (t, a = {}, ...k) => {
  const e = document.createElement(t);
  for (const [x, v] of Object.entries(a)) {
    if (x === 'class') {
      e.className = v;
    } else if (x.startsWith('on')) {
      e.addEventListener(x.slice(2), v);
    } else if (v !== false && v != null) {
      e.setAttribute(x, v);
    }
  }
  k.flat().forEach((c) => {
    if (c != null && c !== false) {
      e.append(c instanceof Node ? c : document.createTextNode(c));
    }
  });
  return e;
};
const BUILD = {
  amoeba: buildAmoeba,
  paramecium: buildParamecium,
  euglena: buildEuglena,
  giardia: buildGiardia,
  rotifer: buildRotifer,
  ecoli: buildEscherichiaColi,
  lacto: buildLactobacillus,
  spirillum: buildSpirillum,
  staph: buildStaphylococcus,
  rbc: buildRedBloodCell,
  wbc: buildWhiteBloodCell,
  neuron: buildNeuron,
  muscle: buildMuscle,
  epithelial: buildEpithelial,
  plant: buildPlantCell,
  guard: buildGuard,
  pollen: buildPollen,
  chloroplast: buildChloroplast,
  phage: buildBacteriophage,
  flu: buildInfluenza,
  corona: buildCorona,
  animal: buildAnimalCell,
};
Object.assign(BUILD, ADDITIONAL_BUILDERS);
const LIB = SPECIMEN_DEFINITIONS.filter((s) => s.cat !== 'anat');
const catOf = (id) => CATEGORIES.find((c) => c.id === id);
const catName = (id) => (catOf(id) || { name: 'Cell anatomy' }).name;
const ANA_LABEL = {
  animal: 'Animal cell',
  plant: 'Plant cell',
  ecoli: 'Bacterial cell',
  chloroplast: 'Chloroplast',
};
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* storage unavailable */
    }
  },
};
/**
 * Formats a length given in micrometres using the most natural unit (nm, µm or mm).
 * @param {number} micrometres
 * @returns {string}
 */
function formatLength(micrometres) {
  if (micrometres < 1) {
    return `${+(micrometres * 1000).toPrecision(2)} nm`;
  }
  if (micrometres >= 1000) {
    return `${+(micrometres / 1000).toPrecision(2)} mm`;
  }
  return `${+micrometres.toPrecision(3)} µm`;
}
const ease = (t) => t * t * (3 - 2 * t);

/* ---------- renderer / scene ---------- */
const stage = $('stage');
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.localClippingEnabled = true;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(
  new RoomEnvironment(),
  0.04,
).texture;
const camera = new THREE.PerspectiveCamera(38, 1, 0.02, 400);
scene.add(camera);
/**
 * Attaches the three-point lighting rig to the camera so lighting stays constant while orbiting.
 *
 * @param {THREE.Camera} cam
 */
function rig(cam) {
  cam.add(new THREE.HemisphereLight(0xffffff, 0xd9d3c3, 0.55));
  const k = new THREE.DirectionalLight(0xffffff, 2.4);
  k.position.set(4, 6, 5);
  cam.add(k);
  const f = new THREE.DirectionalLight(0xfff0dc, 0.9);
  f.position.set(-6, -2, 3);
  cam.add(f);
  const r = new THREE.DirectionalLight(0xffffff, 1.1);
  r.position.set(-2, 3, -6);
  cam.add(r);
}
rig(camera);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.07,
  zoomSpeed: 0.8,
  rotateSpeed: 0.8,
  panSpeed: 0.7,
  screenSpacePanning: true,
  autoRotate: true,
  autoRotateSpeed: 1.1,
});

/* floating particulate for depth */
const motes = (() => {
  const n = 240;
  const pos = new Float32Array(n * 3);
  const random = createSeededRandom(5);
  for (let i = 0; i < n; i++) {
    const d = randomDirection(random);
    const r = 0.8 + random() * 0.9;
    pos.set([d.x * r, d.y * r * 0.7, d.z * r], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const map = createCanvasTexture(32, 32, (c, w, hh) => {
    const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, hh);
  });
  const p = new THREE.Points(
    g,
    new THREE.PointsMaterial({
      size: 3,
      sizeAttenuation: false,
      color: 0x8c9a86,
      map,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    }),
  );
  p.frustumCulled = false;
  scene.add(p);
  return p;
})();

/* soft contact shadow under the specimen */
const shadow = (() => {
  const map = createCanvasTexture(
    128,
    128,
    (c, w, hh) => {
      const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(60,64,55,.34)');
      gr.addColorStop(0.55, 'rgba(60,64,55,.12)');
      gr.addColorStop(1, 'rgba(60,64,55,0)');
      c.fillStyle = gr;
      c.fillRect(0, 0, w, hh);
    },
    false,
  );
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = -2;
  scene.add(mesh);
  return mesh;
})();
/**
 * Positions the soft ground shadow beneath a specimen's bounding box.
 *
 * @param {import('./engine/specimen.js').Specimen} specimen
 */
function placeShadow(specimen) {
  const b = new THREE.Box3().setFromObject(specimen.group);
  const sz = b.getSize(vec3());
  shadow.position.set(
    (b.min.x + b.max.x) / 2,
    b.min.y - Math.max(sz.y, 1) * 0.12 - 0.15,
    (b.min.z + b.max.z) / 2,
  );
  const r = Math.max(sz.x, sz.z, 1.2) * 1.35;
  shadow.scale.set(r, r, 1);
}

/* ---------- state ---------- */
let cur = null;
let curDef = null;
let simT = 0;
let animOn = true;
let secOn = false;
let introK = 1;
let loadTok = 0;
let view = 'explore';
let tw = null;
let J = store.get('mv-journal', {});
const PARTS = store.get('mv-parts', {});
const THUMB = {};
const hlMats = new Set();
let selPart = null;
/**
 * Shows a short-lived message at the bottom of the viewer.
 *
 * @param {string} msg
 */
const toast = (msg) => {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 2400);
};

/* ---------- specimen build / dispose ---------- */
/**
 * Builds a specimen from its library definition and prepares it for display:
 * clipping planes are attached, animations are posed at t = 0 and part names are cached.
 *
 * @param {object} def Entry of the specimen library.
 * @returns {import('./engine/specimen.js').Specimen}
 */
function buildSpec(def) {
  const specimen = new Specimen(def);
  BUILD[def.id](specimen);
  specimen.group.traverse((o) => {
    if (o.material) {
      [].concat(o.material).forEach((m) => {
        if (m && !m.clippingPlanes) {
          m.clippingPlanes = SECTION_CLIP_PLANES;
        }
      });
    }
  });
  specimen.anims.forEach((f) => f(0));
  PARTS[def.id] = specimen.parts.map((p) => p.name);
  return specimen;
}
/**
 * Releases the GPU geometry and materials owned by a specimen.
 *
 * @param {import('./engine/specimen.js').Specimen} specimen
 */
function disposeSpec(specimen) {
  specimen.group.traverse((o) => {
    if (o.geometry) {
      o.geometry.dispose();
    }
    if (o.material) {
      [].concat(o.material).forEach((m) => m && m.dispose && m.dispose());
    }
  });
}

/* ---------- loading ---------- */
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
/**
 * Loads a specimen into the viewer, replacing the current one.
 * A token guards against out-of-order completion when several loads overlap.
 *
 * @param {string} id Library id.
 * @param {{ keep?: boolean }} [options] `keep` preserves the current camera pose.
 * @returns {Promise<void>}
 */
async function load(id, { keep = false } = {}) {
  const def = SPECIMEN_BY_ID[id];
  if (!def || !BUILD[id]) {
    return;
  }
  const tok = ++loadTok;
  $('loading').classList.add('on');
  await frame();
  await frame();
  if (tok !== loadTok) {
    return;
  }
  let specimen;
  try {
    specimen = buildSpec(def);
  } catch (error) {
    console.error('build failed', id, error);
    $('loading').classList.remove('on');
    toast(`Could not build ${def.name}`);
    return;
  }
  clearSel();
  if (cur) {
    scene.remove(cur.group);
    disposeSpec(cur);
  }
  cur = specimen;
  curDef = def;
  scene.add(specimen.group);
  introK = 0;
  simT = 0;
  placeShadow(specimen);
  controls.minDistance = def.dist * 0.08;
  controls.maxDistance = def.dist * 2.4 * fitK();
  const dir = vec3(0.28, 0.2, 1).normalize();
  camera.position.copy(dir).multiplyScalar(def.dist * fitK());
  controls.target.set(0, 0, 0);
  controls.update();
  tw = null;
  motes.scale.setScalar(def.dist * 1.5 * fitK());
  if (!keep && view === 'anatomy' && !ANATOMY_DEFINITIONS.includes(id)) {
    setView('explore');
  }
  if (def.cut && secOn) {
    $('secR').value = 0;
  }
  renderInfo();
  renderCats($('search').value);
  syncAna();
  try {
    history.replaceState(null, '', `#${id}`);
  } catch {
    /* ignore */
  }
  store.set('mv-parts', PARTS);
  $('loading').classList.remove('on');
  $('main').classList.remove('sopen');
}
/** Distance multiplier that keeps a specimen in frame on narrow (portrait) viewports. */
const fitK = () => Math.min(2.4, Math.max(1, 0.92 / camera.aspect));
/** The default camera position for the current specimen. */
const home = () =>
  vec3(0.28, 0.2, 1)
    .normalize()
    .multiplyScalar(curDef.dist * fitK());
/**
 * Starts a smooth camera move.
 *
 * @param {THREE.Vector3} pos Destination camera position.
 * @param {THREE.Vector3} tgt Destination orbit target.
 * @param {number} [dur] Duration in seconds.
 */
function tweenTo(pos, tgt, dur = 0.7) {
  tw = {
    p0: camera.position.clone(),
    t0: controls.target.clone(),
    p1: pos.clone(),
    t1: tgt.clone(),
    k: 0,
    dur,
  };
}
function resetView() {
  if (curDef) {
    tweenTo(home(), vec3(0, 0, 0), 0.7);
  }
}

/* ---------- info panel ---------- */
function renderInfo() {
  const d = curDef;
  $('hCat').textContent = catName(d.cat);
  $('hName').textContent = d.name;
  $('hSci').textContent = d.latin;
  $('iCat').textContent = catName(d.cat);
  $('iName').textContent = d.name;
  $('iSci').textContent = d.latin;
  $('iDesc').textContent = d.desc;
  const f = $('iFacts');
  f.replaceChildren();
  const rows = d.cls
    ? [
        ['Classification', d.cls],
        ['Size', d.size],
        ['Habitat', d.habitat],
        ['Movement', d.move],
        ['Nutrition', d.feed],
        ['Reproduction', d.repro],
      ]
    : [['Size', d.size], ...d.facts];
  rows.forEach(([a, b]) => f.append(h('dt', {}, a), h('dd', {}, b)));
  const fun = d.fun || [];
  $('funWrap').hidden = !fun.length;
  $('iFun').replaceChildren(...fun.map((t) => h('li', {}, t)));
  const nt = $('iNote');
  nt.hidden = !d.note;
  if (d.note) {
    nt.replaceChildren(h('b', {}, 'About this model'), d.note);
  }
  $('sLbl').textContent = ANATOMY_DEFINITIONS.includes(d.id)
    ? 'Organelles and structures'
    : 'Structures';
  renderStructs();
  showPart(null);
}
function renderStructs() {
  const box = $('structs');
  box.replaceChildren();
  const seen = J[curDef.id] || {};
  cur.parts.forEach((p) =>
    box.append(
      h(
        'button',
        {
          class: `st${seen[p.name] ? ' seen' : ''}${p === selPart ? ' on' : ''}`,
          onclick: () => selectPart(p, true),
        },
        h('i'),
        p.name,
      ),
    ),
  );
}
function showPart(p) {
  const card = $('partCard');
  card.classList.toggle('show', !!p);
  if (p) {
    $('pName').textContent = p.name;
    $('pDesc').textContent = p.desc;
  }
  const b = $('actBtn');
  b.hidden = !p;
  if (p) {
    b.textContent = 'Focus on structure';
  }
}

/* ---------- selection / highlight ---------- */
const hlCache = new WeakMap();
function hlMat(m) {
  if (Array.isArray(m)) {
    return m.map(hlMat);
  }
  if (hlCache.has(m)) {
    return hlCache.get(m);
  }
  const c = m.clone();
  c.clippingPlanes = m.clippingPlanes;
  if ('emissive' in c) {
    c.emissive = new THREE.Color(0xd5aa60);
    c.emissiveIntensity = 0.55;
    hlMats.add(c);
  }
  hlCache.set(m, c);
  return c;
}
function clearSel() {
  if (selPart) {
    selPart.meshes.forEach((m) => {
      if (m.userData._om) {
        m.material = m.userData._om;
        delete m.userData._om;
      }
    });
  }
  hlMats.forEach((m) => m.dispose());
  hlMats.clear();
  selPart = null;
}
/**
 * Selects (or clears, when `p` is null) a part, highlights it and fills the part card.
 *
 * @param {import('./engine/specimen.js').SpecimenPart|null} p
 * @param {boolean} [focus] Also move the camera to frame the part.
 */
function selectPart(p, focus = false) {
  clearSel();
  selPart = p;
  if (p) {
    p.meshes.forEach((m) => {
      if (!m.userData._om) {
        m.userData._om = m.material;
        m.material = hlMat(m.material);
      }
    });
    J[curDef.id] = J[curDef.id] || {};
    if (!J[curDef.id][p.name]) {
      J[curDef.id][p.name] = Date.now();
      store.set('mv-journal', J);
      toast('Added to Discovery Journal');
    }
    if (matchMedia('(max-width:980px)').matches) {
      $('main').classList.add('iopen');
    }
    if (focus) {
      focusPart(p);
    }
  }
  showPart(p);
  renderStructs();
}
/**
 * Moves the camera to frame all meshes of a part.
 *
 * @param {import('./engine/specimen.js').SpecimenPart} p
 */
function focusPart(p) {
  const b = new THREE.Box3();
  const t = new THREE.Box3();
  p.meshes.forEach((m) => {
    t.setFromObject(m);
    if (!t.isEmpty()) {
      b.union(t);
    }
  });
  if (b.isEmpty()) {
    return;
  }
  const c = b.getCenter(vec3());
  const sz = b.getSize(vec3()).length();
  const dir = camera.position.clone().sub(controls.target).normalize();
  const d = THREE.MathUtils.clamp(sz * 1.8, controls.minDistance * 1.05, controls.maxDistance);
  tweenTo(c.clone().addScaledVector(dir, d), c, 0.8);
}

/* ---------- picking ---------- */
const ray = new THREE.Raycaster();
ray.params.Line.threshold = 0.02;
ray.params.Points.threshold = 0.02;
const mouse = new THREE.Vector2();
/**
 * Ray-casts into the scene at a screen position.
 *
 * @param {number} cx Client X in pixels.
 * @param {number} cy Client Y in pixels.
 * @returns {THREE.Intersection[]} Hits on selectable meshes, nearest first.
 */
function pick(cx, cy) {
  if (!cur) {
    return [];
  }
  const r = canvas.getBoundingClientRect();
  mouse.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const seq = [];
  const seen = new Set();
  for (const hit of ray.intersectObject(cur.group, true)) {
    const p = hit.object.userData.part;
    if (!p || seen.has(p) || SECTION_CLIP_PLANE.distanceToPoint(hit.point) < 0) {
      continue;
    }
    seen.add(p);
    seq.push(p);
  }
  return [...seq.filter((p) => !p.shell), ...seq.filter((p) => p.shell)];
}
let down = null;
let last = null;
let hover = null;

canvas.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary) {
    return;
  }
  down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
  canvas.classList.add('drag');
  $('tip').style.opacity = 0;
});
canvas.addEventListener('pointermove', (e) => {
  if (down) {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) {
      down.moved = true;
    }
    return;
  }
  hover = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerleave', () => {
  hover = null;
  $('tip').style.opacity = 0;
  canvas.classList.remove('hot');
});
canvas.addEventListener('pointerup', (e) => {
  canvas.classList.remove('drag');
  if (!down || !e.isPrimary) {
    return;
  }
  const d = down;
  down = null;
  if (d.moved || performance.now() - d.t > 450) {
    return;
  }
  const seq = pick(e.clientX, e.clientY);
  if (!seq.length) {
    selectPart(null);
    last = null;
    return;
  }
  let idx = 0;
  if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 8 && last.top === seq[0]) {
    idx = (last.idx + 1) % seq.length;
  }
  last = { x: e.clientX, y: e.clientY, idx, top: seq[0] };
  selectPart(seq[idx]);
  $('main').classList.remove('sopen');
});
canvas.addEventListener('pointercancel', () => {
  down = null;
  canvas.classList.remove('drag');
});
controls.addEventListener('start', () => {
  tw = null;
  if (controls.autoRotate) {
    controls.autoRotate = false;
    $('tRot').classList.remove('on');
  }
});

/* ---------- zoom / hud ---------- */
let zGuard = false;
function dist() {
  return camera.position.distanceTo(controls.target);
}
function syncZoom() {
  if (!curDef) {
    return;
  }
  const mx = controls.maxDistance;
  const mn = controls.minDistance;
  const s = (Math.log(mx / THREE.MathUtils.clamp(dist(), mn, mx)) / Math.log(mx / mn)) * 100;
  zGuard = true;
  $('zoomR').value = s;
  zGuard = false;
}
$('zoomR').addEventListener('input', (e) => {
  if (zGuard || !curDef) {
    return;
  }
  tw = null;
  const mx = controls.maxDistance;
  const mn = controls.minDistance;
  const d = mx * Math.pow(mn / mx, e.target.value / 100);
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, d);
});
let hudKey = '';
function updateHud() {
  if (!curDef) {
    return;
  }
  const H = stage.clientHeight || 1;
  const umPerUnit = curDef.umPerUnit || curDef.sizeUm / curDef.U;
  const worldH = 2 * dist() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const pxPerUm = H / (worldH * umPerUnit);
  const mag = pxPerUm * 264.6;
  const ideal = 120 / pxPerUm;
  const p10 = Math.pow(10, Math.floor(Math.log10(ideal)));
  const nice = [5, 2, 1].map((m) => m * p10).find((v) => v <= ideal) || p10;
  const key = `${nice}|${Math.round(nice * pxPerUm)}|${+mag.toPrecision(3)}`;
  if (key === hudKey) {
    return;
  }
  hudKey = key;
  $('bar').style.width = `${Math.round(nice * pxPerUm)}px`;
  $('barLbl').textContent = formatLength(nice);
  const mg = +mag.toPrecision(3);
  $('magV').textContent =
    `${mg >= 1e6 ? `${+(mg / 1e6).toPrecision(3)}M` : mg.toLocaleString('en-US')}×`;
}

/* ---------- cross-section ---------- */
const fwd = vec3();
/** Positions the cross-section plane from the section slider (or disables it). */
function updateClip() {
  if (!secOn || !curDef) {
    SECTION_CLIP_PLANE.constant = 1e6;
    return;
  }
  camera.getWorldDirection(fwd);
  SECTION_CLIP_PLANE.normal.copy(fwd);
  const pp = controls.target.clone().addScaledVector(fwd, ($('secR').value / 100) * curDef.U * 0.5);
  SECTION_CLIP_PLANE.constant = -fwd.dot(pp);
}
$('tSec').onclick = () => {
  secOn = !secOn;
  $('tSec').classList.toggle('on', secOn);
  $('secWrap').classList.toggle('show', secOn);
};

/* ---------- toolbar ---------- */
$('tReset').onclick = resetView;
$('tRot').onclick = () => {
  controls.autoRotate = !controls.autoRotate;
  $('tRot').classList.toggle('on', controls.autoRotate);
};
$('tAnim').onclick = () => {
  animOn = !animOn;
  $('tAnim').classList.toggle('on', animOn);
};
$('tCmp').onclick = () => setView('compare');
$('actBtn').onclick = () => selPart && focusPart(selPart);
/* collapsible library, details panel and top menu bar (remembered in this browser) */
{
  const ls = {
    get: (k) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* not supported: ignore */
      }
    },
  };
  const st = {
    side: ls.get('mv-side') !== '0',
    info: ls.get('mv-info') !== '0',
    nav: ls.get('mv-nav') !== '0',
  };
  const apply = () => {
    $('main').classList.toggle('noside', !st.side);
    $('main').classList.toggle('noinfo', !st.info);
    $('app').classList.toggle('navoff', !st.nav);
    document.body.classList.toggle('navoff', !st.nav);
    $('btnLib').setAttribute('aria-pressed', st.side);
    $('btnPanel').setAttribute('aria-pressed', st.info);
    $('edgeL').innerHTML = st.side ? '&lsaquo;' : '&rsaquo;';
    $('edgeR').innerHTML = st.info ? '&rsaquo;' : '&lsaquo;';
    const libraryEdgeLabel = st.side ? 'Collapse library' : 'Open library';
    const detailsEdgeLabel = st.info ? 'Collapse details' : 'Open details';
    $('edgeL').title = libraryEdgeLabel;
    $('edgeL').ariaLabel = libraryEdgeLabel;
    $('edgeR').title = detailsEdgeLabel;
    $('edgeR').ariaLabel = detailsEdgeLabel;
    ls.set('mv-side', st.side ? 1 : 0);
    ls.set('mv-info', st.info ? 1 : 0);
    ls.set('mv-nav', st.nav ? 1 : 0);
  };
  const tog = (k) => {
    st[k] = !st[k];
    apply();
  };
  const toggleLibrary = () => tog('side');
  const toggleDetails = () => tog('info');
  const toggleMenuBar = () => tog('nav');
  $('btnLib').onclick = toggleLibrary;
  $('edgeL').onclick = toggleLibrary;
  $('btnPanel').onclick = toggleDetails;
  $('edgeR').onclick = toggleDetails;
  $('btnNav').onclick = toggleMenuBar;
  $('navTab').onclick = toggleMenuBar;
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea')) {
      return;
    }
    if (e.key === '[') {
      tog('side');
    } else if (e.key === ']') {
      tog('info');
    }
  });
  apply();
}
$('btnSpecs').onclick = () => {
  $('main').classList.toggle('sopen');
  $('main').classList.remove('iopen');
};
$('btnInfo').onclick = () => {
  $('main').classList.toggle('iopen');
  $('main').classList.remove('sopen');
};
$('btnFs').onclick = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
    return;
  }
  try {
    const p =
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    if (p && p.catch) {
      p.catch(() => toast('Fullscreen is not available in this view'));
    }
  } catch {
    toast('Fullscreen is not available in this view');
  }
};
document.addEventListener('fullscreenchange', () => {
  $('btnFs').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
});

/* ---------- library sidebar ---------- */
const closed = new Set();
let catFilter = 'all';
function thumbSlot(id, cls) {
  return h(
    'span',
    { class: cls, 'data-tn': id },
    THUMB[id] ? h('img', { src: THUMB[id], alt: '', width: 96, height: 60 }) : null,
  );
}
function renderChips() {
  const box = $('chips');
  box.replaceChildren(
    ...[{ id: 'all', short: 'All' }, ...CATEGORIES].map((c) =>
      h(
        'button',
        {
          class: catFilter === c.id ? 'on' : '',
          'aria-pressed': catFilter === c.id,
          onclick: () => {
            catFilter = c.id;
            renderChips();
            renderCats($('search').value);
          },
        },
        c.short,
      ),
    ),
  );
}
function renderCats(filter = '') {
  const f = filter.trim().toLowerCase();
  const box = $('catList');
  box.replaceChildren();
  CATEGORIES.forEach((c) => {
    if (catFilter !== 'all' && catFilter !== c.id) {
      return;
    }
    const items = LIB.filter(
      (s) => s.cat === c.id && (!f || `${s.name} ${s.latin}`.toLowerCase().includes(f)),
    );
    if (!items.length) {
      return;
    }
    const sec = h('div', { class: `cat${closed.has(c.id) && !f ? ' closed' : ''}` });
    sec.append(
      h(
        'button',
        {
          onclick: () => {
            closed.has(c.id) ? closed.delete(c.id) : closed.add(c.id);
            sec.classList.toggle('closed');
          },
          'aria-expanded': !closed.has(c.id),
        },
        h(
          'span',
          { class: 'lbl', style: `border-left:3px solid ${c.col};padding-left:8px` },
          c.name,
        ),
        h('span', { class: 'n' }, items.length),
      ),
      h(
        'ul',
        {},
        items.map((s) =>
          h(
            'li',
            {},
            h(
              'button',
              {
                class: `sp${curDef && curDef.id === s.id ? ' on' : ''}`,
                onclick: () => load(s.id),
              },
              thumbSlot(s.id, 'tn'),
              h('span', { class: 'nm' }, s.name, h('i', {}, s.latin)),
              h('small', {}, formatLength(s.sizeUm)),
            ),
          ),
        ),
      ),
    );
    box.append(sec);
  });
  if (!box.children.length) {
    box.append(h('div', { class: 'lbl', style: 'padding:16px 14px' }, 'No matching specimens'));
  }
}
$('search').addEventListener('input', (e) => renderCats(e.target.value));

/* ---------- thumbnails (background renderer) ---------- */
let tr = null;
let tScene;
let tCam;
let thumbRunning = false;
function ensureThumbRenderer() {
  if (tr) {
    return true;
  }
  try {
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 300;
    tr = new THREE.WebGLRenderer({ canvas: c, antialias: true, preserveDrawingBuffer: true });
    tr.setPixelRatio(1);
    tr.setSize(480, 300, false);
    tr.toneMapping = THREE.ACESFilmicToneMapping;
    tr.toneMappingExposure = 1.1;
    tr.localClippingEnabled = true;
    tr.setClearColor(0xbfe9ec, 1);
    tScene = new THREE.Scene();
    tScene.environment = new THREE.PMREMGenerator(tr).fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    tCam = new THREE.PerspectiveCamera(38, 1.6, 0.02, 400);
    tScene.add(tCam);
    rig(tCam);
    return true;
  } catch {
    tr = null;
    return false;
  }
}
/**
 * Renders a library thumbnail for a specimen with the off-screen renderer.
 *
 * @param {object} def
 * @returns {string} Image data URL.
 */
function makeThumb(def) {
  const specimen = buildSpec(def);
  specimen.anims.forEach((f) => f(2.5));
  const saveC = SECTION_CLIP_PLANE.constant;
  SECTION_CLIP_PLANE.constant = 1e6;
  tScene.add(specimen.group);
  tCam.position
    .set(0.28, 0.2, 1)
    .normalize()
    .multiplyScalar(def.dist * 0.72);
  tCam.lookAt(0, 0, 0);
  tr.render(tScene, tCam);
  const url = tr.domElement.toDataURL('image/jpeg', 0.85);
  tScene.remove(specimen.group);
  disposeSpec(specimen);
  SECTION_CLIP_PLANE.constant = saveC;
  return url;
}
function startThumbs() {
  if (thumbRunning || !ensureThumbRenderer()) {
    return;
  }
  thumbRunning = true;
  const todo = LIB.filter((s) => !THUMB[s.id]);
  const step = () => {
    const def = todo.shift();
    if (!def) {
      thumbRunning = false;
      store.set('mv-parts', PARTS);
      if (view === 'journal') {
        renderJournal();
      }
      return;
    }
    try {
      THUMB[def.id] = makeThumb(def);
      document
        .querySelectorAll(`[data-thumb="${def.id}"],[data-tn="${def.id}"]`)
        .forEach((slot) =>
          slot.replaceChildren(h('img', { src: THUMB[def.id], alt: '', width: 480, height: 300 })),
        );
    } catch (error) {
      console.warn('thumb failed', def.id, error);
    }
    setTimeout(step, 60);
  };
  setTimeout(step, 80);
}

/* part-name registry for the journal, built quietly after start-up */
function warmParts() {
  const todo = [...LIB, SPECIMEN_BY_ID.animal];
  const step = () => {
    const d = todo.shift();
    if (!d) {
      store.set('mv-parts', PARTS);
      if (view === 'journal') {
        renderJournal();
      }
      return;
    }
    try {
      disposeSpec(buildSpec(d));
    } catch (error) {
      console.warn('registry', d.id, error);
    }
    setTimeout(step, 40);
  };
  setTimeout(step, 1500);
}

/* ---------- overlays ---------- */
function renderLib() {
  const box = $('libBody');
  box.replaceChildren();
  CATEGORIES.forEach((c) => {
    const items = LIB.filter((s) => s.cat === c.id);
    box.append(
      h(
        'div',
        { class: 'libcat' },
        h('h3', { style: `color:${c.col}` }, c.name),
        h('span', { class: 'lbl' }, `${items.length} specimens`),
      ),
    );
    box.append(
      h(
        'div',
        { class: 'grid' },
        items.map((s) =>
          h(
            'button',
            {
              class: 'card',
              onclick: () => {
                setView('explore');
                load(s.id);
              },
            },
            h(
              'div',
              { class: 'th', 'data-thumb': s.id },
              THUMB[s.id]
                ? h('img', { src: THUMB[s.id], alt: '', width: 480, height: 300 })
                : h('span', { class: 'lbl' }, 'Rendering'),
            ),
            h(
              'div',
              { class: 'meta' },
              h('b', {}, s.name),
              h('em', {}, s.latin),
              h('small', {}, formatLength(s.sizeUm)),
            ),
          ),
        ),
      ),
    );
  });
}
function renderJournal() {
  const box = $('jBody');
  box.replaceChildren();
  const specs = [...LIB, SPECIMEN_BY_ID.animal];
  let found = 0;
  let total = 0;
  let known = 0;
  specs.forEach((s) => {
    const f = Object.keys(J[s.id] || {}).length;
    found += f;
    if (PARTS[s.id]) {
      total += Math.max(PARTS[s.id].length, f);
      known++;
    } else {
      total += f;
    }
  });
  box.append(
    h(
      'div',
      {
        style:
          'display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:6px',
      },
      h(
        'div',
        { class: 'mono', style: 'color:var(--color-text-secondary);font-size:12px' },
        `${found} structures identified${known === specs.length ? ` of ${total}` : ''}`,
      ),
      h(
        'button',
        {
          class: 'x',
          id: 'jReset',
          onclick: (e) => {
            const b = e.currentTarget;
            if (b.dataset.arm) {
              J = {};
              store.set('mv-journal', J);
              renderJournal();
              renderStructs();
            } else {
              b.dataset.arm = 1;
              b.textContent = 'Confirm reset';
              setTimeout(() => {
                if (b.isConnected) {
                  delete b.dataset.arm;
                  b.textContent = 'Reset journal';
                }
              }, 3000);
            }
          },
        },
        'Reset journal',
      ),
    ),
  );
  if (!found) {
    box.append(
      h(
        'p',
        { style: 'color:var(--color-text-secondary);max-width:60ch' },
        'Nothing recorded yet. Click any structure on a specimen and it is added here with the specimen it belongs to.',
      ),
    );
  }
  specs.forEach((s) => {
    const got = J[s.id] || {};
    const names = PARTS[s.id] || Object.keys(got);
    const nf = Object.keys(got).length;
    const pct = names.length ? Math.round((nf / Math.max(names.length, nf)) * 100) : 0;
    box.append(
      h(
        'div',
        { class: 'jrow' },
        h(
          'button',
          {
            onclick: () => {
              setView(ANATOMY_DEFINITIONS.includes(s.id) ? 'anatomy' : 'explore');
              load(s.id, { keep: true });
            },
          },
          h('b', {}, s.name),
          h(
            'div',
            { class: 'lbl', style: 'margin-top:3px' },
            `${nf} / ${names.length || '?'} found`,
          ),
          h('div', { class: 'prog' }, h('i', { style: `width:${pct}%` })),
        ),
        h('div', { class: 'chips' }, [
          ...names
            .filter((n) => got[n])
            .map((n) =>
              h(
                'button',
                {
                  class: 'chip',
                  onclick: () => {
                    setView(ANATOMY_DEFINITIONS.includes(s.id) ? 'anatomy' : 'explore');
                    load(s.id, { keep: true }).then(() => {
                      const p = cur.parts.find((q) => q.name === n);
                      if (p) {
                        selectPart(p, true);
                      }
                    });
                  },
                },
                n,
              ),
            ),
          names.length - nf > 0
            ? h('span', { class: 'chip no' }, `${names.length - nf} not yet identified`)
            : h('span', { class: 'chip no' }, 'Complete'),
        ]),
      ),
    );
  });
}
function renderCmp() {
  const lo = -2.8;
  const hi = 4.3;
  const pos = (u) => `${(((Math.log10(u) - lo) / (hi - lo)) * 100).toFixed(2)}%`;
  const wrap = h('div', { id: 'cmp' });
  const ticks = [
    [0.01, '10 nm'],
    [0.1, '100 nm'],
    [1, '1 µm'],
    [10, '10 µm'],
    [100, '100 µm'],
    [1000, '1 mm'],
    [10000, '1 cm'],
  ];
  wrap.append(
    h(
      'div',
      { class: 'axis' },
      ticks.map(([u, t]) => h('span', { style: `left:${pos(u)}` }, t)),
      ticks.map(([u]) => h('i', { style: `left:${pos(u)}` })),
    ),
  );
  const lvA = [6, 50, 20, 64];
  const lvB = [4, 50, 20, 66, 82, 98];
  const row = (label, sub, items, cls = '') => {
    const lv = items.length > 6 ? lvB : lvA;
    const rt = h(
      'div',
      { class: 'rt' },
      ticks.map(([u]) => h('div', { class: 'gl', style: `left:${pos(u)}` })),
    );
    items
      .sort((a, b) => a.u - b.u)
      .forEach((it, i) => {
        const cur_ = curDef && curDef.id === it.id;
        rt.append(h('i', { class: `dot${cur_ ? ' cur' : ''}`, style: `left:${pos(it.u)}` }));
        const attrs = {
          class: `dl${cur_ ? ' cur' : ''}`,
          style: `left:${pos(it.u)};top:${lv[i % lv.length]}px`,
        };
        rt.append(
          it.id
            ? h(
                'button',
                {
                  ...attrs,
                  onclick: () => {
                    setView('explore');
                    load(it.id);
                  },
                },
                it.name,
                h('small', {}, formatLength(it.u)),
              )
            : h('span', attrs, it.name, h('small', {}, formatLength(it.u))),
        );
      });
    return h(
      'div',
      { class: `crow ${cls}`, style: items.length > 6 ? 'height:124px' : null },
      h(
        'div',
        { class: 'rl' },
        h('div', { class: 'lbl' }, label),
        h('div', { style: 'font-size:11px;color:var(--color-text-muted);margin-top:2px' }, sub),
      ),
      rt,
    );
  };
  CATEGORIES.forEach((c) => {
    const it = LIB.filter((s) => s.cat === c.id).map((s) => ({
      id: s.id,
      name: s.name,
      u: s.sizeUm,
    }));
    wrap.append(row(c.name, `${it.length} specimens`, it));
  });
  wrap.append(
    row(
      'Reference',
      'Familiar scales',
      [
        { name: 'DNA helix width', u: 0.0023 },
        { name: 'Ribosome', u: 0.025 },
        { name: 'Human hair width', u: 70 },
        { name: 'Grain of table salt', u: 400 },
      ],
      'ref',
    ),
  );
  const box = $('cmpBody');
  box.replaceChildren(
    wrap,
    h(
      'div',
      { class: 'note' },
      'Each tick is ten times larger than the one before. Select a specimen name to open it.',
    ),
  );
}
function syncAna() {
  const bar = $('anaBar');
  if (!bar) {
    return;
  }
  bar.replaceChildren(
    ...ANATOMY_DEFINITIONS.map((id) =>
      h(
        'button',
        { class: curDef && curDef.id === id ? 'on' : '', onclick: () => load(id, { keep: true }) },
        ANA_LABEL[id],
      ),
    ),
  );
}
/**
 * Switches between the main views (explorer, compare, journal, about) and updates the navigation.
 *
 * @param {string} v View name.
 */
function setView(v) {
  view = v;
  document
    .querySelectorAll('#nav button')
    .forEach((b) => b.classList.toggle('on', b.dataset.view === (v === 'compare' ? 'explore' : v)));
  ['ovLib', 'ovJ', 'ovCmp', 'ovAbout'].forEach((id) => $(id).classList.remove('show'));
  $('anaBar').classList.toggle('show', v === 'anatomy');
  $('main').classList.remove('sopen', 'iopen');
  if (v === 'library') {
    renderLib();
    $('ovLib').classList.add('show');
    startThumbs();
  } else if (v === 'journal') {
    renderJournal();
    $('ovJ').classList.add('show');
    startThumbs();
  } else if (v === 'compare') {
    renderCmp();
    $('ovCmp').classList.add('show');
  } else if (v === 'about') {
    $('ovAbout').classList.add('show');
  } else if (v === 'anatomy' && curDef && !ANATOMY_DEFINITIONS.includes(curDef.id)) {
    load('animal', { keep: true });
  }
}
document
  .querySelectorAll('#nav button')
  .forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
document
  .querySelectorAll('[data-close]')
  .forEach((b) => b.addEventListener('click', () => setView('explore')));
stage.addEventListener('pointerdown', () => $('main').classList.remove('sopen', 'iopen'));

/* ---------- keyboard ---------- */
addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'range') {
    if (e.key === 'Escape') {
      e.target.blur();
    }
    return;
  }
  if (e.key === 'Escape') {
    setView('explore');
    return;
  }
  if (view !== 'explore' && view !== 'anatomy') {
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    resetView();
  } else if (e.key === ' ') {
    e.preventDefault();
    $('tAnim').click();
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    if (e.target.type === 'range') {
      return;
    }
    const i = LIB.findIndex((s) => s.id === curDef.id);
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + LIB.length) % LIB.length;
    load(LIB[n].id);
  }
});
addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (SPECIMEN_BY_ID[id] && (!curDef || curDef.id !== id)) {
    load(id, { keep: true });
  }
});

/* ---------- resize / main loop ---------- */
/** Fits the renderer, camera and overlay canvases to the stage size. */
function resize() {
  const w = stage.clientWidth;
  const hh = stage.clientHeight;
  if (!w || !hh) {
    return;
  }
  renderer.setSize(w, hh, false);
  camera.aspect = w / hh;
  camera.updateProjectionMatrix();
  hudKey = '';
}
new ResizeObserver(resize).observe(stage);
resize();
controls.addEventListener('change', syncZoom);
let lastT = performance.now();
let frameN = 0;
const introHash = !!location.hash.slice(1) && !!SPECIMEN_BY_ID[location.hash.slice(1)]; // deep links to a specimen skip the welcome screen
const introDeferred = [];
const intro = introHash
  ? null
  : createIntro({
      onLeave: () => {
        introK = 0;
      },
      onDone: () => {
        introDeferred.splice(0).forEach((f) => setTimeout(f, 400));
      },
    });
if (!intro) {
  const el = document.getElementById('intro');
  if (el) {
    el.remove();
  }
}
/**
 * The single animation loop: advances the intro or the specimen animations,
 * eases camera tweens and renders one frame.
 *
 * @param {number} now Timestamp from requestAnimationFrame in milliseconds.
 */
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  frameN++;
  if (intro && !intro.done) {
    intro.update(now, dt);
    if (!intro.leaving) {
      return;
    }
  } // one loop: explorer idles while the DNA intro owns the screen
  if (cur) {
    if (animOn) {
      simT += dt;
    }
    cur.anims.forEach((f) => f(simT));
    if (introK < 1) {
      introK = Math.min(1, introK + dt / 0.7);
      cur.group.scale.setScalar(0.86 + 0.14 * ease(introK));
    }
  }
  if (tw) {
    tw.k += dt / tw.dur;
    const e = ease(Math.min(1, tw.k));
    camera.position.lerpVectors(tw.p0, tw.p1, e);
    controls.target.lerpVectors(tw.t0, tw.t1, e);
    if (tw.k >= 1) {
      tw = null;
    }
  }
  motes.rotation.y += dt * 0.012;
  controls.update();
  updateClip();
  if (hlMats.size) {
    const k = 0.4 + 0.22 * Math.sin(now / 320);
    hlMats.forEach((m) => {
      m.emissiveIntensity = k;
    });
  }
  if (hover && !down && frameN % 3 === 0) {
    const seq = pick(hover.x, hover.y);
    const tip = $('tip');
    const r = stage.getBoundingClientRect();
    if (seq.length) {
      tip.textContent = seq[0].name;
      tip.style.left = `${hover.x - r.left}px`;
      tip.style.top = `${hover.y - r.top}px`;
      tip.style.opacity = 1;
      canvas.classList.add('hot');
    } else {
      tip.style.opacity = 0;
      canvas.classList.remove('hot');
    }
  }
  updateHud();
  renderer.render(scene, camera);
}
requestAnimationFrame(tick);

/* ---------- boot ---------- */
syncAna();
renderChips();
renderCats();
if (!window.__noThumbs) {
  const go = () => {
    warmParts();
    setTimeout(startThumbs, 1500);
  };
  if (intro) {
    introDeferred.push(go);
  } else {
    go();
  }
}
{
  const id = location.hash.slice(1);
  load(SPECIMEN_BY_ID[id] ? id : 'amoeba', { keep: true });
}
window.__mv = {
  intro,
  build: buildSpec,
  info: () => renderer.info.render,
  load,
  setView,
  get cur() {
    return cur;
  },
  LIB,
  selectPart,
  secToggle: () => $('tSec').click(),
};
