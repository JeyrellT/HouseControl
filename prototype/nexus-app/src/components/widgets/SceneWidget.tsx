"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { useNexus, STATIC } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SceneWidget({
  sceneId,
  interactive,
}: {
  sceneId: string;
  interactive: boolean;
}) {
  const scene = STATIC.scenes.find((s) => s.id === sceneId);
  const runScene = useNexus((s) => s.runScene);
  const [justRan, setJustRan] = useState(false);

  if (!scene) {
    return (
      <div className="h-full w-full rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xs text-ink-soft">
        Escena no disponible
      </div>
    );
  }

  const actionCount = Object.keys(scene.targetStates).length;

  function handleRun() {
    if (!interactive) return;
    runScene(scene!.id);
    setJustRan(true);
    setTimeout(() => setJustRan(false), 1400);
  }

  return (
    <motion.button
      type="button"
      whileTap={interactive ? { scale: 0.96 } : undefined}
      onClick={handleRun}
      disabled={!interactive}
      className={cn(
        "relative h-full w-full rounded-2xl overflow-hidden text-left flex flex-col",
        "bg-gradient-to-br from-gold/20 via-cream to-sage/20",
        "dark:from-gold/15 dark:via-surface-2 dark:to-sage/15",
        "border border-gold-border/30",
        interactive && "cursor-pointer hover:shadow-elev",
        "transition-shadow",
      )}
      aria-label={`Ejecutar escena ${scene.name}`}
    >
      {/* Decorative sparkle */}
      <motion.div
        aria-hidden
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl bg-gold/30"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative flex items-start gap-3 p-3 sm:p-4">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gold/30 text-gold-border flex items-center justify-center shrink-0 shadow-soft">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-ink-soft uppercase tracking-wider">
            Escena
          </p>
          <p className="text-sm sm:text-base font-semibold truncate mt-0.5">
            {scene.name}
          </p>
        </div>
      </div>

      <p className="relative px-3 sm:px-4 text-[11px] text-ink-soft line-clamp-2">
        {scene.description ?? `${actionCount} acciones`}
      </p>

      <div className="relative mt-auto px-3 sm:px-4 pb-3 sm:pb-4 pt-2 flex items-center gap-2">
        <span className="text-[10px] text-ink-soft tabular-nums">
          {actionCount} acciones
        </span>
        <div className="ml-auto">
          <AnimatePresence mode="wait">
            {justRan ? (
              <motion.div
                key="ran"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                className="w-8 h-8 rounded-full bg-sage text-cream flex items-center justify-center"
              >
                <Check className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="tap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-medium uppercase tracking-wider text-gold-border"
              >
                Tocar
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}
