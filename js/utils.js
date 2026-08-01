// ==============================================
// DeepPage — Utility Functions
// ==============================================

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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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

// 剥离 markdown 语法，输出纯文本（用于「复制纯文本」导出）
// 方案：marked 渲染为 HTML 再取 textContent，由 DOM 完成语法剥离，不手写正则
function markdownToPlainText(text) {
  try {
    const html = marked.parse(text, { breaks: true, gfm: true });
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  } catch (e) {
    return text;
  }
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

function scrollChat() {
  const chat = document.getElementById("__dp-chat");
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

