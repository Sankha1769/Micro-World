/* ================= RED BLOOD CELL ================= */
function rbcLathe(R, nProfile, nSeg, k = 1) {
  const h = r => { const x = r / R; return .5 * R * Math.sqrt(Math.max(0, 1 - x * x)) * (.2072 + 2.0026 * x * x - 1.1228 * Math.pow(x, 4)) * k; };
  const pts = []; for (let i = 0; i <= nProfile; i++) { const r = R * i / nProfile; pts.push(V2(Math.max(r, .0005), -h(r))); }
  for (let i = nProfile; i >= 0; i--) { const r = R * i / nProfile; pts.push(V2(Math.max(r, .0005), h(r))); }
  return new THREE.LatheGeometry(pts, nSeg);
}
function buildRBC(S) {
  const R = 1.6, geo = rbcLathe(R, 90, 120), p = geo.attributes.position, col = new Float32Array(p.count * 3), c1 = new THREE.Color(0xd23a3a), c2 = new THREE.Color(0x7d0a14), tc = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const h = Math.abs(p.getY(i)) / (R * .33), r = Math.hypot(p.getX(i), p.getZ(i)) / R; tc.copy(c1).lerp(c2, clamp(sstep(.0, 1, h * .8 + r * .25), 0, 1)); col[i * 3] = tc.r; col[i * 3 + 1] = tc.g; col[i * 3 + 2] = tc.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const hg = new THREE.Group(); S.add(hg);
  const mem = S.mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .35, clearcoat: .9, clearcoatRoughness: .25, sheen: 1, sheenColor: new THREE.Color(0xff6a6a), sheenRoughness: .4, emissive: 0x3a0508, emissiveIntensity: .35, transparent: true, opacity: .93 }), { parent: hg, ro: 6 });
  S.part('Biconcave disc and membrane', 'The cell is a flexible disc about 7.5 micrometres across and only 2 micrometres thick, thinner in the middle. This shape gives a large surface for gas exchange, and the membrane (lipid bilayer reinforced by a spectrin network) lets it fold to squeeze through capillaries narrower than itself.', mem);
  const hb = S.mesh(rbcLathe(R * .92, 50, 64, .85), M.soft(0x9d0d1c, { emissive: 0x6a0810, emissiveIntensity: .5 }), { parent: hg, ro: 5 });
  S.part('Haemoglobin', 'Each cell holds about 270 million haemoglobin molecules, making up roughly a third of its weight. Haemoglobin contains iron, binds oxygen in the lungs and releases it in the tissues, and gives blood its red colour.', hb);
  const net = S.mesh(rbcLathe(R * 1.006, 14, 24), new THREE.MeshBasicMaterial({ color: 0xff9a8f, wireframe: true, transparent: true, opacity: .12, depthWrite: false }), { parent: hg, ro: 7 });
  S.part('Spectrin cytoskeleton', 'A mesh of spectrin and actin lies against the inside face of the membrane, shown here as a net. It keeps the disc shape and makes the cell springy, so it returns to form after each squeeze through a capillary.', net);
  const ghost = S.mesh(new THREE.IcosahedronGeometry(.5, 2), new THREE.MeshBasicMaterial({ color: 0x9fb8ff, wireframe: true, transparent: true, opacity: .2, depthWrite: false }), { parent: hg, ro: 7 });
  S.part('No nucleus', 'Mature red blood cells have no nucleus, no mitochondria and no DNA. The faint outline marks the space a typical nucleus would take up. The cell ejects it during development, which makes room for more haemoglobin but means it cannot divide or repair itself and lives about 120 days.', ghost);
  const NO = 11, om = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .4, clearcoat: .8, sheen: 1, sheenColor: new THREE.Color(0xff6a6a), emissive: 0x3a0508, emissiveIntensity: .3 }), others = inst(geo, om, NO), od = [], r = rng(31);
  for (let i = 0; i < NO; i++) { const d = randDir(r), dist = 3.2 + r() * 3.3; od.push({ p: d.multiplyScalar(dist), a: V(r() * 3, r() * 3, r() * 3), w: V(r() - .5, r() - .5, r() - .5).multiplyScalar(.5), s: .45 + r() * .25 }); } S.add(others);
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  S.anim((t) => {
    hg.rotation.set(.95 + .45 * Math.sin(t * .35), t * .3, .5 * Math.sin(t * .27));
    od.forEach((o, i) => { e.set(o.a.x + o.w.x * t, o.a.y + o.w.y * t, o.a.z + o.w.z * t); q.setFromEuler(e); setI(others, i, V(o.p.x, o.p.y + Math.sin(t * .4 + i) * .15, o.p.z), q, o.s); }); others.instanceMatrix.needsUpdate = true;
  });
}

/* ================= WHITE BLOOD CELL ================= */
function buildWBC(S) {
  const R = rng(23), body = new Blob(96, 64), sc = V(1, 1, 1); let T = 0, ext = 0;
  const rfn = (x, y, z) => 1 + .05 * fbm(x * 3 + T * .2, y * 3, z * 3 + T * .15) + ext * Math.exp((x - 1) * 4.5) + .05 * Math.sin(x * 7 + T) * Math.sin(y * 6 - T * .8);
  const mem = S.mesh(body.geo, M.shell(0xd9d2c2, .3, { iridescence: .45, iridescenceIOR: 1.3, bumpScale: .9 }), { ro: 9 });
  S.part('Cell membrane and pseudopod', 'A highly ruffled membrane that can reshape quickly. The bulge on the right is a pseudopod: the cell crawls towards infection by following chemical signals, squeezing between the cells of blood vessel walls.', mem, { shell: true });
  const pt = (d, f, o) => o.copy(d).multiplyScalar(rfn(d.x, d.y, d.z) * f);
  const lobes = [V(-.3, .12, .1), V(.05, .28, -.12), V(.2, -.15, .1), V(-.1, -.3, -.12)].map(v => v.normalize()), lf = [.34, .38, .36, .34];
  const nm = M.grain(0x5b4fa8, { roughness: .5 }), nuc = new THREE.Group(), lm = lobes.map(() => { const m = new THREE.Mesh(G.sphere, nm); m.scale.setScalar(.25); m.renderOrder = 3; nuc.add(m); return m; });
  const strands = []; for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(G.cyl, nm); nuc.add(s); strands.push(s); } S.add(nuc);
  S.part('Multi-lobed nucleus', 'A neutrophil nucleus has three to five connected lobes. The segmented shape lets the cell squeeze through very narrow gaps in tissue. Neutrophils are the most common white blood cell and the first to arrive at an infection.', nuc);
  const NG = 170, gr = inst(G.sphereLo, M.soft(0xd7a6d9, { roughness: .45 }), NG), gd = []; for (let i = 0; i < NG; i++) gd.push({ d: randDir(R), f: .25 + .65 * Math.cbrt(R()), s: .03 + R() * .02 }); S.add(gr);
  S.part('Granules', 'The cytoplasm is full of small granules that hold digestive enzymes, antimicrobial proteins and compounds such as myeloperoxidase. They are released onto, or into, the microbes the cell captures.', gr);
  const ph = new THREE.Group(); S.mesh(G.sphere, M.glass(0xdff3ff, .38), { parent: ph, s: .27, ro: 4 }); const bac = S.mesh(G.capsule, M.soft(0x8a9a3a), { parent: ph, r: [0, 0, 1], s: V(.07, .16, .07) }); S.mesh(G.sphereLo, M.soft(0xd7a6d9), { parent: ph, p: V(.2, .12, 0), s: .05 }); S.add(ph);
  S.part('Phagosome', 'A bacterium captured by phagocytosis sits inside a membrane-bound bubble. Lysosome-like granules fuse with it and flood it with enzymes and reactive oxygen, which destroys the microbe.', ph);
  const rg = spikeGeo([[new THREE.CylinderGeometry(.008, .01, .08, 5), .04], [G.sphereLo, .09, [.025, .025, .025]]]), NRc = 130, rec = inst(rg, M.soft(0x9ee0d6, { roughness: .4 }), NRc), rd = fib(NRc); S.add(rec);
  S.part('Surface receptors', 'Protein receptors stud the membrane. Some recognise molecular patterns on bacteria, others sense chemical signals from damaged tissue, and antibody receptors bind microbes marked for destruction.', rec);
  const tmp = V(), q = new THREE.Quaternion(), dB = V(.45, -.35, .3).normalize();
  S.anim((t) => {
    T = t; ext = .22 + .12 * Math.sin(t * .6); body.update(rfn, sc);
    lobes.forEach((d, i) => pt(d, lf[i], lm[i].position));
    [[0, 1], [1, 2], [2, 3]].forEach(([a, b], i) => { const A = lm[a].position, B = lm[b].position, s = strands[i]; s.position.copy(A).add(B).multiplyScalar(.5); s.scale.set(.03, A.distanceTo(B), .03); s.quaternion.copy(qFromUp(B.clone().sub(A))); });
    gd.forEach((g, i) => { pt(g.d, g.f, tmp); setI(gr, i, tmp, null, g.s); }); gr.instanceMatrix.needsUpdate = true;
    pt(dB, .52, ph.position);
    rd.forEach((d, i) => { pt(d, 1.0, tmp); setI(rec, i, tmp, qFromUp(d), 1); }); rec.instanceMatrix.needsUpdate = true;
    S.group.rotation.y = Math.sin(t * .3) * .3;
  });
}

/* ================= NEURON ================= */
function buildNeuron(S) {
  const R = rng(27), SX = -3;
  const sg = new THREE.SphereGeometry(1, 72, 52), sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i), r = 1 + .13 * fbm(x * 1.6 + 3, y * 1.6, z * 1.6) + .12 * Math.pow(Math.max(0, x * -.7 + y * .5), 3); sp.setXYZ(i, x * r * .6, y * r * .62, z * r * .55); } sg.computeVertexNormals();
  const soma = S.mesh(sg, M.shell(0xe8c9a0, .42, { bumpScale: .8 }), { p: V(SX, 0, 0), ro: 9 });
  S.part('Soma (cell body)', 'The cell body keeps the neuron alive. It makes the proteins and membranes the rest of the cell needs, and integrates the thousands of signals arriving from the dendrites. It is typically 4 to 100 micrometres wide.', soma, { shell: true });
  const nuc = S.mesh(G.sphere, M.grain(0x8f7fc0), { p: V(SX, 0, 0), s: .27, ro: 3 }); S.mesh(G.sphere, M.soft(0x3c3270), { parent: nuc, s: .35 });
  S.part('Nucleus', 'A large, pale nucleus with a prominent nucleolus. Neurons stop dividing after birth, so most of the neurons you have now are the ones you grew early in life.', nuc);
  const ni = inst(G.sphereMid, M.soft(0x6f5aa8), 70); for (let i = 0; i < 70; i++) { const p = randInBall(R); if (p.length() < .45) p.setLength(.5 + R() * .2); setI(ni, i, p.multiply(V(.55, .55, .5)).add(V(SX, 0, 0)), null, V(.035 + R() * .02, .025, .035)); } S.add(ni);
  S.part('Nissl bodies', 'Clumps of rough endoplasmic reticulum and ribosomes that stain dark with basic dyes. Their abundance reflects how much protein the neuron makes, to sustain its signalling.', ni);
  // dendrites
  const dm = M.soft(0xe9cfae, { roughness: .5, transparent: true, opacity: .96 }), dg = new THREE.Group(), spineSites = [];
  const grow = (o, d, len, rad, depth) => {
    const side = perpBasis(d), up = V().crossVectors(d, side), pts = [o.clone()];
    for (let k = 1; k <= 4; k++) pts.push(o.clone().addScaledVector(d, len * k / 4).addScaledVector(side, (R() - .5) * len * .25).addScaledVector(up, (R() - .5) * len * .2));
    const cur = new THREE.CatmullRomCurve3(pts), tp = cur.getPoints(14); dg.add(tubePts(tp, 7, t => rad * (1 - t * .45), dm));
    if (depth > 0) for (let i = 0; i < 4; i++) { const t = R(), p = cur.getPoint(t), n = randDir(R); spineSites.push({ p, n }); }
    if (depth < 3) { const end = pts[4], dir = end.clone().sub(pts[3]).normalize(); for (let c = 0; c < 2; c++) { const nd = dir.clone().addScaledVector(randDir(R), .75).normalize(); grow(end, nd, len * .66, rad * .66, depth + 1); } }
  };
  [[-1, .5, .1], [-.7, 1, -.2], [-.1, 1, .3], [-1, -.4, .1], [-.5, -1, -.1], [-.05, -1, .2], [-.8, .1, -.9], [-.7, .1, .9]].forEach(v => { const d = V(...v).normalize(); grow(V(SX, 0, 0).addScaledVector(d, .5), d, 1.05, .1, 0); });
  S.add(dg); S.part('Dendrites', 'Branching extensions that receive signals from other neurons. A single neuron can have thousands of inputs. The tree-like branching greatly increases the surface area available for synapses.', dg);
  const spG = spikeGeo([[new THREE.CylinderGeometry(.009, .012, .05, 4), .025], [G.sphereLo, .06, [.024, .024, .024]]]), NSP = Math.min(260, spineSites.length), spi = inst(spG, M.soft(0xf0dcc0), NSP);
  spineSites.slice(0, NSP).forEach((s, i) => setI(spi, i, s.p, qFromUp(s.n), 1)); S.add(spi);
  S.part('Dendritic spines', 'Tiny protrusions on the dendrites, each carrying one or more synapses. Spines grow, shrink and change as we learn, which is one physical basis of memory.', spi);
  // axon
  const ax0 = V(SX + .55, 0, 0), ax1 = V(3.2, 0, 0), apath = new THREE.CatmullRomCurve3([V(SX + .45, 0, 0), V(SX + 1.1, .02, 0), V(-1, .2, .1), V(1, -.2, -.1), V(2.6, .12, 0), ax1]);
  const hill = tubeCurve(new THREE.CatmullRomCurve3([V(SX + .35, 0, 0), V(SX + .75, 0, 0), V(SX + 1.0, .015, 0)]), 10, 10, t => lerp(.2, .06, Math.pow(t, .6)), dm);
  const ax = tubeCurve(apath, 150, 8, .055, M.soft(0xf0d2d6)); const axg = new THREE.Group(); axg.add(hill, ax); S.add(axg);
  S.part('Axon hillock and axon', 'The axon hillock is where the neuron decides whether to fire. When enough input has arrived, it triggers an action potential that travels along the axon, a single fibre that can be more than a metre long in humans.', axg);
  const NM = 8, gap = .12, total = apath.getLength() - 1.1, L1 = (total - gap * NM) / NM, mg = new THREE.Group(), mats = [], nodes = new THREE.Group(), mp = [], nodeX = [];
  const tg = new THREE.Vector3();
  for (let i = 0; i < NM; i++) {
    const u0 = (1.1 / apath.getLength()) + (i * (L1 + gap)) / apath.getLength(), uc = u0 + (L1 / 2) / apath.getLength(), c = apath.getPointAt(Math.min(uc, 1)), tg2 = apath.getTangentAt(Math.min(uc, 1));
    const m = M.shell(0xf3e8c4, .6, { bumpScale: .3, emissive: 0x2cd6c8, emissiveIntensity: 0 }), s = new THREE.Mesh(G.sphere, m); s.position.copy(c); s.scale.set(L1 / 2, .15, .15); s.quaternion.setFromUnitVectors(V(1, 0, 0), tg2); s.renderOrder = 6; mg.add(s); mats.push(m); mp.push(c.x);
    const un = u0 + (L1 + gap / 2) / apath.getLength(); if (i < NM - 1) { const nc = apath.getPointAt(Math.min(un, 1)), n = new THREE.Mesh(new THREE.TorusGeometry(.075, .016, 8, 20), M.emit(0x7fe0d6, .5)); n.position.copy(nc); n.quaternion.setFromUnitVectors(V(0, 0, 1), apath.getTangentAt(Math.min(un, 1))); nodes.add(n); nodeX.push(nc.x); }
  }
  S.add(mg); S.add(nodes);
  S.part('Myelin sheath', 'Segments of fatty insulation wrapped around the axon by support cells (oligodendrocytes in the brain, Schwann cells in nerves). Myelin makes signals travel up to 100 times faster and saves energy. Damage to it underlies diseases such as multiple sclerosis.', mg);
  S.part('Nodes of Ranvier', 'Small gaps between myelin segments where the axon membrane is exposed and crowded with sodium channels. The action potential jumps from node to node, called saltatory conduction.', nodes);
  const bg = new THREE.Group(), bm = M.glass(0xf1c27d, .4), vm = M.emit(0x7fe0d6, .6), nvs = inst(G.sphereLo, vm, 40); let vi = 0;
  [[.55, .45, .15], [.7, .15, -.25], [.6, -.2, .25], [.5, -.55, -.1]].forEach(([dx, dy, dz]) => { const end = V(ax1.x + dx, dy, dz); bg.add(tubePts(new THREE.CatmullRomCurve3([ax1, V(ax1.x + dx * .5, dy * .4, dz * .4), end.clone().addScaledVector(V(dx, dy, dz).normalize(), -.1)]).getPoints(10), 6, t => .045 * (1 - t * .3), M.soft(0xf0d2d6)));
    const b = new THREE.Mesh(G.sphere, bm); b.position.copy(end); b.scale.setScalar(.13); b.renderOrder = 6; bg.add(b); for (let k = 0; k < 10; k++) setI(nvs, vi++, end.clone().add(randInBall(R).multiplyScalar(.08)), null, .018); });
  S.add(bg); S.add(nvs); S.part('Axon terminals', 'The axon ends in swellings called boutons. When an action potential arrives, vesicles inside fuse with the membrane and release neurotransmitter across the synapse to the next cell, within a fraction of a millisecond.', bg);
  S.part('Synaptic vesicles', 'Hundreds of tiny membrane bubbles packed with neurotransmitter, such as glutamate. Calcium entering the terminal makes them fuse and empty into the synaptic gap.', nvs);
  const pulse = S.mesh(G.sphere, M.emit(0x4df0e0, 2.2, { transparent: true, opacity: .9 }), { s: .09, ro: 10 });
  S.anim((t) => {
    const cyc = (t * .75) % 4.2, s = clamp(cyc / 3.4, 0, 1), on = cyc < 3.5; pulse.visible = on; if (on) { const u = lerp(.17, 1, s), p = apath.getPointAt(u); pulse.position.copy(p); pulse.scale.setScalar(.075 + .02 * Math.sin(t * 14)); }
    mats.forEach((m, i) => { const base = m.userData.hl ? m.emissiveIntensity : 0; m.emissiveIntensity = Math.max(base * 0, on ? .55 * Math.exp(-Math.pow((pulse.position.x - mp[i]) / .55, 2)) : 0); });
    nvs.material.emissiveIntensity = .5 + (cyc > 3.3 && cyc < 3.9 ? 1.5 : 0);
  });
}

/* ================= MUSCLE CELL ================= */
function buildMuscle(S) {
  const R = rng(33), fib0 = new THREE.Group(); fib0.rotation.z = Math.PI / 2; S.add(fib0);
  const prof = []; for (let i = 0; i <= 44; i++) { const y = -2.8 + 5.6 * i / 44; prof.push(V2(Math.max(.0005, .8 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(y) / 2.8, 10)))), y)); }
  const sl = S.mesh(new THREE.LatheGeometry(prof, 60), M.shell(0xe6b5a0, .2, { iridescence: .3, bumpScale: .6 }), { parent: fib0, ro: 9 });
  S.part('Sarcolemma', 'The plasma membrane of the muscle fibre. A fibre is a single, very long cell formed when many precursor cells fused, which is why it contains many nuclei. Signals travel along the sarcolemma and down into the fibre.', sl, { shell: true });
  const mm = M.soft(0xffffff, { map: TEX.sarcomere, roughness: .5 }), mf = new THREE.Group(), cyl = new THREE.CylinderGeometry(.085, .085, 4.8, 14, 1);
  const pos = [V(0, 0, 0)]; for (let i = 0; i < 6; i++) pos.push(V(0, Math.cos(i / 6 * TAU) * .2, Math.sin(i / 6 * TAU) * .2)); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = i % 2 ? .35 : .39; pos.push(V(0, Math.cos(a) * r, Math.sin(a) * r)); }
  pos.forEach(p => { const m = new THREE.Mesh(cyl, mm); m.position.copy(p); mf.add(m); }); fib0.add(mf);
  S.part('Myofibrils (striations)', 'Bundles of contractile filaments run the full length of the fibre. Their repeating units, the sarcomeres, line up across the bundle and create the striped look of skeletal muscle. Dark bands are thick myosin, light bands thin actin.', mf);
  const sr = S.mesh(new THREE.CylinderGeometry(.52, .52, 4.4, 24, 18, true), M.soft(0xe8a0b8, { wireframe: true, transparent: true, opacity: .45 }), { parent: fib0 });
  S.part('Sarcoplasmic reticulum', 'A net of membrane that wraps each myofibril and stores calcium. When it releases calcium, the filaments can slide and the fibre contracts; pumps then recapture it so the muscle relaxes.', sr);
  const tt = new THREE.Group(), tm = M.emit(0x7fe0d6, .45); for (let i = 0; i < 16; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.56, .014, 8, 36), tm); t.rotation.x = Math.PI / 2; t.position.y = -2.2 + i * .29; tt.add(t); } fib0.add(tt);
  S.part('T-tubules', 'Narrow tunnels of the sarcolemma that dive deep into the fibre. They carry the electrical signal to every sarcomere at once so the whole fibre contracts together.', tt);
  const nm = M.grain(0x8f7fc0), nuc = new THREE.Group(); for (let i = 0; i < 5; i++) { const n = new THREE.Mesh(G.sphere, nm), a = R() * TAU; n.position.set(Math.cos(a) * .7, -2.1 + i * 1.0 + R() * .4, Math.sin(a) * .7); n.scale.set(.12, .5, .2); n.rotation.y = -a; nuc.add(n); } fib0.add(nuc);
  S.part('Nuclei', 'A single fibre has hundreds of nuclei, pushed against the membrane so they do not get in the way of the contractile machinery. They control the maintenance and growth of the fibre.', nuc);
  const mits = new THREE.Group(), mmat = mitoMats(); for (let i = 0; i < 14; i++) { const m = mitochondrion(mmat, 1.1), a = R() * TAU, r = .56 + R() * .08; m.position.set(Math.cos(a) * r, -2.3 + R() * 4.6, Math.sin(a) * r); m.rotation.set(0, R() * TAU, 0); mits.add(m); } fib0.add(mits);
  S.part('Mitochondria', 'Rows of mitochondria sit between the myofibrils and supply ATP. Contraction burns a great deal of energy, so muscle fibres built for endurance contain especially many.', mits);
  // sarcomere inset
  const ins = new THREE.Group(); ins.position.set(0, -2.15, 0); S.add(ins);
  const zm = M.soft(0x4a1a24), tkm = M.soft(0xd9a066, { roughness: .35 }), tnm = M.soft(0x9bd6c8, { roughness: .35 }), Zs = [-1, 1].map(s => { const z = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .06, 24), zm); z.rotation.z = Math.PI / 2; ins.add(z); return z; });
  const lat = [V(0, 0, 0)].concat(Array.from({ length: 6 }, (_, i) => V(0, Math.cos(i / 6 * TAU) * .14, Math.sin(i / 6 * TAU) * .14)));
  const thick = new THREE.Group(); lat.forEach(p => { const t = new THREE.Mesh(G.cyl, tkm); t.rotation.z = Math.PI / 2; t.scale.set(.032, 1.1, .032); t.position.copy(p); thick.add(t); });
  const heads = inst(G.sphereLo, tkm, 7 * 44); let hi = 0; lat.forEach(p => { for (let k = 0; k < 44; k++) { const x = (k < 22 ? -1 : 1) * (.06 + (k % 22) * .023), a = k * 1.9; setI(heads, hi++, V(x, p.y + Math.cos(a) * .045, p.z + Math.sin(a) * .045), null, .017); } });
  thick.add(heads); ins.add(thick);
  const thin = [[], []]; const tl = new THREE.Group(); [-1, 1].forEach((s, si) => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = i % 2 ? .2 : .1, t = new THREE.Mesh(G.cyl, tnm); t.rotation.z = Math.PI / 2; t.scale.set(.014, .85, .014); t.position.set(0, Math.cos(a) * r, Math.sin(a) * r); tl.add(t); thin[si].push(t); } }); ins.add(tl);
  S.part('Z discs', 'Z discs mark the ends of each sarcomere, the unit that repeats along every myofibril. Thin filaments are anchored to them, and the Z discs are pulled together as the sarcomere shortens.', Zs[0].parent === ins ? Zs : Zs);
  S.part('Thick filaments (myosin)', 'Bundles of myosin with many heads sticking out. Powered by ATP, the heads bind the thin filaments and swing like oars, pulling the filaments past one another.', thick);
  S.part('Thin filaments (actin)', 'Strands of actin, anchored at the Z discs. During contraction they slide towards the centre of the sarcomere between the myosin, so the sarcomere shortens although the filaments themselves do not change length.', tl);
  S.anim((t) => {
    const k = .5 + .5 * Math.sin(t * 1.1), Ls = lerp(2.15, 1.55, k);
    Zs[0].position.x = -Ls / 2; Zs[1].position.x = Ls / 2;
    thin[0].forEach(m => m.position.x = -Ls / 2 + .425 + .03); thin[1].forEach(m => m.position.x = Ls / 2 - .425 - .03);
    mm.map.repeat.y = lerp(22, 28, k); mm.map.needsUpdate = false;
  });
}

/* ================= EPITHELIAL CELL ================= */
function buildEpithelial(S) {
  const R = rng(37), Rad = .55, h = 2.0, nd = Math.sqrt(3) * Rad * 1.04, dirs = [V()];
  for (let k = 0; k < 6; k++) { const a = (30 + 60 * k) * Math.PI / 180; dirs.push(V(Math.sin(a) * nd, 0, Math.cos(a) * nd)); }
  const cm = M.shell(0xd7a7c6, .22, { bumpScale: .3 }), gm = M.shell(0x9fc4e4, .24, { bumpScale: .3 }), cells = new THREE.Group(), gobletIdx = 3;
  dirs.forEach((p, i) => { const g = i === gobletIdx ? new THREE.CylinderGeometry(Rad * 1.12, Rad * .5, h, 6) : new THREE.CylinderGeometry(Rad, Rad, h, 6); const m = new THREE.Mesh(g, i === gobletIdx ? gm : cm); m.position.copy(p); m.renderOrder = 8; cells.add(m); });
  S.add(cells); S.part('Columnar cells', 'Tall, tightly packed cells form a single sheet that lines organs such as the small intestine. They absorb nutrients on the top (apical) surface and pass them down through the base into the blood supply.', cells, { shell: true });
  const mvG = new THREE.CylinderGeometry(.006, .008, .13, 4); mvG.translate(0, .065, 0);
  const NMV = 90, mv = inst(mvG, M.soft(0xf2e4ee, { transparent: true, opacity: .8 }), NMV * 6); let mi = 0;
  dirs.forEach((p, i) => { if (i === gobletIdx) return; for (let k = 0; k < NMV; k++) { const a = R() * TAU, r = Math.sqrt(R()) * Rad * .82; setI(mv, mi++, V(p.x + Math.cos(a) * r, h / 2, p.z + Math.sin(a) * r), null, .8 + R() * .5); } }); mv.count = mi; S.add(mv);
  S.part('Microvilli (brush border)', 'Thousands of finger-like projections on each cell. They multiply the absorbing surface about 20-fold and carry digestive enzymes, so the last steps of digestion happen right at the membrane.', mv);
  const nm = M.grain(0x8f7fc0), nuc = new THREE.Group(); dirs.forEach((p, i) => { const n = new THREE.Mesh(G.sphere, nm); n.position.set(p.x, -h * .3, p.z); n.scale.set(.3, .22, .3); n.renderOrder = 3; nuc.add(n); }); S.add(nuc);
  S.part('Nuclei', 'Each cell has one nucleus, positioned near the base. Their alignment at one level helps pathologists recognise this tissue type under the microscope.', nuc);
  const tj = new THREE.Group(), tm = M.emit(0x7fe0d6, .45); dirs.forEach((p, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(Rad * (i === gobletIdx ? 1.12 : 1) * .98, .014, 8, 6), tm); t.rotation.x = Math.PI / 2; t.rotation.z = Math.PI / 2; t.position.set(p.x, h / 2 - .08, p.z); tj.add(t); }); S.add(tj);
  S.part('Tight junctions', 'Belts of protein that seal neighbouring cells together just below the surface. They stop gut contents leaking between cells and keep the top and bottom membranes different from each other.', tj);
  const gp = V(dirs[gobletIdx].x, 0, dirs[gobletIdx].z), mg = inst(G.sphereMid, M.glass(0xcfe6f7, .65, { roughness: .2 }), 36); for (let i = 0; i < 36; i++) { const a = R() * TAU, r = Math.sqrt(R()) * .42; setI(mg, i, V(gp.x + Math.cos(a) * r, h * .12 + R() * h * .34, gp.z + Math.sin(a) * r), null, .065 + R() * .03); } S.add(mg);
  S.part('Goblet cell mucus', 'The wider blue-tinted cell is a goblet cell. It is packed with mucin granules that are released to coat and protect the lining. Mucus traps microbes and lets food slide through.', mg);
  const mt = new THREE.Group(), mmat = mitoMats(); for (let i = 0; i < 6; i++) { const m = mitochondrion(mmat, .75); m.position.set(R() * .3 - .15, -.4 + R() * .6, R() * .3 - .15); m.rotation.set(R() * 3, R() * 3, R() * 3); mt.add(m); } S.add(mt);
  S.part('Mitochondria', 'Absorption pumps molecules uphill and takes a lot of energy. Mitochondria cluster near the base of the cell, where the active transport proteins sit.', mt);
  const bm = S.mesh(new THREE.BoxGeometry(5, .1, 5), M.soft(0x7e9bd1, { transparent: true, opacity: .8 }), { p: V(0, -h / 2 - .08, 0) });
  const cg = new THREE.Group(); for (let i = 0; i < 14; i++) { const a = R() * Math.PI, c = V((R() - .5) * 4, -h / 2 - .22 - R() * .12, (R() - .5) * 4), d = V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(1.2); cg.add(line(c.clone().sub(d), c.clone().add(d), .02, M.soft(0xe7dcc8))); } S.add(cg);
  S.part('Basement membrane', 'A thin mat of collagen and other proteins that the cell sheet rests on. It anchors the epithelium and separates it from the connective tissue beneath it, where collagen fibres run.', [bm, cg]);
  S.anim((t) => { S.group.rotation.y = Math.sin(t * .2) * .35; });
}

/* ================= PLANT CELL (and shared parts) ================= */
function buildPlantCell(S) {
  const wm = M.shell(0x87b86a, .3, { bumpMap: TEX.cellulose, bumpScale: 2 }), pm = M.shell(0xcfe3b0, .18, { bumpScale: .2 }), vm = M.glass(0x9ed1e8, .3);
  const wall = S.mesh(new RoundedBoxGeometry(3.4, 2.3, 2.3, 8, .3), wm, { ro: 10 }), memb = S.mesh(new RoundedBoxGeometry(3.2, 2.1, 2.1, 8, .28), pm, { ro: 9 });
  S.part('Cell wall', 'A rigid outer layer of cellulose fibres, hemicellulose and pectin. It gives the cell its box-like shape, supports the whole plant, and resists the pressure of water in the vacuole. Animal cells have nothing like it.', wall, { shell: true });
  S.part('Plasma membrane', 'A thin lipid bilayer just inside the wall. It controls what enters and leaves the cell and holds the cellulose-making enzymes that build the wall from outside in.', memb, { shell: true });
  const vac = S.mesh(new RoundedBoxGeometry(2.0, 1.3, 1.4, 8, .55), vm, { ro: 5 });
  S.part('Central vacuole', 'A huge sac of cell sap that takes up most of the cell. It stores water, sugars, ions and pigments, and its pressure (turgor) holds leaves and stems upright. A wilting plant has lost this pressure.', vac);
  S.cut(wm, pm, vm);
  const nuc = new THREE.Group(); nuc.position.set(-1.22, .35, .3); S.add(nuc);
  S.mesh(G.sphere, M.shell(0x8f7fc0, .5), { parent: nuc, s: .28, ro: 4 }); S.mesh(G.sphere, M.soft(0x3c3270), { parent: nuc, s: .09 });
  const R = rng(41), chrom = tubeCurve(loopCurve(R, 14, V(.1, .1, .1)), 120, 5, .01, M.emit(0xb7a8f5, .3)); nuc.add(chrom);
  S.part('Nucleus', 'Holds the genome inside a double membrane with pores. The dark centre is the nucleolus, where ribosomes are assembled. Plant cells usually have the nucleus pushed to the side by the big vacuole.', nuc);
  const NC = 20, chm = M.soft(0x3f9d38, { roughness: .45, emissive: 0x0b2a08, emissiveIntensity: .45 }), ch = inst(G.sphereMid, chm, NC), cd = [];
  for (let i = 0; i < NC; i++) cd.push({ s0: R(), v: (.012 + R() * .01), A: 1.36 + (R() - .5) * .1, B: .88 + (R() - .5) * .08, z: (R() * 2 - 1) * .85 });
  S.add(ch); S.part('Chloroplasts', 'Green organelles with chlorophyll, where photosynthesis turns light, water and carbon dioxide into sugar and oxygen. They arrange themselves in the cell to catch as much light as possible, and stream slowly around the edge.', ch);
  const mmat = mitoMats(), mits = new THREE.Group(), md = []; for (let i = 0; i < 8; i++) { const m = mitochondrion(mmat, .8); mits.add(m); md.push({ m, s0: R(), v: .008 + R() * .006, A: 1.27, B: .78, z: (R() * 2 - 1) * .7 }); } S.add(mits);
  S.part('Mitochondria', 'Plants have mitochondria too. They burn sugar made in the chloroplasts to release ATP for growth and transport at night and in tissues without light, such as roots.', mits);
  const gl = golgi(M.soft(0xe0b062, { transparent: true, opacity: .95 }), M.soft(0xe9c585), .75); gl.position.set(-.55, -.75, .5); gl.rotation.z = .3; S.add(gl);
  S.part('Golgi apparatus', 'Stacks of flattened sacs that sort, modify and package proteins and lipids. In plants they also make the complex sugars used to build the cell wall.', gl);
  const er = new THREE.Group(), em = M.soft(0x8bb9d8, { transparent: true, opacity: .75 }); for (let i = 0; i < 6; i++) { const a = R() * TAU, c = loopCurve(R, 6, V(.45, .3, .35), false); const t = tubeCurve(c, 40, 6, .028, em); t.position.set(-1.2 + (R() - .5) * .3, .35 + (R() - .5) * .3, .3 + (R() - .5) * .3); er.add(t); } S.add(er);
  S.part('Endoplasmic reticulum', 'A network of membrane tubes and sheets joined to the nuclear envelope. It makes and folds proteins and lipids, and links neighbouring cells through the plasmodesmata.', er);
  const pd = new THREE.Group(), pdm = M.soft(0xc7e0a0); [[.5, .2], [-.4, -.35], [.1, .6]].forEach(([y, z]) => { const c = new THREE.Mesh(G.cyl, pdm); c.rotation.z = Math.PI / 2; c.position.set(1.65, y, z); c.scale.set(.06, .3, .06); pd.add(c); }); S.add(pd);
  S.part('Plasmodesmata', 'Tiny channels that pass through the cell wall and connect the cytoplasm of neighbouring cells. Water, nutrients and signalling molecules move through, so the plant works like one connected body.', pd);
  const lp = (s, A, B, z, o) => { const c = Math.cos(TAU * s), sn = Math.sin(TAU * s); return o.set(A * Math.sign(c) * Math.pow(Math.abs(c), .55), B * Math.sign(sn) * Math.pow(Math.abs(sn), .55), z); }, tmp = V(), q = new THREE.Quaternion();
  S.anim((t) => {
    cd.forEach((c, i) => { lp(c.s0 + t * c.v, c.A, c.B, c.z, tmp); q.setFromEuler(new THREE.Euler(t * .2 + i, i, 0)); setI(ch, i, tmp, q, V(.2, .1, .1)); }); ch.instanceMatrix.needsUpdate = true;
    md.forEach(o => { lp(o.s0 + t * o.v, o.A, o.B, o.z, o.m.position); o.m.rotation.set(o.s0 * 6 + t * .1, 0, o.s0 * 3); });
  });
}

/* ================= GUARD CELLS ================= */
function buildGuard(S) {
  const R = rng(43), n = 44, gm = M.shell(0x8fcf7a, .42, { bumpScale: .5, iridescence: .2 }), tubes = [1, -1].map(() => new Tube(n, 22, gm)), pts = [Array.from({ length: n + 1 }, () => V()), Array.from({ length: n + 1 }, () => V())];
  tubes.forEach(t => { t.mesh.renderOrder = 8; S.add(t.mesh); });
  const caps = [-1, 1].map(() => S.mesh(G.sphere, gm, { s: .2, ro: 8 })), gg = new THREE.Group(); tubes.forEach(t => gg.add(t.mesh)); caps.forEach(c => gg.add(c)); S.group.add(gg);
  S.part('Guard cells', 'Two bean-shaped cells that surround each stoma. Their inner walls are thicker than their outer walls, so when they fill with water the cells bow apart and the pore opens. When they lose water, the pore closes.', gg, { shell: true });
  const pore = S.mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: 0x06141c }), { p: V(0, 0, -.28) });
  S.part('Stomatal pore', 'The opening that lets carbon dioxide in for photosynthesis and water vapour and oxygen out. Plants open stomata in light and close them in drought, balancing food-making against water loss.', pore);
  const nm = M.grain(0x8f7fc0), nuc = [0, 1].map(() => S.mesh(G.sphere, nm, { s: .13, ro: 3 })), ng = new THREE.Group(); nuc.forEach(n => ng.add(n)); S.group.add(ng);
  S.part('Nuclei', 'Each guard cell has its own nucleus. Guard cells are fully alive and respond to light, humidity and carbon dioxide by changing the ion content of their vacuoles.', ng);
  const NCH = 9, chm = M.soft(0x3f9d38, { roughness: .45, emissive: 0x0b2a08, emissiveIntensity: .45 }), chl = [0, 1].map(() => inst(G.sphereMid, chm, NCH)), cd = Array.from({ length: NCH }, () => ({ t: .12 + R() * .76, a: R() * TAU, r: .4 + R() * .35, ph: R() * 3 })); chl.forEach(c => S.add(c));
  const cg = new THREE.Group(); chl.forEach(c => cg.add(c)); S.group.add(cg); S.part('Chloroplasts', 'Unusually for epidermal cells, guard cells have chloroplasts. They help the cells make sugar and take up ions, which draws in the water that opens the pore.', cg);
  const pav = new THREE.Group(), pm = M.shell(0xa7cf8a, .2, { bumpScale: .3 });
  [[-3.1, 0, 2.2, 1.7], [3.1, 0, 2.2, 1.7], [0, 1.95, 3.8, 1.2], [0, -1.95, 3.8, 1.2], [-3.0, 1.9, 1.6, 1.0], [3.0, -1.9, 1.6, 1.0]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, .55, 5, .2), pm); m.position.set(x, y, 0); m.renderOrder = 6; pav.add(m); }); S.add(pav);
  S.part('Epidermal cells', 'Flat, interlocking cells that form the leaf skin. They are coated with a waxy cuticle to hold in water, and stomata are the only gaps in this barrier.', pav, { shell: true });
  const tmp = V();
  S.anim((t) => {
    const o = .5 + .5 * Math.sin(t * .55), ph = .03 + .27 * o, bow = .3 + .06 * o;
    [1, -1].forEach((k, ci) => {
      for (let i = 0; i <= n; i++) { const s = -1 + 2 * i / n; pts[ci][i].set(s * 1.6, k * (ph * (1 - s * s) + bow * Math.pow(1 - s * s, .7)), 0); }
      tubes[ci].update(pts[ci], tt => { const s = 2 * tt - 1; return .1 + .26 * Math.pow(Math.max(0, 1 - s * s), .5); });
      caps[ci].position.copy(pts[ci][ci ? n : 0]).setX(ci ? 1.6 : -1.6).setY(0); caps[ci].scale.setScalar(.1);
      nuc[ci].position.copy(pts[ci][n / 2]); nuc[ci].position.z = .0;
      cd.forEach((c, i) => { const p = pts[ci][Math.round(c.t * n)]; tmp.set(p.x, p.y + Math.cos(c.a + t * .3 * c.ph) * .1 * c.r, Math.sin(c.a + t * .3 * c.ph) * .16 * c.r); setI(chl[ci], i, tmp, null, V(.1, .06, .05)); }); chl[ci].instanceMatrix.needsUpdate = true;
    });
    pore.scale.set(1.6, Math.max(.02, ph - .03), 1);
  });
}

/* ================= POLLEN ================= */
function buildPollen(S) {
  const R = rng(47), g = new THREE.Group(); S.add(g);
  const eg = new THREE.SphereGeometry(1, 96, 72), ep = eg.attributes.position;
  for (let i = 0; i < ep.count; i++) { const x = ep.getX(i), y = ep.getY(i), z = ep.getZ(i), r = 1 + .02 * fbm(x * 9, y * 9, z * 9); ep.setXYZ(i, x * r, y * r, z * r); } eg.computeVertexNormals();
  const em = M.grain(0xd9a92b, { roughness: .6, side: THREE.DoubleSide }), ex = S.mesh(eg, em, { parent: g });
  S.part('Exine (outer wall)', 'An extremely tough shell of sporopollenin, one of the most chemically resistant natural materials. It protects the sperm cells for days to years, which is why fossil pollen survives for millions of years.', ex, { shell: true });
  const aps = [0, 1, 2].map(i => V(Math.cos(i / 3 * TAU), 0, Math.sin(i / 3 * TAU))), sd = fib(560).filter(d => aps.every(a => a.angleTo(d) > .36)), sm = M.soft(0xe9bc3d, { roughness: .5 }), spg = new THREE.ConeGeometry(.034, .16, 6); spg.translate(0, .08, 0);
  const spk = inst(spg, sm, sd.length); sd.forEach((d, i) => setI(spk, i, d.clone().multiplyScalar(.995), qFromUp(d.clone().addScaledVector(randDir(R), .05)), .85 + R() * .35)); g.add(spk);
  S.part('Spines (echinate sculpture)', 'The spiny surface helps pollen grab on to insects, and its pattern is specific to each plant group. Scientists identify plants, and even the season and place a sample came from, by reading these patterns.', spk);
  const apm = M.soft(0x7a5a14, { side: THREE.DoubleSide }), apg = new THREE.Group(); aps.forEach(a => { const c = new THREE.Mesh(new THREE.CircleGeometry(.24, 32), apm); c.position.copy(a).multiplyScalar(.985); c.lookAt(a.clone().multiplyScalar(3)); apg.add(c); const rm = new THREE.Mesh(new THREE.TorusGeometry(.24, .02, 8, 32), sm); rm.position.copy(a).multiplyScalar(.99); rm.lookAt(a.clone().multiplyScalar(3)); apg.add(rm); }); g.add(apg);
  S.part('Apertures (pores)', 'Thin regions in the wall where the exine is missing. Water enters through them when the grain lands on a stigma, and one of them is where the pollen tube breaks out.', apg);
  const im = S.mesh(G.sphere, M.shell(0xf0e0a0, .28, { bumpScale: .2 }), { parent: g, s: .92, ro: 9 });
  S.part('Intine (inner wall)', 'A softer inner wall of cellulose and pectin underneath the exine. It becomes the wall of the pollen tube when the grain germinates.', im, { shell: true });
  const gr = inst(G.sphereLo, M.soft(0xe8d48a), 170); for (let i = 0; i < 170; i++) setI(gr, i, randInBall(R).multiplyScalar(.8), null, .018 + R() * .012); g.add(gr);
  S.part('Cytoplasm and reserves', 'Starch and lipid granules provide the energy the grain needs to grow its pollen tube, which can race down the style at several millimetres an hour.', gr);
  const vn = S.mesh(G.sphere, M.grain(0x8f7fc0), { parent: g, p: V(-.2, .1, .1), s: .26, ro: 3 });
  S.part('Vegetative nucleus', 'The tube nucleus directs the growth of the pollen tube. It leads the way as the tube elongates towards the egg cell.', vn);
  const gc = S.mesh(G.sphere, M.soft(0xb7a8f5, { transparent: true, opacity: .85 }), { parent: g, p: V(.3, -.2, .25), s: V(.3, .13, .13), r: [0, 0, .6], ro: 3 }), sg = new THREE.Group();
  [[.18, -.16, .3], [.38, -.25, .22]].forEach(p => { const s = new THREE.Mesh(G.capsule, M.emit(0x4ccfc0, .5)); s.position.set(...p); s.rotation.z = .6; s.scale.set(.05, .1, .05); sg.add(s); }); g.add(sg);
  S.part('Generative cell and sperm', 'The generative cell divides to make two sperm cells. In flowering plants both take part in double fertilisation: one joins the egg to make the embryo, the other joins nuclei that make the nutritive endosperm.', [gc, sg]);
  // pollen tube
  const tc = new THREE.CatmullRomCurve3([V(1, 0, 0), V(1.5, .15, .1), V(2.1, -.15, .2), V(2.8, .15, .05), V(3.4, -.05, -.1)]), tt = new Tube(40, 12, M.shell(0xe8d48e, .5, { bumpScale: .2 })), tp = Array.from({ length: 41 }, () => V()), tip = S.mesh(G.sphere, M.shell(0xe8d48e, .5), { parent: g, s: .1 });
  g.add(tt.mesh); S.part('Pollen tube', 'After landing on a stigma, the grain absorbs water and grows a tube. The tube follows chemical signals from the ovule, delivering the sperm cells to the egg. Growth is concentrated at the tip.', [tt.mesh, tip]);
  S.cut(em, sm, apm);
  const mini = []; [[-3.2, 1.6, -3.5, .45], [3.4, -1.2, -4, .38], [-2.4, -2.1, -4.5, .3], [2.8, 2.3, -4.5, .33]].forEach(([x, y, z, s]) => { const m = new THREE.Group(); m.position.set(x, y, z); m.scale.setScalar(s); m.add(new THREE.Mesh(eg, em)); const sp = inst(spg, sm, sd.length); sp.instanceMatrix = spk.instanceMatrix; m.add(sp); S.add(m); mini.push(m); });
  S.anim((t) => {
    g.rotation.y = t * .17; g.rotation.x = .2 * Math.sin(t * .22);
    const cyc = t % 16, grow = sstep(1, 12, cyc) * (cyc < 14 ? 1 : 1 - sstep(14, 15.5, cyc)); tt.mesh.visible = tip.visible = grow > .03;
    if (grow > .03) { for (let i = 0; i <= 40; i++) tc.getPoint(Math.min(.999, grow * i / 40), tp[i]); tt.update(tp, () => .11); tip.position.copy(tp[40]); tip.scale.setScalar(.11); }
    mini.forEach((m, i) => { m.rotation.y = t * (.1 + i * .03); m.rotation.x = t * .06; });
  });
}

/* ================= CHLOROPLAST ================= */
function buildChloroplast(S) {
  const R = rng(53), A = V(1.7, .95, .95);
  const oM = M.shell(0x9fd48a, .22, { iridescence: .3, bumpScale: .6 }), iM = M.shell(0xb7e0a0, .18, { bumpScale: .2 }), outer = S.mesh(G.sphere, oM, { s: A, ro: 9 }), inner = S.mesh(G.sphere, iM, { s: A.clone().multiplyScalar(.94), ro: 8 });
  S.part('Outer membrane', 'The outer layer of the double envelope. It is permeable to small molecules. Chloroplasts descend from free-living cyanobacteria that were engulfed by an early cell more than a billion years ago.', outer, { shell: true });
  S.part('Inner membrane and stroma', 'The inner membrane is a selective barrier that controls what enters. Inside it, the stroma is the thick fluid where the Calvin cycle uses ATP and NADPH to fix carbon dioxide into sugar.', inner, { shell: true });
  const NG = 14, nd = 8, pos = []; let tries = 0; while (pos.length < NG && tries++ < 2000) { const p = randInBall(R).multiply(A.clone().multiplyScalar(.72)); if (pos.every(q => q.distanceTo(p) > .5)) pos.push(p); }
  const disc = new THREE.CylinderGeometry(.17, .17, .03, 20), gm = M.soft(0x2f8f2c, { roughness: .4, emissive: 0x0e3a0a, emissiveIntensity: .45 }), gr = inst(disc, gm, pos.length * nd), tilt = pos.map(() => new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - .5) * .8, R() * TAU, (R() - .5) * .8)));
  pos.forEach((p, i) => { for (let k = 0; k < nd; k++) { const off = V(0, (k - (nd - 1) / 2) * .048, 0).applyQuaternion(tilt[i]); setI(gr, i * nd + k, p.clone().add(off), tilt[i], 1 - Math.abs(k - 3.5) * .03); } }); S.add(gr);
  S.part('Grana (thylakoid stacks)', 'Stacks of flattened sacs called thylakoids, like piles of coins. Their membranes hold chlorophyll and the proteins of the light reactions, which split water, release oxygen and make ATP.', gr);
  const lm = new THREE.Group(), lmat = M.soft(0x58b24c, { transparent: true, opacity: .8 }); pos.forEach((p, i) => { const near = pos.map((q, j) => ({ j, d: p.distanceTo(q) })).filter(o => o.j > i).sort((a, b) => a.d - b.d).slice(0, 2); near.forEach(o => lm.add(line(p, pos[o.j], .016, lmat))); }); S.add(lm);
  S.part('Stroma lamellae', 'Unstacked thylakoid membranes that link one granum to the next. They create a single continuous inner space, so protons and proteins can move between stacks.', lm);
  const st = S.mesh(G.sphere, M.soft(0xf2ecd8, { roughness: .6 }), { p: V(-1.0, -.35, .15), s: V(.35, .25, .25) }), st2 = S.mesh(G.sphere, M.soft(0xf2ecd8, { roughness: .6 }), { p: V(1.0, .35, -.1), s: V(.28, .2, .22) }), stg = new THREE.Group(); stg.add(st, st2); S.group.add(stg);
  S.part('Starch granules', 'Temporary stores of the sugars made in daylight, built up as dense white grains. At night the chloroplast breaks them down to feed the plant.', stg);
  const pg = inst(G.sphereMid, M.soft(0xe39a2b, { roughness: .3 }), 14); for (let i = 0; i < 14; i++) setI(pg, i, randInBall(R).multiply(A).multiplyScalar(.75), null, .04 + R() * .02); S.add(pg);
  S.part('Plastoglobuli', 'Orange lipid droplets attached to the thylakoids. They store pigments and quinones, and take part in building and repairing the thylakoid membranes.', pg);
  const dna = tubeCurve(new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => V(Math.cos(i / 12 * TAU) * .2 + .2, Math.sin(i / 12 * TAU) * .12 + (R() - .5) * .05, (R() - .5) * .15)).map(v => v.add(V(.5, -.45, .55))), true), 80, 5, .013, M.emit(0xb7a8f5, .4)), rb = ribosomeCloud(90, r => randInBall(r).multiply(A).multiplyScalar(.8), M.soft(0xe8a45b), .017, 55); S.add(dna, rb);
  S.part('Chloroplast DNA and ribosomes', 'Chloroplasts keep a small circular genome of about 120 genes and their own bacterial-type ribosomes. Most chloroplast proteins, however, are encoded in the nucleus and imported.', [dna, rb]);
  S.anim((t) => { S.group.rotation.y = t * .1; S.group.rotation.x = .25 + Math.sin(t * .3) * .1; gm.emissiveIntensity = .4 + .2 * Math.sin(t * 1.5); });
}

/* ================= ANIMAL CELL (anatomy) ================= */
function buildAnimalCell(S) {
  const R = rng(61), mg = new THREE.SphereGeometry(1, 72, 52), mp = mg.attributes.position;
  for (let i = 0; i < mp.count; i++) { const x = mp.getX(i), y = mp.getY(i), z = mp.getZ(i), r = 1 + .035 * fbm(x * 2, y * 2, z * 2); mp.setXYZ(i, x * r * 2.1, y * r * 1.85, z * r * 1.85); } mg.computeVertexNormals();
  const mm = M.shell(0xc9dcea, .2, { bumpScale: .8, iridescence: .4 }), mem = S.mesh(mg, mm, { ro: 10 });
  S.part('Plasma membrane', 'A double layer of phospholipids with embedded proteins. It is selectively permeable: it separates the cell from its surroundings, carries receptors and transport proteins, and is flexible because animal cells lack a wall.', mem, { shell: true });
  S.cut(mm);
  const nuc = new THREE.Group(); nuc.position.set(-.35, .1, 0); S.add(nuc);
  S.mesh(G.sphere, M.shell(0x8f7fc0, .38, { bumpScale: .5 }), { parent: nuc, s: .72, ro: 4 }); S.mesh(G.sphere, M.soft(0x3c3270), { parent: nuc, s: .17, p: V(.18, .05, .1) });
  nuc.add(tubeCurve(loopCurve(R, 22, V(.3, .3, .3)), 220, 5, .013, M.emit(0xb7a8f5, .3)));
  nuc.add(nuclearPores(60, .72, M.soft(0xd0c8f5), R));
  S.part('Nucleus', 'The control centre. A double membrane with nuclear pores encloses the DNA, coiled as chromatin. The dense nucleolus makes ribosome subunits. Messenger RNA copies of genes leave through the pores.', nuc);
  const erM = M.soft(0x8bb9d8, { transparent: true, opacity: .9 }), rer = new THREE.Group();
  for (let i = 0; i < 5; i++) { const gm = bendGeo(new THREE.SphereGeometry(1, 28, 12), -.3), m = new THREE.Mesh(gm, erM), d = 1.05 + i * .13; m.scale.set(.6 + i * .08, .035, .42 + i * .06); m.position.set(-.35 + .15 + i * .04, .1 - .72 - i * .1 + .6, -.2 + i * .15); m.rotation.set(.7, 0, .6); rer.add(m); }
  S.add(rer);
  const rib = ribosomeCloud(220, r => V((r() - .5) * 1.6 - .1, (r() - .5) * 1.4 - .25, (r() - .5) * 1.5 - .2), M.soft(0xe8a45b), .018, 71); S.add(rib);
  S.part('Rough endoplasmic reticulum', 'Flattened membrane sheets studded with ribosomes, continuous with the nuclear envelope. Proteins destined for secretion or for membranes are made here and folded.', [rer, rib]);
  const ser = new THREE.Group(); for (let i = 0; i < 6; i++) { const c = loopCurve(R, 7, V(.55, .4, .4), false), t = tubeCurve(c, 50, 7, .04, M.soft(0x9ad0e0, { transparent: true, opacity: .85 })); t.position.set(.5 + (R() - .5) * .4, -.9 + (R() - .5) * .4, .4 + (R() - .5) * .5); ser.add(t); } S.add(ser);
  S.part('Smooth endoplasmic reticulum', 'A web of branching tubes without ribosomes. It makes lipids and steroids, stores calcium, and in the liver breaks down drugs and toxins.', ser);
  const gl = golgi(M.soft(0xe0b062, { transparent: true, opacity: .95 }), M.soft(0xe9c585), 1.1); gl.position.set(1.05, .4, .35); gl.rotation.set(.3, .5, 1.1); S.add(gl);
  S.part('Golgi apparatus', 'The post office of the cell. Stacked cisternae receive vesicles from the ER, modify the proteins (for example by adding sugars), then sort and ship them in new vesicles to their destination.', gl);
  const mmat = mitoMats(), mits = new THREE.Group(), md = []; for (let i = 0; i < 9; i++) { const m = mitochondrion(mmat, 1.15); const p = randInBall(R).multiply(V(1.5, 1.2, 1.2)); if (p.distanceTo(V(-.35, .1, 0)) < 1) p.add(V(1.2, -.4, 0)); m.position.copy(p); m.rotation.set(R() * 3, R() * 3, R() * 3); mits.add(m); md.push({ m, p: p.clone(), ph: R() * TAU }); } S.add(mits);
  S.part('Mitochondria', 'Each has a smooth outer membrane and a folded inner membrane (cristae) packed with ATP synthase. They make most of the cell\'s ATP using oxygen, and carry their own small DNA.', mits);
  const ly = inst(G.sphereMid, M.grain(0x7d4f93), 7); for (let i = 0; i < 7; i++) setI(ly, i, randInBall(R).multiply(V(1.5, 1.2, 1.2)).add(V(0, 0, 0)), null, .12 + R() * .04); S.add(ly);
  S.part('Lysosomes', 'Small acid-filled sacs of digestive enzymes. They break down worn-out organelles, food particles and invaders, recycling the building blocks. Faulty lysosomes cause storage diseases.', ly);
  const pe = inst(G.sphereMid, M.soft(0xd9c28a), 4); for (let i = 0; i < 4; i++) setI(pe, i, randInBall(R).multiply(V(1.5, 1.2, 1.2)).add(V(.3, .2, 0)), null, .1); S.add(pe);
  S.part('Peroxisomes', 'Small organelles that break down fatty acids and neutralise hydrogen peroxide with the enzyme catalase, a harmful by-product of their own reactions.', pe);
  const cen = new THREE.Group(), cm = M.soft(0x7fd1b9); for (let k = 0; k < 2; k++) { const c = new THREE.Group(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, t = new THREE.Mesh(G.cyl, cm); t.position.set(Math.cos(a) * .045, 0, Math.sin(a) * .045); t.scale.set(.014, .22, .014); c.add(t); } c.position.set(k * .1, 0, k * -.05); c.rotation.z = k * Math.PI / 2; cen.add(c); } cen.position.set(.55, .45, .1); S.add(cen);
  S.part('Centrioles', 'Two short cylinders of nine microtubule triplets, at right angles to each other. They organise the centrosome, which anchors microtubules and helps pull chromosomes apart during division.', cen);
  const mts = new THREE.Group(), tm = M.soft(0x7fd1b9, { transparent: true, opacity: .7 }); for (let i = 0; i < 18; i++) { const d = randDir(R), e = d.clone().multiply(V(1.9, 1.65, 1.65)).multiplyScalar(.93), s = cen.position, mid = s.clone().lerp(e, .5).add(randDir(R).multiplyScalar(.15)); mts.add(tubeCurve(new THREE.CatmullRomCurve3([s.clone(), mid, e]), 16, 5, .012, tm)); } S.add(mts);
  S.part('Microtubules (cytoskeleton)', 'Hollow protein tubes that radiate from the centrosome. They give the cell its shape, act as tracks for motor proteins that haul vesicles, and form the spindle in cell division.', mts);
  S.anim((t) => { md.forEach((o, i) => { o.m.position.set(o.p.x + Math.sin(t * .3 + o.ph) * .05, o.p.y + Math.cos(t * .27 + o.ph) * .05, o.p.z); }); S.group.rotation.y = Math.sin(t * .15) * .15; });
}
