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
  cure: '治疗',
  effect: '状态',
  none: '无',
};

const statLabels = {
  str: '力',
  int: '智',
  avg: '速',
  vit: '体',
  luk: '运',
};

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

const readItemNames = async () => {
  const items = await readJson('catalog/items.json');
  return Object.fromEntries(Object.entries(items.names ?? {}).map(([id, name]) => [Number(id), name]));
};

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
        kind: skill.kind,
        kindLabel: label(skillKindLabels, skill.kind),
        attribute: skill.attribute ?? skill.attribute_type_name,
        attributeLabel: label(attributeLabels, skill.attribute ?? skill.attribute_type_name),
        mpCost: skill.mpCost ?? skill.mp_cost,
      }
    : null;

const formatGrowth = (growth) =>
  ['str', 'int', 'avg', 'vit', 'luk']
    .map((key) => `${statLabels[key]}${growth?.[`${key}_base`] ?? '-'}`)
    .join(' / ');

const main = async () => {
  await fs.access(sourceRoot);

  const manifest = await readJson('manifest.json');
  await validateBundle(manifest);
  const [charactersDb, skillsDb, monstersDb, levelUpDb, campsDb] = await Promise.all([
    readJson('catalog/characters.json'),
    readJson('catalog/skills.json'),
    readJson('catalog/monsters.json'),
    readJson('catalog/level_up.json'),
    readJson('catalog/camps.json'),
  ]);
  const itemNames = await readItemNames();

  const skills = asArray(skillsDb)
    .sort((a, b) => a.id - b.id)
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      kind: skill.kind,
      kindLabel: label(skillKindLabels, skill.kind),
      attribute: skill.attribute_type_name,
      attributeLabel: label(attributeLabels, skill.attribute_type_name),
      result: skill.result_type_name,
      resultLabel: label(resultLabels, skill.result_type_name),
      target: skill.target_type_name,
      targetLabel: label(targetLabels, skill.target_type_name),
      rangeType: skill.range_type_name,
      rangeTypeLabel: label(rangeLabels, skill.range_type_name),
      attackRangeMin: skill.attack_range_min,
      attackRangeMax: skill.attack_range_max,
      mpCost: skill.mp_cost,
      moveCost: skill.move_cost,
      basePower: skill.base_power,
      hit: skill.hit,
      hitAdd: skill.hit_add,
      animationId: skill.animation_id,
      hasMovie: Boolean(skill.has_movie),
      description: cleanString(skill.description),
    }));
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

    return {
      id: characterId,
      dataIndex: record.id,
      name: record.name ?? charactersDb.names[String(characterId)] ?? `角色 ${characterId}`,
      level: record.level,
      hp: record.hp,
      mp: record.mp,
      weaponId: record.weapon_id,
      weaponName: itemNames[record.weapon_id] ?? record.weapon_name,
      armorId: record.armor_id,
      armorName: itemNames[record.armor_id] ?? record.armor_name,
      accessoryId: record.accessory_id,
      accessoryName: itemNames[record.accessory_id] ?? record.accessory_name,
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
      learnedSkills,
      learnedSkillCount: learnedSkills.length,
    };
  }).sort((a, b) => a.id - b.id);

  const monsters = asArray(monstersDb)
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
      attrDefenceId: monster.attr_defence_id,
      abilities: monster.abilities,
    }));

  const battleDir = path.join(sourceRoot, 'battles');
  const battleFiles = (await fs.readdir(battleDir)).filter((file) => file.toLowerCase().endsWith('.json'));
  const battles = [];
  for (const file of battleFiles.sort((a, b) => stageNumber(a) - stageNumber(b))) {
    const battle = JSON.parse(await fs.readFile(path.join(battleDir, file), 'utf8'));
    const players = battle.players ?? [];
    const enemies = battle.enemies ?? [];
    const combatPlayers = players.filter((unit) => unit.combatant !== false);
    const topEnemies = [...enemies]
      .sort((a, b) => (b.hp ?? 0) - (a.hp ?? 0))
      .slice(0, 3)
      .map((enemy) => ({
        name: enemy.name,
        hp: enemy.hp,
        level: enemy.level,
      }));

    battles.push({
      id: file.replace(/\.json$/i, ''),
      order: stageNumber(file),
      file,
      source: battle.source,
      map: {
        texture: battle.map?.tex ?? null,
        width: battle.map?.w ?? null,
        height: battle.map?.h ?? null,
        cellWidth: battle.map?.cell_w ?? null,
        cellHeight: battle.map?.cell_h ?? null,
        area: battle.map?.w && battle.map?.h ? battle.map.w * battle.map.h : null,
      },
      playerCount: players.length,
      combatPlayerCount: combatPlayers.length,
      enemyCount: enemies.length,
      introLineCount: battle.intro?.length ?? 0,
      outroLineCount: battle.outro?.length ?? 0,
      playerNames: compactList(players.map((unit) => unit.name), 12),
      enemyNames: compactList(enemies.map((unit) => unit.name), 12),
      enemySkillNames: compactList(enemies.flatMap((unit) => unit.skills ?? []), 8),
      itemNames: compactList([...players, ...enemies].flatMap((unit) => unit.items ?? []), 10),
      maxEnemyLevel: Math.max(0, ...enemies.map((unit) => unit.level ?? 0)),
      topEnemies,
    });
  }

  const campImages = new Map();
  const camps = [];
  for (const camp of asArray(campsDb).sort((a, b) => a.id - b.id)) {
    const outputName = `camps/${camp.path}-frame000.png`;
    const imagePath =
      camp.has_image && camp.path
        ? await copyAsset(`assets/public/camps/${camp.path}/frame000.png`, outputName)
        : null;
    if (imagePath) campImages.set(camp.id, imagePath);
    camps.push({
      id: camp.id,
      imageId: camp.image_id,
      link: camp.link,
      flag: camp.flag,
      frameCount: camp.frame_count,
      path: camp.path,
      hasImage: Boolean(camp.has_image),
      imagePath,
    });
  }

  const assets = {
    showcase: await existingPublicAsset('showcase.png'),
    appIcon: await copyAsset('assets/public/app-icon.png', 'app-icon.png'),
    featuredCamps: [0, 2, 5, 9].map((id) => campImages.get(id)).filter(Boolean),
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
      skills: skills.length,
      magicSkills: skills.filter((skill) => skill.kind === 'magic').length,
      physicalSkills: skills.filter((skill) => skill.kind === 'physical').length,
      monsters: monsters.length,
      battles: battles.length,
      camps: camps.length,
      campImages: camps.filter((camp) => camp.imagePath).length,
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

  console.log(
    `Generated TDJ data: ${characters.length} characters, ${skills.length} skills, ${monsters.length} monsters, ${battles.length} battles, ${camps.length} camps.`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
