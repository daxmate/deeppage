// ==============================================
// DeepPage — i18n 迁移脚本(一次性)
// 将旧版 js/i18n.js 中的 TRANSLATIONS 对象迁移为
// 标准 Chrome i18n 目录:_locales/<lang>/messages.json
//
// 用法:node scripts/migrate-i18n.mjs
// 输出:_locales/{zh_CN,zh_TW,en,ja,ko,es,fr,de,ru,vi}/messages.json
// ==============================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// 源文件默认为 js/i18n.js,可通过参数指定(如从 git 恢复的旧版本)
const SRC = process.argv[2] || path.join(ROOT, "js", "i18n.js");

// ---- 提取源码中指定 const 对象/数组的字面量文本 ----
function extractObject(src, name) {
  const m = src.match(new RegExp(`const ${name} = ([{[])`));
  if (!m) throw new Error(`找不到 ${name} 定义`);
  const open = m[1];
  const close = open === "{" ? "}" : "]";
  const braceStart = src.indexOf(open, m.index);
  let depth = 0,
    inStr = false,
    strCh = "",
    inLineComment = false,
    inBlockComment = false;
  let end = -1;
  for (let i = braceStart; i < src.length; i++) {
    const c = src[i],
      n = src[i + 1];
    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && n === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inStr) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === "/" && n === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === "/" && n === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = true;
      strCh = c;
      continue;
    }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error(`提取 ${name} 失败`);
  const literal = src.slice(braceStart, end + 1);
  // 用 Function 求值(纯数据对象字面量,无副作用)
  return Function(`"use strict"; return (${literal});`)();
}

const src = fs.readFileSync(SRC, "utf8");
const TRANSLATIONS = extractObject(src, "TRANSLATIONS");
// 翻译数组的索引顺序是 LANG_CODES(可能与 LANGUAGES 显示顺序不同,历史上 zh_TW/en/ja 错位过)
const LANG_CODES = extractObject(src, "LANG_CODES");

const langCodes = LANG_CODES;
const keys = Object.keys(TRANSLATIONS);
console.log(`发现 ${keys.length} 个 key × ${langCodes.length} 种语言(顺序: ${langCodes.join(", ")})`);

// ---- 校验:数组长度与顺序 ----
let errors = 0;
for (const key of keys) {
  const arr = TRANSLATIONS[key];
  if (!Array.isArray(arr) || arr.length !== langCodes.length) {
    console.error(`✗ ${key}: 数组长度 ${arr ? arr.length : "?"} ≠ ${langCodes.length}`);
    errors++;
  }
  arr.forEach((v, i) => {
    if (v == null || String(v).trim() === "") {
      console.error(`✗ ${key}[${langCodes[i]}]: 空值`);
      errors++;
    }
  });
  // 占位符一致性检查($1/$2/...)
  const ph = (s) => [...new Set(String(s).match(/\$\d+/g) || [])].sort().join(",");
  const base = ph(arr[0]);
  arr.slice(1).forEach((v, i) => {
    if (ph(v) !== base) {
      console.error(
        `✗ ${key}: 占位符不一致 (${langCodes[0]}:${base} vs ${langCodes[i + 1]}:${ph(v)})`
      );
      errors++;
    }
  });
}

// ---- 生成 i18n-data/<lang>.json ----
// 注意:不能用 _locales/ 目录——Chrome 对 _locales 下的请求有虚拟化处理,
// 无论请求哪个语言都会返回当前 UI locale 的内容,无法按 URL 取指定语言。
const OUT = path.join(ROOT, "i18n-data");
fs.mkdirSync(OUT, { recursive: true });

for (const code of langCodes) {
  const idx = langCodes.indexOf(code);
  const messages = {};
  for (const key of keys) {
    messages[key] = { message: TRANSLATIONS[key][idx] };
  }
  // manifest name/description 国际化用的标准 key
  messages.extName = { message: TRANSLATIONS.appName[idx] };
  messages.extDesc = { message: TRANSLATIONS.appDesc[idx] };
  fs.writeFileSync(path.join(OUT, `${code}.json`), JSON.stringify(messages, null, 2) + "\n", "utf8");
}

// ---- 汇总 ----
if (errors > 0) {
  console.error(`\n✗ 校验失败:${errors} 处错误,未生成完整。`);
  process.exit(1);
}
console.log(
  `✓ 已生成 i18n-data/ 下 ${langCodes.length} 个语言文件,每个 ${keys.length + 2} 个 key(含 extName/extDesc)`
);
console.log(`  语言:${langCodes.join(", ")}`);
