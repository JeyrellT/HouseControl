"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ACTIVITY,
  CAPABILITIES,
  DEVICES,
  FLOORS,
  GATEWAYS,
  LABELS,
  NOTIFICATIONS,
  PERSONAS,
  PLATFORMS,
  ROOMS,
  SCENES,
  USERS,
  VIRTUAL_DEVICES,
  VOICE_INTENTS,
} from "@/data/seed";
import type {
  ActivityEvent,
  Capability,
  PersonaId,
  Scene,
  Device,
  HomeWidget,
  WidgetSize,
  TVState,
  AlarmMode,
  ZoneScope,
} from "./types";
import { emit } from "./event-bus";
import { toast } from "./toast-store";
import { MOMENTS, type Moment, type MomentStepAction } from "./moments";

type Role = "owner" | "admin" | "technician" | "viewer";

export interface OwnerProfile {
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  avatarEmoji: string;
  // Contexto que la IA usará al responder
  aiContext: {
    preferredName: string;
    lifestyle: string;
    schedule: string;
    preferences: string;
    specialNotes: string;
    communicationStyle: "formal" | "casual" | "technical";
    language: string;
  };
}

const DEFAULT_PROFILE: OwnerProfile = {
  displayName: "",
  email: "",
  phone: "",
  bio: "",
  avatarEmoji: "🏠",
  aiContext: {
    preferredName: "",
    lifestyle: "",
    schedule: "",
    preferences: "",
    specialNotes: "",
    communicationStyle: "casual",
    language: "es",
  },
};

const DEFAULT_TV_STATE: TVState = {
  source: "HDMI1",
  volume: 35,
  muted: false,
  channel: 1,
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

interface NexusStore {
  // ----- Sitio activo -----
  activePersonaId: PersonaId;
  setActivePersona: (id: PersonaId) => void;

  // ----- UX -----
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  presentationMode: boolean;
  togglePresentation: () => void;
  density: "minimal" | "dense";
  setDensity: (d: "minimal" | "dense") => void;

  // ----- RBAC -----
  activeRole: Role;
  setRole: (r: Role) => void;

  // ----- IA (Gemini) -----
  geminiApiKey: string;
  geminiModel: string;
  setGeminiApiKey: (k: string) => void;
  setGeminiModel: (m: string) => void;

  // ----- Perfil del propietario -----
  ownerProfile: OwnerProfile;
  updateOwnerProfile: (patch: Partial<OwnerProfile>) => void;
  updateAIContext: (patch: Partial<OwnerProfile["aiContext"]>) => void;

  // ----- Home Canvas (panel táctil) -----
  homeWidgets: Record<PersonaId, HomeWidget[]>;
  homeCanvasInitialized: PersonaId[];
  homeEditMode: boolean;
  addHomeWidget: (personaId: PersonaId, widget: HomeWidget) => void;
  removeHomeWidget: (personaId: PersonaId, widgetId: string) => void;
  reorderHomeWidgets: (personaId: PersonaId, orderedIds: string[]) => void;
  resizeHomeWidget: (personaId: PersonaId, widgetId: string, size: WidgetSize) => void;
  updateHomeWidget: (personaId: PersonaId, widgetId: string, patch: Partial<HomeWidget>) => void;
  toggleHomeEditMode: () => void;
  seedHomeCanvas: (personaId: PersonaId) => void;
  resetHomeCanvas: (personaId: PersonaId) => void;

  // ----- TV demo state (por device) -----
  tvStates: Record<string, TVState>;
  setTvState: (deviceId: string, patch: Partial<TVState>) => void;

  // ----- Estado en vivo (capabilities mutables) -----
  capabilities: Record<string, Capability>;
  toggleDevice: (deviceId: string) => void;
  setCapability: (capabilityId: string, value: unknown) => void;

  // ----- Activity (append-only) -----
  activity: ActivityEvent[];
  appendActivity: (a: ActivityEvent) => void;

  // ----- Escenas custom -----
  userScenes: Scene[]; // creadas o sobrescritas por el usuario
  deletedSeedSceneIds: string[];
  upsertScene: (scene: Scene) => void;
  deleteScene: (sceneId: string) => void;

  // ----- Acciones de alto nivel -----
  runScene: (sceneId: string) => void;
  resetDemo: () => void;

  // ----- Momentos (flujos multi-dispositivo) -----
  currentMoment: {
    momentId: string;
    stepIndex: number;
    totalSteps: number;
    stepLabel: string;
    affectedDeviceIds: string[];
  } | null;
  runMoment: (momentId: string) => void;

  // ----- Seguridad: alarma global -----
  alarm: {
    mode: AlarmMode;
    lastChanged: string;
    panic: boolean;
  };
  setAlarmMode: (mode: AlarmMode) => void;
  triggerPanic: () => void;
  clearPanic: () => void;

  // ----- Zona: acciones masivas room/floor -----
  applyZoneLights: (scope: ZoneScope, targetId: string, action: "on" | "off" | "dim", dim?: number) => void;
  applyZoneLocks: (scope: ZoneScope, targetId: string, action: "lock" | "unlock") => void;
}

const capabilitiesIndex: Record<string, Capability> = Object.fromEntries(
  CAPABILITIES.map((c) => [c.id, c]),
);

/* ── Moment orchestration helpers ─────────────────────────── */

function isOutdoorRoomId(roomId: string): boolean {
  return /exterior|jardin|jard[ií]n|patio|garage|gara|piscina|terraza/.test(roomId.toLowerCase());
}

function matchLightFilter(device: Device, filter: "all" | "indoor" | "outdoor" | "sala" | "bedroom"): boolean {
  if (device.kind !== "light") return false;
  if (filter === "all") return true;
  const rid = device.roomId.toLowerCase();
  const name = device.name.toLowerCase();
  if (filter === "sala") return rid.includes("sala") || name.includes("sala");
  if (filter === "bedroom") return rid.includes("master") || rid.includes("hijos") || rid.includes("dorm") || rid.includes("bedroom");
  const isOutdoor = isOutdoorRoomId(rid);
  return filter === "outdoor" ? isOutdoor : !isOutdoor;
}

function matchLockFilter(device: Device, filter: "all" | "indoor" | "outdoor"): boolean {
  if (device.kind !== "lock") return false;
  if (filter === "all") return true;
  const isOutdoor = isOutdoorRoomId(device.roomId);
  return filter === "outdoor" ? isOutdoor : !isOutdoor;
}

/**
 * Detect if a lock device is currently locked. Supports both seed conventions:
 *  - capability kind "on_off" with boolean (true = locked)
 *  - capability kind "lock" with string ("locked" / "unlocked")
 */
export function isDeviceLocked(
  device: Device,
  capabilities: Record<string, Capability | undefined>,
): boolean {
  for (const cid of device.capabilityIds) {
    const c = capabilities[cid];
    if (!c) continue;
    if (c.kind === "on_off") return Boolean(c.value);
    if (c.kind === "lock") return c.value === "locked";
  }
  return false;
}

function collectAffectedDeviceIds(action: MomentStepAction, personaDevices: Device[]): string[] {
  switch (action.kind) {
    case "lights":
      return personaDevices.filter((d) => matchLightFilter(d, action.filter)).map((d) => d.id);
    case "tv": {
      const tv = personaDevices.find(
        (d) => d.kind === "switch" && d.labelIds?.includes("lbl-entretenimiento"),
      );
      return tv ? [tv.id] : [];
    }
    case "climate":
      return personaDevices.filter((d) => d.kind === "climate").map((d) => d.id);
    case "cameras":
      return personaDevices.filter((d) => d.kind === "camera").map((d) => d.id);
    case "locks":
      return personaDevices.filter((d) => matchLockFilter(d, action.filter ?? "all")).map((d) => d.id);
    case "scene":
    case "alarm":
      return [];
  }
}

interface MomentExecCtx {
  personaDevices: Device[];
  scenes: Scene[];
  capabilities: Record<string, Capability>;
  setCapability: (capId: string, value: unknown) => void;
  toggleDevice: (deviceId: string) => void;
  setTvState: (deviceId: string, patch: Partial<TVState>) => void;
  runScene: (sceneId: string) => void;
  setAlarmMode: (mode: AlarmMode) => void;
}

function executeMomentAction(action: MomentStepAction, ctx: MomentExecCtx): void {
  const { personaDevices, scenes, capabilities, setCapability, toggleDevice, setTvState, runScene, setAlarmMode } = ctx;

  switch (action.kind) {
    case "lights": {
      const devs = personaDevices.filter((d) => matchLightFilter(d, action.filter));
      for (const d of devs) {
        const caps = d.capabilityIds.map((cid) => capabilities[cid]).filter(Boolean);
        const onCap = caps.find((c) => c?.kind === "on_off");
        const dimCap = caps.find((c) => c?.kind === "dim");
        const targetOn = action.state === "on";
        if (onCap && Boolean(onCap.value) !== targetOn) toggleDevice(d.id);
        if (targetOn && dimCap && typeof action.dim === "number") {
          setCapability(dimCap.id, action.dim);
        }
      }
      return;
    }
    case "tv": {
      const tv = personaDevices.find(
        (d) => d.kind === "switch" && d.labelIds?.includes("lbl-entretenimiento"),
      );
      if (!tv) return;
      const onCap = tv.capabilityIds.map((cid) => capabilities[cid]).find((c) => c?.kind === "on_off");
      const targetOn = action.state === "on";
      if (onCap && Boolean(onCap.value) !== targetOn) toggleDevice(tv.id);
      if (targetOn) {
        const patch: Partial<TVState> = {};
        if (action.source) patch.source = action.source;
        if (typeof action.volume === "number") {
          patch.volume = action.volume;
          patch.muted = false;
        }
        if (Object.keys(patch).length) setTvState(tv.id, patch);
      }
      return;
    }
    case "climate": {
      const climates = personaDevices.filter((d) => d.kind === "climate");
      for (const d of climates) {
        const thermoCap = d.capabilityIds
          .map((cid) => capabilities[cid])
          .find((c) => c?.kind === "thermostat");
        if (!thermoCap) continue;
        const current = (thermoCap.value && typeof thermoCap.value === "object")
          ? (thermoCap.value as Record<string, unknown>)
          : {};
        const next = { ...current };
        if (action.mode) next.mode = action.mode;
        if (typeof action.target === "number") next.target = action.target;
        setCapability(thermoCap.id, next);
      }
      return;
    }
    case "scene": {
      const pattern = new RegExp(action.sceneIdPattern, "i");
      const match = scenes.find((s) => pattern.test(s.id) || pattern.test(s.name));
      if (match) runScene(match.id);
      return;
    }
    case "locks": {
      const filter = action.filter ?? "all";
      const targetLocked = action.state === "lock";
      const locks = personaDevices.filter((d) => matchLockFilter(d, filter));
      for (const d of locks) {
        if (isDeviceLocked(d, capabilities) !== targetLocked) toggleDevice(d.id);
      }
      return;
    }
    case "alarm": {
      setAlarmMode(action.mode);
      return;
    }
    case "cameras":
      // Cameras are typically always-on; this is a placeholder for future control.
      return;
  }
}

export const useNexus = create<NexusStore>()(
  persist(
    (set, get) => ({
      activePersonaId: "villa-aurora",
      setActivePersona: (id) => set({ activePersonaId: id }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      mobileNavOpen: false,
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      presentationMode: false,
      togglePresentation: () => set((s) => ({ presentationMode: !s.presentationMode })),
      density: "minimal",
      setDensity: (d) => set({ density: d }),

      activeRole: "owner",
      setRole: (r) => {
        set({ activeRole: r });
        emit({ type: "rbac.role-changed", source: "user", attributes: { role: r } });
      },

      geminiApiKey: "",
      geminiModel: "gemini-2.5-flash",
      setGeminiApiKey: (k) => set({ geminiApiKey: k }),
      setGeminiModel: (m) => set({ geminiModel: m }),

      ownerProfile: DEFAULT_PROFILE,
      updateOwnerProfile: (patch) =>
        set((s) => ({ ownerProfile: { ...s.ownerProfile, ...patch } })),
      updateAIContext: (patch) =>
        set((s) => ({
          ownerProfile: {
            ...s.ownerProfile,
            aiContext: { ...s.ownerProfile.aiContext, ...patch },
          },
        })),

      homeWidgets: {
        "villa-aurora": [],
        "nexus-hq": [],
        "finca-las-palmas": [],
      },
      homeCanvasInitialized: [],
      homeEditMode: false,
      addHomeWidget: (personaId, widget) =>
        set((s) => ({
          homeWidgets: {
            ...s.homeWidgets,
            [personaId]: [...(s.homeWidgets[personaId] ?? []), widget],
          },
        })),
      removeHomeWidget: (personaId, widgetId) =>
        set((s) => ({
          homeWidgets: {
            ...s.homeWidgets,
            [personaId]: (s.homeWidgets[personaId] ?? []).filter((w) => w.id !== widgetId),
          },
        })),
      reorderHomeWidgets: (personaId, orderedIds) =>
        set((s) => {
          const byId = new Map((s.homeWidgets[personaId] ?? []).map((w) => [w.id, w]));
          const next = orderedIds
            .map((id) => byId.get(id))
            .filter((w): w is HomeWidget => Boolean(w));
          return {
            homeWidgets: { ...s.homeWidgets, [personaId]: next },
          };
        }),
      resizeHomeWidget: (personaId, widgetId, size) =>
        set((s) => ({
          homeWidgets: {
            ...s.homeWidgets,
            [personaId]: (s.homeWidgets[personaId] ?? []).map((w) =>
              w.id === widgetId ? ({ ...w, size } as HomeWidget) : w,
            ),
          },
        })),
      updateHomeWidget: (personaId, widgetId, patch) =>
        set((s) => ({
          homeWidgets: {
            ...s.homeWidgets,
            [personaId]: (s.homeWidgets[personaId] ?? []).map((w) =>
              w.id === widgetId ? ({ ...w, ...patch } as HomeWidget) : w,
            ),
          },
        })),
      toggleHomeEditMode: () => set((s) => ({ homeEditMode: !s.homeEditMode })),
      seedHomeCanvas: (personaId) => {
        const state = get();
        if (state.homeCanvasInitialized.includes(personaId)) return;
        const devices = DEVICES.filter((d) => d.personaId === personaId);
        const scenes = SCENES.filter((s) => s.personaId === personaId);
        const seed: HomeWidget[] = [];

        const firstCamera = devices.find((d) => d.kind === "camera" && d.availability === "online")
          ?? devices.find((d) => d.kind === "camera");
        if (firstCamera) {
          seed.push({ id: uid("w"), type: "camera", size: "L", deviceId: firstCamera.id });
        }

        // Lights from sala/principal/common room — fallback to first N lights
        const lights = devices.filter((d) => d.kind === "light");
        const salaLights = lights.filter((d) => d.roomId.includes("sala"))
          .slice(0, 4)
          .map((d) => d.id);
        const lightIds = salaLights.length >= 2
          ? salaLights
          : lights.slice(0, 3).map((d) => d.id);
        if (lightIds.length > 0) {
          seed.push({
            id: uid("w"), type: "lightGroup", size: "M",
            deviceIds: lightIds, name: salaLights.length ? "Sala" : "Luces principales",
          });
        }

        const tvDevice = devices.find(
          (d) => d.labelIds.includes("lbl-entretenimiento") && d.kind === "switch",
        );
        if (tvDevice) {
          seed.push({ id: uid("w"), type: "tv", size: "M", deviceId: tvDevice.id });
        }

        if (scenes[0]) {
          seed.push({ id: uid("w"), type: "scene", size: "S", sceneId: scenes[0].id });
        }
        if (scenes[1]) {
          seed.push({ id: uid("w"), type: "scene", size: "S", sceneId: scenes[1].id });
        }
        if (scenes[2]) {
          seed.push({ id: uid("w"), type: "scene", size: "S", sceneId: scenes[2].id });
        }
        if (scenes[3]) {
          seed.push({ id: uid("w"), type: "scene", size: "S", sceneId: scenes[3].id });
        }

        const climate = devices.find((d) => d.kind === "climate");
        if (climate) {
          seed.push({ id: uid("w"), type: "climate", size: "M", deviceId: climate.id });
        }

        // Security panel whenever the persona has locks
        if (devices.some((d) => d.kind === "lock")) {
          seed.push({ id: uid("w"), type: "securityPanel", size: "S" });
        }

        // ControlHub seeded for the persona's first floor with a curated
        // selection of devices so the demo feels populated out of the box.
        const personaFloors = FLOORS.filter((f) => f.personaId === personaId).sort((a, b) => a.order - b.order);
        const groundFloor = personaFloors[0];
        if (groundFloor) {
          const floorDevices = devices.filter((d) => d.floorId === groundFloor.id);
          const curated: string[] = [];
          // Up to 10 devices: all locks, covers, up to 4 lights, up to 2 switches, climate
          floorDevices.filter((d) => d.kind === "lock").forEach((d) => curated.push(d.id));
          floorDevices.filter((d) => d.kind === "cover").slice(0, 2).forEach((d) => curated.push(d.id));
          floorDevices.filter((d) => d.kind === "light").slice(0, 4).forEach((d) => curated.push(d.id));
          floorDevices.filter((d) => d.kind === "switch").slice(0, 2).forEach((d) => curated.push(d.id));
          const firstClimate = floorDevices.find((d) => d.kind === "climate");
          if (firstClimate) curated.push(firstClimate.id);
          seed.push({
            id: uid("w"),
            type: "controlHub",
            size: "L",
            scope: "floor",
            targetId: groundFloor.id,
            selectedDeviceIds: curated,
            showSecurity: true,
          });
        }

        set((s) => ({
          homeWidgets: { ...s.homeWidgets, [personaId]: seed },
          homeCanvasInitialized: [...s.homeCanvasInitialized, personaId],
        }));
      },
      resetHomeCanvas: (personaId) =>
        set((s) => ({
          homeWidgets: { ...s.homeWidgets, [personaId]: [] },
          homeCanvasInitialized: s.homeCanvasInitialized.filter((p) => p !== personaId),
        })),

      tvStates: {},
      setTvState: (deviceId, patch) =>
        set((s) => ({
          tvStates: {
            ...s.tvStates,
            [deviceId]: { ...DEFAULT_TV_STATE, ...s.tvStates[deviceId], ...patch },
          },
        })),

      userScenes: [],
      deletedSeedSceneIds: [],
      upsertScene: (scene) =>
        set((s) => {
          const idx = s.userScenes.findIndex((u) => u.id === scene.id);
          const next = [...s.userScenes];
          if (idx >= 0) next[idx] = scene;
          else next.push(scene);
          return { userScenes: next };
        }),
      deleteScene: (sceneId) =>
        set((s) => {
          const userIdx = s.userScenes.findIndex((u) => u.id === sceneId);
          if (userIdx >= 0) {
            return { userScenes: s.userScenes.filter((u) => u.id !== sceneId) };
          }
          if (SCENES.some((seed) => seed.id === sceneId)) {
            return { deletedSeedSceneIds: [...s.deletedSeedSceneIds, sceneId] };
          }
          return s;
        }),

      capabilities: capabilitiesIndex,
      toggleDevice: (deviceId) => {
        const dev = DEVICES.find((d) => d.id === deviceId);
        if (!dev) return;
        // Locks may use either "on_off" or "lock" capability kind.
        // Pick the first usable one (prefer on_off if it exists).
        let onOffCapId = dev.capabilityIds.find((cid: string) => {
          const c = get().capabilities[cid];
          return c?.kind === "on_off";
        });
        let isLockKind = false;
        if (!onOffCapId && dev.kind === "lock") {
          onOffCapId = dev.capabilityIds.find((cid: string) => {
            const c = get().capabilities[cid];
            return c?.kind === "lock";
          });
          isLockKind = Boolean(onOffCapId);
        }
        if (!onOffCapId) return;
        const capId = onOffCapId;
        const cap = get().capabilities[capId];
        const newValue = isLockKind
          ? cap.value === "locked"
            ? "unlocked"
            : "locked"
          : !cap.value;
        const updated: Capability = {
          ...cap,
          value: newValue,
          ts: new Date().toISOString(),
          version: cap.version + 1,
        };
        set((s) => ({
          capabilities: { ...s.capabilities, [capId]: updated },
        }));
        const correlationId = `cmd_${Date.now().toString(36)}`;
        const isOn = isLockKind ? newValue === "locked" : Boolean(newValue);
        const capabilityName = isLockKind ? "lock" : "on_off";
        emit({
          type: "command.ack", deviceId, capability: capabilityName, value: newValue,
          source: "user", correlationId,
        });
        emit({
          type: "device.state.changed", deviceId, capability: capabilityName, value: newValue,
          source: "user", correlationId, version: updated.version,
        });
        const intent = isLockKind ? (isOn ? "Cerrar" : "Abrir") : (isOn ? "Encender" : "Apagar");
        const past = isLockKind ? (isOn ? "cerrado" : "abierto") : (isOn ? "encendido" : "apagado");
        get().appendActivity({
          id: `act_${Date.now().toString(36)}`,
          personaId: dev.personaId,
          ts: updated.ts,
          actor: "user",
          intent,
          target: dev.id,
          outcome: "success",
          source: dev.vendor,
          severity: "info",
          summary: `${dev.name} ${past}`,
        });
        toast.success(
          `${intent}: ${dev.name}`,
          undefined,
          { icon: isOn ? "Zap" : "Check", duration: 2500 },
        );
      },
      setCapability: (capabilityId, value) => {
        const cap = get().capabilities[capabilityId];
        if (!cap) return;
        set((s) => ({
          capabilities: {
            ...s.capabilities,
            [capabilityId]: {
              ...cap,
              value,
              ts: new Date().toISOString(),
              version: cap.version + 1,
            },
          },
        }));
      },

      activity: ACTIVITY,
      appendActivity: (a) => set((s) => ({ activity: [a, ...s.activity].slice(0, 200) })),

      runScene: (sceneId) => {
        const scene =
          get().userScenes.find((s) => s.id === sceneId) ??
          SCENES.find((s) => s.id === sceneId);
        if (!scene) return;
        const updates: Record<string, Capability> = {};
        Object.entries(scene.targetStates).forEach(([capId, value]) => {
          const cap = get().capabilities[capId];
          if (!cap) return;
          const merged =
            typeof value === "object" && value !== null && !Array.isArray(value) &&
            cap.value && typeof cap.value === "object"
              ? { ...(cap.value as object), ...(value as object) }
              : value;
          updates[capId] = {
            ...cap,
            value: merged,
            ts: new Date().toISOString(),
            version: cap.version + 1,
          };
        });
        set((s) => ({ capabilities: { ...s.capabilities, ...updates } }));
        emit({ type: "scene.activated", source: "user", attributes: { sceneId } });
        get().appendActivity({
          id: `act_${Date.now().toString(36)}`,
          personaId: scene.personaId,
          ts: new Date().toISOString(),
          actor: "user",
          intent: "scene.activate",
          target: sceneId,
          outcome: "success",
          source: "user",
          severity: "info",
          summary: `Escena "${scene.name}" activada`,
        });
        toast.ai(
          `Escena "${scene.name}" activada`,
          `${Object.keys(scene.targetStates).length} dispositivos ajustados`,
          { icon: "Sparkles", duration: 3500 },
        );
      },

      currentMoment: null,
      runMoment: (momentId) => {
        const moment = MOMENTS.find((m) => m.id === momentId);
        if (!moment) return;
        const state = get();
        const personaId = state.activePersonaId;
        const personaDevices = DEVICES.filter((d) => d.personaId === personaId);
        const scenes = [
          ...SCENES.filter((s) => s.personaId === personaId),
          ...state.userScenes.filter((s) => s.personaId === personaId),
        ];

        // Pre-compute all device IDs that any step will touch, for UI highlight.
        const allAffected = new Set<string>();
        for (const step of moment.steps) {
          for (const act of step.actions) {
            collectAffectedDeviceIds(act, personaDevices).forEach((id) => allAffected.add(id));
          }
        }

        emit({
          type: "moment.started",
          source: "user",
          attributes: { momentId, momentName: moment.name },
        });

        toast.ai(
          `Momento "${moment.name}"`,
          moment.tagline,
          { icon: "Sparkles", duration: 2800 },
        );

        // Sequential step executor with visual pacing.
        const runStep = (idx: number) => {
          if (idx >= moment.steps.length) {
            set({ currentMoment: null });
            emit({
              type: "moment.finished",
              source: "user",
              attributes: { momentId },
            });
            return;
          }
          const step = moment.steps[idx];
          const affectedThisStep = new Set<string>();
          step.actions.forEach((a) =>
            collectAffectedDeviceIds(a, personaDevices).forEach((id) =>
              affectedThisStep.add(id),
            ),
          );

          set({
            currentMoment: {
              momentId,
              stepIndex: idx,
              totalSteps: moment.steps.length,
              stepLabel: step.label,
              affectedDeviceIds: Array.from(affectedThisStep),
            },
          });

          // Execute all actions in this step (parallel).
          for (const action of step.actions) {
            executeMomentAction(action, {
              personaDevices,
              scenes,
              capabilities: get().capabilities,
              setCapability: get().setCapability,
              toggleDevice: get().toggleDevice,
              setTvState: get().setTvState,
              runScene: get().runScene,
              setAlarmMode: get().setAlarmMode,
            });
          }

          const delay = step.delayMs ?? 350;
          setTimeout(() => runStep(idx + 1), delay);
        };

        runStep(0);

        get().appendActivity({
          id: `act_${Date.now().toString(36)}`,
          personaId,
          ts: new Date().toISOString(),
          actor: "user",
          intent: "moment.run",
          target: momentId,
          outcome: "success",
          source: "user",
          severity: "info",
          summary: `Momento "${moment.name}" activado · ${allAffected.size} dispositivos`,
        });
      },

      resetDemo: () => {
        set({
          capabilities: capabilitiesIndex,
          activity: ACTIVITY,
          activePersonaId: "villa-aurora",
          presentationMode: false,
          activeRole: "owner",
          density: "minimal",
          userScenes: [],
          deletedSeedSceneIds: [],
          alarm: { mode: "disarmed", lastChanged: new Date().toISOString(), panic: false },
        });
        emit({ type: "demo.reset", source: "user" });
        toast.info("Demo reiniciada", "Estado restaurado al inicial", { icon: "Info", duration: 2500 });
      },

      // ----- Seguridad: alarma global -----
      alarm: { mode: "disarmed", lastChanged: new Date().toISOString(), panic: false },
      setAlarmMode: (mode) => {
        const prev = get().alarm.mode;
        if (prev === mode) return;
        const ts = new Date().toISOString();
        set({ alarm: { ...get().alarm, mode, lastChanged: ts } });
        emit({
          type: mode === "disarmed" ? "alarm.disarmed" : "alarm.armed",
          source: "user",
          attributes: { mode, prev },
        });
        const labelMap: Record<AlarmMode, string> = {
          home: "Modo Casa",
          away: "Modo Ausente",
          night: "Modo Noche",
          disarmed: "Alarma desactivada",
        };
        const taglineMap: Record<AlarmMode, string> = {
          home: "Sensores exteriores armados",
          away: "Todo armado y asegurado",
          night: "Exteriores y planta baja armados",
          disarmed: "Sin vigilancia activa",
        };
        toast.success(labelMap[mode], taglineMap[mode], {
          icon: mode === "disarmed" ? "Check" : "Shield",
          duration: 2500,
        });
        get().appendActivity({
          id: `act_${Date.now().toString(36)}`,
          personaId: get().activePersonaId,
          ts,
          actor: "user",
          intent: "alarm.setMode",
          target: mode,
          outcome: "success",
          source: "user",
          severity: "info",
          summary: `${labelMap[mode]} activado`,
        });
      },
      triggerPanic: () => {
        const ts = new Date().toISOString();
        set({ alarm: { ...get().alarm, panic: true, lastChanged: ts } });
        emit({ type: "panic.activated", source: "user" });
        // Activate any siren-labeled switch device for the active persona.
        const personaId = get().activePersonaId;
        const sirens = DEVICES.filter(
          (d) =>
            d.personaId === personaId &&
            d.kind === "switch" &&
            (d.name.toLowerCase().includes("sirena") || d.labelIds.includes("lbl-emergencia")),
        );
        for (const s of sirens) {
          const onCap = s.capabilityIds
            .map((cid) => get().capabilities[cid])
            .find((c) => c?.kind === "on_off");
          if (onCap && !onCap.value) get().toggleDevice(s.id);
        }
        toast.info("PÁNICO activado", "Sirenas encendidas, contactos notificados", {
          icon: "AlertTriangle",
          duration: 4000,
        });
        get().appendActivity({
          id: `act_${Date.now().toString(36)}`,
          personaId,
          ts,
          actor: "user",
          intent: "panic.activate",
          target: "alarm",
          outcome: "success",
          source: "user",
          severity: "critical",
          summary: `Botón de pánico activado (${sirens.length} sirenas)`,
        });
      },
      clearPanic: () => {
        const ts = new Date().toISOString();
        set({ alarm: { ...get().alarm, panic: false, lastChanged: ts } });
        const personaId = get().activePersonaId;
        const sirens = DEVICES.filter(
          (d) =>
            d.personaId === personaId &&
            d.kind === "switch" &&
            (d.name.toLowerCase().includes("sirena") || d.labelIds.includes("lbl-emergencia")),
        );
        for (const s of sirens) {
          const onCap = s.capabilityIds
            .map((cid) => get().capabilities[cid])
            .find((c) => c?.kind === "on_off");
          if (onCap && onCap.value) get().toggleDevice(s.id);
        }
        toast.success("Pánico desactivado", "Sirenas apagadas", { icon: "Check", duration: 2200 });
      },

      // ----- Zona: acciones masivas room/floor -----
      applyZoneLights: (scope, targetId, action, dim) => {
        const personaId = get().activePersonaId;
        const personaDevices = DEVICES.filter((d) => d.personaId === personaId);
        const lightsInZone = personaDevices.filter((d) => {
          if (d.kind !== "light") return false;
          if (scope === "room") return d.roomId === targetId;
          // floor scope: device.floorId matches
          return d.floorId === targetId;
        });
        if (lightsInZone.length === 0) return;
        const wantOn = action !== "off";
        let touched = 0;
        for (const d of lightsInZone) {
          const caps = d.capabilityIds.map((cid) => get().capabilities[cid]).filter(Boolean);
          const onCap = caps.find((c) => c?.kind === "on_off");
          const dimCap = caps.find((c) => c?.kind === "dim");
          if (onCap && Boolean(onCap.value) !== wantOn) {
            get().toggleDevice(d.id);
            touched++;
          }
          if (wantOn && action === "dim" && dimCap && typeof dim === "number") {
            get().setCapability(dimCap.id, dim);
            touched++;
          }
        }
        emit({
          type: "zone.applied",
          source: "user",
          attributes: { scope, targetId, action, dim, touched },
        });
      },
      applyZoneLocks: (scope, targetId, action) => {
        const personaId = get().activePersonaId;
        const personaDevices = DEVICES.filter((d) => d.personaId === personaId);
        const locksInZone = personaDevices.filter((d) => {
          if (d.kind !== "lock") return false;
          if (scope === "room") return d.roomId === targetId;
          return d.floorId === targetId;
        });
        if (locksInZone.length === 0) return;
        const wantLocked = action === "lock";
        for (const d of locksInZone) {
          const currentlyLocked = isDeviceLocked(d, get().capabilities);
          if (currentlyLocked !== wantLocked) get().toggleDevice(d.id);
        }
        emit({
          type: "zone.applied",
          source: "user",
          attributes: { scope, targetId, action: wantLocked ? "lock" : "unlock" },
        });
      },
    }),
    {
      name: "nexus-store",
      partialize: (state) => ({
        activePersonaId: state.activePersonaId,
        sidebarCollapsed: state.sidebarCollapsed,
        presentationMode: state.presentationMode,
        density: state.density,
        activeRole: state.activeRole,
        geminiApiKey: state.geminiApiKey,
        geminiModel: state.geminiModel,
        ownerProfile: state.ownerProfile,
        userScenes: state.userScenes,
        deletedSeedSceneIds: state.deletedSeedSceneIds,
        homeWidgets: state.homeWidgets,
        homeCanvasInitialized: state.homeCanvasInitialized,
        tvStates: state.tvStates,
        alarm: state.alarm,
      }),
    },
  ),
);

// ----- Selectors / helpers (datos estáticos seed) -----
export const STATIC = {
  personas: PERSONAS,
  users: USERS,
  floors: FLOORS,
  rooms: ROOMS,
  labels: LABELS,
  devices: DEVICES,
  scenes: SCENES,
  virtualDevices: VIRTUAL_DEVICES,
  gateways: GATEWAYS,
  voiceIntents: VOICE_INTENTS,
  platforms: PLATFORMS,
  notifications: NOTIFICATIONS,
};

export function selectActivePersona(personaId: PersonaId) {
  return PERSONAS.find((p) => p.id === personaId)!;
}

export function selectDevicesByPersona(personaId: PersonaId): Device[] {
  return DEVICES.filter((d) => d.personaId === personaId);
}

export function selectRoomsByPersona(personaId: PersonaId) {
  return ROOMS.filter((r) => r.personaId === personaId);
}

export function selectFloorsByPersona(personaId: PersonaId) {
  return FLOORS.filter((f) => f.personaId === personaId);
}

export function selectScenesByPersona(
  personaId: PersonaId,
  userScenes?: Scene[],
  deletedSeedSceneIds?: string[],
) {
  const us = userScenes ?? useNexus.getState().userScenes;
  const deleted = deletedSeedSceneIds ?? useNexus.getState().deletedSeedSceneIds;
  const userIds = new Set(us.map((s) => s.id));
  const seed = SCENES.filter(
    (s) => s.personaId === personaId && !deleted.includes(s.id) && !userIds.has(s.id),
  );
  const user = us.filter((s) => s.personaId === personaId);
  return [...user, ...seed];
}

export function selectActivityByPersona(personaId: PersonaId, all: ActivityEvent[]) {
  return all.filter((a) => a.personaId === personaId);
}

export function selectNotificationsByPersona(personaId: PersonaId) {
  return NOTIFICATIONS.filter((n) => n.personaId === personaId);
}

export function selectVirtualDevicesByPersona(personaId: PersonaId) {
  return VIRTUAL_DEVICES.filter((v) => v.personaId === personaId);
}

export function selectGatewaysByPersona(personaId: PersonaId) {
  return GATEWAYS.filter((g) => g.personaId === personaId);
}

export function selectPrimaryUser(personaId: PersonaId) {
  const persona = PERSONAS.find((p) => p.id === personaId);
  return USERS.find((u) => u.id === persona?.primaryUserId);
}

/* ── Zone helpers (room/floor) ────────────────────────────── */

export function selectDevicesInZone(
  scope: "room" | "floor",
  targetId: string,
  personaId: PersonaId,
): Device[] {
  return DEVICES.filter(
    (d) =>
      d.personaId === personaId &&
      (scope === "room" ? d.roomId === targetId : d.floorId === targetId),
  );
}

export interface ZoneSummary {
  lightsTotal: number;
  lightsOn: number;
  avgDim: number | null;
  locksTotal: number;
  locksLocked: number;
  motionActive: boolean;
  climateAvgTemp: number | null;
}

/** Snapshot of zone state derived from current capability values. */
export function getZoneSummary(
  scope: "room" | "floor",
  targetId: string,
  personaId: PersonaId,
  capabilities: Record<string, Capability>,
): ZoneSummary {
  const devices = selectDevicesInZone(scope, targetId, personaId);
  let lightsTotal = 0;
  let lightsOn = 0;
  let dimSum = 0;
  let dimCount = 0;
  let locksTotal = 0;
  let locksLocked = 0;
  let motionActive = false;
  let climateSum = 0;
  let climateCount = 0;
  for (const d of devices) {
    const caps = d.capabilityIds.map((cid) => capabilities[cid]).filter(Boolean) as Capability[];
    const onCap = caps.find((c) => c.kind === "on_off");
    const dimCap = caps.find((c) => c.kind === "dim");
    const motionCap = caps.find((c) => c.kind === "motion");
    const thermo = caps.find((c) => c.kind === "thermostat");
    if (d.kind === "light") {
      lightsTotal++;
      if (onCap?.value) lightsOn++;
      if (dimCap && typeof dimCap.value === "number") {
        dimSum += dimCap.value as number;
        dimCount++;
      }
    }
    if (d.kind === "lock") {
      locksTotal++;
      if (isDeviceLocked(d, capabilities)) locksLocked++;
    }
    if (motionCap?.value) motionActive = true;
    if (d.kind === "climate" && thermo && typeof thermo.value === "object" && thermo.value) {
      const v = thermo.value as { current?: number; target?: number };
      if (typeof v.current === "number") {
        climateSum += v.current;
        climateCount++;
      }
    }
  }
  return {
    lightsTotal,
    lightsOn,
    avgDim: dimCount > 0 ? Math.round(dimSum / dimCount) : null,
    locksTotal,
    locksLocked,
    motionActive,
    climateAvgTemp: climateCount > 0 ? Math.round((climateSum / climateCount) * 10) / 10 : null,
  };
}
