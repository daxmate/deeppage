// ==============================================
// DeepPage — Content Script (all pages)
// Floating button + custom chat window
// ==============================================

let pageContent = null;

// ==============================================
// Extract page text
// ==============================================

function extractPageContent() {
  const article = document.querySelector('article') ||
    document.querySelector('main') ||
    document.querySelector('[role="main"]');

  let text = '';
  if (article) {
    text = article.innerText;
  } else {
    const clone = document.body.cloneNode(true);
    const removals = clone.querySelectorAll('script, style, nav, header, footer, ' +
      'aside, iframe, .sidebar, .nav, [role="navigation"], [role="banner"]');
    removals.forEach(el => el.remove());
    text = clone.innerText;
  }

  text = text.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const MAX_CHARS = 15000;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) + '\n\n... (已截取，全文约 ' + text.length + ' 字)';
  }

  return { title: document.title, url: location.href, text };
}

// ==============================================
// Chat Window UI
// ==============================================

let chatWindow = null;
let isOpen = false;

function createChatWindow() {
  if (chatWindow) return;

  chatWindow = document.createElement('div');
  chatWindow.id = '__dp-window';
  chatWindow.innerHTML = `
    <div id="__dp-header">
      <span>🧊 DeepSeek · <span id="__dp-page-title">当前网页</span></span>
      <button id="__dp-close">✕</button>
    </div>
    <div id="__dp-chat">
      <div class="__dp-msg __dp-welcome">
        已加载此页面作为背景<br>输入你的问题吧
      </div>
    </div>
    <div id="__dp-input-row">
      <textarea id="__dp-input" placeholder="输入问题..."></textarea>
      <button id="__dp-send">➤</button>
    </div>
  `;

  document.body.appendChild(chatWindow);

  // Events
  document.getElementById('__dp-close').addEventListener('click', closeChat);
  document.getElementById('__dp-send').addEventListener('click', sendMsg);
  document.getElementById('__dp-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  });

  // Draggable
  makeDraggable(chatWindow);
}

function openChat() {
  pageContent = extractPageContent();
  createChatWindow();
  chatWindow.classList.add('open');
  isOpen = true;
  document.getElementById('__dp-page-title').textContent = pageContent.title || '当前网页';
  document.getElementById('__dp-input').focus();

  // Pre-fill welcome msg
  const chat = document.getElementById('__dp-chat');
  chat.innerHTML = `
    <div class="__dp-msg __dp-welcome">
      📄 已加载「${pageContent.title}」<br>
      试试：总结全文、提炼要点、自由提问
    </div>
  `;
}

function closeChat() {
  if (chatWindow) {
    chatWindow.classList.remove('open');
    isOpen = false;
  }
}

// ==============================================
// Send message
// ==============================================

let loading = false;

async function sendMsg() {
  if (loading) return;

  const input = document.getElementById('__dp-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  loading = true;

  const chat = document.getElementById('__dp-chat');

  // Add user message
  chat.insertAdjacentHTML('beforeend', `
    <div class="__dp-msg __dp-user">
      <div class="__dp-bubble __dp-user-bubble">${escapeHtml(text)}</div>
    </div>
  `);

  // Add loading indicator
  chat.insertAdjacentHTML('beforeend', `
    <div class="__dp-msg __dp-assistant" id="__dp-loading">
      <div class="__dp-bubble __dp-ai-bubble">
        <span class="__dp-dot">.</span><span class="__dp-dot">.</span><span class="__dp-dot">.</span>
      </div>
    </div>
  `);
  scrollChat();

  try {
    const resp = await chrome.runtime.sendMessage({
      action: 'chat',
      pageContext: pageContent,
      question: text
    });

    document.getElementById('__dp-loading')?.remove();

    if (!resp || resp.error) {
      chat.insertAdjacentHTML('beforeend', `
        <div class="__dp-msg __dp-assistant">
          <div class="__dp-bubble __dp-ai-bubble __dp-error">❌ ${escapeHtml(resp?.error || '请求失败')}</div>
        </div>
      `);
    } else {
      chat.insertAdjacentHTML('beforeend', `
        <div class="__dp-msg __dp-assistant">
          <div class="__dp-bubble __dp-ai-bubble">${escapeHtml(resp.text)}</div>
        </div>
      `);
    }
    scrollChat();
  } catch (err) {
    document.getElementById('__dp-loading')?.remove();
    chat.insertAdjacentHTML('beforeend', `
      <div class="__dp-msg __dp-assistant">
        <div class="__dp-bubble __dp-ai-bubble __dp-error">❌ ${escapeHtml(err.message)}</div>
      </div>
    `);
    scrollChat();
  } finally {
    loading = false;
  }
}

function scrollChat() {
  const chat = document.getElementById('__dp-chat');
  if (chat) setTimeout(() => { chat.scrollTop = chat.scrollHeight; }, 50);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ==============================================
// Draggable
// ==============================================

function makeDraggable(el) {
  const header = el.querySelector('#__dp-header');
  let x, y, mx, my;

  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    x = e.clientX; y = e.clientY;
    mx = el.offsetLeft; my = el.offsetTop;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  function onMove(e) {
    el.style.left = (mx + e.clientX - x) + 'px';
    el.style.top = (my + e.clientY - y) + 'px';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
}

// ==============================================
// Floating button
// ==============================================

function createButton() {
  if (document.getElementById('__dp-btn')) return;

  const btn = document.createElement('button');
  btn.id = '__dp-btn';
  btn.innerHTML = '🧊';
  btn.addEventListener('click', () => {
    if (isOpen) { closeChat(); return; }
    openChat();
    btn.classList.add('active');
  });

  // Close button when window is closed
  const observer = new MutationObserver(() => {
    if (!chatWindow?.classList.contains('open')) {
      btn.classList.remove('active');
    }
  });
  document.body.appendChild(btn);

  if (chatWindow) observer.observe(chatWindow, { attributes: true, attributeFilter: ['class'] });
}

// ==============================================
// Init
// ==============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createButton);
} else {
  createButton();
}
