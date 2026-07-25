// ==============================================
// DeepPage — Chat Bridge (ISOLATED world, runs on chat.deepseek.com)
// Talks to background.js via chrome.runtime.
// Relays page context to MAIN world via window.postMessage.
// ==============================================

// ==============================================
// Load stored page context and relay to MAIN world
// ==============================================

async function relayContext() {
  try {
    const resp = await chrome.runtime.sendMessage({ action: 'getContext' });
    if (resp?.context) {
      window.postMessage({ type: '__DP_CONTEXT', payload: resp.context }, '*');
    }
  } catch (err) {
    // Background not ready yet
  }
}

// ==============================================
// Listen for setContext from background
// ==============================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'setContext' && msg.pageContext) {
    window.postMessage({ type: '__DP_CONTEXT', payload: msg.pageContext }, '*');
    sendResponse({ ok: true });
    return false;
  }
  if (msg.action === 'ping') {
    sendResponse({ alive: true });
    return false;
  }
});

// ==============================================
// Init
// ==============================================

// Try loading context after a short delay to let page settle
setTimeout(relayContext, 1500);
