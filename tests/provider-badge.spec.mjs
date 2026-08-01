// 注入状态指示测试：按钮图标 = 当前配置的提供商 logo / 切换实时刷新 / title 显示 提供商·模型
import { test, expect } from "./fixtures.mjs";

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test.describe("注入状态指示", () => {
  test("默认按钮图标为 DeepSeek，title 含提供商和模型", async ({ page, sw }) => {
    await page.goto(`${MOCK_BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#__dp-btn", { timeout: 15000 });

    // 按钮内是 DeepSeek 图标（svg 已渲染）
    const btn = page.locator("#__dp-btn");
    await expect(btn.locator("svg")).toBeVisible();

    // title：默认 deepseek
    const btnTitle = await btn.getAttribute("title");
    expect(btnTitle).toContain("DeepSeek");
    expect(btnTitle).toContain("deepseek-v4-flash");
  });

  test("storage 修改 provider 后按钮图标实时刷新", async ({ page, sw }) => {
    await page.goto(`${MOCK_BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#__dp-btn", { timeout: 15000 });
    const btn = page.locator("#__dp-btn");

    // 初始是 DeepSeek path
    const initialSvg = await btn.locator("svg").evaluate((el) => el.outerHTML);
    expect(initialSvg).toContain("M23.748 4.651"); // deepseek path 开头

    // 切到 moonshot
    await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.sync.set({ apiProvider: "moonshot", apiModel: "kimi-latest" }, resolve)
        )
    );
    await expect
      .poll(async () => await btn.getAttribute("title"), { timeout: 5000 })
      .toContain("Moonshot");
    const title = await btn.getAttribute("title");
    expect(title).toContain("kimi-latest");
    // 图标已变化（svg path 不再是 deepseek）
    const newSvg = await btn.locator("svg").evaluate((el) => el.outerHTML);
    expect(newSvg).not.toContain("M23.748 4.651");
  });

  test("未知 provider 回退齿轮图标且不报错", async ({ page, sw }) => {
    await page.goto(`${MOCK_BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#__dp-btn", { timeout: 15000 });
    const btn = page.locator("#__dp-btn");

    await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.sync.set({ apiProvider: "some-unknown-provider", apiModel: "x" }, resolve)
        )
    );
    await expect
      .poll(async () => await btn.getAttribute("title"), { timeout: 5000 })
      .toContain("some-unknown-provider");
    // 回退图标仍渲染 svg
    await expect(btn.locator("svg")).toBeVisible();
    // 页面无 JS 错误
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });
});
