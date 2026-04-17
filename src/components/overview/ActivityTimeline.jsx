import { EmptyState } from "../feedback/EmptyState.jsx";
import { formatDateTime, formatRelativeMinutes } from "../../utils/formatters.js";

export function ActivityTimeline({ items }) {
  return (
    <section className="card overview-panel" aria-labelledby="activity-timeline-title">
      <div className="overview-panel__header">
        <div>
          <p className="overview-section-label">Actividad reciente</p>
          <h3 id="activity-timeline-title">Recent activity</h3>
        </div>
        <span className="overview-counter">{items.length} eventos</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No hay actividad reciente."
          description="Cuando el sistema registre eventos, apareceran aqui en orden cronologico."
        />
      ) : (
        <ol className="overview-timeline">
          {items.map((item) => (
            <li key={item.id} className="overview-timeline__item">
              <div className="overview-timeline__marker" aria-hidden="true" />
              <div className="overview-timeline__content">
                <div className="overview-timeline__header">
                  <strong>{item.label}</strong>
                  <span className="text-soft">{formatRelativeMinutes(item.timestamp)}</span>
                </div>
                <p className="text-muted">{formatDateTime(item.timestamp)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
