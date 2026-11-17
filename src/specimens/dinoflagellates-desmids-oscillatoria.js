/**
 * Specimens: dinoflagellates desmids oscillatoria.
 *
 * Specimen builders: desmid, dinoflagellate, oscillatoria.
 */

import * as THREE from 'three';
import {
  Flagellum,
  sharedGeometries,
  AnimatedTube,
  createInstancedMesh,
  perpendicularDirection,
  setInstanceTransform,
  createTubeAlongCurve,
  createTubeThroughPoints,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import {
  TAU,
  vec3,
  vec2,
  clamp,
  lerp,
  quaternionFromUp,
  randomDirection,
  randomPointInUnitBall,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';
import { createCanvasTexture } from '../engine/textures.js';
import { ADDITIONAL_BUILDERS, ADDITIONAL_SPECIMENS } from './shared-helpers.js';

/* ================= F4: Dinoflagellate, Desmid (Micrasterias), Oscillatoria ================= */
const f4Tmp = vec3();
const tmp2 = vec3();
const f4M1 = new THREE.Matrix4();

const f4Loc = (p, q, s) =>
  new THREE.Matrix4().compose(
    p,
    q || new THREE.Quaternion(),
    typeof s === 'number' ? vec3(s, s, s) : s,
  );
function seam(geometry, nu, np) {
  const n = geometry.attributes.normal;
  const w = np + 1;
  for (let i = 0; i <= nu; i++) {
    const a = i * w;
    const b = i * w + np;
    const x = n.getX(a) + n.getX(b);
    const y = n.getY(a) + n.getY(b);
    const z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }
}
/* grid over (u in [u0,u1], phi in [0,2pi]); fn(u, phi, out) writes a position */
function grid(nu, np, u0, u1, fn) {
  const w = np + 1;
  const pos = new Float32Array((nu + 1) * w * 3);
  const uv = new Float32Array((nu + 1) * w * 2);
  const idx = [];
  const o = vec3();
  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j <= np; j++) {
      const k = i * w + j;
      const u = lerp(u0, u1, i / nu);
      fn(u, (j / np) * TAU, o);
      pos[k * 3] = o.x;
      pos[k * 3 + 1] = o.y;
      pos[k * 3 + 2] = o.z;
      uv[k * 2] = j / np;
      uv[k * 2 + 1] = i / nu;
    }
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < np; j++) {
      const a = i * w + j;
      const b = a + 1;
      const c = a + w;
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  seam(g, nu, np);
  return g;
}

/* ================= 1. Dinoflagellate (Peridinium-type, armoured) ================= */
const F4L = 5.6;
const F4R = 1.5;
const F4FZ = 0.88;
function f4rf(u) {
  if (u < 0.5) {
    return F4R * Math.pow(Math.sin(((Math.PI / 2) * u) / 0.5), 0.55);
  }
  const s = (u - 0.5) / 0.5;
  return (
    F4R * Math.pow(Math.cos((Math.PI / 2) * s), 0.9) +
    0.14 * smoothStep(0.5, 0.92, s) * (1 - smoothStep(0.92, 1, s))
  );
}
function f4r(u, ph) {
  let r = f4rf(u);
  const uc = 0.5 - 0.018 * Math.sin(ph);
  const du = (u - uc) / 0.03;
  r -= 0.3 * Math.exp(-du * du);
  const d = ph - Math.PI / 2;
  r *=
    1 -
    0.34 * Math.exp((-d * d) / 0.04) * smoothStep(0.04, 0.13, u) * (1 - smoothStep(0.5, 0.55, u));
  return Math.max(r, 0.0008);
}
function f4P(u, ph, off, out) {
  const r = f4r(u, ph) + off;
  return out.set(r * Math.cos(ph), (u - 0.5) * F4L, r * Math.sin(ph) * F4FZ);
}
function f4N(u, ph, out) {
  const e = 0.01;
  const s = (f4r(u + e, ph) - f4r(u - e, ph)) / (2 * e * F4L);
  return out.set(Math.cos(ph), -s, Math.sin(ph) / F4FZ).normalize();
}
function plateTex(srgb) {
  return createCanvasTexture(
    1024,
    512,
    (g, w, h) => {
      g.fillStyle = srgb ? '#e9c987' : '#9c9c9c';
      g.fillRect(0, 0, w, h);
      const rows = [
        [0, 0.2, 2],
        [0.2, 0.47, 5],
        [0.47, 0.53, 0],
        [0.53, 0.8, 7],
        [0.8, 1, 4],
      ];
      const random = createSeededRandom(11);
      rows.forEach(([a, b, n], ri) => {
        const y0 = h * (1 - b);
        const y1 = h * (1 - a);
        if (!n) {
          g.fillStyle = srgb ? '#a07a38' : '#555';
          g.fillRect(0, y0, w, y1 - y0);
          return;
        }
        const off = (ri % 2) * 0.5;
        for (let k = 0; k < n; k++) {
          const x0 = ((k + off) / n) * w;
          const x1 = ((k + 1 + off) / n) * w;
          for (const dx of [0, -w, w]) {
            const cx = (x0 + x1) / 2 + dx;
            const grd = g.createRadialGradient(
              cx,
              (y0 + y1) / 2,
              4,
              cx,
              (y0 + y1) / 2,
              (x1 - x0) * 0.7,
            );
            grd.addColorStop(0, srgb ? '#f3dca4' : '#b4b4b4');
            grd.addColorStop(1, srgb ? '#dbb669' : '#888');
            g.fillStyle = grd;
            g.fillRect(x0 + dx, y0, x1 - x0, y1 - y0);
            g.fillStyle = srgb ? 'rgba(150,100,40,.55)' : 'rgba(230,230,230,.75)';
            for (let yy = y0 + 8; yy < y1 - 4; yy += 11) {
              for (let xx = x0 + 8 + (Math.round(yy / 11) % 2) * 5; xx < x1 - 4; xx += 11) {
                g.beginPath();
                g.arc(xx + dx, yy, 1.8, 0, TAU);
                g.fill();
              }
            }
            g.fillStyle = srgb ? '#5a3b12' : '#101010';
            for (let q = 0; q < 3; q++) {
              g.beginPath();
              g.arc(
                cx + (random() - 0.5) * (x1 - x0) * 0.5,
                (y0 + y1) / 2 + (random() - 0.5) * (y1 - y0) * 0.5,
                3.2,
                0,
                TAU,
              );
              g.fill();
            }
          }
        }
        g.strokeStyle = srgb ? '#5b3c14' : '#161616';
        g.lineWidth = 7;
        for (let k = 0; k < n; k++) {
          const x = ((k + off) / n) * w;
          g.beginPath();
          g.moveTo(x, y0);
          g.lineTo(x, y1);
          g.stroke();
        }
      });
      g.strokeStyle = srgb ? '#5b3c14' : '#161616';
      g.lineWidth = 8;
      rows.forEach(([a, b]) => {
        [a, b].forEach((f) => {
          const y = h * (1 - f);
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(w, y);
          g.stroke();
        });
      });
    },
    srgb,
  );
}
function buildDinoflagellate(specimen) {
  const random = createSeededRandom(401);
  const tilt = new THREE.Group();
  tilt.rotation.z = 0.22;
  specimen.add(tilt);
  const cell = new THREE.Group();
  cell.position.y = 0.9;
  tilt.add(cell);
  const colT = plateTex(true);
  const bmpT = plateTex(false);
  colT.repeat.set(1, 1);
  bmpT.repeat.set(1, 1);
  const thecaM = materialFactory.shell(0xffffff, 0.55, {
    map: colT,
    bumpMap: bmpT,
    bumpScale: 3.5,
    roughness: 0.4,
  });
  const theca = new THREE.Mesh(
    grid(120, 96, 0, 1, (u, ph, o) => f4P(u, ph, 0, o)),
    thecaM,
  );
  theca.renderOrder = 10;
  cell.add(theca);
  const spineM = materialFactory.shell(0xdcb56c, 0.55, { bumpScale: 1 });
  const spines = [];
  for (const sx of [-1, 1]) {
    const d = vec3(sx * 0.5, -1, 0).normalize();
    const sp = new THREE.Mesh(sharedGeometries.cone, spineM);
    sp.position.set(sx * 0.27, -2.66, 0);
    sp.scale.set(0.2, 1.3, 0.2);
    sp.quaternion.copy(quaternionFromUp(d));
    sp.renderOrder = 10;
    cell.add(sp);
    spines.push(sp);
  }
  const apex = new THREE.Mesh(sharedGeometries.sphere, spineM);
  apex.scale.set(0.15, 0.15, 0.15);
  apex.position.y = F4L / 2 - 0.02;
  apex.renderOrder = 10;
  cell.add(apex);
  spines.push(apex);
  const cingM = materialFactory.soft(0x6c4a20, { roughness: 0.45 });
  const sulM = materialFactory.soft(0x7a5424, { roughness: 0.45 });
  const cingBand = new THREE.Mesh(
    grid(6, 120, -1, 1, (v, ph, o) => f4P(0.5 - 0.018 * Math.sin(ph) + v * 0.028, ph, 0.012, o)),
    cingM,
  );
  cell.add(cingBand);
  const sulc = new THREE.Mesh(
    grid(40, 8, 0, 1, (k, ph, o) => {
      const u = lerp(0.1, 0.5, k);
      const v = (ph / TAU) * 2 - 1;
      return f4P(
        u,
        Math.PI / 2 + v * 0.2 * (0.6 + 0.4 * Math.sin(Math.PI * clamp((u - 0.1) / 0.4, 0, 1))),
        0.012,
        o,
      );
    }),
    sulM,
  );
  cell.add(sulc);
  /* flagella */
  const tM = materialFactory.soft(0xa8742c, { roughness: 0.4 });
  const lM = materialFactory.soft(0x8a5c20, { roughness: 0.4 });
  const NT = 150;
  const tf = new AnimatedTube(NT, 6, tM);
  tf.mesh.renderOrder = 11;
  cell.add(tf.mesh);
  const tBase = [];
  const tDir = [];
  const tPts = Array.from({ length: NT + 1 }, () => vec3());
  for (let i = 0; i <= NT; i++) {
    const ph = (i / NT) * TAU;
    tBase.push(f4P(0.5 - 0.018 * Math.sin(ph), ph, -0.06, vec3()));
    tDir.push(vec3(Math.cos(ph), 0, Math.sin(ph) / F4FZ).normalize());
  }
  const lf = new Flagellum(lM, { n: 80, rad: 6, r0: 0.05, r1: 0.016 });
  cell.add(lf.mesh);
  const lo = f4P(0.43, Math.PI / 2, -0.05, vec3());
  const ld = vec3(0.1, -1, 0.18).normalize();

  /* nucleus */
  const nucC = vec3(0.05, -0.75, -0.1);
  const nuc = new THREE.Group();
  nuc.position.copy(nucC);
  cell.add(nuc);
  const env = new THREE.Mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0xd8a66a, 0.4, { bumpScale: 0.3 }),
  );
  env.scale.set(0.88, 0.8, 0.82);
  env.renderOrder = 7;
  nuc.add(env);
  const bandT = createCanvasTexture(16, 64, (g, w, h) => {
    for (let y = 0; y < h; y += 8) {
      g.fillStyle = (y / 8) % 2 ? '#c06a8a' : '#6e2c4c';
      g.fillRect(0, y, w, 8);
    }
  });
  bandT.repeat.set(1, 4);
  const chrM = materialFactory.soft(0x8a3a5c, { map: bandT, roughness: 0.45 });
  const chr = new THREE.Group();
  nuc.add(chr);
  for (let i = 0; i < 30; i++) {
    const c = randomPointInUnitBall(random).multiplyScalar(0.55);
    const d = randomDirection(random);
    const points = [];
    for (let k = 0; k < 4; k++) {
      points.push(
        c
          .clone()
          .addScaledVector(d, (k - 1.5) * 0.17)
          .add(randomDirection(random).multiplyScalar(0.07)),
      );
    }
    chr.add(createTubeAlongCurve(new THREE.CatmullRomCurve3(points), 24, 8, 0.05, chrM));
  }
  const nucleolus = new THREE.Mesh(sharedGeometries.sphereMid, materialFactory.soft(0xa85a30));
  nucleolus.scale.setScalar(0.16);
  nucleolus.position.set(0.2, 0.1, 0.12);
  nuc.add(nucleolus);
  /* chloroplasts, droplets, trichocysts */
  const cpN = 170;
  const cp = createInstancedMesh(sharedGeometries.sphereLo, materialFactory.grain(0xa97a24), cpN);

  const pp = vec3();
  const nn = vec3();
  let ci = 0;
  while (ci < cpN) {
    const u = lerp(0.07, 0.93, random());
    const ph = random() * TAU;
    if (Math.abs(u - 0.5) < 0.05 || (u < 0.52 && Math.abs(ph - Math.PI / 2) < 0.45)) {
      continue;
    }
    const rr = f4r(u, ph);
    if (rr < 0.45) {
      continue;
    }
    f4P(u, ph, -0.26 - random() * 0.1, pp);
    if (pp.distanceTo(nucC) < 1.05) {
      continue;
    }
    f4N(u, ph, nn);
    const sc = Math.min(1, rr / 1.1) * (0.8 + random() * 0.4);
    setInstanceTransform(cp, ci++, pp, quaternionFromUp(nn), vec3(0.3 * sc, 0.07, 0.22 * sc));
  }
  cell.add(cp);
  const dN = 16;
  const dr = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.soft(0xe39a2a, { clearcoat: 0.8, roughness: 0.25 }),
    dN,
  );
  for (let i = 0; i < dN; i++) {
    const u = lerp(0.1, 0.85, random());
    const ph = random() * TAU;
    if (Math.abs(u - 0.5) < 0.08) {
      i--;
      continue;
    }
    f4P(u, ph, -0.55 - random() * 0.15, pp);
    if (pp.distanceTo(nucC) < 1.1) {
      i--;
      continue;
    }
    setInstanceTransform(dr, i, pp, null, 0.09 + random() * 0.09);
  }
  cell.add(dr);
  specimen.part(
    'Thecal plates (armour)',
    'Under the outer membrane lie flat vesicles that each hold a plate of cellulose. Together the plates form the armour, called the theca, and their joins (sutures) are the lines you see. The number and layout of the plates is the main way armoured dinoflagellates are told apart.',
    [theca, ...spines],
    { shell: true },
  );
  specimen.part(
    'Cingulum and sulcus (grooves)',
    'The cingulum is the groove that runs around the middle of the cell and divides the upper half (epicone) from the lower half (hypocone). The sulcus is a second groove that runs from the cingulum down the underside; the flagella leave the cell from pores where they meet.',
    [cingBand, sulc],
  );
  specimen.part(
    'Transverse flagellum',
    'A ribbon-like flagellum that lies in the cingulum and wraps most of the way around the cell. Its wave pushes the cell forward and, because the wave runs round the body, makes the cell spin as it swims.',
    tf.mesh,
  );
  specimen.part(
    'Longitudinal flagellum',
    'A trailing flagellum that leaves from the sulcus and extends behind the cell. It beats with a wave and acts mainly as a rudder and brake, steering the cell as the transverse flagellum drives it.',
    lf.mesh,
  );
  specimen.part(
    'Nuclear envelope',
    'The envelope of the dinokaryon, the nucleus of a dinoflagellate. This nucleus is large and often sits in the lower half of the cell. It is a double membrane with pores, as in other eukaryotes.',
    env,
    { shell: true },
  );
  specimen.part(
    'Condensed chromosomes',
    'Dinoflagellate chromosomes stay condensed as thick banded rods through the whole cell cycle, a feature almost unique among eukaryotes. They carry very little histone protein and their DNA is held by other proteins. The nucleolus (rust sphere) makes ribosomes.',
    [chr, nucleolus],
  );
  specimen.part(
    'Chloroplasts',
    'Many golden-brown chloroplasts line the cell. They contain chlorophyll a and c and the carotenoid peridinin, which gives the colour and lets the cell use blue-green light. Each is surrounded by three membranes, a sign of their origin from an engulfed alga.',
    cp,
  );
  specimen.part(
    'Oil and starch droplets',
    'Carbon fixed by photosynthesis is stored as starch and as oil droplets. Dinoflagellates use these reserves for energy when light is poor and to build cysts.',
    dr,
  );

  specimen.anim((t) => {
    cell.rotation.y = t * 2.2;
    tilt.rotation.x = 0.12 * Math.sin(t * 0.8);
    cell.position.y = 0.9 + 0.08 * Math.sin(t * 1.9);
    for (let i = 0; i <= NT; i++) {
      const ph = (i / NT) * TAU;
      const a = 0.06 + 0.07 * (0.5 + 0.5 * Math.sin(6 * ph - t * 17));
      const b = 0.09 * Math.sin(8 * ph - t * 15);
      tPts[i].copy(tBase[i]).addScaledVector(tDir[i], a);
      tPts[i].y += b;
    }
    tf.update(tPts, (s) => 0.032 + 0.006 * Math.sin(s * 40));
    lf.wave(lo, ld, perpendicularDirection(ld), 4.0, 0.55, 2.6, 13, t, 0.8);
  });
}
ADDITIONAL_BUILDERS.dinoflagellate = buildDinoflagellate;
ADDITIONAL_SPECIMENS.push({
  id: 'dinoflagellate',
  cat: 'algae',
  name: 'Dinoflagellate',
  latin: 'Peridinium-type armoured dinoflagellate',
  size: 'about 30–60 µm long',
  sizeUm: 45,
  U: 8.2,
  dist: 17,
  cls: 'Eukaryota · SAR · Alveolata · Dinoflagellata',
  habitat: 'Plankton of lakes, ponds and the sea; some species form blooms',
  move: 'Swims by two flagella, spinning as it goes; the transverse flagellum drives and the longitudinal one steers',
  feed: 'Mixotroph: photosynthesis with golden-brown chloroplasts; many species also take in prey',
  repro:
    'Mostly asexual binary fission; sexual stages produce resting cysts that survive harsh seasons',
  desc: 'An armoured cell with a hard cellulose theca, a groove around its middle holding a ribbon flagellum, and a trailing flagellum behind. Inside are a large nucleus with always-condensed chromosomes and golden-brown chloroplasts.',
  fun: [
    'The name comes from the Greek dinos, whirling, because the cells spin as they swim.',
    'Their chromosomes stay condensed through the entire cell cycle, which is almost unique among eukaryotes.',
    'Some species cause red tides, and a few make toxins that build up in shellfish.',
    'Other species glow blue when disturbed, which makes sea water sparkle at night.',
  ],
  note: 'The overall form and plate rows follow armoured genera such as Peridinium; the exact plate number and layout here are simplified. The spin rate and flagellar waves are slowed for viewing. Chloroplasts and chromosomes are shown in smaller numbers than in a real cell, and colours are artistic.',
});

/* ================= 2. Desmid (Micrasterias) ================= */
function f4Dg(psi) {
  const a = Math.abs(psi);
  const tooth = 1 - 0.07 * Math.abs(Math.sin(a * 17));
  const n1 = Math.exp(-(((a - 0.62) / 0.055) ** 2));
  const n0 = Math.exp(-((a / 0.06) ** 2));
  const n2 = Math.exp(-(((a - 1.24) / 0.06) ** 2));
  const n3 = Math.exp(-(((a - 0.31) / 0.045) ** 2)) + Math.exp(-(((a - 0.93) / 0.045) ** 2));
  const r = (0.97 - 0.5 * n1 - 0.24 * n0 - 0.2 * n2 - 0.12 * n3) * tooth;
  const w = smoothStep(1.568, 1.4, a);
  return 0.14 + (r - 0.14) * w;
}
const F4DN = 1440;
const F4D = (() => {
  const t = new Float32Array(F4DN + 1);
  for (let i = 0; i <= F4DN; i++) {
    const angle = -Math.PI + (i / F4DN) * TAU;
    const psi = Math.abs(angle) <= Math.PI / 2 ? angle : Math.sign(angle) * Math.PI - angle;
    t[i] = f4Dg(psi);
  }
  return t;
})();
function f4Dr(angle) {
  let x = ((angle + Math.PI) / TAU) * F4DN;
  x -= Math.floor(x / F4DN) * F4DN;
  const i = Math.floor(x);
  return lerp(F4D[i], F4D[i + 1], x - i);
}
const f4Dt = (x, R, Tm) => Tm * (0.4 + 0.6 * smoothStep(0, 0.4 * R, Math.abs(x)));
function desmidGeo(R, Tm, sc, tsc, e, xc, nA = 44, nT = 288) {
  const w = nT + 1;
  const pos = new Float32Array((nA + 1) * w * 3);
  const uv = new Float32Array((nA + 1) * w * 2);
  const idx = [];
  for (let i = 0; i <= nA; i++) {
    const a = (i / nA) * Math.PI;
    const sa = Math.sin(a);
    const ca = Math.cos(a);
    const rho = Math.pow(sa, e);
    const zf = Math.sign(ca) * Math.pow(Math.abs(ca), e);
    for (let j = 0; j <= nT; j++) {
      const angle = -Math.PI + (j / nT) * TAU;
      const r = f4Dr(angle) * R * sc * rho;
      let x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      if (xc !== null && x < xc) {
        x = xc;
      }
      const k = i * w + j;
      pos[k * 3] = x;
      pos[k * 3 + 1] = y;
      pos[k * 3 + 2] = zf * f4Dt(x, R, Tm) * tsc;
      uv[k * 2] = j / nT;
      uv[k * 2 + 1] = i / nA;
    }
  }
  for (let i = 0; i < nA; i++) {
    for (let j = 0; j < nT; j++) {
      const a = i * w + j;
      const b = a + 1;
      const c = a + w;
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  seam(g, nA, nT);
  return g;
}
function buildDesmid(specimen) {
  const random = createSeededRandom(402);
  const Rc = 3.6;
  const Tm = 0.78;
  const E = 0.6;
  const root = new THREE.Group();
  specimen.add(root);
  const wall = new THREE.Mesh(
    desmidGeo(Rc, Tm, 1, 1, E, null),
    materialFactory.shell(0xcfc77c, 0.42, { bumpScale: 0.5 }),
  );
  wall.renderOrder = 10;
  root.add(wall);
  const rimPts = [];
  for (let j = 0; j <= 600; j++) {
    const angle = -Math.PI + (j / 600) * TAU;
    const r = f4Dr(angle) * Rc;
    rimPts.push(vec3(r * Math.cos(angle), r * Math.sin(angle), 0));
  }
  const rim = createTubeThroughPoints(
    rimPts,
    6,
    0.035,
    materialFactory.soft(0x6f6a2a, { roughness: 0.5 }),
  );
  root.add(rim);
  /* chloroplasts */
  const stripeT = createCanvasTexture(
    256,
    32,
    (g, w, h) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        const x = (i / 40) * w;
        const gr = g.createLinearGradient(x - 3, 0, x + 3, 0);
        gr.addColorStop(0, '#808080');
        gr.addColorStop(0.5, '#e8e8e8');
        gr.addColorStop(1, '#808080');
        g.fillStyle = gr;
        g.fillRect(x - 3, 0, 6, h);
      }
    },
    false,
  );
  const chlGeo = desmidGeo(Rc, Tm, 0.8, 0.66, 0.7, 0.12 * Rc, 36, 288);
  const chlM = materialFactory.soft(0x5ea23a, { bumpMap: stripeT, bumpScale: 2.2, roughness: 0.5 });
  const chlR = new THREE.Mesh(chlGeo, chlM);
  const chlL = new THREE.Mesh(chlGeo, chlM);
  chlL.scale.x = -1;
  root.add(chlR, chlL);
  /* pyrenoids */
  const NP = 9;
  const pyC = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.soft(0xe3df8e, { clearcoat: 0.6 }),
    NP * 2,
  );
  const pyS = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.shell(0xfaf5d2, 0.6, { bumpScale: 0.2 }),
    NP * 2,
  );
  pyS.renderOrder = 6;
  for (let i = 0; i < NP; i++) {
    let angle;
    let rho;
    let x;
    let y;
    do {
      angle = (random() * 2 - 1) * 1.2;
      rho = 0.15 + random() * 0.6;
      x = rho * f4Dr(angle) * Rc * 0.8 * Math.cos(angle);
      y = rho * f4Dr(angle) * Rc * 0.8 * Math.sin(angle);
    } while (x < 0.12 * Rc + 0.35);
    const s = 0.15 + random() * 0.07;
    for (const sg of [1, -1]) {
      const k = i * 2 + (sg > 0 ? 0 : 1);
      setInstanceTransform(pyC, k, vec3(sg * x, y, 0), null, vec3(s, s, s * 0.8));
      setInstanceTransform(pyS, k, vec3(sg * x, y, 0), null, vec3(s * 1.45, s * 1.45, s * 1.15));
    }
  }
  root.add(pyC, pyS);
  /* nucleus */
  const nuc = new THREE.Mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0xe0a468, 0.5, { bumpScale: 0.2 }),
  );
  nuc.scale.set(0.34, 0.38, 0.24);
  nuc.renderOrder = 7;
  root.add(nuc);
  const nlc = new THREE.Mesh(sharedGeometries.sphereMid, materialFactory.soft(0xa4552e));
  nlc.scale.set(0.1, 0.1, 0.08);
  nlc.position.set(0.02, 0.03, 0.02);
  root.add(nlc);
  const chrM = materialFactory.soft(0x8a3a5c);
  const chrom = new THREE.Group();
  root.add(chrom);
  for (let i = 0; i < 9; i++) {
    const c = randomPointInUnitBall(random);
    c.set(c.x * 0.2, c.y * 0.22, c.z * 0.13);
    const d = randomDirection(random);
    chrom.add(
      createTubeAlongCurve(
        new THREE.CatmullRomCurve3([
          c.clone().addScaledVector(d, -0.07),
          c,
          c.clone().addScaledVector(d, 0.07),
        ]),
        10,
        5,
        0.018,
        chrM,
      ),
    );
  }
  /* isthmus ring */
  const ip = [];
  for (let j = 0; j <= 48; j++) {
    const a = (j / 48) * TAU;
    ip.push(vec3(0, 0.5 * Math.cos(a), f4Dt(0, Rc, Tm) * 0.96 * Math.sin(a)));
  }
  const isth = createTubeThroughPoints(
    ip,
    6,
    0.05,
    materialFactory.soft(0x7b6b2a, { roughness: 0.5 }),
  );
  root.add(isth);
  /* wall pores */
  const NPR = 340;
  const pore = createInstancedMesh(
    new THREE.TorusGeometry(0.05, 0.014, 5, 9),
    materialFactory.soft(0x5a5524, { roughness: 0.6 }),
    NPR,
  );
  for (let i = 0; i < NPR; i++) {
    const angle = random() * TAU;
    const rho = Math.sqrt(random()) * 0.93;
    const r = rho * f4Dr(angle) * Rc;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const side = i % 2 ? 1 : -1;
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.8) {
      i--;
      continue;
    }
    const z = side * f4Dt(x, Rc, Tm) * Math.pow(Math.max(0, 1 - Math.pow(rho, 2 / E)), E / 2);
    setInstanceTransform(pore, i, vec3(x, y, z + side * 0.008), null, 1);
  }
  root.add(pore);
  /* mucilage strands */
  const muc = new THREE.Group();
  root.add(muc);
  const mucM = materialFactory.shell(0xd8b45a, 0.55, { bumpScale: 0.1, roughness: 0.5 });
  const strands = [];
  for (let i = 0; i < 26; i++) {
    const angle = -Math.PI + ((i + random() * 0.6) / 26) * TAU;
    const r = f4Dr(angle) * Rc;
    const dir = vec3(Math.cos(angle), Math.sin(angle), 0);
    const p0 = dir.clone().multiplyScalar(r * 0.985);
    const sd = vec3(-dir.y, dir.x, 0).multiplyScalar((random() - 0.5) * 0.8);
    const c = new THREE.CatmullRomCurve3([
      p0,
      p0
        .clone()
        .addScaledVector(dir, 0.5)
        .add(vec3(0, 0, -0.3)),
      p0
        .clone()
        .addScaledVector(dir, 1.1)
        .add(sd)
        .add(vec3(0, 0, -0.85)),
      p0
        .clone()
        .addScaledVector(dir, 1.8)
        .addScaledVector(sd, 2)
        .add(vec3(0, 0, -1.5)),
    ]);
    const m = createTubeAlongCurve(c, 20, 5, (s) => 0.03 * (1 - s * 0.75), mucM);
    muc.add(m);
    strands.push(m);
  }
  /* cytoplasmic streaming granules */
  const NG = 150;
  const gr = createInstancedMesh(
    sharedGeometries.sphereLo,
    materialFactory.soft(0xd8cf62, { roughness: 0.4 }),
    NG,
  );
  const gth = [];
  const grho = [];
  const gsp = [];
  const gsd = [];
  for (let i = 0; i < NG; i++) {
    gth.push(random() * TAU);
    grho.push(0.84 + random() * 0.08);
    gsp.push((0.05 + random() * 0.08) * (random() > 0.5 ? 1 : -1));
    gsd.push(random() > 0.5 ? 1 : -1);
  }
  root.add(gr);
  const gP = vec3();
  const updG = (t) => {
    for (let i = 0; i < NG; i++) {
      const angle = gth[i] + gsp[i] * t;
      const rho = grho[i];
      const r = rho * f4Dr(angle) * Rc;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      gP.set(
        x,
        y,
        ((gsd[i] *
          f4Dt(x, Rc, Tm) *
          0.72 *
          Math.pow(Math.max(0, 1 - Math.pow(rho, 2 / E)), E / 2)) /
          0.72) *
          0.8,
      );
      setInstanceTransform(gr, i, gP, null, 0.05 + (i % 3) * 0.008);
    }
    gr.instanceMatrix.needsUpdate = true;
  };
  updG(0);
  specimen.part(
    'Cell wall',
    'A cellulose wall with other polysaccharides, laid down in two layers. In Micrasterias each half-cell has a wall pattern of deep lobes ending in small teeth. The dark rim line traces the edge of the cell in this model.',
    [wall, rim],
    { shell: true },
  );
  specimen.part(
    'Wall pores',
    'Fine pores cross the wall in a regular pattern. Mucilage made inside the cell passes out through them, and the cell also uses the mucilage to stick to surfaces and glide.',
    pore,
  );
  specimen.part(
    'Mucilage trail',
    'Slime pushed out through the wall pores forms a gel that bonds to the surface; as the cell slowly secretes it, the cell is pushed along in the opposite direction. This is how desmids, which have no flagella, glide at a few micrometres per second.',
    muc,
  );
  specimen.part(
    'Chloroplasts',
    'Each half-cell holds one large, deeply lobed chloroplast whose ridges follow the lobes of the wall. It carries out photosynthesis and gives the cell its fresh green colour.',
    [chlR, chlL],
  );
  specimen.part(
    'Pyrenoids',
    'Dense protein bodies inside the chloroplast that hold the enzyme rubisco and concentrate carbon dioxide for photosynthesis. Each is ringed by a sheath of starch, the stored product of photosynthesis.',
    [pyC, pyS],
  );
  specimen.part(
    'Nucleus',
    'A single nucleus lies in the narrow bridge at the middle of the cell. It has a prominent nucleolus. During division it moves out and splits, and each new cell receives one copy.',
    [nuc, nlc, chrom],
    { shell: false },
  );
  specimen.part(
    'Isthmus',
    'The narrow zone that joins the two mirror-image halves (semicells). New wall grows from here when the cell divides: each half builds a fresh mirror-image half, so each daughter keeps one old and one new semicell.',
    isth,
  );
  specimen.part(
    'Streaming granules',
    'Small particles ride the slow flow of cytoplasm around the chloroplasts. This streaming moves materials, such as stored products and enzymes, around the large cell.',
    gr,
  );
  specimen.anim((t) => {
    root.rotation.x = -0.3 + 0.14 * Math.sin(t * 0.5);
    root.rotation.y = 0.3 + 0.28 * Math.sin(t * 0.3);
    root.rotation.z = 0.1 * Math.sin(t * 0.4 + 1);
    root.position.x = 0.35 * Math.sin(t * 0.2);
    root.position.y = 0.15 * Math.sin(t * 0.27);
    muc.rotation.z = 0.035 * Math.sin(t * 0.9);
    strands.forEach((m, i) => {
      m.rotation.z = 0.02 * Math.sin(t * 1.1 + i * 0.6);
    });
    updG(t);
  });
}
ADDITIONAL_BUILDERS.desmid = buildDesmid;
ADDITIONAL_SPECIMENS.push({
  id: 'desmid',
  cat: 'algae',
  name: 'Desmid',
  latin: 'Micrasterias denticulata',
  size: 'about 150–250 µm across',
  sizeUm: 200,
  U: 7.6,
  dist: 17,
  cls: 'Eukaryota · Archaeplastida · Streptophyta · Zygnematophyceae',
  habitat: 'Acid, nutrient-poor ponds, bogs and the edges of soft-water lakes',
  move: 'Glides slowly over surfaces by pushing out mucilage; it has no flagella',
  feed: 'Photoautotroph: photosynthesis in two large chloroplasts',
  repro:
    'Mostly cell division in which each half builds a new mirror half; sexual reproduction by conjugation forms a resting zygospore',
  desc: 'A flat, disc-shaped cell made of two mirror-image halves joined at a narrow isthmus, with deeply cut lobes along its edge. Each half holds a lobed green chloroplast and the nucleus sits at the join.',
  fun: [
    'When it divides, each half builds a new mirror-image half in a few hours; the lobes grow out from a small bulge and are shaped with great precision.',
    'Desmids are green algae and close relatives of land plants.',
    'Micrasterias is a classic cell for studying how a cell shapes its wall.',
    'They are most common in acid, soft-water habitats such as peat bogs.',
  ],
  note: 'Cell shape and lobe pattern follow the real species but are simplified, with fewer teeth and a smoother edge. The cell is shown thicker than in life, and its size and rate of gliding are exaggerated for viewing. Granule movement is schematic. Colours are artistic.',
});

/* ================= 3. Oscillatoria (cyanobacterial filament) ================= */
function buildOscillatoria(specimen) {
  const random = createSeededRandom(403);
  const N = 40;
  const cl = 0.215;
  const rad = 0.56;
  const Q = N * 4;
  const ds = cl / 4;

  const KW = (2 * Math.PI) / 6.5;
  const root = new THREE.Group();
  root.rotation.set(0.18, -0.2, 0);
  specimen.add(root);
  /* geometries */
  const h = (cl / 2) * 0.98;
  const cr = 0.06;
  const prof = [vec2(0, -h), vec2(rad - cr, -h)];
  for (let k = 1; k <= 4; k++) {
    const a = ((k / 4) * Math.PI) / 2;
    prof.push(vec2(rad - cr + cr * Math.sin(a), -h + cr - cr * Math.cos(a)));
  }
  for (let k = 0; k <= 4; k++) {
    const a = ((k / 4) * Math.PI) / 2;
    prof.push(vec2(rad - cr + cr * Math.cos(a), h - cr + cr * Math.sin(a)));
  }
  prof.push(vec2(0, h));
  const wallG = new THREE.LatheGeometry(prof, 40);
  wallG.rotateZ(-Math.PI / 2);
  const thyG = new THREE.CylinderGeometry(1, 1, cl * 0.74, 36, 1, true);
  thyG.rotateZ(Math.PI / 2);
  const sepG = new THREE.CylinderGeometry(rad * 0.93, rad * 0.93, 0.02, 32);
  sepG.rotateZ(Math.PI / 2);
  const gvG = new THREE.CapsuleGeometry(0.018, 0.05, 3, 6);
  const grG = sharedGeometries.sphereLo;
  const wallM = materialFactory.shell(0xffffff, 0.5, { bumpScale: 0.3 });
  const thyM = materialFactory.shell(0x2e8a58, 0.5, { bumpScale: 0.6, roughness: 0.5 });
  const sepM = materialFactory.soft(0x6b8438, { roughness: 0.5 });
  const nucM = materialFactory.soft(0xa05f7e, { roughness: 0.45 });
  const gvM = materialFactory.soft(0xf2e7bf, { roughness: 0.5 });
  const grM = materialFactory.soft(0xe0b13e, { roughness: 0.35, clearcoat: 0.7 });
  const wall = createInstancedMesh(wallG, wallM, N);
  wall.renderOrder = 9;
  const thy = createInstancedMesh(thyG, thyM, N * 3);
  const sep = createInstancedMesh(sepG, sepM, N - 1);
  const nuc = createInstancedMesh(sharedGeometries.sphereMid, nucM, N);
  const gv = createInstancedMesh(gvG, gvM, N * 6);
  const gran = createInstancedMesh(grG, grM, N * 2);
  const tcol = new THREE.Color();
  for (let i = 0; i < N; i++) {
    wall.setColorAt(
      i,
      tcol.setHSL(0.4 + random() * 0.03, 0.38 + random() * 0.1, 0.5 + random() * 0.06),
    );
  }
  root.add(wall, thy, sep, nuc, gv, gran);
  /* tip cap */
  const cap = new THREE.Mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0x9fb35a, 0.6, { bumpScale: 0.5 }),
  );
  cap.renderOrder = 10;
  cap.matrixAutoUpdate = false;
  root.add(cap);
  /* local matrices per cell, by layer */
  const taper = (i) => {
    const t = clamp((i - (N - 9)) / 8, 0, 1);
    return 1 - 0.58 * Math.pow(t, 1.4);
  };
  const LW = [];
  const LT = [];
  const LS = [];
  const LN = [];
  const LG = [];
  const LR = [];
  const ID = new THREE.Quaternion();
  const qr = new THREE.Quaternion();
  const eu = new THREE.Euler();
  for (let i = 0; i < N; i++) {
    const tp = taper(i);
    LW.push(f4Loc(vec3(), ID, vec3(1, tp, tp)));
    [0.47, 0.4, 0.33].forEach((r) => LT.push(f4Loc(vec3(), ID, vec3(1, r * tp, r * tp))));
    if (i > 0) {
      LS.push(f4Loc(vec3(-cl / 2, 0, 0), ID, vec3(1, tp, tp)));
    }
    LN.push(f4Loc(vec3(), ID, vec3(0.07, 0.17 * tp, 0.17 * tp)));
    for (let k = 0; k < 6; k++) {
      const a = random() * TAU;
      const rr = (0.24 + random() * 0.1) * tp;
      eu.set(random() * 3, random() * 3, random() * 3);
      qr.setFromEuler(eu);
      LG.push(f4Loc(vec3((random() - 0.5) * cl * 0.5, rr * Math.cos(a), rr * Math.sin(a)), qr, 1));
    }
    for (let k = 0; k < 2; k++) {
      const a = random() * TAU;
      const rr = 0.42 * tp;
      LR.push(
        f4Loc(
          vec3((k ? 0.5 : -0.5) * cl * 0.82, rr * Math.cos(a), rr * Math.sin(a)),
          ID,
          k ? 0.04 : 0.05,
        ),
      );
    }
  }
  /* path */
  const points = Array.from({ length: Q + 1 }, () => vec3());
  const Nrm = vec3(0, 1, 0);
  const Tn = vec3();
  const Bn = vec3();
  const Ny = vec3();
  const Bz = vec3();

  const cen = vec3();
  const sheath = new AnimatedTube(
    Q,
    20,
    materialFactory.shell(0xa6d19a, 0.3, { bumpScale: 0.2, roughness: 0.4 }),
  );
  sheath.mesh.renderOrder = 12;
  root.add(sheath.mesh);
  const sheathR = (s) =>
    s < 0.86 ? 0.66 : 0.66 * (1 - 0.5 * Math.pow((s - 0.86) / 0.14, 1.5)) + 0.02;
  const Mc = new THREE.Matrix4();
  const tmp = new THREE.Matrix4();
  const upd = (t) => {
    let x = 0;
    let y = 0;
    let z = 0;
    cen.set(0, 0, 0);
    for (let k = 0; k <= Q; k++) {
      points[k].set(x, y, z);
      cen.add(points[k]);
      const sn = k / Q;
      const amp = 0.1 + 0.62 * sn * sn;
      const angle = amp * Math.sin(KW * k * ds - t * 2.2);
      const ph = 0.5 * amp * Math.cos(KW * k * ds - t * 2.2 + 0.9);
      x += Math.cos(angle) * Math.cos(ph) * ds;
      y += Math.sin(angle) * ds;
      z += Math.cos(angle) * Math.sin(ph) * ds;
    }
    cen.multiplyScalar(1 / (Q + 1));
    for (let k = 0; k <= Q; k++) {
      points[k].sub(cen);
    }
    Nrm.set(0, 1, 0);

    let si = 0;

    for (let i = 0; i < N; i++) {
      const c = 4 * i + 2;
      Tn.subVectors(points[c + 1], points[c - 1]).normalize();
      Nrm.addScaledVector(Tn, -Nrm.dot(Tn)).normalize();
      Bn.crossVectors(Tn, Nrm);
      const r = t * 0.9 + i * 0.1;
      const cr2 = Math.cos(r);
      const sr = Math.sin(r);
      Ny.copy(Nrm).multiplyScalar(cr2).addScaledVector(Bn, sr);
      Bz.copy(Bn).multiplyScalar(cr2).addScaledVector(Nrm, -sr);
      Mc.makeBasis(Tn, Ny, Bz).setPosition(points[c]);
      wall.setMatrixAt(i, tmp.multiplyMatrices(Mc, LW[i]));
      for (let k = 0; k < 3; k++) {
        thy.setMatrixAt(i * 3 + k, tmp.multiplyMatrices(Mc, LT[i * 3 + k]));
      }
      if (i > 0) {
        sep.setMatrixAt(si++, tmp.multiplyMatrices(Mc, LS[i - 1]));
      }
      nuc.setMatrixAt(i, tmp.multiplyMatrices(Mc, LN[i]));
      for (let k = 0; k < 6; k++) {
        gv.setMatrixAt(i * 6 + k, tmp.multiplyMatrices(Mc, LG[i * 6 + k]));
      }
      for (let k = 0; k < 2; k++) {
        gran.setMatrixAt(i * 2 + k, tmp.multiplyMatrices(Mc, LR[i * 2 + k]));
      }
      if (i === N - 1) {
        cap.matrix.multiplyMatrices(
          Mc,
          f4M1.compose(
            f4Tmp.set(cl * 0.5, 0, 0),
            ID,
            tmp2.set(0.16, rad * taper(i) * 0.96, rad * taper(i) * 0.96),
          ),
        );
        cap.matrixWorldNeedsUpdate = true;
      }
    }
    [wall, thy, sep, nuc, gv, gran].forEach((m) => (m.instanceMatrix.needsUpdate = true));
    sheath.update(points, sheathR);
    root.position.x = 0.5 * Math.sin(t * 0.3);
  };
  upd(0);
  specimen.anim(upd);
  specimen.part(
    'Sheath',
    'A thin, loose envelope of slime (polysaccharide) around the whole filament. It is optional in Oscillatoria and often very thin. It protects the cells and gives the filament something to glide against when it moves.',
    sheath.mesh,
    { shell: true },
  );
  specimen.part(
    'Cells of the trichome',
    'The chain of cells is called a trichome. Each cell is a short disc, much wider than long, with a Gram-negative type wall. There are no branches and no specialised heterocysts: every cell does photosynthesis, and the cells stay linked by tiny channels.',
    wall,
    { shell: true },
  );
  specimen.part(
    'Cross-walls (septa)',
    'Each cell is separated from its neighbours by a cross-wall of peptidoglycan. Microscopic channels pass through each wall so neighbouring cells can exchange small molecules and signals along the filament.',
    sep,
  );
  specimen.part(
    'Thylakoid membranes',
    'Layers of photosynthetic membrane lie around the edge of the cell. They carry chlorophyll a and phycobilisomes with the pigments phycocyanin and phycoerythrin, which together give the teal-green colour. Cyanobacteria have no chloroplast, so these membranes lie free in the cytoplasm.',
    thy,
    { shell: true },
  );
  specimen.part(
    'Nucleoid',
    'The cell has a ring of DNA with no membrane around it. It sits in the clear central cytoplasm and each cell holds several copies of the chromosome.',
    nuc,
  );
  specimen.part(
    'Gas vesicles',
    'Small gas-filled protein compartments that make the filament more buoyant. Filaments of Oscillatoria in water may use them to adjust their depth to find the right amount of light.',
    gv,
  );
  specimen.part(
    'Storage granules',
    'Granules of stored nutrient, such as cyanophycin (a nitrogen reserve) and polyphosphate, tend to collect next to the cross-walls and are used when the cell needs them.',
    gran,
  );
  specimen.part(
    'Tapered tip cell',
    'The tip of the trichome narrows. The end cell is often rounded or capped by a thicker outer wall called the calyptra, and the tip is the part that swings most as the filament moves.',
    cap,
    { shell: true },
  );
}
ADDITIONAL_BUILDERS.oscillatoria = buildOscillatoria;
ADDITIONAL_SPECIMENS.push({
  id: 'oscillatoria',
  cat: 'algae',
  name: 'Oscillatoria',
  latin: 'Oscillatoria sp.',
  size: 'cells 4–10 µm wide and 1–4 µm long; filaments from 100 µm to several millimetres',
  sizeUm: 400,
  U: 9,
  dist: 18,
  cls: 'Bacteria · Cyanobacteriota · Oscillatoriales',
  habitat: 'Ponds, ditches, damp soil, hot springs and mats on mud and stones',
  move: 'Glides over surfaces and sways side to side as it turns around its own axis; no flagella',
  feed: 'Photoautotroph: oxygenic photosynthesis with chlorophyll a and phycobilin pigments',
  repro:
    'Filaments break into short pieces called hormogonia that glide away and grow into new filaments',
  desc: 'An unbranched chain of flat disc-shaped cells that sways and glides. It is a cyanobacterium, a photosynthetic bacterium, and has no nucleus or chloroplast.',
  fun: [
    'The name refers to its swaying, oscillating movement, which can be seen under a microscope.',
    'Cyanobacteria were the first organisms to make oxygen by photosynthesis, more than 2 billion years ago.',
    'It does not fix nitrogen in specialised cells, unlike Anabaena, because it has no heterocysts.',
    'The rotation and gliding are driven by slime secretion and pili at the cell surface.',
  ],
  note: 'Cells and filament length are drawn at a convenient scale, with fewer cells (40) than a typical filament. The wave and the rotation are faster than real gliding, which is only a few micrometres per second. Gas vesicle and granule numbers are reduced. Colours are artistic: the real pigments make it blue-green.',
});
