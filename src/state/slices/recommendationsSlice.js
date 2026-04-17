import { NEXUS_ACTIONS } from "../actions.js";

export function recommendationsReducer(state, action) {
  switch (action.type) {
    case NEXUS_ACTIONS.DISMISS_RECOMMENDATION:
      if (state.dismissedIds.includes(action.payload)) {
        return state;
      }

      return {
        ...state,
        dismissedIds: [...state.dismissedIds, action.payload]
      };

    default:
      return state;
  }
}

