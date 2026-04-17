import { EmptyState } from "../feedback/EmptyState.jsx";

function formatPriority(priority) {
  if (!priority) {
    return "Normal";
  }

  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatConfidence(confidence) {
  return `${Math.round(confidence * 100)}% confidence`;
}

export function SuggestedActionsPanel({
  recommendations,
  selectedRecommendationId,
  onSelectRecommendation,
  onDismissRecommendation
}) {
  return (
    <section className="card overview-panel" aria-labelledby="suggested-actions-title">
      <div className="overview-panel__header">
        <div>
          <p className="overview-section-label">Recomendaciones</p>
          <h3 id="suggested-actions-title">Suggested actions</h3>
        </div>
        <span className="overview-counter">{recommendations.length} activas</span>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          title="No hay acciones urgentes."
          description="El sistema no detecta recomendaciones activas despues de los dismiss."
          hint="Cuando aparezcan nuevas recomendaciones, este panel volvera a priorizar la siguiente mejor accion."
        />
      ) : (
        <div className="overview-action-list" role="list" aria-label="Recomendaciones visibles">
          {recommendations.map((recommendation, index) => {
            const isSelected = recommendation.id === selectedRecommendationId;

            return (
              <article
                key={recommendation.id}
                className="overview-action-card"
                data-selected={isSelected ? "true" : "false"}
                role="listitem"
              >
                <button
                  type="button"
                  className="overview-action-card__main"
                  onClick={() => onSelectRecommendation(recommendation.id)}
                  aria-pressed={isSelected}
                  aria-label={`Seleccionar recomendacion ${recommendation.title}`}
                >
                  <div className="overview-action-card__topline">
                    <div className="overview-action-card__badges">
                      {index === 0 ? <span className="badge">Next</span> : null}
                      <span className="overview-priority-pill" data-priority={recommendation.priority}>
                        {formatPriority(recommendation.priority)}
                      </span>
                    </div>
                    <span className="text-soft">{formatConfidence(recommendation.confidence)}</span>
                  </div>

                  <strong className="overview-action-card__title">{recommendation.title}</strong>
                  <p className="text-muted">{recommendation.action}</p>
                </button>

                <button
                  type="button"
                  className="overview-ghost-button"
                  onClick={() => onDismissRecommendation(recommendation.id)}
                  aria-label={`Descartar recomendacion ${recommendation.title}`}
                >
                  Dismiss
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
