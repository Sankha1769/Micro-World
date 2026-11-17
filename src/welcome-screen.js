import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ==========================================================================
   DNA welcome screen
   ========================================================================== */

/**
 * Creates the rotating-DNA welcome screen.
 *
 * Self-contained: it owns its renderer and scene, is driven by the application's single
 * animation loop (no second loop is started) and disposes everything it allocated when it
 * finishes.
 *
 * @param {object} opts
 * @param {() => void} [opts.onLeave] Called when the leave transition begins.
 * @param {() => void} [opts.onDone] Called once the screen has been removed.
 * @returns {{ update: (now: number, deltaTime: number) => void, leaving: boolean, done: boolean }|null}
 *   Null when the intro markup is not present in the page.
 */
export function createIntro(opts) {
  const root = document.getElementById('intro');
  const cv = document.getElementById('introCv');
  if (!root || !cv) {
    return null;
  }
  let ren;
  try {
    ren = new THREE.WebGLRenderer({
      canvas: cv,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    root.classList.add('gone');
    return null;
  }
  const api = { leaving: false, done: false, update: null };
  ren.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  ren.setClearColor(0x000000, 0);
  ren.toneMapping = THREE.ACESFilmicToneMapping;
  ren.toneMappingExposure = 1.08;
  ren.shadowMap.enabled = true;
  ren.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(ren);
  const envRT = pm.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  pm.dispose();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const disposables = [envRT];
  const track = (o) => {
    disposables.push(o);
    return o;
  };

  /* ---------- DNA geometry: smooth, glossy B-DNA ----------
     10.5 bp/turn; the strand offset (129 deg) gives the wide major and narrow minor groove. Backbones are continuous smooth tubes, sugars and phosphates are
     polished beads, and each base pair is two rounded rods (A-T / G-C, purines thicker) that meet in the middle. */
  const N = 28;
  const RISE = 0.335;
  const TWIST = (Math.PI * 2) / 10.5;
  const RAD = 1.2;
  const OFF = 2.26;
  const H = (N - 1) * RISE;
  const dna = new THREE.Group();
  const helix = new THREE.Group();
  scene.add(dna);
  dna.add(helix);
  const rnd = (() => {
    let s = 20531;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  })();
  const COL = { A: 0xc98770, T: 0xd5aa60, G: 0x789477, C: 0x9a86a8 }; // terracotta, amber, sage, muted mauve
  const material = (c, o = {}) =>
    track(
      new THREE.MeshPhysicalMaterial(
        Object.assign(
          {
            color: c,
            roughness: 0.22,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.12,
            envMapIntensity: 1.15,
          },
          o,
        ),
      ),
    );
  const UPV = new THREE.Vector3(0, 1, 0);
  const m4 = new THREE.Matrix4();
  const q0 = new THREE.Quaternion();
  const vS = new THREE.Vector3();
  const col = new THREE.Color();
  const pol = (r, a, y) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
  const add = (geometry, m, n) => {
    const im = new THREE.InstancedMesh(geometry, m, n);
    im.castShadow = true;
    im.receiveShadow = true;
    helix.add(im);
    return im;
  };
  const sphG = track(new THREE.SphereGeometry(1, 40, 28));
  const cylG = track(new THREE.CylinderGeometry(1, 1, 1, 32, 1, true));
  const SA = [];
  const SB = [];

  for (let i = 0; i < N; i++) {
    const y = (i - (N - 1) / 2) * RISE;
    const a = i * TWIST;
    SA.push(pol(RAD, a, y));
    SB.push(pol(RAD, a + OFF, y));
  }
  /* continuous smooth backbone tubes through the sugar positions */
  const bbM = material(0xa7b79b, { roughness: 0.26 });
  [SA, SB].forEach((pts) => {
    const g = track(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5),
        N * 14,
        0.075,
        20,
        false,
      ),
    );
    const mesh = new THREE.Mesh(g, bbM);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    helix.add(mesh);
  });
  /* sugar beads on the strand, phosphate beads half a step along */
  const sug = add(sphG, material(0xe9efe0, { roughness: 0.2 }), N * 2);
  const pho = add(sphG, material(0xc98770, { roughness: 0.2 }), (N - 1) * 2);
  const put = (im, k, p, r) => {
    m4.compose(p, q0, vS.set(r, r, r));
    im.setMatrixAt(k, m4);
  };
  const cA = new THREE.CatmullRomCurve3(SA, false, 'catmullrom', 0.5);
  const cB = new THREE.CatmullRomCurve3(SB, false, 'catmullrom', 0.5);
  for (let i = 0; i < N; i++) {
    put(sug, i * 2, SA[i], 0.19);
    put(sug, i * 2 + 1, SB[i], 0.19);
  }
  for (let i = 0; i < N - 1; i++) {
    const u = (i + 0.5) / (N - 1);
    put(pho, i * 2, cA.getPoint(u), 0.12);
    put(pho, i * 2 + 1, cB.getPoint(u), 0.12);
  }
  /* base pairs: rounded rods, purines (A, G) thicker; end caps are spheres */
  const rods = add(cylG, material(0xffffff, { roughness: 0.24, side: THREE.DoubleSide }), N * 2);
  const caps = add(sphG, material(0xffffff, { roughness: 0.24 }), N * 2);
  const kinds = [
    ['A', 'T'],
    ['T', 'A'],
    ['G', 'C'],
    ['C', 'G'],
  ];
  const isPur = (b) => b === 'A' || b === 'G';
  const GAP = 0.15;
  for (let i = 0; i < N; i++) {
    const [b1, b2] = kinds[Math.floor(rnd() * 4)];
    const A = SA[i];
    const B = SB[i];
    const d = new THREE.Vector3().subVectors(B, A);
    const L = d.length();
    const dir = d.clone().normalize();
    const span = L - GAP * 2;
    const f1 = isPur(b1) ? 0.56 : 0.44;
    const l1 = span * f1;
    const l2 = span - l1;
    const qd = new THREE.Quaternion().setFromUnitVectors(UPV, dir);
    const seg = (k, start, len, b, sg) => {
      const r = isPur(b) ? 0.115 : 0.085;
      const mid = start.clone().addScaledVector(dir, (sg * len) / 2);
      m4.compose(mid, qd, vS.set(r, len, r));
      rods.setMatrixAt(k, m4);
      rods.setColorAt(k, col.setHex(COL[b]));
      const end = start.clone().addScaledVector(dir, sg * len);
      put(caps, k, end, r);
      caps.setColorAt(k, col.setHex(COL[b]));
    };
    const s1 = A.clone().addScaledVector(dir, GAP);
    const s2 = B.clone().addScaledVector(dir, -GAP);
    seg(i * 2, s1, l1, b1, 1);
    seg(i * 2 + 1, s2, l2, b2, -1);
  }
  [rods, caps, sug, pho].forEach((im) => {
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) {
      im.instanceColor.needsUpdate = true;
    }
  });
  /* ---------- light ---------- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e1d2, 0.85));
  const key = new THREE.DirectionalLight(0xfff6e8, 2.1);
  key.position.set(5, 9, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = H / 2 + 1;
  key.shadow.camera.bottom = -H / 2 - 1;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.bias = -0.0006;
  key.shadow.radius = 4;
  const rim = new THREE.DirectionalLight(0xe8f0e2, 1.0);
  rim.position.set(-7, 2, -6);
  scene.add(key, rim, key.target);

  /* ---------- drifting particles ---------- */
  const NP = 70;
  const pPos = new Float32Array(NP * 3);
  const pSeed = [];
  for (let i = 0; i < NP; i++) {
    pSeed.push({
      x: (rnd() - 0.5) * 26,
      y: (rnd() - 0.5) * 15,
      z: -3 - rnd() * 9,
      sp: 0.15 + rnd() * 0.35,
      ph: rnd() * 6.28,
    });
  }
  const tc = document.createElement('canvas');
  tc.width = 64;
  tc.height = 64;
  {
    const x = tc.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
  }
  const tex = track(new THREE.CanvasTexture(tc));
  const pGeo = track(new THREE.BufferGeometry());
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pCol = new Float32Array(NP * 3);
  const pal = [0x789477, 0xc98770, 0xd5aa60, 0x9a86a8].map((h) => new THREE.Color(h));
  for (let i = 0; i < NP; i++) {
    const c = pal[i % 4];
    pCol.set([c.r, c.g, c.b], i * 3);
  }
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const pMat = track(
    new THREE.PointsMaterial({
      size: 0.5,
      map: tex,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ---------- sizing ---------- */
  let vh = 1;
  let frac = 0.6;
  function resize() {
    const w = root.clientWidth || innerWidth;
    const hh = root.clientHeight || innerHeight;
    ren.setSize(w, hh, false);
    cam.aspect = w / hh;
    // Share of the screen height that the helix fills.
    if (hh < 560) {
      frac = 0.7;
    } else if (w / hh < 0.8) {
      frac = 0.54;
    } else {
      frac = 0.64;
    }
    cam.position.set(0, 0, 0);
    const dist = (H + 0.6) / frac / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    cam.userData.dist = dist;
    vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();

  /* ---------- interaction: drag to rotate, resume auto-spin afterwards ---------- */
  let yaw = 0;
  let tilt = 0.22;
  let vel = 0;
  let dragging = false;
  let lx = 0;
  let ly = 0;
  let idleT = 0;
  const spin = 0.42;
  let hintOff = false;
  const down = (e) => {
    if (e.target.closest('button') || api.leaving) {
      return;
    }
    dragging = true;
    lx = e.clientX;
    ly = e.clientY;
    vel = 0;
    cv.classList.add('drag');
    try {
      cv.setPointerCapture(e.pointerId);
    } catch {
      /* not supported: ignore */
    }
  };
  const move = (e) => {
    if (!dragging) {
      return;
    }
    const dx = e.clientX - lx;
    const dy = e.clientY - ly;
    lx = e.clientX;
    ly = e.clientY;
    yaw += dx * 0.011;
    vel = dx * 0.011 * 60;
    tilt = THREE.MathUtils.clamp(tilt + dy * 0.006, -0.6, 0.9);
    if (!hintOff) {
      hintOff = true;
      document.getElementById('inHint').classList.add('off');
    }
  };
  const up = () => {
    dragging = false;
    cv.classList.remove('drag');
    idleT = 0;
  };
  cv.addEventListener('pointerdown', down);
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);

  /* ---------- sound (off by default): quiet ambient chord ---------- */
  let ac = null;
  let master = null;
  const sBtn = document.getElementById('inSound');
  function setSound(on) {
    try {
      if (on && !ac) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) {
          return;
        }
        ac = new C();
        master = ac.createGain();
        master.gain.value = 0;
        master.connect(ac.destination);
        [
          [110, 0.5],
          [164.81, 0.32],
          [220, 0.22],
          [329.63, 0.12],
        ].forEach(([f, g], i) => {
          const o = ac.createOscillator();
          const gn = ac.createGain();
          const l = ac.createOscillator();
          const lg = ac.createGain();
          o.type = 'sine';
          o.frequency.value = f;
          gn.gain.value = g * 0.18;
          l.frequency.value = 0.07 + i * 0.031;
          lg.gain.value = g * 0.06;
          l.connect(lg);
          lg.connect(gn.gain);
          o.connect(gn);
          gn.connect(master);
          o.start();
          l.start();
        });
      }
      if (ac) {
        ac.resume();
        master.gain.setTargetAtTime(on ? 1 : 0, ac.currentTime, on ? 0.8 : 0.25);
      }
      sBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      sBtn.textContent = on ? 'Sound on' : 'Sound off';
    } catch {
      /* not supported: ignore */
    }
  }
  const sOn = () => sBtn.getAttribute('aria-pressed') === 'true';
  sBtn.addEventListener('click', () => setSound(!sOn()));
  const fsBtn = document.getElementById('inFs');
  fsBtn.addEventListener('click', () => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        const p =
          document.documentElement.requestFullscreen &&
          document.documentElement.requestFullscreen();
        if (p && p.catch) {
          p.catch(() => {});
        }
      }
    } catch {
      /* not supported: ignore */
    }
  });
  const fsSync = () => {
    fsBtn.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  };
  document.addEventListener('fullscreenchange', fsSync);

  /* ---------- enter / leave ---------- */
  const enterBtn = document.getElementById('inEnter');
  let leaveT = 0;
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  function leave() {
    if (api.leaving) {
      return;
    }
    api.leaving = true;
    leaveT = performance.now();
    root.classList.add('leaving');
    if (ac && master) {
      master.gain.setTargetAtTime(0, ac.currentTime, 0.3);
    }
    if (opts.onLeave) {
      opts.onLeave();
    }
  }
  enterBtn.addEventListener('click', leave);
  const onKey = (e) => {
    if (
      !api.leaving &&
      !api.done &&
      (e.key === 'Enter' || e.key === ' ') &&
      document.activeElement === document.body
    ) {
      e.preventDefault();
      leave();
    }
  };
  addEventListener('keydown', onKey, true);

  function finish() {
    if (api.done) {
      return;
    }
    api.done = true;
    api.update = null;
    ro.disconnect();
    cv.removeEventListener('pointerdown', down);
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
    removeEventListener('keydown', onKey, true);
    document.removeEventListener('fullscreenchange', fsSync);
    scene.traverse((o) => {
      if (o.isMesh || o.isPoints) {
        o.geometry && o.geometry.dispose();
      }
      if (o.isInstancedMesh) {
        o.dispose();
      }
    });
    disposables.forEach((d) => d.dispose && d.dispose());
    scene.environment = null;
    ren.dispose();
    try {
      ren.forceContextLoss();
    } catch {
      /* not supported: ignore */
    }
    if (ac) {
      try {
        ac.close();
      } catch {
        /* not supported: ignore */
      }
      ac = null;
    }
    root.classList.add('gone');
    root.remove();
    if (opts.onDone) {
      opts.onDone();
    }
  }

  /* ---------- per-frame update (called from the app's loop) ---------- */
  let t = 0;
  api.update = function (now, dt) {
    if (api.done) {
      return;
    }
    t += dt;
    if (!dragging) {
      idleT += dt;
      vel *= Math.pow(0.04, dt);
      yaw += (vel + spin * (idleT > 1.2 ? 1 : 0) * Math.min(1, (idleT - 1.2) / 1.5)) * dt;
      if (Math.abs(vel) < 0.05 || idleT > 1.5) {
        tilt += (0.22 - tilt) * Math.min(1, dt * 1.6);
      }
    }
    let sc = 1;
    let lift = 0;
    let fast = 0;
    if (api.leaving) {
      const k = Math.min(1, (performance.now() - leaveT) / 1500);
      const e = ease(k);
      sc = 1 - 0.93 * e;
      lift = e * vh * 0.12;
      fast = e * 2.4;
      yaw += fast * Math.min(dt, 0.05);
      if (k >= 1) {
        finish();
        return;
      }
    }
    dna.position.set(0, vh * 0.035 + Math.sin(t * 0.8) * 0.14 + lift, -cam.userData.dist); // float; scene is built around the camera origin
    dna.rotation.set(tilt + Math.sin(t * 0.35) * 0.035, 0, Math.sin(t * 0.27) * 0.02);
    helix.rotation.y = yaw;
    dna.scale.setScalar(sc);
    cam.position.set(Math.sin(t * 0.17) * 0.7, Math.sin(t * 0.13) * 0.35, 0);
    cam.lookAt(cam.position.x * 0.3, 0, -cam.userData.dist);
    key.target.position.copy(dna.position);
    key.position.copy(dna.position).add(new THREE.Vector3(5, 9, 8));
    rim.position.copy(dna.position).add(new THREE.Vector3(-7, 2, -6));
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < NP; i++) {
      const s = pSeed[i];
      arr[i * 3] = s.x + Math.sin(t * s.sp + s.ph) * 0.9;
      arr[i * 3 + 1] = s.y + Math.sin(t * s.sp * 0.8 + s.ph * 1.7) * 0.7 + Math.sin(t * 0.1) * 0.4;
      arr[i * 3 + 2] = -cam.userData.dist + s.z;
    }
    pGeo.attributes.position.needsUpdate = true;
    ren.render(scene, cam);
  };
  return api;
}
