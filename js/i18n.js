// ==============================================
// DeepPage — 多语言支持
// 数据源:i18n-data/<lang>.json(标准 Chrome messages.json 格式)
// 注意:不能放在 _locales/ 下——Chrome 对 _locales 的请求有虚拟化处理,
//       无论请求哪个语言目录都会返回当前 UI locale 的内容。
// 加载方式:按当前语言 fetch 对应 json 并缓存,
//           支持运行时切换语言(切换后重新加载数据)。
// 兜底:数据未加载或加载失败时,回退到 chrome.i18n 标准 API,
//       再不行返回 key 本身。
// ==============================================

// 语言定义(与 _locales/ 目录一一对应)
const LANGUAGES = [
  { code: "zh_CN", label: "中文", short: "简" },
  { code: "zh_TW", label: "繁體中文", short: "繁" },
  { code: "en", label: "English", short: "EN" },
  { code: "ja", label: "日本語", short: "JP" },
  { code: "ko", label: "한국어", short: "KR" },
  { code: "es", label: "Español", short: "ES" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "de", label: "Deutsch", short: "DE" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "vi", label: "Tiếng Việt", short: "VI" },
];

const LANG_CODES = LANGUAGES.map((l) => l.code);

// 获取当前语言代码
function detectLanguage() {
  const nav = (navigator.language || "").replace("-", "_");
  if (nav.startsWith("zh"))
    return nav.startsWith("zh_TW") || nav.startsWith("zh_HK") || nav.startsWith("zh_MO")
      ? "zh_TW"
      : "zh_CN";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("ko")) return "ko";
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("vi")) return "vi";
  return "en";
}

// ---- 语言存储读写 ----
function getStoredLanguage(callback) {
  chrome.storage.sync.get("language", (result) => {
    callback(result.language || null);
  });
}

function setStoredLanguage(code, callback) {
  chrome.storage.sync.set({ language: code }, callback);
}

// ---- 加载指定语言的翻译数据并缓存 ----
function fetchMessages(lang) {
  return fetch(chrome.runtime.getURL(`i18n-data/${lang}.json`))
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .catch((err) => {
      console.warn(`[DeepPage] 加载翻译失败 (i18n-data/${lang}.json):`, err);
      return null;
    });
}

function applyLanguage(lang, callback) {
  fetchMessages(lang).then((data) => {
    window.__dp_messages = data || null;
    if (callback) callback();
  });
}

// ---- 异步加载语言(入口用,保持旧签名兼容) ----
function loadLanguage(callback) {
  getStoredLanguage((stored) => {
    const lang = stored || detectLanguage();
    window.__dp_lang = lang;
    applyLanguage(lang, () => {
      if (callback) callback(lang);
    });
  });
}

// ---- 切换语言:设置存储 → 加载翻译 → 回调 ----
function setLanguage(code, callback) {
  window.__dp_lang = code;
  setStoredLanguage(code, () => {
    applyLanguage(code, callback);
  });
}

// ---- 获取当前语言 ----
function getCurrentLang() {
  return window.__dp_lang || detectLanguage();
}

// ---- 核心 t() 函数 ----
function t(key, ...args) {
  const data = window.__dp_messages;
  let text = data && data[key] ? data[key].message || data[key] : null;
  if (text == null) {
    // 兜底:chrome.i18n 标准 API(UI 语言),再不行返回 key
    text = (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getMessage(key)) || key;
  }
  if (!args.length) return text;
  args.forEach((arg, i) => {
    text = text.replace(new RegExp("\\$" + (i + 1), "g"), arg);
  });
  return text;
}
