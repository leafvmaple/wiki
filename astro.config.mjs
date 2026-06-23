import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://wiki.leafvmaple.com',
  integrations: [
    starlight({
      title: 'leafvmaple wiki',
      description: '游戏攻略、机制资料、路线与长期维护内容。',
      logo: {
        src: './src/assets/leafvmaple-wiki.svg',
        alt: 'leafvmaple wiki',
      },
      favicon: '/favicon.svg',
      titleDelimiter: '-',
      customCss: [
        '@fontsource/source-sans-3/400.css',
        '@fontsource/source-sans-3/600.css',
        '@fontsource/source-sans-3/700.css',
        './src/styles/custom.css',
      ],
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
            { label: '游戏目录', link: '/games/' },
          ],
        },
        {
          label: '游戏模板',
          items: [{ label: '模板总览', link: '/games/game-template/' }],
          badge: 'draft',
        },
        {
          label: '示例攻略结构',
          collapsed: false,
          items: [{ autogenerate: { directory: 'games/game-template' } }],
        },
        {
          label: '写作与维护',
          collapsed: false,
          items: [
            { label: '写作指南', link: '/meta/writing-guide/' },
            { label: '站点说明', link: '/meta/site-notes/' },
            {
              label: '页面模板',
              collapsed: true,
              items: [{ autogenerate: { directory: 'meta/templates' } }],
            },
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
