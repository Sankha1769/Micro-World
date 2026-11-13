/* ================= deformable blob ================= */
class Blob {
  constructor(seg = 96, rings = 64) { this.geo = new THREE.SphereGeometry(1, seg, rings); this.dir = Float32Array.from(this.geo.attributes.position.array); this.n = this.dir.length / 3; }
  update(rfn, sc) {
    const p = this.geo.attributes.position.array, d = this.dir;
    for (let i = 0; i < this.n; i++) { const x = d[i * 3], y = d[i * 3 + 1], z = d[i * 3 + 2], r = rfn(x, y, z); p[i * 3] = x * r * sc.x; p[i * 3 + 1] = y * r * sc.y; p[i * 3 + 2] = z * r * sc.z; }
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  }
}

/* ================= AMOEBA ================= */
function buildAmoeba(S) {
  const R = rng(11), NP = 5;
  const pods = Array.from({ length: NP }, () => ({ d: V(R() * 2 - 1, (R() * 2 - 1) * .7, (R() * 2 - 1) * .25).normalize(), ph: R() * TAU, sp: .16 + R() * .14, len: .6 + R() * .5, tight: 6 + R() * 5 }));
  const podS = new Array(NP).fill(0), body = new Blob(96, 64), sc = V(1.25, 1, .62); let T = 0;
  const rfn = (x, y, z) => { let r = 1 + .09 * fbm(x * 1.5 + T * .13, y * 1.5, z * 1.5 + T * .1); for (let k = 0; k < NP; k++) { const p = pods[k]; r += podS[k] * Math.exp((x * p.d.x + y * p.d.y + z * p.d.z - 1) * p.tight); } return r; };
  const pt = (d, f, out) => out.copy(d).multiplyScalar(rfn(d.x, d.y, d.z) * f).multiply(sc);
  const mem = S.mesh(body.geo, M.shell(0xa7d8cf, .3, { iridescence: .5, iridescenceIOR: 1.35, iridescenceThicknessRange: [200, 500] }), { ro: 8 });
  S.part('Cell membrane and pseudopodia', 'A flexible plasma membrane with no rigid wall. Cytoplasm streams forward into temporary projections called pseudopodia, which the amoeba uses to crawl and to engulf prey.', mem, { shell: true });
  // cytoplasm granules
  const NG = 260, gr = inst(G.sphereLo, M.soft(0xc6e8dc), NG), gd = [], tmp = V();
  for (let i = 0; i < NG; i++) gd.push({ d: randDir(R), f: .1 + .8 * Math.cbrt(R()), s: .016 + R() * .02, ph: R() * TAU });
  S.part('Cytoplasm and granules', 'Granular endoplasm: a gel of proteins, ribosomes and storage granules that flows continuously, pushing the cell forward. A clearer outer layer, the ectoplasm, lies just under the membrane.', gr);
  S.add(gr);
  // nucleus
  const nuc = S.mesh(G.sphere, M.grain(0x8f7fc0, { transparent: true, opacity: .92 }), { s: .34, ro: 3 });
  S.mesh(G.sphere, M.soft(0x3f3470), { s: .35, parent: nuc }).scale.setScalar(.34);
  S.part('Nucleus', 'A single large nucleus holds the DNA. The dense dark body inside is the nucleolus, where ribosomal RNA is made. The nuclear envelope has pores that control traffic of molecules.', nuc);
  // contractile vacuole
  const cv = S.mesh(G.sphere, M.glass(0xbfe8ff, .5), { s: .15, ro: 4 });
  S.part('Contractile vacuole', 'A fluid-filled bladder that slowly fills with excess water from the cytoplasm, then squeezes it out through the membrane. Without it, freshwater amoebae would swell and burst.', cv);
  // food vacuoles
  const fvs = [];
  const fm = M.glass(0xd8f0f5, .4), pm = M.soft(0x3f7a3a);
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group(); S.mesh(G.sphere, fm, { s: .17 + R() * .04, parent: g, ro: 4 });
    const prey = S.mesh(G.capsule, pm, { s: .09, r: [R() * 3, R() * 3, 0], parent: g }); prey.scale.set(.06, .09, .06);
    S.add(g); fvs.push({ g, a: R() * TAU, f: .45 + R() * .25 });
  }
  const fvg = new THREE.Group(); fvs.forEach(f => fvg.add(f.g)); S.group.add(fvg);
  S.part('Food vacuoles', 'When a pseudopodium wraps around prey such as algae or bacteria, the membrane pinches off a vacuole. Digestive enzymes then break the prey down and nutrients diffuse into the cytoplasm.', fvg);
  const cvDir = V(.7, -.5, .1).normalize(), nd = V(-.2, .1, 0).normalize();
  S.anim((t) => {
    T = t * .8;
    for (let k = 0; k < NP; k++) podS[k] = pods[k].len * Math.pow(Math.max(0, Math.sin(T * pods[k].sp * 3 + pods[k].ph)), 1.4);
    body.update(rfn, sc);
    for (let i = 0; i < NG; i++) { const g = gd[i]; pt(g.d, g.f * (1 + .04 * Math.sin(T + g.ph)), tmp); setI(gr, i, tmp, null, g.s); }
    gr.instanceMatrix.needsUpdate = true;
    pt(nd, .15, nuc.position);
    const ph = (t / 7) % 1, s = ph < .85 ? ph / .85 : 1 - (ph - .85) / .15; cv.scale.setScalar(.07 + .13 * s); pt(cvDir, .72, cv.position);
    fvs.forEach((f, i) => { const a = f.a + T * .06, d = V(Math.cos(a), Math.sin(a) * .8, Math.sin(a * 1.7) * .3).normalize(); pt(d, f.f, f.g.position); });
  });
}

/* ================= PARAMECIUM ================= */
function buildParamecium(S) {
  const L = 3.6, FZ = .82, rad = u => .74 * Math.pow(u, .8) * Math.pow(1 - u, .5) / .42, X = u => (.5 - u) * L;
  const sp = (u, th, f = 1, o = V()) => { const r = rad(u) * f; return o.set(X(u), r * Math.cos(th), r * Math.sin(th) * FZ); };
  const prof = []; for (let i = 80; i >= 0; i--) { const u = i / 80; prof.push(V2(Math.max(rad(u), .0005), (.5 - u) * L)); }
  const mem = S.mesh(new THREE.LatheGeometry(prof, 96), M.shell(0xa9d6c6, .26, { iridescence: .45, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 420] }), { r: [0, 0, -Math.PI / 2], s: V(1, 1, FZ), ro: 8 });
  S.part('Pellicle and membrane', 'A firm but flexible outer layer (the pellicle) gives Paramecium its constant slipper shape. Beneath it lie thousands of basal bodies that anchor the cilia, and trichocysts that can be fired as defence.', mem, { shell: true });
  // cilia
  const rows = 40, base = [], nrm = [];
  for (let i = 1; i < rows; i++) {
    const u = .015 + .97 * i / rows, nc = Math.max(5, Math.round(rad(u) * TAU / .1)), du = .004, s = -(rad(u + du) - rad(u - du)) / (2 * du) / L * -1;
    for (let j = 0; j < nc; j++) { const th = (j + (i % 2) * .5) / nc * TAU; base.push(sp(u, th)); nrm.push(V(s, Math.cos(th), Math.sin(th) / FZ).normalize()); }
  }
  const NC = base.length, cg = new THREE.CylinderGeometry(.004, .011, .3, 5); cg.translate(0, .15, 0);
  const cil = inst(cg, M.soft(0xd5ece4, { transparent: true, opacity: .6, roughness: .4 }), NC);
  S.add(cil); S.part('Cilia', 'Roughly 5,000 cilia cover the cell and beat in coordinated waves (metachronal rhythm). Each one has a power stroke and a recovery stroke, driving the cell forward and sweeping food towards the mouth.', cil);
  const q = new THREE.Quaternion(), dir = V(), tp = V(), up = V(0, 1, 0), pp = V(), nx = V(-1, 0, 0);
  // oral groove
  const mg = M.soft(0x5e9c97, { roughness: .6 });
  const gpts = [[.12, 2.7], [.2, 2.4], [.3, 2.05], [.4, 1.7], [.5, 1.57]].map(([u, th]) => sp(u, th, .97));
  const groove = tubePts(new THREE.CatmullRomCurve3(gpts).getPoints(24), 10, t => .02 + .09 * Math.sin(Math.PI * Math.min(1, t * 1.1)) ** .6 + .02, mg); S.add(groove);
  const mouth = sp(.5, 1.57, .97), inner = sp(.6, 1.2, .5);
  const cph = tubePts(new THREE.CatmullRomCurve3([mouth, sp(.52, 1.4, .7), inner]).getPoints(16), 10, t => .09 * (1 - t * .55), M.soft(0x4d8a86, { roughness: .6 })); S.add(cph);
  const og = new THREE.Group(); og.add(groove, cph); S.part('Oral groove and cytopharynx', 'A shallow groove lined with extra-long cilia funnels bacteria and yeast into the cell mouth (cytostome). The cytopharynx is a short tube that delivers each mouthful into a newly forming food vacuole.', og);
  // nuclei
  const mac = S.mesh(G.sphere, M.grain(0x9d7fc9), { p: V(.1, .02, 0), s: V(.52, .21, .2), ro: 3 });
  S.part('Macronucleus', 'The large, kidney-shaped macronucleus runs everyday gene expression. It holds many copies of the genome and is rebuilt from the micronucleus after sexual reproduction (conjugation).', mac);
  const mic = S.mesh(G.sphere, M.soft(0x5a46a0), { p: V(.12, .24, .05), s: .075, ro: 3 });
  S.part('Micronucleus', 'A small diploid nucleus that stays quiet during daily life. It carries the germline genome and divides by meiosis when two Paramecium exchange genetic material.', mic);
  // contractile vacuoles
  const cvs = [1.15, -1.1].map((x, k) => {
    const g = new THREE.Group(); g.position.set(x, -.12, 0);
    const c = S.mesh(G.sphere, M.glass(0xbfe8ff, .5), { parent: g, ro: 4 }), cm = M.soft(0x9bd0d8, { transparent: true, opacity: .8 }), canals = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + k, m = new THREE.Mesh(G.capsule, cm); m.position.set(Math.cos(a * 1) * .05, Math.cos(a) * .17, Math.sin(a) * .13); m.rotation.set(Math.sin(a) * 1.2, 0, Math.cos(a) * 1.2 - 0); m.scale.set(.025, .12, .025); g.add(m); canals.push(m); }
    S.add(g); return { g, c, canals };
  });
  const cvg = new THREE.Group(); cvs.forEach(c => cvg.add(c.g)); S.group.add(cvg);
  S.part('Contractile vacuoles', 'Two star-shaped vacuoles, one at each end, collect water through radiating canals and expel it every few seconds. They alternate in rhythm and keep the cell from bursting in fresh water.', cvg);
  // food vacuoles
  const R = rng(4), fvs = Array.from({ length: 6 }, (_, i) => {
    const g = new THREE.Group(); S.mesh(G.sphere, M.glass(0xe0f4f2, .4), { parent: g, s: .13 + R() * .05, ro: 4 }); S.mesh(G.sphere, M.soft(0x6b8f3b), { parent: g, s: .05 });
    return { g, a: i / 6 * TAU };
  });
  const fvg = new THREE.Group(); fvs.forEach(f => fvg.add(f.g)); S.add(fvg);
  S.part('Food vacuoles', 'Each vacuole holds ingested bacteria or yeast. The vacuoles circulate through the cell in a fixed loop (cyclosis) as they acidify, digest, and finally release waste at the cytoproct near the rear.', fvg);
  S.anim((t) => {
    for (let i = 0; i < NC; i++) {
      const n = nrm[i], b = base[i], ph = 7 * t - b.x * 5 + Math.atan2(b.z, b.y) * 1.2, a = .55 + .5 * Math.sin(ph);
      tp.copy(nx).addScaledVector(n, n.x); tp.normalize();
      dir.copy(n).multiplyScalar(Math.cos(a)).addScaledVector(tp, Math.sin(a)); q.setFromUnitVectors(up, dir.normalize());
      setI(cil, i, b, q, 1);
    }
    cil.instanceMatrix.needsUpdate = true;
    cvs.forEach((c, k) => { const ph = ((t / 5) + k * .5) % 1, s = ph < .85 ? ph / .85 : 1 - (ph - .85) / .15; c.c.scale.setScalar(.05 + .1 * s); c.canals.forEach(m => m.visible = s < .6 || ph < .85); });
    fvs.forEach(f => { const a = f.a + t * .07; f.g.position.set(.1 + .8 * Math.cos(a), -.16 + .26 * Math.sin(a), .18 * Math.sin(a * 2)); });
  });
}

/* ================= EUGLENA ================= */
function buildEuglena(S) {
  const NU = 72, NT = 40, L = 3.4, R = rng(8), rad = u => .46 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(u, 0, 1), .62)), .75);
  const pos = new Float32Array((NU + 1) * NT * 3), idx = [], uv = new Float32Array((NU + 1) * NT * 2);
  for (let i = 0; i <= NU; i++) for (let j = 0; j < NT; j++) { uv[(i * NT + j) * 2] = j / NT; uv[(i * NT + j) * 2 + 1] = i / NU; }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NT; j++) { const a = i * NT + j, b = i * NT + (j + 1) % NT, c = (i + 1) * NT + j, d = (i + 1) * NT + (j + 1) % NT; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  let lsc = 1, wsc = 1, T = 0;
  const bend = u => .13 * Math.sin(TAU * .8 * u - T * 2) * (.3 + u);
  const P = (u, th, f = 1, o = V()) => { const r = rad(u) * f * wsc * (f === 1 ? 1 + .035 * Math.sin(14 * th + u * 16) : 1); return o.set((.5 - u) * L * lsc, r * Math.cos(th) + bend(u), r * Math.sin(th) * .88); };
  const upd = () => { for (let i = 0; i <= NU; i++) for (let j = 0; j < NT; j++) { const p = P(i / NU, j / NT * TAU), k = (i * NT + j) * 3; pos[k] = p.x; pos[k + 1] = p.y; pos[k + 2] = p.z; } geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); };
  const body = S.mesh(geo, M.shell(0x7fcf6a, .34, { iridescence: .3, iridescenceIOR: 1.3 }), { ro: 8 });
  S.part('Pellicle', 'A flexible protein layer arranged in spiral strips under the membrane. Because it is not rigid, Euglena can squeeze and stretch its body in a motion called euglenoid movement.', body, { shell: true });
  const nuc = S.mesh(G.sphere, M.grain(0x8c7cc2), { s: .3, ro: 3 }); S.mesh(G.sphere, M.soft(0x3c3270), { parent: nuc, s: .35 });
  S.part('Nucleus', 'A large nucleus sits in the rear half. The prominent nucleolus produces ribosomal RNA, and the chromosomes stay visibly condensed even between divisions, an unusual feature of euglenoids.', nuc);
  const NCH = 20, chm = M.soft(0x3f9d38, { roughness: .45, emissive: 0x0b2a08, emissiveIntensity: .5 }), chs = inst(G.sphereMid, chm, NCH), chd = [];
  for (let i = 0; i < NCH; i++) chd.push({ u: .2 + R() * .65, th: R() * TAU, f: .55 + R() * .25 });
  S.add(chs); S.part('Chloroplasts', 'Disc-shaped chloroplasts contain chlorophyll a and b and carry out photosynthesis. Euglena can also absorb nutrients from its surroundings, so it feeds in both plant-like and animal-like ways.', chs);
  const eye = new THREE.Group(); for (let i = 0; i < 14; i++) S.mesh(G.sphereLo, M.emit(0xff6a2b, .7), { parent: eye, p: V((R() - .5) * .1, (R() - .5) * .1, (R() - .5) * .1), s: .03 + R() * .015 }); S.add(eye);
  const pfb = S.mesh(G.sphere, M.soft(0xdfe8ff), { s: .06 });
  S.part('Eyespot (stigma)', 'A cluster of orange-red pigment granules that shades a light-sensitive swelling at the base of the flagellum. As the cell turns, the shadow tells it which way the light comes from, guiding it towards bright water.', [eye, pfb]);
  const res = S.mesh(G.sphere, M.glass(0xdff3ff, .4), { s: .23, ro: 4 }), cvac = S.mesh(G.sphere, M.glass(0xbfe8ff, .5), { s: .1, ro: 4 });
  S.part('Reservoir and contractile vacuole', 'The reservoir is a pocket at the front end that the flagellum grows from. The contractile vacuole empties into it, pumping excess water out of the cell.', [res, cvac]);
  const NP = 12, para = inst(G.capsule, M.soft(0xf2f4e6), NP), pd = [];
  for (let i = 0; i < NP; i++) pd.push({ u: .3 + R() * .5, th: R() * TAU, f: .3 + R() * .25, r: R() * 3 });
  S.add(para); S.part('Paramylon granules', 'Euglena stores energy as paramylon, a starch-like carbohydrate unique to euglenoids. The white rods build up when light is plentiful and are used up in darkness.', para);
  const fl = new Flag(M.soft(0xd9f5c8, { roughness: .5 }), { n: 44, rad: 6, r0: .03, r1: .012 }); S.add(fl.mesh);
  S.part('Flagellum', 'A single long flagellum beats in a spiral wave, pulling the cell forward like a propeller. A second, short flagellum stays inside the reservoir.', fl.mesh);
  const o = V(), d = V(1, 0, 0), sd = V(0, 1, 0), q = new THREE.Quaternion(), tmp = V();
  S.anim((t) => {
    T = t; lsc = 1 + .07 * Math.sin(t * .9); wsc = 1 / Math.sqrt(lsc); upd();
    P(0, 0, 0, nuc.position); nuc.position.copy(P(.62, 0, 0, tmp));
    chd.forEach((c, i) => { P(c.u, c.th, c.f, tmp); const rd = V(0, Math.cos(c.th), Math.sin(c.th)); q.setFromUnitVectors(V(0, 0, 1), rd); setI(chs, i, tmp, q, V(.3, .2, .07)); }); chs.instanceMatrix.needsUpdate = true;
    pd.forEach((c, i) => { P(c.u, c.th, c.f, tmp); q.setFromEuler(new THREE.Euler(c.r, 1.2, c.r * .5)); setI(para, i, tmp, q, V(.05, .07, .05)); }); para.instanceMatrix.needsUpdate = true;
    P(.06, 0, 0, res.position); res.position.x -= .05; P(.12, 2.4, .6, eye.position); eye.position.set(eye.position.x, eye.position.y + .08, .12); pfb.position.set(eye.position.x + .1, eye.position.y - .12, .1);
    cvac.position.set(res.position.x - .1, res.position.y - .18, .02); cvac.scale.setScalar(.06 + .06 * (((t / 5) % 1) < .85 ? ((t / 5) % 1) / .85 : 0));
    P(0, 0, 1, o); fl.wave(o, d, sd, 2.7, .3, 1.15, 8, t);
  });
}

/* ================= GIARDIA ================= */
function buildGiardia(S) {
  const g0 = new THREE.SphereGeometry(1, 64, 48), p = g0.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const h = (y + 1) / 2, w = .5 + .5 * Math.pow(h, .7);
    p.setXYZ(i, x * w * .95, y * 1.4, z > 0 ? z * .3 : z * .52);
  }
  g0.computeVertexNormals();
  const body = S.mesh(g0, M.shell(0xa9d5cf, .36, { iridescence: .4, iridescenceIOR: 1.3 }), { ro: 8 });
  S.part('Cell body', 'A pear-shaped trophozoite about 12 to 15 micrometres long. Its dorsal side is curved and its ventral side is flat, which lets it press against the lining of the small intestine.', body, { shell: true });
  // sucking disc
  const dg = new THREE.CircleGeometry(.62, 48), dp = dg.attributes.position;
  for (let i = 0; i < dp.count; i++) { const r = Math.hypot(dp.getX(i), dp.getY(i)) / .62; dp.setZ(i, -.1 * (1 - r * r)); } dg.computeVertexNormals();
  const disc = new THREE.Group(); disc.position.set(0, .3, .3);
  S.mesh(dg, M.soft(0x6ea5b5, { side: THREE.DoubleSide, transparent: true, opacity: .75 }), { parent: disc });
  S.mesh(new THREE.TorusGeometry(.62, .05, 10, 48), M.soft(0x86bfc9), { parent: disc, s: V(1, 1, 1) });
  S.mesh(new THREE.TorusGeometry(.35, .02, 8, 36), M.soft(0x86bfc9), { parent: disc, p: V(0, 0, -.06) });
  S.add(disc); S.part('Ventral sucking disc', 'A concave disc built from microtubules and ribbon-like proteins. It works like a suction cup, holding the parasite on to intestinal cells so the gut flow cannot wash it away.', disc);
  const nm = M.grain(0x8f7fc0), nu = [-1, 1].map(s => { const n = S.mesh(G.sphere, nm, { p: V(s * .26, .6, .04), s: V(.2, .3, .15), ro: 3 }); S.mesh(G.sphere, M.soft(0x3c3270), { parent: n, s: .35 }); return n; });
  const nug = new THREE.Group(); nu.forEach(n => nug.add(n)); S.group.add(nug);
  S.part('Two nuclei', 'Giardia has two identical nuclei, which together with the disc look like a face under the microscope. Each one carries a full copy of the genome and both are active.', nug);
  const mb = M.soft(0x4a5f7a), med = [-1, 1].map(s => S.mesh(G.capsule, mb, { p: V(0, -.22, -.04), r: [0, 0, s * .6], s: V(.05, .22, .05) }));
  const medg = new THREE.Group(); med.forEach(m => medg.add(m)); S.group.add(medg);
  S.part('Median bodies', 'Dark, curved bundles of microtubules behind the disc. Their exact job is still debated, but they probably help build and repair the disc during division.', medg);
  const am = M.soft(0xe8f3f7), ax = new THREE.Group();
  [-1, 1].forEach(s => { ax.add(line(V(s * .04, .45, 0), V(-s * .06, -1.3, 0), .016, am)); });
  S.add(ax); S.part('Axonemes', 'Microtubule cores of the flagella that run through the cell. Each pair of flagella grows from basal bodies near the nuclei and its axoneme is anchored along the cell midline.', ax);
  const fm = M.soft(0xd5f0ee), cfg = [
    [V(.1, .5, .1), V(.4, .8, .2), 1.1, 0], [V(-.1, .5, .1), V(-.4, .8, .2), 1.1, 1],
    [V(.45, -.4, 0), V(.9, -.4, -.3), 1.3, 2], [V(-.45, -.4, 0), V(-.9, -.4, -.3), 1.3, 3],
    [V(.1, -.55, .1), V(.2, -.8, .5), 1.0, 4], [V(-.1, -.55, .1), V(-.2, -.8, .5), 1.0, 5],
    [V(.04, -1.35, 0), V(.25, -1, -.2), 1.2, 6], [V(-.04, -1.35, 0), V(-.25, -1, -.2), 1.2, 7]];
  const fls = cfg.map(c => { const f = new Flag(fm, { n: 30, rad: 5, r0: .028, r1: .012 }); S.add(f.mesh); return f; });
  const fg = new THREE.Group(); fls.forEach(f => fg.add(f.mesh)); S.group.add(fg);
  S.part('Eight flagella', 'Four pairs of flagella (anterior, posterior-lateral, ventral and caudal) beat in different patterns. Together they make the tumbling, falling-leaf swimming that Giardia is known for.', fg);
  S.anim((t) => {
    cfg.forEach((c, i) => { const d = c[1].clone().normalize(), s = perpBasis(d); fls[i].wave(c[0], d, s, c[2], .22, 1.4, 10, t + i * .7); });
    S.group.rotation.z = Math.sin(t * .8) * .06; S.group.rotation.y = Math.sin(t * .5) * .12;
  });
}

/* ================= ROTIFER ================= */
function buildRotifer(S) {
  const pts = [[0, -2.3], [.1, -2.25], [.2, -1.95], [.19, -1.55], [.3, -1.2], [.55, -.9], [.7, -.3], [.66, .4], [.45, .95], [.4, 1.25], [.52, 1.45], [.5, 1.72], [.3, 1.86], [0, 1.9]].map(([r, y]) => V2(r, y));
  const cp = new THREE.SplineCurve(pts).getPoints(140).map(q => V2(Math.max(q.x, 0), q.y)), lg = new THREE.LatheGeometry(cp, 56), pp = lg.attributes.position;
  for (let i = 0; i < pp.count; i++) { const y = pp.getY(i), f = 1 + .025 * Math.sin(y * 12) * sstep(-1.4, -.6, y) * (1 - sstep(.8, 1.2, y)); pp.setX(i, pp.getX(i) * f); pp.setZ(i, pp.getZ(i) * f); }
  lg.computeVertexNormals();
  const body = S.mesh(lg, M.shell(0xd9d2b8, .22, { iridescence: .3 }), { ro: 8 });
  S.part('Cuticle and body wall', 'A thin, flexible cuticle covers the body. Rotifers are built like a telescope: the head, trunk and foot can slide in and out of one another, giving the animal its inching, stretching movement.', body, { shell: true });
  // corona
  const rings = [[1.74, .46], [1.46, .54]], cg = new THREE.CylinderGeometry(.004, .011, .26, 5); cg.translate(0, .13, 0);
  const NCR = 70, cil = inst(cg, M.soft(0xe4efe8, { transparent: true, opacity: .65 }), NCR * 2), cm = M.soft(0xc7b88a, { transparent: true, opacity: .85 });
  const cor = new THREE.Group(); rings.forEach(([y, r]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .055, 10, 48), cm); t.rotation.x = Math.PI / 2; t.position.y = y; cor.add(t); }); cor.add(cil); S.add(cor);
  S.part('Corona (wheel organ)', 'Two rings of cilia at the head beat in sequence, which looks like a pair of spinning wheels. They sweep algae into the mouth and also pull the animal through the water.', cor);
  // mastax
  const mastax = new THREE.Group(); mastax.position.y = .55;
  S.mesh(G.sphere, M.glass(0xe7c98f, .35), { parent: mastax, s: V(.36, .34, .32), ro: 4 });
  const jm = M.soft(0x6a4a24, { roughness: .35 }), jaws = [-1, 1].map(s => { const j = new THREE.Group(); j.position.set(s * .1, 0, 0); for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(.035, .16, 6), jm); c.position.set(0, .1 - k * .08, 0); c.rotation.z = -s * 1.45; j.add(c); } const b = new THREE.Mesh(G.capsule, jm); b.scale.set(.05, .26, .05); b.position.x = s * .08; j.add(b); mastax.add(j); return j; });
  S.add(mastax); S.part('Mastax and trophi', 'A muscular throat holding a set of hard, jaw-like pieces called trophi. They grind food by opening and closing many times a second. Their shape is used by biologists to tell rotifer species apart.', mastax);
  const brain = S.mesh(G.sphere, M.soft(0xe9d9b8, { transparent: true, opacity: .85 }), { p: V(0, 1.2, -.05), s: V(.2, .12, .14) });
  const eyes = [-1, 1].map(s => S.mesh(G.sphere, M.emit(0xd62828, .7), { p: V(s * .14, 1.22, .2), s: .045 }));
  const eg = new THREE.Group(); eg.add(brain); eyes.forEach(e => eg.add(e)); S.group.add(eg);
  S.part('Brain and eyespots', 'A small cerebral ganglion sits above the mastax. Two red eyespots detect light and dark but do not form images, which helps the rotifer find light and avoid dim, unsafe water.', eg);
  const st = new THREE.Group(); st.position.y = -.35; S.mesh(G.sphere, M.glass(0x9fd88a, .32), { parent: st, s: V(.34, .5, .32), ro: 4 });
  const R = rng(6), gm = M.soft(0x58a64a), gi = inst(G.sphereLo, gm, 40); for (let i = 0; i < 40; i++) setI(gi, i, randInBall(R).multiply(V(.26, .4, .24)), null, .03 + R() * .02); st.add(gi); S.add(st);
  S.part('Stomach', 'Algae and bacteria collect here. The green colour comes from the plant material the rotifer has just eaten. Cells lining the stomach secrete enzymes and absorb the nutrients.', st);
  const bl = S.mesh(G.sphere, M.glass(0xbfe8ff, .45), { p: V(0, -1.1, .15), s: .1, ro: 4 });
  S.part('Contractile bladder', 'A small bladder that collects water and waste from excretory tubes (protonephridia) and releases it every minute or so. It keeps the body fluid in balance.', bl);
  const egg = S.mesh(G.sphere, M.glass(0xf3e1b5, .4), { p: V(.22, -.8, .12), s: V(.17, .22, .15), ro: 4 }); S.mesh(G.sphere, M.soft(0xe7cf9e), { parent: egg, s: .5 });
  S.part('Ovary and egg', 'Most rotifers are female and lay eggs that develop without fertilisation (parthenogenesis). A growing egg is visible next to the stomach.', egg);
  const toes = [-1, 1].map(s => S.mesh(new THREE.ConeGeometry(.07, .35, 8), M.soft(0xcdbf99), { p: V(s * .09, -2.4, 0), r: [0, 0, s * .15] }));
  const foot = new THREE.Group(); toes.forEach(t => foot.add(t)); S.group.add(foot);
  S.part('Foot and toes', 'The foot ends in two toes with glands that release a sticky secretion. The rotifer anchors itself with them while the corona feeds, and detaches to swim off.', foot);
  const q = new THREE.Quaternion(), dir = V(), up = V(0, 1, 0);
  S.anim((t) => {
    for (let r = 0; r < 2; r++) for (let i = 0; i < NCR; i++) {
      const th = i / NCR * TAU, [y, rr] = rings[r], n = V(Math.cos(th), 0, Math.sin(th)), a = .5 + .5 * Math.sin(8 * t - th * 3 * (r ? 1 : -1)), ph = .5 + .45 * a;
      dir.set(Math.cos(th) * (1 - a * .4), .5 + a * .35, Math.sin(th) * (1 - a * .4)).normalize().add(V(-Math.sin(th), 0, Math.cos(th)).multiplyScalar(.5 * Math.sin(8 * t - th * 3))).normalize();
      q.setFromUnitVectors(up, dir); setI(cil, r * NCR + i, V(n.x * rr, y + .02, n.z * rr), q, 1);
    }
    cil.instanceMatrix.needsUpdate = true;
    const o = .55 + .45 * Math.sin(t * 5); jaws[0].rotation.z = -.35 * o; jaws[1].rotation.z = .35 * o;
    S.group.scale.set(1, 1 + .025 * Math.sin(t * .8), 1); S.group.rotation.z = .1 * Math.sin(t * .4);
  });
}
