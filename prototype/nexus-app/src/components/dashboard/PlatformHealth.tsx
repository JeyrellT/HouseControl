"use client";

import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { STATIC } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PlatformHealth() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Salud de plataformas</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-line">
          {STATIC.platforms.map((p) => {
            const tone: "ok" | "critical" = p.status === "online" ? "ok" : "critical";
            return (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  tone === "ok" && "bg-status-ok",
                  tone === "critical" && "bg-status-critical",
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium capitalize">{p.vendor}</div>
                  <div className="text-[11px] text-ink-soft">
                    {p.devicesDiscovered} dispositivos · {p.latencyMs}ms latencia
                    {p.quotaRemaining !== undefined && ` · cuota ${p.quotaRemaining}`}
                  </div>
                </div>
                <Badge tone={tone}>{p.status}</Badge>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
