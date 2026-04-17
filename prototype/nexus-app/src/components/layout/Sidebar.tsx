"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Layers, Mic, GitBranch, ScrollText, Settings,
  ChevronLeft, ChevronRight, MapPin, Activity, Plug, Sparkles, BarChart3, Bell,
} from "lucide-react";
import { useNexus } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/rooms", label: "Habitaciones", icon: MapPin },
  { href: "/devices", label: "Dispositivos", icon: Plug },
  { href: "/scenes", label: "Escenas", icon: Sparkles },
  { href: "/voice", label: "Voz e IA", icon: Mic },
  { href: "/rules", label: "Reglas", icon: GitBranch },
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/health", label: "Salud", icon: Activity },
  { href: "/energy", label: "Energía", icon: BarChart3 },
  { href: "/audit", label: "Auditoría", icon: ScrollText },
  { href: "/integrations", label: "Integraciones", icon: Layers },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useNexus((s) => s.sidebarCollapsed);
  const toggle = useNexus((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-surface-2 border-r border-line z-40 transition-all duration-300 flex flex-col",
        "hidden md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-line">
        {!collapsed && (
          <Link href="/dashboard" className="font-display text-xl text-navy dark:text-cream">
            Nexus<span className="text-gold">.</span>
          </Link>
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg hover:bg-surface text-ink-soft hover:text-ink transition"
          aria-label="Colapsar menú"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-sage/20 text-navy dark:text-sage font-medium"
                  : "text-ink-soft hover:bg-surface hover:text-ink",
                collapsed && "justify-center",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="p-3 text-[10px] text-ink-soft/60 border-t border-line">
          Intelligent Nexus · v0.1.0
        </div>
      )}
    </aside>
  );
}
