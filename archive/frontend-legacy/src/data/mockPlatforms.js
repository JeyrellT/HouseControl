import { PLATFORM_STATUSES } from "../utils/constants.js";

export const mockPlatforms = [
  {
    id: "platform-hue",
    key: "hue",
    label: "Philips Hue",
    status: PLATFORM_STATUSES.CONNECTED,
    capabilities: ["lights", "scenes", "groups"],
    latencyMs: 82,
    lastSyncAt: "2026-04-16T08:44:00.000Z"
  },
  {
    id: "platform-sonos",
    key: "sonos",
    label: "Sonos",
    status: PLATFORM_STATUSES.CONNECTED,
    capabilities: ["audio", "room-groups", "volume"],
    latencyMs: 118,
    lastSyncAt: "2026-04-16T08:41:00.000Z"
  },
  {
    id: "platform-homekit",
    key: "homekit",
    label: "Apple Home",
    status: PLATFORM_STATUSES.SYNCING,
    capabilities: ["automations", "presence", "rooms"],
    latencyMs: 146,
    lastSyncAt: "2026-04-16T08:38:00.000Z"
  },
  {
    id: "platform-climate",
    key: "ecobee",
    label: "Ecobee",
    status: PLATFORM_STATUSES.DEGRADED,
    capabilities: ["climate", "temperature", "energy"],
    latencyMs: 224,
    lastSyncAt: "2026-04-16T08:29:00.000Z"
  }
];
