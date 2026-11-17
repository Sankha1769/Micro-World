/**
 * Specimens: moulds.
 *
 * Specimen builders: aspergillus, penicillium.
 */

import * as THREE from 'three';
import {
  sharedGeometries,
  createInstancedMesh,
  perpendicularDirection,
  setInstanceTransform,
  createTubeAlongCurve,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import {
  TAU,
  vec3,
  vec2,
  fractalNoise3D,
  fibonacciSphere,
  lerp,
  valueNoise3D,
  quaternionFromUp,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';
import { textureLibrary } from '../engine/textures.js';
import { ADDITIONAL_BUILDERS, ADDITIONAL_SPECIMENS, latheBody } from './shared-helpers.js';

/* ================= F5: fungi - yeast, Aspergillus, Penicillium, Rhizopus, Candida ================= */
const f5q = new THREE.Quaternion();

/* rotate d by ang about an axis perpendicular to d at azimuth az */
const cone = (d, ang, az) => {
  const s = perpendicularDirection(d);
  const t = vec3().crossVectors(d, s);
  const ax = s.multiplyScalar(Math.cos(az)).addScaledVector(t, Math.sin(az));
  return d.clone().applyAxisAngle(ax, ang).normalize();
};
/* rough (warty) sphere for spores */
function roughSurface(seed, amp, w = 10, h = 8, ridge = 0) {
  const g = new THREE.SphereGeometry(1, w, h);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const n =
      fractalNoise3D(x * 2.6 + seed, y * 2.6 + seed * 0.7, z * 2.6 + seed * 0.3) +
      ridge * Math.max(0, valueNoise3D(x * 5 + seed, y * 5, z * 5 - seed));
    const r = 1 + amp * n;
    p.setXYZ(i, x * r, y * r, z * r);
  }
  g.computeVertexNormals();
  return g;
}
const lathe = (radiusAt, nU = 14, segmentCount = 10) => {
  const g = latheBody(1, radiusAt, nU, segmentCount);
  g.translate(0, 0.5, 0);
  return g;
};
const gMet = lathe(
  (u) => (0.6 + 0.4 * u) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (u - 0.86) / 0.14), 2))),
  14,
  10,
);
const gPhi = lathe(
  (u) => {
    if (u < 0.45) {
      return 0.22 + 0.28 * Math.sin(((u / 0.45) * Math.PI) / 2);
    }
    if (u < 0.82) {
      return lerp(0.5, 0.15, smoothStep(0.45, 0.82, u));
    }
    return (0.15 + (u > 0.94 ? 0.04 : 0)) * (u > 0.985 ? 0.6 : 1);
  },
  22,
  10,
);
const gSeg = (() => {
  const g = new THREE.CylinderGeometry(0.8, 1, 1, 8, 1);
  g.translate(0, 0.5, 0);
  return g;
})();
const gSept = new THREE.LatheGeometry(
  [vec2(0.12, -0.5), vec2(1, -0.5), vec2(1, 0.5), vec2(0.12, 0.5), vec2(0.12, -0.5)],
  16,
);
const gRing = new THREE.TorusGeometry(1, 0.09, 6, 18);
const f5Z = vec3(0, 0, 1);
/* instanced oriented items [{b,d,L,r}] */
function placeItems(specimen, geometry, material, items, parent) {
  const m = createInstancedMesh(geometry, material, items.length);
  items.forEach((o, i) =>
    setInstanceTransform(m, i, o.b, quaternionFromUp(o.d), vec3(o.r, o.L, o.r)),
  );
  specimen.add(m, parent);
  return m;
}
/* chains of spores that are born at the base, travel outward and drop away at the tip */
function placeChains(specimen, material, geometry, bases, dirs, o = {}) {
  const { count = 8, r = 0.08, gap = 2.1, speed = 0.05, sway = 0.1, seed = 3, parent = null } = o;
  const nC = bases.length;
  const n = nC * count;
  const mesh = createInstancedMesh(geometry, material, n);
  const random = createSeededRandom(seed);
  const off = [];
  const perp = [];
  const ph = [];
  const rot = [];
  for (let i = 0; i < nC; i++) {
    off.push(random());
    perp.push(perpendicularDirection(dirs[i]).applyAxisAngle(dirs[i], random() * TAU));
    ph.push(random() * TAU);
  }
  for (let k = 0; k < n; k++) {
    rot.push(
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(random() * 6, random() * 6, random() * 6),
      ),
    );
  }
  const len = r * gap * count;
  const p = vec3();
  const upd = (t) => {
    let k = 0;
    for (let i = 0; i < nC; i++) {
      const f = (t * speed + off[i]) % 1;
      const b = bases[i];
      const d = dirs[i];
      const pp = perp[i];
      const w = Math.sin(t * 0.9 + ph[i]) * sway * len;
      for (let j = 0; j < count; j++, k++) {
        const m = j + f;
        const q = m / count;
        const sc = smoothStep(0, 1.2, m) * (1 - smoothStep(count - 1.3, count, m));
        p.copy(b)
          .addScaledVector(d, m * r * gap)
          .addScaledVector(pp, w * q * q);
        setInstanceTransform(mesh, k, p, rot[k], r * sc);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0);
  specimen.anim(upd);
  specimen.add(mesh, parent);
  return mesh;
}
/* a hypha: tube along a curve with optional septa (discs with a pore + rings) and closed end caps */
export function buildHypha(specimen, parent, points, r, material, o = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const len = curve.getLength();
  const mesh = createTubeAlongCurve(
    curve,
    o.seg || Math.max(24, Math.round(len * 14)),
    12,
    o.rf || r,
    material,
  );
  mesh.renderOrder = o.ro || 8;
  parent.add(mesh);
  const caps = [];
  o.rf ? o.rf(0) : r;
  [0, 1].forEach((e) => {
    if (o.cap === false && e === 1) {
      return;
    }
    const c = new THREE.Mesh(sharedGeometries.sphereMid, material);
    c.scale.setScalar((o.rf ? o.rf(e) : r) * 1.0);
    c.position.copy(curve.getPointAt(e));
    c.renderOrder = o.ro || 8;
    parent.add(c);
    caps.push(c);
  });
  const sep = [];
  if (o.septa) {
    const us = [];
    for (let d = o.s0 === undefined ? o.septa * 0.6 : o.s0; d < len * 0.97; d += o.septa) {
      us.push(d / len);
    }
    const sd = createInstancedMesh(gSept, o.sMat, us.length);
    const sr = createInstancedMesh(gRing, o.sMat, us.length);
    us.forEach((u, i) => {
      const p = curve.getPointAt(u);
      const tg = curve.getTangentAt(u);
      const rad = o.rf ? o.rf(u) : r;
      setInstanceTransform(sd, i, p, quaternionFromUp(tg), vec3(rad * 0.96, 0.035, rad * 0.96));
      setInstanceTransform(sr, i, p, f5q.clone().setFromUnitVectors(f5Z, tg), rad * 1.0);
    });
    parent.add(sd, sr);
    sep.push(sd, sr);
  }
  return { mesh, curve, caps, sep, all: [mesh, ...caps], len };
}
const sway =
  (g, a, b, ax = 0.02) =>
  (t) => {
    g.rotation.y = Math.sin(t * 0.13 + a) * b;
    g.rotation.z = Math.sin(t * 0.21 + a) * ax;
    g.rotation.x = Math.sin(t * 0.17 + a * 2) * ax;
  };

/* ---------- Aspergillus ---------- */
function buildAsperg(specimen) {
  const random = createSeededRandom(11);
  const group = new THREE.Group();
  specimen.add(group);
  group.position.y = -0.2;
  const mHy = materialFactory.shell(0xe6d6ae, 0.5, { bumpScale: 0.15, roughness: 0.45 });
  const mStipe = materialFactory.soft(0xe4d6b0, { roughness: 0.5 });
  const mVes = materialFactory.soft(0xd6c78f, { bumpMap: textureLibrary.grain, bumpScale: 0.6 });
  const mMet = materialFactory.soft(0xc4b87a);
  const mPhi = materialFactory.soft(0xa9a85a);
  const mCon = materialFactory.grain(0x586a26, { roughness: 0.6, bumpScale: 2 });
  const mFoot = materialFactory.soft(0xc9b678, { roughness: 0.5 });
  const mSep = materialFactory.soft(0xa68f58);
  const yh = -3.3;
  const hy = buildHypha(
    specimen,
    group,
    [
      vec3(-3.9, yh, 0.3),
      vec3(-2.6, yh + 0.1, 0.1),
      vec3(-1.1, yh, 0),
      vec3(1.1, yh + 0.05, 0),
      vec3(2.6, yh - 0.1, -0.15),
      vec3(4, yh + 0.05, -0.3),
    ],
    0.17,
    mHy,
    { septa: 1.0, s0: 0.4, sMat: mSep },
  );
  const br1 = buildHypha(
    specimen,
    group,
    [
      vec3(-2.3, yh + 0.1, 0.1),
      vec3(-2.6, yh + 0.9, 0.2),
      vec3(-3.3, yh + 1.5, 0.5),
      vec3(-3.9, yh + 2.1, 0.4),
    ],
    0.13,
    mHy,
    { septa: 0.85, s0: 0.5, sMat: mSep },
  );
  const br2 = buildHypha(
    specimen,
    group,
    [vec3(2.0, yh - 0.05, -0.1), vec3(2.6, yh + 0.7, 0.1), vec3(3.0, yh + 1.5, 0.3)],
    0.12,
    mHy,
    { septa: 0.8, s0: 0.5, sMat: mSep },
  );
  const br3 = buildHypha(
    specimen,
    group,
    [vec3(0.9, yh + 0.02, 0), vec3(1.4, yh - 0.5, 0.3), vec3(1.6, yh - 0.9, 0.5)],
    0.11,
    mHy,
    { septa: 0.5, s0: 0.35, sMat: mSep },
  );
  const footG = new THREE.CapsuleGeometry(0.27, 1.0, 6, 18);
  footG.rotateZ(Math.PI / 2);
  const foot = specimen.mesh(footG, mFoot, { p: vec3(0, yh + 0.02, 0), parent: group });
  const sc = new THREE.CatmullRomCurve3([
    vec3(0, yh + 0.1, 0),
    vec3(0.1, -2.1, 0.06),
    vec3(-0.05, -0.9, -0.04),
    vec3(0.02, 0.1, 0),
  ]);
  const stipe = createTubeAlongCurve(sc, 40, 12, (s) => 0.12 + 0.035 * s, mStipe);
  group.add(stipe);
  const vc = vec3(0, 0.85, 0);
  const vr = 0.78;
  const ves = specimen.mesh(new THREE.SphereGeometry(1, 48, 32), mVes, {
    p: vc,
    s: vr,
    parent: group,
  });
  const dirs = fibonacciSphere(52).filter((d) => d.y > -0.5);
  const met = [];
  const phi = [];
  const cb = [];
  const cd = [];
  dirs.forEach((d) => {
    const b = vc.clone().addScaledVector(d, vr * 0.97);
    const ml = 0.36;
    const tip = b.clone().addScaledVector(d, ml * 0.95);
    met.push({ b, d, L: ml, r: 0.085 });
    const az = random() * TAU;
    [-1, 1].forEach((sg) => {
      const dp = cone(d, 0.42 * sg, az);
      const pl = 0.36;
      const pt = tip.clone().addScaledVector(dp, pl * 0.97);
      phi.push({ b: tip, d: dp, L: pl, r: 0.1 });
      cb.push(pt);
      cd.push(dp.clone().lerp(d, 0.35).normalize());
    });
  });
  const metM = placeItems(specimen, gMet, mMet, met, group);
  const phiM = placeItems(specimen, gPhi, mPhi, phi, group);
  const conG = roughSurface(3, 0.22, 9, 7, 0.5);
  const con = placeChains(specimen, mCon, conG, cb, cd, {
    count: 8,
    r: 0.082,
    gap: 2.1,
    speed: 0.045,
    sway: 0.07,
    seed: 8,
    parent: group,
  });
  specimen.part(
    'Conidia',
    'Round, dark olive spores with a rough, warty wall, about 2–4 µm across. They form in long dry chains with the youngest at the base, and each phialide keeps adding new ones. The rough pigmented wall protects the spore from UV light and drying, and helps it ride the air.',
    con,
  );
  specimen.part(
    'Phialides',
    'Flask-shaped cells that sit on the metulae. Each one makes conidia by budding from its narrow tip, so the chain grows from the base, not from the end. The phialide itself does not get shorter as it makes hundreds of spores.',
    phiM,
  );
  specimen.part(
    'Metulae',
    'A first layer of short, club-shaped cells on the vesicle that carry the phialides. Species with both metulae and phialides are called biseriate (two series), as shown here. Species with phialides alone are uniseriate.',
    metM,
  );
  specimen.part(
    'Vesicle',
    'The swollen tip of the stipe. Its surface is covered with metulae in all directions, which gives the head a round, radiate look that gave the genus its name, after the aspergillum used to sprinkle holy water.',
    ves,
  );
  specimen.part(
    'Stipe',
    'The long, upright stalk of the conidiophore. It is a single thick-walled cell with no cross walls, and it lifts the spore head up into the moving air.',
    stipe,
  );
  specimen.part(
    'Foot cell',
    'A thick-walled, swollen hyphal cell. It anchors the conidiophore, and the stipe grows up from it at an angle to the supporting hypha.',
    foot,
  );
  specimen.part(
    'Septate hyphae',
    'Fine tubes divided by cross walls (septa), each with a central pore that lets cytoplasm and nuclei pass. Side branches form near the base, and together the hyphae make up the mycelium that feeds on the substrate.',
    [...hy.all, ...br1.all, ...br2.all, ...br3.all, ...hy.sep, ...br1.sep, ...br2.sep, ...br3.sep],
    { shell: true },
  );
  const sw = sway(group, 1.3, 0.28, 0.015);
  specimen.anim((t) => {
    sw(t);
    group.position.y = -0.2 + Math.sin(t * 0.35) * 0.05;
  });
}
ADDITIONAL_BUILDERS.aspergillus = buildAsperg;
ADDITIONAL_SPECIMENS.push({
  id: 'aspergillus',
  cat: 'fungi',
  name: 'Aspergillus',
  latin: 'Aspergillus niger (conidiophore)',
  size: 'conidium 3–5 µm; conidiophore 0.5–3 mm tall',
  sizeUm: 3000,
  U: 7.4,
  dist: 16,
  cls: 'Eukaryota · Fungi · Ascomycota · Eurotiomycetes',
  habitat: 'Soil, decaying plants, stored food, and indoor air worldwide',
  move: 'Non-motile; hyphae extend at their tips and spores travel on air currents',
  feed: 'Absorbs nutrients: digests food outside the cell with secreted enzymes',
  repro:
    'Asexual: chains of conidia from phialides on the vesicle; some species also reproduce sexually',
  desc: 'The spore-bearing head of a mould. A tall stalk rises from a foot cell on a septate hypha and ends in a round vesicle covered with metulae and flask-shaped phialides, which shed long chains of rough olive spores.',
  fun: [
    "Aspergillus niger is used industrially to make most of the world's citric acid.",
    'One conidiophore can release many thousands of spores, and the spores are in almost every breath of indoor and outdoor air.',
    'Aspergillus oryzae is used to make soy sauce, miso and sake.',
    'Aspergillus fumigatus can cause serious lung infections in people with weakened immunity.',
  ],
  note: 'Cell sizes follow real proportions, but a real head carries many more chains than are shown and the spores are about a thousand times smaller than the stalk is long, so the head is drawn large. The spore colour is artistic: A. niger spores are nearly black and A. fumigatus spores are grey-green.',
});

/* ---------- Penicillium ---------- */
function buildPenic(specimen) {
  const random = createSeededRandom(23);
  const group = new THREE.Group();
  specimen.add(group);
  group.position.y = 0.55;
  const mHy = materialFactory.shell(0xe9dfc2, 0.5, { bumpScale: 0.15, roughness: 0.45 });
  const mStipe = materialFactory.soft(0xe9dfc2, { roughness: 0.5 });
  const mRam = materialFactory.soft(0xdcd1aa);
  const mMet = materialFactory.soft(0xc9c48f);
  const mPhi = materialFactory.soft(0xb0b878);
  const mCon = materialFactory.grain(0x7d9a72, { roughness: 0.6, bumpScale: 1.2 });
  const mSep = materialFactory.soft(0xa99262);
  const yh = -3.3;
  const B = { ram: [], met: [], phi: [], cb: [], cd: [], cb2: [], cd2: [] };
  function head(base, up, sc, nR, cbA, cdA) {
    for (let a = 0; a < nR; a++) {
      const d = cone(up, 0.5 + random() * 0.15, (a / nR) * TAU + random() * 0.4);
      const rl = 0.62 * sc;
      const rt = base.clone().addScaledVector(d, rl);
      B.ram.push({ b: base, d, L: rl, r: 0.075 * sc });
      for (let m = 0; m < 3; m++) {
        const dm = cone(d, 0.42 + random() * 0.1, (m / 3) * TAU + a);
        const ml = 0.5 * sc;
        const mt = rt.clone().addScaledVector(dm, ml);
        B.met.push({ b: rt, d: dm, L: ml, r: 0.06 * sc });
        for (let p = 0; p < 5; p++) {
          const dp = cone(dm, 0.4 + random() * 0.12, (p / 5) * TAU + random() * 0.5);
          const pl = 0.3 * sc;
          B.phi.push({ b: mt, d: dp, L: pl, r: 0.09 * sc });
          cbA.push(mt.clone().addScaledVector(dp, pl * 0.97));
          cdA.push(dp.clone().lerp(up, 0.45).normalize());
        }
      }
    }
  }
  const b1 = vec3(-0.5, 0, 0);
  const b2 = vec3(2.9, -1.3, 0.1);
  head(b1, vec3(0.05, 1, 0).normalize(), 1, 4, B.cb, B.cd);
  head(b2, vec3(0.2, 1, 0).normalize(), 0.62, 3, B.cb2, B.cd2);
  const hy = buildHypha(
    specimen,
    group,
    [
      vec3(-4, yh + 0.05, 0.3),
      vec3(-2.4, yh + 0.1, 0.1),
      vec3(-0.5, yh, 0),
      vec3(1.4, yh + 0.05, 0),
      vec3(2.9, yh - 0.05, 0.05),
      vec3(4.2, yh + 0.1, -0.2),
    ],
    0.17,
    mHy,
    { septa: 1.0, s0: 0.5, sMat: mSep },
  );
  const br1 = buildHypha(
    specimen,
    group,
    [
      vec3(-1.8, yh + 0.08, 0.1),
      vec3(-2.3, yh + 0.8, 0.3),
      vec3(-3.0, yh + 1.4, 0.4),
      vec3(-3.6, yh + 2.2, 0.3),
    ],
    0.13,
    mHy,
    { septa: 0.8, s0: 0.5, sMat: mSep },
  );
  const br2 = buildHypha(
    specimen,
    group,
    [vec3(1.0, yh + 0.03, 0), vec3(1.5, yh - 0.5, 0.3), vec3(1.9, yh - 0.9, 0.4)],
    0.11,
    mHy,
    { septa: 0.45, s0: 0.3, sMat: mSep },
  );
  const s1 = new THREE.CatmullRomCurve3([
    vec3(-0.5, yh + 0.1, 0),
    vec3(-0.62, -2.2, 0.05),
    vec3(-0.42, -1, -0.04),
    b1.clone(),
  ]);
  const stipe1 = createTubeAlongCurve(s1, 36, 12, (s) => 0.1 - 0.02 * s, mStipe);
  group.add(stipe1);
  const s2 = new THREE.CatmullRomCurve3([
    vec3(2.9, yh + 0.1, 0),
    vec3(2.8, -2.7, 0.05),
    vec3(2.95, -1.9, 0),
    b2.clone(),
  ]);
  const stipe2 = createTubeAlongCurve(s2, 24, 10, (s) => 0.075 - 0.015 * s, mStipe);
  group.add(stipe2);
  const ramM = placeItems(specimen, gSeg, mRam, B.ram, group);
  const metM = placeItems(specimen, gMet, mMet, B.met, group);
  const phiM = placeItems(specimen, gPhi, mPhi, B.phi, group);
  const joints = createInstancedMesh(sharedGeometries.sphereLo, mRam, B.ram.length + 2);
  B.ram.forEach((o, i) =>
    setInstanceTransform(joints, i, o.b.clone().addScaledVector(o.d, o.L), null, o.r * 1.05),
  );
  setInstanceTransform(joints, B.ram.length, b1, null, 0.1);
  setInstanceTransform(joints, B.ram.length + 1, b2, null, 0.075);
  group.add(joints);
  const conG = roughSurface(5, 0.12, 9, 7, 0);
  const con = placeChains(specimen, mCon, conG, B.cb, B.cd, {
    count: 7,
    r: 0.066,
    gap: 2.1,
    speed: 0.05,
    sway: 0.06,
    seed: 4,
    parent: group,
  });
  const con2 = placeChains(specimen, mCon, conG, B.cb2, B.cd2, {
    count: 6,
    r: 0.045,
    gap: 2.1,
    speed: 0.05,
    sway: 0.06,
    seed: 9,
    parent: group,
  });
  specimen.part(
    'Conidia',
    'Small, nearly round, smooth to finely roughened spores 2–3 µm across, in long dry chains with the youngest at the base. They are grey-green in the colony. The chains often stick together in loose columns, which gives the brush its shape.',
    [con, con2],
  );
  specimen.part(
    'Phialides',
    'Flask-shaped cells with a short neck, grouped in a tight bunch of four to six at the tip of each metula. Each phialide buds off one conidium after another through its narrow tip.',
    phiM,
  );
  specimen.part(
    'Metulae',
    'Cells in a ring at the tip of each ramus. Each carries a bunch of phialides. There is no swollen vesicle, which is the main visible difference from Aspergillus.',
    metM,
  );
  specimen.part(
    'Rami',
    'The branches that spread from the top of the stipe. Together with the metulae and phialides they form the brush (penicillus) that gave the genus its name, from the Latin for a paintbrush. This repeatedly branched pattern is called terverticillate.',
    [ramM, joints],
  );
  specimen.part(
    'Stipe',
    'The upright, smooth stalk of the conidiophore, a single hyphal branch that lifts the spore brush away from the colony surface. A second, smaller conidiophore is shown on the right.',
    [stipe1, stipe2],
  );
  specimen.part(
    'Septate hyphae',
    'Branching tubes divided by cross walls (septa) that each have a small central pore. They run through the food and spread the colony outward.',
    [...hy.all, ...br1.all, ...br2.all],
    { shell: true },
  );
  specimen.part(
    'Septa',
    'Each cross wall has a pore that lets cytoplasm and nuclei flow between neighbouring cells. If a hypha is damaged, small Woronin bodies plug the pore, which limits the loss of cytoplasm.',
    [...hy.sep, ...br1.sep, ...br2.sep],
  );
  const sw = sway(group, 0.4, 0.3, 0.015);
  specimen.anim((t) => {
    sw(t);
    group.position.y = 0.55 + Math.sin(t * 0.4) * 0.05;
  });
}
ADDITIONAL_BUILDERS.penicillium = buildPenic;
ADDITIONAL_SPECIMENS.push({
  id: 'penicillium',
  cat: 'fungi',
  name: 'Penicillium',
  latin: 'Penicillium chrysogenum (conidiophore)',
  size: 'conidium 2–4 µm; conidiophore 100–500 µm tall',
  sizeUm: 300,
  U: 7.3,
  dist: 16,
  cls: 'Eukaryota · Fungi · Ascomycota · Eurotiomycetes',
  habitat: 'Soil, decaying fruit and bread, damp buildings, and air',
  move: 'Non-motile; hyphae grow at their tips and spores travel on air currents',
  feed: 'Absorbs nutrients from decaying organic matter after digesting it with secreted enzymes',
  repro: 'Asexual: chains of conidia from phialides; some species also have a sexual stage',
  desc: 'A brush-like mould head. A stalk branches into rami, then metulae, then bunches of flask-shaped phialides that each shed a chain of grey-green spores. It has no swollen vesicle.',
  fun: [
    'In 1928 Alexander Fleming noticed that a Penicillium mould on a culture plate had killed nearby Staphylococcus bacteria, which led to penicillin.',
    "Industrial penicillin comes from strains of P. chrysogenum bred to make far more antibiotic than Fleming's mould.",
    'Other species ripen cheeses such as Camembert, Brie and blue cheese (Penicillium roqueforti).',
    'The name comes from the Latin for a little brush or paintbrush.',
  ],
  note: 'The branching pattern is accurate for a terverticillate species, but real heads carry more phialides and longer chains than are drawn. The second, smaller conidiophore is shown at a younger stage. The grey-green spore colour is artistic.',
});
