const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function trapFocus(containerEl) {
  const focusables = () => Array.from(containerEl.querySelectorAll(FOCUSABLE));
  const first = () => focusables()[0];
  const last = () => focusables()[focusables().length - 1];

  function onKeyDown(e) {
    if (e.key !== "Tab") return;

    const items = focusables();
    if (!items.length) return;

    const active = document.activeElement;
    const isShift = e.shiftKey;

    if (!isShift && active === items[items.length - 1]) {
      e.preventDefault();
      items[0].focus();
    } else if (isShift && active === items[0]) {
      e.preventDefault();
      items[items.length - 1].focus();
    }
  }

  containerEl.addEventListener("keydown", onKeyDown);
  requestAnimationFrame(() => first()?.focus());

  return () => containerEl.removeEventListener("keydown", onKeyDown);
}
