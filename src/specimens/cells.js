/**
 * Specimens: cells.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  sharedGeometries,
  AnimatedTube,
  createInstancedMesh,
  createCylinderBetween,
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
  fractalNoise3D,
  fibonacciSphere,
  lerp,
  quaternionFromUp,
  randomDirection,
  randomPointInUnitBall,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';
import {
  bendGeometry,
  createGolgiApparatus,
  createMitochondrionMaterials,
  createMitochondrion,
  createNuclearPores,
  createRibosomeCloud,
} from '../engine/organelles.js';
import { textureLibrary } from '../engine/textures.js';
import { loopCurve, createSpikeGeometry } from './classic-bacteria-and-viruses.js';
import { Amoeboid } from './classic-protists.js';

/* ================= RED BLOOD CELL ================= */
export function createRedBloodCellLathe(R, nProfile, segmentCount, k = 1) {
  const h = (r) => {
    const x = r / R;
    return (
      0.5 *
      R *
      Math.sqrt(Math.max(0, 1 - x * x)) *
      (0.2072 + 2.0026 * x * x - 1.1228 * Math.pow(x, 4)) *
      k
    );
  };
  const points = [];
  for (let i = 0; i <= nProfile; i++) {
    const r = (R * i) / nProfile;
    points.push(vec2(Math.max(r, 0.0005), -h(r)));
  }
  for (let i = nProfile; i >= 0; i--) {
    const r = (R * i) / nProfile;
    points.push(vec2(Math.max(r, 0.0005), h(r)));
  }
  return new THREE.LatheGeometry(points, segmentCount);
}
export function buildRedBloodCell(specimen) {
  const R = 1.6;
  const geometry = createRedBloodCellLathe(R, 90, 120);
  const p = geometry.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c1 = new THREE.Color(0xd23a3a);
  const c2 = new THREE.Color(0x7d0a14);
  const tc = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const h = Math.abs(p.getY(i)) / (R * 0.33);
    const r = Math.hypot(p.getX(i), p.getZ(i)) / R;
    tc.copy(c1).lerp(c2, clamp(smoothStep(0.0, 1, h * 0.8 + r * 0.25), 0, 1));
    col[i * 3] = tc.r;
    col[i * 3 + 1] = tc.g;
    col[i * 3 + 2] = tc.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const hg = new THREE.Group();
  specimen.add(hg);
  const mem = specimen.mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.35,
      clearcoat: 0.9,
      clearcoatRoughness: 0.25,
      sheen: 1,
      sheenColor: new THREE.Color(0xff6a6a),
      sheenRoughness: 0.4,
      emissive: 0x3a0508,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.93,
    }),
    { parent: hg, ro: 6 },
  );
  specimen.part(
    'Biconcave disc and membrane',
    'The cell is a flexible disc about 7.5 micrometres across and only 2 micrometres thick, thinner in the middle. This shape gives a large surface for gas exchange, and the membrane (lipid bilayer reinforced by a spectrin network) lets it fold to squeeze through capillaries narrower than itself.',
    mem,
  );
  const hb = specimen.mesh(
    createRedBloodCellLathe(R * 0.92, 50, 64, 0.85),
    materialFactory.soft(0x9d0d1c, { emissive: 0x6a0810, emissiveIntensity: 0.5 }),
    { parent: hg, ro: 5 },
  );
  specimen.part(
    'Haemoglobin',
    'Each cell holds about 270 million haemoglobin molecules, making up roughly a third of its weight. Haemoglobin contains iron, binds oxygen in the lungs and releases it in the tissues, and gives blood its red colour.',
    hb,
  );
  const net = specimen.mesh(
    createRedBloodCellLathe(R * 1.006, 14, 24),
    new THREE.MeshBasicMaterial({
      color: 0xff9a8f,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
    { parent: hg, ro: 7 },
  );
  specimen.part(
    'Spectrin cytoskeleton',
    'A mesh of spectrin and actin lies against the inside face of the membrane, shown here as a net. It keeps the disc shape and makes the cell springy, so it returns to form after each squeeze through a capillary.',
    net,
  );
  const ghost = specimen.mesh(
    new THREE.IcosahedronGeometry(0.5, 2),
    new THREE.MeshBasicMaterial({
      color: 0x9fb8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
    { parent: hg, ro: 7 },
  );
  specimen.part(
    'No nucleus',
    'Mature red blood cells have no nucleus, no mitochondria and no DNA. The faint outline marks the space a typical nucleus would take up. The cell ejects it during development, which makes room for more haemoglobin but means it cannot divide or repair itself and lives about 120 days.',
    ghost,
  );
  const NO = 11;
  const om = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.4,
    clearcoat: 0.8,
    sheen: 1,
    sheenColor: new THREE.Color(0xff6a6a),
    emissive: 0x3a0508,
    emissiveIntensity: 0.3,
  });
  const others = createInstancedMesh(geometry, om, NO);
  const od = [];
  const r = createSeededRandom(31);
  for (let i = 0; i < NO; i++) {
    const d = randomDirection(r);
    const dist = 3.2 + r() * 3.3;
    od.push({
      p: d.multiplyScalar(dist),
      a: vec3(r() * 3, r() * 3, r() * 3),
      w: vec3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.5),
      s: 0.45 + r() * 0.25,
    });
  }
  specimen.add(others);
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  specimen.anim((t) => {
    hg.rotation.set(0.95 + 0.45 * Math.sin(t * 0.35), t * 0.3, 0.5 * Math.sin(t * 0.27));
    od.forEach((o, i) => {
      e.set(o.a.x + o.w.x * t, o.a.y + o.w.y * t, o.a.z + o.w.z * t);
      q.setFromEuler(e);
      setInstanceTransform(
        others,
        i,
        vec3(o.p.x, o.p.y + Math.sin(t * 0.4 + i) * 0.15, o.p.z),
        q,
        o.s,
      );
    });
    others.instanceMatrix.needsUpdate = true;
  });
}

/* ================= WHITE BLOOD CELL ================= */
export function buildWhiteBloodCell(specimen) {
  const random = createSeededRandom(23);
  const body = new Amoeboid(96, 64);
  const sc = vec3(1, 1, 1);
  let T = 0;
  let ext = 0;
  const rfn = (x, y, z) =>
    1 +
    0.05 * fractalNoise3D(x * 3 + T * 0.2, y * 3, z * 3 + T * 0.15) +
    ext * Math.exp((x - 1) * 4.5) +
    0.05 * Math.sin(x * 7 + T) * Math.sin(y * 6 - T * 0.8);
  const mem = specimen.mesh(
    body.geo,
    materialFactory.shell(0xd9d2c2, 0.3, {
      iridescence: 0.45,
      iridescenceIOR: 1.3,
      bumpScale: 0.9,
    }),
    { ro: 9 },
  );
  specimen.part(
    'Cell membrane and pseudopod',
    'A highly ruffled membrane that can reshape quickly. The bulge on the right is a pseudopod: the cell crawls towards infection by following chemical signals, squeezing between the cells of blood vessel walls.',
    mem,
    { shell: true },
  );
  const pt = (d, f, o) => o.copy(d).multiplyScalar(rfn(d.x, d.y, d.z) * f);
  const lobes = [
    vec3(-0.3, 0.12, 0.1),
    vec3(0.05, 0.28, -0.12),
    vec3(0.2, -0.15, 0.1),
    vec3(-0.1, -0.3, -0.12),
  ].map((v) => v.normalize());
  const lf = [0.34, 0.38, 0.36, 0.34];
  const nm = materialFactory.grain(0x5b4fa8, { roughness: 0.5 });
  const nuc = new THREE.Group();
  const lm = lobes.map(() => {
    const mesh = new THREE.Mesh(sharedGeometries.sphere, nm);
    mesh.scale.setScalar(0.25);
    mesh.renderOrder = 3;
    nuc.add(mesh);
    return mesh;
  });
  const strands = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(sharedGeometries.cyl, nm);
    nuc.add(s);
    strands.push(s);
  }
  specimen.add(nuc);
  specimen.part(
    'Multi-lobed nucleus',
    'A neutrophil nucleus has three to five connected lobes. The segmented shape lets the cell squeeze through very narrow gaps in tissue. Neutrophils are the most common white blood cell and the first to arrive at an infection.',
    nuc,
  );
  const NG = 170;
  const gr = createInstancedMesh(
    sharedGeometries.sphereLo,
    materialFactory.soft(0xd7a6d9, { roughness: 0.45 }),
    NG,
  );
  const gd = [];
  for (let i = 0; i < NG; i++) {
    gd.push({
      d: randomDirection(random),
      f: 0.25 + 0.65 * Math.cbrt(random()),
      s: 0.03 + random() * 0.02,
    });
  }
  specimen.add(gr);
  specimen.part(
    'Granules',
    'The cytoplasm is full of small granules that hold digestive enzymes, antimicrobial proteins and compounds such as myeloperoxidase. They are released onto, or into, the microbes the cell captures.',
    gr,
  );
  const ph = new THREE.Group();
  specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xdff3ff, 0.38), {
    parent: ph,
    s: 0.27,
    ro: 4,
  });
  specimen.mesh(sharedGeometries.capsule, materialFactory.soft(0x8a9a3a), {
    parent: ph,
    r: [0, 0, 1],
    s: vec3(0.07, 0.16, 0.07),
  });
  specimen.mesh(sharedGeometries.sphereLo, materialFactory.soft(0xd7a6d9), {
    parent: ph,
    p: vec3(0.2, 0.12, 0),
    s: 0.05,
  });
  specimen.add(ph);
  specimen.part(
    'Phagosome',
    'A bacterium captured by phagocytosis sits inside a membrane-bound bubble. Lysosome-like granules fuse with it and flood it with enzymes and reactive oxygen, which destroys the microbe.',
    ph,
  );
  const rg = createSpikeGeometry([
    [new THREE.CylinderGeometry(0.008, 0.01, 0.08, 5), 0.04],
    [sharedGeometries.sphereLo, 0.09, [0.025, 0.025, 0.025]],
  ]);
  const NRc = 130;
  const rec = createInstancedMesh(rg, materialFactory.soft(0x9ee0d6, { roughness: 0.4 }), NRc);
  const rd = fibonacciSphere(NRc);
  specimen.add(rec);
  specimen.part(
    'Surface receptors',
    'Protein receptors stud the membrane. Some recognise molecular patterns on bacteria, others sense chemical signals from damaged tissue, and antibody receptors bind microbes marked for destruction.',
    rec,
  );
  const tmp = vec3();

  const dB = vec3(0.45, -0.35, 0.3).normalize();
  specimen.anim((t) => {
    T = t;
    ext = 0.22 + 0.12 * Math.sin(t * 0.6);
    body.update(rfn, sc);
    lobes.forEach((d, i) => pt(d, lf[i], lm[i].position));
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ].forEach(([a, b], i) => {
      const A = lm[a].position;
      const B = lm[b].position;
      const s = strands[i];
      s.position.copy(A).add(B).multiplyScalar(0.5);
      s.scale.set(0.03, A.distanceTo(B), 0.03);
      s.quaternion.copy(quaternionFromUp(B.clone().sub(A)));
    });
    gd.forEach((g, i) => {
      pt(g.d, g.f, tmp);
      setInstanceTransform(gr, i, tmp, null, g.s);
    });
    gr.instanceMatrix.needsUpdate = true;
    pt(dB, 0.52, ph.position);
    rd.forEach((d, i) => {
      pt(d, 1.0, tmp);
      setInstanceTransform(rec, i, tmp, quaternionFromUp(d), 1);
    });
    rec.instanceMatrix.needsUpdate = true;
    specimen.group.rotation.y = Math.sin(t * 0.3) * 0.3;
  });
}

/* ================= NEURON ================= */
export function buildNeuron(specimen) {
  const random = createSeededRandom(27);
  const SX = -3;
  const sg = new THREE.SphereGeometry(1, 72, 52);
  const sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i);
    const y = sp.getY(i);
    const z = sp.getZ(i);
    const r =
      1 +
      0.13 * fractalNoise3D(x * 1.6 + 3, y * 1.6, z * 1.6) +
      0.12 * Math.pow(Math.max(0, x * -0.7 + y * 0.5), 3);
    sp.setXYZ(i, x * r * 0.6, y * r * 0.62, z * r * 0.55);
  }
  sg.computeVertexNormals();
  const soma = specimen.mesh(sg, materialFactory.shell(0xe8c9a0, 0.42, { bumpScale: 0.8 }), {
    p: vec3(SX, 0, 0),
    ro: 9,
  });
  specimen.part(
    'Soma (cell body)',
    'The cell body keeps the neuron alive. It makes the proteins and membranes the rest of the cell needs, and integrates the thousands of signals arriving from the dendrites. It is typically 4 to 100 micrometres wide.',
    soma,
    { shell: true },
  );
  const nuc = specimen.mesh(sharedGeometries.sphere, materialFactory.grain(0x8f7fc0), {
    p: vec3(SX, 0, 0),
    s: 0.27,
    ro: 3,
  });
  specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0x3c3270), { parent: nuc, s: 0.35 });
  specimen.part(
    'Nucleus',
    'A large, pale nucleus with a prominent nucleolus. Neurons stop dividing after birth, so most of the neurons you have now are the ones you grew early in life.',
    nuc,
  );
  const ni = createInstancedMesh(sharedGeometries.sphereMid, materialFactory.soft(0x6f5aa8), 70);
  for (let i = 0; i < 70; i++) {
    const p = randomPointInUnitBall(random);
    if (p.length() < 0.45) {
      p.setLength(0.5 + random() * 0.2);
    }
    setInstanceTransform(
      ni,
      i,
      p.multiply(vec3(0.55, 0.55, 0.5)).add(vec3(SX, 0, 0)),
      null,
      vec3(0.035 + random() * 0.02, 0.025, 0.035),
    );
  }
  specimen.add(ni);
  specimen.part(
    'Nissl bodies',
    'Clumps of rough endoplasmic reticulum and ribosomes that stain dark with basic dyes. Their abundance reflects how much protein the neuron makes, to sustain its signalling.',
    ni,
  );
  // dendrites
  const dm = materialFactory.soft(0xe9cfae, { roughness: 0.5, transparent: true, opacity: 0.96 });
  const dg = new THREE.Group();
  const spineSites = [];
  const grow = (o, d, len, rad, depth) => {
    const side = perpendicularDirection(d);
    const up = vec3().crossVectors(d, side);
    const points = [o.clone()];
    for (let k = 1; k <= 4; k++) {
      points.push(
        o
          .clone()
          .addScaledVector(d, (len * k) / 4)
          .addScaledVector(side, (random() - 0.5) * len * 0.25)
          .addScaledVector(up, (random() - 0.5) * len * 0.2),
      );
    }
    const cur = new THREE.CatmullRomCurve3(points);
    const tp = cur.getPoints(14);
    dg.add(createTubeThroughPoints(tp, 7, (t) => rad * (1 - t * 0.45), dm));
    if (depth > 0) {
      for (let i = 0; i < 4; i++) {
        const t = random();
        const p = cur.getPoint(t);
        const n = randomDirection(random);
        spineSites.push({ p, n });
      }
    }
    if (depth < 3) {
      const end = points[4];
      const dir = end.clone().sub(points[3]).normalize();
      for (let c = 0; c < 2; c++) {
        const nd = dir.clone().addScaledVector(randomDirection(random), 0.75).normalize();
        grow(end, nd, len * 0.66, rad * 0.66, depth + 1);
      }
    }
  };
  [
    [-1, 0.5, 0.1],
    [-0.7, 1, -0.2],
    [-0.1, 1, 0.3],
    [-1, -0.4, 0.1],
    [-0.5, -1, -0.1],
    [-0.05, -1, 0.2],
    [-0.8, 0.1, -0.9],
    [-0.7, 0.1, 0.9],
  ].forEach((v) => {
    const d = vec3(...v).normalize();
    grow(vec3(SX, 0, 0).addScaledVector(d, 0.5), d, 1.05, 0.1, 0);
  });
  specimen.add(dg);
  specimen.part(
    'Dendrites',
    'Branching extensions that receive signals from other neurons. A single neuron can have thousands of inputs. The tree-like branching greatly increases the surface area available for synapses.',
    dg,
  );
  const spG = createSpikeGeometry([
    [new THREE.CylinderGeometry(0.009, 0.012, 0.05, 4), 0.025],
    [sharedGeometries.sphereLo, 0.06, [0.024, 0.024, 0.024]],
  ]);
  const NSP = Math.min(260, spineSites.length);
  const spi = createInstancedMesh(spG, materialFactory.soft(0xf0dcc0), NSP);
  spineSites
    .slice(0, NSP)
    .forEach((s, i) => setInstanceTransform(spi, i, s.p, quaternionFromUp(s.n), 1));
  specimen.add(spi);
  specimen.part(
    'Dendritic spines',
    'Tiny protrusions on the dendrites, each carrying one or more synapses. Spines grow, shrink and change as we learn, which is one physical basis of memory.',
    spi,
  );
  // axon

  const ax1 = vec3(3.2, 0, 0);
  const apath = new THREE.CatmullRomCurve3([
    vec3(SX + 0.45, 0, 0),
    vec3(SX + 1.1, 0.02, 0),
    vec3(-1, 0.2, 0.1),
    vec3(1, -0.2, -0.1),
    vec3(2.6, 0.12, 0),
    ax1,
  ]);
  const hill = createTubeAlongCurve(
    new THREE.CatmullRomCurve3([
      vec3(SX + 0.35, 0, 0),
      vec3(SX + 0.75, 0, 0),
      vec3(SX + 1.0, 0.015, 0),
    ]),
    10,
    10,
    (t) => lerp(0.2, 0.06, Math.pow(t, 0.6)),
    dm,
  );
  const ax = createTubeAlongCurve(apath, 150, 8, 0.055, materialFactory.soft(0xf0d2d6));
  const axg = new THREE.Group();
  axg.add(hill, ax);
  specimen.add(axg);
  specimen.part(
    'Axon hillock and axon',
    'The axon hillock is where the neuron decides whether to fire. When enough input has arrived, it triggers an action potential that travels along the axon, a single fibre that can be more than a metre long in humans.',
    axg,
  );
  const NM = 8;
  const gap = 0.12;
  const total = apath.getLength() - 1.1;
  const L1 = (total - gap * NM) / NM;
  const mg = new THREE.Group();
  const mats = [];
  const nodes = new THREE.Group();
  const mp = [];
  const nodeX = [];

  for (let i = 0; i < NM; i++) {
    const u0 = 1.1 / apath.getLength() + (i * (L1 + gap)) / apath.getLength();
    const uc = u0 + L1 / 2 / apath.getLength();
    const c = apath.getPointAt(Math.min(uc, 1));
    const tg2 = apath.getTangentAt(Math.min(uc, 1));
    const m = materialFactory.shell(0xf3e8c4, 0.6, {
      bumpScale: 0.3,
      emissive: 0x2cd6c8,
      emissiveIntensity: 0,
    });
    const s = new THREE.Mesh(sharedGeometries.sphere, m);
    s.position.copy(c);
    s.scale.set(L1 / 2, 0.15, 0.15);
    s.quaternion.setFromUnitVectors(vec3(1, 0, 0), tg2);
    s.renderOrder = 6;
    mg.add(s);
    mats.push(m);
    mp.push(c.x);
    const un = u0 + (L1 + gap / 2) / apath.getLength();
    if (i < NM - 1) {
      const nc = apath.getPointAt(Math.min(un, 1));
      const n = new THREE.Mesh(
        new THREE.TorusGeometry(0.075, 0.016, 8, 20),
        materialFactory.emit(0x7fe0d6, 0.5),
      );
      n.position.copy(nc);
      n.quaternion.setFromUnitVectors(vec3(0, 0, 1), apath.getTangentAt(Math.min(un, 1)));
      nodes.add(n);
      nodeX.push(nc.x);
    }
  }
  specimen.add(mg);
  specimen.add(nodes);
  specimen.part(
    'Myelin sheath',
    'Segments of fatty insulation wrapped around the axon by support cells (oligodendrocytes in the brain, Schwann cells in nerves). Myelin makes signals travel up to 100 times faster and saves energy. Damage to it underlies diseases such as multiple sclerosis.',
    mg,
  );
  specimen.part(
    'Nodes of Ranvier',
    'Small gaps between myelin segments where the axon membrane is exposed and crowded with sodium channels. The action potential jumps from node to node, called saltatory conduction.',
    nodes,
  );
  const bg = new THREE.Group();
  const bm = materialFactory.glass(0xf1c27d, 0.4);
  const vm = materialFactory.emit(0x7fe0d6, 0.6);
  const nvs = createInstancedMesh(sharedGeometries.sphereLo, vm, 40);
  let vi = 0;
  [
    [0.55, 0.45, 0.15],
    [0.7, 0.15, -0.25],
    [0.6, -0.2, 0.25],
    [0.5, -0.55, -0.1],
  ].forEach(([dx, dy, dz]) => {
    const end = vec3(ax1.x + dx, dy, dz);
    bg.add(
      createTubeThroughPoints(
        new THREE.CatmullRomCurve3([
          ax1,
          vec3(ax1.x + dx * 0.5, dy * 0.4, dz * 0.4),
          end.clone().addScaledVector(vec3(dx, dy, dz).normalize(), -0.1),
        ]).getPoints(10),
        6,
        (t) => 0.045 * (1 - t * 0.3),
        materialFactory.soft(0xf0d2d6),
      ),
    );
    const b = new THREE.Mesh(sharedGeometries.sphere, bm);
    b.position.copy(end);
    b.scale.setScalar(0.13);
    b.renderOrder = 6;
    bg.add(b);
    for (let k = 0; k < 10; k++) {
      setInstanceTransform(
        nvs,
        vi++,
        end.clone().add(randomPointInUnitBall(random).multiplyScalar(0.08)),
        null,
        0.018,
      );
    }
  });
  specimen.add(bg);
  specimen.add(nvs);
  specimen.part(
    'Axon terminals',
    'The axon ends in swellings called boutons. When an action potential arrives, vesicles inside fuse with the membrane and release neurotransmitter across the synapse to the next cell, within a fraction of a millisecond.',
    bg,
  );
  specimen.part(
    'Synaptic vesicles',
    'Hundreds of tiny membrane bubbles packed with neurotransmitter, such as glutamate. Calcium entering the terminal makes them fuse and empty into the synaptic gap.',
    nvs,
  );
  const pulse = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.emit(0x4df0e0, 2.2, { transparent: true, opacity: 0.9 }),
    { s: 0.09, ro: 10 },
  );
  specimen.anim((t) => {
    const cyc = (t * 0.75) % 4.2;
    const s = clamp(cyc / 3.4, 0, 1);
    const on = cyc < 3.5;
    pulse.visible = on;
    if (on) {
      const u = lerp(0.17, 1, s);
      const p = apath.getPointAt(u);
      pulse.position.copy(p);
      pulse.scale.setScalar(0.075 + 0.02 * Math.sin(t * 14));
    }
    mats.forEach((m, i) => {
      const base = m.userData.hl ? m.emissiveIntensity : 0;
      m.emissiveIntensity = Math.max(
        base * 0,
        on ? 0.55 * Math.exp(-Math.pow((pulse.position.x - mp[i]) / 0.55, 2)) : 0,
      );
    });
    nvs.material.emissiveIntensity = 0.5 + (cyc > 3.3 && cyc < 3.9 ? 1.5 : 0);
  });
}

/* ================= MUSCLE CELL ================= */
export function buildMuscle(specimen) {
  const random = createSeededRandom(33);
  const fib0 = new THREE.Group();
  fib0.rotation.z = Math.PI / 2;
  specimen.add(fib0);
  const prof = [];
  for (let i = 0; i <= 44; i++) {
    const y = -2.8 + (5.6 * i) / 44;
    prof.push(
      vec2(Math.max(0.0005, 0.8 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(y) / 2.8, 10)))), y),
    );
  }
  const sl = specimen.mesh(
    new THREE.LatheGeometry(prof, 60),
    materialFactory.shell(0xe6b5a0, 0.2, { iridescence: 0.3, bumpScale: 0.6 }),
    { parent: fib0, ro: 9 },
  );
  specimen.part(
    'Sarcolemma',
    'The plasma membrane of the muscle fibre. A fibre is a single, very long cell formed when many precursor cells fused, which is why it contains many nuclei. Signals travel along the sarcolemma and down into the fibre.',
    sl,
    { shell: true },
  );
  const mm = materialFactory.soft(0xffffff, { map: textureLibrary.sarcomere, roughness: 0.5 });
  const mf = new THREE.Group();
  const cyl = new THREE.CylinderGeometry(0.085, 0.085, 4.8, 14, 1);
  const pos = [vec3(0, 0, 0)];
  for (let i = 0; i < 6; i++) {
    pos.push(vec3(0, Math.cos((i / 6) * TAU) * 0.2, Math.sin((i / 6) * TAU) * 0.2));
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const r = i % 2 ? 0.35 : 0.39;
    pos.push(vec3(0, Math.cos(a) * r, Math.sin(a) * r));
  }
  pos.forEach((p) => {
    const mesh = new THREE.Mesh(cyl, mm);
    mesh.position.copy(p);
    mf.add(mesh);
  });
  fib0.add(mf);
  specimen.part(
    'Myofibrils (striations)',
    'Bundles of contractile filaments run the full length of the fibre. Their repeating units, the sarcomeres, line up across the bundle and create the striped look of skeletal muscle. Dark bands are thick myosin, light bands thin actin.',
    mf,
  );
  const sr = specimen.mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 4.4, 24, 18, true),
    materialFactory.soft(0xe8a0b8, { wireframe: true, transparent: true, opacity: 0.45 }),
    { parent: fib0 },
  );
  specimen.part(
    'Sarcoplasmic reticulum',
    'A net of membrane that wraps each myofibril and stores calcium. When it releases calcium, the filaments can slide and the fibre contracts; pumps then recapture it so the muscle relaxes.',
    sr,
  );
  const tt = new THREE.Group();
  const tm = materialFactory.emit(0x7fe0d6, 0.45);
  for (let i = 0; i < 16; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.014, 8, 36), tm);
    t.rotation.x = Math.PI / 2;
    t.position.y = -2.2 + i * 0.29;
    tt.add(t);
  }
  fib0.add(tt);
  specimen.part(
    'T-tubules',
    'Narrow tunnels of the sarcolemma that dive deep into the fibre. They carry the electrical signal to every sarcomere at once so the whole fibre contracts together.',
    tt,
  );
  const nm = materialFactory.grain(0x8f7fc0);
  const nuc = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const n = new THREE.Mesh(sharedGeometries.sphere, nm);
    const a = random() * TAU;
    n.position.set(Math.cos(a) * 0.7, -2.1 + i * 1.0 + random() * 0.4, Math.sin(a) * 0.7);
    n.scale.set(0.12, 0.5, 0.2);
    n.rotation.y = -a;
    nuc.add(n);
  }
  fib0.add(nuc);
  specimen.part(
    'Nuclei',
    'A single fibre has hundreds of nuclei, pushed against the membrane so they do not get in the way of the contractile machinery. They control the maintenance and growth of the fibre.',
    nuc,
  );
  const mits = new THREE.Group();
  const mmat = createMitochondrionMaterials();
  for (let i = 0; i < 14; i++) {
    const m = createMitochondrion(mmat, 1.1);
    const a = random() * TAU;
    const r = 0.56 + random() * 0.08;
    m.position.set(Math.cos(a) * r, -2.3 + random() * 4.6, Math.sin(a) * r);
    m.rotation.set(0, random() * TAU, 0);
    mits.add(m);
  }
  fib0.add(mits);
  specimen.part(
    'Mitochondria',
    'Rows of mitochondria sit between the myofibrils and supply ATP. Contraction burns a great deal of energy, so muscle fibres built for endurance contain especially many.',
    mits,
  );
  // sarcomere inset
  const ins = new THREE.Group();
  ins.position.set(0, -2.15, 0);
  specimen.add(ins);
  const zm = materialFactory.soft(0x4a1a24);
  const tkm = materialFactory.soft(0xd9a066, { roughness: 0.35 });
  const tnm = materialFactory.soft(0x9bd6c8, { roughness: 0.35 });
  const Zs = [-1, 1].map(() => {
    const z = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 24), zm);
    z.rotation.z = Math.PI / 2;
    ins.add(z);
    return z;
  });
  const lat = [vec3(0, 0, 0)].concat(
    Array.from({ length: 6 }, (_, i) =>
      vec3(0, Math.cos((i / 6) * TAU) * 0.14, Math.sin((i / 6) * TAU) * 0.14),
    ),
  );
  const thick = new THREE.Group();
  lat.forEach((p) => {
    const t = new THREE.Mesh(sharedGeometries.cyl, tkm);
    t.rotation.z = Math.PI / 2;
    t.scale.set(0.032, 1.1, 0.032);
    t.position.copy(p);
    thick.add(t);
  });
  const heads = createInstancedMesh(sharedGeometries.sphereLo, tkm, 7 * 44);
  let hi = 0;
  lat.forEach((p) => {
    for (let k = 0; k < 44; k++) {
      const x = (k < 22 ? -1 : 1) * (0.06 + (k % 22) * 0.023);
      const a = k * 1.9;
      setInstanceTransform(
        heads,
        hi++,
        vec3(x, p.y + Math.cos(a) * 0.045, p.z + Math.sin(a) * 0.045),
        null,
        0.017,
      );
    }
  });
  thick.add(heads);
  ins.add(thick);
  const thin = [[], []];
  const tl = new THREE.Group();
  [-1, 1].forEach((s, si) => {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const r = i % 2 ? 0.2 : 0.1;
      const t = new THREE.Mesh(sharedGeometries.cyl, tnm);
      t.rotation.z = Math.PI / 2;
      t.scale.set(0.014, 0.85, 0.014);
      t.position.set(0, Math.cos(a) * r, Math.sin(a) * r);
      tl.add(t);
      thin[si].push(t);
    }
  });
  ins.add(tl);
  specimen.part(
    'Z discs',
    'Z discs mark the ends of each sarcomere, the unit that repeats along every myofibril. Thin filaments are anchored to them, and the Z discs are pulled together as the sarcomere shortens.',
    Zs[0].parent === ins ? Zs : Zs,
  );
  specimen.part(
    'Thick filaments (myosin)',
    'Bundles of myosin with many heads sticking out. Powered by ATP, the heads bind the thin filaments and swing like oars, pulling the filaments past one another.',
    thick,
  );
  specimen.part(
    'Thin filaments (actin)',
    'Strands of actin, anchored at the Z discs. During contraction they slide towards the centre of the sarcomere between the myosin, so the sarcomere shortens although the filaments themselves do not change length.',
    tl,
  );
  specimen.anim((t) => {
    const k = 0.5 + 0.5 * Math.sin(t * 1.1);
    const Ls = lerp(2.15, 1.55, k);
    Zs[0].position.x = -Ls / 2;
    Zs[1].position.x = Ls / 2;
    thin[0].forEach((m) => (m.position.x = -Ls / 2 + 0.425 + 0.03));
    thin[1].forEach((m) => (m.position.x = Ls / 2 - 0.425 - 0.03));
    mm.map.repeat.y = lerp(22, 28, k);
    mm.map.needsUpdate = false;
  });
}

/* ================= EPITHELIAL CELL ================= */
export function buildEpithelial(specimen) {
  const random = createSeededRandom(37);
  const Rad = 0.55;
  const h = 2.0;
  const nd = Math.sqrt(3) * Rad * 1.04;
  const dirs = [vec3()];
  for (let k = 0; k < 6; k++) {
    const a = ((30 + 60 * k) * Math.PI) / 180;
    dirs.push(vec3(Math.sin(a) * nd, 0, Math.cos(a) * nd));
  }
  const cm = materialFactory.shell(0xd7a7c6, 0.22, { bumpScale: 0.3 });
  const gm = materialFactory.shell(0x9fc4e4, 0.24, { bumpScale: 0.3 });
  const cells = new THREE.Group();
  const gobletIdx = 3;
  dirs.forEach((p, i) => {
    const g =
      i === gobletIdx
        ? new THREE.CylinderGeometry(Rad * 1.12, Rad * 0.5, h, 6)
        : new THREE.CylinderGeometry(Rad, Rad, h, 6);
    const mesh = new THREE.Mesh(g, i === gobletIdx ? gm : cm);
    mesh.position.copy(p);
    mesh.renderOrder = 8;
    cells.add(mesh);
  });
  specimen.add(cells);
  specimen.part(
    'Columnar cells',
    'Tall, tightly packed cells form a single sheet that lines organs such as the small intestine. They absorb nutrients on the top (apical) surface and pass them down through the base into the blood supply.',
    cells,
    { shell: true },
  );
  const mvG = new THREE.CylinderGeometry(0.006, 0.008, 0.13, 4);
  mvG.translate(0, 0.065, 0);
  const NMV = 90;
  const mv = createInstancedMesh(
    mvG,
    materialFactory.soft(0xf2e4ee, { transparent: true, opacity: 0.8 }),
    NMV * 6,
  );
  let mi = 0;
  dirs.forEach((p, i) => {
    if (i === gobletIdx) {
      return;
    }
    for (let k = 0; k < NMV; k++) {
      const a = random() * TAU;
      const r = Math.sqrt(random()) * Rad * 0.82;
      setInstanceTransform(
        mv,
        mi++,
        vec3(p.x + Math.cos(a) * r, h / 2, p.z + Math.sin(a) * r),
        null,
        0.8 + random() * 0.5,
      );
    }
  });
  mv.count = mi;
  specimen.add(mv);
  specimen.part(
    'Microvilli (brush border)',
    'Thousands of finger-like projections on each cell. They multiply the absorbing surface about 20-fold and carry digestive enzymes, so the last steps of digestion happen right at the membrane.',
    mv,
  );
  const nm = materialFactory.grain(0x8f7fc0);
  const nuc = new THREE.Group();
  dirs.forEach((p) => {
    const n = new THREE.Mesh(sharedGeometries.sphere, nm);
    n.position.set(p.x, -h * 0.3, p.z);
    n.scale.set(0.3, 0.22, 0.3);
    n.renderOrder = 3;
    nuc.add(n);
  });
  specimen.add(nuc);
  specimen.part(
    'Nuclei',
    'Each cell has one nucleus, positioned near the base. Their alignment at one level helps pathologists recognise this tissue type under the microscope.',
    nuc,
  );
  const tj = new THREE.Group();
  const tm = materialFactory.emit(0x7fe0d6, 0.45);
  dirs.forEach((p, i) => {
    const t = new THREE.Mesh(
      new THREE.TorusGeometry(Rad * (i === gobletIdx ? 1.12 : 1) * 0.98, 0.014, 8, 6),
      tm,
    );
    t.rotation.x = Math.PI / 2;
    t.rotation.z = Math.PI / 2;
    t.position.set(p.x, h / 2 - 0.08, p.z);
    tj.add(t);
  });
  specimen.add(tj);
  specimen.part(
    'Tight junctions',
    'Belts of protein that seal neighbouring cells together just below the surface. They stop gut contents leaking between cells and keep the top and bottom membranes different from each other.',
    tj,
  );
  const gp = vec3(dirs[gobletIdx].x, 0, dirs[gobletIdx].z);
  const mg = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.glass(0xcfe6f7, 0.65, { roughness: 0.2 }),
    36,
  );
  for (let i = 0; i < 36; i++) {
    const a = random() * TAU;
    const r = Math.sqrt(random()) * 0.42;
    setInstanceTransform(
      mg,
      i,
      vec3(gp.x + Math.cos(a) * r, h * 0.12 + random() * h * 0.34, gp.z + Math.sin(a) * r),
      null,
      0.065 + random() * 0.03,
    );
  }
  specimen.add(mg);
  specimen.part(
    'Goblet cell mucus',
    'The wider blue-tinted cell is a goblet cell. It is packed with mucin granules that are released to coat and protect the lining. Mucus traps microbes and lets food slide through.',
    mg,
  );
  const mt = new THREE.Group();
  const mmat = createMitochondrionMaterials();
  for (let i = 0; i < 6; i++) {
    const m = createMitochondrion(mmat, 0.75);
    m.position.set(random() * 0.3 - 0.15, -0.4 + random() * 0.6, random() * 0.3 - 0.15);
    m.rotation.set(random() * 3, random() * 3, random() * 3);
    mt.add(m);
  }
  specimen.add(mt);
  specimen.part(
    'Mitochondria',
    'Absorption pumps molecules uphill and takes a lot of energy. Mitochondria cluster near the base of the cell, where the active transport proteins sit.',
    mt,
  );
  const bm = specimen.mesh(
    new THREE.BoxGeometry(5, 0.1, 5),
    materialFactory.soft(0x7e9bd1, { transparent: true, opacity: 0.8 }),
    { p: vec3(0, -h / 2 - 0.08, 0) },
  );
  const cg = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const a = random() * Math.PI;
    const c = vec3((random() - 0.5) * 4, -h / 2 - 0.22 - random() * 0.12, (random() - 0.5) * 4);
    const d = vec3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(1.2);
    cg.add(
      createCylinderBetween(
        c.clone().sub(d),
        c.clone().add(d),
        0.02,
        materialFactory.soft(0xe7dcc8),
      ),
    );
  }
  specimen.add(cg);
  specimen.part(
    'Basement membrane',
    'A thin mat of collagen and other proteins that the cell sheet rests on. It anchors the epithelium and separates it from the connective tissue beneath it, where collagen fibres run.',
    [bm, cg],
  );
  specimen.anim((t) => {
    specimen.group.rotation.y = Math.sin(t * 0.2) * 0.35;
  });
}

/* ================= PLANT CELL (and shared parts) ================= */
export function buildPlantCell(specimen) {
  const wm = materialFactory.shell(0x87b86a, 0.3, {
    bumpMap: textureLibrary.cellulose,
    bumpScale: 2,
  });
  const pm = materialFactory.shell(0xcfe3b0, 0.18, { bumpScale: 0.2 });
  const vm = materialFactory.glass(0x9ed1e8, 0.3);
  const wall = specimen.mesh(new RoundedBoxGeometry(3.4, 2.3, 2.3, 8, 0.3), wm, { ro: 10 });
  const memb = specimen.mesh(new RoundedBoxGeometry(3.2, 2.1, 2.1, 8, 0.28), pm, { ro: 9 });
  specimen.part(
    'Cell wall',
    'A rigid outer layer of cellulose fibres, hemicellulose and pectin. It gives the cell its box-like shape, supports the whole plant, and resists the pressure of water in the vacuole. Animal cells have nothing like it.',
    wall,
    { shell: true },
  );
  specimen.part(
    'Plasma membrane',
    'A thin lipid bilayer just inside the wall. It controls what enters and leaves the cell and holds the cellulose-making enzymes that build the wall from outside in.',
    memb,
    { shell: true },
  );
  const vac = specimen.mesh(new RoundedBoxGeometry(2.0, 1.3, 1.4, 8, 0.55), vm, { ro: 5 });
  specimen.part(
    'Central vacuole',
    'A huge sac of cell sap that takes up most of the cell. It stores water, sugars, ions and pigments, and its pressure (turgor) holds leaves and stems upright. A wilting plant has lost this pressure.',
    vac,
  );
  specimen.cut(wm, pm, vm);
  const nuc = new THREE.Group();
  nuc.position.set(-1.22, 0.35, 0.3);
  specimen.add(nuc);
  specimen.mesh(sharedGeometries.sphere, materialFactory.shell(0x8f7fc0, 0.5), {
    parent: nuc,
    s: 0.28,
    ro: 4,
  });
  specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0x3c3270), { parent: nuc, s: 0.09 });
  const random = createSeededRandom(41);
  const chrom = createTubeAlongCurve(
    loopCurve(random, 14, vec3(0.1, 0.1, 0.1)),
    120,
    5,
    0.01,
    materialFactory.emit(0xb7a8f5, 0.3),
  );
  nuc.add(chrom);
  specimen.part(
    'Nucleus',
    'Holds the genome inside a double membrane with pores. The dark centre is the nucleolus, where ribosomes are assembled. Plant cells usually have the nucleus pushed to the side by the big vacuole.',
    nuc,
  );
  const NC = 20;
  const chm = materialFactory.soft(0x3f9d38, {
    roughness: 0.45,
    emissive: 0x0b2a08,
    emissiveIntensity: 0.45,
  });
  const ch = createInstancedMesh(sharedGeometries.sphereMid, chm, NC);
  const cd = [];
  for (let i = 0; i < NC; i++) {
    cd.push({
      s0: random(),
      v: 0.012 + random() * 0.01,
      A: 1.36 + (random() - 0.5) * 0.1,
      B: 0.88 + (random() - 0.5) * 0.08,
      z: (random() * 2 - 1) * 0.85,
    });
  }
  specimen.add(ch);
  specimen.part(
    'Chloroplasts',
    'Green organelles with chlorophyll, where photosynthesis turns light, water and carbon dioxide into sugar and oxygen. They arrange themselves in the cell to catch as much light as possible, and stream slowly around the edge.',
    ch,
  );
  const mmat = createMitochondrionMaterials();
  const mits = new THREE.Group();
  const md = [];
  for (let i = 0; i < 8; i++) {
    const m = createMitochondrion(mmat, 0.8);
    mits.add(m);
    md.push({
      m,
      s0: random(),
      v: 0.008 + random() * 0.006,
      A: 1.27,
      B: 0.78,
      z: (random() * 2 - 1) * 0.7,
    });
  }
  specimen.add(mits);
  specimen.part(
    'Mitochondria',
    'Plants have mitochondria too. They burn sugar made in the chloroplasts to release ATP for growth and transport at night and in tissues without light, such as roots.',
    mits,
  );
  const gl = createGolgiApparatus(
    materialFactory.soft(0xe0b062, { transparent: true, opacity: 0.95 }),
    materialFactory.soft(0xe9c585),
    0.75,
  );
  gl.position.set(-0.55, -0.75, 0.5);
  gl.rotation.z = 0.3;
  specimen.add(gl);
  specimen.part(
    'Golgi apparatus',
    'Stacks of flattened sacs that sort, modify and package proteins and lipids. In plants they also make the complex sugars used to build the cell wall.',
    gl,
  );
  const er = new THREE.Group();
  const em = materialFactory.soft(0x8bb9d8, { transparent: true, opacity: 0.75 });
  for (let i = 0; i < 6; i++) {
    random() * TAU;
    const c = loopCurve(random, 6, vec3(0.45, 0.3, 0.35), false);
    const t = createTubeAlongCurve(c, 40, 6, 0.028, em);
    t.position.set(
      -1.2 + (random() - 0.5) * 0.3,
      0.35 + (random() - 0.5) * 0.3,
      0.3 + (random() - 0.5) * 0.3,
    );
    er.add(t);
  }
  specimen.add(er);
  specimen.part(
    'Endoplasmic reticulum',
    'A network of membrane tubes and sheets joined to the nuclear envelope. It makes and folds proteins and lipids, and links neighbouring cells through the plasmodesmata.',
    er,
  );
  const pd = new THREE.Group();
  const pdm = materialFactory.soft(0xc7e0a0);
  [
    [0.5, 0.2],
    [-0.4, -0.35],
    [0.1, 0.6],
  ].forEach(([y, z]) => {
    const c = new THREE.Mesh(sharedGeometries.cyl, pdm);
    c.rotation.z = Math.PI / 2;
    c.position.set(1.65, y, z);
    c.scale.set(0.06, 0.3, 0.06);
    pd.add(c);
  });
  specimen.add(pd);
  specimen.part(
    'Plasmodesmata',
    'Tiny channels that pass through the cell wall and connect the cytoplasm of neighbouring cells. Water, nutrients and signalling molecules move through, so the plant works like one connected body.',
    pd,
  );
  const lp = (s, A, B, z, o) => {
    const c = Math.cos(TAU * s);
    const sn = Math.sin(TAU * s);
    return o.set(
      A * Math.sign(c) * Math.pow(Math.abs(c), 0.55),
      B * Math.sign(sn) * Math.pow(Math.abs(sn), 0.55),
      z,
    );
  };
  const tmp = vec3();
  const q = new THREE.Quaternion();
  specimen.anim((t) => {
    cd.forEach((c, i) => {
      lp(c.s0 + t * c.v, c.A, c.B, c.z, tmp);
      q.setFromEuler(new THREE.Euler(t * 0.2 + i, i, 0));
      setInstanceTransform(ch, i, tmp, q, vec3(0.2, 0.1, 0.1));
    });
    ch.instanceMatrix.needsUpdate = true;
    md.forEach((o) => {
      lp(o.s0 + t * o.v, o.A, o.B, o.z, o.m.position);
      o.m.rotation.set(o.s0 * 6 + t * 0.1, 0, o.s0 * 3);
    });
  });
}

/* ================= GUARD CELLS ================= */
export function buildGuard(specimen) {
  const random = createSeededRandom(43);
  const n = 44;
  const gm = materialFactory.shell(0x8fcf7a, 0.42, { bumpScale: 0.5, iridescence: 0.2 });
  const tubes = [1, -1].map(() => new AnimatedTube(n, 22, gm));
  const points = [
    Array.from({ length: n + 1 }, () => vec3()),
    Array.from({ length: n + 1 }, () => vec3()),
  ];
  tubes.forEach((t) => {
    t.mesh.renderOrder = 8;
    specimen.add(t.mesh);
  });
  const caps = [-1, 1].map(() => specimen.mesh(sharedGeometries.sphere, gm, { s: 0.2, ro: 8 }));
  const gg = new THREE.Group();
  tubes.forEach((t) => gg.add(t.mesh));
  caps.forEach((c) => gg.add(c));
  specimen.group.add(gg);
  specimen.part(
    'Guard cells',
    'Two bean-shaped cells that surround each stoma. Their inner walls are thicker than their outer walls, so when they fill with water the cells bow apart and the pore opens. When they lose water, the pore closes.',
    gg,
    { shell: true },
  );
  const pore = specimen.mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshBasicMaterial({ color: 0x06141c }),
    { p: vec3(0, 0, -0.28) },
  );
  specimen.part(
    'Stomatal pore',
    'The opening that lets carbon dioxide in for photosynthesis and water vapour and oxygen out. Plants open stomata in light and close them in drought, balancing food-making against water loss.',
    pore,
  );
  const nm = materialFactory.grain(0x8f7fc0);
  const nuc = [0, 1].map(() => specimen.mesh(sharedGeometries.sphere, nm, { s: 0.13, ro: 3 }));
  const ng = new THREE.Group();
  nuc.forEach((nucleus) => ng.add(nucleus));
  specimen.group.add(ng);
  specimen.part(
    'Nuclei',
    'Each guard cell has its own nucleus. Guard cells are fully alive and respond to light, humidity and carbon dioxide by changing the ion content of their vacuoles.',
    ng,
  );
  const NCH = 9;
  const chm = materialFactory.soft(0x3f9d38, {
    roughness: 0.45,
    emissive: 0x0b2a08,
    emissiveIntensity: 0.45,
  });
  const chl = [0, 1].map(() => createInstancedMesh(sharedGeometries.sphereMid, chm, NCH));
  const cd = Array.from({ length: NCH }, () => ({
    t: 0.12 + random() * 0.76,
    a: random() * TAU,
    r: 0.4 + random() * 0.35,
    ph: random() * 3,
  }));
  chl.forEach((c) => specimen.add(c));
  const cg = new THREE.Group();
  chl.forEach((c) => cg.add(c));
  specimen.group.add(cg);
  specimen.part(
    'Chloroplasts',
    'Unusually for epidermal cells, guard cells have chloroplasts. They help the cells make sugar and take up ions, which draws in the water that opens the pore.',
    cg,
  );
  const pav = new THREE.Group();
  const pm = materialFactory.shell(0xa7cf8a, 0.2, { bumpScale: 0.3 });
  [
    [-3.1, 0, 2.2, 1.7],
    [3.1, 0, 2.2, 1.7],
    [0, 1.95, 3.8, 1.2],
    [0, -1.95, 3.8, 1.2],
    [-3.0, 1.9, 1.6, 1.0],
    [3.0, -1.9, 1.6, 1.0],
  ].forEach(([x, y, w, h]) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.55, 5, 0.2), pm);
    mesh.position.set(x, y, 0);
    mesh.renderOrder = 6;
    pav.add(mesh);
  });
  specimen.add(pav);
  specimen.part(
    'Epidermal cells',
    'Flat, interlocking cells that form the leaf skin. They are coated with a waxy cuticle to hold in water, and stomata are the only gaps in this barrier.',
    pav,
    { shell: true },
  );
  const tmp = vec3();
  specimen.anim((t) => {
    const o = 0.5 + 0.5 * Math.sin(t * 0.55);
    const ph = 0.03 + 0.27 * o;
    const bow = 0.3 + 0.06 * o;
    [1, -1].forEach((k, ci) => {
      for (let i = 0; i <= n; i++) {
        const s = -1 + (2 * i) / n;
        points[ci][i].set(s * 1.6, k * (ph * (1 - s * s) + bow * Math.pow(1 - s * s, 0.7)), 0);
      }
      tubes[ci].update(points[ci], (tt) => {
        const s = 2 * tt - 1;
        return 0.1 + 0.26 * Math.pow(Math.max(0, 1 - s * s), 0.5);
      });
      caps[ci].position
        .copy(points[ci][ci ? n : 0])
        .setX(ci ? 1.6 : -1.6)
        .setY(0);
      caps[ci].scale.setScalar(0.1);
      nuc[ci].position.copy(points[ci][n / 2]);
      nuc[ci].position.z = 0.0;
      cd.forEach((c, i) => {
        const p = points[ci][Math.round(c.t * n)];
        tmp.set(
          p.x,
          p.y + Math.cos(c.a + t * 0.3 * c.ph) * 0.1 * c.r,
          Math.sin(c.a + t * 0.3 * c.ph) * 0.16 * c.r,
        );
        setInstanceTransform(chl[ci], i, tmp, null, vec3(0.1, 0.06, 0.05));
      });
      chl[ci].instanceMatrix.needsUpdate = true;
    });
    pore.scale.set(1.6, Math.max(0.02, ph - 0.03), 1);
  });
}

/* ================= POLLEN ================= */
export function buildPollen(specimen) {
  const random = createSeededRandom(47);
  const group = new THREE.Group();
  specimen.add(group);
  const eg = new THREE.SphereGeometry(1, 96, 72);
  const ep = eg.attributes.position;
  for (let i = 0; i < ep.count; i++) {
    const x = ep.getX(i);
    const y = ep.getY(i);
    const z = ep.getZ(i);
    const r = 1 + 0.02 * fractalNoise3D(x * 9, y * 9, z * 9);
    ep.setXYZ(i, x * r, y * r, z * r);
  }
  eg.computeVertexNormals();
  const em = materialFactory.grain(0xd9a92b, { roughness: 0.6, side: THREE.DoubleSide });
  const ex = specimen.mesh(eg, em, { parent: group });
  specimen.part(
    'Exine (outer wall)',
    'An extremely tough shell of sporopollenin, one of the most chemically resistant natural materials. It protects the sperm cells for days to years, which is why fossil pollen survives for millions of years.',
    ex,
    { shell: true },
  );
  const aps = [0, 1, 2].map((i) => vec3(Math.cos((i / 3) * TAU), 0, Math.sin((i / 3) * TAU)));
  const sd = fibonacciSphere(560).filter((d) => aps.every((a) => a.angleTo(d) > 0.36));
  const sm = materialFactory.soft(0xe9bc3d, { roughness: 0.5 });
  const spg = new THREE.ConeGeometry(0.034, 0.16, 6);
  spg.translate(0, 0.08, 0);
  const spk = createInstancedMesh(spg, sm, sd.length);
  sd.forEach((d, i) =>
    setInstanceTransform(
      spk,
      i,
      d.clone().multiplyScalar(0.995),
      quaternionFromUp(d.clone().addScaledVector(randomDirection(random), 0.05)),
      0.85 + random() * 0.35,
    ),
  );
  group.add(spk);
  specimen.part(
    'Spines (echinate sculpture)',
    'The spiny surface helps pollen grab on to insects, and its pattern is specific to each plant group. Scientists identify plants, and even the season and place a sample came from, by reading these patterns.',
    spk,
  );
  const apm = materialFactory.soft(0x7a5a14, { side: THREE.DoubleSide });
  const apg = new THREE.Group();
  aps.forEach((a) => {
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), apm);
    c.position.copy(a).multiplyScalar(0.985);
    c.lookAt(a.clone().multiplyScalar(3));
    apg.add(c);
    const rm = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 8, 32), sm);
    rm.position.copy(a).multiplyScalar(0.99);
    rm.lookAt(a.clone().multiplyScalar(3));
    apg.add(rm);
  });
  group.add(apg);
  specimen.part(
    'Apertures (pores)',
    'Thin regions in the wall where the exine is missing. Water enters through them when the grain lands on a stigma, and one of them is where the pollen tube breaks out.',
    apg,
  );
  const im = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0xf0e0a0, 0.28, { bumpScale: 0.2 }),
    { parent: group, s: 0.92, ro: 9 },
  );
  specimen.part(
    'Intine (inner wall)',
    'A softer inner wall of cellulose and pectin underneath the exine. It becomes the wall of the pollen tube when the grain germinates.',
    im,
    { shell: true },
  );
  const gr = createInstancedMesh(sharedGeometries.sphereLo, materialFactory.soft(0xe8d48a), 170);
  for (let i = 0; i < 170; i++) {
    setInstanceTransform(
      gr,
      i,
      randomPointInUnitBall(random).multiplyScalar(0.8),
      null,
      0.018 + random() * 0.012,
    );
  }
  group.add(gr);
  specimen.part(
    'Cytoplasm and reserves',
    'Starch and lipid granules provide the energy the grain needs to grow its pollen tube, which can race down the style at several millimetres an hour.',
    gr,
  );
  const vn = specimen.mesh(sharedGeometries.sphere, materialFactory.grain(0x8f7fc0), {
    parent: group,
    p: vec3(-0.2, 0.1, 0.1),
    s: 0.26,
    ro: 3,
  });
  specimen.part(
    'Vegetative nucleus',
    'The tube nucleus directs the growth of the pollen tube. It leads the way as the tube elongates towards the egg cell.',
    vn,
  );
  const gc = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.soft(0xb7a8f5, { transparent: true, opacity: 0.85 }),
    { parent: group, p: vec3(0.3, -0.2, 0.25), s: vec3(0.3, 0.13, 0.13), r: [0, 0, 0.6], ro: 3 },
  );
  const sg = new THREE.Group();
  [
    [0.18, -0.16, 0.3],
    [0.38, -0.25, 0.22],
  ].forEach((p) => {
    const s = new THREE.Mesh(sharedGeometries.capsule, materialFactory.emit(0x4ccfc0, 0.5));
    s.position.set(...p);
    s.rotation.z = 0.6;
    s.scale.set(0.05, 0.1, 0.05);
    sg.add(s);
  });
  group.add(sg);
  specimen.part(
    'Generative cell and sperm',
    'The generative cell divides to make two sperm cells. In flowering plants both take part in double fertilisation: one joins the egg to make the embryo, the other joins nuclei that make the nutritive endosperm.',
    [gc, sg],
  );
  // pollen tube
  const tc = new THREE.CatmullRomCurve3([
    vec3(1, 0, 0),
    vec3(1.5, 0.15, 0.1),
    vec3(2.1, -0.15, 0.2),
    vec3(2.8, 0.15, 0.05),
    vec3(3.4, -0.05, -0.1),
  ]);
  const tt = new AnimatedTube(40, 12, materialFactory.shell(0xe8d48e, 0.5, { bumpScale: 0.2 }));
  const tp = Array.from({ length: 41 }, () => vec3());
  const tip = specimen.mesh(sharedGeometries.sphere, materialFactory.shell(0xe8d48e, 0.5), {
    parent: group,
    s: 0.1,
  });
  group.add(tt.mesh);
  specimen.part(
    'Pollen tube',
    'After landing on a stigma, the grain absorbs water and grows a tube. The tube follows chemical signals from the ovule, delivering the sperm cells to the egg. Growth is concentrated at the tip.',
    [tt.mesh, tip],
  );
  specimen.cut(em, sm, apm);
  const mini = [];
  [
    [-3.2, 1.6, -3.5, 0.45],
    [3.4, -1.2, -4, 0.38],
    [-2.4, -2.1, -4.5, 0.3],
    [2.8, 2.3, -4.5, 0.33],
  ].forEach(([x, y, z, s]) => {
    const m = new THREE.Group();
    m.position.set(x, y, z);
    m.scale.setScalar(s);
    m.add(new THREE.Mesh(eg, em));
    const sp = createInstancedMesh(spg, sm, sd.length);
    sp.instanceMatrix = spk.instanceMatrix;
    m.add(sp);
    specimen.add(m);
    mini.push(m);
  });
  specimen.anim((t) => {
    group.rotation.y = t * 0.17;
    group.rotation.x = 0.2 * Math.sin(t * 0.22);
    const cyc = t % 16;
    const grow = smoothStep(1, 12, cyc) * (cyc < 14 ? 1 : 1 - smoothStep(14, 15.5, cyc));
    const isGrowing = grow > 0.03;
    tt.mesh.visible = isGrowing;
    tip.visible = isGrowing;
    if (grow > 0.03) {
      for (let i = 0; i <= 40; i++) {
        tc.getPoint(Math.min(0.999, (grow * i) / 40), tp[i]);
      }
      tt.update(tp, () => 0.11);
      tip.position.copy(tp[40]);
      tip.scale.setScalar(0.11);
    }
    mini.forEach((m, i) => {
      m.rotation.y = t * (0.1 + i * 0.03);
      m.rotation.x = t * 0.06;
    });
  });
}

/* ================= CHLOROPLAST ================= */
export function buildChloroplast(specimen) {
  const random = createSeededRandom(53);
  const A = vec3(1.7, 0.95, 0.95);
  const oM = materialFactory.shell(0x9fd48a, 0.22, { iridescence: 0.3, bumpScale: 0.6 });
  const iM = materialFactory.shell(0xb7e0a0, 0.18, { bumpScale: 0.2 });
  const outer = specimen.mesh(sharedGeometries.sphere, oM, { s: A, ro: 9 });
  const inner = specimen.mesh(sharedGeometries.sphere, iM, {
    s: A.clone().multiplyScalar(0.94),
    ro: 8,
  });
  specimen.part(
    'Outer membrane',
    'The outer layer of the double envelope. It is permeable to small molecules. Chloroplasts descend from free-living cyanobacteria that were engulfed by an early cell more than a billion years ago.',
    outer,
    { shell: true },
  );
  specimen.part(
    'Inner membrane and stroma',
    'The inner membrane is a selective barrier that controls what enters. Inside it, the stroma is the thick fluid where the Calvin cycle uses ATP and NADPH to fix carbon dioxide into sugar.',
    inner,
    { shell: true },
  );
  const NG = 14;
  const nd = 8;
  const pos = [];
  let tries = 0;
  while (pos.length < NG && tries++ < 2000) {
    const p = randomPointInUnitBall(random).multiply(A.clone().multiplyScalar(0.72));
    if (pos.every((q) => q.distanceTo(p) > 0.5)) {
      pos.push(p);
    }
  }
  const disc = new THREE.CylinderGeometry(0.17, 0.17, 0.03, 20);
  const gm = materialFactory.soft(0x2f8f2c, {
    roughness: 0.4,
    emissive: 0x0e3a0a,
    emissiveIntensity: 0.45,
  });
  const gr = createInstancedMesh(disc, gm, pos.length * nd);
  const tilt = pos.map(() =>
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler((random() - 0.5) * 0.8, random() * TAU, (random() - 0.5) * 0.8),
    ),
  );
  pos.forEach((p, i) => {
    for (let k = 0; k < nd; k++) {
      const off = vec3(0, (k - (nd - 1) / 2) * 0.048, 0).applyQuaternion(tilt[i]);
      setInstanceTransform(
        gr,
        i * nd + k,
        p.clone().add(off),
        tilt[i],
        1 - Math.abs(k - 3.5) * 0.03,
      );
    }
  });
  specimen.add(gr);
  specimen.part(
    'Grana (thylakoid stacks)',
    'Stacks of flattened sacs called thylakoids, like piles of coins. Their membranes hold chlorophyll and the proteins of the light reactions, which split water, release oxygen and make ATP.',
    gr,
  );
  const lm = new THREE.Group();
  const lmat = materialFactory.soft(0x58b24c, { transparent: true, opacity: 0.8 });
  pos.forEach((p, i) => {
    const near = pos
      .map((q, j) => ({ j, d: p.distanceTo(q) }))
      .filter((o) => o.j > i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    near.forEach((o) => lm.add(createCylinderBetween(p, pos[o.j], 0.016, lmat)));
  });
  specimen.add(lm);
  specimen.part(
    'Stroma lamellae',
    'Unstacked thylakoid membranes that link one granum to the next. They create a single continuous inner space, so protons and proteins can move between stacks.',
    lm,
  );
  const st = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.soft(0xf2ecd8, { roughness: 0.6 }),
    { p: vec3(-1.0, -0.35, 0.15), s: vec3(0.35, 0.25, 0.25) },
  );
  const st2 = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.soft(0xf2ecd8, { roughness: 0.6 }),
    { p: vec3(1.0, 0.35, -0.1), s: vec3(0.28, 0.2, 0.22) },
  );
  const stg = new THREE.Group();
  stg.add(st, st2);
  specimen.group.add(stg);
  specimen.part(
    'Starch granules',
    'Temporary stores of the sugars made in daylight, built up as dense white grains. At night the chloroplast breaks them down to feed the plant.',
    stg,
  );
  const pg = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.soft(0xe39a2b, { roughness: 0.3 }),
    14,
  );
  for (let i = 0; i < 14; i++) {
    setInstanceTransform(
      pg,
      i,
      randomPointInUnitBall(random).multiply(A).multiplyScalar(0.75),
      null,
      0.04 + random() * 0.02,
    );
  }
  specimen.add(pg);
  specimen.part(
    'Plastoglobuli',
    'Orange lipid droplets attached to the thylakoids. They store pigments and quinones, and take part in building and repairing the thylakoid membranes.',
    pg,
  );
  const dna = createTubeAlongCurve(
    new THREE.CatmullRomCurve3(
      Array.from({ length: 12 }, (_, i) =>
        vec3(
          Math.cos((i / 12) * TAU) * 0.2 + 0.2,
          Math.sin((i / 12) * TAU) * 0.12 + (random() - 0.5) * 0.05,
          (random() - 0.5) * 0.15,
        ),
      ).map((v) => v.add(vec3(0.5, -0.45, 0.55))),
      true,
    ),
    80,
    5,
    0.013,
    materialFactory.emit(0xb7a8f5, 0.4),
  );
  const rb = createRibosomeCloud(
    90,
    (r) => randomPointInUnitBall(r).multiply(A).multiplyScalar(0.8),
    materialFactory.soft(0xe8a45b),
    0.017,
    55,
  );
  specimen.add(dna, rb);
  specimen.part(
    'Chloroplast DNA and ribosomes',
    'Chloroplasts keep a small circular genome of about 120 genes and their own bacterial-type ribosomes. Most chloroplast proteins, however, are encoded in the nucleus and imported.',
    [dna, rb],
  );
  specimen.anim((t) => {
    specimen.group.rotation.y = t * 0.1;
    specimen.group.rotation.x = 0.25 + Math.sin(t * 0.3) * 0.1;
    gm.emissiveIntensity = 0.4 + 0.2 * Math.sin(t * 1.5);
  });
}

/* ================= ANIMAL CELL (anatomy) ================= */
export function buildAnimalCell(specimen) {
  const random = createSeededRandom(61);
  const mg = new THREE.SphereGeometry(1, 72, 52);
  const mp = mg.attributes.position;
  for (let i = 0; i < mp.count; i++) {
    const x = mp.getX(i);
    const y = mp.getY(i);
    const z = mp.getZ(i);
    const r = 1 + 0.035 * fractalNoise3D(x * 2, y * 2, z * 2);
    mp.setXYZ(i, x * r * 2.1, y * r * 1.85, z * r * 1.85);
  }
  mg.computeVertexNormals();
  const mm = materialFactory.shell(0xc9dcea, 0.2, { bumpScale: 0.8, iridescence: 0.4 });
  const mem = specimen.mesh(mg, mm, { ro: 10 });
  specimen.part(
    'Plasma membrane',
    'A double layer of phospholipids with embedded proteins. It is selectively permeable: it separates the cell from its surroundings, carries receptors and transport proteins, and is flexible because animal cells lack a wall.',
    mem,
    { shell: true },
  );
  specimen.cut(mm);
  const nuc = new THREE.Group();
  nuc.position.set(-0.35, 0.1, 0);
  specimen.add(nuc);
  specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0x8f7fc0, 0.38, { bumpScale: 0.5 }),
    { parent: nuc, s: 0.72, ro: 4 },
  );
  specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0x3c3270), {
    parent: nuc,
    s: 0.17,
    p: vec3(0.18, 0.05, 0.1),
  });
  nuc.add(
    createTubeAlongCurve(
      loopCurve(random, 22, vec3(0.3, 0.3, 0.3)),
      220,
      5,
      0.013,
      materialFactory.emit(0xb7a8f5, 0.3),
    ),
  );
  nuc.add(createNuclearPores(60, 0.72, materialFactory.soft(0xd0c8f5), random));
  specimen.part(
    'Nucleus',
    'The control centre. A double membrane with nuclear pores encloses the DNA, coiled as chromatin. The dense nucleolus makes ribosome subunits. Messenger RNA copies of genes leave through the pores.',
    nuc,
  );
  const erM = materialFactory.soft(0x8bb9d8, { transparent: true, opacity: 0.9 });
  const rer = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const gm = bendGeometry(new THREE.SphereGeometry(1, 28, 12), -0.3);
    const mesh = new THREE.Mesh(gm, erM);

    mesh.scale.set(0.6 + i * 0.08, 0.035, 0.42 + i * 0.06);
    mesh.position.set(-0.35 + 0.15 + i * 0.04, 0.1 - 0.72 - i * 0.1 + 0.6, -0.2 + i * 0.15);
    mesh.rotation.set(0.7, 0, 0.6);
    rer.add(mesh);
  }
  specimen.add(rer);
  const rib = createRibosomeCloud(
    220,
    (r) => vec3((r() - 0.5) * 1.6 - 0.1, (r() - 0.5) * 1.4 - 0.25, (r() - 0.5) * 1.5 - 0.2),
    materialFactory.soft(0xe8a45b),
    0.018,
    71,
  );
  specimen.add(rib);
  specimen.part(
    'Rough endoplasmic reticulum',
    'Flattened membrane sheets studded with ribosomes, continuous with the nuclear envelope. Proteins destined for secretion or for membranes are made here and folded.',
    [rer, rib],
  );
  const ser = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const c = loopCurve(random, 7, vec3(0.55, 0.4, 0.4), false);
    const t = createTubeAlongCurve(
      c,
      50,
      7,
      0.04,
      materialFactory.soft(0x9ad0e0, { transparent: true, opacity: 0.85 }),
    );
    t.position.set(
      0.5 + (random() - 0.5) * 0.4,
      -0.9 + (random() - 0.5) * 0.4,
      0.4 + (random() - 0.5) * 0.5,
    );
    ser.add(t);
  }
  specimen.add(ser);
  specimen.part(
    'Smooth endoplasmic reticulum',
    'A web of branching tubes without ribosomes. It makes lipids and steroids, stores calcium, and in the liver breaks down drugs and toxins.',
    ser,
  );
  const gl = createGolgiApparatus(
    materialFactory.soft(0xe0b062, { transparent: true, opacity: 0.95 }),
    materialFactory.soft(0xe9c585),
    1.1,
  );
  gl.position.set(1.05, 0.4, 0.35);
  gl.rotation.set(0.3, 0.5, 1.1);
  specimen.add(gl);
  specimen.part(
    'Golgi apparatus',
    'The post office of the cell. Stacked cisternae receive vesicles from the ER, modify the proteins (for example by adding sugars), then sort and ship them in new vesicles to their destination.',
    gl,
  );
  const mmat = createMitochondrionMaterials();
  const mits = new THREE.Group();
  const md = [];
  for (let i = 0; i < 9; i++) {
    const m = createMitochondrion(mmat, 1.15);
    const p = randomPointInUnitBall(random).multiply(vec3(1.5, 1.2, 1.2));
    if (p.distanceTo(vec3(-0.35, 0.1, 0)) < 1) {
      p.add(vec3(1.2, -0.4, 0));
    }
    m.position.copy(p);
    m.rotation.set(random() * 3, random() * 3, random() * 3);
    mits.add(m);
    md.push({ m, p: p.clone(), ph: random() * TAU });
  }
  specimen.add(mits);
  specimen.part(
    'Mitochondria',
    "Each has a smooth outer membrane and a folded inner membrane (cristae) packed with ATP synthase. They make most of the cell's ATP using oxygen, and carry their own small DNA.",
    mits,
  );
  const ly = createInstancedMesh(sharedGeometries.sphereMid, materialFactory.grain(0x7d4f93), 7);
  for (let i = 0; i < 7; i++) {
    setInstanceTransform(
      ly,
      i,
      randomPointInUnitBall(random)
        .multiply(vec3(1.5, 1.2, 1.2))
        .add(vec3(0, 0, 0)),
      null,
      0.12 + random() * 0.04,
    );
  }
  specimen.add(ly);
  specimen.part(
    'Lysosomes',
    'Small acid-filled sacs of digestive enzymes. They break down worn-out organelles, food particles and invaders, recycling the building blocks. Faulty lysosomes cause storage diseases.',
    ly,
  );
  const pe = createInstancedMesh(sharedGeometries.sphereMid, materialFactory.soft(0xd9c28a), 4);
  for (let i = 0; i < 4; i++) {
    setInstanceTransform(
      pe,
      i,
      randomPointInUnitBall(random)
        .multiply(vec3(1.5, 1.2, 1.2))
        .add(vec3(0.3, 0.2, 0)),
      null,
      0.1,
    );
  }
  specimen.add(pe);
  specimen.part(
    'Peroxisomes',
    'Small organelles that break down fatty acids and neutralise hydrogen peroxide with the enzyme catalase, a harmful by-product of their own reactions.',
    pe,
  );
  const cen = new THREE.Group();
  const cm = materialFactory.soft(0x7fd1b9);
  for (let k = 0; k < 2; k++) {
    const c = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const t = new THREE.Mesh(sharedGeometries.cyl, cm);
      t.position.set(Math.cos(a) * 0.045, 0, Math.sin(a) * 0.045);
      t.scale.set(0.014, 0.22, 0.014);
      c.add(t);
    }
    c.position.set(k * 0.1, 0, k * -0.05);
    c.rotation.z = (k * Math.PI) / 2;
    cen.add(c);
  }
  cen.position.set(0.55, 0.45, 0.1);
  specimen.add(cen);
  specimen.part(
    'Centrioles',
    'Two short cylinders of nine microtubule triplets, at right angles to each other. They organise the centrosome, which anchors microtubules and helps pull chromosomes apart during division.',
    cen,
  );
  const mts = new THREE.Group();
  const tm = materialFactory.soft(0x7fd1b9, { transparent: true, opacity: 0.7 });
  for (let i = 0; i < 18; i++) {
    const d = randomDirection(random);
    const e = d
      .clone()
      .multiply(vec3(1.9, 1.65, 1.65))
      .multiplyScalar(0.93);
    const s = cen.position;
    const mid = s.clone().lerp(e, 0.5).add(randomDirection(random).multiplyScalar(0.15));
    mts.add(
      createTubeAlongCurve(new THREE.CatmullRomCurve3([s.clone(), mid, e]), 16, 5, 0.012, tm),
    );
  }
  specimen.add(mts);
  specimen.part(
    'Microtubules (cytoskeleton)',
    'Hollow protein tubes that radiate from the centrosome. They give the cell its shape, act as tracks for motor proteins that haul vesicles, and form the spindle in cell division.',
    mts,
  );
  specimen.anim((t) => {
    md.forEach((o) => {
      o.m.position.set(
        o.p.x + Math.sin(t * 0.3 + o.ph) * 0.05,
        o.p.y + Math.cos(t * 0.27 + o.ph) * 0.05,
        o.p.z,
      );
    });
    specimen.group.rotation.y = Math.sin(t * 0.15) * 0.15;
  });
}
