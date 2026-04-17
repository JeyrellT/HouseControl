"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNexus, selectDevicesByPersona, STATIC } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Device } from "@/lib/types";
import { YouTubeFeed, LiveClock } from "@/components/widgets/CameraFeed";
import {
  Camera, Grid2X2, LayoutGrid, Maximize2, X,
  Move, ZoomIn, ZoomOut, RotateCcw, Video, Wifi, WifiOff,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Circle, Eye,
} from "lucide-react";

/* ── PTZ Controls (decorative) ────────────────────────────── */

function PTZControls() {
  return (
    <div className="flex items-center gap-3">
      {/* Directional pad */}
      <div className="relative w-24 h-24 sm:w-20 sm:h-20">
        <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm" />
        {[
          { Icon: ChevronUp, pos: "top-0 left-1/2 -translate-x-1/2", label: "Arriba" },
          { Icon: ChevronDown, pos: "bottom-0 left-1/2 -translate-x-1/2", label: "Abajo" },
          { Icon: ChevronLeft, pos: "left-0 top-1/2 -translate-y-1/2", label: "Izquierda" },
          { Icon: ChevronRight, pos: "right-0 top-1/2 -translate-y-1/2", label: "Derecha" },
        ].map(({ Icon, pos, label }) => (
          <button
            key={label}
            className={cn(
              "absolute w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-full",
              "text-white/60 hover:text-white hover:bg-white/10 transition",
              pos,
            )}
            aria-label={label}
          >
            <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </button>
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/20" />
      </div>

      {/* Zoom + Reset */}
      <div className="flex flex-col gap-1.5">
        {[
          { Icon: ZoomIn, label: "Zoom in" },
          { Icon: ZoomOut, label: "Zoom out" },
          { Icon: RotateCcw, label: "Reset" },
        ].map(({ Icon, label }) => (
          <button
            key={label}
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label={label}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Camera Feed Card ─────────────────────────────────────── */

function CameraFeedCard({
  device,
  roomName,
  onClick,
  compact,
}: {
  device: Device;
  roomName: string;
  onClick: () => void;
  compact: boolean;
}) {
  const isOnline = device.availability === "online";

  return (
    <motion.div
      layoutId={`cam-${device.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "relative rounded-xl overflow-hidden cursor-pointer group",
        "bg-[#0a0e1a] border border-white/[0.06]",
        compact ? "aspect-video" : "aspect-video",
        "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]",
        "hover:border-white/[0.12] transition-colors duration-300",
      )}
      onClick={onClick}
    >
      {/* Video feed */}
      <YouTubeFeed />

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
      />

      {/* Top overlay bar */}
      <div className="absolute top-0 inset-x-0 z-[3] p-2.5 sm:p-3 flex items-start justify-between bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          {/* Live/Offline badge */}
          {isOnline ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/90 text-white">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-white"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[9px] font-bold tracking-wider uppercase">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/20 text-white/60">
              <WifiOff className="h-2.5 w-2.5" />
              <span className="text-[9px] font-medium">Offline</span>
            </div>
          )}
          <div className="text-white truncate">
            <p className="text-xs font-medium leading-tight truncate drop-shadow-md">{device.name}</p>
            <p className="text-[10px] text-white/60 truncate">{roomName}</p>
          </div>
        </div>
        <button
          className="p-2 rounded hover:bg-white/10 text-white/60 hover:text-white transition sm:opacity-0 sm:group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label="Expandir"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bottom overlay bar */}
      <div className="absolute bottom-0 inset-x-0 z-[3] p-2.5 sm:p-3 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/30 to-transparent">
        <div className="flex items-center gap-2 text-white/70">
          {isOnline && (
            <div className="flex items-center gap-1">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Circle className="h-2 w-2 fill-red-500 text-red-500" />
              </motion.div>
              <span className="text-[9px] font-mono uppercase tracking-wider">Rec</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <LiveClock />
          {isOnline && <Wifi className="h-3 w-3" />}
        </div>
      </div>

      {/* Offline overlay */}
      {!isOnline && (
        <div className="absolute inset-0 z-[4] bg-black/60 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-white/40">
            <WifiOff className="h-8 w-8" />
            <span className="text-xs">Sin señal</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Expanded Camera Modal ────────────────────────────────── */

function ExpandedCamera({
  device,
  roomName,
  onClose,
}: {
  device: Device;
  roomName: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        layoutId={`cam-${device.id}`}
        className="relative w-full max-w-5xl rounded-t-2xl sm:rounded-2xl overflow-hidden bg-[#0a0e1a] border border-white/[0.08] shadow-2xl max-h-[95vh] sm:max-h-none overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Video — larger aspect */}
        <div className="relative aspect-video">
          <YouTubeFeed />

          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none z-[2]"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)",
            }}
          />

          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 z-[3] p-4 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/90 text-white">
                <motion.div
                  className="w-2 h-2 rounded-full bg-white"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-[10px] font-bold tracking-wider uppercase">En vivo</span>
              </div>
              <div className="text-white">
                <p className="text-sm font-medium drop-shadow-lg">{device.name}</p>
                <p className="text-xs text-white/60">{roomName} · {device.vendor}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 inset-x-0 z-[3] p-4 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-3 text-white/70">
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                </motion.div>
                <span className="text-[10px] font-mono uppercase tracking-wider">Rec</span>
              </div>
              <span className="text-xs text-white/40">|</span>
              <LiveClock />
            </div>
            <div className="flex items-center gap-3 text-white/60 text-xs">
              <span className="font-mono">1080p</span>
              <span>30fps</span>
              <Wifi className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Controls strip below video */}
        <div className="p-4 sm:p-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#060a14]">
          <PTZControls />

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {[
              { label: "Captura", Icon: Camera },
              { label: "Grabar", Icon: Video },
              { label: "Detectar", Icon: Eye },
              { label: "Mover", Icon: Move },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                className="flex items-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition text-xs"
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function CamerasPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const allDevices = selectDevicesByPersona(personaId);
  const cameras = useMemo(
    () => allDevices.filter((d) => d.kind === "camera"),
    [allDevices],
  );

  const roomMap = useMemo(() => {
    const map = new Map<string, string>();
    STATIC.rooms.forEach((r) => map.set(r.id, r.name));
    return map;
  }, []);

  const [layout, setLayout] = useState<"2x2" | "3x3">("2x2");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expandedCam = cameras.find((c) => c.id === expandedId);

  const onlineCount = cameras.filter((c) => c.availability === "online").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Hero Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl sm:text-3xl flex items-center gap-3"
          >
            Cámaras
            <Badge tone="critical" className="text-[10px] flex items-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-white"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {onlineCount} EN VIVO
            </Badge>
          </motion.h1>
          <p className="text-sm text-ink-soft mt-1">
            {cameras.length} cámara{cameras.length === 1 ? "" : "s"} · Vigilancia en tiempo real
          </p>
        </div>

        {/* Grid toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-line">
          {([
            { value: "2x2" as const, Icon: Grid2X2, label: "2×2" },
            { value: "3x3" as const, Icon: LayoutGrid, label: "3×3" },
          ]).map(({ value, Icon, label }) => (
            <button
              key={value}
              onClick={() => setLayout(value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 sm:py-1.5 rounded-lg text-xs transition-all",
                layout === value
                  ? "bg-navy text-cream shadow-soft"
                  : "text-ink-soft hover:text-ink hover:bg-surface",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Camera Grid ── */}
      <motion.div
        layout
        className={cn(
          "grid gap-3 sm:gap-4",
          layout === "2x2"
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        <AnimatePresence mode="popLayout">
          {cameras.map((cam) => (
            <CameraFeedCard
              key={cam.id}
              device={cam}
              roomName={roomMap.get(cam.roomId) ?? "—"}
              onClick={() => setExpandedId(cam.id)}
              compact={layout === "3x3"}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ── Empty state ── */}
      {cameras.length === 0 && (
        <Card className="py-16 text-center">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto">
              <Camera className="h-6 w-6 text-ink-soft" />
            </div>
            <p className="text-sm text-ink-soft">No hay cámaras configuradas</p>
            <p className="text-xs text-ink-soft/70">Agrega dispositivos tipo cámara en tu propiedad</p>
          </div>
        </Card>
      )}

      {/* ── Expanded overlay ── */}
      <AnimatePresence>
        {expandedCam && (
          <ExpandedCamera
            device={expandedCam}
            roomName={roomMap.get(expandedCam.roomId) ?? "—"}
            onClose={() => setExpandedId(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Info footer ── */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-ink-soft/60 pt-2 pb-4">
        <span className="flex items-center gap-1">
          <Circle className="h-1.5 w-1.5 fill-red-500 text-red-500" /> Grabación continua
        </span>
        <span>·</span>
        <span>Retención: 30 días</span>
        <span>·</span>
        <span>Detección de movimiento activa</span>
        <span>·</span>
        <span>Protocolo: UniFi Protect</span>
      </div>
    </div>
  );
}
