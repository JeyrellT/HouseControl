import { formatRelativeMinutes } from "../../utils/formatters.js";
import { useNeuroState } from "../../hooks/useNeuroState.js";

export function CognitiveLoadIndicator() {
  const neuroState = useNeuroState();

  return (
    <section className="card neuro-card" aria-labelledby="cognitive-load-indicator-title">
      <div className="neuro-card__header">
        <div>
          <p className="overview-section-label">Neuro ready</p>
          <h3 id="cognitive-load-indicator-title">Cognitive load</h3>
        </div>
        <span className="overview-counter">{neuroState.cognitiveScoreLabel}</span>
      </div>

      <div className="neuro-load-grid">
        <article className="neuro-load-metric">
          <p className="overview-meta-label">Load</p>
          <strong>{neuroState.cognitiveLoadLabel}</strong>
        </article>
        <article className="neuro-load-metric">
          <p className="overview-meta-label">Score</p>
          <strong>{neuroState.cognitiveScoreLabel}</strong>
        </article>
        <article className="neuro-load-metric">
          <p className="overview-meta-label">ErrP</p>
          <strong>{neuroState.errpDetected ? "Detected" : "Stable"}</strong>
        </article>
      </div>

      <div className="neuro-inline-status">
        <span className="overview-chip">{neuroState.errpDetectedLabel}</span>
        <span className="text-soft">Last signal {formatRelativeMinutes(neuroState.lastSignalAt)}</span>
      </div>
    </section>
  );
}
