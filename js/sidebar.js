// ==============================================
// DeepPage — Sidebar Panel UI
// ==============================================

// ===== Panel State =====
let chatPanel = null;
let panelOpen = false;
let quickActions = [];
let DEFAULT_QUICK_ACTIONS = [];
let _suppressClose = false;
let _exportMenuOpen = false;
let _selBtn = null;

// ===== Panel UI =====

function initDefaultActions() {
  DEFAULT_QUICK_ACTIONS = [
    { id: "summarize", label: t("defaultSummarizeLabel"), prompt: t("defaultSummarizePrompt") },
    { id: "outline", label: t("defaultOutlineLabel"), prompt: t("defaultOutlinePrompt") },
    { id: "translate", label: t("defaultTranslateLabel"), prompt: t("defaultTranslatePrompt") },
  ];
}

function renderQuickActions() {
  const container = document.getElementById("__dp-quick-actions");
  if (!container) return;
  container.innerHTML = "";
  for (const action of quickActions) {
    const btn = document.createElement("button");
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      document.getElementById("__dp-input").value = action.prompt;
      sendMessage();
    });
    container.appendChild(btn);
  }
}

function loadQuickActionsFromStorage() {
  chrome.storage.sync.get(["quickActions", "quickActionsLang"], (result) => {
    const currentLang = getCurrentLang();
    const savedLang = result.quickActionsLang;
    // 语言变了 → 用默认值
    if (result.quickActions && result.quickActions.length && savedLang === currentLang) {
      quickActions = result.quickActions;
    } else {
      quickActions = DEFAULT_QUICK_ACTIONS;
    }
    renderQuickActions();
  });
}

function createChatPanel() {
  const panel = document.createElement("div");
  panel.id = "__dp-panel";
  panel.innerHTML = `
    <div id="__dp-panel-header">
      <span><svg width="18" height="18" viewBox="0 0 512 509.64" fill="none" style="vertical-align:middle"><path fill="currentColor" fill-rule="nonzero" d="M440.898 139.167c-4.001-1.961-5.723 1.776-8.062 3.673-.801.612-1.479 1.407-2.154 2.141-5.848 6.246-12.681 10.349-21.607 9.859-13.048-.734-24.192 3.368-34.04 13.348-2.093-12.307-9.048-19.658-19.635-24.37-5.54-2.449-11.141-4.9-15.02-10.227-2.708-3.795-3.447-8.021-4.801-12.185-.861-2.509-1.725-5.082-4.618-5.512-3.139-.49-4.372 2.142-5.601 4.349-4.925 9.002-6.833 18.921-6.647 28.962.432 22.597 9.972 40.597 28.932 53.397 2.154 1.47 2.707 2.939 2.032 5.082-1.293 4.41-2.832 8.695-4.186 13.105-.862 2.817-2.157 3.429-5.172 2.205-10.402-4.346-19.391-10.778-27.332-18.553-13.481-13.044-25.668-27.434-40.873-38.702a177.614 177.614 0 00-10.834-7.409c-15.512-15.063 2.032-27.434 6.094-28.902 4.247-1.532 1.478-6.797-12.251-6.736-13.727.061-26.285 4.653-42.288 10.777-2.34.92-4.801 1.593-7.326 2.142-14.527-2.756-29.608-3.368-45.367-1.593-29.671 3.305-53.368 17.329-70.788 41.272-20.928 28.785-25.854 61.482-19.821 95.59 6.34 35.943 24.683 65.704 52.876 88.974 29.239 24.123 62.911 35.943 101.32 33.677 23.329-1.346 49.307-4.468 78.607-29.27 7.387 3.673 15.142 5.144 28.008 6.246 9.911.92 19.452-.49 26.839-2.019 11.573-2.449 10.773-13.166 6.586-15.124-33.915-15.797-26.47-9.368-33.24-14.573 17.235-20.39 43.213-41.577 53.369-110.222.8-5.448.121-8.877 0-13.287-.061-2.692.553-3.734 3.632-4.041 8.494-.981 16.742-3.305 24.314-7.471 21.975-12.002 30.84-31.719 32.933-55.355.307-3.612-.061-7.348-3.879-9.245v-.003zM249.4 351.89c-32.872-25.838-48.814-34.352-55.4-33.984-6.155.368-5.048 7.41-3.694 12.002 1.415 4.532 3.264 7.654 5.848 11.634 1.785 2.634 3.017 6.551-1.784 9.493-10.587 6.55-28.993-2.205-29.856-2.635-21.421-12.614-39.334-29.269-51.954-52.047-12.187-21.924-19.267-45.435-20.435-70.542-.308-6.061 1.478-8.207 7.509-9.307 7.94-1.471 16.127-1.778 24.068-.615 33.547 4.9 62.108 19.902 86.054 43.66 13.666 13.531 24.007 29.699 34.658 45.496 11.326 16.778 23.514 32.761 39.026 45.865 5.479 4.592 9.848 8.083 14.035 10.656-12.62 1.407-33.673 1.714-48.075-9.676zm15.899-102.519c.521-2.111 2.421-3.658 4.722-3.658a4.74 4.74 0 011.661.305c.678.246 1.293.614 1.786 1.163.861.859 1.354 2.083 1.354 3.368 0 2.695-2.154 4.837-4.862 4.837a4.748 4.748 0 01-4.738-4.034 5.01 5.01 0 01.077-1.981zm47.208 26.915c-2.606.996-5.2 1.778-7.707 1.88-4.679.244-9.787-1.654-12.556-3.981-4.308-3.612-7.386-5.631-8.679-11.941-.554-2.695-.247-6.858.246-9.246 1.108-5.144-.124-8.451-3.754-11.451-2.954-2.449-6.711-3.122-10.834-3.122-1.539 0-2.954-.673-4.001-1.224-1.724-.856-3.139-3-1.785-5.634.432-.856 2.525-2.939 3.018-3.305 5.6-3.185 12.065-2.144 18.034.244 5.54 2.266 9.727 6.429 15.759 12.307 6.155 7.102 7.263 9.063 10.773 14.39 2.771 4.163 5.294 8.451 7.018 13.348.877 2.561.071 4.74-2.341 6.277-.981.625-2.109 1.044-3.191 1.458z"/></svg> DeepPage</span>
      <div class="__dp-lang-wrap">
        <button id="__dp-lang-btn" class="__dp-lang-btn" title="${t("languageLabel") || "Language"}"></button>
        <div id="__dp-lang-menu" class="__dp-lang-menu"></div>
      </div>
      <button id="__dp-dark-toggle" class="__dp-dark-toggle" title="Toggle dark mode"></button>
      <button id="__dp-history-btn" title="${t("historyButton") || "History"}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></button>
      <button id="__dp-export-btn" title="${t("exportButton") || "Export"}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
      <div id="__dp-export-menu" >
        <div data-action="markdown">${t("exportMarkdown") || "Copy Markdown"}</div>
        <div data-action="text">${t("exportText") || "Copy Plain Text"}</div>
        <div data-action="download">${t("exportDownload") || "Download .md"}</div>
      </div>
      <button id="__dp-clear-ctx-btn" title="${t("clearContextBtn") || "Clear Context"}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
      <button id="__dp-close">✕</button>
    </div>
    <div id="__dp-context-bar" class="__dp-hidden">
      📄 <span id="__dp-context-title"></span>
    </div>
    <div id="__dp-quick-actions" class="__dp-hidden"></div>
    <div id="__dp-login-notice" class="__dp-hidden">
      <div>${t("loginNoticeTitle")}</div>
      <div class="__dp-small">
        ${t("loginNoticeStep1")}<br>
        ${t("loginNoticeStep2")}
      </div>
    </div>
    <div id="__dp-chat"></div>
    <div id="__dp-input-row">
      <button id="__dp-new-btn" title="${t("newChatShort") || "New"}">+</button>
      <textarea id="__dp-input" placeholder="${t("inputPlaceholder")}" rows="1"></textarea>
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

function enableDrag(headerEl, panelEl) {
  let isDragging = false,
    startX,
    startY,
    startLeft,
    startTop;
  headerEl.addEventListener("mousedown", (e) => {
    if (e.target.closest("button") || e.target.closest("select")) return;
    isDragging = true;
    const rect = panelEl.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    panelEl.style.left = startLeft + "px";
    panelEl.style.top = startTop + "px";
    panelEl.style.transform = "none";
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

        switch (dir) {
          case "tl":
            newW = Math.max(minW, startW - dx);
            newH = Math.max(minH, startH - dy);
            newLeft = startLeft + (startW - newW);
            newTop = startTop + (startH - newH);
            break;
          case "tr":
            newW = Math.max(minW, startW + dx);
            newH = Math.max(minH, startH - dy);
            newTop = startTop + (startH - newH);
            break;
          case "bl":
            newW = Math.max(minW, startW - dx);
            newH = Math.max(minH, startH + dy);
            newLeft = startLeft + (startW - newW);
            break;
          case "br":
            newW = Math.max(minW, startW + dx);
            newH = Math.max(minH, startH + dy);
            break;
        }

        // 边界限制
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - newW));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - newH));

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

function handleClickOutside(e) {
  if (_suppressClose) return;
  const panel = document.getElementById("__dp-panel");
  const btn = document.getElementById("__dp-btn");
  if (!panel || !btn) return;
  // 点击在面板内部或浮动按钮上 → 不处理
  if (panel.contains(e.target) || btn.contains(e.target)) return;
  // 面板当前开启 → 关闭
  if (panelOpen) togglePanel();
}

function togglePanel() {
  panelOpen = !panelOpen;
  const panel = document.getElementById("__dp-panel");
  const btn = document.getElementById("__dp-btn");
  panel.classList.toggle("__dp-open", panelOpen);
  btn.classList.toggle("__dp-hidden", panelOpen);

  if (panelOpen) {
    if (!chatHistory.length) {
      loadActiveConversation();
    } else {
      // 面板已加载过对话，但需刷新页面上下文
      pageContext = extractPageContent();
      updateContext(pageContext.title);
    }
    document.getElementById("__dp-input").focus();

    loadQuickActionsFromStorage();
    chrome.runtime.sendMessage({ action: "checkLogin" }, (resp) => {
      showLoginNotice(!resp?.loggedIn);
      if (resp?.loggedIn) {
        document.getElementById("__dp-quick-actions").classList.remove("__dp-hidden");
      }
    });

    // 延迟一帧添加，避免点击按钮打开面板时立即触发关闭
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
  } else {
    document.removeEventListener("click", handleClickOutside);
    document.getElementById("__dp-quick-actions").classList.add("__dp-hidden");
  }
}

function createSelBtn() {
  // 自愈：按钮被外部（SPA 框架等）移除时重建，避免残留旧元素或重复元素
  if (_selBtn && document.body.contains(_selBtn)) return;
  if (_selBtn) _selBtn.remove();
  _selBtn = document.createElement("button");
  _selBtn.id = "__dp-sel-btn";
  _selBtn.textContent = t("selAskButton") || "💬 对此段提问";
  _selBtn.addEventListener("click", onSelAsk);
  document.body.appendChild(_selBtn);
}

async function onSelAsk() {
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : "";
  if (!text) return;
  hideSelBtn();
  sel.removeAllRanges();

  // 打开面板
  if (!panelOpen) {
    togglePanel();
    // 等待 loadActiveConversation（异步）完成
    await new Promise((r) => setTimeout(r, 50));
  }
  // 刷新页面上下文（面板已开也可能换了页面）
  pageContext = extractPageContent();
  updateContext(pageContext.title);

  // 检查当前对话上下文是否匹配当前页面
  const data = await loadConversations();
  let currentConv = data.conversations.find((c) => c.id === currentConvId);
  if (currentConv && currentConv.context && currentConv.context.url !== location.href) {
    // 不同页面 → 新建对话
    await newConversation();
    pageContext = extractPageContent();
    updateContext(pageContext.title);
  } else if (!currentConv || !currentConv.context) {
    // 无上下文记录 → 确保 pageContext 已设置
    if (!pageContext) {
      pageContext = extractPageContent();
      updateContext(pageContext.title);
    }
  }

  // 将选中内容作为用户消息发送
  const msg = `📝 ${t("selContextLabel") || "选中内容"}：\n\n${text.slice(0, 8000)}`;
  const input = document.getElementById("__dp-input");
  if (input) {
    input.value = msg;
    input.dispatchEvent(new Event("input"));
    sendMessage();
  }
}

function showSelBtn(x, y) {
  if (!_selBtn) createSelBtn();
  // 更新文字（语言可能变了）
  _selBtn.textContent = t("selAskButton") || "💬 对此段提问";
  _selBtn.style.left = Math.min(x, window.innerWidth - _selBtn.offsetWidth - 10) + "px";
  _selBtn.style.top = Math.max(4, y - _selBtn.offsetHeight - 6) + "px";
  _selBtn.classList.add("__dp-show");
}

function hideSelBtn() {
  if (_selBtn) _selBtn.classList.remove("__dp-show");
}

// 彻底移除选中按钮（SPA 导航时清理，避免旧页面的按钮残留）
function removeSelBtn() {
  if (_selBtn) {
    _selBtn.remove();
    _selBtn = null;
  }
}

// 监听 SPA 页面切换（pushState/replaceState + 浏览器前进后退 + hash 路由），导航后清理残留按钮
function watchSpaNavigation() {
  // 主世界 patch：content script 在 isolated world，直接改 history 方法对页面无效
  try {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("js/spa-patch.js");
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
    console.warn("[DeepPage] spa-patch 注入失败:", e);
  }
  window.addEventListener("dp:spa-navigate", removeSelBtn);
  window.addEventListener("popstate", removeSelBtn);
  window.addEventListener("hashchange", removeSelBtn);
}

function isSelectionValid() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return false;
  const text = sel.toString().trim();
  if (!text) return false;
  // 忽略选中扩展 UI 元素的内容
  const node = sel.anchorNode;
  if (node && node.closest && (node.closest("#__dp-panel") || node.closest("#__dp-btn")))
    return false;
  return text.length >= 5 && text.length <= 8000;
}

// ===== 悬浮按钮拖拽 + 位置记忆 =====
const BTN_DRAG_THRESHOLD = 5; // px，小于此位移视为点击

function enableBtnDrag(btn) {
  let startX = 0,
    startY = 0,
    startLeft = 0,
    startTop = 0,
    dragging = false;

  btn.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = btn.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    dragging = false;
    btn.classList.add("__dp-dragging");

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging && Math.abs(dx) < BTN_DRAG_THRESHOLD && Math.abs(dy) < BTN_DRAG_THRESHOLD)
        return;
      dragging = true;
      // 从 bottom/right 定位切换为 left/top 定位
      btn.style.right = "auto";
      btn.style.bottom = "auto";
      btn.style.left = Math.max(0, startLeft + dx) + "px";
      btn.style.top = Math.max(0, startTop + dy) + "px";
    };

    const onUp = (ev) => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      btn.classList.remove("__dp-dragging");
      if (dragging) {
        btn._dpDragged = true;
        // clamp 到视口内，避免拖出屏幕
        const w = btn.offsetWidth,
          h = btn.offsetHeight;
        const x = Math.min(Math.max(0, startLeft + ev.clientX - startX), window.innerWidth - w);
        const y = Math.min(Math.max(0, startTop + ev.clientY - startY), window.innerHeight - h);
        btn.style.left = x + "px";
        btn.style.top = y + "px";
        chrome.storage.sync.set({ btnPos: { x, y } });
        // 防止紧随其后的 click 触发 togglePanel
        setTimeout(() => {
          btn._dpDragged = false;
        }, 50);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

function restoreBtnPos(btn) {
  chrome.storage.sync.get("btnPos", (result) => {
    const pos = result.btnPos;
    if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") return;
    const w = btn.offsetWidth || 56;
    const h = btn.offsetHeight || 56;
    const x = Math.min(Math.max(0, pos.x), window.innerWidth - w);
    const y = Math.min(Math.max(0, pos.y), window.innerHeight - h);
    btn.style.right = "auto";
    btn.style.bottom = "auto";
    btn.style.left = x + "px";
    btn.style.top = y + "px";
  });
}

function createButton() {
  try {
    if (document.getElementById("__dp-btn")) return;

    // 先用检测的语言初始化，再异步加载存储的偏好
    window.__dp_lang = detectLanguage();
    initDefaultActions();
    // 加载页面正文截断长度配置（供 extractPageContent 同步读取）
    chrome.storage.sync.get("maxContextLen", (result) => {
      setMaxContextLen(result.maxContextLen);
    });
    loadLanguage(() => {
      initDefaultActions();
      // 面板已创建则更新占位符
      const inp = document.getElementById("__dp-input");
      if (inp) inp.placeholder = t("inputPlaceholder");
    });

    const btn = document.createElement("button");
    btn.id = "__dp-btn";
    btn.title = "DeepPage";
    btn.innerHTML =
      '<svg width="28" height="28" viewBox=\"0 0 512 509.64\" fill=\"none\" style=\"vertical-align:middle\"><path fill=\"currentColor\" fill-rule=\"nonzero\" d=\"M440.898 139.167c-4.001-1.961-5.723 1.776-8.062 3.673-.801.612-1.479 1.407-2.154 2.141-5.848 6.246-12.681 10.349-21.607 9.859-13.048-.734-24.192 3.368-34.04 13.348-2.093-12.307-9.048-19.658-19.635-24.37-5.54-2.449-11.141-4.9-15.02-10.227-2.708-3.795-3.447-8.021-4.801-12.185-.861-2.509-1.725-5.082-4.618-5.512-3.139-.49-4.372 2.142-5.601 4.349-4.925 9.002-6.833 18.921-6.647 28.962.432 22.597 9.972 40.597 28.932 53.397 2.154 1.47 2.707 2.939 2.032 5.082-1.293 4.41-2.832 8.695-4.186 13.105-.862 2.817-2.157 3.429-5.172 2.205-10.402-4.346-19.391-10.778-27.332-18.553-13.481-13.044-25.668-27.434-40.873-38.702a177.614 177.614 0 00-10.834-7.409c-15.512-15.063 2.032-27.434 6.094-28.902 4.247-1.532 1.478-6.797-12.251-6.736-13.727.061-26.285 4.653-42.288 10.777-2.34.92-4.801 1.593-7.326 2.142-14.527-2.756-29.608-3.368-45.367-1.593-29.671 3.305-53.368 17.329-70.788 41.272-20.928 28.785-25.854 61.482-19.821 95.59 6.34 35.943 24.683 65.704 52.876 88.974 29.239 24.123 62.911 35.943 101.32 33.677 23.329-1.346 49.307-4.468 78.607-29.27 7.387 3.673 15.142 5.144 28.008 6.246 9.911.92 19.452-.49 26.839-2.019 11.573-2.449 10.773-13.166 6.586-15.124-33.915-15.797-26.47-9.368-33.24-14.573 17.235-20.39 43.213-41.577 53.369-110.222.8-5.448.121-8.877 0-13.287-.061-2.692.553-3.734 3.632-4.041 8.494-.981 16.742-3.305 24.314-7.471 21.975-12.002 30.84-31.719 32.933-55.355.307-3.612-.061-7.348-3.879-9.245v-.003zM249.4 351.89c-32.872-25.838-48.814-34.352-55.4-33.984-6.155.368-5.048 7.41-3.694 12.002 1.415 4.532 3.264 7.654 5.848 11.634 1.785 2.634 3.017 6.551-1.784 9.493-10.587 6.55-28.993-2.205-29.856-2.635-21.421-12.614-39.334-29.269-51.954-52.047-12.187-21.924-19.267-45.435-20.435-70.542-.308-6.061 1.478-8.207 7.509-9.307 7.94-1.471 16.127-1.778 24.068-.615 33.547 4.9 62.108 19.902 86.054 43.66 13.666 13.531 24.007 29.699 34.658 45.496 11.326 16.778 23.514 32.761 39.026 45.865 5.479 4.592 9.848 8.083 14.035 10.656-12.62 1.407-33.673 1.714-48.075-9.676zm15.899-102.519c.521-2.111 2.421-3.658 4.722-3.658a4.74 4.74 0 011.661.305c.678.246 1.293.614 1.786 1.163.861.859 1.354 2.083 1.354 3.368 0 2.695-2.154 4.837-4.862 4.837a4.748 4.748 0 01-4.738-4.034 5.01 5.01 0 01.077-1.981zm47.208 26.915c-2.606.996-5.2 1.778-7.707 1.88-4.679.244-9.787-1.654-12.556-3.981-4.308-3.612-7.386-5.631-8.679-11.941-.554-2.695-.247-6.858.246-9.246 1.108-5.144-.124-8.451-3.754-11.451-2.954-2.449-6.711-3.122-10.834-3.122-1.539 0-2.954-.673-4.001-1.224-1.724-.856-3.139-3-1.785-5.634.432-.856 2.525-2.939 3.018-3.305 5.6-3.185 12.065-2.144 18.034.244 5.54 2.266 9.727 6.429 15.759 12.307 6.155 7.102 7.263 9.063 10.773 14.39 2.771 4.163 5.294 8.451 7.018 13.348.877 2.561.071 4.74-2.341 6.277-.981.625-2.109 1.044-3.191 1.458z\"/></svg>';
    // 按钮图标 = 当前配置的提供商 logo（hover 显示 提供商 · 模型）
    updateProviderIcon(btn);
    // options 页改配置后实时刷新按钮图标
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      if (changes.apiProvider || changes.apiModel) {
        const b = document.getElementById("__dp-btn");
        if (b) updateProviderIcon(b);
      }
    });
    btn.addEventListener("click", () => {
      // 刚拖拽过：忽略本次点击，避免误触 togglePanel
      if (btn._dpDragged) {
        btn._dpDragged = false;
        return;
      }
      togglePanel();
    });
    document.body.appendChild(btn);

    // 悬浮按钮拖拽移动 + 位置记忆
    enableBtnDrag(btn);
    restoreBtnPos(btn);

    chatPanel = createChatPanel();

    // 启用拖拽移动 + 四角缩放
    enableDrag(document.getElementById("__dp-panel-header"), chatPanel);
    enableResize(chatPanel);

    // 绑定事件
    document.getElementById("__dp-close").addEventListener("click", togglePanel);
    document.getElementById("__dp-send").addEventListener("click", sendMessage);
    document.getElementById("__dp-history-btn").addEventListener("click", showHistory);

    // 导出菜单全局点击（面板创建后绑定；元素被移除时不再空转）
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("__dp-export-menu");
      const btn = document.getElementById("__dp-export-btn");
      if (!menu || !btn) return;
      if (btn.contains(e.target)) {
        e.stopPropagation();
        _exportMenuOpen = !_exportMenuOpen;
        menu.classList.toggle("__dp-show", _exportMenuOpen);
        return;
      }
      if (!menu.contains(e.target)) {
        _exportMenuOpen = false;
        menu.classList.remove("__dp-show");
        return;
      }
      // 菜单项点击
      const item = e.target.closest("div[data-action]");
      if (item) {
        _exportMenuOpen = false;
        menu.classList.remove("__dp-show");
        exportConversation(item.dataset.action);
      }
    });
    document.getElementById("__dp-clear-ctx-btn").addEventListener("click", () => {
      clearContext();
    });
    document.getElementById("__dp-new-btn").addEventListener("click", () => {
      if (currentMessages.length === 0) return;
      newConversation();
    });

    // 语言选择器（紧凑按钮 + 下拉菜单）
    const langBtn = document.getElementById("__dp-lang-btn");
    const langMenu = document.getElementById("__dp-lang-menu");
    const renderLangMenu = () => {
      const current = getCurrentLang();
      LANGUAGES.forEach((lang) => {
        const item = document.createElement("div");
        item.className = "__dp-lang-item" + (lang.code === current ? " active" : "");
        item.dataset.code = lang.code;
        item.textContent = lang.label;
        langMenu.appendChild(item);
      });
    };
    // 语言加载完后选中正确的选项
    function updateLangSelection() {
      const current = getCurrentLang();
      const lang = LANGUAGES.find((l) => l.code === current);
      langBtn.textContent = lang ? lang.short : current;
      langMenu.querySelectorAll(".__dp-lang-item").forEach((el) => {
        el.classList.toggle("active", el.dataset.code === current);
      });
    }
    renderLangMenu();
    updateLangSelection();
    loadLanguage(() => {
      initDefaultActions();
      updateLangSelection();
    });
    // 按钮：展开/收起菜单
    langBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      langMenu.classList.toggle("__dp-show");
    });
    // 菜单项：切换语言
    langMenu.addEventListener("click", (e) => {
      const item = e.target.closest(".__dp-lang-item");
      if (!item) return;
      e.stopPropagation();
      const code = item.dataset.code;
      langMenu.classList.remove("__dp-show");
      if (code === getCurrentLang()) return;
      window.__dp_lang = code;
      setStoredLanguage(code, () => {
        // 重新初始化默认按钮并刷新
        initDefaultActions();
        updateLangSelection();
        // 更新已发送的「已加载」消息
        const ctxMsg = document.querySelector('[data-msg-type="context-loaded"]');
        if (ctxMsg) {
          const bubble = ctxMsg.querySelector(".__dp-bubble");
          if (bubble && pageContext)
            bubble.textContent = `📄 ${t("contextLoaded", pageContext.title)}`;
        }
        // 更新所有复制按钮的提示文字
        document.querySelectorAll(".__dp-copy-btn").forEach((btn) => {
          btn.title = t("copyButton");
        });
        // 更新输入框占位符
        const input = document.getElementById("__dp-input");
        if (input) input.placeholder = t("inputPlaceholder");
        // 更新历史按钮提示
        const histBtn = document.getElementById("__dp-history-btn");
        if (histBtn) histBtn.title = t("historyButton") || "History";
        const newBtn = document.getElementById("__dp-new-btn");
        if (newBtn) newBtn.title = t("newChatShort") || "New";
        // 更新清除上下文按钮
        const clearCtxBtn = document.getElementById("__dp-clear-ctx-btn");
        if (clearCtxBtn) clearCtxBtn.title = t("clearContextBtn") || "Clear Context";
        // 更新导出按钮
        const exportBtn = document.getElementById("__dp-export-btn");
        if (exportBtn) exportBtn.title = t("exportButton") || "Export";
        // 更新下拉菜单文字
        const menu = document.getElementById("__dp-export-menu");
        if (menu) {
          const items = menu.querySelectorAll("div[data-action]");
          if (items[0]) items[0].textContent = t("exportMarkdown") || "Copy Markdown";
          if (items[1]) items[1].textContent = t("exportText") || "Copy Plain Text";
          if (items[2]) items[2].textContent = t("exportDownload") || "Download .md";
        }
        // 更新选中文本按钮
        if (_selBtn) _selBtn.textContent = t("selAskButton") || "💬 对此段提问";
        if (panelOpen) {
          loadQuickActionsFromStorage();
        }
      });
    });
    // 点击面板内其他区域关闭语言菜单（按钮/菜单项已 stopPropagation）
    chatPanel.addEventListener("click", () => {
      langMenu.classList.remove("__dp-show");
    });
    // 面板关闭时也收起语言菜单
    document.getElementById("__dp-close").addEventListener("click", () => {
      langMenu.classList.remove("__dp-show");
    });

    // Dark mode toggle
    const darkBtn = document.getElementById("__dp-dark-toggle");
    const moonSVG =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    const sunSVG =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    function applyDarkMode(dark) {
      if (dark) {
        chatPanel.classList.add("__dp-dark");
        darkBtn.innerHTML = sunSVG;
      } else {
        chatPanel.classList.remove("__dp-dark");
        darkBtn.innerHTML = moonSVG;
      }
    }
    // System dark mode — follows prefers-color-scheme, shares the same --dp-* vars as manual toggle
    const sysDarkMq = window.matchMedia("(prefers-color-scheme: dark)");
    const applySysDark = (e) => chatPanel.classList.toggle("dp-sys-dark", e.matches);
    sysDarkMq.addEventListener("change", applySysDark);
    applySysDark(sysDarkMq);
    chrome.storage.sync.get("darkMode", (result) => {
      applyDarkMode(!!result.darkMode);
    });
    darkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isDark = chatPanel.classList.contains("__dp-dark");
      applyDarkMode(!isDark);
      chrome.storage.sync.set({ darkMode: !isDark });
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

    // 选中文本浮动提问按钮
    createSelBtn();
    // 触发：鼠标松开时若选中有效文本则显示按钮（面板/按钮自身不触发）
    document.addEventListener("mouseup", (e) => {
      const t = e.target;
      if (
        t &&
        t.closest &&
        (t.closest("#__dp-panel") || t.closest("#__dp-sel-btn") || t.closest("#__dp-btn"))
      ) {
        hideSelBtn();
        return;
      }
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";
      if (sel && !sel.isCollapsed && text.length > 0) {
        showSelBtn(e.clientX, e.clientY);
      } else {
        hideSelBtn();
      }
    });
    // SPA 导航时清理选中按钮（避免旧页面残留）
    watchSpaNavigation();
  } catch (e) {
    console.warn("[DeepPage] 初始化失败:", e);
  }
}

// ===== 按钮图标 = 当前配置的提供商 logo =====
function providerIconHtml(providerId) {
  const icon = (PROVIDER_ICONS && PROVIDER_ICONS[providerId]) || PROVIDER_ICON_FALLBACK;
  const paths = icon.paths.map((d) => `<path fill="currentColor" d="${d}"/>`).join("");
  return `<svg viewBox="${icon.viewBox}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:26px;height:26px;vertical-align:middle">${paths}</svg>`;
}

function updateProviderIcon(btn) {
  if (!btn) return;
  chrome.storage.sync.get(["apiProvider", "apiModel"], (result) => {
    const provider = result.apiProvider || "deepseek";
    const model = result.apiModel || "deepseek-v4-flash";
    const label = (PROVIDER_LABELS && PROVIDER_LABELS[provider]) || provider;
    btn.innerHTML = providerIconHtml(provider);
    btn.title = `DeepPage — ${label} · ${model}`;
  });
}
