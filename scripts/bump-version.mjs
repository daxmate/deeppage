// ==============================================
// DeepPage — 版本号统一更新脚本
// 用法：node scripts/bump-version.mjs <新版本号>
// 例：  node scripts/bump-version.mjs 1.9.2
// 功能：同步更新 manifest.json 与 package.json 的 version 字段
// 版本规则：加新功能 → 第二位 +1（1.8.x → 1.9.0）；仅重构/修复 → 第三位 +1（1.8.13 → 1.8.14）
// ==============================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const version = process.argv[2];
if (!version) {
  console.error("❌ 用法：node scripts/bump-version.mjs <新版本号>");
  console.error("   例：node scripts/bump-version.mjs 1.9.2");
  process.exit(1);
}
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`❌ 版本号格式错误："${version}"，应为 x.y.z（如 1.9.2）`);
  process.exit(1);
}

// ---- manifest.json ----
const manifestPath = path.join(ROOT, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const oldManifest = manifest.version;
manifest.version = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4) + "\n");

// ---- package.json ----
const pkgPath = path.join(ROOT, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const oldPkg = pkg.version;
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log(`✅ 版本已更新：${oldManifest} → ${version}`);
console.log(`   manifest.json  (${oldManifest} → ${manifest.version})`);
console.log(`   package.json   (${oldPkg} → ${pkg.version})`);
