// ==============================================
// DeepPage — Service Worker
// Routes: content.js ↔ chat-proxy.js
// ==============================================

// ==============================================
// Find the hidden chat.deepseek.com tab
// ==============================================

async function findDeepSeekTab() {
  const tabs = await chrome.tabs.query({ url: 'https://chat.deepseek.com/*' });
  if (tabs.length > 0) return tabs[0];

  // Open a hidden tab in the background
  const tab = await chrome.tabs.create({
    url: 'https://chat.deepseek.com',
    active: false  // don't steal focus
  });
  return tab;
}

// ==============================================
// Wait for proxy to be ready
// ==============================================

async function waitForProxy(tabId, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const resp = await chrome.tabs.sendMessage(tabId, { action: 'loginCheck' });
      if (resp && typeof resp.loggedIn === 'boolean') return resp;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return { loggedIn: false };
}

// ==============================================
// Handlers
// ==============================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'chat':
      handleChat(msg).then(sendResponse).catch(err => sendResponse({ error: err.message }));
      return true;

    case 'loginCheck':
      // Check if proxy is available
      chrome.tabs.query({ url: 'https://chat.deepseek.com/*' })
        .then(tabs => sendResponse({ loggedIn: tabs.length > 0 }))
        .catch(() => sendResponse({ loggedIn: false }));
      return true;
  }
});

async function handleChat(msg) {
  const tab = await findDeepSeekTab();
  if (!tab) throw new Error('无法打开 chat.deepseek.com');

  const status = await waitForProxy(tab.id);
  if (!status.loggedIn) {
    throw new Error('未检测到登录状态。请在 chat.deepseek.com 上登录并发送一条消息');
  }

  const resp = await chrome.tabs.sendMessage(tab.id, {
    action: 'chat',
    pageContext: msg.pageContext,
    question: msg.question
  });

  return resp;
}
