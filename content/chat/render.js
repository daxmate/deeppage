// ==============================================
// DeepPage — Chat / Message Rendering & Deletion
// 依赖 state.js（currentMessages/chatHistory）
// ==============================================

function addMsg(role, text, extra) {
  const chat = document.getElementById("__dp-chat");
  const loading = chat.querySelector(".__dp-loading");
  if (loading) loading.remove();

  const div = document.createElement("div");
  div.className = `__dp-msg __dp-${role}`;
  if (extra && extra.dataset) {
    Object.keys(extra.dataset).forEach((k) => {
      div.dataset[k] = extra.dataset[k];
    });
  }
  const bubble = document.createElement("div");
  bubble.className = "__dp-bubble";

  // 如果消息有思考内容，在气泡内添加 toggle + think box
  const thinkText = extra && extra.thinking;
  if (role === "assistant" && thinkText) {
    const toggle = document.createElement("span");
    toggle.className = "__dp-think-toggle";
    toggle.innerHTML = (t("thinkingLabel") || "思考过程") + " ▸";
    const thinkBox = document.createElement("div");
    thinkBox.className = "__dp-think-box";
    thinkBox.style.display = "none";
    thinkBox.textContent = thinkText;
    bubble.appendChild(toggle);
    bubble.appendChild(thinkBox);
    // Toggle click
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isCollapsed = thinkBox.style.display === "none";
      thinkBox.style.display = isCollapsed ? "" : "none";
      toggle.innerHTML = (t("thinkingLabel") || "思考过程") + (isCollapsed ? " ▾" : " ▸");
    });
  }

  // 正文内容
  const contentEl = document.createElement("div");
  contentEl.className = "__dp-bubble-content";
  contentEl.innerHTML = markdownToHtml(text);
  bubble.appendChild(contentEl);
  // 自绘图标（系统消息等）：作为独立 span 插在正文前，不进入文本内容
  // （导出/复制纯文本时不会带上 SVG 源码）
  if (extra && extra.icon) {
    const iconEl = document.createElement("span");
    iconEl.className = "__dp-msg-icon";
    iconEl.innerHTML = extra.icon;
    bubble.insertBefore(iconEl, contentEl);
  }
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
  if (role === "assistant") {
    const copyBtn = document.createElement("button");
    copyBtn.className = "__dp-copy-btn";
    copyBtn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    copyBtn.title = t("copyButton") || "Copy";
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.classList.add("__dp-copied");
        setTimeout(() => copyBtn.classList.remove("__dp-copied"), 1500);
        toastSuccess(t("copySuccess") || "Copied");
      });
    });
    div.appendChild(copyBtn);
  }

  // 所有消息都有删除按钮
  attachDelBtn(div);

  chat.appendChild(div);
  scrollChat();
  // 消息变化后同步 header 按钮可用状态
  updateHeaderButtons();
}

// ===== 消息删除 =====
function attachDelBtn(div) {
  const delBtn = document.createElement("button");
  delBtn.className = "__dp-del-btn";
  delBtn.title = t("deleteButton") || "Delete";
  delBtn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
  delBtn.addEventListener("click", (e) => {
    // 阻止冒泡：删除后 div 已脱离 DOM，document 上的 handleClickOutside 会
    // 因 panel.contains(e.target) === false 误判为面板外点击而关闭面板
    e.stopPropagation();
    deleteMessage(div);
  });
  div.appendChild(delBtn);
}

async function deleteMessage(div) {
  // 欢迎/context-loaded 消息（skipTrack，不入数组）：只删 DOM，不影响数据
  if (div.dataset.msgType === "context-loaded" || div.dataset.msgType === "welcome") {
    div.remove();
    return;
  }

  let ref = div._dpMsgRef;
  if (!ref) {
    // 历史加载渲染的消息（skipTrack）：DOM 顺序 == currentMessages 顺序，按位置匹配
    const chat = document.getElementById("__dp-chat");
    const idx = Array.from(chat.querySelectorAll(".__dp-msg")).indexOf(div);
    if (idx !== -1 && idx < currentMessages.length) ref = currentMessages[idx];
  }
  div.remove();

  if (ref) {
    // currentMessages：按对象引用精确删除（不受 skipTrack 消息影响）
    const ci = currentMessages.indexOf(ref);
    if (ci !== -1) currentMessages.splice(ci, 1);
    // chatHistory：无对象引用（发送时重建），按 role+content 匹配删除
    const hi = chatHistory.findIndex((m) => m.role === ref.role && m.content === ref.content);
    if (hi !== -1) chatHistory.splice(hi, 1);
  }
  // 删空后重新置灰 header 按钮
  updateHeaderButtons();
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
