// DeepPage 悬浮按钮拖拽 + 位置记忆测试
// 1. 按钮出现在 HTML 页面
// 2. 拖拽后位置变化
// 3. 位置写入 chrome.storage.sync (btnPos)
// 4. 刷新页面后位置恢复
import { chromium } from '/Users/dax/Library/pnpm/global/5/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.mjs';
import http from 'node:http';

const EXT_PATH = '/Users/dax/codes/deeppage';
const CHROME = '/Users/dax/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const PORT = 18924;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html><head><title>Drag Test</title></head><body><h1>Hello</h1><p style="height:2000px">scroll space</p></body></html>');
});
await new Promise(r => server.listen(PORT, r));

const errors = [];
const context = await chromium.launchPersistentContext('', {
  headless: false,
  executablePath: CHROME,
  viewport: { width: 1600, height: 1000 },
  args: [
    '--headless=new',
    `--disable-extensions-except=${EXT_PATH}`,
    `--load-extension=${EXT_PATH}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
});
const page = await context.newPage();
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(String(err)));

const results = [];
const check = (label, pass, detail) => { results.push({ label, pass, detail }); };

try {
  const url = `http://127.0.0.1:${PORT}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);

  // 1. 按钮存在且默认右下角定位
  const btnExists = await page.evaluate(() => !!document.getElementById('__dp-btn'));
  check('按钮注入', btnExists, `exists=${btnExists}`);

  // 2. 读取默认位置
  const before = await page.evaluate(() => {
    const b = document.getElementById('__dp-btn');
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: r.width, h: r.height };
  });
  console.log('  默认位置:', JSON.stringify(before));

  // 3. 拖拽到新位置 (从中心拖 +150, +120)
  const cx = before.x + before.w / 2, cy = before.y + before.h / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 150, cy + 120, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  const after = await page.evaluate(() => {
    const b = document.getElementById('__dp-btn');
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top) };
  });
  console.log('  拖拽后位置:', JSON.stringify(after));
  check('拖拽后位置变化', after.x !== before.x || after.y !== before.y,
    `before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);

  // 4. storage 里有 btnPos（通过扩展 service worker 读取，页面主世界无 chrome API）
  let worker = context.serviceWorkers()[0];
  if (!worker) {
    await page.waitForTimeout(1000);
    worker = context.serviceWorkers()[0];
  }
  const stored = worker
    ? await worker.evaluate(() => new Promise(resolve => chrome.storage.sync.get('btnPos', r => resolve(r.btnPos))))
    : null;
  console.log('  storage btnPos:', JSON.stringify(stored));
  check('位置写入 storage', !!stored && typeof stored.x === 'number' && typeof stored.y === 'number',
    `btnPos=${JSON.stringify(stored)}`);

  // 5. 刷新页面 → 位置恢复
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);
  const restored = await page.evaluate(() => {
    const b = document.getElementById('__dp-btn');
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top) };
  });
  console.log('  刷新后位置:', JSON.stringify(restored));
  const closeEnough = Math.abs(restored.x - after.x) <= 2 && Math.abs(restored.y - after.y) <= 2;
  check('刷新后位置恢复', closeEnough, `expected=${JSON.stringify(after)} got=${JSON.stringify(restored)}`);

  // 6. 点击（非拖拽）仍能打开面板
  await page.mouse.click(after.x + 28, after.y + 28);
  await page.waitForTimeout(500);
  const panelOpen = await page.evaluate(() => document.getElementById('__dp-panel')?.classList.contains('__dp-open'));
  check('点击仍可打开面板', panelOpen === true, `panelOpen=${panelOpen}`);

} catch (e) {
  check('运行异常', false, String(e));
} finally {
  await context.close();
  server.close();
}

for (const r of results) {
  console.log(`\n[${r.pass ? 'PASS' : 'FAIL'}] ${r.label}`);
  if (r.detail) console.log(`  ${r.detail}`);
}
const pageErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
if (pageErrors.length) console.log(`\n⚠️ console/page errors: ${JSON.stringify(pageErrors, null, 2)}`);
const allPass = results.every(r => r.pass) && pageErrors.length === 0;
console.log(`\n===== ${allPass ? '全部通过 ✅' : '存在失败 ❌'} =====`);
process.exit(allPass ? 0 : 1);
