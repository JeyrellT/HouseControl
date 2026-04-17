"use client";

import { useState } from "react";
import {
  useNexus, selectDevicesByPersona, selectGatewaysByPersona,
  selectActivePersona, selectActivityByPersona, selectRoomsByPersona, STATIC,
} from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, Loader2, RefreshCw, Brain, Info } from "lucide-react";
import { summarizeHealth, type HealthInsight } from "@/lib/gemini";

export function HealthAIInsight() {
  const personaId = useNexus((s) => s.activePersonaId);
  const persona = selectActivePersona(personaId);
  const devices = selectDevicesByPersona(personaId);
  const rooms = selectRoomsByPersona(personaId);
  const gateways = selectGatewaysByPersona(personaId);
  const allActivity = useNexus((s) => s.activity);
  const activity = selectActivityByPersona(personaId, allActivity);
  const capabilities = useNexus((s) => s.capabilities);
  const apiKey = useNexus((s) => s.geminiApiKey);
  const model = useNexus((s) => s.geminiModel);

  const [insight, setInsight] = useState<HealthInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const run = async () => {
    if (!apiKey) {
      setError("Configura tu API key de Gemini en Ajustes para usar el análisis IA.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const online = devices.filter((d) => d.availability === "online").length;
      const offline = devices.filter((d) => d.availability === "offline");
      const gwOnline = gateways.filter((g) => g.status === "online").length;
      const localRoute = devices.filter((d) => d.localRoute).length;
      const matter = devices.filter((d) => d.matterCompliant).length;
      const batteryLow = devices.filter((d) => {
        const cap = d.capabilityIds.map((id) => capabilities[id]).find((c) => c?.kind === "battery");
        return cap && typeof cap.value === "number" && cap.value < 30;
      }).length;
      const avgLatency = Math.round(
        STATIC.platforms.reduce((s, p) => s + p.latencyMs, 0) / Math.max(STATIC.platforms.length, 1),
      );

      const res = await summarizeHealth({
        apiKey, model,
        snapshot: {
          personaName: persona.name,
          totals: {
            devices: devices.length,
            online,
            offline: offline.length,
            gateways: gateways.length,
            gatewaysOnline: gwOnline,
          },
          platforms: STATIC.platforms.map((p) => ({
            vendor: p.vendor, status: p.status, latencyMs: p.latencyMs,
            devicesDiscovered: p.devicesDiscovered, quotaRemaining: p.quotaRemaining,
          })),
          gateways: gateways.map((g) => ({
            name: g.name, kind: g.kind, status: g.status, hosted: g.hostedDeviceIds.length,
          })),
          offlineDevices: offline.slice(0, 15).map((d) => ({
            name: d.name, vendor: d.vendor, updatedAt: d.updatedAt,
            room: rooms.find((r) => r.id === d.roomId)?.name ?? "",
          })),
          recentActivity: activity.slice(0, 20).map((a) => ({
            ts: a.ts, summary: a.summary, severity: a.severity, outcome: a.outcome,
          })),
          averageLatencyMs: avgLatency,
          coverage: {
            localRoutePct: Math.round((localRoute / Math.max(devices.length, 1)) * 100),
            matterPct: Math.round((matter / Math.max(devices.length, 1)) * 100),
            batteryLowCount: batteryLow,
          },
        },
      });
      setInsight(res);
      setLastRun(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const severityTone = insight
    ? insight.severity === "ok" ? "ok" : insight.severity === "warn" ? "warn" : "critical"
    : "neutral";

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-gold-border" />
          Análisis IA de salud · Gemini
          {insight && <Badge tone={severityTone}>{insight.severity}</Badge>}
        </CardTitle>
        <div className="flex items-center gap-2">
          {lastRun && (
            <span className="text-[11px] text-ink-soft">
              Último análisis: {lastRun.toLocaleTimeString("es-CR")}
            </span>
          )}
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy text-cream text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
              insight ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Analizando…" : insight ? "Actualizar" : "Generar análisis"}
          </button>
        </div>
      </CardHeader>
      <CardBody>
        {!apiKey && (
          <div className="flex items-center gap-2 text-xs text-gold-border bg-gold/10 border border-gold-border/40 rounded-lg px-3 py-2 mb-3">
            <Info className="h-4 w-4 shrink-0" />
            Configura tu API key de Gemini en <a href="/settings" className="underline">Ajustes</a> para habilitar el análisis. Es gratuita y se guarda solo en tu navegador.
          </div>
        )}
        {error && (
          <div className="text-xs text-critical bg-critical/10 border border-critical/30 rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}
        {!insight && !loading && !error && (
          <p className="text-sm text-ink-soft">
            Pulsa <strong>Generar análisis</strong> cuando quieras un resumen en párrafos de lo que está pasando ahora mismo en tu casa.
            La IA revisará dispositivos, gateways, latencias, eventos recientes y baterías para darte un diagnóstico en lenguaje natural y recomendaciones accionables.
          </p>
        )}
        {loading && (
          <div className="flex items-center gap-3 text-sm text-ink-soft py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Gemini está analizando {devices.length} dispositivos, {gateways.length} gateways y {activity.length} eventos…
          </div>
        )}
        {insight && !loading && (
          <div className="space-y-4 text-sm leading-relaxed">
            <section>
              <h3 className="font-display text-base mb-1">Resumen</h3>
              <p className="text-ink">{insight.summary}</p>
            </section>
            <section>
              <h3 className="font-display text-base mb-1">Qué está pasando</h3>
              <p className="text-ink-soft">{insight.whatHappening}</p>
            </section>
            {insight.recommendations?.length > 0 && (
              <section>
                <h3 className="font-display text-base mb-2">Recomendaciones</h3>
                <ul className="space-y-1.5">
                  {insight.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gold-border shrink-0">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <p className="text-[10px] text-ink-soft italic pt-2 border-t border-line">
              Análisis generado por {model}. Puedes pulsar actualizar cuando quieras para obtener un nuevo diagnóstico con el estado actual.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
