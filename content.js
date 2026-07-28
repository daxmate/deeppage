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
      top: 50%;
      transform: translateY(-50%);
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
      position: relative;
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
    #__dp-dark-toggle,
    #__dp-history-btn,
    #__dp-clear-ctx-btn,
    #__dp-export-btn {
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      padding: 0 6px;
      line-height: 0;
      display: flex;
      align-items: center;
    }
    #__dp-dark-toggle:hover,
    #__dp-history-btn:hover { color: white; }
    #__dp-export-btn:hover { color: white; }
    #__dp-clear-ctx-btn:hover { color: #f87171; }
    #__dp-dark-toggle svg,
    #__dp-history-btn svg,
    #__dp-clear-ctx-btn svg,
    #__dp-export-btn svg { display: block; }


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
      gap: 6px;
      flex-shrink: 0;
      align-items: flex-end;
    }
    #__dp-new-btn {
      background: none;
      border: 1px solid #d0d9f0;
      border-radius: 20px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      color: #6b7280;
      font-size: 18px;
      font-weight: 300;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.12s;
    }
    #__dp-new-btn:hover {
      background: #f3f4f6;
      color: #4A6CF7;
      border-color: #4A6CF7;
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

    /* 聊天历史列表 */
    #__dp-history-list {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
    #__dp-history-list.__dp-hide { display: none; }
    #__dp-chat.__dp-hide { display: none; }
    .__dp-history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .__dp-history-back {
      background: none;
      border: none;
      cursor: pointer;
      color: #4A6CF7;
      font-size: 13px;
      padding: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .__dp-history-back:hover { color: #3451b2; }
    .__dp-history-back span { text-decoration: underline; }
    .__dp-history-new {
      background: #4A6CF7;
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .__dp-history-new:hover { background: #3451b2; }
    .__dp-history-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .__dp-history-empty {
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
      padding: 24px 0;
    }
    .__dp-history-item {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 4px;
      transition: background 0.12s;
    }
    .__dp-history-item:hover { background: #f3f4f6; }
    .__dp-history-item.active { background: #eff6ff; }
    .__dp-history-item-main {
      flex: 1;
      min-width: 0;
    }
    .__dp-history-title {
      font-size: 13px;
      font-weight: 500;
      color: #1f2937;
      line-height: 1.4;
      word-break: break-all;
    }
    .__dp-history-meta {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }
    .__dp-history-del {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      color: #9ca3af;
      border-radius: 6px;
      line-height: 0;
      flex-shrink: 0;
      transition: all 0.12s;
      opacity: 0;
    }
    .__dp-history-item:hover .__dp-history-del {
      opacity: 1;
    }
    .__dp-history-del:hover {
      background: rgba(239,68,68,0.1);
      color: #ef4444;
    }
    /* 复制按钮 */
    .__dp-msg.__dp-assistant {
      position: relative;
    }
    .__dp-copy-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0,0,0,0.06);
      border: none;
      border-radius: 6px;
      padding: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      color: #6b7280;
      line-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .__dp-msg.__dp-assistant:hover .__dp-copy-btn {
      opacity: 1;
    }
    .__dp-copy-btn:hover {
      background: rgba(0,0,0,0.12);
      color: #1f2937;
    }
    .__dp-copy-btn.__dp-copied {
      opacity: 1;
      color: #059669;
    }
    .__dp-copy-btn.__dp-copied svg {
      display: none;
    }
    .__dp-copy-btn.__dp-copied::after {
      content: '✓';
      font-size: 12px;
      font-weight: 600;
    }
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
        color: #e4e5e7;
        border-bottom-color: #253a5a;
      }
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
      #__dp-new-btn {
        border-color: #373a40;
        color: #9ca3af;
      }
      #__dp-new-btn:hover {
        background: #25262b;
        color: #6B8AFF;
        border-color: #4A6CF7;
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
      .__dp-copy-btn {
        background: rgba(255,255,255,0.1);
        color: #9ca3af;
      }
      .__dp-copy-btn:hover {
        background: rgba(255,255,255,0.18);
        color: #e4e5e7;
      }
      .__dp-copy-btn.__dp-copied {
        color: #34d399;
      }
      .__dp-history-item:hover { background: #2a2b30; }
      .__dp-history-item.active { background: #1a2740; }
      .__dp-history-title { color: #e4e5e7; }
      .__dp-history-del { color: #6b7280; }
      .__dp-history-del:hover {
        background: rgba(239,68,68,0.15);
        color: #f87171;
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
      color: #e4e5e7;
      border-bottom-color: #253a5a;
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
    #__dp-panel.__dp-dark .__dp-copy-btn {
      background: rgba(255,255,255,0.1);
      color: #9ca3af;
    }
    #__dp-panel.__dp-dark .__dp-copy-btn:hover {
      background: rgba(255,255,255,0.18);
      color: #e4e5e7;
    }
    #__dp-panel.__dp-dark .__dp-copy-btn.__dp-copied {
      color: #34d399;
    }
    #__dp-panel.__dp-dark .__dp-history-header { border-bottom-color: #373a40; }
    #__dp-panel.__dp-dark .__dp-history-back { color: #6B8AFF; }
    #__dp-panel.__dp-dark .__dp-history-back:hover { color: #8aa4ff; }
    #__dp-panel.__dp-dark .__dp-history-item:hover { background: #2a2b30; }
    #__dp-panel.__dp-dark .__dp-history-item.active { background: #1a2740; }
    #__dp-panel.__dp-dark .__dp-history-title { color: #e4e5e7; }
    #__dp-panel.__dp-dark .__dp-history-del { color: #6b7280; }
    #__dp-panel.__dp-dark .__dp-history-del:hover {
      background: rgba(239,68,68,0.15);
      color: #f87171;
    }
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
    #__dp-panel.__dp-dark #__dp-new-btn {
      border-color: #373a40;
      color: #9ca3af;
    }
    #__dp-panel.__dp-dark #__dp-new-btn:hover {
      background: #25262b;
      color: #6B8AFF;
      border-color: #4A6CF7;
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
/* 导出下拉菜单 */
    #__dp-export-menu {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      z-index: 10002;
      min-width: 160px;
      overflow: hidden;
    }
    #__dp-export-menu.__dp-show { display: block; }
    #__dp-export-menu div {
      padding: 10px 14px;
      cursor: pointer;
      font-size: 13px;
      color: #374151;
      white-space: nowrap;
    }
    #__dp-export-menu div:hover { background: #f3f4f6; }
    #__dp-export-menu div:not(:last-child) { border-bottom: 1px solid #f3f4f6; }
    /* 暗色模式 */
    #__dp-panel.__dp-dark #__dp-export-menu {
      background: #25262b;
      border-color: #373a40;
    }
    #__dp-panel.__dp-dark #__dp-export-menu div { color: #e4e5e7; }
    #__dp-panel.__dp-dark #__dp-export-menu div:hover { background: #323338; }
    #__dp-panel.__dp-dark #__dp-export-menu div:not(:last-child) { border-bottom-color: #373a40; }
    @media (prefers-color-scheme: dark) {
      #__dp-export-menu { background: #25262b; border-color: #373a40; }
      #__dp-export-menu div { color: #e4e5e7; }
      #__dp-export-menu div:hover { background: #323338; }
      #__dp-export-menu div:not(:last-child) { border-bottom-color: #373a40; }
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

    /* 选中文本浮动提问按钮 */
    #__dp-sel-btn {
      position: fixed;
      z-index: 10001;
      background: #4A6CF7;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      pointer-events: auto;
      white-space: nowrap;
      display: none;
      transition: opacity 0.12s;
    }
    #__dp-sel-btn:hover { background: #3451b2; }
    #__dp-sel-btn.__dp-show { display: block; }
  `;
  document.head.appendChild(style);
}

// ==============================================
// 原有功能：内容提取、聊天逻辑等（保持不变）
// ==============================================
// 聊天历史管理
// ==============================================

let currentMessages = [];
let currentConvId = null;
let _sending = false;

function generateId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('justNow') || 'just now';
  if (min < 60) return min + 'm';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + 'h';
  const day = Math.floor(hr / 24);
  return day + 'd';
}

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

// ==============================================
// 对话轮数裁剪
// ==============================================

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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
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
      <button id="__dp-dark-toggle" class="__dp-dark-toggle" title="Toggle dark mode"></button>
      <button id="__dp-history-btn" title="${t('historyButton') || 'History'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></button>
      <button id="__dp-export-btn" title="${t('exportButton') || 'Export'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
      <div id="__dp-export-menu" >
        <div data-action="markdown">${t('exportMarkdown') || 'Copy Markdown'}</div>
        <div data-action="text">${t('exportText') || 'Copy Plain Text'}</div>
        <div data-action="download">${t('exportDownload') || 'Download .md'}</div>
      </div>
      <button id="__dp-clear-ctx-btn" title="${t('clearContextBtn') || 'Clear Context'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
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
      <button id="__dp-new-btn" title="${t('newChatShort') || 'New'}">+</button>
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
    if (e.target.closest('button') || e.target.closest('select')) return;
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

// 下载时临时阻止面板关闭（a.click() 的点击事件会触发 handleClickOutside）
let _suppressClose = false;

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

// ==============================================
// 对话导出
// ==============================================

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

// 点击导出按钮切换菜单
let _exportMenuOpen = false;
document.addEventListener('click', (e) => {
  const menu = document.getElementById('__dp-export-menu');
  const btn = document.getElementById('__dp-export-btn');
  if (!menu || !btn) return;
  if (btn.contains(e.target)) {
    e.stopPropagation();
    _exportMenuOpen = !_exportMenuOpen;
    menu.classList.toggle('__dp-show', _exportMenuOpen);
  } else if (!menu.contains(e.target)) {
    _exportMenuOpen = false;
    menu.classList.remove('__dp-show');
  }
  // Handle menu item clicks
  if (menu.contains(e.target)) {
    const item = e.target.closest('div[data-action]');
    if (item) {
      _exportMenuOpen = false;
      menu.classList.remove('__dp-show');
      exportConversation(item.dataset.action);
    }
  }
});

// 语言切换时更新 export btn title
// (handled in loadLanguage callback below)

// ==============================================
// 选中文本浮动提问按钮
// ==============================================

let _selBtn = null;

function createSelBtn() {
  if (_selBtn) return;
  _selBtn = document.createElement('button');
  _selBtn.id = '__dp-sel-btn';
  _selBtn.textContent = t('selAskButton') || '💬 对此段提问';
  _selBtn.addEventListener('click', onSelAsk);
  document.body.appendChild(_selBtn);
}

async function onSelAsk() {
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : '';
  if (!text) return;
  hideSelBtn();
  sel.removeAllRanges();

  // 打开面板
  if (!panelOpen) {
    togglePanel();
    // 等待 loadActiveConversation（异步）完成
    await new Promise(r => setTimeout(r, 50));
  }
  // 刷新页面上下文（面板已开也可能换了页面）
  pageContext = extractPageContent();
  updateContext(pageContext.title);

  // 检查当前对话上下文是否匹配当前页面
  const data = await loadConversations();
  let currentConv = data.conversations.find(c => c.id === currentConvId);
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
  const msg = `📝 ${t('selContextLabel') || '选中内容'}：\n\n${text.slice(0, 8000)}`;
  const input = document.getElementById('__dp-input');
  if (input) {
    input.value = msg;
    input.dispatchEvent(new Event('input'));
    sendMessage();
  }
}

function showSelBtn(x, y) {
  if (!_selBtn) createSelBtn();
  // 更新文字（语言可能变了）
  _selBtn.textContent = t('selAskButton') || '💬 对此段提问';
  _selBtn.style.left = Math.min(x, window.innerWidth - _selBtn.offsetWidth - 10) + 'px';
  _selBtn.style.top = Math.max(4, y - _selBtn.offsetHeight - 6) + 'px';
  _selBtn.classList.add('__dp-show');
}

function hideSelBtn() {
  if (_selBtn) _selBtn.classList.remove('__dp-show');
}

function isSelectionValid() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return false;
  const text = sel.toString().trim();
  if (!text) return false;
  // 忽略选中扩展 UI 元素的内容
  const node = sel.anchorNode;
  if (node && node.closest && (node.closest('#__dp-panel') || node.closest('#__dp-btn'))) return false;
  return text.length >= 5 && text.length <= 8000;
}

// 全局监听选中事件
document.addEventListener('mouseup', (e) => {
  // 点击在按钮本身或面板内不处理
  if (e.target.closest && e.target.closest('#__dp-sel-btn, #__dp-panel, #__dp-btn')) return;

  // 延迟一小段时间让 selection 稳定
  setTimeout(() => {
    if (isSelectionValid()) {
      const sel = window.getSelection();
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showSelBtn(rect.left + rect.width / 2, rect.top);
    } else {
      hideSelBtn();
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  // 点击非按钮区域时隐藏
  if (_selBtn && !_selBtn.contains(e.target)) {
    hideSelBtn();
  }
});

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
    // 面板已创建则更新占位符
    const inp = document.getElementById('__dp-input');
    if (inp) inp.placeholder = t('inputPlaceholder');
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
  document.getElementById("__dp-history-btn").addEventListener("click", showHistory);
  document.getElementById("__dp-clear-ctx-btn").addEventListener("click", () => {
    clearContext();
  });
  document.getElementById("__dp-new-btn").addEventListener("click", () => {
    if (currentMessages.length === 0) return;
    newConversation();
  });

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
    e.stopPropagation();
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
      // 更新所有复制按钮的提示文字
      document.querySelectorAll('.__dp-copy-btn').forEach((btn) => {
        btn.title = t('copyButton');
      });
      // 更新输入框占位符
      const input = document.getElementById('__dp-input');
      if (input) input.placeholder = t('inputPlaceholder');
      // 更新历史按钮提示
      const histBtn = document.getElementById('__dp-history-btn');
      if (histBtn) histBtn.title = t('historyButton') || 'History';
      const newBtn = document.getElementById('__dp-new-btn');
      if (newBtn) newBtn.title = t('newChatShort') || 'New';
      // 更新清除上下文按钮
      const clearCtxBtn = document.getElementById('__dp-clear-ctx-btn');
      if (clearCtxBtn) clearCtxBtn.title = t('clearContextBtn') || 'Clear Context';
      // 更新导出按钮
      const exportBtn = document.getElementById('__dp-export-btn');
      if (exportBtn) exportBtn.title = t('exportButton') || 'Export';
      // 更新下拉菜单文字
      const menu = document.getElementById('__dp-export-menu');
      if (menu) {
        const items = menu.querySelectorAll('div[data-action]');
        if (items[0]) items[0].textContent = t('exportMarkdown') || 'Copy Markdown';
        if (items[1]) items[1].textContent = t('exportText') || 'Copy Plain Text';
        if (items[2]) items[2].textContent = t('exportDownload') || 'Download .md';
      }
      // 更新选中文本按钮
      if (_selBtn) _selBtn.textContent = t('selAskButton') || '💬 对此段提问';
      if (panelOpen) {
        loadQuickActionsFromStorage();
      }
    });
  });

  // Dark mode toggle
  const darkBtn = document.getElementById('__dp-dark-toggle');
  const moonSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const sunSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  function applyDarkMode(dark) {
    if (dark) {
      chatPanel.classList.add('__dp-dark');
      darkBtn.innerHTML = sunSVG;
    } else {
      chatPanel.classList.remove('__dp-dark');
      darkBtn.innerHTML = moonSVG;
    }
  }
  chrome.storage.sync.get('darkMode', (result) => {
    applyDarkMode(!!result.darkMode);
  });
  darkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
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

  // 选中文本浮动提问按钮
  createSelBtn();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createButton);
} else {
  createButton();
}
