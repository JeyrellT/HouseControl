const priorityWeight = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

function formatImpactLabel(impact) {
  return `${impact}%`;
}

export function selectCurrentRoute(state) {
  return state.ui.currentRoute;
}

export function selectUiState(state) {
  return state.ui;
}

export function selectVisibleRecommendations(state) {
  const { recommendationsDomain, recommendationsStatus } = state.ui.filters;
  const items = [...state.recommendations.items];

  const filteredItems = items.filter((item) => {
    const matchesDomain = recommendationsDomain === "all" || item.domain === recommendationsDomain;
    const matchesStatus = recommendationsStatus === "all" || item.status === recommendationsStatus;
    return matchesDomain && matchesStatus;
  });

  filteredItems.sort((left, right) => {
    if (state.recommendations.sortBy === "confidence") {
      return right.confidence - left.confidence;
    }

    return priorityWeight[right.priority] - priorityWeight[left.priority];
  });

  return filteredItems;
}

export function selectActiveRecommendationBundle(state) {
  const visibleRecommendations = selectVisibleRecommendations(state);
  const fallbackRecommendation = visibleRecommendations[0] ?? state.recommendations.items[0] ?? null;
  const activeRecommendation =
    state.recommendations.items.find((item) => item.id === state.recommendations.activeId) ?? fallbackRecommendation;

  return {
    recommendation: activeRecommendation,
    explanation: activeRecommendation ? state.recommendations.explanationsById[activeRecommendation.id] ?? null : null
  };
}

export function selectOverviewViewModel(state) {
  const visibleRecommendations = selectVisibleRecommendations(state);
  const health = state.monitoring.health;
  const events = state.monitoring.events.slice(0, 4);
  const connectedPlatforms = state.monitoring.platforms.filter((item) => item.state === "healthy").length;
  const highlightedModules = state.session.futureReadiness.filter((item) =>
    state.ui.highlightedModules.includes(item.id)
  );

  return {
    hero: {
      eyebrow: "Nexus Control Center",
      title: "Una base frontend premium, modular y lista para crecer",
      description:
        "Visibilidad operativa, recomendaciones explicables y readiness real-time en una sola experiencia diseñada para reducir carga cognitiva.",
      tag: state.session.mockMode ? "Modo mock activo" : "Modo live"
    },
    kpis: [
      {
        id: "health",
        label: "Health score",
        value: health ? `${health.score}/100` : "N/A",
        hint: health ? `${health.trend} vs. ciclo anterior` : "Esperando snapshot"
      },
      {
        id: "recommendations",
        label: "Recomendaciones abiertas",
        value: `${visibleRecommendations.length}`,
        hint: `${visibleRecommendations.filter((item) => item.priority === "critical").length} críticas`
      },
      {
        id: "platforms",
        label: "Plataformas estables",
        value: `${connectedPlatforms}/${state.monitoring.platforms.length || 0}`,
        hint: "Listas para futuros adapters"
      },
      {
        id: "impact",
        label: "Impacto agregado",
        value: `${visibleRecommendations.reduce((sum, item) => sum + item.impact, 0)}%`,
        hint: "Oportunidad priorizada"
      }
    ],
    health,
    activity: events,
    modules: highlightedModules,
    readiness: state.session.futureReadiness
  };
}

export function selectRecommendationsViewModel(state) {
  const items = selectVisibleRecommendations(state);

  return {
    items: items.map((item) => ({
      ...item,
      impactLabel: formatImpactLabel(item.impact)
    })),
    status: state.recommendations.status,
    sortBy: state.recommendations.sortBy,
    availableDomains: ["all", ...new Set(state.recommendations.items.map((item) => item.domain))],
    availableStatuses: ["all", ...new Set(state.recommendations.items.map((item) => item.status))]
  };
}

export function selectMonitoringViewModel(state) {
  const platforms = state.monitoring.platforms;
  const healthyCount = platforms.filter((item) => item.state === "healthy").length;
  const watchCount = platforms.filter((item) => item.state === "watch").length;

  return {
    status: state.monitoring.status,
    health: state.monitoring.health,
    gateway: state.monitoring.gateway,
    events: state.monitoring.events,
    platforms,
    summary: {
      healthyCount,
      watchCount,
      totalCount: platforms.length
    }
  };
}

export function selectSessionSummary(state) {
  return {
    mockMode: state.session.mockMode,
    error: state.session.error,
    lastSyncedAt: state.session.lastSyncedAt
  };
}
