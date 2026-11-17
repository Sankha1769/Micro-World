import * as THREE from 'three';

/* ==========================================================================
   Constants
   ========================================================================== */

/** A full turn in radians. */
export const TAU = Math.PI * 2;

/* ==========================================================================
   Scalar helpers
   ========================================================================== */

/**
 * Restricts a value to the range [minimum, maximum].
 *
 * @param {number} value
 * @param {number} minimum
 * @param {number} maximum
 * @returns {number}
 */
export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

/**
 * Linear interpolation between two values.
 *
 * @param {number} start
 * @param {number} end
 * @param {number} amount 0 returns `start`, 1 returns `end`.
 * @returns {number}
 */
export const lerp = (start, end, amount) => start + (end - start) * amount;

/**
 * Hermite smooth-step: 0 below `edgeStart`, 1 above `edgeEnd`, eased in between.
 *
 * @param {number} edgeStart
 * @param {number} edgeEnd
 * @param {number} value
 * @returns {number}
 */
export const smoothStep = (edgeStart, edgeEnd, value) => {
  const progress = clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1);
  return progress * progress * (3 - 2 * progress);
};

/* ==========================================================================
   Vector constructors
   ========================================================================== */

/**
 * @param {number} [x]
 * @param {number} [y]
 * @param {number} [z]
 * @returns {THREE.Vector3}
 */
export const vec3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/**
 * @param {number} x
 * @param {number} y
 * @returns {THREE.Vector2}
 */
export const vec2 = (x, y) => new THREE.Vector2(x, y);

/* ==========================================================================
   Random numbers and noise
   ========================================================================== */

/**
 * Creates a deterministic pseudo-random generator (mulberry32).
 *
 * Specimen models depend on this being reproducible: the same seed must always
 * yield the same sequence, so the order of calls to the returned function is
 * part of a model's identity.
 *
 * @param {number} seed
 * @returns {() => number} Function returning a float in [0, 1).
 */
export function createSeededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hashes an integer lattice point to a pseudo-random value in [0, 1).
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number}
 */
const hashLatticePoint = (x, y, z) => {
  const scrambled = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return scrambled - Math.floor(scrambled);
};

/**
 * 3D value noise: hashed lattice values blended with smooth (cubic) weights.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number} Noise in [-1, 1].
 */
export function valueNoise3D(x, y, z) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const cellZ = Math.floor(z);

  const fractionX = x - cellX;
  const fractionY = y - cellY;
  const fractionZ = z - cellZ;

  const weightX = fractionX * fractionX * (3 - 2 * fractionX);
  const weightY = fractionY * fractionY * (3 - 2 * fractionY);
  const weightZ = fractionZ * fractionZ * (3 - 2 * fractionZ);

  const corner = (offsetX, offsetY, offsetZ) =>
    hashLatticePoint(cellX + offsetX, cellY + offsetY, cellZ + offsetZ);

  const nearFaceLower = lerp(corner(0, 0, 0), corner(1, 0, 0), weightX);
  const nearFaceUpper = lerp(corner(0, 1, 0), corner(1, 1, 0), weightX);
  const nearFace = lerp(nearFaceLower, nearFaceUpper, weightY);

  const farFaceLower = lerp(corner(0, 0, 1), corner(1, 0, 1), weightX);
  const farFaceUpper = lerp(corner(0, 1, 1), corner(1, 1, 1), weightX);
  const farFace = lerp(farFaceLower, farFaceUpper, weightY);

  return lerp(nearFace, farFace, weightZ) * 2 - 1;
}

/**
 * Three octaves of value noise (weights 0.6 / 0.3 / 0.1).
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number}
 */
export const fractalNoise3D = (x, y, z) =>
  valueNoise3D(x, y, z) * 0.6 +
  valueNoise3D(x * 2.1, y * 2.1, z * 2.1) * 0.3 +
  valueNoise3D(x * 4.3, y * 4.3, z * 4.3) * 0.1;

/* ==========================================================================
   Point distributions and orientation
   ========================================================================== */

/**
 * Evenly spaced points on the unit sphere (Fibonacci / golden-angle spiral).
 *
 * @param {number} pointCount
 * @returns {THREE.Vector3[]}
 */
export function fibonacciSphere(pointCount) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < pointCount; index++) {
    const y = 1 - ((index + 0.5) / pointCount) * 2;
    const ringRadius = Math.sqrt(1 - y * y);
    const azimuth = goldenAngle * index;
    points.push(vec3(Math.cos(azimuth) * ringRadius, y, Math.sin(azimuth) * ringRadius));
  }

  return points;
}

/**
 * Rotation that carries the +Y axis onto the given direction.
 *
 * @param {THREE.Vector3} direction Need not be normalised.
 * @returns {THREE.Quaternion}
 */
export const quaternionFromUp = (direction) =>
  new THREE.Quaternion().setFromUnitVectors(vec3(0, 1, 0), direction.clone().normalize());

/**
 * Uniformly distributed unit vector.
 *
 * @param {() => number} random Generator returning floats in [0, 1).
 * @returns {THREE.Vector3}
 */
export const randomDirection = (random) => {
  const z = random() * 2 - 1;
  const azimuth = random() * TAU;
  const ringRadius = Math.sqrt(1 - z * z);
  return vec3(ringRadius * Math.cos(azimuth), ringRadius * Math.sin(azimuth), z);
};

/**
 * Uniformly distributed point inside the unit ball (rejection sampling).
 *
 * @param {() => number} random Generator returning floats in [0, 1).
 * @returns {THREE.Vector3}
 */
export const randomPointInUnitBall = (random) => {
  for (;;) {
    const candidate = vec3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1);

    if (candidate.lengthSq() <= 1) {
      return candidate;
    }
  }
};
