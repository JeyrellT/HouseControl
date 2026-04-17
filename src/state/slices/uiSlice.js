import { UI_MODES } from "../../utils/constants.js";
import { NEXUS_ACTIONS } from "../actions.js";

export function uiReducer(state, action) {
  switch (action.type) {
    case NEXUS_ACTIONS.SET_ACTIVE_PAGE:
      if (state.activePage === action.payload) {
        return state;
      }

      return {
        ...state,
        activePage: action.payload
      };

    case NEXUS_ACTIONS.SET_ACTIVE_ROOM:
      if (state.activeRoomId === action.payload) {
        return state;
      }

      return {
        ...state,
        activeRoomId: action.payload
      };

    case NEXUS_ACTIONS.TOGGLE_THEME:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          theme: state.preferences.theme === UI_MODES.DARK ? UI_MODES.LIGHT : UI_MODES.DARK
        }
      };

    case NEXUS_ACTIONS.SET_THEME:
      if (state.preferences.theme === action.payload) {
        return state;
      }

      return {
        ...state,
        preferences: {
          ...state.preferences,
          theme: action.payload
        }
      };

    case NEXUS_ACTIONS.TOGGLE_DENSITY_MODE:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          densityMode:
            state.preferences.densityMode === UI_MODES.FOCUS ? UI_MODES.COMFORT : UI_MODES.FOCUS
        }
      };

    case NEXUS_ACTIONS.TOGGLE_PANEL:
      return {
        ...state,
        openPanels: {
          ...state.openPanels,
          [action.payload]: !state.openPanels[action.payload]
        }
      };

    case NEXUS_ACTIONS.HYDRATE_UI_PREFERENCES:
      return {
        ...state,
        activePage: action.payload.activePage ?? state.activePage,
        activeRoomId:
          action.payload.activeRoomId === undefined ? state.activeRoomId : action.payload.activeRoomId,
        openPanels: {
          ...state.openPanels,
          ...(action.payload.openPanels ?? {})
        },
        preferences: {
          ...state.preferences,
          ...(action.payload.preferences ?? {})
        }
      };

    default:
      return state;
  }
}

