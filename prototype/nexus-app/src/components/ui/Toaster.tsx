"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles, AlertTriangle, Shield, Zap, Check, Bell,
  Brain, Flame, Thermometer, Wifi, Radio, Info, X,
} from "lucide-react";
import { useToastStore, type Toast, type ToastTone } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  Sparkles, AlertTriangle, Shield, Zap, Check, Bell,
  Brain, Flame, Thermometer, Wifi, Radio, Info,
} as const;

const TONE_DEFAULT_ICON: Record<ToastTone, keyof typeof ICON_MAP> = {
  info: "Info",
  success: "Check",
  warn: "AlertTriangle",
  critical: "Flame",
  ai: "Brain",
};

const TONE_CLASS: Record<ToastTone, { ring: string; bg: string; glow: string; iconBg: string; iconColor: string; accent: string }> = {
  info:     { ring: "ring-sky-500/30",       bg: "bg-sky-500/5",       glow: "shadow-[0_0_40px_-10px_rgba(14,165,233,0.4)]",    iconBg: "bg-sky-500/15",       iconColor: "text-sky-400",       accent: "bg-sky-500" },
  success:  { ring: "ring-emerald-500/30",   bg: "bg-emerald-500/5",   glow: "shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]",    iconBg: "bg-emerald-500/15",   iconColor: "text-emerald-400",   accent: "bg-emerald-500" },
  warn:     { ring: "ring-amber-500/40",     bg: "bg-amber-500/5",     glow: "shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]",    iconBg: "bg-amber-500/15",     iconColor: "text-amber-400",     accent: "bg-amber-500" },
  critical: { ring: "ring-red-500/50",       bg: "bg-red-500/10",      glow: "shadow-[0_0_50px_-8px_rgba(239,68,68,0.6)]",      iconBg: "bg-red-500/20",       iconColor: "text-red-400",       accent: "bg-red-500" },
  ai:       { ring: "ring-purple-500/40",    bg: "bg-purple-500/5",    glow: "shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]",    iconBg: "bg-purple-500/15",    iconColor: "text-purple-400",    accent: "bg-purple-500" },
};

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const klass = TONE_CLASS[t.tone];
  const Icon = ICON_MAP[t.icon ?? TONE_DEFAULT_ICON[t.tone]];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn(
        "relative overflow-hidden w-full sm:min-w-[300px] sm:max-w-[380px] rounded-xl backdrop-blur-md",
        "bg-surface-2/90 border border-line ring-1",
        klass.ring, klass.glow,
      )}
    >
      {/* tone-tinted overlay */}
      <div className={cn("absolute inset-0 pointer-events-none", klass.bg)} aria-hidden />
      {/* left accent stripe */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", klass.accent)} aria-hidden />

      {/* critical alerts: shimmering top border */}
      {t.tone === "critical" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-red-400 to-transparent"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      <div className="relative p-3 flex items-start gap-3">
        <motion.div
          initial={{ scale: 0.6, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.05 }}
          className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", klass.iconBg, klass.iconColor)}
        >
          <Icon size={18} />
        </motion.div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="font-medium text-sm text-ink leading-tight">{t.title}</div>
          {t.body && (
            <div className="text-xs text-ink-soft mt-0.5 leading-snug">{t.body}</div>
          )}
          {t.action && (
            <button
              onClick={() => {
                t.action!.onClick();
                dismiss(t.id);
              }}
              className={cn(
                "mt-2 text-[11px] font-medium px-2.5 py-1 rounded-md border transition",
                "border-line bg-surface hover:bg-line",
                klass.iconColor,
              )}
            >
              {t.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => dismiss(t.id)}
          aria-label="Cerrar"
          className="text-ink-soft hover:text-ink p-0.5 rounded transition"
        >
          <X size={14} />
        </button>
      </div>

      {/* progress bar for auto-dismiss */}
      {t.duration && t.duration > 0 && (
        <motion.div
          className={cn("absolute bottom-0 left-0 h-0.5", klass.accent)}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: t.duration / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      className="fixed z-[60] flex flex-col gap-2 pointer-events-none inset-x-3 top-3 items-end sm:inset-x-auto sm:right-4 sm:top-4 sm:left-auto"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full sm:w-auto">
            <ToastItem t={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
