"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import { Home, MapPin, Plug, Bell, Menu } from "lucide-react";
import { useNexus, selectNotificationsByPersona } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home",      label: "Inicio",   icon: Home,   badge: false },
  { href: "/rooms",     label: "Rooms",    icon: MapPin, badge: false },
  { href: "/devices",   label: "Devices",  icon: Plug,   badge: false },
  { href: "/alerts",    label: "Alertas",  icon: Bell,   badge: true  },
] as const;

const TAP = {
  scale: 0.9,
  transition: { type: "spring" as const, stiffness: 600, damping: 22 },
};

export function MobileTabBar() {
  const pathname = usePathname();
  const setNavOpen = useNexus((s) => s.setMobileNavOpen);
  const personaId = useNexus((s) => s.activePersonaId);
  const notifs = selectNotificationsByPersona(personaId);
  const active = notifs.filter((n) => n.status !== "resolved" && n.status !== "muted");
  const critical = active.filter((n) => n.severity === "critical").length;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 mobile-glass border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación inferior"
    >
      {/* Línea de acento superior muy fina (HD) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(212,168,75,0.55) 50%, transparent 100%)",
        }}
      />

      <LayoutGroup id="mobile-tabbar">
        <div className="grid grid-cols-5 px-1 pt-1.5">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;
            const showBadge = tab.badge && active.length > 0;
            const isCritical = tab.href === "/alerts" && critical > 0;

            return (
              <motion.div key={tab.href} whileTap={TAP} className="relative">
                <Link
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 py-2 px-1 mx-0.5 rounded-xl",
                    "transition-colors duration-200 select-none",
                    isActive ? "text-gold" : "text-ink-soft",
                  )}
                >
                  {/* Píldora animada con layoutId (se desliza entre tabs) */}
                  {isActive && (
                    <motion.span
                      layoutId="mobile-tab-pill"
                      className="absolute inset-x-1 inset-y-0.5 rounded-xl bg-gold/10 border border-gold/25"
                      transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.6 }}
                      aria-hidden
                    />
                  )}

                  {/* Halo HD */}
                  {isActive && <span aria-hidden className="tab-glow" />}

                  {/* Icono con micro-rebote */}
                  <motion.span
                    className="relative z-10 flex items-center justify-center"
                    animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: "spring", stiffness: 480, damping: 24 }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.25 : 1.9}
                      className={cn(
                        "transition-[filter] duration-300",
                        isActive && "drop-shadow-[0_1px_6px_rgba(212,168,75,0.45)]",
                        isCritical && "animate-pulse text-status-critical",
                      )}
                    />
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 18 }}
                        className={cn(
                          "absolute -top-1.5 -right-2.5 text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full",
                          "flex items-center justify-center font-semibold leading-none",
                          "ring-2 ring-[var(--surface-2)]",
                          critical > 0 ? "bg-status-critical" : "bg-status-warn",
                        )}
                      >
                        {active.length > 9 ? "9+" : active.length}
                      </motion.span>
                    )}
                  </motion.span>

                  {/* Label */}
                  <motion.span
                    className="relative z-10 text-[10.5px] font-medium tracking-[0.01em] leading-none"
                    animate={{ opacity: isActive ? 1 : 0.82 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab.label}
                  </motion.span>
                </Link>
              </motion.div>
            );
          })}

          {/* Botón "Más" */}
          <motion.div whileTap={TAP} className="relative">
            <button
              onClick={() => setNavOpen(true)}
              className="relative w-full flex flex-col items-center justify-center gap-1 py-2 px-1 mx-0.5 rounded-xl text-ink-soft transition-colors duration-200 hover:text-ink"
              aria-label="Abrir menú completo"
            >
              <motion.span
                className="relative z-10 flex items-center justify-center"
                whileHover={{ rotate: 8 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
              >
                <Menu size={22} strokeWidth={1.9} />
              </motion.span>
              <span className="relative z-10 text-[10.5px] font-medium tracking-[0.01em] leading-none">
                Más
              </span>
            </button>
          </motion.div>
        </div>
      </LayoutGroup>
    </nav>
  );
}
