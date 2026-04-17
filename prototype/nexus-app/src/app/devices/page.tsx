"use client";

import { useState, useMemo } from "react";
import { useNexus, selectDevicesByPersona } from "@/lib/store";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { Card } from "@/components/ui/Card";
import { Search } from "lucide-react";
import type { DeviceKind, Vendor } from "@/lib/types";

const KINDS: (DeviceKind | "all")[] = ["all", "light", "switch", "sensor", "lock", "camera", "climate", "speaker", "valve", "cover"];

export default function DevicesPage() {
  const personaId = useNexus((s) => s.activePersonaId);
  const devices = selectDevicesByPersona(personaId);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<DeviceKind | "all">("all");
  const [vendor, setVendor] = useState<Vendor | "all">("all");

  const vendors = useMemo(() => Array.from(new Set(devices.map((d) => d.vendor))), [devices]);

  const filtered = devices.filter((d) => {
    if (kind !== "all" && d.kind !== kind) return false;
    if (vendor !== "all" && d.vendor !== vendor) return false;
    if (q && !d.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Dispositivos</h1>
        <p className="text-sm text-ink-soft mt-1">Inventario unificado · {devices.length} dispositivos</p>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-line">
          <Search size={16} className="text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar dispositivo..."
            className="bg-transparent flex-1 outline-none text-sm"
          />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value as DeviceKind | "all")}
          className="px-3 py-2 rounded-lg bg-surface border border-line text-sm">
          {KINDS.map((k) => <option key={k} value={k}>{k === "all" ? "Todos los tipos" : k}</option>)}
        </select>
        <select value={vendor} onChange={(e) => setVendor(e.target.value as Vendor | "all")}
          className="px-3 py-2 rounded-lg bg-surface border border-line text-sm">
          <option value="all">Todos los vendors</option>
          {vendors.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Card>

      <div className="text-sm text-ink-soft">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((d) => <DeviceCard key={d.id} device={d} />)}
      </div>
    </div>
  );
}
