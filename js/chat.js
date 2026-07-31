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
    timestamp: m.timestamp,
    thinking: m.thinking
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
    timestamp: m.timestamp,
    thinking: m.thinking
  }));
  // 重建 chatHistory 用于 API 上下文
  chatHistory = currentMessages.map(m => ({ role: m.role, content: m.content }));
  // Re-render messages
  for (const msg of currentMessages) {
    addMsg(msg.role, msg.content, { skipTrack: true, thinking: msg.thinking });
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
        role: m.role, content: m.content, timestamp: m.timestamp, thinking: m.thinking
      }));
      chatHistory = currentMessages.map(m => ({ role: m.role, content: m.content }));
      const chat = document.getElementById('__dp-chat');
      chat.innerHTML = '';
      for (const msg of currentMessages) {
        addMsg(msg.role, msg.content, { skipTrack: true, thinking: msg.thinking });
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

  // 如果消息有思考内容，在气泡内添加 toggle + think box
  const thinkText = extra && extra.thinking;
  if (role === 'assistant' && thinkText) {
    const toggle = document.createElement('span');
    toggle.className = '__dp-think-toggle';
    toggle.innerHTML = (t('thinkingLabel') || '思考过程') + ' ▸';
    const thinkBox = document.createElement('div');
    thinkBox.className = '__dp-think-box';
    thinkBox.style.display = 'none';
    thinkBox.textContent = thinkText;
    bubble.appendChild(toggle);
    bubble.appendChild(thinkBox);
    // Toggle click
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = thinkBox.style.display === 'none';
      thinkBox.style.display = isCollapsed ? '' : 'none';
      toggle.innerHTML = (t('thinkingLabel') || '思考过程') + (isCollapsed ? ' ▾' : ' ▸');
    });
  }

  // 正文内容
  const contentEl = document.createElement('div');
  contentEl.className = '__dp-bubble-content';
  contentEl.innerHTML = markdownToHtml(text);
  bubble.appendChild(contentEl);
  div.appendChild(bubble);

  // 追踪消息（跳过历史加载时的重渲染）
  // 注意：欢迎消息等 skipTrack 消息不在 currentMessages 中，删除时不能按 DOM index 同步数组
  let msgRef = null;
  if (!extra || !extra.skipTrack) {
    msgRef = { role, content: text, timestamp: Date.now(), thinking: thinkText };
    currentMessages.push(msgRef);
  }
  div._dpMsgRef = msgRef;

  // AI 回复添加复制按钮
  if (role === 'assistant') {
    const copyBtn = document.createElement('button');
    copyBtn.className = '__dp-copy-btn';
    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    copyBtn.title = t('copyButton') || 'Copy';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.classList.add('__dp-copied');
        setTimeout(() => copyBtn.classList.remove('__dp-copied'), 1500);
      });
    });
    div.appendChild(copyBtn);
  }

  // 所有消息都有删除按钮
  attachDelBtn(div);

  chat.appendChild(div);
  scrollChat();
}

// ===== 消息删除 =====
function attachDelBtn(div) {
  const delBtn = document.createElement('button');
  delBtn.className = '__dp-del-btn';
  delBtn.title = t('deleteButton') || 'Delete';
  delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
  delBtn.addEventListener('click', (e) => {
    // 阻止冒泡：删除后 div 已脱离 DOM，document 上的 handleClickOutside 会
    // 因 panel.contains(e.target) === false 误判为面板外点击而关闭面板
    e.stopPropagation();
    deleteMessage(div);
  });
  div.appendChild(delBtn);
}

async function deleteMessage(div) {
  // 欢迎消息（skipTrack，不入数组）：只删 DOM，不影响数据
  if (div.dataset.msgType === 'context-loaded') {
    div.remove();
    return;
  }

  let ref = div._dpMsgRef;
  if (!ref) {
    // 历史加载渲染的消息（skipTrack）：DOM 顺序 == currentMessages 顺序，按位置匹配
    const chat = document.getElementById('__dp-chat');
    const idx = Array.from(chat.querySelectorAll('.__dp-msg')).indexOf(div);
    if (idx !== -1 && idx < currentMessages.length) ref = currentMessages[idx];
  }
  div.remove();

  if (ref) {
    // currentMessages：按对象引用精确删除（不受 skipTrack 消息影响）
    const ci = currentMessages.indexOf(ref);
    if (ci !== -1) currentMessages.splice(ci, 1);
    // chatHistory：无对象引用（发送时重建），按 role+content 匹配删除
    const hi = chatHistory.findIndex(m => m.role === ref.role && m.content === ref.content);
    if (hi !== -1) chatHistory.splice(hi, 1);
  }
  await saveCurrentMessages();
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
      let reasoningText = '';
      let assistantDiv = null;
      let assistantBubble = null;
      let thinkToggle = null;
      let thinkBox = null;
      let hasThinking = false;

      function createAssistantWithThinking() {
        if (assistantDiv) return;
        const loading = document.querySelector('.__dp-loading');
        if (loading) loading.remove();
        const chat = document.getElementById('__dp-chat');
        
        assistantDiv = document.createElement('div');
        assistantDiv.className = '__dp-msg __dp-assistant';
        
        // Bubble wraps everything: toggle + thinkBox + content
        assistantBubble = document.createElement('div');
        assistantBubble.className = '__dp-bubble';
        
        // Toggle: 思考 ▾ (expanded) / 思考 ▸ (collapsed)
        const label = t('thinkingLabel') || '思考过程';
        thinkToggle = document.createElement('span');
        thinkToggle.className = '__dp-think-toggle';
        thinkToggle.innerHTML = label + ' ▾';
        thinkToggle.style.display = 'none';
        
        // Thinking content box
        thinkBox = document.createElement('div');
        thinkBox.className = '__dp-think-box';
        thinkBox.style.display = 'none';
        thinkBox.textContent = '';
        
        // Content container (markdown renders here)
        const contentContainer = document.createElement('div');
        contentContainer.className = '__dp-bubble-content';
        
        assistantBubble.appendChild(thinkToggle);
        assistantBubble.appendChild(thinkBox);
        assistantBubble.appendChild(contentContainer);
        assistantDiv.appendChild(assistantBubble);
        chat.appendChild(assistantDiv);
        scrollChat();
        
        // Override assistantBubble.innerHTML setter to write into contentContainer
        // But actually we'll just reference contentContainer directly in the chunk handler
        assistantBubble.__content = contentContainer;
      }

      function attachToggleHandler() {
        if (!thinkToggle || thinkToggle._attached) return;
        thinkToggle._attached = true;
        const label = t('thinkingLabel') || '思考过程';
        thinkToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isCollapsed = thinkToggle.textContent.indexOf('▸') !== -1;
          if (isCollapsed) {
            thinkBox.style.display = '';
            thinkToggle.innerHTML = label + ' ▾';
          } else {
            thinkBox.style.display = 'none';
            thinkToggle.innerHTML = label + ' ▸';
          }
        });
      }

      port.onMessage.addListener((resp) => {
        if (resp.type === 'reasoning_chunk') {
          reasoningText += resp.text;
          if (!hasThinking) {
            hasThinking = true;
            createAssistantWithThinking();
          }
          // Fill thinking text while streaming
          thinkBox.textContent = reasoningText;
          thinkBox.style.display = '';
          thinkToggle.style.display = '';
          thinkToggle.textContent = '▼';
          scrollChat();
        } else if (resp.type === 'chunk') {
          if (assistantDiv && !assistantBubble._hasContent) {
            assistantBubble._hasContent = true;
            // Loading was already removed by createAssistantWithThinking or we need to remove it
            const loading = document.querySelector('.__dp-loading');
            if (loading) loading.remove();
            
            // Thinking done: collapse to ▸ text
            if (hasThinking) {
              const label = t('thinkingLabel') || '思考过程';
              thinkBox.style.display = 'none';
              thinkToggle.innerHTML = label + ' ▸';
              thinkToggle.style.display = '';
              attachToggleHandler();
            }
          } else if (!assistantDiv) {
            // No thinking, first chunk creates the assistant directly
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
          }
          fullText += resp.text;
          // 获取或创建 contentContainer
          let contentEl = null;
          if (assistantBubble && assistantBubble.__content) {
            contentEl = assistantBubble.__content;
          } else {
            // 无思考，首次 chunk 创建普通气泡
            const loading = document.querySelector('.__dp-loading');
            if (loading) loading.remove();
            const chat = document.getElementById('__dp-chat');
            assistantDiv = document.createElement('div');
            assistantDiv.className = '__dp-msg __dp-assistant';
            assistantBubble = document.createElement('div');
            assistantBubble.className = '__dp-bubble';
            contentEl = document.createElement('div');
            contentEl.className = '__dp-bubble-content';
            assistantBubble.appendChild(contentEl);
            assistantDiv.appendChild(assistantBubble);
            chat.appendChild(assistantDiv);
            scrollChat();
          }
          const chat = document.getElementById('__dp-chat');
          const wasAtBottom = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 2;
          contentEl.innerHTML = markdownToHtml(fullText);
          if (wasAtBottom) scrollChat();
        } else if (resp.type === 'done') {
          // 添加复制按钮
          if (assistantDiv && assistantBubble) {
            const copyBtn = document.createElement('button');
            copyBtn.className = '__dp-copy-btn';
            copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            copyBtn.title = t('copyButton') || 'Copy';
            copyBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(fullText).then(() => {
                copyBtn.classList.add('__dp-copied');
                setTimeout(() => copyBtn.classList.remove('__dp-copied'), 1500);
              });
            });
            assistantDiv.appendChild(copyBtn);
            attachDelBtn(assistantDiv);
          }
          // 处理仅思考无正文等边缘情况
          if (hasThinking && !fullText && reasoningText) {
            // 只有思考没有正文 → 把思考当正文
            if (!assistantBubble) {
              const chat = document.getElementById('__dp-chat');
              assistantDiv = document.createElement('div');
              assistantDiv.className = '__dp-msg __dp-assistant';
              assistantBubble = document.createElement('div');
              assistantBubble.className = '__dp-bubble';
              assistantDiv.appendChild(assistantBubble);
              chat.appendChild(assistantDiv);
            }
            assistantBubble.innerHTML = markdownToHtml(reasoningText);
            fullText = reasoningText;
            // 移除思考 toggle 和 box
            if (thinkToggle) thinkToggle.remove();
            if (thinkBox) thinkBox.remove();
          }
          resolve({ fullText, reasoningText });
        } else if (resp.type === 'error') {
          reject(new Error(resp.text));
        }
      });

      // 发送请求
      port.postMessage({ action: 'chat', pageContext, chatHistory });
    });

    const respData = await fullTextPromise;
    const fullText = respData.fullText || '';
    const thinkingText = respData.reasoningText || '';
    chatHistory.push({ role: "assistant", content: fullText });
    // 同时加入 currentMessages 以支持导出和持久化
    const msgRef = { role: "assistant", content: fullText, timestamp: Date.now(), thinking: thinkingText };
    currentMessages.push(msgRef);
    if (assistantDiv) assistantDiv._dpMsgRef = msgRef;
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

