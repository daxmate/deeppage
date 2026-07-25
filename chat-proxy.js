// ==============================================
// DeepPage — Chat Proxy (runs on chat.deepseek.com)
// MAIN world — extracts Bearer token, makes API calls
// ==============================================

const API_URL = 'https://chat.deepseek.com/api/v0/chat/completion';
let capturedHeaders = {};

// ==============================================
// Extract Bearer token from page internals
// ==============================================

function extractBearerToken() {
  // Scan all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw.length < 20) continue;

      // Try as JSON (Supabase auth token)
      const parsed = JSON.parse(raw);
      if (parsed.access_token && parsed.access_token.length > 20) {
        return parsed.access_token;
      }
      if (parsed.token && parsed.token.length > 20) {
        return parsed.token;
      }
      // Supabase format: { currentSession: { access_token: ... } }
      if (parsed.currentSession?.access_token) {
        return parsed.currentSession.access_token;
      }
    } catch {
      // Not JSON, try as plain token string
      if (key.includes('token') || key.includes('auth') || key.includes('session')) {
        // Could be a JWT
        const parts = key.split('.');
        if (parts.length === 3) return key; // JWT
      }
    }
  }
  return null;
}

// ==============================================
// Hook fetch to capture auth headers
// ==============================================

const originalFetch = window.fetch.bind(window);

window.fetch = function(input, init) {
  const url = typeof input === 'string' ? input : (input.url || '');

  // Capture headers from DeepSeek's own API requests
  if (url.includes('/api/v0/chat/completion') && init?.headers) {
    const h = init.headers;
    const auth = h.Authorization || h.authorization;
    if (auth) capturedHeaders.authorization = auth;
  }

  return originalFetch(input, init);
};

// ==============================================
// Make API call to DeepSeek
// ==============================================

async function sendToDeepSeek(pageContext, question) {
  let token = capturedHeaders.authorization;

  if (!token) {
    const raw = extractBearerToken();
    if (raw) token = `Bearer ${raw}`;
  }

  if (!token) {
    throw new Error('请在 chat.deepseek.com 上发送一条消息初始化连接');
  }

  const systemMsg = `你是一个网页助手。用户正在浏览一个网页，需要你帮助分析。\n\n` +
    `网页标题: ${pageContext.title}\n网页URL: ${pageContext.url}\n\n` +
    `以下是网页全文：\n${pageContext.text}`;

  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: question }
    ],
    stream: false
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': ***,
    'Origin': 'https://chat.deepseek.com',
    'Referer': 'https://chat.deepseek.com/',
    'x-client-bundle-id': 'com.deepseek.chat',
    'x-client-locale': navigator.language || 'zh_CN',
    'x-client-platform': 'web',
    'x-client-timezone-offset': String(-new Date().getTimezoneOffset()),
    'x-client-version': '2.2.0'
  };

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers,
    body
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`API ${resp.status}: ${text.slice(0, 200)}`);
  }

  // Parse SSE response
  const text = await resp.text();
  let reply = '';
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        const content = data.choices?.[0]?.delta?.content ||
          data.choices?.[0]?.message?.content || '';
        if (content) reply += content;
      } catch {}
    }
  }

  if (!reply) {
    reply = text; // fallback
  }

  return reply.trim();
}

// ==============================================
// Listen for messages
// ==============================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'chat':
      sendToDeepSeek(msg.pageContext, msg.question)
        .then(text => sendResponse({ text }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'loginCheck':
      const hasToken = !!(capturedHeaders.authorization || extractBearerToken());
      sendResponse({ loggedIn: hasToken });
      return false;
  }
});

// ==============================================
// Try to auto-capture token on load
// ==============================================

setTimeout(() => {
  const token = extractBearerToken();
  if (token) {
    capturedHeaders.authorization = `Bearer ***}`;
  }
}, 500);
