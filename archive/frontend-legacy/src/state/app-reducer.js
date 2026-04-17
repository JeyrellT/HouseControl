import { getDefaultPersistedUi } from "./persistence.js";

function getDefaultCollapsedPanels() {
  return {
    overviewActivity: false,
    overviewReadiness: false,
    recommendationsExplainability: false,
    monitoringPlatforms: false,
    monitoringEvents: false
  };
}

export function createInitialState({ route, persistedUI } = {}) {
  const safeUi = persistedUI ?? getDefaultPersistedUi();

  return {
    ui: {
      currentRoute: route ?? "overview",
      density: safeUi.density,
      railCollapsed: safeUi.railCollapsed,
      collapsedPanels: {
        ...getDefaultCollapsedPanels(),
        ...safeUi.collapsedPanels
      },
      highlightedModules: safeUi.highlightedModules,
      filters: {
        recommendationsDomain: safeUi.filters.recommendationsDomain,
        recommendationsStatus: safeUi.filters.recommendationsStatus
      }
    },
    recommendations: {
      items: [],
      explanationsById: {},
      activeId: null,
      sortBy: "priority",
      status: "idle"
    },
    monitoring: {
      health: null,
      events: [],
      platforms: [],
      gateway: null,
      status: "idle"
    },
    session: {
      mockMode: true,
      error: null,
      lastHydratedAt: new Date().toISOString(),
      lastSyncedAt: null,
      futureReadiness: []
    }
  };
}

export function appReducer(state, action) {
  switch (action.type) {
    case "SET_ROUTE":
      return {
        ...state,
        ui: {
          ...state.ui,
          currentRoute: action.payload
        }
      };
    case "SET_DENSITY":
      return {
        ...state,
        ui: {
          ...state.ui,
          density: action.payload
        }
      };
    case "TOGGLE_RAIL":
      return {
        ...state,
        ui: {
          ...state.ui,
          railCollapsed: !state.ui.railCollapsed
        }
      };
    case "TOGGLE_PANEL":
      return {
        ...state,
        ui: {
          ...state.ui,
          collapsedPanels: {
            ...state.ui.collapsedPanels,
            [action.payload]: !state.ui.collapsedPanels[action.payload]
          }
        }
      };
    case "SET_UI_FILTER":
      return {
        ...state,
        ui: {
          ...state.ui,
          filters: {
            ...state.ui.filters,
            [action.payload.filterKey]: action.payload.value
          }
        }
      };
    case "SET_RECOMMENDATION_SORT":
      return {
        ...state,
        recommendations: {
          ...state.recommendations,
          sortBy: action.payload
        }
      };
    case "SELECT_RECOMMENDATION":
      return {
        ...state,
        recommendations: {
          ...state.recommendations,
          activeId: action.payload
        }
      };
    case "TOGGLE_HIGHLIGHTED_MODULE": {
      const moduleId = action.payload;
      const isHighlighted = state.ui.highlightedModules.includes(moduleId);
      const nextModules = isHighlighted
        ? state.ui.highlightedModules.filter((item) => item !== moduleId)
        : [...state.ui.highlightedModules, moduleId];

      return {
        ...state,
        ui: {
          ...state.ui,
          highlightedModules: nextModules
        }
      };
    }
    case "LOAD_DASHBOARD_REQUEST":
      return {
        ...state,
        recommendations: {
          ...state.recommendations,
          status: "loading"
        },
        monitoring: {
          ...state.monitoring,
          status: "loading"
        },
        session: {
          ...state.session,
          error: null
        }
      };
    case "LOAD_DASHBOARD_SUCCESS": {
      const nextItems = action.payload.recommendations ?? [];
      const activeId = nextItems.length > 0 ? nextItems[0].id : null;

      return {
        ...state,
        recommendations: {
          ...state.recommendations,
          items: nextItems,
          explanationsById: action.payload.explanationsById ?? {},
          activeId,
          status: "ready"
        },
        monitoring: {
          ...state.monitoring,
          health: action.payload.health ?? null,
          events: action.payload.events ?? [],
          platforms: action.payload.platforms ?? [],
          gateway: action.payload.gateway ?? null,
          status: "ready"
        },
        session: {
          ...state.session,
          error: null,
          lastSyncedAt: new Date().toISOString(),
          futureReadiness: action.payload.futureReadiness ?? []
        }
      };
    }
    case "LOAD_DASHBOARD_FAILURE":
      return {
        ...state,
        recommendations: {
          ...state.recommendations,
          status: "error"
        },
        monitoring: {
          ...state.monitoring,
          status: "error"
        },
        session: {
          ...state.session,
          error: action.payload
        }
      };
    default:
      return state;
  }
}
