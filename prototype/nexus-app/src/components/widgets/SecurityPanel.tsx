"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, ShieldOff, Home as HomeIcon, Plane, Moon, Lock, Activity, AlertTriangle,
} from "lucide-react";
import { useNexus, selectDevicesByPersona, isDeviceLocked } from "@/lib/store";
import type { AlarmMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: { mode: AlarmMode; label: string; Icon: typeof Shield; tone: string }[] = [
  { mode: "home", label: "Casa", Icon: HomeIcon, tone: "emerald" },
  { mode: "away", label: "Ausente", Icon: Plane, tone: "rose" },
  { mode: "night", label: "Noche", Icon: Moon, tone: "amber" },
  { mode: "disarmed", label: "Desarmado", Icon: ShieldOff, tone: "slate" },
];

const TONE_ACTIVE: Record<string, string> = {
  emerald: "bg-emerald-500/20 border-emerald-500/60 text-emerald-700 dark:text-emerald-300",
  rose: "bg-rose-500/20 border-rose-500/60 text-rose-700 dark:text-rose-300",
  amber: "bg-amber-500/20 border-amber-500/60 text-amber-700 dark:text-amber-300",
  slate: "bg-slate-500/20 border-slate-500/40 text-slate-700 dark:text-slate-300",
};

export function SecurityPanel({
  interactive,
  size,
}: {
  interactive: boolean;
  size: "S" | "M" | "L" | "XL";
}) {
  const personaId = useNexus((s) => s.activePersonaId);
  const alarm = useNexus((s) => s.alarm);
  const setAlarmMode = useNexus((s) => s.setAlarmMode);
  const triggerPanic = useNexus((s) => s.triggerPanic);
  const clearPanic = useNexus((s) => s.clearPanic);
  const capabilities = useNexus((s) => s.capabilities);

  const devices = selectDevicesByPersona(personaId);
  const locks = devices.filter((d) => d.kind === "lock");
  const lockedCount = locks.filter((d) => isDeviceLocked(d, capabilities)).length;
  const motionDevices = devices.filter((d) => d.kind === "sensor");
  const motionActive = motionDevices.some((d) => {
    const motionCap = d.capabilityIds.map((cid) => capabilities[cid]).find((c) => c?.kind === "motion");
    return Boolean(motionCap?.value);
  });

  const compact = size === "S";

  // Hold-to-arm panic
  const holdRef = useRef<{ start: number; timer: ReturnType<typeof setTimeout> | null }>({
    start: 0,
    timer: null,
  });
  const [progress, setProgress] = useState(0);

  function startHold() {
    if (!interactive) return;
    if (alarm.panic) {
      clearPanic();
      return;
    }
    holdRef.current.start = Date.now();
    const tick = () => {
      const dt = Date.now() - holdRef.current.start;
      const pct = Math.min(1, dt / 800);
      setProgress(pct);
      if (pct >= 1) {
        triggerPanic();
        cancelHold();
        return;
      }
      holdRef.current.timer = setTimeout(tick, 30);
    };
    tick();
  }
  function cancelHold() {
    if (holdRef.current.timer) clearTimeout(holdRef.current.timer);
    holdRef.current.timer = null;
    setProgress(0);
  }
  useEffect(() => () => cancelHold(), []);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden p-3 sm:p-4 flex flex-col bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] border border-line">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            alarm.mode === "disarmed"
              ? "bg-slate-400/15 text-ink-soft"
              : "bg-gold/20 text-gold-border",
          )}
        >
          {alarm.mode === "disarmed" ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-ink-soft">Seguridad</p>
          <p className="text-sm font-semibold truncate">
            {MODES.find((m) => m.mode === alarm.mode)?.label}
          </p>
        </div>
        {motionActive && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-700 dark:text-amber-300 text-[9px] font-medium uppercase tracking-wider"
            title="Movimiento detectado"
          >
            <Activity className="h-2.5 w-2.5" />
            Mov
          </motion.span>
        )}
      </div>

      {/* Mode chips */}
      <div className={cn("grid gap-1.5 mb-2", compact ? "grid-cols-2" : "grid-cols-4")}>
        {MODES.map((m) => {
          const active = alarm.mode === m.mode;
          return (
            <button
              key={m.mode}
              type="button"
              onClick={() => interactive && setAlarmMode(m.mode)}
              disabled={!interactive}
              className={cn(
                "h-9 rounded-xl border text-[10px] font-medium inline-flex flex-col items-center justify-center gap-0.5 transition",
                active
                  ? TONE_ACTIVE[m.tone]
                  : "bg-surface-2 border-line text-ink-soft hover:border-gold-border/40",
              )}
              aria-pressed={active}
              aria-label={`Modo ${m.label}`}
            >
              <m.Icon className="h-3 w-3" />
              <span className="leading-none">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      {!compact && (
        <div className="flex items-center gap-1.5 text-[10px] text-ink-soft mb-2 flex-wrap">
          {locks.length > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-line">
              <Lock className="h-2.5 w-2.5" />
              {lockedCount}/{locks.length} locks
            </span>
          )}
          {motionDevices.length > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2 border border-line">
              <Activity className="h-2.5 w-2.5" />
              {motionDevices.length} sensores
            </span>
          )}
        </div>
      )}

      {/* Panic button */}
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        disabled={!interactive}
        className={cn(
          "relative mt-auto h-10 rounded-xl border-2 inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider overflow-hidden transition",
          alarm.panic
            ? "bg-red-600 border-red-300 text-white animate-pulse"
            : "bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-300 hover:bg-red-500/20",
        )}
        aria-label={alarm.panic ? "Desactivar pánico" : "Mantén 0.8s para activar pánico"}
      >
        {progress > 0 && (
          <span
            aria-hidden
            className="absolute inset-0 bg-red-500/40"
            style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
          />
        )}
        <AlertTriangle className="relative h-3.5 w-3.5" />
        <span className="relative">{alarm.panic ? "Pánico activo" : "Pánico (mantén)"}</span>
      </button>
    </div>
  );
}
