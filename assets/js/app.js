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
  content.appendChild(el("p", "text-sm text-slate-300", "Enter a game code to join an existing lobby."));

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
    "w-full rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-sky-200/60";

  const error = el("p", "hidden text-sm text-rose-200");
  error.id = "joinError";
  error.setAttribute("role", "alert");

  const actions = el("div", "mt-6 flex items-center justify-end gap-3");

  const cancelBtn = button(
    "Cancel",
    "button",
    "rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/60"
  );

  const joinBtn = button(
    "Join",
    "submit",
    "rounded-xl border-2 border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70"
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
   Create overlay (updated)
------------------------------ */

const POINT_TOTAL_OPTIONS = [40, 80, 120, 160, 400];
const STORAGE_KEY = "cwp_point_schemas_v2";

function openCreateOverlay() {
  const state = createState(loadSchemas(), {
    selectedSchemaId: null,
    selectedPieceId: PIECES[0].id,
  });

  if (state.schemas.length > 0) state.selectedSchemaId = state.schemas[0].id;

  const content = document.createElement("div");
  content.className = "h-full";

  // Mobile-first responsive: stack columns on small screens
  const grid = el(
    "div",
    "h-full grid grid-cols-1 lg:grid-cols-12"
  );

  const left = el(
    "aside",
    "lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.02]"
  );
  const center = el(
    "section",
    "lg:col-span-6 border-b lg:border-b-0 lg:border-r border-white/10"
  );
  const right = el(
    "aside",
    "lg:col-span-3"
  );

  grid.append(left, center, right);
  content.appendChild(grid);

  const leftUI = buildLeftColumn(state);
  const centerUI = buildCenterColumn(state);
  const rightUI = buildRightColumn(state);

  left.appendChild(leftUI.root);
  center.appendChild(centerUI.root);
  right.appendChild(rightUI.root);

  const overlay = openOverlay({
    title: "Create game",
    content,
    initialFocusSelector: "#schemaCreateBtn",
    onClose: () => saveSchemas(state.schemas),
  });

  state.onChange(() => {
    saveSchemas(state.schemas);
    leftUI.render();
    centerUI.render();
    rightUI.render();
  });

  state.actions.setOverlayClose((reason) => overlay.close(reason));
}

/* -----------------------------
   Left column
------------------------------ */

function buildLeftColumn(state) {
  const root = el("div", "h-full flex flex-col");

  const top = el("div", "p-4 sm:p-6");
  const title = el("div", "text-xs font-medium uppercase tracking-wide text-slate-400", "Point sets");

  const pointsRow = el("div", "mt-3 flex items-center gap-3");
  const pointsLabel = el("label", "sr-only", "Total points");
  pointsLabel.setAttribute("for", "pointsTotalSelect");

  const pointsSelect = document.createElement("select");
  pointsSelect.id = "pointsTotalSelect";
  pointsSelect.className =
    "w-full rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition focus-visible:ring-2 focus-visible:ring-sky-200/70";
  pointsSelect.innerHTML = POINT_TOTAL_OPTIONS.map(
    (n) => `<option value="${n}">${n} points</option>`
  ).join("");

  pointsRow.append(pointsLabel, pointsSelect);

  const createBtn = button(
    "Create new",
    "button",
    "mt-4 w-full rounded-xl border-2 border-sky-300/25 bg-sky-500/12 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-sky-500/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70"
  );
  createBtn.id = "schemaCreateBtn";

  top.append(title, pointsRow, createBtn);

  const listWrap = el("div", "flex-1 overflow-auto px-3 sm:px-4 pb-4 sm:pb-6");
  const list = el("div", "space-y-2");
  listWrap.appendChild(list);

  const footer = el("div", "border-t border-white/10 px-4 sm:px-6 py-4");
  const stat = el("div", "text-sm text-slate-200");
  footer.appendChild(stat);

  root.append(top, listWrap, footer);

  function render() {
    const schema = state.getSelectedSchema();

    pointsSelect.disabled = !schema;
    if (schema) pointsSelect.value = String(schema.totalPoints);

    list.innerHTML = "";

    if (state.schemas.length === 0) {
      list.appendChild(
        el(
          "div",
          "mt-4 rounded-xl border-2 border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300",
          "No point sets yet."
        )
      );
    } else {
      for (const s of state.schemas) {
        const active = s.id === state.selectedSchemaId;
        const remaining = calcRemaining(s);
        const over = remaining < 0;

        const row = el(
          "div",
          "group w-full rounded-xl border-2 px-3 py-2.5 transition " +
            (active
              ? "border-sky-200/35 bg-sky-500/10"
              : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]")
        );

        const topRow = el("div", "flex items-center justify-between gap-2");
        const leftSide = el("div", "min-w-0 flex items-center gap-2");

        // Name display + edit input
        const nameWrap = el("div", "min-w-0");
        const nameText = el("div", "truncate text-sm font-medium text-slate-100");
        nameText.textContent = s.name;

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = s.name;
        nameInput.className =
          "hidden w-full max-w-[220px] rounded-lg border-2 border-white/12 bg-white/[0.03] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-200/60";

        nameWrap.append(nameText, nameInput);

        // Remaining badge + warning
        const badge = el(
          "div",
          "inline-flex items-center gap-2 rounded-lg border-2 border-white/10 bg-white/[0.03] px-2 py-1 text-xs"
        );
        const dot = el(
          "span",
          "inline-flex h-2 w-2 rounded-full " +
            (remaining === 0
              ? "bg-sky-200/80 shadow-[0_0_14px_rgba(125,211,252,0.6)]"
              : over
              ? "bg-rose-300/80 shadow-[0_0_14px_rgba(253,164,175,0.55)]"
              : "bg-white/30")
        );

        const warn = over
          ? `<span class="cwp-tooltip" data-tip="Over budget" aria-label="Over budget">⚠️</span>`
          : "";

        badge.innerHTML = `${warn}<span class="inline-flex items-center gap-2">${dot.outerHTML}<span>${remaining} left</span></span>`;

        // Actions: rename, duplicate, delete
        const actions = el("div", "flex items-center gap-1");

        const renameBtn = iconButton("Rename", pencilIcon(), "focus-visible:ring-sky-200/70");
        const dupBtn = iconButton("Duplicate", duplicateIcon(), "focus-visible:ring-sky-200/70");
        const delBtn = iconButton("Delete", trashIcon(), "focus-visible:ring-rose-200/60");

        // Editing state local to row
        let editing = false;

        function setEditing(next) {
          editing = next;
          nameText.classList.toggle("hidden", editing);
          nameInput.classList.toggle("hidden", !editing);

          renameBtn.innerHTML = editing ? checkIcon() : pencilIcon();
          renameBtn.setAttribute("aria-label", editing ? "Save name" : "Rename");

          if (editing) {
            nameInput.focus();
            nameInput.select();
          }
        }

        renameBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!editing) {
            setEditing(true);
            return;
          }
          const val = (nameInput.value ?? "").trim() || "Point set";
          s.name = val;
          setEditing(false);
          state.actions.touch();
        });

        nameInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            renameBtn.click();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            nameInput.value = s.name;
            setEditing(false);
          }
        });

        dupBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const copy = duplicateSchema(s);
          state.actions.addSchema(copy);
          showToast("Duplicated point set.", { variant: "success" });
        });

        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const ok = confirm(`Delete "${s.name}"?`);
          if (!ok) return;
          state.actions.deleteSchema(s.id);
          showToast("Deleted point set.", { variant: "info" });
        });

        actions.append(renameBtn, dupBtn, delBtn);

        leftSide.append(nameWrap);
        topRow.append(leftSide, actions);

        const bottomRow = el("div", "mt-2 flex items-center justify-between");
        const small = el("div", "text-xs text-slate-400", `${s.totalPoints} points`);
        bottomRow.append(small, badge);

        row.append(topRow, bottomRow);

        row.addEventListener("click", () => state.actions.selectSchema(s.id));

        // Keyboard accessibility: allow enter to select schema when focusing row
        row.tabIndex = 0;
        row.classList.add("focus:outline-none", "focus-visible:ring-2", "focus-visible:ring-sky-200/60");
        row.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            state.actions.selectSchema(s.id);
          }
        });

        list.appendChild(row);
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
        <span class="font-medium ${remaining === 0 ? "text-sky-200" : remaining < 0 ? "text-rose-200" : "text-slate-100"}">
          ${remaining}
        </span>
      </div>
    `;
  }

  createBtn.addEventListener("click", () => {
    const newSchema = makeSchema("New point set", 40);
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

/* -----------------------------
   Center column (responsive + scroll)
------------------------------ */

function buildCenterColumn(state) {
  const root = el("div", "h-full flex flex-col");

  const header = el(
    "div",
    "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 px-4 sm:px-6 py-4"
  );
  header.append(
    el("div", "text-sm font-medium text-slate-100", "Chess pieces"),
    el("div", "text-xs text-slate-400", "Pick a piece to edit cost.")
  );

  const body = el("div", "relative flex-1 overflow-auto p-4 sm:p-6");

  // Mobile-first: more columns as space grows, cards shrink nicely
  const grid = el(
    "div",
    "grid gap-3 " +
      "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
  );
  body.appendChild(grid);

  const disabledOverlay = el(
    "div",
    "absolute inset-0 hidden items-center justify-center bg-slate-950/55 backdrop-blur-sm"
  );
  const disabledCard = el(
    "div",
    "rounded-2xl border-2 border-white/12 bg-white/[0.03] px-5 py-4 text-center shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
  );
  disabledCard.innerHTML = `
    <div class="mx-auto mb-2 h-2 w-2 rounded-full bg-sky-200/80 shadow-[0_0_18px_rgba(125,211,252,0.65)]"></div>
    <div class="text-sm font-medium text-slate-100">Create a new point set</div>
    <div class="mt-1 text-xs text-slate-300">Then assign costs until Remaining hits 0.</div>
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
        "group relative rounded-2xl border-2 p-3 text-left transition focus:outline-none focus-visible:ring-2 " +
        (isSelected
          ? "border-sky-200/35 bg-sky-500/10 focus-visible:ring-sky-200/70"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] focus-visible:ring-sky-200/60");

      const top = el("div", "flex items-start gap-3");

      const thumb = el("div", "h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-xl border-2 border-white/10 bg-white/[0.02]");
      thumb.style.backgroundImage = `url("${PIECE_SHEET}")`;
      thumb.style.backgroundRepeat = "no-repeat";
      thumb.style.backgroundSize = `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`;
      thumb.style.backgroundPosition = spritePos(p.sprite.c, p.sprite.r);

      const meta = el("div", "min-w-0 flex-1");
      const typeIcon = p.type === "Noble" ? "👑" : "🧑";
      const typeTip = p.type;

      meta.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-slate-100">${escapeHtml(p.name)}</div>
          </div>
          <span
            class="cwp-tooltip"
            data-tip="${escapeHtml(typeTip)}"
            aria-label="${escapeHtml(typeTip)}"
          >${typeIcon}</span>
        </div>
      `;

      top.append(thumb, meta);

      const bottom = el("div", "mt-3 flex items-center justify-end");
      const costBadge = el(
        "div",
        "inline-flex items-center rounded-lg border-2 border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-200"
      );
      costBadge.textContent = cost == null ? "Cost: -" : `Cost: ${cost}`;
      bottom.appendChild(costBadge);

      card.append(top, bottom);

      card.addEventListener("click", () => state.actions.selectPiece(p.id));
      grid.appendChild(card);
    }
  }

  render();
  return { root, render };
}

/* -----------------------------
   Right column (cost input shorter, Remaining left)
------------------------------ */

function buildRightColumn(state) {
  const root = el("div", "h-full flex flex-col");

  const header = el("div", "border-b border-white/10 px-4 sm:px-6 py-4");
  header.append(
    el("div", "text-sm font-medium text-slate-100", "Details"),
    el("div", "mt-1 text-xs text-slate-400", "Set cost for the selected point set.")
  );

  const body = el("div", "flex-1 overflow-auto p-4 sm:p-6");
  const footer = el("div", "border-t border-white/10 p-4 sm:p-6");

  const createArmyBtn = button(
    "Create army",
    "button",
    "w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 " +
      "border-sky-300/25 bg-sky-500/15 text-slate-100 hover:bg-sky-500/20 focus-visible:ring-sky-200/70 disabled:cursor-not-allowed disabled:opacity-50"
  );

  footer.appendChild(createArmyBtn);
  root.append(header, body, footer);

  function render() {
    const schema = state.getSelectedSchema();
    const piece = PIECES.find((p) => p.id === state.selectedPieceId) ?? PIECES[0];

    body.innerHTML = "";

    const topCard = el("div", "rounded-2xl border-2 border-white/10 bg-white/[0.02] p-4");
    const topRow = el("div", "flex items-start gap-4");

    const bigThumb = el("div", "h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl border-2 border-white/10 bg-white/[0.02]");
    bigThumb.style.backgroundImage = `url("${PIECE_SHEET}")`;
    bigThumb.style.backgroundRepeat = "no-repeat";
    bigThumb.style.backgroundSize = `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`;
    bigThumb.style.backgroundPosition = spritePos(piece.sprite.c, piece.sprite.r);

    const typeIcon = piece.type === "Noble" ? "👑" : "🧑";
    const meta = el("div", "min-w-0 flex-1");
    meta.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-base font-semibold text-slate-100">${escapeHtml(piece.name)}</div>
          <div class="mt-1 text-sm text-slate-300">${escapeHtml(piece.type)}</div>
        </div>
        <span class="cwp-tooltip" data-tip="${escapeHtml(piece.type)}" aria-label="${escapeHtml(piece.type)}">${typeIcon}</span>
      </div>
      <div class="mt-3 text-xs text-slate-400">Use the cost field below. Remaining updates live.</div>
    `;

    topRow.append(bigThumb, meta);
    topCard.appendChild(topRow);

    const costCard = el("div", "mt-4 rounded-2xl border-2 border-white/10 bg-white/[0.02] p-4");

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
    const over = remaining < 0;

    // Remaining (left) + small cost input (right)
    const row = el("div", "flex items-center justify-between gap-4");

    const remainingBox = el(
      "div",
      "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm " +
        (remaining === 0
          ? "border-sky-200/35 bg-sky-500/10 text-sky-100"
          : over
          ? "border-rose-300/25 bg-rose-500/10 text-rose-100"
          : "border-white/10 bg-white/[0.02] text-slate-100")
    );
    remainingBox.innerHTML = `
      <span class="text-slate-300">Remaining</span>
      <span class="font-semibold">${remaining}</span>
      ${over ? `<span class="cwp-tooltip" data-tip="Over budget" aria-label="Over budget">⚠️</span>` : ""}
    `;

    const costWrap = el("div", "flex items-center gap-2");
    const costLabel = el("label", "text-xs font-medium uppercase tracking-wide text-slate-400", "Cost");
    costLabel.setAttribute("for", "costInput");

    const costInput = document.createElement("input");
    costInput.id = "costInput";
    costInput.type = "number";
    costInput.min = "0";
    costInput.step = "1";
    costInput.inputMode = "numeric";
    costInput.value = String(currentCost);
    costInput.className =
      "w-[88px] rounded-xl border-2 border-white/12 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none transition focus-visible:ring-2 focus-visible:ring-sky-200/60";

    costWrap.append(costLabel, costInput);

    const note = el("p", "mt-3 text-sm text-slate-300");
    note.textContent = "When Remaining hits 0, Create army becomes available.";

    row.append(remainingBox, costWrap);
    costCard.append(row, note);

    createArmyBtn.disabled = remaining !== 0;

    costInput.addEventListener("input", () => {
      const cursorStart = costInput.selectionStart;
      const cursorEnd = costInput.selectionEnd;
      const raw = Number(costInput.value);
      const next = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
      schema.costs[piece.id] = next;
      state.actions.touch();

      // Keep typing flow smooth even after full re-render.
      const nextInput = document.getElementById("costInput");
      if (nextInput) {
        nextInput.focus();
        if (cursorStart != null && cursorEnd != null) {
          nextInput.setSelectionRange(cursorStart, cursorEnd);
        }
      }
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

    showToast("Create Army: ready for the next step.", { variant: "success" });
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
      deleteSchema(id) {
        const idx = state.schemas.findIndex((s) => s.id === id);
        if (idx === -1) return;
        state.schemas.splice(idx, 1);

        if (state.selectedSchemaId === id) {
          state.selectedSchemaId = state.schemas[0]?.id ?? null;
        }
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
    return parsed.map((s) => ({
      id: String(s.id ?? cryptoId()),
      name: String(s.name ?? "Point set"),
      totalPoints: Number(s.totalPoints ?? 40),
      costs: (s.costs && typeof s.costs === "object") ? s.costs : {},
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
  return { id: cryptoId(), name, totalPoints, costs: {} };
}

function duplicateSchema(schema) {
  return {
    id: cryptoId(),
    name: `${schema.name} (copy)`,
    totalPoints: schema.totalPoints,
    costs: { ...(schema.costs ?? {}) },
  };
}

function calcRemaining(schema) {
  const total = Number(schema.totalPoints ?? 40);
  const sum = Object.values(schema.costs ?? {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
  return total - sum;
}

function cryptoId() {
  return (crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`).slice(0, 8);
}

/* -----------------------------
   DOM helpers
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

function iconButton(label, svg, ringClass) {
  const b = document.createElement("button");
  b.type = "button";
  b.className =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 " +
    ringClass;
  b.setAttribute("aria-label", label);
  b.innerHTML = svg;
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
  const x = SPRITE_COLS === 1 ? 0 : (c / (SPRITE_COLS - 1)) * 100;
  const y = SPRITE_ROWS === 1 ? 0 : (r / (SPRITE_ROWS - 1)) * 100;
  return `${x}% ${y}%`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -----------------------------
   Icons (tiny, clean)
------------------------------ */

function pencilIcon() {
  return `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `;
}

function checkIcon() {
  return `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function duplicateIcon() {
  return `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 8h12v12H8V8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M4 16V4h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
}

function trashIcon() {
  return `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M6 7l1 14h10l1-14" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M9 7V4h6v3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `;
}
