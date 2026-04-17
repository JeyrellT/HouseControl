"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Power, Volume2, VolumeX, Plus, Minus, X } from "lucide-react";
import { useNexus, STATIC } from "@/lib/store";
import type { Device, Capability, TVState } from "@/lib/types";
import { cn } from "@/lib/utils";

const SOURCES: { id: string; label: string; color: string }[] = [
  { id: "HDMI1", label: "HDMI 1", color: "bg-blue-500" },
  { id: "HDMI2", label: "HDMI 2", color: "bg-indigo-500" },
  { id: "Netflix", label: "Netflix", color: "bg-red-600" },
  { id: "YouTube", label: "YouTube", color: "bg-red-500" },
  { id: "Spotify", label: "Spotify", color: "bg-green-500" },
  { id: "Apple TV", label: "Apple TV", color: "bg-gray-800" },
];

export function TVWidget({
  device,
  interactive,
}: {
  device: Device;
  interactive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const capabilities = useNexus((s) => s.capabilities);
  const toggleDevice = useNexus((s) => s.toggleDevice);
  const tvState = useNexus((s) => s.tvStates[device.id]);
  const setTvState = useNexus((s) => s.setTvState);

  const state: TVState = tvState ?? {
    source: "HDMI1",
    volume: 35,
    muted: false,
    channel: 1,
  };

  const onOffCap = device.capabilityIds
    .map((cid) => capabilities[cid])
    .find((c): c is Capability => c?.kind === "on_off");
  const isOn = Boolean(onOffCap?.value);
  const room = STATIC.rooms.find((r) => r.id === device.roomId);
  const source = SOURCES.find((s) => s.id === state.source) ?? SOURCES[0];

  function handleTap() {
    if (!interactive) return;
    setOpen(true);
  }

  function togglePower(e: React.MouseEvent) {
    e.stopPropagation();
    if (interactive) toggleDevice(device.id);
  }

  return (
    <>
      <motion.button
        type="button"
        layoutId={`home-tv-${device.id}`}
        onClick={handleTap}
        disabled={!interactive}
        className={cn(
          "relative h-full w-full rounded-2xl overflow-hidden border border-navy/20 text-left",
          "bg-gradient-to-br from-[#1a1d2e] via-[#0f1420] to-[#05080f] text-cream shadow-elev",
          interactive && "cursor-pointer",
        )}
      >
        {/* "Screen" */}
        <div className="absolute inset-3 sm:inset-4 rounded-xl overflow-hidden bg-black">
          {isOn ? (
            <motion.div
              key={state.source}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                source.color,
              )}
            >
              <div className="text-white text-center">
                <p className="text-[10px] uppercase tracking-widest opacity-75">
                  Reproduciendo
                </p>
                <p className="text-sm sm:text-base font-semibold mt-1 drop-shadow-md">
                  {source.label}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Tv className="h-10 w-10 text-white/20" />
            </div>
          )}
          {/* Screen glare */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 via-transparent to-transparent" />
        </div>

        {/* Footer strip */}
        <div className="absolute left-0 right-0 bottom-0 h-10 sm:h-11 flex items-center justify-between px-3 sm:px-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="min-w-0 flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                isOn ? "bg-gold shadow-[0_0_8px_rgba(230,186,102,0.8)]" : "bg-white/20",
              )}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-medium truncate leading-tight">
                {device.name}
              </p>
              <p className="text-[9px] text-cream/50 truncate leading-tight">
                {room?.name ?? ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-cream/70 shrink-0">
            {state.muted ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
            <span className="text-[10px] font-mono tabular-nums">
              {state.muted ? "—" : state.volume}
            </span>
          </div>
        </div>

        {/* Power button */}
        <button
          type="button"
          onClick={togglePower}
          disabled={!interactive}
          aria-label={isOn ? "Apagar TV" : "Encender TV"}
          aria-pressed={isOn}
          className={cn(
            "absolute top-2 right-2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors backdrop-blur",
            isOn
              ? "bg-gold/80 text-navy"
              : "bg-white/10 text-cream/60 hover:bg-white/20",
          )}
        >
          <Power className="h-4 w-4" />
        </button>
      </motion.button>

      <AnimatePresence>
        {open && (
          <TVRemotePanel
            device={device}
            state={state}
            isOn={isOn}
            onClose={() => setOpen(false)}
            onChange={(patch) => setTvState(device.id, patch)}
            onTogglePower={() => toggleDevice(device.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Remote bottom sheet ───────────────────────────────── */

function TVRemotePanel({
  device,
  state,
  isOn,
  onClose,
  onChange,
  onTogglePower,
}: {
  device: Device;
  state: TVState;
  isOn: boolean;
  onClose: () => void;
  onChange: (patch: Partial<TVState>) => void;
  onTogglePower: () => void;
}) {
  const [tab, setTab] = useState<"sources" | "control">("sources");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        layoutId={`home-tv-${device.id}`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-surface border-t sm:border border-line shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-ink-soft">Control remoto</p>
            <p className="text-base font-semibold truncate">{device.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePower}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-soft",
                isOn ? "bg-gold text-navy" : "bg-surface-2 text-ink-soft border border-line",
              )}
              aria-label={isOn ? "Apagar" : "Encender"}
              aria-pressed={isOn}
            >
              <Power className="h-6 w-6" />
            </button>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center hover:bg-line/40 transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 flex gap-1 border-b border-line">
          {(["sources", "control"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors",
                tab === t
                  ? "border-gold-border text-ink"
                  : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {t === "sources" ? "Fuentes" : "Control"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "sources" ? (
            <div className="grid grid-cols-2 gap-3">
              {SOURCES.map((src) => {
                const active = state.source === src.id;
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => {
                      onChange({ source: src.id });
                    }}
                    disabled={!isOn}
                    className={cn(
                      "relative h-20 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-1.5 transition-all border-2",
                      active
                        ? "border-gold-border scale-[1.02] shadow-elev"
                        : "border-line hover:border-gold-border/40",
                      !isOn && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 opacity-90",
                        src.color,
                      )}
                    />
                    <span className="relative text-white text-sm font-semibold drop-shadow-md">
                      {src.label}
                    </span>
                    {active && (
                      <span className="relative text-white/80 text-[10px] uppercase tracking-widest">
                        Activo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-soft uppercase tracking-wide">
                    Volumen
                  </span>
                  <span className="text-sm font-mono tabular-nums">
                    {state.muted ? "Silenciado" : `${state.volume}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onChange({
                        volume: Math.max(0, state.volume - 5),
                        muted: false,
                      })
                    }
                    disabled={!isOn}
                    className="w-14 h-14 rounded-2xl bg-surface-2 border border-line flex items-center justify-center hover:bg-line/40 disabled:opacity-40 transition"
                    aria-label="Bajar volumen"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={state.muted ? 0 : state.volume}
                    disabled={!isOn}
                    onChange={(e) =>
                      onChange({
                        volume: Number(e.target.value),
                        muted: false,
                      })
                    }
                    className="flex-1 h-3 accent-gold-border"
                  />
                  <button
                    onClick={() =>
                      onChange({
                        volume: Math.min(100, state.volume + 5),
                        muted: false,
                      })
                    }
                    disabled={!isOn}
                    className="w-14 h-14 rounded-2xl bg-surface-2 border border-line flex items-center justify-center hover:bg-line/40 disabled:opacity-40 transition"
                    aria-label="Subir volumen"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <button
                  onClick={() => onChange({ muted: !state.muted })}
                  disabled={!isOn}
                  className={cn(
                    "mt-2 w-full h-11 rounded-xl text-xs font-medium transition-colors",
                    state.muted
                      ? "bg-gold/20 text-ink border border-gold-border/40"
                      : "bg-surface-2 text-ink-soft border border-line",
                    !isOn && "opacity-40",
                  )}
                >
                  {state.muted ? "Activar sonido" : "Silenciar"}
                </button>
              </div>

              {/* Channel */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-soft uppercase tracking-wide">
                    Canal
                  </span>
                  <span className="text-sm font-mono tabular-nums">
                    {state.channel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onChange({ channel: Math.max(1, state.channel - 1) })
                    }
                    disabled={!isOn}
                    className="flex-1 h-14 rounded-2xl bg-surface-2 border border-line flex items-center justify-center gap-2 hover:bg-line/40 disabled:opacity-40 transition"
                    aria-label="Canal anterior"
                  >
                    <Minus className="h-5 w-5" />
                    <span className="text-xs">CH-</span>
                  </button>
                  <button
                    onClick={() => onChange({ channel: state.channel + 1 })}
                    disabled={!isOn}
                    className="flex-1 h-14 rounded-2xl bg-surface-2 border border-line flex items-center justify-center gap-2 hover:bg-line/40 disabled:opacity-40 transition"
                    aria-label="Canal siguiente"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">CH+</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
