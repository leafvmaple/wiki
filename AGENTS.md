# AGENTS.md - 枫百科

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

不要一上来使用 MediaWiki / Wiki.js / BookStack，除非用户明确提出网页后台、账号权限、
页面历史或数据库型 wiki 需求。

## 视觉风格

这个站需要和 moments 保持整体风格统一，但不能照搬博客结构。开始搭站前必须阅读
[`STYLE.md`](STYLE.md)，并把其中的 token 映射到 Starlight 自定义 CSS。

核心原则：

- 继承 moments 的主色 `#23b7e5`、Source Sans 3、6px 圆角、浅阴影、灰阶文字和暗色模式。
- 保留 Starlight 的 wiki/文档信息架构：侧边栏、目录、搜索、callout、表格优先。
- 不复制 moments 的音乐播放器、旅行相册卡片、个人 profile 侧栏。
- 不使用 Starlight 默认紫蓝感过强的模板观感；第一轮搭建就要改成 leafvmaple 家族色。

## 域名和仓库

- GitHub 仓库：`leafvmaple/wiki`
- 计划域名：`wiki.leafvmaple.com`
- 本地目录：`D:\Code\wiki`

## 内容结构建议

当前站点优先采用：

```text
src/content/docs/
├─ index.mdx
├─ games/
│  ├─ index.mdx
│  └─ <game-slug>/
│     ├─ index.md
│     ├─ quests/
│     └─ ...
```

## 写作约定草案

- 攻略以「读者正在解决什么问题」为核心。
- 每页尽量有明确适用范围：游戏名、版本、阶段、角色或地图。
- 变动频繁的信息标注更新时间或适用版本。
- 数值、材料、掉落、路线优先用表格。
- 不确定的信息要标注「待验证」，不要写成定论。
- 页面结构服务检索：标题直给，少用文学化标题。

## 下一步

1. 优先补全真实游戏攻略内容。
2. 新增页面后同步侧边栏、游戏目录和首页入口。
3. 提交前运行 `npm run build`。
