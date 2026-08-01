// 对话重命名测试：内联编辑保存 / 空标题回退 / Esc 取消 / AI 标题不覆盖手动命名
import { test, expect } from "./fixtures.mjs";

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test.describe("对话重命名", () => {
  test.beforeEach(async ({ page, setupMockApi, mock }) => {
    await setupMockApi();
    await mock.config({
      stream: true,
      responseContent: "这是来自 mock 服务器的回复。",
      failNext: false,
    });
    await page.goto(`${MOCK_BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#__dp-btn", { timeout: 15000 });
    await page.click("#__dp-btn");
    await page.waitForSelector("#__dp-panel.__dp-open");
    await expect(page.locator("#__dp-input")).toBeEnabled({ timeout: 15000 });
  });

  // 建一个对话并打开历史面板
  async function createConvAndOpenHistory(page) {
    await page.fill("#__dp-input", "这是一条测试消息");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });
    await page.click("#__dp-history-btn");
    await page.waitForSelector("#__dp-history-list:not(.__dp-hide)", { timeout: 5000 });
    await expect(page.locator("#__dp-history-list .__dp-history-item")).toHaveCount(1);
  }

  test("点击重命名按钮 → 内联编辑 → 回车保存新标题", async ({ page, mock, sw }) => {
    // 关闭 AI 标题生成，让初始标题 = 消息截断（重命名逻辑独立于标题生成）
    await mock.config({ failNonStream: true });
    await createConvAndOpenHistory(page);

    const item = page.locator("#__dp-history-list .__dp-history-item").first();
    // 标题可见，输入框隐藏
    await expect(item.locator(".__dp-history-title")).toContainText("这是一条测试消息");
    await expect(item.locator(".__dp-history-rename-input")).toBeHidden();

    // 点重命名按钮
    await item.locator(".__dp-history-rename").click();
    const input = item.locator(".__dp-history-rename-input");
    await expect(input).toBeVisible();
    await expect(item.locator(".__dp-history-title")).toBeHidden();
    // 输入框预填原标题
    expect(await input.inputValue()).toBe("这是一条测试消息");

    // 输入新标题并回车
    await input.fill("自定义标题 ABC");
    await input.press("Enter");
    await expect(item.locator(".__dp-history-title")).toContainText("自定义标题 ABC", {
      timeout: 5000,
    });
    await expect(item.locator(".__dp-history-rename-input")).toBeHidden();

    // storage 已更新
    const stored = await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.local.get("deeppage_convs", (r) => resolve(r.deeppage_convs))
        )
    );
    expect(stored.conversations[0].title).toBe("自定义标题 ABC");
  });

  test("空标题保存 → 回退原标题", async ({ page, mock, sw }) => {
    await mock.config({ failNonStream: true });
    await createConvAndOpenHistory(page);

    const item = page.locator("#__dp-history-list .__dp-history-item").first();
    await item.locator(".__dp-history-rename").click();
    const input = item.locator(".__dp-history-rename-input");
    await input.fill("   "); // 全空格
    await input.press("Enter");

    // 标题保持不变
    await expect(item.locator(".__dp-history-title")).toContainText("这是一条测试消息", {
      timeout: 5000,
    });
    const stored = await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.local.get("deeppage_convs", (r) => resolve(r.deeppage_convs))
        )
    );
    expect(stored.conversations[0].title).toBe("这是一条测试消息");
  });

  test("Esc 取消编辑 → 标题不变", async ({ page, mock, sw }) => {
    await mock.config({ failNonStream: true });
    await createConvAndOpenHistory(page);

    const item = page.locator("#__dp-history-list .__dp-history-item").first();
    await item.locator(".__dp-history-rename").click();
    const input = item.locator(".__dp-history-rename-input");
    await input.fill("不应保存的标题");
    await input.press("Escape");

    await expect(item.locator(".__dp-history-title")).toContainText("这是一条测试消息", {
      timeout: 5000,
    });
    const stored = await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.local.get("deeppage_convs", (r) => resolve(r.deeppage_convs))
        )
    );
    expect(stored.conversations[0].title).toBe("这是一条测试消息");
  });

  test("手动重命名后，后续对话 AI 标题不再覆盖", async ({ page, sw }) => {
    // 不关 AI 标题生成：第一轮后 AI 标题生效，手动重命名，再发一轮，标题保持手动命名
    await createConvAndOpenHistory(page);
    const item = page.locator("#__dp-history-list .__dp-history-item").first();
    // 等 AI 标题生效（titleGenerated）
    await expect
      .poll(async () => await item.locator(".__dp-history-title").textContent(), { timeout: 10000 })
      .toContain("这是来自 mock 服务器的回复");

    // 手动重命名
    await item.locator(".__dp-history-rename").click();
    await item.locator(".__dp-history-rename-input").fill("手动命名标题");
    await item.locator(".__dp-history-rename-input").press("Enter");
    await expect(item.locator(".__dp-history-title")).toContainText("手动命名标题", {
      timeout: 5000,
    });

    // 回到聊天，再发一轮
    await page.click(".__dp-history-back");
    await page.waitForSelector("#__dp-input");
    await page.fill("#__dp-input", "第二轮的追问");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toHaveCount(2, { timeout: 15000 });

    // 标题仍是手动命名
    await page.click("#__dp-history-btn");
    await page.waitForSelector("#__dp-history-list:not(.__dp-hide)", { timeout: 5000 });
    await expect(
      page.locator("#__dp-history-list .__dp-history-item").first().locator(".__dp-history-title")
    ).toContainText("手动命名标题", { timeout: 5000 });
  });
});
