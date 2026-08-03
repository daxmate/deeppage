# DeepPage TODO

> **优先级规则**：每加一个功能前，先清一条 P0。P1 择机清理，P2 可以一直拖。
> 🔴 P0 = 结构性债务，越拖越贵（改一次的地方要改两处、找样式要找半天）
> 🟡 P1 = 重要，值得做（真实 bug 或明显体验问题）
> 🟢 P2 = 无害，有空再说
>
> ✅ 已完成项已归档，历史变更详见 [CHANGELOG.md](./CHANGELOG.md)

## ✨ Feature Ideas

> 功能优先级是产品决策，不在这里排。注意：**「粘贴图片提问」如果要做，建议和气泡样式一起做**——多模态图片消息需要新气泡样式，正好在 content.css 里加，一次改动解决两件事。

- [x] **自定义快捷按钮拖拽排序** ✅ 已完成（v1.18.0） — 选项页快捷按钮列表 ⠿ 拖拽把手重排，松手自动保存到 `quickActions`，侧边栏同步；拖到列表外取消恢复原序
- [x] **上下文长度配置** ✅ 已完成 — 页面正文截断长度可配置（options 请求参数区滑杆，默认 15000，范围 2000-50000，`maxContextLen` key），content script 初始化时加载缓存；对话轮数（maxRounds）此前已实现
- [ ] **粘贴图片提问** — 粘贴截图到输入框，以图片方式传给支持多模态的 API（如 GPT-4o、Claude）
- [x] **对话搜索** ✅ 已完成（v1.9.0） — 历史列表头部加搜索框，按关键词实时过滤（标题/消息内容，大小写不敏感）；v1.9.3 修复键盘事件冒泡到主页面 + 输入丢字（只重渲染结果区保焦点）
- [x] **对话重命名** ✅ 已完成（v1.13.0） — 历史列表每项 ✏️ 按钮内联编辑标题（回车/失焦保存，Esc 取消，空标题回退原标题，手动命名后标题锁定不被 AI/截断覆盖）
- [x] **导出 PDF** ✅ 已完成（v1.14.0） — 导出菜单新增「下载 PDF」，对话气泡截图式渲染成 A4 PDF（html2pdf.js = html2canvas + jsPDF，中文零成本）。~~JSON / HTML 导出~~（评估后砍掉：JSON 无导入配套价值减半、HTML 跨设备渲染不一致用处不大）
- [ ] **跟随页面导航** — 切换 tab 后回到原页面，自动刷新上下文并提示（目前只是重新提取，但没有「页面变了，上下文刷新」的提示）
- [x] **注入状态指示** ✅ 已完成（v1.11.0） — 悬浮按钮图标随当前配置的 AI 提供商切换（12 家单色 logo），悬停显示「提供商 · 模型」，切换配置实时刷新
- [ ] **本地 LLM 一键配置** — Ollama 的配置入口更深一点（provider 下拉选了 ollama 但仍需手动设置），可加「检测本地 Ollama」按钮自动填充
- [ ] **回复改写** — 对 AI 回复不满意时，选中该回复生成「请改写这条回复（更简洁/更正式…）」指令发给 AI，AI 重写后替换原气泡。**不做直接编辑气泡文本**（编辑的是渲染结果、对话上下文未同步，易误导；且「替 AI 说话」与对话定位冲突）——要改就引导 AI 自己改
- [ ] **联网搜索** — 当前网页信息不足、或 AI 知识滞后时自动联网补充。**面向普通用户，不依赖 OpenClaw**。三条可选路径（可并行，优先级待定）：
  - A. **复用已有 provider 的联网能力**（最省事）— Moonshot Kimi（API `web_search` 工具）、智谱 GLM（`web-search` 工具）都支持联网参数；**DeepSeek 实测支持**（2026-08-03 验证：`POST /v1/responses` + `deepseek-v4-flash` + `tools:[{type:"web_search"}]` 真实触发搜索并引用当日新闻；标准 `chat/completions` 不支持，报 `unknown variant web_search`）→ 需给 DeepPage 新增 Responses API 端点格式支持；选项页加「🔍 联网搜索」开关即可，用户已有 key 零新增依赖
  - B. **新增 Perplexity provider**（几乎零代码）— `sonar` 系列模型原生联网，OpenAI 兼容，`providers.js` 加一项即可（同 Moonshot/Groq 模式）
  - C. **集成 Tavily 搜索 API**（最通用）— 提问前先搜索，结果拼入 prompt 再发 AI，所有 provider 通用；用户需另配一个搜索 key
- [ ] **OpenClaw channel 集成**（进阶玩法，决策待定）— 让 DeepPage 成为 OpenClaw 的浏览器 channel：持久会话 + agent 工具（含原生联网搜索）+ 记忆，回复确定性路由回侧边栏。预研已完成并实测验证（握手/chat.send/流式事件全通），蓝图见 [docs/openclaw-channel-integration.md](./docs/openclaw-channel-integration.md)；仅服务已安装 OpenClaw 的用户，与上方联网搜索（大众向）不冲突
- [ ] **Responses API 端点格式支持** — DeepSeek 联网搜索的前置条件：新增 `/v1/responses` 端点格式（output 块结构、`web_search_call` 事件、流式事件类型均与 chat/completions 不同，`buildBody` 需新增分支）。已实测确认 DeepSeek Responses API 支持 `web_search`（2026-08-03，模型 `deepseek-v4-flash`）；实现后 DeepSeek 用户可联网搜索，也为将来接入其他 Responses API 兼容 provider 铺路

## 📦 已完成归档（摘要）

### v1.18.0 — 快捷按钮拖拽排序（2026-08-02）

- **v1.18.0**：选项页快捷按钮列表 ⠿ 拖拽把手重排（悬停高亮、实时让位），松手自动保存 `quickActions` 并同步侧边栏；拖到列表外取消恢复原序；新增 `dragSortHint` key × 10 语言 + E2E 两用例

### v1.17.x — 操作反馈与导出修复（2026-08-02）

- **v1.17.0**：引入 SweetAlert2 Toast 反馈体系（导出/复制/清除上下文/设置保存/API 测试），导出 PDF/Word 补失败捕获，新增 5 key × 10 语言
- **v1.17.1**：修复导出菜单下载 .md 无成功提示；导出 Markdown/纯文本文件头（标题/页面/时间/角色名）改按界面语言 i18n，新增 6 key × 10 语言
- **v1.17.2**：空对话时导出/清除上下文/新建按钮置灰禁用，不再无反馈；E2E 新增覆盖用例

### v1.16.x — 全屏模式与稳定性（2026-08-02）

- **v1.16.0**：全屏面板模式（header 按钮/Esc 切换，24px 边距铺满视口）
- **v1.16.1**：悬浮按钮在 Fluent UI 等站点变形修复（关键属性 `!important` + 内联样式双保险）
- **v1.16.2**：全屏按钮误关面板修复（`composedPath()`）；悬浮按钮在面板打开时未隐藏修复
- **v1.16.3**：API Key 改为仅本地保存（`chrome.storage.local`），不再云端同步，旧 Key 自动迁移
- **v1.16.4**：面板鼠标完全接管（Pointer Events + `setPointerCapture` + 滚轮拦截），触摸拖动支持

### v1.15.0 — 导出 Word 文档（2026-08-02）

- **v1.15.0**：导出菜单新增「下载 Word」——docx.js 生成标准 .docx（角色区分 + 代码块等宽样式），10 语言文案

### v1.14.x — 导出 PDF（2026-08-01）

- **v1.14.0**：导出菜单新增「下载 PDF」——对话气泡截图式渲染 A4 PDF（html2pdf.js 0.14，html2canvas+jsPDF，中文支持好）；文件名含页面标题；导出容器脱离页面避免样式干扰；新增 E2E 断言 PDF 文件头与内容大小

### v1.13.x — 对话重命名（2026-08-01）

- **v1.13.0**：对话重命名——历史列表 ✏️ 内联编辑（回车/失焦保存、Esc 取消、空标题回退）；`titleLocked` 标记使手动命名后 AI 标题与自动截断均不覆盖；i18n 10 语言新 key；新增 rename 专项测试 4 用例

### v1.11.x / v1.12.x — 注入状态指示 + AI 标题（2026-08-01）

- **v1.11.0**：注入状态指示——悬浮按钮图标随提供商切换（`js/provider-icons.js` 12 家单色 SVG，LobeHub/simple-icons/Boxicons/官网来源），storage.onChanged 实时刷新
- **v1.12.0**：AI 生成对话标题——首轮回复后自动生成（10 语言提示词、temp 0.3、50 token）；修复 AI 标题被后续保存覆盖（`titleGenerated` 标记）；mock server 响应以请求体 stream 为准 + `failNonStream` 开关；新增 title-gen 专项测试 3 用例

### v1.9.x — 功能与工程化（2026-08-01）

- **v1.9.3**：修复历史搜索框键盘事件冒泡到主页面 + 输入丢字（重渲染重建输入框丢焦点）——拆出结果区独立渲染
- **v1.9.2**：接入 ESLint + Prettier（三分区 flat config，全量格式化）；新增 `scripts/bump-version.mjs` 统一 manifest/package.json 版本；CI 发布门槛 = lint + 测试全过 + 三方版本一致
- **v1.9.1**：CI 发布门槛上线（test job → release job `needs: test`），首个走新流程的版本
- **v1.9.0**：历史对话搜索（标题/内容关键词过滤）

### v1.8.x — 测试框架与债务清理（2026-08-01）

- **测试框架**：Playwright E2E（25 用例）+ mock server + i18n 校验脚本（`check-i18n.mjs`），`npm test` 一键全绿
- **流式输出开关**（`streamOutput`）+ 非流式 JSON 兜底解析
- **流式渲染 rAF 节流**：长文本 DOM 写入 ~1万次 → 25 次
- **修复**：气泡重复、assistantDiv 作用域 ReferenceError、clearContext 保留错误消息、纯文本导出未剥离 markdown
- **P0/P1/P2 全清**：CSS 提取、暗色变量去重、providers 单一数据源、面板 DOM（核实创建一次即最优）、开发者指南 `docs/DEVELOPMENT.md`
- **决策记录**：content script 模块化（ES modules + esbuild）评估后搁置——风险未变现（全局声明从未冲突、测试兜底），构建成本 > 收益；若将来要做选轻量 IIFE + `window.DP` 命名空间方案
