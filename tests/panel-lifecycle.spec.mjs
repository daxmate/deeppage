// 回归测试：面板开关只切 display，不重复创建 DOM
import { test, expect } from './fixtures.mjs';

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test('面板开关不重复创建 DOM', async ({ page }) => {
  await page.goto(`${MOCK_BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#__dp-btn', { timeout: 15000 });

  // 打开 → 关闭 → 打开 多次
  for (let i = 0; i < 3; i++) {
    await page.click('#__dp-btn');
    await page.waitForTimeout(300);
    const open = await page.evaluate(() => document.getElementById('__dp-panel')?.classList.contains('__dp-open'));
    console.log(`第${i + 1}次打开: panelOpen=${open}`);
    await page.click('#__dp-close');
    await page.waitForTimeout(300);
  }

  const info = await page.evaluate(() => ({
    panelCount: document.querySelectorAll('#__dp-panel').length,
    btnCount: document.querySelectorAll('#__dp-btn').length,
    panelInDom: !!document.getElementById('__dp-panel'),
  }));
  console.log('DOM 状态:', JSON.stringify(info));
  expect(info.panelCount).toBe(1);
  expect(info.btnCount).toBe(1);
});
