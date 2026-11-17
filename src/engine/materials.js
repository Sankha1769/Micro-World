import * as THREE from 'three';
import { textureLibrary } from './textures.js';

/* ==========================================================================
   Material factory
   ========================================================================== */

/**
 * Factories for the handful of material "looks" shared by every specimen.
 *
 * Each factory takes a colour, optional opacity / intensity and an `overrides`
 * object that is spread last, so any MeshPhysicalMaterial option can be replaced.
 */
export const materialFactory = {
  /**
   * Translucent, bumpy outer membrane or shell.
   *
   * @param {THREE.ColorRepresentation} color
   * @param {number} [opacity]
   * @param {object} [overrides]
   * @returns {THREE.MeshPhysicalMaterial}
   */
  shell: (color, opacity = 0.3, overrides = {}) =>
    new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity,
      roughness: 0.3,
      metalness: 0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      bumpMap: textureLibrary.bump,
      bumpScale: 0.5,
      ...overrides,
    }),

  /**
   * Smooth, glossy, see-through glass.
   *
   * @param {THREE.ColorRepresentation} color
   * @param {number} [opacity]
   * @param {object} [overrides]
   * @returns {THREE.MeshPhysicalMaterial}
   */
  glass: (color, opacity = 0.35, overrides = {}) =>
    new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      ...overrides,
    }),

  /**
   * Opaque, soft tissue with a sheen tinted towards white.
   *
   * @param {THREE.ColorRepresentation} color
   * @param {object} [overrides]
   * @returns {THREE.MeshPhysicalMaterial}
   */
  soft: (color, overrides = {}) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.5,
      clearcoat: 0.3,
      clearcoatRoughness: 0.5,
      sheen: 0.5,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color(color).lerp(new THREE.Color(1, 1, 1), 0.5),
      ...overrides,
    }),

  /**
   * Soft material with a fine granular bump.
   *
   * @param {THREE.ColorRepresentation} color
   * @param {object} [overrides]
   * @returns {THREE.MeshPhysicalMaterial}
   */
  grain: (color, overrides = {}) =>
    materialFactory.soft(color, { bumpMap: textureLibrary.grain, bumpScale: 1.2, ...overrides }),

  /**
   * Soft material that glows in its own colour.
   *
   * @param {THREE.ColorRepresentation} color
   * @param {number} [emissiveIntensity]
   * @param {object} [overrides]
   * @returns {THREE.MeshPhysicalMaterial}
   */
  emit: (color, emissiveIntensity = 0.6, overrides = {}) =>
    materialFactory.soft(color, { emissive: color, emissiveIntensity, ...overrides }),
};
