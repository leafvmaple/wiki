import assets from '../data/stardew-valley/generated/assets.json';
import bundles from '../data/stardew-valley/generated/bundles.json';
import crops from '../data/stardew-valley/generated/crops.json';
import fish from '../data/stardew-valley/generated/fish.json';
import machines from '../data/stardew-valley/generated/machines.json';
import villagers from '../data/stardew-valley/generated/villagers.json';
import { displayGiftItems } from './stardewGiftLabels';

type Row = Record<string, any>;

export type StardewEntityRouteKind = 'items' | 'npcs' | 'machines';

export type StardewEntityCard = {
  title: string;
  kicker: string;
  body: string;
  stats: string[];
  href?: string;
};

export type StardewEntityTable = {
  columns: string[];
  rows: string[][];
};

export type StardewEntitySection = {
  title: string;
  body?: string;
  list?: string[];
  table?: StardewEntityTable;
};

export type StardewEntityField = {
  label: string;
  value: string;
};

export type StardewEntityPage = {
  routeKind: StardewEntityRouteKind;
  slug: string;
  href: string;
  id: string;
  title: string;
  kicker: string;
  summary: string;
  stats: string[];
  fields: StardewEntityField[];
  sections: StardewEntitySection[];
  links: { label: string; href: string }[];
  aliases: string[];
  iconKind: string;
  assetKind: 'object' | 'npc' | 'machine';
  assetId?: string;
  assetLabel?: string;
  imageSrc?: string;
};

type LookupInput = {
  kind?: string;
  label?: string;
  assetId?: string | number;
  assetKind?: string;
  assetLabel?: string;
};

type ObjectHints = {
  id: string;
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

const genderLabels: Record<string, string> = {
  Male: '男性',
  Female: '女性',
  Undefined: '未标注',
};

const ageLabels: Record<string, string> = {
  Adult: '成人',
  Teen: '青少年',
  Child: '儿童',
};

const objectHints = new Map<string, ObjectHints>();
const entitiesByHref = new Map<string, StardewEntityPage>();
const entitiesByLookup = {
  itemId: new Map<string, StardewEntityPage>(),
  itemLabel: new Map<string, StardewEntityPage>(),
  npcId: new Map<string, StardewEntityPage>(),
  npcLabel: new Map<string, StardewEntityPage>(),
  machineId: new Map<string, StardewEntityPage>(),
  machineLabel: new Map<string, StardewEntityPage>(),
};

const normalize = (value?: string | number | null) => String(value ?? '').trim().toLowerCase();
const clean = (value?: string | number | null) => String(value ?? '').trim();
const unique = (items: string[]) => [...new Set(items.filter(Boolean).map((item) => clean(item)).filter(Boolean))];
const gold = (value?: number | null) => (Number.isFinite(Number(value)) ? `${Math.round(Number(value))}g` : '-');
const signedGold = (value?: number | null) => {
  if (!Number.isFinite(Number(value))) return '-';
  const rounded = Math.round(Number(value));
  return `${rounded > 0 ? '+' : ''}${rounded}g`;
};
const yesNo = (value?: boolean) => (value ? '是' : '否');

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
  const all = displayGiftItems(items);
  const visible = all.slice(0, limit);
  const more = all.length - visible.length;
  if (!visible.length) return '';
  return `${visible.join('、')}${more > 0 ? ` 等 ${all.length} 项` : ''}`;
};

const slugPart = (value: string) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const entitySlug = (value: string) => slugPart(value) || encodeURIComponent(clean(value)).toLowerCase();

const field = (label: string, value: unknown): StardewEntityField | null => {
  const text = Array.isArray(value) ? value.filter(Boolean).join('、') : clean(value as string | number | null | undefined);
  if (!text || text === '-') return null;
  return { label, value: text };
};

const fields = (items: (StardewEntityField | null)[]) => items.filter(Boolean) as StardewEntityField[];

const assetFor = (entity: Pick<StardewEntityPage, 'assetKind' | 'assetId' | 'assetLabel' | 'title'>) => {
  const id = clean(entity.assetId);
  if (entity.assetKind === 'npc') {
    return assets.npcsById[id as keyof typeof assets.npcsById];
  }
  if (entity.assetKind === 'machine') {
    return assets.bigCraftablesById[id as keyof typeof assets.bigCraftablesById];
  }
  return (
    assets.objectsById[id as keyof typeof assets.objectsById] ??
    assets.labels[normalize(entity.assetLabel) as keyof typeof assets.labels] ??
    assets.labels[normalize(entity.title) as keyof typeof assets.labels]
  );
};

const hintForObject = (id: string | number | undefined, label?: string) => {
  const cleanId = clean(id);
  if (!cleanId) return null;
  const existing = objectHints.get(cleanId);
  if (existing) {
    if (!existing.label && label) existing.label = label;
    return existing;
  }
  const hint = { id: cleanId, label: label ?? cleanId, bundles: [], machineInputs: [], machineOutputs: [] };
  objectHints.set(cleanId, hint);
  return hint;
};

const register = (entity: StardewEntityPage) => {
  entity.imageSrc = assetFor(entity);
  entitiesByHref.set(entity.href, entity);

  const labels = unique([entity.title, entity.assetLabel ?? '', ...entity.aliases]);
  if (entity.routeKind === 'items') {
    if (entity.id) entitiesByLookup.itemId.set(entity.id, entity);
    for (const label of labels) entitiesByLookup.itemLabel.set(normalize(label), entity);
  }
  if (entity.routeKind === 'npcs') {
    if (entity.id) entitiesByLookup.npcId.set(entity.id, entity);
    for (const label of labels) entitiesByLookup.npcLabel.set(normalize(label), entity);
  }
  if (entity.routeKind === 'machines') {
    if (entity.id) entitiesByLookup.machineId.set(entity.id, entity);
    for (const label of labels) entitiesByLookup.machineLabel.set(normalize(label), entity);
  }
};

const upsertItem = (entity: StardewEntityPage) => {
  const existing = entitiesByLookup.itemId.get(entity.id);
  if (!existing) {
    register(entity);
    return entity;
  }

  existing.stats = unique([...existing.stats, ...entity.stats]).slice(0, 6);
  existing.fields = fields([...existing.fields, ...entity.fields]);
  existing.sections = [...existing.sections, ...entity.sections];
  existing.links = [...existing.links, ...entity.links].filter(
    (link, index, all) => all.findIndex((item) => item.href === link.href && item.label === link.label) === index
  );
  existing.aliases = unique([...existing.aliases, ...entity.aliases]);
  for (const alias of existing.aliases) entitiesByLookup.itemLabel.set(normalize(alias), existing);
  return existing;
};

const buildItemHref = (id: string) => `/games/stardew-valley/entities/items/${entitySlug(id)}/`;
const buildNpcHref = (id: string) => `/games/stardew-valley/entities/npcs/${entitySlug(id)}/`;
const buildMachineHref = (id: string) => `/games/stardew-valley/entities/machines/${entitySlug(id)}/`;

for (const bundle of bundles as Row[]) {
  for (const item of (bundle.items ?? []) as Row[]) {
    hintForObject(item.itemId, item.label)?.bundles.push(bundle.nameZh);
  }
}

for (const machine of machines as Row[]) {
  for (const rule of (machine.profitRules ?? []) as Row[]) {
    hintForObject(rule.inputItemId, rule.inputLabel)?.machineInputs.push(
      `${rule.machineNameZh}加工为${rule.outputLabel} ${signedGold(rule.baseProfit)}`
    );
    hintForObject(rule.outputItemId, rule.outputLabel)?.machineOutputs.push(`${rule.machineNameZh}：由${rule.inputLabel}加工`);
  }
}

for (const crop of crops as Row[]) {
  const seasonText = formatSeasons(crop.seasons);
  const profit =
    Number.isFinite(crop.averageHarvestBaseValue) && Number.isFinite(crop.seedBasePrice)
      ? crop.averageHarvestBaseValue - crop.seedBasePrice
      : null;

  upsertItem({
    routeKind: 'items',
    slug: entitySlug(crop.seedId),
    href: buildItemHref(crop.seedId),
    id: clean(crop.seedId),
    title: crop.seedNameZh ?? crop.seedName,
    kicker: `种子 · ${seasonText}`,
    summary: `${crop.growDays} 天成熟，${formatRegrow(crop.regrowDays)}。`,
    stats: unique([
      `种子基价 ${gold(crop.seedBasePrice)}`,
      `收获 ${crop.harvestNameZh ?? crop.harvestName}`,
      profit !== null ? `基础差值 ${signedGold(profit)}` : '',
    ]),
    fields: fields([
      field('类型', '种子'),
      field('季节', seasonText),
      field('成熟天数', `${crop.growDays} 天`),
      field('再生', formatRegrow(crop.regrowDays)),
      field('需要浇水', yesNo(crop.needsWatering)),
      field('种子基价', gold(crop.seedBasePrice)),
      field('收获物', crop.harvestNameZh ?? crop.harvestName),
    ]),
    sections: [
      {
        title: '种植信息',
        list: unique([
          `生长阶段：${(crop.daysInPhase ?? []).join(' / ') || '-'}`,
          `收获数量：${
            crop.harvestMinStack === crop.harvestMaxStack
              ? crop.harvestMinStack
              : `${crop.harvestMinStack}-${crop.harvestMaxStack}`
          }`,
          `收获基础估值：${gold(crop.averageHarvestBaseValue)}`,
          profit !== null ? `单次基础差值：${signedGold(profit)}` : '',
        ]),
      },
    ],
    links: [
      { label: '作物索引', href: '/games/stardew-valley/crops/' },
      { label: crop.harvestNameZh ?? crop.harvestName, href: buildItemHref(crop.harvestItemId) },
    ],
    aliases: unique([crop.seedName, crop.seedNameZh]),
    iconKind: 'crop',
    assetKind: 'object',
    assetId: clean(crop.seedId),
  });

  upsertItem({
    routeKind: 'items',
    slug: entitySlug(crop.harvestItemId),
    href: buildItemHref(crop.harvestItemId),
    id: clean(crop.harvestItemId),
    title: crop.harvestNameZh ?? crop.harvestName,
    kicker: `作物 · ${seasonText}`,
    summary: `${crop.growDays} 天成熟，${formatRegrow(crop.regrowDays)}。`,
    stats: unique([
      `基础售价 ${gold(crop.harvestBasePrice)}`,
      crop.harvestMinStack === crop.harvestMaxStack
        ? `收获数量 ${crop.harvestMinStack}`
        : `收获数量 ${crop.harvestMinStack}-${crop.harvestMaxStack}`,
      profit !== null ? `种植差值 ${signedGold(profit)}` : '',
    ]),
    fields: fields([
      field('类型', '作物'),
      field('季节', seasonText),
      field('成熟天数', `${crop.growDays} 天`),
      field('基础售价', gold(crop.harvestBasePrice)),
      field('对应种子', crop.seedNameZh ?? crop.seedName),
    ]),
    sections: [
      {
        title: '收获信息',
        list: unique([
          `平均基础收获估值：${gold(crop.averageHarvestBaseValue)}`,
          `种子基价：${gold(crop.seedBasePrice)}`,
          profit !== null ? `单次基础差值：${signedGold(profit)}` : '',
        ]),
      },
    ],
    links: [
      { label: '作物索引', href: '/games/stardew-valley/crops/' },
      { label: crop.seedNameZh ?? crop.seedName, href: buildItemHref(crop.seedId) },
    ],
    aliases: unique([crop.harvestName, crop.harvestNameZh]),
    iconKind: 'item',
    assetKind: 'object',
    assetId: clean(crop.harvestItemId),
  });
}

for (const item of fish as Row[]) {
  upsertItem({
    routeKind: 'items',
    slug: entitySlug(item.id),
    href: buildItemHref(item.id),
    id: clean(item.id),
    title: item.nameZh ?? item.name,
    kicker: `鱼类 · ${methodLabels[item.method] ?? item.method}`,
    summary: `${formatSeasons(item.seasons)}，${weatherLabels[item.weather] ?? item.weather ?? '不限天气'}，${formatTimeRanges(
      item.timeRanges
    )}。`,
    stats: unique([
      `难度 ${item.difficulty ?? '-'}`,
      `基价 ${gold(item.basePrice)}`,
      item.minFishingLevel ? `钓鱼等级 ${item.minFishingLevel}+` : '',
    ]),
    fields: fields([
      field('类型', '鱼类'),
      field('获取方式', methodLabels[item.method] ?? item.method),
      field('季节', formatSeasons(item.seasons)),
      field('时间', formatTimeRanges(item.timeRanges)),
      field('天气', weatherLabels[item.weather] ?? item.weather),
      field('难度', item.difficulty),
      field('基础售价', gold(item.basePrice)),
      field('尺寸', `${item.minSize}-${item.maxSize}`),
      field('钓鱼等级', item.minFishingLevel ? `${item.minFishingLevel}+` : ''),
    ]),
    sections: [
      {
        title: '出现地点',
        list: (item.locationCodes ?? []).map((location: Row) =>
          location.chance ? `地点代码 ${location.code}，权重 ${location.chance}` : `地点代码 ${location.code}`
        ),
      },
    ],
    links: [{ label: '鱼类索引', href: '/games/stardew-valley/fishing/' }],
    aliases: unique([item.name, item.nameZh]),
    iconKind: 'fish',
    assetKind: 'object',
    assetId: clean(item.id),
  });
}

for (const machine of machines as Row[]) {
  const inputSummary = firstItems(machine.inputSummary, 3) || '可接收输入';
  const outputSummary = firstItems(machine.outputSummary, 3) || '产出物';
  const profitRows = ((machine.profitRules ?? []) as Row[]).map((rule) => [
    rule.inputLabel ?? '-',
    `${rule.inputCount ?? 1}`,
    rule.outputLabel ?? '-',
    `${rule.outputCount ?? 1}`,
    rule.readyLabel ?? '-',
    signedGold(rule.baseProfit),
  ]);

  register({
    routeKind: 'machines',
    slug: entitySlug(machine.id),
    href: buildMachineHref(machine.id),
    id: clean(machine.id),
    title: machine.nameZh ?? machine.name,
    kicker: '机器',
    summary: `输入：${inputSummary}；输出：${outputSummary}。`,
    stats: unique([
      `${machine.ruleCount ?? 0} 条规则`,
      machine.profitRuleCount ? `${machine.profitRuleCount} 条可计算收益` : '',
      machine.readyTimes?.length ? `时间 ${firstItems(machine.readyTimes, 2)}` : '',
      machine.hasRandomOutput ? '含随机输出' : '',
    ]),
    fields: fields([
      field('规则数', machine.ruleCount),
      field('可计算收益规则', machine.profitRuleCount),
      field('加工时间', firstItems(machine.readyTimes, 4)),
      field('条件规则', yesNo(machine.hasConditionalRules)),
      field('随机输出', yesNo(machine.hasRandomOutput)),
    ]),
    sections: [
      { title: '输入摘要', list: unique(machine.inputSummary ?? []) },
      { title: '输出摘要', list: unique(machine.outputSummary ?? []) },
      profitRows.length
        ? {
            title: '收益规则',
            table: {
              columns: ['输入', '数量', '输出', '数量', '时间', '基础差值'],
              rows: profitRows,
            },
          }
        : {
            title: '收益规则',
            body: '当前整理字段中没有可直接计算收益的规则。',
          },
    ],
    links: [{ label: '机器索引', href: '/games/stardew-valley/machines/' }],
    aliases: unique([machine.name, machine.nameZh, machine.key]),
    iconKind: 'machine',
    assetKind: 'machine',
    assetId: clean(machine.id),
  });
}

for (const villager of villagers as Row[]) {
  const birthday =
    villager.birthSeason && villager.birthDay
      ? `${seasonLabels[villager.birthSeason] ?? villager.birthSeason} ${villager.birthDay} 日`
      : '生日未收录';

  register({
    routeKind: 'npcs',
    slug: entitySlug(villager.id),
    href: buildNpcHref(villager.id),
    id: clean(villager.id),
    title: villager.nameZh ?? villager.id,
    kicker: `村民 · ${villager.homeRegion ?? '城镇'}`,
    summary: `${birthday}，${villager.canBeRomanced ? '可结婚' : '不可结婚'}。`,
    stats: unique([
      villager.homeLocation ? `常驻 ${villager.homeLocation}` : '',
      villager.giftCounts ? `最爱 ${villager.giftCounts.love} / 喜欢 ${villager.giftCounts.like}` : '',
      villager.lovedItems?.length ? `最爱示例 ${firstItems(villager.lovedItems, 2)}` : '',
    ]),
    fields: fields([
      field('生日', birthday),
      field('区域', villager.homeRegion),
      field('性别', genderLabels[villager.gender] ?? villager.gender),
      field('年龄', ageLabels[villager.age] ?? villager.age),
      field('可结婚', yesNo(villager.canBeRomanced)),
      field('可送礼', yesNo(villager.canReceiveGifts)),
      field('常驻位置', villager.homeTile ? `${villager.homeLocation} (${villager.homeTile.x}, ${villager.homeTile.y})` : villager.homeLocation),
      field('家庭关系', firstItems(villager.familyIds, 6)),
    ]),
    sections: [
      {
        title: '礼物摘要',
        table: {
          columns: ['偏好', '数量', '示例'],
          rows: [
            ['最爱', `${villager.giftCounts?.love ?? 0}`, firstItems(villager.lovedItems, 8) || '-'],
            ['喜欢', `${villager.giftCounts?.like ?? 0}`, firstItems(villager.likedItems, 8) || '-'],
            ['中立', `${villager.giftCounts?.neutral ?? 0}`, firstItems(villager.neutralItems, 8) || '-'],
            ['不喜欢', `${villager.giftCounts?.dislike ?? 0}`, firstItems(villager.dislikedItems, 8) || '-'],
            ['讨厌', `${villager.giftCounts?.hate ?? 0}`, firstItems(villager.hatedItems, 8) || '-'],
          ],
        },
      },
      {
        title: '人际关系',
        list: unique(villager.familyIds ?? []).length ? unique(villager.familyIds ?? []) : ['当前数据中没有收录家庭或关系条目。'],
      },
      {
        title: '日程与事件',
        list: [
          villager.homeLocation ? `常驻位置：${villager.homeLocation}` : '常驻位置未收录。',
          '逐日路线、雨天日程、节日日程、好感度事件和对白还没有接入生成数据。',
        ],
      },
    ],
    links: [{ label: '村民索引', href: '/games/stardew-valley/villagers/' }],
    aliases: unique([villager.id, villager.nameZh]),
    iconKind: 'npc',
    assetKind: 'npc',
    assetId: clean(villager.id),
  });
}

for (const hint of objectHints.values()) {
  const existing = entitiesByLookup.itemId.get(hint.id);
  const stats = unique([
    ...(existing?.stats ?? []),
    hint.bundles.length ? `收集包 ${firstItems(hint.bundles, 2)}` : '',
    hint.machineInputs.length ? `可加工 ${firstItems(hint.machineInputs, 2)}` : '',
    hint.machineOutputs.length ? `加工产物 ${firstItems(hint.machineOutputs, 2)}` : '',
  ]).slice(0, 6);

  const extraSections: StardewEntitySection[] = [
    hint.bundles.length ? { title: '收集包', list: unique(hint.bundles) } : null,
    hint.machineInputs.length ? { title: '作为输入', list: unique(hint.machineInputs) } : null,
    hint.machineOutputs.length ? { title: '作为产物', list: unique(hint.machineOutputs) } : null,
  ].filter(Boolean) as StardewEntitySection[];

  if (existing) {
    existing.stats = stats;
    existing.sections = [...existing.sections, ...extraSections];
    continue;
  }

  upsertItem({
    routeKind: 'items',
    slug: entitySlug(hint.id),
    href: buildItemHref(hint.id),
    id: hint.id,
    title: hint.label,
    kicker: '物品',
    summary: firstItems([...hint.machineInputs, ...hint.machineOutputs, ...hint.bundles], 2) || '站内已收录条目。',
    stats,
    fields: fields([field('类型', '物品'), field('物品 ID', hint.id)]),
    sections: extraSections,
    links: [
      { label: '攻略工具', href: '/games/stardew-valley/tools/' },
      { label: '机器索引', href: '/games/stardew-valley/machines/' },
    ],
    aliases: unique([hint.label]),
    iconKind: 'item',
    assetKind: 'object',
    assetId: hint.id,
  });
}

export const stardewEntityPages = [...entitiesByHref.values()].sort((a, b) => {
  const kindOrder = { items: 0, npcs: 1, machines: 2 };
  return kindOrder[a.routeKind] - kindOrder[b.routeKind] || a.title.localeCompare(b.title, 'zh-CN');
});

export const getStardewEntityByRoute = (routeKind: string | undefined, slug: string | undefined) =>
  stardewEntityPages.find((entity) => entity.routeKind === routeKind && entity.slug === slug) ?? null;

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
  let entity: StardewEntityPage | undefined;

  if (lookupKind === 'npc') {
    entity = entitiesByLookup.npcId.get(id) ?? entitiesByLookup.npcLabel.get(labelKey) ?? entitiesByLookup.npcLabel.get(assetLabelKey);
  } else if (lookupKind === 'machine' || lookupKind === 'big-craftable') {
    entity = entitiesByLookup.machineId.get(id) ?? entitiesByLookup.machineLabel.get(labelKey) ?? entitiesByLookup.machineLabel.get(assetLabelKey);
  } else if (lookupKind === 'object' || lookupKind === 'item' || lookupKind === 'crop' || lookupKind === 'fish') {
    entity = entitiesByLookup.itemId.get(id) ?? entitiesByLookup.itemLabel.get(labelKey) ?? entitiesByLookup.itemLabel.get(assetLabelKey);
  } else {
    entity =
      entitiesByLookup.itemLabel.get(labelKey) ??
      entitiesByLookup.npcLabel.get(labelKey) ??
      entitiesByLookup.machineLabel.get(labelKey) ??
      entitiesByLookup.itemLabel.get(assetLabelKey);
  }

  return entity
    ? {
        title: entity.title,
        kicker: entity.kicker,
        body: entity.summary,
        stats: entity.stats,
        href: entity.href,
      }
    : null;
};
