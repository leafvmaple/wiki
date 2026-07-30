export interface Daikoukai2Ship {
  id: number;
  nameJa: string;
  baseUsedPrice: number;
  requiredIndustry: number;
  durability: number;
  turning: number;
  propulsion: number;
  requiredCrew: number;
  usedCrew: number;
  maxCrew: number;
  usedCannons: number;
  maxCannons: number;
  usedCargo: number;
  totalCapacity: number;
}

type ShipSeed = readonly [
  nameJa: string,
  baseUsedPrice: number,
  requiredIndustry: number,
  durability: number,
  turning: number,
  propulsion: number,
  requiredCrew: number,
  usedCrew: number,
  maxCrew: number,
  usedCannons: number,
  maxCannons: number,
  usedCargo: number,
  totalCapacity: number,
];

// PS 日版 SLPS_006.56 船型表，并以存档内 25 条中古船模板补齐默认配载。
const seeds: readonly ShipSeed[] = [
  ['バルシャ', 1_200, 100, 30, 70, 80, 5, 15, 20, 5, 10, 30, 50],
  ['ハンザ・コグ', 1_300, 100, 20, 65, 85, 5, 20, 20, 5, 10, 35, 60],
  ['ダウ', 1_800, 300, 30, 90, 75, 5, 15, 20, 5, 15, 50, 70],
  ['バス', 20_000, 700, 70, 50, 60, 50, 150, 200, 30, 40, 320, 500],
  ['タレッテ', 1_400, 200, 20, 70, 95, 5, 15, 20, 10, 15, 55, 80],
  ['ラティーナ', 2_400, 200, 30, 90, 75, 10, 30, 40, 10, 20, 80, 120],
  ['レドンダ', 2_400, 200, 30, 70, 90, 10, 30, 40, 10, 20, 80, 120],
  ['ベルガンティン', 10_000, 400, 40, 90, 70, 15, 45, 60, 15, 20, 120, 180],
  ['ナオ', 30_000, 500, 50, 65, 85, 25, 80, 120, 30, 40, 340, 450],
  ['キャラック', 40_000, 600, 50, 60, 80, 30, 100, 160, 30, 50, 470, 600],
  ['ガレオン', 60_000, 800, 80, 60, 65, 45, 180, 200, 70, 70, 550, 800],
  ['ジーベック', 44_000, 500, 70, 80, 70, 25, 120, 300, 30, 40, 450, 600],
  ['ピンネース', 6_000, 550, 40, 95, 85, 5, 40, 60, 15, 20, 95, 150],
  ['スループ', 16_000, 850, 50, 95, 85, 5, 40, 60, 15, 40, 195, 250],
  ['フリゲート', 224_000, 1_000, 80, 60, 85, 20, 180, 300, 65, 70, 405, 650],
  ['バーグ', 300_000, 1_000, 90, 50, 65, 40, 270, 450, 120, 120, 610, 1_000],
  ['シップ', 320_000, 1_000, 90, 50, 65, 45, 300, 500, 120, 150, 780, 1_200],
  ['ジャンク', 16_000, 300, 80, 80, 70, 25, 75, 100, 30, 40, 395, 500],
  ['軽ガレー', 1_400, 100, 40, 100, 85, 5, 30, 20, 10, 10, 80, 120],
  ['フランダース', 34_000, 400, 80, 75, 80, 40, 180, 200, 30, 30, 290, 500],
  ['ガレアス', 64_000, 500, 90, 70, 70, 60, 320, 400, 50, 50, 580, 950],
  ['ラ・レアル', 40_000, 600, 60, 95, 100, 30, 160, 250, 30, 40, 260, 450],
  ['鉄甲船', 140_000, 1_000, 90, 80, 85, 45, 360, 300, 80, 100, 660, 1_100],
  ['安宅船', 14_000, 400, 60, 95, 95, 20, 160, 200, 30, 40, 310, 500],
  ['関船', 2_000, 200, 30, 100, 100, 10, 60, 60, 15, 20, 175, 250],
];

export const daikoukai2Ships: readonly Daikoukai2Ship[] = seeds.map((seed, id) => ({
  id,
  nameJa: seed[0],
  baseUsedPrice: seed[1],
  requiredIndustry: seed[2],
  durability: seed[3],
  turning: seed[4],
  propulsion: seed[5],
  requiredCrew: seed[6],
  usedCrew: seed[7],
  maxCrew: seed[8],
  usedCannons: seed[9],
  maxCannons: seed[10],
  usedCargo: seed[11],
  totalCapacity: seed[12],
}));
