"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNexus, selectActivityByPersona } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { analyzeAudit, type AuditInsight } from "@/lib/gemini";
import type { ActivityEvent } from "@/lib/types";
import {
  Search, Download, User, Cpu, Cog, Mic, LineChart as LineChartIcon,
  ChevronDown, ChevronUp, Brain, Loader2, Sparkles, Send, MessageCircle,
  ShieldAlert, AlertTriangle, Info, ArrowRight, X, Clock, Activity,
  Filter, CheckCircle2,
} from "lucide-react";

/* ── Constants ─────────────────────────────────────────────── */

type ActorKey = "user" | "system" | "rule" | "voice";
type SeverityKey = "info" | "warn" | "critical";

const ACTOR_META: Record<ActorKey, { Icon: typeof User; label: string; color: string }> = {
  user:   { Icon: User, label: "Usuario", color: "#5BB37F" },
  system: { Icon: Cpu,  label: "Sistema", color: "#7B93DB" },
  rule:   { Icon: Cog,  label: "Regla",   color: "#E0A537" },
  voice:  { Icon: Mic,  label: "Voz",     color: "#C084FC" },
};

const SEVERITY_META: Record<SeverityKey, { color: string; label: string; tone: "ok" | "warn" | "critical" }> = {
  info:     { color: "#5BB37F", label: "Info",    tone: "ok" },
  warn:     { color: "#E0A537", label: "Aviso",   tone: "warn" },
  critical: { color: "#D9534F", label: "Crítico", tone: "critical" },
};

const OUTCOME_META: Record<string, { label: string; tone: "ok" | "warn" | "critical" }> = {
  success: { label: "Éxito",    tone: "ok" },
  failure: { label: "Fallo",    tone: "critical" },
  pending: { label: "Pendiente", tone: "warn" },
};

/* ── AnimatedNumber ────────────────────────────────────────── */

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

/* ── Timeline visual (24h) ─────────────────────────────────── */

function AuditTimeline({
  items,
  onSlotClick,
  activeSlot,
}: {
  items: ActivityEvent[];
  onSlotClick: (slotH: number | null) => void;
  activeSlot: number | null;
}) {
  const now = Date.now();
  const WINDOW = 24 * 60 * 60 * 1000;
  const start = now - WINDOW;
  const recent = items.filter((e) => new Date(e.ts).getTime() >= start);

  const slots = Array.from({ length: 24 }, (_, h) => {
    const from = start + h * 60 * 60 * 1000;
    const to = from + 60 * 60 * 1000;
    const bucket = recent.filter((e) => {
      const t = new Date(e.ts).getTime();
      return t >= from && t < to;
    });
    return { h, from, bucket };
  });

  const maxBucket = Math.max(1, ...slots.map((s) => s.bucket.length));

  const worstSeverity = (bucket: ActivityEvent[]): SeverityKey | null => {
    if (bucket.some((e) => e.severity === "critical")) return "critical";
    if (bucket.some((e) => e.severity === "warn")) return "warn";
    if (bucket.length > 0) return "info";
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <LineChartIcon className="h-4 w-4 text-ink-soft" /> Actividad 24h
          <span className="text-xs text-ink-soft font-normal tabular-nums">
            ({recent.length} evento{recent.length === 1 ? "" : "s"})
          </span>
          {activeSlot !== null && (
            <button
              onClick={() => onSlotClick(null)}
              className="ml-auto text-[10px] text-ink-soft hover:text-ink flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Quitar filtro
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <div className="flex items-end gap-[3px] sm:gap-1 h-28 sm:h-36 relative min-w-[480px] sm:min-w-0">
            <div className="absolute inset-x-0 bottom-0 h-px bg-line" />
            {slots.map((slot) => {
              const sev = worstSeverity(slot.bucket);
              const color = sev ? SEVERITY_META[sev].color : "#2a2a2a";
              const heightPct = (slot.bucket.length / maxBucket) * 100;
              const hourLabel = new Date(slot.from).toLocaleTimeString("es-CR", { hour: "2-digit", hour12: false });
              const isActive = activeSlot === slot.h;

              return (
                <div
                  key={slot.h}
                  className="group flex-1 flex flex-col items-center justify-end relative h-full cursor-pointer"
                  onClick={() => onSlotClick(isActive ? null : slot.h)}
                >
                  {slot.bucket.length > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(8, heightPct)}%` }}
                      transition={{ duration: 0.5, delay: slot.h * 0.02, ease: "easeOut" }}
                      className={cn(
                        "w-full rounded-t-sm sm:rounded-t relative",
                        isActive && "ring-2 ring-gold-border ring-offset-1 ring-offset-surface-2",
                      )}
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
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 bg-surface-2 border border-line rounded-lg px-2 py-1.5 shadow-elev text-[10px] whitespace-nowrap">
                        <div className="font-medium">{hourLabel}h · {slot.bucket.length} evento{slot.bucket.length === 1 ? "" : "s"}</div>
                        {slot.bucket.slice(0, 3).map((e) => (
                          <div key={e.id} className="text-ink-soft truncate max-w-[180px]">• {e.summary}</div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {slot.h % 3 === 0 && (
                    <div className="absolute -bottom-4 text-[8px] sm:text-[9px] text-ink-soft tabular-nums">{hourLabel}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6 text-[10px] text-ink-soft">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-critical" /> Crítico</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-warn" /> Aviso</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-ok" /> Info</span>
        </div>
      </CardBody>
    </Card>
  );
}

/* ── Time bucket grouping ──────────────────────────────────── */

function groupByTimeBucket(list: ActivityEvent[]): Array<{ bucket: string; items: ActivityEvent[] }> {
  const now = Date.now();
  const buckets: Record<string, ActivityEvent[]> = {
    "Última hora": [], "Hoy": [], "Ayer": [], "Anteriores": [],
  };
  list.forEach((e) => {
    const diffMin = (now - new Date(e.ts).getTime()) / 60000;
    if (diffMin < 60) buckets["Última hora"].push(e);
    else if (diffMin < 60 * 24) buckets["Hoy"].push(e);
    else if (diffMin < 60 * 48) buckets["Ayer"].push(e);
    else buckets["Anteriores"].push(e);
  });
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([bucket, items]) => ({ bucket, items }));
}

/* ── Event Card ────────────────────────────────────────────── */

function EventCard({
  event,
  isExpanded,
  onToggle,
  onAskAI,
  isHighlighted,
}: {
  event: ActivityEvent;
  isExpanded: boolean;
  onToggle: () => void;
  onAskAI: (question: string) => void;
  isHighlighted: boolean;
}) {
  const actorMeta = ACTOR_META[event.actor] ?? ACTOR_META.system;
  const ActorIcon = actorMeta.Icon;
  const sevMeta = SEVERITY_META[(event.severity ?? "info") as SeverityKey];
  const outcomeMeta = OUTCOME_META[event.outcome] ?? OUTCOME_META.success;
  const ts = new Date(event.ts);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "border rounded-xl p-3 sm:p-4 cursor-pointer transition-all",
        isHighlighted
          ? "border-gold-border/60 bg-gold/5 shadow-[0_0_16px_-4px_rgba(224,165,55,0.25)]"
          : "border-line bg-surface-2 hover:bg-surface-2/80",
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* Actor icon */}
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${actorMeta.color}20`, color: actorMeta.color }}
        >
          <ActorIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium leading-tight">{event.summary}</span>
            {event.severity && event.severity !== "info" && (
              <Badge tone={sevMeta.tone} className="text-[10px]">{sevMeta.label}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-soft">
            <Clock className="h-3 w-3" />
            <span className="tabular-nums">
              {ts.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-line">·</span>
            <span style={{ color: actorMeta.color }}>{actorMeta.label}</span>
            <span className="text-line">·</span>
            <Badge tone={outcomeMeta.tone} className="text-[9px]">{outcomeMeta.label}</Badge>
          </div>
        </div>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-ink-soft shrink-0 mt-1"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-line space-y-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-ink-soft">Intent</span>
                  <p className="font-mono text-[11px] mt-0.5 truncate">{event.intent}</p>
                </div>
                {event.target && (
                  <div className="min-w-0">
                    <span className="text-ink-soft">Target</span>
                    <p className="font-mono text-[11px] mt-0.5 truncate">{event.target}</p>
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-ink-soft">Fuente</span>
                  <p className="font-mono text-[11px] mt-0.5 truncate">{event.source}</p>
                </div>
                <div className="min-w-0">
                  <span className="text-ink-soft">Timestamp</span>
                  <p className="font-mono text-[11px] mt-0.5 truncate">{ts.toLocaleString("es-CR")}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAskAI(`¿Qué puedes decirme sobre el evento "${event.summary}" (${event.intent})?`);
                }}
                className="flex items-center gap-1.5 text-[11px] text-gold-border hover:text-gold-border/80 transition mt-1"
              >
                <Brain className="h-3 w-3" /> Preguntar a la IA sobre este evento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── AI Chat Panel ─────────────────────────────────────────── */

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  relatedEventIds?: string[];
  followUpQuestions?: string[];
  pattern?: string;
}

function AuditAIChat({
  events,
  onHighlight,
  pendingQuestion,
  onClearPending,
}: {
  events: ActivityEvent[];
  onHighlight: (ids: string[]) => void;
  pendingQuestion: string | null;
  onClearPending: () => void;
}) {
  const apiKey = useNexus((s) => s.geminiApiKey);
  const model = useNexus((s) => s.geminiModel);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const QUICK_CHIPS = [
    "Resumen del día",
    "Eventos críticos",
    "Patrones inusuales",
    "¿Quién hizo más cambios?",
  ];

  // Handle pending question from event card
  useEffect(() => {
    if (pendingQuestion) {
      setIsOpen(true);
      setInput(pendingQuestion);
      onClearPending();
      // auto-submit after a tick
      setTimeout(() => {
        submitQuestion(pendingQuestion);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const submitQuestion = useCallback(async (q: string) => {
    if (!q.trim() || loading) return;
    const question = q.trim();
    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const eventData = events.map((e) => ({
        id: e.id, ts: e.ts, actor: e.actor, intent: e.intent,
        target: e.target, outcome: e.outcome, severity: e.severity,
        source: e.source, summary: e.summary,
      }));

      const result = await analyzeAudit({
        apiKey, model, question: question, events: eventData, history,
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        text: result.answer,
        relatedEventIds: result.relatedEventIds,
        followUpQuestions: result.followUpQuestions,
        pattern: result.pattern ?? undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      onHighlight(result.relatedEventIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [apiKey, model, events, messages, loading, onHighlight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(input);
  };

  return (
    <Card className="overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 border-b border-line hover:bg-surface/30 transition"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
            <Brain className="h-4 w-4 text-gold-border" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold">Asistente IA de Auditoría</h3>
            <p className="text-[11px] text-ink-soft">Pregunta sobre tus eventos · Gemini</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-ink-soft" />
        </motion.div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 py-4 space-y-3">
              {/* API key warning */}
              {!apiKey && (
                <div className="flex items-center gap-2 text-xs text-gold-border bg-gold/10 border border-gold-border/40 rounded-lg px-3 py-2">
                  <Info className="h-4 w-4 shrink-0" />
                  Configura tu API key de Gemini en <a href="/settings" className="underline">Ajustes</a>.
                </div>
              )}

              {/* Messages area */}
              <div
                ref={scrollRef}
                className="space-y-3 max-h-[40vh] sm:max-h-[400px] overflow-y-auto scrollbar-none pr-1"
              >
                {messages.length === 0 && !loading && (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                      <MessageCircle className="h-5 w-5 text-gold-border" />
                    </div>
                    <p className="text-sm text-ink-soft">
                      Pregúntame sobre los eventos de tu hogar.
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      Puedo analizar patrones, explicar eventos y resumir la actividad.
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-md bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-3 w-3 text-gold-border" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm max-w-[85%] leading-relaxed",
                        msg.role === "user"
                          ? "bg-navy text-cream rounded-br-sm"
                          : "bg-surface border border-line rounded-bl-sm",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.pattern && (
                        <div className="mt-2 px-2 py-1.5 bg-gold/10 border border-gold-border/30 rounded-lg text-[11px] text-gold-border">
                          <strong>Patrón:</strong> {msg.pattern}
                        </div>
                      )}
                      {msg.relatedEventIds && msg.relatedEventIds.length > 0 && (
                        <p className="text-[10px] text-ink-soft mt-1.5">
                          {msg.relatedEventIds.length} evento{msg.relatedEventIds.length === 1 ? "" : "s"} relacionado{msg.relatedEventIds.length === 1 ? "" : "s"}
                        </p>
                      )}
                      {/* Follow-up chips */}
                      {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.followUpQuestions.map((fq, j) => (
                            <button
                              key={j}
                              onClick={(e) => {
                                e.stopPropagation();
                                submitQuestion(fq);
                              }}
                              className="text-[10px] px-2 py-1 rounded-md bg-surface-2 border border-line text-ink-soft hover:text-ink hover:bg-surface transition"
                            >
                              {fq}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-md bg-navy/30 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-3 w-3 text-ink-soft" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm text-ink-soft py-2"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-border" />
                    Analizando {events.length} eventos…
                  </motion.div>
                )}

                {error && (
                  <div className="text-xs text-critical bg-critical/10 border border-critical/30 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
              </div>

              {/* Quick chips */}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => submitQuestion(chip)}
                      disabled={loading || !apiKey}
                      className="text-[11px] px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-line bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink transition disabled:opacity-40"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-line focus-within:border-gold-border/40 transition">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="¿Qué pasó hoy?"
                    disabled={loading || !apiKey}
                    className="bg-transparent flex-1 outline-none text-sm placeholder:text-ink-soft/50 disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || loading || !apiKey}
                  className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-navy text-cream flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function AuditPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const all = useNexus((s) => s.activity);
  const items = selectActivityByPersona(personaId, all);

  /* Filters */
  const [q, setQ] = useState("");
  const [actor, setActor] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [outcome, setOutcome] = useState<string>("all");
  const [timelineSlot, setTimelineSlot] = useState<number | null>(null);

  /* UI state */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  /* Filtered items */
  const filtered = useMemo(() => {
    let result = items;

    // Timeline slot filter
    if (timelineSlot !== null) {
      const now = Date.now();
      const WINDOW = 24 * 60 * 60 * 1000;
      const start = now - WINDOW;
      const slotFrom = start + timelineSlot * 60 * 60 * 1000;
      const slotTo = slotFrom + 60 * 60 * 1000;
      result = result.filter((e) => {
        const t = new Date(e.ts).getTime();
        return t >= slotFrom && t < slotTo;
      });
    }

    return result.filter((a) => {
      if (actor !== "all" && a.actor !== actor) return false;
      if (severity !== "all" && a.severity !== severity) return false;
      if (outcome !== "all" && a.outcome !== outcome) return false;
      if (q && !a.summary.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [items, q, actor, severity, outcome, timelineSlot]);

  /* KPIs */
  const kpis = useMemo(() => {
    const total = items.length;
    const critical = items.filter((e) => e.severity === "critical").length;
    const warnings = items.filter((e) => e.severity === "warn").length;
    const byActor = {
      user: items.filter((e) => e.actor === "user").length,
      system: items.filter((e) => e.actor === "system").length,
      rule: items.filter((e) => e.actor === "rule").length,
      voice: items.filter((e) => e.actor === "voice").length,
    };
    return { total, critical, warnings, byActor };
  }, [items]);

  /* Grouped */
  const grouped = useMemo(() => groupByTimeBucket(filtered), [filtered]);

  /* Export CSV */
  function exportCsv() {
    const header = "ts,actor,intent,target,outcome,severity,source,summary";
    const rows = filtered.map((a) =>
      [a.ts, a.actor, a.intent, a.target, a.outcome, a.severity, a.source, JSON.stringify(a.summary)].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_${personaId}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleAskAI(question: string) {
    setPendingQuestion(question);
  }

  function handleHighlight(ids: string[]) {
    setHighlightedIds(new Set(ids));
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Hero ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl sm:text-3xl"
          >
            Auditoría
          </motion.h1>
          <p className="text-sm text-ink-soft mt-1">
            Bitácora completa · {items.length} eventos registrados
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-line bg-surface-2 text-sm hover:bg-line transition"
        >
          <Download size={14} /> <span className="hidden sm:inline">Exportar</span> CSV
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Total", value: kpis.total, Icon: Activity, color: "#7B93DB" },
          { label: "Críticos", value: kpis.critical, Icon: ShieldAlert, color: "#D9534F" },
          { label: "Avisos", value: kpis.warnings, Icon: AlertTriangle, color: "#E0A537" },
          { label: "Por voz", value: kpis.byActor.voice, Icon: Mic, color: "#C084FC" },
        ].map((kpi) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="px-3 sm:px-4 py-3 sm:py-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.Icon className="h-3.5 w-3.5" style={{ color: kpi.color }} />
                <span className="text-[11px] text-ink-soft">{kpi.label}</span>
              </div>
              <AnimatedNumber value={kpi.value} className="text-xl sm:text-2xl font-display" />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Actor breakdown mini-chips ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {(Object.entries(kpis.byActor) as [ActorKey, number][]).map(([key, count]) => {
          const meta = ACTOR_META[key];
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-ink-soft bg-surface-2 border border-line rounded-lg px-3 py-2 sm:px-2.5 sm:py-1.5 shrink-0">
              <meta.Icon className="h-3 w-3" style={{ color: meta.color }} />
              <span>{meta.label}</span>
              <span className="font-medium tabular-nums" style={{ color: meta.color }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* ── Timeline ── */}
      <AuditTimeline items={items} onSlotClick={setTimelineSlot} activeSlot={timelineSlot} />

      {/* ── AI Chat ── */}
      <AuditAIChat
        events={items}
        onHighlight={handleHighlight}
        pendingQuestion={pendingQuestion}
        onClearPending={() => setPendingQuestion(null)}
      />

      {/* ── Filters ── */}
      <Card className="p-3 sm:p-4 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-line focus-within:border-gold-border/40 transition">
          <Search size={16} className="text-ink-soft shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar evento..."
            className="bg-transparent flex-1 outline-none text-sm placeholder:text-ink-soft/50"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-ink-soft hover:text-ink">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Pill filters row */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Severity pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <Filter className="h-3 w-3 text-ink-soft shrink-0 mr-1" />
            {(["all", "critical", "warn", "info"] as const).map((s) => {
              const active = severity === s;
              return (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "relative px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] border transition-all shrink-0 capitalize",
                    active
                      ? "bg-navy text-cream border-navy shadow-soft"
                      : "border-line text-ink-soft hover:bg-surface-2",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sev-pill-audit"
                      className="absolute inset-0 rounded-lg bg-navy border border-navy"
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

          {/* Actor pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {(["all", "user", "system", "rule", "voice"] as const).map((a) => {
              const active = actor === a;
              const meta = a !== "all" ? ACTOR_META[a] : null;
              return (
                <motion.button
                  key={a}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActor(a)}
                  className={cn(
                    "relative flex items-center gap-1 px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] border transition-all shrink-0",
                    active
                      ? "bg-navy text-cream border-navy shadow-soft"
                      : "border-line text-ink-soft hover:bg-surface-2",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="actor-pill-audit"
                      className="absolute inset-0 rounded-lg bg-navy border border-navy"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {meta && <meta.Icon className="relative z-10 h-3 w-3" />}
                  <span className="relative z-10">
                    {a === "all" ? "Todos" : meta!.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Outcome pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <CheckCircle2 className="h-3 w-3 text-ink-soft shrink-0 mr-1" />
            {(["all", "success", "failure", "pending"] as const).map((o) => {
              const active = outcome === o;
              return (
                <motion.button
                  key={o}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setOutcome(o)}
                  className={cn(
                    "relative px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] border transition-all shrink-0",
                    active
                      ? "bg-navy text-cream border-navy shadow-soft"
                      : "border-line text-ink-soft hover:bg-surface-2",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="outcome-pill-audit"
                      className="absolute inset-0 rounded-lg bg-navy border border-navy"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {o === "all" ? "Todos" : OUTCOME_META[o].label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Active filter count */}
        {(q || actor !== "all" || severity !== "all" || outcome !== "all" || timelineSlot !== null) && (
          <div className="flex items-center gap-2 text-[11px] text-ink-soft">
            <span>{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</span>
            <button
              onClick={() => { setQ(""); setActor("all"); setSeverity("all"); setOutcome("all"); setTimelineSlot(null); }}
              className="text-gold-border hover:text-gold-border/80 transition"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </Card>

      {/* ── Event List (grouped by time bucket) ── */}
      {grouped.length > 0 ? (
        grouped.map((group) => (
          <div key={group.bucket} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Clock className="h-3.5 w-3.5 text-ink-soft" />
              <h2 className="text-xs font-semibold text-ink-soft uppercase tracking-wide">
                {group.bucket}
              </h2>
              <span className="text-[10px] text-ink-soft tabular-nums">
                ({group.items.length})
              </span>
              <div className="flex-1 h-px bg-line" />
            </div>
            <AnimatePresence mode="popLayout">
              {group.items.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isExpanded={expandedId === event.id}
                  onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  onAskAI={handleAskAI}
                  isHighlighted={highlightedIds.has(event.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ))
      ) : (
        <Card className="py-12 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto">
              <Search className="h-5 w-5 text-ink-soft" />
            </div>
            <p className="text-sm text-ink-soft">Sin resultados</p>
            <p className="text-xs text-ink-soft/70">Intenta ajustar los filtros o la búsqueda</p>
          </div>
        </Card>
      )}
    </div>
  );
}
