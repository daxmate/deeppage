// 回归测试：maxContextLen 配置影响页面上下文截断长度
import { test, expect } from "./fixtures.mjs";

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test("页面内容截断长度配置生效", async ({ page, setupMockApi, mock, sw }) => {
  // 先写一个小截断值（如 200），再加载页面
  await sw.evaluate(() => new Promise((r) => chrome.storage.sync.set({ maxContextLen: 200 }, r)));
  await setupMockApi();
  await mock.config({ stream: true, responseContent: "回复。", failNext: false });

  // 构造超长页面内容（mock 页面正文只有几行，改为直接注入长文本）
  await page.goto(`${MOCK_BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const el = document.createElement("div");
    el.id = "long-content";
    el.textContent = "段落内容".repeat(200); // ~800 字符
    document.body.appendChild(el);
  });
  await page.waitForSelector("#__dp-btn", { timeout: 15000 });
  await page.click("#__dp-btn");
  await page.waitForSelector("#__dp-panel.__dp-open");

  await page.fill("#__dp-input", "测试截断");
  await page.click("#__dp-send");
  await expect(page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")).toContainText("回复。", { timeout: 15000 });

  const { requests } = await mock.requests();
  const chatReq = requests.find((r) => r.url.includes("/chat/completions"));
  const sysMsg = chatReq.body.messages.find((m) => m.role === "system");
  console.log("system prompt 长度:", sysMsg.content.length);
  // 页面正文被截断到 ~200 + 后缀
  expect(sysMsg.content.length).toBeLessThan(1000);
  expect(sysMsg.content).toContain("已截取");
});
