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

export function openModal({ title, content, initialFocusSelector, onClose }) {
  return openDialog({ variant: "modal", title, content, initialFocusSelector, onClose });
}

export function openOverlay({ title, content, initialFocusSelector, onClose }) {
  return openDialog({ variant: "overlay", title, content, initialFocusSelector, onClose });
}

function openDialog({ variant, title, content, initialFocusSelector, onClose }) {
  const root = ensureModalRoot();
  const previouslyFocused = document.activeElement;

  const backdrop = document.createElement("div");
  backdrop.className = "fixed inset-0 z-40 bg-black/55 backdrop-blur-sm";
  backdrop.setAttribute("aria-hidden", "true");

  const shell = document.createElement("div");
  shell.className = variant === "overlay"
    ? "fixed inset-0 z-50 flex"
    : "fixed inset-0 z-50 flex items-center justify-center px-4 py-8";

  const dialog = document.createElement("div");
  dialog.tabIndex = -1;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", title);

  if (variant === "overlay") {
    dialog.className =
      "relative m-0 h-full w-full border-2 border-white/10 bg-slate-950/75 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_120px_rgba(0,0,0,0.8)] backdrop-blur";
  } else {
    dialog.className =
      "relative w-full max-w-lg rounded-2xl border-2 border-white/12 bg-slate-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_120px_rgba(0,0,0,0.8)] backdrop-blur";
  }

  const header = document.createElement("div");
  header.className = "flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4";

  const titleEl = document.createElement("h2");
  titleEl.className = "text-base font-semibold tracking-tight text-slate-100";
  titleEl.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/60";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.innerHTML = `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  const body = document.createElement("div");
  body.className = variant === "overlay"
    ? "h-[calc(100%-57px)] px-0 py-0"
    : "px-6 py-5";
  body.appendChild(content);

  header.append(titleEl, closeBtn);
  dialog.append(header, body);

  root.appendChild(backdrop);
  shell.appendChild(dialog);
  root.appendChild(shell);

  const trap = createFocusTrap(dialog);
  trap.activate();

  function onEsc(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close("escape");
    }
  }

  function close(reason = "close") {
    trap.deactivate();
    window.removeEventListener("keydown", onEsc, true);

    const a = backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 140,
      easing: "cubic-bezier(.2,.9,.2,1)",
      fill: "both",
    });
    const b = dialog.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(6px) scale(0.99)" },
      ],
      { duration: 140, easing: "cubic-bezier(.2,.9,.2,1)", fill: "both" }
    );

    Promise.allSettled([a.finished, b.finished]).finally(() => {
      shell.remove();
      backdrop.remove();
      if (typeof onClose === "function") onClose(reason);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
    });
  }

  backdrop.addEventListener("mousedown", () => close("backdrop"));
  closeBtn.addEventListener("click", () => close("button"));
  window.addEventListener("keydown", onEsc, true);

  backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 160,
    easing: "cubic-bezier(.2,.9,.2,1)",
    fill: "both",
  });
  dialog.animate(
    [
      { opacity: 0, transform: "translateY(10px) scale(0.985)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: 180, easing: "cubic-bezier(.2,.9,.2,1)", fill: "both" }
  );

  queueMicrotask(() => {
    const initial = initialFocusSelector ? dialog.querySelector(initialFocusSelector) : null;
    if (initial && typeof initial.focus === "function") initial.focus();
    else trap.focusFirst();
  });

  return { close, dialog, backdrop };
}
