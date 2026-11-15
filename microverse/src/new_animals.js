/* ================= NEW MICROSCOPIC ANIMALS (1) ================= */
/* piecewise-smooth radius profile from a control table [[u, r], ...] */
const profile = tbl => u => { for (let i = 1; i < tbl.length; i++) if (u <= tbl[i][0]) { const a = tbl[i - 1], b = tbl[i]; return lerp(a[1], b[1], sstep(a[0], b[0], u)); } return tbl[tbl.length - 1][1]; };

/* ---------- Tardigrade ---------- */
function buildTardigrade(S) {
  const L = 4.4, rf = u => { const seg = 1 + .07 * Math.cos(TAU * 5 * u + .6) * sstep(.05, .2, u) * (1 - sstep(.8, .92, u)); return .95 * Math.pow(Math.sin(Math.PI * (.03 + .94 * u)), .55) * seg * (1 - .33 * sstep(.8, 1, u)); };
  const bg = new THREE.Group(); S.add(bg); const body = new THREE.Group(); body.rotation.z = -Math.PI / 2; bg.add(body);
  const bump = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 260; i++) { g.fillStyle = r() > .5 ? '#a8a8a8' : '#5c5c5c'; g.beginPath(); g.arc(r() * w, r() * h, 1.6 + r() * 1.6, 0, TAU); g.fill(); } }, false); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(3, 3);
  const skin = S.mesh(latheBody(L, rf, 90, 40), M.shell(0xd9b98a, .62, { bumpMap: bump, bumpScale: 1.1, clearcoat: .5, roughness: .45 }), { parent: body, ro: 8 });
  S.part('Cuticle and body segments', 'A flexible, ridged cuticle covers a head and four trunk segments, each with a pair of legs. The animal moults it as it grows, and it carries fine granules that give the surface a pebbly look.', skin, { shell: true });
  const gut = tubeCurve(new THREE.CatmullRomCurve3([V(0, -L / 2 + .45, 0), V(0, -.8, 0), V(0, .5, 0), V(0, L / 2 - .9, 0)]), 40, 14, u => .34 * (.8 + .2 * Math.sin(u * 25)), M.soft(0x8e9c52, { transparent: true, opacity: .85 })); body.add(gut);
  S.part('Gut', 'A straight digestive tube runs from the mouth to the rear. Plant sap or the contents of small animals pass through the pharynx into a stomach that fills much of the body.', gut);
  const sc = inst(G.sphereLo, PM.cuticle(0xf4ecd8), 90), R = rng(12); for (let i = 0; i < 90; i++) { const u = .1 + R() * .72, a = R() * TAU, r = rf(u) * (.55 + R() * .3); setI(sc, i, V(Math.cos(a) * r, (u - .5) * L, Math.sin(a) * r), null, .07 + R() * .05); } body.add(sc);
  S.part('Storage cells', 'Free-floating cells in the body cavity store fat, glycogen and proteins. They fuel the animal through long periods of fasting and dryness.', sc);
  const head = new THREE.Group(); head.position.y = L / 2 - .3; body.add(head);
  const bt = S.mesh(new THREE.CylinderGeometry(.06, .06, .8, 10), PM.dark(0x4b3a2a), { parent: head, p: V(0, -.08, 0) }), bulb = S.mesh(G.sphere, PM.dark(0x7a5a3a), { parent: head, p: V(0, -.55, 0), s: V(.28, .3, .28) });
  for (let i = 0; i < 3; i++) S.mesh(G.sphereLo, PM.dark(0x2a1f18), { parent: head, p: V(Math.cos(i * 2.1) * .12, -.55, Math.sin(i * 2.1) * .12), s: .06 });
  const st = [-1, 1].map(k => S.mesh(G.cylLo, PM.dark(0x2a1f18), { parent: head, p: V(k * .06, .42, 0), s: V(.018, .48, .018) }));
  const mouth = S.mesh(new THREE.TorusGeometry(.09, .03, 6, 14), PM.dark(0x4b3a2a), { parent: head, p: V(0, .48, 0), r: [Math.PI / 2, 0, 0] });
  S.part('Mouth, stylets and pharyngeal bulb', 'A tiny mouth at the front tip carries two sharp stylets that pierce a plant cell or a small animal. A muscular bulb with hardened plates (placoids) then pumps the contents back through the buccal tube.', [bt, bulb, ...st, mouth]);
  const e2 = [-1, 1].map(k => S.mesh(G.sphere, M.emit(0xc4302c, .55), { parent: body, p: V(-.3, L / 2 - .5, k * .28), s: .065 }));
  S.part('Eyespots', 'A pair of simple pigment-cup eyes on the head lets the animal tell light from dark, though it forms no real image.', e2);
  const legs = [], cm = PM.dark(0x4b3a2a), lg = new THREE.CylinderGeometry(.16, .23, .8, 14); lg.translate(0, .4, 0);
  [.18, .37, .56, .76].forEach((u, i) => [-1, 1].forEach(k => {
    const r = rf(u), hip = new THREE.Group(); hip.position.set(r * .78, (u - .5) * L, k * r * .42); hip.userData = { ph: i * 1.5 + (k > 0 ? 0 : Math.PI) }; body.add(hip);
    const leg = new THREE.Group(); leg.quaternion.copy(qFromUp(V(.95, 0, k * .4))); hip.add(leg);
    S.mesh(lg, M.shell(0xd9b98a, .85, { bumpMap: bump, bumpScale: .6 }), { parent: leg });
    for (let c = 0; c < 4; c++) { const a = (c - 1.5) * .3; S.mesh(G.cone, cm, { parent: leg, p: V(Math.sin(a) * .1, .8, Math.cos(a) * .03), s: V(.035, .24, .035), r: [0, 0, -a * 1.2] }); }
    legs.push({ hip, leg });
  }));
  S.part('Legs and claws', 'Eight stubby, unjointed legs, each ending in claws (often four), carry the animal in a slow, lumbering walk. Muscles pull the legs against internal fluid pressure, like a hydraulic system.', legs.map(l => l.leg));
  S.anim(t => { legs.forEach(({ hip }) => { hip.rotation.z = .4 * Math.sin(t * 1.9 + hip.userData.ph); }); bg.position.y = .04 * Math.sin(t * 3.8); bg.rotation.y = .06 * Math.sin(t * .8); });
}
NEWBUILD.tardigrade = buildTardigrade;
NEW_SPEC.push({ id: 'tardigrade', cat: 'animals', name: 'Tardigrade', latin: 'Hypsibius dujardini', size: '0.3–0.5 mm', sizeUm: 400, U: 4.4, dist: 11.5,
  cls: 'Animalia · Tardigrada · Eutardigrada', habitat: 'Films of water on mosses, lichens, leaf litter and sediments', move: 'Walks slowly on four pairs of clawed legs', feed: 'Pierces algae or small animals with stylets and sucks out the contents', repro: 'Eggs laid after mating; some species reproduce without males',
  desc: 'The water bear, a plump eight-legged animal that ambles through moss. It can shut down, dry out and survive conditions that would kill almost any other animal.',
  fun: ['In its dried “tun” state it can survive extreme cold, drying and radiation, then revive when water returns.', 'In 2007, tardigrades flown outside a satellite were exposed to open space; some survived and even laid eggs.', 'It has a head and four body segments, each with a pair of legs.'],
  note: 'Segment shapes and claw counts are simplified (claw number varies among species). The walking gait is an approximation of the slow, alternating step.' });

/* ---------- Daphnia ---------- */
function buildDaphnia(S) {
  const bg = new THREE.Group(); S.add(bg);
  const carp = S.mesh(G.sphere, M.shell(0xe0b46e, .36, { clearcoat: .6, roughness: .3 }), { parent: bg, p: V(-.5, .05, 0), s: V(2.2, 1.45, .95), ro: 8 });
  const ridge = S.mesh(new THREE.TorusGeometry(1, .012, 6, 60), PM.cuticle(0xa07a3a), { parent: bg, p: V(-.5, .05, 0), s: V(2.2, 1.45, 1), r: [0, 0, 0] });
  S.part('Carapace', 'The transparent shell, a fold of the skin, encloses the trunk like a clam. It is what makes Daphnia clear enough to watch the heart beat and the gut work.', [carp, ridge], { shell: true });
  const head = S.mesh(G.sphere, M.shell(0xe0b46e, .42, { clearcoat: .6 }), { parent: bg, p: V(1.7, .1, 0), s: V(.95, .8, .7), ro: 8 });
  const rost = S.mesh(G.cone, PM.cuticle(0xc9a05c), { parent: bg, p: V(2.3, -.3, 0), s: V(.2, .6, .2), r: [0, 0, -2.2] });
  const eye = new THREE.Group(); eye.position.set(2.05, -.05, 0); bg.add(eye);
  const ev = S.mesh(G.sphere, PM.dark(0x1d1a18, { roughness: .2 }), { parent: eye, s: .33 }); for (let i = 0; i < 12; i++) { const d = fib(12)[i]; S.mesh(G.sphereLo, M.glass(0xffe9c8, .9), { parent: eye, p: d.multiplyScalar(.33), s: .06 }); }
  S.part('Compound eye', 'A single dark eye made of many tiny lenses sits at the front of the head. It trembles constantly, and the animal steers toward light with it. A small simple eye, the ocellus, sits behind it.', eye);
  const brood = new THREE.Group(); bg.add(brood); const em = M.soft(0xcfe0a0, { transparent: true, opacity: .9 });
  [[-.6, .62, .0], [-1.0, .52, .22], [-1.0, .52, -.22], [-1.45, .38, .0], [-.2, .68, .18]].forEach(([x, y, z], i) => { S.mesh(G.sphere, em, { parent: brood, p: V(x, y, z), s: .21 }); S.mesh(G.sphere, PM.dark(0x7a9a3a), { parent: brood, p: V(x, y, z), s: .09 }); });
  S.part('Brood chamber and embryos', 'Females keep their eggs in a pouch above the back. In good conditions the eggs develop without fertilisation into new females, which are released after a day or two.', brood);
  const heart = S.mesh(G.sphere, M.soft(0xd4504a, { emissive: 0x802018, emissiveIntensity: .4 }), { parent: bg, p: V(.95, .62, 0), s: V(.22, .2, .2) });
  S.part('Heart', 'A small muscular chamber on the back pumps colourless blood around the body at several beats per second, easy to see through the shell.', heart);
  const gp = new THREE.CatmullRomCurve3([V(1.5, -.3, 0), V(.7, -.35, 0), V(0, -.1, 0), V(-.8, -.1, 0), V(-1.5, -.45, 0), V(-2.15, -.5, 0)]), gt = new Tube(40, 12, M.soft(0xb8763a, { transparent: true, opacity: .88 })), gpts = gp.getPoints(40); bg.add(gt.mesh);
  S.part('Gut', 'A tube runs from the mouth, with a looped midgut, to the anus near the tail. Waves of muscle contraction (peristalsis) can be seen moving food along.', gt.mesh);
  const limbs = new THREE.Group(); bg.add(limbs); const lm = M.shell(0xcfa66a, .8, { side: THREE.DoubleSide }), lp = [];
  for (let i = 0; i < 5; i++) { const g = new THREE.Group(); g.position.set(.9 - i * .45, -.55, 0); limbs.add(g); const pl = S.mesh(G.sphere, lm, { parent: g, p: V(0, -.2, 0), s: V(.07, .3, .38) }); const hs = inst(G.cylLo, PM.cuticle(0xb08a50), 8); for (let k = 0; k < 8; k++) { _o.position.set(0, -.5, (k - 3.5) * .09); _o.scale.set(.008, .24, .008); _o.rotation.set(0, 0, 0); _o.quaternion.identity(); _o.updateMatrix(); hs.setMatrixAt(k, _o.matrix); } g.add(hs); lp.push(g); }
  S.part('Thoracic limbs', 'Five pairs of leaf-like legs beat constantly, drawing a current of water through the shell. Fine bristles on them act as a sieve that traps algae and bacteria, which are then pushed forward to the mouth.', limbs);
  const spine = S.mesh(G.cone, PM.cuticle(0xb08a50), { parent: bg, p: V(-2.55, -.05, 0), s: V(.12, 1.2, .12), r: [0, 0, Math.PI / 2 + .15] });
  S.part('Tail spine', 'A sharp spine at the back of the shell helps deter predators and keeps the animal steady in the water.', spine);
  const ant = []; [-1, 1].forEach(k => {
    const piv = new THREE.Group(); piv.position.set(1.45, .6, k * .32); bg.add(piv);
    const base = S.mesh(new THREE.CylinderGeometry(.06, .09, 1, 10), PM.cuticle(0xcfa66a), { parent: piv, p: V(0, .5, 0) });
    [-1, 1].forEach(b => { const br = new THREE.Group(); br.position.set(0, 1, 0); br.rotation.z = b * .45; piv.add(br); S.mesh(new THREE.CylinderGeometry(.03, .05, 1.1, 8), PM.cuticle(0xcfa66a), { parent: br, p: V(0, .55, 0) }); const sf = inst(G.cylLo, PM.cuticle(0xd9b878), 6); for (let q = 0; q < 6; q++) { _o.position.set(0, 1.05, 0); _o.scale.set(.012, .55, .012); _o.rotation.set(0, 0, (q - 2.5) * .22); _o.updateMatrix(); sf.setMatrixAt(q, _o.matrix); } br.add(sf); });
    ant.push(piv);
  });
  S.part('Second antennae', 'Large branched antennae carry rows of feathery bristles. Their strokes, about every second, drive the characteristic hopping swim that gives the animal its name, the water flea.', ant);
  const T = V();
  S.anim(t => {
    const k = cycle(t, 1.25), st = k < .3 ? sstep(0, .3, k) : 1 - sstep(.3, 1, k);
    ant.forEach((p, i) => { p.rotation.z = -.2 - 1.35 * st; p.rotation.x = (i ? 1 : -1) * (.5 - .3 * st); });
    heart.scale.set(.22, .2, .2).multiplyScalar(1 + .25 * Math.pow(Math.max(0, Math.sin(t * TAU * 2.6)), 3));
    gt.update(gpts, s => .13 + .025 * Math.sin(s * 28 - t * 3));
    lp.forEach((g, i) => { g.rotation.z = .35 * Math.sin(t * 9 - i * .8); });
    bg.position.y = .35 * Math.sin(TAU * k - 1.2) * .5 + .1; bg.rotation.z = .06 * Math.sin(TAU * k);
  });
}
NEWBUILD.daphnia = buildDaphnia;
NEW_SPEC.push({ id: 'daphnia', cat: 'animals', name: 'Daphnia', latin: 'Daphnia pulex', size: '1–3 mm', sizeUm: 2000, U: 4.8, dist: 11.5,
  cls: 'Animalia · Arthropoda · Crustacea · Branchiopoda', habitat: 'Freshwater ponds, lakes and puddles', move: 'Hops through the water using its large second antennae', feed: 'Filter feeder: leaf-like legs strain algae, bacteria and detritus', repro: 'Cyclical parthenogenesis: females clone themselves; males and resting eggs appear when conditions worsen',
  desc: 'The water flea, a transparent crustacean you can see with the naked eye. Its beating heart, gut and brood of eggs are all visible through the shell.',
  fun: ['The heart beats several times a second, so you can watch it under a microscope.', 'Some Daphnia grow a helmet or tail spine when they sense chemicals from predators.', 'It is widely used to test whether water is polluted.'],
  note: 'Legs, antennae and bristles are simplified; bristle numbers are reduced. The animal is shown with its brood chamber filled, as seen in an adult female.' });
