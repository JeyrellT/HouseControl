import { formatDateTime, formatRelativeMinutes } from "../../utils/formatters.js";

function formatAdaptiveMode(mode) {
  if (!mode) {
    return "Adaptive mode";
  }

  return mode
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function formatCognitiveLoad(load) {
  if (!load) {
    return "Stable";
  }

  return load.charAt(0).toUpperCase() + load.slice(1);
}

export function OverviewHero({ context }) {
  return (
    <section className="card overview-hero" aria-label="Contexto actual del dashboard">
      <div className="overview-hero__content">
        <div className="overview-hero__eyebrow">
          <span className="badge">Overview</span>
          <span className="overview-hero__timestamp">
            Actualizado {formatRelativeMinutes(context.lastUpdatedAt)}
          </span>
        </div>

        <div className="overview-hero__copy">
          <p className="overview-section-label">Contexto actual</p>
          <h3 className="overview-hero__title">
            {context.activeRoomName} esta lista para la siguiente accion recomendada.
          </h3>
          <p className="text-muted overview-hero__description">
            {context.nextActionDescription}
          </p>
        </div>

        <div className="overview-hero__chips" aria-label="Estado actual">
          <span className="overview-chip">
            {context.roomOnlineCount}/{context.roomDeviceCount} devices online
          </span>
          <span className="overview-chip">{formatCognitiveLoad(context.cognitiveLoad)} load</span>
          <span className="overview-chip">{formatAdaptiveMode(context.adaptiveMode)}</span>
        </div>
      </div>

      <aside className="overview-hero__spotlight" aria-label="Next best action">
        <p className="overview-section-label">Next best action</p>
        <strong className="overview-hero__spotlight-title">{context.nextActionTitle}</strong>
        <p className="text-muted">{context.nextActionDescription}</p>

        <dl className="overview-hero__meta">
          <div>
            <dt className="overview-meta-label">Recommendations</dt>
            <dd>{context.recommendationCount} abiertas</dd>
          </div>
          <div>
            <dt className="overview-meta-label">Cognitive score</dt>
            <dd>{context.cognitiveScore}/100</dd>
          </div>
          <div>
            <dt className="overview-meta-label">Last signal</dt>
            <dd>{formatDateTime(context.lastSignalAt)}</dd>
          </div>
        </dl>
      </aside>
    </section>
  );
}
