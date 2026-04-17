export function KpiCard({ label, value, hint }) {
  return (
    <article className="kpi-card">
      <span className="kpi-card__label">{label}</span>
      <strong className="kpi-card__value">{value}</strong>
      <p className="kpi-card__hint">{hint}</p>
    </article>
  );
}
