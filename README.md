# 枫百科

游戏攻略与资料库。这个站点计划独立部署在：

https://wiki.leafvmaple.com

## 定位

`wiki.leafvmaple.com` 是独立于以下站点的攻略/资料站：

- `leafvmaple.com`：生活、照片、游记与 moments
- `code.leafvmaple.com`：技术博客
- `wiki.leafvmaple.com`：游戏攻略、机制资料、路线与长期更新内容

这里的内容不按博客时间线组织，而按游戏、系统、角色、地图、任务、版本等知识结构组织。

## 技术方向

默认建议使用 **Astro Starlight** 搭建：

- 和现有 Astro 技术栈接近
- Markdown/MDX 写攻略方便
- 默认支持侧边栏、目录、站内搜索、暗色模式
- 静态部署简单，适合 GitHub Pages / Cloudflare Pages

如果之后确实需要网页后台、账号权限、页面历史等重型 wiki 能力，再单独评估 Wiki.js / MediaWiki。

## 视觉方向

wiki 是独立站，但整体风格要和 `leafvmaple.com` / moments 保持家族感：主色沿用
`#23b7e5`，字体沿用 Source Sans 3 + 中文系统字体，卡片圆角维持 6px，浅阴影、灰阶文字、
暗色模式和链接 hover 逻辑都尽量继承 moments。

但不要直接复制 moments 的博客壳。wiki 应该更像信息密集的攻略资料库：侧边栏、搜索、目录、
表格、callout 和状态标记更重要；音乐播放器、旅行相册式卡片、个人 profile 侧栏不应该照搬。

具体设计约定见 [`STYLE.md`](STYLE.md)。

## 当前内容结构

站点按「游戏」作为一级入口，目前维护《歧路旅人 0》，并开始搭建《星露谷物语》的数据驱动攻略专区：

```text
src/content/docs/
├─ index.mdx
├─ games/
│  ├─ index.mdx
│  └─ octopath-traveler-0/
│     ├─ index.md
│     ├─ quests/
│     │  ├─ index.mdx
│     │  ├─ flame/
│     │  ├─ treasure/
│     │  └─ recruit/
│     └─ ...
│  └─ stardew-valley/
│     ├─ index.mdx
│     ├─ crops/
│     ├─ fishing/
│     ├─ villagers/
│     ├─ machines/
│     ├─ shops/
│     ├─ maps/
│     │  └─ town.mdx
│     ├─ tools/
│     ├─ data-notes.mdx
│     └─ changelog.mdx
```

## 内容约定草案

- 攻略页优先解决具体问题，不写成泛泛介绍。
- 页面标题清楚直给，例如「新手开荒路线」「角色配装」「地图收集点」。
- 长期会变的信息要标注适用版本或更新时间。
- 表格用于数值、材料、掉落、路线对比。
- 每个游戏保留一个 `changelog.md`，记录攻略大改、版本迁移和内容状态。

## 建设阶段

长期建设阶段见 [`STAGES.md`](STAGES.md)。当前方向是个人攻略资料库，不引入账号、权限后台或页面历史流程。

## 当前状态

仓库已经完成 Starlight 骨架、视觉样式、GitHub Pages 部署配置、《歧路旅人 0》任务线内容入口，以及《星露谷物语》专区骨架和首批数据索引。
