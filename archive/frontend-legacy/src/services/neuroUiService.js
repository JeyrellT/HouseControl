function normalizeCognitiveLoad(cognitiveLoad) {
  if (!cognitiveLoad) {
    return "normal";
  }

  if (cognitiveLoad === "high") {
    return "high";
  }

  if (cognitiveLoad === "low") {
    return "low";
  }

  if (cognitiveLoad === "moderate" || cognitiveLoad === "normal") {
    return "normal";
  }

  return "normal";
}

export function shouldReduceVisualDensity(neuroState) {
  const normalizedLoad = normalizeCognitiveLoad(neuroState?.cognitiveLoad);
  return normalizedLoad === "high";
}

export function shouldIncreaseContrast(neuroState) {
  const normalizedLoad = normalizeCognitiveLoad(neuroState?.cognitiveLoad);
  return normalizedLoad === "high" || Boolean(neuroState?.errpDetected);
}

export function shouldPrioritizeRecommendations(neuroState) {
  const normalizedLoad = normalizeCognitiveLoad(neuroState?.cognitiveLoad);
  return normalizedLoad === "high" || Boolean(neuroState?.errpDetected);
}

export function resolveAdaptiveMode(neuroState) {
  return shouldReduceVisualDensity(neuroState) ? "simplified-ui" : "standard";
}

export function getAdaptiveModeReason(neuroState) {
  const normalizedLoad = normalizeCognitiveLoad(neuroState?.cognitiveLoad);

  if (Boolean(neuroState?.errpDetected)) {
    return "ErrP detectado en el mock actual. Conviene reducir friccion visual y priorizar acciones claras.";
  }

  if (normalizedLoad === "high") {
    return "La carga cognitiva mock esta alta, asi que la UI deberia simplificar densidad y enfoque.";
  }

  if (normalizedLoad === "low") {
    return "La carga cognitiva mock se ve baja y estable, por eso puede mantenerse una interfaz estandar.";
  }

  return "La carga cognitiva mock se mantiene dentro de un rango manejable, asi que Nexus conserva el modo estandar.";
}

export function createNeuroUiProfile(neuroState) {
  const normalizedLoad = normalizeCognitiveLoad(neuroState?.cognitiveLoad);
  const adaptiveMode = resolveAdaptiveMode(neuroState);

  return {
    cognitiveLoad: normalizedLoad,
    adaptiveMode,
    shouldReduceVisualDensity: shouldReduceVisualDensity(neuroState),
    shouldIncreaseContrast: shouldIncreaseContrast(neuroState),
    shouldPrioritizeRecommendations: shouldPrioritizeRecommendations(neuroState),
    reason: getAdaptiveModeReason(neuroState)
  };
}
