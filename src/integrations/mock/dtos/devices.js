import { DEVICE_SUBTYPES, DEVICE_TYPES } from "../../../utils/constants.js";

export const deviceDtos = [
  {
    id: "device-living-main-light",
    platformId: "platform-hue",
    roomId: "room-living",
    type: DEVICE_TYPES.LIGHT,
    subtype: DEVICE_SUBTYPES.CEILING,
    name: "Sala Main Light",
    online: true,
    state: { power: true, brightness: 78, colorMode: "warm" },
    capabilities: ["power", "brightness", "color-temperature"],
    lastSeenAt: "2026-04-16T08:44:00.000Z"
  },
  {
    id: "device-living-ambient-strip",
    platformId: "platform-hue",
    roomId: "room-living",
    type: DEVICE_TYPES.LIGHT,
    subtype: DEVICE_SUBTYPES.AMBIENT,
    name: "Sala Ambient Strip",
    online: true,
    state: { power: true, brightness: 34, scene: "focus-evening" },
    capabilities: ["power", "brightness", "rgb"],
    lastSeenAt: "2026-04-16T08:43:00.000Z"
  },
  {
    id: "device-living-speaker",
    platformId: "platform-sonos",
    roomId: "room-living",
    type: DEVICE_TYPES.SPEAKER,
    subtype: DEVICE_SUBTYPES.ZONE_AUDIO,
    name: "Sala Audio Hub",
    online: true,
    state: { playing: true, volume: 28, source: "ambient-jazz" },
    capabilities: ["playback", "volume", "grouping"],
    lastSeenAt: "2026-04-16T08:40:00.000Z"
  },
  {
    id: "device-kitchen-main-light",
    platformId: "platform-hue",
    roomId: "room-kitchen",
    type: DEVICE_TYPES.LIGHT,
    subtype: DEVICE_SUBTYPES.CEILING,
    name: "Cocina Main Light",
    online: true,
    state: { power: false, brightness: 0 },
    capabilities: ["power", "brightness"],
    lastSeenAt: "2026-04-16T08:42:00.000Z"
  },
  {
    id: "device-kitchen-presence",
    platformId: "platform-homekit",
    roomId: "room-kitchen",
    type: DEVICE_TYPES.SENSOR,
    subtype: DEVICE_SUBTYPES.PRESENCE,
    name: "Cocina Presence Sensor",
    online: true,
    state: { occupied: false, motionLevel: "low" },
    capabilities: ["presence", "motion"],
    lastSeenAt: "2026-04-16T08:39:00.000Z"
  },
  {
    id: "device-studio-desk-light",
    platformId: "platform-hue",
    roomId: "room-studio",
    type: DEVICE_TYPES.LIGHT,
    subtype: DEVICE_SUBTYPES.AMBIENT,
    name: "Studio Desk Light",
    online: true,
    state: { power: true, brightness: 62, mode: "focus" },
    capabilities: ["power", "brightness", "scene-binding"],
    lastSeenAt: "2026-04-16T08:44:00.000Z"
  },
  {
    id: "device-studio-climate",
    platformId: "platform-climate",
    roomId: "room-studio",
    type: DEVICE_TYPES.CLIMATE,
    subtype: DEVICE_SUBTYPES.THERMOSTAT,
    name: "Studio Climate",
    online: true,
    state: { mode: "cool", targetTemperature: 22, currentTemperature: 24.5 },
    capabilities: ["temperature", "target-temperature", "mode"],
    lastSeenAt: "2026-04-16T08:31:00.000Z"
  },
  {
    id: "device-main-bedroom-shade",
    platformId: "platform-homekit",
    roomId: "room-main-bedroom",
    type: DEVICE_TYPES.SHADE,
    subtype: DEVICE_SUBTYPES.BLIND,
    name: "Bedroom Smart Shade",
    online: true,
    state: { position: 40, sunBlockMode: true },
    capabilities: ["position", "scene-binding"],
    lastSeenAt: "2026-04-16T08:36:00.000Z"
  },
  {
    id: "device-main-bedroom-temperature",
    platformId: "platform-climate",
    roomId: "room-main-bedroom",
    type: DEVICE_TYPES.SENSOR,
    subtype: DEVICE_SUBTYPES.TEMPERATURE,
    name: "Bedroom Climate Sensor",
    online: false,
    state: { currentTemperature: 26.1, humidity: 58 },
    capabilities: ["temperature", "humidity"],
    lastSeenAt: "2026-04-16T07:58:00.000Z"
  },
  {
    id: "device-hallway-light",
    platformId: "platform-hue",
    roomId: "room-hallway",
    type: DEVICE_TYPES.LIGHT,
    subtype: DEVICE_SUBTYPES.CEILING,
    name: "Pasillo Main Light",
    online: true,
    state: { power: true, brightness: 48 },
    capabilities: ["power", "brightness"],
    lastSeenAt: "2026-04-16T08:41:00.000Z"
  },
  {
    id: "device-hallway-entry-door",
    platformId: "platform-homekit",
    roomId: "room-hallway",
    type: DEVICE_TYPES.DOOR,
    subtype: DEVICE_SUBTYPES.LOCK,
    name: "Hallway Entry Lock",
    online: true,
    state: { locked: true, battery: 84, tamperAlert: false },
    capabilities: ["lock", "unlock", "battery"],
    lastSeenAt: "2026-04-16T08:43:00.000Z"
  },
  {
    id: "device-terrace-light",
    platformId: "platform-hue",
    roomId: "room-terrace",
    type: DEVICE_TYPES.LIGHT,
    subtype: DEVICE_SUBTYPES.AMBIENT,
    name: "Terraza Outdoor Light",
    online: true,
    state: { power: false, brightness: 0 },
    capabilities: ["power", "brightness"],
    lastSeenAt: "2026-04-16T08:34:00.000Z"
  },
  {
    id: "device-terrace-camera",
    platformId: "platform-homekit",
    roomId: "room-terrace",
    type: DEVICE_TYPES.CAMERA,
    subtype: DEVICE_SUBTYPES.SECURITY,
    name: "Terrace Camera",
    online: true,
    state: { recording: true, motionDetected: false, privacyMode: false },
    capabilities: ["stream", "recording", "motion-detection"],
    lastSeenAt: "2026-04-16T08:40:00.000Z"
  },
  {
    id: "device-core-bridge",
    platformId: "platform-homekit",
    roomId: "room-living",
    type: DEVICE_TYPES.HUB,
    subtype: DEVICE_SUBTYPES.BRIDGE,
    name: "Core Automation Bridge",
    online: true,
    state: { uptimeHours: 336, syncState: "healthy" },
    capabilities: ["routing", "automations", "room-mapping"],
    lastSeenAt: "2026-04-16T08:44:00.000Z"
  }
];

