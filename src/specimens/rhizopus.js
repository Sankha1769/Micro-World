/**
 * Specimens: rhizopus.
 *
 * Specimen builders: rhizopus.
 */

import * as THREE from 'three';
import {
  sharedGeometries,
  createInstancedMesh,
  setInstanceTransform,
  createTubeAlongCurve,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import {
  TAU,
  vec3,
  randomDirection,
  randomPointInUnitBall,
  createSeededRandom,
} from '../engine/math.js';
import { ADDITIONAL_BUILDERS, ADDITIONAL_SPECIMENS } from './shared-helpers.js';

/* ================= F8: Rhizopus stolonifer (black bread mould) ================= */
function rhizoid(specimen, parent, base, dir, material, random, out, depth = 0, len = 1.9) {
  const points = [base.clone()];
  let p = base.clone();
  const d = dir.clone();
  for (let i = 0; i < 4; i++) {
    d.add(vec3((random() - 0.5) * 0.5, -0.12, (random() - 0.5) * 0.4)).normalize();
    p = p.clone().addScaledVector(d, len / 4);
    points.push(p.clone());
  }
  const m = createTubeAlongCurve(
    new THREE.CatmullRomCurve3(points),
    18,
    6,
    (u) => (0.07 - depth * 0.022) * (1 - u * 0.65),
    material,
  );
  parent.add(m);
  out.push(m);
  if (depth < 2) {
    for (let k = 0; k < 2; k++) {
      const u = 0.4 + k * 0.3;
      const i = Math.floor(u * 4);
      const q = points[i].clone().lerp(points[i + 1], u * 4 - i);
      rhizoid(
        specimen,
        parent,
        q,
        d
          .clone()
          .add(vec3((random() - 0.5) * 1.4, -0.2, (random() - 0.5) * 1.4))
          .normalize(),
        material,
        random,
        out,
        depth + 1,
        len * 0.55,
      );
    }
  }
}
function sporangium(specimen, parent, c, r, nSp, seed, mats, P) {
  const random = createSeededRandom(seed);
  const group = new THREE.Group();
  group.position.copy(c);
  parent.add(group);
  P.sporangium.push(
    specimen.mesh(new THREE.SphereGeometry(1, 40, 28), mats.wall, { parent: group, s: r, ro: 9 }),
  );
  P.columella.push(
    specimen.mesh(sharedGeometries.sphere, mats.col, {
      parent: group,
      p: vec3(0, -r * 0.38, 0),
      s: vec3(r * 0.55, r * 0.5, r * 0.55),
    }),
  );
  const sp = createInstancedMesh(sharedGeometries.sphereLo, mats.spore, nSp);
  const base = [];
  const ph = [];
  for (let i = 0; i < nSp; i++) {
    let q;
    do {
      q = randomPointInUnitBall(random).multiplyScalar(r * 0.93);
    } while (
      (q.x / (r * 0.55)) ** 2 + ((q.y + r * 0.38) / (r * 0.5)) ** 2 + (q.z / (r * 0.55)) ** 2 <
      1.1
    );
    base.push(q);
    ph.push(random() * TAU);
  }
  const rot = base.map(() =>
    new THREE.Quaternion().setFromEuler(new THREE.Euler(random() * 6, random() * 6, random() * 6)),
  );
  const sc = vec3(0.05, 0.035, 0.035).multiplyScalar((r / 1.1) * 1.4);
  const pp = vec3();
  group.add(sp);
  P.spores.push(sp);
  specimen.anim((t) => {
    for (let i = 0; i < nSp; i++) {
      const a = ph[i];
      pp.set(
        base[i].x + Math.sin(t * 0.9 + a) * 0.03 * r,
        base[i].y + Math.cos(t * 1.1 + a * 1.7) * 0.03 * r,
        base[i].z + Math.sin(t * 0.8 + a * 2.3) * 0.03 * r,
      );
      setInstanceTransform(sp, i, pp, rot[i], sc);
    }
    sp.instanceMatrix.needsUpdate = true;
  });
  return group;
}
function buildRhizopus(specimen) {
  const random = createSeededRandom(61);
  const root = new THREE.Group();
  specimen.add(root);
  root.position.y = -0.3;
  const hy = materialFactory.shell(0xd9cfae, 0.62, { bumpScale: 0.2, roughness: 0.45 });
  const mats = {
    wall: materialFactory.shell(0x3e3c38, 0.56, { bumpScale: 0.5, roughness: 0.5 }),
    col: materialFactory.soft(0xd8cfb4, { roughness: 0.5 }),
    spore: materialFactory.grain(0x8b8272, { roughness: 0.55, bumpScale: 1.4 }),
  };
  const nucM = materialFactory.emit(0x7a4f78, 0.3, { roughness: 0.4 });
  const rhM = materialFactory.shell(0xd6cdb4, 0.62, { bumpScale: 0.2 });
  const P = { sporangium: [], columella: [], spores: [], stipe: [], stolon: [], rhiz: [], nuc: [] };
  const yb = -3.1;
  /* stolon with three nodes, arching between them */
  const L = new THREE.CatmullRomCurve3([
    vec3(-5.2, yb - 0.2, 0.2),
    vec3(-4.2, yb + 0.7, 0.3),
    vec3(-2.6, yb + 0.95, 0.1),
    vec3(-1.1, yb + 0.4, 0),
    vec3(0, yb, 0),
  ]);
  const Rr = new THREE.CatmullRomCurve3([
    vec3(0, yb, 0),
    vec3(1.2, yb + 0.5, -0.1),
    vec3(2.8, yb + 0.85, -0.2),
    vec3(4.1, yb + 0.5, -0.1),
    vec3(5.2, yb - 0.1, -0.2),
  ]);
  [L, Rr].forEach((c) => {
    const m = createTubeAlongCurve(c, 60, 10, 0.1, hy);
    m.renderOrder = 7;
    root.add(m);
    P.stolon.push(m);
  });
  [vec3(-5.2, yb - 0.2, 0.2), vec3(0, yb, 0), vec3(5.2, yb - 0.1, -0.2)].forEach((b, i) => {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + i;
      rhizoid(
        specimen,
        root,
        b,
        vec3(Math.cos(a) * 0.55, -1, Math.sin(a) * 0.55).normalize(),
        rhM,
        random,
        P.rhiz,
        0,
        i === 1 ? 2.1 : 1.8,
      );
    }
  });
  /* sporangiophores in a tuft at the middle node */
  const tuft = new THREE.Group();
  tuft.position.set(0, yb, 0);
  root.add(tuft);
  const stalks = [
    { h: 5.6, x: 0.1, z: 0, r: 1.15, n: 300 },
    { h: 3.6, x: -0.45, z: 0.35, r: 0.72, n: 110 },
    { h: 2.5, x: 0.6, z: -0.4, r: 0.55, n: 70 },
  ];
  stalks.forEach((s, i) => {
    const c = new THREE.CatmullRomCurve3([
      vec3(0, 0, 0),
      vec3(s.x * 0.3, s.h * 0.4, s.z * 0.3),
      vec3(s.x, s.h, s.z),
    ]);
    const m = createTubeAlongCurve(c, 28, 10, (u) => 0.095 + 0.02 * u, hy);
    m.renderOrder = 7;
    tuft.add(m);
    P.stipe.push(m);
    sporangium(specimen, tuft, vec3(s.x, s.h + s.r * 0.95, s.z), s.r, s.n, 70 + i, mats, P);
  });
  /* nuclei streaming along the stolon (coenocytic hyphae) */
  const NN = 26;
  const nuc = createInstancedMesh(sharedGeometries.sphereLo, nucM, NN);
  const off = Array.from({ length: NN }, () => random());
  const side = Array.from({ length: NN }, () => randomDirection(random).multiplyScalar(0.05));
  root.add(nuc);
  P.nuc.push(nuc);
  specimen.anim((t) => {
    for (let i = 0; i < NN; i++) {
      const half = i % 2;
      const c = half ? Rr : L;
      const u = (off[i] + t * 0.02 * (half ? 1 : -1) + 1) % 1;
      setInstanceTransform(nuc, i, c.getPointAt(u).add(side[i]), null, 0.055);
    }
    nuc.instanceMatrix.needsUpdate = true;
    root.rotation.y = Math.sin(t * 0.1) * 0.3;
    tuft.rotation.z = Math.sin(t * 0.27) * 0.02;
    tuft.rotation.x = Math.sin(t * 0.21) * 0.02;
  });
  specimen.part(
    'Sporangium',
    'A round sac that starts pale and turns black as it ripens, which gives the mould its common name. Its wall encloses many thousands of spores and it is about 100–350 µm across. When the wall dries and breaks, the spores are released into the air.',
    P.sporangium,
    { shell: true },
  );
  specimen.part(
    'Sporangiospores',
    'The spores formed inside the sporangium: single-celled, ovoid to angular and grey-brown, about 5–11 µm long with a ribbed surface. Wind, insects and air currents spread them, and each can grow into a new mycelium on suitable food.',
    P.spores,
  );
  specimen.part(
    'Columella',
    'A dome-shaped swelling at the tip of the sporangiophore that pushes up into the sporangium and is cut off from the stalk by a cross wall. It supports the spore mass, and it remains as a little umbrella after the spores are shed.',
    P.columella,
  );
  specimen.part(
    'Sporangiophores',
    'Upright, unbranched stalks that grow in tufts from a node. Each carries one sporangium at its tip. They lift the spores above the food and can reach millimetres in height, which is more than this view shows.',
    P.stipe,
  );
  specimen.part(
    'Stolon',
    'A horizontal runner that arches over the surface and touches down at intervals. At each touch point it forms a node with rhizoids below and sporangiophores above. This habit gave the species its name, Rhizopus stolonifer.',
    P.stolon,
  );
  specimen.part(
    'Rhizoids',
    'Branched, root-like hyphae that grow into the food. They anchor the mould and secrete enzymes that digest starch, pectin and other substances; the dissolved nutrients are absorbed through the hyphal wall.',
    P.rhiz,
  );
  specimen.part(
    'Nuclei in coenocytic hyphae',
    'Rhizopus hyphae have no cross walls in the growing mycelium, so many nuclei share one stream of cytoplasm that flows toward the growing tips. Cross walls form only to cut off reproductive structures or to seal off damaged parts.',
    P.nuc,
  );
}
ADDITIONAL_BUILDERS.rhizopus = buildRhizopus;
ADDITIONAL_SPECIMENS.push({
  id: 'rhizopus',
  cat: 'fungi',
  name: 'Rhizopus',
  latin: 'Rhizopus stolonifer',
  size: 'sporangium 100–350 µm; stalks up to a few mm',
  sizeUm: 250,
  umPerUnit: 100,
  U: 10,
  dist: 21,
  cls: 'Eukaryota · Fungi · Mucoromycota · Mucoromycetes',
  habitat: 'Bread, ripe fruit and other starchy, sugary food; soil and decaying plant matter',
  move: 'Non-motile; hyphae grow outward and runners (stolons) spread across the surface',
  feed: 'Absorbs nutrients: secretes digestive enzymes into the food and absorbs the products',
  repro:
    'Asexual spores from sporangia; sexual reproduction by mating of two compatible strains that fuse to make a thick-walled zygospore',
  desc: 'The black bread mould. A horizontal stolon arches between nodes, with branching rhizoids below and tall stalks above that each carry a black sporangium full of spores.',
  fun: [
    'It grows fast: a plate of food can be covered within a few days at room temperature.',
    'Its hyphae have no cross walls, so each is one long cell with many nuclei.',
    'It is the best-known member of the Mucorales, a group that includes some opportunistic pathogens of people with weakened immunity.',
    'Related Rhizopus species are used to make tempeh in Indonesia.',
  ],
  note: 'Widths and sporangium size follow real values, but the stalks are drawn much shorter than the several millimetres they can reach. The number of spores is far smaller than a real sporangium holds. Wall colours are artistic.',
});
