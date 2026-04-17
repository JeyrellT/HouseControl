const NEXUS_PREFERENCES_STORAGE_KEY = "nexus-local-preferences:v1";

const defaultPersistedPreferences = {
  theme: "light",
  densityMode: "comfort",
  reducedMotion: false,
  activeRoomId: null
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getDefaultPersistedPreferences() {
  return {
    ...defaultPersistedPreferences
  };
}

export function readPersistedPreferences() {
  if (!canUseStorage()) {
    return getDefaultPersistedPreferences();
  }

  const rawValue = window.localStorage.getItem(NEXUS_PREFERENCES_STORAGE_KEY);

  if (!rawValue) {
    return getDefaultPersistedPreferences();
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== "object") {
      return getDefaultPersistedPreferences();
    }

    return {
      theme:
        typeof parsed.theme === "string"
          ? parsed.theme
          : defaultPersistedPreferences.theme,
      densityMode:
        typeof parsed.densityMode === "string"
          ? parsed.densityMode
          : defaultPersistedPreferences.densityMode,
      reducedMotion:
        typeof parsed.reducedMotion === "boolean"
          ? parsed.reducedMotion
          : defaultPersistedPreferences.reducedMotion,
      activeRoomId:
        typeof parsed.activeRoomId === "string" || parsed.activeRoomId === null
          ? parsed.activeRoomId
          : defaultPersistedPreferences.activeRoomId
    };
  } catch {
    return getDefaultPersistedPreferences();
  }
}

export function writePersistedPreferences(preferences) {
  if (!canUseStorage()) {
    return;
  }

  const payload = {
    theme: preferences.theme ?? defaultPersistedPreferences.theme,
    densityMode: preferences.densityMode ?? defaultPersistedPreferences.densityMode,
    reducedMotion: Boolean(preferences.reducedMotion),
    activeRoomId:
      typeof preferences.activeRoomId === "string" || preferences.activeRoomId === null
        ? preferences.activeRoomId
        : defaultPersistedPreferences.activeRoomId
  };

  window.localStorage.setItem(NEXUS_PREFERENCES_STORAGE_KEY, JSON.stringify(payload));
}
