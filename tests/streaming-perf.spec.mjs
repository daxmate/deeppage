// 回归测试：长文本流式渲染节流 — 验证最终内容完整 + 渲染次数远小于 chunk 数
import { test, expect } from "./fixtures.mjs";

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test("长文本流式渲染节流且内容完整", async ({ page, setupMockApi, mock }) => {
  await setupMockApi();
  // 构造超长回复（>3000 字符，模拟长文本）
  const longText = Array.from(
    { length: 400 },
    (_, i) => `段落${i}：这是第 ${i} 段内容，包含一些文字。`
  ).join("\n\n");
  await mock.config({ stream: true, responseContent: longText, failNext: false });
  await page.goto(`${MOCK_BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#__dp-btn", { timeout: 15000 });
  await page.click("#__dp-btn");
  await page.waitForSelector("#__dp-panel.__dp-open");

  // 监听 chat 区域 DOM 变化次数（rAF 节流下应远小于 chunk 数）
  await page.evaluate(() => {
    window.__renderCount = 0;
    const el = document.querySelector("#__dp-chat");
    new MutationObserver(() => {
      window.__renderCount++;
    }).observe(el, { childList: true, subtree: true, characterData: true });
  });

  await page.fill("#__dp-input", "生成超长回复");
  await page.click("#__dp-send");
  // 等回复完成
  await expect(
    page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
  ).toContainText("段落399", { timeout: 30000 });

  const result = await page.evaluate(() => ({
    renderCount: window.__renderCount,
    textLength:
      document.querySelector(
        "#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content"
      )?.textContent?.length || 0,
  }));
  // 内容完整（>3000 字符阈值，进入降频模式）
  expect(result.textLength).toBeGreaterThan(3000);
  // 节流生效：渲染次数远小于 chunk 数（400 段 ≈ 上万字符逐字发送），上限 200 保守防回归
  expect(result.renderCount).toBeLessThan(200);
});
