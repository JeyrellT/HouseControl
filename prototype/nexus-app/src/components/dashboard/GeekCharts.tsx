"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import {
  useNexus, selectDevicesByPersona, selectActivityByPersona,
  selectGatewaysByPersona,
} from "@/lib/store";
import { STATIC } from "@/lib/store";
import type { DeviceKind, Vendor, Device, Capability } from "@/lib/types";

const DEVICE_W: Record<DeviceKind, number> = {
  light: 12, climate: 1500, camera: 8, speaker: 25,
  sensor: 0.5, valve: 5, lock: 3, switch: 2, cover: 50,
};

// Palette tuned for dark navy surface: each hue distinct in both
// hue-angle and luminance (L* ≥ 55 for preattentive pop-out).
const KIND_COLORS: Record<DeviceKind, string> = {
  light: "#F5C451", climate: "#EF6A5E", camera: "#7DB8FF",
  speaker: "#B8D8A3", sensor: "#B0BDD4", valve: "#6FD38F",
  lock: "#F0B85C", switch: "#9BAAD1", cover: "#D4A373",
};

const VENDOR_COLOR: Record<Vendor, string> = {
  tuya: "#F47A5C", smartthings: "#6E8BFF", ubiquiti: "#4FB8FF",
  crestron: "#EF6A5E", rainbird: "#6FD38F", sonos: "#C9A0DC",
  "home-assistant": "#5EC7E8",
};

// Semantic latency thresholds (ms) → color (green < 150 < amber < 400 < red)
function latencyColor(ms: number): string {
  if (ms < 150) return "#6FD38F";
  if (ms < 400) return "#F0B85C";
  return "#EF6A5E";
}

function hourlyLoadCurve(devices: Device[], capabilities: Record<string, Capability>) {
  // Sinusoid with peaks at 7h/19h + baseline from actual on-state devices.
  const baseOn = devices.reduce((acc, d) => {
    const onCap = d.capabilityIds.map((id) => capabilities[id]).find((c) => c?.kind === "on_off");
    if (onCap?.value === true) acc += DEVICE_W[d.kind] ?? 10;
    return acc;
  }, 0);
  return Array.from({ length: 24 }, (_, h) => {
    const morning = Math.exp(-Math.pow(h - 7, 2) / 6) * 1200;
    const evening = Math.exp(-Math.pow(h - 19, 2) / 8) * 1800;
    const night = h >= 22 || h <= 5 ? 250 : 0;
    const jitter = Math.sin(h * 1.7) * 80;
    return {
      hour: `${String(h).padStart(2, "0")}h`,
      watts: Math.max(80, Math.round(baseOn * 0.3 + morning + evening + night + jitter)),
    };
  });
}

function latency7d() {
  // Simulated 7-day latency trend per bus.
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return days.map((d, i) => ({
    day: d,
    local: 40 + Math.round(Math.sin(i) * 8 + 5),
    zigbee: 95 + Math.round(Math.cos(i * 1.2) * 12 + 10),
    cloud: 420 + Math.round(Math.sin(i * 0.8) * 80 + 50),
  }));
}

export function GeekCharts() {
  const personaId = useNexus((s) => s.activePersonaId);
  const devices = selectDevicesByPersona(personaId);
  const capabilities = useNexus((s) => s.capabilities);
  const allActivity = useNexus((s) => s.activity);
  const activity = selectActivityByPersona(personaId, allActivity);
  const gateways = selectGatewaysByPersona(personaId);
  const platforms = STATIC.platforms;

  const energyData = useMemo(() => hourlyLoadCurve(devices, capabilities), [devices, capabilities]);
  const latencyData = useMemo(() => latency7d(), []);

  // Distribución por tipo de dispositivo
  const kindData = useMemo(() => {
    const counts = new Map<DeviceKind, number>();
    devices.forEach((d) => counts.set(d.kind, (counts.get(d.kind) ?? 0) + 1));
    return Array.from(counts.entries()).map(([kind, count]) => ({
      name: kind, value: count, color: KIND_COLORS[kind],
    }));
  }, [devices]);

  // Mix por vendor — sorted desc for anchoring effect
  const vendorData = useMemo(() => {
    const counts = new Map<Vendor, number>();
    devices.forEach((d) => counts.set(d.vendor, (counts.get(d.vendor) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([v, c]) => ({ name: v, value: c, fill: VENDOR_COLOR[v] }));
  }, [devices]);

  // Radar de salud: 5 ejes
  const radarData = useMemo(() => {
    const online = devices.filter((d) => d.availability === "online").length;
    const local = devices.filter((d) => d.localRoute).length;
    const matter = devices.filter((d) => d.matterCompliant).length;
    const withBattery = devices.filter((d) =>
      d.capabilityIds.some((id) => capabilities[id]?.kind === "battery"),
    );
    const batteryAvg = withBattery.length
      ? withBattery.reduce((acc, d) => {
          const cap = d.capabilityIds.map((id) => capabilities[id]).find((c) => c?.kind === "battery");
          return acc + (typeof cap?.value === "number" ? cap.value : 100);
        }, 0) / withBattery.length
      : 100;
    const total = Math.max(devices.length, 1);
    return [
      { metric: "Disponibilidad", score: Math.round((online / total) * 100) },
      { metric: "Ruta local", score: Math.round((local / total) * 100) },
      { metric: "Matter", score: Math.round((matter / total) * 100) },
      { metric: "Batería", score: Math.round(batteryAvg) },
      { metric: "Automatización", score: Math.min(100, activity.length * 8) },
    ];
  }, [devices, capabilities, activity]);

  // Actividad por hora — seeded baseline so chart is legible even with few seed events.
  // Mirrors circadian activity (low at night, peaks 7h & 19h).
  const activityByHour = useMemo(() => {
    const currentHour = new Date().getHours();
    const buckets = Array.from({ length: 24 }, (_, h) => {
      const morning = Math.exp(-Math.pow(h - 7, 2) / 6) * 8;
      const evening = Math.exp(-Math.pow(h - 19.5, 2) / 10) * 14;
      const day = h >= 9 && h <= 17 ? 4 : 0;
      const night = h >= 0 && h <= 5 ? 1 : 0;
      const jitter = Math.abs(Math.sin(h * 2.1)) * 2;
      return {
        hour: `${String(h).padStart(2, "0")}h`,
        eventos: Math.round(morning + evening + day + night + jitter),
        isNow: h === currentHour,
      };
    });
    activity.forEach((a) => {
      const h = new Date(a.ts).getHours();
      buckets[h].eventos += 1;
    });
    return buckets;
  }, [activity]);

  // Latencia plataformas — ordenada desc (anchoring) + semantic color by threshold
  const platformLatency = useMemo(() => {
    return [...platforms]
      .sort((a, b) => b.latencyMs - a.latencyMs)
      .map((p) => ({
        name: p.vendor,
        latencia: p.latencyMs,
        fill: latencyColor(p.latencyMs),
      }));
  }, [platforms]);

  // Salud de gateways (radial)
  const gatewayHealth = useMemo(() => {
    return gateways.map((g, i) => ({
      name: g.name,
      value: g.status === "online" ? 92 + i * 2 : 30,
      fill: g.status === "online" ? "#5BB37F" : "#D9534F",
    }));
  }, [gateways]);

  const totalWatts = energyData.reduce((a, b) => a + b.watts, 0);
  const kwhDay = (totalWatts / 1000).toFixed(1);
  const colones = Math.round((totalWatts / 1000) * 95 * 30);

  const axisColor = "var(--ink-soft)";
  const gridColor = "var(--line)";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Telemetría · modo geek</h2>
        <div className="text-xs text-ink-soft">
          Actualizado en tiempo real · {devices.length} dispositivos
        </div>
      </div>

      {/* Curva energética + radar */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Curva de consumo 24h (W)</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-4 mb-3 text-xs text-ink-soft">
              <span>Pico estimado: <strong className="text-ink">{Math.max(...energyData.map((d) => d.watts))} W</strong></span>
              <span>kWh/día: <strong className="text-ink">{kwhDay}</strong></span>
              <span>Mes: <strong className="text-ink">₡{colones.toLocaleString("es-CR")}</strong></span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={energyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4A84B" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#D4A84B" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke={axisColor} tick={{ fontSize: 10 }} interval={2} />
                <YAxis stroke={axisColor} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="watts" stroke="#D4A84B" strokeWidth={2} fill="url(#gEnergy)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Radar de salud del sistema</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "var(--ink)" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: axisColor }} />
                <Radar name="Score" dataKey="score" stroke="#6FD38F" strokeWidth={2} fill="#6FD38F" fillOpacity={0.35} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Latencia 7d + donut kind + radial gateways */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Latencia 7d por bus (ms)</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={latencyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke={axisColor} tick={{ fontSize: 10 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="local" stroke="#5BB37F" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="zigbee" stroke="#D4A84B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cloud" stroke="#D9534F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispositivos por tipo</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={kindData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  stroke="var(--surface)"
                >
                  {kindData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salud de gateways</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                innerRadius="45%"
                outerRadius="95%"
                data={gatewayHealth}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: "rgba(255,255,255,0.05)" }}
                  dataKey="value"
                  cornerRadius={8}
                  label={{ position: "insideStart", fill: "#fff", fontSize: 10, fontWeight: 600 }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Actividad por hora + latencia plataformas + vendor mix */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividad por hora del día</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-4 text-[11px] text-ink-soft mb-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#7DB8FF" }} /> Eventos / hora
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#F5C451" }} /> Hora actual
              </span>
              <span>Pico: <strong className="text-ink">{Math.max(...activityByHour.map((b) => b.eventos))}</strong></span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityByHour} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7DB8FF" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7DB8FF" stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="gActivityNow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5C451" stopOpacity={1} />
                    <stop offset="100%" stopColor="#F5C451" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke={axisColor} tick={{ fontSize: 9 }} interval={1} />
                <YAxis stroke={axisColor} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(125,184,255,0.08)" }}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="eventos" radius={[4, 4, 0, 0]}>
                  {activityByHour.map((b) => (
                    <Cell key={b.hour} fill={b.isNow ? "url(#gActivityNow)" : "url(#gActivity)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendor mix</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={vendorData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke={axisColor} tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  label={{ position: "right", fill: "var(--ink)", fontSize: 10 }}
                >
                  {vendorData.map((v) => (
                    <Cell key={v.name} fill={v.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Latencia por plataforma */}
      <Card>
        <CardHeader>
          <CardTitle>Latencia por plataforma cloud (ms)</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-4 text-[11px] text-ink-soft mb-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#6FD38F" }} /> Óptimo &lt;150ms
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#F0B85C" }} /> Aceptable &lt;400ms
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#EF6A5E" }} /> Alto &ge;400ms
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={platformLatency} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 10 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 10 }} />
              <Tooltip
                cursor={{ fill: "rgba(125,184,255,0.06)" }}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar
                dataKey="latencia"
                radius={[4, 4, 0, 0]}
                label={{ position: "top", fill: "var(--ink-soft)", fontSize: 10 }}
              >
                {platformLatency.map((p) => (
                  <Cell key={p.name} fill={p.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}
