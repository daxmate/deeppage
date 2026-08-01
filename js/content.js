// ==============================================
// DeepPage — Entry Point
// Styles are injected by manifest content_scripts.css (content.css)
// This file only boots up the chat panel
// ==============================================


// DeepPage 依赖 HTML innerHTML 渲染界面。XML/SVG/XHTML 等文档对 innerHTML
// 做 XML 严格解析，注入的 HTML 模板（含 <br> 等未闭合标签）会抛
// "Failed to set the 'innerHTML' ... invalid XML" SyntaxError，直接跳过。
// 注意：content script 顶层不能写 return（Illegal return statement），用 if/else。
if (document.contentType && document.contentType !== 'text/html') {
  // 非 HTML 文档：不注入
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createButton);
} else {
  createButton();
}