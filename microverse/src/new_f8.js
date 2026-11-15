/* ================= F8: Rhizopus stolonifer (black bread mould) ================= */
function f8Rhizoid(S, parent, base, dir, mat, R, out, depth = 0, len = 1.9) {
  const pts = [base.clone()]; let p = base.clone(), d = dir.clone();
  for (let i = 0; i < 4; i++) { d.add(V((R() - .5) * .5, -.12, (R() - .5) * .4)).normalize(); p = p.clone().addScaledVector(d, len / 4); pts.push(p.clone()); }
  const m = tubeCurve(new THREE.CatmullRomCurve3(pts), 18, 6, u => (.07 - depth * .022) * (1 - u * .65), mat); parent.add(m); out.push(m);
  if (depth < 2) for (let k = 0; k < 2; k++) { const u = .4 + k * .3, i = Math.floor(u * 4), q = pts[i].clone().lerp(pts[i + 1], u * 4 - i); f8Rhizoid(S, parent, q, d.clone().add(V((R() - .5) * 1.4, -.2, (R() - .5) * 1.4)).normalize(), mat, R, out, depth + 1, len * .55); }
}
function f8Sporangium(S, parent, c, r, nSp, seed, mats, P) {
  const R = rng(seed), g = new THREE.Group(); g.position.copy(c); parent.add(g);
  P.sporangium.push(S.mesh(new THREE.SphereGeometry(1, 40, 28), mats.wall, { parent: g, s: r, ro: 9 }));
  P.columella.push(S.mesh(G.sphere, mats.col, { parent: g, p: V(0, -r * .38, 0), s: V(r * .55, r * .5, r * .55) }));
  const sp = inst(G.sphereLo, mats.spore, nSp), base = [], ph = [];
  for (let i = 0; i < nSp; i++) { let q; do { q = randInBall(R).multiplyScalar(r * .93); } while (((q.x / (r * .55)) ** 2 + ((q.y + r * .38) / (r * .5)) ** 2 + (q.z / (r * .55)) ** 2) < 1.1); base.push(q); ph.push(R() * TAU); }
  const rot = base.map(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 6, R() * 6, R() * 6))), sc = V(.05, .035, .035).multiplyScalar(r / 1.1 * 1.4), pp = V();
  g.add(sp); P.spores.push(sp);
  S.anim(t => {
    for (let i = 0; i < nSp; i++) { const a = ph[i]; pp.set(base[i].x + Math.sin(t * .9 + a) * .03 * r, base[i].y + Math.cos(t * 1.1 + a * 1.7) * .03 * r, base[i].z + Math.sin(t * .8 + a * 2.3) * .03 * r); setI(sp, i, pp, rot[i], sc); }
    sp.instanceMatrix.needsUpdate = true;
  });
  return g;
}
function buildRhizopus(S) {
  const R = rng(61), root = new THREE.Group(); S.add(root); root.position.y = -.3;
  const hy = M.shell(0xd9cfae, .62, { bumpScale: .2, roughness: .45 }), mats = {
    wall: M.shell(0x3e3c38, .56, { bumpScale: .5, roughness: .5 }), col: M.soft(0xd8cfb4, { roughness: .5 }), spore: M.grain(0x8b8272, { roughness: .55, bumpScale: 1.4 }) },
    nucM = M.emit(0x7a4f78, .3, { roughness: .4 }), rhM = M.shell(0xd6cdb4, .62, { bumpScale: .2 });
  const P = { sporangium: [], columella: [], spores: [], stipe: [], stolon: [], rhiz: [], nuc: [] };
  const yb = -3.1;
  /* stolon with three nodes, arching between them */
  const L = new THREE.CatmullRomCurve3([V(-5.2, yb - .2, .2), V(-4.2, yb + .7, .3), V(-2.6, yb + .95, .1), V(-1.1, yb + .4, 0), V(0, yb, 0)]);
  const Rr = new THREE.CatmullRomCurve3([V(0, yb, 0), V(1.2, yb + .5, -.1), V(2.8, yb + .85, -.2), V(4.1, yb + .5, -.1), V(5.2, yb - .1, -.2)]);
  [L, Rr].forEach(c => { const m = tubeCurve(c, 60, 10, .1, hy); m.renderOrder = 7; root.add(m); P.stolon.push(m); });
  [V(-5.2, yb - .2, .2), V(0, yb, 0), V(5.2, yb - .1, -.2)].forEach((b, i) => { for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + i; f8Rhizoid(S, root, b, V(Math.cos(a) * .55, -1, Math.sin(a) * .55).normalize(), rhM, R, P.rhiz, 0, i === 1 ? 2.1 : 1.8); } });
  /* sporangiophores in a tuft at the middle node */
  const tuft = new THREE.Group(); tuft.position.set(0, yb, 0); root.add(tuft);
  const stalks = [{ h: 5.6, x: .1, z: 0, r: 1.15, n: 300 }, { h: 3.6, x: -.45, z: .35, r: .72, n: 110 }, { h: 2.5, x: .6, z: -.4, r: .55, n: 70 }];
  stalks.forEach((s, i) => {
    const c = new THREE.CatmullRomCurve3([V(0, 0, 0), V(s.x * .3, s.h * .4, s.z * .3), V(s.x, s.h, s.z)]);
    const m = tubeCurve(c, 28, 10, u => .095 + .02 * u, hy); m.renderOrder = 7; tuft.add(m); P.stipe.push(m);
    f8Sporangium(S, tuft, V(s.x, s.h + s.r * .95, s.z), s.r, s.n, 70 + i, mats, P);
  });
  /* nuclei streaming along the stolon (coenocytic hyphae) */
  const NN = 26, nuc = inst(G.sphereLo, nucM, NN), off = Array.from({ length: NN }, () => R()), side = Array.from({ length: NN }, () => randDir(R).multiplyScalar(.05));
  root.add(nuc); P.nuc.push(nuc);
  S.anim(t => {
    for (let i = 0; i < NN; i++) { const half = i % 2, c = half ? Rr : L, u = (off[i] + t * .02 * (half ? 1 : -1) + 1) % 1; setI(nuc, i, c.getPointAt(u).add(side[i]), null, .055); }
    nuc.instanceMatrix.needsUpdate = true;
    root.rotation.y = Math.sin(t * .1) * .3; tuft.rotation.z = Math.sin(t * .27) * .02; tuft.rotation.x = Math.sin(t * .21) * .02;
  });
  S.part('Sporangium', 'A round sac that starts pale and turns black as it ripens, which gives the mould its common name. Its wall encloses many thousands of spores and it is about 100–350 µm across. When the wall dries and breaks, the spores are released into the air.', P.sporangium, { shell: true });
  S.part('Sporangiospores', 'The spores formed inside the sporangium: single-celled, ovoid to angular and grey-brown, about 5–11 µm long with a ribbed surface. Wind, insects and air currents spread them, and each can grow into a new mycelium on suitable food.', P.spores);
  S.part('Columella', 'A dome-shaped swelling at the tip of the sporangiophore that pushes up into the sporangium and is cut off from the stalk by a cross wall. It supports the spore mass, and it remains as a little umbrella after the spores are shed.', P.columella);
  S.part('Sporangiophores', 'Upright, unbranched stalks that grow in tufts from a node. Each carries one sporangium at its tip. They lift the spores above the food and can reach millimetres in height, which is more than this view shows.', P.stipe);
  S.part('Stolon', 'A horizontal runner that arches over the surface and touches down at intervals. At each touch point it forms a node with rhizoids below and sporangiophores above. This habit gave the species its name, Rhizopus stolonifer.', P.stolon);
  S.part('Rhizoids', 'Branched, root-like hyphae that grow into the food. They anchor the mould and secrete enzymes that digest starch, pectin and other substances; the dissolved nutrients are absorbed through the hyphal wall.', P.rhiz);
  S.part('Nuclei in coenocytic hyphae', 'Rhizopus hyphae have no cross walls in the growing mycelium, so many nuclei share one stream of cytoplasm that flows toward the growing tips. Cross walls form only to cut off reproductive structures or to seal off damaged parts.', P.nuc);
}
NEWBUILD.rhizopus = buildRhizopus;
NEW_SPEC.push({ id: 'rhizopus', cat: 'fungi', name: 'Rhizopus', latin: 'Rhizopus stolonifer', size: 'sporangium 100–350 µm; stalks up to a few mm', sizeUm: 250, umPerUnit: 100, U: 10, dist: 21,
  cls: 'Eukaryota · Fungi · Mucoromycota · Mucoromycetes', habitat: 'Bread, ripe fruit and other starchy, sugary food; soil and decaying plant matter', move: 'Non-motile; hyphae grow outward and runners (stolons) spread across the surface', feed: 'Absorbs nutrients: secretes digestive enzymes into the food and absorbs the products', repro: 'Asexual spores from sporangia; sexual reproduction by mating of two compatible strains that fuse to make a thick-walled zygospore',
  desc: 'The black bread mould. A horizontal stolon arches between nodes, with branching rhizoids below and tall stalks above that each carry a black sporangium full of spores.',
  fun: ['It grows fast: a plate of food can be covered within a few days at room temperature.', 'Its hyphae have no cross walls, so each is one long cell with many nuclei.', 'It is the best-known member of the Mucorales, a group that includes some opportunistic pathogens of people with weakened immunity.', 'Related Rhizopus species are used to make tempeh in Indonesia.'],
  note: 'Widths and sporangium size follow real values, but the stalks are drawn much shorter than the several millimetres they can reach. The number of spores is far smaller than a real sporangium holds. Wall colours are artistic.' });
