import { RULESETS } from "./data/rulesets.js";
import { openModal } from "./ui/modal.js";
import { toast } from "./ui/toast.js";

document.addEventListener("DOMContentLoaded", () => {
  const btnCreate = document.getElementById("btnCreate");
  const btnJoin = document.getElementById("btnJoin");
  const linkWhat = document.getElementById("linkWhatIsRuleset");

  btnCreate?.addEventListener("click", onCreateGame);
  btnJoin?.addEventListener("click", onJoinGame);
  linkWhat?.addEventListener("click", (e) => {
    e.preventDefault();
    explainRuleset();
  });
});

function onCreateGame() {
  const content = buildRulesetPicker();

  let selected = RULESETS[0]?.id ?? null;

  const modal = openModal({
    title: "Create game",
    subtitle: "Choose a ruleset (points budget + piece catalog). We’ll generate a match code later.",
    contentEl: content.root,
    primaryText: "Continue",
    secondaryText: "Not now",
    onPrimary: () => {
      const picked = content.getSelected();
      const rs = RULESETS.find((r) => r.id === picked);
      toast("Create game (stub)", `Selected: ${rs?.name ?? "Unknown"} • Budget: ${rs?.budget ?? "?"} pts`);
      return true;
    },
    onSecondary: () => {
      toast("Okay!", "No worries. Pick a ruleset whenever you’re ready.");
    },
  });

  // Enable/disable primary if needed (kept simple for now)
  modal.setPrimaryDisabled(!selected);
}

function onJoinGame() {
  const content = buildJoinForm();

  openModal({
    title: "Join game",
    subtitle: "Enter a match code. (This is UI-only for now.)",
    contentEl: content.root,
    primaryText: "Join",
    secondaryText: "Cancel",
    onPrimary: () => {
      const code = content.getCode();
      if (!code || code.length < 4) {
        toast("Hmm", "Please enter a valid code (at least 4 characters).");
        return false; // keep modal open
      }
      toast("Join game (stub)", `Tried to join code: ${code.toUpperCase()}`);
      return true;
    },
  });
}

function explainRuleset() {
  const content = document.createElement("div");
  content.innerHTML = `
    <p class="small">
      A <strong>ruleset</strong> bundles together the points budget and the piece catalog rules.
      For example, one ruleset might allow a 30-point army with all 23 custom pieces,
      while another might be a smaller 20-point “starter” mode.
    </p>
    <p class="small" style="margin-top:10px;">
      For this prototype, rulesets are stored as simple data in <code>assets/js/data/rulesets.js</code>.
    </p>
  `;

  openModal({
    title: "What is a ruleset?",
    subtitle: "A neat little package of game rules for drafting + play.",
    contentEl: content,
    primaryText: "Got it",
    secondaryText: "Close",
    onPrimary: () => true,
  });
}

function buildRulesetPicker() {
  const root = document.createElement("div");

  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  label.setAttribute("for", "rulesetSelect");
  label.textContent = "Ruleset / Points Budget";

  const select = document.createElement("select");
  select.className = "select";
  select.id = "rulesetSelect";

  for (const r of RULESETS) {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `${r.name}`;
    select.appendChild(opt);
  }

  const desc = document.createElement("div");
  desc.className = "small";
  desc.style.marginTop = "8px";

  function updateDesc() {
    const id = select.value;
    const rs = RULESETS.find((x) => x.id === id);
    desc.textContent = rs ? rs.description : "Select a ruleset to see details.";
  }

  select.addEventListener("change", updateDesc);
  updateDesc();

  field.appendChild(label);
  field.appendChild(select);
  field.appendChild(desc);

  const note = document.createElement("div");
  note.className = "small";
  note.style.marginTop = "12px";
  note.textContent = "Next up: we’ll generate a match code and move into army drafting.";

  root.appendChild(field);
  root.appendChild(note);

  return {
    root,
    getSelected: () => select.value,
  };
}

function buildJoinForm() {
  const root = document.createElement("div");

  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  label.setAttribute("for", "joinCode");
  label.textContent = "Match code";

  const input = document.createElement("input");
  input.className = "input";
  input.id = "joinCode";
  input.type = "text";
  input.placeholder = "e.g. A1B2C3";
  input.autocomplete = "off";
  input.spellcheck = false;

  const helper = document.createElement("div");
  helper.className = "small";
  helper.textContent = "For now this is just a UI stub. Later it will connect to multiplayer.";

  field.appendChild(label);
  field.appendChild(input);
  field.appendChild(helper);

  root.appendChild(field);

  // UX: focus input quickly
  setTimeout(() => input.focus(), 0);

  return {
    root,
    getCode: () => input.value.trim(),
  };
}
