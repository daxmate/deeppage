// ==============================================
// DeepPage — Content Script
// Floating 🧊 button → inline chat panel
// ==============================================

// ===== 动态注入样式（新增） =====
function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* ----- 面板容器 ----- */
    #__dp-panel {
      position: fixed !important;
      left: auto;
      right: 24px;
      top: 80px;
      width: 420px;
      height: 480px;
      min-width: 260px;
      min-height: 280px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: none; /* 默认隐藏 */
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 2147483647;
      border: 1px solid rgba(255,255,255,0.1);
      transition: box-shadow 0.2s;
    }
    #__dp-panel.__dp-open {
      display: flex;
    }

    /* 标题栏 */
    #__dp-panel-header {
      height: 44px;
      background: #4a6cf7;
      display: flex;
      align-items: center;
      padding: 0 16px;
      color: white;
      font-weight: 600;
      font-size: 15px;
      cursor: grab;
      flex-shrink: 0;
      user-select: none;
      border-bottom: 1px solid rgba(255,255,255,0.15);
    }
    #__dp-panel-header:active { cursor: grabbing; }
    #__dp-panel-header span { flex: 1; }
    #__dp-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 18px;
      line-height: 28px;
      text-align: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    #__dp-close:hover { background: rgba(255, 70, 70, 0.8); }

    /* 内容区域 */
    #__dp-chat {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f7f9fc;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #__dp-context-bar {
      padding: 6px 16px;
      background: #eef2ff;
      color: #1e293b;
      font-size: 13px;
      border-bottom: 1px solid #d0d9f0;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    #__dp-context-bar.__dp-hidden { display: none; }

    #__dp-quick-actions {
      padding: 8px 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      background: #f7f9fc;
      border-bottom: 1px solid #e9ecf5;
      flex-shrink: 0;
    }
    #__dp-quick-actions.__dp-hidden { display: none; }
    #__dp-quick-actions button {
      background: white;
      border: 1px solid #d0d9f0;
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 12px;
      color: #1e293b;
      cursor: pointer;
      transition: all 0.15s;
    }
    #__dp-quick-actions button:hover {
      background: #4a6cf7;
      color: white;
      border-color: #4a6cf7;
    }

    #__dp-login-notice {
      padding: 16px;
      background: #fff3cd;
      color: #856404;
      font-size: 13px;
      text-align: center;
      border-bottom: 1px solid #ffc107;
      flex-shrink: 0;
    }
    #__dp-login-notice.__dp-hidden { display: none; }
    #__dp-login-notice .__dp-small {
      font-size: 12px;
      margin-top: 6px;
      color: #6b7a8a;
    }

    #__dp-input-row {
      display: flex;
      padding: 8px 12px;
      background: white;
      border-top: 1px solid #e9ecf5;
      gap: 8px;
      flex-shrink: 0;
      align-items: flex-end;
    }
    #__dp-input {
      flex: 1;
      border: 1px solid #d0d9f0;
      border-radius: 20px;
      padding: 8px 16px;
      resize: none;
      font-size: 14px;
      line-height: 1.4;
      max-height: 120px;
      outline: none;
      transition: border-color 0.15s;
      font-family: inherit;
    }
    #__dp-input:focus { border-color: #4a6cf7; }
    #__dp-input:disabled { background: #f1f3f5; }
    #__dp-send {
      background: #4a6cf7;
      color: white;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      font-size: 18px;
      cursor: pointer;
      transition: background 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #__dp-send:hover:not(:disabled) { background: #3b5de7; }
    #__dp-send:disabled { opacity: 0.5; cursor: not-allowed; }

    /* 消息样式 */
    .__dp-msg { display: flex; margin: 2px 0; }
    .__dp-msg.__dp-user { justify-content: flex-end; }
    .__dp-msg.__dp-assistant { justify-content: flex-start; }
    .__dp-bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      word-wrap: break-word;
      line-height: 1.5;
      font-size: 14px;
    }
    .__dp-msg.__dp-user .__dp-bubble {
      background: #4a6cf7;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .__dp-msg.__dp-assistant .__dp-bubble {
      background: #f1f3f5;
      border-bottom-left-radius: 4px;
    }
    .__dp-bubble code { background: #e9ecf5; padding: 1px 6px; border-radius: 4px; font-size: 13px; }
    .__dp-bubble pre { background: #1e293b; color: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; }
    .__dp-bubble strong { font-weight: 600; }
    .__dp-bubble em { font-style: italic; }
    .__dp-bubble a { color: #4a6cf7; text-decoration: underline; }

    .__dp-loading {
      display: flex;
      gap: 4px;
      padding: 10px 0;
      justify-content: flex-start;
    }
    .__dp-loading span {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #4a6cf7;
      border-radius: 50%;
      animation: __dp-bounce 1.2s infinite ease-in-out;
    }
    .__dp-loading span:nth-child(2) { animation-delay: 0.2s; }
    .__dp-loading span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes __dp-bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

	/* ----- 四角拖拽手柄（完全透明，仅保留交互区域） ----- */
.__dp-resize-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  z-index: 10;
  background: transparent;
  border: none;
  pointer-events: auto;   /* 确保可点击 */
}
/* 各方向定位与光标 */
.__dp-resize-handle.tl { top: 0; left: 0; cursor: nw-resize; }
.__dp-resize-handle.tr { top: 0; right: 0; cursor: ne-resize; }
.__dp-resize-handle.bl { bottom: 0; left: 0; cursor: sw-resize; }
.__dp-resize-handle.br { bottom: 0; right: 0; cursor: se-resize; }
/* 隐藏伪元素装饰 */
.__dp-resize-handle::after {
  display: none;
}

    /* ----- 浮动按钮 ----- */
    #__dp-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #4a6cf7;
      color: white;
      border: none;
      font-size: 28px;
      box-shadow: 0 8px 24px rgba(74, 108, 247, 0.4);
      cursor: pointer;
      z-index: 2147483646;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #__dp-btn:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(74, 108, 247, 0.5); }
    #__dp-btn.__dp-hidden { display: none; }
  `;
  document.head.appendChild(style);
}

// ==============================================
// 原有功能：内容提取、聊天逻辑等（保持不变）
// ==============================================
let chatPanel = null;
let panelOpen = false;
let pageContext = null;

function extractPageContent() {
  const article =
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.querySelector('[role="main"]');
  let text = "";
  if (article) {
    text = article.innerText;
  } else {
    const clone = document.body.cloneNode(true);
    clone
      .querySelectorAll(
        'script,style,nav,header,footer,aside,iframe,.sidebar,.nav,[role="navigation"],[role="banner"]',
      )
      .forEach((el) => el.remove());
    text = clone.innerText;
  }
  text = text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const MAX = 15000;
  if (text.length > MAX) text = text.slice(0, MAX) + "\n\n...（已截取）";
  return { title: document.title, url: location.href, text };
}

// ==============================================
// 新面板创建（含四角拖拽手柄 + 标题栏拖拽）
// ==============================================
function createChatPanel() {
  const panel = document.createElement("div");
  panel.id = "__dp-panel";
  panel.innerHTML = `
    <div id="__dp-panel-header">
      <span>🧊 DeepPage</span>
      <button id="__dp-close">✕</button>
    </div>
    <div id="__dp-context-bar" class="__dp-hidden">
      📄 <span id="__dp-context-title"></span>
    </div>
    <div id="__dp-quick-actions" class="__dp-hidden">
      <button id="__dp-btn-summarize">📝 总结全文</button>
      <button id="__dp-btn-outline">🎯 提炼要点</button>
      <button id="__dp-btn-translate">🌐 翻译</button>
    </div>
    <div id="__dp-login-notice" class="__dp-hidden">
      <div>需要配置 DeepSeek API Key</div>
      <div class="__dp-small">
        · 点击扩展图标 → 选项 → 输入 API Key<br>
        · 或去 <a href="https://platform.deepseek.com/api_keys" target="_blank">platform.deepseek.com</a> 获取
      </div>
    </div>
    <div id="__dp-chat"></div>
    <div id="__dp-input-row">
      <textarea id="__dp-input" placeholder="输入问题..." rows="1"></textarea>
      <button id="__dp-send">➤</button>
    </div>
    <!-- 四个拖拽手柄 -->
    <div class="__dp-resize-handle tl" data-dir="tl"></div>
    <div class="__dp-resize-handle tr" data-dir="tr"></div>
    <div class="__dp-resize-handle bl" data-dir="bl"></div>
    <div class="__dp-resize-handle br" data-dir="br"></div>
  `;
  document.body.appendChild(panel);
  return panel;
}

// ==============================================
// 拖拽移动（标题栏）
// ==============================================
function enableDrag(headerEl, panelEl) {
  let isDragging = false,
    startX,
    startY,
    startLeft,
    startTop;
  headerEl.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    isDragging = true;
    const rect = panelEl.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    panelEl.style.left = startLeft + "px";
    panelEl.style.top = startTop + "px";
    panelEl.style.bottom = "auto";
    panelEl.style.right = "auto";
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let left = startLeft + e.clientX - startX;
    let top = startTop + e.clientY - startY;
    // 边界限制
    const w = panelEl.offsetWidth,
      h = panelEl.offsetHeight;
    left = Math.max(0, Math.min(left, window.innerWidth - w));
    top = Math.max(0, Math.min(top, window.innerHeight - h));
    panelEl.style.left = left + "px";
    panelEl.style.top = top + "px";
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

// ==============================================
// 四角调整大小（核心新逻辑）
// ==============================================
function enableResize(panelEl) {
  const handles = panelEl.querySelectorAll(".__dp-resize-handle");
  const minW = 260,
    minH = 280;

  handles.forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const dir = handle.dataset.dir;
      const rect = panelEl.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = rect.width;
      const startH = rect.height;
      const startLeft = rect.left;
      const startTop = rect.top;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newW = startW,
          newH = startH;
        let newLeft = startLeft,
          newTop = startTop;

        // 只有 br，简化逻辑
        newW = Math.max(minW, startW + dx);
        newH = Math.max(minH, startH + dy);

        const maxX = window.innerWidth - newW;
        const maxY = window.innerHeight - newH;
        newLeft = Math.max(0, Math.min(newLeft, maxX));
        newTop = Math.max(0, Math.min(newTop, maxY));

        panelEl.style.setProperty("width", newW + "px", "important");
        panelEl.style.setProperty("height", newH + "px", "important");
        panelEl.style.setProperty("left", newLeft + "px", "important");
        panelEl.style.setProperty("top", newTop + "px", "important");
        panelEl.style.setProperty("bottom", "auto", "important");
        panelEl.style.setProperty("right", "auto", "important");
      };

      const onEnd = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onEnd);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onEnd);
    });
  });
}

// ==============================================
// 聊天相关函数（保持原样，未改动）
// ==============================================
let chatHistory = [];

function markdownToHtml(text) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank">$1</a>',
  );
  html = html.replace(/\n/g, "<br>");
  return html;
}

function addMsg(role, text) {
  const chat = document.getElementById("__dp-chat");
  const loading = chat.querySelector(".__dp-loading");
  if (loading) loading.remove();

  const div = document.createElement("div");
  div.className = `__dp-msg __dp-${role}`;
  const bubble = document.createElement("div");
  bubble.className = "__dp-bubble";
  bubble.innerHTML = markdownToHtml(text);
  div.appendChild(bubble);
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

function scrollChat() {
  const chat = document.getElementById("__dp-chat");
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
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

function togglePanel() {
  panelOpen = !panelOpen;
  const panel = document.getElementById("__dp-panel");
  const btn = document.getElementById("__dp-btn");
  panel.classList.toggle("__dp-open", panelOpen);
  btn.classList.toggle("__dp-hidden", panelOpen);

  if (panelOpen) {
    pageContext = extractPageContent();
    updateContext(pageContext.title);
    if (!chatHistory.length) {
      document.getElementById("__dp-chat").innerHTML = "";
      addMsg("assistant", `📄 已加载「${pageContext.title}」作为对话背景`);
    }
    document.getElementById("__dp-input").focus();

    chrome.runtime.sendMessage({ action: "checkLogin" }, (resp) => {
      showLoginNotice(!resp?.loggedIn);
      if (resp?.loggedIn) {
        document
          .getElementById("__dp-quick-actions")
          .classList.remove("__dp-hidden");
      }
    });
  } else {
    document.getElementById("__dp-quick-actions").classList.add("__dp-hidden");
  }
}

async function sendMessage() {
  const input = document.getElementById("__dp-input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  input.style.height = "auto";

  addMsg("user", text);
  showLoading();

  chatHistory.push({ role: "user", content: text });

  try {
    const resp = await chrome.runtime.sendMessage({
      action: "chat",
      pageContext,
      chatHistory,
    });

    if (resp?.error) {
      addMsg(
        "assistant",
        `❌ ${resp.error === "NO_API_KEY" ? "未配置 API Key，请在扩展设置中配置" : resp.error}`,
      );
      if (resp.error === "NO_API_KEY") showLoginNotice(true);
      chatHistory.pop();
      return;
    }

    addMsg("assistant", resp.text);
    chatHistory.push({ role: "assistant", content: resp.text });
  } catch (err) {
    addMsg("assistant", `❌ ${err.message}`);
    chatHistory.pop();
  }
}

// ==============================================
// 入口：创建按钮、面板、绑定事件（整合新方案）
// ==============================================
function createButton() {
  if (document.getElementById("__dp-btn")) return;

  // 注入样式（确保先于元素）
  injectStyles();

  const btn = document.createElement("button");
  btn.id = "__dp-btn";
  btn.innerHTML = "🧊";
  btn.addEventListener("click", togglePanel);
  document.body.appendChild(btn);

  chatPanel = createChatPanel();

  // 启用拖拽移动 + 四角缩放
  enableDrag(document.getElementById("__dp-panel-header"), chatPanel);
  enableResize(chatPanel);

  // 绑定原有事件
  document.getElementById("__dp-close").addEventListener("click", togglePanel);
  document.getElementById("__dp-send").addEventListener("click", sendMessage);
  document
    .getElementById("__dp-btn-summarize")
    .addEventListener("click", () => {
      document.getElementById("__dp-input").value =
        "请用中文总结这篇网页的核心内容";
      sendMessage();
    });
  document.getElementById("__dp-btn-outline").addEventListener("click", () => {
    document.getElementById("__dp-input").value =
      "请提炼这篇网页的要点，以列表形式列出";
    sendMessage();
  });
  document
    .getElementById("__dp-btn-translate")
    .addEventListener("click", () => {
      document.getElementById("__dp-input").value = "请将这篇网页翻译成中文";
      sendMessage();
    });
  document.getElementById("__dp-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  document.getElementById("__dp-input").addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createButton);
} else {
  createButton();
}
