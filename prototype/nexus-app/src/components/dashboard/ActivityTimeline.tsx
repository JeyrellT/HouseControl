"use client";

import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useNexus, selectActivityByPersona } from "@/lib/store";
import { Clock, User, Cpu, GitBranch, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTOR_ICON = {
  user: User,
  system: Cpu,
  rule: GitBranch,
  voice: Mic,
} as const;

export function ActivityTimeline({ limit = 10 }: { limit?: number }) {
  const personaId = useNexus((s) => s.activePersonaId);
  const all = useNexus((s) => s.activity);
  const items = selectActivityByPersona(personaId, all).slice(0, limit);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Actividad reciente</CardTitle>
        <Clock size={16} className="text-ink-soft" />
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-line">
          {items.length === 0 && (
            <div className="px-5 py-10 text-sm text-ink-soft text-center">Sin actividad reciente.</div>
          )}
          {items.map((a) => {
            const Icon = ACTOR_ICON[a.actor as keyof typeof ACTOR_ICON] ?? Cpu;
            return (
              <div key={a.id} className="px-5 py-3 flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  a.severity === "critical" && "bg-status-critical/15 text-status-critical",
                  a.severity === "warn" && "bg-status-warn/15 text-status-warn",
                  a.severity === "info" && "bg-sage/15 text-sage-border",
                )}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{a.summary}</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-soft">
                    <Badge tone="neutral">{a.actor}</Badge>
                    <span>{new Date(a.ts).toLocaleString("es-CR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</span>
                    <span>· {a.source}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
