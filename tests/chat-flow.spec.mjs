// 聊天核心流程测试：流式/非流式响应、快捷按钮
import { test, expect } from './fixtures.mjs';

const TEST_PAGE = `http://127.0.0.1:${process.env.MOCK_PORT}/`;

test.describe('聊天核心流程', () => {
  test.beforeEach(async ({ page, setupMockApi, mock }) => {
    await setupMockApi();
    await mock.config({ stream: true, responseContent: '这是来自 mock 服务器的回复。', failNext: false });
    await page.goto(TEST_PAGE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#__dp-btn', { timeout: 15000 });
    await page.click('#__dp-btn'); // 打开面板
    await page.waitForSelector('#__dp-panel.__dp-open');
  });

  test('发送消息 → 用户气泡 + AI 流式回复渲染', async ({ page, mock }) => {
    await page.fill('#__dp-input', '你好，介绍一下你自己');
    await page.click('#__dp-send');

    // 用户气泡
    await expect(page.locator('#__dp-chat .__dp-msg.__dp-user .__dp-bubble-content')).toContainText('你好，介绍一下你自己');
    // AI 气泡（流式结束后完整内容）
    await expect(page.locator('#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content')).toContainText('这是来自 mock 服务器的回复。', { timeout: 15000 });
    // 输入框清空
    await expect(page.locator('#__dp-input')).toHaveValue('');

    // mock server 收到请求，且带页面上下文
    const { requests } = await mock.requests();
    expect(requests.length).toBeGreaterThanOrEqual(1);
    const chatReq = requests.find(r => r.url.includes('/chat/completions'));
    expect(chatReq).toBeTruthy();
    const sysMsg = chatReq.body.messages.find(m => m.role === 'system');
    expect(sysMsg.content).toContain('Mock Test Page'); // 页面标题进了 system prompt
    expect(chatReq.body.stream).toBe(true);
  });

  test('非流式响应同样渲染（关闭流式开关）', async ({ page, mock, setupMockApi }) => {
    // 关闭流式输出开关 → 扩展端应发 stream:false 请求并解析非流式 JSON
    await setupMockApi({ streamOutput: false });
    await mock.config({ stream: false, responseContent: '非流式回复内容。' });
    await page.fill('#__dp-input', '用非流式回复我');
    await page.click('#__dp-send');

    await expect(page.locator('#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content')).toContainText('非流式回复内容。', { timeout: 15000 });
    const { requests } = await mock.requests();
    const chatReq = requests.find(r => r.url.includes('/chat/completions'));
    expect(chatReq.body.stream).toBe(false);
  });

  test('API 错误 → 显示错误信息', async ({ page, mock }) => {
    await mock.config({ failNext: true });
    await page.fill('#__dp-input', '触发错误');
    await page.click('#__dp-send');

    await expect(page.locator('#__dp-chat .__dp-msg.__dp-assistant:not([data-msg-type]) .__dp-bubble-content')).toContainText('Invalid API key', { timeout: 15000 });
  });

  test('快捷按钮（总结全文）→ 发送对应 prompt', async ({ page, mock }) => {
    // 等待 quick actions 渲染
    await page.waitForSelector('#__dp-quick-actions button');
    const labels = await page.locator('#__dp-quick-actions button').allTextContents();
    expect(labels.length).toBe(3);

    await page.locator('#__dp-quick-actions button').first().click(); // 总结全文

    // 用户气泡出现 ≠ 请求已发出（sendMessage 先渲染气泡再发请求），轮询等请求到达
    let chatReq;
    await expect(async () => {
      const { requests } = await mock.requests();
      chatReq = requests.find(r => r.url.includes('/chat/completions'));
      expect(chatReq).toBeTruthy();
    }).toPass({ timeout: 10000 });
    const sentPrompt = chatReq.body.messages[chatReq.body.messages.length - 1].content;
    expect(sentPrompt.length).toBeGreaterThan(10);
    const userBubble = page.locator('#__dp-chat .__dp-msg.__dp-user .__dp-bubble-content');
    await expect(userBubble).toContainText(sentPrompt.trim().slice(0, 20));
  });

  test('连续多轮对话 → 历史消息保留', async ({ page, mock }) => {
    for (const q of ['第一轮问题', '第二轮问题']) {
      await page.fill('#__dp-input', q);
      await page.click('#__dp-send');
      await expect(page.locator(`#__dp-chat .__dp-msg.__dp-user`).last()).toContainText(q);
      // 等 AI 回复完成
      await page.waitForFunction(() => {
        const msgs = document.querySelectorAll('#__dp-chat .__dp-msg');
        return msgs.length >= 2 && !document.querySelector('#__dp-chat .__dp-loading');
      });
    }
    const userMsgs = (await page.locator('#__dp-chat .__dp-msg.__dp-user').allTextContents()).map(s => s.trim());
    expect(userMsgs).toEqual(expect.arrayContaining(['第一轮问题', '第二轮问题']));
  });
});
