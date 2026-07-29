import { daikoukai2Ports } from './ports';

export interface Daikoukai2Item {
  id: number;
  nameJa: string;
  nameRawJa: string;
  category: string;
  effect: number;
  effectText: string;
  basePrice: number;
  regularPorts: string[];
  hiddenPorts: string[];
  note: string;
  unused: boolean;
}

type ItemSeed = readonly [
  nameRawJa: string,
  priceHundreds: number,
  effect: number,
  categoryCode: number,
];

// Steam 内置 PC-98 A 盘 MAIN.EXE 文件偏移 0x42390：100 × 0x14 字节。
// 名称保留游戏原始半角写法；页面显示名会统一为全角标点以便阅读。
const itemSeeds: ItemSeed[] = [
  ['ダガー', 5, 5, 0x00],
  ['ショートソード', 10, 10, 0x00],
  ['ロングソード', 40, 20, 0x00],
  ['レイピア', 30, 15, 0x01],
  ['エペ', 20, 10, 0x01],
  ['エストック', 60, 20, 0x01],
  ['ｼｮｰﾄ･ｻｰﾍﾞﾙ', 30, 10, 0x02],
  ['シミター', 80, 20, 0x02],
  ['日本刀', 200, 25, 0x02],
  ['カトラス', 15, 10, 0x03],
  ['ﾌﾞﾛｰﾄﾞ･ｿｰﾄﾞ', 50, 20, 0x03],
  ['青竜偃月刀', 240, 30, 0x03],
  ['フラムベルク', 140, 25, 0x01],
  ['ﾊﾞｽﾀｰﾄﾞ･ｿｰﾄﾞ', 140, 25, 0x00],
  ['クレイモア', 150, 25, 0x03],
  ['サーベル', 30, 15, 0x02],
  ['ﾊｰﾄﾞ･ﾚｻﾞｰｱｰﾏｰ', 10, 10, 0x06],
  ['ﾁｪｲﾝ･ﾒｲﾙｱｰﾏｰ', 20, 20, 0x06],
  ['ﾊｰﾌ･ﾌﾟﾚｲﾄ', 40, 30, 0x06],
  ['ﾌﾟﾚｲﾄ･ﾒｲﾙｱｰﾏｰ', 80, 40, 0x06],
  ['四分儀', 40, 5, 0x07],
  ['六分儀', 80, 2, 0x07],
  ['経緯儀', 120, 1, 0x07],
  ['懐中時計', 20, 1, 0x08],
  ['望遠鏡', 50, 1, 0x08],
  ['ネコ', 20, 1, 0x08],
  ['白虎半月刀', 180, 25, 0x03],
  ['望遠鏡', 50, 0, 0x08],
  ['空白', 50, 0, 0x08],
  ['私掠許可書(P)', 0, 0, 0x08],
  ['私掠許可書(S)', 0, 0, 0x08],
  ['私掠許可書(O)', 0, 0, 0x08],
  ['私掠許可書(E)', 0, 0, 0x08],
  ['私掠許可書(I)', 0, 0, 0x08],
  ['私掠許可書(H)', 0, 0, 0x08],
  ['免税証(P)', 100, 0, 0x08],
  ['免税証(S)', 100, 0, 0x08],
  ['免税証(O)', 100, 0, 0x08],
  ['免税証(E)', 100, 0, 0x08],
  ['免税証(I)', 100, 0, 0x08],
  ['免税証(H)', 100, 0, 0x08],
  ['ネコイラズ', 5, 1, 0x09],
  ['聖なる香油', 10, 1, 0x09],
  ['ﾗｲﾑ･ｼﾞｭｰｽ', 10, 1, 0x09],
  ['王家の宝冠', 3000, 1, 0x0a],
  ['聖なる香油', 10, 1, 0x09],
  ['贖罪状', 10, 0, 0x09],
  ['免罪符', 10, 0, 0x09],
  ['空白', 10, 0, 0x09],
  ['空白', 10, 0, 0x09],
  ['絹のショール', 30, 3, 0x0a],
  ['チャイナドレス', 80, 8, 0x0a],
  ['銀の髪飾り', 50, 5, 0x0a],
  ['白銀の櫛', 100, 10, 0x0a],
  ['白貂のガウン', 120, 12, 0x0a],
  ['サークレット', 40, 4, 0x0a],
  ['孔雀の羽の扇', 30, 3, 0x0a],
  ['絹のリボン', 10, 2, 0x0a],
  ['天鵞絨のガウン', 50, 5, 0x0a],
  ['金剛石の冠', 1000, 100, 0x0b],
  ['真珠の腕輪', 100, 10, 0x0b],
  ['ルビーの宝杓', 500, 50, 0x0b],
  ['銀の燭台', 30, 3, 0x0b],
  ['翡翠の宝石箱', 200, 20, 0x0b],
  ['宝冠', 500, 60, 0x0b],
  ['金のﾌﾞﾚｽﾚｯﾄ', 150, 15, 0x0b],
  ['ｻﾌｧｲｱの指輪', 180, 20, 0x0b],
  ['孔雀石の小箱', 80, 10, 0x0b],
  ['白銀のブローチ', 200, 20, 0x0b],
  ['ルビーの指輪', 220, 25, 0x0b],
  ['１０６', 0, 0, 0x0d],
  ['ベンダデカン', 0, 0, 0x0d],
  ['チャクセス', 0, 0, 0x0d],
  ['妖刀村正', 3800, 40, 0x02],
  ['ﾙｰﾝ･ﾌﾞﾚｰﾄﾞ', 3600, 40, 0x00],
  ['聖騎士の鎧', 6000, 70, 0x06],
  ['聖騎士の剣', 3800, 40, 0x01],
  ['シヴァの魔剣', 2800, 30, 0x02],
  ['ｴﾛ-ﾙｽﾞ･ﾌﾟﾚｲﾄ', 3000, 55, 0x06],
  ['予備', 0, 0, 0x00],
  ['仮面の地図', 0, 0, 0x0c],
  ['祭壇の地図', 0, 0, 0x0c],
  ['彫像の地図', 0, 0, 0x0c],
  ['石版の地図', 0, 0, 0x0c],
  ['水晶玉の地図', 0, 0, 0x0c],
  ['火炎の壷の地図', 0, 0, 0x0c],
  ['宝剣の地図', 0, 0, 0x0c],
  ['メダルの地図', 0, 0, 0x0c],
  ['聖者の杖の地図', 0, 0, 0x0c],
  ['古い地図', 0, 0, 0x0c],
  ['純金の仮面', 0, 0, 0x0d],
  ['翡翠の祭壇', 0, 0, 0x0d],
  ['古代神の彫像', 0, 0, 0x0d],
  ['黒曜石の石版', 0, 0, 0x0d],
  ['暗黒神の水晶玉', 0, 0, 0x0d],
  ['火炎の壷', 0, 0, 0x0d],
  ['破壊神の宝剣', 0, 0, 0x0d],
  ['黄金のメダル', 0, 0, 0x0d],
  ['聖者の杖', 0, 0, 0x0d],
  ['最後の財宝', 0, 0, 0x0d],
];

// MAIN.EXE 文件偏移 0x40BE5：100 个港口 × 0x25 字节。
// 每条记录的前 3 格是白天商品，第 4 格是 02:00–02:30 的隐藏商品；-1 对应 0xFF 空格。
const itemShopStock: ReadonlyArray<readonly [number, number, number, number]> = [
  [20, 24, 3, -1], [24, 6, 3, 13], [24, 16, 20, 7], [0, 16, 42, -1], [9, 43, -1, -1],
  [-1, -1, -1, -1], [43, 1, -1, -1], [4, 62, -1, 5], [9, 20, 58, -1], [3, 62, 10, -1],
  [4, 16, 41, 75], [1, 43, -1, 39], [-1, -1, -1, -1], [17, 21, 4, 68], [20, 0, -1, -1],
  [-1, -1, -1, -1], [15, 43, 55, 22], [9, -1, -1, 35], [18, 21, 41, 7], [-1, -1, -1, -1],
  [6, 42, -1, -1], [-1, -1, -1, -1], [6, 16, 24, 37], [-1, -1, -1, -1], [0, -1, -1, 36],
  [15, 58, -1, -1], [-1, -1, -1, -1], [1, 42, 3, -1], [4, 17, 62, -1], [9, 24, 58, 21],
  [10, 16, -1, 14], [0, 10, -1, 14], [2, 41, 52, 40], [24, 21, 22, 23], [17, 18, 19, 78],
  [20, 16, 55, -1], [-1, -1, -1, -1], [0, 1, -1, 13], [15, 2, 5, 12], [16, 53, -1, 38],
  [-1, -1, -1, -1], [-1, -1, -1, -1], [43, 17, -1, -1], [43, 2, -1, -1], [-1, -1, -1, -1],
  [0, -1, -1, 66], [43, 68, -1, -1], [-1, -1, -1, -1], [42, 41, -1, -1], [-1, -1, -1, -1],
  [60, -1, -1, -1], [-1, -1, -1, -1], [0, 19, -1, 74], [55, -1, -1, 65], [-1, -1, -1, -1],
  [43, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [0, 24, -1, 69],
  [-1, -1, -1, -1], [-1, -1, -1, -1], [41, 53, -1, -1], [-1, -1, -1, -1], [64, 65, 61, 76],
  [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [67, 50, 52, 54],
  [41, 65, -1, 63], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [67, -1, -1, -1],
  [7, 57, 17, -1], [-1, -1, -1, -1], [25, 57, 22, -1], [-1, -1, -1, -1], [-1, -1, -1, -1],
  [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [56, 15, -1, -1], [-1, -1, -1, -1],
  [42, 1, 54, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1],
  [-1, -1, -1, -1], [-1, -1, -1, -1], [56, 41, 6, 77], [-1, -1, -1, -1], [25, 43, 42, 11],
  [57, 56, 51, 60], [50, 26, -1, -1], [57, 50, 51, 11], [60, 25, 8, 73], [25, 8, 52, -1],
];

const unusedItemIds = new Set([27, 28, 45, 46, 47, 48, 49, 70, 71, 72, 79, 89, 99]);

const displayNameOverrides: Record<number, string> = {
  6: 'ショート・サーベル',
  10: 'ブロード・ソード',
  13: 'バスタード・ソード',
  16: 'ハード・レザーアーマー',
  17: 'チェイン・メイルアーマー',
  18: 'ハーフ・プレイト',
  19: 'プレイト・メイルアーマー',
  43: 'ライム・ジュース',
  65: '金のブレスレット',
  66: 'サファイアの指輪',
  74: 'ルーン・ブレード',
  78: 'エロールズ・プレイト',
};

const countryNames: Record<string, string> = {
  P: '葡萄牙', S: '西班牙', O: '奥斯曼', E: '英格兰', I: '意大利', H: '尼德兰',
};

const treasureTargets = [
  '纯金假面', '翡翠祭坛', '古代神雕像', '黑曜石石板', '暗黑神水晶球',
  '火焰壶', '破坏神宝剑', '黄金奖章', '圣者之杖',
];

function categoryOf(id: number, code: number): string {
  if (unusedItemIds.has(id)) return '未使用';
  if (code === 0x00) return '剑';
  if (code === 0x01) return '刺突剑';
  if (code === 0x02) return '曲刀';
  if (code === 0x03) return '蛮刀';
  if (code === 0x06) return '防具';
  if (code === 0x07) return '测量器';
  if (id >= 29 && id <= 40) return '许可文书';
  if (id >= 41 && id <= 43) return '消耗品';
  if (code === 0x08) return '航海用品';
  if (code === 0x09) return '消耗品';
  if (code === 0x0a) return '服饰品';
  if (code === 0x0b) return '财宝';
  if (code === 0x0c) return '地图';
  return '秘宝';
}

function effectTextOf(id: number, code: number, effect: number): string {
  if (unusedItemIds.has(id)) return '—';
  if (code <= 0x03) return `攻击 ${effect}`;
  if (code === 0x06) return `防御 ${effect}`;
  if (code === 0x07) return `测量误差值 ${effect}`;
  if (id === 23) return '查看当前时刻';
  if (id === 24) return '扩大视野与发现范围';
  if (id === 25) return '防止鼠害';
  if (id >= 29 && id <= 34) return `${countryNames[itemSeeds[id][0].slice(-2, -1)]}私掠许可`;
  if (id >= 35 && id <= 40) return `${countryNames[itemSeeds[id][0].slice(-2, -1)]}港口免税`;
  if (id === 41) return '消灭船上的老鼠';
  if (id === 42) return '平息暴风雨';
  if (id === 43) return '治疗坏血病';
  if (code === 0x0a || code === 0x0b) return `赠礼好感 +${effect}`;
  if (code === 0x0c && id <= 88) return `指向${treasureTargets[id - 80]}`;
  if (id >= 90 && id <= 96) return '王宫秘宝任务物品';
  if (id === 97) return '彼得罗剧情物品';
  if (id === 98) return '彼得罗／约翰剧情物品';
  return '剧情物品';
}

function noteOf(id: number): string {
  if (unusedItemIds.has(id)) {
    if (id === 99) return '保留数据；ITEM.MES 对应文本是开发调试提示。';
    return '保留／未使用数据，不会出现在港口商品表。';
  }
  if (id === 20) return '三种测量器中误差最大。';
  if (id === 21) return '精度高于四分仪。';
  if (id === 22) return '三种测量器中精度最高。';
  if (id === 44) return '约翰剧情取得；游戏仍保留 300,000 的内部基准价。';
  if (id === 59) return '港口不出售，可作为高好感赠礼。';
  if (id >= 73 && id <= 78) return '仅在凌晨隐藏商店出售。';
  return '';
}

if (itemSeeds.length !== 100 || itemShopStock.length !== daikoukai2Ports.length) {
  throw new Error('Daikoukai II item data and port table must both contain 100 records');
}

export const daikoukai2Items: Daikoukai2Item[] = itemSeeds.map((seed, id) => ({
  id,
  nameJa: displayNameOverrides[id] ?? seed[0].normalize('NFKC').replaceAll('･', '・'),
  nameRawJa: seed[0],
  category: categoryOf(id, seed[3]),
  effect: seed[2],
  effectText: effectTextOf(id, seed[3], seed[2]),
  basePrice: seed[1] * 100,
  regularPorts: [],
  hiddenPorts: [],
  note: noteOf(id),
  unused: unusedItemIds.has(id),
}));

itemShopStock.forEach((stock, portIndex) => {
  const port = daikoukai2Ports[portIndex];
  stock.forEach((itemId, slot) => {
    if (itemId < 0) return;
    const item = daikoukai2Items[itemId];
    if (!item) throw new Error(`Daikoukai II port ${port.id} refers to unknown item ${itemId}`);
    (slot === 3 ? item.hiddenPorts : item.regularPorts).push(port.nameJa);
  });
});

export const daikoukai2ItemCategories = [
  '剑', '刺突剑', '曲刀', '蛮刀', '防具', '测量器', '航海用品',
  '许可文书', '消耗品', '服饰品', '财宝', '地图', '秘宝', '未使用',
] as const;
