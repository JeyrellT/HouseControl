export const UI_STATE_STORAGE_KEY = "nexus-ui-state:v2";
export const LEGACY_PREFERENCES_STORAGE_KEY = "nexus-local-preferences:v1";
export const LEGACY_UI_STORAGE_KEY = "nexus-ui-preferences:v1";

const STORAGE_VERSION = 2;

const defaultPersistedUiState = {
  activePage: undefined,
  activeRoomId: undefined,
  openPanels: {
    sidebar: true,
    recommendations: true,
    neuro: true
  },
  preferences: {
    theme: "light",
    densityMode: "comfort",
    reducedMotion: false
  }
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneDefaultState() {
  return {
    activePage: defaultPersistedUiState.activePage,
    activeRoomId: defaultPersistedUiState.activeRoomId,
    openPanels: { ...defaultPersistedUiState.openPanels },
    preferences: { ...defaultPersistedUiState.preferences }
  };
}

export function getDefaultPersistedUiState() {
  return cloneDefaultState();
}

export function extractPersistedUiState(ui) {
  return {
    activePage: ui.activePage,
    activeRoomId: ui.activeRoomId,
    openPanels: { ...ui.openPanels },
    preferences: {
      theme: ui.preferences.theme,
      densityMode: ui.preferences.densityMode,
      reducedMotion: Boolean(ui.preferences.reducedMotion)
    }
  };
}

function mergePersistedUiState(partialState = {}) {
  const defaults = cloneDefaultState();

  return {
    activePage:
      typeof partialState.activePage === "string" ? partialState.activePage : defaults.activePage,
    activeRoomId:
      typeof partialState.activeRoomId === "string" || partialState.activeRoomId === null
        ? partialState.activeRoomId
        : defaults.activeRoomId,
    openPanels: {
      ...defaults.openPanels,
      ...(partialState.openPanels ?? {})
    },
    preferences: {
      theme:
        typeof partialState.preferences?.theme === "string"
          ? partialState.preferences.theme
          : defaults.preferences.theme,
      densityMode:
        typeof partialState.preferences?.densityMode === "string"
          ? partialState.preferences.densityMode
          : defaults.preferences.densityMode,
      reducedMotion:
        typeof partialState.preferences?.reducedMotion === "boolean"
          ? partialState.preferences.reducedMotion
          : defaults.preferences.reducedMotion
    }
  };
}

function readLegacyUiState() {
  if (!canUseStorage()) {
    return cloneDefaultState();
  }

  const defaults = cloneDefaultState();
  const legacyPreferencesRaw = window.localStorage.getItem(LEGACY_PREFERENCES_STORAGE_KEY);

  if (legacyPreferencesRaw) {
    try {
      const parsed = JSON.parse(legacyPreferencesRaw);

      return mergePersistedUiState({
        activeRoomId: parsed.activeRoomId ?? defaults.activeRoomId,
        preferences: {
          theme: parsed.theme ?? defaults.preferences.theme,
          densityMode: parsed.densityMode ?? defaults.preferences.densityMode,
          reducedMotion: parsed.reducedMotion ?? defaults.preferences.reducedMotion
        }
      });
    } catch {
      return defaults;
    }
  }

  const legacyUiRaw = window.localStorage.getItem(LEGACY_UI_STORAGE_KEY);

  if (!legacyUiRaw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(legacyUiRaw);
    const data = parsed?.data ?? {};

    return mergePersistedUiState({
      preferences: {
        densityMode: data.density === "compact" ? "focus" : defaults.preferences.densityMode,
        theme: defaults.preferences.theme,
        reducedMotion: defaults.preferences.reducedMotion
      },
      openPanels: data.collapsedPanels
        ? Object.fromEntries(
            Object.entries(data.collapsedPanels).map(([panelId, isCollapsed]) => [panelId, !isCollapsed])
          )
        : defaults.openPanels
    });
  } catch {
    return defaults;
  }
}

export function readPersistedUiState() {
  if (!canUseStorage()) {
    return cloneDefaultState();
  }

  const rawValue = window.localStorage.getItem(UI_STATE_STORAGE_KEY);

  if (!rawValue) {
    return readLegacyUiState();
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (parsed.version !== STORAGE_VERSION || !parsed.data) {
      return readLegacyUiState();
    }

    return mergePersistedUiState(parsed.data);
  } catch {
    return readLegacyUiState();
  }
}

export function writePersistedUiState(ui) {
  if (!canUseStorage()) {
    return;
  }

  const payload = {
    version: STORAGE_VERSION,
    data: extractPersistedUiState(ui)
  };

  window.localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(payload));
}
