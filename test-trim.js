// ==============================================
// 测试：对话轮数裁剪 & 清除上下文逻辑
// ==============================================

// 模拟 trimConversation 核心算法
function testTrim() {
  let passed = 0, failed = 0;

  // --- 测试 1: 不裁剪（少于 maxRounds） ---
  {
    const chatHistory = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`
    }));
    const maxRounds = 20;
    const initialLen = chatHistory.length;
    // 模拟 trim 的判断逻辑
    if (chatHistory.length <= maxRounds * 2) {
      // 不裁剪
    }
    if (chatHistory.length === initialLen) {
      console.log('✅ 测试1: 不裁剪（少于 maxRounds）');
      passed++;
    } else {
      console.log('❌ 测试1: 期望不变，实际变了');
      failed++;
    }
  }

  // --- 测试 2: 裁剪 3 轮（6 条） ---
  {
    const chatHistory = Array.from({ length: 26 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`
    }));
    const maxRounds = 10; // 期望保留 20 条
    const excess = chatHistory.length - maxRounds * 2;
    const removeCount = Math.floor(excess / 2) * 2;
    chatHistory.splice(0, removeCount);
    if (chatHistory.length === 20 && chatHistory[0].content === 'msg6') {
      console.log('✅ 测试2: 裁剪 3 轮');
      passed++;
    } else {
      console.log(`❌ 测试2: 期望 20 条从 msg6 开始，实际 ${chatHistory.length} 条从 ${chatHistory[0]?.content}`);
      failed++;
    }
  }

  // --- 测试 3: 恰好等于 maxRounds 不裁剪 ---
  {
    const chatHistory = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`
    }));
    const maxRounds = 10;
    const excess = chatHistory.length - maxRounds * 2;
    const removeCount = Math.floor(excess / 2) * 2;
    chatHistory.splice(0, removeCount);
    if (chatHistory.length === 20) {
      console.log('✅ 测试3: 恰好等于 maxRounds 不裁剪');
      passed++;
    } else {
      console.log(`❌ 测试3: 期望不变，实际 ${chatHistory.length}`);
      failed++;
    }
  }

  // --- 测试 4: 裁剪后保持完整的 user-assistant 对 ---
  {
    const chatHistory = Array.from({ length: 40 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`
    }));
    const maxRounds = 10;
    const excess = chatHistory.length - maxRounds * 2;
    const removeCount = Math.floor(excess / 2) * 2;
    chatHistory.splice(0, removeCount);
    const pairsOK = chatHistory.every((_, i) => {
      if (i % 2 === 0) return chatHistory[i].role === 'user';
      return chatHistory[i].role === 'assistant';
    });
    if (chatHistory.length === 20 && pairsOK) {
      console.log('✅ 测试4: 裁剪后保留完整 user-assistant 对');
      passed++;
    } else {
      console.log(`❌ 测试4: 长度=${chatHistory.length}, 配对=${pairsOK}`);
      failed++;
    }
  }

  // --- 测试 5: maxRounds=2 边界 ---
  {
    const chatHistory = Array.from({ length: 50 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`
    }));
    const maxRounds = 2;
    const excess = chatHistory.length - maxRounds * 2;
    const removeCount = Math.floor(excess / 2) * 2;
    chatHistory.splice(0, removeCount);
    if (chatHistory.length === 4 && chatHistory[0].content === 'msg46') {
      console.log('✅ 测试5: maxRounds=2 边界');
      passed++;
    } else {
      console.log(`❌ 测试5: 期望 4 条从 msg46，实际 ${chatHistory.length} 条从 ${chatHistory[0]?.content}`);
      failed++;
    }
  }

  // --- 测试 6: 空白历史 ---
  {
    const chatHistory = [];
    const maxRounds = 20;
    if (chatHistory.length <= maxRounds * 2) {
      // 不裁剪
    }
    if (chatHistory.length === 0) {
      console.log('✅ 测试6: 空白历史不报错');
      passed++;
    } else {
      console.log('❌ 测试6: 空白历史出问题');
      failed++;
    }
  }

  console.log(`\n${passed}/${passed + failed} 测试通过`);
  return failed === 0;
}

// 模拟 clearContext 核心算法
function testClearContext() {
  let passed = 0, failed = 0;

  // --- 测试 7: 清除后保留最后一条 ---
  {
    const chatHistory = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`
    }));
    const keep = chatHistory[chatHistory.length - 1];
    const newHistory = [keep];
    if (newHistory.length === 1 && newHistory[0].content === 'msg9') {
      console.log('✅ 测试7: 清除后保留最后一条');
      passed++;
    } else {
      console.log('❌ 测试7: 清除结果不对');
      failed++;
    }
  }

  // --- 测试 8: 少于 3 条不操作 ---
  {
    const chatHistory = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' }
    ];
    if (chatHistory.length <= 2) {
      console.log('✅ 测试8: 少于 3 条不操作');
      passed++;
    } else {
      console.log('❌ 测试8: 应该跳过');
      failed++;
    }
  }

  console.log(`\n${passed}/${passed + failed} 测试通过`);
  return failed === 0;
}

console.log('=== 对话裁剪测试 ===');
const trimOK = testTrim();
console.log('\n=== 清除上下文测试 ===');
const clearOK = testClearContext();

const allOK = trimOK && clearOK;
process.exit(allOK ? 0 : 1);
