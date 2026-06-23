# leafvmaple wiki

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

如果之后需要多人网页编辑、账号权限、页面历史等重型 wiki 能力，再考虑 Wiki.js / MediaWiki。

## 初始信息架构

建议先按「游戏」作为一级入口：

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

## 内容约定草案

- 攻略页优先解决具体问题，不写成泛泛介绍。
- 页面标题清楚直给，例如「新手开荒路线」「角色配装」「地图收集点」。
- 长期会变的信息要标注适用版本或更新时间。
- 表格用于数值、材料、掉落、路线对比。
- 每个游戏保留一个 `changelog.md`，记录攻略大改、版本迁移和内容状态。

## 当前状态

仓库刚初始化，只写入项目说明和交接信息。下一步是在本目录中搭建 Starlight 项目骨架。

