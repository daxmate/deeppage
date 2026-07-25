// ==============================================
// DeepPage — Service Worker
// Routes: content script ↔ chat.deepseek.com proxy
// ==============================================

// ==============================================
// Find or activate DeepSeek tab
// ==============================================

async function ensureDeepSeekTab() {
  const tabs = await chrome.tabs.query({ url: 'https://chat.deepseek.com/*' });
  if (tabs.length > 0) {
    // Activate existing tab
    const tab = tabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
    return tab;
  }
  // Open new tab
  const tab = await chrome.tabs.create({ url: 'https://chat.deepseek.com', active: true });
  return tab;
}

// ==============================================
// Wait for proxy to be ready on the tab
// ==============================================

async function waitForProxy(tabId, retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const resp = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      if (resp?.alive) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

// ==============================================
// Message handlers
// ==============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendToDeepSeek') {
    handleSendToDeepSeek(message.pageContext).catch(err => {
      console.error('[DeepPage] Failed:', err);
    });
    sendResponse({ ok: true });
    return false;
  }

  if (message.action === 'ping') {
    sendResponse({ alive: true });
    return false;
  }
});

async function handleSendToDeepSeek(pageContext) {
  // Get or open DeepSeek tab
  const tab = await ensureDeepSeekTab();
  if (!tab) throw new Error('Cannot open chat.deepseek.com');

  // Wait for proxy to load
  await waitForProxy(tab.id);

  // Tell proxy to inject context
  await chrome.tabs.sendMessage(tab.id, {
    action: 'injectContext',
    pageContext
  });
}
