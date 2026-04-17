"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Lightbulb, Lock, Unlock, Activity, Power, Building, Sofa, BedDouble, Trees,
} from "lucide-react";
import { useNexus, STATIC, getZoneSummary } from "@/lib/store";
import type { ZoneScope } from "@/lib/types";
import { cn } from "@/lib/utils";

function pickIcon(name: string, scope: ZoneScope) {
  if (scope === "floor") return Building;
  const n = name.toLowerCase();
  if (/dorm|master|hijos|recamara|rec[aá]mara|bed/.test(n)) return BedDouble;
  if (/jard|patio|terraza|exterior/.test(n)) return Trees;
  return Sofa;
}

/**
 * Zone widget — bulk control for ALL devices in a room or floor.
 * Slider master for brightness, smart on/off, master lock toggle, motion indicator.
 */
export function ZoneWidget({
  scope,
  targetId,
  name,
  interactive,
  size,
}: {
  scope: ZoneScope;
  targetId: string;
  name: string;
  interactive: boolean;
  size: "S" | "M" | "L" | "XL";
}) {
  const personaId = useNexus((s) => s.activePersonaId);
  const capabilities = useNexus((s) => s.capabilities);
  const applyZoneLights = useNexus((s) => s.applyZoneLights);
  const applyZoneLocks = useNexus((s) => s.applyZoneLocks);

  const summary = useMemo(
    () => getZoneSummary(scope, targetId, personaId, capabilities),
    [scope, targetId, personaId, capabilities],
  );

  const [dim, setDim] = useState<number>(summary.avgDim ?? 60);

  // sync slider when external state changes (only when not actively dragging)
  const targetExists =
    scope === "room"
      ? STATIC.rooms.some((r) => r.id === targetId)
      : STATIC.floors.some((f) => f.id === targetId);

  if (!targetExists) {
    return (
      <div className="h-full w-full rounded-2xl bg-surface-2 border border-dashed border-line flex items-center justify-center text-xs text-ink-soft">
        Zona no disponible
      </div>
    );
  }

  const Icon = pickIcon(name, scope);
  const allOn = summary.lightsOn === summary.lightsTotal && summary.lightsTotal > 0;
  const someOn = summary.lightsOn > 0;
  const allLocked = summary.locksLocked === summary.locksTotal && summary.locksTotal > 0;
  const compact = size === "S";

  function handleSmartToggle() {
    if (!interactive) return;
    if (someOn) applyZoneLights(scope, targetId, "off");
    else applyZoneLights(scope, targetId, "on");
  }

  function handleDimEnd() {
    if (!interactive) return;
    applyZoneLights(scope, targetId, "dim", dim);
  }

  function handleLockToggle() {
    if (!interactive || summary.locksTotal === 0) return;
    applyZoneLocks(scope, targetId, allLocked ? "unlock" : "lock");
  }

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-2xl overflow-hidden p-3 sm:p-4 flex flex-col",
        "bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] border border-line",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            scope === "floor"
              ? "bg-gold/20 text-gold-border"
              : "bg-navy/10 text-navy dark:bg-cream/10 dark:text-cream",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-ink-soft">
            {scope === "floor" ? "Planta" : "Habitación"}
          </p>
          <p className="text-sm font-semibold truncate">{name}</p>
        </div>
        {summary.motionActive && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-600 dark:text-amber-300 text-[9px] font-medium uppercase tracking-wider"
            title="Movimiento detectado"
          >
            <Activity className="h-2.5 w-2.5" />
            Mov
          </motion.span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-1.5 text-[10px] text-ink-soft mb-2 flex-wrap">
        {summary.lightsTotal > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-line">
            <Lightbulb className="h-2.5 w-2.5" />
            {summary.lightsOn}/{summary.lightsTotal}
          </span>
        )}
        {summary.locksTotal > 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border",
              allLocked
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300",
            )}
          >
            {allLocked ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
            {summary.locksLocked}/{summary.locksTotal}
          </span>
        )}
        {summary.climateAvgTemp !== null && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-line tabular-nums">
            {summary.climateAvgTemp}°
          </span>
        )}
      </div>

      {/* Brightness master */}
      {summary.lightsTotal > 0 && !compact && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] text-ink-soft mb-1">
            <span>Brillo maestro</span>
            <span className="tabular-nums font-mono">{dim}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={dim}
            onChange={(e) => setDim(Number(e.target.value))}
            onPointerUp={handleDimEnd}
            onTouchEnd={handleDimEnd}
            disabled={!interactive}
            aria-label="Brillo maestro"
            className="w-full accent-gold"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-auto flex items-center gap-2">
        {summary.lightsTotal > 0 && (
          <button
            type="button"
            onClick={handleSmartToggle}
            disabled={!interactive}
            className={cn(
              "flex-1 h-10 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5 transition border",
              someOn
                ? "bg-gold text-navy border-gold"
                : "bg-surface-2 border-line text-ink hover:bg-line/40",
            )}
            aria-label={someOn ? "Apagar todas las luces" : "Encender todas las luces"}
            aria-pressed={allOn}
          >
            <Power className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{someOn ? "Apagar todo" : "Encender todo"}</span>
            <span className="sm:hidden">{someOn ? "Off" : "On"}</span>
          </button>
        )}
        {summary.locksTotal > 0 && (
          <button
            type="button"
            onClick={handleLockToggle}
            disabled={!interactive}
            className={cn(
              "h-10 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 transition border text-xs font-medium",
              allLocked
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                : "bg-surface-2 border-line hover:bg-line/40",
            )}
            aria-label={allLocked ? "Abrir todas las cerraduras" : "Cerrar todas las cerraduras"}
            aria-pressed={allLocked}
          >
            {allLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
