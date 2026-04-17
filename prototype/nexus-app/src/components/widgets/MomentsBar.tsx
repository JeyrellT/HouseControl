"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play } from "lucide-react";
import { useNexus } from "@/lib/store";
import { MOMENTS, suggestedMoment, type Moment } from "@/lib/moments";
import type { PersonaId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MomentsBar({ personaId }: { personaId: PersonaId }) {
  const runMoment = useNexus((s) => s.runMoment);
  const current = useNexus((s) => s.currentMoment);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const suggested = useMemo(
    () => (now ? suggestedMoment(now, personaId) : null),
    [now, personaId],
  );

  const moments = useMemo(() => {
    if (!suggested) return MOMENTS;
    return [suggested, ...MOMENTS.filter((m) => m.id !== suggested.id)];
  }, [suggested]);

  return (
    <section aria-label="Momentos" className="mb-5">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div>
          <p className="text-[10px] sm:text-xs text-ink-soft uppercase tracking-wider">
            Momentos
          </p>
          <p className="text-sm text-ink-soft">
            Combina varios dispositivos con un toque.
          </p>
        </div>
        {suggested && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-gold-border uppercase tracking-wider font-medium"
          >
            <Sparkles className="h-3 w-3" />
            Sugerido para ahora
          </motion.span>
        )}
      </div>

      {/* Scrollable chip strip */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-thin">
        <div className="flex gap-2.5 pb-1 min-w-max sm:min-w-0 sm:flex-wrap">
          {moments.map((m, idx) => {
            const isSuggested = idx === 0 && m.id === suggested?.id;
            const isRunning = current?.momentId === m.id;
            return (
              <MomentChip
                key={m.id}
                moment={m}
                isSuggested={isSuggested}
                isRunning={isRunning}
                disabled={Boolean(current) && !isRunning}
                onClick={() => !current && runMoment(m.id)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MomentChip({
  moment,
  isSuggested,
  isRunning,
  disabled,
  onClick,
}: {
  moment: Moment;
  isSuggested: boolean;
  isRunning: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative shrink-0 min-h-[84px] w-[180px] sm:w-[200px] rounded-2xl p-3 text-left overflow-hidden",
        "bg-gradient-to-br border transition-all",
        moment.gradient,
        isSuggested
          ? "border-gold-border shadow-elev scale-[1.02]"
          : "border-line/70 hover:border-gold-border/40",
        disabled && !isRunning && "opacity-50 cursor-not-allowed",
        isRunning && "ring-2 ring-gold ring-offset-2 ring-offset-[var(--surface)]",
      )}
      aria-label={`Activar momento ${moment.name}`}
      aria-pressed={isRunning}
    >
      {/* Running shimmer */}
      {isRunning && (
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="relative flex items-center gap-2 mb-1">
        <span className="text-xl leading-none select-none" aria-hidden>
          {moment.emoji}
        </span>
        <span className="text-sm font-semibold truncate">
          {moment.name}
        </span>
        {isSuggested && !isRunning && (
          <span className="ml-auto px-1.5 py-0.5 rounded-md bg-gold/80 text-navy text-[9px] font-bold uppercase tracking-wider shrink-0">
            Ahora
          </span>
        )}
        {isRunning && (
          <motion.div
            className="ml-auto shrink-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-4 w-4" />
          </motion.div>
        )}
      </div>

      <p className="relative text-[11px] leading-snug opacity-80 line-clamp-2">
        {moment.tagline}
      </p>

      {!isRunning && (
        <div className="relative mt-2 flex items-center gap-1 text-[10px] opacity-70">
          <Play className="h-2.5 w-2.5" />
          <span>{moment.steps.length} pasos</span>
        </div>
      )}
    </motion.button>
  );
}

/** Progress overlay shown while a moment is running. */
export function MomentProgressOverlay() {
  const current = useNexus((s) => s.currentMoment);
  const moment = current ? MOMENTS.find((m) => m.id === current.momentId) : null;

  return (
    <AnimatePresence>
      {current && moment && (
        <motion.div
          key="moment-progress"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md"
          role="status"
          aria-live="polite"
        >
          <div className="rounded-2xl bg-navy/95 text-cream border border-gold/30 shadow-2xl backdrop-blur overflow-hidden">
            <div className="p-3 flex items-center gap-3">
              <span className="text-2xl leading-none shrink-0" aria-hidden>
                {moment.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-cream/60 uppercase tracking-wider">
                  {moment.name} · paso {current.stepIndex + 1} de {current.totalSteps}
                </p>
                <motion.p
                  key={current.stepLabel}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-sm font-medium truncate"
                >
                  {current.stepLabel}…
                </motion.p>
              </div>
              <div className="shrink-0 text-[10px] tabular-nums font-mono text-cream/60">
                {current.affectedDeviceIds.length} disp.
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-white/10">
              <motion.div
                className="h-full bg-gold"
                initial={{ width: 0 }}
                animate={{
                  width: `${((current.stepIndex + 1) / current.totalSteps) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 160, damping: 26 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
