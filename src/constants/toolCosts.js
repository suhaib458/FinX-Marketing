export const TOOL_COSTS = Object.freeze({
  'social-post': 5,
  'ad-design': 20,
  'content-ideas': 8,
  campaign: 30,
});

export function getToolCost(tool) {
  return TOOL_COSTS[tool] ?? 0;
}
