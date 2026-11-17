import * as THREE from 'three';
import { SECTION_CLIP_PLANES } from './geometry-helpers.js';

/* ==========================================================================
   Specimen container
   ========================================================================== */

/**
 * Options accepted by {@link Specimen#mesh}.
 *
 * The short key names are part of the specimen-definition API and are used by
 * every specimen module, so they are documented here rather than renamed.
 *
 * @typedef {object} MeshOptions
 * @property {THREE.Vector3} [p] Position.
 * @property {number[]} [r] Euler rotation as `[x, y, z]` in radians.
 * @property {number|THREE.Vector3} [s] Uniform scale (number) or per-axis scale (vector).
 * @property {number} [ro] Render order.
 * @property {THREE.Object3D|false} [parent] Parent object; `false` leaves the mesh unattached.
 */

/**
 * A named, selectable region of a specimen (for example "nucleus").
 *
 * @typedef {object} SpecimenPart
 * @property {number} id Index of the part within its specimen.
 * @property {string} name Display name.
 * @property {string} desc Short description shown in the details panel.
 * @property {boolean} shell Whether the part is an outer shell (hidden when peeling layers).
 * @property {THREE.Mesh[]} meshes Every mesh that belongs to the part.
 */

/**
 * Everything the explorer needs to display one specimen: the 3D group, its
 * selectable parts, per-frame animation callbacks and cross-section materials.
 */
export class Specimen {
  /**
   * @param {object} def Library definition the specimen was built from.
   */
  constructor(def) {
    this.def = def;
    this.group = new THREE.Group();
    this.parts = [];
    this.anims = [];
    this.cutMats = [];
    this.hasCut = false;
  }

  /**
   * Adds an object to the specimen (or to a given parent) and returns it.
   *
   * @template {THREE.Object3D} T
   * @param {T} object
   * @param {THREE.Object3D} [parent] Defaults to the specimen's root group.
   * @returns {T}
   */
  add(object, parent) {
    const target = parent || this.group;
    target.add(object);
    return object;
  }

  /**
   * Creates a mesh, applies the transform options and attaches it.
   *
   * @param {THREE.BufferGeometry} geometry
   * @param {THREE.Material} material
   * @param {MeshOptions} [options]
   * @returns {THREE.Mesh}
   */
  mesh(geometry, material, options = {}) {
    const mesh = new THREE.Mesh(geometry, material);

    if (options.p) {
      mesh.position.copy(options.p);
    }

    if (options.r) {
      mesh.rotation.set(...options.r);
    }

    if (options.s !== undefined) {
      if (typeof options.s === 'number') {
        mesh.scale.setScalar(options.s);
      } else {
        mesh.scale.copy(options.s);
      }
    }

    if (options.ro !== undefined) {
      mesh.renderOrder = options.ro;
    }

    if (options.parent !== false) {
      const parent = options.parent || this.group;
      parent.add(mesh);
    }

    return mesh;
  }

  /**
   * Registers a selectable part made of one or more objects.
   *
   * @param {string} name
   * @param {string} desc
   * @param {THREE.Object3D|THREE.Object3D[]} objects Objects whose meshes belong to the part.
   * @param {{ shell?: boolean }} [flags]
   * @returns {SpecimenPart}
   */
  part(name, desc, objects, { shell = false } = {}) {
    const part = { id: this.parts.length, name, desc, shell, meshes: [] };

    [].concat(objects).forEach((object) =>
      object.traverse((descendant) => {
        if (descendant.isMesh) {
          descendant.userData.part = part;
          part.meshes.push(descendant);
        }
      }),
    );

    this.parts.push(part);
    return part;
  }

  /**
   * Makes materials respond to the cross-section clipping planes.
   *
   * @param {...THREE.Material} materials
   */
  cut(...materials) {
    materials.forEach((material) => {
      if (!material.clippingPlanes) {
        material.clippingPlanes = SECTION_CLIP_PLANES;
        this.cutMats.push(material);
      }
    });

    this.hasCut = true;
  }

  /**
   * Registers a per-frame animation callback.
   *
   * @param {(time: number, deltaTime: number) => void} callback
   */
  anim(callback) {
    this.anims.push(callback);
  }
}
