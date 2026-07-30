import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const sourceRoot = path.resolve(
  process.argv[2] ?? process.env.SWORDMAN_DATA_DIR ?? path.join(repoRoot, '..', 'swordman-unpack', 'exports', 'v1'),
);
const outputRoot = path.join(repoRoot, 'src/data/sword-man/generated');
const publicAssetRoot = path.join(repoRoot, 'public/assets/sword-man');
const characterPageRoot = path.join(repoRoot, 'src/content/docs/games/sword-man/characters');
const skillPageRoot = path.join(repoRoot, 'src/content/docs/games/sword-man/skills');
const battlePageRoot = path.join(repoRoot, 'src/content/docs/games/sword-man/battles');
const lastVerified = '2026-07-29';
const skillLastVerified = '2026-07-30';
const battleLastVerified = '2026-07-30';

const skillKindLabels = {
  magic: '法术',
  physical: '特技',
};

const attributeLabels = {
  cure: '治疗',
  dark: '暗',
  fire: '火',
  ice: '冰',
  illusion: '幻',
  light: '光',
  none: '无',
  thunder: '雷',
};

const targetLabels = {
  all: '全体',
  enemy: '敌方',
  self: '自身',
  summon: '召唤位置',
  user: '使用者',
};

const rangeLabels = {
  circle: '圆形',
  line: '直线',
  point: '单点',
  self: '自身',
};

const resultLabels = {
  attack: '伤害',
  blessing: '增益',
  cure: '治疗',
  curse: '妨害',
  damage: '伤害',
  effect: '状态',
  none: '无',
  purge: '驱散',
  special: '特殊',
};

const moveAttackLabels = {
  move: '移动后可用',
  stand: '原地使用',
};

const statLabels = {
  str: '力',
  int: '智',
  avg: '速',
  vit: '体',
  luk: '运',
};

const itemTypeLabels = {
  0: '道具',
  1: '武器',
  2: '防具',
  3: '饰品',
};

const itemEffectLabels = {
  0: '恢复体力',
  1: '恢复术力',
  2: '解除中毒',
  3: '解除麻痹',
  4: '解除封魔',
  5: '提升体力上限',
  6: '提升术力上限',
  7: '提升膂力上限',
  8: '提升灵智上限',
  9: '提升行动力上限',
  10: '提升筋力上限',
  11: '提升运气上限',
};

// EVENT talk instructions carry a face id rather than a speaker name. These
// labels are the stable face-to-character identities evidenced by the battle
// dialogue itself; face -1 deliberately stays unnamed because it is used by
// both narration and off-screen speakers.
const dialogueSpeakerByFaceId = new Map([
  [1, '殷劍平'],
  [2, '封寒月'],
  [3, '紫楓'],
  [4, '上官遠'],
  [5, '鮮于超'],
  [6, '真胤'],
  [7, '韓千秀'],
  [8, '燕明蓉'],
  [9, '夏侯儀'],
  [10, '不淨散人'],
  [11, '劍聖'],
  [17, '應奉仁'],
  [19, '禁軍士兵'],
  [20, '韋統領'],
  [24, '應靈華'],
  [25, '神隱上人'],
  [26, '王大人'],
  [27, '齊祀'],
  [32, '劍邪'],
  [33, '鄲陰'],
  [34, '韓無砂'],
  [35, '朱慎'],
  [36, '高戚'],
  [37, '靈山老人'],
  [38, '高世津'],
  [39, '方芸'],
  [40, '四象門弟子'],
  [41, '四象門弟子'],
  [43, '兩佰塊群'],
  [44, '兩佰塊群'],
  [49, '店小二'],
  [51, '兩佰塊群'],
]);

const readJson = async (relativePath) =>
  JSON.parse(await fs.readFile(path.join(sourceRoot, relativePath), 'utf8'));

const writeJson = async (fileName, value) => {
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const compactList = (items, limit = 8) => [...new Set(items.filter(Boolean))].slice(0, limit);
const asArray = (value) => (Array.isArray(value) ? value : Object.values(value ?? {}));
const label = (labels, value) => labels[value] ?? value ?? '-';
const cleanString = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const dialogueRow = (instruction, order) => {
  const faceId = Number.isInteger(instruction.face) ? instruction.face : null;
  return {
    kind: 'dialogue',
    order,
    messageIndex: Number.isInteger(instruction.num) ? instruction.num : null,
    speaker: dialogueSpeakerByFaceId.get(faceId)
      ?? (faceId !== null && faceId >= 0 ? `角色头像 #${faceId}` : '未署名'),
    faceId,
    text: cleanString(instruction.text) ?? '（原始文本为空）',
  };
};
const dialogueRows = (instructions) => (instructions ?? [])
  .filter((instruction) => instruction.op === 'talk')
  .map((instruction, index) => dialogueRow(instruction, index + 1));

const copyAsset = async (relativeSource, relativeOutput) => {
  const source = path.join(sourceRoot, relativeSource);
  const target = path.join(publicAssetRoot, relativeOutput);
  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    await fs.copyFile(source, target);
    return `/assets/sword-man/${relativeOutput.replaceAll(path.sep, '/')}`;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};

const existingPublicAsset = async (relativeOutput) => {
  try {
    await fs.access(path.join(publicAssetRoot, relativeOutput));
    return `/assets/sword-man/${relativeOutput.replaceAll(path.sep, '/')}`;
  } catch {
    return null;
  }
};

const validateBundle = async (manifest) => {
  if (manifest.schemaVersion !== 1 || manifest.producer !== 'swordman-unpack') {
    throw new Error(`Unsupported swordman data contract: ${manifest.producer} v${manifest.schemaVersion}`);
  }
  const dataset = createHash('sha256');
  for (const entry of manifest.files ?? []) {
    const content = await fs.readFile(path.join(sourceRoot, entry.path));
    const digest = createHash('sha256').update(content).digest('hex');
    if (content.length !== entry.size || digest !== entry.sha256) {
      throw new Error(`Swordman data hash mismatch: ${entry.path}`);
    }
    dataset.update(entry.path, 'utf8');
    dataset.update('\0');
    dataset.update(entry.sha256, 'ascii');
    dataset.update('\n');
  }
  if (dataset.digest('hex') !== manifest.datasetHash) {
    throw new Error('Swordman datasetHash mismatch');
  }
};

const stageNumber = (fileName) => {
  const match = fileName.match(/stage(\d+)/i);
  return match ? Number(match[1]) : 999;
};

const skillBrief = (skill) =>
  skill
    ? {
        id: skill.id,
        name: skill.name,
        href: `/games/sword-man/skills/${skill.id}/`,
        kind: skill.kind,
        kindLabel: label(skillKindLabels, skill.kind),
        attribute: skill.attribute ?? skill.attribute_type_name,
        attributeLabel: label(attributeLabels, skill.attribute ?? skill.attribute_type_name),
        mpCost: skill.mpCost ?? skill.mp_cost,
        basePower: skill.basePower ?? skill.base_power,
        resultLabel: skill.resultLabel ?? label(resultLabels, skill.result_type_name),
        targetLabel: skill.targetLabel ?? label(targetLabels, skill.target_type_name),
        rangeTypeLabel: skill.rangeTypeLabel ?? label(rangeLabels, skill.range_type_name),
        attackRangeMin: skill.attackRangeMin ?? skill.attack_range_min,
        attackRangeMax: skill.attackRangeMax ?? skill.attack_range_max,
        description: cleanString(skill.description),
      }
    : null;

const formatGrowth = (growth) =>
  ['str', 'int', 'avg', 'vit', 'luk']
    .map((key) => `${statLabels[key]}${growth?.[`${key}_base`] ?? '-'}`)
    .join(' / ');

const writeCharacterPages = async (characters) => {
  await fs.mkdir(characterPageRoot, { recursive: true });
  for (const character of characters) {
    const content = `---
title: ${JSON.stringify(character.name)}
description: ${JSON.stringify(`《天地劫·神魔至尊传》${character.name}的初始属性、装备、成长和招式习得条件。`)}
game: '天地劫·神魔至尊传'
lastVerified: '${lastVerified}'
sidebar:
  hidden: true
---

import TdjCharacterProfile from '../../../../../components/TdjCharacterProfile.astro';

<TdjCharacterProfile characterId={${character.id}} />
`;
    await fs.writeFile(path.join(characterPageRoot, `${character.id}.mdx`), content, 'utf8');
  }
};

const writeSkillPages = async (skills) => {
  await fs.mkdir(skillPageRoot, { recursive: true });
  for (const skill of skills) {
    const content = `---
title: ${JSON.stringify(skill.name)}
description: ${JSON.stringify(`《天地劫·神魔至尊传》${skill.name}的效果、范围、消耗、习得条件和原版演出。`)}
game: '天地劫·神魔至尊传'
lastVerified: '${skillLastVerified}'
sidebar:
  hidden: true
---

import TdjSkillProfile from '../../../../../components/TdjSkillProfile.astro';

<TdjSkillProfile skillId={${skill.id}} />
`;
    await fs.writeFile(path.join(skillPageRoot, `${skill.id}.mdx`), content, 'utf8');
  }
};

const writeBattlePages = async (battles) => {
  await fs.mkdir(battlePageRoot, { recursive: true });
  for (const battle of battles) {
    const content = `---
title: ${JSON.stringify(battle.displayTitle)}
description: ${JSON.stringify(`《天地劫·神魔至尊传》${battle.displayTitle}的战前战后剧情、过场影片、出场阵容、胜败条件与战场资料。`)}
game: '天地劫·神魔至尊传'
lastVerified: '${battleLastVerified}'
sidebar:
  hidden: true
---

import TdjBattleProfile from '../../../../../components/TdjBattleProfile.astro';

<TdjBattleProfile stageId=${JSON.stringify(battle.id)} />
`;
    await fs.writeFile(path.join(battlePageRoot, `${battle.id.toLowerCase()}.mdx`), content, 'utf8');
  }
};

const main = async () => {
  await fs.access(sourceRoot);

  const manifest = await readJson('manifest.json');
  await validateBundle(manifest);
  const [charactersDb, skillsDb, skillVisualsDb, storyMoviesDb, monstersDb, levelUpDb, campsDb, itemsDb, alchemyDb, unitIconsDb, stagesDb, battleMapsDb] = await Promise.all([
    readJson('catalog/characters.json'),
    readJson('catalog/skills.json'),
    readJson('catalog/skill_visuals.json'),
    readJson('catalog/story_movies.json'),
    readJson('catalog/monsters.json'),
    readJson('catalog/level_up.json'),
    readJson('catalog/camps.json'),
    readJson('catalog/items.json'),
    readJson('catalog/alchemy.json'),
    readJson('catalog/unit_icons.json'),
    readJson('catalog/stages.json'),
    readJson('catalog/battle_maps.json'),
  ]);
  const itemRecords = asArray(itemsDb.records);
  const itemById = new Map(itemRecords.map((record) => [record.index, record]));
  const itemNames = Object.fromEntries(
    Object.entries(itemsDb.names ?? {}).map(([id, name]) => [Number(id), name]),
  );
  const itemName = (id) => itemNames[id] ?? itemById.get(id)?.name ?? itemById.get(id)?.source_name ?? `#${id}`;

  const unitIconByCategoryId = new Map();
  await fs.rm(path.join(publicAssetRoot, 'unit-icons'), { recursive: true, force: true });
  for (const record of asArray(unitIconsDb.records).sort((a, b) => a.category_id - b.category_id)) {
    const categoryId = Number(record.category_id);
    const sourcePath = cleanString(record.path);
    const outputName = `unit-icons/${String(categoryId).padStart(3, '0')}.png`;
    const iconPath = sourcePath ? await copyAsset(sourcePath, outputName) : null;
    if (iconPath) unitIconByCategoryId.set(categoryId, iconPath);
  }

  const skills = asArray(skillsDb)
    .sort((a, b) => a.id - b.id)
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      href: `/games/sword-man/skills/${skill.id}/`,
      kind: skill.kind,
      kindLabel: label(skillKindLabels, skill.kind),
      moveAttackType: skill.move_attack_type_name,
      moveAttackTypeLabel: label(moveAttackLabels, skill.move_attack_type_name),
      attribute: skill.attribute_type_name,
      attributeLabel: label(attributeLabels, skill.attribute_type_name),
      result: skill.result_type_name,
      resultLabel: label(resultLabels, skill.result_type_name),
      target: skill.target_type_name,
      targetLabel: label(targetLabels, skill.target_type_name),
      rangeType: skill.range_type_name,
      rangeTypeLabel: label(rangeLabels, skill.range_type_name),
      attackRadius: skill.attack_range,
      attackRangeMin: skill.attack_range_min,
      attackRangeMax: skill.attack_range_max,
      mpCost: skill.mp_cost,
      moveCost: skill.move_cost,
      basePower: skill.base_power,
      hit: skill.hit,
      hitAdd: skill.hit_add,
      resultEffect: skill.result_effect,
      resultEffectName: skill.result_effect_name,
      otherType: skill.other_type,
      otherTypeName: skill.other_type_name,
      otherEffect: skill.other_effect,
      otherEffectName: skill.other_effect_name,
      additions: skill.additions,
      animationId: skill.animation_id,
      hasMovie: Boolean(skill.has_movie),
      battleType: skill.battle_type,
      battleTypeName: skill.battle_type_name,
      battleRanged: skill.battle_ranged,
      battleRangedName: skill.battle_ranged_name,
      battleSprite: skill.battle_sprite,
      description: cleanString(skill.description),
    }));
  const skillVisualById = new Map(
    asArray(skillVisualsDb.records).map((record) => [Number(record.skill_id), record]),
  );
  await fs.rm(path.join(publicAssetRoot, 'skill-effects'), { recursive: true, force: true });
  for (const skill of skills) {
    const visual = skillVisualById.get(Number(skill.id));
    const preview = visual?.preview;
    const movie = visual?.movie;
    skill.visualInfo = visual
      ? {
          status: visual.status,
          route: visual.route,
          cast: visual.cast,
          impact: visual.impact,
          casterDependent: Boolean(visual.caster_dependent),
          mainSource: visual.main_source,
          mainSourceExists: visual.main_source_exists,
          movieSource: visual.movie_source,
          movieSourceExists: visual.movie_source_exists,
          casterCandidates: visual.caster_candidates ?? [],
        }
      : null;
    skill.movie = null;
    const directory = `skill-effects/${String(skill.id).padStart(3, '0')}`;
    if (movie) {
      const [moviePath, moviePosterPath] = await Promise.all([
        copyAsset(movie.public_path, `${directory}/cutscene.mp4`),
        copyAsset(movie.poster, `${directory}/cutscene-poster.png`),
      ]);
      skill.movie = moviePath && moviePosterPath
        ? {
            kind: movie.kind,
            moviePath,
            posterPath: moviePosterPath,
            durationMs: movie.duration_ms,
            width: movie.width,
            height: movie.height,
            frameRate: movie.frame_rate,
            hasAudio: Boolean(movie.has_audio),
            audioChannels: movie.audio_channels,
            audioSampleRate: movie.audio_sample_rate,
            sourceContainer: movie.source_container,
            sourceVideoCodec: movie.source_video_codec,
            sourceAudioCodec: movie.source_audio_codec,
          }
        : null;
    }
    if (!preview) {
      continue;
    }
    const [posterPath, compactPath, fullPath] = await Promise.all([
      copyAsset(preview.poster, `${directory}/poster.png`),
      copyAsset(preview.compact, `${directory}/compact.webp`),
      copyAsset(preview.full, `${directory}/full.webp`),
    ]);
    skill.visual = posterPath && compactPath && fullPath
      ? {
          route: visual.route,
          casterDependent: Boolean(visual.caster_dependent),
          kind: preview.kind,
          posterPath,
          compactPath,
          fullPath,
          compactSegments: preview.compact_segments,
          fullSegments: preview.full_segments,
          representativeCaster: preview.representative_caster,
          representativeTarget: preview.representative_target,
          durationMs: preview.duration_ms,
          audio: preview.audio,
        }
      : null;
  }
  const skillById = new Map(skills.map((skill) => [skill.id, skill]));

  const levelByCharacterId = new Map(asArray(levelUpDb).map((record) => [record.char_id, record]));
  const characters = charactersDb.records.map((record) => {
    const characterId = record.character_id ?? record.id + 1;
    const growth = levelByCharacterId.get(characterId);
    const learnedSkills = (growth?.skills ?? [])
      .filter((entry) => entry.skill_id >= 0)
      .map((entry) => ({
        level: entry.level,
        spirit: entry.spirit,
        skillId: entry.skill_id,
        skill: skillBrief(skillById.get(entry.skill_id)),
      }));
    const initialSkills = (record.skills ?? [])
      .filter((skillId) => skillId >= 0)
      .map((skillId) => ({
        skillId,
        skill: skillBrief(skillById.get(skillId)),
      }));

    return {
      id: characterId,
      dataIndex: record.id,
      name: record.name ?? charactersDb.names[String(characterId)] ?? `角色 ${characterId}`,
      href: `/games/sword-man/characters/${characterId}/`,
      iconPath: unitIconByCategoryId.get(characterId) ?? null,
      level: record.level,
      hp: record.hp,
      mp: record.mp,
      str: record.str,
      int: record.int,
      avg: record.avg,
      vit: record.vit,
      luk: record.luk,
      spirit: record.spirit,
      weaponId: record.weapon_id,
      weaponName: itemName(record.weapon_id) ?? record.weapon_name,
      armorId: record.armor_id,
      armorName: itemName(record.armor_id) ?? record.armor_name,
      accessoryId: record.accessory_id,
      accessoryName: record.accessory_id >= 0 ? itemName(record.accessory_id) : null,
      growth: growth
        ? {
            hpRandMax: growth.hp_rand_max,
            mpRandMax: growth.mp_rand_max,
            strBase: growth.str_base,
            strRandMax: growth.str_rand_max,
            intBase: growth.int_base,
            intRandMax: growth.int_rand_max,
            avgBase: growth.avg_base,
            avgRandMax: growth.avg_rand_max,
            vitBase: growth.vit_base,
            vitRandMax: growth.vit_rand_max,
            lukBase: growth.luk_base,
            lukRandMax: growth.luk_rand_max,
            summary: formatGrowth(growth),
          }
        : null,
      initialSkills,
      initialSkillCount: initialSkills.length,
      learnedSkills,
      learnedSkillCount: learnedSkills.length,
    };
  }).sort((a, b) => a.id - b.id);

  for (const skill of skills) skill.learnedBy = [];
  for (const character of characters) {
    for (const entry of character.initialSkills ?? []) {
      skillById.get(entry.skillId)?.learnedBy.push({
        characterId: character.id,
        characterName: character.name,
        characterHref: character.href,
        characterIconPath: character.iconPath,
        acquisition: 'initial',
        acquisitionLabel: '初始持有',
        level: null,
        spirit: null,
      });
    }
    for (const entry of character.learnedSkills ?? []) {
      skillById.get(entry.skillId)?.learnedBy.push({
        characterId: character.id,
        characterName: character.name,
        characterHref: character.href,
        characterIconPath: character.iconPath,
        acquisition: 'level_up',
        acquisitionLabel: '升级习得',
        level: entry.level,
        spirit: entry.spirit,
      });
    }
  }

  const characterByDataIndex = new Map(characters.map((character) => [character.dataIndex, character]));
  const characterById = new Map(characters.map((character) => [character.id, character]));
  const recipeByProductId = new Map(
    asArray(alchemyDb.records).map((recipe) => [recipe.product_id, recipe]),
  );
  const catalogItem = (record) => {
    const equipCharacters = (record.equip_units ?? [])
      .map((unitId) => characterByDataIndex.get(unitId)?.name)
      .filter(Boolean);
    const recipe = recipeByProductId.get(record.index);
    const useSkill = skillById.get(record.use_skill_id);
    return {
      id: record.index,
      name: itemName(record.index),
      type: record.item_type,
      typeLabel: itemTypeLabels[record.item_type] ?? `类型 ${record.item_type}`,
      attack: record.attack ?? 0,
      hit: record.attack_hit ?? 0,
      miss: record.attack_miss ?? 0,
      critical: record.attack_critical ?? 0,
      double: record.attack_double ?? 0,
      attackRangeMin: record.attack_range_min ?? 0,
      attackRangeMax: record.attack_range_max ?? 0,
      equipCharacters: [...new Set(equipCharacters)],
      useEffect: itemEffectLabels[record.use_effect_type] ?? null,
      usePower: record.use_base_power ?? 0,
      useSkill: useSkill ? { id: useSkill.id, name: useSkill.name } : null,
      useMpCost: record.use_mp_cost ?? 0,
      useRangeMin: record.use_range_min ?? 0,
      useRangeMax: record.use_range_max ?? 0,
      isConsumable: Boolean(record.is_consumable),
      price: record.price ?? 0,
      recipe: recipe
        ? recipe.ingredient_ids.map((ingredientId) => ({ id: ingredientId, name: itemName(ingredientId) }))
        : null,
      description: cleanString(record.description),
    };
  };
  const itemCatalog = {
    // Item_dat also contains monster-only natural attacks under item_type=1.
    // A wiki weapon is player equipment only: at least one hero (data index 0-9) can equip it.
    weapons: itemRecords
      .filter((record) => record.item_type === 1 && (record.equip_units ?? []).some((unitId) => characterByDataIndex.has(unitId)))
      .sort((a, b) => a.index - b.index)
      .map(catalogItem),
    items: itemRecords
      .filter((record) => record.item_type === 0)
      .sort((a, b) => a.index - b.index)
      .map(catalogItem),
  };
  const alchemy = asArray(alchemyDb.records)
    .sort((a, b) => a.product_id - b.product_id)
    .map((recipe) => {
      const product = itemById.get(recipe.product_id) ?? {};
      const [ingredient1, ingredient2] = recipe.ingredient_ids;
      const equipCharacters = (product.equip_units ?? [])
        .map((unitId) => characterByDataIndex.get(unitId)?.name)
        .filter(Boolean);
      const effectLabel = itemEffectLabels[product.use_effect_type] ?? null;
      return {
        productId: recipe.product_id,
        productName: recipe.product_name ?? itemName(recipe.product_id),
        productType: recipe.product_type,
        productTypeLabel: itemTypeLabels[recipe.product_type] ?? `类型 ${recipe.product_type}`,
        ingredient1: { id: ingredient1, name: itemName(ingredient1) },
        ingredient2: { id: ingredient2, name: itemName(ingredient2) },
        attack: product.attack ?? 0,
        defence: product.defence ?? 0,
        hit: product.attack_hit ?? 0,
        miss: product.attack_miss ?? 0,
        critical: product.attack_critical ?? 0,
        double: product.attack_double ?? 0,
        effect: effectLabel,
        effectPower: product.use_base_power ?? 0,
        price: product.price ?? 0,
        equipCharacters: [...new Set(equipCharacters)],
        description: cleanString(product.description),
      };
    });

  const monsters = asArray(monstersDb)
    .filter((monster) => monster.index >= 10)
    .sort((a, b) => a.index - b.index)
    .map((monster) => ({
      id: monster.index,
      name: monster.name,
      level: monster.level,
      hp: monster.hp,
      hpGrow: monster.hp_grow,
      mp: monster.mp,
      atk: monster.atk,
      def: monster.def,
      move: monster.move,
      exp: monster.exp,
      camp: monster.camp,
      categoryId: monster.category_id,
      iconPath: unitIconByCategoryId.get(monster.category_id) ?? null,
      attrDefenceId: monster.attr_defence_id,
      abilities: monster.abilities,
    }));

  const storyMovieById = new Map();
  await fs.rm(path.join(publicAssetRoot, 'story-movies'), { recursive: true, force: true });
  for (const record of asArray(storyMoviesDb.records).sort((a, b) => a.movie_id - b.movie_id)) {
    const movieId = Number(record.movie_id);
    const media = record.media;
    if (!Number.isInteger(movieId) || record.status !== 'referenced' || !media) continue;
    const directory = `story-movies/${String(movieId).padStart(2, '0')}`;
    const [moviePath, posterPath] = await Promise.all([
      copyAsset(media.public_path, `${directory}/cutscene.mp4`),
      copyAsset(media.poster, `${directory}/cutscene-poster.png`),
    ]);
    if (!moviePath || !posterPath) {
      throw new Error(`Missing canonical story movie asset: Movie_${String(movieId).padStart(2, '0')}`);
    }
    storyMovieById.set(movieId, {
      id: movieId,
      name: record.name,
      status: record.status,
      moviePath,
      posterPath,
      durationMs: media.duration_ms,
      width: media.width,
      height: media.height,
      frameRate: media.frame_rate,
      hasAudio: Boolean(media.has_audio),
    });
  }

  const storyReferencesByStage = new Map();
  for (const reference of asArray(storyMoviesDb.references)) {
    const stageId = cleanString(reference.stage_id);
    const movie = storyMovieById.get(Number(reference.movie_id));
    if (!stageId || !movie) continue;
    if (!storyReferencesByStage.has(stageId)) storyReferencesByStage.set(stageId, []);
    storyReferencesByStage.get(stageId).push({
      ...reference,
      movie,
    });
  }
  for (const references of storyReferencesByStage.values()) {
    references.sort((a, b) => a.event_id - b.event_id || a.step_index - b.step_index);
  }

  const battleMapByStageId = new Map();
  await fs.rm(path.join(publicAssetRoot, 'battle-maps'), { recursive: true, force: true });
  for (const record of asArray(battleMapsDb.records).sort((a, b) => stageNumber(a.stage_id) - stageNumber(b.stage_id))) {
    const stageId = cleanString(record.stage_id);
    const sourcePath = cleanString(record.path);
    if (!stageId || !sourcePath) throw new Error('Invalid canonical battle map record');
    const outputName = `battle-maps/${stageId.toLowerCase()}.png`;
    const imagePath = await copyAsset(sourcePath, outputName);
    if (!imagePath) throw new Error(`Missing canonical battle map asset: ${stageId}`);
    battleMapByStageId.set(stageId, {
      imagePath,
      width: Number(record.width),
      height: Number(record.height),
      kind: record.kind,
    });
  }

  const stageById = new Map(asArray(stagesDb.records).map((stage) => [stage.stage_id, stage]));
  const unitCategoryByType = new Map(
    asArray(monstersDb).map((unit) => [Number(unit.index), Number(unit.category_id)]),
  );
  const battleDir = path.join(sourceRoot, 'battles');
  const battleFiles = (await fs.readdir(battleDir)).filter((file) => file.toLowerCase().endsWith('.json'));
  const battles = [];

  const unitCategoryId = (unit) => {
    const characterId = Number(unit.char_id);
    if (characterId > 0 && characterById.has(characterId)) return characterId;
    const type = Number(unit.type);
    return Number.isInteger(type) ? unitCategoryByType.get(type) ?? null : null;
  };
  const equipmentLabel = (equipment) => {
    const name = cleanString(equipment?.name);
    if (name) return name;
    const id = Number(equipment?.id);
    if (!Number.isInteger(id) || id < 0) return null;
    const slotLabel = { weapon: '武器', armor: '防具', accessory: '饰品' }[equipment.slot] ?? '装备';
    return `${slotLabel} #${id}（名称未解析）`;
  };
  const numericRange = (values) => {
    const numbers = values.filter((value) => Number.isFinite(value));
    return numbers.length ? { min: Math.min(...numbers), max: Math.max(...numbers) } : null;
  };
  const rosterGroups = (units) => {
    const groups = new Map();
    for (const unit of units) {
      const categoryId = unitCategoryId(unit);
      const combatant = unit.combatant !== false;
      const key = `${categoryId ?? 'unknown'}:${unit.name ?? '未命名'}:${combatant ? 'combat' : 'scene'}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(unit);
    }
    return [...groups.values()].map((group) => {
      const first = group[0];
      const categoryId = unitCategoryId(first);
      const character = Number(first.char_id) > 0 ? characterById.get(Number(first.char_id)) : null;
      const equipmentNames = compactList(group.flatMap((unit) => (unit.equipment ?? []).map(equipmentLabel)), 16);
      const namedEquipment = new Set(
        group.flatMap((unit) => (unit.equipment ?? []).map((equipment) => cleanString(equipment.name))).filter(Boolean),
      );
      return {
        name: first.name ?? '未命名单元',
        count: group.length,
        sourceUnitType: Number.isInteger(Number(first.type)) ? Number(first.type) : null,
        categoryId,
        iconPath: categoryId ? unitIconByCategoryId.get(categoryId) ?? null : null,
        characterHref: character?.href ?? null,
        combatant: first.combatant !== false,
        usesPartyState: Boolean(character),
        levels: numericRange(group.map((unit) => unit.level)),
        hp: numericRange(group.map((unit) => unit.hp)),
        mp: numericRange(group.map((unit) => unit.mp)),
        atk: numericRange(group.map((unit) => unit.atk)),
        def: numericRange(group.map((unit) => unit.def)),
        move: numericRange(group.map((unit) => unit.move)),
        range: numericRange(group.map((unit) => unit.range)),
        equipmentNames,
        itemNames: compactList(
          group.flatMap((unit) => unit.items ?? []).filter((name) => cleanString(name) && !namedEquipment.has(name)),
          16,
        ),
        skillNames: compactList(group.flatMap((unit) => unit.skills ?? []), 24),
        positions: group.map((unit) => ({ id: unit.idx, x: unit.x, y: unit.y })),
      };
    });
  };
  const judgeConditionRows = (rules, units, side) => {
    const unitById = new Map(units.map((unit) => [unit.idx, unit]));
    return (rules ?? [])
      .filter((rule) => rule.rule_name !== 'none')
      .map((rule) => {
        const unit = unitById.get(rule.unit_id);
        let description = `规则 ${rule.rule_name}`;
        if (rule.rule_name === 'kill_all') description = '消灭全部敌人';
        if (rule.rule_name === 'kill_one' && side === 'win') description = `击败${unit?.name ?? `指定单位 #${rule.unit_id}`}`;
        if (rule.rule_name === 'kill_one' && side === 'lose') description = `${unit?.name ?? `指定单位 #${rule.unit_id}`}阵亡`;
        return {
          rule: rule.rule,
          ruleName: rule.rule_name,
          unitId: rule.unit_id,
          eventId: rule.event_id,
          unitName: unit?.name ?? null,
          description,
        };
      });
  };

  const triggerLabel = (references) => {
    const unitNames = compactList(
      references.flatMap((reference) => (reference.triggers ?? [])
        .filter((trigger) => trigger.kind === 'unit_kill')
        .flatMap((trigger) => trigger.units ?? [])
        .map((unit) => cleanString(unit.unit_name))),
      12,
    );
    if (unitNames.length) return `击倒${unitNames.join('或')}`;
    const triggerKinds = new Set(references.flatMap((reference) => (reference.triggers ?? []).map((trigger) => trigger.kind)));
    if (triggerKinds.has('judge_win')) return '达成胜利条件';
    if (triggerKinds.has('judge_lose')) return '触发失败条件';
    if (references.some((reference) => reference.placement === 'before_battle')) return '战斗开始前';
    if (triggerKinds.has('turn_event')) return '战中条件事件';
    return '剧情事件触发';
  };

  const movieScene = (movie, references, order) => {
    const first = references[0];
    return {
      kind: 'movie',
      order,
      movieId: movie.id,
      name: movie.name,
      moviePath: movie.moviePath,
      posterPath: movie.posterPath,
      durationMs: movie.durationMs,
      width: movie.width,
      height: movie.height,
      frameRate: movie.frameRate,
      hasAudio: movie.hasAudio,
      placement: first?.placement ?? null,
      group: first?.group ?? null,
      triggerLabel: triggerLabel(references),
      contextBefore: cleanString(first?.dialogue_before?.text),
      contextAfter: cleanString(first?.dialogue_after?.text),
      sourceEvents: references.map((reference) => ({
        eventId: reference.event_id,
        stepIndex: reference.step_index,
        source: reference.source,
      })),
    };
  };

  const storyRows = (instructions, placement, references) => {
    let storyOrder = 0;
    return (instructions ?? []).flatMap((instruction) => {
      if (instruction.op === 'talk') {
        storyOrder += 1;
        return [dialogueRow(instruction, storyOrder)];
      }
      if (instruction.op !== 'movie') return [];
      const movie = storyMovieById.get(Number(instruction.id));
      if (!movie) return [];
      storyOrder += 1;
      const matching = references.filter((reference) =>
        Number(reference.movie_id) === movie.id && reference.placement === placement);
      return [movieScene(movie, matching, storyOrder)];
    });
  };

  const additionalMovieScenes = (references, inlineMovieIds) => {
    const grouped = new Map();
    for (const reference of references) {
      if (inlineMovieIds.has(Number(reference.movie_id))) continue;
      const key = `${reference.placement}:${reference.group}:${reference.movie_id}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(reference);
    }
    return [...grouped.values()]
      .sort((a, b) => a[0].event_id - b[0].event_id || a[0].step_index - b[0].step_index)
      .map((group, index) => movieScene(group[0].movie, group, index + 1));
  };

  for (const file of battleFiles.sort((a, b) => stageNumber(a) - stageNumber(b))) {
    const battle = JSON.parse(await fs.readFile(path.join(battleDir, file), 'utf8'));
    const order = stageNumber(file);
    const id = `Stage${String(order).padStart(2, '0')}`;
    const stage = stageById.get(id);
    if (!stage) throw new Error(`Missing original stage title record: ${id}`);
    const battleMap = battleMapByStageId.get(id);
    if (!battleMap) throw new Error(`Missing published battle map: ${id}`);
    const players = battle.players ?? [];
    const enemies = battle.enemies ?? [];
    const combatPlayers = players.filter((unit) => unit.combatant !== false);
    const introDialogue = dialogueRows(battle.intro);
    const outroDialogue = dialogueRows(battle.outro);
    const storyReferences = storyReferencesByStage.get(id) ?? [];
    const introStory = storyRows(battle.intro, 'before_battle', storyReferences);
    const outroStory = storyRows(battle.outro, 'after_battle', storyReferences);
    const inlineMovieIds = new Set(
      [...(battle.intro ?? []), ...(battle.outro ?? [])]
        .filter((instruction) => instruction.op === 'movie')
        .map((instruction) => Number(instruction.id)),
    );
    const extraMovieScenes = additionalMovieScenes(storyReferences, inlineMovieIds);
    const topEnemies = [...enemies]
      .sort((a, b) => (b.hp ?? 0) - (a.hp ?? 0))
      .slice(0, 3)
      .map((enemy) => ({
        name: enemy.name,
        hp: enemy.hp,
        level: enemy.level,
      }));

    battles.push({
      id,
      order,
      file,
      title: cleanString(stage.title),
      battleTitle: cleanString(stage.battle_title),
      chapterLabel: cleanString(stage.chapter_label),
      name: cleanString(stage.name),
      battleName: cleanString(stage.battle_name),
      titleStatus: stage.status,
      displayTitle: cleanString(stage.title) ?? cleanString(stage.battle_title) ?? `原始标题为空（${id}）`,
      href: `/games/sword-man/battles/${id.toLowerCase()}/`,
      source: battle.source,
      map: {
        texture: battle.map?.tex ?? null,
        width: battle.map?.w ?? null,
        height: battle.map?.h ?? null,
        cellWidth: battle.map?.cell_w ?? null,
        cellHeight: battle.map?.cell_h ?? null,
        area: battle.map?.w && battle.map?.h ? battle.map.w * battle.map.h : null,
        blockedCount: battle.map?.blocked?.length ?? 0,
        walkableCount: battle.map?.w && battle.map?.h
          ? battle.map.w * battle.map.h - (battle.map?.blocked?.length ?? 0)
          : null,
        imagePath: battleMap.imagePath,
        imageWidth: battleMap.width,
        imageHeight: battleMap.height,
        imageKind: battleMap.kind,
      },
      playerCount: players.length,
      combatPlayerCount: combatPlayers.length,
      enemyCount: enemies.length,
      introLineCount: battle.intro?.length ?? 0,
      outroLineCount: battle.outro?.length ?? 0,
      introInstructionCount: battle.intro?.length ?? 0,
      outroInstructionCount: battle.outro?.length ?? 0,
      introTalkCount: introDialogue.length,
      outroTalkCount: outroDialogue.length,
      introStory,
      outroStory,
      battleMovieScenes: extraMovieScenes.filter((scene) => scene.placement === 'during_battle'),
      endingMovieScenes: extraMovieScenes.filter((scene) => scene.placement === 'after_battle'),
      playerNames: compactList(players.map((unit) => unit.name), 12),
      enemyNames: compactList(enemies.map((unit) => unit.name), 12),
      enemySkillNames: compactList(enemies.flatMap((unit) => unit.skills ?? []), 8),
      itemNames: compactList([...players, ...enemies].flatMap((unit) => unit.items ?? []), 10),
      maxEnemyLevel: Math.max(0, ...enemies.map((unit) => unit.level ?? 0)),
      topEnemies,
      playerRoster: rosterGroups(players),
      enemyRoster: rosterGroups(enemies),
      winConditions: asArray(stage.victory_conditions).map((description) => ({
        description,
        source: 'SDES',
      })),
      loseConditions: asArray(stage.defeat_conditions).map((description) => ({
        description,
        source: 'SDES',
      })),
      judgeWinConditions: judgeConditionRows(battle.judge?.win, enemies, 'win'),
      judgeLoseConditions: judgeConditionRows(battle.judge?.lose, players, 'lose'),
      transition: {
        decoded: Boolean(battle.transition && Object.keys(battle.transition).length),
        town: Number.isInteger(battle.transition?.town) && battle.transition.town >= 0 ? battle.transition.town : null,
        camp: Number.isInteger(battle.transition?.camp) && battle.transition.camp >= 0 ? battle.transition.camp : null,
        nextStageId: Number.isInteger(battle.transition?.next) && battle.transition.next >= 0
          ? `Stage${String(battle.transition.next).padStart(2, '0')}`
          : null,
        nextStageHref: null,
        nextStageTitle: null,
      },
    });
  }
  if (battles.length !== stageById.size) {
    throw new Error(`Stage title/battle count mismatch: ${stageById.size} titles, ${battles.length} battles`);
  }
  const battleById = new Map(battles.map((battle) => [battle.id, battle]));
  for (const battle of battles) {
    const next = battleById.get(battle.transition.nextStageId);
    battle.transition.nextStageHref = next?.href ?? null;
    battle.transition.nextStageTitle = next?.displayTitle ?? null;
  }

  const campImages = new Map();
  const camps = [];
  await fs.rm(path.join(publicAssetRoot, 'camps'), { recursive: true, force: true });
  for (const camp of asArray(campsDb).sort((a, b) => a.id - b.id)) {
    const sourceImagePath = cleanString(camp.preview_path);
    const resourcePath = cleanString(camp.image_path) ?? cleanString(camp.path);
    const outputName = resourcePath ? `camps/${resourcePath}-preview.png` : null;
    const imagePath = sourceImagePath && outputName ? await copyAsset(sourceImagePath, outputName) : null;
    if (imagePath) campImages.set(camp.id, imagePath);
    camps.push({
      id: camp.id,
      imageId: camp.image_id,
      link: camp.link,
      flag: camp.flag,
      frameCount: camp.frame_count,
      path: resourcePath,
      hasImage: Boolean(imagePath),
      previewFrameIndex: camp.preview_frame_index,
      previewKind: camp.preview_kind,
      imagePath,
    });
  }

  const assets = {
    showcase: await existingPublicAsset('showcase.png'),
    appIcon: await copyAsset('assets/public/app-icon.png', 'app-icon.png'),
    featuredCamps: [1, 2, 5, 9].map((id) => campImages.get(id)).filter(Boolean),
  };

  const summary = {
    title: '天地劫·神魔至尊传',
    slug: 'sword-man',
    dataset: {
      schemaVersion: manifest.schemaVersion,
      hash: manifest.datasetHash,
    },
    counts: {
      characters: characters.length,
      weapons: itemCatalog.weapons.length,
      items: itemCatalog.items.length,
      skills: skills.length,
      storyMovies: storyMovieById.size,
      storyMovieReferences: asArray(storyMoviesDb.references).length,
      magicSkills: skills.filter((skill) => skill.kind === 'magic').length,
      physicalSkills: skills.filter((skill) => skill.kind === 'physical').length,
      monsters: monsters.length,
      battles: battles.length,
      battleMaps: battleMapByStageId.size,
      camps: camps.length,
      campImages: camps.filter((camp) => camp.imagePath).length,
      unitIcons: unitIconByCategoryId.size,
      alchemyRecipes: alchemy.length,
      equipmentAlchemy: alchemy.filter((recipe) => recipe.productType !== 0).length,
      itemAlchemy: alchemy.filter((recipe) => recipe.productType === 0).length,
    },
    battleStats: {
      maxEnemyCount: Math.max(...battles.map((battle) => battle.enemyCount)),
      maxMapArea: Math.max(...battles.map((battle) => battle.map.area ?? 0)),
      maxEnemyLevel: Math.max(...battles.map((battle) => battle.maxEnemyLevel)),
    },
    assets,
  };

  await writeJson('summary.json', summary);
  await writeJson('characters.json', characters);
  await writeJson('skills.json', skills);
  await writeJson('monsters.json', monsters);
  await writeJson('battles.json', battles);
  await writeJson('camps.json', camps);
  await writeJson('items.json', itemCatalog);
  await writeJson('alchemy.json', alchemy);
  await writeCharacterPages(characters);
  await writeSkillPages(skills);
  await writeBattlePages(battles);

  console.log(
    `Generated TDJ data: ${characters.length} characters, ${itemCatalog.weapons.length} weapons, ${itemCatalog.items.length} items, ${skills.length} skills, ${storyMovieById.size} story movies, ${monsters.length} monsters, ${battles.length} battles/maps, ${camps.length} camps, ${alchemy.length} alchemy recipes, ${unitIconByCategoryId.size} unit icons.`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
