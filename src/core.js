import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ================= utilities ================= */
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const V2 = (x, y) => new THREE.Vector2(x, y);
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const h = (a, b, c) => hash3(xi + a, yi + b, zi + c);
  return lerp(lerp(lerp(h(0, 0, 0), h(1, 0, 0), u), lerp(h(0, 1, 0), h(1, 1, 0), u), v),
    lerp(lerp(h(0, 0, 1), h(1, 0, 1), u), lerp(h(0, 1, 1), h(1, 1, 1), u), v), w) * 2 - 1;
}
const fbm = (x, y, z) => noise3(x, y, z) * .6 + noise3(x * 2.1, y * 2.1, z * 2.1) * .3 + noise3(x * 4.3, y * 4.3, z * 4.3) * .1;
function fib(n) { const a = [], g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), t = g * i; a.push(V(Math.cos(t) * r, y, Math.sin(t) * r)); } return a; }
const qFromUp = (d) => new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
const randDir = (R) => { const z = R() * 2 - 1, t = R() * TAU, r = Math.sqrt(1 - z * z); return V(r * Math.cos(t), r * Math.sin(t), z); };
const randInBall = (R) => { for (;;) { const p = V(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); if (p.lengthSq() <= 1) return p; } };

/* ================= textures ================= */
function noiseTex(size, seed, octs = [6, 12, 24], amps = [.5, .3, .2]) {
  const r = rng(seed), grids = octs.map(P => Array.from({ length: P * P }, () => r()));
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'), img = ctx.createImageData(size, size), sm = t => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    octs.forEach((P, k) => {
      const fx = x / size * P, fy = y / size * P, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx - x0), ty = sm(fy - y0), g = grids[k];
      const a = g[(y0 % P) * P + (x0 % P)], b = g[(y0 % P) * P + ((x0 + 1) % P)], c2 = g[((y0 + 1) % P) * P + (x0 % P)], d = g[((y0 + 1) % P) * P + ((x0 + 1) % P)];
      v += lerp(lerp(a, b, tx), lerp(c2, d, tx), ty) * amps[k];
    });
    const o = (y * size + x) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = clamp(v, 0, 1) * 255; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TEX = {};
TEX.bump = noiseTex(256, 7); TEX.bump.repeat.set(3, 3);
TEX.grain = noiseTex(128, 21, [16, 32, 48], [.3, .4, .3]); TEX.grain.repeat.set(2, 2);
TEX.cellulose = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); const r = rng(5);
  for (let i = 0; i < 520; i++) { const x = r() * w, y = r() * h, a = r() * Math.PI, l = 30 + r() * 60; g.strokeStyle = r() > .5 ? '#c8c8c8' : '#4a4a4a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
}, false); TEX.cellulose.repeat.set(3, 3);
TEX.sarcomere = canvasTex(64, 256, (g, w, h) => {
  g.fillStyle = '#f0c3b6'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#b5555f'; g.fillRect(0, h * .2, w, h * .6);
  g.fillStyle = '#d98a8f'; g.fillRect(0, h * .43, w, h * .14);
  g.fillStyle = '#7a2a35'; g.fillRect(0, h * .495, w, h * .01);
  g.fillStyle = '#4a1a24'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
});

/* ================= materials ================= */
const M = {
  shell: (c, o = .3, x = {}) => new THREE.MeshPhysicalMaterial({ color: c, transparent: true, opacity: o, roughness: .3, metalness: 0, clearcoat: .8, clearcoatRoughness: .3, side: THREE.DoubleSide, depthWrite: false, bumpMap: TEX.bump, bumpScale: .5, ...x }),
  glass: (c, o = .35, x = {}) => new THREE.MeshPhysicalMaterial({ color: c, transparent: true, opacity: o, roughness: .12, clearcoat: 1, clearcoatRoughness: .1, side: THREE.DoubleSide, depthWrite: false, ...x }),
  soft: (c, x = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .5, clearcoat: .3, clearcoatRoughness: .5, sheen: .5, sheenRoughness: .6, sheenColor: new THREE.Color(c).lerp(new THREE.Color(1, 1, 1), .5), ...x }),
  grain: (c, x = {}) => M.soft(c, { bumpMap: TEX.grain, bumpScale: 1.2, ...x }),
  emit: (c, e = .6, x = {}) => M.soft(c, { emissive: c, emissiveIntensity: e, ...x }),
};

/* ================= geometry helpers ================= */
const G = {
  sphere: new THREE.SphereGeometry(1, 32, 24), sphereLo: new THREE.SphereGeometry(1, 12, 8), sphereMid: new THREE.SphereGeometry(1, 20, 14),
  capsule: new THREE.CapsuleGeometry(.5, 1, 8, 20),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  cylLo: new THREE.CylinderGeometry(1, 1, 1, 6),
};
const CLIP_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e4);
const CLIP = [CLIP_PLANE];

class Tube {
  constructor(nSeg, nRad, mat) {
    this.n = nSeg; this.m = nRad;
    const vc = (nSeg + 1) * nRad; this.pos = new Float32Array(vc * 3);
    const uv = new Float32Array(vc * 2), idx = [];
    for (let i = 0; i <= nSeg; i++) for (let j = 0; j < nRad; j++) { uv[(i * nRad + j) * 2] = j / nRad; uv[(i * nRad + j) * 2 + 1] = i / nSeg; }
    for (let i = 0; i < nSeg; i++) for (let j = 0; j < nRad; j++) { const a = i * nRad + j, b = i * nRad + (j + 1) % nRad, c = (i + 1) * nRad + j, d = (i + 1) * nRad + (j + 1) % nRad; idx.push(a, b, c, b, d, c); }
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false;
    this._T = V(); this._N = V(); this._B = V();
  }
  update(pts, rf) {
    const { n, m, pos } = this, T = this._T, N = this._N, B = this._B;
    for (let i = 0; i <= n; i++) {
      const p = pts[i], a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n)];
      T.subVectors(b, a).normalize();
      if (i === 0) { N.set(0, 1, 0); if (Math.abs(T.y) > .9) N.set(1, 0, 0); }
      N.addScaledVector(T, -N.dot(T)).normalize(); B.crossVectors(T, N);
      const r = rf(i / n);
      for (let j = 0; j < m; j++) {
        const th = j / m * TAU, c = Math.cos(th) * r, s = Math.sin(th) * r, k = (i * m + j) * 3;
        pos[k] = p.x + N.x * c + B.x * s; pos[k + 1] = p.y + N.y * c + B.y * s; pos[k + 2] = p.z + N.z * c + B.z * s;
      }
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
    return this;
  }
}
function tubeCurve(curve, nSeg, nRad, rf, mat) { const t = new Tube(nSeg, nRad, mat); t.update(curve.getPoints(nSeg), typeof rf === 'number' ? () => rf : rf); return t.mesh; }
function tubePts(pts, nRad, rf, mat) { const t = new Tube(pts.length - 1, nRad, mat); t.update(pts, typeof rf === 'number' ? () => rf : rf); return t.mesh; }
function line(a, b, r, mat, seg = 6) { const m = new THREE.Mesh(G.cylLo, mat); const d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, .5); m.scale.set(r, d.length(), r); m.quaternion.copy(qFromUp(d)); return m; }

/* flagellum helper: eukaryotic planar wave or bacterial helix */
class Flag {
  constructor(mat, { n = 40, rad = 6, r0 = .03, r1 = .012 } = {}) { this.tube = new Tube(n, rad, mat); this.n = n; this.r0 = r0; this.r1 = r1; this.pts = Array.from({ length: n + 1 }, () => V()); this.mesh = this.tube.mesh; }
  wave(o, dir, side, len, amp, k, w, t, grow = .7) {
    const up = V().crossVectors(dir, side).normalize();
    for (let i = 0; i <= this.n; i++) { const s = i / this.n, a = amp * Math.pow(s, grow) * Math.sin(k * s * len - w * t), b = amp * .5 * Math.pow(s, grow) * Math.cos(k * s * len - w * t); this.pts[i].copy(o).addScaledVector(dir, s * len).addScaledVector(side, a).addScaledVector(up, b); }
    this.tube.update(this.pts, s => lerp(this.r0, this.r1, s));
  }
  helix(o, dir, side, len, amp, pitch, phase, ramp = .25) {
    const up = V().crossVectors(dir, side).normalize();
    for (let i = 0; i <= this.n; i++) { const s = i / this.n, a = amp * Math.min(1, s / ramp) * Math.cos(TAU * s * len / pitch + phase), b = amp * Math.min(1, s / ramp) * Math.sin(TAU * s * len / pitch + phase); this.pts[i].copy(o).addScaledVector(dir, s * len).addScaledVector(side, a).addScaledVector(up, b); }
    this.tube.update(this.pts, s => lerp(this.r0, this.r1, s));
  }
}
const _o = new THREE.Object3D();
function inst(geo, mat, n) { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; return m; }
function setI(m, i, p, q, s = 1) { _o.position.copy(p); q ? _o.quaternion.copy(q) : _o.quaternion.identity(); typeof s === 'number' ? _o.scale.setScalar(s) : _o.scale.copy(s); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); }
function perpBasis(d) { const a = Math.abs(d.y) > .9 ? V(1, 0, 0) : V(0, 1, 0); const s = V().crossVectors(d, a).normalize(); return s; }

/* ================= specimen container ================= */
class Spec {
  constructor(def) { this.def = def; this.group = new THREE.Group(); this.parts = []; this.anims = []; this.cutMats = []; this.hasCut = false; }
  add(o, parent) { (parent || this.group).add(o); return o; }
  mesh(geo, mat, o = {}) {
    const m = new THREE.Mesh(geo, mat);
    if (o.p) m.position.copy(o.p); if (o.r) m.rotation.set(...o.r);
    if (o.s !== undefined) typeof o.s === 'number' ? m.scale.setScalar(o.s) : m.scale.copy(o.s);
    if (o.ro !== undefined) m.renderOrder = o.ro;
    if (o.parent !== false) (o.parent || this.group).add(m);
    return m;
  }
  part(name, desc, objs, { shell = false } = {}) {
    const p = { id: this.parts.length, name, desc, shell, meshes: [] };
    [].concat(objs).forEach(o => o.traverse(c => { if (c.isMesh) { c.userData.part = p; p.meshes.push(c); } }));
    this.parts.push(p); return p;
  }
  cut(...mats) { mats.forEach(m => { if (!m.clippingPlanes) { m.clippingPlanes = CLIP; this.cutMats.push(m); } }); this.hasCut = true; }
  anim(f) { this.anims.push(f); }
}

/* ================= shared organelle factories ================= */
function mitoMats() { return { o: M.shell(0xd98a5f, .42, { bumpScale: .2 }), i: M.soft(0xb4573a, { transparent: true, opacity: .9 }) }; }
function mitochondrion(mm, sc = 1) {
  const g = new THREE.Group();
  const o = new THREE.Mesh(G.capsule, mm.o); o.scale.set(.32, .34, .32); o.renderOrder = 4; g.add(o);
  const i = new THREE.Mesh(G.capsule, mm.i); i.scale.set(.2, .22, .2); g.add(i);
  for (let k = 0; k < 5; k++) { const c = new THREE.Mesh(G.cyl, mm.i); c.scale.set(.1, .012, .1); c.position.y = (k - 2) * .06; g.add(c); }
  g.scale.setScalar(sc); return g;
}
function bendGeo(g, bend) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, p.getY(i) + bend * x * x); } g.computeVertexNormals(); return g; }
function golgi(mat, vmat, sc = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) { const geo = bendGeo(new THREE.SphereGeometry(1, 24, 10), -.5); const m = new THREE.Mesh(geo, mat); const w = 1 - i * .06; m.scale.set(.5 * w, .035, .3 * w); m.position.y = (i - 2.5) * .085; g.add(m); }
  const R = rng(3);
  for (let i = 0; i < 9; i++) { const v = new THREE.Mesh(G.sphereLo, vmat); const a = R() * TAU; v.scale.setScalar(.035 + R() * .02); v.position.set(Math.cos(a) * .62, (R() - .5) * .5, Math.sin(a) * .3); g.add(v); }
  g.scale.setScalar(sc); return g;
}
function nuclearPores(n, r, mat, R) {
  const m = inst(new THREE.TorusGeometry(.025, .007, 6, 12), mat, n), pts = fib(n);
  pts.forEach((p, i) => { setI(m, i, p.clone().multiplyScalar(r), qFromUp(p).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)))); }); return m;
}
function ribosomeCloud(n, sample, mat, size = .016, seed = 9) {
  const R = rng(seed), m = inst(G.sphereLo, mat, n);
  for (let i = 0; i < n; i++) setI(m, i, sample(R), null, size * (.8 + R() * .5));
  return m;
}
