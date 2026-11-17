/**
 * Specimens: microscopic animals.
 *
 * Specimen builders: daphnia, tardigrade.
 */

import * as THREE from 'three';
import {
  sharedGeometries,
  AnimatedTube,
  scratchObject,
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
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';
import { createCanvasTexture } from '../engine/textures.js';
import {
  ADDITIONAL_BUILDERS,
  ADDITIONAL_SPECIMENS,
  plantMaterials,
  cyclePhase,
  latheBody,
} from './shared-helpers.js';

/* ================= NEW MICROSCOPIC ANIMALS (1) ================= */

/* ---------- Tardigrade ---------- */
function buildTardigrade(specimen) {
  const L = 4.4;
  const radiusAt = (u) => {
    const seg =
      1 +
      0.07 *
        Math.cos(TAU * 5 * u + 0.6) *
        smoothStep(0.05, 0.2, u) *
        (1 - smoothStep(0.8, 0.92, u));
    return (
      0.95 *
      Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * u)), 0.55) *
      seg *
      (1 - 0.33 * smoothStep(0.8, 1, u))
    );
  };
  const bg = new THREE.Group();
  specimen.add(bg);
  const body = new THREE.Group();
  body.rotation.z = -Math.PI / 2;
  bg.add(body);
  const bump = createCanvasTexture(
    64,
    64,
    (g, w, h) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, w, h);
      const r = createSeededRandom(2);
      for (let i = 0; i < 260; i++) {
        g.fillStyle = r() > 0.5 ? '#a8a8a8' : '#5c5c5c';
        g.beginPath();
        g.arc(r() * w, r() * h, 1.6 + r() * 1.6, 0, TAU);
        g.fill();
      }
    },
    false,
  );
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(3, 3);
  const skin = specimen.mesh(
    latheBody(L, radiusAt, 90, 40),
    materialFactory.shell(0xd9b98a, 0.62, {
      bumpMap: bump,
      bumpScale: 1.1,
      clearcoat: 0.5,
      roughness: 0.45,
    }),
    { parent: body, ro: 8 },
  );
  specimen.part(
    'Cuticle and body segments',
    'A flexible, ridged cuticle covers a head and four trunk segments, each with a pair of legs. The animal moults it as it grows, and it carries fine granules that give the surface a pebbly look.',
    skin,
    { shell: true },
  );
  const gut = createTubeAlongCurve(
    new THREE.CatmullRomCurve3([
      vec3(0, -L / 2 + 0.45, 0),
      vec3(0, -0.8, 0),
      vec3(0, 0.5, 0),
      vec3(0, L / 2 - 0.9, 0),
    ]),
    40,
    14,
    (u) => 0.34 * (0.8 + 0.2 * Math.sin(u * 25)),
    materialFactory.soft(0x8e9c52, { transparent: true, opacity: 0.85 }),
  );
  body.add(gut);
  specimen.part(
    'Gut',
    'A straight digestive tube runs from the mouth to the rear. Plant sap or the contents of small animals pass through the pharynx into a stomach that fills much of the body.',
    gut,
  );
  const sc = createInstancedMesh(sharedGeometries.sphereLo, plantMaterials.cuticle(0xf4ecd8), 90);
  const random = createSeededRandom(12);
  for (let i = 0; i < 90; i++) {
    const u = 0.1 + random() * 0.72;
    const a = random() * TAU;
    const r = radiusAt(u) * (0.55 + random() * 0.3);
    setInstanceTransform(
      sc,
      i,
      vec3(Math.cos(a) * r, (u - 0.5) * L, Math.sin(a) * r),
      null,
      0.07 + random() * 0.05,
    );
  }
  body.add(sc);
  specimen.part(
    'Storage cells',
    'Free-floating cells in the body cavity store fat, glycogen and proteins. They fuel the animal through long periods of fasting and dryness.',
    sc,
  );
  const head = new THREE.Group();
  head.position.y = L / 2 - 0.3;
  body.add(head);
  const bt = specimen.mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.8, 10),
    plantMaterials.dark(0x4b3a2a),
    { parent: head, p: vec3(0, -0.08, 0) },
  );
  const bulb = specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x7a5a3a), {
    parent: head,
    p: vec3(0, -0.55, 0),
    s: vec3(0.28, 0.3, 0.28),
  });
  for (let i = 0; i < 3; i++) {
    specimen.mesh(sharedGeometries.sphereLo, plantMaterials.dark(0x2a1f18), {
      parent: head,
      p: vec3(Math.cos(i * 2.1) * 0.12, -0.55, Math.sin(i * 2.1) * 0.12),
      s: 0.06,
    });
  }
  const st = [-1, 1].map((k) =>
    specimen.mesh(sharedGeometries.cylLo, plantMaterials.dark(0x2a1f18), {
      parent: head,
      p: vec3(k * 0.06, 0.42, 0),
      s: vec3(0.018, 0.48, 0.018),
    }),
  );
  const mouth = specimen.mesh(
    new THREE.TorusGeometry(0.09, 0.03, 6, 14),
    plantMaterials.dark(0x4b3a2a),
    { parent: head, p: vec3(0, 0.48, 0), r: [Math.PI / 2, 0, 0] },
  );
  specimen.part(
    'Mouth, stylets and pharyngeal bulb',
    'A tiny mouth at the front tip carries two sharp stylets that pierce a plant cell or a small animal. A muscular bulb with hardened plates (placoids) then pumps the contents back through the buccal tube.',
    [bt, bulb, ...st, mouth],
  );
  const e2 = [-1, 1].map((k) =>
    specimen.mesh(sharedGeometries.sphere, materialFactory.emit(0xc4302c, 0.55), {
      parent: body,
      p: vec3(-0.3, L / 2 - 0.5, k * 0.28),
      s: 0.065,
    }),
  );
  specimen.part(
    'Eyespots',
    'A pair of simple pigment-cup eyes on the head lets the animal tell light from dark, though it forms no real image.',
    e2,
  );
  const legs = [];
  const cm = plantMaterials.dark(0x4b3a2a);
  const lg = new THREE.CylinderGeometry(0.16, 0.23, 0.8, 14);
  lg.translate(0, 0.4, 0);
  [0.18, 0.37, 0.56, 0.76].forEach((u, i) =>
    [-1, 1].forEach((k) => {
      const r = radiusAt(u);
      const hip = new THREE.Group();
      hip.position.set(r * 0.78, (u - 0.5) * L, k * r * 0.42);
      hip.userData = { ph: i * 1.5 + (k > 0 ? 0 : Math.PI) };
      body.add(hip);
      const leg = new THREE.Group();
      leg.quaternion.copy(quaternionFromUp(vec3(0.95, 0, k * 0.4)));
      hip.add(leg);
      specimen.mesh(lg, materialFactory.shell(0xd9b98a, 0.85, { bumpMap: bump, bumpScale: 0.6 }), {
        parent: leg,
      });
      for (let c = 0; c < 4; c++) {
        const a = (c - 1.5) * 0.3;
        specimen.mesh(sharedGeometries.cone, cm, {
          parent: leg,
          p: vec3(Math.sin(a) * 0.1, 0.8, Math.cos(a) * 0.03),
          s: vec3(0.035, 0.24, 0.035),
          r: [0, 0, -a * 1.2],
        });
      }
      legs.push({ hip, leg });
    }),
  );
  specimen.part(
    'Legs and claws',
    'Eight stubby, unjointed legs, each ending in claws (often four), carry the animal in a slow, lumbering walk. Muscles pull the legs against internal fluid pressure, like a hydraulic system.',
    legs.map((l) => l.leg),
  );
  specimen.anim((t) => {
    legs.forEach(({ hip }) => {
      hip.rotation.z = 0.4 * Math.sin(t * 1.9 + hip.userData.ph);
    });
    bg.position.y = 0.04 * Math.sin(t * 3.8);
    bg.rotation.y = 0.06 * Math.sin(t * 0.8);
  });
}
ADDITIONAL_BUILDERS.tardigrade = buildTardigrade;
ADDITIONAL_SPECIMENS.push({
  id: 'tardigrade',
  cat: 'animals',
  name: 'Tardigrade',
  latin: 'Hypsibius dujardini',
  size: '0.3–0.5 mm',
  sizeUm: 400,
  U: 4.4,
  dist: 11.5,
  cls: 'Animalia · Tardigrada · Eutardigrada',
  habitat: 'Films of water on mosses, lichens, leaf litter and sediments',
  move: 'Walks slowly on four pairs of clawed legs',
  feed: 'Pierces algae or small animals with stylets and sucks out the contents',
  repro: 'Eggs laid after mating; some species reproduce without males',
  desc: 'The water bear, a plump eight-legged animal that ambles through moss. It can shut down, dry out and survive conditions that would kill almost any other animal.',
  fun: [
    'In its dried “tun” state it can survive extreme cold, drying and radiation, then revive when water returns.',
    'In 2007, tardigrades flown outside a satellite were exposed to open space; some survived and even laid eggs.',
    'It has a head and four body segments, each with a pair of legs.',
  ],
  note: 'Segment shapes and claw counts are simplified (claw number varies among species). The walking gait is an approximation of the slow, alternating step.',
});

/* ---------- Daphnia ---------- */
function buildDaphnia(specimen) {
  const bg = new THREE.Group();
  specimen.add(bg);
  const carp = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0xe0b46e, 0.36, { clearcoat: 0.6, roughness: 0.3 }),
    { parent: bg, p: vec3(-0.5, 0.05, 0), s: vec3(2.2, 1.45, 0.95), ro: 8 },
  );
  const ridge = specimen.mesh(
    new THREE.TorusGeometry(1, 0.012, 6, 60),
    plantMaterials.cuticle(0xa07a3a),
    { parent: bg, p: vec3(-0.5, 0.05, 0), s: vec3(2.2, 1.45, 1), r: [0, 0, 0] },
  );
  specimen.part(
    'Carapace',
    'The transparent shell, a fold of the skin, encloses the trunk like a clam. It is what makes Daphnia clear enough to watch the heart beat and the gut work.',
    [carp, ridge],
    { shell: true },
  );
  specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.shell(0xe0b46e, 0.42, { clearcoat: 0.6 }),
    { parent: bg, p: vec3(1.7, 0.1, 0), s: vec3(0.95, 0.8, 0.7), ro: 8 },
  );
  specimen.mesh(sharedGeometries.cone, plantMaterials.cuticle(0xc9a05c), {
    parent: bg,
    p: vec3(2.3, -0.3, 0),
    s: vec3(0.2, 0.6, 0.2),
    r: [0, 0, -2.2],
  });
  const eye = new THREE.Group();
  eye.position.set(2.05, -0.05, 0);
  bg.add(eye);
  specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x1d1a18, { roughness: 0.2 }), {
    parent: eye,
    s: 0.33,
  });
  for (let i = 0; i < 12; i++) {
    const d = fibonacciSphere(12)[i];
    specimen.mesh(sharedGeometries.sphereLo, materialFactory.glass(0xffe9c8, 0.9), {
      parent: eye,
      p: d.multiplyScalar(0.33),
      s: 0.06,
    });
  }
  specimen.part(
    'Compound eye',
    'A single dark eye made of many tiny lenses sits at the front of the head. It trembles constantly, and the animal steers toward light with it. A small simple eye, the ocellus, sits behind it.',
    eye,
  );
  const brood = new THREE.Group();
  bg.add(brood);
  const em = materialFactory.soft(0xcfe0a0, { transparent: true, opacity: 0.9 });
  [
    [-0.6, 0.62, 0.0],
    [-1.0, 0.52, 0.22],
    [-1.0, 0.52, -0.22],
    [-1.45, 0.38, 0.0],
    [-0.2, 0.68, 0.18],
  ].forEach(([x, y, z]) => {
    specimen.mesh(sharedGeometries.sphere, em, { parent: brood, p: vec3(x, y, z), s: 0.21 });
    specimen.mesh(sharedGeometries.sphere, plantMaterials.dark(0x7a9a3a), {
      parent: brood,
      p: vec3(x, y, z),
      s: 0.09,
    });
  });
  specimen.part(
    'Brood chamber and embryos',
    'Females keep their eggs in a pouch above the back. In good conditions the eggs develop without fertilisation into new females, which are released after a day or two.',
    brood,
  );
  const heart = specimen.mesh(
    sharedGeometries.sphere,
    materialFactory.soft(0xd4504a, { emissive: 0x802018, emissiveIntensity: 0.4 }),
    { parent: bg, p: vec3(0.95, 0.62, 0), s: vec3(0.22, 0.2, 0.2) },
  );
  specimen.part(
    'Heart',
    'A small muscular chamber on the back pumps colourless blood around the body at several beats per second, easy to see through the shell.',
    heart,
  );
  const gp = new THREE.CatmullRomCurve3([
    vec3(1.5, -0.3, 0),
    vec3(0.7, -0.35, 0),
    vec3(0, -0.1, 0),
    vec3(-0.8, -0.1, 0),
    vec3(-1.5, -0.45, 0),
    vec3(-2.15, -0.5, 0),
  ]);
  const gt = new AnimatedTube(
    40,
    12,
    materialFactory.soft(0xb8763a, { transparent: true, opacity: 0.88 }),
  );
  const gpts = gp.getPoints(40);
  bg.add(gt.mesh);
  specimen.part(
    'Gut',
    'A tube runs from the mouth, with a looped midgut, to the anus near the tail. Waves of muscle contraction (peristalsis) can be seen moving food along.',
    gt.mesh,
  );
  const limbs = new THREE.Group();
  bg.add(limbs);
  const lm = materialFactory.shell(0xcfa66a, 0.8, { side: THREE.DoubleSide });
  const lp = [];
  for (let i = 0; i < 5; i++) {
    const group = new THREE.Group();
    group.position.set(0.9 - i * 0.45, -0.55, 0);
    limbs.add(group);
    specimen.mesh(sharedGeometries.sphere, lm, {
      parent: group,
      p: vec3(0, -0.2, 0),
      s: vec3(0.07, 0.3, 0.38),
    });
    const hs = createInstancedMesh(sharedGeometries.cylLo, plantMaterials.cuticle(0xb08a50), 8);
    for (let k = 0; k < 8; k++) {
      scratchObject.position.set(0, -0.5, (k - 3.5) * 0.09);
      scratchObject.scale.set(0.008, 0.24, 0.008);
      scratchObject.rotation.set(0, 0, 0);
      scratchObject.quaternion.identity();
      scratchObject.updateMatrix();
      hs.setMatrixAt(k, scratchObject.matrix);
    }
    group.add(hs);
    lp.push(group);
  }
  specimen.part(
    'Thoracic limbs',
    'Five pairs of leaf-like legs beat constantly, drawing a current of water through the shell. Fine bristles on them act as a sieve that traps algae and bacteria, which are then pushed forward to the mouth.',
    limbs,
  );
  const spine = specimen.mesh(sharedGeometries.cone, plantMaterials.cuticle(0xb08a50), {
    parent: bg,
    p: vec3(-2.55, -0.05, 0),
    s: vec3(0.12, 1.2, 0.12),
    r: [0, 0, Math.PI / 2 + 0.15],
  });
  specimen.part(
    'Tail spine',
    'A sharp spine at the back of the shell helps deter predators and keeps the animal steady in the water.',
    spine,
  );
  const ant = [];
  [-1, 1].forEach((k) => {
    const piv = new THREE.Group();
    piv.position.set(1.45, 0.6, k * 0.32);
    bg.add(piv);
    specimen.mesh(new THREE.CylinderGeometry(0.06, 0.09, 1, 10), plantMaterials.cuticle(0xcfa66a), {
      parent: piv,
      p: vec3(0, 0.5, 0),
    });
    [-1, 1].forEach((b) => {
      const br = new THREE.Group();
      br.position.set(0, 1, 0);
      br.rotation.z = b * 0.45;
      piv.add(br);
      specimen.mesh(
        new THREE.CylinderGeometry(0.03, 0.05, 1.1, 8),
        plantMaterials.cuticle(0xcfa66a),
        { parent: br, p: vec3(0, 0.55, 0) },
      );
      const sf = createInstancedMesh(sharedGeometries.cylLo, plantMaterials.cuticle(0xd9b878), 6);
      for (let q = 0; q < 6; q++) {
        scratchObject.position.set(0, 1.05, 0);
        scratchObject.scale.set(0.012, 0.55, 0.012);
        scratchObject.rotation.set(0, 0, (q - 2.5) * 0.22);
        scratchObject.updateMatrix();
        sf.setMatrixAt(q, scratchObject.matrix);
      }
      br.add(sf);
    });
    ant.push(piv);
  });
  specimen.part(
    'Second antennae',
    'Large branched antennae carry rows of feathery bristles. Their strokes, about every second, drive the characteristic hopping swim that gives the animal its name, the water flea.',
    ant,
  );

  specimen.anim((t) => {
    const k = cyclePhase(t, 1.25);
    const st = k < 0.3 ? smoothStep(0, 0.3, k) : 1 - smoothStep(0.3, 1, k);
    ant.forEach((p, i) => {
      p.rotation.z = -0.2 - 1.35 * st;
      p.rotation.x = (i ? 1 : -1) * (0.5 - 0.3 * st);
    });
    heart.scale
      .set(0.22, 0.2, 0.2)
      .multiplyScalar(1 + 0.25 * Math.pow(Math.max(0, Math.sin(t * TAU * 2.6)), 3));
    gt.update(gpts, (s) => 0.13 + 0.025 * Math.sin(s * 28 - t * 3));
    lp.forEach((g, i) => {
      g.rotation.z = 0.35 * Math.sin(t * 9 - i * 0.8);
    });
    bg.position.y = 0.35 * Math.sin(TAU * k - 1.2) * 0.5 + 0.1;
    bg.rotation.z = 0.06 * Math.sin(TAU * k);
  });
}
ADDITIONAL_BUILDERS.daphnia = buildDaphnia;
ADDITIONAL_SPECIMENS.push({
  id: 'daphnia',
  cat: 'animals',
  name: 'Daphnia',
  latin: 'Daphnia pulex',
  size: '1–3 mm',
  sizeUm: 2000,
  U: 4.8,
  dist: 11.5,
  cls: 'Animalia · Arthropoda · Crustacea · Branchiopoda',
  habitat: 'Freshwater ponds, lakes and puddles',
  move: 'Hops through the water using its large second antennae',
  feed: 'Filter feeder: leaf-like legs strain algae, bacteria and detritus',
  repro:
    'Cyclical parthenogenesis: females clone themselves; males and resting eggs appear when conditions worsen',
  desc: 'The water flea, a transparent crustacean you can see with the naked eye. Its beating heart, gut and brood of eggs are all visible through the shell.',
  fun: [
    'The heart beats several times a second, so you can watch it under a microscope.',
    'Some Daphnia grow a helmet or tail spine when they sense chemicals from predators.',
    'It is widely used to test whether water is polluted.',
  ],
  note: 'Legs, antennae and bristles are simplified; bristle numbers are reduced. The animal is shown with its brood chamber filled, as seen in an adult female.',
});
