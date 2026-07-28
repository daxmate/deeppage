// ==============================================
// DeepPage — 多语言支持
// ==============================================

// 翻译数据（从 messages.json 生成）
const TRANSLATIONS = {
  zh_CN: {
    appName: 'DeepPage',
    appDesc: '在浏览网页时与 DeepSeek 对话——总结全文、提炼要点、自由问答',
    panelTitle: 'DeepPage',
    inputPlaceholder: '输入问题...',
    contextLoaded: '📄 已加载「$title$」作为对话背景',
    loginNoticeTitle: '需要配置 DeepSeek API Key',
    loginNoticeStep1: '· 点击扩展图标 → 选项 → 输入 API Key',
    loginNoticeStep2: '· 或去 platform.deepseek.com 获取',
    errorNoApiKey: '❌ 未配置 API Key，请在扩展设置中配置',
    optionTitle: 'DeepPage 设置',
    optionDesc: '使用 DeepSeek 官方 API 与浏览的网页对话',
    apiKeyLabel: 'DeepSeek API Key',
    apiKeyPlaceholder: 'sk-...',
    getApiKeyLink: '从 platform.deepseek.com 获取',
    quickActionsSection: '快捷操作按钮',
    addButton: '＋ 添加按钮',
    saveButton: '保存',
    savedSuccess: '✅ 已保存',
    apiKeyRequired: '请输入 API Key',
    buttonLabel: '按钮文字',
    promptLabel: '提示词',
    buttonLabelPlaceholder: '如 📝 总结全文',
    promptPlaceholder: '点击按钮时自动输入的提示词',
    deleteButton: '删除',
    defaultSummarizeLabel: '📝 总结全文',
    defaultSummarizePrompt: '请用中文总结这篇网页正文部分的核心内容',
    defaultOutlineLabel: '🎯 提炼要点',
    defaultOutlinePrompt: '请提炼这篇网页正文部分的要点，以列表形式列出',
    defaultTranslateLabel: '🌐 翻译',
    defaultTranslatePrompt: '请将这篇网页的正文部分翻译成中文',
    newButtonLabel: '新按钮',
    languageLabel: '语言',
  },
  en: {
    appName: 'DeepPage',
    appDesc: 'Chat with DeepSeek while browsing — summarize, outline, translate, and ask questions',
    panelTitle: 'DeepPage',
    inputPlaceholder: 'Ask anything...',
    contextLoaded: '📄 Loaded "$title$" as conversation context',
    loginNoticeTitle: 'DeepSeek API Key Required',
    loginNoticeStep1: '· Click extension icon → Options → Enter API Key',
    loginNoticeStep2: '· Or get one at platform.deepseek.com',
    errorNoApiKey: '❌ API Key not configured. Please set it in the extension options.',
    optionTitle: 'DeepPage Settings',
    optionDesc: 'Chat with DeepSeek using the official API while browsing the web',
    apiKeyLabel: 'DeepSeek API Key',
    apiKeyPlaceholder: 'sk-...',
    getApiKeyLink: 'Get one at platform.deepseek.com',
    quickActionsSection: 'Quick Action Buttons',
    addButton: '＋ Add Button',
    saveButton: 'Save',
    savedSuccess: '✅ Saved',
    apiKeyRequired: 'Please enter an API Key',
    buttonLabel: 'Button Label',
    promptLabel: 'Prompt',
    buttonLabelPlaceholder: 'e.g. 📝 Summarize',
    promptPlaceholder: 'Prompt text sent when button is clicked',
    deleteButton: 'Delete',
    defaultSummarizeLabel: '📝 Summarize',
    defaultSummarizePrompt: 'Please summarize the core content of this web page in English',
    defaultOutlineLabel: '🎯 Key Points',
    defaultOutlinePrompt: 'Please extract the key points from this web page and list them',
    defaultTranslateLabel: '🌐 Translate',
    defaultTranslatePrompt: 'Please translate the main content of this web page to English',
    newButtonLabel: 'New Button',
    languageLabel: 'Language',
  },
};

// 支持的语言列表
const LANGUAGES = [
  { code: 'zh_CN', label: '中文' },
  { code: 'en', label: 'English' },
];

// 获取当前语言代码
function detectLanguage() {
  const nav = (navigator.language || '').replace('-', '_');
  if (nav.startsWith('zh')) return 'zh_CN';
  return 'en';
}

// ---- 语言存储读写 ----
function getStoredLanguage(callback) {
  chrome.storage.sync.get('language', (result) => {
    callback(result.language || null);
  });
}

function setStoredLanguage(code, callback) {
  chrome.storage.sync.set({ language: code }, callback);
}

// ---- 核心 t() 函数 ----
// 同步模式（用于 options.js 中 JS 模板）
function t(key) {
  // 尝试从全局语言变量获取
  const lang = window.__dp_lang || detectLanguage();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || key;
}

// 异步模式（用于 content.js，需要先加载语言）
function loadLanguage(callback) {
  getStoredLanguage((stored) => {
    window.__dp_lang = stored || detectLanguage();
    if (callback) callback(window.__dp_lang);
  });
}

// 服务函数：获取当前语言（用于下拉框选中）
function getCurrentLang() {
  return window.__dp_lang || detectLanguage();
}
