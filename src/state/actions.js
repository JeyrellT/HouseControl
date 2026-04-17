export const NEXUS_ACTIONS = {
  SET_ACTIVE_PAGE: "SET_ACTIVE_PAGE",
  SET_ACTIVE_ROOM: "SET_ACTIVE_ROOM",
  TOGGLE_THEME: "TOGGLE_THEME",
  SET_THEME: "SET_THEME",
  TOGGLE_DENSITY_MODE: "TOGGLE_DENSITY_MODE",
  TOGGLE_PANEL: "TOGGLE_PANEL",
  TOGGLE_DEVICE_POWER: "TOGGLE_DEVICE_POWER",
  SET_DEVICE_BRIGHTNESS: "SET_DEVICE_BRIGHTNESS",
  DISMISS_RECOMMENDATION: "DISMISS_RECOMMENDATION",
  APPLY_SCENE: "APPLY_SCENE",
  APPEND_ACTIVITY: "APPEND_ACTIVITY",
  SET_NEURO_STATE: "SET_NEURO_STATE",
  HYDRATE_UI_PREFERENCES: "HYDRATE_UI_PREFERENCES"
};

export const nexusActions = {
  setActivePage: (pageId) => ({
    type: NEXUS_ACTIONS.SET_ACTIVE_PAGE,
    payload: pageId
  }),
  setActiveRoom: (roomId) => ({
    type: NEXUS_ACTIONS.SET_ACTIVE_ROOM,
    payload: roomId
  }),
  toggleTheme: () => ({
    type: NEXUS_ACTIONS.TOGGLE_THEME
  }),
  setTheme: (theme) => ({
    type: NEXUS_ACTIONS.SET_THEME,
    payload: theme
  }),
  toggleDensityMode: () => ({
    type: NEXUS_ACTIONS.TOGGLE_DENSITY_MODE
  }),
  togglePanel: (panelId) => ({
    type: NEXUS_ACTIONS.TOGGLE_PANEL,
    payload: panelId
  }),
  toggleDevicePower: (deviceId) => ({
    type: NEXUS_ACTIONS.TOGGLE_DEVICE_POWER,
    payload: deviceId
  }),
  setDeviceBrightness: (deviceId, brightness) => ({
    type: NEXUS_ACTIONS.SET_DEVICE_BRIGHTNESS,
    payload: {
      deviceId,
      brightness
    }
  }),
  dismissRecommendation: (recommendationId) => ({
    type: NEXUS_ACTIONS.DISMISS_RECOMMENDATION,
    payload: recommendationId
  }),
  applyScene: (sceneId) => ({
    type: NEXUS_ACTIONS.APPLY_SCENE,
    payload: sceneId
  }),
  appendActivity: (entry) => ({
    type: NEXUS_ACTIONS.APPEND_ACTIVITY,
    payload: entry
  }),
  setNeuroState: (partialNeuroState) => ({
    type: NEXUS_ACTIONS.SET_NEURO_STATE,
    payload: partialNeuroState
  }),
  hydrateUiPreferences: (preferences) => ({
    type: NEXUS_ACTIONS.HYDRATE_UI_PREFERENCES,
    payload: preferences
  })
};

