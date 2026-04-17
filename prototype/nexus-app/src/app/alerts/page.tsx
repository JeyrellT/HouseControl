"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  useNexus, selectNotificationsByPersona, selectActivePersona,
} from "@/lib/store";
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

// ------ Hero summary ------
function AlertHero({ list }: { list: Notification[] }) {
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

  const pulse = counts.critical > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-line bg-gradient-to-br from-navy via-navy-soft to-navy p-6 overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-30 ${
        pulse ? "bg-status-critical" : counts.warn > 0 ? "bg-status-warn" : "bg-status-ok"
      }`} />
      <div className="relative flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-cream/60 text-xs uppercase tracking-widest">
            <Siren className="h-3 w-3" /> Centro de Alertas
          </div>
          <h1 className="font-display text-3xl text-cream mt-1">
            {counts.critical > 0 ? "Atención requerida" : counts.warn > 0 ? "Operación estable con avisos" : "Todo bajo control"}
          </h1>
          <p className="text-cream/70 text-sm mt-1 max-w-xl">
            {active.length} alertas activas · {resolvedHoy} resueltas hoy · costo potencial evitable ₡{estimatedCost.toLocaleString("es-CR")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(["critical","warn","info"] as NotificationSeverity[]).map((sev) => {
            const meta = SEVERITY_META[sev];
            const count = counts[sev];
            return (
              <motion.div
                key={sev}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: sev === "critical" ? 0 : sev === "warn" ? 0.1 : 0.2 }}
                className="relative rounded-xl px-4 py-3 min-w-[92px] text-center"
                style={{
                  backgroundColor: `${meta.color}1a`,
                  border: `1px solid ${meta.color}60`,
                }}
              >
                {sev === "critical" && count > 0 && (
                  <motion.span
                    className="absolute inset-0 rounded-xl"
                    style={{ border: `2px solid ${meta.color}` }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className="relative">
                  <div className="text-2xl font-bold tabular-nums" style={{ color: meta.color }}>
                    {count}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-cream/70">{meta.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
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
    if (intent === "ack") setOverrides((p) => ({ ...p, [id]: "acknowledged" }));
    else if (intent === "resolve") setOverrides((p) => ({ ...p, [id]: "resolved" }));
    else if (intent === "mute") setOverrides((p) => ({ ...p, [id]: "muted" }));
    // other intents are navigation; treat as ack for demo
    else setOverrides((p) => ({ ...p, [id]: "acknowledged" }));
  };

  const resolveAllCritical = () => {
    setOverrides((p) => {
      const out = { ...p };
      notifications.forEach((n) => {
        if (n.severity === "critical" && n.status === "active") out[n.id] = "acknowledged";
      });
      return out;
    });
  };

  return (
    <div className="space-y-6">
      <AlertHero list={notifications} />

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
              <button
                onClick={resolveAllCritical}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-status-critical/10 text-status-critical border border-status-critical/30 hover:bg-status-critical/20 transition"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Reconocer todas las críticas
              </button>
              <Link
                href="/health"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-line text-ink-soft hover:bg-surface-2"
              >
                <ActivityIcon className="h-3.5 w-3.5" /> Ver salud
              </Link>
            </div>
          </div>
          <CategoryStrip list={notifications} activeCategory={filterCat} onPick={setFilterCat} />
        </CardBody>
      </Card>

      {/* Alerts list grouped by time */}
      {filtered.length === 0 ? (
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
