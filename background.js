// ==============================================
// DeepPage — Service Worker
// Routes API calls to api.deepseek.com
// ==============================================

const API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function getApiKey() {
  const { deepseekApiKey } = await chrome.storage.sync.get('deepseekApiKey');
  return deepseekApiKey || null;
}

// ===== 流式输出（port 通信） =====
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'chat-stream') return;

  port.onMessage.addListener(async (msg) => {
    if (msg.action !== 'chat') return;

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        port.postMessage({ type: 'error', text: 'NO_API_KEY' });
        return;
      }

      const systemPrompt = msg.pageContext
        ? `你是一个网页助手。用户正在浏览以下网页，请根据网页内容回答问题。\n\n标题: ${msg.pageContext.title}\nURL: ${msg.pageContext.url}\n\n网页全文：\n${msg.pageContext.text}`
        : '你是一个网页助手。';
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(msg.chatHistory || [])
      ];

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          messages,
          stream: true
        })
      });

      if (!resp.ok) {
        let errMsg = `API ${resp.status}`;
        try {
          const data = await resp.json();
          errMsg = data?.error?.message || data?.message || errMsg;
        } catch (_) {}
        port.postMessage({ type: 'error', text: errMsg });
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const json = JSON.parse(line.slice(6));
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              port.postMessage({ type: 'chunk', text: content });
            }
          } catch (_) {}
        }
      }

      port.postMessage({ type: 'done' });
    } catch (err) {
      port.postMessage({ type: 'error', text: err.message });
    }
  });
});

// ===== 非流式（旧请求-响应，保留兼容） =====
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'chat':
      handleChat(msg).then(sendResponse).catch(err => {
        sendResponse({ error: err.message });
      });
      return true;
    case 'checkLogin':
      getApiKey().then(key => sendResponse({ loggedIn: !!key }));
      return true;
    case 'openLogin':
      chrome.tabs.create({ url: 'https://platform.deepseek.com/api_keys', active: true });
      return false;
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

async function callDeepSeek(messages) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages,
      stream: false
    })
  });

  const data = await resp.json();
  if (!resp.ok) {
    const msg = data?.error?.message || data?.message || JSON.stringify(data);
    throw new Error(`API ${resp.status}: ${msg}`);
  }
  return data.choices?.[0]?.message?.content || '';
}

async function handleChat(msg) {
  const systemPrompt = msg.pageContext
    ? `你是一个网页助手。用户正在浏览以下网页，请根据网页内容回答问题。\n\n标题: ${msg.pageContext.title}\nURL: ${msg.pageContext.url}\n\n网页全文：\n${msg.pageContext.text}`
    : '你是一个网页助手。';
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(msg.chatHistory || [])
  ];
  const reply = await callDeepSeek(messages);
  return { text: reply };
}
