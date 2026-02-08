let toastTimer = null;

function ensureToastRoot() {
  const root = document.getElementById("toast-root");
  if (!root) {
    const el = document.createElement("div");
    el.id = "toast-root";
    el.className = "pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4";
    document.body.appendChild(el);
    return el;
  }
  return root;
}

export function showToast(message, { variant = "info", duration = 2200 } = {}) {
  const root = ensureToastRoot();

  if (toastTimer) window.clearTimeout(toastTimer);
  root.innerHTML = "";

  const dot =
    variant === "success"
      ? "bg-sky-200/80 shadow-[0_0_14px_rgba(125,211,252,0.6)]"
      : variant === "error"
      ? "bg-rose-300/80 shadow-[0_0_14px_rgba(253,164,175,0.6)]"
      : "bg-sky-200/70 shadow-[0_0_14px_rgba(125,211,252,0.55)]";

  const toast = document.createElement("div");
  toast.className =
    "pointer-events-auto w-full max-w-md rounded-xl border-2 border-white/12 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_60px_rgba(0,0,0,0.7)] backdrop-blur";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="inline-flex h-2 w-2 rounded-full ${dot}"></span>
      <p class="min-w-0 flex-1 truncate">${escapeHtml(message)}</p>
    </div>
  `;

  root.appendChild(toast);

  toast.animate(
    [
      { opacity: 0, transform: "translateY(-6px) scale(0.98)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: 160, easing: "cubic-bezier(.2,.9,.2,1)", fill: "both" }
  );

  toastTimer = window.setTimeout(() => {
    toast
      .animate(
        [
          { opacity: 1, transform: "translateY(0) scale(1)" },
          { opacity: 0, transform: "translateY(-6px) scale(0.98)" },
        ],
        { duration: 180, easing: "cubic-bezier(.2,.9,.2,1)", fill: "both" }
      )
      .addEventListener("finish", () => (root.innerHTML = ""));
    setTimeout(() => (root.innerHTML = ""), 220);
  }, duration);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
