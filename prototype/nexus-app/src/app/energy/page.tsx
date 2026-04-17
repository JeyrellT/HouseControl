"use client";

import { useMemo, useState } from "react";
import { useNexus, selectDevicesByPersona, selectRoomsByPersona } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { KPI } from "@/components/ui/KPI";
import { Badge } from "@/components/ui/Badge";
import { EnergyCharts } from "@/components/energy/EnergyCharts";
import { EnergyAIInsight } from "@/components/energy/EnergyAIInsight";
import {
  deviceInstantW, deviceCategoryLabel, DEVICE_PROFILES,
  CRC_PER_KWH, CO2_KG_PER_KWH,
} from "@/lib/device-energy";
import {
  Zap, TrendingDown, DollarSign, Leaf, Activity, Gauge,
  Lightbulb, PlugZap, ArrowUpDown,
} from "lucide-react";

type SortKey = "watts" | "name" | "room" | "category";

export default function EnergyPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const devices = selectDevicesByPersona(personaId);
  const rooms = selectRoomsByPersona(personaId);
  const capabilities = useNexus((s) => s.capabilities);
  const [sortKey, setSortKey] = useState<SortKey>("watts");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("todos");

  const rows = useMemo(() => {
    return devices.map((d) => {
      const watts = deviceInstantW(d, capabilities);
      const profile = DEVICE_PROFILES[d.id];
      const category = deviceCategoryLabel(d);
      const room = rooms.find((r) => r.id === d.roomId)?.name ?? "—";
      const kwhDay = +((watts * 24) / 1000).toFixed(2);
      const kwhMonth = +(kwhDay * 30).toFixed(1);
      const costMonth = Math.round(kwhMonth * CRC_PER_KWH);
      return {
        id: d.id, name: d.name, kind: d.kind, vendor: d.vendor, room,
        watts, category, kwhDay, kwhMonth, costMonth,
        rated: profile?.ratedW ?? 0, always: !!profile?.always,
      };
    });
  }, [devices, capabilities, rooms]);

  const totalW = rows.reduce((s, r) => s + r.watts, 0);
  const activeRows = rows.filter((r) => r.watts > 0);
  const dailyKwh = +(totalW * 24 / 1000).toFixed(1);
  const monthlyKwh = +(dailyKwh * 30).toFixed(0);
  const monthlyCRC = Math.round(monthlyKwh * CRC_PER_KWH);
  const co2Month = +(monthlyKwh * CO2_KG_PER_KWH).toFixed(1);
  const peakEstimate = Math.round(totalW * 1.4);

  const savingsPotW = activeRows
    .filter((r) => r.category === "entretenimiento" || r.category === "oficina" ||
      (r.category === "iluminación" && r.watts > 0))
    .reduce((s, r) => s + r.watts, 0);
  const savingsPctMonth = Math.round((savingsPotW / Math.max(totalW, 1)) * 100);
  const savingsCRC = Math.round((savingsPotW * 24 * 30 / 1000) * CRC_PER_KWH * 0.6);

  const categories = useMemo(() => {
    const set = new Set(activeRows.map((r) => r.category));
    return ["todos", ...Array.from(set)];
  }, [activeRows]);

  const filteredSorted = useMemo(() => {
    let out = activeRows;
    if (filterCat !== "todos") out = out.filter((r) => r.category === filterCat);
    out = [...out].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "watts") cmp = a.watts - b.watts;
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "room") cmp = a.room.localeCompare(b.room);
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      return sortAsc ? cmp : -cmp;
    });
    return out;
  }, [activeRows, filterCat, sortKey, sortAsc]);

  const setSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc(!sortAsc);
    else { setSortKey(k); setSortAsc(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Energía</h1>
          <p className="text-sm text-ink-soft mt-1">
            Consumo instantáneo, patrones diarios y análisis IA · Tarifa ICE residencial · Factor CO₂ CR
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge tone="gold">{activeRows.length} consumiendo</Badge>
          <Badge tone="neutral">{devices.length} totales</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Consumo actual" value={`${totalW.toLocaleString("es-CR")} W`}
          hint={`${activeRows.length} dispositivos activos`} icon={Zap} tone="gold" />
        <KPI label="Pico estimado" value={`${peakEstimate.toLocaleString("es-CR")} W`}
          hint="Cuando todo coincide" icon={Activity} tone="warn" />
        <KPI label="Consumo diario" value={`${dailyKwh} kWh`}
          hint={`≈ ₡${Math.round(dailyKwh * CRC_PER_KWH).toLocaleString("es-CR")} / día`}
          icon={TrendingDown} tone="neutral" />
        <KPI label="Consumo mensual" value={`${monthlyKwh.toLocaleString("es-CR")} kWh`}
          hint="Proyección 30 días" icon={Gauge} tone="neutral" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Costo mensual" value={`₡${monthlyCRC.toLocaleString("es-CR")}`}
          hint={`@ ₡${CRC_PER_KWH}/kWh promedio`} icon={DollarSign} tone="ok" />
        <KPI label="CO₂ mensual" value={`${co2Month} kg`}
          hint={`@ ${CO2_KG_PER_KWH} kg/kWh CR`} icon={Leaf} tone="ok" />
        <KPI label="Ahorro potencial" value={`₡${savingsCRC.toLocaleString("es-CR")}`}
          hint={`${savingsPctMonth}% del consumo es evitable`} icon={PlugZap} tone="gold" />
        <KPI label="Siempre encendidos" value={rows.filter((r) => r.always).length}
          hint="Standby, refri, cámaras" icon={Lightbulb} tone="neutral" />
      </div>

      <EnergyAIInsight />

      <EnergyCharts />

      <Card>
        <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle>Detalle por dispositivo ({filteredSorted.length})</CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-ink-soft">Categoría:</label>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-2 py-1 rounded-lg bg-surface-2 border border-line text-xs"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-b border-line">
                  <th className="py-2 pr-3 cursor-pointer hover:text-ink" onClick={() => setSort("name")}>
                    <span className="inline-flex items-center gap-1">Dispositivo <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                  <th className="py-2 pr-3 cursor-pointer hover:text-ink" onClick={() => setSort("room")}>
                    <span className="inline-flex items-center gap-1">Habitación <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                  <th className="py-2 pr-3 cursor-pointer hover:text-ink" onClick={() => setSort("category")}>
                    <span className="inline-flex items-center gap-1">Categoría <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                  <th className="py-2 pr-3 text-right cursor-pointer hover:text-ink" onClick={() => setSort("watts")}>
                    <span className="inline-flex items-center gap-1">W ahora <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                  <th className="py-2 pr-3 text-right">kWh/día</th>
                  <th className="py-2 pr-3 text-right">kWh/mes</th>
                  <th className="py-2 pr-3 text-right">% total</th>
                  <th className="py-2 text-right">Costo/mes</th>
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((r) => {
                  const pct = (r.watts / Math.max(totalW, 1)) * 100;
                  const isBig = r.watts >= 500;
                  return (
                    <tr key={r.id} className="border-b border-line/50 hover:bg-surface-2/30">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.name}</span>
                          {r.always && <Badge tone="neutral" className="text-[9px]">24/7</Badge>}
                        </div>
                        <div className="text-[10px] text-ink-soft">{r.vendor}</div>
                      </td>
                      <td className="py-2 pr-3 text-ink-soft">{r.room}</td>
                      <td className="py-2 pr-3">
                        <Badge tone={isBig ? "warn" : "neutral"} className="text-[10px] capitalize">
                          {r.category}
                        </Badge>
                      </td>
                      <td className={`py-2 pr-3 text-right tabular-nums font-medium ${isBig ? "text-gold-border" : ""}`}>
                        {r.watts.toLocaleString("es-CR")}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-ink-soft">{r.kwhDay}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{r.kwhMonth}</td>
                      <td className="py-2 pr-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                            <div className="h-full bg-gold" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-xs tabular-nums">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        ₡{r.costMonth.toLocaleString("es-CR")}
                      </td>
                    </tr>
                  );
                })}
                {filteredSorted.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-ink-soft text-sm">
                    Sin dispositivos consumiendo en esta categoría.
                  </td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line font-semibold text-xs">
                  <td colSpan={3} className="py-3 pr-3 text-ink-soft uppercase tracking-wide">Total</td>
                  <td className="py-3 pr-3 text-right tabular-nums text-gold-border">
                    {filteredSorted.reduce((s, r) => s + r.watts, 0).toLocaleString("es-CR")} W
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums">
                    {filteredSorted.reduce((s, r) => s + r.kwhDay, 0).toFixed(1)}
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums">
                    {filteredSorted.reduce((s, r) => s + r.kwhMonth, 0).toFixed(0)}
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums">
                    {((filteredSorted.reduce((s, r) => s + r.watts, 0) / Math.max(totalW, 1)) * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    ₡{filteredSorted.reduce((s, r) => s + r.costMonth, 0).toLocaleString("es-CR")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Referencias y tarifa</CardTitle></CardHeader>
        <CardBody>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <div className="text-ink-soft uppercase tracking-wide">Tarifa residencial ICE</div>
              <div>Bloque 1 (0–200 kWh): ₡85/kWh</div>
              <div>Bloque 2 (201–300 kWh): ₡115/kWh</div>
              <div>Bloque 3 (&gt;300 kWh): ₡145/kWh</div>
              <div className="text-ink-soft">Promedio usado: ₡{CRC_PER_KWH}/kWh</div>
            </div>
            <div className="space-y-1">
              <div className="text-ink-soft uppercase tracking-wide">Franjas horarias</div>
              <div><span className="text-critical">Pico</span>: 10–14h, 17–20h · ₡120</div>
              <div><span className="text-gold-border">Medio</span>: resto · ₡95</div>
              <div><span className="text-status-ok">Valle</span>: 22–06h · ₡75</div>
              <div className="text-ink-soft">EV/calentador programables off-peak ahorran ~35%</div>
            </div>
            <div className="space-y-1">
              <div className="text-ink-soft uppercase tracking-wide">Factor CO₂ Costa Rica</div>
              <div>{CO2_KG_PER_KWH} kg CO₂ / kWh</div>
              <div className="text-ink-soft">~99% renovable (hidro/eólico/geotérmico)</div>
              <div>Tu mes: {co2Month} kg · ≈ {(co2Month / 21).toFixed(1)} árboles</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
