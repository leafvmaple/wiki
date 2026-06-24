import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputArg = process.argv[2] || process.env.STARDEW_LOCAL_DATA_DIR;
const generatedRoot = path.join(repoRoot, 'src', 'data', 'stardew-valley', 'generated');
const publicRoot = path.join(repoRoot, 'public', 'assets', 'stardew-valley');
const publicPrefix = '/assets/stardew-valley';

if (!inputArg) {
  console.error('Usage: npm run generate:stardew-assets -- <local-data-dir>');
  console.error('Or set STARDEW_LOCAL_DATA_DIR to a local directory with Data, Maps, and texture folders.');
  process.exit(1);
}

const pathExists = async (target) => {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
};

const hasGameDataFolders = async (target) =>
  (await pathExists(path.join(target, 'Data'))) && (await pathExists(path.join(target, 'Maps')));

const readChildDirs = async (target) => {
  try {
    return (await readdir(target, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  } catch {
    return [];
  }
};

const resolveInputRoot = async (target) => {
  const direct = path.resolve(target);
  if (await hasGameDataFolders(direct)) return direct;

  for (const levelOne of await readChildDirs(direct)) {
    const levelOnePath = path.join(direct, levelOne.name);
    if (await hasGameDataFolders(levelOnePath)) return levelOnePath;

    for (const levelTwo of await readChildDirs(levelOnePath)) {
      const levelTwoPath = path.join(levelOnePath, levelTwo.name);
      if (await hasGameDataFolders(levelTwoPath)) return levelTwoPath;
    }
  }

  throw new Error(`Cannot find Data and Maps folders under ${target}`);
};

const inputRoot = await resolveInputRoot(inputArg);
const dataDir = path.join(inputRoot, 'Data');
const stringsDir = path.join(inputRoot, 'Strings');
const mapsDir = path.join(inputRoot, 'Maps');

const readJson = async (...segments) => JSON.parse(await readFile(path.join(...segments), 'utf8'));
const normalize = (value) => String(value ?? '').trim().toLowerCase();
const publicPath = (...segments) => `${publicPrefix}/${segments.map((part) => encodeURIComponent(part)).join('/')}`;

const objectNameKey = (object) => {
  const match = object?.DisplayName?.match(/Strings\\Objects:([^\\\]]+)/);
  return match?.[1] ?? `${object?.Name ?? ''}_Name`;
};

const bigCraftableNameKey = (item) => {
  const match = item?.DisplayName?.match(/Strings\\BigCraftables:([^\\\]]+)/);
  return match?.[1] ?? `${item?.Name ?? ''}_Name`;
};

const resolveImagePath = async (texture, fallbackRelativePath) => {
  const relative = texture ? `${texture.replaceAll('\\', '/')}.png` : fallbackRelativePath;
  const candidate = path.join(inputRoot, relative);
  if (await pathExists(candidate)) return candidate;
  return path.join(inputRoot, fallbackRelativePath);
};

const sourceMetaCache = new Map();
const getSourceMeta = async (filePath) => {
  if (sourceMetaCache.has(filePath)) return sourceMetaCache.get(filePath);
  const meta = await sharp(filePath).metadata();
  sourceMetaCache.set(filePath, meta);
  return meta;
};

const iconFromSheet = async ({ filePath, spriteIndex, tileWidth, tileHeight, outputFile, columns }) => {
  const meta = await getSourceMeta(filePath);
  const sheetColumns = columns ?? Math.floor(meta.width / tileWidth);
  const left = (spriteIndex % sheetColumns) * tileWidth;
  const top = Math.floor(spriteIndex / sheetColumns) * tileHeight;
  if (left + tileWidth > meta.width || top + tileHeight > meta.height) return false;

  await mkdir(path.dirname(outputFile), { recursive: true });
  await sharp(filePath)
    .extract({ left, top, width: tileWidth, height: tileHeight })
    .resize({
      width: 32,
      height: 32,
      fit: 'contain',
      kernel: sharp.kernel.nearest,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ lossless: true })
    .toFile(outputFile);
  return true;
};

const iconFromPortrait = async ({ filePath, outputFile }) => {
  if (!(await pathExists(filePath))) return false;

  await mkdir(path.dirname(outputFile), { recursive: true });
  await sharp(filePath)
    .extract({ left: 0, top: 0, width: 64, height: 64 })
    .resize({ width: 32, height: 32, fit: 'cover', kernel: sharp.kernel.nearest })
    .webp({ lossless: true })
    .toFile(outputFile);
  return true;
};

const addLabels = (manifest, labels, target) => {
  for (const label of labels) {
    const key = normalize(label);
    if (key && !manifest.labels[key]) manifest.labels[key] = target;
  }
};

const renderObjectIcons = async (manifest) => {
  const objects = await readJson(dataDir, 'Objects.json');
  const objectStrings = await readJson(stringsDir, 'Objects.zh-CN.json');

  for (const [id, object] of Object.entries(objects)) {
    const spriteIndex = Number(object.SpriteIndex);
    if (!Number.isFinite(spriteIndex)) continue;

    const source = await resolveImagePath(object.Texture, 'Maps/springobjects.png');
    const outputName = `${encodeURIComponent(id)}.webp`;
    const outputFile = path.join(publicRoot, 'icons', 'objects', outputName);
    const ok = await iconFromSheet({
      filePath: source,
      spriteIndex,
      tileWidth: 16,
      tileHeight: 16,
      outputFile,
    });
    if (!ok) continue;

    const target = publicPath('icons', 'objects', outputName);
    manifest.objectsById[id] = target;
    addLabels(manifest, [id, object.Name, objectStrings[objectNameKey(object)]], target);
  }
};

const renderBigCraftableIcons = async (manifest) => {
  const bigCraftables = await readJson(dataDir, 'BigCraftables.json');
  const bigCraftableStrings = await readJson(stringsDir, 'BigCraftables.zh-CN.json');

  for (const [id, item] of Object.entries(bigCraftables)) {
    const spriteIndex = Number(item.SpriteIndex);
    if (!Number.isFinite(spriteIndex)) continue;

    const source = await resolveImagePath(item.Texture, 'TileSheets/Craftables.png');
    const outputName = `${encodeURIComponent(id)}.webp`;
    const outputFile = path.join(publicRoot, 'icons', 'big-craftables', outputName);
    const ok = await iconFromSheet({
      filePath: source,
      spriteIndex,
      tileWidth: 16,
      tileHeight: 32,
      outputFile,
      columns: 8,
    });
    if (!ok) continue;

    const target = publicPath('icons', 'big-craftables', outputName);
    manifest.bigCraftablesById[id] = target;
    addLabels(manifest, [id, item.Name, bigCraftableStrings[bigCraftableNameKey(item)]], target);
  }
};

const renderNpcIcons = async (manifest) => {
  const npcNames = await readJson(stringsDir, 'NPCNames.zh-CN.json');
  const villagers = await readJson(generatedRoot, 'villagers.json');

  for (const { id } of villagers) {
    const outputName = `${encodeURIComponent(id)}.webp`;
    const outputFile = path.join(publicRoot, 'icons', 'npcs', outputName);
    const source = path.join(inputRoot, 'Portraits', `${id}.png`);
    const ok = await iconFromPortrait({ filePath: source, outputFile });
    if (!ok) continue;

    const target = publicPath('icons', 'npcs', outputName);
    manifest.npcsById[id] = target;
    addLabels(manifest, [id, npcNames[id]], target);
  }
};

const parseAttributes = (text) =>
  Object.fromEntries([...text.matchAll(/(\w+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));

const loadTilesets = async (tmx) => {
  const tilesets = [];
  for (const match of tmx.matchAll(/<tileset\b([^>]*)>[\s\S]*?<image\b([^>]*)\/>[\s\S]*?<\/tileset>/g)) {
    const attrs = parseAttributes(match[1]);
    const imageAttrs = parseAttributes(match[2]);
    const imageSource = imageAttrs.source.endsWith('.png') ? imageAttrs.source : `${imageAttrs.source}.png`;
    const imagePath = path.join(mapsDir, imageSource);
    const image = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    tilesets.push({
      firstgid: Number(attrs.firstgid),
      tileWidth: Number(attrs.tilewidth),
      tileHeight: Number(attrs.tileheight),
      columns: Number(attrs.columns) || Math.floor(image.info.width / Number(attrs.tilewidth)),
      image,
    });
  }
  return tilesets.sort((a, b) => a.firstgid - b.firstgid);
};

const findTileset = (tilesets, gid) => {
  let result = null;
  for (const tileset of tilesets) {
    if (gid >= tileset.firstgid) result = tileset;
    else break;
  }
  return result;
};

const blendPixel = (target, targetOffset, source, sourceOffset) => {
  const sourceAlpha = source[sourceOffset + 3] / 255;
  if (sourceAlpha <= 0) return;

  if (sourceAlpha >= 1) {
    target[targetOffset] = source[sourceOffset];
    target[targetOffset + 1] = source[sourceOffset + 1];
    target[targetOffset + 2] = source[sourceOffset + 2];
    target[targetOffset + 3] = 255;
    return;
  }

  const targetAlpha = target[targetOffset + 3] / 255;
  const outputAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
  for (let channel = 0; channel < 3; channel += 1) {
    target[targetOffset + channel] = Math.round(
      (source[sourceOffset + channel] * sourceAlpha +
        target[targetOffset + channel] * targetAlpha * (1 - sourceAlpha)) /
        outputAlpha
    );
  }
  target[targetOffset + 3] = Math.round(outputAlpha * 255);
};

const drawTile = ({ canvas, width, tileset, localId, x, y }) => {
  const { image, tileWidth, tileHeight, columns } = tileset;
  const sourceX = (localId % columns) * tileWidth;
  const sourceY = Math.floor(localId / columns) * tileHeight;
  if (sourceX + tileWidth > image.info.width || sourceY + tileHeight > image.info.height) return;

  for (let row = 0; row < tileHeight; row += 1) {
    for (let col = 0; col < tileWidth; col += 1) {
      const sourceOffset = ((sourceY + row) * image.info.width + sourceX + col) * 4;
      const targetOffset = ((y + row) * width + x + col) * 4;
      blendPixel(canvas, targetOffset, image.data, sourceOffset);
    }
  }
};

const watermarkSvg = (width, height) =>
  Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>text { font-family: Arial, sans-serif; font-weight: 800; letter-spacing: 0; }</style>
      <rect x="${Math.max(24, width - 410)}" y="${Math.max(24, height - 70)}" width="386" height="42" rx="6" fill="rgba(17,24,39,0.44)"/>
      <text x="${Math.max(44, width - 390)}" y="${Math.max(52, height - 42)}" fill="rgba(255,255,255,0.86)" font-size="20">wiki.leafvmaple.com</text>
    </svg>
  `);

const renderTownMap = async (manifest) => {
  const tmx = await readFile(path.join(mapsDir, 'Town.tmx'), 'utf8');
  const mapAttrs = parseAttributes(tmx.match(/<map\b([^>]*)>/)?.[1] ?? '');
  const mapWidth = Number(mapAttrs.width);
  const mapHeight = Number(mapAttrs.height);
  const tileWidth = Number(mapAttrs.tilewidth);
  const tileHeight = Number(mapAttrs.tileheight);
  const width = mapWidth * tileWidth;
  const height = mapHeight * tileHeight;
  const tilesets = await loadTilesets(tmx);
  const canvas = Buffer.alloc(width * height * 4);

  for (const match of tmx.matchAll(/<layer\b([^>]*)>[\s\S]*?<data encoding="csv">([\s\S]*?)<\/data>/g)) {
    const layerAttrs = parseAttributes(match[1]);
    if (layerAttrs.visible === '0') continue;

    const gids = match[2].split(',').map((value) => Number(value.trim()) & 0x1fffffff);
    gids.forEach((gid, index) => {
      if (!gid) return;
      const tileset = findTileset(tilesets, gid);
      if (!tileset) return;

      const localId = gid - tileset.firstgid;
      drawTile({
        canvas,
        width,
        tileset,
        localId,
        x: (index % mapWidth) * tileWidth,
        y: Math.floor(index / mapWidth) * tileHeight,
      });
    });
  }

  await mkdir(path.join(publicRoot, 'maps'), { recursive: true });
  await mkdir(path.join(publicRoot, 'hero'), { recursive: true });

  const resizedTown = await sharp(canvas, { raw: { width, height, channels: 4 } })
    .resize({ width: 1280, kernel: sharp.kernel.nearest })
    .toBuffer({ resolveWithObject: true });

  await sharp(resizedTown.data, {
    raw: { width: resizedTown.info.width, height: resizedTown.info.height, channels: resizedTown.info.channels },
  })
    .composite([{ input: watermarkSvg(resizedTown.info.width, resizedTown.info.height), left: 0, top: 0 }])
    .webp({ quality: 88 })
    .toFile(path.join(publicRoot, 'maps', 'town.webp'));

  const resizedHero = await sharp(canvas, { raw: { width, height, channels: 4 } })
    .extract({ left: 360, top: 520, width: 980, height: 620 })
    .resize({ width: 1280, height: 520, fit: 'cover', kernel: sharp.kernel.nearest })
    .toBuffer({ resolveWithObject: true });

  await sharp(resizedHero.data, {
    raw: { width: resizedHero.info.width, height: resizedHero.info.height, channels: resizedHero.info.channels },
  })
    .composite([{ input: watermarkSvg(resizedHero.info.width, resizedHero.info.height), left: 0, top: 0 }])
    .webp({ quality: 86 })
    .toFile(path.join(publicRoot, 'hero', 'stardew-valley.webp'));

  manifest.maps.town = publicPath('maps', 'town.webp');
  manifest.hero.stardewValley = publicPath('hero', 'stardew-valley.webp');
};

const manifest = {
  generatedAt: new Date().toISOString(),
  iconsBase: `${publicPrefix}/icons`,
  objectsById: {},
  bigCraftablesById: {},
  npcsById: {},
  labels: {},
  maps: {},
  hero: {},
};

await renderObjectIcons(manifest);
await renderBigCraftableIcons(manifest);
await renderNpcIcons(manifest);
await renderTownMap(manifest);

manifest.counts = {
  objects: Object.keys(manifest.objectsById).length,
  bigCraftables: Object.keys(manifest.bigCraftablesById).length,
  npcs: Object.keys(manifest.npcsById).length,
  labels: Object.keys(manifest.labels).length,
};

await writeFile(path.join(generatedRoot, 'assets.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(
  `Stardew Valley visual assets generated: ${manifest.counts.objects} object icons, ${manifest.counts.bigCraftables} machine icons, ${manifest.counts.npcs} NPC icons.`
);
