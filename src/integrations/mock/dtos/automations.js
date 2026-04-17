export const automationDtos = [
  {
    id: "automation-arrival-living",
    name: "Arrival Living",
    enabled: true,
    sceneId: "scene-welcome-home",
    trigger: "presence-arrival",
    roomId: "room-living"
  },
  {
    id: "automation-focus-studio",
    name: "Focus Studio Auto",
    enabled: false,
    sceneId: "scene-focus-studio",
    trigger: "weekday-09-00",
    roomId: "room-studio"
  },
  {
    id: "automation-night-routine",
    name: "Night Routine",
    enabled: true,
    sceneId: "scene-night-routine",
    trigger: "daily-22-30",
    roomId: null
  }
];

