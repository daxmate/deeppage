# DeepPage TODO

> **优先级规则**：每加一个功能前，先清一条 P0。P1 择机清理，P2 可以一直拖。
> 🔴 P0 = 结构性债务，越拖越贵（改一次的地方要改两处、找样式要找半天）
> 🟡 P1 = 重要，值得做（真实 bug 或明显体验问题）
> 🟢 P2 = 无害，有空再说

## 🔴 P0 — 结构性债务（下次加功能前必须清）

- [x] **CSS 提取到单独文件** ✅ 已完成（v1.8.2→） — 728 行内联 CSS 已提取到 `content.css`，manifest `content_scripts[].css` 自动注入，`injectStyles()` 已删除（content.js 从 744 行降到 17 行）
- [x] **CSS 注入语法错误（孤立属性）** ✅ 已确认修复 — 代码中已不存在 `background: #25262b; color: #e4e5e7;` 游离声明（此前 `e471a15` 重构暗色模式时已处理），TODO 记录过时
- [x] **暗色主题大量重复** ✅ 已完成 — `@media (prefers-color-scheme: dark)` 块与 `#__dp-panel.__dp-dark` 的两套 56 个 `--dp-*` 变量已合并为一份（选择器列表 `#__dp-panel.__dp-dark, #__dp-panel.dp-sys-dark`），系统暗色由 sidebar.js `matchMedia` 检测加 `dp-sys-dark` 类驱动，行为不变
- [x] **公共常量去重** ✅ 已完成 — `API_PROVIDERS` 已抽到 `js/providers.js`（ES module 单一数据源，含 label/keyLink），background.js 通过 `API_PROVIDER_MAP` 索引，options.js 直接 import，options.html 的 options.js 改为 `type="module"` 加载

## 🟡 P1 — 重要，择机清理

- [x] **选中文本按钮未清理** ✅ 已完成 — 修复时发现功能更严重：`showSelBtn` 从未被调用（触发逻辑丢失，选中文本不弹按钮），已重新接线（mouseup 检测选中文本显示按钮，面板内不触发）；SPA 导航清理：`js/spa-patch.js` 注入主世界 patch `pushState/replaceState` + 监听 `popstate`/`hashchange`，导航后 `removeSelBtn()`；按钮自愈重建。新增 `test/sel-btn-spa-test.mjs`（4/4）
- [x] **options.js 重复 i18n key** ✅ 已核实无重复 — 110 个 key 全部唯一（此前记录的 `apiProviderLabel` 等重复已随重构消失），TODO 过时
- [x] **面板 DOM 销毁重建** ✅ 已核实无需改动 — 当前实现即「创建一次、开关只切 display」（`createChatPanel` 仅调用一次，`togglePanel` 只切 `__dp-open` class，默认 `display:none`），无重复创建；已加回归测试 `tests/panel-lifecycle.spec.mjs` 防止回归
- [x] **Markdown 渲染性能** ✅ 已完成 — 流式渲染改为 rAF 节流合并（每帧最多渲染一次）+ 长文本降频（>3000 字符每 100ms 渲染一次，done/error 时强制 flush）。实测 10180 字符长回复从逐 chunk 全量渲染（~1 万次）降到 25 次 DOM 写入。新增回归测试 `tests/streaming-perf.spec.mjs`
- [x] **多语言 key 校验脚本** ✅ 已完成 — `scripts/check-i18n.mjs`（npm run check:i18n，`pretest` 自动执行）：检查 110 个 key 的 10 语言数组长度/顺序/空值 + 代码引用完整性。首次运行即抓到真实问题：`testApiRequired` 5 种语言空值且顺序错乱，已修复

## 🟢 P2 — 可长期拖着（无害）

- [x] **导出菜单的全局事件** ✅ 已完成 — `document.addEventListener('click')` 从模块顶层移入面板创建流程（`createButton` 内绑定），监听器内部先判空（元素被移除时不再空转），菜单逻辑分支合并；导出用例（下载/复制 md/复制纯文本）全绿验证无回归
- [x] **接入 E2E 测试** ✅ 已完成（v1.8.8） — Playwright 框架 `tests/` + mock server，`npm test` 跑 21 个用例（chat-flow / panel-ui / options / xml-guard / btn-drag / sel-btn-spa / del-btn），旧 `test/` 临时脚本已迁移删除
- [x] **CHANGELOG.md** ✅ 已完成 — 每次发版都更新（Keep a Changelog 风格，中文章节），v1.8.5 起每版都有记录，且 Release notes 同步双语
- [x] **开发者指南** ✅ 已完成 — `docs/DEVELOPMENT.md`：如何添加新 API 提供商（providers.js 单条配置 + 字段说明 + 验证）、运行/编写 E2E 测试、i18n 维护、代码结构速览、发版流程、贡献规范；README 已链接

## ✨ Feature Ideas

> 功能优先级是产品决策，不在这里排。但注意：**「粘贴图片提问」如果要做，建议和 P0 的 CSS 重构一起做**——多模态图片消息需要新气泡样式，正好在提取后的 content.css 里加，一次改动解决两件事。

- [ ] **自定义快捷按钮拖拽排序** — 选项页的快捷按钮列表支持拖拽调整顺序
- [ ] **上下文长度配置** — 目前最大上下文轮数有了（maxRounds），但页面全文固定截断 15000 字符，加到选项页
- [ ] **粘贴图片提问** — 粘贴截图到输入框，以图片方式传给支持多模态的 API（如 GPT-4o、Claude）
- [x] **对话搜索** ✅ 已完成 — 历史列表头部加搜索框，按关键词实时过滤（匹配对话标题或任一消息内容，大小写不敏感），清空恢复全部，无匹配显示提示；新增 i18n key ×2（搜索占位符/无匹配），E2E 用例覆盖（标题搜索/内容搜索/无匹配/清空恢复）
- [ ] **对话重命名** — 历史列表中直接修改对话标题（点击标题编辑）
- [ ] **导出格式扩展** — 支持 JSON（原始数据）、HTML 格式导出
- [ ] **跟随页面导航** — 切换 tab 后回到原页面，自动刷新上下文并提示（目前只是重新提取，但没有「页面变了，上下文刷新」的提示）
- [ ] **注入状态指示** — 浮动按钮加一个 badge 显示当前配置的提供商 / 模型
- [ ] **本地 LLM 一键配置** — Ollama 的配置入口更深一点（provider 下拉选了 ollama 但仍需手动设置），可加「检测本地 Ollama」按钮自动填充
- [ ] **AI 回答可编辑** — 对 AI 回复不满意，支持直接编辑气泡内容并重新提交

## ✅ 已完成

- [x] **CSS 提取到单独文件** — 728 行内联 CSS → `content.css`（manifest 自动注入），`injectStyles()` 删除，content.js 744→17 行
- [x] **content.css 文件废弃** — 旧 content.css 已删除，新 content.css 为提取后的正式样式文件（v1.8.2+）
