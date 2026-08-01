// ESLint flat config — DeepPage
// 环境分区：
//   js/      → content script 全局脚本（browser globals + chrome/marked + 项目内部全局）
//   tests/ scripts/ → Node ESM
import eslintJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

// content script 是普通全局脚本，6 个文件共享同一全局作用域（window），
// 文件间通过顶层函数/变量互调 —— 这里列出全部项目内部全局声明，
// 供 no-undef 识别（新增全局函数时需同步补充）
const contentScriptGlobals = {
  // Chrome API
  chrome: 'readonly',
  // 第三方
  marked: 'readonly',
  // ---- js/utils.js ----
  generateId: 'readonly',
  formatRelativeTime: 'readonly',
  escapeHtml: 'readonly',
  markdownToHtml: 'readonly',
  markdownToPlainText: 'readonly',
  extractPageContent: 'readonly',
  scrollChat: 'readonly',
  // ---- js/i18n.js ----
  LANG_CODES: 'readonly',
  TRANSLATIONS: 'readonly',
  LANGUAGES: 'readonly',
  t: 'readonly',
  loadLanguage: 'readonly',
  getCurrentLang: 'readonly',
  setStoredLanguage: 'readonly',
  detectLanguage: 'readonly',
  // ---- js/chat.js ----
  currentMessages: 'writable',
  currentConvId: 'writable',
  _sending: 'writable',
  chatHistory: 'writable',
  pageContext: 'writable',
  loadConversations: 'readonly',
  saveConversations: 'readonly',
  newConversation: 'readonly',
  clearContext: 'readonly',
  loadActiveConversation: 'readonly',
  showHistory: 'readonly',
  showChat: 'readonly',
  addMsg: 'readonly',
  attachDelBtn: 'readonly',
  showLoading: 'readonly',
  updateContext: 'readonly',
  showLoginNotice: 'readonly',
  sendMessage: 'readonly',
  formatExportMarkdown: 'readonly',
  formatExportText: 'readonly',
  exportConversation: 'readonly',
  // ---- js/sidebar.js ----
  panelOpen: 'writable',
  chatPanel: 'writable',
  _selBtn: 'writable',
  _exportMenuOpen: 'writable',
  _suppressClose: 'writable',
  quickActions: 'writable',
  initDefaultActions: 'readonly',
  loadQuickActionsFromStorage: 'readonly',
  createChatPanel: 'readonly',
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
};

export default [
  { ignores: ['js/marked.umd.min.js', 'test-results/**', 'dist/**', 'node_modules/**'] },
  eslintJs.configs.recommended,
  eslintConfigPrettier,
  {
    // ES module 文件：background.js（SW module）、options.js（options.html type=module）、providers.js（被 import）
    files: ['js/background.js', 'js/options.js', 'js/providers.js'],
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
    files: ['js/*.js'],
    ignores: ['js/background.js', 'js/options.js', 'js/providers.js'],
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
