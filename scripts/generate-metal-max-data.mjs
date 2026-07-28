import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 重装机兵（メタルマックス, FC 日版）装备数据生成。
// 数据源是 nes_decoder 逆向管线的两份导出（均为本机私有仓库，wiki 只提交派生表）：
//   map_viewer/res/metal_max/data/items.json   — 名称(ja/zh)、价格、分类
//   metalmax-godot/import/items.json           — 人类装备数值、部位、可装备角色掩码
//   metalmax-godot/import/tanks.json           — 战车部件数值 + 18 辆战车基础表
// 字段依据：nes_decoder/docs/re/METAL_MAX_TANK_PARTS.md
//   装备自重 0.1t / 引擎载重 t / 车体重量 0.01t；装甲上限 = 引擎载重的剩余量。

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const mapViewerRoot = path.resolve(process.env.MM_MAP_VIEWER_DIR ?? 'D:/Code/map_viewer');
const godotRoot = path.resolve(process.env.MM_GODOT_DIR ?? 'D:/Code/metalmax-godot');
const rseRoot = path.resolve(process.env.MM_RSE_DIR ?? 'D:/Game/retro-save-editor');
const outputRoot = path.join(repoRoot, 'src/data/metal-max/generated');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

const mvItems = (await readJson(path.join(mapViewerRoot, 'res/metal_max/data/items.json'))).items;
const gdItems = (await readJson(path.join(godotRoot, 'import/items.json'))).items;
const tanks = await readJson(path.join(godotRoot, 'import/tanks.json'));

const hex = (id) => id.toString(16).toUpperCase().padStart(2, '0');
const mv = (id) => {
  const entry = mvItems[hex(id)];
  if (!entry) throw new Error(`map_viewer items.json missing id 0x${hex(id)}`);
  return entry;
};
const price = (v) => (typeof v === 'number' && v >= 0 ? v : null);

// can_equip_mask: bit0 ハンター / bit1 メカニック / bit2 ソルジャー（全 3 人 = 7）
const EQUIP_CHARS = ['ハンター', 'メカニック', 'ソルジャー'];
const equipLabel = (mask) => {
  if (mask === 7) return '全員';
  const names = EQUIP_CHARS.filter((_, bit) => mask & (1 << bit));
  if (!names.length) throw new Error(`empty can_equip_mask ${mask}`);
  return names.join('・');
};

// ---- 人类装备（0x01–0x40：防具 34 + 武器 30）----
const HUMAN_CATEGORIES = ['頭防具', '体防具', '足防具', 'プロテクター', '腕防具', '人間武器'];
const humanEquipment = gdItems
  .filter((item) => item.id >= 0x01 && item.id <= 0x40)
  .map((item) => {
    const entry = mv(item.id);
    return {
      id: `0x${hex(item.id)}`,
      nameJa: entry.name.ja,
      nameZh: entry.name.zh ?? null,
      category: item.category_ja,
      kind: item.category_ja === '人間武器' ? 'weapon' : 'armor',
      attack: item.attack ?? null,
      defense: item.defense ?? null,
      range: item.attack_range_ja ?? null,
      equip: equipLabel(item.can_equip_mask),
      price: price(entry.price),
    };
  });

// ---- 战车部件（0x41–0x90：主砲/S-E/機銃/Cユニット/エンジン）----
const PART_CATEGORIES = ['主砲', 'S-E', '機銃', 'Cユニット', 'エンジン'];
const SLOT_LABELS = { main: '主砲', secondary: '副砲', special: 'S-E' };
const tankParts = Object.entries(tanks.parts)
  .map(([id, part]) => ({ id: Number(id), ...part }))
  .filter((part) => part.kind !== 'chassis')
  .sort((a, b) => a.id - b.id)
  .map((part) => {
    const entry = mv(part.id);
    return {
      id: `0x${hex(part.id)}`,
      nameJa: entry.name.ja,
      nameZh: entry.name.zh ?? null,
      category: part.category,
      attack: part.attack ?? null,
      defense: part.defense ?? null,
      ammo: part.ammo_infinite ? Infinity : part.ammo ?? null,
      ammoInfinite: Boolean(part.ammo_infinite),
      slots: (part.slots ?? []).map((slot) => SLOT_LABELS[slot] ?? slot),
      range: part.range || null,
      weightT: part.weight != null ? part.weight / 10 : null,
      capacityT: part.capacity ?? null,
      price: price(part.price),
    };
  })
  .map((part) => ({ ...part, ammo: part.ammoInfinite ? null : part.ammo }));

// ---- 车体（0x91–0x98）：数值来自 8 辆玩家战车基础表（NO.k 默认车体 = 0x90+k）----
const baseByChassis = new Map(
  tanks.bases.filter((base) => !base.is_rental).map((base) => [base.chassis_item, base]),
);
const chassis = Object.entries(tanks.parts)
  .map(([id, part]) => ({ id: Number(id), ...part }))
  .filter((part) => part.kind === 'chassis')
  .sort((a, b) => a.id - b.id)
  .map((part) => {
    const entry = mv(part.id);
    const base = baseByChassis.get(part.id);
    if (!base) throw new Error(`no player tank base for chassis 0x${hex(part.id)}`);
    return {
      id: `0x${hex(part.id)}`,
      tankNo: base.tank_index + 1,
      nameJa: entry.name.ja,
      nameZh: entry.name.zh ?? null,
      holes: (base.slots ?? []).map((slot) => SLOT_LABELS[slot] ?? slot),
      holeCount: base.hole_count,
      sp: base.sp,
      defense: base.defense,
      maxDefense: base.max_defense,
      shells: base.shells,
      weightT: base.weight / 100,
      price: price(part.price),
    };
  });

// ---- 特殊来源装备/道具（无法在商店购买的 62 件，含获取渠道）----
// 来源是 retro-save-editor 的挖掘文档（tools/mine_unbuyable_sources.ts 生成的
// markdown 表）；名称/分类/价格统一用 map_viewer 数据回填，保持与图鉴页一致。
const stripMd = (text) =>
  text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    // 指向私有仓库内部文档/源码的括号引用对 wiki 读者无意义，去掉
    .replace(/（[^（）]*(?:文档|注释|\.ts|\.md)[^（）]*）/g, '')
    .trim();
const splitCell = (cell) =>
  stripMd(cell)
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/[;；]\s*$/, '').trim())
    .filter(Boolean);

const unbuyableDoc = await fs.readFile(
  path.join(rseRoot, 'docs/metal-max-unbuyable-items.md'),
  'utf8',
);
const specialItems = [];
let specialGroup = null;
const expectedGroupCounts = {};
for (const line of unbuyableDoc.split('\n')) {
  const heading = line.match(/^## (.+?)（(\d+)）/);
  if (heading) {
    specialGroup = heading[1];
    expectedGroupCounts[specialGroup] = Number(heading[2]);
    continue;
  }
  const row = line.match(/^\| (0x[0-9A-F]{2}) \|(.+)\|$/i);
  if (!row || !specialGroup) continue;
  const cols = row[2].split('|').map((cell) => cell.trim());
  if (cols.length < 6) throw new Error(`unbuyable table row has ${cols.length} cols: ${line}`);
  const id = Number(row[1]);
  const entry = mv(id);
  let other = splitCell(cols[5]).join('；') || null;
  if (other && /^同上/.test(other)) {
    const prev = specialItems[specialItems.length - 1];
    other = prev?.other ?? other;
  }
  specialItems.push({
    id: `0x${hex(id)}`,
    group: specialGroup,
    nameJa: entry.name.ja,
    nameZh: entry.name.zh ?? null,
    category: entry.category?.ja ?? null,
    price: price(entry.price),
    chests: splitCell(cols[3]),
    drops: splitCell(cols[4]),
    other,
  });
}
const assert = (cond, message) => {
  if (!cond) throw new Error(`validation failed: ${message}`);
};
const countBy = (rows, key) =>
  rows.reduce((acc, row) => ((acc[row[key]] = (acc[row[key]] ?? 0) + 1), acc), {});

assert(humanEquipment.length === 64, `human equipment ${humanEquipment.length} != 64`);
assert(humanEquipment.filter((e) => e.kind === 'armor').length === 34, 'armor != 34');
assert(humanEquipment.filter((e) => e.kind === 'weapon').length === 30, 'weapons != 30');
assert(tankParts.length === 80, `tank parts ${tankParts.length} != 80`);
assert(chassis.length === 8, `chassis ${chassis.length} != 8`);
for (const row of [...humanEquipment, ...tankParts, ...chassis]) {
  assert(row.nameJa, `missing nameJa on ${row.id}`);
}
for (const cat of Object.keys(countBy(humanEquipment, 'category'))) {
  assert(HUMAN_CATEGORIES.includes(cat), `unknown human category ${cat}`);
}
for (const cat of Object.keys(countBy(tankParts, 'category'))) {
  assert(PART_CATEGORIES.includes(cat), `unknown part category ${cat}`);
}
const specialByGroup = countBy(specialItems, 'group');
for (const [group, expected] of Object.entries(expectedGroupCounts)) {
  assert(
    specialByGroup[group] === expected,
    `special items ${group}: parsed ${specialByGroup[group] ?? 0} != heading count ${expected}`,
  );
}
assert(specialItems.length > 0, 'no special items parsed');
for (const row of specialItems) {
  assert(row.nameJa, `missing nameJa on special item ${row.id}`);
  assert(
    row.chests.length || row.drops.length || row.other,
    `special item ${row.id} has no channel at all`,
  );
}

const summary = {
  counts: {
    humanEquipment: humanEquipment.length,
    humanArmor: 34,
    humanWeapons: 30,
    tankParts: tankParts.length,
    tankChassis: chassis.length,
    specialItems: specialItems.length,
    humanByCategory: countBy(humanEquipment, 'category'),
    partsByCategory: countBy(tankParts, 'category'),
    specialByGroup,
  },
  sources: {
    items: 'map_viewer/res/metal_max/data/items.json',
    humanStats: 'metalmax-godot/import/items.json',
    tankStats: 'metalmax-godot/import/tanks.json',
    specialSources: 'retro-save-editor/docs/metal-max-unbuyable-items.md',
    reference: 'nes_decoder/docs/re/METAL_MAX_TANK_PARTS.md',
  },
  generatedAt: new Date().toISOString().slice(0, 10),
};

await fs.mkdir(outputRoot, { recursive: true });
const writeJson = (name, value) =>
  fs.writeFile(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
await writeJson('human-equipment.json', humanEquipment);
await writeJson('tank-parts.json', tankParts);
await writeJson('tank-chassis.json', chassis);
await writeJson('special-items.json', specialItems);
await writeJson('summary.json', summary);

console.log(
  `metal-max: ${humanEquipment.length} human equipment, ${tankParts.length} tank parts, ${chassis.length} chassis, ${specialItems.length} special items -> ${path.relative(repoRoot, outputRoot)}`,
);
