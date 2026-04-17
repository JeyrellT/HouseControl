import { EmptyState } from "../components/empty-state.jsx";
import { PanelCard } from "../components/panel-card.jsx";
import { StatusBadge } from "../components/status-badge.jsx";

export function MonitoringPage({ model, collapsedPanels, onPanelToggle }) {
  return (
    <div className="page-grid page-grid--monitoring">
      <PanelCard title="System health" subtitle="Snapshot operacional" panelId="monitoring-health">
        {model.health ? (
          <div className="metric-cluster">
            <article>
              <span>Score</span>
              <strong>{model.health.score}</strong>
            </article>
            <article>
              <span>Tendencia</span>
              <strong>{model.health.trend}</strong>
            </article>
            <article>
              <span>Plataformas healthy</span>
              <strong>
                {model.summary.healthyCount}/{model.summary.totalCount}
              </strong>
            </article>
          </div>
        ) : (
          <EmptyState title="Sin salud disponible" description="El snapshot mock todavía no está listo." />
        )}
      </PanelCard>

      <PanelCard title="Gateway readiness" subtitle="Real-time ready" panelId="monitoring-gateway">
        {model.gateway ? (
          <div className="gateway-card">
            <div className="gateway-card__head">
              <strong>{model.gateway.transport}</strong>
              <StatusBadge label={model.gateway.state} status={model.gateway.state} />
            </div>
            <p>Canales listos: {model.gateway.channelsReady.join(", ")}</p>
          </div>
        ) : (
          <EmptyState title="Gateway inactivo" description="El placeholder no reportó estado todavía." />
        )}
      </PanelCard>

      <PanelCard
        title="Plataformas mock"
        subtitle="Preparación multi-plataforma"
        panelId="monitoringPlatforms"
        isCollapsed={collapsedPanels.monitoringPlatforms}
        onToggle={onPanelToggle}
      >
        {model.platforms.length === 0 ? (
          <EmptyState title="Sin plataformas" description="Aún no se cargaron estados mock de integraciones." />
        ) : (
          <ul className="platform-list">
            {model.platforms.map((platform) => (
              <li key={platform.id} className="platform-list__item">
                <div>
                  <strong>{platform.name}</strong>
                  <p>{platform.notes}</p>
                </div>
                <div className="platform-list__meta">
                  <StatusBadge label={platform.state} status={platform.state} />
                  <span>{platform.latencyLabel}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard
        title="Feed de eventos"
        subtitle="Simulación operacional"
        panelId="monitoringEvents"
        isCollapsed={collapsedPanels.monitoringEvents}
        onToggle={onPanelToggle}
      >
        {model.events.length === 0 ? (
          <EmptyState title="Sin eventos" description="El feed simulado está vacío en este momento." />
        ) : (
          <ul className="timeline-list">
            {model.events.map((event) => (
              <li key={event.id} className="timeline-list__item">
                <StatusBadge label={event.severity} status={event.severity} />
                <div>
                  <strong>{event.title}</strong>
                  <p>
                    {new Intl.DateTimeFormat("es-GT", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short"
                    }).format(new Date(event.timestamp))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}
