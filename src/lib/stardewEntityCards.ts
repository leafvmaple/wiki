import bundles from '../data/stardew-valley/generated/bundles.json';
import crops from '../data/stardew-valley/generated/crops.json';
import fish from '../data/stardew-valley/generated/fish.json';
import machines from '../data/stardew-valley/generated/machines.json';
import villagers from '../data/stardew-valley/generated/villagers.json';

type Row = Record<string, any>;

export type StardewEntityCard = {
  title: string;
  kicker: string;
  body: string;
  stats: string[];
  href?: string;
};

type LookupInput = {
  kind?: string;
  label?: string;
  assetId?: string | number;
  assetKind?: string;
  assetLabel?: string;
};

type ObjectHints = {
  label: string;
  bundles: string[];
  machineInputs: string[];
  machineOutputs: string[];
};

const seasonLabels: Record<string, string> = {
  Spring: '春',
  Summer: '夏',
  Fall: '秋',
  Winter: '冬',
  spring: '春',
  summer: '夏',
  fall: '秋',
  winter: '冬',
};

const weatherLabels: Record<string, string> = {
  sunny: '晴天',
  rainy: '雨天',
  both: '不限天气',
};

const methodLabels: Record<string, string> = {
  rod: '钓竿',
  trap: '蟹笼',
};

const objectCardsById = new Map<string, StardewEntityCard>();
const objectCardsByLabel = new Map<string, StardewEntityCard>();
const npcCardsById = new Map<string, StardewEntityCard>();
const npcCardsByLabel = new Map<string, StardewEntityCard>();
const machineCardsById = new Map<string, StardewEntityCard>();
const machineCardsByLabel = new Map<string, StardewEntityCard>();
const objectHints = new Map<string, ObjectHints>();

const normalize = (value?: string | number | null) => String(value ?? '').trim().toLowerCase();
const clean = (value?: string | number | null) => String(value ?? '').trim();
const unique = (items: string[]) => [...new Set(items.filter(Boolean))];
const gold = (value?: number | null) => (Number.isFinite(Number(value)) ? `${Math.round(Number(value))}g` : '-');
const signedGold = (value?: number | null) => {
  if (!Number.isFinite(Number(value))) return '-';
  const rounded = Math.round(Number(value));
  return `${rounded > 0 ? '+' : ''}${rounded}g`;
};

const formatSeasons = (items?: string[]) =>
  items?.length ? items.map((item) => seasonLabels[item] ?? item).join('、') : '不限季节';

const formatTime = (value: unknown) => {
  const time = Number(value);
  if (!Number.isFinite(time)) return '-';
  const hour = Math.floor(time / 100);
  const minute = time % 100;
  const displayHour = hour >= 24 ? hour - 24 : hour;
  const suffix = hour >= 24 ? ' +1' : '';
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}${suffix}`;
};

const formatTimeRanges = (ranges?: Row[]) =>
  ranges?.length ? ranges.map((range) => `${formatTime(range.start)}-${formatTime(range.end)}`).join('、') : '全天';

const formatRegrow = (days?: number) => (days && days > 0 ? `再生 ${days} 天` : '一次性收获');

const firstItems = (items?: string[], limit = 3) => {
  const visible = unique(items ?? []).slice(0, limit);
  const more = unique(items ?? []).length - visible.length;
  return `${visible.join('、')}${more > 0 ? ` 等 ${unique(items ?? []).length} 项` : ''}`;
};

const setObjectCard = (id: string | number | undefined, labels: (string | undefined)[], card: StardewEntityCard) => {
  const cleanId = clean(id);
  if (cleanId) objectCardsById.set(cleanId, card);
  for (const label of labels) {
    const key = normalize(label);
    if (key) objectCardsByLabel.set(key, card);
  }
};

const setNpcCard = (id: string | number | undefined, labels: (string | undefined)[], card: StardewEntityCard) => {
  const cleanId = clean(id);
  if (cleanId) npcCardsById.set(cleanId, card);
  for (const label of labels) {
    const key = normalize(label);
    if (key) npcCardsByLabel.set(key, card);
  }
};

const setMachineCard = (id: string | number | undefined, labels: (string | undefined)[], card: StardewEntityCard) => {
  const cleanId = clean(id);
  if (cleanId) machineCardsById.set(cleanId, card);
  for (const label of labels) {
    const key = normalize(label);
    if (key) machineCardsByLabel.set(key, card);
  }
};

const hintForObject = (id: string | number | undefined, label?: string) => {
  const cleanId = clean(id);
  if (!cleanId) return null;
  const existing = objectHints.get(cleanId);
  if (existing) {
    if (!existing.label && label) existing.label = label;
    return existing;
  }
  const hint = { label: label ?? cleanId, bundles: [], machineInputs: [], machineOutputs: [] };
  objectHints.set(cleanId, hint);
  return hint;
};

for (const bundle of bundles as Row[]) {
  for (const item of (bundle.items ?? []) as Row[]) {
    hintForObject(item.itemId, item.label)?.bundles.push(bundle.nameZh);
  }
}

for (const machine of machines as Row[]) {
  const inputSummary = firstItems(machine.inputSummary, 2) || '可接收输入';
  const outputSummary = firstItems(machine.outputSummary, 2) || '产出物';
  const card: StardewEntityCard = {
    title: machine.nameZh ?? machine.name,
    kicker: '机器',
    body: `输入：${inputSummary}；输出：${outputSummary}。`,
    stats: unique([
      `${machine.ruleCount ?? 0} 条规则`,
      machine.profitRuleCount ? `${machine.profitRuleCount} 条可计算收益` : '',
      machine.readyTimes?.length ? `时间 ${firstItems(machine.readyTimes, 2)}` : '',
      machine.hasRandomOutput ? '含随机输出' : '',
    ]),
    href: '/games/stardew-valley/machines/',
  };
  setMachineCard(machine.id, [machine.nameZh, machine.name], card);

  for (const rule of (machine.profitRules ?? []) as Row[]) {
    hintForObject(rule.inputItemId, rule.inputLabel)?.machineInputs.push(
      `${rule.machineNameZh}加工为${rule.outputLabel} ${signedGold(rule.baseProfit)}`
    );
    hintForObject(rule.outputItemId, rule.outputLabel)?.machineOutputs.push(
      `${rule.machineNameZh}：由${rule.inputLabel}加工`
    );
  }
}

for (const crop of crops as Row[]) {
  const seasonText = formatSeasons(crop.seasons);
  const profit =
    Number.isFinite(crop.averageHarvestBaseValue) && Number.isFinite(crop.seedBasePrice)
      ? crop.averageHarvestBaseValue - crop.seedBasePrice
      : null;

  setObjectCard(crop.seedId, [crop.seedNameZh, crop.seedName], {
    title: crop.seedNameZh ?? crop.seedName,
    kicker: `种子 · ${seasonText}`,
    body: `${crop.growDays} 天成熟，${formatRegrow(crop.regrowDays)}。`,
    stats: unique([
      `种子基价 ${gold(crop.seedBasePrice)}`,
      `收获 ${crop.harvestNameZh ?? crop.harvestName}`,
      profit !== null ? `基础差值 ${signedGold(profit)}` : '',
    ]),
    href: '/games/stardew-valley/crops/',
  });

  setObjectCard(crop.harvestItemId, [crop.harvestNameZh, crop.harvestName], {
    title: crop.harvestNameZh ?? crop.harvestName,
    kicker: `作物 · ${seasonText}`,
    body: `${crop.growDays} 天成熟，${formatRegrow(crop.regrowDays)}。`,
    stats: unique([
      `基础售价 ${gold(crop.harvestBasePrice)}`,
      crop.harvestMinStack === crop.harvestMaxStack
        ? `收获数量 ${crop.harvestMinStack}`
        : `收获数量 ${crop.harvestMinStack}-${crop.harvestMaxStack}`,
      profit !== null ? `种植差值 ${signedGold(profit)}` : '',
    ]),
    href: '/games/stardew-valley/crops/',
  });
}

for (const item of fish as Row[]) {
  setObjectCard(item.id, [item.nameZh, item.name], {
    title: item.nameZh ?? item.name,
    kicker: `鱼类 · ${methodLabels[item.method] ?? item.method}`,
    body: `${formatSeasons(item.seasons)}，${weatherLabels[item.weather] ?? item.weather ?? '不限天气'}，${formatTimeRanges(
      item.timeRanges
    )}。`,
    stats: unique([
      `难度 ${item.difficulty ?? '-'}`,
      `基价 ${gold(item.basePrice)}`,
      item.minFishingLevel ? `钓鱼等级 ${item.minFishingLevel}+` : '',
      item.locationCodes?.length ? `地点代码 ${firstItems(item.locationCodes.map((location: Row) => location.code), 3)}` : '',
    ]),
    href: '/games/stardew-valley/fishing/',
  });
}

for (const villager of villagers as Row[]) {
  const birthday =
    villager.birthSeason && villager.birthDay
      ? `${seasonLabels[villager.birthSeason] ?? villager.birthSeason} ${villager.birthDay} 日`
      : '生日未收录';
  const card: StardewEntityCard = {
    title: villager.nameZh ?? villager.id,
    kicker: `村民 · ${villager.homeRegion ?? '城镇'}`,
    body: `${birthday}，${villager.canBeRomanced ? '可结婚' : '不可结婚'}。`,
    stats: unique([
      villager.homeLocation ? `常驻 ${villager.homeLocation}` : '',
      villager.giftCounts ? `最爱 ${villager.giftCounts.love} / 喜欢 ${villager.giftCounts.like}` : '',
      villager.lovedItems?.length ? `最爱示例 ${firstItems(villager.lovedItems, 2)}` : '',
    ]),
    href: '/games/stardew-valley/villagers/',
  };
  setNpcCard(villager.id, [villager.nameZh, villager.id], card);
}

for (const [id, hints] of objectHints) {
  const existing = objectCardsById.get(id);
  const stats = unique([
    ...(existing?.stats ?? []),
    hints.bundles.length ? `收集包 ${firstItems(hints.bundles, 2)}` : '',
    hints.machineInputs.length ? `可加工 ${firstItems(hints.machineInputs, 2)}` : '',
    hints.machineOutputs.length ? `加工产物 ${firstItems(hints.machineOutputs, 2)}` : '',
  ]);
  const card: StardewEntityCard = existing
    ? { ...existing, stats: stats.slice(0, 5) }
    : {
        title: hints.label,
        kicker: '物品',
        body: firstItems([...hints.machineInputs, ...hints.machineOutputs, ...hints.bundles], 2) || '站内已收录条目。',
        stats: stats.slice(0, 5),
        href: '/games/stardew-valley/tools/',
      };
  setObjectCard(id, [hints.label], card);
}

export const getStardewEntityCard = ({
  kind,
  label,
  assetId,
  assetKind,
  assetLabel,
}: LookupInput): StardewEntityCard | null => {
  const lookupKind = assetKind ?? kind;
  const id = clean(assetId);
  const labelKey = normalize(label);
  const assetLabelKey = normalize(assetLabel);

  if (lookupKind === 'npc') {
    return npcCardsById.get(id) ?? npcCardsByLabel.get(labelKey) ?? npcCardsByLabel.get(assetLabelKey) ?? null;
  }

  if (lookupKind === 'machine' || lookupKind === 'big-craftable') {
    return machineCardsById.get(id) ?? machineCardsByLabel.get(labelKey) ?? null;
  }

  if (lookupKind === 'object' || lookupKind === 'item' || lookupKind === 'crop' || lookupKind === 'fish') {
    return objectCardsById.get(id) ?? objectCardsByLabel.get(labelKey) ?? objectCardsByLabel.get(assetLabelKey) ?? null;
  }

  return (
    objectCardsByLabel.get(labelKey) ??
    npcCardsByLabel.get(labelKey) ??
    machineCardsByLabel.get(labelKey) ??
    objectCardsByLabel.get(assetLabelKey) ??
    null
  );
};
