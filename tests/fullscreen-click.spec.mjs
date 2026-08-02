// 回归测试：点击全屏按钮时 handleClickOutside 误判关闭面板（修复 2026-08-02）
// 背景：全屏/暗色按钮的 click handler 会替换 innerHTML，旧 svg 脱离 DOM，
// panel.contains(e.target) 失效 → 误判点击面板外部 → togglePanel 关闭面板。
// 修复：handleClickOutside 改用 e.composedPath() 判断命中。
import { test, expect } from "./fixtures.mjs";

const TEST_PAGE = `http://127.0.0.1:${process.env.MOCK_PORT}/`;

test.describe("全屏按钮点击回归", () => {
  test.beforeEach(async ({ page, setupMockApi, mock }) => {
    await setupMockApi();
    await mock.config({
      stream: true,
      responseContent: "ok",
      failNext: false,
    });
    await page.goto(TEST_PAGE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#__dp-btn", { timeout: 15000 });
    await page.click("#__dp-btn"); // 打开面板
    await page.waitForSelector("#__dp-panel.__dp-open");
    await expect(page.locator("#__dp-input")).toBeEnabled({ timeout: 15000 });
  });

  test("真实坐标点击全屏按钮：面板保持打开并进入全屏", async ({ page }) => {
    const panel = page.locator("#__dp-panel");
    const fsBtn = page.locator("#__dp-fullscreen-btn");
    await expect(fsBtn).toBeVisible();

    // 面板打开时悬浮按钮必须隐藏
    const btnHidden = await page.evaluate(() => {
      const b = document.getElementById("__dp-btn");
      return getComputedStyle(b).display === "none";
    });
    expect(btnHidden).toBe(true);

    // 真实坐标点击（与真实用户一致）
    const box = await fsBtn.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);

    // 面板不能被误关闭，且进入全屏
    await expect(panel).toHaveClass(/__dp-open/);
    await expect(panel).toHaveClass(/__dp-fullscreen/);
  });

  test("全屏状态下点击暗色模式按钮：面板不被关闭", async ({ page }) => {
    const panel = page.locator("#__dp-panel");
    const fsBtn = page.locator("#__dp-fullscreen-btn");
    const darkBtn = page.locator("#__dp-dark-toggle");

    // 进入全屏
    const box = await fsBtn.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);
    await expect(panel).toHaveClass(/__dp-fullscreen/);

    // 全屏中点击暗色按钮（同样会替换 innerHTML，验证 composedPath 修复覆盖它）
    const db = await darkBtn.boundingBox();
    await page.mouse.click(db.x + db.width / 2, db.y + db.height / 2);
    await page.waitForTimeout(200);

    await expect(panel).toHaveClass(/__dp-open/);
    await expect(panel).toHaveClass(/__dp-dark/);
  });

  test("面板外部点击仍可关闭面板（composedPath 未破坏原逻辑）", async ({ page }) => {
    const panel = page.locator("#__dp-panel");
    // 点击页面左上角空白处
    await page.mouse.click(50, 50);
    await page.waitForTimeout(200);
    await expect(panel).not.toHaveClass(/__dp-open/);
  });
});
