// DeepPage providers.js 重构回归测试
// 1. content script 注入 + 面板打开 + quick actions 渲染
// 2. options 页加载 + 提供商下拉框 13 项 + 无 JS 报错
import { chromium } from 'playwright';
import http from 'node:http';

const EXT_PATH = '/Users/dax/codes/deeppage';
const PORT = 18931;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html><head><title>Provider Test Page</title></head><body><h1>Regression Test</h1><p>page content for context extraction</p></body></html>');
});
await new Promise(r => server.listen(PORT, r));

const errors = [];
const context = await chromium.launchPersistentContext('', {
  headless: false,
  viewport: { width: 1600, height: 1000 },
  args: [
    
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
  // 获取扩展 ID（从 service worker URL）
  await page.waitForTimeout(1000);
  let worker = context.serviceWorkers()[0];
  if (!worker) {
    await page.waitForTimeout(1500);
    worker = context.serviceWorkers()[0];
  }
  const extId = worker ? new URL(worker.url()).host : null;
  check('service worker 运行', !!worker, worker ? worker.url() : 'no worker');
  console.log('扩展 ID:', extId);

  // 注入 API Key（quick actions 显示依赖登录状态）
  await worker.evaluate(() => new Promise(r => chrome.storage.sync.set({ apiKey: 'test-key' }, r)));
  await page.reload();
  await page.waitForTimeout(1200);

  // ---- 测试 1: 面板注入 + quick actions ----
  const url = `http://127.0.0.1:${PORT}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);

  const btnExists = await page.evaluate(() => !!document.getElementById('__dp-btn'));
  check('面板按钮注入', btnExists);

  // 打开面板
  await page.evaluate(() => document.getElementById('__dp-btn').click());
  await page.waitForTimeout(800);

  const panelOpen = await page.evaluate(() => document.getElementById('__dp-panel').classList.contains('__dp-open'));
  const quickBtns = await page.evaluate(() => {
    const c = document.getElementById('__dp-quick-actions');
    if (!c) return { hidden: true, labels: [] };
    return { hidden: c.classList.contains('__dp-hidden'), labels: [...c.querySelectorAll('button')].map(b => b.textContent) };
  });
  const ctxTitle = await page.evaluate(() => {
    const el = document.getElementById('__dp-context-title');
    return el ? el.textContent : null;
  });
  check('面板打开', panelOpen);
  check('quick actions 显示', !quickBtns.hidden && quickBtns.labels.length === 3, JSON.stringify(quickBtns.labels));
  check('快捷按钮数量', quickBtns.labels.length === 3, `labels=${JSON.stringify(quickBtns.labels)}`);
  check('页面上下文条', !!ctxTitle && ctxTitle.includes('Provider Test Page'), `title=${ctxTitle}`);
  await page.screenshot({ path: '/tmp/dp-panel-test.png' });

  // ---- 测试 2: options 页 ----
  if (extId) {
    const optPage = await context.newPage();
    optPage.on('pageerror', err => errors.push('[options] ' + err));
    const optErrors = [];
    optPage.on('console', msg => { if (msg.type() === 'error') optErrors.push(msg.text()); });

    await optPage.goto(`chrome-extension://${extId}/options.html`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await optPage.waitForTimeout(1500);

    const providerCount = await optPage.evaluate(() => {
      const sel = document.getElementById('apiProvider');
      return sel ? sel.options.length : -1;
    });
    const title = await optPage.title();
    check('options 页加载', providerCount > 0, `title=${title}`);
    check('提供商下拉框 13 项', providerCount === 13, `count=${providerCount}`);
    check('options 页无 JS 报错', optErrors.length === 0, optErrors.join(' | ') || 'clean');
    await optPage.screenshot({ path: '/tmp/dp-options-test.png' });
    await optPage.close();
  }

  // ---- 汇总 ----
  const passCount = results.filter(r => r.pass).length;
  console.log(`\n===== 结果: ${passCount}/${results.length} 通过 =====`);
  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'} ${r.label} ${r.detail ? '— ' + r.detail : ''}`);
  }
  if (errors.length) {
    console.log('\n===== 页面错误 =====');
    for (const e of errors.slice(0, 10)) console.log('  ⚠️', e.slice(0, 200));
  }
} finally {
  await context.close();
  server.close();
  process.exit(0);
}
