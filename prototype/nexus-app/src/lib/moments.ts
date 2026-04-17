import type { PersonaId } from "./types";

/**
 * A "Moment" is a multi-device flow — a one-tap combination that orchestrates
 * several devices in sequence. Unlike a Scene (which is tied to a single
 * persona's specific capabilities), a Moment is device-kind aware and adapts
 * to whatever devices the active persona has.
 */
export type MomentStepAction =
  | { kind: "lights"; filter: "all" | "indoor" | "outdoor" | "sala" | "bedroom"; state: "on" | "off"; dim?: number }
  | { kind: "tv"; state: "on" | "off"; source?: string; volume?: number }
  | { kind: "climate"; mode?: "off" | "cool" | "heat" | "auto"; target?: number }
  | { kind: "scene"; sceneIdPattern: string } // substring match on scene id/name
  | { kind: "cameras"; state: "on" | "off" };

export interface MomentStep {
  /** Short label shown in the progress overlay, e.g. "Atenuando luces". */
  label: string;
  /** Parallel actions executed together in this step. */
  actions: MomentStepAction[];
  /** Delay in ms before moving to next step (visual pacing). */
  delayMs?: number;
}

export type TimeHint = "morning" | "afternoon" | "evening" | "night" | "any";

export interface Moment {
  id: string;
  name: string;
  /** 1-line description shown in the bar. */
  tagline: string;
  /** Emoji used as icon in the chip (keeps it vendor-neutral). */
  emoji: string;
  /** Tailwind gradient classes for the chip background. */
  gradient: string;
  /** When this moment is contextually suggested. */
  timeHints: TimeHint[];
  steps: MomentStep[];
}

/** Resolve current time-of-day bucket from a Date. */
export function timeOfDay(d: Date): TimeHint {
  const h = d.getHours();
  if (h < 6) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  if (h < 22) return "evening";
  return "night";
}

/**
 * Ordered list of built-in moments. The canvas will surface the first
 * moment whose timeHints match the current time-of-day as "Sugerido".
 */
export const MOMENTS: Moment[] = [
  {
    id: "moment-despertar",
    name: "Despertar",
    tagline: "Luces suaves, clima cómodo, buenos días",
    emoji: "🌅",
    gradient: "from-[#FFE4B8] to-[#FFC58A] dark:from-gold/25 dark:to-gold/5",
    timeHints: ["morning"],
    steps: [
      { label: "Subiendo luces", actions: [{ kind: "lights", filter: "all", state: "on", dim: 40 }], delayMs: 500 },
      { label: "Ajustando clima", actions: [{ kind: "climate", mode: "auto", target: 23 }], delayMs: 400 },
      { label: "Listo", actions: [{ kind: "lights", filter: "sala", state: "on", dim: 70 }] },
    ],
  },
  {
    id: "moment-llegar",
    name: "Llegar a casa",
    tagline: "Bienvenida cálida, todo listo",
    emoji: "🏠",
    gradient: "from-[#FFE9B8] to-[#FFD27A]",
    timeHints: ["afternoon", "evening"],
    steps: [
      { label: "Encendiendo entrada", actions: [{ kind: "lights", filter: "indoor", state: "on", dim: 80 }], delayMs: 400 },
      { label: "Activando escena de llegada", actions: [{ kind: "scene", sceneIdPattern: "bienvenida|llegada|noche" }], delayMs: 400 },
      { label: "Clima confort", actions: [{ kind: "climate", mode: "auto", target: 22 }] },
    ],
  },
  {
    id: "moment-cine",
    name: "Modo cine",
    tagline: "Luces al 15%, TV encendida, clima fresco",
    emoji: "🎬",
    gradient: "from-[#1a1a3e] to-[#3b1f5b] text-white",
    timeHints: ["evening", "night", "afternoon"],
    steps: [
      { label: "Bajando luces", actions: [{ kind: "lights", filter: "sala", state: "on", dim: 15 }], delayMs: 500 },
      { label: "Encendiendo TV", actions: [{ kind: "tv", state: "on", source: "Netflix", volume: 40 }], delayMs: 400 },
      { label: "Clima fresco", actions: [{ kind: "climate", mode: "cool", target: 22 }] },
    ],
  },
  {
    id: "moment-leer",
    name: "Leer",
    tagline: "Luz cálida, TV apagada, silencio",
    emoji: "📖",
    gradient: "from-[#F5E6C8] to-[#E8D5A0]",
    timeHints: ["afternoon", "evening"],
    steps: [
      { label: "Luz de lectura", actions: [{ kind: "lights", filter: "sala", state: "on", dim: 85 }], delayMs: 400 },
      { label: "Apagando TV", actions: [{ kind: "tv", state: "off" }] },
    ],
  },
  {
    id: "moment-cenar",
    name: "Cenar",
    tagline: "Ambiente de comedor, música suave",
    emoji: "🍽️",
    gradient: "from-[#FFD9B3] to-[#FFA87A]",
    timeHints: ["evening"],
    steps: [
      { label: "Ambientando", actions: [{ kind: "lights", filter: "indoor", state: "on", dim: 60 }], delayMs: 400 },
      { label: "Música", actions: [{ kind: "tv", state: "on", source: "Spotify", volume: 25 }] },
    ],
  },
  {
    id: "moment-dormir",
    name: "Dormir",
    tagline: "Todo apagado, cámaras vigilando",
    emoji: "🌙",
    gradient: "from-[#1e2140] to-[#0a0e1f] text-white",
    timeHints: ["night"],
    steps: [
      { label: "Apagando luces", actions: [{ kind: "lights", filter: "all", state: "off" }], delayMs: 500 },
      { label: "Apagando TV", actions: [{ kind: "tv", state: "off" }], delayMs: 300 },
      { label: "Clima nocturno", actions: [{ kind: "climate", mode: "cool", target: 20 }] },
    ],
  },
  {
    id: "moment-fuera",
    name: "Salir de casa",
    tagline: "Ahorrar energía y asegurar",
    emoji: "🚪",
    gradient: "from-[#E5E7EB] to-[#9CA3AF]",
    timeHints: ["any"],
    steps: [
      { label: "Apagando luces", actions: [{ kind: "lights", filter: "all", state: "off" }], delayMs: 400 },
      { label: "TV off", actions: [{ kind: "tv", state: "off" }], delayMs: 300 },
      { label: "Clima eco", actions: [{ kind: "climate", mode: "off" }] },
    ],
  },
];

/** Pick the moment best suited for the current time-of-day. */
export function suggestedMoment(d: Date, personaId: PersonaId): Moment {
  const bucket = timeOfDay(d);
  void personaId; // reserved for future persona-specific tuning
  const match = MOMENTS.find((m) => m.timeHints.includes(bucket));
  return match ?? MOMENTS[0];
}
