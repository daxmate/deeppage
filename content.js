// ==============================================
// DeepPage — Content Script
// Floating button → opens side panel
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
    clone.querySelectorAll('script,style,nav,header,footer,aside,iframe,.sidebar,.nav,[role="navigation"],[role="banner"]').forEach(el => el.remove());
    text = clone.innerText;
  }
  text = text.replace(/\s+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
  const MAX = 15000;
  if (text.length > MAX) text = text.slice(0,MAX) + '\n\n...（已截取）';
  return { title: document.title, url: location.href, text };
}

function createButton() {
  if (document.getElementById('__dp-btn')) return;
  const btn = document.createElement('button');
  btn.id = '__dp-btn';
  btn.innerHTML = '🧊';
  btn.addEventListener('click', () => {
    const page = extractPageContent();
    chrome.runtime.sendMessage({
      action: 'openDeepPage',
      pageContext: page
    });
  });
  document.body.appendChild(btn);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createButton);
} else {
  createButton();
}
