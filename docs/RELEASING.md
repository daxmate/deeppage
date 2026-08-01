# DeepPage 发版指南（维护者专属）

本文仅面向**维护者**。外部贡献者提交 PR 即可，无需阅读本文。

## 版本号规则

- 加新功能 → 第二位 +1（`1.8.x` → `1.9.0`）
- 仅重构/修复/文档 → 第三位 +1（`1.8.13` → `1.8.14`）

## 发布前

```bash
npm test   # 全部 E2E 用例必须全绿（当前 38 个）
```

## 发布步骤

```bash
# 1. 统一更新版本号（⚠️ 三处必须同步，CI 会逐一校验）
npm run bump:version -- 1.9.2   # 会同时更新 manifest.json + package.json
# 2. 更新 CHANGELOG.md（Keep a Changelog 风格，中文章节）
git add -A && git commit -m "chore: bump version to 1.9.2"
git tag v1.9.2
git push origin main --tags
# 3. 等 GitHub Actions 自动跑测试 + 建 Release（测试不过不会发版）
# 4. 手动补写双语 Release notes
gh release edit v1.9.2 --notes-file /tmp/notes.md
```

> ⚠️ CI 会校验 tag 与 manifest 版本一致、manifest 与 package.json 一致，并跑全部 E2E 用例，全部通过才创建 Release。

### ⚠️ 三处版本号必须同步（血泪教训）

CI 的「Verify manifest version matches tag」步骤会检查 `tag == manifest.version == package.json.version`，**只改 manifest 忘记改 package.json 会导致 workflow 失败**（v1.14.1 翻车记录）。

`npm run bump:version -- X.Y.Z` 会一次改两个文件；如果手动改，务必两个文件都改。

### 同一 tag 重推不触发 workflow

workflow 只在 tag 被**新建**时触发。若发布失败需要重推，必须：

```bash
git push origin :refs/tags/vX.Y.Z   # 删远程 tag
git tag -d vX.Y.Z                    # 删本地 tag
git tag vX.Y.Z                       # 重建
git push origin vX.Y.Z               # 重推
```

## Release notes 规范

- 中英双语（中文在前，英文在后）
- emoji 分节：✨ 新功能 / 🐛 修复 / 🔧 重构 / ⚙️ 其他
- 每条加粗标题 + 详细说明
- 结尾附 `**Full Changelog**: https://github.com/daxmate/deeppage/compare/vX.X.X...vX.X.X`
- 参考历史版本：`gh release view v1.14.2 --json body -q .body`
