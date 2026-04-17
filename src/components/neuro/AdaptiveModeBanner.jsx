import { useAdaptiveDensity } from "../../hooks/useAdaptiveDensity.js";
import { useNeuroState } from "../../hooks/useNeuroState.js";

export function AdaptiveModeBanner() {
  const adaptiveDensity = useAdaptiveDensity();
  const neuroState = useNeuroState();

  return (
    <section className="card neuro-banner" aria-labelledby="adaptive-mode-banner-title">
      <div className="neuro-banner__header">
        <div>
          <p className="overview-section-label">Adaptive mode</p>
          <h3 id="adaptive-mode-banner-title">{neuroState.adaptiveModeLabel}</h3>
        </div>
        <span
          className="overview-priority-pill"
          data-priority={adaptiveDensity.isSimplifiedMode ? "medium" : "low"}
        >
          {adaptiveDensity.recommendedMode}
        </span>
      </div>

      <p className="text-muted">{adaptiveDensity.reason}</p>

      <div className="neuro-banner__signals" aria-label="Decisiones de interfaz sugeridas">
        <span className="overview-chip">
          Density {adaptiveDensity.shouldReduceVisualDensity ? "reduce" : "standard"}
        </span>
        <span className="overview-chip">
          Contrast {adaptiveDensity.shouldIncreaseContrast ? "increase" : "standard"}
        </span>
        <span className="overview-chip">
          Recommendations {adaptiveDensity.shouldPrioritizeRecommendations ? "prioritized" : "normal"}
        </span>
      </div>
    </section>
  );
}
