# Stardew Valley data

这个目录用于存放《星露谷物语》专区的公开派生数据。

约定：

- 数据从本地整理资料生成。
- 不提供批量图片下载或完整文本库。
- 只提交攻略站需要的最小字段。
- 生成文件应标注生成时间和适用游戏版本。

当前目录：

```text
src/data/stardew-valley/
├─ generated/
│  ├─ summary.json
│  ├─ crops.json
│  ├─ fish.json
│  ├─ villagers.json
│  ├─ machines.json
│  ├─ shops.json
│  ├─ assets.json
│  └─ maps/
│     └─ town.json
└─ README.md
```

生成命令：

```powershell
npm run generate:stardew -- <local-data-dir>
npm run generate:stardew-assets -- <local-data-dir>
```
