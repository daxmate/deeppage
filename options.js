const DEFAULT_ACTIONS = [
  { label: '📝 总结全文', prompt: '请用中文总结这篇网页正文部分的核心内容' },
  { label: '🎯 提炼要点', prompt: '请提炼这篇网页正文部分的要点，以列表形式列出' },
  { label: '🌐 翻译', prompt: '请将这篇网页的正文部分翻译成中文' },
];

let actions = [];

const container = document.getElementById('actions-container');
const btnAdd = document.getElementById('btn-add');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// ---- 渲染卡片列表 ----
function render() {
  container.innerHTML = '';
  actions.forEach((action, i) => {
    const card = document.createElement('div');
    card.className = 'action-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-index">${i + 1}</span>
        <label>按钮文字</label>
        <input class="fld-label" type="text" placeholder="如 📝 总结全文" />
        <button class="btn-del" title="删除">✕</button>
      </div>
      <label>提示词</label>
      <textarea class="fld-prompt" rows="2" placeholder="点击按钮时自动输入的提示词"></textarea>
    `;
    card.querySelector('.fld-label').value = action.label || '';
    card.querySelector('.fld-prompt').value = action.prompt || '';
    card.querySelector('.btn-del').addEventListener('click', () => {
      actions.splice(i, 1);
      render();
    });
    container.appendChild(card);
  });
}

// ---- 加载 ----
chrome.storage.sync.get(
  ['deepseekApiKey', 'quickActions'],
  (result) => {
    console.log('[DeepPage 选项] 加载 quickActions:', JSON.stringify(result.quickActions));
    document.getElementById('apiKey').value = result.deepseekApiKey || '';
    actions = (result.quickActions && result.quickActions.length)
      ? result.quickActions.map(a => ({ label: a.label, prompt: a.prompt }))
      : DEFAULT_ACTIONS.map(a => ({ ...a }));
    render();
  },
);

// ---- 添加 ----
btnAdd.addEventListener('click', () => {
  actions.push({ label: '新按钮', prompt: '' });
  render();
  // 滚动到最后一张卡片
  const cards = container.querySelectorAll('.action-card');
  if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth' });
});

// ---- 保存 ----
saveBtn.addEventListener('click', async () => {
  const key = document.getElementById('apiKey').value.trim();
  if (!key) { showStatus('请输入 API Key', 'err'); return; }

  // 从 DOM 读取最新值
  const cards = container.querySelectorAll('.action-card');
  const cleaned = [];
  cards.forEach((card) => {
    const label = card.querySelector('.fld-label').value.trim();
    const prompt = card.querySelector('.fld-prompt').value.trim();
    if (label) cleaned.push({ label, prompt });
  });

  console.log('[DeepPage 选项] 准备保存 quickActions:', JSON.stringify(cleaned));
  await chrome.storage.sync.set({
    deepseekApiKey: key,
    quickActions: cleaned,
  });
  // 立即读回来验证
  chrome.storage.sync.get('quickActions', (verify) => {
    console.log('[DeepPage 选项] 保存后验证:', JSON.stringify(verify.quickActions));
  });
  actions = cleaned;
  render();
  showStatus('✅ 已保存', 'ok');
});

function showStatus(msg, cls) {
  status.textContent = msg;
  status.className = cls;
}
