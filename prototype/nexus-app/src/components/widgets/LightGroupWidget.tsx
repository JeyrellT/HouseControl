"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Power } from "lucide-react";
import { useNexus, STATIC } from "@/lib/store";
import type { Device, Capability } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LightGroupWidget({
  deviceIds,
  name,
  interactive,
}: {
  deviceIds: string[];
  name: string;
  interactive: boolean;
}) {
  const capabilities = useNexus((s) => s.capabilities);
  const toggleDevice = useNexus((s) => s.toggleDevice);
  const setCapability = useNexus((s) => s.setCapability);

  const devices = useMemo(
    () =>
      deviceIds
        .map((id) => STATIC.devices.find((d) => d.id === id))
        .filter((d): d is Device => Boolean(d)),
    [deviceIds],
  );

  const { onCount, avgDim, onOffCaps, dimCaps } = useMemo(() => {
    let on = 0;
    let dimSum = 0;
    let dimN = 0;
    const onOff: Capability[] = [];
    const dim: Capability[] = [];
    devices.forEach((d) => {
      d.capabilityIds.forEach((cid) => {
        const c = capabilities[cid];
        if (!c) return;
        if (c.kind === "on_off") {
          onOff.push(c);
          if (c.value === true) on++;
        } else if (c.kind === "dim") {
          dim.push(c);
          if (typeof c.value === "number") {
            dimSum += c.value;
            dimN++;
          }
        }
      });
    });
    return {
      onCount: on,
      avgDim: dimN > 0 ? Math.round(dimSum / dimN) : 0,
      onOffCaps: onOff,
      dimCaps: dim,
    };
  }, [devices, capabilities]);

  const allOn = onCount === devices.length && devices.length > 0;
  const anyOn = onCount > 0;

  function handleMasterToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!interactive) return;
    const target = !anyOn;
    devices.forEach((d) => {
      const onCap = d.capabilityIds
        .map((cid) => capabilities[cid])
        .find((c) => c?.kind === "on_off");
      if (!onCap) return;
      if (Boolean(onCap.value) !== target) {
        toggleDevice(d.id);
      }
    });
  }

  function handleSliderChange(value: number) {
    if (!interactive) return;
    dimCaps.forEach((c) => setCapability(c.id, value));
  }

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-2xl border border-line overflow-hidden flex flex-col",
        anyOn
          ? "bg-gradient-to-br from-[#FFF8E7] to-[#FFE9B8] dark:from-gold/20 dark:to-gold/5"
          : "bg-surface-2",
      )}
    >
      {/* Decorative glow when on */}
      {anyOn && (
        <motion.div
          aria-hidden
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl bg-gold/40 pointer-events-none"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                anyOn ? "bg-gold/30 text-gold-border" : "bg-surface text-ink-soft",
              )}
            >
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-soft leading-none">Luces</p>
              <p className="text-sm font-semibold truncate leading-tight mt-0.5">
                {name}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-ink-soft tabular-nums">
            {onCount}/{devices.length} encendidas
            {anyOn && ` · ${avgDim}%`}
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={handleMasterToggle}
          disabled={!interactive || devices.length === 0}
          className={cn(
            "w-12 h-12 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            allOn
              ? "bg-gold text-navy shadow-soft"
              : anyOn
                ? "bg-gold/40 text-gold-border"
                : "bg-surface text-ink-soft border border-line",
          )}
          aria-label={anyOn ? "Apagar grupo" : "Encender grupo"}
          aria-pressed={anyOn}
        >
          <Power className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Dim slider */}
      {dimCaps.length > 0 && (
        <div className="relative mt-auto px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex items-center gap-2 text-[10px] text-ink-soft uppercase tracking-wide mb-1.5">
            <span>Brillo</span>
            <span className="ml-auto tabular-nums">{avgDim}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={avgDim}
            disabled={!interactive}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-2 rounded-full appearance-none bg-line accent-gold-border cursor-pointer disabled:cursor-not-allowed"
            aria-label="Brillo del grupo"
          />
        </div>
      )}

      {/* Device chips */}
      {onOffCaps.length > 0 && devices.length <= 4 && (
        <div className="relative px-3 sm:px-4 pb-3 flex flex-wrap gap-1.5">
          {devices.map((d) => {
            const onCap = d.capabilityIds
              .map((cid) => capabilities[cid])
              .find((c) => c?.kind === "on_off");
            const isOn = Boolean(onCap?.value);
            return (
              <button
                key={d.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (interactive) toggleDevice(d.id);
                }}
                disabled={!interactive}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] border transition-colors truncate max-w-[120px]",
                  isOn
                    ? "bg-gold/20 border-gold-border/40 text-ink"
                    : "bg-surface border-line text-ink-soft",
                )}
              >
                {d.name.replace(/^(Lámpara|Luz|Foco)\s*/i, "")}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
