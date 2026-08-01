# DeepPage TODO

> **优先级规则**：每加一个功能前，先清一条 P0。P1 择机清理，P2 可以一直拖。
> 🔴 P0 = 结构性债务，越拖越贵（改一次的地方要改两处、找样式要找半天）
> 🟡 P1 = 重要，值得做（真实 bug 或明显体验问题）
> 🟢 P2 = 无害，有空再说

## 🔴 P0 — 结构性债务（下次加功能前必须清）

- [x] **CSS 提取到单独文件** ✅ 已完成（v1.8.2→） — 728 行内联 CSS 已提取到 `content.css`，manifest `content_scripts[].css` 自动注入，`injectStyles()` 已删除（content.js 从 744 行降到 17 行）
- [x] **CSS 注入语法错误（孤立属性）** ✅ 已确认修复 — 代码中已不存在 `background: #25262b; color: #e4e5e7;` 游离声明（此前 `e471a15` 重构暗色模式时已处理），TODO 记录过时
- [x] **暗色主题大量重复** ✅ 已完成 — `@media (prefers-color-scheme: dark)` 块与 `#__dp-panel.__dp-dark` 的两套 56 个 `--dp-*` 变量已合并为一份（选择器列表 `#__dp-panel.__dp-dark, #__dp-panel.dp-sys-dark`），系统暗色由 sidebar.js `matchMedia` 检测加 `dp-sys-dark` 类驱动，行为不变
- [ ] **公共常量去重** — `API_PROVIDERS` 在 `background.js` 和 `options.js` 各有一份完全相同的定义，抽到独立文件（如 `providers.js`）共享。**加新提供商前必须做**（否则改两处易漏）

## 🟡 P1 — 重要，择机清理

- [ ] **选中文本按钮未清理** — 页面间切换时残留旧页面的 `#__dp-sel-btn` DOM 元素（SPA 场景），面板重建时应 `remove()` 旧元素（真实 bug，不是纯债）
- [ ] **options.js 重复 i18n key** — `apiProviderLabel`、`apiModelLabel`、`testApiButton` 等 key 在 `i18n.js` 里声明了两次（一次老 key 一次新 key），清理冗余
- [ ] **面板 DOM 销毁重建** — 每次打开面板其实是创建新元素（`createChatPanel`），关闭只是隐藏。组件化思路：打开 / 关闭只切换 display，不要重复创建
- [ ] **Markdown 渲染性能** — 流式输出每收到一个 chunk 就全量 re-render，消息长文本时卡顿。考虑缓存 innerHTML、只追加新 chunk 差量渲染
- [ ] **多语言 key 校验脚本** — 10 种语言文件 key 一致性自动化检查（防止翻译缺失导致页面空白），低成本高收益

## 🟢 P2 — 可长期拖着（无害）

- [ ] **导出菜单的全局事件** — `content.js` 里的 `document.addEventListener('click', ...)` 导出菜单处理在模块顶层而非 `setupEventListeners` 内，面板关闭后还在监听，虽然无害但可以优化
- [ ] **接入 E2E 测试** — 目前是纯手动测试，`test/` 已有 3 个临时脚本（btn-drag / del-btn / xml-guard）。至少给 chat flow（流式 / 非流式）写 playwright 测试
- [ ] **CHANGELOG.md** — 目前只有 README 列出功能，没有清晰的版本变更日志
- [ ] **开发者指南** — 如何添加新 API 提供商、如何贡献的说明

## ✨ Feature Ideas

> 功能优先级是产品决策，不在这里排。但注意：**「粘贴图片提问」如果要做，建议和 P0 的 CSS 重构一起做**——多模态图片消息需要新气泡样式，正好在提取后的 content.css 里加，一次改动解决两件事。

- [ ] **自定义快捷按钮拖拽排序** — 选项页的快捷按钮列表支持拖拽调整顺序
- [ ] **上下文长度配置** — 目前最大上下文轮数有了（maxRounds），但页面全文固定截断 15000 字符，加到选项页
- [ ] **粘贴图片提问** — 粘贴截图到输入框，以图片方式传给支持多模态的 API（如 GPT-4o、Claude）
- [ ] **对话搜索** — 历史对话列表加搜索框，按关键词过滤
- [ ] **对话重命名** — 历史列表中直接修改对话标题（点击标题编辑）
- [ ] **导出格式扩展** — 支持 JSON（原始数据）、HTML 格式导出
- [ ] **跟随页面导航** — 切换 tab 后回到原页面，自动刷新上下文并提示（目前只是重新提取，但没有「页面变了，上下文刷新」的提示）
- [ ] **注入状态指示** — 浮动按钮加一个 badge 显示当前配置的提供商 / 模型
- [ ] **本地 LLM 一键配置** — Ollama 的配置入口更深一点（provider 下拉选了 ollama 但仍需手动设置），可加「检测本地 Ollama」按钮自动填充
- [ ] **AI 回答可编辑** — 对 AI 回复不满意，支持直接编辑气泡内容并重新提交

## ✅ 已完成

- [x] **CSS 提取到单独文件** — 728 行内联 CSS → `content.css`（manifest 自动注入），`injectStyles()` 删除，content.js 744→17 行
- [x] **content.css 文件废弃** — 旧 content.css 已删除，新 content.css 为提取后的正式样式文件（v1.8.2+）
