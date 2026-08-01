# DeepPage 开发者指南

本文面向想为 DeepPage 贡献代码的开发者：如何添加新的 API 提供商、如何运行测试、如何发版。

## 目录

- [添加新的 API 提供商](#添加新的-api-提供商)
- [运行测试](#运行测试)
- [i18n 多语言维护](#i18n-多语言维护)
- [代码结构速览](#代码结构速览)
- [发布新版本](#发布新版本)
- [贡献规范](#贡献规范)

---

## 添加新的 API 提供商

DeepPage 的提供商配置是**单一数据源**：`js/providers.js`。添加一个提供商只需改这一个文件。

### 步骤

在 `js/providers.js` 的 `API_PROVIDERS` 数组中追加一项：

```js
{ id: 'your-provider', label: '你的提供商', type: 'openai', baseUrl: 'https://api.example.com/v1', model: '默认模型名', keyLink: 'https://example.com/api-keys' },
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | 唯一标识，存储用，小写连字符 |
| `label` | ✅ | 下拉框显示名 |
| `type` | ✅ | `'openai'`（OpenAI 兼容）或 `'anthropic'`（原生格式） |
| `baseUrl` | ✅ | API 根地址（不含路径，如 `/v1/chat/completions` 由扩展拼接） |
| `model` | ✅ | 默认模型名，用户可在选项页修改 |
| `keyLink` | 可选 | 申请 API Key 的链接，空字符串则隐藏 |

### 注意事项

1. **Anthropic 格式**：`type: 'anthropic'` 的提供商走 `/messages` 端点，请求头用 `x-api-key` + `anthropic-version`。背景逻辑见 `js/background.js` 的 `API_PATHS` 和 `buildBody()`。
2. **OpenAI 兼容**：绝大多数提供商（DeepSeek、Ollama、Groq、Together 等）都是这个格式，`stream` 参数由选项页的「流式输出」开关控制。
3. **自定义提供商**：`custom` 项是用户手动填 Base URL 的入口，不要改动它的 `baseUrl: ''`。
4. **非流式 API**：如果提供商不支持流式，用户可在选项页关闭「流式输出」开关，扩展会自动用非流式 JSON 请求并解析（`background.js` 已内置兜底）。

### 验证

添加后：

```bash
npm run check:i18n   # 确认没破坏 i18n
npm test             # 跑全部 23 个 E2E 用例（含 options 页提供商列表渲染）
```

E2E 测试会断言提供商下拉框至少 12 项（`tests/options.spec.mjs`），新增后请同步更新断言数量。

---

## 运行测试

项目内置 Playwright 端到端测试框架，**无需真实 API Key**（mock server 模拟 OpenAI 兼容 API）：

```bash
npm install          # 首次
npm test             # i18n 校验（pretest 自动跑）+ 23 个 E2E 用例
npm run test:ui      # Playwright UI 模式（可视化调试）
```

### 测试结构

```
tests/
├── mock-server.js       # OpenAI 兼容 mock API（流式 SSE / 非流式 JSON / 401 错误 / 静态页面）
├── fixtures.mjs         # 扩展 context、extensionId、sw、setupMockApi、mock 控制
├── chat-flow.spec.mjs   # 聊天核心流程（5 用例）
├── panel-ui.spec.mjs    # 面板 UI（历史/导出/清除/暗色/语言，5 用例）
├── options.spec.mjs     # 选项页（提供商/保存/测试连接/快捷操作，4 用例）
├── xml-guard.spec.mjs   # XML/SVG 页面守卫（3 用例）
├── btn-drag.spec.mjs    # 悬浮按钮拖拽（1 用例）
├── sel-btn-spa.spec.mjs # 选中文本按钮 + SPA 清理（1 用例）
├── del-btn.spec.mjs     # 消息删除按钮（1 用例）
├── panel-lifecycle.spec.mjs  # 面板开关不重复创建 DOM（1 用例）
└── streaming-perf.spec.mjs   # 长文本流式渲染节流（1 用例）
```

### 写新测试

1. 用 `fixtures.mjs` 导出的 `test`（已注入扩展 context）和 `expect`
2. `setupMockApi()` 把扩展指向 mock server（custom provider + 本地 baseUrl）
3. `mock.config({ stream: true, responseContent: '...', failNext: false })` 控制 mock 行为
4. `mock.requests()` 读取收到的请求（断言请求体/参数）

**常见坑**：

- content script 在 isolated world，页面 `evaluate` 访问不到扩展内部函数，要通过 DOM 断言或用 `sw.evaluate` 读 `chrome.storage`
- `toggle-switch` 的 checkbox 视觉隐藏，用 `evaluate` 触发 `change` 而非 `click`
- 发消息后请求是异步的，读 `mock.requests()` 前先 `expect(...).toPass()` 轮询
- context-loaded 欢迎消息也是 `__dp-assistant` 角色，选择器要加 `:not([data-msg-type])`

---

## i18n 多语言维护

DeepPage 内置 10 种语言（`zh_CN, en, ja, zh_TW, ko, es, fr, de, ru, vi`），翻译集中在 `js/i18n.js` 的 `TRANSLATIONS` 对象。

### 添加语言

1. `LANG_CODES` 数组末尾添加语言代码
2. 每个 `TRANSLATIONS` key 的数组末尾追加对应翻译
3. `LANGUAGES` 数组添加语言显示名
4. 更新 `detectLanguage()`（如需自动检测）

### 修改翻译

每个 key 的数组按 `LANG_CODES` 顺序对应语言，**位置不能错**（历史上出过语言错位 bug）。

改完运行：

```bash
npm run check:i18n
```

脚本检查：数组长度一致、顺序正确、无空值、代码引用完整。`npm test` 也会自动执行。

---

## 代码结构速览

| 文件 | 职责 |
|---|---|
| `js/content.js` | 内容脚本入口，非 HTML 文档跳过，启动面板 |
| `js/sidebar.js` | 面板 UI 创建/开关、拖拽缩放、导出菜单、选中文本按钮 |
| `js/chat.js` | 对话管理、流式渲染（rAF 节流）、清除上下文、导出格式化 |
| `js/background.js` | Service Worker：API 调用、SSE 解析、非流式兜底 |
| `js/utils.js` | 工具函数（含 markdown 渲染/纯文本剥离） |
| `js/providers.js` | API 提供商单一数据源 |
| `js/i18n.js` | 多语言引擎（10 语言） |
| `js/options.js` + `options.html` | 选项页 |
| `js/spa-patch.js` | 主世界 SPA 导航补丁（清理选中按钮） |
| `content.css` | 聊天面板样式（manifest 自动注入） |
| `tests/` | Playwright E2E 测试 |
| `scripts/check-i18n.mjs` | i18n 校验脚本 |

---

## 发布新版本

```bash
# 1. 统一更新版本号（manifest.json + package.json 同步）
npm run bump:version -- 1.9.2
# 2. 更新 CHANGELOG.md（Keep a Changelog 风格，中文章节）
git add -A && git commit -m "chore: bump version to 1.9.2"
git tag v1.9.2
git push origin main --tags
# 3. 等 GitHub Actions 自动跑测试 + 建 Release（测试不过不会发版）
# 4. 手动补写双语 Release notes
gh release edit v1.9.2 --notes-file /tmp/notes.md
```

**版本号规则**：加新功能 → 第二位 +1（`1.8.x` → `1.9.0`）；仅重构/修复 → 第三位 +1（`1.8.13` → `1.8.14`）。

**Release notes 规范**：中英双语（中文在前），emoji 分节（✨ 新功能 / 🐛 修复 / 🔧 重构 / ⚙️ 工程），每条加粗标题 + 说明，结尾附 `**Full Changelog**: .../compare/vX.X.X...vX.X.X`。

> ⚠️ 发布前先跑 `npm test` 确认全绿；CI 会自动校验 manifest 版本与 tag 一致、package.json 与 manifest 一致，并跑全部 E2E 用例，全部通过才创建 Release。

---

## 贡献规范

- **先对齐思路再动手**：较大的改动先说明方案再写代码
- **不造轮子**：通用需求优先用成熟方案（如 marked 做 markdown）
- **测试覆盖**：新功能/修复尽量补 E2E 用例，改菜单类多分支功能时每个分支都要覆盖
- **发版必更日志**：CHANGELOG.md + GitHub Release notes 双语
- **i18n**：新增 UI 文案必须补全 10 种语言，跑 `npm run check:i18n`
