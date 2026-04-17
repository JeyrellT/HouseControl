import { NEXUS_ACTIONS } from "../actions.js";
import { updateNormalizedItem } from "./helpers.js";

function clampBrightness(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numericValue));
}

function updateDeviceLastSeen(device, partialState) {
  return {
    ...device,
    state: {
      ...device.state,
      ...partialState
    },
    lastSeenAt: new Date().toISOString()
  };
}

export function devicesReducer(state, action, rootState) {
  switch (action.type) {
    case NEXUS_ACTIONS.TOGGLE_DEVICE_POWER:
      return updateNormalizedItem(state, action.payload, (device) =>
        updateDeviceLastSeen(device, {
          power: !device.state?.power
        })
      );

    case NEXUS_ACTIONS.SET_DEVICE_BRIGHTNESS:
      return updateNormalizedItem(state, action.payload.deviceId, (device) => {
        const brightness = clampBrightness(action.payload.brightness);

        return updateDeviceLastSeen(device, {
          brightness,
          power: brightness > 0
        });
      });

    case NEXUS_ACTIONS.APPLY_SCENE: {
      const scene = rootState.scenes.byId[action.payload];

      if (!scene) {
        return state;
      }

      const nextById = { ...state.byId };
      let hasChanges = false;
      const brightnessMap = {
        "scene-welcome-home": 72,
        "scene-focus-studio": 82,
        "scene-evening-living": 34,
        "scene-night-routine": 0,
        "scene-terrace-sunset": 42
      };

      state.allIds.forEach((deviceId) => {
        const device = state.byId[deviceId];
        const shouldAffectDevice = scene.roomScope === "global" || device.roomId === scene.roomScope;

        if (!shouldAffectDevice || device.type !== "light") {
          return;
        }

        hasChanges = true;
        const nextBrightness = brightnessMap[action.payload] ?? device.state.brightness ?? 50;

        nextById[deviceId] = {
          ...device,
          state: {
            ...device.state,
            power: nextBrightness > 0,
            brightness: nextBrightness,
            activeSceneId: action.payload
          },
          lastSeenAt: new Date().toISOString()
        };
      });

      return hasChanges
        ? {
            ...state,
            byId: nextById
          }
        : state;
    }

    default:
      return state;
  }
}

