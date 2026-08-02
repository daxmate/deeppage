// AI 生成对话标题测试：第一轮回复后标题被替换 / 触发时机（仅第一轮）/ 失败静默降级
import { test, expect } from "./fixtures.mjs";

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test.describe("AI 生成对话标题", () => {
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

  test("第一轮回复后对话标题被 AI 生成内容替换", async ({ page, mock, sw }) => {
    await page.fill("#__dp-input", "你好");
    await page.click("#__dp-send");
    // 等 AI 回复渲染完成
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });

    // 等待 generateTitle 的非流式请求发出（mock 返回同样内容 → 标题应为回复文本截断 50 字符）
    await expect
      .poll(
        async () => {
          const { requests } = await mock.requests();
          return requests.filter((r) => r.url.includes("/chat/completions")).length;
        },
        { timeout: 10000 }
      )
      .toBeGreaterThanOrEqual(2);

    // 标题已更新为 AI 生成内容（对话存储里 conv.title）
    await expect
      .poll(
        async () => {
          const stored = await sw.evaluate(
            () =>
              new Promise((resolve) =>
                chrome.storage.local.get("deeppage_convs", (r) => resolve(r.deeppage_convs))
              )
          );
          const convs = stored?.conversations || [];
          return convs.length ? convs[0].title : null;
        },
        { timeout: 10000 }
      )
      .toContain("这是来自 mock 服务器的回复");

    // generateTitle 请求是低温度、小 maxTokens 的非流式请求
    const { requests } = await mock.requests();
    const titleReq = requests.filter((r) => r.url.includes("/chat/completions")).pop();
    expect(titleReq.body.stream).toBe(false);
    expect(titleReq.body.temperature).toBe(0.3);
    expect(titleReq.body.max_tokens).toBeLessThanOrEqual(50);
    // system prompt 是标题生成指令
    const sysMsg = titleReq.body.messages.find((m) => m.role === "system");
    expect(sysMsg.content.length).toBeGreaterThan(0);
  });

  test("多轮对话不重复触发标题生成（仅第一轮）", async ({ page, mock, sw }) => {
    // 第一轮
    await page.fill("#__dp-input", "第一轮问题");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });
    await expect
      .poll(
        async () => {
          const { requests } = await mock.requests();
          return requests.filter((r) => r.url.includes("/chat/completions")).length;
        },
        { timeout: 10000 }
      )
      .toBeGreaterThanOrEqual(2);

    // 第二轮（此时 mock 已记录请求数）
    const { requests: before } = await mock.requests();
    const countBefore = before.filter((r) => r.url.includes("/chat/completions")).length;

    await page.fill("#__dp-input", "第二轮问题");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toHaveCount(2, { timeout: 15000 });

    await expect
      .poll(
        async () => {
          const { requests } = await mock.requests();
          return requests.filter((r) => r.url.includes("/chat/completions")).length;
        },
        { timeout: 10000 }
      )
      .toBe(countBefore + 1); // 只多 1 个流式请求，无新增 generateTitle 请求

    // 标题仍是第一轮生成的（未被第二轮覆盖）
    const stored = await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.local.get("deeppage_convs", (r) => resolve(r.deeppage_convs))
        )
    );
    expect(stored.conversations[0].title).toContain("这是来自 mock 服务器的回复");
  });

  test("标题生成失败时静默降级，不影响对话", async ({ page, mock, sw }) => {
    // 让标题生成（非流式）请求失败：流式对话不受影响
    await mock.config({ failNonStream: true });
    await page.fill("#__dp-input", "触发失败场景");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });

    // 等标题请求（失败）走完，无页面错误
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
    // 对话仍然存在，标题保留降级截断（首条消息前 50 字符）
    const stored = await sw.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.storage.local.get("deeppage_convs", (r) => resolve(r.deeppage_convs))
        )
    );
    const conv = stored.conversations[0];
    expect(conv.title).toBeTruthy();
  });
});
