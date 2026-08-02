# Changelog

本项目的所有重要变更都记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.16.4] - 2026-08-02

### 修复

- **鼠标在面板内时完全接管，不再传到主页面**：此前拖动/缩放面板时鼠标一旦移出面板边界，底下的页面元素会收到 hover 效果、触发文本选中甚至页面自身的拖拽逻辑；面板滚动区滚到边界后滚轮也会继续滚主页面。现已将拖拽/缩放/悬浮按钮拖拽全部改为 Pointer Events + `setPointerCapture`，指针捕获后所有鼠标事件只派发给面板，页面完全收不到；面板内新增滚轮拦截（滚动到边界/无可滚动区域时阻止穿透），聊天区/历史列表/思考框加 `overscroll-behavior: contain` 双保险；顺带支持触摸拖动。注意：header 拖拽需位移超过 4px 才接管，避免误捕获导致导出/语言菜单点击失效（回归测试覆盖）

## [1.16.3] - 2026-08-02

### 修复

- **API Key 改为仅本地保存，不再云端同步**：此前 API Key 存储在 `chrome.storage.sync`，会跟随 Chrome 登录的 Google 账号同步到云端。现已改为 `chrome.storage.local` 仅保存在本机；其余非敏感设置（模型、参数、快速操作、语言等）仍保持跨设备同步不受影响。旧版本已保存的 Key 会自动迁移到本地并从云端清除，无需重新填写；“重置所有设置”也会一并清除本地 Key；新增迁移回归测试

## [1.16.2] - 2026-08-02

### 修复

- **点击全屏按钮后面板被误关闭**：全屏/暗色等按钮的 click handler 会替换按钮内 SVG，导致事件冒泡时 `e.target` 已脱离 DOM，`panel.contains()` 误判为点击面板外部而关闭面板（随后再点悬浮球会以全屏状态打开，操作错乱）。`handleClickOutside` 改用 `e.composedPath()` 判断命中，覆盖所有“点击时替换 innerHTML”的按钮；新增 3 个回归测试（全屏点击不关闭 / 全屏中暗色切换不关闭 / 外部点击仍可正常关闭），全屏 E2E 改为真实坐标点击
- **悬浮按钮在面板打开时未隐藏**：上一版为防变形添加的内联 `display:flex` 压过了 `__dp-hidden` 的 `display:none`，导致面板打开时悬浮按钮仍显示。已从内联样式中移除 `display` 改由 CSS 控制，并给 `__dp-hidden` 加 `!important` 保险

## [1.16.1] - 2026-08-02

### 修复

- **悬浮按钮在部分页面变形**：某些站点（如 Microsoft Partner Center 等 Fluent UI 体系）的全局 CSS 会覆盖按钮尺寸/圆角，导致按钮被拉成扁椭圆。已为按钮关键属性（尺寸、内边距、圆角、边框等）全部加 `!important` 防御，并新增按钮内图标尺寸保护；同时用 JS 内联样式兜底（双保险），`transition` 从 `all` 收窄为仅 transform/box-shadow，避免被覆盖时的拉伸动画
- **测试稳定性**：修复 `provider-badge` 用例的异步竞态（等待 storage 回调更新按钮 title 后再断言），消除 CI 偶发失败

## [1.16.0] - 2026-08-02

### 新增

- 全屏模式：面板 header 新增全屏按钮（⛶），点击后面板铺满视口（四边留 24px 边距），聊天区大幅扩展，适合深入长对话；再次点击按钮或按 Esc 退出并恢复原尺寸/位置；全屏期间禁用拖拽/缩放；i18n 同步 10 种语言

## [1.15.0] - 2026-08-02

### 新增

- 导出 Word 文档：导出菜单新增「下载 Word 文档」，对话生成标准 .docx（基于 docx.js，打包 404KB 进 `lib/`），含页面标题、URL 与导出时间；消息区分 🧑 User / 🤖 Assistant 角色，代码块保留等宽字体 + 浅灰底纹；Word / WPS 可直接打开、打印。文件名格式与 PDF 一致（`<页面标题>_deeppage.docx`），i18n 同步 10 种语言

## [1.14.4] - 2026-08-02

### 重构

- **目录结构按职责规整**：拆分 `background/`（Service Worker）、`content/`（内容脚本 + 面板样式）、`options/`（设置页）、`lib/`（第三方库）、`js/`（共享模块）；manifest 引用、options 页脚本、SPA 补丁注入路径全部同步更新
- **多语言数据标准化**：119 个翻译 key × 10 语言从 JS 常量对象迁移为标准 Chrome messages.json 格式（`i18n-data/<语言>.json`）；`js/i18n.js` 重写为按当前语言异步加载 + 缓存，运行时切换语言（options / 侧边栏菜单）体验不变；`scripts/check-i18n.mjs` 升级校验（语言文件完整性 / key 集合一致 / 无空值 / 占位符一致 / 代码引用），新增 `scripts/migrate-i18n.mjs` 迁移脚本
- **manifest 国际化**：扩展名称与描述改用 `__MSG_*` 标准占位符，`_locales/zh_CN` 作为 `default_locale`（Chrome 商店/扩展管理页按浏览器语言显示本地化描述）
- 修复迁移脚本语言错位（zh_TW / en / ja 翻译互换），已按旧版 `LANG_CODES` 顺序重新生成并校验

## [1.14.3] - 2026-08-02

### 文档

- README 中英文新增「贡献」章节（对齐思路 / 不造轮子 / 测试覆盖 / 发版必更日志 / i18n），指向完整开发指南
- 发版流程从开发指南拆出：新增 `docs/RELEASING.md`（仅维护者），记录版本号规则、发布步骤、双语 Release notes 规范及三处版本号同步注意事项；DEVELOPMENT.md 只保留面向贡献者的内容

## [1.14.2] - 2026-08-01

### 文档

- README 章节重排：快速开始（安装 / 配置 API Key / 开始使用）移到简介之后、功能列表之前，新用户无需翻过长列表即可上手；英文版同步

## [1.14.1] - 2026-08-01

### 修复

- 多提供商 API 请求被 CORS 拦截：`manifest.json` 的 `host_permissions` 仅声明了 `api.deepseek.com`，其余 11 个内置提供商域名（OpenAI / Anthropic / Moonshot / 智谱 / Qwen / 豆包 / 零一 / 硅基流动 / Groq / Together / Ollama localhost）依赖服务端 CORS 放行，部分服务（如 Anthropic 预检无 allow-origin）会请求失败；现已补齐全部提供商域名，内置提供商请求不再受浏览器跨域限制

### 文档

- README 中英文 + 开发者指南同步：测试用例数 23 → 38（补齐 provider-badge / rename / title-gen / context-limit / history-search-keys 等新 spec，修正 panel-ui 5→8、options 4→5）；项目结构补 `provider-icons.js` 与 `vendor/`（html2pdf.js）；隐私说明改为「你所选的 AI 提供商」；移除代码中不存在的 `deepseek-v4-pro` 模型措辞

## [1.14.0] - 2026-08-01

### 新增

- 导出 PDF：导出菜单新增「下载 PDF」，对话以气泡截图式渲染成 A4 PDF（基于 html2pdf.js = html2canvas + jsPDF，中文渲染零成本），文件名含页面标题；适合打印、存档、正式分享

## [1.13.0] - 2026-08-01

### 新增

- 对话重命名：历史列表每项新增 ✏️ 重命名按钮，点击内联编辑标题（回车/失焦保存，Esc 取消）；空标题自动回退原标题；手动命名后标题锁定，AI 标题生成与自动截断均不再覆盖

### 工程

- 新增重命名专项测试（rename）：内联编辑保存 / 空标题回退 / Esc 取消 / 手动命名后 AI 不覆盖

## [1.12.0] - 2026-08-01

### 新增

- AI 生成对话标题：首轮 AI 回复后自动为对话生成标题（10 种语言提示词，跟随界面语言；生成失败静默降级为 50 字截断标题）
  - 🐛 修复：AI 标题生成后，后续保存对话会再次用消息截断标题覆盖（新增 titleGenerated 标记，仅未生成时自动截断）

### 工程

- 新增标题生成专项测试（title-gen）：标题替换 / 仅首轮触发 / 失败静默降级；mock server 响应格式改为以请求体 stream 字段为准，新增 failNonStream 开关

## [1.11.0] - 2026-08-01

### 新增

- 注入状态指示：网页右下角悬浮按钮的图标随当前配置的 AI 提供商切换（DeepSeek / Moonshot / 智谱 / Qwen / 豆包 / 零一 / 硅基流动 / OpenAI / Groq / Ollama / Together / Anthropic），悬停显示完整「提供商 · 模型」；在选项页切换提供商后图标实时刷新

## [1.10.2] - 2026-08-01

### 改进

- Custom System Prompt 输入框 placeholder 多语言化：此前硬编码英文提示，现按界面语言显示对应提示（10 种语言）

## [1.10.1] - 2026-08-01

### 改进

- 语言选择器紧凑化：工具栏从完整语言名下拉框改为简码按钮（简/繁/EN/JP/KR 等），点击展开下拉菜单选择，节省工具栏空间

## [1.10.0] - 2026-08-01

### 新增

- 页面内容截断长度可配置：选项页请求参数区新增「页面内容截断」滑杆（2000-50000 字符，默认 15000），控制发送给 AI 的页面正文最大长度；对话轮数限制（maxRounds）此前已可配置，现在页面正文长度也不再一刀切

### 工程

- 新增回归测试：`maxContextLen` 配置影响 system prompt 截断长度（context-limit）

## [1.9.4] - 2026-08-01

### 文档

- TODO.md 精简：完成项归档为版本摘要（历史细节见 CHANGELOG），文件回到待办清单定位
- README 中英文同步：功能列表补充历史对话搜索

## [1.9.3] - 2026-08-01

### 修复

- 历史搜索框两个问题：1) 输入时键盘事件冒泡到主页面（页面全局快捷键会收到按键），已阻断 keydown/keypress/keyup 冒泡；2) 每次输入全量重渲染导致搜索框重建、焦点丢失、后续按键丢失（只输入进第一个字符），改为只重渲染结果区，保持搜索框与焦点

### 工程

- 新增回归测试：搜索框按键不传导到主页面 + 键入内容完整（`history-search-keys`）

## [1.9.2] - 2026-08-01

### 工程

- 接入 ESLint + Prettier：新增 flat config（content script / ES module / Node 三分区）与格式规范，全量格式化统一代码风格；`npm run lint` / `npm run format` 一键执行，CI 发布门槛加入 lint（lint + 测试全过才发版）
- 版本号统一：新增 `scripts/bump-version.mjs`，一条命令同步更新 manifest.json 与 package.json 的版本号；CI 版本校验升级为 tag / manifest / package.json 三方一致

## [1.9.1] - 2026-08-01

### 工程

- CI 发布流程改进：release 前新增 test job（安装依赖 + Playwright 浏览器 + i18n 校验 + 24 个 E2E 用例 + manifest 版本与 tag 一致性校验），测试全部通过才允许创建 Release

## [1.9.0] - 2026-08-01

### 新增

- 历史对话搜索：历史面板头部新增搜索框，按关键词实时过滤对话（匹配对话标题或任一消息内容，大小写不敏感），清空即恢复完整列表，无匹配时显示提示

## [1.8.13] - 2026-08-01

### 重构

- 导出菜单全局点击监听从模块顶层移入面板创建流程：面板元素被移除时监听器不再空转，菜单逻辑分支简化

### 文档

- 新增开发者指南 `docs/DEVELOPMENT.md`：如何添加 API 提供商、运行/编写 E2E 测试、i18n 维护、发版流程与贡献规范；README 已链接

## [1.8.12] - 2026-08-01

### 文档

- README 中英文同步更新：补充流式输出开关、流式渲染优化、纯文本导出剥离语法说明；新增测试框架章节（`npm test`）；项目结构补齐 `tests/`、`scripts/`、`spa-patch.js`、`content.css`；添加语言指南补充 i18n 校验步骤

## [1.8.11] - 2026-08-01

### 修复

- `testApiRequired` 翻译错误：es/fr/de/ru/vi 5 种语言为空值且数组顺序错乱（语言错位），已按语言顺序补齐全部 10 种翻译

### 工程

- 新增 i18n 校验脚本 `scripts/check-i18n.mjs`：检查全部翻译 key 的 10 语言数组长度 / 顺序 / 空值 / 代码引用完整性，`npm test` 前自动执行，防止翻译缺失导致页面空白

## [1.8.10] - 2026-08-01

### 性能

- 流式 Markdown 渲染节流：此前每个 chunk 都全量重新渲染整条消息（长文本回复可触发上万次 DOM 写入导致卡顿），现改为 rAF 帧合并（每帧最多渲染一次）+ 长文本降频（>3000 字符时放宽渲染间隔），流式结束后强制刷新保证内容完整。实测 1 万字长回复 DOM 写入从 ~1 万次降到 25 次

### 工程

- 新增回归测试：面板开关不重复创建 DOM（`panel-lifecycle`）、长文本流式渲染节流且内容完整（`streaming-perf`），`npm test` 现共 23 个用例

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
