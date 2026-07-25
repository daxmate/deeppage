// ==============================================
// DeepPage — Service Worker
// Routes messages between page content script
// and the chat.deepseek.com proxy.
// ==============================================

// ==============================================
// Tab management
// ==============================================

async function findOrOpenDeepSeekTab() {
  const tabs = await chrome.tabs.query({ url: 'https://chat.deepseek.com/*' });
  if (tabs.length > 0) {
    return tabs[0];
  }
  // Open tab in background
  const tab = await chrome.tabs.create({
    url: 'https://chat.deepseek.com',
    active: false
  });
  return tab;
}

async function waitForProxyReady(tabId, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      if (resp?.alive) return true;
    } catch {
      // Tab not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

// ==============================================
// Message router
// ==============================================

async function handleChat(message) {
  // Find or open chat.deepseek.com tab
  const tab = await findOrOpenDeepSeekTab();
  if (!tab) {
    throw new Error('无法打开 chat.deepseek.com');
  }

  // Wait for proxy to be ready
  const ready = await waitForProxyReady(tab.id);
  if (!ready) {
    throw new Error('chat.deepseek.com 尚未加载完成，请稍后重试');
  }

  // Forward to proxy
  const response = await chrome.tabs.sendMessage(tab.id, {
    action: 'chat',
    pageContext: message.pageContext,
    question: message.question,
    history: message.messages
  });

  return response;
}

// ==============================================
// Message listeners
// ==============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'chat':
      handleChat(message)
        .then(sendResponse)
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'checkLogin':
      // Check if there's a chat.deepseek.com tab open
      chrome.tabs.query({ url: 'https://chat.deepseek.com/*' })
        .then(tabs => {
          sendResponse({ loggedIn: tabs.length > 0, tabCount: tabs.length });
        });
      return true;

    case 'openLogin':
      chrome.tabs.create({ url: 'https://chat.deepseek.com' });
      return false;
  }
});
