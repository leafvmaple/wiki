import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(repoRoot, 'src', 'data', 'stardew-valley', 'generated');

const readJson = async (fileName) => JSON.parse(await readFile(path.join(dataRoot, fileName), 'utf8'));

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = async () => {
  const [summary, crops, fish, villagers, machines, shops, town] = await Promise.all([
    readJson('summary.json'),
    readJson('crops.json'),
    readJson('fish.json'),
    readJson('villagers.json'),
    readJson('machines.json'),
    readJson('shops.json'),
    readJson(path.join('maps', 'town.json')),
  ]);

  const expectedFiles = ['crops.json', 'fish.json', 'villagers.json', 'machines.json', 'shops.json', 'maps/town.json'];
  for (const fileName of expectedFiles) {
    assert(summary.files.includes(fileName), `summary.json is missing ${fileName}`);
  }

  assert(crops.length === summary.counts.crops, 'Crop count does not match summary.json');
  assert(fish.length === summary.counts.fish, 'Fish count does not match summary.json');
  assert(villagers.length === summary.counts.characters, 'Villager count does not match summary.json');
  assert(machines.length === summary.counts.machines, 'Machine count does not match summary.json');
  assert(shops.length === summary.counts.shops, 'Shop count does not match summary.json');
  assert(town.id === 'town', 'Town map id is invalid');
  assert(town.points.length === town.pointCount, 'Town map point count does not match');
  assert(town.pointCount > 0, 'Town map has no points');

  console.log('Stardew Valley generated data validation passed.');
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
