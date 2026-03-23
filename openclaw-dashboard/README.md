# OpenClaw Dashboard

Bento 风格的个人 Dashboard，为 OpenClaw 设计，完全由 JSON 配置驱动。

## 特性

- **组件化 / Widget 化**：12 种卡片组件，按外观命名（数字卡、图片卡、日历卡、任务时间轴卡等）
- **Bento 布局**：桌面 6列×5行，移动端 4列×12行，自适应
- **JSON 配置化**：所有卡片的大小、位置、内容均通过一个 JSON 文件配置
- **主题系统**：亮色 / 暗色主题切换，支持自定义颜色、字体、间距、圆角
- **Serverless 设计**：纯前端静态部署，通过 Discord Webhook 交互
- **设置面板**：点击 ⚙️ 图标打开设置 Modal，实时调整主题、布局和导入/导出配置

## 可用卡片类型

| 类型 | 说明 | 示例 |
|---|---|---|
| `NumberCard` | 大数字展示 + 趋势 | citation 统计 |
| `ImageCard` | 图片展示 | 每日推荐图 |
| `TextCard` | 文字内容 | 灵感回顾 |
| `FortuneCard` | 运势/占卜 + 数字 + 图片 | 今日运势 |
| `CalendarCard` | 月历视图 + 高亮/标记 | 月度日历 |
| `TaskListCard` | 任务列表 + 时间 + 状态 | 任务安排 |
| `TaskTimelineCard` | 时间轴 + 状态节点 | 工作时间线 |
| `ProgressCard` | 多项进度条 | 项目进度 |
| `HeatmapCard` | GitHub 风格热力图 | 工作时长 |
| `TimeDisplayCard` | 大时间展示 | 工作时长 |
| `BroadcastCard` | 播报文字 (特殊背景) | 今日播报 |
| `ResultListCard` | 结果列表 + 彩色标记 | 任务结果 |

## 快速开始

```bash
npm install
npm run dev
```

## JSON 配置结构

```jsonc
{
  "theme": { /* 亮色主题配置 */ },
  "darkTheme": { /* 暗色主题配置 */ },
  "header": { "title": "珑窝 Dashboard", ... },
  "discord": { "webhookUrl": "" },
  "grid": {
    "desktop": { "columns": 6, "rows": 5 },
    "mobile": { "columns": 4, "rows": 12 }
  },
  "widgets": [
    {
      "id": "unique-id",
      "type": "NumberCard",
      "title": "卡片标题",
      "desktop": { "x": 0, "y": 0, "w": 1, "h": 1 },
      "mobile": { "x": 0, "y": 0, "w": 2, "h": 1 },
      "config": { /* 卡片特有的配置 */ }
    }
  ]
}
```

每个 widget 的 `desktop` 和 `mobile` 字段分别定义桌面端和移动端的位置（x, y）和尺寸（w, h），基于 Grid 坐标系统（0-indexed）。

## 构建部署

```bash
npm run build   # 输出到 dist/
npm run preview # 本地预览构建结果
```

生成的 `dist/` 目录可直接部署到任何静态托管服务（Vercel, Netlify, GitHub Pages 等）。
