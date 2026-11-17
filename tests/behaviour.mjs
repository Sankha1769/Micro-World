/**
 * Behaviour fingerprint of every specimen model.
 *
 * Usage: node tests/behaviour.mjs <build.html> <output.json>
 *
 * Every specimen is built, advanced to a fixed animation time and reduced to a
 * checksum of its geometry, instance transforms and structure names. Two builds
 * with equal fingerprints produce identical 3D models and animations.
 */
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser, openRecordedPage, openExplorer } from './support/browser.mjs';

const [buildPath, outputPath] = process.argv.slice(2).map((value) => path.resolve(value));

/** Specimen ids that live in the Cell Anatomy view rather than the library list. */
const ANATOMY_SPECIMEN_IDS = ['animal', 'plant'];

/**
 * Runs inside the page. Builds each specimen and returns its fingerprint.
 * @param {string[]} anatomyIds
 */
async function fingerprintAllSpecimens(anatomyIds) {
  const ANIMATION_TIME = 2.5;

  function checksum(numbers, weightCycle) {
    let total = 0;

    for (let index = 0; index < numbers.length; index += 1) {
      total += numbers[index] * ((index % weightCycle) + 1);
    }

    return Number(total.toFixed(3));
  }

  function fingerprintSpecimen(specimen) {
    specimen.anims.forEach((animate) => animate(ANIMATION_TIME));
    specimen.group.updateMatrixWorld(true);

    const totals = { objects: 0, instances: 0, vertexChecksum: 0, matrixChecksum: 0 };

    specimen.group.traverse((object) => {
      const positions = object.geometry && object.geometry.attributes.position;

      if (!positions) {
        return;
      }

      totals.objects += 1;
      totals.vertexChecksum += checksum(positions.array, 7);
      totals.matrixChecksum += checksum(object.matrixWorld.elements, 16);

      if (object.isInstancedMesh) {
        totals.instances += object.count;
        totals.matrixChecksum += checksum(object.instanceMatrix.array, 5);
      }
    });

    return {
      parts: specimen.parts.map((part) => part.name),
      objects: totals.objects,
      instances: totals.instances,
      vertexChecksum: Number(totals.vertexChecksum.toFixed(3)),
      matrixChecksum: Number(totals.matrixChecksum.toFixed(3)),
    };
  }

  const fingerprints = {};

  for (const definition of window.__mv.LIB) {
    fingerprints[definition.id] = fingerprintSpecimen(window.__mv.build(definition));
  }

  for (const id of anatomyIds) {
    await window.__mv.load(id);
    await new Promise((resolve) => setTimeout(resolve, 400));
    // The loaded specimen is also moved by the live render loop, so a fresh copy is fingerprinted instead.
    fingerprints[id] = fingerprintSpecimen(window.__mv.build(window.__mv.cur.def));
  }

  return fingerprints;
}

const browser = await launchBrowser();
const { page, errors } = await openRecordedPage(browser);

await openExplorer(page, buildPath, 'diatom');

const fingerprints = await page.evaluate(fingerprintAllSpecimens, ANATOMY_SPECIMEN_IDS);

await browser.close();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({ errors, fingerprints }, null, 2)}\n`);

console.log(`${Object.keys(fingerprints).length} specimens fingerprinted, ${errors.length} errors`);
