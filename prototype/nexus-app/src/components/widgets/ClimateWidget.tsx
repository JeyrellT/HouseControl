"use client";

import { Thermometer, Wind, Snowflake, Flame, Plus, Minus, Power } from "lucide-react";
import { motion } from "framer-motion";
import { useNexus, STATIC } from "@/lib/store";
import type { Device } from "@/lib/types";
import { cn } from "@/lib/utils";

type ThermoValue = { mode: "off" | "cool" | "heat" | "auto"; target: number; current: number };

function isThermoValue(v: unknown): v is ThermoValue {
  return (
    typeof v === "object" &&
    v !== null &&
    "mode" in v &&
    "target" in v &&
    "current" in v
  );
}

const MODE_META: Record<
  ThermoValue["mode"],
  { label: string; Icon: typeof Snowflake; color: string; bg: string }
> = {
  cool: { label: "Frío", Icon: Snowflake, color: "text-blue-500", bg: "from-blue-50 to-blue-100 dark:from-blue-500/15 dark:to-blue-500/5" },
  heat: { label: "Calor", Icon: Flame, color: "text-orange-500", bg: "from-orange-50 to-orange-100 dark:from-orange-500/15 dark:to-orange-500/5" },
  auto: { label: "Auto", Icon: Wind, color: "text-sage", bg: "from-sage/20 to-sage/5" },
  off: { label: "Apagado", Icon: Power, color: "text-ink-soft", bg: "from-surface-2 to-surface-2" },
};

export function ClimateWidget({
  device,
  interactive,
}: {
  device: Device;
  interactive: boolean;
}) {
  const capabilities = useNexus((s) => s.capabilities);
  const setCapability = useNexus((s) => s.setCapability);

  const thermoCap = device.capabilityIds
    .map((cid) => capabilities[cid])
    .find((c) => c?.kind === "thermostat");

  const value = thermoCap && isThermoValue(thermoCap.value) ? thermoCap.value : null;
  const room = STATIC.rooms.find((r) => r.id === device.roomId);

  if (!thermoCap || !value) {
    return (
      <div className="h-full w-full rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xs text-ink-soft">
        Sin datos de clima
      </div>
    );
  }

  const meta = MODE_META[value.mode];
  const ModeIcon = meta.Icon;

  function update(patch: Partial<ThermoValue>) {
    if (!interactive || !thermoCap || !value) return;
    setCapability(thermoCap.id, { ...value, ...patch });
  }

  const nextMode: Record<ThermoValue["mode"], ThermoValue["mode"]> = {
    off: "cool",
    cool: "heat",
    heat: "auto",
    auto: "off",
  };

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-2xl border border-line overflow-hidden flex flex-col bg-gradient-to-br",
        meta.bg,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3 sm:p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                "bg-white/50 dark:bg-white/10",
                meta.color,
              )}
            >
              <Thermometer className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-soft leading-none">Clima</p>
              <p className="text-sm font-semibold truncate leading-tight mt-0.5">
                {room?.name ?? device.name}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            update({ mode: nextMode[value.mode] });
          }}
          disabled={!interactive}
          className={cn(
            "flex items-center gap-1.5 px-2.5 h-9 rounded-xl text-[11px] font-medium transition-colors",
            "bg-white/70 dark:bg-white/10 border border-line",
            meta.color,
          )}
          aria-label={`Modo actual: ${meta.label}`}
        >
          <ModeIcon className="h-3.5 w-3.5" />
          {meta.label}
        </button>
      </div>

      {/* Temperature display */}
      <div className="relative px-4 py-2 flex items-end justify-between">
        <div>
          <p className="text-[10px] text-ink-soft uppercase tracking-wider">
            Objetivo
          </p>
          <motion.p
            key={value.target}
            initial={{ y: -4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "text-3xl sm:text-4xl font-bold tabular-nums leading-none",
              meta.color,
            )}
          >
            {value.target}
            <span className="text-lg align-top">°</span>
          </motion.p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-ink-soft uppercase tracking-wider">
            Actual
          </p>
          <p className="text-lg font-semibold tabular-nums text-ink-soft">
            {value.current}°
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-auto px-3 sm:px-4 pb-3 sm:pb-4 flex items-center gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={(e) => {
            e.stopPropagation();
            update({ target: Math.max(15, value.target - 1) });
          }}
          disabled={!interactive || value.mode === "off"}
          className="flex-1 h-11 rounded-xl bg-white/70 dark:bg-white/10 border border-line flex items-center justify-center disabled:opacity-40 transition-colors hover:bg-white"
          aria-label="Bajar temperatura"
        >
          <Minus className="h-4 w-4" />
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={(e) => {
            e.stopPropagation();
            update({ target: Math.min(30, value.target + 1) });
          }}
          disabled={!interactive || value.mode === "off"}
          className="flex-1 h-11 rounded-xl bg-white/70 dark:bg-white/10 border border-line flex items-center justify-center disabled:opacity-40 transition-colors hover:bg-white"
          aria-label="Subir temperatura"
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
