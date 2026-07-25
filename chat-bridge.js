// ==============================================
// DeepPage — Chat Bridge (ISOLATED world)
// Talks to background, sends context to MAIN world
// ==============================================

async function relayContext() {
  try {
    const resp = await chrome.runtime.sendMessage({ action: 'getContext' });
    if (resp?.context) {
      window.postMessage({ type: '__DP_CONTEXT', payload: resp.context }, '*');
    }
  } catch {}
}

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

setTimeout(relayContext, 2000);
