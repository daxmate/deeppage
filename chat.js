// ==============================================
// DeepPage — Chat / Conversation Management
// ==============================================

// ===== Shared State =====
let currentMessages = [];
let currentConvId = null;
let _sending = false;
let chatHistory = [];
let pageContext = null;

// ===== Conversation Storage =====

async function loadConversations() {
  const result = await chrome.storage.local.get('deeppage_convs');
  return result.deeppage_convs || { conversations: [], activeId: null };
}

async function saveConversations(data) {
  await chrome.storage.local.set({ deeppage_convs: data });
}

async function getOrCreateConv() {
  const data = await loadConversations();
  if (currentConvId && data.conversations.find(c => c.id === currentConvId)) {
    return data;
  }
  const conv = {
    id: generateId(),
    title: t('newChat') || 'New Chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    context: null,
  };
  // 只创建内存中的对话，等有消息时再保存到 storage
  data.conversations.unshift(conv);
  data.activeId = conv.id;
  currentConvId = conv.id;
  currentMessages = [];
  return data;
}

async function trimConversation() {
  const { maxRounds = 20 } = await chrome.storage.sync.get('maxRounds');
  if (chatHistory.length <= maxRounds * 2) return;

  // 计算需要移除的消息数，保留最近 maxRounds*2 条（只移除完整的 user+assistant 对）
  const excess = chatHistory.length - maxRounds * 2;
  if (excess < 2) return;
  // 确保移除的是完整的偶数条（user+assistant 对）
  const removeCount = Math.floor(excess / 2) * 2;
  chatHistory.splice(0, removeCount);
  currentMessages.splice(0, removeCount);
  // 同步更新聊天界面
  const chat = document.getElementById('__dp-chat');
  if (chat) {
    const msgs = chat.querySelectorAll('.__dp-msg');
    msgs.forEach((el, i) => {
      if (i < removeCount) el.remove();
    });
  }
}

async function clearContext() {
  if (chatHistory.length <= 2) return;
  // 保留最后一条 user 消息（当前轮）
  const keepUser = chatHistory[chatHistory.length - 1];
  const keepContent = keepUser.content;
  chatHistory = [keepUser];
  currentMessages = [currentMessages[currentMessages.length - 1]];
  // 清空界面，仅保留当前用户消息
  const chat = document.getElementById('__dp-chat');
  if (chat) {
    chat.innerHTML = '';
    addMsg('user', keepContent);
  }
  // 保存到 storage
  await saveCurrentMessages();
}

async function saveCurrentMessages() {
  const data = await loadConversations();
  if (!currentConvId) return;

  // 空对话不保存 — 从 storage 移除
  if (!currentMessages.length) {
    const oldLen = data.conversations.length;
    data.conversations = data.conversations.filter(c => c.id !== currentConvId);
    if (data.activeId === currentConvId) {
      data.activeId = data.conversations.length > 0 ? data.conversations[0].id : null;
    }
    if (data.conversations.length !== oldLen) {
      await saveConversations(data);
    }
    return;
  }

  // 查找或创建 storage 中的对话记录
  let conv = data.conversations.find(c => c.id === currentConvId);
  if (!conv) {
    conv = {
      id: currentConvId,
      title: t('newChat') || 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      context: null,
    };
    data.conversations.unshift(conv);
    data.activeId = currentConvId;
  }
  conv.messages = currentMessages.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp
  }));
  conv.updatedAt = Date.now();
  // 保存页面上下文
  conv.context = pageContext ? {
    title: pageContext.title,
    url: pageContext.url,
    text: pageContext.text
  } : null;
  // 从第一条用户消息自动生成标题
  const firstUser = currentMessages.find(m => m.role === 'user');
  if (firstUser) {
    const t = firstUser.content.replace(/^.{0,50}[\s\S]*/, (s) => s.slice(0, 50));
    conv.title = t.length < firstUser.content.length ? t + '…' : t;
  }
  data.activeId = currentConvId;
  await saveConversations(data);
}

async function switchConversation(convId) {
  // 先保存当前对话
  if (currentConvId) {
    await saveCurrentMessages();
  }
  const data = await loadConversations();
  const conv = data.conversations.find(c => c.id === convId);
  if (!conv) return;
  // Clear chat
  const chat = document.getElementById('__dp-chat');
  chat.innerHTML = '';
  currentConvId = conv.id;
  // 恢复页面上下文
  if (conv.context) {
    if (conv.context.url === location.href) {
      pageContext = extractPageContent();
    } else {
      pageContext = { ...conv.context };
    }
    updateContext(pageContext.title);
  }
  currentMessages = conv.messages.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp
  }));
  // 重建 chatHistory 用于 API 上下文
  chatHistory = currentMessages.map(m => ({ role: m.role, content: m.content }));
  // Re-render messages
  for (const msg of currentMessages) {
    addMsg(msg.role, msg.content, { skipTrack: true });
  }
  data.activeId = conv.id;
  await saveConversations(data);
  showChat();
}

async function deleteConversation(convId) {
  const data = await loadConversations();
  data.conversations = data.conversations.filter(c => c.id !== convId);
  // 如果删掉了当前对话，activeId 跳到第一个
  if (data.activeId === convId) {
    data.activeId = data.conversations.length > 0 ? data.conversations[0].id : null;
    currentConvId = data.activeId;
  }
  await saveConversations(data);
  // 始终刷新历史列表并停留在当前视图，不切换回聊天
  const list = document.getElementById('__dp-history-list');
  if (list && !list.classList.contains('__dp-hide')) {
    renderHistoryList();
  } else {
    // 不在历史视图，正常处理
    if (!data.activeId) {
      currentConvId = null;
      currentMessages = [];
      document.getElementById('__dp-chat').innerHTML = '';
      await getOrCreateConv();
    } else if (data.activeId !== currentConvId) {
      await switchConversation(data.activeId);
    }
  }
}

async function newConversation() {
  currentConvId = null;
  currentMessages = [];
  chatHistory = [];
  document.getElementById('__dp-chat').innerHTML = '';
  await getOrCreateConv();
  showChat();
}

async function loadActiveConversation() {
  const data = await loadConversations();
  if (data.activeId && data.conversations.length > 0) {
    const conv = data.conversations.find(c => c.id === data.activeId);
    if (conv && conv.messages.length > 0) {
      // 检查页面是否匹配；不匹配则新建对话
      if (conv.context && conv.context.url !== location.href) {
        // 不同页面 → 新建对话，保留旧对话在历史中
        currentConvId = null;
        currentMessages = [];
        chatHistory = [];
        await getOrCreateConv();
        pageContext = extractPageContent();
        updateContext(pageContext.title);
        document.getElementById('__dp-chat').innerHTML = '';
        addMsg('assistant', `📄 ${t('contextLoaded', pageContext ? pageContext.title : '')}`, { skipTrack: true, dataset: { msgType: 'context-loaded' } });
        return;
      }
      currentConvId = conv.id;
      // 恢复页面上下文
      if (conv.context) {
        if (conv.context.url === location.href) {
          pageContext = extractPageContent();
        } else {
          pageContext = { ...conv.context };
        }
        updateContext(pageContext.title);
      } else {
        pageContext = extractPageContent();
        updateContext(pageContext.title);
      }
      currentMessages = conv.messages.map(m => ({
        role: m.role, content: m.content, timestamp: m.timestamp
      }));
      chatHistory = currentMessages.map(m => ({ role: m.role, content: m.content }));
      const chat = document.getElementById('__dp-chat');
      chat.innerHTML = '';
      for (const msg of currentMessages) {
        addMsg(msg.role, msg.content, { skipTrack: true });
      }
      return;
    }
  }
  // 无保存的对话 → 创建新对话并显示默认欢迎
  await getOrCreateConv();
  pageContext = extractPageContent();
  updateContext(pageContext.title);
  document.getElementById('__dp-chat').innerHTML = '';
  addMsg('assistant', `📄 ${t('contextLoaded', pageContext ? pageContext.title : '')}`, { skipTrack: true, dataset: { msgType: 'context-loaded' } });
}

function showHistory() {
  const chat = document.getElementById('__dp-chat');
  chat.classList.add('__dp-hide');
  let list = document.getElementById('__dp-history-list');
  if (!list) {
    list = document.createElement('div');
    list.id = '__dp-history-list';
    chat.parentNode.insertBefore(list, chat.nextSibling);
  }
  list.classList.remove('__dp-hide');
  renderHistoryList();
}

function showChat() {
  const chat = document.getElementById('__dp-chat');
  chat.classList.remove('__dp-hide');
  const list = document.getElementById('__dp-history-list');
  if (list) list.classList.add('__dp-hide');
}

async function renderHistoryList() {
  const list = document.getElementById('__dp-history-list');
  if (!list) return;
  const data = await loadConversations();
  list.innerHTML = `
    <div class="__dp-history-header">
      <button class="__dp-history-back" title="${t('backToChat') || 'Back'}">← <span>${t('backToChat') || 'Back'}</span></button>
    </div>
    <div class="__dp-history-scroll">
      ${data.conversations.length === 0 ? '<div class="__dp-history-empty">' + (t('historyEmpty') || 'No conversations') + '</div>' : ''}
      ${data.conversations.map(c => `
        <div class="__dp-history-item${c.id === currentConvId ? ' active' : ''}" data-id="${c.id}">
          <div class="__dp-history-item-main">
            <div class="__dp-history-title">${escapeHtml(c.title)}</div>
            <div class="__dp-history-meta">${c.messages.length} msg · ${formatRelativeTime(c.updatedAt)}</div>
          </div>
          <button class="__dp-history-del" data-id="${c.id}" title="${t('deleteButton') || 'Delete'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `).join('')}
    </div>
  `;
  // Bind events
  list.querySelectorAll('.__dp-history-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.__dp-history-del')) return;
      switchConversation(el.dataset.id);
    });
  });
  list.querySelectorAll('.__dp-history-del').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteConversation(el.dataset.id);
    });
  });
  list.querySelector('.__dp-history-back')?.addEventListener('click', showChat);
}

function addMsg(role, text, extra) {
  const chat = document.getElementById("__dp-chat");
  const loading = chat.querySelector(".__dp-loading");
  if (loading) loading.remove();

  const div = document.createElement("div");
  div.className = `__dp-msg __dp-${role}`;
  if (extra && extra.dataset) {
    Object.keys(extra.dataset).forEach((k) => { div.dataset[k] = extra.dataset[k]; });
  }
  const bubble = document.createElement("div");
  bubble.className = "__dp-bubble";
  bubble.innerHTML = markdownToHtml(text);
  div.appendChild(bubble);

  // 追踪消息（跳过历史加载时的重渲染）
  if (!extra || !extra.skipTrack) {
    currentMessages.push({ role, content: text, timestamp: Date.now() });
  }

  // AI 回复添加复制按钮
  if (role === 'assistant') {
    const copyBtn = document.createElement('button');
    copyBtn.className = '__dp-copy-btn';
    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    copyBtn.title = t('copyButton') || 'Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.classList.add('__dp-copied');
        setTimeout(() => copyBtn.classList.remove('__dp-copied'), 1500);
      });
    });
    div.appendChild(copyBtn);
  }

  chat.appendChild(div);
  scrollChat();
}

function showLoading() {
  const chat = document.getElementById("__dp-chat");
  const div = document.createElement("div");
  div.className = "__dp-loading";
  div.innerHTML = "<span>.</span><span>.</span><span>.</span>";
  chat.appendChild(div);
  scrollChat();
}

function updateContext(title) {
  const bar = document.getElementById("__dp-context-bar");
  if (title) {
    document.getElementById("__dp-context-title").textContent = title;
    bar.classList.remove("__dp-hidden");
  } else {
    bar.classList.add("__dp-hidden");
  }
}

function showLoginNotice(show) {
  const notice = document.getElementById("__dp-login-notice");
  const input = document.getElementById("__dp-input");
  const sendBtn = document.getElementById("__dp-send");
  notice.classList.toggle("__dp-hidden", !show);
  input.disabled = show;
  sendBtn.disabled = show;
}

async function sendMessage() {
  if (_sending) return;
  _sending = true;
  const input = document.getElementById("__dp-input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  input.style.height = "auto";

  addMsg("user", text);
  showLoading();

  chatHistory.push({ role: "user", content: text });
  saveCurrentMessages();

  // 流式输出
  // 流式输出前裁剪历史
  await trimConversation();

  let lastFullText = '';

  try {
    const port = chrome.runtime.connect({ name: 'chat-stream' });
    
    const fullTextPromise = new Promise((resolve, reject) => {
      let fullText = '';
      let assistantDiv = null;
      let assistantBubble = null;
      let firstChunk = true;

      port.onMessage.addListener((resp) => {
        if (resp.type === 'chunk') {
          // 第一次收到 chunk：移除 loading 并创建 assistant 气泡
          if (firstChunk) {
            const loading = document.querySelector('.__dp-loading');
            if (loading) loading.remove();
            const chat = document.getElementById('__dp-chat');
            assistantDiv = document.createElement('div');
            assistantDiv.className = '__dp-msg __dp-assistant';
            assistantBubble = document.createElement('div');
            assistantBubble.className = '__dp-bubble';
            assistantDiv.appendChild(assistantBubble);
            chat.appendChild(assistantDiv);
            scrollChat();
            firstChunk = false;
          }
          fullText += resp.text;
          // 保留滚动位置
          const chat = document.getElementById('__dp-chat');
          const wasAtBottom = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 2;
          assistantBubble.innerHTML = markdownToHtml(fullText);
          if (wasAtBottom) scrollChat();
        } else if (resp.type === 'done') {
          // 添加复制按钮
          if (assistantDiv && assistantBubble) {
            const copyBtn = document.createElement('button');
            copyBtn.className = '__dp-copy-btn';
            copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            copyBtn.title = t('copyButton') || 'Copy';
            copyBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(fullText).then(() => {
                copyBtn.classList.add('__dp-copied');
                setTimeout(() => copyBtn.classList.remove('__dp-copied'), 1500);
              });
            });
            assistantDiv.appendChild(copyBtn);
          }
          resolve(fullText);
        } else if (resp.type === 'error') {
          reject(new Error(resp.text));
        }
      });

      // 发送请求
      port.postMessage({ action: 'chat', pageContext, chatHistory });
    });

    const fullText = await fullTextPromise;
    chatHistory.push({ role: "assistant", content: fullText });
    // 同时加入 currentMessages 以支持导出和持久化
    currentMessages.push({ role: "assistant", content: fullText, timestamp: Date.now() });
    saveCurrentMessages();
    _sending = false;

  } catch (err) {
    _sending = false;
    // 移除 loading
    const loading = document.querySelector('.__dp-loading');
    if (loading) loading.remove();

    const errMsg = err.message === "NO_API_KEY" ? t('errorNoApiKey') : err.message;
    addMsg("assistant", `❌ ${errMsg}`);
    if (err.message === "NO_API_KEY") showLoginNotice(true);
    chatHistory.pop();
  }
}

function formatExportMarkdown() {
  const msgs = chatHistory.length ? chatHistory : currentMessages;
  if (!msgs.length) return '';
  const lines = [];
  lines.push(`# DeepPage 对话导出`);
  lines.push(`> 页面: ${pageContext ? pageContext.title : ''}`);
  lines.push(`> URL: ${pageContext ? pageContext.url : ''}`);
  lines.push(`> 导出时间: ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('---');
  lines.push('');
    for (const msg of msgs) {
    if (msg.role === 'user') {
      lines.push(`## 🧑 ${msg.role}`);
    } else {
      lines.push(`## 🤖 ${msg.role}`);
    }
    lines.push('');
    lines.push(msg.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

function formatExportText() {
  const msgs = chatHistory.length ? chatHistory : currentMessages;
  if (!msgs.length) return '';
  const lines = [];
  lines.push(`DeepPage Conversation Export`);
  lines.push(`Page: ${pageContext ? pageContext.title : ''}`);
  lines.push(`URL: ${pageContext ? pageContext.url : ''}`);
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push('');
  for (const msg of msgs) {
    lines.push(`[${msg.role === 'user' ? 'User' : 'Assistant'}]`);
    lines.push(msg.content);
    lines.push('');
  }
  return lines.join('\n');
}

async function exportConversation(format) {
  const msgs = chatHistory.length ? chatHistory : currentMessages;
  if (!msgs.length) return;

  let content;
  if (format === 'markdown') {
    content = formatExportMarkdown();
  } else if (format === 'text') {
    content = formatExportText();
  }

  if (format === 'download') {
    content = formatExportMarkdown();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const title = (pageContext ? pageContext.title : 'deeppage').replace(/[^\w\u4e00-\u9fff-]/g, '_').slice(0, 50);
    a.download = `${title}_deeppage.md`;
    document.body.appendChild(a);
    _suppressClose = true;
    a.click();
    _suppressClose = false;
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    try {
      await navigator.clipboard.writeText(content);
    } catch (_) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    // 显示反馈
    const btn = document.getElementById('__dp-export-btn');
    const orig = btn.innerHTML;
    const feedback = document.createElement('span');
    feedback.textContent = '✓';
    feedback.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;color:#34d399';
    btn.style.position = 'relative';
    btn.appendChild(feedback);
    setTimeout(() => { btn.innerHTML = orig; }, 1200);
  }
}

