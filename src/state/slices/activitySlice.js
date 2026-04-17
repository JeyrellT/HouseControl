import { NEXUS_ACTIONS } from "../actions.js";

function createActivityEntry(type, label) {
  return {
    id: `activity-${Date.now()}`,
    type,
    label,
    timestamp: new Date().toISOString()
  };
}

export function activityReducer(state, action, rootState, nextState) {
  switch (action.type) {
    case NEXUS_ACTIONS.APPEND_ACTIVITY:
      return {
        ...state,
        items: [action.payload, ...state.items]
      };

    case NEXUS_ACTIONS.TOGGLE_DEVICE_POWER: {
      const device = rootState.devices.byId[action.payload];

      if (!device) {
        return state;
      }

      const entry = createActivityEntry(
        "device-power-toggled",
        `${device.name} ${device.state?.power ? "se apago" : "se encendio"} desde Nexus.`
      );

      return {
        ...state,
        items: [entry, ...state.items]
      };
    }

    case NEXUS_ACTIONS.SET_DEVICE_BRIGHTNESS: {
      const device = rootState.devices.byId[action.payload.deviceId];

      if (!device) {
        return state;
      }

      const entry = createActivityEntry(
        "device-brightness-set",
        `${device.name} ajusto brillo a ${nextState.devices.byId[action.payload.deviceId].state.brightness}%.`
      );

      return {
        ...state,
        items: [entry, ...state.items]
      };
    }

    case NEXUS_ACTIONS.APPLY_SCENE: {
      const scene = rootState.scenes.byId[action.payload];

      if (!scene) {
        return state;
      }

      return {
        ...state,
        items: [createActivityEntry("scene-applied", `Se aplico la escena ${scene.name}.`), ...state.items]
      };
    }

    default:
      return state;
  }
}

