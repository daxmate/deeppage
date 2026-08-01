// DeepPage 测试共享 fixtures：扩展 context + mock server 控制
import { test as base, chromium } from 'playwright/test';

const EXT_PATH = process.env.EXT_PATH;
const MOCK_PORT = process.env.MOCK_PORT;
const MOCK_BASE = `http://127.0.0.1:${MOCK_PORT}`;

// 扩展 context fixture（每次测试独立临时 profile）
export const test = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      viewport: { width: 1600, height: 1000 },
      args: [
        '--headless=new',
        `--disable-extensions-except=${EXT_PATH}`,
        `--load-extension=${EXT_PATH}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--autoplay-policy=no-user-gesture-required',
      ],
    });
    await use(context);
    await context.close();
  },

  // 扩展 ID（从 service worker 解析）
  extensionId: async ({ context }, use) => {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 });
    await use(new URL(worker.url()).host);
  },

  // service worker（用于设置 chrome.storage / mock fetch）
  sw: async ({ context }, use) => {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 });
    await use(worker);
  },

  // 配置扩展指向 mock server（custom provider + 本地 baseUrl）
  setupMockApi: async ({ sw }, use) => {
    const apply = async (extra = {}) => {
      await sw.evaluate(({ base, extra }) => new Promise(resolve => {
        chrome.storage.sync.set({
          apiProvider: 'custom',
          apiBaseUrl: base,
          apiType: 'openai',
          apiKey: '***',
          apiModel: 'mock-model',
          ...extra,
        }, resolve);
      }), { base: MOCK_BASE, extra });
    };
    await use(apply);
  },

  // mock server 控制（设置响应/读请求记录）
  mock: async ({}, use) => {
    const api = {
      config: (cfg) => fetch(`${MOCK_BASE}/__mock/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      }),
      requests: async () => (await fetch(`${MOCK_BASE}/__mock/requests`)).json(),
      reset: () => fetch(`${MOCK_BASE}/__mock/reset`, { method: 'POST' }),
    };
    await api.reset();
    await use(api);
    await api.reset();
  },
});

export { expect } from 'playwright/test';
