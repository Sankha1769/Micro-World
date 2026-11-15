/* ================= E. COLI ================= */
function loopCurve(R, n, box, closed = true) { const pts = []; for (let i = 0; i < n; i++) pts.push(V((R() * 2 - 1) * box.x, (R() * 2 - 1) * box.y, (R() * 2 - 1) * box.z)); return new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', .5); }
function buildEcoli(S) {
  const R = rng(2), cell = new THREE.Group(); cell.rotation.z = Math.PI / 2; S.add(cell);
  const spin = new THREE.Group(); cell.add(spin);
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 14, 36);
  const om = S.mesh(cap(.5, 1.4), M.shell(0xd3b98f, .2, { iridescence: .35, iridescenceIOR: 1.3, bumpScale: .9 }), { parent: spin, ro: 9 });
  S.part('Outer membrane', 'The outer layer of this Gram-negative bacterium. It is a second lipid bilayer studded with porins and coated in lipopolysaccharide, which blocks many antibiotics and detergents.', om, { shell: true });
  const pg = S.mesh(cap(.46, 1.4), M.shell(0xe9d48a, .3, { bumpScale: .15 }), { parent: spin, ro: 8 });
  S.part('Peptidoglycan wall', 'A thin mesh of sugar chains cross-linked by short peptides sits in the gap (periplasm) between the membranes. It is the rigid layer that keeps the rod shape and resists internal pressure.', pg, { shell: true });
  const im = S.mesh(cap(.42, 1.4), M.shell(0xb7c98a, .22, { bumpScale: .2 }), { parent: spin, ro: 7 });
  S.part('Inner membrane', 'The cytoplasmic membrane is the real permeability barrier. It carries the respiratory chain and ATP synthase that make energy, since bacteria have no mitochondria.', im, { shell: true });
  const nuc = tubeCurve(loopCurve(R, 44, V(.2, .9, .2)), 420, 5, .013, M.emit(0x9fc2ff, .25, { roughness: .4 })); spin.add(nuc);
  S.part('Nucleoid (chromosome)', 'One circular chromosome of about 4.6 million base pairs, folded into a dense tangle without a nuclear envelope. It can be copied in roughly 40 minutes and E. coli can divide every 20.', nuc);
  const rib = ribosomeCloud(480, r => { for (;;) { const p = V((r() * 2 - 1) * .38, (r() * 2 - 1) * .88, (r() * 2 - 1) * .38); if (Math.hypot(p.x, p.z) < .37) return p; } }, M.soft(0xe8a45b), .02, 4); spin.add(rib);
  S.part('Ribosomes', 'Thousands of 70S ribosomes read messenger RNA and build proteins. They are smaller than the 80S ribosomes of the cells in the rest of this library, and many antibiotics target them.', rib);
  const pls = new THREE.Group(); for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.07, .012, 8, 24), M.emit(0x7be0a1, .35)); t.position.set((R() - .5) * .4, (R() - .5) * 1.4, (R() - .5) * .3); t.rotation.set(R() * 3, R() * 3, 0); pls.add(t); } spin.add(pls);
  S.part('Plasmids', 'Small circular DNA rings that replicate on their own. They often carry extra genes such as antibiotic resistance and can be passed to neighbouring bacteria.', pls);
  const NF = 6, fm = M.soft(0xe9efe4, { roughness: .4 }), fls = [], fg = new THREE.Group();
  for (let i = 0; i < NF; i++) { const th = R() * TAU, y = (R() * 2 - 1) * .8, f = new Flag(fm, { n: 90, rad: 6, r0: .022, r1: .018 }); const d = V(Math.cos(th), (y > .5 ? .5 : y < -.5 ? -.5 : 0), Math.sin(th)).normalize(); fls.push({ f, o: d.clone().multiplyScalar(.52).add(V(0, y, 0)), d, s: perpBasis(d), ph: R() * TAU }); fg.add(f.mesh); }
  spin.add(fg); S.part('Flagella', 'Long helical filaments, each turned by a rotary motor in the cell envelope at up to about 100 revolutions a second. When the motors rotate together, the filaments bundle and push the cell forward.', fg);
  const NP = 140, pm = M.soft(0xf4f4ee, { transparent: true, opacity: .75 }), pg2 = new THREE.CylinderGeometry(.005, .007, .38, 4); pg2.translate(0, .19, 0);
  const pil = inst(pg2, pm, NP); for (let i = 0; i < NP; i++) { const th = R() * TAU, y = (R() * 2 - 1) * .85, d = V(Math.cos(th), 0, Math.sin(th)); setI(pil, i, d.clone().multiplyScalar(.5).add(V(0, y, 0)), qFromUp(d)); } spin.add(pil);
  S.part('Pili (fimbriae)', 'Short, hair-like protein filaments that stick to surfaces such as the gut lining. Longer sex pili can link two bacteria to transfer plasmid DNA.', pil);
  S.anim((t) => { spin.rotation.y = t * .25; fls.forEach(o => o.f.helix(o.o, o.d, o.s, 3.2, .14, 1.1, -t * 9 + o.ph, .3)); cell.rotation.x = Math.sin(t * .6) * .08; });
}

/* ================= LACTOBACILLUS ================= */
function buildLactobacillus(S) {
  const R = rng(14), N = 4, chain = new THREE.Group(); S.add(chain);
  const wm = M.shell(0xb7a0d8, .42, { bumpScale: .8, iridescence: .25 }), mm = M.shell(0xe6dca6, .3, { bumpScale: .2 }), sm = M.soft(0xa690d1, { transparent: true, opacity: .85 }), nm = M.emit(0x9fc2ff, .25, { roughness: .4 });
  const walls = new THREE.Group(), mems = new THREE.Group(), septa = new THREE.Group(), nucs = new THREE.Group(), ribs = new THREE.Group(), cells = [];
  for (let i = 0; i < N; i++) {
    const c = new THREE.Group(), x = (i - (N - 1) / 2) * 1.85; c.position.set(x, .22 * Math.cos(x * .45) - .1, 0); c.rotation.z = Math.PI / 2 + Math.sin(x * .45) * .1 - .02; chain.add(c);
    const last = i === N - 1, l = last ? 1.25 : 1.5;
    const w = new THREE.Mesh(new THREE.CapsuleGeometry(.3, l, 12, 28), wm); w.renderOrder = 9; walls.add(w); c.add(w); w.position.y = 0;
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(.25, l, 12, 28), mm); m.renderOrder = 7; c.add(m); mems.add(m);
    const nu = tubeCurve(loopCurve(R, 26, V(.12, l * .5, .12)), 220, 5, .011, nm); c.add(nu); nucs.add(nu);
    const rb = ribosomeCloud(90, r => { for (;;) { const p = V((r() * 2 - 1) * .24, (r() * 2 - 1) * (l / 2 + .15), (r() * 2 - 1) * .24); if (Math.hypot(p.x, p.z) < .23) return p; } }, M.soft(0xe8a45b), .017, 40 + i); c.add(rb); ribs.add(rb);
    cells.push(c);
    if (i < N - 1) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .06, 28), sm); s.position.copy(c.position).add(V(.92, .0, 0)); s.rotation.z = Math.PI / 2; s.position.y = .22 * Math.cos((x + .92) * .45) - .1; septa.add(s); chain.add(s); }
  }
  S.part('Thick cell wall', 'A Gram-positive wall: many layers of peptidoglycan threaded with teichoic acids. It is far thicker than in E. coli, which is why these cells hold the violet Gram stain.', walls, { shell: true });
  S.part('Cytoplasmic membrane', 'A single lipid bilayer just under the wall. Lactobacilli make energy by fermenting sugars, and the membrane helps pump out the lactic acid that results.', mems, { shell: true });
  S.part('Septum (division site)', 'Cells divide by growing a ring of new wall inward across the middle. Daughter cells often stay linked end-to-end, which is why Lactobacillus appears as chains.', septa);
  S.part('Nucleoid', 'A single circular chromosome of roughly 2 to 3 million base pairs, packed into a tangle in the cell centre. It is smaller than E. coli, which suits a specialist that lives on rich food.', nucs);
  S.part('Ribosomes', 'Protein-making machines scattered through the cytoplasm. Lactobacilli grow slowly compared to E. coli, so they carry fewer of them.', ribs);
  S.anim((t) => { chain.rotation.x = t * .15; chain.rotation.z = Math.sin(t * .3) * .06; });
}

/* ================= SPIRILLUM ================= */
function buildSpirillum(S) {
  const R = rng(5), spin = new THREE.Group(); S.add(spin);
  const k = TAU / 1.9, path = new THREE.CatmullRomCurve3(Array.from({ length: 140 }, (_, i) => { const x = -2.6 + 5.2 * i / 139; return V(x, .42 * Math.cos(k * x), .42 * Math.sin(k * x)); }));
  const body = tubeCurve(path, 200, 16, t => .11 * (.45 + .55 * Math.pow(Math.sin(Math.PI * t), .35)), M.shell(0xcfe0a8, .3, { bumpScale: .8, iridescence: .3 }));
  body.renderOrder = 9; spin.add(body); S.part('Rigid helical cell', 'Spirillum is a stiff, corkscrew-shaped bacterium. Its shape lets it bore through thick, watery environments, and the rigid wall keeps the coils from flexing.', body, { shell: true });
  const nuc = tubeCurve(path, 200, 6, t => .035 * Math.sin(Math.PI * t) ** .3, M.emit(0x9fc2ff, .3)); spin.add(nuc);
  S.part('Nucleoid', 'The chromosome stretches along the inside of the coil. Because the cell is so narrow, it is held as a thin, extended strand rather than a compact ball.', nuc);
  const vg = inst(G.sphereMid, M.soft(0xd6a24a, { roughness: .35 }), 9), pts = path.getPoints(60); for (let i = 0; i < 9; i++) setI(vg, i, pts[6 + i * 6].clone().add(V(0, 0, 0)), null, .05 + R() * .02); spin.add(vg);
  S.part('Volutin granules', 'Dense storage granules of polyphosphate. They act as a reserve of phosphate and energy that the cell can draw on when nutrients run short.', vg);
  const fm = M.soft(0xe9efe4), tufts = [], fg = new THREE.Group();
  for (const sgn of [-1, 1]) for (let i = 0; i < 4; i++) { const f = new Flag(fm, { n: 70, rad: 5, r0: .02, r1: .015 }), a = i / 4 * TAU; const d = V(sgn, Math.cos(a) * .25, Math.sin(a) * .25).normalize(); tufts.push({ f, o: pts[sgn < 0 ? 0 : 59].clone(), d, s: perpBasis(d), ph: i }); fg.add(f.mesh); }
  spin.add(fg); S.part('Polar flagella tufts', 'A bundle of flagella grows from each end. Spinning them pulls the cell along like a screw, and the whole body rotates in the opposite direction as it goes.', fg);
  S.anim((t) => { spin.rotation.x = t * 1.1; tufts.forEach(o => o.f.helix(o.o, o.d, o.s, 1.9, .12, .8, -t * 9 * -o.d.x + o.ph, .3)); S.group.rotation.z = Math.sin(t * .4) * .05; });
}

/* ================= STAPHYLOCOCCUS ================= */
function buildStaph(S) {
  const R = rng(17), r = .42, pos = [V(0, 0, 0), V(.62, 0, 0)];
  while (pos.length < 15) pos.push(randInBall(R).multiplyScalar(1.5));
  for (let it = 0; it < 220; it++) for (let i = 2; i < pos.length; i++) { for (let j = 0; j < pos.length; j++) if (i !== j) { const d = pos[i].clone().sub(pos[j]), L = d.length(); if (L < r * 1.9 && L > 1e-4) pos[i].addScaledVector(d.normalize(), (r * 1.9 - L) * .5); } pos[i].multiplyScalar(.995); }
  const c0 = pos.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / pos.length); pos.forEach(p => p.sub(c0));
  const wm = M.shell(0xe3b84e, .5, { bumpScale: 1.1, iridescence: .2 }), mm = M.shell(0xf0dfa0, .28, { bumpScale: .1 }), prm = M.soft(0xfff1c8), nm = M.emit(0x9fc2ff, .28, { roughness: .4 });
  const walls = new THREE.Group(), mems = new THREE.Group(), nucs = new THREE.Group(), nGeo = tubeCurve(loopCurve(R, 20, V(.16, .16, .16)), 160, 5, .011, nm).geometry;
  const NPR = 26, prot = inst(G.sphereLo, prm, pos.length * NPR), fp = fib(NPR), NR = 28, rib = inst(G.sphereLo, M.soft(0xe8a45b), pos.length * NR);
  pos.forEach((p, i) => {
    const w = new THREE.Mesh(G.sphere, wm); w.scale.setScalar(r); w.position.copy(p); w.renderOrder = 9; walls.add(w);
    const m = new THREE.Mesh(G.sphere, mm); m.scale.setScalar(r - .045); m.position.copy(p); m.renderOrder = 7; mems.add(m);
    const nu = new THREE.Mesh(nGeo, nm); nu.position.copy(p); nu.rotation.set(R() * 3, R() * 3, R() * 3); nucs.add(nu);
    fp.forEach((d, k) => { const dd = d.clone().applyAxisAngle(V(0, 1, 0), i * 1.3); setI(prot, i * NPR + k, p.clone().addScaledVector(dd, r), qFromUp(dd), .028); });
    for (let k = 0; k < NR; k++) setI(rib, i * NR + k, p.clone().add(randInBall(R).multiplyScalar(.28)), null, .017);
  });
  const sep = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .04, 32), M.soft(0xd49f33, { transparent: true, opacity: .9 })); sep.position.set(.31, 0, 0); sep.rotation.z = Math.PI / 2;
  const grp = new THREE.Group(); grp.add(walls, mems, nucs, prot, rib, sep); S.add(grp);
  S.part('Cell wall (peptidoglycan)', 'A thick Gram-positive wall of cross-linked peptidoglycan. Staphylococcus aureus is named for its golden colonies and the grape-like clusters (staphylo means bunch of grapes) formed as cells divide in several planes.', walls, { shell: true });
  S.part('Cytoplasmic membrane', 'A lipid bilayer just inside the wall. It is a target of some antibiotics, and it hosts enzymes for respiration and for building new wall material.', mems, { shell: true });
  S.part('Surface proteins', 'The wall is decorated with surface proteins such as protein A, which binds antibodies, and adhesins that help the cell stick to skin and tissue.', prot);
  S.part('Nucleoid', 'The single circular chromosome, about 2.8 million base pairs, lies coiled in the middle of each coccus. Cells copy it before they divide.', nucs);
  S.part('Ribosomes', 'Small 70S ribosomes translate genes into protein, including toxins and enzymes that help the bacterium invade tissue.', rib);
  S.part('Division septum', 'The two joined cells in the cluster are dividing: a disc of new wall (the septum) grows inward across the middle until it splits the cell in two. Cell separation then leaves the daughters stuck in a cluster.', sep);
  S.cut(wm, mm);
  S.anim((t) => { grp.rotation.y = t * .12; grp.rotation.x = Math.sin(t * .2) * .2; });
}

/* ================= BACTERIOPHAGE T4 ================= */
function buildPhage(S) {
  const g = new THREE.Group(); S.add(g);
  const hg = new THREE.IcosahedronGeometry(.62, 1); hg.scale(1, 1.5, 1);
  const cap = S.mesh(hg, M.glass(0x88b4e0, .4, { flatShading: true }), { p: V(0, 2.05, 0), parent: g, ro: 8 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(hg, 1), new THREE.LineBasicMaterial({ color: 0xa6e6ff, transparent: true, opacity: .55 })); edges.position.copy(cap.position); g.add(edges);
  S.part('Capsid (head)', 'A prolate icosahedron built from hundreds of copies of a few proteins. The head is about 120 by 90 nanometres and withstands pressure of roughly 60 atmospheres from the packed DNA.', cap, { shell: true });
  const dna = []; for (let i = 0; i <= 700; i++) { const t = i / 700, ph = t * TAU * 16, R = .16 + .2 * (.5 + .5 * Math.sin(t * TAU * 4)); dna.push(V(Math.cos(ph) * R, 2.05 + (t * 2 - 1) * .74 + .05 * Math.sin(ph * 2), Math.sin(ph) * R)); }
  const dm = tubePts(dna, 6, .026, M.emit(0xffc65a, .55, { roughness: .35 })); g.add(dm);
  S.part('DNA genome', 'About 170,000 base pairs of double-stranded DNA, packed so tightly that the strands are almost crystalline. It is pushed in by a molecular motor at the portal.', dm);
  const col = S.mesh(new THREE.CylinderGeometry(.25, .17, .12, 18), M.soft(0x7ab8e8), { p: V(0, 1.0, 0), parent: g });
  S.part('Neck and collar', 'The neck joins the head to the tail. Whisker-like fibres around the collar help control when the long tail fibres extend.', col);
  const NS = 12, sm = M.soft(0x5f9fd6, { transparent: true, opacity: .88, bumpMap: TEX.bump, bumpScale: 1.5 }), sh = inst(new THREE.CylinderGeometry(.2, .2, .16, 20), sm, NS); g.add(sh);
  S.part('Contractile sheath', 'A helical sleeve of protein wrapped around the tail tube. When the baseplate binds the host, the sheath contracts to about half its length, driving the tube through the bacterial wall like a syringe.', sh);
  const core = S.mesh(G.cyl, M.soft(0xd9ebf8, { roughness: .3 }), { p: V(0, -.55, 0), s: V(.07, 3.1, .07), parent: g });
  S.part('Tail tube (core)', 'A hollow needle in the centre of the tail. During infection it is pushed through the outer layers of the host, and the phage DNA passes through its channel.', core);
  const bpg = new THREE.Group(); g.add(bpg);
  const bp = S.mesh(new THREE.CylinderGeometry(.4, .4, .13, 6), M.soft(0x4d86be), { parent: bpg, p: V(0, 0, 0) });
  const pm = M.soft(0x3b6c9b), fm = M.soft(0xa7d0f0, { roughness: .45 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; const pin = S.mesh(new THREE.ConeGeometry(.04, .24, 6), pm, { parent: bpg, p: V(Math.cos(a) * .3, -.17, Math.sin(a) * .3), r: [Math.PI, 0, 0] }); }
  S.part('Baseplate', 'A hexagonal plate of about 150 protein subunits. Its pins and fibres sense the host surface, and when enough of them are bound the baseplate changes shape and triggers sheath contraction.', bp);
  const fibs = new THREE.Group(); bpg.add(fibs);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3, c = Math.cos(a), s = Math.sin(a); const pts = new THREE.CatmullRomCurve3([V(c * .3, .05, s * .3), V(c * .75, .15, s * .75), V(c * 1.15, .1, s * 1.15), V(c * 1.35, -.45, s * 1.35), V(c * 1.4, -.8, s * 1.4)]).getPoints(26); fibs.add(tubePts(pts, 5, t => .026 * (1 - t * .25), fm)); }
  S.part('Long tail fibres', 'Six jointed fibres that bind to receptors on the E. coli surface. Each one is about 145 nanometres long and works like landing gear: first contact is reversible, then more fibres lock on.', fibs);
  const sheathTop = .94, ring = V(), q = new THREE.Quaternion();
  S.anim((t) => {
    const ph = t % 18, c = ph < 6 ? 0 : ph < 8.5 ? sstep(6, 8.5, ph) : ph < 13 ? 1 : 1 - sstep(13, 15.5, ph), s = 1 - .5 * c;
    for (let i = 0; i < NS; i++) { ring.set(0, sheathTop - (i + .5) * .2 * s, 0); q.setFromEuler(new THREE.Euler(0, i * .3, 0)); setI(sh, i, ring, q, V(1 + .28 * c, (1 - .5 * c) * .95 + .05, 1 + .28 * c)); }
    sh.instanceMatrix.needsUpdate = true;
    bpg.position.y = sheathTop - 12 * .2 * s - .06; bpg.rotation.y = c * .3;
    g.rotation.z = Math.sin(t * .4) * .06; g.rotation.y = t * .15;
  });
}

/* ================= spiked virions ================= */
function spikeGeo(parts) { return mergeGeometries(parts.map(([geo, y, sc]) => { const g = geo.clone(); if (sc) g.scale(...sc); g.translate(0, y, 0); return g; })); }
function scatterSpikes(S, geo, mat, dirs, R, r0, sMin = .9, sMax = 1.1) {
  const m = inst(geo, mat, dirs.length); dirs.forEach((d, i) => setI(m, i, d.clone().multiplyScalar(r0), qFromUp(d.clone().add(randDir(R).multiplyScalar(.06))), sMin + R() * (sMax - sMin))); return m;
}
function buildInfluenza(S) {
  const R = rng(12), g = new THREE.Group(); S.add(g);
  const env = S.mesh(new THREE.SphereGeometry(1, 72, 52), M.shell(0x92b8cd, .3, { iridescence: .4, bumpScale: .5 }), { parent: g, ro: 9 });
  const mx = S.mesh(new THREE.SphereGeometry(.9, 48, 36), M.shell(0xd7c690, .26, { bumpScale: 1 }), { parent: g, ro: 7 });
  S.part('Lipid envelope', 'A membrane stolen from the infected cell as the new virus buds out. It is a lipid bilayer carrying the viral proteins, and can be dissolved by soap, which is one reason hand washing works.', env, { shell: true });
  S.part('Matrix layer (M1)', 'A shell of matrix protein M1 lines the inside of the envelope. It gives the virion its shape and links the membrane to the genome segments inside.', mx, { shell: true });
  const dirs = fib(330), haD = [], naD = []; dirs.forEach((d, i) => (R() < .8 ? haD : naD).push(d));
  const haM = M.soft(0xe0667a, { roughness: .45 }), naM = M.soft(0x5fb3a1, { roughness: .45 });
  const haG = spikeGeo([[new THREE.CylinderGeometry(.026, .038, .22, 6), .11], [new THREE.CylinderGeometry(.075, .045, .14, 6), .29]]);
  const naG = spikeGeo([[new THREE.CylinderGeometry(.016, .022, .22, 6), .11], [G.sphereMid, .26, [.11, .045, .11]]]);
  const ha = scatterSpikes(S, haG, haM, haD, R, .97), na = scatterSpikes(S, naG, naM, naD, R, .97); g.add(ha, na);
  S.part('Hemagglutinin (HA)', 'The most abundant spike. HA binds sialic acid on the surface of airway cells and lets the virus enter. Antibodies mostly target HA, and its changes (drift and shift) are why flu vaccines are updated each year.', ha);
  S.part('Neuraminidase (NA)', 'A mushroom-shaped enzyme that cuts sialic acid. It frees new virions from the cell they were made in. Drugs such as oseltamivir block it, and the N in H1N1 stands for this protein.', na);
  const rn = new THREE.Group(), rm = M.soft(0xe8b44c, { roughness: .4 }), pol = M.soft(0xb04a3a);
  for (let i = 0; i < 8; i++) {
    const a = i / 7 * TAU, c = i === 7 ? V(0, 0, 0) : V(Math.cos(a) * .3, (R() - .5) * .12, Math.sin(a) * .3), len = .5 + R() * .25, pts = [];
    for (let k = 0; k <= 40; k++) { const t = k / 40; pts.push(V(c.x + .016 * Math.sin(t * 40), c.y + (t - .5) * len, c.z + .016 * Math.cos(t * 40))); }
    rn.add(tubePts(pts, 7, t => .038 * (1 + .3 * Math.sin(t * 90)), rm));
    for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(G.sphereMid, pol); s.scale.setScalar(.05); s.position.set(c.x + (k - 1) * .045, c.y - len / 2 - .03, c.z + (k === 1 ? .04 : 0)); rn.add(s); }
  }
  g.add(rn); S.part('RNP segments (genome)', 'The genome is eight separate strands of RNA, each coiled with nucleoprotein into a rod. This split genome lets two flu strains in one cell swap segments, producing new pandemic variants.', rn);
  S.cut(env.material, mx.material, haM, naM);
  S.anim((t) => { g.rotation.y = t * .18; g.rotation.x = Math.sin(t * .3) * .25; });
}
function buildCorona(S) {
  const R = rng(19), g = new THREE.Group(); S.add(g);
  const env = S.mesh(new THREE.SphereGeometry(1, 72, 52), M.shell(0x9aa9d4, .3, { iridescence: .35, bumpScale: .6 }), { parent: g, ro: 9 });
  S.part('Lipid envelope', 'A lipid bilayer taken from the host cell as new virions bud from internal membranes. Coronavirus particles are around 100 nanometres wide, about 1,000 times narrower than a human hair.', env, { shell: true });
  const sM = M.soft(0xdc6a4c, { roughness: .45 }), sG = spikeGeo([[new THREE.CylinderGeometry(.035, .05, .28, 6), .14], [G.sphereMid, .38, [.075, .1, .075]], [G.sphereMid, .38, [.075, .1, .075]]]);
  const trimer = (() => { const parts = [[new THREE.CylinderGeometry(.03, .045, .26, 6), .13]]; const gs = [parts[0]].map(([geo, y]) => { const q = geo.clone(); q.translate(0, y, 0); return q; }); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU, s = new THREE.SphereGeometry(.07, 12, 10); s.scale(1, 1.4, 1); s.translate(Math.cos(a) * .045, .36, Math.sin(a) * .045); gs.push(s); } const top = new THREE.SphereGeometry(.06, 10, 8); top.translate(0, .42, 0); gs.push(top); return mergeGeometries(gs); })();
  const sp = scatterSpikes(S, trimer, sM, fib(78), R, .97, .95, 1.1); g.add(sp);
  S.part('Spike (S) protein', 'The crown that gives coronaviruses their name. Each spike is a trimer that binds a receptor on the host cell (ACE2 for SARS-CoV-2) and then fuses the viral and cell membranes. Many vaccines and antibodies target it.', sp);
  const mM = M.soft(0x7f93c2), eM = M.soft(0xf0c38c), mp = inst(G.sphereLo, mM, 190), ep = inst(G.sphereMid, eM, 22), md = fib(190), ed = fib(22);
  md.forEach((d, i) => setI(mp, i, d.clone().multiplyScalar(1.0), null, .034 + R() * .01)); ed.forEach((d, i) => setI(ep, i, d.clone().multiplyScalar(1.0), null, .055)); g.add(mp, ep);
  S.part('Membrane (M) and envelope (E) proteins', 'M is the most plentiful envelope protein and shapes the virion. E forms small channel-like pentamers. Together they guide assembly and budding of new particles.', [mp, ep]);
  const pts = []; for (let i = 0; i < 80; i++) pts.push(randInBall(R).multiplyScalar(.62));
  const nc = tubeCurve(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', .6), 900, 6, t => .026 * (1 + .35 * Math.sin(t * 520)), M.soft(0xf0b254, { roughness: .4 })); g.add(nc);
  S.part('Nucleocapsid and RNA genome', 'A single strand of RNA about 30,000 bases long, among the largest of any RNA virus, coiled with nucleocapsid (N) protein into a beaded helix.', nc);
  S.cut(env.material, sM);
  S.anim((t) => { g.rotation.y = t * .16; g.rotation.x = Math.sin(t * .27) * .3; });
}
