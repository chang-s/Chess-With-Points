export const PIECE_SHEET = "./assets/img/pieces-sheet.png";

// Sprite grid assumptions based on your sheet:
// 6 columns across, 5 rows down, last row has 3 tiles.
export const SPRITE_COLS = 6;
export const SPRITE_ROWS = 5;

export const PIECES = [
  // Row 0
  { id: "pawn", name: "Pawn", type: "Commoner", baseCost: 0, icons: ["move"], sprite: { c: 0, r: 0 } },
  { id: "knight", name: "Knight", type: "Noble", baseCost: 0, icons: ["jump"], sprite: { c: 1, r: 0 } },
  { id: "bishop", name: "Bishop", type: "Noble", baseCost: 0, icons: ["diag"], sprite: { c: 2, r: 0 } },
  { id: "rook", name: "Rook", type: "Noble", baseCost: 0, icons: ["line"], sprite: { c: 3, r: 0 } },
  { id: "queen", name: "Queen", type: "Noble", baseCost: 0, icons: ["omni"], sprite: { c: 4, r: 0 } },
  { id: "king", name: "King", type: "Noble", baseCost: 0, icons: ["crown"], sprite: { c: 5, r: 0 } },

  // Row 1
  { id: "squire", name: "Squire", type: "Commoner", baseCost: 0, icons: ["frontcap"], sprite: { c: 0, r: 1 } },
  { id: "shield-bearer", name: "Shield Bearer", type: "Commoner", baseCost: 0, icons: ["shield", "nocap"], sprite: { c: 1, r: 1 } },
  { id: "peasant", name: "Peasant", type: "Commoner", baseCost: 0, icons: ["nopromo"], sprite: { c: 2, r: 1 } },
  { id: "adept", name: "Adept", type: "Commoner", baseCost: 0, icons: ["swap", "nocap"], sprite: { c: 3, r: 1 } },
  { id: "mule", name: "Mule", type: "Commoner", baseCost: 0, icons: ["restraint"], sprite: { c: 4, r: 1 } },
  { id: "wild-stallion", name: "Wild Stallion", type: "Commoner", baseCost: 0, icons: ["wild"], sprite: { c: 5, r: 1 } },

  // Row 2
  { id: "clergy-riders", name: "Clergy Riders", type: "Noble", baseCost: 0, icons: ["jump"], sprite: { c: 0, r: 2 } },
  { id: "lance-rider", name: "Lance Rider", type: "Noble", baseCost: 0, icons: ["jump"], sprite: { c: 1, r: 2 } },
  { id: "pegasus", name: "Pegasus", type: "Noble", baseCost: 0, icons: ["jump", "swap"], sprite: { c: 2, r: 2 } },
  { id: "high-priest", name: "High Priest", type: "Noble", baseCost: 0, icons: ["range"], sprite: { c: 3, r: 2 } },
  { id: "corrupted-abbot", name: "Corrupted Abbot", type: "Noble", baseCost: 0, icons: ["curse"], sprite: { c: 4, r: 2 } },
  { id: "arcane-priest", name: "Arcane Priest", type: "Noble", baseCost: 0, icons: ["swap"], sprite: { c: 5, r: 2 } },

  // Row 3
  { id: "damaged-chariot", name: "Damaged Chariot", type: "Noble", baseCost: 0, icons: ["line"], sprite: { c: 0, r: 3 } },
  { id: "fast-chariot", name: "Fast Chariot", type: "Noble", baseCost: 0, icons: ["jump"], sprite: { c: 1, r: 3 } },
  { id: "armored-chariot", name: "Armored Chariot", type: "Noble", baseCost: 0, icons: ["shield"], sprite: { c: 2, r: 3 } },
  { id: "arcane-tower", name: "Arcane Tower", type: "Noble", baseCost: 0, icons: ["swap"], sprite: { c: 3, r: 3 } },
  { id: "sorceress", name: "Sorceress", type: "Noble", baseCost: 0, icons: ["swap"], sprite: { c: 4, r: 3 } },
  { id: "joan-of-arc", name: "Joan of Arc", type: "Noble", baseCost: 0, icons: ["shield"], sprite: { c: 5, r: 3 } },

  // Row 4 (only 3 tiles)
  { id: "queen-of-air", name: "Queen of Air", type: "Noble", baseCost: 0, icons: ["anywhite"], sprite: { c: 0, r: 4 } },
  { id: "queen-of-darkness", name: "Queen of Darkness", type: "Noble", baseCost: 0, icons: ["anyblack"], sprite: { c: 1, r: 4 } },
  { id: "the-old-queen", name: "The Old Queen", type: "Noble", baseCost: 0, icons: ["kinglike"], sprite: { c: 2, r: 4 } },
];

export function getPieceById(id) {
  return PIECES.find((p) => p.id === id) ?? PIECES[0];
}
