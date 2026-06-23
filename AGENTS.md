# AGENTS.md - leafvmaple wiki

给后续 Codex/AI agent 的交接说明。

## 项目定位

这是 `wiki.leafvmaple.com` 的源码仓库，目标是做游戏攻略和资料库。它应当和现有 `moments`
站点保持独立：

- 不混入 `leafvmaple.com` 的游记、相册、生活博客结构。
- 不沿用 moments 的 `posts / trips / places` 信息架构。
- 这里按游戏和攻略主题组织内容，偏文档/wiki，而不是时间线博客。

## 技术默认

除非用户明确改主意，默认使用 **Astro Starlight** 搭建。

理由：

- 用户已有 Astro 项目经验。
- Starlight 适合 Markdown/MDX 文档站。
- 默认有侧边栏、目录、搜索、暗色模式。
- 静态部署成本低。

不要一上来使用 MediaWiki / Wiki.js / BookStack，除非用户明确提出多人网页编辑、账号权限、
页面历史或数据库型 wiki 需求。

## 域名和仓库

- GitHub 仓库：`leafvmaple/wiki`
- 计划域名：`wiki.leafvmaple.com`
- 本地目录：`D:\Code\wiki`

## 内容结构建议

搭好 Starlight 后，优先采用：

```text
src/content/docs/
├─ index.md
├─ games/
│  └─ <game-slug>/
│     ├─ index.md
│     ├─ beginner.md
│     ├─ changelog.md
│     ├─ characters/
│     ├─ builds/
│     ├─ quests/
│     ├─ maps/
│     ├─ items/
│     └─ mechanics/
└─ meta/
   ├─ writing-guide.md
   └─ site-notes.md
```

## 写作约定草案

- 攻略以「读者正在解决什么问题」为核心。
- 每页尽量有明确适用范围：游戏名、版本、阶段、角色或地图。
- 变动频繁的信息标注更新时间或适用版本。
- 数值、材料、掉落、路线优先用表格。
- 不确定的信息要标注「待验证」，不要写成定论。
- 页面结构服务检索：标题直给，少用文学化标题。

## 下一步

1. 在本目录初始化 Astro Starlight。
2. 设置站点标题、导航、侧边栏和搜索。
3. 加入 `wiki.leafvmaple.com` 的部署配置。
4. 建立第一个游戏目录和写作模板。

