// ==============================================
// DeepPage — Chat Proxy (runs on chat.deepseek.com)
// MAIN world — hooks fetch to inject page context
// ==============================================

const API_PATH = '/api/v0/chat/completion';
let pageContext = null;     // stored page to analyze
let contextInjected = false; // already injected this session?

// ==============================================
// UI indicator on DeepSeek page
// ==============================================

let indicatorEl = null;

function createIndicator() {
  if (indicatorEl) return;

  indicatorEl = document.createElement('div');
  indicatorEl.id = '__dp-indicator';
  indicatorEl.style.cssText = [
    'position: fixed; z-index: 2147483647; top: 60px; right: 16px;',
    'background: #4A6CF7; color: white; padding: 8px 16px;',
    'border-radius: 20px; font-size: 13px; cursor: default;',
    'font-family: -apple-system, system-ui, sans-serif;',
    'box-shadow: 0 2px 12px rgba(74,108,247,.3);',
    'display: none; align-items: center; gap: 6px;',
    'max-width: 260px; white-space: nowrap; overflow: hidden;',
    'text-overflow: ellipsis;'
  ].join('');
  indicatorEl.innerHTML = '🧊 <span id="__dp-indicator-text">加载中...</span>';
  document.body.appendChild(indicatorEl);
}

function showIndicator(title) {
  createIndicator();
  const span = document.getElementById('__dp-indicator-text');
  if (span) span.textContent = `📄 ${title}`;
  indicatorEl.style.display = 'flex';
}

function hideIndicator() {
  if (indicatorEl) indicatorEl.style.display = 'none';
}

// ==============================================
// Hook fetch to inject page context
// ==============================================

const originalFetch = window.fetch.bind(window);

window.fetch = function(input, init) {
  const url = typeof input === 'string' ? input : (input.url || '');

  // Only intercept DeepSeek completion API calls
  if (url.includes(API_PATH) && init?.body && pageContext && !contextInjected) {
    try {
      const body = typeof init.body === 'string'
        ? JSON.parse(init.body)
        : JSON.parse(new TextDecoder().decode(init.body));

      const msgs = body.messages || [];
      if (msgs.length === 0) return originalFetch(input, init);

      // Inject page context as system message before user messages
      const systemMsg = {
        role: 'system',
        content: `你是一个网页助手。用户正在浏览以下网页，请根据网页内容回答。\n\n` +
          `标题: ${pageContext.title}\nURL: ${pageContext.url}\n\n` +
          `网页全文：\n${pageContext.text}`
      };

      const newBody = JSON.stringify({ ...body, messages: [systemMsg, ...msgs] });
      const newInit = { ...init, body: newBody };

      contextInjected = true;
      hideIndicator();

      return originalFetch(input, newInit);
    } catch (e) {
      console.warn('[DeepPage] inject failed:', e);
    }
  }

  return originalFetch(input, init);
};

// ==============================================
// Receive page context
// ==============================================

function setPageContext(ctx) {
  pageContext = ctx;
  contextInjected = false;
  showIndicator(ctx.title);
}

// ==============================================
// Read context from background
// ==============================================

async function loadContext() {
  try {
    const resp = await chrome.runtime.sendMessage({ action: 'getContext' });
    if (resp?.context) {
      setPageContext(resp.context);
    }
  } catch {}
}

// ==============================================
// Listen for messages from background
// ==============================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'setContext':
      if (msg.pageContext) setPageContext(msg.pageContext);
      sendResponse({ ok: true });
      break;

    case 'ping':
      sendResponse({ alive: true });
      break;
  }
});

// ==============================================
// Init
// ==============================================

createIndicator();
setTimeout(loadContext, 1000); // try loading context after page stabilizes
