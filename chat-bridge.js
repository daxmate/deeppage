// ==============================================
// DeepPage — API Bridge (runs on chat.deepseek.com)
// Makes API calls from chat.deepseek.com origin
// Uses Bearer token from localStorage
// ==============================================

const API_URL = 'https://chat.deepseek.com/api/v0/chat/completion';
let bearerToken = null;

function extractToken() {
  // Supabase stores auth in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw.length < 20) continue;
      const parsed = JSON.parse(raw);
      if (parsed?.currentSession?.access_token) {
        return parsed.currentSession.access_token;
      }
      if (parsed?.access_token) return parsed.access_token;
    } catch {}
  }
  return null;
}

// ==============================================
// API call
// ==============================================

async function chat(question, pageContext) {
  if (!bearerToken) bearerToken = extractToken();
  if (!bearerToken) throw new Error('未登录。请先打开 chat.deepseek.com 登录');

  const messages = [
    {
      role: 'system',
      content: `你是一个网页助手。用户正在浏览以下网页，请根据网页内容回答。\n\n` +
        `标题: ${pageContext.title}\nURL: ${pageContext.url}\n\n网页全文：\n${pageContext.text}`
    },
    { role: 'user', content: question }
  ];

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
      'Origin': 'https://chat.deepseek.com',
      'Referer': 'https://chat.deepseek.com/',
      'x-client-bundle-id': 'com.deepseek.chat',
      'x-client-locale': 'zh_CN',
      'x-client-platform': 'web',
      'x-client-timezone-offset': String(-new Date().getTimezoneOffset()),
      'x-client-version': '2.2.0'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      stream: false
    })
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`API ${resp.status}: ${body.slice(0, 200)}`);
  }

  // Parse SSE response
  const text = await resp.text();
  let reply = '';
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        const c = data.choices?.[0]?.delta?.content ||
          data.choices?.[0]?.message?.content || '';
        if (c) reply += c;
      } catch {}
    }
  }

  return reply.trim() || text.trim();
}

// ==============================================
// Listen for messages
// ==============================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'chat':
      chat(msg.question, msg.pageContext)
        .then(text => sendResponse({ text }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'checkLogin':
      const token = bearerToken || extractToken();
      sendResponse({ loggedIn: !!token });
      return false;

    case 'ping':
      sendResponse({ alive: true });
      return false;
  }
});

// ==============================================
// Init
// ==============================================

bearerToken = extractToken();
// Retry after page stabilizes
setTimeout(() => {
  if (!bearerToken) bearerToken = extractToken();
}, 2000);
