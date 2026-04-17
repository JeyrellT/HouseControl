function assertString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function createDevice(input = {}) {
  return {
    id: assertString(input.id),
    platformId: assertString(input.platformId),
    roomId: assertString(input.roomId),
    type: assertString(input.type),
    subtype: assertString(input.subtype),
    name: assertString(input.name, "Unknown device"),
    online: Boolean(input.online),
    state: input.state && typeof input.state === "object" ? { ...input.state } : {},
    capabilities: Array.isArray(input.capabilities) ? [...input.capabilities] : [],
    lastSeenAt: assertString(input.lastSeenAt)
  };
}

