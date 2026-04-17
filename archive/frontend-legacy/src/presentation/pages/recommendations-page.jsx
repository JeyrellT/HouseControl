import { EmptyState } from "../components/empty-state.jsx";
import { PanelCard } from "../components/panel-card.jsx";
import { StatusBadge } from "../components/status-badge.jsx";

function FilterGroup({ label, value, options, onChange, id }) {
  return (
    <label className="filter-group" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? "Todos" : option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RecommendationsPage({
  model,
  activeRecommendation,
  filters,
  collapsedPanels,
  onPanelToggle,
  onFilterChange,
  onSortChange,
  onRecommendationSelect
}) {
  return (
    <div className="page-grid page-grid--recommendations">
      <PanelCard
        title="Recomendaciones priorizadas"
        subtitle="Explainability first"
        panelId="recommendations-list"
        actions={
          <div className="filter-bar">
            <FilterGroup
              id="recommendations-domain"
              label="Dominio"
              value={filters.recommendationsDomain}
              options={model.availableDomains}
              onChange={(value) => onFilterChange("recommendationsDomain", value)}
            />
            <FilterGroup
              id="recommendations-status"
              label="Estado"
              value={filters.recommendationsStatus}
              options={model.availableStatuses}
              onChange={(value) => onFilterChange("recommendationsStatus", value)}
            />
            <FilterGroup
              id="recommendations-sort"
              label="Orden"
              value={model.sortBy}
              options={["priority", "confidence"]}
              onChange={onSortChange}
            />
          </div>
        }
      >
        {model.items.length === 0 ? (
          <EmptyState
            title="No hay recomendaciones activas"
            description="Ajusta filtros o espera la próxima carga mock para poblar este módulo."
          />
        ) : (
          <ul className="recommendation-list" aria-label="Lista de recomendaciones">
            {model.items.map((item) => {
              const isActive = activeRecommendation.recommendation?.id === item.id;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`recommendation-card ${isActive ? "is-active" : ""}`}
                    aria-pressed={isActive}
                    onClick={() => onRecommendationSelect(item.id)}
                  >
                    <div className="recommendation-card__header">
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.summary}</p>
                      </div>
                      <StatusBadge label={item.priority} status={item.priority} />
                    </div>
                    <div className="recommendation-card__meta">
                      <span>Dominio: {item.domain}</span>
                      <span>Confianza: {item.confidence}%</span>
                      <span>Impacto: {item.impactLabel}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PanelCard>

      <PanelCard
        title="Explainability"
        subtitle="Por qué aparece esta recomendación"
        panelId="recommendationsExplainability"
        isCollapsed={collapsedPanels.recommendationsExplainability}
        onToggle={onPanelToggle}
      >
        {activeRecommendation.recommendation && activeRecommendation.explanation ? (
          <div className="explainability-card">
            <div className="explainability-card__header">
              <strong>{activeRecommendation.recommendation.title}</strong>
              <StatusBadge label={activeRecommendation.recommendation.status} status={activeRecommendation.recommendation.status} />
            </div>
            <dl className="explainability-grid">
              <div>
                <dt>Por qué aparece</dt>
                <dd>{activeRecommendation.explanation.whyShown}</dd>
              </div>
              <div>
                <dt>Resultado esperado</dt>
                <dd>{activeRecommendation.explanation.expectedOutcome}</dd>
              </div>
              <div>
                <dt>Nivel de riesgo</dt>
                <dd>{activeRecommendation.explanation.riskLevel}</dd>
              </div>
              <div>
                <dt>Razón visible para el usuario</dt>
                <dd>{activeRecommendation.explanation.userFacingReason}</dd>
              </div>
            </dl>

            <div>
              <h3>Signals</h3>
              <ul className="signal-list">
                {activeRecommendation.explanation.signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Sin recomendación seleccionada"
            description="Selecciona un item para revisar sus señales y el motivo de priorización."
          />
        )}
      </PanelCard>
    </div>
  );
}
