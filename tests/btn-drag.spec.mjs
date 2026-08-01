// 悬浮按钮测试：注入 / 拖拽位置变化 / storage 记忆 / 刷新恢复 / 点击开面板
import { test, expect } from "./fixtures.mjs";

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test.describe("悬浮按钮", () => {
  test("拖拽后位置变化并写入 storage，刷新后恢复", async ({ page, sw }) => {
    await page.goto(`${MOCK_BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#__dp-btn", { timeout: 15000 });

    // 默认位置
    const before = await page.locator("#__dp-btn").boundingBox();
    expect(before).toBeTruthy();

    // 拖拽 +150, +120
    const cx = before.x + before.width / 2,
      cy = before.y + before.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 150, cy + 120, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    const after = await page.locator("#__dp-btn").boundingBox();
    expect(
      Math.round(after.x) === Math.round(before.x) && Math.round(after.y) === Math.round(before.y)
    ).toBe(false);

    // storage 写入 btnPos
    const stored = await sw.evaluate(
      () => new Promise((resolve) => chrome.storage.sync.get("btnPos", (r) => resolve(r.btnPos)))
    );
    expect(stored).toBeTruthy();
    expect(typeof stored.x).toBe("number");
    expect(typeof stored.y).toBe("number");

    // 刷新后位置恢复
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#__dp-btn", { timeout: 15000 });
    await page.waitForTimeout(500);
    const restored = await page.locator("#__dp-btn").boundingBox();
    expect(Math.abs(restored.x - after.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(restored.y - after.y)).toBeLessThanOrEqual(2);

    // 点击（非拖拽）仍能打开面板
    await page.mouse.click(restored.x + 28, restored.y + 28);
    await expect(page.locator("#__dp-panel")).toHaveClass(/__dp-open/, { timeout: 5000 });
  });
});
