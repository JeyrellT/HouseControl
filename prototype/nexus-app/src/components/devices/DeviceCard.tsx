"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { DeviceIcon } from "./DeviceIcon";
import { useNexus } from "@/lib/store";
import type { Device } from "@/lib/types";
import { Cloud, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const VENDOR_TONE = {
  tuya: "gold",
  smartthings: "sage",
  ubiquiti: "ok",
  crestron: "neutral",
  rainbird: "sage",
  sonos: "gold",
  "home-assistant": "neutral",
} as const;

export function DeviceCard({ device }: { device: Device }) {
  const capabilities = useNexus((s) => s.capabilities);
  const toggleDevice = useNexus((s) => s.toggleDevice);
  const role = useNexus((s) => s.activeRole);

  const onOffCap = device.capabilityIds
    .map((id) => capabilities[id])
    .find((c) => c?.kind === "on_off");
  const dimCap = device.capabilityIds
    .map((id) => capabilities[id])
    .find((c) => c?.kind === "dim");
  const battery = device.capabilityIds
    .map((id) => capabilities[id])
    .find((c) => c?.kind === "battery");

  const isOn = !!onOffCap?.value;
  const offline = device.availability === "offline";
  const canControl = role !== "viewer";

  return (
    <Card className={cn("p-4 flex flex-col gap-3 transition", offline && "opacity-60")}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          isOn ? "bg-gold/15 text-gold-border" : "bg-surface text-ink-soft",
        )}>
          <DeviceIcon kind={device.kind} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{device.name}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge tone={VENDOR_TONE[device.vendor]}>{device.vendor}</Badge>
            <span title={device.localRoute ? "Ruta local" : "Ruta cloud"}>
              {device.localRoute ? (
                <Radio size={12} className="text-status-ok" />
              ) : (
                <Cloud size={12} className="text-smoke" />
              )}
            </span>
            {device.matterCompliant && <Badge tone="sage">Matter</Badge>}
          </div>
        </div>
        {onOffCap && (
          <Switch
            checked={isOn}
            disabled={offline || !canControl}
            onChange={() => toggleDevice(device.id)}
            ariaLabel={`${isOn ? "Apagar" : "Encender"} ${device.name}`}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          "flex items-center gap-1.5",
          offline ? "text-status-critical" : "text-status-ok",
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            offline ? "bg-status-critical" : "bg-status-ok",
          )} />
          {offline ? "Offline" : "Online"}
        </span>
        {battery !== undefined && (
          <span className="text-ink-soft">🔋 {String(battery.value)}{battery.unit}</span>
        )}
        {dimCap && isOn && (
          <span className="text-ink-soft">{String(dimCap.value)}{dimCap.unit}</span>
        )}
      </div>
    </Card>
  );
}
