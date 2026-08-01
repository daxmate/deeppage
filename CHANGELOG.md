# Changelog

本项目的所有重要变更都记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.8.5] - 2026-08-01

### 重构

- 暗色主题变量去重：`@media (prefers-color-scheme: dark)` 与 `#__dp-panel.__dp-dark` 的两套 56 个 `--dp-*` 变量合并为一份（选择器列表 `#__dp-panel.__dp-dark, #__dp-panel.dp-sys-dark`）
  - 系统暗色改由 sidebar.js `matchMedia` 检测并给面板加 `dp-sys-dark` 类驱动，行为与之前完全一致
  - 之前改一个深色色值要同步两处，漏改会导致手动/系统暗色颜色漂移，现在单一来源

## [1.8.4] - 2026-08-01

### 重构

- 将 options 页面内联的 CSS 提取到独立的 `options.css`
  - `options.html` 从 683 行精简到 288 行，结构与样式分离
  - 通过 `<link rel="stylesheet">` 加载，后续调整样式无需再改 HTML

### 文档

- README 移除历史 bug 修复记录（这些记录归 CHANGELOG / Release notes 管），误混入修复列表的功能条目归位到 Features 列表

## [1.8.3] - 2026-08-01

### 重构

- 将 `content.js` 内联的 728 行 CSS 抽取到独立的 `content.css`
  - `content.js` 从 744 行瘦身到 17 行，逻辑与样式彻底分离
  - 通过 `manifest.json` 的 `content_scripts[].css` 由浏览器自动注入，移除 `injectStyles()` 函数
  - 后续调整样式无需再动 JS，可直接编辑 `content.css`

## [1.8.2] - 2026-07-31

### 新增

- 聊天气泡新增删除按钮（悬停显示，与复制按钮一致）
- 悬浮按钮支持拖拽，位置记忆（`btnPos` 存于 sync storage）

### 修复

- 跳过 XML/SVG 文档的注入，避免 `innerHTML` 抛 `SyntaxError`

## [1.8.1] - 2026-07-29

### 新增

- 设置页新增「重置所有设置」按钮

## [1.8.0] - 2026-07-29

### 新增

- 推理过程展示（reasoning display）
- API 参数配置（支持自定义 API 参数）

[1.8.5]: https://github.com/daxmate/deeppage/compare/v1.8.4...v1.8.5
[1.8.4]: https://github.com/daxmate/deeppage/compare/v1.8.3...v1.8.4
[1.8.3]: https://github.com/daxmate/deeppage/compare/v1.8.2...v1.8.3
[1.8.2]: https://github.com/daxmate/deeppage/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/daxmate/deeppage/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/daxmate/deeppage/releases/tag/v1.8.0
