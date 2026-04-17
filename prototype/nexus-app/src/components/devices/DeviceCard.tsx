"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { DeviceIcon } from "./DeviceIcon";
import { useNexus, STATIC } from "@/lib/store";
import type { Device } from "@/lib/types";
import {
  Cloud, Radio, BatteryLow, Zap, Wifi, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  getDeviceCategory,
  getDeviceLiveStats,
  formatLastSeen,
  formatWatts,
} from "@/lib/device-taxonomy";

const VENDOR_TONE = {
  tuya: "gold",
  smartthings: "sage",
  ubiquiti: "ok",
  crestron: "neutral",
  rainbird: "sage",
  sonos: "gold",
  "home-assistant": "neutral",
} as const;

const PROTOCOL_LABEL: Record<string, string> = {
  wifi: "Wi-Fi",
  zigbee: "Zigbee",
  zwave: "Z-Wave",
  matter: "Matter",
  thread: "Thread",
  mqtt: "MQTT",
  rest: "REST",
  ble: "BLE",
};

function batteryTone(pct: number): string {
  if (pct < 20) return "bg-status-critical";
  if (pct < 40) return "bg-status-warn";
  return "bg-status-ok";
}

export function DeviceCard({ device }: { device: Device }) {
  const capabilities = useNexus((s) => s.capabilities);
  const toggleDevice = useNexus((s) => s.toggleDevice);
  const role = useNexus((s) => s.activeRole);

  const stats = getDeviceLiveStats(device, capabilities);
  const category = getDeviceCategory(device);
  const catMeta = CATEGORY_META[category];
  const room = STATIC.rooms.find((r) => r.id === device.roomId);
  const floor = STATIC.floors.find((f) => f.id === device.floorId);
  const labels = device.labelIds
    .map((id) => STATIC.labels.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => !!l);

  const offline = device.availability === "offline";
  const canControl = role !== "viewer";

  const onOffCapId = device.capabilityIds.find((id) => capabilities[id]?.kind === "on_off");

  return (
    <Card className={cn(
      "p-4 flex flex-col gap-3 transition relative overflow-hidden",
      offline && "opacity-70",
      stats.isOn && !offline && "ring-1 ring-gold/30",
    )}>
      {/* Acento lateral de categoría */}
      <span aria-hidden className={cn("absolute left-0 top-0 bottom-0 w-1", catMeta.bgTone)} />

      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          stats.isOn ? "bg-gold/15 text-gold-border" : `${catMeta.bgTone} ${catMeta.tone}`,
        )}>
          <DeviceIcon kind={device.kind} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" title={device.name}>{device.name}</div>
          <div className="text-[11px] text-ink-soft truncate">
            {room?.name ?? "—"}{floor ? ` · ${floor.name}` : ""}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge tone="neutral" className={catMeta.tone}>{catMeta.label}</Badge>
            <Badge tone={VENDOR_TONE[device.vendor]}>{device.vendor}</Badge>
            {device.matterCompliant && <Badge tone="sage">Matter</Badge>}
          </div>
        </div>
        {onOffCapId && stats.hasOnOff && (
          <Switch
            checked={stats.isOn}
            disabled={offline || !canControl}
            onChange={() => toggleDevice(device.id)}
            ariaLabel={`${stats.isOn ? "Apagar" : "Encender"} ${device.name}`}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface border border-line",
          offline ? "text-status-critical" : "text-status-ok",
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", offline ? "bg-status-critical" : "bg-status-ok")} />
          {offline ? "Offline" : "Online"}
          <span className="text-ink-soft ml-auto">{formatLastSeen(stats.lastSeenMin)}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface border border-line text-ink-soft">
          {device.localRoute ? <Radio size={11} className="text-status-ok" /> : <Cloud size={11} className="text-smoke" />}
          <Wifi size={10} />
          <span className="truncate">{PROTOCOL_LABEL[device.protocol] ?? device.protocol}</span>
        </div>

        {stats.battery !== null && (
          <div className="col-span-2 flex items-center gap-2 px-2 py-1 rounded-md bg-surface border border-line">
            {stats.batteryLow ? <BatteryLow size={12} className="text-status-critical" /> : <span className="text-[10px]">🔋</span>}
            <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", batteryTone(stats.battery))}
                style={{ width: `${stats.battery}%` }}
              />
            </div>
            <span className={cn("tabular-nums", stats.batteryLow ? "text-status-critical font-medium" : "text-ink-soft")}>
              {stats.battery}%
            </span>
          </div>
        )}

        {stats.thermostat && (
          <div className="col-span-2 flex items-center gap-2 px-2 py-1 rounded-md bg-surface border border-line text-ink-soft">
            <span>🌡️</span>
            <span className="font-medium text-ink">{stats.thermostat.current ?? "—"}°C</span>
            <span className="text-[10px]">ahora</span>
            <span className="ml-auto">
              → {stats.thermostat.target ?? "—"}°C
              <span className="ml-1 uppercase text-[10px]">({stats.thermostat.mode ?? "off"})</span>
            </span>
          </div>
        )}

        {stats.dim !== null && stats.isOn && (
          <div className="col-span-2 flex items-center gap-2 px-2 py-1 rounded-md bg-surface border border-line text-ink-soft">
            <span>💡</span>
            <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${stats.dim}%` }} />
            </div>
            <span className="tabular-nums">{stats.dim}%</span>
          </div>
        )}

        {stats.watts > 0 && (
          <div className={cn(
            "col-span-2 flex items-center gap-1.5 px-2 py-1 rounded-md border",
            stats.highConsumption
              ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
              : "bg-surface border-line text-ink-soft",
          )}>
            <Zap size={11} />
            <span className="font-medium">{formatWatts(stats.watts)}</span>
            <span className="text-[10px]">estimado</span>
            {stats.highConsumption && <AlertTriangle size={11} className="ml-auto" aria-label="Alto consumo" />}
          </div>
        )}
      </div>

      {labels.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {labels.slice(0, 4).map((l) => (
            <span
              key={l.id}
              className="text-[10px] px-1.5 py-0.5 rounded border"
              style={{ color: l.color, borderColor: `${l.color}40`, backgroundColor: `${l.color}12` }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
