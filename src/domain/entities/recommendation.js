function assertString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function createRecommendation(input = {}) {
  return {
    id: assertString(input.id),
    type: assertString(input.type, "maintenance"),
    priority: assertString(input.priority, "low"),
    confidence: Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : 0,
    title: assertString(input.title, "Untitled recommendation"),
    rationale: assertString(input.rationale),
    action: assertString(input.action)
  };
}

