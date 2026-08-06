// ==============================================
// DeepPage — Chat / Conversation Management & History
// 依赖 state.js（共享状态与存储层）
// ==============================================

// ===== 对话重命名（历史列表内联编辑） =====
function startRename(convId) {
  const list = document.getElementById("__dp-history-list");
  if (!list) return;
  // 同一时间只允许一个编辑框（关闭其他项）
  list.querySelectorAll(".__dp-history-item").forEach((item) => {
    const title = item.querySelector(".__dp-history-title");
    const input = item.querySelector(".__dp-history-rename-input");
    if (item.dataset.id !== convId && input && input.style.display !== "none") {
      commitRename(item.dataset.id);
    }
  });
  const item = list.querySelector(`.__dp-history-item[data-id="${convId}"]`);
  if (!item) return;
  const title = item.querySelector(".__dp-history-title");
  const input = item.querySelector(".__dp-history-rename-input");
  if (!title || !input) return;
  title.style.display = "none";
  input.style.display = "";
  input.value = title.textContent;
  input.focus();
  input.select();
}

// 保存重命名：空标题回退原标题；成功清除 titleGenerated（用户手动命名后 AI 不再覆盖）
async function commitRename(convId) {
  const list = document.getElementById("__dp-history-list");
  const item = list && list.querySelector(`.__dp-history-item[data-id="${convId}"]`);
  if (!item) return;
  const title = item.querySelector(".__dp-history-title");
  const input = item.querySelector(".__dp-history-rename-input");
  if (!title || !input) return;
  const newTitle = input.value.trim();
  // 空标题 → 回退原标题，不保存
  if (!newTitle) {
    input.style.display = "none";
    title.style.display = "";
    return;
  }
  const data = await loadConversations();
  const conv = data.conversations.find((c) => c.id === convId);
  if (conv) {
    conv.title = newTitle;
    conv.titleLocked = true; // 手动重命名后标题锁定：AI 生成与自动截断都不再覆盖
    conv.updatedAt = Date.now();
    await saveConversations(data);
  }
  input.style.display = "none";
  title.style.display = "";
  title.textContent = newTitle;
  // 历史列表可见时刷新（保持搜索过滤状态）
  if (list && !list.classList.contains("__dp-hide")) {
    renderHistoryResults();
  }
}

async function deleteConversation(convId) {
  const data = await loadConversations();
  data.conversations = data.conversations.filter((c) => c.id !== convId);
  // 如果删掉了当前对话，activeId 跳到第一个
  if (data.activeId === convId) {
    data.activeId = data.conversations.length > 0 ? data.conversations[0].id : null;
    currentConvId = data.activeId;
  }
  await saveConversations(data);
  // 始终刷新历史列表并停留在当前视图，不切换回聊天
  const list = document.getElementById("__dp-history-list");
  if (list && !list.classList.contains("__dp-hide")) {
    renderHistoryList();
  } else {
    // 不在历史视图，正常处理
    if (!data.activeId) {
      currentConvId = null;
      currentMessages = [];
      document.getElementById("__dp-chat").innerHTML = "";
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
  document.getElementById("__dp-chat").innerHTML = "";
  await getOrCreateConv();
  showChat();
  // 空对话：禁用导出/清除上下文/新建按钮
  updateHeaderButtons();
}

async function loadActiveConversation() {
  const data = await loadConversations();
  if (data.activeId && data.conversations.length > 0) {
    const conv = data.conversations.find((c) => c.id === data.activeId);
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
        document.getElementById("__dp-chat").innerHTML = "";
        addMsg("assistant", t("contextLoaded", pageContext ? pageContext.title : ""), {
          skipTrack: true,
          dataset: { msgType: "context-loaded" },
          icon: iconContext(14),
        });
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
      currentMessages = conv.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        thinking: m.thinking,
      }));
      chatHistory = currentMessages.map((m) => ({ role: m.role, content: m.content }));
      const chat = document.getElementById("__dp-chat");
      chat.innerHTML = "";
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
  document.getElementById("__dp-chat").innerHTML = "";
  addMsg("assistant", t("welcomeMessage"), {
    skipTrack: true,
    dataset: { msgType: "welcome" },
  });
  addMsg("assistant", t("contextLoaded", pageContext ? pageContext.title : ""), {
    skipTrack: true,
    dataset: { msgType: "context-loaded" },
    icon: iconContext(14),
  });
}

function showHistory() {
  const chat = document.getElementById("__dp-chat");
  chat.classList.add("__dp-hide");
  let list = document.getElementById("__dp-history-list");
  if (!list) {
    list = document.createElement("div");
    list.id = "__dp-history-list";
    chat.parentNode.insertBefore(list, chat.nextSibling);
  }
  list.classList.remove("__dp-hide");
  renderHistoryList();
}

function showChat() {
  const chat = document.getElementById("__dp-chat");
  chat.classList.remove("__dp-hide");
  const list = document.getElementById("__dp-history-list");
  if (list) list.classList.add("__dp-hide");
}

async function renderHistoryList() {
  const list = document.getElementById("__dp-history-list");
  if (!list) return;
  const data = await loadConversations();
  const kw = (list.dataset.search || "").trim().toLowerCase();
  list.innerHTML = `
    <div class="__dp-history-header">
      <button class="__dp-history-back" title="${t("backToChat") || "Back"}">← <span>${t("backToChat") || "Back"}</span></button>
      <input class="__dp-history-search" type="text" placeholder="${t("historySearchPlaceholder") || "Search conversations"}" value="${escapeHtml(kw)}" />
    </div>
    <div class="__dp-history-scroll"></div>
  `;
  // 搜索框：阻止键盘事件冒泡到主页面（页面全局快捷键会收到按键）
  const searchInput = list.querySelector(".__dp-history-search");
  if (searchInput) {
    for (const evt of ["keydown", "keypress", "keyup"]) {
      searchInput.addEventListener(evt, (e) => e.stopPropagation());
    }
    searchInput.addEventListener("input", (e) => {
      e.stopPropagation();
      list.dataset.search = e.target.value;
      // 只重渲染结果区，不重建搜索框（否则输入框被替换、焦点丢失，后续按键进不去）
      renderHistoryResults();
    });
  }
  await renderHistoryResults();
  // Bind events
  bindHistoryListEvents(list);
}

// 只渲染历史列表的结果区（保留搜索框，避免输入时重建丢失焦点）
async function renderHistoryResults() {
  const list = document.getElementById("__dp-history-list");
  if (!list) return;
  const data = await loadConversations();
  const kw = (list.dataset.search || "").trim().toLowerCase();
  // 关键词过滤：匹配标题或任一消息内容
  const filtered = kw
    ? data.conversations.filter(
        (c) =>
          (c.title || "").toLowerCase().includes(kw) ||
          (c.messages || []).some((m) => (m.content || "").toLowerCase().includes(kw))
      )
    : data.conversations;
  const scroll = list.querySelector(".__dp-history-scroll");
  if (!scroll) return;
  scroll.innerHTML =
    (data.conversations.length === 0
      ? '<div class="__dp-history-empty">' + (t("historyEmpty") || "No conversations") + "</div>"
      : "") +
    (filtered.length === 0 && data.conversations.length > 0
      ? '<div class="__dp-history-empty">' +
        (t("historyNoMatch") || "No matching conversations") +
        "</div>"
      : "") +
    filtered
      .map(
        (c) => `
        <div class="__dp-history-item${c.id === currentConvId ? " active" : ""}" data-id="${c.id}">
          <div class="__dp-history-item-main">
            <div class="__dp-history-title">${escapeHtml(c.title)}</div>
            <input class="__dp-history-rename-input" type="text" value="${escapeHtml(c.title)}" placeholder="${t("renamePlaceholder") || "Enter new title"}" style="display:none" />
            <div class="__dp-history-meta">${c.messages.length} msg · ${formatRelativeTime(c.updatedAt)}</div>
          </div>
          <div class="__dp-history-actions">
            <button class="__dp-history-rename" data-id="${c.id}" title="${t("renameButton") || "Rename"}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button class="__dp-history-del" data-id="${c.id}" title="${t("deleteButton") || "Delete"}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `
      )
      .join("");
  bindHistoryListEvents(list);
}

// 绑定历史列表项事件（点击切换 / 删除 / 返回）
function bindHistoryListEvents(list) {
  list.querySelectorAll(".__dp-history-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".__dp-history-actions")) return;
      switchConversation(el.dataset.id);
    });
  });
  list.querySelectorAll(".__dp-history-del").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteConversation(el.dataset.id);
    });
  });
  list.querySelectorAll(".__dp-history-rename").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      startRename(el.dataset.id);
    });
  });
  list.querySelector(".__dp-history-back")?.addEventListener("click", showChat);
  // 重命名输入框：回车保存 / Esc 取消 / 失焦保存
  list.querySelectorAll(".__dp-history-rename-input").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      } else if (e.key === "Escape") {
        // Esc：清空输入框再 blur → 走空标题回退（不保存），天然免疫 blur 时序问题
        e.preventDefault();
        input.value = "";
        input.blur();
      }
    });
    input.addEventListener("blur", () => {
      const item = input.closest(".__dp-history-item");
      if (!item) return;
      commitRename(item.dataset.id);
    });
  });
}
