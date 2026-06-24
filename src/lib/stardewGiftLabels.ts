const giftCategoryLabels: Record<string, string> = {
  '-2': '宝石类',
  '-4': '鱼类',
  '-5': '蛋类',
  '-6': '奶类',
  '-7': '料理',
  '-12': '矿物类',
  '-14': '肉类',
  '-15': '资源类',
  '-20': '垃圾类',
  '-21': '鱼饵类',
  '-22': '钓具类',
  '-26': '工匠品',
  '-27': '糖浆类',
  '-28': '怪物战利品',
  '-74': '种子类',
  '-75': '蔬菜类',
  '-79': '水果类',
  '-80': '花卉类',
  '-81': '采集物',
};

const unique = (items: string[]) => [...new Set(items)];

export const normalizeGiftLabel = (item?: string | number | null) => {
  const text = String(item ?? '').trim();
  const category = text.match(/^分类\s+(-?\d+)$/);
  if (category) return giftCategoryLabels[category[1]] ?? '';
  return text;
};

export const displayGiftItems = (items?: (string | number | null)[]) =>
  unique((items ?? []).map(normalizeGiftLabel).filter(Boolean));

export const joinGiftLabels = (items?: (string | number | null)[], fallback = '-') => {
  const labels = displayGiftItems(items);
  return labels.length ? labels.join('、') : fallback;
};
