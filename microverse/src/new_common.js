/* ================= shared helpers for the expanded library ================= */
const NEW_SPEC = [], NEWBUILD = {};
const UP = V(0, 1, 0), _q1 = new THREE.Quaternion();
G.cilium = (() => { const g = new THREE.CylinderGeometry(.35, 1, 1, 5, 1, true); g.translate(0, .5, 0); return g; })();
G.cone = (() => { const g = new THREE.ConeGeometry(1, 1, 8, 1); g.translate(0, .5, 0); return g; })();
G.disc = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 24); return g; })();
const hexc = c => new THREE.Color(c);

/* body of revolution about Y: radius rf(u), u from 0 (bottom, y = -L/2) to 1 (top) */
function latheBody(L, rf, nU = 56, nSeg = 36) {
  const pts = []; for (let i = 0; i <= nU; i++) { const u = i / nU; pts.push(V2(Math.max(rf(u), .0008), (u - .5) * L)); }
  return new THREE.LatheGeometry(pts, nSeg);
}
/* surface points + outward normals on a lathe body. rows > 0 puts them on meridian rows */
function lathePts(L, rf, n, { u0 = .03, u1 = .97, rows = 0, seed = 5, fx = 1, fz = 1 } = {}) {
  const R = rng(seed), P = [], N = [];
  for (let i = 0; i < n; i++) {
    let u, ph;
    if (rows) { const row = i % rows, k = Math.floor(i / rows), per = Math.ceil(n / rows); u = lerp(u0, u1, (k + .5) / per); ph = row / rows * TAU + (k % 2) * .5 * TAU / rows; }
    else { u = lerp(u0, u1, R()); ph = R() * TAU; }
    const e = .012, ua = Math.max(0, u - e), ub = Math.min(1, u + e), slope = (rf(ub) - rf(ua)) / ((ub - ua) * L), r = rf(u);
    P.push(V(r * Math.cos(ph) * fx, (u - .5) * L, r * Math.sin(ph) * fz));
    N.push(V(Math.cos(ph) / fx, -slope, Math.sin(ph) / fz).normalize());
  }
  return { P, N };
}
/* points on a sphere/ellipsoid */
function spherePts(n, rx, ry = rx, rz = rx) { const P = [], N = []; fib(n).forEach(d => { P.push(V(d.x * rx, d.y * ry, d.z * rz)); N.push(V(d.x / rx, d.y / ry, d.z / rz).normalize()); }); return { P, N }; }

/* a field of beating cilia (instanced). Returns the mesh; animation is registered on S */
function ciliaSet(S, mat, P, N, { len = .12, r = .012, amp = .7, speed = 8, wave = 4, axis = V(0, 1, 0), jit = .3, seed = 3, parent = null } = {}) {
  const n = P.length, mesh = inst(G.cilium, mat, n), R = rng(seed), ph = [], L = [], Tg = [];
  for (let i = 0; i < n; i++) {
    ph.push(R() * TAU * .25 + P[i].dot(axis) * wave); L.push(len * (1 - jit * R()));
    const t = axis.clone().addScaledVector(N[i], -axis.dot(N[i])); if (t.lengthSq() < 1e-4) t.copy(perpBasis(N[i])); Tg.push(t.normalize());
  }
  const sc = V(r, 1, r), d = V();
  const upd = t => {
    for (let i = 0; i < n; i++) { const a = amp * Math.sin(t * speed - ph[i]) + .3 * amp; d.copy(N[i]).multiplyScalar(Math.cos(a)).addScaledVector(Tg[i], Math.sin(a)); sc.y = L[i]; setI(mesh, i, P[i], _q1.setFromUnitVectors(UP, d), sc); }
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0); S.anim(upd); S.add(mesh, parent); return mesh;
}
/* a flagellum-like wave tube between a start point and direction; returns {mesh, update} */
function waveTube(mat, { n = 36, rad = 6, r0 = .03, r1 = .012 } = {}) { return new Flag(mat, { n, rad, r0, r1 }); }

/* chains of spores/beads growing out of base points along directions */
function beadChains(S, mat, bases, dirs, { count = 6, r = .06, gap = 2.05, parent = null, speed = .4, jitter = .15, seed = 4, geo = G.sphereLo } = {}) {
  const n = bases.length * count, mesh = inst(geo, mat, n), R = rng(seed), off = [];
  for (let i = 0; i < bases.length; i++) off.push(R() * 10);
  const q = new THREE.Quaternion(), p = V();
  const upd = t => {
    let k = 0;
    for (let i = 0; i < bases.length; i++) {
      for (let j = 0; j < count; j++, k++) {
        const s = r * gap * (j + .5) + Math.sin(t * speed + off[i] + j * .3) * r * jitter;
        const sc = r * (.55 + .45 * sstep(0, 2, j + 1)) * (j === count - 1 ? .85 + .1 * Math.sin(t * 1.3 + off[i]) : 1);
        p.copy(bases[i]).addScaledVector(dirs[i], s); setI(mesh, k, p, q, sc);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0); S.anim(upd); S.add(mesh, parent); return mesh;
}
/* a straight tapered rod between two points (opaque or shell) */
function rod(a, b, r0, r1, mat, seg = 8) {
  const g = new THREE.CylinderGeometry(r1, r0, 1, seg, 1); g.translate(0, .5, 0);
  const m = new THREE.Mesh(g, mat), d = b.clone().sub(a); m.position.copy(a); m.scale.set(1, d.length(), 1); m.quaternion.copy(qFromUp(d)); return m;
}
/* sample a tube path as an array of points */
const curvePts = (curve, n) => curve.getPoints(n);
/* register a part helper that groups many objects */
const grp = (S, parent) => { const g = new THREE.Group(); S.add(g, parent); return g; };
/* pigment-friendly soft materials for a light background */
const PM = {
  cuticle: (c, o = {}) => M.soft(c, { roughness: .55, clearcoat: .45, ...o }),
  mem: (c, op = .42, o = {}) => M.shell(c, op, { roughness: .35, bumpScale: .25, ...o }),
  dark: (c, o = {}) => M.soft(c, { roughness: .4, clearcoat: .6, ...o }),
};
