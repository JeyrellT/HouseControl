function normalizeCognitiveLoad(cognitiveLoad) {
  if (cognitiveLoad === "high") {
    return "high";
  }

  if (cognitiveLoad === "low") {
    return "low";
  }

  return "normal";
}

export function shouldReduceVisualDensity(neuroState) {
  return normalizeCognitiveLoad(neuroState?.cognitiveLoad) === "high";
}

export function shouldIncreaseContrast(neuroState) {
  return shouldReduceVisualDensity(neuroState) || Boolean(neuroState?.errpDetected);
}

export function shouldPrioritizeRecommendations(neuroState) {
  return shouldReduceVisualDensity(neuroState) || Boolean(neuroState?.errpDetected);
}

export function resolveAdaptiveMode(neuroState) {
  return shouldReduceVisualDensity(neuroState) ? "simplified-ui" : "standard";
}

export function getAdaptiveModeReason(neuroState) {
  const normalizedLoad = normalizeCognitiveLoad(neuroState?.cognitiveLoad);

  if (Boolean(neuroState?.errpDetected)) {
    return "ErrP detectado. Conviene reducir friccion visual y priorizar acciones claras.";
  }

  if (normalizedLoad === "high") {
    return "La carga cognitiva actual esta alta, asi que la UI debe simplificar densidad y enfoque.";
  }

  if (normalizedLoad === "low") {
    return "La carga cognitiva se ve baja y estable, por eso puede mantenerse una interfaz estandar.";
  }

  return "La carga cognitiva se mantiene en un rango manejable, asi que Nexus conserva el modo estandar.";
}

export function createNeuroUiProfile(neuroState) {
  const cognitiveLoad = normalizeCognitiveLoad(neuroState?.cognitiveLoad);
  const adaptiveMode = resolveAdaptiveMode(neuroState);

  return {
    cognitiveLoad,
    adaptiveMode,
    shouldReduceVisualDensity: shouldReduceVisualDensity(neuroState),
    shouldIncreaseContrast: shouldIncreaseContrast(neuroState),
    shouldPrioritizeRecommendations: shouldPrioritizeRecommendations(neuroState),
    reason: getAdaptiveModeReason(neuroState)
  };
}

