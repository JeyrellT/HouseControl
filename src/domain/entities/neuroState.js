function assertString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function createNeuroState(input = {}) {
  return {
    cognitiveLoad: assertString(input.cognitiveLoad, "normal"),
    cognitiveScore: Number.isFinite(Number(input.cognitiveScore)) ? Number(input.cognitiveScore) : 0,
    errpDetected: Boolean(input.errpDetected),
    adaptiveMode: assertString(input.adaptiveMode, "standard"),
    source: assertString(input.source, "unknown"),
    lastSignalAt: assertString(input.lastSignalAt)
  };
}

