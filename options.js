// ---- 页面文本本地化 ----
function localizePage() {
  const elements = document.querySelectorAll('[id^="l10n-"]');
  elements.forEach((el) => {
    const key = el.id.replace('l10n-', '');
    const text = t(key);
    if (text) el.textContent = text;
  });
  document.title = t('optionTitle');
  document.getElementById('apiKey').placeholder = t('apiKeyPlaceholder') || 'sk-...';
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
  loadSavedData();
});

// ---- 常量 ----
let actions = [];

const container = document.getElementById('actions-container');
const btnAdd = document.getElementById('btn-add');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// ---- API 类型配置 ----
const API_TYPES = {
  openai: {
    label: 'OpenAI-compatible',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://platform.deepseek.com/api_keys',
    keyLinkLabel: 'Get API Key',
    defaultModel: 'deepseek-v4-flash',
  },
  anthropic: {
    label: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    keyPlaceholder: 'sk-ant-...',
    keyLink: 'https://console.anthropic.com/settings/keys',
    keyLinkLabel: 'Get API Key',
    defaultModel: 'claude-sonnet-4-20250514',
  },
};

function updateApiUI(apiType) {
  const cfg = API_TYPES[apiType];
  if (!cfg) return;

  // Key placeholder
  document.getElementById('apiKey').placeholder = cfg.keyPlaceholder;

  // Link
  const link = document.querySelector('#apiKeyLink a');
  if (link) {
    link.href = cfg.keyLink;
    const span = link.querySelector('span');
    if (span) span.textContent = cfg.keyLinkLabel;
  }

  // Base URL placeholder
  const baseUrlInput = document.getElementById('apiBaseUrl');
  baseUrlInput.placeholder = cfg.defaultBaseUrl;
  if (!baseUrlInput.value || baseUrlInput.dataset.autoFilled !== 'false') {
    baseUrlInput.value = cfg.defaultBaseUrl;
    baseUrlInput.dataset.autoFilled = 'true';
  }

  // Model placeholder
  document.getElementById('apiModel').placeholder = cfg.defaultModel;
}

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

// ---- 加载 ----
function loadSavedData() {
  chrome.storage.sync.get(
    ['apiType', 'apiBaseUrl', 'apiKey', 'apiModel',
     'deepseekApiKey', // fallback
     'quickActions', 'quickActionsLang'],
    (result) => {
      const apiType = result.apiType || 'openai';
      document.getElementById('apiType').value = apiType;
      updateApiUI(apiType);

      // Base URL
      document.getElementById('apiBaseUrl').value =
        result.apiBaseUrl || API_TYPES[apiType].defaultBaseUrl;

      // API Key — use new apiKey first, fall back to deepseekApiKey
      document.getElementById('apiKey').value = result.apiKey || result.deepseekApiKey || '';

      // Model
      document.getElementById('apiModel').value =
        result.apiModel || API_TYPES[apiType].defaultModel;

      // Quick actions
      const currentLang = getCurrentLang();
      const savedLang = result.quickActionsLang;
      const defaults = [
        { label: t('defaultSummarizeLabel'), prompt: t('defaultSummarizePrompt') },
        { label: t('defaultOutlineLabel'), prompt: t('defaultOutlinePrompt') },
        { label: t('defaultTranslateLabel'), prompt: t('defaultTranslatePrompt') },
      ];
      if (result.quickActions && result.quickActions.length && savedLang === currentLang) {
        actions = result.quickActions.map(a => ({ label: a.label, prompt: a.prompt }));
      } else {
        actions = defaults.map(a => ({ ...a }));
      }
      render();
    },
  );
}

// ---- API 类型切换 ----
document.getElementById('apiType').addEventListener('change', (e) => {
  const apiType = e.target.value;
  updateApiUI(apiType);
  document.getElementById('apiKey').value = '';
});

// ---- Base URL 手动编辑后不再自动填充 ----
document.getElementById('apiBaseUrl').addEventListener('input', () => {
  document.getElementById('apiBaseUrl').dataset.autoFilled = 'false';
});

// ---- 语言切换 ----
document.getElementById('language-select').addEventListener('change', (e) => {
  window.__dp_lang = e.target.value;
  setStoredLanguage(e.target.value, () => {
    localizePage();
    loadSavedData();
  });
});

// ---- Dark mode 切换 ----
const darkToggle = document.getElementById('dark-mode-toggle');
chrome.storage.sync.get('darkMode', (result) => {
  darkToggle.checked = !!result.darkMode;
  applyOptionsDarkMode(!!result.darkMode);
});
darkToggle.addEventListener('change', () => {
  applyOptionsDarkMode(darkToggle.checked);
  chrome.storage.sync.set({ darkMode: darkToggle.checked });
});
function applyOptionsDarkMode(dark) {
  document.body.classList.toggle('__dp-dark-options', dark);
}

// ---- 最大对话轮数 ----
const maxRoundsInput = document.getElementById('max-rounds');
const maxRoundsValue = document.getElementById('max-rounds-value');
chrome.storage.sync.get('maxRounds', (result) => {
  const val = result.maxRounds || 20;
  maxRoundsInput.value = val;
  maxRoundsValue.textContent = val;
});
maxRoundsInput.addEventListener('input', () => {
  maxRoundsValue.textContent = maxRoundsInput.value;
});

// ---- 测试连接 ----
document.getElementById('testApiBtn').addEventListener('click', async () => {
  const btn = document.getElementById('testApiBtn');
  const statusEl = document.getElementById('testApiStatus');
  btn.disabled = true;
  btn.textContent = (t('testApiButton') || 'Test Connection') + '...';
  statusEl.textContent = '';

  // Save current settings first
  const apiType = document.getElementById('apiType').value;
  const baseUrl = document.getElementById('apiBaseUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('apiModel').value.trim();

  await chrome.storage.sync.set({
    apiType, apiBaseUrl: baseUrl, apiKey, apiModel: model,
  });

  try {
    const result = await chrome.runtime.sendMessage({ action: 'testApi' });
    if (result.ok) {
      statusEl.textContent = t('testApiSuccess') || '✅ Connection OK';
      statusEl.style.color = '#34d399';
    } else {
      statusEl.textContent = (t('testApiFailed') || '❌ Connection failed:') + (result.error || '');
      statusEl.style.color = '#f87171';
    }
  } catch (err) {
    statusEl.textContent = (t('testApiFailed') || '❌ Connection failed:') + err.message;
    statusEl.style.color = '#f87171';
  }

  btn.disabled = false;
  btn.textContent = t('testApiButton') || 'Test Connection';
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
  const apiType = document.getElementById('apiType').value;
  const baseUrl = document.getElementById('apiBaseUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('apiModel').value.trim();

  if (!apiKey) { showStatus(t('apiKeyRequired'), 'err'); return; }

  const cards = container.querySelectorAll('.action-card');
  const cleaned = [];
  cards.forEach((card) => {
    const label = card.querySelector('.fld-label').value.trim();
    const prompt = card.querySelector('.fld-prompt').value.trim();
    if (label) cleaned.push({ label, prompt });
  });

  await chrome.storage.sync.set({
    apiType,
    apiBaseUrl: baseUrl,
    apiKey,
    apiModel: model,
    quickActions: cleaned,
    quickActionsLang: getCurrentLang(),
    maxRounds: parseInt(maxRoundsInput.value, 10) || 20,
  });
  actions = cleaned;
  render();
  showStatus(t('savedSuccess'), 'ok');
});

function showStatus(msg, cls) {
  status.textContent = msg;
  status.className = cls;
}
