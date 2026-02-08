export const RULESETS = [
  {
    id: "20",
    label: "20 points",
    budget: 20,
    description: "Fast draft, lean armies. Great for quick games and sharp decisions.",
  },
  {
    id: "30",
    label: "30 points",
    budget: 30,
    description: "Balanced budget. Flexible builds with room for a signature piece.",
  },
  {
    id: "40",
    label: "40 points",
    budget: 40,
    description: "Big brain mode. Wider compositions and more tactical variety.",
  },
];

export function getRulesetById(id) {
  return RULESETS.find((r) => r.id === String(id)) ?? RULESETS[0];
}
