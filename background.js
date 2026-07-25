// ==============================================
// DeepPage — Service Worker
// Routes API calls to api.deepseek.com
// ==============================================

const API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function getApiKey() {
  const { deepseekApiKey } = await chrome.storage.sync.get('deepseekApiKey');
  return deepseekApiKey || null;
}

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
