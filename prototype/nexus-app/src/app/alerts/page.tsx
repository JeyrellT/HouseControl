"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import {
  useNexus, selectNotificationsByPersona, selectActivePersona,
} from "@/lib/store";
import { STATIC } from "@/lib/store";
import { toast } from "@/lib/toast-store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type {
  Notification, NotificationCategory, NotificationSeverity, NotificationStatus,
  NotificationActionIntent,
} from "@/lib/types";
import {
  Bell, Shield, Zap, Wrench, Wifi, Thermometer, Sparkles, UserPlus, Flame, Brain,
  Check, VolumeX, CheckCircle2, ChevronDown, AlertTriangle, Clock, Filter,
  Siren, Activity as ActivityIcon, TrendingUp, PlayCircle, ExternalLink,
  List, Map as MapIcon, LineChart, Home, DoorOpen,
  SlidersHorizontal, X, ArrowRight, Inbox,
} from "lucide-react";

// ------ Visual config ------
const CATEGORY_META: Record<NotificationCategory, {
  label: string; Icon: typeof Shield; color: string; bg: string;
}> = {
  security:    { label: "Seguridad",    Icon: Shield,      color: "#D9534F", bg: "bg-red-500/10" },
  energy:      { label: "Energía",      Icon: Zap,         color: "#D4A84B", bg: "bg-amber-500/10" },
  automation:  { label: "Automatización",Icon: Sparkles,   color: "#7FA071", bg: "bg-emerald-500/10" },
  maintenance: { label: "Mantenimiento",Icon: Wrench,      color: "#8B95A8", bg: "bg-slate-500/10" },
  network:     { label: "Red",          Icon: Wifi,        color: "#0EA5E9", bg: "bg-sky-500/10" },
  climate:     { label: "Clima",        Icon: Thermometer, color: "#14B8A6", bg: "bg-teal-500/10" },
  ai:          { label: "IA",           Icon: Brain,       color: "#A855F7", bg: "bg-purple-500/10" },
  guest:       { label: "Invitados",    Icon: UserPlus,    color: "#EC4899", bg: "bg-pink-500/10" },
  safety:      { label: "Seguridad vida",Icon: Flame,      color: "#F97316", bg: "bg-orange-500/10" },
};

const SEVERITY_META: Record<NotificationSeverity, { color: string; label: string; tone: "ok"|"warn"|"critical" }> = {
  info:     { color: "#5BB37F", label: "Info",     tone: "ok" },
  warn:     { color: "#E0A537", label: "Aviso",    tone: "warn" },
  critical: { color: "#D9534F", label: "Crítico",  tone: "critical" },
};

const INTENT_META: Record<NotificationActionIntent, { Icon: typeof Check; label: string }> = {
  ack:               { Icon: Check,            label: "Reconocer" },
  resolve:           { Icon: CheckCircle2,     label: "Resolver" },
  mute:              { Icon: VolumeX,          label: "Silenciar" },
  "run-scene":       { Icon: PlayCircle,       label: "Ejecutar" },
  "open-device":     { Icon: ExternalLink,     label: "Abrir" },
  "open-room":       { Icon: ExternalLink,     label: "Abrir" },
  "open-energy":     { Icon: ExternalLink,     label: "Energía" },
  "open-health":     { Icon: ExternalLink,     label: "Salud" },
  "open-integrations":{ Icon: ExternalLink,    label: "Red" },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ------ Animated counter (spring-interpolated number) ------
function AnimatedNumber({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 12, scale: 0.7, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn("inline-block tabular-nums", className)}
      style={style}
    >
      {value}
    </motion.span>
  );
}

// ------ Swipeable alert card wrapper (mobile) ------
const SWIPE_THRESHOLD = 80;

function SwipeableAlertCard({
  n,
  onAction,
  children,
}: {
  n: Notification;
  onAction: (id: string, intent: NotificationActionIntent) => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const bgOpacityRight = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const bgOpacityLeft = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const iconScaleRight = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1.15]);
  const iconScaleLeft = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.15, 0.5]);

  const isResolved = n.status === "resolved" || n.status === "muted";

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (isResolved) return;
      if (info.offset.x > SWIPE_THRESHOLD) {
        onAction(n.id, "ack");
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        onAction(n.id, "mute");
      }
    },
    [n.id, onAction, isResolved],
  );

  if (isResolved) return <>{children}</>;

  return (
    <div className="relative rounded-xl overflow-hidden md:overflow-visible">
      {/* Reveal layers behind the card */}
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center pl-4 md:hidden"
        style={{ opacity: bgOpacityRight, background: "linear-gradient(90deg, #5BB37F 0%, #5BB37F88 100%)" }}
      >
        <motion.div style={{ scale: iconScaleRight }} className="text-white">
          <Check className="h-6 w-6" />
        </motion.div>
        <span className="ml-2 text-white text-xs font-medium">Reconocer</span>
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center justify-end pr-4 md:hidden"
        style={{ opacity: bgOpacityLeft, background: "linear-gradient(270deg, #8B95A8 0%, #8B95A888 100%)" }}
      >
        <span className="mr-2 text-white text-xs font-medium">Silenciar</span>
        <motion.div style={{ scale: iconScaleLeft }} className="text-white">
          <VolumeX className="h-6 w-6" />
        </motion.div>
      </motion.div>

      {/* Draggable card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        onDragEnd={handleDragEnd}
        className="relative z-10 md:!transform-none"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ------ Hero: Risk Radar gauge + live ticker ------
function AlertHero({ list, onSimulate }: { list: Notification[]; onSimulate?: () => void }) {
  const active = list.filter((n) => n.status === "active");
  const counts: Record<NotificationSeverity, number> = {
    critical: active.filter((n) => n.severity === "critical").length,
    warn: active.filter((n) => n.severity === "warn").length,
    info: active.filter((n) => n.severity === "info").length,
  };
  const estimatedCost = list
    .filter((n) => n.status !== "resolved" && (n.estimatedImpactCRC ?? 0) > 0)
    .reduce((s, n) => s + (n.estimatedImpactCRC ?? 0), 0);
  const resolvedHoy = list.filter((n) => n.status === "resolved").length;

  // Risk score 0-100: critical*25 + warn*8 + info*2, capped.
  const rawRisk = counts.critical * 25 + counts.warn * 8 + counts.info * 2;
  const risk = Math.min(100, rawRisk);
  const riskLabel =
    risk >= 60 ? "Elevado" :
    risk >= 30 ? "Moderado" :
    risk > 0  ? "Bajo"   : "Seguro";
  const riskColor =
    risk >= 60 ? "#D9534F" :
    risk >= 30 ? "#E0A537" :
    risk > 0  ? "#4A90C2" : "#5BB37F";

  // Ticker = últimas 10 notificaciones (cualquier estado) ordenadas por ts desc
  const ticker = [...list]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 8);

  // SVG gauge geometry
  const R = 56, CIRC = 2 * Math.PI * R;
  const dash = (risk / 100) * CIRC;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl border border-cream/10 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(30,42,68,0.97) 0%, rgba(44,58,90,0.95) 50%, rgba(30,42,68,0.98) 100%)",
        backdropFilter: "blur(12px) saturate(140%)",
      }}
    >
      {/* Multi-layer ambient glow */}
      <motion.div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[80px] opacity-30"
        style={{ backgroundColor: riskColor }}
        animate={risk >= 60 ? { opacity: [0.2, 0.5, 0.2], scale: [1, 1.08, 1] } : undefined}
        transition={risk >= 60 ? { duration: 3, repeat: Infinity } : undefined}
        aria-hidden
      />
      <motion.div
        className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-[60px] opacity-20"
        style={{ backgroundColor: riskColor }}
        aria-hidden
      />

      {/* Animated scan line */}
      {risk >= 30 && (
        <motion.div
          className="absolute inset-x-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${riskColor}60, transparent)` }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
      )}

      {/* Grid dot pattern overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative p-4 sm:p-6 flex flex-col md:flex-row items-stretch gap-4 md:gap-6">
        {/* Mobile: gauge top center, desktop: gauge right */}
        <div className="flex md:hidden items-center justify-between gap-4">
          {/* Mini gauge on mobile */}
          <div className="relative w-[88px] h-[88px] flex-shrink-0">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <defs>
                <linearGradient id="riskGradMobile" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={riskColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={riskColor} stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <motion.circle
                cx="70" cy="70" r={R} fill="none"
                stroke="url(#riskGradMobile)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: CIRC - dash }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatedNumber value={risk} className="font-display text-2xl leading-none" style={{ color: riskColor }} />
              <div className="text-[8px] uppercase tracking-[0.15em] text-cream/50 mt-0.5">Risk</div>
            </div>
          </div>

          {/* Mobile title + risk label */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-cream/50 text-[10px] uppercase tracking-[0.15em]">
              <Siren className="h-3 w-3" /> Alertas
            </div>
            <h1 className="font-display text-xl text-cream mt-0.5 leading-tight">
              {counts.critical > 0 ? "Atención requerida" : counts.warn > 0 ? "Avisos activos" : "Todo tranquilo"}
            </h1>
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: `${riskColor}25`, color: riskColor, border: `1px solid ${riskColor}40` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: riskColor }} />
              {riskLabel}
            </motion.span>
          </div>
        </div>

        {/* Desktop: Left title + stats */}
        <div className="hidden md:block flex-1 min-w-0">
          <div className="flex items-center gap-2 text-cream/60 text-xs uppercase tracking-widest">
            <Siren className="h-3 w-3" /> Centro de Alertas
            <span className="ml-2 px-1.5 py-0.5 rounded bg-cream/10 text-cream/80 tracking-normal normal-case">
              RISK INDEX · {riskLabel}
            </span>
          </div>
          <h1 className="font-display text-3xl text-cream mt-1">
            {counts.critical > 0
              ? "Atención requerida"
              : counts.warn > 0
                ? "Operación estable con avisos"
                : "Todo bajo control"}
          </h1>
          <p className="text-cream/70 text-sm mt-1 max-w-xl">
            {active.length} alertas activas · {resolvedHoy} resueltas hoy · costo potencial evitable{" "}
            <span className="font-medium text-amber-300">
              ₡{estimatedCost.toLocaleString("es-CR")}
            </span>
          </p>

          {/* Severity chips */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {(["critical","warn","info"] as NotificationSeverity[]).map((sev) => {
              const meta = SEVERITY_META[sev];
              const count = counts[sev];
              return (
                <motion.div
                  key={sev}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: sev === "critical" ? 0 : sev === "warn" ? 0.08 : 0.16 }}
                  className="relative rounded-lg px-3 py-1.5 flex items-center gap-2"
                  style={{
                    backgroundColor: `${meta.color}1a`,
                    border: `1px solid ${meta.color}60`,
                  }}
                >
                  {sev === "critical" && count > 0 && (
                    <motion.span
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      style={{ border: `1px solid ${meta.color}` }}
                      animate={{ opacity: [0.25, 0.9, 0.25] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      aria-hidden
                    />
                  )}
                  <AnimatedNumber value={count} className="text-xl font-bold" style={{ color: meta.color }} />
                  <span className="text-[10px] uppercase tracking-wider text-cream/70">{meta.label}</span>
                </motion.div>
              );
            })}
            {onSimulate && (
              <button
                data-devonly
                onClick={onSimulate}
                className="ml-auto text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md bg-cream/10 text-cream/70 hover:bg-cream/20 hover:text-cream transition border border-cream/10"
                title="Simular alerta entrante (dev)"
              >
                ⚡ Simular entrante
              </button>
            )}
          </div>
        </div>

        {/* Right: radial risk gauge (desktop only — mobile uses the mini gauge above) */}
        <div className="hidden md:flex flex-shrink-0 items-center gap-4">
          <div className="relative w-[140px] h-[140px]">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={riskColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={riskColor} stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <motion.circle
                cx="70" cy="70" r={R} fill="none"
                stroke="url(#riskGrad)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: CIRC - dash }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              {Array.from({ length: 20 }).map((_, i) => {
                const a = (i / 20) * 2 * Math.PI;
                const rx1 = 70 + Math.cos(a) * (R - 14);
                const ry1 = 70 + Math.sin(a) * (R - 14);
                const rx2 = 70 + Math.cos(a) * (R - 18);
                const ry2 = 70 + Math.sin(a) * (R - 18);
                return (
                  <line key={i} x1={rx1} y1={ry1} x2={rx2} y2={ry2}
                    stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatedNumber value={risk} className="font-display text-3xl leading-none" style={{ color: riskColor }} />
              <div className="text-[9px] uppercase tracking-[0.15em] text-cream/60 mt-1">Risk Index</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile severity strip — compact horizontal */}
      <div className="flex md:hidden items-center gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
        {(["critical","warn","info"] as NotificationSeverity[]).map((sev) => {
          const meta = SEVERITY_META[sev];
          const count = counts[sev];
          return (
            <motion.div
              key={sev}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: sev === "critical" ? 0.1 : sev === "warn" ? 0.18 : 0.26 }}
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${meta.color}18`, border: `1px solid ${meta.color}40` }}
            >
              {sev === "critical" && count > 0 && (
                <motion.span
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{ border: `1px solid ${meta.color}` }}
                  animate={{ opacity: [0.2, 0.85, 0.2] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  aria-hidden
                />
              )}
              <AnimatedNumber value={count} className="text-sm font-bold" style={{ color: meta.color }} />
              <span className="text-[9px] uppercase tracking-wider text-cream/60">{meta.label}</span>
            </motion.div>
          );
        })}
        <div className="flex-1" />
        <span className="text-[10px] text-cream/50 flex-shrink-0 tabular-nums">
          {active.length} activas · ₡{estimatedCost.toLocaleString("es-CR")}
        </span>
      </div>

      {/* Live ticker */}
      {ticker.length > 0 && (
        <div className="relative border-t border-cream/8 bg-black/25 overflow-hidden">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-cream/50">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-status-ok"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            Live
          </div>
          <div className="relative overflow-hidden py-1 sm:py-1.5 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
            <motion.div
              className="flex gap-5 sm:gap-6 whitespace-nowrap px-3"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: Math.max(20, ticker.length * 5), repeat: Infinity, ease: "linear" }}
            >
              {[...ticker, ...ticker].map((n, i) => {
                const meta = CATEGORY_META[n.category];
                const sev = SEVERITY_META[n.severity];
                const Icon = meta.Icon;
                return (
                  <div key={`${n.id}-${i}`} className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-cream/75">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sev.color }} />
                    <Icon className="h-3 w-3 flex-shrink-0" style={{ color: meta.color }} />
                    <span className="text-cream font-medium">{n.title}</span>
                    <span className="text-cream/40">· {relativeTime(n.ts)}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ------ Category distribution strip ------
function CategoryStrip({ list, activeCategory, onPick }: {
  list: Notification[];
  activeCategory: NotificationCategory | "all";
  onPick: (c: NotificationCategory | "all") => void;
}) {
  const active = list.filter((n) => n.status !== "resolved" && n.status !== "muted");
  const total = active.length || 1;
  const cats: NotificationCategory[] = [
    "security","safety","energy","climate","network","ai","automation","maintenance","guest",
  ];
  const counts = cats.map((c) => ({
    c, count: active.filter((n) => n.category === c).length,
  })).filter((x) => x.count > 0);

  return (
    <div className="space-y-3">
      {/* Distribution bar */}
      <div className="flex h-2.5 sm:h-3 rounded-full overflow-hidden border border-line">
        {counts.map(({ c, count }, i) => {
          const meta = CATEGORY_META[c];
          const pct = (count / total) * 100;
          return (
            <motion.button
              key={c}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
              onClick={() => onPick(c === activeCategory ? "all" : c)}
              style={{ backgroundColor: meta.color }}
              className={cn(
                "relative cursor-pointer transition-opacity",
                activeCategory !== "all" && activeCategory !== c ? "opacity-35" : "hover:opacity-80",
              )}
              title={`${meta.label}: ${count}`}
            />
          );
        })}
      </div>

      {/* Filter chips — horizontally scrollable on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 snap-x">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onPick("all")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all snap-start flex-shrink-0",
            activeCategory === "all"
              ? "bg-navy text-cream border-navy shadow-soft"
              : "bg-surface border-line text-ink-soft hover:bg-surface-2",
          )}
        >
          <Filter className="h-3 w-3" /> Todas
          <span className="tabular-nums">({total})</span>
        </motion.button>
        {counts.map(({ c, count }) => {
          const meta = CATEGORY_META[c];
          const Icon = meta.Icon;
          const on = activeCategory === c;
          return (
            <motion.button
              key={c}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPick(c === activeCategory ? "all" : c)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all snap-start flex-shrink-0",
                on ? "text-white shadow-soft" : "text-ink-soft hover:bg-surface-2",
              )}
              style={on
                ? { backgroundColor: meta.color, borderColor: meta.color }
                : { borderColor: `${meta.color}50`, backgroundColor: `${meta.color}10` }
              }
            >
              <Icon className="h-3 w-3" style={on ? undefined : { color: meta.color }} />
              <span className="hidden sm:inline">{meta.label}</span>
              <span className="sm:hidden">{meta.label.slice(0, 3)}</span>
              <span className="tabular-nums font-medium">{count}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ------ Single alert card ------
function AlertCard({
  n, expanded, onToggle, onAction, index,
}: {
  n: Notification;
  expanded: boolean;
  onToggle: () => void;
  onAction: (id: string, intent: NotificationActionIntent) => void;
  index: number;
}) {
  const meta = CATEGORY_META[n.category];
  const sev = SEVERITY_META[n.severity];
  const Icon = meta.Icon;

  const statusLabel: Record<NotificationStatus, string> = {
    active: "Activa", acknowledged: "Reconocida", resolved: "Resuelta", muted: "Silenciada",
  };
  const statusTone: Record<NotificationStatus, "ok" | "warn" | "critical" | "neutral"> = {
    active: n.severity === "critical" ? "critical" : n.severity === "warn" ? "warn" : "neutral",
    acknowledged: "warn", resolved: "ok", muted: "neutral",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.32) }}
      className={cn(
        "rounded-xl border bg-surface-2 overflow-hidden transition-shadow",
        n.status === "resolved" && "opacity-55",
        n.severity === "critical" && n.status !== "resolved"
          ? "border-status-critical/40 shadow-[0_0_12px_-4px_rgba(217,83,79,0.25)]"
          : "border-line",
      )}
    >
      {/* Shimmer bar for critical active */}
      {n.severity === "critical" && n.status === "active" && (
        <div className="h-[3px] bg-gradient-to-r from-status-critical via-status-critical/70 to-status-critical relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-white/40 rounded-full"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      <button
        onClick={onToggle}
        className="w-full text-left p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3 active:bg-surface/60 transition-colors"
      >
        <div
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Mobile: condensed 2-line header */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium uppercase tracking-wide"
              style={{ backgroundColor: `${sev.color}20`, color: sev.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sev.color }} />
              {sev.label}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider hidden sm:inline" style={{ color: meta.color }}>
              {meta.label}
            </span>
            <Badge tone={statusTone[n.status]} className="text-[9px] sm:text-[10px]">{statusLabel[n.status]}</Badge>
            {n.confidence !== undefined && (
              <span className="text-[10px] text-ink-soft hidden sm:inline-flex items-center gap-1">
                <Brain className="h-3 w-3" /> {Math.round(n.confidence * 100)}%
              </span>
            )}
            <div className="flex-1" />
            <span className="text-[10px] sm:text-[11px] text-ink-soft tabular-nums flex-shrink-0">{relativeTime(n.ts)}</span>
          </div>
          <div className="mt-1 font-semibold text-[13px] sm:text-sm text-ink leading-tight line-clamp-2">{n.title}</div>
          <div className="text-[11px] sm:text-xs text-ink-soft mt-0.5 line-clamp-2">{n.body}</div>

          <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-ink-soft flex-wrap">
            {n.affectedCount !== undefined && (
              <span className="inline-flex items-center gap-1">
                <ActivityIcon className="h-3 w-3" /> {n.affectedCount} afectad{n.affectedCount === 1 ? "o" : "os"}
              </span>
            )}
            {n.estimatedImpactCRC !== undefined && n.estimatedImpactCRC !== 0 && (
              <span
                className="inline-flex items-center gap-1 font-medium"
                style={{ color: n.estimatedImpactCRC < 0 ? "#5BB37F" : "#E0A537" }}
              >
                <TrendingUp className="h-3 w-3" />
                {n.estimatedImpactCRC < 0 ? "−" : "+"}₡{Math.abs(n.estimatedImpactCRC).toLocaleString("es-CR")}
              </span>
            )}
            {n.source && <span className="hidden sm:inline">via <strong className="text-ink">{n.source}</strong></span>}
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-ink-soft mt-1"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-line space-y-3">
              {n.aiExplanation && (
                <div className="rounded-lg p-2.5 sm:p-3 border border-purple-500/20 bg-purple-500/5">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-purple-400">
                    <Brain className="h-3 w-3" /> Análisis IA
                    {n.confidence !== undefined && (
                      <span className="ml-auto text-ink-soft">
                        confianza {Math.round(n.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-ink mt-1 leading-relaxed">{n.aiExplanation}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[9px] sm:text-[10px] text-ink-soft uppercase">Detectado</div>
                  <div className="font-medium text-ink flex items-center gap-1 mt-0.5 text-[11px] sm:text-xs">
                    <Clock className="h-3 w-3 flex-shrink-0" /> {absoluteTime(n.ts)}
                  </div>
                </div>
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[9px] sm:text-[10px] text-ink-soft uppercase">Fuente</div>
                  <div className="font-medium text-ink capitalize mt-0.5 text-[11px] sm:text-xs">{n.source ?? "sistema"}</div>
                </div>
                {n.deviceId && (
                  <div className="rounded-lg bg-surface p-2">
                    <div className="text-[9px] sm:text-[10px] text-ink-soft uppercase">Dispositivo</div>
                    <div className="font-medium text-ink truncate mt-0.5 text-[11px] sm:text-xs">{n.deviceId}</div>
                  </div>
                )}
                {n.roomId && (
                  <div className="rounded-lg bg-surface p-2">
                    <div className="text-[9px] sm:text-[10px] text-ink-soft uppercase">Habitación</div>
                    <div className="font-medium text-ink truncate mt-0.5 text-[11px] sm:text-xs">{n.roomId}</div>
                  </div>
                )}
                {n.expiresAt && (
                  <div className="rounded-lg bg-surface p-2">
                    <div className="text-[9px] sm:text-[10px] text-ink-soft uppercase">Expira</div>
                    <div className="font-medium text-ink mt-0.5 text-[11px] sm:text-xs">{absoluteTime(n.expiresAt)}</div>
                  </div>
                )}
                {n.resolvedAt && (
                  <div className="rounded-lg bg-status-ok/10 p-2">
                    <div className="text-[9px] sm:text-[10px] text-status-ok uppercase">Resuelta</div>
                    <div className="font-medium text-status-ok mt-0.5 text-[11px] sm:text-xs">{absoluteTime(n.resolvedAt)}</div>
                  </div>
                )}
              </div>

              {n.suggestedActions && n.suggestedActions.length > 0 && n.status === "active" && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-soft mb-1.5">
                    Acciones sugeridas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {n.suggestedActions.map((a) => {
                      const info = INTENT_META[a.intent];
                      const AIcon = info.Icon;
                      return (
                        <motion.button
                          key={a.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={(e) => { e.stopPropagation(); onAction(n.id, a.intent); }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-2 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs border transition-all",
                            a.primary
                              ? "bg-navy text-cream border-navy hover:opacity-90 shadow-soft"
                              : "bg-surface text-ink border-line hover:bg-surface-2",
                          )}
                        >
                          <AIcon className="h-3.5 w-3.5" />
                          {a.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ------ Timeline grouping ------
function groupByTimeBucket(list: Notification[]): Array<{ bucket: string; items: Notification[] }> {
  const now = Date.now();
  const buckets: Record<string, Notification[]> = {
    "Última hora": [], "Hoy": [], "Ayer": [], "Anteriores": [],
  };
  list.forEach((n) => {
    const diffMin = (now - new Date(n.ts).getTime()) / 60000;
    if (diffMin < 60) buckets["Última hora"].push(n);
    else if (diffMin < 60 * 24) buckets["Hoy"].push(n);
    else if (diffMin < 60 * 48) buckets["Ayer"].push(n);
    else buckets["Anteriores"].push(n);
  });
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([bucket, items]) => ({ bucket, items }));
}

// ------ Map view: alertas por habitación ------
function AlertMapView({
  list, personaId, onFocusRoom,
}: {
  list: Notification[];
  personaId: string;
  onFocusRoom: (roomId: string) => void;
}) {
  const rooms = STATIC.rooms.filter((r) => r.personaId === personaId);
  const floors = STATIC.floors.filter((f) => f.personaId === personaId);

  // Group alerts by roomId
  const byRoom = new Map<string | "unassigned", Notification[]>();
  list.forEach((n) => {
    const key = n.roomId ?? "unassigned";
    const arr = byRoom.get(key) ?? [];
    arr.push(n);
    byRoom.set(key, arr);
  });

  const sevRank: Record<NotificationSeverity, number> = { critical: 0, warn: 1, info: 2 };
  const worst = (items: Notification[]): NotificationSeverity =>
    items.reduce<NotificationSeverity>(
      (acc, n) => (sevRank[n.severity] < sevRank[acc] ? n.severity : acc),
      "info",
    );

  const unassigned = byRoom.get("unassigned") ?? [];

  return (
    <div className="space-y-6">
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floorId === floor.id);
        if (floorRooms.length === 0) return null;
        const floorTotal = floorRooms.reduce((s, r) => s + (byRoom.get(r.id)?.length ?? 0), 0);
        return (
          <Card key={floor.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-ink-soft" /> {floor.name}
                </CardTitle>
                <span className="text-xs text-ink-soft">{floorTotal} alerta{floorTotal === 1 ? "" : "s"}</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {floorRooms.map((room) => {
                  const items = byRoom.get(room.id) ?? [];
                  const cnt = items.length;
                  const sev = cnt > 0 ? worst(items) : null;
                  const sevColor = sev ? SEVERITY_META[sev].color : "#3a3a3a";
                  const sevCounts = {
                    critical: items.filter((n) => n.severity === "critical").length,
                    warn: items.filter((n) => n.severity === "warn").length,
                    info: items.filter((n) => n.severity === "info").length,
                  };

                  // Top categories in this room
                  const catCounts = new Map<NotificationCategory, number>();
                  items.forEach((n) => catCounts.set(n.category, (catCounts.get(n.category) ?? 0) + 1));
                  const topCats = Array.from(catCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);

                  return (
                    <motion.button
                      key={room.id}
                      onClick={() => onFocusRoom(room.id)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      className="relative text-left rounded-xl border bg-surface-2 overflow-hidden p-3 transition"
                      style={{
                        borderColor: cnt > 0 ? `${sevColor}60` : undefined,
                        boxShadow: sev === "critical" ? `0 0 20px -6px ${sevColor}` : undefined,
                      }}
                    >
                      {sev === "critical" && (
                        <motion.div
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{ border: `1px solid ${sevColor}` }}
                          animate={{ opacity: [0.3, 0.9, 0.3] }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                        />
                      )}
                      <div className="relative">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs text-ink-soft">{room.zone ?? "indoor"}</div>
                            <div className="font-medium text-sm truncate">{room.name}</div>
                          </div>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 tabular-nums text-sm font-bold"
                            style={{
                              backgroundColor: cnt > 0 ? `${sevColor}22` : "var(--surface)",
                              color: cnt > 0 ? sevColor : "var(--ink-soft)",
                              border: `1px solid ${cnt > 0 ? sevColor + "40" : "var(--line)"}`,
                            }}
                          >
                            {cnt}
                          </div>
                        </div>

                        {cnt > 0 ? (
                          <>
                            {/* sev stripe */}
                            <div className="flex gap-0.5 mt-2 h-1 rounded-full overflow-hidden bg-line/40">
                              {sevCounts.critical > 0 && (
                                <div style={{ flex: sevCounts.critical, backgroundColor: "#D9534F" }} />
                              )}
                              {sevCounts.warn > 0 && (
                                <div style={{ flex: sevCounts.warn, backgroundColor: "#E0A537" }} />
                              )}
                              {sevCounts.info > 0 && (
                                <div style={{ flex: sevCounts.info, backgroundColor: "#5BB37F" }} />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {topCats.map(([cat, c]) => {
                                const meta = CATEGORY_META[cat];
                                const Icon = meta.Icon;
                                return (
                                  <span
                                    key={cat}
                                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${meta.color}18`,
                                      color: meta.color,
                                    }}
                                  >
                                    <Icon className="h-2.5 w-2.5" /> {c}
                                  </span>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-status-ok">
                            <CheckCircle2 className="h-3 w-3" /> Todo tranquilo
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        );
      })}

      {unassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <DoorOpen className="h-4 w-4 text-ink-soft" /> Sin habitación asignada
              <span className="text-xs text-ink-soft font-normal">({unassigned.length})</span>
            </CardTitle>
          </CardHeader>
          <CardBody className="text-xs text-ink-soft">
            Estas alertas son del sitio global (red, cuentas, IA sistémica).
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ------ Timeline view: 24h horizontal strip ------
function AlertTimelineView({ list }: { list: Notification[] }) {
  const now = Date.now();
  const WINDOW = 24 * 60 * 60 * 1000;
  const start = now - WINDOW;
  const items = list.filter((n) => new Date(n.ts).getTime() >= start);

  // 24 hour slots
  const slots = Array.from({ length: 24 }, (_, h) => {
    const from = start + h * 60 * 60 * 1000;
    const to = from + 60 * 60 * 1000;
    const bucket = items.filter((n) => {
      const t = new Date(n.ts).getTime();
      return t >= from && t < to;
    });
    return { h, from, to, items: bucket };
  });

  const maxBucket = Math.max(1, ...slots.map((s) => s.items.length));
  const severityAt = (slot: { items: Notification[] }): NotificationSeverity | null => {
    if (slot.items.some((n) => n.severity === "critical")) return "critical";
    if (slot.items.some((n) => n.severity === "warn")) return "warn";
    if (slot.items.length > 0) return "info";
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <LineChart className="h-4 w-4 text-ink-soft" /> Últimas 24 horas
          <span className="text-xs text-ink-soft font-normal tabular-nums">
            ({items.length} evento{items.length === 1 ? "" : "s"})
          </span>
        </CardTitle>
      </CardHeader>
      <CardBody>
        {/* Scrollable container on mobile */}
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <div className="flex items-end gap-[3px] sm:gap-1 h-32 sm:h-40 relative min-w-[480px] sm:min-w-0">
            <div className="absolute inset-x-0 bottom-0 h-px bg-line" />
            {slots.map((slot) => {
              const sev = severityAt(slot);
              const color = sev ? SEVERITY_META[sev].color : "#2a2a2a";
              const heightPct = (slot.items.length / maxBucket) * 100;
              const hourLabel = new Date(slot.from).toLocaleTimeString("es-CR", { hour: "2-digit", hour12: false });
              return (
                <div key={slot.h} className="group flex-1 flex flex-col items-center justify-end relative h-full">
                  {slot.items.length > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(8, heightPct)}%` }}
                      transition={{ duration: 0.5, delay: slot.h * 0.02, ease: "easeOut" }}
                      className="w-full rounded-t-sm sm:rounded-t relative cursor-help"
                      style={{ backgroundColor: `${color}aa`, border: `1px solid ${color}` }}
                    >
                      {sev === "critical" && (
                        <motion.div
                          className="absolute inset-0 rounded-t-sm sm:rounded-t"
                          style={{ border: `1px solid ${color}` }}
                          animate={{ opacity: [0.2, 0.9, 0.2] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                        />
                      )}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 bg-surface-2 border border-line rounded-lg px-2 py-1.5 shadow-elev text-[10px] whitespace-nowrap">
                        <div className="font-medium">{hourLabel}h · {slot.items.length} alerta{slot.items.length === 1 ? "" : "s"}</div>
                        {slot.items.slice(0, 3).map((n) => (
                          <div key={n.id} className="text-ink-soft truncate max-w-[180px]">
                            • {n.title}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {slot.h % 3 === 0 && (
                    <div className="absolute -bottom-4 text-[8px] sm:text-[9px] text-ink-soft tabular-nums">
                      {hourLabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6 text-[10px] text-ink-soft">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-critical" /> Crítico
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-warn" /> Aviso
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-ok" /> Info
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

// ------ PAGE ------
export default function AlertsPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const persona = selectActivePersona(personaId);
  const seeded = selectNotificationsByPersona(personaId);

  // Local overrides for demo interactivity (no persistence)
  const [overrides, setOverrides] = useState<Record<string, NotificationStatus>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<NotificationCategory | "all">("all");
  const [filterSev, setFilterSev] = useState<NotificationSeverity | "all">("all");
  const [showResolved, setShowResolved] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"feed" | "map" | "timeline">("feed");

  const notifications = useMemo<Notification[]>(() => {
    return seeded.map((n) => ({
      ...n,
      status: overrides[n.id] ?? n.status,
    }));
  }, [seeded, overrides]);

  const filtered = useMemo(() => {
    let out = notifications;
    if (!showResolved) out = out.filter((n) => n.status !== "resolved" && n.status !== "muted");
    if (filterCat !== "all") out = out.filter((n) => n.category === filterCat);
    if (filterSev !== "all") out = out.filter((n) => n.severity === filterSev);
    if (search) {
      const q = search.toLowerCase();
      out = out.filter((n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (n.aiExplanation?.toLowerCase().includes(q) ?? false),
      );
    }
    // Sort: critical first, then warn, then info; then by time desc
    const sevRank = { critical: 0, warn: 1, info: 2 };
    return [...out].sort((a, b) =>
      (sevRank[a.severity] - sevRank[b.severity]) ||
      (new Date(b.ts).getTime() - new Date(a.ts).getTime()),
    );
  }, [notifications, filterCat, filterSev, showResolved, search]);

  const groups = useMemo(() => groupByTimeBucket(filtered), [filtered]);

  const applyAction = (id: string, intent: NotificationActionIntent) => {
    const n = notifications.find((x) => x.id === id);
    if (intent === "ack") {
      setOverrides((p) => ({ ...p, [id]: "acknowledged" }));
      if (n) toast.info(`Reconocida: ${n.title}`, "Ahora aparece en modo seguimiento.", { icon: "Check", duration: 3000 });
    } else if (intent === "resolve") {
      setOverrides((p) => ({ ...p, [id]: "resolved" }));
      if (n) toast.success(`Resuelta: ${n.title}`, "Movida al historial de alertas.", { icon: "Check", duration: 3000 });
    } else if (intent === "mute") {
      setOverrides((p) => ({ ...p, [id]: "muted" }));
      if (n) toast.warn(`Silenciada: ${n.title}`, "No recibirás avisos durante 24 h.", { icon: "Bell", duration: 3000 });
    } else {
      setOverrides((p) => ({ ...p, [id]: "acknowledged" }));
      if (n) toast.ai(`Ejecutando acción`, `${n.title}`, { icon: "Sparkles", duration: 2500 });
    }
  };

  const resolveAllCritical = () => {
    let count = 0;
    setOverrides((p) => {
      const out = { ...p };
      notifications.forEach((n) => {
        if (n.severity === "critical" && n.status === "active") {
          out[n.id] = "acknowledged";
          count++;
        }
      });
      return out;
    });
    if (count > 0) {
      toast.success(`${count} alerta${count === 1 ? "" : "s"} crítica${count === 1 ? "" : "s"} reconocida${count === 1 ? "" : "s"}`, undefined, { icon: "Shield", duration: 3000 });
    } else {
      toast.info("No hay alertas críticas activas", undefined, { icon: "Check", duration: 2000 });
    }
  };

  /** Demo-only: inyectar una alerta simulada como toast */
  const simulateIncomingAlert = () => {
    const samples = [
      { tone: "critical" as const, title: "Movimiento sin reconocer", body: "Cámara jardín detectó presencia a las 02:14 AM.", icon: "Shield" as const },
      { tone: "warn" as const, title: "Consumo atípico en cocina", body: "Horno lleva 47 min encendido fuera de horario.", icon: "Zap" as const },
      { tone: "ai" as const, title: "Sugerencia Nexus", body: "Activar 'Modo noche' ahorrará ~₡1.200 mañana.", icon: "Brain" as const },
      { tone: "info" as const, title: "Bridge Zigbee reconectado", body: "Latencia estabilizada en 38 ms.", icon: "Wifi" as const },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    const { tone, ...rest } = pick;
    toast[tone](rest.title, rest.body, { icon: rest.icon, duration: tone === "critical" ? 6500 : 4500 });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AlertHero list={notifications} onSimulate={simulateIncomingAlert} />

      {/* Controls — responsive layout */}
      <Card>
        <CardBody className="space-y-3 p-3 sm:p-4">
          {/* Row 1: Search + severity filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar alertas…"
                className="text-sm w-full pl-8 pr-8 py-2 sm:py-1.5 rounded-xl sm:rounded-lg border border-line bg-surface focus:outline-none focus:ring-2 focus:ring-navy/30 transition-shadow"
              />
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  title="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-surface-2 transition"
                >
                  <X className="h-3.5 w-3.5 text-ink-soft" />
                </button>
              )}
            </div>

            {/* Severity pills — horizontally scrollable on mobile */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
              {(["all","critical","warn","info"] as const).map((s) => {
                const active = filterSev === s;
                return (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setFilterSev(s)}
                    className={cn(
                      "relative px-3 py-2 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-md text-[11px] sm:text-xs border transition-all flex-shrink-0 capitalize",
                      active
                        ? "bg-navy text-cream border-navy shadow-soft"
                        : "border-line text-ink-soft hover:bg-surface-2",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sev-pill"
                        className="absolute inset-0 rounded-lg sm:rounded-md bg-navy border border-navy"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">
                      {s === "all" ? "Todas" : SEVERITY_META[s].label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Row 2: View mode + actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* View mode toggle with animated pill */}
              <div className="relative flex items-center gap-0.5 p-0.5 rounded-xl sm:rounded-lg border border-line bg-surface-2">
                {([
                  { id: "feed",     Icon: List,     label: "Feed" },
                  { id: "map",      Icon: MapIcon,  label: "Mapa" },
                  { id: "timeline", Icon: LineChart, label: "Timeline" },
                ] as const).map((v) => {
                  const isActive = viewMode === v.id;
                  const VIcon = v.Icon;
                  return (
                    <motion.button
                      key={v.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode(v.id)}
                      className={cn(
                        "relative flex items-center gap-1 text-[11px] sm:text-xs px-3 py-2 sm:px-2.5 sm:py-1 rounded-lg sm:rounded transition-colors z-10",
                        isActive ? "text-cream" : "text-ink-soft hover:text-ink",
                      )}
                      title={v.label}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="view-pill"
                          className="absolute inset-0 rounded-lg sm:rounded bg-navy"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <VIcon className="relative z-10 h-3.5 w-3.5" />
                      <span className="relative z-10 hidden sm:inline">{v.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Show resolved toggle */}
              <label className="hidden sm:flex items-center gap-1.5 text-xs text-ink-soft cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showResolved}
                  onChange={(e) => setShowResolved(e.target.checked)}
                  className="rounded border-line"
                />
                Resueltas
              </label>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={resolveAllCritical}
                className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-3 sm:px-3 py-2 sm:py-1.5 rounded-lg bg-status-critical/10 text-status-critical border border-status-critical/30 hover:bg-status-critical/20 transition"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reconocer críticas</span>
                <span className="sm:hidden">Críticas</span>
              </motion.button>
              <Link
                href="/health"
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-line text-ink-soft hover:bg-surface-2 transition"
              >
                <ActivityIcon className="h-3.5 w-3.5" /> Salud
              </Link>
            </div>
          </div>

          {/* Mobile: show resolved toggle */}
          <div className="flex sm:hidden items-center justify-between">
            <label className="flex items-center gap-1.5 text-[11px] text-ink-soft cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-line w-3.5 h-3.5"
              />
              Incluir resueltas/silenciadas
            </label>
            <span className="text-[10px] text-ink-soft tabular-nums">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <CategoryStrip list={notifications} activeCategory={filterCat} onPick={setFilterCat} />
        </CardBody>
      </Card>

      {/* Body — animated view transitions */}
      <AnimatePresence mode="wait">
        {viewMode === "timeline" ? (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <AlertTimelineView list={filtered} />
          </motion.div>
        ) : viewMode === "map" ? (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <AlertMapView
              list={filtered}
              personaId={personaId}
              onFocusRoom={(roomId) => {
                setSearch("");
                const room = STATIC.rooms.find((r) => r.id === roomId);
                if (room) {
                  toast.info(`Filtrando alertas: ${room.name}`, undefined, { icon: "Info", duration: 2000 });
                  setSearch(room.name);
                }
                setViewMode("feed");
              }}
            />
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardBody>
                <div className="text-center py-8 sm:py-10 text-ink-soft">
                  <motion.div
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <Inbox className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-3 text-status-ok/60" strokeWidth={1.2} />
                  </motion.div>
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <div className="text-base font-medium text-ink">Sin alertas en esta vista</div>
                    <div className="text-sm mt-1 max-w-xs mx-auto">
                      {search || filterCat !== "all" || filterSev !== "all"
                        ? "Ajusta los filtros para ver más resultados."
                        : `Todo está en orden para "${persona.name}".`}
                    </div>
                  </motion.div>
                  {(search || filterCat !== "all" || filterSev !== "all") && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSearch(""); setFilterCat("all"); setFilterSev("all"); }}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-navy/10 text-navy hover:bg-navy/20 transition border border-navy/20"
                    >
                      <X className="h-3 w-3" /> Limpiar filtros
                    </motion.button>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-5 sm:space-y-6"
          >
            {groups.map(({ bucket, items }) => (
              <div key={bucket}>
                <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                  <Clock className="h-3.5 w-3.5 text-ink-soft" />
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-ink-soft font-medium">
                    {bucket}
                  </span>
                  <span className="text-[10px] sm:text-xs text-ink-soft tabular-nums">({items.length})</span>
                  <div className="flex-1 h-px bg-line" />
                </div>
                <div className="space-y-2">
                  {items.map((n, i) => (
                    <SwipeableAlertCard
                      key={n.id}
                      n={n}
                      onAction={applyAction}
                    >
                      <AlertCard
                        n={n}
                        expanded={expandedId === n.id}
                        onToggle={() => setExpandedId((p) => (p === n.id ? null : n.id))}
                        onAction={applyAction}
                        index={i}
                      />
                    </SwipeableAlertCard>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer hint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-gold-border" /> ¿Cómo se generan las alertas?
          </CardTitle>
        </CardHeader>
        <CardBody className="text-[11px] sm:text-xs text-ink-soft space-y-2">
          <p>
            Nexus combina tres capas para producir alertas accionables:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-ink">Sensores</strong> (cámaras, movimiento, apertura, humo, gas, humedad) emiten eventos en tiempo real vía MQTT/Zigbee/Z-Wave.</li>
            <li><strong className="text-ink">Reglas determinísticas</strong> evalúan umbrales y patrones simples (batería &lt;15%, puerta &gt;3 min, latencia &gt;1s).</li>
            <li><strong className="text-ink">Motor IA</strong> detecta anomalías (consumo atípico, patrones nocturnos, correlaciones multi-sensor) y propone acciones con confianza estimada.</li>
          </ul>
          <p>
            Cada alerta expone: severidad, categoría, explicación narrativa, evidencia (dispositivos/sensores), impacto económico estimado y acciones sugeridas con intent tipado.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
