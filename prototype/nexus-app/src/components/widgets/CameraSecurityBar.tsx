"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Unlock, Siren, Shield, Home as HomeIcon, Plane, Moon, ShieldOff,
  Circle, EyeOff, Eye,
} from "lucide-react";
import { useNexus, STATIC, isDeviceLocked } from "@/lib/store";
import type { Device, AlarmMode } from "@/lib/types";
import { cn } from "@/lib/utils";const MODE_META: Record<AlarmMode, { label: string; Icon: typeof Shield; ring: string }> = {
  home: { label: "Casa", Icon: HomeIcon, ring: "ring-emerald-400/70" },
  away: { label: "Ausente", Icon: Plane, ring: "ring-red-400/70" },
  night: { label: "Noche", Icon: Moon, ring: "ring-amber-400/70" },
  disarmed: { label: "Desarmado", Icon: ShieldOff, ring: "ring-white/20" },
};

/**
 * CCTV-style security bar embedded inside camera widgets.
 * Floats at the bottom of the feed with: nearby lock toggle, recording badge,
 * privacy mode, hold-to-arm siren, and alarm mode chips.
 *
 * Privacy/recording state is lifted to the parent so the parent can render
 * the privacy curtain over the entire feed (not just over the bar).
 */
export function CameraSecurityBar({
  cameraDevice,
  expanded = false,
  recording,
  onRecordingChange,
  privacy,
  onPrivacyChange,
}: {
  cameraDevice: Device;
  expanded?: boolean;
  recording: boolean;
  onRecordingChange: (v: boolean) => void;
  privacy: boolean;
  onPrivacyChange: (v: boolean) => void;
}) {
  const alarm = useNexus((s) => s.alarm);
  const setAlarmMode = useNexus((s) => s.setAlarmMode);
  const triggerPanic = useNexus((s) => s.triggerPanic);
  const clearPanic = useNexus((s) => s.clearPanic);
  const toggleDevice = useNexus((s) => s.toggleDevice);
  const capabilities = useNexus((s) => s.capabilities);

  const [modeOpen, setModeOpen] = useState(false);

  // Find the nearest lock: same floor as the camera, prefer outdoor locks for outdoor cams.
  const nearestLock = useMemo<Device | null>(() => {
    const candidates = STATIC.devices.filter(
      (d) => d.personaId === cameraDevice.personaId && d.kind === "lock",
    );
    if (candidates.length === 0) return null;
    const sameFloor = candidates.filter((d) => d.floorId === cameraDevice.floorId);
    const pool = sameFloor.length > 0 ? sameFloor : candidates;
    // Prefer entrada/principal heuristic
    const preferred = pool.find((d) =>
      /entrada|principal|main|gate|jardin|jard[ií]n/i.test(`${d.name} ${d.roomId}`),
    );
    return preferred ?? pool[0];
  }, [cameraDevice]);

  const lockLocked = nearestLock ? isDeviceLocked(nearestLock, capabilities) : false;

  const sirenHoldRef = useRef<{ start: number; timer: ReturnType<typeof setTimeout> | null }>({
    start: 0,
    timer: null,
  });
  const [holdProgress, setHoldProgress] = useState(0);

  function startSirenHold() {
    if (alarm.panic) {
      clearPanic();
      return;
    }
    sirenHoldRef.current.start = Date.now();
    const tick = () => {
      const dt = Date.now() - sirenHoldRef.current.start;
      const pct = Math.min(1, dt / 800);
      setHoldProgress(pct);
      if (pct >= 1) {
        triggerPanic();
        cancelSirenHold();
        return;
      }
      sirenHoldRef.current.timer = setTimeout(tick, 30);
    };
    tick();
  }
  function cancelSirenHold() {
    if (sirenHoldRef.current.timer) clearTimeout(sirenHoldRef.current.timer);
    sirenHoldRef.current.timer = null;
    setHoldProgress(0);
  }
  useEffect(() => () => cancelSirenHold(), []);

  const meta = MODE_META[alarm.mode];

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-[5]",
        "bg-gradient-to-t from-black/90 via-black/60 to-transparent",
        expanded ? "p-3" : "p-2 sm:p-2.5",
      )}
      // Stop click bubbling so the camera doesn't open expanded view when using controls.
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mode-driven border glow */}
      <motion.div
        aria-hidden
        className={cn("absolute inset-0 pointer-events-none ring-2 ring-inset", meta.ring)}
        animate={{ opacity: alarm.mode === "disarmed" ? 0 : 0.55 }}
      />

      <div className="relative flex items-center gap-1.5 sm:gap-2">
        {/* Lock toggle */}
        {nearestLock && (
          <button
            type="button"
            onClick={() => toggleDevice(nearestLock.id)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium border backdrop-blur",
              lockLocked
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-100"
                : "bg-red-500/20 border-red-400/50 text-red-100",
            )}
            aria-label={lockLocked ? "Abrir cerradura" : "Cerrar cerradura"}
          >
            {lockLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            <span className="hidden sm:inline truncate max-w-[80px]">
              {nearestLock.name.replace(/cerradura\s*/i, "")}
            </span>
          </button>
        )}

        {/* REC toggle */}
        <button
          type="button"
          onClick={() => onRecordingChange(!recording)}
          className={cn(
            "shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border backdrop-blur",
            recording
              ? "bg-red-500/30 border-red-400/60 text-white"
              : "bg-white/10 border-white/20 text-white/60",
          )}
          aria-label={recording ? "Detener grabación" : "Iniciar grabación"}
          aria-pressed={recording}
        >
          <motion.span
            animate={recording ? { opacity: [1, 0.3, 1] } : { opacity: 0.4 }}
            transition={recording ? { duration: 1.2, repeat: Infinity } : undefined}
            className="inline-flex"
          >
            <Circle className="h-2.5 w-2.5 fill-current" />
          </motion.span>
          <span>REC</span>
        </button>

        {/* Privacy */}
        <button
          type="button"
          onClick={() => onPrivacyChange(!privacy)}
          className={cn(
            "shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-lg border backdrop-blur",
            privacy
              ? "bg-amber-500/30 border-amber-400/60 text-amber-100"
              : "bg-white/10 border-white/20 text-white/70",
          )}
          aria-label={privacy ? "Quitar privacidad" : "Activar privacidad"}
          aria-pressed={privacy}
          title={privacy ? "Privacidad activa" : "Privacidad"}
        >
          {privacy ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Siren — hold 800ms */}
        <button
          type="button"
          onPointerDown={startSirenHold}
          onPointerUp={cancelSirenHold}
          onPointerLeave={cancelSirenHold}
          onPointerCancel={cancelSirenHold}
          className={cn(
            "relative shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg border backdrop-blur overflow-hidden",
            alarm.panic
              ? "bg-red-600 border-red-300 text-white animate-pulse"
              : "bg-red-500/20 border-red-400/50 text-red-100 hover:bg-red-500/40",
          )}
          aria-label={alarm.panic ? "Desactivar pánico" : "Mantén para activar pánico"}
          title="Mantén 0.8s para activar"
        >
          {/* hold-progress ring */}
          {holdProgress > 0 && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-lg bg-red-500/40"
              style={{ clipPath: `inset(${(1 - holdProgress) * 100}% 0 0 0)` }}
            />
          )}
          <Siren className="relative h-4 w-4" />
        </button>

        {/* Alarm mode dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setModeOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 h-8 px-2 rounded-lg border backdrop-blur text-[10px] font-semibold uppercase tracking-wider",
              alarm.mode === "disarmed"
                ? "bg-white/10 border-white/20 text-white/80"
                : "bg-gold/30 border-gold/60 text-gold-soft",
            )}
            aria-haspopup="menu"
            aria-expanded={modeOpen}
            aria-label="Modo de alarma"
          >
            <meta.Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{meta.label}</span>
          </button>
          <AnimatePresence>
            {modeOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="absolute right-0 bottom-full mb-2 w-44 rounded-xl border border-white/15 bg-navy/95 text-cream backdrop-blur-md shadow-2xl overflow-hidden"
              >
                {(Object.keys(MODE_META) as AlarmMode[]).map((m) => {
                  const M = MODE_META[m];
                  const active = alarm.mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        setAlarmMode(m);
                        setModeOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 transition",
                        active && "bg-gold/15 text-gold-soft",
                      )}
                    >
                      <M.Icon className="h-3.5 w-3.5" />
                      <span className="flex-1 text-left">{M.label}</span>
                      {active && <Circle className="h-1.5 w-1.5 fill-current" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
