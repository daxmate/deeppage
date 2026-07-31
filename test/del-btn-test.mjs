// DeepPage 消息删除按钮测试
// 打开面板 → 欢迎消息(skipTrack) + 发送产生 user + error assistant
// 1. 所有消息都有删除按钮
// 2. hover 显示删除按钮
// 3. 删除欢迎消息 → 只删 DOM，数组/存储不动（skipTrack 不追踪）
// 4. 删除 user 消息 → DOM 和 storage 同步
// 5. 删空（仅剩 assistant）→ 对话从 storage 移除
import { chromium } from '/Users/dax/Library/pnpm/global/5/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.mjs';
import http from 'node:http';

const EXT_PATH = '/Users/dax/codes/deeppage';
const CHROME = '/Users/dax/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const PORT = 18925;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html><head><title>Del Test</title></head><body><h1>Hello</h1></body></html>');
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

const readStorage = async () => {
  let worker = context.serviceWorkers()[0];
  if (!worker) { await page.waitForTimeout(800); worker = context.serviceWorkers()[0]; }
  return worker
    ? worker.evaluate(() => new Promise(resolve => {
        chrome.storage.local.get('deeppage_convs', r => resolve(r.deeppage_convs));
      }))
    : null;
};

const domInfo = () => page.evaluate(() => {
  return Array.from(document.querySelectorAll('#__dp-chat .__dp-msg')).map(m => ({
    role: m.className.includes('__dp-user') ? 'user' : 'assistant',
    isWelcome: m.dataset.msgType === 'context-loaded',
  }));
});

try {
  // 预置 API key，避免输入框被登录提示禁用
  let worker = context.serviceWorkers()[0];
  if (!worker) { await page.waitForTimeout(1000); worker = context.serviceWorkers()[0]; }
  if (worker) {
    await worker.evaluate(() => new Promise(resolve => {
      chrome.storage.sync.set({ apiKey: 'sk-test-invalid-key-for-ui-test' }, resolve);
    }));
  }

  const url = `http://127.0.0.1:${PORT}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(1500);

  // 打开面板（产生欢迎消息）
  const btnBox = await page.locator('#__dp-btn').boundingBox();
  await page.mouse.click(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
  await page.waitForTimeout(800);
  const panelOpen = await page.evaluate(() => document.getElementById('__dp-panel')?.classList.contains('__dp-open'));
  check('面板打开', panelOpen === true, `panelOpen=${panelOpen}`);

  // 发送消息（无有效 key → 产生 user + error 两条）
  await page.fill('#__dp-input', 'hello delete test');
  await page.click('#__dp-send');
  await page.waitForTimeout(3000);

  const msgs1 = await domInfo();
  console.log('  消息列表:', JSON.stringify(msgs1));
  check('共 3 条消息（欢迎+user+error）', msgs1.length === 3, `count=${msgs1.length}`);

  // 每条消息都有删除按钮
  const btnInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#__dp-chat .__dp-msg')).map(m => ({
      hasDel: !!m.querySelector('.__dp-del-btn'),
      hasCopy: !!m.querySelector('.__dp-copy-btn'),
    }));
  });
  check('每条消息都有删除按钮', btnInfo.every(b => b.hasDel), JSON.stringify(btnInfo));
  check('assistant 消息有复制+删除', btnInfo[0].hasCopy && btnInfo[0].hasDel, JSON.stringify(btnInfo[0]));

  // hover 显示删除按钮
  const delBtn = page.locator('#__dp-chat .__dp-msg').nth(0).locator('.__dp-del-btn');
  const opacityBefore = await delBtn.evaluate(el => getComputedStyle(el).opacity);
  await page.hover('#__dp-chat .__dp-msg >> nth=0');
  await page.waitForTimeout(300);
  const opacityAfter = await delBtn.evaluate(el => getComputedStyle(el).opacity);
  console.log(`  hover opacity: ${opacityBefore} -> ${opacityAfter}`);
  check('hover 显示删除按钮', Number(opacityBefore) < 0.5 && Number(opacityAfter) > 0.5, `${opacityBefore} -> ${opacityAfter}`);

  // 删除欢迎消息（第 0 条）→ DOM 少 1，数组/存储不变（欢迎消息不入数组，且 error 消息本就未持久化）
  await page.hover('#__dp-chat .__dp-msg >> nth=0');
  await page.click('#__dp-chat .__dp-msg >> nth=0 >> .__dp-del-btn');
  await page.waitForTimeout(800);

  const msgs2 = await domInfo();
  const storage1 = await readStorage();
  const storedMsgs1 = storage1?.conversations?.[0]?.messages ?? [];
  console.log(`  删欢迎消息后: DOM=${msgs2.length}, storage=${storedMsgs1.length}`);
  check('删除欢迎消息后 DOM 剩 2 条', msgs2.length === 2, `count=${msgs2.length}`);
  // 欢迎消息不在数组中：删除它不影响 storage（storage 仍只有 user 1 条）
  check('欢迎消息删除不影响存储', storedMsgs1.length === 1 && storedMsgs1[0].role === 'user',
    `storage=${JSON.stringify(storedMsgs1.map(m => m.role))}`);

  // 删除 user 消息（现在第 0 条）→ DOM 剩 error assistant；storage 保存为 error 消息
  await page.hover('#__dp-chat .__dp-msg >> nth=0');
  await page.click('#__dp-chat .__dp-msg >> nth=0 >> .__dp-del-btn');
  await page.waitForTimeout(800);

  const msgs3 = await domInfo();
  const storage2 = await readStorage();
  const storedMsgs2 = storage2?.conversations?.[0]?.messages ?? [];
  console.log(`  删 user 后: DOM=${msgs3.length}, storage=${storedMsgs2.length}, role=${msgs3[0]?.role}`);
  check('删除 user 后 DOM 剩 1 条', msgs3.length === 1, `count=${msgs3.length}`);
  check('剩下的是 assistant 消息', msgs3[0]?.role === 'assistant', JSON.stringify(msgs3[0]));
  check('删 user 后 storage 剩 1 条 assistant', storedMsgs2.length === 1 && storedMsgs2[0].role === 'assistant',
    `storage=${JSON.stringify(storedMsgs2.map(m => m.role))}`);

  // 删除最后一条 → 空对话从 storage 移除
  await page.hover('#__dp-chat .__dp-msg >> nth=0');
  await page.click('#__dp-chat .__dp-msg >> nth=0 >> .__dp-del-btn');
  await page.waitForTimeout(800);

  const msgCount4 = await page.evaluate(() => document.querySelectorAll('#__dp-chat .__dp-msg').length);
  const storage3 = await readStorage();
  const convsAfter = storage3?.conversations?.length ?? -1;
  console.log(`  删空后: DOM=${msgCount4}, conversations=${convsAfter}`);
  check('删空后 DOM 无消息', msgCount4 === 0, `count=${msgCount4}`);
  check('空对话从 storage 移除', convsAfter === 0, `conversations=${convsAfter}`);

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
