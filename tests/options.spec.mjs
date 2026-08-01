// Options 页测试：提供商列表 / 设置保存 / 流式开关 / 测试连接
import { test, expect } from "./fixtures.mjs";

const MOCK_PORT = process.env.MOCK_PORT;

test.describe("Options 页", () => {
  test("提供商下拉框渲染完整", async ({ extensionId, page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`chrome-extension://${extensionId}/options.html`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("#apiProvider option")
      .first()
      .waitFor({ state: "attached", timeout: 15000 });

    const providers = await page.locator("#apiProvider option").allTextContents();
    expect(providers.length).toBeGreaterThanOrEqual(12); // DeepPage 支持 12+ 提供商
    // 含自定义
    expect(providers.join(" ")).toMatch(/custom/i);
    expect(errors).toEqual([]);
  });

  test("修改参数自动保存到 storage（含流式开关）", async ({ extensionId, page, sw }) => {
    await page.goto(`chrome-extension://${extensionId}/options.html`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("#apiProvider option")
      .first()
      .waitFor({ state: "attached", timeout: 15000 });

    // 流式开关默认开
    const streamToggle = page.locator("#stream-output-toggle");
    await expect(streamToggle).toBeChecked();

    // 改温度 + 关流式（toggle-switch 的 checkbox 视觉隐藏，直接 evaluate 触发）
    await page.locator("#temperature").evaluate((el) => {
      el.value = "0.3";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await streamToggle.evaluate((el) => {
      el.checked = false;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    // 改页面内容截断长度
    await page.locator("#max-context-len").evaluate((el) => {
      el.value = "30000";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // 自动保存是异步的，轮询等 storage 生效
    await expect(async () => {
      const stored = await sw.evaluate(
        () =>
          new Promise((resolve) =>
            chrome.storage.sync.get(["temperature", "streamOutput", "maxContextLen"], resolve)
          )
      );
      expect(stored.temperature).toBe(0.3);
      expect(stored.streamOutput).toBe(false);
      expect(stored.maxContextLen).toBe(30000);
    }).toPass({ timeout: 5000 });
  });

  test("测试连接：mock API 返回成功", async ({ extensionId, page, setupMockApi, mock }) => {
    await setupMockApi();
    // testApi 发 stream:false 请求，mock 需以非流式 JSON 响应
    await mock.config({ stream: false, responseContent: "ok", failNext: false });
    await page.goto(`chrome-extension://${extensionId}/options.html`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("#apiProvider option")
      .first()
      .waitFor({ state: "attached", timeout: 15000 });

    // 填入 mock 配置（custom provider）
    await page.selectOption("#apiProvider", "custom");
    await page.fill("#apiBaseUrl", `http://127.0.0.1:${MOCK_PORT}`);
    await page.fill("#apiKey", "test-key");
    // apiModel 是 select：custom 下仅空 option，手动添加并选中 mock-model
    await page.locator("#apiModel").evaluate((el) => {
      const opt = document.createElement("option");
      opt.value = "mock-model";
      opt.textContent = "mock-model";
      el.appendChild(opt);
      el.value = "mock-model";
    });

    await page.click("#testApiBtn");
    await expect(page.locator("#testApiStatus")).toContainText("✅", { timeout: 15000 });
  });

  test("快速操作按钮：添加/删除卡片", async ({ extensionId, page }) => {
    await page.goto(`chrome-extension://${extensionId}/options.html`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("#apiProvider option")
      .first()
      .waitFor({ state: "attached", timeout: 15000 });

    // 切到快速操作 tab
    await page.click('.option-tab[data-tab="quick"]');
    await page.waitForSelector("#btn-add", { timeout: 5000 });

    const before = await page.locator(".action-card").count();
    await page.click("#btn-add");
    await expect(page.locator(".action-card")).toHaveCount(before + 1);

    // 填 label + prompt，删除
    await page.locator(".action-card").last().locator(".action-card-label-input").fill("测试按钮");
    await page.locator(".action-card").last().locator(".fld-prompt").fill("测试 prompt");
    await page.locator(".action-card").last().locator(".action-card-del").click();
    await expect(page.locator(".action-card")).toHaveCount(before);
  });

  test("Custom System Prompt placeholder 跟随语言", async ({ extensionId, page }) => {
    await page.goto(`chrome-extension://${extensionId}/options.html`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("#apiProvider option")
      .first()
      .waitFor({ state: "attached", timeout: 15000 });

    // 默认英文环境 → 英文 placeholder
    const placeholderEn = await page.locator("#custom-system-prompt").getAttribute("placeholder");
    expect(placeholderEn).toContain("Think step by step");

    // 切到外观 tab（语言选择器在此）再切中文
    await page.click('.option-tab[data-tab="appearance"]');
    await page.waitForSelector('#tab-appearance:not([style*="display: none"])', { timeout: 5000 });
    await page.selectOption("#language-select", "zh_CN");
    await expect(async () => {
      const p = await page.locator("#custom-system-prompt").getAttribute("placeholder");
      expect(p).toContain("请一步步思考");
    }).toPass({ timeout: 10000 });
  });
});
