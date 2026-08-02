// 面板 UI 功能测试：历史 / 导出 / 清除上下文 / 暗色模式 / 语言切换
import { test, expect } from "./fixtures.mjs";

const TEST_PAGE = `http://127.0.0.1:${process.env.MOCK_PORT}/`;

test.describe("面板 UI 功能", () => {
  test.beforeEach(async ({ page, setupMockApi, mock }) => {
    await setupMockApi();
    await mock.config({
      stream: true,
      responseContent: "这是来自 mock 服务器的回复。",
      failNext: false,
    });
    await page.goto(TEST_PAGE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#__dp-btn", { timeout: 15000 });
    await page.click("#__dp-btn"); // 打开面板
    await page.waitForSelector("#__dp-panel.__dp-open");
    // 等待输入框可用（checkLogin 异步返回前 input 会被禁用）
    await expect(page.locator("#__dp-input")).toBeEnabled({ timeout: 15000 });
  });

  test("发送消息后历史面板列出对话", async ({ page, mock }) => {
    // 关闭 AI 标题生成（失败降级），历史标题保持为消息截断（标题生成有独立测试 title-gen）
    await mock.config({ failNonStream: true });
    // 发一条消息（触发对话保存）
    await page.fill("#__dp-input", "第一轮问题");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });

    // 打开历史
    await page.click("#__dp-history-btn");
    await page.waitForSelector("#__dp-history-list:not(.__dp-hide)", { timeout: 5000 });
    const items = page.locator("#__dp-history-list .__dp-history-item");
    await expect(items).toHaveCount(1);
    await expect(items.first().locator(".__dp-history-title")).toContainText("第一轮问题");
    // 当前对话有 active 标记
    await expect(items.first()).toHaveClass(/active/);
  });

  test("历史搜索：按标题/内容关键词过滤对话", async ({ page, mock }) => {
    await mock.config({ failNonStream: true }); // 同上：禁用 AI 标题生成，标题=消息截断
    // 建 2 个不同标题的对话
    for (const q of ["第一轮问题", "第二轮问题"]) {
      await page.fill("#__dp-input", q);
      await page.click("#__dp-send");
      await expect(
        page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type])").last()
      ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });
      await page.click("#__dp-new-btn"); // 新对话
      // 新对话清空聊天区（无欢迎消息）
      await expect(page.locator("#__dp-chat .__dp-msg")).toHaveCount(0, { timeout: 5000 });
    }

    // 打开历史：应有 2 个对话
    await page.click("#__dp-history-btn");
    await page.waitForSelector("#__dp-history-list:not(.__dp-hide)", { timeout: 5000 });
    const items = page.locator("#__dp-history-list .__dp-history-item");
    await expect(items).toHaveCount(2);

    // 按标题关键词搜索
    await page.fill("#__dp-history-list .__dp-history-search", "第二轮");
    await expect(items).toHaveCount(1);
    await expect(items.first().locator(".__dp-history-title")).toContainText("第二轮问题");

    // 按消息内容搜索（mock 回复内容）
    await page.fill("#__dp-history-list .__dp-history-search", "mock 服务器");
    await expect(items).toHaveCount(2);

    // 无匹配
    await page.fill("#__dp-history-list .__dp-history-search", "不存在的关键词xyz");
    await expect(items).toHaveCount(0);
    await expect(page.locator("#__dp-history-list .__dp-history-empty")).toBeVisible();

    // 清空搜索恢复全部
    await page.fill("#__dp-history-list .__dp-history-search", "");
    await expect(items).toHaveCount(2);
  });

  test("导出下载 .md 文件包含对话内容", async ({ page }) => {
    await page.fill("#__dp-input", "导出的内容");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });

    // 打开导出菜单 → 点 Download .md
    await page.click("#__dp-export-btn");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('#__dp-export-menu div[data-action="download"]').click(),
    ]);
    const file = await download.path();
    const fs = await import("node:fs");
    const content = fs.readFileSync(file, "utf8");
    expect(content).toContain("# DeepPage 对话导出");
    expect(content).toContain("导出的内容");
    expect(content).toContain("这是来自 mock 服务器的回复。");
  });

  test("导出 PDF：菜单项存在，点击触发 .pdf 下载", async ({ page }) => {
    await page.fill("#__dp-input", "导出 PDF 的内容");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });

    // 打开导出菜单 → PDF 菜单项存在
    await page.click("#__dp-export-btn");
    const pdfItem = page.locator('#__dp-export-menu div[data-action="pdf"]');
    await expect(pdfItem).toBeVisible();
    await expect(pdfItem).toContainText("PDF");

    // 点击触发下载
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      pdfItem.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const file = await download.path();
    const fs = await import("node:fs");
    const buf = fs.readFileSync(file);
    const head = buf.subarray(0, 5).toString("ascii");
    expect(head).toBe("%PDF-"); // PDF 文件头
    // 有实际内容（含对话渲染的 PDF 明显大于空白页 ~1KB）
    expect(buf.length).toBeGreaterThan(1024);
  });

  test("导出 Word：菜单项存在，点击触发 .docx 下载", async ({ page }) => {
    await page.fill("#__dp-input", "导出 Word 的内容");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });

    // 打开导出菜单 → Word 菜单项存在
    await page.click("#__dp-export-btn");
    const wordItem = page.locator('#__dp-export-menu div[data-action="word"]');
    await expect(wordItem).toBeVisible();
    await expect(wordItem).toContainText("Word");

    // 点击触发下载
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      wordItem.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.docx$/);
    const file = await download.path();
    const fs = await import("node:fs");
    const buf = fs.readFileSync(file);
    // .docx 是 OOXML zip 包：文件头 "PK"，且包含 word/document.xml（zip 内可搜索文本）
    expect(buf.subarray(0, 2).toString("ascii")).toBe("PK");
    expect(buf.length).toBeGreaterThan(2048);
  });

  test("复制 Markdown 保留语法，复制纯文本剥离语法", async ({ page, mock }) => {
    // 授权 clipboard 读写（真实系统剪贴板）
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    // mock 回复含 markdown 语法
    await mock.config({
      stream: true,
      responseContent: "**加粗** 和 `代码` 以及\n\n# 标题\n\n- 列表项1\n- 列表项2",
      failNext: false,
    });
    await page.fill("#__dp-input", "给我 markdown");
    await page.click("#__dp-send");
    await expect(
      page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content")
    ).toContainText("加粗", { timeout: 15000 });

    const copyViaMenu = async (action) => {
      await page.click("#__dp-export-btn"); // 开菜单
      await page.click(`#__dp-export-menu div[data-action="${action}"]`);
      await page.waitForTimeout(300);
      return page.evaluate(() => navigator.clipboard.readText());
    };

    const md = await copyViaMenu("markdown");
    const txt = await copyViaMenu("text");

    // Markdown 导出保留语法标记
    expect(md).toContain("**加粗**");
    expect(md).toContain("# 标题");
    // 纯文本导出剥离语法：正文不含 markdown 符号，保留文字
    expect(txt).not.toContain("**");
    expect(txt).not.toContain("# 标题");
    expect(txt).toContain("加粗");
    expect(txt).toContain("标题");
    // 两种格式内容不同（不能是同一种导出）
    expect(md).not.toEqual(txt);
  });

  test("清除上下文：多轮后只保留当前问题", async ({ page }) => {
    // 两轮对话（4 条消息）
    for (const q of ["第一轮问题", "第二轮问题"]) {
      await page.fill("#__dp-input", q);
      await page.click("#__dp-send");
      await expect(
        page.locator("#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type])").last()
      ).toContainText("这是来自 mock 服务器的回复。", { timeout: 15000 });
    }
    await expect(page.locator("#__dp-chat .__dp-msg")).toHaveCount(5); // context-loaded + 2 user + 2 assistant

    // 清除上下文
    await page.click("#__dp-clear-ctx-btn");
    // 只保留最后一条 user 消息（渲染为 user 气泡）
    await expect(page.locator("#__dp-chat .__dp-msg")).toHaveCount(1);
    await expect(page.locator("#__dp-chat .__dp-msg.__dp-user")).toContainText("第二轮问题");
  });

  test("暗色模式切换：面板加 __dp-dark 并持久化", async ({ page, sw }) => {
    await page.click("#__dp-dark-toggle");
    await expect(page.locator("#__dp-panel")).toHaveClass(/__dp-dark/);
    const stored = await sw.evaluate(
      () => new Promise((resolve) => chrome.storage.sync.get("darkMode", resolve))
    );
    expect(stored.darkMode).toBe(true);

    // 再点一次取消
    await page.click("#__dp-dark-toggle");
    await expect(page.locator("#__dp-panel")).not.toHaveClass(/__dp-dark/);
  });

  test("语言切换：quick actions 按钮文案跟随语言变化", async ({ page, sw }) => {
    // 等待 quick actions 渲染（默认英文环境）
    await page.waitForSelector("#__dp-quick-actions button");
    const labelsEn = await page.locator("#__dp-quick-actions button").allTextContents();
    expect(labelsEn.length).toBe(3);

    // 语言按钮显示当前语言简码（英文环境 → EN）
    await expect(page.locator("#__dp-lang-btn")).toHaveText("EN");

    // 点击按钮展开菜单 → 选中文
    await page.click("#__dp-lang-btn");
    await page.waitForSelector("#__dp-lang-menu.__dp-show");
    await page.click('#__dp-lang-menu .__dp-lang-item[data-code="zh_CN"]');
    // 语言切换异步生效，轮询等待按钮文案变为中文
    await expect(async () => {
      const labels = await page.locator("#__dp-quick-actions button").allTextContents();
      expect(labels.join(" ")).toContain("总结");
    }).toPass({ timeout: 10000 });
    // 按钮简码更新为「简」
    await expect(page.locator("#__dp-lang-btn")).toHaveText("简");

    // storage 里语言已持久化（通过 service worker 读扩展 storage）
    const stored = await sw.evaluate(
      () => new Promise((resolve) => chrome.storage.sync.get("language", resolve))
    );
    expect(stored.language).toBe("zh_CN");
  });
});
