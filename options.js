const i18n = chrome.i18n.getMessage.bind(chrome.i18n);

// 页面文本本地化
function localizePage() {
  const elements = document.querySelectorAll('[id^="l10n-"]');
  elements.forEach((el) => {
    const key = el.id.replace('l10n-', '');
    const text = i18n(key);
    if (text) el.textContent = text;
  });
  document.title = i18n('optionTitle');
  document.getElementById('apiKey').placeholder = i18n('apiKeyPlaceholder');
}
localizePage();

const DEFAULT_ACTIONS = [
  { label: i18n('defaultSummarizeLabel'), prompt: i18n('defaultSummarizePrompt') },
  { label: i18n('defaultOutlineLabel'), prompt: i18n('defaultOutlinePrompt') },
  { label: i18n('defaultTranslateLabel'), prompt: i18n('defaultTranslatePrompt') },
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
        <label>${i18n('buttonLabel')}</label>
        <input class="fld-label" type="text" placeholder="${i18n('buttonLabelPlaceholder')}" />
        <button class="btn-del" title="${i18n('deleteButton')}">✕</button>
      </div>
      <label>${i18n('promptLabel')}</label>
      <textarea class="fld-prompt" rows="2" placeholder="${i18n('promptPlaceholder')}"></textarea>
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
    document.getElementById('apiKey').value = result.deepseekApiKey || '';
    actions = (result.quickActions && result.quickActions.length)
      ? result.quickActions.map(a => ({ label: a.label, prompt: a.prompt }))
      : DEFAULT_ACTIONS.map(a => ({ ...a }));
    render();
  },
);

// ---- 添加 ----
btnAdd.addEventListener('click', () => {
  actions.push({ label: i18n('newButtonLabel'), prompt: '' });
  render();
  const cards = container.querySelectorAll('.action-card');
  if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth' });
});

// ---- 保存 ----
saveBtn.addEventListener('click', async () => {
  const key = document.getElementById('apiKey').value.trim();
  if (!key) { showStatus(i18n('apiKeyRequired'), 'err'); return; }

  const cards = container.querySelectorAll('.action-card');
  const cleaned = [];
  cards.forEach((card) => {
    const label = card.querySelector('.fld-label').value.trim();
    const prompt = card.querySelector('.fld-prompt').value.trim();
    if (label) cleaned.push({ label, prompt });
  });

  await chrome.storage.sync.set({
    deepseekApiKey: key,
    quickActions: cleaned,
  });
  actions = cleaned;
  render();
  showStatus(i18n('savedSuccess'), 'ok');
});

function showStatus(msg, cls) {
  status.textContent = msg;
  status.className = cls;
}
