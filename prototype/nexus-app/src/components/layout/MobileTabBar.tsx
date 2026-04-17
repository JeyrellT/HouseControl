"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Plug, Bell, Menu } from "lucide-react";
import { useNexus, selectNotificationsByPersona } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Inicio",   icon: Home,   badge: false },
  { href: "/rooms",     label: "Rooms",    icon: MapPin, badge: false },
  { href: "/devices",   label: "Devices",  icon: Plug,   badge: false },
  { href: "/alerts",    label: "Alertas",  icon: Bell,   badge: true  },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const setNavOpen = useNexus((s) => s.setMobileNavOpen);
  const personaId = useNexus((s) => s.activePersonaId);
  const notifs = selectNotificationsByPersona(personaId);
  const active = notifs.filter((n) => n.status !== "resolved" && n.status !== "muted");
  const critical = active.filter((n) => n.severity === "critical").length;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-2/95 backdrop-blur border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación inferior"
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          const showBadge = tab.badge && active.length > 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 text-[10px] transition",
                isActive ? "text-gold" : "text-ink-soft hover:text-ink",
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b bg-gold" />
              )}
              <div className="relative">
                <Icon size={20} className={cn(critical > 0 && tab.href === "/alerts" && "animate-pulse text-status-critical")} />
                {showBadge && (
                  <span className={cn(
                    "absolute -top-1 -right-2 text-white text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-medium",
                    critical > 0 ? "bg-status-critical" : "bg-status-warn",
                  )}>
                    {active.length > 9 ? "9+" : active.length}
                  </span>
                )}
              </div>
              <span className="font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setNavOpen(true)}
          className="flex flex-col items-center gap-0.5 py-2 text-[10px] text-ink-soft hover:text-ink transition"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
          <span className="font-medium leading-none">Más</span>
        </button>
      </div>
    </nav>
  );
}
