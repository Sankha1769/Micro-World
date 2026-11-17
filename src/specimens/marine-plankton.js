/**
 * Specimens: marine plankton.
 *
 * Specimen builders: plankton.
 */

import * as THREE from 'three';
import {
  sharedGeometries,
  AnimatedTube,
  createInstancedMesh,
  setInstanceTransform,
  createTubeAlongCurve,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import {
  TAU,
  vec3,
  fibonacciSphere,
  quaternionFromUp,
  randomDirection,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';
import { textureLibrary, createCanvasTexture } from '../engine/textures.js';
import {
  ADDITIONAL_BUILDERS,
  ADDITIONAL_SPECIMENS,
  plantMaterials,
  createCiliaSet,
  latheBody,
  createProfileCurve,
} from './shared-helpers.js';

/* ================= F9: Marine plankton assemblage ================= */
const rings = createCanvasTexture(
  64,
  128,
  (g, w, h) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      g.fillStyle = '#bdbdbd';
      g.fillRect(0, y, w, 2.5);
    }
  },
  false,
);

/* ---------- copepod ---------- */
function copepod(specimen, root, P) {
  const L = 3.8;
  const group = new THREE.Group();
  group.position.set(0.2, -0.3, 0);
  root.add(group);
  const body = new THREE.Group();
  body.rotation.z = Math.PI / 2;
  group.add(body);
  const prof = createProfileCurve([
    [0, 0],
    [0.04, 0.3],
    [0.18, 0.56],
    [0.4, 0.6],
    [0.45, 0.42],
    [0.5, 0.4],
    [0.56, 0.34],
    [0.6, 0.26],
    [0.7, 0.22],
    [0.82, 0.17],
    [0.96, 0.13],
    [1, 0.1],
  ]);
  const radiusAt = (u) => prof(u) * (1 + 0.05 * Math.cos(TAU * 5 * u) * smoothStep(0.45, 0.8, u));
  P.cop.push(
    specimen.mesh(
      latheBody(L, radiusAt, 80, 32),
      materialFactory.shell(0xd4a468, 0.6, { bumpScale: 0.5, clearcoat: 0.6, roughness: 0.4 }),
      { parent: body, ro: 8 },
    ),
  );
  P.gut.push(
    createTubeAlongCurve(
      new THREE.CatmullRomCurve3([
        vec3(0, -L / 2 + 0.55, 0),
        vec3(0, -0.7, 0),
        vec3(0, 0.3, 0),
        vec3(0, L / 2 - 0.25, 0),
      ]),
      40,
      10,
      (u) => 0.17 * (0.85 + 0.15 * Math.sin(u * 20)),
      materialFactory.soft(0x8f8a3e, { roughness: 0.5 }),
    ),
  );
  body.add(P.gut[0]);
  P.eye.push(
    specimen.mesh(sharedGeometries.sphere, materialFactory.emit(0xd9402c, 0.55), {
      parent: body,
      p: vec3(0.3, -L / 2 + 0.45, 0),
      s: 0.09,
    }),
  );
  const aM = materialFactory.soft(0xb4864e, { roughness: 0.5 });
  const ant = [-1, 1].map((k) => {
    const tb = new AnimatedTube(36, 6, aM);
    body.add(tb.mesh);
    P.ant.push(tb.mesh);
    return { tb, k, pts: Array.from({ length: 37 }, () => vec3()) };
  });
  const legM = plantMaterials.cuticle(0xc9985a);
  const legs = [];
  [0.47, 0.55, 0.62, 0.7].forEach((u, i) =>
    [-1, 1].forEach((k) => {
      const r = radiusAt(u);
      const lg = new THREE.Group();
      lg.position.set(-r * 0.85, (u - 0.5) * L, k * r * 0.3);
      body.add(lg);
      [0, 1].forEach((b) => {
        const m = specimen.mesh(sharedGeometries.cone, legM, {
          parent: lg,
          s: vec3(0.045, 0.72 - b * 0.15, 0.045),
        });
        m.quaternion.copy(quaternionFromUp(vec3(-1, -0.15 + b * 0.5, k * (0.35 + b * 0.3))));
        P.legs.push(m);
      });
      legs.push({ lg, i, k });
    }),
  );
  [-1, 1].forEach((k) => {
    const ram = specimen.mesh(sharedGeometries.cone, legM, {
      parent: body,
      p: vec3(0, L / 2 - 0.05, k * 0.09),
      s: vec3(0.07, 0.5, 0.07),
    });
    ram.quaternion.copy(quaternionFromUp(vec3(0, 1, k * 0.3)));
    P.ram.push(ram);
    for (let s = 0; s < 4; s++) {
      const d = vec3(0, 1, k * (0.2 + s * 0.22)).normalize();
      const m = specimen.mesh(sharedGeometries.cone, materialFactory.soft(0xd8b27a), {
        parent: body,
        p: vec3(0, L / 2 + 0.4, k * (0.1 + 0.1)),
        s: vec3(0.014, 0.8 - s * 0.08, 0.014),
      });
      m.quaternion.copy(quaternionFromUp(d));
      P.ram.push(m);
    }
    const egg = specimen.mesh(
      sharedGeometries.sphere,
      materialFactory.soft(0x8f9a7a, { bumpMap: textureLibrary.grain, bumpScale: 1.5 }),
      { parent: body, p: vec3(-0.1, (0.6 - 0.5) * L + 0.25, k * 0.42), s: vec3(0.22, 0.5, 0.2) },
    );
    P.egg.push(egg);
  });
  specimen.anim((t) => {
    ant.forEach((a) => {
      for (let i = 0; i <= 36; i++) {
        const s = i / 36;
        const sw = Math.sin(t * 1.6 + a.k * 0.6 - s * 2.2) * 0.25 * s;
        a.pts[i].set(0.1 * s, -L / 2 + 0.2 - s * 2.6, a.k * (0.2 + s * 1.3 + sw));
      }
      a.tb.update(a.pts, (s) => 0.045 * (1 - 0.75 * s));
    });
    legs.forEach((l) => {
      l.lg.rotation.z = Math.sin(t * 6 - l.i * 0.9) * 0.45;
    });
    group.position.y = -0.3 + Math.sin(t * 0.5) * 0.12;
    group.rotation.z = Math.sin(t * 0.35) * 0.08;
  });
}

/* ---------- Chaetoceros chain ---------- */
function chaeto(specimen, root, P) {
  const group = new THREE.Group();
  group.position.set(2.3, 3.1, -0.8);
  group.rotation.z = -0.15;
  root.add(group);
  const cg = new THREE.CylinderGeometry(0.58, 0.58, 0.55, 28);
  cg.rotateZ(Math.PI / 2);
  const cM = materialFactory.shell(0xcfae66, 0.55, { bumpScale: 0.3 });
  const pM = materialFactory.soft(0x8e6a22, { roughness: 0.45 });
  const sM = materialFactory.soft(0xb89a58, { roughness: 0.5 });
  const random = createSeededRandom(8);
  for (let i = 0; i < 4; i++) {
    const x = i * 0.98 - 1.5;
    P.frus.push(specimen.mesh(cg, cM, { parent: group, p: vec3(x, 0, 0), ro: 8 }));
    for (let k = 0; k < 3; k++) {
      P.chl.push(
        specimen.mesh(sharedGeometries.sphere, pM, {
          parent: group,
          p: vec3(x + (random() - 0.5) * 0.25, (random() - 0.5) * 0.6, (random() - 0.5) * 0.6),
          s: vec3(0.08, 0.2, 0.26),
        }),
      );
    }
    P.chl.push(
      specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xa4673a), {
        parent: group,
        p: vec3(x, 0, 0),
        s: 0.13,
      }),
    );
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((qy) => {
        const b = vec3(x + sx * 0.27, qy * 0.56, 0);
        const d = vec3(sx * 0.35, qy, 0).normalize();
        const c = new THREE.CatmullRomCurve3([
          b,
          b
            .clone()
            .addScaledVector(d, 1.1)
            .add(vec3(0, 0, 0.12)),
          b.clone().addScaledVector(d, 2.4),
        ]);
        P.seta.push(createTubeAlongCurve(c, 14, 5, (u) => 0.024 * (1 - 0.55 * u), sM));
        group.add(P.seta[P.seta.length - 1]);
      }),
    );
  }
  specimen.anim((t) => {
    group.rotation.z = -0.15 + Math.sin(t * 0.3) * 0.08;
    group.rotation.y = Math.sin(t * 0.22) * 0.25;
    group.position.y = 3.1 + Math.sin(t * 0.4 + 1) * 0.1;
  });
}

/* ---------- radiolarian ---------- */
function radio(specimen, root, P) {
  const group = new THREE.Group();
  group.position.set(-3.6, -2.6, 0.8);
  root.add(group);
  const ico = new THREE.IcosahedronGeometry(1, 1);
  const pos = ico.attributes.position;
  const vm = new Map();
  const verts = [];
  const edges = new Set();
  const vid = (i) => {
    const v = vec3().fromBufferAttribute(pos, i).normalize();
    const k = v
      .toArray()
      .map((x) => x.toFixed(3))
      .join();
    if (!vm.has(k)) {
      vm.set(k, verts.length);
      verts.push(v);
    }
    return vm.get(k);
  };
  for (let i = 0; i < pos.count; i += 3) {
    const t = [vid(i), vid(i + 1), vid(i + 2)];
    for (let e = 0; e < 3; e++) {
      const a = t[e];
      const b = t[(e + 1) % 3];
      edges.add(a < b ? `${a}_${b}` : `${b}_${a}`);
    }
  }
  const E = [...edges].map((s) => s.split('_').map(Number));
  const sk = materialFactory.soft(0xb59a64, { roughness: 0.3, clearcoat: 0.8 });
  const struts = (R0, rr) => {
    const m = createInstancedMesh(sharedGeometries.cylLo, sk, E.length);
    E.forEach(([a, b], i) => {
      const A = verts[a].clone().multiplyScalar(R0);
      const B = verts[b].clone().multiplyScalar(R0);
      setInstanceTransform(
        m,
        i,
        A.clone().add(B).multiplyScalar(0.5),
        quaternionFromUp(B.clone().sub(A)),
        vec3(rr, A.distanceTo(B), rr),
      );
    });
    group.add(m);
    P.skel.push(m);
  };
  struts(1, 0.013);
  struts(0.62, 0.011);
  const nodes = createInstancedMesh(sharedGeometries.sphereLo, sk, verts.length);
  const rad = createInstancedMesh(sharedGeometries.cylLo, sk, verts.length);
  verts.forEach((v, i) => {
    setInstanceTransform(nodes, i, v, null, 0.034);
    setInstanceTransform(
      rad,
      i,
      v.clone().multiplyScalar(0.81),
      quaternionFromUp(v),
      vec3(0.009, 0.38, 0.009),
    );
  });
  group.add(nodes, rad);
  P.skel.push(nodes, rad);
  P.cap.push(
    specimen.mesh(
      sharedGeometries.sphere,
      materialFactory.shell(0xe3a455, 0.72, { bumpScale: 0.3 }),
      { parent: group, s: 0.36, ro: 6 },
    ),
    specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xa4673a), {
      parent: group,
      p: vec3(0.05, 0, 0),
      s: 0.14,
    }),
  );
  const random = createSeededRandom(14);
  for (let i = 0; i < 14; i++) {
    P.sym.push(
      specimen.mesh(sharedGeometries.sphereLo, materialFactory.soft(0xc7b43a), {
        parent: group,
        p: randomDirection(random).multiplyScalar(0.7 + random() * 0.2),
        s: 0.055,
      }),
    );
  }
  const sd = fibonacciSphere(24);
  const sp = createInstancedMesh(sharedGeometries.cone, sk, sd.length);
  sd.forEach((d, i) =>
    setInstanceTransform(
      sp,
      i,
      d.clone().multiplyScalar(0.98),
      quaternionFromUp(d),
      vec3(0.045, 1.0, 0.045),
    ),
  );
  group.add(sp);
  P.spine.push(sp);
  const AX = 52;
  const ad = fibonacciSphere(AX);
  const ax = createInstancedMesh(
    sharedGeometries.cylLo,
    materialFactory.soft(0xe4d3ad, { roughness: 0.4 }),
    AX,
  );
  const ph = ad.map(() => random() * TAU);
  group.add(ax);
  P.axo.push(ax);
  specimen.anim((t) => {
    ad.forEach((d, i) => {
      const l = 1.1 + 0.35 * Math.sin(t * 1.3 + ph[i]);
      setInstanceTransform(
        ax,
        i,
        d.clone().multiplyScalar(1.0 + l * 0.5),
        quaternionFromUp(d),
        vec3(0.008, l, 0.008),
      );
    });
    ax.instanceMatrix.needsUpdate = true;
    group.rotation.y = t * 0.08;
    group.rotation.x = Math.sin(t * 0.2) * 0.2;
    group.position.y = -2.6 + Math.sin(t * 0.45 + 2) * 0.1;
  });
}

/* ---------- foraminifer ---------- */
function foram(specimen, root, P) {
  const group = new THREE.Group();
  group.position.set(3.8, -2.3, -0.4);
  group.rotation.set(0.9, 0.4, 0);
  root.add(group);
  const sh = new THREE.Group();
  sh.scale.setScalar(0.85);
  group.add(sh);
  const shM = materialFactory.soft(0xe8dcc0, {
    roughness: 0.45,
    clearcoat: 0.5,
    bumpMap: textureLibrary.grain,
    bumpScale: 1.8,
  });
  const N = 13;
  let last = null;
  for (let i = 0; i < N; i++) {
    const r = 0.1 * Math.pow(1.17, i);
    const angle = i * 1.0;
    const rc = 1.1 * r;
    const c = vec3(Math.cos(angle) * rc, Math.sin(angle) * rc, 0);
    P.test.push(
      specimen.mesh(sharedGeometries.sphere, shM, { parent: sh, p: c, s: vec3(r, r, r * 0.75) }),
    );
    last = { c, th: angle, r };
  }
  const out = vec3(Math.cos(last.th + 0.5), Math.sin(last.th + 0.5), 0);
  const ap = last.c.clone().addScaledVector(out, last.r * 0.95);
  const rim = specimen.mesh(
    new THREE.TorusGeometry(1, 0.3, 8, 20),
    materialFactory.soft(0xb8a478),
    { parent: sh, p: ap, s: last.r * 0.22 },
  );
  rim.quaternion.setFromUnitVectors(vec3(0, 0, 1), out);
  P.ap.push(rim);
  const random = createSeededRandom(5);
  const pM = materialFactory.shell(0xd6b98a, 0.7, { roughness: 0.4 });
  const rt = new THREE.Group();
  rt.position.copy(ap);
  sh.add(rt);
  for (let i = 0; i < 16; i++) {
    const d = out
      .clone()
      .add(vec3((random() - 0.5) * 1.7, (random() - 0.5) * 1.7, (random() - 0.5) * 1.4))
      .normalize();
    const c = new THREE.CatmullRomCurve3([
      vec3(0, 0, 0),
      d.clone().multiplyScalar(0.7).add(randomDirection(random).multiplyScalar(0.1)),
      d.clone().multiplyScalar(1.5).add(randomDirection(random).multiplyScalar(0.2)),
    ]);
    const m = createTubeAlongCurve(c, 14, 5, (u) => 0.02 * (1 - 0.6 * u), pM);
    rt.add(m);
    P.ret.push(m);
  }
  specimen.anim((t) => {
    rt.rotation.z = Math.sin(t * 0.8) * 0.1;
    rt.rotation.y = Math.sin(t * 0.6 + 1) * 0.12;
    group.rotation.z = Math.sin(t * 0.25) * 0.3;
    group.position.y = -2.3 + Math.sin(t * 0.4 + 3) * 0.1;
  });
}

/* ---------- tintinnid ---------- */
function tint(specimen, root, P) {
  const group = new THREE.Group();
  group.position.set(-3.7, 3, -0.5);
  group.rotation.z = 0.7;
  root.add(group);
  const lp = createProfileCurve([
    [0, 0.03],
    [0.06, 0.2],
    [0.25, 0.46],
    [0.6, 0.52],
    [0.9, 0.46],
    [1, 0.58],
  ]);
  P.lor.push(
    specimen.mesh(
      latheBody(2.4, lp, 50, 28),
      materialFactory.glass(0xe0c89a, 0.45, { bumpMap: rings, bumpScale: 1.5 }),
      { parent: group, ro: 8 },
    ),
  );
  P.cell.push(
    specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xd98a5a, { roughness: 0.45 }), {
      parent: group,
      p: vec3(0, 0.15, 0),
      s: vec3(0.34, 0.95, 0.34),
    }),
  );
  P.cell.push(
    specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0x8f5a3a), {
      parent: group,
      p: vec3(0, 0.2, 0),
      s: 0.16,
    }),
  );
  const n = 24;
  const PP = [];
  const NN = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    PP.push(vec3(Math.cos(a) * 0.36, 1.08, Math.sin(a) * 0.36));
    NN.push(vec3(Math.cos(a) * 0.4, 0.9, Math.sin(a) * 0.4).normalize());
  }
  P.cil.push(
    createCiliaSet(specimen, materialFactory.soft(0xe7b78a), PP, NN, {
      len: 0.4,
      r: 0.02,
      amp: 0.6,
      speed: 8,
      wave: 3,
      axis: vec3(0, 1, 0),
      parent: group,
    }),
  );
  specimen.anim((t) => {
    group.rotation.z = 0.7 + Math.sin(t * 0.3) * 0.12;
    group.position.y = 3 + Math.sin(t * 0.5 + 4) * 0.1;
  });
}

function buildPlankton(specimen) {
  const root = new THREE.Group();
  specimen.add(root);
  const P = {
    cop: [],
    gut: [],
    eye: [],
    ant: [],
    legs: [],
    ram: [],
    egg: [],
    frus: [],
    seta: [],
    chl: [],
    skel: [],
    spine: [],
    cap: [],
    sym: [],
    axo: [],
    test: [],
    ap: [],
    ret: [],
    lor: [],
    cell: [],
    cil: [],
  };
  copepod(specimen, root, P);
  chaeto(specimen, root, P);
  radio(specimen, root, P);
  foram(specimen, root, P);
  tint(specimen, root, P);
  specimen.part(
    'Copepod exoskeleton',
    'A hard cuticle of chitin covers the body and limbs. It is divided into a rounded head-and-chest region and a narrower tail. The animal sheds it at each moult as it grows from larva to adult.',
    P.cop,
    { shell: true },
  );
  specimen.part(
    'Copepod antennules',
    'The long first antennae. They carry sensory hairs that detect water movement and chemicals, so the copepod can sense prey and predators. Many species hold them out while sinking slowly and fold them back in a quick jump.',
    P.ant,
  );
  specimen.part(
    'Copepod swimming legs',
    'Pairs of two-branched legs beat one after another from back to front to push the animal forward. For an escape jump, all pairs beat at once, giving speeds of many body lengths per second.',
    P.legs,
  );
  specimen.part(
    'Copepod eye',
    'A single red or dark pigmented eye on the front of the head (the naupliar eye). It senses light and its direction, but does not form an image.',
    P.eye,
  );
  specimen.part(
    'Copepod gut',
    'A straight digestive tube that looks green or brown after a meal of phytoplankton. The faecal pellets sink quickly and carry carbon to the deep sea.',
    P.gut,
  );
  specimen.part(
    'Copepod egg sacs',
    'Many female copepods carry fertilised eggs in one or two sacs attached to the genital segment, until nauplius larvae hatch. Some species release their eggs freely into the water instead.',
    P.egg,
  );
  specimen.part(
    'Caudal rami and setae',
    'The two tail branches carry long bristles (setae). They help with steering and balance and can sense water flow.',
    P.ram,
  );
  specimen.part(
    'Chaetoceros silica cells',
    'Each cell lives inside a two-part shell (frustule) made of silica. Cells are linked end to end into a chain. Diatoms as a group do a large share of the ocean’s photosynthesis.',
    P.frus,
    { shell: true },
  );
  specimen.part(
    'Chaetoceros setae',
    'Long, hollow silica spines that grow from the cell corners. Their bases fuse with the neighbouring cell to hold the chain together. They add surface area, slow sinking and may deter small grazers.',
    P.seta,
  );
  specimen.part(
    'Chaetoceros chloroplasts',
    'Golden-brown plastids that contain chlorophylls a and c and the pigment fucoxanthin. They carry out photosynthesis and give diatoms their colour.',
    P.chl,
  );
  specimen.part(
    'Radiolarian skeleton',
    'A glassy lattice shell, here with two nested spheres joined by radial struts. Most radiolarians build it from opal (silica); acantharians use strontium sulfate instead. The skeleton survives as a fossil in marine sediments.',
    P.skel,
  );
  specimen.part(
    'Radiolarian spines',
    'Rigid spines radiate from the skeleton. They protect the cell and increase its drag, which helps it float.',
    P.spine,
  );
  specimen.part(
    'Radiolarian central capsule',
    'A membrane wall encloses the inner cytoplasm with the nucleus. Outside it lies a froth of outer cytoplasm that digests food and carries the symbionts. Pores in the capsule connect the two.',
    P.cap,
  );
  specimen.part(
    'Algal symbionts',
    'Many radiolarians in sunlit water host symbiotic algae in their outer cytoplasm. The algae supply sugars from photosynthesis, which allows these single cells to live in nutrient-poor seas.',
    P.sym,
  );
  specimen.part(
    'Axopodia',
    'Thin, stiff cytoplasmic rays supported by bundles of microtubules. They snare small prey such as algae and ciliates, and their spread helps the cell stay afloat. They extend and shrink constantly.',
    P.axo,
  );
  specimen.part(
    'Foraminifer test',
    'A shell of calcium carbonate built as a spiral series of chambers, each larger than the one before. Fossil tests make up much of the world’s chalk and limestone, and their chemistry records past ocean temperatures.',
    P.test,
  );
  specimen.part(
    'Foraminifer aperture',
    'The main opening of the last chamber. The cytoplasm streams out through it to form the net of threads outside the shell, and new chambers are added at this side.',
    P.ap,
  );
  specimen.part(
    'Reticulopodia',
    'Fine threads of cytoplasm that branch and fuse into a net. They move food particles along them in both directions, trap prey and, in some species, pull the shell along a surface.',
    P.ret,
  );
  specimen.part(
    'Tintinnid lorica',
    'A vase-shaped house secreted by the cell, with a ringed pattern, made of protein and sometimes mineral particles. Its shape and size identify the species.',
    P.lor,
    { shell: true },
  );
  specimen.part(
    'Tintinnid cell',
    'A ciliate cell anchored to the base of the lorica by a contractile stalk. It can pull back inside when it is disturbed.',
    P.cell,
  );
  specimen.part(
    'Oral cilia',
    'A crown of large cilia fused into plates (membranelles) around the mouth. Their beat creates a current that draws small algae and bacteria into the cell and also pulls the whole animal through the water.',
    P.cil,
  );
}
ADDITIONAL_BUILDERS.plankton = buildPlankton;
ADDITIONAL_SPECIMENS.push({
  id: 'plankton',
  cat: 'other',
  name: 'Marine plankton',
  latin: 'Calanoid copepod, Chaetoceros, radiolarian, foraminifer, tintinnid',
  size: 'copepod about 1–2 mm; the others about 20–500 µm',
  sizeUm: 1000,
  umPerUnit: 260,
  U: 10,
  dist: 22,
  cls: 'Mixed assemblage · Arthropoda, Ochrophyta (diatoms), Rhizaria and Ciliophora',
  habitat: 'Sunlit surface waters of the open ocean and coastal seas',
  move: 'Mostly drifting with currents; the copepod swims and jumps, and the tintinnid swims with its cilia',
  feed: 'Mixed: diatoms photosynthesise, the copepod grazes on phytoplankton, and the radiolarian and foraminifer capture small prey with cytoplasmic threads',
  repro:
    'Varies: copepods lay eggs, diatoms divide, and the single-celled forms divide or reproduce sexually',
  desc: 'A drop of seawater under the microscope: a copepod, a chain of Chaetoceros diatoms, a radiolarian, a foraminifer and a tintinnid, each a distinct kind of plankton.',
  fun: [
    'About half of the photosynthesis on Earth is done by marine phytoplankton, which includes diatoms.',
    'Copepods are among the most abundant animals on Earth, and many rise to the surface at night to feed and sink by day.',
    'Chalk and limestone cliffs are largely made of the shells of foraminifera and other plankton.',
    'Radiolarian skeletons are made of silica and can form thick deposits on the deep sea floor.',
  ],
  note: 'The organisms are not to scale with one another: smaller ones are enlarged so that they are all visible. The copepod’s proportions are typical of calanoids. Chain length, skeleton detail and all colours are simplified or artistic.',
});
