# Changelog

本项目的所有重要变更都记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.8.9] - 2026-08-01

### 修复

- 「复制纯文本」导出未剥离 markdown 语法：此前纯文本导出与 Markdown 导出的正文完全一致（`**加粗**`、`# 标题`、列表符号等原样保留），现通过 `markdownToPlainText` 剥离语法标记，输出干净纯文本

### 工程

- 补导出测试覆盖缺口：新增「复制 Markdown 保留语法，复制纯文本剥离语法」用例（此前仅覆盖 Download .md，未测两个复制菜单项）

## [1.8.8] - 2026-08-01

### 修复

- 流式聊天气泡错乱：此前每个流式 chunk 都会新建气泡（最长对话可出现 19 个重复气泡），现在复用同一气泡实时更新；同时删除冗余分支，每轮回复只生成 1 个气泡
- 对话结束后必现报错「❌ assistantDiv is not defined」：`assistantDiv`/`assistantBubble` 声明作用域与引用位置不一致，导致每次流式完成后抛 `ReferenceError`，已提升声明到正确作用域
- 「清除上下文」保留错误消息：此前保留的是最后一条消息（可能是 AI 回复），现在从末尾向前查找真正的用户问题

### 新增

- 流式输出开关：默认开启（逐字显示回复），可在设置 → 请求参数中关闭，兼容只支持非流式响应的 API；同时增加非流式 JSON 响应兜底解析，API 忽略 `stream` 参数时也能正常显示回复

### 工程

- 搭建 Playwright 端到端测试框架：`npm test` 一键运行 20 个用例（聊天流程 / 面板 UI / 设置页 / 悬浮按钮 / 删除按钮 / 选中文本按钮 / XML 守卫），mock server 模拟 OpenAI 兼容 API；旧 `test/` 目录专项测试全部迁移进框架

## [1.8.7] - 2026-08-01

### 修复

- 选中文本提问功能重新接线：`showSelBtn` 触发逻辑丢失（选中网页文本不弹浮动按钮），已通过 `mouseup` 监听重新接上线（面板内/按钮自身点击不触发）
- SPA 页面切换时选中按钮残留：新增 `js/spa-patch.js` 主世界注入脚本，patch `pushState`/`replaceState` 并在导航后清除按钮；同时监听 `popstate`/`hashchange`；按钮被意外移除时自愈重建

### 工程

- test 脚本从硬编码全局路径改为项目内 `import 'playwright'`，新增 `test/sel-btn-spa-test.mjs`（4/4）

## [1.8.6] - 2026-08-01

### 重构

- 公共常量去重：`API_PROVIDERS` 从 `background.js` / `options.js` 两处重复定义抽到 `js/providers.js` 单一数据源
  - `background.js` 通过 `API_PROVIDER_MAP` 索引，`options.js` 直接 import，options.html 的 options.js 改为 `type="module"` 加载
  - 之前加新提供商要改两处（易漏），现在只改 `providers.js` 一处

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

[1.8.7]: https://github.com/daxmate/deeppage/compare/v1.8.6...v1.8.7
[1.8.6]: https://github.com/daxmate/deeppage/compare/v1.8.5...v1.8.6
[1.8.5]: https://github.com/daxmate/deeppage/compare/v1.8.4...v1.8.5
[1.8.4]: https://github.com/daxmate/deeppage/compare/v1.8.3...v1.8.4
[1.8.3]: https://github.com/daxmate/deeppage/compare/v1.8.2...v1.8.3
[1.8.2]: https://github.com/daxmate/deeppage/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/daxmate/deeppage/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/daxmate/deeppage/releases/tag/v1.8.0
