// ==============================================
// DeepPage — 自绘 SVG 图标库
// 风格与 header 按钮一致：feather 线性图标（stroke=currentColor）
// 用法：返回完整 <svg> 字符串，可直接 innerHTML 插入；颜色跟随 CSS currentColor
// ==============================================

// 通用 SVG 包裹器
function _dpIcon(inner, size) {
  const s = size || 14;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle">${inner}</svg>`;
}

// 总结全文（📝 → 文档+笔）
function iconSummarize(size) {
  return _dpIcon(
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    size
  );
}

// 提炼要点（🎯 → 靶心）
function iconOutline(size) {
  return _dpIcon(
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    size
  );
}

// 翻译（🌐 → 地球）
function iconTranslate(size) {
  return _dpIcon(
    '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    size
  );
}

// 自定义（🔧 → 扳手）
function iconCustom(size) {
  return _dpIcon(
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    size
  );
}

// 选中提问（💬 → 对话气泡）
function iconAsk(size) {
  return _dpIcon(
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    size
  );
}

// 页面上下文（📄 → 文档）
function iconContext(size) {
  return _dpIcon(
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    size
  );
}

// 错误（❌ → X 圆圈）
function iconError(size) {
  return _dpIcon(
    '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    size
  );
}

// 成功（✅ → 对勾圆圈）
function iconSuccess(size) {
  return _dpIcon('<circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>', size);
}

// 警告（⚠️ → 三角感叹号）
function iconWarn(size) {
  return _dpIcon(
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    size
  );
}

// 关闭（✕ → X）
function iconClose(size) {
  return _dpIcon(
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    size
  );
}

// 发送（➤ → 纸飞机）
function iconSend(size) {
  return _dpIcon(
    '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    size
  );
}

// 新建（+ → 加号）
function iconNew(size) {
  return _dpIcon(
    '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    size
  );
}

// 按快捷动作 id 取图标（未知/自定义动作 → 扳手）
function iconForAction(id, size) {
  switch (id) {
    case "summarize":
      return iconSummarize(size);
    case "outline":
      return iconOutline(size);
    case "translate":
      return iconTranslate(size);
    default:
      return iconCustom(size);
  }
}
