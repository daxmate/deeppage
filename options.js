const input = document.getElementById('apiKey');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

chrome.storage.sync.get('deepseekApiKey', ({ deepseekApiKey }) => {
  if (deepseekApiKey) input.value = deepseekApiKey;
});

saveBtn.addEventListener('click', async () => {
  const key = input.value.trim();
  if (!key) { showStatus('请输入 API Key', 'err'); return; }

  await chrome.storage.sync.set({ deepseekApiKey: key });
  showStatus('✅ 已保存', 'ok');
});

function showStatus(msg, cls) {
  status.textContent = msg;
  status.className = cls;
}
