export type Daikoukai2Facility = '酒场' | '宿屋';

export interface Daikoukai2Officer {
  id: number;
  nameJa: string;
  port: string;
  facility: Daikoukai2Facility;
  nationality: string;
  navigationLevel: number;
  battleLevel: number;
  stats: {
    leadership: number;
    navigation: number;
    knowledge: number;
    intuition: number;
    courage: number;
    swordsmanship: number;
    charm: number;
  };
  personality: '善' | '中立' | '恶';
  friendly: boolean;
  skillFlags: number;
}

type OfficerSeed = readonly [
  id: number,
  nameJa: string,
  port: string,
  facility: Daikoukai2Facility,
  nationality: number,
  navigationLevel: number,
  battleLevel: number,
  leadership: number,
  navigation: number,
  knowledge: number,
  intuition: number,
  courage: number,
  swordsmanship: number,
  charm: number,
  personality: number,
  friendly: boolean,
  skillFlags: number,
];

// Steam 版内置 PC-98 数据的 41 名普通自由航海士。能力、等级、性格、
// 义理、技能和国籍来自角色记录；初始港口与设施同公开的 SFC/Switch
// 角色表交叉核对。设施列仍应以 Steam 版逐港实机结果为最终依据。
const seeds: OfficerSeed[] = [
  [0x4f, 'ピリー レイス', 'イスタンブール', '宿屋', 2, 60, 50, 80, 100, 100, 100, 68, 52, 74, 0, true, 0x1f],
  [0x50, 'アフメット グラニエ', 'アレキサンドリア', '宿屋', 2, 1, 1, 82, 79, 53, 78, 83, 58, 66, 0, true, 0x00],
  [0x51, 'アル ファシ', 'トリポリ', '宿屋', 2, 2, 3, 73, 67, 89, 81, 63, 86, 89, 1, false, 0x02],
  [0x52, 'ザガノス ベイ', 'カイロ', '宿屋', 2, 2, 1, 51, 58, 87, 82, 61, 88, 61, 1, false, 0x03],
  [0x53, 'フェルナン ピント', 'ヴェネチア', '酒场', 0, 12, 7, 78, 73, 77, 83, 88, 69, 66, 0, true, 0x18],
  [0x54, 'ジョアン カストロ', 'ジェノヴァ', '酒场', 0, 2, 1, 75, 52, 75, 56, 69, 79, 54, 1, false, 0x00],
  [0x55, 'ミグェル レアル', 'リスボン', '宿屋', 0, 7, 6, 84, 73, 77, 84, 84, 54, 86, 0, true, 0x15],
  [0x56, 'ディオゴ ファグンデス', 'バレンシア', '酒场', 0, 6, 6, 53, 83, 64, 65, 76, 81, 88, 1, false, 0x00],
  [0x57, 'ダルテ ペレイラ', 'ナポリ', '酒场', 0, 1, 1, 67, 79, 68, 61, 76, 66, 65, 1, true, 0x10],
  [0x58, 'マヌエル ペレストレロ', 'カリカット', '酒场', 0, 2, 2, 65, 83, 67, 79, 60, 78, 71, 1, false, 0x00],
  [0x59, 'フランシスコ アルヴァレス', 'ペルナンブーゴ', '酒场', 0, 5, 5, 51, 74, 67, 54, 57, 64, 74, 0, false, 0x04],
  [0x5a, 'ルイ ファレイロ', 'ストックホルム', '酒场', 0, 1, 1, 58, 55, 62, 64, 58, 53, 63, 1, true, 0x10],
  [0x5b, 'ファン コーサ', 'バルセロナ', '宿屋', 1, 1, 2, 87, 87, 52, 74, 82, 85, 72, 0, true, 0x00],
  [0x5c, 'マルティン バルボア', 'メッカ', '酒场', 1, 13, 8, 87, 77, 60, 62, 85, 87, 71, 0, true, 0x15],
  [0x5d, 'ベルナルド ゴメス', 'アレキサンドリア', '酒场', 1, 14, 12, 83, 70, 80, 71, 65, 88, 83, 1, true, 0x1a],
  [0x5e, 'ディエゴ ベラスケス', 'セビリア', '酒场', 1, 11, 7, 73, 75, 69, 78, 64, 54, 76, 1, false, 0x11],
  [0x5f, 'パンフィロ オリード', 'カラカス', '酒场', 1, 6, 5, 64, 78, 81, 84, 59, 61, 86, 2, false, 0x14],
  [0x60, 'アロンソ メンドーサ', 'リスボン', '宿屋', 1, 1, 1, 59, 65, 80, 71, 68, 53, 64, 1, true, 0x00],
  [0x61, 'アンソニー ジェンソン', 'アテネ', '酒场', 3, 2, 3, 62, 66, 76, 84, 89, 67, 72, 0, true, 0x14],
  [0x62, 'ローレンス エドワーズ', 'ロンドン', '宿屋', 3, 7, 9, 51, 88, 84, 66, 62, 52, 79, 1, true, 0x05],
  [0x63, 'ラウル フィッチ', 'ロンドン', '酒场', 3, 2, 1, 85, 76, 51, 63, 73, 74, 84, 1, true, 0x12],
  [0x64, 'アントニー シャーリー', 'ブリストル', '酒场', 3, 2, 1, 66, 87, 67, 68, 65, 53, 78, 1, false, 0x00],
  [0x65, 'アロイジ ジョヴァンニ', 'セビリア', '酒场', 4, 14, 9, 61, 85, 89, 60, 70, 86, 76, 0, true, 0x11],
  [0x66, 'ジャン ラムジオ', 'ピサ', '酒场', 4, 2, 2, 85, 71, 80, 75, 80, 77, 76, 0, false, 0x00],
  [0x67, 'ニコロ ステファノ', 'ジェノヴァ', '酒场', 4, 8, 5, 79, 79, 65, 70, 74, 73, 78, 1, true, 0x10],
  [0x68, 'アレッサンド バッジョ', 'トレビゾント', '宿屋', 4, 7, 8, 83, 74, 76, 60, 77, 64, 83, 0, true, 0x04],
  [0x69, 'アルベロ スキラッチ', 'イスタンブール', '酒场', 4, 5, 5, 54, 68, 71, 79, 67, 79, 58, 0, true, 0x00],
  [0x6a, 'コーネリウス ショーテン', 'アムステルダム', '宿屋', 5, 5, 6, 75, 61, 76, 80, 53, 62, 88, 1, false, 0x00],
  [0x6b, 'アンブローズ エーインガー', 'セイロン', '酒场', 5, 1, 2, 81, 77, 77, 55, 78, 84, 59, 0, true, 0x00],
  [0x6c, 'ゲオルク シュパイヤー', 'ゴア', '宿屋', 5, 3, 4, 57, 71, 58, 78, 67, 83, 71, 1, false, 0x10],
  [0x6d, 'ハンス シュターデン', 'アムステルダム', '酒场', 5, 7, 9, 82, 57, 52, 51, 57, 86, 84, 1, false, 0x18],
  [0x6e, 'ヤコブ ワルウェイク', 'ボルドー', '酒场', 5, 5, 3, 64, 52, 82, 53, 88, 77, 67, 2, true, 0x02],
  [0x6f, 'ジャン アルフォンス', 'サント・ドミンゴ', '酒场', 6, 1, 3, 54, 75, 43, 54, 78, 84, 75, 2, false, 0x04],
  [0x70, 'アントニオ ピンテアドウ', 'サン・ジョルジュ', '酒场', 6, 1, 1, 70, 44, 65, 87, 82, 75, 46, 2, false, 0x00],
  [0x71, 'チェザレー フェデリチ', 'マルセイユ', '酒场', 6, 1, 2, 85, 62, 68, 80, 74, 70, 59, 2, false, 0x04],
  [0x72, 'フランチャ ロロノア', '未配置', '酒场', 6, 9, 15, 72, 66, 71, 81, 52, 76, 89, 2, false, 0x14],
  [0x73, 'ヘンリー マンスフェル', 'モンパザ', '酒场', 6, 2, 3, 60, 72, 58, 61, 78, 70, 43, 2, false, 0x04],
  [0x74, 'ギャビン フィッシャー', 'ハンブルグ', '酒场', 6, 1, 1, 69, 87, 73, 59, 81, 72, 76, 1, true, 0x04],
  [0x75, 'エドワード ダンピア', '長崎', '酒场', 6, 5, 8, 71, 71, 54, 58, 62, 79, 41, 2, false, 0x14],
  [0x76, 'ロバート ロー', 'ソファラ', '酒场', 6, 9, 12, 69, 67, 62, 62, 73, 89, 82, 1, true, 0x14],
  [0x77, 'リチャード ハクスリー', 'ジャマイカ', '酒场', 6, 1, 2, 51, 69, 48, 83, 87, 67, 50, 2, false, 0x04],
];

const nationalities = ['葡萄牙', '西班牙', '奥斯曼', '英格兰', '意大利', '尼德兰', '海盗'];
const personalities = ['善', '中立', '恶'] as const;

export const daikoukai2Officers: Daikoukai2Officer[] = seeds.map((seed) => {
  const [
    id, nameJa, port, facility, nationality, navigationLevel, battleLevel,
    leadership, navigation, knowledge, intuition, courage, swordsmanship, charm,
    personality, friendly, skillFlags,
  ] = seed;
  return {
    id,
    nameJa,
    port,
    facility,
    nationality: nationalities[nationality] ?? '未知',
    navigationLevel,
    battleLevel,
    stats: { leadership, navigation, knowledge, intuition, courage, swordsmanship, charm },
    personality: personalities[personality] ?? '中立',
    friendly,
    skillFlags,
  };
});
