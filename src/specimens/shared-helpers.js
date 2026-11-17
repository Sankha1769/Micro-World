/**
 * Helpers shared by the specimen modules (lathe bodies, cilia sets, rods, plant materials)
 * and the registries `ADDITIONAL_SPECIMENS` / `ADDITIONAL_BUILDERS` that each specimen module
 * adds its library entries and builder functions to.
 */

import * as THREE from 'three';
import {
  sharedGeometries,
  createInstancedMesh,
  perpendicularDirection,
  setInstanceTransform,
} from '../engine/geometry-helpers.js';
import { materialFactory } from '../engine/materials.js';
import {
  TAU,
  vec3,
  vec2,
  fibonacciSphere,
  lerp,
  quaternionFromUp,
  createSeededRandom,
  smoothStep,
} from '../engine/math.js';

/* ================= shared helpers for the expanded library ================= */
export const ADDITIONAL_SPECIMENS = [];
export const ADDITIONAL_BUILDERS = {};
export const UP_AXIS = vec3(0, 1, 0);
export const _q1 = new THREE.Quaternion();
sharedGeometries.cilium = (() => {
  const g = new THREE.CylinderGeometry(0.35, 1, 1, 5, 1, true);
  g.translate(0, 0.5, 0);
  return g;
})();
sharedGeometries.cone = (() => {
  const g = new THREE.ConeGeometry(1, 1, 8, 1);
  g.translate(0, 0.5, 0);
  return g;
})();
sharedGeometries.disc = (() => {
  const g = new THREE.CylinderGeometry(1, 1, 1, 24);
  return g;
})();

/* body of revolution about Y: radius rf(u), u from 0 (bottom, y = -L/2) to 1 (top) */
export function latheBody(L, radiusAt, nU = 56, segmentCount = 36) {
  const points = [];
  for (let i = 0; i <= nU; i++) {
    const u = i / nU;
    points.push(vec2(Math.max(radiusAt(u), 0.0008), (u - 0.5) * L));
  }
  return new THREE.LatheGeometry(points, segmentCount);
}
/* surface points + outward normals on a lathe body. rows > 0 puts them on meridian rows */
export function lathePoints(
  L,
  radiusAt,
  n,
  { u0 = 0.03, u1 = 0.97, rows = 0, seed = 5, fx = 1, fz = 1 } = {},
) {
  const random = createSeededRandom(seed);
  const P = [];
  const N = [];
  for (let i = 0; i < n; i++) {
    let u;
    let ph;
    if (rows) {
      const row = i % rows;
      const k = Math.floor(i / rows);
      const per = Math.ceil(n / rows);
      u = lerp(u0, u1, (k + 0.5) / per);
      ph = (row / rows) * TAU + ((k % 2) * 0.5 * TAU) / rows;
    } else {
      u = lerp(u0, u1, random());
      ph = random() * TAU;
    }
    const e = 0.012;
    const ua = Math.max(0, u - e);
    const ub = Math.min(1, u + e);
    const slope = (radiusAt(ub) - radiusAt(ua)) / ((ub - ua) * L);
    const r = radiusAt(u);
    P.push(vec3(r * Math.cos(ph) * fx, (u - 0.5) * L, r * Math.sin(ph) * fz));
    N.push(vec3(Math.cos(ph) / fx, -slope, Math.sin(ph) / fz).normalize());
  }
  return { P, N };
}
/* points on a sphere/ellipsoid */
export function spherePoints(n, rx, ry = rx, rz = rx) {
  const P = [];
  const N = [];
  fibonacciSphere(n).forEach((d) => {
    P.push(vec3(d.x * rx, d.y * ry, d.z * rz));
    N.push(vec3(d.x / rx, d.y / ry, d.z / rz).normalize());
  });
  return { P, N };
}

/* a field of beating cilia (instanced). Returns the mesh; animation is registered on S */
export function createCiliaSet(
  specimen,
  material,
  P,
  N,
  {
    len = 0.12,
    r = 0.012,
    amp = 0.7,
    speed = 8,
    wave = 4,
    axis = vec3(0, 1, 0),
    jit = 0.3,
    seed = 3,
    parent = null,
  } = {},
) {
  const n = P.length;
  const mesh = createInstancedMesh(sharedGeometries.cilium, material, n);
  const random = createSeededRandom(seed);
  const ph = [];
  const L = [];
  const Tg = [];
  for (let i = 0; i < n; i++) {
    ph.push(random() * TAU * 0.25 + P[i].dot(axis) * wave);
    L.push(len * (1 - jit * random()));
    const t = axis.clone().addScaledVector(N[i], -axis.dot(N[i]));
    if (t.lengthSq() < 1e-4) {
      t.copy(perpendicularDirection(N[i]));
    }
    Tg.push(t.normalize());
  }
  const sc = vec3(r, 1, r);
  const d = vec3();
  const upd = (t) => {
    for (let i = 0; i < n; i++) {
      const a = amp * Math.sin(t * speed - ph[i]) + 0.3 * amp;
      d.copy(N[i]).multiplyScalar(Math.cos(a)).addScaledVector(Tg[i], Math.sin(a));
      sc.y = L[i];
      setInstanceTransform(mesh, i, P[i], _q1.setFromUnitVectors(UP_AXIS, d), sc);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  upd(0);
  specimen.anim(upd);
  specimen.add(mesh, parent);
  return mesh;
}
/* a flagellum-like wave tube between a start point and direction; returns {mesh, update} */

/* chains of spores/beads growing out of base points along directions */

/* a straight tapered rod between two points (opaque or shell) */
export function createRod(a, b, r0, r1, material, seg = 8) {
  const g = new THREE.CylinderGeometry(r1, r0, 1, seg, 1);
  g.translate(0, 0.5, 0);
  const mesh = new THREE.Mesh(g, material);
  const d = b.clone().sub(a);
  mesh.position.copy(a);
  mesh.scale.set(1, d.length(), 1);
  mesh.quaternion.copy(quaternionFromUp(d));
  return mesh;
}
/* sample a tube path as an array of points */

/* register a part helper that groups many objects */

/* pigment-friendly soft materials for a light background */
export const plantMaterials = {
  cuticle: (c, o = {}) => materialFactory.soft(c, { roughness: 0.55, clearcoat: 0.45, ...o }),
  mem: (c, op = 0.42, o = {}) =>
    materialFactory.shell(c, op, { roughness: 0.35, bumpScale: 0.25, ...o }),
  dark: (c, o = {}) => materialFactory.soft(c, { roughness: 0.4, clearcoat: 0.6, ...o }),
};

/* ================= NEW PROTOZOA ================= */
export const cyclePhase = (t, T) => (t % T) / T;

/* piecewise-smooth radius profile from a control table [[u, r], ...] */
export const createProfileCurve = (tbl) => (u) => {
  for (let i = 1; i < tbl.length; i++) {
    if (u <= tbl[i][0]) {
      const a = tbl[i - 1];
      const b = tbl[i];
      return lerp(a[1], b[1], smoothStep(a[0], b[0], u));
    }
  }
  return tbl[tbl.length - 1][1];
};
