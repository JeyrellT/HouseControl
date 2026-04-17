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
}

const capabilitiesIndex: Record<string, Capability> = Object.fromEntries(
  CAPABILITIES.map((c) => [c.id, c]),
);

/* ── Moment orchestration helpers ─────────────────────────── */

function matchLightFilter(device: Device, filter: "all" | "indoor" | "outdoor" | "sala" | "bedroom"): boolean {
  if (device.kind !== "light") return false;
  if (filter === "all") return true;
  const rid = device.roomId.toLowerCase();
  const name = device.name.toLowerCase();
  if (filter === "sala") return rid.includes("sala") || name.includes("sala");
  if (filter === "bedroom") return rid.includes("master") || rid.includes("hijos") || rid.includes("dorm") || rid.includes("bedroom");
  // "indoor"/"outdoor" heuristic: outdoor rooms usually contain "exterior"|"jardin"|"patio"|"garage"
  const isOutdoor = /exterior|jardin|jard[ií]n|patio|garage|gara|piscina|terraza/.test(rid);
  return filter === "outdoor" ? isOutdoor : !isOutdoor;
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
    case "scene":
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
}

function executeMomentAction(action: MomentStepAction, ctx: MomentExecCtx): void {
  const { personaDevices, scenes, capabilities, setCapability, toggleDevice, setTvState, runScene } = ctx;

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

        const climate = devices.find((d) => d.kind === "climate");
        if (climate) {
          seed.push({ id: uid("w"), type: "climate", size: "M", deviceId: climate.id });
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
        const onOffCapId = dev.capabilityIds.find((cid: string) => {
          const c = get().capabilities[cid];
          return c?.kind === "on_off";
        });
        if (!onOffCapId) return;
        const cap = get().capabilities[onOffCapId];
        const newValue = !cap.value;
        const updated: Capability = {
          ...cap,
          value: newValue,
          ts: new Date().toISOString(),
          version: cap.version + 1,
        };
        set((s) => ({
          capabilities: { ...s.capabilities, [onOffCapId]: updated },
        }));
        const correlationId = `cmd_${Date.now().toString(36)}`;
        emit({
          type: "command.ack", deviceId, capability: "on_off", value: newValue,
          source: "user", correlationId,
        });
        emit({
          type: "device.state.changed", deviceId, capability: "on_off", value: newValue,
          source: "user", correlationId, version: updated.version,
        });
        get().appendActivity({
          id: `act_${Date.now().toString(36)}`,
          personaId: dev.personaId,
          ts: updated.ts,
          actor: "user",
          intent: newValue ? "Encender" : "Apagar",
          target: dev.id,
          outcome: "success",
          source: dev.vendor,
          severity: "info",
          summary: `${dev.name} ${newValue ? "encendido" : "apagado"}`,
        });
        toast.success(
          `${newValue ? "Encendido" : "Apagado"}: ${dev.name}`,
          undefined,
          { icon: newValue ? "Zap" : "Check", duration: 2500 },
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
        });
        emit({ type: "demo.reset", source: "user" });
        toast.info("Demo reiniciada", "Estado restaurado al inicial", { icon: "Info", duration: 2500 });
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
