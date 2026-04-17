"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Circle, Maximize2, Wifi, WifiOff, X } from "lucide-react";
import { YouTubeFeed, LiveClock } from "./CameraFeed";
import type { Device } from "@/lib/types";
import { STATIC } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CameraWidget({
  device,
  interactive,
}: {
  device: Device;
  interactive: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const room = STATIC.rooms.find((r) => r.id === device.roomId);
  const isOnline = device.availability === "online";

  return (
    <>
      <motion.button
        type="button"
        layoutId={`home-cam-${device.id}`}
        onClick={() => interactive && isOnline && setExpanded(true)}
        disabled={!interactive || !isOnline}
        className={cn(
          "relative block h-full w-full overflow-hidden rounded-2xl bg-[#0a0e1a] border border-white/10 text-left",
          interactive && isOnline && "cursor-pointer",
          "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]",
        )}
      >
        <YouTubeFeed />
        {/* scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-[2] mix-blend-overlay opacity-70"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
          }}
        />

        {/* Top overlay */}
        <div className="absolute top-0 inset-x-0 z-[3] p-2.5 sm:p-3 flex items-start justify-between bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          <div className="flex items-center gap-2 min-w-0">
            {isOnline ? (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/90 text-white">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-white"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-[9px] font-bold tracking-wider uppercase">
                  Live
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/20 text-white/60">
                <WifiOff className="h-2.5 w-2.5" />
                <span className="text-[9px] font-medium">Offline</span>
              </div>
            )}
            <div className="text-white truncate">
              <p className="text-xs font-medium leading-tight truncate drop-shadow-md">
                {device.name}
              </p>
              <p className="text-[10px] text-white/60 truncate">
                {room?.name ?? ""}
              </p>
            </div>
          </div>
          {interactive && isOnline && (
            <div className="p-1.5 rounded bg-white/10 text-white/70 opacity-0 group-hover:opacity-100 transition">
              <Maximize2 className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 inset-x-0 z-[3] p-2.5 sm:p-3 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent">
          {isOnline && (
            <div className="flex items-center gap-1 text-white/70">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Circle className="h-2 w-2 fill-red-500 text-red-500" />
              </motion.div>
              <span className="text-[9px] font-mono uppercase tracking-wider">
                Rec
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-white/70 ml-auto">
            <LiveClock />
            {isOnline && <Wifi className="h-3 w-3" />}
          </div>
        </div>

        {/* Offline overlay */}
        {!isOnline && (
          <div className="absolute inset-0 z-[4] bg-black/70 flex flex-col items-center justify-center text-white/60">
            <Camera className="h-8 w-8 mb-2" />
            <span className="text-xs">Sin señal</span>
          </div>
        )}
      </motion.button>

      {/* Expanded modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              layoutId={`home-cam-${device.id}`}
              className="relative w-full max-w-5xl rounded-t-2xl sm:rounded-2xl overflow-hidden bg-[#0a0e1a] border border-white/10 shadow-2xl max-h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video">
                <YouTubeFeed />
                <div className="absolute top-0 inset-x-0 z-[3] p-4 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent">
                  <div className="text-white">
                    <p className="text-sm font-medium drop-shadow-lg">
                      {device.name}
                    </p>
                    <p className="text-xs text-white/60">
                      {room?.name ?? ""} · {device.vendor}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
