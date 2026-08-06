// ==============================================
// DeepPage — Chat / Shared State & Conversation Storage
// 加载顺序：state → history → render → send → export
// ==============================================

// ===== Shared State =====
let currentMessages = [];
let currentConvId = null;
let _sending = false;
let chatHistory = [];
let pageContext = null;
// 面板关闭抑制（导出下载时避免误关面板）；原定义在 sidebar.js，集中到此处统一管理
let _suppressClose = false;

// ===== Conversation Storage =====

async function loadConversations() {
  const result = await chrome.storage.local.get("deeppage_convs");
  return result.deeppage_convs || { conversations: [], activeId: null };
}

async function saveConversations(data) {
  await chrome.storage.local.set({ deeppage_convs: data });
}

async function getOrCreateConv() {
  const data = await loadConversations();
  if (currentConvId && data.conversations.find((c) => c.id === currentConvId)) {
    return data;
  }
  const conv = {
    id: generateId(),
    title: t("newChat") || "New Chat",
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
  const { maxRounds = 20 } = await chrome.storage.sync.get("maxRounds");
  if (chatHistory.length <= maxRounds * 2) return;

  // 计算需要移除的消息数，保留最近 maxRounds*2 条（只移除完整的 user+assistant 对）
  const excess = chatHistory.length - maxRounds * 2;
  if (excess < 2) return;
  // 确保移除的是完整的偶数条（user+assistant 对）
  const removeCount = Math.floor(excess / 2) * 2;
  chatHistory.splice(0, removeCount);
  currentMessages.splice(0, removeCount);
  // 同步更新聊天界面
  const chat = document.getElementById("__dp-chat");
  if (chat) {
    const msgs = chat.querySelectorAll(".__dp-msg");
    msgs.forEach((el, i) => {
      if (i < removeCount) el.remove();
    });
  }
}

async function clearContext() {
  if (chatHistory.length <= 2) return;
  // 保留最后一条 user 消息（当前轮）——从末尾向前找，跳过 assistant 回复
  let keepIdx = chatHistory.length - 1;
  while (keepIdx >= 0 && chatHistory[keepIdx].role !== "user") keepIdx--;
  if (keepIdx < 0) return;
  const keepUser = chatHistory[keepIdx];
  const keepContent = keepUser.content;
  chatHistory = [keepUser];
  const lastUserMsg = [...currentMessages].reverse().find((m) => m.role === "user");
  currentMessages = lastUserMsg ? [lastUserMsg] : [];
  // 清空界面，仅保留当前用户消息
  const chat = document.getElementById("__dp-chat");
  if (chat) {
    chat.innerHTML = "";
    addMsg("user", keepContent);
    toastSuccess(t("contextCleared") || "Context cleared");
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
    data.conversations = data.conversations.filter((c) => c.id !== currentConvId);
    if (data.activeId === currentConvId) {
      data.activeId = data.conversations.length > 0 ? data.conversations[0].id : null;
    }
    if (data.conversations.length !== oldLen) {
      await saveConversations(data);
    }
    return;
  }

  // 查找或创建 storage 中的对话记录
  let conv = data.conversations.find((c) => c.id === currentConvId);
  if (!conv) {
    conv = {
      id: currentConvId,
      title: t("newChat") || "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      context: null,
    };
    data.conversations.unshift(conv);
    data.activeId = currentConvId;
  }
  conv.messages = currentMessages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    thinking: m.thinking,
  }));
  conv.updatedAt = Date.now();
  // 保存页面上下文
  conv.context = pageContext
    ? {
        title: pageContext.title,
        url: pageContext.url,
        text: pageContext.text,
      }
    : null;
  // 从第一条用户消息自动生成标题（标题被用户手动锁定或 AI 生成后不再覆盖）
  const firstUser = currentMessages.find((m) => m.role === "user");
  if (firstUser && !conv.titleLocked && !conv.titleGenerated) {
    const t = firstUser.content.replace(/^.{0,50}[\s\S]*/, (s) => s.slice(0, 50));
    conv.title = t.length < firstUser.content.length ? t + "…" : t;
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
  const conv = data.conversations.find((c) => c.id === convId);
  if (!conv) return;
  // Clear chat
  const chat = document.getElementById("__dp-chat");
  chat.innerHTML = "";
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
  currentMessages = conv.messages.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    thinking: m.thinking,
  }));
  // 重建 chatHistory 用于 API 上下文
  chatHistory = currentMessages.map((m) => ({ role: m.role, content: m.content }));
  // Re-render messages
  for (const msg of currentMessages) {
    addMsg(msg.role, msg.content, { skipTrack: true, thinking: msg.thinking });
  }
  data.activeId = conv.id;
  await saveConversations(data);
  showChat();
}
