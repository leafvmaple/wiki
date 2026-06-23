# STYLE.md - visual direction

`wiki.leafvmaple.com` 是独立 wiki，但不应该看起来像一个随机文档模板。它要和
`leafvmaple.com` / moments 站点属于同一个视觉系统：安静、轻、克制，有一点 Typecho
handsome 的影子，但信息密度更高。

## 设计目标

- 和 moments 保持家族感：颜色、字体、圆角、阴影、暗色模式、链接 hover 逻辑一致。
- 不照搬 moments 的博客结构：wiki 需要更强的侧边栏、目录、搜索、表格和 callout。
- 不做游戏门户式重视觉：攻略页优先可读、可查、可长期维护。
- 默认暗色可用，亮色也要完整；两套主题都不能只是 Starlight 默认色。

## 从 moments 继承的核心 token

优先把这些 token 映射到 Starlight 自定义 CSS 变量：

```css
:root {
  --leaf-primary: #23b7e5;
  --leaf-primary-hover: #1ba0c9;
  --leaf-accent-green: #27c24c;

  --leaf-bg: #ffffff;
  --leaf-bg-card: #ffffff;
  --leaf-bg-subtle: #efefef;
  --leaf-bg-aside: #f4f4f4;

  --leaf-text: #58666e;
  --leaf-text-muted: #98a3a8;
  --leaf-heading: #2c3e50;
  --leaf-border: #e5e9ec;

  --leaf-radius-card: 6px;
  --leaf-shadow-card: 0 1px 3px rgba(0, 0, 0, 0.05);
  --leaf-shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.08);

  --leaf-font-body: 'Source Sans 3', 'Source Sans Pro', 'Hiragino Sans GB',
    'Microsoft YaHei', SimSun, Helvetica, Arial, sans-serif;
  --leaf-font-mono: 'JetBrains Mono', Menlo, Monaco, Consolas, 'Courier New', monospace;
}
```

Dark theme should mirror moments:

```css
:root[data-theme='dark'] {
  --leaf-bg: #1a1a1a;
  --leaf-bg-card: #242424;
  --leaf-bg-subtle: #2c2c2c;
  --leaf-bg-aside: #1f1f1f;
  --leaf-text: #b0b0b0;
  --leaf-text-muted: #7a7a7a;
  --leaf-heading: #e0e0e0;
  --leaf-border: #353535;
}
```

Exact selector may differ in Starlight; preserve the values and behavior, not necessarily the selector names.

## Starlight adaptation

Use Starlight as the base, then customize:

- Brand color: use `#23b7e5` for links, active sidebar state, focus ring and selected tabs.
- Typography: load Source Sans 3 and use it for body text; keep monospace close to moments.
- Radius: cards, search box, tabs and code blocks should be 6px, not large rounded blocks.
- Shadows: keep shadows subtle; dark theme should rely more on border + slight blue glow.
- Sidebar: keep Starlight's document navigation, but color it closer to moments' left aside.
- Header: compact, utility-like, not marketing-site style.
- Code blocks and inline code: match moments' blue-tinted inline code and restrained fenced blocks.
- Tables: make them dense and scannable; game wiki content will rely heavily on tables.
- Callouts: use Starlight aside/callout components, but recolor them into the same calm palette.

## Site chrome

Do:

- Keep a visible brand link back to `leafvmaple.com`.
- Add cross-links to `moments` and `code` somewhere in nav/footer.
- Keep search prominent; wiki readers arrive with a question.
- Use icons sparingly for navigation/status, preferably from the framework or lucide-compatible set.

Do not:

- Copy moments' music player, clock dropdown, travel sidebar profile, album language, or post cards.
- Use a large landing hero as the default first screen.
- Let Starlight's purple/blue default palette dominate.
- Make a game-fandom style site with loud gradients, oversized logos, or heavy decorative art.

## Content UI patterns

The wiki should eventually support these repeated blocks:

- Version badge: applicable game version or last verified version.
- Status badge: draft / verified / outdated / needs testing.
- Infobox: character, item, map, boss, build summary.
- Route checklist: compact ordered steps with optional notes.
- Comparison table: builds, materials, drop rates, route efficiency.
- Spoiler block: collapsible, clearly marked.

These should use the same token system above. Avoid one-off CSS per game unless a game truly needs a
distinct theme.

