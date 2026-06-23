import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputRoot = process.argv[2] || process.env.STARDEW_LOCAL_DATA_DIR;
const outputRoot = path.join(repoRoot, 'src', 'data', 'stardew-valley', 'generated');

if (!inputRoot) {
  console.error('Usage: npm run generate:stardew -- <local-data-dir>');
  console.error('Or set STARDEW_LOCAL_DATA_DIR to a local directory with Data, Strings, and Maps folders.');
  process.exit(1);
}

const dataDir = path.join(inputRoot, 'Data');
const stringsDir = path.join(inputRoot, 'Strings');
const mapsDir = path.join(inputRoot, 'Maps');

const readJson = async (...segments) => JSON.parse(await readFile(path.join(...segments), 'utf8'));

const objectNameKey = (object) => {
  const match = object?.DisplayName?.match(/Strings\\Objects:([^\\\]]+)/);
  return match?.[1] ?? `${object?.Name ?? ''}_Name`;
};

const localizedObjectName = (id, objects, objectStrings) => {
  const object = objects[id];
  if (!object) return null;
  return objectStrings[objectNameKey(object)] ?? object.Name ?? null;
};

const splitList = (value) =>
  value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseTimeRanges = (value) => {
  const parts = splitList(value).map(Number).filter(Number.isFinite);
  const ranges = [];
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i] !== undefined && parts[i + 1] !== undefined) {
      ranges.push({ start: parts[i], end: parts[i + 1] });
    }
  }
  return ranges;
};

const parseLocationCodes = (value) => {
  if (!value || value === '-1') return [];
  const parts = splitList(value);
  const locations = [];
  for (let i = 0; i < parts.length; i += 2) {
    locations.push({
      code: parts[i],
      chance: parts[i + 1] === undefined ? null : Number(parts[i + 1]),
    });
  }
  return locations;
};

const parseFish = (id, value, objects, objectStrings) => {
  const parts = value.split('/');
  const object = objects[id] ?? {};
  const name = object.Name ?? parts[0] ?? id;
  const nameZh = localizedObjectName(id, objects, objectStrings);

  if (parts[1] === 'trap') {
    return {
      id,
      name,
      nameZh,
      method: 'trap',
      trapChance: Number(parts[2]),
      locationCodes: parseLocationCodes(parts[3]),
      waterType: parts[4] ?? null,
      minSize: Number(parts[5]),
      maxSize: Number(parts[6]),
      basePrice: object.Price ?? null,
    };
  }

  return {
    id,
    name,
    nameZh,
    method: 'rod',
    difficulty: Number(parts[1]),
    behavior: parts[2] ?? null,
    minSize: Number(parts[3]),
    maxSize: Number(parts[4]),
    timeRanges: parseTimeRanges(parts[5] ?? ''),
    seasons: splitList(parts[6] ?? ''),
    weather: parts[7] ?? null,
    locationCodes: parseLocationCodes(parts[8] ?? ''),
    minFishingLevel: Number(parts[9]),
    spawnMultiplier: Number(parts[10]),
    depthMultiplier: Number(parts[11]),
    basePrice: object.Price ?? null,
  };
};

const buildCrops = (crops, objects, objectStrings) =>
  Object.entries(crops)
    .map(([seedId, crop]) => {
      const harvestItemId = String(crop.HarvestItemId);
      const seedObject = objects[seedId] ?? {};
      const harvestObject = objects[harvestItemId] ?? {};
      const averageHarvestStack = (crop.HarvestMinStack + crop.HarvestMaxStack) / 2;

      return {
        seedId,
        seedName: seedObject.Name ?? seedId,
        seedNameZh: localizedObjectName(seedId, objects, objectStrings),
        seasons: crop.Seasons ?? [],
        daysInPhase: crop.DaysInPhase ?? [],
        growDays: (crop.DaysInPhase ?? []).reduce((sum, days) => sum + days, 0),
        regrowDays: crop.RegrowDays,
        isRaised: crop.IsRaised,
        isPaddyCrop: crop.IsPaddyCrop,
        needsWatering: crop.NeedsWatering,
        harvestItemId,
        harvestName: harvestObject.Name ?? harvestItemId,
        harvestNameZh: localizedObjectName(harvestItemId, objects, objectStrings),
        harvestMinStack: crop.HarvestMinStack,
        harvestMaxStack: crop.HarvestMaxStack,
        extraHarvestChance: crop.ExtraHarvestChance,
        seedBasePrice: seedObject.Price ?? null,
        harvestBasePrice: harvestObject.Price ?? null,
        averageHarvestBaseValue:
          harvestObject.Price === undefined ? null : Math.round(harvestObject.Price * averageHarvestStack),
      };
    })
    .sort((a, b) => a.growDays - b.growDays || a.seedName.localeCompare(b.seedName));

const writeJson = async (fileName, data) => {
  await writeFile(path.join(outputRoot, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const main = async () => {
  const [objects, objectStrings, crops, fish, characters, shops, machines, bundles] = await Promise.all([
    readJson(dataDir, 'Objects.json'),
    readJson(stringsDir, 'Objects.zh-CN.json'),
    readJson(dataDir, 'Crops.json'),
    readJson(dataDir, 'Fish.json'),
    readJson(dataDir, 'Characters.json'),
    readJson(dataDir, 'Shops.json'),
    readJson(dataDir, 'Machines.json'),
    readJson(dataDir, 'Bundles.json'),
  ]);

  const mapCount = (await readdir(mapsDir)).filter((file) => file.endsWith('.tmx')).length;
  const generatedAt = new Date().toISOString();
  const cropRows = buildCrops(crops, objects, objectStrings);
  const fishRows = Object.entries(fish)
    .map(([id, value]) => parseFish(id, value, objects, objectStrings))
    .sort((a, b) => a.name.localeCompare(b.name));

  await mkdir(outputRoot, { recursive: true });

  await writeJson('summary.json', {
    generatedAt,
    gameVersion: process.env.STARDEW_GAME_VERSION ?? null,
    counts: {
      objects: Object.keys(objects).length,
      crops: cropRows.length,
      fish: fishRows.length,
      characters: Object.keys(characters).length,
      shops: Object.keys(shops).length,
      machines: Object.keys(machines).length,
      bundles: Object.keys(bundles).length,
      maps: mapCount,
    },
    files: ['crops.json', 'fish.json'],
  });
  await writeJson('crops.json', cropRows);
  await writeJson('fish.json', fishRows);

  console.log(`Generated Stardew Valley data in ${path.relative(repoRoot, outputRoot)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
