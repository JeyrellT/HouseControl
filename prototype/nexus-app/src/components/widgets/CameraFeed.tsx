"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── YouTube embed (simulated CCTV feed) ──────────────────── */

export function YouTubeFeed({ className }: { className?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative w-full h-full bg-black", className)}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Camera className="h-8 w-8 text-ink-soft" />
            </motion.div>
            <span className="text-xs text-ink-soft">Conectando feed…</span>
          </div>
        </div>
      )}
      <iframe
        src="https://www.youtube.com/embed/Dtkszi85s-g?autoplay=1&mute=1&loop=1&playlist=Dtkszi85s-g&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&disablekb=1"
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ border: 0 }}
        onLoad={() => setLoaded(true)}
        title="Camera feed"
      />
    </div>
  );
}

/* ── Live clock (reusable) ────────────────────────────────── */

export function LiveClock({ className }: { className?: string }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("es-CR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={cn("tabular-nums font-mono text-[11px]", className)}>
      {time}
    </span>
  );
}
