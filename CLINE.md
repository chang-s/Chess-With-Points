# Cline Project Guide: Chess With Points (Web Lobby + Create Game Overlay)

## 1) Project mission
Build a premium-feeling indie-game web UI for "Chess With Points" using only static hosting (GitHub Pages).
This repo currently focuses on:
- Lobby screen (2 buttons: Create game, Join game)
- Create game flow: full-screen overlay for point schemas + piece cost setup

Do NOT add extra product sections (roadmap, feature lists, long descriptions, busy cards).

## 2) Hard constraints (must never break)
- MUST run instantly on GitHub Pages by opening `index.html`
- HTML + Tailwind via CDN only (no npm, no build tools)
- Vanilla JS using ES modules (no React/Vite/Next)
- No external state libraries
- Keep code modular (small files, clear responsibilities)
- No huge single-file scripts

## 3) File structure (keep this architecture)
- `/index.html`
- `/assets/js/app.js` (entry: wires UI + renders overlay)
- `/assets/js/ui/modal.js` (modal + full-screen overlay + a11y close)
- `/assets/js/ui/focusTrap.js` (focus trap)
- `/assets/js/ui/toast.js` (toasts)
- `/assets/js/data/pieces.js` (piece metadata + sprite mapping)
- `/assets/js/data/rulesets.js` (legacy/placeholder; may be unused)
- `/assets/img/pieces-sheet.png` (sprite sheet used for piece thumbnails)

If you add files, keep them in these folders:
- `/assets/js/ui/` for UI primitives
- `/assets/js/data/` for static data
- `/assets/js/utils/` for tiny helpers (optional)

## 4) UI style rules (important)
Design: premium indie game lobby vibe.
- Dark modern theme, calm and minimal
- Subtle gradient background only (no noisy textures)
- Soft glows and tasteful borders
- Generous whitespace
- Mobile-first responsive layout
- Visible focus states everywhere

Avoid clutter:
- No extra panels, feature lists, or busy cards
- No long explanatory copy in the UI
- Only essential helper text

Color direction:
- Prefer blues/skiy/cyan tones (not green-forward)

## 5) Create Game overlay UX requirements
Overlay layout:
- 3-column layout on desktop (left schemas, center piece grid, right piece details)
- Mobile-first: stack columns on small screens (left -> center -> right)
- Center grid must be scrollable and never cut off
- Pieces should wrap to new rows naturally as screen shrinks
- If no schema exists: center/right disabled + overlay message "Create a new point set"

Schemas (left):
- Schema list persisted in localStorage
- Controls:
  - Total points dropdown: 40 (default), 80, 120, 160, 400
  - Create new
  - Inline rename:
    - Pencil icon enters edit mode
    - Pencil becomes checkmark to save
    - Enter saves, Esc cancels
  - Duplicate schema
  - Delete schema (confirm is fine)
- Remaining points shown per schema
- Over budget state shows warning symbol (tooltip: "Over budget")

Pieces (center):
- Display all pieces (27) from `pieces.js` sprite sheet
- Each piece card shows:
  - Thumbnail image (sprite)
  - Name
  - Type icon only:
    - Noble = crown icon (emoji OK for now)
    - Commoner = person icon (emoji OK for now)
    - Hover shows tooltip ("Noble"/"Commoner")
  - Cost badge
- Do NOT show extra tags like "Swap", "Leap", etc in the center cards

Piece details (right):
- Selected piece larger thumbnail + name/type
- Cost input:
  - Small width (2-3 digits)
  - Updates schema cost live
- Remaining counter:
  - Must be displayed on the left within the cost card row
  - Remove the "Total: X" line
- Create army button:
  - Disabled unless remaining === 0
  - Clicking when disabled should show a toast error

## 6) Accessibility requirements
- Overlay closes via Esc
- Clicking outside overlay closes it
- Focus trapped while open
- Restore focus when closed
- Use semantic HTML; ARIA only where necessary
- Ensure tooltips do not block keyboard navigation

## 7) Coding standards
- No framework code
- Prefer small pure functions
- No DOM mega-render that is impossible to reason about
- If you re-render a section, rebind events safely
- Keep naming clear: `buildLeftColumn`, `render`, `state.actions.*`

## 8) What NOT to do
- Do NOT add build steps, bundlers, npm dependencies
- Do NOT introduce React/Vue/etc
- Do NOT add unrelated pages/sections
- Do NOT add background noise textures
- Do NOT add large verbose documentation in the UI
- Do NOT break localStorage persistence

## 9) When changing UI
Always preserve:
- Minimal + calm vibe
- Mobile-first layout
- A11y behaviors (esc, click outside, focus trap)
- GitHub Pages compatibility

Before finishing, verify:
- `index.html` works by double-click/open (no server required)
- All module imports are relative and correct
- No console errors
