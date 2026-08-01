// DeepPage 选中文本按钮 SPA 清理测试
// 1. 选中文本 → 按钮显示
// 2. history.pushState（模拟 SPA 导航）→ 按钮被移除
// 3. 再次选中 → 按钮重建
import { chromium } from 'playwright';
import http from 'node:http';

const EXT_PATH = '/Users/dax/codes/deeppage';
const PORT = 18935;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html><head><title>SPA Test</title></head><body><p id="target">Hello SPA world, select this text</p><div id="app"></div></body></html>');
});
await new Promise(r => server.listen(PORT, r));

const context = await chromium.launchPersistentContext('', {
  headless: false,
  executablePath: undefined,
  viewport: { width: 1400, height: 900 },
  args: [
    '--headless=new',
    `--disable-extensions-except=${EXT_PATH}`,
    `--load-extension=${EXT_PATH}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
});
const page = await context.newPage();
const results = [];
const check = (label, pass, detail) => { results.push({ label, pass, detail }); };

try {
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);

  // 1. 模拟选中文本 + mouseup → 按钮出现
  await page.evaluate(() => {
    const el = document.getElementById('target');
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 60, clientY: 60 }));
  });
  await page.waitForTimeout(600);
  const shown = await page.evaluate(() => {
    const b = document.getElementById('__dp-sel-btn');
    return b ? b.classList.contains('__dp-show') : false;
  });
  check('选中文本后按钮显示', shown);

  // 2. SPA 导航（pushState）→ 按钮应被清理
  await page.evaluate(() => history.pushState({}, '', '/page2'));
  await page.waitForTimeout(400);
  const afterNav = await page.evaluate(() => !!document.getElementById('__dp-sel-btn'));
  check('pushState 后按钮已移除', !afterNav, `exists=${afterNav}`);

  // 3. 再次选中 → 按钮重建
  await page.evaluate(() => {
    const el = document.getElementById('target');
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 60, clientY: 60 }));
  });
  await page.waitForTimeout(600);
  const recreated = await page.evaluate(() => {
    const b = document.getElementById('__dp-sel-btn');
    return b ? b.classList.contains('__dp-show') : false;
  });
  check('再次选中后按钮重建', recreated);

  // 4. popstate（浏览器后退）→ 按钮清理
  await page.evaluate(() => window.history.back());
  await page.waitForTimeout(400);
  const afterBack = await page.evaluate(() => !!document.getElementById('__dp-sel-btn'));
  check('popstate 后按钮清理', !afterBack, `exists=${afterBack}`);

  const passCount = results.filter(r => r.pass).length;
  console.log(`\n===== 结果: ${passCount}/${results.length} 通过 =====`);
  for (const r of results) console.log(`${r.pass ? '✅' : '❌'} ${r.label} ${r.detail ? '— ' + r.detail : ''}`);
} finally {
  await context.close();
  server.close();
  process.exit(0);
}
