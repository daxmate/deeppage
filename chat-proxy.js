// ==============================================
// DeepPage — Chat Proxy (runs on chat.deepseek.com)
// Makes API calls from the DeepSeek domain,
// leveraging the user's browser session cookies.
// ==============================================

const API_ENDPOINTS = [
  'https://chat.deepseek.com/api/v0/chat/completions',
  'https://chat.deepseek.com/api/chat',
  'https://api.deepseek.com/v1/chat/completions'
];

let cachedEndpoint = null;

// ==============================================
// API call
// ==============================================

async function callDeepSeekAPI(pageContext, question, history) {
  const messages = [
    {
      role: 'system',
      content: `你是一个网页助手。用户正在浏览一个网页，以下是网页内容。请根据这些内容回答用户的问题。\n\n${pageContext}`
    },
    ...(history || []).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question }
  ];

  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages,
    stream: false
  });

  // Try cached endpoint first, then fallback
  const endpoints = cachedEndpoint
    ? [cachedEndpoint, ...API_ENDPOINTS.filter(e => e !== cachedEndpoint)]
    : API_ENDPOINTS;

  let lastError = null;

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body,
        credentials: 'include'  // critical: send cookies
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        // If it's HTML (SPA page), skip this endpoint
        if (text.trimStart().startsWith('<!')) {
          lastError = new Error('端点返回页面而非 API (可能是 SPA 路由)');
          continue;
        }
        throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
      }

      const data = await resp.json();

      // Cache the working endpoint
      cachedEndpoint = url;
      chrome.storage.sync.set({ deepseekEndpoint: url });

      // Extract reply text (handle multiple response formats)
      const reply = data.choices?.[0]?.message?.content ||
        data.message?.content ||
        data.response ||
        data.text ||
        JSON.stringify(data);

      return { text: reply };

    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('所有 API 端点均失败');
}

// ==============================================
// Listen for messages from background
// ==============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'chat':
      callDeepSeekAPI(message.pageContext, message.question, message.history)
        .then(sendResponse)
        .catch(err => sendResponse({ error: err.message }));
      return true;  // keep channel open for async

    case 'ping':
      sendResponse({ alive: true });
      return false;
  }
});

// ==============================================
// Init: restore cached endpoint
// ==============================================

chrome.storage.sync.get('deepseekEndpoint', (result) => {
  if (result.deepseekEndpoint) {
    cachedEndpoint = result.deepseekEndpoint;
  }
});

// Export endpoint info for debugging
window.__DEEPPAGE_ENDPOINT = cachedEndpoint;
