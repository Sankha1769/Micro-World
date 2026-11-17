import * as THREE from 'three';
import { clamp, lerp, createSeededRandom } from './math.js';

/* ==========================================================================
   Texture generators
   ========================================================================== */

/** Cubic ease used to blend between noise lattice values. */
const smoothBlend = (amount) => amount * amount * (3 - 2 * amount);

/**
 * Generates a tileable greyscale noise texture by summing octaves of
 * smoothly interpolated random lattices.
 *
 * @param {number} size Width and height in pixels.
 * @param {number} seed Seed for the lattice values.
 * @param {number[]} [octaveCellCounts] Lattice cells per side for each octave.
 * @param {number[]} [octaveAmplitudes] Weight of each octave.
 * @returns {THREE.CanvasTexture}
 */
function createNoiseTexture(
  size,
  seed,
  octaveCellCounts = [6, 12, 24],
  octaveAmplitudes = [0.5, 0.3, 0.2],
) {
  const random = createSeededRandom(seed);
  const octaveGrids = octaveCellCounts.map((cellCount) =>
    Array.from({ length: cellCount * cellCount }, () => random()),
  );

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);

  for (let pixelY = 0; pixelY < size; pixelY++) {
    for (let pixelX = 0; pixelX < size; pixelX++) {
      let brightness = 0;

      octaveCellCounts.forEach((cellCount, octave) => {
        const latticeX = (pixelX / size) * cellCount;
        const latticeY = (pixelY / size) * cellCount;
        const cellX = Math.floor(latticeX);
        const cellY = Math.floor(latticeY);
        const blendX = smoothBlend(latticeX - cellX);
        const blendY = smoothBlend(latticeY - cellY);
        const grid = octaveGrids[octave];

        // Wrap lattice lookups so the texture tiles seamlessly.
        const rowLower = (cellY % cellCount) * cellCount;
        const rowUpper = ((cellY + 1) % cellCount) * cellCount;
        const columnLeft = cellX % cellCount;
        const columnRight = (cellX + 1) % cellCount;

        const lowerLeft = grid[rowLower + columnLeft];
        const lowerRight = grid[rowLower + columnRight];
        const upperLeft = grid[rowUpper + columnLeft];
        const upperRight = grid[rowUpper + columnRight];

        const lowerEdge = lerp(lowerLeft, lowerRight, blendX);
        const upperEdge = lerp(upperLeft, upperRight, blendX);
        brightness += lerp(lowerEdge, upperEdge, blendY) * octaveAmplitudes[octave];
      });

      const pixelOffset = (pixelY * size + pixelX) * 4;
      const grey = clamp(brightness, 0, 1) * 255;
      image.data[pixelOffset] = grey;
      image.data[pixelOffset + 1] = grey;
      image.data[pixelOffset + 2] = grey;
      image.data[pixelOffset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Draws onto a canvas and wraps it as a repeating texture.
 *
 * @param {number} width
 * @param {number} height
 * @param {(context: CanvasRenderingContext2D, width: number, height: number) => void} draw
 * @param {boolean} [isColorData] False for data textures such as bump maps.
 * @returns {THREE.CanvasTexture}
 */
export function createCanvasTexture(width, height, draw, isColorData = true) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;

  if (isColorData) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  return texture;
}

/* ==========================================================================
   Texture library (created once, shared by all materials)
   ========================================================================== */

/** Shared textures: `bump`, `grain`, `cellulose` and `sarcomere`. */
export const textureLibrary = {};
textureLibrary.bump = createNoiseTexture(256, 7);
textureLibrary.bump.repeat.set(3, 3);
textureLibrary.grain = createNoiseTexture(128, 21, [16, 32, 48], [0.3, 0.4, 0.3]);
textureLibrary.grain.repeat.set(2, 2);
textureLibrary.cellulose = createCanvasTexture(
  256,
  256,
  (g, w, h) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, w, h);
    // Random fibre strokes; the draw order of `random()` defines the pattern.
    const random = createSeededRandom(5);
    for (let fibre = 0; fibre < 520; fibre++) {
      const startX = random() * w;
      const startY = random() * h;
      const angle = random() * Math.PI;
      const length = 30 + random() * 60;
      g.strokeStyle = random() > 0.5 ? '#c8c8c8' : '#4a4a4a';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(startX, startY);
      g.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
      g.stroke();
    }
  },
  false,
);
textureLibrary.cellulose.repeat.set(3, 3);
textureLibrary.sarcomere = createCanvasTexture(64, 256, (g, w, h) => {
  g.fillStyle = '#f0c3b6';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#b5555f';
  g.fillRect(0, h * 0.2, w, h * 0.6);
  g.fillStyle = '#d98a8f';
  g.fillRect(0, h * 0.43, w, h * 0.14);
  g.fillStyle = '#7a2a35';
  g.fillRect(0, h * 0.495, w, h * 0.01);
  g.fillStyle = '#4a1a24';
  g.fillRect(0, 0, w, 5);
  g.fillRect(0, h - 5, w, 5);
});
