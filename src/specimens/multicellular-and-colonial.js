/**
 * Specimens: multicellular and colonial.
 *
 * Specimen builders: gastrotrich, hydra, nematode, volvox.
 */

import * as THREE from 'three';
import {
  sharedGeometries,
  AnimatedTube,
  createInstancedMesh,
  perpendicularDirection,
  setInstanceTransform,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import {
  TAU,
  vec3,
  clamp,
  fibonacciSphere,
  lerp,
  quaternionFromUp,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';
import { createCanvasTexture } from '../engine/textures.js';
import {
  ADDITIONAL_BUILDERS,
  ADDITIONAL_SPECIMENS,
  plantMaterials,
  createCiliaSet,
  latheBody,
  createRod,
} from './shared-helpers.js';

/* ================= WORKER F1: Hydra, Nematode, Gastrotrich, Volvox ================= */
{
  const tabFn = (tbl) => (u) => {
    for (let i = 1; i < tbl.length; i++) {
      if (u <= tbl[i][0]) {
        const a = tbl[i - 1];
        const b = tbl[i];
        return lerp(a[1], b[1], smoothStep(a[0], b[0], u));
      }
    }
    return tbl[tbl.length - 1][1];
  };
  const mkPts = (n) => Array.from({ length: n + 1 }, () => vec3());

  /* ---------- Hydra ---------- */
  function buildHydra(specimen) {
    const bg = new THREE.Group();
    specimen.add(bg);
    const NB = 40;
    const ptsB = mkPts(NB);
    const y0 = -2.0;
    const hyR = tabFn([
      [0, 0.3],
      [0.07, 0.2],
      [0.22, 0.27],
      [0.5, 0.43],
      [0.78, 0.47],
      [0.92, 0.33],
      [1, 0.13],
    ]);
    let wf = 1;
    const epiMat = materialFactory.shell(0xc79b5d, 0.55, { bumpScale: 0.35, roughness: 0.4 });
    const epi = new AnimatedTube(NB, 18, epiMat);
    epi.mesh.renderOrder = 8;
    bg.add(epi.mesh);
    const cav = new AnimatedTube(
      NB,
      14,
      materialFactory.soft(0x8ea85a, { transparent: true, opacity: 0.85, roughness: 0.5 }),
    );
    bg.add(cav.mesh);
    specimen.part(
      'Epidermis and mesoglea',
      'The body is a tube made of two cell layers, a thin outer epidermis and an inner gastrodermis, with a jelly-like mesoglea sandwiched between them. The epidermis holds muscle fibres, sensory cells and stinging cells, and its contractions let the animal shorten and stretch.',
      epi.mesh,
      { shell: true },
    );
    specimen.part(
      'Gastric cavity',
      'A single hollow cavity lined by the gastrodermis serves as stomach and gut. Gland cells release digestive enzymes, other cells engulf the food fragments, and the same opening that takes food in also lets waste out.',
      cav.mesh,
    );
    const rfOut = (u) => hyR(u) * wf;
    const rfCav = (u) =>
      0.03 + hyR(u) * wf * 0.6 * smoothStep(0.06, 0.2, u) * (1 - smoothStep(0.84, 0.95, u));
    /* mouth and hypostome */
    const mouth = new THREE.Group();
    bg.add(mouth);
    const dome = specimen.mesh(sharedGeometries.sphere, plantMaterials.cuticle(0xb88a4e), {
      parent: mouth,
      p: vec3(0, -0.03, 0),
      s: vec3(0.17, 0.1, 0.17),
    });
    const ring = specimen.mesh(
      new THREE.TorusGeometry(1, 0.28, 8, 24),
      plantMaterials.dark(0x7a4a2a),
      { parent: mouth, r: [Math.PI / 2, 0, 0], p: vec3(0, 0.06, 0) },
    );
    const disc = specimen.mesh(
      new THREE.CircleGeometry(1, 20),
      new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.8, side: THREE.DoubleSide }),
      { parent: mouth, r: [-Math.PI / 2, 0, 0], p: vec3(0, 0.055, 0) },
    );
    specimen.part(
      'Hypostome and mouth',
      'The dome at the top of the column, the hypostome, carries the mouth at its centre. The mouth stretches wide enough to swallow prey almost as large as the animal itself, and snaps shut again after feeding.',
      [dome, ring, disc],
    );
    /* tentacles */
    const NT = 7;
    const TS = 28;
    const EL = [0.35, -0.1, -0.4, 0.15, -0.55, 0.05, -0.25];
    const LEN = [4.0, 4.4, 3.6, 4.2, 3.8, 4.1, 3.5];
    const tmat = materialFactory.soft(0xbf9558, { roughness: 0.5 });
    const tents = [];
    const rfT = (u) =>
      lerp(0.08, 0.022, Math.pow(u, 0.7)) *
      (1 + 0.4 * Math.pow(Math.max(0, Math.sin(u * TAU * 9 + 0.5)), 2) * smoothStep(0.08, 0.14, u));
    for (let i = 0; i < NT; i++) {
      const a = (i / NT) * TAU + 0.2;
      const el = EL[i];
      const tube = new AnimatedTube(TS, 8, tmat);
      bg.add(tube.mesh);
      tents.push({
        tube,
        pts: mkPts(TS),
        a,
        len: LEN[i],
        dir: vec3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)),
        side: vec3(-Math.sin(a), 0, Math.cos(a)),
        B: vec3(),
      });
    }
    specimen.part(
      'Tentacles',
      'Between five and eight hollow tentacles ring the mouth. They hold out a net of stinging cells to catch swimming prey, and they can stretch several times their resting length or shorten to tiny stubs.',
      tents.map((t) => t.tube.mesh),
    );
    /* nematocyst batteries */
    const PEAK = [1, 2, 3, 4, 5, 6, 7, 8].map((m) => 0.019 + 0.1111 * m);
    const NBAT = NT * PEAK.length * 4;
    const bat = createInstancedMesh(
      sharedGeometries.sphereLo,
      materialFactory.soft(0xe0b060, { emissive: 0x6a4a10, emissiveIntensity: 0.25 }),
      NBAT,
    );
    bg.add(bat);
    specimen.part(
      'Nematocyst batteries',
      'Each swelling on a tentacle is a battery of stinging cells (cnidocytes). Every cell holds a capsule, the nematocyst, containing a coiled barbed thread that is fired when a trigger hair is touched.',
      bat,
    );
    /* prey */
    const prey = new THREE.Group();
    bg.add(prey);
    specimen.mesh(sharedGeometries.sphere, plantMaterials.cuticle(0xd96a3c), {
      parent: prey,
      s: vec3(0.34, 0.2, 0.2),
    });
    [-1, 1].forEach((k) =>
      specimen.mesh(sharedGeometries.cylLo, plantMaterials.dark(0x8a3d1c), {
        parent: prey,
        p: vec3(0.3, 0.12, k * 0.09),
        s: vec3(0.012, 0.3, 0.012),
        r: [0, 0, -1.0],
      }),
    );
    specimen.part(
      'Captured prey',
      'A small crustacean such as a water flea or copepod, paralysed by the stings. The tentacle folds toward the mouth and passes it in, and the prey is shown shrinking as it is swallowed.',
      prey,
    );
    /* basal disc */
    const disc2 = specimen.mesh(sharedGeometries.cyl, plantMaterials.cuticle(0xb88a54), {
      parent: bg,
      p: vec3(0, y0 - 0.03, 0),
      s: vec3(0.46, 0.07, 0.46),
    });
    const film = specimen.mesh(
      new THREE.TorusGeometry(0.46, 0.03, 6, 24),
      materialFactory.shell(0xe8d8b0, 0.6),
      { parent: bg, p: vec3(0, y0 - 0.04, 0), r: [Math.PI / 2, 0, 0] },
    );
    specimen.part(
      'Basal disc',
      'A sticky foot at the base. Gland cells release a mucus-like adhesive that anchors the animal to a stone or water plant, and it can detach to glide or tumble to a new spot.',
      [disc2, film],
    );
    /* bud */
    const bud = new THREE.Group();
    bg.add(bud);
    const budBody = specimen.mesh(sharedGeometries.capsule, epiMat, {
      parent: bud,
      p: vec3(0, 0.45, 0),
      s: vec3(0.34, 0.5, 0.34),
    });
    const budCav = specimen.mesh(
      sharedGeometries.capsule,
      materialFactory.soft(0x8ea85a, { transparent: true, opacity: 0.85 }),
      { parent: bud, p: vec3(0, 0.45, 0), s: vec3(0.2, 0.36, 0.2) },
    );
    const nubs = [];
    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      group.position.set(0, 0.93, 0);
      group.rotation.set(0, (i * TAU) / 4, 0.7);
      bud.add(group);
      nubs.push(group);
      specimen.mesh(sharedGeometries.cone, tmat, { parent: group, s: vec3(0.035, 0.42, 0.035) });
    }
    specimen.part(
      'Bud',
      'A young hydra growing out of the lower third of the column. It starts as a bulge, grows a mouth and tentacles, and finally pinches off to live independently. This is the main way hydra reproduce when food is plentiful.',
      [budBody, budCav, ...nubs],
    );
    /* discharged nematocyst (enlarged) */
    const nem = new THREE.Group();
    nem.position.set(3.4, -2.9, 0.7);
    nem.rotation.z = -0.5;
    bg.add(nem);
    const caps = specimen.mesh(
      sharedGeometries.capsule,
      materialFactory.shell(0xe5c78e, 0.7, { bumpScale: 0.1 }),
      { parent: nem, s: vec3(0.3, 0.45, 0.3) },
    );
    const oper = specimen.mesh(sharedGeometries.cone, plantMaterials.dark(0x8a6a3a), {
      parent: nem,
      p: vec3(0, 0.43, 0),
      s: vec3(0.1, 0.1, 0.1),
    });
    const thr = new AnimatedTube(40, 6, materialFactory.soft(0x8a6a3a));
    nem.add(thr.mesh);
    const thrPts = mkPts(40);
    const barbs = [];
    for (let k = 0; k < 9; k++) {
      barbs.push(
        specimen.mesh(sharedGeometries.cone, plantMaterials.dark(0x6a4a22), {
          parent: nem,
          s: vec3(0.012, 0.08, 0.012),
        }),
      );
    }
    specimen.part(
      'Nematocyst (discharged, enlarged)',
      'The fired stinging capsule, drawn about ten times larger than life. The thread turns inside out as it shoots out, driving barbs into the prey and injecting a toxin. It is one of the fastest cellular events known, over in a few microseconds.',
      [caps, oper, thr.mesh, ...barbs],
    );

    const tan = vec3();
    const mC = vec3();
    const top = vec3();
    const F1 = vec3();

    const bez = (P0, P1, P2, P3, u, o) => {
      const w = 1 - u;
      const a = w * w * w;
      const b = 3 * w * w * u;
      const c = 3 * w * u * u;
      const d = u * u * u;
      return o.set(
        a * P0.x + b * P1.x + c * P2.x + d * P3.x,
        a * P0.y + b * P1.y + c * P2.y + d * P3.y,
        a * P0.z + b * P1.z + c * P2.z + d * P3.z,
      );
    };

    const p0 = vec3();
    const nn = vec3();
    const bb = vec3();
    const tt = vec3();
    const pos = vec3();
    const P0 = vec3();
    const P1 = vec3();
    const P2 = vec3();
    const P3 = vec3();
    const upd = (t) => {
      const ph2 = (t + 5) % 24;
      const contr = 0.2 * smoothStep(0, 2.5, ph2) * (1 - smoothStep(5, 9, ph2));
      const ext = 1 - contr;
      wf = 1 + ((0.6 * contr) / 0.2) * 0.35;
      const Lc = 3.7 * ext;
      for (let i = 0; i <= NB; i++) {
        const s = i / NB;
        ptsB[i].set(
          0.22 * Math.pow(s, 1.6) * Math.sin(t * 0.45),
          y0 + Lc * s,
          0.12 * Math.pow(s, 1.6) * Math.sin(t * 0.31 + 1),
        );
      }
      epi.update(ptsB, rfOut);
      cav.update(ptsB, rfCav);
      top.copy(ptsB[NB]);
      tan.subVectors(ptsB[NB], ptsB[NB - 1]).normalize();
      const ph = t % 18;
      const fw = smoothStep(3, 6.5, ph) * (1 - smoothStep(10, 13.5, ph));
      const mo = smoothStep(6, 7.5, ph) * (1 - smoothStep(9.5, 11, ph));
      mouth.position.copy(top);
      mouth.quaternion.copy(quaternionFromUp(tan));
      ring.scale.setScalar(0.09 + 0.11 * mo);
      disc.scale.setScalar(0.075 + 0.11 * mo);
      mC.copy(top).addScaledVector(tan, 0.1);
      const ls = 1 - 1.2 * (1 - ext);
      let bi = 0;
      tents.forEach((T, ti) => {
        T.B.set(top.x + Math.cos(T.a) * 0.17, top.y - 0.04, top.z + Math.sin(T.a) * 0.17);
        const L = T.len * ls;
        for (let k = 0; k <= TS; k++) {
          const u = k / TS;
          pos.copy(T.B).addScaledVector(T.dir, L * u);
          pos.y += -0.14 * L * u * u;
          pos.addScaledVector(T.side, 0.2 * u * Math.sin(u * 4.2 - t * 1.4 + T.a * 3));
          pos.y += 0.1 * u * Math.cos(u * 3.1 - t * 1.1 + T.a * 2);
          if (ti === 0 && fw > 0) {
            P0.copy(T.B);
            P1.copy(T.B).addScaledVector(T.dir, 1.8);
            P1.y += 1.3;
            P2.set(mC.x + T.dir.x * 0.9, mC.y + 1.0, mC.z + T.dir.z * 0.9);
            P3.set(mC.x + T.dir.x * 0.07, mC.y + 0.1, mC.z + T.dir.z * 0.07);
            bez(P0, P1, P2, P3, u, F1);
            pos.lerp(F1, fw);
          }
          T.pts[k].copy(pos);
        }
        T.tube.update(T.pts, rfT);
        for (const u of PEAK) {
          const k = Math.round(u * TS);
          const a = T.pts[Math.max(k - 1, 0)];
          const b = T.pts[Math.min(k + 1, TS)];
          tt.subVectors(b, a).normalize();
          nn.crossVectors(tt, vec3(0, 1, 0));
          if (nn.lengthSq() < 1e-4) {
            nn.set(1, 0, 0);
          }
          nn.normalize();
          bb.crossVectors(tt, nn);
          const rr = rfT(u) * 0.92;
          for (let m = 0; m < 4; m++) {
            const an = (m * TAU) / 4 + u * 5;
            p0.copy(T.pts[k])
              .addScaledVector(nn, Math.cos(an) * rr)
              .addScaledVector(bb, Math.sin(an) * rr);
            setInstanceTransform(bat, bi++, p0, null, 0.022);
          }
        }
      });
      bat.instanceMatrix.needsUpdate = true;
      /* prey */
      const pv = smoothStep(2.5, 3.2, ph) * (1 - smoothStep(8.4, 9.6, ph));
      prey.position.copy(tents[0].pts[TS]);
      prey.scale.setScalar(Math.max(1e-4, pv));
      prey.rotation.z = 0.5 * Math.sin(t * 6) + 0.4;
      /* bud */
      const ib = Math.round(0.3 * NB);
      const pbp = ptsB[ib];
      const dirb = vec3(0.92, 0.42, 0.1).normalize();
      bud.position.copy(pbp).addScaledVector(dirb, hyR(0.3) * wf * 0.8);
      bud.quaternion.copy(quaternionFromUp(dirb));
      bud.scale.setScalar(1 + 0.04 * Math.sin(t * 0.6));
      nubs.forEach((g, i) => {
        g.rotation.z = 0.7 + 0.15 * Math.sin(t * 1.3 + i);
      });
      /* nematocyst thread */
      const nph = t % 9;
      const pp = smoothStep(0, 0.5, nph) * (1 - smoothStep(5, 7.5, nph));
      const len = 2.0 * pp + 0.001;
      for (let i = 0; i <= 40; i++) {
        const s = i / 40;
        const a = s * 9;
        thrPts[i].set(0.02 * Math.cos(a), 0.48 + len * s, 0.02 * Math.sin(a));
      }
      thr.update(thrPts, (u) => 0.022 * (1 - 0.5 * u));
      barbs.forEach((b, k) => {
        const a = ((k % 3) * TAU) / 3 + Math.floor(k / 3) * 0.6;
        const y = 0.5 + len * (0.08 + 0.07 * Math.floor(k / 3));
        b.position.set(Math.cos(a) * 0.035, y, Math.sin(a) * 0.035);
        b.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
        b.scale.set(0.012, 0.08 * Math.min(1, pp * 3), 0.012);
      });
      nem.position.y = -2.9 + 0.05 * Math.sin(t * 0.8);
    };
    upd(0);
    specimen.anim(upd);
  }
  ADDITIONAL_BUILDERS.hydra = buildHydra;
  ADDITIONAL_SPECIMENS.push({
    id: 'hydra',
    cat: 'animals',
    name: 'Hydra',
    latin: 'Hydra vulgaris',
    size: 'column about 5–10 mm when extended',
    sizeUm: 7000,
    U: 9,
    dist: 21,
    cls: 'Animalia · Cnidaria · Hydrozoa · Hydridae',
    habitat: 'Clean, still or slow freshwater, attached to water plants and stones',
    move: 'Stays fixed by its basal disc; can glide, bend and somersault to a new spot',
    feed: 'Carnivore: stinging tentacles paralyse small crustaceans such as water fleas and pass them to the mouth',
    repro:
      'Budding in good conditions; sexual reproduction with eggs and sperm in cold or poor conditions',
    desc: 'A tiny freshwater predator shaped like a tube with a ring of long, stinging tentacles. It stays anchored by a sticky foot and waits for passing prey.',
    fun: [
      'It can regenerate: a cut piece regrows into a whole animal, and even cells that have been separated can reassemble into a new body.',
      'In laboratory studies it shows almost no sign of ageing, because stem cells keep renewing its tissues.',
      'Its stinging capsules fire in a few microseconds, among the fastest events known in a single cell.',
      'The green hydra, Hydra viridissima, gets its colour from algae living inside its cells. The model shows the brown Hydra vulgaris.',
    ],
    note: 'Seven tentacles are shown at about the length of the column; real animals have roughly five to eight and can stretch them much further. The discharged nematocyst is enlarged about ten times. The feeding sequence repeats every 18 seconds and the contraction every 24 seconds; real timing varies.',
  });

  /* ---------- Nematode (C. elegans) ---------- */
  function buildNematode(specimen) {
    const L = 8.2;
    const n = 90;
    const points = mkPts(n);
    const bg = new THREE.Group();
    specimen.add(bg);
    const ann = createCanvasTexture(
      8,
      64,
      (g, w, h) => {
        g.fillStyle = '#808080';
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 4) {
          g.fillStyle = '#b8b8b8';
          g.fillRect(0, y, w, 2);
        }
      },
      false,
    );
    ann.repeat.set(1, 36);
    const rb = tabFn([
      [0, 0.045],
      [0.012, 0.14],
      [0.04, 0.23],
      [0.15, 0.29],
      [0.7, 0.3],
      [0.88, 0.24],
      [0.96, 0.1],
      [1, 0.018],
    ]);
    const cut = new AnimatedTube(
      n,
      22,
      materialFactory.shell(0xe8d9b8, 0.38, { bumpMap: ann, bumpScale: 1.1, roughness: 0.45 }),
    );
    cut.mesh.renderOrder = 8;
    bg.add(cut.mesh);
    specimen.part(
      'Cuticle',
      'A tough, flexible outer skin made of collagen, secreted by the cells beneath and shed at each of four moults. Fine rings run around the body, and two ridges, the alae, run along each side. Muscles beneath pull against it, which lets the worm bend without changing length.',
      cut.mesh,
      { shell: true },
    );
    const I = (f) => Math.round(f * n);
    const ph0 = I(0.035);
    const ph1 = I(0.185);
    const in0 = ph1;
    const in1 = I(0.93);
    const ga0 = I(0.335);
    const gm = I(0.5);
    const gb1 = I(0.68);
    const bu1 = 3;
    const phMat = materialFactory.soft(0xd98f5a, { transparent: true, opacity: 0.92 });
    const phar = new AnimatedTube(ph1 - ph0, 14, phMat);
    const rph = tabFn([
      [0, 0.1],
      [0.15, 0.145],
      [0.4, 0.155],
      [0.55, 0.085],
      [0.7, 0.1],
      [0.8, 0.19],
      [0.92, 0.19],
      [1, 0.1],
    ]);
    bg.add(phar.mesh);
    const grind = new THREE.Group();
    bg.add(grind);
    for (let k = 0; k < 3; k++) {
      const c = specimen.mesh(sharedGeometries.cone, plantMaterials.dark(0x3a2a1c), {
        parent: grind,
        s: vec3(0.04, 0.1, 0.04),
        r: [0, 0, 0],
      });
      c.position.set(Math.cos(k * 2.1) * 0.04, 0, Math.sin(k * 2.1) * 0.04);
      c.userData.k = k;
    }
    specimen.part(
      'Pharynx',
      'A muscular pump that sucks in bacteria and squeezes them back toward the gut. It pumps hundreds of times a minute, and a grinder of hard plates in the rear bulb crushes the cells before they pass into the intestine.',
      [phar.mesh, ...grind.children],
    );
    const buc = new AnimatedTube(bu1, 8, plantMaterials.dark(0x5a3d2a));
    bg.add(buc.mesh);
    const lip = specimen.mesh(
      new THREE.TorusGeometry(0.07, 0.022, 6, 12),
      plantMaterials.dark(0x7a5a3a),
      { parent: bg },
    );
    specimen.part(
      'Mouth and buccal cavity',
      'The mouth opens into a short cavity ringed by lips with touch- and taste-sensing neurons. Food passes through here into the pharynx.',
      [buc.mesh, lip],
    );
    const nerve = specimen.mesh(
      new THREE.TorusGeometry(0.17, 0.04, 8, 20),
      materialFactory.soft(0xf0b050, { emissive: 0x805010, emissiveIntensity: 0.3 }),
      { parent: bg },
    );
    specimen.part(
      'Nerve ring',
      'A ring of nerve fibres around the pharynx acts as the animal’s brain. It receives signals from sensory neurons in the head and passes them to the nerve cord that runs along the underside.',
      nerve,
    );
    const intMat = materialFactory.soft(0xb09a4e, {
      transparent: true,
      opacity: 0.85,
      roughness: 0.55,
    });
    const gut = new AnimatedTube(in1 - in0, 16, intMat);
    const lum = new AnimatedTube(in1 - in0, 8, plantMaterials.dark(0x5a4a22));
    bg.add(gut.mesh, lum.mesh);
    const gr = [];
    const random = createSeededRandom(8);
    const NG = 70;
    const grm = createInstancedMesh(sharedGeometries.sphereLo, materialFactory.soft(0xe0cb70), NG);
    bg.add(grm);
    for (let i = 0; i < NG; i++) {
      gr.push({ s: lerp(0.2, 0.9, random()), a: random() * TAU, r: 0.04 + random() * 0.08 });
    }
    specimen.part(
      'Intestine',
      'A tube of just 20 large cells that digests food and absorbs nutrients. It also makes yolk for the eggs, and the granules in its cells store fat and break down waste.',
      [gut.mesh, lum.mesh, grm],
    );
    const gonMat = materialFactory.soft(0xdca58f, { transparent: true, opacity: 0.85 });
    const gA = new AnimatedTube(gm - ga0, 10, gonMat);
    const gB = new AnimatedTube(gb1 - gm, 10, gonMat);
    bg.add(gA.mesh, gB.mesh);
    const OC = 12;
    const ooc = createInstancedMesh(
      sharedGeometries.sphere,
      materialFactory.soft(0xf4c8b8, { roughness: 0.45 }),
      OC,
    );
    bg.add(ooc);
    specimen.part(
      'Gonad and oocytes',
      'The reproductive organ has two arms. Germ cells at the far tips divide and move toward the middle, growing into large egg cells (oocytes). The worm is a self-fertilising hermaphrodite, so its own sperm fertilise the eggs.',
      [gA.mesh, gB.mesh, ooc],
    );
    const EG = 3;
    const egg = createInstancedMesh(
      sharedGeometries.sphere,
      materialFactory.shell(0xf2e8d0, 0.75, { bumpScale: 0.1 }),
      EG,
    );
    const emb = createInstancedMesh(sharedGeometries.sphere, materialFactory.soft(0xe8c2a6), EG);
    bg.add(egg, emb);
    specimen.part(
      'Eggs in uterus',
      'Fertilised eggs sit in the uterus, each inside a protective shell, and begin to develop before they are laid. A worm usually lays around 300 eggs in its life.',
      [egg, emb],
    );
    const vul = specimen.mesh(
      new THREE.TorusGeometry(0.07, 0.025, 6, 12),
      plantMaterials.dark(0x8a6a4a),
      { parent: bg },
    );
    specimen.part(
      'Vulva',
      'An opening on the underside near the middle of the body. Muscles open it so that eggs can be laid.',
      vul,
    );
    const anus = specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x3a2a1c), {
      parent: bg,
      s: vec3(0.05, 0.035, 0.05),
    });
    specimen.part(
      'Anus',
      'The exit of the digestive tract, near the tail on the underside. Muscles around it open it to expel waste.',
      anus,
    );

    const gp = mkPts(gm - ga0);
    const gq = mkPts(gb1 - gm);
    const tmpA = vec3();
    const tmpT = vec3();
    const Nv = vec3();
    const Zv = vec3(0, 0, 1);
    const qq = new THREE.Quaternion();
    const sub = (a, b) => points.slice(a, b + 1);
    const offs = (a, b, z, arr) => {
      for (let i = a; i <= b; i++) {
        arr[i - a].set(points[i].x, points[i].y, points[i].z + z);
      }
      return arr;
    };
    const at = (s, o, tg) => {
      const f = clamp(s, 0, 1) * n;
      const i = Math.min(n - 1, Math.floor(f));
      o.lerpVectors(points[i], points[i + 1], f - i);
      tg.subVectors(points[i + 1], points[i]).normalize();
      return o;
    };
    const ocD = [];
    const egD = [];
    for (let k = 0; k < 5; k++) {
      const f = k / 4;
      ocD.push({ s: lerp(0.395, 0.488, f), sz: lerp(0.07, 0.115, f) });
      ocD.push({ s: lerp(0.605, 0.512, f), sz: lerp(0.07, 0.115, f) });
    }
    ocD.push({ s: 0.365, sz: 0.05 }, { s: 0.635, sz: 0.05 });
    egD.push(0.452, 0.5, 0.548);
    const X = vec3(1, 0, 0);
    const upd = (t) => {
      let x = 0;
      let y = 0;
      const ds = L / n;
      for (let i = 0; i <= n; i++) {
        const s = i / n;
        const a = 0.85 * (0.45 + 0.55 * smoothStep(0, 0.35, s)) * Math.sin(TAU * 1.3 * s - 2.0 * t);
        points[i].set(x, y, 0);
        x += Math.cos(a) * ds;
        y += Math.sin(a) * ds;
      }
      const ang = Math.atan2(points[n].y - points[0].y, points[n].x - points[0].x);
      const c = Math.cos(-ang);
      const sn = Math.sin(-ang);
      let mx = 0;
      let my = 0;
      for (const p of points) {
        const X1 = p.x * c - p.y * sn;
        const Y1 = p.x * sn + p.y * c;
        p.x = X1;
        p.y = Y1;
        mx += X1;
        my += Y1;
      }
      mx /= n + 1;
      my /= n + 1;
      for (const p of points) {
        p.x = -(p.x - mx);
        p.y -= my;
      }
      cut.update(points, rb);
      phar.update(sub(ph0, ph1), rph);
      buc.update(sub(0, bu1), () => 0.05);
      gut.update(
        sub(in0, in1),
        (u) =>
          0.02 +
          0.115 * smoothStep(0, 0.04, u) * (1 - 0.5 * smoothStep(0.9, 1, u)) +
          0.012 * Math.sin(u * 40),
      );
      lum.update(sub(in0, in1), () => 0.03);
      gA.update(offs(ga0, gm, 0.12, gp), (u) => 0.05 + 0.02 * u);
      gB.update(offs(gm, gb1, 0.12, gq), (u) => 0.07 - 0.02 * u);
      /* head parts */
      at(0, tmpA, tmpT);
      lip.position.copy(tmpA);
      lip.quaternion.setFromUnitVectors(Zv, tmpT);
      at(0.095, tmpA, tmpT);
      nerve.position.copy(tmpA);
      nerve.quaternion.setFromUnitVectors(Zv, tmpT);
      at(0.165, tmpA, tmpT);
      grind.position.copy(tmpA);
      grind.quaternion.copy(quaternionFromUp(tmpT));
      /* gut granules */
      for (let i = 0; i < NG; i++) {
        const g = gr[i];
        at(g.s, tmpA, tmpT);
        Nv.set(-tmpT.y, tmpT.x, 0);
        tmpA.addScaledVector(Nv, Math.cos(g.a) * g.r).addScaledVector(Zv, Math.sin(g.a) * g.r);
        setInstanceTransform(grm, i, tmpA, null, 0.03);
      }
      grm.instanceMatrix.needsUpdate = true;
      /* oocytes */
      ocD.forEach((o, i) => {
        at(o.s, tmpA, tmpT);
        tmpA.z += 0.12;
        qq.setFromUnitVectors(X, tmpT);
        setInstanceTransform(ooc, i, tmpA, qq, vec3(o.sz * 1.25, o.sz, o.sz));
      });
      ooc.instanceMatrix.needsUpdate = true;
      egD.forEach((s, i) => {
        at(s, tmpA, tmpT);
        tmpA.z -= 0.1;
        qq.setFromUnitVectors(X, tmpT);
        setInstanceTransform(egg, i, tmpA, qq, vec3(0.15, 0.105, 0.105));
        setInstanceTransform(emb, i, tmpA, qq, vec3(0.1, 0.07, 0.07));
      });
      egg.instanceMatrix.needsUpdate = true;
      emb.instanceMatrix.needsUpdate = true;
      /* vulva, anus on the underside (+N side) */
      at(0.5, tmpA, tmpT);
      Nv.set(-tmpT.y, tmpT.x, 0);
      vul.position.copy(tmpA).addScaledVector(Nv, 0.3);
      vul.quaternion.setFromUnitVectors(Zv, Nv);
      at(0.92, tmpA, tmpT);
      Nv.set(-tmpT.y, tmpT.x, 0);
      anus.position.copy(tmpA).addScaledVector(Nv, 0.17);
      /* pumping grinder */
      grind.scale.setScalar(1 + 0.25 * Math.max(0, Math.sin(t * 9)));
    };
    upd(0);
    specimen.anim(upd);
  }
  ADDITIONAL_BUILDERS.nematode = buildNematode;
  ADDITIONAL_SPECIMENS.push({
    id: 'nematode',
    cat: 'animals',
    name: 'Nematode',
    latin: 'Caenorhabditis elegans',
    size: 'about 1 mm (adult)',
    sizeUm: 1000,
    U: 8.4,
    dist: 17,
    cls: 'Animalia · Nematoda · Chromadorea · Rhabditidae',
    habitat:
      'Soil and rotting fruit or plant matter rich in bacteria; grown on agar plates in laboratories',
    move: 'Crawls or swims in S-shaped waves, by alternately contracting muscles on its upper and lower sides',
    feed: 'Bacterivore: pumps in bacteria and crushes them in the pharynx',
    repro:
      'Mostly self-fertilising hermaphrodites; rare males mate with them; about 300 offspring per worm',
    desc: 'A transparent roundworm about a millimetre long, and one of the most studied animals in biology. You can see its organs, eggs and even individual cells through its skin.',
    fun: [
      'An adult hermaphrodite has exactly 959 body cells, and 302 of them are neurons.',
      'It was the first multicellular animal to have its genome fully sequenced, in 1998.',
      'Work on this worm earned Nobel Prizes for programmed cell death, RNA interference and the use of green fluorescent protein as a marker.',
      'It lives only two to three weeks, so researchers can follow a whole life, and the effects of ageing, in a short time.',
    ],
    note: 'Organ positions are simplified, and the gonad arms are drawn straight, whereas in the worm each arm loops back on itself. Cuticle rings are exaggerated for visibility. The undulation is a stylised version of real crawling.',
  });

  /* ---------- Gastrotrich (Chaetonotus) ---------- */
  function buildGastrotrich(specimen) {
    const L = 6.4;
    const radiusAt = tabFn([
      [0, 0.05],
      [0.04, 0.18],
      [0.12, 0.34],
      [0.3, 0.5],
      [0.65, 0.52],
      [0.8, 0.36],
      [0.88, 0.3],
      [0.93, 0.44],
      [0.98, 0.4],
      [1, 0.1],
    ]);
    const sweep = new THREE.Group();
    sweep.position.set(-3.2, 0, 0);
    specimen.add(sweep);
    const root = new THREE.Group();
    root.position.set(3.2, 0, 0);
    root.rotation.z = -Math.PI / 2;
    sweep.add(root);
    const flat = new THREE.Group();
    flat.scale.set(0.62, 1, 1);
    root.add(flat);
    const bump = createCanvasTexture(
      64,
      64,
      (g, w, h) => {
        g.fillStyle = '#808080';
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 8) {
          for (let x = ((y / 8) % 2) * 8; x < w; x += 16) {
            g.fillStyle = '#b4b4b4';
            g.beginPath();
            g.ellipse(x + 4, y + 4, 6, 3.4, 0, 0, TAU);
            g.fill();
          }
        }
      },
      false,
    );
    bump.repeat.set(3, 10);
    const body = specimen.mesh(
      latheBody(L, radiusAt, 70, 40),
      materialFactory.shell(0xe3cba0, 0.42, { bumpMap: bump, bumpScale: 0.8, roughness: 0.45 }),
      { parent: flat, ro: 8 },
    );
    specimen.part(
      'Cuticle',
      'The body is covered by a clear cuticle formed into overlapping plates. The animal is flattened underneath and arched on top, and it is divided into a head with several lobes, a neck and a trunk that ends in a forked tail.',
      body,
      { shell: true },
    );
    /* scales and spines (dorsal = local -x) */
    const NSC = 7 * 20;
    const sc = createInstancedMesh(
      sharedGeometries.sphereLo,
      plantMaterials.cuticle(0xc9b184),
      NSC,
    );
    const sp = createInstancedMesh(sharedGeometries.cone, plantMaterials.dark(0x8a7248), NSC);
    const random = createSeededRandom(6);

    for (let r = 0; r < 7; r++) {
      for (let k = 0; k < 20; k++) {
        const u = lerp(0.15, 0.87, (k + (r % 2) * 0.5) / 20);
        const ph = Math.PI + (r - 3) * 0.33;
        const rr = radiusAt(u) * 1.01;
        const P = vec3(rr * Math.cos(ph), (u - 0.5) * L, rr * Math.sin(ph));
        const Nn = vec3(Math.cos(ph), -0.1, Math.sin(ph)).normalize();
        setInstanceTransform(sc, r * 20 + k, P, quaternionFromUp(Nn), vec3(0.16, 0.05, 0.12));
        const d = Nn.clone()
          .multiplyScalar(0.7)
          .add(vec3(0, -0.7, 0))
          .normalize();
        const ln = 0.28 + 0.22 * (1 - u);
        setInstanceTransform(sp, r * 20 + k, P, quaternionFromUp(d), vec3(0.025, ln, 0.025));
      }
    }
    flat.add(sc, sp);
    specimen.part(
      'Dorsal scales and spines',
      'Rows of keeled scales cover the back, and in Chaetonotus each scale carries a spine that points backward. The spines are thought to protect the animal, and they grow longer toward the tail.',
      [sc, sp],
    );
    /* ventral cilia (ventral = local +x) */
    const vp = [];
    const vn = [];
    [-1, 1].forEach((sd) => {
      for (let k = 0; k < 90; k++) {
        const u = lerp(0.12, 0.9, k / 89);
        const ph = sd * 0.5 + 0.05 * Math.sin(k * 1.7);
        const rr = radiusAt(u);
        const e = 0.012;
        const sl = (radiusAt(Math.min(1, u + e)) - radiusAt(Math.max(0, u - e))) / (2 * e * L);
        vp.push(vec3(rr * Math.cos(ph), (u - 0.5) * L, rr * Math.sin(ph)));
        vn.push(vec3(Math.cos(ph), -sl, Math.sin(ph)).normalize());
      }
    });
    const cm = materialFactory.soft(0xa8946a);
    const vc = createCiliaSet(specimen, cm, vp, vn, {
      len: 0.26,
      r: 0.013,
      amp: 0.8,
      speed: 9,
      wave: 3,
      axis: vec3(0, 1, 0),
      seed: 2,
      parent: flat,
    });
    specimen.part(
      'Ventral ciliary bands',
      'Two bands of cilia run along the flat underside. Their steady beating makes the animal glide smoothly over surfaces, and gives the group its name, which means hairy stomach.',
      vc,
    );
    const hp = [];
    const hn = [];
    for (let k = 0; k < 40; k++) {
      const u = lerp(0.89, 0.98, random());
      const ph = random() * TAU;
      const rr = radiusAt(u);
      hp.push(vec3(rr * Math.cos(ph), (u - 0.5) * L, rr * Math.sin(ph)));
      hn.push(vec3(Math.cos(ph), 0, Math.sin(ph)));
    }
    const hc = createCiliaSet(specimen, cm, hp, hn, {
      len: 0.32,
      r: 0.013,
      amp: 0.6,
      speed: 7,
      wave: 2,
      axis: vec3(0, -1, 0),
      seed: 3,
      parent: flat,
    });
    specimen.part(
      'Head cilia tufts',
      'Tufts of cilia on the head lobes sweep bacteria and algae toward the mouth, and also help the animal sense its surroundings.',
      hc,
    );
    const bp = [];
    const bn = [];
    for (let k = 0; k < 12; k++) {
      const ph = (k / 12) * TAU;
      const rr = 0.3;
      bp.push(vec3(rr * Math.cos(ph), L / 2 - 0.03, rr * Math.sin(ph)));
      bn.push(vec3(Math.cos(ph) * 0.35, 1, Math.sin(ph) * 0.35).normalize());
    }
    const bc = createCiliaSet(specimen, plantMaterials.dark(0x7a6844), bp, bn, {
      len: 0.6,
      r: 0.012,
      amp: 0.18,
      speed: 1.6,
      wave: 0,
      axis: vec3(0, 1, 0),
      seed: 4,
      parent: flat,
    });
    specimen.part(
      'Sensory bristles',
      'Long, stiff bristles at the front of the head detect touch and water movements. The animal sweeps its head from side to side as it searches for food.',
      bc,
    );
    /* mouth and pharynx */
    const mouth = specimen.mesh(
      new THREE.TorusGeometry(0.13, 0.04, 8, 18),
      plantMaterials.dark(0x7a4a2a),
      { parent: flat, p: vec3(0, L / 2 - 0.06, 0), r: [Math.PI / 2, 0, 0] },
    );
    const mdisc = specimen.mesh(
      new THREE.CircleGeometry(0.11, 16),
      new THREE.MeshStandardMaterial({ color: 0x2a1a12, side: THREE.DoubleSide }),
      { parent: flat, p: vec3(0, L / 2 - 0.065, 0), r: [-Math.PI / 2, 0, 0] },
    );
    const pharG = latheBody(
      1.35,
      tabFn([
        [0, 0.1],
        [0.2, 0.15],
        [0.55, 0.17],
        [0.8, 0.14],
        [0.9, 0.2],
        [1, 0.12],
      ]),
      30,
      20,
    );
    const phar = specimen.mesh(
      pharG,
      materialFactory.soft(0xc98770, { transparent: true, opacity: 0.9 }),
      { parent: flat, p: vec3(0, L / 2 - 0.9, 0) },
    );
    specimen.part(
      'Mouth and pharynx',
      'The mouth at the tip of the head leads into a muscular tube, the pharynx, that pumps food backward. Bacteria, algae and fragments of detritus are drawn in and passed to the intestine.',
      [mouth, mdisc, phar],
    );
    const brain = [-1, 1].map((k) =>
      specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xd9b26a), {
        parent: flat,
        p: vec3(0, L / 2 - 0.6, k * 0.17),
        s: vec3(0.13, 0.13, 0.12),
      }),
    );
    specimen.part(
      'Brain',
      'A pair of nerve clusters (ganglia) above the pharynx. They control movement of the head, cilia and body, and receive signals from the sensory bristles.',
      brain,
    );
    const gutG = latheBody(
      L / 2 + 0.6,
      (u) =>
        (0.1 + 0.16 * smoothStep(0, 0.1, u)) *
        (1 - 0.55 * smoothStep(0.88, 1, u)) *
        (1 + 0.06 * Math.sin(u * 25)),
      40,
      20,
    );
    const gut = specimen.mesh(
      gutG,
      materialFactory.soft(0x9aa85a, { transparent: true, opacity: 0.88 }),
      { parent: flat, p: vec3(0, L / 2 - 1.4 - (L / 2 + 0.6) / 2, 0) },
    );
    specimen.part(
      'Intestine',
      'A straight tube that digests the food and absorbs the nutrients, ending in an anus on the underside near the tail.',
      gut,
    );
    const eggM = specimen.mesh(
      sharedGeometries.sphere,
      materialFactory.shell(0xf4ecd8, 0.68, { bumpMap: bump, bumpScale: 0.6 }),
      { parent: flat, p: vec3(0, -0.95, 0), s: vec3(0.3, 0.55, 0.3) },
    );
    const emb = specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0xe8c2a6), {
      parent: flat,
      p: vec3(0, -0.95, 0),
      s: vec3(0.2, 0.4, 0.2),
    });
    const egg2 = specimen.mesh(
      sharedGeometries.sphere,
      materialFactory.soft(0xf0d4bc, { transparent: true, opacity: 0.8 }),
      { parent: flat, p: vec3(0, -1.9, 0), s: vec3(0.14, 0.2, 0.14) },
    );
    specimen.part(
      'Egg',
      'A freshwater Chaetonotus is mostly female and reproduces without mating. It lays only a few large eggs, often just one at a time, and eggs laid for the winter have thick shells.',
      [eggM, emb, egg2],
    );
    /* forked tail */
    const prongs = [];
    [-1, 1].forEach((k) => {
      const group = new THREE.Group();
      group.position.set(0, -L / 2 + 0.15, k * 0.1);
      root.add(group);
      const a = vec3(0, 0, 0);
      const b = vec3(0, -0.9, k * 0.4);
      specimen.mesh(sharedGeometries.sphere, plantMaterials.cuticle(0xd6bc8a), {
        parent: group,
        s: 0.05,
      });
      group.add(createRod(a, b, 0.11, 0.05, plantMaterials.cuticle(0xd6bc8a), 8));
      const tip = createRod(
        b,
        vec3(0, -1.25, k * 0.55),
        0.04,
        0.02,
        plantMaterials.dark(0x7a6844),
        6,
      );
      group.add(tip);
      specimen.mesh(sharedGeometries.sphere, materialFactory.shell(0xe8d8a8, 0.8), {
        parent: group,
        p: vec3(0, -1.28, k * 0.56),
        s: 0.045,
      });
      group.userData.k = k;
      prongs.push(group);
    });
    specimen.part(
      'Forked tail and adhesive tubes',
      'The trunk ends in two prongs, each with a hollow tube that releases a sticky secretion from glands. The animal attaches and releases in turn, so it can hold on in a current or inch along.',
      prongs,
    );
    specimen.anim((t) => {
      sweep.rotation.y = 0.12 * Math.sin(t * 0.9);
      sweep.position.x = -3.2 + 0.4 * Math.sin(t * 0.4);
      root.rotation.x = 0.04 * Math.sin(t * 1.3);
      prongs.forEach((g) => {
        g.rotation.y = g.userData.k * 0.1 * Math.sin(t * 1.3);
        g.rotation.x = 0.05 * Math.sin(t * 2.1 + g.userData.k);
      });
    });
  }
  ADDITIONAL_BUILDERS.gastrotrich = buildGastrotrich;
  ADDITIONAL_SPECIMENS.push({
    id: 'gastrotrich',
    cat: 'animals',
    name: 'Gastrotrich',
    latin: 'Chaetonotus sp.',
    size: 'about 100–300 µm',
    sizeUm: 200,
    U: 7.2,
    dist: 14.5,
    cls: 'Animalia · Gastrotricha · Chaetonotida',
    habitat: 'Ponds, mosses, wet sediments and damp soil; related genera live in the sea',
    move: 'Glides over surfaces on ventral cilia; adhesive tubes on the tail anchor it',
    feed: 'Sweeps bacteria, algae and detritus into the mouth with head cilia',
    repro: 'Freshwater species are mostly female and lay a few large eggs without mating',
    desc: 'A small, flattened, strap-shaped animal with a spiny back and two rows of cilia on its underside. Hairy-bellied is the literal meaning of its group name.',
    fun: [
      'About 800 species of gastrotrich are known, living in water films, sediments and the sea.',
      'The name Chaetonotus means bristle-back, after the spines on its upper surface.',
      'Each tail prong has a duo-gland adhesive tube: one gland sticks, another releases, so the animal can hold on and let go.',
      'Its tiny size means it lives within the thin film of water between sand grains and plant surfaces.',
    ],
    note: 'The number of scales, spines and cilia is reduced and their pattern simplified. Cilia are drawn longer than in life for visibility, and the egg is shown larger relative to the body than in many species.',
  });

  /* ---------- Volvox ---------- */
  function buildVolvox(specimen) {
    const R0 = 2.8;
    const N = 1500;
    const bg = new THREE.Group();
    specimen.add(bg);
    const jelly = specimen.mesh(
      new THREE.SphereGeometry(1, 48, 32),
      materialFactory.glass(0xb7d3a2, 0.16, { roughness: 0.05 }),
      { parent: bg, s: R0 * 1.03, ro: 9 },
    );
    specimen.part(
      'Jelly matrix',
      'A transparent, jelly-like layer of glycoprotein holds the colony together. The cells sit in its surface, and it fills most of the sphere with water-rich gel.',
      jelly,
      { shell: true },
    );
    const dirs = fibonacciSphere(N);
    const cells = createInstancedMesh(
      new THREE.SphereGeometry(1, 8, 6),
      materialFactory.soft(0xffffff, { roughness: 0.45 }),
      N,
    );
    const cr = createSeededRandom(11);
    const col = new THREE.Color();
    dirs.forEach((d, i) => {
      setInstanceTransform(
        cells,
        i,
        d.clone().multiplyScalar(R0),
        quaternionFromUp(d),
        vec3(0.085, 0.055, 0.085),
      );
      col.setHSL(0.27 + 0.04 * cr(), 0.55, 0.3 + 0.12 * cr());
      cells.setColorAt(i, col);
    });
    cells.instanceColor.needsUpdate = true;
    bg.add(cells);
    specimen.part(
      'Somatic cells',
      'Thousands of small green cells form a single layer on the surface. Each has a cup-shaped chloroplast for photosynthesis, and the cells are linked by thin cytoplasmic bridges, so the colony behaves like one organism.',
      cells,
    );
    const fp = [];
    const fn = [];
    dirs.forEach((d) => {
      const tg = perpendicularDirection(d).multiplyScalar(0.03);
      [-1, 1].forEach((k) => {
        fp.push(
          d
            .clone()
            .multiplyScalar(R0 + 0.05)
            .addScaledVector(tg, k),
        );
        fn.push(d.clone());
      });
    });
    const fl = createCiliaSet(specimen, materialFactory.soft(0x6f9a4a), fp, fn, {
      len: 0.38,
      r: 0.011,
      amp: 0.8,
      speed: 9,
      wave: 2.2,
      axis: vec3(0, -1, 0),
      seed: 5,
      parent: bg,
    });
    specimen.part(
      'Flagella',
      'Each somatic cell has two flagella that point outward. Together they beat backward and make the colony swim, rolling as it goes, usually toward gentle light.',
      fl,
    );
    const eyeD = dirs.filter((d, i) => d.y > -0.2 && i % 3 === 0);
    const eyes = createInstancedMesh(
      sharedGeometries.sphereLo,
      materialFactory.soft(0xd0502a, { emissive: 0x701800, emissiveIntensity: 0.4 }),
      eyeD.length,
    );
    eyeD.forEach((d, i) =>
      setInstanceTransform(
        eyes,
        i,
        d.clone().multiplyScalar(R0 + 0.045),
        null,
        0.022 + 0.022 * smoothStep(-0.2, 0.9, d.y),
      ),
    );
    bg.add(eyes);
    specimen.part(
      'Eyespots',
      'Each cell has an orange-red eyespot that senses light. Those at the front are larger, which helps the colony steer toward light by changing how its flagella beat.',
      eyes,
    );
    const gon = [];
    for (let i = 0; i < 9; i++) {
      const lowPts = fibonacciSphere(30).filter((v) => v.y < -0.1);
      const d = lowPts[Math.floor((i * lowPts.length) / 9)];
      gon.push(
        specimen.mesh(sharedGeometries.sphere, materialFactory.soft(0x2f7d32, { sheen: 1 }), {
          parent: bg,
          p: d.clone().multiplyScalar(R0 - 0.14),
          s: 0.2,
        }),
      );
    }
    specimen.part(
      'Gonidia',
      'A few large cells at the rear of the colony do not swim. They are reproductive cells: each divides repeatedly to make a new colony, which is released when the parent breaks open.',
      gon,
    );
    const daus = [];
    const DP = [
      [0.5, -0.6, 0.4, 0.75],
      [-0.9, 0.1, -0.7, 0.65],
      [0.3, 0.7, -0.9, 0.55],
    ];
    DP.forEach(([x, y, z, r], k) => {
      const group = new THREE.Group();
      group.position.set(x, y, z);
      bg.add(group);
      const sh = specimen.mesh(
        new THREE.SphereGeometry(1, 32, 20),
        materialFactory.shell(0x8bbf5a, 0.4, { bumpScale: 0.1 }),
        { parent: group, s: r },
      );
      const dd = fibonacciSphere(130);
      const im = createInstancedMesh(
        new THREE.SphereGeometry(1, 6, 4),
        materialFactory.soft(0x2f7d32),
        130,
      );
      dd.forEach((d, i) => setInstanceTransform(im, i, d.clone().multiplyScalar(r), null, 0.035));
      group.add(im);
      daus.push({ g: group, k, base: vec3(x, y, z) });
      specimen.part(
        `Daughter colony ${k + 1}`,
        'A new colony growing inside the parent. It starts as a single gonidium, divides into a hollow ball of cells and later turns itself inside out so that its flagella face outward.',
        [sh, im],
      );
    });
    specimen.anim((t) => {
      bg.rotation.set(0.25, t * 0.15, 0);
      daus.forEach(({ g, k, base }) => {
        g.rotation.set(t * 0.3 + k, t * 0.4 + k * 2, 0);
        g.position.set(
          base.x + 0.08 * Math.sin(t * 0.5 + k),
          base.y + 0.08 * Math.cos(t * 0.4 + k * 2),
          base.z,
        );
      });
    });
  }
  ADDITIONAL_BUILDERS.volvox = buildVolvox;
  ADDITIONAL_SPECIMENS.push({
    id: 'volvox',
    cat: 'algae',
    name: 'Volvox',
    latin: 'Volvox globator',
    size: 'colony about 0.5–1 mm across',
    sizeUm: 700,
    U: 6.4,
    dist: 14,
    cls: 'Eukaryota · Viridiplantae · Chlorophyta · Chlorophyceae · Volvocaceae',
    habitat: 'Freshwater ponds, ditches and puddles with plenty of light and nutrients',
    move: 'Swims by beating thousands of flagella, rolling slowly and heading toward light',
    feed: 'Photosynthesis; it makes its own food from light',
    repro:
      'Asexual: large cells divide to form daughter colonies inside; sexual reproduction with eggs and sperm in poor conditions',
    desc: 'A hollow ball of green cells that rolls through pond water as a single organism. It is a classic example of a simple multicellular life form.',
    fun: [
      'Antonie van Leeuwenhoek described it in 1700, after seeing it through one of his early microscopes.',
      'It divides labour: most cells swim and photosynthesise, while a few rear cells are set aside to make the next generation.',
      'Daughter colonies form inside, then turn themselves inside out, an event called inversion.',
      'Its flagella beat in coordination even though no single cell controls them all.',
    ],
    note: 'The model shows about 1,500 cells; real colonies hold anywhere from roughly 500 to many thousands, depending on the species. Cells and flagella are enlarged compared with the colony for visibility, and inversion of the daughter colonies is not shown.',
  });
}
