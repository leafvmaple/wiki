import type { Daikoukai2Port } from './ports';
import { daikoukai2Ports } from './ports';
import { daikoukai2Ships } from './ships';

export const daikoukai2UpperUsedShipPools: Readonly<Record<string, readonly number[]>> = {
  伊比利亚: [0, 18, 5, 7, 19, 8, 9, 10],
  英格兰: [6, 8, 9, 10, 13, 14, 15],
  尼德兰: [1, 5, 8, 9, 10, 14, 16],
  北欧: [1, 18, 6, 19, 8, 12, 21, 10],
  地中海: [18, 4, 5, 3, 19, 8, 20, 9],
  伊斯兰: [18, 5, 19, 8, 11, 20, 9],
  亚洲: [18, 2, 11],
  非洲: [18, 6, 8, 9],
  中国: [17],
  日本: [24, 23, 22],
  新大陆: [7, 12, 8, 9, 10],
};

export const daikoukai2LowerUsedShipOrder: readonly number[] = [
  0, 1, 18, 4, 5, 6, 2, 3, 19, 7, 8, 20, 12, 9, 21, 11, 10, 13,
];

export interface Daikoukai2UsedShipPortCandidates {
  port: Daikoukai2Port;
  upperShipIds: readonly number[];
  lowerShipIds: readonly number[];
}

/** Reproduces the PS upper-three selection, including the misplaced Buss entry. */
export function daikoukai2UpperUsedShipCandidates(
  shipRegion: string,
  industry: number,
): readonly number[] {
  const pool = daikoukai2UpperUsedShipPools[shipRegion] ?? [];
  const eligibleCount = pool.filter((id) => daikoukai2Ships[id].requiredIndustry <= industry).length;
  return pool.slice(0, eligibleCount);
}

/** The lower two slots cap commerce at 680 and add one candidate per 40 points. */
export function daikoukai2LowerUsedShipCandidates(commerce: number): readonly number[] {
  const lastIndex = Math.floor(Math.min(Math.max(commerce, 0), 680) / 40);
  return daikoukai2LowerUsedShipOrder.slice(0, lastIndex + 1);
}

export const daikoukai2InitialUsedShipPorts: readonly Daikoukai2UsedShipPortCandidates[] =
  daikoukai2Ports.map((port) => ({
    port,
    upperShipIds: daikoukai2UpperUsedShipCandidates(port.shipRegion, port.initialIndustry),
    lowerShipIds: daikoukai2LowerUsedShipCandidates(port.initialCommerce),
  }));

export const daikoukai2UpperRegionsByShip = daikoukai2Ships.map((ship) =>
  Object.entries(daikoukai2UpperUsedShipPools)
    .filter(([, ids]) => ids.includes(ship.id))
    .map(([region]) => region));

export const daikoukai2LowerCommerceByShip = daikoukai2Ships.map((ship) => {
  const index = daikoukai2LowerUsedShipOrder.indexOf(ship.id);
  return index < 0 ? null : index * 40;
});
