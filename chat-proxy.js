// ==============================================
// DeepPage — Chat Proxy (MAIN world, runs on chat.deepseek.com)
// Receives page context, fills into the chat input.
// ==============================================

let pageContext = null;

// Listen for context from chat-bridge.js
window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  if (e.data?.type === '__DP_CONTEXT') {
    pageContext = e.data.payload;
    injectContext();
  }
});

// ==============================================
// Inject page context into DeepSeek's chat input
// ==============================================

function injectContext() {
  if (!pageContext) return;

  // Find the chat textarea (try multiple selectors)
  const textarea = findInput();
  if (!textarea) {
    // Page might not be fully loaded yet
    setTimeout(injectContext, 1000);
    return;
  }

  // Build the message to send
  const msg = `你是一个网页助手。用户正在浏览以下网页，请根据网页内容回答。\n\n` +
    `网页标题: ${pageContext.title}\nURL: ${pageContext.url}\n\n` +
    `网页全文：\n${pageContext.text}\n\n` +
    `---\n请先简要总结一下这个网页的主要内容。`;

  // Programmatically set and trigger input
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  ).set;
  nativeSetter.call(textarea, msg);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));

  // Show indicator
  showIndicator(pageContext.title);
}

function findInput() {
  return document.querySelector('textarea') ||
    document.querySelector('[contenteditable="true"]') ||
    document.querySelector('[role="textbox"]');
}

// ==============================================
// Send the message (click the send button)
// ==============================================

function clickSend() {
  const btn = document.querySelector('button[type="submit"]') ||
    document.querySelector('[data-testid="send-button"]') ||
    Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('发送') || b.innerHTML.includes('➤') || b.innerHTML.includes('→') || b.innerHTML.includes('>')
    );

  if (btn) {
    setTimeout(() => btn.click(), 300);
  }
}

// Also send after a brief delay (for DeepSeek to process the input)
let firstInject = true;
const origInject = injectContext;
injectContext = function() {
  origInject();
  if (firstInject && pageContext) {
    firstInject = false;
    setTimeout(clickSend, 500);
  }
};

// ==============================================
// UI indicator
// ==============================================

let indicatorEl = null;

function showIndicator(title) {
  if (indicatorEl) return;
  const el = document.createElement('div');
  el.id = '__dp-indicator';
  el.style.cssText = [
    'position:fixed;z-index:2147483647;top:60px;right:16px;',
    'background:#4A6CF7;color:white;padding:8px 16px;border-radius:20px;',
    'font-size:13px;cursor:default;font-family:-apple-system,system-ui,sans-serif;',
    'box-shadow:0 2px 12px rgba(74,108,247,.3);display:flex;align-items:center;gap:6px;',
    'max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
  ].join('');
  el.innerHTML = `🧊 📄 ${title ? title.slice(0, 20) : '已加载'}`;
  document.body.appendChild(el);
  indicatorEl = el;
}

// ==============================================
// Init
// ==============================================

// Retry injection every few seconds until the page is ready
const retryInterval = setInterval(() => {
  if (pageContext && findInput()) {
    injectContext();
    clearInterval(retryInterval);
  }
}, 2000);

// Stop retrying after 30 seconds
setTimeout(() => clearInterval(retryInterval), 30000);
