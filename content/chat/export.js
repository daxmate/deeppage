// ==============================================
// DeepPage — Chat / Export (md/txt/pdf/word)
// 依赖 state.js（chatHistory/pageContext/_suppressClose）
// ==============================================

function formatExportMarkdown() {
  const msgs = chatHistory.length ? chatHistory : currentMessages;
  if (!msgs.length) return "";
  const lines = [];
  lines.push(`# ${t("exportDocTitle") || "DeepPage Conversation Export"}`);
  lines.push(`> ${t("exportPageLabel") || "Page"}: ${pageContext ? pageContext.title : ""}`);
  lines.push(`> URL: ${pageContext ? pageContext.url : ""}`);
  lines.push(`> ${t("exportTimeLabel") || "Exported"}: ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  for (const msg of msgs) {
    if (msg.role === "user") {
      lines.push(`## 🧑 ${t("exportRoleUser") || "User"}`);
    } else {
      lines.push(`## 🤖 ${t("exportRoleAssistant") || "Assistant"}`);
    }
    lines.push("");
    lines.push(msg.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  return lines.join("\n");
}

function formatExportText() {
  const msgs = chatHistory.length ? chatHistory : currentMessages;
  if (!msgs.length) return "";
  const lines = [];
  lines.push(t("exportDocTitle") || "DeepPage Conversation Export");
  lines.push(`${t("exportPageLabel") || "Page"}: ${pageContext ? pageContext.title : ""}`);
  lines.push(`URL: ${pageContext ? pageContext.url : ""}`);
  lines.push(`${t("exportTimeLabel") || "Exported"}: ${new Date().toLocaleString()}`);
  lines.push("");
  for (const msg of msgs) {
    lines.push(
      `[${msg.role === "user" ? t("exportRoleUser") || "User" : t("exportRoleAssistant") || "Assistant"}]`
    );
    lines.push(markdownToPlainText(msg.content));
    lines.push("");
  }
  return lines.join("\n");
}

// ===== 导出 PDF：对话渲染成 PDF 下载（html2pdf.js 截图式） =====
async function exportPdf() {
  const msgs = chatHistory.length ? chatHistory : currentMessages;
  if (!msgs.length || typeof html2pdf === "undefined") return;

  // 构造独立的导出容器：普通文档流追加到 body（html2canvas 克隆时通过 onclone 固定到视口内）
  const wrap = document.createElement("div");
  wrap.id = "dp-export-wrap";
  wrap.style.cssText = "width:640px;background:#fff;";
  const isDark = document.getElementById("__dp-panel")?.classList.contains("__dp-dark");
  wrap.innerHTML = `
    <div style="padding:32px 36px;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;">
      <h1 style="font-size:18px;margin:0 0 4px;">${escapeHtml(
        pageContext ? pageContext.title : "DeepPage"
      )}</h1>
      <div style="font-size:12px;color:#9ca3af;margin-bottom:24px;">${escapeHtml(
        pageContext ? pageContext.url : ""
      )} · ${new Date().toLocaleString()}</div>
      ${msgs
        .map((m) => {
          const isUser = m.role === "user";
          const align = isUser ? "right" : "left";
          const bg = isUser ? "#4a6cf7" : isDark ? "#2a2b30" : "#f3f4f6";
          const color = isUser ? "#fff" : isDark ? "#e4e5e7" : "#1f2937";
          const maxW = isUser ? "80%" : "100%";
          const content = markdownToHtml(m.content || "");
          // 气泡用 block + margin auto 对齐（inline-block 内嵌块级元素 html2canvas 渲染丢文字）
          const marginAuto = isUser ? "margin-left:auto;" : "margin-right:auto;";
          return `
          <div style="margin-bottom:16px;">
            <div style="${marginAuto}max-width:${maxW};background:${bg};color:${color};border-radius:12px;padding:12px 16px;font-size:13px;line-height:1.6;word-break:break-word;text-align:left;white-space:normal;">
              ${content}
            </div>
          </div>`;
        })
        .join("")}
    </div>`;
  document.body.appendChild(wrap);
  try {
    const worker = html2pdf()
      .set({
        margin: [12, 12, 16, 12],
        filename: `${(pageContext ? pageContext.title : "deeppage")
          .replace(/[^\w\u4e00-\u9fff-]/g, "_")
          .slice(0, 50)}_deeppage.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          // 克隆文档中把导出容器固定到视口顶部（长页面下元素在视口外会导致截图内容错误）
          onclone: (clonedDoc) => {
            const el = clonedDoc.getElementById("dp-export-wrap");
            if (el) {
              el.style.position = "fixed";
              el.style.left = "0";
              el.style.top = "0";
              el.style.zIndex = "999999";
              el.style.margin = "0";
            }
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(wrap);
    await worker.save();
    toastSuccess(t("exportPdfSuccess") || "PDF exported");
  } catch (err) {
    console.error("[DeepPage] PDF 导出失败:", err);
    toastError(t("exportPdfFailed") || "PDF export failed");
  } finally {
    document.body.removeChild(wrap);
  }
}

// ===== 导出 Word：对话生成 .docx 下载（docx.js） =====
async function exportWord() {
  const msgs = chatHistory.length ? chatHistory : currentMessages;
  if (!msgs.length || typeof docx === "undefined") return;

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, ShadingType } = docx;

  // 文本 → TextRun 数组（支持换行，docx.js 的 \n 不会自动换行）
  const runs = (text, opts = {}) => {
    const lines = String(text).split("\n");
    const out = [];
    lines.forEach((line, i) => {
      if (i > 0) out.push(new TextRun({ break: 1 }));
      out.push(new TextRun({ text: line, ...opts }));
    });
    return out;
  };

  // 按 ``` 围栏切分代码块（非代码部分转纯文本，代码部分保留原文 + 等宽样式）
  const splitBlocks = (text) => {
    const parts = [];
    const re = /```[^\n]*\n([\s\S]*?)```/g;
    let last = 0,
      m;
    while ((m = re.exec(text))) {
      if (m.index > last) parts.push({ code: false, text: text.slice(last, m.index) });
      parts.push({ code: true, text: m[1].replace(/\n+$/, "") });
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ code: false, text: text.slice(last) });
    return parts;
  };

  const title = pageContext ? pageContext.title : "DeepPage";
  const meta = `${pageContext ? pageContext.url : ""} · ${new Date().toLocaleString()}`;

  const children = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] }),
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({ text: meta, color: "9ca3af", size: 18 })],
    }),
  ];

  for (const msg of msgs) {
    const isUser = msg.role === "user";
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({
            text: isUser
              ? `🧑 ${t("exportRoleUser") || "User"}`
              : `🤖 ${t("exportRoleAssistant") || "Assistant"}`,
            bold: true,
            color: isUser ? "4a6cf7" : "111827",
          }),
        ],
      })
    );
    const blocks = splitBlocks(msg.content || "");
    for (const b of blocks) {
      if (b.code) {
        children.push(
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: "f3f4f6" },
            spacing: { after: 120 },
            children: runs(b.text, { font: "Consolas", size: 18 }),
          })
        );
      } else {
        const text = markdownToPlainText(b.text);
        if (text.trim()) {
          children.push(new Paragraph({ spacing: { after: 120 }, children: runs(text) }));
        }
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = (pageContext ? pageContext.title : "deeppage")
      .replace(/[^\w\u4e00-\u9fff-]/g, "_")
      .slice(0, 50);
    a.download = `${name}_deeppage.docx`;
    document.body.appendChild(a);
    _suppressClose = true;
    a.click();
    _suppressClose = false;
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastSuccess(t("exportWordSuccess") || "Word document exported");
  } catch (err) {
    console.error("[DeepPage] Word 导出失败:", err);
    toastError(t("exportWordFailed") || "Word export failed");
  }
}

async function exportConversation(format) {
  const msgs = chatHistory.length ? chatHistory : currentMessages;
  if (!msgs.length) return;

  let content;
  if (format === "markdown") {
    content = formatExportMarkdown();
  } else if (format === "text") {
    content = formatExportText();
  }

  if (format === "pdf") {
    await exportPdf();
    return;
  }

  if (format === "word") {
    await exportWord();
    return;
  }

  if (format === "download") {
    content = formatExportMarkdown();
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const title = (pageContext ? pageContext.title : "deeppage")
      .replace(/[^\w\u4e00-\u9fff-]/g, "_")
      .slice(0, 50);
    a.download = `${title}_deeppage.md`;
    document.body.appendChild(a);
    _suppressClose = true;
    a.click();
    _suppressClose = false;
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastSuccess(t("exportMarkdownSuccess") || "Markdown downloaded");
  } else {
    try {
      await navigator.clipboard.writeText(content);
    } catch (_) {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    // 显示反馈
    toastSuccess(t("exportExported") || "Copied to clipboard");
    const btn = document.getElementById("__dp-export-btn");
    const orig = btn.innerHTML;
    const feedback = document.createElement("span");
    feedback.textContent = "✓";
    feedback.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;color:#34d399";
    btn.style.position = "relative";
    btn.appendChild(feedback);
    setTimeout(() => {
      btn.innerHTML = orig;
    }, 1200);
  }
}
