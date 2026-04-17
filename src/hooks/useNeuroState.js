import { useMemo } from "react";
import { createNeuroUiProfile } from "../domain/neuro/profile.js";
import { useNeuroSelector } from "../state/hooks/useSelectors.js";

function formatLoadLabel(cognitiveLoad) {
  if (!cognitiveLoad) {
    return "Normal";
  }

  return cognitiveLoad.charAt(0).toUpperCase() + cognitiveLoad.slice(1);
}

function formatAdaptiveModeLabel(adaptiveMode) {
  if (!adaptiveMode) {
    return "Standard";
  }

  return adaptiveMode === "simplified-ui" ? "Simplified UI" : "Standard";
}

export function useNeuroState() {
  const neuroState = useNeuroSelector((slice) => slice);

  return useMemo(() => {
    const uiProfile = createNeuroUiProfile(neuroState);

    return {
      ...neuroState,
      cognitiveLoad: uiProfile.cognitiveLoad,
      cognitiveLoadLabel: formatLoadLabel(uiProfile.cognitiveLoad),
      cognitiveScoreLabel: `${neuroState.cognitiveScore}/100`,
      errpDetectedLabel: neuroState.errpDetected ? "ErrP detected" : "No ErrP detected",
      errpTone: neuroState.errpDetected ? "warning" : "success",
      adaptiveMode: uiProfile.adaptiveMode,
      adaptiveModeLabel: formatAdaptiveModeLabel(uiProfile.adaptiveMode),
      uiProfile
    };
  }, [neuroState]);
}

