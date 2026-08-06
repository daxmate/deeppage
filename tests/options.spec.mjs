// Options 页测试：提供商列表 / 设置保存 / 流式开关 / 测试连接
import { test, expect } from "./fixtures.mjs";

const MOCK_PORT = process.env.MOCK_PORT;

test.describe("Options 页", () => {
  test("提供商下拉框渲染完整", async ({ extensionId, page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`chrome-extension://${extensionId}/options/options.html`, {
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
    await page.goto(`chrome-extension://${extensionId}/options/options.html`, {
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
    await page.goto(`chrome-extension://${extensionId}/options/options.html`, {
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
    // 状态显示：自绘成功图标 + 文案（不再用 emoji）
    await expect(page.locator("#testApiStatus svg")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#testApiStatus span")).toContainText("Connection", {
      timeout: 15000,
    });
  });

  test("旧版 sync 中的 API Key 自动迁移到本地并清除云端", async ({ extensionId, page, sw }) => {
    // 模拟旧版本：key 存在 chrome.storage.sync
    await sw.evaluate(
      () =>
        new Promise((resolve) => {
          chrome.storage.sync.set({ apiKey: "legacy-key" }, resolve);
        })
    );
    await page.goto(`chrome-extension://${extensionId}/options/options.html`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("#apiProvider option")
      .first()
      .waitFor({ state: "attached", timeout: 15000 });

    // 旧 key 应能回退显示在输入框
    await expect(page.locator("#apiKey")).toHaveValue("legacy-key");

    // 触发一次 getSettings（checkLogin，从 options 页发消息，SW 收得到）→ 触发迁移
    const loggedIn = await page.evaluate(
      () =>
        new Promise((resolve) =>
          chrome.runtime.sendMessage({ action: "checkLogin" }, (r) => resolve(r))
        )
    );
    expect(loggedIn.loggedIn).toBe(true);

    // 迁移后：key 在本地，sync 已清除
    const local = await sw.evaluate(
      () =>
        new Promise((resolve) => chrome.storage.local.get(["apiKey", "deepseekApiKey"], resolve))
    );
    expect(local.apiKey).toBe("legacy-key");
    const synced = await sw.evaluate(
      () => new Promise((resolve) => chrome.storage.sync.get(["apiKey", "deepseekApiKey"], resolve))
    );
    expect(synced.apiKey).toBeUndefined();
    expect(synced.deepseekApiKey).toBeUndefined();
  });

  test("快速操作按钮：添加/删除卡片", async ({ extensionId, page }) => {
    await page.goto(`chrome-extension://${extensionId}/options/options.html`, {
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

  test("快速操作按钮：拖拽排序并持久化", async ({ extensionId, page, sw }) => {
    await page.goto(`chrome-extension://${extensionId}/options/options.html`, {
      waitUntil: "domcontentloaded",
    });
    // 调高视口，保证 6 张卡片全部可见（#tab-contents 内层滚动容器会被裁剪）
    await page.setViewportSize({ width: 1200, height: 2800 });
    await page
      .locator("#apiProvider option")
      .first()
      .waitFor({ state: "attached", timeout: 15000 });

    // 切到快速操作 tab，添加 3 个按钮（默认已有 3 张卡片）
    await page.click('.option-tab[data-tab="quick"]');
    await page.waitForSelector("#btn-add", { timeout: 5000 });
    const before = await page.locator(".action-card").count();
    for (const label of ["按钮A", "按钮B", "按钮C"]) {
      await page.click("#btn-add");
      await page.locator(".action-card").last().locator(".action-card-label-input").fill(label);
    }
    await expect(page.locator(".action-card")).toHaveCount(before + 3);

    // 记录拖拽前顺序，把第 1 张拖到最后（相对断言，不依赖默认文案）
    const labelsBefore = await page
      .locator(".action-card-label-input")
      .evaluateAll((els) => els.map((el) => el.value));

    // 手动 mouse 拖拽（HTML5 DnD 在 Chromium 下 dragTo 不可靠，用多步 mouse 事件）
    const src = await page
      .locator(".action-card")
      .nth(0)
      .locator(".action-card-drag")
      .boundingBox();
    const dst = await page
      .locator(".action-card")
      .nth(before + 2)
      .boundingBox();
    expect(src && dst).toBeTruthy();
    await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
    await page.mouse.down();
    await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 10 });
    await page.mouse.up();

    // DOM 顺序：原第 2 张变第 1，原第 1 张变最后
    const labelsAfter = await page
      .locator(".action-card-label-input")
      .evaluateAll((els) => els.map((el) => el.value));
    expect(labelsAfter[0]).toBe(labelsBefore[1]);
    expect(labelsAfter[labelsAfter.length - 1]).toBe(labelsBefore[0]);

    // storage quickActions 顺序一致（自动保存异步，轮询等待）
    await expect(async () => {
      const stored = await sw.evaluate(
        () =>
          new Promise((resolve) =>
            chrome.storage.sync.get("quickActions", (r) => resolve(r.quickActions))
          )
      );
      const storedLabels = stored?.map((a) => a.label) || [];
      expect(storedLabels[0]).toBe(labelsBefore[1]);
      expect(storedLabels[storedLabels.length - 1]).toBe(labelsBefore[0]);
    }).toPass();
  });

  test("快速操作按钮：拖拽到列表外取消后恢复原顺序", async ({ extensionId, page }) => {
    await page.goto(`chrome-extension://${extensionId}/options/options.html`, {
      waitUntil: "domcontentloaded",
    });
    await page.setViewportSize({ width: 1200, height: 2200 });
    await page
      .locator("#apiProvider option")
      .first()
      .waitFor({ state: "attached", timeout: 15000 });
    await page.click('.option-tab[data-tab="quick"]');
    await page.waitForSelector("#btn-add", { timeout: 5000 });

    const labelsBefore = await page
      .locator(".action-card-label-input")
      .evaluateAll((els) => els.map((el) => el.value));

    // 从第 1 张把手拖到列表下方空白处释放（无效 drop 区域）
    const src = await page
      .locator(".action-card")
      .nth(0)
      .locator(".action-card-drag")
      .boundingBox();
    await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
    await page.mouse.down();
    await page.mouse.move(600, 1900, { steps: 5 });
    await page.mouse.up();

    // 顺序应恢复原样
    const labelsAfter = await page
      .locator(".action-card-label-input")
      .evaluateAll((els) => els.map((el) => el.value));
    expect(labelsAfter).toEqual(labelsBefore);
  });

  test("Custom System Prompt placeholder 跟随语言", async ({ extensionId, page }) => {
    await page.goto(`chrome-extension://${extensionId}/options/options.html`, {
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
