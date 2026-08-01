// ==============================================
// DeepPage — SPA navigation patch (MAIN world)
// Injected into the page main world via content script.
// Patches history.pushState/replaceState so the
// isolated world can clean up on SPA navigation.
// ==============================================
(() => {
  if (window.__dpSpaPatched) return;
  window.__dpSpaPatched = true;

  const dispatch = () => window.dispatchEvent(new CustomEvent('dp:spa-navigate'));
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    const ret = origPush.apply(this, args);
    dispatch();
    return ret;
  };
  history.replaceState = function (...args) {
    const ret = origReplace.apply(this, args);
    dispatch();
    return ret;
  };
})();
