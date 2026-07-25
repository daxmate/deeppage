// ==============================================
// DeepPage — Side Panel Chat UI
// ==============================================

let pageContext = null;
let loading = false;

// ==============================================
// Chat helpers
// ==============================================

function addMsg(role, text, isHtml) {
  const chat = document.getElementById('chat');
  const remove = chat.querySelector('.loading');
  if (remove) remove.remove();

  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (isHtml) bubble.innerHTML = text;
  else bubble.textContent = text;
  div.appendChild(bubble);
  chat.appendChild(div);
  scroll();
}

function showLoading() {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  div.className = 'loading';
  div.innerHTML = '<span>.</span><span>.</span><span>.</span>';
  chat.appendChild(div);
  scroll();
}

function scroll() {
  const chat = document.getElementById('chat');
  setTimeout(() => { chat.scrollTop = chat.scrollHeight; }, 50);
}

function showLogin(show) {
  document.getElementById('login-notice').classList.toggle('show', show);
  document.getElementById('input').disabled = show;
  document.getElementById('send-btn').disabled = show;
}

function updateContext(title) {
  const bar = document.getElementById('context-bar');
  if (title) {
    document.getElementById('context-title').textContent = title;
    bar.classList.remove('hidden');
  } else {
    bar.classList.add('hidden');
  }
}

// ==============================================
// Send message
// ==============================================

async function sendMessage() {
  if (loading) return;

  const input = document.getElementById('input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  addMsg('user', text);
  showLoading();
  loading = true;

  try {
    const resp = await chrome.runtime.sendMessage({
      action: 'chat',
      pageContext,
      question: text
    });

    if (!resp || resp.error) {
      addMsg('assistant', `❌ ${resp?.error || '请求失败'}`);
      if (resp?.error?.includes('登录')) showLogin(true);
      loading = false;
      return;
    }

    addMsg('assistant', resp.text);
  } catch (err) {
    addMsg('assistant', `❌ ${err.message}`);
  } finally {
    loading = false;
  }
}

// ==============================================
// Init
// ==============================================

document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
document.getElementById('login-link').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.sendMessage({ action: 'openLogin' });
});

// Listen for page context
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'setContext') {
    pageContext = msg.pageContext;
    updateContext(pageContext.title);

    // Clear chat for new context
    document.getElementById('chat').innerHTML = '';
    addMsg('assistant', `📄 已加载「${pageContext.title}」作为对话背景`);
    document.getElementById('input').disabled = false;
    document.getElementById('send-btn').disabled = false;
    document.getElementById('input').focus();

    // Check login
    chrome.runtime.sendMessage({ action: 'checkLogin' }, (resp) => {
      showLogin(!resp?.loggedIn);
    });

    sendResponse({ ok: true });
    return false;
  }
});

// Auto-request any pending context from background
chrome.runtime.sendMessage({ action: 'getPendingContext' }, (resp) => {
  if (resp?.context) {
    pageContext = resp.context;
    updateContext(pageContext.title);
    document.getElementById('chat').innerHTML = '';
    addMsg('assistant', `📄 已加载「${pageContext.title}」作为对话背景`);
    document.getElementById('input').disabled = false;
    document.getElementById('send-btn').disabled = false;
    document.getElementById('input').focus();
  }
});
