export function PanelCard({
  title,
  subtitle,
  panelId,
  isCollapsed,
  onToggle,
  actions,
  children,
  className = ""
}) {
  return (
    <section className={`panel-card ${className}`.trim()} aria-labelledby={`${panelId}-title`}>
      <div className="panel-card__header">
        <div>
          <p className="panel-card__subtitle">{subtitle}</p>
          <h2 id={`${panelId}-title`} className="panel-card__title">
            {title}
          </h2>
        </div>
        <div className="panel-card__actions">
          {actions}
          {onToggle ? (
            <button
              type="button"
              className="panel-card__toggle"
              aria-expanded={!isCollapsed}
              aria-controls={`${panelId}-content`}
              onClick={() => onToggle(panelId)}
            >
              {isCollapsed ? "Expandir" : "Contraer"}
            </button>
          ) : null}
        </div>
      </div>
      <div
        id={`${panelId}-content`}
        className={`panel-card__content ${isCollapsed ? "is-collapsed" : ""}`}
        hidden={isCollapsed}
      >
        {children}
      </div>
    </section>
  );
}
