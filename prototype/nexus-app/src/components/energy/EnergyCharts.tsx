"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceArea,
} from "recharts";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { useNexus, selectDevicesByPersona, selectRoomsByPersona } from "@/lib/store";
import {
  deviceInstantW, deviceCategoryLabel,
  CRC_PER_KWH, CO2_KG_PER_KWH,
} from "@/lib/device-energy";

const COLORS = ["#D4A84B", "#5BB37F", "#1E2A44", "#B08968", "#8B95A8", "#D9534F", "#A8C090", "#E0A537", "#6B8FA8", "#B34040"];

// Curva de demanda por hora — modela hábitos típicos de una residencia CR.
function hourlyProfile(totalW: number) {
  return Array.from({ length: 24 }, (_, h) => {
    // Base load (refri, calentador, cámaras, standby)
    const base = 0.28;
    // Mañana: desayuno 6-9
    const morning = Math.exp(-Math.pow(h - 7, 2) / 3) * 0.35;
    // Mediodía: almuerzo 12-14
    const noon = Math.exp(-Math.pow(h - 13, 2) / 2.5) * 0.4;
    // Pico tarde-noche: cena, TV, AC 18-22
    const evening = Math.exp(-Math.pow(h - 20, 2) / 5) * 0.9;
    // EV charging 0-6 (tarifa nocturna)
    const ev = h < 6 ? 0.55 : 0;
    const factor = base + morning + noon + evening + ev;
    const watts = Math.round(totalW * factor * 0.85);
    const offPeak = h < 6 || h >= 22;
    const peak = (h >= 10 && h < 14) || (h >= 17 && h < 20);
    return {
      hour: `${String(h).padStart(2, "0")}h`,
      watts,
      kwh: +((watts / 1000).toFixed(2)),
      cost: Math.round((watts / 1000) * (peak ? 120 : offPeak ? 75 : CRC_PER_KWH)),
      tariff: peak ? "pico" : offPeak ? "valle" : "medio",
    };
  });
}

function weeklyTrend(avgDailyKwh: number) {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return days.map((d, i) => {
    const wknd = i >= 5 ? 1.25 : 1;
    const jitter = 0.85 + Math.random() * 0.3;
    const kwh = +(avgDailyKwh * wknd * jitter).toFixed(1);
    return { day: d, kwh, cost: Math.round(kwh * CRC_PER_KWH) };
  });
}

function monthlyTrend(monthlyKwh: number) {
  return Array.from({ length: 30 }, (_, i) => {
    const daily = monthlyKwh / 30;
    const jitter = 0.8 + Math.random() * 0.4;
    return {
      day: `D${i + 1}`,
      kwh: +(daily * jitter).toFixed(1),
      acumulado: +(daily * jitter * (i + 1)).toFixed(1),
    };
  });
}

export function EnergyCharts() {
  const personaId = useNexus((s) => s.activePersonaId);
  const devices = selectDevicesByPersona(personaId);
  const rooms = selectRoomsByPersona(personaId);
  const capabilities = useNexus((s) => s.capabilities);

  const totalW = useMemo(
    () => devices.reduce((s, d) => s + deviceInstantW(d, capabilities), 0),
    [devices, capabilities],
  );

  const hourly = useMemo(() => hourlyProfile(totalW), [totalW]);
  const dailyKwh = hourly.reduce((s, h) => s + h.kwh, 0);
  const weekly = useMemo(() => weeklyTrend(dailyKwh), [dailyKwh]);
  const monthly = useMemo(() => monthlyTrend(dailyKwh * 30), [dailyKwh]);

  // Top 10 consumidores
  const topConsumers = useMemo(() => {
    return devices
      .map((d) => ({
        id: d.id,
        name: d.name,
        watts: deviceInstantW(d, capabilities),
        category: deviceCategoryLabel(d),
        room: rooms.find((r) => r.id === d.roomId)?.name ?? "—",
      }))
      .filter((d) => d.watts > 0)
      .sort((a, b) => b.watts - a.watts)
      .slice(0, 10);
  }, [devices, capabilities, rooms]);

  // Por habitación
  const byRoom = useMemo(() => {
    const map = new Map<string, number>();
    devices.forEach((d) => {
      const w = deviceInstantW(d, capabilities);
      if (w <= 0) return;
      const name = rooms.find((r) => r.id === d.roomId)?.name ?? "Otros";
      map.set(name, (map.get(name) ?? 0) + w);
    });
    return Array.from(map.entries())
      .map(([name, watts]) => ({ name, watts }))
      .sort((a, b) => b.watts - a.watts);
  }, [devices, capabilities, rooms]);

  // Por categoría
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    devices.forEach((d) => {
      const w = deviceInstantW(d, capabilities);
      if (w <= 0) return;
      const cat = deviceCategoryLabel(d);
      map.set(cat, (map.get(cat) ?? 0) + w);
    });
    return Array.from(map.entries())
      .map(([name, watts]) => ({ name, watts, pct: Math.round((watts / Math.max(totalW, 1)) * 100) }))
      .sort((a, b) => b.watts - a.watts);
  }, [devices, capabilities, totalW]);

  // Distribución tarifaria (pico/valle/medio)
  const tariffBreakdown = useMemo(() => {
    const grp = { pico: 0, medio: 0, valle: 0 };
    hourly.forEach((h) => {
      grp[h.tariff as "pico" | "medio" | "valle"] += h.kwh;
    });
    return [
      { name: "Pico (10-14, 17-20)", value: +grp.pico.toFixed(1), color: "#D9534F" },
      { name: "Medio", value: +grp.medio.toFixed(1), color: "#D4A84B" },
      { name: "Valle (22-6)", value: +grp.valle.toFixed(1), color: "#5BB37F" },
    ];
  }, [hourly]);

  // CO2 30 días acumulado
  const co2Trend = useMemo(() => {
    return monthly.map((m, i) => ({
      day: m.day,
      co2: +(m.acumulado * CO2_KG_PER_KWH).toFixed(1),
    }));
  }, [monthly]);

  const peakW = Math.max(...hourly.map((h) => h.watts));

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Curva de demanda 24h */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Curva de demanda 24h</CardTitle>
          <p className="text-xs text-ink-soft mt-1">
            Pico: {peakW.toLocaleString("es-CR")} W · Franjas tarifarias ICE (pico ₡120 · medio ₡95 · valle ₡75 / kWh)
          </p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={hourly}>
              <defs>
                <linearGradient id="demand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A84B" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#D4A84B" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="hour" stroke="var(--ink-soft)" fontSize={11} />
              <YAxis stroke="var(--ink-soft)" fontSize={11} unit="W" />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => name === "watts" ? [`${v} W`, "Consumo"] : [v, name]}
              />
              <ReferenceArea x1="10h" x2="14h" fill="#D9534F" fillOpacity={0.06} />
              <ReferenceArea x1="17h" x2="20h" fill="#D9534F" fillOpacity={0.06} />
              <ReferenceArea x1="22h" x2="23h" fill="#5BB37F" fillOpacity={0.06} />
              <ReferenceArea x1="00h" x2="06h" fill="#5BB37F" fillOpacity={0.06} />
              <Area type="monotone" dataKey="watts" stroke="#D4A84B" fill="url(#demand)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Top 10 consumidores */}
      <Card>
        <CardHeader><CardTitle>Top 10 consumidores ahora</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topConsumers} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
              <XAxis type="number" stroke="var(--ink-soft)" fontSize={11} unit=" W" />
              <YAxis dataKey="name" type="category" stroke="var(--ink-soft)" fontSize={10} width={140} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} W`, "Consumo"]}
              />
              <Bar dataKey="watts" fill="#D4A84B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Consumo por categoría */}
      <Card>
        <CardHeader><CardTitle>Consumo por categoría</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="watts"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={55}
                label={(e) => `${e.name}: ${e.pct}%`}
                labelLine={false}
                fontSize={11}
              >
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} W`, "Consumo"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Consumo por habitación */}
      <Card>
        <CardHeader><CardTitle>Consumo por habitación</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byRoom.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
              <XAxis type="number" stroke="var(--ink-soft)" fontSize={11} unit=" W" />
              <YAxis dataKey="name" type="category" stroke="var(--ink-soft)" fontSize={11} width={110} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} W`, "Consumo"]}
              />
              <Bar dataKey="watts" fill="#5BB37F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Tendencia semanal */}
      <Card>
        <CardHeader><CardTitle>Tendencia semanal (kWh)</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="day" stroke="var(--ink-soft)" fontSize={11} />
              <YAxis stroke="var(--ink-soft)" fontSize={11} unit=" kWh" />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, n: string) => n === "kwh" ? [`${v} kWh`, "Consumo"] : [`₡${v.toLocaleString("es-CR")}`, "Costo"]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="kwh" fill="#D4A84B" radius={[4, 4, 0, 0]} name="kWh" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Distribución tarifaria */}
      <Card>
        <CardHeader><CardTitle>Distribución por franja tarifaria</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={tariffBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(e) => `${e.value} kWh`}
                fontSize={11}
              >
                {tariffBreakdown.map((t, i) => (
                  <Cell key={i} fill={t.color} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} kWh`, "Consumo"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Consumo acumulado 30 días */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Consumo y CO₂ acumulado (30 días)</CardTitle>
          <p className="text-xs text-ink-soft mt-1">
            Proyección mensual basada en el patrón de los últimos 30 días · Factor CR: {CO2_KG_PER_KWH} kg CO₂/kWh
          </p>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly.map((m, i) => ({ ...m, co2: co2Trend[i].co2 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="day" stroke="var(--ink-soft)" fontSize={10} />
              <YAxis yAxisId="kwh" stroke="var(--ink-soft)" fontSize={11} unit=" kWh" />
              <YAxis yAxisId="co2" orientation="right" stroke="var(--ink-soft)" fontSize={11} unit=" kg" />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="kwh" type="monotone" dataKey="acumulado" stroke="#D4A84B" strokeWidth={2} dot={false} name="kWh acumulado" />
              <Line yAxisId="co2" type="monotone" dataKey="co2" stroke="#5BB37F" strokeWidth={2} dot={false} name="CO₂ kg" />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}
