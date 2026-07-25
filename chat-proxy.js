// ==============================================
// DeepPage — Chat Proxy (runs on chat.deepseek.com)
// MAIN world — hooks fetch to inject page context
// ==============================================

const API_PATH = '/api/v0/chat/completion';
let context = null;          // current page context
let originalFetch = null;    // saved original fetch
let nextContextMsg = null;   // system message to inject

// ==============================================
// UI: injected indicator bar
// ==============================================

let indicatorEl = null;

function createIndicator() {
  if (indicatorEl) return;

  indicatorEl = document.createElement('div');
  indicatorEl.id = '__dp-indicator';
  indicatorEl.style.cssText = [
    'position: fixed',
    'z-index: 2147483647',
    'top: 60px',
    'right: 16px',
    'background: #4A6CF7',
    'color: white',
    'padding: 6px 14px',
    'border-radius: 20px',
    'font-size: 12px',
    'font-family: -apple-system, system-ui, sans-serif',
    'box-shadow: 0 2px 8px rgba(74,108,247,.3)',
    'cursor: pointer',
    'display: none',
    'align-items: center',
    'gap: 6px',
    'max-width: 280px',
    'white-space: nowrap',
    'overflow: hidden',
    'text-overflow: ellipsis',
    'transition: opacity .3s'
  ].join(';');
  indicatorEl.innerHTML = '🧊 <span id="__dp-indicator-text">正在加载...</span>';

  indicatorEl.addEventListener('click', () => {
    clearContext();
  });

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

function clearContext() {
  context = null;
  nextContextMsg = null;
  hideIndicator();
}

// ==============================================
// Hook window.fetch to inject context
// ==============================================

function installFetchHook() {
  if (originalFetch) return; // already hooked
  originalFetch = window.fetch.bind(window);

  const _this = this;

  window.fetch = function(input, init = {}) {
    const url = typeof input === 'string' ? input : (input.url || '');

    // Only intercept DeepSeek completion API calls
    if (url.includes(API_PATH) && init && init.body && nextContextMsg) {
      try {
        const body = JSON.parse(typeof init.body === 'string' ? init.body : new TextDecoder().decode(init.body));
        const messages = body.messages || [];

        // Check if our system message is already injected
        const alreadyInjected = messages.some(m =>
          m.role === 'system' && m.content && m.content.startsWith('【DeepPage】')
        );

        if (!alreadyInjected && messages.length > 0) {
          // Prepend our context as first system message
          const newMessages = [nextContextMsg, ...messages];
          const newBody = JSON.stringify({ ...body, messages: newMessages });

          // Clone init and replace body
          const newInit = { ...init };
          if (typeof init.body === 'string') {
            newInit.body = newBody;
          } else {
            newInit.body = new TextEncoder().encode(newBody);
          }
          return originalFetch(input, newInit);
        }
      } catch (e) {
        // Parsing failed, don't modify
      }
    }

    return originalFetch(input, init);
  };
}

// ==============================================
// Receive page context from extension
// ==============================================

function handleInjectContext(pageContext) {
  context = pageContext;

  // Build the system message to inject
  const formatted = [
    `【DeepPage】你正在帮用户分析一个网页：`,
    ``,
    `标题: ${pageContext.title}`,
    `URL: ${pageContext.url}`,
    ``,
    `以下是网页全文：`,
    pageContext.text
  ].join('\n');

  nextContextMsg = { role: 'system', content: formatted };

  // Show indicator
  showIndicator(pageContext.title);
}

// ==============================================
// Listen for extension messages
// ==============================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'injectContext':
      handleInjectContext(msg.pageContext);
      sendResponse({ ok: true });
      break;

    case 'ping':
      sendResponse({ alive: true, hasContext: !!context });
      break;
  }
});

// ==============================================
// Init
// ==============================================

installFetchHook();
createIndicator();
