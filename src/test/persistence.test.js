import { describe, expect, it } from "vitest";
import {
  LEGACY_PREFERENCES_STORAGE_KEY,
  UI_STATE_STORAGE_KEY,
  extractPersistedUiState,
  readPersistedUiState,
  writePersistedUiState
} from "../state/persistence.js";

describe("persistence", () => {
  it("guarda solo el subconjunto canonico de ui", () => {
    writePersistedUiState({
      activePage: "settings",
      activeRoomId: "room-studio",
      openPanels: {
        sidebar: true,
        recommendations: false,
        neuro: true
      },
      preferences: {
        theme: "dark",
        densityMode: "focus",
        reducedMotion: true
      }
    });

    const stored = JSON.parse(window.localStorage.getItem(UI_STATE_STORAGE_KEY));

    expect(stored.data).toEqual(
      extractPersistedUiState({
        activePage: "settings",
        activeRoomId: "room-studio",
        openPanels: {
          sidebar: true,
          recommendations: false,
          neuro: true
        },
        preferences: {
          theme: "dark",
          densityMode: "focus",
          reducedMotion: true
        }
      })
    );
  });

  it("ignora JSON invalido o versiones incompatibles", () => {
    window.localStorage.setItem(UI_STATE_STORAGE_KEY, "{bad json");
    expect(readPersistedUiState().preferences.densityMode).toBe("comfort");

    window.localStorage.setItem(
      UI_STATE_STORAGE_KEY,
      JSON.stringify({ version: 999, data: { preferences: { densityMode: "focus" } } })
    );
    expect(readPersistedUiState().preferences.densityMode).toBe("comfort");
  });

  it("migra una vez desde el storage legacy de preferencias", () => {
    window.localStorage.setItem(
      LEGACY_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        theme: "dark",
        densityMode: "focus",
        reducedMotion: true,
        activeRoomId: "room-terrace"
      })
    );

    const restored = readPersistedUiState();

    expect(restored.preferences.theme).toBe("dark");
    expect(restored.preferences.densityMode).toBe("focus");
    expect(restored.preferences.reducedMotion).toBe(true);
    expect(restored.activeRoomId).toBe("room-terrace");
  });
});

