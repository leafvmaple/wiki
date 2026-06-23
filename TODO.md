# TODO

## Bootstrap

- [x] 初始化 Astro Starlight 项目
- [x] 阅读 `STYLE.md` 并移植 moments 视觉 token
- [x] 配置 Source Sans 3 和基础字体栈
- [x] 覆盖 Starlight 默认配色，使用 leafvmaple 主色 `#23b7e5`
- [x] 配置站点标题、favicon、导航和侧边栏
- [x] 调整 header/sidebar/search/code/table/callout 的视觉风格
- [x] 配置部署目标和 `wiki.leafvmaple.com`
- [x] 建立第一个游戏目录
- [x] 清理占位模板和 meta 页面

## Content Model

- [x] 决定是否需要版本字段：需要，使用 `gameVersion` 和 `lastVerified`
- [x] 决定是否需要游戏级 changelog：需要，每个游戏保留 `changelog.mdx`
- [x] 决定图片/截图目录约定：公开截图放 `public/media/games/<game-slug>/screenshots/`
- [x] 决定攻略页的状态标记：`draft`、`verified`、`outdated`、`needs-testing`

## Roadmap

- [x] 固化长期建设阶段：见 `STAGES.md`
- [ ] Stage 0：统一个人攻略资料库文案，减少社区协作/审核暗示
- [x] Stage 1：建立《星露谷物语》专区骨架
- [x] Stage 2：建立本地整理资料到公开派生数据的生成管线
- [ ] Stage 3：生成作物、鱼类、村民、机器、商店索引
- [ ] Stage 4：实现第一个可交互地图试点
- [ ] Stage 5：实现第一批攻略工具
- [ ] Stage 6：设计本地存档辅助工具
