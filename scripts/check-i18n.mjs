// ==============================================
// DeepPage — 多语言 key 校验脚本
// 检查：1) 所有翻译 key 的 10 语言数组长度一致
//       2) 数组顺序与 LANG_CODES 一致（防止语言错位）
//       3) 无空值（防止页面空白）
//       4) 代码中 t('key') 引用的 key 都存在（防止翻译缺失）
// 用法：node scripts/check-i18n.mjs  或  npm run check:i18n
// ==============================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// 提取 LANG_CODES 数组
function extractLangCodes(src) {
  const m = src.match(/const LANG_CODES = \[([\s\S]*?)\];/);
  if (!m) throw new Error("找不到 LANG_CODES 定义");
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

// 提取 TRANSLATIONS 对象（用 vm 执行到对象定义处，避免手写正则解析字符串）
function extractTranslations(src) {
  const start = src.indexOf("const TRANSLATIONS = {");
  if (start === -1) throw new Error("找不到 TRANSLATIONS 定义");
  const braceStart = src.indexOf("{", start);
  // 括号配对（跳过字符串与注释）
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
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error("TRANSLATIONS 对象括号未闭合");
  const objSrc = src.slice(braceStart, end + 1);
  // 用 Function 求值（对象字面量纯数据，安全）
  const obj = new Function(`return ${objSrc}`)();
  return obj;
}

// 扫描代码里 t('key') 引用
function collectUsedKeys() {
  const used = new Set();
  for (const file of ["js/options.js", "js/chat.js", "js/sidebar.js", "js/utils.js"]) {
    const src = fs.readFileSync(path.join(ROOT, file), "utf8");
    // t('key') / t("key") 精确引用（排除 createElement('option') 等误报）
    for (const m of src.matchAll(/\bt\(\s*['"]([A-Za-z0-9_]+)['"]\s*\)/g)) {
      used.add(m[1]);
    }
  }
  return used;
}

// ---- 主流程 ----
const src = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8");
const langCodes = extractLangCodes(src);
const translations = extractTranslations(src);
const problems = [];

// 1) 数组长度 + 3) 空值 + 2) 顺序（隐式：按索引对应语言）
const expectedLen = langCodes.length;
for (const [key, arr] of Object.entries(translations)) {
  if (!Array.isArray(arr)) {
    problems.push(`❌ ${key}: 不是数组`);
    continue;
  }
  if (arr.length !== expectedLen) {
    problems.push(`❌ ${key}: 数组长度 ${arr.length} ≠ ${expectedLen}（${langCodes.join(",")}）`);
    continue;
  }
  arr.forEach((v, i) => {
    if (typeof v !== "string" || v.trim() === "") {
      problems.push(`❌ ${key}[${i}] (${langCodes[i]}): 空值`);
    }
  });
}

// 4) 代码引用完整性
const usedKeys = collectUsedKeys();
for (const key of usedKeys) {
  if (!(key in translations)) {
    problems.push(`❌ 代码引用了缺失的 i18n key: "${key}"`);
  }
}
// 反向：翻译里有但没人用的 key（提示性，不报错）
const unused = Object.keys(translations).filter((k) => !usedKeys.has(k));

// ---- 输出 ----
console.log(`✅ 语言数: ${langCodes.length} (${langCodes.join(", ")})`);
console.log(`✅ 翻译 key 总数: ${Object.keys(translations).length}`);
console.log(`✅ 代码引用 key: ${usedKeys.size} 个`);
if (unused.length)
  console.log(
    `ℹ️ 未被代码引用的 key（${unused.length} 个，仅提示）: ${unused.slice(0, 20).join(", ")}${unused.length > 20 ? "..." : ""}`
  );

if (problems.length) {
  console.log(`\n===== 校验失败（${problems.length} 个问题）=====`);
  problems.forEach((p) => console.log(p));
  process.exit(1);
}
console.log("\n===== i18n 校验通过 ✅ =====");
