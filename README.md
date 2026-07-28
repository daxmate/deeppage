# DeepPage

在浏览网页时与 DeepSeek 对话——总结全文、提炼要点、自由问答。

## 功能

- **内嵌对话面板** — 点击右下角按钮，在当前页面直接展开聊天气泡
- **一键快捷操作** — 总结全文、提炼要点、翻译，点一下就行
- **全文理解** — 自动提取页面正文作为对话上下文
- **对话记忆** — 同一页面保持完整聊天历史，关闭面板不丢失
- **可拖拽 / 可调整大小** — 面板位置随意拖动，大小自由缩放
- **Markdown 渲染** — 对话回复支持标题、列表、表格、代码块、引用、任务列表等完整 Markdown（基于 marked）
- **多语言** — 支持中文和英文界面，自动适配浏览器语言
- **Dark Mode** — 自动适配系统暗色主题

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

## 技术原理

```
┌──────────────────────┐   chrome.runtime   ┌──────────────────────┐
│  Content Script      │ ──────────────────→│  Service Worker      │
│  (内嵌对话面板)      │                    │  (调用 API)          │
│  提取页面内容        │ ←──────────────────│  fetch ...           │
│  用户界面交互        │                    │  api.deepseek.com    │
└──────────────────────┘                    └───────────┬──────────┘
                                                       │
                                                POST /v1/chat/completions
                                                       │
                                                ┌──────▼──────┐
                                                │  DeepSeek   │
                                                │  官方 API   │
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
├── i18n.js                 # 多语言支持
├── manifest.json          # 扩展配置
├── background.js          # 后台服务 — API 调用
├── content.js             # 内容脚本 — 按钮 + 对话面板
├── options.html / .js     # 设置页面 — API Key 配置
├── marked.umd.min.js      # Markdown 渲染引擎（marked）
└── icons/                 # DeepSeek 官方图标
```

## License

MIT
