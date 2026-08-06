// ==============================================
// DeepPage — Chat / Send Message & Title Generation
// 依赖 state.js / history.js / render.js
// ==============================================

async function sendMessage(opts = {}) {
  if (_sending) return;
  _sending = true;
  const input = document.getElementById("__dp-input");
  // opts.prompt 用于快捷按钮直接发送（不经过输入框，避免冲掉正在输入的内容）
  const isDirect = opts.prompt !== undefined;
  const text = isDirect ? opts.prompt : input.value.trim();
  if (!text) return;

  if (!isDirect) {
    input.value = "";
    input.style.height = "auto";
  }

  addMsg("user", text);
  showLoading();

  chatHistory.push({ role: "user", content: text });
  saveCurrentMessages();

  // 流式输出
  // 流式输出前裁剪历史
  await trimConversation();

  const lastFullText = "";

  try {
    // 声明在 executor 外，供 executor 闭包和后续 _dpMsgRef 引用（否则跨作用域 ReferenceError）
    let assistantDiv = null;
    let assistantBubble = null;
    const port = chrome.runtime.connect({ name: "chat-stream" });

    const fullTextPromise = new Promise((resolve, reject) => {
      let fullText = "";
      let reasoningText = "";
      let thinkToggle = null;
      let thinkBox = null;
      let hasThinking = false;
      // ---- 流式渲染节流状态 ----
      let renderDirty = false;
      let renderRafId = null;
      let lastRenderAt = 0;
      const RENDER_FRAME_MS = 16; // 正常节流：每帧最多渲染一次
      const RENDER_LONG_MS = 100; // 长文本降频间隔
      const RENDER_LONG_THRESHOLD = 3000; // 超过该字符数进入降频模式

      // rAF 节流渲染：chunk 到达只标记 dirty，统一在帧回调里渲染最新全文
      function scheduleRender(contentEl) {
        renderDirty = true;
        if (renderRafId !== null) return;
        const renderNow = () => {
          renderRafId = null;
          if (!renderDirty) return;
          renderDirty = false;
          const now = performance.now();
          // 长文本降频：未结束时限制渲染频率，避免超长回复卡顿
          const minInterval =
            fullText.length > RENDER_LONG_THRESHOLD ? RENDER_LONG_MS : RENDER_FRAME_MS;
          if (now - lastRenderAt < minInterval) {
            renderDirty = true;
            renderRafId = requestAnimationFrame(renderNow);
            return;
          }
          lastRenderAt = now;
          const chat = document.getElementById("__dp-chat");
          const wasAtBottom = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 2;
          contentEl.innerHTML = markdownToHtml(fullText);
          if (wasAtBottom) scrollChat();
        };
        renderRafId = requestAnimationFrame(renderNow);
      }

      // 强制立即渲染（done / error 时兜底，保证最终内容完整显示）
      function flushRender(contentEl) {
        if (renderRafId !== null) {
          cancelAnimationFrame(renderRafId);
          renderRafId = null;
        }
        renderDirty = false;
        const chat = document.getElementById("__dp-chat");
        const wasAtBottom = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 2;
        contentEl.innerHTML = markdownToHtml(fullText);
        if (wasAtBottom) scrollChat();
      }

      function createAssistantWithThinking() {
        if (assistantDiv) return;
        const loading = document.querySelector(".__dp-loading");
        if (loading) loading.remove();
        const chat = document.getElementById("__dp-chat");

        assistantDiv = document.createElement("div");
        assistantDiv.className = "__dp-msg __dp-assistant";

        // Bubble wraps everything: toggle + thinkBox + content
        assistantBubble = document.createElement("div");
        assistantBubble.className = "__dp-bubble";

        // Toggle: 思考 ▾ (expanded) / 思考 ▸ (collapsed)
        const label = t("thinkingLabel") || "思考过程";
        thinkToggle = document.createElement("span");
        thinkToggle.className = "__dp-think-toggle";
        thinkToggle.innerHTML = label + " ▾";
        thinkToggle.style.display = "none";

        // Thinking content box
        thinkBox = document.createElement("div");
        thinkBox.className = "__dp-think-box";
        thinkBox.style.display = "none";
        thinkBox.textContent = "";

        // Content container (markdown renders here)
        const contentContainer = document.createElement("div");
        contentContainer.className = "__dp-bubble-content";

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
        const label = t("thinkingLabel") || "思考过程";
        thinkToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          const isCollapsed = thinkToggle.textContent.indexOf("▸") !== -1;
          if (isCollapsed) {
            thinkBox.style.display = "";
            thinkToggle.innerHTML = label + " ▾";
          } else {
            thinkBox.style.display = "none";
            thinkToggle.innerHTML = label + " ▸";
          }
        });
      }

      port.onMessage.addListener((resp) => {
        if (resp.type === "reasoning_chunk") {
          reasoningText += resp.text;
          if (!hasThinking) {
            hasThinking = true;
            createAssistantWithThinking();
          }
          // Fill thinking text while streaming
          thinkBox.textContent = reasoningText;
          thinkBox.style.display = "";
          thinkToggle.style.display = "";
          thinkToggle.textContent = "▼";
          scrollChat();
        } else if (resp.type === "chunk") {
          if (assistantDiv && !assistantBubble._hasContent) {
            assistantBubble._hasContent = true;
            // Loading was already removed by createAssistantWithThinking or we need to remove it
            const loading = document.querySelector(".__dp-loading");
            if (loading) loading.remove();

            // Thinking done: collapse to ▸ text
            if (hasThinking) {
              const label = t("thinkingLabel") || "思考过程";
              thinkBox.style.display = "none";
              thinkToggle.innerHTML = label + " ▸";
              thinkToggle.style.display = "";
              attachToggleHandler();
            }
          }
          fullText += resp.text;
          // 获取或创建 contentContainer
          let contentEl = null;
          if (assistantBubble && assistantBubble.__content) {
            contentEl = assistantBubble.__content;
          } else {
            // 无思考，首次 chunk 创建普通气泡
            const loading = document.querySelector(".__dp-loading");
            if (loading) loading.remove();
            const chat = document.getElementById("__dp-chat");
            assistantDiv = document.createElement("div");
            assistantDiv.className = "__dp-msg __dp-assistant";
            assistantBubble = document.createElement("div");
            assistantBubble.className = "__dp-bubble";
            contentEl = document.createElement("div");
            contentEl.className = "__dp-bubble-content";
            assistantBubble.appendChild(contentEl);
            assistantDiv.appendChild(assistantBubble);
            chat.appendChild(assistantDiv);
            scrollChat();
            // 复用当前气泡：后续 chunk 直接更新 contentEl（否则每个 chunk 都会新建气泡）
            assistantBubble.__content = contentEl;
          }
          const chat = document.getElementById("__dp-chat");
          const wasAtBottom = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 2;
          scheduleRender(contentEl);
          if (wasAtBottom) scrollChat();
        } else if (resp.type === "done") {
          // 添加复制按钮
          if (assistantDiv && assistantBubble) {
            const copyBtn = document.createElement("button");
            copyBtn.className = "__dp-copy-btn";
            copyBtn.innerHTML =
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            copyBtn.title = t("copyButton") || "Copy";
            copyBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(fullText).then(() => {
                copyBtn.classList.add("__dp-copied");
                setTimeout(() => copyBtn.classList.remove("__dp-copied"), 1500);
                toastSuccess(t("copySuccess") || "Copied");
              });
            });
            assistantDiv.appendChild(copyBtn);
            attachDelBtn(assistantDiv);
          }
          // 处理仅思考无正文等边缘情况
          if (hasThinking && !fullText && reasoningText) {
            // 只有思考没有正文 → 把思考当正文
            if (!assistantBubble) {
              const chat = document.getElementById("__dp-chat");
              assistantDiv = document.createElement("div");
              assistantDiv.className = "__dp-msg __dp-assistant";
              assistantBubble = document.createElement("div");
              assistantBubble.className = "__dp-bubble";
              assistantDiv.appendChild(assistantBubble);
              chat.appendChild(assistantDiv);
            }
            assistantBubble.innerHTML = markdownToHtml(reasoningText);
            fullText = reasoningText;
            // 移除思考 toggle 和 box
            if (thinkToggle) thinkToggle.remove();
            if (thinkBox) thinkBox.remove();
          }
          // 流式结束：强制 flush 未渲染的剩余 chunk，确保最终内容完整
          if (fullText && assistantBubble && assistantBubble.__content) {
            flushRender(assistantBubble.__content);
          }
          resolve({ fullText, reasoningText });
        } else if (resp.type === "error") {
          // 出错时也 flush 已收到的内容（保留部分回复），再 reject
          if (assistantBubble && assistantBubble.__content) {
            flushRender(assistantBubble.__content);
          }
          reject(new Error(resp.text));
        }
      });

      // 发送请求
      port.postMessage({ action: "chat", pageContext, chatHistory, thinking: opts.thinking });
    });

    const respData = await fullTextPromise;
    const fullText = respData.fullText || "";
    const thinkingText = respData.reasoningText || "";
    chatHistory.push({ role: "assistant", content: fullText });
    // 同时加入 currentMessages 以支持导出和持久化
    const msgRef = {
      role: "assistant",
      content: fullText,
      timestamp: Date.now(),
      thinking: thinkingText,
    };
    currentMessages.push(msgRef);
    if (assistantDiv) assistantDiv._dpMsgRef = msgRef;
    saveCurrentMessages();
    // 第一轮对话（第一条 assistant 回复）完成后，用 AI 生成对话标题
    if (chatHistory.filter((m) => m.role === "assistant").length === 1) {
      generateTitleAsync();
    }
    _sending = false;
  } catch (err) {
    _sending = false;
    // 移除 loading
    const loading = document.querySelector(".__dp-loading");
    if (loading) loading.remove();

    const errMsg = err.message === "NO_API_KEY" ? t("errorNoApiKey") : err.message;
    addMsg("assistant", errMsg, { icon: iconError(14) });
    if (err.message === "NO_API_KEY") showLoginNotice(true);
    chatHistory.pop();
  }
}

// ===== AI 生成对话标题（第一轮对话后异步调用，失败静默降级） =====
async function generateTitleAsync() {
  try {
    const firstUser = chatHistory.find((m) => m.role === "user");
    const firstAssistant = chatHistory.find((m) => m.role === "assistant");
    if (!firstUser || !firstAssistant) return;
    // 标题已被用户手动锁定：不再生成 AI 标题
    const lockedData = await loadConversations();
    const lockedConv = (lockedData.conversations || []).find((c) => c.id === currentConvId);
    if (lockedConv && lockedConv.titleLocked) return;
    // 用当前界面语言的 prompt 生成对应语言的标题
    const prompt = t("titleGenPrompt");
    const resp = await chrome.runtime.sendMessage({
      action: "generateTitle",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: firstUser.content },
        { role: "assistant", content: firstAssistant.content },
      ],
    });
    if (!resp || resp.error || !resp.text) return;
    const data = await loadConversations();
    const conv = data.conversations.find((c) => c.id === currentConvId);
    if (!conv) return;
    conv.title = resp.text;
    conv.titleGenerated = true;
    conv.updatedAt = Date.now();
    await saveConversations(data);
    // 历史列表可见时刷新标题显示
    const list = document.getElementById("__dp-history-list");
    if (list && !list.classList.contains("__dp-hide")) {
      renderHistoryResults();
    }
  } catch (e) {
    // 静默降级：保留 saveCurrentMessages 里的 50 字截断标题
    console.warn("[DeepPage] title generation failed:", e);
  }
}
