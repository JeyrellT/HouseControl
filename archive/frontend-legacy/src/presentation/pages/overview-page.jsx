import { EmptyState } from "../components/empty-state.jsx";
import { KpiCard } from "../components/kpi-card.jsx";
import { PanelCard } from "../components/panel-card.jsx";
import { StatusBadge } from "../components/status-badge.jsx";

export function OverviewPage({
  model,
  collapsedPanels,
  highlightedModules,
  onPanelToggle,
  onModuleToggle
}) {
  return (
    <div className="page-grid">
      <section className="hero-banner">
        <div>
          <p className="hero-banner__eyebrow">{model.hero.eyebrow}</p>
          <h2 className="hero-banner__title">{model.hero.title}</h2>
          <p className="hero-banner__description">{model.hero.description}</p>
        </div>
        <StatusBadge label={model.hero.tag} status="ready" />
      </section>

      <section className="kpi-grid" aria-label="Indicadores principales">
        {model.kpis.map((item) => (
          <KpiCard key={item.id} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </section>

      <PanelCard title="Health snapshot" subtitle="Visión ejecutiva" panelId="overview-health">
        {model.health ? (
          <div className="metric-cluster">
            <article>
              <span>Incidentes</span>
              <strong>{model.health.incidents}</strong>
            </article>
            <article>
              <span>Watch items</span>
              <strong>{model.health.watchItems}</strong>
            </article>
            <article>
              <span>Cobertura</span>
              <strong>{model.health.coverage}</strong>
            </article>
          </div>
        ) : (
          <EmptyState title="Sin snapshot" description="El servicio mock aún no devolvió salud del sistema." />
        )}
      </PanelCard>

      <PanelCard
        title="Actividad reciente"
        subtitle="Señales mock"
        panelId="overviewActivity"
        isCollapsed={collapsedPanels.overviewActivity}
        onToggle={onPanelToggle}
      >
        {model.activity.length === 0 ? (
          <EmptyState title="Sin eventos" description="El feed simulado no reporta actividad reciente." />
        ) : (
          <ul className="timeline-list">
            {model.activity.map((event) => (
              <li key={event.id} className="timeline-list__item">
                <StatusBadge label={event.severity} status={event.severity} />
                <div>
                  <strong>{event.title}</strong>
                  <p>
                    {new Intl.DateTimeFormat("es-GT", { hour: "2-digit", minute: "2-digit" }).format(
                      new Date(event.timestamp)
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard
        title="Spotlight de módulos"
        subtitle="Progressive disclosure"
        panelId="overview-modules"
      >
        <div className="module-grid">
          {model.modules.length === 0 ? (
            <EmptyState title="Sin módulos destacados" description="Activa módulos para fijarlos en el overview." />
          ) : (
            model.modules.map((module) => (
              <button
                key={module.id}
                type="button"
                className={`module-card ${highlightedModules.includes(module.id) ? "is-selected" : ""}`}
                aria-pressed={highlightedModules.includes(module.id)}
                onClick={() => onModuleToggle(module.id)}
              >
                <div className="module-card__header">
                  <strong>{module.title}</strong>
                  <StatusBadge label={module.readiness} status={module.readiness} />
                </div>
                <p>{module.detail}</p>
              </button>
            ))
          )}
        </div>
      </PanelCard>

      <PanelCard
        title="Future readiness"
        subtitle="Capacidades preparadas"
        panelId="overviewReadiness"
        isCollapsed={collapsedPanels.overviewReadiness}
        onToggle={onPanelToggle}
      >
        <ul className="readiness-list">
          {model.readiness.map((item) => (
            <li key={item.id} className="readiness-list__item">
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <StatusBadge label={item.readiness} status={item.readiness} />
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
