// ---- 页面文本本地化 ----
function localizePage() {
  const elements = document.querySelectorAll('[id^="l10n-"]');
  elements.forEach((el) => {
    const key = el.id.replace('l10n-', '');
    const text = t(key);
    if (text) el.textContent = text;
  });
  document.title = t('optionTitle');
  document.getElementById('apiKey').placeholder = t('apiKeyPlaceholder');
}

// ---- 语言下拉框 ----
function populateLanguageSelect() {
  const select = document.getElementById('language-select');
  const current = getCurrentLang();
  LANGUAGES.forEach((lang) => {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.label;
    if (lang.code === current) opt.selected = true;
    select.appendChild(opt);
  });
}

// ---- 初始化 ----
loadLanguage(() => {
  localizePage();
  populateLanguageSelect();
});

// ---- 常量 ----
const DEFAULT_ACTIONS = [
  { label: t('defaultSummarizeLabel'), prompt: t('defaultSummarizePrompt') },
  { label: t('defaultOutlineLabel'), prompt: t('defaultOutlinePrompt') },
  { label: t('defaultTranslateLabel'), prompt: t('defaultTranslatePrompt') },
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
        <label>${t('buttonLabel')}</label>
        <input class="fld-label" type="text" placeholder="${t('buttonLabelPlaceholder')}" />
        <button class="btn-del" title="${t('deleteButton')}">✕</button>
      </div>
      <label>${t('promptLabel')}</label>
      <textarea class="fld-prompt" rows="2" placeholder="${t('promptPlaceholder')}"></textarea>
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

// ---- 加载已保存数据 ----
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

// ---- 语言切换 ----
document.getElementById('language-select').addEventListener('change', (e) => {
  setStoredLanguage(e.target.value, () => {
    // 刷新页面以应用新语言
    location.reload();
  });
});

// ---- 添加按钮 ----
btnAdd.addEventListener('click', () => {
  actions.push({ label: t('newButtonLabel'), prompt: '' });
  render();
  const cards = container.querySelectorAll('.action-card');
  if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth' });
});

// ---- 保存 ----
saveBtn.addEventListener('click', async () => {
  const key = document.getElementById('apiKey').value.trim();
  if (!key) { showStatus(t('apiKeyRequired'), 'err'); return; }

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
  showStatus(t('savedSuccess'), 'ok');
});

function showStatus(msg, cls) {
  status.textContent = msg;
  status.className = cls;
}
