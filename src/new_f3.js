/* ================= F3: Streptococcus, Bacillus, Vibrio, Anabaena, Cyanobacteria colony, Archaea ================= */
const f3Xq = d => new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), d.clone().normalize());
const f3Nuc = (R, bx, by, bz, mat, n = 16, seg = 160, r = .012) => tubeCurve(loopCurve(R, n, V(bx, by, bz)), seg, 5, r, mat);
const f3Ell = (R, rx, ry, rz) => { for (;;) { const p = V((R() * 2 - 1) * rx, (R() * 2 - 1) * ry, (R() * 2 - 1) * rz); if ((p.x / rx) ** 2 + (p.y / ry) ** 2 + (p.z / rz) ** 2 <= 1) return p; } };
const f3DNA = () => M.emit(0x6a58a0, .3, { roughness: .4 });
const f3a = V(), f3b = V();

/* ---------- Streptococcus pyogenes ---------- */
function buildStrep(S) {
  const N = 10, sp = .92, rx = .5, ry = .42, R = rng(41);
  const wallM = M.shell(0xc9954f, .55, { bumpScale: .9 }), memM = M.shell(0xe9c9a2, .4, { bumpScale: .1 }), capM = M.shell(0xe8d3aa, .24, { bumpScale: 1.4, roughness: .5 });
  const nucM = f3DNA(), ribM = M.soft(0xd0723a), fibM = M.soft(0x7a5a3a), sepM = M.soft(0x8f5f28, { roughness: .6 });
  const nGeo = f3Nuc(R, .15, .11, .11, nucM, 16, 150).geometry;
  const pg = new THREE.CylinderGeometry(.006, .01, .34, 4); pg.translate(0, .17, 0);
  const fp = spherePts(20, rx * 1.02, ry * 1.02, ry * 1.02);
  const cells = [], walls = [], caps = [], mems = [], nucs = [], ribs = [], fibs = [], septa = [];
  const chain = new THREE.Group(); S.add(chain);
  for (let i = 0; i < N; i++) {
    const g = new THREE.Group(); chain.add(g); cells.push(g);
    const w = new THREE.Mesh(G.sphere, wallM); w.scale.set(rx, ry, ry); w.renderOrder = 9; g.add(w); walls.push(w);
    const c = new THREE.Mesh(G.sphere, capM); c.scale.set(rx * 1.2, ry * 1.25, ry * 1.25); c.renderOrder = 10; g.add(c); caps.push(c);
    const m = new THREE.Mesh(G.sphere, memM); m.scale.set(rx - .05, ry - .05, ry - .05); m.renderOrder = 7; g.add(m); mems.push(m);
    const nu = new THREE.Mesh(nGeo, nucM); nu.rotation.set(R() * 3, R() * 3, R() * 3); g.add(nu); nucs.push(nu);
    const rb = ribosomeCloud(26, r => f3Ell(r, rx * .8, ry * .8, ry * .8), ribM, .02, 100 + i); g.add(rb); ribs.push(rb);
    const fb = inst(pg, fibM, 20); fp.P.forEach((p, k) => setI(fb, k, p, qFromUp(fp.N[k]))); g.add(fb); fibs.push(fb);
    if (i < N - 1) { const s = new THREE.Mesh(G.cyl, sepM); s.scale.set(.3, .05, .3); chain.add(s); septa.push(s); }
  }
  S.part('Capsule (hyaluronic acid)', 'Group A streptococci wrap themselves in a loose capsule of hyaluronic acid, the same sugar polymer found in human connective tissue. Because the host sees it as "self", the capsule helps the bacterium avoid being engulfed by white blood cells.', caps, { shell: true });
  S.part('Cell wall (peptidoglycan)', 'A thick Gram-positive wall of cross-linked peptidoglycan. It carries the group A carbohydrate, a rhamnose polymer that defines Lancefield group A and is used to identify the species in the clinic.', walls, { shell: true });
  S.part('M protein fibrils', 'Hair-like M protein fibres anchored in the wall are the best known virulence factor of S. pyogenes. They bind host proteins such as fibrinogen and factor H, which blocks phagocytosis. They are drawn here as a sample of the many on each cell.', fibs);
  S.part('Cytoplasmic membrane', 'The lipid bilayer just inside the wall. It is the real permeability barrier of the cell and the site of the enzymes that build new wall at the division site.', mems, { shell: true });
  S.part('Division septum', 'Streptococci divide in one plane only, always perpendicular to the chain axis. A disc of new wall (the septum) grows inward and the daughter cells stay attached, which is why the cells form chains.', septa);
  S.part('Nucleoid', 'One circular chromosome of about 1.8 million base pairs, folded into a compact body with no nuclear envelope. It is much smaller than the E. coli genome.', nucs);
  S.part('Ribosomes', 'Bacterial 70S ribosomes read messenger RNA and build proteins, including the toxins and enzymes that let S. pyogenes spread through tissue.', ribs);
  const P = Array.from({ length: N }, () => V());
  S.anim(t => {
    for (let i = 0; i < N; i++) { const x = (i - (N - 1) / 2) * sp; P[i].set(x, .42 * Math.sin(t * .45) * (x * x / 21 - .55) + .1 * Math.sin(t * .9 + x * .7), .12 * Math.sin(t * .6 + x * .5)); }
    for (let i = 0; i < N; i++) { f3a.subVectors(P[Math.min(i + 1, N - 1)], P[Math.max(i - 1, 0)]); cells[i].position.copy(P[i]); cells[i].quaternion.copy(f3Xq(f3a)); }
    septa.forEach((s, i) => { f3b.subVectors(P[i + 1], P[i]); s.position.copy(P[i]).addScaledVector(f3b, .5); s.quaternion.copy(qFromUp(f3b)); });
  });
}
NEWBUILD.strep = buildStrep;
NEW_SPEC.push({ id: 'strep', cat: 'bact', name: 'Streptococcus', latin: 'Streptococcus pyogenes', size: 'cells 0.6–1 µm across; chains of 4 to 20 or more cells', sizeUm: 9, U: 9.4, dist: 17,
  cls: 'Bacteria · Bacillota · Bacilli · Lactobacillales', habitat: 'Throat and skin of humans, its only natural host', move: 'Non-motile; chains drift with the liquid around them', feed: 'Heterotroph: ferments sugars to lactic acid and tolerates oxygen', repro: 'Binary fission in a single plane, so daughter cells stay joined in chains',
  desc: 'A chain of round-to-oval cells, each wrapped in a soft capsule and bristling with M protein fibres. This species, group A Streptococcus, causes strep throat and scarlet fever.',
  fun: ['The name comes from the Greek for a twisted chain, which is how the cells look under a microscope.', 'On blood agar it destroys red cells around each colony (beta-haemolysis), a clue used to identify it.', 'Untreated infections can trigger rheumatic fever, but the bacterium is still sensitive to penicillin.'],
  note: 'A 10-cell chain is shown; real chains vary in length. Fibrils are thickened and drawn as a sample so they stay visible. Colours are artistic, since bacteria are nearly colourless under a light microscope. The chain flex is exaggerated.' });

/* ---------- Bacillus subtilis ---------- */
function buildBacillus(S) {
  const R = rng(52), r = .38, L = 2.0, sp = 2.72, X = V(1, 0, 0);
  const capG = new THREE.CapsuleGeometry(r, L, 12, 32); capG.rotateZ(Math.PI / 2);
  const capI = new THREE.CapsuleGeometry(r - .045, L, 12, 32); capI.rotateZ(Math.PI / 2);
  const wallM = M.shell(0xc4a066, .5, { bumpScale: .8 }), memM = M.shell(0xe6cfa6, .36, { bumpScale: .1 }), nucM = f3DNA(), ribM = M.soft(0xd0723a), sepM = M.soft(0x8f5f28, { roughness: .6 }), flM = M.soft(0x8e7550, { roughness: .45 });
  const chain = new THREE.Group(); S.add(chain);
  const walls = [], mems = [], nucs = [], ribs = [], septa = [], fls = [], flMesh = [];
  const sample = (spore) => rr => { for (;;) { const x = (rr() * 2 - 1) * (L / 2 + r * .6), y = (rr() * 2 - 1) * r * .82, z = (rr() * 2 - 1) * r * .82; if (spore && x > -.05) continue; if (Math.hypot(y, z) > r * .82) continue; if (Math.abs(x) > L / 2 && Math.hypot(Math.abs(x) - L / 2, y, z) > r * .82) continue; return V(x, y, z); } };
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(); g.position.x = (i - 1) * sp; chain.add(g);
    const w = new THREE.Mesh(capG, wallM); w.renderOrder = 9; g.add(w); walls.push(w);
    const m = new THREE.Mesh(capI, memM); m.renderOrder = 7; g.add(m); mems.push(m);
    const spore = i === 1;
    const nu = f3Nuc(R, spore ? .35 : .78, .13, .13, nucM, 18, 280, .013); if (spore) nu.position.x = -.62; g.add(nu); nucs.push(nu);
    const rb = ribosomeCloud(spore ? 55 : 95, sample(spore), ribM, .02, 200 + i); g.add(rb); ribs.push(rb);
    for (let k = 0; k < 5; k++) {
      const th = R() * TAU, x = (R() * 2 - 1) * L * .45, rad = V(0, Math.cos(th), Math.sin(th));
      const d = rad.clone().multiplyScalar(.7).addScaledVector(X, -.7).normalize(), f = new Flag(flM, { n: 70, rad: 6, r0: .03, r1: .022 });
      g.add(f.mesh); flMesh.push(f.mesh); fls.push({ f, o: V(x, 0, 0).addScaledVector(rad, r * 1.02), d, s: perpBasis(d), len: 2.2 + R() * .9, ph: R() * TAU });
    }
    if (i < 2) { const s = new THREE.Mesh(G.cyl, sepM); s.rotation.z = Math.PI / 2; s.scale.set(.32, .05, .32); s.position.x = (i - .5) * sp; chain.add(s); septa.push(s); }
  }
  const sg = new THREE.Group(); sg.position.set(.62, 0, 0); chain.add(sg); sg.position.x += sp * 0;
  const coat = new THREE.Mesh(G.sphere, M.shell(0x8b5a2b, .6, { bumpScale: 1.2 })); coat.scale.set(.64, .34, .34); coat.renderOrder = 10; sg.add(coat);
  const cortex = new THREE.Mesh(G.sphere, M.shell(0xdcb877, .5, { bumpScale: .1 })); cortex.scale.set(.54, .28, .28); cortex.renderOrder = 9; sg.add(cortex);
  const core = new THREE.Mesh(G.sphere, M.grain(0xe19a4a)); core.scale.set(.4, .2, .2); sg.add(core);
  const sdna = f3Nuc(R, .22, .1, .1, nucM, 10, 100, .01); sg.add(sdna);
  S.part('Cell wall (peptidoglycan)', 'A thick Gram-positive wall of peptidoglycan threaded with teichoic acids. It keeps the rod shape and withstands the high pressure inside the cell.', walls, { shell: true });
  S.part('Cytoplasmic membrane', 'The lipid bilayer under the wall. It carries the respiratory enzymes and the secretion machinery B. subtilis uses to export large amounts of enzymes.', mems, { shell: true });
  S.part('Division septum', 'Where one rod divides from the next, a disc of new wall grows inward. In chains the septa have formed but the cells have not yet separated.', septa);
  S.part('Nucleoid', 'A single circular chromosome of about 4.2 million base pairs. In the cell making a spore, one copy is pulled into the forespore and the other stays in the mother cell.', nucs);
  S.part('Ribosomes', 'Bacterial 70S ribosomes translate genes into protein. A dividing B. subtilis cell may hold tens of thousands.', ribs);
  S.part('Peritrichous flagella', 'Flagella arise all over the cell surface. Each is turned by a rotary motor in the envelope, and when the motors turn together the flagella bundle and push the cell forward. They can also drive swarming over surfaces.', flMesh);
  S.part('Endospore core', 'The core holds the chromosome in a dehydrated, glassy state packed with dipicolinic acid and calcium. Metabolism is essentially stopped, so the core can wait years for food to return.', [core, sdna]);
  S.part('Spore cortex', 'A thick layer of modified peptidoglycan with fewer cross-links surrounds the core. It helps keep the core dry, which is the key to heat resistance.', cortex, { shell: true });
  S.part('Spore coat', 'Layers of protein form the outer coat. It shields the spore from chemicals and digestive enzymes, and it senses nutrients so the spore knows when to germinate.', coat, { shell: true });
  S.anim(t => {
    const tt = t % 30, s = lerp(.7, 1, sstep(0, 10, tt)) * lerp(1, .7 / 1, sstep(26, 30, tt)); sg.scale.setScalar(s); sg.position.x = .62 + (1 - s) * .1;
    chain.rotation.y = .25 * Math.sin(t * .2); chain.rotation.z = .05 * Math.sin(t * .35);
    fls.forEach(o => o.f.helix(o.o, o.d, o.s, o.len, .12, .85, -t * 9 + o.ph, .3));
  });
}
NEWBUILD.bacillus = buildBacillus;
NEW_SPEC.push({ id: 'bacillus', cat: 'bact', name: 'Bacillus subtilis', latin: 'Bacillus subtilis', size: 'rods about 0.7 µm wide and 2–3 µm long; endospore about 1 µm', sizeUm: 8, U: 8.4, dist: 15,
  cls: 'Bacteria · Bacillota · Bacilli · Bacillales', habitat: 'Soil, plant roots and the gut of animals', move: 'Swims with flagella spread over the whole surface; also swarms across moist surfaces', feed: 'Heterotroph: releases enzymes that digest organic matter, mostly using oxygen', repro: 'Binary fission; under starvation a cell makes an endospore, a survival form rather than a way to multiply',
  desc: 'A chain of three soil rods. The middle cell is forming an endospore: a tough, dormant body built in layers of core, cortex and coat, ready to outlast heat, drying and disinfectants.',
  fun: ['It is the best studied Gram-positive bacterium and a main model for how cells specialise and differentiate.', 'Natto, the Japanese fermented soybean dish, is made with a strain of B. subtilis.', 'Endospores resist boiling for a time, drying, UV light and many disinfectants and can stay dormant for years.', 'The cell can take up DNA from its surroundings, a trait called natural competence.'],
  note: 'Real sporulation takes about 8 hours; the spore here grows and relaxes on a 30-second loop for display. Only one cell is shown sporulating; flagella are drawn at full length but with fewer per cell than a real rod (about 20). Colours are artistic.' });

/* ---------- Vibrio cholerae ---------- */
function buildVibrio(S) {
  const Rc = 2.1, ph = .62, R = rng(63), r0 = .29;
  const Pt = th => V(Rc * Math.sin(th), Rc * Math.cos(th) - Rc, 0), Tn = th => V(Math.cos(th), -Math.sin(th), 0), Nm = th => V(Math.sin(th), Math.cos(th), 0);
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: 25 }, (_, i) => Pt(-ph + 2 * ph * i / 24)));
  const prof = k => Math.pow(Math.sin(Math.PI * clamp(k, 0, 1)), .32);
  const root = new THREE.Group(); root.position.set(1.5, 1.2, 0); S.add(root);
  const cell = new THREE.Group(); root.add(cell);
  const om = tubeCurve(curve, 72, 28, s => r0 * prof(s), M.shell(0xd8a566, .5, { bumpScale: .7 })); om.renderOrder = 9; cell.add(om);
  const pgl = tubeCurve(curve, 72, 24, s => (r0 - .03) * prof(s), M.shell(0xeed39a, .32, { bumpScale: .1 })); pgl.renderOrder = 8; cell.add(pgl);
  const im = tubeCurve(curve, 72, 24, s => (r0 - .06) * prof(s), M.shell(0xcfe0a8, .3, { bumpScale: .1 })); im.renderOrder = 7; cell.add(im);
  const c1 = new THREE.Group(); cell.add(c1); c1.add(f3Nuc(R, .62, .1, .1, M.emit(0x6a58a0, .3, { roughness: .4 }), 18, 300, .012));
  const c2 = new THREE.Group(); c2.position.copy(Pt(.42)); c2.rotation.z = -.42; cell.add(c2); c2.add(f3Nuc(R, .24, .08, .08, M.emit(0xb2623a, .3, { roughness: .4 }), 12, 160, .012));
  const rib = ribosomeCloud(120, rr => { const th = -ph + .15 + rr() * (2 * ph - .3), rho = Math.sqrt(rr()) * .17, a = rr() * TAU; return Pt(th).addScaledVector(Nm(th), rho * Math.cos(a)).add(V(0, 0, rho * Math.sin(a))); }, M.soft(0xd0723a), .02, 7); cell.add(rib);
  const E = Pt(-ph), dir = Tn(-ph).negate(), fl = new Flag(M.soft(0xb07a48, { roughness: .4 }), { n: 100, rad: 8, r0: .06, r1: .045 }), side = perpBasis(dir);
  cell.add(fl.mesh);
  const pg2 = new THREE.CylinderGeometry(.008, .012, .5, 4); pg2.translate(0, .25, 0); const NPI = 22, pil = inst(pg2, M.soft(0x8a6a4c), NPI);
  for (let i = 0; i < NPI; i++) { const pole = i < 16, T0 = pole ? dir : Tn(ph), base = pole ? E : Pt(ph), d = T0.clone().multiplyScalar(.75).add(randDir(R).multiplyScalar(.5)).normalize(); setI(pil, i, base.clone().addScaledVector(d, .04), qFromUp(d)); }
  cell.add(pil);
  S.part('Outer membrane', 'The outer layer of this Gram-negative bacterium, a second bilayer rich in lipopolysaccharide. It is also where the cell sheds membrane vesicles. The comma shape depends on a periplasmic protein, CrvA.', om, { shell: true });
  S.part('Peptidoglycan wall', 'A thin layer of cross-linked sugar chains in the periplasm. It gives the cell its strength and its curved rod shape.', pgl, { shell: true });
  S.part('Inner membrane', 'The cytoplasmic membrane, where energy is made. V. cholerae uses a sodium gradient to drive its flagellar motor, which is why it needs salt to thrive.', im, { shell: true });
  S.part('Two chromosomes', 'Unusually for a bacterium, V. cholerae has two circular chromosomes: a large one of about 3 million base pairs (purple) and a smaller one of about 1 million (rust). Genes for cell survival lie mostly on the large one.', [c1, c2]);
  S.part('Ribosomes', 'Bacterial 70S ribosomes build the proteins of the cell, including cholera toxin once the bacteria colonise the intestine.', rib);
  S.part('Sheathed polar flagellum', 'A single flagellum at one pole, covered by a sheath that is continuous with the outer membrane. Its motor can spin at over 1,000 revolutions a second, one of the fastest in bacteria, driving swimming of up to about 100 µm per second.', fl.mesh);
  S.part('Pili', 'Short filaments near the pole. Toxin-coregulated pili help the cells stick together in the gut and act as the receptor for the virus that carries the cholera toxin genes. Other pili attach the cell to chitin surfaces.', pil);
  S.anim(t => { cell.rotation.x = t * 1.6; cell.rotation.z = Math.sin(t * .7) * .06; fl.helix(E, dir, side, 4.0, .22, 1.25, -t * 14, .25); });
}
NEWBUILD.vibrio = buildVibrio;
NEW_SPEC.push({ id: 'vibrio', cat: 'bact', name: 'Vibrio cholerae', latin: 'Vibrio cholerae', size: 'curved rod 1.5–3 µm long, about 0.5 µm wide', sizeUm: 2.5, U: 2.6, dist: 11,
  cls: 'Bacteria · Pseudomonadota · Gammaproteobacteria · Vibrionales', habitat: 'Brackish coastal water and estuaries, often on chitin-rich plankton; the human small intestine when it infects', move: 'Fast swimming by one sheathed polar flagellum, turning like a corkscrew', feed: 'Heterotroph: digests chitin and other organic matter; grows with or without oxygen', repro: 'Binary fission; can double in about 20–30 minutes under good conditions',
  desc: 'A comma-shaped rod pushed by a single polar flagellum. This is the bacterium that causes cholera, an intestinal disease spread by contaminated water.',
  fun: ['Cholera toxin makes the intestine release huge volumes of water, producing watery "rice-water" diarrhoea. Rehydration therapy saves most patients.', 'The toxin genes are carried by a bacteriophage that infects the cell; the cell without the virus is harmless.', 'It has two chromosomes, an unusual arrangement for a bacterium.', 'It sticks to the chitin shells of copepods, which helps it persist in water.'],
  note: 'The flagellum is shown at about full length relative to the cell. The spin of the body is a display of motion and runs slower than the real cell. Pili are a sample. Colours are artistic.' });

/* ---------- Anabaena ---------- */
function buildAnabaena(S) {
  const R = rng(73), types = ['v', 'v', 'v', 'v', 'h', 'a', 'v', 'v', 'v', 'v', 'v', 'h', 'v', 'v', 'v'], N = types.length;
  const Wd = { v: 1.05, h: 1.2, a: 1.75 }, wid = types.map(k => Wd[k]), total = wid.reduce((a, b) => a + b, 0), us = []; let acc = 0; wid.forEach(w => { us.push((acc + w / 2) / total); acc += w; });
  const base = [[-6.5, .8, -.6], [-4.3, -.6, .9], [-2, .7, -.5], [.3, -.5, .7], [2.5, .6, -.7], [4.6, -.5, .6], [6.6, .5, -.4]].map(p => V(...p));
  const curve = new THREE.CatmullRomCurve3(base.map(p => p.clone()), false, 'catmullrom', .5);
  const sc = total / curve.getLength(); base.forEach(p => p.multiplyScalar(sc)); curve.points.forEach((p, i) => p.copy(base[i])); curve.updateArcLengths();
  const vm = M.shell(0x49a08a, .5, { bumpScale: .5 }), thM = M.shell(0x2a7d63, .36, { bumpScale: .1 }), nucM = f3DNA(), cxM = M.soft(0x1f5f48), gvM = M.soft(0xf3efd2, { roughness: .5 });
  const gvG = new THREE.CapsuleGeometry(.022, .1, 4, 8), cxG = new THREE.IcosahedronGeometry(.055, 1), cells = [];
  const vW = [], vT = [], vGV = [], vCX = [], vN = [], hE = [], hC = [], hNod = [], aW = [], aG = [];
  types.forEach((k, i) => {
    const g = new THREE.Group(); S.add(g); cells.push(g);
    if (k === 'v') {
      const w = new THREE.Mesh(G.sphere, vm); w.scale.set(.54, .5, .5); w.renderOrder = 9; g.add(w); vW.push(w);
      [.86, .72, .58].forEach((q, j) => { const t = new THREE.Mesh(G.sphere, thM); t.scale.set(.5 * q * 1.04, .46 * q, .46 * q); t.renderOrder = 7 - j; g.add(t); vT.push(t); });
      const nu = f3Nuc(R, .13, .1, .1, nucM, 14, 120, .01); g.add(nu); vN.push(nu);
      const gv = inst(gvG, gvM, 16); for (let j = 0; j < 16; j++) { const p = f3Ell(R, .34, .3, .3), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 3, R() * 3, R() * 3)); setI(gv, j, p, q); } g.add(gv); vGV.push(gv);
      const cx = inst(cxG, cxM, 3); for (let j = 0; j < 3; j++) setI(cx, j, f3Ell(R, .3, .26, .26), null); g.add(cx); vCX.push(cx);
    } else if (k === 'h') {
      const e1 = new THREE.Mesh(G.sphere, M.shell(0xcdb66b, .55, { bumpScale: .9 })); e1.scale.set(.62, .6, .6); e1.renderOrder = 10; g.add(e1); hE.push(e1);
      const e2 = new THREE.Mesh(G.sphere, M.shell(0xb59a47, .5, { bumpScale: .3 })); e2.scale.set(.57, .55, .55); e2.renderOrder = 9; g.add(e2); hE.push(e2);
      const c = new THREE.Mesh(G.sphere, M.soft(0xdde39a, { transparent: true, opacity: .85 })); c.scale.set(.5, .48, .48); g.add(c); hC.push(c);
      [-1, 1].forEach(s => { const n = new THREE.Mesh(G.sphere, M.soft(0xf0e2a8)); n.scale.setScalar(.11); n.position.x = s * .56; g.add(n); hNod.push(n); });
    } else {
      const w = new THREE.Mesh(G.sphere, M.shell(0x9c6e33, .68, { bumpScale: 1.2 })); w.scale.set(.85, .58, .58); w.renderOrder = 10; g.add(w); aW.push(w);
      const m = new THREE.Mesh(G.sphere, M.shell(0xc89a58, .4, { bumpScale: .1 })); m.scale.set(.78, .5, .5); m.renderOrder = 8; g.add(m); aW.push(m);
      const gr = inst(G.sphereLo, M.soft(0xe2b564), 60); for (let j = 0; j < 60; j++) setI(gr, j, f3Ell(R, .7, .4, .4), null, .035 + R() * .015); g.add(gr); aG.push(gr);
    }
  });
  const sheath = new Tube(90, 12, M.shell(0xbad49a, .17, { bumpScale: .5, roughness: .5 })); sheath.mesh.renderOrder = 12; S.add(sheath.mesh);
  S.part('Vegetative cell wall', 'Ordinary photosynthetic cells are barrel shaped. Like all cyanobacteria they have a Gram-negative envelope with an outer membrane. Neighbouring cells stay joined by narrow channels that let them share nutrients along the filament.', vW, { shell: true });
  S.part('Thylakoid membranes', 'Stacks of internal membranes carry chlorophyll a and phycobilisomes, the blue-green pigments that give cyanobacteria their colour. This is where light energy is captured and oxygen is released.', vT, { shell: true });
  S.part('Gas vesicles', 'Hollow protein tubes filled with gas make the filament buoyant. By gaining or losing them, planktonic Anabaena can float up to the light or sink away from it.', vGV);
  S.part('Carboxysomes', 'Polyhedral protein shells packed with the enzyme RuBisCO. They concentrate carbon dioxide so the cell fixes carbon efficiently.', vCX);
  S.part('Nucleoid', 'The circular chromosome, with several copies per cell, lies in the centre of each cell among the thylakoids.', vN);
  S.part('Heterocyst', 'A cell specialised for nitrogen fixation. Its thick envelope of glycolipid and polysaccharide layers keeps oxygen out so the enzyme nitrogenase can work. It has no photosystem II and cannot make oxygen, and it is supplied with sugars by its neighbours.', [...hE, ...hC], { shell: true });
  S.part('Polar nodules (cyanophycin)', 'Plugs of cyanophycin, a nitrogen storage polymer, sit at the poles where the heterocyst meets its neighbours. Fixed nitrogen leaves as amino acids and moves along the filament.', hNod);
  S.part('Akinete', 'A larger, thick-walled resting cell packed with food reserves. When conditions turn cold or dark, akinetes survive in the sediment and later germinate to start new filaments. They often form next to a heterocyst.', aW.concat(aG), { shell: true });
  S.part('Mucilaginous sheath', 'A loose gel of polysaccharide surrounds the filament. It protects the cells and helps filaments stick together in a colony.', sheath.mesh, { shell: true });
  const q = new THREE.Quaternion();
  S.anim(t => {
    curve.points.forEach((p, k) => p.set(base[k].x, base[k].y + .35 * Math.sin(t * .5 + k * 1.1), base[k].z + .3 * Math.sin(t * .4 + k * .9))); curve.updateArcLengths();
    cells.forEach((g, i) => { g.position.copy(curve.getPointAt(us[i])); q.copy(f3Xq(curve.getTangentAt(us[i]))); g.quaternion.copy(q); });
    sheath.update(curve.getPoints(90), () => .72);
  });
}
NEWBUILD.anabaena = buildAnabaena;
NEW_SPEC.push({ id: 'anabaena', cat: 'bact', name: 'Anabaena', latin: 'Anabaena sp.', size: 'cells 3–6 µm across; filaments from tens of µm to several mm', sizeUm: 72, U: 16.8, dist: 26,
  cls: 'Bacteria · Cyanobacteriota · Nostocales', habitat: 'Freshwater lakes and ponds, rice paddies and wet soil; some live inside the water fern Azolla', move: 'Filaments drift; planktonic forms regulate buoyancy with gas vesicles, and short filament pieces called hormogonia glide', feed: 'Photoautotroph: oxygenic photosynthesis, plus it fixes nitrogen gas into ammonia', repro: 'Binary fission along the filament; filaments break into pieces; akinetes germinate into new filaments',
  desc: 'A beaded filament of blue-green cells with a few specialised cells: pale heterocysts that fix nitrogen and a large, thick-walled akinete that rests through hard times.',
  fun: ['One filament holds three cell types, which makes it a simple model of multicellular organisation among bacteria.', 'Heterocysts appear in a regular pattern, roughly one cell in every ten to fifteen, when combined nitrogen runs short.', 'In Asia, Anabaena living with Azolla has long been used to fertilise rice paddies.', 'Some species can form toxic blooms in lakes.'],
  note: 'A 15-cell filament is shown; real filaments are much longer. Cell colours are artistic. Cell sizes and numbers of gas vesicles, carboxysomes and thylakoids are reduced and simplified for visibility.' });

/* ---------- Cyanobacteria colony (Microcystis) ---------- */
function buildCyano(S) {
  const R = rng(81), NC = 56, rc = .5, R0 = 2.7, D = V(.45, .2, .87).normalize(), fr = 1.2, fc = D.clone().multiplyScalar(R0 - .3);
  let pos = []; while (pos.length < NC) pos.push(randInBall(R).multiplyScalar(R0 - .35));
  for (let it = 0; it < 260; it++) { for (let i = 0; i < NC; i++) { for (let j = i + 1; j < NC; j++) { const d = pos[i].clone().sub(pos[j]), Ln = d.length(); if (Ln < 1 && Ln > 1e-4) { d.multiplyScalar((1 - Ln) * .5 / Ln); pos[i].add(d); pos[j].sub(d); } } if (pos[i].length() > R0 - .35) pos[i].setLength(R0 - .35); } }
  pos = pos.filter(p => p.distanceTo(fc) > fr + rc - .15);
  const n = pos.length, colony = new THREE.Group(); S.add(colony);
  const iW = inst(G.sphereMid, M.shell(0x58a98a, .55, { bumpScale: .6 }), n), iT = inst(G.sphereMid, M.shell(0x2f7a5f, .5, { bumpScale: .1 }), n), iG = inst(new THREE.CapsuleGeometry(.03, .14, 4, 8), M.soft(0xf3efd2, { roughness: .5 }), n * 6);
  const qq = new THREE.Quaternion(), ee = new THREE.Euler();
  pos.forEach((p, i) => { setI(iW, i, p, null, rc); setI(iT, i, p, null, rc * .76); for (let k = 0; k < 6; k++) { ee.set(R() * 3, R() * 3, R() * 3); qq.setFromEuler(ee); setI(iG, i * 6 + k, p.clone().add(f3Ell(R, .26, .26, .26)), qq); } });
  iW.renderOrder = 9; iT.renderOrder = 7; colony.add(iW, iT, iG);
  const env = new THREE.SphereGeometry(1, 72, 48), ep = env.attributes.position, tp = V();
  for (let i = 0; i < ep.count; i++) { tp.fromBufferAttribute(ep, i); const nz = fbm(tp.x * 1.6, tp.y * 1.6, tp.z * 1.6); tp.setLength(R0 + .85 + nz * .35); ep.setXYZ(i, tp.x, tp.y, tp.z); } env.computeVertexNormals();
  const envM = S.mesh(env, M.shell(0xb7cf9a, .2, { bumpScale: .6, roughness: .45 }), { parent: colony, ro: 12 });
  const feat = new THREE.Group(); feat.position.copy(fc); feat.quaternion.copy(qFromUp(D)); colony.add(feat);
  const th0 = 1.05, cap = (rad, mat, ro) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 56, 40, 0, TAU, th0, Math.PI - th0), mat); m.renderOrder = ro; feat.add(m); return m; };
  const fW = cap(fr, M.shell(0x58a98a, .55, { bumpScale: .6 }), 9), fT = [cap(fr * .87, M.shell(0x2f7d62, .42, { bumpScale: .1 }), 8), cap(fr * .74, M.shell(0x2f7d62, .42, { bumpScale: .1 }), 7), cap(fr * .61, M.shell(0x2f7d62, .42, { bumpScale: .1 }), 6)];
  const away = rr => { const d = randDir(rr); if (d.y > .25) d.y = -d.y; return d; };
  const fCX = inst(new THREE.IcosahedronGeometry(.1, 1), M.soft(0x1f5f48), 8); for (let i = 0; i < 8; i++) setI(fCX, i, away(R).multiplyScalar(.3 + R() * .3), null);
  const fGV = inst(new THREE.CapsuleGeometry(.035, .2, 4, 8), M.soft(0xf3efd2, { roughness: .5 }), 40); for (let i = 0; i < 40; i++) { ee.set(R() * 3, R() * 3, R() * 3); qq.setFromEuler(ee); setI(fGV, i, away(R).multiplyScalar(.25 + R() * .4), qq); }
  const fR = ribosomeCloud(140, rr => away(rr).multiplyScalar(Math.cbrt(rr()) * .55), M.soft(0xd0723a), .02, 5);
  const fN = f3Nuc(R, .22, .18, .18, f3DNA(), 14, 160, .012); fN.position.y = -.12; feat.add(fCX, fGV, fR, fN);
  S.part('Mucilage envelope', 'Microcystis cells live inside a shared envelope of polysaccharide slime. It holds the colony together, protects it from grazers and from drying, and keeps it afloat in surface scums.', envM, { shell: true });
  S.part('Cell envelope', 'Each cell has a Gram-negative envelope: an outer membrane, a thin peptidoglycan wall and an inner membrane. Cells divide in several planes, so they pile up into a ball rather than a chain.', [iW, fW], { shell: true });
  S.part('Thylakoid membranes', 'Sheets of internal membrane, drawn as concentric shells in the cut-open cell, hold chlorophyll a and phycocyanin. They capture light and release oxygen, as chloroplasts do in plants.', [iT, ...fT], { shell: true });
  S.part('Gas vesicles', 'Hollow protein tubes full of gas give the cell buoyancy. Colonies rise to the surface in sunlight and sink when the cell fills with heavy carbohydrate, which lets a bloom move up and down in the water.', [iG, fGV]);
  S.part('Carboxysomes', 'Protein-shelled bodies packed with RuBisCO. They raise carbon dioxide levels around the enzyme and make carbon fixation more efficient.', fCX);
  S.part('Nucleoid', 'The circular chromosome of about 5 million base pairs sits among the thylakoids. A cyanobacterial cell usually holds several copies.', fN);
  S.part('Ribosomes', 'Bacterial 70S ribosomes translate genes into proteins, including the enzymes of photosynthesis and, in toxic strains, the toxin microcystin.', fR);
  S.anim(t => { colony.rotation.y = t * .08; colony.position.y = Math.sin(t * .5) * .12; });
}
NEWBUILD.cyano = buildCyano;
NEW_SPEC.push({ id: 'cyano', cat: 'bact', name: 'Cyanobacteria', latin: 'Microcystis aeruginosa (colony)', size: 'cells 3–7 µm; colonies from about 30 µm to over 1 mm', sizeUm: 33, U: 6.6, dist: 15,
  cls: 'Bacteria · Cyanobacteriota · Chroococcales', habitat: 'Warm, nutrient-rich freshwater lakes and reservoirs, where it forms surface blooms', move: 'Non-motile; colonies float and sink by changing their gas vesicles and stored carbohydrate', feed: 'Photoautotroph: oxygenic photosynthesis using chlorophyll a and phycocyanin', repro: 'Binary fission; the colony grows as cells divide in several planes',
  desc: 'A ball of round cells held in a shared slime envelope, with one cell shown larger and cut open to reveal its photosynthetic membranes, carboxysomes and gas vesicles.',
  fun: ['Cyanobacteria invented oxygen-producing photosynthesis and helped raise oxygen in the air about 2.4 billion years ago.', 'Chloroplasts in plants and algae descend from cyanobacteria that were taken in by an ancient cell.', 'Some Microcystis strains make microcystin, a toxin that harms the liver of animals, so blooms can make water unsafe.'],
  note: 'One cell is drawn about 2.4 times larger than the rest and cut open so the inside can be seen; its window faces outward and turns with the colony. A real colony has far more cells. Colours are artistic; gas vesicles and carboxysomes are fewer than in life.' });

/* ---------- Archaea (Sulfolobus acidocaldarius) ---------- */
function buildArchaea(S) {
  const R = rng(91), hexTex = srgb => { const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = srgb ? '#e9b98c' : '#404040'; g.fillRect(0, 0, w, h); const d = 16, rows = 18, rowH = h / rows;
    for (let row = 0; row < rows + 1; row++) for (let col = 0; col < w / d + 1; col++) { const x = col * d + (row % 2) * d / 2, y = row * rowH, gr = g.createRadialGradient(x, y, 0, x, y, d * .52); gr.addColorStop(0, srgb ? '#a95f34' : '#ffffff'); gr.addColorStop(1, srgb ? '#e9b98c' : '#404040'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, d * .52, 0, TAU); g.fill(); }
  }, srgb); t.repeat.set(6, 3); return t; };
  const geoO = new THREE.SphereGeometry(1, 72, 48), geoM = new THREE.SphereGeometry(1, 48, 32), bO = geoO.attributes.position.array.slice(), bM = geoM.attributes.position.array.slice();
  const lobes = [V(1, .2, 0), V(-.5, .9, .3), V(.1, -.8, .6), V(-.7, -.2, -.8), V(.5, .4, -.9), V(-.2, .1, 1)].map(v => v.normalize()), L = lobes.map(v => v.clone()), amp = [0, 0, 0, 0, 0, 0];
  const rAt = (x, y, z) => { let r = .8; for (let j = 0; j < 6; j++) { const l = L[j]; r += amp[j] * Math.exp(-4 * (1 - (x * l.x + y * l.y + z * l.z))); } return r; };
  const deform = (geo, b, k) => { const p = geo.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const r = rAt(b[i], b[i + 1], b[i + 2]) * k; p[i] = b[i] * r; p[i + 1] = b[i + 1] * r; p[i + 2] = b[i + 2] * r; } geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); };
  const slayer = S.mesh(geoO, M.shell(0xffffff, .62, { map: hexTex(true), bumpMap: hexTex(false), bumpScale: 3, roughness: .5 }), { ro: 10 }); slayer.frustumCulled = false;
  const mem = S.mesh(geoM, M.shell(0xf0c9a0, .42, { bumpScale: .1 }), { ro: 7 }); mem.frustumCulled = false;
  const nuc = f3Nuc(R, .34, .28, .28, f3DNA(), 18, 260, .016); S.add(nuc);
  const rib = ribosomeCloud(150, rr => randInBall(rr).multiplyScalar(.58), M.soft(0xd0723a), .024, 11); S.add(rib);
  const d0 = V(-1, .1, .2).normalize(), side = perpBasis(d0), fl = new Flag(M.soft(0x8f6a45, { roughness: .4 }), { n: 70, rad: 6, r0: .035, r1: .028 }); S.add(fl.mesh);
  const pg = new THREE.CylinderGeometry(.01, .014, .55, 4); pg.translate(0, .275, 0); const NP = 14, pil = inst(pg, M.soft(0x8a6a4c), NP), pd = fib(NP).map(d => d.addScaledVector(V(.3, 0, 0), 0).normalize()); S.add(pil);
  S.part('S-layer', 'The outer surface is a regular lattice of protein subunits that forms the cell wall. Archaea have no peptidoglycan. The lattice, drawn here as a hexagonal pattern, gives the cell its shape and protects it from heat and acid.', slayer, { shell: true });
  S.part('Cell membrane (ether lipids)', 'Archaeal membranes use lipids with ether bonds and branched chains. In Sulfolobus many of them span the whole membrane as a tough monolayer, a design that stays stable at about 75 °C and pH 2–3.', mem, { shell: true });
  S.part('Nucleoid', 'A single circular chromosome of about 2.2 million base pairs. Sulfolobus packs its DNA with small proteins such as Sul7d and Alba, not histones, though some other archaea do use histones.', nuc);
  S.part('Ribosomes', 'Archaeal ribosomes are about the size of bacterial ones, but their components and the way they start translation are closer to those of eukaryotes.', rib);
  S.part('Archaellum', 'A rotating filament used for swimming. It resembles a bacterial flagellum from the outside but is built from different proteins and is powered by ATP, not by an ion gradient. It is related to type IV pili.', fl.mesh);
  S.part('Pili', 'Thin filaments for sticking to surfaces and to other cells. UV light triggers pili that pull Sulfolobus cells together, so they can swap DNA to repair damage.', pil);
  const q = new THREE.Quaternion(), pp = V();
  S.anim(t => {
    for (let j = 0; j < 6; j++) { L[j].copy(lobes[j]).applyAxisAngle(UP, t * .08); amp[j] = .3 + .12 * Math.sin(t * .5 + j * 1.3); }
    deform(geoO, bO, 1); deform(geoM, bM, .93);
    const r = rAt(d0.x, d0.y, d0.z); pp.copy(d0).multiplyScalar(r * .98); fl.helix(pp, d0, side, 2.6, .15, .8, -t * 6, .3);
    pd.forEach((d, i) => { setI(pil, i, pp.copy(d).multiplyScalar(rAt(d.x, d.y, d.z) * .98), q.setFromUnitVectors(UP, d)); }); pil.instanceMatrix.needsUpdate = true;
  });
}
NEWBUILD.archaea = buildArchaea;
NEW_SPEC.push({ id: 'archaea', cat: 'other', name: 'Archaea', latin: 'Sulfolobus acidocaldarius', size: 'irregular lobed cells about 0.8–1.2 µm across', sizeUm: 1.2, U: 2.4, dist: 9,
  cls: 'Archaea · Thermoproteota · Sulfolobales', habitat: 'Hot, acidic springs and mud pots, at about 75–80 °C and pH 2–3', move: 'Swims slowly with an archaellum; sticks to surfaces with pili', feed: 'Aerobic heterotroph: grows on sugars and amino acids; some Sulfolobus species also oxidise sulfur', repro: 'Binary fission using an ESCRT-III-like division machinery (Cdv proteins)',
  desc: 'A lobed, spherical cell wrapped in a hexagonal protein lattice. Archaea look like bacteria but form their own domain of life, and many live in extreme places such as hot acidic springs.',
  fun: ['It was first isolated in 1972 from a hot spring in Yellowstone National Park.', 'Carl Woese and George Fox proposed in 1977 that archaea are a third domain of life, separate from bacteria and eukaryotes.', 'Its division machinery is related to the ESCRT system that eukaryotic cells use to pinch membranes.', 'Its enzymes work at heat and acidity that would destroy most proteins, which makes them useful in biotechnology.'],
  note: 'The slow lobed shape change is a stylised movement; real cells change shape little. The S-layer pattern is schematic and the cell is shown at an exaggerated lobe size. Pili and the archaellum are drawn as a sample. Colours are artistic.' });
