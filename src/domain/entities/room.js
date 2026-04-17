function assertString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function createRoom(input = {}) {
  return {
    id: assertString(input.id),
    name: assertString(input.name, "Unnamed room"),
    icon: assertString(input.icon, "home"),
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : 0
  };
}

