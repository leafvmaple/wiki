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
            { label: '敌人图鉴', link: '/games/octopath-traveler-0/enemies/' },
            { label: '职业技能', link: '/games/octopath-traveler-0/skills/' },
          ],
        },
        {
          label: '天地劫·神魔至尊传',
          collapsed: true,
          items: [
            { label: '游戏总览', link: '/games/sword-man/' },
            { label: '角色资料', link: '/games/sword-man/characters/' },
            { label: '技能法术', link: '/games/sword-man/skills/' },
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
