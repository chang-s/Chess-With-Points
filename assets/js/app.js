import { openModal, openOverlay } from "./ui/modal.js";
import { showToast } from "./ui/toast.js";
import { PIECES, PIECE_SHEET, SPRITE_COLS, SPRITE_ROWS } from "./data/pieces.js";

const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");

btnCreate?.addEventListener("click", () => openCreateOverlay());
btnJoin?.addEventListener("click", () => openJoinModal());

/* -----------------------------
   Join modal (unchanged-ish)
------------------------------ */
function openJoinModal() {
  const content = document.createElement("div");

  const hint = el("p", "text-sm text-slate-300", "Enter a game code to join an existing lobby.");
  content.appendChild(hint);

  const form = el("form", "mt-5 space-y-4");
  form.setAttribute("novalidate", "");

  const label = el("label", "block text-xs font-medium uppercase tracking-wide text-slate-400", "Game code");
  label.setAttribute("for", "gameCode");

  const input = document.createElement("input");
  input.id = "gameCode";
  input.name = "gameCode";
  input.type = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = "e.g. Q7K9";
  input.className =
    "w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none transition placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-200/60";

  const error = el("p", "hidden text-sm text-rose-200");
  error.id = "joinError";
  error.setAttribute("role", "alert");

  const actions = el("div", "mt-6 flex items-center justify-end gap-3");
  const cancelBtn = button("Cancel", "button",
    "rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60"
  );

  const joinBtn = button("Join", "submit",
    "rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70"
  );

  actions.append(cancelBtn, joinBtn);
  form.append(label, input, error, actions);
  content.appendChild(form);

  const modal = openModal({
    title: "Join game",
    content,
    initialFocusSelector: "#gameCode",
  });

  cancelBtn.addEventListener("click", () => modal.close("cancel"));

  input.addEventListener("input", () => clearError(input, error));

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

/* -----------------------------
   Create overlay (new flow)
------------------------------ */

const POINT_TOTAL_OPTIONS = [40, 80, 120, 160, 400];
const STORAGE_KEY = "cwp_point_schemas_v1";

function openCreateOverlay() {
  const state = createState(loadSchemas(), {
    selectedSchemaId: null,
    selectedPieceId: PIECES[0].id,
  });

  // If we have schemas, select first by default.
  if (state.schemas.length > 0) state.selectedSchemaId = state.schemas[0].id;

  const content = document.createElement("div");
  content.className = "h-full";

  // Layout shell
  const grid = el(
    "div",
    "h-full grid grid-cols-12 gap-0"
  );

  const left = el(
    "aside",
    "col-span-3 border-r border-white/10 bg-white/[0.02]"
  );
  const center = el(
    "section",
    "col-span-6 border-r border-white/10"
  );
  const right = el(
    "aside",
    "col-span-3"
  );

  grid.append(left, center, right);
  content.appendChild(grid);

  // Build columns
  const leftUI = buildLeftColumn(state);
  const centerUI = buildCenterColumn(state);
  const rightUI = buildRightColumn(state);

  left.appendChild(leftUI.root);
  center.appendChild(centerUI.root);
  right.appendChild(rightUI.root);

  // Overlay instance
  const overlay = openOverlay({
    title: "Create game",
    content,
    initialFocusSelector: "#schemaCreateBtn",
    onClose: () => {
      saveSchemas(state.schemas);
    },
  });

  // Reactive re-render hooks (small + clean)
  state.onChange(() => {
    // Persist light changes (safe & simple)
    saveSchemas(state.schemas);

    leftUI.render();
    centerUI.render();
    rightUI.render();
  });

  // Wire close button support (header close already exists)
  // but we also want create army toast only
  state.actions.setOverlayClose((reason) => overlay.close(reason));
}

/* -----------------------------
   Column builders
------------------------------ */

function buildLeftColumn(state) {
  const root = el("div", "h-full flex flex-col");

  // Top controls
  const top = el("div", "p-6");
  const title = el("div", "text-xs font-medium uppercase tracking-wide text-slate-400", "Point sets");
  const row = el("div", "mt-3 flex items-center gap-3");

  const pointsLabel = el("label", "sr-only", "Total points");
  pointsLabel.setAttribute("for", "pointsTotalSelect");

  const pointsSelect = document.createElement("select");
  pointsSelect.id = "pointsTotalSelect";
  pointsSelect.className =
    "w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-300/70";
  pointsSelect.innerHTML = POINT_TOTAL_OPTIONS.map(
    (n) => `<option value="${n}">${n} points</option>`
  ).join("");

  row.append(pointsLabel, pointsSelect);

  const createBtn = button(
    "Create new",
    "button",
    "mt-4 w-full rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-emerald-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/60"
  );
  createBtn.id = "schemaCreateBtn";

  top.append(title, row, createBtn);

  // List
  const listWrap = el("div", "flex-1 overflow-auto px-4 pb-6");
  const list = el("div", "space-y-2");
  listWrap.appendChild(list);

  // Footer quick stats
  const footer = el("div", "border-t border-white/10 px-6 py-4");
  const stat = el("div", "text-sm text-slate-200");
  footer.appendChild(stat);

  root.append(top, listWrap, footer);

  function render() {
    const schema = state.getSelectedSchema();
    const total = schema?.totalPoints ?? 40;

    pointsSelect.value = String(total);
    pointsSelect.disabled = !schema;

    list.innerHTML = "";
    if (state.schemas.length === 0) {
      const empty = el(
        "div",
        "mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300",
        "No point sets yet."
      );
      list.appendChild(empty);
    } else {
      for (const s of state.schemas) {
        const active = s.id === state.selectedSchemaId;
        const item = document.createElement("button");
        item.type = "button";
        item.className =
          "w-full rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 " +
          (active
            ? "border-emerald-300/35 bg-emerald-500/10 text-slate-100 focus-visible:ring-emerald-200/60"
            : "border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.04] focus-visible:ring-cyan-200/60");

        item.innerHTML = `
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate font-medium">${escapeHtml(s.name)}</div>
              <div class="mt-0.5 text-xs text-slate-400">${s.totalPoints} points</div>
            </div>
            <span class="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-200">
              ${calcRemaining(s)} left
            </span>
          </div>
        `;

        item.addEventListener("click", () => state.actions.selectSchema(s.id));
        list.appendChild(item);
      }
    }

    if (!schema) {
      stat.textContent = "Create a point set to begin.";
      return;
    }

    const remaining = calcRemaining(schema);
    stat.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-slate-300">Remaining</span>
        <span class="font-medium ${remaining === 0 ? "text-emerald-200" : remaining < 0 ? "text-rose-200" : "text-slate-100"}">
          ${remaining}
        </span>
      </div>
    `;
  }

  // Events
  createBtn.addEventListener("click", () => {
    const newSchema = makeSchema(`New point set`, 40);
    state.actions.addSchema(newSchema);
    showToast("Created a new point set.", { variant: "success" });
  });

  pointsSelect.addEventListener("change", () => {
    const schema = state.getSelectedSchema();
    if (!schema) return;
    schema.totalPoints = Number(pointsSelect.value);
    state.actions.touch();
  });

  render();

  return { root, render };
}

function buildCenterColumn(state) {
  const root = el("div", "h-full flex flex-col");

  // Header bar
  const header = el("div", "flex items-center justify-between border-b border-white/10 px-6 py-4");
  const title = el("div", "text-sm font-medium text-slate-100", "Chess pieces");
  const subtitle = el("div", "text-xs text-slate-400", "Select a piece to edit details.");
  header.append(title, subtitle);

  // Grid area
  const body = el("div", "relative flex-1 overflow-auto p-6");
  const grid = el("div", "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4");
  body.appendChild(grid);

  // Disabled overlay
  const disabledOverlay = el(
    "div",
    "absolute inset-0 hidden items-center justify-center bg-slate-950/55 backdrop-blur-sm"
  );
  const disabledCard = el(
    "div",
    "rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-4 text-center shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
  );
  disabledCard.innerHTML = `
    <div class="mx-auto mb-2 h-2 w-2 rounded-full bg-indigo-300/80 shadow-[0_0_18px_rgba(129,140,248,0.65)]"></div>
    <div class="text-sm font-medium text-slate-100">Create a new point set</div>
    <div class="mt-1 text-xs text-slate-300">Then assign costs until you hit the total.</div>
  `;
  disabledOverlay.appendChild(disabledCard);
  body.appendChild(disabledOverlay);

  root.append(header, body);

  function render() {
    const schema = state.getSelectedSchema();
    const selectedId = state.selectedPieceId;

    disabledOverlay.classList.toggle("hidden", !!schema);
    grid.classList.toggle("opacity-40", !schema);
    grid.classList.toggle("pointer-events-none", !schema);

    grid.innerHTML = "";

    for (const p of PIECES) {
      const isSelected = p.id === selectedId;
      const cost = schema ? (schema.costs[p.id] ?? null) : null;

      const card = document.createElement("button");
      card.type = "button";
      card.className =
        "group relative rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 " +
        (isSelected
          ? "border-indigo-300/35 bg-indigo-500/10 focus-visible:ring-indigo-300/70"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] focus-visible:ring-cyan-200/60");

      // Top row: thumbnail + name/type
      const top = el("div", "flex items-start gap-3");

      const thumb = el("div", "h-14 w-14 shrink-0 rounded-xl border border-white/10 bg-white/[0.02]");
      thumb.style.backgroundImage = `url("${PIECE_SHEET}")`;
      thumb.style.backgroundRepeat = "no-repeat";
      thumb.style.backgroundSize = `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`;
      thumb.style.backgroundPosition = spritePos(p.sprite.c, p.sprite.r);

      const meta = el("div", "min-w-0 flex-1");
      meta.innerHTML = `
        <div class="truncate text-sm font-medium text-slate-100">${escapeHtml(p.name)}</div>
        <div class="mt-0.5 text-xs text-slate-400">${escapeHtml(p.type)}</div>
      `;

      top.append(thumb, meta);

      // Bottom row: icons + cost badge
      const bottom = el("div", "mt-3 flex items-center justify-between gap-3");
      const icons = el("div", "flex items-center gap-1.5 text-slate-300");
      for (const key of p.icons.slice(0, 3)) icons.appendChild(iconBadge(key));
      const costBadge = el(
        "div",
        "inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-200"
      );
      costBadge.textContent = cost == null ? "Cost: -" : `Cost: ${cost}`;

      bottom.append(icons, costBadge);

      card.append(top, bottom);

      card.addEventListener("click", () => state.actions.selectPiece(p.id));
      grid.appendChild(card);
    }
  }

  render();
  return { root, render };
}

function buildRightColumn(state) {
  const root = el("div", "h-full flex flex-col");

  const header = el("div", "border-b border-white/10 px-6 py-4");
  const heading = el("div", "text-sm font-medium text-slate-100", "Details");
  const sub = el("div", "mt-1 text-xs text-slate-400", "Adjust cost for the selected point set.");
  header.append(heading, sub);

  const body = el("div", "flex-1 overflow-auto p-6");
  const footer = el("div", "border-t border-white/10 p-6");

  const createArmyBtn = button(
    "Create army",
    "button",
    "w-full rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 " +
      "border-indigo-400/25 bg-indigo-500/15 text-slate-100 hover:bg-indigo-500/20 focus-visible:ring-indigo-300/70 disabled:cursor-not-allowed disabled:opacity-50"
  );

  footer.appendChild(createArmyBtn);
  root.append(header, body, footer);

  function render() {
    const schema = state.getSelectedSchema();
    const piece = PIECES.find((p) => p.id === state.selectedPieceId) ?? PIECES[0];

    body.innerHTML = "";

    // Top piece card
    const topCard = el("div", "rounded-2xl border border-white/10 bg-white/[0.02] p-4");
    const topRow = el("div", "flex items-start gap-4");

    const bigThumb = el("div", "h-24 w-24 shrink-0 rounded-2xl border border-white/10 bg-white/[0.02]");
    bigThumb.style.backgroundImage = `url("${PIECE_SHEET}")`;
    bigThumb.style.backgroundRepeat = "no-repeat";
    bigThumb.style.backgroundSize = `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`;
    bigThumb.style.backgroundPosition = spritePos(piece.sprite.c, piece.sprite.r);

    const meta = el("div", "min-w-0 flex-1");
    meta.innerHTML = `
      <div class="text-base font-semibold text-slate-100">${escapeHtml(piece.name)}</div>
      <div class="mt-1 text-sm text-slate-300">${escapeHtml(piece.type)}</div>
      <div class="mt-3 flex flex-wrap gap-2"></div>
    `;
    const tagWrap = meta.querySelector("div.mt-3");
    for (const key of piece.icons) tagWrap.appendChild(iconPill(key));

    topRow.append(bigThumb, meta);
    topCard.appendChild(topRow);

    // Cost editor
    const costCard = el("div", "mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4");

    if (!schema) {
      costCard.innerHTML = `
        <div class="text-sm font-medium text-slate-100">No point set selected</div>
        <div class="mt-1 text-sm text-slate-300">Create a new point set to assign costs.</div>
      `;
      createArmyBtn.disabled = true;
      body.append(topCard, costCard);
      return;
    }

    const currentCost = Number(schema.costs[piece.id] ?? 0);
    const remaining = calcRemaining(schema);

    const costLabel = el("label", "block text-xs font-medium uppercase tracking-wide text-slate-400", "Cost");
    costLabel.setAttribute("for", "costInput");

    const costInput = document.createElement("input");
    costInput.id = "costInput";
    costInput.type = "number";
    costInput.min = "0";
    costInput.step = "1";
    costInput.value = String(currentCost);
    costInput.className =
      "mt-2 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-200/60";

    const helper = el(
      "div",
      "mt-3 flex items-center justify-between text-xs"
    );
    helper.innerHTML = `
      <span class="text-slate-400">Total: <span class="text-slate-200">${schema.totalPoints}</span></span>
      <span class="${remaining === 0 ? "text-emerald-200" : remaining < 0 ? "text-rose-200" : "text-slate-200"}">
        Remaining: ${remaining}
      </span>
    `;

    const note = el("p", "mt-3 text-sm text-slate-300");
    note.textContent =
      "Tip: Assign costs until the remaining points hits 0. Then you can create the army.";

    costCard.append(costLabel, costInput, helper, note);

    // Enable Create Army only when exactly filled
    createArmyBtn.disabled = remaining !== 0;

    costInput.addEventListener("input", () => {
      const raw = Number(costInput.value);
      const next = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
      schema.costs[piece.id] = next;
      state.actions.touch();
    });

    body.append(topCard, costCard);
  }

  createArmyBtn.addEventListener("click", () => {
    const schema = state.getSelectedSchema();
    if (!schema) return;

    const remaining = calcRemaining(schema);
    if (remaining !== 0) {
      showToast("Fill the point total before creating an army.", { variant: "error" });
      return;
    }

    showToast("Army creation unlocked (hook this up next).", { variant: "success" });
  });

  render();
  return { root, render };
}

/* -----------------------------
   State + persistence
------------------------------ */

function createState(schemas, ui) {
  const listeners = new Set();
  const state = {
    schemas,
    selectedSchemaId: ui.selectedSchemaId,
    selectedPieceId: ui.selectedPieceId,
    overlayClose: null,

    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    emit() {
      for (const fn of listeners) fn();
    },

    getSelectedSchema() {
      return state.schemas.find((s) => s.id === state.selectedSchemaId) ?? null;
    },

    actions: {
      setOverlayClose(fn) {
        state.overlayClose = fn;
      },
      touch() {
        state.emit();
      },
      selectSchema(id) {
        state.selectedSchemaId = id;
        state.emit();
      },
      selectPiece(id) {
        state.selectedPieceId = id;
        state.emit();
      },
      addSchema(schema) {
        state.schemas.unshift(schema);
        state.selectedSchemaId = schema.id;
        state.emit();
      },
    },
  };

  return state;
}

function loadSchemas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s === "object")
      .map((s) => ({
        id: String(s.id ?? cryptoId()),
        name: String(s.name ?? "Point set"),
        totalPoints: Number(s.totalPoints ?? 40),
        costs: typeof s.costs === "object" && s.costs ? s.costs : {},
      }));
  } catch {
    return [];
  }
}

function saveSchemas(schemas) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemas));
  } catch {
    // ignore
  }
}

function makeSchema(name, totalPoints) {
  return {
    id: cryptoId(),
    name,
    totalPoints,
    costs: {},
  };
}

function calcRemaining(schema) {
  const total = Number(schema.totalPoints ?? 40);
  const sum = Object.values(schema.costs ?? {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
  return total - sum;
}

function cryptoId() {
  // short-ish, stable enough for demo
  return (crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`).slice(0, 8);
}

/* -----------------------------
   UI helpers
------------------------------ */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function button(label, type, className) {
  const b = document.createElement("button");
  b.type = type;
  b.className = className;
  b.textContent = label;
  return b;
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

function spritePos(c, r) {
  // background-position percent based on grid
  const x = SPRITE_COLS === 1 ? 0 : (c / (SPRITE_COLS - 1)) * 100;
  const y = SPRITE_ROWS === 1 ? 0 : (r / (SPRITE_ROWS - 1)) * 100;
  return `${x}% ${y}%`;
}

// Minimal icon system (placeholders, but clean + readable)
function iconBadge(key) {
  const span = el(
    "span",
    "inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200"
  );
  span.textContent = iconLabel(key);
  span.title = iconTitle(key);
  return span;
}

function iconPill(key) {
  const span = el(
    "span",
    "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200"
  );

  const dot = el(
    "span",
    "h-2 w-2 rounded-full bg-indigo-300/70 shadow-[0_0_14px_rgba(129,140,248,0.55)]"
  );
  const t = el("span", "font-medium", iconTitle(key));
  span.append(dot, t);
  return span;
}

function iconLabel(key) {
  const map = {
    shield: "Shield",
    swap: "Swap",
    jump: "Leap",
    line: "Line",
    diag: "Diag",
    omni: "Omni",
    crown: "Crown",
    move: "Move",
    frontcap: "Front cap",
    nocap: "No cap",
    nopromo: "No promo",
    restraint: "Restraint",
    wild: "Wild",
    range: "Range",
    curse: "Curse",
    anywhite: "Any (W)",
    anyblack: "Any (B)",
    kinglike: "King",
  };
  return map[key] ?? key;
}

function iconTitle(key) {
  const map = {
    shield: "Has shield",
    swap: "Swappable",
    jump: "Leaping movement",
    line: "Straight movement",
    diag: "Diagonal movement",
    omni: "Moves any direction",
    crown: "Royal piece",
    move: "Basic movement",
    frontcap: "Captures forward",
    nocap: "Cannot capture",
    nopromo: "No promotion",
    restraint: "Has restraint",
    wild: "Wild movement",
    range: "Extended range",
    curse: "Applies restriction",
    anywhite: "Any (White)",
    anyblack: "Any (Black)",
    kinglike: "Counts as King",
  };
  return map[key] ?? key;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
