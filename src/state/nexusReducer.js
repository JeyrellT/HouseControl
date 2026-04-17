import { activityReducer } from "./slices/activitySlice.js";
import { devicesReducer } from "./slices/devicesSlice.js";
import { neuroReducer } from "./slices/neuroSlice.js";
import { recommendationsReducer } from "./slices/recommendationsSlice.js";
import { staticSliceReducer } from "./slices/staticSlice.js";
import { uiReducer } from "./slices/uiSlice.js";

function assembleNextState(state, action) {
  const nextUi = uiReducer(state.ui, action);
  const nextRooms = staticSliceReducer(state.rooms, action);
  const nextScenes = staticSliceReducer(state.scenes, action);
  const nextAutomations = staticSliceReducer(state.automations, action);
  const nextPlatforms = staticSliceReducer(state.platforms, action);
  const nextDevices = devicesReducer(state.devices, action, state);
  const nextRecommendations = recommendationsReducer(state.recommendations, action, state);
  const nextNeuro = neuroReducer(state.neuro, action, state);

  const interimState = {
    ...state,
    ui: nextUi,
    rooms: nextRooms,
    scenes: nextScenes,
    automations: nextAutomations,
    platforms: nextPlatforms,
    devices: nextDevices,
    recommendations: nextRecommendations,
    neuro: nextNeuro
  };

  const nextActivity = activityReducer(state.activity, action, state, interimState);

  return {
    ...interimState,
    activity: nextActivity
  };
}

export function nexusReducer(state, action) {
  const nextState = assembleNextState(state, action);

  return Object.keys(nextState).every((sliceKey) => nextState[sliceKey] === state[sliceKey])
    ? state
    : nextState;
}

