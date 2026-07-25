// ==============================================
// DeepPage — Chat Proxy (MAIN world, runs on chat.deepseek.com)
// Hooks fetch at document_start. Cannot use chrome.* API directly.
// Communicates with chat-bridge.js via window postMessage.
// ==============================================

const API_PATH = '/api/v0/chat/completion';
let pageContext = null;
let contextInjected = false;

// ==============================================
// Listen for context from chat-bridge.js
// ==============================================

window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  if (e.data?.type === '__DP_CONTEXT') {
    pageContext = e.data.payload;
    contextInjected = false;
    showIndicator(pageContext.title);
  }
});

// ==============================================
// UI indicator
// ==============================================

let indicatorEl = null;

function createIndicator() {
  if (indicatorEl) return;
  const el = document.createElement('div');
  el.id = '__dp-indicator';
  el.style.cssText = [
    'position:fixed;z-index:2147483647;top:60px;right:16px;',
    'background:#4A6CF7;color:white;padding:8px 16px;border-radius:20px;',
    'font-size:13px;cursor:default;font-family:-apple-system,system-ui,sans-serif;',
    'box-shadow:0 2px 12px rgba(74,108,247,.3);display:none;align-items:center;gap:6px;',
    'max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
  ].join('');
  el.innerHTML = '🧊 <span id="__dp-indicator-text">加载中...</span>';
  document.body.appendChild(el);
  indicatorEl = el;
}

function showIndicator(title) {
  createIndicator();
  const s = document.getElementById('__dp-indicator-text');
  if (s) s.textContent = `📄 ${title}`;
  indicatorEl.style.display = 'flex';
}

function hideIndicator() {
  if (indicatorEl) indicatorEl.style.display = 'none';
}

// ==============================================
// Hook fetch INLINE (executes before page JS)
// ==============================================

(function() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : (input.url || '');

    if (url.includes(API_PATH) && init?.body && pageContext && !contextInjected) {
      try {
        const body = typeof init.body === 'string'
          ? JSON.parse(init.body)
          : JSON.parse(new TextDecoder().decode(init.body));

        const msgs = body.messages || [];
        if (msgs.length > 0 && msgs[0].role === 'user') {
          const sysMsg = {
            role: 'system',
            content: `你是一个网页助手。用户正在浏览以下网页，请根据网页内容回答。\n\n` +
              `标题: ${pageContext.title}\nURL: ${pageContext.url}\n\n网页全文：\n${pageContext.text}`
          };

          const newBody = JSON.stringify({ ...body, messages: [sysMsg, ...msgs] });
          const newInit = { ...init, body: newBody };

          contextInjected = true;
          hideIndicator();

          return originalFetch(input, newInit);
        }
      } catch {}
    }

    return originalFetch(input, init);
  };
})();

// ==============================================
// Init UI (wait for DOM)
// ==============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => createIndicator());
} else {
  createIndicator();
}
