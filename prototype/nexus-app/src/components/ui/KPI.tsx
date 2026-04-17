import { Card } from "./Card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function KPI({
  label, value, hint, icon: Icon, tone = "neutral", footer,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "ok" | "warn" | "critical" | "gold";
  footer?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-ink-soft">{label}</div>
        {Icon && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            tone === "ok" && "bg-status-ok/15 text-status-ok",
            tone === "warn" && "bg-status-warn/15 text-status-warn",
            tone === "critical" && "bg-status-critical/15 text-status-critical",
            tone === "gold" && "bg-gold/15 text-gold-border",
            tone === "neutral" && "bg-sage/15 text-sage-border",
          )}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-soft">{hint}</div>}
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}
