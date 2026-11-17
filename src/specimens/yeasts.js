/**
 * Specimens: yeasts.
 *
 * Specimen builders: candida, yeast.
 */

import * as THREE from 'three';
import {
  sharedGeometries,
  createInstancedMesh,
  setInstanceTransform,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import { vec3, randomDirection, createSeededRandom, smoothStep } from '../engine/math.js';
import { createMitochondrionMaterials, createMitochondrion } from '../engine/organelles.js';
import { textureLibrary } from '../engine/textures.js';
import { buildHypha } from './moulds.js';
import { ADDITIONAL_BUILDERS, ADDITIONAL_SPECIMENS } from './shared-helpers.js';

/* ================= F7: Saccharomyces (yeast) and Candida albicans ================= */

const f7Z = vec3(0, 0, 1);

const scar = new THREE.TorusGeometry(1, 0.16, 6, 18);
/* radius of an ellipsoid (rx,ry,rz) along unit direction d */
const f7Rad = (d, rx, ry, rz) => 1 / Math.sqrt((d.x / rx) ** 2 + (d.y / ry) ** 2 + (d.z / rz) ** 2);

/* ---------- Saccharomyces cerevisiae ---------- */
function buildYeast(specimen) {
  const random = createSeededRandom(17);
  const root = new THREE.Group();
  specimen.add(root);
  const wallM = materialFactory.shell(0xd4b872, 0.7, { bumpScale: 0.35, roughness: 0.45 });
  const nucM = materialFactory.soft(0xa9795a, { roughness: 0.45 });
  const nuclM = materialFactory.soft(0x6f4a38);
  const vacM = materialFactory.glass(0xd2bd7e, 0.55, { roughness: 0.2 });
  const lipM = materialFactory.soft(0xe0a23c, { roughness: 0.3 });
  const scarM = materialFactory.soft(0xa4854c, { roughness: 0.6 });
  const mm = createMitochondrionMaterials();
  const P = { wall: [], nuc: [], vac: [], mito: [], lip: [], bud: [], scar: [] };
  const defs = [
    { p: [0, 0, 0], r: [1, 0.82, 0.82], bud: { d: [0.85, 0.5, 0.2], ph: 0.2 }, sc: 3 },
    { p: [-2.3, 0.9, 0.5], r: [0.84, 0.7, 0.7], bud: { d: [-0.5, 0.8, -0.2], ph: 0.6 }, sc: 2 },
    { p: [2.1, -1, -0.4], r: [0.9, 0.72, 0.72], bud: { d: [0.4, -0.85, 0.3], ph: 0.85 }, sc: 4 },
    { p: [-0.6, -2, 0.7], r: [0.72, 0.62, 0.62], bud: null, sc: 1 },
    { p: [1.6, 1.9, 0.9], r: [0.68, 0.56, 0.56], bud: null, sc: 1 },
  ];
  const buds = [];
  defs.forEach((c) => {
    const [rx, ry, rz] = c.r;
    const group = new THREE.Group();
    group.position.set(...c.p);
    group.rotation.set(random() * 3, random() * 3, random() * 3);
    root.add(group);
    const rm = (rx + ry + rz) / 3;
    P.wall.push(
      specimen.mesh(sharedGeometries.sphere, wallM, { parent: group, s: vec3(rx, ry, rz), ro: 8 }),
    );
    const nu = specimen.mesh(sharedGeometries.sphere, nucM, {
      parent: group,
      p: vec3(rx * 0.12, ry * 0.08, 0),
      s: vec3(0.34, 0.3, 0.3).multiplyScalar(rm),
    });
    const no = specimen.mesh(sharedGeometries.sphereLo, nuclM, {
      parent: group,
      p: vec3(rx * 0.12 + 0.08, ry * 0.08, 0.06),
      s: 0.12 * rm,
    });
    P.nuc.push(nu, no);
    P.vac.push(
      specimen.mesh(sharedGeometries.sphere, vacM, {
        parent: group,
        p: vec3(-rx * 0.38, -ry * 0.1, rz * 0.12),
        s: vec3(0.46, 0.4, 0.4).multiplyScalar(rm),
        ro: 5,
      }),
    );
    for (let k = 0; k < 3; k++) {
      const m = createMitochondrion(mm, 0.5 * rm);
      m.position.set(
        rx * (0.15 + random() * 0.4),
        ry * (random() * 1.2 - 0.6),
        rz * (random() * 1.2 - 0.6),
      );
      m.rotation.set(random() * 3, random() * 3, random() * 3);
      group.add(m);
      P.mito.push(m);
    }
    for (let k = 0; k < 4; k++) {
      P.lip.push(
        specimen.mesh(sharedGeometries.sphereLo, lipM, {
          parent: group,
          p: vec3(
            -rx * (0.1 + random() * 0.4),
            ry * (random() * 1.4 - 0.7),
            rz * (random() * 1.4 - 0.7),
          ).multiplyScalar(0.8),
          s: (0.06 + random() * 0.04) * rm,
        }),
      );
    }
    for (let k = 0; k < c.sc; k++) {
      const d = randomDirection(random);
      if (c.bud && d.dot(vec3(...c.bud.d).normalize()) > 0.5) {
        k--;
        continue;
      }
      const sm = specimen.mesh(scar, scarM, {
        parent: group,
        p: d.clone().multiplyScalar(f7Rad(d, rx, ry, rz) * 1.005),
        s: 0.16 * rm,
      });
      sm.quaternion.setFromUnitVectors(f7Z, d);
      P.scar.push(sm);
    }
    if (c.bud) {
      const d = vec3(...c.bud.d).normalize();
      const bud = specimen.mesh(sharedGeometries.sphere, wallM, { parent: group, ro: 8 });
      const neck = specimen.mesh(scar, scarM, { parent: group });
      const bn = specimen.mesh(sharedGeometries.sphereLo, nucM, { parent: group });
      neck.quaternion.setFromUnitVectors(f7Z, d);
      P.bud.push(bud, neck, bn);
      buds.push({ bud, neck, bn, d, rx, ry, rz, rm, ph: c.bud.ph });
    }
  });
  const swing = [...root.children];
  specimen.anim((t) => {
    root.rotation.y = Math.sin(t * 0.1) * 0.35;
    root.rotation.x = Math.sin(t * 0.07) * 0.12;
    swing.forEach((g, i) => {
      g.rotation.y += 0.0007 * (i + 1);
    });
    buds.forEach((b) => {
      const ph = (t * 0.03 + b.ph) % 1;
      const gr = smoothStep(0, 0.8, ph);
      const away = smoothStep(0.88, 1, ph);
      const br = (0.1 + 0.62 * gr) * b.rm * (1 - smoothStep(0.95, 1, ph));
      const surf = f7Rad(b.d, b.rx, b.ry, b.rz);
      b.bud.scale.set(br * 1.05, br, br);
      b.bud.position.copy(b.d).multiplyScalar(surf + br * 0.8 + away * br * 1.6);
      const ns = br * 0.5 * smoothStep(0.5, 0.75, ph) * (1 - away);
      b.bn.scale.setScalar(Math.max(ns, 0.0001));
      b.bn.position.copy(b.bud.position);
      b.neck.position.copy(b.d).multiplyScalar(surf * 1.005);
      b.neck.scale.setScalar(Math.max(0.0001, br * 0.5 * (1 - smoothStep(0.84, 0.9, ph))));
    });
  });
  specimen.part(
    'Cell wall',
    'A rigid coat about 100–200 nm thick that protects the cell and sets its oval shape. The inner layer is mostly β-glucan with some chitin, and the outer layer is a fuzzy coat of mannoproteins. Enzymes can digest it away to leave a fragile, round protoplast.',
    P.wall,
    { shell: true },
  );
  specimen.part(
    'Growing bud',
    'Yeast reproduces asexually by budding. A bud appears at one spot and enlarges as new membrane and wall are added there, while one copy of the divided nucleus moves into it. The bud finally separates at a narrow neck. In rich medium at about 30 °C a cycle takes roughly 90 minutes, and it is sped up in this view.',
    P.bud,
  );
  specimen.part(
    'Bud scars',
    'A ring of chitin is left on the mother cell where each bud separated. A cell does not bud twice from the same site, so the number of scars counts the daughters it has made. A mother cell can make about 20–30 buds before it stops dividing.',
    P.scar,
  );
  specimen.part(
    'Nucleus and nucleolus',
    'The nucleus holds the haploid genome: 16 chromosomes and about 12 million base pairs that code for roughly 6,000 genes. Yeast divides its nucleus without breaking the nuclear envelope. The darker nucleolus makes ribosomes.',
    P.nuc,
  );
  specimen.part(
    'Vacuole',
    'A large acid-filled compartment that works like the lysosome of animal cells. It stores amino acids, ions and phosphate, breaks down worn-out proteins, and helps keep the cell’s pH and water balance stable. It breaks into small pieces when a bud forms.',
    P.vac,
  );
  specimen.part(
    'Mitochondria',
    'In cells growing on glucose, yeast makes most of its energy by fermentation, so its mitochondria are few and small. On non-fermentable foods such as glycerol, they grow into a network and respire. They carry their own small genome of about 86,000 base pairs.',
    P.mito,
  );
  specimen.part(
    'Lipid droplets',
    'Stores of fats (triacylglycerols and sterol esters) wrapped in a single layer of phospholipid. The cell uses them as a source of energy and as building material for new membranes.',
    P.lip,
  );
}
ADDITIONAL_BUILDERS.yeast = buildYeast;
ADDITIONAL_SPECIMENS.push({
  id: 'yeast',
  cat: 'fungi',
  name: 'Yeast',
  latin: 'Saccharomyces cerevisiae',
  size: 'cells about 5–10 µm',
  sizeUm: 7,
  umPerUnit: 3.6,
  U: 7,
  dist: 15,
  cls: 'Eukaryota · Fungi · Ascomycota · Saccharomycetes',
  habitat:
    'Sugary surfaces such as fruit skins and tree sap; cultured for baking, brewing and winemaking',
  move: 'Non-motile; cells drift in liquid',
  feed: 'Heterotroph: ferments sugars to ethanol and carbon dioxide, and respires when oxygen is present',
  repro:
    'Mostly asexual budding; haploid a and α cells can mate, and the diploid forms four spores in an ascus',
  desc: 'Oval single cells, several of them forming daughter buds. Yeast is a fungus that lives as a single cell, and it is the most widely used eukaryotic model organism.',
  fun: [
    'It was the first eukaryote to have its whole genome sequenced, in 1996.',
    'Yoshinori Ohsumi won the 2016 Nobel Prize in Physiology or Medicine for discovering how yeast cells recycle their own parts (autophagy).',
    'Many human genes can stand in for their yeast counterparts, which is why yeast helps study human disease.',
    'Humans have used it to leaven bread and ferment beer and wine for thousands of years.',
  ],
  note: 'Cell size and organelle layout follow typical cells, but the cluster, colours and organelle sizes are simplified. Budding is sped up and the bud-scar count is illustrative.',
});

/* ---------- Candida albicans ---------- */
function buildCandida(specimen) {
  const random = createSeededRandom(29);
  const root = new THREE.Group();
  specimen.add(root);
  root.position.set(-1.4, -1, 0);
  const wallM = materialFactory.shell(0xdcc07c, 0.68, { bumpScale: 0.3, roughness: 0.45 });
  materialFactory.soft(0xdcc58a, { roughness: 0.5 });
  const nucM = materialFactory.soft(0xa9795a);
  const vesM = materialFactory.emit(0xd98a4a, 0.25, { roughness: 0.35 });
  const sepM = materialFactory.soft(0xa4854c);
  const chM = materialFactory.shell(0xcdb67e, 0.62, { bumpScale: 0.6 });
  const chIn = materialFactory.soft(0xe2cf98, { bumpMap: textureLibrary.grain, bumpScale: 0.5 });
  const P = { yeast: [], bud: [], germ: [], hypha: [], pseudo: [], chlam: [], ves: [], sep: [] };
  /* budding yeast cells (blastoconidia) */
  const ycells = [
    { p: [-2.6, -1.9, 0], r: [0.78, 0.62, 0.62], b: [-0.6, 0.7, 0.2], ph: 0.3 },
    { p: [-3.6, -0.6, 0.5], r: [0.7, 0.56, 0.56], b: null },
    { p: [-1.6, -0.9, -0.5], r: [0.74, 0.6, 0.6], b: [0.7, 0.5, 0], ph: 0.7 },
  ];
  const ybuds = [];
  ycells.forEach((c) => {
    const group = new THREE.Group();
    group.position.set(...c.p);
    group.rotation.z = random() * 3;
    root.add(group);
    P.yeast.push(
      specimen.mesh(sharedGeometries.sphere, wallM, { parent: group, s: vec3(...c.r), ro: 8 }),
    );
    P.yeast.push(
      specimen.mesh(sharedGeometries.sphere, nucM, { parent: group, p: vec3(0.05, 0, 0), s: 0.22 }),
    );
    if (c.b) {
      const bd = specimen.mesh(sharedGeometries.sphere, wallM, { parent: group, ro: 8 });
      P.bud.push(bd);
      ybuds.push({ bd, d: vec3(...c.b).normalize(), r: c.r, ph: c.ph });
    }
  });
  /* the cell that sends out a germ tube, then a true hypha with septa */
  const mother = new THREE.Group();
  mother.position.set(-0.4, 0, 0);
  root.add(mother);
  P.yeast.push(
    specimen.mesh(sharedGeometries.sphere, wallM, {
      parent: mother,
      s: vec3(0.9, 0.7, 0.7),
      ro: 8,
    }),
  );
  const hp = [
    vec3(0.1, 0, 0),
    vec3(1.5, 0.2, 0.1),
    vec3(3, 0.9, 0.2),
    vec3(4.4, 1.1, 0.1),
    vec3(5.8, 1.9, -0.1),
    vec3(7, 2.4, -0.3),
  ];
  const hy = buildHypha(
    specimen,
    root,
    hp.map((v) => v.clone().add(vec3(-0.4, 0, 0))),
    0.3,
    wallM,
    { septa: 1.45, s0: 1.45, sMat: sepM, ro: 8 },
  );
  P.hypha.push(...hy.all);
  P.sep.push(...hy.sep);
  const germ = buildHypha(
    specimen,
    root,
    [vec3(-0.9, 0.9, 0), vec3(-1.1, 1.4, 0.1), vec3(-1.6, 2.1, 0.3)],
    0.26,
    wallM,
    { ro: 8 },
  );
  const gy = new THREE.Group();
  root.add(gy);
  P.germ.push(...germ.all);
  P.yeast.push(
    specimen.mesh(sharedGeometries.sphere, wallM, {
      parent: root,
      p: vec3(-0.8, 0.5, 0),
      s: vec3(0.7, 0.6, 0.6),
      ro: 8,
    }),
  );
  /* pseudohypha: chain of elongated, constricted cells */
  const pc = new THREE.CatmullRomCurve3([
    vec3(-1.4, 2.8, 0.2),
    vec3(-0.6, 3.6, 0),
    vec3(0.5, 4.2, -0.2),
    vec3(1.8, 4.5, -0.4),
    vec3(3, 4.3, -0.5),
  ]);
  const pn = 5;
  const pcells = [];
  for (let i = 0; i < pn; i++) {
    const u = (i + 0.5) / pn;
    const p = pc.getPointAt(u);
    const tg = pc.getTangentAt(u);
    const m = specimen.mesh(sharedGeometries.sphere, wallM, {
      parent: root,
      p,
      s: vec3(0.34 - i * 0.015, 0.6, 0.34 - i * 0.015),
      ro: 8,
    });
    m.quaternion.setFromUnitVectors(vec3(0, 1, 0), tg);
    P.pseudo.push(m);
    pcells.push(m);
  }
  /* thick-walled chlamydospore on a suspensor cell at the end of a side hypha */
  const side = buildHypha(
    specimen,
    root,
    [vec3(3.4, 1, 0.2), vec3(3.9, -0.2, 0.4), vec3(4.6, -1.3, 0.5), vec3(5.2, -2, 0.5)],
    0.24,
    wallM,
    { septa: 1.0, s0: 0.9, sMat: sepM, ro: 8 },
  );
  P.hypha.push(...side.all);
  P.sep.push(...side.sep);
  const ch = specimen.mesh(sharedGeometries.sphere, chM, {
    parent: root,
    p: vec3(5.95, -2.55, 0.5),
    s: 0.95,
    ro: 9,
  });
  const chi = specimen.mesh(sharedGeometries.sphere, chIn, {
    parent: root,
    p: vec3(5.95, -2.55, 0.5),
    s: 0.72,
  });
  P.chlam.push(ch, chi);
  /* secretory vesicles streaming to the hypha tip */
  const NV = 36;
  const ves = createInstancedMesh(sharedGeometries.sphereLo, vesM, NV);
  const vc = new THREE.CatmullRomCurve3(hp.map((v) => v.clone().add(vec3(-0.4, 0, 0))));
  const voff = Array.from({ length: NV }, () => random());
  const vperp = Array.from({ length: NV }, () => randomDirection(random).multiplyScalar(0.12));
  root.add(ves);
  P.ves.push(ves);
  specimen.anim((t) => {
    root.rotation.y = Math.sin(t * 0.12) * 0.3;
    root.rotation.x = Math.sin(t * 0.09) * 0.1;
    ybuds.forEach((b) => {
      const ph = (t * 0.03 + b.ph) % 1;
      const br = (0.12 + 0.5 * smoothStep(0, 0.85, ph)) * (1 - smoothStep(0.95, 1, ph));
      const r = f7Rad(b.d, ...b.r);
      b.bd.scale.set(br, br, br);
      b.bd.position.copy(b.d).multiplyScalar(r + br * 0.8);
    });
    for (let i = 0; i < NV; i++) {
      const u = (voff[i] + t * 0.05 * (0.6 + (i % 5) * 0.15)) % 1;
      setInstanceTransform(ves, i, vc.getPointAt(u).add(vperp[i]), null, 0.05 + 0.07 * u);
    }
    ves.instanceMatrix.needsUpdate = true;
    pcells.forEach((m, i) => {
      m.scale.y = 0.6 + 0.03 * Math.sin(t * 0.6 + i);
    });
  });
  specimen.part(
    'Yeast cells (blastoconidia)',
    'Round to oval cells about 4–6 µm across that multiply by budding. In the body, this is the form that spreads through the bloodstream and lives as a harmless gut and skin resident.',
    P.yeast,
    { shell: true },
  );
  specimen.part(
    'Buds',
    'Daughter cells growing from a mother yeast cell. Candida switches between this yeast form and the filament forms below in response to temperature, pH, CO₂ and nutrients, and this switch is called dimorphism.',
    P.bud,
  );
  specimen.part(
    'Germ tube',
    'A short tube that grows from a yeast cell, with the same width all along and no narrowing at its base. Cells put out germ tubes within 1–2 hours at 37 °C in serum, and this is the first step in making a true hypha.',
    P.germ,
  );
  specimen.part(
    'True hypha with septa',
    'A long, parallel-sided filament of about 2 µm width, divided by complete cross walls (septa). Hyphae let Candida push into tissue and are tied to its ability to cause disease.',
    [...P.hypha, ...P.sep],
  );
  specimen.part(
    'Pseudohypha',
    'A chain of elongated yeast-like cells that stay joined after budding, with a visible constriction at each joint. This form is wider and less regular than a true hypha.',
    P.pseudo,
  );
  specimen.part(
    'Chlamydospore',
    'A large, round, thick-walled resting cell, often at the end of a suspensor cell on a hypha. It forms under poor conditions in culture, and its role in the body is not well understood.',
    P.chlam,
  );
  specimen.part(
    'Secretory vesicles',
    'Small membrane packets that stream along the hypha and gather at the growing tip. They deliver the enzymes and wall material needed to extend the tip, so the filament grows only at its end.',
    P.ves,
  );
}
ADDITIONAL_BUILDERS.candida = buildCandida;
ADDITIONAL_SPECIMENS.push({
  id: 'candida',
  cat: 'fungi',
  name: 'Candida',
  latin: 'Candida albicans',
  size: 'yeast cells 4–6 µm; hyphae about 2 µm wide and tens of µm long',
  sizeUm: 5,
  umPerUnit: 3.4,
  U: 9,
  dist: 25,
  cls: 'Eukaryota · Fungi · Ascomycota · Saccharomycetes',
  habitat: 'Mouths, guts and skin of people and other warm-blooded animals',
  move: 'Non-motile; filaments extend at their tips',
  feed: 'Heterotroph: absorbs nutrients from the host or the surrounding medium',
  repro:
    'Asexual budding and filament growth; a parasexual cycle exists and it has no known meiosis',
  desc: 'A dimorphic fungus drawn in several forms at once: budding yeast cells, a germ tube, a septate hypha, a pseudohypha and a thick-walled chlamydospore.',
  fun: [
    'It lives harmlessly in most people but can cause thrush and, in people with weakened immunity, serious bloodstream infections.',
    'Its switch between yeast and filament forms is closely linked to its ability to invade tissue.',
    'It grows in biofilms on medical devices, where the cells are hard to treat with drugs.',
    'It is a diploid organism with eight pairs of chromosomes.',
  ],
  note: 'The forms are shown together for comparison and are not usually all seen in one place. Cell and hypha widths follow typical values; hypha length is shortened. Colours are artistic.',
});
