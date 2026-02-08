import { RULESETS, getRulesetById } from "./data/rulesets.js";
import { openModal } from "./ui/modal.js";
import { showToast } from "./ui/toast.js";

const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");

btnCreate?.addEventListener("click", () => openCreateModal());
btnJoin?.addEventListener("click", () => openJoinModal());

function openCreateModal() {
  const content = document.createElement("div");

  const hint = document.createElement("p");
  hint.className = "text-sm text-slate-300";
  hint.textContent = "Choose a ruleset (points budget) to start a new lobby.";
  content.appendChild(hint);

  const form = document.createElement("form");
  form.className = "mt-5 space-y-4";
  form.setAttribute("novalidate", "");

  const label = document.createElement("label");
  label.className = "block text-xs font-medium uppercase tracking-wide text-slate-400";
  label.setAttribute("for", "rulesetSelect");
  label.textContent = "Ruleset / budget";

  const selectWrap = document.createElement("div");
  selectWrap.className = "relative";

  const select = document.createElement("select");
  select.id = "rulesetSelect";
  select.name = "ruleset";
  select.className =
    "w-full appearance-none rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 pr-10 text-sm text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-300/70";
  select.innerHTML = RULESETS.map(
    (r) => `<option value="${escapeAttr(r.id)}">${escapeHtml(r.label)}</option>`
  ).join("");

  const chevron = document.createElement("div");
  chevron.className = "pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400";
  chevron.innerHTML = `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const desc = document.createElement("div");
  desc.className =
    "rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-200";
  desc.id = "rulesetDesc";

  const actions = document.createElement("div");
  actions.className = "mt-6 flex items-center justify-end gap-3";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className =
    "rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60";
  cancelBtn.textContent = "Cancel";

  const continueBtn = document.createElement("button");
  continueBtn.type = "submit";
  continueBtn.className =
    "rounded-xl border border-indigo-400/25 bg-indigo-500/15 px-4 py-2.5 text-sm font-medium text-slate-100 shadow-[0_0_0_1px_rgba(99,102,241,0.12)] transition hover:bg-indigo-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70";
  continueBtn.textContent = "Continue";

  selectWrap.appendChild(select);
  selectWrap.appendChild(chevron);

  form.appendChild(label);
  form.appendChild(selectWrap);
  form.appendChild(desc);
  actions.appendChild(cancelBtn);
  actions.appendChild(continueBtn);
  form.appendChild(actions);
  content.appendChild(form);

  // Init description
  updateRulesetDesc(select.value, desc);

  select.addEventListener("change", () => {
    updateRulesetDesc(select.value, desc);
  });

  const modal = openModal({
    title: "Create game",
    content,
    initialFocusSelector: "#rulesetSelect",
  });

  cancelBtn.addEventListener("click", () => modal.close("cancel"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const chosen = getRulesetById(select.value);
    modal.close("continue");
    showToast(`Created lobby with ${chosen.label}.`, { variant: "success" });
  });
}

function openJoinModal() {
  const content = document.createElement("div");

  const hint = document.createElement("p");
  hint.className = "text-sm text-slate-300";
  hint.textContent = "Enter a game code to join an existing lobby.";
  content.appendChild(hint);

  const form = document.createElement("form");
  form.className = "mt-5 space-y-4";
  form.setAttribute("novalidate", "");

  const label = document.createElement("label");
  label.className = "block text-xs font-medium uppercase tracking-wide text-slate-400";
  label.setAttribute("for", "gameCode");
  label.textContent = "Game code";

  const input = document.createElement("input");
  input.id = "gameCode";
  input.name = "gameCode";
  input.type = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = "e.g. Q7K9";
  input.className =
    "w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none transition placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-200/60";

  const error = document.createElement("p");
  error.className = "hidden text-sm text-rose-200";
  error.id = "joinError";
  error.setAttribute("role", "alert");

  const actions = document.createElement("div");
  actions.className = "mt-6 flex items-center justify-end gap-3";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className =
    "rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60";
  cancelBtn.textContent = "Cancel";

  const joinBtn = document.createElement("button");
  joinBtn.type = "submit";
  joinBtn.className =
    "rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70";
  joinBtn.textContent = "Join";

  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(error);
  actions.appendChild(cancelBtn);
  actions.appendChild(joinBtn);
  form.appendChild(actions);

  content.appendChild(form);

  const modal = openModal({
    title: "Join game",
    content,
    initialFocusSelector: "#gameCode",
  });

  cancelBtn.addEventListener("click", () => modal.close("cancel"));

  input.addEventListener("input", () => {
    clearError(input, error);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = (input.value ?? "").trim();

    if (code.length < 4) {
      setError(input, error, "Game code must be at least 4 characters.");
      showToast("Please enter a valid game code.", { variant: "error" });
      input.focus();
      return;
    }

    modal.close("join");
    showToast(`Joining lobby: ${code}`, { variant: "success" });
  });
}

function updateRulesetDesc(id, descEl) {
  const ruleset = getRulesetById(id);
  descEl.innerHTML = `
    <div class="flex items-start gap-3">
      <span class="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-indigo-300/75 shadow-[0_0_14px_rgba(129,140,248,0.55)]"></span>
      <div>
        <p class="font-medium text-slate-100">${escapeHtml(ruleset.label)}</p>
        <p class="mt-1 text-slate-300">${escapeHtml(ruleset.description)}</p>
      </div>
    </div>
  `;
}

function setError(inputEl, errorEl, message) {
  inputEl.classList.remove("border-white/12");
  inputEl.classList.add("border-rose-300/40");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError(inputEl, errorEl) {
  inputEl.classList.remove("border-rose-300/40");
  inputEl.classList.add("border-white/12");
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`", "&#096;");
}
