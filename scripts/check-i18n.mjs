// ==============================================
// DeepPage — 多语言 key 校验脚本
// 检查标准 Chrome messages.json 格式目录 i18n-data/：
//   1) 10 个语言目录存在且 messages.json 为合法 JSON
//   2) 各语言 key 集合一致（以 zh_CN 为基准，防止漏译）
//   3) 无空值（防止页面空白）
//   4) 占位符 $N 在各语言中一致（防止参数错位）
//   5) 代码中 t('key') 引用的 key 都存在（防止翻译缺失）
//   6) manifest 的 __MSG_extName__/__MSG_extDesc__ 存在
// 用法：node scripts/check-i18n.mjs  或  npm run check:i18n
// ==============================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOCALES_DIR = path.join(ROOT, "i18n-data");

// 期望的语言文件（与 js/i18n.js LANGUAGES 一一对应）
const EXPECTED_LOCALES = ["zh_CN", "zh_TW", "en", "ja", "ko", "es", "fr", "de", "ru", "vi"];

let errors = 0;
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  errors++;
};

// ---- 1) 语言目录 + JSON 合法性 ----
const loaded = {};
for (const code of EXPECTED_LOCALES) {
  const file = path.join(LOCALES_DIR, `${code}.json`);
  if (!fs.existsSync(file)) {
    fail(`缺少 i18n-data/${code}.json`);
    continue;
  }
  try {
    loaded[code] = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    fail(`i18n-data/${code}.json 不是合法 JSON: ${e.message}`);
  }
}
if (Object.keys(loaded).length === 0) {
  console.error("✗ i18n-data/ 无任何可用翻译文件");
  process.exit(1);
}

// ---- 2) key 集合一致性（以 zh_CN 为基准） ----
const base = loaded.zh_CN;
const baseKeys = Object.keys(base);
for (const code of Object.keys(loaded)) {
  const keys = Object.keys(loaded[code]);
  const missing = baseKeys.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !baseKeys.includes(k));
  if (missing.length) fail(`${code} 缺少 key: ${missing.join(", ")}`);
  if (extra.length) fail(`${code} 多出 key: ${extra.join(", ")}`);
}

// ---- 3) 空值 + 4) 占位符一致性 ----
const placeholders = (s) => [...new Set(String(s).match(/\$\d+/g) || [])].sort().join(",");
for (const key of baseKeys) {
  let phBase = null;
  for (const code of Object.keys(loaded)) {
    const entry = loaded[code][key];
    const msg = entry && typeof entry === "object" ? entry.message : entry;
    if (msg == null || String(msg).trim() === "") {
      fail(`${key} [${code}] 为空值`);
      continue;
    }
    const ph = placeholders(msg);
    if (phBase === null) phBase = ph;
    else if (ph !== phBase) fail(`${key}: 占位符不一致 (${phBase} vs ${ph} @${code})`);
  }
}

// ---- 5) 代码中 t('key') 引用检查 ----
const srcDirs = ["js", "content", "background", "options"];
const tRefs = new Set();
for (const dir of srcDirs) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    if (!f.endsWith(".js")) continue;
    const src = fs.readFileSync(path.join(abs, f), "utf8");
    // 匹配 t('key') / t("key")
    for (const m of src.matchAll(/\bt\(\s*['"]([A-Za-z0-9_@]+)['"]/g)) {
      tRefs.add(m[1]);
    }
  }
}
for (const key of tRefs) {
  if (!(key in base)) fail(`代码引用了不存在的 key: ${key}`);
}

// ---- 6) manifest __MSG_* 引用检查 ----
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
for (const v of Object.values(manifest)) {
  if (typeof v !== "string") continue;
  const m = v.match(/^__MSG_([A-Za-z0-9_@]+)__$/);
  if (m && !(m[1] in base)) fail(`manifest 引用了不存在的 key: __MSG_${m[1]}__`);
}

// ---- 7) _locales/zh_CN/messages.json（default_locale 兜底）完整性检查 ----
// 运行时 t() 在 i18n-data 加载失败时会兜底 chrome.i18n（读取 _locales/），
// 若 _locales 缺 key 会显示原始 key 文本（如 "exportWord"）。
// 因此 _locales/zh_CN/messages.json 必须包含 i18n-data/zh_CN.json 的全部 key。
const FALLBACK_LOCALES = path.join(ROOT, "_locales", "zh_CN", "messages.json");
if (fs.existsSync(FALLBACK_LOCALES)) {
  let fallback;
  try {
    fallback = JSON.parse(fs.readFileSync(FALLBACK_LOCALES, "utf8"));
  } catch (e) {
    fail(`_locales/zh_CN/messages.json 不是合法 JSON: ${e.message}`);
    fallback = {};
  }
  const fbKeys = Object.keys(fallback);
  const missingInFallback = baseKeys.filter((k) => !fbKeys.includes(k));
  if (missingInFallback.length) {
    fail(
      `_locales/zh_CN/messages.json 缺少 ${missingInFallback.length} 个 key: ${missingInFallback.join(", ")}`
    );
  }
  const extraInFallback = fbKeys.filter((k) => !baseKeys.includes(k));
  if (extraInFallback.length) {
    fail(`_locales/zh_CN/messages.json 多出 key: ${extraInFallback.join(", ")}`);
  }
} else {
  fail("_locales/zh_CN/messages.json 不存在（default_locale 兜底缺失）");
}

// ---- 汇总 ----
if (errors > 0) {
  console.error(`\n✗ i18n 校验失败：${errors} 处错误`);
  process.exit(1);
}
console.log(
  `✓ i18n 校验通过：${Object.keys(loaded).length} 种语言 × ${baseKeys.length} 个 key，代码引用 ${tRefs.size} 个 key 全部存在`
);
