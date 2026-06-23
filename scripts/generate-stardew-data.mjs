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

const bigCraftableNameKey = (item) => {
  const match = item?.DisplayName?.match(/Strings\\BigCraftables:([^\\\]]+)/);
  return match?.[1] ?? `${item?.Name ?? ''}_Name`;
};

const localizedBigCraftableName = (id, bigCraftables, bigCraftableStrings) => {
  const item = bigCraftables[id];
  if (!item) return null;
  return bigCraftableStrings[bigCraftableNameKey(item)] ?? item.Name ?? null;
};

const parseQualifiedId = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value);
  const match = text.match(/^\(([A-Z]+)\)(.+)$/);
  return {
    type: match?.[1] ?? null,
    id: match?.[2] ?? text,
  };
};

const itemLabel = (value, objects, objectStrings, bigCraftables, bigCraftableStrings) => {
  const parsed = parseQualifiedId(value);
  if (!parsed) return null;
  if (parsed.id === 'DROP_IN') return '按输入变化';
  if (parsed.id.startsWith('-')) return `分类 ${parsed.id}`;

  if (!parsed.type || parsed.type === 'O') {
    return localizedObjectName(parsed.id, objects, objectStrings) ?? objects[parsed.id]?.Name ?? parsed.id;
  }

  if (parsed.type === 'BC') {
    return (
      localizedBigCraftableName(parsed.id, bigCraftables, bigCraftableStrings) ??
      bigCraftables[parsed.id]?.Name ??
      parsed.id
    );
  }

  const typeLabels = {
    B: '鞋子',
    W: '武器',
    H: '帽子',
    S: '鞋子',
    T: '工具',
  };
  return `${typeLabels[parsed.type] ?? parsed.type} ${parsed.id}`;
};

const unique = (items) => [...new Set(items.filter(Boolean))];
const preview = (items, limit = 6) => unique(items).slice(0, limit);

const locationLabels = {
  ArchaeologyHouse: '博物馆',
  Beach: '沙滩',
  Blacksmith: '铁匠铺',
  BusStop: '巴士站',
  CommunityCenter: '社区中心',
  Forest: '煤矿森林',
  HaleyHouse: '海莉和艾米丽家',
  Hospital: '诊所',
  JojaMart: 'Joja 超市',
  JoshHouse: '亚历克斯家',
  ManorHouse: '镇长庄园',
  Mountain: '深山',
  Saloon: '星之果实餐吧',
  SamHouse: '山姆家',
  SeedShop: '皮埃尔杂货店',
  Town: '鹈鹕镇',
  Trailer: '拖车',
};

const decodeXmlValue = (value) =>
  String(value ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const parseXmlAttributes = (text) => {
  const attributes = {};
  for (const match of text.matchAll(/([:\w-]+)="([^"]*)"/g)) {
    attributes[match[1]] = decodeXmlValue(match[2]);
  }
  return attributes;
};

const parsePropertiesBlock = (text) => {
  const properties = {};
  for (const match of text.matchAll(/<property\s+([^>]*?)\/>/g)) {
    const attributes = parseXmlAttributes(match[1]);
    if (attributes.name) {
      properties[attributes.name] = attributes.value ?? '';
    }
  }
  return properties;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatEdge = (x, y, width, height) => {
  if (x < 0) return '西侧出口';
  if (x >= width) return '东侧出口';
  if (y < 0) return '北侧出口';
  if (y >= height) return '南侧出口';
  return '出口';
};

const mapLabel = (id) => locationLabels[id] ?? id;

const parseLockedDoorWarp = (value) => {
  const parts = splitList(value);
  if (parts[0] !== 'LockedDoorWarp' || parts.length < 6) return null;
  return {
    targetX: Number(parts[1]),
    targetY: Number(parts[2]),
    targetMap: parts[3],
    openTime: Number(parts[4]),
    closeTime: Number(parts[5]),
  };
};

const describeAction = (value) => {
  const door = parseLockedDoorWarp(value);
  if (door) {
    return {
      type: 'door',
      label: `${mapLabel(door.targetMap)}入口`,
      target: {
        map: door.targetMap,
        mapLabel: mapLabel(door.targetMap),
        x: door.targetX,
        y: door.targetY,
      },
      hours: {
        open: door.openTime,
        close: door.closeTime,
      },
      groupKey: `door:${door.targetMap}`,
    };
  }

  if (value === 'WarpCommunityCenter') {
    return {
      type: 'door',
      label: '社区中心入口',
      target: { map: 'CommunityCenter', mapLabel: mapLabel('CommunityCenter') },
      groupKey: 'door:CommunityCenter',
    };
  }

  if (value === 'Bookseller') {
    return {
      type: 'shop',
      label: '书商摊位',
      groupKey: 'shop:Bookseller',
    };
  }

  if (value === 'IceCreamStand') {
    return {
      type: 'shop',
      label: '冰淇淋摊',
      groupKey: 'shop:IceCreamStand',
    };
  }

  if (value.startsWith('Garbage ')) {
    const target = value.replace('Garbage ', '');
    return {
      type: 'container',
      label: `垃圾桶：${mapLabel(target)}`,
      groupKey: `container:${target}`,
    };
  }

  if (value.startsWith('Billboard ')) {
    return {
      type: 'board',
      label: '公告栏',
      groupKey: `board:${value}`,
    };
  }

  if (value.startsWith('TownMailbox ')) {
    return {
      type: 'interaction',
      label: `信箱 ${value.replace('TownMailbox ', '')}`,
      groupKey: `mailbox:${value}`,
    };
  }

  if (value.startsWith('Message ')) {
    return {
      type: 'message',
      label: '提示牌',
      groupKey: `message:${value}`,
    };
  }

  if (value === 'EnterSewer') {
    return {
      type: 'door',
      label: '下水道入口',
      groupKey: 'door:Sewer',
    };
  }

  if (value === 'DwarfGrave') {
    return {
      type: 'interaction',
      label: '矮人墓碑',
      groupKey: 'interaction:DwarfGrave',
    };
  }

  return {
    type: 'interaction',
    label: '特殊互动点',
    groupKey: `interaction:${value}`,
  };
};

const splitList = (value) =>
  String(value ?? '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

const seasonOrder = ['Spring', 'Summer', 'Fall', 'Winter'];

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

const parseGiftTaste = (value) => {
  if (!value) {
    return {
      love: [],
      like: [],
      neutral: [],
      dislike: [],
      hate: [],
    };
  }

  const parts = String(value).split('/');
  if (parts.length < 2) {
    return {
      love: splitList(value),
      like: [],
      neutral: [],
      dislike: [],
      hate: [],
    };
  }

  return {
    love: splitList(parts[1]),
    like: splitList(parts[3]),
    neutral: splitList(parts[9]),
    dislike: splitList(parts[5]),
    hate: splitList(parts[7]),
  };
};

const buildVillagers = (characters, npcNames, giftTastes, objects, objectStrings, bigCraftables, bigCraftableStrings) =>
  Object.entries(characters)
    .map(([id, character]) => {
      const home = character.Home?.[0] ?? null;
      const gifts = parseGiftTaste(giftTastes[id]);
      const labelGiftItems = (items) =>
        preview(items.map((item) => itemLabel(item, objects, objectStrings, bigCraftables, bigCraftableStrings)), 8);

      return {
        id,
        nameZh: npcNames[id] ?? id,
        birthSeason: character.BirthSeason ?? null,
        birthDay: character.BirthDay ?? null,
        homeRegion: character.HomeRegion ?? null,
        gender: character.Gender ?? null,
        age: character.Age ?? null,
        canBeRomanced: Boolean(character.CanBeRomanced),
        canReceiveGifts: Boolean(character.CanReceiveGifts),
        homeLocation: home?.Location ?? null,
        homeTile: home?.Tile ? { x: home.Tile.X, y: home.Tile.Y } : null,
        familyIds: Object.keys(character.FriendsAndFamily ?? {}),
        giftCounts: {
          love: gifts.love.length,
          like: gifts.like.length,
          neutral: gifts.neutral.length,
          dislike: gifts.dislike.length,
          hate: gifts.hate.length,
        },
        lovedItems: labelGiftItems(gifts.love),
        likedItems: labelGiftItems(gifts.like),
      };
    })
    .sort((a, b) => {
      const seasonRank = (season) => {
        const index = seasonOrder.indexOf(season);
        return index === -1 ? 99 : index;
      };
      const dayRank = (day) => (day && day > 0 ? day : 99);
      const seasonDelta = seasonRank(a.birthSeason) - seasonRank(b.birthSeason);
      return seasonDelta || dayRank(a.birthDay) - dayRank(b.birthDay) || a.nameZh.localeCompare(b.nameZh);
    });

const buildMachines = (machines, objects, objectStrings, bigCraftables, bigCraftableStrings) =>
  Object.entries(machines)
    .map(([machineKey, machine]) => {
      const parsed = parseQualifiedId(machineKey);
      const id = parsed?.id ?? machineKey;
      const rules = machine.OutputRules ?? [];
      const triggers = rules.flatMap((rule) => rule.Triggers ?? []);
      const outputs = rules.flatMap((rule) => rule.OutputItem ?? []);
      const inputItems = triggers.map((trigger) =>
        itemLabel(trigger.RequiredItemId, objects, objectStrings, bigCraftables, bigCraftableStrings)
      );
      const inputTags = triggers.flatMap((trigger) =>
        (trigger.RequiredTags ?? []).filter((tag) => !tag.startsWith('!')).map((tag) => `标签 ${tag}`)
      );
      const outputItems = outputs.map((output) => {
        if (output.ItemId) {
          return itemLabel(output.ItemId, objects, objectStrings, bigCraftables, bigCraftableStrings);
        }
        if (output.RandomItemId) return '随机物品';
        if (output.PreserveId || output.OutputMethod) return '按输入变化';
        return null;
      });
      const readyTimes = rules.map((rule) => {
        if (rule.DaysUntilReady !== undefined && rule.DaysUntilReady > 0) return `${rule.DaysUntilReady} 天`;
        if (rule.MinutesUntilReady !== undefined && rule.MinutesUntilReady > 0) return `${rule.MinutesUntilReady} 分钟`;
        if (machine.OnlyCompleteOvernight) return '隔夜';
        return null;
      });

      return {
        id,
        key: machineKey,
        name: bigCraftables[id]?.Name ?? id,
        nameZh: localizedBigCraftableName(id, bigCraftables, bigCraftableStrings) ?? bigCraftables[id]?.Name ?? id,
        ruleCount: rules.length,
        inputSummary: preview([...inputItems, ...inputTags]),
        outputSummary: preview(outputItems),
        readyTimes: preview(readyTimes, 4),
        hasConditionalRules: rules.some(
          (rule) =>
            rule.Condition ||
            (rule.Triggers ?? []).some((trigger) => trigger.Condition) ||
            (rule.OutputItem ?? []).some((output) => output.Condition || output.PerItemCondition)
        ),
        hasRandomOutput: outputs.some(
          (output) =>
            output.RandomItemId ||
            output.MaxItems ||
            (output.MaxStack !== undefined && output.MaxStack > 0 && output.MaxStack !== output.MinStack)
        ),
      };
    })
    .sort((a, b) => a.nameZh.localeCompare(b.nameZh));

const buildShops = (shops, npcNames, objects, objectStrings, bigCraftables, bigCraftableStrings) =>
  Object.entries(shops)
    .map(([id, shop]) => {
      const items = shop.Items ?? [];
      const ownerNames = unique(
        (shop.Owners ?? [])
          .map((owner) => owner.Name ?? owner.Id)
          .filter((owner) => owner && !['None', 'AnyOrNone'].includes(owner))
          .map((owner) => npcNames[owner] ?? owner)
      );
      const sampleItems = items.map((item) =>
        itemLabel(item.ItemId ?? item.Id, objects, objectStrings, bigCraftables, bigCraftableStrings)
      );

      return {
        id,
        owners: ownerNames.length ? ownerNames : ['无固定店主'],
        itemCount: items.length,
        salableTagsCount: shop.SalableItemTags?.length ?? 0,
        pricedItemCount: items.filter((item) => item.Price > -1 || item.UseObjectDataPrice).length,
        conditionalItemCount: items.filter((item) => item.Condition || item.PerItemCondition).length,
        tradeItemCount: items.filter((item) => item.TradeItemId).length,
        limitedStockCount: items.filter((item) => item.AvailableStock !== undefined && item.AvailableStock > -1).length,
        sampleItems: preview(sampleItems),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

const groupPoints = (points) => {
  const buckets = new Map();

  for (const point of points) {
    const key = point.groupKey ?? `${point.type}:${point.label}:${point.x}:${point.y}`;
    const bucket = buckets.get(key) ?? {
      ...point,
      tiles: [],
    };
    bucket.tiles.push({ x: point.x, y: point.y });
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .map((point, index) => {
      const x = point.tiles.reduce((sum, tile) => sum + tile.x, 0) / point.tiles.length;
      const y = point.tiles.reduce((sum, tile) => sum + tile.y, 0) / point.tiles.length;
      const { groupKey, ...publicPoint } = point;
      return {
        ...publicPoint,
        id: `${publicPoint.type}-${index + 1}`,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        tileCount: point.tiles.length,
      };
    })
    .sort((a, b) => a.y - b.y || a.x - b.x || a.label.localeCompare(b.label));
};

const parseWarpPoints = (value, mapInfo) => {
  const parts = splitList(value);
  const points = [];
  for (let index = 0; index + 4 < parts.length; index += 5) {
    const x = Number(parts[index]);
    const y = Number(parts[index + 1]);
    const targetMap = parts[index + 2];
    const targetX = Number(parts[index + 3]);
    const targetY = Number(parts[index + 4]);
    points.push({
      type: 'exit',
      label: `${formatEdge(x, y, mapInfo.width, mapInfo.height)}：${mapLabel(targetMap)}`,
      x: clamp(x, 0, mapInfo.width - 1),
      y: clamp(y, 0, mapInfo.height - 1),
      target: {
        map: targetMap,
        mapLabel: mapLabel(targetMap),
        x: targetX,
        y: targetY,
      },
      groupKey: `exit:${targetMap}:${targetX}:${targetY}`,
    });
  }
  return points;
};

const buildMapPilot = async (mapId, fileName, displayName) => {
  const text = await readFile(path.join(mapsDir, fileName), 'utf8');
  const mapAttributes = parseXmlAttributes(text.match(/<map\s+([^>]+)>/)?.[1] ?? '');
  const mapInfo = {
    id: mapId,
    name: displayName,
    width: Number(mapAttributes.width),
    height: Number(mapAttributes.height),
    tileWidth: Number(mapAttributes.tilewidth),
    tileHeight: Number(mapAttributes.tileheight),
  };
  const rootProperties = parsePropertiesBlock(text.match(/<map\b[^>]*>\s*<properties>([\s\S]*?)<\/properties>/)?.[1] ?? '');
  const points = [];

  if (rootProperties.Warp) {
    points.push(...parseWarpPoints(rootProperties.Warp, mapInfo));
  }

  for (const groupMatch of text.matchAll(/<objectgroup\s+([^>]*?)>([\s\S]*?)<\/objectgroup>/g)) {
    const groupAttributes = parseXmlAttributes(groupMatch[1]);
    const layer = groupAttributes.name ?? 'unknown';
    const body = groupMatch[2];
    for (const objectMatch of body.matchAll(/<object\s+([^>]*?)>([\s\S]*?)<\/object>/g)) {
      const objectAttributes = parseXmlAttributes(objectMatch[1]);
      const properties = parsePropertiesBlock(objectMatch[2]);
      const x = Number(objectAttributes.x) / mapInfo.tileWidth;
      const y = Number(objectAttributes.y) / mapInfo.tileHeight;

      for (const propertyName of ['Action', 'TouchAction']) {
        if (!properties[propertyName]) continue;
        points.push({
          ...describeAction(properties[propertyName]),
          x,
          y,
          layer,
          property: propertyName,
        });
      }

      if (properties.NPCBarrier) {
        points.push({
          type: 'barrier',
          label: 'NPC 路线障碍',
          x,
          y,
          layer,
          property: 'NPCBarrier',
          groupKey: `barrier:${x}:${y}`,
        });
      }
    }
  }

  const groupedPoints = groupPoints(points);
  return {
    ...mapInfo,
    pointCount: groupedPoints.length,
    counts: groupedPoints.reduce((counts, point) => {
      counts[point.type] = (counts[point.type] ?? 0) + 1;
      return counts;
    }, {}),
    points: groupedPoints,
  };
};

const writeJson = async (fileName, data) => {
  const filePath = path.join(outputRoot, fileName);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const main = async () => {
  const [
    objects,
    objectStrings,
    bigCraftables,
    bigCraftableStrings,
    npcNames,
    crops,
    fish,
    characters,
    giftTastes,
    shops,
    machines,
    bundles,
  ] = await Promise.all([
    readJson(dataDir, 'Objects.json'),
    readJson(stringsDir, 'Objects.zh-CN.json'),
    readJson(dataDir, 'BigCraftables.json'),
    readJson(stringsDir, 'BigCraftables.zh-CN.json'),
    readJson(stringsDir, 'NPCNames.zh-CN.json'),
    readJson(dataDir, 'Crops.json'),
    readJson(dataDir, 'Fish.json'),
    readJson(dataDir, 'Characters.json'),
    readJson(dataDir, 'NPCGiftTastes.json'),
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
  const villagerRows = buildVillagers(
    characters,
    npcNames,
    giftTastes,
    objects,
    objectStrings,
    bigCraftables,
    bigCraftableStrings
  );
  const machineRows = buildMachines(machines, objects, objectStrings, bigCraftables, bigCraftableStrings);
  const shopRows = buildShops(shops, npcNames, objects, objectStrings, bigCraftables, bigCraftableStrings);
  const townMap = await buildMapPilot('town', 'Town.tmx', '鹈鹕镇');

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
    files: ['crops.json', 'fish.json', 'villagers.json', 'machines.json', 'shops.json', 'maps/town.json'],
  });
  await writeJson('crops.json', cropRows);
  await writeJson('fish.json', fishRows);
  await writeJson('villagers.json', villagerRows);
  await writeJson('machines.json', machineRows);
  await writeJson('shops.json', shopRows);
  await writeJson('maps/town.json', townMap);

  console.log(`Generated Stardew Valley data in ${path.relative(repoRoot, outputRoot)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
