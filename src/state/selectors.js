const recommendationPriorityWeight = {
  high: 3,
  medium: 2,
  low: 1
};

const platformStatusToHealthTone = {
  connected: "online",
  syncing: "online",
  degraded: "degraded",
  offline: "offline"
};

export function selectCollectionItems(slice) {
  return slice.allIds.map((id) => slice.byId[id]);
}

export function selectRooms(state) {
  return selectCollectionItems(state.rooms);
}

export function selectDevices(state) {
  return selectCollectionItems(state.devices);
}

export function selectPlatforms(state) {
  return selectCollectionItems(state.platforms);
}

export function selectScenes(state) {
  return selectCollectionItems(state.scenes);
}

export function selectTotalDevices(state) {
  return state.devices.allIds.length;
}

export function selectActiveDevices(state) {
  return selectDevices(state).filter((device) => device.online);
}

export function selectActiveRoom(state) {
  return state.rooms.byId[state.ui.activeRoomId] ?? null;
}

export function selectRoomDevices(state, roomId = state.ui.activeRoomId) {
  return selectDevices(state).filter((device) => device.roomId === roomId);
}

export function selectRoomSummaries(state) {
  const devices = selectDevices(state);

  return selectRooms(state).map((room) => {
    const roomDevices = devices.filter((device) => device.roomId === room.id);
    const onlineCount = roomDevices.filter((device) => device.online).length;
    const activeLights = roomDevices.filter(
      (device) => device.type === "light" && device.state?.power
    ).length;

    return {
      id: room.id,
      name: room.name,
      icon: room.icon,
      order: room.order,
      deviceCount: roomDevices.length,
      onlineCount,
      offlineCount: roomDevices.length - onlineCount,
      activeLights
    };
  });
}

function sortVisibleRecommendations(items) {
  return [...items].sort((left, right) => {
    const priorityDelta =
      recommendationPriorityWeight[right.priority] - recommendationPriorityWeight[left.priority];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return right.confidence - left.confidence;
  });
}

export function selectVisibleRecommendations(state) {
  const visibleItems = state.recommendations.items.filter(
    (item) => !state.recommendations.dismissedIds.includes(item.id)
  );

  return sortVisibleRecommendations(visibleItems);
}

export function selectTopRecommendations(state) {
  return selectVisibleRecommendations(state).slice(0, 3);
}

export function selectSystemHealth(state) {
  const devices = selectDevices(state);
  const platforms = selectPlatforms(state);
  const visibleRecommendations = selectVisibleRecommendations(state);
  const inactiveDevices = devices.filter((device) => !device.online).length;
  const degradedPlatforms = platforms.filter((platform) => platform.status === "degraded").length;
  const offlinePlatforms = platforms.filter((platform) => platform.status === "offline").length;
  const latestSignals = [
    state.devices.integration.syncedAt,
    state.platforms.integration.syncedAt,
    state.recommendations.integration.syncedAt,
    state.neuro.integration.syncedAt,
    state.activity.integration.syncedAt
  ].filter(Boolean);

  const lastUpdatedAt = latestSignals.sort((left, right) => new Date(right) - new Date(left))[0] ?? null;

  return {
    totalDevices: devices.length,
    activeDevices: devices.filter((device) => device.online).length,
    inactiveDevices,
    degradedPlatforms,
    offlinePlatforms,
    recommendationCount: visibleRecommendations.length,
    lastUpdatedAt
  };
}

export function selectOfflinePlatforms(state) {
  return selectPlatforms(state).filter((platform) => platform.status === "offline");
}

export function selectDegradedPlatforms(state) {
  return selectPlatforms(state).filter((platform) => platform.status === "degraded");
}

export function selectOverviewContext(state) {
  const activeRoom = selectActiveRoom(state);
  const roomDevices = selectRoomDevices(state, activeRoom?.id);
  const onlineRoomDevices = roomDevices.filter((device) => device.online);
  const nextRecommendation = selectVisibleRecommendations(state)[0] ?? null;
  const health = selectSystemHealth(state);

  return {
    activeRoomName: activeRoom?.name ?? "Toda la casa",
    roomDeviceCount: roomDevices.length,
    roomOnlineCount: onlineRoomDevices.length,
    recommendationCount: health.recommendationCount,
    adaptiveMode: state.neuro.adaptiveMode,
    cognitiveLoad: state.neuro.cognitiveLoad,
    cognitiveScore: state.neuro.cognitiveScore,
    lastSignalAt: state.neuro.lastSignalAt,
    lastUpdatedAt: health.lastUpdatedAt,
    nextActionTitle: nextRecommendation?.title ?? "Todo esta estable por ahora",
    nextActionDescription:
      nextRecommendation?.action ?? "No hay recomendaciones activas que requieran atencion."
  };
}

export function selectDashboardKpis(state) {
  const health = selectSystemHealth(state);
  const totalPlatforms = state.platforms.allIds.length;
  const stablePlatforms = selectPlatforms(state).filter(
    (platform) => platform.status === "connected" || platform.status === "syncing"
  ).length;
  const enabledAutomations = state.automations.items.filter((automation) => automation.enabled).length;

  return [
    {
      id: "devices",
      label: "Devices online",
      value: `${health.activeDevices}/${health.totalDevices}`,
      hint: `${health.inactiveDevices} requieren seguimiento ligero.`,
      tone: health.inactiveDevices > 0 ? "warning" : "success"
    },
    {
      id: "recommendations",
      label: "Open recommendations",
      value: `${health.recommendationCount}`,
      hint: "Prioriza la accion con mayor impacto primero.",
      tone: health.recommendationCount > 0 ? "info" : "success"
    },
    {
      id: "platforms",
      label: "Platforms healthy",
      value: `${stablePlatforms}/${totalPlatforms}`,
      hint: `${health.degradedPlatforms + health.offlinePlatforms} con riesgo operativo.`,
      tone:
        health.degradedPlatforms + health.offlinePlatforms > 0 ? "warning" : "success"
    },
    {
      id: "automation",
      label: "Scenes ready",
      value: `${state.scenes.allIds.length}`,
      hint: `${enabledAutomations} automatizaciones activas listas para escalar.`,
      tone: "info"
    }
  ];
}

function getRoomName(state, roomId) {
  if (!roomId || roomId === "global") {
    return "Toda la casa";
  }

  return state.rooms.byId[roomId]?.name ?? "Sin habitacion";
}

export function selectQuickScenes(state) {
  const activeRoomId = state.ui.activeRoomId;

  return selectScenes(state)
    .filter((scene) => scene.roomScope === "global" || scene.roomScope === activeRoomId)
    .map((scene) => ({
      id: scene.id,
      name: scene.name,
      description: scene.description,
      scopeLabel: getRoomName(state, scene.roomScope)
    }))
    .slice(0, 4);
}

export function selectPlatformHealth(state) {
  const items = selectPlatforms(state).map((platform) => {
    const normalizedStatus = platformStatusToHealthTone[platform.status] ?? "online";

    return {
      id: platform.id,
      label: platform.label,
      status: normalizedStatus,
      detail:
        platform.status === "syncing"
          ? "Online, syncing metadata"
          : normalizedStatus === "online"
            ? "Online"
            : normalizedStatus === "degraded"
              ? "Degraded"
              : "Offline",
      latencyMs: platform.latencyMs,
      lastSyncAt: platform.lastSyncAt,
      capabilityCount: platform.capabilities.length
    };
  });

  return {
    items,
    summary: {
      online: items.filter((platform) => platform.status === "online").length,
      degraded: items.filter((platform) => platform.status === "degraded").length,
      offline: items.filter((platform) => platform.status === "offline").length
    },
    integration: state.platforms.integration
  };
}

export function selectRecentActivity(state, limit = 6) {
  return state.activity.items.slice(0, limit);
}

export function selectRecommendationInsight(state, recommendationId) {
  if (!recommendationId) {
    return null;
  }

  const recommendation = state.recommendations.items.find((item) => item.id === recommendationId);

  if (!recommendation) {
    return null;
  }

  const degradedPlatforms = selectDegradedPlatforms(state);
  const offlinePlatforms = selectOfflinePlatforms(state);
  const activeRoom = selectActiveRoom(state);
  const health = selectSystemHealth(state);
  const statusSignal =
    degradedPlatforms[0]?.label ??
    offlinePlatforms[0]?.label ??
    `${health.activeDevices}/${health.totalDevices} devices online`;

  return {
    id: recommendation.id,
    title: recommendation.title,
    priority: recommendation.priority,
    confidence: Math.round(recommendation.confidence * 100),
    rationale: recommendation.rationale,
    action: recommendation.action,
    signals: [
      {
        id: "recommendation-priority",
        label: "Priority",
        value: recommendation.priority
      },
      {
        id: "recommendation-confidence",
        label: "Confidence",
        value: `${Math.round(recommendation.confidence * 100)}%`
      },
      {
        id: "recommendation-context",
        label: "Context",
        value: activeRoom?.name ?? "Sistema general"
      },
      {
        id: "recommendation-state",
        label: "State signal",
        value: statusSignal
      }
    ]
  };
}

