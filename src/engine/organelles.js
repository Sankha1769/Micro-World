import * as THREE from 'three';
import { sharedGeometries, createInstancedMesh, setInstanceTransform } from './geometry-helpers.js';
import { materialFactory } from './materials.js';
import { TAU, fibonacciSphere, quaternionFromUp, createSeededRandom } from './math.js';

/* ==========================================================================
   Shared organelle factories
   ========================================================================== */

/**
 * Materials for {@link createMitochondrion}.
 *
 * @returns {{ o: THREE.Material, i: THREE.Material }} `o` is the outer membrane,
 *   `i` the inner membrane and cristae (key names are used by specimen modules).
 */
export function createMitochondrionMaterials() {
  return {
    o: materialFactory.shell(0xd98a5f, 0.42, { bumpScale: 0.2 }),
    i: materialFactory.soft(0xb4573a, { transparent: true, opacity: 0.9 }),
  };
}

/**
 * Builds a mitochondrion: outer capsule, inner capsule and five cristae discs.
 *
 * @param {{ o: THREE.Material, i: THREE.Material }} materials From {@link createMitochondrionMaterials}.
 * @param {number} [scale]
 * @returns {THREE.Group}
 */
export function createMitochondrion(materials, scale = 1) {
  const group = new THREE.Group();

  const outerMembrane = new THREE.Mesh(sharedGeometries.capsule, materials.o);
  outerMembrane.scale.set(0.32, 0.34, 0.32);
  outerMembrane.renderOrder = 4;
  group.add(outerMembrane);

  const innerMembrane = new THREE.Mesh(sharedGeometries.capsule, materials.i);
  innerMembrane.scale.set(0.2, 0.22, 0.2);
  group.add(innerMembrane);

  for (let cristaIndex = 0; cristaIndex < 5; cristaIndex++) {
    const crista = new THREE.Mesh(sharedGeometries.cyl, materials.i);
    crista.scale.set(0.1, 0.012, 0.1);
    crista.position.y = (cristaIndex - 2) * 0.06;
    group.add(crista);
  }

  group.scale.setScalar(scale);
  return group;
}

/**
 * Bends a geometry into a shallow parabola along X by displacing Y by `bend * x²`.
 *
 * @param {THREE.BufferGeometry} geometry Modified in place.
 * @param {number} bend Curvature; negative values curve downwards.
 * @returns {THREE.BufferGeometry} The same geometry.
 */
export function bendGeometry(geometry, bend) {
  const positions = geometry.attributes.position;

  for (let vertex = 0; vertex < positions.count; vertex++) {
    const x = positions.getX(vertex);
    positions.setY(vertex, positions.getY(vertex) + bend * x * x);
  }

  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Builds a Golgi apparatus: a stack of six curved cisternae with nine vesicles.
 *
 * @param {THREE.Material} material Cisternae material.
 * @param {THREE.Material} vesicleMaterial
 * @param {number} [scale]
 * @returns {THREE.Group}
 */
export function createGolgiApparatus(material, vesicleMaterial, scale = 1) {
  const group = new THREE.Group();

  for (let cisternaIndex = 0; cisternaIndex < 6; cisternaIndex++) {
    const geometry = bendGeometry(new THREE.SphereGeometry(1, 24, 10), -0.5);
    const cisterna = new THREE.Mesh(geometry, material);
    const taper = 1 - cisternaIndex * 0.06;
    cisterna.scale.set(0.5 * taper, 0.035, 0.3 * taper);
    cisterna.position.y = (cisternaIndex - 2.5) * 0.085;
    group.add(cisterna);
  }

  const random = createSeededRandom(3);

  for (let vesicleIndex = 0; vesicleIndex < 9; vesicleIndex++) {
    const vesicle = new THREE.Mesh(sharedGeometries.sphereLo, vesicleMaterial);
    const angle = random() * TAU;
    vesicle.scale.setScalar(0.035 + random() * 0.02);
    vesicle.position.set(Math.cos(angle) * 0.62, (random() - 0.5) * 0.5, Math.sin(angle) * 0.3);
    group.add(vesicle);
  }

  group.scale.setScalar(scale);
  return group;
}

/**
 * Scatters nuclear-pore rings evenly over a sphere, each facing outwards.
 *
 * @param {number} poreCount
 * @param {number} radius Radius of the nuclear envelope.
 * @param {THREE.Material} material
 * @returns {THREE.InstancedMesh}
 */
export function createNuclearPores(poreCount, radius, material) {
  const pores = createInstancedMesh(
    new THREE.TorusGeometry(0.025, 0.007, 6, 12),
    material,
    poreCount,
  );
  const quarterTurnAboutX = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));

  fibonacciSphere(poreCount).forEach((direction, poreIndex) => {
    const position = direction.clone().multiplyScalar(radius);
    const rotation = quaternionFromUp(direction).multiply(quarterTurnAboutX);
    setInstanceTransform(pores, poreIndex, position, rotation);
  });

  return pores;
}

/**
 * Creates a cloud of small spheres standing in for ribosomes.
 *
 * @param {number} ribosomeCount
 * @param {(random: () => number) => THREE.Vector3} samplePosition Picks a position for one ribosome.
 * @param {THREE.Material} material
 * @param {number} [size] Base radius of each ribosome.
 * @param {number} [seed] Seed for reproducible placement.
 * @returns {THREE.InstancedMesh}
 */
export function createRibosomeCloud(
  ribosomeCount,
  samplePosition,
  material,
  size = 0.016,
  seed = 9,
) {
  const random = createSeededRandom(seed);
  const cloud = createInstancedMesh(sharedGeometries.sphereLo, material, ribosomeCount);

  for (let ribosomeIndex = 0; ribosomeIndex < ribosomeCount; ribosomeIndex++) {
    const position = samplePosition(random);
    const scale = size * (0.8 + random() * 0.5);
    setInstanceTransform(cloud, ribosomeIndex, position, null, scale);
  }

  return cloud;
}
