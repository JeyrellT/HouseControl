// Tipos centrales del dominio Intelligent Nexus.
// Refleja la jerarquía Home → Floor → Area → Label → Device → Capability
// + Scene, VirtualDevice, GatewayNode (planes Fase 1-7 + Rev 7).

export type PersonaId = "villa-aurora" | "nexus-hq" | "finca-las-palmas";

export type Vendor =
  | "tuya"
  | "smartthings"
  | "ubiquiti"
  | "crestron"
  | "rainbird"
  | "sonos"
  | "home-assistant";

export type DeviceKind =
  | "light"
  | "switch"
  | "sensor"
  | "lock"
  | "cover"
  | "climate"
  | "camera"
  | "speaker"
  | "valve";

export type CapabilityKind =
  | "on_off"
  | "dim"
  | "color_temp"
  | "rgb"
  | "motion"
  | "battery"
  | "energy"
  | "ptz"
  | "lock"
  | "thermostat"
  | "valve"
  | "audio";

export type Protocol =
  | "wifi"
  | "mqtt"
  | "zigbee"
  | "zwave"
  | "thread"
  | "ble"
  | "rest"
  | "coap"
  | "matter";

export type Availability = "online" | "offline" | "unknown";

export interface Persona {
  id: PersonaId;
  name: string;
  type: "residential" | "office" | "agricultural";
  location: string;
  goals: string[];
  primaryUserId: string;
}

export interface User {
  id: string;
  personaId: PersonaId;
  name: string;
  role: "owner" | "admin" | "technician" | "viewer";
  initials: string;
}

export interface Floor {
  id: string;
  personaId: PersonaId;
  name: string;
  order: number;
}

export interface Room {
  id: string;
  personaId: PersonaId;
  floorId: string;
  name: string;
  zone?: "indoor" | "outdoor" | "utility";
  icon?: string;
}

export interface Label {
  id: string;
  personaId: PersonaId;
  name: string;
  color: string;
}

export interface Capability {
  id: string;
  deviceId: string;
  kind: CapabilityKind;
  value: unknown;
  unit?: string;
  ts: string;
  version: number;
}

export interface Device {
  id: string;
  personaId: PersonaId;
  roomId: string;
  floorId: string;
  name: string;
  kind: DeviceKind;
  vendor: Vendor;
  protocol: Protocol;
  bridgeId?: string;
  labelIds: string[];
  capabilityIds: string[];
  availability: Availability;
  localRoute: boolean;
  matterCompliant: boolean;
  updatedAt: string;
  physical?: {
    requiresNeutral: boolean;
    installationType: "ceiling" | "wall" | "outlet" | "din-rail" | "outdoor";
    powerSource: "mains" | "battery" | "poe";
    ppxZone?: 1 | 2 | 3;
  };
}

export interface Scene {
  id: string;
  personaId: PersonaId;
  name: string;
  icon: string;
  areaIds: string[];
  targetStates: Record<string, unknown>;
  description?: string;
}

export interface VirtualDevice {
  id: string;
  personaId: PersonaId;
  name: string;
  memberIds: string[];
  strategy: "all" | "any" | "avg";
  derivedKind: CapabilityKind;
}

export interface GatewayNode {
  id: string;
  personaId: PersonaId;
  name: string;
  kind:
    | "zigbee2mqtt"
    | "zwave-js"
    | "thread-border-router"
    | "mqtt-broker"
    | "ble-gateway"
    | "matter-server";
  protocol: Protocol;
  status: Availability;
  hostedDeviceIds: string[];
}

export interface ActivityEvent {
  id: string;
  personaId: PersonaId;
  ts: string;
  actor: "user" | "system" | "rule" | "voice";
  intent: string;
  target?: string;
  outcome: "success" | "failure" | "pending";
  source: string;
  severity?: "info" | "warn" | "critical";
  summary: string;
}

export interface VoiceIntent {
  id: string;
  phrase: string;
  intent: string;
  targetSceneId?: string;
  explanation: string;
}

export interface Platform {
  id: string;
  vendor: Vendor;
  status: Availability;
  latencyMs: number;
  devicesDiscovered: number;
  oauthExpiresAt?: string;
  quotaRemaining?: number;
}

// ---------- Notifications / Alerts (Fase 8) ----------
export type NotificationSeverity = "info" | "warn" | "critical";
export type NotificationCategory =
  | "security"      // intrusiones, cerraduras, cámaras
  | "energy"        // consumo, tarifa pico, carga fantasma
  | "automation"    // escenas, reglas, sugerencias IA
  | "maintenance"   // batería baja, filtros, firmware
  | "network"       // plataformas offline, latencia, OAuth
  | "climate"       // humedad, temperatura, ventana abierta
  | "ai"            // anomalías detectadas por IA
  | "guest"         // accesos de invitados/trabajadores
  | "safety";       // humo, gas, fuego
export type NotificationStatus = "active" | "acknowledged" | "resolved" | "muted";
export type NotificationActionIntent =
  | "ack" | "resolve" | "mute"
  | "run-scene" | "open-device" | "open-room"
  | "open-energy" | "open-health" | "open-integrations";

export interface NotificationAction {
  id: string;
  label: string;
  intent: NotificationActionIntent;
  targetId?: string;  // sceneId / deviceId / roomId según intent
  primary?: boolean;
}

export interface Notification {
  id: string;
  personaId: PersonaId;
  severity: NotificationSeverity;
  category: NotificationCategory;
  status: NotificationStatus;
  title: string;
  body: string;
  ts: string;
  source?: Vendor | "system" | "voice" | "rule" | "ai";
  deviceId?: string;
  sceneId?: string;
  roomId?: string;
  aiExplanation?: string;           // narrativa breve del porqué
  suggestedActions?: NotificationAction[];
  affectedCount?: number;           // dispositivos/m² afectados
  estimatedImpactCRC?: number;      // sólo alertas energéticas
  confidence?: number;              // 0-1 confianza IA
  acknowledgedBy?: string;          // nombre de usuario
  resolvedAt?: string;
  expiresAt?: string;
}

export type EventType =
  | "bootstrap.snapshot"
  | "device.state.changed"
  | "device.availability.changed"
  | "scene.activated"
  | "command.ack"
  | "command.result"
  | "alert.raised"
  | "voice.command"
  | "rbac.role-changed"
  | "demo.reset"
  | "moment.started"
  | "moment.finished";

export interface NexusEvent {
  eventId: string;
  type: EventType;
  deviceId?: string;
  capability?: string;
  value?: unknown;
  ts: string;
  source: "mqtt" | "rest" | "ws" | "rule" | "voice" | "user" | "system";
  correlationId?: string;
  version: number;
  attributes?: Record<string, unknown>;
}

// ---------- Home Canvas (tablet-style control panel) ----------
export type WidgetSize = "S" | "M" | "L" | "XL";

export type HomeWidget =
  | { id: string; type: "camera"; size: WidgetSize; deviceId: string }
  | { id: string; type: "lightGroup"; size: WidgetSize; deviceIds: string[]; name: string }
  | { id: string; type: "tv"; size: WidgetSize; deviceId: string }
  | { id: string; type: "scene"; size: WidgetSize; sceneId: string }
  | { id: string; type: "climate"; size: WidgetSize; deviceId: string };

export type WidgetType = HomeWidget["type"];

export interface TVState {
  source: string; // "HDMI1" | "HDMI2" | "Netflix" | "YouTube" | "Spotify" | "Apple TV"
  volume: number; // 0-100
  muted: boolean;
  channel: number;
}
