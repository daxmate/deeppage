// ==============================================
// DeepPage — Toast feedback helper（SweetAlert2 toast）
// 依赖:lib/sweetalert2.all.min.js（全局 Sweetalert2）
// 说明:toast 文案走 i18n(t())，颜色与旧自绘反馈保持一致
//      成功=绿色 / 失败=红色 / 信息=蓝色
// ==============================================

const Toast = Sweetalert2.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1800,
  timerProgressBar: false,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Sweetalert2.stopTimer);
    toast.addEventListener("mouseleave", Sweetalert2.resumeTimer);
  },
});

// 通用 toast 入口
// type: success | error | info
function showToast(type, title) {
  const config = {
    success: { icon: "success", background: "#e8f5e9", color: "#2e7d32" },
    error: { icon: "error", background: "#fdecea", color: "#c62828" },
    info: { icon: "info", background: "#e8f0fe", color: "#1a56db" },
  }[type] || { icon: "info", background: "#e8f0fe", color: "#1a56db" };
  Toast.fire({ ...config, title });
}

// 便捷封装:成功/失败/信息
function toastSuccess(msg) {
  showToast("success", msg);
}
function toastError(msg) {
  showToast("error", msg);
}
function toastInfo(msg) {
  showToast("info", msg);
}
