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
      height: calc(100vh * 2 / 3);
      max-height: calc(100vh - 100px);
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
    #__dp-lang-select {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px;
      padding: 2px 6px;
      font-size: 11px;
      cursor: pointer;
      margin-right: 8px;
      outline: none;
    }
    #__dp-lang-select option { color: #1f2937; }
    #__dp-dark-toggle {
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      font-size: 16px;
      cursor: pointer;
      padding: 0 6px;
      line-height: 1;
    }
    #__dp-dark-toggle:hover { color: white; }


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
    .__dp-bubble pre { background: #1e293b; color: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
    .__dp-bubble pre code { background: none; padding: 0; font-size: inherit; }
    .__dp-bubble strong { font-weight: 600; }
    .__dp-bubble em { font-style: italic; }
    .__dp-bubble a { color: #4a6cf7; text-decoration: underline; }
    .__dp-bubble h1, .__dp-bubble h2, .__dp-bubble h3, .__dp-bubble h4 { margin: 12px 0 6px; font-weight: 600; line-height: 1.3; }
    .__dp-bubble h1 { font-size: 18px; }
    .__dp-bubble h2 { font-size: 16px; }
    .__dp-bubble h3 { font-size: 15px; }
    .__dp-bubble h4 { font-size: 14px; }
    .__dp-bubble ul, .__dp-bubble ol { padding-left: 20px; margin: 6px 0; }
    .__dp-bubble li { margin: 2px 0; }
    .__dp-bubble blockquote {
      border-left: 3px solid #4a6cf7;
      margin: 8px 0;
      padding: 4px 12px;
      color: #555;
      background: #f8f9fc;
      border-radius: 0 6px 6px 0;
    }
    .__dp-bubble table { border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 13px; }
    .__dp-bubble th, .__dp-bubble td { border: 1px solid #d0d9f0; padding: 6px 10px; text-align: left; }
    .__dp-bubble th { background: #eef2ff; font-weight: 600; }
    .__dp-bubble hr { border: none; border-top: 1px solid #d0d9f0; margin: 12px 0; }
    .__dp-bubble del { text-decoration: line-through; }
    .__dp-bubble input[type="checkbox"] { margin: 0 4px 0 0; pointer-events: none; }
    .__dp-bubble p { margin: 4px 0; }

    @media (prefers-color-scheme: dark) {
      #__dp-panel {
        background: #1a1b1e;
        color: #e4e5e7;
        border-color: #373a40;
      }
      #__dp-panel-header {
        border-bottom-color: #373a40;
      }
      #__dp-context-bar {
        background: #1a2740;
      }
      #__dp-quick-actions {
        background: #1a1b1e;
        border-bottom-color: #373a40;
      }
      #__dp-quick-actions button {
        background: #25262b;
        color: #e4e5e7;
        border-color: #373a40;
      }
      #__dp-quick-actions button:hover {
        background: #4a6cf7;
        color: white;
        border-color: #4a6cf7;
      }
      #__dp-chat {
        background: #1a1b1e;
      }
      .__dp-assistant .__dp-bubble {
        background: #25262b;
        color: #e4e5e7;
      }
      .__dp-bubble code {
        background: #333;
      }
      .__dp-bubble pre {
        background: #2a2b2e;
      }
      .__dp-bubble a {
        color: #6B8AFF;
      }
      .__dp-bubble blockquote {
        border-left-color: #6B8AFF;
        color: #a0a4b0;
        background: #222328;
      }
      .__dp-bubble th {
        background: #1a2740;
      }
      .__dp-bubble th,
      .__dp-bubble td {
        border-color: #373a40;
      }
      .__dp-bubble hr {
        border-top-color: #373a40;
      }
      #__dp-input-row {
        background: #1a1b1e;
        border-top-color: #373a40;
      }
      #__dp-input {
        background: #25262b;
        border-color: #373a40;
        color: #e4e5e7;
      }
      #__dp-input:focus {
        border-color: #4a6cf7;
      }
      .__dp-loading span {
        background: #6B8AFF;
      }
    }
    /* 手动 dark mode 切换 */
    #__dp-panel.__dp-dark {
      background: #1a1b1e;
      color: #e4e5e7;
      border-color: #373a40;
    }
    #__dp-panel.__dp-dark #__dp-panel-header {
      border-bottom-color: #373a40;
    }
    #__dp-panel.__dp-dark #__dp-context-bar {
      background: #1a2740;
    }
    #__dp-panel.__dp-dark #__dp-quick-actions {
      background: #1a1b1e;
      border-bottom-color: #373a40;
    }
    #__dp-panel.__dp-dark #__dp-quick-actions button {
      background: #25262b;
      color: #e4e5e7;
      border-color: #373a40;
    }
    #__dp-panel.__dp-dark #__dp-quick-actions button:hover {
      background: #4a6cf7;
      color: white;
      border-color: #4a6cf7;
    }
    #__dp-panel.__dp-dark #__dp-chat {
      background: #1a1b1e;
    }
    #__dp-panel.__dp-dark .__dp-assistant .__dp-bubble {
      background: #25262b;
      color: #e4e5e7;
    }
    #__dp-panel.__dp-dark .__dp-bubble code {
      background: #333;
    }
    #__dp-panel.__dp-dark .__dp-bubble pre {
      background: #2a2b2e;
    }
    #__dp-panel.__dp-dark .__dp-bubble a {
      color: #6B8AFF;
    }
    #__dp-panel.__dp-dark .__dp-bubble blockquote {
      border-left-color: #6B8AFF;
      color: #a0a4b0;
      background: #222328;
    }
    #__dp-panel.__dp-dark .__dp-bubble th {
      background: #1a2740;
    }
    #__dp-panel.__dp-dark .__dp-bubble th,
    #__dp-panel.__dp-dark .__dp-bubble td {
      border-color: #373a40;
    }
    #__dp-panel.__dp-dark .__dp-bubble hr {
      border-top-color: #373a40;
    }
    #__dp-panel.__dp-dark #__dp-input-row {
      background: #1a1b1e;
      border-top-color: #373a40;
    }
    #__dp-panel.__dp-dark #__dp-input {
      background: #25262b;
      border-color: #373a40;
      color: #e4e5e7;
    }
    #__dp-panel.__dp-dark #__dp-input:focus {
      border-color: #4a6cf7;
    }
    #__dp-panel.__dp-dark .__dp-loading span {
      background: #6B8AFF;
    }

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

let quickActions = [];

// 默认按钮（语言加载后初始化）
let DEFAULT_QUICK_ACTIONS = [];

function initDefaultActions() {
  DEFAULT_QUICK_ACTIONS = [
    { id: 'summarize', label: t('defaultSummarizeLabel'), prompt: t('defaultSummarizePrompt') },
    { id: 'outline', label: t('defaultOutlineLabel'), prompt: t('defaultOutlinePrompt') },
    { id: 'translate', label: t('defaultTranslateLabel'), prompt: t('defaultTranslatePrompt') },
  ];
}

function renderQuickActions() {
  const container = document.getElementById('__dp-quick-actions');
  if (!container) return;
  container.innerHTML = '';
  for (const action of quickActions) {
    const btn = document.createElement('button');
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      document.getElementById('__dp-input').value = action.prompt;
      sendMessage();
    });
    container.appendChild(btn);
  }
}

function loadQuickActionsFromStorage() {
  chrome.storage.sync.get(['quickActions', 'quickActionsLang'], (result) => {
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
      <span><svg width="18" height="18" viewBox="0 0 512 509.64" fill="none" style="vertical-align:middle"><path fill="currentColor" fill-rule="nonzero" d="M440.898 139.167c-4.001-1.961-5.723 1.776-8.062 3.673-.801.612-1.479 1.407-2.154 2.141-5.848 6.246-12.681 10.349-21.607 9.859-13.048-.734-24.192 3.368-34.04 13.348-2.093-12.307-9.048-19.658-19.635-24.37-5.54-2.449-11.141-4.9-15.02-10.227-2.708-3.795-3.447-8.021-4.801-12.185-.861-2.509-1.725-5.082-4.618-5.512-3.139-.49-4.372 2.142-5.601 4.349-4.925 9.002-6.833 18.921-6.647 28.962.432 22.597 9.972 40.597 28.932 53.397 2.154 1.47 2.707 2.939 2.032 5.082-1.293 4.41-2.832 8.695-4.186 13.105-.862 2.817-2.157 3.429-5.172 2.205-10.402-4.346-19.391-10.778-27.332-18.553-13.481-13.044-25.668-27.434-40.873-38.702a177.614 177.614 0 00-10.834-7.409c-15.512-15.063 2.032-27.434 6.094-28.902 4.247-1.532 1.478-6.797-12.251-6.736-13.727.061-26.285 4.653-42.288 10.777-2.34.92-4.801 1.593-7.326 2.142-14.527-2.756-29.608-3.368-45.367-1.593-29.671 3.305-53.368 17.329-70.788 41.272-20.928 28.785-25.854 61.482-19.821 95.59 6.34 35.943 24.683 65.704 52.876 88.974 29.239 24.123 62.911 35.943 101.32 33.677 23.329-1.346 49.307-4.468 78.607-29.27 7.387 3.673 15.142 5.144 28.008 6.246 9.911.92 19.452-.49 26.839-2.019 11.573-2.449 10.773-13.166 6.586-15.124-33.915-15.797-26.47-9.368-33.24-14.573 17.235-20.39 43.213-41.577 53.369-110.222.8-5.448.121-8.877 0-13.287-.061-2.692.553-3.734 3.632-4.041 8.494-.981 16.742-3.305 24.314-7.471 21.975-12.002 30.84-31.719 32.933-55.355.307-3.612-.061-7.348-3.879-9.245v-.003zM249.4 351.89c-32.872-25.838-48.814-34.352-55.4-33.984-6.155.368-5.048 7.41-3.694 12.002 1.415 4.532 3.264 7.654 5.848 11.634 1.785 2.634 3.017 6.551-1.784 9.493-10.587 6.55-28.993-2.205-29.856-2.635-21.421-12.614-39.334-29.269-51.954-52.047-12.187-21.924-19.267-45.435-20.435-70.542-.308-6.061 1.478-8.207 7.509-9.307 7.94-1.471 16.127-1.778 24.068-.615 33.547 4.9 62.108 19.902 86.054 43.66 13.666 13.531 24.007 29.699 34.658 45.496 11.326 16.778 23.514 32.761 39.026 45.865 5.479 4.592 9.848 8.083 14.035 10.656-12.62 1.407-33.673 1.714-48.075-9.676zm15.899-102.519c.521-2.111 2.421-3.658 4.722-3.658a4.74 4.74 0 011.661.305c.678.246 1.293.614 1.786 1.163.861.859 1.354 2.083 1.354 3.368 0 2.695-2.154 4.837-4.862 4.837a4.748 4.748 0 01-4.738-4.034 5.01 5.01 0 01.077-1.981zm47.208 26.915c-2.606.996-5.2 1.778-7.707 1.88-4.679.244-9.787-1.654-12.556-3.981-4.308-3.612-7.386-5.631-8.679-11.941-.554-2.695-.247-6.858.246-9.246 1.108-5.144-.124-8.451-3.754-11.451-2.954-2.449-6.711-3.122-10.834-3.122-1.539 0-2.954-.673-4.001-1.224-1.724-.856-3.139-3-1.785-5.634.432-.856 2.525-2.939 3.018-3.305 5.6-3.185 12.065-2.144 18.034.244 5.54 2.266 9.727 6.429 15.759 12.307 6.155 7.102 7.263 9.063 10.773 14.39 2.771 4.163 5.294 8.451 7.018 13.348.877 2.561.071 4.74-2.341 6.277-.981.625-2.109 1.044-3.191 1.458z"/></svg> DeepPage</span>
      <select id="__dp-lang-select" class="__dp-lang-select"></select>
      <button id="__dp-dark-toggle" class="__dp-dark-toggle" title="Toggle dark mode">🌙</button>
      <button id="__dp-close">✕</button>
    </div>
    <div id="__dp-context-bar" class="__dp-hidden">
      📄 <span id="__dp-context-title"></span>
    </div>
    <div id="__dp-quick-actions" class="__dp-hidden"></div>
    <div id="__dp-login-notice" class="__dp-hidden">
      <div>${t('loginNoticeTitle')}</div>
      <div class="__dp-small">
        ${t('loginNoticeStep1')}<br>
        ${t('loginNoticeStep2')}
      </div>
    </div>
    <div id="__dp-chat"></div>
    <div id="__dp-input-row">
      <textarea id="__dp-input" placeholder="${t('inputPlaceholder')}" rows="1"></textarea>
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
    if (e.target.tagName === "BUTTON" || e.target.tagName === "SELECT") return;
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

        let newW = startW, newH = startH;
        let newLeft = startLeft, newTop = startTop;

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

// ==============================================
// 聊天相关函数（保持原样，未改动）
// ==============================================
let chatHistory = [];

function markdownToHtml(text) {
  try {
    return marked.parse(text, { breaks: true, gfm: true });
  } catch (e) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }
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

function handleClickOutside(e) {
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
    pageContext = extractPageContent();
    updateContext(pageContext.title);
    if (!chatHistory.length) {
      document.getElementById("__dp-chat").innerHTML = "";
      addMsg("assistant", `📄 ${t('contextLoaded', pageContext.title)}`, { dataset: { msgType: 'context-loaded' } });
    }
    document.getElementById("__dp-input").focus();

    loadQuickActionsFromStorage();
    chrome.runtime.sendMessage({ action: "checkLogin" }, (resp) => {
      showLoginNotice(!resp?.loggedIn);
      if (resp?.loggedIn) {
        document
          .getElementById("__dp-quick-actions")
          .classList.remove("__dp-hidden");
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
        `❌ ${resp.error === "NO_API_KEY" ? t('errorNoApiKey') : resp.error}`,
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

  // 先用检测的语言初始化，再异步加载存储的偏好
  window.__dp_lang = detectLanguage();
  initDefaultActions();
  loadLanguage(() => {
    initDefaultActions();
  });
  injectStyles();

  const btn = document.createElement("button");
  btn.id = "__dp-btn";
  btn.innerHTML = '<svg width="28" height="28" viewBox=\"0 0 512 509.64\" fill=\"none\" style=\"vertical-align:middle\"><path fill=\"currentColor\" fill-rule=\"nonzero\" d=\"M440.898 139.167c-4.001-1.961-5.723 1.776-8.062 3.673-.801.612-1.479 1.407-2.154 2.141-5.848 6.246-12.681 10.349-21.607 9.859-13.048-.734-24.192 3.368-34.04 13.348-2.093-12.307-9.048-19.658-19.635-24.37-5.54-2.449-11.141-4.9-15.02-10.227-2.708-3.795-3.447-8.021-4.801-12.185-.861-2.509-1.725-5.082-4.618-5.512-3.139-.49-4.372 2.142-5.601 4.349-4.925 9.002-6.833 18.921-6.647 28.962.432 22.597 9.972 40.597 28.932 53.397 2.154 1.47 2.707 2.939 2.032 5.082-1.293 4.41-2.832 8.695-4.186 13.105-.862 2.817-2.157 3.429-5.172 2.205-10.402-4.346-19.391-10.778-27.332-18.553-13.481-13.044-25.668-27.434-40.873-38.702a177.614 177.614 0 00-10.834-7.409c-15.512-15.063 2.032-27.434 6.094-28.902 4.247-1.532 1.478-6.797-12.251-6.736-13.727.061-26.285 4.653-42.288 10.777-2.34.92-4.801 1.593-7.326 2.142-14.527-2.756-29.608-3.368-45.367-1.593-29.671 3.305-53.368 17.329-70.788 41.272-20.928 28.785-25.854 61.482-19.821 95.59 6.34 35.943 24.683 65.704 52.876 88.974 29.239 24.123 62.911 35.943 101.32 33.677 23.329-1.346 49.307-4.468 78.607-29.27 7.387 3.673 15.142 5.144 28.008 6.246 9.911.92 19.452-.49 26.839-2.019 11.573-2.449 10.773-13.166 6.586-15.124-33.915-15.797-26.47-9.368-33.24-14.573 17.235-20.39 43.213-41.577 53.369-110.222.8-5.448.121-8.877 0-13.287-.061-2.692.553-3.734 3.632-4.041 8.494-.981 16.742-3.305 24.314-7.471 21.975-12.002 30.84-31.719 32.933-55.355.307-3.612-.061-7.348-3.879-9.245v-.003zM249.4 351.89c-32.872-25.838-48.814-34.352-55.4-33.984-6.155.368-5.048 7.41-3.694 12.002 1.415 4.532 3.264 7.654 5.848 11.634 1.785 2.634 3.017 6.551-1.784 9.493-10.587 6.55-28.993-2.205-29.856-2.635-21.421-12.614-39.334-29.269-51.954-52.047-12.187-21.924-19.267-45.435-20.435-70.542-.308-6.061 1.478-8.207 7.509-9.307 7.94-1.471 16.127-1.778 24.068-.615 33.547 4.9 62.108 19.902 86.054 43.66 13.666 13.531 24.007 29.699 34.658 45.496 11.326 16.778 23.514 32.761 39.026 45.865 5.479 4.592 9.848 8.083 14.035 10.656-12.62 1.407-33.673 1.714-48.075-9.676zm15.899-102.519c.521-2.111 2.421-3.658 4.722-3.658a4.74 4.74 0 011.661.305c.678.246 1.293.614 1.786 1.163.861.859 1.354 2.083 1.354 3.368 0 2.695-2.154 4.837-4.862 4.837a4.748 4.748 0 01-4.738-4.034 5.01 5.01 0 01.077-1.981zm47.208 26.915c-2.606.996-5.2 1.778-7.707 1.88-4.679.244-9.787-1.654-12.556-3.981-4.308-3.612-7.386-5.631-8.679-11.941-.554-2.695-.247-6.858.246-9.246 1.108-5.144-.124-8.451-3.754-11.451-2.954-2.449-6.711-3.122-10.834-3.122-1.539 0-2.954-.673-4.001-1.224-1.724-.856-3.139-3-1.785-5.634.432-.856 2.525-2.939 3.018-3.305 5.6-3.185 12.065-2.144 18.034.244 5.54 2.266 9.727 6.429 15.759 12.307 6.155 7.102 7.263 9.063 10.773 14.39 2.771 4.163 5.294 8.451 7.018 13.348.877 2.561.071 4.74-2.341 6.277-.981.625-2.109 1.044-3.191 1.458z\"/></svg>';
  btn.addEventListener("click", togglePanel);
  document.body.appendChild(btn);

  chatPanel = createChatPanel();

  // 启用拖拽移动 + 四角缩放
  enableDrag(document.getElementById("__dp-panel-header"), chatPanel);
  enableResize(chatPanel);

  // 绑定事件
  document.getElementById("__dp-close").addEventListener("click", togglePanel);
  document.getElementById("__dp-send").addEventListener("click", sendMessage);

  // 语言选择器
  const langSelect = document.getElementById('__dp-lang-select');
  LANGUAGES.forEach((lang) => {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.label;
    langSelect.appendChild(opt);
  });
  // 语言加载完后选中正确的选项
  function updateLangSelection() {
    langSelect.value = getCurrentLang();
  }
  updateLangSelection();
  loadLanguage(() => {
    initDefaultActions();
    updateLangSelection();
  });
  langSelect.addEventListener('change', (e) => {
    window.__dp_lang = e.target.value;
    setStoredLanguage(e.target.value, () => {
      // 重新初始化默认按钮并刷新
      initDefaultActions();
      // 更新已发送的「已加载」消息
      const ctxMsg = document.querySelector('[data-msg-type="context-loaded"]');
      if (ctxMsg) {
        const bubble = ctxMsg.querySelector('.__dp-bubble');
        if (bubble && pageContext) bubble.textContent = `📄 ${t('contextLoaded', pageContext.title)}`;
      }
      if (panelOpen) {
        loadQuickActionsFromStorage();
      }
    });
  });

  // Dark mode toggle
  const darkBtn = document.getElementById('__dp-dark-toggle');
  function applyDarkMode(dark) {
    if (dark) {
      chatPanel.classList.add('__dp-dark');
      darkBtn.textContent = '☀️';
    } else {
      chatPanel.classList.remove('__dp-dark');
      darkBtn.textContent = '🌙';
    }
  }
  chrome.storage.sync.get('darkMode', (result) => {
    applyDarkMode(!!result.darkMode);
  });
  darkBtn.addEventListener('click', () => {
    const isDark = chatPanel.classList.contains('__dp-dark');
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createButton);
} else {
  createButton();
}
