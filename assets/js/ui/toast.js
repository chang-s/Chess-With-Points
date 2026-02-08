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

  // Clear previous toast quickly to keep it minimal.
  if (toastTimer) window.clearTimeout(toastTimer);
  root.innerHTML = "";

  const icon = variant === "success"
    ? `<span class="inline-flex h-2 w-2 rounded-full bg-emerald-300/80 shadow-[0_0_14px_rgba(110,231,183,0.6)]"></span>`
    : variant === "error"
    ? `<span class="inline-flex h-2 w-2 rounded-full bg-rose-300/80 shadow-[0_0_14px_rgba(253,164,175,0.6)]"></span>`
    : `<span class="inline-flex h-2 w-2 rounded-full bg-cyan-200/70 shadow-[0_0_14px_rgba(165,243,252,0.55)]"></span>`;

  const toast = document.createElement("div");
  toast.className =
    "pointer-events-auto w-full max-w-md rounded-xl border border-white/12 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_60px_rgba(0,0,0,0.7)] backdrop-blur transition";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      ${icon}
      <div class="min-w-0 flex-1">
        <p class="truncate text-slate-100">${escapeHtml(message)}</p>
      </div>
    </div>
  `;

  root.appendChild(toast);

  // Animate in
  toast.animate(
    [
      { opacity: 0, transform: "translateY(-6px) scale(0.98)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: 160, easing: "cubic-bezier(.2,.9,.2,1)", fill: "both" }
  );

  toastTimer = window.setTimeout(() => {
    toast.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(-6px) scale(0.98)" },
      ],
      { duration: 180, easing: "cubic-bezier(.2,.9,.2,1)", fill: "both" }
    ).onfinish = () => {
      root.innerHTML = "";
    };
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
