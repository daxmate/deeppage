# DeepPage

> [English README](./README.en.md) · 在浏览网页时与 DeepSeek 对话——总结全文、提炼要点、自由问答。

## 功能

- **内嵌对话面板** — 点击右下角按钮，在当前页面直接展开聊天气泡
- **一键快捷操作** — 可自定义的快捷按钮，默认支持总结全文、提炼要点、翻译
- **全文理解** — 自动提取页面正文作为对话上下文
- **对话记忆** — 同一页面保持完整聊天历史，关闭面板不丢失
- **聊天历史** — 自动保存所有对话记录，历史列表随时回顾/切换/删除
- **页面上下文保存** — 对话附带页面内容，重启面板上下文不丢
- **复制回复** — AI 回复气泡 hover 显示复制按钮，一键复制到剪贴板
- **流式输出** — AI 回复逐 token 实时显示，打字机效果无需等待完整响应
- **选中文本提问** — 选中页面段落自动弹出浮动按钮，以网页内容为背景结合 AI 知识解释选中内容
- **可拖拽 / 可调整大小** — 面板位置随意拖动，大小自由缩放，初始垂直居中
- **Markdown 渲染** — 对话回复支持标题、列表、表格、代码块、引用、任务列表等完整 GFM（基于 marked）
- **多语言** — 内置 10 种语言（中文/English/日本語/한국어/Español/Français/Deutsch/Русский/Tiếng Việt），面板和选项页均可切换
- **Dark Mode** — 自动适配系统暗色主题，面板和选项页均可手动切换

## 使用方式

1. 安装扩展后访问任意网页
2. 点击右下角 DeepSeek 图标打开对话面板
3. 首次使用需配置 API Key：
   - 右键扩展图标 → **选项**
   - 输入你的 [DeepSeek API Key](https://platform.deepseek.com/api_keys)
   - 点击保存
4. 点击快捷按钮（总结 / 要点 / 翻译），或自由提问

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

### 项目结构

```
├── i18n.js                 # 多语言引擎（10 种语言）
├── manifest.json           # 扩展配置
├── background.js           # 后台服务 — API 调用
├── content.js              # 内容脚本 — 面板 UI + 聊天逻辑
├── options.html / .js      # 设置页面 — API Key + 按钮配置
├── content.css             # 面板样式（未使用，保留参考）
├── marked.umd.min.js       # Markdown 渲染引擎（marked v15）
├── icons/                  # DeepSeek 图标
├── test-resize.html        # 拖拽缩放测试页
└── test-markdown.html      # Markdown 渲染测试页
```

### 添加新语言

编辑 `i18n.js`：
1. 在 `TRANSLATIONS` 对象中新增语言条目（32 个 key）
2. 在 `LANGUAGES` 数组中添加语言
3. 更新 `detectLanguage()`（如需自动检测）

## License

MIT
