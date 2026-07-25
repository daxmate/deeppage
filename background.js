// ==============================================
// DeepPage — Service Worker
// Opens side panel, manages DeepSeek tab, routes messages
// ==============================================

let pendingContext = null;

// ==============================================
// Find or create hidden DeepSeek tab
// ==============================================

async function ensureDeepSeekTab() {
  const tabs = await chrome.tabs.query({ url: 'https://chat.deepseek.com/*' });
  if (tabs.length > 0) return tabs[0].id;

  // Create hidden tab
  const tab = await chrome.tabs.create({
    url: 'https://chat.deepseek.com',
    active: false
  });
  return tab.id;
}

async function waitForBridge(tabId) {
  for (let i = 0; i < 20; i++) {
    try {
      const resp = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      if (resp?.alive) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

// ==============================================
// Get context from side panel
// ==============================================

async function getContextFromSidePanel() {
  const panels = await chrome.tabs.query({ url: chrome.runtime.getURL('sidepanel.html') });
  if (panels.length === 0) return null;

  try {
    const resp = await chrome.tabs.sendMessage(panels[0].id, { action: 'getContext' });
    return resp?.context || null;
  } catch {
    return null;
  }
}

// ==============================================
// Open side panel
// ==============================================

async function openSidePanel(tabId) {
  try {
    await chrome.sidePanel.open({ tabId });
  } catch {
    // sidePanel.open was added in Chrome 116
    // Fallback: open via action click
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html',
      enabled: true
    });
  }
}

// ==============================================
// Message handlers
// ==============================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'openDeepPage':
      handleOpenDeepPage(msg.pageContext, sender.tab?.id)
        .catch(err => console.error('[DeepPage]', err));
      sendResponse({ ok: true });
      return false;

    case 'chat':
      handleChat(msg)
        .then(sendResponse)
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'checkLogin':
      ensureDeepSeekTab().then(async (tabId) => {
        const ready = await waitForBridge(tabId);
        if (!ready) return sendResponse({ loggedIn: false });
        try {
          const resp = await chrome.tabs.sendMessage(tabId, { action: 'checkLogin' });
          sendResponse(resp);
        } catch {
          sendResponse({ loggedIn: false });
        }
      });
      return true;

    case 'openLogin':
      chrome.tabs.create({ url: 'https://chat.deepseek.com', active: true });
      return false;

    case 'getPendingContext':
      const ctx = pendingContext;
      pendingContext = null;
      sendResponse({ context: ctx });
      return false;
  }
});

async function handleOpenDeepPage(pageContext, tabId) {
  pendingContext = pageContext;

  // Open side panel
  if (tabId) {
    await openSidePanel(tabId);
  } else {
    await chrome.sidePanel.open({});
  }
}

async function handleChat(msg) {
  // Find or wait for DeepSeek tab
  const tabId = await ensureDeepSeekTab();
  const ready = await waitForBridge(tabId);
  if (!ready) throw new Error('chat.deepseek.com 尚未加载完成');

  const resp = await chrome.tabs.sendMessage(tabId, {
    action: 'chat',
    question: msg.question,
    pageContext: msg.pageContext
  });
  return resp;
}
