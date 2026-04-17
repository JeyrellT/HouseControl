import { normalizeCollection } from "../../utils/normalize.js";
import { PLATFORM_STATUSES, UI_MODES } from "../../utils/constants.js";
import { createIntegrationState, INTEGRATION_STATUSES } from "../../domain/integrationState.js";
import { toDeviceDomain, toNeuroStateDomain, toPlatformDomain, toRecommendationDomain, toRoomDomain } from "./adapters.js";
import { activityDtos } from "./dtos/activity.js";
import { automationDtos } from "./dtos/automations.js";
import { deviceDtos } from "./dtos/devices.js";
import { neuroStateDto } from "./dtos/neuroState.js";
import { platformDtos } from "./dtos/platforms.js";
import { recommendationDtos } from "./dtos/recommendations.js";
import { roomDtos } from "./dtos/rooms.js";
import { sceneDtos } from "./dtos/scenes.js";

function resolvePlatformsIntegration(platforms) {
  const degradedPlatform = platforms.find(
    (platform) =>
      platform.status === PLATFORM_STATUSES.DEGRADED || platform.status === PLATFORM_STATUSES.OFFLINE
  );

  if (degradedPlatform) {
    return createIntegrationState({
      status: INTEGRATION_STATUSES.DEGRADED,
      degradedReason: `${degradedPlatform.label} requiere atencion.`,
      syncedAt: degradedPlatform.lastSyncAt
    });
  }

  return createIntegrationState({
    status: INTEGRATION_STATUSES.READY,
    syncedAt: platforms[0]?.lastSyncAt ?? null
  });
}

export function getMockNexusBootstrap() {
  const rooms = roomDtos.map(toRoomDomain);
  const devices = deviceDtos.map(toDeviceDomain);
  const recommendations = recommendationDtos.map(toRecommendationDomain);
  const platforms = platformDtos.map(toPlatformDomain);
  const neuroState = toNeuroStateDomain(neuroStateDto);
  const latestDeviceSync = devices.reduce((latest, device) => {
    if (!latest) {
      return device.lastSeenAt;
    }

    return new Date(device.lastSeenAt) > new Date(latest) ? device.lastSeenAt : latest;
  }, null);

  return {
    ui: {
      activePage: "dashboard",
      activeRoomId: rooms[0]?.id ?? null,
      openPanels: {
        sidebar: true,
        recommendations: true,
        neuro: true
      },
      preferences: {
        theme: UI_MODES.LIGHT,
        densityMode: UI_MODES.COMFORT,
        reducedMotion: false
      }
    },
    rooms: {
      ...normalizeCollection(rooms),
      integration: createIntegrationState({
        status: INTEGRATION_STATUSES.READY,
        syncedAt: latestDeviceSync
      })
    },
    devices: {
      ...normalizeCollection(devices),
      integration: createIntegrationState({
        status: INTEGRATION_STATUSES.READY,
        syncedAt: latestDeviceSync
      })
    },
    recommendations: {
      items: recommendations,
      dismissedIds: [],
      integration: createIntegrationState({
        status: INTEGRATION_STATUSES.READY,
        syncedAt: latestDeviceSync
      })
    },
    platforms: {
      ...normalizeCollection(platforms),
      integration: resolvePlatformsIntegration(platforms)
    },
    scenes: {
      ...normalizeCollection(sceneDtos),
      integration: createIntegrationState({
        status: INTEGRATION_STATUSES.READY,
        syncedAt: latestDeviceSync
      })
    },
    automations: {
      items: automationDtos.map((item) => ({ ...item })),
      integration: createIntegrationState({
        status: INTEGRATION_STATUSES.READY,
        syncedAt: latestDeviceSync
      })
    },
    neuro: {
      ...neuroState,
      integration: createIntegrationState({
        status: INTEGRATION_STATUSES.READY,
        syncedAt: neuroState.lastSignalAt
      })
    },
    activity: {
      items: activityDtos.map((item) => ({ ...item })),
      integration: createIntegrationState({
        status: INTEGRATION_STATUSES.READY,
        syncedAt: activityDtos[0]?.timestamp ?? null
      })
    }
  };
}

