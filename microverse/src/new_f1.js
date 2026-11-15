/* ================= WORKER F1: Hydra, Nematode, Gastrotrich, Volvox ================= */
{
const tabFn = tbl => u => { for (let i = 1; i < tbl.length; i++) if (u <= tbl[i][0]) { const a = tbl[i - 1], b = tbl[i]; return lerp(a[1], b[1], sstep(a[0], b[0], u)); } return tbl[tbl.length - 1][1]; };
const mkPts = n => Array.from({ length: n + 1 }, () => V());

/* ---------- Hydra ---------- */
function buildHydra(S) {
  const bg = new THREE.Group(); S.add(bg);
  const NB = 40, ptsB = mkPts(NB), y0 = -2.0;
  const hyR = tabFn([[0, .3], [.07, .2], [.22, .27], [.5, .43], [.78, .47], [.92, .33], [1, .13]]);
  let wf = 1;
  const epiMat = M.shell(0xc79b5d, .55, { bumpScale: .35, roughness: .4 });
  const epi = new Tube(NB, 18, epiMat); epi.mesh.renderOrder = 8; bg.add(epi.mesh);
  const cav = new Tube(NB, 14, M.soft(0x8ea85a, { transparent: true, opacity: .85, roughness: .5 })); bg.add(cav.mesh);
  S.part('Epidermis and mesoglea', 'The body is a tube made of two cell layers, a thin outer epidermis and an inner gastrodermis, with a jelly-like mesoglea sandwiched between them. The epidermis holds muscle fibres, sensory cells and stinging cells, and its contractions let the animal shorten and stretch.', epi.mesh, { shell: true });
  S.part('Gastric cavity', 'A single hollow cavity lined by the gastrodermis serves as stomach and gut. Gland cells release digestive enzymes, other cells engulf the food fragments, and the same opening that takes food in also lets waste out.', cav.mesh);
  const rfOut = u => hyR(u) * wf, rfCav = u => .03 + hyR(u) * wf * .6 * sstep(.06, .2, u) * (1 - sstep(.84, .95, u));
  /* mouth and hypostome */
  const mouth = new THREE.Group(); bg.add(mouth);
  const dome = S.mesh(G.sphere, PM.cuticle(0xb88a4e), { parent: mouth, p: V(0, -.03, 0), s: V(.17, .1, .17) });
  const ring = S.mesh(new THREE.TorusGeometry(1, .28, 8, 24), PM.dark(0x7a4a2a), { parent: mouth, r: [Math.PI / 2, 0, 0], p: V(0, .06, 0) });
  const disc = S.mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: .8, side: THREE.DoubleSide }), { parent: mouth, r: [-Math.PI / 2, 0, 0], p: V(0, .055, 0) });
  S.part('Hypostome and mouth', 'The dome at the top of the column, the hypostome, carries the mouth at its centre. The mouth stretches wide enough to swallow prey almost as large as the animal itself, and snaps shut again after feeding.', [dome, ring, disc]);
  /* tentacles */
  const NT = 7, TS = 28, EL = [.35, -.1, -.4, .15, -.55, .05, -.25], LEN = [4.0, 4.4, 3.6, 4.2, 3.8, 4.1, 3.5];
  const tmat = M.soft(0xbf9558, { roughness: .5 }), tents = [];
  const rfT = u => lerp(.08, .022, Math.pow(u, .7)) * (1 + .4 * Math.pow(Math.max(0, Math.sin(u * TAU * 9 + .5)), 2) * sstep(.08, .14, u));
  for (let i = 0; i < NT; i++) {
    const a = i / NT * TAU + .2, el = EL[i];
    const tube = new Tube(TS, 8, tmat); bg.add(tube.mesh);
    tents.push({ tube, pts: mkPts(TS), a, len: LEN[i], dir: V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)), side: V(-Math.sin(a), 0, Math.cos(a)), B: V() });
  }
  S.part('Tentacles', 'Between five and eight hollow tentacles ring the mouth. They hold out a net of stinging cells to catch swimming prey, and they can stretch several times their resting length or shorten to tiny stubs.', tents.map(t => t.tube.mesh));
  /* nematocyst batteries */
  const PEAK = [1, 2, 3, 4, 5, 6, 7, 8].map(m => .019 + .1111 * m), NBAT = NT * PEAK.length * 4;
  const bat = inst(G.sphereLo, M.soft(0xe0b060, { emissive: 0x6a4a10, emissiveIntensity: .25 }), NBAT); bg.add(bat);
  S.part('Nematocyst batteries', 'Each swelling on a tentacle is a battery of stinging cells (cnidocytes). Every cell holds a capsule, the nematocyst, containing a coiled barbed thread that is fired when a trigger hair is touched.', bat);
  /* prey */
  const prey = new THREE.Group(); bg.add(prey);
  const pb = S.mesh(G.sphere, PM.cuticle(0xd96a3c), { parent: prey, s: V(.34, .2, .2) });
  [-1, 1].forEach(k => S.mesh(G.cylLo, PM.dark(0x8a3d1c), { parent: prey, p: V(.3, .12, k * .09), s: V(.012, .3, .012), r: [0, 0, -1.0] }));
  S.part('Captured prey', 'A small crustacean such as a water flea or copepod, paralysed by the stings. The tentacle folds toward the mouth and passes it in, and the prey is shown shrinking as it is swallowed.', prey);
  /* basal disc */
  const disc2 = S.mesh(G.cyl, PM.cuticle(0xb88a54), { parent: bg, p: V(0, y0 - .03, 0), s: V(.46, .07, .46) });
  const film = S.mesh(new THREE.TorusGeometry(.46, .03, 6, 24), M.shell(0xe8d8b0, .6), { parent: bg, p: V(0, y0 - .04, 0), r: [Math.PI / 2, 0, 0] });
  S.part('Basal disc', 'A sticky foot at the base. Gland cells release a mucus-like adhesive that anchors the animal to a stone or water plant, and it can detach to glide or tumble to a new spot.', [disc2, film]);
  /* bud */
  const bud = new THREE.Group(); bg.add(bud);
  const budBody = S.mesh(G.capsule, epiMat, { parent: bud, p: V(0, .45, 0), s: V(.34, .5, .34) });
  const budCav = S.mesh(G.capsule, M.soft(0x8ea85a, { transparent: true, opacity: .85 }), { parent: bud, p: V(0, .45, 0), s: V(.2, .36, .2) });
  const nubs = [];
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.position.set(0, .93, 0); g.rotation.set(0, i * TAU / 4, .7); bud.add(g); nubs.push(g); S.mesh(G.cone, tmat, { parent: g, s: V(.035, .42, .035) }); }
  S.part('Bud', 'A young hydra growing out of the lower third of the column. It starts as a bulge, grows a mouth and tentacles, and finally pinches off to live independently. This is the main way hydra reproduce when food is plentiful.', [budBody, budCav, ...nubs]);
  /* discharged nematocyst (enlarged) */
  const nem = new THREE.Group(); nem.position.set(3.4, -2.9, .7); nem.rotation.z = -.5; bg.add(nem);
  const caps = S.mesh(G.capsule, M.shell(0xe5c78e, .7, { bumpScale: .1 }), { parent: nem, s: V(.3, .45, .3) });
  const oper = S.mesh(G.cone, PM.dark(0x8a6a3a), { parent: nem, p: V(0, .43, 0), s: V(.1, .1, .1) });
  const thr = new Tube(40, 6, M.soft(0x8a6a3a)); nem.add(thr.mesh); const thrPts = mkPts(40);
  const barbs = []; for (let k = 0; k < 9; k++) barbs.push(S.mesh(G.cone, PM.dark(0x6a4a22), { parent: nem, s: V(.012, .08, .012) }));
  S.part('Nematocyst (discharged, enlarged)', 'The fired stinging capsule, drawn about ten times larger than life. The thread turns inside out as it shoots out, driving barbs into the prey and injecting a toxin. It is one of the fastest cellular events known, over in a few microseconds.', [caps, oper, thr.mesh, ...barbs]);

  const bz = V(), tan = V(), mC = V(), top = V(), F1 = V(), F2 = V();
  const bez = (P0, P1, P2, P3, u, o) => { const w = 1 - u, a = w * w * w, b = 3 * w * w * u, c = 3 * w * u * u, d = u * u * u; return o.set(a * P0.x + b * P1.x + c * P2.x + d * P3.x, a * P0.y + b * P1.y + c * P2.y + d * P3.y, a * P0.z + b * P1.z + c * P2.z + d * P3.z); };
  const q = new THREE.Quaternion(), p0 = V(), nn = V(), bb = V(), tt = V(), pos = V(), P0 = V(), P1 = V(), P2 = V(), P3 = V();
  const upd = t => {
    const ph2 = (t + 5) % 24, contr = .2 * sstep(0, 2.5, ph2) * (1 - sstep(5, 9, ph2)), ext = 1 - contr;
    wf = 1 + .6 * contr / .2 * .35;
    const Lc = 3.7 * ext;
    for (let i = 0; i <= NB; i++) { const s = i / NB; ptsB[i].set(.22 * Math.pow(s, 1.6) * Math.sin(t * .45), y0 + Lc * s, .12 * Math.pow(s, 1.6) * Math.sin(t * .31 + 1)); }
    epi.update(ptsB, rfOut); cav.update(ptsB, rfCav);
    top.copy(ptsB[NB]); tan.subVectors(ptsB[NB], ptsB[NB - 1]).normalize();
    const ph = t % 18, fw = sstep(3, 6.5, ph) * (1 - sstep(10, 13.5, ph)), mo = sstep(6, 7.5, ph) * (1 - sstep(9.5, 11, ph));
    mouth.position.copy(top); mouth.quaternion.copy(qFromUp(tan));
    ring.scale.setScalar(.09 + .11 * mo); disc.scale.setScalar(.075 + .11 * mo);
    mC.copy(top).addScaledVector(tan, .1);
    const ls = 1 - 1.2 * (1 - ext);
    let bi = 0;
    tents.forEach((T, ti) => {
      T.B.set(top.x + Math.cos(T.a) * .17, top.y - .04, top.z + Math.sin(T.a) * .17);
      const L = T.len * ls;
      for (let k = 0; k <= TS; k++) {
        const u = k / TS;
        pos.copy(T.B).addScaledVector(T.dir, L * u); pos.y += -.14 * L * u * u;
        pos.addScaledVector(T.side, .2 * u * Math.sin(u * 4.2 - t * 1.4 + T.a * 3)); pos.y += .1 * u * Math.cos(u * 3.1 - t * 1.1 + T.a * 2);
        if (ti === 0 && fw > 0) {
          P0.copy(T.B); P1.copy(T.B).addScaledVector(T.dir, 1.8); P1.y += 1.3;
          P2.set(mC.x + T.dir.x * .9, mC.y + 1.0, mC.z + T.dir.z * .9); P3.set(mC.x + T.dir.x * .07, mC.y + .1, mC.z + T.dir.z * .07);
          bez(P0, P1, P2, P3, u, F1); pos.lerp(F1, fw);
        }
        T.pts[k].copy(pos);
      }
      T.tube.update(T.pts, rfT);
      for (const u of PEAK) {
        const k = Math.round(u * TS), a = T.pts[Math.max(k - 1, 0)], b = T.pts[Math.min(k + 1, TS)];
        tt.subVectors(b, a).normalize(); nn.crossVectors(tt, V(0, 1, 0)); if (nn.lengthSq() < 1e-4) nn.set(1, 0, 0); nn.normalize(); bb.crossVectors(tt, nn);
        const rr = rfT(u) * .92;
        for (let m = 0; m < 4; m++) { const an = m * TAU / 4 + u * 5; p0.copy(T.pts[k]).addScaledVector(nn, Math.cos(an) * rr).addScaledVector(bb, Math.sin(an) * rr); setI(bat, bi++, p0, null, .022); }
      }
    });
    bat.instanceMatrix.needsUpdate = true;
    /* prey */
    const pv = sstep(2.5, 3.2, ph) * (1 - sstep(8.4, 9.6, ph));
    prey.position.copy(tents[0].pts[TS]); prey.scale.setScalar(Math.max(1e-4, pv)); prey.rotation.z = .5 * Math.sin(t * 6) + .4;
    /* bud */
    const ib = Math.round(.3 * NB), pbp = ptsB[ib], dirb = V(.92, .42, .1).normalize();
    bud.position.copy(pbp).addScaledVector(dirb, hyR(.3) * wf * .8); bud.quaternion.copy(qFromUp(dirb)); bud.scale.setScalar(1 + .04 * Math.sin(t * .6));
    nubs.forEach((g, i) => { g.rotation.z = .7 + .15 * Math.sin(t * 1.3 + i); });
    /* nematocyst thread */
    const nph = t % 9, pp = sstep(0, .5, nph) * (1 - sstep(5, 7.5, nph)), len = 2.0 * pp + .001;
    for (let i = 0; i <= 40; i++) { const s = i / 40, a = s * 9; thrPts[i].set(.02 * Math.cos(a), .48 + len * s, .02 * Math.sin(a)); }
    thr.update(thrPts, u => .022 * (1 - .5 * u));
    barbs.forEach((b, k) => { const a = (k % 3) * TAU / 3 + Math.floor(k / 3) * .6, y = .5 + len * (.08 + .07 * Math.floor(k / 3)); b.position.set(Math.cos(a) * .035, y, Math.sin(a) * .035); b.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); b.scale.set(.012, .08 * Math.min(1, pp * 3), .012); });
    nem.position.y = -2.9 + .05 * Math.sin(t * .8);
  };
  upd(0); S.anim(upd);
}
NEWBUILD.hydra = buildHydra;
NEW_SPEC.push({ id: 'hydra', cat: 'animals', name: 'Hydra', latin: 'Hydra vulgaris', size: 'column about 5–10 mm when extended', sizeUm: 7000, U: 9, dist: 21,
  cls: 'Animalia · Cnidaria · Hydrozoa · Hydridae', habitat: 'Clean, still or slow freshwater, attached to water plants and stones', move: 'Stays fixed by its basal disc; can glide, bend and somersault to a new spot', feed: 'Carnivore: stinging tentacles paralyse small crustaceans such as water fleas and pass them to the mouth', repro: 'Budding in good conditions; sexual reproduction with eggs and sperm in cold or poor conditions',
  desc: 'A tiny freshwater predator shaped like a tube with a ring of long, stinging tentacles. It stays anchored by a sticky foot and waits for passing prey.',
  fun: ['It can regenerate: a cut piece regrows into a whole animal, and even cells that have been separated can reassemble into a new body.', 'In laboratory studies it shows almost no sign of ageing, because stem cells keep renewing its tissues.', 'Its stinging capsules fire in a few microseconds, among the fastest events known in a single cell.', 'The green hydra, Hydra viridissima, gets its colour from algae living inside its cells. The model shows the brown Hydra vulgaris.'],
  note: 'Seven tentacles are shown at about the length of the column; real animals have roughly five to eight and can stretch them much further. The discharged nematocyst is enlarged about ten times. The feeding sequence repeats every 18 seconds and the contraction every 24 seconds; real timing varies.' });

/* ---------- Nematode (C. elegans) ---------- */
function buildNematode(S) {
  const L = 8.2, n = 90, pts = mkPts(n), bg = new THREE.Group(); S.add(bg);
  const ann = canvasTex(8, 64, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { g.fillStyle = '#b8b8b8'; g.fillRect(0, y, w, 2); } }, false); ann.repeat.set(1, 36);
  const rb = tabFn([[0, .045], [.012, .14], [.04, .23], [.15, .29], [.7, .3], [.88, .24], [.96, .1], [1, .018]]);
  const cut = new Tube(n, 22, M.shell(0xe8d9b8, .38, { bumpMap: ann, bumpScale: 1.1, roughness: .45 })); cut.mesh.renderOrder = 8; bg.add(cut.mesh);
  S.part('Cuticle', 'A tough, flexible outer skin made of collagen, secreted by the cells beneath and shed at each of four moults. Fine rings run around the body, and two ridges, the alae, run along each side. Muscles beneath pull against it, which lets the worm bend without changing length.', cut.mesh, { shell: true });
  const I = f => Math.round(f * n);
  const ph0 = I(.035), ph1 = I(.185), in0 = ph1, in1 = I(.93), ga0 = I(.335), gm = I(.5), gb1 = I(.68), bu1 = 3;
  const phMat = M.soft(0xd98f5a, { transparent: true, opacity: .92 });
  const phar = new Tube(ph1 - ph0, 14, phMat), rph = tabFn([[0, .1], [.15, .145], [.4, .155], [.55, .085], [.7, .1], [.8, .19], [.92, .19], [1, .1]]); bg.add(phar.mesh);
  const grind = new THREE.Group(); bg.add(grind); for (let k = 0; k < 3; k++) { const c = S.mesh(G.cone, PM.dark(0x3a2a1c), { parent: grind, s: V(.04, .1, .04), r: [0, 0, 0] }); c.position.set(Math.cos(k * 2.1) * .04, 0, Math.sin(k * 2.1) * .04); c.userData.k = k; }
  S.part('Pharynx', 'A muscular pump that sucks in bacteria and squeezes them back toward the gut. It pumps hundreds of times a minute, and a grinder of hard plates in the rear bulb crushes the cells before they pass into the intestine.', [phar.mesh, ...grind.children]);
  const buc = new Tube(bu1, 8, PM.dark(0x5a3d2a)); bg.add(buc.mesh);
  const lip = S.mesh(new THREE.TorusGeometry(.07, .022, 6, 12), PM.dark(0x7a5a3a), { parent: bg });
  S.part('Mouth and buccal cavity', 'The mouth opens into a short cavity ringed by lips with touch- and taste-sensing neurons. Food passes through here into the pharynx.', [buc.mesh, lip]);
  const nerve = S.mesh(new THREE.TorusGeometry(.17, .04, 8, 20), M.soft(0xf0b050, { emissive: 0x805010, emissiveIntensity: .3 }), { parent: bg });
  S.part('Nerve ring', 'A ring of nerve fibres around the pharynx acts as the animal’s brain. It receives signals from sensory neurons in the head and passes them to the nerve cord that runs along the underside.', nerve);
  const intMat = M.soft(0xb09a4e, { transparent: true, opacity: .85, roughness: .55 });
  const gut = new Tube(in1 - in0, 16, intMat), lum = new Tube(in1 - in0, 8, PM.dark(0x5a4a22)); bg.add(gut.mesh, lum.mesh);
  const gr = [], R = rng(8), NG = 70, grm = inst(G.sphereLo, M.soft(0xe0cb70), NG); bg.add(grm); for (let i = 0; i < NG; i++) gr.push({ s: lerp(.2, .9, R()), a: R() * TAU, r: .04 + R() * .08 });
  S.part('Intestine', 'A tube of just 20 large cells that digests food and absorbs nutrients. It also makes yolk for the eggs, and the granules in its cells store fat and break down waste.', [gut.mesh, lum.mesh, grm]);
  const gonMat = M.soft(0xdca58f, { transparent: true, opacity: .85 });
  const gA = new Tube(gm - ga0, 10, gonMat), gB = new Tube(gb1 - gm, 10, gonMat); bg.add(gA.mesh, gB.mesh);
  const OC = 12, ooc = inst(G.sphere, M.soft(0xf4c8b8, { roughness: .45 }), OC); bg.add(ooc);
  S.part('Gonad and oocytes', 'The reproductive organ has two arms. Germ cells at the far tips divide and move toward the middle, growing into large egg cells (oocytes). The worm is a self-fertilising hermaphrodite, so its own sperm fertilise the eggs.', [gA.mesh, gB.mesh, ooc]);
  const EG = 3, egg = inst(G.sphere, M.shell(0xf2e8d0, .75, { bumpScale: .1 }), EG), emb = inst(G.sphere, M.soft(0xe8c2a6), EG); bg.add(egg, emb);
  S.part('Eggs in uterus', 'Fertilised eggs sit in the uterus, each inside a protective shell, and begin to develop before they are laid. A worm usually lays around 300 eggs in its life.', [egg, emb]);
  const vul = S.mesh(new THREE.TorusGeometry(.07, .025, 6, 12), PM.dark(0x8a6a4a), { parent: bg });
  S.part('Vulva', 'An opening on the underside near the middle of the body. Muscles open it so that eggs can be laid.', vul);
  const anus = S.mesh(G.sphere, PM.dark(0x3a2a1c), { parent: bg, s: V(.05, .035, .05) });
  S.part('Anus', 'The exit of the digestive tract, near the tail on the underside. Muscles around it open it to expel waste.', anus);

  const gp = mkPts(gm - ga0), gq = mkPts(gb1 - gm), tmpA = V(), tmpT = V(), Nv = V(), Zv = V(0, 0, 1), qq = new THREE.Quaternion();
  const sub = (a, b) => pts.slice(a, b + 1);
  const offs = (a, b, z, arr) => { for (let i = a; i <= b; i++) arr[i - a].set(pts[i].x, pts[i].y, pts[i].z + z); return arr; };
  const at = (s, o, tg) => { const f = clamp(s, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)); o.lerpVectors(pts[i], pts[i + 1], f - i); tg.subVectors(pts[i + 1], pts[i]).normalize(); return o; };
  const ocD = [], egD = []; for (let k = 0; k < 5; k++) { const f = k / 4; ocD.push({ s: lerp(.395, .488, f), sz: lerp(.07, .115, f) }); ocD.push({ s: lerp(.605, .512, f), sz: lerp(.07, .115, f) }); } ocD.push({ s: .365, sz: .05 }, { s: .635, sz: .05 }); egD.push(.452, .5, .548);
  const X = V(1, 0, 0);
  const upd = t => {
    let x = 0, y = 0; const ds = L / n;
    for (let i = 0; i <= n; i++) { const s = i / n, a = .85 * (.45 + .55 * sstep(0, .35, s)) * Math.sin(TAU * 1.3 * s - 2.0 * t); pts[i].set(x, y, 0); x += Math.cos(a) * ds; y += Math.sin(a) * ds; }
    const ang = Math.atan2(pts[n].y - pts[0].y, pts[n].x - pts[0].x), c = Math.cos(-ang), sn = Math.sin(-ang); let mx = 0, my = 0;
    for (const p of pts) { const X1 = p.x * c - p.y * sn, Y1 = p.x * sn + p.y * c; p.x = X1; p.y = Y1; mx += X1; my += Y1; } mx /= n + 1; my /= n + 1;
    for (const p of pts) { p.x = -(p.x - mx); p.y -= my; }
    cut.update(pts, rb);
    phar.update(sub(ph0, ph1), rph); buc.update(sub(0, bu1), () => .05);
    gut.update(sub(in0, in1), u => .02 + .115 * sstep(0, .04, u) * (1 - .5 * sstep(.9, 1, u)) + .012 * Math.sin(u * 40)); lum.update(sub(in0, in1), () => .03);
    gA.update(offs(ga0, gm, .12, gp), u => .05 + .02 * u); gB.update(offs(gm, gb1, .12, gq), u => .07 - .02 * u);
    /* head parts */
    at(0, tmpA, tmpT); lip.position.copy(tmpA); lip.quaternion.setFromUnitVectors(Zv, tmpT);
    at(.095, tmpA, tmpT); nerve.position.copy(tmpA); nerve.quaternion.setFromUnitVectors(Zv, tmpT);
    at(.165, tmpA, tmpT); grind.position.copy(tmpA); grind.quaternion.copy(qFromUp(tmpT));
    /* gut granules */
    for (let i = 0; i < NG; i++) { const g = gr[i]; at(g.s, tmpA, tmpT); Nv.set(-tmpT.y, tmpT.x, 0); tmpA.addScaledVector(Nv, Math.cos(g.a) * g.r).addScaledVector(Zv, Math.sin(g.a) * g.r); setI(grm, i, tmpA, null, .03); } grm.instanceMatrix.needsUpdate = true;
    /* oocytes */
    ocD.forEach((o, i) => { at(o.s, tmpA, tmpT); tmpA.z += .12; qq.setFromUnitVectors(X, tmpT); setI(ooc, i, tmpA, qq, V(o.sz * 1.25, o.sz, o.sz)); }); ooc.instanceMatrix.needsUpdate = true;
    egD.forEach((s, i) => { at(s, tmpA, tmpT); tmpA.z -= .1; qq.setFromUnitVectors(X, tmpT); setI(egg, i, tmpA, qq, V(.15, .105, .105)); setI(emb, i, tmpA, qq, V(.1, .07, .07)); }); egg.instanceMatrix.needsUpdate = true; emb.instanceMatrix.needsUpdate = true;
    /* vulva, anus on the underside (+N side) */
    at(.5, tmpA, tmpT); Nv.set(-tmpT.y, tmpT.x, 0); vul.position.copy(tmpA).addScaledVector(Nv, .3); vul.quaternion.setFromUnitVectors(Zv, Nv);
    at(.92, tmpA, tmpT); Nv.set(-tmpT.y, tmpT.x, 0); anus.position.copy(tmpA).addScaledVector(Nv, .17);
    /* pumping grinder */
    grind.scale.setScalar(1 + .25 * Math.max(0, Math.sin(t * 9)));
  };
  upd(0); S.anim(upd);
}
NEWBUILD.nematode = buildNematode;
NEW_SPEC.push({ id: 'nematode', cat: 'animals', name: 'Nematode', latin: 'Caenorhabditis elegans', size: 'about 1 mm (adult)', sizeUm: 1000, U: 8.4, dist: 17,
  cls: 'Animalia · Nematoda · Chromadorea · Rhabditidae', habitat: 'Soil and rotting fruit or plant matter rich in bacteria; grown on agar plates in laboratories', move: 'Crawls or swims in S-shaped waves, by alternately contracting muscles on its upper and lower sides', feed: 'Bacterivore: pumps in bacteria and crushes them in the pharynx', repro: 'Mostly self-fertilising hermaphrodites; rare males mate with them; about 300 offspring per worm',
  desc: 'A transparent roundworm about a millimetre long, and one of the most studied animals in biology. You can see its organs, eggs and even individual cells through its skin.',
  fun: ['An adult hermaphrodite has exactly 959 body cells, and 302 of them are neurons.', 'It was the first multicellular animal to have its genome fully sequenced, in 1998.', 'Work on this worm earned Nobel Prizes for programmed cell death, RNA interference and the use of green fluorescent protein as a marker.', 'It lives only two to three weeks, so researchers can follow a whole life, and the effects of ageing, in a short time.'],
  note: 'Organ positions are simplified, and the gonad arms are drawn straight, whereas in the worm each arm loops back on itself. Cuticle rings are exaggerated for visibility. The undulation is a stylised version of real crawling.' });

/* ---------- Gastrotrich (Chaetonotus) ---------- */
function buildGastrotrich(S) {
  const L = 6.4, rf = tabFn([[0, .05], [.04, .18], [.12, .34], [.3, .5], [.65, .52], [.8, .36], [.88, .3], [.93, .44], [.98, .4], [1, .1]]);
  const sweep = new THREE.Group(); sweep.position.set(-3.2, 0, 0); S.add(sweep);
  const root = new THREE.Group(); root.position.set(3.2, 0, 0); root.rotation.z = -Math.PI / 2; sweep.add(root);
  const flat = new THREE.Group(); flat.scale.set(.62, 1, 1); root.add(flat);
  const bump = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = ((y / 8) % 2) * 8; x < w; x += 16) { g.fillStyle = '#b4b4b4'; g.beginPath(); g.ellipse(x + 4, y + 4, 6, 3.4, 0, 0, TAU); g.fill(); } }, false); bump.repeat.set(3, 10);
  const body = S.mesh(latheBody(L, rf, 70, 40), M.shell(0xe3cba0, .42, { bumpMap: bump, bumpScale: .8, roughness: .45 }), { parent: flat, ro: 8 });
  S.part('Cuticle', 'The body is covered by a clear cuticle formed into overlapping plates. The animal is flattened underneath and arched on top, and it is divided into a head with several lobes, a neck and a trunk that ends in a forked tail.', body, { shell: true });
  /* scales and spines (dorsal = local -x) */
  const NSC = 7 * 20, sc = inst(G.sphereLo, PM.cuticle(0xc9b184), NSC), sp = inst(G.cone, PM.dark(0x8a7248), NSC), R = rng(6), qd = new THREE.Quaternion();
  for (let r = 0; r < 7; r++) for (let k = 0; k < 20; k++) {
    const u = lerp(.15, .87, (k + (r % 2) * .5) / 20), ph = Math.PI + (r - 3) * .33, rr = rf(u) * 1.01;
    const P = V(rr * Math.cos(ph), (u - .5) * L, rr * Math.sin(ph)), Nn = V(Math.cos(ph), -.1, Math.sin(ph)).normalize();
    setI(sc, r * 20 + k, P, qFromUp(Nn), V(.16, .05, .12));
    const d = Nn.clone().multiplyScalar(.7).add(V(0, -.7, 0)).normalize(), ln = .28 + .22 * (1 - u);
    setI(sp, r * 20 + k, P, qFromUp(d), V(.025, ln, .025));
  }
  flat.add(sc, sp);
  S.part('Dorsal scales and spines', 'Rows of keeled scales cover the back, and in Chaetonotus each scale carries a spine that points backward. The spines are thought to protect the animal, and they grow longer toward the tail.', [sc, sp]);
  /* ventral cilia (ventral = local +x) */
  const vp = [], vn = [];
  [-1, 1].forEach(sd => { for (let k = 0; k < 90; k++) { const u = lerp(.12, .9, k / 89), ph = sd * .5 + .05 * Math.sin(k * 1.7), rr = rf(u), e = .012, sl = (rf(Math.min(1, u + e)) - rf(Math.max(0, u - e))) / (2 * e * L); vp.push(V(rr * Math.cos(ph), (u - .5) * L, rr * Math.sin(ph))); vn.push(V(Math.cos(ph), -sl, Math.sin(ph)).normalize()); } });
  const cm = M.soft(0xa8946a);
  const vc = ciliaSet(S, cm, vp, vn, { len: .26, r: .013, amp: .8, speed: 9, wave: 3, axis: V(0, 1, 0), seed: 2, parent: flat });
  S.part('Ventral ciliary bands', 'Two bands of cilia run along the flat underside. Their steady beating makes the animal glide smoothly over surfaces, and gives the group its name, which means hairy stomach.', vc);
  const hp = [], hn = []; for (let k = 0; k < 40; k++) { const u = lerp(.89, .98, R()), ph = R() * TAU, rr = rf(u); hp.push(V(rr * Math.cos(ph), (u - .5) * L, rr * Math.sin(ph))); hn.push(V(Math.cos(ph), 0, Math.sin(ph))); }
  const hc = ciliaSet(S, cm, hp, hn, { len: .32, r: .013, amp: .6, speed: 7, wave: 2, axis: V(0, -1, 0), seed: 3, parent: flat });
  S.part('Head cilia tufts', 'Tufts of cilia on the head lobes sweep bacteria and algae toward the mouth, and also help the animal sense its surroundings.', hc);
  const bp = [], bn = []; for (let k = 0; k < 12; k++) { const ph = k / 12 * TAU, rr = .3; bp.push(V(rr * Math.cos(ph), L / 2 - .03, rr * Math.sin(ph))); bn.push(V(Math.cos(ph) * .35, 1, Math.sin(ph) * .35).normalize()); }
  const bc = ciliaSet(S, PM.dark(0x7a6844), bp, bn, { len: .6, r: .012, amp: .18, speed: 1.6, wave: 0, axis: V(0, 1, 0), seed: 4, parent: flat });
  S.part('Sensory bristles', 'Long, stiff bristles at the front of the head detect touch and water movements. The animal sweeps its head from side to side as it searches for food.', bc);
  /* mouth and pharynx */
  const mouth = S.mesh(new THREE.TorusGeometry(.13, .04, 8, 18), PM.dark(0x7a4a2a), { parent: flat, p: V(0, L / 2 - .06, 0), r: [Math.PI / 2, 0, 0] });
  const mdisc = S.mesh(new THREE.CircleGeometry(.11, 16), new THREE.MeshStandardMaterial({ color: 0x2a1a12, side: THREE.DoubleSide }), { parent: flat, p: V(0, L / 2 - .065, 0), r: [-Math.PI / 2, 0, 0] });
  const pharG = latheBody(1.35, tabFn([[0, .1], [.2, .15], [.55, .17], [.8, .14], [.9, .2], [1, .12]]), 30, 20);
  const phar = S.mesh(pharG, M.soft(0xc98770, { transparent: true, opacity: .9 }), { parent: flat, p: V(0, L / 2 - .9, 0) });
  S.part('Mouth and pharynx', 'The mouth at the tip of the head leads into a muscular tube, the pharynx, that pumps food backward. Bacteria, algae and fragments of detritus are drawn in and passed to the intestine.', [mouth, mdisc, phar]);
  const brain = [-1, 1].map(k => S.mesh(G.sphere, M.soft(0xd9b26a), { parent: flat, p: V(0, L / 2 - .6, k * .17), s: V(.13, .13, .12) }));
  S.part('Brain', 'A pair of nerve clusters (ganglia) above the pharynx. They control movement of the head, cilia and body, and receive signals from the sensory bristles.', brain);
  const gutG = latheBody(L / 2 + .6, u => (.1 + .16 * sstep(0, .1, u)) * (1 - .55 * sstep(.88, 1, u)) * (1 + .06 * Math.sin(u * 25)), 40, 20);
  const gut = S.mesh(gutG, M.soft(0x9aa85a, { transparent: true, opacity: .88 }), { parent: flat, p: V(0, L / 2 - 1.4 - (L / 2 + .6) / 2, 0) });
  S.part('Intestine', 'A straight tube that digests the food and absorbs the nutrients, ending in an anus on the underside near the tail.', gut);
  const eggM = S.mesh(G.sphere, M.shell(0xf4ecd8, .68, { bumpMap: bump, bumpScale: .6 }), { parent: flat, p: V(0, -.95, 0), s: V(.3, .55, .3) });
  const emb = S.mesh(G.sphere, M.soft(0xe8c2a6), { parent: flat, p: V(0, -.95, 0), s: V(.2, .4, .2) });
  const egg2 = S.mesh(G.sphere, M.soft(0xf0d4bc, { transparent: true, opacity: .8 }), { parent: flat, p: V(0, -1.9, 0), s: V(.14, .2, .14) });
  S.part('Egg', 'A freshwater Chaetonotus is mostly female and reproduces without mating. It lays only a few large eggs, often just one at a time, and eggs laid for the winter have thick shells.', [eggM, emb, egg2]);
  /* forked tail */
  const prongs = [];
  [-1, 1].forEach(k => {
    const g = new THREE.Group(); g.position.set(0, -L / 2 + .15, k * .1); root.add(g);
    const a = V(0, 0, 0), b = V(0, -.9, k * .4);
    S.mesh(G.sphere, PM.cuticle(0xd6bc8a), { parent: g, s: .05 }); g.add(rod(a, b, .11, .05, PM.cuticle(0xd6bc8a), 8));
    const tip = rod(b, V(0, -1.25, k * .55), .04, .02, PM.dark(0x7a6844), 6); g.add(tip);
    const drop = S.mesh(G.sphere, M.shell(0xe8d8a8, .8), { parent: g, p: V(0, -1.28, k * .56), s: .045 });
    g.userData.k = k; prongs.push(g);
  });
  S.part('Forked tail and adhesive tubes', 'The trunk ends in two prongs, each with a hollow tube that releases a sticky secretion from glands. The animal attaches and releases in turn, so it can hold on in a current or inch along.', prongs);
  S.anim(t => { sweep.rotation.y = .12 * Math.sin(t * .9); sweep.position.x = -3.2 + .4 * Math.sin(t * .4); root.rotation.x = .04 * Math.sin(t * 1.3); prongs.forEach(g => { g.rotation.y = g.userData.k * .1 * Math.sin(t * 1.3); g.rotation.x = .05 * Math.sin(t * 2.1 + g.userData.k); }); });
}
NEWBUILD.gastrotrich = buildGastrotrich;
NEW_SPEC.push({ id: 'gastrotrich', cat: 'animals', name: 'Gastrotrich', latin: 'Chaetonotus sp.', size: 'about 100–300 µm', sizeUm: 200, U: 7.2, dist: 14.5,
  cls: 'Animalia · Gastrotricha · Chaetonotida', habitat: 'Ponds, mosses, wet sediments and damp soil; related genera live in the sea', move: 'Glides over surfaces on ventral cilia; adhesive tubes on the tail anchor it', feed: 'Sweeps bacteria, algae and detritus into the mouth with head cilia', repro: 'Freshwater species are mostly female and lay a few large eggs without mating',
  desc: 'A small, flattened, strap-shaped animal with a spiny back and two rows of cilia on its underside. Hairy-bellied is the literal meaning of its group name.',
  fun: ['About 800 species of gastrotrich are known, living in water films, sediments and the sea.', 'The name Chaetonotus means bristle-back, after the spines on its upper surface.', 'Each tail prong has a duo-gland adhesive tube: one gland sticks, another releases, so the animal can hold on and let go.', 'Its tiny size means it lives within the thin film of water between sand grains and plant surfaces.'],
  note: 'The number of scales, spines and cilia is reduced and their pattern simplified. Cilia are drawn longer than in life for visibility, and the egg is shown larger relative to the body than in many species.' });

/* ---------- Volvox ---------- */
function buildVolvox(S) {
  const R0 = 2.8, N = 1500, bg = new THREE.Group(); S.add(bg);
  const jelly = S.mesh(new THREE.SphereGeometry(1, 48, 32), M.glass(0xb7d3a2, .16, { roughness: .05 }), { parent: bg, s: R0 * 1.03, ro: 9 });
  S.part('Jelly matrix', 'A transparent, jelly-like layer of glycoprotein holds the colony together. The cells sit in its surface, and it fills most of the sphere with water-rich gel.', jelly, { shell: true });
  const dirs = fib(N), cells = inst(new THREE.SphereGeometry(1, 8, 6), M.soft(0xffffff, { roughness: .45 }), N), cr = rng(11), col = new THREE.Color();
  dirs.forEach((d, i) => { setI(cells, i, d.clone().multiplyScalar(R0), qFromUp(d), V(.085, .055, .085)); col.setHSL(.27 + .04 * cr(), .55, .3 + .12 * cr()); cells.setColorAt(i, col); });
  cells.instanceColor.needsUpdate = true; bg.add(cells);
  S.part('Somatic cells', 'Thousands of small green cells form a single layer on the surface. Each has a cup-shaped chloroplast for photosynthesis, and the cells are linked by thin cytoplasmic bridges, so the colony behaves like one organism.', cells);
  const fp = [], fn = []; dirs.forEach(d => { const tg = perpBasis(d).multiplyScalar(.03); [-1, 1].forEach(k => { fp.push(d.clone().multiplyScalar(R0 + .05).addScaledVector(tg, k)); fn.push(d.clone()); }); });
  const fl = ciliaSet(S, M.soft(0x6f9a4a), fp, fn, { len: .38, r: .011, amp: .8, speed: 9, wave: 2.2, axis: V(0, -1, 0), seed: 5, parent: bg });
  S.part('Flagella', 'Each somatic cell has two flagella that point outward. Together they beat backward and make the colony swim, rolling as it goes, usually toward gentle light.', fl);
  const eyeD = dirs.filter((d, i) => d.y > -.2 && i % 3 === 0), eyes = inst(G.sphereLo, M.soft(0xd0502a, { emissive: 0x701800, emissiveIntensity: .4 }), eyeD.length);
  eyeD.forEach((d, i) => setI(eyes, i, d.clone().multiplyScalar(R0 + .045), null, .022 + .022 * sstep(-.2, .9, d.y))); bg.add(eyes);
  S.part('Eyespots', 'Each cell has an orange-red eyespot that senses light. Those at the front are larger, which helps the colony steer toward light by changing how its flagella beat.', eyes);
  const gon = [];
  for (let i = 0; i < 9; i++) { const lowPts = fib(30).filter(v => v.y < -.1), d = lowPts[Math.floor(i * lowPts.length / 9)]; gon.push(S.mesh(G.sphere, M.soft(0x2f7d32, { sheen: 1 }), { parent: bg, p: d.clone().multiplyScalar(R0 - .14), s: .2 })); }
  S.part('Gonidia', 'A few large cells at the rear of the colony do not swim. They are reproductive cells: each divides repeatedly to make a new colony, which is released when the parent breaks open.', gon);
  const daus = [], DP = [[.5, -.6, .4, .75], [-.9, .1, -.7, .65], [.3, .7, -.9, .55]];
  DP.forEach(([x, y, z, r], k) => {
    const g = new THREE.Group(); g.position.set(x, y, z); bg.add(g);
    const sh = S.mesh(new THREE.SphereGeometry(1, 32, 20), M.shell(0x8bbf5a, .4, { bumpScale: .1 }), { parent: g, s: r });
    const dd = fib(130), im = inst(new THREE.SphereGeometry(1, 6, 4), M.soft(0x2f7d32), 130); dd.forEach((d, i) => setI(im, i, d.clone().multiplyScalar(r), null, .035)); g.add(im);
    daus.push({ g, k, base: V(x, y, z) }); S.part('Daughter colony ' + (k + 1), 'A new colony growing inside the parent. It starts as a single gonidium, divides into a hollow ball of cells and later turns itself inside out so that its flagella face outward.', [sh, im]);
  });
  S.anim(t => {
    bg.rotation.set(.25, t * .15, 0);
    daus.forEach(({ g, k, base }) => { g.rotation.set(t * .3 + k, t * .4 + k * 2, 0); g.position.set(base.x + .08 * Math.sin(t * .5 + k), base.y + .08 * Math.cos(t * .4 + k * 2), base.z); });
  });
}
NEWBUILD.volvox = buildVolvox;
NEW_SPEC.push({ id: 'volvox', cat: 'algae', name: 'Volvox', latin: 'Volvox globator', size: 'colony about 0.5–1 mm across', sizeUm: 700, U: 6.4, dist: 14,
  cls: 'Eukaryota · Viridiplantae · Chlorophyta · Chlorophyceae · Volvocaceae', habitat: 'Freshwater ponds, ditches and puddles with plenty of light and nutrients', move: 'Swims by beating thousands of flagella, rolling slowly and heading toward light', feed: 'Photosynthesis; it makes its own food from light', repro: 'Asexual: large cells divide to form daughter colonies inside; sexual reproduction with eggs and sperm in poor conditions',
  desc: 'A hollow ball of green cells that rolls through pond water as a single organism. It is a classic example of a simple multicellular life form.',
  fun: ['Antonie van Leeuwenhoek described it in 1700, after seeing it through one of his early microscopes.', 'It divides labour: most cells swim and photosynthesise, while a few rear cells are set aside to make the next generation.', 'Daughter colonies form inside, then turn themselves inside out, an event called inversion.', 'Its flagella beat in coordination even though no single cell controls them all.'],
  note: 'The model shows about 1,500 cells; real colonies hold anywhere from roughly 500 to many thousands, depending on the species. Cells and flagella are enlarged compared with the colony for visibility, and inversion of the daughter colonies is not shown.' });
}
