function assertString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function createPlatform(input = {}) {
  return {
    id: assertString(input.id),
    key: assertString(input.key),
    label: assertString(input.label, "Unknown platform"),
    status: assertString(input.status, "offline"),
    capabilities: Array.isArray(input.capabilities) ? [...input.capabilities] : [],
    latencyMs: Number.isFinite(Number(input.latencyMs)) ? Number(input.latencyMs) : 0,
    lastSyncAt: assertString(input.lastSyncAt)
  };
}

