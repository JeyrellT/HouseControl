import { useDashboardKpis } from "../../state/hooks/useSelectors.js";

export function KPIGrid() {
  const items = useDashboardKpis();

  return (
    <section aria-label="KPIs principales" className="kpi-grid">
      {items.map((item) => (
        <article key={item.id} className="stat-card overview-kpi-card" data-tone={item.tone}>
          <p className="overview-section-label">{item.label}</p>
          <strong className="overview-kpi-card__value">{item.value}</strong>
          <p className="text-muted">{item.hint}</p>
        </article>
      ))}
    </section>
  );
}
