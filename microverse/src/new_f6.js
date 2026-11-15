/* ================= NEW (worker F6): Fungal spores, Hypotrich ciliate, Marine plankton ================= */
const f6Prof = tbl => u => { for (let i = 1; i < tbl.length; i++) if (u <= tbl[i][0]) { const a = tbl[i - 1], b = tbl[i]; return lerp(a[1], b[1], sstep(a[0], b[0], u)); } return tbl[tbl.length - 1][1]; };
const f6Cone = (() => { const g = new THREE.CylinderGeometry(.18, 1, 1, 7, 1); g.translate(0, .5, 0); return g; })();
/* slow tumbling drift of a group about a base position */
function f6Tumble(S, g, base, o) {
  S.anim(t => {
    g.position.set(base.x + Math.sin(t * o.fx + o.p) * o.a, base.y + Math.sin(t * o.fy + o.p * 1.7) * o.a, base.z + Math.sin(t * o.fz + o.p * .6) * o.a * .7);
    g.rotation.set(o.r0[0] + t * o.w[0], o.r0[1] + t * o.w[1], o.r0[2] + t * o.w[2]);
  });
}

/* ---------- Fungal spores ---------- */
function f6Alternaria(S, parent) {
  const L = 2.9, sep = [.13, .26, .39, .52, .62], rowsE = [0, ...sep];
  const base = f6Prof([[0, .04], [.015, .2], [.08, .44], [.22, .58], [.45, .6], [.62, .46], [.7, .26], [.78, .15], [1, .06]]);
  const rf = u => { let k = 1; sep.forEach(s => { k -= .08 * Math.exp(-Math.pow((u - s) / .014, 2)); }); return base(u) * k; };
  const lon = [[.05, .55], [.05, .55, .3, .8], [.05, .55, .3, .8], [.3, .8], [.05, .55]];
  const draw = col => (g, w, h) => {
    g.fillStyle = col ? '#5e3716' : '#808080'; g.fillRect(0, 0, w, h); const R = rng(4), ys = u => (1 - u) * h;
    if (col) for (let i = 0; i < rowsE.length; i++) { const a = ys(rowsE[i]), b = ys(i + 1 < rowsE.length ? rowsE[i + 1] : 1), gr = g.createLinearGradient(0, a, 0, b); gr.addColorStop(0, 'rgba(60,32,12,.35)'); gr.addColorStop(.5, 'rgba(170,115,55,.25)'); gr.addColorStop(1, 'rgba(60,32,12,.35)'); g.fillStyle = gr; g.fillRect(0, Math.min(a, b), w, Math.abs(a - b)); }
    for (let i = 0; i < 1800; i++) { g.fillStyle = col ? (R() > .5 ? 'rgba(50,28,10,.28)' : 'rgba(205,155,90,.24)') : (R() > .5 ? '#a6a6a6' : '#606060'); g.beginPath(); g.arc(R() * w, R() * h, 1 + R() * 2.2, 0, TAU); g.fill(); }
    g.strokeStyle = col ? '#2a170a' : '#000'; g.lineWidth = 6; sep.forEach(s => { g.beginPath(); g.moveTo(0, ys(s)); g.lineTo(w, ys(s)); g.stroke(); });
    g.lineWidth = 4; lon.forEach((xs, i) => xs.forEach(x => { g.beginPath(); g.moveTo(x * w, ys(rowsE[i] + .006)); g.lineTo(x * w, ys(i + 1 < rowsE.length ? rowsE[i + 1] - .006 : .62)); g.stroke(); }));
  };
  const mat = M.soft(0xffffff, { map: canvasTex(256, 512, draw(true)), bumpMap: canvasTex(256, 512, draw(false), false), bumpScale: 2.2, roughness: .7, sheen: 0, clearcoat: .1 });
  const g = new THREE.Group(); parent.add(g);
  const body = S.mesh(latheBody(L, rf, 130, 40), mat, { parent: g });
  /* germ tube from a lower cell */
  const gtM = M.soft(0xe3d3a2, { transparent: true, opacity: .9, roughness: .45 }), gt = new Tube(24, 8, gtM); g.add(gt.mesh);
  const u0 = .2, o0 = V(rf(u0) * .94, (u0 - .5) * L, .12), pts = Array.from({ length: 25 }, () => V());
  const upd = t => {
    const gr = .06 + .94 * (.5 - .5 * Math.cos(t * .11)), Lg = 1.7 * gr;
    for (let i = 0; i <= 24; i++) { const s = i / 24 * Lg; pts[i].set(o0.x + s * .85 + .12 * Math.sin(s * 2.2), o0.y - s * .42 - .1 * s * s, o0.z + .1 * Math.sin(s * 3 + 1) * s); }
    gt.update(pts, s => .1 * (1 - .35 * s) + .02);
  };
  upd(0); S.anim(upd);
  S.part('Alternaria conidium', 'A muriform spore: a club-shaped body divided by several cross walls and a few lengthwise walls, so it looks like a tiny brick wall, with a tapering beak at one end. Dark melanin in the wall protects it from sunlight, and spores of this type are among the commonest airborne mould allergens.', body);
  S.part('Germ tube', 'When a spore lands on a damp surface it swells and pushes out a thin tube from one of its cells. The tube grows into the first hypha, from which the whole fungal colony develops. It is shown slowly growing and then retracting in a loop.', gt.mesh);
  return g;
}
function f6Conidia(S, parent) {
  const g = new THREE.Group(), NC = 5, r = .3, R = rng(17); parent.add(g);
  const pos = []; for (let i = 0; i < NC; i++) pos.push(V(.22 * Math.sin(i * .8), i * .64, .12 * Math.cos(i * 1.1)));
  const sph = inst(G.sphereMid, M.grain(0x839a45, { bumpScale: 1 }), NC), spk = inst(f6Cone, M.soft(0x566d2a, { roughness: .5 }), NC * 38), dirs = fib(38);
  pos.forEach((p, i) => {
    const rr = r * (i === NC - 1 ? .92 : 1); setI(sph, i, p, null, rr);
    dirs.forEach((d, k) => { const j = 1 + .3 * (R() - .5); setI(spk, i * 38 + k, p.clone().addScaledVector(d, rr * .94), qFromUp(d), V(.05, .13 * j, .05)); });
  });
  g.add(sph, spk);
  const phi = latheBody(1.0, f6Prof([[0, .1], [.2, .13], [.5, .26], [.75, .13], [1, .08]]), 30, 20);
  const ph = S.mesh(phi, M.shell(0xb5a35a, .75, { bumpScale: .3 }), { parent: g, p: V(-.02, -.82, 0), ro: 8 });
  const ves = S.mesh(G.sphere, M.shell(0xb5a35a, .65, { bumpScale: .3 }), { parent: g, p: V(-.02, -1.5, 0), s: V(.28, .3, .28), ro: 8 });
  const stipe = S.mesh(new THREE.CylinderGeometry(.09, .09, 1, 10), M.shell(0xb5a35a, .75), { parent: g, p: V(-.02, -2.0, 0), s: V(1, .8, 1) });
  g.position.y = -1.0;
  S.part('Echinulate conidia', 'Small, nearly round conidia 2 to 4 micrometres across, with a rough, spiny wall that is typical of Aspergillus and Penicillium. They are made in long dry chains and are light enough to drift in air, which is why they are such common indoor mould spores.', [sph, spk]);
  S.part('Phialide and conidiophore', 'The spores bud one after another from the tip of a flask-shaped cell called a phialide. The oldest spore stays at the free end of the chain, and the phialide sits on a stalk, often swollen into a vesicle in Aspergillus.', [ph, ves, stipe], { shell: true });
  return g;
}
function f6Fusarium(S, parent) {
  const g = new THREE.Group(), N = 36, Rc = 3.3, a0 = -.58, a1 = .58; parent.add(g);
  const P = [], T = []; for (let i = 0; i <= N; i++) { const a = lerp(a0, a1, i / N); P.push(V(Rc * Math.sin(a), Rc * Math.cos(a) - Rc + .3, 0)); T.push(V(Math.cos(a), -Math.sin(a), 0)); }
  const rf = s => .32 * Math.pow(Math.sin(Math.PI * (.035 + .93 * s)), .5) * (1 - .6 * sstep(.72, 1, s));
  const shell = tubePts(P, 20, rf, M.shell(0xd8b66a, .55, { bumpScale: .3, roughness: .35 })); shell.renderOrder = 8; g.add(shell);
  const inner = tubePts(P, 14, s => rf(s) * .82, M.soft(0xc98f3c, { transparent: true, opacity: .75, roughness: .5, sheen: 0 })); g.add(inner);
  const sepM = M.soft(0x7a5420, { transparent: true, opacity: .9, sheen: 0 }), sm = [], dr = M.glass(0xf5ecc6, .9, { roughness: .1 }), R = rng(23);
  [.2, .4, .6, .8].forEach(s => { const i = Math.round(s * N); sm.push(S.mesh(G.cyl, sepM, { parent: g, p: P[i], s: V(rf(s) * .84, .04, rf(s) * .84) })); sm[sm.length - 1].quaternion.copy(qFromUp(T[i])); });
  const oil = inst(G.sphereLo, dr, 12); for (let k = 0; k < 12; k++) { const s = .08 + .84 * R(), i = Math.round(s * N), off = V(R() - .5, R() - .5, R() - .5).multiplyScalar(rf(s) * .8); setI(oil, k, P[i].clone().add(off), null, .05 + .04 * R()); } g.add(oil);
  const foot = S.mesh(G.sphere, sepM, { parent: g, p: P[0].clone().addScaledVector(T[0], -.04), s: V(.1, .1, .13) });
  S.part('Fusarium macroconidium', 'A curved, canoe-shaped spore with a pointed tip and a notched foot cell at the other end. It is divided by cross walls into about four or five cells and measures roughly 3 to 5 micrometres across and 25 to 50 micrometres long. Fusarium forms these in sticky masses and some species cause crop diseases.', [shell, inner, oil, foot], { shell: true });
  S.part('Septa', 'Each cross wall divides the spore into separate cells, so the spore can germinate from several cells. The septa show as dark discs through the translucent outer wall.', sm);
  g.position.y = .2; g.rotation.z = 0; return g;
}
function f6Ascus(S, parent) {
  const g = new THREE.Group(); parent.add(g); const L = 3.8;
  const rf = f6Prof([[0, .06], [.07, .1], [.18, .28], [.3, .5], [.7, .56], [.9, .5], [.97, .3], [1, .05]]);
  const wall = S.mesh(latheBody(L, rf, 90, 36), M.shell(0xb9ad6c, .5, { bumpScale: .3 }), { parent: g, ro: 10 });
  const inner = S.mesh(latheBody(L, u => rf(u) * .9, 90, 36), M.shell(0xe9e2b8, .22, { bumpScale: .1 }), { parent: g, ro: 9 });
  const ring = S.mesh(new THREE.TorusGeometry(.2, .05, 8, 20), M.soft(0x8a6a30), { parent: g, p: V(0, L / 2 - .05, 0), r: [Math.PI / 2, 0, 0] });
  const R = rng(31), sp = inst(G.sphereMid, M.soft(0x7a4418, { roughness: .5, sheen: 0 }), 16), sd = inst(G.cyl, M.soft(0x4a2c10), 8);
  for (let k = 0; k < 8; k++) {
    const col = k % 2, row = Math.floor(k / 2), y = -.6 + row * .52 + col * .26 + .22, x = (col ? 1 : -1) * .17, tilt = (R() - .5) * .2;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, tilt)), c = V(x, y, (R() - .5) * .08);
    [-1, 1].forEach((s, j) => setI(sp, k * 2 + j, c.clone().add(V(0, s * .12, 0).applyQuaternion(q)), q, V(.15, .2, .15)));
    setI(sd, k, c, q, V(.12, .02, .12));
  }
  g.add(sp, sd);
  S.part('Ascus', 'A sac-like cell that is the signature of the sac fungi, or Ascomycota. Meiosis and one round of mitosis inside it give exactly eight spores. The wall has a thickened ring at the tip, and when the spores are ripe pressure builds up and they are shot out into the air.', [wall, inner, ring], { shell: true });
  S.part('Ascospores', 'The eight spores are made in the ascus after sexual reproduction. Here each one is two-celled and brown, with a pinched middle where the cross wall lies, which is the form seen in many dark sac fungi.', [sp, sd]);
  return g;
}
function buildSpores(S) {
  const gA = f6Alternaria(S, S.group), gC = f6Conidia(S, S.group), gF = f6Fusarium(S, S.group), gS = f6Ascus(S, S.group);
  const wrap = (g, base, o) => { const w = new THREE.Group(); S.group.add(w); w.add(g); f6Tumble(S, w, base, o); return w; };
  [gA, gC, gF, gS].forEach(g => S.group.remove(g));
  wrap(gA, V(-2.6, 1.0, 0), { a: .25, fx: .21, fy: .17, fz: .13, p: 0, r0: [.2, 0, .5], w: [.02, .1, .03] });
  wrap(gC, V(2.3, 1.7, 0), { a: .25, fx: .18, fy: .2, fz: .15, p: 2, r0: [0, 0, -.35], w: [.03, .09, .02] });
  wrap(gF, V(-.5, -2.5, .3), { a: .25, fx: .16, fy: .19, fz: .12, p: 4, r0: [.1, 0, -.1], w: [.02, .08, .03] });
  wrap(gS, V(3.2, -2.3, 0), { a: .25, fx: .2, fy: .15, fz: .17, p: 1, r0: [0, 0, .25], w: [.03, .07, .02] });
}
NEWBUILD.spores = buildSpores;
NEW_SPEC.push({ id: 'spores', cat: 'other', name: 'Fungal spores', latin: 'Alternaria, Aspergillus, Fusarium and an ascus', size: 'about 3 µm (Aspergillus) to 50 µm (Fusarium) per spore', sizeUm: 50, U: 8.6, dist: 19,
  cls: 'Mixed assemblage · Fungi · Ascomycota', habitat: 'Air, soil, decaying plants, damp buildings and crops; spores are carried far on the wind', move: 'None of their own; spores are carried by air, water or insects, and germ tubes grow once a spore lands', feed: 'Spores are resting stages; after germination the fungi absorb nutrients from dead or living organic matter', repro: 'Asexual conidia (Alternaria, Aspergillus, Fusarium) and sexual ascospores made inside an ascus',
  desc: 'Four kinds of fungal spore drifting together: a brick-like Alternaria conidium, a chain of spiny Aspergillus conidia, a canoe-shaped Fusarium macroconidium and an ascus holding eight ascospores.',
  fun: ['A single Aspergillus colony can release millions of conidia, and each is only a few micrometres wide.', 'Alternaria spores are one of the commonest outdoor allergens in late summer.', 'An ascus can fire its eight spores out by building up internal fluid pressure, sometimes several centimetres into the air.', 'Dark melanin in the wall of Alternaria and similar spores shields them from ultraviolet light.'],
  note: 'Sizes are not to scale with each other: the Aspergillus conidia are drawn much larger relative to the others. The germ tube growth is a repeating loop, real tubes only extend. Septa, spines and colours are simplified. All four spores float in free space for display and do not occur in one such cluster.' });

/* ---------- Hypotrich ciliate (Stylonychia) ---------- */
const f6Q1 = new THREE.Quaternion(), f6M4 = new THREE.Matrix4();
function f6Basis(xv, yv) { const y = yv.clone().normalize(), x = xv.clone().addScaledVector(y, -xv.dot(y)).normalize(), z = new THREE.Vector3().crossVectors(x, y); return f6Q1.setFromRotationMatrix(f6M4.makeBasis(x, y, z)); }
/* brush-like cirri: each cirrus is a bundle of fused cilia drawn as a few tapering strands */
function f6Cirri(S, specs, mat, parent, { ns = 5, w = 7.5, amp = .4, mid = .55, caudal = false } = {}) {
  const n = specs.length, geo = new THREE.CylinderGeometry(.35, 1, 1, 6, 1); geo.translate(0, .5, 0);
  const mesh = inst(geo, mat, n * ns), d = V(), sd = V(), s1 = V(), s2 = V(), sc = V();
  const upd = t => {
    specs.forEach((c, i) => {
      if (caudal) d.set(-1, -.12 + .08 * Math.sin(t * 1.3 + c.ph), c.zs * .32 + .12 * Math.sin(t * 1.7 + c.ph)).normalize();
      else { const f = mid + amp * Math.sin(t * w + c.ph); d.set(-Math.sin(f), -Math.cos(f), c.zs * .3).normalize(); }
      s1.copy(perpBasis(d)); s2.crossVectors(d, s1).normalize();
      for (let k = 0; k < ns; k++) {
        const a = k / ns * TAU, off = s1.clone().multiplyScalar(Math.cos(a)).addScaledVector(s2, Math.sin(a));
        sd.copy(d).addScaledVector(off, k === 0 ? 0 : .2).normalize();
        sc.set(c.r * (k === 0 ? 1.4 : 1), c.len * (k === 0 ? 1 : .86 + .1 * ((k * 7) % 3) / 2), c.r * (k === 0 ? 1.4 : 1));
        setI(mesh, i * ns + k, c.p.clone().addScaledVector(off, k === 0 ? 0 : c.r * 1.2), f6Q1.setFromUnitVectors(UP, sd), sc);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0); S.anim(upd); S.add(mesh, parent); return mesh;
}
function buildCiliate(S) {
  const A = 2.9, B = 1.3, C = .6, R = rng(61), wf = x => 1 - .14 * x;
  const yv = (x, z) => -C * .55 * Math.sqrt(Math.max(0, 1 - (x / A) * (x / A) - Math.pow(z / (B * wf(x / A)), 2)));
  const yd = (x, z) => C * Math.sqrt(Math.max(0, 1 - (x / A) * (x / A) - Math.pow(z / (B * wf(x / A)), 2)));
  const tilt = new THREE.Group(), cell = new THREE.Group(); tilt.rotation.x = -1.15; S.add(tilt); tilt.add(cell);
  const bodyGeo = () => { const g = new THREE.SphereGeometry(1, 72, 48); g.rotateZ(Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, A * x, y < 0 ? C * .55 * y : C * y, B * wf(x) * z); } g.computeVertexNormals(); return g; };
  const stripe = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = '#4a4a4a'; g.fillRect(i / 40 * w, 0, 3, h); g.fillStyle = '#b0b0b0'; g.fillRect(i / 40 * w + 3, 0, 2, h); } }, false);
  const col = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#d9b86c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(120,80,20,.25)'; g.fillRect(i / 40 * w, 0, 2, h); } });
  const pel = S.mesh(bodyGeo(), M.shell(0xffffff, .5, { map: col, bumpMap: stripe, bumpScale: 1.2, clearcoat: .5 }), { parent: cell, ro: 10 });
  const cyt = S.mesh(bodyGeo(), M.shell(0xe6c57e, .34, { bumpScale: .1 }), { parent: cell, s: .94, ro: 9 });
  const gr = inst(G.sphereLo, M.soft(0xf0e1b0, { roughness: .6 }), 170);
  for (let i = 0; i < 170; i++) { const d = randInBall(R); setI(gr, i, V(d.x * A * .85, d.y * C * .5, d.z * B * .75 * wf(d.x * .85)), null, .03 + R() * .03); } cell.add(gr);
  S.part('Pellicle and cytoplasm', 'The flexible outer layer, the pellicle, is supported by rows of tiny pits and microtubules and keeps the body flat on the underside and gently domed on the back. Inside, the granular cytoplasm streams slowly and carries the organelles.', [pel, cyt, gr], { shell: true });
  /* peristome path on the ventral surface */
  const pp = []; for (let i = 0; i <= 14; i++) { const th = lerp(-.3, 1.68, i / 14), f = lerp(.9, .62, sstep(.55, 1, i / 14)), x = A * f * Math.cos(th), z = B * wf(x / A) * f * Math.sin(th); pp.push(V(x, yv(x, z) - .02, z)); }
  const az = new THREE.CatmullRomCurve3(pp), lip = tubeCurve(az, 60, 8, u => .07 + .04 * Math.sin(u * Math.PI), M.shell(0xb68a38, .62, { bumpScale: .2 })); lip.renderOrder = 11; cell.add(lip);
  const cs = az.getPoint(1), cyst = S.mesh(new THREE.ConeGeometry(.2, .5, 14, 1, true), M.shell(0x7a5520, .8), { parent: cell, p: cs.clone().add(V(0, .12, 0)), r: [Math.PI, 0, 0] });
  const NM = 30, memG = new THREE.CylinderGeometry(.5, 1, 1, 4, 1); memG.translate(0, .5, 0);
  const mem = inst(memG, M.soft(0xc99a42, { transparent: true, opacity: .9, roughness: .4 }), NM), mb = [];
  for (let i = 0; i < NM; i++) { const u = i / (NM - 1), p = az.getPointAt(u), T = az.getTangentAt(u), n = V(.3 - p.x, 0, 0 - p.z).normalize(); mb.push({ p, T, n, u }); }
  const md = V(), mq = new THREE.Quaternion(), msc = V(.2, .6, .03);
  const updM = t => { mb.forEach((m, i) => { const al = .5 + .42 * Math.sin(t * 9 - i * .55); md.set(0, -Math.cos(al), 0).addScaledVector(m.n, Math.sin(al)).normalize(); msc.y = .52 + .1 * Math.sin(al * 3 - i); setI(mem, i, m.p, f6Basis(m.T, md), msc); }); mem.instanceMatrix.needsUpdate = true; };
  updM(0); S.anim(updM); cell.add(mem);
  S.part('Adoral zone of membranelles', 'A spiral band of about thirty flattened plates, each made of rows of fused cilia, wraps around the front and down the left side. The plates beat one after another in waves, sweeping bacteria and algae toward the mouth, and the same beat helps pull the cell along.', mem);
  S.part('Peristome and cytostome', 'The peristome is the shallow groove bordered by the membranelles. At its bottom end the cytostome, or cell mouth, opens into the cytoplasm, where food is packed into vacuoles.', [lip, cyst], { shell: true });
  /* cirri */
  const sp = (arr, len, r, ph0, zs0) => arr.map(([x, z], i) => ({ p: V(x, yv(x, z) + .01, z), len, r, ph: ph0 + i * 1.9, zs: zs0 === undefined ? Math.sign(z) : zs0 }));
  const frontal = sp([[2.3, -.6], [2.15, -.2], [1.95, .2]], .62, .045, 0);
  const ventral = sp([[1.25, -.65], [1.1, -.2], [.8, .2], [.4, -.45], [.15, .0], [-.4, -.35], [-.55, .15], [-.95, -.5]], .55, .042, 1.2);
  for (let i = 0; i < 8; i++) { const x = lerp(1.7, -2.0, i / 7); [-1, 1].forEach(s => { const z = s * B * wf(x / A) * Math.sqrt(1 - (x / A) * (x / A)) * .9; ventral.push({ p: V(x, yv(x, z) + .01, z), len: .34, r: .028, ph: i * 1.1 + (s > 0 ? 1.9 : 0), zs: s }); }); }
  const transv = sp([[-1.95, -.55], [-2.05, -.25], [-2.1, .05], [-2.0, .32], [-1.8, .55]], .85, .06, 2.2, 0);
  const caud = [[-2.8, -.35], [-2.9, 0], [-2.8, .35]].map(([x, z], i) => ({ p: V(x, .0, z), len: 1.05, r: .026, ph: i * 2, zs: z === 0 ? 0 : Math.sign(z) }));
  const cm = M.soft(0xa6772c, { roughness: .45 });
  const fv = f6Cirri(S, [...frontal, ...ventral], cm, cell), tr = f6Cirri(S, transv, cm, cell, { w: 6.5, amp: .35, mid: .75 }), cd = f6Cirri(S, caud, M.soft(0x8a6428), cell, { caudal: true });
  S.part('Frontal and ventral cirri', 'Cirri are tufts of cilia glued together into stiff leg-like bundles. The front and belly cirri act as legs, and the smaller rows along each edge help with steering, so the cell scampers over debris instead of just swimming.', fv);
  S.part('Transverse cirri', 'Five stout cirri near the rear stick out beyond the body. They push against the surface and give the cell its quick backward hops and turns when it meets an obstacle.', tr);
  S.part('Caudal cirri', 'Three long, thin cirri trail from the back of the cell. They stay almost stiff and work as sensors and a rudder, and they help the cell keep its heading.', cd);
  /* dorsal bristles */
  const P = [], N = []; [-.72, -.25, .25, .72].forEach(f => { for (let i = 0; i < 12; i++) { const x = lerp(-2.45, 2.35, i / 11) + .1 * f, z = f * B * wf(x / A) * Math.sqrt(Math.max(0, 1 - (x / A) * (x / A))), y = yd(x, z); P.push(V(x, y, z)); N.push(V(x / (A * A), y / (C * C), z / (B * B)).normalize()); } });
  const db = ciliaSet(S, PM.dark(0x6a4c20), P, N, { len: .26, r: .016, amp: .12, speed: 2.2, wave: 2, axis: V(-1, 0, 0), jit: .4, seed: 9, parent: cell });
  S.part('Dorsal bristles', 'Short, stiff sensory bristles stand in rows on the back. They do not beat to move the cell, but they bend when something touches them and tell the cell about its surroundings.', db);
  /* nuclei */
  const mac = [[.9, .0, 0, .8, .4, .42, .15], [-.65, 0, .08, .75, .38, .4, -.12]].map(([x, y, z, a, b, c, r]) => S.mesh(G.sphereMid, M.grain(0x8a6428, { bumpScale: 2.2 }), { parent: cell, p: V(x, y, z), s: V(a, b, c), r: [0, r, 0] }));
  const nl = inst(G.sphereLo, M.soft(0x3e2a0e), 14); for (let i = 0; i < 14; i++) { const m = mac[i % 2], d = randDir(R).multiplyScalar(.7); setI(nl, i, m.position.clone().add(V(d.x * m.scale.x, d.y * m.scale.y, d.z * m.scale.z)), null, .05); } cell.add(nl);
  const mic = [[.6, .05, .5], [-.3, .05, -.38]].map(([x, y, z]) => S.mesh(G.sphereMid, M.soft(0xf1e3ad, { roughness: .3 }), { parent: cell, p: V(x, y, z), s: .12 }));
  S.part('Macronuclei', 'Stylonychia has two large, bean-shaped macronuclei that run the everyday life of the cell. Each contains many copies of short gene-sized DNA pieces, and the dark spots are nucleoli where ribosomes are made.', [...mac, nl]);
  S.part('Micronuclei', 'Close to the macronuclei lie small micronuclei. They keep the germline DNA and divide by mitosis, and they are used in conjugation, when two cells swap genetic material.', mic);
  /* contractile vacuole */
  const cvM = M.shell(0xc7a35a, .5, { bumpScale: .1, clearcoat: 1 }), cv = S.mesh(G.sphereMid, cvM, { parent: cell, p: V(-1.95, .02, -.55), ro: 12 });
  S.anim(t => { const ph = (t % 9) / 9, s = ph < .86 ? .08 + .24 * sstep(0, .86, ph) : .32 * (1 - sstep(.86, .92, ph)) + .04; cv.scale.setScalar(s); });
  S.part('Contractile vacuole', 'A bubble near the rear that slowly fills with water and then bursts through a pore to the outside. This pump removes the water that constantly seeps into the cell, which lives in fresh water.', cv, { shell: true });
  /* food vacuoles, circulating */
  const NV = 7, fvS = inst(G.sphereMid, M.shell(0xc4ae6a, .5, { bumpScale: .1 }), NV), fvC = inst(G.sphereLo, M.soft(0x4f6a2a, { roughness: .6 }), NV * 3), vph = [], vr = [];
  for (let i = 0; i < NV; i++) { vph.push(i / NV * TAU + R() * .5); vr.push(.25 + R() * .08); }
  const vv = V(), cdir = [V(.1, .05, .06), V(-.07, .06, -.05), V(.0, -.05, .08)];
  S.anim(t => { for (let i = 0; i < NV; i++) { const a = vph[i] + t * .06; vv.set(-.2 + 1.85 * Math.cos(a), -.02 + .1 * Math.sin(a * 3), 1.2 * .6 * Math.sin(a) * wf(Math.cos(a) * .6)); setI(fvS, i, vv, null, vr[i]); for (let k = 0; k < 3; k++) setI(fvC, i * 3 + k, vv.clone().add(cdir[k].clone().multiplyScalar(vr[i] * 2.4 * (k + 1) * .4)), null, vr[i] * (.3 - k * .05)); } fvS.instanceMatrix.needsUpdate = fvC.instanceMatrix.needsUpdate = true; });
  fvS.renderOrder = 6; cell.add(fvS, fvC);
  S.part('Food vacuoles', 'Food is packed into membrane bubbles that form at the cytostome, here shown holding green algae. The bubbles are carried round the cell, digested and finally emptied at a pore. Stylonychia eats bacteria, algae and small protists.', [fvS, fvC]);
  S.anim(t => { cell.rotation.y = .55 + .3 * Math.sin(t * .17); cell.position.set(.35 * Math.sin(t * .23), .18 * Math.sin(t * .31 + 1), 0); tilt.rotation.x = -1.15 + .12 * Math.sin(t * .13); });
}
NEWBUILD.ciliate = buildCiliate;
NEW_SPEC.push({ id: 'ciliate', cat: 'other', name: 'Hypotrich ciliate', latin: 'Stylonychia mytilus', size: '100–300 µm', sizeUm: 200, U: 6.4, dist: 14,
  cls: 'Eukaryota · SAR · Ciliophora · Spirotrichea · Hypotrichia', habitat: 'Freshwater ponds, ditches and wet moss, where it crawls over debris and algae', move: 'Walks and darts on cirri over surfaces; rarely swims freely', feed: 'Eats bacteria, algae and small protists swept into the mouth by the adoral membranelles', repro: 'Binary fission; conjugation swaps micronuclear DNA between two cells',
  desc: 'A flat, oval ciliate that uses leg-like cirri to scurry over surfaces. A band of membranelles around the mouth groove sweeps in food, and two nuclei sit in the middle of the body.',
  fun: ['Unlike Paramecium, which is covered in cilia, hypotrichs keep their cilia in tufts called cirri and use them to walk.', 'Stylonychia has two kinds of nuclei, and after conjugation it rebuilds its macronucleus by cutting its DNA into thousands of small gene-sized pieces.', 'It is a classic model for studying how cells rearrange their genomes.', 'Stylonychia can leap backwards in an instant by flicking its transverse cirri.'],
  note: 'It is shown ventral side toward the viewer and tilted. Cirrus counts, vacuole numbers and food contents are simplified, and the stepping movement is schematic. Colours are artistic; living cells are almost transparent.' });
