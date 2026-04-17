"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import {
  Bell, Moon, Sun, Eye, EyeOff, ChevronDown, RotateCcw,
  Shield, Zap, Wrench, Wifi, Thermometer, Sparkles, UserPlus, Flame, Brain,
  Menu,
} from "lucide-react";
import { useNexus, STATIC, selectActivePersona, selectPrimaryUser, selectNotificationsByPersona } from "@/lib/store";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { PersonaId, NotificationCategory } from "@/lib/types";

const CATEGORY_ICON: Record<NotificationCategory, typeof Shield> = {
  security: Shield, energy: Zap, automation: Sparkles, maintenance: Wrench,
  network: Wifi, climate: Thermometer, ai: Brain, guest: UserPlus, safety: Flame,
};
const CATEGORY_COLOR: Record<NotificationCategory, string> = {
  security: "#D9534F", energy: "#D4A84B", automation: "#A8C090", maintenance: "#8B95A8",
  network: "#0EA5E9", climate: "#14B8A6", ai: "#A855F7", guest: "#EC4899", safety: "#F97316",
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const personaId = useNexus((s) => s.activePersonaId);
  const setPersona = useNexus((s) => s.setActivePersona);
  const presentation = useNexus((s) => s.presentationMode);
  const togglePresentation = useNexus((s) => s.togglePresentation);
  const role = useNexus((s) => s.activeRole);
  const setRole = useNexus((s) => s.setRole);
  const reset = useNexus((s) => s.resetDemo);
  const setMobileNavOpen = useNexus((s) => s.setMobileNavOpen);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const persona = selectActivePersona(personaId);
  const user = selectPrimaryUser(personaId);
  const allNotifs = selectNotificationsByPersona(personaId);
  const notifications = allNotifs.filter((n) => n.status !== "resolved" && n.status !== "muted");
  const criticalCount = notifications.filter((n) => n.severity === "critical").length;

  const [siteOpen, setSiteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header
      className="h-16 border-b border-line bg-surface px-3 md:px-6 flex items-center gap-2 md:gap-3 sticky top-0 z-30 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileNavOpen(true)}
        className="md:hidden p-2 -ml-1 rounded-lg hover:bg-surface-2 text-ink-soft transition"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Site selector */}
      <div className="relative">
        <button
          onClick={() => setSiteOpen((o) => !o)}
          className="flex items-center gap-2 px-2.5 md:px-3 py-2 rounded-lg bg-surface-2 hover:bg-line transition border border-line max-w-[52vw] md:max-w-none"
        >
          <span className="w-2 h-2 rounded-full bg-status-ok flex-shrink-0" />
          <span className="font-medium text-sm truncate">{persona.name}</span>
          <span className="text-xs text-ink-soft hidden sm:inline">· {persona.location}</span>
          <ChevronDown size={14} className="text-ink-soft flex-shrink-0" />
        </button>
        {siteOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setSiteOpen(false)} />
            <div className="absolute top-12 left-0 w-[min(18rem,calc(100vw-1.5rem))] bg-surface-2 border border-line rounded-xl shadow-elev z-40 p-2">
              {STATIC.personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPersona(p.id as PersonaId);
                    setSiteOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg hover:bg-surface flex flex-col gap-0.5",
                    p.id === personaId && "bg-sage/15",
                  )}
                >
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className="text-xs text-ink-soft">{p.location} · {p.type}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Role switcher (dev-only) */}
      <select
        data-devonly
        value={role}
        onChange={(e) => setRole(e.target.value as typeof role)}
        className="hidden md:block text-xs px-2 py-1.5 rounded-lg border border-line bg-surface-2 text-ink-soft"
        title="Cambiar rol (dev)"
      >
        <option value="owner">Owner</option>
        <option value="admin">Admin</option>
        <option value="technician">Technician</option>
        <option value="viewer">Viewer</option>
      </select>

      {/* Reset demo */}
      <button
        data-devonly
        onClick={reset}
        className="hidden md:flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border border-line text-ink-soft hover:bg-surface-2"
        title="Reset demo"
      >
        <RotateCcw size={14} /> Reset
      </button>

      {/* Presentation mode */}
      <button
        onClick={togglePresentation}
        className={cn(
          "p-2 rounded-lg transition",
          presentation ? "bg-gold/20 text-gold-border" : "hover:bg-surface-2 text-ink-soft",
        )}
        title="Modo presentación"
        aria-label="Modo presentación"
      >
        {presentation ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>

      {/* Theme toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-surface-2 text-ink-soft transition"
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="p-2 rounded-lg hover:bg-surface-2 text-ink-soft transition relative"
          aria-label="Notificaciones"
        >
          <Bell size={18} className={cn(criticalCount > 0 && "animate-pulse text-status-critical")} />
          {notifications.length > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-medium",
              criticalCount > 0 ? "bg-status-critical" : "bg-status-warn",
            )}>
              {notifications.length}
            </span>
          )}
        </button>
        {notifOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
            <div className="absolute top-12 right-0 w-[min(24rem,calc(100vw-1.5rem))] bg-surface-2 border border-line rounded-xl shadow-elev z-40 max-h-[28rem] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Alertas activas</div>
                  <div className="text-[11px] text-ink-soft">
                    {notifications.length} total · {criticalCount} críticas
                  </div>
                </div>
                <Link
                  href="/alerts"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs px-2.5 py-1 rounded-md bg-navy text-cream hover:opacity-90"
                >
                  Ver todas
                </Link>
              </div>
              <div className="flex-1 overflow-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-sm text-ink-soft text-center">Sin alertas activas. Todo tranquilo. 🌙</div>
                ) : notifications.slice(0, 8).map((n) => {
                  const Icon = CATEGORY_ICON[n.category];
                  const color = CATEGORY_COLOR[n.category];
                  return (
                    <Link
                      key={n.id}
                      href="/alerts"
                      onClick={() => setNotifOpen(false)}
                      className="px-3 py-2.5 hover:bg-surface flex gap-3 border-b border-line/50 last:border-b-0"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}1A`, color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            n.severity === "critical" && "bg-status-critical",
                            n.severity === "warn" && "bg-status-warn",
                            n.severity === "info" && "bg-status-ok",
                          )} />
                          <div className="text-sm font-medium truncate">{n.title}</div>
                        </div>
                        <div className="text-xs text-ink-soft line-clamp-2 mt-0.5">{n.body}</div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-ink-soft">
                          <span className="uppercase tracking-wide" style={{ color }}>{n.category}</span>
                          <span>·</span>
                          <span>{relativeTime(n.ts)}</span>
                          {n.estimatedImpactCRC !== undefined && n.estimatedImpactCRC !== 0 && (
                            <>
                              <span>·</span>
                              <span className={n.estimatedImpactCRC < 0 ? "text-status-ok" : "text-status-warn"}>
                                {n.estimatedImpactCRC < 0 ? "−" : "+"}₡{Math.abs(n.estimatedImpactCRC).toLocaleString("es-CR")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User avatar */}
      <div
        className="w-9 h-9 rounded-full bg-navy text-cream flex items-center justify-center text-sm font-medium"
        title={user?.name}
      >
        {user?.initials ?? "??"}
      </div>
    </header>
  );
}
