"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Camera, Lightbulb, Tv, Sparkles, Thermometer, ChevronRight, Check,
  Shield, LayoutGrid, Building, Sofa, SlidersHorizontal,
} from "lucide-react";
import { useNexus, STATIC, selectDevicesByPersona, selectScenesByPersona } from "@/lib/store";
import type { HomeWidget, PersonaId, WidgetType, Device } from "@/lib/types";
import { cn } from "@/lib/utils";

type Option = {
  type: WidgetType;
  label: string;
  description: string;
  Icon: typeof Camera;
  defaultSize: HomeWidget["size"];
};

const OPTIONS: Option[] = [
  { type: "camera", label: "Cámara", description: "Feed en vivo + controles de seguridad", Icon: Camera, defaultSize: "L" },
  { type: "controlHub", label: "Centro de control", description: "Elige planta/habitación + dispositivos específicos", Icon: SlidersHorizontal, defaultSize: "L" },
  { type: "zone", label: "Zona", description: "Controla toda una habitación o planta", Icon: LayoutGrid, defaultSize: "M" },
  { type: "securityPanel", label: "Seguridad", description: "Modo de alarma + pánico", Icon: Shield, defaultSize: "M" },
  { type: "lightGroup", label: "Grupo de luces", description: "Controla varias luces juntas", Icon: Lightbulb, defaultSize: "M" },
  { type: "tv", label: "TV", description: "Control remoto táctil", Icon: Tv, defaultSize: "M" },
  { type: "scene", label: "Escena", description: "Ejecuta rutinas con un toque", Icon: Sparkles, defaultSize: "S" },
  { type: "climate", label: "Clima", description: "Termostato y modo", Icon: Thermometer, defaultSize: "M" },
];

export function AddWidgetModal({
  open,
  personaId,
  onClose,
}: {
  open: boolean;
  personaId: PersonaId;
  onClose: () => void;
}) {
  const addWidget = useNexus((s) => s.addHomeWidget);
  const userScenes = useNexus((s) => s.userScenes);
  const deletedSeedSceneIds = useNexus((s) => s.deletedSeedSceneIds);
  const [step, setStep] = useState<"type" | "select">("type");
  const [chosen, setChosen] = useState<Option | null>(null);

  const devices = useMemo(
    () => selectDevicesByPersona(personaId),
    [personaId],
  );
  const cameras = devices.filter((d) => d.kind === "camera");
  const lights = devices.filter((d) => d.kind === "light");
  const tvs = devices.filter(
    (d) => d.kind === "switch" && d.labelIds?.includes("lbl-entretenimiento"),
  );
  const climates = devices.filter((d) => d.kind === "climate");
  const rooms = STATIC.rooms.filter((r) => r.personaId === personaId);
  const floors = STATIC.floors.filter((f) => f.personaId === personaId).sort((a, b) => a.order - b.order);
  const scenes = useMemo(
    () => selectScenesByPersona(personaId, userScenes, deletedSeedSceneIds),
    [personaId, userScenes, deletedSeedSceneIds],
  );

  function reset() {
    setStep("type");
    setChosen(null);
  }

  function pickType(opt: Option) {
    setChosen(opt);
    setStep("select");
  }

  function commit(widget: Omit<HomeWidget, "id">) {
    const id = `wgt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    addWidget(personaId, { ...widget, id } as HomeWidget);
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface border-t sm:border border-line shadow-2xl max-h-[88vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-soft">
                  {step === "type" ? "Paso 1 de 2" : "Paso 2 de 2"}
                </p>
                <h2 className="text-base font-semibold">
                  {step === "type" ? "Agregar widget" : `Elegir ${chosen?.label.toLowerCase()}`}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center hover:bg-line/40 transition"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {step === "type" && (
                <div className="p-4 space-y-2">
                  {OPTIONS.map((opt) => {
                    const Icon = opt.Icon;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => pickType(opt)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface-2 border border-line hover:border-gold-border/40 transition text-left"
                      >
                        <div className="w-11 h-11 rounded-xl bg-gold/20 text-gold-border flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-ink-soft truncate">
                            {opt.description}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-ink-soft shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {step === "select" && chosen?.type === "camera" && (
                <SimpleList
                  items={cameras}
                  empty="No hay cámaras disponibles para este espacio."
                  render={(d) => (
                    <PickRow
                      key={d.id}
                      title={d.name}
                      subtitle={STATIC.rooms.find((r) => r.id === d.roomId)?.name}
                      onClick={() =>
                        commit({
                          type: "camera",
                          size: chosen.defaultSize,
                          deviceId: d.id,
                        } as Omit<HomeWidget, "id">)
                      }
                    />
                  )}
                />
              )}

              {step === "select" && chosen?.type === "lightGroup" && (
                <LightGroupBuilder
                  lights={lights}
                  onCreate={(deviceIds, name) =>
                    commit({
                      type: "lightGroup",
                      size: chosen.defaultSize,
                      deviceIds,
                      name,
                    } as Omit<HomeWidget, "id">)
                  }
                />
              )}

              {step === "select" && chosen?.type === "tv" && (
                <SimpleList
                  items={tvs}
                  empty="No hay TVs disponibles en este espacio."
                  render={(d) => (
                    <PickRow
                      key={d.id}
                      title={d.name}
                      subtitle={STATIC.rooms.find((r) => r.id === d.roomId)?.name}
                      onClick={() =>
                        commit({
                          type: "tv",
                          size: chosen.defaultSize,
                          deviceId: d.id,
                        } as Omit<HomeWidget, "id">)
                      }
                    />
                  )}
                />
              )}

              {step === "select" && chosen?.type === "scene" && (
                <SimpleList
                  items={scenes}
                  empty="No hay escenas disponibles."
                  render={(s) => (
                    <PickRow
                      key={s.id}
                      title={s.name}
                      subtitle={s.description ?? `${Object.keys(s.targetStates).length} acciones`}
                      onClick={() =>
                        commit({
                          type: "scene",
                          size: chosen.defaultSize,
                          sceneId: s.id,
                        } as Omit<HomeWidget, "id">)
                      }
                    />
                  )}
                />
              )}

              {step === "select" && chosen?.type === "climate" && (
                <SimpleList
                  items={climates}
                  empty="No hay dispositivos de clima."
                  render={(d) => (
                    <PickRow
                      key={d.id}
                      title={d.name}
                      subtitle={STATIC.rooms.find((r) => r.id === d.roomId)?.name}
                      onClick={() =>
                        commit({
                          type: "climate",
                          size: chosen.defaultSize,
                          deviceId: d.id,
                        } as Omit<HomeWidget, "id">)
                      }
                    />
                  )}
                />
              )}

              {step === "select" && chosen?.type === "securityPanel" && (
                <div className="p-4">
                  <p className="text-sm text-ink-soft mb-3">
                    Panel central con los 4 modos de alarma (Casa, Ausente, Noche, Desarmado) y botón de pánico.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      commit({ type: "securityPanel", size: chosen.defaultSize } as Omit<HomeWidget, "id">)
                    }
                    className="w-full h-12 rounded-2xl bg-gold text-navy font-semibold"
                  >
                    Agregar panel
                  </button>
                </div>
              )}

              {step === "select" && chosen?.type === "zone" && (
                <ZonePicker
                  rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
                  floors={floors.map((f) => ({ id: f.id, name: f.name }))}
                  onCreate={(scope, targetId, name) =>
                    commit({
                      type: "zone",
                      size: chosen.defaultSize,
                      scope,
                      targetId,
                      name,
                    } as Omit<HomeWidget, "id">)
                  }
                />
              )}

              {step === "select" && chosen?.type === "controlHub" && (
                <ZonePicker
                  rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
                  floors={floors.map((f) => ({ id: f.id, name: f.name }))}
                  onCreate={(scope, targetId) =>
                    commit({
                      type: "controlHub",
                      size: chosen.defaultSize,
                      scope,
                      targetId,
                      selectedDeviceIds: [],
                      showSecurity: true,
                    } as Omit<HomeWidget, "id">)
                  }
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SimpleList<T>({
  items,
  empty,
  render,
}: {
  items: T[];
  empty: string;
  render: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-ink-soft">{empty}</div>
    );
  }
  return <div className="p-4 space-y-2">{items.map(render)}</div>;
}

function PickRow({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 min-h-[56px] rounded-2xl bg-surface-2 border border-line hover:border-gold-border/40 transition text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-ink-soft truncate">{subtitle}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-ink-soft shrink-0" />
    </button>
  );
}

function LightGroupBuilder({
  lights,
  onCreate,
}: {
  lights: Device[];
  onCreate: (deviceIds: string[], name: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("Luces");

  if (lights.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-ink-soft">
        No hay luces disponibles.
      </div>
    );
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-4">
      <label className="block mb-3">
        <span className="text-xs text-ink-soft">Nombre del grupo</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full h-11 px-3 rounded-xl bg-surface-2 border border-line text-sm focus:outline-none focus:border-gold-border"
          placeholder="Ej. Sala"
        />
      </label>

      <p className="text-xs text-ink-soft mb-2">
        Selecciona las luces ({selected.size})
      </p>
      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
        {lights.map((d) => {
          const active = selected.has(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => toggle(d.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 min-h-[56px] rounded-2xl border transition text-left",
                active
                  ? "bg-gold/15 border-gold-border"
                  : "bg-surface-2 border-line hover:border-gold-border/40",
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0",
                  active
                    ? "bg-gold border-gold-border text-navy"
                    : "border-line",
                )}
              >
                {active && <Check className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-ink-soft truncate">
                  {STATIC.rooms.find((r) => r.id === d.roomId)?.name ?? ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onCreate(Array.from(selected), name.trim() || "Luces")}
        disabled={selected.size === 0}
        className="mt-4 w-full h-12 rounded-2xl bg-gold text-navy font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition hover:shadow-soft"
      >
        Agregar grupo ({selected.size})
      </button>
    </div>
  );
}

function ZonePicker({
  rooms,
  floors,
  onCreate,
}: {
  rooms: { id: string; name: string }[];
  floors: { id: string; name: string }[];
  onCreate: (scope: "room" | "floor", targetId: string, name: string) => void;
}) {
  const [tab, setTab] = useState<"room" | "floor">("floor");
  const list = tab === "floor" ? floors : rooms;

  return (
    <div className="p-4">
      <div className="flex gap-1 mb-3 p-1 rounded-xl bg-surface-2 border border-line">
        <button
          type="button"
          onClick={() => setTab("floor")}
          className={cn(
            "flex-1 h-10 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition",
            tab === "floor" ? "bg-gold text-navy" : "text-ink-soft hover:bg-line/40",
          )}
          aria-pressed={tab === "floor"}
        >
          <Building className="h-3.5 w-3.5" />
          Planta
        </button>
        <button
          type="button"
          onClick={() => setTab("room")}
          className={cn(
            "flex-1 h-10 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition",
            tab === "room" ? "bg-gold text-navy" : "text-ink-soft hover:bg-line/40",
          )}
          aria-pressed={tab === "room"}
        >
          <Sofa className="h-3.5 w-3.5" />
          Habitación
        </button>
      </div>

      {list.length === 0 ? (
        <p className="p-6 text-center text-sm text-ink-soft">
          No hay {tab === "floor" ? "plantas" : "habitaciones"} disponibles.
        </p>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {list.map((item) => (
            <PickRow
              key={item.id}
              title={item.name}
              subtitle={tab === "floor" ? "Toda la planta" : "Habitación"}
              onClick={() => onCreate(tab, item.id, item.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
