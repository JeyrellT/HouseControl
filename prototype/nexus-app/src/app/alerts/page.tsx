"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  useNexus, selectNotificationsByPersona, selectActivePersona,
} from "@/lib/store";
import { STATIC } from "@/lib/store";
import { toast } from "@/lib/toast-store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type {
  Notification, NotificationCategory, NotificationSeverity, NotificationStatus,
  NotificationActionIntent,
} from "@/lib/types";
import {
  Bell, Shield, Zap, Wrench, Wifi, Thermometer, Sparkles, UserPlus, Flame, Brain,
  Check, VolumeX, CheckCircle2, ChevronDown, AlertTriangle, Clock, Filter,
  Siren, Activity as ActivityIcon, TrendingUp, PlayCircle, ExternalLink,
  List, Map as MapIcon, LineChart, Home, DoorOpen,
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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-line bg-gradient-to-br from-navy via-navy-soft to-navy overflow-hidden"
    >
      {/* ambient glow */}
      <motion.div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: riskColor }}
        animate={risk >= 60 ? { opacity: [0.3, 0.55, 0.3] } : undefined}
        transition={risk >= 60 ? { duration: 2.5, repeat: Infinity } : undefined}
        aria-hidden
      />
      {/* animated scan line */}
      {risk >= 30 && (
        <motion.div
          className="absolute inset-x-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${riskColor}60, transparent)` }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
      )}

      <div className="relative p-6 flex flex-col md:flex-row items-stretch gap-6">
        {/* Left: title + stats */}
        <div className="flex-1 min-w-0">
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
                  <span className="text-xl font-bold tabular-nums" style={{ color: meta.color }}>
                    {count}
                  </span>
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

        {/* Right: radial risk gauge */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <div className="relative w-[140px] h-[140px]">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={riskColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={riskColor} stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {/* track */}
              <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              {/* progress */}
              <motion.circle
                cx="70" cy="70" r={R} fill="none"
                stroke="url(#riskGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: CIRC - dash }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
              {/* tick marks every 10% */}
              {Array.from({ length: 20 }).map((_, i) => {
                const a = (i / 20) * 2 * Math.PI;
                const rx1 = 70 + Math.cos(a) * (R - 14);
                const ry1 = 70 + Math.sin(a) * (R - 14);
                const rx2 = 70 + Math.cos(a) * (R - 18);
                const ry2 = 70 + Math.sin(a) * (R - 18);
                return (
                  <line
                    key={i}
                    x1={rx1} y1={ry1} x2={rx2} y2={ry2}
                    stroke="rgba(255,255,255,0.15)" strokeWidth="1"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                key={risk}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 250, damping: 18 }}
                className="font-display text-3xl tabular-nums leading-none"
                style={{ color: riskColor }}
              >
                {risk}
              </motion.div>
              <div className="text-[9px] uppercase tracking-widest text-cream/60 mt-1">Risk Index</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live ticker */}
      {ticker.length > 0 && (
        <div className="relative border-t border-cream/10 bg-black/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] uppercase tracking-widest text-cream/60">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-status-ok"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            Live feed
          </div>
          <div className="relative overflow-hidden py-1.5 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <motion.div
              className="flex gap-6 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: Math.max(18, ticker.length * 4), repeat: Infinity, ease: "linear" }}
            >
              {[...ticker, ...ticker].map((n, i) => {
                const meta = CATEGORY_META[n.category];
                const sev = SEVERITY_META[n.severity];
                const Icon = meta.Icon;
                return (
                  <div key={`${n.id}-${i}`} className="flex items-center gap-2 text-[11px] text-cream/80">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sev.color }} />
                    <Icon className="h-3 w-3" style={{ color: meta.color }} />
                    <span className="text-cream">{n.title}</span>
                    <span className="text-cream/50">· {relativeTime(n.ts)}</span>
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
      <div className="flex h-3 rounded-full overflow-hidden border border-line">
        {counts.map(({ c, count }, i) => {
          const meta = CATEGORY_META[c];
          const pct = (count / total) * 100;
          return (
            <motion.button
              key={c}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              onClick={() => onPick(c === activeCategory ? "all" : c)}
              style={{ backgroundColor: meta.color }}
              className="relative group cursor-pointer hover:opacity-80"
              title={`${meta.label}: ${count}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onPick("all")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition ${
            activeCategory === "all"
              ? "bg-navy text-cream border-navy"
              : "bg-surface border-line text-ink-soft hover:bg-surface-2"
          }`}
        >
          <Filter className="h-3 w-3" /> Todas ({total})
        </button>
        {counts.map(({ c, count }) => {
          const meta = CATEGORY_META[c];
          const Icon = meta.Icon;
          const on = activeCategory === c;
          return (
            <button
              key={c}
              onClick={() => onPick(c === activeCategory ? "all" : c)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition ${
                on ? "text-white" : "text-ink-soft hover:bg-surface-2"
              }`}
              style={on
                ? { backgroundColor: meta.color, borderColor: meta.color }
                : { borderColor: `${meta.color}50`, backgroundColor: `${meta.color}10` }
              }
            >
              <Icon className="h-3 w-3" style={on ? undefined : { color: meta.color }} />
              {meta.label}
              <span className="tabular-nums">{count}</span>
            </button>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className={`rounded-xl border bg-surface-2 overflow-hidden ${
        n.status === "resolved" ? "opacity-60" :
        n.severity === "critical" ? "border-status-critical/40 shadow-[0_0_0_1px_rgba(217,83,79,0.15)]" :
        "border-line"
      }`}
    >
      {/* Pulsing border for critical active */}
      {n.severity === "critical" && n.status === "active" && (
        <div className="h-1 bg-gradient-to-r from-status-critical via-status-critical/70 to-status-critical relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-white/40"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      <button onClick={onToggle} className="w-full text-left p-4 flex items-start gap-3 hover:bg-surface transition">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide"
              style={{ backgroundColor: `${sev.color}20`, color: sev.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sev.color }} />
              {sev.label}
            </span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </span>
            <Badge tone={statusTone[n.status]} className="text-[10px]">{statusLabel[n.status]}</Badge>
            {n.confidence !== undefined && (
              <span className="text-[10px] text-ink-soft inline-flex items-center gap-1">
                <Brain className="h-3 w-3" /> {Math.round(n.confidence * 100)}%
              </span>
            )}
            <div className="flex-1" />
            <span className="text-[11px] text-ink-soft tabular-nums">{relativeTime(n.ts)}</span>
          </div>
          <div className="mt-1 font-semibold text-sm text-ink">{n.title}</div>
          <div className="text-xs text-ink-soft mt-0.5">{n.body}</div>

          <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-soft flex-wrap">
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
                {n.estimatedImpactCRC < 0 ? "ahorro " : "costo "}
                ₡{Math.abs(n.estimatedImpactCRC).toLocaleString("es-CR")}
              </span>
            )}
            {n.source && <span>via <strong className="text-ink">{n.source}</strong></span>}
            {n.acknowledgedBy && (
              <span className="text-status-warn">Reconocido por {n.acknowledgedBy}</span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-ink-soft"
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
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-line space-y-3">
              {n.aiExplanation && (
                <div className={`rounded-lg p-3 border border-purple-500/20 ${"bg-purple-500/5"}`}>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-purple-400">
                    <Brain className="h-3 w-3" /> Análisis IA
                    {n.confidence !== undefined && (
                      <span className="ml-auto text-ink-soft">
                        confianza {Math.round(n.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink mt-1 leading-relaxed">{n.aiExplanation}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[10px] text-ink-soft uppercase">Detectado</div>
                  <div className="font-medium text-ink flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {absoluteTime(n.ts)}
                  </div>
                </div>
                <div className="rounded-lg bg-surface p-2">
                  <div className="text-[10px] text-ink-soft uppercase">Fuente</div>
                  <div className="font-medium text-ink capitalize mt-0.5">{n.source ?? "sistema"}</div>
                </div>
                {n.deviceId && (
                  <div className="rounded-lg bg-surface p-2">
                    <div className="text-[10px] text-ink-soft uppercase">Dispositivo</div>
                    <div className="font-medium text-ink truncate mt-0.5">{n.deviceId}</div>
                  </div>
                )}
                {n.roomId && (
                  <div className="rounded-lg bg-surface p-2">
                    <div className="text-[10px] text-ink-soft uppercase">Habitación</div>
                    <div className="font-medium text-ink truncate mt-0.5">{n.roomId}</div>
                  </div>
                )}
                {n.expiresAt && (
                  <div className="rounded-lg bg-surface p-2">
                    <div className="text-[10px] text-ink-soft uppercase">Expira</div>
                    <div className="font-medium text-ink mt-0.5">{absoluteTime(n.expiresAt)}</div>
                  </div>
                )}
                {n.resolvedAt && (
                  <div className="rounded-lg bg-status-ok/10 p-2">
                    <div className="text-[10px] text-status-ok uppercase">Resuelta</div>
                    <div className="font-medium text-status-ok mt-0.5">{absoluteTime(n.resolvedAt)}</div>
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
                      const Icon = info.Icon;
                      return (
                        <button
                          key={a.id}
                          onClick={(e) => { e.stopPropagation(); onAction(n.id, a.intent); }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition ${
                            a.primary
                              ? "bg-navy text-cream border-navy hover:opacity-90"
                              : "bg-surface text-ink border-line hover:bg-surface-2"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {a.label}
                        </button>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
          <span className="text-xs text-ink-soft font-normal">
            ({items.length} evento{items.length === 1 ? "" : "s"})
          </span>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex items-end gap-1 h-40 relative">
          {/* y-axis baseline */}
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
                    animate={{ height: `${Math.max(6, heightPct)}%` }}
                    transition={{ duration: 0.6, delay: slot.h * 0.02, ease: "easeOut" }}
                    className="w-full rounded-t relative cursor-help"
                    style={{ backgroundColor: `${color}aa`, border: `1px solid ${color}` }}
                  >
                    {sev === "critical" && (
                      <motion.div
                        className="absolute inset-0 rounded-t"
                        style={{ border: `1px solid ${color}` }}
                        animate={{ opacity: [0.2, 0.9, 0.2] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      />
                    )}
                    {/* tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 bg-surface-2 border border-line rounded-md px-2 py-1 shadow-elev text-[10px] whitespace-nowrap">
                      <div className="font-medium">{hourLabel}h · {slot.items.length} alerta{slot.items.length === 1 ? "" : "s"}</div>
                      {slot.items.slice(0, 3).map((n) => (
                        <div key={n.id} className="text-ink-soft truncate max-w-[200px]">
                          • {n.title}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {slot.h % 3 === 0 && (
                  <div className="absolute -bottom-4 text-[9px] text-ink-soft">
                    {hourLabel}
                  </div>
                )}
              </div>
            );
          })}
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
    <div className="space-y-6">
      <AlertHero list={notifications} onSimulate={simulateIncomingAlert} />

      {/* Controls */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar alertas…"
                  className="text-sm pl-8 pr-3 py-1.5 rounded-lg border border-line bg-surface focus:outline-none focus:ring-2 focus:ring-navy/30 w-60"
                />
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
              </div>
              <div className="flex items-center gap-1 text-xs">
                {(["all","critical","warn","info"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterSev(s)}
                    className={`px-2.5 py-1 rounded-md border transition capitalize ${
                      filterSev === s
                        ? "bg-navy text-cream border-navy"
                        : "border-line text-ink-soft hover:bg-surface-2"
                    }`}
                  >
                    {s === "all" ? "Todas" : SEVERITY_META[s].label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-xs text-ink-soft cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showResolved}
                  onChange={(e) => setShowResolved(e.target.checked)}
                  className="rounded border-line"
                />
                Incluir resueltas/silenciadas
              </label>
            </div>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-line bg-surface-2">
                {([
                  { id: "feed",     Icon: List,     label: "Feed" },
                  { id: "map",      Icon: MapIcon,  label: "Mapa" },
                  { id: "timeline", Icon: LineChart,label: "Timeline" },
                ] as const).map((v) => {
                  const active = viewMode === v.id;
                  const Icon = v.Icon;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setViewMode(v.id)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${
                        active
                          ? "bg-navy text-cream"
                          : "text-ink-soft hover:bg-surface"
                      }`}
                      title={v.label}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{v.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={resolveAllCritical}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-status-critical/10 text-status-critical border border-status-critical/30 hover:bg-status-critical/20 transition"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Reconocer críticas
              </button>
              <Link
                href="/health"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-line text-ink-soft hover:bg-surface-2"
              >
                <ActivityIcon className="h-3.5 w-3.5" /> Salud
              </Link>
            </div>
          </div>
          <CategoryStrip list={notifications} activeCategory={filterCat} onPick={setFilterCat} />
        </CardBody>
      </Card>

      {/* Body renders per viewMode */}
      {viewMode === "timeline" ? (
        <AlertTimelineView list={filtered} />
      ) : viewMode === "map" ? (
        <AlertMapView
          list={filtered}
          personaId={personaId}
          onFocusRoom={(roomId) => {
            // Filter feed to that room and jump back to feed view
            setSearch("");
            const room = STATIC.rooms.find((r) => r.id === roomId);
            if (room) {
              toast.info(`Filtrando alertas: ${room.name}`, undefined, { icon: "Info", duration: 2000 });
              setSearch(room.name);
            }
            setViewMode("feed");
          }}
        />
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-10 text-ink-soft">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-status-ok" />
              <div className="text-base font-medium text-ink">Sin alertas en esta vista</div>
              <div className="text-sm mt-1">
                {search || filterCat !== "all" || filterSev !== "all"
                  ? "Ajusta los filtros para ver más resultados."
                  : "Todo está en orden para la persona '" + persona.name + "'."}
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(({ bucket, items }) => (
            <div key={bucket}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-ink-soft" />
                <span className="text-xs uppercase tracking-widest text-ink-soft font-medium">
                  {bucket}
                </span>
                <span className="text-xs text-ink-soft">({items.length})</span>
                <div className="flex-1 h-px bg-line" />
              </div>
              <div className="space-y-2">
                {items.map((n, i) => (
                  <AlertCard
                    key={n.id}
                    n={n}
                    expanded={expandedId === n.id}
                    onToggle={() => setExpandedId((p) => (p === n.id ? null : n.id))}
                    onAction={applyAction}
                    index={i}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer hint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-gold-border" /> ¿Cómo se generan las alertas?
          </CardTitle>
        </CardHeader>
        <CardBody className="text-xs text-ink-soft space-y-2">
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
