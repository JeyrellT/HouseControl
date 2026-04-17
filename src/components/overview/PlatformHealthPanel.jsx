import { DegradedState } from "../feedback/DegradedState.jsx";
import { EmptyState } from "../feedback/EmptyState.jsx";
import { formatRelativeMinutes } from "../../utils/formatters.js";

export function PlatformHealthPanel({ platforms, summary }) {
  const hasDegradedState = summary.degraded > 0 || summary.offline > 0;

  return (
    <section className="card overview-panel" aria-labelledby="platform-health-title">
      <div className="overview-panel__header">
        <div>
          <p className="overview-section-label">Salud de plataforma</p>
          <h3 id="platform-health-title">Platform health</h3>
        </div>
        <div className="overview-inline-stats" aria-label="Resumen de plataformas">
          <span>{summary.online} online</span>
          <span>{summary.degraded} degraded</span>
          <span>{summary.offline} offline</span>
        </div>
      </div>

      {platforms.length === 0 ? (
        <EmptyState
          title="No hay plataformas registradas."
          description="Todavia no existe informacion de health para integraciones locales."
        />
      ) : (
        <>
          {hasDegradedState ? (
            <DegradedState
              title="Al menos una plataforma requiere atencion."
              description="Nexus sigue operativo, pero detecta capacidad parcial o perdida en parte del stack."
              hint="Revisa primero las plataformas degradadas u offline antes de crear nuevas automatizaciones."
            />
          ) : null}

          <div className="overview-platform-list" role="list" aria-label="Estado de plataformas">
            {platforms.map((platform) => (
              <article key={platform.id} className="overview-platform-card" role="listitem">
                <div className="overview-platform-card__header">
                  <div>
                    <strong>{platform.label}</strong>
                    <p className="text-muted">{platform.detail}</p>
                  </div>
                  <span className="overview-status-pill" data-status={platform.status}>
                    {platform.status}
                  </span>
                </div>

                <dl className="overview-platform-card__metrics">
                  <div>
                    <dt className="overview-meta-label">Latency</dt>
                    <dd>{platform.latencyMs} ms</dd>
                  </div>
                  <div>
                    <dt className="overview-meta-label">Capabilities</dt>
                    <dd>{platform.capabilityCount}</dd>
                  </div>
                  <div>
                    <dt className="overview-meta-label">Last sync</dt>
                    <dd>{formatRelativeMinutes(platform.lastSyncAt)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
