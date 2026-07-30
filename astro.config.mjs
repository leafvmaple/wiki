import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://wiki.leafvmaple.com',
  redirects: {
    '/games': '/',
  },
  integrations: [
    starlight({
      title: '枫百科',
      description: '游戏攻略、机制资料、路线与长期维护内容。',
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      logo: {
        src: './src/assets/leafvmaple-wiki.svg',
        alt: '枫百科',
      },
      favicon: '/favicon.svg',
      titleDelimiter: '-',
      customCss: [
        '@fontsource/source-sans-3/400.css',
        '@fontsource/source-sans-3/600.css',
        '@fontsource/source-sans-3/700.css',
        './src/styles/custom.css',
      ],
      components: {
        Sidebar: './src/components/Sidebar.astro',
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 3,
      },
      lastUpdated: false,
      editLink: {
        baseUrl: 'https://github.com/leafvmaple/wiki/edit/main/',
      },
      sidebar: [
        {
          label: '开始',
          items: [
            { label: '首页', link: '/' },
          ],
        },
        {
          label: '歧路旅人 0',
          collapsed: false,
          items: [
            { label: '游戏总览', link: '/games/octopath-traveler-0/' },
            { label: '实体资料', link: '/games/octopath-traveler-0/entities/' },
            { label: '世界地图', link: '/games/octopath-traveler-0/worldmap/' },
            { label: '任务线总览', link: '/games/octopath-traveler-0/quests/' },
            { label: '角色一览', link: '/games/octopath-traveler-0/characters/' },
            {
              label: '装备图鉴',
              items: [
                { label: '武器', link: '/games/octopath-traveler-0/equipment/weapons/' },
                { label: '防具', link: '/games/octopath-traveler-0/equipment/armor/' },
                { label: '饰品', link: '/games/octopath-traveler-0/equipment/accessories/' },
              ],
            },
            {
              label: '道具图鉴',
              items: [
                { label: '消耗品', link: '/games/octopath-traveler-0/items/consumables/' },
                { label: '素材', link: '/games/octopath-traveler-0/items/materials/' },
                { label: '美食', link: '/games/octopath-traveler-0/items/food/' },
              ],
            },
            { label: '敌人图鉴', link: '/games/octopath-traveler-0/enemies/' },
            {
              label: '技能图鉴',
              items: [
                { label: '职业技能', link: '/games/octopath-traveler-0/skills/' },
                { label: '角色技能', link: '/games/octopath-traveler-0/character-skills/' },
              ],
            },
            {
              label: '资料表',
              items: [
                { label: '商店一览', link: '/games/octopath-traveler-0/shops/' },
                { label: 'NPC 行动', link: '/games/octopath-traveler-0/npc-actions/' },
                { label: '遇敌一览', link: '/games/octopath-traveler-0/encounters/' },
                { label: '宝箱一览', link: '/games/octopath-traveler-0/treasures/' },
                { label: '村庄与贸易', link: '/games/octopath-traveler-0/village/' },
                { label: '音乐与留声机', link: '/games/octopath-traveler-0/music/' },
                { label: '故事书', link: '/games/octopath-traveler-0/storybooks/' },
                { label: '剧情回想', link: '/games/octopath-traveler-0/scenario/' },
                { label: '成就', link: '/games/octopath-traveler-0/trophies/' },
              ],
            },
          ],
        },
        {
          label: '大航海时代 II',
          collapsed: false,
          items: [
            { label: '游戏总览', link: '/games/daikoukai-jidai-2/' },
            { label: '港口一览', link: '/games/daikoukai-jidai-2/ports/' },
            { label: '补给港', link: '/games/daikoukai-jidai-2/supply-ports/' },
            { label: '村庄与发现物', link: '/games/daikoukai-jidai-2/discoveries/' },
            { label: '装备与道具', link: '/games/daikoukai-jidai-2/items/' },
            { label: '船只与中古船', link: '/games/daikoukai-jidai-2/ships/' },
            { label: '航海士雇佣', link: '/games/daikoukai-jidai-2/officers/' },
          ],
        },
        {
          label: '重装机兵',
          collapsed: true,
          items: [
            { label: '游戏总览', link: '/games/metal-max/' },
            {
              label: '装备图鉴',
              items: [
                { label: '人类装备', link: '/games/metal-max/equipment/human/' },
                { label: '战车装备', link: '/games/metal-max/equipment/tank/' },
                { label: '炮弹', link: '/games/metal-max/equipment/shells/' },
              ],
            },
            { label: '赏金首', link: '/games/metal-max/bounties/' },
            {
              label: '机制解析',
              items: [
                { label: '传闻判定一览', link: '/games/metal-max/research/' },
                { label: '战斗道具机制', link: '/games/metal-max/research/battle-items/' },
                { label: '帕特港战车购买', link: '/games/metal-max/research/port-tank/' },
                { label: '特殊来源装备道具', link: '/games/metal-max/research/special-items/' },
              ],
            },
            { label: '数据说明', link: '/games/metal-max/data-notes/' },
          ],
        },
        {
          label: '天地劫·神魔至尊传',
          collapsed: true,
          items: [
            { label: '游戏总览', link: '/games/sword-man/' },
            { label: '角色资料', link: '/games/sword-man/characters/' },
            { label: '技能法术', link: '/games/sword-man/skills/' },
            {
              label: '装备与道具',
              items: [
                { label: '武器列表', link: '/games/sword-man/equipment/weapons/' },
                { label: '道具列表', link: '/games/sword-man/items/' },
              ],
            },
            {
              label: '炼化配方',
              items: [
                { label: '装备炼化', link: '/games/sword-man/alchemy/equipment/' },
                { label: '道具炼化', link: '/games/sword-man/alchemy/items/' },
              ],
            },
            { label: '怪物图鉴', link: '/games/sword-man/monsters/' },
            { label: '关卡资料', link: '/games/sword-man/battles/' },
            { label: '营地资料', link: '/games/sword-man/camps/' },
            { label: '数据说明', link: '/games/sword-man/data-notes/' },
          ],
        },
        {
          label: '星露谷物语',
          collapsed: true,
          items: [
            { label: '游戏总览', link: '/games/stardew-valley/' },
            { label: '实体资料', link: '/games/stardew-valley/entities/' },
            { label: '作物索引', link: '/games/stardew-valley/crops/' },
            { label: '鱼类索引', link: '/games/stardew-valley/fishing/' },
            { label: '村民索引', link: '/games/stardew-valley/villagers/' },
            { label: '机器索引', link: '/games/stardew-valley/machines/' },
            { label: '商店索引', link: '/games/stardew-valley/shops/' },
            { label: '地图与点位', link: '/games/stardew-valley/maps/' },
            { label: '鹈鹕镇地图', link: '/games/stardew-valley/maps/town/' },
            { label: '攻略工具', link: '/games/stardew-valley/tools/' },
            { label: '存档辅助', link: '/games/stardew-valley/tools/save-helper/' },
            { label: '数据说明', link: '/games/stardew-valley/data-notes/' },
            { label: '更新记录', link: '/games/stardew-valley/changelog/' },
          ],
        },
        {
          label: '站点链接',
          collapsed: true,
          items: [
            { label: 'leafvmaple.com', link: 'https://leafvmaple.com' },
            { label: 'moments', link: 'https://leafvmaple.com' },
            { label: 'code', link: 'https://code.leafvmaple.com' },
            { label: 'GitHub 仓库', link: 'https://github.com/leafvmaple/wiki' },
          ],
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/leafvmaple/wiki',
        },
      ],
      credits: false,
      disable404Route: true,
    }),
  ],
});
