/**
 * Specimens: classic protists.
 */

import * as THREE from 'three';
import {
  Flagellum,
  sharedGeometries,
  createInstancedMesh,
  createCylinderBetween,
  perpendicularDirection,
  setInstanceTransform,
  createTubeThroughPoints,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import {
  TAU,
  vec3,
  vec2,
  clamp,
  fractalNoise3D,
  randomDirection,
  randomPointInUnitBall,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';

/* ================= deformable blob ================= */
export class Amoeboid {
  constructor(seg = 96, rings = 64) {
    this.geo = new THREE.SphereGeometry(1, seg, rings);
    this.dir = Float32Array.from(this.geo.attributes.position.array);
    this.n = this.dir.length / 3;
  }
  update(rfn, sc) {
    const p = this.geo.attributes.position.array;
    const d = this.dir;
    for (let i = 0; i < this.n; i++) {
      const x = d[i * 3];
      const y = d[i * 3 + 1];
      const z = d[i * 3 + 2];
      const r = rfn(x, y, z);
      p[i * 3] = x * r * sc.x;
      p[i * 3 + 1] = y * r * sc.y;
      p[i * 3 + 2] = z * r * sc.z;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
  }
}

/* ================= AMOEBA ================= */
export function buildAmoeba(specimen) {
  const random = createSeededRandom(11);
  const NP = 5;
  const pods = Array.from({ length: NP }, () => ({
    d: vec3(random() * 2 - 1, (random() * 2 - 1) * 0.7, (random() * 2 - 1) * 0.25).normalize(),
    ph: random() * TAU,
    sp: 0.16 + random() * 0.14,
    len: 0.6 + random() * 0.5,
    tight: 6 + random() * 5,
  }));
  const podS = new Array(NP).fill(0);
  const body = new Amoeboid(96, 64);
  const sc = vec3(1.25, 1, 0.62);
  let T = 0;
  const rfn = (x, y, z) => {
    let r = 1 + 0.09 * fractalNoise3D(x * 1.5 + T * 0.13, y * 1.5, z * 1.5 + T * 0.1);
    for (let k = 0; k < NP; k++) {
      const p = pods[k];
      r += podS[k] * Math.exp((x * p.d.x + y * p.d.y + z * p.d.z - 1) * p.tight);
    }
    return r;
  };
  const pt = (d, f, out) =>
    out
      .copy(d)
      .multiplyScalar(rfn(d.x, d.y, d.z) * f)
      .multiply(sc);
  const mem = specimen.mesh(
    body.geo,
    materialFactory.shell(0xa7d8cf, 0.3, {
      iridescence: 0.5,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [200, 500],
    }),
    { ro: 8 },
  );
  specimen.part(
    'Cell membrane and pseudopodia',
    'A flexible plasma membrane with no rigid wall. Cytoplasm streams forward into temporary projections called pseudopodia, which the amoeba uses to crawl and to engulf prey.',
    mem,
    { shell: true },
  );
  // cytoplasm granules
  const NG = 260;
  const gr = createInstancedMesh(sharedGeometries.sphereLo, materialFactory.soft(0xc6e8dc), NG);
  const gd = [];
  const tmp = vec3();
  for (let i = 0; i < NG; i++) {
    gd.push({
      d: randomDirection(random),
      f: 0.1 + 0.8 * Math.cbrt(random()),
      s: 0.016 + random() * 0.02,
      ph: random() * TAU,
    });
  }
  specimen.part(
    'Cytoplasm and granules',
    'Granular endoplasm: a gel of proteins, ribosomes and storage granules that flows continuously, pushing the cell forward. A clearer outer layer, the ectoplasm, lies just under the membrane.',
    gr,
  );
  specimen.add(gr);
  // nucleus
  const nuc = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.grain(0x8f7fc0, { transparent: true, opacity: 0.92 }),
    { s: 0.34, ro: 3 },
  );
  specimen
    .mesh(sharedGeometries.sphere, materialFactory.soft(0x3f3470), { s: 0.35, parent: nuc })
    .scale.setScalar(0.34);
  specimen.part(
    'Nucleus',
    'A single large nucleus holds the DNA. The dense dark body inside is the nucleolus, where ribosomal RNA is made. The nuclear envelope has pores that control traffic of molecules.',
    nuc,
  );
  // contractile vacuole
  const cv = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xbfe8ff, 0.5), {
    s: 0.15,
    ro: 4,
  });
  specimen.part(
    'Contractile vacuole',
    'A fluid-filled bladder that slowly fills with excess water from the cytoplasm, then squeezes it out through the membrane. Without it, freshwater amoebae would swell and burst.',
    cv,
  );
  // food vacuoles
  const fvs = [];
  const fm = materialFactory.glass(0xd8f0f5, 0.4);
  const pm = materialFactory.soft(0x3f7a3a);
  for (let i = 0; i < 4; i++) {
    const group = new THREE.Group();
    specimen.mesh(sharedGeometries.sphere, fm, { s: 0.17 + random() * 0.04, parent: group, ro: 4 });
    const prey = specimen.mesh(sharedGeometries.capsule, pm, {
      s: 0.09,
      r: [random() * 3, random() * 3, 0],
      parent: group,
    });
    prey.scale.set(0.06, 0.09, 0.06);
    specimen.add(group);
    fvs.push({ g: group, a: random() * TAU, f: 0.45 + random() * 0.25 });
  }
  const fvg = new THREE.Group();
  fvs.forEach((f) => fvg.add(f.g));
  specimen.group.add(fvg);
  specimen.part(
    'Food vacuoles',
    'When a pseudopodium wraps around prey such as algae or bacteria, the membrane pinches off a vacuole. Digestive enzymes then break the prey down and nutrients diffuse into the cytoplasm.',
    fvg,
  );
  const cvDir = vec3(0.7, -0.5, 0.1).normalize();
  const nd = vec3(-0.2, 0.1, 0).normalize();
  specimen.anim((t) => {
    T = t * 0.8;
    for (let k = 0; k < NP; k++) {
      podS[k] = pods[k].len * Math.pow(Math.max(0, Math.sin(T * pods[k].sp * 3 + pods[k].ph)), 1.4);
    }
    body.update(rfn, sc);
    for (let i = 0; i < NG; i++) {
      const g = gd[i];
      pt(g.d, g.f * (1 + 0.04 * Math.sin(T + g.ph)), tmp);
      setInstanceTransform(gr, i, tmp, null, g.s);
    }
    gr.instanceMatrix.needsUpdate = true;
    pt(nd, 0.15, nuc.position);
    const ph = (t / 7) % 1;
    const s = ph < 0.85 ? ph / 0.85 : 1 - (ph - 0.85) / 0.15;
    cv.scale.setScalar(0.07 + 0.13 * s);
    pt(cvDir, 0.72, cv.position);
    fvs.forEach((f) => {
      const a = f.a + T * 0.06;
      const d = vec3(Math.cos(a), Math.sin(a) * 0.8, Math.sin(a * 1.7) * 0.3).normalize();
      pt(d, f.f, f.g.position);
    });
  });
}

/* ================= PARAMECIUM ================= */
export function buildParamecium(specimen) {
  const L = 3.6;
  const FZ = 0.82;
  const rad = (u) => (0.74 * Math.pow(u, 0.8) * Math.pow(1 - u, 0.5)) / 0.42;
  const X = (u) => (0.5 - u) * L;
  const sp = (u, angle, f = 1, o = vec3()) => {
    const r = rad(u) * f;
    return o.set(X(u), r * Math.cos(angle), r * Math.sin(angle) * FZ);
  };
  const prof = [];
  for (let i = 80; i >= 0; i--) {
    const u = i / 80;
    prof.push(vec2(Math.max(rad(u), 0.0005), (0.5 - u) * L));
  }
  const mem = specimen.mesh(
    new THREE.LatheGeometry(prof, 96),
    materialFactory.shell(0xa9d6c6, 0.26, {
      iridescence: 0.45,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [180, 420],
    }),
    { r: [0, 0, -Math.PI / 2], s: vec3(1, 1, FZ), ro: 8 },
  );
  specimen.part(
    'Pellicle and membrane',
    'A firm but flexible outer layer (the pellicle) gives Paramecium its constant slipper shape. Beneath it lie thousands of basal bodies that anchor the cilia, and trichocysts that can be fired as defence.',
    mem,
    { shell: true },
  );
  // cilia
  const rows = 40;
  const base = [];
  const nrm = [];
  for (let i = 1; i < rows; i++) {
    const u = 0.015 + (0.97 * i) / rows;
    const nc = Math.max(5, Math.round((rad(u) * TAU) / 0.1));
    const du = 0.004;
    const s = (-(rad(u + du) - rad(u - du)) / (2 * du) / L) * -1;
    for (let j = 0; j < nc; j++) {
      const angle = ((j + (i % 2) * 0.5) / nc) * TAU;
      base.push(sp(u, angle));
      nrm.push(vec3(s, Math.cos(angle), Math.sin(angle) / FZ).normalize());
    }
  }
  const NC = base.length;
  const cg = new THREE.CylinderGeometry(0.004, 0.011, 0.3, 5);
  cg.translate(0, 0.15, 0);
  const cil = createInstancedMesh(
    cg,
    materialFactory.soft(0xd5ece4, { transparent: true, opacity: 0.6, roughness: 0.4 }),
    NC,
  );
  specimen.add(cil);
  specimen.part(
    'Cilia',
    'Roughly 5,000 cilia cover the cell and beat in coordinated waves (metachronal rhythm). Each one has a power stroke and a recovery stroke, driving the cell forward and sweeping food towards the mouth.',
    cil,
  );
  const q = new THREE.Quaternion();
  const dir = vec3();
  const tp = vec3();
  const up = vec3(0, 1, 0);

  const nx = vec3(-1, 0, 0);
  // oral groove
  const mg = materialFactory.soft(0x5e9c97, { roughness: 0.6 });
  const gpts = [
    [0.12, 2.7],
    [0.2, 2.4],
    [0.3, 2.05],
    [0.4, 1.7],
    [0.5, 1.57],
  ].map(([u, angle]) => sp(u, angle, 0.97));
  const groove = createTubeThroughPoints(
    new THREE.CatmullRomCurve3(gpts).getPoints(24),
    10,
    (t) => 0.02 + 0.09 * Math.sin(Math.PI * Math.min(1, t * 1.1)) ** 0.6 + 0.02,
    mg,
  );
  specimen.add(groove);
  const mouth = sp(0.5, 1.57, 0.97);
  const inner = sp(0.6, 1.2, 0.5);
  const cph = createTubeThroughPoints(
    new THREE.CatmullRomCurve3([mouth, sp(0.52, 1.4, 0.7), inner]).getPoints(16),
    10,
    (t) => 0.09 * (1 - t * 0.55),
    materialFactory.soft(0x4d8a86, { roughness: 0.6 }),
  );
  specimen.add(cph);
  const og = new THREE.Group();
  og.add(groove, cph);
  specimen.part(
    'Oral groove and cytopharynx',
    'A shallow groove lined with extra-long cilia funnels bacteria and yeast into the cell mouth (cytostome). The cytopharynx is a short tube that delivers each mouthful into a newly forming food vacuole.',
    og,
  );
  // nuclei
  const mac = specimen.mesh(sharedGeometries.sphere, materialFactory.grain(0x9d7fc9), {
    p: vec3(0.1, 0.02, 0),
    s: vec3(0.52, 0.21, 0.2),
    ro: 3,
  });
  specimen.part(
    'Macronucleus',
    'The large, kidney-shaped macronucleus runs everyday gene expression. It holds many copies of the genome and is rebuilt from the micronucleus after sexual reproduction (conjugation).',
    mac,
  );
  const mic = specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0x5a46a0), {
    p: vec3(0.12, 0.24, 0.05),
    s: 0.075,
    ro: 3,
  });
  specimen.part(
    'Micronucleus',
    'A small diploid nucleus that stays quiet during daily life. It carries the germline genome and divides by meiosis when two Paramecium exchange genetic material.',
    mic,
  );
  // contractile vacuoles
  const cvs = [1.15, -1.1].map((x, k) => {
    const group = new THREE.Group();
    group.position.set(x, -0.12, 0);
    const c = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xbfe8ff, 0.5), {
      parent: group,
      ro: 4,
    });
    const cm = materialFactory.soft(0x9bd0d8, { transparent: true, opacity: 0.8 });
    const canals = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + k;
      const mesh = new THREE.Mesh(sharedGeometries.capsule, cm);
      mesh.position.set(Math.cos(a * 1) * 0.05, Math.cos(a) * 0.17, Math.sin(a) * 0.13);
      mesh.rotation.set(Math.sin(a) * 1.2, 0, Math.cos(a) * 1.2 - 0);
      mesh.scale.set(0.025, 0.12, 0.025);
      group.add(mesh);
      canals.push(mesh);
    }
    specimen.add(group);
    return { g: group, c, canals };
  });
  const cvg = new THREE.Group();
  cvs.forEach((c) => cvg.add(c.g));
  specimen.group.add(cvg);
  specimen.part(
    'Contractile vacuoles',
    'Two star-shaped vacuoles, one at each end, collect water through radiating canals and expel it every few seconds. They alternate in rhythm and keep the cell from bursting in fresh water.',
    cvg,
  );
  // food vacuoles
  const random = createSeededRandom(4);
  const fvs = Array.from({ length: 6 }, (_, i) => {
    const group = new THREE.Group();
    specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xe0f4f2, 0.4), {
      parent: group,
      s: 0.13 + random() * 0.05,
      ro: 4,
    });
    specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0x6b8f3b), {
      parent: group,
      s: 0.05,
    });
    return { g: group, a: (i / 6) * TAU };
  });
  const fvg = new THREE.Group();
  fvs.forEach((f) => fvg.add(f.g));
  specimen.add(fvg);
  specimen.part(
    'Food vacuoles',
    'Each vacuole holds ingested bacteria or yeast. The vacuoles circulate through the cell in a fixed loop (cyclosis) as they acidify, digest, and finally release waste at the cytoproct near the rear.',
    fvg,
  );
  specimen.anim((t) => {
    for (let i = 0; i < NC; i++) {
      const n = nrm[i];
      const b = base[i];
      const ph = 7 * t - b.x * 5 + Math.atan2(b.z, b.y) * 1.2;
      const a = 0.55 + 0.5 * Math.sin(ph);
      tp.copy(nx).addScaledVector(n, n.x);
      tp.normalize();
      dir.copy(n).multiplyScalar(Math.cos(a)).addScaledVector(tp, Math.sin(a));
      q.setFromUnitVectors(up, dir.normalize());
      setInstanceTransform(cil, i, b, q, 1);
    }
    cil.instanceMatrix.needsUpdate = true;
    cvs.forEach((c, k) => {
      const ph = (t / 5 + k * 0.5) % 1;
      const s = ph < 0.85 ? ph / 0.85 : 1 - (ph - 0.85) / 0.15;
      c.c.scale.setScalar(0.05 + 0.1 * s);
      c.canals.forEach((m) => (m.visible = s < 0.6 || ph < 0.85));
    });
    fvs.forEach((f) => {
      const a = f.a + t * 0.07;
      f.g.position.set(0.1 + 0.8 * Math.cos(a), -0.16 + 0.26 * Math.sin(a), 0.18 * Math.sin(a * 2));
    });
  });
}

/* ================= EUGLENA ================= */
export function buildEuglena(specimen) {
  const NU = 72;
  const NT = 40;
  const L = 3.4;
  const random = createSeededRandom(8);
  const rad = (u) => 0.46 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(u, 0, 1), 0.62)), 0.75);
  const pos = new Float32Array((NU + 1) * NT * 3);
  const idx = [];
  const uv = new Float32Array((NU + 1) * NT * 2);
  for (let i = 0; i <= NU; i++) {
    for (let j = 0; j < NT; j++) {
      uv[(i * NT + j) * 2] = j / NT;
      uv[(i * NT + j) * 2 + 1] = i / NU;
    }
  }
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NT; j++) {
      const a = i * NT + j;
      const b = i * NT + ((j + 1) % NT);
      const c = (i + 1) * NT + j;
      const d = (i + 1) * NT + ((j + 1) % NT);
      idx.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(idx);
  let lsc = 1;
  let wsc = 1;
  let T = 0;
  const bend = (u) => 0.13 * Math.sin(TAU * 0.8 * u - T * 2) * (0.3 + u);
  const P = (u, angle, f = 1, o = vec3()) => {
    const r = rad(u) * f * wsc * (f === 1 ? 1 + 0.035 * Math.sin(14 * angle + u * 16) : 1);
    return o.set((0.5 - u) * L * lsc, r * Math.cos(angle) + bend(u), r * Math.sin(angle) * 0.88);
  };
  const upd = () => {
    for (let i = 0; i <= NU; i++) {
      for (let j = 0; j < NT; j++) {
        const p = P(i / NU, (j / NT) * TAU);
        const k = (i * NT + j) * 3;
        pos[k] = p.x;
        pos[k + 1] = p.y;
        pos[k + 2] = p.z;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  };
  const body = specimen.mesh(
    geometry,
    materialFactory.shell(0x7fcf6a, 0.34, { iridescence: 0.3, iridescenceIOR: 1.3 }),
    { ro: 8 },
  );
  specimen.part(
    'Pellicle',
    'A flexible protein layer arranged in spiral strips under the membrane. Because it is not rigid, Euglena can squeeze and stretch its body in a motion called euglenoid movement.',
    body,
    { shell: true },
  );
  const nuc = specimen.mesh(sharedGeometries.sphere, materialFactory.grain(0x8c7cc2), {
    s: 0.3,
    ro: 3,
  });
  specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0x3c3270), { parent: nuc, s: 0.35 });
  specimen.part(
    'Nucleus',
    'A large nucleus sits in the rear half. The prominent nucleolus produces ribosomal RNA, and the chromosomes stay visibly condensed even between divisions, an unusual feature of euglenoids.',
    nuc,
  );
  const NCH = 20;
  const chm = materialFactory.soft(0x3f9d38, {
    roughness: 0.45,
    emissive: 0x0b2a08,
    emissiveIntensity: 0.5,
  });
  const chs = createInstancedMesh(sharedGeometries.sphereMid, chm, NCH);
  const chd = [];
  for (let i = 0; i < NCH; i++) {
    chd.push({ u: 0.2 + random() * 0.65, th: random() * TAU, f: 0.55 + random() * 0.25 });
  }
  specimen.add(chs);
  specimen.part(
    'Chloroplasts',
    'Disc-shaped chloroplasts contain chlorophyll a and b and carry out photosynthesis. Euglena can also absorb nutrients from its surroundings, so it feeds in both plant-like and animal-like ways.',
    chs,
  );
  const eye = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    specimen.mesh(sharedGeometries.sphereLo, materialFactory.emit(0xff6a2b, 0.7), {
      parent: eye,
      p: vec3((random() - 0.5) * 0.1, (random() - 0.5) * 0.1, (random() - 0.5) * 0.1),
      s: 0.03 + random() * 0.015,
    });
  }
  specimen.add(eye);
  const pfb = specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xdfe8ff), { s: 0.06 });
  specimen.part(
    'Eyespot (stigma)',
    'A cluster of orange-red pigment granules that shades a light-sensitive swelling at the base of the flagellum. As the cell turns, the shadow tells it which way the light comes from, guiding it towards bright water.',
    [eye, pfb],
  );
  const res = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xdff3ff, 0.4), {
    s: 0.23,
    ro: 4,
  });
  const cvac = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xbfe8ff, 0.5), {
    s: 0.1,
    ro: 4,
  });
  specimen.part(
    'Reservoir and contractile vacuole',
    'The reservoir is a pocket at the front end that the flagellum grows from. The contractile vacuole empties into it, pumping excess water out of the cell.',
    [res, cvac],
  );
  const NP = 12;
  const para = createInstancedMesh(sharedGeometries.capsule, materialFactory.soft(0xf2f4e6), NP);
  const pd = [];
  for (let i = 0; i < NP; i++) {
    pd.push({
      u: 0.3 + random() * 0.5,
      th: random() * TAU,
      f: 0.3 + random() * 0.25,
      r: random() * 3,
    });
  }
  specimen.add(para);
  specimen.part(
    'Paramylon granules',
    'Euglena stores energy as paramylon, a starch-like carbohydrate unique to euglenoids. The white rods build up when light is plentiful and are used up in darkness.',
    para,
  );
  const fl = new Flagellum(materialFactory.soft(0xd9f5c8, { roughness: 0.5 }), {
    n: 44,
    rad: 6,
    r0: 0.03,
    r1: 0.012,
  });
  specimen.add(fl.mesh);
  specimen.part(
    'Flagellum',
    'A single long flagellum beats in a spiral wave, pulling the cell forward like a propeller. A second, short flagellum stays inside the reservoir.',
    fl.mesh,
  );
  const o = vec3();
  const d = vec3(1, 0, 0);
  const sd = vec3(0, 1, 0);
  const q = new THREE.Quaternion();
  const tmp = vec3();
  specimen.anim((t) => {
    T = t;
    lsc = 1 + 0.07 * Math.sin(t * 0.9);
    wsc = 1 / Math.sqrt(lsc);
    upd();
    P(0, 0, 0, nuc.position);
    nuc.position.copy(P(0.62, 0, 0, tmp));
    chd.forEach((c, i) => {
      P(c.u, c.th, c.f, tmp);
      const rd = vec3(0, Math.cos(c.th), Math.sin(c.th));
      q.setFromUnitVectors(vec3(0, 0, 1), rd);
      setInstanceTransform(chs, i, tmp, q, vec3(0.3, 0.2, 0.07));
    });
    chs.instanceMatrix.needsUpdate = true;
    pd.forEach((c, i) => {
      P(c.u, c.th, c.f, tmp);
      q.setFromEuler(new THREE.Euler(c.r, 1.2, c.r * 0.5));
      setInstanceTransform(para, i, tmp, q, vec3(0.05, 0.07, 0.05));
    });
    para.instanceMatrix.needsUpdate = true;
    P(0.06, 0, 0, res.position);
    res.position.x -= 0.05;
    P(0.12, 2.4, 0.6, eye.position);
    eye.position.set(eye.position.x, eye.position.y + 0.08, 0.12);
    pfb.position.set(eye.position.x + 0.1, eye.position.y - 0.12, 0.1);
    cvac.position.set(res.position.x - 0.1, res.position.y - 0.18, 0.02);
    cvac.scale.setScalar(0.06 + 0.06 * ((t / 5) % 1 < 0.85 ? ((t / 5) % 1) / 0.85 : 0));
    P(0, 0, 1, o);
    fl.wave(o, d, sd, 2.7, 0.3, 1.15, 8, t);
  });
}

/* ================= GIARDIA ================= */
export function buildGiardia(specimen) {
  const g0 = new THREE.SphereGeometry(1, 64, 48);
  const p = g0.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const h = (y + 1) / 2;
    const w = 0.5 + 0.5 * Math.pow(h, 0.7);
    p.setXYZ(i, x * w * 0.95, y * 1.4, z > 0 ? z * 0.3 : z * 0.52);
  }
  g0.computeVertexNormals();
  const body = specimen.mesh(
    g0,
    materialFactory.shell(0xa9d5cf, 0.36, { iridescence: 0.4, iridescenceIOR: 1.3 }),
    { ro: 8 },
  );
  specimen.part(
    'Cell body',
    'A pear-shaped trophozoite about 12 to 15 micrometres long. Its dorsal side is curved and its ventral side is flat, which lets it press against the lining of the small intestine.',
    body,
    { shell: true },
  );
  // sucking disc
  const dg = new THREE.CircleGeometry(0.62, 48);
  const dp = dg.attributes.position;
  for (let i = 0; i < dp.count; i++) {
    const r = Math.hypot(dp.getX(i), dp.getY(i)) / 0.62;
    dp.setZ(i, -0.1 * (1 - r * r));
  }
  dg.computeVertexNormals();
  const disc = new THREE.Group();
  disc.position.set(0, 0.3, 0.3);
  specimen.mesh(
    dg,
    materialFactory.soft(0x6ea5b5, { side: THREE.DoubleSide, transparent: true, opacity: 0.75 }),
    { parent: disc },
  );
  specimen.mesh(new THREE.TorusGeometry(0.62, 0.05, 10, 48), materialFactory.soft(0x86bfc9), {
    parent: disc,
    s: vec3(1, 1, 1),
  });
  specimen.mesh(new THREE.TorusGeometry(0.35, 0.02, 8, 36), materialFactory.soft(0x86bfc9), {
    parent: disc,
    p: vec3(0, 0, -0.06),
  });
  specimen.add(disc);
  specimen.part(
    'Ventral sucking disc',
    'A concave disc built from microtubules and ribbon-like proteins. It works like a suction cup, holding the parasite on to intestinal cells so the gut flow cannot wash it away.',
    disc,
  );
  const nm = materialFactory.grain(0x8f7fc0);
  const nu = [-1, 1].map((s) => {
    const n = specimen.mesh(sharedGeometries.sphere, nm, {
      p: vec3(s * 0.26, 0.6, 0.04),
      s: vec3(0.2, 0.3, 0.15),
      ro: 3,
    });
    specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0x3c3270), {
      parent: n,
      s: 0.35,
    });
    return n;
  });
  const nug = new THREE.Group();
  nu.forEach((n) => nug.add(n));
  specimen.group.add(nug);
  specimen.part(
    'Two nuclei',
    'Giardia has two identical nuclei, which together with the disc look like a face under the microscope. Each one carries a full copy of the genome and both are active.',
    nug,
  );
  const mb = materialFactory.soft(0x4a5f7a);
  const med = [-1, 1].map((s) =>
    specimen.mesh(sharedGeometries.capsule, mb, {
      p: vec3(0, -0.22, -0.04),
      r: [0, 0, s * 0.6],
      s: vec3(0.05, 0.22, 0.05),
    }),
  );
  const medg = new THREE.Group();
  med.forEach((m) => medg.add(m));
  specimen.group.add(medg);
  specimen.part(
    'Median bodies',
    'Dark, curved bundles of microtubules behind the disc. Their exact job is still debated, but they probably help build and repair the disc during division.',
    medg,
  );
  const am = materialFactory.soft(0xe8f3f7);
  const ax = new THREE.Group();
  [-1, 1].forEach((s) => {
    ax.add(createCylinderBetween(vec3(s * 0.04, 0.45, 0), vec3(-s * 0.06, -1.3, 0), 0.016, am));
  });
  specimen.add(ax);
  specimen.part(
    'Axonemes',
    'Microtubule cores of the flagella that run through the cell. Each pair of flagella grows from basal bodies near the nuclei and its axoneme is anchored along the cell midline.',
    ax,
  );
  const fm = materialFactory.soft(0xd5f0ee);
  const cfg = [
    [vec3(0.1, 0.5, 0.1), vec3(0.4, 0.8, 0.2), 1.1, 0],
    [vec3(-0.1, 0.5, 0.1), vec3(-0.4, 0.8, 0.2), 1.1, 1],
    [vec3(0.45, -0.4, 0), vec3(0.9, -0.4, -0.3), 1.3, 2],
    [vec3(-0.45, -0.4, 0), vec3(-0.9, -0.4, -0.3), 1.3, 3],
    [vec3(0.1, -0.55, 0.1), vec3(0.2, -0.8, 0.5), 1.0, 4],
    [vec3(-0.1, -0.55, 0.1), vec3(-0.2, -0.8, 0.5), 1.0, 5],
    [vec3(0.04, -1.35, 0), vec3(0.25, -1, -0.2), 1.2, 6],
    [vec3(-0.04, -1.35, 0), vec3(-0.25, -1, -0.2), 1.2, 7],
  ];
  const fls = cfg.map(() => {
    const f = new Flagellum(fm, { n: 30, rad: 5, r0: 0.028, r1: 0.012 });
    specimen.add(f.mesh);
    return f;
  });
  const fg = new THREE.Group();
  fls.forEach((f) => fg.add(f.mesh));
  specimen.group.add(fg);
  specimen.part(
    'Eight flagella',
    'Four pairs of flagella (anterior, posterior-lateral, ventral and caudal) beat in different patterns. Together they make the tumbling, falling-leaf swimming that Giardia is known for.',
    fg,
  );
  specimen.anim((t) => {
    cfg.forEach((c, i) => {
      const d = c[1].clone().normalize();
      const s = perpendicularDirection(d);
      fls[i].wave(c[0], d, s, c[2], 0.22, 1.4, 10, t + i * 0.7);
    });
    specimen.group.rotation.z = Math.sin(t * 0.8) * 0.06;
    specimen.group.rotation.y = Math.sin(t * 0.5) * 0.12;
  });
}

/* ================= ROTIFER ================= */
export function buildRotifer(specimen) {
  const points = [
    [0, -2.3],
    [0.1, -2.25],
    [0.2, -1.95],
    [0.19, -1.55],
    [0.3, -1.2],
    [0.55, -0.9],
    [0.7, -0.3],
    [0.66, 0.4],
    [0.45, 0.95],
    [0.4, 1.25],
    [0.52, 1.45],
    [0.5, 1.72],
    [0.3, 1.86],
    [0, 1.9],
  ].map(([r, y]) => vec2(r, y));
  const cp = new THREE.SplineCurve(points).getPoints(140).map((q) => vec2(Math.max(q.x, 0), q.y));
  const lg = new THREE.LatheGeometry(cp, 56);
  const pp = lg.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const y = pp.getY(i);
    const f =
      1 + 0.025 * Math.sin(y * 12) * smoothStep(-1.4, -0.6, y) * (1 - smoothStep(0.8, 1.2, y));
    pp.setX(i, pp.getX(i) * f);
    pp.setZ(i, pp.getZ(i) * f);
  }
  lg.computeVertexNormals();
  const body = specimen.mesh(lg, materialFactory.shell(0xd9d2b8, 0.22, { iridescence: 0.3 }), {
    ro: 8,
  });
  specimen.part(
    'Cuticle and body wall',
    'A thin, flexible cuticle covers the body. Rotifers are built like a telescope: the head, trunk and foot can slide in and out of one another, giving the animal its inching, stretching movement.',
    body,
    { shell: true },
  );
  // corona
  const rings = [
    [1.74, 0.46],
    [1.46, 0.54],
  ];
  const cg = new THREE.CylinderGeometry(0.004, 0.011, 0.26, 5);
  cg.translate(0, 0.13, 0);
  const NCR = 70;
  const cil = createInstancedMesh(
    cg,
    materialFactory.soft(0xe4efe8, { transparent: true, opacity: 0.65 }),
    NCR * 2,
  );
  const cm = materialFactory.soft(0xc7b88a, { transparent: true, opacity: 0.85 });
  const cor = new THREE.Group();
  rings.forEach(([y, r]) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 10, 48), cm);
    t.rotation.x = Math.PI / 2;
    t.position.y = y;
    cor.add(t);
  });
  cor.add(cil);
  specimen.add(cor);
  specimen.part(
    'Corona (wheel organ)',
    'Two rings of cilia at the head beat in sequence, which looks like a pair of spinning wheels. They sweep algae into the mouth and also pull the animal through the water.',
    cor,
  );
  // mastax
  const mastax = new THREE.Group();
  mastax.position.y = 0.55;
  specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xe7c98f, 0.35), {
    parent: mastax,
    s: vec3(0.36, 0.34, 0.32),
    ro: 4,
  });
  const jm = materialFactory.soft(0x6a4a24, { roughness: 0.35 });
  const jaws = [-1, 1].map((s) => {
    const j = new THREE.Group();
    j.position.set(s * 0.1, 0, 0);
    for (let k = 0; k < 4; k++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 6), jm);
      c.position.set(0, 0.1 - k * 0.08, 0);
      c.rotation.z = -s * 1.45;
      j.add(c);
    }
    const b = new THREE.Mesh(sharedGeometries.capsule, jm);
    b.scale.set(0.05, 0.26, 0.05);
    b.position.x = s * 0.08;
    j.add(b);
    mastax.add(j);
    return j;
  });
  specimen.add(mastax);
  specimen.part(
    'Mastax and trophi',
    'A muscular throat holding a set of hard, jaw-like pieces called trophi. They grind food by opening and closing many times a second. Their shape is used by biologists to tell rotifer species apart.',
    mastax,
  );
  const brain = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.soft(0xe9d9b8, { transparent: true, opacity: 0.85 }),
    { p: vec3(0, 1.2, -0.05), s: vec3(0.2, 0.12, 0.14) },
  );
  const eyes = [-1, 1].map((s) =>
    specimen.mesh(sharedGeometries.sphere, materialFactory.emit(0xd62828, 0.7), {
      p: vec3(s * 0.14, 1.22, 0.2),
      s: 0.045,
    }),
  );
  const eg = new THREE.Group();
  eg.add(brain);
  eyes.forEach((e) => eg.add(e));
  specimen.group.add(eg);
  specimen.part(
    'Brain and eyespots',
    'A small cerebral ganglion sits above the mastax. Two red eyespots detect light and dark but do not form images, which helps the rotifer find light and avoid dim, unsafe water.',
    eg,
  );
  const st = new THREE.Group();
  st.position.y = -0.35;
  specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0x9fd88a, 0.32), {
    parent: st,
    s: vec3(0.34, 0.5, 0.32),
    ro: 4,
  });
  const random = createSeededRandom(6);
  const gm = materialFactory.soft(0x58a64a);
  const gi = createInstancedMesh(sharedGeometries.sphereLo, gm, 40);
  for (let i = 0; i < 40; i++) {
    setInstanceTransform(
      gi,
      i,
      randomPointInUnitBall(random).multiply(vec3(0.26, 0.4, 0.24)),
      null,
      0.03 + random() * 0.02,
    );
  }
  st.add(gi);
  specimen.add(st);
  specimen.part(
    'Stomach',
    'Algae and bacteria collect here. The green colour comes from the plant material the rotifer has just eaten. Cells lining the stomach secrete enzymes and absorb the nutrients.',
    st,
  );
  const bl = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xbfe8ff, 0.45), {
    p: vec3(0, -1.1, 0.15),
    s: 0.1,
    ro: 4,
  });
  specimen.part(
    'Contractile bladder',
    'A small bladder that collects water and waste from excretory tubes (protonephridia) and releases it every minute or so. It keeps the body fluid in balance.',
    bl,
  );
  const egg = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xf3e1b5, 0.4), {
    p: vec3(0.22, -0.8, 0.12),
    s: vec3(0.17, 0.22, 0.15),
    ro: 4,
  });
  specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xe7cf9e), { parent: egg, s: 0.5 });
  specimen.part(
    'Ovary and egg',
    'Most rotifers are female and lay eggs that develop without fertilisation (parthenogenesis). A growing egg is visible next to the stomach.',
    egg,
  );
  const toes = [-1, 1].map((s) =>
    specimen.mesh(new THREE.ConeGeometry(0.07, 0.35, 8), materialFactory.soft(0xcdbf99), {
      p: vec3(s * 0.09, -2.4, 0),
      r: [0, 0, s * 0.15],
    }),
  );
  const foot = new THREE.Group();
  toes.forEach((t) => foot.add(t));
  specimen.group.add(foot);
  specimen.part(
    'Foot and toes',
    'The foot ends in two toes with glands that release a sticky secretion. The rotifer anchors itself with them while the corona feeds, and detaches to swim off.',
    foot,
  );
  const q = new THREE.Quaternion();
  const dir = vec3();
  const up = vec3(0, 1, 0);
  specimen.anim((t) => {
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < NCR; i++) {
        const angle = (i / NCR) * TAU;
        const [y, rr] = rings[r];
        const n = vec3(Math.cos(angle), 0, Math.sin(angle));
        const a = 0.5 + 0.5 * Math.sin(8 * t - angle * 3 * (r ? 1 : -1));

        dir
          .set(Math.cos(angle) * (1 - a * 0.4), 0.5 + a * 0.35, Math.sin(angle) * (1 - a * 0.4))
          .normalize()
          .add(
            vec3(-Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(
              0.5 * Math.sin(8 * t - angle * 3),
            ),
          )
          .normalize();
        q.setFromUnitVectors(up, dir);
        setInstanceTransform(cil, r * NCR + i, vec3(n.x * rr, y + 0.02, n.z * rr), q, 1);
      }
    }
    cil.instanceMatrix.needsUpdate = true;
    const o = 0.55 + 0.45 * Math.sin(t * 5);
    jaws[0].rotation.z = -0.35 * o;
    jaws[1].rotation.z = 0.35 * o;
    specimen.group.scale.set(1, 1 + 0.025 * Math.sin(t * 0.8), 1);
    specimen.group.rotation.z = 0.1 * Math.sin(t * 0.4);
  });
}
