// ==============================================
// DeepPage — Service Worker
// Opens DeepSeek popup, stores context
// ==============================================

let currentContext = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'openPopup') {
    currentContext = msg.pageContext;

    openPopup(msg.pageContext).catch(err =>
      console.error('[DeepPage] popup error:', err)
    );

    sendResponse({ ok: true });
    return false;
  }

  if (msg.action === 'getContext') {
    sendResponse({ context: currentContext });
    return false;
  }

  if (msg.action === 'ping') {
    sendResponse({ alive: true });
    return false;
  }
});

async function openPopup(pageContext) {
  // Check existing popup
  const existing = await chrome.tabs.query({
    url: 'https://chat.deepseek.com/*',
    windowType: 'popup'
  });

  if (existing.length > 0) {
    const tab = existing[0];
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(tab.id, { active: true });
    // Update context
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'setContext', pageContext });
    } catch {}
    return;
  }

  // Open popup
  const W = 440, H = 620;

  const lastWin = await chrome.windows.getLastFocused();
  const left = (lastWin?.left || 0) + (lastWin?.width || 1200) - W - 20;
  const top = (lastWin?.top || 0) + 60;

  await chrome.windows.create({
    url: 'https://chat.deepseek.com',
    type: 'popup',
    width: W, height: H,
    left: Math.max(left, 0),
    top: Math.max(top, 0)
  });
}
