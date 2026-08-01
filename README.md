# DeepPage

> [English README](./README.en.md) · 在浏览网页时与 DeepSeek 对话——总结全文、提炼要点、自由问答。

## 功能

- **内嵌对话面板** — 点击右下角按钮，在当前页面直接展开聊天气泡
- **注入状态指示** — 悬浮按钮图标随当前配置的 AI 提供商切换，悬停可见完整「提供商 · 模型」，切换配置实时刷新
- **一键快捷操作** — 可自定义的快捷按钮，默认支持总结全文、提炼要点、翻译
- **全文理解** — 自动提取页面正文作为对话上下文
- **对话记忆** — 同一页面保持完整聊天历史，关闭面板不丢失
- **聊天历史** — 自动保存所有对话记录，历史列表随时回顾/切换/删除/重命名，支持关键词搜索（匹配标题或消息内容）；首轮回复后自动生成 AI 标题
- **页面上下文保存** — 对话附带页面内容，重启面板上下文不丢
- **复制回复** — AI 回复气泡 hover 显示复制按钮，一键复制到剪贴板
- **流式输出** — AI 回复逐 token 实时显示，打字机效果无需等待完整响应；可在选项页关闭流式（兼容仅支持非流式响应的 API）
- **流式渲染优化** — rAF 帧合并 + 长文本降频，超长回复依然流畅不卡顿
- **选中文本提问** — 选中页面段落自动弹出浮动按钮，以网页内容为背景结合 AI 知识解释选中内容
- **对话上下文裁剪** — 自动裁剪最早的消息轮次（默认 20 轮），避免超出模型 token 限制，选项页可自定义
- **页面内容截断可配置** — 发送给 AI 的页面正文最大字符数可调（默认 15000，范围 2000-50000），长页面不再一刀切
- **一键清除上下文** — 面板标题栏清除按钮，保留最新消息，清空历史轻松重置对话
- **对话导出** — 导出按钮支持复制 Markdown / 复制纯文本 / 下载 .md 文件，含页面标题和 URL；纯文本导出自动剥离 Markdown 语法
- **可拖拽 / 可调整大小** — 面板位置随意拖动，大小自由缩放，初始垂直居中
- **Markdown 渲染** — 对话回复支持标题、列表、表格、代码块、引用、任务列表等完整 GFM（基于 marked）
- **多语言** — 内置 10 种语言（中文/English/日本語/한국어/Español/Français/Deutsch/Русский/Tiếng Việt），面板和选项页均可切换
- **Dark Mode** — 自动适配系统暗色主题，面板和选项页均可手动切换
- **多 API 格式** — 支持 OpenAI 兼容接口（DeepSeek、Ollama、Groq 等）和 Anthropic 原生接口
- **自定义接口地址** — 可设置任意 Base URL，自由对接自部署或第三方服务

## 快速开始

### 1. 安装

目前 DeepPage 以**开发者模式**加载（尚未上架 Chrome Web Store）：

1. 打开 `chrome://extensions`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择项目目录

### 2. 配置 API Key

安装后首次使用需配置 API Key：

1. 点击扩展栏的 DeepPage 图标 → 右键 → **选项**
2. 选择你的 AI 提供商（DeepSeek / OpenAI / Anthropic 等）
3. 输入 **API Key**（例如从 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 获取）
4. 设置即自动保存

### 3. 开始使用

- 打开任意网页，点击右下角 **DeepSeek 图标** 展开对话面板
- 点击快捷按钮：**总结全文** / **提炼要点** / **翻译**
- 或在输入框中自由提问
- 选中网页段落，自动弹出 **💬 对此段提问** 按钮，快速追问

---

## 隐私说明

- 插件仅读取当前网页的文本内容（不包含图片、样式、脚本）
- 网页内容仅用于向 DeepSeek API 发送请求，不会上传到其他第三方
- 使用你自己的 API Key，数据不经过任何第三方中转

## Architecture

```
┌──────────────────────┐   chrome.runtime   ┌──────────────────────┐
│  Content Script      │ ──────────────────→│  Service Worker      │
│  (Inline Chat UI)    │                    │  (API Calls)         │
│  Extract Content     │ ←──────────────────│  Fetch Response      │
│  User Interaction    │                    │  api.deepseek.com    │
└──────────────────────┘                    └──────────┬───────────┘
                                                       │
                                                POST /v1/chat/completions
                                                       │
                                                ┌──────▼──────┐
                                                │  DeepSeek   │
                                                │  Official   │
                                                │  API        │
                                                └─────────────┘
```

- 直接调用 DeepSeek 官方 API（标准 OpenAI 兼容接口）
- 支持 `deepseek-v4-flash` / `deepseek-v4-pro` 模型
- 无需隐藏标签页、无需处理 PoW 反爬

## 开发

纯原生 Chrome Extension（Manifest V3），无构建步骤。

```bash
git clone https://github.com/daxmate/deeppage.git
```

在 `chrome://extensions` → 加载已解压的扩展程序 → 选择项目目录。

### 运行测试

项目内置 Playwright 端到端测试框架（mock 服务器模拟 OpenAI 兼容 API，无需真实 Key）：

```bash
npm install
npm test        # 自动运行 i18n 校验 + 23 个 E2E 用例
```

> 完整开发指南（添加 API 提供商 / 写测试 / i18n / 发版）见 [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

### 项目结构

```
├── js/                     # JavaScript 脚本
│   ├── i18n.js             # 多语言引擎（10 种语言）
│   ├── utils.js            # 工具函数
│   ├── providers.js        # API 提供商配置（单一数据源，background/options 共享）
│   ├── chat.js             # 对话管理 + API 调用 + 导出
│   ├── sidebar.js          # 面板 UI + 拖拽 + 选中按钮
│   ├── content.js          # 内容脚本 — 入口（启动面板）
│   ├── background.js       # 后台服务 — API 调用
│   ├── options.js          # 设置页面逻辑
│   ├── spa-patch.js        # SPA 导航补丁（主世界，清理选中按钮）
│   └── marked.umd.min.js   # Markdown 渲染引擎（marked v15）
├── tests/                  # Playwright E2E 测试（23 个用例）
│   ├── mock-server.js      # OpenAI 兼容 mock API
│   └── fixtures.mjs        # 扩展 context / storage / mock 控制 fixture
├── scripts/
│   └── check-i18n.mjs      # i18n 校验脚本（语言数组长度/顺序/空值/引用）
├── options.html            # 设置页面
├── options.css             # 设置页面样式
├── content.css             # 聊天面板样式（manifest 自动注入）
├── manifest.json           # 扩展配置
├── icons/                  # DeepSeek 图标
└── .github/workflows/      # CI 发布配置（push tag 自动打包发版）
```

### 添加新语言

编辑 `i18n.js`：
1. 在 `LANG_CODES` 数组末尾添加语言代码
2. 在每个 `TRANSLATIONS` key 的数组末尾添加对应翻译（每个 key 一行，追加一个值即可）
3. 在 `LANGUAGES` 数组中添加语言显示名
4. 更新 `detectLanguage()`（如需自动检测）

修改后运行 `npm run check:i18n` 校验 10 语言数组一致性（`npm test` 也会自动执行）。

## License

MIT
