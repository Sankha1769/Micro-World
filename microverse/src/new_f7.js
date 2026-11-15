/* ================= F7: Saccharomyces (yeast) and Candida albicans ================= */
const f7q = new THREE.Quaternion(), f7Z = V(0, 0, 1), f7p = V();
const f7Scar = new THREE.TorusGeometry(1, .16, 6, 18);
/* radius of an ellipsoid (rx,ry,rz) along unit direction d */
const f7Rad = (d, rx, ry, rz) => 1 / Math.sqrt((d.x / rx) ** 2 + (d.y / ry) ** 2 + (d.z / rz) ** 2);

/* ---------- Saccharomyces cerevisiae ---------- */
function buildYeast(S) {
  const R = rng(17), root = new THREE.Group(); S.add(root);
  const wallM = M.shell(0xd4b872, .7, { bumpScale: .35, roughness: .45 }), nucM = M.soft(0xa9795a, { roughness: .45 }), nuclM = M.soft(0x6f4a38),
    vacM = M.glass(0xd2bd7e, .55, { roughness: .2 }), lipM = M.soft(0xe0a23c, { roughness: .3 }), scarM = M.soft(0xa4854c, { roughness: .6 }), mm = mitoMats();
  const P = { wall: [], nuc: [], vac: [], mito: [], lip: [], bud: [], scar: [] };
  const defs = [
    { p: [0, 0, 0], r: [1, .82, .82], bud: { d: [.85, .5, .2], ph: .2 }, sc: 3 },
    { p: [-2.3, .9, .5], r: [.84, .7, .7], bud: { d: [-.5, .8, -.2], ph: .6 }, sc: 2 },
    { p: [2.1, -1, -.4], r: [.9, .72, .72], bud: { d: [.4, -.85, .3], ph: .85 }, sc: 4 },
    { p: [-.6, -2, .7], r: [.72, .62, .62], bud: null, sc: 1 },
    { p: [1.6, 1.9, .9], r: [.68, .56, .56], bud: null, sc: 1 }];
  const buds = [];
  defs.forEach((c, ci) => {
    const [rx, ry, rz] = c.r, g = new THREE.Group(); g.position.set(...c.p); g.rotation.set(R() * 3, R() * 3, R() * 3); root.add(g);
    const rm = (rx + ry + rz) / 3;
    P.wall.push(S.mesh(G.sphere, wallM, { parent: g, s: V(rx, ry, rz), ro: 8 }));
    const nu = S.mesh(G.sphere, nucM, { parent: g, p: V(rx * .12, ry * .08, 0), s: V(.34, .3, .3).multiplyScalar(rm) }), no = S.mesh(G.sphereLo, nuclM, { parent: g, p: V(rx * .12 + .08, ry * .08, .06), s: .12 * rm });
    P.nuc.push(nu, no);
    P.vac.push(S.mesh(G.sphere, vacM, { parent: g, p: V(-rx * .38, -ry * .1, rz * .12), s: V(.46, .4, .4).multiplyScalar(rm), ro: 5 }));
    for (let k = 0; k < 3; k++) { const m = mitochondrion(mm, .5 * rm); m.position.set(rx * (.15 + R() * .4), ry * (R() * 1.2 - .6), rz * (R() * 1.2 - .6)); m.rotation.set(R() * 3, R() * 3, R() * 3); g.add(m); P.mito.push(m); }
    for (let k = 0; k < 4; k++) P.lip.push(S.mesh(G.sphereLo, lipM, { parent: g, p: V(-rx * (.1 + R() * .4), ry * (R() * 1.4 - .7), rz * (R() * 1.4 - .7)).multiplyScalar(.8), s: (.06 + R() * .04) * rm }));
    for (let k = 0; k < c.sc; k++) {
      const d = randDir(R); if (c.bud && d.dot(V(...c.bud.d).normalize()) > .5) { k--; continue; }
      const sm = S.mesh(f7Scar, scarM, { parent: g, p: d.clone().multiplyScalar(f7Rad(d, rx, ry, rz) * 1.005), s: .16 * rm }); sm.quaternion.setFromUnitVectors(f7Z, d); P.scar.push(sm);
    }
    if (c.bud) {
      const d = V(...c.bud.d).normalize(), bud = S.mesh(G.sphere, wallM, { parent: g, ro: 8 }), neck = S.mesh(f7Scar, scarM, { parent: g }), bn = S.mesh(G.sphereLo, nucM, { parent: g });
      neck.quaternion.setFromUnitVectors(f7Z, d); P.bud.push(bud, neck, bn); buds.push({ bud, neck, bn, d, rx, ry, rz, rm, ph: c.bud.ph });
    }
  });
  const swing = [...root.children];
  S.anim(t => {
    root.rotation.y = Math.sin(t * .1) * .35; root.rotation.x = Math.sin(t * .07) * .12;
    swing.forEach((g, i) => { g.rotation.y += .0007 * (i + 1); });
    buds.forEach(b => {
      const ph = (t * .03 + b.ph) % 1, gr = sstep(0, .8, ph), away = sstep(.88, 1, ph), br = (.1 + .62 * gr) * b.rm * (1 - sstep(.95, 1, ph));
      const surf = f7Rad(b.d, b.rx, b.ry, b.rz);
      b.bud.scale.set(br * 1.05, br, br); b.bud.position.copy(b.d).multiplyScalar(surf + br * .8 + away * br * 1.6);
      const ns = br * .5 * sstep(.5, .75, ph) * (1 - away); b.bn.scale.setScalar(Math.max(ns, .0001)); b.bn.position.copy(b.bud.position);
      b.neck.position.copy(b.d).multiplyScalar(surf * 1.005); b.neck.scale.setScalar(Math.max(.0001, br * .5 * (1 - sstep(.84, .9, ph))));
    });
  });
  S.part('Cell wall', 'A rigid coat about 100–200 nm thick that protects the cell and sets its oval shape. The inner layer is mostly β-glucan with some chitin, and the outer layer is a fuzzy coat of mannoproteins. Enzymes can digest it away to leave a fragile, round protoplast.', P.wall, { shell: true });
  S.part('Growing bud', 'Yeast reproduces asexually by budding. A bud appears at one spot and enlarges as new membrane and wall are added there, while one copy of the divided nucleus moves into it. The bud finally separates at a narrow neck. In rich medium at about 30 °C a cycle takes roughly 90 minutes, and it is sped up in this view.', P.bud);
  S.part('Bud scars', 'A ring of chitin is left on the mother cell where each bud separated. A cell does not bud twice from the same site, so the number of scars counts the daughters it has made. A mother cell can make about 20–30 buds before it stops dividing.', P.scar);
  S.part('Nucleus and nucleolus', 'The nucleus holds the haploid genome: 16 chromosomes and about 12 million base pairs that code for roughly 6,000 genes. Yeast divides its nucleus without breaking the nuclear envelope. The darker nucleolus makes ribosomes.', P.nuc);
  S.part('Vacuole', 'A large acid-filled compartment that works like the lysosome of animal cells. It stores amino acids, ions and phosphate, breaks down worn-out proteins, and helps keep the cell’s pH and water balance stable. It breaks into small pieces when a bud forms.', P.vac);
  S.part('Mitochondria', 'In cells growing on glucose, yeast makes most of its energy by fermentation, so its mitochondria are few and small. On non-fermentable foods such as glycerol, they grow into a network and respire. They carry their own small genome of about 86,000 base pairs.', P.mito);
  S.part('Lipid droplets', 'Stores of fats (triacylglycerols and sterol esters) wrapped in a single layer of phospholipid. The cell uses them as a source of energy and as building material for new membranes.', P.lip);
}
NEWBUILD.yeast = buildYeast;
NEW_SPEC.push({ id: 'yeast', cat: 'fungi', name: 'Yeast', latin: 'Saccharomyces cerevisiae', size: 'cells about 5–10 µm', sizeUm: 7, umPerUnit: 3.6, U: 7, dist: 15,
  cls: 'Eukaryota · Fungi · Ascomycota · Saccharomycetes', habitat: 'Sugary surfaces such as fruit skins and tree sap; cultured for baking, brewing and winemaking', move: 'Non-motile; cells drift in liquid', feed: 'Heterotroph: ferments sugars to ethanol and carbon dioxide, and respires when oxygen is present', repro: 'Mostly asexual budding; haploid a and α cells can mate, and the diploid forms four spores in an ascus',
  desc: 'Oval single cells, several of them forming daughter buds. Yeast is a fungus that lives as a single cell, and it is the most widely used eukaryotic model organism.',
  fun: ['It was the first eukaryote to have its whole genome sequenced, in 1996.', 'Yoshinori Ohsumi won the 2016 Nobel Prize in Physiology or Medicine for discovering how yeast cells recycle their own parts (autophagy).', 'Many human genes can stand in for their yeast counterparts, which is why yeast helps study human disease.', 'Humans have used it to leaven bread and ferment beer and wine for thousands of years.'],
  note: 'Cell size and organelle layout follow typical cells, but the cluster, colours and organelle sizes are simplified. Budding is sped up and the bud-scar count is illustrative.' });

/* ---------- Candida albicans ---------- */
function buildCandida(S) {
  const R = rng(29), root = new THREE.Group(); S.add(root); root.position.set(-1.4, -1, 0);
  const wallM = M.shell(0xdcc07c, .68, { bumpScale: .3, roughness: .45 }), cytM = M.soft(0xdcc58a, { roughness: .5 }), nucM = M.soft(0xa9795a), vesM = M.emit(0xd98a4a, .25, { roughness: .35 }),
    sepM = M.soft(0xa4854c), chM = M.shell(0xcdb67e, .62, { bumpScale: .6 }), chIn = M.soft(0xe2cf98, { bumpMap: TEX.grain, bumpScale: .5 });
  const P = { yeast: [], bud: [], germ: [], hypha: [], pseudo: [], chlam: [], ves: [], sep: [] };
  /* budding yeast cells (blastoconidia) */
  const ycells = [{ p: [-2.6, -1.9, 0], r: [.78, .62, .62], b: [-.6, .7, .2], ph: .3 }, { p: [-3.6, -.6, .5], r: [.7, .56, .56], b: null }, { p: [-1.6, -.9, -.5], r: [.74, .6, .6], b: [.7, .5, 0], ph: .7 }];
  const ybuds = [];
  ycells.forEach(c => {
    const g = new THREE.Group(); g.position.set(...c.p); g.rotation.z = R() * 3; root.add(g);
    P.yeast.push(S.mesh(G.sphere, wallM, { parent: g, s: V(...c.r), ro: 8 })); P.yeast.push(S.mesh(G.sphere, nucM, { parent: g, p: V(.05, 0, 0), s: .22 }));
    if (c.b) { const bd = S.mesh(G.sphere, wallM, { parent: g, ro: 8 }); P.bud.push(bd); ybuds.push({ bd, d: V(...c.b).normalize(), r: c.r, ph: c.ph }); }
  });
  /* the cell that sends out a germ tube, then a true hypha with septa */
  const mother = new THREE.Group(); mother.position.set(-.4, 0, 0); root.add(mother);
  P.yeast.push(S.mesh(G.sphere, wallM, { parent: mother, s: V(.9, .7, .7), ro: 8 }));
  const hp = [V(.1, 0, 0), V(1.5, .2, .1), V(3, .9, .2), V(4.4, 1.1, .1), V(5.8, 1.9, -.1), V(7, 2.4, -.3)];
  const hy = f5Hypha(S, root, hp.map(v => v.clone().add(V(-.4, 0, 0))), .3, wallM, { septa: 1.45, s0: 1.45, sMat: sepM, ro: 8 });
  P.hypha.push(...hy.all); P.sep.push(...hy.sep);
  const germ = f5Hypha(S, root, [V(-.9, .9, 0), V(-1.1, 1.4, .1), V(-1.6, 2.1, .3)], .26, wallM, { ro: 8 }); const gy = new THREE.Group(); root.add(gy);
  P.germ.push(...germ.all);
  P.yeast.push(S.mesh(G.sphere, wallM, { parent: root, p: V(-.8, .5, 0), s: V(.7, .6, .6), ro: 8 }));
  /* pseudohypha: chain of elongated, constricted cells */
  const pc = new THREE.CatmullRomCurve3([V(-1.4, 2.8, .2), V(-.6, 3.6, 0), V(.5, 4.2, -.2), V(1.8, 4.5, -.4), V(3, 4.3, -.5)]);
  const pn = 5, pcells = [];
  for (let i = 0; i < pn; i++) { const u = (i + .5) / pn, p = pc.getPointAt(u), tg = pc.getTangentAt(u); const m = S.mesh(G.sphere, wallM, { parent: root, p, s: V(.34 - i * .015, .6, .34 - i * .015), ro: 8 }); m.quaternion.setFromUnitVectors(V(0, 1, 0), tg); P.pseudo.push(m); pcells.push(m); }
  /* thick-walled chlamydospore on a suspensor cell at the end of a side hypha */
  const side = f5Hypha(S, root, [V(3.4, 1, .2), V(3.9, -.2, .4), V(4.6, -1.3, .5), V(5.2, -2, .5)], .24, wallM, { septa: 1.0, s0: .9, sMat: sepM, ro: 8 });
  P.hypha.push(...side.all); P.sep.push(...side.sep);
  const ch = S.mesh(G.sphere, chM, { parent: root, p: V(5.95, -2.55, .5), s: .95, ro: 9 }), chi = S.mesh(G.sphere, chIn, { parent: root, p: V(5.95, -2.55, .5), s: .72 });
  P.chlam.push(ch, chi);
  /* secretory vesicles streaming to the hypha tip */
  const NV = 36, ves = inst(G.sphereLo, vesM, NV), vc = new THREE.CatmullRomCurve3(hp.map(v => v.clone().add(V(-.4, 0, 0))));
  const voff = Array.from({ length: NV }, () => R()), vperp = Array.from({ length: NV }, () => randDir(R).multiplyScalar(.12));
  root.add(ves); P.ves.push(ves);
  S.anim(t => {
    root.rotation.y = Math.sin(t * .12) * .3; root.rotation.x = Math.sin(t * .09) * .1;
    ybuds.forEach(b => { const ph = (t * .03 + b.ph) % 1, br = (.12 + .5 * sstep(0, .85, ph)) * (1 - sstep(.95, 1, ph)), r = f7Rad(b.d, ...b.r); b.bd.scale.set(br, br, br); b.bd.position.copy(b.d).multiplyScalar(r + br * .8); });
    for (let i = 0; i < NV; i++) { const u = (voff[i] + t * .05 * (.6 + (i % 5) * .15)) % 1; setI(ves, i, vc.getPointAt(u).add(vperp[i]), null, .05 + .07 * u); }
    ves.instanceMatrix.needsUpdate = true;
    pcells.forEach((m, i) => { m.scale.y = .6 + .03 * Math.sin(t * .6 + i); });
  });
  S.part('Yeast cells (blastoconidia)', 'Round to oval cells about 4–6 µm across that multiply by budding. In the body, this is the form that spreads through the bloodstream and lives as a harmless gut and skin resident.', P.yeast, { shell: true });
  S.part('Buds', 'Daughter cells growing from a mother yeast cell. Candida switches between this yeast form and the filament forms below in response to temperature, pH, CO₂ and nutrients, and this switch is called dimorphism.', P.bud);
  S.part('Germ tube', 'A short tube that grows from a yeast cell, with the same width all along and no narrowing at its base. Cells put out germ tubes within 1–2 hours at 37 °C in serum, and this is the first step in making a true hypha.', P.germ);
  S.part('True hypha with septa', 'A long, parallel-sided filament of about 2 µm width, divided by complete cross walls (septa). Hyphae let Candida push into tissue and are tied to its ability to cause disease.', [...P.hypha, ...P.sep]);
  S.part('Pseudohypha', 'A chain of elongated yeast-like cells that stay joined after budding, with a visible constriction at each joint. This form is wider and less regular than a true hypha.', P.pseudo);
  S.part('Chlamydospore', 'A large, round, thick-walled resting cell, often at the end of a suspensor cell on a hypha. It forms under poor conditions in culture, and its role in the body is not well understood.', P.chlam);
  S.part('Secretory vesicles', 'Small membrane packets that stream along the hypha and gather at the growing tip. They deliver the enzymes and wall material needed to extend the tip, so the filament grows only at its end.', P.ves);
}
NEWBUILD.candida = buildCandida;
NEW_SPEC.push({ id: 'candida', cat: 'fungi', name: 'Candida', latin: 'Candida albicans', size: 'yeast cells 4–6 µm; hyphae about 2 µm wide and tens of µm long', sizeUm: 5, umPerUnit: 3.4, U: 9, dist: 25,
  cls: 'Eukaryota · Fungi · Ascomycota · Saccharomycetes', habitat: 'Mouths, guts and skin of people and other warm-blooded animals', move: 'Non-motile; filaments extend at their tips', feed: 'Heterotroph: absorbs nutrients from the host or the surrounding medium', repro: 'Asexual budding and filament growth; a parasexual cycle exists and it has no known meiosis',
  desc: 'A dimorphic fungus drawn in several forms at once: budding yeast cells, a germ tube, a septate hypha, a pseudohypha and a thick-walled chlamydospore.',
  fun: ['It lives harmlessly in most people but can cause thrush and, in people with weakened immunity, serious bloodstream infections.', 'Its switch between yeast and filament forms is closely linked to its ability to invade tissue.', 'It grows in biofilms on medical devices, where the cells are hard to treat with drugs.', 'It is a diploid organism with eight pairs of chromosomes.'],
  note: 'The forms are shown together for comparison and are not usually all seen in one place. Cell and hypha widths follow typical values; hypha length is shortened. Colours are artistic.' });
