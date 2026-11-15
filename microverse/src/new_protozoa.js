/* ================= NEW PROTOZOA ================= */
const cycle = (t, T) => (t % T) / T;
const snapPulse = (k, a = .05, b = .5) => k < a ? sstep(0, a, k) : Math.max(0, 1 - sstep(a, b, k));
const stripeTex = (c1, c2, n = 28) => canvasTex(256, 32, (g, w, h) => { g.fillStyle = c1; g.fillRect(0, 0, w, h); g.fillStyle = c2; for (let i = 0; i < n; i++) g.fillRect(i * w / n + 2, 0, w / n * .35, h); });

/* ---------- Stentor ---------- */
function buildStentor(S) {
  const L = 5.2, rf = u => .09 + .98 * Math.pow(u, 2.2);
  const bg = new THREE.Group(); bg.position.y = -L / 2; S.add(bg);
  const geo = latheBody(L, rf, 60, 40); geo.translate(0, L / 2, 0);
  const tex = stripeTex('#7cc1c4', '#2f7f8d'); tex.wrapS = THREE.RepeatWrapping;
  const body = S.mesh(geo, M.shell(0xffffff, .62, { map: tex, bumpScale: .15, clearcoat: .5 }), { parent: bg, ro: 8 });
  S.part('Pellicle and stentorin stripes', 'The flexible, ridged cell surface holds stripes of blue-green granules of the pigment stentorin. Contractile fibres (myonemes) beneath the ridges let the cell shorten to a ball within milliseconds.', body, { shell: true });
  const rt = rf(1);
  const disc = S.mesh(new THREE.CircleGeometry(rt, 48), PM.cuticle(0xb7d9d6, { side: THREE.DoubleSide, opacity: .9, transparent: true }), { parent: bg, p: V(0, L + .005, 0), r: [-Math.PI / 2, 0, 0], ro: 9 });
  const rim = S.mesh(new THREE.TorusGeometry(rt, .06, 8, 64), PM.cuticle(0x2f7f8d), { parent: bg, p: V(0, L, 0), r: [Math.PI / 2, 0, 0] });
  const ring = { P: [], N: [] }; for (let i = 0; i < 120; i++) { const a = i / 120 * TAU; ring.P.push(V(Math.cos(a) * (rt + .02), L + .02, Math.sin(a) * (rt + .02))); ring.N.push(V(Math.cos(a) * .8, .6, Math.sin(a) * .8).normalize()); }
  const mem = ciliaSet(S, PM.cuticle(0xe8f4f2), ring.P, ring.N, { len: .38, r: .035, amp: .55, speed: 9, wave: -5, axis: V(0, 0, 1), parent: bg });
  const mouth = S.mesh(G.sphere, PM.dark(0x24585f), { parent: bg, p: V(rt * .55, L - .02, 0), s: V(.2, .12, .26) });
  S.part('Oral disc and membranelles', 'The wide crown carries a spiral band of fused cilia called membranelles. Their beating makes a whirlpool that sweeps bacteria, algae and even other ciliates toward the mouth at the centre of the spiral.', [disc, rim, mem, mouth]);
  const mac = new THREE.Group(); bg.add(mac); const mm = M.grain(0xb69ad8);
  for (let i = 0; i < 9; i++) { const u = .22 + i * .075; S.mesh(G.sphere, mm, { parent: mac, p: V(Math.sin(i * 1.4) * .12, u * L, Math.cos(i * 1.4) * .12), s: V(.17, .2, .17) }); }
  S.part('Macronucleus', 'A chain of beads (moniliform macronucleus) holds many copies of every gene and runs the cell day to day. A separate micronucleus, used in sexual exchange, is much smaller and easily missed.', mac);
  const body2 = ciliaSet(S, PM.cuticle(0xcfe7e6), ...(() => { const p = lathePts(L, rf, 520, { rows: 26, u0: .12, u1: .96, seed: 3 }); p.P.forEach(v => v.y += L / 2); return [p.P, p.N]; })(), { len: .12, r: .014, amp: .5, speed: 7, wave: 2.5, axis: V(0, 1, 0), parent: bg });
  S.part('Somatic cilia', 'Rows of short cilia run lengthwise down the body. A stentor usually stays anchored, but it can let go and swim with them when disturbed or short of food. Only a sample of the cilia is drawn.', body2);
  const cv = S.mesh(G.sphere, M.glass(0xdff3f5, .55), { parent: bg, p: V(-.62, L * .84, .2), s: .22, ro: 7 });
  S.part('Contractile vacuole', 'Fills with excess water from the cytoplasm and empties through a pore. Freshwater ciliates need this pump to keep from swelling.', cv);
  const hf = new THREE.Group(); bg.add(hf);
  S.mesh(G.cone, PM.cuticle(0x8a8f84), { parent: hf, p: V(0, 0, 0), s: V(.16, .22, .16), r: [Math.PI, 0, 0] }); S.mesh(new THREE.CylinderGeometry(.34, .34, .06, 24), PM.cuticle(0x8a8f84), { parent: hf, p: V(0, -.2, 0) });
  S.part('Holdfast', 'A sticky foot at the narrow end glues the cell to plants and debris. The cell can detach it, swim away and settle again elsewhere.', hf);
  S.anim(t => { const c = snapPulse(cycle(t, 12), .035, .5); bg.scale.set(1 + .35 * c, 1 - .55 * c, 1 + .35 * c); bg.rotation.z = .07 * Math.sin(t * .6) * (1 - c); bg.rotation.x = .05 * Math.sin(t * .45); });
}
NEWBUILD.stentor = buildStentor;
NEW_SPEC.push({ id: 'stentor', cat: 'protozoa', name: 'Stentor', latin: 'Stentor coeruleus', size: 'up to about 2 mm extended', sizeUm: 1500, U: 5.2, dist: 10.5,
  cls: 'Eukaryota · SAR · Ciliophora · Heterotrichea', habitat: 'Still freshwater ponds, attached to plants and debris', move: 'Usually anchored by a holdfast; contracts into a ball when touched, or detaches and swims', feed: 'Filter feeder: oral membranelles sweep bacteria, algae and small protists into the mouth', repro: 'Binary fission; sexual conjugation also occurs',
  desc: 'A trumpet-shaped giant among single cells. The blue-green body stretches from a sticky foot to a wide crown of beating membranelles that draws food into the mouth.',
  fun: ['Large enough to see without a microscope as a faint blue-green speck on pond weed.', 'It can regenerate: a cut cell heals, and fragments that keep part of the macronucleus can grow into whole cells.', 'The blue-green colour comes from the pigment stentorin.'],
  note: 'Cilia are a sample of the real number. The contraction is shown every 12 seconds; real contractions are triggered by touch. Colours are natural.' });

/* ---------- Vorticella ---------- */
function buildVorticella(S) {
  const NS = 70, Ls = 4.5, base = -2.5, pts = Array.from({ length: NS + 1 }, () => V());
  const sheath = new Tube(NS, 10, M.shell(0xc9d6c4, .5, { roughness: .3 })), core = new Tube(NS, 8, M.emit(0xd88a62, .35, { roughness: .4 }));
  S.add(sheath.mesh); S.add(core.mesh); sheath.mesh.renderOrder = 4;
  S.mesh(new THREE.CylinderGeometry(.9, 1, .18, 28), PM.cuticle(0x8a8473), { p: V(0, base - .09, 0) });
  const zoo = new THREE.Group(); S.add(zoo);
  const BL = 1.5, rf = u => u < .7 ? .13 + .66 * Math.sin(u / .7 * Math.PI / 2) : .79 - (u - .7) * 1.0;
  const geo = latheBody(BL, rf, 40, 36); geo.translate(0, BL / 2, 0);
  const bell = S.mesh(geo, M.shell(0x9fc7a0, .5, { clearcoat: .6 }), { parent: zoo, ro: 8 });
  S.part('Zooid (bell) and pellicle', 'The bell is a single cell about 50 to 150 micrometres across. A flexible pellicle covers it and the narrow base joins the stalk. There are no body cilia; the cell feeds with the ring at its rim.', bell, { shell: true });
  const lip = S.mesh(new THREE.TorusGeometry(.69, .075, 10, 48), PM.cuticle(0x6f9f78), { parent: zoo, p: V(0, BL * .98, 0), r: [Math.PI / 2, 0, 0] });
  const rg = { P: [], N: [] }; for (let i = 0; i < 70; i++) { const a = i / 70 * TAU; rg.P.push(V(Math.cos(a) * .72, BL, Math.sin(a) * .72)); rg.N.push(V(Math.cos(a) * .55, .83, Math.sin(a) * .55).normalize()); }
  const cil = ciliaSet(S, PM.cuticle(0xe5efe0), rg.P, rg.N, { len: .36, r: .03, amp: .5, speed: 10, wave: -6, axis: V(0, 0, 1), parent: zoo });
  const pd = S.mesh(new THREE.CylinderGeometry(.5, .56, .08, 32), PM.cuticle(0xb7d0b4, { transparent: true, opacity: .85 }), { parent: zoo, p: V(0, BL * 1.0, 0) });
  S.part('Peristome and oral cilia', 'A raised rim, the peristome, bears two spiralling rows of cilia. Their beat draws a current of water, and the bacteria in it, down into the mouth.', [lip, cil, pd]);
  const mac = S.mesh(new THREE.TorusGeometry(.34, .1, 10, 24, 4.4), M.grain(0xa98cc9), { parent: zoo, p: V(0, BL * .52, 0), r: [Math.PI / 2, 0, .8] });
  S.part('Macronucleus', 'A long C-shaped nucleus carries many copies of the genes and controls the cell. A tiny micronucleus lies beside it.', mac);
  const cv = S.mesh(G.sphere, M.glass(0xe5f4ff, .6), { parent: zoo, p: V(.32, BL * .82, .2), s: .15, ro: 7 });
  const fv = S.mesh(G.sphere, PM.dark(0x7a8f4a), { parent: zoo, p: V(-.2, BL * .38, .25), s: .17, ro: 6 });
  S.part('Contractile and food vacuoles', 'The contractile vacuole pumps out excess water. Food vacuoles hold swallowed bacteria while they are digested.', [cv, fv]);
  S.part('Stalk sheath', 'A fibrous sheath around the stalk anchors the cell to plants and debris. It can stand almost straight or coil like a spring.', sheath.mesh);
  S.part('Spasmoneme', 'A bundle of calcium-driven protein fibres inside the stalk. When it fires, it shortens in about a hundredth of a second, pulling the stalk into a tight spiral. It relaxes slowly afterward.', core.mesh);
  const T = V(), P0 = V();
  S.anim(t => {
    const c = snapPulse(cycle(t, 9), .03, .42), len = Ls * (1 - .78 * c), rc = .5 * c;
    for (let i = 0; i <= NS; i++) { const s = i / NS; pts[i].set(rc * Math.sin(s * TAU * 5) + .16 * Math.sin(s * 3 + t * .5) * (1 - c), base + s * len, rc * Math.cos(s * TAU * 5) - rc); }
    sheath.update(pts, () => .085); core.update(pts, () => .04);
    T.subVectors(pts[NS], pts[NS - 2]).normalize(); zoo.position.copy(pts[NS]); zoo.quaternion.setFromUnitVectors(UP, T);
    zoo.rotateY(t * .3);
  });
}
NEWBUILD.vorticella = buildVorticella;
NEW_SPEC.push({ id: 'vorticella', cat: 'protozoa', name: 'Vorticella', latin: 'Vorticella convallaria', size: 'bell 50–150 µm; stalk up to about 1 mm', sizeUm: 100, U: 1.5, dist: 12,
  cls: 'Eukaryota · SAR · Ciliophora · Peritrichia', habitat: 'Freshwater and damp surfaces, attached to plants, debris and animals', move: 'Fixed on a stalk; the stalk coils in a split second and slowly extends again', feed: 'Filter feeder: oral cilia draw bacteria and small particles into the mouth', repro: 'Binary fission; the daughter grows a ring of cilia and swims off to settle elsewhere',
  desc: 'An upside-down bell on a spring-like stalk. When disturbed, the stalk coils in a few milliseconds, one of the fastest movements known in a single cell.',
  fun: ['Its stalk contraction is powered by calcium binding, not by the ATP-driven motors that move most cells.', 'The free-swimming daughter cell (telotroch) is a ring-shaped swimmer that sheds its cilia once it settles.', 'Colonies of related species, such as Carchesium, share branching stalks.'],
  note: 'The stalk is drawn shorter than real life so bell and stalk fit together at one scale; real stalks reach around a millimetre. The contraction is repeated every 9 seconds.' });

/* ---------- Trypanosoma ---------- */
function buildTrypanosoma(S) {
  const L = 5.2, NB = 56, NF = 70, bp = Array.from({ length: NB + 1 }, () => V()), fp = Array.from({ length: NF + 1 }, () => V());
  const rfB = s => .34 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(s, 0, 1), .75)), .7) + .02;
  const body = new Tube(NB, 16, M.shell(0xd9775c, .72, { clearcoat: .6, bumpScale: .2 })); S.add(body.mesh); body.mesh.renderOrder = 6;
  const fl = new Tube(NF, 8, PM.cuticle(0xb25a40, { roughness: .35 })); S.add(fl.mesh);
  const memG = new THREE.BufferGeometry(); const mp = new Float32Array((NF + 1) * 2 * 3); memG.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const mi = []; for (let i = 0; i < NF; i++) { const a = i * 2; mi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } memG.setIndex(mi);
  const mem = new THREE.Mesh(memG, new THREE.MeshPhysicalMaterial({ color: 0xefae90, transparent: true, opacity: .7, side: THREE.DoubleSide, roughness: .4, depthWrite: false })); mem.frustumCulled = false; S.add(mem);
  const nuc = S.mesh(G.sphere, M.grain(0x7d6bb4), { s: V(.26, .22, .22) }), kin = S.mesh(G.capsule, PM.dark(0x2f2a4a), { s: V(.1, .14, .1) });
  const pocket = S.mesh(G.sphere, PM.cuticle(0xf5efe6), { s: .06 });
  const mito = S.mesh(G.sphere, M.soft(0xd6a24c), { s: V(.18, .1, .1) });
  const bpos = (s, t, o) => o.set((s - .5) * L, .38 * (.4 + .9 * s) * Math.sin(TAU * 1.25 * s - 2.4 * t), .16 * Math.sin(TAU * 1.25 * s - 2.4 * t + 1.1));
  const A = V(), B = V(), Tn = V(), Nn = V(), Z = V(0, 0, 1);
  S.anim(t => {
    for (let i = 0; i <= NB; i++) bpos(i / NB, t, bp[i]);
    body.update(bp, s => rfB(s));
    let k = 0;
    for (let j = 0; j <= NF; j++) {
      const s = .13 + 1.2 * j / NF;
      if (s <= 1) { bpos(s, t, A); bpos(Math.min(1, s + .02), t, B); Tn.subVectors(B, A).normalize(); Nn.crossVectors(Tn, Z).normalize(); const r = rfB(s); fp[j].copy(A).addScaledVector(Nn, r * .95 + .035 + .06 * Math.sin(t * 5 + s * 24)); mp[k++] = A.x + Nn.x * r * .8; mp[k++] = A.y + Nn.y * r * .8; mp[k++] = A.z + Nn.z * r * .8; mp[k++] = fp[j].x; mp[k++] = fp[j].y; mp[k++] = fp[j].z; }
      else { bpos(1, t, A); bpos(.98, t, B); Tn.subVectors(A, B).normalize(); const d = s - 1, w = .1 * Math.sin(10 * d - 7 * t) * (d * 3); Nn.crossVectors(Tn, Z).normalize(); fp[j].copy(A).addScaledVector(Tn, d * 3.4).addScaledVector(Nn, w + .3 * rfB(1)); mp[k++] = fp[j].x; mp[k++] = fp[j].y; mp[k++] = fp[j].z; mp[k++] = fp[j].x; mp[k++] = fp[j].y; mp[k++] = fp[j].z; }
    }
    memG.attributes.position.needsUpdate = true; memG.computeVertexNormals(); memG.computeBoundingSphere();
    fl.update(fp, s => .028 * (1 - .6 * s));
    bpos(.52, t, nuc.position); bpos(.13, t, kin.position); kin.position.z += .0; bpos(.1, t, pocket.position); bpos(.3, t, mito.position); mito.position.y += .08;
  });
  S.part('Cell body', 'A spindle-shaped cell about 20 micrometres long, held in shape by a corset of microtubules under the membrane. A dense coat of one protein, the variant surface glycoprotein, covers the whole surface and is swapped to dodge the host\'s antibodies.', body.mesh, { shell: true });
  S.part('Flagellum', 'A single flagellum grows from a pocket near the rear and runs along the body, then continues beyond the front end. Its beat pulls the cell forward in a corkscrew motion.', fl.mesh);
  S.part('Undulating membrane', 'Where the flagellum is attached along the body, it pulls the cell membrane into a rippling fin. The ripples drive the cell through thick fluids such as blood.', mem);
  S.part('Nucleus', 'A single central nucleus with a prominent nucleolus holds the genome.', nuc);
  S.part('Kinetoplast and flagellar pocket', 'The kinetoplast is a dense disc of mitochondrial DNA, made of interlocked circles, found only in this group of parasites. It sits next to the basal body of the flagellum at the mouth of the flagellar pocket, where the cell takes up and releases material.', [kin, pocket]);
  S.part('Mitochondrion', 'A single branched mitochondrion runs the length of the cell. In the bloodstream form it is largely switched off because the parasite lives on glucose in the blood.', mito);
  const rb = rbcLathe(.78, 40, 48), rm = M.glass(0xd0484f, .6, { roughness: .35 }), rcs = new THREE.Group(); S.add(rcs);
  [[-1.9, -1.9, -1.6], [2.2, 1.9, -2.4], [.4, 2.4, 1.6], [-2.6, 1.7, 1.2]].forEach(([x, y, z], i) => S.mesh(rb, rm, { parent: rcs, p: V(x, y, z), r: [1.1 + i, .4 * i, .3 * i] }));
  S.part('Red blood cells (for scale)', 'Human red blood cells, about 7 micrometres across, drawn at the correct size relative to the parasite. African trypanosomes swim between them in the bloodstream.', rcs);
  S.anim(t => { rcs.rotation.y = t * .06; });
}
NEWBUILD.trypanosoma = buildTrypanosoma;
NEW_SPEC.push({ id: 'trypanosoma', cat: 'protozoa', name: 'Trypanosoma', latin: 'Trypanosoma brucei', size: 'about 20 µm, plus free flagellum', sizeUm: 20, U: 5.2, dist: 12,
  cls: 'Eukaryota · Discoba · Euglenozoa · Kinetoplastea', habitat: 'Blood and tissue fluids of mammals; tsetse fly gut', move: 'Corkscrew swimming driven by a flagellum and undulating membrane', feed: 'Heterotroph: takes up glucose from blood (bloodstream form)', repro: 'Binary fission in the host; sexual stages occur in the tsetse fly',
  desc: 'A slender blood parasite that swims by a rippling fin. It causes African sleeping sickness and is spread by tsetse flies.',
  fun: ['It keeps changing its surface coat, switching among thousands of gene copies, so the immune system never quite catches up.', 'The kinetoplast, a net of mitochondrial DNA, is a hallmark of the whole group.', 'Its glycolysis happens in specialised organelles called glycosomes.'],
  note: 'Red blood cells are drawn to scale. The wave pattern is stylised, and the interior organelles are simplified.' });

/* ---------- Plasmodium ---------- */
function buildPlasmodium(S) {
  const R = 1.35, rb = rbcLathe(R, 50, 56), rm = M.glass(0xcf4a52, .42, { roughness: .35, clearcoat: .6 });
  const r1 = new THREE.Group(); r1.position.set(-2.2, 0, 0); S.add(r1);
  const r1d = S.mesh(rb, rm, { parent: r1, ro: 5 });
  const ring = S.mesh(new THREE.TorusGeometry(.4, .075, 12, 36), M.soft(0x5a8fd0, { emissive: 0x1d3a66, emissiveIntensity: .25 }), { parent: r1, p: V(0, 0, 0), r: [Math.PI / 2, 0, 0] });
  const rn = S.mesh(G.sphere, PM.dark(0x3b2a6e), { parent: r1, p: V(.4, 0, 0), s: V(.13, .13, .13) });
  const vac = S.mesh(G.sphere, M.glass(0xffffff, .6), { parent: r1, p: V(0, 0, 0), s: V(.3, .05, .3), ro: 7 });
  const r2 = new THREE.Group(); r2.position.set(2.1, .2, 0); S.add(r2);
  const r2d = S.mesh(rb, M.glass(0xcf4a52, .32, { roughness: .35 }), { parent: r2, ro: 5 });
  const mero = new THREE.Group(); r2.add(mero); const mm = M.soft(0x4f7fc4, { emissive: 0x1b3260, emissiveIntensity: .2 }), NM = 14;
  for (let i = 0; i < NM; i++) { const d = fib(NM)[i], p = d.clone().multiplyScalar(.5); const m = S.mesh(G.capsule, mm, { parent: mero, p, s: V(.2, .2, .2) }); m.quaternion.copy(qFromUp(d)); m.scale.set(.2, .26, .2); S.mesh(G.sphere, PM.dark(0x3b2a6e), { parent: mero, p: d.clone().multiplyScalar(.42), s: .06 }); }
  const hz = new THREE.Group(); r2.add(hz); const hm = PM.dark(0x3a2418, { roughness: .6 }); for (let i = 0; i < 5; i++) S.mesh(G.sphereLo, hm, { parent: hz, p: V((i % 3 - 1) * .09, (i % 2 - .5) * .09, (i - 2) * .05), s: .09 });
  const free = new THREE.Group(); free.position.set(-.3, -2.5, 1.2); S.add(free);
  const fb = S.mesh(G.sphere, M.soft(0x4f7fc4, { emissive: 0x1b3260, emissiveIntensity: .2 }), { parent: free, s: V(.5, .3, .3) });
  const ap = S.mesh(G.cone, PM.cuticle(0xe9b35a), { parent: free, p: V(.45, 0, 0), s: V(.14, .3, .14), r: [0, 0, -Math.PI / 2] });
  const rho = S.mesh(G.sphere, M.soft(0xe9b35a), { parent: free, p: V(.2, 0, .05), s: V(.14, .06, .05) }), fn = S.mesh(G.sphere, PM.dark(0x3b2a6e), { parent: free, p: V(-.15, 0, 0), s: .1 });
  const sp = new THREE.Group(); sp.position.set(.5, 2.5, -.6); S.add(sp);
  const arc = new THREE.CatmullRomCurve3([V(-1, -.2, 0), V(-.5, .2, 0), V(.2, .27, 0), V(.8, 0, 0), V(1.1, -.4, 0)]);
  const spm = S.mesh(new THREE.TubeGeometry(arc, 24, .1, 10), M.soft(0x6b9ad8, { emissive: 0x1b3260, emissiveIntensity: .2 }), { parent: sp });
  S.part('Infected red blood cell', 'The parasite lives inside a human red blood cell, shown as a translucent biconcave disc. The cell is about 7 micrometres across. Infected cells become stickier and can cling to blood vessel walls.', [r1d, r2d], { shell: true });
  S.part('Ring-stage trophozoite', 'The early feeding stage looks like a signet ring under the microscope: a thin rim of cytoplasm around a food vacuole, with the nucleus as a dot on one side. It grows by digesting haemoglobin.', [ring, rn, vac]);
  S.part('Schizont (merozoites)', 'The mature stage divides several times into a rosette of new parasites called merozoites. When the red cell bursts, they are released together, producing the fever cycle of malaria.', mero);
  S.part('Haemozoin pigment', 'Digesting haemoglobin frees toxic haem, which the parasite locks away as dark crystals of haemozoin. Several anti-malarial drugs act on this step.', hz);
  S.part('Free merozoite', 'A merozoite is about 1.5 micrometres long. Its apical end holds rhoptries and other secretory organelles that help it attach to and enter a new red blood cell within seconds.', [fb, ap, rho, fn]);
  S.part('Sporozoite', 'A curved, motile stage injected by a mosquito. It glides in the blood to the liver, where it invades a liver cell and multiplies before the red-cell stage begins.', spm);
  S.anim(t => { r1.rotation.set(1 + .25 * Math.sin(t * .4), t * .22, 0); r2.rotation.set(.9, -t * .2, .3 * Math.sin(t * .3)); r1.position.y = .1 * Math.sin(t * .5); r2.position.y = .2 + .1 * Math.sin(t * .6); free.rotation.set(t * .5, 0, .4 * Math.sin(t * 2)); free.position.x = -.3 + .25 * Math.sin(t * .8); sp.rotation.set(0, t * .5, 0); sp.position.y = 2.5 + .12 * Math.sin(t * .7); mero.rotation.y = t * .3; });
}
NEWBUILD.plasmodium = buildPlasmodium;
NEW_SPEC.push({ id: 'plasmodium', cat: 'protozoa', name: 'Plasmodium', latin: 'Plasmodium falciparum', size: 'infected red cell about 7 µm', sizeUm: 7, U: 2.7, dist: 11,
  cls: 'Eukaryota · SAR · Apicomplexa · Aconoidasida', habitat: 'Human liver and red blood cells; Anopheles mosquito gut and glands', move: 'Intracellular stages are carried passively; sporozoites and merozoites glide', feed: 'Digests haemoglobin from the red blood cell (trophozoite)', repro: 'Asexual multiplication (schizogony) in humans; sexual reproduction in mosquitoes',
  desc: 'The malaria parasite, shown in several stages of its life in human blood: ring stage, dividing schizont, free merozoite and a mosquito-borne sporozoite.',
  fun: ['Malaria remains one of the deadliest infectious diseases, with hundreds of thousands of deaths each year, mostly of young children in Africa.', 'It has an apicoplast, a leftover plastid from an ancient algal ancestor, which is a drug target.', 'The fever comes in waves because many parasites burst out of their red cells at about the same time.'],
  note: 'This is a composite: stages that occur at different times are shown together. Merozoite number and organelle detail are simplified, and the free stages are enlarged relative to the red cells.' });

/* ---------- Tetrahymena ---------- */
function buildTetrahymena(S) {
  const L = 3.6, rf = u => .86 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(u, 0, 1), .78)), .7) * (1 - .3 * u) + .01;
  const bg = new THREE.Group(); S.add(bg);
  const body = S.mesh(latheBody(L, rf, 56, 36), M.shell(0xe6bb78, .4, { clearcoat: .6 }), { parent: bg, ro: 8 });
  S.part('Pellicle', 'A thin, flexible cell surface supported by rows of tiny sacs and microtubules. Each meridian row carries cilia, giving the cell a neat striped pattern.', body, { shell: true });
  const cl = lathePts(L, rf, 380, { rows: 19, u0: .08, u1: .97, seed: 6 }), cil = ciliaSet(S, PM.cuticle(0xf6ead2), cl.P, cl.N, { len: .2, r: .02, amp: .6, speed: 11, wave: 3.5, parent: bg });
  S.part('Cilia', 'Hundreds of cilia in longitudinal rows beat in travelling waves, pushing the cell along in a spiral. They also sweep bacteria toward the mouth.', cil);
  const oc = new THREE.Group(); bg.add(oc);
  S.mesh(G.sphere, PM.dark(0x7a4a22), { parent: oc, p: V(0, .98, .42), s: V(.2, .34, .12) });
  for (let i = 0; i < 3; i++) S.mesh(G.cone, PM.cuticle(0xf3ddb0), { parent: oc, p: V(-.18 + i * .09, 1.12, .52), s: V(.045, .38, .02), r: [-.3, 0, 0] });
  S.mesh(new THREE.TorusGeometry(.2, .02, 6, 16, 3.1), PM.cuticle(0xf3ddb0), { parent: oc, p: V(.14, .98, .5), r: [0, 0, Math.PI * .5] });
  S.part('Oral apparatus', 'The mouth sits at the pointed front. Three membranelles on one side and an undulating membrane on the other push bacteria into the oral cavity, where food vacuoles pinch off.', oc);
  const mac = S.mesh(G.sphere, M.grain(0xa88cc9), { parent: bg, p: V(0, -.1, -.05), s: V(.36, .4, .36) }), mic = S.mesh(G.sphere, PM.dark(0x3a2a62), { parent: bg, p: V(.24, -.12, -.05), s: .09 });
  S.part('Macronucleus and micronucleus', 'The large macronucleus runs everyday gene activity. The tiny micronucleus holds the germline genome and is used only for sexual exchange. Tetrahymena was the species used to discover telomerase.', [mac, mic]);
  const cv = S.mesh(G.sphere, M.glass(0xe6f4ff, .6), { parent: bg, p: V(.35, -1.2, .3), s: .2, ro: 7 });
  S.part('Contractile vacuole', 'A water pump near the rear. It fills and empties through a pore to keep osmotic water from swelling the cell.', cv);
  const tail = new Tube(24, 6, PM.cuticle(0xf6ead2)); S.add(tail.mesh, bg); const tp = Array.from({ length: 25 }, () => V());
  S.part('Caudal cilium', 'One longer, stiffer cilium trails from the rear and acts a little like a rudder.', tail.mesh);
  const fvs = new THREE.Group(); bg.add(fvs); const fm = PM.dark(0x7a9a52); for (let i = 0; i < 4; i++) S.mesh(G.sphere, fm, { parent: fvs, p: V(Math.cos(i * 1.9) * .35, -.55 + i * .22, Math.sin(i * 1.9) * .28), s: .12 });
  S.part('Food vacuoles', 'Bubbles of swallowed bacteria. Digestive enzymes break the food down, and the vacuoles circulate around the cell before waste is expelled.', fvs);
  S.anim(t => { for (let i = 0; i <= 24; i++) { const s = i / 24; tp[i].set(.15 * Math.sin(s * 6 - t * 9) * s, -L / 2 - s * .9, 0); } tail.update(tp, s => .022 * (1 - .6 * s)); bg.rotation.y = t * .9; bg.rotation.z = .12 * Math.sin(t * 1.7); bg.position.y = .06 * Math.sin(t * 1.1); });
}
NEWBUILD.tetrahymena = buildTetrahymena;
NEW_SPEC.push({ id: 'tetrahymena', cat: 'protozoa', name: 'Tetrahymena', latin: 'Tetrahymena thermophila', size: '40–60 µm', sizeUm: 50, U: 3.6, dist: 10,
  cls: 'Eukaryota · SAR · Ciliophora · Oligohymenophorea', habitat: 'Freshwater ponds and streams; widely kept in laboratories', move: 'Swims in a spiral using rows of cilia', feed: 'Heterotroph: swallows bacteria through the oral apparatus; can also absorb dissolved nutrients', repro: 'Binary fission; sexual conjugation among seven mating types',
  desc: 'A small pear-shaped ciliate that is a favourite model organism. Its neat rows of cilia and mouth at the pointed end set it apart from Paramecium.',
  fun: ['It has seven mating types rather than two sexes.', 'Work on this ciliate led to the discovery of telomerase, the enzyme that rebuilds chromosome ends (Nobel Prize, 2009).', 'It was also used to show that RNA can act as an enzyme.'],
  note: 'About one in four of the real cilia are drawn. Oral structures are simplified.' });

/* ---------- Didinium ---------- */
function buildDidinium(S) {
  const L = 3.0, rf = u => .98 * Math.pow(Math.sin(Math.PI * (.06 + .88 * u)), .38);
  const bg = new THREE.Group(); S.add(bg);
  const body = S.mesh(latheBody(L, rf, 48, 40), M.shell(0xd7a46a, .42, { clearcoat: .6 }), { parent: bg, ro: 8 });
  S.part('Barrel-shaped body', 'The cell is a rounded barrel about 100 micrometres long. Unlike most ciliates it has no body-wide coat of cilia; it relies on two bands, which makes it a fast, strong swimmer.', body, { shell: true });
  const bands = []; [.3, .62].forEach((u, k) => { const r = rf(u), P = [], N = []; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU; P.push(V(Math.cos(a) * r, (u - .5) * L, Math.sin(a) * r)); N.push(V(Math.cos(a), 0, Math.sin(a))); } bands.push(ciliaSet(S, PM.cuticle(0xf0dcb8), P, N, { len: .34, r: .03, amp: .55, speed: 10, wave: 0, axis: V(0, 1, 0), parent: bg, seed: 8 + k })); });
  S.part('Ciliary girdles', 'Two circular bands of long cilia drive the swimming. They beat in a coordinated way so the cell spins as it moves and can hunt rapidly through open water.', bands);
  const pr = new THREE.Group(); bg.add(pr); const py = L / 2 - .02;
  const prb = S.mesh(new THREE.CylinderGeometry(.18, .42, .8, 24, 1, true), M.shell(0xe6b070, .7, { side: THREE.DoubleSide }), { parent: pr, p: V(0, py + .4, 0) });
  S.mesh(new THREE.TorusGeometry(.19, .04, 8, 24), PM.cuticle(0x7a4a22), { parent: pr, p: V(0, py + .82, 0), r: [Math.PI / 2, 0, 0] });
  const tx = inst(G.cylLo, PM.cuticle(0x5a3a1a), 16); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; _o.position.set(Math.cos(a) * .2, py + .9, Math.sin(a) * .2); _o.quaternion.copy(qFromUp(V(Math.cos(a) * .5, 1, Math.sin(a) * .5))); _o.scale.set(.015, .32, .015); _o.updateMatrix(); tx.setMatrixAt(i, _o.matrix); } pr.add(tx);
  S.part('Proboscis and mouth', 'A cone at the front ends in the mouth, rimmed with toxicysts that can be fired into prey. The mouth can stretch very wide to swallow a Paramecium, which is often as large as the Didinium itself.', [prb, tx]);
  const mac = S.mesh(new THREE.TorusGeometry(.5, .17, 10, 24, 4.9), M.grain(0xa88cc9), { parent: bg, p: V(0, -.1, 0), r: [Math.PI / 2, 0, .5] }), mic = S.mesh(G.sphere, PM.dark(0x3a2a62), { parent: bg, p: V(.6, -.1, .05), s: .1 });
  S.part('Macronucleus', 'A horseshoe-shaped nucleus holds many gene copies. A micronucleus close by is used for sexual reproduction.', [mac, mic]);
  const pg = new THREE.Group(); S.add(pg), pg.position.set(0, 4.6, 0);
  const pbody = S.mesh(G.sphere, M.shell(0x8aa6a8, .55, { clearcoat: .5 }), { parent: pg, s: V(.55, 1.05, .55), ro: 9 });
  const pn = S.mesh(G.sphere, M.grain(0x9a86b8), { parent: pg, s: V(.2, .26, .2) }), pc = ciliaSet(S, PM.cuticle(0xe8eeee), ...(() => { const s = spherePts(80, .55, 1.05, .55); return [s.P, s.N]; })(), { len: .14, r: .015, amp: .6, speed: 11, wave: 2, parent: pg });
  S.part('Prey (Paramecium)', 'A Paramecium swims into range. Didinium paralyses it with toxicysts, attaches, and swallows it whole. The prey is drawn here at about half its true size relative to the predator.', [pbody, pn, pc]);
  const A = V(0, 4.3, .2), Bp = V(0, py + 1.0, 0), Cp = V(0, 0, 0);
  S.anim(t => {
    const k = cycle(t, 16), e1 = sstep(0, .38, k), e2 = sstep(.5, .78, k), e3 = sstep(.9, 1, k);
    pg.position.lerpVectors(A.clone().add(V(1.6 * (1 - e1), 1.2 * (1 - e1), 0)), Bp, e1); if (e2 > 0) pg.position.lerpVectors(Bp, Cp, e2);
    pg.rotation.z = (1 - e1) * .9 + (Math.PI * .5 * 0); pg.rotation.z = lerp(.9, 0, e1);
    const sc = lerp(1, .55, e2) * (1 - e3 * .6); pg.scale.set(sc, sc * lerp(1, 1.1, e2), sc); pg.visible = e3 < .98;
    bg.rotation.y = t * .6; bg.rotation.z = .06 * Math.sin(t * 1.3);
  });
}
NEWBUILD.didinium = buildDidinium;
NEW_SPEC.push({ id: 'didinium', cat: 'protozoa', name: 'Didinium', latin: 'Didinium nasutum', size: '80–200 µm', sizeUm: 120, U: 3.0, dist: 12,
  cls: 'Eukaryota · SAR · Ciliophora · Litostomatea', habitat: 'Freshwater ponds and ditches, where Paramecium lives', move: 'Fast spiral swimming with two bands of cilia', feed: 'Predator: paralyses Paramecium with toxicysts and swallows it whole', repro: 'Binary fission; forms a resting cyst when prey runs out',
  desc: 'A barrel-shaped hunter of other ciliates. Two rings of cilia power it toward prey, and a proboscis at the front stings and swallows it.',
  fun: ['In classic experiments, Didinium and Paramecium were used to show cycles of predator and prey numbers; the predator often wiped out its prey and then died out itself.', 'It can swallow a Paramecium as large as itself.', 'When starved, it forms a protective cyst and waits for prey to return.'],
  note: 'The prey is shown smaller than real so both fit at one scale. The capture cycle repeats every 16 seconds.' });
