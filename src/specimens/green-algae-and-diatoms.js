/**
 * Specimens: green algae and diatoms.
 *
 * Specimen builders: chlamydomonas, diatom, spirogyra.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Flagellum,
  sharedGeometries,
  createInstancedMesh,
  setInstanceTransform,
  createTubeThroughPoints,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import {
  TAU,
  vec3,
  fibonacciSphere,
  lerp,
  quaternionFromUp,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';
import { createMitochondrionMaterials, createMitochondrion } from '../engine/organelles.js';
import { createCanvasTexture } from '../engine/textures.js';
import {
  ADDITIONAL_BUILDERS,
  ADDITIONAL_SPECIMENS,
  plantMaterials,
  createRod,
} from './shared-helpers.js';

/* ================= NEW MICROSCOPIC ALGAE (worker F2) =================
   Spirogyra, Chlamydomonas, Diatom, Dinoflagellate, Desmid, Oscillatoria */

/* generic parametric grid surface: fn(u, v) -> [x, y, z], u,v in 0..1 */
function grid(nx, ny, fn) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= nx; i++) {
    for (let j = 0; j <= ny; j++) {
      const p = fn(i / nx, j / ny);
      pos.push(p[0], p[1], p[2]);
      uv.push(i / nx, j / ny);
    }
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const a = i * (ny + 1) + j;
      const b = a + 1;
      const c = a + ny + 1;
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ---------- Spirogyra ---------- */
/* helical chloroplast ribbon with scalloped edges, lying on a cylinder of radius rad around the X axis */
function ribbon(xc, len, turns, rad, width, phase) {
  return grid(180, 1, (t, v) => {
    const angle = phase + TAU * turns * t;
    const w = width * (0.5 + 0.14 * Math.sin(t * 74 + phase * 3)) * (v > 0.5 ? 1 : -1);
    return [xc + (t - 0.5) * len + w, Math.cos(angle) * rad, Math.sin(angle) * rad];
  });
}
function buildSpirogyra(specimen) {
  const fil = new THREE.Group();
  specimen.add(fil);
  const NC = 5;
  const Lc = 2.1;
  const r = 0.5;
  const len = NC * Lc;
  const x0 = -len / 2;
  const wallGeo = new THREE.CylinderGeometry(r, r, len, 40, 1, true);
  wallGeo.rotateZ(Math.PI / 2);
  const wall = specimen.mesh(wallGeo, materialFactory.shell(0xbfe0b4, 0.3, { bumpScale: 0.2 }), {
    parent: fil,
    ro: 9,
  });
  const sheathGeo = new THREE.CylinderGeometry(r * 1.13, r * 1.13, len + 0.1, 40, 1, true);
  sheathGeo.rotateZ(Math.PI / 2);
  const sheath = specimen.mesh(
    sheathGeo,
    materialFactory.shell(0xe9f3df, 0.13, { clearcoat: 0.2 }),
    { parent: fil, ro: 10 },
  );
  specimen.part(
    'Cell wall and mucilage sheath',
    'Each cell has a wall of cellulose and pectin, wrapped in a layer of slippery mucilage. This coat is why a clump of Spirogyra feels slimy and why the filaments cling together as pond scum.',
    [wall, sheath],
    { shell: true },
  );
  const septa = new THREE.Group();
  fil.add(septa);
  const cwGeo = new THREE.CircleGeometry(r * 0.995, 36);
  cwGeo.rotateY(Math.PI / 2);
  const cwMat = materialFactory.shell(0x8fc183, 0.62, { side: THREE.DoubleSide });
  for (let i = 0; i <= NC; i++) {
    specimen.mesh(cwGeo, cwMat, { parent: septa, p: vec3(x0 + i * Lc, 0, 0), ro: 8 });
  }
  specimen.part(
    'Cross walls',
    'Flat cross walls divide the filament into a row of identical cells that stay joined end to end. New walls form across the middle of a cell when it divides, so the filament grows in length without branching.',
    septa,
  );
  const chlMat = materialFactory.soft(0x3f9a37, {
    side: THREE.DoubleSide,
    roughness: 0.5,
    clearcoat: 0.4,
  });
  const chl = new THREE.Group();
  fil.add(chl);
  const pyr = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.soft(0xf2eebf, { roughness: 0.35 }),
    NC * 2 * 9,
  );
  let pk = 0;
  const rr = createSeededRandom(8);
  const nuc = new THREE.Group();
  const nm = materialFactory.grain(0x8c68b0);
  const nlm = plantMaterials.dark(0x4a2f6a);
  const strandM = materialFactory.soft(0xe6efcf, { roughness: 0.6 });
  const vm = materialFactory.glass(0xe0f4dc, 0.2, { roughness: 0.1 });
  fil.add(nuc);
  const strands = new THREE.Group();
  fil.add(strands);
  const vacs = new THREE.Group();
  fil.add(vacs);
  for (let c = 0; c < NC; c++) {
    const xc = x0 + (c + 0.5) * Lc;
    for (let k = 0; k < 2; k++) {
      const ph = c * 1.1 + k * Math.PI;
      specimen.mesh(ribbon(xc, 1.78, 2.4, r * 0.86, 0.3, ph), chlMat, { parent: chl });
      for (let q = 0; q < 9; q++) {
        const t = (q + 0.5) / 9;
        const angle = ph + TAU * 2.4 * t;
        setInstanceTransform(
          pyr,
          pk++,
          vec3(xc + (t - 0.5) * 1.78, Math.cos(angle) * r * 0.84, Math.sin(angle) * r * 0.84),
          null,
          0.085 + rr() * 0.02,
        );
      }
    }
    specimen.mesh(sharedGeometries.sphere, nm, {
      parent: nuc,
      p: vec3(xc, 0, 0),
      s: vec3(0.2, 0.17, 0.2),
    });
    specimen.mesh(sharedGeometries.sphereLo, nlm, {
      parent: nuc,
      p: vec3(xc + 0.03, 0.02, 0.02),
      s: 0.07,
    });
    for (let k = 0; k < 11; k++) {
      const a = (k / 11) * TAU + rr() * 0.4;
      const e = (rr() - 0.5) * 1.1;
      const end = vec3(xc + e, Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
      strands.add(createRod(vec3(xc, 0, 0), end, 0.016, 0.008, strandM));
    }
    specimen.mesh(sharedGeometries.capsule, vm, {
      parent: vacs,
      p: vec3(xc, 0, 0),
      r: [0, 0, Math.PI / 2],
      s: vec3(0.72, Lc * 0.41, 0.72),
      ro: 3,
    });
  }
  pyr.instanceMatrix.needsUpdate = true;
  fil.add(pyr);
  specimen.part(
    'Spiral chloroplasts',
    'The ribbon-shaped chloroplast winds in a helix just inside the wall, giving the genus its name. Each cell here has two; species have anywhere from one to sixteen. The wavy edges carry the light-harvesting membranes.',
    chl,
  );
  specimen.part(
    'Pyrenoids',
    'The pale round bodies along the ribbon are pyrenoids, protein-rich centres where carbon dioxide is fixed. Starch grains collect around each one as a reserve of sugar made in photosynthesis.',
    pyr,
  );
  specimen.part(
    'Nucleus and cytoplasmic strands',
    'The single nucleus hangs in the middle of the cell, held in place by fine strands of cytoplasm that run out to the wall. The strands stretch and shift as the cell moves its contents.',
    [nuc, strands],
  );
  specimen.part(
    'Central vacuole',
    'A large fluid-filled vacuole takes up most of the cell interior and presses the living cytoplasm, chloroplasts included, into a thin layer against the wall. It keeps the cell firm by holding water under pressure.',
    vacs,
    { shell: true },
  );
  specimen.anim((t) => {
    fil.rotation.set(t * 0.13, 0.12 * Math.sin(t * 0.21), 0.3 + 0.05 * Math.sin(t * 0.3));
    fil.position.y = 0.15 * Math.sin(t * 0.4);
  });
}
ADDITIONAL_BUILDERS.spirogyra = buildSpirogyra;
ADDITIONAL_SPECIMENS.push({
  id: 'spirogyra',
  cat: 'algae',
  name: 'Spirogyra',
  latin: 'Spirogyra sp.',
  size: 'cells 20–100 µm wide and up to several times longer; filaments many centimetres',
  sizeUm: 750,
  U: 10.5,
  dist: 19,
  cls: 'Eukaryota · Archaeplastida · Charophyta · Zygnematophyceae',
  habitat: 'Freshwater ponds, ditches and slow streams, forming floating green mats',
  move: 'Non-motile; filaments drift with the water and float up on trapped oxygen bubbles',
  feed: 'Photoautotroph: photosynthesis in spiral chloroplasts, storing starch',
  repro:
    'Fragmentation of the filament; sexual conjugation between two filaments forms thick-walled zygospores',
  desc: 'An unbranched green filament of cylindrical cells, each holding one or more ribbon-like chloroplasts wound in a helix. It forms the slippery green strands often called pond silk or blanket weed.',
  fun: [
    'During conjugation, two filaments lie side by side and the contents of one cell pass through a tube into the cell opposite, where they fuse into a zygospore.',
    'Spirogyra belongs to the group of green algae most closely related to land plants.',
    'Bubbles of oxygen from photosynthesis get caught in the mat and lift it to the surface on sunny days.',
  ],
  note: 'Only five cells are shown; real filaments contain hundreds or thousands. Cells are drawn somewhat shorter than typical. Each cell shows two chloroplast ribbons with nine pyrenoids per ribbon; the true counts vary by species.',
});

/* ---------- Chlamydomonas ---------- */
function buildChlamydomonas(specimen) {
  const group = new THREE.Group();
  specimen.add(group);
  const wall = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0xd8ebc4, 0.3, { bumpScale: 0.2 }),
    { parent: group, s: vec3(1.07, 1.29, 1.07), ro: 9 },
  );
  const pap = [-1, 1].map((sd) =>
    specimen.mesh(sharedGeometries.sphere, materialFactory.shell(0xd8ebc4, 0.45), {
      parent: group,
      p: vec3(sd * 0.2, 1.27, 0),
      s: vec3(0.15, 0.1, 0.15),
      ro: 9,
    }),
  );
  specimen.part(
    'Cell wall',
    'A tough wall made of glycoproteins surrounds the cell. Unlike the walls of land plants and many other algae, it contains no cellulose. Two small bumps at the front, the papillae, mark where the flagella leave the cell.',
    [wall, ...pap],
    { shell: true },
  );
  const cupGeo = new THREE.SphereGeometry(1, 44, 30, 0, TAU, 1.2, Math.PI - 1.2);
  const cup = specimen.mesh(
    cupGeo,
    materialFactory.soft(0x449a33, { side: THREE.DoubleSide, roughness: 0.5, clearcoat: 0.4 }),
    { parent: group, s: vec3(0.94, 1.14, 0.94), ro: 4 },
  );
  specimen.part(
    'Cup-shaped chloroplast',
    'A single large chloroplast curves around the back and sides of the cell like a cup. It fills most of the volume and holds the chlorophyll, so one chloroplast makes all of the cell’s food by photosynthesis.',
    cup,
  );
  const py = new THREE.Group();
  py.position.set(0, -0.66, 0);
  group.add(py);
  specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xe6eab0, { roughness: 0.35 }), {
    parent: py,
    s: 0.36,
  });
  fibonacciSphere(14).forEach((d) =>
    specimen
      .mesh(sharedGeometries.sphere, materialFactory.soft(0xfffbe0, { roughness: 0.3 }), {
        parent: py,
        p: d.clone().multiplyScalar(0.4),
        s: vec3(0.15, 0.15, 0.06),
        quaternion: null,
      })
      .quaternion.copy(quaternionFromUp(d)),
  );
  specimen.part(
    'Pyrenoid and starch sheath',
    'The pyrenoid is a dense blob inside the chloroplast where the enzyme Rubisco is concentrated to fix carbon dioxide. Plates of starch gather around it as the cell stores energy.',
    py,
  );
  const angle = 1.5;
  const ph = 0.25;
  const ey = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.soft(0xd33a1c, {
      emissive: 0x8a1c0a,
      emissiveIntensity: 0.45,
      roughness: 0.35,
    }),
    {
      parent: group,
      p: vec3(
        Math.sin(angle) * Math.cos(ph) * 0.96,
        Math.cos(angle) * 1.16,
        Math.sin(angle) * Math.sin(ph) * 0.96,
      ),
      s: vec3(0.17, 0.1, 0.17),
      ro: 5,
    },
  );
  ey.quaternion.copy(quaternionFromUp(vec3(Math.cos(ph), 0, Math.sin(ph))));
  specimen.part(
    'Eyespot (stigma)',
    'A patch of red-orange pigment droplets inside the chloroplast. It shades a light-sensing protein in the membrane just outside, so the cell can tell where light is coming from and swim toward or away from it.',
    ey,
  );
  const nuc = new THREE.Group();
  nuc.position.set(0, 0.32, 0);
  group.add(nuc);
  specimen.mesh(sharedGeometries.sphere, materialFactory.grain(0xa285c4), { parent: nuc, s: 0.37 });
  specimen.mesh(sharedGeometries.sphereLo, plantMaterials.dark(0x56396f), {
    parent: nuc,
    p: vec3(0.1, 0.07, 0.08),
    s: 0.13,
  });
  specimen.part(
    'Nucleus',
    'The nucleus sits in the hollow of the cup, near the front of the cell. The dark spot inside it is the nucleolus, where ribosomes are assembled. The cell is haploid and carries a single set of chromosomes.',
    nuc,
  );
  const cvs = [-1, 1].map((sd) =>
    specimen.mesh(
      sharedGeometries.sphere,
      materialFactory.glass(0xdcecf0, 0.6, { roughness: 0.1 }),
      { parent: group, p: vec3(sd * 0.45, 0.88, 0.12), s: 0.17, ro: 7 },
    ),
  );
  specimen.part(
    'Contractile vacuoles',
    'Two vacuoles at the front collect excess water that seeps into the cell and squirt it out every few seconds. They alternate, so the cell does not burst in fresh water.',
    cvs,
  );
  const mm = createMitochondrionMaterials();
  const mit = new THREE.Group();
  group.add(mit);
  [
    [0.72, -0.25, 0.35],
    [-0.7, -0.1, 0.4],
    [0.3, -0.85, -0.55],
    [-0.35, 0.05, -0.75],
    [0.55, 0.25, -0.6],
  ].forEach(([x, y, z], i) => {
    const m = createMitochondrion(mm, 0.5);
    m.position.set(x, y, z);
    m.rotation.set(i * 1.3, i, i * 0.7);
    mit.add(m);
  });
  specimen.part(
    'Mitochondria',
    'The mitochondria, drawn as small bean shapes between the chloroplast and the wall, burn sugar to make ATP, especially in the dark when photosynthesis stops. In this alga they form a branched network, shown here as separate pieces.',
    mit,
  );
  const fm = materialFactory.soft(0xe9e1cb, { roughness: 0.5 });
  const fl = [-1, 1].map((sd) => {
    const f = new Flagellum(fm, { n: 44, rad: 6, r0: 0.055, r1: 0.022 });
    group.add(f.mesh);
    f.mesh.userData.sd = sd;
    return f;
  });
  specimen.part(
    'Flagella',
    'Two equal whip-like flagella, about as long as the cell, pull it through the water with a movement much like a breaststroke. The flagella are built from the same microtubule pattern as human cilia, which is why the alga is used to study cilia diseases.',
    fl.map((f) => f.mesh),
  );
  const side = vec3(0, 0, 1);
  specimen.anim((t) => {
    const w = 7.5;
    fl.forEach((f, i) => {
      const sd = i ? 1 : -1;
      const a = 0.5 + 0.85 * Math.sin(t * w) + 0.28 * Math.sin(t * w * 2 + 1.2);
      const dir = vec3(sd * Math.sin(a), Math.cos(a), 0).normalize();
      f.wave(vec3(sd * 0.2, 1.3, 0), dir, side, 2.7, 0.2, 1.7, w, t, 0.8);
    });
    cvs.forEach((c, i) => {
      const k = (t / 2.6 + i * 0.5) % 1;
      const s =
        k < 0.85
          ? 0.06 + 0.13 * smoothStep(0, 0.85, k)
          : 0.19 * (1 - smoothStep(0.85, 1, k)) + 0.02;
      c.scale.setScalar(s);
    });
    group.rotation.set(0.13 * Math.sin(t * 0.9), t * 1.1, 0.1 * Math.cos(t * 0.7));
    group.position.set(0.22 * Math.sin(t * 0.5), -1.3 + 0.12 * Math.sin(t * 0.8), 0);
  });
}
ADDITIONAL_BUILDERS.chlamydomonas = buildChlamydomonas;
ADDITIONAL_SPECIMENS.push({
  id: 'chlamydomonas',
  cat: 'algae',
  name: 'Chlamydomonas',
  latin: 'Chlamydomonas reinhardtii',
  size: 'about 10 µm wide; flagella 10–12 µm',
  sizeUm: 10,
  U: 2.6,
  dist: 10.5,
  cls: 'Eukaryota · Archaeplastida · Chlorophyta · Chlorophyceae',
  habitat: 'Freshwater ponds and puddles, and damp soil',
  move: 'Swims by beating two flagella in a breaststroke, spinning about its long axis; steers toward light',
  feed: 'Photoautotroph; can also take up acetate and grow in the dark',
  repro:
    'Asexual: divides inside the parent wall into 2–16 swimming cells; sexual: two mating types fuse to form a resting zygospore',
  desc: 'A single-celled green alga with a cup-shaped chloroplast, a red eyespot and two flagella. It is one of the most studied organisms in biology.',
  fun: [
    'It is a model organism for photosynthesis, flagellar movement and the genetics of chloroplasts. Its genome was sequenced in 2007.',
    'The eyespot lets it steer toward moderate light and away from light that is too bright.',
    'A related species, Chlamydomonas nivalis, tints snow red and is known as watermelon snow.',
  ],
  note: 'Body proportions are idealised. The flagellar beat is slowed from about 50 beats per second so the movement can be seen. Mitochondria are drawn as separate pieces; the living cell has a network. Cell size is a measured typical value.',
});

/* ---------- Diatom ---------- */
/* superellipse sheet along X: cross-section in (y, z), psi range selects which part of the frustule */
function diatomSheet(L, W, H, nExp, psi0, psi1, grow) {
  return grid(90, 44, (u, v) => {
    const w = 2 * u - 1;
    const s = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(w), 2.6)), 1 / 2.4);
    const ps = lerp(psi0, psi1, v);
    const c = Math.cos(ps);
    const sn = Math.sin(ps);
    return [
      (u - 0.5) * L,
      (W / 2) * s * grow * Math.sign(c) * Math.pow(Math.abs(c), 2 / nExp),
      (H / 2) * s * grow * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / nExp),
    ];
  });
}
function diatomTex(bump) {
  return createCanvasTexture(
    2048,
    512,
    (c, w, h) => {
      c.fillStyle = bump ? '#ffffff' : '#e1c87f';
      c.fillRect(0, 0, w, h);
      const N = 48;
      const dot = bump ? '#000' : '#7a5a1e';
      for (let i = 0; i < N; i++) {
        const u = 0.08 + (0.84 * (i + 0.5)) / N;
        const x = u * w;
        if (Math.abs(u - 0.5) < 0.03) {
          continue;
        }
        for (const sd of [-1, 1]) {
          for (let k = 0; k < 9; k++) {
            const v = 0.5 + sd * (0.075 + (0.4 * k) / 8.5);
            c.fillStyle = dot;
            c.beginPath();
            c.ellipse(x, v * h, 5, 8, 0, 0, TAU);
            c.fill();
            if (!bump) {
              c.fillStyle = '#f6e7b4';
              c.beginPath();
              c.ellipse(x - 1, v * h - 1.5, 2, 3.2, 0, 0, TAU);
              c.fill();
            }
          }
        }
      }
      c.strokeStyle = bump ? '#000' : '#4e3912';
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(0.07 * w, h / 2);
      c.lineTo(0.465 * w, h / 2);
      c.moveTo(0.535 * w, h / 2);
      c.lineTo(0.93 * w, h / 2);
      c.stroke();
      c.fillStyle = bump ? '#fff' : '#fff2c9';
      [0.5, 0.06, 0.94].forEach((u, i) => {
        c.beginPath();
        c.arc(u * w, h / 2, i ? 11 : 17, 0, TAU);
        c.fill();
      });
    },
    !bump,
  );
}
function buildDiatom(specimen) {
  const group = new THREE.Group();
  specimen.add(group);
  const L = 7;
  const W = 1.5;
  const H = 1.15;
  const n = 3;
  const gz = 0.17;
  const psi0 = Math.asin(Math.pow((2 * gz) / H, n / 2));
  const vm = () =>
    new THREE.MeshPhysicalMaterial({
      map: diatomTex(false),
      bumpMap: diatomTex(true),
      bumpScale: 2.4,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.66,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  const epi = specimen.mesh(diatomSheet(L, W, H, n, psi0, Math.PI - psi0, 1.025), vm(), {
    parent: group,
    ro: 9,
  });
  const hypo = specimen.mesh(diatomSheet(L, W, H, n, Math.PI + psi0, TAU - psi0, 1), vm(), {
    parent: group,
    ro: 9,
  });
  specimen.part(
    'Silica valves (epitheca and hypotheca)',
    'The cell sits inside a glass-like box made of silica, with two halves that fit like a petri dish and its lid. The larger upper half is the epitheca and the lower is the hypotheca. Rows of tiny pores, called striae, pass nutrients and gases while keeping the shell strong.',
    [epi, hypo],
    { shell: true },
  );
  const gird = mergeGeometries([
    diatomSheet(L, W, H, n, -psi0, psi0, 0.985),
    diatomSheet(L, W, H, n, Math.PI - psi0, Math.PI + psi0, 0.985),
  ]);
  const girdle = specimen.mesh(gird, materialFactory.glass(0xd9c283, 0.58, { roughness: 0.3 }), {
    parent: group,
    ro: 8,
  });
  specimen.part(
    'Girdle bands',
    'Overlapping strips of silica form a band, the girdle, around the join between the two valves. New bands are added as the cell grows, and the girdle is the part of the shell you see from the side.',
    girdle,
  );
  const zt = (x) =>
    (H / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs((2 * x) / L), 2.6)), 1 / 2.4) * 1.03;
  const rm = plantMaterials.dark(0x7a5a1c);
  const rg = new THREE.Group();
  group.add(rg);
  for (const sz of [-1, 1]) {
    for (const [a, b] of [
      [-0.43, -0.035],
      [0.035, 0.43],
    ]) {
      const points = [];
      for (let i = 0; i <= 14; i++) {
        const x = lerp(a, b, i / 14) * L;
        points.push(vec3(x, 0, sz * (zt(x) + 0.012)));
      }
      rg.add(createTubeThroughPoints(points, 6, 0.03, rm));
      [0.0, a < 0 ? -0.455 : 0.455].forEach((u) => {
        if (u !== 0 || a < 0) {
          specimen.mesh(
            sharedGeometries.sphere,
            materialFactory.soft(0xc7a95a, { roughness: 0.3 }),
            { parent: rg, p: vec3(u * L, 0, sz * (zt(u * L) + 0.02)), s: u === 0 ? 0.1 : 0.07 },
          );
        }
      });
    }
  }
  specimen.part(
    'Raphe and nodules',
    'A slit called the raphe runs down the middle of each valve and is interrupted by a thickened central nodule, with a polar nodule at each end. Cytoplasm streams along the slit and pushes out mucilage that lets the cell glide across surfaces.',
    rg,
  );
  const chlM = materialFactory.soft(0xb27f27, { roughness: 0.45, clearcoat: 0.5 });
  const chlG = new THREE.Group();
  group.add(chlG);
  const pyrG = new THREE.Group();
  group.add(pyrG);
  for (const sd of [-1, 1]) {
    specimen.mesh(sharedGeometries.sphere, chlM, {
      parent: chlG,
      p: vec3(0, sd * 0.56, 0),
      s: vec3(2.45, 0.13, 0.4),
    });
    specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xefd9a2), {
      parent: pyrG,
      p: vec3(0, sd * 0.5, 0),
      s: vec3(0.2, 0.17, 0.2),
    });
  }
  specimen.part(
    'Golden-brown chloroplasts',
    'Two plate-shaped chloroplasts lie against the sides of the cell. They contain chlorophyll plus a golden-brown pigment, fucoxanthin, that gives diatoms their colour and lets them use the blue-green light that reaches deeper water.',
    chlG,
  );
  specimen.part(
    'Pyrenoids',
    'Each chloroplast carries a pyrenoid, a dense core where carbon dioxide is captured by the enzyme Rubisco before it is turned into sugar.',
    pyrG,
  );
  const nuc = new THREE.Group();
  group.add(nuc);
  specimen.mesh(sharedGeometries.sphere, materialFactory.grain(0x8c6bab), {
    parent: nuc,
    s: vec3(0.3, 0.26, 0.3),
  });
  specimen.mesh(sharedGeometries.sphereLo, plantMaterials.dark(0x4a2f6a), {
    parent: nuc,
    p: vec3(0.06, 0.03, 0.06),
    s: 0.1,
  });
  specimen.mesh(
    sharedGeometries.cyl,
    materialFactory.soft(0xe6d39d, { transparent: true, opacity: 0.7 }),
    { parent: nuc, s: vec3(0.2, W * 0.78, 0.2) },
  );
  specimen.part(
    'Nucleus and cytoplasmic bridge',
    'The nucleus sits in a bridge of cytoplasm across the middle of the cell. Diatom cells are diploid, with two sets of chromosomes, unlike most other algae.',
    nuc,
  );
  const oil = new THREE.Group();
  group.add(oil);
  const om = materialFactory.glass(0xe3a93c, 0.85, { roughness: 0.1 });
  [
    [-2.7, 0.15, 0.15, 0.2],
    [-2.4, -0.2, -0.1, 0.14],
    [2.75, -0.1, 0.1, 0.19],
    [2.4, 0.22, -0.12, 0.14],
    [-2, 0.05, 0.25, 0.11],
    [2.1, -0.15, -0.25, 0.11],
  ].forEach(([x, y, z, r]) =>
    specimen.mesh(sharedGeometries.sphere, om, { parent: oil, p: vec3(x, y, z), s: r }),
  );
  specimen.part(
    'Oil droplets (lipid reserves)',
    'Diatoms store energy as droplets of oil, together with a soluble sugar called chrysolaminarin. Oil also helps the cell float. Ancient diatom oil is one source of petroleum.',
    oil,
  );
  specimen.anim((t) => {
    group.position.x = 1.1 * Math.sin(t * 0.33);
    group.rotation.set(
      0.5 + 0.22 * Math.sin(t * 0.22),
      0.14 * Math.sin(t * 0.33 + 1),
      0.06 * Math.sin(t * 0.3),
    );
  });
}
ADDITIONAL_BUILDERS.diatom = buildDiatom;
ADDITIONAL_SPECIMENS.push({
  id: 'diatom',
  cat: 'algae',
  name: 'Diatom',
  latin: 'Pinnularia sp. (pennate diatom)',
  size: 'about 40–200 µm long, depending on species',
  sizeUm: 80,
  U: 7,
  dist: 15,
  cls: 'Eukaryota · SAR · Ochrophyta · Bacillariophyceae',
  habitat: 'Freshwater ponds, wet mud and moss; related diatoms live throughout the oceans',
  move: 'Glides along surfaces by secreting mucilage through the raphe',
  feed: 'Photoautotroph, with fucoxanthin as the main light-harvesting pigment',
  repro:
    'Mostly asexual division, in which each daughter keeps one old valve and builds a new smaller one; sexual reproduction restores full size',
  desc: 'A single cell housed in an ornate glass-like shell of silica. The boat shape, the rows of pores and the central slit called the raphe identify the pennate diatoms.',
  fun: [
    'Diatoms account for roughly a fifth of all photosynthesis on Earth.',
    'Because each division gives one daughter a smaller shell, a population shrinks until sexual reproduction makes a full-size cell again.',
    'Deposits of fossil shells, called diatomaceous earth, are mined for filters and polishes.',
  ],
  note: 'Size is the typical range for Pinnularia. The number and spacing of striae are simplified, and the shell is tinted amber so it is visible on a light background; real silica is colourless and transparent.',
});
