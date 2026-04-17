/**
 * Device taxonomy: deriva una "categoría funcional" de un dispositivo a partir
 * de su kind + labels. Permite agrupaciones más intuitivas que el kind crudo
 * (p.ej. "Smart TV" (switch) + "Sonos" (speaker) comparten categoría
 * "entertainment"; "AC" (climate) + "Ventilador" (switch+clima) comparten
 * "climate").
 *
 * También expone helpers de estado en vivo (isOn, dim, battery, lastSeenMin,
 * estWatts) que normalizan lo que la tarjeta UI debe mostrar.
 */

import type { Capability, Device, DeviceKind } from "./types";

export type DeviceCategory =
  | "lighting"
  | "climate"
  | "security"
  | "access"
  | "entertainment"
  | "appliance"
  | "sensor"
  | "irrigation"
  | "utility";

export interface CategoryMeta {
  id: DeviceCategory;
  label: string;
  /** clase tailwind sobre text- */
  tone: string;
  /** clase tailwind sobre bg- */
  bgTone: string;
  /** nombre del icono lucide-react */
  icon:
    | "Lightbulb"
    | "Thermometer"
    | "Shield"
    | "DoorOpen"
    | "Tv"
    | "WashingMachine"
    | "Activity"
    | "Droplets"
    | "Plug";
  /** Orden de aparición en agrupaciones */
  order: number;
}

export const CATEGORY_META: Record<DeviceCategory, CategoryMeta> = {
  lighting:      { id: "lighting",      label: "Iluminación",       tone: "text-gold-border",    bgTone: "bg-gold/15",       icon: "Lightbulb",      order: 1 },
  climate:       { id: "climate",       label: "Climatización",     tone: "text-sky-400",        bgTone: "bg-sky-500/15",    icon: "Thermometer",    order: 2 },
  security:      { id: "security",      label: "Seguridad",         tone: "text-status-critical",bgTone: "bg-red-500/15",    icon: "Shield",         order: 3 },
  access:        { id: "access",        label: "Accesos",           tone: "text-amber-400",      bgTone: "bg-amber-500/15",  icon: "DoorOpen",       order: 4 },
  entertainment: { id: "entertainment", label: "Entretenimiento",   tone: "text-purple-400",     bgTone: "bg-purple-500/15", icon: "Tv",             order: 5 },
  appliance:     { id: "appliance",     label: "Electrodomésticos", tone: "text-orange-400",     bgTone: "bg-orange-500/15", icon: "WashingMachine", order: 6 },
  sensor:        { id: "sensor",        label: "Sensores",          tone: "text-sage-border",    bgTone: "bg-sage/15",       icon: "Activity",       order: 7 },
  irrigation:    { id: "irrigation",    label: "Riego",             tone: "text-emerald-400",    bgTone: "bg-emerald-500/15",icon: "Droplets",       order: 8 },
  utility:       { id: "utility",       label: "Servicios",         tone: "text-ink-soft",       bgTone: "bg-surface",       icon: "Plug",           order: 9 },
};

/**
 * Deriva la categoría funcional. Prioriza etiquetas explícitas (clima,
 * entretenimiento, seguridad) y cae a kind como fallback.
 */
export function getDeviceCategory(device: Device): DeviceCategory {
  const labels = new Set(device.labelIds);

  // Etiquetas explícitas ganan
  if (labels.has("lbl-entretenimiento")) return "entertainment";
  if (labels.has("lbl-clima")) return "climate";
  if (labels.has("lbl-finca-riego")) return "irrigation";

  // Seguridad: cerraduras, cámaras, sensores de presencia/contacto etiquetados
  if (device.kind === "lock") return "access";
  if (device.kind === "camera") return "security";
  if (labels.has("lbl-seguridad")) return "security";
  if (labels.has("lbl-emergencia")) return "security";

  // Por kind
  switch (device.kind) {
    case "light":
      return "lighting";
    case "climate":
      return "climate";
    case "valve":
      return "irrigation";
    case "cover":
      return "access";
    case "speaker":
      return "entertainment";
    case "sensor":
      return "sensor";
    case "switch": {
      // switch con alto consumo y no es entretenimiento → electrodoméstico
      if (labels.has("lbl-alto-consumo")) return "appliance";
      if (labels.has("lbl-utilities")) return "utility";
      if (labels.has("lbl-exterior")) return "lighting"; // foco/ambiente exterior
      return "utility";
    }
    default:
      return "utility";
  }
}

/**
 * Estimación grosera de consumo en Watts cuando un dispositivo está encendido.
 * Útil sólo como indicador visual (no métrica real).
 */
export function estimateWatts(device: Device): number {
  const labels = new Set(device.labelIds);
  const name = device.name.toLowerCase();

  if (name.includes("horno")) return 2400;
  if (name.includes("induc")) return 2200;
  if (name.includes("ev ") || name.includes("wallbox")) return 7400;
  if (name.includes("secadora")) return 2000;
  if (name.includes("lavadora") || name.includes("lavav")) return 1800;
  if (name.includes("calentador") || name.includes("calent")) return 1500;
  if (name.includes("micro")) return 1000;
  if (name.includes("cafetera")) return 900;
  if (name.includes("refri")) return 150;

  if (device.kind === "climate") return 1200;
  if (name.includes("tv") || name.includes("oled")) return 120;
  if (name.includes("pc")) return 400;
  if (device.kind === "light") return labels.has("lbl-exterior") ? 30 : 18;
  if (device.kind === "speaker") return 25;
  if (device.kind === "camera") return 7;
  if (device.kind === "valve") return 4;
  if (device.kind === "switch") return 40;
  return 5;
}

export interface DeviceLiveStats {
  isOn: boolean;
  hasOnOff: boolean;
  dim: number | null;
  battery: number | null;
  batteryLow: boolean;
  thermostat: { target?: number; current?: number; mode?: string } | null;
  motion: boolean | null;
  lastSeenMin: number | null;
  /** Watts estimados ahora mismo (0 si apagado) */
  watts: number;
  highConsumption: boolean;
}

export function getDeviceLiveStats(
  device: Device,
  capabilities: Record<string, Capability>,
  now: number = Date.now(),
): DeviceLiveStats {
  const caps = device.capabilityIds.map((id) => capabilities[id]).filter(Boolean);
  const onOff = caps.find((c) => c.kind === "on_off");
  const dim = caps.find((c) => c.kind === "dim");
  const battery = caps.find((c) => c.kind === "battery");
  const therm = caps.find((c) => c.kind === "thermostat");
  const motion = caps.find((c) => c.kind === "motion");
  const ptz = caps.find((c) => c.kind === "ptz");
  const lock = caps.find((c) => c.kind === "lock");
  const valve = caps.find((c) => c.kind === "valve");

  // isOn derivado
  let isOn = false;
  let hasOnOff = false;
  if (onOff) {
    hasOnOff = true;
    isOn = Boolean(onOff.value);
  } else if (therm) {
    const v = therm.value as { mode?: string } | null;
    hasOnOff = true;
    isOn = !!(v && v.mode && v.mode !== "off");
  } else if (lock) {
    hasOnOff = true;
    isOn = lock.value === "locked";
  } else if (valve) {
    hasOnOff = true;
    isOn = valve.value === "open";
  } else if (ptz) {
    const v = ptz.value as { recording?: boolean } | null;
    hasOnOff = true;
    isOn = !!v?.recording;
  }

  // lastSeen = máximo ts
  let lastSeenMs = 0;
  for (const c of caps) {
    const t = Date.parse(c.ts);
    if (!Number.isNaN(t) && t > lastSeenMs) lastSeenMs = t;
  }
  const deviceTs = Date.parse(device.updatedAt);
  if (!Number.isNaN(deviceTs) && deviceTs > lastSeenMs) lastSeenMs = deviceTs;
  const lastSeenMin = lastSeenMs > 0 ? Math.max(0, Math.round((now - lastSeenMs) / 60000)) : null;

  const batteryValue = typeof battery?.value === "number" ? battery.value : null;

  // watts: si apagado, 0; si encendido, estimateWatts × (dim% si aplica)
  let watts = 0;
  if (isOn) {
    const base = estimateWatts(device);
    const dimPct = typeof dim?.value === "number" ? (dim.value as number) / 100 : 1;
    watts = Math.round(base * (device.kind === "light" ? dimPct || 1 : 1));
  }

  return {
    isOn,
    hasOnOff,
    dim: typeof dim?.value === "number" ? (dim.value as number) : null,
    battery: batteryValue,
    batteryLow: batteryValue !== null && batteryValue < 30,
    thermostat: therm ? (therm.value as DeviceLiveStats["thermostat"]) : null,
    motion: motion ? Boolean(motion.value) : null,
    lastSeenMin,
    watts,
    highConsumption: device.labelIds.includes("lbl-alto-consumo"),
  };
}

export function formatLastSeen(min: number | null): string {
  if (min === null) return "—";
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export function formatWatts(w: number): string {
  if (w === 0) return "0 W";
  if (w < 1000) return `${w} W`;
  return `${(w / 1000).toFixed(1)} kW`;
}

/** Agrupa una lista de dispositivos por una función. Devuelve secciones ordenadas. */
export function groupDevices<K extends string>(
  devices: Device[],
  getKey: (d: Device) => K,
  getOrder?: (key: K) => number,
): { key: K; items: Device[] }[] {
  const map = new Map<K, Device[]>();
  for (const d of devices) {
    const k = getKey(d);
    const arr = map.get(k);
    if (arr) arr.push(d);
    else map.set(k, [d]);
  }
  const entries = Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  if (getOrder) entries.sort((a, b) => getOrder(a.key) - getOrder(b.key));
  return entries;
}

export const KIND_LABELS: Record<DeviceKind, string> = {
  light: "Luz",
  switch: "Enchufe/Switch",
  sensor: "Sensor",
  lock: "Cerradura",
  cover: "Persiana/Puerta",
  climate: "Clima",
  camera: "Cámara",
  speaker: "Altavoz",
  valve: "Válvula",
};
