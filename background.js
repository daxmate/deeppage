// ==============================================
// DeepPage — Service Worker
// Routes API calls — OpenAI or Anthropic format
// ==============================================

const DEFAULT_BASE_URLS = {
  openai: 'https://api.deepseek.com/v1',
  anthropic: 'https://api.anthropic.com',
};

// OpenAI-compatible endpoint is /chat/completions
const API_PATHS = {
  openai: '/chat/completions',
  anthropic: '/messages',
};

async function getSettings() {
  const result = await chrome.storage.sync.get([
    'apiType', 'apiBaseUrl', 'apiKey', 'apiModel',
    'deepseekApiKey', // fallback
  ]);
  const apiType = result.apiType || 'openai';
  const baseUrl = result.apiBaseUrl || DEFAULT_BASE_URLS[apiType];
  const apiKey = result.apiKey || result.deepseekApiKey || null;
  const model = result.apiModel ||
    (apiType === 'openai' ? 'deepseek-v4-flash' : 'claude-sonnet-4-20250514');
  return { apiType, baseUrl, apiKey, model };
}

// ===== 流式输出（port 通信） =====
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'chat-stream') return;

  port.onMessage.addListener(async (msg) => {
    if (msg.action !== 'chat') return;

    try {
      const { apiType, baseUrl, apiKey, model } = await getSettings();
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

      const url = `${baseUrl.replace(/\/+$/, '')}${API_PATHS[apiType]}`;
      const headers = apiType === 'anthropic'
        ? { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
        : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
      const body = buildBody(apiType, model, messages, true);

      const resp = await fetch(url, { method: 'POST', headers, body });

      if (!resp.ok) {
        let errMsg = `API ${resp.status}`;
        try {
          const data = await resp.json();
          errMsg = apiType === 'anthropic'
            ? (data?.error?.message || data?.error?.type || errMsg)
            : (data?.error?.message || data?.message || errMsg);
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
          if (line.trim() === '' || line.startsWith('event: ')) continue;
          const content = parseStreamChunk(apiType, line);
          if (content) port.postMessage({ type: 'chunk', text: content });
        }
      }

      port.postMessage({ type: 'done' });
    } catch (err) {
      port.postMessage({ type: 'error', text: err.message });
    }
  });
});

// ===== 非流式 / 工具请求 =====
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'chat':
      handleChat(msg).then(sendResponse).catch(err => {
        sendResponse({ error: err.message });
      });
      return true;
    case 'checkLogin':
      getSettings().then(({ apiKey }) => sendResponse({ loggedIn: !!apiKey }));
      return true;
    case 'testApi':
      testApiConnection().then(sendResponse).catch(err => {
        sendResponse({ ok: false, error: err.message });
      });
      return true;
    case 'getProviderInfo':
      getSettings().then(s => sendResponse({
        apiType: s.apiType, model: s.model, loggedIn: !!s.apiKey
      }));
      return true;
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// ===== 辅助函数 =====

function buildBody(apiType, model, messages, stream) {
  if (apiType === 'anthropic') {
    let system = '';
    const msgs = messages.filter(m => {
      if (m.role === 'system') { system = m.content; return false; }
      return true;
    });
    const body = { model, messages: msgs, max_tokens: 4096, stream };
    if (system) body.system = system;
    return JSON.stringify(body);
  }
  return JSON.stringify({ model, messages, stream });
}

function parseStreamChunk(apiType, line) {
  if (!line.startsWith('data: ')) return '';
  const data = line.slice(6);
  if (data === '[DONE]') return '';
  try {
    const json = JSON.parse(data);
    if (apiType === 'anthropic') {
      if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
        return json.delta.text || '';
      }
      return '';
    }
    return json.choices?.[0]?.delta?.content || '';
  } catch { return ''; }
}

function parseNonStream(apiType, data) {
  if (apiType === 'anthropic') {
    return data.content?.map(c => c.text).join('') || '';
  }
  return data.choices?.[0]?.message?.content || '';
}

function formatError(apiType, data) {
  if (apiType === 'anthropic') {
    return data?.error?.message || data?.error?.type || JSON.stringify(data);
  }
  return data?.error?.message || data?.message || JSON.stringify(data);
}

// ===== 非流式聊天 =====
async function handleChat(msg) {
  const { apiType, baseUrl, apiKey, model } = await getSettings();
  if (!apiKey) throw new Error('NO_API_KEY');

  const systemPrompt = msg.pageContext
    ? `你是一个网页助手。用户正在浏览以下网页，请根据网页内容回答问题。\n\n标题: ${msg.pageContext.title}\nURL: ${msg.pageContext.url}\n\n网页全文：\n${msg.pageContext.text}`
    : '你是一个网页助手。';
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(msg.chatHistory || [])
  ];

  const url = `${baseUrl.replace(/\/+$/, '')}${API_PATHS[apiType]}`;
  const headers = apiType === 'anthropic'
    ? { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
    : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };

  const resp = await fetch(url, { method: 'POST', headers, body: buildBody(apiType, model, messages, false) });
  const data = await resp.json();
  if (!resp.ok) throw new Error(formatError(apiType, data));
  return { text: parseNonStream(apiType, data) };
}

// ===== 测试 API 连接 =====
async function testApiConnection() {
  const { apiType, baseUrl, apiKey, model } = await getSettings();
  if (!apiKey) return { ok: false, error: 'NO_API_KEY' };

  const testModel = apiType === 'anthropic' ? (model || 'claude-3-haiku-20240307') : (model || 'deepseek-chat');
  const url = `${baseUrl.replace(/\/+$/, '')}${API_PATHS[apiType]}`;
  const headers = apiType === 'anthropic'
    ? { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
    : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };

  const testMsg = apiType === 'anthropic'
    ? JSON.stringify({ model: testModel, max_tokens: 1, messages: [{ role: 'user', content: 'Hi' }] })
    : JSON.stringify({ model: testModel, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 1, stream: false });

  const resp = await fetch(url, { method: 'POST', headers, body: testMsg });
  const data = await resp.json();
  if (!resp.ok) return { ok: false, error: `API ${resp.status}: ${formatError(apiType, data)}` };
  return { ok: true, model: testModel };
}
