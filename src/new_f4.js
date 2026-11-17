/* ================= F4: Dinoflagellate, Desmid (Micrasterias), Oscillatoria ================= */
const f4Tmp = V(), f4Tmp2 = V(), f4M1 = new THREE.Matrix4(), f4M2 = new THREE.Matrix4();
const f4Loc = (p, q, s) => new THREE.Matrix4().compose(p, q || new THREE.Quaternion(), typeof s === 'number' ? V(s, s, s) : s);
function f4Seam(geo, nu, np) {
  const n = geo.attributes.normal, w = np + 1;
  for (let i = 0; i <= nu; i++) {
    const a = i * w, b = i * w + np, x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
}
/* grid over (u in [u0,u1], phi in [0,2pi]); fn(u, phi, out) writes a position */
function f4Grid(nu, np, u0, u1, fn) {
  const w = np + 1, pos = new Float32Array((nu + 1) * w * 3), uv = new Float32Array((nu + 1) * w * 2), idx = [], o = V();
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= np; j++) {
    const k = i * w + j, u = lerp(u0, u1, i / nu); fn(u, j / np * TAU, o);
    pos[k * 3] = o.x; pos[k * 3 + 1] = o.y; pos[k * 3 + 2] = o.z; uv[k * 2] = j / np; uv[k * 2 + 1] = i / nu;
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < np; j++) { const a = i * w + j, b = a + 1, c = a + w, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals(); f4Seam(g, nu, np); return g;
}

/* ================= 1. Dinoflagellate (Peridinium-type, armoured) ================= */
const F4L = 5.6, F4R = 1.5, F4FZ = .88;
function f4rf(u) {
  if (u < .5) return F4R * Math.pow(Math.sin(Math.PI / 2 * u / .5), .55);
  const s = (u - .5) / .5;
  return F4R * Math.pow(Math.cos(Math.PI / 2 * s), .9) + .14 * sstep(.5, .92, s) * (1 - sstep(.92, 1, s));
}
function f4r(u, ph) {
  let r = f4rf(u);
  const uc = .5 - .018 * Math.sin(ph), du = (u - uc) / .03;
  r -= .3 * Math.exp(-du * du);
  const d = ph - Math.PI / 2;
  r *= 1 - .34 * Math.exp(-d * d / .04) * sstep(.04, .13, u) * (1 - sstep(.5, .55, u));
  return Math.max(r, .0008);
}
function f4P(u, ph, off, out) { const r = f4r(u, ph) + off; return out.set(r * Math.cos(ph), (u - .5) * F4L, r * Math.sin(ph) * F4FZ); }
function f4N(u, ph, out) { const e = .01, s = (f4r(u + e, ph) - f4r(u - e, ph)) / (2 * e * F4L); return out.set(Math.cos(ph), -s, Math.sin(ph) / F4FZ).normalize(); }
function f4PlateTex(srgb) {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = srgb ? '#e9c987' : '#9c9c9c'; g.fillRect(0, 0, w, h);
    const rows = [[0, .2, 2], [.2, .47, 5], [.47, .53, 0], [.53, .8, 7], [.8, 1, 4]], R = rng(11);
    rows.forEach(([a, b, n], ri) => {
      const y0 = h * (1 - b), y1 = h * (1 - a);
      if (!n) { g.fillStyle = srgb ? '#a07a38' : '#555'; g.fillRect(0, y0, w, y1 - y0); return; }
      const off = (ri % 2) * .5;
      for (let k = 0; k < n; k++) {
        const x0 = (k + off) / n * w, x1 = (k + 1 + off) / n * w;
        for (const dx of [0, -w, w]) {
          const cx = (x0 + x1) / 2 + dx, grd = g.createRadialGradient(cx, (y0 + y1) / 2, 4, cx, (y0 + y1) / 2, (x1 - x0) * .7);
          grd.addColorStop(0, srgb ? '#f3dca4' : '#b4b4b4'); grd.addColorStop(1, srgb ? '#dbb669' : '#888');
          g.fillStyle = grd; g.fillRect(x0 + dx, y0, x1 - x0, y1 - y0);
          g.fillStyle = srgb ? 'rgba(150,100,40,.55)' : 'rgba(230,230,230,.75)';
          for (let yy = y0 + 8; yy < y1 - 4; yy += 11) for (let xx = x0 + 8 + ((Math.round(yy / 11) % 2) * 5); xx < x1 - 4; xx += 11) { g.beginPath(); g.arc(xx + dx, yy, 1.8, 0, TAU); g.fill(); }
          g.fillStyle = srgb ? '#5a3b12' : '#101010';
          for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(cx + (R() - .5) * (x1 - x0) * .5, (y0 + y1) / 2 + (R() - .5) * (y1 - y0) * .5, 3.2, 0, TAU); g.fill(); }
        }
      }
      g.strokeStyle = srgb ? '#5b3c14' : '#161616'; g.lineWidth = 7;
      for (let k = 0; k < n; k++) { const x = (k + off) / n * w; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
    });
    g.strokeStyle = srgb ? '#5b3c14' : '#161616'; g.lineWidth = 8;
    rows.forEach(([a, b]) => { [a, b].forEach(f => { const y = h * (1 - f); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }); });
  }, srgb);
}
function buildDinoflagellate(S) {
  const R = rng(401), tilt = new THREE.Group(); tilt.rotation.z = .22; S.add(tilt);
  const cell = new THREE.Group(); cell.position.y = .9; tilt.add(cell);
  const colT = f4PlateTex(true), bmpT = f4PlateTex(false); colT.repeat.set(1, 1); bmpT.repeat.set(1, 1);
  const thecaM = M.shell(0xffffff, .55, { map: colT, bumpMap: bmpT, bumpScale: 3.5, roughness: .4 });
  const theca = new THREE.Mesh(f4Grid(120, 96, 0, 1, (u, ph, o) => f4P(u, ph, 0, o)), thecaM); theca.renderOrder = 10; cell.add(theca);
  const spineM = M.shell(0xdcb56c, .55, { bumpScale: 1 }), spines = [];
  for (const sx of [-1, 1]) {
    const d = V(sx * .5, -1, 0).normalize(), sp = new THREE.Mesh(G.cone, spineM); sp.position.set(sx * .27, -2.66, 0); sp.scale.set(.2, 1.3, .2); sp.quaternion.copy(qFromUp(d)); sp.renderOrder = 10; cell.add(sp); spines.push(sp);
  }
  const apex = new THREE.Mesh(G.sphere, spineM); apex.scale.set(.15, .15, .15); apex.position.y = F4L / 2 - .02; apex.renderOrder = 10; cell.add(apex); spines.push(apex);
  const cingM = M.soft(0x6c4a20, { roughness: .45 }), sulM = M.soft(0x7a5424, { roughness: .45 });
  const cingBand = new THREE.Mesh(f4Grid(6, 120, -1, 1, (v, ph, o) => f4P(.5 - .018 * Math.sin(ph) + v * .028, ph, .012, o)), cingM); cell.add(cingBand);
  const sulc = new THREE.Mesh(f4Grid(40, 8, 0, 1, (k, ph, o) => { const u = lerp(.1, .5, k), v = ph / TAU * 2 - 1; return f4P(u, Math.PI / 2 + v * .2 * (.6 + .4 * Math.sin(Math.PI * clamp((u - .1) / .4, 0, 1))), .012, o); }), sulM); cell.add(sulc);
  /* flagella */
  const tM = M.soft(0xa8742c, { roughness: .4 }), lM = M.soft(0x8a5c20, { roughness: .4 });
  const NT = 150, tf = new Tube(NT, 6, tM); tf.mesh.renderOrder = 11; cell.add(tf.mesh);
  const tBase = [], tDir = [], tPts = Array.from({ length: NT + 1 }, () => V());
  for (let i = 0; i <= NT; i++) { const ph = i / NT * TAU; tBase.push(f4P(.5 - .018 * Math.sin(ph), ph, -.06, V())); tDir.push(V(Math.cos(ph), 0, Math.sin(ph) / F4FZ).normalize()); }
  const lf = new Flag(lM, { n: 80, rad: 6, r0: .05, r1: .016 }); cell.add(lf.mesh);
  const lo = f4P(.43, Math.PI / 2, -.05, V()), ld = V(.1, -1, .18).normalize(), ls = V(1, 0, 0);
  /* nucleus */
  const nucC = V(.05, -.75, -.1), nuc = new THREE.Group(); nuc.position.copy(nucC); cell.add(nuc);
  const env = new THREE.Mesh(G.sphere, M.shell(0xd8a66a, .4, { bumpScale: .3 })); env.scale.set(.88, .8, .82); env.renderOrder = 7; nuc.add(env);
  const bandT = canvasTex(16, 64, (g, w, h) => { for (let y = 0; y < h; y += 8) { g.fillStyle = (y / 8) % 2 ? '#c06a8a' : '#6e2c4c'; g.fillRect(0, y, w, 8); } }); bandT.repeat.set(1, 4);
  const chrM = M.soft(0x8a3a5c, { map: bandT, roughness: .45 }), chr = new THREE.Group(); nuc.add(chr);
  for (let i = 0; i < 30; i++) {
    const c = randInBall(R).multiplyScalar(.55), d = randDir(R), pts = [];
    for (let k = 0; k < 4; k++) pts.push(c.clone().addScaledVector(d, (k - 1.5) * .17).add(randDir(R).multiplyScalar(.07)));
    chr.add(tubeCurve(new THREE.CatmullRomCurve3(pts), 24, 8, .05, chrM));
  }
  const nucleolus = new THREE.Mesh(G.sphereMid, M.soft(0xa85a30)); nucleolus.scale.setScalar(.16); nucleolus.position.set(.2, .1, .12); nuc.add(nucleolus);
  /* chloroplasts, droplets, trichocysts */
  const cpN = 170, cp = inst(G.sphereLo, M.grain(0xa97a24), cpN), qq = new THREE.Quaternion(), pp = V(), nn = V(); let ci = 0;
  while (ci < cpN) {
    const u = lerp(.07, .93, R()), ph = R() * TAU;
    if (Math.abs(u - .5) < .05 || (u < .52 && Math.abs(ph - Math.PI / 2) < .45)) continue;
    const rr = f4r(u, ph); if (rr < .45) continue;
    f4P(u, ph, -.26 - R() * .1, pp); if (pp.distanceTo(nucC) < 1.05) continue;
    f4N(u, ph, nn); const sc = Math.min(1, rr / 1.1) * (.8 + R() * .4);
    setI(cp, ci++, pp, qFromUp(nn), V(.3 * sc, .07, .22 * sc));
  }
  cell.add(cp);
  const dN = 16, dr = inst(G.sphereMid, M.soft(0xe39a2a, { clearcoat: .8, roughness: .25 }), dN);
  for (let i = 0; i < dN; i++) { const u = lerp(.1, .85, R()), ph = R() * TAU; if (Math.abs(u - .5) < .08) { i--; continue; } f4P(u, ph, -.55 - R() * .15, pp); if (pp.distanceTo(nucC) < 1.1) { i--; continue; } setI(dr, i, pp, null, .09 + R() * .09); }
  cell.add(dr);
  S.part('Thecal plates (armour)', 'Under the outer membrane lie flat vesicles that each hold a plate of cellulose. Together the plates form the armour, called the theca, and their joins (sutures) are the lines you see. The number and layout of the plates is the main way armoured dinoflagellates are told apart.', [theca, ...spines], { shell: true });
  S.part('Cingulum and sulcus (grooves)', 'The cingulum is the groove that runs around the middle of the cell and divides the upper half (epicone) from the lower half (hypocone). The sulcus is a second groove that runs from the cingulum down the underside; the flagella leave the cell from pores where they meet.', [cingBand, sulc]);
  S.part('Transverse flagellum', 'A ribbon-like flagellum that lies in the cingulum and wraps most of the way around the cell. Its wave pushes the cell forward and, because the wave runs round the body, makes the cell spin as it swims.', tf.mesh);
  S.part('Longitudinal flagellum', 'A trailing flagellum that leaves from the sulcus and extends behind the cell. It beats with a wave and acts mainly as a rudder and brake, steering the cell as the transverse flagellum drives it.', lf.mesh);
  S.part('Nuclear envelope', 'The envelope of the dinokaryon, the nucleus of a dinoflagellate. This nucleus is large and often sits in the lower half of the cell. It is a double membrane with pores, as in other eukaryotes.', env, { shell: true });
  S.part('Condensed chromosomes', 'Dinoflagellate chromosomes stay condensed as thick banded rods through the whole cell cycle, a feature almost unique among eukaryotes. They carry very little histone protein and their DNA is held by other proteins. The nucleolus (rust sphere) makes ribosomes.', [chr, nucleolus]);
  S.part('Chloroplasts', 'Many golden-brown chloroplasts line the cell. They contain chlorophyll a and c and the carotenoid peridinin, which gives the colour and lets the cell use blue-green light. Each is surrounded by three membranes, a sign of their origin from an engulfed alga.', cp);
  S.part('Oil and starch droplets', 'Carbon fixed by photosynthesis is stored as starch and as oil droplets. Dinoflagellates use these reserves for energy when light is poor and to build cysts.', dr);
  const rp = V(), sd = V(1, 0, 0), sd2 = V();
  S.anim(t => {
    cell.rotation.y = t * 2.2; tilt.rotation.x = .12 * Math.sin(t * .8); cell.position.y = .9 + .08 * Math.sin(t * 1.9);
    for (let i = 0; i <= NT; i++) {
      const ph = i / NT * TAU, a = .06 + .07 * (.5 + .5 * Math.sin(6 * ph - t * 17)), b = .09 * Math.sin(8 * ph - t * 15);
      tPts[i].copy(tBase[i]).addScaledVector(tDir[i], a); tPts[i].y += b;
    }
    tf.update(tPts, s => .032 + .006 * Math.sin(s * 40));
    lf.wave(lo, ld, perpBasis(ld), 4.0, .55, 2.6, 13, t, .8);
  });
}
NEWBUILD.dinoflagellate = buildDinoflagellate;
NEW_SPEC.push({ id: 'dinoflagellate', cat: 'algae', name: 'Dinoflagellate', latin: 'Peridinium-type armoured dinoflagellate', size: 'about 30–60 µm long', sizeUm: 45, U: 8.2, dist: 17,
  cls: 'Eukaryota · SAR · Alveolata · Dinoflagellata', habitat: 'Plankton of lakes, ponds and the sea; some species form blooms', move: 'Swims by two flagella, spinning as it goes; the transverse flagellum drives and the longitudinal one steers', feed: 'Mixotroph: photosynthesis with golden-brown chloroplasts; many species also take in prey', repro: 'Mostly asexual binary fission; sexual stages produce resting cysts that survive harsh seasons',
  desc: 'An armoured cell with a hard cellulose theca, a groove around its middle holding a ribbon flagellum, and a trailing flagellum behind. Inside are a large nucleus with always-condensed chromosomes and golden-brown chloroplasts.',
  fun: ['The name comes from the Greek dinos, whirling, because the cells spin as they swim.', 'Their chromosomes stay condensed through the entire cell cycle, which is almost unique among eukaryotes.', 'Some species cause red tides, and a few make toxins that build up in shellfish.', 'Other species glow blue when disturbed, which makes sea water sparkle at night.'],
  note: 'The overall form and plate rows follow armoured genera such as Peridinium; the exact plate number and layout here are simplified. The spin rate and flagellar waves are slowed for viewing. Chloroplasts and chromosomes are shown in smaller numbers than in a real cell, and colours are artistic.' });

/* ================= 2. Desmid (Micrasterias) ================= */
function f4Dg(psi) {
  const a = Math.abs(psi), tooth = 1 - .07 * Math.abs(Math.sin(a * 17));
  const n1 = Math.exp(-(((a - .62) / .055) ** 2)), n0 = Math.exp(-((a / .06) ** 2)), n2 = Math.exp(-(((a - 1.24) / .06) ** 2)), n3 = Math.exp(-(((a - .31) / .045) ** 2)) + Math.exp(-(((a - .93) / .045) ** 2));
  const r = (.97 - .5 * n1 - .24 * n0 - .2 * n2 - .12 * n3) * tooth, w = sstep(1.568, 1.4, a);
  return .14 + (r - .14) * w;
}
const F4DN = 1440, F4D = (() => { const t = new Float32Array(F4DN + 1); for (let i = 0; i <= F4DN; i++) { const th = -Math.PI + i / F4DN * TAU, psi = Math.abs(th) <= Math.PI / 2 ? th : Math.sign(th) * Math.PI - th; t[i] = f4Dg(psi); } return t; })();
function f4Dr(th) { let x = (th + Math.PI) / TAU * F4DN; x -= Math.floor(x / F4DN) * F4DN; const i = Math.floor(x); return lerp(F4D[i], F4D[i + 1], x - i); }
const f4Dt = (x, R, Tm) => Tm * (.4 + .6 * sstep(0, .4 * R, Math.abs(x)));
function f4DesmidGeo(R, Tm, sc, tsc, e, xc, nA = 44, nT = 288) {
  const w = nT + 1, pos = new Float32Array((nA + 1) * w * 3), uv = new Float32Array((nA + 1) * w * 2), idx = [];
  for (let i = 0; i <= nA; i++) {
    const a = i / nA * Math.PI, sa = Math.sin(a), ca = Math.cos(a), rho = Math.pow(sa, e), zf = Math.sign(ca) * Math.pow(Math.abs(ca), e);
    for (let j = 0; j <= nT; j++) {
      const th = -Math.PI + j / nT * TAU, r = f4Dr(th) * R * sc * rho; let x = r * Math.cos(th);
      const y = r * Math.sin(th); if (xc !== null && x < xc) x = xc;
      const k = i * w + j; pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = zf * f4Dt(x, R, Tm) * tsc; uv[k * 2] = j / nT; uv[k * 2 + 1] = i / nA;
    }
  }
  for (let i = 0; i < nA; i++) for (let j = 0; j < nT; j++) { const a = i * w + j, b = a + 1, c = a + w, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals(); f4Seam(g, nA, nT); return g;
}
function buildDesmid(S) {
  const R = rng(402), Rc = 3.6, Tm = .78, E = .6, root = new THREE.Group(); S.add(root);
  const wall = new THREE.Mesh(f4DesmidGeo(Rc, Tm, 1, 1, E, null), M.shell(0xcfc77c, .42, { bumpScale: .5 })); wall.renderOrder = 10; root.add(wall);
  const rimPts = []; for (let j = 0; j <= 600; j++) { const th = -Math.PI + j / 600 * TAU, r = f4Dr(th) * Rc; rimPts.push(V(r * Math.cos(th), r * Math.sin(th), 0)); }
  const rim = tubePts(rimPts, 6, .035, M.soft(0x6f6a2a, { roughness: .5 })); root.add(rim);
  /* chloroplasts */
  const stripeT = canvasTex(256, 32, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const x = i / 40 * w, gr = g.createLinearGradient(x - 3, 0, x + 3, 0); gr.addColorStop(0, '#808080'); gr.addColorStop(.5, '#e8e8e8'); gr.addColorStop(1, '#808080'); g.fillStyle = gr; g.fillRect(x - 3, 0, 6, h); } }, false);
  const chlGeo = f4DesmidGeo(Rc, Tm, .8, .66, .7, .12 * Rc, 36, 288), chlM = M.soft(0x5ea23a, { bumpMap: stripeT, bumpScale: 2.2, roughness: .5 });
  const chlR = new THREE.Mesh(chlGeo, chlM), chlL = new THREE.Mesh(chlGeo, chlM); chlL.scale.x = -1; root.add(chlR, chlL);
  /* pyrenoids */
  const NP = 9, pyC = inst(G.sphereMid, M.soft(0xe3df8e, { clearcoat: .6 }), NP * 2), pyS = inst(G.sphereMid, M.shell(0xfaf5d2, .6, { bumpScale: .2 }), NP * 2); pyS.renderOrder = 6;
  for (let i = 0; i < NP; i++) {
    let th, rho, x, y; do { th = (R() * 2 - 1) * 1.2; rho = .15 + R() * .6; x = rho * f4Dr(th) * Rc * .8 * Math.cos(th); y = rho * f4Dr(th) * Rc * .8 * Math.sin(th); } while (x < .12 * Rc + .35);
    const s = .15 + R() * .07; for (const sg of [1, -1]) { const k = i * 2 + (sg > 0 ? 0 : 1); setI(pyC, k, V(sg * x, y, 0), null, V(s, s, s * .8)); setI(pyS, k, V(sg * x, y, 0), null, V(s * 1.45, s * 1.45, s * 1.15)); }
  }
  root.add(pyC, pyS);
  /* nucleus */
  const nuc = new THREE.Mesh(G.sphere, M.shell(0xe0a468, .5, { bumpScale: .2 })); nuc.scale.set(.34, .38, .24); nuc.renderOrder = 7; root.add(nuc);
  const nlc = new THREE.Mesh(G.sphereMid, M.soft(0xa4552e)); nlc.scale.set(.1, .1, .08); nlc.position.set(.02, .03, .02); root.add(nlc);
  const chrM = M.soft(0x8a3a5c), chrom = new THREE.Group(); root.add(chrom);
  for (let i = 0; i < 9; i++) { const c = randInBall(R); c.set(c.x * .2, c.y * .22, c.z * .13); const d = randDir(R); chrom.add(tubeCurve(new THREE.CatmullRomCurve3([c.clone().addScaledVector(d, -.07), c, c.clone().addScaledVector(d, .07)]), 10, 5, .018, chrM)); }
  /* isthmus ring */
  const ip = []; for (let j = 0; j <= 48; j++) { const a = j / 48 * TAU; ip.push(V(0, .5 * Math.cos(a), f4Dt(0, Rc, Tm) * .96 * Math.sin(a))); }
  const isth = tubePts(ip, 6, .05, M.soft(0x7b6b2a, { roughness: .5 })); root.add(isth);
  /* wall pores */
  const NPR = 340, pore = inst(new THREE.TorusGeometry(.05, .014, 5, 9), M.soft(0x5a5524, { roughness: .6 }), NPR);
  for (let i = 0; i < NPR; i++) { let th, rho; th = R() * TAU; rho = Math.sqrt(R()) * .93; const r = rho * f4Dr(th) * Rc, x = r * Math.cos(th), y = r * Math.sin(th), side = i % 2 ? 1 : -1; if (Math.abs(x) < .5 && Math.abs(y) < .8) { i--; continue; } const z = side * f4Dt(x, Rc, Tm) * Math.pow(Math.max(0, 1 - Math.pow(rho, 2 / E)), E / 2); setI(pore, i, V(x, y, z + side * .008), null, 1); }
  root.add(pore);
  /* mucilage strands */
  const muc = new THREE.Group(); root.add(muc); const mucM = M.shell(0xd8b45a, .55, { bumpScale: .1, roughness: .5 }), strands = [];
  for (let i = 0; i < 26; i++) {
    const th = -Math.PI + (i + R() * .6) / 26 * TAU, r = f4Dr(th) * Rc, dir = V(Math.cos(th), Math.sin(th), 0), p0 = dir.clone().multiplyScalar(r * .985), sd = V(-dir.y, dir.x, 0).multiplyScalar((R() - .5) * .8);
    const c = new THREE.CatmullRomCurve3([p0, p0.clone().addScaledVector(dir, .5).add(V(0, 0, -.3)), p0.clone().addScaledVector(dir, 1.1).add(sd).add(V(0, 0, -.85)), p0.clone().addScaledVector(dir, 1.8).addScaledVector(sd, 2).add(V(0, 0, -1.5))]);
    const m = tubeCurve(c, 20, 5, s => .03 * (1 - s * .75), mucM); muc.add(m); strands.push(m);
  }
  /* cytoplasmic streaming granules */
  const NG = 150, gr = inst(G.sphereLo, M.soft(0xd8cf62, { roughness: .4 }), NG), gth = [], grho = [], gsp = [], gsd = [];
  for (let i = 0; i < NG; i++) { gth.push(R() * TAU); grho.push(.84 + R() * .08); gsp.push((.05 + R() * .08) * (R() > .5 ? 1 : -1)); gsd.push(R() > .5 ? 1 : -1); }
  root.add(gr); const gP = V();
  const updG = t => {
    for (let i = 0; i < NG; i++) {
      const th = gth[i] + gsp[i] * t, rho = grho[i], r = rho * f4Dr(th) * Rc, x = r * Math.cos(th), y = r * Math.sin(th);
      gP.set(x, y, gsd[i] * f4Dt(x, Rc, Tm) * .72 * Math.pow(Math.max(0, 1 - Math.pow(rho, 2 / E)), E / 2) / .72 * .8); setI(gr, i, gP, null, .05 + (i % 3) * .008);
    }
    gr.instanceMatrix.needsUpdate = true;
  };
  updG(0);
  S.part('Cell wall', 'A cellulose wall with other polysaccharides, laid down in two layers. In Micrasterias each half-cell has a wall pattern of deep lobes ending in small teeth. The dark rim line traces the edge of the cell in this model.', [wall, rim], { shell: true });
  S.part('Wall pores', 'Fine pores cross the wall in a regular pattern. Mucilage made inside the cell passes out through them, and the cell also uses the mucilage to stick to surfaces and glide.', pore);
  S.part('Mucilage trail', 'Slime pushed out through the wall pores forms a gel that bonds to the surface; as the cell slowly secretes it, the cell is pushed along in the opposite direction. This is how desmids, which have no flagella, glide at a few micrometres per second.', muc);
  S.part('Chloroplasts', 'Each half-cell holds one large, deeply lobed chloroplast whose ridges follow the lobes of the wall. It carries out photosynthesis and gives the cell its fresh green colour.', [chlR, chlL]);
  S.part('Pyrenoids', 'Dense protein bodies inside the chloroplast that hold the enzyme rubisco and concentrate carbon dioxide for photosynthesis. Each is ringed by a sheath of starch, the stored product of photosynthesis.', [pyC, pyS]);
  S.part('Nucleus', 'A single nucleus lies in the narrow bridge at the middle of the cell. It has a prominent nucleolus. During division it moves out and splits, and each new cell receives one copy.', [nuc, nlc, chrom], { shell: false });
  S.part('Isthmus', 'The narrow zone that joins the two mirror-image halves (semicells). New wall grows from here when the cell divides: each half builds a fresh mirror-image half, so each daughter keeps one old and one new semicell.', isth);
  S.part('Streaming granules', 'Small particles ride the slow flow of cytoplasm around the chloroplasts. This streaming moves materials, such as stored products and enzymes, around the large cell.', gr);
  S.anim(t => {
    root.rotation.x = -.3 + .14 * Math.sin(t * .5); root.rotation.y = .3 + .28 * Math.sin(t * .3); root.rotation.z = .1 * Math.sin(t * .4 + 1);
    root.position.x = .35 * Math.sin(t * .2); root.position.y = .15 * Math.sin(t * .27);
    muc.rotation.z = .035 * Math.sin(t * .9); strands.forEach((m, i) => { m.rotation.z = .02 * Math.sin(t * 1.1 + i * .6); });
    updG(t);
  });
}
NEWBUILD.desmid = buildDesmid;
NEW_SPEC.push({ id: 'desmid', cat: 'algae', name: 'Desmid', latin: 'Micrasterias denticulata', size: 'about 150–250 µm across', sizeUm: 200, U: 7.6, dist: 17,
  cls: 'Eukaryota · Archaeplastida · Streptophyta · Zygnematophyceae', habitat: 'Acid, nutrient-poor ponds, bogs and the edges of soft-water lakes', move: 'Glides slowly over surfaces by pushing out mucilage; it has no flagella', feed: 'Photoautotroph: photosynthesis in two large chloroplasts', repro: 'Mostly cell division in which each half builds a new mirror half; sexual reproduction by conjugation forms a resting zygospore',
  desc: 'A flat, disc-shaped cell made of two mirror-image halves joined at a narrow isthmus, with deeply cut lobes along its edge. Each half holds a lobed green chloroplast and the nucleus sits at the join.',
  fun: ['When it divides, each half builds a new mirror-image half in a few hours; the lobes grow out from a small bulge and are shaped with great precision.', 'Desmids are green algae and close relatives of land plants.', 'Micrasterias is a classic cell for studying how a cell shapes its wall.', 'They are most common in acid, soft-water habitats such as peat bogs.'],
  note: 'Cell shape and lobe pattern follow the real species but are simplified, with fewer teeth and a smoother edge. The cell is shown thicker than in life, and its size and rate of gliding are exaggerated for viewing. Granule movement is schematic. Colours are artistic.' });

/* ================= 3. Oscillatoria (cyanobacterial filament) ================= */
function buildOscillatoria(S) {
  const R = rng(403), N = 40, cl = .215, rad = .56, Q = N * 4, ds = cl / 4, Ltot = Q * ds, KW = 2 * Math.PI / 6.5;
  const root = new THREE.Group(); root.rotation.set(.18, -.2, 0); S.add(root);
  /* geometries */
  const h = cl / 2 * .98, cr = .06, prof = [V2(0, -h), V2(rad - cr, -h)];
  for (let k = 1; k <= 4; k++) { const a = k / 4 * Math.PI / 2; prof.push(V2(rad - cr + cr * Math.sin(a), -h + cr - cr * Math.cos(a))); }
  for (let k = 0; k <= 4; k++) { const a = k / 4 * Math.PI / 2; prof.push(V2(rad - cr + cr * Math.cos(a), h - cr + cr * Math.sin(a))); }
  prof.push(V2(0, h));
  const wallG = new THREE.LatheGeometry(prof, 40); wallG.rotateZ(-Math.PI / 2);
  const thyG = new THREE.CylinderGeometry(1, 1, cl * .74, 36, 1, true); thyG.rotateZ(Math.PI / 2);
  const sepG = new THREE.CylinderGeometry(rad * .93, rad * .93, .02, 32); sepG.rotateZ(Math.PI / 2);
  const gvG = new THREE.CapsuleGeometry(.018, .05, 3, 6), grG = G.sphereLo;
  const wallM = M.shell(0xffffff, .5, { bumpScale: .3 }), thyM = M.shell(0x2e8a58, .5, { bumpScale: .6, roughness: .5 }), sepM = M.soft(0x6b8438, { roughness: .5 }), nucM = M.soft(0xa05f7e, { roughness: .45 }), gvM = M.soft(0xf2e7bf, { roughness: .5 }), grM = M.soft(0xe0b13e, { roughness: .35, clearcoat: .7 });
  const wall = inst(wallG, wallM, N); wall.renderOrder = 9;
  const thy = inst(thyG, thyM, N * 3), sep = inst(sepG, sepM, N - 1), nuc = inst(G.sphereMid, nucM, N), gv = inst(gvG, gvM, N * 6), gran = inst(grG, grM, N * 2);
  const tcol = new THREE.Color(); for (let i = 0; i < N; i++) wall.setColorAt(i, tcol.setHSL(.40 + R() * .03, .38 + R() * .1, .5 + R() * .06));
  root.add(wall, thy, sep, nuc, gv, gran);
  /* tip cap */
  const cap = new THREE.Mesh(G.sphere, M.shell(0x9fb35a, .6, { bumpScale: .5 })); cap.renderOrder = 10; cap.matrixAutoUpdate = false; root.add(cap);
  /* local matrices per cell, by layer */
  const taper = i => { const t = clamp((i - (N - 9)) / 8, 0, 1); return 1 - .58 * Math.pow(t, 1.4); };
  const LW = [], LT = [], LS = [], LN = [], LG = [], LR = [], ID = new THREE.Quaternion(), qr = new THREE.Quaternion(), eu = new THREE.Euler();
  for (let i = 0; i < N; i++) {
    const tp = taper(i);
    LW.push(f4Loc(V(), ID, V(1, tp, tp)));
    [.47, .4, .33].forEach(r => LT.push(f4Loc(V(), ID, V(1, r * tp, r * tp))));
    if (i > 0) LS.push(f4Loc(V(-cl / 2, 0, 0), ID, V(1, tp, tp)));
    LN.push(f4Loc(V(), ID, V(.07, .17 * tp, .17 * tp)));
    for (let k = 0; k < 6; k++) { const a = R() * TAU, rr = (.24 + R() * .1) * tp; eu.set(R() * 3, R() * 3, R() * 3); qr.setFromEuler(eu); LG.push(f4Loc(V((R() - .5) * cl * .5, rr * Math.cos(a), rr * Math.sin(a)), qr, 1)); }
    for (let k = 0; k < 2; k++) { const a = R() * TAU, rr = .42 * tp; LR.push(f4Loc(V((k ? .5 : -.5) * cl * .82, rr * Math.cos(a), rr * Math.sin(a)), ID, k ? .04 : .05)); }
  }
  /* path */
  const pts = Array.from({ length: Q + 1 }, () => V()), Nrm = V(0, 1, 0), Tn = V(), Bn = V(), Ny = V(), Bz = V(), P0 = V(), cen = V();
  const sheath = new Tube(Q, 20, M.shell(0xa6d19a, .3, { bumpScale: .2, roughness: .4 })); sheath.mesh.renderOrder = 12; root.add(sheath.mesh);
  const sheathR = s => s < .86 ? .66 : .66 * (1 - .5 * Math.pow((s - .86) / .14, 1.5)) + .02;
  const Mc = new THREE.Matrix4(), tmp = new THREE.Matrix4();
  const upd = t => {
    let x = 0, y = 0, z = 0; cen.set(0, 0, 0);
    for (let k = 0; k <= Q; k++) {
      pts[k].set(x, y, z); cen.add(pts[k]);
      const sn = k / Q, amp = .1 + .62 * sn * sn, th = amp * Math.sin(KW * k * ds - t * 2.2), ph = .5 * amp * Math.cos(KW * k * ds - t * 2.2 + .9);
      x += Math.cos(th) * Math.cos(ph) * ds; y += Math.sin(th) * ds; z += Math.cos(th) * Math.sin(ph) * ds;
    }
    cen.multiplyScalar(1 / (Q + 1));
    for (let k = 0; k <= Q; k++) pts[k].sub(cen);
    Nrm.set(0, 1, 0);
    let ti = 0, si = 0, ni = 0, gi = 0, ri = 0;
    for (let i = 0; i < N; i++) {
      const c = 4 * i + 2; Tn.subVectors(pts[c + 1], pts[c - 1]).normalize();
      Nrm.addScaledVector(Tn, -Nrm.dot(Tn)).normalize(); Bn.crossVectors(Tn, Nrm);
      const r = t * .9 + i * .1, cr2 = Math.cos(r), sr = Math.sin(r);
      Ny.copy(Nrm).multiplyScalar(cr2).addScaledVector(Bn, sr); Bz.copy(Bn).multiplyScalar(cr2).addScaledVector(Nrm, -sr);
      Mc.makeBasis(Tn, Ny, Bz).setPosition(pts[c]);
      wall.setMatrixAt(i, tmp.multiplyMatrices(Mc, LW[i]));
      for (let k = 0; k < 3; k++) thy.setMatrixAt(i * 3 + k, tmp.multiplyMatrices(Mc, LT[i * 3 + k]));
      if (i > 0) sep.setMatrixAt(si++, tmp.multiplyMatrices(Mc, LS[i - 1]));
      nuc.setMatrixAt(i, tmp.multiplyMatrices(Mc, LN[i]));
      for (let k = 0; k < 6; k++) gv.setMatrixAt(i * 6 + k, tmp.multiplyMatrices(Mc, LG[i * 6 + k]));
      for (let k = 0; k < 2; k++) gran.setMatrixAt(i * 2 + k, tmp.multiplyMatrices(Mc, LR[i * 2 + k]));
      if (i === N - 1) { cap.matrix.multiplyMatrices(Mc, f4M1.compose(f4Tmp.set(cl * .5, 0, 0), ID, f4Tmp2.set(.16, rad * taper(i) * .96, rad * taper(i) * .96))); cap.matrixWorldNeedsUpdate = true; }
    }
    [wall, thy, sep, nuc, gv, gran].forEach(m => m.instanceMatrix.needsUpdate = true);
    sheath.update(pts, sheathR);
    root.position.x = .5 * Math.sin(t * .3);
  };
  upd(0); S.anim(upd);
  S.part('Sheath', 'A thin, loose envelope of slime (polysaccharide) around the whole filament. It is optional in Oscillatoria and often very thin. It protects the cells and gives the filament something to glide against when it moves.', sheath.mesh, { shell: true });
  S.part('Cells of the trichome', 'The chain of cells is called a trichome. Each cell is a short disc, much wider than long, with a Gram-negative type wall. There are no branches and no specialised heterocysts: every cell does photosynthesis, and the cells stay linked by tiny channels.', wall, { shell: true });
  S.part('Cross-walls (septa)', 'Each cell is separated from its neighbours by a cross-wall of peptidoglycan. Microscopic channels pass through each wall so neighbouring cells can exchange small molecules and signals along the filament.', sep);
  S.part('Thylakoid membranes', 'Layers of photosynthetic membrane lie around the edge of the cell. They carry chlorophyll a and phycobilisomes with the pigments phycocyanin and phycoerythrin, which together give the teal-green colour. Cyanobacteria have no chloroplast, so these membranes lie free in the cytoplasm.', thy, { shell: true });
  S.part('Nucleoid', 'The cell has a ring of DNA with no membrane around it. It sits in the clear central cytoplasm and each cell holds several copies of the chromosome.', nuc);
  S.part('Gas vesicles', 'Small gas-filled protein compartments that make the filament more buoyant. Filaments of Oscillatoria in water may use them to adjust their depth to find the right amount of light.', gv);
  S.part('Storage granules', 'Granules of stored nutrient, such as cyanophycin (a nitrogen reserve) and polyphosphate, tend to collect next to the cross-walls and are used when the cell needs them.', gran);
  S.part('Tapered tip cell', 'The tip of the trichome narrows. The end cell is often rounded or capped by a thicker outer wall called the calyptra, and the tip is the part that swings most as the filament moves.', cap, { shell: true });
}
NEWBUILD.oscillatoria = buildOscillatoria;
NEW_SPEC.push({ id: 'oscillatoria', cat: 'algae', name: 'Oscillatoria', latin: 'Oscillatoria sp.', size: 'cells 4–10 µm wide and 1–4 µm long; filaments from 100 µm to several millimetres', sizeUm: 400, U: 9, dist: 18,
  cls: 'Bacteria · Cyanobacteriota · Oscillatoriales', habitat: 'Ponds, ditches, damp soil, hot springs and mats on mud and stones', move: 'Glides over surfaces and sways side to side as it turns around its own axis; no flagella', feed: 'Photoautotroph: oxygenic photosynthesis with chlorophyll a and phycobilin pigments', repro: 'Filaments break into short pieces called hormogonia that glide away and grow into new filaments',
  desc: 'An unbranched chain of flat disc-shaped cells that sways and glides. It is a cyanobacterium, a photosynthetic bacterium, and has no nucleus or chloroplast.',
  fun: ['The name refers to its swaying, oscillating movement, which can be seen under a microscope.', 'Cyanobacteria were the first organisms to make oxygen by photosynthesis, more than 2 billion years ago.', 'It does not fix nitrogen in specialised cells, unlike Anabaena, because it has no heterocysts.', 'The rotation and gliding are driven by slime secretion and pili at the cell surface.'],
  note: 'Cells and filament length are drawn at a convenient scale, with fewer cells (40) than a typical filament. The wave and the rotation are faster than real gliding, which is only a few micrometres per second. Gas vesicle and granule numbers are reduced. Colours are artistic: the real pigments make it blue-green.' });
