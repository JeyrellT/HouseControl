"use client";

import { useMemo } from "react";
import { useNexus, selectGatewaysByPersona, selectDevicesByPersona, selectActivityByPersona, STATIC } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { KPI } from "@/components/ui/KPI";
import { Wifi, AlertTriangle, Activity, Server, Battery, Radio, Shield, Gauge } from "lucide-react";
import { HealthCharts } from "@/components/health/HealthCharts";
import { HealthAIInsight } from "@/components/health/HealthAIInsight";

export default function HealthPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const gateways = selectGatewaysByPersona(personaId);
  const devices = selectDevicesByPersona(personaId);
  const capabilities = useNexus((s) => s.capabilities);
  const allActivity = useNexus((s) => s.activity);
  const activity = selectActivityByPersona(personaId, allActivity);
  const offline = devices.filter((d) => d.availability === "offline");
  const unknown = devices.filter((d) => d.availability === "unknown");
  const platforms = STATIC.platforms;

  const metrics = useMemo(() => {
    const total = Math.max(devices.length, 1);
    const online = devices.filter((d) => d.availability === "online").length;
    const availabilityPct = Math.round((online / total) * 100);
    const localPct = Math.round((devices.filter((d) => d.localRoute).length / total) * 100);
    const matterPct = Math.round((devices.filter((d) => d.matterCompliant).length / total) * 100);
    const avgLatency = Math.round(platforms.reduce((s, p) => s + p.latencyMs, 0) / Math.max(platforms.length, 1));
    const batteryLow = devices.filter((d) => {
      const cap = d.capabilityIds.map((id) => capabilities[id]).find((c) => c?.kind === "battery");
      return cap && typeof cap.value === "number" && cap.value < 30;
    }).length;
    const criticalEvents = activity.filter((a) => a.severity === "critical").length;
    const failedCommands = activity.filter((a) => a.outcome === "failure").length;
    return { availabilityPct, localPct, matterPct, avgLatency, batteryLow, criticalEvents, failedCommands, online };
  }, [devices, capabilities, activity, platforms]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Salud del sistema</h1>
        <p className="text-sm text-ink-soft mt-1">Disponibilidad, latencia, resiliencia y observabilidad en tiempo real</p>
      </div>

      {/* KPIs fila 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Disponibilidad" value={`${metrics.availabilityPct}%`} icon={Wifi}
          tone={metrics.availabilityPct >= 95 ? "ok" : metrics.availabilityPct >= 85 ? "gold" : "critical"} />
        <KPI label="Dispositivos offline" value={offline.length} icon={AlertTriangle}
          tone={offline.length === 0 ? "ok" : offline.length > 3 ? "critical" : "gold"} />
        <KPI label="Gateways activos" value={gateways.filter((g) => g.status === "online").length}
          hint={`de ${gateways.length}`} icon={Server} tone="neutral" />
        <KPI label="Latencia promedio" value={`${metrics.avgLatency}ms`} icon={Activity}
          tone={metrics.avgLatency < 200 ? "ok" : metrics.avgLatency < 500 ? "gold" : "critical"} />
      </div>

      {/* KPIs fila 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Ruta local" value={`${metrics.localPct}%`} hint="sin depender de nube" icon={Shield} tone="ok" />
        <KPI label="Matter compliant" value={`${metrics.matterPct}%`} icon={Radio} tone="neutral" />
        <KPI label="Baterías bajas" value={metrics.batteryLow} hint="< 30%" icon={Battery}
          tone={metrics.batteryLow === 0 ? "ok" : metrics.batteryLow > 3 ? "critical" : "gold"} />
        <KPI label="Eventos críticos" value={metrics.criticalEvents} hint={`${metrics.failedCommands} fallos de comando`} icon={Gauge}
          tone={metrics.criticalEvents === 0 ? "ok" : "critical"} />
      </div>

      {/* Análisis IA */}
      <HealthAIInsight />

      {/* Gráficas */}
      <HealthCharts />

      {/* Listados */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Gateways</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-line">
              {gateways.length === 0 && <div className="px-5 py-10 text-sm text-ink-soft text-center">Sin gateways en este sitio.</div>}
              {gateways.map((g) => (
                <div key={g.id} className="px-5 py-3 flex items-center gap-3">
                  <Server size={16} className="text-ink-soft" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{g.name}</div>
                    <div className="text-xs text-ink-soft">{g.kind} · {g.protocol} · {g.hostedDeviceIds.length} dispositivo(s)</div>
                  </div>
                  <Badge tone={g.status === "online" ? "ok" : "critical"}>{g.status}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Plataformas integradas</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-line">
              {platforms.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium capitalize">{p.vendor}</div>
                    <div className="text-xs text-ink-soft">
                      {p.latencyMs}ms · {p.devicesDiscovered} disp.
                      {p.quotaRemaining !== undefined && ` · cuota ${p.quotaRemaining}`}
                    </div>
                  </div>
                  <Badge tone={p.status === "online" ? "ok" : p.status === "offline" ? "critical" : "warn"}>
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Incidencias */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Dispositivos offline
              <Badge tone={offline.length ? "critical" : "ok"}>{offline.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-line max-h-[320px] overflow-y-auto">
              {offline.length === 0 && <div className="px-5 py-10 text-sm text-ink-soft text-center">✅ Todos los dispositivos están online.</div>}
              {offline.map((d) => (
                <div key={d.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-status-critical" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-ink-soft">{d.vendor} · última conexión {new Date(d.updatedAt).toLocaleString("es-CR")}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Eventos recientes (últimos 20)
              <Badge tone={metrics.criticalEvents ? "critical" : "ok"}>{activity.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-line max-h-[320px] overflow-y-auto">
              {activity.length === 0 && <div className="px-5 py-10 text-sm text-ink-soft text-center">Sin actividad reciente.</div>}
              {activity.slice(0, 20).map((a) => (
                <div key={a.id} className="px-5 py-2.5 flex items-start gap-3">
                  <span className={
                    a.severity === "critical" ? "w-2 h-2 mt-1.5 rounded-full bg-status-critical" :
                    a.severity === "warn" ? "w-2 h-2 mt-1.5 rounded-full bg-status-warn" :
                    "w-2 h-2 mt-1.5 rounded-full bg-status-ok"
                  } />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{a.summary}</div>
                    <div className="text-[10px] text-ink-soft">
                      {new Date(a.ts).toLocaleString("es-CR")} · {a.actor} · {a.outcome}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {unknown.length > 0 && (
        <Card className="border-gold-border bg-gold/5">
          <CardBody>
            <div className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-gold-border mt-0.5 shrink-0" />
              <div>
                <strong>{unknown.length} dispositivo(s) en estado desconocido</strong> — no han reportado en las últimas horas.
                Revisa su gateway o el pairing.
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
