import { describe, expect, it } from "vitest";
import { nexusActions } from "../state/actions.js";
import { createInitialNexusState } from "../state/initialState.js";
import { nexusReducer } from "../state/nexusReducer.js";

describe("nexusReducer", () => {
  it("actualiza el slice de ui sin tocar devices ni recommendations", () => {
    const state = createInitialNexusState();
    const nextState = nexusReducer(state, nexusActions.setActivePage("settings"));

    expect(nextState.ui.activePage).toBe("settings");
    expect(nextState.devices).toBe(state.devices);
    expect(nextState.recommendations).toBe(state.recommendations);
  });

  it("actualiza devices y activity al alternar energia de un device", () => {
    const state = createInitialNexusState();
    const deviceId = "device-living-main-light";
    const previousPower = state.devices.byId[deviceId].state.power;
    const nextState = nexusReducer(state, nexusActions.toggleDevicePower(deviceId));

    expect(nextState.devices.byId[deviceId].state.power).toBe(!previousPower);
    expect(nextState.activity.items[0].type).toBe("device-power-toggled");
    expect(nextState.recommendations).toBe(state.recommendations);
  });

  it("descarta recomendaciones sin tocar platform o ui", () => {
    const state = createInitialNexusState();
    const targetRecommendation = state.recommendations.items[0].id;
    const nextState = nexusReducer(state, nexusActions.dismissRecommendation(targetRecommendation));

    expect(nextState.recommendations.dismissedIds).toContain(targetRecommendation);
    expect(nextState.platforms).toBe(state.platforms);
    expect(nextState.ui).toBe(state.ui);
  });

  it("hidrata preferencias canonicas y conserva room activa si viene en payload", () => {
    const state = createInitialNexusState();
    const nextState = nexusReducer(
      state,
      nexusActions.hydrateUiPreferences({
        activePage: "roomDetail",
        activeRoomId: "room-studio",
        openPanels: { neuro: false },
        preferences: {
          theme: "dark",
          densityMode: "focus",
          reducedMotion: true
        }
      })
    );

    expect(nextState.ui.activePage).toBe("roomDetail");
    expect(nextState.ui.activeRoomId).toBe("room-studio");
    expect(nextState.ui.openPanels.neuro).toBe(false);
    expect(nextState.ui.preferences.theme).toBe("dark");
    expect(nextState.ui.preferences.densityMode).toBe("focus");
    expect(nextState.ui.preferences.reducedMotion).toBe(true);
  });

  it("mezcla el slice neuro y registra timestamp nuevo si no viene en payload", () => {
    const state = createInitialNexusState();
    const nextState = nexusReducer(
      state,
      nexusActions.setNeuroState({
        cognitiveLoad: "high",
        errpDetected: true
      })
    );

    expect(nextState.neuro.cognitiveLoad).toBe("high");
    expect(nextState.neuro.errpDetected).toBe(true);
    expect(nextState.neuro.lastSignalAt).toBeTruthy();
  });
});

