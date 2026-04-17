"use client";

import { useState, useMemo } from "react";
import { useNexus, selectDevicesByPersona, STATIC } from "@/lib/store";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { Card } from "@/components/ui/Card";
import {
  Search, Lightbulb, Thermometer, Shield, DoorOpen, Tv,
  WashingMachine, Activity, Droplets, Plug, Zap, WifiOff,
  BatteryLow, Power, CheckCircle2, AlertTriangle,
} from "lucide-react";
import type { Device, Vendor } from "@/lib/types";
import {
  CATEGORY_META,
  getDeviceCategory,
  getDeviceLiveStats,
  groupDevices,
  type DeviceCategory,
} from "@/lib/device-taxonomy";
import { cn } from "@/lib/utils";

const CATEGORY_ICON = {
  Lightbulb, Thermometer, Shield, DoorOpen, Tv,
  WashingMachine, Activity, Droplets, Plug,
} as const;

type GroupMode = "category" | "room" | "floor" | "vendor" | "status";

const GROUP_MODES: { id: GroupMode; label: string }[] = [
  { id: "category", label: "Por categoría" },
  { id: "room", label: "Por habitación" },
  { id: "floor", label: "Por planta" },
  { id: "vendor", label: "Por marca" },
  { id: "status", label: "Por estado" },
];

export default function DevicesPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const capabilities = useNexus((s) => s.capabilities);
  const devices = selectDevicesByPersona(personaId);

  const [q, setQ] = useState("");
  const [selectedCats, setSelectedCats] = useState<Set<DeviceCategory>>(new Set());
  const [vendor, setVendor] = useState<Vendor | "all">("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("category");

  const vendors = useMemo(() => Array.from(new Set(devices.map((d) => d.vendor))), [devices]);

  // Estadísticas globales (sobre TODOS los dispositivos de la persona, sin filtros)
  const kpis = useMemo(() => {
    let online = 0, offline = 0, lowBat = 0, highNow = 0, wattsNow = 0;
    for (const d of devices) {
      if (d.availability === "offline") offline++; else online++;
      const s = getDeviceLiveStats(d, capabilities);
      if (s.batteryLow) lowBat++;
      if (s.isOn) wattsNow += s.watts;
      if (s.isOn && s.highConsumption) highNow++;
    }
    return { total: devices.length, online, offline, lowBat, highNow, wattsNow };
  }, [devices, capabilities]);

  // Cuentas por categoría (sobre dispositivos sin filtros)
  const categoryCounts = useMemo(() => {
    const counts: Record<DeviceCategory, number> = {
      lighting: 0, climate: 0, security: 0, access: 0, entertainment: 0,
      appliance: 0, sensor: 0, irrigation: 0, utility: 0,
    };
    for (const d of devices) counts[getDeviceCategory(d)]++;
    return counts;
  }, [devices]);

  const filtered = devices.filter((d) => {
    if (selectedCats.size > 0 && !selectedCats.has(getDeviceCategory(d))) return false;
    if (vendor !== "all" && d.vendor !== vendor) return false;
    if (q) {
      const needle = q.toLowerCase();
      const room = STATIC.rooms.find((r) => r.id === d.roomId);
      const hay = `${d.name} ${d.vendor} ${room?.name ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const sections = useMemo(() => {
    if (groupMode === "category") {
      return groupDevices(
        filtered,
        (d) => getDeviceCategory(d),
        (k) => CATEGORY_META[k].order,
      ).map((sec) => ({ key: sec.key, label: CATEGORY_META[sec.key].label, items: sec.items }));
    }
    if (groupMode === "room") {
      const groups = groupDevices(filtered, (d) => d.roomId);
      return groups
        .map((g) => ({
          key: g.key,
          label: STATIC.rooms.find((r) => r.id === g.key)?.name ?? g.key,
          items: g.items,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    if (groupMode === "floor") {
      const groups = groupDevices(filtered, (d) => d.floorId);
      return groups
        .map((g) => ({
          key: g.key,
          label: STATIC.floors.find((f) => f.id === g.key)?.name ?? g.key,
          items: g.items,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    if (groupMode === "vendor") {
      const groups = groupDevices(filtered, (d) => d.vendor);
      return groups
        .map((g) => ({ key: g.key, label: String(g.key), items: g.items }))
        .sort((a, b) => b.items.length - a.items.length);
    }
    // status
    const sec: { key: string; label: string; items: Device[] }[] = [
      { key: "offline", label: "Offline", items: [] },
      { key: "lowbat", label: "Batería baja", items: [] },
      { key: "on", label: "Encendidos ahora", items: [] },
      { key: "high", label: "Alto consumo activo", items: [] },
      { key: "idle", label: "En reposo", items: [] },
    ];
    for (const d of filtered) {
      const s = getDeviceLiveStats(d, capabilities);
      if (d.availability === "offline") { sec[0].items.push(d); continue; }
      if (s.batteryLow) { sec[1].items.push(d); continue; }
      if (s.isOn && s.highConsumption) { sec[3].items.push(d); continue; }
      if (s.isOn) { sec[2].items.push(d); continue; }
      sec[4].items.push(d);
    }
    return sec.filter((s) => s.items.length > 0);
  }, [filtered, groupMode, capabilities]);

  const toggleCat = (c: DeviceCategory) =>
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Dispositivos</h1>
        <p className="text-sm text-ink-soft mt-1">
          Inventario unificado · {kpis.total} dispositivos · {kpis.online} online
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiTile icon={<CheckCircle2 size={16} />} label="Online" value={`${kpis.online}/${kpis.total}`} tone="ok" />
        <KpiTile icon={<WifiOff size={16} />} label="Offline" value={String(kpis.offline)} tone={kpis.offline > 0 ? "critical" : "neutral"} />
        <KpiTile icon={<BatteryLow size={16} />} label="Batería baja" value={String(kpis.lowBat)} tone={kpis.lowBat > 0 ? "warn" : "neutral"} />
        <KpiTile icon={<Zap size={16} />} label="Consumo ahora" value={kpis.wattsNow >= 1000 ? `${(kpis.wattsNow / 1000).toFixed(1)} kW` : `${kpis.wattsNow} W`} tone="gold" />
        <KpiTile icon={<AlertTriangle size={16} />} label="Alto consumo activo" value={String(kpis.highNow)} tone={kpis.highNow > 0 ? "warn" : "neutral"} />
      </div>

      {/* Categorías como chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCats(new Set())}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition",
            selectedCats.size === 0
              ? "bg-gold/15 border-gold/40 text-gold-border"
              : "bg-surface border-line text-ink-soft hover:text-ink",
          )}
        >
          Todas ({kpis.total})
        </button>
        {(Object.keys(CATEGORY_META) as DeviceCategory[])
          .sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order)
          .filter((c) => categoryCounts[c] > 0)
          .map((c) => {
            const meta = CATEGORY_META[c];
            const Icon = CATEGORY_ICON[meta.icon];
            const active = selectedCats.has(c);
            return (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition",
                  active
                    ? `${meta.bgTone} ${meta.tone} border-current`
                    : "bg-surface border-line text-ink-soft hover:text-ink",
                )}
              >
                <Icon size={13} />
                {meta.label}
                <span className="opacity-70 tabular-nums">{categoryCounts[c]}</span>
              </button>
            );
          })}
      </div>

      {/* Barra de búsqueda + filtros */}
      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-line">
          <Search size={16} className="text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, vendor o habitación…"
            aria-label="Buscar dispositivo"
            className="bg-transparent flex-1 outline-none text-sm"
          />
        </div>
        <select
          aria-label="Filtrar por marca"
          value={vendor}
          onChange={(e) => setVendor(e.target.value as Vendor | "all")}
          className="px-3 py-2 rounded-lg bg-surface border border-line text-sm"
        >
          <option value="all">Todas las marcas</option>
          {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          aria-label="Agrupar por"
          value={groupMode}
          onChange={(e) => setGroupMode(e.target.value as GroupMode)}
          className="px-3 py-2 rounded-lg bg-surface border border-line text-sm"
        >
          {GROUP_MODES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
      </Card>

      <div className="text-sm text-ink-soft flex items-center gap-2">
        <span>{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
        {selectedCats.size > 0 && (
          <button
            onClick={() => setSelectedCats(new Set())}
            className="text-xs px-2 py-0.5 rounded-full bg-surface border border-line hover:text-ink"
          >
            Limpiar categorías ({selectedCats.size})
          </button>
        )}
      </div>

      {/* Secciones */}
      <div className="space-y-8">
        {sections.length === 0 && (
          <Card className="p-8 text-center text-ink-soft">
            Sin dispositivos que coincidan con los filtros actuales.
          </Card>
        )}
        {sections.map((sec) => (
          <section key={String(sec.key)} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-display uppercase tracking-wide text-ink-soft">
              <SectionBullet mode={groupMode} sectionKey={String(sec.key)} />
              {sec.label}
              <span className="text-ink-soft/60 normal-case tracking-normal">· {sec.items.length}</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sec.items.map((d) => <DeviceCard key={d.id} device={d} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function KpiTile({
  icon, label, value, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "ok" | "warn" | "critical" | "gold" | "neutral";
}) {
  const toneClass =
    tone === "ok" ? "text-status-ok" :
    tone === "warn" ? "text-status-warn" :
    tone === "critical" ? "text-status-critical" :
    tone === "gold" ? "text-gold-border" :
    "text-ink-soft";
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-soft">
        <span className={toneClass}>{icon}</span>
        {label}
      </div>
      <div className={cn("font-display text-xl mt-1", toneClass)}>{value}</div>
    </Card>
  );
}

function SectionBullet({ mode, sectionKey }: { mode: GroupMode; sectionKey: string }) {
  if (mode === "category" && sectionKey in CATEGORY_META) {
    const meta = CATEGORY_META[sectionKey as DeviceCategory];
    const Icon = CATEGORY_ICON[meta.icon];
    return (
      <span className={cn("w-6 h-6 rounded-md flex items-center justify-center", meta.bgTone, meta.tone)}>
        <Icon size={13} />
      </span>
    );
  }
  if (mode === "status") {
    const iconMap: Record<string, React.ReactNode> = {
      offline: <WifiOff size={13} className="text-status-critical" />,
      lowbat: <BatteryLow size={13} className="text-status-warn" />,
      on: <Power size={13} className="text-gold-border" />,
      high: <AlertTriangle size={13} className="text-orange-400" />,
      idle: <CheckCircle2 size={13} className="text-ink-soft" />,
    };
    return <span className="w-6 h-6 rounded-md bg-surface flex items-center justify-center">{iconMap[sectionKey]}</span>;
  }
  return <span className="w-1.5 h-1.5 rounded-full bg-gold/70" />;
}
