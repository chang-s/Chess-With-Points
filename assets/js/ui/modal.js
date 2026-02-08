import { createFocusTrap } from "./focusTrap.js";

function ensureModalRoot() {
  const root = document.getElementById("modal-root");
  if (!root) {
    const el = document.createElement("div");
    el.id = "modal-root";
    document.body.appendChild(el);
    return el;
  }
  return root;
}

/**
 * Creates and opens a modal.
 * - closes on Escape
 * - closes on backdrop click
 * - traps focus
 * - restores focus to opener on close
 */
export function openModal({
  title,
  content, // HTMLElement
  initialFocusSelector,
  onClose,
}) {
  const root = ensureModalRoot();
  const previouslyFocused = document.activeElement;

  const backdrop = document.createElement("div");
  backdrop.className =
    "fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm";

  const dialog = document.createElement("div");
  dialog.className =
    "relative z-50 w-full max-w-lg rounded-2xl border border-white/12 bg-slate-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_120px_rgba(0,0,0,0.8)] backdrop-blur";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", title);

  // Make container focusable for safety
  dialog.tabIndex = -1;

  const header = document.createElement("div");
  header.className = "flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5";

  const titleEl = document.createElement("h2");
  titleEl.className = "text-base font-semibold tracking-tight text-slate-100";
  titleEl.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.innerHTML = `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  const body = document.createElement("div");
  body.className = "px-6 py-5";
  body.appendChild(content);

  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  dialog.appendChild(header);
  dialog.appendChild(body);
  backdrop.appendChild(dialog);
  root.appendChild(backdrop);

  // Subtle "glow" edge
  const glow = document.createElement("div");
  glow.className =
    "pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-indigo-400/15 via-transparent to-cyan-300/10 opacity-80";
  dialog.appendChild(glow);

  const trap = createFocusTrap(dialog);
  trap.activate();

  function close(reason = "close") {
    trap.deactivate();

    // Animate out quickly
    backdrop.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 140, easing: "cubic-bezier(.2,.9,.2,1)", fill: "both" }
    ).onfinish = () => {
      backdrop.remove();
      if (typeof onClose === "function") onClose(reason);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };

    window.removeEventListener("keydown", onEsc, true);
  }

  function onEsc(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close("escape");
    }
  }

  // Close on backdrop click only (not dialog click)
  backdrop.addEventListener("mousedown", (e) => {
    if (e.target === backdrop) close("backdrop");
  });

  closeBtn.addEventListener("click", () => close("button"));

  window.addEventListener("keydown", onEsc, true);

  // Animate in
  backdrop.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 160, easing: "cubic-bezier(.2,.9,.2,1)", fill: "both" }
  );
  dialog.animate(
    [
      { opacity: 0, transform: "translateY(10px) scale(0.98)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: 180, easing: "cubic-bezier(.2,.9,.2,1)", fill: "both" }
  );

  // Focus management
  queueMicrotask(() => {
    const initial = initialFocusSelector
      ? dialog.querySelector(initialFocusSelector)
      : null;

    if (initial && typeof initial.focus === "function") initial.focus();
    else trap.focusFirst();
  });

  return { close, dialog, backdrop };
}
