// ==============================================
// DeepPage — Service Worker
// Opens DeepSeek popup, routes messages
// ==============================================

// ==============================================
// Open DeepSeek as a popup window
// ==============================================

async function openPopup(pageContext) {
  // Store context in session for chat-proxy.js
  await chrome.storage.session.set({ deeppage_context: pageContext });

  const W = 440, H = 620;

  // Check if we already have a DeepPage popup open
  const existing = await chrome.tabs.query({
    url: 'https://chat.deepseek.com/*',
    windowType: 'popup'
  });

  if (existing.length > 0) {
    // Focus existing popup
    await chrome.windows.update(existing[0].windowId, { focused: true });
    await chrome.tabs.update(existing[0].id, { active: true });
    // Update its context
    await chrome.tabs.sendMessage(existing[0].id, {
      action: 'setContext',
      pageContext
    }).catch(() => {});
    return;
  }

  // Open new popup
  await chrome.windows.create({
    url: 'https://chat.deepseek.com',
    type: 'popup',
    width: W,
    height: H,
    left: 980,
    top: 60
  });
}

// ==============================================
// Request page context (for chat-proxy.js)
// ==============================================

async function getStoredContext() {
  const { deeppage_context } = await chrome.storage.session.get('deeppage_context');
  return deeppage_context || null;
}

// ==============================================
// Message handlers
// ==============================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'openDeepSeekPopup':
      chrome.storage.session.get('deeppage_context').then(({ deeppage_context }) => {
        if (deeppage_context) {
          openPopup(deeppage_context);
        }
      });
      sendResponse({ ok: true });
      return false;

    case 'getContext':
      // Used by chat-proxy.js to read stored page context
      getStoredContext().then(ctx => sendResponse({ context: ctx }));
      return true;

    case 'clearContext':
      chrome.storage.session.remove('deeppage_context');
      sendResponse({ ok: true });
      return false;
  }
});
