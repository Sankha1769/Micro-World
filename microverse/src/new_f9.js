/* ================= F9: Marine plankton assemblage ================= */
const f9Rings = canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = '#bdbdbd'; g.fillRect(0, y, w, 2.5); } }, false);

/* ---------- copepod ---------- */
function f9Copepod(S, root, P) {
  const L = 3.8, g = new THREE.Group(); g.position.set(.2, -.3, 0); root.add(g);
  const body = new THREE.Group(); body.rotation.z = Math.PI / 2; g.add(body);
  const prof = profile([[0, 0], [.04, .3], [.18, .56], [.4, .6], [.45, .42], [.5, .4], [.56, .34], [.6, .26], [.7, .22], [.82, .17], [.96, .13], [1, .1]]);
  const rf = u => prof(u) * (1 + .05 * Math.cos(TAU * 5 * u) * sstep(.45, .8, u));
  P.cop.push(S.mesh(latheBody(L, rf, 80, 32), M.shell(0xd4a468, .6, { bumpScale: .5, clearcoat: .6, roughness: .4 }), { parent: body, ro: 8 }));
  P.gut.push(tubeCurve(new THREE.CatmullRomCurve3([V(0, -L / 2 + .55, 0), V(0, -.7, 0), V(0, .3, 0), V(0, L / 2 - .25, 0)]), 40, 10, u => .17 * (.85 + .15 * Math.sin(u * 20)), M.soft(0x8f8a3e, { roughness: .5 }))); body.add(P.gut[0]);
  P.eye.push(S.mesh(G.sphere, M.emit(0xd9402c, .55), { parent: body, p: V(.3, -L / 2 + .45, 0), s: .09 }));
  const aM = M.soft(0xb4864e, { roughness: .5 }), ant = [-1, 1].map(k => { const tb = new Tube(36, 6, aM); body.add(tb.mesh); P.ant.push(tb.mesh); return { tb, k, pts: Array.from({ length: 37 }, () => V()) }; });
  const legM = PM.cuticle(0xc9985a), legs = [];
  [.47, .55, .62, .7].forEach((u, i) => [-1, 1].forEach(k => {
    const r = rf(u), lg = new THREE.Group(); lg.position.set(-r * .85, (u - .5) * L, k * r * .3); body.add(lg);
    [0, 1].forEach(b => { const m = S.mesh(G.cone, legM, { parent: lg, s: V(.045, .72 - b * .15, .045) }); m.quaternion.copy(qFromUp(V(-1, -.15 + b * .5, k * (.35 + b * .3)))); P.legs.push(m); });
    legs.push({ lg, i, k });
  }));
  [-1, 1].forEach(k => {
    const ram = S.mesh(G.cone, legM, { parent: body, p: V(0, L / 2 - .05, k * .09), s: V(.07, .5, .07) }); ram.quaternion.copy(qFromUp(V(0, 1, k * .3))); P.ram.push(ram);
    for (let s = 0; s < 4; s++) { const d = V(0, 1, k * (.2 + s * .22)).normalize(), m = S.mesh(G.cone, M.soft(0xd8b27a), { parent: body, p: V(0, L / 2 + .4, k * (.1 + .1)), s: V(.014, .8 - s * .08, .014) }); m.quaternion.copy(qFromUp(d)); P.ram.push(m); }
    const egg = S.mesh(G.sphere, M.soft(0x8f9a7a, { bumpMap: TEX.grain, bumpScale: 1.5 }), { parent: body, p: V(-.1, (.6 - .5) * L + .25, k * .42), s: V(.22, .5, .2) }); P.egg.push(egg);
  });
  S.anim(t => {
    ant.forEach(a => { for (let i = 0; i <= 36; i++) { const s = i / 36, sw = Math.sin(t * 1.6 + a.k * .6 - s * 2.2) * .25 * s; a.pts[i].set(.1 * s, -L / 2 + .2 - s * 2.6, a.k * (.2 + s * 1.3 + sw)); } a.tb.update(a.pts, s => .045 * (1 - .75 * s)); });
    legs.forEach(l => { l.lg.rotation.z = Math.sin(t * 6 - l.i * .9) * .45; });
    g.position.y = -.3 + Math.sin(t * .5) * .12; g.rotation.z = Math.sin(t * .35) * .08;
  });
}

/* ---------- Chaetoceros chain ---------- */
function f9Chaeto(S, root, P) {
  const g = new THREE.Group(); g.position.set(2.3, 3.1, -.8); g.rotation.z = -.15; root.add(g);
  const cg = new THREE.CylinderGeometry(.58, .58, .55, 28); cg.rotateZ(Math.PI / 2);
  const cM = M.shell(0xcfae66, .55, { bumpScale: .3 }), pM = M.soft(0x8e6a22, { roughness: .45 }), sM = M.soft(0xb89a58, { roughness: .5 }), R = rng(8);
  for (let i = 0; i < 4; i++) {
    const x = i * .98 - 1.5;
    P.frus.push(S.mesh(cg, cM, { parent: g, p: V(x, 0, 0), ro: 8 }));
    for (let k = 0; k < 3; k++) P.chl.push(S.mesh(G.sphere, pM, { parent: g, p: V(x + (R() - .5) * .25, (R() - .5) * .6, (R() - .5) * .6), s: V(.08, .2, .26) }));
    P.chl.push(S.mesh(G.sphere, M.soft(0xa4673a), { parent: g, p: V(x, 0, 0), s: .13 }));
    [-1, 1].forEach(sx => [-1, 1].forEach(qy => {
      const b = V(x + sx * .27, qy * .56, 0), d = V(sx * .35, qy, 0).normalize(), c = new THREE.CatmullRomCurve3([b, b.clone().addScaledVector(d, 1.1).add(V(0, 0, .12)), b.clone().addScaledVector(d, 2.4)]);
      P.seta.push(tubeCurve(c, 14, 5, u => .024 * (1 - .55 * u), sM)); g.add(P.seta[P.seta.length - 1]);
    }));
  }
  S.anim(t => { g.rotation.z = -.15 + Math.sin(t * .3) * .08; g.rotation.y = Math.sin(t * .22) * .25; g.position.y = 3.1 + Math.sin(t * .4 + 1) * .1; });
}

/* ---------- radiolarian ---------- */
function f9Radio(S, root, P) {
  const g = new THREE.Group(); g.position.set(-3.6, -2.6, .8); root.add(g);
  const ico = new THREE.IcosahedronGeometry(1, 1), pos = ico.attributes.position, vm = new Map(), verts = [], edges = new Set();
  const vid = i => { const v = V().fromBufferAttribute(pos, i).normalize(), k = v.toArray().map(x => x.toFixed(3)).join(); if (!vm.has(k)) { vm.set(k, verts.length); verts.push(v); } return vm.get(k); };
  for (let i = 0; i < pos.count; i += 3) { const t = [vid(i), vid(i + 1), vid(i + 2)]; for (let e = 0; e < 3; e++) { const a = t[e], b = t[(e + 1) % 3]; edges.add(a < b ? a + '_' + b : b + '_' + a); } }
  const E = [...edges].map(s => s.split('_').map(Number)), sk = M.soft(0xb59a64, { roughness: .3, clearcoat: .8 });
  const struts = (R0, rr) => { const m = inst(G.cylLo, sk, E.length); E.forEach(([a, b], i) => { const A = verts[a].clone().multiplyScalar(R0), B = verts[b].clone().multiplyScalar(R0); setI(m, i, A.clone().add(B).multiplyScalar(.5), qFromUp(B.clone().sub(A)), V(rr, A.distanceTo(B), rr)); }); g.add(m); P.skel.push(m); };
  struts(1, .013); struts(.62, .011);
  const nodes = inst(G.sphereLo, sk, verts.length), rad = inst(G.cylLo, sk, verts.length);
  verts.forEach((v, i) => { setI(nodes, i, v, null, .034); setI(rad, i, v.clone().multiplyScalar(.81), qFromUp(v), V(.009, .38, .009)); }); g.add(nodes, rad); P.skel.push(nodes, rad);
  P.cap.push(S.mesh(G.sphere, M.shell(0xe3a455, .72, { bumpScale: .3 }), { parent: g, s: .36, ro: 6 }), S.mesh(G.sphere, M.soft(0xa4673a), { parent: g, p: V(.05, 0, 0), s: .14 }));
  const R = rng(14); for (let i = 0; i < 14; i++) P.sym.push(S.mesh(G.sphereLo, M.soft(0xc7b43a), { parent: g, p: randDir(R).multiplyScalar(.7 + R() * .2), s: .055 }));
  const sd = fib(24), sp = inst(G.cone, sk, sd.length); sd.forEach((d, i) => setI(sp, i, d.clone().multiplyScalar(.98), qFromUp(d), V(.045, 1.0, .045))); g.add(sp); P.spine.push(sp);
  const AX = 52, ad = fib(AX), ax = inst(G.cylLo, M.soft(0xe4d3ad, { roughness: .4 }), AX), ph = ad.map(() => R() * TAU); g.add(ax); P.axo.push(ax);
  S.anim(t => {
    ad.forEach((d, i) => { const l = 1.1 + .35 * Math.sin(t * 1.3 + ph[i]); setI(ax, i, d.clone().multiplyScalar(1.0 + l * .5), qFromUp(d), V(.008, l, .008)); }); ax.instanceMatrix.needsUpdate = true;
    g.rotation.y = t * .08; g.rotation.x = Math.sin(t * .2) * .2; g.position.y = -2.6 + Math.sin(t * .45 + 2) * .1;
  });
}

/* ---------- foraminifer ---------- */
function f9Foram(S, root, P) {
  const g = new THREE.Group(); g.position.set(3.8, -2.3, -.4); g.rotation.set(.9, .4, 0); root.add(g);
  const sh = new THREE.Group(); sh.scale.setScalar(.85); g.add(sh);
  const shM = M.soft(0xe8dcc0, { roughness: .45, clearcoat: .5, bumpMap: TEX.grain, bumpScale: 1.8 }), N = 13; let last = null;
  for (let i = 0; i < N; i++) {
    const r = .1 * Math.pow(1.17, i), th = i * 1.0, rc = 1.1 * r, c = V(Math.cos(th) * rc, Math.sin(th) * rc, 0);
    P.test.push(S.mesh(G.sphere, shM, { parent: sh, p: c, s: V(r, r, r * .75) })); last = { c, th, r };
  }
  const out = V(Math.cos(last.th + .5), Math.sin(last.th + .5), 0), ap = last.c.clone().addScaledVector(out, last.r * .95);
  const rim = S.mesh(new THREE.TorusGeometry(1, .3, 8, 20), M.soft(0xb8a478), { parent: sh, p: ap, s: last.r * .22 }); rim.quaternion.setFromUnitVectors(V(0, 0, 1), out); P.ap.push(rim);
  const R = rng(5), pM = M.shell(0xd6b98a, .7, { roughness: .4 }), rt = new THREE.Group(); rt.position.copy(ap); sh.add(rt);
  for (let i = 0; i < 16; i++) {
    const d = out.clone().add(V((R() - .5) * 1.7, (R() - .5) * 1.7, (R() - .5) * 1.4)).normalize(), c = new THREE.CatmullRomCurve3([V(0, 0, 0), d.clone().multiplyScalar(.7).add(randDir(R).multiplyScalar(.1)), d.clone().multiplyScalar(1.5).add(randDir(R).multiplyScalar(.2))]);
    const m = tubeCurve(c, 14, 5, u => .02 * (1 - .6 * u), pM); rt.add(m); P.ret.push(m);
  }
  S.anim(t => { rt.rotation.z = Math.sin(t * .8) * .1; rt.rotation.y = Math.sin(t * .6 + 1) * .12; g.rotation.z = Math.sin(t * .25) * .3; g.position.y = -2.3 + Math.sin(t * .4 + 3) * .1; });
}

/* ---------- tintinnid ---------- */
function f9Tint(S, root, P) {
  const g = new THREE.Group(); g.position.set(-3.7, 3, -.5); g.rotation.z = .7; root.add(g);
  const lp = profile([[0, .03], [.06, .2], [.25, .46], [.6, .52], [.9, .46], [1, .58]]);
  P.lor.push(S.mesh(latheBody(2.4, lp, 50, 28), M.glass(0xe0c89a, .45, { bumpMap: f9Rings, bumpScale: 1.5 }), { parent: g, ro: 8 }));
  P.cell.push(S.mesh(G.sphere, M.soft(0xd98a5a, { roughness: .45 }), { parent: g, p: V(0, .15, 0), s: V(.34, .95, .34) }));
  P.cell.push(S.mesh(G.sphere, M.soft(0x8f5a3a), { parent: g, p: V(0, .2, 0), s: .16 }));
  const n = 24, PP = [], NN = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; PP.push(V(Math.cos(a) * .36, 1.08, Math.sin(a) * .36)); NN.push(V(Math.cos(a) * .4, .9, Math.sin(a) * .4).normalize()); }
  P.cil.push(ciliaSet(S, M.soft(0xe7b78a), PP, NN, { len: .4, r: .02, amp: .6, speed: 8, wave: 3, axis: V(0, 1, 0), parent: g }));
  S.anim(t => { g.rotation.z = .7 + Math.sin(t * .3) * .12; g.position.y = 3 + Math.sin(t * .5 + 4) * .1; });
}

function buildPlankton(S) {
  const root = new THREE.Group(); S.add(root);
  const P = { cop: [], gut: [], eye: [], ant: [], legs: [], ram: [], egg: [], frus: [], seta: [], chl: [], skel: [], spine: [], cap: [], sym: [], axo: [], test: [], ap: [], ret: [], lor: [], cell: [], cil: [] };
  f9Copepod(S, root, P); f9Chaeto(S, root, P); f9Radio(S, root, P); f9Foram(S, root, P); f9Tint(S, root, P);
  S.part('Copepod exoskeleton', 'A hard cuticle of chitin covers the body and limbs. It is divided into a rounded head-and-chest region and a narrower tail. The animal sheds it at each moult as it grows from larva to adult.', P.cop, { shell: true });
  S.part('Copepod antennules', 'The long first antennae. They carry sensory hairs that detect water movement and chemicals, so the copepod can sense prey and predators. Many species hold them out while sinking slowly and fold them back in a quick jump.', P.ant);
  S.part('Copepod swimming legs', 'Pairs of two-branched legs beat one after another from back to front to push the animal forward. For an escape jump, all pairs beat at once, giving speeds of many body lengths per second.', P.legs);
  S.part('Copepod eye', 'A single red or dark pigmented eye on the front of the head (the naupliar eye). It senses light and its direction, but does not form an image.', P.eye);
  S.part('Copepod gut', 'A straight digestive tube that looks green or brown after a meal of phytoplankton. The faecal pellets sink quickly and carry carbon to the deep sea.', P.gut);
  S.part('Copepod egg sacs', 'Many female copepods carry fertilised eggs in one or two sacs attached to the genital segment, until nauplius larvae hatch. Some species release their eggs freely into the water instead.', P.egg);
  S.part('Caudal rami and setae', 'The two tail branches carry long bristles (setae). They help with steering and balance and can sense water flow.', P.ram);
  S.part('Chaetoceros silica cells', 'Each cell lives inside a two-part shell (frustule) made of silica. Cells are linked end to end into a chain. Diatoms as a group do a large share of the ocean’s photosynthesis.', P.frus, { shell: true });
  S.part('Chaetoceros setae', 'Long, hollow silica spines that grow from the cell corners. Their bases fuse with the neighbouring cell to hold the chain together. They add surface area, slow sinking and may deter small grazers.', P.seta);
  S.part('Chaetoceros chloroplasts', 'Golden-brown plastids that contain chlorophylls a and c and the pigment fucoxanthin. They carry out photosynthesis and give diatoms their colour.', P.chl);
  S.part('Radiolarian skeleton', 'A glassy lattice shell, here with two nested spheres joined by radial struts. Most radiolarians build it from opal (silica); acantharians use strontium sulfate instead. The skeleton survives as a fossil in marine sediments.', P.skel);
  S.part('Radiolarian spines', 'Rigid spines radiate from the skeleton. They protect the cell and increase its drag, which helps it float.', P.spine);
  S.part('Radiolarian central capsule', 'A membrane wall encloses the inner cytoplasm with the nucleus. Outside it lies a froth of outer cytoplasm that digests food and carries the symbionts. Pores in the capsule connect the two.', P.cap);
  S.part('Algal symbionts', 'Many radiolarians in sunlit water host symbiotic algae in their outer cytoplasm. The algae supply sugars from photosynthesis, which allows these single cells to live in nutrient-poor seas.', P.sym);
  S.part('Axopodia', 'Thin, stiff cytoplasmic rays supported by bundles of microtubules. They snare small prey such as algae and ciliates, and their spread helps the cell stay afloat. They extend and shrink constantly.', P.axo);
  S.part('Foraminifer test', 'A shell of calcium carbonate built as a spiral series of chambers, each larger than the one before. Fossil tests make up much of the world’s chalk and limestone, and their chemistry records past ocean temperatures.', P.test);
  S.part('Foraminifer aperture', 'The main opening of the last chamber. The cytoplasm streams out through it to form the net of threads outside the shell, and new chambers are added at this side.', P.ap);
  S.part('Reticulopodia', 'Fine threads of cytoplasm that branch and fuse into a net. They move food particles along them in both directions, trap prey and, in some species, pull the shell along a surface.', P.ret);
  S.part('Tintinnid lorica', 'A vase-shaped house secreted by the cell, with a ringed pattern, made of protein and sometimes mineral particles. Its shape and size identify the species.', P.lor, { shell: true });
  S.part('Tintinnid cell', 'A ciliate cell anchored to the base of the lorica by a contractile stalk. It can pull back inside when it is disturbed.', P.cell);
  S.part('Oral cilia', 'A crown of large cilia fused into plates (membranelles) around the mouth. Their beat creates a current that draws small algae and bacteria into the cell and also pulls the whole animal through the water.', P.cil);
}
NEWBUILD.plankton = buildPlankton;
NEW_SPEC.push({ id: 'plankton', cat: 'other', name: 'Marine plankton', latin: 'Calanoid copepod, Chaetoceros, radiolarian, foraminifer, tintinnid', size: 'copepod about 1–2 mm; the others about 20–500 µm', sizeUm: 1000, umPerUnit: 260, U: 10, dist: 22,
  cls: 'Mixed assemblage · Arthropoda, Ochrophyta (diatoms), Rhizaria and Ciliophora', habitat: 'Sunlit surface waters of the open ocean and coastal seas', move: 'Mostly drifting with currents; the copepod swims and jumps, and the tintinnid swims with its cilia', feed: 'Mixed: diatoms photosynthesise, the copepod grazes on phytoplankton, and the radiolarian and foraminifer capture small prey with cytoplasmic threads', repro: 'Varies: copepods lay eggs, diatoms divide, and the single-celled forms divide or reproduce sexually',
  desc: 'A drop of seawater under the microscope: a copepod, a chain of Chaetoceros diatoms, a radiolarian, a foraminifer and a tintinnid, each a distinct kind of plankton.',
  fun: ['About half of the photosynthesis on Earth is done by marine phytoplankton, which includes diatoms.', 'Copepods are among the most abundant animals on Earth, and many rise to the surface at night to feed and sink by day.', 'Chalk and limestone cliffs are largely made of the shells of foraminifera and other plankton.', 'Radiolarian skeletons are made of silica and can form thick deposits on the deep sea floor.'],
  note: 'The organisms are not to scale with one another: smaller ones are enlarged so that they are all visible. The copepod’s proportions are typical of calanoids. Chain length, skeleton detail and all colours are simplified or artistic.' });
