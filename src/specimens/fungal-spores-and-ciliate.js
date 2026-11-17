/**
 * Specimens: fungal spores and ciliate.
 *
 * Specimen builders: ciliate, spores.
 */

import * as THREE from 'three';
import {
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
  fibonacciSphere,
  lerp,
  quaternionFromUp,
  randomDirection,
  randomPointInUnitBall,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';
import { createCanvasTexture } from '../engine/textures.js';
import {
  ADDITIONAL_BUILDERS,
  ADDITIONAL_SPECIMENS,
  plantMaterials,
  UP_AXIS,
  createCiliaSet,
  latheBody,
} from './shared-helpers.js';

/* ================= NEW (worker F6): Fungal spores, Hypotrich ciliate, Marine plankton ================= */
const prof = (tbl) => (u) => {
  for (let i = 1; i < tbl.length; i++) {
    if (u <= tbl[i][0]) {
      const a = tbl[i - 1];
      const b = tbl[i];
      return lerp(a[1], b[1], smoothStep(a[0], b[0], u));
    }
  }
  return tbl[tbl.length - 1][1];
};
const cone = (() => {
  const g = new THREE.CylinderGeometry(0.18, 1, 1, 7, 1);
  g.translate(0, 0.5, 0);
  return g;
})();
/* slow tumbling drift of a group about a base position */
function tumble(specimen, g, base, o) {
  specimen.anim((t) => {
    g.position.set(
      base.x + Math.sin(t * o.fx + o.p) * o.a,
      base.y + Math.sin(t * o.fy + o.p * 1.7) * o.a,
      base.z + Math.sin(t * o.fz + o.p * 0.6) * o.a * 0.7,
    );
    g.rotation.set(o.r0[0] + t * o.w[0], o.r0[1] + t * o.w[1], o.r0[2] + t * o.w[2]);
  });
}

/* ---------- Fungal spores ---------- */
function alternaria(specimen, parent) {
  const L = 2.9;
  const sep = [0.13, 0.26, 0.39, 0.52, 0.62];
  const rowsE = [0, ...sep];
  const base = prof([
    [0, 0.04],
    [0.015, 0.2],
    [0.08, 0.44],
    [0.22, 0.58],
    [0.45, 0.6],
    [0.62, 0.46],
    [0.7, 0.26],
    [0.78, 0.15],
    [1, 0.06],
  ]);
  const radiusAt = (u) => {
    let k = 1;
    sep.forEach((s) => {
      k -= 0.08 * Math.exp(-Math.pow((u - s) / 0.014, 2));
    });
    return base(u) * k;
  };
  const lon = [
    [0.05, 0.55],
    [0.05, 0.55, 0.3, 0.8],
    [0.05, 0.55, 0.3, 0.8],
    [0.3, 0.8],
    [0.05, 0.55],
  ];
  const draw = (col) => (g, w, h) => {
    g.fillStyle = col ? '#5e3716' : '#808080';
    g.fillRect(0, 0, w, h);
    const random = createSeededRandom(4);
    const ys = (u) => (1 - u) * h;
    if (col) {
      for (let i = 0; i < rowsE.length; i++) {
        const a = ys(rowsE[i]);
        const b = ys(i + 1 < rowsE.length ? rowsE[i + 1] : 1);
        const gr = g.createLinearGradient(0, a, 0, b);
        gr.addColorStop(0, 'rgba(60,32,12,.35)');
        gr.addColorStop(0.5, 'rgba(170,115,55,.25)');
        gr.addColorStop(1, 'rgba(60,32,12,.35)');
        g.fillStyle = gr;
        g.fillRect(0, Math.min(a, b), w, Math.abs(a - b));
      }
    }
    for (let i = 0; i < 1800; i++) {
      const useFirstShade = random() > 0.5;
      if (col) {
        g.fillStyle = useFirstShade ? 'rgba(50,28,10,.28)' : 'rgba(205,155,90,.24)';
      } else {
        g.fillStyle = useFirstShade ? '#a6a6a6' : '#606060';
      }
      g.beginPath();
      g.arc(random() * w, random() * h, 1 + random() * 2.2, 0, TAU);
      g.fill();
    }
    g.strokeStyle = col ? '#2a170a' : '#000';
    g.lineWidth = 6;
    sep.forEach((s) => {
      g.beginPath();
      g.moveTo(0, ys(s));
      g.lineTo(w, ys(s));
      g.stroke();
    });
    g.lineWidth = 4;
    lon.forEach((xs, i) =>
      xs.forEach((x) => {
        g.beginPath();
        g.moveTo(x * w, ys(rowsE[i] + 0.006));
        g.lineTo(x * w, ys(i + 1 < rowsE.length ? rowsE[i + 1] - 0.006 : 0.62));
        g.stroke();
      }),
    );
  };
  const material = materialFactory.soft(0xffffff, {
    map: createCanvasTexture(256, 512, draw(true)),
    bumpMap: createCanvasTexture(256, 512, draw(false), false),
    bumpScale: 2.2,
    roughness: 0.7,
    sheen: 0,
    clearcoat: 0.1,
  });
  const group = new THREE.Group();
  parent.add(group);
  const body = specimen.mesh(latheBody(L, radiusAt, 130, 40), material, { parent: group });
  /* germ tube from a lower cell */
  const gtM = materialFactory.soft(0xe3d3a2, { transparent: true, opacity: 0.9, roughness: 0.45 });
  const gt = new AnimatedTube(24, 8, gtM);
  group.add(gt.mesh);
  const u0 = 0.2;
  const o0 = vec3(radiusAt(u0) * 0.94, (u0 - 0.5) * L, 0.12);
  const points = Array.from({ length: 25 }, () => vec3());
  const upd = (t) => {
    const gr = 0.06 + 0.94 * (0.5 - 0.5 * Math.cos(t * 0.11));
    const Lg = 1.7 * gr;
    for (let i = 0; i <= 24; i++) {
      const s = (i / 24) * Lg;
      points[i].set(
        o0.x + s * 0.85 + 0.12 * Math.sin(s * 2.2),
        o0.y - s * 0.42 - 0.1 * s * s,
        o0.z + 0.1 * Math.sin(s * 3 + 1) * s,
      );
    }
    gt.update(points, (s) => 0.1 * (1 - 0.35 * s) + 0.02);
  };
  upd(0);
  specimen.anim(upd);
  specimen.part(
    'Alternaria conidium',
    'A muriform spore: a club-shaped body divided by several cross walls and a few lengthwise walls, so it looks like a tiny brick wall, with a tapering beak at one end. Dark melanin in the wall protects it from sunlight, and spores of this type are among the commonest airborne mould allergens.',
    body,
  );
  specimen.part(
    'Germ tube',
    'When a spore lands on a damp surface it swells and pushes out a thin tube from one of its cells. The tube grows into the first hypha, from which the whole fungal colony develops. It is shown slowly growing and then retracting in a loop.',
    gt.mesh,
  );
  return group;
}
function conidia(specimen, parent) {
  const group = new THREE.Group();
  const NC = 5;
  const r = 0.3;
  const random = createSeededRandom(17);
  parent.add(group);
  const pos = [];
  for (let i = 0; i < NC; i++) {
    pos.push(vec3(0.22 * Math.sin(i * 0.8), i * 0.64, 0.12 * Math.cos(i * 1.1)));
  }
  const sph = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.grain(0x839a45, { bumpScale: 1 }),
    NC,
  );
  const spk = createInstancedMesh(
    cone,
    materialFactory.soft(0x566d2a, { roughness: 0.5 }),
    NC * 38,
  );
  const dirs = fibonacciSphere(38);
  pos.forEach((p, i) => {
    const rr = r * (i === NC - 1 ? 0.92 : 1);
    setInstanceTransform(sph, i, p, null, rr);
    dirs.forEach((d, k) => {
      const j = 1 + 0.3 * (random() - 0.5);
      setInstanceTransform(
        spk,
        i * 38 + k,
        p.clone().addScaledVector(d, rr * 0.94),
        quaternionFromUp(d),
        vec3(0.05, 0.13 * j, 0.05),
      );
    });
  });
  group.add(sph, spk);
  const phi = latheBody(
    1.0,
    prof([
      [0, 0.1],
      [0.2, 0.13],
      [0.5, 0.26],
      [0.75, 0.13],
      [1, 0.08],
    ]),
    30,
    20,
  );
  const ph = specimen.mesh(phi, materialFactory.shell(0xb5a35a, 0.75, { bumpScale: 0.3 }), {
    parent: group,
    p: vec3(-0.02, -0.82, 0),
    ro: 8,
  });
  const ves = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0xb5a35a, 0.65, { bumpScale: 0.3 }),
    { parent: group, p: vec3(-0.02, -1.5, 0), s: vec3(0.28, 0.3, 0.28), ro: 8 },
  );
  const stipe = specimen.mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 1, 10),
    materialFactory.shell(0xb5a35a, 0.75),
    { parent: group, p: vec3(-0.02, -2.0, 0), s: vec3(1, 0.8, 1) },
  );
  group.position.y = -1.0;
  specimen.part(
    'Echinulate conidia',
    'Small, nearly round conidia 2 to 4 micrometres across, with a rough, spiny wall that is typical of Aspergillus and Penicillium. They are made in long dry chains and are light enough to drift in air, which is why they are such common indoor mould spores.',
    [sph, spk],
  );
  specimen.part(
    'Phialide and conidiophore',
    'The spores bud one after another from the tip of a flask-shaped cell called a phialide. The oldest spore stays at the free end of the chain, and the phialide sits on a stalk, often swollen into a vesicle in Aspergillus.',
    [ph, ves, stipe],
    { shell: true },
  );
  return group;
}
function fusarium(specimen, parent) {
  const group = new THREE.Group();
  const N = 36;
  const Rc = 3.3;
  const a0 = -0.58;
  const a1 = 0.58;
  parent.add(group);
  const P = [];
  const T = [];
  for (let i = 0; i <= N; i++) {
    const a = lerp(a0, a1, i / N);
    P.push(vec3(Rc * Math.sin(a), Rc * Math.cos(a) - Rc + 0.3, 0));
    T.push(vec3(Math.cos(a), -Math.sin(a), 0));
  }
  const radiusAt = (s) =>
    0.32 *
    Math.pow(Math.sin(Math.PI * (0.035 + 0.93 * s)), 0.5) *
    (1 - 0.6 * smoothStep(0.72, 1, s));
  const shell = createTubeThroughPoints(
    P,
    20,
    radiusAt,
    materialFactory.shell(0xd8b66a, 0.55, { bumpScale: 0.3, roughness: 0.35 }),
  );
  shell.renderOrder = 8;
  group.add(shell);
  const inner = createTubeThroughPoints(
    P,
    14,
    (s) => radiusAt(s) * 0.82,
    materialFactory.soft(0xc98f3c, { transparent: true, opacity: 0.75, roughness: 0.5, sheen: 0 }),
  );
  group.add(inner);
  const sepM = materialFactory.soft(0x7a5420, { transparent: true, opacity: 0.9, sheen: 0 });
  const sm = [];
  const dr = materialFactory.glass(0xf5ecc6, 0.9, { roughness: 0.1 });
  const random = createSeededRandom(23);
  [0.2, 0.4, 0.6, 0.8].forEach((s) => {
    const i = Math.round(s * N);
    sm.push(
      specimen.mesh(sharedGeometries.cyl, sepM, {
        parent: group,
        p: P[i],
        s: vec3(radiusAt(s) * 0.84, 0.04, radiusAt(s) * 0.84),
      }),
    );
    sm[sm.length - 1].quaternion.copy(quaternionFromUp(T[i]));
  });
  const oil = createInstancedMesh(sharedGeometries.sphereLo, dr, 12);
  for (let k = 0; k < 12; k++) {
    const s = 0.08 + 0.84 * random();
    const i = Math.round(s * N);
    const off = vec3(random() - 0.5, random() - 0.5, random() - 0.5).multiplyScalar(
      radiusAt(s) * 0.8,
    );
    setInstanceTransform(oil, k, P[i].clone().add(off), null, 0.05 + 0.04 * random());
  }
  group.add(oil);
  const foot = specimen.mesh(sharedGeometries.sphere, sepM, {
    parent: group,
    p: P[0].clone().addScaledVector(T[0], -0.04),
    s: vec3(0.1, 0.1, 0.13),
  });
  specimen.part(
    'Fusarium macroconidium',
    'A curved, canoe-shaped spore with a pointed tip and a notched foot cell at the other end. It is divided by cross walls into about four or five cells and measures roughly 3 to 5 micrometres across and 25 to 50 micrometres long. Fusarium forms these in sticky masses and some species cause crop diseases.',
    [shell, inner, oil, foot],
    { shell: true },
  );
  specimen.part(
    'Septa',
    'Each cross wall divides the spore into separate cells, so the spore can germinate from several cells. The septa show as dark discs through the translucent outer wall.',
    sm,
  );
  group.position.y = 0.2;
  group.rotation.z = 0;
  return group;
}
function ascus(specimen, parent) {
  const group = new THREE.Group();
  parent.add(group);
  const L = 3.8;
  const radiusAt = prof([
    [0, 0.06],
    [0.07, 0.1],
    [0.18, 0.28],
    [0.3, 0.5],
    [0.7, 0.56],
    [0.9, 0.5],
    [0.97, 0.3],
    [1, 0.05],
  ]);
  const wall = specimen.mesh(
    latheBody(L, radiusAt, 90, 36),
    materialFactory.shell(0xb9ad6c, 0.5, { bumpScale: 0.3 }),
    { parent: group, ro: 10 },
  );
  const inner = specimen.mesh(
    latheBody(L, (u) => radiusAt(u) * 0.9, 90, 36),
    materialFactory.shell(0xe9e2b8, 0.22, { bumpScale: 0.1 }),
    { parent: group, ro: 9 },
  );
  const ring = specimen.mesh(
    new THREE.TorusGeometry(0.2, 0.05, 8, 20),
    materialFactory.soft(0x8a6a30),
    { parent: group, p: vec3(0, L / 2 - 0.05, 0), r: [Math.PI / 2, 0, 0] },
  );
  const random = createSeededRandom(31);
  const sp = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.soft(0x7a4418, { roughness: 0.5, sheen: 0 }),
    16,
  );
  const sd = createInstancedMesh(sharedGeometries.cyl, materialFactory.soft(0x4a2c10), 8);
  for (let k = 0; k < 8; k++) {
    const col = k % 2;
    const row = Math.floor(k / 2);
    const y = -0.6 + row * 0.52 + col * 0.26 + 0.22;
    const x = (col ? 1 : -1) * 0.17;
    const tilt = (random() - 0.5) * 0.2;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, tilt));
    const c = vec3(x, y, (random() - 0.5) * 0.08);
    [-1, 1].forEach((s, j) =>
      setInstanceTransform(
        sp,
        k * 2 + j,
        c.clone().add(vec3(0, s * 0.12, 0).applyQuaternion(q)),
        q,
        vec3(0.15, 0.2, 0.15),
      ),
    );
    setInstanceTransform(sd, k, c, q, vec3(0.12, 0.02, 0.12));
  }
  group.add(sp, sd);
  specimen.part(
    'Ascus',
    'A sac-like cell that is the signature of the sac fungi, or Ascomycota. Meiosis and one round of mitosis inside it give exactly eight spores. The wall has a thickened ring at the tip, and when the spores are ripe pressure builds up and they are shot out into the air.',
    [wall, inner, ring],
    { shell: true },
  );
  specimen.part(
    'Ascospores',
    'The eight spores are made in the ascus after sexual reproduction. Here each one is two-celled and brown, with a pinched middle where the cross wall lies, which is the form seen in many dark sac fungi.',
    [sp, sd],
  );
  return group;
}
function buildSpores(specimen) {
  const gA = alternaria(specimen, specimen.group);
  const gC = conidia(specimen, specimen.group);
  const gF = fusarium(specimen, specimen.group);
  const gS = ascus(specimen, specimen.group);
  const wrap = (g, base, o) => {
    const w = new THREE.Group();
    specimen.group.add(w);
    w.add(g);
    tumble(specimen, w, base, o);
    return w;
  };
  [gA, gC, gF, gS].forEach((g) => specimen.group.remove(g));
  wrap(gA, vec3(-2.6, 1.0, 0), {
    a: 0.25,
    fx: 0.21,
    fy: 0.17,
    fz: 0.13,
    p: 0,
    r0: [0.2, 0, 0.5],
    w: [0.02, 0.1, 0.03],
  });
  wrap(gC, vec3(2.3, 1.7, 0), {
    a: 0.25,
    fx: 0.18,
    fy: 0.2,
    fz: 0.15,
    p: 2,
    r0: [0, 0, -0.35],
    w: [0.03, 0.09, 0.02],
  });
  wrap(gF, vec3(-0.5, -2.5, 0.3), {
    a: 0.25,
    fx: 0.16,
    fy: 0.19,
    fz: 0.12,
    p: 4,
    r0: [0.1, 0, -0.1],
    w: [0.02, 0.08, 0.03],
  });
  wrap(gS, vec3(3.2, -2.3, 0), {
    a: 0.25,
    fx: 0.2,
    fy: 0.15,
    fz: 0.17,
    p: 1,
    r0: [0, 0, 0.25],
    w: [0.03, 0.07, 0.02],
  });
}
ADDITIONAL_BUILDERS.spores = buildSpores;
ADDITIONAL_SPECIMENS.push({
  id: 'spores',
  cat: 'other',
  name: 'Fungal spores',
  latin: 'Alternaria, Aspergillus, Fusarium and an ascus',
  size: 'about 3 µm (Aspergillus) to 50 µm (Fusarium) per spore',
  sizeUm: 50,
  U: 8.6,
  dist: 19,
  cls: 'Mixed assemblage · Fungi · Ascomycota',
  habitat:
    'Air, soil, decaying plants, damp buildings and crops; spores are carried far on the wind',
  move: 'None of their own; spores are carried by air, water or insects, and germ tubes grow once a spore lands',
  feed: 'Spores are resting stages; after germination the fungi absorb nutrients from dead or living organic matter',
  repro:
    'Asexual conidia (Alternaria, Aspergillus, Fusarium) and sexual ascospores made inside an ascus',
  desc: 'Four kinds of fungal spore drifting together: a brick-like Alternaria conidium, a chain of spiny Aspergillus conidia, a canoe-shaped Fusarium macroconidium and an ascus holding eight ascospores.',
  fun: [
    'A single Aspergillus colony can release millions of conidia, and each is only a few micrometres wide.',
    'Alternaria spores are one of the commonest outdoor allergens in late summer.',
    'An ascus can fire its eight spores out by building up internal fluid pressure, sometimes several centimetres into the air.',
    'Dark melanin in the wall of Alternaria and similar spores shields them from ultraviolet light.',
  ],
  note: 'Sizes are not to scale with each other: the Aspergillus conidia are drawn much larger relative to the others. The germ tube growth is a repeating loop, real tubes only extend. Septa, spines and colours are simplified. All four spores float in free space for display and do not occur in one such cluster.',
});

/* ---------- Hypotrich ciliate (Stylonychia) ---------- */
const f6Q1 = new THREE.Quaternion();
const f6M4 = new THREE.Matrix4();
function basis(xv, yv) {
  const y = yv.clone().normalize();
  const x = xv.clone().addScaledVector(y, -xv.dot(y)).normalize();
  const z = new THREE.Vector3().crossVectors(x, y);
  return f6Q1.setFromRotationMatrix(f6M4.makeBasis(x, y, z));
}
/* brush-like cirri: each cirrus is a bundle of fused cilia drawn as a few tapering strands */
function cirri(
  specimen,
  specs,
  material,
  parent,
  { ns = 5, w = 7.5, amp = 0.4, mid = 0.55, caudal = false } = {},
) {
  const n = specs.length;
  const geometry = new THREE.CylinderGeometry(0.35, 1, 1, 6, 1);
  geometry.translate(0, 0.5, 0);
  const mesh = createInstancedMesh(geometry, material, n * ns);
  const d = vec3();
  const sd = vec3();
  const s1 = vec3();
  const s2 = vec3();
  const sc = vec3();
  const upd = (t) => {
    specs.forEach((c, i) => {
      if (caudal) {
        d.set(
          -1,
          -0.12 + 0.08 * Math.sin(t * 1.3 + c.ph),
          c.zs * 0.32 + 0.12 * Math.sin(t * 1.7 + c.ph),
        ).normalize();
      } else {
        const f = mid + amp * Math.sin(t * w + c.ph);
        d.set(-Math.sin(f), -Math.cos(f), c.zs * 0.3).normalize();
      }
      s1.copy(perpendicularDirection(d));
      s2.crossVectors(d, s1).normalize();
      for (let k = 0; k < ns; k++) {
        const a = (k / ns) * TAU;
        const off = s1.clone().multiplyScalar(Math.cos(a)).addScaledVector(s2, Math.sin(a));
        sd.copy(d)
          .addScaledVector(off, k === 0 ? 0 : 0.2)
          .normalize();
        sc.set(
          c.r * (k === 0 ? 1.4 : 1),
          c.len * (k === 0 ? 1 : 0.86 + (0.1 * ((k * 7) % 3)) / 2),
          c.r * (k === 0 ? 1.4 : 1),
        );
        setInstanceTransform(
          mesh,
          i * ns + k,
          c.p.clone().addScaledVector(off, k === 0 ? 0 : c.r * 1.2),
          f6Q1.setFromUnitVectors(UP_AXIS, sd),
          sc,
        );
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0);
  specimen.anim(upd);
  specimen.add(mesh, parent);
  return mesh;
}
function buildCiliate(specimen) {
  const A = 2.9;
  const B = 1.3;
  const C = 0.6;
  const random = createSeededRandom(61);
  const wf = (x) => 1 - 0.14 * x;
  const yv = (x, z) =>
    -C * 0.55 * Math.sqrt(Math.max(0, 1 - (x / A) * (x / A) - Math.pow(z / (B * wf(x / A)), 2)));
  const yd = (x, z) =>
    C * Math.sqrt(Math.max(0, 1 - (x / A) * (x / A) - Math.pow(z / (B * wf(x / A)), 2)));
  const tilt = new THREE.Group();
  const cell = new THREE.Group();
  tilt.rotation.x = -1.15;
  specimen.add(tilt);
  tilt.add(cell);
  const bodyGeo = () => {
    const g = new THREE.SphereGeometry(1, 72, 48);
    g.rotateZ(Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      p.setXYZ(i, A * x, y < 0 ? C * 0.55 * y : C * y, B * wf(x) * z);
    }
    g.computeVertexNormals();
    return g;
  };
  const stripe = createCanvasTexture(
    256,
    64,
    (g, w, h) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        g.fillStyle = '#4a4a4a';
        g.fillRect((i / 40) * w, 0, 3, h);
        g.fillStyle = '#b0b0b0';
        g.fillRect((i / 40) * w + 3, 0, 2, h);
      }
    },
    false,
  );
  const col = createCanvasTexture(256, 64, (g, w, h) => {
    g.fillStyle = '#d9b86c';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(120,80,20,.25)';
      g.fillRect((i / 40) * w, 0, 2, h);
    }
  });
  const pel = specimen.mesh(
    bodyGeo(),
    materialFactory.shell(0xffffff, 0.5, {
      map: col,
      bumpMap: stripe,
      bumpScale: 1.2,
      clearcoat: 0.5,
    }),
    { parent: cell, ro: 10 },
  );
  const cyt = specimen.mesh(bodyGeo(), materialFactory.shell(0xe6c57e, 0.34, { bumpScale: 0.1 }), {
    parent: cell,
    s: 0.94,
    ro: 9,
  });
  const gr = createInstancedMesh(
    sharedGeometries.sphereLo,
    materialFactory.soft(0xf0e1b0, { roughness: 0.6 }),
    170,
  );
  for (let i = 0; i < 170; i++) {
    const d = randomPointInUnitBall(random);
    setInstanceTransform(
      gr,
      i,
      vec3(d.x * A * 0.85, d.y * C * 0.5, d.z * B * 0.75 * wf(d.x * 0.85)),
      null,
      0.03 + random() * 0.03,
    );
  }
  cell.add(gr);
  specimen.part(
    'Pellicle and cytoplasm',
    'The flexible outer layer, the pellicle, is supported by rows of tiny pits and microtubules and keeps the body flat on the underside and gently domed on the back. Inside, the granular cytoplasm streams slowly and carries the organelles.',
    [pel, cyt, gr],
    { shell: true },
  );
  /* peristome path on the ventral surface */
  const pp = [];
  for (let i = 0; i <= 14; i++) {
    const angle = lerp(-0.3, 1.68, i / 14);
    const f = lerp(0.9, 0.62, smoothStep(0.55, 1, i / 14));
    const x = A * f * Math.cos(angle);
    const z = B * wf(x / A) * f * Math.sin(angle);
    pp.push(vec3(x, yv(x, z) - 0.02, z));
  }
  const az = new THREE.CatmullRomCurve3(pp);
  const lip = createTubeAlongCurve(
    az,
    60,
    8,
    (u) => 0.07 + 0.04 * Math.sin(u * Math.PI),
    materialFactory.shell(0xb68a38, 0.62, { bumpScale: 0.2 }),
  );
  lip.renderOrder = 11;
  cell.add(lip);
  const cs = az.getPoint(1);
  const cyst = specimen.mesh(
    new THREE.ConeGeometry(0.2, 0.5, 14, 1, true),
    materialFactory.shell(0x7a5520, 0.8),
    { parent: cell, p: cs.clone().add(vec3(0, 0.12, 0)), r: [Math.PI, 0, 0] },
  );
  const NM = 30;
  const memG = new THREE.CylinderGeometry(0.5, 1, 1, 4, 1);
  memG.translate(0, 0.5, 0);
  const mem = createInstancedMesh(
    memG,
    materialFactory.soft(0xc99a42, { transparent: true, opacity: 0.9, roughness: 0.4 }),
    NM,
  );
  const mb = [];
  for (let i = 0; i < NM; i++) {
    const u = i / (NM - 1);
    const p = az.getPointAt(u);
    const T = az.getTangentAt(u);
    const n = vec3(0.3 - p.x, 0, 0 - p.z).normalize();
    mb.push({ p, T, n, u });
  }
  const md = vec3();

  const msc = vec3(0.2, 0.6, 0.03);
  const updM = (t) => {
    mb.forEach((m, i) => {
      const al = 0.5 + 0.42 * Math.sin(t * 9 - i * 0.55);
      md.set(0, -Math.cos(al), 0).addScaledVector(m.n, Math.sin(al)).normalize();
      msc.y = 0.52 + 0.1 * Math.sin(al * 3 - i);
      setInstanceTransform(mem, i, m.p, basis(m.T, md), msc);
    });
    mem.instanceMatrix.needsUpdate = true;
  };
  updM(0);
  specimen.anim(updM);
  cell.add(mem);
  specimen.part(
    'Adoral zone of membranelles',
    'A spiral band of about thirty flattened plates, each made of rows of fused cilia, wraps around the front and down the left side. The plates beat one after another in waves, sweeping bacteria and algae toward the mouth, and the same beat helps pull the cell along.',
    mem,
  );
  specimen.part(
    'Peristome and cytostome',
    'The peristome is the shallow groove bordered by the membranelles. At its bottom end the cytostome, or cell mouth, opens into the cytoplasm, where food is packed into vacuoles.',
    [lip, cyst],
    { shell: true },
  );
  /* cirri */
  const sp = (arr, len, r, ph0, zs0) =>
    arr.map(([x, z], i) => ({
      p: vec3(x, yv(x, z) + 0.01, z),
      len,
      r,
      ph: ph0 + i * 1.9,
      zs: zs0 === undefined ? Math.sign(z) : zs0,
    }));
  const frontal = sp(
    [
      [2.3, -0.6],
      [2.15, -0.2],
      [1.95, 0.2],
    ],
    0.62,
    0.045,
    0,
  );
  const ventral = sp(
    [
      [1.25, -0.65],
      [1.1, -0.2],
      [0.8, 0.2],
      [0.4, -0.45],
      [0.15, 0.0],
      [-0.4, -0.35],
      [-0.55, 0.15],
      [-0.95, -0.5],
    ],
    0.55,
    0.042,
    1.2,
  );
  for (let i = 0; i < 8; i++) {
    const x = lerp(1.7, -2.0, i / 7);
    [-1, 1].forEach((s) => {
      const z = s * B * wf(x / A) * Math.sqrt(1 - (x / A) * (x / A)) * 0.9;
      ventral.push({
        p: vec3(x, yv(x, z) + 0.01, z),
        len: 0.34,
        r: 0.028,
        ph: i * 1.1 + (s > 0 ? 1.9 : 0),
        zs: s,
      });
    });
  }
  const transv = sp(
    [
      [-1.95, -0.55],
      [-2.05, -0.25],
      [-2.1, 0.05],
      [-2.0, 0.32],
      [-1.8, 0.55],
    ],
    0.85,
    0.06,
    2.2,
    0,
  );
  const caud = [
    [-2.8, -0.35],
    [-2.9, 0],
    [-2.8, 0.35],
  ].map(([x, z], i) => ({
    p: vec3(x, 0.0, z),
    len: 1.05,
    r: 0.026,
    ph: i * 2,
    zs: z === 0 ? 0 : Math.sign(z),
  }));
  const cm = materialFactory.soft(0xa6772c, { roughness: 0.45 });
  const fv = cirri(specimen, [...frontal, ...ventral], cm, cell);
  const tr = cirri(specimen, transv, cm, cell, { w: 6.5, amp: 0.35, mid: 0.75 });
  const cd = cirri(specimen, caud, materialFactory.soft(0x8a6428), cell, { caudal: true });
  specimen.part(
    'Frontal and ventral cirri',
    'Cirri are tufts of cilia glued together into stiff leg-like bundles. The front and belly cirri act as legs, and the smaller rows along each edge help with steering, so the cell scampers over debris instead of just swimming.',
    fv,
  );
  specimen.part(
    'Transverse cirri',
    'Five stout cirri near the rear stick out beyond the body. They push against the surface and give the cell its quick backward hops and turns when it meets an obstacle.',
    tr,
  );
  specimen.part(
    'Caudal cirri',
    'Three long, thin cirri trail from the back of the cell. They stay almost stiff and work as sensors and a rudder, and they help the cell keep its heading.',
    cd,
  );
  /* dorsal bristles */
  const P = [];
  const N = [];
  [-0.72, -0.25, 0.25, 0.72].forEach((f) => {
    for (let i = 0; i < 12; i++) {
      const x = lerp(-2.45, 2.35, i / 11) + 0.1 * f;
      const z = f * B * wf(x / A) * Math.sqrt(Math.max(0, 1 - (x / A) * (x / A)));
      const y = yd(x, z);
      P.push(vec3(x, y, z));
      N.push(vec3(x / (A * A), y / (C * C), z / (B * B)).normalize());
    }
  });
  const db = createCiliaSet(specimen, plantMaterials.dark(0x6a4c20), P, N, {
    len: 0.26,
    r: 0.016,
    amp: 0.12,
    speed: 2.2,
    wave: 2,
    axis: vec3(-1, 0, 0),
    jit: 0.4,
    seed: 9,
    parent: cell,
  });
  specimen.part(
    'Dorsal bristles',
    'Short, stiff sensory bristles stand in rows on the back. They do not beat to move the cell, but they bend when something touches them and tell the cell about its surroundings.',
    db,
  );
  /* nuclei */
  const mac = [
    [0.9, 0.0, 0, 0.8, 0.4, 0.42, 0.15],
    [-0.65, 0, 0.08, 0.75, 0.38, 0.4, -0.12],
  ].map(([x, y, z, a, b, c, r]) =>
    specimen.mesh(sharedGeometries.sphereMid, materialFactory.grain(0x8a6428, { bumpScale: 2.2 }), {
      parent: cell,
      p: vec3(x, y, z),
      s: vec3(a, b, c),
      r: [0, r, 0],
    }),
  );
  const nl = createInstancedMesh(sharedGeometries.sphereLo, materialFactory.soft(0x3e2a0e), 14);
  for (let i = 0; i < 14; i++) {
    const m = mac[i % 2];
    const d = randomDirection(random).multiplyScalar(0.7);
    setInstanceTransform(
      nl,
      i,
      m.position.clone().add(vec3(d.x * m.scale.x, d.y * m.scale.y, d.z * m.scale.z)),
      null,
      0.05,
    );
  }
  cell.add(nl);
  const mic = [
    [0.6, 0.05, 0.5],
    [-0.3, 0.05, -0.38],
  ].map(([x, y, z]) =>
    specimen.mesh(sharedGeometries.sphereMid, materialFactory.soft(0xf1e3ad, { roughness: 0.3 }), {
      parent: cell,
      p: vec3(x, y, z),
      s: 0.12,
    }),
  );
  specimen.part(
    'Macronuclei',
    'Stylonychia has two large, bean-shaped macronuclei that run the everyday life of the cell. Each contains many copies of short gene-sized DNA pieces, and the dark spots are nucleoli where ribosomes are made.',
    [...mac, nl],
  );
  specimen.part(
    'Micronuclei',
    'Close to the macronuclei lie small micronuclei. They keep the germline DNA and divide by mitosis, and they are used in conjugation, when two cells swap genetic material.',
    mic,
  );
  /* contractile vacuole */
  const cvM = materialFactory.shell(0xc7a35a, 0.5, { bumpScale: 0.1, clearcoat: 1 });
  const cv = specimen.mesh(sharedGeometries.sphereMid, cvM, {
    parent: cell,
    p: vec3(-1.95, 0.02, -0.55),
    ro: 12,
  });
  specimen.anim((t) => {
    const ph = (t % 9) / 9;
    const s =
      ph < 0.86
        ? 0.08 + 0.24 * smoothStep(0, 0.86, ph)
        : 0.32 * (1 - smoothStep(0.86, 0.92, ph)) + 0.04;
    cv.scale.setScalar(s);
  });
  specimen.part(
    'Contractile vacuole',
    'A bubble near the rear that slowly fills with water and then bursts through a pore to the outside. This pump removes the water that constantly seeps into the cell, which lives in fresh water.',
    cv,
    { shell: true },
  );
  /* food vacuoles, circulating */
  const NV = 7;
  const fvS = createInstancedMesh(
    sharedGeometries.sphereMid,
    materialFactory.shell(0xc4ae6a, 0.5, { bumpScale: 0.1 }),
    NV,
  );
  const fvC = createInstancedMesh(
    sharedGeometries.sphereLo,
    materialFactory.soft(0x4f6a2a, { roughness: 0.6 }),
    NV * 3,
  );
  const vph = [];
  const vr = [];
  for (let i = 0; i < NV; i++) {
    vph.push((i / NV) * TAU + random() * 0.5);
    vr.push(0.25 + random() * 0.08);
  }
  const vv = vec3();
  const cdir = [vec3(0.1, 0.05, 0.06), vec3(-0.07, 0.06, -0.05), vec3(0.0, -0.05, 0.08)];
  specimen.anim((t) => {
    for (let i = 0; i < NV; i++) {
      const a = vph[i] + t * 0.06;
      vv.set(
        -0.2 + 1.85 * Math.cos(a),
        -0.02 + 0.1 * Math.sin(a * 3),
        1.2 * 0.6 * Math.sin(a) * wf(Math.cos(a) * 0.6),
      );
      setInstanceTransform(fvS, i, vv, null, vr[i]);
      for (let k = 0; k < 3; k++) {
        setInstanceTransform(
          fvC,
          i * 3 + k,
          vv.clone().add(cdir[k].clone().multiplyScalar(vr[i] * 2.4 * (k + 1) * 0.4)),
          null,
          vr[i] * (0.3 - k * 0.05),
        );
      }
    }
    fvS.instanceMatrix.needsUpdate = true;
    fvC.instanceMatrix.needsUpdate = true;
  });
  fvS.renderOrder = 6;
  cell.add(fvS, fvC);
  specimen.part(
    'Food vacuoles',
    'Food is packed into membrane bubbles that form at the cytostome, here shown holding green algae. The bubbles are carried round the cell, digested and finally emptied at a pore. Stylonychia eats bacteria, algae and small protists.',
    [fvS, fvC],
  );
  specimen.anim((t) => {
    cell.rotation.y = 0.55 + 0.3 * Math.sin(t * 0.17);
    cell.position.set(0.35 * Math.sin(t * 0.23), 0.18 * Math.sin(t * 0.31 + 1), 0);
    tilt.rotation.x = -1.15 + 0.12 * Math.sin(t * 0.13);
  });
}
ADDITIONAL_BUILDERS.ciliate = buildCiliate;
ADDITIONAL_SPECIMENS.push({
  id: 'ciliate',
  cat: 'other',
  name: 'Hypotrich ciliate',
  latin: 'Stylonychia mytilus',
  size: '100–300 µm',
  sizeUm: 200,
  U: 6.4,
  dist: 14,
  cls: 'Eukaryota · SAR · Ciliophora · Spirotrichea · Hypotrichia',
  habitat: 'Freshwater ponds, ditches and wet moss, where it crawls over debris and algae',
  move: 'Walks and darts on cirri over surfaces; rarely swims freely',
  feed: 'Eats bacteria, algae and small protists swept into the mouth by the adoral membranelles',
  repro: 'Binary fission; conjugation swaps micronuclear DNA between two cells',
  desc: 'A flat, oval ciliate that uses leg-like cirri to scurry over surfaces. A band of membranelles around the mouth groove sweeps in food, and two nuclei sit in the middle of the body.',
  fun: [
    'Unlike Paramecium, which is covered in cilia, hypotrichs keep their cilia in tufts called cirri and use them to walk.',
    'Stylonychia has two kinds of nuclei, and after conjugation it rebuilds its macronucleus by cutting its DNA into thousands of small gene-sized pieces.',
    'It is a classic model for studying how cells rearrange their genomes.',
    'Stylonychia can leap backwards in an instant by flicking its transverse cirri.',
  ],
  note: 'It is shown ventral side toward the viewer and tilted. Cirrus counts, vacuole numbers and food contents are simplified, and the stepping movement is schematic. Colours are artistic; living cells are almost transparent.',
});
