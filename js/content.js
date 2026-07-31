// ==============================================
// DeepPage — Entry Point
// Injects styles and boots up chat panel
// ==============================================

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* ===== Light theme defaults (CSS custom properties) ===== */
    #__dp-panel {
      /* ----- Layout (no var needed) ----- */
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
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 2147483647;
      transition: box-shadow 0.2s;

      /* ----- Theme colors (light default) ----- */
      --dp-bg: #ffffff;
      --dp-text: inherit;
      --dp-panel-border: rgba(255,255,255,0.1);
      --dp-chat-bg: #f7f9fc;
      --dp-context-bar-bg: #eef2ff;
      --dp-context-bar-text: #1e293b;
      --dp-context-bar-border: #d0d9f0;
      --dp-quick-actions-bg: #f7f9fc;
      --dp-quick-actions-border: #e9ecf5;
      --dp-quick-btn-bg: white;
      --dp-quick-btn-text: #1e293b;
      --dp-quick-btn-border: #d0d9f0;
      --dp-input-row-bg: white;
      --dp-input-row-border: #e9ecf5;
      --dp-new-btn-border: #d0d9f0;
      --dp-new-btn-text: #6b7280;
      --dp-input-bg: white;
      --dp-input-border: #d0d9f0;
      --dp-input-text: inherit;
      --dp-input-disabled-bg: #f1f3f5;
      --dp-assistant-bubble-bg: #f1f3f5;
      --dp-assistant-bubble-text: inherit;
      --dp-code-bg: #e9ecf5;
      --dp-pre-bg: #1e293b;
      --dp-pre-text: #f8fafc;
      --dp-link-color: #4a6cf7;
      --dp-blockquote-border: #4a6cf7;
      --dp-blockquote-text: #555;
      --dp-blockquote-bg: #f8f9fc;
      --dp-table-border: #d0d9f0;
      --dp-table-th-bg: #eef2ff;
      --dp-table-hr-border: #d0d9f0;
      --dp-history-header-border: #e5e7eb;
      --dp-history-header-bg: transparent;
      --dp-history-back-color: #4A6CF7;
      --dp-history-back-hover: #3451b2;
      --dp-history-item-hover: #f3f4f6;
      --dp-history-item-active: #eff6ff;
      --dp-history-title-color: #1f2937;
      --dp-history-meta-color: #9ca3af;
      --dp-history-del-color: #9ca3af;
      --dp-history-del-hover-bg: rgba(239,68,68,0.1);
      --dp-history-del-hover-text: #ef4444;
      --dp-copy-btn-bg: rgba(0,0,0,0.06);
      --dp-copy-btn-text: #6b7280;
      --dp-copy-btn-hover-bg: rgba(0,0,0,0.12);
      --dp-copy-btn-hover-text: #1f2937;
      --dp-copy-btn-copied-text: #059669;
      --dp-loading-dot-bg: #4a6cf7;
      --dp-export-menu-bg: white;
      --dp-export-menu-border: #e5e7eb;
      --dp-export-menu-text: #374151;
      --dp-export-menu-hover: #f3f4f6;
      --dp-export-menu-item-border: #f3f4f6;
      --dp-sel-btn-bg: #4A6CF7;

      /* Apply color vars */
      background: var(--dp-bg);
      color: var(--dp-text);
      border: 1px solid var(--dp-panel-border);
    }
    #__dp-panel.__dp-open { display: flex; }

    /* ===== Dark theme — applied automatically (system) and manually (class) ===== */
    @media (prefers-color-scheme: dark) { #__dp-panel {
      --dp-bg: #1a1b1e;
      --dp-text: #e4e5e7;
      --dp-panel-border: #373a40;
      --dp-chat-bg: #1a1b1e;
      --dp-context-bar-bg: #1a2740;
      --dp-context-bar-text: #e4e5e7;
      --dp-context-bar-border: #253a5a;
      --dp-quick-actions-bg: #1a1b1e;
      --dp-quick-actions-border: #373a40;
      --dp-quick-btn-bg: #25262b;
      --dp-quick-btn-text: #e4e5e7;
      --dp-quick-btn-border: #373a40;
      --dp-input-row-bg: #1a1b1e;
      --dp-input-row-border: #373a40;
      --dp-new-btn-border: #373a40;
      --dp-new-btn-text: #9ca3af;
      --dp-input-bg: #25262b;
      --dp-input-border: #373a40;
      --dp-input-text: #e4e5e7;
      --dp-input-disabled-bg: #25262b;
      --dp-assistant-bubble-bg: #25262b;
      --dp-assistant-bubble-text: #e4e5e7;
      --dp-code-bg: #333;
      --dp-pre-bg: #2a2b2e;
      --dp-pre-text: #e4e5e7;
      --dp-link-color: #6B8AFF;
      --dp-blockquote-border: #6B8AFF;
      --dp-blockquote-text: #a0a4b0;
      --dp-blockquote-bg: #222328;
      --dp-table-border: #373a40;
      --dp-table-th-bg: #1a2740;
      --dp-table-hr-border: #373a40;
      --dp-history-header-border: #373a40;
      --dp-history-back-color: #6B8AFF;
      --dp-history-back-hover: #8aa4ff;
      --dp-history-item-hover: #2a2b30;
      --dp-history-item-active: #1a2740;
      --dp-history-title-color: #e4e5e7;
      --dp-history-meta-color: #6b7280;
      --dp-hover-bg: #2a2c32;
      --dp-think-box-bg: #222438;
      --dp-history-del-color: #6b7280;
      --dp-history-del-hover-bg: rgba(239,68,68,0.15);
      --dp-history-del-hover-text: #f87171;
      --dp-copy-btn-bg: rgba(255,255,255,0.1);
      --dp-copy-btn-text: #9ca3af;
      --dp-copy-btn-hover-bg: rgba(255,255,255,0.18);
      --dp-copy-btn-hover-text: #e4e5e7;
      --dp-copy-btn-copied-text: #34d399;
      --dp-loading-dot-bg: #6B8AFF;
      --dp-export-menu-bg: #25262b;
      --dp-export-menu-border: #373a40;
      --dp-export-menu-text: #e4e5e7;
      --dp-export-menu-hover: #323338;
      --dp-export-menu-item-border: #373a40;
      --dp-sel-btn-bg: #4A6CF7;
    } }
    #__dp-panel.__dp-dark {
      --dp-bg: #1a1b1e;
      --dp-text: #e4e5e7;
      --dp-panel-border: #373a40;
      --dp-chat-bg: #1a1b1e;
      --dp-context-bar-bg: #1a2740;
      --dp-context-bar-text: #e4e5e7;
      --dp-context-bar-border: #253a5a;
      --dp-quick-actions-bg: #1a1b1e;
      --dp-quick-actions-border: #373a40;
      --dp-quick-btn-bg: #25262b;
      --dp-quick-btn-text: #e4e5e7;
      --dp-quick-btn-border: #373a40;
      --dp-input-row-bg: #1a1b1e;
      --dp-input-row-border: #373a40;
      --dp-new-btn-border: #373a40;
      --dp-new-btn-text: #9ca3af;
      --dp-input-bg: #25262b;
      --dp-input-border: #373a40;
      --dp-input-text: #e4e5e7;
      --dp-input-disabled-bg: #25262b;
      --dp-assistant-bubble-bg: #25262b;
      --dp-assistant-bubble-text: #e4e5e7;
      --dp-code-bg: #333;
      --dp-pre-bg: #2a2b2e;
      --dp-pre-text: #e4e5e7;
      --dp-link-color: #6B8AFF;
      --dp-blockquote-border: #6B8AFF;
      --dp-blockquote-text: #a0a4b0;
      --dp-blockquote-bg: #222328;
      --dp-table-border: #373a40;
      --dp-table-th-bg: #1a2740;
      --dp-table-hr-border: #373a40;
      --dp-history-header-border: #373a40;
      --dp-history-back-color: #6B8AFF;
      --dp-history-back-hover: #8aa4ff;
      --dp-history-item-hover: #2a2b30;
      --dp-history-item-active: #1a2740;
      --dp-history-title-color: #e4e5e7;
      --dp-history-meta-color: #6b7280;
      --dp-hover-bg: #2a2c32;
      --dp-think-box-bg: #222438;
      --dp-history-del-color: #6b7280;
      --dp-history-del-hover-bg: rgba(239,68,68,0.15);
      --dp-history-del-hover-text: #f87171;
      --dp-copy-btn-bg: rgba(255,255,255,0.1);
      --dp-copy-btn-text: #9ca3af;
      --dp-copy-btn-hover-bg: rgba(255,255,255,0.18);
      --dp-copy-btn-hover-text: #e4e5e7;
      --dp-copy-btn-copied-text: #34d399;
      --dp-loading-dot-bg: #6B8AFF;
      --dp-export-menu-bg: #25262b;
      --dp-export-menu-border: #373a40;
      --dp-export-menu-text: #e4e5e7;
      --dp-export-menu-hover: #323338;
      --dp-export-menu-item-border: #373a40;
      --dp-sel-btn-bg: #4A6CF7;
    }

    /* 标题栏（header 始终蓝色，不参与主题色） */
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
    #__dp-dark-toggle, #__dp-history-btn, #__dp-clear-ctx-btn, #__dp-export-btn {
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      padding: 0 6px;
      line-height: 0;
      display: flex;
      align-items: center;
    }
    #__dp-dark-toggle:hover, #__dp-history-btn:hover { color: white; }
    #__dp-export-btn:hover { color: white; }
    #__dp-clear-ctx-btn:hover { color: #f87171; }
    #__dp-dark-toggle svg, #__dp-history-btn svg,
    #__dp-clear-ctx-btn svg, #__dp-export-btn svg { display: block; }

    /* 内容区域 */
    #__dp-chat {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: var(--dp-chat-bg);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #__dp-context-bar {
      padding: 6px 16px;
      background: var(--dp-context-bar-bg);
      color: var(--dp-context-bar-text);
      font-size: 13px;
      border-bottom: 1px solid var(--dp-context-bar-border);
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
      background: var(--dp-quick-actions-bg);
      border-bottom: 1px solid var(--dp-quick-actions-border);
      flex-shrink: 0;
    }
    #__dp-quick-actions.__dp-hidden { display: none; }
    #__dp-quick-actions button {
      background: var(--dp-quick-btn-bg);
      border: 1px solid var(--dp-quick-btn-border);
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 12px;
      color: var(--dp-quick-btn-text);
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
      background: var(--dp-login-notice-bg);
      color: var(--dp-login-notice-text);
      font-size: 13px;
      text-align: center;
      border-bottom: 1px solid var(--dp-login-notice-border);
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
      background: var(--dp-input-row-bg);
      border-top: 1px solid var(--dp-input-row-border);
      gap: 6px;
      flex-shrink: 0;
      align-items: flex-end;
    }
    #__dp-new-btn {
      background: none;
      border: 1px solid var(--dp-new-btn-border);
      border-radius: 20px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      color: var(--dp-new-btn-text);
      font-size: 18px;
      font-weight: 300;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.12s;
    }
    #__dp-new-btn:hover {
      background: var(--dp-quick-btn-bg);
      color: #6B8AFF;
      border-color: #4A6CF7;
    }
    #__dp-input {
      flex: 1;
      border: 1px solid var(--dp-input-border);
      border-radius: 20px;
      padding: 8px 16px;
      resize: none;
      font-size: 14px;
      line-height: 1.4;
      max-height: 120px;
      outline: none;
      transition: border-color 0.15s;
      font-family: inherit;
      background: var(--dp-input-bg);
      color: var(--dp-input-text);
    }
    #__dp-input:focus { border-color: #4a6cf7; }
    #__dp-input:disabled { background: var(--dp-input-disabled-bg); }
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
      background: var(--dp-assistant-bubble-bg);
      color: var(--dp-assistant-bubble-text);
      border-bottom-left-radius: 4px;
    }
    .__dp-bubble code { background: var(--dp-code-bg); padding: 1px 6px; border-radius: 4px; font-size: 13px; }
    .__dp-bubble pre { background: var(--dp-pre-bg); color: var(--dp-pre-text); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
    .__dp-bubble pre code { background: none; padding: 0; font-size: inherit; }
    .__dp-bubble strong { font-weight: 600; }
    .__dp-bubble em { font-style: italic; }
    .__dp-bubble a { color: var(--dp-link-color); text-decoration: underline; }
    .__dp-bubble h1, .__dp-bubble h2, .__dp-bubble h3, .__dp-bubble h4 { margin: 12px 0 6px; font-weight: 600; line-height: 1.3; }
    .__dp-bubble h1 { font-size: 18px; }
    .__dp-bubble h2 { font-size: 16px; }
    .__dp-bubble h3 { font-size: 15px; }
    .__dp-bubble h4 { font-size: 14px; }
    .__dp-bubble ul, .__dp-bubble ol { padding-left: 20px; margin: 6px 0; }
    .__dp-bubble li { margin: 2px 0; }
    .__dp-bubble blockquote {
      border-left: 3px solid var(--dp-blockquote-border);
      margin: 8px 0;
      padding: 4px 12px;
      color: var(--dp-blockquote-text);
      background: var(--dp-blockquote-bg);
      border-radius: 0 6px 6px 0;
    }
    .__dp-bubble table { border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 13px; }
    .__dp-bubble th, .__dp-bubble td { border: 1px solid var(--dp-table-border); padding: 6px 10px; text-align: left; }
    .__dp-bubble th { background: var(--dp-table-th-bg); font-weight: 600; }
    .__dp-bubble hr { border: none; border-top: 1px solid var(--dp-table-hr-border); margin: 12px 0; }
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
      border-bottom: 1px solid var(--dp-history-header-border);
      background: var(--dp-history-header-bg);
    }
    .__dp-history-back {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--dp-history-back-color);
      font-size: 13px;
      padding: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .__dp-history-back:hover { color: var(--dp-history-back-hover); }
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
    .__dp-history-scroll { flex: 1; overflow-y: auto; padding: 8px; }
    .__dp-history-empty {
      text-align: center;
      color: var(--dp-history-meta-color);
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
    .__dp-history-item:hover { background: var(--dp-history-item-hover); }
    .__dp-history-item.active { background: var(--dp-history-item-active); }
    .__dp-history-item-main { flex: 1; min-width: 0; }
    .__dp-history-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--dp-history-title-color);
      line-height: 1.4;
      word-break: break-all;
    }
    .__dp-history-meta {
      font-size: 11px;
      color: var(--dp-history-meta-color);
      margin-top: 2px;
    }
    .__dp-history-del {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      color: var(--dp-history-del-color);
      border-radius: 6px;
      line-height: 0;
      flex-shrink: 0;
      transition: all 0.12s;
      opacity: 0;
    }
    .__dp-history-item:hover .__dp-history-del { opacity: 1; }
    .__dp-history-del:hover {
      background: var(--dp-history-del-hover-bg);
      color: var(--dp-history-del-hover-text);
    }

    /* 消息操作按钮（复制/删除） */
    .__dp-msg { position: relative; }
    .__dp-copy-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: var(--dp-copy-btn-bg);
      border: none;
      border-radius: 6px;
      padding: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      color: var(--dp-copy-btn-text);
      line-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .__dp-del-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: var(--dp-copy-btn-bg);
      border: none;
      border-radius: 6px;
      padding: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      color: var(--dp-history-del-color);
      line-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .__dp-msg.__dp-assistant .__dp-del-btn { right: 32px; } /* 给复制按钮让位 */
    .__dp-msg:hover .__dp-copy-btn,
    .__dp-msg:hover .__dp-del-btn { opacity: 1; }
    .__dp-del-btn:hover {
      background: var(--dp-history-del-hover-bg);
      color: var(--dp-history-del-hover-text);
    }
    .__dp-copy-btn:hover {
      background: var(--dp-copy-btn-hover-bg);
      color: var(--dp-copy-btn-hover-text);
    }
    .__dp-copy-btn.__dp-copied { opacity: 1; color: var(--dp-copy-btn-copied-text); }
    .__dp-copy-btn.__dp-copied svg { display: none; }
    .__dp-copy-btn.__dp-copied::after { content: "\u2713"; font-size: 12px; font-weight: 600; }

    /* 导出下拉菜单 */
    #__dp-export-menu {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--dp-export-menu-bg);
      border: 1px solid var(--dp-export-menu-border);
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
      color: var(--dp-export-menu-text);
      white-space: nowrap;
    }
    #__dp-export-menu div:hover { background: var(--dp-export-menu-hover); }
    #__dp-export-menu div:not(:last-child) { border-bottom: 1px solid var(--dp-export-menu-item-border); }

    /* 加载动画 */
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
      background: var(--dp-loading-dot-bg);
      border-radius: 50%;
      animation: __dp-bounce 1.2s infinite ease-in-out;
    }
    .__dp-loading span:nth-child(2) { animation-delay: 0.2s; }
    .__dp-loading span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes __dp-bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* 四角拖拽手柄 */
    .__dp-resize-handle {
      position: absolute;
      width: 20px;
      height: 20px;
      z-index: 10;
      background: transparent;
      border: none;
      pointer-events: auto;
    }
    .__dp-resize-handle.tl { top: 0; left: 0; cursor: nw-resize; }
    .__dp-resize-handle.tr { top: 0; right: 0; cursor: ne-resize; }
    .__dp-resize-handle.bl { bottom: 0; left: 0; cursor: sw-resize; }
    .__dp-resize-handle.br { bottom: 0; right: 0; cursor: se-resize; }
    .__dp-resize-handle::after { display: none; }

    /* 浮动按钮 */
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
    #__dp-btn.__dp-dragging { transform: none; cursor: grabbing; transition: none !important; }
    #__dp-btn.__dp-hidden { display: none; }

    /* 选中文本浮动按钮 */
    #__dp-sel-btn {
      position: fixed;
      z-index: 10001;
      background: var(--dp-sel-btn-bg);
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

    /* 思考 toggle（气泡内文字链接） */
    .__dp-think-toggle {
      display: inline;
      cursor: pointer;
      user-select: none;
      font-size: 12px;
      color: var(--dp-text-secondary);
      transition: color 0.12s;
      line-height: 1.6;
    }
    .__dp-think-toggle:hover {
      color: var(--dp-text);
    }
    /* 思考内容框（在气泡内部） */
    .__dp-think-box {
      margin: 6px 0 8px 0;
      padding: 8px 10px;
      border-radius: 6px;
      background: var(--dp-hover-bg);
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--dp-text-secondary);
      line-height: 1.5;
      max-height: 240px;
      overflow-y: auto;
      font-size: 12px;
    }
  `;
  if (document.head) document.head.appendChild(style);
}

// DeepPage 依赖 HTML innerHTML 渲染界面。XML/SVG/XHTML 等文档对 innerHTML
// 做 XML 严格解析，注入的 HTML 模板（含 <br> 等未闭合标签）会抛
// "Failed to set the 'innerHTML' ... invalid XML" SyntaxError，直接跳过。
// 注意：content script 顶层不能写 return（Illegal return statement），用 if/else。
if (document.contentType && document.contentType !== 'text/html') {
  // 非 HTML 文档：不注入
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createButton);
} else {
  createButton();
}