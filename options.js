const inputs = {
  apiKey: document.getElementById('apiKey'),
  promptSummarize: document.getElementById('promptSummarize'),
  promptOutline: document.getElementById('promptOutline'),
  promptTranslate: document.getElementById('promptTranslate'),
};
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// 默认值
const defaults = {
  promptSummarize: '请用中文总结这篇网页正文部分的核心内容',
  promptOutline: '请提炼这篇网页正文部分的要点，以列表形式列出',
  promptTranslate: '请将这篇网页的正文部分翻译成中文',
};

// 加载已保存的值
chrome.storage.sync.get(
  ['deepseekApiKey', 'promptSummarize', 'promptOutline', 'promptTranslate'],
  (result) => {
    if (result.deepseekApiKey) inputs.apiKey.value = result.deepseekApiKey;
    inputs.promptSummarize.value = result.promptSummarize || defaults.promptSummarize;
    inputs.promptOutline.value = result.promptOutline || defaults.promptOutline;
    inputs.promptTranslate.value = result.promptTranslate || defaults.promptTranslate;
  },
);

saveBtn.addEventListener('click', async () => {
  const key = inputs.apiKey.value.trim();
  if (!key) { showStatus('请输入 API Key', 'err'); return; }

  await chrome.storage.sync.set({
    deepseekApiKey: key,
    promptSummarize: inputs.promptSummarize.value.trim() || defaults.promptSummarize,
    promptOutline: inputs.promptOutline.value.trim() || defaults.promptOutline,
    promptTranslate: inputs.promptTranslate.value.trim() || defaults.promptTranslate,
  });
  showStatus('✅ 已保存', 'ok');
});

function showStatus(msg, cls) {
  status.textContent = msg;
  status.className = cls;
}
