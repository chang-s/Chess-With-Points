import { openModal } from "./ui/modal.js";
import { showToast } from "./ui/toast.js";
import { PIECES as SPRITE_PIECES, PIECE_SHEET, SPRITE_COLS, SPRITE_ROWS } from "./data/pieces.js";

const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");

const PIECES_DATA_URL = new URL("../../../data/pieces.json", import.meta.url);

let PIECES_DATASET = [];
let PIECE_BY_ID = new Map();

const SPRITE_BY_ID = new Map(SPRITE_PIECES.map((p) => [p.id, p.sprite]));

initApp();

async function initApp() {
  PIECES_DATASET = await loadPiecesDataset();
  PIECE_BY_ID = new Map(PIECES_DATASET.map((p) => [p.id, p]));

  btnCreate?.addEventListener("click", () => openCreateOverlay());
  btnJoin?.addEventListener("click", () => openJoinModal());
}

async function loadPiecesDataset() {
  try {
    const raw = await loadPiecesDatasetRaw();
    if (!Array.isArray(raw)) throw new Error("Invalid pieces dataset format");

    return raw
      .map(normalizePiece)
      .filter((piece) => piece && piece.id);
  } catch (error) {
    console.error("Unable to load /data/pieces.json", error);
    showToast("Failed to load pieces data.", { variant: "error" });
    return [];
  }
}

async function loadPiecesDatasetRaw() {
  // file:// blocks fetch() in many browsers, so use the JSON module fallback.
  if (window.location.protocol === "file:") {
    const jsonModule = await importPiecesJsonModule();
    return jsonModule?.default ?? jsonModule;
  }

  const response = await fetch(PIECES_DATA_URL);
  if (!response.ok) throw new Error(`Failed to load pieces (${response.status})`);
  return response.json();
}

async function importPiecesJsonModule() {
  const path = "../../../data/pieces.json";

  try {
    return await import(path, { with: { type: "json" } });
  } catch (firstError) {
    return await import(path, { assert: { type: "json" } });
  }
}

function normalizePiece(raw) {
  return {
    ...raw,
    id: String(raw?.id ?? "").trim(),
    name: String(raw?.name ?? "").trim(),
    sourcePiece: String(raw?.sourcePiece ?? "").trim(),
    ranks: Array.isArray(raw?.ranks) ? raw.ranks.map((x) => String(x).toLowerCase()) : [],
    abilities: Array.isArray(raw?.abilities) ? raw.abilities.map((x) => String(x).toLowerCase()) : [],
    description: typeof raw?.description === "string" ? raw.description.trim() : "",
    moveRules: typeof raw?.moveRules === "string" ? raw.moveRules.trim() : "",
  };
}

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
const SCHEMAS_PER_PAGE = 6;
const STORAGE_KEY = "cwp_point_schemas_v2";

function openCreateOverlay() {
  if (PIECES_DATASET.length === 0) {
    showToast("No pieces data available.", { variant: "error" });
    return;
  }

  const state = createState(loadSchemas(), {
    selectedSchemaId: null,
    selectedPieceId: PIECES_DATASET[0]?.id ?? null,
    schemaPage: 1,
    pieceSearch: "",
    pieceFilters: { types: [], bases: [] },
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
    "min-h-0 lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.02]"
  );
  const center = el(
    "section",
    "min-h-0 lg:col-span-6 border-b lg:border-b-0 lg:border-r border-white/10"
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

  const page = openCreatePage({
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

  state.actions.setOverlayClose((reason) => page.close(reason));
}

function openCreatePage({ title, content, initialFocusSelector, onClose }) {
  const previouslyFocused = document.activeElement;
  const lobbyMain = document.querySelector("main");
  let closing = false;

  const page = el(
    "section",
    "fixed inset-0 z-40 bg-slate-950 text-slate-100 opacity-0 translate-y-2 scale-[0.995] transition-all duration-300 ease-out"
  );

  const header = el("div", "relative border-b border-white/10 px-4 sm:px-6 py-4");
  const titleEl = el("h2", "text-center text-lg sm:text-xl font-semibold tracking-wide text-sky-100", "Point Distribution");
  const closeBtn = iconButton("Back", backIcon(), "focus-visible:ring-sky-200/60");
  closeBtn.className += " absolute left-4 sm:left-6 top-1/2 -translate-y-1/2";

  const body = el("div", "h-[calc(100%-65px)]");
  body.appendChild(content);

  header.append(titleEl, closeBtn);
  page.append(header, body);

  lobbyMain?.classList.add("hidden");
  document.body.style.overflow = "hidden";
  document.body.appendChild(page);

  function finalizeClose(reason) {
    page.remove();
    lobbyMain?.classList.remove("hidden");
    document.body.style.overflow = "";
    window.removeEventListener("keydown", onEsc, true);
    if (typeof onClose === "function") onClose(reason);
    if (previouslyFocused && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
  }

  function close(reason = "back") {
    if (closing) return;
    closing = true;
    page.classList.add("opacity-0", "translate-y-2", "scale-[0.995]");
    page.classList.remove("opacity-100", "translate-y-0", "scale-100");
    window.setTimeout(() => finalizeClose(reason), 260);
  }

  function onEsc(e) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    close("escape");
  }

  closeBtn.addEventListener("click", () => close("button"));
  window.addEventListener("keydown", onEsc, true);

  requestAnimationFrame(() => {
    page.classList.remove("opacity-0", "translate-y-2", "scale-[0.995]");
    page.classList.add("opacity-100", "translate-y-0", "scale-100");
  });

  queueMicrotask(() => {
    const initial = initialFocusSelector ? page.querySelector(initialFocusSelector) : null;
    if (initial && typeof initial.focus === "function") initial.focus();
  });

  return { close, page };
}

/* -----------------------------
   Left column
------------------------------ */

function buildLeftColumn(state) {
  const root = el("div", "h-full min-h-0 flex flex-col");

  const top = el("div", "p-4 sm:p-6");
  const title = el("div", "text-xs font-medium uppercase tracking-wide text-slate-400", "Point sets");

  const pointsRow = el("div", "mt-3 flex items-center gap-3");
  const pointsLabel = el("label", "sr-only", "Total points");
  pointsLabel.setAttribute("for", "pointsTotalSelect");

  const pointsSelect = document.createElement("select");
  pointsSelect.id = "pointsTotalSelect";
  pointsSelect.className =
    "w-full rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 pr-11 py-3 text-sm text-slate-100 outline-none transition focus-visible:ring-2 focus-visible:ring-sky-200/70";
  pointsSelect.style.colorScheme = "dark";
  pointsSelect.innerHTML = POINT_TOTAL_OPTIONS.map(
    (n) => `<option value="${n}" style="background:#020617;color:#e2e8f0;">${n} points</option>`
  ).join("");

  pointsRow.append(pointsLabel, pointsSelect);

  const createBtn = button(
    "Create new",
    "button",
    "mt-4 w-full rounded-xl border-2 border-sky-200/45 bg-sky-500/35 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-sky-500/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70"
  );
  createBtn.id = "schemaCreateBtn";

  top.append(title, pointsRow, createBtn);

  const listWrap = el("div", "flex-1 overflow-auto px-3 sm:px-4 pb-4 sm:pb-6");
  const list = el("div", "space-y-2");
  listWrap.appendChild(list);

  const pagerWrap = el("div", "hidden border-t border-white/10 px-3 sm:px-4 py-3");
  const pager = el("div", "flex items-center justify-center gap-1.5");
  pagerWrap.appendChild(pager);

  const footer = el("div", "border-t border-white/10 px-4 sm:px-6 py-4");
  const stat = el("div", "text-sm text-slate-200");
  footer.appendChild(stat);

  root.append(top, listWrap, pagerWrap, footer);

  function render() {
    const schema = state.getSelectedSchema();

    pointsSelect.disabled = !schema;
    if (schema) pointsSelect.value = String(schema.totalPoints);

    list.innerHTML = "";

    const totalPages = Math.max(1, Math.ceil(state.schemas.length / SCHEMAS_PER_PAGE));
    state.schemaPage = clamp(state.schemaPage ?? 1, 1, totalPages);
    const start = (state.schemaPage - 1) * SCHEMAS_PER_PAGE;
    const visibleSchemas = state.schemas.slice(start, start + SCHEMAS_PER_PAGE);

    if (state.schemas.length === 0) {
      list.appendChild(
        el(
          "div",
          "mt-4 rounded-xl border-2 border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300",
          "No point sets yet."
        )
      );
    } else {
      for (const s of visibleSchemas) {
        const active = s.id === state.selectedSchemaId;
        const remaining = calcRemaining(s);
        const over = remaining < -0.001;

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

        badge.innerHTML = `${warn}<span class="inline-flex items-center gap-2">${dot.outerHTML}<span>${formatPoints(remaining)} left</span></span>`;

        // Actions: rename, duplicate, delete
        const actions = el("div", "flex items-center gap-1");

        const renameBtn = iconButton("Rename", pencilIcon(), "focus-visible:ring-sky-200/70");
        const dupBtn = iconButton("Duplicate", duplicateIcon(), "focus-visible:ring-sky-200/70");
        const delBtn = iconButton("Delete", trashIcon(), "focus-visible:ring-rose-200/60");
        setTooltip(renameBtn, "Rename");
        setTooltip(dupBtn, "Duplicate");
        setTooltip(delBtn, "Delete");

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
          openDeleteConfirmModal({
            onConfirm: () => {
              state.actions.deleteSchema(s.id);
              showToast("Deleted point set.", { variant: "info" });
            },
          });
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

    pagerWrap.classList.toggle("hidden", totalPages <= 1);
    pager.innerHTML = "";

    if (totalPages > 1) {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const active = pageNum === state.schemaPage;
        const pageBtn = pageButton(String(pageNum), false, active);
        pageBtn.addEventListener("click", () => state.actions.setSchemaPage(pageNum));
        pager.appendChild(pageBtn);
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
          ${formatPoints(remaining)}
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
  const root = el("div", "h-full min-h-0 flex flex-col");

  const header = el(
    "div",
    "border-b border-white/10 px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  );
  const headerLeft = el("div", "min-w-0");
  headerLeft.append(
    el("div", "text-sm font-medium text-slate-100", "Chess pieces"),
    el("div", "mt-1 text-xs text-slate-400", "Pick a piece to edit cost.")
  );

  const headerRight = el("div", "w-full sm:w-auto flex items-center justify-end gap-2");
  const searchWrap = el("div", "relative w-full sm:w-[220px]");
  const searchInput = document.createElement("input");
  searchInput.id = "pieceSearchInput";
  searchInput.type = "text";
  searchInput.placeholder = "Search name or type";
  searchInput.autocomplete = "off";
  searchInput.className =
    "w-full rounded-xl border-2 border-white/12 bg-white/[0.03] pl-9 pr-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-sky-200/60";

  const searchIcon = el(
    "span",
    "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400",
    "🔎"
  );
  searchWrap.append(searchIcon, searchInput);

  const filterBtn = iconButton("Filters", filterIcon(), "focus-visible:ring-sky-200/60");
  filterBtn.id = "pieceFilterBtn";
  setTooltip(filterBtn, "Filter pieces");

  headerRight.append(searchWrap, filterBtn);
  header.append(headerLeft, headerRight);

  const body = el("div", "relative min-h-0 flex-1 overflow-auto p-4 sm:p-6");

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
    const searchQuery = (state.pieceSearch ?? "").trim().toLowerCase();
    const activeTypeFilters = new Set((state.pieceFilters?.types ?? []).map((v) => String(v).toLowerCase()));
    const activeBaseFilters = new Set((state.pieceFilters?.bases ?? []).map((v) => String(v).toLowerCase()));
    const hasActiveFilters = activeTypeFilters.size > 0 || activeBaseFilters.size > 0;

    const hasSchema = !!schema;
    disabledOverlay.classList.toggle("hidden", hasSchema);
    grid.classList.toggle("opacity-40", !hasSchema);
    grid.classList.toggle("pointer-events-none", !hasSchema);
    body.classList.toggle("overflow-hidden", !hasSchema);
    body.classList.toggle("overflow-auto", hasSchema);

    searchInput.disabled = !hasSchema;
    searchInput.classList.toggle("opacity-35", !hasSchema);
    searchInput.classList.toggle("cursor-not-allowed", !hasSchema);
    searchInput.classList.toggle("text-slate-500", !hasSchema);

    filterBtn.disabled = !hasSchema;

    searchInput.value = state.pieceSearch ?? "";
    filterBtn.className =
      "inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/60 " +
      (!hasSchema
        ? "border-white/10 bg-white/[0.015] text-slate-500 opacity-45 cursor-not-allowed"
        : hasActiveFilters
        ? "border-sky-200/45 bg-sky-500/20 text-slate-200"
        : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]");

    grid.innerHTML = "";

    const visiblePieces = PIECES_DATASET.filter((p) => {
      const ranks = Array.isArray(p.ranks) ? p.ranks : [];
      const baseValue = getBasePieceId(p);
      const searchHaystack = `${p.name} ${baseValue} ${(p.ranks ?? []).join(" ")}`.toLowerCase();

      const matchesSearch = !searchQuery || searchHaystack.includes(searchQuery);
      const matchesType = activeTypeFilters.size === 0 || ranks.some((rank) => activeTypeFilters.has(String(rank).toLowerCase()));
      const matchesBase = activeBaseFilters.size === 0 || activeBaseFilters.has(baseValue);

      return matchesSearch && matchesType && matchesBase;
    });

    if (visiblePieces.length === 0) {
      grid.appendChild(
        el(
          "div",
          "col-span-full rounded-2xl border-2 border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300",
          "No pieces match your current search/filter."
        )
      );
      return;
    }

    for (const p of visiblePieces) {
      const isSelected = p.id === selectedId;
      const cost = schema ? Number(schema.costs[p.id]) : null;
      const normalizedCost = Number.isFinite(cost) ? cost : 0;
      const needsCost = !!schema && pieceRequiresPositiveCost(p) && normalizedCost <= 0;

      const card = document.createElement("button");
      card.type = "button";
      card.className =
        "group relative flex flex-col items-center rounded-2xl border-2 p-3 text-left transform-gpu transition-all duration-200 ease-in-out hover:-translate-y-[1px] hover:scale-[1.015] hover:shadow-[0_14px_34px_rgba(0,0,0,0.38)] focus:outline-none focus-visible:ring-2 " +
        (needsCost
          ? (isSelected
              ? "border-rose-100 bg-rose-500/45 text-rose-50 ring-2 ring-rose-200/60 shadow-[0_0_0_1px_rgba(251,113,133,0.35)] hover:bg-rose-500/50 focus-visible:ring-rose-200/80"
              : "border-rose-200/60 bg-rose-500/35 text-rose-50 hover:bg-rose-500/45 focus-visible:ring-rose-200/60")
          : (isSelected
              ? "border-sky-100 bg-sky-500/16 ring-2 ring-sky-200/55 shadow-[0_0_0_1px_rgba(125,211,252,0.35)] hover:bg-sky-500/22 focus-visible:ring-sky-200/80"
              : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06] focus-visible:ring-sky-200/60"));

      const thumb = el("div", "mx-auto h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-full border-2 border-white/10 bg-white/[0.02] flex items-center justify-center text-xs font-semibold text-slate-200");
      const sprite = SPRITE_BY_ID.get(p.id);
      if (needsCost) {
        thumb.classList.remove("border-white/10", "bg-white/[0.02]");
        thumb.classList.add("border-rose-100/50", "bg-rose-500/20");
      }
      thumb.classList.add("transition-all", "duration-200", "ease-in-out", "group-hover:scale-[1.04]");
      if (sprite) {
        thumb.style.backgroundImage = `url("${PIECE_SHEET}")`;
        thumb.style.backgroundRepeat = "no-repeat";
        thumb.style.backgroundSize = `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`;
        thumb.style.backgroundPosition = spritePos(sprite.c, sprite.r);
      } else {
        thumb.textContent = String(p.abbrev ?? p.name ?? "?").slice(0, 2).toUpperCase();
      }

      const typeTip = formatRankLabel((p.ranks ?? [])[0]);
      const typeIcon = String((p.ranks ?? [])[0] ?? "").toLowerCase() === "noble" ? "👑" : "🌱";

      const name = el("div", "mt-3 text-center text-sm font-medium leading-snug text-slate-100");
      name.textContent = p.name;

      const bottom = el("div", "mt-3 flex w-full items-center justify-between gap-2");
      const costBadge = el(
        "div",
        "inline-flex items-center rounded-lg border-2 px-2 py-1 text-xs " +
          (needsCost
            ? "border-rose-100/60 bg-rose-500/35 text-rose-50"
            : "border-white/10 bg-white/[0.03] text-slate-200")
      );
      costBadge.textContent = `Cost: ${formatPoints(normalizedCost)}`;
      const typeBadge = el(
        "div",
        "inline-flex items-center rounded-lg border-2 border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-200"
      );
      typeBadge.innerHTML = `<span class="cwp-tooltip" data-tip="${escapeHtml(typeTip)}" aria-label="${escapeHtml(typeTip)}">${typeIcon}</span>`;

      bottom.append(costBadge, typeBadge);

      card.append(thumb, name, bottom);

      card.addEventListener("click", () => state.actions.selectPiece(p.id));
      grid.appendChild(card);
    }
  }

  searchInput.addEventListener("input", () => {
    if (!state.getSelectedSchema()) return;
    state.actions.setPieceSearch(searchInput.value ?? "");
  });

  filterBtn.addEventListener("click", () => {
    if (!state.getSelectedSchema()) return;
    openPieceFilterModal({
      filters: state.pieceFilters,
      onApply: (next) => state.actions.setPieceFilters(next),
    });
  });

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
    const piece = PIECE_BY_ID.get(state.selectedPieceId) ?? PIECES_DATASET[0] ?? null;

    body.innerHTML = "";

    const costCard = el("div", "mt-4 rounded-2xl border-2 border-white/10 bg-white/[0.02] p-4");

    if (!schema) {
      costCard.className = "rounded-2xl border-2 border-white/10 bg-white/[0.02] p-4";
      costCard.innerHTML = `
        <div class="text-sm font-medium text-slate-100">No point set selected</div>
        <div class="mt-1 text-sm text-slate-300">Create a point set first. Piece details will appear here.</div>
      `;
      createArmyBtn.disabled = true;
      body.append(costCard);
      return;
    }

    if (!piece) {
      costCard.innerHTML = `
        <div class="text-sm font-medium text-slate-100">No piece selected</div>
      `;
      createArmyBtn.disabled = true;
      body.append(costCard);
      return;
    }

    const topCard = el("div", "rounded-2xl border-2 border-white/10 bg-white/[0.02] p-4");
    const topRow = el("div", "flex items-start gap-4");

    const bigThumb = el("div", "h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl border-2 border-white/10 bg-white/[0.02] flex items-center justify-center text-sm font-semibold text-slate-200");
    const sprite = SPRITE_BY_ID.get(piece.id);
    if (sprite) {
      bigThumb.style.backgroundImage = `url("${PIECE_SHEET}")`;
      bigThumb.style.backgroundRepeat = "no-repeat";
      bigThumb.style.backgroundSize = `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`;
      bigThumb.style.backgroundPosition = spritePos(sprite.c, sprite.r);
    } else {
      bigThumb.textContent = String(piece.abbrev ?? piece.name ?? "?").slice(0, 2).toUpperCase();
    }

    const meta = el("div", "min-w-0 flex-1");
    renderPieceDetails(meta, piece);

    topRow.append(bigThumb, meta);
    topCard.appendChild(topRow);

    const currentCost = Number(schema.costs[piece.id] ?? 0);
    const costInvalid = pieceRequiresPositiveCost(piece) && currentCost <= 0;
    const remaining = calcRemaining(schema);
    const over = remaining < -0.001;
    const allPiecesPriced = hasAllPieceCosts(schema);

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
      <span class="font-semibold">${formatPoints(remaining)}</span>
      ${over ? `<span class="cwp-tooltip" data-tip="Over budget" aria-label="Over budget">⚠️</span>` : ""}
    `;

    const costWrap = el("div", "flex items-center gap-2");
    const costLabel = el("label", "text-xs font-medium uppercase tracking-wide text-slate-400", "Cost");
    costLabel.setAttribute("for", "costInput");

    const costInput = document.createElement("input");
    costInput.id = "costInput";
    costInput.type = "text";
    costInput.inputMode = "decimal";
    costInput.autocomplete = "off";
    costInput.value = formatPoints(currentCost);
    costInput.className =
      "w-[88px] rounded-xl border-2 px-3 py-2 text-sm text-slate-100 outline-none transition focus-visible:ring-2 " +
      (costInvalid
        ? "border-rose-300/55 bg-rose-500/18 focus-visible:ring-rose-200/70"
        : "border-white/12 bg-white/[0.03] focus-visible:ring-sky-200/60");

    costWrap.append(costLabel, costInput);

    const note = el("p", "mt-3 text-sm text-slate-300");
    note.textContent = "Set every piece above 0. Create army unlocks when Remaining hits 0.";

    row.append(remainingBox, costWrap);
    costCard.append(row, note);

    createArmyBtn.disabled = !allPiecesPriced || !isNearZero(remaining);

    costInput.addEventListener("input", () => {
      const cursorStart = costInput.selectionStart;
      const cursorEnd = costInput.selectionEnd;
      const rawText = String(costInput.value ?? "").trim();

      if (rawText === "" || rawText === "." || rawText.endsWith(".")) {
        return;
      }
      if (!/^\d*\.?\d{0,2}$/.test(rawText)) {
        return;
      }

      const raw = Number(rawText);
      if (!Number.isFinite(raw)) return;

      const next = roundToTwo(Math.max(0, raw));
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

    costInput.addEventListener("blur", () => {
      const rawText = String(costInput.value ?? "").trim();
      if (rawText === "" || rawText === ".") {
        schema.costs[piece.id] = 0;
        state.actions.touch();
        return;
      }

      const raw = Number(rawText);
      const next = Number.isFinite(raw) ? roundToTwo(Math.max(0, raw)) : 0;
      schema.costs[piece.id] = next;
      state.actions.touch();
    });

    body.append(topCard, costCard);
  }

  createArmyBtn.addEventListener("click", () => {
    const schema = state.getSelectedSchema();
    if (!schema) return;

    const remaining = calcRemaining(schema);
    if (!hasAllPieceCosts(schema)) {
      showToast("Every piece needs a cost above 0.", { variant: "error" });
      return;
    }

    if (!isNearZero(remaining)) {
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
    schemaPage: ui.schemaPage ?? 1,
    pieceSearch: ui.pieceSearch ?? "",
    pieceFilters: ui.pieceFilters ?? { types: [], bases: [] },
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
        const idx = state.schemas.findIndex((s) => s.id === id);
        if (idx >= 0) state.schemaPage = Math.floor(idx / SCHEMAS_PER_PAGE) + 1;
        state.emit();
      },
      selectPiece(id) {
        state.selectedPieceId = id;
        state.emit();
      },
      addSchema(schema) {
        state.schemas.unshift(schema);
        state.selectedSchemaId = schema.id;
        state.schemaPage = 1;
        state.emit();
      },
      deleteSchema(id) {
        const idx = state.schemas.findIndex((s) => s.id === id);
        if (idx === -1) return;
        state.schemas.splice(idx, 1);

        if (state.selectedSchemaId === id) {
          state.selectedSchemaId = state.schemas[0]?.id ?? null;
        }

        const totalPages = Math.max(1, Math.ceil(state.schemas.length / SCHEMAS_PER_PAGE));
        state.schemaPage = clamp(state.schemaPage, 1, totalPages);
        if (state.selectedSchemaId) {
          const selectedIdx = state.schemas.findIndex((s) => s.id === state.selectedSchemaId);
          if (selectedIdx >= 0) state.schemaPage = Math.floor(selectedIdx / SCHEMAS_PER_PAGE) + 1;
        }

        state.emit();
      },
      setSchemaPage(page) {
        const totalPages = Math.max(1, Math.ceil(state.schemas.length / SCHEMAS_PER_PAGE));
        state.schemaPage = clamp(page, 1, totalPages);
        state.emit();
      },
      setPieceSearch(value) {
        state.pieceSearch = String(value ?? "");
        state.emit();
      },
      setPieceFilters(next) {
        state.pieceFilters = {
          types: Array.isArray(next?.types) ? next.types : [],
          bases: Array.isArray(next?.bases) ? next.bases : [],
        };
        state.emit();
      },
    },
  };
  return state;
}

function pageButton(label, disabled = false, active = false) {
  const b = button(
    label,
    "button",
    "min-w-8 rounded-lg border-2 px-2 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 " +
      (active
        ? "border-sky-200/45 bg-sky-500/20 text-sky-100 focus-visible:ring-sky-200/70"
        : "border-white/12 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] focus-visible:ring-sky-200/60")
  );
  b.disabled = disabled;
  if (disabled) b.classList.add("opacity-45", "cursor-not-allowed");
  return b;
}

function openDeleteConfirmModal({ onConfirm }) {
  const content = el("div");
  content.appendChild(el("p", "text-sm text-slate-300", "Are you sure you want to delete this?"));

  const actions = el("div", "mt-5 flex items-center justify-end gap-2");
  const cancelBtn = button(
    "Cancel",
    "button",
    "rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/60"
  );
  const deleteBtn = button(
    "Delete",
    "button",
    "rounded-xl border-2 border-rose-300/40 bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70"
  );

  actions.append(cancelBtn, deleteBtn);
  content.appendChild(actions);

  const modal = openModal({
    title: "Confirm delete",
    content,
    initialFocusSelector: "button",
  });

  cancelBtn.addEventListener("click", () => modal.close("cancel"));
  deleteBtn.addEventListener("click", () => {
    modal.close("confirm");
    onConfirm?.();
  });
}

function openPieceFilterModal({ filters, onApply }) {
  const typeOptions = getRankOptions();
  const baseOptions = getBaseOptions();
  const nextTypes = new Set((filters?.types ?? []).map((v) => String(v).toLowerCase()));
  const nextBases = new Set((filters?.bases ?? []).map((v) => String(v).toLowerCase()));

  const content = el("div");
  const sectionType = el("div", "space-y-2");
  sectionType.appendChild(el("div", "text-xs font-medium uppercase tracking-wide text-slate-400", "Type"));
  const typeGrid = el("div", "grid grid-cols-2 gap-2");

  for (const type of typeOptions) {
    const row = filterToggleRow(formatRankLabel(type), nextTypes.has(type), (checked) => {
      if (checked) nextTypes.add(type);
      else nextTypes.delete(type);
    });
    typeGrid.appendChild(row);
  }
  sectionType.appendChild(typeGrid);

  const sectionBase = el("div", "mt-4 space-y-2");
  sectionBase.appendChild(el("div", "text-xs font-medium uppercase tracking-wide text-slate-400", "Base piece"));
  const baseGrid = el("div", "grid grid-cols-2 gap-2");
  for (const base of baseOptions) {
    const row = filterToggleRow(toTitle(base), nextBases.has(base), (checked) => {
      if (checked) nextBases.add(base);
      else nextBases.delete(base);
    });
    baseGrid.appendChild(row);
  }
  sectionBase.appendChild(baseGrid);

  const actions = el("div", "mt-5 flex items-center justify-between gap-2");
  const clearBtn = button(
    "Clear",
    "button",
    "rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/60"
  );
  const applyBtn = button(
    "Apply",
    "button",
    "rounded-xl border-2 border-sky-200/45 bg-sky-500/25 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70"
  );
  actions.append(clearBtn, applyBtn);

  content.append(sectionType, sectionBase, actions);

  const modal = openModal({
    title: "Filter pieces",
    content,
    initialFocusSelector: "input[type='checkbox']",
  });

  clearBtn.addEventListener("click", () => {
    nextTypes.clear();
    nextBases.clear();
    onApply?.({ types: [], bases: [] });
    modal.close("clear");
  });

  applyBtn.addEventListener("click", () => {
    onApply?.({ types: [...nextTypes], bases: [...nextBases] });
    modal.close("apply");
  });
}

function filterToggleRow(label, checked, onChange) {
  const row = el(
    "label",
    "flex items-center gap-2 rounded-lg border-2 border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200"
  );
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.className = "h-4 w-4 rounded border-white/20 bg-white/[0.03] text-sky-300 focus-visible:ring-sky-200/60";
  const text = el("span", "leading-none", label);
  row.append(input, text);
  input.addEventListener("change", () => onChange?.(input.checked));
  return row;
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
  return roundToTwo(total - sum);
}

function hasAllPieceCosts(schema) {
  return PIECES_DATASET.every((p) => !pieceRequiresPositiveCost(p) || Number(schema.costs?.[p.id]) > 0);
}

function pieceRequiresPositiveCost(piece) {
  return !!piece;
}

function isNearZero(value) {
  return Math.abs(Number(value) || 0) < 0.001;
}

function roundToTwo(value) {
  return Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;
}

function formatPoints(value) {
  const rounded = roundToTwo(value);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function toTitle(value) {
  const str = String(value ?? "");
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getBasePieceId(piece) {
  const fromSource = String(piece?.sourcePiece ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (fromSource) return fromSource;
  return String(piece?.id ?? "").trim().toLowerCase();
}

function getRankOptions() {
  return [...new Set(PIECES_DATASET.flatMap((piece) => piece.ranks ?? []))].filter(Boolean);
}

function getBaseOptions() {
  return [...new Set(PIECES_DATASET.map((piece) => getBasePieceId(piece)).filter(Boolean))];
}

function formatRankLabel(rank) {
  const normalized = String(rank ?? "").toLowerCase();
  if (normalized === "noble") return "Noble";
  if (normalized === "commoner") return "Commoner";
  return toTitle(normalized || "Rank");
}

function renderPieceDetails(container, piece) {
  container.innerHTML = "";

  const heading = el("div", "text-base font-semibold text-slate-100");
  heading.textContent = piece.name;
  container.appendChild(heading);

  const ranks = renderRanks(piece.ranks ?? []);
  if (ranks) {
    const row = el("div", "mt-3");
    row.appendChild(el("div", "text-[11px] uppercase tracking-wide text-slate-400", "Ranks"));
    row.appendChild(ranks);
    container.appendChild(row);
  }

  const abilities = renderAbilities(piece.abilities ?? []);
  if (abilities) {
    const row = el("div", "mt-3");
    row.appendChild(el("div", "text-[11px] uppercase tracking-wide text-slate-400", "Abilities"));
    row.appendChild(abilities);
    container.appendChild(row);
  }

  if (piece.description) {
    const section = el("div", "mt-3");
    section.appendChild(el("div", "text-[11px] uppercase tracking-wide text-slate-400", "Description"));
    section.appendChild(el("p", "mt-1 text-sm text-slate-300", piece.description));
    container.appendChild(section);
  }

  if (piece.moveRules) {
    const section = el("div", "mt-3");
    section.appendChild(el("div", "text-[11px] uppercase tracking-wide text-slate-400", "Move rules"));
    section.appendChild(el("p", "mt-1 text-sm text-slate-300", piece.moveRules));
    container.appendChild(section);
  }
}

function renderRanks(ranks) {
  if (!Array.isArray(ranks) || ranks.length === 0) return null;
  const wrap = el("div", "mt-1 flex flex-wrap items-center gap-2");

  for (const rank of ranks) {
    const normalized = String(rank ?? "").toLowerCase();
    const badge = el(
      "span",
      "inline-flex items-center gap-1 rounded-lg border-2 px-2 py-1 text-xs " +
        (normalized === "noble"
          ? "border-sky-200/35 bg-sky-500/10 text-sky-100"
          : "border-white/12 bg-white/[0.03] text-slate-200")
    );
    const icon = normalized === "noble" ? "👑" : "🧍";
    badge.textContent = `${icon} ${formatRankLabel(normalized)}`;
    wrap.appendChild(badge);
  }

  return wrap;
}

function renderAbilities(abilities) {
  if (!Array.isArray(abilities) || abilities.length === 0) return null;
  const wrap = el("div", "mt-1 flex flex-wrap items-center gap-2");

  for (const ability of abilities) {
    const label = String(ability ?? "").trim().toLowerCase();
    if (!label) continue;
    const pill = el(
      "span",
      "inline-flex items-center rounded-full border-2 border-white/12 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-wide text-slate-200"
    );
    pill.textContent = label;
    wrap.appendChild(pill);
  }

  return wrap.childElementCount > 0 ? wrap : null;
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

function setTooltip(elm, text) {
  elm.classList.add("cwp-tooltip");
  const tip = String(text ?? "");
  elm.dataset.tip = tip;
  elm.setAttribute("data-tip", tip);
  elm.setAttribute("title", tip);
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

function backIcon() {
  return `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18 9 12l6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function filterIcon() {
  return `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16l-6 7v5l-4 2v-7L4 6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `;
}
