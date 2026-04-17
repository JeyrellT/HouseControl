import { EmptyState } from "../feedback/EmptyState.jsx";

function formatPriority(priority) {
  if (!priority) {
    return "Normal";
  }

  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function InsightsPanel({ insight }) {
  return (
    <section className="card overview-panel" aria-labelledby="insights-panel-title">
      <div className="overview-panel__header">
        <div>
          <p className="overview-section-label">Insights</p>
          <h3 id="insights-panel-title">Why this recommendation appears</h3>
        </div>
        {insight ? (
          <span className="overview-priority-pill" data-priority={insight.priority}>
            {formatPriority(insight.priority)} priority
          </span>
        ) : null}
      </div>

      {!insight ? (
        <EmptyState
          title="Selecciona una recomendacion."
          description="El panel de insights explica por que Nexus esta priorizando esa accion."
          hint="Cuando elijas una recomendacion, veras contexto, confianza y señales relevantes."
        />
      ) : (
        <>
          <div className="overview-insight-feature">
            <div className="overview-insight-feature__copy">
              <span className="badge">{insight.confidence}% confidence</span>
              <strong className="overview-insight-feature__title">{insight.title}</strong>
              <p className="text-muted">{insight.rationale}</p>
            </div>

            <div className="overview-insight-feature__action">
              <p className="overview-meta-label">Recommended follow-up</p>
              <p>{insight.action}</p>
            </div>
          </div>

          <div className="overview-insight-grid">
            {insight.signals.map((signal) => (
              <article key={signal.id} className="overview-insight-card">
                <p className="overview-meta-label">{signal.label}</p>
                <strong>{signal.value}</strong>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
