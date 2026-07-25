// ==============================================
// DeepPage — Content Script
// Floating button → opens a popup with DeepSeek
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
// Floating button
// ==============================================

function createButton() {
  if (document.getElementById('__dp-btn')) return;

  const btn = document.createElement('button');
  btn.id = '__dp-btn';
  btn.innerHTML = '🧊';
  btn.title = 'DeepPage - 用 DeepSeek 分析此页面';

  btn.addEventListener('click', async () => {
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => { btn.style.transform = ''; }, 200);

    const page = extractPageContent();

    // Store page context in session storage (background will read it)
    await chrome.storage.session.set({ deeppage_context: page });

    // Tell background to open the DeepSeek popup
    chrome.runtime.sendMessage({ action: 'openDeepSeekPopup' });
  });

  document.body.appendChild(btn);
}

// ==============================================
// Init
// ==============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createButton);
} else {
  createButton();
}
