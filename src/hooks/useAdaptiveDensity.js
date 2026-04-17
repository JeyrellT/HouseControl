import { useMemo } from "react";
import { useNeuroState } from "./useNeuroState.js";

export function useAdaptiveDensity() {
  const neuroState = useNeuroState();

  return useMemo(
    () => ({
      recommendedMode: neuroState.adaptiveMode,
      isSimplifiedMode: neuroState.adaptiveMode === "simplified-ui",
      shouldReduceVisualDensity: neuroState.uiProfile.shouldReduceVisualDensity,
      shouldIncreaseContrast: neuroState.uiProfile.shouldIncreaseContrast,
      shouldPrioritizeRecommendations: neuroState.uiProfile.shouldPrioritizeRecommendations,
      reason: neuroState.uiProfile.reason
    }),
    [neuroState]
  );
}

