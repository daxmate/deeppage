// ==============================================
// DeepPage — Content Script
// Floating button + page content extraction
// ==============================================

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
// Inject floating button
// ==============================================

function createButton() {
  if (document.getElementById('dp-floating-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'dp-floating-btn';
  btn.title = 'DeepPage - 发送网页内容到 DeepSeek';
  btn.innerHTML = '🧊';

  btn.addEventListener('click', async () => {
    const page = extractPageContent();

    // Brief feedback
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => { btn.style.transform = ''; }, 200);

    chrome.runtime.sendMessage({
      action: 'sendToDeepSeek',
      pageContext: {
        title: page.title,
        url: page.url,
        text: page.text
      }
    });
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
