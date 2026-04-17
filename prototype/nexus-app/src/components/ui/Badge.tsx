import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "critical" | "gold" | "sage";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium",
        tone === "neutral" && "bg-surface text-ink-soft border border-line",
        tone === "ok" && "bg-status-ok/15 text-status-ok",
        tone === "warn" && "bg-status-warn/15 text-status-warn",
        tone === "critical" && "bg-status-critical/15 text-status-critical",
        tone === "gold" && "bg-gold/15 text-gold-border",
        tone === "sage" && "bg-sage/15 text-sage-border",
        className,
      )}
    >
      {children}
    </span>
  );
}
