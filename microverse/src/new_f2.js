/* ================= NEW MICROSCOPIC ALGAE (worker F2) =================
   Spirogyra, Chlamydomonas, Diatom, Dinoflagellate, Desmid, Oscillatoria */

/* generic parametric grid surface: fn(u, v) -> [x, y, z], u,v in 0..1 */
function f2Grid(nx, ny, fn) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) { const p = fn(i / nx, j / ny); pos.push(p[0], p[1], p[2]); uv.push(i / nx, j / ny); }
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const a = i * (ny + 1) + j, b = a + 1, c = a + ny + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
const f2InPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };

/* ---------- Spirogyra ---------- */
/* helical chloroplast ribbon with scalloped edges, lying on a cylinder of radius rad around the X axis */
function f2Ribbon(xc, len, turns, rad, width, phase) {
  return f2Grid(180, 1, (t, v) => {
    const th = phase + TAU * turns * t, w = width * (.5 + .14 * Math.sin(t * 74 + phase * 3)) * (v > .5 ? 1 : -1);
    return [xc + (t - .5) * len + w, Math.cos(th) * rad, Math.sin(th) * rad];
  });
}
function buildSpirogyra(S) {
  const fil = new THREE.Group(); S.add(fil);
  const NC = 5, Lc = 2.1, r = .5, len = NC * Lc, x0 = -len / 2;
  const wallGeo = new THREE.CylinderGeometry(r, r, len, 40, 1, true); wallGeo.rotateZ(Math.PI / 2);
  const wall = S.mesh(wallGeo, M.shell(0xbfe0b4, .3, { bumpScale: .2 }), { parent: fil, ro: 9 });
  const sheathGeo = new THREE.CylinderGeometry(r * 1.13, r * 1.13, len + .1, 40, 1, true); sheathGeo.rotateZ(Math.PI / 2);
  const sheath = S.mesh(sheathGeo, M.shell(0xe9f3df, .13, { clearcoat: .2 }), { parent: fil, ro: 10 });
  S.part('Cell wall and mucilage sheath', 'Each cell has a wall of cellulose and pectin, wrapped in a layer of slippery mucilage. This coat is why a clump of Spirogyra feels slimy and why the filaments cling together as pond scum.', [wall, sheath], { shell: true });
  const septa = new THREE.Group(); fil.add(septa);
  const cwGeo = new THREE.CircleGeometry(r * .995, 36); cwGeo.rotateY(Math.PI / 2), cwMat = M.shell(0x8fc183, .62, { side: THREE.DoubleSide });
  for (let i = 0; i <= NC; i++) S.mesh(cwGeo, cwMat, { parent: septa, p: V(x0 + i * Lc, 0, 0), ro: 8 });
  S.part('Cross walls', 'Flat cross walls divide the filament into a row of identical cells that stay joined end to end. New walls form across the middle of a cell when it divides, so the filament grows in length without branching.', septa);
  const chlMat = M.soft(0x3f9a37, { side: THREE.DoubleSide, roughness: .5, clearcoat: .4 });
  const chl = new THREE.Group(); fil.add(chl);
  const pyr = inst(G.sphereMid, M.soft(0xf2eebf, { roughness: .35 }), NC * 2 * 9);
  let pk = 0; const rr = rng(8);
  const nuc = new THREE.Group(), nm = M.grain(0x8c68b0), nlm = PM.dark(0x4a2f6a), strandM = M.soft(0xe6efcf, { roughness: .6 }), vm = M.glass(0xe0f4dc, .2, { roughness: .1 });
  fil.add(nuc); const strands = new THREE.Group(); fil.add(strands); const vacs = new THREE.Group(); fil.add(vacs);
  for (let c = 0; c < NC; c++) {
    const xc = x0 + (c + .5) * Lc;
    for (let k = 0; k < 2; k++) {
      const ph = c * 1.1 + k * Math.PI;
      S.mesh(f2Ribbon(xc, 1.78, 2.4, r * .86, .3, ph), chlMat, { parent: chl });
      for (let q = 0; q < 9; q++) { const t = (q + .5) / 9, th = ph + TAU * 2.4 * t; setI(pyr, pk++, V(xc + (t - .5) * 1.78, Math.cos(th) * r * .84, Math.sin(th) * r * .84), null, .085 + rr() * .02); }
    }
    S.mesh(G.sphere, nm, { parent: nuc, p: V(xc, 0, 0), s: V(.2, .17, .2) }); S.mesh(G.sphereLo, nlm, { parent: nuc, p: V(xc + .03, .02, .02), s: .07 });
    for (let k = 0; k < 11; k++) { const a = k / 11 * TAU + rr() * .4, e = (rr() - .5) * 1.1, end = V(xc + e, Math.cos(a) * r * .8, Math.sin(a) * r * .8); strands.add(rod(V(xc, 0, 0), end, .016, .008, strandM)); }
    const cap = S.mesh(G.capsule, vm, { parent: vacs, p: V(xc, 0, 0), r: [0, 0, Math.PI / 2], s: V(.72, Lc * .41, .72), ro: 3 });
  }
  pyr.instanceMatrix.needsUpdate = true; fil.add(pyr);
  S.part('Spiral chloroplasts', 'The ribbon-shaped chloroplast winds in a helix just inside the wall, giving the genus its name. Each cell here has two; species have anywhere from one to sixteen. The wavy edges carry the light-harvesting membranes.', chl);
  S.part('Pyrenoids', 'The pale round bodies along the ribbon are pyrenoids, protein-rich centres where carbon dioxide is fixed. Starch grains collect around each one as a reserve of sugar made in photosynthesis.', pyr);
  S.part('Nucleus and cytoplasmic strands', 'The single nucleus hangs in the middle of the cell, held in place by fine strands of cytoplasm that run out to the wall. The strands stretch and shift as the cell moves its contents.', [nuc, strands]);
  S.part('Central vacuole', 'A large fluid-filled vacuole takes up most of the cell interior and presses the living cytoplasm, chloroplasts included, into a thin layer against the wall. It keeps the cell firm by holding water under pressure.', vacs, { shell: true });
  S.anim(t => { fil.rotation.set(t * .13, .12 * Math.sin(t * .21), .3 + .05 * Math.sin(t * .3)); fil.position.y = .15 * Math.sin(t * .4); });
}
NEWBUILD.spirogyra = buildSpirogyra;
NEW_SPEC.push({ id: 'spirogyra', cat: 'algae', name: 'Spirogyra', latin: 'Spirogyra sp.', size: 'cells 20–100 µm wide and up to several times longer; filaments many centimetres', sizeUm: 750, U: 10.5, dist: 19,
  cls: 'Eukaryota · Archaeplastida · Charophyta · Zygnematophyceae', habitat: 'Freshwater ponds, ditches and slow streams, forming floating green mats', move: 'Non-motile; filaments drift with the water and float up on trapped oxygen bubbles', feed: 'Photoautotroph: photosynthesis in spiral chloroplasts, storing starch', repro: 'Fragmentation of the filament; sexual conjugation between two filaments forms thick-walled zygospores',
  desc: 'An unbranched green filament of cylindrical cells, each holding one or more ribbon-like chloroplasts wound in a helix. It forms the slippery green strands often called pond silk or blanket weed.',
  fun: ['During conjugation, two filaments lie side by side and the contents of one cell pass through a tube into the cell opposite, where they fuse into a zygospore.', 'Spirogyra belongs to the group of green algae most closely related to land plants.', 'Bubbles of oxygen from photosynthesis get caught in the mat and lift it to the surface on sunny days.'],
  note: 'Only five cells are shown; real filaments contain hundreds or thousands. Cells are drawn somewhat shorter than typical. Each cell shows two chloroplast ribbons with nine pyrenoids per ribbon; the true counts vary by species.' });

/* ---------- Chlamydomonas ---------- */
function buildChlamydomonas(S) {
  const g = new THREE.Group(); S.add(g);
  const wall = S.mesh(G.sphere, M.shell(0xd8ebc4, .3, { bumpScale: .2 }), { parent: g, s: V(1.07, 1.29, 1.07), ro: 9 });
  const pap = [-1, 1].map(sd => S.mesh(G.sphere, M.shell(0xd8ebc4, .45), { parent: g, p: V(sd * .2, 1.27, 0), s: V(.15, .1, .15), ro: 9 }));
  S.part('Cell wall', 'A tough wall made of glycoproteins surrounds the cell. Unlike the walls of land plants and many other algae, it contains no cellulose. Two small bumps at the front, the papillae, mark where the flagella leave the cell.', [wall, ...pap], { shell: true });
  const cupGeo = new THREE.SphereGeometry(1, 44, 30, 0, TAU, 1.2, Math.PI - 1.2);
  const cup = S.mesh(cupGeo, M.soft(0x449a33, { side: THREE.DoubleSide, roughness: .5, clearcoat: .4 }), { parent: g, s: V(.94, 1.14, .94), ro: 4 });
  S.part('Cup-shaped chloroplast', 'A single large chloroplast curves around the back and sides of the cell like a cup. It fills most of the volume and holds the chlorophyll, so one chloroplast makes all of the cell’s food by photosynthesis.', cup);
  const py = new THREE.Group(); py.position.set(0, -.66, 0); g.add(py);
  S.mesh(G.sphere, M.soft(0xe6eab0, { roughness: .35 }), { parent: py, s: .36 });
  fib(14).forEach(d => S.mesh(G.sphere, M.soft(0xfffbe0, { roughness: .3 }), { parent: py, p: d.clone().multiplyScalar(.4), s: V(.15, .15, .06), quaternion: null }).quaternion.copy(qFromUp(d)));
  S.part('Pyrenoid and starch sheath', 'The pyrenoid is a dense blob inside the chloroplast where the enzyme Rubisco is concentrated to fix carbon dioxide. Plates of starch gather around it as the cell stores energy.', py);
  const th = 1.5, ph = .25, ey = S.mesh(G.sphere, M.soft(0xd33a1c, { emissive: 0x8a1c0a, emissiveIntensity: .45, roughness: .35 }), { parent: g, p: V(Math.sin(th) * Math.cos(ph) * .96, Math.cos(th) * 1.16, Math.sin(th) * Math.sin(ph) * .96), s: V(.17, .1, .17), ro: 5 });
  ey.quaternion.copy(qFromUp(V(Math.cos(ph), 0, Math.sin(ph))));
  S.part('Eyespot (stigma)', 'A patch of red-orange pigment droplets inside the chloroplast. It shades a light-sensing protein in the membrane just outside, so the cell can tell where light is coming from and swim toward or away from it.', ey);
  const nuc = new THREE.Group(); nuc.position.set(0, .32, 0); g.add(nuc);
  S.mesh(G.sphere, M.grain(0xa285c4), { parent: nuc, s: .37 }); S.mesh(G.sphereLo, PM.dark(0x56396f), { parent: nuc, p: V(.1, .07, .08), s: .13 });
  S.part('Nucleus', 'The nucleus sits in the hollow of the cup, near the front of the cell. The dark spot inside it is the nucleolus, where ribosomes are assembled. The cell is haploid and carries a single set of chromosomes.', nuc);
  const cvs = [-1, 1].map(sd => S.mesh(G.sphere, M.glass(0xdcecf0, .6, { roughness: .1 }), { parent: g, p: V(sd * .45, .88, .12), s: .17, ro: 7 }));
  S.part('Contractile vacuoles', 'Two vacuoles at the front collect excess water that seeps into the cell and squirt it out every few seconds. They alternate, so the cell does not burst in fresh water.', cvs);
  const mm = mitoMats(), mit = new THREE.Group(); g.add(mit);
  [[.72, -.25, .35], [-.7, -.1, .4], [.3, -.85, -.55], [-.35, .05, -.75], [.55, .25, -.6]].forEach(([x, y, z], i) => { const m = mitochondrion(mm, .5); m.position.set(x, y, z); m.rotation.set(i * 1.3, i, i * .7); mit.add(m); });
  S.part('Mitochondria', 'The mitochondria, drawn as small bean shapes between the chloroplast and the wall, burn sugar to make ATP, especially in the dark when photosynthesis stops. In this alga they form a branched network, shown here as separate pieces.', mit);
  const fm = M.soft(0xe9e1cb, { roughness: .5 }), fl = [-1, 1].map(sd => { const f = new Flag(fm, { n: 44, rad: 6, r0: .055, r1: .022 }); g.add(f.mesh); f.mesh.userData.sd = sd; return f; });
  S.part('Flagella', 'Two equal whip-like flagella, about as long as the cell, pull it through the water with a movement much like a breaststroke. The flagella are built from the same microtubule pattern as human cilia, which is why the alga is used to study cilia diseases.', fl.map(f => f.mesh));
  const side = V(0, 0, 1);
  S.anim(t => {
    const w = 7.5;
    fl.forEach((f, i) => { const sd = i ? 1 : -1, a = .5 + .85 * Math.sin(t * w) + .28 * Math.sin(t * w * 2 + 1.2); const dir = V(sd * Math.sin(a), Math.cos(a), 0).normalize(); f.wave(V(sd * .2, 1.3, 0), dir, side, 2.7, .2, 1.7, w, t, .8); });
    cvs.forEach((c, i) => { const k = (t / 2.6 + i * .5) % 1, s = k < .85 ? .06 + .13 * sstep(0, .85, k) : .19 * (1 - sstep(.85, 1, k)) + .02; c.scale.setScalar(s); });
    g.rotation.set(.13 * Math.sin(t * .9), t * 1.1, .1 * Math.cos(t * .7)); g.position.set(.22 * Math.sin(t * .5), -1.3 + .12 * Math.sin(t * .8), 0);
  });
}
NEWBUILD.chlamydomonas = buildChlamydomonas;
NEW_SPEC.push({ id: 'chlamydomonas', cat: 'algae', name: 'Chlamydomonas', latin: 'Chlamydomonas reinhardtii', size: 'about 10 µm wide; flagella 10–12 µm', sizeUm: 10, U: 2.6, dist: 10.5,
  cls: 'Eukaryota · Archaeplastida · Chlorophyta · Chlorophyceae', habitat: 'Freshwater ponds and puddles, and damp soil', move: 'Swims by beating two flagella in a breaststroke, spinning about its long axis; steers toward light', feed: 'Photoautotroph; can also take up acetate and grow in the dark', repro: 'Asexual: divides inside the parent wall into 2–16 swimming cells; sexual: two mating types fuse to form a resting zygospore',
  desc: 'A single-celled green alga with a cup-shaped chloroplast, a red eyespot and two flagella. It is one of the most studied organisms in biology.',
  fun: ['It is a model organism for photosynthesis, flagellar movement and the genetics of chloroplasts. Its genome was sequenced in 2007.', 'The eyespot lets it steer toward moderate light and away from light that is too bright.', 'A related species, Chlamydomonas nivalis, tints snow red and is known as watermelon snow.'],
  note: 'Body proportions are idealised. The flagellar beat is slowed from about 50 beats per second so the movement can be seen. Mitochondria are drawn as separate pieces; the living cell has a network. Cell size is a measured typical value.' });

/* ---------- Diatom ---------- */
/* superellipse sheet along X: cross-section in (y, z), psi range selects which part of the frustule */
function f2DiatomSheet(L, W, H, nExp, psi0, psi1, grow) {
  return f2Grid(90, 44, (u, v) => {
    const w = 2 * u - 1, s = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(w), 2.6)), 1 / 2.4);
    const ps = lerp(psi0, psi1, v), c = Math.cos(ps), sn = Math.sin(ps);
    return [(u - .5) * L, W / 2 * s * grow * Math.sign(c) * Math.pow(Math.abs(c), 2 / nExp), H / 2 * s * grow * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / nExp)];
  });
}
function f2DiatomTex(bump) {
  return canvasTex(2048, 512, (c, w, h) => {
    c.fillStyle = bump ? '#ffffff' : '#e1c87f'; c.fillRect(0, 0, w, h);
    const N = 48, dot = bump ? '#000' : '#7a5a1e';
    for (let i = 0; i < N; i++) {
      const u = .08 + .84 * (i + .5) / N, x = u * w; if (Math.abs(u - .5) < .03) continue;
      for (const sd of [-1, 1]) for (let k = 0; k < 9; k++) {
        const v = .5 + sd * (.075 + .4 * k / 8.5); c.fillStyle = dot; c.beginPath(); c.ellipse(x, v * h, 5, 8, 0, 0, TAU); c.fill();
        if (!bump) { c.fillStyle = '#f6e7b4'; c.beginPath(); c.ellipse(x - 1, v * h - 1.5, 2, 3.2, 0, 0, TAU); c.fill(); }
      }
    }
    c.strokeStyle = bump ? '#000' : '#4e3912'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(.07 * w, h / 2); c.lineTo(.465 * w, h / 2); c.moveTo(.535 * w, h / 2); c.lineTo(.93 * w, h / 2); c.stroke();
    c.fillStyle = bump ? '#fff' : '#fff2c9'; [.5, .06, .94].forEach((u, i) => { c.beginPath(); c.arc(u * w, h / 2, i ? 11 : 17, 0, TAU); c.fill(); });
  }, !bump);
}
function buildDiatom(S) {
  const g = new THREE.Group(); S.add(g);
  const L = 7, W = 1.5, H = 1.15, n = 3, gz = .17, psi0 = Math.asin(Math.pow(2 * gz / H, n / 2));
  const vm = () => new THREE.MeshPhysicalMaterial({ map: f2DiatomTex(false), bumpMap: f2DiatomTex(true), bumpScale: 2.4, roughness: .22, clearcoat: 1, clearcoatRoughness: .1, transparent: true, opacity: .66, side: THREE.DoubleSide, depthWrite: false });
  const epi = S.mesh(f2DiatomSheet(L, W, H, n, psi0, Math.PI - psi0, 1.025), vm(), { parent: g, ro: 9 });
  const hypo = S.mesh(f2DiatomSheet(L, W, H, n, Math.PI + psi0, TAU - psi0, 1), vm(), { parent: g, ro: 9 });
  S.part('Silica valves (epitheca and hypotheca)', 'The cell sits inside a glass-like box made of silica, with two halves that fit like a petri dish and its lid. The larger upper half is the epitheca and the lower is the hypotheca. Rows of tiny pores, called striae, pass nutrients and gases while keeping the shell strong.', [epi, hypo], { shell: true });
  const gird = mergeGeometries([f2DiatomSheet(L, W, H, n, -psi0, psi0, .985), f2DiatomSheet(L, W, H, n, Math.PI - psi0, Math.PI + psi0, .985)]);
  const girdle = S.mesh(gird, M.glass(0xd9c283, .58, { roughness: .3 }), { parent: g, ro: 8 });
  S.part('Girdle bands', 'Overlapping strips of silica form a band, the girdle, around the join between the two valves. New bands are added as the cell grows, and the girdle is the part of the shell you see from the side.', girdle);
  const zt = x => H / 2 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * x / L), 2.6)), 1 / 2.4) * 1.03;
  const rm = PM.dark(0x7a5a1c), rg = new THREE.Group(); g.add(rg);
  for (const sz of [-1, 1]) for (const [a, b] of [[-.43, -.035], [.035, .43]]) {
    const pts = []; for (let i = 0; i <= 14; i++) { const x = lerp(a, b, i / 14) * L; pts.push(V(x, 0, sz * (zt(x) + .012))); }
    rg.add(tubePts(pts, 6, .03, rm));
    [.0, a < 0 ? -.455 : .455].forEach(u => { if (u !== 0 || a < 0) S.mesh(G.sphere, M.soft(0xc7a95a, { roughness: .3 }), { parent: rg, p: V(u * L, 0, sz * (zt(u * L) + .02)), s: u === 0 ? .1 : .07 }); });
  }
  S.part('Raphe and nodules', 'A slit called the raphe runs down the middle of each valve and is interrupted by a thickened central nodule, with a polar nodule at each end. Cytoplasm streams along the slit and pushes out mucilage that lets the cell glide across surfaces.', rg);
  const chlM = M.soft(0xb27f27, { roughness: .45, clearcoat: .5 }), chlG = new THREE.Group(); g.add(chlG);
  const pyrG = new THREE.Group(); g.add(pyrG);
  for (const sd of [-1, 1]) { S.mesh(G.sphere, chlM, { parent: chlG, p: V(0, sd * .56, 0), s: V(2.45, .13, .4) }); S.mesh(G.sphere, M.soft(0xefd9a2), { parent: pyrG, p: V(0, sd * .5, 0), s: V(.2, .17, .2) }); }
  S.part('Golden-brown chloroplasts', 'Two plate-shaped chloroplasts lie against the sides of the cell. They contain chlorophyll plus a golden-brown pigment, fucoxanthin, that gives diatoms their colour and lets them use the blue-green light that reaches deeper water.', chlG);
  S.part('Pyrenoids', 'Each chloroplast carries a pyrenoid, a dense core where carbon dioxide is captured by the enzyme Rubisco before it is turned into sugar.', pyrG);
  const nuc = new THREE.Group(); g.add(nuc);
  S.mesh(G.sphere, M.grain(0x8c6bab), { parent: nuc, s: V(.3, .26, .3) }); S.mesh(G.sphereLo, PM.dark(0x4a2f6a), { parent: nuc, p: V(.06, .03, .06), s: .1 });
  S.mesh(G.cyl, M.soft(0xe6d39d, { transparent: true, opacity: .7 }), { parent: nuc, s: V(.2, W * .78, .2) });
  S.part('Nucleus and cytoplasmic bridge', 'The nucleus sits in a bridge of cytoplasm across the middle of the cell. Diatom cells are diploid, with two sets of chromosomes, unlike most other algae.', nuc);
  const oil = new THREE.Group(); g.add(oil), om = M.glass(0xe3a93c, .85, { roughness: .1 });
  [[-2.7, .15, .15, .2], [-2.4, -.2, -.1, .14], [2.75, -.1, .1, .19], [2.4, .22, -.12, .14], [-2, .05, .25, .11], [2.1, -.15, -.25, .11]].forEach(([x, y, z, r]) => S.mesh(G.sphere, om, { parent: oil, p: V(x, y, z), s: r }));
  S.part('Oil droplets (lipid reserves)', 'Diatoms store energy as droplets of oil, together with a soluble sugar called chrysolaminarin. Oil also helps the cell float. Ancient diatom oil is one source of petroleum.', oil);
  S.anim(t => { g.position.x = 1.1 * Math.sin(t * .33); g.rotation.set(.5 + .22 * Math.sin(t * .22), .14 * Math.sin(t * .33 + 1), .06 * Math.sin(t * .3)); });
}
NEWBUILD.diatom = buildDiatom;
NEW_SPEC.push({ id: 'diatom', cat: 'algae', name: 'Diatom', latin: 'Pinnularia sp. (pennate diatom)', size: 'about 40–200 µm long, depending on species', sizeUm: 80, U: 7, dist: 15,
  cls: 'Eukaryota · SAR · Ochrophyta · Bacillariophyceae', habitat: 'Freshwater ponds, wet mud and moss; related diatoms live throughout the oceans', move: 'Glides along surfaces by secreting mucilage through the raphe', feed: 'Photoautotroph, with fucoxanthin as the main light-harvesting pigment', repro: 'Mostly asexual division, in which each daughter keeps one old valve and builds a new smaller one; sexual reproduction restores full size',
  desc: 'A single cell housed in an ornate glass-like shell of silica. The boat shape, the rows of pores and the central slit called the raphe identify the pennate diatoms.',
  fun: ['Diatoms account for roughly a fifth of all photosynthesis on Earth.', 'Because each division gives one daughter a smaller shell, a population shrinks until sexual reproduction makes a full-size cell again.', 'Deposits of fossil shells, called diatomaceous earth, are mined for filters and polishes.'],
  note: 'Size is the typical range for Pinnularia. The number and spacing of striae are simplified, and the shell is tinted amber so it is visible on a light background; real silica is colourless and transparent.' });
