"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building, Sofa, Settings, Lightbulb, Lock, Unlock, Shield, ShieldOff,
  Activity, Camera, Tv, Thermometer, DoorOpen, Plus, Check,
} from "lucide-react";
import {
  useNexus, STATIC, selectDevicesInZone, getZoneSummary, isDeviceLocked,
} from "@/lib/store";
import type { Device, ZoneScope, Capability } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  widgetId: string;
  scope: ZoneScope;
  targetId: string;
  selectedDeviceIds: string[];
  showSecurity: boolean;
  size: "S" | "M" | "L" | "XL";
  interactive: boolean;
};

const KIND_ICON: Record<string, typeof Lightbulb> = {
  light: Lightbulb,
  lock: Lock,
  camera: Camera,
  switch: Tv,
  climate: Thermometer,
  sensor: Activity,
  cover: DoorOpen,
};

/**
 * Configurable control hub:
 *  - Inline scope picker (Planta / Habitación + target dropdown).
 *  - Security mini-band (alarm mode, locks count, motion).
 *  - User-curated device list with on/off toggles.
 *  - Settings panel to choose which devices appear.
 */
export function ControlHubWidget({
  widgetId,
  scope,
  targetId,
  selectedDeviceIds,
  showSecurity,
  size,
  interactive,
}: Props) {
  const personaId = useNexus((s) => s.activePersonaId);
  const capabilities = useNexus((s) => s.capabilities);
  const toggleDevice = useNexus((s) => s.toggleDevice);
  const updateHomeWidget = useNexus((s) => s.updateHomeWidget);
  const alarm = useNexus((s) => s.alarm);
  const setAlarmMode = useNexus((s) => s.setAlarmMode);

  const [editing, setEditing] = useState(false);

  // Available rooms / floors for this persona
  const personaRooms = useMemo(
    () => STATIC.rooms.filter((r) => r.personaId === personaId),
    [personaId],
  );
  const personaFloors = useMemo(
    () =>
      STATIC.floors
        .filter((f) => f.personaId === personaId)
        .sort((a, b) => a.order - b.order),
    [personaId],
  );

  // Devices in current zone
  const zoneDevices = useMemo(
    () => selectDevicesInZone(scope, targetId, personaId),
    [scope, targetId, personaId],
  );
  const zoneSummary = useMemo(
    () => getZoneSummary(scope, targetId, personaId, capabilities),
    [scope, targetId, personaId, capabilities],
  );

  // Selected device objects (filter ids that still exist in zone)
  const selectedDevices = useMemo(() => {
    const inZone = new Set(zoneDevices.map((d) => d.id));
    return selectedDeviceIds
      .filter((id) => inZone.has(id))
      .map((id) => zoneDevices.find((d) => d.id === id)!)
      .filter(Boolean);
  }, [zoneDevices, selectedDeviceIds]);

  const targetName = useMemo(() => {
    if (scope === "floor") return personaFloors.find((f) => f.id === targetId)?.name ?? "Planta";
    return personaRooms.find((r) => r.id === targetId)?.name ?? "Habitación";
  }, [scope, targetId, personaFloors, personaRooms]);

  function patch(p: Partial<Props>) {
    updateHomeWidget(personaId, widgetId, p);
  }

  function setScope(next: ZoneScope) {
    if (next === scope) return;
    const list = next === "floor" ? personaFloors : personaRooms;
    const fallback = list[0]?.id ?? targetId;
    patch({ scope: next, targetId: fallback, selectedDeviceIds: [] });
  }

  function setTarget(nextId: string) {
    if (nextId === targetId) return;
    patch({ targetId: nextId, selectedDeviceIds: [] });
  }

  function toggleDeviceSelection(id: string) {
    const set = new Set(selectedDeviceIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    patch({ selectedDeviceIds: Array.from(set) });
  }

  function toggleSecurity() {
    patch({ showSecurity: !showSecurity });
  }

  const compact = size === "S";
  const armed = alarm.mode !== "disarmed";

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-2xl overflow-hidden p-3 sm:p-4 flex flex-col",
        "bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] border border-line",
      )}
    >
      {/* Header: scope picker + settings */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-xl bg-navy/10 dark:bg-cream/10 text-navy dark:text-cream flex items-center justify-center shrink-0">
          {scope === "floor" ? <Building className="h-4 w-4" /> : <Sofa className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-ink-soft flex items-center gap-1">
            <span>Centro de control</span>
            {scope === "room" && (() => {
              const room = personaRooms.find((r) => r.id === targetId);
              const floor = room ? personaFloors.find((f) => f.id === room.floorId) : undefined;
              if (!floor) return null;
              return (
                <>
                  <span aria-hidden>·</span>
                  <button
                    type="button"
                    onClick={() => interactive && patch({ scope: "floor", targetId: floor.id, selectedDeviceIds: [] })}
                    disabled={!interactive}
                    className="hover:text-gold-border underline decoration-dotted"
                  >
                    {floor.name}
                  </button>
                </>
              );
            })()}
          </p>
          <p className="text-sm font-semibold truncate">{targetName}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          disabled={!interactive}
          className={cn(
            "h-8 w-8 rounded-lg inline-flex items-center justify-center transition border",
            editing
              ? "bg-gold text-navy border-gold"
              : "bg-surface-2 border-line text-ink-soft hover:border-gold-border/40",
          )}
          aria-label={editing ? "Cerrar configuración" : "Configurar widget"}
          aria-pressed={editing}
        >
          {editing ? <Check className="h-3.5 w-3.5" /> : <Settings className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Scope tabs (only visible during editing OR when room/floor count > 1) */}
      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            key="picker"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="overflow-hidden mb-2 space-y-1.5"
          >
            <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-line">
              <button
                type="button"
                onClick={() => setScope("floor")}
                className={cn(
                  "flex-1 h-7 rounded-md text-[10px] font-medium inline-flex items-center justify-center gap-1 transition",
                  scope === "floor" ? "bg-gold text-navy" : "text-ink-soft hover:bg-line/40",
                )}
                aria-pressed={scope === "floor"}
              >
                <Building className="h-3 w-3" />
                Planta
              </button>
              <button
                type="button"
                onClick={() => setScope("room")}
                className={cn(
                  "flex-1 h-7 rounded-md text-[10px] font-medium inline-flex items-center justify-center gap-1 transition",
                  scope === "room" ? "bg-gold text-navy" : "text-ink-soft hover:bg-line/40",
                )}
                aria-pressed={scope === "room"}
              >
                <Sofa className="h-3 w-3" />
                Habitación
              </button>
            </div>

            {/* Primary chip row: floors or rooms depending on scope */}
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              {(scope === "floor" ? personaFloors : personaRooms).map((item) => {
                const active = item.id === targetId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTarget(item.id)}
                    className={cn(
                      "shrink-0 px-2 h-7 rounded-md text-[10px] font-medium border transition whitespace-nowrap",
                      active
                        ? "bg-gold text-navy border-gold"
                        : "bg-surface border-line text-ink-soft hover:border-gold-border/40",
                    )}
                    aria-pressed={active}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Secondary row when scope=floor: rooms within current floor (drill-down) */}
            {scope === "floor" && (() => {
              const roomsInFloor = personaRooms.filter((r) => r.floorId === targetId);
              if (roomsInFloor.length === 0) return null;
              return (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                  <span className="shrink-0 text-[9px] uppercase tracking-wider text-ink-soft pl-1">
                    Acotar →
                  </span>
                  {roomsInFloor.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => patch({ scope: "room", targetId: r.id, selectedDeviceIds: [] })}
                      className="shrink-0 px-2 h-6 rounded-md text-[10px] border border-dashed border-line text-ink-soft hover:border-gold-border hover:text-ink whitespace-nowrap inline-flex items-center gap-1"
                    >
                      <Sofa className="h-2.5 w-2.5" />
                      {r.name}
                    </button>
                  ))}
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-ink-soft uppercase tracking-wider">Mostrar seguridad</span>
              <button
                type="button"
                role="switch"
                aria-checked={showSecurity}
                onClick={toggleSecurity}
                className={cn(
                  "relative w-9 h-5 rounded-full transition",
                  showSecurity ? "bg-gold" : "bg-line",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    showSecurity && "translate-x-4",
                  )}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security mini-band */}
      {showSecurity && !editing && (
        <div className="flex items-center gap-1.5 text-[10px] mb-2 flex-wrap">
          <button
            type="button"
            onClick={() => interactive && setAlarmMode(armed ? "disarmed" : "home")}
            disabled={!interactive}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border transition font-medium",
              alarm.panic
                ? "bg-red-600 border-red-300 text-white animate-pulse"
                : armed
                  ? "bg-gold/20 border-gold-border text-gold-border"
                  : "bg-surface-2 border-line text-ink-soft hover:border-gold-border/40",
            )}
            aria-label="Alternar alarma"
          >
            {armed ? <Shield className="h-2.5 w-2.5" /> : <ShieldOff className="h-2.5 w-2.5" />}
            {alarm.panic ? "PÁNICO" : armed ? "Armada" : "Sin alarma"}
          </button>
          {zoneSummary.locksTotal > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border",
                zoneSummary.locksLocked === zoneSummary.locksTotal
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300",
              )}
            >
              {zoneSummary.locksLocked === zoneSummary.locksTotal ? (
                <Lock className="h-2.5 w-2.5" />
              ) : (
                <Unlock className="h-2.5 w-2.5" />
              )}
              {zoneSummary.locksLocked}/{zoneSummary.locksTotal}
            </span>
          )}
          {zoneSummary.motionActive && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 font-medium uppercase tracking-wider"
            >
              <Activity className="h-2.5 w-2.5" />
              Mov
            </motion.span>
          )}
          {zoneSummary.climateAvgTemp !== null && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-line tabular-nums text-ink-soft">
              {zoneSummary.climateAvgTemp}°
            </span>
          )}
        </div>
      )}

      {/* Body: device list (view) or device picker (edit) */}
      {editing ? (
        <DevicePicker
          devices={zoneDevices}
          selectedIds={selectedDeviceIds}
          onToggle={toggleDeviceSelection}
        />
      ) : (
        <DeviceList
          devices={selectedDevices}
          fallbackDevices={zoneDevices}
          capabilities={capabilities}
          onToggle={(id) => interactive && toggleDevice(id)}
          size={size}
          interactive={interactive}
        />
      )}
    </div>
  );
}

function DeviceList({
  devices,
  fallbackDevices,
  capabilities,
  onToggle,
  size,
  interactive,
}: {
  devices: Device[];
  fallbackDevices: Device[];
  capabilities: Record<string, Capability | undefined>;
  onToggle: (id: string) => void;
  size: "S" | "M" | "L" | "XL";
  interactive: boolean;
}) {
  // If nothing was explicitly selected, fall back to all zone devices
  const list = devices.length > 0 ? devices : fallbackDevices;
  const isAutoMode = devices.length === 0 && fallbackDevices.length > 0;
  const large = size === "L" || size === "XL";

  if (list.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-ink-soft gap-2 py-3">
        <Plus className="h-5 w-5 opacity-40" />
        <p className="leading-tight">
          Toca <Settings className="inline h-3 w-3 -translate-y-0.5" /> para elegir dispositivos
          de esta zona.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1">
      {isAutoMode && (
        <p className="text-[9px] uppercase tracking-wider text-ink-soft px-0.5">
          Todos en la zona
        </p>
      )}
      <div
        className={cn(
          "flex-1 overflow-y-auto -mx-1 px-1 min-h-0",
          large ? "grid grid-cols-2 gap-1.5 content-start" : "space-y-1.5",
        )}
      >
        {list.map((d) => {
          const Icon = KIND_ICON[d.kind] ?? Lightbulb;
          const lockable = d.kind === "lock";
          const onCap = d.capabilityIds
            .map((cid) => capabilities[cid])
            .find((c) => c?.kind === "on_off" || (lockable && c?.kind === "lock"));
          const isOn = lockable ? isDeviceLocked(d, capabilities) : Boolean(onCap?.value);
          const labelOn = lockable ? "Cerrado" : "Enc.";
          const labelOff = lockable ? "Abierto" : "Apag.";
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onCap && onToggle(d.id)}
              disabled={!interactive || !onCap}
              className={cn(
                "w-full rounded-xl border flex flex-col justify-between transition text-left p-2",
                large ? "min-h-[60px]" : "h-10 flex-row items-center gap-2 px-2",
                isOn
                  ? lockable
                    ? "bg-emerald-500/10 border-emerald-500/40"
                    : "bg-gold/15 border-gold-border/40"
                  : "bg-surface-2 border-line hover:border-gold-border/30",
                !onCap && "opacity-50 cursor-not-allowed",
              )}
              aria-pressed={isOn}
            >
              {large ? (
                <>
                  <div className="flex items-start justify-between gap-1">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        isOn
                          ? lockable
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-gold-border"
                          : "text-ink-soft",
                      )}
                    />
                    {onCap && (
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0 mt-1",
                          isOn
                            ? lockable
                              ? "bg-emerald-500"
                              : "bg-gold"
                            : "bg-line",
                        )}
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium leading-tight line-clamp-1">{d.name}</p>
                    {onCap && (
                      <p className="text-[10px] text-ink-soft mt-0.5">
                        {isOn ? labelOn : labelOff}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isOn
                        ? lockable
                          ? "text-emerald-600 dark:text-emerald-300"
                          : "text-gold-border"
                        : "text-ink-soft",
                    )}
                  />
                  <span className="flex-1 truncate text-xs font-medium">{d.name}</span>
                  {onCap && (
                    <span className="text-[9px] uppercase tracking-wider text-ink-soft">
                      {isOn ? labelOn : labelOff}
                    </span>
                  )}
                  {onCap && (
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        isOn
                          ? lockable
                            ? "bg-emerald-500"
                            : "bg-gold"
                          : "bg-line",
                      )}
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DevicePicker({
  devices,
  selectedIds,
  onToggle,
}: {
  devices: Device[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const selected = new Set(selectedIds);
  if (devices.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-ink-soft py-3">
        No hay dispositivos en esta zona.
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1 min-h-0">
      <p className="text-[10px] uppercase tracking-wider text-ink-soft mb-1.5 px-0.5">
        Selecciona qué mostrar ({selected.size})
      </p>
      {devices.map((d) => {
        const Icon = KIND_ICON[d.kind] ?? Lightbulb;
        const isSelected = selected.has(d.id);
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onToggle(d.id)}
            className={cn(
              "w-full h-9 px-2 rounded-lg border inline-flex items-center gap-2 text-xs transition text-left",
              isSelected
                ? "bg-gold/15 border-gold-border/60"
                : "bg-surface-2 border-line hover:border-gold-border/40",
            )}
            aria-pressed={isSelected}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
            <span className="flex-1 truncate">{d.name}</span>
            <span
              className={cn(
                "w-4 h-4 rounded border inline-flex items-center justify-center shrink-0",
                isSelected ? "bg-gold border-gold text-navy" : "border-line",
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// (end of file)
