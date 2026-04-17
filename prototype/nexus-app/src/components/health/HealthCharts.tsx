"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { useNexus, selectDevicesByPersona, selectGatewaysByPersona, selectActivityByPersona, STATIC } from "@/lib/store";

const COLORS = ["#5BB37F", "#D4A84B", "#D9534F", "#1E2A44", "#8B95A8", "#A8C090", "#B08968", "#E0A537"];

function latencyTrend() {
  // Simulamos 24h con picos en horas activas
  return Array.from({ length: 24 }, (_, h) => {
    const peak = Math.exp(-Math.pow(h - 19, 2) / 10) * 60;
    const morning = Math.exp(-Math.pow(h - 8, 2) / 8) * 35;
    const jitter = Math.sin(h * 1.3) * 12;
    return {
      hour: `${String(h).padStart(2, "0")}h`,
      local: Math.max(20, Math.round(40 + jitter * 0.3)),
      zigbee: Math.max(40, Math.round(95 + jitter + morning * 0.2)),
      cloud: Math.max(200, Math.round(380 + peak * 2 + jitter * 3)),
    };
  });
}

function uptime30d() {
  return Array.from({ length: 30 }, (_, i) => {
    const incident = i === 4 || i === 17 || i === 23;
    return {
      day: `D-${29 - i}`,
      uptime: incident ? 97 + Math.random() * 1.5 : 99.3 + Math.random() * 0.6,
      events: incident ? Math.floor(2 + Math.random() * 4) : Math.floor(Math.random() * 2),
    };
  });
}

export function HealthCharts() {
  const personaId = useNexus((s) => s.activePersonaId);
  const devices = selectDevicesByPersona(personaId);
  const gateways = selectGatewaysByPersona(personaId);
  const allActivity = useNexus((s) => s.activity);
  const activity = selectActivityByPersona(personaId, allActivity);
  const capabilities = useNexus((s) => s.capabilities);
  const platforms = STATIC.platforms;

  const latency = useMemo(() => latencyTrend(), []);
  const uptime = useMemo(() => uptime30d(), []);

  // Disponibilidad por vendor (%)
  const vendorAvailability = useMemo(() => {
    const map = new Map<string, { total: number; online: number }>();
    devices.forEach((d) => {
      const m = map.get(d.vendor) ?? { total: 0, online: 0 };
      m.total += 1;
      if (d.availability === "online") m.online += 1;
      map.set(d.vendor, m);
    });
    return Array.from(map.entries()).map(([vendor, v]) => ({
      vendor,
      pct: Math.round((v.online / v.total) * 100),
      online: v.online,
      total: v.total,
    }));
  }, [devices]);

  // Latencia de plataformas (radial)
  const platformLatency = useMemo(() => {
    return platforms.map((p, i) => ({
      name: p.vendor,
      latency: p.latencyMs,
      fill: COLORS[i % COLORS.length],
    })).sort((a, b) => b.latency - a.latency);
  }, [platforms]);

  // Radar de resiliencia (5 ejes)
  const resilience = useMemo(() => {
    const onlinePct = (devices.filter((d) => d.availability === "online").length / Math.max(devices.length, 1)) * 100;
    const localPct = (devices.filter((d) => d.localRoute).length / Math.max(devices.length, 1)) * 100;
    const matterPct = (devices.filter((d) => d.matterCompliant).length / Math.max(devices.length, 1)) * 100;
    const gwHealth = (gateways.filter((g) => g.status === "online").length / Math.max(gateways.length, 1)) * 100;
    const latencyScore = Math.max(0, 100 - platforms.reduce((s, p) => s + p.latencyMs, 0) / Math.max(platforms.length, 1) / 15);
    return [
      { axis: "Online", value: Math.round(onlinePct) },
      { axis: "Local-first", value: Math.round(localPct) },
      { axis: "Matter", value: Math.round(matterPct) },
      { axis: "Gateways", value: Math.round(gwHealth) },
      { axis: "Latencia", value: Math.round(latencyScore) },
    ];
  }, [devices, gateways, platforms]);

  // Distribución severidad actividad
  const severityMix = useMemo(() => {
    const counts = { info: 0, warn: 0, critical: 0 };
    activity.forEach((a) => {
      const s = (a.severity ?? "info") as keyof typeof counts;
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return [
      { name: "Info", value: counts.info, color: "#5BB37F" },
      { name: "Warn", value: counts.warn, color: "#D4A84B" },
      { name: "Critical", value: counts.critical, color: "#D9534F" },
    ].filter((s) => s.value > 0);
  }, [activity]);

  // Batería baja por dispositivo
  const batteryLow = useMemo(() => {
    return devices
      .map((d) => {
        const cap = d.capabilityIds.map((id) => capabilities[id]).find((c) => c?.kind === "battery");
        return cap ? { name: d.name, level: typeof cap.value === "number" ? cap.value : 100 } : null;
      })
      .filter((x): x is { name: string; level: number } => x !== null && x.level < 40)
      .sort((a, b) => a.level - b.level)
      .slice(0, 8);
  }, [devices, capabilities]);

  // Gateways carga (radial)
  const gatewayLoad = useMemo(() => {
    return gateways.map((g, i) => ({
      name: g.name,
      hosted: g.hostedDeviceIds.length,
      fill: g.status === "online" ? COLORS[i % COLORS.length] : "#D9534F",
    }));
  }, [gateways]);

  return (
    <div className="space-y-4">
      {/* Fila 1: latencia 24h + uptime 30d */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Latencia por bus · últimas 24h</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={latency}>
                <defs>
                  <linearGradient id="gCloud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D9534F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D9534F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E3DC" />
                <XAxis dataKey="hour" fontSize={10} interval={3} />
                <YAxis fontSize={10} unit="ms" />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="cloud" stroke="#D9534F" fill="url(#gCloud)" />
                <Line type="monotone" dataKey="zigbee" stroke="#D4A84B" dot={false} />
                <Line type="monotone" dataKey="local" stroke="#5BB37F" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Uptime · últimos 30 días</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={uptime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E3DC" />
                <XAxis dataKey="day" fontSize={9} interval={3} />
                <YAxis fontSize={10} domain={[95, 100]} unit="%" />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="uptime" stroke="#1E2A44" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Fila 2: radar resiliencia + disponibilidad por vendor */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Resiliencia global</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={resilience}>
                <PolarGrid stroke="#E6E3DC" />
                <PolarAngleAxis dataKey="axis" fontSize={11} />
                <PolarRadiusAxis domain={[0, 100]} fontSize={9} />
                <Radar name="Score" dataKey="value" stroke="#5BB37F" fill="#5BB37F" fillOpacity={0.35} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Disponibilidad por fabricante</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={vendorAvailability} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E3DC" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} fontSize={10} unit="%" />
                <YAxis dataKey="vendor" type="category" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ fontSize: 11 }}
                  formatter={(v: number, _n, item) => [`${v}% (${item.payload.online}/${item.payload.total})`, "Online"]}
                />
                <Bar dataKey="pct" fill="#5BB37F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Fila 3: latencia plataformas + severidad actividad */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Latencia por plataforma (ms)</CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart innerRadius="25%" outerRadius="95%" data={platformLatency} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="latency" background cornerRadius={6} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v} ms`, "Latencia"]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Severidad de eventos</CardTitle></CardHeader>
          <CardBody>
            {severityMix.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-ink-soft">Sin eventos</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={severityMix} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {severityMix.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Fila 4: batería baja + gateways carga */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Baterías bajas (&lt;40%)</CardTitle></CardHeader>
          <CardBody>
            {batteryLow.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-ink-soft">✅ Todas las baterías en buen estado</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={batteryLow} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E3DC" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} fontSize={10} unit="%" />
                  <YAxis dataKey="name" type="category" fontSize={9} width={110} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="level" radius={[0, 4, 4, 0]}>
                    {batteryLow.map((b, i) => (
                      <Cell key={i} fill={b.level < 15 ? "#D9534F" : b.level < 25 ? "#D4A84B" : "#5BB37F"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Carga por gateway</CardTitle></CardHeader>
          <CardBody>
            {gatewayLoad.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-ink-soft">Sin gateways</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gatewayLoad}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E3DC" />
                  <XAxis dataKey="name" fontSize={9} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="hosted" radius={[4, 4, 0, 0]}>
                    {gatewayLoad.map((g, i) => <Cell key={i} fill={g.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
