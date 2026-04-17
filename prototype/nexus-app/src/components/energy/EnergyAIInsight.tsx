"use client";

import { useMemo, useState } from "react";
import {
  useNexus, selectDevicesByPersona, selectRoomsByPersona, selectActivePersona,
} from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles, Loader2, RefreshCw, Leaf, Info, AlertTriangle,
  TrendingDown, Target, Zap, Calendar, Award,
} from "lucide-react";
import { summarizeEnergy, type EnergyInsight } from "@/lib/gemini";
import { buildEnergyAudit } from "@/lib/device-energy";

const IMPACT_COLORS: Record<"alto" | "medio" | "bajo", string> = {
  alto: "border-critical/30 bg-critical/5",
  medio: "border-gold-border/30 bg-gold/5",
  bajo: "border-status-ok/30 bg-status-ok/5",
};
const GRADE_COLORS: Record<string, string> = {
  A: "bg-status-ok text-cream",
  B: "bg-sage text-ink",
  C: "bg-gold text-ink",
  D: "bg-status-warn text-ink",
  E: "bg-critical text-cream",
};

export function EnergyAIInsight() {
  const personaId = useNexus((s) => s.activePersonaId);
  const persona = selectActivePersona(personaId);
  const devices = selectDevicesByPersona(personaId);
  const rooms = selectRoomsByPersona(personaId);
  const capabilities = useNexus((s) => s.capabilities);
  const apiKey = useNexus((s) => s.geminiApiKey);
  const model = useNexus((s) => s.geminiModel);

  const [insight, setInsight] = useState<EnergyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const audit = useMemo(
    () => buildEnergyAudit(devices, capabilities, rooms),
    [devices, capabilities, rooms],
  );

  const run = async () => {
    if (!apiKey) {
      setError("Configura tu API key de Gemini en Ajustes para usar el análisis IA.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const compact = {
        personaName: persona.name,
        totalW: audit.totalW,
        activeCount: audit.activeCount,
        peakWEstimate: audit.peakWEstimate,
        coincidenceFactor: audit.coincidenceFactor,
        dailyKwh: audit.dailyKwh,
        monthlyKwh: audit.monthlyKwh,
        monthlyCRC: audit.monthlyCRC,
        co2KgMonth: audit.co2KgMonth,
        phantom: { watts: audit.phantomW, kwhMonth: audit.phantomKwhMonth, crcMonth: audit.phantomCRCMonth },
        benchmark: audit.benchmark,
        efficiencyScore: audit.efficiencyScore,
        byCategory: audit.byCategory,
        byRoom: audit.byRoom.slice(0, 8),
        byTariff: audit.byTariff,
        topConsumers: audit.topConsumers.slice(0, 10).map((d) => ({
          name: d.name, room: d.room, watts: d.watts, category: d.category,
          efficiency: d.efficiency, kwhMonth: d.kwhMonth, costMonth: d.costMonth,
          flags: d.flags,
        })),
        anomalies: audit.anomalies,
        opportunities: audit.opportunities,
        riskFlags: audit.riskFlags,
      };

      const res = await summarizeEnergy({ apiKey, model, snapshot: compact });
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

  const totalSavings = insight?.actions?.reduce((s, a) => s + (a.estimatedSavingsCRC ?? 0), 0) ?? 0;
  const highImpactSavings = insight?.actions?.filter((a) => a.impact === "alto")
    .reduce((s, a) => s + (a.estimatedSavingsCRC ?? 0), 0) ?? 0;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Leaf className="h-5 w-5 text-gold-border" />
          Auditoría energética IA · Gemini
          {insight && <Badge tone={severityTone}>{insight.severity}</Badge>}
          {insight && (
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${GRADE_COLORS[insight.efficiencyGrade]}`}>
              {insight.efficiencyGrade}
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {lastRun && (
            <span className="text-[11px] text-ink-soft">
              Último: {lastRun.toLocaleTimeString("es-CR")}
            </span>
          )}
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy text-cream text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
              insight ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Auditando…" : insight ? "Re-auditar" : "Auditar ahora"}
          </button>
        </div>
      </CardHeader>
      <CardBody>
        {/* Auditoría determinística SIEMPRE visible */}
        <div className="grid md:grid-cols-4 gap-3 mb-5 text-xs">
          <div className="rounded-lg border border-line p-3">
            <div className="text-ink-soft uppercase tracking-wide text-[10px]">Score eficiencia</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold">{audit.efficiencyScore}</span>
              <span className="text-ink-soft">/100</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className={`h-full ${audit.efficiencyScore >= 75 ? "bg-status-ok" : audit.efficiencyScore >= 50 ? "bg-gold" : "bg-critical"}`}
                style={{ width: `${audit.efficiencyScore}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-ink-soft uppercase tracking-wide text-[10px]">vs hogar CR promedio</div>
            <div className="text-2xl font-bold mt-1 capitalize">{audit.benchmark.position.replace("_", " ")}</div>
            <div className="text-ink-soft">{audit.benchmark.pctVsAverage}% del promedio ({audit.benchmark.crAverageKwh} kWh)</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-ink-soft uppercase tracking-wide text-[10px]">Carga fantasma</div>
            <div className="text-2xl font-bold mt-1">{audit.phantomW} W</div>
            <div className="text-ink-soft">≈ ₡{audit.phantomCRCMonth.toLocaleString("es-CR")}/mes</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-ink-soft uppercase tracking-wide text-[10px]">Factor coincidencia</div>
            <div className="text-2xl font-bold mt-1">{(audit.coincidenceFactor * 100).toFixed(0)}%</div>
            <div className="text-ink-soft">Cargas pesadas simultáneas</div>
          </div>
        </div>

        {audit.anomalies.length > 0 && (
          <div className="mb-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <AlertTriangle className="h-3.5 w-3.5" />
              Anomalías detectadas ({audit.anomalies.length})
            </div>
            {audit.anomalies.map((a, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 text-sm ${
                  a.severity === "critical" ? "border-critical/40 bg-critical/5" :
                  a.severity === "warn" ? "border-status-warn/40 bg-status-warn/5" :
                  "border-line bg-surface-2/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium">{a.title}</div>
                  {a.estimatedMonthlyWasteCRC ? (
                    <Badge tone="warn" className="text-[10px]">
                      ~₡{a.estimatedMonthlyWasteCRC.toLocaleString("es-CR")}/mes
                    </Badge>
                  ) : null}
                </div>
                <div className="text-ink-soft text-xs mt-1">{a.detail}</div>
              </div>
            ))}
          </div>
        )}

        {audit.riskFlags.length > 0 && (
          <div className="mb-5 rounded-lg border border-critical/30 bg-critical/5 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-critical mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Avisos de riesgo
            </div>
            <ul className="text-xs space-y-0.5">
              {audit.riskFlags.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>
          </div>
        )}

        {!apiKey && (
          <div className="flex items-center gap-2 text-xs text-gold-border bg-gold/10 border border-gold-border/40 rounded-lg px-3 py-2 mb-3">
            <Info className="h-4 w-4 shrink-0" />
            Configura tu API key de Gemini en <a href="/settings" className="underline">Ajustes</a> para añadir análisis narrativo y plan de acción con IA sobre esta auditoría.
          </div>
        )}
        {error && (
          <div className="text-xs text-critical bg-critical/10 border border-critical/30 rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}
        {!insight && !loading && !error && apiKey && (
          <p className="text-sm text-ink-soft">
            Pulsa <strong>Auditar ahora</strong> para que Gemini analice los {audit.activeCount} dispositivos activos,
            las {audit.anomalies.length} anomalías detectadas y las {audit.opportunities.length} oportunidades con ROI,
            y te devuelva un plan de acción narrativo priorizado por impacto económico.
          </p>
        )}
        {loading && (
          <div className="flex items-center gap-3 text-sm text-ink-soft py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Gemini está auditando {devices.length} dispositivos contra benchmarks CR, tarifas ICE y factores de eficiencia…
          </div>
        )}

        {insight && !loading && (
          <div className="space-y-5 text-sm leading-relaxed mt-5 pt-5 border-t border-line">
            <div className="rounded-lg bg-navy/5 border border-navy/20 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-soft mb-1.5">
                <Award className="h-3 w-3" /> Veredicto
              </div>
              <p className="text-base font-display">{insight.executiveSummary}</p>
            </div>

            {totalSavings > 0 && (
              <div className="grid md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-status-ok/30 bg-status-ok/5 p-3">
                  <div className="text-ink-soft uppercase tracking-wide text-[10px]">Ahorro total potencial</div>
                  <div className="text-2xl font-bold mt-1 text-status-ok">
                    ₡{totalSavings.toLocaleString("es-CR")}
                  </div>
                  <div className="text-ink-soft">al mes si aplicas todo</div>
                </div>
                <div className="rounded-lg border border-gold-border/30 bg-gold/5 p-3">
                  <div className="text-ink-soft uppercase tracking-wide text-[10px]">Alto impacto</div>
                  <div className="text-2xl font-bold mt-1 text-gold-border">
                    ₡{highImpactSavings.toLocaleString("es-CR")}
                  </div>
                  <div className="text-ink-soft">quick wins priorizados</div>
                </div>
                <div className="rounded-lg border border-line p-3">
                  <div className="text-ink-soft uppercase tracking-wide text-[10px]">Reducción de consumo</div>
                  <div className="text-2xl font-bold mt-1">
                    {Math.round((totalSavings / Math.max(audit.monthlyCRC, 1)) * 100)}%
                  </div>
                  <div className="text-ink-soft">respecto al mes actual</div>
                </div>
              </div>
            )}

            <section>
              <h3 className="font-display text-base mb-1 flex items-center gap-2">
                <Zap className="h-4 w-4 text-gold-border" /> Diagnóstico
              </h3>
              <p className="text-ink">{insight.summary}</p>
            </section>

            <section>
              <h3 className="font-display text-base mb-1">Qué está consumiendo ahora</h3>
              <p className="text-ink-soft">{insight.whatHappening}</p>
            </section>

            <section>
              <h3 className="font-display text-base mb-1 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-sage-border" /> Benchmark vs hogar CR
              </h3>
              <p className="text-ink-soft">{insight.benchmarkAnalysis}</p>
            </section>

            {insight.anomaliesNarrative && (
              <section>
                <h3 className="font-display text-base mb-1 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-status-warn" /> Análisis de anomalías
                </h3>
                <p className="text-ink-soft">{insight.anomaliesNarrative}</p>
              </section>
            )}

            {insight.actions?.length > 0 && (
              <section>
                <h3 className="font-display text-base mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-gold-border" />
                  Plan de acción priorizado ({insight.actions.length})
                </h3>
                <div className="space-y-2">
                  {insight.actions.map((a, i) => (
                    <div key={i} className={`rounded-lg border p-3 ${IMPACT_COLORS[a.impact]}`}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{i + 1}. {a.title}</span>
                          <Badge tone={a.impact === "alto" ? "critical" : a.impact === "medio" ? "warn" : "ok"} className="text-[9px] uppercase">
                            {a.impact}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold tabular-nums">
                            ₡{(a.estimatedSavingsCRC ?? 0).toLocaleString("es-CR")}/mes
                          </div>
                          {a.estimatedSavingsKwh ? (
                            <div className="text-[10px] text-ink-soft">{a.estimatedSavingsKwh} kWh/mes</div>
                          ) : null}
                        </div>
                      </div>
                      {a.paybackMonths ? (
                        <div className="text-[10px] text-ink-soft mt-1">
                          Retorno de inversión: ~{a.paybackMonths} meses · Categoría: {a.category}
                        </div>
                      ) : (
                        <div className="text-[10px] text-ink-soft mt-1">Categoría: {a.category}</div>
                      )}
                      {a.steps && a.steps.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-xs">
                          {a.steps.map((s, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="text-ink-soft">→</span><span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {insight.monthlyForecast && (
              <section className="rounded-lg bg-gold/10 border border-gold-border/30 p-3">
                <h3 className="font-display text-base mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gold-border" /> Pronóstico mensual
                </h3>
                <p className="text-ink text-sm">{insight.monthlyForecast}</p>
              </section>
            )}

            {insight.seasonality && (
              <section className="text-xs text-ink-soft italic border-l-2 border-sage pl-3">
                <strong className="not-italic text-ink">Estacionalidad CR:</strong> {insight.seasonality}
              </section>
            )}

            <p className="text-[10px] text-ink-soft italic pt-2 border-t border-line">
              Auditoría generada por {model} sobre {audit.devices.length} dispositivos analizados.
              Score {audit.efficiencyScore}/100 · Grado {insight.efficiencyGrade} ·
              {audit.anomalies.length} anomalías · {audit.opportunities.length} oportunidades base.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
