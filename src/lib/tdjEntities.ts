type Row = Record<string, any>;

export type TdjEntityField = {
  label: string;
  value: string;
};

export type TdjEntityCard = {
  title: string;
  kicker: string;
  body?: string;
  fields: TdjEntityField[];
  href?: string;
  imageSrc?: string;
};

const dash = (value: unknown, fallback = '-') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

const signed = (value: number | null | undefined) => {
  if (!value) return '-';
  return value > 0 ? `+${value}` : String(value);
};

const joinList = (items: unknown[] | undefined, limit = 4) => {
  const values = (items ?? []).map((item) => String(item ?? '').trim()).filter(Boolean);
  if (!values.length) return '';
  const head = values.slice(0, limit);
  return values.length > limit ? `${head.join('、')} 等${values.length}项` : head.join('、');
};

const rangeText = (min?: number, max?: number, unit = '格') => {
  if (typeof min !== 'number' || typeof max !== 'number') return '';
  const start = min === -1 ? 1 : Math.max(0, min);
  return start === max ? `${max} ${unit}` : `${start}–${max} ${unit}`;
};

const ability = (row: Row, key: string) => {
  const stat = row.abilities?.[key];
  return stat ? `${stat.base} / +${stat.grow}` : '';
};

const skillEntryText = (entry: Row) => {
  const name = entry.skill?.name ?? `#${entry.skillId}`;
  const level = entry.level > 0 ? `Lv.${entry.level}` : '初始';
  return `${level} ${name}`;
};

const clip = (text: string, max = 120) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const fieldsOf = (items: Array<TdjEntityField | false | null | undefined>, limit = 7) =>
  items
    .filter((item): item is TdjEntityField => Boolean(item && String(item.value).trim() && item.value !== '-'))
    .slice(0, limit);

export const tdjCardPayload = (card: TdjEntityCard | null | undefined) =>
  card ? JSON.stringify(card) : undefined;

export const cardFromCharacter = (character: Row): TdjEntityCard => {
  const skills = [...(character.initialSkills ?? []), ...(character.learnedSkills ?? [])] as Row[];
  const gear = [
    character.weaponName ? `武器 ${character.weaponName}` : '',
    character.armorName ? `防具 ${character.armorName}` : '',
    character.accessoryName ? `饰品 ${character.accessoryName}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    title: character.name,
    kicker: '角色',
    body: gear || `初始 Lv.${character.level}`,
    fields: fieldsOf([
      { label: 'HP / MP', value: `${character.hp} / ${character.mp}` },
      character.growth?.summary ? { label: '成长', value: character.growth.summary } : null,
      {
        label: '随机',
        value: `HP +${character.growth?.hpRandMax ?? '-'} · MP +${character.growth?.mpRandMax ?? '-'}`,
      },
      skills.length
        ? { label: '技能', value: `${skills.length} 项 · ${joinList(skills.map(skillEntryText), 3)}` }
        : { label: '技能', value: '暂无习得' },
    ]),
    href: character.href,
    imageSrc: character.iconPath || undefined,
  };
};

export const cardFromSkill = (skill: Row): TdjEntityCard => {
  const range = rangeText(skill.attackRangeMin, skill.attackRangeMax);
  return {
    title: skill.name,
    kicker: skill.kindLabel || '技能',
    body: clip(dash(skill.description, '')),
    fields: fieldsOf([
      { label: '属性', value: dash(skill.attributeLabel) },
      { label: '效果', value: dash(skill.resultLabel) },
      { label: '目标', value: dash(skill.targetLabel) },
      range
        ? { label: '范围', value: `${skill.rangeTypeLabel || ''} ${range}`.trim() }
        : skill.rangeTypeLabel
          ? { label: '范围', value: skill.rangeTypeLabel }
          : null,
      { label: '消耗', value: skill.mpCost ? `${skill.mpCost} MP` : '无' },
      skill.basePower ? { label: '威力', value: String(skill.basePower) } : null,
    ]),
    href: skill.href,
  };
};

export const cardFromSkillEntry = (entry: Row): TdjEntityCard | null => {
  if (!entry?.skill) return null;
  const card = cardFromSkill(entry.skill);
  const gate = entry.level > 0 ? `Lv.${entry.level}` : '初始持有';
  return {
    ...card,
    fields: fieldsOf([{ label: '习得', value: gate }, ...card.fields], 7),
  };
};

export const cardFromMonster = (monster: Row): TdjEntityCard => ({
  title: monster.name,
  kicker: '单位',
  body: `等级 ${monster.level} · 经验 ${monster.exp}`,
  fields: fieldsOf([
    { label: 'HP / MP', value: `${monster.hp} / ${monster.mp}` },
    { label: '攻 / 防', value: `${monster.atk} / ${monster.def}` },
    { label: '移动', value: String(monster.move) },
    ability(monster, 'str') ? { label: '力', value: ability(monster, 'str') } : null,
    ability(monster, 'mag') ? { label: '魔', value: ability(monster, 'mag') } : null,
    ability(monster, 'dex') ? { label: '技', value: ability(monster, 'dex') } : null,
    ability(monster, 'vit') ? { label: '体', value: ability(monster, 'vit') } : null,
  ]),
  imageSrc: monster.iconPath || undefined,
});

export const cardFromBattle = (battle: Row): TdjEntityCard => {
  const mapSize =
    battle.map?.width && battle.map?.height ? `${battle.map.width} × ${battle.map.height}` : '';
  const topEnemies = joinList(
    ((battle.topEnemies as Row[]) ?? []).map((enemy) => `${enemy.name}(${enemy.hp})`),
    3,
  );
  return {
    title: battle.displayTitle || battle.title || battle.id,
    kicker: battle.chapterLabel || '关卡',
    body: topEnemies ? `主要敌人：${topEnemies}` : undefined,
    fields: fieldsOf([
      mapSize ? { label: '地图', value: mapSize } : null,
      { label: '出战', value: `${battle.combatPlayerCount} / ${battle.playerCount}` },
      {
        label: '敌方',
        value: `${battle.enemyCount} 名 · 最高 Lv.${battle.maxEnemyLevel ?? '-'}`,
      },
      joinList(battle.itemNames, 3) ? { label: '携带', value: joinList(battle.itemNames, 3) } : null,
      joinList(battle.enemySkillNames, 3)
        ? { label: '技能', value: joinList(battle.enemySkillNames, 3) }
        : null,
      {
        label: '事件',
        value: `前 ${battle.introLineCount ?? 0} / 后 ${battle.outroLineCount ?? 0}`,
      },
    ]),
    href: battle.href,
    imageSrc: battle.map?.imagePath || undefined,
  };
};

export const cardFromCamp = (camp: Row): TdjEntityCard => ({
  title: `camp${String(camp.id).padStart(2, '0')}`,
  kicker: '营地',
  body: dash(camp.path, ''),
  fields: fieldsOf([
    camp.frameCount != null ? { label: '帧数', value: String(camp.frameCount) } : null,
    camp.imageId != null ? { label: '图像', value: String(camp.imageId) } : null,
    camp.link != null ? { label: '关联', value: String(camp.link) } : null,
    camp.flag != null ? { label: '标记', value: String(camp.flag) } : null,
  ]),
  imageSrc: camp.imagePath || undefined,
});

export const cardFromWeapon = (row: Row): TdjEntityCard => {
  const recipe =
    row.recipe?.length === 2 ? `${row.recipe[0].name} + ${row.recipe[1].name}` : '';
  const skill = row.useSkill
    ? `${row.useSkill.name}${row.useMpCost ? `（MP ${row.useMpCost}）` : ''}`
    : '';
  return {
    title: row.name,
    kicker: row.typeLabel || '武器',
    body: clip(dash(row.description, '')),
    fields: fieldsOf([
      { label: '攻击', value: signed(row.attack) },
      { label: '命中', value: signed(row.hit) },
      { label: '回避', value: signed(row.miss) },
      { label: '会心', value: signed(row.critical) },
      { label: '双击', value: signed(row.double) },
      rangeText(row.attackRangeMin, row.attackRangeMax)
        ? { label: '距离', value: rangeText(row.attackRangeMin, row.attackRangeMax) }
        : null,
      joinList(row.equipCharacters, 5)
        ? { label: '可装', value: joinList(row.equipCharacters, 5) }
        : null,
      skill ? { label: '战技', value: skill } : null,
      row.price ? { label: '价格', value: String(row.price) } : null,
      recipe ? { label: '炼化', value: recipe } : null,
    ], 8),
  };
};

export const cardFromItem = (row: Row): TdjEntityCard => {
  const recipe =
    row.recipe?.length === 2 ? `${row.recipe[0].name} + ${row.recipe[1].name}` : '';
  const effect = row.useEffect
    ? `${row.useEffect}${row.usePower ? ` ${signed(row.usePower)}` : ''}`
    : row.useSkill
      ? `施放「${row.useSkill.name}」${row.usePower ? `（威力 ${row.usePower}）` : ''}`
      : '';
  return {
    title: row.name,
    kicker: row.typeLabel || '道具',
    body: clip(dash(row.description, '')),
    fields: fieldsOf([
      effect ? { label: '效果', value: effect } : null,
      rangeText(row.useRangeMin, row.useRangeMax)
        ? { label: '距离', value: rangeText(row.useRangeMin, row.useRangeMax) }
        : null,
      row.price ? { label: '价格', value: String(row.price) } : null,
      recipe ? { label: '炼化', value: recipe } : null,
    ]),
  };
};

export const cardFromAlchemy = (row: Row): TdjEntityCard => {
  const effect = row.effect ? `${row.effect}${row.effectPower ? ` ${signed(row.effectPower)}` : ''}` : '';
  const isItem = row.productType === 0;
  const recipe = `${row.ingredient1?.name} + ${row.ingredient2?.name}`;
  return {
    title: row.productName,
    kicker: row.productTypeLabel || '炼化',
    body: isItem ? clip(dash(row.description, '')) : undefined,
    fields: fieldsOf(
      isItem
        ? [
            effect ? { label: '效果', value: effect } : null,
            row.price ? { label: '价格', value: String(row.price) } : null,
            { label: '材料', value: recipe },
          ]
        : [
            { label: '材料', value: recipe },
            { label: '攻击', value: signed(row.attack) },
            { label: '防御', value: signed(row.defence) },
            { label: '命中', value: signed(row.hit) },
            { label: '回避', value: signed(row.miss) },
            { label: '会心', value: signed(row.critical) },
            { label: '双击', value: signed(row.double) },
            joinList(row.equipCharacters, 5)
              ? { label: '可装', value: joinList(row.equipCharacters, 5) }
              : null,
            row.price ? { label: '价格', value: String(row.price) } : null,
          ],
      8,
    ),
  };
};
