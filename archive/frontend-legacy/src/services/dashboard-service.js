import { mockFutureReadiness } from "../mock-data/session.js";
import { getAllRecommendationExplanations, listRecommendations } from "./recommendation-service.js";
import { getMockEventFeed, getSystemHealth } from "./monitoring-service.js";
import { listPlatforms } from "./platform-service.js";
import { getStatus as getGatewayStatus } from "./stream-gateway.js";
import { getStatus as getVoiceStatus } from "./voice-command-service.js";
import { getStatus as getNeuroStatus } from "./neuro-adaptation-service.js";
import { getStatus as getCognitiveLoadStatus } from "./cognitive-load-service.js";

export async function loadDashboardData() {
  const [
    recommendations,
    explanationsById,
    health,
    events,
    platforms,
    gateway,
    voiceStatus,
    neuroStatus,
    cognitiveLoadStatus
  ] =
    await Promise.all([
      listRecommendations(),
      getAllRecommendationExplanations(),
      getSystemHealth(),
      getMockEventFeed(),
      listPlatforms(),
      getGatewayStatus(),
      getVoiceStatus(),
      getNeuroStatus(),
      getCognitiveLoadStatus()
    ]);

  const futureReadiness = mockFutureReadiness.map((item) => {
    if (item.id === voiceStatus.id) {
      return voiceStatus;
    }

    if (item.id === neuroStatus.id) {
      return neuroStatus;
    }

    if (item.id === "streams") {
      return {
        ...item,
        detail: `${item.detail} Estado actual del gateway: ${gateway.state}.`
      };
    }

    return item;
  });

  futureReadiness.push(cognitiveLoadStatus);

  return {
    recommendations,
    explanationsById,
    health,
    events,
    platforms,
    gateway,
    futureReadiness
  };
}
