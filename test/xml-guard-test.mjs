// DeepPage XML 守卫测试
// 1. HTML 页面 → 扩展正常注入 #__dp-btn，无报错
// 2. SVG (image/svg+xml) 页面 → 不注入，无 SyntaxError
// 3. XML (application/xml) 页面 → 不注入，无 SyntaxError
import { chromium } from '/Users/dax/Library/pnpm/global/5/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.mjs';
import http from 'node:http';

const EXT_PATH = '/Users/dax/codes/deeppage';
const PORT = 18923;

const server = http.createServer((req, res) => {
  if (req.url === '/test.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!DOCTYPE html><html><head><title>HTML Page</title></head><body><h1>Hello</h1></body></html>');
  } else if (req.url === '/test.svg') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>');
  } else if (req.url === '/test.xml') {
    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end('<?xml version="1.0"?><root><item>hello</item></root>');
  } else {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise(r => server.listen(PORT, r));

const CHROME = '/Users/dax/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const results = [];
async function check(url, expectInjected, label) {
  const errors = [];
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    executablePath: CHROME,
    args: [
      '--headless=new',
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });
  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(String(err)));

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1500); // 等 content script 执行完
    const injected = await page.evaluate(() => !!document.getElementById('__dp-btn'));
    const xmlSyntaxErr = errors.some(e => e.includes('invalid XML') || e.includes('SyntaxError'));
    results.push({
      label,
      url,
      injected,
      expectInjected,
      pass: injected === expectInjected && !xmlSyntaxErr,
      errors,
    });
  } catch (e) {
    results.push({ label, url, injected: null, expectInjected, pass: false, errors: [String(e)] });
  } finally {
    await context.close();
  }
}

await check(`http://127.0.0.1:${PORT}/test.html`, true, 'HTML 页面（应注入）');
await check(`http://127.0.0.1:${PORT}/test.svg`, false, 'SVG 页面（应跳过）');
await check(`http://127.0.0.1:${PORT}/test.xml`, false, 'XML 页面（应跳过）');

server.close();

for (const r of results) {
  console.log(`\n[${r.pass ? 'PASS' : 'FAIL'}] ${r.label} (${r.url})`);
  console.log(`  injected=${r.injected} (期望 ${r.expectInjected})`);
  if (r.errors.length) console.log(`  console/page errors: ${JSON.stringify(r.errors, null, 2)}`);
}
const allPass = results.every(r => r.pass);
console.log(`\n===== ${allPass ? '全部通过 ✅' : '存在失败 ❌'} =====`);
process.exit(allPass ? 0 : 1);
