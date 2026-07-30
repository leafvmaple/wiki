import battles from '../data/sword-man/generated/battles.json';

type DataRow = Record<string, any>;

export interface WikiTocItem {
  depth: number;
  slug: string;
  text: string;
  children: WikiTocItem[];
}

const item = (depth: number, slug: string, text: string, children: WikiTocItem[] = []): WikiTocItem => ({
  depth,
  slug,
  text,
  children,
});

export function getTdjBattleToc(pathname: string): WikiTocItem[] | null {
  const match = pathname.match(/^\/games\/sword-man\/battles\/(stage\d+)\/?$/i);
  if (!match) return null;

  const battle = (battles as DataRow[]).find((row) => row.id.toLowerCase() === match[1].toLowerCase());
  if (!battle) return null;

  return [
    item(2, '_top', '关卡概要'),
    item(2, 'intro-dialogue', '战前剧情'),
    item(2, 'battle-map', '战场地图'),
    item(2, 'conditions', '胜败条件与战后去向', [
      item(3, 'win-conditions', '胜利条件'),
      item(3, 'lose-conditions', '失败条件'),
      item(3, 'post-battle-route', '战后流程'),
    ]),
    ...(battle.battleMovieScenes?.length
      ? [item(2, 'battle-cutscenes', '战中剧情 CG')]
      : []),
    item(2, 'players', '我方出场'),
    item(2, 'enemies', '敌方出场'),
    item(2, 'map-data', '战场数据'),
    item(2, 'outro-dialogue', '战后剧情'),
    ...(battle.endingMovieScenes?.length
      ? [item(2, 'ending-cutscenes', '结局剧情 CG')]
      : []),
  ];
}
