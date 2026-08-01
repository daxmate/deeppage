// 选中文本浮动按钮测试：显示 / SPA 导航清理 / 重建 / popstate 清理
import { test, expect } from './fixtures.mjs';

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test.describe('选中文本按钮', () => {
  test('选中显示，SPA 导航移除，再次选中重建，后退清理', async ({ page }) => {
    await page.goto(`${MOCK_BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#__dp-btn', { timeout: 15000 });

    const selectText = () => page.evaluate(() => {
      const el = document.getElementById('target');
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 60, clientY: 60 }));
    });
    const btnShown = () => page.evaluate(() => {
      const b = document.getElementById('__dp-sel-btn');
      return b ? b.classList.contains('__dp-show') : false;
    });
    const btnExists = () => page.evaluate(() => !!document.getElementById('__dp-sel-btn'));

    // 1. 选中文本 → 按钮显示
    await selectText();
    await page.waitForTimeout(600);
    expect(await btnShown()).toBe(true);

    // 2. pushState（SPA 导航）→ 按钮移除
    await page.evaluate(() => history.pushState({}, '', '/page2'));
    await page.waitForTimeout(400);
    expect(await btnExists()).toBe(false);

    // 3. 再次选中 → 按钮重建
    await selectText();
    await page.waitForTimeout(600);
    expect(await btnShown()).toBe(true);

    // 4. popstate（后退）→ 按钮清理
    await page.evaluate(() => window.history.back());
    await page.waitForTimeout(400);
    expect(await btnExists()).toBe(false);
  });
});
