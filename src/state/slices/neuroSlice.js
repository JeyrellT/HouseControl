import { NEXUS_ACTIONS } from "../actions.js";

export function neuroReducer(state, action) {
  switch (action.type) {
    case NEXUS_ACTIONS.SET_NEURO_STATE:
      return {
        ...state,
        ...action.payload,
        lastSignalAt: action.payload.lastSignalAt ?? new Date().toISOString()
      };

    default:
      return state;
  }
}

