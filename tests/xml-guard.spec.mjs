// XML/SVG 页面守卫测试：HTML 注入，SVG/XML 跳过且无语法错误
import { test, expect } from './fixtures.mjs';

const MOCK_BASE = `http://127.0.0.1:${process.env.MOCK_PORT}`;

test.describe('XML/SVG 页面守卫', () => {
  test('HTML 页面正常注入按钮', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(`${MOCK_BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#__dp-btn', { timeout: 15000 });
    // 无 XML 语法错误
    expect(errors.filter(e => /invalid XML|SyntaxError/i.test(e))).toEqual([]);
  });

  test('SVG 页面跳过注入且无语法错误', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(`${MOCK_BASE}/test.svg`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500); // 等 content script 执行完
    const injected = await page.evaluate(() => !!document.getElementById('__dp-btn'));
    expect(injected).toBe(false);
    expect(errors.filter(e => /invalid XML|SyntaxError/i.test(e))).toEqual([]);
  });

  test('XML 页面跳过注入且无语法错误', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(`${MOCK_BASE}/test.xml`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500); // 等 content script 执行完
    const injected = await page.evaluate(() => !!document.getElementById('__dp-btn'));
    expect(injected).toBe(false);
    expect(errors.filter(e => /invalid XML|SyntaxError/i.test(e))).toEqual([]);
  });
});
