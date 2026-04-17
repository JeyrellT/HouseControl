"use client";

import { useNexus, selectDevicesByPersona, selectScenesByPersona, selectActivityByPersona, selectActivePersona } from "@/lib/store";
import { KPI } from "@/components/ui/KPI";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { ScenesPanel } from "@/components/dashboard/ScenesPanel";
import { PlatformHealth } from "@/components/dashboard/PlatformHealth";
import { GeekCharts } from "@/components/dashboard/GeekCharts";
import { Cpu, Wifi, AlertTriangle, Sparkles, Lightbulb } from "lucide-react";

export default function DashboardPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const persona = selectActivePersona(personaId);
  const devices = selectDevicesByPersona(personaId);
  const scenes = selectScenesByPersona(personaId);
  const all = useNexus((s) => s.activity);
  const activity = selectActivityByPersona(personaId, all);
  const capabilities = useNexus((s) => s.capabilities);

  const total = devices.length;
  const online = devices.filter((d) => d.availability === "online").length;
  const offline = total - online;
  const lightsOn = devices.filter((d) => {
    if (d.kind !== "light") return false;
    const onCap = d.capabilityIds.map((id) => capabilities[id]).find((c) => c?.kind === "on_off");
    return onCap?.value === true;
  }).length;
  const totalLights = devices.filter((d) => d.kind === "light").length;
  const alerts = activity.filter((a) => a.severity !== "info").length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-ink-soft">{persona.location} · {persona.type}</div>
          <h1 className="font-display text-3xl md:text-4xl mt-1">{persona.name}</h1>
          <p className="text-ink-soft mt-2 max-w-2xl text-sm">
            {persona.goals.join(" · ")}
          </p>
        </div>
        <div className="text-right text-sm text-ink-soft">
          <div className="font-medium text-ink">
            {new Date().toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div>{new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Dispositivos" value={total} hint={`${online} online · ${offline} offline`} icon={Cpu} tone="neutral" />
        <KPI label="Luces encendidas" value={`${lightsOn}/${totalLights}`} hint="Tiempo real" icon={Lightbulb} tone="gold" />
        <KPI label="Escenas" value={scenes.length} hint="Listas para ejecutar" icon={Sparkles} tone="gold" />
        <KPI label="Alertas" value={alerts} hint={alerts === 0 ? "Sin incidencias" : "Revisar timeline"} icon={alerts ? AlertTriangle : Wifi} tone={alerts ? "warn" : "ok"} />
      </div>

      {/* Hemispheres: izq analytics / der orquestación */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ActivityTimeline limit={8} />
          <Card>
            <CardHeader><CardTitle>Resumen contextual</CardTitle></CardHeader>
            <CardBody>
              <p className="text-sm text-ink-soft leading-relaxed">
                Hoy se ejecutaron <strong className="text-ink">{activity.length}</strong> eventos en {persona.name}.
                {alerts > 0
                  ? ` Hay ${alerts} alerta(s) que requieren atención.`
                  : " Todo está funcionando con normalidad."}{" "}
                {offline > 0 && `${offline} dispositivo(s) offline.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-ink-soft">
                <span className="px-2 py-1 rounded-md bg-surface border border-line">⚡ {Math.round((lightsOn / Math.max(totalLights, 1)) * 100)}% iluminación activa</span>
                <span className="px-2 py-1 rounded-md bg-surface border border-line">📡 {Math.round((online / Math.max(total, 1)) * 100)}% disponibilidad</span>
              </div>
            </CardBody>
          </Card>
        </div>
        <div className="space-y-4">
          <ScenesPanel />
          <PlatformHealth />
        </div>
      </div>

      {/* Modo geek: telemetría profunda */}
      <GeekCharts />
    </div>
  );
}
