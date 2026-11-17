/* ================= F5: fungi - yeast, Aspergillus, Penicillium, Rhizopus, Candida ================= */
const f5q = new THREE.Quaternion(), f5e = new THREE.Euler(), f5p = V(), f5s = V();
/* rotate d by ang about an axis perpendicular to d at azimuth az */
const f5Cone = (d, ang, az) => { const s = perpBasis(d), t = V().crossVectors(d, s); const ax = s.multiplyScalar(Math.cos(az)).addScaledVector(t, Math.sin(az)); return d.clone().applyAxisAngle(ax, ang).normalize(); };
/* rough (warty) sphere for spores */
function f5Rough(seed, amp, w = 10, h = 8, ridge = 0) {
  const g = new THREE.SphereGeometry(1, w, h), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = fbm(x * 2.6 + seed, y * 2.6 + seed * .7, z * 2.6 + seed * .3) + ridge * Math.max(0, noise3(x * 5 + seed, y * 5, z * 5 - seed));
    const r = 1 + amp * n; p.setXYZ(i, x * r, y * r, z * r);
  }
  g.computeVertexNormals(); return g;
}
const f5Lathe = (rf, nU = 14, nSeg = 10) => { const g = latheBody(1, rf, nU, nSeg); g.translate(0, .5, 0); return g; };
const f5GMet = f5Lathe(u => (.6 + .4 * u) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (u - .86) / .14), 2))), 14, 10);
const f5GPhi = f5Lathe(u => u < .45 ? .22 + .28 * Math.sin(u / .45 * Math.PI / 2) : u < .82 ? lerp(.5, .15, sstep(.45, .82, u)) : (.15 + (u > .94 ? .04 : 0)) * (u > .985 ? .6 : 1), 22, 10);
const f5GSeg = (() => { const g = new THREE.CylinderGeometry(.8, 1, 1, 8, 1); g.translate(0, .5, 0); return g; })();
const f5GSept = new THREE.LatheGeometry([V2(.12, -.5), V2(1, -.5), V2(1, .5), V2(.12, .5), V2(.12, -.5)], 16);
const f5GRing = new THREE.TorusGeometry(1, .09, 6, 18);
const f5Z = V(0, 0, 1);
/* instanced oriented items [{b,d,L,r}] */
function f5Items(S, geo, mat, items, parent) {
  const m = inst(geo, mat, items.length);
  items.forEach((o, i) => setI(m, i, o.b, qFromUp(o.d), V(o.r, o.L, o.r)));
  S.add(m, parent); return m;
}
/* chains of spores that are born at the base, travel outward and drop away at the tip */
function f5Chains(S, mat, geo, bases, dirs, o = {}) {
  const { count = 8, r = .08, gap = 2.1, speed = .05, sway = .1, seed = 3, parent = null } = o;
  const nC = bases.length, n = nC * count, mesh = inst(geo, mat, n), R = rng(seed), off = [], perp = [], ph = [], rot = [];
  for (let i = 0; i < nC; i++) { off.push(R()); perp.push(perpBasis(dirs[i]).applyAxisAngle(dirs[i], R() * TAU)); ph.push(R() * TAU); }
  for (let k = 0; k < n; k++) rot.push(new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 6, R() * 6, R() * 6)));
  const len = r * gap * count, p = V();
  const upd = t => {
    let k = 0;
    for (let i = 0; i < nC; i++) {
      const f = (t * speed + off[i]) % 1, b = bases[i], d = dirs[i], pp = perp[i], w = Math.sin(t * .9 + ph[i]) * sway * len;
      for (let j = 0; j < count; j++, k++) {
        const m = j + f, q = m / count, sc = sstep(0, 1.2, m) * (1 - sstep(count - 1.3, count, m));
        p.copy(b).addScaledVector(d, m * r * gap).addScaledVector(pp, w * q * q);
        setI(mesh, k, p, rot[k], r * sc);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0); S.anim(upd); S.add(mesh, parent); return mesh;
}
/* a hypha: tube along a curve with optional septa (discs with a pore + rings) and closed end caps */
function f5Hypha(S, parent, pts, r, mat, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5), len = curve.getLength();
  const mesh = tubeCurve(curve, o.seg || Math.max(24, Math.round(len * 14)), 12, o.rf || r, mat); mesh.renderOrder = o.ro || 8; parent.add(mesh);
  const caps = [], rr = o.rf ? o.rf(0) : r;
  [0, 1].forEach(e => { if (o.cap === false && e === 1) return; const c = new THREE.Mesh(G.sphereMid, mat); c.scale.setScalar((o.rf ? o.rf(e) : r) * 1.0); c.position.copy(curve.getPointAt(e)); c.renderOrder = o.ro || 8; parent.add(c); caps.push(c); });
  const sep = [];
  if (o.septa) {
    const us = []; for (let d = o.s0 === undefined ? o.septa * .6 : o.s0; d < len * .97; d += o.septa) us.push(d / len);
    const sd = inst(f5GSept, o.sMat, us.length), sr = inst(f5GRing, o.sMat, us.length);
    us.forEach((u, i) => { const p = curve.getPointAt(u), tg = curve.getTangentAt(u), rad = o.rf ? o.rf(u) : r; setI(sd, i, p, qFromUp(tg), V(rad * .96, .035, rad * .96)); setI(sr, i, p, f5q.clone().setFromUnitVectors(f5Z, tg), rad * 1.0); });
    parent.add(sd, sr); sep.push(sd, sr);
  }
  return { mesh, curve, caps, sep, all: [mesh, ...caps], len };
}
const f5Sway = (g, a, b, ax = .02) => t => { g.rotation.y = Math.sin(t * .13 + a) * b; g.rotation.z = Math.sin(t * .21 + a) * ax; g.rotation.x = Math.sin(t * .17 + a * 2) * ax; };

/* ---------- Aspergillus ---------- */
function buildAsperg(S) {
  const R = rng(11), g = new THREE.Group(); S.add(g); g.position.y = -.2;
  const mHy = M.shell(0xe6d6ae, .5, { bumpScale: .15, roughness: .45 }), mStipe = M.soft(0xe4d6b0, { roughness: .5 }), mVes = M.soft(0xd6c78f, { bumpMap: TEX.grain, bumpScale: .6 }),
    mMet = M.soft(0xc4b87a), mPhi = M.soft(0xa9a85a), mCon = M.grain(0x586a26, { roughness: .6, bumpScale: 2 }), mFoot = M.soft(0xc9b678, { roughness: .5 }), mSep = M.soft(0xa68f58);
  const yh = -3.3;
  const hy = f5Hypha(S, g, [V(-3.9, yh, .3), V(-2.6, yh + .1, .1), V(-1.1, yh, 0), V(1.1, yh + .05, 0), V(2.6, yh - .1, -.15), V(4, yh + .05, -.3)], .17, mHy, { septa: 1.0, s0: .4, sMat: mSep });
  const br1 = f5Hypha(S, g, [V(-2.3, yh + .1, .1), V(-2.6, yh + .9, .2), V(-3.3, yh + 1.5, .5), V(-3.9, yh + 2.1, .4)], .13, mHy, { septa: .85, s0: .5, sMat: mSep });
  const br2 = f5Hypha(S, g, [V(2.0, yh - .05, -.1), V(2.6, yh + .7, .1), V(3.0, yh + 1.5, .3)], .12, mHy, { septa: .8, s0: .5, sMat: mSep });
  const br3 = f5Hypha(S, g, [V(.9, yh + .02, 0), V(1.4, yh - .5, .3), V(1.6, yh - .9, .5)], .11, mHy, { septa: .5, s0: .35, sMat: mSep });
  const footG = new THREE.CapsuleGeometry(.27, 1.0, 6, 18); footG.rotateZ(Math.PI / 2);
  const foot = S.mesh(footG, mFoot, { p: V(0, yh + .02, 0), parent: g });
  const sc = new THREE.CatmullRomCurve3([V(0, yh + .1, 0), V(.1, -2.1, .06), V(-.05, -.9, -.04), V(.02, .1, 0)]);
  const stipe = tubeCurve(sc, 40, 12, s => .12 + .035 * s, mStipe); g.add(stipe);
  const vc = V(0, .85, 0), vr = .78;
  const ves = S.mesh(new THREE.SphereGeometry(1, 48, 32), mVes, { p: vc, s: vr, parent: g });
  const dirs = fib(52).filter(d => d.y > -.5), met = [], phi = [], cb = [], cd = [];
  dirs.forEach(d => {
    const b = vc.clone().addScaledVector(d, vr * .97), ml = .36, tip = b.clone().addScaledVector(d, ml * .95);
    met.push({ b, d, L: ml, r: .085 });
    const az = R() * TAU;
    [-1, 1].forEach(sg => {
      const dp = f5Cone(d, .42 * sg, az), pl = .36, pt = tip.clone().addScaledVector(dp, pl * .97);
      phi.push({ b: tip, d: dp, L: pl, r: .1 }); cb.push(pt); cd.push(dp.clone().lerp(d, .35).normalize());
    });
  });
  const metM = f5Items(S, f5GMet, mMet, met, g), phiM = f5Items(S, f5GPhi, mPhi, phi, g);
  const conG = f5Rough(3, .22, 9, 7, .5);
  const con = f5Chains(S, mCon, conG, cb, cd, { count: 8, r: .082, gap: 2.1, speed: .045, sway: .07, seed: 8, parent: g });
  S.part('Conidia', 'Round, dark olive spores with a rough, warty wall, about 2–4 µm across. They form in long dry chains with the youngest at the base, and each phialide keeps adding new ones. The rough pigmented wall protects the spore from UV light and drying, and helps it ride the air.', con);
  S.part('Phialides', 'Flask-shaped cells that sit on the metulae. Each one makes conidia by budding from its narrow tip, so the chain grows from the base, not from the end. The phialide itself does not get shorter as it makes hundreds of spores.', phiM);
  S.part('Metulae', 'A first layer of short, club-shaped cells on the vesicle that carry the phialides. Species with both metulae and phialides are called biseriate (two series), as shown here. Species with phialides alone are uniseriate.', metM);
  S.part('Vesicle', 'The swollen tip of the stipe. Its surface is covered with metulae in all directions, which gives the head a round, radiate look that gave the genus its name, after the aspergillum used to sprinkle holy water.', ves);
  S.part('Stipe', 'The long, upright stalk of the conidiophore. It is a single thick-walled cell with no cross walls, and it lifts the spore head up into the moving air.', stipe);
  S.part('Foot cell', 'A thick-walled, swollen hyphal cell. It anchors the conidiophore, and the stipe grows up from it at an angle to the supporting hypha.', foot);
  S.part('Septate hyphae', 'Fine tubes divided by cross walls (septa), each with a central pore that lets cytoplasm and nuclei pass. Side branches form near the base, and together the hyphae make up the mycelium that feeds on the substrate.', [...hy.all, ...br1.all, ...br2.all, ...br3.all, ...hy.sep, ...br1.sep, ...br2.sep, ...br3.sep], { shell: true });
  const sw = f5Sway(g, 1.3, .28, .015); S.anim(t => { sw(t); g.position.y = -.2 + Math.sin(t * .35) * .05; });
}
NEWBUILD.aspergillus = buildAsperg;
NEW_SPEC.push({ id: 'aspergillus', cat: 'fungi', name: 'Aspergillus', latin: 'Aspergillus niger (conidiophore)', size: 'conidium 3–5 µm; conidiophore 0.5–3 mm tall', sizeUm: 3000, U: 7.4, dist: 16,
  cls: 'Eukaryota · Fungi · Ascomycota · Eurotiomycetes', habitat: 'Soil, decaying plants, stored food, and indoor air worldwide', move: 'Non-motile; hyphae extend at their tips and spores travel on air currents', feed: 'Absorbs nutrients: digests food outside the cell with secreted enzymes', repro: 'Asexual: chains of conidia from phialides on the vesicle; some species also reproduce sexually',
  desc: 'The spore-bearing head of a mould. A tall stalk rises from a foot cell on a septate hypha and ends in a round vesicle covered with metulae and flask-shaped phialides, which shed long chains of rough olive spores.',
  fun: ['Aspergillus niger is used industrially to make most of the world\'s citric acid.', 'One conidiophore can release many thousands of spores, and the spores are in almost every breath of indoor and outdoor air.', 'Aspergillus oryzae is used to make soy sauce, miso and sake.', 'Aspergillus fumigatus can cause serious lung infections in people with weakened immunity.'],
  note: 'Cell sizes follow real proportions, but a real head carries many more chains than are shown and the spores are about a thousand times smaller than the stalk is long, so the head is drawn large. The spore colour is artistic: A. niger spores are nearly black and A. fumigatus spores are grey-green.' });

/* ---------- Penicillium ---------- */
function buildPenic(S) {
  const R = rng(23), g = new THREE.Group(); S.add(g); g.position.y = .55;
  const mHy = M.shell(0xe9dfc2, .5, { bumpScale: .15, roughness: .45 }), mStipe = M.soft(0xe9dfc2, { roughness: .5 }), mRam = M.soft(0xdcd1aa), mMet = M.soft(0xc9c48f), mPhi = M.soft(0xb0b878), mCon = M.grain(0x7d9a72, { roughness: .6, bumpScale: 1.2 }), mSep = M.soft(0xa99262);
  const yh = -3.3, B = { ram: [], met: [], phi: [], cb: [], cd: [], cb2: [], cd2: [] };
  function head(base, up, sc, nR, cbA, cdA) {
    for (let a = 0; a < nR; a++) {
      const d = f5Cone(up, .5 + R() * .15, a / nR * TAU + R() * .4), rl = .62 * sc, rt = base.clone().addScaledVector(d, rl);
      B.ram.push({ b: base, d, L: rl, r: .075 * sc });
      for (let m = 0; m < 3; m++) {
        const dm = f5Cone(d, .42 + R() * .1, m / 3 * TAU + a), ml = .5 * sc, mt = rt.clone().addScaledVector(dm, ml);
        B.met.push({ b: rt, d: dm, L: ml, r: .06 * sc });
        for (let p = 0; p < 5; p++) {
          const dp = f5Cone(dm, .4 + R() * .12, p / 5 * TAU + R() * .5), pl = .3 * sc;
          B.phi.push({ b: mt, d: dp, L: pl, r: .09 * sc }); cbA.push(mt.clone().addScaledVector(dp, pl * .97)); cdA.push(dp.clone().lerp(up, .45).normalize());
        }
      }
    }
  }
  const b1 = V(-.5, 0, 0), b2 = V(2.9, -1.3, .1);
  head(b1, V(.05, 1, 0).normalize(), 1, 4, B.cb, B.cd); head(b2, V(.2, 1, 0).normalize(), .62, 3, B.cb2, B.cd2);
  const hy = f5Hypha(S, g, [V(-4, yh + .05, .3), V(-2.4, yh + .1, .1), V(-.5, yh, 0), V(1.4, yh + .05, 0), V(2.9, yh - .05, .05), V(4.2, yh + .1, -.2)], .17, mHy, { septa: 1.0, s0: .5, sMat: mSep });
  const br1 = f5Hypha(S, g, [V(-1.8, yh + .08, .1), V(-2.3, yh + .8, .3), V(-3.0, yh + 1.4, .4), V(-3.6, yh + 2.2, .3)], .13, mHy, { septa: .8, s0: .5, sMat: mSep });
  const br2 = f5Hypha(S, g, [V(1.0, yh + .03, 0), V(1.5, yh - .5, .3), V(1.9, yh - .9, .4)], .11, mHy, { septa: .45, s0: .3, sMat: mSep });
  const s1 = new THREE.CatmullRomCurve3([V(-.5, yh + .1, 0), V(-.62, -2.2, .05), V(-.42, -1, -.04), b1.clone()]);
  const stipe1 = tubeCurve(s1, 36, 12, s => .1 - .02 * s, mStipe); g.add(stipe1);
  const s2 = new THREE.CatmullRomCurve3([V(2.9, yh + .1, 0), V(2.8, -2.7, .05), V(2.95, -1.9, 0), b2.clone()]);
  const stipe2 = tubeCurve(s2, 24, 10, s => .075 - .015 * s, mStipe); g.add(stipe2);
  const ramM = f5Items(S, f5GSeg, mRam, B.ram, g), metM = f5Items(S, f5GMet, mMet, B.met, g), phiM = f5Items(S, f5GPhi, mPhi, B.phi, g);
  const joints = inst(G.sphereLo, mRam, B.ram.length + 2); B.ram.forEach((o, i) => setI(joints, i, o.b.clone().addScaledVector(o.d, o.L), null, o.r * 1.05)); setI(joints, B.ram.length, b1, null, .1); setI(joints, B.ram.length + 1, b2, null, .075); g.add(joints);
  const conG = f5Rough(5, .12, 9, 7, 0);
  const con = f5Chains(S, mCon, conG, B.cb, B.cd, { count: 7, r: .066, gap: 2.1, speed: .05, sway: .06, seed: 4, parent: g });
  const con2 = f5Chains(S, mCon, conG, B.cb2, B.cd2, { count: 6, r: .045, gap: 2.1, speed: .05, sway: .06, seed: 9, parent: g });
  S.part('Conidia', 'Small, nearly round, smooth to finely roughened spores 2–3 µm across, in long dry chains with the youngest at the base. They are grey-green in the colony. The chains often stick together in loose columns, which gives the brush its shape.', [con, con2]);
  S.part('Phialides', 'Flask-shaped cells with a short neck, grouped in a tight bunch of four to six at the tip of each metula. Each phialide buds off one conidium after another through its narrow tip.', phiM);
  S.part('Metulae', 'Cells in a ring at the tip of each ramus. Each carries a bunch of phialides. There is no swollen vesicle, which is the main visible difference from Aspergillus.', metM);
  S.part('Rami', 'The branches that spread from the top of the stipe. Together with the metulae and phialides they form the brush (penicillus) that gave the genus its name, from the Latin for a paintbrush. This repeatedly branched pattern is called terverticillate.', [ramM, joints]);
  S.part('Stipe', 'The upright, smooth stalk of the conidiophore, a single hyphal branch that lifts the spore brush away from the colony surface. A second, smaller conidiophore is shown on the right.', [stipe1, stipe2]);
  S.part('Septate hyphae', 'Branching tubes divided by cross walls (septa) that each have a small central pore. They run through the food and spread the colony outward.', [...hy.all, ...br1.all, ...br2.all], { shell: true });
  S.part('Septa', 'Each cross wall has a pore that lets cytoplasm and nuclei flow between neighbouring cells. If a hypha is damaged, small Woronin bodies plug the pore, which limits the loss of cytoplasm.', [...hy.sep, ...br1.sep, ...br2.sep]);
  const sw = f5Sway(g, .4, .3, .015); S.anim(t => { sw(t); g.position.y = .55 + Math.sin(t * .4) * .05; });
}
NEWBUILD.penicillium = buildPenic;
NEW_SPEC.push({ id: 'penicillium', cat: 'fungi', name: 'Penicillium', latin: 'Penicillium chrysogenum (conidiophore)', size: 'conidium 2–4 µm; conidiophore 100–500 µm tall', sizeUm: 300, U: 7.3, dist: 16,
  cls: 'Eukaryota · Fungi · Ascomycota · Eurotiomycetes', habitat: 'Soil, decaying fruit and bread, damp buildings, and air', move: 'Non-motile; hyphae grow at their tips and spores travel on air currents', feed: 'Absorbs nutrients from decaying organic matter after digesting it with secreted enzymes', repro: 'Asexual: chains of conidia from phialides; some species also have a sexual stage',
  desc: 'A brush-like mould head. A stalk branches into rami, then metulae, then bunches of flask-shaped phialides that each shed a chain of grey-green spores. It has no swollen vesicle.',
  fun: ['In 1928 Alexander Fleming noticed that a Penicillium mould on a culture plate had killed nearby Staphylococcus bacteria, which led to penicillin.', 'Industrial penicillin comes from strains of P. chrysogenum bred to make far more antibiotic than Fleming\'s mould.', 'Other species ripen cheeses such as Camembert, Brie and blue cheese (Penicillium roqueforti).', 'The name comes from the Latin for a little brush or paintbrush.'],
  note: 'The branching pattern is accurate for a terverticillate species, but real heads carry more phialides and longer chains than are drawn. The second, smaller conidiophore is shown at a younger stage. The grey-green spore colour is artistic.' });
