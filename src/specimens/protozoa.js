/**
 * Specimens: protozoa.
 *
 * Specimen builders: didinium, plasmodium, stentor, tetrahymena, trypanosoma, vorticella.
 */

import * as THREE from 'three';
import {
  sharedGeometries,
  AnimatedTube,
  scratchObject,
  createInstancedMesh,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import {
  TAU,
  vec3,
  clamp,
  fibonacciSphere,
  lerp,
  quaternionFromUp,
  smoothStep,
} from '../engine/math.js';
import { createCanvasTexture } from '../engine/textures.js';
import { createRedBloodCellLathe } from './cells.js';
import {
  ADDITIONAL_BUILDERS,
  ADDITIONAL_SPECIMENS,
  plantMaterials,
  UP_AXIS,
  createCiliaSet,
  cyclePhase,
  latheBody,
  lathePoints,
  spherePoints,
} from './shared-helpers.js';

const snapPulse = (k, a = 0.05, b = 0.5) =>
  k < a ? smoothStep(0, a, k) : Math.max(0, 1 - smoothStep(a, b, k));
const stripeTex = (c1, c2, n = 28) =>
  createCanvasTexture(256, 32, (g, w, h) => {
    g.fillStyle = c1;
    g.fillRect(0, 0, w, h);
    g.fillStyle = c2;
    for (let i = 0; i < n; i++) {
      g.fillRect((i * w) / n + 2, 0, (w / n) * 0.35, h);
    }
  });

/* ---------- Stentor ---------- */
function buildStentor(specimen) {
  const L = 5.2;
  const radiusAt = (u) => 0.09 + 0.98 * Math.pow(u, 2.2);
  const bg = new THREE.Group();
  bg.position.y = -L / 2;
  specimen.add(bg);
  const geometry = latheBody(L, radiusAt, 60, 40);
  geometry.translate(0, L / 2, 0);
  const tex = stripeTex('#7cc1c4', '#2f7f8d');
  tex.wrapS = THREE.RepeatWrapping;
  const body = specimen.mesh(
    geometry,
    materialFactory.shell(0xffffff, 0.62, { map: tex, bumpScale: 0.15, clearcoat: 0.5 }),
    { parent: bg, ro: 8 },
  );
  specimen.part(
    'Pellicle and stentorin stripes',
    'The flexible, ridged cell surface holds stripes of blue-green granules of the pigment stentorin. Contractile fibres (myonemes) beneath the ridges let the cell shorten to a ball within milliseconds.',
    body,
    { shell: true },
  );
  const rt = radiusAt(1);
  const disc = specimen.mesh(
    new THREE.CircleGeometry(rt, 48),
    plantMaterials.cuticle(0xb7d9d6, { side: THREE.DoubleSide, opacity: 0.9, transparent: true }),
    { parent: bg, p: vec3(0, L + 0.005, 0), r: [-Math.PI / 2, 0, 0], ro: 9 },
  );
  const rim = specimen.mesh(
    new THREE.TorusGeometry(rt, 0.06, 8, 64),
    plantMaterials.cuticle(0x2f7f8d),
    { parent: bg, p: vec3(0, L, 0), r: [Math.PI / 2, 0, 0] },
  );
  const ring = { P: [], N: [] };
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * TAU;
    ring.P.push(vec3(Math.cos(a) * (rt + 0.02), L + 0.02, Math.sin(a) * (rt + 0.02)));
    ring.N.push(vec3(Math.cos(a) * 0.8, 0.6, Math.sin(a) * 0.8).normalize());
  }
  const mem = createCiliaSet(specimen, plantMaterials.cuticle(0xe8f4f2), ring.P, ring.N, {
    len: 0.38,
    r: 0.035,
    amp: 0.55,
    speed: 9,
    wave: -5,
    axis: vec3(0, 0, 1),
    parent: bg,
  });
  const mouth = specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x24585f), {
    parent: bg,
    p: vec3(rt * 0.55, L - 0.02, 0),
    s: vec3(0.2, 0.12, 0.26),
  });
  specimen.part(
    'Oral disc and membranelles',
    'The wide crown carries a spiral band of fused cilia called membranelles. Their beating makes a whirlpool that sweeps bacteria, algae and even other ciliates toward the mouth at the centre of the spiral.',
    [disc, rim, mem, mouth],
  );
  const mac = new THREE.Group();
  bg.add(mac);
  const mm = materialFactory.grain(0xb69ad8);
  for (let i = 0; i < 9; i++) {
    const u = 0.22 + i * 0.075;
    specimen.mesh(sharedGeometries.sphere, mm, {
      parent: mac,
      p: vec3(Math.sin(i * 1.4) * 0.12, u * L, Math.cos(i * 1.4) * 0.12),
      s: vec3(0.17, 0.2, 0.17),
    });
  }
  specimen.part(
    'Macronucleus',
    'A chain of beads (moniliform macronucleus) holds many copies of every gene and runs the cell day to day. A separate micronucleus, used in sexual exchange, is much smaller and easily missed.',
    mac,
  );
  const body2 = createCiliaSet(
    specimen,
    plantMaterials.cuticle(0xcfe7e6),
    ...(() => {
      const p = lathePoints(L, radiusAt, 520, { rows: 26, u0: 0.12, u1: 0.96, seed: 3 });
      p.P.forEach((v) => (v.y += L / 2));
      return [p.P, p.N];
    })(),
    { len: 0.12, r: 0.014, amp: 0.5, speed: 7, wave: 2.5, axis: vec3(0, 1, 0), parent: bg },
  );
  specimen.part(
    'Somatic cilia',
    'Rows of short cilia run lengthwise down the body. A stentor usually stays anchored, but it can let go and swim with them when disturbed or short of food. Only a sample of the cilia is drawn.',
    body2,
  );
  const cv = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xdff3f5, 0.55), {
    parent: bg,
    p: vec3(-0.62, L * 0.84, 0.2),
    s: 0.22,
    ro: 7,
  });
  specimen.part(
    'Contractile vacuole',
    'Fills with excess water from the cytoplasm and empties through a pore. Freshwater ciliates need this pump to keep from swelling.',
    cv,
  );
  const hf = new THREE.Group();
  bg.add(hf);
  specimen.mesh(sharedGeometries.cone, plantMaterials.cuticle(0x8a8f84), {
    parent: hf,
    p: vec3(0, 0, 0),
    s: vec3(0.16, 0.22, 0.16),
    r: [Math.PI, 0, 0],
  });
  specimen.mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.06, 24),
    plantMaterials.cuticle(0x8a8f84),
    { parent: hf, p: vec3(0, -0.2, 0) },
  );
  specimen.part(
    'Holdfast',
    'A sticky foot at the narrow end glues the cell to plants and debris. The cell can detach it, swim away and settle again elsewhere.',
    hf,
  );
  specimen.anim((t) => {
    const c = snapPulse(cyclePhase(t, 12), 0.035, 0.5);
    bg.scale.set(1 + 0.35 * c, 1 - 0.55 * c, 1 + 0.35 * c);
    bg.rotation.z = 0.07 * Math.sin(t * 0.6) * (1 - c);
    bg.rotation.x = 0.05 * Math.sin(t * 0.45);
  });
}
ADDITIONAL_BUILDERS.stentor = buildStentor;
ADDITIONAL_SPECIMENS.push({
  id: 'stentor',
  cat: 'protozoa',
  name: 'Stentor',
  latin: 'Stentor coeruleus',
  size: 'up to about 2 mm extended',
  sizeUm: 1500,
  U: 5.2,
  dist: 10.5,
  cls: 'Eukaryota · SAR · Ciliophora · Heterotrichea',
  habitat: 'Still freshwater ponds, attached to plants and debris',
  move: 'Usually anchored by a holdfast; contracts into a ball when touched, or detaches and swims',
  feed: 'Filter feeder: oral membranelles sweep bacteria, algae and small protists into the mouth',
  repro: 'Binary fission; sexual conjugation also occurs',
  desc: 'A trumpet-shaped giant among single cells. The blue-green body stretches from a sticky foot to a wide crown of beating membranelles that draws food into the mouth.',
  fun: [
    'Large enough to see without a microscope as a faint blue-green speck on pond weed.',
    'It can regenerate: a cut cell heals, and fragments that keep part of the macronucleus can grow into whole cells.',
    'The blue-green colour comes from the pigment stentorin.',
  ],
  note: 'Cilia are a sample of the real number. The contraction is shown every 12 seconds; real contractions are triggered by touch. Colours are natural.',
});

/* ---------- Vorticella ---------- */
function buildVorticella(specimen) {
  const NS = 70;
  const Ls = 4.5;
  const base = -2.5;
  const points = Array.from({ length: NS + 1 }, () => vec3());
  const sheath = new AnimatedTube(NS, 10, materialFactory.shell(0xc9d6c4, 0.5, { roughness: 0.3 }));
  const core = new AnimatedTube(NS, 8, materialFactory.emit(0xd88a62, 0.35, { roughness: 0.4 }));
  specimen.add(sheath.mesh);
  specimen.add(core.mesh);
  sheath.mesh.renderOrder = 4;
  specimen.mesh(new THREE.CylinderGeometry(0.9, 1, 0.18, 28), plantMaterials.cuticle(0x8a8473), {
    p: vec3(0, base - 0.09, 0),
  });
  const zoo = new THREE.Group();
  specimen.add(zoo);
  const BL = 1.5;
  const radiusAt = (u) =>
    u < 0.7 ? 0.13 + 0.66 * Math.sin(((u / 0.7) * Math.PI) / 2) : 0.79 - (u - 0.7) * 1.0;
  const geometry = latheBody(BL, radiusAt, 40, 36);
  geometry.translate(0, BL / 2, 0);
  const bell = specimen.mesh(geometry, materialFactory.shell(0x9fc7a0, 0.5, { clearcoat: 0.6 }), {
    parent: zoo,
    ro: 8,
  });
  specimen.part(
    'Zooid (bell) and pellicle',
    'The bell is a single cell about 50 to 150 micrometres across. A flexible pellicle covers it and the narrow base joins the stalk. There are no body cilia; the cell feeds with the ring at its rim.',
    bell,
    { shell: true },
  );
  const lip = specimen.mesh(
    new THREE.TorusGeometry(0.69, 0.075, 10, 48),
    plantMaterials.cuticle(0x6f9f78),
    { parent: zoo, p: vec3(0, BL * 0.98, 0), r: [Math.PI / 2, 0, 0] },
  );
  const rg = { P: [], N: [] };
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * TAU;
    rg.P.push(vec3(Math.cos(a) * 0.72, BL, Math.sin(a) * 0.72));
    rg.N.push(vec3(Math.cos(a) * 0.55, 0.83, Math.sin(a) * 0.55).normalize());
  }
  const cil = createCiliaSet(specimen, plantMaterials.cuticle(0xe5efe0), rg.P, rg.N, {
    len: 0.36,
    r: 0.03,
    amp: 0.5,
    speed: 10,
    wave: -6,
    axis: vec3(0, 0, 1),
    parent: zoo,
  });
  const pd = specimen.mesh(
    new THREE.CylinderGeometry(0.5, 0.56, 0.08, 32),
    plantMaterials.cuticle(0xb7d0b4, { transparent: true, opacity: 0.85 }),
    { parent: zoo, p: vec3(0, BL * 1.0, 0) },
  );
  specimen.part(
    'Peristome and oral cilia',
    'A raised rim, the peristome, bears two spiralling rows of cilia. Their beat draws a current of water, and the bacteria in it, down into the mouth.',
    [lip, cil, pd],
  );
  const mac = specimen.mesh(
    new THREE.TorusGeometry(0.34, 0.1, 10, 24, 4.4),
    materialFactory.grain(0xa98cc9),
    { parent: zoo, p: vec3(0, BL * 0.52, 0), r: [Math.PI / 2, 0, 0.8] },
  );
  specimen.part(
    'Macronucleus',
    'A long C-shaped nucleus carries many copies of the genes and controls the cell. A tiny micronucleus lies beside it.',
    mac,
  );
  const cv = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xe5f4ff, 0.6), {
    parent: zoo,
    p: vec3(0.32, BL * 0.82, 0.2),
    s: 0.15,
    ro: 7,
  });
  const fv = specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x7a8f4a), {
    parent: zoo,
    p: vec3(-0.2, BL * 0.38, 0.25),
    s: 0.17,
    ro: 6,
  });
  specimen.part(
    'Contractile and food vacuoles',
    'The contractile vacuole pumps out excess water. Food vacuoles hold swallowed bacteria while they are digested.',
    [cv, fv],
  );
  specimen.part(
    'Stalk sheath',
    'A fibrous sheath around the stalk anchors the cell to plants and debris. It can stand almost straight or coil like a spring.',
    sheath.mesh,
  );
  specimen.part(
    'Spasmoneme',
    'A bundle of calcium-driven protein fibres inside the stalk. When it fires, it shortens in about a hundredth of a second, pulling the stalk into a tight spiral. It relaxes slowly afterward.',
    core.mesh,
  );
  const T = vec3();

  specimen.anim((t) => {
    const c = snapPulse(cyclePhase(t, 9), 0.03, 0.42);
    const len = Ls * (1 - 0.78 * c);
    const rc = 0.5 * c;
    for (let i = 0; i <= NS; i++) {
      const s = i / NS;
      points[i].set(
        rc * Math.sin(s * TAU * 5) + 0.16 * Math.sin(s * 3 + t * 0.5) * (1 - c),
        base + s * len,
        rc * Math.cos(s * TAU * 5) - rc,
      );
    }
    sheath.update(points, () => 0.085);
    core.update(points, () => 0.04);
    T.subVectors(points[NS], points[NS - 2]).normalize();
    zoo.position.copy(points[NS]);
    zoo.quaternion.setFromUnitVectors(UP_AXIS, T);
    zoo.rotateY(t * 0.3);
  });
}
ADDITIONAL_BUILDERS.vorticella = buildVorticella;
ADDITIONAL_SPECIMENS.push({
  id: 'vorticella',
  cat: 'protozoa',
  name: 'Vorticella',
  latin: 'Vorticella convallaria',
  size: 'bell 50–150 µm; stalk up to about 1 mm',
  sizeUm: 100,
  U: 1.5,
  dist: 12,
  cls: 'Eukaryota · SAR · Ciliophora · Peritrichia',
  habitat: 'Freshwater and damp surfaces, attached to plants, debris and animals',
  move: 'Fixed on a stalk; the stalk coils in a split second and slowly extends again',
  feed: 'Filter feeder: oral cilia draw bacteria and small particles into the mouth',
  repro: 'Binary fission; the daughter grows a ring of cilia and swims off to settle elsewhere',
  desc: 'An upside-down bell on a spring-like stalk. When disturbed, the stalk coils in a few milliseconds, one of the fastest movements known in a single cell.',
  fun: [
    'Its stalk contraction is powered by calcium binding, not by the ATP-driven motors that move most cells.',
    'The free-swimming daughter cell (telotroch) is a ring-shaped swimmer that sheds its cilia once it settles.',
    'Colonies of related species, such as Carchesium, share branching stalks.',
  ],
  note: 'The stalk is drawn shorter than real life so bell and stalk fit together at one scale; real stalks reach around a millimetre. The contraction is repeated every 9 seconds.',
});

/* ---------- Trypanosoma ---------- */
function buildTrypanosoma(specimen) {
  const L = 5.2;
  const NB = 56;
  const NF = 70;
  const bp = Array.from({ length: NB + 1 }, () => vec3());
  const fp = Array.from({ length: NF + 1 }, () => vec3());
  const rfB = (s) =>
    0.34 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(s, 0, 1), 0.75)), 0.7) + 0.02;
  const body = new AnimatedTube(
    NB,
    16,
    materialFactory.shell(0xd9775c, 0.72, { clearcoat: 0.6, bumpScale: 0.2 }),
  );
  specimen.add(body.mesh);
  body.mesh.renderOrder = 6;
  const fl = new AnimatedTube(NF, 8, plantMaterials.cuticle(0xb25a40, { roughness: 0.35 }));
  specimen.add(fl.mesh);
  const memG = new THREE.BufferGeometry();
  const mp = new Float32Array((NF + 1) * 2 * 3);
  memG.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const mi = [];
  for (let i = 0; i < NF; i++) {
    const a = i * 2;
    mi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  memG.setIndex(mi);
  const mem = new THREE.Mesh(
    memG,
    new THREE.MeshPhysicalMaterial({
      color: 0xefae90,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      roughness: 0.4,
      depthWrite: false,
    }),
  );
  mem.frustumCulled = false;
  specimen.add(mem);
  const nuc = specimen.mesh(sharedGeometries.sphere, materialFactory.grain(0x7d6bb4), {
    s: vec3(0.26, 0.22, 0.22),
  });
  const kin = specimen.mesh(sharedGeometries.capsule, plantMaterials.dark(0x2f2a4a), {
    s: vec3(0.1, 0.14, 0.1),
  });
  const pocket = specimen.mesh(sharedGeometries.sphere, plantMaterials.cuticle(0xf5efe6), {
    s: 0.06,
  });
  const mito = specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xd6a24c), {
    s: vec3(0.18, 0.1, 0.1),
  });
  const bpos = (s, t, o) =>
    o.set(
      (s - 0.5) * L,
      0.38 * (0.4 + 0.9 * s) * Math.sin(TAU * 1.25 * s - 2.4 * t),
      0.16 * Math.sin(TAU * 1.25 * s - 2.4 * t + 1.1),
    );
  const A = vec3();
  const B = vec3();
  const Tn = vec3();
  const Nn = vec3();
  const Z = vec3(0, 0, 1);
  specimen.anim((t) => {
    for (let i = 0; i <= NB; i++) {
      bpos(i / NB, t, bp[i]);
    }
    body.update(bp, (s) => rfB(s));
    let k = 0;
    for (let j = 0; j <= NF; j++) {
      const s = 0.13 + (1.2 * j) / NF;
      if (s <= 1) {
        bpos(s, t, A);
        bpos(Math.min(1, s + 0.02), t, B);
        Tn.subVectors(B, A).normalize();
        Nn.crossVectors(Tn, Z).normalize();
        const r = rfB(s);
        fp[j].copy(A).addScaledVector(Nn, r * 0.95 + 0.035 + 0.06 * Math.sin(t * 5 + s * 24));
        mp[k++] = A.x + Nn.x * r * 0.8;
        mp[k++] = A.y + Nn.y * r * 0.8;
        mp[k++] = A.z + Nn.z * r * 0.8;
        mp[k++] = fp[j].x;
        mp[k++] = fp[j].y;
        mp[k++] = fp[j].z;
      } else {
        bpos(1, t, A);
        bpos(0.98, t, B);
        Tn.subVectors(A, B).normalize();
        const d = s - 1;
        const w = 0.1 * Math.sin(10 * d - 7 * t) * (d * 3);
        Nn.crossVectors(Tn, Z).normalize();
        fp[j]
          .copy(A)
          .addScaledVector(Tn, d * 3.4)
          .addScaledVector(Nn, w + 0.3 * rfB(1));
        mp[k++] = fp[j].x;
        mp[k++] = fp[j].y;
        mp[k++] = fp[j].z;
        mp[k++] = fp[j].x;
        mp[k++] = fp[j].y;
        mp[k++] = fp[j].z;
      }
    }
    memG.attributes.position.needsUpdate = true;
    memG.computeVertexNormals();
    memG.computeBoundingSphere();
    fl.update(fp, (s) => 0.028 * (1 - 0.6 * s));
    bpos(0.52, t, nuc.position);
    bpos(0.13, t, kin.position);
    kin.position.z += 0.0;
    bpos(0.1, t, pocket.position);
    bpos(0.3, t, mito.position);
    mito.position.y += 0.08;
  });
  specimen.part(
    'Cell body',
    "A spindle-shaped cell about 20 micrometres long, held in shape by a corset of microtubules under the membrane. A dense coat of one protein, the variant surface glycoprotein, covers the whole surface and is swapped to dodge the host's antibodies.",
    body.mesh,
    { shell: true },
  );
  specimen.part(
    'Flagellum',
    'A single flagellum grows from a pocket near the rear and runs along the body, then continues beyond the front end. Its beat pulls the cell forward in a corkscrew motion.',
    fl.mesh,
  );
  specimen.part(
    'Undulating membrane',
    'Where the flagellum is attached along the body, it pulls the cell membrane into a rippling fin. The ripples drive the cell through thick fluids such as blood.',
    mem,
  );
  specimen.part(
    'Nucleus',
    'A single central nucleus with a prominent nucleolus holds the genome.',
    nuc,
  );
  specimen.part(
    'Kinetoplast and flagellar pocket',
    'The kinetoplast is a dense disc of mitochondrial DNA, made of interlocked circles, found only in this group of parasites. It sits next to the basal body of the flagellum at the mouth of the flagellar pocket, where the cell takes up and releases material.',
    [kin, pocket],
  );
  specimen.part(
    'Mitochondrion',
    'A single branched mitochondrion runs the length of the cell. In the bloodstream form it is largely switched off because the parasite lives on glucose in the blood.',
    mito,
  );
  const rb = createRedBloodCellLathe(0.78, 40, 48);
  const rm = materialFactory.glass(0xd0484f, 0.6, { roughness: 0.35 });
  const rcs = new THREE.Group();
  specimen.add(rcs);
  [
    [-1.9, -1.9, -1.6],
    [2.2, 1.9, -2.4],
    [0.4, 2.4, 1.6],
    [-2.6, 1.7, 1.2],
  ].forEach(([x, y, z], i) =>
    specimen.mesh(rb, rm, { parent: rcs, p: vec3(x, y, z), r: [1.1 + i, 0.4 * i, 0.3 * i] }),
  );
  specimen.part(
    'Red blood cells (for scale)',
    'Human red blood cells, about 7 micrometres across, drawn at the correct size relative to the parasite. African trypanosomes swim between them in the bloodstream.',
    rcs,
  );
  specimen.anim((t) => {
    rcs.rotation.y = t * 0.06;
  });
}
ADDITIONAL_BUILDERS.trypanosoma = buildTrypanosoma;
ADDITIONAL_SPECIMENS.push({
  id: 'trypanosoma',
  cat: 'protozoa',
  name: 'Trypanosoma',
  latin: 'Trypanosoma brucei',
  size: 'about 20 µm, plus free flagellum',
  sizeUm: 20,
  U: 5.2,
  dist: 12,
  cls: 'Eukaryota · Discoba · Euglenozoa · Kinetoplastea',
  habitat: 'Blood and tissue fluids of mammals; tsetse fly gut',
  move: 'Corkscrew swimming driven by a flagellum and undulating membrane',
  feed: 'Heterotroph: takes up glucose from blood (bloodstream form)',
  repro: 'Binary fission in the host; sexual stages occur in the tsetse fly',
  desc: 'A slender blood parasite that swims by a rippling fin. It causes African sleeping sickness and is spread by tsetse flies.',
  fun: [
    'It keeps changing its surface coat, switching among thousands of gene copies, so the immune system never quite catches up.',
    'The kinetoplast, a net of mitochondrial DNA, is a hallmark of the whole group.',
    'Its glycolysis happens in specialised organelles called glycosomes.',
  ],
  note: 'Red blood cells are drawn to scale. The wave pattern is stylised, and the interior organelles are simplified.',
});

/* ---------- Plasmodium ---------- */
function buildPlasmodium(specimen) {
  const R = 1.35;
  const rb = createRedBloodCellLathe(R, 50, 56);
  const rm = materialFactory.glass(0xcf4a52, 0.42, { roughness: 0.35, clearcoat: 0.6 });
  const r1 = new THREE.Group();
  r1.position.set(-2.2, 0, 0);
  specimen.add(r1);
  const r1d = specimen.mesh(rb, rm, { parent: r1, ro: 5 });
  const ring = specimen.mesh(
    new THREE.TorusGeometry(0.4, 0.075, 12, 36),
    materialFactory.soft(0x5a8fd0, { emissive: 0x1d3a66, emissiveIntensity: 0.25 }),
    { parent: r1, p: vec3(0, 0, 0), r: [Math.PI / 2, 0, 0] },
  );
  const rn = specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x3b2a6e), {
    parent: r1,
    p: vec3(0.4, 0, 0),
    s: vec3(0.13, 0.13, 0.13),
  });
  const vac = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xffffff, 0.6), {
    parent: r1,
    p: vec3(0, 0, 0),
    s: vec3(0.3, 0.05, 0.3),
    ro: 7,
  });
  const r2 = new THREE.Group();
  r2.position.set(2.1, 0.2, 0);
  specimen.add(r2);
  const r2d = specimen.mesh(rb, materialFactory.glass(0xcf4a52, 0.32, { roughness: 0.35 }), {
    parent: r2,
    ro: 5,
  });
  const mero = new THREE.Group();
  r2.add(mero);
  const mm = materialFactory.soft(0x4f7fc4, { emissive: 0x1b3260, emissiveIntensity: 0.2 });
  const NM = 14;
  for (let i = 0; i < NM; i++) {
    const d = fibonacciSphere(NM)[i];
    const p = d.clone().multiplyScalar(0.5);
    const m = specimen.mesh(sharedGeometries.capsule, mm, {
      parent: mero,
      p,
      s: vec3(0.2, 0.2, 0.2),
    });
    m.quaternion.copy(quaternionFromUp(d));
    m.scale.set(0.2, 0.26, 0.2);
    specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x3b2a6e), {
      parent: mero,
      p: d.clone().multiplyScalar(0.42),
      s: 0.06,
    });
  }
  const hz = new THREE.Group();
  r2.add(hz);
  const hm = plantMaterials.dark(0x3a2418, { roughness: 0.6 });
  for (let i = 0; i < 5; i++) {
    specimen.mesh(sharedGeometries.sphereLo, hm, {
      parent: hz,
      p: vec3(((i % 3) - 1) * 0.09, ((i % 2) - 0.5) * 0.09, (i - 2) * 0.05),
      s: 0.09,
    });
  }
  const free = new THREE.Group();
  free.position.set(-0.3, -2.5, 1.2);
  specimen.add(free);
  const fb = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.soft(0x4f7fc4, { emissive: 0x1b3260, emissiveIntensity: 0.2 }),
    { parent: free, s: vec3(0.5, 0.3, 0.3) },
  );
  const ap = specimen.mesh(sharedGeometries.cone, plantMaterials.cuticle(0xe9b35a), {
    parent: free,
    p: vec3(0.45, 0, 0),
    s: vec3(0.14, 0.3, 0.14),
    r: [0, 0, -Math.PI / 2],
  });
  const rho = specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xe9b35a), {
    parent: free,
    p: vec3(0.2, 0, 0.05),
    s: vec3(0.14, 0.06, 0.05),
  });
  const fn = specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x3b2a6e), {
    parent: free,
    p: vec3(-0.15, 0, 0),
    s: 0.1,
  });
  const sp = new THREE.Group();
  sp.position.set(0.5, 2.5, -0.6);
  specimen.add(sp);
  const arc = new THREE.CatmullRomCurve3([
    vec3(-1, -0.2, 0),
    vec3(-0.5, 0.2, 0),
    vec3(0.2, 0.27, 0),
    vec3(0.8, 0, 0),
    vec3(1.1, -0.4, 0),
  ]);
  const spm = specimen.mesh(
    new THREE.TubeGeometry(arc, 24, 0.1, 10),
    materialFactory.soft(0x6b9ad8, { emissive: 0x1b3260, emissiveIntensity: 0.2 }),
    { parent: sp },
  );
  specimen.part(
    'Infected red blood cell',
    'The parasite lives inside a human red blood cell, shown as a translucent biconcave disc. The cell is about 7 micrometres across. Infected cells become stickier and can cling to blood vessel walls.',
    [r1d, r2d],
    { shell: true },
  );
  specimen.part(
    'Ring-stage trophozoite',
    'The early feeding stage looks like a signet ring under the microscope: a thin rim of cytoplasm around a food vacuole, with the nucleus as a dot on one side. It grows by digesting haemoglobin.',
    [ring, rn, vac],
  );
  specimen.part(
    'Schizont (merozoites)',
    'The mature stage divides several times into a rosette of new parasites called merozoites. When the red cell bursts, they are released together, producing the fever cycle of malaria.',
    mero,
  );
  specimen.part(
    'Haemozoin pigment',
    'Digesting haemoglobin frees toxic haem, which the parasite locks away as dark crystals of haemozoin. Several anti-malarial drugs act on this step.',
    hz,
  );
  specimen.part(
    'Free merozoite',
    'A merozoite is about 1.5 micrometres long. Its apical end holds rhoptries and other secretory organelles that help it attach to and enter a new red blood cell within seconds.',
    [fb, ap, rho, fn],
  );
  specimen.part(
    'Sporozoite',
    'A curved, motile stage injected by a mosquito. It glides in the blood to the liver, where it invades a liver cell and multiplies before the red-cell stage begins.',
    spm,
  );
  specimen.anim((t) => {
    r1.rotation.set(1 + 0.25 * Math.sin(t * 0.4), t * 0.22, 0);
    r2.rotation.set(0.9, -t * 0.2, 0.3 * Math.sin(t * 0.3));
    r1.position.y = 0.1 * Math.sin(t * 0.5);
    r2.position.y = 0.2 + 0.1 * Math.sin(t * 0.6);
    free.rotation.set(t * 0.5, 0, 0.4 * Math.sin(t * 2));
    free.position.x = -0.3 + 0.25 * Math.sin(t * 0.8);
    sp.rotation.set(0, t * 0.5, 0);
    sp.position.y = 2.5 + 0.12 * Math.sin(t * 0.7);
    mero.rotation.y = t * 0.3;
  });
}
ADDITIONAL_BUILDERS.plasmodium = buildPlasmodium;
ADDITIONAL_SPECIMENS.push({
  id: 'plasmodium',
  cat: 'protozoa',
  name: 'Plasmodium',
  latin: 'Plasmodium falciparum',
  size: 'infected red cell about 7 µm',
  sizeUm: 7,
  U: 2.7,
  dist: 11,
  cls: 'Eukaryota · SAR · Apicomplexa · Aconoidasida',
  habitat: 'Human liver and red blood cells; Anopheles mosquito gut and glands',
  move: 'Intracellular stages are carried passively; sporozoites and merozoites glide',
  feed: 'Digests haemoglobin from the red blood cell (trophozoite)',
  repro: 'Asexual multiplication (schizogony) in humans; sexual reproduction in mosquitoes',
  desc: 'The malaria parasite, shown in several stages of its life in human blood: ring stage, dividing schizont, free merozoite and a mosquito-borne sporozoite.',
  fun: [
    'Malaria remains one of the deadliest infectious diseases, with hundreds of thousands of deaths each year, mostly of young children in Africa.',
    'It has an apicoplast, a leftover plastid from an ancient algal ancestor, which is a drug target.',
    'The fever comes in waves because many parasites burst out of their red cells at about the same time.',
  ],
  note: 'This is a composite: stages that occur at different times are shown together. Merozoite number and organelle detail are simplified, and the free stages are enlarged relative to the red cells.',
});

/* ---------- Tetrahymena ---------- */
function buildTetrahymena(specimen) {
  const L = 3.6;
  const radiusAt = (u) =>
    0.86 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(u, 0, 1), 0.78)), 0.7) * (1 - 0.3 * u) + 0.01;
  const bg = new THREE.Group();
  specimen.add(bg);
  const body = specimen.mesh(
    latheBody(L, radiusAt, 56, 36),
    materialFactory.shell(0xe6bb78, 0.4, { clearcoat: 0.6 }),
    { parent: bg, ro: 8 },
  );
  specimen.part(
    'Pellicle',
    'A thin, flexible cell surface supported by rows of tiny sacs and microtubules. Each meridian row carries cilia, giving the cell a neat striped pattern.',
    body,
    { shell: true },
  );
  const cl = lathePoints(L, radiusAt, 380, { rows: 19, u0: 0.08, u1: 0.97, seed: 6 });
  const cil = createCiliaSet(specimen, plantMaterials.cuticle(0xf6ead2), cl.P, cl.N, {
    len: 0.2,
    r: 0.02,
    amp: 0.6,
    speed: 11,
    wave: 3.5,
    parent: bg,
  });
  specimen.part(
    'Cilia',
    'Hundreds of cilia in longitudinal rows beat in travelling waves, pushing the cell along in a spiral. They also sweep bacteria toward the mouth.',
    cil,
  );
  const oc = new THREE.Group();
  bg.add(oc);
  specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x7a4a22), {
    parent: oc,
    p: vec3(0, 0.98, 0.42),
    s: vec3(0.2, 0.34, 0.12),
  });
  for (let i = 0; i < 3; i++) {
    specimen.mesh(sharedGeometries.cone, plantMaterials.cuticle(0xf3ddb0), {
      parent: oc,
      p: vec3(-0.18 + i * 0.09, 1.12, 0.52),
      s: vec3(0.045, 0.38, 0.02),
      r: [-0.3, 0, 0],
    });
  }
  specimen.mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 16, 3.1), plantMaterials.cuticle(0xf3ddb0), {
    parent: oc,
    p: vec3(0.14, 0.98, 0.5),
    r: [0, 0, Math.PI * 0.5],
  });
  specimen.part(
    'Oral apparatus',
    'The mouth sits at the pointed front. Three membranelles on one side and an undulating membrane on the other push bacteria into the oral cavity, where food vacuoles pinch off.',
    oc,
  );
  const mac = specimen.mesh(sharedGeometries.sphere, materialFactory.grain(0xa88cc9), {
    parent: bg,
    p: vec3(0, -0.1, -0.05),
    s: vec3(0.36, 0.4, 0.36),
  });
  const mic = specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x3a2a62), {
    parent: bg,
    p: vec3(0.24, -0.12, -0.05),
    s: 0.09,
  });
  specimen.part(
    'Macronucleus and micronucleus',
    'The large macronucleus runs everyday gene activity. The tiny micronucleus holds the germline genome and is used only for sexual exchange. Tetrahymena was the species used to discover telomerase.',
    [mac, mic],
  );
  const cv = specimen.mesh(sharedGeometries.sphere, materialFactory.glass(0xe6f4ff, 0.6), {
    parent: bg,
    p: vec3(0.35, -1.2, 0.3),
    s: 0.2,
    ro: 7,
  });
  specimen.part(
    'Contractile vacuole',
    'A water pump near the rear. It fills and empties through a pore to keep osmotic water from swelling the cell.',
    cv,
  );
  const tail = new AnimatedTube(24, 6, plantMaterials.cuticle(0xf6ead2));
  specimen.add(tail.mesh, bg);
  const tp = Array.from({ length: 25 }, () => vec3());
  specimen.part(
    'Caudal cilium',
    'One longer, stiffer cilium trails from the rear and acts a little like a rudder.',
    tail.mesh,
  );
  const fvs = new THREE.Group();
  bg.add(fvs);
  const fm = plantMaterials.dark(0x7a9a52);
  for (let i = 0; i < 4; i++) {
    specimen.mesh(sharedGeometries.sphere, fm, {
      parent: fvs,
      p: vec3(Math.cos(i * 1.9) * 0.35, -0.55 + i * 0.22, Math.sin(i * 1.9) * 0.28),
      s: 0.12,
    });
  }
  specimen.part(
    'Food vacuoles',
    'Bubbles of swallowed bacteria. Digestive enzymes break the food down, and the vacuoles circulate around the cell before waste is expelled.',
    fvs,
  );
  specimen.anim((t) => {
    for (let i = 0; i <= 24; i++) {
      const s = i / 24;
      tp[i].set(0.15 * Math.sin(s * 6 - t * 9) * s, -L / 2 - s * 0.9, 0);
    }
    tail.update(tp, (s) => 0.022 * (1 - 0.6 * s));
    bg.rotation.y = t * 0.9;
    bg.rotation.z = 0.12 * Math.sin(t * 1.7);
    bg.position.y = 0.06 * Math.sin(t * 1.1);
  });
}
ADDITIONAL_BUILDERS.tetrahymena = buildTetrahymena;
ADDITIONAL_SPECIMENS.push({
  id: 'tetrahymena',
  cat: 'protozoa',
  name: 'Tetrahymena',
  latin: 'Tetrahymena thermophila',
  size: '40–60 µm',
  sizeUm: 50,
  U: 3.6,
  dist: 10,
  cls: 'Eukaryota · SAR · Ciliophora · Oligohymenophorea',
  habitat: 'Freshwater ponds and streams; widely kept in laboratories',
  move: 'Swims in a spiral using rows of cilia',
  feed: 'Heterotroph: swallows bacteria through the oral apparatus; can also absorb dissolved nutrients',
  repro: 'Binary fission; sexual conjugation among seven mating types',
  desc: 'A small pear-shaped ciliate that is a favourite model organism. Its neat rows of cilia and mouth at the pointed end set it apart from Paramecium.',
  fun: [
    'It has seven mating types rather than two sexes.',
    'Work on this ciliate led to the discovery of telomerase, the enzyme that rebuilds chromosome ends (Nobel Prize, 2009).',
    'It was also used to show that RNA can act as an enzyme.',
  ],
  note: 'About one in four of the real cilia are drawn. Oral structures are simplified.',
});

/* ---------- Didinium ---------- */
function buildDidinium(specimen) {
  const L = 3.0;
  const radiusAt = (u) => 0.98 * Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * u)), 0.38);
  const bg = new THREE.Group();
  specimen.add(bg);
  const body = specimen.mesh(
    latheBody(L, radiusAt, 48, 40),
    materialFactory.shell(0xd7a46a, 0.42, { clearcoat: 0.6 }),
    { parent: bg, ro: 8 },
  );
  specimen.part(
    'Barrel-shaped body',
    'The cell is a rounded barrel about 100 micrometres long. Unlike most ciliates it has no body-wide coat of cilia; it relies on two bands, which makes it a fast, strong swimmer.',
    body,
    { shell: true },
  );
  const bands = [];
  [0.3, 0.62].forEach((u, k) => {
    const r = radiusAt(u);
    const P = [];
    const N = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * TAU;
      P.push(vec3(Math.cos(a) * r, (u - 0.5) * L, Math.sin(a) * r));
      N.push(vec3(Math.cos(a), 0, Math.sin(a)));
    }
    bands.push(
      createCiliaSet(specimen, plantMaterials.cuticle(0xf0dcb8), P, N, {
        len: 0.34,
        r: 0.03,
        amp: 0.55,
        speed: 10,
        wave: 0,
        axis: vec3(0, 1, 0),
        parent: bg,
        seed: 8 + k,
      }),
    );
  });
  specimen.part(
    'Ciliary girdles',
    'Two circular bands of long cilia drive the swimming. They beat in a coordinated way so the cell spins as it moves and can hunt rapidly through open water.',
    bands,
  );
  const pr = new THREE.Group();
  bg.add(pr);
  const py = L / 2 - 0.02;
  const prb = specimen.mesh(
    new THREE.CylinderGeometry(0.18, 0.42, 0.8, 24, 1, true),
    materialFactory.shell(0xe6b070, 0.7, { side: THREE.DoubleSide }),
    { parent: pr, p: vec3(0, py + 0.4, 0) },
  );
  specimen.mesh(new THREE.TorusGeometry(0.19, 0.04, 8, 24), plantMaterials.cuticle(0x7a4a22), {
    parent: pr,
    p: vec3(0, py + 0.82, 0),
    r: [Math.PI / 2, 0, 0],
  });
  const tx = createInstancedMesh(sharedGeometries.cylLo, plantMaterials.cuticle(0x5a3a1a), 16);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    scratchObject.position.set(Math.cos(a) * 0.2, py + 0.9, Math.sin(a) * 0.2);
    scratchObject.quaternion.copy(quaternionFromUp(vec3(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5)));
    scratchObject.scale.set(0.015, 0.32, 0.015);
    scratchObject.updateMatrix();
    tx.setMatrixAt(i, scratchObject.matrix);
  }
  pr.add(tx);
  specimen.part(
    'Proboscis and mouth',
    'A cone at the front ends in the mouth, rimmed with toxicysts that can be fired into prey. The mouth can stretch very wide to swallow a Paramecium, which is often as large as the Didinium itself.',
    [prb, tx],
  );
  const mac = specimen.mesh(
    new THREE.TorusGeometry(0.5, 0.17, 10, 24, 4.9),
    materialFactory.grain(0xa88cc9),
    { parent: bg, p: vec3(0, -0.1, 0), r: [Math.PI / 2, 0, 0.5] },
  );
  const mic = specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x3a2a62), {
    parent: bg,
    p: vec3(0.6, -0.1, 0.05),
    s: 0.1,
  });
  specimen.part(
    'Macronucleus',
    'A horseshoe-shaped nucleus holds many gene copies. A micronucleus close by is used for sexual reproduction.',
    [mac, mic],
  );
  const pg = new THREE.Group();
  (specimen.add(pg), pg.position.set(0, 4.6, 0));
  const pbody = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0x8aa6a8, 0.55, { clearcoat: 0.5 }),
    { parent: pg, s: vec3(0.55, 1.05, 0.55), ro: 9 },
  );
  const pn = specimen.mesh(sharedGeometries.sphere, materialFactory.grain(0x9a86b8), {
    parent: pg,
    s: vec3(0.2, 0.26, 0.2),
  });
  const pc = createCiliaSet(
    specimen,
    plantMaterials.cuticle(0xe8eeee),
    ...(() => {
      const s = spherePoints(80, 0.55, 1.05, 0.55);
      return [s.P, s.N];
    })(),
    { len: 0.14, r: 0.015, amp: 0.6, speed: 11, wave: 2, parent: pg },
  );
  specimen.part(
    'Prey (Paramecium)',
    'A Paramecium swims into range. Didinium paralyses it with toxicysts, attaches, and swallows it whole. The prey is drawn here at about half its true size relative to the predator.',
    [pbody, pn, pc],
  );
  const A = vec3(0, 4.3, 0.2);
  const Bp = vec3(0, py + 1.0, 0);
  const Cp = vec3(0, 0, 0);
  specimen.anim((t) => {
    const k = cyclePhase(t, 16);
    const e1 = smoothStep(0, 0.38, k);
    const e2 = smoothStep(0.5, 0.78, k);
    const e3 = smoothStep(0.9, 1, k);
    pg.position.lerpVectors(A.clone().add(vec3(1.6 * (1 - e1), 1.2 * (1 - e1), 0)), Bp, e1);
    if (e2 > 0) {
      pg.position.lerpVectors(Bp, Cp, e2);
    }
    pg.rotation.z = (1 - e1) * 0.9 + Math.PI * 0.5 * 0;
    pg.rotation.z = lerp(0.9, 0, e1);
    const sc = lerp(1, 0.55, e2) * (1 - e3 * 0.6);
    pg.scale.set(sc, sc * lerp(1, 1.1, e2), sc);
    pg.visible = e3 < 0.98;
    bg.rotation.y = t * 0.6;
    bg.rotation.z = 0.06 * Math.sin(t * 1.3);
  });
}
ADDITIONAL_BUILDERS.didinium = buildDidinium;
ADDITIONAL_SPECIMENS.push({
  id: 'didinium',
  cat: 'protozoa',
  name: 'Didinium',
  latin: 'Didinium nasutum',
  size: '80–200 µm',
  sizeUm: 120,
  U: 3.0,
  dist: 12,
  cls: 'Eukaryota · SAR · Ciliophora · Litostomatea',
  habitat: 'Freshwater ponds and ditches, where Paramecium lives',
  move: 'Fast spiral swimming with two bands of cilia',
  feed: 'Predator: paralyses Paramecium with toxicysts and swallows it whole',
  repro: 'Binary fission; forms a resting cyst when prey runs out',
  desc: 'A barrel-shaped hunter of other ciliates. Two rings of cilia power it toward prey, and a proboscis at the front stings and swallows it.',
  fun: [
    'In classic experiments, Didinium and Paramecium were used to show cycles of predator and prey numbers; the predator often wiped out its prey and then died out itself.',
    'It can swallow a Paramecium as large as itself.',
    'When starved, it forms a protective cyst and waits for prey to return.',
  ],
  note: 'The prey is shown smaller than real so both fit at one scale. The capture cycle repeats every 16 seconds.',
});
