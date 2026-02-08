import { trapFocus } from "./focusTrap.js";

export function openModal({
  title,
  subtitle,
  contentEl,
  primaryText = "Confirm",
  secondaryText = "Cancel",
  onPrimary,
  onSecondary,
  primaryDisabled = false,
}) {
  const root = document.getElementById("modalRoot");
  if (!root) throw new Error("modalRoot not found");

  // Close any existing modal
  root.innerHTML = "";

  const overlay = document.createElement("div");
  overlay.className = "modalOverlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", title);

  const modal = document.createElement("div");
  modal.className = "modal";

  const header = document.createElement("div");
  header.className = "modalHeader";

  const headerText = document.createElement("div");
  const h = document.createElement("h2");
  h.className = "modalTitle";
  h.textContent = title;

  const sub = document.createElement("p");
  sub.className = "modalSub";
  sub.textContent = subtitle ?? "";

  headerText.appendChild(h);
  if (subtitle) headerText.appendChild(sub);

  const closeBtn = document.createElement("button");
  closeBtn.className = "iconBtn";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.textContent = "✕";

  header.appendChild(headerText);
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "modalBody";
  body.appendChild(contentEl);

  const footer = document.createElement("div");
  footer.className = "modalFooter";

  const secondary = document.createElement("button");
  secondary.className = "btn btnSecondary";
  secondary.type = "button";
  secondary.textContent = secondaryText;

  const primary = document.createElement("button");
  primary.className = "btn btnPrimary";
  primary.type = "button";
  primary.textContent = primaryText;
  primary.disabled = !!primaryDisabled;

  footer.appendChild(secondary);
  footer.appendChild(primary);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);

  overlay.appendChild(modal);
  root.appendChild(overlay);

  // Accessibility + close behaviors
  const cleanupFocus = trapFocus(modal);

  function close(reason = "dismiss") {
    cleanupFocus?.();
    root.innerHTML = "";
    document.removeEventListener("keydown", onEsc);
    if (reason === "secondary") onSecondary?.();
  }

  function onEsc(e) {
    if (e.key === "Escape") close("dismiss");
  }

  document.addEventListener("keydown", onEsc);

  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close("dismiss");
  });

  closeBtn.addEventListener("click", () => close("dismiss"));
  secondary.addEventListener("click", () => close("secondary"));
  primary.addEventListener("click", async () => {
    const shouldClose = await onPrimary?.();
    if (shouldClose !== false) close("primary");
  });

  return {
    close,
    setPrimaryDisabled(value) {
      primary.disabled = !!value;
    },
  };
}
