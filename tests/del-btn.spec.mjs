// 消息删除按钮测试：hover 显示 / 删除行为 / storage 同步
import { test, expect } from "./fixtures.mjs";

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test.describe("消息删除按钮", () => {
  test.beforeEach(async ({ page, setupMockApi, mock }) => {
    await setupMockApi();
    await mock.config({ stream: true, responseContent: "回复内容。", failNext: false });
    await page.goto(`${MOCK_BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#__dp-btn", { timeout: 15000 });
    await page.click("#__dp-btn");
    await page.waitForSelector("#__dp-panel.__dp-open");
    // 等待输入框可用（checkLogin 异步返回前 input 会被禁用）
    await expect(page.locator("#__dp-input")).toBeEnabled({ timeout: 15000 });
  });

  test("每条消息有删除按钮，hover 显示，删除同步 storage", async ({ page, sw }) => {
    // 发送消息 → 欢迎 + context-loaded + user + assistant 共 4 条
    await page.fill("#__dp-input", "hello delete test");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("回复内容。", { timeout: 15000 });
    await expect(page.locator("#__dp-chat .__dp-msg")).toHaveCount(4);

    // 每条消息都有删除按钮
    const delCount = await page.locator("#__dp-chat .__dp-msg .__dp-del-btn").count();
    expect(delCount).toBe(4);

    // hover 显示删除按钮（opacity 从隐藏到可见）
    const delBtn = page.locator("#__dp-chat .__dp-msg").nth(0).locator(".__dp-del-btn");
    const opacityBefore = await delBtn.evaluate((el) => getComputedStyle(el).opacity);
    await page.hover("#__dp-chat .__dp-msg >> nth=0");
    await page.waitForTimeout(300);
    const opacityAfter = await delBtn.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacityBefore)).toBeLessThan(0.5);
    expect(Number(opacityAfter)).toBeGreaterThan(0.5);

    // 删除欢迎消息（skipTrack）→ 只删 DOM，storage 不受影响（欢迎消息本就不入 storage，剩余 user + assistant 均在）
    await page.hover("#__dp-chat .__dp-msg >> nth=0");
    await page.click("#__dp-chat .__dp-msg >> nth=0 >> .__dp-del-btn");
    await expect(page.locator("#__dp-chat .__dp-msg")).toHaveCount(3);

    const storage1 = await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.local.get("deeppage_convs", (r) => resolve(r.deeppage_convs))
        )
    );
    const storedMsgs1 = storage1?.conversations?.[0]?.messages ?? [];
    expect(storedMsgs1.map((m) => m.role)).toEqual(["user", "assistant"]); // 欢迎消息不入 storage

    // 删除 context-loaded 消息（skipTrack）→ 只删 DOM，storage 仍不受影响
    await page.hover("#__dp-chat .__dp-msg >> nth=0");
    await page.click("#__dp-chat .__dp-msg >> nth=0 >> .__dp-del-btn");
    await expect(page.locator("#__dp-chat .__dp-msg")).toHaveCount(2);

    // 删除 user 消息 → DOM 剩 assistant，storage 同步更新
    await page.hover("#__dp-chat .__dp-msg >> nth=0");
    await page.click("#__dp-chat .__dp-msg >> nth=0 >> .__dp-del-btn");
    await expect(page.locator("#__dp-chat .__dp-msg")).toHaveCount(1);
    expect(
      await page
        .locator("#__dp-chat .__dp-msg")
        .first()
        .evaluate((el) => el.classList.contains("__dp-assistant"))
    ).toBe(true);

    const storage2 = await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.local.get("deeppage_convs", (r) => resolve(r.deeppage_convs))
        )
    );
    const storedMsgs2 = storage2?.conversations?.[0]?.messages ?? [];
    expect(storedMsgs2.map((m) => m.role)).toEqual(["assistant"]);

    // 删除最后一条 → 空对话从 storage 移除
    await page.hover("#__dp-chat .__dp-msg >> nth=0");
    await page.click("#__dp-chat .__dp-msg >> nth=0 >> .__dp-del-btn");
    await expect(page.locator("#__dp-chat .__dp-msg")).toHaveCount(0);
    const storage3 = await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.local.get("deeppage_convs", (r) => resolve(r.deeppage_convs))
        )
    );
    expect(storage3?.conversations?.length ?? 0).toBe(0);
  });
});
