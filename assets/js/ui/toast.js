export function toast(title, message) {
  const root = document.getElementById("toastRoot");
  if (!root) return;

  const el = document.createElement("div");
  el.className = "toast";

  const left = document.createElement("div");
  left.className = "toastMsg";
  left.innerHTML = `<strong>${escapeHtml(title)}</strong><br/>${escapeHtml(message)}`;

  const btn = document.createElement("button");
  btn.className = "iconBtn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Dismiss toast");
  btn.textContent = "✕";

  el.appendChild(left);
  el.appendChild(btn);
  root.appendChild(el);

  const t = setTimeout(() => {
    el.remove();
  }, 4200);

  btn.addEventListener("click", () => {
    clearTimeout(t);
    el.remove();
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
