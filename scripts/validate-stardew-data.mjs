import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(repoRoot, 'src', 'data', 'stardew-valley', 'generated');
const publicRoot = path.join(repoRoot, 'public');

const readJson = async (fileName) => JSON.parse(await readFile(path.join(dataRoot, fileName), 'utf8'));
const publicAssetPath = (assetPath) => path.join(publicRoot, assetPath.replace(/^\//, ''));
const fileExists = async (assetPath) => {
  try {
    await access(publicAssetPath(assetPath));
    return true;
  } catch {
    return false;
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = async () => {
  const [summary, crops, fish, villagers, machines, shops, bundles, town, assets] = await Promise.all([
    readJson('summary.json'),
    readJson('crops.json'),
    readJson('fish.json'),
    readJson('villagers.json'),
    readJson('machines.json'),
    readJson('shops.json'),
    readJson('bundles.json'),
    readJson(path.join('maps', 'town.json')),
    readJson('assets.json'),
  ]);

  const expectedFiles = [
    'crops.json',
    'fish.json',
    'villagers.json',
    'machines.json',
    'shops.json',
    'bundles.json',
    'maps/town.json',
  ];
  for (const fileName of expectedFiles) {
    assert(summary.files.includes(fileName), `summary.json is missing ${fileName}`);
  }

  assert(crops.length === summary.counts.crops, 'Crop count does not match summary.json');
  assert(fish.length === summary.counts.fish, 'Fish count does not match summary.json');
  assert(villagers.length === summary.counts.characters, 'Villager count does not match summary.json');
  assert(machines.length === summary.counts.machines, 'Machine count does not match summary.json');
  assert(shops.length === summary.counts.shops, 'Shop count does not match summary.json');
  assert(bundles.length === summary.counts.bundles, 'Bundle count does not match summary.json');
  assert(bundles.every((bundle) => bundle.items.length > 0), 'Bundle item list is empty');
  assert(bundles.some((bundle) => bundle.requiredCount < bundle.itemCount), 'Bundle planner is missing choice bundles');
  assert(town.id === 'town', 'Town map id is invalid');
  assert(town.points.length === town.pointCount, 'Town map point count does not match');
  assert(town.pointCount > 0, 'Town map has no points');
  assert(assets.counts.objects >= summary.counts.objects, 'Visual object icon count is too low');
  assert(assets.counts.bigCraftables > 0, 'Visual machine icon count is empty');
  assert(assets.counts.npcs > 0, 'Visual NPC icon count is empty');
  assert(assets.objectsById['705'], 'Visual assets are missing a representative fish icon');
  assert(assets.npcsById.Abigail, 'Visual assets are missing a representative NPC icon');
  assert(assets.maps.town && (await fileExists(assets.maps.town)), 'Town map image is missing');
  assert(assets.hero.stardewValley && (await fileExists(assets.hero.stardewValley)), 'Stardew Valley hero image is missing');

  console.log('Stardew Valley generated data validation passed.');
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
