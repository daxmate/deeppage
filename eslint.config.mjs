// ESLint flat config — DeepPage
// 环境分区：
//   js/ content/ → content script 全局脚本（browser globals + chrome/marked + 项目内部全局）
//   tests/ scripts/ → Node ESM
//   background/ options/ providers → ES module
import eslintJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

// content script 是普通全局脚本，多个文件共享同一全局作用域（window），
// 文件间通过顶层函数/变量互调 —— 这里列出全部项目内部全局声明，
// 供 no-undef 识别（新增全局函数时需同步补充）
const contentScriptGlobals = {
  // Chrome API
  chrome: 'readonly',
  // 第三方
  marked: 'readonly',
  html2pdf: 'readonly',
  docx: 'readonly',
  Sweetalert2: 'readonly',
  // ---- js/toast.js ----
  Toast: 'readonly',
  showToast: 'readonly',
  toastSuccess: 'readonly',
  toastError: 'readonly',
  toastInfo: 'readonly',
  // ---- js/utils.js ----
  generateId: 'readonly',
  formatRelativeTime: 'readonly',
  escapeHtml: 'readonly',
  markdownToHtml: 'readonly',
  markdownToPlainText: 'readonly',
  extractPageContent: 'readonly',
  setMaxContextLen: 'readonly',
  scrollChat: 'readonly',
  // ---- js/i18n.js ----
  LANG_CODES: 'readonly',
  LANGUAGES: 'readonly',
  t: 'readonly',
  loadLanguage: 'readonly',
  getCurrentLang: 'readonly',
  setLanguage: 'readonly',
  getStoredLanguage: 'readonly',
  setStoredLanguage: 'readonly',
  detectLanguage: 'readonly',
  // ---- content/chat/* (state → history → render → send → export) ----
  currentMessages: 'writable',
  currentConvId: 'writable',
  _sending: 'writable',
  chatHistory: 'writable',
  pageContext: 'writable',
  _suppressClose: 'writable',
  // state.js
  loadConversations: 'readonly',
  saveConversations: 'readonly',
  getOrCreateConv: 'readonly',
  trimConversation: 'readonly',
  clearContext: 'readonly',
  saveCurrentMessages: 'readonly',
  switchConversation: 'readonly',
  // history.js
  startRename: 'readonly',
  commitRename: 'readonly',
  deleteConversation: 'readonly',
  newConversation: 'readonly',
  loadActiveConversation: 'readonly',
  showHistory: 'readonly',
  showChat: 'readonly',
  renderHistoryList: 'readonly',
  renderHistoryResults: 'readonly',
  bindHistoryListEvents: 'readonly',
  // render.js
  addMsg: 'readonly',
  attachDelBtn: 'readonly',
  deleteMessage: 'readonly',
  showLoading: 'readonly',
  updateContext: 'readonly',
  showLoginNotice: 'readonly',
  // send.js
  sendMessage: 'readonly',
  generateTitleAsync: 'readonly',
  // export.js
  formatExportMarkdown: 'readonly',
  formatExportText: 'readonly',
  exportPdf: 'readonly',
  exportWord: 'readonly',
  exportConversation: 'readonly',
  // ---- content/sidebar.js ----
  panelOpen: 'writable',
  chatPanel: 'writable',
  _selBtn: 'writable',
  _exportMenuOpen: 'writable',
  quickActions: 'writable',
  initDefaultActions: 'readonly',
  loadQuickActionsFromStorage: 'readonly',
  createChatPanel: 'readonly',
  updateHeaderButtons: 'readonly',
  enableDrag: 'readonly',
  enableResize: 'readonly',
  togglePanel: 'readonly',
  showSelBtn: 'readonly',
  hideSelBtn: 'readonly',
  createSelBtn: 'readonly',
  removeSelBtn: 'readonly',
  watchSpaNavigation: 'readonly',
  createButton: 'readonly',
  onSelAsk: 'readonly',
  // ---- js/provider-icons.js ----
  PROVIDER_ICONS: 'readonly',
  PROVIDER_LABELS: 'readonly',
  PROVIDER_ICON_FALLBACK: 'readonly',
};

export default [
  {
    ignores: [
      'lib/marked.umd.min.js',
      'lib/html2pdf.bundle.min.js',
      'lib/sweetalert2.all.min.js',
      'test-results/**',
      'dist/**',
      'node_modules/**',
    ],
  },
  eslintJs.configs.recommended,
  eslintConfigPrettier,
  {
    // ES module 文件：background.js（SW module）、options.js（options.html type=module）、providers.js（被 import）
    files: ['background/background.js', 'options/options.js', 'js/providers.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        TextDecoder: 'readonly',
        fetch: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        confirm: 'readonly',
        chrome: 'readonly',
        // 被 i18n.js/utils.js（全局脚本）提供，module 文件通过全局引用
        ...contentScriptGlobals,
      },
    },
    rules: {
      'no-redeclare': 'off',
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-var': 'warn',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
      // 模板字符串内的转义（如 SVG path 的 \"）无害且常见，不阻塞
      'no-useless-escape': 'warn',
      // 空 catch 块是刻意忽略错误（如 JSON.parse 失败回退），允许
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['js/*.js', 'content/*.js', 'content/chat/*.js'],
    ignores: ['background/background.js', 'options/options.js', 'js/providers.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        TextDecoder: 'readonly',
        MutationObserver: 'readonly',
        CustomEvent: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        getSelection: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        Event: 'readonly',
        // 项目内部全局（content script 共享作用域）
        ...contentScriptGlobals,
      },
    },
    rules: {
      // content script 是全局脚本：顶层声明即全局，且与 globals 白名单重叠是预期行为
      'no-redeclare': 'off',
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-var': 'warn',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
      // 模板字符串内的转义（如 SVG path 的 \"）无害且常见，不阻塞
      'no-useless-escape': 'warn',
      // 空 catch 块是刻意忽略错误（如 JSON.parse 失败回退），允许
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // tests/mock-server.js 是 CommonJS（require/module.exports）
    files: ['tests/mock-server.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'eqeqeq': ['warn', 'smart'],
    },
  },
  {
    files: ['tests/*.mjs', 'scripts/*.mjs', 'playwright.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        TextDecoder: 'readonly',
        // page.evaluate 内是浏览器上下文（隔离世界），需要 browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        MouseEvent: 'readonly',
        CustomEvent: 'readonly',
        MutationObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        getSelection: 'readonly',
        getComputedStyle: 'readonly',
        Event: 'readonly',
        confirm: 'readonly',
        chrome: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-var': 'warn',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
      'no-empty-pattern': 'off',
    },
  },
];
