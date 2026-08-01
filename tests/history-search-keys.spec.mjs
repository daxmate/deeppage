// 回归测试：历史搜索框键盘事件不应冒泡到主页面（页面全局快捷键收不到按键）
import { test, expect } from "./fixtures.mjs";

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test("历史搜索框按键不传导到主页面", async ({ page, setupMockApi, mock }) => {
  await setupMockApi();
  await mock.config({ stream: true, responseContent: "回复内容。", failNext: false });
  await page.goto(`${MOCK_BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#__dp-btn", { timeout: 15000 });
  await page.click("#__dp-btn");
  await page.waitForSelector("#__dp-panel.__dp-open");
  // 等待输入框可用（checkLogin 异步返回前 input 会被禁用）
  await expect(page.locator("#__dp-input")).toBeEnabled({ timeout: 15000 });

  // 建 1 个对话（历史列表有内容，搜索框才存在）
  await page.fill("#__dp-input", "第一轮问题");
  await page.click("#__dp-send");
  await expect(
    page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
  ).toContainText("回复内容。", { timeout: 15000 });

  // 打开历史
  await page.click("#__dp-history-btn");
  await page.waitForSelector("#__dp-history-list:not(.__dp-hide)", { timeout: 5000 });

  // 主页面（page 主世界）注册全局 keydown 监听
  await page.evaluate(() => {
    window.__pageKeys = [];
    document.addEventListener("keydown", (e) => {
      window.__pageKeys.push(e.key);
    });
  });

  // 聚焦搜索框并输入（真实按键）
  await page.locator("#__dp-history-list .__dp-history-search").click();
  await page.keyboard.type("第二轮");

  // 页面不应收到任何按键
  const pageKeys = await page.evaluate(() => window.__pageKeys);
  console.log("主页面收到的按键:", JSON.stringify(pageKeys));
  expect(pageKeys).toEqual([]);

  // 搜索框本身正常工作
  await expect(page.locator("#__dp-history-list .__dp-history-item")).toHaveCount(0);
});
