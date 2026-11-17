/**
 * Specimens: classic bacteria and viruses.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  Flagellum,
  sharedGeometries,
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
  fibonacciSphere,
  quaternionFromUp,
  randomDirection,
  randomPointInUnitBall,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';
import { createRibosomeCloud } from '../engine/organelles.js';
import { textureLibrary } from '../engine/textures.js';

/* ================= E. COLI ================= */
export function loopCurve(random, n, box, closed = true) {
  const points = [];
  for (let i = 0; i < n; i++) {
    points.push(
      vec3((random() * 2 - 1) * box.x, (random() * 2 - 1) * box.y, (random() * 2 - 1) * box.z),
    );
  }
  return new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.5);
}
export function buildEscherichiaColi(specimen) {
  const random = createSeededRandom(2);
  const cell = new THREE.Group();
  cell.rotation.z = Math.PI / 2;
  specimen.add(cell);
  const spin = new THREE.Group();
  cell.add(spin);
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 14, 36);
  const om = specimen.mesh(
    cap(0.5, 1.4),
    materialFactory.shell(0xd3b98f, 0.2, {
      iridescence: 0.35,
      iridescenceIOR: 1.3,
      bumpScale: 0.9,
    }),
    { parent: spin, ro: 9 },
  );
  specimen.part(
    'Outer membrane',
    'The outer layer of this Gram-negative bacterium. It is a second lipid bilayer studded with porins and coated in lipopolysaccharide, which blocks many antibiotics and detergents.',
    om,
    { shell: true },
  );
  const pg = specimen.mesh(
    cap(0.46, 1.4),
    materialFactory.shell(0xe9d48a, 0.3, { bumpScale: 0.15 }),
    { parent: spin, ro: 8 },
  );
  specimen.part(
    'Peptidoglycan wall',
    'A thin mesh of sugar chains cross-linked by short peptides sits in the gap (periplasm) between the membranes. It is the rigid layer that keeps the rod shape and resists internal pressure.',
    pg,
    { shell: true },
  );
  const im = specimen.mesh(
    cap(0.42, 1.4),
    materialFactory.shell(0xb7c98a, 0.22, { bumpScale: 0.2 }),
    { parent: spin, ro: 7 },
  );
  specimen.part(
    'Inner membrane',
    'The cytoplasmic membrane is the real permeability barrier. It carries the respiratory chain and ATP synthase that make energy, since bacteria have no mitochondria.',
    im,
    { shell: true },
  );
  const nuc = createTubeAlongCurve(
    loopCurve(random, 44, vec3(0.2, 0.9, 0.2)),
    420,
    5,
    0.013,
    materialFactory.emit(0x9fc2ff, 0.25, { roughness: 0.4 }),
  );
  spin.add(nuc);
  specimen.part(
    'Nucleoid (chromosome)',
    'One circular chromosome of about 4.6 million base pairs, folded into a dense tangle without a nuclear envelope. It can be copied in roughly 40 minutes and E. coli can divide every 20.',
    nuc,
  );
  const rib = createRibosomeCloud(
    480,
    (r) => {
      for (;;) {
        const p = vec3((r() * 2 - 1) * 0.38, (r() * 2 - 1) * 0.88, (r() * 2 - 1) * 0.38);
        if (Math.hypot(p.x, p.z) < 0.37) {
          return p;
        }
      }
    },
    materialFactory.soft(0xe8a45b),
    0.02,
    4,
  );
  spin.add(rib);
  specimen.part(
    'Ribosomes',
    'Thousands of 70S ribosomes read messenger RNA and build proteins. They are smaller than the 80S ribosomes of the cells in the rest of this library, and many antibiotics target them.',
    rib,
  );
  const pls = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.012, 8, 24),
      materialFactory.emit(0x7be0a1, 0.35),
    );
    t.position.set((random() - 0.5) * 0.4, (random() - 0.5) * 1.4, (random() - 0.5) * 0.3);
    t.rotation.set(random() * 3, random() * 3, 0);
    pls.add(t);
  }
  spin.add(pls);
  specimen.part(
    'Plasmids',
    'Small circular DNA rings that replicate on their own. They often carry extra genes such as antibiotic resistance and can be passed to neighbouring bacteria.',
    pls,
  );
  const NF = 6;
  const fm = materialFactory.soft(0xe9efe4, { roughness: 0.4 });
  const fls = [];
  const fg = new THREE.Group();
  for (let i = 0; i < NF; i++) {
    const angle = random() * TAU;
    const y = (random() * 2 - 1) * 0.8;
    const f = new Flagellum(fm, { n: 90, rad: 6, r0: 0.022, r1: 0.018 });
    const d = vec3(
      Math.cos(angle),
      Math.abs(y) > 0.5 ? Math.sign(y) * 0.5 : 0,
      Math.sin(angle),
    ).normalize();
    fls.push({
      f,
      o: d
        .clone()
        .multiplyScalar(0.52)
        .add(vec3(0, y, 0)),
      d,
      s: perpendicularDirection(d),
      ph: random() * TAU,
    });
    fg.add(f.mesh);
  }
  spin.add(fg);
  specimen.part(
    'Flagella',
    'Long helical filaments, each turned by a rotary motor in the cell envelope at up to about 100 revolutions a second. When the motors rotate together, the filaments bundle and push the cell forward.',
    fg,
  );
  const NP = 140;
  const pm = materialFactory.soft(0xf4f4ee, { transparent: true, opacity: 0.75 });
  const pg2 = new THREE.CylinderGeometry(0.005, 0.007, 0.38, 4);
  pg2.translate(0, 0.19, 0);
  const pil = createInstancedMesh(pg2, pm, NP);
  for (let i = 0; i < NP; i++) {
    const angle = random() * TAU;
    const y = (random() * 2 - 1) * 0.85;
    const d = vec3(Math.cos(angle), 0, Math.sin(angle));
    setInstanceTransform(
      pil,
      i,
      d
        .clone()
        .multiplyScalar(0.5)
        .add(vec3(0, y, 0)),
      quaternionFromUp(d),
    );
  }
  spin.add(pil);
  specimen.part(
    'Pili (fimbriae)',
    'Short, hair-like protein filaments that stick to surfaces such as the gut lining. Longer sex pili can link two bacteria to transfer plasmid DNA.',
    pil,
  );
  specimen.anim((t) => {
    spin.rotation.y = t * 0.25;
    fls.forEach((o) => o.f.helix(o.o, o.d, o.s, 3.2, 0.14, 1.1, -t * 9 + o.ph, 0.3));
    cell.rotation.x = Math.sin(t * 0.6) * 0.08;
  });
}

/* ================= LACTOBACILLUS ================= */
export function buildLactobacillus(specimen) {
  const R = createSeededRandom(14);
  const N = 4;
  const chain = new THREE.Group();
  specimen.add(chain);
  const wm = materialFactory.shell(0xb7a0d8, 0.42, { bumpScale: 0.8, iridescence: 0.25 });
  const mm = materialFactory.shell(0xe6dca6, 0.3, { bumpScale: 0.2 });
  const sm = materialFactory.soft(0xa690d1, { transparent: true, opacity: 0.85 });
  const nm = materialFactory.emit(0x9fc2ff, 0.25, { roughness: 0.4 });
  const walls = new THREE.Group();
  const mems = new THREE.Group();
  const septa = new THREE.Group();
  const nucs = new THREE.Group();
  const ribs = new THREE.Group();
  const cells = [];
  for (let i = 0; i < N; i++) {
    const c = new THREE.Group();
    const x = (i - (N - 1) / 2) * 1.85;
    c.position.set(x, 0.22 * Math.cos(x * 0.45) - 0.1, 0);
    c.rotation.z = Math.PI / 2 + Math.sin(x * 0.45) * 0.1 - 0.02;
    chain.add(c);
    const last = i === N - 1;
    const l = last ? 1.25 : 1.5;
    const w = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, l, 12, 28), wm);
    w.renderOrder = 9;
    walls.add(w);
    c.add(w);
    w.position.y = 0;
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, l, 12, 28), mm);
    mesh.renderOrder = 7;
    c.add(mesh);
    mems.add(mesh);
    const nu = createTubeAlongCurve(loopCurve(R, 26, vec3(0.12, l * 0.5, 0.12)), 220, 5, 0.011, nm);
    c.add(nu);
    nucs.add(nu);
    const rb = createRibosomeCloud(
      90,
      (r) => {
        for (;;) {
          const p = vec3(
            (r() * 2 - 1) * 0.24,
            (r() * 2 - 1) * (l / 2 + 0.15),
            (r() * 2 - 1) * 0.24,
          );
          if (Math.hypot(p.x, p.z) < 0.23) {
            return p;
          }
        }
      },
      materialFactory.soft(0xe8a45b),
      0.017,
      40 + i,
    );
    c.add(rb);
    ribs.add(rb);
    cells.push(c);
    if (i < N - 1) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 28), sm);
      s.position.copy(c.position).add(vec3(0.92, 0.0, 0));
      s.rotation.z = Math.PI / 2;
      s.position.y = 0.22 * Math.cos((x + 0.92) * 0.45) - 0.1;
      septa.add(s);
      chain.add(s);
    }
  }
  specimen.part(
    'Thick cell wall',
    'A Gram-positive wall: many layers of peptidoglycan threaded with teichoic acids. It is far thicker than in E. coli, which is why these cells hold the violet Gram stain.',
    walls,
    { shell: true },
  );
  specimen.part(
    'Cytoplasmic membrane',
    'A single lipid bilayer just under the wall. Lactobacilli make energy by fermenting sugars, and the membrane helps pump out the lactic acid that results.',
    mems,
    { shell: true },
  );
  specimen.part(
    'Septum (division site)',
    'Cells divide by growing a ring of new wall inward across the middle. Daughter cells often stay linked end-to-end, which is why Lactobacillus appears as chains.',
    septa,
  );
  specimen.part(
    'Nucleoid',
    'A single circular chromosome of roughly 2 to 3 million base pairs, packed into a tangle in the cell centre. It is smaller than E. coli, which suits a specialist that lives on rich food.',
    nucs,
  );
  specimen.part(
    'Ribosomes',
    'Protein-making machines scattered through the cytoplasm. Lactobacilli grow slowly compared to E. coli, so they carry fewer of them.',
    ribs,
  );
  specimen.anim((t) => {
    chain.rotation.x = t * 0.15;
    chain.rotation.z = Math.sin(t * 0.3) * 0.06;
  });
}

/* ================= SPIRILLUM ================= */
export function buildSpirillum(specimen) {
  const random = createSeededRandom(5);
  const spin = new THREE.Group();
  specimen.add(spin);
  const k = TAU / 1.9;
  const path = new THREE.CatmullRomCurve3(
    Array.from({ length: 140 }, (_, i) => {
      const x = -2.6 + (5.2 * i) / 139;
      return vec3(x, 0.42 * Math.cos(k * x), 0.42 * Math.sin(k * x));
    }),
  );
  const body = createTubeAlongCurve(
    path,
    200,
    16,
    (t) => 0.11 * (0.45 + 0.55 * Math.pow(Math.sin(Math.PI * t), 0.35)),
    materialFactory.shell(0xcfe0a8, 0.3, { bumpScale: 0.8, iridescence: 0.3 }),
  );
  body.renderOrder = 9;
  spin.add(body);
  specimen.part(
    'Rigid helical cell',
    'Spirillum is a stiff, corkscrew-shaped bacterium. Its shape lets it bore through thick, watery environments, and the rigid wall keeps the coils from flexing.',
    body,
    { shell: true },
  );
  const nuc = createTubeAlongCurve(
    path,
    200,
    6,
    (t) => 0.035 * Math.sin(Math.PI * t) ** 0.3,
    materialFactory.emit(0x9fc2ff, 0.3),
  );
  spin.add(nuc);
  specimen.part(
    'Nucleoid',
    'The chromosome stretches along the inside of the coil. Because the cell is so narrow, it is held as a thin, extended strand rather than a compact ball.',
    nuc,
  );
  const vg = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.soft(0xd6a24a, { roughness: 0.35 }),
    9,
  );
  const points = path.getPoints(60);
  for (let i = 0; i < 9; i++) {
    setInstanceTransform(
      vg,
      i,
      points[6 + i * 6].clone().add(vec3(0, 0, 0)),
      null,
      0.05 + random() * 0.02,
    );
  }
  spin.add(vg);
  specimen.part(
    'Volutin granules',
    'Dense storage granules of polyphosphate. They act as a reserve of phosphate and energy that the cell can draw on when nutrients run short.',
    vg,
  );
  const fm = materialFactory.soft(0xe9efe4);
  const tufts = [];
  const fg = new THREE.Group();
  for (const sgn of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const f = new Flagellum(fm, { n: 70, rad: 5, r0: 0.02, r1: 0.015 });
      const a = (i / 4) * TAU;
      const d = vec3(sgn, Math.cos(a) * 0.25, Math.sin(a) * 0.25).normalize();
      tufts.push({
        f,
        o: points[sgn < 0 ? 0 : 59].clone(),
        d,
        s: perpendicularDirection(d),
        ph: i,
      });
      fg.add(f.mesh);
    }
  }
  spin.add(fg);
  specimen.part(
    'Polar flagella tufts',
    'A bundle of flagella grows from each end. Spinning them pulls the cell along like a screw, and the whole body rotates in the opposite direction as it goes.',
    fg,
  );
  specimen.anim((t) => {
    spin.rotation.x = t * 1.1;
    tufts.forEach((o) => o.f.helix(o.o, o.d, o.s, 1.9, 0.12, 0.8, -t * 9 * -o.d.x + o.ph, 0.3));
    specimen.group.rotation.z = Math.sin(t * 0.4) * 0.05;
  });
}

/* ================= STAPHYLOCOCCUS ================= */
export function buildStaphylococcus(specimen) {
  const random = createSeededRandom(17);
  const r = 0.42;
  const pos = [vec3(0, 0, 0), vec3(0.62, 0, 0)];
  while (pos.length < 15) {
    pos.push(randomPointInUnitBall(random).multiplyScalar(1.5));
  }
  for (let it = 0; it < 220; it++) {
    for (let i = 2; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        if (i !== j) {
          const d = pos[i].clone().sub(pos[j]);
          const L = d.length();
          if (L < r * 1.9 && L > 1e-4) {
            pos[i].addScaledVector(d.normalize(), (r * 1.9 - L) * 0.5);
          }
        }
      }
      pos[i].multiplyScalar(0.995);
    }
  }
  const c0 = pos.reduce((a, p) => a.add(p), vec3()).multiplyScalar(1 / pos.length);
  pos.forEach((p) => p.sub(c0));
  const wm = materialFactory.shell(0xe3b84e, 0.5, { bumpScale: 1.1, iridescence: 0.2 });
  const mm = materialFactory.shell(0xf0dfa0, 0.28, { bumpScale: 0.1 });
  const prm = materialFactory.soft(0xfff1c8);
  const nm = materialFactory.emit(0x9fc2ff, 0.28, { roughness: 0.4 });
  const walls = new THREE.Group();
  const mems = new THREE.Group();
  const nucs = new THREE.Group();
  const nGeo = createTubeAlongCurve(
    loopCurve(random, 20, vec3(0.16, 0.16, 0.16)),
    160,
    5,
    0.011,
    nm,
  ).geometry;
  const NPR = 26;
  const prot = createInstancedMesh(sharedGeometries.sphereLo, prm, pos.length * NPR);
  const fp = fibonacciSphere(NPR);
  const NR = 28;
  const rib = createInstancedMesh(
    sharedGeometries.sphereLo,
    materialFactory.soft(0xe8a45b),
    pos.length * NR,
  );
  pos.forEach((p, i) => {
    const w = new THREE.Mesh(sharedGeometries.sphere, wm);
    w.scale.setScalar(r);
    w.position.copy(p);
    w.renderOrder = 9;
    walls.add(w);
    const mesh = new THREE.Mesh(sharedGeometries.sphere, mm);
    mesh.scale.setScalar(r - 0.045);
    mesh.position.copy(p);
    mesh.renderOrder = 7;
    mems.add(mesh);
    const nu = new THREE.Mesh(nGeo, nm);
    nu.position.copy(p);
    nu.rotation.set(random() * 3, random() * 3, random() * 3);
    nucs.add(nu);
    fp.forEach((d, k) => {
      const dd = d.clone().applyAxisAngle(vec3(0, 1, 0), i * 1.3);
      setInstanceTransform(
        prot,
        i * NPR + k,
        p.clone().addScaledVector(dd, r),
        quaternionFromUp(dd),
        0.028,
      );
    });
    for (let k = 0; k < NR; k++) {
      setInstanceTransform(
        rib,
        i * NR + k,
        p.clone().add(randomPointInUnitBall(random).multiplyScalar(0.28)),
        null,
        0.017,
      );
    }
  });
  const sep = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.33, 0.04, 32),
    materialFactory.soft(0xd49f33, { transparent: true, opacity: 0.9 }),
  );
  sep.position.set(0.31, 0, 0);
  sep.rotation.z = Math.PI / 2;
  const grp = new THREE.Group();
  grp.add(walls, mems, nucs, prot, rib, sep);
  specimen.add(grp);
  specimen.part(
    'Cell wall (peptidoglycan)',
    'A thick Gram-positive wall of cross-linked peptidoglycan. Staphylococcus aureus is named for its golden colonies and the grape-like clusters (staphylo means bunch of grapes) formed as cells divide in several planes.',
    walls,
    { shell: true },
  );
  specimen.part(
    'Cytoplasmic membrane',
    'A lipid bilayer just inside the wall. It is a target of some antibiotics, and it hosts enzymes for respiration and for building new wall material.',
    mems,
    { shell: true },
  );
  specimen.part(
    'Surface proteins',
    'The wall is decorated with surface proteins such as protein A, which binds antibodies, and adhesins that help the cell stick to skin and tissue.',
    prot,
  );
  specimen.part(
    'Nucleoid',
    'The single circular chromosome, about 2.8 million base pairs, lies coiled in the middle of each coccus. Cells copy it before they divide.',
    nucs,
  );
  specimen.part(
    'Ribosomes',
    'Small 70S ribosomes translate genes into protein, including toxins and enzymes that help the bacterium invade tissue.',
    rib,
  );
  specimen.part(
    'Division septum',
    'The two joined cells in the cluster are dividing: a disc of new wall (the septum) grows inward across the middle until it splits the cell in two. Cell separation then leaves the daughters stuck in a cluster.',
    sep,
  );
  specimen.cut(wm, mm);
  specimen.anim((t) => {
    grp.rotation.y = t * 0.12;
    grp.rotation.x = Math.sin(t * 0.2) * 0.2;
  });
}

/* ================= BACTERIOPHAGE T4 ================= */
export function buildBacteriophage(specimen) {
  const group = new THREE.Group();
  specimen.add(group);
  const hg = new THREE.IcosahedronGeometry(0.62, 1);
  hg.scale(1, 1.5, 1);
  const cap = specimen.mesh(hg, materialFactory.glass(0x88b4e0, 0.4, { flatShading: true }), {
    p: vec3(0, 2.05, 0),
    parent: group,
    ro: 8,
  });
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(hg, 1),
    new THREE.LineBasicMaterial({ color: 0xa6e6ff, transparent: true, opacity: 0.55 }),
  );
  edges.position.copy(cap.position);
  group.add(edges);
  specimen.part(
    'Capsid (head)',
    'A prolate icosahedron built from hundreds of copies of a few proteins. The head is about 120 by 90 nanometres and withstands pressure of roughly 60 atmospheres from the packed DNA.',
    cap,
    { shell: true },
  );
  const dna = [];
  for (let i = 0; i <= 700; i++) {
    const t = i / 700;
    const ph = t * TAU * 16;
    const R = 0.16 + 0.2 * (0.5 + 0.5 * Math.sin(t * TAU * 4));
    dna.push(
      vec3(Math.cos(ph) * R, 2.05 + (t * 2 - 1) * 0.74 + 0.05 * Math.sin(ph * 2), Math.sin(ph) * R),
    );
  }
  const dm = createTubeThroughPoints(
    dna,
    6,
    0.026,
    materialFactory.emit(0xffc65a, 0.55, { roughness: 0.35 }),
  );
  group.add(dm);
  specimen.part(
    'DNA genome',
    'About 170,000 base pairs of double-stranded DNA, packed so tightly that the strands are almost crystalline. It is pushed in by a molecular motor at the portal.',
    dm,
  );
  const col = specimen.mesh(
    new THREE.CylinderGeometry(0.25, 0.17, 0.12, 18),
    materialFactory.soft(0x7ab8e8),
    { p: vec3(0, 1.0, 0), parent: group },
  );
  specimen.part(
    'Neck and collar',
    'The neck joins the head to the tail. Whisker-like fibres around the collar help control when the long tail fibres extend.',
    col,
  );
  const NS = 12;
  const sm = materialFactory.soft(0x5f9fd6, {
    transparent: true,
    opacity: 0.88,
    bumpMap: textureLibrary.bump,
    bumpScale: 1.5,
  });
  const sh = createInstancedMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 20), sm, NS);
  group.add(sh);
  specimen.part(
    'Contractile sheath',
    'A helical sleeve of protein wrapped around the tail tube. When the baseplate binds the host, the sheath contracts to about half its length, driving the tube through the bacterial wall like a syringe.',
    sh,
  );
  const core = specimen.mesh(
    sharedGeometries.cyl,
    materialFactory.soft(0xd9ebf8, { roughness: 0.3 }),
    { p: vec3(0, -0.55, 0), s: vec3(0.07, 3.1, 0.07), parent: group },
  );
  specimen.part(
    'Tail tube (core)',
    'A hollow needle in the centre of the tail. During infection it is pushed through the outer layers of the host, and the phage DNA passes through its channel.',
    core,
  );
  const bpg = new THREE.Group();
  group.add(bpg);
  const bp = specimen.mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.13, 6),
    materialFactory.soft(0x4d86be),
    { parent: bpg, p: vec3(0, 0, 0) },
  );
  const pm = materialFactory.soft(0x3b6c9b);
  const fm = materialFactory.soft(0xa7d0f0, { roughness: 0.45 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    specimen.mesh(new THREE.ConeGeometry(0.04, 0.24, 6), pm, {
      parent: bpg,
      p: vec3(Math.cos(a) * 0.3, -0.17, Math.sin(a) * 0.3),
      r: [Math.PI, 0, 0],
    });
  }
  specimen.part(
    'Baseplate',
    'A hexagonal plate of about 150 protein subunits. Its pins and fibres sense the host surface, and when enough of them are bound the baseplate changes shape and triggers sheath contraction.',
    bp,
  );
  const fibs = new THREE.Group();
  bpg.add(fibs);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const points = new THREE.CatmullRomCurve3([
      vec3(c * 0.3, 0.05, s * 0.3),
      vec3(c * 0.75, 0.15, s * 0.75),
      vec3(c * 1.15, 0.1, s * 1.15),
      vec3(c * 1.35, -0.45, s * 1.35),
      vec3(c * 1.4, -0.8, s * 1.4),
    ]).getPoints(26);
    fibs.add(createTubeThroughPoints(points, 5, (t) => 0.026 * (1 - t * 0.25), fm));
  }
  specimen.part(
    'Long tail fibres',
    'Six jointed fibres that bind to receptors on the E. coli surface. Each one is about 145 nanometres long and works like landing gear: first contact is reversible, then more fibres lock on.',
    fibs,
  );
  const sheathTop = 0.94;
  const ring = vec3();
  const q = new THREE.Quaternion();
  specimen.anim((t) => {
    const ph = t % 18;
    let c;
    if (ph < 6) {
      c = 0;
    } else if (ph < 8.5) {
      c = smoothStep(6, 8.5, ph);
    } else if (ph < 13) {
      c = 1;
    } else {
      c = 1 - smoothStep(13, 15.5, ph);
    }
    const s = 1 - 0.5 * c;
    for (let i = 0; i < NS; i++) {
      ring.set(0, sheathTop - (i + 0.5) * 0.2 * s, 0);
      q.setFromEuler(new THREE.Euler(0, i * 0.3, 0));
      setInstanceTransform(
        sh,
        i,
        ring,
        q,
        vec3(1 + 0.28 * c, (1 - 0.5 * c) * 0.95 + 0.05, 1 + 0.28 * c),
      );
    }
    sh.instanceMatrix.needsUpdate = true;
    bpg.position.y = sheathTop - 12 * 0.2 * s - 0.06;
    bpg.rotation.y = c * 0.3;
    group.rotation.z = Math.sin(t * 0.4) * 0.06;
    group.rotation.y = t * 0.15;
  });
}

/* ================= spiked virions ================= */
export function createSpikeGeometry(parts) {
  return mergeGeometries(
    parts.map(([geometry, y, sc]) => {
      const g = geometry.clone();
      if (sc) {
        g.scale(...sc);
      }
      g.translate(0, y, 0);
      return g;
    }),
  );
}
function scatterSpikes(specimen, geometry, material, dirs, random, r0, sMin = 0.9, sMax = 1.1) {
  const m = createInstancedMesh(geometry, material, dirs.length);
  dirs.forEach((d, i) =>
    setInstanceTransform(
      m,
      i,
      d.clone().multiplyScalar(r0),
      quaternionFromUp(d.clone().add(randomDirection(random).multiplyScalar(0.06))),
      sMin + random() * (sMax - sMin),
    ),
  );
  return m;
}
export function buildInfluenza(specimen) {
  const random = createSeededRandom(12);
  const group = new THREE.Group();
  specimen.add(group);
  const env = specimen.mesh(
    new THREE.SphereGeometry(1, 72, 52),
    materialFactory.shell(0x92b8cd, 0.3, { iridescence: 0.4, bumpScale: 0.5 }),
    { parent: group, ro: 9 },
  );
  const mx = specimen.mesh(
    new THREE.SphereGeometry(0.9, 48, 36),
    materialFactory.shell(0xd7c690, 0.26, { bumpScale: 1 }),
    { parent: group, ro: 7 },
  );
  specimen.part(
    'Lipid envelope',
    'A membrane stolen from the infected cell as the new virus buds out. It is a lipid bilayer carrying the viral proteins, and can be dissolved by soap, which is one reason hand washing works.',
    env,
    { shell: true },
  );
  specimen.part(
    'Matrix layer (M1)',
    'A shell of matrix protein M1 lines the inside of the envelope. It gives the virion its shape and links the membrane to the genome segments inside.',
    mx,
    { shell: true },
  );
  const dirs = fibonacciSphere(330);
  const haD = [];
  const naD = [];
  dirs.forEach((d) => (random() < 0.8 ? haD : naD).push(d));
  const haM = materialFactory.soft(0xe0667a, { roughness: 0.45 });
  const naM = materialFactory.soft(0x5fb3a1, { roughness: 0.45 });
  const haG = createSpikeGeometry([
    [new THREE.CylinderGeometry(0.026, 0.038, 0.22, 6), 0.11],
    [new THREE.CylinderGeometry(0.075, 0.045, 0.14, 6), 0.29],
  ]);
  const naG = createSpikeGeometry([
    [new THREE.CylinderGeometry(0.016, 0.022, 0.22, 6), 0.11],
    [sharedGeometries.sphereMid, 0.26, [0.11, 0.045, 0.11]],
  ]);
  const ha = scatterSpikes(specimen, haG, haM, haD, random, 0.97);
  const na = scatterSpikes(specimen, naG, naM, naD, random, 0.97);
  group.add(ha, na);
  specimen.part(
    'Hemagglutinin (HA)',
    'The most abundant spike. HA binds sialic acid on the surface of airway cells and lets the virus enter. Antibodies mostly target HA, and its changes (drift and shift) are why flu vaccines are updated each year.',
    ha,
  );
  specimen.part(
    'Neuraminidase (NA)',
    'A mushroom-shaped enzyme that cuts sialic acid. It frees new virions from the cell they were made in. Drugs such as oseltamivir block it, and the N in H1N1 stands for this protein.',
    na,
  );
  const rn = new THREE.Group();
  const rm = materialFactory.soft(0xe8b44c, { roughness: 0.4 });
  const pol = materialFactory.soft(0xb04a3a);
  for (let i = 0; i < 8; i++) {
    const a = (i / 7) * TAU;
    const c =
      i === 7 ? vec3(0, 0, 0) : vec3(Math.cos(a) * 0.3, (random() - 0.5) * 0.12, Math.sin(a) * 0.3);
    const len = 0.5 + random() * 0.25;
    const points = [];
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      points.push(
        vec3(c.x + 0.016 * Math.sin(t * 40), c.y + (t - 0.5) * len, c.z + 0.016 * Math.cos(t * 40)),
      );
    }
    rn.add(createTubeThroughPoints(points, 7, (t) => 0.038 * (1 + 0.3 * Math.sin(t * 90)), rm));
    for (let k = 0; k < 3; k++) {
      const s = new THREE.Mesh(sharedGeometries.sphereMid, pol);
      s.scale.setScalar(0.05);
      s.position.set(c.x + (k - 1) * 0.045, c.y - len / 2 - 0.03, c.z + (k === 1 ? 0.04 : 0));
      rn.add(s);
    }
  }
  group.add(rn);
  specimen.part(
    'RNP segments (genome)',
    'The genome is eight separate strands of RNA, each coiled with nucleoprotein into a rod. This split genome lets two flu strains in one cell swap segments, producing new pandemic variants.',
    rn,
  );
  specimen.cut(env.material, mx.material, haM, naM);
  specimen.anim((t) => {
    group.rotation.y = t * 0.18;
    group.rotation.x = Math.sin(t * 0.3) * 0.25;
  });
}
export function buildCorona(specimen) {
  const random = createSeededRandom(19);
  const group = new THREE.Group();
  specimen.add(group);
  const env = specimen.mesh(
    new THREE.SphereGeometry(1, 72, 52),
    materialFactory.shell(0x9aa9d4, 0.3, { iridescence: 0.35, bumpScale: 0.6 }),
    { parent: group, ro: 9 },
  );
  specimen.part(
    'Lipid envelope',
    'A lipid bilayer taken from the host cell as new virions bud from internal membranes. Coronavirus particles are around 100 nanometres wide, about 1,000 times narrower than a human hair.',
    env,
    { shell: true },
  );
  const sM = materialFactory.soft(0xdc6a4c, { roughness: 0.45 });
  createSpikeGeometry([
    [new THREE.CylinderGeometry(0.035, 0.05, 0.28, 6), 0.14],
    [sharedGeometries.sphereMid, 0.38, [0.075, 0.1, 0.075]],
    [sharedGeometries.sphereMid, 0.38, [0.075, 0.1, 0.075]],
  ]);
  const trimer = (() => {
    const parts = [[new THREE.CylinderGeometry(0.03, 0.045, 0.26, 6), 0.13]];
    const gs = [parts[0]].map(([geometry, y]) => {
      const q = geometry.clone();
      q.translate(0, y, 0);
      return q;
    });
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU;
      const s = new THREE.SphereGeometry(0.07, 12, 10);
      s.scale(1, 1.4, 1);
      s.translate(Math.cos(a) * 0.045, 0.36, Math.sin(a) * 0.045);
      gs.push(s);
    }
    const top = new THREE.SphereGeometry(0.06, 10, 8);
    top.translate(0, 0.42, 0);
    gs.push(top);
    return mergeGeometries(gs);
  })();
  const sp = scatterSpikes(specimen, trimer, sM, fibonacciSphere(78), random, 0.97, 0.95, 1.1);
  group.add(sp);
  specimen.part(
    'Spike (S) protein',
    'The crown that gives coronaviruses their name. Each spike is a trimer that binds a receptor on the host cell (ACE2 for SARS-CoV-2) and then fuses the viral and cell membranes. Many vaccines and antibodies target it.',
    sp,
  );
  const mM = materialFactory.soft(0x7f93c2);
  const eM = materialFactory.soft(0xf0c38c);
  const mp = createInstancedMesh(sharedGeometries.sphereLo, mM, 190);
  const ep = createInstancedMesh(sharedGeometries.sphereMid, eM, 22);
  const md = fibonacciSphere(190);
  const ed = fibonacciSphere(22);
  md.forEach((d, i) =>
    setInstanceTransform(mp, i, d.clone().multiplyScalar(1.0), null, 0.034 + random() * 0.01),
  );
  ed.forEach((d, i) => setInstanceTransform(ep, i, d.clone().multiplyScalar(1.0), null, 0.055));
  group.add(mp, ep);
  specimen.part(
    'Membrane (M) and envelope (E) proteins',
    'M is the most plentiful envelope protein and shapes the virion. E forms small channel-like pentamers. Together they guide assembly and budding of new particles.',
    [mp, ep],
  );
  const points = [];
  for (let i = 0; i < 80; i++) {
    points.push(randomPointInUnitBall(random).multiplyScalar(0.62));
  }
  const nc = createTubeAlongCurve(
    new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.6),
    900,
    6,
    (t) => 0.026 * (1 + 0.35 * Math.sin(t * 520)),
    materialFactory.soft(0xf0b254, { roughness: 0.4 }),
  );
  group.add(nc);
  specimen.part(
    'Nucleocapsid and RNA genome',
    'A single strand of RNA about 30,000 bases long, among the largest of any RNA virus, coiled with nucleocapsid (N) protein into a beaded helix.',
    nc,
  );
  specimen.cut(env.material, sM);
  specimen.anim((t) => {
    group.rotation.y = t * 0.16;
    group.rotation.x = Math.sin(t * 0.27) * 0.3;
  });
}
