import { describe, expect, it } from "vitest";
import { createInitialNexusState } from "../state/initialState.js";
import {
  selectPlatformHealth,
  selectRecommendationInsight,
  selectRoomSummaries,
  selectSystemHealth,
  selectVisibleRecommendations
} from "../state/selectors.js";

describe("selectors", () => {
  it("deriva health del sistema desde slices canonicamente", () => {
    const state = createInitialNexusState();
    const health = selectSystemHealth(state);

    expect(health.totalDevices).toBe(state.devices.allIds.length);
    expect(health.activeDevices).toBeLessThan(health.totalDevices);
    expect(health.degradedPlatforms).toBe(1);
    expect(health.recommendationCount).toBe(state.recommendations.items.length);
    expect(health.lastUpdatedAt).toBeTruthy();
  });

  it("resume habitaciones y dispositivos", () => {
    const state = createInitialNexusState();
    const summaries = selectRoomSummaries(state);
    const living = summaries.find((room) => room.id === "room-living");

    expect(living.deviceCount).toBeGreaterThan(0);
    expect(living.onlineCount).toBeGreaterThan(0);
    expect(living.activeLights).toBeGreaterThan(0);
  });

  it("ordena recomendaciones visibles y construye insight", () => {
    const state = createInitialNexusState();
    const visible = selectVisibleRecommendations(state);
    const insight = selectRecommendationInsight(state, visible[0].id);

    expect(visible[0].priority).toBe("high");
    expect(insight.title).toBe(visible[0].title);
    expect(insight.signals).toHaveLength(4);
  });

  it("resume platform health e integra el estado de integracion del slice", () => {
    const state = createInitialNexusState();
    const platformHealth = selectPlatformHealth(state);

    expect(platformHealth.summary.online).toBeGreaterThan(0);
    expect(platformHealth.summary.degraded).toBe(1);
    expect(platformHealth.integration.status).toBe("degraded");
  });
});

