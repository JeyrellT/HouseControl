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
} from "./types";
import { emit } from "./event-bus";
import { toast } from "./toast-store";

type Role = "owner" | "admin" | "technician" | "viewer";

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
}

const capabilitiesIndex: Record<string, Capability> = Object.fromEntries(
  CAPABILITIES.map((c) => [c.id, c]),
);

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
        userScenes: state.userScenes,
        deletedSeedSceneIds: state.deletedSeedSceneIds,
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
