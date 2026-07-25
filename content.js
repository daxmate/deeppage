// ==============================================
// DeepPage — Content Script
// Injects floating button + sidebar UI
// Extracts page content for context
// ==============================================

const DP_ID = 'deeppage';

// ==============================================
// Extract page text content
// ==============================================

function extractPageContent() {
  // Get the main content: article, main, or body
  const article = document.querySelector('article') ||
    document.querySelector('main') ||
    document.querySelector('[role="main"]');

  let text = '';
  if (article) {
    text = article.innerText;
  } else {
    // Fallback: get all visible text, excluding scripts/styles/nav
    const clone = document.body.cloneNode(true);
    const removals = clone.querySelectorAll('script, style, nav, header, footer, ' +
      'aside, iframe, .sidebar, .nav, [role="navigation"], [role="banner"]');
    removals.forEach(el => el.remove());
    text = clone.innerText;
  }

  // Clean up
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Truncate if too long (DeepSeek context window)
  const MAX_CHARS = 15000;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) + '\n\n... (内容较长，已截取前 ' + MAX_CHARS + ' 字)';
  }

  return {
    title: document.title,
    url: location.href,
    text
  };
}

function formatPageContext(page) {
  return `这是网页「${page.title}」的内容：\nURL: ${page.url}\n\n${page.text}`;
}

// ==============================================
// UI Creation
// ==============================================

let sidebarEl = null;
let floatingBtn = null;
let isOpen = false;
let pageContent = null;
let messages = [];
let isStreaming = false;

function createUI() {
  // --- Floating Button ---
  if (document.getElementById('dp-floating-btn')) return;

  floatingBtn = document.createElement('button');
  floatingBtn.id = 'dp-floating-btn';
  floatingBtn.title = 'DeepPage - 与 DeepSeek 对话';
  floatingBtn.innerHTML = '🧊';
  floatingBtn.addEventListener('click', toggleSidebar);
  document.body.appendChild(floatingBtn);

  // --- Sidebar ---
  sidebarEl = document.createElement('div');
  sidebarEl.id = 'dp-sidebar';
  sidebarEl.innerHTML = `
    <div id="dp-header">
      <div id="dp-header-title">🧊 DeepPage</div>
      <button id="dp-header-close">✕</button>
    </div>
    <div id="dp-context-bar">
      <span class="dp-context-icon">📄</span>
      <span class="dp-context-text">正在加载页面内容...</span>
      <button class="dp-context-refresh">刷新</button>
    </div>
    <div id="dp-chat">
      <div class="dp-welcome">
        <div class="dp-welcome-icon">🧊</div>
        <div class="dp-welcome-text">
          已加载此页面的内容，你可以：<br>
          • 总结全文<br>
          • 提炼要点<br>
          • 就文章内容提问
        </div>
        <button class="dp-welcome-hint">💡 总结这个页面</button>
      </div>
    </div>
    <div id="dp-login-notice">
      请先前往 <a target="_blank" href="https://chat.deepseek.com">chat.deepseek.com</a> 登录 DeepSeek 账号
    </div>
    <div id="dp-input-area">
      <textarea id="dp-input" placeholder="输入你的问题..." rows="1"></textarea>
      <button id="dp-send-btn" disabled>➤</button>
    </div>
  `;

  document.body.appendChild(sidebarEl);

  // --- Event handlers ---
  document.getElementById('dp-header-close').addEventListener('click', toggleSidebar);
  document.getElementById('dp-send-btn').addEventListener('click', sendMessage);
  document.getElementById('dp-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  document.getElementById('dp-input').addEventListener('input', updateSendButton);
  document.getElementById('dp-context-bar').querySelector('.dp-context-refresh').addEventListener('click', loadPageContext);
  document.querySelector('.dp-welcome-hint')?.addEventListener('click', () => {
    if (isOpen) {
      document.getElementById('dp-input').value = '总结一下这个页面';
      sendMessage();
    }
  });

  // Load page context
  loadPageContext();
}

function toggleSidebar() {
  if (!sidebarEl) return;
  isOpen = !isOpen;
  sidebarEl.classList.toggle('open', isOpen);

  if (isOpen) {
    document.getElementById('dp-input')?.focus();
    checkLoginStatus();
  }
}

function updateSendButton() {
  const input = document.getElementById('dp-input');
  const btn = document.getElementById('dp-send-btn');
  if (input && btn) {
    btn.disabled = !input.value.trim() || isStreaming;
  }
}

// ==============================================
// Page Context
// ==============================================

function loadPageContext() {
  pageContent = extractPageContent();
  const bar = document.getElementById('dp-context-bar');
  if (bar) {
    const textEl = bar.querySelector('.dp-context-text');
    if (textEl) {
      const label = pageContent.title || '当前页面';
      textEl.textContent = `${label} (${pageContent.text.length} 字)`;
    }
  }
}

// ==============================================
// Chat
// ==============================================

async function sendMessage(e) {
  if (isStreaming) return;

  const input = document.getElementById('dp-input');
  const text = input.value.trim();
  if (!text) return;

  // Check login status first
  const isLoggedIn = await checkLoginStatus();
  if (!isLoggedIn) return;

  // Add user message
  const chatEl = document.getElementById('dp-chat');
  addMessage('user', text);
  input.value = '';
  updateSendButton();

  // Build context
  const context = formatPageContext(pageContent);

  // Add loading indicator
  const loadingId = 'dp-loading-' + Date.now();
  chatEl.insertAdjacentHTML('beforeend', `
    <div class="dp-msg assistant" id="${loadingId}">
      <div class="dp-bubble">
        <div class="dp-loading"><span></span><span></span><span></span></div>
      </div>
    </div>
  `);
  scrollToBottom();

  try {
    isStreaming = true;
    updateSendButton();

    // Send to background
    const response = await chrome.runtime.sendMessage({
      action: 'chat',
      pageContext: context,
      question: text,
      messages: messages.slice(-10) // last 10 for context
    });

    // Remove loading
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    if (!response || response.error) {
      const errorMsg = response?.error || '请求失败';
      if (errorMsg.includes('尚未加载完成')) {
        addMessage('assistant', '🔄 正在准备 DeepSeek 连接，请稍后再试...');
      } else {
        addMessage('assistant', `❌ ${errorMsg}`);
      }
      showLoginNotice(true);
      return;
    }

    // Add assistant message
    addMessage('assistant', response.text);

  } catch (err) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    addMessage('assistant', `❌ 请求失败: ${err.message}`);
  } finally {
    isStreaming = false;
    updateSendButton();
  }
}

function addMessage(role, text) {
  const chatEl = document.getElementById('dp-chat');
  const msgEl = document.createElement('div');
  msgEl.className = `dp-msg ${role}`;

  const label = document.createElement('div');
  label.className = 'dp-label';
  label.textContent = role === 'user' ? '你' : 'DeepSeek';
  msgEl.appendChild(label);

  const bubble = document.createElement('div');
  bubble.className = 'dp-bubble';
  bubble.textContent = text;
  msgEl.appendChild(bubble);

  chatEl.appendChild(msgEl);

  // Save to message history
  messages.push({ role, content: text });

  scrollToBottom();
}

function scrollToBottom() {
  const chatEl = document.getElementById('dp-chat');
  if (chatEl) {
    setTimeout(() => { chatEl.scrollTop = chatEl.scrollHeight; }, 50);
  }
}

// ==============================================
// Auth Check
// ==============================================

async function checkLoginStatus() {
  try {
    const resp = await chrome.runtime.sendMessage({ action: 'checkLogin' });
    const loggedIn = resp?.loggedIn === true;
    showLoginNotice(!loggedIn);
    return loggedIn;
  } catch {
    showLoginNotice(true);
    return false;
  }
}

function showLoginNotice(show) {
  const notice = document.getElementById('dp-login-notice');
  if (notice) {
    notice.classList.toggle('show', show);
    const link = notice.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'openLogin' });
      });
    }
  }
}

// ==============================================
// Init
// ==============================================

// Inject when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createUI);
} else {
  createUI();
}

// Re-extract on history API navigation (SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(loadPageContext, 500);
  }
}).observe(document, { subtree: true, childList: true });
