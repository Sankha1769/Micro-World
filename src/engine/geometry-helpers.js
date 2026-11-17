import * as THREE from 'three';
import { TAU, vec3, lerp, quaternionFromUp } from './math.js';

/* ==========================================================================
   Shared geometries and the cross-section clipping plane
   ========================================================================== */

/**
 * Unit-sized geometries reused (and scaled) by many specimens to save memory.
 * They are never disposed with a specimen.
 */
export const sharedGeometries = {
  sphere: new THREE.SphereGeometry(1, 32, 24),
  sphereLo: new THREE.SphereGeometry(1, 12, 8),
  sphereMid: new THREE.SphereGeometry(1, 20, 14),
  capsule: new THREE.CapsuleGeometry(0.5, 1, 8, 20),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  cylLo: new THREE.CylinderGeometry(1, 1, 1, 6),
};

/** The plane that the "section" tool moves through the specimen. */
export const SECTION_CLIP_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e4);
export const SECTION_CLIP_PLANES = [SECTION_CLIP_PLANE];

/* ==========================================================================
   Tubes
   ========================================================================== */

/**
 * A tube whose centre line can be re-posed every frame without reallocating.
 *
 * Cross-sections are placed with a parallel-transport frame so the tube does
 * not twist as the path bends.
 */
export class AnimatedTube {
  /**
   * @param {number} segmentCount Number of segments along the path.
   * @param {number} radialSegmentCount Number of vertices around each ring.
   * @param {THREE.Material} material
   */
  constructor(segmentCount, radialSegmentCount, material) {
    this.segmentCount = segmentCount;
    this.radialSegmentCount = radialSegmentCount;

    const vertexCount = (segmentCount + 1) * radialSegmentCount;
    this.positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = [];

    for (let ring = 0; ring <= segmentCount; ring++) {
      for (let side = 0; side < radialSegmentCount; side++) {
        const vertexIndex = ring * radialSegmentCount + side;
        uvs[vertexIndex * 2] = side / radialSegmentCount;
        uvs[vertexIndex * 2 + 1] = ring / segmentCount;
      }
    }

    for (let ring = 0; ring < segmentCount; ring++) {
      for (let side = 0; side < radialSegmentCount; side++) {
        const nextSide = (side + 1) % radialSegmentCount;
        const lowerA = ring * radialSegmentCount + side;
        const lowerB = ring * radialSegmentCount + nextSide;
        const upperA = (ring + 1) * radialSegmentCount + side;
        const upperB = (ring + 1) * radialSegmentCount + nextSide;
        indices.push(lowerA, lowerB, upperA, lowerB, upperB, upperA);
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.geometry.setIndex(indices);

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.frustumCulled = false;

    // Scratch vectors for the moving frame (reused to avoid per-frame allocation).
    this.tangent = vec3();
    this.normal = vec3();
    this.binormal = vec3();
  }

  /**
   * Rebuilds the tube around a new centre line.
   *
   * @param {THREE.Vector3[]} points `segmentCount + 1` points along the path.
   * @param {(fraction: number) => number} radiusAt Radius at a position 0..1 along the path.
   * @returns {this}
   */
  update(points, radiusAt) {
    const { segmentCount, radialSegmentCount, positions } = this;
    const { tangent, normal, binormal } = this;

    for (let ring = 0; ring <= segmentCount; ring++) {
      const centre = points[ring];
      const previous = points[Math.max(ring - 1, 0)];
      const next = points[Math.min(ring + 1, segmentCount)];

      tangent.subVectors(next, previous).normalize();

      if (ring === 0) {
        // Seed the frame with an axis that is not parallel to the path.
        normal.set(0, 1, 0);

        if (Math.abs(tangent.y) > 0.9) {
          normal.set(1, 0, 0);
        }
      }

      normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
      binormal.crossVectors(tangent, normal);

      const radius = radiusAt(ring / segmentCount);

      for (let side = 0; side < radialSegmentCount; side++) {
        const angle = (side / radialSegmentCount) * TAU;
        const normalOffset = Math.cos(angle) * radius;
        const binormalOffset = Math.sin(angle) * radius;
        const offset = (ring * radialSegmentCount + side) * 3;

        positions[offset] = centre.x + normal.x * normalOffset + binormal.x * binormalOffset;
        positions[offset + 1] = centre.y + normal.y * normalOffset + binormal.y * binormalOffset;
        positions[offset + 2] = centre.z + normal.z * normalOffset + binormal.z * binormalOffset;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
    return this;
  }
}

/**
 * Wraps a radius that may be a constant or a function into a function.
 *
 * @param {number|((fraction: number) => number)} radius
 * @returns {(fraction: number) => number}
 */
function toRadiusFunction(radius) {
  return typeof radius === 'number' ? () => radius : radius;
}

/**
 * Builds a static tube along a THREE.Curve.
 *
 * @param {THREE.Curve<THREE.Vector3>} curve
 * @param {number} segmentCount
 * @param {number} radialSegmentCount
 * @param {number|((fraction: number) => number)} radiusAt
 * @param {THREE.Material} material
 * @returns {THREE.Mesh}
 */
export function createTubeAlongCurve(curve, segmentCount, radialSegmentCount, radiusAt, material) {
  const tube = new AnimatedTube(segmentCount, radialSegmentCount, material);
  tube.update(curve.getPoints(segmentCount), toRadiusFunction(radiusAt));
  return tube.mesh;
}

/**
 * Builds a static tube through an explicit list of points.
 *
 * @param {THREE.Vector3[]} points
 * @param {number} radialSegmentCount
 * @param {number|((fraction: number) => number)} radiusAt
 * @param {THREE.Material} material
 * @returns {THREE.Mesh}
 */
export function createTubeThroughPoints(points, radialSegmentCount, radiusAt, material) {
  const tube = new AnimatedTube(points.length - 1, radialSegmentCount, material);
  tube.update(points, toRadiusFunction(radiusAt));
  return tube.mesh;
}

/**
 * Builds a thin cylinder connecting two points.
 *
 * @param {THREE.Vector3} start
 * @param {THREE.Vector3} end
 * @param {number} radius
 * @param {THREE.Material} material
 * @returns {THREE.Mesh}
 */
export function createCylinderBetween(start, end, radius, material) {
  const mesh = new THREE.Mesh(sharedGeometries.cylLo, material);
  const span = end.clone().sub(start);

  mesh.position.copy(start).addScaledVector(span, 0.5);
  mesh.scale.set(radius, span.length(), radius);
  mesh.quaternion.copy(quaternionFromUp(span));
  return mesh;
}

/* ==========================================================================
   Flagella
   ========================================================================== */

/**
 * A flagellum: either an eukaryotic planar travelling wave or a bacterial helix.
 *
 * Public members used by specimens: `mesh` (the renderable) and `tube` / `pts`
 * (the underlying tube and its control points).
 */
export class Flagellum {
  /**
   * @param {THREE.Material} material
   * @param {object} [shape]
   * @param {number} [shape.n] Number of segments.
   * @param {number} [shape.rad] Vertices around each ring.
   * @param {number} [shape.r0] Radius at the base.
   * @param {number} [shape.r1] Radius at the tip.
   */
  // eslint-disable-next-line id-length -- option names are part of the specimen API
  constructor(material, { n = 40, rad = 6, r0 = 0.03, r1 = 0.012 } = {}) {
    this.tube = new AnimatedTube(n, rad, material);
    this.segmentCount = n;
    this.baseRadius = r0;
    this.tipRadius = r1;
    this.pts = Array.from({ length: n + 1 }, () => vec3());
    this.mesh = this.tube.mesh;
  }

  /**
   * Poses the flagellum as a travelling wave.
   *
   * @param {THREE.Vector3} origin Attachment point.
   * @param {THREE.Vector3} direction Unit vector along the flagellum.
   * @param {THREE.Vector3} side Unit vector of the primary beat direction.
   * @param {number} length
   * @param {number} amplitude
   * @param {number} waveNumber
   * @param {number} angularFrequency
   * @param {number} time
   * @param {number} [growth] Exponent controlling how amplitude grows towards the tip.
   */
  // eslint-disable-next-line max-params -- positional API shared with every specimen module
  wave(
    origin,
    direction,
    side,
    length,
    amplitude,
    waveNumber,
    angularFrequency,
    time,
    growth = 0.7,
  ) {
    const upward = vec3().crossVectors(direction, side).normalize();

    for (let index = 0; index <= this.segmentCount; index++) {
      const fraction = index / this.segmentCount;
      const envelope = amplitude * Math.pow(fraction, growth);
      const phase = waveNumber * fraction * length - angularFrequency * time;
      const sideOffset = envelope * Math.sin(phase);
      const upOffset = envelope * 0.5 * Math.cos(phase);

      this.pts[index]
        .copy(origin)
        .addScaledVector(direction, fraction * length)
        .addScaledVector(side, sideOffset)
        .addScaledVector(upward, upOffset);
    }

    this.tube.update(this.pts, (fraction) => lerp(this.baseRadius, this.tipRadius, fraction));
  }

  /**
   * Poses the flagellum as a rotating helix.
   *
   * @param {THREE.Vector3} origin Attachment point.
   * @param {THREE.Vector3} direction Unit vector along the flagellum.
   * @param {THREE.Vector3} side Unit vector perpendicular to `direction`.
   * @param {number} length
   * @param {number} amplitude
   * @param {number} pitch Distance along the axis for one full turn.
   * @param {number} phaseOffset Rotation of the helix in radians.
   * @param {number} [rampLength] Fraction of the length over which the amplitude ramps up.
   */
  // eslint-disable-next-line max-params -- positional API shared with every specimen module
  helix(origin, direction, side, length, amplitude, pitch, phaseOffset, rampLength = 0.25) {
    const upward = vec3().crossVectors(direction, side).normalize();

    for (let index = 0; index <= this.segmentCount; index++) {
      const fraction = index / this.segmentCount;
      const envelope = amplitude * Math.min(1, fraction / rampLength);
      const phase = (TAU * fraction * length) / pitch + phaseOffset;
      const sideOffset = envelope * Math.cos(phase);
      const upOffset = envelope * Math.sin(phase);

      this.pts[index]
        .copy(origin)
        .addScaledVector(direction, fraction * length)
        .addScaledVector(side, sideOffset)
        .addScaledVector(upward, upOffset);
    }

    this.tube.update(this.pts, (fraction) => lerp(this.baseRadius, this.tipRadius, fraction));
  }
}

/* ==========================================================================
   Instancing and direction helpers
   ========================================================================== */

/** Scratch object used to compose instance matrices. */
export const scratchObject = new THREE.Object3D();

/**
 * Creates an InstancedMesh that is never frustum-culled (instances span the specimen).
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {THREE.Material} material
 * @param {number} instanceCount
 * @returns {THREE.InstancedMesh}
 */
export function createInstancedMesh(geometry, material, instanceCount) {
  const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);
  instancedMesh.frustumCulled = false;
  return instancedMesh;
}

/**
 * Writes position, rotation and scale into one instance of an InstancedMesh.
 *
 * @param {THREE.InstancedMesh} instancedMesh
 * @param {number} instanceIndex
 * @param {THREE.Vector3} position
 * @param {THREE.Quaternion|null} [rotation] Identity when omitted.
 * @param {number|THREE.Vector3} [scale] Uniform (number) or per-axis (vector).
 */
export function setInstanceTransform(instancedMesh, instanceIndex, position, rotation, scale = 1) {
  scratchObject.position.copy(position);

  if (rotation) {
    scratchObject.quaternion.copy(rotation);
  } else {
    scratchObject.quaternion.identity();
  }

  if (typeof scale === 'number') {
    scratchObject.scale.setScalar(scale);
  } else {
    scratchObject.scale.copy(scale);
  }

  scratchObject.updateMatrix();
  instancedMesh.setMatrixAt(instanceIndex, scratchObject.matrix);
}

/**
 * A unit vector perpendicular to the given direction.
 *
 * @param {THREE.Vector3} direction
 * @returns {THREE.Vector3}
 */
export function perpendicularDirection(direction) {
  const reference = Math.abs(direction.y) > 0.9 ? vec3(1, 0, 0) : vec3(0, 1, 0);
  return vec3().crossVectors(direction, reference).normalize();
}
