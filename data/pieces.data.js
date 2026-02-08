export const PIECES_DATA = [
  {
    "id": "pawn",
    "name": "Pawn",
    "points": 1,
    "abbrev": "P",
    "sourcePiece": "Pawn",
    "moveRules": "As per chess",
    "toolTip": null,
    "devNotes": "As per chess.  May only promote to a noble used in the match",
    "ranks": [
      "commoner"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "knight",
    "name": "Knight",
    "points": 3,
    "abbrev": "N",
    "sourcePiece": "Knight",
    "moveRules": "As per chess",
    "toolTip": "Leap",
    "devNotes": "As per chess.",
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "bishop",
    "name": "Bishop",
    "points": 3,
    "abbrev": "B",
    "sourcePiece": "Bishop",
    "moveRules": "As per chess",
    "toolTip": null,
    "devNotes": "As per chess.",
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "rook",
    "name": "Rook",
    "points": 5,
    "abbrev": "R",
    "sourcePiece": "Rook",
    "moveRules": "As per chess",
    "toolTip": null,
    "devNotes": "As per chess.",
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "queen",
    "name": "Queen",
    "points": 10,
    "abbrev": "Q",
    "sourcePiece": "Queen",
    "moveRules": "As per chess",
    "toolTip": null,
    "devNotes": "As per chess",
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "king",
    "name": "King",
    "points": 0,
    "abbrev": "K",
    "sourcePiece": "King",
    "moveRules": "As per chess",
    "toolTip": null,
    "devNotes": "Limit 1/side",
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "squire",
    "name": "Squire",
    "points": 0,
    "abbrev": "SQ",
    "sourcePiece": "Pawn",
    "moveRules": "1 square forward (including 1st move), captures forward",
    "toolTip": "Moves and captures forward",
    "devNotes": "Promotes to a Noble used in the match",
    "ranks": [
      "commoner"
    ],
    "abilities": [],
    "description": "Moves are limited to 1 square forward, captures forward"
  },
  {
    "id": "shield-bearer",
    "name": "Shield Bearer",
    "points": 0,
    "abbrev": "SB",
    "sourcePiece": "Pawn",
    "moveRules": "One square forward (including 1st move), can't capture",
    "toolTip": "Can't capture",
    "devNotes": "Promotes to a Noble used in the match",
    "ranks": [
      "commoner"
    ],
    "abilities": [
      "shield"
    ],
    "description": "can't capture"
  },
  {
    "id": "serf",
    "name": "Serf",
    "points": 0,
    "abbrev": "SF",
    "sourcePiece": "Pawn",
    "moveRules": "As per chess pawn",
    "toolTip": "Does not promote, may move and capture to the 1st rank",
    "devNotes": "The Serf takes a legal move or capture to go from the 8th to the 1st Rank",
    "ranks": [
      "commoner"
    ],
    "abilities": [],
    "description": "Does not promote, instead may move or capture from the 8th rank to the 1st rank"
  },
  {
    "id": "adept",
    "name": "Adept",
    "points": 0,
    "abbrev": "AD",
    "sourcePiece": "Pawn",
    "moveRules": "One square forward, can't capture.",
    "toolTip": "Swap, can't capture",
    "devNotes": "Can promote to a Noble used in the match via a Swap on the 8th rrank",
    "ranks": [
      "commoner"
    ],
    "abilities": [
      "swap"
    ],
    "description": "can't capture"
  },
  {
    "id": "mule",
    "name": "Mule",
    "points": 0,
    "abbrev": "MU",
    "sourcePiece": "Knight",
    "moveRules": "As per chess knight.",
    "toolTip": "May not be moved in consecutive turns.",
    "devNotes": "Can not be moved two turns in a row",
    "ranks": [
      "noble"
    ],
    "abilities": [
      "leap"
    ],
    "description": "may not be moved in consecutive turns"
  },
  {
    "id": "war-horse",
    "name": "War Horse",
    "points": 0,
    "abbrev": "WH",
    "sourcePiece": "Knight",
    "moveRules": "As per chess knight",
    "toolTip": "Leap, may start in the 1st or 2nd rank.",
    "devNotes": null,
    "ranks": [
      "commoner",
      "noble"
    ],
    "abilities": [
      "leap"
    ],
    "description": null
  },
  {
    "id": "friar",
    "name": "Friar",
    "points": 0,
    "abbrev": "FR",
    "sourcePiece": "Knight, Bishop",
    "moveRules": "Exactly two squares diagonally",
    "toolTip": "Leap",
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [
      "leap"
    ],
    "description": null
  },
  {
    "id": "unicorn",
    "name": "Unicorn",
    "points": 0,
    "abbrev": "UC",
    "sourcePiece": "Knight",
    "moveRules": "Exactly three squares vertically forward (ahead) or as per chess knight",
    "toolTip": "Leap",
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [
      "leap"
    ],
    "description": null
  },
  {
    "id": "pegasus",
    "name": "Pegasus",
    "points": 0,
    "abbrev": "PG",
    "sourcePiece": "Knight",
    "moveRules": "As per chess knight",
    "toolTip": "Swap, Leap",
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [
      "leap",
      "swap"
    ],
    "description": null
  },
  {
    "id": "monk",
    "name": "Monk",
    "points": 0,
    "abbrev": "MK",
    "sourcePiece": "Bishop",
    "moveRules": "Up to 3 squares diagonally or may move 1 square horizontally",
    "toolTip": null,
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "corrupted-abbot",
    "name": "Corrupted Abbot",
    "points": 0,
    "abbrev": "CA",
    "sourcePiece": "Bishop",
    "moveRules": "As per chess bishop",
    "toolTip": "The opposing player may move (but not capture with) this piece.",
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": "The opposing player may move (but not capture with) this piece."
  },
  {
    "id": "cleric",
    "name": "Cleric",
    "points": 0,
    "abbrev": "CL",
    "sourcePiece": "Bishop",
    "moveRules": "Up to 3 squares diagonally",
    "toolTip": null,
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [
      "swap"
    ],
    "description": null
  },
  {
    "id": "siege-tower",
    "name": "Siege Tower",
    "points": 0,
    "abbrev": "ST",
    "sourcePiece": "Rook",
    "moveRules": "Up to 2 squares horizontally or vertically",
    "toolTip": null,
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "ballista",
    "name": "Ballista",
    "points": 0,
    "abbrev": "BA",
    "sourcePiece": "Rook",
    "moveRules": "As per chess rook",
    "toolTip": "Leap",
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [
      "leap"
    ],
    "description": null
  },
  {
    "id": "citadel",
    "name": "Citadel",
    "points": 0,
    "abbrev": "CD",
    "sourcePiece": "Rook",
    "moveRules": "Up to 4 squares horizontally or vertically",
    "toolTip": null,
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [
      "shield"
    ],
    "description": null
  },
  {
    "id": "wizard-tower",
    "name": "Wizard Tower",
    "points": 0,
    "abbrev": "WZ",
    "sourcePiece": "Rook",
    "moveRules": "1 square horizontally or vertically",
    "toolTip": "Swap",
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [
      "swap"
    ],
    "description": null
  },
  {
    "id": "sorceress",
    "name": "Sorceress",
    "points": 0,
    "abbrev": "SS",
    "sourcePiece": "Queen",
    "moveRules": "Up to 5 squares diagonally, horizontally or vertically",
    "toolTip": "Swap",
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [
      "swap"
    ],
    "description": null
  },
  {
    "id": "saint-joan",
    "name": "Saint Joan",
    "points": 0,
    "abbrev": "SJ",
    "sourcePiece": "Queen",
    "moveRules": "As per chess queen",
    "toolTip": null,
    "devNotes": "May not select more than one Saint Joan.",
    "ranks": [
      "noble"
    ],
    "abilities": [
      "shield"
    ],
    "description": null
  },
  {
    "id": "queen-of-air",
    "name": "Queen of Air",
    "points": 0,
    "abbrev": "QA",
    "sourcePiece": "Queen",
    "moveRules": "As per a chess queen but may only start/move to white squares",
    "toolTip": "Must start and move to white squares",
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "queen-of-darkness",
    "name": "Queen of Darkness",
    "points": 0,
    "abbrev": "QD",
    "sourcePiece": "Queen",
    "moveRules": "As per a chess queen but may only start/move to black squares",
    "toolTip": "Must start and move to dark squares",
    "devNotes": null,
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": null
  },
  {
    "id": "empress",
    "name": "Empress",
    "points": 0,
    "abbrev": "EM",
    "sourcePiece": "Queen, King",
    "moveRules": "As per chess queen",
    "toolTip": "Acts as King, including check(mate)",
    "devNotes": "If both your King and Empress are in check you must resolve both or lose. This piece does not replace the need for a King.",
    "ranks": [
      "noble"
    ],
    "abilities": [],
    "description": "Acts a king - can be checked/checkmated."
  }
];
